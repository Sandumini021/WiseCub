# WiseCub team guide (what is done, how you continue)

Project: **J26-IT-418** — WiseCub  
Stack: React + TypeScript + Vite, FastAPI, MongoDB  
English first. Demo child only. Virtual money only. No trained AI models yet.

Read this before you create files on your own branch.

---

## 1. Your branch

The GitHub repo already has these remote branches:

| Member | Work | Branch |
|---|---|---|
| 1 — Dheerarathna (stock market) | Virtual stock simulator | `feature/virtual-stock-market` |
| 2 — Silva (decision-making) | Choice Town / scenarios | `feature/decision-making` |
| 3 — Nawarathna (missions) | Gamified learning | `feature/gamified-learning` |
| 4 — De Silva (scam safety) | Scam Alley | `feature/scam-awareness` |

**Do not invent new branch names.** Use the one for your component.

Shared branches:

| Branch | Purpose |
|---|---|
| `main` | Stable copy after a reviewed release |
| `pre-release` | Common test copy before `main` |

Work on **your feature branch**. Open a pull request into **`pre-release`**. When the group has tested it, merge **`pre-release` → `main`**.

Shared stock-market work is already on `main` and `pre-release`. Get it like this:

Copy the shared code into your branch like this:

```bash
git checkout feature/decision-making          # use YOUR branch name
git pull origin feature/decision-making
git fetch origin
git merge origin/pre-release
```

If Git asks you to fix conflicts in shared files, **talk to Member 1 first**. Do not overwrite `App.tsx` or `AppRoutes.tsx` without agreeing.

Then:

```bash
git push -u origin HEAD
```

---

## 2. How to run what already exists

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Health check: http://localhost:8000/health

Copy `.env.example` to `.env` if you need local settings. **Never commit `.env`.**

---

## 3. What Member 1 has already built

These are **shared**. All four modules use them.

| What | Where | Status |
|---|---|---|
| Landing | `/` — `frontend/src/pages/LandingPage.tsx` | Working |
| App shell (dark sidebar + top bar) | `frontend/src/components/layout/` | Working |
| Demo enter → Market Floor | `/market` | Working |
| Stock dashboard (lessons, virtual Rs 100,000, fictional companies) | `frontend/src/modules/stock-market/` | Working UI, no live trading yet |
| Cub chat (text + Mic + suggested chips + browser voice) | `frontend/src/components/cub-assistant/` | Working, **rule-based**, not a trained model |
| Module stubs | `/choices`, `/missions`, `/safety` | Placeholder pages only |
| Home, Progress, Profile routes | `/home`, `/progress`, `/profile` | Thin stubs |
| FastAPI health | `backend/app/main.py` | Working — `/health` reports `database: connected` or `down` |
| MongoDB | `backend/app/database/` | Shared. Demo child + module JSON. Fallback to localStorage if Mongo is off |
| Real login | — | **Not required for PP1 increments 1–2** |

Cub sits on **every page**. Other members must **not** build a second chatbot inside their module. Add new Cub replies in `cubGuidance.ts` if you need extra phrases.

---

## 4. Your folders (only work here)

| You | Frontend | Backend (later) |
|---|---|---|
| Member 2 | `frontend/src/modules/decision-making/` | `backend/app/modules/decision_making/` |
| Member 3 | `frontend/src/modules/gamified-learning/` | `backend/app/modules/gamified_learning/` |
| Member 4 | `frontend/src/modules/scam-safety/` | `backend/app/modules/scam_safety/` |
| Member 1 | `frontend/src/modules/stock-market/` | `backend/app/modules/stock_market/` |

First page that already exists for you (stub):

- Member 2: `pages/LevelsPage.tsx` → `/choices`
- Member 3: `pages/MissionBoardPage.tsx` → `/missions`
- Member 4: `pages/ScamHomePage.tsx` → `/safety`

Replace the stub with your real page. Follow your wireframe. Keep the **same shared sidebar**.

---

## 5. Shared files — coordinate before you edit

If two people change these at once, Git will conflict:

- `frontend/src/App.tsx`
- `frontend/src/routes/AppRoutes.tsx`
- `frontend/src/services/apiClient.ts`
- `frontend/src/components/layout/` (Sidebar, AppLayout, TopBar)
- `frontend/src/components/cub-assistant/`
- `frontend/src/locales/en.json`
- `backend/app/main.py`
- `backend/app/core/config.py`

**Safe pattern:** add a new page in **your module folder**, then add **one new `<Route>`** in `AppRoutes.tsx` (and a sidebar link only if the team agrees).

Do **not** create a second React app.

---

## 6. How we build (page by page)

1. Agree the next **one** page.
2. Implement only that page + required shared bits.
3. Run it on localhost and test.
4. Small commit, push **your** branch, open a PR into `main`.
5. Wait until that is reviewed before starting a huge extra feature.

English UI first. Sinhala later. Web first, not a mobile app yet.

---

## 7. Rules that affect every module

- Virtual money only. No real banks, trades, or payments.
- Shared wallet will be **one** service later (research spec: Rs 500,000). The stock dashboard currently **shows** a practice Rs 100,000 — do not invent a second real balance in your module.
- Save your module’s demo JSON with `saveModuleState(childId(), "choices" | "missions" | "safety" | "progress", data)` in `frontend/src/services/apiClient.ts`. Allowed module names are `child`, `market`, `choices`, `missions`, `safety`, `progress`.
- Cub is **rule-based** guidance. Never call it a trained AI model in the UI or the report unless a real model is integrated and evaluated.
- Scam drills stay **inside WiseCub**. No sending real email/SMS/calls. No real phishing sites.
- Demo child only for early PP1. No real children’s data.
- Do not commit secrets, `.env`, `node_modules`, or `.venv`.

---

## 8. Suggested next pages (after you have the shared code)

- **Member 1:** Lesson 1 screen, then market terminal / buy-sell.
- **Member 2:** Levels map, then one branching scenario (Birthday money or The phone that broke).
- **Member 3:** Mission board, then one budget mission.
- **Member 4:** Scam home with six lesson types, then one **in-app** fake message drill.

Keep Cub. Add suggested chips in `cubGuidance.ts` for your new screens if needed.

---

## 9. If `git` is not recognised in PowerShell

Use the full path:

```powershell
& "C:\Program Files\Git\cmd\git.exe" status
```

Set your own name and GitHub email once (use **your** details):

```powershell
& "C:\Program Files\Git\cmd\git.exe" config --global user.name "Your Name"
& "C:\Program Files\Git\cmd\git.exe" config --global user.email "your-github-email@example.com"
```

---

## 10. Simple commit messages

Examples:

- `Add decision-making levels page`
- `Add first branching scenario`
- `Add scam lesson list`

Do not put tool names in commits.
