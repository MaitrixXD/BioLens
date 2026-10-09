import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const TEXT_FIELDS = ['sex_phys', 'smoking_status', 'diet_type', 'processed_food_frequency', 'ecg_rhythm'];

const GROUPS = [
  { title: "Demographics & Lifestyle", fields: ['age_years','sex_phys','height_cm','weight_kg','waist_circ_cm','body_fat_pct','smoking_status','alcohol_units_per_week','caffeine_mg_per_day','perceived_stress_score','diet_type','daily_water_intake_l','processed_food_frequency'] },
  { title: "Today's Vitals",           fields: ['resting_hr_bpm','hrv_rmssd_ms','spo2_pct','respiratory_rate_brpm','skin_temp_c','ecg_rhythm','irregular_rhythm_alert','bp_systolic_mmHg','bp_diastolic_mmHg'] },
  { title: "Activity & Training",      fields: ['steps_per_day','sedentary_hours_per_day','workout_days_per_week','avg_workout_duration_min','strength_sessions_per_week'] },
  { title: "Sleep",                    fields: ['sleep_duration_h','deep_sleep_pct','rem_sleep_pct','light_sleep_pct','awakenings_per_night','sleep_consistency_score','breathing_disturbances_per_hr'] },
  { title: "Cardiac History",          fields: ['irregular_rhythm_events_7d','irregular_rhythm_events_30d'] },
  { title: "7-Day Averages",           fields: ['rhr_7d_avg','hrv_7d_avg','sleep_7d_avg','steps_7d_avg','skin_temp_7d_avg'] },
  { title: "30-Day Averages",          fields: ['rhr_30d_avg','hrv_30d_avg','sleep_30d_avg','steps_30d_avg','vo2max_30d_avg','skin_temp_30d_avg'] },
  { title: "90-Day Averages",          fields: ['rhr_90d_ago','hrv_90d_ago','sleep_90d_ago','steps_90d_ago','vo2max_90d_ago','skin_temp_90d_ago'] },
];

export default function EditProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [profileName, setProfileName] = useState('');
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Confirmation modal state
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:5001/api/profiles/${id}`)
      .then(res => {
        const p = res.data;
        setProfileName(p.profile_name || '');
        setFormData(p.raw_inputs || {});
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load profile.');
        setLoading(false);
      });
  }, [id]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: isNaN(value) || value === '' ? value : Number(value),
    }));
  };

  const handleSubmitClick = e => {
    e.preventDefault();
    if (!profileName.trim()) { setError('Profile name is required.'); return; }
    setPendingPayload({ profile_name: profileName.trim(), raw_inputs: formData });
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    setSubmitting(true);
    setError(null);
    try {
      const res = await axios.put(
        `http://localhost:5001/api/profiles/${id}/values`,
        pendingPayload
      );
      // Navigate to dashboard with fresh prediction data
      navigate('/dashboard', {
        state: {
          predictionData: {
            insights: res.data.insights,
            archetype: res.data.archetype,
            computed_features: res.data.computed_features,
            scores: res.data.scores,
          },
          profileName: pendingPayload.profile_name,
          rawInputs: pendingPayload.raw_inputs,
          isUpdated: true,   // suppress auto-save (row already updated)
        }
      });
    } catch (err) {
      setError(err.response?.data?.trace || err.message || 'Update failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
      Loading profile…
    </div>
  );

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '4rem' }}>

      {/* Confirmation modal */}
      {showConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '16px', padding: '2rem', maxWidth: '440px', width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>
            <h3 style={{ marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              Update "<span style={{ color: 'var(--accent-cyan)' }}>{profileName}</span>"?
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: 1.6 }}>
              All existing values for this profile will be <strong style={{ color: '#F59E0B' }}>permanently overwritten</strong> in the database. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{ padding: '0.6rem 1.4rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.95rem' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                style={{ padding: '0.6rem 1.4rem', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#22D3EE,#6366F1)', color: '#fff', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600 }}
              >
                Yes, Update
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card" style={{ padding: '2.5rem' }}>
        <h2 style={{ marginBottom: '0.25rem' }}>Edit Profile</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Modify the name and/or metric values. Saving will overwrite the existing record.
        </p>

        {error && (
          <div style={{ padding: '1rem', background: 'rgba(244,63,94,0.1)', color: 'var(--accent-rose)', borderRadius: '8px', marginBottom: '2rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmitClick} style={{ display: 'grid', gap: '3rem' }}>

          {/* Profile Name */}
          <div style={{ padding: '1.5rem', background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: '12px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--accent-cyan)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Profile Name *
            </label>
            <input
              type="text"
              value={profileName}
              onChange={e => setProfileName(e.target.value)}
              required
              className="input-field"
              style={{ fontSize: '1.1rem', padding: '0.75rem 1rem', width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {/* All metric groups */}
          {formData && GROUPS.map(group => (
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
                    <input
                      type={TEXT_FIELDS.includes(field) ? 'text' : 'number'}
                      step="any"
                      name={field}
                      value={formData[field] ?? ''}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => navigate('/reports')}
              style={{ padding: '0.85rem 2rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{ fontSize: '1.1rem', padding: '0.85rem 2.5rem', opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? 'Saving…' : 'Save Changes ✓'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
