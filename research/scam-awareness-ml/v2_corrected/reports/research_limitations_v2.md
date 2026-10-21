# WiseCub Scam Awareness ML — Research Limitations & Provenance Notes (v2)

**Author:** Member 4 (Scam Awareness / Scam Safety), WiseCub Project  
**Audience:** Academic Supervisor, Group Leader, External Assessment Panel  
**Document Version:** v2 (Post-Audit Research Realism Document)  
**Date:** 2026-10-21  

---

## 1. Experimental Nature & Scope Boundaries

> [!WARNING]
> **This model is NOT claimed to be production-ready or suitable as an autonomous spam blocker.**
> It is an **exploratory educational machine learning prototype** designed to investigate how classical NLP algorithms handle secondary school scam awareness scenarios alongside established benchmarks.

In the WiseCub platform architecture:
- Core child safety simulations remain governed by deterministic rule-based engines, curated scenario progressions, and parental consent workflows.
- The machine learning pipeline is an auxiliary research component evaluating text classification feasibility.

---

## 2. Data Limitations & Generalization Constraints

### 2.1 Synthetic Corpus Limitations (76.0% of Dataset)
- **Controlled Generation:** The 1,900 synthetic examples were generated using structured scenario templates aligned with the WiseCub 6-level curriculum (Phishing, Smishing, Prize Scams, Impersonation, Quishing, and Financial Scams).
- **Template Realism:** While variable slots have been thoroughly diversified to eliminate token shortcuts (`#LEG-`, `#PH-`), synthetic text cannot replicate the full linguistic unpredictability, grammatical idiosyncrasies, or evolving slang of real-world adolescent texting.
- **Classification Difficulty:** Removing artificial shortcuts lowered synthetic test accuracy from an inflated 100% to a realistic ~87%, proving that authentic overlapping terminology (banking terms, OTPs, allowance deposits) presents a genuine classification challenge.

### 2.2 Public Benchmark Limitations (24.0% of Dataset)
- **Temporal & Demographic Gap:** The 600 public benchmark messages originate from the UCI SMS Spam Collection (Almeida et al., 2011/2012). These records were collected primarily from UK cell phone users (Grumbletext forum) and Singaporean university students (NUS corpus) between 2004 and 2011.
- **Platform Divergence:** Modern secondary school students communicate primarily via social platforms (Discord, Roblox, TikTok, Snapchat, WhatsApp) rather than standard 2010-era telecommunication SMS.
- **Composite Attribution:** As noted in the independent audit, the UCI ham dataset combines Caroline Tagg's thesis, the NUS SMS Corpus, and Gómez Hidalgo's Big corpus. Individual ham records cannot be definitively separated by original sub-source.

---

## 3. Modeling & Algorithmic Limitations

### 3.1 Feature Space (Bag-of-Words TF-IDF)
- Classical n-gram TF-IDF models (`ngram_range=(1,2)`) evaluate token frequency and co-occurrence. They lack deep contextual understanding of long-range syntax, subtle sarcasm, or evasive obfuscation (e.g., intentional leetspeak or character substitution).
- Future work should compare these baselines against fine-tuned transformer architectures (e.g. DistilBERT or RoBERTa).

### 3.2 Probability Calibration
- The predicted probabilities from Naive Bayes or Logistic Regression have not been formally calibrated using Platt scaling or isotonic regression. Probability outputs should be treated as heuristic decision rankings rather than calibrated Bayesian confidence estimates.

---

## 4. Child Online Safety Trade-off Analysis

In child safety systems, classification errors have asymmetric real-world consequences:

| Error Type | Clinical / Domain Meaning | Educational Consequence | Pipeline Tuning Priority |
| :--- | :--- | :--- | :--- |
| **False Negative (Type II)** | An authentic scam lure is misclassified as legitimate. | **High Severity Risk:** The child may click a credential-harvesting link, surrender a school password, or send money to an impersonator. | **Highest Priority:** Model selection explicitly favors high scam recall (interception rate) on validation data. |
| **False Positive (Type I)** | A legitimate school notification or allowance deposit is flagged as a scam. | **Usability Hurdle:** The child or guardian experiences alert fatigue, leading to distrust in the safety system. | **Controlled Risk:** Monitored to maintain at least 85%+ precision on legitimate communication. |

---

## 5. Summary of Methodological Upgrades (v1 vs. v2)

| Methodological Area | Original Experiment (v1) | Corrected Experiment (v2) | Academic Justification |
| :--- | :--- | :--- | :--- |
| **Synthetic Token Markers** | Hardcoded reference codes (`#LEG-1204`, `#PH-0201`) leaked into token space. | **Completely eliminated.** Natural language phrasing without label markers. | Prevents artificial shortcut learning. |
| **Public UCI Grouping** | Arbitrary sequential 10-line blocks (`GRP-UCI-SPAM-001`). | **TF-IDF cosine similarity clustering ($\ge 0.50$)** using connected components. | Prevents near-duplicate spam campaigns from leaking into test splits. |
| **Cross-Split Similarity** | 22 pairs with similarity $\ge 0.70$ crossed train/test splits. | **0 pairs with similarity $\ge 0.70$ cross splits.** Maximum observed cross-split similarity is 0.6121. | Mathematically verified zero split leakage. |
| **Report Diagnostics** | Repeated hardcoded string explanations for all misclassifications. | **Instance-specific dynamic token attribution** identifying exact words causing errors. | Scientifically defensible and verifiable error analysis. |
| **Reported Test Accuracy** | 98.38% (with 100% Macro-F1 on synthetic data). | **89.30% to 93.32%** (realistic, defensible performance). | Honest, robust empirical results suitable for academic viva defense. |
