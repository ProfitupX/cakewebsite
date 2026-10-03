import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';

export default function AuthPage() {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (tab === 'signin') { await signIn(email, password); }
      else { await signUp(email, password, fullName); }
      navigate('/');
    } catch (err: any) { setError(err.message || 'Authentication failed.'); }
    setLoading(false);
  };

  return (
    <div className="auth-wrapper page-enter">
      {/* Brand side */}
      <div className="auth-brand-side">
        <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>🎂</div>
          <h1 style={{ color: 'white', marginBottom: '1rem', fontSize: '2.5rem' }}>Sowmis Cake</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', lineHeight: 1.7, maxWidth: 320 }}>Crafting extraordinary cakes with love, passion and the finest ingredients.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '3rem' }}>
            {['🎂 3D Custom Cakes', '⚡ Happy Hours', '📊 AI Kitchen Predictor', '💌 Real Reviews'].map(f => (
              <div key={f} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '0.75rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)' }}>{f}</div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Form side */}
      <div className="auth-form-side">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="auth-form-box">
          <div style={{ marginBottom: '2rem' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '2rem' }}>← Back to Home</Link>
            <h2 style={{ fontFamily: 'Playfair Display, serif', color: 'var(--chocolate)', marginBottom: '0.5rem' }}>{tab === 'signin' ? 'Welcome Back!' : 'Create Account'}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{tab === 'signin' ? 'Sign in to your Sowmis Cake account' : 'Join thousands of cake lovers'}</p>
          </div>

          <div className="auth-tabs">
            <button className={`auth-tab ${tab === 'signin' ? 'active' : ''}`} onClick={() => setTab('signin')}>Sign In</button>
            <button className={`auth-tab ${tab === 'signup' ? 'active' : ''}`} onClick={() => setTab('signup')}>Sign Up</button>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#DC2626', fontSize: '0.87rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {tab === 'signup' && (
              <div style={{ marginBottom: '1rem', position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" className="input-field" style={{ paddingLeft: '3rem' }} placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} required />
              </div>
            )}
            <div style={{ marginBottom: '1rem', position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="email" className="input-field" style={{ paddingLeft: '3rem' }} placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type={showPass ? 'text' : 'password'} className="input-field" style={{ paddingLeft: '3rem', paddingRight: '3rem' }} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', color: 'var(--text-muted)' }}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Please wait...' : tab === 'signin' ? '🔐 Sign In' : '🎉 Create Account'}
            </button>
          </form>

          <div style={{ margin: '2rem 0', textAlign: 'center', position: 'relative' }}>
            <div style={{ height: 1, background: 'var(--border)' }} />
            <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'var(--cream)', padding: '0 0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>or</span>
          </div>

          <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {tab === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => setTab(tab === 'signin' ? 'signup' : 'signin')} style={{ background: 'none', color: 'var(--rose)', fontWeight: 700, fontSize: '0.85rem' }}>
              {tab === 'signin' ? 'Sign Up' : 'Sign In'}
            </button>
          </div>

          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>By signing up, you agree to our Terms of Service and Privacy Policy.</p>
        </motion.div>
      </div>
    </div>
  );
}
