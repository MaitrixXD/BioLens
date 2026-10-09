import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import InputForm from './pages/InputForm';
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/AuthPage';
import EditProfilePage from './pages/EditProfilePage';
import TestingPage from './pages/TestingPage';
import ViewDashboard from './pages/ViewDashboard';
import './index.css';
import { Activity, LogOut, FlaskConical, Users, Sun, Moon } from 'lucide-react';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('biolens_token');
  if (!token) return <Navigate to="/auth" replace />;
  return children;
}

function NavBar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('biolens_token');

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('biolens_theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('biolens_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const logout = () => {
    localStorage.removeItem('biolens_token');
    navigate('/auth');
  };

  return (
    <nav style={{
      padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', borderBottom: '1px solid var(--nav-border)',
      background: 'var(--bg-surface)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Activity color="var(--accent-cyan)" size={32} />
        <h1 className="text-gradient" style={{ margin: 0, fontSize: '1.5rem' }}>BioLens</h1>
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {token && (
          <>
            <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
              New Profile
            </Link>

            <Link
              to="/view-dashboard"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                color: '#F472B6', textDecoration: 'none', fontWeight: 600,
                background: 'rgba(244,114,182,0.1)', border: '1px solid rgba(244,114,182,0.25)',
                borderRadius: '8px', padding: '0.4rem 0.9rem', fontSize: '0.9rem',
              }}
            >
              <Users size={14} /> View All Users
            </Link>

            <Link
              to="/testing"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                color: 'var(--accent-green)', textDecoration: 'none', fontWeight: 600,
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                borderRadius: '8px', padding: '0.4rem 0.9rem', fontSize: '0.9rem',
              }}
            >
              <FlaskConical size={14} /> Testing Page
            </Link>
          </>
        )}

        {/* Light / Dark toggle — always visible */}
        <button
          onClick={toggleTheme}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            background: 'var(--pill-bg)', border: '1px solid var(--pill-border)',
            color: 'var(--text-primary)', borderRadius: '8px',
            padding: '0.4rem 0.85rem', cursor: 'pointer',
            fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s ease',
          }}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark'
            ? <Sun size={15} color="#F59E0B" />
            : <Moon size={15} color="#6366F1" />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        {token && (
          <button
            onClick={logout}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)',
              color: 'var(--accent-rose)', borderRadius: '8px',
              padding: '0.4rem 0.9rem', cursor: 'pointer',
              fontSize: '0.9rem', fontWeight: 600,
            }}
          >
            <LogOut size={14} /> Sign Out
          </button>
        )}
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="app-container">
        <NavBar />
        <main style={{ padding: '2rem' }}>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<ProtectedRoute><InputForm /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/view-dashboard" element={<ProtectedRoute><ViewDashboard /></ProtectedRoute>} />
            <Route path="/edit-profile/:id" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
            <Route path="/testing" element={<ProtectedRoute><TestingPage /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
