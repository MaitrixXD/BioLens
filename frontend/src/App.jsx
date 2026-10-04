import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import InputForm from './pages/InputForm';
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/AuthPage';
import './index.css';
import { Activity, LogOut } from 'lucide-react';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('biolens_token');
  if (!token) return <Navigate to="/auth" replace />;
  return children;
}

function NavBar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('biolens_token');

  const logout = () => {
    localStorage.removeItem('biolens_token');
    navigate('/auth');
  };

  return (
    <nav style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Activity color="#22D3EE" size={32} />
        <h1 className="text-gradient" style={{ margin: 0, fontSize: '1.5rem' }}>BioLens</h1>
      </div>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        {token && (
          <>
            <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500 }}>New Profile</Link>
            <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', color: 'var(--accent-rose)', borderRadius: '8px', padding: '0.4rem 0.9rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}>
              <LogOut size={14} /> Sign Out
            </button>
          </>
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
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
