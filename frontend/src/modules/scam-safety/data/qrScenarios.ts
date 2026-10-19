import type { CategoryScenario } from "./smsScenarios.ts";

// ─────────────────────────────────────────────────────────────────────────────
//  FAKE QR-CODE OFFERS — LESSON CONTENT (Stage A)
// ─────────────────────────────────────────────────────────────────────────────

export const QR_LESSON_SECTIONS = [
  {
    heading: "📷 What is a QR Code and 'Quishing'?",
    body: "A QR code (Quick Response code) is a square barcode that your phone camera can scan to open a website, menu, or app. 'Quishing' (QR phishing) happens when scammers create fake QR codes to trick you into visiting dangerous websites, downloading malware, or stealing your coins.",
  },
  {
    heading: "🏷️ The Sticker Swapping Trick",
    body: "Scammers print fake QR stickers and paste them directly on top of genuine QR codes in public places! You might find fake stickers on bike rental locks, parking meters, restaurant table menus, or bus stop posters. Always check if a QR code is a peelable sticker stuck over something else.",
  },
  {
    heading: "🎁 Too-Good-To-Be-True Freebies & Discounts",
    body: "Be suspicious of random posters or flyers offering free gaming currency ('Scan here for 500 Robux!'), free burger vouchers, or massive discounts. Scammers know kids love rewards and use tempting bait to make you scan without thinking.",
  },
  {
    heading: "🔍 Inspect Before You Scan",
    body: "Look closely at the physical code before opening your camera. Is it glued or taped over an existing sign? Is the print blurry or crooked? Does the surrounding poster have strange spelling mistakes or lack official logos? If it looks tampered with, do not scan it.",
  },
  {
    heading: "🌐 Always Check the Link Preview First",
    body: "When you scan a QR code with a modern smartphone or tablet, the camera shows a preview of the web address (URL) before you tap it. Read the address carefully! If it looks scrambled, uses strange letters, or doesn't match the official brand (e.g., 'freepay-gift.invalid' instead of the real website), do NOT tap it.",
  },
  {
    heading: "🚫 Never Download Unknown Apps via QR",
    body: "If scanning a QR code immediately prompts you to download an unknown file, APK, or configuration profile, cancel it immediately. Official apps should only ever be downloaded through official app stores (Google Play Store or Apple App Store).",
  },
  {
    heading: "🛡️ Detective Cub's QR Safety Checklist",
    body: "Rule 1: Never scan random stickers found on lampposts, tables, or park benches. Rule 2: Check the URL preview before tapping. Rule 3: Never enter passwords, PINs, or card numbers after scanning. Rule 4: If you want to visit a company, type their official web address directly into your browser!",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  FAKE QR-CODE OFFERS — ADAPTIVE PRACTICE SCENARIOS (Stage B/C)
// ─────────────────────────────────────────────────────────────────────────────

export const QR_SCENARIOS: CategoryScenario[] = [
  // ── Easy ──────────────────────────────────────────────────────────
  {
    id: 301,
    posterHeadline: "🍔 50% OFF YOUR SCHOOL LUNCH TODAY!",
    contextLocation: "Peelable sticker stuck on top of the school cafeteria table menu",
    qrUrl: "http://school-lunch-50off.fakecanteen-discount.invalid/claim",
    body: "Scan this quick code to unlock an instant 50% discount on today's cafeteria meal! Enter your student ID and parent's payment card to claim your food voucher.",
    correctAnswer: "Suspicious",
    concept: "credentials",
    difficulty: "easy",
    warningSigns: [
      "It is a loose sticker placed on top of the real menu.",
      "The URL domain 'fakecanteen-discount.invalid' is not the school's official website.",
      "Asks for your parent's payment card details for a simple lunch voucher.",
    ],
    explanation:
      "This is a classic sticker-swap quishing attack. Scammers placed a fake sticker over the cafeteria menu to steal credit card information from hungry students.",
    tip: "Inspect physical QR codes for raised edges or stickers placed over official signage. Never input payment info into unverified links.",
  },
  {
    id: 302,
    posterHeadline: "🏛️ National History Museum - Audio Tour Guide",
    contextLocation: "Permanently engraved metal plaque next to the ancient dinosaur exhibit",
    qrUrl: "https://nationalmuseum.gov.lk/exhibits/dinosaur-audio-tour",
    body: "Scan with your smartphone to listen to the free educational audio guide and see 3D fossil models. No registration or payment required.",
    correctAnswer: "Looks Safe",
    concept: "general",
    difficulty: "easy",
    warningSigns: [
      "Permanently printed/engraved on official museum fixture, not a peelable sticker.",
      "Directs to an official government/museum educational domain (.gov.lk).",
      "Explicitly requires no payment, password, or personal details.",
    ],
    explanation:
      "This is a legitimate educational QR code provided by the museum. The domain is official, there is no sticker tampering, and it asks for zero personal information.",
    tip: "Official educational signs from verified venues that don't ask for personal data or payment are safe to explore.",
  },
  // ── Medium ────────────────────────────────────────────────────────
  {
    id: 303,
    posterHeadline: "🚲 City Bike Share — Fast Unlock",
    contextLocation: "Flimsy sticker stuck crookedly over the official barcode on a public rental bike",
    qrUrl: "http://quick-unlock-bikes.pay-portal-fast.invalid",
    body: "Scan to quickly unlock this bike! Pay Rs. 100 deposit via debit card immediately to start riding.",
    correctAnswer: "Suspicious",
    concept: "link",
    difficulty: "medium",
    warningSigns: [
      "Crooked sticker taped over the bike's original painted frame code.",
      "The link points to 'pay-portal-fast.invalid' instead of the city bike service app.",
      "Demands instant card payment on an unverified webpage.",
    ],
    explanation:
      "Scammers frequently target rental bikes and parking meters by sticking fraudulent QR codes over genuine ones to siphon payments to their own accounts.",
    tip: "If a QR code on a public rental vehicle looks like a sticker covering another code, do not scan it. Use the official mobile app directly.",
  },
  {
    id: 304,
    posterHeadline: "📘 Grade 8 Mathematics — Worked Homework Solutions",
    contextLocation: "Printed directly inside the official school textbook published by Ministry of Education",
    qrUrl: "https://moe.gov.lk/curriculum/grade8/math-ch4-solutions.pdf",
    body: "Scan here to view step-by-step worked solutions for Chapter 4 algebra problems on the official curriculum portal.",
    correctAnswer: "Looks Safe",
    concept: "general",
    difficulty: "medium",
    warningSigns: [
      "Professionally printed inside an official curriculum textbook.",
      "Points directly to a secure government education domain (moe.gov.lk).",
      "Simply provides a PDF study resource with no requests for login or payment.",
    ],
    explanation:
      "This QR code is completely safe. It is bound inside an authorized educational textbook and leads directly to free study materials on an official government portal.",
    tip: "Textbook publisher codes that lead to educational documents on official domains are safe study aids.",
  },
  {
    id: 305,
    posterHeadline: "🎮 FREE 1,000 ROBUX & FORTNITE V-BUCKS!",
    contextLocation: "Flyer taped to a bus stop shelter outside a secondary school",
    qrUrl: "http://free-gaming-giftcards.instant-rewards.invalid/claim",
    body: "Scan NOW to generate 1,000 free Robux or V-Bucks code for your account! Limited to the first 50 scanners today. Login to sync your profile.",
    correctAnswer: "Suspicious",
    concept: "prize",
    difficulty: "medium",
    warningSigns: [
      "Promises free gaming currency that normally costs real money.",
      "Taped to a random public bus stop targeting schoolchildren.",
      "Creates artificial urgency ('first 50 scanners') and asks you to 'login' your gaming profile.",
    ],
    explanation:
      "Legitimate gaming companies like Roblox or Epic Games do not give out free premium currency on bus stop flyers. This is designed to steal your gaming password and account inventory.",
    tip: "Never scan flyers in public promising free gaming currency or in-game skins. They are phishing traps to steal your account.",
  },
  // ── Hard ──────────────────────────────────────────────────────────
  {
    id: 306,
    posterHeadline: "📦 Parcel Express — Missed Delivery Notice",
    contextLocation: "Card slipped under your front door with an urgent red warning border",
    qrUrl: "http://postal-express-redelivery-fee.track-post.invalid/pay",
    body: "We attempted to deliver a parcel to your address today. Scan this QR code within 2 hours and pay a Rs. 150 processing fee to reschedule delivery, or your parcel will be destroyed.",
    correctAnswer: "Suspicious",
    concept: "urgency",
    difficulty: "hard",
    warningSigns: [
      "Extremely threatening and urgent language ('parcel will be destroyed').",
      "Demands an unexpected fee to release a delivery you may not have ordered.",
      "The URL 'track-post.invalid' is not the official postal service domain.",
    ],
    explanation:
      "This is a physical delivery scam. Scammers leave cards at houses hoping someone expects a parcel, then collect credit card numbers through the fake payment portal.",
    tip: "Always check with parents or guardians about whether an item was actually ordered before scanning delivery notices.",
  },
  {
    id: 307,
    posterHeadline: "🎲 Space Explorers Board Game — How to Play Video",
    contextLocation: "Printed on the back cover of the official board game rulebook inside the sealed box",
    qrUrl: "https://boardgames.hasbro.com/space-explorers/video-tutorial",
    body: "New to the game? Scan this QR code to watch a 3-minute animated tutorial showing how turns and dice rolls work.",
    correctAnswer: "Looks Safe",
    concept: "general",
    difficulty: "hard",
    warningSigns: [
      "Found inside a sealed, purchased game box from a reputable manufacturer.",
      "Points to the verified manufacturer's domain (hasbro.com).",
      "Only displays a helpful video guide with no signup or personal questions.",
    ],
    explanation:
      "This is a genuine convenience feature included by the game manufacturer. It is printed inside the physical product and leads to an instructional video.",
    tip: "Codes found inside manufacturer packaging that provide instructions without requesting accounts are safe.",
  },
  {
    id: 308,
    posterHeadline: "☕ Smart Cafe — Claim 5 Free Loyalty Stamps",
    contextLocation: "Printed flyer on cafe counter, but a thick sticker has been placed over the original QR code",
    qrUrl: "http://freeloyaltypoints.top/get-stamps-auth?step=1",
    body: "Scan to register your phone number for free stamps! Please enter your phone number and the SMS code sent to you to confirm your identity.",
    correctAnswer: "Suspicious",
    concept: "credentials",
    difficulty: "hard",
    warningSigns: [
      "A sticker has been pasted over the original QR code on the flyer.",
      "The domain uses a suspicious extension '.top' rather than the cafe's domain.",
      "Asks for both your phone number AND the SMS verification code (OTP).",
    ],
    explanation:
      "This attack steals your SMS one-time password (OTP). By requesting the SMS code sent to your phone, scammers can compromise accounts linked to your mobile number.",
    tip: "Never share OTP codes or SMS verification numbers on any webpage opened from a QR code.",
  },
];
