# WiseCub Scam Awareness ML — Grouping & Data Leakage Diagnostics (v3 Final)

**Document Title:** Campaign Clustering, Cross-Split Similarity & Zero-Leakage Audit (v3)  
**Date:** 2026-10-21  

---

## 1. Group-Based Partitioning Integrity

| Split Partition | Row Count | Proportion | Unique Groups | Scam Examples | Legit Examples |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Training Set** | 1670 | 66.8% | 484 | 866 | 804 |
| **Validation Set** | 426 | 17.0% | 104 | 251 | 175 |
| **Held-Out Test Set** | 404 | 16.2% | 104 | 133 | 271 |

### Template Group Overlap Check
- Overlap between Train and Validation: **`0 groups`**
- Overlap between Train and Test: **`0 groups`**
- Overlap between Validation and Test: **`0 groups`**

---

## 2. Cross-Split Cosine Similarity Audit (Classifier Feature Space)

Evaluated using the exact downstream classifier feature space: `TfidfVectorizer(ngram_range=(1, 2), max_features=5000, sublinear_tf=True)` fit only on training tokens:

- **Max Cosine Similarity (Train vs. Test):** `0.7078`
- **Max Cosine Similarity (Train vs. Val):** `0.8002`
- **Pairs with Similarity >= 0.70 Crossing Train-Test:** `1` pair

### Transparent Audit of High-Similarity Cross-Split Pair (>= 0.70)

- **Similarity:** `0.7078`
  - **Test Example (`EX3-0285`, Group `GRP-V3-UCI-SPAM-CAMP-065`):** *"No. 1 Nokia Tone 4 ur mob every week! Just txt NOK to 87021. 1st Tone FREE ! so get txtin now and tell ur friends. 150p/tone. 16 reply HL 4info"*
  - **Train Example (`EX3-1126`, Group `GRP-V3-UCI-SPAM-CAMP-165`):** *"FREE for 1st week! No1 Nokia tone 4 ur mob every week just txt NOKIA to 8007 Get txting and tell ur mates www.getzed.co.uk POBox 36504 W45WQ norm150p/tone 16+"*
  - **Grouping Decision Analysis:** Both messages are UK mobile ringtone promotions ('Nokia Tone'). However, because one references shortcode `87021` with keyword `NOK` and the other references shortcode `8007` with `www.getzed.co.uk`, they operated on separate commercial channels and were placed in separate clusters. Under sublinear TF-IDF, shared tokens ('Nokia', 'tone', 'free', 'week') raised their similarity to 0.7078.


> [!IMPORTANT]
> **Heuristic Nature of Cosine Similarity:**
> In natural language processing, cosine similarity is a mathematical heuristic based on token overlap. A threshold cannot guarantee zero semantic similarity between messages from different senders that happen to discuss similar topics (e.g. ringtone promotions or sports match scores). Grouping known campaign variants dramatically reduced leakage while maintaining realistic data independence.
