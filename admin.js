(function () {
  var FB = window.ZuzzFirebase;
  function $(id) { return document.getElementById(id); }

  var form = $("settingsForm");
  var statusEl = $("status");
  var container = $("playlistContainer");

  function showStatus(kind, text) {
    statusEl.hidden = false;
    statusEl.className = "gb-status " + kind;
    statusEl.textContent = text;
  }

  function addPlaylistRow(name, link) {
    var div = document.createElement("div");
    div.className = "playlist-row";
    div.style.marginBottom = "10px";
    div.innerHTML = `
      <input type="text" placeholder="Name" class="p-name" value="${name || ''}" style="width:40%">
      <input type="text" placeholder="Link" class="p-link" value="${link || ''}" style="width:40%">
      <button type="button" class="btn remove-btn">X</button>
    `;
    div.querySelector(".remove-btn").addEventListener("click", function() { div.remove(); });
    container.appendChild(div);
  }

  $("addPlaylistBtn").addEventListener("click", function() { addPlaylistRow("", ""); });

  if (!FB || !FB.configured) {
    showStatus("err", "Firebase not configured.");
    return;
  }

  FB.load().then(function (x) {
    var db = x.db;
    var settingsRef = x.fs.doc(db, "siteSettings", "config");

    // Load settings
    x.fs.getDoc(settingsRef).then(function(snap) {
      if (snap.exists()) {
        var data = snap.data();
        if (data.discord) {
          $("discordServerId").value = data.discord.serverId || "";
          $("discordInviteLink").value = data.discord.inviteLink || "";
        }
        if (data.spotify && data.spotify.playlists) {
          data.spotify.playlists.forEach(function(p) { addPlaylistRow(p.name, p.link); });
        }
      }
    });

    // Save settings
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var playlists = [];
      document.querySelectorAll(".playlist-row").forEach(function(row) {
        playlists.push({
          name: row.querySelector(".p-name").value,
          link: row.querySelector(".p-link").value
        });
      });

      x.fs.setDoc(settingsRef, {
        discord: {
          serverId: $("discordServerId").value,
          inviteLink: $("discordInviteLink").value
        },
        spotify: { playlists: playlists }
      }).then(function() {
        showStatus("ok", "Settings saved!");
      }).catch(function(err) {
        showStatus("err", "Error saving: " + err.message);
      });
    });
  });
})();
