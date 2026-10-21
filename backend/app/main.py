from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.config import settings
from app.database.mongo import lifespan
from app.modules.accounts.router import router as accounts_router
from app.modules.gamified_learning.router import router as gamified_router
from app.modules.cub_intent.router import router as cub_intent_router
from app.modules.stock_market.router import router as market_behaviour_router
from app.modules.safety.router import router as safety_router
from app.modules.decision_making.router import router as decision_making_router

app = FastAPI(
    title="WiseCub API",
    description="Shared backend for WiseCub. MongoDB holds practice accounts, child ids, and module state.",
    version="0.3.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(accounts_router)
app.include_router(market_behaviour_router)
app.include_router(gamified_router)
app.include_router(cub_intent_router)
app.include_router(safety_router)

app.include_router(decision_making_router)
