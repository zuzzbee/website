(function () {
  var FB = window.ZuzzFirebase;
  var S = window.SITE || {};
  var KEY = "zuzz-visitor-count";

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
  }

  function getLocalCount() {
    var count = parseInt(localStorage.getItem(KEY), 10) || parseInt(S.visitorCount, 10) || 0;
    var sessionKey = "zuzz-visited";
    if (!sessionStorage.getItem(sessionKey)) {
      count++;
      localStorage.setItem(KEY, count);
      sessionStorage.setItem(sessionKey, "1");
    }
    return count;
  }

  if (FB && FB.configured) {
    FB.load().then(function (x) {
      var fs = x.fs;
      var docRef = fs.doc(x.db, "counters", "site");

      // Use a transaction or arrayUnion isn't right here, we need increment.
      // Firebase has a field value increment.
      var sessionKey = "zuzz-visited-fire";
      var promise;

      if (!sessionStorage.getItem(sessionKey)) {
        promise = fs.setDoc(docRef, { count: fs.increment(1) }, { merge: true });
        sessionStorage.setItem(sessionKey, "1");
      } else {
        promise = Promise.resolve();
      }

      promise.then(function () {
        return fs.getDoc(docRef);
      }).then(function (snap) {
        if (snap.exists()) {
          render(snap.data().count);
        } else {
          render(getLocalCount());
        }
      }).catch(function (err) {
        console.error("Counter error:", err);
        render(getLocalCount());
      });
    }).catch(function () {
      render(getLocalCount());
    });
  } else {
    render(getLocalCount());
  }
})();
