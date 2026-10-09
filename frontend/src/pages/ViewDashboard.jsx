import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Heart, Activity, Wind, Moon, Zap, Dumbbell, User, Calendar, Eye,
  Search, Users, X, Scale, Ruler, Flame, Leaf, PersonStanding
} from 'lucide-react';

const METRIC_CARDS = [
  { key: 'resting_hr_bpm',   label: 'Resting HR',  unit: 'bpm',       color: '#F43F5E', icon: Heart },
  { key: 'hrv_rmssd_ms',    label: 'HRV',          unit: 'ms',        color: '#A855F7', icon: Activity },
  { key: 'vo2max_30d_avg',  label: 'VO₂ Max',      unit: 'ml/kg/min', color: '#3B82F6', icon: Wind },
  { key: 'sleep_duration_h', label: 'Sleep',        unit: 'hrs',       color: '#6366F1', icon: Moon },
  { key: 'deep_sleep_pct',  label: 'Deep Sleep',    unit: '%',         color: '#22D3EE', icon: Moon },
  { key: 'steps_per_day',   label: 'Steps',         unit: 'k',         color: '#10B981', transform: v => (v / 1000).toFixed(1), icon: Dumbbell },
];

const AVG_METRIC_CARDS = [
  { key: 'rhr_30d_avg',    label: 'Avg HR',    unit: 'bpm',       color: '#F43F5E', icon: Heart },
  { key: 'hrv_30d_avg',    label: 'Avg HRV',   unit: 'ms',        color: '#A855F7', icon: Activity },
  { key: 'vo2max_30d_avg', label: 'Avg VO₂',  unit: 'ml/kg/min', color: '#3B82F6', icon: Wind },
  { key: 'sleep_30d_avg',  label: 'Avg Sleep', unit: 'hrs',       color: '#6366F1', icon: Moon },
  { key: 'steps_30d_avg',  label: 'Avg Steps', unit: 'k',         color: '#10B981', transform: v => (v / 1000).toFixed(1), icon: Dumbbell },
];

const BIO_CARDS = [
  { key: 'weight_kg',              label: 'Weight',      unit: 'kg',    color: '#F59E0B', icon: Scale },
  { key: 'bmi',                    label: 'BMI',          unit: 'kg/m²', color: '#EC4899', icon: Dumbbell, transform: v => typeof v === 'number' ? v.toFixed(1) : v },
  { key: 'height_cm',              label: 'Height',       unit: 'cm',    color: '#3B82F6', icon: Ruler },
  { key: 'body_fat_pct',           label: 'Body Fat',     unit: '%',     color: '#F43F5E', icon: Flame },
  { key: 'age_years',              label: 'Age',          unit: 'yrs',   color: '#A855F7', icon: User },
  { key: 'sex_phys',               label: 'Sex',          unit: '',      color: '#22D3EE', icon: User },
  { key: 'workout_days_per_week',  label: 'Workouts',     unit: 'd/wk',  color: '#10B981', icon: Dumbbell },
  { key: 'diet_type',              label: 'Diet',         unit: '',      color: '#6366F1', icon: Leaf },
];

function formatDate(str) {
  if (!str) return '';
  const d = new Date(str);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function MetricItem({ metric, value }) {
  const display = metric.transform
    ? (value != null ? metric.transform(value) : '—')
    : (typeof value === 'number'
        ? (Number.isInteger(value) ? value : value.toFixed(1))
        : value ?? '—');
  const Icon = metric.icon;
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
      padding: '0.85rem 1rem', borderRadius: '10px',
      background: 'var(--pill-bg)', border: '1px solid var(--pill-border)',
      minWidth: '125px', flex: '1 1 0',
      gap: '0.3rem',
    }}>
      {Icon && <Icon size={18} color={metric.color} />}
      <span style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 700, marginTop: '0.2rem', whiteSpace: 'nowrap' }}>
        {metric.label}
      </span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', whiteSpace: 'nowrap', width: '100%' }}>
        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em', lineHeight: 1 }}>
          {display}
        </span>
        <span style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>
          {metric.unit}
        </span>
      </div>
    </div>
  );
}

function UserCard({ profile, onView, highlighted }) {
  const [tab, setTab] = useState('values'); // 'values' | 'avg' | 'bio'
  const cardRef = useRef(null);

  useEffect(() => {
    if (highlighted && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlighted]);

  const metrics = tab === 'avg' ? AVG_METRIC_CARDS : tab === 'bio' ? BIO_CARDS : METRIC_CARDS;

  return (
    <div
      ref={cardRef}
      style={{
        background: 'var(--card-bg-solid)',
        border: highlighted
          ? '2px solid var(--accent-cyan)'
          : '1px solid var(--card-border)',
        borderRadius: '20px',
        padding: '1.5rem 1.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.1rem',
        transition: 'border-color 0.3s, box-shadow 0.3s, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        transform: highlighted ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: highlighted ? '0 12px 40px rgba(34,211,238,0.18)' : 'none',
        animation: highlighted ? 'slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
      }}
      onMouseEnter={e => {
        if (!highlighted) {
          e.currentTarget.style.borderColor = 'rgba(34,211,238,0.35)';
          e.currentTarget.style.boxShadow = '0 6px 24px rgba(34,211,238,0.08)';
        }
      }}
      onMouseLeave={e => {
        if (!highlighted) {
          e.currentTarget.style.borderColor = 'var(--card-border)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      {/* Header row: avatar + name + date + archetype + toggle + eye */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        {/* Avatar */}
        <div style={{
          width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(99,102,241,0.2))',
          border: '1px solid rgba(34,211,238,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <User size={22} color="var(--accent-cyan)" />
        </div>

        {/* Name + date */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            {profile.profile_name}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.1rem' }}>
            <Calendar size={11} /> {formatDate(profile.created_at)}
          </div>
        </div>

        {/* Archetype badge */}
        <span style={{
          fontSize: '0.72rem', fontWeight: 700, padding: '0.28rem 0.7rem',
          borderRadius: '20px', background: 'rgba(168,85,247,0.15)',
          border: '1px solid rgba(168,85,247,0.3)', color: 'var(--accent-purple)',
          whiteSpace: 'nowrap',
        }}>
          {profile.archetype_name || 'Unknown'}
        </span>

        {/* 3-way toggle: Values / Avg Values / Bio Details */}
        <div style={{
          display: 'flex', background: 'var(--subtle-bg)',
          border: '1px solid var(--pill-border)', borderRadius: '8px',
          overflow: 'hidden', flexShrink: 0,
        }}>
          {[['values','Values'],['avg','Avg Values'],['bio','Bio Details']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                padding: '0.38rem 0.85rem', border: 'none', cursor: 'pointer',
                fontSize: '0.8rem', fontWeight: 700,
                background: tab === key ? 'var(--accent-cyan)' : 'transparent',
                color: tab === key ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.2s',
                borderRight: key !== 'bio' ? '1px solid var(--pill-border)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Reports: eye icon */}
        <button
          onClick={() => onView(profile.id)}
          title="View Report"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            background: 'linear-gradient(135deg, rgba(34,211,238,0.18), rgba(99,102,241,0.18))',
            border: '1px solid rgba(34,211,238,0.4)',
            color: 'var(--accent-cyan)',
            borderRadius: '10px', padding: '0.45rem 1rem',
            cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700,
            flexShrink: 0, transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34,211,238,0.32), rgba(99,102,241,0.32))'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34,211,238,0.18), rgba(99,102,241,0.18))'; }}
        >
          <Eye size={16} /> Report
        </button>
      </div>

      {/* Metrics row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
        {metrics.map(m => (
          <MetricItem key={m.key} metric={m} value={profile[m.key]} />
        ))}
      </div>
    </div>
  );
}

export default function ViewAllUsers() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedId, setHighlightedId] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:5001/api/profiles')
      .then(res => {
        setProfiles(res.data.profiles || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.response?.data?.error || 'Failed to fetch profiles');
        setLoading(false);
      });
  }, []);

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

  const handleSearch = (val) => {
    setSearch(val);
    if (!val.trim()) { setHighlightedId(null); return; }
    const match = profiles.find(p =>
      p.profile_name.toLowerCase().includes(val.toLowerCase())
    );
    setHighlightedId(match ? match.id : null);
  };

  const clearSearch = () => { setSearch(''); setHighlightedId(null); };

  // Sort: highlighted first
  const sortedProfiles = highlightedId
    ? [...profiles].sort((a, b) => (b.id === highlightedId ? 1 : 0) - (a.id === highlightedId ? 1 : 0))
    : profiles;

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
      Loading users...
    </div>
  );
  if (error) return (
    <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--accent-rose)' }}>
      Error: {error}
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(-6px); }
        }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '5rem' }}>
        {/* Page header */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{
            fontSize: '2rem', margin: '0 0 0.4rem 0',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
          }} className="text-gradient">
            <Users size={28} /> View All Users
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '1rem' }}>
            {profiles.length} saved profile{profiles.length !== 1 ? 's' : ''} — toggle between current values and 30-day averages.
          </p>
        </div>

        {/* Search bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          background: 'var(--card-bg-solid)', border: '1px solid var(--card-border)',
          borderRadius: '14px', padding: '0.75rem 1.25rem',
          marginBottom: '2rem', boxShadow: 'var(--shadow-glass)',
        }}>
          <Search size={18} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search user by name…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            style={{
              flex: 1, border: 'none', outline: 'none',
              background: 'transparent', color: 'var(--text-primary)',
              fontSize: '1rem', fontWeight: 500, fontFamily: 'Outfit, sans-serif',
            }}
          />
          {search && (
            <button onClick={clearSearch} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0, display: 'flex' }}>
              <X size={16} />
            </button>
          )}
          {search && !highlightedId && (
            <span style={{ fontSize: '0.82rem', color: 'var(--accent-rose)', fontWeight: 600, whiteSpace: 'nowrap' }}>
              No match
            </span>
          )}
          {highlightedId && (
            <span style={{ fontSize: '0.82rem', color: 'var(--accent-cyan)', fontWeight: 600, whiteSpace: 'nowrap' }}>
              ↑ Found
            </span>
          )}
        </div>

        {loadingReport && (
          <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--accent-cyan)', marginBottom: '1rem', fontWeight: 600 }}>
            Opening report…
          </div>
        )}

        {profiles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
            <Users size={52} style={{ marginBottom: '1rem', opacity: 0.25 }} />
            <p style={{ fontSize: '1.1rem' }}>No users found. Create a profile first.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {sortedProfiles.map(profile => (
              <UserCard
                key={profile.id}
                profile={profile}
                onView={handleView}
                highlighted={profile.id === highlightedId}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
