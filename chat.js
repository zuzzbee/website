/* =====================================================================
   YOU DON'T NEED TO EDIT THIS FILE.
   Chat settings are in pages-config.js.
   ===================================================================== */

(function () {
  var C = (window.PAGES && window.PAGES.chat) || {};
  var FB = window.ZuzzFirebase;
  var Filter = window.GuestbookFilter;
  function $(id) { return document.getElementById(id); }

  var form = $("chatForm");
  if (!form) return;

  var logEl = $("chatLog");
  var nameEl = $("chatName");
  var msgEl = $("chatMessage");
  var sendEl = $("chatSend");
  var statusEl = $("chatStatus");
  var setupEl = $("chatSetup");
  var modEl = $("chatMod");

  var maxName = C.maxNameLength || 24;
  var maxMsg = C.maxMessageLength || 200;
  var maxShown = C.maxMessagesShown || 100;
  var cooldown = typeof C.cooldownSeconds === "number" ? C.cooldownSeconds : 3;

  if (C.windowTitle) $("chatWindowTitle").textContent = C.windowTitle;
  if (C.intro) $("chatIntro").textContent = C.intro;
  nameEl.maxLength = maxName;
  msgEl.maxLength = maxMsg;

  function showStatus(kind, text) {
    statusEl.hidden = false;
    statusEl.className = "gb-status chat-status " + kind;
    statusEl.textContent = text;
  }
  function clearStatus() { statusEl.hidden = true; statusEl.textContent = ""; }

  // Fail safe: if the word filter didn't load, don't let anyone post.
  if (!Filter) {
    showStatus("err", "the chat is switched off because the word filter didn't load. check that guestbook.js and guestbook-config.js are uploaded.");
    return;
  }

  /* ---------- remembering your name ---------- */

  var NAME_KEY = "zuzz-chat-name";
  try { nameEl.value = localStorage.getItem(NAME_KEY) || ""; } catch (e) {}

  /* ---------- colors for names ---------- */

  var COLORS = ["#c00000", "#0000c0", "#007000", "#a000a0", "#c05000", "#006a6a", "#7a4a00", "#4040ff"];
  function colorFor(name) {
    var h = 0, s = String(name).toLowerCase();
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return COLORS[h % COLORS.length];
  }

  /* ---------- storage: Firebase when set up, otherwise demo mode ---------- */

  function makeDemoStore() {
    var KEY = "zuzz-chat-demo";
    var listeners = [];
    function read() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
    function write(list) { try { localStorage.setItem(KEY, JSON.stringify(list.slice(-200))); } catch (e) {} }
    function snapshot() {
      return read().slice(-maxShown).map(function (m) {
        return { id: m.id, name: m.name, message: m.message, time: new Date(m.time) };
      });
    }
    function emit() { var s = snapshot(); listeners.forEach(function (f) { f(s); }); }
    window.addEventListener("storage", function (e) { if (e.key === KEY) emit(); });
    return {
      demo: true,
      subscribe: function (onData) { listeners.push(onData); onData(snapshot()); },
      add: function (name, message) {
        var list = read();
        list.push({ id: Date.now() + "-" + Math.random().toString(36).slice(2, 7), name: name, message: message, time: Date.now() });
        write(list); emit();
        return Promise.resolve();
      },
      remove: function (id) {
        write(read().filter(function (m) { return m.id !== id; })); emit();
        return Promise.resolve();
      },
      onAuth: function (cb) { cb(null); }
    };
  }

  function makeFirebaseStore() {
    return FB.load().then(function (x) {
      var fs = x.fs;
      var col = fs.collection(x.db, "chat");
      return {
        demo: false,
        subscribe: function (onData, onError) {
          var q = fs.query(col, fs.orderBy("createdAt", "desc"), fs.limit(maxShown));
          fs.onSnapshot(q, function (snap) {
            var list = snap.docs.map(function (d) {
              var v = d.data({ serverTimestamps: "estimate" });
              return {
                id: d.id,
                name: v.name,
                message: v.message,
                time: v.createdAt && v.createdAt.toDate ? v.createdAt.toDate() : null
              };
            });
            list.reverse();   // oldest first, newest at the bottom
            onData(list);
          }, onError);
        },
        add: function (name, message) {
          return fs.addDoc(col, { name: name, message: message, createdAt: fs.serverTimestamp() });
        },
        remove: function (id) { return fs.deleteDoc(fs.doc(x.db, "chat", id)); },
        onAuth: function (cb) { x.au.onAuthStateChanged(x.auth, cb); }
      };
    });
  }

  var store = null;
  var messages = [];
  var isMod = false;
  var loaded = false;

  /* ---------- drawing the chat ---------- */

  function render() {
    var nearBottom = logEl.scrollHeight - logEl.scrollTop - logEl.clientHeight < 60;
    logEl.textContent = "";

    if (C.welcomeLine) {
      var sys = document.createElement("p");
      sys.className = "chat-line chat-system";
      sys.textContent = C.welcomeLine;
      logEl.appendChild(sys);
    }

    if (!messages.length) {
      var empty = document.createElement("p");
      empty.className = "chat-empty";
      empty.textContent = C.emptyText || "it's quiet in here... say something!";
      logEl.appendChild(empty);
    }

    messages.forEach(function (m) {
      var line = document.createElement("p");
      line.className = "chat-line";

      var time = document.createElement("span");
      time.className = "chat-time";
      time.textContent = m.time ? "[" + m.time.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) + "]" : "[now]";

      var who = document.createElement("span");
      who.className = "chat-name";
      who.style.color = colorFor(m.name);
      who.textContent = m.name + ":";

      var body = document.createElement("span");
      body.textContent = " " + m.message;

      line.appendChild(time);
      line.appendChild(who);
      line.appendChild(body);

      if (isMod) {
        var del = document.createElement("button");
        del.type = "button";
        del.className = "mini-btn";
        del.textContent = "delete";
        del.setAttribute("aria-label", "Delete message from " + m.name);
        del.addEventListener("click", function () {
          if (!window.confirm("Delete this message?")) return;
          store.remove(m.id).catch(function () {
            showStatus("err", "couldn't delete that message. are you logged in as the admin?");
          });
        });
        line.appendChild(del);
      }
      logEl.appendChild(line);
    });

    if (!loaded || nearBottom) logEl.scrollTop = logEl.scrollHeight;
    loaded = true;
  }

  function onData(list) { messages = list; render(); }

  function onError() {
    logEl.textContent = "";
    var oops = document.createElement("p");
    oops.className = "chat-empty";
    oops.textContent = "couldn't connect to the chat right now. try refreshing in a minute.";
    logEl.appendChild(oops);
  }

  /* ---------- rules for posting ---------- */

  function squash(s) { return String(s).toLowerCase().replace(/[^a-z0-9]/g, ""); }
  function isReserved(name) {
    var n = squash(name);
    return (C.reservedNames || []).some(function (r) { return squash(r) === n; });
  }

  var LAST_KEY = "zuzz-chat-last";
  function secondsLeft() {
    if (!cooldown) return 0;
    try {
      var last = parseInt(localStorage.getItem(LAST_KEY), 10) || 0;
      return Math.max(0, Math.ceil((last + cooldown * 1000 - Date.now()) / 1000));
    } catch (e) { return 0; }
  }
  function markPosted() { try { localStorage.setItem(LAST_KEY, String(Date.now())); } catch (e) {} }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    clearStatus();
    if (!store) { showStatus("err", "still connecting. try again in a moment."); return; }

    var name = nameEl.value.replace(/\s+/g, " ").trim();
    var message = msgEl.value.replace(/\s+/g, " ").trim();

    if (!name) { showStatus("err", "please enter a name first."); nameEl.focus(); return; }
    if (!message) { msgEl.focus(); return; }
    if (name.length > maxName || message.length > maxMsg) { showStatus("err", "that's a bit too long. please shorten it."); return; }

    if (!isMod && isReserved(name)) { showStatus("err", C.reservedMessage || "that name is reserved."); nameEl.focus(); return; }

    if (C.blockLinks !== false && (Filter.hasLink(name) || Filter.hasLink(message))) {
      showStatus("err", "links aren't allowed in the chat, sorry!");
      return;
    }
    if (Filter.isBlocked(name) || Filter.isBlocked(message)) {
      showStatus("err", (window.GUESTBOOK && window.GUESTBOOK.blockedMessage) || "please keep it friendly!");
      return;
    }

    var wait = secondsLeft();
    if (wait > 0) { showStatus("err", "slow down! you can send again in " + wait + " second" + (wait === 1 ? "" : "s") + "."); return; }

    sendEl.disabled = true;
    store.add(name, message).then(function () {
      markPosted();
      try { localStorage.setItem(NAME_KEY, name); } catch (e) {}
      msgEl.value = "";
      msgEl.focus();
      logEl.scrollTop = logEl.scrollHeight;
    }).catch(function () {
      showStatus("err", "couldn't send your message. please try again.");
    }).then(function () {
      sendEl.disabled = false;
    });
  });

  /* ---------- start up ---------- */

  var starting = FB && FB.configured ? makeFirebaseStore() : Promise.resolve(makeDemoStore());
  starting.then(function (s) {
    store = s;
    if (s.demo && setupEl && C.showSetupNotes !== false) setupEl.hidden = false;
    sendEl.disabled = false;
    s.subscribe(onData, onError);
    s.onAuth(function (user) {
      isMod = !!user;
      if (modEl) modEl.hidden = !isMod;
      render();
    });
  }).catch(onError);
})();
