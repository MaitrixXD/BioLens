"""
BioLens Configuration Module
Defines column mappings, validation bounds, feature groups, and constants.
"""

# ─────────────────────────────────────────────────────────────────────
# Column Name Mapping: Dataset names → Plan canonical names
# ─────────────────────────────────────────────────────────────────────
COLUMN_RENAME_MAP = {
    'rhr_7d_avg': 'resting_hr_bpm_7d_avg',
    'rhr_30d_avg': 'resting_hr_bpm_30d_avg',
    'hrv_7d_avg': 'hrv_rmssd_ms_7d_avg',
    'hrv_30d_avg': 'hrv_rmssd_ms_30d_avg',
    'sleep_7d_avg': 'sleep_duration_h_7d_avg',
    'sleep_30d_avg': 'sleep_duration_h_30d_avg',
    'steps_7d_avg': 'steps_per_day_7d_avg',
    'steps_30d_avg': 'steps_per_day_30d_avg',
    'rhr_90d_ago': 'resting_hr_bpm_90d_ago',
    'hrv_90d_ago': 'hrv_rmssd_ms_90d_ago',
    'sleep_90d_ago': 'sleep_duration_h_90d_ago',
    'steps_90d_ago': 'steps_per_day_90d_ago',
    'vo2max_30d_avg': 'vo2max_ml_kg_min_30d_avg',
    'vo2max_90d_ago': 'vo2max_ml_kg_min_90d_ago',
    'rhr_trend_per_week': 'resting_hr_trend_per_week',
    'hrv_trend_per_week': 'hrv_trend_per_week',
    'sleep_trend_per_week': 'sleep_trend_per_week',
    'steps_trend_per_week': 'steps_trend_per_week',
    'vo2max_trend_per_week': 'vo2max_trend_per_week',
    'resp_7d_avg': 'respiratory_rate_7d_avg',
    'resp_30d_avg': 'respiratory_rate_30d_avg',
    'resp_90d_ago': 'respiratory_rate_90d_ago',
    'resp_trend_per_week': 'respiratory_rate_trend_per_week',
    'skin_temp_7d_avg': 'skin_temp_c_7d_avg',
    'skin_temp_30d_avg': 'skin_temp_c_30d_avg',
    'skin_temp_90d_ago': 'skin_temp_c_90d_ago',
    'skin_temp_trend_per_week': 'skin_temp_c_trend_per_week',
}

# Reverse mapping for converting canonical names back to dataset names
REVERSE_COLUMN_MAP = {v: k for k, v in COLUMN_RENAME_MAP.items()}

# ─────────────────────────────────────────────────────────────────────
# Categorical Columns
# ─────────────────────────────────────────────────────────────────────
CATEGORICAL_COLUMNS = ['sex_phys', 'ecg_rhythm', 'smoking_status', 'diet_type', 'processed_food_frequency']

CATEGORICAL_VALUES = {
    'sex_phys': ['Male', 'Female'],
    'ecg_rhythm': ['Normal sinus rhythm', 'Premature beats (PAC/PVC)', 'Atrial fibrillation detected', 'Atrial fibrillation'],
    'smoking_status': ['never', 'former', 'current'],
    'diet_type': ['omnivore', 'vegetarian', 'vegan', 'mediterranean', 'keto', 'paleo'],
    'processed_food_frequency': ['rarely', 'sometimes', 'often', 'daily', 'always'],
}

# ─────────────────────────────────────────────────────────────────────
# Target Columns (8 ML Outputs)
# ─────────────────────────────────────────────────────────────────────
TARGET_COLUMNS = [
    'target_cardiovascular',
    'target_metabolic',
    'target_recovery',
    'target_sleep',
    'target_stress',
    'target_fitness',
    'target_autonomic',
    'target_readiness',
]

# Human-friendly target names for display
TARGET_LABELS = {
    'target_cardiovascular': 'Heart Health',
    'target_metabolic': 'Metabolic Health',
    'target_recovery': 'Recovery',
    'target_sleep': 'Sleep Quality',
    'target_stress': 'Stress Management',
    'target_fitness': 'Fitness Level',
    'target_autonomic': 'Autonomic Balance',
    'target_readiness': 'Readiness',
}

# ─────────────────────────────────────────────────────────────────────
# Validation Bounds (column_name → (min, max))
# ─────────────────────────────────────────────────────────────────────
VALIDATION_BOUNDS = {
    'age_years': (18, 100),
    'height_cm': (100, 250),
    'weight_kg': (30, 250),
    'body_fat_pct': (3, 60),
    'waist_circ_cm': (50, 180),
    'alcohol_units_per_week': (0, 50),
    'caffeine_mg_per_day': (0, 1000),
    'perceived_stress_score': (0, 40),
    'daily_water_intake_l': (0.5, 10),
    'workout_days_per_week': (0, 7),
    'weekly_workout_minutes': (0, 1200),
    'cardio_sessions_per_week': (0, 7),
    'strength_sessions_per_week': (0, 7),
    'sedentary_hours_per_day': (0, 24),
    'resting_hr_bpm': (30, 120),
    'hrv_rmssd_ms': (5, 300),
    'spo2_pct': (80, 100),
    'respiratory_rate_brpm': (8, 30),
    'skin_temp_c': (30, 40),
    'bp_systolic_mmHg': (80, 200),
    'bp_diastolic_mmHg': (40, 130),
    'sleep_duration_h': (2, 14),
    'deep_sleep_pct': (0, 50),
    'rem_sleep_pct': (0, 50),
    'light_sleep_pct': (0, 80),
    'steps_per_day': (0, 100000),
    'vo2max_ml_kg_min': (15, 80),
    'breathing_disturbances_per_hr': (0, 30),
    'sleep_consistency_score': (0, 100),
    'awakenings_per_night': (0, 15),
    'irregular_rhythm_events_7d': (0, 50),
    'irregular_rhythm_events_30d': (0, 200),
}

# ─────────────────────────────────────────────────────────────────────
# Domain → Feature Grouping (for scoring & display)
# ─────────────────────────────────────────────────────────────────────
DOMAIN_FEATURE_GROUPS = {
    'cardiovascular': [
        'resting_hr_bpm', 'hrv_rmssd_ms', 'avg_hr_bpm', 'exercise_hr_bpm',
        'max_hr_bpm', 'hr_reserve_bpm', 'map_mmHg', 'pulse_pressure_mmHg',
        'ecg_rhythm', 'irregular_rhythm_alert', 'irregular_rhythm_events_7d',
        'irregular_rhythm_events_30d', 'resting_hr_bpm_7d_avg', 'resting_hr_bpm_30d_avg',
        'resting_hr_trend_per_week',
    ],
    'metabolic': [
        'bmi', 'body_fat_pct', 'weight_kg', 'waist_circ_cm',
        'calories_burned_kcal', 'energy_per_kg',
    ],
    'recovery': [
        'hrv_rmssd_ms', 'autonomic_load_index', 'age_adjusted_hrv',
        'resting_hr_age_delta', 'hrv_rmssd_ms_7d_avg', 'hrv_rmssd_ms_30d_avg',
        'hrv_trend_per_week', 'training_load_7d_avg', 'training_load_30d_avg',
    ],
    'sleep': [
        'sleep_duration_h', 'deep_sleep_pct', 'rem_sleep_pct', 'light_sleep_pct',
        'restorative_sleep_pct', 'awakenings_per_night', 'sleep_consistency_score',
        'breathing_disturbances_per_hr', 'sleep_duration_h_7d_avg', 'sleep_duration_h_30d_avg',
        'sleep_trend_per_week',
    ],
    'stress': [
        'perceived_stress_score', 'autonomic_load_index', 'hrv_rmssd_ms',
        'resting_hr_bpm', 'caffeine_mg_per_day', 'sleep_consistency_score',
    ],
    'fitness': [
        'vo2max_ml_kg_min', 'vo2max_ml_kg_min_30d_avg', 'vo2max_trend_per_week',
        'active_minutes_per_day', 'steps_per_day', 'weekly_workout_minutes',
        'cardio_sessions_per_week',
    ],
    'autonomic': [
        'hrv_rmssd_ms', 'resting_hr_bpm', 'autonomic_load_index',
        'age_adjusted_hrv', 'respiratory_rate_brpm', 'skin_temp_c',
        'spo2_pct',
    ],
    'readiness': [
        'hrv_rmssd_ms', 'resting_hr_bpm', 'sleep_duration_h',
        'deep_sleep_pct', 'rem_sleep_pct', 'training_load_7d_avg',
        'autonomic_load_index', 'skin_temp_c', 'skin_temp_c_trend_per_week',
    ],
}

# ─────────────────────────────────────────────────────────────────────
# Feature Name → Human-Friendly Label (for SHAP explanations)
# ─────────────────────────────────────────────────────────────────────
FEATURE_LABELS = {
    'age_years': 'Age',
    'sex_phys': 'Biological Sex',
    'height_cm': 'Height',
    'weight_kg': 'Weight',
    'body_fat_pct': 'Body Fat %',
    'waist_circ_cm': 'Waist Circumference',
    'bmi': 'BMI',
    'resting_hr_bpm': 'Resting Heart Rate',
    'hrv_rmssd_ms': 'Heart Rate Variability (HRV)',
    'spo2_pct': 'Blood Oxygen (SpO₂)',
    'respiratory_rate_brpm': 'Breathing Rate',
    'skin_temp_c': 'Skin Temperature',
    'ecg_rhythm': 'ECG Rhythm',
    'irregular_rhythm_alert': 'Irregular Rhythm Alert',
    'bp_systolic_mmHg': 'Systolic Blood Pressure',
    'bp_diastolic_mmHg': 'Diastolic Blood Pressure',
    'steps_per_day': 'Daily Steps',
    'sedentary_hours_per_day': 'Sedentary Hours',
    'workout_days_per_week': 'Workout Days/Week',
    'weekly_workout_minutes': 'Weekly Workout Minutes',
    'strength_sessions_per_week': 'Strength Sessions/Week',
    'cardio_sessions_per_week': 'Cardio Sessions/Week',
    'sleep_duration_h': 'Sleep Duration',
    'deep_sleep_pct': 'Deep Sleep %',
    'rem_sleep_pct': 'REM Sleep %',
    'light_sleep_pct': 'Light Sleep %',
    'awakenings_per_night': 'Nighttime Awakenings',
    'sleep_consistency_score': 'Sleep Consistency',
    'breathing_disturbances_per_hr': 'Breathing Disturbances/hr',
    'vo2max_ml_kg_min': 'VO₂ Max',
    'perceived_stress_score': 'Perceived Stress',
    'smoking_status': 'Smoking Status',
    'alcohol_units_per_week': 'Alcohol Intake',
    'caffeine_mg_per_day': 'Caffeine Intake',
    'diet_type': 'Diet Type',
    'daily_water_intake_l': 'Daily Water Intake',
    'processed_food_frequency': 'Processed Food Frequency',
    'avg_hr_bpm': 'Average Heart Rate',
    'exercise_hr_bpm': 'Exercise Heart Rate',
    'max_hr_bpm': 'Max Heart Rate',
    'hr_reserve_bpm': 'Heart Rate Reserve',
    'map_mmHg': 'Mean Arterial Pressure',
    'pulse_pressure_mmHg': 'Pulse Pressure',
    'autonomic_load_index': 'Autonomic Stress Load',
    'age_adjusted_hrv': 'Age-Adjusted HRV',
    'resting_hr_age_delta': 'Resting HR vs Age Norm',
    'restorative_sleep_pct': 'Restorative Sleep %',
    'active_minutes_per_day': 'Active Minutes/Day',
    'training_load_7d_avg': '7-Day Training Load',
    'training_load_30d_avg': '30-Day Training Load',
    'zone_low_min_per_week': 'Low Intensity Zone Minutes',
    'zone_moderate_min_per_week': 'Moderate Intensity Zone Minutes',
    'zone_high_min_per_week': 'High Intensity Zone Minutes',
    'resting_hr_bpm_7d_avg': '7-Day Avg Resting HR',
    'resting_hr_bpm_30d_avg': '30-Day Avg Resting HR',
    'hrv_rmssd_ms_7d_avg': '7-Day Avg HRV',
    'hrv_rmssd_ms_30d_avg': '30-Day Avg HRV',
    'sleep_duration_h_7d_avg': '7-Day Avg Sleep',
    'sleep_duration_h_30d_avg': '30-Day Avg Sleep',
    'steps_per_day_7d_avg': '7-Day Avg Steps',
    'steps_per_day_30d_avg': '30-Day Avg Steps',
    'vo2max_ml_kg_min_30d_avg': '30-Day Avg VO₂ Max',
    'skin_temp_c_7d_avg': '7-Day Avg Skin Temp',
    'skin_temp_c_30d_avg': '30-Day Avg Skin Temp',
    'resting_hr_bpm_90d_ago': 'Resting HR 90 Days Ago',
    'hrv_rmssd_ms_90d_ago': 'HRV 90 Days Ago',
    'sleep_duration_h_90d_ago': 'Sleep 90 Days Ago',
    'steps_per_day_90d_ago': 'Steps 90 Days Ago',
    'vo2max_ml_kg_min_90d_ago': 'VO₂ Max 90 Days Ago',
    'skin_temp_c_90d_ago': 'Skin Temp 90 Days Ago',
    'resting_hr_trend_per_week': 'Resting HR Trend',
    'hrv_trend_per_week': 'HRV Trend',
    'sleep_trend_per_week': 'Sleep Trend',
    'steps_trend_per_week': 'Steps Trend',
    'vo2max_trend_per_week': 'VO₂ Max Trend',
    'respiratory_rate_7d_avg': '7-Day Avg Breathing Rate',
    'respiratory_rate_30d_avg': '30-Day Avg Breathing Rate',
    'respiratory_rate_90d_ago': 'Breathing Rate 90 Days Ago',
    'respiratory_rate_trend_per_week': 'Breathing Rate Trend',
    'skin_temp_c_trend_per_week': 'Skin Temp Trend',
    'irregular_rhythm_events_7d': 'Irregular Rhythm Events (7d)',
    'irregular_rhythm_events_30d': 'Irregular Rhythm Events (30d)',
}

# ─────────────────────────────────────────────────────────────────────
# ACSM Age-Based Resting HR Norms (for resting_hr_age_delta)
# ─────────────────────────────────────────────────────────────────────
ACSM_RHR_NORMS = {
    (18, 25): 72, (26, 35): 72, (36, 45): 73,
    (46, 55): 74, (56, 65): 74, (66, 100): 73,
}

# ─────────────────────────────────────────────────────────────────────
# Score Status Thresholds
# ─────────────────────────────────────────────────────────────────────
SCORE_STATUS = {
    (0, 30): {'label': 'Poor', 'color': 'red', 'emoji': '🔴'},
    (30, 50): {'label': 'Below Average', 'color': 'orange', 'emoji': '🟠'},
    (50, 70): {'label': 'Average', 'color': 'amber', 'emoji': '🟡'},
    (70, 85): {'label': 'Good', 'color': 'green', 'emoji': '🟢'},
    (85, 100): {'label': 'Excellent', 'color': 'emerald', 'emoji': '💚'},
}

# ─────────────────────────────────────────────────────────────────────
# Cluster Archetype Definitions (placeholder — updated after K-Means)
# ─────────────────────────────────────────────────────────────────────
ARCHETYPE_LABELS = {
    0: {'name': 'Balanced Performer', 'description': 'Well-rounded health profile with balanced metrics across all domains.'},
    1: {'name': 'Fit but Stressed', 'description': 'High fitness and activity levels but elevated stress markers and suboptimal recovery.'},
    2: {'name': 'Sleep-Deprived Achiever', 'description': 'Active lifestyle with good fitness but consistently poor sleep quality.'},
    3: {'name': 'Recovery-Focused', 'description': 'Good sleep and recovery metrics but lower activity and fitness levels.'},
    4: {'name': 'At-Risk Sedentary', 'description': 'Low activity, elevated resting HR, poor sleep — multiple improvement areas.'},
}

# ─────────────────────────────────────────────────────────────────────
# Dataset Path
# ─────────────────────────────────────────────────────────────────────
DATASET_PATH = 'data/biolens_dataset_fixed.csv'
MODEL_DIR = 'models/'
