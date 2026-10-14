/* =====================================================================
   VISITOR COUNTER
   ===================================================================== */

(function () {
  "use strict";

  var FB = window.ZuzzFirebase;
  var KEY = "zuzz-visitor-count";

  // Change this value only when you intentionally want to reset
  // each browser's LOCAL fallback counter.
  var DEPLOYMENT_TIMESTAMP = "2026-10-14T15:58:32Z";

  function $(id) {
    return document.getElementById(id);
  }

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

    var digits = String(
      Math.max(0, parseInt(count, 10) || 0)
    );

    while (digits.length < 6) {
      digits = "0" + digits;
    }

    counter.setAttribute(
      "aria-label",
      "visitor number " + digits
    );

    digits.split("").forEach(function (ch) {
      counter.appendChild(make("span", "", ch));
    });

    console.log("Visitor counter rendered value: " + digits);
  }

  // Local fallback counter: separate for each browser.
  function getLocalCount() {
    var count = parseInt(localStorage.getItem(KEY), 10) || 0;
    count += 1;

    localStorage.setItem(KEY, String(count));

    console.log("Local visitor count (updated): " + count);
    return count;
  }

  // Reset the local fallback counter when the deployment changes.
  // This does NOT reset the shared Firebase counter.
  try {
    var storedDeploy = localStorage.getItem("deploymentTimestamp");

    if (storedDeploy !== DEPLOYMENT_TIMESTAMP) {
      localStorage.setItem(KEY, "0");
      localStorage.setItem(
        "deploymentTimestamp",
        DEPLOYMENT_TIMESTAMP
      );

      console.log("Local counter reset for new deployment.");
    }
  } catch (err) {
    console.warn("Local storage unavailable:", err);
  }

  function showLocalFallback() {
    try {
      render(getLocalCount());
    } catch (err) {
      console.error("Unable to update local counter:", err);
      render(0);
    }
  }

  // Firebase: one shared counter for all visitors.
  if (FB && FB.configured) {
    FB.load()
      .then(function (x) {
        var fs = x.fs;
        var docRef = fs.doc(x.db, "counters", "site");

        // IMPORTANT:
        // Never reset the shared Firebase counter on page load.
        // Atomically increment it instead.
        return fs.setDoc(
          docRef,
          { count: fs.increment(1) },
          { merge: true }
        ).then(function () {
          return fs.getDoc(docRef);
        });
      })
      .then(function (snap) {
        var count = snap.exists()
          ? snap.data().count
          : 0;

        render(count);
      })
      .catch(function (err) {
        console.error(
          "Firebase counter failed; using local fallback:",
          err
        );

        showLocalFallback();
      });
  } else {
    showLocalFallback();
  }
})();
