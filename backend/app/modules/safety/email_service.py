"""
email_service.py

Safe educational email simulation service for WiseCub Scam Safety.
Sends consented educational emails to parents/guardians for each of the
six Scam Safety levels:
  1. phishing      (Phishing emails)
  2. sms           (Scam text messages)
  3. qr            (Fake QR-code offers)
  4. prize         (Prize and giveaway scams)
  5. impersonation (Impersonation scams)
  6. financial     (Deceptive financial offers)

Design & Safety Rules:
- Never sends real malicious content or points to external third-party sites.
- Controlled educational destination only: WiseCub safety debriefing page.
- Never collects passwords, credentials, OTPs, or financial data.
- If SMTP is not configured in settings, safely returns status="not_configured"
  with clear diagnostic information — never fakes delivery.
- Uses Python standard library (smtplib, email.mime) with no extra dependencies.
"""

from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import logging
import smtplib
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)

# Template data for each of the six Scam Safety levels
LEVEL_TEMPLATES: dict[str, dict[str, Any]] = {
    "phishing": {
        "level_number": "1",
        "category_id": "phishing",
        "scenario_id": "phishing_cloud_quota_warning",
        "title": "Level 1: Phishing Emails",
        "scenario_name": "School Cloud Storage Quota Alert",
        "fictional_sender_name": "Student Cloud Portal Alerts",
        "fictional_sender_email": "security-alerts@student-cloud-portal.net",
        "email_subject": "[Urgent Notice] Student Library Storage Quota Exceeded - Account Suspension in 24 Hours",
        "preview": "Your cloud storage quota exceeded the 5GB limit. Unverified accounts will be permanently wiped tonight...",
        "simulated_body": (
            "Dear Student,\n\n"
            "Our system detected that your cloud storage quota exceeded the 5GB limit allocated to student accounts. "
            "Because of scheduled server maintenance tonight at midnight, all unverified accounts with exceeded quotas will be permanently wiped.\n\n"
            "To prevent your assignments, course notes, and uploaded projects from being deleted, you must verify your student portal identity "
            "immediately through the security gateway below.\n\n"
            "Thank you,\n"
            "Student Cloud Support Operations"
        ),
        "call_to_action": "Verify Student Account & Protect Files",
        "display_link_text": "http://student-cloud-portal.net/auth-verify?token=lib-9481",
        "red_flags": [
            "Creates artificial 24-hour urgency to panic the student into reacting without thinking",
            "Threatens devastating consequences (permanent assignment and file deletion)",
            "Unverifiable sender domain ('student-cloud-portal.net' instead of your official school domain)",
            "Directs to an unverified external login gateway to enter credentials",
        ],
        "learning_goal": "Official school portals never threaten to delete all your work within 24 hours through an unexpected email link.",
        "follow_up": {
            "question": "What is the safest action if you receive an urgent email threatening to wipe your school files within 24 hours?",
            "options": [
                "Click the verification link right away to keep your files safe",
                "Do not click any link; verify with your teacher or check your official school portal directly",
                "Forward the email to all your classmates to warn them",
                "Reply to the email with your password so they can verify you manually",
            ],
            "correct_index": 1,
            "explanation": "Never click verification links in panic-inducing emails. Always navigate to your official school system directly or ask a teacher in person.",
        },
    },
    "sms": {
        "level_number": "2",
        "category_id": "sms",
        "scenario_id": "sms_courier_clearance_fee",
        "title": "Level 2: Scam Text Messages",
        "scenario_name": "QuickDrop Courier Parcel Release",
        "fictional_sender_name": "QuickDrop Dispatch Hub",
        "fictional_sender_email": "dispatch-notice@quickdrop-logistics.org",
        "email_subject": "Delivery Exception Notice: Action required to release your package #QD-88124",
        "preview": "Your parcel could not be delivered due to an unpaid dispatch fee of $1.85. Confirm address within 2 hours...",
        "simulated_body": (
            "Notice for Package #QD-88124:\n\n"
            "Your parcel could not be delivered to your address this morning due to an unpaid dispatch clearance charge of $1.85. "
            "Our driver cannot complete delivery without this mandatory customs fee payment.\n\n"
            "Please follow our mobile clearance link within 2 hours to confirm your delivery address and authorize release. "
            "Otherwise, your parcel will be marked abandoned and returned to sender."
        ),
        "call_to_action": "Confirm Address & Release Parcel ($1.85)",
        "display_link_text": "http://quickdrop-logistics.org/release/QD-88124",
        "red_flags": [
            "Unexpected package alert when you never ordered anything with this courier",
            "Requests a small fee ($1.85) to lure you into entering credit card details",
            "2-hour countdown designed to rush you into paying without checking with a parent",
            "Vague description with no merchant receipt or tracking history",
        ],
        "learning_goal": "Delivery scam messages lure victims with tiny clearance fees to harvest payment cards. Real couriers never demand immediate card payments via random links.",
        "follow_up": {
            "question": "Why do delivery scammers often ask for a very small fee like $1.85 instead of $500?",
            "options": [
                "Because shipping costs are very cheap for scammers",
                "To make the request seem harmless so victims readily type full credit card and CVV numbers onto a fake site",
                "Because the delivery driver actually needs coffee money",
                "To verify that your postal code exists",
            ],
            "correct_index": 1,
            "explanation": "Scammers use tiny fees so victims don't hesitate, allowing them to steal your full card credentials.",
        },
    },
    "qr": {
        "level_number": "3",
        "category_id": "qr",
        "scenario_id": "qr_canteen_pizza_voucher",
        "title": "Level 3: Fake QR-Code Offers",
        "scenario_name": "Student Canteen Free Meal Voucher",
        "fictional_sender_name": "Student Cafeteria Rewards Club",
        "fictional_sender_email": "rewards@canteen-campus-perks.net",
        "email_subject": "Student Appreciation Perk: Claim your free pizza combo & drink voucher!",
        "preview": "Our campus food partner is giving away 500 free pizza combos today. Scan your coupon token before 5 PM...",
        "simulated_body": (
            "Congratulations Student!\n\n"
            "As part of Student Appreciation Month, our campus food partner is giving away 500 free pizza combos and drink coupons to students today.\n\n"
            "To claim your voucher code, click the link below to scan your digital coupon token and enter your mobile phone number. "
            "Vouchers are strictly first-come, first-served and expire at 5:00 PM today!"
        ),
        "call_to_action": "Claim Free Pizza Voucher Token",
        "display_link_text": "http://canteen-campus-perks.net/claim?code=PIZZA500",
        "red_flags": [
            "Unsolicited free food voucher from an unofficial third-party domain",
            "Artificial scarcity ('only 500 vouchers', 'expires at 5:00 PM')",
            "Requests personal mobile number to 'redeem' free perks (often signs you up for costly premium SMS services)",
            "QR/link traps trick students into phishing forms or unverified downloads ('Quishing')",
        ],
        "learning_goal": "Beware of 'Quishing' and free perk traps. Scammers use promises of free food or prizes to lure children into giving away personal contact details.",
        "follow_up": {
            "question": "What is the primary danger when an email or flyer offers a 'Free Pizza Voucher' by clicking an unfamiliar link or scanning a QR code?",
            "options": [
                "The pizza might have toppings you do not like",
                "The link may lead to a credential-harvesting phishing page or paid SMS subscription trap",
                "The school cafeteria might run out of boxes",
                "You might get too much free food",
            ],
            "correct_index": 1,
            "explanation": "Free food scams prey on the desire for free treats to trick students into phishing forms or subscription traps.",
        },
    },
    "prize": {
        "level_number": "4",
        "category_id": "prize",
        "scenario_id": "prize_gamer_headset_lottery",
        "title": "Level 4: Prize and Giveaway Scams",
        "scenario_name": "MegaGamer Mystery Loot Box & Gift Card",
        "fictional_sender_name": "MegaGamer Mystery Rewards",
        "fictional_sender_email": "winner-claims@gamer-mystery-giveaways.org",
        "email_subject": "Winner Notification: You were chosen for a $250 Tech Store Gift Card!",
        "preview": "Your email was randomly chosen in our Youth Gaming Hardware Giveaway! Claim your $250 gift card and mystery box...",
        "simulated_body": (
            "OFFICIAL WINNER ALERT!\n\n"
            "Your email was randomly chosen in our Youth Gaming Hardware Giveaway! You have won a $250 Gaming Tech Gift Card + Mystery Loot Box!\n\n"
            "To dispatch your prize package, please claim your ticket below. A small shipping handling fee of $3.99 is required to cover courier postage."
        ),
        "call_to_action": "Claim $250 Mystery Gift Card ($3.99 Postage)",
        "display_link_text": "http://gamer-mystery-giveaways.org/claim-loot?id=WIN-250",
        "red_flags": [
            "You won a high-value prize in a raffle or contest you never entered",
            "Requires paying money ($3.99) upfront to receive a supposedly 'free' prize",
            "High-value incentives ($250 card) used as psychological bait to capture credit card numbers",
        ],
        "learning_goal": "The golden rule of prize safety: Legitimate giveaways NEVER require you to pay a fee or enter payment card numbers to receive a prize you won.",
        "follow_up": {
            "question": "If you receive an email stating you won a $250 prize, but you must pay $3.99 shipping first, what is the truth?",
            "options": [
                "It is a legitimate offer and $3.99 is very cheap for a $250 prize",
                "It is a classic prize scam; real contests never require paying money to claim a prize",
                "You should borrow a family card to pay quickly",
                "You should negotiate the shipping fee with the sender",
            ],
            "correct_index": 1,
            "explanation": "If you have to pay money to collect a prize, it is ALWAYS a scam.",
        },
    },
    "impersonation": {
        "level_number": "5",
        "category_id": "impersonation",
        "scenario_id": "impersonation_district_it_trojan",
        "title": "Level 5: Impersonation Scams",
        "scenario_name": "District IT Helpdesk Security Alert",
        "fictional_sender_name": "District Education IT Helpdesk",
        "fictional_sender_email": "helpdesk@district-school-techsupport.net",
        "email_subject": "[SECURITY ALERT] Critical Trojan detected on your student laptop",
        "preview": "Our network monitoring detected suspicious backdoor malware on your laptop. Run our emergency fix tool immediately...",
        "simulated_body": (
            "ATTENTION STUDENT:\n\n"
            "Our district network monitoring system detected suspicious backdoor malware attempting to transmit school files from your laptop.\n\n"
            "Our IT support technicians are monitoring this alert. You must click the emergency link below immediately to run our online security fix and protect your student access credentials."
        ),
        "call_to_action": "Run Emergency Security Fix",
        "display_link_text": "http://district-school-techsupport.net/fix/trojan-patch.exe",
        "red_flags": [
            "Impersonating official school IT staff with alarming fear tactics ('Trojan detected')",
            "Instructs you to click a link or execute an unverified program ('trojan-patch.exe')",
            "Fake technical jargon designed to panic the student into complying without thinking",
        ],
        "learning_goal": "Scammers impersonate authorities or IT departments to frighten victims into installing malware. Always verify with your actual in-person school staff.",
        "follow_up": {
            "question": "If an email claiming to be 'School IT' asks you to click a link to install a security tool right away, what should you do?",
            "options": [
                "Click it immediately so your computer doesn't get locked",
                "Ask your school's actual teacher or IT technician in person before clicking anything",
                "Install it on a family member's computer instead",
                "Reply with your login details to let them fix it remotely",
            ],
            "correct_index": 1,
            "explanation": "Always independently verify unexpected IT or administrative alerts with actual staff before clicking links.",
        },
    },
    "financial": {
        "level_number": "6",
        "category_id": "financial",
        "scenario_id": "financial_crypto_wealth_pool",
        "title": "Level 6: Deceptive Financial Offers",
        "scenario_name": "Young Investors Fast Wealth Pool",
        "fictional_sender_name": "Student Micro-Wealth Collective",
        "fictional_sender_email": "invites@student-micro-wealth.net",
        "email_subject": "Exclusive Student Program: Turn $20 into $200 in 7 days (Guaranteed)",
        "preview": "Ready to build wealth while studying? Our youth micro-crypto investment pool lets anyone turn $20 into $200 with zero risk...",
        "simulated_body": (
            "Hey Future Mogul!\n\n"
            "Ready to start building wealth while you study? Our student automated micro-crypto investment pool lets anyone turn $20 into $200 in just 7 days with zero risk.\n\n"
            "Over 2,400 students joined this semester and are earning daily payouts. Registration closes at midnight tonight! Click below to secure your funded student slot."
        ),
        "call_to_action": "Claim Your Guaranteed Investment Slot",
        "display_link_text": "http://student-micro-wealth.net/join?pool=youth-tier1",
        "red_flags": [
            "Promises 'guaranteed' 10x returns with 'zero risk' (all genuine investments involve risk)",
            "Artificial urgency ('registration closes at midnight tonight')",
            "Targeted language aimed at youth FOMO (Fear Of Missing Out)",
            "Classic Ponzi / pyramid scheme structure with fake social proof",
        ],
        "learning_goal": "No legitimate investment guarantees high, risk-free returns. Promises of easy money from unknown online groups are fraudulent schemes.",
        "follow_up": {
            "question": "What is the biggest telltale sign of a deceptive financial investment scam?",
            "options": [
                "The investment is explained using graphs",
                "Promises of guaranteed huge returns in a short time with 'zero risk'",
                "It requires knowing basic math",
                "It is mentioned on social media",
            ],
            "correct_index": 1,
            "explanation": "Guaranteed huge profits with zero risk do not exist in the real world — it is the defining hallmark of financial fraud.",
        },
    },
}


def build_simulation_html(
    parent_name: str,
    category_id: str,
    feedback_url: str,
    child_name: str = "your child",
    simulation_id: str = "",
) -> tuple[str, str, str]:
    """
    Constructs the realistic email subject, plain text body, and HTML body
    for the educational simulation.
    Crucial: The email represents the realistic scenario itself (e.g. storage alert,
    courier fee, canteen voucher) without revealing the red flags or answers upfront.
    The action link resolves directly to the controlled WiseCub debrief destination.
    """
    template = LEVEL_TEMPLATES.get(category_id, LEVEL_TEMPLATES["phishing"])
    subject = template["email_subject"]
    cta_text = template.get("call_to_action", "View Link")
    sender_name = template.get("fictional_sender_name", "WiseCub Safety Lab")
    sender_email = template.get("fictional_sender_email", "alerts@wisecub-safety.org")

    # Plain text version matching the Practice Inbox content
    plain_text = (
        f"{template['simulated_body']}\n\n"
        f"--------------------------------------------------\n"
        f"{cta_text}: {feedback_url}\n"
        f"--------------------------------------------------\n\n"
        f"--\n"
        f"WiseCub Educational Safety Lab — Consented Simulation Exercise\n"
        f"Session ID: {simulation_id or 'active'}\n"
        f"This simulated message is for cyber safety education. No real credentials or payment details are ever requested or collected."
    )

    # HTML body: realistic email layout matching the Practice Inbox
    body_paragraphs = "".join(
        f"<p style='margin: 0 0 14px 0; line-height: 1.6;'>{p}</p>"
        for p in template["simulated_body"].split("\n\n")
    )
    html_body = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }}
    .email-container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); }}
    .email-header {{ background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 18px 24px; }}
    .sender-title {{ font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; }}
    .sender-meta {{ font-size: 13px; color: #64748b; font-family: monospace; }}
    .email-content {{ padding: 28px 24px; font-size: 15px; line-height: 1.6; color: #334155; }}
    .cta-container {{ text-align: center; margin: 32px 0 24px 0; }}
    .cta-btn {{ display: inline-block; background: #2563eb; color: #ffffff !important; padding: 13px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25); }}
    .email-footer {{ background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px 24px; font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.4; }}
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <div class="sender-title">{sender_name}</div>
      <div class="sender-meta">From: &lt;{sender_email}&gt;</div>
    </div>
    <div class="email-content">
      {body_paragraphs}

      <div class="cta-container">
        <a href="{feedback_url}" class="cta-btn" target="_blank" rel="noopener noreferrer">
          {cta_text} &rarr;
        </a>
      </div>
    </div>
    <div class="email-footer">
      <strong>WiseCub Educational Safety Lab</strong> &bull; Consented Learning Simulation (ID: {simulation_id or 'active'})<br>
      Controlled cyber safety exercise for registered family learning. Never share passwords or payment cards.
    </div>
  </div>
</body>
</html>"""

    return subject, plain_text, html_body


def send_simulation_email(
    to_email: str,
    parent_name: str,
    category_id: str,
    simulation_id: str,
    feedback_url: str,
    child_name: str = "your child",
) -> dict[str, Any]:
    """
    Sends the educational simulation email via SMTP if configured.
    If SMTP settings are missing, returns status='not_configured' with
    explicit diagnostic details (never fakes successful delivery).
    """
    template = LEVEL_TEMPLATES.get(category_id, LEVEL_TEMPLATES["phishing"])
    subject, plain_text, html_body = build_simulation_html(
        parent_name=parent_name,
        category_id=category_id,
        feedback_url=feedback_url,
        child_name=child_name,
        simulation_id=simulation_id,
    )

    if not settings.is_smtp_configured:
        logger.info(
            "SMTP not configured (host='%s'). Simulation email recorded as 'not_configured' for %s.",
            settings.smtp_host,
            to_email,
        )
        return {
            "success": False,
            "status": "not_configured",
            "subject": subject,
            "to_email": to_email,
            "detail": (
                "SMTP server is not configured in backend settings. "
                "Set SMTP_HOST, SMTP_PORT, SMTP_USERNAME, and SMTP_PASSWORD in .env to enable real delivery."
            ),
        }

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        sender_display = template.get("fictional_sender_name", "WiseCub Safety Lab")
        msg["From"] = f'"{sender_display}" <{settings.smtp_from_email}>'
        msg["To"] = to_email

        msg.attach(MIMEText(plain_text, "plain", "utf-8"))
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        # Port 465 uses direct SSL; 587/25 use STARTTLS
        if settings.smtp_port == 465:
            server = smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=10)
        else:
            server = smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10)
            if settings.smtp_use_tls:
                server.starttls()

        with server:
            if settings.smtp_username and settings.smtp_password:
                server.login(settings.smtp_username, settings.smtp_password)
            server.send_message(msg)

        logger.info("Successfully sent educational simulation email to %s for category %s", to_email, category_id)
        return {
            "success": True,
            "status": "sent",
            "provider_accepted": True,
            "subject": subject,
            "to_email": to_email,
            "detail": "Email accepted by mail provider for delivery.",
        }
    except smtplib.SMTPAuthenticationError as auth_err:
        logger.error("SMTP authentication failed for user %s: %s", settings.smtp_username, auth_err)
        return {
            "success": False,
            "status": "failed",
            "provider_accepted": False,
            "subject": subject,
            "to_email": to_email,
            "detail": "SMTP authentication failed. Ensure you are using a valid 16-character App Password, not your regular Google account password.",
        }
    except smtplib.SMTPConnectError as conn_err:
        logger.error("SMTP connection failed: %s", conn_err)
        return {
            "success": False,
            "status": "failed",
            "provider_accepted": False,
            "subject": subject,
            "to_email": to_email,
            "detail": f"SMTP connection error to {settings.smtp_host}:{settings.smtp_port}. Verify host and port.",
        }
    except Exception as exc:
        logger.error("Failed to send simulation email to %s: %s", to_email, exc)
        return {
            "success": False,
            "status": "failed",
            "provider_accepted": False,
            "subject": subject,
            "to_email": to_email,
            "detail": f"SMTP delivery failed: {str(exc)}",
        }
