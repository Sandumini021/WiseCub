from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.config import settings
from app.database.mongo import lifespan
from app.modules.accounts.router import router as accounts_router
from app.modules.cub_intent.router import router as cub_intent_router
from app.modules.stock_market.router import router as market_behaviour_router

app = FastAPI(
    title="WiseCub API",
    description="Shared backend for WiseCub. MongoDB holds practice accounts, child ids, and module state.",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(accounts_router)
app.include_router(market_behaviour_router)
app.include_router(cub_intent_router)
