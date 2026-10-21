# WiseCub Scam Awareness ML Research — Data Dictionary (v3 Final)

**Document Version:** 3.0.0  
**Artifact Target:** `research/scam-awareness-ml/v3_final/data/scam_messages_dataset_v3.csv`  
**Dataset Size:** 2,500 records (1,250 Scam, 1,250 Legitimate)  
**Total Template/Campaign Groups:** 692 unique clusters  
**Research Persona:** Academic Reproducibility Auditor & Senior ML Researcher (WiseCub Member 4)

---

## 1. Overview and Design Principles

The `v3_final` dataset is specifically constructed for educational machine learning research within WiseCub, a financial-literacy application for youth aged 12–16. 

### Key Methodological Safeguards:
1. **Total Isolation from Production:** No private learner communications, guardian details, or live student data are included or accessed.
2. **Explicit Separation of Metadata:** Target labels, curriculum categories, template groups, and identifiers are strictly separated in dedicated columns and **never leaked** into `message_text`.
3. **Transparent Provenance:** Every sample is tagged with its original corpus, licensing terms, and generation methodology.
4. **Group-Aware Splitting:** 692 disjoint template groups ensure that campaign variants and near-duplicate messages never leak across train, validation, or test partitions.

---

## 2. Dataset Schema (12 Columns)

| Column Name | Data Type | Nullable | Allowed Values / Format | Description |
|---|---|---|---|---|
| `example_id` | String | No | `EX3-[0-9]{4}` | Unique surrogate primary key for every record in the v3 dataset (e.g., `EX3-0001`). |
| `message_text` | String | No | Non-empty UTF-8 text | Raw natural language message evaluated by the classifier. Contains zero label-revealing tags or synthetic shortcuts. |
| `binary_label` | String | No | `scam_or_suspicious`, `legitimate_or_benign` | Target ground-truth classification label for supervised training. |
| `scam_category` | String | No | One of 6 WiseCub categories or `legitimate_or_benign` | Specific curriculum category (see Section 3). |
| `concept_tags` | String | No | Semicolon-delimited tokens | Educational pedagogical concepts demonstrated in the message (e.g., `urgency_tactic;fake_authority`). |
| `difficulty` | String | No | `easy`, `medium`, `hard` | Pedagogical difficulty assessment based on linguistic subtlety. |
| `source_type` | String | No | `synthetic`, `public_benchmark` | High-level provenance indicator separating simulated scenarios from historical public data. |
| `source_name` | String | No | Descriptive string | Exact originating corpus (e.g., `WiseCub Educational Synthetic Corpus v3.0`, `UCI SMS Spam Collection`). |
| `source_reference` | String | No | Bibliographic / link citation | Primary source citation or curricular reference. |
| `license` | String | No | SPDX license string | Licensing terms governing use (e.g., `CC-BY-NC-4.0`, `CC0-1.0 / Public Domain`). |
| `template_group_id` | String | No | `GRP-V3-[A-Z0-9\-]+` | Disjoint campaign/template group identifier used for group-aware cross-validation and partitioning. |
| `generation_or_review_notes` | String | Yes | Free text | Academic documentation notes detailing template variation parameters or sampling quintile. |

---

## 3. Curriculum Category Definitions

The dataset maps directly to the six core modules of the WiseCub youth scam awareness curriculum:

1. **`phishing` (Phishing & Impersonation):** Deceptive messages purporting to originate from trusted online services, school platforms, social media, or cloud accounts requesting credential re-entry or password resets.
2. **`malware` (Malware & Malicious Downloads):** Prompts instructing teenagers to download unauthorized APKs, software cracks, game mods, or suspicious file attachments.
3. **`financial_fraud` (Investment & Financial Fraud):** Unrealistic get-rich-quick proposals, teenage peer-to-peer crypto doubling schemes, unauthorized cash-app transfer requests, and fake part-time remote work scams.
4. **`prize_giveaway` (Prize, Lottery & Giveaway Scams):** Fake claims that the recipient has won a smartphone, gaming console, gift card, or cash prize, contingent on paying an upfront 'processing fee' or sharing personal details.
5. **`fake_security_alert` (Fake Security & Tech Support Alerts):** Intimidating warnings falsely asserting that the user's phone or computer is infected with viruses or compromised, directing them to call toll-free numbers or install remote-access tools.
6. **`sms` (SMS & Social Media Social Engineering):** General short-message social engineering tactics, including legacy SMS premium rate fraud, fake shipping delivery notifications, and urgent family impersonation ('Hi Mum' scams).
7. **`legitimate_or_benign` (Authentic Youth & Service Communications):** Benign school communications, authentic parental logistics, genuine two-factor authentication tokens, real student loyalty rewards, and authentic peer conversation.

---

## 4. Provenance and Sampling Stratification

The v3 dataset comprises **2,500 total instances**:

```
+-----------------------------------------------------------+
|               WiseCub v3 Dataset (N = 2,500)             |
+-----------------------------+-----------------------------+
|   Synthetic (n = 1,900)     | Public Benchmark (n = 600)  |
|  - 950 Scam / 950 Legit     |   - 300 Scam / 300 Legit    |
|  - 400 Curricular Templates |   - UCI SMS Spam Collection |
|  - 10-15 lexical variants   |   - Length-stratified       |
+-----------------------------+-----------------------------+
```

### Public Benchmark Sampling Methodology:
Unlike v1 and v2 which extracted records sequentially from the top of the UCI file, v3 employs **length-stratified quantile sampling** (5 quintiles across message character length) with a fixed pseudo-random seed (`SEED = 42`). This guarantees representative coverage across short notifications, standard conversational texts, and extended commercial offers while preserving raw UCI text verbatim.

### Limitations Regarding Modern Applicability:
Historical public datasets like the UCI SMS Spam Collection (circa 2003–2012) feature legacy technologies (e.g., Nokia ringtone subscriptions, 150p billing codes, WAP links) that differ markedly from modern youth social messaging (Discord, Instagram DMs, TikTok, Snapchat). The public subset is included strictly as an academic benchmarking reference and must **not** be interpreted as representative of current digital threats faced by youth.
