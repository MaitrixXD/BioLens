import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  FlaskConical, Upload, AlertCircle, ChevronDown, ChevronUp,
  BarChart2, Target, TrendingUp, Zap, Brain, Moon, Heart, Activity, Dumbbell,
  FileText, X, RotateCcw, Info,
} from 'lucide-react';

const TARGET_META = {
  target_cardiovascular: { label: 'Heart Health',     color: '#F43F5E', icon: Heart },
  target_metabolic:      { label: 'Metabolic Health', color: '#F59E0B', icon: Zap },
  target_recovery:       { label: 'Recovery',          color: '#A855F7', icon: RotateCcw },
  target_sleep:          { label: 'Sleep Quality',     color: '#6366F1', icon: Moon },
  target_stress:         { label: 'Stress Mgmt',       color: '#EC4899', icon: Brain },
  target_fitness:        { label: 'Fitness Level',     color: '#10B981', icon: Dumbbell },
  target_autonomic:      { label: 'Autonomic Bal.',    color: '#22D3EE', icon: Activity },
  target_readiness:      { label: 'Readiness',         color: '#3B82F6', icon: Target },
};

const TARGETS = Object.keys(TARGET_META);
const PAGE_SIZE = 25;

function scoreColor(val) {
  if (val == null) return 'var(--text-muted)';
  if (val >= 85) return '#10B981';
  if (val >= 70) return '#22D3EE';
  if (val >= 50) return '#F59E0B';
  if (val >= 30) return '#F97316';
  return '#F43F5E';
}

function errColor(err) {
  if (err == null) return 'var(--text-muted)';
  if (err <= 3)  return '#10B981';
  if (err <= 8)  return '#F59E0B';
  if (err <= 15) return '#F97316';
  return '#F43F5E';
}

function r2Color(r2) {
  if (r2 >= 0.9)  return '#10B981';
  if (r2 >= 0.75) return '#22D3EE';
  if (r2 >= 0.5)  return '#F59E0B';
  return '#F43F5E';
}

function AccuracyCard({ targetKey, metrics }) {
  const meta = TARGET_META[targetKey];
  const Icon = meta.icon;
  const { mae, r2, n, accuracy_pct } = metrics;
  const arc = Math.max(0, Math.min(1, r2));
  const circumference = 2 * Math.PI * 28;
  const dashOffset = circumference * (1 - arc);

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${meta.color}30`,
        borderRadius: '14px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = meta.color + '60'; e.currentTarget.style.boxShadow = `0 4px 20px ${meta.color}15`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = meta.color + '30'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{
        position: 'absolute', top: '-30px', right: '-30px',
        width: '120px', height: '120px', borderRadius: '50%',
        background: `radial-gradient(circle, ${meta.color}12, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{
          width: '30px', height: '30px', borderRadius: '8px',
          background: meta.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={15} color={meta.color} />
        </div>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{meta.label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          <circle
            cx="36" cy="36" r="28" fill="none"
            stroke={r2Color(r2)} strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform="rotate(-90 36 36)"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
          <text x="36" y="40" textAnchor="middle" fill={r2Color(r2)} fontSize="12" fontWeight="700" fontFamily="Outfit,sans-serif">
            {accuracy_pct.toFixed(1)}%
          </text>
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>R² Score</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: r2Color(r2) }}>{r2.toFixed(4)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Mean Abs Err</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: errColor(mae) }}>{mae.toFixed(2)}</div>
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{n} rows</div>
        </div>
      </div>
    </div>
  );
}

function RowResult({ result, expanded, onToggle }) {
  const hasGT = !!result.ground_truth;
  const isError = result.status === 'error';
  return (
    <div style={{
      background: isError ? 'rgba(244,63,94,0.05)' : 'rgba(255,255,255,0.02)',
      border: `1px solid ${isError ? 'rgba(244,63,94,0.2)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: '10px', overflow: 'hidden', marginBottom: '0.5rem',
    }}>
      <div onClick={onToggle} style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.75rem 1rem', cursor: 'pointer', userSelect: 'none',
      }}>
        <span style={{
          minWidth: '42px', textAlign: 'center', fontSize: '0.7rem', fontWeight: 700,
          color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)',
          borderRadius: '6px', padding: '0.15rem 0.4rem',
        }}>#{result.row}</span>
        {isError ? (
          <span style={{ color: '#F43F5E', fontSize: '0.85rem', flex: 1 }}>
            <AlertCircle size={13} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />{result.message}
          </span>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {TARGETS.map(t => {
              const pred = result.predicted?.[t];
              const err = result.error?.[t];
              return (
                <div key={t} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '50px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: scoreColor(pred) }}>
                    {pred != null ? pred.toFixed(1) : '—'}
                  </span>
                  {err != null && <span style={{ fontSize: '0.6rem', color: errColor(err) }}>±{err}</span>}
                  <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>{TARGET_META[t].label.split(' ')[0]}</span>
                </div>
              );
            })}
          </div>
        )}
        <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </span>
      </div>
      {expanded && !isError && (
        <div style={{ padding: '0.75rem 1rem 1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.6rem' }}>
            {TARGETS.map(t => {
              const meta = TARGET_META[t];
              const pred = result.predicted?.[t];
              const gt = result.ground_truth?.[t];
              const err = result.error?.[t];
              return (
                <div key={t} style={{
                  background: meta.color + '10', border: `1px solid ${meta.color}25`,
                  borderRadius: '8px', padding: '0.6rem 0.75rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                    <meta.icon size={12} color={meta.color} />
                    <span style={{ fontSize: '0.68rem', fontWeight: 600, color: meta.color }}>{meta.label}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Predicted</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: scoreColor(pred) }}>{pred != null ? pred.toFixed(1) : '—'}</div>
                    </div>
                    {gt != null && (
                      <>
                        <div>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Actual</div>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: scoreColor(gt) }}>{gt.toFixed(1)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Abs Err</div>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: errColor(err) }}>{err != null ? err.toFixed(2) : '—'}</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TestingPage() {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [page, setPage] = useState(0);
  const [filterStatus, setFilterStatus] = useState('all');
  const fileInputRef = useRef(null);

  const reset = () => {
    setFile(null); setResult(null); setError(null);
    setProgress(0); setExpandedRows({}); setPage(0);
  };

  const handleDrop = useCallback(e => {
    e.preventDefault(); setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.name.endsWith('.csv')) {
      setFile(dropped); setError(null); setResult(null);
    } else { setError('Please drop a valid CSV file.'); }
  }, []);

  const handleFileInput = e => {
    const picked = e.target.files[0];
    if (picked) { setFile(picked); setError(null); setResult(null); }
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true); setError(null); setResult(null); setProgress(0);
    const formData = new FormData();
    formData.append('file', file);
    try {
      let tick = 0;
      const interval = setInterval(() => {
        tick++;
        setProgress(p => Math.min(p + (tick < 10 ? 5 : tick < 30 ? 2 : 0.5), 88));
      }, 300);
      const res = await axios.post('http://localhost:5001/api/test-dataset', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => { setResult(res.data); setLoading(false); }, 400);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to connect to the backend.');
      setLoading(false);
    }
  };

  const allRows = result?.results || [];
  const filteredRows = filterStatus === 'all' ? allRows : allRows.filter(r => r.status === filterStatus);
  const totalPages = Math.ceil(filteredRows.length / PAGE_SIZE);
  const pageRows = filteredRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const toggleRow = rowNum => setExpandedRows(prev => ({ ...prev, [rowNum]: !prev[rowNum] }));

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }} className="text-gradient">
          <FlaskConical size={28} /> Testing Page
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          Upload a CSV dataset and run the Traelth model row-by-row to evaluate prediction accuracy.
        </p>
      </div>

      {!result && (
        <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
          {/* Drop Zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !file && fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? '#22D3EE' : file ? '#10B981' : 'rgba(255,255,255,0.12)'}`,
              borderRadius: '14px', padding: '3rem 2rem', textAlign: 'center',
              cursor: file ? 'default' : 'pointer',
              background: dragging ? 'rgba(34,211,238,0.05)' : file ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)',
              transition: 'all 0.25s ease',
            }}
          >
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileInput} style={{ display: 'none' }} />
            {file ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={28} color="#10B981" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#10B981', fontSize: '1.05rem' }}>{file.name}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.15rem' }}>
                    {(file.size / 1024).toFixed(1)} KB · ready to test
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); reset(); }} style={{
                  marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem',
                  background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)',
                  color: '#F43F5E', borderRadius: '8px', padding: '0.35rem 0.85rem',
                  cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
                }}>
                  <X size={12} /> Remove
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(34,211,238,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Upload size={28} color="#22D3EE" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem' }}>Drag & drop your CSV file here</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    or <span style={{ color: '#22D3EE', textDecoration: 'underline' }}>click to browse</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Info strip */}
          <div style={{
            marginTop: '1rem', padding: '0.75rem 1rem',
            background: 'rgba(34,211,238,0.05)', border: '1px solid rgba(34,211,238,0.12)',
            borderRadius: '10px', display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
          }}>
            <Info size={14} color="#22D3EE" style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Upload any CSV matching the Traelth schema. If ground-truth target columns are present the model will compute R² accuracy and MAE per domain.
            </p>
          </div>

          {error && (
            <div style={{
              marginTop: '1rem', padding: '0.85rem 1rem',
              background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)',
              borderRadius: '10px', color: '#F43F5E', fontSize: '0.9rem',
              display: 'flex', gap: '0.5rem', alignItems: 'center',
            }}>
              <AlertCircle size={15} />{error}
            </div>
          )}

          {loading && (
            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Processing dataset rows…</span>
                <span style={{ fontSize: '0.82rem', color: '#22D3EE', fontWeight: 600 }}>{Math.round(progress)}%</span>
              </div>
              <div style={{ height: '6px', borderRadius: '99px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '99px', width: `${progress}%`,
                  background: 'linear-gradient(90deg, #22D3EE, #6366F1)', transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!file || loading}
            style={{
              marginTop: '1.5rem', width: '100%', padding: '0.9rem 1.5rem', borderRadius: '12px', border: 'none',
              background: file && !loading ? 'linear-gradient(135deg, #22D3EE, #6366F1)' : 'rgba(255,255,255,0.06)',
              color: file && !loading ? '#fff' : 'var(--text-muted)',
              fontSize: '1rem', fontWeight: 700, cursor: file && !loading ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
              transition: 'all 0.2s ease',
              boxShadow: file && !loading ? '0 4px 20px rgba(34,211,238,0.3)' : 'none',
              fontFamily: 'Outfit, sans-serif',
            }}
          >
            {loading ? 'Running Model…' : <><FlaskConical size={18} /> Run Model Testing</>}
          </button>
        </div>
      )}

      {result && (
        <>
          {/* Summary Banner */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'center' }}>
            <div style={{ flex: '1 1 auto', display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
              {[
                { label: 'Total Rows',   value: result.total_rows,                          color: '#22D3EE' },
                { label: 'Processed',    value: result.processed,                           color: '#10B981' },
                { label: 'Failed',       value: result.failed,                               color: result.failed > 0 ? '#F43F5E' : 'var(--text-muted)' },
                { label: 'Ground Truth', value: result.has_ground_truth ? 'Yes ✓' : 'No',  color: result.has_ground_truth ? '#10B981' : '#F59E0B' },
              ].map(item => (
                <div key={item.label} style={{
                  display: 'flex', flexDirection: 'column',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px', padding: '0.6rem 1rem', minWidth: '100px',
                }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.label}</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 700, color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
            <button onClick={reset} style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-secondary)', borderRadius: '10px', padding: '0.6rem 1rem',
              cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
            }}>
              <Upload size={14} /> New Test
            </button>
          </div>

          {/* Accuracy Cards */}
          {result.has_ground_truth && Object.keys(result.accuracy_metrics).length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart2 size={18} color="#22D3EE" /> Model Accuracy Metrics
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.85rem' }}>
                {Object.entries(result.accuracy_metrics).map(([key, metrics]) => (
                  <AccuracyCard key={key} targetKey={key} metrics={metrics} />
                ))}
              </div>
              <div style={{
                marginTop: '1rem', padding: '0.65rem 1rem',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px', display: 'flex', flexWrap: 'wrap', gap: '1rem',
                fontSize: '0.72rem', color: 'var(--text-muted)',
              }}>
                <span><span style={{ color: '#10B981' }}>■</span> R² ≥ 0.90 Excellent</span>
                <span><span style={{ color: '#22D3EE' }}>■</span> R² ≥ 0.75 Good</span>
                <span><span style={{ color: '#F59E0B' }}>■</span> R² ≥ 0.50 Fair</span>
                <span><span style={{ color: '#F43F5E' }}>■</span> R² &lt; 0.50 Poor</span>
                <span style={{ marginLeft: 'auto' }}>MAE = Mean Absolute Error in score points (0–100 scale)</span>
              </div>
            </div>
          )}

          {/* Row-by-Row */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <TrendingUp size={18} color="#6366F1" /> Row-by-Row Results
              </h3>
              <div style={{ display: 'flex', gap: '0.4rem', marginLeft: 'auto' }}>
                {[
                  { key: 'all',   label: `All (${allRows.length})` },
                  { key: 'ok',    label: `OK (${allRows.filter(r => r.status === 'ok').length})` },
                  { key: 'error', label: `Errors (${allRows.filter(r => r.status === 'error').length})` },
                ].map(f => (
                  <button key={f.key} onClick={() => { setFilterStatus(f.key); setPage(0); }} style={{
                    padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600,
                    cursor: 'pointer', border: '1px solid',
                    borderColor: filterStatus === f.key ? '#6366F1' : 'rgba(255,255,255,0.1)',
                    background: filterStatus === f.key ? 'rgba(99,102,241,0.15)' : 'transparent',
                    color: filterStatus === f.key ? '#818CF8' : 'var(--text-secondary)',
                    transition: 'all 0.15s',
                  }}>{f.label}</button>
                ))}
              </div>
            </div>

            {/* Column labels */}
            <div style={{ display: 'flex', gap: '0.75rem', padding: '0.4rem 1rem', marginBottom: '0.4rem', alignItems: 'center' }}>
              <span style={{ minWidth: '42px', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Row</span>
              <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {TARGETS.map(t => (
                  <span key={t} style={{ minWidth: '50px', fontSize: '0.6rem', color: TARGET_META[t].color, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                    {TARGET_META[t].label.split(' ')[0]}
                  </span>
                ))}
              </div>
              <span style={{ minWidth: '24px' }} />
            </div>

            {pageRows.map(r => (
              <RowResult key={r.row} result={r} expanded={!!expandedRows[r.row]} onToggle={() => toggleRow(r.row)} />
            ))}

            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{
                  padding: '0.4rem 0.9rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent', color: page === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                  cursor: page === 0 ? 'not-allowed' : 'pointer', fontSize: '0.85rem',
                }}>← Prev</button>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Page {page + 1} of {totalPages} · rows {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredRows.length)}
                </span>
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} style={{
                  padding: '0.4rem 0.9rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent', color: page >= totalPages - 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                  cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', fontSize: '0.85rem',
                }}>Next →</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
