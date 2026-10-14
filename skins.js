/* =====================================================================
   YOU DON'T NEED TO EDIT THIS FILE.
   It builds the MSN Messenger-style Discord box and the LimeWire-style
   Spotify box. Your settings are in config.js (the "spotify" and
   "discord" sections).
   ===================================================================== */

(function () {
  var S = window.SITE || {};
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  var NO_MOTION = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  /* ---------- tiny drawn icons (fixed artwork, nothing from visitors) ---------- */

  var BUDDY = '<svg viewBox="0 0 16 16" width="16" height="16"><circle cx="8" cy="4.6" r="3.1" fill="currentColor" stroke="rgba(0,0,0,.35)" stroke-width=".6"/><path d="M1.8 15c0-3.6 2.8-5.4 6.2-5.4s6.2 1.8 6.2 5.4z" fill="currentColor" stroke="rgba(0,0,0,.35)" stroke-width=".6"/></svg>';
  var LIME = '<svg viewBox="0 0 16 16" width="18" height="18"><circle cx="8" cy="8" r="7" fill="#8fd32b" stroke="#3f7a0a"/><circle cx="8" cy="8" r="5.2" fill="#c9f06a" stroke="#6fae1a" stroke-width=".6"/><path d="M8 3v10M3 8h10M4.5 4.5l7 7M11.5 4.5l-7 7" stroke="#8fd32b" stroke-width=".7"/></svg>';

  function icon(markup, extraClass) {
    var s = el("span", "skin-ico" + (extraClass ? " " + extraClass : ""));
    s.setAttribute("aria-hidden", "true");
    s.innerHTML = markup;
    return s;
  }

  /* ---------- the Windows XP window frame ---------- */

  function xpWindow(cls, title, iconMarkup, iconClass) {
    var win = el("div", "xp " + cls);
    var bar = el("div", "xp-title");
    bar.appendChild(icon(iconMarkup, iconClass));
    bar.appendChild(el("span", "xp-name", title));
    var btns = el("span", "xp-btns");
    btns.setAttribute("aria-hidden", "true");
    [["_", "xp-min"], ["□", "xp-max"], ["✕", "xp-close"]].forEach(function (b) {
      btns.appendChild(el("span", "xp-btn-sys " + b[1], b[0]));
    });
    bar.appendChild(btns);
    var body = el("div", "xp-body");
    win.appendChild(bar);
    win.appendChild(body);
    return { win: win, body: body };
  }

  function menuBar(items) {
    var m = el("div", "xp-menu");
    m.setAttribute("aria-hidden", "true");
    items.forEach(function (t) { m.appendChild(el("span", "", t)); });
    return m;
  }

  function helpNote(summary, html) {
    if (S.showHelpNotes === false) return null;
    var d = el("details", "skin-help");
    d.appendChild(el("summary", "", summary));
    var p = el("p");
    p.innerHTML = html;      // fixed text written in this file
    d.appendChild(p);
    return d;
  }

  function withTimeout(promise, ms) {
    return new Promise(function (resolve, reject) {
      var t = setTimeout(function () { reject(new Error("timeout")); }, ms);
      promise.then(function (v) { clearTimeout(t); resolve(v); }, function (e) { clearTimeout(t); reject(e); });
    });
  }

  /* =====================================================================
     DISCORD  ->  MSN MESSENGER
     ===================================================================== */

  function buildDiscord(slot) {
    var dc = S.discord || {};
    if (dc.show === false || !dc.serverId) { slot.hidden = true; return; }

    var serverId = String(dc.serverId).trim();
    var myName = S.footerName || "zuzz";

    var x = xpWindow("msn", "MSN Messenger", BUDDY, "st-online");
    x.body.appendChild(menuBar(["File", "Contacts", "Actions", "Tools", "Help"]));

    /* the "me" area: picture, name, status, personal message */
    var me = el("div", "msn-me");
    var pic = el("button", "msn-pic");
    pic.type = "button";
    pic.title = "nudge!";
    pic.setAttribute("aria-label", "Send a nudge");
    pic.appendChild(icon(BUDDY, "st-online"));
    var meText = el("div", "msn-metext");
    var nm = el("div", "msn-name");
    nm.appendChild(el("b", "", myName));
    nm.appendChild(el("span", "st", " (Online) ▾"));
    meText.appendChild(nm);
    if (dc.intro) meText.appendChild(el("div", "msn-pm", dc.intro));
    me.appendChild(pic);
    me.appendChild(meText);
    x.body.appendChild(me);

    var nudgeMsg = el("div", "msn-nudge-msg", "You have just sent a nudge.");
    nudgeMsg.hidden = true;
    x.body.appendChild(nudgeMsg);
    var nudgeTimer = null;
    pic.addEventListener("click", function () {
      x.win.classList.remove("nudge");
      void x.win.offsetWidth;                 // restart the shake
      x.win.classList.add("nudge");
      nudgeMsg.hidden = false;
      clearTimeout(nudgeTimer);
      nudgeTimer = setTimeout(function () { x.win.classList.remove("nudge"); nudgeMsg.hidden = true; }, 3000);
    });

    /* the contact list */
    var list = el("div", "msn-list");
    list.setAttribute("aria-live", "polite");
    var signin = el("div", "msn-signin");
    signin.appendChild(el("p", "", "Signing in..."));
    var bar = el("div", "msn-bar");
    bar.appendChild(el("span"));
    signin.appendChild(bar);
    list.appendChild(signin);
    x.body.appendChild(list);

    var foot = el("div", "msn-foot");
    var count = el("span", "msn-count", "");
    foot.appendChild(count);
    x.body.appendChild(foot);
    slot.appendChild(x.win);

    var note = helpNote("how do i change this?",
      'Open <code>config.js</code> and put your server ID next to <code>serverId:</code> in the <code>discord</code> section. Also make sure <b>Server Settings → Widget → Enable Server Widget</b> is switched on in Discord.');
    if (note) slot.appendChild(note);

    function safeInvite(u) {
      try {
        var p = new URL(String(u || ""));
        var ok = p.protocol === "https:" && (/(^|\.)discord\.gg$/.test(p.hostname) || /(^|\.)discord(app)?\.com$/.test(p.hostname));
        return ok ? p.href : "";
      } catch (e) { return ""; }
    }

    function addJoin(href) {
      if (!href || foot.querySelector(".xp-btn")) return;
      var a = el("a", "xp-btn", "➕ Join the chat");
      a.href = href;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      foot.insertBefore(a, count);
    }
    addJoin(safeInvite(dc.inviteLink));

    function render(data) {
      list.textContent = "";
      var members = data.members.slice(0, 25);
      var online = typeof data.presence_count === "number" ? data.presence_count : members.length;

      if (data.name) list.appendChild(el("div", "msn-server", "✉ " + data.name));

      var head = el("div", "msn-group");
      head.appendChild(el("span", "msn-arrow", "▾"));
      head.appendChild(document.createTextNode(" Online (" + online + ")"));
      list.appendChild(head);

      if (!members.length) {
        list.appendChild(el("p", "msn-empty", "Nobody is online right now."));
      }
      members.forEach(function (m) {
        var status = m.status === "idle" ? "away" : (m.status === "dnd" ? "busy" : "online");
        var row = el("div", "msn-contact");
        row.appendChild(icon(BUDDY, "st-" + status));
        row.appendChild(el("span", "msn-cname", String(m.username || "someone")));
        if (status === "away") row.appendChild(el("span", "msn-cstat", "(Away)"));
        if (status === "busy") row.appendChild(el("span", "msn-cstat", "(Busy)"));
        if (m.game && m.game.name) row.appendChild(el("span", "msn-cgame", "- Playing " + m.game.name));
        list.appendChild(row);
      });
      if (online > members.length) {
        list.appendChild(el("div", "msn-more", "...and " + (online - members.length) + " more online"));
      }
      count.textContent = online + " contact" + (online === 1 ? "" : "s") + " online";
      addJoin(safeInvite(data.instant_invite));
    }

    // If the contact list can't be loaded, fall back to Discord's own widget
    // inside the same window so the box still works.
    function fallback() {
      list.textContent = "";
      var f = el("iframe");
      f.title = "Discord server widget";
      f.src = "https://discord.com/widget?id=" + encodeURIComponent(serverId) + "&theme=dark";
      f.height = dc.height || 400;
      f.loading = "lazy";
      f.setAttribute("sandbox", "allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts");
      list.appendChild(f);
      count.textContent = "";
    }

    if (!/^\d{5,25}$/.test(serverId)) {
      list.textContent = "";
      list.appendChild(el("p", "msn-empty", "Add your Discord server ID in config.js to see who's online."));
      return;
    }

    withTimeout(fetch("https://discord.com/api/guilds/" + encodeURIComponent(serverId) + "/widget.json"), 8000)
      .then(function (r) {
        if (!r.ok) throw new Error("status " + r.status);
        return r.json();
      })
      .then(function (data) {
        if (!data || !Array.isArray(data.members)) throw new Error("shape");
        render(data);
      })
      .catch(fallback);
  }

  /* =====================================================================
     SPOTIFY  ->  LIMEWIRE
     ===================================================================== */

  var SPOTIFY_RE = /open\.spotify\.com\/(?:intl-[a-z]+\/)?(playlist|album|track|artist|episode|show)\/([A-Za-z0-9]+)/;
  var KIND = { playlist: "Playlist", album: "Album", track: "Song", artist: "Artist", episode: "Podcast episode", show: "Podcast" };

  function buildSpotify(slot) {
    var sp = S.spotify || {};
    if (sp.show === false || !sp.link) { slot.hidden = true; return; }

    var m = String(sp.link).match(SPOTIFY_RE);
    var x = xpWindow("lw", "LimeWire", LIME);
    x.body.appendChild(menuBar(["File", "View", "Tools", "Help"]));

    var brand = el("div", "lw-brand");
    brand.appendChild(icon(LIME));
    brand.appendChild(el("span", "lw-word", "LimeWire"));
    brand.appendChild(el("span", "lw-tag", "Turbo-Charged"));
    x.body.appendChild(brand);
    slot.appendChild(x.win);

    var note = helpNote("how do i change this?",
      'Open <code>config.js</code> and paste a Spotify share link next to <code>link:</code> in the <code>spotify</code> section.');

    if (!m) {
      var bad = el("div", "lw-panel");
      bad.appendChild(el("p", "lw-empty", "That doesn't look like a Spotify link. In Spotify, use Share > Copy link and paste it into config.js."));
      x.body.appendChild(bad);
      x.body.appendChild(el("div", "lw-status"));
      if (note) slot.appendChild(note);
      return;
    }

    var type = m[1], id = m[2];
    var kind = KIND[type];

    // a stable, made-up file size so it looks like a real download
    var h = 0;
    for (var i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    var sizeText = ((h % 70) + 25) / 10 + " MB";

    var tabsWrap = el("div", "lw-tabs");
    tabsWrap.setAttribute("role", "tablist");
    tabsWrap.setAttribute("aria-label", "LimeWire sections");
    x.body.appendChild(tabsWrap);

    var tabs = {};
    var order = ["search", "monitor", "library"];
    var labels = { search: "🔍 Search", monitor: "📡 Monitor", library: "📚 Library" };

    function makeTab(name) {
      var t = el("button", "lw-tab", labels[name]);
      t.type = "button";
      t.id = "lw-tab-" + name;
      t.setAttribute("role", "tab");
      t.setAttribute("aria-controls", "lw-panel-" + name);
      t.addEventListener("click", function () { showTab(name); });
      t.addEventListener("keydown", function (ev) {
        var i = order.indexOf(name), next = null;
        if (ev.key === "ArrowRight") next = order[(i + 1) % order.length];
        else if (ev.key === "ArrowLeft") next = order[(i + order.length - 1) % order.length];
        if (next) { ev.preventDefault(); showTab(next); tabs[next].btn.focus(); }
      });
      var p = el("div", "lw-panel");
      p.id = "lw-panel-" + name;
      p.setAttribute("role", "tabpanel");
      p.setAttribute("aria-labelledby", t.id);
      p.hidden = true;
      tabsWrap.appendChild(t);
      tabs[name] = { btn: t, panel: p };
      return p;
    }

    var searchPanel = makeTab("search");
    var monitorPanel = makeTab("monitor");
    var libraryPanel = makeTab("library");
    order.forEach(function (n) { x.body.appendChild(tabs[n].panel); });

    /* ---- status bar ---- */
    var status = el("div", "lw-status");
    var bars = el("span", "lw-bars");
    bars.setAttribute("aria-hidden", "true");
    for (var b = 0; b < 4; b++) bars.appendChild(el("i"));
    status.appendChild(bars);
    status.appendChild(el("span", "", "Turbo-Charged connection"));
    var speedEl = el("span", "grow", "↓ 0 KB/s  ↑ 0 KB/s");
    status.appendChild(speedEl);
    status.appendChild(el("span", "", "Sharing 1 file"));
    x.body.appendChild(status);

    /* ---- Search tab ---- */
    var q = el("p", "lw-q");
    q.appendChild(document.createTextNode("Search results for: "));
    q.appendChild(el("b", "", "“" + (sp.intro || "my music") + "”"));
    searchPanel.appendChild(q);

    var table = el("table", "lw-table");
    var thead = el("thead");
    var hr = el("tr");
    [["Name", ""], ["Type", "col-type"], ["Size", "col-size"], ["Speed", ""], ["Quality", "col-quality"], ["", ""]].forEach(function (c) {
      var th = el("th", c[1], c[0]);
      th.scope = "col";
      hr.appendChild(th);
    });
    thead.appendChild(hr);
    table.appendChild(thead);
    var tbody = el("tbody");
    var row = el("tr");
    var nameCell = el("td", "lw-name", "your playlist.mp3");
    row.appendChild(nameCell);
    row.appendChild(el("td", "col-type", kind));
    row.appendChild(el("td", "col-size", sizeText));
    row.appendChild(el("td", "lw-fast", "Turbo-Charged"));
    var qc = el("td", "col-quality");
    qc.appendChild(el("span", "lw-stars", "★★★★★"));
    row.appendChild(qc);
    var dlCell = el("td");
    var dl = el("button", "xp-btn", "Download");
    dl.type = "button";
    dlCell.appendChild(dl);
    row.appendChild(dlCell);
    tbody.appendChild(row);
    table.appendChild(tbody);
    searchPanel.appendChild(table);
    searchPanel.appendChild(el("p", "lw-hint", "tip: click Download to start listening."));

    // use the playlist's real name when we can get it
    var fileName = "";
    function setName(title) {
      fileName = String(title || "").trim().slice(0, 80);
      if (fileName) nameCell.textContent = fileName + ".mp3";
    }
    if (sp.title) {
      setName(sp.title);
    } else {
      withTimeout(fetch("https://open.spotify.com/oembed?url=" + encodeURIComponent("https://open.spotify.com/" + type + "/" + id)), 6000)
        .then(function (r) { if (!r.ok) throw new Error("status"); return r.json(); })
        .then(function (j) { if (j && typeof j.title === "string") setName(j.title); })
        .catch(function () {});
    }

    /* ---- Monitor tab ---- */
    var monEmpty = el("p", "lw-empty", "No downloads yet. Find something in the Search tab!");
    monitorPanel.appendChild(monEmpty);
    var monTable = el("table", "lw-table");
    monTable.hidden = true;
    var mh = el("thead"), mhr = el("tr");
    ["Name", "Status", "Progress", "Speed"].forEach(function (t) {
      var th = el("th", "", t);
      th.scope = "col";
      mhr.appendChild(th);
    });
    mh.appendChild(mhr);
    monTable.appendChild(mh);
    var mb = el("tbody"), mr = el("tr");
    var mName = el("td", "lw-name");
    var mStatus = el("td", "", "");
    var mProgTd = el("td");
    var prog = el("div", "lw-prog");
    prog.setAttribute("role", "progressbar");
    prog.setAttribute("aria-valuemin", "0");
    prog.setAttribute("aria-valuemax", "100");
    prog.setAttribute("aria-valuenow", "0");
    var fill = el("div", "lw-prog-fill");
    prog.appendChild(fill);
    mProgTd.appendChild(prog);
    var mSpeed = el("td", "", "");
    [mName, mStatus, mProgTd, mSpeed].forEach(function (c) { mr.appendChild(c); });
    mb.appendChild(mr);
    monTable.appendChild(mb);
    monitorPanel.appendChild(monTable);

    /* ---- Library tab (the real Spotify player) ---- */
    libraryPanel.classList.add("lw-library");
    libraryPanel.appendChild(el("p", "lw-crumb", "Library › Shared › Now Playing"));
    var playerBox = el("div");
    libraryPanel.appendChild(playerBox);
    var playerMade = false;
    function ensurePlayer() {
      if (playerMade) return;
      playerMade = true;
      var f = el("iframe");
      f.title = "Spotify player";
      f.src = "https://open.spotify.com/embed/" + type + "/" + id + "?theme=0";
      f.height = sp.height || 352;
      f.loading = "lazy";
      f.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
      playerBox.appendChild(f);
    }

    /* ---- tab switching ---- */
    function showTab(name) {
      order.forEach(function (k) {
        var on = k === name;
        tabs[k].btn.setAttribute("aria-selected", on ? "true" : "false");
        tabs[k].btn.tabIndex = on ? 0 : -1;
        tabs[k].panel.hidden = !on;
      });
      if (name === "library") ensurePlayer();
    }

    /* ---- the pretend download ---- */
    var state = "idle";            // idle -> downloading -> done
    var timers = [];
    function later(fn, ms) { timers.push(setTimeout(fn, ms)); return timers[timers.length - 1]; }

    function setProgress(pct) {
      var p = Math.max(0, Math.min(100, Math.round(pct)));
      fill.style.width = p + "%";
      prog.setAttribute("aria-valuenow", String(p));
    }

    function finish() {
      state = "done";
      setProgress(100);
      mStatus.textContent = "Complete";
      mSpeed.textContent = "—";
      speedEl.textContent = "↓ 0 KB/s  ↑ 0 KB/s";
      later(function () { showTab("library"); }, NO_MOTION ? 0 : 800);
    }

    function startDownload() {
      if (state === "downloading") { showTab("monitor"); return; }
      if (state === "done") { showTab("library"); return; }
      state = "downloading";
      mName.textContent = (fileName || "your playlist") + ".mp3";
      monEmpty.hidden = true;
      monTable.hidden = false;
      setProgress(0);
      mStatus.textContent = "Connecting...";
      mSpeed.textContent = "";
      showTab("monitor");
      if (NO_MOTION) { finish(); return; }

      later(function () {
        mStatus.textContent = "Downloading";
        var pct = 0;
        var iv = setInterval(function () {
          pct += 2.5 + Math.random() * 5;
          var kb = Math.round(380 + Math.random() * 520);
          mSpeed.textContent = kb + " KB/s";
          speedEl.textContent = "↓ " + kb + " KB/s  ↑ 0 KB/s";
          if (pct >= 100) { clearInterval(iv); finish(); } else { setProgress(pct); }
        }, 100);
        timers.push(iv);
      }, 700);
    }
    dl.addEventListener("click", startDownload);

    if (sp.startTab === "library") {
      state = "done";
      mName.textContent = "your playlist.mp3";
      showTab("library");
    } else {
      showTab("search");
    }

    if (note) slot.appendChild(note);
  }

  /* ---------- start ---------- */

  var spotifySlot = $("spotifyWindow");
  var discordSlot = $("discordWindow");
  if (spotifySlot) buildSpotify(spotifySlot);
  if (discordSlot) buildDiscord(discordSlot);
})();
