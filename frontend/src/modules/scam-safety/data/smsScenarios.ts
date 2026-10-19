import type { CategoryId } from "../services/scamProgress.ts";

export type AnswerChoice = "Suspicious" | "Looks Safe";

export type Concept =
  | "sender"
  | "urgency"
  | "link"
  | "credentials"
  | "prize"
  | "general";

export type CategoryScenario = {
  id: number;
  from?: string;
  subject?: string;
  sender?: string;
  body: string;
  correctAnswer: AnswerChoice;
  concept: Concept;
  difficulty: "easy" | "medium" | "hard";
  warningSigns: string[];
  explanation: string;
  tip: string;

  // Metadata for simulated category views
  posterHeadline?: string;
  contextLocation?: string;
  qrUrl?: string;
  prizeHeading?: string;
  prizeTag?: string;
  platform?: string;
  senderHandle?: string;
  avatarIcon?: string;
  verifiedBadge?: boolean;
  offerHeadline?: string;
  guaranteeBadge?: string;
};


// ─────────────────────────────────────────────────────────────────────────────
//  PHISHING EMAILS — LESSON CONTENT (Stage A)
// ─────────────────────────────────────────────────────────────────────────────

export const PHISHING_LESSON_SECTIONS = [
  {
    heading: "📧 What is a phishing email?",
    body: "A phishing email is a fake message designed to trick you into giving away personal information, clicking on a dangerous link, or downloading something harmful. Scammers make these emails look real — but there are always clues.",
  },
  {
    heading: "🎁 Unexpected prizes and offers",
    body: "If an email says you have won a prize you never entered, or offers you something for free out of nowhere, be careful. Legitimate organisations do not send random prize emails. Ask yourself: Did I sign up for this?",
  },
  {
    heading: "📬 Suspicious sender addresses",
    body: "Always look at the sender's email address, not just the name. Scammers use addresses like support@bank-secure-login.com instead of support@realbank.com. Mismatched or strange domains are a warning sign.",
  },
  {
    heading: "⏰ Urgent messages that pressure you",
    body: "\"Act NOW or lose your account!\" Scammers create urgency to stop you thinking carefully. Real organisations give you time to read and decide. If an email is rushing you, pause and check.",
  },
  {
    heading: "🔗 Suspicious links",
    body: "Do not click links in unexpected emails. Hover over a link (on a computer) to see where it really goes. A link that says 'wisecub.com' could secretly go somewhere else. When in doubt, go to the website yourself.",
  },
  {
    heading: "🔑 Requests for private information",
    body: "No legitimate organisation will ask for your password, PIN, OTP, or payment card number by email. If an email asks for this, it is almost certainly a scam.",
  },
  {
    heading: "✅ Safe actions to take",
    body: "Pause before you click. Check the sender address carefully. Never share passwords, PINs, or OTPs. Avoid suspicious links. If you are unsure, ask a trusted adult or go directly to the real website.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  PHISHING EMAILS — ADAPTIVE PRACTICE SCENARIOS (Stage B/C)
// ─────────────────────────────────────────────────────────────────────────────

export const PHISHING_SCENARIOS: CategoryScenario[] = [
  // ── Easy ──────────────────────────────────────────────────────────
  {
    id: 101,
    from: "prizes@free-win-now.example.invalid",
    subject: "You have won 50,000 rupees! Claim now!",
    body: "CONGRATULATIONS! You have been selected as today's lucky winner. Click the link below to claim your Rs 50,000 prize before 5 PM today or it will expire.",
    correctAnswer: "Suspicious",
    concept: "prize",
    difficulty: "easy",
    warningSigns: [
      "You never entered a competition.",
      "The sender address is from an unknown domain.",
      "It creates extreme urgency with a deadline.",
    ],
    explanation: "This is a classic phishing email. The prize is fake — it is designed to make you click a link or share your details.",
    tip: "If you never entered a competition, you cannot have won one. Always ignore unexpected prize emails.",
  },
  {
    id: 102,
    from: "support@school.example.invalid",
    subject: "Reminder: Your project deadline is tomorrow",
    body: "Hi student, this is a reminder that your science project is due tomorrow at 9 AM. Log in to the school portal to submit your work.",
    correctAnswer: "Looks Safe",
    concept: "general",
    difficulty: "easy",
    warningSigns: [
      "It is a calm reminder with no urgent pressure.",
      "It does not ask for passwords or personal details.",
      "It does not promise prizes or rewards.",
    ],
    explanation: "This email looks like a normal school reminder. It does not ask for private information and does not create unreasonable urgency.",
    tip: "Still check the sender address and go directly to the school portal yourself rather than clicking any link in an email.",
  },
  {
    id: 103,
    from: "security@account-alert-login.example.invalid",
    subject: "URGENT: Your account will be locked in 24 hours",
    body: "Dear user, suspicious activity was detected on your account. To avoid being locked out, please click here and verify your password and PIN immediately.",
    correctAnswer: "Suspicious",
    concept: "credentials",
    difficulty: "easy",
    warningSigns: [
      "It asks for your password and PIN by email.",
      "The sender domain is unfamiliar and suspicious.",
      "Extreme urgency: 24-hour deadline.",
    ],
    explanation: "Legitimate organisations never ask for your password or PIN by email. This is a credential-stealing phishing attempt.",
    tip: "Never share your password or PIN in an email. If you think there is a real problem, go directly to the official website.",
  },
  // ── Medium ────────────────────────────────────────────────────────
  {
    id: 104,
    from: "noreply@gamex-rewards.example.invalid",
    subject: "Your free in-game skin is waiting!",
    body: "Hi Player! You have earned a special reward in GameX. Visit the link below within 10 minutes to claim your free skin before it disappears.",
    correctAnswer: "Suspicious",
    concept: "urgency",
    difficulty: "medium",
    warningSigns: [
      "Unexpected reward you did not earn through normal gameplay.",
      "10-minute deadline creates pressure to act without thinking.",
      "Sender domain does not match the official game.",
    ],
    explanation: "Game rewards are given inside the game, not by email from unknown senders. The urgency is designed to stop you from checking carefully.",
    tip: "Open the game directly and check your in-game inbox. Never click reward links in unexpected emails.",
  },
  {
    id: 105,
    from: "info@library.example.invalid",
    subject: "Your reserved book is ready for collection",
    body: "Hello! The book you reserved at the community library is now available. You can collect it at the front desk anytime before Saturday.",
    correctAnswer: "Looks Safe",
    concept: "general",
    difficulty: "medium",
    warningSigns: [
      "No request for personal information.",
      "No suspicious link to click.",
      "Calm, informational tone with no deadline pressure.",
    ],
    explanation: "This is the kind of email a library legitimately sends. There is no request for passwords, money, or urgent action.",
    tip: "Notice that this email does not ask you to do anything risky. It just provides useful information.",
  },
  {
    id: 106,
    from: "secure-team@wisenet-banking.example.invalid",
    subject: "Verify your identity to continue using your account",
    body: "Dear customer, as part of our security upgrade, we need to verify your identity. Please click the link and enter your account number, date of birth, and mother's maiden name.",
    correctAnswer: "Suspicious",
    concept: "sender",
    difficulty: "medium",
    warningSigns: [
      "Banks never ask for your mother's maiden name or date of birth by email.",
      "The sender domain is not a real bank's official domain.",
      "Requests multiple pieces of sensitive personal information.",
    ],
    explanation: "Real banks do not ask customers to verify personal details via an email link. This is a phishing attempt designed to steal your identity.",
    tip: "If you receive an email claiming to be from your bank, call your bank directly using the number on their official website.",
  },
  // ── Hard ──────────────────────────────────────────────────────────
  {
    id: 107,
    from: "newsletter@wisecub-updates.example.invalid",
    subject: "Your monthly learning summary is ready",
    body: "Hi learner, your WiseCub learning summary for this month is ready. You answered 24 questions and scored 88%. Keep up the great work! View your full report in your dashboard.",
    correctAnswer: "Looks Safe",
    concept: "general",
    difficulty: "hard",
    warningSigns: [
      "Mentions specific personal activity (score, questions).",
      "No request for passwords, money, or sensitive information.",
      "Directs to a dashboard rather than asking you to enter details in the email.",
    ],
    explanation: "This email is informational and does not ask for personal details. It mentions real-sounding data, which makes it look legitimate — and in this case, it is.",
    tip: "A tricky one! Personalised details make emails look real. The key test: does it ask for sensitive information or an urgent click? This one does not.",
  },
  {
    id: 108,
    from: "support@wisecub-help.example.invalid",
    subject: "Action required: Confirm your email to keep access",
    body: "Hi there! To keep your account secure, please confirm your email address by clicking the button below. If you do not confirm within 48 hours, your account will be deactivated.",
    correctAnswer: "Suspicious",
    concept: "urgency",
    difficulty: "hard",
    warningSigns: [
      "48-hour deadline to 'confirm' your account.",
      "Threats of account deactivation create fear.",
      "Unexpected request — you did not ask for a confirmation email.",
    ],
    explanation: "Even though this email looks polished, legitimate services do not threaten account deactivation in unexpected emails. The urgency and threat are warning signs.",
    tip: "If you are concerned, open the service directly in your browser and check your account settings. Never click links in threatening emails.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  SCAM TEXT MESSAGES (SMISHING) — LESSON CONTENT (Stage A)
// ─────────────────────────────────────────────────────────────────────────────

export const SMS_LESSON_SECTIONS = [
  {
    heading: "💬 What is an SMS scam (Smishing)?",
    body: "An SMS scam — often called 'smishing' (SMS + phishing) — is a deceptive text message sent directly to your phone. Scammers pretend to be banks, postal delivery services, game companies, or even friends and family. Their goal is to trick you into clicking dangerous links, handing over passwords, or sending money.",
  },
  {
    heading: "⏰ Panic & false urgency",
    body: "\"Your account will be suspended in 15 minutes!\" or \"Action required immediately!\" Scammers create false urgency so you panic and act without thinking. Legitimate organisations never give you frantic, high-pressure deadlines by text message. When a text pushes you to act instantly, pause and take a breath.",
  },
  {
    heading: "🔗 Shortened links & lookalike websites",
    body: "Scammers frequently include shortened links (like bit.ly) or deceptive web addresses (such as bank-security-login.example.invalid instead of realbank.lk). On a smartphone, it is easy to tap without looking closely. Never tap on links sent in unexpected text messages.",
  },
  {
    heading: "🎁 Fake prizes & unexpected parcel deliveries",
    body: "\"You have won a free iPhone!\" or \"Your package is delayed — update address now.\" If you never entered a competition or are not expecting a parcel, these texts are pure bait. Scammers use exciting prizes or everyday delivery confusion to collect your personal details or credit card info.",
  },
  {
    heading: "🔑 Requests for OTPs, PINs & verification codes",
    body: "Your bank, school, or game service will NEVER text you asking for a one-time password (OTP), two-factor code, or PIN. If anyone asks you to share or forward a code sent to your phone, it is a scammer attempting to take over your account. Treat your verification codes like your house key.",
  },
  {
    heading: "🎭 The 'Hi Mum / Friend in Need' impersonation",
    body: "A common trick is receiving a message from an unfamiliar number saying: 'Hi darling, my phone broke, this is my temporary number. I need urgent money for groceries.' Scammers prey on kindness. Always contact your parent or friend on their known phone number before believing any message from an unfamiliar number.",
  },
  {
    heading: "🛡️ Four golden rules for text safety",
    body: "1. Never tap links in unexpected texts. 2. Never share OTPs, PINs, or passwords with anyone. 3. Do not reply to suspicious messages — replying confirms your phone number is active. 4. If you feel unsure, worried, or pressured, always show the message to a parent, teacher, or trusted adult.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  SCAM TEXT MESSAGES — ADAPTIVE PRACTICE SCENARIOS (Stage B/C)
// ─────────────────────────────────────────────────────────────────────────────

export const SMS_SCENARIOS: CategoryScenario[] = [
  // ── Easy ──────────────────────────────────────────────────────────
  {
    id: 201,
    sender: "LUCKY-WIN",
    body: "CONGRATULATIONS! Your mobile number was selected in the Mega Monsoon Draw to win Rs. 50,000! Click http://mega-prize-claim.example.invalid now to claim your cash before 6 PM today!",
    correctAnswer: "Suspicious",
    concept: "prize",
    difficulty: "easy",
    warningSigns: [
      "You never entered any lottery or lucky draw.",
      "It creates false urgency with a 6 PM expiration deadline.",
      "It demands that you click an unknown web link to claim money.",
    ],
    explanation:
      "This is a classic prize smishing scam. Real prize draws do not contact random mobile numbers with urgent links. If you did not enter, you cannot have won.",
    tip: "Never click links in unexpected prize text messages. Delete the message and do not reply.",
  },
  {
    id: 202,
    sender: "DentalCare",
    body: "Hi Kasun, friendly reminder of your routine dental checkup with Dr. Perera tomorrow at 3:30 PM. Please reply NO if you need to reschedule or call 011-2345678.",
    correctAnswer: "Looks Safe",
    concept: "general",
    difficulty: "easy",
    warningSigns: [
      "It is a standard reminder for an appointment you already made.",
      "It does not ask for passwords, OTPs, or payment card details.",
      "It does not include any suspicious links or threaten you.",
    ],
    explanation:
      "This is a legitimate appointment reminder. It provides clear, expected details and does not try to rush you into making a payment or sharing private information.",
    tip: "Routine appointment reminders that do not ask for private information or money are usually safe.",
  },
  {
    id: 203,
    sender: "AUTH-VERIFY",
    body: "WiseCub Security Alert: Your one-time login code is 849-210. Do not share this with anyone. Our support officer will call you in 5 minutes to confirm this code to unblock your account.",
    correctAnswer: "Suspicious",
    concept: "credentials",
    difficulty: "easy",
    warningSigns: [
      "It claims a support agent will call to ask for your verification code.",
      "One-time passwords (OTPs) should NEVER be told to anyone over the phone or text.",
      "Scammers use this trick to take over your account while you think you are helping support.",
    ],
    explanation:
      "This is a very sneaky OTP interception scam. Real customer support will NEVER ask you to tell them your one-time code. The code is meant for your eyes only.",
    tip: "Never read out or forward an OTP or SMS code to anyone, even if they claim to work for the company.",
  },
  // ── Medium ────────────────────────────────────────────────────────
  {
    id: 204,
    sender: "SpeedyParcel",
    body: "URGENT NOTICE: Your package LK-8812 could not be delivered due to an incorrect street number. Visit http://parcel-redelivery-hub.example.invalid within 2 hours or your package will be returned to sender and discarded.",
    correctAnswer: "Suspicious",
    concept: "urgency",
    difficulty: "medium",
    warningSigns: [
      "Extreme urgency (2 hours) and threat to destroy or discard your package.",
      "You may not even be expecting a delivery.",
      "Directs you to an unfamiliar link that asks for personal address and payment details.",
    ],
    explanation:
      "Fake parcel delivery alerts are among the most common smishing scams. Scammers push you to click a link and pay a 'redelivery fee' or enter private information.",
    tip: "If you are waiting for a real parcel, check the tracking number directly on the official courier app or website, never through a random text link.",
  },
  {
    id: 205,
    sender: "CommunityLibrary",
    body: "Hello! The science textbook you reserved is now ready for collection at the front desk. Please collect it before Saturday at 4 PM. Have a great day!",
    correctAnswer: "Looks Safe",
    concept: "general",
    difficulty: "medium",
    warningSigns: [
      "Calm, informational message with no threats or pressure.",
      "Contains no links and asks for no personal or financial details.",
      "Matches normal library service notification behavior.",
    ],
    explanation:
      "This is a genuine notification from a local library. It does not ask you to click anything, pay any fee, or submit personal credentials.",
    tip: "Notice the lack of panic or pushiness. Safe messages share information without demanding urgent clicks.",
  },
  {
    id: 206,
    sender: "+94 77 999 1234",
    body: "Hi darling, I dropped my phone in water and this is my temporary number! I am at the supermarket checkout and my card is not working. Could you please send Rs. 2,000 urgently via http://fast-pay-friend.example.invalid? Love Mum xx",
    correctAnswer: "Suspicious",
    concept: "sender",
    difficulty: "medium",
    warningSigns: [
      "Unverified new phone number claiming to be a family member.",
      "Emotional pressure ('Love Mum') combined with an urgent money request.",
      "Asks to transfer money through an unknown payment link.",
    ],
    explanation:
      "This is known as the 'Hi Mum / Hi Dad' family impersonation scam. Scammers impersonate parents or relatives in distress to trick children and families into sending money.",
    tip: "If a relative texts from an unknown number asking for money or urgent help, stop and call their known original number or speak to them in person before doing anything.",
  },
  // ── Hard ──────────────────────────────────────────────────────────
  {
    id: 207,
    sender: "SchoolAdmin",
    body: "Notice: Due to heavy rain, today's inter-house football practice has been moved to the indoor sports hall. Normal dismissal time applies. No action needed.",
    correctAnswer: "Looks Safe",
    concept: "general",
    difficulty: "hard",
    warningSigns: [
      "No link, no phone number to call, no payment asked.",
      "Says explicitly 'No action needed'.",
      "Typical school operational announcement for students and parents.",
    ],
    explanation:
      "This is a completely safe informational notice from school. It makes no demands, requests no credentials, and includes no external links.",
    tip: "Messages that simply inform you of a schedule change without requiring action are safe.",
  },
  {
    id: 208,
    sender: "GameHub-Alert",
    body: "Security warning: We noticed an unauthorised login to your GameHub profile from an unknown device. If this was not you, secure your account immediately at http://gamehub.account-protect-center.example.invalid.",
    correctAnswer: "Suspicious",
    concept: "link",
    difficulty: "hard",
    warningSigns: [
      "The web address uses a deceptive subdomain: 'account-protect-center.example.invalid' is NOT the official gamehub domain.",
      "Pretends to be a security alert to make you enter your login password.",
      "Unexpected text message about an account you may or may not have.",
    ],
    explanation:
      "Scammers create lookalike URLs that put the brand name at the start, but the actual domain belongs to the scammer. They want you to enter your username and password on their fake site.",
    tip: "Always look at the end of the domain name before the slash. If in doubt, open your browser and navigate to the official website manually.",
  },
];

export { QR_LESSON_SECTIONS, QR_SCENARIOS } from "./qrScenarios.ts";
export { PRIZE_LESSON_SECTIONS, PRIZE_SCENARIOS } from "./prizeScenarios.ts";
export { IMPERSONATION_LESSON_SECTIONS, IMPERSONATION_SCENARIOS } from "./impersonationScenarios.ts";
export { FINANCIAL_LESSON_SECTIONS, FINANCIAL_SCENARIOS } from "./financialScenarios.ts";

import { QR_LESSON_SECTIONS, QR_SCENARIOS } from "./qrScenarios.ts";
import { PRIZE_LESSON_SECTIONS, PRIZE_SCENARIOS } from "./prizeScenarios.ts";
import { IMPERSONATION_LESSON_SECTIONS, IMPERSONATION_SCENARIOS } from "./impersonationScenarios.ts";
import { FINANCIAL_LESSON_SECTIONS, FINANCIAL_SCENARIOS } from "./financialScenarios.ts";


export function getScenariosForCategory(
  catId: CategoryId | null
): CategoryScenario[] {
  switch (catId) {
    case "sms":
      return SMS_SCENARIOS;
    case "qr":
      return QR_SCENARIOS;
    case "prize":
      return PRIZE_SCENARIOS;
    case "impersonation":
      return IMPERSONATION_SCENARIOS;
    case "financial":
      return FINANCIAL_SCENARIOS;
    case "phishing":
    default:
      return PHISHING_SCENARIOS;
  }
}

export function getLessonSectionsForCategory(
  catId: CategoryId | null
): { heading: string; body: string }[] {
  switch (catId) {
    case "sms":
      return SMS_LESSON_SECTIONS;
    case "qr":
      return QR_LESSON_SECTIONS;
    case "prize":
      return PRIZE_LESSON_SECTIONS;
    case "impersonation":
      return IMPERSONATION_LESSON_SECTIONS;
    case "financial":
      return FINANCIAL_LESSON_SECTIONS;
    case "phishing":
    default:
      return PHISHING_LESSON_SECTIONS;
  }
}

