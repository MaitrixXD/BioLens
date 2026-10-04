"""
BioLens What-If Scenario Engine
Phase 8: Provides scenario modeling logic.
"""

from backend.features import compute_all_features

def apply_scenario(base_inputs, modifications):
    """
    Applies user-requested modifications to a base input dict,
    and returns a fully recomputed feature set for inference.
    
    Args:
        base_inputs: dict of original 38 raw inputs
        modifications: dict of {field_name: new_value} to overwrite
        
    Returns:
        dict: New computed full feature array
    """
    scenario_inputs = dict(base_inputs)
    
    # Apply modifications
    for k, v in modifications.items():
        scenario_inputs[k] = v
        
    # Recompute the full 78-feature array with the modified inputs
    # E.g., if sleep_duration changes, restorative_sleep_hours recomputes
    scenario_features = compute_all_features(scenario_inputs)
    
    return scenario_features
