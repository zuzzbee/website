/* =====================================================================
   YOU DON'T NEED TO EDIT THIS FILE.
   ===================================================================== */

(function () {
  var P = (window.PAGES && window.PAGES.login) || {};
  var FB = window.ZuzzFirebase;
  function $(id) { return document.getElementById(id); }

  var form = $("loginForm");
  if (!form) return;

  var emailEl = $("loginEmail");
  var passEl = $("loginPassword");
  var submitEl = $("loginSubmit");
  var statusEl = $("loginStatus");
  var loggedEl = $("loggedPanel");

  if (P.windowTitle) $("loginWindowTitle").textContent = P.windowTitle;
  $("loginIntro").textContent = P.intro || "";

  function showStatus(kind, text) {
    statusEl.hidden = false;
    statusEl.className = "gb-status " + kind;
    statusEl.textContent = text;
  }
  function clearStatus() { statusEl.hidden = true; statusEl.textContent = ""; }

  function friendlyError(err) {
    var code = err && err.code ? String(err.code) : "";
    if (code === "auth/too-many-requests") return "too many tries. please wait a few minutes and try again.";
    if (code === "auth/network-request-failed") return "couldn't reach the server. check your connection and try again.";
    if (code === "auth/unauthorized-domain") return "this website address isn't allowed yet. in Firebase, open Authentication > Settings > Authorized domains and add zuzz.world.";
    if (code === "auth/operation-not-allowed") return "email and password login isn't switched on in Firebase yet.";
    // Same message for a wrong email or a wrong password, on purpose.
    return "that email or password isn't right.";
  }

  if (!FB || !FB.configured) {
    form.hidden = true;
    $("loginSetup").hidden = false;
    return;
  }

  FB.load().then(function (x) {
    submitEl.disabled = false;

    x.au.onAuthStateChanged(x.auth, function (user) {
      if (user) {
        $("loginWho").textContent = user.email || "admin";
        form.hidden = true;
        loggedEl.hidden = false;
      } else {
        form.hidden = false;
        loggedEl.hidden = true;
      }
    });

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      clearStatus();
      var email = emailEl.value.trim();
      var password = passEl.value;
      if (!email || !password) { showStatus("err", "please enter your email and password."); return; }

      submitEl.disabled = true;
      x.au.signInWithEmailAndPassword(x.auth, email, password).then(function () {
        passEl.value = "";
        showStatus("ok", "logged in!");
      }).catch(function (err) {
        passEl.value = "";
        showStatus("err", friendlyError(err));
      }).then(function () {
        submitEl.disabled = false;
      });
    });

    $("logoutBtn").addEventListener("click", function () {
      clearStatus();
      x.au.signOut(x.auth).then(function () { showStatus("ok", "logged out."); });
    });
  }).catch(function () {
    form.hidden = true;
    showStatus("err", "couldn't connect to Firebase right now. try refreshing in a minute.");
  });
})();
