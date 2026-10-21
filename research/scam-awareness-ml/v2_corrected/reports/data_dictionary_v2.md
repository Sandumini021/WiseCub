# WiseCub Scam Awareness ML — Data Dictionary (Dataset v2.0)

**Corpus Name:** WiseCub Scam Message Classification Corpus (v2.0 Corrected)  
**Location:** `research/scam-awareness-ml/v2_corrected/data/scam_messages_dataset_v2.csv`  
**Manifest:** `research/scam-awareness-ml/v2_corrected/data/dataset_manifest_v2.csv`  
**Total Records:** 2,500 balanced rows (1,250 scam, 1,250 legitimate)  
**Target Variable:** `binary_label` (Binary Classification)  

---

## 1. Schema Definition

| Column Name | Data Type | Permitted Values / Format | Description & Scientific Constraints |
| :--- | :---: | :--- | :--- |
| **`example_id`** | String | `EX2-0001` to `EX2-2500` | Unique alphanumeric identifier for each observation in dataset v2. |
| **`message_text`** | String | Raw text (15 to 400 characters) | The natural language text message fed into the classifier. **Zero label shortcuts, category prefixes, or artificial suffixes are permitted.** |
| **`binary_label`** | String | `scam_or_suspicious`, `legitimate_or_benign` | Target classification label (50/50 balance: 1,250 positive, 1,250 negative). |
| **`scam_category`** | String | `phishing`, `sms`, `qr`, `prize`, `impersonation`, `financial`, `legitimate_or_benign` | Specific curricular category aligned with WiseCub 6-level scam awareness modules. |
| **`concept_tags`** | String | Semicolon-delimited concepts | Pedagogical concepts taught (e.g. `hi_mum_scam;financial_coercion;urgency`). |
| **`difficulty`** | String | `easy`, `medium`, `hard` | Linguistic complexity and subtlety of deception. |
| **`source_type`** | String | `synthetic`, `public_dataset` | Provenance indicator: 76.0% synthetic curriculum, 24.0% public benchmark. |
| **`source_name`** | String | Name of originating corpus | `WiseCub Educational Synthetic Corpus v2.0` or `UCI SMS Spam Collection`. |
| **`source_reference`** | String | Formal citation / curriculum link | Academic paper reference or WiseCub curriculum module. |
| **`license`** | String | `CC-BY-4.0`, `CC-BY-NC-4.0` | Intellectual property license governing data usage. |
| **`template_group_id`** | String | `GRP-SYN-xxx` or `GRP-UCI-xxx-CAMP-xxx` | **Strict splitting key.** Groups all variants of a synthetic template or clustered public campaign to prevent split leakage. |
| **`generation_or_review_notes`** | String | Free-text provenance log | Notes on origin line, campaign cluster ID, or generation context. |

---

## 2. Key Differences from v1.0
1. **Shortcut Tokens Removed:** In v1.0, `message_text` contained reference codes like `#LEG-1234` or `#PH-1234`. In v2.0, all messages are formatted naturally without label markers.
2. **Campaign Grouping:** In v1.0, public UCI records were grouped sequentially in blocks of 10. In v2.0, public records are clustered by TF-IDF cosine similarity ($\ge 0.50$) into verified campaign groups (`GRP-UCI-SPAM-CAMP-xxx`).
3. **Pure Text Uniqueness:** 100% of the 2,500 messages are uniquely worded (0 exact duplicates).
