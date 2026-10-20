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
LEVEL_TEMPLATES: dict[str, dict[str, str]] = {
    "phishing": {
        "level_number": "1",
        "title": "Level 1: Phishing Emails",
        "scenario_name": "Account Security Alert Simulation",
        "email_subject": "[WiseCub Safety Lab] Level 1 Simulation: Urgent account verification required",
        "simulated_body": (
            "Dear Parent/Guardian,\n\n"
            "We detected unusual sign-in activity on your educational portal account. "
            "Please confirm your password immediately by clicking the link below or your account will be suspended within 24 hours."
        ),
        "red_flags": [
            "Creates artificial urgency ('within 24 hours')",
            "Threatens negative consequences ('account will be suspended')",
            "Generic greeting ('Dear Parent/Guardian') instead of your actual name",
            "Requests password confirmation via an email link",
        ],
        "learning_goal": "Teach children and families to identify artificial urgency and never click verification links sent via unexpected emails.",
    },
    "sms": {
        "level_number": "2",
        "title": "Level 2: Scam Text Messages",
        "scenario_name": "Package Delivery Notification Simulation",
        "email_subject": "[WiseCub Safety Lab] Level 2 Simulation: Action required on your parcel delivery",
        "simulated_body": (
            "Postal Notification Service: Your scheduled delivery could not be completed due to an unpaid dispatch fee of $1.85. "
            "Please follow the link below within 2 hours to confirm your address and release your package."
        ),
        "red_flags": [
            "Unexpected package alert with an artificial countdown",
            "Requests an unexpected small fee to release an item",
            "Vague sender name ('Postal Notification Service') with no tracking number",
            "Directs to an unverified external link",
        ],
        "learning_goal": "Spot fake SMS delivery alerts and verify orders through official apps or courier websites instead of clicking text links.",
    },
    "qr": {
        "level_number": "3",
        "title": "Level 3: Fake QR-Code Offers",
        "scenario_name": "Cafeteria Discount & Free Snacks Simulation",
        "email_subject": "[WiseCub Safety Lab] Level 3 Simulation: Scan your special cafeteria coupon",
        "simulated_body": (
            "Special School Promotion: Scan the special QR offer attached to claim a free drink and cafeteria voucher for this week. "
            "You must scan and submit your mobile number right away before vouchers run out!"
        ),
        "red_flags": [
            "QR code offer with no verifiable sender or company background",
            "Too-good-to-be-true free merchandise/vouchers",
            "Requests personal mobile number to redeem",
            "Sticker or flyer QR codes in public places can be easily replaced by scammers (quishing)",
        ],
        "learning_goal": "Understand 'Quishing' (QR phishing) and verify the destination URL before entering personal details or downloading files.",
    },
    "prize": {
        "level_number": "4",
        "title": "Level 4: Prize and Giveaway Scams",
        "scenario_name": "Mystery Box & Gift Card Winner Simulation",
        "email_subject": "[WiseCub Safety Lab] Level 4 Simulation: Congratulations! You were selected as a winner",
        "simulated_body": (
            "Congratulations! Your student ID was randomly selected to win a $250 tech store shopping spree and mystery box. "
            "Click below to claim your prize. Only a $4.99 shipping handling fee is required."
        ),
        "red_flags": [
            "Winning a contest you never entered",
            "Requiring an upfront payment or 'shipping fee' to claim a free prize",
            "High-value incentives used as bait to capture payment card details",
        ],
        "learning_goal": "Remember the golden rule: If an offer looks too good to be true, it almost certainly is. Legitimate prizes never ask for an entry fee to claim.",
    },
    "impersonation": {
        "level_number": "5",
        "title": "Level 5: Impersonation Scams",
        "scenario_name": "School IT Support Alert Simulation",
        "email_subject": "[WiseCub Safety Lab] Level 5 Simulation: School IT Helpdesk virus detection",
        "simulated_body": (
            "IT Helpdesk Alert: A security breach has been detected originating from your student laptop. "
            "Our technician is on standby. Click below immediately to install our remote security patch and protect your files."
        ),
        "red_flags": [
            "Impersonating official authority or tech support",
            "Alarms user with claims of viruses or breaches",
            "Instructs user to install unverified remote software or 'patches'",
        ],
        "learning_goal": "Verify unexpected tech support claims through known channels (e.g., asking your real teacher or school IT directly).",
    },
    "financial": {
        "level_number": "6",
        "title": "Level 6: Deceptive Financial Offers",
        "scenario_name": "Student Investment & Money Doubler Simulation",
        "email_subject": "[WiseCub Safety Lab] Level 6 Simulation: Exclusive student investment opportunity",
        "simulated_body": (
            "Exclusive Student Opportunity: Turn $20 into $200 in just 7 days with our zero-risk youth micro-investment pool. "
            "Thousands of students are already earning daily profits. Join before registrations close tonight!"
        ),
        "red_flags": [
            "Guaranteed high returns with 'zero risk' (all real investments carry risk)",
            "Pyramid or referral incentives ('earn daily profits by recruiting friends')",
            "High pressure to deposit money quickly before registration closes",
        ],
        "learning_goal": "Understand deceptive financial schemes and recognize that guaranteed high-return promises are typical hallmarks of financial fraud.",
    },
}


def build_simulation_html(
    parent_name: str,
    category_id: str,
    feedback_url: str,
    child_name: str = "your child",
) -> tuple[str, str, str]:
    """
    Constructs the email subject, plain text body, and HTML body
    for the educational simulation.
    """
    template = LEVEL_TEMPLATES.get(category_id, LEVEL_TEMPLATES["phishing"])
    subject = template["email_subject"]

    # Plain text version
    plain_text = (
        f"=== WISECUB EDUCATIONAL SCAM SAFETY SIMULATION ===\n"
        f"Level {template['level_number']}: {template['title']}\n\n"
        f"Dear {parent_name},\n\n"
        f"This is an educational simulation email sent because {child_name} successfully "
        f"completed {template['title']} on WiseCub!\n\n"
        f"--- SIMULATED SCAM SCENARIO ---\n"
        f"{template['simulated_body']}\n\n"
        f"--- EDUCATIONAL DEBRIEF ---\n"
        f"Notice the red flags in this scenario:\n"
        + "\n".join(f" - {rf}" for rf in template["red_flags"])
        + f"\n\nLearning Goal: {template['learning_goal']}\n\n"
        f"Visit the safe educational debriefing page to review this scenario with your child:\n"
        f"{feedback_url}\n\n"
        f"WiseCub Educational Research Project. Virtual learning only. No personal financial info collected."
    )

    # HTML version with prominent safety banner and styling
    red_flags_html = "".join(f"<li>{rf}</li>" for rf in template["red_flags"])
    html_body = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7fafc; margin: 0; padding: 24px; color: #2d3748; }}
    .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }}
    .banner {{ background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #ffffff; padding: 18px 24px; text-align: center; }}
    .banner h1 {{ margin: 0; font-size: 18px; font-weight: 700; letter-spacing: 0.5px; }}
    .banner p {{ margin: 4px 0 0; font-size: 13px; opacity: 0.9; }}
    .content {{ padding: 24px; }}
    .scenario-box {{ background: #fffaf0; border-left: 4px solid #dd6b20; padding: 16px; margin: 18px 0; border-radius: 4px; font-size: 14px; line-height: 1.5; color: #7b341e; }}
    .debrief-box {{ background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 18px; margin: 20px 0; }}
    .debrief-box h3 {{ margin: 0 0 10px 0; color: #166534; font-size: 15px; }}
    .debrief-box ul {{ margin: 0; padding-left: 20px; color: #15803d; font-size: 13px; }}
    .btn {{ display: inline-block; background: #4f46e5; color: #ffffff !important; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 12px; }}
    .footer {{ background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; font-size: 12px; color: #718096; line-height: 1.5; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="banner">
      <h1>WiseCub Educational Safety Lab</h1>
      <p>{template['title']} — Consented Parent/Guardian Exercise</p>
    </div>
    <div class="content">
      <p>Hello <strong>{parent_name}</strong>,</p>
      <p>
        <strong>{child_name}</strong> just completed <strong>{template['title']}</strong> with a passing score!
        As part of the consented educational program, here is the approved simulation email representing this topic:
      </p>

      <div class="scenario-box">
        <strong>Simulated Scenario ({template['scenario_name']}):</strong><br><br>
        {template['simulated_body'].replace('\n', '<br>')}
      </div>

      <div class="debrief-box">
        <h3>Red Flags to Discuss Together:</h3>
        <ul>
          {red_flags_html}
        </ul>
        <p style="margin: 12px 0 0 0; font-size: 13px; color: #14532d;">
          <strong>Learning Takeaway:</strong> {template['learning_goal']}
        </p>
      </div>

      <p style="text-align: center; margin: 24px 0;">
        <a href="{feedback_url}" class="btn" target="_blank" rel="noopener noreferrer">
          View Safe Educational Debrief & Feedback
        </a>
      </p>
    </div>
    <div class="footer">
      <p>
        <strong>Privacy & Safety Notice:</strong> This is an educational email simulation generated by WiseCub for registered parent/guardian practice.
        WiseCub never collects passwords, payment cards, or OTP credentials.
      </p>
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
    subject, plain_text, html_body = build_simulation_html(
        parent_name=parent_name,
        category_id=category_id,
        feedback_url=feedback_url,
        child_name=child_name,
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
        msg["From"] = settings.smtp_from_email
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
