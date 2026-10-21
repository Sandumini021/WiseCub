# WiseCub Scam Awareness ML — Data Dictionary

**Dataset File:** `data/scam_messages_dataset.csv`  
**Dataset Version:** `1.0.0` (Canonical Release)  
**Total Rows:** `2,500`  
**Total Columns:** `12`  
**Encoding:** `UTF-8`  
**Target Variable:** `binary_label` (`scam_or_suspicious` vs. `legitimate_or_benign`)

---

## 1. Column Specifications

| Column Name | Data Type | Nullable | Permitted Values / Format | Description & Purpose |
| :--- | :--- | :---: | :--- | :--- |
| **`example_id`** | String | No | Regex: `^EX-\d{4}$` (e.g. `EX-0001` to `EX-2500`) | Stable, unique identifier for every example in the dataset. |
| **`message_text`** | String | No | Free-form text (15 to 450 characters) | Full text content of the message (email body snippet, SMS text, or QR notification text). Cleaned of extraneous control characters. |
| **`binary_label`** | String | No | `scam_or_suspicious`, `legitimate_or_benign` | Primary binary target classification label. |
| **`scam_category`** | String | No | `phishing`, `sms`, `qr`, `prize`, `impersonation`, `financial`, `legitimate_or_benign` | Granular pedagogical topic category. For benign records, this is designated as `legitimate_or_benign`. |
| **`concept_tags`** | String | No | Semicolon-delimited tokens (e.g. `urgency;credential_harvesting`) | Descriptive educational tags indicating deceptive mechanisms or benign communication contexts. |
| **`difficulty`** | String | No | `easy`, `medium`, `hard` | Estimated cognitive difficulty level for a secondary school learner (aged 12–16) encountering the message. |
| **`source_type`** | String | No | `public_dataset`, `synthetic`, `manually_reviewed` | Provenance classification indicating the creation origin of the example. |
| **`source_name`** | String | No | E.g. `UCI SMS Spam Collection`, `WiseCub Educational Synthetic Corpus v1.0` | Title of the parent corpus or authoring organization. |
| **`source_reference`** | String | No | DOI citation, academic reference, or curriculum module link | Academic citation or curriculum reference verifying legal provenance. |
| **`license`** | String | No | `CC-BY-4.0`, `CC-BY-NC-4.0` | Copyright license under which the individual example is distributed. |
| **`template_group_id`** | String | No | Regex: `^GRP-[A-Z]+-[A-Z0-9]+-\d{3}$` | Cluster ID linking message templates and close variants. **Mandatory for grouped train/test splitting** to prevent memorization leakage. |
| **`generation_or_review_notes`** | String | No | Descriptive text | Audit trail notes detailing synthesis rules, line references from public corpora, or annotation criteria. |

---

## 2. Categorical Value Domains

### 2.1 Binary Target Label (`binary_label`)

- **`scam_or_suspicious` (1,250 rows / 50.0%):** Messages exhibiting fraudulent, deceptive, coercive, or credential-harvesting intent.
- **`legitimate_or_benign` (1,250 rows / 50.0%):** Authentic, everyday messages including youth communication, school announcements, real 2FA codes, and genuine banking transactions.

### 2.2 Pedagogical Category (`scam_category`)

1. **`phishing`:** Deceptive emails mimicking educational portals, cloud storage quotas, LMS homework submissions, or IT helpdesks seeking student passwords.
2. **`sms`:** Fraudulent text messages simulating urgent courier delivery fees, parcel customs clearance, or unpaid toll road notices.
3. **`qr`:** Quishing attacks where physical stickers or digital QR codes redirect to malicious portals (e.g. restaurant menu overlays, e-scooter locks, rogue public WiFi).
4. **`prize`:** Unearned high-value lures (PlayStation 5 giveaways, Robux jackpots, mystery box unboxing fees, celebrity cash drops).
5. **`impersonation`:** Social engineering impersonating authority figures (school principals, teachers, Discord moderators) or panicked peers/family members requesting urgent money transfers.
6. **`financial`:** Get-rich-quick investment schemes, cryptocurrency doubling bots, predatory student micro-loans, and fake video-rating work-from-home tasks.
7. **`legitimate_or_benign`:** Non-scam messages covering everyday family coordination, sports practice schedules, library due dates, authentic bank balances, and transparent student discounts.

### 2.3 Difficulty Levels (`difficulty`)

- **`easy` (1,120 rows / 44.8%):** Obvious red flags, exaggerated prizes (e.g. "You won a PS5 Pro in 15 minutes!"), crude threats, or generic non-deceptive peer messages.
- **`medium` (850 rows / 34.0%):** Realistic pretexts with plausible context (e.g. parcel clearance fees with tracking numbers, school sports schedules).
- **`hard` (530 rows / 21.2%):** Sophisticated attacks mimicking trusted authorities (e.g. teacher asking for homework login, peer emergency with temporary SIM), and benign messages that include monetary amounts, links, or OTP codes.

---

## 3. Example Record Preview

```csv
example_id,message_text,binary_label,scam_category,concept_tags,difficulty,source_type,source_name,source_reference,license,template_group_id,generation_or_review_notes
EX-0001,"Final Notice: Your student cloud storage quota of 7GB has been exceeded at Oakridge High. Assignment files will be purged in 4 hours. Verify portal ID #PH-0101 immediately: http://portal-oakridgehigh-edu1.net/verify?t=1011",scam_or_suspicious,phishing,storage_quota_scam;fake_urgency;credential_harvesting,hard,synthetic,WiseCub Educational Synthetic Corpus v1.0,WiseCub Scam Awareness Module: Phishing Curriculum (Level 1),CC-BY-NC-4.0,GRP-SYN-PHISH-001,Synthetic educational phishing email variant 2 for youth safety curriculum.
EX-0002,"WiseCub Pocket Money: Your weekly allowance of $20.00 has been deposited to your savings vault by Mom. Balance #LEG-1101: $70.00.",legitimate_or_benign,legitimate_or_benign,pocket_money;allowance_deposit;parental_financial_transfer,hard,synthetic,WiseCub Educational Synthetic Corpus v1.0,WiseCub Scam Awareness Module: Benign Youth Communication Corpus,CC-BY-NC-4.0,GRP-SYN-LEGIT-011,Synthetic legitimate message variant 2 representing realistic everyday youth digital life.
```
