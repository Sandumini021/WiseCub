"""
generate_dataset_v3.py

Dataset generator for WiseCub Scam Awareness ML Research (v3 Final Experiment).

Key Improvements in v3:
1. Reproducible length-stratified sampling across the entire raw UCI SMS Spam Collection
   (replacing top-to-bottom sequential sampling with seeded quintile sampling).
2. Documented composite provenance noting the historical blend of sources in the UCI corpus.
3. Multi-criteria campaign clustering for public records combining exact-classifier TF-IDF
   representation (max_features=5000, sublinear_tf=True), cosine similarity (>= 0.40),
   and shared contact shortcode / phone regex matching.
4. Clean natural-language synthetic corpus (1,900 examples) with 100% unique texts across
   all 95 legitimate and 95 scam curriculum scenarios (zero label-revealing tokens).
5. Default-safe CLI: writes to disk only when --save is specified.
"""

import argparse
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
V3_DIR = SRC_DIR.parent
DATA_DIR = V3_DIR / "data"
RAW_DIR = V3_DIR.parent / "data" / "raw"
REPORTS_DIR = V3_DIR / "reports"

# Import synthetic generators from v2 which were audited to have zero shortcuts and zero duplicate texts
import sys
sys.path.append(str(V3_DIR.parent / "v2_corrected" / "src"))
from generate_dataset_v2 import (
    generate_synthetic_financial,
    generate_synthetic_impersonation,
    generate_synthetic_legitimate,
    generate_synthetic_phishing,
    generate_synthetic_prize,
    generate_synthetic_qr,
    generate_synthetic_sms,
)


def clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def load_and_cluster_public_uci_v3(target_spam=300, target_ham=300, sim_threshold=0.40) -> Tuple[List[Dict], Dict]:
    """
    Extracts 300 spam and 300 ham messages from SMSSpamCollection via reproducible
    length-stratified sampling across the full corpus, then clusters campaign families.
    """
    uci_file = RAW_DIR / "SMSSpamCollection"
    if not uci_file.exists():
        raise FileNotFoundError(f"UCI dataset raw file not found at {uci_file}")

    with open(uci_file, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.reader(f, delimiter="\t")
        rows = [(r[0].strip().lower(), clean_text(r[1]), idx + 1) for idx, r in enumerate(reader) if len(r) >= 2]

    rng = random.Random(SEED)

    # Filter by length criteria (15 to 400 characters) and remove exact text duplicates
    seen_sp = set()
    unique_spam = []
    for txt, line in [(txt, line) for lbl, txt, line in rows if lbl == "spam" and 15 <= len(txt) <= 400]:
        if txt.lower() not in seen_sp:
            seen_sp.add(txt.lower())
            unique_spam.append((txt, line))

    seen_hm = set()
    unique_ham = []
    for txt, line in [(txt, line) for lbl, txt, line in rows if lbl == "ham" and 15 <= len(txt) <= 400]:
        if txt.lower() not in seen_hm:
            seen_hm.add(txt.lower())
            unique_ham.append((txt, line))

    # Reproducible stratified sampling across 5 length quintiles
    def stratified_sample(data: List[Tuple[str, int]], target: int) -> List[Tuple[str, int]]:
        bins = [[] for _ in range(5)]
        for txt, line in data:
            L = len(txt)
            if L <= 50: bins[0].append((txt, line))
            elif L <= 100: bins[1].append((txt, line))
            elif L <= 150: bins[2].append((txt, line))
            elif L <= 200: bins[3].append((txt, line))
            else: bins[4].append((txt, line))
        per_bin = target // 5
        sampled = []
        for b in bins:
            rng.shuffle(b)
            sampled.extend(b[:per_bin])
        if len(sampled) < target:
            rem = [item for b in bins for item in b if item not in sampled]
            rng.shuffle(rem)
            sampled.extend(rem[:target - len(sampled)])
        return sampled

    sampled_spam = stratified_sample(unique_spam, target_spam)
    sampled_ham = stratified_sample(unique_ham, target_ham)

    # Multi-criteria Campaign Clustering for Spam
    # 1. Feature space matching downstream classifier
    vec_clf = TfidfVectorizer(ngram_range=(1, 2), max_features=5000, sublinear_tf=True)
    spam_texts = [t for t, _ in sampled_spam]
    X_sp = vec_clf.fit_transform(spam_texts)
    sim_sp = cosine_similarity(X_sp)
    adj_sp = (sim_sp >= sim_threshold).astype(int)

    # 2. Connect messages sharing contact numbers or distinctive award phrases
    phone_pattern = re.compile(r"\b(?:090\d{8}|087\d{8}|080\d{8}|07\d{9}|\d{5})\b")
    award_pattern = re.compile(r"£\d+\s*(?:award|prize|cash|gift|voucher)", re.IGNORECASE)

    for i in range(len(spam_texts)):
        codes_i = {c for c in phone_pattern.findall(spam_texts[i]) if not c.startswith("000")}
        awards_i = {a.lower() for a in award_pattern.findall(spam_texts[i])}
        for j in range(i + 1, len(spam_texts)):
            codes_j = set(phone_pattern.findall(spam_texts[j]))
            awards_j = {a.lower() for a in award_pattern.findall(spam_texts[j])}
            if codes_i.intersection(codes_j) or (awards_i and awards_i.intersection(awards_j) and sim_sp[i, j] >= 0.25):
                adj_sp[i, j] = 1
                adj_sp[j, i] = 1

    n_sp, labels_sp = connected_components(adj_sp, directed=False)

    # Ham clustering (cosine sim >= threshold)
    ham_texts = [t for t, _ in sampled_ham]
    X_hm = vec_clf.fit_transform(ham_texts)
    sim_hm = cosine_similarity(X_hm)
    adj_hm = (sim_hm >= sim_threshold).astype(int)
    n_hm, labels_hm = connected_components(adj_hm, directed=False)

    diagnostics = {
        "sampling_method": "reproducible_length_stratified_sampling_quintiles",
        "random_seed": SEED,
        "total_unique_spam_candidates": len(unique_spam),
        "total_unique_ham_candidates": len(unique_ham),
        "sampled_spam_count": len(sampled_spam),
        "sampled_ham_count": len(sampled_ham),
        "similarity_threshold": sim_threshold,
        "spam_campaign_groups": int(n_sp),
        "ham_template_groups": int(n_hm),
        "multi_message_spam_clusters": int(sum(1 for c in np.bincount(labels_sp) if c > 1)),
        "multi_message_ham_clusters": int(sum(1 for c in np.bincount(labels_hm) if c > 1)),
    }

    public_records = []
    for i, (txt, line_num) in enumerate(sampled_spam):
        cid = labels_sp[i]
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
            "template_group_id": f"GRP-V3-UCI-SPAM-CAMP-{cid+1:03d}",
            "generation_or_review_notes": f"Public benchmark spam from UCI line {line_num} (stratified sample); campaign cluster {cid+1}"
        })

    for i, (txt, line_num) in enumerate(sampled_ham):
        cid = labels_hm[i]
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
            "template_group_id": f"GRP-V3-UCI-HAM-CAMP-{cid+1:03d}",
            "generation_or_review_notes": f"Public benchmark legitimate from UCI line {line_num} (composite source); template cluster {cid+1}"
        })

    return public_records, diagnostics


def build_dataset_v3(save_to_disk=False) -> pd.DataFrame:
    print("=" * 70)
    print("WiseCub Scam Awareness ML — Final Dataset Generator (v3)")
    print("=" * 70)

    # 1. Public records
    public_records, public_diag = load_and_cluster_public_uci_v3(target_spam=300, target_ham=300, sim_threshold=0.40)
    print(f"  Extracted 600 public benchmark messages via length-stratified sampling.")
    print(f"  Clustered public spam into {public_diag['spam_campaign_groups']} campaign groups.")
    print(f"  Clustered public ham into {public_diag['ham_template_groups']} template groups.")

    # 2. Synthetic records
    syn_phish = generate_synthetic_phishing(200)
    syn_sms = generate_synthetic_sms(100)
    syn_qr = generate_synthetic_qr(200)
    syn_prize = generate_synthetic_prize(100)
    syn_imp = generate_synthetic_impersonation(200)
    syn_fin = generate_synthetic_financial(150)
    syn_legit = generate_synthetic_legitimate(950)

    synthetic_records = syn_phish + syn_sms + syn_qr + syn_prize + syn_imp + syn_fin + syn_legit
    for r in synthetic_records:
        r["source_name"] = "WiseCub Educational Synthetic Corpus v3.0"
        r["template_group_id"] = r["template_group_id"].replace("GRP-SYN-", "GRP-V3-SYN-")

    all_records = public_records + synthetic_records
    random.seed(SEED)
    random.shuffle(all_records)

    for idx, rec in enumerate(all_records, 1):
        rec["example_id"] = f"EX3-{idx:04d}"

    cols = [
        "example_id", "message_text", "binary_label", "scam_category",
        "concept_tags", "difficulty", "source_type", "source_name",
        "source_reference", "license", "template_group_id", "generation_or_review_notes"
    ]
    df = pd.DataFrame(all_records)[cols]

    # Verification checks
    prohibited_tokens = ["#LEG-", "#PH-", "#QR-", "#IMP-", "#FIN-", "#PRZ-", "#SMS-", "LEG-", "PH-", "PRZ-", "IMP-"]
    leaks = sum(df["message_text"].str.contains(tok, regex=False).sum() for tok in prohibited_tokens)
    dupes = df.duplicated(subset=["message_text"]).sum()

    print(f"  Total records: {len(df)} (1,250 scam, 1,250 legit; 1,900 synthetic, 600 public)")
    print(f"  Exact duplicate texts: {dupes}")
    print(f"  Prohibited label tokens detected: {leaks}")
    print(f"  Total unique template/campaign groups: {df['template_group_id'].nunique()}")

    if save_to_disk:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        REPORTS_DIR.mkdir(parents=True, exist_ok=True)

        out_csv = DATA_DIR / "scam_messages_dataset_v3.csv"
        df.to_csv(out_csv, index=False, encoding="utf-8")
        print(f"\n[SAVED] Dataset saved to:\n  {out_csv}")

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
        manifest_csv = DATA_DIR / "dataset_manifest_v3.csv"
        manifest_df.to_csv(manifest_csv, index=False, encoding="utf-8")
        print(f"[SAVED] Dataset manifest saved to:\n  {manifest_csv}")

        diag_file = DATA_DIR / "grouping_diagnostics_v3.json"
        with open(diag_file, "w", encoding="utf-8") as f:
            json.dump(public_diag, f, indent=2)
        print(f"[SAVED] Grouping diagnostics saved to:\n  {diag_file}")
    else:
        print("\n[DRY RUN] In-memory generation complete. Files NOT written to disk (pass --save to persist).")

    return df


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="WiseCub v3 Dataset Generator")
    parser.add_argument("--save", action="store_true", help="Save dataset and manifest to disk")
    args = parser.parse_args()
    build_dataset_v3(save_to_disk=args.save)
