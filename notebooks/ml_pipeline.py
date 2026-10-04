"""
BioLens ML Training & Clustering Pipeline
Phase 4: K-Means Clustering (Health Archetypes)
Phase 5/6: Supervised Target Validation & RF/XGBoost Training
"""

import pandas as pd
import numpy as np
import os
import sys
import joblib
import json

from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import root_mean_squared_error, r2_score

# Add parent dir to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.config import (
    CATEGORICAL_COLUMNS, TARGET_COLUMNS, DATASET_PATH, MODEL_DIR
)


def prepare_data(df):
    """Encode categoricals and fill missing values."""
    df_encoded = df.copy()
    
    # Categorical mapping
    cat_mapping = {}
    for col in CATEGORICAL_COLUMNS:
        if col in df_encoded.columns:
            df_encoded[col] = df_encoded[col].astype('category')
            cat_mapping[col] = dict(enumerate(df_encoded[col].cat.categories))
            df_encoded[col] = df_encoded[col].cat.codes

    # Fill NA
    numeric_cols = df_encoded.select_dtypes(include=[np.number]).columns
    medians = df_encoded[numeric_cols].median()
    df_encoded[numeric_cols] = df_encoded[numeric_cols].fillna(medians)
    
    return df_encoded, cat_mapping, medians.to_dict()


def train_kmeans(X, n_clusters=5):
    """Train K-Means clustering for Health Archetypes."""
    print(f"\nTraining K-Means (k={n_clusters})...")
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init='auto')
    cluster_labels = kmeans.fit_predict(X_scaled)
    
    # Save models
    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(scaler, os.path.join(MODEL_DIR, 'scaler.joblib'))
    joblib.dump(kmeans, os.path.join(MODEL_DIR, 'kmeans_model.joblib'))
    
    print(f"✅ Saved scaler and K-Means model to {MODEL_DIR}")
    return kmeans, scaler, cluster_labels


def train_supervised_models(X, df_encoded):
    """Train RF and XGB models for each target."""
    print(f"\nTraining Supervised Models (RF and XGBoost)...")
    
    results = {}
    
    rf_models = {}
    xgb_models = {}
    
    for target in TARGET_COLUMNS:
        if target not in df_encoded.columns:
            continue
            
        print(f"  Training for {target}...")
        y = df_encoded[target]
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Random Forest
        rf = RandomForestRegressor(n_estimators=100, max_depth=15, random_state=42, n_jobs=-1)
        rf.fit(X_train, y_train)
        rf_preds = rf.predict(X_test)
        rf_rmse = root_mean_squared_error(y_test, rf_preds)
        rf_r2 = r2_score(y_test, rf_preds)
        
        # XGBoost
        xgb = XGBRegressor(n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42, n_jobs=-1)
        xgb.fit(X_train, y_train)
        xgb_preds = xgb.predict(X_test)
        xgb_rmse = root_mean_squared_error(y_test, xgb_preds)
        xgb_r2 = r2_score(y_test, xgb_preds)
        
        results[target] = {
            'RF': {'RMSE': float(rf_rmse), 'R2': float(rf_r2)},
            'XGB': {'RMSE': float(xgb_rmse), 'R2': float(xgb_r2)}
        }
        
        # Save models (we'll save XGB as primary since it usually performs better, but RF is needed for SHAP TreeExplainer easily)
        rf_models[target] = rf
        xgb_models[target] = xgb

    # Save to disk
    joblib.dump(rf_models, os.path.join(MODEL_DIR, 'rf_models.joblib'))
    joblib.dump(xgb_models, os.path.join(MODEL_DIR, 'xgb_models.joblib'))
    
    print(f"\n✅ Supervised Models trained and saved.")
    
    # Print summary
    print("\nModel Performance Summary:")
    for target, metrics in results.items():
        print(f"  {target}:")
        print(f"    RF  - RMSE: {metrics['RF']['RMSE']:.2f}, R2: {metrics['RF']['R2']:.3f}")
        print(f"    XGB - RMSE: {metrics['XGB']['RMSE']:.2f}, R2: {metrics['XGB']['R2']:.3f}")

    return results


def run_pipeline():
    print("╔══════════════════════════════════════════════════════════╗")
    print("║          BioLens ML Training Pipeline (Phases 4-6)       ║")
    print("╚══════════════════════════════════════════════════════════╝")
    
    df = pd.read_csv(DATASET_PATH)
    df_encoded, cat_mapping, medians = prepare_data(df)
    
    feature_cols = [c for c in df_encoded.columns if c not in TARGET_COLUMNS]
    X = df_encoded[feature_cols]
    
    # Save feature metadata for inference
    metadata = {
        'features': feature_cols,
        'categorical_mapping': cat_mapping,
        'medians': medians
    }
    with open(os.path.join(MODEL_DIR, 'model_metadata.json'), 'w') as f:
        json.dump(metadata, f, indent=2)
    
    # Train Clustering
    train_kmeans(X)
    
    # Train Supervised Models
    train_supervised_models(X, df_encoded)
    
    print("\n✅ PIPELINE COMPLETE")

if __name__ == '__main__':
    run_pipeline()
