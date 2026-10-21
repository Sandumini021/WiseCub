import type { CategoryScenario } from "./smsScenarios.ts";

// ─────────────────────────────────────────────────────────────────────────────
//  IMPERSONATION SCAMS — LESSON CONTENT (Stage A)
// ─────────────────────────────────────────────────────────────────────────────

export const IMPERSONATION_LESSON_SECTIONS = [
  {
    heading: "🎭 What is an Impersonation Scam?",
    body: "An impersonation scam happens when someone wears a digital 'mask' to pretend to be someone you know or trust. Scammers might pretend to be your close friend, a family relative, a teacher, a game administrator, or even the police.",
  },
  {
    heading: "🎮 Fake Game Moderators & Admin Badges",
    body: "In games like Roblox, Fortnite, Minecraft, or Discord, scammers often make usernames like 'Roblox_Admin_09' or 'SecurityMod'. They message you: 'Your account has been reported. Send your password now or be banned.' Remember: real game administrators NEVER need or ask for your password!",
  },
  {
    heading: "👥 Cloned Social Media Profiles",
    body: "Scammers can copy your friend's profile picture and bio to create a duplicate account (like @sarah.perera_backup). They then send you a message: 'Hey! My main account got locked. Can you do me a quick favor and send Rs. 1,000 / buy me a gift card?'",
  },
  {
    heading: "🚨 The Emergency & Secrecy Pressure",
    body: "Impersonators love saying 'Please don't tell my parents, it's an emergency!' or 'I'm stuck in town and need money right now.' They use emotional urgency and plead for secrecy so you won't check with the real person or an adult.",
  },
  {
    heading: "👮 Fake Authorities & Tech Support",
    body: "Scammers may call or message claiming to be from the Cyber Police, Microsoft Windows, or the electricity company, saying your computer has an illegal virus or your power will be cut unless you pay a fine. Real police and government officials do not demand instant gift card or mobile payments.",
  },
  {
    heading: "🕵️ Detective Cub's 2-Step Identity Check",
    body: "Whenever someone asks for money, passwords, or favors online, use Detective Cub's 2-Step Check: Step 1: Look at the username, account history, and badge. Step 2: Contact the real person using a DIFFERENT trusted channel (e.g., call them on their known phone or ask them face-to-face in school!).",
  },
  {
    heading: "🛡️ Golden Rule of Account Security",
    body: "Never share passwords, 2-factor authentication codes (OTP), or private photos with anyone online — even if their profile picture looks like your best friend or an official admin. When in doubt, always ask a parent, guardian, or teacher first.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  IMPERSONATION SCAMS — ADAPTIVE PRACTICE SCENARIOS (Stage B/C)
// ─────────────────────────────────────────────────────────────────────────────

export const IMPERSONATION_SCENARIOS: CategoryScenario[] = [
  // ── Easy ──────────────────────────────────────────────────────────
  {
    id: 501,
    platform: "Discord Direct Message",
    senderHandle: "@Official_RobloxSupport_Admin",
    avatarIcon: "🛡️",
    verifiedBadge: false,
    body: "CRITICAL ACCOUNT WARNING: Your account was flagged for suspicious trading activity and will be deleted in 15 minutes. To cancel this deletion, reply immediately with your current password and date of birth.",
    correctAnswer: "Suspicious",
    concept: "credentials",
    difficulty: "easy",
    warningSigns: [
      "Real platform moderators and staff never ask for user passwords.",
      "Threatens immediate account deletion within 15 minutes to trigger panic.",
      "Sent from an unverified direct message account on an external chat app.",
    ],
    explanation:
      "This is an impersonation phishing message. Official game administrators already have system access and will never request your password over chat.",
    tip: "Never give your password to anyone claiming to be a moderator or admin. Real staff will never ask for it.",
  },
  {
    id: 502,
    platform: "School Student Portal Notice",
    senderHandle: "Mr. Wickramasinghe (Grade 8 Homeroom)",
    avatarIcon: "👨‍🏫",
    verifiedBadge: true,
    body: "Good afternoon Class 8B. Please remember that tomorrow is Sports Day wear. Bring your refillable water bottles and sun hats. Normal timetable resumes on Thursday.",
    correctAnswer: "Looks Safe",
    concept: "general",
    difficulty: "easy",
    warningSigns: [
      "Posted on the authenticated school intranet portal, not random social media.",
      "Matches the in-class announcement made by your homeroom teacher.",
      "Does not ask for money, passwords, or personal account credentials.",
    ],
    explanation:
      "This is a legitimate announcement from your verified teacher on the official school management portal. It shares normal school routine information.",
    tip: "Notices inside authenticated school systems with verified staff profiles are safe and informational.",
  },
  // ── Medium ────────────────────────────────────────────────────────
  {
    id: 503,
    platform: "Instagram Direct Message",
    senderHandle: "@kavindu_fernando_backup2",
    avatarIcon: "👦",
    verifiedBadge: false,
    body: "Yo bro, I dropped my phone and had to make this new account. I'm stuck at the bus stand and don't have bus fare to get home. Can you quickly transfer Rs. 500 to this easy-cash number? Don't tell my parents, I'll pay you back tomorrow at school!",
    correctAnswer: "Suspicious",
    concept: "sender",
    difficulty: "medium",
    warningSigns: [
      "New, unverified account using your friend's photo with '_backup2'.",
      "Asks for money to be sent to an unknown easy-cash number.",
      "Explicitly asks for secrecy: 'Don't tell my parents'.",
    ],
    explanation:
      "This is a friend impersonation scam. Scammers download public profile pictures and contact friends asking for urgent small transfers.",
    tip: "If a friend messages from a new profile asking for money, call their known phone number or speak with their parents before sending anything.",
  },
  {
    id: 504,
    platform: "Official Game Forum Announcement",
    senderHandle: "@MinecraftCommunity_Verified",
    avatarIcon: "🟩",
    verifiedBadge: true,
    body: "Scheduled Maintenance: Global multiplayer servers will be offline for routine database optimization this Wednesday between 02:00 UTC and 04:00 UTC. Player inventories will not be affected. No player action is required.",
    correctAnswer: "Looks Safe",
    concept: "general",
    difficulty: "medium",
    warningSigns: [
      "Verified official badge on the verified developer announcement forum.",
      "Informs players in advance of routine server maintenance.",
      "Explicitly says 'No player action is required' and asks for zero information.",
    ],
    explanation:
      "This is an authentic public server maintenance notification from the verified development studio. It makes no demands on players.",
    tip: "Official announcements that explicitly state 'No action required' and come from verified developer channels are safe.",
  },
  {
    id: 505,
    platform: "WhatsApp Voice Call & Text",
    senderHandle: "+94 71 888 4321 (Electricity Emergency Officer)",
    avatarIcon: "⚡",
    verifiedBadge: false,
    body: "URGENT NOTICE: Outstanding bill of Rs. 6,800 detected for your home electricity meter. Line disconnection crew has been dispatched and will cut power in 30 minutes. Pay immediately via mobile reload to this number to stay connected.",
    correctAnswer: "Suspicious",
    concept: "urgency",
    difficulty: "medium",
    warningSigns: [
      "Sent to a child or family member from a personal mobile number, not utility billing.",
      "Demands payment via mobile reload rather than official bank bill payment.",
      "Threatens disconnection within 30 minutes to provoke fear and rushed action.",
    ],
    explanation:
      "This is an authority impersonation scam. Scammers impersonate government utilities and demand payments via gift cards or mobile reloads, which cannot be traced.",
    tip: "Utility companies send formal paper bills and accept payments through official bank portals, never via mobile reload numbers.",
  },
  // ── Hard ──────────────────────────────────────────────────────────
  {
    id: 506,
    platform: "Telegram Direct Message",
    senderHandle: "@Coach_Sunil_ChessClub",
    avatarIcon: "♟️",
    verifiedBadge: false,
    body: "Hello champ! Our junior chess club has entered the National Youth Academy poll. Please help our academy win by clicking this link and voting: http://youth-chess-awards.login-portal.invalid. You will need to log in with your Google account to confirm your vote.",
    correctAnswer: "Suspicious",
    concept: "link",
    difficulty: "hard",
    warningSigns: [
      "The link points to 'login-portal.invalid' which asks for Google account login.",
      "Scammers use trusted figures like sports coaches or music teachers to make kids click.",
      "Voting contests that require entering your email password are credential-stealing traps.",
    ],
    explanation:
      "This is a spear-phishing attack using coach impersonation. The link leads to a fake Google login page designed to steal your email and account passwords.",
    tip: "Never log into your personal email or Google account through links sent in private chat messages.",
  },
  {
    id: 507,
    platform: "Official School WhatsApp Broadcast",
    senderHandle: "St. Peter's School Official Circular Group",
    avatarIcon: "🏫",
    verifiedBadge: true,
    body: "Circular No. 24/2026: Term 2 examination timetable has been uploaded to the school website at https://stpeters.sch.lk/examinations. Hard copies will also be handed out during morning assembly on Monday.",
    correctAnswer: "Looks Safe",
    concept: "general",
    difficulty: "hard",
    warningSigns: [
      "Sent through the admin-only official school announcement broadcast.",
      "Links to the school's verified institutional domain (.sch.lk).",
      "Announces public examination schedules with paper copies provided at school.",
    ],
    explanation:
      "This is an authentic school administrative broadcast. The link points directly to the verified school domain, and physical confirmation will be given at assembly.",
    tip: "Official school broadcast groups managed by school administration with direct links to the official school website are trustworthy.",
  },
  {
    id: 508,
    platform: "Steam Community Chat",
    senderHandle: "VAC_Security_Investigator_K9",
    avatarIcon: "🤖",
    verifiedBadge: false,
    body: "Attention: Another user accidentally reported your Steam ID for illegal item fraud. Our fraud prevention team is about to apply a permanent community trade ban to your inventory. To cancel the pending ban, please accept our trade offer and send your Steam Guard Mobile Authenticator code.",
    correctAnswer: "Suspicious",
    concept: "credentials",
    difficulty: "hard",
    warningSigns: [
      "Classic 'accidental report' scam script commonly used on gaming platforms.",
      "Valve Anti-Cheat (VAC) operates automatically and never chats with users.",
      "Asks for your Steam Guard Mobile Authenticator 2-factor authentication code.",
    ],
    explanation:
      "This is a notorious gaming account hijacking scam. Game security teams never contact players via chat to 'cancel bans', and sharing your authenticator code allows them to take over your account.",
    tip: "Never give 2-factor authenticator codes to anyone. Anyone asking for your security code is an impersonator attempting to steal your account.",
  },
];
