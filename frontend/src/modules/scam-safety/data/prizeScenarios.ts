import type { CategoryScenario } from "./smsScenarios.ts";

// ─────────────────────────────────────────────────────────────────────────────
//  PRIZE AND GIVEAWAY SCAMS — LESSON CONTENT (Stage A)
// ─────────────────────────────────────────────────────────────────────────────

export const PRIZE_LESSON_SECTIONS = [
  {
    heading: "🎁 What is a Prize and Giveaway Scam?",
    body: "Prize scams occur when scammers tell you that you've won an amazing prize, gift card, new smartphone, or sum of money — even though you never entered any contest! They use the thrill and excitement of winning to make you overlook obvious warning signs.",
  },
  {
    heading: "🎡 The 'Spin the Wheel' & Mystery Box Trap",
    body: "Have you ever seen an online popup with a spinning wheel or treasure boxes where you always land on the 'Grand Prize iPhone'? These games are rigged! Everyone 'wins' every time because the game is just bait to collect your personal details or lure you into a subscription.",
  },
  {
    heading: "💳 The 'Advance Fee' or 'Shipping Fee' Trick",
    body: "The biggest clue of a prize scam: they ask you to pay money to receive your free prize! Scammers claim you need to pay a 'courier charge', 'customs fee', or 'processing tax'. Legitimate competitions NEVER require winners to pay money to claim a prize.",
  },
  {
    heading: "📱 Social Media Tagging & Celebrity Impersonators",
    body: "Scammers create fake accounts pretending to be popular YouTubers, gamers, or brands like MrBeast, PlayStation, or Nike. They tag thousands of kids saying 'Congratulations! You were randomly picked for our Rs. 100,000 fan giveaway!' Real influencers do not ask fans for money or passwords to give away prizes.",
  },
  {
    heading: "⏱️ High-Pressure Countdown Clocks",
    body: "'Claim in 01:59 or your prize will be awarded to another contestant!' Scammers use flashing red countdown clocks to make you panic. They don't want you to take a breath, ask your parents, or think critically.",
  },
  {
    heading: "🔑 Requests for Private Account Details",
    body: "If a giveaway asks for your game account login, Google password, home address, or your parent's bank account or credit card number, stop immediately. Genuine competitions will never ask for your confidential security information.",
  },
  {
    heading: "🛡️ Detective Cub's Golden Prize Rules",
    body: "Rule 1: If you never entered a competition, you DID NOT win. Rule 2: If you must pay any money to receive a prize, it is 100% a scam. Rule 3: Always show prize notifications to a parent or teacher before clicking anything!",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  PRIZE AND GIVEAWAY SCAMS — ADAPTIVE PRACTICE SCENARIOS (Stage B/C)
// ─────────────────────────────────────────────────────────────────────────────

export const PRIZE_SCENARIOS: CategoryScenario[] = [
  // ── Easy ──────────────────────────────────────────────────────────
  {
    id: 401,
    prizeHeading: "🎉 CONGRATULATIONS! You are the 1,000,000th Visitor!",
    prizeTag: "Exclusive Web Winner Alert",
    body: "You have been selected to receive a brand-new iPhone 16 Pro Max (1TB) for FREE! Click 'Claim My Prize' in the next 3 minutes before the countdown reaches zero.",
    correctAnswer: "Suspicious",
    concept: "urgency",
    difficulty: "easy",
    warningSigns: [
      "Classic fake '1,000,000th visitor' popup shown to millions of people simultaneously.",
      "Extreme pressure with an artificial 3-minute countdown clock.",
      "Offers an expensive modern gadget completely out of nowhere without an entry.",
    ],
    explanation:
      "This is one of the oldest and most widespread web scams. The website shows this exact screen to everyone who visits, hoping someone will click and enter personal information.",
    tip: "Websites do not give away high-value smartphones simply for browsing their web page. Close the tab immediately.",
  },
  {
    id: 402,
    prizeHeading: "🥈 Regional School Spelling Bee — 2nd Place Certificate",
    prizeTag: "Official School Commendation",
    sender: "Mrs. Jayawardena (English Dept)",
    body: "Dear Student, congratulations on your outstanding performance placing 2nd in the inter-school spelling bee last Friday! Your official achievement certificate and Rs. 1,000 book voucher can be collected from the school library desk tomorrow during morning interval.",
    correctAnswer: "Looks Safe",
    concept: "general",
    difficulty: "easy",
    warningSigns: [
      "Refers to a specific event you actually participated in last week.",
      "Sent by a recognized teacher from the official school department.",
      "Prize is collected physically in person at the school library without asking for money or bank details.",
    ],
    explanation:
      "This is a genuine school award notification. You participated in the contest, the teacher is known, and the prize is collected directly in person at school with no fees.",
    tip: "Legitimate school prizes are tied to real events you entered and are handed out in person by teachers.",
  },
  // ── Medium ────────────────────────────────────────────────────────
  {
    id: 403,
    prizeHeading: "🏆 International Beverage Summer Mega-Draw Winner!",
    prizeTag: "Rs. 250,000 Cash Prize Notification",
    sender: "Prize-Claims-Department",
    body: "Your phone number was drawn in the Grand Beverage Cash Lottery for Rs. 250,000! To dispatch your certified prize cheque, please transfer a refundable courier & insurance fee of Rs. 2,500 via mobile cash today.",
    correctAnswer: "Suspicious",
    concept: "prize",
    difficulty: "medium",
    warningSigns: [
      "Demands an advance payment of Rs. 2,500 to 'dispatch' the prize.",
      "Claims your phone number was drawn in a lottery you never bought a ticket for.",
      "Asks for funds sent via mobile cash to an unverified individual.",
    ],
    explanation:
      "This is a classic 'advance-fee prize scam'. The scammers keep the Rs. 2,500 'courier fee' and disappear. There is no Rs. 250,000 cheque.",
    tip: "Never pay any money, shipping fee, or customs clearance to claim a prize. Real prizes are 100% free.",
  },
  {
    id: 404,
    prizeHeading: "📚 City Public Library — Summer Readers Badge Awarded",
    prizeTag: "Youth Reading Challenge",
    sender: "Youth Services Librarian",
    body: "Well done! You logged 12 completed books on your library reading card during July. Show this email or your library card barcode at the main counter to pick up your Explorer Badge and bookmark.",
    correctAnswer: "Looks Safe",
    concept: "general",
    difficulty: "medium",
    warningSigns: [
      "Tied to a reading goal you actually tracked with your library card.",
      "No payment or fee demanded.",
      "Redeemed in person at the local public library desk.",
    ],
    explanation:
      "This is an authentic public library challenge reward. It corresponds to real reading activity, asks for no money or sensitive details, and is redeemed in person.",
    tip: "Official community programs celebrating your verified milestones with physical pick-up are safe.",
  },
  {
    id: 405,
    prizeHeading: "⚡ MrBeast Official Team Giveaway Alert!",
    prizeTag: "Private Instagram Message",
    sender: "@mrbeast_official_cashdrop_2026",
    body: "Hey buddy! You commented on our latest video and MrBeast chose you as 1 of 5 lucky fans to get $5,000 cash and a PS5! Send us your gaming account email and password so our sponsor team can credit your account.",
    correctAnswer: "Suspicious",
    concept: "credentials",
    difficulty: "medium",
    warningSigns: [
      "The username handle has extra words and numbers (@mrbeast_official_cashdrop_2026), not the verified channel.",
      "Asks for your private account email AND password.",
      "Large creators never ask for passwords in private DMs to deliver gifts.",
    ],
    explanation:
      "Impersonator bots use celebrity names to run fake giveaways that steal children's gaming accounts and personal login credentials.",
    tip: "Never give your password to anyone claiming to be a celebrity or YouTuber. Look for verified official badges on main profiles.",
  },
  // ── Hard ──────────────────────────────────────────────────────────
  {
    id: 406,
    prizeHeading: "🎮 GameLobby Skin Giveaway — Item Duplication Trick",
    prizeTag: "In-Game Global Chat Announcement",
    sender: "ServerMod_Alex",
    body: "GIVEAWAY EVENT: The first 3 players to trade me their rarest weapon skin will receive the Legendary Mythic Dragon Sword and 10,000 coins duplicated back in 5 minutes! Hurry!",
    correctAnswer: "Suspicious",
    concept: "sender",
    difficulty: "hard",
    warningSigns: [
      "Asks you to trade your valuable item first before receiving anything.",
      "Item 'duplication' is a well-known gaming myth used to steal player items.",
      "The username uses 'ServerMod' to pretend to be an authority figure.",
    ],
    explanation:
      "This is an item-stealing scam common in online games. Once you trade your rare item to the scammer, they immediately disconnect and block you.",
    tip: "There is no such thing as item duplication in reputable games. Never trade valuable in-game items based on promises of future rewards.",
  },
  {
    id: 407,
    prizeHeading: "🎨 District Youth Art Competition — Exhibition Finalist",
    prizeTag: "Arts Council Official Result",
    sender: "secretary@districtschoolarts.edu.lk",
    body: "Congratulations to our Grade 7-9 finalists! Your submission 'Sunset Over the Lake' has been selected for the annual youth gallery exhibition opening this Saturday at 10 AM. Free admission for students and their families.",
    correctAnswer: "Looks Safe",
    concept: "general",
    difficulty: "hard",
    warningSigns: [
      "Names the exact title of artwork you created and submitted.",
      "Sent from an authorized educational domain (.edu.lk).",
      "Invites student and family to a free physical exhibition with no fees.",
    ],
    explanation:
      "This is a legitimate competition notification with accurate details about your artwork submission, sent from an educational institution with an open public exhibition.",
    tip: "Authentic notifications reference specific, verifiable details of your work and do not pressure you for money or data.",
  },
  {
    id: 408,
    prizeHeading: "🛒 Mega Retailer — Unclaimed Gift Card Notice",
    prizeTag: "Digital Reward Voucher Alert",
    sender: "rewards-notice@retail-rewards-club-99.invalid",
    body: "You have an unclaimed Rs. 15,000 digital shopping voucher expiring tonight! To activate and verify your identity, please purchase a Rs. 500 mobile reload card and email the 16-digit secret PIN code back to this address.",
    correctAnswer: "Suspicious",
    concept: "credentials",
    difficulty: "hard",
    warningSigns: [
      "Demands the purchase of a mobile reload / gift card and sharing its secret PIN.",
      "Sender domain 'retail-rewards-club-99.invalid' is unverified and untrusted.",
      "Urgent artificial expiration deadline ('expiring tonight').",
    ],
    explanation:
      "Scammers frequently ask victims to buy gift cards or reload vouchers and send the PIN. Once the scammer enters the PIN, the money is stolen irreversibly.",
    tip: "Anyone asking you to buy a gift card or reload voucher to 'claim' a prize is a scammer. Secret PINs should never be sent over email.",
  },
];
