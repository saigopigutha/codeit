import React, { useState } from 'react';

export default function AdminLogin({ onLogin, onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleMS = () => alert('Microsoft OAuth requires Azure AD app registration.\n\nFor now, use the demo credentials:\nEmail: admin@gmrit.edu.in\nPassword: admin123');

  const submit = e => {
    e.preventDefault();
    setError(''); setLoading(true);
    setTimeout(() => {
      if (email === 'admin@gmrit.edu.in' && password === 'admin123') { onLogin(); }
      else setError('Invalid credentials. Use admin@gmrit.edu.in / admin123');
      setLoading(false);
    }, 700);
  };

  const inp = { width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', padding:'0.85rem 1rem', color:'#f1f5f9', fontSize:'0.9rem', outline:'none' };

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0c0a1e 0%,#0f172a 50%,#0c0a1e 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ width:'100%', maxWidth:'440px' }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:'0.875rem', marginBottom:'1.5rem', display:'flex', alignItems:'center', gap:'0.4rem', padding:0 }}>← Student Login</button>

        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'68px', height:'68px', borderRadius:'18px', background:'linear-gradient(135deg,#7c3aed,#4f46e5)', boxShadow:'0 10px 36px rgba(124,58,237,0.45)', marginBottom:'1rem' }}>
            <svg width="32" height="32" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
          <h1 style={{ fontSize:'2rem', fontWeight:800, color:'#fff', letterSpacing:'-0.02em' }}>Admin Portal</h1>
          <p style={{ color:'#7c3aed', marginTop:'0.4rem', fontSize:'0.75rem', letterSpacing:'0.12em', textTransform:'uppercase' }}>CodeIT · GMRIT Faculty Access</p>
        </div>

        <div style={{ background:'rgba(255,255,255,0.04)', backdropFilter:'blur(24px)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'24px', padding:'2.5rem', boxShadow:'0 32px 80px rgba(0,0,0,0.5)' }}>
          <button onClick={handleMS} style={{ width:'100%', padding:'0.9rem', background:'#2563eb', border:'none', borderRadius:'12px', color:'#fff', fontSize:'0.95rem', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.7rem', marginBottom:'1.5rem', boxShadow:'0 4px 20px rgba(37,99,235,0.35)' }}>
            <svg width="20" height="20" viewBox="0 0 21 21" fill="none">
              <rect x="1" y="1" width="9" height="9" fill="#f25022"/><rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/><rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
            </svg>
            Sign in with Microsoft
          </button>

          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1.5rem' }}>
            <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.08)' }} />
            <span style={{ color:'#475569', fontSize:'0.75rem' }}>or demo login</span>
            <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.08)' }} />
          </div>

          {error && <div style={{ marginBottom:'1rem', padding:'0.75rem 1rem', borderRadius:'10px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#f87171', fontSize:'0.875rem' }}>{error}</div>}

          <form onSubmit={submit}>
            <div style={{ marginBottom:'1rem' }}>
              <label style={{ display:'block', color:'#94a3b8', fontSize:'0.8rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.5rem' }}>Admin Email</label>
              <input type="email" placeholder="admin@gmrit.edu.in" value={email} onChange={e=>setEmail(e.target.value)} required style={inp} onFocus={e=>e.target.style.borderColor='#7c3aed'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'} />
            </div>
            <div style={{ marginBottom:'1.5rem' }}>
              <label style={{ display:'block', color:'#94a3b8', fontSize:'0.8rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.5rem' }}>Password</label>
              <input type="password" placeholder="Admin password" value={password} onChange={e=>setPassword(e.target.value)} required style={inp} onFocus={e=>e.target.style.borderColor='#7c3aed'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'} />
            </div>
            <button type="submit" disabled={loading} style={{ width:'100%', padding:'0.95rem', background:'linear-gradient(135deg,#7c3aed,#4f46e5)', border:'none', borderRadius:'14px', color:'#fff', fontSize:'1rem', fontWeight:700, cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1, boxShadow:'0 6px 28px rgba(124,58,237,0.35)' }}>
              {loading ? 'Signing in…' : 'Sign In as Admin'}
            </button>
          </form>

          <p style={{ textAlign:'center', color:'#475569', fontSize:'0.72rem', marginTop:'1.5rem' }}>🔒 Only @gmrit.edu.in accounts · Role-based access enforced</p>
        </div>
      </div>
    </div>
  );
}
