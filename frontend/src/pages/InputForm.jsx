import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function InputForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // All 38 manual inputs defined in the project plan
  const [formData, setFormData] = useState({
    // Demographics
    age_years: 30, sex_phys: 'Male', height_cm: 180, weight_kg: 75,
    waist_circ_cm: 80, body_fat_pct: 15,
    
    // Lifestyle
    smoking_status: 'never', alcohol_units_per_week: 2, caffeine_mg_per_day: 200,
    perceived_stress_score: 12, diet_type: 'omnivore', daily_water_intake_l: 2.5,
    processed_food_frequency: 'rarely',
    
    // Today's Vitals
    resting_hr_bpm: 55, hrv_rmssd_ms: 65, spo2_pct: 98, respiratory_rate_brpm: 14,
    skin_temp_c: 33.5, ecg_rhythm: 'Normal sinus rhythm', irregular_rhythm_alert: 0,
    bp_systolic_mmHg: 120, bp_diastolic_mmHg: 80,
    
    // Today's Activity & Training
    steps_per_day: 10000, sedentary_hours_per_day: 8,
    workout_days_per_week: 4, avg_workout_duration_min: 45, strength_sessions_per_week: 2,
    
    // Sleep
    sleep_duration_h: 7.5, deep_sleep_pct: 20, rem_sleep_pct: 20, light_sleep_pct: 60,
    awakenings_per_night: 2, sleep_consistency_score: 85, breathing_disturbances_per_hr: 1.5,
    
    // Cardiac History
    irregular_rhythm_events_7d: 0, irregular_rhythm_events_30d: 0,
    
    // 7-Day Averages
    rhr_7d_avg: 56, hrv_7d_avg: 64, sleep_7d_avg: 7.4, steps_7d_avg: 9500, skin_temp_7d_avg: 33.5,
    
    // 30-Day Averages
    rhr_30d_avg: 57, hrv_30d_avg: 63, sleep_30d_avg: 7.3, steps_30d_avg: 9000, 
    vo2max_30d_avg: 45, skin_temp_30d_avg: 33.6,
    
    // 90-Day Averages
    rhr_90d_ago: 58, hrv_90d_ago: 60, sleep_90d_ago: 7.0, steps_90d_ago: 8500, 
    vo2max_90d_ago: 42, skin_temp_90d_ago: 33.4
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: isNaN(value) || value === '' ? value : Number(value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('http://localhost:5001/api/predict', formData);
      navigate('/dashboard', { state: { predictionData: res.data } });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.trace || err.message || 'Failed to connect to API. Is Flask running?');
    } finally {
      setLoading(false);
    }
  };

  // Group fields for better UI
  const groups = [
    { title: "Demographics & Lifestyle", fields: ['age_years', 'sex_phys', 'height_cm', 'weight_kg', 'waist_circ_cm', 'body_fat_pct', 'smoking_status', 'alcohol_units_per_week', 'caffeine_mg_per_day', 'perceived_stress_score', 'diet_type', 'daily_water_intake_l', 'processed_food_frequency'] },
    { title: "Today's Vitals", fields: ['resting_hr_bpm', 'hrv_rmssd_ms', 'spo2_pct', 'respiratory_rate_brpm', 'skin_temp_c', 'ecg_rhythm', 'irregular_rhythm_alert', 'bp_systolic_mmHg', 'bp_diastolic_mmHg'] },
    { title: "Activity & Training", fields: ['steps_per_day', 'sedentary_hours_per_day', 'workout_days_per_week', 'avg_workout_duration_min', 'strength_sessions_per_week'] },
    { title: "Sleep", fields: ['sleep_duration_h', 'deep_sleep_pct', 'rem_sleep_pct', 'light_sleep_pct', 'awakenings_per_night', 'sleep_consistency_score', 'breathing_disturbances_per_hr'] },
    { title: "Cardiac History", fields: ['irregular_rhythm_events_7d', 'irregular_rhythm_events_30d'] },
    { title: "7-Day Averages", fields: ['rhr_7d_avg', 'hrv_7d_avg', 'sleep_7d_avg', 'steps_7d_avg', 'skin_temp_7d_avg'] },
    { title: "30-Day Averages", fields: ['rhr_30d_avg', 'hrv_30d_avg', 'sleep_30d_avg', 'steps_30d_avg', 'vo2max_30d_avg', 'skin_temp_30d_avg'] },
    { title: "90-Day Averages", fields: ['rhr_90d_ago', 'hrv_90d_ago', 'sleep_90d_ago', 'steps_90d_ago', 'vo2max_90d_ago', 'skin_temp_90d_ago'] }
  ];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '4rem' }}>
      <div className="glass-card" style={{ padding: '2.5rem' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Health Profile</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Enter all 38 metrics to generate your AI health & fitness dashboard.
        </p>

        {error && (
          <div style={{ padding: '1rem', background: 'rgba(244,63,94,0.1)', color: 'var(--accent-rose)', borderRadius: '8px', marginBottom: '2rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '3rem' }}>
          {groups.map(group => (
            <div key={group.title}>
              <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: 'var(--accent-cyan)' }}>
                {group.title}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                {group.fields.map(field => (
                  <div key={field}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {field.replace(/_/g, ' ')}
                    </label>
                    {['sex_phys', 'smoking_status', 'diet_type', 'processed_food_frequency', 'ecg_rhythm'].includes(field) ? (
                      <input type="text" name={field} value={formData[field]} onChange={handleChange} className="input-field" />
                    ) : (
                      <input type="number" step="any" name={field} value={formData[field]} onChange={handleChange} className="input-field" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
            <button type="submit" className="btn-primary" disabled={loading} style={{ fontSize: '1.2rem', padding: '1rem 3rem' }}>
              {loading ? 'Analyzing Profile...' : 'Generate Dashboard ✨'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
