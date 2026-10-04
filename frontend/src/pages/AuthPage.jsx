import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Activity, Mail, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handle = (e) => {
    setError('');
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const url = mode === 'login'
        ? 'http://localhost:5001/api/auth/login'
        : 'http://localhost:5001/api/auth/register';

      const payload = mode === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };

      const res = await axios.post(url, payload);
      localStorage.setItem('biolens_token', res.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const iconStyle = {
    position: 'absolute',
    left: '0.9rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-muted)',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'radial-gradient(ellipse at 20% 50%, rgba(34,211,238,0.05) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(168,85,247,0.05) 0%, transparent 50%)'
    }}>
      <div style={{ width: '100%', maxWidth: '460px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <Activity color="#22D3EE" size={36} />
            <h1 className="text-gradient" style={{ margin: 0, fontSize: '2rem' }}>BioLens</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Your Personal AI Health Intelligence Platform
          </p>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: '2.5rem' }}>

          {/* Tabs */}
          <div style={{ display: 'flex', marginBottom: '2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '4px' }}>
            {['login', 'register'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  transition: 'all 0.2s',
                  background: mode === m ? 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(168,85,247,0.15))' : 'transparent',
                  color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: mode === m ? '0 0 0 1px rgba(34,211,238,0.3)' : 'none',
                }}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {mode === 'register' && (
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={iconStyle} />
                  <input name="name" type="text" placeholder="Your name" value={form.name} onChange={handle} required={mode === 'register'} style={inputStyle} />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={iconStyle} />
                <input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handle} required style={inputStyle} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={iconStyle} />
                <input
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder={mode === 'register' ? 'Min. 6 characters' : 'Your password'}
                  value={form.password}
                  onChange={handle}
                  required
                  style={{ ...inputStyle, paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '8px' }}>
                <AlertCircle size={16} color="var(--accent-rose)" />
                <span style={{ color: 'var(--accent-rose)', fontSize: '0.9rem' }}>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.85rem',
                marginTop: '0.5rem',
                border: 'none',
                borderRadius: '10px',
                background: loading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #22D3EE, #A855F7)',
                color: '#fff',
                fontWeight: '700',
                fontSize: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: loading ? 0.6 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              {loading ? 'Please wait...' : (
                <>{mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={18} /></>
              )}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          This is a personal health intelligence tool. All data stays on your device.
        </p>
      </div>
    </div>
  );
}
