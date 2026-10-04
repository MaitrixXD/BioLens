"""
BioLens Auth Module
MySQL-backed user authentication with bcrypt hashing and JWT tokens.
"""

import os
import bcrypt
import jwt
import mysql.connector
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 3306)),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'biolens_db'),
}

JWT_SECRET = os.getenv('JWT_SECRET', 'change_this_to_a_secure_secret')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRY_HOURS = 24


def get_db():
    """Return a new MySQL connection."""
    return mysql.connector.connect(**DB_CONFIG)


def init_db():
    """Create the users table if it doesn't exist."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(150) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        cursor.close()
        conn.close()
        print("✅ Users table ready")
    except Exception as e:
        print(f"⚠️  DB init skipped (check .env credentials): {e}")


def register_user(name: str, email: str, password: str):
    """Hash password and insert new user. Returns (success, message)."""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    # Check existing
    cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
    if cursor.fetchone():
        cursor.close()
        conn.close()
        return False, "An account with this email already exists."

    # Hash
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    cursor.execute(
        "INSERT INTO users (name, email, password_hash) VALUES (%s, %s, %s)",
        (name, email, hashed)
    )
    conn.commit()
    user_id = cursor.lastrowid
    cursor.close()
    conn.close()

    token = _generate_token(user_id, name, email)
    return True, token


def login_user(email: str, password: str):
    """Verify credentials. Returns (success, token_or_message)."""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT id, name, email, password_hash FROM users WHERE email = %s",
        (email,)
    )
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if not user:
        return False, "No account found with this email."

    if not bcrypt.checkpw(password.encode(), user['password_hash'].encode()):
        return False, "Incorrect password."

    token = _generate_token(user['id'], user['name'], user['email'])
    return True, token


def verify_token(token: str):
    """Decode and verify a JWT. Returns the payload or raises."""
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])


def _generate_token(user_id: int, name: str, email: str) -> str:
    payload = {
        'sub': user_id,
        'name': name,
        'email': email,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
