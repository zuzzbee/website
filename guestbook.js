/* =====================================================================
   YOU DON'T NEED TO EDIT THIS FILE.
   Settings and the blocked-word list are in guestbook-config.js.
   ===================================================================== */

(function () {
  var G = window.GUESTBOOK || {};
  function $(id) { return document.getElementById(id); }

  /* ------------------------------------------------------------------
     WORD FILTER
     Catches the word itself, plus common tricks (sh1t, f.u.c.k, fuuuck,
     shitty). Words buried inside other words are left alone, so
     "class" and "shiitake" are fine.
     ------------------------------------------------------------------ */

  var LEET = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "@": "a", "$": "s", "!": "i", "|": "i", "+": "t" };

  function buildPattern(word) {
    var w = String(word).toLowerCase().replace(/[^a-z]/g, "");
    if (!w) return null;
    // Long words may have spaces or symbols between letters ("f u c k").
    var sep = w.length >= 4 ? "[^a-z]*" : "";
    var body = w.split("").map(function (c) { return c + "+"; }).join(sep);
    return new RegExp("(^|[^a-z])" + body + "(?:s|es|ed|er|ers|ing|in|y|ies|head)?($|[^a-z])", "i");
  }

  var patterns = (G.blockedWords || []).map(buildPattern).filter(Boolean);

  function clean(text) {
    var t = String(text).toLowerCase();
    if (t.normalize) t = t.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return t.replace(/[\u200b-\u200d\ufeff]/g, "").replace(/['\u2019]/g, "");
  }

  function isBlocked(text) {
    var a = clean(text);
    var b = a.replace(/[013457@$!|+8]/g, function (c) { return LEET[c]; });
    for (var i = 0; i < patterns.length; i++) {
      if (patterns[i].test(a) || patterns[i].test(b)) return true;
    }
    return false;
  }

  var LINK_RE = /https?:\/\/|www\.|\b[a-z0-9-]{2,}\.(com|net|org|io|xyz|ru|cn|co|gg|ly|me|info|biz|link|click)\b/i;
  function hasLink(text) { return LINK_RE.test(String(text)); }

  // Exposed so the filter can be tested on its own.
  window.GuestbookFilter = { isBlocked: isBlocked, hasLink: hasLink };

  /* ------------------------------------------------------------------
     PAGE WIRING
     ------------------------------------------------------------------ */

  var form = $("gbForm");
  if (!form) return;   // not on the guestbook page

  var maxName = G.maxNameLength || 30;
  var maxMsg = G.maxMessageLength || 300;
  var maxShown = G.maxEntriesShown || 50;
  var cooldown = typeof G.cooldownSeconds === "number" ? G.cooldownSeconds : 30;

  var nameEl = $("gbName");
  var msgEl = $("gbMessage");
  var countEl = $("gbCount");
  var statusEl = $("gbStatus");
  var submitEl = $("gbSubmit");
  var listEl = $("gbEntries");

  function setText(id, value) { var el = $(id); if (el && value) el.textContent = value; }
  setText("gbWindowTitle", G.windowTitle);
  setText("gbIntro", G.intro);
  setText("gbEntriesTitle", G.entriesTitle);

  nameEl.maxLength = maxName;
  msgEl.maxLength = maxMsg;

  function updateCount() { countEl.textContent = msgEl.value.length + "/" + maxMsg; }
  msgEl.addEventListener("input", updateCount);
  updateCount();

  function showStatus(kind, text) {
    statusEl.hidden = false;
    statusEl.className = "gb-status " + kind;
    statusEl.textContent = text;
  }
  function clearStatus() { statusEl.hidden = true; statusEl.textContent = ""; }

  /* ---------- storage: Firebase when set up, otherwise demo mode ---------- */

  var FB = G.firebase || {};
  var firebaseReady = !!(FB.apiKey && FB.projectId);

  function makeDemoStore() {
    var KEY = "zuzz-guestbook-demo";
    function read() {
      try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; }
    }
    return {
      demo: true,
      load: function () {
        return Promise.resolve(read().slice(0, maxShown).map(function (x) {
          return { name: x.name, message: x.message, time: x.time ? new Date(x.time) : null };
        }));
      },
      save: function (name, message) {
        var all = read();
        all.unshift({ name: name, message: message, time: Date.now() });
        try { localStorage.setItem(KEY, JSON.stringify(all.slice(0, 200))); } catch (e) {}
        return Promise.resolve();
      }
    };
  }

  function makeFirebaseStore() {
    var BASE = "https://www.gstatic.com/firebasejs/10.12.2/";
    return Promise.all([
      import(BASE + "firebase-app.js"),
      import(BASE + "firebase-firestore.js")
    ]).then(function (mods) {
      var fs = mods[1];
      var app = mods[0].initializeApp(FB);
      var db = fs.getFirestore(app);
      var col = fs.collection(db, "guestbook");
      return {
        demo: false,
        load: function () {
          var q = fs.query(col, fs.orderBy("createdAt", "desc"), fs.limit(maxShown));
          return fs.getDocs(q).then(function (snap) {
            return snap.docs.map(function (doc) {
              var x = doc.data();
              return {
                name: x.name,
                message: x.message,
                time: x.createdAt && x.createdAt.toDate ? x.createdAt.toDate() : null
              };
            });
          });
        },
        save: function (name, message) {
          return fs.addDoc(col, { name: name, message: message, createdAt: fs.serverTimestamp() });
        }
      };
    });
  }

  var store = null;

  /* ---------- showing the messages ---------- */

  function renderEntries(entries) {
    listEl.textContent = "";
    if (!entries.length) {
      var empty = document.createElement("p");
      empty.className = "gb-empty";
      empty.textContent = G.emptyText || "no messages yet. be the first to sign!";
      listEl.appendChild(empty);
      return;
    }
    entries.forEach(function (e) {
      var box = document.createElement("article");
      box.className = "entry in";

      var who = document.createElement("div");
      who.className = "who";
      var n = document.createElement("strong");
      n.textContent = e.name;
      var t = document.createElement("span");
      t.className = "when";
      t.textContent = e.time
        ? e.time.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" })
        : "just now";
      who.appendChild(n);
      who.appendChild(t);

      var p = document.createElement("p");
      p.textContent = e.message;

      box.appendChild(who);
      box.appendChild(p);
      listEl.appendChild(box);
    });
  }

  function refresh() {
    return store.load().then(renderEntries).catch(function () {
      listEl.textContent = "";
      var oops = document.createElement("p");
      oops.className = "gb-empty";
      oops.textContent = "couldn't load the messages right now. try refreshing in a minute.";
      listEl.appendChild(oops);
    });
  }

  /* ---------- cooldown (stops accidental double posts) ---------- */

  var LAST_KEY = "zuzz-guestbook-last";
  function secondsLeft() {
    if (!cooldown) return 0;
    try {
      var last = parseInt(localStorage.getItem(LAST_KEY), 10) || 0;
      return Math.max(0, Math.ceil((last + cooldown * 1000 - Date.now()) / 1000));
    } catch (e) { return 0; }
  }
  function markPosted() { try { localStorage.setItem(LAST_KEY, String(Date.now())); } catch (e) {} }

  /* ---------- submitting ---------- */

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    clearStatus();

    // Hidden trap field: real people never fill it in, bots often do.
    if ($("gbWebsite").value) { showStatus("ok", "thanks for signing!"); form.reset(); updateCount(); return; }

    var name = nameEl.value.replace(/\s+/g, " ").trim();
    var message = msgEl.value.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();

    if (!name) { showStatus("err", "please enter your name."); nameEl.focus(); return; }
    if (message.length < 2) { showStatus("err", "please write a message."); msgEl.focus(); return; }
    if (name.length > maxName || message.length > maxMsg) { showStatus("err", "that's a bit too long. please shorten it."); return; }

    if (G.blockLinks !== false && (hasLink(name) || hasLink(message))) {
      showStatus("err", G.linkMessage || "links aren't allowed in the guestbook.");
      return;
    }
    if (isBlocked(name) || isBlocked(message)) {
      showStatus("err", G.blockedMessage || "please keep it friendly!");
      return;
    }

    var wait = secondsLeft();
    if (wait > 0) { showStatus("err", "slow down! you can post again in " + wait + " seconds."); return; }

    if (!store) { showStatus("err", "the guestbook is still loading. try again in a moment."); return; }

    submitEl.disabled = true;
    store.save(name, message).then(function () {
      markPosted();
      showStatus("ok", "thanks for signing, " + name + "!");
      msgEl.value = "";
      updateCount();
      return refresh();
    }).catch(function () {
      showStatus("err", "couldn't save your message. please try again later.");
    }).then(function () {
      submitEl.disabled = false;
    });
  });

  /* ---------- start up ---------- */

  var setup = $("gbSetup");
  if (setup && (firebaseReady || G.showSetupNotes === false)) setup.hidden = true;

  var starting = firebaseReady ? makeFirebaseStore() : Promise.resolve(makeDemoStore());
  starting.then(function (s) {
    store = s;
    return refresh();
  }).catch(function () {
    listEl.textContent = "";
    var oops = document.createElement("p");
    oops.className = "gb-empty";
    oops.textContent = "couldn't connect to the guestbook right now. try refreshing in a minute.";
    listEl.appendChild(oops);
  });
})();
