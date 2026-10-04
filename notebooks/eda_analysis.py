"""
BioLens EDA & Correlation Analysis
Phase 3: Pearson/Spearman correlations, VIF analysis, feature importance,
         and top feature-target correlations.
"""

import pandas as pd
import numpy as np
import os
import sys
import json
import warnings
warnings.filterwarnings('ignore')

# Add parent dir to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.config import (
    CATEGORICAL_COLUMNS, TARGET_COLUMNS, COLUMN_RENAME_MAP,
    DATASET_PATH, FEATURE_LABELS
)


def load_and_prepare(path=None):
    """Load dataset and prepare for analysis."""
    if path is None:
        path = DATASET_PATH
    df = pd.read_csv(path)

    # Encode categoricals numerically for correlation analysis
    df_encoded = df.copy()
    for col in CATEGORICAL_COLUMNS:
        if col in df_encoded.columns:
            df_encoded[col] = df_encoded[col].astype('category').cat.codes

    # Fill missing values with median for analysis
    numeric_cols = df_encoded.select_dtypes(include=[np.number]).columns
    df_encoded[numeric_cols] = df_encoded[numeric_cols].fillna(df_encoded[numeric_cols].median())

    return df, df_encoded


def pearson_correlation_analysis(df_encoded, output_dir):
    """Compute and save Pearson correlation matrix."""
    print("\n" + "="*60)
    print("PEARSON CORRELATION ANALYSIS")
    print("="*60)

    # Feature columns only (exclude targets)
    feature_cols = [c for c in df_encoded.columns if c not in TARGET_COLUMNS]
    corr_matrix = df_encoded[feature_cols].corr(method='pearson')

    # Save full matrix
    corr_matrix.to_csv(os.path.join(output_dir, 'pearson_correlation_matrix.csv'))

    # Find top absolute correlations (excluding self-correlations)
    upper_tri = corr_matrix.where(np.triu(np.ones(corr_matrix.shape), k=1).astype(bool))
    top_corrs = upper_tri.stack().reset_index()
    top_corrs.columns = ['Feature_1', 'Feature_2', 'Correlation']
    top_corrs['Abs_Correlation'] = top_corrs['Correlation'].abs()
    top_corrs = top_corrs.sort_values('Abs_Correlation', ascending=False).head(30)

    print("\nTop 30 Feature-Feature Correlations (Pearson):")
    print("-" * 70)
    for _, row in top_corrs.iterrows():
        direction = "+" if row['Correlation'] > 0 else "-"
        print(f"  {direction} {row['Abs_Correlation']:.3f}  {row['Feature_1']} ↔ {row['Feature_2']}")

    top_corrs.to_csv(os.path.join(output_dir, 'top_pearson_correlations.csv'), index=False)
    return corr_matrix


def spearman_correlation_analysis(df_encoded, output_dir):
    """Compute and save Spearman correlation matrix."""
    print("\n" + "="*60)
    print("SPEARMAN CORRELATION ANALYSIS")
    print("="*60)

    feature_cols = [c for c in df_encoded.columns if c not in TARGET_COLUMNS]
    corr_matrix = df_encoded[feature_cols].corr(method='spearman')

    corr_matrix.to_csv(os.path.join(output_dir, 'spearman_correlation_matrix.csv'))

    upper_tri = corr_matrix.where(np.triu(np.ones(corr_matrix.shape), k=1).astype(bool))
    top_corrs = upper_tri.stack().reset_index()
    top_corrs.columns = ['Feature_1', 'Feature_2', 'Correlation']
    top_corrs['Abs_Correlation'] = top_corrs['Correlation'].abs()
    top_corrs = top_corrs.sort_values('Abs_Correlation', ascending=False).head(30)

    print("\nTop 30 Feature-Feature Correlations (Spearman):")
    print("-" * 70)
    for _, row in top_corrs.iterrows():
        direction = "+" if row['Correlation'] > 0 else "-"
        print(f"  {direction} {row['Abs_Correlation']:.3f}  {row['Feature_1']} ↔ {row['Feature_2']}")

    top_corrs.to_csv(os.path.join(output_dir, 'top_spearman_correlations.csv'), index=False)
    return corr_matrix


def feature_target_correlations(df_encoded, output_dir):
    """Identify top 20 feature-target correlations per target."""
    print("\n" + "="*60)
    print("FEATURE-TARGET CORRELATIONS")
    print("="*60)

    feature_cols = [c for c in df_encoded.columns if c not in TARGET_COLUMNS]
    all_target_corrs = {}

    for target in TARGET_COLUMNS:
        if target not in df_encoded.columns:
            continue

        corrs = df_encoded[feature_cols].corrwith(df_encoded[target]).abs().sort_values(ascending=False)
        top_20 = corrs.head(20)
        all_target_corrs[target] = top_20.to_dict()

        target_label = target.replace('target_', '').upper()
        print(f"\n  Top 10 features for {target_label}:")
        for feat, corr_val in list(top_20.items())[:10]:
            label = FEATURE_LABELS.get(feat, feat)
            print(f"    {corr_val:.3f}  {label} ({feat})")

    # Save to CSV
    corr_df = pd.DataFrame(all_target_corrs)
    corr_df.to_csv(os.path.join(output_dir, 'feature_target_correlations.csv'))

    return all_target_corrs


def vif_analysis(df_encoded, output_dir):
    """Variance Inflation Factor analysis for multicollinearity detection."""
    print("\n" + "="*60)
    print("VIF ANALYSIS (Multicollinearity)")
    print("="*60)

    from statsmodels.stats.outliers_influence import variance_inflation_factor

    feature_cols = [c for c in df_encoded.columns if c not in TARGET_COLUMNS]
    X = df_encoded[feature_cols].select_dtypes(include=[np.number]).dropna(axis=1)

    # Standardize to avoid numerical issues
    X_std = (X - X.mean()) / X.std()
    X_std = X_std.replace([np.inf, -np.inf], np.nan).dropna(axis=1)

    # Compute VIF (can be slow for many features, so limit if needed)
    if X_std.shape[1] > 50:
        # Select subset of most important features
        print(f"  Computing VIF for top 50 features by variance...")
        top_cols = X_std.var().sort_values(ascending=False).head(50).index.tolist()
        X_std = X_std[top_cols]

    vif_data = []
    for i in range(X_std.shape[1]):
        try:
            vif_val = variance_inflation_factor(X_std.values, i)
            vif_data.append({'Feature': X_std.columns[i], 'VIF': round(vif_val, 2)})
        except Exception:
            vif_data.append({'Feature': X_std.columns[i], 'VIF': np.nan})

    vif_df = pd.DataFrame(vif_data).sort_values('VIF', ascending=False)
    vif_df.to_csv(os.path.join(output_dir, 'vif_analysis.csv'), index=False)

    # Report high VIF features (> 10 indicates severe multicollinearity)
    high_vif = vif_df[vif_df['VIF'] > 10]
    print(f"\n  Features with VIF > 10 (severe multicollinearity): {len(high_vif)}")
    for _, row in high_vif.head(15).iterrows():
        print(f"    VIF={row['VIF']:.1f}  {row['Feature']}")

    moderate_vif = vif_df[(vif_df['VIF'] > 5) & (vif_df['VIF'] <= 10)]
    print(f"\n  Features with VIF 5-10 (moderate multicollinearity): {len(moderate_vif)}")

    low_vif = vif_df[vif_df['VIF'] <= 5]
    print(f"  Features with VIF ≤ 5 (acceptable): {len(low_vif)}")

    return vif_df


def feature_importance_analysis(df_encoded, output_dir):
    """Random Forest feature importance (Gini impurity) for each target."""
    print("\n" + "="*60)
    print("FEATURE IMPORTANCE (Random Forest Gini)")
    print("="*60)

    from sklearn.ensemble import RandomForestRegressor

    feature_cols = [c for c in df_encoded.columns if c not in TARGET_COLUMNS]
    X = df_encoded[feature_cols].select_dtypes(include=[np.number]).dropna(axis=1)

    all_importances = {}

    for target in TARGET_COLUMNS:
        if target not in df_encoded.columns:
            continue

        y = df_encoded[target].dropna()
        X_aligned = X.loc[y.index]

        rf = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)
        rf.fit(X_aligned, y)

        importances = pd.Series(rf.feature_importances_, index=X_aligned.columns)
        importances = importances.sort_values(ascending=False)
        all_importances[target] = importances.to_dict()

        target_label = target.replace('target_', '').upper()
        print(f"\n  Top 10 features for {target_label}:")
        for feat, imp in list(importances.items())[:10]:
            label = FEATURE_LABELS.get(feat, feat)
            bar = "█" * int(imp * 100)
            print(f"    {imp:.4f}  {bar}  {label}")

    # Save
    imp_df = pd.DataFrame(all_importances)
    imp_df.to_csv(os.path.join(output_dir, 'feature_importance_rf.csv'))

    return all_importances


def generate_summary_report(output_dir):
    """Generate a text summary of the EDA findings."""
    print("\n" + "="*60)
    print("EDA SUMMARY")
    print("="*60)

    files = os.listdir(output_dir)
    print(f"\n  Output files generated in {output_dir}/:")
    for f in sorted(files):
        size = os.path.getsize(os.path.join(output_dir, f))
        print(f"    📄 {f} ({size:,} bytes)")


def run_full_eda(path=None):
    """Execute the full EDA pipeline."""
    print("╔══════════════════════════════════════════════════════════╗")
    print("║       BioLens EDA & Correlation Analysis Pipeline       ║")
    print("╚══════════════════════════════════════════════════════════╝")

    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'outputs')
    os.makedirs(output_dir, exist_ok=True)

    # Load data
    df, df_encoded = load_and_prepare(path)
    print(f"\nDataset: {len(df):,} rows × {len(df.columns)} columns")
    print(f"Numeric features for analysis: {df_encoded.select_dtypes(include=[np.number]).shape[1]}")

    # Run analyses
    pearson_correlation_analysis(df_encoded, output_dir)
    spearman_correlation_analysis(df_encoded, output_dir)
    feature_target_correlations(df_encoded, output_dir)
    vif_analysis(df_encoded, output_dir)
    feature_importance_analysis(df_encoded, output_dir)
    generate_summary_report(output_dir)

    print(f"\n{'='*60}")
    print("✅ EDA COMPLETE — All outputs saved to notebooks/outputs/")
    print(f"{'='*60}")


if __name__ == '__main__':
    run_full_eda()
