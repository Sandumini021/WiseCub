"""
WiseCub — Multi-Student Isolation & Real MongoDB Persistence Verification Script
Module: Gamified Financial Learning (CDEMF)
Project: J26-IT-418
"""
import sys
import uuid
import httpx
from pymongo import MongoClient

BASE_URL = "http://localhost:8000"
MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "wisecub"

def test_multi_student_flow():
    print("==================================================================")
    print("WISECUB CDEMF -- MULTI-STUDENT ISOLATION & MONGODB VERIFICATION")
    print("==================================================================")

    # Connect to MongoDB directly to verify actual documents
    mongo = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
    try:
        mongo.admin.command("ping")
        print("[PASS] Connected to MongoDB on mongodb://localhost:27017")
    except Exception as e:
        print(f"[FAIL] MongoDB ping failed: {e}")
        sys.exit(1)

    db = mongo[DB_NAME]

    # Generate unique test usernames
    run_id = uuid.uuid4().hex[:6]
    alpha_username = f"student_alpha_{run_id}"
    beta_username = f"student_beta_{run_id}"
    password = "SafePassword123!"

    client_alpha = httpx.Client(base_url=BASE_URL, timeout=10.0)
    client_beta = httpx.Client(base_url=BASE_URL, timeout=10.0)

    # -------------------------------------------------------------
    # 1. REGISTER & LOGIN STUDENT ALPHA
    # -------------------------------------------------------------
    print(f"\n[1] Registering Student Alpha ({alpha_username})...")
    reg_alpha = client_alpha.post("/api/register", json={
        "username": alpha_username,
        "password": password,
        "name": "Alpha Student",
        "role": "student"
    })
    assert reg_alpha.status_code == 200, f"Registration failed: {reg_alpha.text}"
    alpha_account = reg_alpha.json()
    alpha_child_id = alpha_account["child_id"]
    print(f"[PASS] Student Alpha authenticated: child_id={alpha_child_id}")

    # Check initial mission progress for Alpha
    prog_alpha_init = client_alpha.get("/api/gamified/progress/mission_rescue_puppy")
    assert prog_alpha_init.status_code == 200
    assert prog_alpha_init.json()["unlocked_level_number"] == 1
    assert prog_alpha_init.json()["completed_level_numbers"] == []
    print("[PASS] Student Alpha starts at Level 1 with 0 completed levels.")

    # -------------------------------------------------------------
    # 2. STUDENT ALPHA COMPLETES LEVEL 1
    # -------------------------------------------------------------
    print("\n[2] Student Alpha submits financially responsible Level 1 decision...")
    dec_alpha = client_alpha.post("/api/gamified/decisions/submit", json={
        "mission_id": "mission_rescue_puppy",
        "level_id": "level_puppy_1",
        "level_number": 1,
        "session_id": f"sess_alpha_{run_id}",
        "interaction_type": "needs_wants",
        "selected_option_ids": [
            "opt_first_aid",
            "opt_nutrition_pack",
            "opt_cozy_towel"
        ],
        "allocations": {},
        "selected_rationale_id": None,
        "weekly_decisions": []
    })
    assert dec_alpha.status_code == 200, f"Submit failed: {dec_alpha.text}"
    eval_alpha = dec_alpha.json()
    assert eval_alpha["passed"] is True, "Student Alpha decision should pass Level 1"
    assert eval_alpha["next_level_unlocked"] is True
    print(f"[PASS] CDEMF Pipeline passed! Overall score: {eval_alpha['overall_score']}")
    print(f"[PASS] Character Transition: {eval_alpha['character_transition']['direction']} -- {eval_alpha['character_transition']['reason']}")

    # Verify MongoDB documents for Alpha
    alpha_prog_doc = db.gamified_progress.find_one({"child_id": alpha_child_id, "mission_id": "mission_rescue_puppy"})
    assert alpha_prog_doc is not None, "gamified_progress document missing for Alpha"
    assert alpha_prog_doc["unlocked_level_number"] == 2
    assert 1 in alpha_prog_doc["completed_level_numbers"]

    alpha_dec_doc = db.financial_decisions.find_one({"child_id": alpha_child_id, "mission_id": "mission_rescue_puppy"})
    assert alpha_dec_doc is not None, "financial_decisions document missing for Alpha"
    assert alpha_dec_doc["passed"] is True

    alpha_att_doc = db.mission_attempts.find_one({"child_id": alpha_child_id, "mission_id": "mission_rescue_puppy"})
    assert alpha_att_doc is not None, "mission_attempts document missing for Alpha"

    alpha_comp_doc = db.competency_assessments.find_one({"child_id": alpha_child_id, "mission_id": "mission_rescue_puppy"})
    assert alpha_comp_doc is not None, "competency_assessments document missing for Alpha"

    alpha_char_doc = db.character_state_history.find_one({"child_id": alpha_child_id, "mission_id": "mission_rescue_puppy"})
    assert alpha_char_doc is not None, "character_state_history document missing for Alpha"

    print("[PASS] VERIFIED REAL MONGODB PERSISTENCE FOR STUDENT ALPHA:")
    print(f"  - gamified_progress: unlocked_level={alpha_prog_doc['unlocked_level_number']}, coins={alpha_prog_doc['earned_coins']}")
    print(f"  - financial_decisions: decision_id={alpha_dec_doc['decision_id']}, total_spent={alpha_dec_doc['total_spent_lkr']}")
    print(f"  - competency_assessments: budgeting={alpha_comp_doc['budgeting_skill']}, discipline={alpha_comp_doc['spending_discipline']}")
    print(f"  - character_state_history: condition={alpha_char_doc['physical_condition']}, emotion={alpha_char_doc['emotional_state']}")

    # -------------------------------------------------------------
    # 3. REGISTER & LOGIN STUDENT BETA (STUDENT ISOLATION)
    # -------------------------------------------------------------
    print(f"\n[3] Registering Student Beta ({beta_username}) & verifying isolation...")
    reg_beta = client_beta.post("/api/register", json={
        "username": beta_username,
        "password": password,
        "name": "Beta Student",
        "role": "student"
    })
    assert reg_beta.status_code == 200
    beta_account = reg_beta.json()
    beta_child_id = beta_account["child_id"]
    assert beta_child_id != alpha_child_id, "Student child_ids must be unique"
    print(f"[PASS] Student Beta authenticated: child_id={beta_child_id}")

    # Fetch Beta's progress
    prog_beta = client_beta.get("/api/gamified/progress/mission_rescue_puppy")
    assert prog_beta.status_code == 200
    beta_data = prog_beta.json()
    assert beta_data["unlocked_level_number"] == 1, f"Student Beta must start at Level 1, got {beta_data['unlocked_level_number']}"
    assert beta_data["completed_level_numbers"] == [], "Student Beta must have 0 completed levels"
    assert beta_data["earned_coins"] == 0, "Student Beta must have 0 coins"
    print("[PASS] ISOLATION VERIFIED: Student Beta does NOT inherit Student Alpha's progress!")
    print(f"  - Beta unlocked level: {beta_data['unlocked_level_number']} (Alpha is on level 2)")
    print(f"  - Beta completed levels: {beta_data['completed_level_numbers']}")

    # Verify Beta cannot access Level 2 (server-side lock)
    start_lvl2_beta = client_beta.post("/api/gamified/levels/start", json={
        "mission_id": "mission_rescue_puppy",
        "level_number": 2
    })
    assert start_lvl2_beta.status_code == 403, f"Beta accessing Level 2 should return 403, got {start_lvl2_beta.status_code}"
    print("[PASS] SERVER-SIDE LEVEL LOCK ENFORCED: Student Beta blocked from Level 2 (403 Forbidden).")

    # -------------------------------------------------------------
    # 4. STUDENT ALPHA RESUMES MISSION ACROSS SESSIONS
    # -------------------------------------------------------------
    print("\n[4] Re-querying Student Alpha's progress to verify cross-session persistence...")
    prog_alpha_resume = client_alpha.get("/api/gamified/progress/mission_rescue_puppy")
    assert prog_alpha_resume.status_code == 200
    alpha_resume_data = prog_alpha_resume.json()
    assert alpha_resume_data["unlocked_level_number"] == 2
    assert 1 in alpha_resume_data["completed_level_numbers"]
    print(f"[PASS] Student Alpha progress perfectly preserved: Level {alpha_resume_data['unlocked_level_number']} unlocked.")

    # -------------------------------------------------------------
    # 5. SUMMARY OF LIVE MONGODB COLLECTIONS
    # -------------------------------------------------------------
    print("\n[5] Live MongoDB Document Counts in database 'wisecub':")
    for coll_name in ["gamified_progress", "financial_decisions", "mission_attempts", "competency_assessments", "character_state_history"]:
        count = db[coll_name].count_documents({})
        alpha_count = db[coll_name].count_documents({"child_id": alpha_child_id})
        beta_count = db[coll_name].count_documents({"child_id": beta_child_id})
        print(f"  - {coll_name:25s}: Total={count:<3} | Student Alpha={alpha_count:<3} | Student Beta={beta_count:<3}")

    print("\n==================================================================")
    print("ALL MULTI-STUDENT ISOLATION & MONGODB TESTS PASSED PERFECTLY!")
    print("==================================================================")

if __name__ == "__main__":
    test_multi_student_flow()
