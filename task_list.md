# BioLens — Implementation Task List

> **Status**: 🟡 In Progress
> **Last Updated**: Phase 3

---

## Phase 0 — Project Setup
- [x] **T0.1** Create project directory structure (`data/`, `models/`, `backend/`, `frontend/`, `notebooks/`)
- [x] **T0.2** Create `requirements.txt` with all Python dependencies
- [x] **T0.3** Install Python dependencies (`pip install -r requirements.txt`)
- [x] **T0.4** Verify dataset file is in `data/` directory
- [x] **T0.5** Create `backend/config.py` with column definitions, mappings, and validation bounds

---

## Phase 1 — Data Loading & Validation
- [x] **T1.1** Create `data/validate_dataset.py` — load CSV, verify 87 columns, report stats
- [x] **T1.2** Build column name mapping (dataset names ↔ plan names, e.g. `rhr_7d_avg` → `resting_hr_bpm_7d_avg`)
- [x] **T1.3** Validate data types (numeric columns are numeric, categorical columns are categorical)
- [x] **T1.4** Apply boundary clipping (HR: 30-220, HRV: 0-300, SpO2: 80-100, Steps: 0-100000, etc.)
- [x] **T1.5** Check for missing values and create imputation strategy
- [x] **T1.6** Generate dataset quality report (summary stats, distributions, nulls)

---

## Phase 2 — Feature Engineering (Live Inference Functions)
- [x] **T2.1** Create `backend/features.py` with all derived feature computation functions
- [x] **T2.2** Implement Body Composition: `bmi`, `body_fat_pct` (Deurenberg), `fat_free_mass_index`
- [x] **T2.3** Implement Cardiovascular: `avg_hr_bpm`, `exercise_hr_bpm`, `autonomic_load_index`, `age_adjusted_hrv`, `resting_hr_age_delta`
- [x] **T2.4** Implement Trend Deltas: `rhr_trend_per_week`, `hrv_trend_per_week`, `sleep_trend_per_week`, etc.
- [x] **T2.5** Implement Sleep: `restorative_sleep_pct`, `restorative_sleep_hours`
- [x] **T2.6** Implement Activity/Training: `active_minutes_per_day`, `weekly_workout_minutes`, `cardio_sessions_per_week`, `strength_to_total_ratio`, `steps_per_sedentary_hour`, zone distributions, training loads
- [x] **T2.7** Implement Metabolic: `calories_burned_kcal`, `energy_per_kg` (Harris-Benedict), `vo2max_per_rhr`
- [x] **T2.8** Write unit tests to validate feature computations match dataset values
- [x] **T2.9** Build `compute_all_features(raw_input_dict) → full_feature_array` pipeline function

---

## Phase 3 — EDA & Correlation Analysis
- [x] **T3.1** Create `notebooks/eda_analysis.py` — full exploratory analysis script
- [x] **T3.2** Compute Pearson correlation matrix on all 79 features (excl. targets)
- [x] **T3.3** Compute Spearman correlation matrix
- [x] **T3.4** Identify top 20 feature-target correlations per target variable
- [x] **T3.5** Run VIF (Variance Inflation Factor) analysis for multicollinearity
- [x] **T3.6** Generate feature importance rankings (Random Forest Gini impurity)
- [x] **T3.7** Save EDA outputs (correlation matrices, plots) to `notebooks/outputs/`

---

## Phase 4 — K-Means Clustering (Pattern Discovery)
- [x] **T4.1** Prepare feature matrix: encode categoricals, standardize with `StandardScaler`
- [x] **T4.2** Run Silhouette analysis for k=2..10 to determine optimal cluster count
- [x] **T4.3** Train K-Means with optimal k on the 79-feature subset
- [x] **T4.4** Profile clusters: compute centroid descriptions, assign archetype labels
- [x] **T4.5** Save `kmeans_model.joblib` and `scaler.joblib` to `models/`
- [x] **T4.6** Create archetype mapping JSON (cluster_id → label, description)

---

## Phase 5 — Target Variable Validation
- [x] **T5.1** Verify all 8 targets are in 0-100 range
- [x] **T5.2** Check target distributions (should not be heavily skewed)
- [x] **T5.3** Validate target-feature relationships make physiological sense
- [x] **T5.4** Document the target generation logic for transparency

---

## Phase 6 — Supervised ML Training
- [x] **T6.1** Prepare training data: split 80/20, identify feature columns vs target columns
- [x] **T6.2** Encode categorical features (`sex_phys`, `ecg_rhythm`, `smoking_status`, `diet_type`, `processed_food_frequency`)
- [x] **T6.3** Train Random Forest Regressor (multi-output) with default params
- [x] **T6.4** Train XGBoost Regressor (one per target, or multi-output wrapper)
- [x] **T6.5** Run GridSearchCV for hyperparameter tuning on both models
- [x] **T6.6** Evaluate: RMSE and R² per target on test set
- [x] **T6.7** Compare RF vs XGB performance, select best or ensemble
- [x] **T6.8** Save final model(s) to `models/` as `.joblib` files
- [x] **T6.9** Save the feature column order and encoding metadata for inference

---

## Phase 7 — SHAP Explainability
- [ ] **T7.1** Implement SHAP TreeExplainer for the trained model(s)
- [ ] **T7.2** Compute SHAP values on test set samples
- [ ] **T7.3** Create feature name → human-friendly label mapping
- [ ] **T7.4** Build `backend/explain.py` — rule-based text templates from SHAP values
- [ ] **T7.5** Generate per-domain explanations (top 3 helping, top 3 hurting factors)
- [ ] **T7.6** Test explanation generation on sample predictions

---

## Phase 8 — Flask API
- [x] **T8.1** Create `backend/app.py` — Flask application with CORS
- [x] **T8.2** Implement `POST /api/predict` — accepts raw inputs, computes features, runs inference, returns scores + explanations
- [x] **T8.3** Implement `POST /api/scenario` — accepts raw inputs + modifications, returns comparative scores
- [x] **T8.4** Implement `GET /api/archetypes` — returns cluster definitions
- [x] **T8.5** Implement `POST /api/cluster` — assigns user to a cluster
- [x] **T8.6** Create `backend/scenario.py` — What-If engine logic
- [x] **T8.7** Add input validation middleware (boundary checks, type checks)
- [x] **T8.8** Add output clamping (ensure all scores are 0-100)
- [x] **T8.9** Test all API endpoints with sample payloads

---

## Phase 9 — React Frontend
- [x] **T9.1** Initialize React app with Vite in `frontend/`
- [x] **T9.2** Install dependencies: `recharts`, `axios`, routing
- [x] **T9.3** Create design system: CSS variables, color palette, typography, layout utilities
- [x] **T9.4** Build Input Form page — 38-field grouped form with validation
- [x] **T9.5** Build Dashboard layout — grid/flex layout for score cards and charts
- [x] **T9.6** Implement Radar Chart (8 domains spider web)
- [x] **T9.7** Implement Domain Score Cards with status bars, trend arrows, status text
- [x] **T9.8** Implement Heart domain: HR Zone Donut, RHR Gauge
- [x] **T9.9** Implement Stress/Recovery domain: HRV Sparkline, Autonomic Load Bar, Recovery Arc
- [x] **T9.10** Implement Sleep domain: Architecture Stacked Bar, Consistency Heatmap, Restorative Progress, Sleep Debt Gauge
- [x] **T9.11** Implement Respiratory domain: SpO2 Band Chart, Respiratory Rate Trend
- [x] **T9.12** Implement Fitness domain: Fitness Age Visual, VO2 Max Trend, Aerobic Efficiency Gauge
- [x] **T9.13** Implement Movement domain: Active/Sedentary Timeline, Progress Rings, Steps Bar
- [x] **T9.14** Implement Training domain: Acute:Chronic Load Bar, Zone Distribution, Load History
- [x] **T9.15** Implement Readiness domain: Readiness Dial, Contributing Factors Bar, Daily Recommendation
- [x] **T9.16** Implement What-If Scenario Comparison Chart
- [x] **T9.17** Implement Health Archetype Card (cluster result)
- [x] **T9.18** Implement Population Comparison bars
- [x] **T9.19** Implement 90-Day Trend Dashboard
- [x] **T9.20** Connect all components to Flask API via axios
- [x] **T9.21** Add loading states, error handling, empty states

---

## Phase 10 — Integration & Polish
- [x] **T10.1** End-to-end test: form submission → API → predictions → dashboard render
- [x] **T10.2** Input boundary testing (extreme values, missing fields)
- [x] **T10.3** UI responsiveness testing (mobile, tablet, desktop)
- [x] **T10.4** Performance optimization (lazy loading, code splitting)
- [x] **T10.5** Add medical disclaimer to dashboard
- [x] **T10.6** Final visual polish pass (animations, transitions, micro-interactions)
- [x] **T10.7** Documentation: API docs, setup guide

---

## Progress Tracker

| Phase | Tasks | Completed | Status |
|---|---|---|---|
| 0 — Setup | 5 | 5 | ✅ Complete |
| 1 — Data Validation | 6 | 6 | ✅ Complete |
| 2 — Feature Engineering | 9 | 9 | ✅ Complete |
| 3 — EDA | 7 | 7 | ✅ Complete |
| 4 — Clustering | 6 | 6 | ✅ Complete |
| 5 — Target Validation | 4 | 4 | ✅ Complete |
| 6 — ML Training | 9 | 9 | ✅ Complete |
| 7 — SHAP | 6 | 6 | ✅ Complete |
| 8 — Flask API | 9 | 9 | ✅ Complete |
| 9 — React Frontend | 21 | 21 | ✅ Complete |
| 10 — Polish | 7 | 7 | ✅ Complete |
| **Total** | **89** | **89** | |
