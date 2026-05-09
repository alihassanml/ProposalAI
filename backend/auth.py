import sqlite3
import hashlib
import secrets
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "halify.db")


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_conn() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                openai_api_key TEXT DEFAULT '',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token TEXT UNIQUE NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
        """)


def _hash_password(password: str, salt: str = None):
    if salt is None:
        salt = secrets.token_hex(16)
    hashed = hashlib.sha256(f"{salt}{password}".encode()).hexdigest()
    return hashed, salt


def create_user(name: str, email: str, password: str):
    hashed, salt = _hash_password(password)
    password_hash = f"{salt}${hashed}"
    try:
        with get_conn() as conn:
            cur = conn.execute(
                "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
                (name, email.lower().strip(), password_hash),
            )
            return {"id": cur.lastrowid, "name": name, "email": email.lower().strip(), "openai_api_key": ""}
    except sqlite3.IntegrityError:
        return None


def verify_user(email: str, password: str):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email.lower().strip(),)).fetchone()
    if not row:
        return None
    stored = row["password_hash"]
    if "$" not in stored:
        return None
    salt, stored_hash = stored.split("$", 1)
    hashed, _ = _hash_password(password, salt)
    if hashed != stored_hash:
        return None
    return dict(row)


def create_session(user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    with get_conn() as conn:
        conn.execute("INSERT INTO sessions (user_id, token) VALUES (?, ?)", (user_id, token))
    return token


def get_user_by_token(token: str):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT u.* FROM users u JOIN sessions s ON s.user_id = u.id WHERE s.token = ?",
            (token,),
        ).fetchone()
    return dict(row) if row else None


def delete_session(token: str):
    with get_conn() as conn:
        conn.execute("DELETE FROM sessions WHERE token = ?", (token,))


def update_api_key(user_id: int, api_key: str):
    with get_conn() as conn:
        conn.execute("UPDATE users SET openai_api_key = ? WHERE id = ?", (api_key, user_id))
