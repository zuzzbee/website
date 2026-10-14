/* =====================================================================
   GALLERY PAGE - FULL IMPLEMENTATION
   Reuses about.js logic for photo management.
   ===================================================================== */

(function () {
  var FB = window.ZuzzFirebase;
  var S = window.SITE || {};
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function btn(cls, text, label) {
    var b = el("button", cls, text);
    b.type = "button";
    if (label) b.setAttribute("aria-label", label);
    return b;
  }

  var canvas = $("galleryBlocks");
  if (!canvas) return;

  var MAX_BLOCKS = 100;

  var TYPES = {
    photo: {
      label: "Photo", icon: "🖼️", defTitle: "photo.jpg",
      fields: [
        { key: "title", label: "Window title", kind: "text", max: 40 },
        { key: "photo", label: "Photo", kind: "photo" },
        { key: "caption", label: "Caption", kind: "text", max: 120 }
      ],
      defaults: function () { return { title: "photo.jpg", photo: null, caption: "" }; }
    }
  };
  var ORDER = ["photo"];

  function starterBlocks() {
    return [
      { id: newId(), type: "photo", data: TYPES.photo.defaults() }
    ];
  }

  /* =================================================================
     HELPERS
     ================================================================= */

  function newId() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }

  function safeHttp(u) {
    try {
      var x = new URL(String(u || "").trim());
      return (x.protocol === "http:" || x.protocol === "https:") ? x.href : "";
    } catch (e) { return ""; }
  }

  function clip(v, max, multiline) {
    var s = String(v == null ? "" : v).replace(/\r/g, "");
    if (!multiline) s = s.replace(/\s+/g, " ");
    return s.trim().slice(0, max || 200);
  }

  function cleanPhoto(p) {
    if (p && p.kind === "upload" && /^[a-z0-9]{6,40}$/i.test(String(p.id))) return { kind: "upload", id: String(p.id) };
    if (p && p.kind === "url" && safeHttp(p.url)) return { kind: "url", url: safeHttp(p.url).slice(0, 500) };
    return null;
  }

  function cleanBlocks(list) {
    if (!Array.isArray(list)) return [];
    return list.slice(0, MAX_BLOCKS).map(function (b) {
      if (!b || !TYPES[b.type]) return null;
      var d = b.data || {};
      var out = {};
      TYPES[b.type].fields.forEach(function (f) {
        if (f.kind === "text") out[f.key] = clip(d[f.key], f.max);
        else if (f.kind === "photo") out[f.key] = cleanPhoto(d[f.key]);
      });
      return { id: String(b.id || newId()).slice(0, 40), type: b.type, data: out };
    }).filter(Boolean);
  }

  function usedImageIds(list) {
    var ids = [];
    list.forEach(function (b) {
      TYPES[b.type].fields.forEach(function (f) {
        var p = f.kind === "photo" && b.data ? b.data[f.key] : null;
        if (p && p.kind === "upload" && ids.indexOf(p.id) < 0) ids.push(p.id);
      });
    });
    return ids;
  }

  /* =================================================================
     STORAGE
     ================================================================= */

  function makeStaticStore() {
    return {
      live: false,
      loadPage: function () { return Promise.resolve(null); },
      getImage: function () { return Promise.resolve(""); },
      onAuth: function () {}
    };
  }

  function makeFirebaseStore() {
    return FB.load().then(function (x) {
      var fs = x.fs;
      return {
        live: true,
        loadPage: function () {
          return fs.getDoc(fs.doc(x.db, "pages", "gallery")).then(function (snap) {
            return snap.exists() ? (snap.data().blocks || []) : null;
          });
        },
        savePage: function (list) {
          return fs.setDoc(fs.doc(x.db, "pages", "gallery"), { blocks: list, updatedAt: fs.serverTimestamp() });
        },
        getImage: function (id) {
          return fs.getDoc(fs.doc(x.db, "galleryImages", id)).then(function (snap) {
            return snap.exists() ? snap.data().data : "";
          });
        },
        putImage: function (id, data) {
          return fs.setDoc(fs.doc(x.db, "galleryImages", id), { data: data, createdAt: fs.serverTimestamp() });
        },
        delImage: function (id) { return fs.deleteDoc(fs.doc(x.db, "galleryImages", id)); },
        onAuth: function (cb) { x.au.onAuthStateChanged(x.auth, cb); }
      };
    });
  }

  var store = null;

  /* =================================================================
     PHOTOS
     ================================================================= */

  var pending = {};
  var imgCache = {};
  var imgPromises = {};

  function resolveImage(p) {
    if (!p) return Promise.resolve("");
    if (p.kind === "url") return Promise.resolve(safeHttp(p.url));
    if (p.kind !== "upload") return Promise.resolve("");
    if (pending[p.id]) return Promise.resolve(pending[p.id]);
    if (imgCache[p.id]) return Promise.resolve(imgCache[p.id]);
    if (!imgPromises[p.id]) {
      imgPromises[p.id] = store.getImage(p.id).then(function (d) {
        if (typeof d === "string" && /^data:image\/jpeg;base64,/.test(d)) imgCache[p.id] = d;
        return imgCache[p.id] || "";
      }).catch(function () { return ""; });
    }
    return imgPromises[p.id];
  }

  function placeholder(wrap) {
    wrap.textContent = "";
    var ph = el("div", "ab-ph", "📷");
    ph.setAttribute("aria-hidden", "true");
    wrap.appendChild(ph);
  }

  function photoEl(photo, alt, cls) {
    var wrap = el("div", cls || "ab-photo in");
    if (!photo) { placeholder(wrap); return wrap; }
    var img = el("img");
    img.alt = alt || "";
    img.loading = "lazy";
    img.referrerPolicy = "no-referrer";
    wrap.appendChild(img);
    resolveImage(photo).then(function (src) {
      if (src) { img.src = src; } else { placeholder(wrap); }
    });
    return wrap;
  }

  function resizeImage(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//.test(file.type)) return reject(new Error("type"));
      if (file.size > 25 * 1024 * 1024) return reject(new Error("size"));
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        var w = img.naturalWidth, h = img.naturalHeight;
        if (!w || !h) return reject(new Error("bad"));
        var scale = Math.min(1, 1024 / Math.max(w, h));
        var cw = Math.round(w * scale), ch = Math.round(h * scale);
        var c = document.createElement("canvas");
        c.width = cw; c.height = ch;
        var ctx = c.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, cw, ch);
        ctx.drawImage(img, 0, 0, cw, ch);
        var q = 0.85;
        var out = c.toDataURL("image/jpeg", q);
        while (out.length > 700000 && q > 0.4) { q -= 0.1; out = c.toDataURL("image/jpeg", q); }
        if (out.length > 800000) return reject(new Error("big"));
        resolve(out);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("bad")); };
      img.src = url;
    });
  }

  /* =================================================================
     SHOWING BLOCKS
     ================================================================= */

  function winEl(icon, title, body) {
    var sec = el("section", "window out");
    sec.setAttribute("aria-label", title);
    var tb = el("div", "titlebar");
    var i = el("span", "", icon);
    i.setAttribute("aria-hidden", "true");
    tb.appendChild(i);
    tb.appendChild(el("span", "name", title));
    var btns = el("span", "btns");
    btns.setAttribute("aria-hidden", "true");
    ["_", "□", "x"].forEach(function (c) { btns.appendChild(el("span", "", c)); });
    tb.appendChild(btns);
    var bd = el("div", "body");
    bd.appendChild(body);
    sec.appendChild(tb);
    sec.appendChild(bd);
    return sec;
  }

  function renderBlock(b) {
    var T = TYPES[b.type];
    var d = b.data || {};
    var box = el("div", "ab-bigphoto");
    box.appendChild(photoEl(d.photo, d.caption, "ab-photo in"));
    if (d.caption) box.appendChild(el("p", "ab-caption", d.caption));
    return winEl(T.icon, d.title || T.defTitle, box);
  }

  /* =================================================================
     PAGE STATE
     ================================================================= */

  var blocks = [];
  var savedJson = "[]";
  var usedAtLoad = [];
  var admin = false;
  var editing = false;
  var editingId = null;
  var loadFailed = false;

  var toolbar = $("galleryToolbar");
  var stateEl = $("galleryState");
  var btnEdit = $("btnEdit"), btnSave = $("btnSave"), btnDiscard = $("btnDiscard"), btnDone = $("btnDone"), btnReset = $("btnReset");
  var editActions = $("editActions");
  var palette = $("galleryPalette");

  function isDirty() { return JSON.stringify(blocks) !== savedJson; }

  function say(text, cls) {
    stateEl.textContent = text || "";
    stateEl.className = "about-state" + (cls ? " " + cls : "");
  }

  function updateToolbar() {
    toolbar.hidden = !admin;
    toolbar.classList.toggle("is-editing", editing);
    btnEdit.hidden = editing;
    editActions.hidden = !editing;
    palette.hidden = !(admin && editing);
    var dirty = isDirty();
    btnSave.disabled = !dirty;
    btnDiscard.disabled = !dirty;
    if (editing && !loadFailed) say(dirty ? "● you have unsaved changes" : "all changes saved", dirty ? "dirty" : "");
  }

  function changed() { updateToolbar(); }

  /* =================================================================
     DRAWING THE PAGE
     ================================================================= */

  function renderCanvas() {
    canvas.textContent = "";
    if (!blocks.length) {
      canvas.appendChild(el("p", "ab-empty", editing ? "the gallery is empty. drag a photo here!" : "nothing here yet."));
    }
    blocks.forEach(function (b, i) {
      var wrap = el("div", "ab");
      wrap.setAttribute("data-id", b.id);
      if (editing) wrap.appendChild(editBar(b, i));
      wrap.appendChild(editing && editingId === b.id ? editorWindow(b) : renderBlock(b));
      canvas.appendChild(wrap);
    });
    updateToolbar();
  }

  function editBar(b, i) {
    var T = TYPES[b.type];
    var bar = el("div", "ab-bar");

    var handle = btn("mini-btn ab-handle", "⠿ drag", "Drag to move");
    handle.addEventListener("pointerdown", function (ev) {
      beginPointer(ev, { kind: "move", id: b.id, label: T.icon + " " + T.label });
    });
    bar.appendChild(handle);

    var up = btn("mini-btn", "▲");
    up.disabled = i === 0;
    up.addEventListener("click", function () { moveBlock(i, i - 1); });
    var down = btn("mini-btn", "▼");
    down.disabled = i === blocks.length - 1;
    down.addEventListener("click", function () { moveBlock(i, i + 1); });
    bar.appendChild(up);
    bar.appendChild(down);

    var edit = btn("mini-btn", editingId === b.id ? "close" : "edit");
    edit.addEventListener("click", function () {
      editingId = editingId === b.id ? null : b.id;
      renderCanvas();
    });
    bar.appendChild(edit);

    var del = btn("mini-btn", "delete");
    del.addEventListener("click", function () {
      if (!window.confirm("Delete this photo?")) return;
      blocks.splice(i, 1);
      if (editingId === b.id) editingId = null;
      renderCanvas();
    });
    bar.appendChild(del);
    return bar;
  }

  function moveBlock(from, to) {
    if (to < 0 || to >= blocks.length || from === to) return;
    var item = blocks.splice(from, 1)[0];
    blocks.splice(to, 0, item);
    renderCanvas();
  }

  function addBlock(type, index) {
    if (blocks.length >= MAX_BLOCKS) { say("max limit reached.", "dirty"); return; }
    var nb = { id: newId(), type: type, data: TYPES[type].defaults() };
    if (index == null || index > blocks.length) index = blocks.length;
    blocks.splice(index, 0, nb);
    editingId = nb.id;
    renderCanvas();
    var node = canvas.querySelector('[data-id="' + nb.id + '"]');
    if (node && node.scrollIntoView) node.scrollIntoView({ block: "center" });
  }

  function editorWindow(b) {
    var T = TYPES[b.type];
    var form = el("div", "ab-editor gb-form");
    T.fields.forEach(function (f) {
      var wrap = el("div", "ab-field");
      var id = "f-" + b.id + "-" + f.key;
      var label = el("label", "ab-label", f.label);
      label.htmlFor = id;
      wrap.appendChild(label);

      if (f.kind === "text") {
        var input = el("input");
        input.type = "text";
        input.id = id;
        input.maxLength = f.max || 200;
        input.value = b.data[f.key] || "";
        input.addEventListener("input", function () { b.data[f.key] = input.value; changed(); });
        wrap.appendChild(input);
      } else if (f.kind === "photo") {
        wrap.appendChild(photoField(b, f));
      }
      form.appendChild(wrap);
    });
    var done = btn("btn", "✔ Done");
    done.addEventListener("click", function () { editingId = null; renderCanvas(); });
    form.appendChild(done);
    return winEl(T.icon, "Editing Photo", form);
  }

  function photoField(b, f) {
    var wrap = el("div", "ab-photo-field");
    var preview = el("div");
    var msg = el("p", "ab-photo-msg");
    var file = el("input");
    file.type = "file";
    file.accept = "image/*";

    function refresh() {
      preview.textContent = "";
      preview.appendChild(photoEl(b.data[f.key], "", "ab-thumb ab-photo in"));
    }

    file.addEventListener("change", function () {
      var chosen = file.files && file.files[0];
      if (!chosen) return;
      msg.textContent = "processing...";
      resizeImage(chosen).then(function (data) {
        var id = newId();
        pending[id] = data;
        b.data[f.key] = { kind: "upload", id: id };
        msg.textContent = "ready!";
        changed();
        refresh();
      }).catch(function () { msg.textContent = "error uploading."; });
    });

    wrap.appendChild(preview);
    wrap.appendChild(file);
    wrap.appendChild(msg);
    refresh();
    return wrap;
  }

  /* =================================================================
     DRAG AND DROP
     ================================================================= */

  var drag = null;
  function beginPointer(ev, info) {
    if (ev.button !== 0) return;
    drag = { info: info, pid: ev.pointerId, sx: ev.clientX, sy: ev.clientY, active: false };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }
  function onMove(ev) {
    if (!drag || ev.pointerId !== drag.pid) return;
    if (!drag.active && Math.abs(ev.clientX - drag.sx) > 5) {
      drag.active = true;
      document.body.classList.add("is-dragging");
    }
  }
  function onUp(ev) {
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onUp);
    document.body.classList.remove("is-dragging");
    drag = null;
  }

  /* ---------- palette ---------- */
  (function () {
    var box = $("paletteList");
    ORDER.forEach(function (type) {
      var T = TYPES[type];
      var b = btn("btn pal-item", T.icon + " add photo");
      b.addEventListener("click", function () { addBlock(type, blocks.length); });
      box.appendChild(b);
    });
  })();

  /* =================================================================
     SAVING
     ================================================================= */

  function save() {
    if (!store || !store.live || !isDirty()) return;
    var clean = cleanBlocks(blocks);
    var used = usedImageIds(clean);
    btnSave.disabled = true;
    say("saving...");

    Promise.all(used.filter(function (id) { return pending[id]; }).map(function (id) {
      return store.putImage(id, pending[id]);
    })).then(function () {
      return store.savePage(JSON.parse(JSON.stringify(clean)));
    }).then(function () {
      used.forEach(function (id) { if (pending[id]) { imgCache[id] = pending[id]; delete pending[id]; } });
      usedAtLoad = used.slice();
      blocks = clean;
      savedJson = JSON.stringify(blocks);
      renderCanvas();
      say("saved ✓");
    }).catch(function () { say("save failed.", "dirty"); btnSave.disabled = false; });
  }

  function setEditing(on) {
    editing = on;
    editingId = null;
    renderCanvas();
  }

  btnEdit.addEventListener("click", function () { setEditing(true); });
  btnSave.addEventListener("click", save);
  btnDiscard.addEventListener("click", function () { if (window.confirm("Discard changes?")) { blocks = JSON.parse(savedJson); renderCanvas(); } });
  btnDone.addEventListener("click", function () { setEditing(false); });
  btnReset.addEventListener("click", function () { if (window.confirm("Reset page?")) { blocks = starterBlocks(); renderCanvas(); } });

  /* =================================================================
     START UP
     ================================================================= */

  var starting = FB && FB.configured ? makeFirebaseStore() : Promise.resolve(makeStaticStore());
  starting.then(function (s) {
    store = s;
    s.loadPage().then(function (saved) {
      blocks = saved === null ? starterBlocks() : cleanBlocks(saved);
      savedJson = JSON.stringify(blocks);
      usedAtLoad = usedImageIds(blocks);
      renderCanvas();
    }).catch(function () { loadFailed = true; renderCanvas(); });

    s.onAuth(function (user) {
      admin = !!user && s.live;
      $("galleryWho").textContent = admin ? "Admin: " + user.email : "";
      renderCanvas();
    });
  });
})();
