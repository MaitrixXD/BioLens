"""
BioLens Auth Module
MySQL-backed user authentication with bcrypt hashing and JWT tokens.
"""

import os
import json
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
    """Create the users and profiles tables if they don't exist."""
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
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS profiles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                profile_name VARCHAR(150) NOT NULL,
                archetype_name VARCHAR(150),
                resting_hr_bpm FLOAT,
                hrv_rmssd_ms FLOAT,
                vo2max_30d_avg FLOAT,
                sleep_duration_h FLOAT,
                steps_per_day FLOAT,
                deep_sleep_pct FLOAT,
                weight_kg FLOAT,
                bmi FLOAT,
                computed_features JSON,
                insights JSON,
                scores JSON,
                raw_inputs JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        cursor.close()
        conn.close()
        print("✅ Users table ready")
        print("✅ Profiles table ready")
    except Exception as e:
        print(f"⚠️  DB init skipped (check .env credentials): {e}")


def save_profile(profile_name: str, archetype: dict, computed_features: dict,
                 insights: dict, scores: dict, raw_inputs: dict):
    """Save a generated profile report to the profiles table.
    Returns (profile_id, is_duplicate).
    If an identical profile (same name + same key metrics) already exists,
    skips the insert and returns the existing row's id with is_duplicate=True.
    """
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    # ── Deduplication check ──────────────────────────────────────────────────
    # Compare name + all 8 key metric columns (rounded to 2dp to absorb
    # floating-point noise from repeated feature computation).
    cursor.execute("""
        SELECT id FROM profiles
        WHERE profile_name = %s
          AND ROUND(resting_hr_bpm,  2) = ROUND(%s, 2)
          AND ROUND(hrv_rmssd_ms,    2) = ROUND(%s, 2)
          AND ROUND(vo2max_30d_avg,  2) = ROUND(%s, 2)
          AND ROUND(sleep_duration_h,2) = ROUND(%s, 2)
          AND ROUND(steps_per_day,   2) = ROUND(%s, 2)
          AND ROUND(deep_sleep_pct,  2) = ROUND(%s, 2)
          AND ROUND(weight_kg,       2) = ROUND(%s, 2)
          AND ROUND(bmi,             2) = ROUND(%s, 2)
        LIMIT 1
    """, (
        profile_name,
        computed_features.get('resting_hr_bpm'),
        computed_features.get('hrv_rmssd_ms'),
        computed_features.get('vo2max_30d_avg'),
        computed_features.get('sleep_duration_h'),
        computed_features.get('steps_per_day'),
        computed_features.get('deep_sleep_pct'),
        computed_features.get('weight_kg'),
        computed_features.get('bmi'),
    ))
    existing = cursor.fetchone()
    if existing:
        cursor.close()
        conn.close()
        return existing['id'], True   # duplicate — skip insert
    # ────────────────────────────────────────────────────────────────────────

    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO profiles
            (profile_name, archetype_name, resting_hr_bpm, hrv_rmssd_ms,
             vo2max_30d_avg, sleep_duration_h, steps_per_day, deep_sleep_pct,
             weight_kg, bmi, computed_features, insights, scores, raw_inputs)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        profile_name,
        archetype.get('name', ''),
        computed_features.get('resting_hr_bpm'),
        computed_features.get('hrv_rmssd_ms'),
        computed_features.get('vo2max_30d_avg'),
        computed_features.get('sleep_duration_h'),
        computed_features.get('steps_per_day'),
        computed_features.get('deep_sleep_pct'),
        computed_features.get('weight_kg'),
        computed_features.get('bmi'),
        json.dumps(computed_features),
        json.dumps(insights),
        json.dumps(scores),
        json.dumps(raw_inputs),
    ))
    conn.commit()
    profile_id = cursor.lastrowid
    cursor.close()
    conn.close()
    return profile_id, False   # fresh insert


def get_profiles(limit: int = 10):
    """Fetch the most recent N profiles (summary + demographics + 30d averages)."""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT id, profile_name, archetype_name,
               resting_hr_bpm, hrv_rmssd_ms, vo2max_30d_avg,
               sleep_duration_h, steps_per_day, deep_sleep_pct,
               weight_kg, bmi, created_at,
               -- 30-day averages
               CAST(JSON_UNQUOTE(JSON_EXTRACT(raw_inputs, '$.rhr_30d_avg'))   AS DECIMAL(8,2))  AS rhr_30d_avg,
               CAST(JSON_UNQUOTE(JSON_EXTRACT(raw_inputs, '$.hrv_30d_avg'))   AS DECIMAL(8,2))  AS hrv_30d_avg,
               CAST(JSON_UNQUOTE(JSON_EXTRACT(raw_inputs, '$.sleep_30d_avg')) AS DECIMAL(8,2))  AS sleep_30d_avg,
               CAST(JSON_UNQUOTE(JSON_EXTRACT(raw_inputs, '$.steps_30d_avg')) AS DECIMAL(10,2)) AS steps_30d_avg,
               -- Demographics & lifestyle
               CAST(JSON_UNQUOTE(JSON_EXTRACT(raw_inputs, '$.age_years'))              AS UNSIGNED)    AS age_years,
               JSON_UNQUOTE(JSON_EXTRACT(raw_inputs, '$.sex_phys'))                                    AS sex_phys,
               CAST(JSON_UNQUOTE(JSON_EXTRACT(raw_inputs, '$.height_cm'))              AS DECIMAL(6,1)) AS height_cm,
               CAST(JSON_UNQUOTE(JSON_EXTRACT(raw_inputs, '$.body_fat_pct'))           AS DECIMAL(5,1)) AS body_fat_pct,
               CAST(JSON_UNQUOTE(JSON_EXTRACT(raw_inputs, '$.perceived_stress_score')) AS DECIMAL(5,1)) AS perceived_stress_score,
               CAST(JSON_UNQUOTE(JSON_EXTRACT(raw_inputs, '$.workout_days_per_week'))  AS UNSIGNED)    AS workout_days_per_week,
               CAST(JSON_UNQUOTE(JSON_EXTRACT(raw_inputs, '$.sleep_consistency_score')) AS DECIMAL(5,1)) AS sleep_consistency_score,
               JSON_UNQUOTE(JSON_EXTRACT(raw_inputs, '$.diet_type'))                                   AS diet_type
        FROM profiles
        ORDER BY created_at DESC
        LIMIT %s
    """, (limit,))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    float_cols = ('rhr_30d_avg', 'hrv_30d_avg', 'sleep_30d_avg', 'steps_30d_avg',
                  'height_cm', 'body_fat_pct', 'perceived_stress_score', 'sleep_consistency_score')
    int_cols   = ('age_years', 'workout_days_per_week')
    for row in rows:
        if row.get('created_at'):
            row['created_at'] = str(row['created_at'])
        for col in float_cols:
            if row.get(col) is not None:
                row[col] = float(row[col])
        for col in int_cols:
            if row.get(col) is not None:
                row[col] = int(row[col])
    return rows


def get_profile_by_id(profile_id: int):
    """Fetch full profile data (including computed_features) by id."""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM profiles WHERE id = %s", (profile_id,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    if row:
        if row.get('created_at'):
            row['created_at'] = str(row['created_at'])
        # Parse JSON columns
        for col in ('computed_features', 'insights', 'scores', 'raw_inputs'):
            if row.get(col) and isinstance(row[col], str):
                row[col] = json.loads(row[col])
    return row


def delete_profile(profile_id: int) -> bool:
    """Permanently delete a profile row. Returns True if a row was deleted."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM profiles WHERE id = %s", (profile_id,))
    conn.commit()
    affected = cursor.rowcount
    cursor.close()
    conn.close()
    return affected > 0


def update_profile_name(profile_id: int, new_name: str) -> bool:
    """Update only the profile_name of an existing row."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE profiles SET profile_name = %s WHERE id = %s",
        (new_name.strip(), profile_id)
    )
    conn.commit()
    affected = cursor.rowcount
    cursor.close()
    conn.close()
    return affected > 0


def update_profile_full(profile_id: int, profile_name: str, archetype: dict,
                        computed_features: dict, insights: dict,
                        scores: dict, raw_inputs: dict) -> bool:
    """Overwrite ALL columns on an existing profile row (no new row created)."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE profiles SET
            profile_name    = %s,
            archetype_name  = %s,
            resting_hr_bpm  = %s,
            hrv_rmssd_ms    = %s,
            vo2max_30d_avg  = %s,
            sleep_duration_h= %s,
            steps_per_day   = %s,
            deep_sleep_pct  = %s,
            weight_kg       = %s,
            bmi             = %s,
            computed_features = %s,
            insights        = %s,
            scores          = %s,
            raw_inputs      = %s
        WHERE id = %s
    """, (
        profile_name.strip(),
        archetype.get('name', ''),
        computed_features.get('resting_hr_bpm'),
        computed_features.get('hrv_rmssd_ms'),
        computed_features.get('vo2max_30d_avg'),
        computed_features.get('sleep_duration_h'),
        computed_features.get('steps_per_day'),
        computed_features.get('deep_sleep_pct'),
        computed_features.get('weight_kg'),
        computed_features.get('bmi'),
        json.dumps(computed_features),
        json.dumps(insights),
        json.dumps(scores),
        json.dumps(raw_inputs),
        profile_id,
    ))
    conn.commit()
    affected = cursor.rowcount
    cursor.close()
    conn.close()
    return affected > 0


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
