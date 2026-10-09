import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Heart, Activity, Wind, Moon, Zap, Brain, Dumbbell, Sliders,
  ChevronDown, Search, BarChart2, User, Calendar, Eye, Trash2, Edit2, Check, X
} from 'lucide-react';

const METRIC_CARDS = [
  { key: 'resting_hr_bpm',   label: 'Resting HR',  unit: 'bpm',       color: '#F43F5E', icon: Heart },
  { key: 'hrv_rmssd_ms',    label: 'HRV',          unit: 'ms',        color: '#A855F7', icon: Activity },
  { key: 'vo2max_30d_avg',  label: 'VO₂ Max',      unit: 'ml/kg/min', color: '#3B82F6', icon: Wind },
  { key: 'sleep_duration_h', label: 'Sleep',        unit: 'hrs',       color: '#6366F1', icon: Moon },
  { key: 'deep_sleep_pct',  label: 'Deep Sleep',    unit: '%',         color: '#22D3EE', icon: Moon },
  { key: 'steps_per_day',   label: 'Steps',         unit: 'k',         color: '#10B981', transform: v => (v / 1000).toFixed(1), icon: Dumbbell },
  { key: 'weight_kg',       label: 'Weight',        unit: 'kg',        color: '#F59E0B', icon: Zap },
  { key: 'bmi',             label: 'BMI',           unit: 'kg/m²',     color: '#EC4899', icon: User },
];

const AVG_METRIC_CARDS = [
  { key: 'rhr_30d_avg',   label: 'Avg HR',    unit: 'bpm',       color: '#F43F5E', icon: Heart },
  { key: 'hrv_30d_avg',   label: 'Avg HRV',   unit: 'ms',        color: '#A855F7', icon: Activity },
  { key: 'vo2max_30d_avg', label: 'Avg VO₂',  unit: 'ml/kg/min', color: '#3B82F6', icon: Wind },
  { key: 'sleep_30d_avg', label: 'Avg Sleep', unit: 'hrs',       color: '#6366F1', icon: Moon },
  { key: 'steps_30d_avg', label: 'Avg Steps', unit: 'k',         color: '#10B981', transform: v => (v / 1000).toFixed(1), icon: Dumbbell },
];

function formatDate(str) {
  if (!str) return '';
  const d = new Date(str);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function MetricPill({ metric, value }) {
  const display = metric.transform
    ? metric.transform(value)
    : (typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(1)) : value ?? '—');
  const Icon = metric.icon;
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
      padding: '1.25rem', borderRadius: '12px',
      background: 'var(--pill-bg)',
      border: '1px solid var(--pill-border)',
      minWidth: '130px', flex: '1 1 calc(25% - 1rem)',
      transition: 'transform 0.2s, background 0.2s',
    }}>
      {Icon && <Icon size={24} color={metric.color} style={{ marginBottom: '0.85rem' }} />}
      <span style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '0.35rem', fontWeight: 700 }}>{metric.label}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
        <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.03em' }}>{display}</span>
        <span style={{ fontSize: '1.4rem', color: 'var(--text-secondary)', fontWeight: 700, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.03em' }}>{metric.unit}</span>
      </div>
    </div>
  );
}

function AvgPill({ metric, value }) {
  const display = value == null ? '—'
    : metric.transform ? metric.transform(value)
    : (typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(1)) : value);
  const Icon = metric.icon;
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
      padding: '1rem', borderRadius: '12px',
      background: 'var(--pill-bg)',
      border: '1px solid var(--pill-border)',
      minWidth: '120px', flex: '1 1 calc(20% - 0.75rem)',
    }}>
      {Icon && <Icon size={18} color={metric.color} style={{ marginBottom: '0.6rem', opacity: 0.8 }} />}
      <span style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '0.25rem', fontWeight: 700 }}>{metric.label}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
        <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, fontFamily: 'Outfit, sans-serif' }}>{display}</span>
        <span style={{ fontSize: '1.4rem', color: 'var(--text-secondary)', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>{metric.unit}</span>
      </div>
    </div>
  );
}

function ProfileCard({ profile, onView, onEdit, onDelete, onSaveName }) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(profile.profile_name);

  const handleSave = () => {
    if (tempName.trim() && tempName.trim() !== profile.profile_name) {
      onSaveName(profile.id, tempName.trim());
    } else {
      setTempName(profile.profile_name);
    }
    setIsEditing(false);
  };

  return (
    <div
      style={{
        background: 'var(--card-bg-solid)',
        border: '1px solid var(--card-border)',
        borderRadius: '16px',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(34,211,238,0.3)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(34,211,238,0.06)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--card-border)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(34,211,238,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={20} color="var(--accent-cyan)" />
          </div>
          <div>
            {isEditing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <input
                  type="text"
                  value={tempName}
                  onChange={e => setTempName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') { setIsEditing(false); setTempName(profile.profile_name); } }}
                  autoFocus
                  style={{ background: 'var(--input-bg)', border: '1px solid var(--accent-cyan)', color: 'var(--text-primary)', borderRadius: '4px', padding: '0.2rem 0.4rem', fontSize: '1rem', outline: 'none' }}
                />
                <button onClick={handleSave} style={{ background: 'none', border: 'none', color: '#10B981', cursor: 'pointer', padding: 0 }}><Check size={16} /></button>
                <button onClick={() => { setIsEditing(false); setTempName(profile.profile_name); }} style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', padding: 0 }}><X size={16} /></button>
              </div>
            ) : (
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {profile.profile_name}
                <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, opacity: 0.7 }} title="Edit Name"><Edit2 size={12} /></button>
              </div>
            )}
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.1rem' }}>
              <Calendar size={11} /> {formatDate(profile.created_at)}
            </div>
          </div>
        </div>
        <span style={{
          fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.75rem',
          borderRadius: '20px', background: 'rgba(168,85,247,0.15)',
          border: '1px solid rgba(168,85,247,0.3)', color: 'var(--accent-purple)',
        }}>
          {profile.archetype_name || 'Unknown Archetype'}
        </span>
      </div>

      {/* Snapshot row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
        {METRIC_CARDS.map(m => (
          <MetricPill key={m.key} metric={m} value={profile[m.key]} />
        ))}
      </div>

      {/* 30-day averages row */}
      <div style={{ display: 'flex', flexWrap: 'nowrap', overflowX: 'auto', gap: '0.75rem', alignItems: 'center', padding: '1rem', background: 'var(--subtle-bg)', borderRadius: '16px', border: '1px solid var(--pill-border)', marginTop: '0.5rem' }}>
        <span style={{ fontSize: '0.68rem', color: 'var(--accent-cyan)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginRight: '0.25rem', whiteSpace: 'nowrap', opacity: 0.8 }}>
          Ø 30d AVG
        </span>
        {AVG_METRIC_CARDS.map(m => (
          <AvgPill key={m.key} metric={m} value={profile[m.key]} />
        ))}
      </div>

      {/* Demographics strip */}
      {(profile.age_years || profile.sex_phys || profile.height_cm) && (
        <div style={{ 
          display: 'flex', flexWrap: 'wrap', 
          background: 'var(--pill-bg)', 
          border: '1px solid var(--pill-border)', 
          borderRadius: '12px', padding: '1.25rem', marginTop: '0.5rem',
          alignItems: 'center'
        }}>
          {[
            profile.age_years     != null && { label: 'Age',          value: `${profile.age_years} yrs`,            color: 'var(--accent-blue)' },
            profile.sex_phys                && { label: 'Sex',          value: profile.sex_phys,                       color: 'var(--accent-blue)' },
            profile.height_cm     != null && { label: 'Height',       value: `${profile.height_cm} cm`,             color: 'var(--accent-blue)' },
            profile.body_fat_pct  != null && { label: 'Body Fat',     value: `${profile.body_fat_pct}%`,            color: 'var(--accent-amber)' },
            profile.workout_days_per_week  != null && { label: 'Workouts', value: `${profile.workout_days_per_week}d/wk`, color: 'var(--accent-green)' },
            profile.diet_type               && { label: 'Diet',         value: profile.diet_type,                     color: 'var(--accent-green)' },
          ].filter(Boolean).map((item, i, arr) => (
            <div key={i} style={{ 
              display: 'flex', flexDirection: 'column', gap: '0.3rem', 
              paddingRight: i !== arr.length - 1 ? '1.5rem' : '0',
              marginRight: i !== arr.length - 1 ? '1.5rem' : '0',
              borderRight: i !== arr.length - 1 ? '1px solid var(--pill-border)' : 'none',
              minWidth: '60px'
            }}>
              <span style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 700 }}>{item.label}</span>
              <span style={{ fontSize: '1.2rem', color: item.color, fontWeight: 700 }}>{item.value}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
        <button
          onClick={() => onDelete(profile)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            background: 'rgba(244,63,94,0.05)',
            border: '1px solid rgba(244,63,94,0.2)', color: 'var(--accent-rose)',
            borderRadius: '8px', padding: '0.65rem 1rem',
            cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600,
          }}
          title="Delete Profile"
        >
          <Trash2 size={16} />
        </button>
        <button
          onClick={() => onEdit(profile.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)',
            borderRadius: '8px', padding: '0.65rem 1rem',
            cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600,
          }}
          title="Edit Profile Values"
        >
          <Edit2 size={16} /> Edit
        </button>
        <button
          onClick={() => onView(profile.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'linear-gradient(135deg, rgba(34,211,238,0.25), rgba(99,102,241,0.25))',
            border: '1px solid rgba(34,211,238,0.4)', color: 'var(--accent-cyan)',
            borderRadius: '10px', padding: '0.75rem 2rem',
            cursor: 'pointer', fontSize: '1.15rem', fontWeight: 700,
            boxShadow: '0 4px 16px rgba(34,211,238,0.15)'
          }}
        >
          <Eye size={20} /> View Report
        </button>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const dropdownRef = useRef(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchProfiles(); }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchProfiles = async () => {
    setLoading(true); setError(null);
    try {
      const res = await axios.get('http://localhost:5001/api/profiles');
      setProfiles(res.data.profiles || []);
    } catch {
      setError('Could not load reports. Is the Flask server running?');
    } finally { setLoading(false); }
  };

  const handleSaveName = async (id, newName) => {
    try {
      await axios.patch(`http://localhost:5001/api/profiles/${id}/name`, { profile_name: newName });
      setProfiles(prev => prev.map(p => p.id === id ? { ...p, profile_name: newName } : p));
    } catch (err) {
      alert('Failed to update name');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(`http://localhost:5001/api/profiles/${deleteTarget.id}`);
      setProfiles(prev => prev.filter(p => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert('Failed to delete profile');
    } finally {
      setDeleting(false);
    }
  };

  const handleView = async (id) => {
    setLoadingReport(true);
    try {
      const res = await axios.get('http://localhost:5001/api/profiles/' + id);
      const p = res.data;
      navigate('/dashboard', {
        state: {
          predictionData: {
            insights: p.insights,
            archetype: { name: p.archetype_name },
            computed_features: p.computed_features,
            scores: p.scores,
          },
          profileName: p.profile_name,
          rawInputs: p.raw_inputs,
        }
      });
    } catch { alert('Failed to load this report.'); }
    finally { setLoadingReport(false); }
  };

  const filteredBySearch = search
    ? profiles.filter(p => p.profile_name.toLowerCase().includes(search.toLowerCase()))
    : profiles;

  const names = [...new Set(profiles.map(p => p.profile_name))];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '4rem' }}>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
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
              Delete "<span style={{ color: 'var(--accent-rose)' }}>{deleteTarget.profile_name}</span>"?
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: 1.6 }}>
              This profile will be permanently deleted from the database. Do you want to proceed?
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{ padding: '0.6rem 1.4rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.95rem' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                style={{ padding: '0.6rem 1.4rem', borderRadius: '8px', border: 'none', background: 'var(--accent-rose)', color: '#fff', cursor: deleting ? 'wait' : 'pointer', fontSize: '0.95rem', fontWeight: 600, opacity: deleting ? 0.7 : 1 }}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }} className="text-gradient">
          <BarChart2 size={28} /> View Reports
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          All saved health profiles — showing the latest {profiles.length} entries.
        </p>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 250px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search by profile name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '2.25rem', width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setDropdownOpen(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-primary)', borderRadius: '8px',
                padding: '0.6rem 1rem', cursor: 'pointer', fontSize: '0.9rem', minWidth: '160px',
                justifyContent: 'space-between',
              }}
            >
              <span>All names</span>
              <ChevronDown size={16} style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
            </button>
            {dropdownOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 100,
                background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', minWidth: '200px', overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}>
                <div onClick={() => { setSearch(''); setDropdownOpen(false); }}
                  style={{ padding: '0.6rem 1rem', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.9rem' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  Show all
                </div>
                {names.map(name => (
                  <div key={name} onClick={() => { setSearch(name); setDropdownOpen(false); }}
                    style={{ padding: '0.6rem 1rem', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '0.9rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,211,238,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    {name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={fetchProfiles}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', borderRadius: '8px', padding: '0.6rem 1rem', cursor: 'pointer', fontSize: '0.85rem' }}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {loadingReport && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--accent-cyan)' }}>Loading report...</div>}
      {loading && !loadingReport && <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Loading reports...</div>}
      {error && <div style={{ padding: '1rem', background: 'rgba(244,63,94,0.1)', color: 'var(--accent-rose)', borderRadius: '8px', marginBottom: '1.5rem' }}>{error}</div>}

      {!loading && !error && filteredBySearch.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          <BarChart2 size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p style={{ fontSize: '1.1rem' }}>No reports found.</p>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Generate a profile from the{' '}
            <span style={{ color: 'var(--accent-cyan)', cursor: 'pointer' }} onClick={() => navigate('/')}>New Profile</span> page.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredBySearch.map(profile => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            onView={handleView}
            onEdit={id => navigate('/edit-profile/' + id)}
            onDelete={setDeleteTarget}
            onSaveName={handleSaveName}
          />
        ))}
      </div>

      {profiles.length === 10 && (
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Showing the 10 most recent profiles.
        </p>
      )}
    </div>
  );
}
