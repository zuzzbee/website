/* =====================================================================
   VISITOR COUNTER
   ===================================================================== */

(function () {
  var FB = window.ZuzzFirebase;
  var S = window.SITE || {};
  var KEY = "zuzz-visitor-count";
  // var RESET_KEY = "zuzz-counter-reset-v2"; // removed: use daily reset instead
  // Removed unused daily reset key
  // var RESET_DATE_KEY = "zuzz-counter-reset-date";
  function $(id) { return document.getElementById(id); }
  function make(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function render(count) {
    var counter = $("counter");
    if (!counter) return;
    counter.textContent = "";
    var digits = String(Math.max(0, parseInt(count, 10) || 0));
    while (digits.length < 6) digits = "0" + digits;
    counter.setAttribute("aria-label", "visitor number " + digits);
    digits.split("").forEach(function (ch) {
      counter.appendChild(make("span", "", ch));
    });
    console.log("Visitor counter rendered value: " + digits);
  }

  function getLocalCount() {
    var count = parseInt(localStorage.getItem(KEY), 10) || 0;
    count++; // always increment on each page load
    localStorage.setItem(KEY, count);
    console.log("Local visitor count (updated): " + count);
    return count;
  }

  // Reset only on first load after new deployment
  var DEPLOYMENT_TIMESTAMP = "2026-10-14T15:58:32Z";
  var storedDeploy = localStorage.getItem('deploymentTimestamp');
  if (storedDeploy !== DEPLOYMENT_TIMESTAMP) {
    localStorage.setItem(KEY, 0);
    localStorage.setItem('deploymentTimestamp', DEPLOYMENT_TIMESTAMP);
    console.log("Visitor counter reset for deployment at " + DEPLOYMENT_TIMESTAMP);
  }

  if (FB && FB.configured) {
    FB.load().then(function (x) {
      var fs = x.fs;
      var docRef = fs.doc(x.db, "counters", "site");

      // One-time Firebase reset
      if (!localStorage.getItem("zuzz-fb-reset")) {
        fs.setDoc(docRef, { count: 0 });
        localStorage.setItem("zuzz-fb-reset", "true");
        console.log("Firebase visitor counter reset to 0 on first load");
      }

      // Increment remotely on every page load
      var promise = fs.setDoc(docRef, { count: fs.increment(1) }, { merge: true });
      console.log("Remote visitor counter incremented");

      promise.then(function () {
        return fs.getDoc(docRef);
      }).then(function (snap) {
        render(snap.exists() ? snap.data().count : 0);
      }).catch(function (err) {
        console.error("Error fetching remote visitor count: ", err);
        render(getLocalCount());
      });
    }).catch(function (err) {
      console.error("Firebase load failed: ", err);
      render(getLocalCount());
    });
  } else {
    render(getLocalCount());
  }
})();
