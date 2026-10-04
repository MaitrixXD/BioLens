"""
BioLens Data Validation Script
Phase 1: Loads CSV, validates 87 columns, checks types, applies boundary clipping,
         handles missing values, and generates a quality report.
"""

import pandas as pd
import numpy as np
import sys
import os

# Add parent dir to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.config import (
    COLUMN_RENAME_MAP, CATEGORICAL_COLUMNS, TARGET_COLUMNS,
    VALIDATION_BOUNDS, CATEGORICAL_VALUES, DATASET_PATH
)


def load_dataset(path=None):
    """Load the BioLens dataset from CSV."""
    if path is None:
        path = DATASET_PATH
    df = pd.read_csv(path)
    return df


def validate_columns(df):
    """Verify all 87 columns are present."""
    expected_count = 87
    actual_count = len(df.columns)
    print(f"\n{'='*60}")
    print(f"COLUMN VALIDATION")
    print(f"{'='*60}")
    print(f"Expected columns: {expected_count}")
    print(f"Actual columns:   {actual_count}")
    print(f"Status: {'✅ PASS' if actual_count == expected_count else '❌ FAIL'}")

    # Check target columns
    missing_targets = [t for t in TARGET_COLUMNS if t not in df.columns]
    if missing_targets:
        print(f"❌ Missing target columns: {missing_targets}")
    else:
        print(f"✅ All 8 target columns present")

    return actual_count == expected_count


def validate_data_types(df):
    """Check numeric and categorical columns have correct types."""
    print(f"\n{'='*60}")
    print(f"DATA TYPE VALIDATION")
    print(f"{'='*60}")

    issues = []
    numeric_cols = [c for c in df.columns if c not in CATEGORICAL_COLUMNS]

    for col in numeric_cols:
        if not pd.api.types.is_numeric_dtype(df[col]):
            issues.append(f"  ❌ {col}: expected numeric, got {df[col].dtype}")

    for col in CATEGORICAL_COLUMNS:
        if col in df.columns:
            unique_vals = df[col].unique()
            expected = CATEGORICAL_VALUES.get(col, [])
            unexpected = [v for v in unique_vals if v not in expected and pd.notna(v)]
            if unexpected:
                issues.append(f"  ⚠️  {col}: unexpected values {unexpected[:5]}")

    if issues:
        for issue in issues:
            print(issue)
    else:
        print("✅ All data types are correct")

    return len(issues) == 0


def apply_boundary_clipping(df):
    """Clip numeric values to physiologically valid ranges."""
    print(f"\n{'='*60}")
    print(f"BOUNDARY CLIPPING")
    print(f"{'='*60}")

    clipped_count = 0
    for col, (lo, hi) in VALIDATION_BOUNDS.items():
        if col in df.columns:
            before = df[col].copy()
            df[col] = df[col].clip(lower=lo, upper=hi)
            n_clipped = (before != df[col]).sum()
            if n_clipped > 0:
                print(f"  ⚠️  {col}: clipped {n_clipped} values to [{lo}, {hi}]")
                clipped_count += n_clipped

    if clipped_count == 0:
        print("✅ No values needed clipping — all within bounds")
    else:
        print(f"Total values clipped: {clipped_count}")

    return df


def check_missing_values(df):
    """Check for and report missing values."""
    print(f"\n{'='*60}")
    print(f"MISSING VALUE ANALYSIS")
    print(f"{'='*60}")

    missing = df.isnull().sum()
    missing_cols = missing[missing > 0]

    if len(missing_cols) == 0:
        print("✅ No missing values found")
    else:
        print(f"❌ Found {len(missing_cols)} columns with missing values:")
        for col, count in missing_cols.items():
            pct = (count / len(df)) * 100
            print(f"  {col}: {count} missing ({pct:.1f}%)")

    return missing_cols


def generate_quality_report(df):
    """Generate comprehensive dataset quality report."""
    print(f"\n{'='*60}")
    print(f"DATASET QUALITY REPORT")
    print(f"{'='*60}")

    print(f"\n--- Basic Stats ---")
    print(f"Rows: {len(df):,}")
    print(f"Columns: {len(df.columns)}")
    print(f"Memory usage: {df.memory_usage(deep=True).sum() / 1024 / 1024:.1f} MB")

    # Target variable stats
    print(f"\n--- Target Variable Distributions ---")
    for target in TARGET_COLUMNS:
        if target in df.columns:
            stats = df[target].describe()
            print(f"  {target}:")
            print(f"    Range: [{stats['min']:.1f}, {stats['max']:.1f}]  Mean: {stats['mean']:.1f}  Std: {stats['std']:.1f}")

    # Categorical distributions
    print(f"\n--- Categorical Distributions ---")
    for col in CATEGORICAL_COLUMNS:
        if col in df.columns:
            print(f"  {col}: {dict(df[col].value_counts())}")

    # Key numeric stats
    print(f"\n--- Key Numeric Feature Stats ---")
    key_features = ['age_years', 'resting_hr_bpm', 'hrv_rmssd_ms', 'spo2_pct',
                    'sleep_duration_h', 'steps_per_day', 'vo2max_ml_kg_min']
    for feat in key_features:
        if feat in df.columns:
            s = df[feat].describe()
            print(f"  {feat}: min={s['min']:.1f}  25%={s['25%']:.1f}  "
                  f"50%={s['50%']:.1f}  75%={s['75%']:.1f}  max={s['max']:.1f}")


def run_full_validation(path=None):
    """Run all validation steps and return validated DataFrame."""
    print("╔══════════════════════════════════════════════════════════╗")
    print("║          BioLens Dataset Validation Pipeline            ║")
    print("╚══════════════════════════════════════════════════════════╝")

    df = load_dataset(path)
    print(f"\nLoaded dataset: {len(df):,} rows × {len(df.columns)} columns")

    # Step 1: Column validation
    validate_columns(df)

    # Step 2: Data type validation
    validate_data_types(df)

    # Step 3: Boundary clipping
    df = apply_boundary_clipping(df)

    # Step 4: Missing values
    check_missing_values(df)

    # Step 5: Quality report
    generate_quality_report(df)

    print(f"\n{'='*60}")
    print(f"✅ VALIDATION COMPLETE")
    print(f"{'='*60}")

    return df


if __name__ == '__main__':
    df = run_full_validation()
