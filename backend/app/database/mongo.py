from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import PyMongoError

from app.core.config import settings

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient | None:
    return _client


def get_db() -> AsyncIOMotorDatabase | None:
    if _client is None:
        return None
    return _client[settings.mongodb_db]


async def ping_db() -> bool:
    if _client is None:
        return False
    try:
        await _client.admin.command("ping")
        return True
    except PyMongoError:
        return False


async def connect() -> None:
    global _client
    _client = AsyncIOMotorClient(
        settings.mongodb_uri,
        serverSelectionTimeoutMS=4000,
    )
    try:
        await _client.admin.command("ping")
        db = _client[settings.mongodb_db]
        await db.children.create_index("child_id", unique=True)
        await db.accounts.create_index("child_id", unique=True)
        await db.accounts.create_index(
            "username",
            unique=True,
            sparse=True,
        )
        await db.accounts.create_index(
            "email",
            unique=True,
            sparse=True,
            partialFilterExpression={"email": {"$gt": ""}},
        )
        await db.module_state.create_index(
            [("child_id", 1), ("module", 1)],
            unique=True,
        )
        await db.market_events.create_index([("child_id", 1), ("at", 1)])
        await db.market_events.create_index([("child_id", 1), ("session_id", 1)])
    except PyMongoError:
        # API still starts. /health reports database as down until Mongo is running.
        pass


async def disconnect() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    await connect()
    yield
    await disconnect()
