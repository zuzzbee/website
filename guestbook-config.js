/* =====================================================================
   GUESTBOOK SETTINGS
   =====================================================================

   Same rules as config.js: keep the "quote marks" and the commas, and
   don't put a "double quote" inside your text.

   UNTIL YOU PASTE YOUR FIREBASE DETAILS BELOW, the guestbook runs in
   DEMO MODE: it works, but messages are only saved in the browser of
   whoever typed them. To share messages between all visitors, follow
   the Firebase setup steps and paste the details into the "firebase"
   section below.
   ===================================================================== */

window.GUESTBOOK = {

  /* ----------------------------- WORDS ------------------------------ */

  windowTitle: "guestbook.exe - Sign my guestbook",
  intro: "leave a message and tell me you stopped by!",
  entriesTitle: "Messages from visitors",
  emptyText: "no messages yet. be the first to sign!",

  /* ----------------------------- LIMITS ----------------------------- */

  // If you change the two max lengths, change them in your Firebase
  // rules too (the rules have the same numbers).
  maxNameLength: 30,
  maxMessageLength: 300,

  // How many of the newest messages to show
  maxEntriesShown: 50,

  // Seconds a visitor must wait between posts (0 = no wait)
  cooldownSeconds: 30,

  // true = refuse messages that contain web links (stops most spam)
  blockLinks: true,


  /* ----------------------- WHAT VISITORS SEE ------------------------ */

  blockedMessage: "please keep it friendly! your message or name has a word that isn't allowed here.",
  linkMessage: "links aren't allowed in the guestbook, sorry!",

  // Shows the yellow "demo mode" note while Firebase isn't set up.
  // Set to false once everything works.
  showSetupNotes: true,


  /* ---------------------------- FIREBASE ---------------------------- */

  // In Firebase: Project settings > Your apps > Web app > copy the
  // values from "firebaseConfig" into the quotes below.
  firebase: {
  apiKey: "AIzaSyAFL2RptqGSsmWY2Su5AcTElrQnthoasJA",
  authDomain: "web-guest-page.firebaseapp.com",
  projectId: "web-guest-page",
  storageBucket: "web-guest-page.firebasestorage.app",
  messagingSenderId: "304643326176",
  appId: "1:304643326176:web:5b89a747924aa585b45085",
  measurementId: "G-97CNN9MXRH"
},


  /* ------------------------ BLOCKED WORDS LIST ----------------------- */

  // Any message or name containing one of these words is refused.
  // It also catches versions like "sh1t", "f u c k", "fuuuck" and
  // "shitty". To block a new word, add it on a new line in quotes with a
  // comma after it. To allow a word, delete its line. Use lowercase
  // letters only.
  blockedWords: [
    "fuck",
    "shit",
    "bitch",
    "bastard",
    "asshole",
    "ass",
    "cunt",
    "dick",
    "cock",
    "pussy",
    "slut",
    "whore",
    "twat",
    "wank",
    "bollocks",
    "piss",
    "nigger",
    "nigga",
    "faggot",
    "fag",
    "retard",
    "tranny",
    "kike",
    "spic",
    "chink",
    "kys",
    "killyourself"
  ]
};
