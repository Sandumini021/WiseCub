# WiseCub Scam Awareness ML Research — Limitations and Ethical Considerations (v3 Final)

**Document Version:** 3.0.0  
**Artifact Scope:** `research/scam-awareness-ml/v3_final/`  
**Target Demographic:** Children & Teenagers aged 12–16 (WiseCub Educational Platform)  
**Author:** Academic Reproducibility Auditor & Senior ML Researcher (WiseCub Member 4)

---

## 1. Clear Research Scope and Boundaries

This machine-learning experiment is an **educational research prototype**. It is designed specifically to investigate the feasibility of lightweight, interpretable text classification algorithms for educational simulation and curriculum benchmarking.

### Explicit Negative Boundaries:
1. **NOT a Production Security Perimeter:** This classifier must never be deployed as an autonomous, unmonitored security barrier or spam gateway for production email/SMS/chat systems. It cannot prevent zero-day attacks or sophisticated targeted exploits.
2. **NOT a Cognitive / Psychological Susceptibility Model:** The classifier evaluates **message text only**. It makes no claims regarding whether an individual teenager will fall victim to a scam, their cognitive vulnerability, their risk tolerance, or their emotional state.
3. **NOT a Substitute for Critical Thinking Education:** Machine learning outputs within WiseCub are designed to support scaffolding and reflection, never to replace parental guidance, teacher instruction, or the youth's own analytical judgment.

---

## 2. Model Architecture and Technical Limitations

The selected model (`TFIDF_Linear_SVC`) relies on n-gram tokenization and linear hyperplane classification. While fast, interpretable, and reproducible on standard CPU architectures without GPU acceleration, it exhibits inherent structural limitations:

1. **Bag-of-Words Independence Assumption:**
   - The model treats text primarily as an unorganized collection of unigrams and bigrams. It lacks true semantic parsing, contextual understanding, and syntactic hierarchy.
   - Sarcasm, double entendres, and polite conversational framing can easily disguise scam intentions.

2. **Vulnerability to Adversarial Perturbations:**
   - Simple adversarial evasion techniques—such as intentional character misspellings (`cl1ck h3re`), zero-width Unicode spaces, homoglyph substitution (Cyrillic characters replacing Latin letters), or leetspeak—can bypass TF-IDF tokenization.

3. **Multimodal Blind Spots:**
   - Modern online scams targeting teenagers frequently utilize visual media: QR codes on physical flyers, embedded image screenshots in Discord DMs, synthetic voice clips, and interactive web forms. A pure text classifier is completely blind to non-textual channels.

4. **Temporal Concept Drift:**
   - Scammer vernacular evolves rapidly with pop-culture trends, emerging mobile games (e.g., new Roblox/Fortnite currency exploits), and generative AI phishing. Static models decay rapidly unless regularly fine-tuned on updated corpora.

---

## 3. Dataset Representativeness and Provenance Constraints

1. **Synthetic Generation Artifacts:**
   - 76% of the dataset ($n = 1,900$) was synthetically authored based on pedagogical curriculum templates. While strictly audited in v3 to eliminate label shortcuts (e.g., `#PH-`, `#LEG-`), synthetic corpora inevitably reflect the linguistic style and vocabulary priors of their authors.
   - They cannot fully capture the chaotic, evolving slang, emojis, abbreviations, and sentence fragments characteristic of authentic teen messaging.

2. **Historical Benchmark Vintage (UCI SMS Corpus):**
   - The 600 public benchmark samples originate from the UCI SMS Spam Collection, collected primarily between 2003 and 2012 in the United Kingdom and Singapore.
   - These records feature obsolete technologies: Nokia ringtone subscriptions, 150p per minute reverse-billing shortcodes, and WAP links. They serve as an academic historical baseline, **not** a reflection of 2026 digital communication platforms (Discord, TikTok, Snapchat, BeReal).

---

## 4. Ethical Considerations and Child Protection

1. **Zero Access to Real Learner Communications:**
   - In accordance with international child privacy standards (such as COPPA, GDPR Article 8, and the UK Age-Appropriate Design Code), **no actual messages, chat logs, private information, or behavioral histories of children were accessed, scraped, collected, or trained upon**.
   - All experimental data consists strictly of publicly available research corpora or fabricated pedagogical simulations.

2. **The Danger of Algorithmic Automation Bias:**
   - If a learner is told that an AI system *'protects them from scams with 92% accuracy'*, they risk developing false security, lowering their natural guard and failing to scrutinize incoming messages.
   - Educational user interfaces in WiseCub must clearly convey that the AI can make mistakes, framing alerts as *'flags for your consideration'* rather than definitive verdicts.

3. **Asymmetric Error Costs and Teachable Moments:**
   - A **False Negative** (allowing an authentic scam to be labeled benign) risks leading a child into financial exploitation, credential theft, or malware infection.
   - A **False Positive** (flagging a mother's authentic urgent message as suspicious) creates friction, but offers an immediate pedagogical opportunity: *'Why did the computer flag this? Because urgency is a common trick. Verify with your parent directly.'*
   - Consequently, our predeclared model selection criterion intentionally accepted a slightly higher false positive rate (10.33%) to guarantee an exceptionally high scam recall (98.50%).

---

## 5. Deployment Recommendations for WiseCub

When introducing this model into the WiseCub educational application:
1. Deploy as an **interactive pedagogical assistant** within simulated scenarios, where students classify messages first and compare their reasoning against the model's feature weights.
2. Provide **feature attribution tooltips** showing *which words* made the system suspicious (e.g., highlighting `urgent`, `verify`, `claim`), reinforcing literacy rather than delivering opaque binary classifications.
3. Keep the model entirely offline or on-device to ensure that student simulation interactions never transmit unencrypted text to external third-party cloud APIs.
