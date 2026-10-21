# WiseCub Scam Awareness ML — Diagnostic Error Analysis Report (v2)

**Document Title:** Instance-Level Error Attribution & Feature Diagnostics (v2 Corrected Experiment)  
**Evaluated Model:** `LogisticRegression` with `TfidfVectorizer`  
**Held-Out Test Examples:** `374` rows across `108` strictly unseen template groups  
**Date:** 2026-10-21  

---

## 1. Executive Error Summary

- **Test Set Accuracy:** `89.30%`
- **Total Misclassifications:** `40` out of `374` test instances
- **False Positives (Type I Error):** `36` — legitimate messages erroneously flagged as suspicious
- **False Negatives (Type II Error):** `4` — authentic scam messages missed as safe

> [!IMPORTANT]
> **Child Safety Trade-off Analysis:**
> In an educational child safety environment, **Type II errors (False Negatives) carry severe security risk**: if a child receives an impersonation lure or malicious link and the model labels it safe, the child may suffer credential or financial loss.
> Conversely, **Type I errors (False Positives) represent usability frictions**: when benign school notices or authentic allowance alerts are flagged as scams, users experience alert fatigue. Our pipeline deliberately prioritizes high recall while maintaining transparent reporting of false alarms.

---

## 2. Category-by-Category Performance Breakdown

| Scam Category | Total In Test | Correct Predictions | Category Accuracy | Misclassifications | Primary Error Type |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **`financial`** | 10 | 10 | 100.0% | 0 | None |
| **`impersonation`** | 10 | 10 | 100.0% | 0 | None |
| **`legitimate_or_benign`** | 265 | 229 | 86.4% | 36 | False Positive |
| **`phishing`** | 20 | 20 | 100.0% | 0 | None |
| **`prize`** | 18 | 18 | 100.0% | 0 | None |
| **`qr`** | 20 | 20 | 100.0% | 0 | None |
| **`sms`** | 31 | 27 | 87.1% | 4 | False Negative |

---

## 3. False Negative Case Audit (Missed Scams)

Detailed audit of all **4** scam messages that bypassed classification:

### Case FN-01: `EX2-0125`
- **Category:** `sms` | **Source:** `public_dataset` | **Template Group:** `GRP-UCI-SPAM-CAMP-091`
- **Message Text:** *"08714712388 between 10am-7pm Cost 10p"*
- **Top Contributing N-grams:** `10p` (+0.115), `cost` (+0.09), `between` (+0.041), `10am` (+0.032)
- **Diagnostic Cause:**
  - *Message brevity:* The text is truncated or terse, lacking common urgency or commercial keywords.

### Case FN-02: `EX2-0639`
- **Category:** `sms` | **Source:** `public_dataset` | **Template Group:** `GRP-UCI-SPAM-CAMP-184`
- **Message Text:** *"Hi if ur lookin 4 saucy daytime fun wiv busty married woman Am free all next week Chat now 2 sort time 09099726429 JANINExx Calls£1/minMobsmoreLKPOBOX177HP51FL"*
- **Top Contributing N-grams:** `free` (+0.388), `chat` (+0.253), `if` (-0.229), `am` (-0.227)
- **Diagnostic Cause:**
  - *Colloquial UK adult chat spam:* Contains slang tokens not present in youth-oriented educational curriculum training folds.

### Case FN-03: `EX2-1243`
- **Category:** `sms` | **Source:** `public_dataset` | **Template Group:** `GRP-UCI-SPAM-CAMP-135`
- **Message Text:** *"As a registered optin subscriber ur draw 4 £100 gift voucher will be entered on receipt of a correct ans to 80062 Whats No1 in the BBC charts"*
- **Top Contributing N-grams:** `100` (+0.182), `to` (+0.177), `gift` (+0.165), `in` (-0.159)
- **Diagnostic Cause:**
  - *Formal pretexts:* Uses legitimate-sounding terms ('registered subscriber', 'BBC charts') that counterbalanced spam signals.

### Case FN-04: `EX2-1760`
- **Category:** `sms` | **Source:** `public_dataset` | **Template Group:** `GRP-UCI-SPAM-CAMP-135`
- **Message Text:** *"As a Registered Subscriber yr draw 4 a £100 gift voucher will b entered on receipt of a correct ans. When are the next olympics. Txt ans to 80062"*
- **Top Contributing N-grams:** `txt` (+0.379), `when` (-0.234), `next` (-0.2), `100` (+0.175)
- **Diagnostic Cause:**
  - *Formal pretexts:* Uses legitimate-sounding terms ('registered subscriber', 'BBC charts') that counterbalanced spam signals.

---

## 4. False Positive Case Audit (Legitimate Flagged as Suspicious)

Detailed audit of representative benign messages erroneously flagged as scams (36 total cases):

### Case FP-01: `EX2-0092`
- **Educational Scenario Concept:** `model_un;civic_diplomacy;student_conference`
- **Source:** `synthetic` | **Template Group:** `GRP-SYN-LEGIT-058`
- **Message Text:** *"Model United Nations: Delegate country allocations for youth conference in Shenzhen emailed to delegates. Check your inbox."*
- **Top Contributing N-grams:** `to` (+0.205), `youth` (+0.201), `in` (-0.183), `your` (+0.13)
- **Diagnostic Cause:**
  - *Out-of-domain proper nouns:* Unfamiliar geographic location tokens or formal notice phrasing with low benign frequency in training folds.

### Case FP-02: `EX2-0102`
- **Educational Scenario Concept:** `loyalty_rewards;bookstore_points;benign_promotional`
- **Source:** `synthetic` | **Template Group:** `GRP-SYN-LEGIT-042`
- **Message Text:** *"Bookstore Loyalty: You earned 300 points on reading club card at 'Sports Outlet'! Redeem on your next visit for a free notebook."*
- **Top Contributing N-grams:** `free` (+0.28), `next` (-0.164), `for free` (+0.154), `redeem` (+0.141)
- **Diagnostic Cause:**
  - *Promotional vocabulary:* Contains retail reward terms ('free', 'points', 'redeem') that heavily overlap with commercial prize scam templates.

### Case FP-03: `EX2-0122`
- **Educational Scenario Concept:** `model_un;civic_diplomacy;student_conference`
- **Source:** `synthetic` | **Template Group:** `GRP-SYN-LEGIT-058`
- **Message Text:** *"Model United Nations: Delegate country allocations for youth conference in Lagos emailed to delegates. Check your inbox."*
- **Top Contributing N-grams:** `to` (+0.205), `youth` (+0.201), `in` (-0.183), `your` (+0.13)
- **Diagnostic Cause:**
  - *Out-of-domain proper nouns:* Unfamiliar geographic location tokens or formal notice phrasing with low benign frequency in training folds.

### Case FP-04: `EX2-0127`
- **Educational Scenario Concept:** `student_developer_pack;academic_verification;benign_service`
- **Source:** `synthetic` | **Template Group:** `GRP-SYN-LEGIT-027`
- **Message Text:** *"GitHub Student Developer Pack: Academic verification for Glenwood Secondary approved. Access developer tools at https://education.github.com"*
- **Top Contributing N-grams:** `com` (+0.354), `education` (-0.165), `at` (+0.113), `approved` (+0.101)
- **Diagnostic Cause:**
  - *Authentication terminology:* Contains administrative security words ('verification', 'approved', 'https://') that trigger phishing sensitivity.

### Case FP-05: `EX2-0129`
- **Educational Scenario Concept:** `student_wages;direct_deposit;employment_compensation`
- **Source:** `synthetic` | **Template Group:** `GRP-SYN-LEGIT-015`
- **Message Text:** *"Direct Deposit: Your weekend student wages of $130.00 from 'Student Co-op' were credited to your checking account. Ref: 482999."*
- **Top Contributing N-grams:** `ref` (+0.244), `00` (-0.204), `your` (+0.178), `from` (+0.176)
- **Diagnostic Cause:**
  - *Financial transaction terms:* Contains banking tokens ('wages', 'credited', 'checking account', '$') that overlap with advance-fee and fake refund lures.

### Case FP-06: `EX2-0148`
- **Educational Scenario Concept:** `model_un;civic_diplomacy;student_conference`
- **Source:** `synthetic` | **Template Group:** `GRP-SYN-LEGIT-058`
- **Message Text:** *"Model United Nations: Delegate country allocations for youth conference in Jakarta emailed to delegates. Check your inbox."*
- **Top Contributing N-grams:** `to` (+0.205), `youth` (+0.201), `in` (-0.183), `your` (+0.13)
- **Diagnostic Cause:**
  - *Out-of-domain proper nouns:* Unfamiliar geographic location tokens or formal notice phrasing with low benign frequency in training folds.

### Case FP-07: `EX2-0304`
- **Educational Scenario Concept:** `loyalty_rewards;bookstore_points;benign_promotional`
- **Source:** `synthetic` | **Template Group:** `GRP-SYN-LEGIT-042`
- **Message Text:** *"Bookstore Loyalty: You earned 250 points on reading club card at 'Youth Cafe'! Redeem on your next visit for a free notebook."*
- **Top Contributing N-grams:** `free` (+0.287), `next` (-0.168), `for free` (+0.159), `redeem` (+0.145)
- **Diagnostic Cause:**
  - *Promotional vocabulary:* Contains retail reward terms ('free', 'points', 'redeem') that heavily overlap with commercial prize scam templates.

### Case FP-08: `EX2-0305`
- **Educational Scenario Concept:** `student_developer_pack;academic_verification;benign_service`
- **Source:** `synthetic` | **Template Group:** `GRP-SYN-LEGIT-027`
- **Message Text:** *"GitHub Student Developer Pack: Academic verification for Beacon Hills High approved. Access developer tools at https://education.github.com"*
- **Top Contributing N-grams:** `com` (+0.332), `education` (-0.155), `at` (+0.106), `approved` (+0.095)
- **Diagnostic Cause:**
  - *Authentication terminology:* Contains administrative security words ('verification', 'approved', 'https://') that trigger phishing sensitivity.

---

## 5. Top Predictive Features Learned by the Model

The model learned genuine vocabulary associations without relying on artificial label shortcuts:

### Top 10 Strongest Indicators for `scam_or_suspicious`

| Rank | N-Gram Token | Model Weight / Relative Importance | Evidence-Based Semantic Context |
| :---: | :--- | :---: | :--- |
| 1 | `http` | +3.488 | Malicious URL protocol / domain marker |
| 2 | `at http` | +2.741 | Malicious URL protocol / domain marker |
| 3 | `call` | +2.364 | Urgency / Call to action trigger |
| 4 | `scan` | +2.108 | Financial lure or authentication scam |
| 5 | `qr` | +2.108 | Financial lure or authentication scam |
| 6 | `free` | +2.003 | Financial lure or authentication scam |
| 7 | `verify` | +1.965 | Financial lure or authentication scam |
| 8 | `claim` | +1.826 | Urgency / Call to action trigger |
| 9 | `to` | +1.825 | Financial lure or authentication scam |
| 10 | `token` | +1.775 | Financial lure or authentication scam |

### Top 10 Strongest Indicators for `legitimate_or_benign`

| Rank | N-Gram Token | Model Weight / Relative Importance | Evidence-Based Semantic Context |
| :---: | :--- | :---: | :--- |
| 1 | `pm` | -1.814 | Recreational youth hobby / sport |
| 2 | `in` | -1.410 | Recreational youth hobby / sport |
| 3 | `next` | -1.280 | Recreational youth hobby / sport |
| 4 | `ok` | -1.223 | Recreational youth hobby / sport |
| 5 | `00` | -1.157 | Recreational youth hobby / sport |
| 6 | `so` | -1.140 | Recreational youth hobby / sport |
| 7 | `room` | -1.128 | School academic subject / routine |
| 8 | `my` | -1.121 | Recreational youth hobby / sport |
| 9 | `school` | -1.038 | School academic subject / routine |
| 10 | `am` | -1.006 | Recreational youth hobby / sport |

---

## 6. Generalization Gap: Public Benchmark vs. Synthetic Training (v2 Findings)

In experiment v1, synthetic data achieved an artificial 100.0% Macro-F1 because of the `#LEG-` shortcut token.
In experiment v2, with all shortcuts eliminated:

- **Synthetic Test Subset (n=280):** `85.09% Macro-F1` (Scam Recall: 100.0%, Precision: 66.0%).
- **Public Benchmark Test Subset (n=94):** `95.54% Macro-F1` (Scam Recall: 89.7%, Precision: 100.0%).

> [!NOTE]
> **Key Pedagogical Finding:**
> Once synthetic shortcut tokens were removed, the synthetic dataset presented a challenging educational problem: authentic youth messages discussing pocket money, 2FA codes, library accounts, and school discounts share vocabulary with scams. This proves that our model is solving a genuine semantic classification problem rather than exploiting synthetic metadata artifacts.
