"""
BioLens Flask API
Phase 8: Main backend service for predictions, scenarios, and archetypes.
"""

import os
import json
import joblib
import pandas as pd
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import shap

from backend.config import MODEL_DIR, TARGET_COLUMNS, ARCHETYPE_LABELS
from backend.features import compute_all_features
from backend.scenario import apply_scenario
from backend.explain import generate_insights
from backend.auth import init_db, register_user, login_user, verify_token

app = Flask(__name__)
CORS(app)

# Global model cache
MODELS = {}

def load_models():
    """Load models, scalers, and metadata into memory."""
    global MODELS
    
    # Load RF Models (used for SHAP Explainer)
    rf_path = os.path.join(MODEL_DIR, 'rf_models.joblib')
    # Load XGB Models (used for primary inference)
    xgb_path = os.path.join(MODEL_DIR, 'xgb_models.joblib')
    # Clustering
    kmeans_path = os.path.join(MODEL_DIR, 'kmeans_model.joblib')
    scaler_path = os.path.join(MODEL_DIR, 'scaler.joblib')
    # Metadata
    meta_path = os.path.join(MODEL_DIR, 'model_metadata.json')
    
    if os.path.exists(xgb_path):
        MODELS['xgb'] = joblib.load(xgb_path)
    if os.path.exists(rf_path):
        MODELS['rf'] = joblib.load(rf_path)
        # Precompute SHAP explainers
        MODELS['explainers'] = {t: shap.TreeExplainer(m) for t, m in MODELS['rf'].items()}
        
    if os.path.exists(kmeans_path):
        MODELS['kmeans'] = joblib.load(kmeans_path)
    if os.path.exists(scaler_path):
        MODELS['scaler'] = joblib.load(scaler_path)
        
    if os.path.exists(meta_path):
        with open(meta_path, 'r') as f:
            MODELS['meta'] = json.load(f)
            
    print("✅ Models loaded successfully")

def prepare_inference_vector(computed_features):
    """Format the dict into the exact pandas DataFrame shape the model expects."""
    meta = MODELS['meta']
    df = pd.DataFrame([computed_features])
    
    # Ensure all required features exist
    for col in meta['features']:
        if col not in df.columns:
            # Fallback mappings for named disparities between dataset and computed features
            if col == 'vo2max_ml_kg_min': df[col] = df.get('vo2max_30d_avg', meta['medians'].get(col, 0))
            elif col == 'rhr_trend_per_week': df[col] = df.get('resting_hr_trend_per_week', meta['medians'].get(col, 0))
            elif col == 'hrv_trend_per_week': df[col] = df.get('hrv_trend_per_week', meta['medians'].get(col, 0))
            elif col == 'sleep_trend_per_week': df[col] = df.get('sleep_trend_per_week', meta['medians'].get(col, 0))
            elif col == 'steps_trend_per_week': df[col] = df.get('steps_trend_per_week', meta['medians'].get(col, 0))
            elif col == 'vo2max_trend_per_week': df[col] = df.get('vo2max_trend_per_week', meta['medians'].get(col, 0))
            elif col == 'resp_7d_avg': df[col] = df.get('respiratory_rate_7d_avg', meta['medians'].get(col, 0))
            elif col == 'resp_30d_avg': df[col] = df.get('respiratory_rate_30d_avg', meta['medians'].get(col, 0))
            elif col == 'resp_90d_ago': df[col] = df.get('respiratory_rate_90d_ago', meta['medians'].get(col, 0))
            elif col == 'resp_trend_per_week': df[col] = df.get('respiratory_rate_trend_per_week', meta['medians'].get(col, 0))
            elif col == 'skin_temp_trend_per_week': df[col] = df.get('skin_temp_c_trend_per_week', meta['medians'].get(col, 0))
            else:
                df[col] = meta['medians'].get(col, 0)
                
    # Filter to exact feature list
    df = df[meta['features']]
    
    # Apply categorical encoding matching training
    for col, mapping in meta['categorical_mapping'].items():
        if col in df.columns:
            # Reverse lookup: find integer code for string value
            val = df.iloc[0][col]
            for code, name in mapping.items():
                if name == val:
                    df[col] = int(code)
                    break
            else:
                # Default to 0 if unknown
                df[col] = 0
                
    # Fill NAs with training medians
    for col in df.columns:
        if pd.isna(df[col].iloc[0]):
            df[col] = meta['medians'].get(col, 0)
            
    # Ensure numeric
    df = df.astype(float)
    return df


@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        raw_inputs = request.json
        if not raw_inputs:
            return jsonify({'error': 'No input data provided'}), 400
            
        # 1. Compute derived features
        computed_features = compute_all_features(raw_inputs)
        
        # 2. Format for ML
        X = prepare_inference_vector(computed_features)
        
        # 3. Predict Scores (using XGBoost for accuracy)
        scores = {}
        for target in TARGET_COLUMNS:
            pred = float(MODELS['xgb'][target].predict(X)[0])
            # Clamp to 0-100
            scores[target] = max(0.0, min(100.0, pred))
            
        # 4. Generate SHAP values (using RF)
        shap_vals = {}
        for target in TARGET_COLUMNS:
            # TreeExplainer expects DataFrame
            shap_vals[target] = MODELS['explainers'][target].shap_values(X)
            
        # 5. Generate Text Insights
        insights = generate_insights(
            shap_vals, 
            MODELS['meta']['features'], 
            computed_features, 
            scores
        )
        
        # 6. Predict Archetype
        X_scaled = MODELS['scaler'].transform(X)
        cluster_id = int(MODELS['kmeans'].predict(X_scaled)[0])
        archetype = ARCHETYPE_LABELS.get(cluster_id, {"name": "Unknown", "description": ""})
        
        return jsonify({
            'status': 'success',
            'scores': scores,
            'insights': insights,
            'archetype': archetype,
            'computed_features': computed_features
        })
        
    except Exception as e:
        import traceback
        return jsonify({'error': str(e), 'trace': traceback.format_exc()}), 500


@app.route('/api/scenario', methods=['POST'])
def scenario():
    try:
        data = request.json
        base_inputs = data.get('base_inputs', {})
        modifications = data.get('modifications', {})
        
        # Original
        base_features = compute_all_features(base_inputs)
        X_base = prepare_inference_vector(base_features)
        
        # Modified
        scenario_features = apply_scenario(base_inputs, modifications)
        X_scenario = prepare_inference_vector(scenario_features)
        
        # Predict both
        base_scores = {}
        scenario_scores = {}
        deltas = {}
        
        for target in TARGET_COLUMNS:
            b_pred = float(MODELS['xgb'][target].predict(X_base)[0])
            s_pred = float(MODELS['xgb'][target].predict(X_scenario)[0])
            
            base_scores[target] = max(0.0, min(100.0, b_pred))
            scenario_scores[target] = max(0.0, min(100.0, s_pred))
            deltas[target] = round(scenario_scores[target] - base_scores[target], 2)
            
        return jsonify({
            'status': 'success',
            'base_scores': base_scores,
            'scenario_scores': scenario_scores,
            'deltas': deltas
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "models_loaded": bool(MODELS)})

# ──────────────── AUTH ROUTES ────────────────

@app.route('/api/auth/register', methods=['POST'])
def register():
    body = request.get_json() or {}
    name = body.get('name', '').strip()
    email = body.get('email', '').strip().lower()
    password = body.get('password', '')

    if not name or not email or not password:
        return jsonify({'error': 'Name, email, and password are required.'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters.'}), 400

    success, result = register_user(name, email, password)
    if not success:
        return jsonify({'error': result}), 409
    return jsonify({'token': result, 'message': 'Account created successfully!'}), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    body = request.get_json() or {}
    email = body.get('email', '').strip().lower()
    password = body.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required.'}), 400

    success, result = login_user(email, password)
    if not success:
        return jsonify({'error': result}), 401
    return jsonify({'token': result}), 200


@app.route('/api/auth/me', methods=['GET'])
def me():
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Missing or invalid token.'}), 401
    try:
        payload = verify_token(auth_header.split(' ')[1])
        return jsonify({'id': payload['sub'], 'name': payload['name'], 'email': payload['email']})
    except Exception:
        return jsonify({'error': 'Token expired or invalid.'}), 401


if __name__ == '__main__':
    load_models()
    init_db()
    app.run(host='0.0.0.0', port=5001, debug=True)
