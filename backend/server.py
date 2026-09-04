from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
import time
from datetime import datetime, timezone, timedelta
from typing import Optional

import bcrypt
import jwt
from bson import ObjectId
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="AURA ROYALE API")
api_router = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"
DEFAULT_BALANCE = 1561
GAMES = {"Crash", "Dice", "Mines", "Coinflip", "Plinko", "Limbo", "Tower", "Wheel", "Chicken Road", "Roulette", "Blackjack", "Sweet Bonanza"}

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("aura")


# ---------------------------------------------------------------- helpers
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(hours=12), "type": "access"}
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, user_id: str, email: str):
    response.set_cookie("access_token", create_access_token(user_id, email), httponly=True, secure=True, samesite="none", max_age=43200, path="/")
    response.set_cookie("refresh_token", create_refresh_token(user_id), httponly=True, secure=True, samesite="none", max_age=604800, path="/")


def public_user(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "email": doc["email"],
        "name": doc.get("name", ""),
        "role": doc.get("role", "user"),
        "balance": int(doc.get("balance", DEFAULT_BALANCE)),
        "created_at": doc.get("created_at", ""),
    }


def parse_object_id(user_id: str) -> ObjectId:
    try:
        return ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Ungültige Nutzer-ID.")


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Nicht angemeldet")
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Ungültiger Token")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sitzung abgelaufen")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Ungültiger Token")
    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if not user:
        raise HTTPException(status_code=401, detail="Benutzer nicht gefunden")
    return user


async def require_admin(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Nur für Admins.")
    return user


# ---------------------------------------------------------------- models
class RegisterInput(BaseModel):
    name: str = Field(min_length=2, max_length=40)
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class BalanceInput(BaseModel):
    balance: int = Field(ge=0, le=100_000_000)


class DepositInput(BaseModel):
    amount: int = Field(ge=100, le=100_000)


class RoleInput(BaseModel):
    role: str


class RoundInput(BaseModel):
    game: str = Field(max_length=30)
    bet: int = Field(ge=0, le=100_000_000)
    mult: float = Field(ge=0, le=1_000_000)
    payout: int = Field(ge=0, le=1_000_000_000)
    meta: Optional[dict] = None


class ChatInput(BaseModel):
    text: str = Field(min_length=1, max_length=240)


# ---------------------------------------------------------------- root
@api_router.get("/")
async def root():
    return {"message": "AURA ROYALE API", "ok": True}


# ---------------------------------------------------------------- auth
@api_router.post("/auth/register")
async def register(input: RegisterInput, response: Response):
    email = input.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Diese E-Mail ist bereits registriert.")
    doc = {
        "name": input.name.strip(),
        "email": email,
        "password_hash": hash_password(input.password),
        "role": "user",
        "balance": DEFAULT_BALANCE,
        "created_at": now_iso(),
    }
    result = await db.users.insert_one(doc)
    doc["_id"] = result.inserted_id
    set_auth_cookies(response, str(result.inserted_id), email)
    return public_user(doc)


@api_router.post("/auth/login")
async def login(input: LoginInput, response: Response):
    email = input.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(input.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="E-Mail oder Passwort falsch.")
    set_auth_cookies(response, str(user["_id"]), email)
    return public_user(user)


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@api_router.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return public_user(user)


@api_router.get("/auth/balance")
async def get_balance(user=Depends(get_current_user)):
    return {"balance": int(user.get("balance", DEFAULT_BALANCE))}


@api_router.put("/auth/balance")
async def set_balance(input: BalanceInput, user=Depends(get_current_user)):
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"balance": input.balance}})
    return {"balance": input.balance}


# ---------------------------------------------------------------- wallet
@api_router.post("/wallet/deposit")
async def deposit(input: DepositInput, user=Depends(get_current_user)):
    res = await db.users.find_one_and_update(
        {"_id": user["_id"]},
        {"$inc": {"balance": input.amount}},
        return_document=True,
    )
    await db.transactions.insert_one({
        "user_id": str(user["_id"]),
        "type": "deposit",
        "amount": input.amount,
        "ts": now_iso(),
    })
    return {"balance": int(res["balance"]), "amount": input.amount}


DAILY_BONUS = 500
DAILY_BONUS_COOLDOWN = timedelta(hours=24)


def _bonus_status(user: dict) -> dict:
    last = user.get("last_bonus_at")
    now = datetime.now(timezone.utc)
    if last:
        last_dt = datetime.fromisoformat(last)
        next_at = last_dt + DAILY_BONUS_COOLDOWN
        if next_at > now:
            return {"available": False, "amount": DAILY_BONUS, "next_at": next_at.isoformat(), "seconds_left": int((next_at - now).total_seconds())}
    return {"available": True, "amount": DAILY_BONUS, "next_at": None, "seconds_left": 0}


@api_router.get("/wallet/daily-bonus")
async def daily_bonus_status(user=Depends(get_current_user)):
    return _bonus_status(user)


@api_router.post("/wallet/daily-bonus")
async def claim_daily_bonus(user=Depends(get_current_user)):
    status = _bonus_status(user)
    if not status["available"]:
        raise HTTPException(status_code=400, detail="Daily Bonus bereits abgeholt. Komm später wieder.")
    res = await db.users.find_one_and_update(
        {"_id": user["_id"]},
        {"$inc": {"balance": DAILY_BONUS}, "$set": {"last_bonus_at": now_iso()}},
        return_document=True,
    )
    await db.transactions.insert_one({"user_id": str(user["_id"]), "type": "daily_bonus", "amount": DAILY_BONUS, "ts": now_iso()})
    return {"balance": int(res["balance"]), "amount": DAILY_BONUS, **_bonus_status(res)}


# ---------------------------------------------------------------- rounds
def public_round(r: dict) -> dict:
    return {
        "id": str(r.get("_id", "")),
        "game": r.get("game"),
        "bet": int(r.get("bet", 0)),
        "mult": float(r.get("mult", 0)),
        "payout": int(r.get("payout", 0)),
        "ts": r.get("ts"),
        "user_name": r.get("user_name", "Spieler"),
        "user_id": r.get("user_id"),
        "meta": r.get("meta"),
    }


@api_router.post("/rounds")
async def create_round(input: RoundInput, user=Depends(get_current_user)):
    game = input.game if input.game in GAMES else input.game[:30]
    doc = {
        "user_id": str(user["_id"]),
        "user_name": user.get("name", "Spieler"),
        "game": game,
        "bet": input.bet,
        "mult": round(input.mult, 4),
        "payout": input.payout,
        "meta": input.meta or None,
        "ts": now_iso(),
    }
    res = await db.rounds.insert_one(doc)
    doc["_id"] = res.inserted_id
    return public_round(doc)


@api_router.get("/rounds/mine")
async def my_rounds(limit: int = 20, user=Depends(get_current_user)):
    rows = await db.rounds.find({"user_id": str(user["_id"])}).sort("ts", -1).to_list(max(1, min(limit, 100)))
    return [public_round(r) for r in rows]


@api_router.get("/rounds/recent")
async def recent_rounds(limit: int = 20, game: Optional[str] = None):
    q = {"game": game} if game else {}
    rows = await db.rounds.find(q).sort("ts", -1).to_list(max(1, min(limit, 60)))
    return [public_round(r) for r in rows]


@api_router.get("/leaderboard")
async def leaderboard(limit: int = 10, range: str = "all"):
    match = {}
    if range in ("24h", "7d"):
        delta = timedelta(hours=24) if range == "24h" else timedelta(days=7)
        match = {"ts": {"$gte": (datetime.now(timezone.utc) - delta).isoformat()}}
    pipeline = [
        {"$match": match},
        {"$group": {
            "_id": "$user_id",
            "name": {"$last": "$user_name"},
            "rounds": {"$sum": 1},
            "wagered": {"$sum": "$bet"},
            "payout": {"$sum": "$payout"},
            "best_mult": {"$max": "$mult"},
            "wins": {"$sum": {"$cond": [{"$gt": ["$payout", "$bet"]}, 1, 0]}},
        }},
        {"$addFields": {"profit": {"$subtract": ["$payout", "$wagered"]}}},
        {"$sort": {"profit": -1}},
        {"$limit": max(1, min(limit, 50))},
    ]
    rows = await db.rounds.aggregate(pipeline).to_list(50)
    return [
        {
            "user_id": r["_id"],
            "name": r.get("name") or "Spieler",
            "rounds": r["rounds"],
            "wagered": int(r["wagered"]),
            "payout": int(r["payout"]),
            "profit": int(r["profit"]),
            "best_mult": float(r.get("best_mult") or 0),
            "wins": r["wins"],
        }
        for r in rows
    ]


@api_router.get("/me/stats")
async def my_stats(user=Depends(get_current_user)):
    uid = str(user["_id"])
    pipeline = [
        {"$match": {"user_id": uid}},
        {"$group": {
            "_id": "$game",
            "rounds": {"$sum": 1},
            "wagered": {"$sum": "$bet"},
            "payout": {"$sum": "$payout"},
            "best_mult": {"$max": "$mult"},
            "wins": {"$sum": {"$cond": [{"$gt": ["$payout", "$bet"]}, 1, 0]}},
        }},
        {"$sort": {"rounds": -1}},
    ]
    per_game = await db.rounds.aggregate(pipeline).to_list(20)
    total = {"rounds": 0, "wagered": 0, "payout": 0, "wins": 0, "best_mult": 0.0}
    games = []
    for g in per_game:
        total["rounds"] += g["rounds"]
        total["wagered"] += int(g["wagered"])
        total["payout"] += int(g["payout"])
        total["wins"] += g["wins"]
        total["best_mult"] = max(total["best_mult"], float(g.get("best_mult") or 0))
        games.append({
            "game": g["_id"],
            "rounds": g["rounds"],
            "wagered": int(g["wagered"]),
            "payout": int(g["payout"]),
            "profit": int(g["payout"]) - int(g["wagered"]),
            "wins": g["wins"],
            "best_mult": float(g.get("best_mult") or 0),
        })
    total["profit"] = total["payout"] - total["wagered"]
    total["win_rate"] = round((total["wins"] / total["rounds"]) * 100, 1) if total["rounds"] else 0.0
    deposits = await db.transactions.aggregate([
        {"$match": {"user_id": uid, "type": "deposit"}},
        {"$group": {"_id": None, "sum": {"$sum": "$amount"}, "count": {"$sum": 1}}},
    ]).to_list(1)
    dep = deposits[0] if deposits else {"sum": 0, "count": 0}
    recent = await db.rounds.find({"user_id": uid}).sort("ts", -1).to_list(25)
    return {
        "user": public_user(user),
        "total": total,
        "games": games,
        "deposits": {"sum": int(dep.get("sum", 0)), "count": int(dep.get("count", 0))},
        "recent": [public_round(r) for r in recent],
    }


@api_router.get("/stats/public")
async def public_stats():
    since = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    players = await db.users.count_documents({})
    rounds_24h = await db.rounds.count_documents({"ts": {"$gte": since}})
    best = await db.rounds.find({"ts": {"$gte": since}, "payout": {"$gt": 0}}).sort("payout", -1).to_list(1)
    wagered = await db.rounds.aggregate([
        {"$match": {"ts": {"$gte": since}}},
        {"$group": {"_id": None, "sum": {"$sum": "$bet"}}},
    ]).to_list(1)
    return {
        "players": players,
        "rounds_24h": rounds_24h,
        "wagered_24h": int(wagered[0]["sum"]) if wagered else 0,
        "biggest_win": public_round(best[0]) if best else None,
    }


# ---------------------------------------------------------------- chat
_last_msg_at: dict[str, float] = {}


def public_message(m: dict) -> dict:
    return {
        "id": str(m.get("_id", "")),
        "user_id": m.get("user_id"),
        "name": m.get("name", "Spieler"),
        "role": m.get("role", "user"),
        "text": m.get("text", ""),
        "ts": m.get("ts"),
    }


@api_router.get("/chat/messages")
async def chat_messages(after: Optional[str] = None, limit: int = 50):
    q = {"ts": {"$gt": after}} if after else {}
    rows = await db.chat.find(q).sort("ts", -1).to_list(max(1, min(limit, 100)))
    rows.reverse()
    return [public_message(m) for m in rows]


@api_router.post("/chat/messages")
async def chat_send(input: ChatInput, user=Depends(get_current_user)):
    uid = str(user["_id"])
    now = time.time()
    if now - _last_msg_at.get(uid, 0) < 1.2:
        raise HTTPException(status_code=429, detail="Bitte kurz warten, bevor du erneut schreibst.")
    text = " ".join(input.text.split())
    if not text:
        raise HTTPException(status_code=400, detail="Nachricht ist leer.")
    _last_msg_at[uid] = now
    doc = {"user_id": uid, "name": user.get("name", "Spieler"), "role": user.get("role", "user"), "text": text[:240], "ts": now_iso()}
    res = await db.chat.insert_one(doc)
    doc["_id"] = res.inserted_id
    return public_message(doc)


@api_router.get("/chat/online")
async def chat_online():
    since = (datetime.now(timezone.utc) - timedelta(minutes=15)).isoformat()
    active_rounds = await db.rounds.distinct("user_id", {"ts": {"$gte": since}})
    active_chat = await db.chat.distinct("user_id", {"ts": {"$gte": since}})
    return {"online": len(set(active_rounds) | set(active_chat))}


# ---------------------------------------------------------------- admin
@api_router.get("/admin/users")
async def admin_users(admin=Depends(require_admin)):
    users = await db.users.find().sort("created_at", -1).to_list(500)
    ids = [str(u["_id"]) for u in users]
    agg = await db.rounds.aggregate([
        {"$match": {"user_id": {"$in": ids}}},
        {"$group": {"_id": "$user_id", "rounds": {"$sum": 1}, "wagered": {"$sum": "$bet"}, "payout": {"$sum": "$payout"}}},
    ]).to_list(500)
    stats = {a["_id"]: a for a in agg}
    out = []
    for u in users:
        s = stats.get(str(u["_id"]), {})
        out.append({
            **public_user(u),
            "rounds": int(s.get("rounds", 0)),
            "wagered": int(s.get("wagered", 0)),
            "profit": int(s.get("payout", 0)) - int(s.get("wagered", 0)),
        })
    return out


@api_router.put("/admin/users/{user_id}/role")
async def admin_set_role(user_id: str, input: RoleInput, admin=Depends(require_admin)):
    if input.role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="Ungültige Rolle.")
    if str(admin["_id"]) == user_id and input.role != "admin":
        raise HTTPException(status_code=400, detail="Du kannst dir nicht selbst die Admin-Rolle entziehen.")
    res = await db.users.update_one({"_id": parse_object_id(user_id)}, {"$set": {"role": input.role}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden.")
    return {"ok": True, "role": input.role}


@api_router.put("/admin/users/{user_id}/balance")
async def admin_set_balance(user_id: str, input: BalanceInput, admin=Depends(require_admin)):
    res = await db.users.update_one({"_id": parse_object_id(user_id)}, {"$set": {"balance": input.balance}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden.")
    return {"ok": True, "balance": input.balance}


@api_router.delete("/admin/chat/{message_id}")
async def admin_delete_message(message_id: str, admin=Depends(require_admin)):
    res = await db.chat.delete_one({"_id": parse_object_id(message_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Nachricht nicht gefunden.")
    return {"ok": True}


# ---------------------------------------------------------------- lifecycle
async def seed_user(email: str, password: str, name: str, role: str):
    existing = await db.users.find_one({"email": email})
    if existing is None:
        await db.users.insert_one({
            "name": name,
            "email": email,
            "password_hash": hash_password(password),
            "role": role,
            "balance": DEFAULT_BALANCE,
            "created_at": now_iso(),
        })
    elif not verify_password(password, existing["password_hash"]):
        await db.users.update_one({"email": email}, {"$set": {"password_hash": hash_password(password)}})


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.rounds.create_index([("ts", -1)])
    await db.rounds.create_index([("user_id", 1), ("ts", -1)])
    await db.chat.create_index([("ts", -1)])
    await db.transactions.create_index([("user_id", 1), ("ts", -1)])
    await seed_user(os.environ["ADMIN_EMAIL"], os.environ["ADMIN_PASSWORD"], "Admin", "admin")
    await seed_user("demo@auraroyale.de", "Demo2026!", "Demo Spieler", "user")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
