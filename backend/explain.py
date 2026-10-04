"""
BioLens Explainability Module
Phase 7: Converts SHAP values into natural language insights.
"""

import numpy as np
from backend.config import FEATURE_LABELS, TARGET_LABELS

def generate_insights(shap_values_dict, feature_names, raw_inputs, target_scores):
    """
    Generate plain-English insights from SHAP values for each domain.
    
    Args:
        shap_values_dict: dict of target_name -> shap_values (array)
        feature_names: list of feature names matching the SHAP array indices
        raw_inputs: dict of raw/computed features for this specific user
        target_scores: dict of target_name -> final predicted score (0-100)
        
    Returns:
        dict of target_name -> {
            'score': float,
            'helping_factors': [(label, importance_weight, actual_value)],
            'hurting_factors': [(label, importance_weight, actual_value)],
            'summary_text': string
        }
    """
    insights = {}
    
    for target, shap_vals in shap_values_dict.items():
        if len(shap_vals.shape) > 1:
            shap_vals = shap_vals[0] # Take first instance if batched
            
        # Pair features with their SHAP contribution
        contributions = []
        for i, val in enumerate(shap_vals):
            feat = feature_names[i]
            label = FEATURE_LABELS.get(feat, feat)
            actual_val = raw_inputs.get(feat, 'N/A')
            
            # Format actual value for display
            if isinstance(actual_val, (int, float)):
                if abs(actual_val) > 100:
                    display_val = f"{int(actual_val):,}"
                else:
                    display_val = f"{actual_val:.1f}".rstrip('0').rstrip('.')
            else:
                display_val = str(actual_val)
                
            contributions.append({
                'feature': feat,
                'label': label,
                'shap': float(val),
                'actual': display_val
            })
            
        # Sort by impact
        # Positive SHAP = pushes score UP (helping)
        # Negative SHAP = pushes score DOWN (hurting)
        contributions.sort(key=lambda x: x['shap'], reverse=True)
        
        # Filter significant factors (ignoring tiny noise near 0)
        helping = [c for c in contributions if c['shap'] > 0.5][:3]
        hurting = [c for c in reversed(contributions) if c['shap'] < -0.5][:3]
        
        # Determine status text
        score = target_scores.get(target, 50)
        status = _get_status_text(target, score, helping, hurting)
        
        insights[target] = {
            'score': round(float(score), 1),
            'helping_factors': [
                {'label': c['label'], 'weight': abs(c['shap']), 'value': c['actual']} 
                for c in helping
            ],
            'hurting_factors': [
                {'label': c['label'], 'weight': abs(c['shap']), 'value': c['actual']} 
                for c in hurting
            ],
            'summary_text': status
        }
        
    return insights


def _get_status_text(target, score, helping, hurting):
    """Generate dynamic summary text based on score and top factors."""
    if score >= 85:
        qualifier = "Excellent"
    elif score >= 70:
        qualifier = "Good"
    elif score >= 50:
        qualifier = "Average"
    elif score >= 30:
        qualifier = "Below Average"
    else:
        qualifier = "Poor"
        
    # Build text based on domain
    if target == 'target_readiness':
        if score >= 80:
            return "Prime condition. Your body is well-recovered and ready for high-intensity training today."
        elif score >= 50:
            return "Moderate readiness. Capable of standard training, but monitor intensity and listen to your body."
        else:
            return "Low readiness. Prioritize active recovery and rest today; your system is under elevated stress."
            
    elif target == 'target_cardiovascular':
        return f"{qualifier} heart health profile. Your cardiovascular efficiency is " + \
               ("optimal." if score >= 70 else "showing signs of strain.")
               
    elif target == 'target_recovery':
        if hurting and hurting[0]['feature'] == 'sleep_duration_h':
            return f"{qualifier} recovery. Insufficient sleep is the primary drag on your autonomic bounce-back."
        return f"{qualifier} recovery status, indicating " + \
               ("strong physiological resilience." if score >= 70 else "accumulated fatigue.")

    # Default fallback
    domain = TARGET_LABELS.get(target, target.split('_')[-1].title())
    text = f"Your {domain} profile is {qualifier.lower()}."
    
    if helping and score >= 50:
        text += f" Driven primarily by strong {helping[0]['label']}."
    elif hurting and score < 70:
        text += f" Dragged down primarily by {hurting[0]['label']}."
        
    return text
