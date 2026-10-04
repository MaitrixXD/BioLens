"""
BioLens Feature Engineering Module
Phase 2: Computes all derived features from raw user inputs.
These functions are used both during training (to verify dataset consistency)
and during live inference (to compute features from the 38-field user input).
"""

import numpy as np
import pandas as pd


# ─────────────────────────────────────────────────────────────────────
# 2.1 Body Composition Domain
# ─────────────────────────────────────────────────────────────────────

def compute_bmi(weight_kg, height_cm):
    """BMI = weight / (height_in_m)²"""
    height_m = height_cm / 100.0
    return round(weight_kg / (height_m ** 2), 1)


def compute_body_fat_pct(bmi, age_years, sex_phys):
    """Deurenberg formula: Body Fat % = 1.20 × BMI + 0.23 × Age - 10.8 × Sex - 5.4
    where Sex = 1 for male, 0 for female."""
    sex_val = 1 if sex_phys == 'Male' else 0
    bf = 1.20 * bmi + 0.23 * age_years - 10.8 * sex_val - 5.4
    return round(max(3.0, min(60.0, bf)), 1)


def compute_fat_free_mass_index(weight_kg, body_fat_pct, height_cm):
    """FFMI = (Weight × (1 - Body Fat%/100)) / Height_m²"""
    height_m = height_cm / 100.0
    ffm = weight_kg * (1 - body_fat_pct / 100.0)
    return round(ffm / (height_m ** 2), 1)


# ─────────────────────────────────────────────────────────────────────
# 2.2 Cardiovascular & Recovery Domain
# ─────────────────────────────────────────────────────────────────────

def compute_max_hr(age_years):
    """Max HR using Tanaka formula: 208 - 0.7 × Age"""
    return round(208 - 0.7 * age_years)


def compute_hr_reserve(max_hr, resting_hr):
    """Heart Rate Reserve = Max HR - Resting HR"""
    return max_hr - resting_hr


def compute_avg_hr(resting_hr, max_hr):
    """Average HR = Resting HR + (Max HR - Resting HR) × 0.3"""
    return round(resting_hr + (max_hr - resting_hr) * 0.3)


def compute_exercise_hr(resting_hr, max_hr):
    """Exercise HR estimated at ~65% of HR reserve (Karvonen method)."""
    return round(resting_hr + (max_hr - resting_hr) * 0.65)


def compute_map(systolic, diastolic):
    """Mean Arterial Pressure = Diastolic + (Systolic - Diastolic) / 3"""
    return round(diastolic + (systolic - diastolic) / 3.0, 1)


def compute_pulse_pressure(systolic, diastolic):
    """Pulse Pressure = Systolic - Diastolic"""
    return systolic - diastolic


def compute_autonomic_load_index(resting_hr, hrv_rmssd):
    """Autonomic Load Index = Resting HR / HRV_RMSSD.
    Higher = more stress, lower = better recovery."""
    if hrv_rmssd <= 0:
        return 10.0  # Cap at high stress
    return round(resting_hr / hrv_rmssd, 2)


def compute_age_adjusted_hrv(hrv_rmssd, age_years):
    """Normalizes HRV for age-related decline.
    Expected HRV decreases ~1ms per year from baseline of ~90ms at age 20."""
    expected_hrv = max(20, 90 - (age_years - 20) * 0.8)
    return round((hrv_rmssd / expected_hrv) * 100, 1)


def compute_resting_hr_age_delta(resting_hr, age_years):
    """Resting HR compared to ACSM age-based norms.
    Negative = better than average, Positive = worse than average."""
    # ACSM average RHR norms by age group
    if age_years < 26:
        norm = 72
    elif age_years < 36:
        norm = 72
    elif age_years < 46:
        norm = 73
    elif age_years < 56:
        norm = 74
    elif age_years < 66:
        norm = 74
    else:
        norm = 73
    return resting_hr - norm


def compute_trend_per_week(current_value, value_90d_ago, weeks=13):
    """Trend = (Current - 90d Ago) / 13 weeks."""
    return round((current_value - value_90d_ago) / weeks, 3)


# ─────────────────────────────────────────────────────────────────────
# 2.3 Sleep Domain
# ─────────────────────────────────────────────────────────────────────

def compute_restorative_sleep_pct(deep_sleep_pct, rem_sleep_pct):
    """Restorative Sleep % = Deep Sleep % + REM Sleep %"""
    return round(deep_sleep_pct + rem_sleep_pct, 1)


def compute_restorative_sleep_hours(restorative_pct, sleep_duration_h):
    """Restorative hours = (Restorative % / 100) × Sleep Duration"""
    return round((restorative_pct / 100.0) * sleep_duration_h, 2)


# ─────────────────────────────────────────────────────────────────────
# 2.4 Activity & Training Domain
# ─────────────────────────────────────────────────────────────────────

def compute_active_minutes_per_day(steps_per_day, weekly_workout_minutes, workout_days_per_week):
    """Active Minutes = (Steps / 100) + (Weekly Workout Minutes / 7)"""
    return round((steps_per_day / 100.0) + (weekly_workout_minutes / 7.0))


def compute_weekly_workout_minutes(workout_days_per_week, avg_workout_duration_min):
    """Weekly Workout Minutes = Days × Avg Duration"""
    return round(workout_days_per_week * avg_workout_duration_min)


def compute_cardio_sessions(workout_days, strength_sessions):
    """Cardio Sessions = Workout Days - Strength Sessions"""
    return max(0, workout_days - strength_sessions)


def compute_strength_to_total_ratio(strength_sessions, workout_days):
    """Strength-to-Total Ratio = Strength / Total Workout Days"""
    if workout_days == 0:
        return 0.0
    return round(strength_sessions / workout_days, 2)


def compute_steps_per_sedentary_hour(steps_per_day, sedentary_hours):
    """Steps per Sedentary Hour"""
    if sedentary_hours <= 0:
        return steps_per_day
    return round(steps_per_day / sedentary_hours)


def compute_zone_minutes(weekly_workout_minutes):
    """Estimate zone distribution from total weekly workout minutes.
    Zone Low ~60%, Zone Moderate ~25%, Zone High ~15%"""
    zone_low = round(weekly_workout_minutes * 0.60)
    zone_moderate = round(weekly_workout_minutes * 0.25)
    zone_high = round(weekly_workout_minutes * 0.15)
    return zone_low, zone_moderate, zone_high


def compute_training_load(zone_low, zone_moderate, zone_high):
    """Training Load = Weighted zone sum (low×1 + moderate×2 + high×3) / 7"""
    return round((zone_low * 1 + zone_moderate * 2 + zone_high * 3) / 7.0, 2)


# ─────────────────────────────────────────────────────────────────────
# 2.5 Metabolic & Respiratory Domain
# ─────────────────────────────────────────────────────────────────────

def compute_calories_burned(weight_kg, height_cm, age_years, sex_phys,
                            active_minutes_per_day):
    """TDEE using Harris-Benedict BMR + activity factor.
    BMR (Male): 88.362 + (13.397 × weight) + (4.799 × height) - (5.677 × age)
    BMR (Female): 447.593 + (9.247 × weight) + (3.098 × height) - (4.330 × age)
    Activity factor estimated from active minutes."""
    if sex_phys == 'Male':
        bmr = 88.362 + (13.397 * weight_kg) + (4.799 * height_cm) - (5.677 * age_years)
    else:
        bmr = 447.593 + (9.247 * weight_kg) + (3.098 * height_cm) - (4.330 * age_years)

    # Activity multiplier based on active minutes
    if active_minutes_per_day < 30:
        multiplier = 1.2
    elif active_minutes_per_day < 60:
        multiplier = 1.375
    elif active_minutes_per_day < 120:
        multiplier = 1.55
    elif active_minutes_per_day < 180:
        multiplier = 1.725
    else:
        multiplier = 1.9

    return round(bmr * multiplier)


def compute_energy_per_kg(calories_burned, weight_kg):
    """Energy expenditure per kg bodyweight."""
    if weight_kg <= 0:
        return 0
    return round(calories_burned / weight_kg, 1)


def compute_vo2max_per_rhr(vo2max, resting_hr):
    """VO₂ Max efficiency ratio = VO₂ Max / Resting HR"""
    if resting_hr <= 0:
        return 0
    return round(vo2max / resting_hr, 3)


# ─────────────────────────────────────────────────────────────────────
# Master Pipeline Function
# ─────────────────────────────────────────────────────────────────────

def compute_all_features(raw_input):
    """
    Takes a dict of raw user inputs and returns a dict with all
    computed features added.

    Args:
        raw_input: dict with the ~38 raw input fields

    Returns:
        dict with all raw + computed features (78 total, excluding targets)
    """
    d = dict(raw_input)  # copy

    # Body Composition
    d['bmi'] = compute_bmi(d['weight_kg'], d['height_cm'])

    # Use provided body_fat_pct if available, otherwise compute
    if 'body_fat_pct' not in d or pd.isna(d.get('body_fat_pct')):
        d['body_fat_pct'] = compute_body_fat_pct(d['bmi'], d['age_years'], d['sex_phys'])

    # Cardiovascular
    d['max_hr_bpm'] = compute_max_hr(d['age_years'])
    d['hr_reserve_bpm'] = compute_hr_reserve(d['max_hr_bpm'], d['resting_hr_bpm'])
    d['avg_hr_bpm'] = compute_avg_hr(d['resting_hr_bpm'], d['max_hr_bpm'])
    d['exercise_hr_bpm'] = compute_exercise_hr(d['resting_hr_bpm'], d['max_hr_bpm'])

    # Blood Pressure derived
    if 'bp_systolic_mmHg' in d and 'bp_diastolic_mmHg' in d:
        d['map_mmHg'] = compute_map(d['bp_systolic_mmHg'], d['bp_diastolic_mmHg'])
        d['pulse_pressure_mmHg'] = compute_pulse_pressure(d['bp_systolic_mmHg'], d['bp_diastolic_mmHg'])

    # Autonomic & Recovery
    d['autonomic_load_index'] = compute_autonomic_load_index(d['resting_hr_bpm'], d['hrv_rmssd_ms'])
    d['age_adjusted_hrv'] = compute_age_adjusted_hrv(d['hrv_rmssd_ms'], d['age_years'])
    d['resting_hr_age_delta'] = compute_resting_hr_age_delta(d['resting_hr_bpm'], d['age_years'])

    # Sleep
    d['restorative_sleep_pct'] = compute_restorative_sleep_pct(d['deep_sleep_pct'], d['rem_sleep_pct'])
    if 'light_sleep_pct' not in d:
        d['light_sleep_pct'] = max(0, 100 - d['restorative_sleep_pct'])

    # Activity & Training
    if 'weekly_workout_minutes' not in d and 'avg_workout_duration_min' in d:
        d['weekly_workout_minutes'] = compute_weekly_workout_minutes(
            d.get('workout_days_per_week', 0), d.get('avg_workout_duration_min', 0))

    if 'cardio_sessions_per_week' not in d:
        d['cardio_sessions_per_week'] = compute_cardio_sessions(
            d.get('workout_days_per_week', 0), d.get('strength_sessions_per_week', 0))

    d['active_minutes_per_day'] = compute_active_minutes_per_day(
        d.get('steps_per_day', 0), d.get('weekly_workout_minutes', 0), d.get('workout_days_per_week', 0))

    # Zone distributions
    weekly_mins = d.get('weekly_workout_minutes', 0)
    if 'zone_low_min_per_week' not in d:
        z_low, z_mod, z_high = compute_zone_minutes(weekly_mins)
        d['zone_low_min_per_week'] = z_low
        d['zone_moderate_min_per_week'] = z_mod
        d['zone_high_min_per_week'] = z_high
    else:
        z_low = d['zone_low_min_per_week']
        z_mod = d['zone_moderate_min_per_week']
        z_high = d['zone_high_min_per_week']

    # Training loads
    if 'training_load_7d_avg' not in d:
        d['training_load_7d_avg'] = compute_training_load(z_low, z_mod, z_high)
    if 'training_load_30d_avg' not in d:
        d['training_load_30d_avg'] = d['training_load_7d_avg']  # Approximate

    # Trends (only if 90d values are provided)
    trend_pairs = [
        ('resting_hr_bpm', 'resting_hr_bpm_90d_ago', 'resting_hr_trend_per_week'),
        ('hrv_rmssd_ms', 'hrv_rmssd_ms_90d_ago', 'hrv_trend_per_week'),
        ('sleep_duration_h', 'sleep_duration_h_90d_ago', 'sleep_trend_per_week'),
        ('steps_per_day', 'steps_per_day_90d_ago', 'steps_trend_per_week'),
        ('vo2max_ml_kg_min', 'vo2max_ml_kg_min_90d_ago', 'vo2max_trend_per_week'),
        ('respiratory_rate_brpm', 'respiratory_rate_90d_ago', 'respiratory_rate_trend_per_week'),
        ('skin_temp_c', 'skin_temp_c_90d_ago', 'skin_temp_c_trend_per_week'),
    ]
    for current_key, ago_key, trend_key in trend_pairs:
        # Use dataset column names if canonical names not found
        actual_ago_key = ago_key
        actual_trend_key = trend_key
        if actual_ago_key in d and trend_key not in d:
            d[actual_trend_key] = compute_trend_per_week(d[current_key], d[actual_ago_key])

    return d


def compute_features_for_dataframe(df):
    """
    Apply feature computation to an entire DataFrame (for training validation).
    Adds any missing computed columns.
    """
    result = df.copy()

    # BMI
    result['bmi_computed'] = result.apply(
        lambda r: compute_bmi(r['weight_kg'], r['height_cm']), axis=1)

    # Max HR
    result['max_hr_computed'] = result['age_years'].apply(compute_max_hr)

    # Autonomic Load
    result['autonomic_load_computed'] = result.apply(
        lambda r: compute_autonomic_load_index(r['resting_hr_bpm'], r['hrv_rmssd_ms']), axis=1)

    # Restorative Sleep
    result['restorative_sleep_computed'] = result.apply(
        lambda r: compute_restorative_sleep_pct(r['deep_sleep_pct'], r['rem_sleep_pct']), axis=1)

    return result
