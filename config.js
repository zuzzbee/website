/* =====================================================================
   ZUZZ'S CORNER OF THE INTERNET  -  SETTINGS FILE
   =====================================================================

   THIS IS THE ONLY FILE YOU NEED TO EDIT to change your words, links,
   music, and menu. Change the text between the "quote marks" and save.

   THE 3 RULES:
   1. Keep the "quote marks" around text, and keep the commas at the
      end of each line.
   2. Don't put a "double quote" INSIDE your text. Apostrophes (') are
      totally fine. (Example: "zuzz's page" works great.)
   3. If something breaks, undo your last change. It's almost always a
      missing quote mark or comma.

   Want to change COLORS instead? Open style.css. The colors are in
   plain English at the very top.
   ===================================================================== */

window.SITE = {

  /* ------------------------- TOP OF THE PAGE ------------------------- */

  // The text shown on the browser tab
  browserTabTitle: "zuzz's corner of the internet, hello!",

  // The text in the blue bar at the very top of the page
  topBarTitle: "Netscam Navigator - [zuzz's corner of the internet]",

  // The big rainbow heading
  headline: "welcome to zuzz's corner of the internet!",

  // The small yellow line under the heading
  tagline: "you are visitor number something of very few. thanks for stopping by.",

  // The text that scrolls across the page (leave "" to hide it)
  scrollingText: "*** new: this site is under construction *** sign the guestbook before you leave *** ",

  // The name shown on the bottom taskbar button
  taskbarText: "zuzz's corner of the internet",


  /* --------------------------- SPOTIFY BOX --------------------------- */

  spotify: {
    show: true,                       // true = show this box, false = hide it
    windowTitle: "Now Playing - Spotify",
    intro: "the most vibiest playlist ever created:",

    // HOW TO GET YOUR LINK: In Spotify, right-click a playlist, album,
    // song or artist > Share > Copy link. Paste it between the quotes.
         link: "https://open.spotify.com/playlist/7vMRlGd6w1yoG7VbJA2GMp?si=94505c3efc004484",

    // Height of the player in pixels. Use 352 for playlists/albums,
    // and 152 for a single song.
    height: 352
  },


  /* --------------------------- DISCORD BOX --------------------------- */

  discord: {
    show: true,                       // true = show this box, false = hide it
    windowTitle: "Chat Room - Discord",
    intro: "the chatroom of y2k26 :D",

    // HOW TO GET YOUR SERVER ID:
    //  1. In Discord, go to Server Settings > Widget
    //  2. Turn ON "Enable Server Widget"
    //  3. Copy the Server ID shown on that page and paste it below
    serverId: "1247345874502156380",

    // Height of the box in pixels
    height: 400
  },


  /* --------------------------- ABOUT BOX ----------------------------- */

  about: {
    show: true,
    windowTitle: "readme.txt",
    heading: "hi, i'm zuzz.",

    // Each line below becomes its own paragraph. Add or remove lines freely.
    paragraphs: [
      "this is my little corner of the web. i'm still vibe-coding it, so things will move around, break, and get better. pick a page from the menu and have a look around.",
    ],

    // The blinking red "NEW!" line. Leave "" to hide it.
    newNote: "more pages coming soon, courtesy of Claude :D."
  },


  /* ----------------------- THE MENU ON THE RIGHT --------------------- */

  // Each item is one button. To ADD a button, copy a whole line
  // (from the { to the }, ) and paste it where you want it.
  // To REMOVE one, delete its line.
  //
  //   icon = the little picture (any emoji works)
  //   name = the big text on the button
  //   note = the small text underneath (use "" for none)
  //   page = the file it opens. Make a file with this exact name
  //          in your GitHub repo, or the link will say "404".
  menu: [
    { icon: "🏠", name: "Home",      note: "you are here",          page: "index.html" },
    { icon: "🙋", name: "About Me",  note: "who is zuzz?",          page: "about.html" },
    { icon: "💾", name: "Projects",  note: "things i've made",      page: "projects.html" },
    { icon: "📝", name: "Blog",      note: "thoughts and updates",  page: "blog.html" },
    { icon: "🖼️", name: "Gallery",   note: "pictures",              page: "gallery.html" },
    { icon: "🔗", name: "Links",     note: "cool sites i like",     page: "links.html" },
    { icon: "📖", name: "Guestbook", note: "say hi",                page: "guestbook.html" }
  ],

  menuTitle: "Navigator",


  /* ------------------------- SITE INFO BOX --------------------------- */

  siteInfoTitle: "Site Info",

  // The number on the visitor counter. This is just a number you type
  // in yourself. It does not count real visitors.
  visitorCount: 42,

  // The little badges. Each [ ] is one badge, and each "quoted" piece
  // inside is one line of text on it. Set yellow to true for a yellow badge.
  badges: [
    { lines: ["UNDER", "CONSTRUCTION"], yellow: true },
    { lines: ["BEST VIEWED", "800x600"] },
    { lines: ["MADE BY", "HAND"] }
  ],


  /* ------------------------------ FOOTER ----------------------------- */

  // Your name in the copyright line at the bottom (the year updates itself)
  footerName: "zuzz",


  /* --------------------------- HELP NOTES ---------------------------- */

  // The little yellow "how do I change this?" notes under the Spotify and
  // Discord boxes are reminders for YOU. Once your boxes are working, set
  // this to false so visitors don't see them.
  showHelpNotes: false
};
