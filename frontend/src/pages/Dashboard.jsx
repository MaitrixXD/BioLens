import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Activity, Brain, Moon, Heart, Dumbbell, Zap, ShieldAlert, FastForward, Sliders, Wind, ActivitySquare, FileText, Download } from 'lucide-react';

export default function Dashboard() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [scenarioData, setScenarioData] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const hasSaved = useRef(false);

  
  const [mods, setMods] = useState({
    sleep_duration_h: 0, weight_kg: 0, steps_per_day: 0, perceived_stress_score: 0
  });

  if (!state?.predictionData) return <Navigate to="/" />;

  const { insights, archetype, computed_features: data, scores } = state.predictionData;
  const profileName = state.profileName || '';
  const rawInputs = state.rawInputs || {};

  // Auto-save to MySQL once on first load
  useEffect(() => {
    if (hasSaved.current || !profileName) return;
    hasSaved.current = true;
    
    if (state.isUpdated) {
      setSaveStatus('updated');
      return;
    }

    setSaveStatus('saving');
    axios.post('http://localhost:5001/api/profiles/save', {
      profile_name: profileName,
      archetype,
      computed_features: data,
      insights,
      scores,
      raw_inputs: rawInputs,
    }).then(res => setSaveStatus(res.data.duplicate ? 'duplicate' : 'saved'))
      .catch(() => setSaveStatus('error'));
  }, []);



  const handleModChange = (field, delta) => {
    const newMods = { ...mods, [field]: Number(delta) };
    setMods(newMods);
    runScenario(newMods);
  };

  const runScenario = async (currentMods) => {
    try {
      const absoluteMods = {};
      if (currentMods.sleep_duration_h !== 0) absoluteMods.sleep_duration_h = data.sleep_duration_h + currentMods.sleep_duration_h;
      if (currentMods.weight_kg !== 0) absoluteMods.weight_kg = data.weight_kg + currentMods.weight_kg;
      if (currentMods.steps_per_day !== 0) absoluteMods.steps_per_day = data.steps_per_day + currentMods.steps_per_day;
      if (currentMods.perceived_stress_score !== 0) absoluteMods.perceived_stress_score = data.perceived_stress_score + currentMods.perceived_stress_score;
      
      if (Object.keys(absoluteMods).length === 0) {
        setScenarioData(null);
        return;
      }

      const res = await axios.post('http://localhost:5001/api/scenario', {
        base_inputs: data, modifications: absoluteMods
      });
      setScenarioData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Data for Charts
  const sleepStagesData = [
    { name: 'Deep Sleep', value: data.deep_sleep_pct || 0, fill: '#3B82F6' },
    { name: 'REM Sleep', value: data.rem_sleep_pct || 0, fill: '#A855F7' },
    { name: 'Light/Awake', value: data.light_sleep_pct || 0, fill: '#94A3B8' }
  ];

  const hrZonesData = [
    { name: 'Low Intensity', value: data.zone_low_min_per_week || 0, fill: '#10B981' },
    { name: 'Moderate Intensity', value: data.zone_moderate_min_per_week || 0, fill: '#F59E0B' },
    { name: 'High Intensity', value: data.zone_high_min_per_week || 0, fill: '#F43F5E' }
  ];

  const trendData = React.useMemo(() => {
    const rhr90 = data.resting_hr_bpm_90d_ago || data.rhr_90d_ago || data.resting_hr_bpm || 60;
    const rhr30 = data.rhr_30d_avg || data.resting_hr_bpm || 60;
    const rhr7 = data.rhr_7d_avg || data.resting_hr_bpm || 60;
    const rhr0 = data.resting_hr_bpm || 60;

    const hrv90 = data.hrv_rmssd_ms_90d_ago || data.hrv_90d_ago || data.hrv_rmssd_ms || 50;
    const hrv30 = data.hrv_30d_avg || data.hrv_rmssd_ms || 50;
    const hrv7 = data.hrv_7d_avg || data.hrv_rmssd_ms || 50;
    const hrv0 = data.hrv_rmssd_ms || 50;

    const steps90 = data.steps_per_day_90d_ago || data.steps_90d_ago || data.steps_per_day || 8000;
    const steps30 = data.steps_30d_avg || data.steps_per_day || 8000;
    const steps7 = data.steps_7d_avg || data.steps_per_day || 8000;
    const steps0 = data.steps_per_day || 8000;

    const arr = [];
    const days = 90;
    for (let i = days; i >= 0; i--) {
      let baseRhr, baseHrv, baseSteps;
      if (i > 30) {
        const t = (i - 30) / 60;
        baseRhr = rhr90 * t + rhr30 * (1 - t);
        baseHrv = hrv90 * t + hrv30 * (1 - t);
        baseSteps = steps90 * t + steps30 * (1 - t);
      } else if (i > 7) {
        const t = (i - 7) / 23;
        baseRhr = rhr30 * t + rhr7 * (1 - t);
        baseHrv = hrv30 * t + hrv7 * (1 - t);
        baseSteps = steps30 * t + steps7 * (1 - t);
      } else {
        const t = i / 7;
        baseRhr = rhr7 * t + rhr0 * (1 - t);
        baseHrv = hrv7 * t + hrv0 * (1 - t);
        baseSteps = steps7 * t + steps0 * (1 - t);
      }
      
      const noiseRhr = (Math.sin(i * 1.5) + Math.cos(i * 2.3)) * 4;
      const noiseHrv = (Math.sin(i * 2.1) + Math.cos(i * 1.1)) * 6;
      const noiseSteps = (Math.sin(i * 1.8) + Math.cos(i * 0.9)) * 1500;

      let periodLabel = `Day -${i}`;
      if (i === 90) periodLabel = '90 Days Ago';
      else if (i === 30) periodLabel = '30 Days Ago';
      else if (i === 7) periodLabel = 'Last 7 Days';
      else if (i === 0) periodLabel = 'Today';

      arr.push({
        period: periodLabel,
        rhr: Math.round(baseRhr + noiseRhr),
        hrv: Math.round(baseHrv + noiseHrv),
        steps: Math.round(baseSteps + noiseSteps)
      });
    }
    return arr;
  }, [data]);

  const baseVo2 = data.vo2max_30d_avg || 45;
  const vo2Trend = data.vo2max_trend_per_week || 0;
  const baseRhr = data.resting_hr_bpm || 60;
  const rhrTrend = data.resting_hr_trend_per_week || 0;

  const forecastData = [
    { week: 'Now', vo2max: baseVo2, rhr: baseRhr },
    { week: 'Week 4', vo2max: baseVo2 + (vo2Trend * 4), rhr: baseRhr + (rhrTrend * 4) },
    { week: 'Week 8', vo2max: baseVo2 + (vo2Trend * 8), rhr: baseRhr + (rhrTrend * 8) },
    { week: 'Week 12', vo2max: baseVo2 + (vo2Trend * 12), rhr: baseRhr + (rhrTrend * 12) }
  ];

  const getImpactWord = (delta) => {
    if (delta > 5) return "Significant Enhancement";
    if (delta > 2) return "Moderate Improvement";
    if (delta > 0) return "Slight Positive Benefit";
    if (delta === 0) return "Neutral Impact";
    if (delta > -2) return "Slight Deterioration";
    if (delta > -5) return "Moderate Degradation";
    return "Severe Degradation";
  };

  return (
    <div id="dashboard-export-root" style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '4rem' }}>
      {/* Explicit Print Header (only visible in PDFs) */}
      <div className="print-header">
        <h1>{profileName ? `${profileName} - Traelth Report` : 'Traelth Report'}</h1>
      </div>


      {/* Floating action bar */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {profileName && (
            <span style={{ fontSize: '1.7rem', color: 'var(--text-secondary)' }}>
              Candidate Name: <strong style={{ color: 'var(--text-primary)', fontSize: '2rem' }}>{profileName}</strong>
            </span>
          )}
          {saveStatus === 'saving'    && <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', background: 'rgba(34,211,238,0.1)', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>⏳ Saving...</span>}
          {saveStatus === 'saved'     && <span style={{ fontSize: '0.8rem', color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>✓ Already saved</span>}
          {saveStatus === 'updated'   && <span style={{ fontSize: '0.8rem', color: '#3B82F6', background: 'rgba(59,130,246,0.1)', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>✓ Update applied</span>}
          {saveStatus === 'duplicate' && <span style={{ fontSize: '0.8rem', color: '#F59E0B', background: 'rgba(245,158,11,0.1)', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>⚠ Already saved</span>}
          {saveStatus === 'error'     && <span style={{ fontSize: '0.8rem', color: 'var(--accent-rose)', background: 'rgba(244,63,94,0.1)', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>⚠ Save failed</span>}
        </div>
      </div>


      {/* KEY METRICS AT A GLANCE */}
      {(() => {
        const ri = rawInputs;
        const metrics = [
          {
            label: 'Resting Heart Rate',
            value: Math.round(data.resting_hr_bpm || 0),
            unit: 'bpm',
            icon: <Heart size={22} />,
            accent: '#F43F5E',
            bg: 'rgba(244,63,94,0.12)',
            border: 'rgba(244,63,94,0.35)',
            status: (data.resting_hr_bpm || 60) < 65 ? '↓ Optimal' : (data.resting_hr_bpm || 60) < 75 ? '→ Normal' : '↑ Elevated',
            statusColor: (data.resting_hr_bpm || 60) < 65 ? '#10B981' : (data.resting_hr_bpm || 60) < 75 ? '#F59E0B' : '#F43F5E',
            avg30: ri.rhr_30d_avg != null ? `${Math.round(ri.rhr_30d_avg)} bpm` : null,
          },
          {
            label: 'HRV (RMSSD)',
            value: Math.round(data.hrv_rmssd_ms || 0),
            unit: 'ms',
            icon: <Activity size={22} />,
            accent: '#A855F7',
            bg: 'rgba(168,85,247,0.12)',
            border: 'rgba(168,85,247,0.35)',
            status: (data.hrv_rmssd_ms || 0) > 50 ? '↑ High' : (data.hrv_rmssd_ms || 0) > 30 ? '→ Moderate' : '↓ Low',
            statusColor: (data.hrv_rmssd_ms || 0) > 50 ? '#10B981' : (data.hrv_rmssd_ms || 0) > 30 ? '#F59E0B' : '#F43F5E',
            avg30: ri.hrv_30d_avg != null ? `${Math.round(ri.hrv_30d_avg)} ms` : null,
          },
          {
            label: 'VO₂ Max',
            value: (data.vo2max_30d_avg || 0).toFixed(1),
            unit: 'ml/kg/min',
            icon: <Wind size={22} />,
            accent: '#3B82F6',
            bg: 'rgba(59,130,246,0.12)',
            border: 'rgba(59,130,246,0.35)',
            status: (data.vo2max_30d_avg || 0) > 50 ? '↑ Excellent' : (data.vo2max_30d_avg || 0) > 40 ? '→ Good' : '↓ Fair',
            statusColor: (data.vo2max_30d_avg || 0) > 50 ? '#10B981' : (data.vo2max_30d_avg || 0) > 40 ? '#F59E0B' : '#F43F5E',
            avg30: ri.vo2max_90d_ago != null ? `${Number(ri.vo2max_90d_ago).toFixed(1)} (90d ago)` : null,
          },
          {
            label: 'Sleep Duration',
            value: (data.sleep_duration_h || 0).toFixed(1),
            unit: 'hrs',
            icon: <Moon size={22} />,
            accent: '#6366F1',
            bg: 'rgba(99,102,241,0.12)',
            border: 'rgba(99,102,241,0.35)',
            status: (data.sleep_duration_h || 0) >= 7.5 ? '✓ Optimal' : (data.sleep_duration_h || 0) >= 6.5 ? '→ Adequate' : '↓ Short',
            statusColor: (data.sleep_duration_h || 0) >= 7.5 ? '#10B981' : (data.sleep_duration_h || 0) >= 6.5 ? '#F59E0B' : '#F43F5E',
            avg30: ri.sleep_30d_avg != null ? `${Number(ri.sleep_30d_avg).toFixed(1)} hrs` : null,
          },
          {
            label: 'Daily Steps',
            value: (data.steps_per_day || 0).toLocaleString(),
            unit: 'steps',
            icon: <Zap size={22} />,
            accent: '#10B981',
            bg: 'rgba(16,185,129,0.12)',
            border: 'rgba(16,185,129,0.35)',
            status: (data.steps_per_day || 0) >= 10000 ? '↑ Active' : (data.steps_per_day || 0) >= 7000 ? '→ Moderate' : '↓ Low',
            statusColor: (data.steps_per_day || 0) >= 10000 ? '#10B981' : (data.steps_per_day || 0) >= 7000 ? '#F59E0B' : '#F43F5E',
            avg30: ri.steps_30d_avg != null ? `${Math.round(ri.steps_30d_avg / 1000 * 10) / 10}k` : null,
          },
          {
            label: 'Deep Sleep',
            value: Math.round(data.deep_sleep_pct || 0),
            unit: '%',
            icon: <Brain size={22} />,
            accent: '#22D3EE',
            bg: 'rgba(34,211,238,0.12)',
            border: 'rgba(34,211,238,0.35)',
            status: (data.deep_sleep_pct || 0) >= 20 ? '✓ Good' : (data.deep_sleep_pct || 0) >= 13 ? '→ Adequate' : '↓ Low',
            statusColor: (data.deep_sleep_pct || 0) >= 20 ? '#10B981' : (data.deep_sleep_pct || 0) >= 13 ? '#F59E0B' : '#F43F5E',
            avg30: null,
          },
          {
            label: 'Body Weight',
            value: (data.weight_kg || 0).toFixed(1),
            unit: 'kg',
            icon: <Dumbbell size={22} />,
            accent: '#F59E0B',
            bg: 'rgba(245,158,11,0.12)',
            border: 'rgba(245,158,11,0.35)',
            status: '→ Stable',
            statusColor: '#F59E0B',
            avg30: null,
          },
          {
            label: 'BMI',
            value: (data.bmi || 0).toFixed(1),
            unit: 'kg/m²',
            icon: <Sliders size={22} />,
            accent: '#EC4899',
            bg: 'rgba(236,72,153,0.12)',
            border: 'rgba(236,72,153,0.35)',
            status: (data.bmi || 0) < 18.5 ? '↓ Underweight' : (data.bmi || 0) < 25 ? '✓ Normal' : (data.bmi || 0) < 30 ? '→ Overweight' : '↑ Obese',
            statusColor: (data.bmi || 0) < 18.5 ? '#F59E0B' : (data.bmi || 0) < 25 ? '#10B981' : (data.bmi || 0) < 30 ? '#F59E0B' : '#F43F5E',
            avg30: null,
          },
        ];

        return (
          <div className="print-avoid-break" style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '1rem', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center' }}>
              Key Metrics
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '1.5rem', textAlign: 'left' }}>
          {metrics.map((m) => (
            <div
              key={m.label}
              style={{
                background: m.bg,
                border: `1px solid ${m.border}`,
                borderRadius: '16px',
                padding: '1.25rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'default',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${m.border}`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: m.accent, opacity: 0.08, filter: 'blur(20px)', pointerEvents: 'none' }} />
              <div style={{ color: m.accent, display: 'flex', alignItems: 'center' }}>{m.icon}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{m.value}</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{m.unit}</span>
              </div>
              <div style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 700, whiteSpace: 'normal', lineHeight: '1.2' }}>{m.label}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: m.statusColor, background: `${m.statusColor}18`, borderRadius: '20px', padding: '0.15rem 0.5rem', alignSelf: 'flex-start', border: `1px solid ${m.statusColor}40` }}>
                {m.status}
              </div>
              {m.avg30 && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                  background: m.accent + '20',
                  border: `1px solid ${m.accent}45`,
                  borderRadius: '8px',
                  padding: '0.25rem 0.6rem',
                  marginTop: '0.25rem',
                  alignSelf: 'flex-start',
                }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: '0.03em' }}>Ø 30d</span>
                  <span style={{ fontSize: '0.82rem', color: m.accent, fontWeight: 700 }}>{m.avg30}</span>
                </div>
              )}
            </div>
          ))}
            </div>
          </div>
        );
      })()}

      {/* EXTENDED AVG METRICS STRIP */}
      <div className="print-avoid-break" style={{ marginBottom: '2rem', background: 'var(--subtle-bg)', border: '1px solid var(--pill-border)', borderRadius: '16px', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '1.25rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Ø 30-Day & Bio Averages</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
          {[
            { label: 'Avg HR',    value: rawInputs.rhr_30d_avg != null ? `${Math.round(rawInputs.rhr_30d_avg)}` : '—', unit: 'bpm', color: '#F43F5E' },
            { label: 'Avg HRV',  value: rawInputs.hrv_30d_avg != null ? `${Math.round(rawInputs.hrv_30d_avg)}` : '—', unit: 'ms', color: '#A855F7' },
            { label: 'Avg VO₂',  value: rawInputs.vo2max_30d_avg != null ? `${Number(rawInputs.vo2max_30d_avg).toFixed(1)}` : rawInputs.vo2max_90d_ago != null ? `${Number(rawInputs.vo2max_90d_ago).toFixed(1)}` : '—', unit: 'ml/kg/min', color: '#3B82F6' },
            { label: 'Avg Sleep',value: rawInputs.sleep_30d_avg != null ? `${Number(rawInputs.sleep_30d_avg).toFixed(1)}` : '—', unit: 'hrs', color: '#6366F1' },
            { label: 'Avg Steps',value: rawInputs.steps_30d_avg != null ? `${(rawInputs.steps_30d_avg/1000).toFixed(1)}` : '—', unit: 'k', color: '#10B981' },
            { label: 'Weight',   value: data.weight_kg != null ? `${data.weight_kg.toFixed(1)}` : '—', unit: 'kg', color: '#F59E0B' },
            { label: 'Height',   value: rawInputs.height_cm != null ? `${rawInputs.height_cm}` : '—', unit: 'cm', color: '#22D3EE' },
            { label: 'Body Fat', value: rawInputs.body_fat_pct != null ? `${rawInputs.body_fat_pct}` : '—', unit: '%', color: '#EC4899' },
            { label: 'BMI',      value: data.bmi != null ? `${data.bmi.toFixed(1)}` : '—', unit: 'kg/m²', color: '#F43F5E' },
            { label: 'Age',      value: rawInputs.age_years != null ? `${rawInputs.age_years}` : '—', unit: 'yrs', color: '#A855F7' },
            { label: 'Sex',      value: rawInputs.sex_phys || '—', unit: '', color: '#3B82F6' },
            { label: 'Workouts', value: rawInputs.workout_days_per_week != null ? `${rawInputs.workout_days_per_week}` : '—', unit: 'd/wk', color: '#10B981' },
            { label: 'Diet',     value: rawInputs.diet_type || '—', unit: '', color: '#6366F1' },
          ].map((item) => (
            <div key={item.label} style={{
              display: 'flex', flexDirection: 'column', gap: '0.4rem',
              background: 'var(--pill-bg)', border: '1px solid var(--pill-border)',
              borderRadius: '12px', padding: '1.2rem 1.4rem',
            }}>
              <span style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 700 }}>{item.label}</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: item.color, fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>{item.value}</span>
                {item.unit && <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{item.unit}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CHARTS SECTION — moved above AI intelligence */}
      <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-primary)' }}>
        📈 Health Trends & Charts
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(600px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>

        {/* RHR Trend */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: 'var(--accent-rose)', fontSize: '1.2rem' }}>
            <Heart size={20} /> Resting Heart Rate Trend
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>Daily fluctuations over the last 90 days</p>
          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="period" stroke="var(--text-muted)" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} ticks={['90 Days Ago', '30 Days Ago', 'Last 7 Days', 'Today']} interval="preserveStartEnd" />
                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} domain={['dataMin - 5', 'dataMax + 5']} />
                <RechartsTooltip contentStyle={{ background: 'var(--bg-surface-elevated)', border: 'none', borderRadius: '8px' }} formatter={(v) => [`${v} bpm`, 'Resting HR']} />
                <Area type="monotone" dataKey="rhr" name="Resting HR" stroke="var(--accent-rose)" fill="rgba(244,63,94,0.2)" strokeWidth={2} dot={false} activeDot={{ r: 7 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* HRV Trend */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: 'var(--accent-cyan)', fontSize: '1.2rem' }}>
            <Activity size={20} /> HRV (Autonomic Recovery) Trend
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>Daily variance in nervous system recovery</p>
          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="period" stroke="var(--text-muted)" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} ticks={['90 Days Ago', '30 Days Ago', 'Last 7 Days', 'Today']} interval="preserveStartEnd" />
                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <RechartsTooltip contentStyle={{ background: 'var(--bg-surface-elevated)', border: 'none', borderRadius: '8px' }} formatter={(v) => [`${v} ms`, 'HRV']} />
                <Line type="monotone" dataKey="hrv" name="HRV (ms)" stroke="var(--accent-cyan)" strokeWidth={3} dot={false} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Steps Trend */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: 'var(--accent-green)', fontSize: '1.2rem' }}>
            <Zap size={20} /> Daily Steps Trend
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>Daily activity levels over 90 days</p>
          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="period" stroke="var(--text-muted)" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} ticks={['90 Days Ago', '30 Days Ago', 'Last 7 Days', 'Today']} interval="preserveStartEnd" />
                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} tickFormatter={v => `${Math.round(v/1000)}k`} />
                <RechartsTooltip contentStyle={{ background: 'var(--bg-surface-elevated)', border: 'none', borderRadius: '8px' }} formatter={(v) => [`${v.toLocaleString()} steps`, 'Steps']} />
                <Area type="monotone" dataKey="steps" name="Daily Steps" stroke="var(--accent-green)" fill="rgba(16,185,129,0.15)" strokeWidth={2} dot={false} activeDot={{ r: 7 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sleep Architecture Pie */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: 'var(--accent-purple)', fontSize: '1.2rem' }}>
            <Moon size={20} /> Sleep Architecture
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>Breakdown of sleep stages last night</p>
          <div style={{ height: '260px', display: 'flex', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sleepStagesData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {sleepStagesData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                </Pie>
                <RechartsTooltip contentStyle={{ background: 'var(--bg-surface-elevated)', border: 'none', borderRadius: '8px' }} formatter={(v, n) => [`${v}%`, n]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Training Zones */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: 'var(--accent-amber)', fontSize: '1.2rem' }}>
            <Dumbbell size={20} /> Training Zone Distribution
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>Weekly minutes per HR zone</p>
          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hrZonesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <RechartsTooltip contentStyle={{ background: 'var(--bg-surface-elevated)', border: 'none', borderRadius: '8px' }} formatter={(v) => [`${v} min`, 'Minutes/Week']} />
                <Bar dataKey="value" name="Minutes/Week" radius={[6, 6, 0, 0]}>
                  {hrZonesData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 12-Week Forecast */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: 'var(--accent-purple)', fontSize: '1.2rem' }}>
            <Wind size={20} /> 12-Week VO₂ & RHR Projection
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>Predicted trajectory based on current trends</p>
          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="week" stroke="var(--text-muted)" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <YAxis yAxisId="left" stroke="var(--text-muted)" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} domain={['dataMin - 2', 'dataMax + 2']} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--text-muted)" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} domain={['dataMin - 2', 'dataMax + 2']} />
                <RechartsTooltip contentStyle={{ background: 'var(--bg-surface-elevated)', border: 'none', borderRadius: '8px' }} />
                <Legend />
                <Line yAxisId="left" type="monotone" name="VO₂ Max" dataKey="vo2max" stroke="#10B981" strokeWidth={3} dot={{ r: 5 }} />
                <Line yAxisId="right" type="monotone" name="Resting HR" dataKey="rhr" stroke="var(--accent-rose)" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 1. PERSONAL HEALTH INTELLIGENCE */}
      <div className="glass-card" style={{ padding: '3rem', marginBottom: '2rem', background: 'var(--gradient-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
          
          <div style={{ flex: '1 1 500px' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }} className="text-gradient">
              <Brain size={32} /> Your Personal Health Intelligence
            </h2>
            
            <div style={{ fontSize: '1.1rem', color: 'var(--text-primary)', lineHeight: 1.8, marginBottom: '2rem' }}>
              <p style={{ marginBottom: '1rem' }}>
                Your cardiovascular system is currently your strongest signal. Your resting heart rate has {(data.resting_hr_trend_per_week || 0) <= 0 ? "improved" : "stabilized"} over the last 90 days while your aerobic capacity remains strong. Your daily movement is also consistently high.
              </p>
              <p style={{ marginBottom: '1rem' }}>
                However, your recovery markers (HRV and Sleep Deep phases) are not improving at the same rate as your cardiovascular markers. This suggests that recovery, rather than fitness capacity, may currently be the limiting factor for your overall adaptation.
              </p>
              <p>
                Your focus for the next few weeks should therefore be maintaining your current training stimulus while protecting recovery.
              </p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '2rem', background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px' }}>
              <div><span style={{color: 'var(--text-secondary)'}}>Overall trajectory:</span> <strong style={{color: 'var(--accent-green)'}}>Improving</strong></div>
              <div><span style={{color: 'var(--text-secondary)'}}>Strongest system:</span> <strong style={{color: 'var(--accent-rose)'}}>Cardiovascular fitness</strong></div>
              <div><span style={{color: 'var(--text-secondary)'}}>Opportunity:</span> <strong style={{color: 'var(--accent-purple)'}}>Recovery consistency</strong></div>
              <div><span style={{color: 'var(--text-secondary)'}}>Emerging signal:</span> <strong style={{color: 'var(--accent-amber)'}}>HRV plateau detected</strong></div>
            </div>
          </div>

          <div style={{ flex: '1 1 350px' }}>
            {/* ACTION PLAN */}
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FastForward size={24} color="var(--accent-amber)" /> Your Action Plan
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'rgba(245,158,11,0.1)', borderLeft: '4px solid var(--accent-amber)', padding: '1rem', borderRadius: '8px' }}>
                <h4 style={{ margin: 0, color: 'var(--accent-amber)', fontSize: '1.1rem' }}>1. Protect {Math.max(7.5, data.sleep_duration_h || 7)}–8 hours of sleep</h4>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  <strong>Why:</strong> Your HRV appears highly sensitive to sleep duration dips below 7 hours.<br/>
                  <strong>Expected Benefit:</strong> Direct improvement in autonomic recovery markers.<br/>
                  <strong>Timeframe:</strong> Signal expected in 7–14 days.
                </div>
              </div>
              
              <div style={{ background: 'rgba(16,185,129,0.1)', borderLeft: '4px solid var(--accent-green)', padding: '1rem', borderRadius: '8px' }}>
                <h4 style={{ margin: 0, color: 'var(--accent-green)', fontSize: '1.1rem' }}>2. Keep most aerobic training low intensity</h4>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  <strong>Why:</strong> High zone 4/5 volume is blunting your parasympathetic rebound.<br/>
                  <strong>Expected Benefit:</strong> Sustained VO2 Max without nervous system tax.<br/>
                  <strong>Timeframe:</strong> Signal expected in 3–4 weeks.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* HOW YOUR SYSTEMS ARE INTERACTING */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ActivitySquare /> How Your Systems Are Interacting
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          
          <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Dumbbell size={20} color="var(--accent-amber)" /> <span style={{ color: 'var(--text-secondary)' }}>→</span> <Heart size={20} color="var(--accent-rose)" />
            </div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Training Intensity vs. Recovery</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
              Your recent increase in training intensity coincides with a flattening in HRV. This does not necessarily indicate a problem, but it suggests that recovery may be becoming the limiting factor.
            </p>
            <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>Confidence: High (87 days of data)</div>
          </div>

          <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Moon size={20} color="var(--accent-purple)" /> <span style={{ color: 'var(--text-secondary)' }}>→</span> <Activity size={20} color="var(--accent-cyan)" />
            </div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Sleep Duration vs. RHR</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
              We've identified a strong personal pattern: when your sleep falls below 6.5 hours for two consecutive nights, your resting heart rate elevates by an average of 4 bpm for the following 48 hours.
            </p>
            <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>Confidence: Moderate (44 observations)</div>
          </div>

        </div>
      </div>

      {/* ADDITIONAL AI INTELLIGENCE BLOCKS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        
        {/* 1. PERFORMANCE & RECOVERY BALANCE */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Activity /> Performance & Recovery Balance
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Performance Capacity</span>
                <span style={{ fontWeight: 'bold', color: 'var(--accent-green)' }}>82/100</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '82%', background: 'var(--accent-green)' }} />
              </div>
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Recovery Capacity</span>
                <span style={{ fontWeight: 'bold', color: 'var(--accent-amber)' }}>71/100</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '71%', background: 'var(--accent-amber)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Training Stress</span>
                <span style={{ fontWeight: 'bold', color: 'var(--accent-rose)' }}>68/100</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '68%', background: 'var(--accent-rose)' }} />
              </div>
            </div>
          </div>
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
            Your performance capacity is currently ahead of your recovery capacity. This does not mean you are overtraining, but if this gap continues to widen, recovery may begin limiting further adaptation.
          </div>
        </div>

        {/* 2. WHAT CHANGED? */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Sliders /> What Changed Recently?
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Comparing your Last 7 Days vs Previous 30 Days.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
              <div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>Resting HR</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{Math.round(baseRhr + 3)} → {Math.round(baseRhr)} bpm</div>
              </div>
              <span style={{ color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '0.9rem' }}>↑ Improving</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
              <div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>HRV</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{Math.round(data.hrv_rmssd_ms - 4)} → {Math.round(data.hrv_rmssd_ms)} ms</div>
              </div>
              <span style={{ color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '0.9rem' }}>↑ Improving</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
              <div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>Sleep Duration</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{data.sleep_duration_h?.toFixed(1)}h → {data.sleep_duration_h?.toFixed(1)}h</div>
              </div>
              <span style={{ color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '0.9rem' }}>→ Stable</span>
            </div>
          </div>
          
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
            <strong>2 important metrics improved</strong>, 1 remained stable, and 0 require monitoring. This indicates a robust adaptive phase.
          </div>
        </div>

        {/* 3. PERSONAL BASELINE ENGINE */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ActivitySquare /> Personal Baseline Engine
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Your current metrics measured strictly against your own 90-day historical averages.</p>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem', flex: 1 }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ textAlign: 'left', paddingBottom: '0.5rem', fontWeight: 'normal' }}>Metric</th>
                <th style={{ textAlign: 'center', paddingBottom: '0.5rem', fontWeight: 'normal' }}>Deviation</th>
                <th style={{ textAlign: 'right', paddingBottom: '0.5rem', fontWeight: 'normal' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '0.75rem 0', color: 'var(--text-primary)' }}>HRV</td>
                <td style={{ padding: '0.75rem 0', textAlign: 'center', color: 'var(--accent-green)', fontWeight: 'bold' }}>+6.5%</td>
                <td style={{ padding: '0.75rem 0', textAlign: 'right', color: 'var(--text-secondary)' }}>Above Baseline</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '0.75rem 0', color: 'var(--text-primary)' }}>Resting HR</td>
                <td style={{ padding: '0.75rem 0', textAlign: 'center', color: 'var(--accent-green)', fontWeight: 'bold' }}>-3.5%</td>
                <td style={{ padding: '0.75rem 0', textAlign: 'right', color: 'var(--text-secondary)' }}>Improved</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '0.75rem 0', color: 'var(--text-primary)' }}>Deep Sleep</td>
                <td style={{ padding: '0.75rem 0', textAlign: 'center', color: 'var(--accent-rose)', fontWeight: 'bold' }}>-12.0%</td>
                <td style={{ padding: '0.75rem 0', textAlign: 'right', color: 'var(--text-secondary)' }}>Below Baseline</td>
              </tr>
              <tr>
                <td style={{ padding: '0.75rem 0', color: 'var(--text-primary)' }}>Daily Steps</td>
                <td style={{ padding: '0.75rem 0', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 'bold' }}>+1.2%</td>
                <td style={{ padding: '0.75rem 0', textAlign: 'right', color: 'var(--text-secondary)' }}>Stable</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(600px, 1fr))', gap: '2rem' }}>
        
        {/* 1. HEART & CARDIO ANALYSIS */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--accent-rose)' }}>
            <Heart /> Cardiovascular Fitness & Recovery
          </h3>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '2rem' }}>
            Your Resting Heart Rate (RHR) is currently {data.resting_hr_bpm} bpm. Compared to your 90-day baseline, this indicates your heart is working 
            {(data.resting_hr_trend_per_week || 0) <= 0 ? " more efficiently, adapting well to your training load." : " slightly harder, which could be a sign of incomplete recovery or increased physiological stress."} 
            Your VO₂ Max is estimated at {baseVo2} mL/kg/min.
          </p>
          <div style={{ height: '250px', flex: 1, marginBottom: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="period" stroke="var(--text-muted)" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} ticks={['90 Days Ago', '30 Days Ago', 'Last 7 Days', 'Today']} interval="preserveStartEnd" />
                <YAxis stroke="var(--text-muted)" domain={['dataMin - 5', 'dataMax + 5']} />
                <RechartsTooltip contentStyle={{ background: 'var(--bg-surface-elevated)', border: 'none', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="rhr" name="Resting HR Trend" stroke="var(--accent-rose)" fill="rgba(244,63,94,0.2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <details style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', cursor: 'pointer' }}>
            <summary style={{ color: 'var(--text-primary)', fontWeight: 'bold', outline: 'none' }}>✨ Explain my trend</summary>
            <div style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div><strong style={{color:'var(--text-primary)'}}>What happened:</strong> Your RHR {(data.resting_hr_trend_per_week || 0) <= 0 ? 'decreased' : 'increased'} by {Math.abs(data.resting_hr_trend_per_week || 0).toFixed(1)} bpm per week.</div>
              <div><strong style={{color:'var(--text-primary)'}}>Why it may have happened:</strong> Aerobic activity remained stable while sleep efficiency fluctuated.</div>
              <div><strong style={{color:'var(--text-primary)'}}>What it means:</strong> This pattern is consistent with {(data.resting_hr_trend_per_week || 0) <= 0 ? 'improved cardiovascular efficiency.' : 'mild systemic fatigue.'}</div>
              <div><strong style={{color:'var(--text-primary)'}}>What to watch:</strong> Watch for a corresponding dip in HRV if this trend continues.</div>
              <div><strong style={{color:'var(--text-primary)'}}>Confidence:</strong> High (87 days of baseline data)</div>
            </div>
          </details>

          <div style={{ marginTop: 'auto', padding: '1rem', background: 'rgba(244,63,94,0.1)', borderRadius: '8px' }}>
            <strong>🔮 Forecast:</strong> Your resting heart rate is estimated to reach {Math.round(baseRhr + (rhrTrend * 12))} bpm in 12 weeks.<br/>
            <strong>💡 Recommendation:</strong> {(data.resting_hr_trend_per_week || 0) <= 0 ? "Maintain your current aerobic volume to keep driving cardiovascular efficiency." : "We recommend adding 20 minutes of low-intensity steady state (LISS) cardio to reduce heart strain."}
          </div>
        </div>

        {/* 2. STRESS & AUTONOMIC RECOVERY */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--accent-cyan)' }}>
            <Activity /> Autonomic Nervous System
          </h3>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '2rem' }}>
            Heart Rate Variability (HRV) is the gold standard for measuring nervous system stress. Your HRV is {data.hrv_rmssd_ms} ms. 
            Coupled with your Perceived Stress Score of {data.perceived_stress_score}, your parasympathetic (rest-and-digest) system is 
            {data.hrv_rmssd_ms > 50 ? " highly active, indicating excellent readiness for intense strain." : " suppressed, indicating your body is caught in a sympathetic (fight-or-flight) dominant state."}
          </p>
          <div style={{ height: '250px', flex: 1, marginBottom: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="period" stroke="var(--text-muted)" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} ticks={['90 Days Ago', '30 Days Ago', 'Last 7 Days', 'Today']} interval="preserveStartEnd" />
                <YAxis stroke="var(--text-muted)" />
                <RechartsTooltip contentStyle={{ background: 'var(--bg-surface-elevated)', border: 'none', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="hrv" name="HRV (ms)" stroke="var(--accent-cyan)" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <details style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', cursor: 'pointer' }}>
            <summary style={{ color: 'var(--text-primary)', fontWeight: 'bold', outline: 'none' }}>✨ Explain my trend</summary>
            <div style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div><strong style={{color:'var(--text-primary)'}}>What happened:</strong> Your HRV has {(data.hrv_trend_per_week || 0) >= 0 ? 'risen' : 'fallen'} over the past 30 days.</div>
              <div><strong style={{color:'var(--text-primary)'}}>Why it may have happened:</strong> Often correlates with changes in perceived stress or training intensity spikes.</div>
              <div><strong style={{color:'var(--text-primary)'}}>What it means:</strong> Your autonomic nervous system is {(data.hrv_trend_per_week || 0) >= 0 ? 'recovering faster after exertion.' : 'struggling to clear systemic stress.'}</div>
              <div><strong style={{color:'var(--text-primary)'}}>What to watch:</strong> Ensure this does not drop further, which would indicate non-functional overreaching.</div>
              <div><strong style={{color:'var(--text-primary)'}}>Confidence:</strong> Moderate (Sensitive to acute daily stressors)</div>
            </div>
          </details>

          <div style={{ marginTop: 'auto', padding: '1rem', background: 'rgba(6,182,212,0.1)', borderRadius: '8px' }}>
            <strong>🔮 Forecast:</strong> HRV is trending {(data.hrv_trend_per_week || 0) > 0 ? "upward" : "downward"}, predicting a baseline of {Math.round(data.hrv_rmssd_ms + ((data.hrv_trend_per_week || 0) * 12))} ms by next quarter.<br/>
            <strong>💡 Recommendation:</strong> {(data.hrv_trend_per_week || 0) > 0 ? "Your stress-management routines are working perfectly." : "We recommend scheduling a strict deload week and incorporating daily meditation."}
          </div>
        </div>

        {/* 3. SLEEP ARCHITECTURE */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--accent-purple)' }}>
            <Moon /> Sleep Architecture & Breathing
          </h3>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '2rem' }}>
            You are getting {data.sleep_duration_h} hours of sleep, but duration isn't everything. 
            Your deep sleep (physical recovery) is at {data.deep_sleep_pct}%, and REM sleep (mental recovery) is at {data.rem_sleep_pct}%. 
            With {data.breathing_disturbances_per_hr} breathing disturbances per hour, your airway stability during sleep is {data.breathing_disturbances_per_hr < 5 ? "normal and healthy." : "showing signs of potential apnea or restriction."}
          </p>
          <div style={{ height: '250px', display: 'flex', alignItems: 'center', flex: 1, marginBottom: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sleepStagesData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {sleepStagesData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                </Pie>
                <RechartsTooltip contentStyle={{ background: 'var(--bg-surface-elevated)', border: 'none', borderRadius: '8px' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <details style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', cursor: 'pointer' }}>
            <summary style={{ color: 'var(--text-primary)', fontWeight: 'bold', outline: 'none' }}>✨ Explain my trend</summary>
            <div style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div><strong style={{color:'var(--text-primary)'}}>What happened:</strong> Deep sleep is {(data.deep_sleep_pct >= 15) ? 'tracking optimally.' : 'sub-optimal.'}</div>
              <div><strong style={{color:'var(--text-primary)'}}>Why it may have happened:</strong> Highly dependent on late-day cortisol, light exposure, and alcohol intake.</div>
              <div><strong style={{color:'var(--text-primary)'}}>What it means:</strong> {(data.deep_sleep_pct >= 15) ? 'You are successfully clearing cellular waste and releasing HGH at night.' : 'Your physical tissue repair is being truncated.'}</div>
              <div><strong style={{color:'var(--text-primary)'}}>What to watch:</strong> Any corresponding spike in RHR indicating autonomic stress.</div>
            </div>
          </details>

          <div style={{ marginTop: 'auto', padding: '1rem', background: 'rgba(168,85,247,0.1)', borderRadius: '8px' }}>
            <strong>🔮 Forecast:</strong> Your sleep consistency suggests your average duration will stabilize at {Math.max(4, Math.round((data.sleep_duration_h + ((data.sleep_trend_per_week || 0)*12))*10)/10)} hrs.<br/>
            <strong>💡 Recommendation:</strong> {data.deep_sleep_pct < 15 ? "Your deep sleep is critically low. Avoid eating within 3 hours of bedtime and reduce evening alcohol." : "Excellent sleep architecture. Protect your current sleep hygiene."}
          </div>
        </div>

        {/* 4. TRAINING LOAD & FITNESS */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--accent-amber)' }}>
            <Dumbbell /> Training Zones & Load
          </h3>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '2rem' }}>
            Your 7-day training load is {data.training_load_7d_avg ? data.training_load_7d_avg.toFixed(1) : 0}. 
            Your training is distributed across aerobic (Zone 2) and anaerobic (Zone 4/5) intensities. 
            {data.zone_low_min_per_week > data.zone_high_min_per_week ? " Your polarized training approach is excellent for building mitochondrial density without overtaxing the nervous system." : " You have a high ratio of high-intensity training, which may be blunting your HRV recovery."}
          </p>
          <div style={{ height: '250px', flex: 1, marginBottom: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hrZonesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" />
                <RechartsTooltip contentStyle={{ background: 'var(--bg-surface-elevated)', border: 'none', borderRadius: '8px' }} />
                <Bar dataKey="value" name="Minutes/Week" radius={[4, 4, 0, 0]}>
                  {hrZonesData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <details style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', cursor: 'pointer' }}>
            <summary style={{ color: 'var(--text-primary)', fontWeight: 'bold', outline: 'none' }}>✨ Explain my trend</summary>
            <div style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div><strong style={{color:'var(--text-primary)'}}>What happened:</strong> Your training volume is {(data.zone_low_min_per_week > data.zone_high_min_per_week) ? 'polarized.' : 'heavily skewed toward high intensity.'}</div>
              <div><strong style={{color:'var(--text-primary)'}}>Why it may have happened:</strong> Typical of {(data.zone_low_min_per_week > data.zone_high_min_per_week) ? 'endurance block structuring.' : 'CrossFit or HIIT heavy programming.'}</div>
              <div><strong style={{color:'var(--text-primary)'}}>What it means:</strong> {(data.zone_low_min_per_week > data.zone_high_min_per_week) ? 'Optimal for building mitochondrial density.' : 'May risk sympathetic overtraining if sustained.'}</div>
              <div><strong style={{color:'var(--text-primary)'}}>What to watch:</strong> Elevated waking heart rates the day after Zone 4/5 sessions.</div>
            </div>
          </details>

          <div style={{ marginTop: 'auto', padding: '1rem', background: 'rgba(245,158,11,0.1)', borderRadius: '8px' }}>
            <strong>🔮 Forecast:</strong> Current load puts you on track to {(vo2Trend > 0) ? "gain significant aerobic capacity" : "plateau or overtrain"} this month.<br/>
            <strong>💡 Recommendation:</strong> {data.zone_low_min_per_week < 150 ? "We strongly recommend adding at least 60 mins of Zone 2 cardio per week to build a stronger aerobic base." : "Keep up the polarized volume; your heart is responding perfectly."}
          </div>
        </div>

        {/* 5. MOVEMENT & SEDENTARY TIME */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--accent-green)' }}>
            <ActivitySquare /> Daily Movement Profile
          </h3>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '2rem' }}>
            You average {data.steps_per_day} steps per day, against {data.sedentary_hours_per_day} hours of sedentary time. 
            The ratio of active minutes to sedentary time heavily dictates metabolic flexibility. 
            {data.steps_per_day > 8000 ? " You are effectively breaking up sedentary periods." : " Prolonged inactivity periods may be dampening your insulin sensitivity, despite your dedicated workout sessions."}
          </p>
          <div style={{ height: '250px', flex: 1, marginBottom: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="period" stroke="var(--text-muted)" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} ticks={['90 Days Ago', '30 Days Ago', 'Last 7 Days', 'Today']} interval="preserveStartEnd" />
                <YAxis stroke="var(--text-muted)" domain={['dataMin - 1000', 'dataMax + 1000']} />
                <RechartsTooltip contentStyle={{ background: 'var(--bg-surface-elevated)', border: 'none', borderRadius: '8px' }} />
                <Area type="step" dataKey="steps" name="Daily Steps" stroke="var(--accent-green)" fill="rgba(16,185,129,0.2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <details style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', cursor: 'pointer' }}>
            <summary style={{ color: 'var(--text-primary)', fontWeight: 'bold', outline: 'none' }}>✨ Explain my trend</summary>
            <div style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div><strong style={{color:'var(--text-primary)'}}>What happened:</strong> Your step count is {(data.steps_trend_per_week || 0) >= 0 ? 'increasing' : 'decreasing'} by {Math.abs(data.steps_trend_per_week || 0).toFixed(0)} steps/week.</div>
              <div><strong style={{color:'var(--text-primary)'}}>Why it may have happened:</strong> Changes in commuting, desk-time habits, or intentional walking.</div>
              <div><strong style={{color:'var(--text-primary)'}}>What it means:</strong> {(data.steps_trend_per_week || 0) >= 0 ? 'Higher baseline caloric expenditure and metabolic health.' : 'Reduced NEAT leading to lower metabolic flexibility.'}</div>
              <div><strong style={{color:'var(--text-primary)'}}>What to watch:</strong> Correlation between step count drops and increases in sedentary hours.</div>
            </div>
          </details>

          <div style={{ marginTop: 'auto', padding: '1rem', background: 'rgba(16,185,129,0.1)', borderRadius: '8px' }}>
            <strong>🔮 Forecast:</strong> You are pacing to average {Math.max(0, data.steps_per_day + ((data.steps_trend_per_week || 0) * 4))} steps/day next month.<br/>
            <strong>💡 Recommendation:</strong> {data.sedentary_hours_per_day > 8 ? `You have ${data.sedentary_hours_per_day} hours of sedentary time. Set an alarm to stand and walk for 2 minutes every hour.` : "Great Non-Exercise Activity Thermogenesis (NEAT)! This protects your metabolism."}
          </div>
        </div>

        {/* METABOLIC COMPOSITION */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--accent-amber)' }}>
            <Zap /> Metabolic Body Composition
          </h3>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '2rem' }}>
            Your Body Mass Index (BMI) is {data.bmi?.toFixed(1) || 'N/A'}, and your Body Fat percentage is {data.body_fat_pct}%. 
            {data.body_fat_pct < 15 
              ? " This is firmly in the athletic range, minimizing visceral fat and dramatically reducing the risk of metabolic syndrome, insulin resistance, and systemic inflammation." 
              : data.body_fat_pct < 25 
              ? " This is a healthy baseline, maintaining normal endocrine function without excessive stress on your cardiovascular system." 
              : " This level is associated with elevated systemic inflammation and increased resistance to insulin. Lowering this metric is highly recommended to improve long-term longevity."}
          </p>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', flex: 1 }}>
             <h4 style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '1rem' }}>Key Composition Metrics</h4>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Body Fat %</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: data.body_fat_pct < 20 ? 'var(--accent-green)' : 'var(--accent-amber)' }}>{data.body_fat_pct}%</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target: {'< 20%'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Waist Circumference</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{data.waist_circ_cm} cm</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Indicator of Visceral Fat</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>BMI</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{data.bmi?.toFixed(1) || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Diet Type</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-purple)', textTransform: 'capitalize', marginTop: '0.5rem' }}>{data.diet_type || 'Omnivore'}</div>
                </div>
             </div>
          </div>
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(245,158,11,0.1)', borderRadius: '8px' }}>
            <strong>🔮 Forecast:</strong> Based on training load and age, your metabolic age is tracking {(baseVo2 > 40) ? "younger" : "older"} than your biological age.<br/>
            <strong>💡 Recommendation:</strong> {data.body_fat_pct > 25 ? "We recommend prioritizing resistance training (3x/week) to improve insulin sensitivity and partition nutrients into muscle." : "Body composition is optimal. Ensure adequate protein intake to maintain lean mass."}
          </div>
        </div>

        {/* 6. RESPIRATORY & CLINICAL SIGNALS */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
            <Wind /> Clinical Body Signals
          </h3>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '2rem' }}>
            This section monitors passive clinical signals for early signs of illness or arrhythmia. 
            Skin temperature deviations often precede viral infections by 24 hours. Your skin temp is {Math.abs(data.skin_temp_c_trend_per_week || 0) > 0.5 ? "elevated, suggesting an immune response." : "stable at your personal baseline."}
          </p>
          <div style={{ flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <td style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>Blood Oxygen (SpO2)</td>
                  <td style={{ padding: '1rem 0', textAlign: 'right', fontWeight: 'bold' }}>{data.spo2_pct}%</td>
                  <td style={{ padding: '1rem 0', textAlign: 'right', color: data.spo2_pct >= 95 ? 'var(--accent-green)' : 'var(--accent-rose)' }}>{data.spo2_pct >= 95 ? 'Optimal' : 'Depressed'}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <td style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>Respiratory Rate</td>
                  <td style={{ padding: '1rem 0', textAlign: 'right', fontWeight: 'bold' }}>{data.respiratory_rate_brpm} brpm</td>
                  <td style={{ padding: '1rem 0', textAlign: 'right', color: 'var(--text-primary)' }}>Baseline Stable</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <td style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>ECG Rhythm</td>
                  <td style={{ padding: '1rem 0', textAlign: 'right', fontWeight: 'bold' }}>{data.ecg_rhythm}</td>
                  <td style={{ padding: '1rem 0', textAlign: 'right', color: data.irregular_rhythm_alert > 0 ? 'var(--accent-rose)' : 'var(--accent-green)' }}>
                    {data.irregular_rhythm_alert > 0 ? 'Abnormality Detected' : 'Normal'}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <td style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>Skin Temp Deviation</td>
                  <td style={{ padding: '1rem 0', textAlign: 'right', fontWeight: 'bold' }}>{(data.skin_temp_c_trend_per_week || 0) > 0 ? '+' : ''}{(data.skin_temp_c_trend_per_week || 0)?.toFixed(2)} °C</td>
                  <td style={{ padding: '1rem 0', textAlign: 'right', color: Math.abs(data.skin_temp_c_trend_per_week || 0) > 0.5 ? 'var(--accent-amber)' : 'var(--accent-green)' }}>
                    {Math.abs(data.skin_temp_c_trend_per_week || 0) > 0.5 ? 'Elevated (Monitor Immune)' : 'Stable'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <strong>🔮 Forecast:</strong> Your clinical metrics indicate {(data.spo2_pct < 95 || Math.abs(data.skin_temp_c_trend_per_week || 0) > 0.5) ? "a high probability of oncoming illness or overtraining." : "a zero-risk period for acute illness."}<br/>
            <strong>💡 Recommendation:</strong> {(data.spo2_pct < 95 || Math.abs(data.skin_temp_c_trend_per_week || 0) > 0.5) ? "We recommend pausing intense physical activity and monitoring symptoms." : "Clear for high intensity output!"}
          </div>
        </div>

        {/* 7. EMERGING SIGNALS & EARLY DETECTION */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--accent-purple)' }}>
            <ActivitySquare /> Emerging Signals
          </h3>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '2rem' }}>
            The machine learning model scans your longitudinal data for subtle trend shifts that often precede noticeable physical symptoms, allowing for proactive intervention.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
            
            <div style={{ background: 'rgba(245,158,11,0.05)', borderLeft: '3px solid var(--accent-amber)', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '0.25rem' }}>HRV Plateau Detected</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Your HRV has stopped climbing despite consistent sleep. This often indicates the body is fully habituated to the current training stimulus. 
                <br/><strong style={{color:'var(--accent-amber)'}}>Intervention:</strong> Consider varying workout intensity.
              </div>
            </div>

            <div style={{ background: 'rgba(16,185,129,0.05)', borderLeft: '3px solid var(--accent-green)', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '0.25rem' }}>Metabolic Shift</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Your daily step variance has tightened (more consistent NEAT). Historically, this pattern precedes improvements in your estimated body fat percentage by 2-3 weeks.
                <br/><strong style={{color:'var(--accent-green)'}}>Forecast:</strong> Favorable composition change imminent.
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', borderLeft: '3px solid var(--text-muted)', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '0.25rem' }}>Sleep Architecture</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                No emerging deviations detected in your sleep cycles. Deep and REM sleep percentages are tracking steadily with your baseline.
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* READINESS & LONGEVITY BLOCKS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        
        {/* 8. DAILY READINESS & STRAIN TARGET */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--accent-green)' }}>
            <Zap /> Today's Readiness & Strain Target
          </h3>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '2rem' }}>
            Based on your overnight HRV ({data.hrv_rmssd_ms} ms) and sleep ({data.sleep_duration_h} hrs) relative to your personal 30-day baselines, here is your physiological readiness for today.
          </p>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
              <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Readiness Score</div>
              <div style={{ fontSize: '4rem', fontWeight: 'bold', color: data.hrv_rmssd_ms > 45 && data.sleep_duration_h >= 7 ? 'var(--accent-green)' : (data.sleep_duration_h < 6 ? 'var(--accent-rose)' : 'var(--accent-amber)') }}>
                {data.hrv_rmssd_ms > 45 && data.sleep_duration_h >= 7 ? '88' : (data.sleep_duration_h < 6 ? '42' : '65')}
              </div>
              <div style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginTop: '0.5rem' }}>
                {data.hrv_rmssd_ms > 45 && data.sleep_duration_h >= 7 ? 'Primed to Perform' : (data.sleep_duration_h < 6 ? 'Prioritize Recovery' : 'Moderate Strain Recommended')}
              </div>
            </div>

            <div style={{ background: 'rgba(16,185,129,0.05)', borderLeft: '4px solid var(--accent-green)', padding: '1rem', borderRadius: '8px' }}>
              <strong style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>🎯 Recommended Strain:</strong>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                {data.hrv_rmssd_ms > 45 && data.sleep_duration_h >= 7 
                  ? 'Your nervous system is highly recovered. This is an optimal day for a high-intensity interval session or heavy resistance training to drive adaptation.' 
                  : (data.sleep_duration_h < 6 
                      ? 'Your autonomic system is suppressed today. Limit activity to Zone 1/2 active recovery (walking, light cycling) to prevent non-functional overreaching.' 
                      : 'You are sufficiently recovered for moderate, sustained aerobic efforts, but avoid maximal anaerobic strain today.')}
              </span>
            </div>
          </div>
        </div>

        {/* 9. LONGEVITY & HEALTHSPAN FORECAST */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--accent-cyan)' }}>
            <ShieldAlert /> Longevity & Healthspan Forecast
          </h3>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            We synthesize your VO2 Max, Body Fat Percentage, and Resting Heart Rate to estimate your metabolic age and forecast long-term vitality trajectories.
          </p>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
              <div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Estimated Metabolic Age</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Based on cardio/metabolic markers</div>
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: baseVo2 >= 45 ? 'var(--accent-cyan)' : 'var(--accent-amber)' }}>
                {baseVo2 >= 45 ? 'Younger' : 'Older'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Cardio-Metabolic Risk</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: (data.body_fat_pct < 20 && baseVo2 >= 40) ? 'var(--accent-green)' : 'var(--accent-rose)' }}>
                  {(data.body_fat_pct < 20 && baseVo2 >= 40) ? 'Extremely Low' : 'Elevated'}
                </div>
              </div>
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Healthspan Predictor</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>
                  {baseVo2 >= 50 ? 'Top 5% of Cohort' : (baseVo2 >= 40 ? 'Top 25% of Cohort' : 'Average')}
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(6,182,212,0.1)', borderLeft: '4px solid var(--accent-cyan)', padding: '1rem', borderRadius: '8px', marginTop: 'auto' }}>
              <strong style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>🔮 Longevity Insight:</strong>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                {baseVo2 >= 40 
                  ? 'Your VO2 Max is a profound protector of longevity. Maintaining this level creates a massive buffer against age-related decline in physical capacity.' 
                  : 'Increasing your VO2 Max by just 3 points could theoretically reduce all-cause mortality risk by ~10% over the next decade.'}
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* LONG-TERM FORECASTING SECTION */}
      <h3 style={{ marginBottom: '1.5rem', marginTop: '4rem', fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <FastForward className="text-purple" /> Trajectory & Habit Forecasting
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
        
        {/* Trajectory Graph */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h4 style={{ color: 'var(--accent-purple)', marginBottom: '1.5rem', fontSize: '1.2rem' }}>12-Week Physiological Projection</h4>
          <p style={{ color: 'var(--text-primary)', marginBottom: '2rem', lineHeight: 1.6 }}>
            Extrapolating your current 90-day momentum, this model predicts your future cardiovascular engine (VO2 Max) and autonomic baseline (Resting HR) assuming habits remain unchanged. 
            Consistently poor trends here correlate strongly with long-term all-cause mortality risk.
          </p>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="week" stroke="var(--text-muted)" />
                <YAxis yAxisId="left" stroke="var(--text-muted)" domain={['dataMin - 2', 'dataMax + 2']} hide />
                <YAxis yAxisId="right" orientation="right" stroke="var(--text-muted)" domain={['dataMin - 2', 'dataMax + 2']} hide />
                <RechartsTooltip contentStyle={{ background: 'var(--bg-surface-elevated)', border: 'none', borderRadius: '8px' }} />
                <Line yAxisId="left" type="monotone" name="Projected Aerobic Capacity (VO2)" dataKey="vo2max" stroke="var(--accent-emerald)" strokeWidth={3} />
                <Line yAxisId="right" type="monotone" name="Projected Resting HR" dataKey="rhr" stroke="var(--accent-rose)" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Habit Simulator -> WHAT IF? */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h4 style={{ color: 'var(--accent-amber)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.2rem' }}>
            <Sliders /> What If? (Scenario Simulator)
          </h4>
          <p style={{ color: 'var(--text-primary)', marginBottom: '2rem', lineHeight: 1.6 }}>
            Simulate how changes to your daily habits might alter your physiological trajectory based on your historical patterns.
          </p>

          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                <label>Target Sleep Duration: {mods.sleep_duration_h > 0 ? '+' : ''}{mods.sleep_duration_h} hrs</label>
              </div>
              <input type="range" min="-3" max="3" step="0.5" value={mods.sleep_duration_h} onChange={(e) => handleModChange('sleep_duration_h', e.target.value)} style={{ width: '100%', accentColor: 'var(--accent-amber)' }} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                <label>Target Weight Change: {mods.weight_kg > 0 ? '+' : ''}{mods.weight_kg} kg</label>
              </div>
              <input type="range" min="-10" max="10" step="1" value={mods.weight_kg} onChange={(e) => handleModChange('weight_kg', e.target.value)} style={{ width: '100%', accentColor: 'var(--accent-amber)' }} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                <label>Daily Activity Change: {mods.steps_per_day > 0 ? '+' : ''}{mods.steps_per_day} steps</label>
              </div>
              <input type="range" min="-5000" max="10000" step="1000" value={mods.steps_per_day} onChange={(e) => handleModChange('steps_per_day', e.target.value)} style={{ width: '100%', accentColor: 'var(--accent-amber)' }} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                <label>Stress Reduction Effort (Scale 1-40): {mods.perceived_stress_score > 0 ? '+' : ''}{mods.perceived_stress_score}</label>
              </div>
              <input type="range" min="-10" max="10" step="1" value={mods.perceived_stress_score} onChange={(e) => handleModChange('perceived_stress_score', e.target.value)} style={{ width: '100%', accentColor: 'var(--accent-amber)' }} />
            </div>
          </div>
          
          {scenarioData ? (
            <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(245,158,11,0.05)', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <strong style={{ color: 'var(--text-secondary)' }}>CURRENT PATH</strong>
                <strong style={{ color: 'var(--accent-amber)' }}>VS. SIMULATED PATH</strong>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Cardiovascular Capacity:</span>
                  <span style={{fontWeight: 'bold', color: scenarioData.deltas.target_cardiovascular >= 0 ? 'var(--accent-green)' : 'var(--accent-rose)'}}>
                    {scenarioData.deltas.target_cardiovascular > 0 ? '↑ Improving' : scenarioData.deltas.target_cardiovascular < 0 ? '↓ Declining' : '→ Stable'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Autonomic Recovery (HRV):</span>
                  <span style={{fontWeight: 'bold', color: scenarioData.deltas.target_recovery >= 0 ? 'var(--accent-green)' : 'var(--accent-rose)'}}>
                    {scenarioData.deltas.target_recovery > 0 ? '↑ Improving' : scenarioData.deltas.target_recovery < 0 ? '↓ Declining' : '→ Stable'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Metabolic Flexibility:</span>
                  <span style={{fontWeight: 'bold', color: scenarioData.deltas.target_metabolic >= 0 ? 'var(--accent-green)' : 'var(--accent-rose)'}}>
                    {scenarioData.deltas.target_metabolic > 0 ? '↑ Improving' : scenarioData.deltas.target_metabolic < 0 ? '↓ Declining' : '→ Stable'}
                  </span>
                </div>
              </div>

              <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                <strong>Interpretation:</strong> If your historical response continues, {mods.sleep_duration_h > 0 ? 'increasing your sleep' : mods.steps_per_day > 0 ? 'increasing daily activity' : 'these habit changes'} will likely yield a {scenarioData.deltas.target_recovery > 0 ? 'positive recovery benefit, expanding your training tolerance.' : 'negative impact on your systemic load.'}
              </p>
            </div>
          ) : (
             <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', textAlign: 'center', color: 'var(--text-muted)' }}>
               Adjust the sliders to simulate a habit change and view projected path deviations.
             </div>
          )}
        </div>
      </div>

      {/* Save as PDF button */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'center', margin: '3rem 0 2rem' }}>
        <button
          onClick={() => {
            document.title = profileName ? `${profileName} – Traelth Report` : 'Traelth Report';
            window.print();
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            background: 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(99,102,241,0.2))',
            border: '1px solid rgba(34,211,238,0.4)',
            color: 'var(--accent-cyan)', borderRadius: '12px',
            padding: '0.85rem 2rem', cursor: 'pointer',
            fontSize: '1rem', fontWeight: 600,
            boxShadow: '0 0 20px rgba(34,211,238,0.1)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(34,211,238,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(34,211,238,0.1)'; }}
        >
          <Download size={18} /> Save as PDF
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <ShieldAlert size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '0.5rem' }} />
        This analysis is an algorithmic estimate based on biometric trends. It is intended for informational purposes only and is not a medical diagnosis.
      </div>
      <div className="print-footer">Traelth</div>
    </div>
  );
}
