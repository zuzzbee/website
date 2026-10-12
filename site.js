/* =====================================================================
   YOU DON'T NEED TO EDIT THIS FILE.
   It reads your settings from config.js and builds the page.
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
  document.title = S.browserTabTitle || document.title;
  setText("topBarTitle", S.topBarTitle);
  setText("headline", S.headline);
  setText("tagline", S.tagline);
  setText("taskbarText", S.taskbarText);

  if (S.scrollingText) { setText("ticker", S.scrollingText); } else { hide("tickerBox"); }

  /* ---------- spotify ---------- */
  var sp = S.spotify || {};
  if (sp.show === false || !sp.link) {
    hide("spotifyWindow");
  } else {
    setText("spotifyTitle", sp.windowTitle);
    setText("spotifyIntro", sp.intro);
    var m = String(sp.link).match(
      /open\.spotify\.com\/(?:intl-[a-z]+\/)?(playlist|album|track|artist|episode|show)\/([A-Za-z0-9]+)/
    );
    var spFrame = $("spotifyFrame");
    if (m) {
      var f = make("iframe");
      f.title = "Spotify player";
      f.src = "https://open.spotify.com/embed/" + m[1] + "/" + m[2] + "?theme=0";
      f.height = sp.height || 352;
      f.loading = "lazy";
      f.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
      spFrame.appendChild(f);
    } else {
      spFrame.appendChild(make("p", "oops", "That doesn't look like a Spotify link. In Spotify, use Share > Copy link and paste it into config.js."));
    }
  }

  /* ---------- discord ---------- */
  var dc = S.discord || {};
  if (dc.show === false || !dc.serverId) {
    hide("discordWindow");
  } else {
    setText("discordTitle", dc.windowTitle);
    setText("discordIntro", dc.intro);
    var d = make("iframe");
    d.title = "Discord server widget";
    d.src = "https://discord.com/widget?id=" + encodeURIComponent(dc.serverId) + "&theme=dark";
    d.height = dc.height || 400;
    d.loading = "lazy";
    d.setAttribute("sandbox", "allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts");
    $("discordFrame").appendChild(d);
  }

  /* ---------- help notes ---------- */
  if (S.showHelpNotes === false) {
    var notes = document.querySelectorAll(".help-note");
    for (var i = 0; i < notes.length; i++) notes[i].hidden = true;
  }

  /* ---------- about ---------- */
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

  /* ---------- menu ---------- */
  setText("menuTitle", S.menuTitle);
  var here = location.pathname.split("/").pop() || "index.html";
  var menu = $("menu");
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

  /* ---------- site info ---------- */
  setText("infoTitle", S.siteInfoTitle);

  var digits = String(Math.max(0, parseInt(S.visitorCount, 10) || 0));
  while (digits.length < 6) digits = "0" + digits;
  var counter = $("counter");
  counter.setAttribute("aria-label", "visitor number " + digits);
  digits.split("").forEach(function (ch) { counter.appendChild(make("span", "", ch)); });

  var badges = $("badges");
  (S.badges || []).forEach(function (b) {
    var el = make("span", b.yellow ? "badge y" : "badge");
    (b.lines || []).forEach(function (line, idx) {
      if (idx > 0) el.appendChild(document.createElement("br"));
      el.appendChild(document.createTextNode(line));
    });
    badges.appendChild(el);
  });

  /* ---------- footer ---------- */
  setText("footYear", String(new Date().getFullYear()));
  setText("footName", S.footerName);

  /* ---------- taskbar clock ---------- */
  var clock = $("clock");
  function tick() {
    clock.textContent = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  tick();
  setInterval(tick, 30000);
})();
