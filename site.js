/* =====================================================================
   YOU DON'T NEED TO EDIT THIS FILE.
   It reads your settings from config.js and builds the page.
   It works on the home page and on subpages like the guestbook.
   ===================================================================== */

(function () {
  var S = window.SITE;
  if (!S) {
    document.body.insertAdjacentHTML(
      "afterbegin",
      '<p class="no-js">Could not find config.js. Make sure it is in the same folder as index.html.</p>'
    );
    return;
  }

  function $(id) { return document.getElementById(id); }
  function setText(id, value) { var el = $(id); if (el) el.textContent = value || ""; }
  function hide(id) { var el = $(id); if (el) el.hidden = true; }
  function make(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  /* ---------- top of page ---------- */
  var pageTitle = document.body.getAttribute("data-title");
  if (S.browserTabTitle) {
    document.title = pageTitle ? pageTitle + " - " + S.browserTabTitle : S.browserTabTitle;
  }
  setText("topBarTitle", S.topBarTitle);
  setText("headline", S.headline);
  setText("tagline", S.tagline);
  setText("taskbarText", S.taskbarText);

  if ($("tickerBox")) {
    if (S.scrollingText) { setText("ticker", S.scrollingText); } else { hide("tickerBox"); }
  }

  /* ---------- help notes ---------- */
  if (S.showHelpNotes === false) {
    var notes = document.querySelectorAll(".help-note");
    for (var i = 0; i < notes.length; i++) notes[i].hidden = true;
  }

  /* ---------- about (home page only) ---------- */
  if ($("aboutWindow")) {
    var ab = S.about || {};
    if (ab.show === false) {
      hide("aboutWindow");
    } else {
      setText("aboutTitle", ab.windowTitle);
      setText("aboutHeading", ab.heading);
      var box = $("aboutText");
      (ab.paragraphs || []).forEach(function (line) { box.appendChild(make("p", "", line)); });
      if (ab.newNote) { setText("aboutNewText", ab.newNote); } else { hide("aboutNew"); }
    }
  }

  /* ---------- menu ---------- */
  setText("menuTitle", S.menuTitle);
  var menu = $("menu");
  if (menu) {
    var here = location.pathname.split("/").pop() || "index.html";
    (S.menu || []).forEach(function (item) {
      var li = make("li");
      var a = make("a");
      a.href = item.page;
      if (item.page === here) a.setAttribute("aria-current", "page");

      var ico = make("span", "ico", item.icon || "");
      ico.setAttribute("aria-hidden", "true");

      var label = make("span", "", item.name);
      if (item.note) label.appendChild(make("small", "", item.note));

      a.appendChild(ico);
      a.appendChild(label);
      li.appendChild(a);
      menu.appendChild(li);
    });
  }

  /* ---------- site info ---------- */
  setText("infoTitle", S.siteInfoTitle);

  var counter = $("counter");
  if (counter) {
    var digits = String(Math.max(0, parseInt(S.visitorCount, 10) || 0));
    while (digits.length < 6) digits = "0" + digits;
    counter.setAttribute("aria-label", "visitor number " + digits);
    digits.split("").forEach(function (ch) { counter.appendChild(make("span", "", ch)); });
  }

  var badges = $("badges");
  if (badges) {
    (S.badges || []).forEach(function (b) {
      var el = make("span", b.yellow ? "badge y" : "badge");
      (b.lines || []).forEach(function (line, idx) {
        if (idx > 0) el.appendChild(document.createElement("br"));
        el.appendChild(document.createTextNode(line));
      });
      badges.appendChild(el);
    });
  }

  /* ---------- footer ---------- */
  setText("footYear", String(new Date().getFullYear()));
  setText("footName", S.footerName);

  // Small "admin" link that leads to the login page
  var foot = document.querySelector("footer.page-foot");
  if (foot && S.showAdminLink !== false) {
    foot.appendChild(document.createTextNode(" \u00b7 "));
    var adminLink = make("a", "", "admin");
    adminLink.href = "login.html";
    foot.appendChild(adminLink);
  }

  /* ---------- taskbar clock ---------- */
  var clock = $("clock");
  if (clock) {
    var tick = function () {
      clock.textContent = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    };
    tick();
    setInterval(tick, 30000);
  }
})();
