# WiseCub

AI-Powered Multilingual Financial Literacy and Investment Education System for Children Aged 12–16.

Project ID: **J26-IT-418**. Virtual money and demo data only in this increment. No real banks, trades, or trained AI models.

**Other members:** start with [`docs/team-guide.md`](docs/team-guide.md) — what is already built, your folder, and how to use your feature branch.

## What this increment includes

- Landing page at `/`
- After **Enter as demo child**, Market Home at `/market`
- Route stubs for Choices, Missions, and Scam Safety
- Shared layout, buttons, cards, and a static Cub placeholder (not inside a module folder)
- FastAPI `/health` — MongoDB is connected when `mongod` is running (`database: connected`)

## Run the frontend

Requires Node.js 20+.

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

- Landing: `/`
- Market Home: `/market` (also the demo enter button)
- Choices stub: `/choices`
- Missions stub: `/missions`
- Scam Safety stub: `/safety`

## Run the backend

Requires Python 3.11+. From the `backend` folder:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

- Health: http://localhost:8000/health (`database` is `connected` or `down`)
- API docs: http://localhost:8000/docs

Start MongoDB on `mongodb://localhost:27017` (database name `wisecub`). The API still boots if Mongo is off; login and trades stay in the browser until Mongo is up.

Copy `.env.example` to `.env` for local overrides. Never commit `.env`.

## Shared files (coordinate before editing)

- `frontend/src/App.tsx`
- `frontend/src/routes/AppRoutes.tsx`
- `frontend/src/services/apiClient.ts`
- `backend/app/main.py`
- `backend/app/core/config.py`

## Module folders

| Member | Frontend | Backend (not started) |
|---|---|---|
| 1 Stock market | `frontend/src/modules/stock-market/` | `backend/app/modules/stock_market/` |
| 2 Decision-making | `frontend/src/modules/decision-making/` | `backend/app/modules/decision_making/` |
| 3 Gamified learning | `frontend/src/modules/gamified-learning/` | `backend/app/modules/gamified_learning/` |
| 4 Scam safety | `frontend/src/modules/scam-safety/` | `backend/app/modules/scam_safety/` |
