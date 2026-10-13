/* =====================================================================
   YOU DON'T NEED TO EDIT THIS FILE.
   Link settings are in pages-config.js. To add links, log in first.
   ===================================================================== */

(function () {
  var L = (window.PAGES && window.PAGES.links) || {};
  var FB = window.ZuzzFirebase;
  function $(id) { return document.getElementById(id); }
  function el(tag, className, text) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  var listEl = $("linksList");
  if (!listEl) return;

  var defaultCat = L.defaultCategory || "Cool Sites";
  var links = [];
  var admin = false;
  var store = null;
  var loadedOnce = false;

  if (L.windowTitle) $("linksWindowTitle").textContent = L.windowTitle;
  $("linksIntro").textContent = L.intro || "";

  /* ---------- helpers ---------- */

  // Only ever allow http and https links.
  function safeUrl(u) {
    try {
      var x = new URL(u);
      return (x.protocol === "http:" || x.protocol === "https:") ? x.href : "";
    } catch (e) { return ""; }
  }
  function hostOf(u) {
    try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return ""; }
  }
  function isNew(t) { return t && (Date.now() - t.getTime()) < 7 * 24 * 60 * 60 * 1000; }

  /* ---------- storage ---------- */

  function makeStarterStore() {
    return {
      readOnly: true,
      load: function () {
        return Promise.resolve((L.starterLinks || []).map(function (l, i) {
          return { id: "starter" + i, title: l.title, url: l.url, description: l.description || "", category: l.category || "", time: null };
        }));
      },
      onAuth: function () {}
    };
  }

  function makeFirebaseStore() {
    return FB.load().then(function (x) {
      var fs = x.fs;
      var col = fs.collection(x.db, "links");
      return {
        readOnly: false,
        load: function () {
          var q = fs.query(col, fs.orderBy("createdAt", "desc"), fs.limit(500));
          return fs.getDocs(q).then(function (snap) {
            return snap.docs.map(function (d) {
              var v = d.data();
              return {
                id: d.id,
                title: v.title,
                url: v.url,
                description: v.description || "",
                category: v.category || "",
                time: v.createdAt && v.createdAt.toDate ? v.createdAt.toDate() : null
              };
            });
          });
        },
        add: function (link) {
          return fs.addDoc(col, {
            title: link.title,
            url: link.url,
            description: link.description,
            category: link.category,
            createdAt: fs.serverTimestamp()
          });
        },
        remove: function (id) { return fs.deleteDoc(fs.doc(x.db, "links", id)); },
        onAuth: function (cb) { x.au.onAuthStateChanged(x.auth, cb); },
        logout: function () { return x.au.signOut(x.auth); }
      };
    });
  }

  /* ---------- drawing the page ---------- */

  function render() {
    listEl.textContent = "";

    if (!links.length) {
      listEl.appendChild(el("p", "", L.emptyText || "no links yet."));
      fillFolderList([]);
      return;
    }

    var groups = Object.create(null);
    var names = [];
    links.forEach(function (l) {
      var c = l.category || defaultCat;
      if (!groups[c]) { groups[c] = []; names.push(c); }
      groups[c].push(l);
    });
    names.sort(function (a, b) { return a.toLowerCase() < b.toLowerCase() ? -1 : 1; });

    names.forEach(function (c) {
      var sec = el("section", "link-group");
      sec.appendChild(el("h3", "", "📁 " + c));
      var ul = el("ul", "link-list");

      groups[c].sort(function (a, b) {
        return String(a.title).toLowerCase() < String(b.title).toLowerCase() ? -1 : 1;
      }).forEach(function (l) {
        var li = el("li", "link-item");
        var main = el("div", "link-main");

        var bullet = el("span", "link-bullet", "🔗");
        bullet.setAttribute("aria-hidden", "true");
        main.appendChild(bullet);

        var url = safeUrl(l.url);
        if (url) {
          var a = el("a", "link-title", l.title);
          a.href = url;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          main.appendChild(a);
        } else {
          main.appendChild(el("span", "link-title", l.title));
        }

        var host = hostOf(l.url);
        if (host) main.appendChild(el("span", "link-host", "(" + host + ")"));
        if (isNew(l.time)) main.appendChild(el("span", "new-tag", "NEW!"));
        if (l.description) main.appendChild(el("div", "link-desc", l.description));
        li.appendChild(main);

        if (admin && store && !store.readOnly) {
          var del = el("button", "mini-btn", "delete");
          del.type = "button";
          del.setAttribute("aria-label", "Delete " + l.title);
          del.addEventListener("click", function () {
            if (!window.confirm('Delete "' + l.title + '"?')) return;
            store.remove(l.id).then(refresh).catch(function () {
              showStatus("err", "couldn't delete that link. are you logged in as the admin?");
            });
          });
          li.appendChild(del);
        }
        ul.appendChild(li);
      });

      sec.appendChild(ul);
      listEl.appendChild(sec);
    });

    fillFolderList(names);
  }

  function fillFolderList(names) {
    var dl = $("catList");
    if (!dl) return;
    dl.textContent = "";
    names.forEach(function (n) { var o = document.createElement("option"); o.value = n; dl.appendChild(o); });
  }

  function refresh() {
    return store.load().then(function (list) {
      links = list;
      loadedOnce = true;
      render();
    }).catch(function () {
      listEl.textContent = "";
      listEl.appendChild(el("p", "", "couldn't load the links right now. try refreshing in a minute."));
    });
  }

  /* ---------- admin: adding links ---------- */

  var statusEl = $("linkStatus");
  function showStatus(kind, text) {
    statusEl.hidden = false;
    statusEl.className = "gb-status " + kind;
    statusEl.textContent = text;
  }
  function clearStatus() { statusEl.hidden = true; statusEl.textContent = ""; }

  var form = $("linkForm");
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    clearStatus();
    if (!admin || !store || store.readOnly) { showStatus("err", "please log in first."); return; }

    var title = $("linkTitle").value.replace(/\s+/g, " ").trim();
    var rawUrl = $("linkUrl").value.trim();
    var description = $("linkDesc").value.replace(/\s+/g, " ").trim();
    var category = $("linkCat").value.replace(/\s+/g, " ").trim() || defaultCat;

    if (!title) { showStatus("err", "please give the link a title."); $("linkTitle").focus(); return; }
    if (!rawUrl) { showStatus("err", "please enter the web address."); $("linkUrl").focus(); return; }

    // Forgot the https://? Add it.
    if (!/^[a-z][a-z0-9+.-]*:/i.test(rawUrl)) rawUrl = "https://" + rawUrl;
    var url = safeUrl(rawUrl);
    if (!url) { showStatus("err", "that web address doesn't look right. it should start with http:// or https://"); $("linkUrl").focus(); return; }
    if (url.length > 300) { showStatus("err", "that web address is too long."); return; }

    var submit = $("linkSubmit");
    submit.disabled = true;
    store.add({ title: title, url: url, description: description, category: category }).then(function () {
      showStatus("ok", 'added "' + title + '"!');
      form.reset();
      $("linkTitle").focus();
      return refresh();
    }).catch(function () {
      showStatus("err", "couldn't save that. are you logged in as the admin?");
    }).then(function () {
      submit.disabled = false;
    });
  });

  $("adminLogout").addEventListener("click", function () {
    if (store && store.logout) store.logout();
  });

  /* ---------- start up ---------- */

  var starting = FB && FB.configured ? makeFirebaseStore() : Promise.resolve(makeStarterStore());
  starting.then(function (s) {
    store = s;
    if (s.readOnly) $("linksSetup").hidden = false;
    s.onAuth(function (user) {
      admin = !!user && !s.readOnly;
      $("linksAdmin").hidden = !admin;
      if (user) $("adminWho").textContent = user.email || "admin";
      if (loadedOnce) render();
    });
    return refresh();
  }).catch(function () {
    listEl.textContent = "";
    listEl.appendChild(el("p", "", "couldn't connect right now. try refreshing in a minute."));
  });
})();
