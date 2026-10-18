from fastapi.testclient import TestClient

from app.main import app
from app.modules.accounts import router as accounts_router
from app.modules.accounts.security import hash_password, public_account, verify_password


class _Coll:
    def __init__(self):
        self.docs: list[dict] = []

    async def find_one(self, query, _proj=None):
        for row in self.docs:
            if all(row.get(k) == v for k, v in query.items()):
                return dict(row)
        return None

    async def insert_one(self, doc):
        self.docs.append(dict(doc))

    async def update_one(self, query, update, upsert=False):
        matched = None
        for row in self.docs:
            if all(row.get(k) == v for k, v in query.items()):
                matched = row
                break
        payload = dict(update.get("$set", {}))
        if matched is None:
            if upsert:
                self.docs.append(payload)
            return
        matched.update(payload)


class _DB:
    def __init__(self):
        self.accounts = _Coll()
        self.children = _Coll()


def test_hash_and_public_account_hide_secret():
    hashed = hash_password("secret12")
    assert hashed != "secret12"
    assert verify_password("secret12", hashed)
    assert not verify_password("wrong", hashed)
    shown = public_account({"name": "Nimal", "password_hash": hashed, "_id": 1})
    assert shown == {"name": "Nimal"}


def test_register_login_me_and_logout(monkeypatch):
    fake = _DB()
    monkeypatch.setattr(accounts_router, "get_db", lambda: fake)
    client = TestClient(app)
    created = client.post(
        "/api/register",
        json={
            "name": "Nimal Perera",
            "username": "nimal24",
            "password": "cubpass",
            "role": "student",
            "age": "14",
            "avatar_id": "kid-sky",
        },
    )
    assert created.status_code == 200
    body = created.json()
    assert "password_hash" not in body
    assert body["username"] == "nimal24"
    assert body["role"] == "student"
    me = client.get("/api/me")
    assert me.status_code == 200
    assert me.json()["child_id"] == body["child_id"]
    client.post("/api/logout")
    assert client.get("/api/me").status_code == 401
    bad = client.post("/api/login", json={"identifier": "nimal24", "password": "nope123"})
    assert bad.status_code == 401
    assert bad.json()["detail"] == "Username or password is wrong."
    ok = client.post("/api/login", json={"identifier": "nimal24", "password": "cubpass"})
    assert ok.status_code == 200
    assert ok.json()["name"] == "Nimal Perera"
    assert client.get("/api/accounts/search?email=x@y.z").status_code == 401


def test_teacher_email_login(monkeypatch):
    fake = _DB()
    monkeypatch.setattr(accounts_router, "get_db", lambda: fake)
    client = TestClient(app)
    created = client.post(
        "/api/register",
        json={
            "name": "Ms Silva",
            "username": "msilva",
            "password": "teach99",
            "role": "teacher",
            "email": "silva@school.lk",
            "institution": "Colombo College",
        },
    )
    assert created.status_code == 200
    client.post("/api/logout")
    logged = client.post(
        "/api/login",
        json={"identifier": "silva@school.lk", "password": "teach99"},
    )
    assert logged.status_code == 200
    assert logged.json()["role"] == "teacher"
    assert "password_hash" not in logged.json()
