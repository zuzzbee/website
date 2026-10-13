/* =====================================================================
   YOU DON'T NEED TO EDIT THIS FILE.
   Connects the chat, links and login pages to your Firebase project.
   It uses the same details you already pasted into guestbook-config.js.
   ===================================================================== */

(function () {
  var cfg = (window.GUESTBOOK && window.GUESTBOOK.firebase) || {};
  var configured = !!(cfg.apiKey && cfg.projectId);
  var cached = null;

  function load() {
    if (!configured) return Promise.reject(new Error("not-configured"));
    if (cached) return cached;

    var BASE = "https://www.gstatic.com/firebasejs/10.12.2/";
    cached = Promise.all([
      import(BASE + "firebase-app.js"),
      import(BASE + "firebase-firestore.js"),
      import(BASE + "firebase-auth.js")
    ]).then(function (m) {
      var app = m[0].initializeApp(cfg);
      return { db: m[1].getFirestore(app), auth: m[2].getAuth(app), fs: m[1], au: m[2] };
    });

    // If loading fails (for example, offline), allow another try next time.
    cached.catch(function () { cached = null; });
    return cached;
  }

  window.ZuzzFirebase = { configured: configured, load: load };
})();
