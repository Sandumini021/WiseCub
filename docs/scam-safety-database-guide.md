# WiseCub Member 4 — Scam Safety Database Setup & Seeding Guide

This guide explains how WiseCub team members and examiners can reproduce and inspect the MongoDB database setup for **Member 4 — Scam Safety / Scam Awareness**.

---

## 1. Why Raw Database Files Are Not in Git

* MongoDB runs as a database service on each developer's laptop (`localhost:27017`).
* Raw database storage files (`/data/db`), MongoDB binary dumps (`dump/`), and `.env` credentials are blocked by `.gitignore`. Committing live database files risks data corruption, leaks private information, and causes merge conflicts.
* Instead, **reproducible seeding scripts and synthetic fixtures** are committed to Git so any team member can generate the exact required database state on their own machine.

---

## 2. Prerequisites

1. **MongoDB Community Server** must be running locally:
   * URI: `mongodb://localhost:27017`
   * Database name: `wisecub`
2. **MongoDB Compass** (optional, recommended for visual inspection).
3. **Python Virtual Environment** with requirements installed:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

---

## 3. How to Seed Scam Safety Demo Data

From the `backend` folder, run the idempotent seeder:

```bash
python -m app.modules.safety.seed
```

### What This Command Does
* **Ensures Unique Indexes**: Automatically verifies and creates required indexes for `guardian_consent`, `safety_simulations`, `module_state`, and `children`.
* **Idempotent Upserts**: Uses MongoDB `$set` with `upsert=True` targeting stable demo identifiers (`demo-scam-safety-child` and `sim-demo-*`). You can safely run it multiple times without creating duplicate records.
* **Non-Destructive**: Never deletes, drops, or modifies any existing user or team member data.
* **100% Synthetic**: Populates educational demo fixtures from [`backend/app/modules/safety/data/synthetic_demo_data.json`](../backend/app/modules/safety/data/synthetic_demo_data.json).

### Optional Command Flags
* **Dry Run (No database writes)**:
  ```bash
  python -m app.modules.safety.seed --dry-run
  ```
* **Target an Isolated Database (e.g., for automated testing)**:
  ```bash
  python -m app.modules.safety.seed --target-db my_isolated_test_db
  ```

---

## 4. Expected Collections in MongoDB Compass

After running the seeder, open MongoDB Compass, connect to `mongodb://localhost:27017`, and navigate to the `wisecub` database. You will see:

| Collection | Seeded Content | Purpose |
|---|---|---|
| `children` | 1 record (`demo-scam-safety-child`) | Ensures a valid demo student identity exists for educational simulations. |
| `guardian_consent` | 1 record (`guardian.demo@wisecub.local`) | Pre-verified demo parent consent record so simulated educational emails can be tested without setup blockers. |
| `module_state` | 1 record (`module: "safety"`) | Baseline progress document with passing scores (>=80%) across completed levels and shield score. |
| `safety_simulations` | 6 records (Levels 1 to 6) | Full simulation history for Phishing, SMS Smishing, QR Codes, Prize Scams, Impersonation, and Deceptive Finance. |

---

## 5. Verification via the API

1. Start the FastAPI backend:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
2. Verify database connectivity:
   * URL: [http://localhost:8000/health](http://localhost:8000/health)
   * Expected response:
     ```json
     {
       "status": "ok",
       "service": "wisecub",
       "database": "connected",
       "db_name": "wisecub"
     }
     ```
3. Verify guardian consent endpoint for the demo child:
   * URL: `http://localhost:8000/api/safety/guardian/demo-scam-safety-child`
   * Shows `configured: true` and `verification_status: "verified"`.
