"""
generate_dataset_v2.py

Corrected dataset generator for WiseCub Scam Awareness ML Research (v2 Experiment).
Key Improvements over v1:
1. Complete removal of label-revealing tokens (#LEG-, #PH-, #QR-, #IMP-, #FIN-, #PRZ-, #SMS-).
   Classifier inputs contain ZERO artificial class markers or synthetic shortcuts.
2. Scientifically defensible campaign clustering for public UCI SMS messages using
   TF-IDF cosine similarity (>= 0.50) and connected components graph clustering.
   Guarantees that duplicate spam campaigns and near-identical messages share the same
   template_group_id and NEVER cross train/validation/test partitions.
3. Highly diversified slot variations across all 95 legitimate and 95 scam templates,
   ensuring 100% unique message texts across all 2,500 examples (zero exact duplicates).
4. Realistic, balanced negative and positive distributions with overlapping domain terms
   (money, security alerts, links, authentication, school notices, family dialog).
5. Rigorous provenance attribution and documentation reflecting composite origins.
"""

import csv
import json
import random
import re
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd
from scipy.sparse.csgraph import connected_components
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

SEED = 42
random.seed(SEED)
np.random.seed(SEED)

SRC_DIR = Path(__file__).resolve().parent
V2_DIR = SRC_DIR.parent
DATA_DIR = V2_DIR / "data"
RAW_DIR = V2_DIR.parent / "data" / "raw"
REPORTS_DIR = V2_DIR / "reports"

DATA_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)


def clean_text(text: str) -> str:
    """Normalizes excessive whitespace while preserving original casing and punctuation."""
    return re.sub(r"\s+", " ", text).strip()


# ==============================================================================
# 1. PUBLIC BENCHMARK EXTRACTION & CAMPAIGN CLUSTERING
# ==============================================================================

def load_and_cluster_public_uci(target_spam=300, target_ham=300, sim_threshold=0.50):
    """
    Loads raw UCI SMS Spam Collection, deduplicates exact matches,
    clusters near-duplicate spam campaigns and ham templates using TF-IDF cosine similarity,
    and assigns cluster-based template_group_ids.
    """
    uci_file = RAW_DIR / "SMSSpamCollection"
    if not uci_file.exists():
        raise FileNotFoundError(f"UCI dataset raw file not found at {uci_file}")

    raw_candidates = []
    with open(uci_file, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.reader(f, delimiter="\t")
        for idx, row in enumerate(reader):
            if len(row) < 2:
                continue
            lbl = row[0].strip().lower()
            txt = clean_text(row[1])
            if 15 <= len(txt) <= 400:
                raw_candidates.append((lbl, txt, idx + 1))

    # Deterministic selection of first unique spams and hams
    seen_spam = set()
    selected_spam = []
    for lbl, txt, line_num in raw_candidates:
        if lbl == "spam" and txt.lower() not in seen_spam:
            seen_spam.add(txt.lower())
            selected_spam.append((txt, line_num))
            if len(selected_spam) >= target_spam:
                break

    seen_ham = set()
    selected_ham = []
    for lbl, txt, line_num in raw_candidates:
        if lbl == "ham" and txt.lower() not in seen_ham:
            seen_ham.add(txt.lower())
            selected_ham.append((txt, line_num))
            if len(selected_ham) >= target_ham:
                break

    # Cluster spam messages into campaign families
    spam_texts = [t for t, _ in selected_spam]
    vec_spam = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
    X_spam = vec_spam.fit_transform(spam_texts)
    sim_spam = cosine_similarity(X_spam)
    n_spam_comps, spam_labels = connected_components((sim_spam >= sim_threshold).astype(int), directed=False)

    # Cluster ham messages into template families
    ham_texts = [t for t, _ in selected_ham]
    vec_ham = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
    X_ham = vec_ham.fit_transform(ham_texts)
    sim_ham = cosine_similarity(X_ham)
    n_ham_comps, ham_labels = connected_components((sim_ham >= sim_threshold).astype(int), directed=False)

    diagnostics = {
        "similarity_threshold": sim_threshold,
        "raw_file": str(uci_file),
        "target_spam_selected": len(selected_spam),
        "target_ham_selected": len(selected_ham),
        "spam_campaign_clusters": int(n_spam_comps),
        "ham_template_clusters": int(n_ham_comps),
        "multi_message_spam_clusters": int(sum(1 for c in np.bincount(spam_labels) if c > 1)),
        "multi_message_ham_clusters": int(sum(1 for c in np.bincount(ham_labels) if c > 1)),
        "representative_spam_campaigns": []
    }

    # Record sample multi-item clusters for research transparency
    for cid in np.argsort(-np.bincount(spam_labels))[:5]:
        members = [selected_spam[i][0] for i, l in enumerate(spam_labels) if l == cid]
        if len(members) > 1:
            diagnostics["representative_spam_campaigns"].append({
                "cluster_id": int(cid),
                "member_count": len(members),
                "sample_messages": members[:3]
            })

    # Build structured records
    public_records = []
    for i, (txt, line_num) in enumerate(selected_spam):
        cid = spam_labels[i]
        # Assign category using transparent heuristics with documented review notes
        lower = txt.lower()
        if any(w in lower for w in ["won", "prize", "claim", "awarded", "cash", "jackpot", "holiday", "entry"]):
            cat = "prize"
            concept = "unsolicited_lottery;prize_claim;urgency"
        else:
            cat = "sms"
            concept = "unsolicited_commercial;premium_rate;call_to_action"

        public_records.append({
            "message_text": txt,
            "binary_label": "scam_or_suspicious",
            "scam_category": cat,
            "concept_tags": concept,
            "difficulty": "medium",
            "source_type": "public_dataset",
            "source_name": "UCI SMS Spam Collection",
            "source_reference": "Almeida et al. (2011/2012); DOI:10.24432/C5CC84",
            "license": "CC-BY-4.0",
            "template_group_id": f"GRP-UCI-SPAM-CAMP-{cid+1:03d}",
            "generation_or_review_notes": f"Public benchmark spam from UCI line {line_num}; campaign cluster {cid+1} (sim threshold {sim_threshold})"
        })

    for i, (txt, line_num) in enumerate(selected_ham):
        cid = ham_labels[i]
        public_records.append({
            "message_text": txt,
            "binary_label": "legitimate_or_benign",
            "scam_category": "legitimate_or_benign",
            "concept_tags": "daily_communication;peer_message;benign",
            "difficulty": "easy",
            "source_type": "public_dataset",
            "source_name": "UCI SMS Spam Collection",
            "source_reference": "Almeida et al. (2011/2012); DOI:10.24432/C5CC84",
            "license": "CC-BY-4.0",
            "template_group_id": f"GRP-UCI-HAM-CAMP-{cid+1:03d}",
            "generation_or_review_notes": f"Public benchmark legitimate from UCI line {line_num} (composite source); template cluster {cid+1}"
        })

    return public_records, diagnostics


# ==============================================================================
# 2. PARAMETER POOLS (10 DISTINCT VALUES PER POOL TO ENSURE UNIQUE VARIANTS)
# ==============================================================================

SCHOOLS_10 = ["Oakridge High", "St. Jude Academy", "Westbrook Central", "Hillcrest Grammar", "City Poly Prep", "Northstar Academy", "Glenwood Secondary", "Lincoln High", "Crestview College", "Beacon Hills High"]
TEACHERS_10 = ["Mr. Harris", "Ms. Vance", "Dr. Al-Mansoor", "Mrs. Gable", "Coach Tanaka", "Mr. Sterling", "Ms. Chen", "Dr. O'Connor", "Mrs. Kowalski", "Mr. Delgado"]
SUBJECTS_10 = ["Biology", "Algebra", "World History", "Chemistry", "English Literature", "Computer Science", "Physics", "Civics", "Geography", "Economics"]
FRIENDS_10 = ["Leo", "Maya", "Sam", "Chloe", "Devon", "Aisha", "Noah", "Elena", "Lucas", "Zara"]
PARENTS_10 = ["Mom", "Dad", "Aunt Claire", "Uncle Marcus", "Guardian Robert", "Stepmom Sarah", "Grandma Rose", "Uncle David", "Aunt Priya", "Grandpa Arthur"]
STUDENTS_10 = ["Alex Rivera", "Jordan Lee", "Taylor Smith", "Casey Miller", "Morgan Davis", "Riley Wilson", "Jamie Taylor", "Avery Brown", "Cameron Jones", "Dakota Evans"]
DAYS_10 = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "next Monday", "next Tuesday", "next Wednesday"]
HOURS_10 = ["8:30 AM", "10:15 AM", "12:00 PM", "1:30 PM", "3:15 PM", "4:45 PM", "5:30 PM", "6:15 PM", "7:00 PM", "7:45 PM"]
STORES_10 = ["Subway Snacks", "Target School Supplies", "Campus Bookstore", "City Cinema", "Tech Zone", "Corner Deli", "Station Newsstand", "Youth Cafe", "Sports Outlet", "Student Co-op"]
ROOMS_10 = ["Room 102", "Room 204", "Lab B", "the main gym", "Room 315", "the library annex", "Room 108", "the seminar room", "Room 220", "the art studio"]
CARDS_10 = ["Amazon", "Apple App Store", "Google Play", "Steam", "Target", "Walmart", "Best Buy", "Vanilla Visa", "Xbox", "PlayStation"]
APPLIANCES_10 = ["furnace", "water heater", "refrigerator", "stove", "washing machine", "roof gutter", "plumbing pipe", "boiler", "front porch railing", "kitchen microwave"]
BOOKS_10 = ["The Giver", "To Kill a Mockingbird", "The Outsiders", "Fahrenheit 451", "A Wrinkle in Time", "Lord of the Flies", "Animal Farm", "1984", "The Hobbit", "Great Expectations"]
SPORTS_10 = ["basketball", "soccer", "volleyball", "tennis", "track and field", "badminton", "cross country", "swimming", "table tennis", "cycling"]
DEVICES_10 = ["MacBook Air", "Windows 11 PC", "Pixel 8", "iPad Pro", "Chromebook", "iPhone 14", "Galaxy Tab", "iMac in Computer Lab", "Dell Laptop", "Surface Go"]
CONCERTS_10 = ["Winter Gala", "Spring Festival", "Holiday Pops", "Choral Showcase", "End of Term Concert", "Annual Recital", "District Choral Meet", "Acoustic Showcase", "Youth Choral Night", "Founders Celebration"]
PLAYS_10 = ["The Sound of Music", "Peter Pan", "Into the Woods", "Matilda", "High School Musical", "Grease", "The Wizard of Oz", "Beauty and the Beast", "Annie", "Oliver!"]
MINECRAFT_10 = ["Roman Forum", "Ancient Egyptian Pyramid", "Renaissance Florence Cathedral", "Mayan Temple", "Silk Road Bazaar", "Colosseum", "Great Wall", "Greek Parthenon", "Medieval Castle", "Viking Settlement"]
GOALS_10 = ["New Mountain Bike", "Gaming Headset", "Summer Camp Fee", "Art Tablet", "College Textbook Fund", "Guitar Lessons", "Science Fair Kit", "Skateboard Deck", "Coding Monitor", "Sports Camp Pass"]
CITIES_10 = ["Kyiv", "Lagos", "Hanoi", "Bucharest", "Manila", "Shenzhen", "Warsaw", "Jakarta", "Almaty", "Munich"]


# ==============================================================================
# 3. SYNTHETIC SCAM GENERATION (NO LABEL SHORTCUTS)
# ==============================================================================

def generate_synthetic_phishing(target_count=200) -> List[Dict]:
    scenarios = [
        ("School IT Support: Your student password for {school} will expire in {hours} hours. Retain your current password by verifying at {url}",
         "credential_harvesting;account_expiration_fear;spoofed_it_portal", "medium"),
        ("Urgent: An unrecognized login attempt from {city} was detected on your {school} student account. Secure your portal immediately: {url}",
         "credential_phishing;unauthorized_login_scare;portal_spoofing", "hard"),
        ("Student Aid Office: You have an unclaimed book voucher of ${amount}.00 for {subject}. Claim your voucher before Friday at {url}",
         "advance_fee_lure;student_aid_impersonation;credential_theft", "easy"),
        ("School Administrative Portal: Notice regarding updated grading policy for {subject} with {teacher}. Review the revised syllabus at {url}",
         "curiosity_urgency;administrative_pretext;malicious_link", "easy"),
        ("Library System Alert: You have 2 overdue textbooks for {subject} with outstanding fines of ${amount}. Avoid library card suspension by paying at {url}",
         "fine_threat;library_spoof;payment_credential_phishing", "medium"),
        ("Student Council Election: Cast your electronic ballot for Student Representative at {school}! Confirm your student identity to vote at {url}",
         "election_pretext;civic_lure;credential_harvesting", "easy"),
        ("Athletics Department: Roster confirmation required for {subject} sports team at {school}. Sign the electronic medical release form at {url}",
         "sports_waiver_pretext;urgency;credential_solicitation", "medium"),
        ("Examination Board: The revised mock exam timetable for {subject} is now available. Download your venue slip for Room {room_num} at {url}",
         "exam_timetable_lure;academic_urgency;phishing_portal", "medium"),
        ("Disciplinary Office: Unexplained absence logged for student on {day}. Submit your parent excuse note for {subject} online at {url} to clear record.",
         "attendance_scare;disciplinary_threat;credential_theft", "hard"),
        ("Campus WiFi System: Security certificate upgrade required for {school}. Keep your devices connected by logging into {url}",
         "wifi_profile_scam;network_credential_theft;rogue_portal", "hard"),
        ("Cafeteria Services: An overcharge of ${amount}.50 was detected on student lunch card for {store}. Request electronic refund via {url} before Friday.",
         "refund_lure;cafeteria_pretext;bank_credential_capture", "medium"),
        ("Your Microsoft 365 student license provided by {school} expires on {day}. Renew for free at {url}",
         "license_expiration_threat;software_lure;credential_harvesting", "easy"),
        ("Regional STEM Fair: You were nominated by {teacher} to represent {school} in {subject}! Confirm your registration details at {url}",
         "academic_honor_pretext;flattery_lure;information_harvesting", "hard"),
        ("Lost & Found Desk: A student wallet containing cash and ID for {school} was handed to reception. Verify ownership at {url}",
         "lost_item_lure;curiosity_urgency;credential_phishing", "medium"),
        ("Digital Student ID: Physical student cards for {school} are being phased out. Activate your new mobile barcode pass at {url}",
         "digital_id_migration;administrative_pretext;credential_theft", "medium"),
        ("Yearbook Committee: Your portrait for {school} was uploaded for annual print by {teacher}. Review photo and quote at {url}",
         "yearbook_lure;vanity_curiosity;credential_harvesting", "easy"),
        ("Campus Safety Office: Mandatory emergency drill ledger for {school} on {day} must be acknowledged by all students at {url}",
         "safety_protocol_pretext;compliance_threat;fake_link", "easy"),
        ("Student Health Clinic: Vaccination record update requested for {school} enrollment in {subject}. Upload form securely at {url}",
         "health_record_pretext;administrative_urgency;credential_theft", "medium"),
        ("Bus Transportation Hub: Route changes scheduled for {school} next {day}. Verify your morning bus stop allocation at {url}",
         "transit_route_pretext;routine_service;fake_portal", "medium"),
        ("Parent-Teacher Conference: Confirmation slip required for {teacher}'s appointment on {day} in {room}. Acknowledge at {url}",
         "parent_conference_pretext;guardian_coercion;credential_harvesting", "medium"),
    ]

    records = []
    variants_per_group = target_count // len(scenarios)
    for grp_num, (tmpl, concept, diff) in enumerate(scenarios, 1):
        grp_id = f"GRP-SYN-PHISH-{grp_num:03d}"
        for var_idx in range(variants_per_group):
            city = CITIES_10[var_idx]
            school = SCHOOLS_10[var_idx]
            clean_school = school.lower().replace(" ", "")
            url = f"http://portal-{clean_school}-student-auth{var_idx}.net/verify?token={4000 + grp_num * 10 + var_idx}"
            text = tmpl.format(
                school=school,
                hours=[2, 4, 8, 12, 16, 20, 24, 36, 48, 72][var_idx],
                city=city,
                amount=15 + var_idx * 10,
                subject=SUBJECTS_10[var_idx],
                teacher=TEACHERS_10[var_idx],
                day=DAYS_10[var_idx],
                store=STORES_10[var_idx],
                room=ROOMS_10[var_idx],
                room_num=101 + var_idx * 12,
                url=url
            )
            records.append({
                "message_text": text,
                "binary_label": "scam_or_suspicious",
                "scam_category": "phishing",
                "concept_tags": concept,
                "difficulty": diff,
                "source_type": "synthetic",
                "source_name": "WiseCub Educational Synthetic Corpus v2.0",
                "source_reference": "WiseCub Scam Awareness Module: Phishing Curriculum (Level 1)",
                "license": "CC-BY-NC-4.0",
                "template_group_id": grp_id,
                "generation_or_review_notes": f"Synthetic educational phishing scenario {grp_num}, variant {var_idx+1}."
            })
    return records


def generate_synthetic_sms(target_count=100) -> List[Dict]:
    scenarios = [
        ("QuickDrop Logistics: Parcel #{track} held at regional depot due to unpaid dispatch surcharge of ${fee}. Authorize release within {hours} hours: {url}",
         "courier_fee_scam;fake_urgency;parcel_clearance", "easy"),
        ("Postal Express: Package #{track} addressed to {city} has incomplete street digits. Driver waiting at hub. Update details at {url} to avoid return.",
         "smishing;postal_authority_spoof;credential_phishing", "medium"),
        ("Bank Card Security: Debit charge of ${fee} at '{store}' detected on card ending in {last4}. If unauthorized, block transaction at {url}",
         "smishing;false_charge_panic;fake_cancellation_portal", "hard"),
        ("Telco Bonus: Your mobile plan renewal for {day} earned a reward of {gb}GB free high-speed data. Activate at {url} (promo code {promo})",
         "telco_phishing;bonus_data_lure;malicious_url", "easy"),
        ("Highway Toll System: Unpaid toll notice #{track} recorded on {day}. An overdue fine of ${fee} applies tomorrow. Settle balance online: {url}",
         "toll_scam;legal_coercion;urgent_payment_demand", "medium"),
        ("Customs Border Dispatch: Package #{track} arriving from {city} detained for unpaid duty of ${fee}. Clear shipment here: {url}",
         "customs_duty_scam;package_detained;advance_fee", "medium"),
        ("Electric Utility Alert: Power service at your registered address is scheduled for disconnection at {time} due to unpaid balance of ${fee}. Settle at {url}",
         "utility_bill_threat;disconnection_panic;fake_payment_link", "hard"),
        ("Courier Notification: Driver attempted delivery of order #{track} at {time} on {day}. Re-schedule time and confirm entry code: {url}",
         "delivery_driver_impersonation;curiosity_urgency;malicious_link", "medium"),
        ("Mobile Carrier Alert: 4G network updates in {city} require replacement SIM for account #{track}. Request free 5G card at {url}",
         "sim_swap_pretext;network_upgrade_lure;identity_theft", "hard"),
        ("Video Stream Notice: Your family streaming subscription for {school} student discount was suspended. Update card details at {url}",
         "streaming_service_spoof;subscription_cancellation_fear;card_theft", "easy"),
    ]

    records = []
    variants_per_group = target_count // len(scenarios)
    for grp_num, (tmpl, concept, diff) in enumerate(scenarios, 1):
        grp_id = f"GRP-SYN-SMS-{grp_num:03d}"
        for var_idx in range(variants_per_group):
            track_num = 492000 + grp_num * 100 + var_idx * 7
            promo_num = 8200 + var_idx * 13
            fee_amount = 4.50 + var_idx * 1.50
            url = f"http://express-dispatch-hub{var_idx}.com/track?ref={track_num}"
            text = tmpl.format(
                track=track_num,
                fee=f"{fee_amount:.2f}",
                gb=[10, 15, 20, 25, 30, 40, 50, 75, 100, 150][var_idx],
                promo=promo_num,
                time=HOURS_10[var_idx],
                hours=[2, 3, 4, 6, 8, 12, 18, 24, 36, 48][var_idx],
                city=CITIES_10[var_idx],
                store=STORES_10[var_idx],
                last4=1000 + var_idx * 314,
                day=DAYS_10[var_idx],
                school=SCHOOLS_10[var_idx],
                url=url
            )
            records.append({
                "message_text": text,
                "binary_label": "scam_or_suspicious",
                "scam_category": "sms",
                "concept_tags": concept,
                "difficulty": diff,
                "source_type": "synthetic",
                "source_name": "WiseCub Educational Synthetic Corpus v2.0",
                "source_reference": "WiseCub Scam Awareness Module: Smishing Curriculum (Level 2)",
                "license": "CC-BY-NC-4.0",
                "template_group_id": grp_id,
                "generation_or_review_notes": f"Synthetic educational smishing scenario {grp_num}, variant {var_idx+1}."
            })
    return records


def generate_synthetic_qr(target_count=200) -> List[Dict]:
    scenarios = [
        ("School Cafeteria Promo: Scan the quick-response code on {store} counter flyer to redeem {pct}% discount on smoothies today: {url}",
         "quishing;cafeteria_discount_lure;credential_harvesting", "easy"),
        ("Campus Bike Lock Hub: Rental bike #{bike} unlocked. To finalize return and avoid fee of ${fee}, scan hub barcode at {url}",
         "quishing;bike_share_overcharge_threat;payment_redirect", "medium"),
        ("High School {sport} Championship: Buy student gate tickets for {school}! Scan ticket code at {url} to receive mobile pass.",
         "quishing;event_ticket_scam;fake_payment_portal", "easy"),
        ("Lost Student Backpack: Black Nike backpack found near {room}. Scan code on bulletin sticker at {url} to contact finder.",
         "quishing;lost_item_pretext;social_engineering", "medium"),
        ("Parking Citation: Notice #{track} issued on {day}. Pay municipal parking fine within 24 hours to avoid tow fee: scan code at {url}",
         "quishing;parking_fine_scare;counterfeit_citation", "hard"),
        ("Library Book Rental: Borrow '{book}' on your smartphone! Scan the sticker code in library to open digital catalog: {url}",
         "quishing;library_pretext;credential_theft", "medium"),
        ("Robotics Tournament Raffle: Win a new gaming console! Scan table barcode in {room} at {url} to enter free student raffle draw.",
         "quishing;raffle_lure;personal_data_collection", "easy"),
        ("School Locker Reassignment: Locker combination update for Room {room_num} required on {day}. Scan door tag at {url} to confirm code.",
         "quishing;locker_audit_pretext;credential_harvesting", "hard"),
        ("Music Festival Youth Pass: Early bird tickets for {band} available. Scan promotional poster code at {url} for {pct}% discount voucher.",
         "quishing;concert_discount_lure;payment_theft", "easy"),
        ("Charity Bake Sale: Support {school} fundraiser on {day}! Scan barcode at {url} to donate ${fee} via mobile payment.",
         "quishing;charity_impersonation;unauthorized_transfer", "medium"),
        ("Student Gym Pass: Membership validation required for {sport} training. Scan entrance turnstile barcode at {url} to update waiver.",
         "quishing;membership_audit;phishing_redirect", "medium"),
        ("Art Exhibition Voting: Vote for {student}'s painting! Scan artwork frame tag at {url} to cast your ballot.",
         "quishing;voting_pretext;information_harvesting", "easy"),
        ("Public Transit Bus Stop: Check live arrival times for Route {route_num} to {school}. Scan bus shelter poster code at {url}",
         "quishing;transit_poster_tampering;malicious_redirect", "hard"),
        ("Science Lab Safety Quiz: Complete mandatory {subject} quiz before practical on {day}. Scan bench barcode at {url}",
         "quishing;academic_compliance;credential_theft", "medium"),
        ("Youth Career Fair: Register your resume with tech employers visiting {school}. Scan company table badge at {url} to apply.",
         "quishing;job_fair_lure;data_harvesting", "easy"),
        ("School Merchandise Store: Order school hoodies for {school}. Scan rack code at {url} to receive free beanie with order.",
         "quishing;merchandise_lure;payment_theft", "easy"),
        ("Lost Pet Collar: Found friendly golden retriever near {school} on {day}. Scan collar tag at {url} to see owner contact info.",
         "quishing;pet_collar_pretext;social_engineering", "medium"),
        ("Math Tutoring Sign-up: Free peer tutoring sessions for {subject} with {teacher}. Scan hallway flyer code at {url} to book a slot.",
         "quishing;tutoring_pretext;credential_theft", "easy"),
        ("Vending Machine Refund: Coin stuck in {store} machine? Scan refund code on machine front at {url} to get immediate credit.",
         "quishing;vending_refund_lure;payment_credential_capture", "medium"),
        ("Campus Clean-up Volunteer: Log volunteer hours for {subject} credit. Scan coordinator clipboard code on {day} at {url}",
         "quishing;volunteer_hours_lure;identity_theft", "hard"),
    ]

    records = []
    variants_per_group = target_count // len(scenarios)
    for grp_num, (tmpl, concept, diff) in enumerate(scenarios, 1):
        grp_id = f"GRP-SYN-QR-{grp_num:03d}"
        for var_idx in range(variants_per_group):
            token_num = 3000 + grp_num * 20 + var_idx
            url = f"http://scan-qr-service{var_idx}.org/auth?qr={token_num}"
            text = tmpl.format(
                store=STORES_10[var_idx],
                pct=[30, 35, 40, 45, 50, 55, 60, 65, 70, 75][var_idx],
                bike=200 + var_idx * 15,
                fee=12 + var_idx * 3,
                sport=SPORTS_10[var_idx],
                school=SCHOOLS_10[var_idx],
                room=ROOMS_10[var_idx],
                room_num=105 + var_idx * 11,
                track=89000 + var_idx * 103,
                day=DAYS_10[var_idx],
                book=BOOKS_10[var_idx],
                band=["The Lumineers", "Imagine Dragons", "Coldplay", "Paramore", "Boygenius", "Twenty One Pilots", "OneRepublic", "Bleachers", "Chappell Roan", "The 1975"][var_idx],
                student=STUDENTS_10[var_idx],
                route_num=12 + var_idx * 3,
                subject=SUBJECTS_10[var_idx],
                teacher=TEACHERS_10[var_idx],
                url=url
            )
            records.append({
                "message_text": text,
                "binary_label": "scam_or_suspicious",
                "scam_category": "qr",
                "concept_tags": concept,
                "difficulty": diff,
                "source_type": "synthetic",
                "source_name": "WiseCub Educational Synthetic Corpus v2.0",
                "source_reference": "WiseCub Scam Awareness Module: QR Safety Curriculum (Level 5)",
                "license": "CC-BY-NC-4.0",
                "template_group_id": grp_id,
                "generation_or_review_notes": f"Synthetic educational QR scam scenario {grp_num}, variant {var_idx+1}."
            })
    return records


def generate_synthetic_prize(target_count=100) -> List[Dict]:
    scenarios = [
        ("Grand Prize Notification: Congratulations! Your phone number was selected as 1st prize winner of a ${cash} shopping voucher for {store}! Claim at {url}",
         "lottery_scam;unsolicited_prize;advance_fee", "easy"),
        ("Gaming Rewards Center: You won an exclusive legendary character skin and {vbucks} bonus game coins in {game}! Claim prize instantly: {url}",
         "gaming_lure;virtual_currency_scam;account_theft", "easy"),
        ("Lucky Customer Draw: You have been chosen to test the new {device} for free! Confirm delivery to {city} at {url}",
         "hardware_testing_lure;advance_shipping_fee;identity_theft", "easy"),
        ("Holiday Giveaway: You won a 3-night resort weekend getaway to {city}! Call 09061209465 to confirm booking voucher (claim code {code}).",
         "vacation_giveaway;premium_rate_callback;urgency", "medium"),
        ("Social Media Contest: You were tagged as winner of the ${cash} Tech Gift Card for {store}! Message our prize agent at {url} to claim.",
         "social_media_contest_spoof;credential_phishing;advance_fee", "easy"),
        ("Customer Appreciation Bonus: A mystery cash reward of ${cash} is waiting in your rewards vault for {card} card. Unlock today: {url}",
         "cash_reward_lure;mystery_bonus;card_theft", "medium"),
        ("Weekly Spin-the-Wheel: Your mobile number won ${cash} cash! Funds held for {hours} hours. Transfer to debit card: {url}",
         "spin_wheel_lure;fake_cash_deposit;bank_credential_phishing", "easy"),
        ("Smartphone Launch Giveaway: You have been selected to receive a brand-new {device}! Pay $2.99 postage at {url} to dispatch.",
         "cheap_electronics_lure;postage_trap;recurring_credit_card_charge", "medium"),
        ("Student Ambassador Bounty: You were chosen as campus brand ambassador for {school}! Receive free designer sneakers plus ${cash} stipend. Sign up: {url}",
         "ambassador_bounty_lure;fake_sponsorship;identity_theft", "hard"),
        ("VIP Concert Ticket Draw: Two backstage VIP tickets to see {artist} are reserved in your name! Confirm tickets for {city} at {url}",
         "concert_ticket_lure;teen_interest_targeting;credential_harvesting", "easy"),
    ]

    records = []
    variants_per_group = target_count // len(scenarios)
    for grp_num, (tmpl, concept, diff) in enumerate(scenarios, 1):
        grp_id = f"GRP-SYN-PRIZE-{grp_num:03d}"
        for var_idx in range(variants_per_group):
            cash_amount = [250, 350, 500, 750, 1000, 1250, 1500, 2000, 2500, 3000][var_idx]
            code_num = 10000 + grp_num * 100 + var_idx * 5
            url = f"http://claim-reward-vault{var_idx}.com/redeem?code={code_num}"
            text = tmpl.format(
                cash=cash_amount,
                vbucks=[2500, 5000, 7500, 10000, 15000, 20000, 25000, 30000, 40000, 50000][var_idx],
                code=code_num,
                hours=[6, 12, 18, 24, 36, 48, 60, 72, 84, 96][var_idx],
                store=STORES_10[var_idx],
                game=["Roblox", "Fortnite", "Minecraft", "Valorant", "Brawl Stars", "Apex Legends", "Genshin Impact", "Rocket League", "Overwatch", "League of Legends"][var_idx],
                device=DEVICES_10[var_idx],
                city=CITIES_10[var_idx],
                card=CARDS_10[var_idx],
                school=SCHOOLS_10[var_idx],
                artist=["Olivia Rodrigo", "Taylor Swift", "Billie Eilish", "Drake", "Sabrina Carpenter", "The Weeknd", "Dua Lipa", "Post Malone", "Travis Scott", "Ariana Grande"][var_idx],
                url=url
            )
            records.append({
                "message_text": text,
                "binary_label": "scam_or_suspicious",
                "scam_category": "prize",
                "concept_tags": concept,
                "difficulty": diff,
                "source_type": "synthetic",
                "source_name": "WiseCub Educational Synthetic Corpus v2.0",
                "source_reference": "WiseCub Scam Awareness Module: Prize Scams Curriculum (Level 3)",
                "license": "CC-BY-NC-4.0",
                "template_group_id": grp_id,
                "generation_or_review_notes": f"Synthetic educational prize scam scenario {grp_num}, variant {var_idx+1}."
            })
    return records


def generate_synthetic_impersonation(target_count=200) -> List[Dict]:
    scenarios = [
        ("Hi sweetie, I dropped my phone in the sink and it's broken. Texting from a friend's phone. Can you transfer ${amount} to help pay grocery bill at {store}? Urgent!",
         "family_emergency_impersonation;hi_mum_scam;financial_coercion", "hard"),
        ("Hey, it's {friend}! I lost my phone on the bus in {city} and using this spare number. Please don't tell my parents, but I need to borrow ${amount} for a ride home.",
         "peer_emergency_impersonation;peer_trust_exploitation;p2p_transfer", "hard"),
        ("Principal's Office: Emergency notification regarding {student} at {school}. An immediate disciplinary suspension has been issued. Call {phone} immediately.",
         "school_authority_impersonation;parent_panic_trigger;voice_phishing", "medium"),
        ("School Police Liaison: Urgent inquiry regarding an incident involving a student from {school}. Call Officer Miller at {phone} before {time}.",
         "law_enforcement_spoof;legal_intimidation;compliance_coercion", "hard"),
        ("Hey {student}! It's {teacher} from {subject}. I am finalizing regional team entries. Text me your student ID and emergency contact details right away.",
         "teacher_impersonation;authority_pretext;data_harvesting", "medium"),
        ("Hi! This is Coach Tanaka from {sport}. The team bus broke down near {city}. Need parents to wire ${amount} for emergency van rental: wire to {phone}",
         "coach_impersonation;stranded_team_lure;urgent_wire_demand", "hard"),
        ("Your bank fraud prevention team: An unauthorized transaction of ${amount} was attempted on student card ending in {last4}. Reply with 6-digit passcode to cancel.",
         "bank_security_impersonation;otp_stealing;credential_interception", "hard"),
        ("Hello, this is {parent}'s colleague from work. Your guardian was taken unwell and asked me to pick you up outside {school} gates. Meet me in the {car}.",
         "predatory_stranger_lure;guardian_illness_deception;child_safety_hazard", "hard"),
        ("Discord Trust & Safety Team: Your profile on server '{server}' was reported for fraudulent activity. To avoid deletion, verify identity at {url}",
         "platform_moderation_impersonation;account_deletion_threat;credential_theft", "medium"),
        ("Roblox Support Desk: We detected unauthorized item duplication on your avatar profile '{avatar}'. Submit your recovery passphrase to prevent account ban: {url}",
         "gaming_admin_impersonation;account_ban_scare;credential_theft", "medium"),
        ("Steam Community Admin: An automated trade ban has been placed on your inventory for '{game}'. Connect with verification bot at {url} to inspect items.",
         "steam_admin_spoof;trade_ban_panic;inventory_theft", "medium"),
        ("Instagram Creator Support: Your profile was selected for blue verified badge for youth gaming in {city}! Confirm password and email at {url}",
         "social_media_verification_scam;vanity_lure;account_takeover", "easy"),
        ("Guidance Counselor Office: Follow-up required regarding {subject} scholarship recommendation for {student}. Send your full social security number to {phone}",
         "counselor_impersonation;pii_harvesting;scholarship_pretext", "hard"),
        ("Hi! It's {friend} on a burner phone. My phone got confiscated in {period} period. Can you send me the {subject} quiz answers? Text back here.",
         "peer_academic_dishonesty_pretext;peer_spoofing;social_engineering", "medium"),
        ("WiseCub Tutor Bot: System maintenance for student account #{track} requires re-authentication. Enter password at {url}",
         "educational_platform_spoof;maintenance_pretext;credential_theft", "medium"),
        ("Apple Support Agent: Lost iPhone detected in offline mode near {city}. If you are owner, enter Apple ID and passcode at {url} to view GPS map.",
         "icloud_phishing;lost_device_lure;passcode_harvesting", "hard"),
        ("Google Account Security: Suspicious recovery request submitted for student Gmail at {school}. Cancel request immediately: {url}",
         "account_recovery_spoof;panic_trigger;credential_theft", "medium"),
        ("Grandma's neighbor: Hello {student}, your grandmother asked me to reach out. Her {appliance} broke and she needs ${amount} for repair. Send via {card} gift card.",
         "elderly_relative_impersonation;gift_card_payment;emotional_coercion", "hard"),
        ("High School Bursar Office: Outstanding tuition balance of ${amount} for {subject} course at {school} must be cleared today at {url}",
         "bursar_impersonation;academic_consequence_threat;fraudulent_billing", "hard"),
        ("Youth Employment Agency: Your summer job application at {store} was approved! Send copy of passport and bank account routing number to {phone}",
         "employment_scam;job_offer_lure;identity_theft", "hard"),
    ]

    records = []
    variants_per_group = target_count // len(scenarios)
    for grp_num, (tmpl, concept, diff) in enumerate(scenarios, 1):
        grp_id = f"GRP-SYN-IMP-{grp_num:03d}"
        for var_idx in range(variants_per_group):
            phone_num = f"+1-555-01{var_idx:02d}"
            amount_val = 35 + var_idx * 15
            url = f"http://auth-verify-portal{var_idx}.net/login?token={6000 + grp_num * 10 + var_idx}"
            text = tmpl.format(
                friend=FRIENDS_10[var_idx],
                amount=amount_val,
                student=STUDENTS_10[var_idx],
                school=SCHOOLS_10[var_idx],
                phone=phone_num,
                teacher=TEACHERS_10[var_idx],
                parent=PARENTS_10[var_idx],
                store=STORES_10[var_idx],
                city=CITIES_10[var_idx],
                time=HOURS_10[var_idx],
                subject=SUBJECTS_10[var_idx],
                sport=SPORTS_10[var_idx],
                last4=1000 + var_idx * 314,
                car=["white van", "silver sedan", "black SUV", "blue hatchback", "red pickup", "grey crossover", "dark station wagon", "green minivan", "white hybrid", "silver coupe"][var_idx],
                server=["Minecraft Community", "Roblox Builders Hub", "Anime Fans Club", "Game Dev Central", "High School Esports", "Study Lounge", "Graphic Designers", "Music Production", "Coding Teens", "Speedrunners"][var_idx],
                avatar=["ShadowNinja", "GalaxyGamer", "CyberKnight", "StarryNight", "PixelMaster", "ThunderBolt", "FrostBite", "NeonRider", "GoldenEagle", "MysticWolf"][var_idx],
                game=["CS:GO", "Dota 2", "Team Fortress 2", "Rust", "Unturned", "Payday 2", "Warframe", "Destiny 2", "PUBG", "Terraria"][var_idx],
                period=["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "morning homeroom", "afternoon advisory"][var_idx],
                track=50000 + var_idx * 123,
                appliance=APPLIANCES_10[var_idx],
                card=CARDS_10[var_idx],
                url=url
            )
            records.append({
                "message_text": text,
                "binary_label": "scam_or_suspicious",
                "scam_category": "impersonation",
                "concept_tags": concept,
                "difficulty": diff,
                "source_type": "synthetic",
                "source_name": "WiseCub Educational Synthetic Corpus v2.0",
                "source_reference": "WiseCub Scam Awareness Module: Impersonation Curriculum (Level 4)",
                "license": "CC-BY-NC-4.0",
                "template_group_id": grp_id,
                "generation_or_review_notes": f"Synthetic educational impersonation scenario {grp_num}, variant {var_idx+1}."
            })
    return records


def generate_synthetic_financial(target_count=150) -> List[Dict]:
    scenarios = [
        ("Crypto Youth Wealth: Turn ${amount} into ${ret} overnight! Guaranteed automated Bitcoin trading algorithm for teenagers in {city}. Join: {url}",
         "crypto_scam;get_rich_quick;unrealistic_returns", "easy"),
        ("Student Loan Forgiveness Grant: Clear 100% of future college debt for {school} students with youth grant. Apply with fee of ${fee} at {url}",
         "loan_forgiveness_scam;advance_fee;government_grant_pretext", "medium"),
        ("Passive Income System: Earn ${daily} per day by watching 30-second video advertisements on your phone! No experience required. Register: {url}",
         "task_scam;pyramid_lure;fake_employment", "easy"),
        ("P2P Cash Doubler: Send ${amount} on cash wallet and receive ${ret} back in 15 minutes! Promotional giveaway ending soon. Send funds to {wallet}",
         "cash_flip_scam;money_doubling;social_media_fraud", "easy"),
        ("Exclusive Teen NFT Drop: Mint free digital collectible cards worth ${ret} on OpenSea! Connect your crypto wallet to claim: {url}",
         "nft_drainer;crypto_wallet_theft;digital_asset_scam", "hard"),
        ("High-Yield Investment Program: Institutional stock trading bot generated {pct}% weekly return for student investors at {school}. Deposit funds: {url}",
         "ponzi_scheme;unrealistic_yield;fraudulent_trading_bot", "medium"),
        ("Credit Card Cloner Device: Make easy cash with pre-loaded debit cards of ${ret} balance! 100% anonymous delivery to {city}. Order: {url}",
         "carding_scam;illegal_activity_lure;wire_fraud", "easy"),
        ("Forex Youth Academy: Learn secret forex signals from top millionaire trader in {city}. ${fee} trial membership ends tonight at {url}",
         "forex_scam;guru_course_lure;recurring_subscription_trap", "medium"),
        ("Micro-Investing Bonus: Open a youth investment portfolio and receive ${ret} matching bonus immediately upon transferring ${amount} to {wallet}",
         "deposit_matching_scam;advance_deposit;fake_brokerage", "medium"),
        ("Online Mystery Shopper: Get paid ${daily} to evaluate {store} stores. We mail you a cashier check for ${ret} to buy gift cards. Apply: {url}",
         "fake_check_scam;mystery_shopper;gift_card_laundering", "hard"),
        ("Peer Loan Opportunity: Lend your allowance money to verified student borrowers at {school} and earn {pct}% weekly interest! Register at {url}",
         "unregulated_lending_scam;high_interest_promise;principal_theft", "hard"),
        ("Smartphone Mining App: Mine Ethereum on your iPhone without battery drain! Earn ${daily}.00 daily passive crypto income in {city}: {url}",
         "fake_miner;malware_distribution;crypto_scam", "medium"),
        ("Bank Glitch Exploit: Secret ATM deposit glitch at {store} lets you withdraw ${ret} for free! Selling method for ${amount} on Snapchat: {wallet}",
         "bank_glitch_scam;check_kiting_scheme;social_media_fraud", "easy"),
        ("College Tuition Fund Crowdfund: Help {student} pay emergency semester fees for {subject}. All donors receive 2x return from matching pool at {url}",
         "crowdfunding_scam;matching_pool_deception;charity_fraud", "hard"),
        ("Youth Startup Angel Investment: Invest ${amount} in next big tech app and own {shares} equity shares before IPO! Register: {url}",
         "unregistered_securities;penny_stock_lure;misleading_investment", "hard"),
    ]

    records = []
    variants_per_group = target_count // len(scenarios)
    for grp_num, (tmpl, concept, diff) in enumerate(scenarios, 1):
        grp_id = f"GRP-SYN-FIN-{grp_num:03d}"
        for var_idx in range(variants_per_group):
            wallet_id = f"cashtag-user{var_idx:02d}"
            url = f"http://crypto-p2p-trading{var_idx}.io/invest?ref={5000 + grp_num * 10 + var_idx}"
            text = tmpl.format(
                amount=[15, 20, 25, 30, 40, 50, 75, 100, 150, 200][var_idx],
                ret=[150, 250, 400, 500, 750, 1000, 1500, 2000, 2500, 3000][var_idx],
                fee=[25, 30, 35, 45, 50, 60, 75, 80, 95, 100][var_idx],
                daily=[45, 60, 75, 90, 120, 150, 180, 200, 250, 300][var_idx],
                pct=[25, 30, 35, 40, 45, 50, 60, 70, 80, 90][var_idx],
                shares=[500, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 7500, 10000][var_idx],
                city=CITIES_10[var_idx],
                school=SCHOOLS_10[var_idx],
                store=STORES_10[var_idx],
                student=STUDENTS_10[var_idx],
                subject=SUBJECTS_10[var_idx],
                url=url,
                wallet=wallet_id
            )
            records.append({
                "message_text": text,
                "binary_label": "scam_or_suspicious",
                "scam_category": "financial",
                "concept_tags": concept,
                "difficulty": diff,
                "source_type": "synthetic",
                "source_name": "WiseCub Educational Synthetic Corpus v2.0",
                "source_reference": "WiseCub Scam Awareness Module: Financial Scams Curriculum (Level 6)",
                "license": "CC-BY-NC-4.0",
                "template_group_id": grp_id,
                "generation_or_review_notes": f"Synthetic educational financial scam scenario {grp_num}, variant {var_idx+1}."
            })
    return records


def generate_synthetic_legitimate(target_count=950) -> List[Dict]:
    scenarios = [
        # 1-10: Academic reminders & School Administrative notifications
        ("Homework Reminder from {teacher}: Chapter {grade} reading questions for {subject} are due on {day} at start of period.",
         "homework_reminder;routine_academic;coursework", "easy"),
        ("School Library: Your borrowed book '{book}' is due in {days_left} days. Renew online at school portal or return to circulation desk.",
         "library_notice;due_date_reminder;routine_school_service", "easy"),
        ("Exam Timetable Notice: Midterm schedule for Grade {grade} {subject} is posted outside {room}. Check your assigned desk.",
         "exam_schedule;administrative_information;routine_school", "easy"),
        ("Field Trip Permission: Please return signed consent slip for {subject} trip on {day} to {teacher} by {time}.",
         "field_trip_slip;parental_permission;routine_school_procedure", "easy"),
        ("School Nurse Notice: Hearing and vision screening for Grade {grade} students at {school} takes place {day} morning.",
         "health_screening;routine_school_medical;benign_notice", "easy"),
        ("Parent-Teacher Conference: Scheduled appointment with {teacher} on {day} at {time} in {room}. Parking in North Lot.",
         "parent_conference;school_calendar;family_school_liaison", "easy"),
        ("Cafeteria Menu: {meal} available today at lunch line for {school} students. Normal meal plan card accepted.",
         "cafeteria_menu;daily_routine;benign_information", "easy"),
        ("Lost Property Office: {item} found in {room}. Collect from main office window before end of school day.",
         "lost_property;school_routine;benign_notification", "easy"),
        ("Student Council Meeting: Monthly general meeting this {day} at {time} in {room}. All grade reps must attend.",
         "student_council;meeting_schedule;school_civics", "easy"),
        ("Term Report Cards: Academic reports for {school} students in {subject} issued to parent portal accounts. Access through official website.",
         "report_cards;academic_records;official_portal", "medium"),

        # 11-20: Legitimate banking & pocket money (mentions money amounts naturally)
        ("WiseCub Pocket Money: Your weekly allowance of ${amount}.00 has been deposited to your savings vault by {parent}. Remaining balance: ${bal}.00.",
         "pocket_money;allowance_deposit;parental_financial_transfer", "hard"),
        ("Bank Transaction Confirmation: You spent ${spent}.50 at '{store}' using debit card ending in {last4} on {day}. Remaining balance: ${bal}.50.",
         "bank_notification;debit_transaction;balance_confirmation", "hard"),
        ("Savings Goal Achieved: Congratulations, you reached your ${goal_amt} goal for '{goal}'! WiseCub bonus interest of $2.50 credited to your account.",
         "savings_goal;interest_credit;financial_literacy_milestone", "hard"),
        ("Notice: Your automatic monthly savings transfer of ${amount}.00 to '{goal}' fund was completed on {day}. Ref: {ref_num}.",
         "scheduled_transfer;savings_vault;legitimate_banking", "medium"),
        ("Direct Deposit: Your weekend student wages of ${wage}.00 from '{store}' were credited to your checking account. Ref: {ref_num}.",
         "student_wages;direct_deposit;employment_compensation", "hard"),
        ("ATM Cash Receipt: Withdrawal of ${amount}.00 completed at {store} ATM on {day} at {time} for card ending in {last4}. Transaction fee: $0.00.",
         "atm_withdrawal;cash_receipt;banking_transaction", "medium"),
        ("Budget Milestone: Great job! You stayed under your ${spent} weekly budget this week. Weekly tracking: Saved ${amount}.20 towards savings goal.",
         "budgeting_tracker;financial_discipline;spending_alert", "hard"),
        ("Split Bill Payment: {friend} sent you ${amount}.00 for movie tickets at {store} via student cash wallet. Transfer receipt: {ref_num}.",
         "peer_p2p_transfer;split_expenses;cash_wallet", "hard"),
        ("Bank Statement Ready: Your monthly e-statement for student account ending in {last4} is now available in your online banking documents vault.",
         "bank_statement;routine_banking;financial_records", "medium"),
        ("Micro-Savings Round-Up: We rounded up your purchase at '{store}' and transferred ${amount}.85 into your piggy-bank investment vault.",
         "micro_savings;round_up_feature;financial_literacy", "hard"),

        # 21-30: Safe Authentication / 2FA / Password confirmation
        ("Your WiseCub verification code is {otp} for account ending in {last4}. This code expires in 10 minutes. Safely ignore if not requested.",
         "two_factor_auth;otp_security;standard_auth", "hard"),
        ("Your Google account security key was updated successfully on your {device} in {city}. If this was you, no further response is needed.",
         "security_confirmation;account_audit;benign_security_alert", "medium"),
        ("Password reset request received for your student email at {school}. If you initiated this, follow the secure link sent to your registered guardian.",
         "password_reset;security_procedure;guardian_notification", "hard"),
        ("Two-Factor Authentication: Your gaming profile for {game} now requires an authenticator app code on login for enhanced security.",
         "2fa_enablement;security_posture;benign_notification", "medium"),
        ("WiseCub Login Alert: Successful sign-in to {school} portal from {device} at {time}. No action required.",
         "benign_login_alert;audit_trail;routine_security", "medium"),
        ("Parent Consent Confirmed: Your guardian {parent} approved simulation emails for Scam Safety module on {day}.",
         "parental_consent;educational_compliance;wisecub_feature", "hard"),
        ("GitHub Student Developer Pack: Academic verification for {school} approved. Access developer tools at https://education.github.com",
         "student_developer_pack;academic_verification;benign_service", "medium"),
        ("School Portal PIN Changed: Your master student login PIN for {school} was updated in {room} on {day}.",
         "pin_change_confirmation;audit_trail;routine_security", "medium"),
        ("Discord Device Authorization: New login approved for user account from your {device} at {time}.",
         "device_auth_confirmation;benign_platform_notice;routine_security", "medium"),
        ("Apple ID Password Confirmation: The password for your student iCloud account on {device} was changed on {day} at {time}.",
         "password_change_receipt;security_confirmation;benign_alert", "medium"),

        # 31-40: Family coordination & Daily peer messages
        ("Hey! Mom said she will pick you up outside {school} gates at {time} today because of traffic on High Street.",
         "family_coordination;parent_pickup;daily_routine", "easy"),
        ("Are we still meeting at {friend}'s house on {day} to work on {subject} project? Let me know what art supplies to bring.",
         "peer_collaboration;homework_project;daily_peer_sms", "easy"),
        ("Can you bring my {subject} textbook to {school} tomorrow? I forgot it in your locker outside {room}.",
         "peer_communication;school_locker;daily_interaction", "easy"),
        ("Dad asked if you want {dinner} for dinner tonight on {day}. Text back before {time} so he can start cooking!",
         "family_dinner;coordination;daily_routine", "easy"),
        ("Hey {friend}, the {subject} teacher said we can submit the assignment as partners. Do you want to team up?",
         "peer_homework_teaming;collaboration;daily_peer_sms", "easy"),
        ("Uncle David texted to wish you good luck for your {sport} match against {opponent} this afternoon! Play your best!",
         "family_encouragement;sports_game;benign_family_sms", "easy"),
        ("Don't forget Grandma's birthday dinner on {day} at {time} at the Italian restaurant in {city}.",
         "family_calendar;birthday_gathering;social_routine", "easy"),
        ("I left my blue umbrella on the bus to {school} this morning. Did you see anyone hand it in at {room}?",
         "lost_item_inquiry;peer_sms;daily_commute", "easy"),
        ("Hey! Did you finish reading chapter {grade} of '{book}' yet? The plot twist with {character} was so good!",
         "book_discussion;reading_routine;peer_chat", "easy"),
        ("Mom said you need to walk the dog for {duration} minutes before playing {game} with {friend}.",
         "family_chore;household_routine;parent_instruction", "easy"),

        # 41-50: Retail, Transparent Student Discounts & Community activities
        ("City Cinema Student Club: Show your student ID card at box office on {day} to get movie tickets for ${amount}.00.",
         "retail_student_discount;transparent_terms;benign_promotional", "hard"),
        ("Bookstore Loyalty: You earned {points} points on reading club card at '{store}'! Redeem on your next visit for a free notebook.",
         "loyalty_rewards;bookstore_points;benign_promotional", "medium"),
        ("Library Book Club: Teen book discussion for '{book}' meets this {day} at {time} in {room}.",
         "community_library;teen_book_club;civic_activity", "easy"),
        ("YMCA Youth Basketball: Drop-in open court session every {day} {time}. ${fee} entry fee for high school students.",
         "sports_community;open_court;recreational_youth", "easy"),
        ("City Transit Pass: Monthly student bus pass for {city} available at station counter starting {day} for ${spent}.",
         "transit_pass;student_fare;public_transportation", "medium"),
        ("School Uniform Shop: Second-hand uniform donation sale this {day} 9 AM - 12 PM in {room}. All proceeds to charity.",
         "uniform_shop;school_charity;community_sale", "easy"),
        ("Youth Art Workshop: Free watercolor painting workshop for ages 12-16 at City Art Gallery on {day}. Reserve: gallery.city.gov",
         "art_workshop;community_culture;free_teen_event", "easy"),
        ("Park Tree Planting: Join local volunteer tree-planting initiative in {city} this {day} morning. Gloves provided at West Gate.",
         "community_volunteering;environmental_stewardship;civic_event", "easy"),
        ("Swimming Pool Schedule: Municipal pool public lane swimming in {city} open 6:30 AM - 8:00 AM on weekdays. Pass entry ${fee}.",
         "recreational_swimming;community_facility;healthy_routine", "easy"),
        ("Farmers Market: Fresh apples, strawberries, and homemade lemonade stalls open {day} at Town Square in {city}.",
         "farmers_market;community_weekend;local_economy", "easy"),

        # 51-60: Extracurricular clubs, Science & Hobbies
        ("Robotics Club: Team meeting this {day} after school in {room} to test autonomous line-following sensor on competition robot.",
         "robotics_club;stem_activity;extracurricular_meeting", "easy"),
        ("Debating Society: The motion for debate is '{debate_topic}'. Prep session in {room} with {teacher}.",
         "debating_society;critical_thinking;school_club", "easy"),
        ("Chess Tournament: Term championship in {subject} room begins next {day}. Round 1 pairings posted on notice board outside {room}.",
         "chess_club;tournament_pairings;school_hobby", "easy"),
        ("Coding Club: We are building a retro 2D platformer in Python Pygame this term! Next session {day} at {time} in {room}.",
         "coding_club;programming_skills;educational_youth", "easy"),
        ("School Choir: Final vocal warm-up for {concert} takes place tomorrow at {time} in the auditorium with {teacher}.",
         "school_choir;performing_arts;rehearsal_schedule", "easy"),
        ("Drama Club Play: Auditions for '{play}' will be held on {day} afternoon at {time} in the drama studio.",
         "drama_auditions;theatre_arts;student_performance", "easy"),
        ("Astronomy Night: Weather permitting, telescope stargazing night scheduled for {day} at {time} on {school} sports field.",
         "astronomy_club;science_stargazing;extracurricular_event", "easy"),
        ("Model United Nations: Delegate country allocations for youth conference in {city} emailed to delegates. Check your inbox.",
         "model_un;civic_diplomacy;student_conference", "easy"),
        ("Environmental Action Group: Clean-up drive around {school} creek this {day} period 5. Rubber boots recommended.",
         "environmental_club;community_service;school_grounds", "easy"),
        ("School Newspaper: Submit articles, artwork, and opinion pieces for the issue of '{newspaper}' by {day} {time}.",
         "school_newspaper;student_journalism;creative_writing", "easy"),

        # 61-70: Sports fixtures & Outdoor activities
        ("Track & Field Trials: {track_event} trials this {day} after school on {school} main athletics track.",
         "track_and_field;sports_trials;extracurricular_athletics", "easy"),
        ("Soccer Match Result: Well played team! {school} won {score} against {opponent}. Next practice {day} 4 PM.",
         "soccer_result;peer_sports;team_encouragement", "easy"),
        ("Cross Country Run: Wear running spikes for tomorrow's regional cross-country meet in {city}. Bus departs {room} at {time}.",
         "cross_country;sports_logistics;morning_schedule", "easy"),
        ("Tennis Club: Courts 1-4 reserved for {school} practice on {day} {time}. Bring your own tennis balls.",
         "tennis_club;recreational_sports;facility_booking", "easy"),
        ("Volleyball Tournament: Inter-house volleyball tournament kicks off this {day} lunch period in {room}.",
         "volleyball_tournament;school_spirit;inter_house", "easy"),
        ("Gym Fitness Center: Free student orientation for cardiovascular fitness machines {day} {time} with Coach Tanaka.",
         "fitness_orientation;healthy_lifestyle;gym_facility", "easy"),
        ("Cycling Club: Weekend group bike ride along scenic river trail in {city} meeting {day} 9 AM at community bridge.",
         "cycling_club;outdoor_recreation;weekend_routine", "easy"),
        ("Skatepark Session: City Skatepark lights in {city} will be on until 8 PM this {day} for all local high school students.",
         "skatepark_session;youth_recreation;community_facility", "easy"),
        ("Table Tennis Ladder: Match challenges for table tennis ladder must be completed by {day}. Score sheet in {room}.",
         "table_tennis;recreational_ladder;student_activity", "easy"),
        ("Badminton Doubles: Sign up for mixed doubles badminton tournament outside PE office in {school} before end of week.",
         "badminton_tournament;student_sports;sign_up_notice", "easy"),

        # 71-80: Educational Technology, Coding & Gaming Communities
        ("Minecraft Education Edition: Multiplayer server for history project is online. Build assigned {minecraft_topic} section.",
         "minecraft_education;collaborative_learning;game_based_study", "medium"),
        ("Scratch Game Jam: High school game jam theme announced: '{game_theme}'. Submit project link on classroom portal.",
         "game_jam;creative_computing;educational_tech", "easy"),
        ("Khan Academy Challenge: Master {num_skills} skills in {subject} this week to earn the Algebra Master badge.",
         "khan_academy;online_learning;gamified_education", "easy"),
        ("Duolingo Classroom: Spanish practice streak: {streak}-day milestone reached! Keep practicing 10 minutes daily.",
         "language_learning;streak_reminder;educational_habit", "easy"),
        ("Roblox Studio Workshop: Intro to Lua scripting for building obstacle courses this {day} online at {time}.",
         "roblox_studio;coding_workshop;youth_game_dev", "medium"),
        ("Typing Speed Test: Grade {grade} computer lab average reached {wpm} words per minute. Practice on typing club site.",
         "typing_speed;digital_literacy;classroom_skills", "easy"),
        ("Quizlet Flashcards: New vocabulary set for {subject} module shared by {teacher} on study group.",
         "quizlet_study;flashcards;collaborative_study", "easy"),
        ("GeoGuessr Geography League: School regional geography tournament round {round_num} live today at {time} in {room}.",
         "geoguessr;geography_skills;academic_gaming", "easy"),
        ("Wikipedia Student Editing: Learn how to cite reliable academic sources in {subject} research. Seminar on {day}.",
         "information_literacy;citation_skills;academic_integrity", "medium"),
        ("Podcast Production Studio: Reserve the microphone booth for media studies project during free period with {teacher}.",
         "podcast_studio;media_education;creative_project", "easy"),

        # 81-90: Creative Arts, Music & Literature
        ("School Orchestra: Woodwind and brass sectional rehearsal {day} {time} sharp in {room}.",
         "school_orchestra;music_rehearsal;instrumental_music", "easy"),
        ("Graphic Design Contest: Submit your digital artwork for {school} festival poster by end of month to {teacher}.",
         "graphic_design;art_contest;creative_youth", "easy"),
        ("Creative Writing Club: Prompt of the week: '{writing_prompt}'. Share your short stories on {day} in {room}.",
         "creative_writing;literature_club;student_expression", "easy"),
        ("Photography Club: Photo walk scheduled for autumn foliage around {city} botanic gardens this {day} {time}.",
         "photography_club;art_activity;nature_walk", "easy"),
        ("Pottery & Ceramics: Glazed ceramic bowls from last week's pottery class ready for pickup outside {room}.",
         "ceramics_class;visual_arts;student_projects", "easy"),
        ("Film Appreciation Society: Screening classic sci-fi film '{scifi_movie}' this {day} at {time} in lecture hall.",
         "film_society;cinema_studies;after_school_club", "easy"),
        ("Guitar Ensemble: Acoustic guitar ensemble practice {day} {time} in {room}. Bring your tuner and capo.",
         "guitar_ensemble;music_group;rehearsal_routine", "easy"),
        ("Poetry Slam: Annual student poetry slam open mic night next {day} 6 PM in {school} library courtyard.",
         "poetry_slam;literary_arts;student_performance", "easy"),
        ("Animation Workshop: Learn stop-motion animation using clay and tablets! 2-hour workshop at {room} on {day}.",
         "animation_workshop;digital_arts;creative_media", "easy"),
        ("School Brass Band: Marching band uniform fitting for upcoming parade in {city} takes place {day} lunch.",
         "brass_band;parade_preparation;music_logistics", "easy"),

        # 91-95: Career Exploration, Life Skills & Mentorship
        ("Career Exploration Day: Guest speakers from healthcare, software engineering, and graphic design visit {school} next {day}.",
         "career_day;future_pathways;vocational_guidance", "easy"),
        ("Youth First Aid Certificate: Complete CPR and basic first aid certification course this {day} 9 AM - 1 PM in {room}.",
         "first_aid_training;life_skills;safety_certification", "easy"),
        ("Driver Education: Theory test preparation seminar for sophomores in {city} starting next {day} evening.",
         "drivers_ed;life_skills;youth_milestone", "easy"),
        ("Cooking & Nutrition Workshop: Learn to prepare healthy stir-fry bowls on a student budget! Home economics kitchen on {day}.",
         "cooking_workshop;nutrition;budget_meal_prep", "easy"),
        ("Senior Peer Mentoring: Grade 12 study mentors available in library every afternoon to help {subject} students.",
         "peer_mentoring;academic_support;community_care", "easy"),
    ]

    records = []
    variants_per_group = target_count // len(scenarios)

    for grp_num, (tmpl, concept, diff) in enumerate(scenarios, 1):
        grp_id = f"GRP-SYN-LEGIT-{grp_num:03d}"
        for var_idx in range(variants_per_group):
            text = tmpl.format(
                teacher=TEACHERS_10[var_idx],
                subject=SUBJECTS_10[var_idx],
                grade=7 + (var_idx % 6),
                book=BOOKS_10[var_idx],
                day=DAYS_10[var_idx],
                days_left=2 + var_idx,
                time=HOURS_10[var_idx],
                parent=PARENTS_10[var_idx],
                amount=15 + var_idx * 5,
                bal=65 + var_idx * 15,
                spent=12 + var_idx * 4,
                goal_amt=100 + var_idx * 25,
                goal=GOALS_10[var_idx],
                wage=40 + var_idx * 10,
                store=STORES_10[var_idx],
                friend=FRIENDS_10[var_idx],
                otp=f"{random.randint(100000, 999999)}",
                sport=SPORTS_10[var_idx],
                school=SCHOOLS_10[var_idx],
                room=ROOMS_10[var_idx],
                city=CITIES_10[var_idx],
                device=DEVICES_10[var_idx],
                last4=1000 + var_idx * 314,
                ref_num=482000 + var_idx * 111,
                meal=["Vegetarian lasagna and salad", "Grilled chicken wrap", "Pasta primavera", "Turkey club sandwich", "Tofu stir-fry bowl", "Bean burrito", "Margherita pizza slice", "Lentil soup and roll", "Baked falafel plate", "Fish taco platter"][var_idx],
                item=["Blue water bottle with stickers", "Gym jacket with school crest", "Casio scientific calculator", "Wireless earbuds in case", "Pair of running shoes", "Black umbrella", "Binder with biology notes", "Student transit pass", "Reading glasses in red case", "Art portfolio folder"][var_idx],
                dinner=["chicken pasta", "homemade pizza", "beef stir-fry", "veggie tacos", "grilled cheese and soup", "baked salmon", "spaghetti bolognese", "burrito bowls", "chicken curry", "mac and cheese"][var_idx],
                opponent=["City Poly Prep", "Hillcrest Grammar", "Northstar Academy", "Glenwood Secondary", "Lincoln High", "Crestview College", "Beacon Hills High", "Westbrook Central", "St. Jude Academy", "Oakridge High"][var_idx],
                character=["Jonas", "Atticus", "Ponyboy", "Montag", "Meg Murry", "Ralph", "Snowball", "Winston", "Bilbo", "Pip"][var_idx],
                duration=[15, 20, 25, 30, 35, 40, 45, 50, 55, 60][var_idx],
                game=["Minecraft", "Roblox", "Fortnite", "Rocket League", "Brawl Stars", "Chess", "FIFA", "Overwatch", "Valorant", "Apex Legends"][var_idx],
                points=[50, 75, 100, 125, 150, 175, 200, 250, 300, 350][var_idx],
                fee=[2.00, 2.50, 3.00, 3.50, 4.00, 4.50, 5.00, 5.50, 6.00, 6.50][var_idx],
                debate_topic=["AI in classrooms", "Social media age limits", "School uniforms policy", "Cryptocurrency education", "Renewable energy grants", "Standardized testing", "Four-day school weeks", "Space exploration budgets", "Youth civic voting", "Public transit fares"][var_idx],
                concert=CONCERTS_10[var_idx],
                play=PLAYS_10[var_idx],
                newspaper=["The Oakridge Post", "The Student Voice", "The Campus Chronicle", "The High School Herald", "The Poly News", "The Academic Times", "The Youth Gazette", "The Secondary Sentinel", "The Crestview Observer", "The Beacon Beacon"][var_idx],
                track_event=["100m sprint and high jump", "400m relay and long jump", "800m run and shot put", "1500m race and javelin", "hurdles and triple jump", "200m sprint and pole vault", "distance run and discus", "relay sprint and high jump", "sprint hurdles and shot put", "steeplechase and long jump"][var_idx],
                score=["3-1", "2-0", "4-2", "1-0", "3-2", "2-1", "4-1", "5-3", "2-2 (penalties)", "3-0"][var_idx],
                minecraft_topic=MINECRAFT_10[var_idx],
                game_theme=["Renewable Energy", "Space Colonization", "Ocean Cleanup", "Ancient Civilizations", "AI Companions", "Medieval Defense", "Time Travel", "Deep Sea Mystery", "Urban Farming", "Microscopic World"][var_idx],
                num_skills=[3, 4, 5, 6, 7, 8, 9, 10, 12, 15][var_idx],
                streak=[10, 15, 20, 25, 30, 40, 50, 60, 75, 100][var_idx],
                wpm=[38, 42, 45, 48, 52, 55, 58, 62, 65, 70][var_idx],
                round_num=[1, 2, 3, 4, 5, 6, 7, 8, 9, 10][var_idx],
                writing_prompt=["The door that wouldn't open", "The message from 2050", "The clock that ran backwards", "The shadow with no owner", "The last bus in the fog", "The locker secret", "The key to nowhere", "The echo in the attic", "The painting that changed", "The whisper in the wire"][var_idx],
                scifi_movie=["2001: A Space Odyssey", "Interstellar", "Blade Runner", "The Matrix", "Arrival", "Back to the Future", "The Truman Show", "Gattaca", "Contact", "WALL-E"][var_idx]
            )
            records.append({
                "message_text": text,
                "binary_label": "legitimate_or_benign",
                "scam_category": "legitimate_or_benign",
                "concept_tags": concept,
                "difficulty": diff,
                "source_type": "synthetic",
                "source_name": "WiseCub Educational Synthetic Corpus v2.0",
                "source_reference": "WiseCub Scam Awareness Module: Benign Youth Communications",
                "license": "CC-BY-NC-4.0",
                "template_group_id": grp_id,
                "generation_or_review_notes": f"Synthetic educational benign scenario {grp_num}, variant {var_idx+1}."
            })
    return records


# ==============================================================================
# 4. DATASET ASSEMBLY & VALIDATION EXPORT
# ==============================================================================

def build_corrected_dataset():
    print("=" * 70)
    print("WiseCub Scam Awareness ML — Corrected Dataset Generator (v2)")
    print("=" * 70)

    # 1. Load public UCI with near-duplicate campaign clustering
    print("\n[Step 1/3] Extracting & clustering public benchmark data (UCI SMS Spam)...")
    public_records, public_diag = load_and_cluster_public_uci(target_spam=300, target_ham=300, sim_threshold=0.50)
    print(f"  Extracted {len(public_records)} public records (300 spam, 300 ham).")
    print(f"  Clustered spam into {public_diag['spam_campaign_clusters']} campaign groups.")
    print(f"  Clustered ham into {public_diag['ham_template_clusters']} template groups.")

    # 2. Generate synthetic records without shortcuts
    print("\n[Step 2/3] Generating synthetic curriculum data without label shortcuts...")
    syn_phish = generate_synthetic_phishing(200)
    syn_sms = generate_synthetic_sms(100)
    syn_qr = generate_synthetic_qr(200)
    syn_prize = generate_synthetic_prize(100)
    syn_imp = generate_synthetic_impersonation(200)
    syn_fin = generate_synthetic_financial(150)
    syn_legit = generate_synthetic_legitimate(950)

    synthetic_scam = syn_phish + syn_sms + syn_qr + syn_prize + syn_imp + syn_fin
    print(f"  Generated {len(synthetic_scam)} synthetic scam examples across 6 categories.")
    print(f"  Generated {len(syn_legit)} synthetic legitimate examples across school/family/banking.")
    print(f"  Total synthetic examples: {len(synthetic_scam) + len(syn_legit)}")

    # 3. Assemble and assign sequential v2 example IDs
    all_records = public_records + synthetic_scam + syn_legit
    random.seed(SEED)
    random.shuffle(all_records)

    for idx, rec in enumerate(all_records, 1):
        rec["example_id"] = f"EX2-{idx:04d}"

    cols = [
        "example_id", "message_text", "binary_label", "scam_category",
        "concept_tags", "difficulty", "source_type", "source_name",
        "source_reference", "license", "template_group_id", "generation_or_review_notes"
    ]
    df = pd.DataFrame(all_records)[cols]

    # Verification checks
    prohibited_tokens = ["#LEG-", "#PH-", "#QR-", "#IMP-", "#FIN-", "#PRZ-", "#SMS-", "LEG-", "PH-", "PRZ-", "IMP-"]
    leaks_found = 0
    for tok in prohibited_tokens:
        cnt = df["message_text"].str.contains(tok, regex=False).sum()
        if cnt > 0:
            print(f"  WARNING: Detected {cnt} occurrences of '{tok}' in message_text!")
            leaks_found += cnt
    if leaks_found == 0:
        print("  [PASS] Zero label-revealing tokens or category abbreviations detected in message_text.")

    dupe_count = df.duplicated(subset=["message_text"]).sum()
    if dupe_count == 0:
        print("  [PASS] Zero exact duplicate texts detected across entire 2,500 rows.")
    else:
        print(f"  WARNING: Detected {dupe_count} duplicate texts!")

    out_csv = DATA_DIR / "scam_messages_dataset_v2.csv"
    df.to_csv(out_csv, index=False, encoding="utf-8")
    print(f"\n[Step 3/3] Successfully saved corrected dataset to:\n  {out_csv}")
    print(f"  Total rows: {len(df)}")
    print(f"  Class balance: {df['binary_label'].value_counts().to_dict()}")
    print(f"  Provenance balance: {df['source_type'].value_counts().to_dict()}")
    print(f"  Unique template groups: {df['template_group_id'].nunique()}")

    # Save manifest
    manifest_rows = []
    for grp, sub in df.groupby("template_group_id"):
        manifest_rows.append({
            "template_group_id": grp,
            "row_count": len(sub),
            "binary_label": sub["binary_label"].iloc[0],
            "scam_category": sub["scam_category"].iloc[0],
            "source_type": sub["source_type"].iloc[0],
            "difficulty": sub["difficulty"].iloc[0],
            "sample_snippet": sub["message_text"].iloc[0][:80]
        })
    manifest_df = pd.DataFrame(manifest_rows)
    manifest_csv = DATA_DIR / "dataset_manifest_v2.csv"
    manifest_df.to_csv(manifest_csv, index=False, encoding="utf-8")
    print(f"  Saved dataset manifest to:\n  {manifest_csv}")

    diag_file = DATA_DIR / "grouping_diagnostics.json"
    with open(diag_file, "w", encoding="utf-8") as f:
        json.dump(public_diag, f, indent=2)
    print(f"  Saved grouping diagnostics to:\n  {diag_file}")


if __name__ == "__main__":
    build_corrected_dataset()
