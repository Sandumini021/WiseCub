# WiseCub Scam Awareness ML — Research Limitations & Future Directions

**Document Title:** Critical Assessment of Limitations, Threat Models, and Research Ethics  
**Author / Researcher:** Member 4 (Scam Awareness / Scam Safety), WiseCub Project  
**Target Audience:** Final-Year Research Panel, Ethical Reviewers, Supervisors

---

## 1. Characterization of the Study

It is vital to define the scope and nature of this experiment with academic honesty:

> **What this research is:**  
> A controlled, reproducible **methodological experiment** demonstrating that classical natural language processing pipelines (TF-IDF + Multinomial Naive Bayes / Logistic Regression) can differentiate between structured educational scam scenarios and benign youth communications under strict zero-leakage grouped splitting.

> **What this research is NOT:**  
> This study is **not** an empirical proof that WiseCub can detect all real-world scams in production. It does not prove immunity to novel adversarial attacks, nor does it establish universal generalization across languages or demographics.

---

## 2. Technical and Methodological Limitations

### 2.1 The Synthetic Data Generalization Gap
- **76% of the dataset (1,900 examples) is synthetic.** While parameterized slot filling allowed us to represent all six WiseCub curriculum scam types (Phishing, SMS, QR Quishing, Prize Scams, Impersonation, and Financial Fraud), synthetic messages share underlying structural conventions.
- On the held-out test set, the model achieved a **100.0% Macro-F1** on synthetic examples, but dropped to **93.27% Macro-F1** (with 87.8% precision) on real-world public benchmark data from the UCI SMS collection.
- **Academic Conclusion:** Synthetic evaluations overestimate performance. Future research must collect and annotate larger public, real-world educational benchmarks.

### 2.2 Monolingual English Constraint
- The current corpus is **100% English**.
- WiseCub is designed to support Sri Lankan learners where communications frequently occur in:
  - Sinhala script
  - Tamil script
  - Code-mixed "Singlish" (Sinhala phonetically written using English Latin characters, e.g. *"Oyaata me prize eka labuna, click karanna me link eka"*).
- The current TF-IDF vectorizer cannot process Sinhala Unicode or interpret Singlish slang without dedicated transliteration tokenizers and multilingual embeddings.

### 2.3 Vulnerability to Adversarial Evasion
- The TF-IDF representation relies on n-gram token frequencies.
- Attackers can easily circumvent n-gram models using:
  - **Zero-width unicode spaces** or homoglyph substitutions (e.g. replacing Latin 'o' with Cyrillic 'о').
  - **Text-in-image payloads** (e.g. sending screenshots or stickers containing text).
  - **Conversational multi-turn grooming** where no individual message contains an overt red-flag keyword until trust is established.

### 2.4 Static Model vs. Evolving Scam Pretexts
- Scammer narratives shift rapidly (e.g. trending gaming titles, new social media platforms, or local school exam controversies).
- A static bag-of-words model trained on static 2026 templates cannot generalize to future threat vectors without active continuous retraining.

---

## 3. Ethical and Safety Project Boundaries

### 3.1 Strict Focus on Message Classification (Not Learner Profiling)
In alignment with privacy principles and child-protection research ethics:
- **This study classifies message content only.**
- It **does not** build a predictive profile of child vulnerability.
- It **does not** infer psychological susceptibility, impulsivity, or learner gullibility.
- No learner personal data, session logs, or database records from MongoDB were accessed or utilized.

### 3.2 Consequences of Classification Errors

1. **False Negatives (Missed Scams):**
   - *Risk Level:* **Critical.**
   - If a deceptive credential harvest link or emergency money transfer is marked "Legitimate", a child may surrender their account or pocket money.
   - *Design Implication:* The threshold should be tuned to maximize **Scam Recall**, favoring cautious alerts over silent omissions.

2. **False Positives (Benign Flagged as Scam):**
   - *Risk Level:* **Moderate to High.**
   - If legitimate school LMS due dates, teacher messages, or parental allowance transfers are repeatedly flagged, children will experience "alert fatigue" and disable the safety module.

---

## 4. Requirements for Future Production Readiness

Before any ML model is considered for live deployment in WiseCub:

1. **Multilingual Dataset Expansion:**
   - Collect 2,000+ ethically sourced, bilingual Sinhala, Tamil, and Singlish youth messages under institutional review board (IRB) approval.
2. **Context-Aware Embeddings:**
   - Benchmark transformer-based multilingual encoders (e.g. `XLM-RoBERTa`, `mBERT`, or lightweight DistilBERT) to handle semantic nuance beyond bag-of-words.
3. **Multi-Turn Context Modeling:**
   - Evaluate multi-message dialog trees to detect social engineering grooming over extended chat sequences.
4. **Human-in-the-Loop Safeguards:**
   - Model predictions in WiseCub should serve as **educational prompts** ("WiseCub noticed 2 warning signs—let's check them together!"), rather than blunt binary censorship blocks.
