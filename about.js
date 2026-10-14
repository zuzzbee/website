/* =====================================================================
   YOU DON'T NEED TO EDIT THIS FILE.
   To change your About page: log in (login.html), come back to this
   page, and click "Edit this page".
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

  var canvas = $("aboutBlocks");
  if (!canvas) return;

  var MAX_BLOCKS = 30;

  /* =================================================================
     BLOCK TYPES
     Each type says what it is called, what you can edit, and what a
     brand-new one starts with.
     ================================================================= */

  var TITLE_FIELD = { key: "title", label: "Window title", kind: "text", max: 40 };

  var TYPES = {
    profile: {
      label: "Profile card", icon: "🙂", defTitle: "profile.exe",
      fields: [
        TITLE_FIELD,
        { key: "photo", label: "Profile photo", kind: "photo" },
        { key: "name", label: "Name", kind: "text", max: 50 },
        { key: "tagline", label: "Tagline", kind: "text", max: 120 },
        { key: "details", label: "Details (location, pronouns, status...)", kind: "rows", max: 8,
          cols: [{ key: "label", ph: "Label", max: 30 }, { key: "value", ph: "Value", max: 80 }] }
      ],
      defaults: function () {
        return { title: "profile.exe", photo: null, name: S.footerName || "zuzz", tagline: "welcome to my page!",
                 details: [{ label: "Location", value: "somewhere on the internet" }] };
      }
    },
    text: {
      label: "Text", icon: "📝", defTitle: "readme.txt",
      fields: [
        TITLE_FIELD,
        { key: "heading", label: "Heading", kind: "text", max: 80 },
        { key: "body", label: "Text", kind: "textarea", max: 2000, hint: "Leave a blank line between paragraphs." }
      ],
      defaults: function () { return { title: "readme.txt", heading: "about me", body: "write something about yourself here!" }; }
    },
    photo: {
      label: "Photo", icon: "🖼️", defTitle: "photo.jpg",
      fields: [
        TITLE_FIELD,
        { key: "photo", label: "Photo", kind: "photo" },
        { key: "caption", label: "Caption", kind: "text", max: 120 }
      ],
      defaults: function () { return { title: "photo.jpg", photo: null, caption: "" }; }
    },
    contact: {
      label: "Contact info", icon: "📬", defTitle: "contact.exe",
      fields: [
        TITLE_FIELD,
        { key: "intro", label: "Intro line", kind: "text", max: 160 },
        { key: "items", label: "Ways to reach you", kind: "rows", max: 12,
          cols: [{ key: "label", ph: "Email, Discord...", max: 30 }, { key: "value", ph: "What to show", max: 100 }, { key: "url", ph: "Link (optional)", max: 300 }],
          hint: "Emails turn into links automatically. Leave the link blank for plain text like a Discord name." }
      ],
      defaults: function () { return { title: "contact.exe", intro: "get in touch:", items: [{ label: "Email", value: "", url: "" }] }; }
    },
    facts: {
      label: "Quick facts", icon: "📊", defTitle: "stats.txt",
      fields: [
        TITLE_FIELD,
        { key: "items", label: "Facts", kind: "rows", max: 20,
          cols: [{ key: "label", ph: "Label", max: 30 }, { key: "value", ph: "Value", max: 100 }] }
      ],
      defaults: function () { return { title: "stats.txt", items: [{ label: "Likes", value: "" }, { label: "Dislikes", value: "" }] }; }
    },
    list: {
      label: "List", icon: "⭐", defTitle: "favorites.txt",
      fields: [
        TITLE_FIELD,
        { key: "heading", label: "Heading", kind: "text", max: 80 },
        { key: "items", label: "Items", kind: "rows", max: 20, cols: [{ key: "text", ph: "Item", max: 120 }] }
      ],
      defaults: function () { return { title: "favorites.txt", heading: "my favorite things", items: [{ text: "" }] }; }
    },
    badges: {
      label: "Badges", icon: "🏷️", defTitle: "badges.dll",
      fields: [
        TITLE_FIELD,
        { key: "items", label: "Badges", kind: "rows", max: 12,
          cols: [{ key: "text", ph: "BADGE TEXT", max: 30 }, { key: "yellow", kind: "check", label: "yellow" }] }
      ],
      defaults: function () { return { title: "badges.dll", items: [{ text: "MADE WITH LOVE", yellow: true }] }; }
    },
    note: {
      label: "Sticky note", icon: "📌",
      fields: [{ key: "text", label: "Note", kind: "textarea", max: 400 }],
      defaults: function () { return { text: "remember to smile!" }; }
    },
    marquee: {
      label: "Scrolling text", icon: "📣",
      fields: [{ key: "text", label: "Text that scrolls across", kind: "text", max: 200 }],
      defaults: function () { return { text: "*** welcome to my page! ***" }; }
    },
    divider: {
      label: "Rainbow line", icon: "🌈",
      fields: [],
      defaults: function () { return {}; }
    }
  };
  var ORDER = ["profile", "text", "photo", "contact", "facts", "list", "badges", "note", "marquee", "divider"];

  function starterBlocks() {
    return [
      { id: newId(), type: "profile", data: TYPES.profile.defaults() },
      { id: newId(), type: "text", data: { title: "readme.txt", heading: "about me", body: "this page is still being built. check back soon!" } }
    ];
  }

  /* =================================================================
     HELPERS
     ================================================================= */

  function newId() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  function safeHttp(u) {
    try {
      var x = new URL(String(u || "").trim());
      return (x.protocol === "http:" || x.protocol === "https:") ? x.href : "";
    } catch (e) { return ""; }
  }

  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // Work out what a contact row should link to. Only safe kinds of links are allowed.
  function contactHref(item) {
    var u = String(item.url || "").trim();
    var v = String(item.value || "").trim();
    if (!u) return EMAIL.test(v) ? "mailto:" + v : "";
    if (/^(mailto:|tel:)/i.test(u)) return u;
    if (EMAIL.test(u)) return "mailto:" + u;
    if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return safeHttp(u);   // any other kind of link: only http(s) passes
    return safeHttp("https://" + u);
  }

  function clip(v, max, multiline) {
    var s = String(v == null ? "" : v).replace(/\r/g, "");
    if (!multiline) s = s.replace(/\s+/g, " ");
    return s.trim().slice(0, max || 200);
  }
  function rowsOf(arr) { return Array.isArray(arr) ? arr.filter(function (r) { return r && typeof r === "object"; }) : []; }

  /* Tidy up blocks before saving or showing: only known types, only known
     fields, trimmed and length-limited, empty rows dropped. */
  function cleanPhoto(p) {
    if (p && p.kind === "upload" && /^[a-z0-9]{6,40}$/i.test(String(p.id))) return { kind: "upload", id: String(p.id) };
    if (p && p.kind === "url" && safeHttp(p.url)) return { kind: "url", url: safeHttp(p.url).slice(0, 500) };
    return null;
  }
  function cleanRows(rows, f) {
    return rowsOf(rows).slice(0, f.max || 20).map(function (r) {
      var o = {};
      f.cols.forEach(function (c) { o[c.key] = c.kind === "check" ? !!r[c.key] : clip(r[c.key], c.max || 100); });
      return o;
    }).filter(function (o) {
      return f.cols.some(function (c) { return c.kind !== "check" && o[c.key]; });
    });
  }
  function cleanBlocks(list) {
    if (!Array.isArray(list)) return [];
    return list.slice(0, MAX_BLOCKS).map(function (b) {
      if (!b || !TYPES[b.type]) return null;
      var d = b.data || {};
      var out = {};
      TYPES[b.type].fields.forEach(function (f) {
        if (f.kind === "text") out[f.key] = clip(d[f.key], f.max);
        else if (f.kind === "textarea") out[f.key] = clip(d[f.key], f.max, true);
        else if (f.kind === "photo") out[f.key] = cleanPhoto(d[f.key]);
        else if (f.kind === "rows") out[f.key] = cleanRows(d[f.key], f);
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
     STORAGE (Firebase when set up, otherwise just the starter page)
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
          return fs.getDoc(fs.doc(x.db, "pages", "about")).then(function (snap) {
            return snap.exists() ? (snap.data().blocks || []) : null;
          });
        },
        savePage: function (list) {
          return fs.setDoc(fs.doc(x.db, "pages", "about"), { blocks: list, updatedAt: fs.serverTimestamp() });
        },
        getImage: function (id) {
          return fs.getDoc(fs.doc(x.db, "aboutImages", id)).then(function (snap) {
            return snap.exists() ? snap.data().data : "";
          });
        },
        putImage: function (id, data) {
          return fs.setDoc(fs.doc(x.db, "aboutImages", id), { data: data, createdAt: fs.serverTimestamp() });
        },
        delImage: function (id) { return fs.deleteDoc(fs.doc(x.db, "aboutImages", id)); },
        onAuth: function (cb) { x.au.onAuthStateChanged(x.auth, cb); }
      };
    });
  }

  var store = null;

  /* =================================================================
     PHOTOS
     ================================================================= */

  var pending = {};        // photos chosen but not saved yet (id -> data address)
  var imgCache = {};       // photos already loaded (id -> data address)
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

  // Shrink a chosen picture so it is small enough to keep in the database.
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
        var scale = Math.min(1, 720 / Math.max(w, h));
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

  function factsEl(rows) {
    var wrap = el("div", "ab-facts-wrap in");
    var dl = el("dl", "ab-facts");
    rows.forEach(function (r) {
      var label = r.label || r.text || "";
      dl.appendChild(el("dt", "", label));
      dl.appendChild(el("dd", "", r.value || ""));
    });
    wrap.appendChild(dl);
    return wrap;
  }

  function emptyHint() {
    return editing ? el("p", "ab-empty-note", "(nothing here yet. click \"edit\" to fill this in.)") : el("span");
  }

  var VIEW = {
    profile: function (d) {
      var box = el("div", "profile");
      box.appendChild(photoEl(d.photo, d.name, "ab-photo in"));
      var info = el("div", "profile-info");
      if (d.name) info.appendChild(el("h2", "profile-name", d.name));
      if (d.tagline) info.appendChild(el("p", "profile-tagline", d.tagline));
      var details = rowsOf(d.details).filter(function (r) { return r.label || r.value; });
      if (details.length) info.appendChild(factsEl(details));
      box.appendChild(info);
      return box;
    },
    text: function (d) {
      var box = el("div", "ab-text");
      if (d.heading) box.appendChild(el("h2", "", d.heading));
      String(d.body || "").split(/\n{2,}/).forEach(function (para) {
        if (para.trim()) box.appendChild(el("p", "", para.trim()));
      });
      if (!box.firstChild) box.appendChild(emptyHint());
      return box;
    },
    photo: function (d) {
      var box = el("div", "ab-bigphoto");
      box.appendChild(photoEl(d.photo, d.caption, "ab-photo in"));
      if (d.caption) box.appendChild(el("p", "ab-caption", d.caption));
      return box;
    },
    contact: function (d) {
      var box = el("div");
      if (d.intro) box.appendChild(el("p", "ab-contact-intro", d.intro));
      var rows = rowsOf(d.items).filter(function (r) { return r.value; });
      if (!rows.length) { box.appendChild(emptyHint()); return box; }
      var ul = el("ul", "ab-contact");
      rows.forEach(function (r) {
        var li = el("li");
        if (r.label) li.appendChild(el("b", "", r.label + ":"));
        var href = contactHref(r);
        if (href) {
          var a = el("a", "", r.value);
          a.href = href;
          if (/^https?:/i.test(href)) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
          li.appendChild(a);
        } else {
          li.appendChild(document.createTextNode(r.value));
        }
        ul.appendChild(li);
      });
      box.appendChild(ul);
      return box;
    },
    facts: function (d) {
      var rows = rowsOf(d.items).filter(function (r) { return r.label || r.value; });
      return rows.length ? factsEl(rows) : emptyHint();
    },
    list: function (d) {
      var box = el("div", "ab-list");
      if (d.heading) box.appendChild(el("h3", "", d.heading));
      var items = rowsOf(d.items).filter(function (r) { return r.text; });
      if (!items.length) { box.appendChild(emptyHint()); return box; }
      var ul = el("ul");
      items.forEach(function (r) { ul.appendChild(el("li", "", r.text)); });
      box.appendChild(ul);
      return box;
    },
    badges: function (d) {
      var box = el("div", "badges");
      rowsOf(d.items).filter(function (r) { return r.text; }).forEach(function (r) {
        box.appendChild(el("span", r.yellow ? "badge y" : "badge", r.text));
      });
      if (!box.firstChild) box.appendChild(emptyHint());
      return box;
    }
  };

  function renderBlock(b) {
    var T = TYPES[b.type];
    var d = b.data || {};
    if (b.type === "note") return el("div", "ab-note", d.text || "");
    if (b.type === "marquee") {
      var tick = el("div", "ticker in ab-marquee");
      tick.appendChild(el("span", "", d.text || ""));
      return tick;
    }
    if (b.type === "divider") return el("hr", "ab-rainbow");
    return winEl(T.icon, d.title || T.defTitle, VIEW[b.type](d));
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
  var loadErrorCode = "";

  var toolbar = $("aboutToolbar");
  var stateEl = $("aboutState");
  var btnEdit = $("btnEdit"), btnSave = $("btnSave"), btnDiscard = $("btnDiscard"), btnDone = $("btnDone"), btnReset = $("btnReset");
  var editActions = $("editActions");
  var palette = $("aboutPalette");

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
      canvas.appendChild(el("p", "ab-empty", editing ? "this page is empty. drag a block here from the toolbox!" : "nothing here yet."));
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

    var handle = btn("mini-btn ab-handle", "⠿ drag", "Drag to move this block");
    handle.title = "drag to move";
    handle.addEventListener("pointerdown", function (ev) {
      beginPointer(ev, { kind: "move", id: b.id, label: T.icon + " " + T.label });
    });
    bar.appendChild(handle);
    bar.appendChild(el("span", "ab-kind", T.icon + " " + T.label));

    var up = btn("mini-btn", "▲", "Move up");
    up.disabled = i === 0;
    up.addEventListener("click", function () { moveBlock(i, i - 1); });
    var down = btn("mini-btn", "▼", "Move down");
    down.disabled = i === blocks.length - 1;
    down.addEventListener("click", function () { moveBlock(i, i + 1); });
    bar.appendChild(up);
    bar.appendChild(down);

    if (T.fields.length) {
      var edit = btn("mini-btn", editingId === b.id ? "close" : "edit", (editingId === b.id ? "Close editor for " : "Edit ") + T.label);
      edit.addEventListener("click", function () {
        editingId = editingId === b.id ? null : b.id;
        renderCanvas();
      });
      bar.appendChild(edit);
    }
    var del = btn("mini-btn", "delete", "Delete this " + T.label + " block");
    del.addEventListener("click", function () {
      if (!window.confirm("Delete this block?")) return;
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
    if (blocks.length >= MAX_BLOCKS) { say("that's the most blocks a page can have (" + MAX_BLOCKS + ").", "dirty"); return; }
    var nb = { id: newId(), type: type, data: TYPES[type].defaults() };
    if (index == null || index > blocks.length) index = blocks.length;
    blocks.splice(index, 0, nb);
    editingId = TYPES[type].fields.length ? nb.id : null;
    renderCanvas();
    var node = canvas.querySelector('[data-id="' + nb.id + '"]');
    if (node && node.scrollIntoView) node.scrollIntoView({ block: "center" });
  }

  /* =================================================================
     THE EDITOR FORM FOR ONE BLOCK
     ================================================================= */

  function editorWindow(b) {
    var T = TYPES[b.type];
    var form = el("div", "ab-editor gb-form");
    T.fields.forEach(function (f) { form.appendChild(fieldEl(b, f)); });
    var actions = el("div", "ab-editor-actions");
    var done = btn("btn", "✔ Done with this block");
    done.addEventListener("click", function () { editingId = null; renderCanvas(); });
    actions.appendChild(done);
    form.appendChild(actions);
    return winEl(T.icon, "Editing: " + T.label, form);
  }

  function fieldEl(b, f) {
    var wrap = el("div", "ab-field");
    var id = "f-" + b.id + "-" + f.key;
    var label = el("label", "ab-label", f.label);
    label.htmlFor = id;
    wrap.appendChild(label);

    if (f.kind === "text" || f.kind === "textarea") {
      var input = f.kind === "text" ? el("input") : el("textarea");
      if (f.kind === "text") input.type = "text"; else input.rows = 6;
      input.id = id;
      input.maxLength = f.max || 200;
      input.value = b.data[f.key] || "";
      input.addEventListener("input", function () { b.data[f.key] = input.value; changed(); });
      wrap.appendChild(input);
    } else if (f.kind === "photo") {
      label.removeAttribute("for");
      wrap.appendChild(photoField(b, f));
    } else if (f.kind === "rows") {
      label.removeAttribute("for");
      wrap.appendChild(rowsField(b, f));
    }
    if (f.hint) wrap.appendChild(el("p", "hint", f.hint));
    return wrap;
  }

  function rowsField(b, f) {
    var wrap = el("div");
    var list = el("div", "ab-rowlist");
    var add = btn("mini-btn", "+ add another");
    function arr() {
      if (!Array.isArray(b.data[f.key])) b.data[f.key] = [];
      return b.data[f.key];
    }
    function draw() {
      list.textContent = "";
      arr().forEach(function (row, idx) {
        var r = el("div", "ab-row");
        f.cols.forEach(function (c) {
          var inp = el("input");
          if (c.kind === "check") {
            inp.type = "checkbox";
            inp.checked = !!row[c.key];
            inp.addEventListener("change", function () { row[c.key] = inp.checked; changed(); });
            var lab = el("label", "ab-check");
            lab.appendChild(inp);
            lab.appendChild(document.createTextNode(" " + (c.label || "")));
            r.appendChild(lab);
          } else {
            inp.type = "text";
            inp.value = row[c.key] || "";
            inp.placeholder = c.ph || "";
            inp.maxLength = c.max || 100;
            inp.setAttribute("aria-label", (c.ph || c.key) + ", row " + (idx + 1));
            inp.addEventListener("input", function () { row[c.key] = inp.value; changed(); });
            r.appendChild(inp);
          }
        });
        var rm = btn("mini-btn", "✕", "Remove row " + (idx + 1));
        rm.addEventListener("click", function () { arr().splice(idx, 1); changed(); draw(); });
        r.appendChild(rm);
        list.appendChild(r);
      });
      add.hidden = arr().length >= (f.max || 20);
    }
    add.addEventListener("click", function () {
      var row = {};
      f.cols.forEach(function (c) { row[c.key] = c.kind === "check" ? false : ""; });
      arr().push(row);
      changed();
      draw();
      var inputs = list.querySelectorAll('input[type="text"]');
      var firstOfLast = list.lastChild ? list.lastChild.querySelector('input[type="text"]') : null;
      if (firstOfLast) firstOfLast.focus();
      else if (inputs.length) inputs[inputs.length - 1].focus();
    });
    draw();
    wrap.appendChild(list);
    wrap.appendChild(add);
    return wrap;
  }

  function photoField(b, f) {
    var wrap = el("div", "ab-photo-field");
    var preview = el("div");
    var msg = el("p", "ab-photo-msg");
    msg.setAttribute("role", "status");

    var row = el("div", "row");
    var file = el("input");
    file.type = "file";
    file.accept = "image/*";
    file.setAttribute("aria-label", "Upload a photo from your device");

    var urlRow = el("div", "row");
    var urlIn = el("input");
    urlIn.type = "text";
    urlIn.placeholder = "or paste a link to an image";
    urlIn.setAttribute("aria-label", "Link to an image");
    var useUrl = btn("mini-btn", "use link");
    var remove = btn("mini-btn", "remove photo");

    function forget(old) { if (old && old.kind === "upload" && pending[old.id]) delete pending[old.id]; }

    function refresh() {
      preview.textContent = "";
      var p = b.data[f.key];
      preview.appendChild(photoEl(p, "", "ab-thumb ab-photo in"));
      remove.hidden = !p;
    }

    file.addEventListener("change", function () {
      var chosen = file.files && file.files[0];
      if (!chosen) return;
      msg.textContent = "shrinking your photo...";
      resizeImage(chosen).then(function (data) {
        forget(b.data[f.key]);
        var id = newId();
        pending[id] = data;
        b.data[f.key] = { kind: "upload", id: id };
        msg.textContent = "photo added. it saves when you click Save.";
        changed();
        refresh();
      }).catch(function (err) {
        msg.textContent = err && err.message === "type" ? "that doesn't look like a picture file." : "couldn't use that photo. try a different one.";
      });
      file.value = "";
    });

    useUrl.addEventListener("click", function () {
      var raw = urlIn.value.trim();
      if (!raw) return;
      if (!/^[a-z][a-z0-9+.-]*:/i.test(raw)) raw = "https://" + raw;
      var u = safeHttp(raw);
      if (!u) { msg.textContent = "that link doesn't look right. it should start with http:// or https://"; return; }
      forget(b.data[f.key]);
      b.data[f.key] = { kind: "url", url: u };
      urlIn.value = "";
      msg.textContent = "using that image link.";
      changed();
      refresh();
    });

    remove.addEventListener("click", function () {
      forget(b.data[f.key]);
      b.data[f.key] = null;
      msg.textContent = "photo removed.";
      changed();
      refresh();
    });

    row.appendChild(file);
    urlRow.appendChild(urlIn);
    urlRow.appendChild(useUrl);
    urlRow.appendChild(remove);
    wrap.appendChild(preview);
    wrap.appendChild(row);
    wrap.appendChild(urlRow);
    wrap.appendChild(msg);
    refresh();
    return wrap;
  }

  /* =================================================================
     DRAG AND DROP  (works with mouse, finger and pen)
     Drag a block type from the toolbox, or drag a block's handle.
     ================================================================= */

  var drag = null;
  var suppressClick = false;

  function beginPointer(ev, info) {
    if (ev.button !== undefined && ev.button !== 0) return;
    if (drag) cleanupDrag();
    drag = { info: info, sx: ev.clientX, sy: ev.clientY, x: ev.clientX, y: ev.clientY, active: false, idx: -1, pid: ev.pointerId, ghost: null, line: null, timer: null };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onCancel);
  }

  function onMove(ev) {
    if (!drag || ev.pointerId !== drag.pid) return;
    drag.x = ev.clientX;
    drag.y = ev.clientY;
    if (!drag.active) {
      if (Math.abs(drag.x - drag.sx) + Math.abs(drag.y - drag.sy) < 6) return;
      activateDrag();
    }
    placeGhost();
    updateDrop();
  }

  function activateDrag() {
    drag.active = true;
    document.body.classList.add("is-dragging");
    drag.ghost = el("div", "drag-ghost", drag.info.label);
    document.body.appendChild(drag.ghost);
    drag.line = el("div", "drop-line");
    if (drag.info.kind === "move") {
      var src = canvas.querySelector('[data-id="' + drag.info.id + '"]');
      if (src) src.classList.add("is-dragging");
    }
    drag.timer = setInterval(autoScroll, 30);
  }

  function placeGhost() {
    drag.ghost.style.left = (drag.x + 14) + "px";
    drag.ghost.style.top = (drag.y + 14) + "px";
  }

  function blockEls() {
    var out = [];
    for (var i = 0; i < canvas.children.length; i++) {
      if (canvas.children[i].classList.contains("ab")) out.push(canvas.children[i]);
    }
    return out;
  }

  function updateDrop() {
    var r = canvas.getBoundingClientRect();
    var inside = drag.x > r.left - 40 && drag.x < r.right + 40 && drag.y > r.top - 40 && drag.y < r.bottom + 60;
    if (!inside) {
      if (drag.line.parentNode) drag.line.parentNode.removeChild(drag.line);
      drag.idx = -1;
      return;
    }
    var els = blockEls();
    var idx = els.length;
    for (var i = 0; i < els.length; i++) {
      var br = els[i].getBoundingClientRect();
      if (drag.y < br.top + br.height / 2) { idx = i; break; }
    }
    drag.idx = idx;
    canvas.insertBefore(drag.line, els[idx] || null);
  }

  function autoScroll() {
    if (!drag || !drag.active) return;
    var h = window.innerHeight;
    if (drag.y < 90) window.scrollBy(0, -Math.min(26, (90 - drag.y) / 3 + 4));
    else if (drag.y > h - 130) window.scrollBy(0, Math.min(26, (drag.y - (h - 130)) / 3 + 4));
    else return;
    updateDrop();
  }

  function onUp(ev) {
    if (!drag || ev.pointerId !== drag.pid) return;
    var d = drag;
    cleanupDrag();
    if (!d.active) return;               // it was just a tap: the click handler deals with it
    suppressClick = true;
    setTimeout(function () { suppressClick = false; }, 0);
    if (d.idx < 0) return;
    if (d.info.kind === "new") {
      addBlock(d.info.type, d.idx);
    } else {
      var from = -1;
      blocks.forEach(function (b, i) { if (b.id === d.info.id) from = i; });
      if (from < 0) return;
      var to = d.idx > from ? d.idx - 1 : d.idx;
      moveBlock(from, to);
    }
  }

  function onCancel(ev) {
    if (!drag || ev.pointerId !== drag.pid) return;
    cleanupDrag();
  }

  function cleanupDrag() {
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onUp);
    document.removeEventListener("pointercancel", onCancel);
    if (!drag) return;
    if (drag.timer) clearInterval(drag.timer);
    if (drag.ghost && drag.ghost.parentNode) drag.ghost.parentNode.removeChild(drag.ghost);
    if (drag.line && drag.line.parentNode) drag.line.parentNode.removeChild(drag.line);
    var dragging = canvas.querySelectorAll(".is-dragging");
    for (var i = 0; i < dragging.length; i++) dragging[i].classList.remove("is-dragging");
    document.body.classList.remove("is-dragging");
    drag = null;
  }

  /* ---------- the toolbox ---------- */

  (function buildPalette() {
    var box = $("paletteList");
    ORDER.forEach(function (type) {
      var T = TYPES[type];
      var b = btn("btn pal-item");
      var ico = el("span", "pal-ico", T.icon);
      ico.setAttribute("aria-hidden", "true");
      b.appendChild(ico);
      b.appendChild(el("span", "", T.label));
      b.setAttribute("aria-label", "Add a " + T.label + " block");
      b.addEventListener("pointerdown", function (ev) {
        beginPointer(ev, { kind: "new", type: type, label: T.icon + " " + T.label });
      });
      b.addEventListener("click", function () {
        if (suppressClick) return;
        addBlock(type, blocks.length);
      });
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
      var toDelete = usedAtLoad.filter(function (id) { return used.indexOf(id) < 0; });
      used.forEach(function (id) {
        if (pending[id]) { imgCache[id] = pending[id]; delete pending[id]; }
      });
      Object.keys(pending).forEach(function (id) { if (used.indexOf(id) < 0) delete pending[id]; });
      usedAtLoad = used.slice();
      blocks = clean;
      savedJson = JSON.stringify(blocks);
      renderCanvas();
      say("saved ✓");
      return Promise.all(toDelete.map(function (id) { return store.delImage(id).catch(function () {}); }));
    }).catch(function () {
      say("couldn't save. are you logged in as the admin?", "dirty");
      btnSave.disabled = false;
    });
  }

  function discard() {
    Object.keys(pending).forEach(function (id) { if (usedAtLoad.indexOf(id) < 0) delete pending[id]; });
    blocks = JSON.parse(savedJson);
    editingId = null;
    renderCanvas();
  }

  function setEditing(on) {
    editing = on;
    editingId = null;
    renderCanvas();
    if (!on) say("");
  }

  btnEdit.addEventListener("click", function () {
    if (loadFailed) return;
    setEditing(true);
  });
  btnSave.addEventListener("click", save);
  btnDiscard.addEventListener("click", function () {
    if (window.confirm("Throw away your unsaved changes?")) discard();
  });
  btnDone.addEventListener("click", function () {
    if (isDirty()) {
      if (!window.confirm("You have unsaved changes. Leave editing and lose them?")) return;
      discard();
    }
    setEditing(false);
  });
  btnReset.addEventListener("click", function () {
    if (!window.confirm("Start over with the plain starter page? (Nothing is saved until you click Save.)")) return;
    blocks = starterBlocks();
    editingId = null;
    renderCanvas();
  });

  window.addEventListener("beforeunload", function (ev) {
    if (editing && isDirty()) { ev.preventDefault(); ev.returnValue = ""; }
  });

  /* =================================================================
     START UP
     ================================================================= */

  // A plain-English reason for why your saved page couldn't be loaded.
  function loadProblem() {
    var code = loadErrorCode;
    var base = "editing is switched off to protect your saved page. ";
    if (code === "permission-denied") {
      return base + "Firebase said \"permission denied\": the About page rules probably haven't been added yet. In Firebase, open Firestore > Rules, add the \"pages\" and \"aboutImages\" blocks, click Publish, wait a minute, then refresh.";
    }
    if (code === "unavailable" || code === "failed-precondition" || code === "deadline-exceeded") {
      return base + "couldn't reach Firebase (" + code + "). check your connection, then refresh.";
    }
    return base + "couldn't load it" + (code ? " (error: " + code + ")" : "") + ". refresh and try again.";
  }

  function show(list) {
    blocks = list;
    savedJson = JSON.stringify(blocks);
    usedAtLoad = usedImageIds(blocks);
    renderCanvas();
  }

  var starting = FB && FB.configured ? makeFirebaseStore() : Promise.resolve(makeStaticStore());
  starting.then(function (s) {
    store = s;
    return s.loadPage().then(function (saved) {
      show(saved === null ? starterBlocks() : cleanBlocks(saved));
    }).catch(function (err) {
      // Couldn't read your saved page. Show the starter page to visitors,
      // but switch editing off so a blank page can never overwrite your real one.
      loadFailed = true;
      loadErrorCode = err && err.code ? String(err.code) : "";
      show(starterBlocks());
    }).then(function () {
      s.onAuth(function (user) {
        admin = !!user && s.live;
        if (!admin && editing) { editing = false; editingId = null; }
        $("aboutWho").textContent = admin ? "Logged in as " + (user.email || "admin") : "";
        renderCanvas();
        if (admin && loadFailed) {
          btnEdit.disabled = true;
          say(loadProblem(), "dirty");
        }
      });
    });
  }).catch(function () {
    canvas.textContent = "";
    canvas.appendChild(el("p", "ab-empty", "couldn't load this page right now. try refreshing in a minute."));
  });
})();
