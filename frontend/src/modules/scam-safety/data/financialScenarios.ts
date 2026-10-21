import type { CategoryScenario } from "./smsScenarios.ts";

// ─────────────────────────────────────────────────────────────────────────────
//  DECEPTIVE FINANCIAL OFFERS — LESSON CONTENT (Stage A)
// ─────────────────────────────────────────────────────────────────────────────

export const FINANCIAL_LESSON_SECTIONS = [
  {
    heading: "💰 What are Deceptive Financial Offers?",
    body: "Deceptive financial offers are tricks that promise quick, easy money, 'guaranteed' massive profits, or secret investment systems. Scammers take advantage of people's desire to earn money or grow their allowance, but in reality, only the scammer gets rich.",
  },
  {
    heading: "⚡ The 'Money Doubler' Myth",
    body: "'Send Rs. 1,000 today and receive Rs. 2,000 back in 24 hours guaranteed!' In the real world, no bank, investor, or computer algorithm can double your money overnight with zero risk. Anyone who promises guaranteed high profits in hours or days is stealing your money.",
  },
  {
    heading: "🎮 In-Game Currency & Skin Gambling Scams",
    body: "Scammers prey on young gamers by advertising secret bots or websites that claim to 'multiply your Robux, V-Bucks, or game skins'. Once you deposit your in-game coins or rare skins, the website locks up or disappears completely.",
  },
  {
    heading: "💼 Fake 'Easy Online Tasks & Jobs' for Teens",
    body: "You might see ads saying: 'Earn Rs. 3,000 every day just by watching 5 short video clips or liking posts on TikTok!' But when you join, they tell you: 'To unlock your earnings, you must first deposit an onboarding fee of Rs. 1,500.' A real job pays you — you never pay to work!",
  },
  {
    heading: "🔺 Pyramid Schemes & 'Invite 5 Friends'",
    body: "Some schemes ask you to pay a membership fee, and promise you will get rich if you recruit five of your friends or classmates to also pay. These are called pyramid schemes. They are illegal because there is no real product being sold — only money taken from new recruits until the system collapses.",
  },
  {
    heading: "🏦 Real Banking vs Scam Promises",
    body: "Real financial institutions like regulated commercial banks offer safe, steady interest (like 4% to 8% per year) on junior savings accounts. They are supervised by national central banks and have physical branches with legal consumer protections.",
  },
  {
    heading: "🛡️ Detective Cub's Financial Safety Shield",
    body: "Rule 1: If it sounds too good to be true, it IS too good to be true. Rule 2: High returns ALWAYS come with high risk — 'guaranteed zero-risk profit' is always a scam. Rule 3: Never send your allowance, virtual coins, or card details to strangers on the internet. Always ask your parents first!",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  DECEPTIVE FINANCIAL OFFERS — ADAPTIVE PRACTICE SCENARIOS (Stage B/C)
// ─────────────────────────────────────────────────────────────────────────────

export const FINANCIAL_SCENARIOS: CategoryScenario[] = [
  // ── Easy ──────────────────────────────────────────────────────────
  {
    id: 601,
    offerHeadline: "🚀 24-HOUR POCKET MONEY MULTIPLIER!",
    guaranteeBadge: "100% Guaranteed 3X Profit",
    sender: "QuickRich Crypto Bot",
    body: "Student Special! Send Rs. 500 via mobile wallet to our automated trading algorithm today. Within 24 hours, our AI will return Rs. 1,500 directly into your wallet. Zero risk, instant payout!",
    correctAnswer: "Suspicious",
    concept: "prize",
    difficulty: "easy",
    warningSigns: [
      "Promises to triple your money (300% return) in only 24 hours.",
      "Claims 'zero risk', which is mathematically impossible in real investing.",
      "Requires sending real money to an unverified mobile wallet number.",
    ],
    explanation:
      "This is a classic 'money doubler' scam. As soon as you send your Rs. 500, the scammer blocks you and you never see your money again.",
    tip: "No legitimate business or algorithm can guarantee tripling your money in 24 hours. Never send money to 'multiplier' schemes.",
  },
  {
    id: 602,
    offerHeadline: "🏦 Wise Junior Savings Account — National Bank",
    guaranteeBadge: "Regulated by Central Bank",
    sender: "National Commercial Bank of Sri Lanka",
    body: "Open a Junior Savers Account with your parent or guardian. Earn a secure 5.5% annual interest on your balance, with free online passbook viewing and deposit insurance up to Rs. 1,100,000.",
    correctAnswer: "Looks Safe",
    concept: "general",
    difficulty: "easy",
    warningSigns: [
      "Offers realistic, steady annual interest (5.5% per year, not per day).",
      "Requires opening the account with a parent or legal guardian.",
      "Fully regulated by the Central Bank with official statutory deposit insurance.",
    ],
    explanation:
      "This is a legitimate junior savings program from a regulated commercial bank. The interest rate is realistic and funds are legally protected.",
    tip: "Official banks offer modest, steady growth and require parental guardianship for student accounts.",
  },
  // ── Medium ────────────────────────────────────────────────────────
  {
    id: 603,
    offerHeadline: "📈 Student VIP Passive Income Club",
    guaranteeBadge: "Daily Automatic Dividends",
    sender: "Telegram Channel: @StudentWealthHacks",
    body: "Deposit Rs. 2,000 into our private cloud mining pool and receive Rs. 200 deposited into your bank every single day for life! Over 10,000 students already joined.",
    correctAnswer: "Suspicious",
    concept: "link",
    difficulty: "medium",
    warningSigns: [
      "Promises 10% daily return (Rs. 200/day on Rs. 2,000), which is completely unsustainable.",
      "Promoted through an anonymous Telegram channel with zero legal business registration.",
      "Uses fake social proof ('over 10,000 students already joined') to create FOMO (fear of missing out).",
    ],
    explanation:
      "This is a Ponzi scam. Scammers might pay tiny dividends to the first few people using money from new victims, then vanish with everyone's deposits.",
    tip: "Any scheme promising high daily passive income from an anonymous chat group is an illegal Ponzi scheme.",
  },
  {
    id: 604,
    offerHeadline: "🎪 School Annual Entrepreneurship Fair",
    guaranteeBadge: "Commerce Society Project",
    sender: "School Commerce Club & Teacher-in-Charge",
    body: "Grade 7-10 Students: Register a team table for the annual school market day. Sell your handmade bookmarks, baked snacks, or crafts to teachers and visitors. All revenue earned belongs 100% to your student team.",
    correctAnswer: "Looks Safe",
    concept: "general",
    difficulty: "medium",
    warningSigns: [
      "Organised by school commerce teachers on school grounds.",
      "Revenue comes from creating and selling actual tangible products (crafts, snacks).",
      "No upfront investment fees or secret recruitment requirements.",
    ],
    explanation:
      "This is an educational school event teaching practical business skills. Students make real products and earn money from real sales.",
    tip: "Real entrepreneurship involves creating value, making items, or providing useful services, not secret financial hacks.",
  },
  {
    id: 605,
    offerHeadline: "💻 Student Work-From-Home: Video Reviewer",
    guaranteeBadge: "Rs. 4,000 Daily Payout",
    sender: "Global Media Rating Jobs",
    body: "Easy remote job for teenagers! Earn Rs. 4,000 daily simply by watching and giving 5-star ratings to 10 YouTube clips. To begin today, deposit a Rs. 1,500 onboarding software kit fee via bank transfer.",
    correctAnswer: "Suspicious",
    concept: "credentials",
    difficulty: "medium",
    warningSigns: [
      "Requires you to PAY money (Rs. 1,500 'software kit fee') to start working.",
      "Offers an unrealistically high wage for doing almost no work (Rs. 4,000 for 10 clicks).",
      "Legitimate employers never demand upfront fees from workers.",
    ],
    explanation:
      "This is an upfront-fee employment scam. Once you transfer the Rs. 1,500 'kit fee', the scammer cuts contact and there are no video tasks.",
    tip: "Never pay money to apply for or start a job. Legitimate employers pay you for your work, never the other way around.",
  },
  // ── Hard ──────────────────────────────────────────────────────────
  {
    id: 606,
    offerHeadline: "🔺 Peer-to-Peer Student Circle Investment",
    guaranteeBadge: "Fast Circle Progression",
    sender: "WhatsApp Group: 'Circle of Abundance 2026'",
    body: "Join our student money flower! Pay Rs. 1,000 to enter the outer ring. Once you invite 4 classmates who also pay Rs. 1,000 each, you move to the center and collect Rs. 8,000 from the next group!",
    correctAnswer: "Suspicious",
    concept: "sender",
    difficulty: "hard",
    warningSigns: [
      "There is no actual product, service, or investment — only money reshuffled between people.",
      "Income strictly depends on recruiting 4 new classmates who must each pay.",
      "This is the textbook definition of an illegal pyramid scheme (sou-sou / money circle).",
    ],
    explanation:
      "This is a pyramid scheme. Inevitably, the scheme runs out of new classmates to recruit, and the students in the outer circle lose all their money.",
    tip: "Any scheme where your profits come purely from recruiting friends to put in money is an illegal pyramid scam.",
  },
  {
    id: 607,
    offerHeadline: "📜 Commercial Bank Fixed Deposit Certificate",
    guaranteeBadge: "Government Insured Financial Instrument",
    sender: "Bank Branch Manager (In-Person Issuance)",
    body: "Official Fixed Deposit Receipt issued at the branch counter for Rs. 10,000 deposited for 12 months at 8.0% annual interest rate. Maturity value Rs. 10,800 payable upon presentation of original certificate.",
    correctAnswer: "Looks Safe",
    concept: "general",
    difficulty: "hard",
    warningSigns: [
      "Issued physically in-person at an authorized bank branch counter.",
      "Clear, legally binding contract with transparent fixed rate of 8% per annum.",
      "Explicit maturity value backed by a licensed financial institution.",
    ],
    explanation:
      "This is a genuine fixed deposit certificate from a licensed bank. It provides clear, realistic terms and a legally binding paper audit trail.",
    tip: "Official branch transactions with signed certificates and realistic annual interest rates are safe financial savings tools.",
  },
  {
    id: 608,
    offerHeadline: "💎 Discord Free Nitro Multiplier Trick",
    guaranteeBadge: "Exclusive Secret Loophole",
    sender: "Direct Message from 'NitroGiveawayMaster'",
    body: "Want free Discord Nitro for 1 whole year? Just lend me your parent's debit card number and CVV code for 60 seconds to verify an overseas trial account. I swear nothing will be charged and you get free Nitro instantly!",
    correctAnswer: "Suspicious",
    concept: "credentials",
    difficulty: "hard",
    warningSigns: [
      "Asks for parent's debit card number AND 3-digit CVV security code.",
      "Claims it is 'just for verification' and 'won't charge anything'.",
      "Sent by a stranger over Discord direct messages promising free premium subscriptions.",
    ],
    explanation:
      "The scammer will immediately charge unauthorized transactions or empty the card balance. Sharing card numbers and CVV codes gives thieves full access to steal money.",
    tip: "Never share credit card numbers, expiry dates, or CVV codes with anyone online, regardless of what free subscription they promise.",
  },
];
