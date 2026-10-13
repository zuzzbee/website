/* =====================================================================
   CHAT, LINKS AND LOGIN SETTINGS
   =====================================================================

   Same rules as config.js: keep the "quote marks" and the commas, and
   don't put a "double quote" inside your text.

   Your Firebase details live in guestbook-config.js and are shared by
   all of these pages, so you only paste them once.
   ===================================================================== */

window.PAGES = {

  /* ------------------------------ CHAT ------------------------------ */

  chat: {
    windowTitle: "chatroom.exe - The Chat Room",
    intro: "say hi to whoever is around. messages show up live.",

    // The purple line at the top of the chat (leave "" to hide it)
    welcomeLine: "*** welcome to zuzz's chat room! please be nice. ***",
    emptyText: "it's quiet in here... say something!",

    // If you change these two max lengths, change them in your Firebase
    // rules too (the rules have the same numbers).
    maxNameLength: 24,
    maxMessageLength: 200,

    // How many of the newest messages to show
    maxMessagesShown: 100,

    // Seconds a visitor must wait between messages (0 = no wait)
    cooldownSeconds: 3,

    // true = refuse messages with web links (stops most spam)
    blockLinks: true,

    // Names visitors can't pick, so nobody pretends to be you.
    // (You can still use them yourself once you're logged in.)
    reservedNames: ["zuzz", "admin", "mod", "moderator"],
    reservedMessage: "that name is reserved. please pick another one.",

    // Shown while Firebase isn't set up yet. Set false to hide the note.
    showSetupNotes: true
  },


  /* ------------------------------ LINKS ----------------------------- */

  links: {
    windowTitle: "links.html - Cool sites i like",
    intro: "some corners of the internet worth a visit:",

    // The folder a link goes in if you don't type a category
    defaultCategory: "Cool Sites",
    emptyText: "no links here yet. check back soon!",

    // These show ONLY until Firebase is set up. After that, you add
    // and remove links from the site itself once you're logged in.
    starterLinks: [
      { title: "Neocities", url: "https://neocities.org", description: "free hosting for hand-made websites", category: "Old Internet" },
      { title: "Internet Archive", url: "https://archive.org", description: "the Wayback Machine, old software, and so much more", category: "Old Internet" },
      { title: "Wiby", url: "https://wiby.me", description: "a search engine for old-style, personal websites", category: "Old Internet" }
    ]
  },


  /* ------------------------------ LOGIN ----------------------------- */

  login: {
    windowTitle: "login.exe - Admin login",
    intro: "this door is just for zuzz. everyone else, enjoy the rest of the site!"
  }
};
