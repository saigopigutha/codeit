import React, { useState } from 'react';

const BRANCHES = ['CSE','ECE','IT','ME','EEE','CIVIL','CSM','CSD'];

export default function StudentLogin({ onLogin, onAdmin }) {
  const [form, setForm] = useState({ jntuNo: '', name: '', branch: 'CSE', contact: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: k === 'jntuNo' ? e.target.value.toUpperCase() : e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setError('');
    if (!/^\d{2}[0-9A-Z]{3}\d[A-Z]\d{4}$/i.test(form.jntuNo)) { setError('Invalid JNTU number format. Example: 24341A0574'); return; }
    if (!/^\d{10}$/.test(form.contact)) { setError('Contact must be a 10-digit number.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/student/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      onLogin({ ...form, ...data });
    } catch(err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const inp = { width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', padding:'0.85rem 1rem', color:'#f1f5f9', fontSize:'0.9rem', outline:'none', transition:'border-color 0.2s' };

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:'20%', left:'15%', width:'500px', height:'500px', background:'radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)', borderRadius:'50%', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'15%', right:'15%', width:'400px', height:'400px', background:'radial-gradient(circle,rgba(139,92,246,0.1) 0%,transparent 70%)', borderRadius:'50%', pointerEvents:'none' }} />

      <div style={{ position:'relative', width:'100%', maxWidth:'460px' }}>
        <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
          <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'72px', height:'72px', borderRadius:'20px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow:'0 12px 40px rgba(99,102,241,0.45)', marginBottom:'1.25rem' }}>
            <svg width="36" height="36" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
          </div>
          <h1 style={{ fontSize:'2.75rem', fontWeight:800, color:'#fff', letterSpacing:'-0.03em', lineHeight:1 }}>CodeIT</h1>
          <p style={{ color:'#818cf8', marginTop:'0.5rem', fontSize:'0.78rem', letterSpacing:'0.15em', textTransform:'uppercase', fontWeight:500 }}>GMRIT Coding Examination Platform</p>
        </div>

        <div style={{ background:'rgba(255,255,255,0.04)', backdropFilter:'blur(24px)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'24px', padding:'2.5rem', boxShadow:'0 32px 80px rgba(0,0,0,0.5)' }}>
          <h2 style={{ color:'#f1f5f9', fontSize:'1.3rem', fontWeight:700, marginBottom:'0.4rem' }}>Student Login</h2>
          <p style={{ color:'#64748b', fontSize:'0.875rem', marginBottom:'1.75rem' }}>Enter your details to access the exam portal</p>

          {error && <div style={{ marginBottom:'1rem', padding:'0.75rem 1rem', borderRadius:'12px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#f87171', fontSize:'0.875rem' }}>{error}</div>}

          <form onSubmit={submit}>
            <div style={{ marginBottom:'1rem' }}>
              <label style={{ display:'block', color:'#94a3b8', fontSize:'0.82rem', fontWeight:600, marginBottom:'0.5rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>JNTU Number</label>
              <input type="text" value={form.jntuNo} onChange={set('jntuNo')} placeholder="e.g. 24341A0574" required maxLength={10} style={inp}
                onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'} />
            </div>
            <div style={{ marginBottom:'1rem' }}>
              <label style={{ display:'block', color:'#94a3b8', fontSize:'0.82rem', fontWeight:600, marginBottom:'0.5rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>Full Name</label>
              <input type="text" value={form.name} onChange={set('name')} placeholder="Your full name" required style={inp}
                onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.5rem' }}>
              <div>
                <label style={{ display:'block', color:'#94a3b8', fontSize:'0.82rem', fontWeight:600, marginBottom:'0.5rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>Branch</label>
                <select value={form.branch} onChange={set('branch')} style={{ ...inp, background:'#1e2a3a', cursor:'pointer' }}>
                  {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:'block', color:'#94a3b8', fontSize:'0.82rem', fontWeight:600, marginBottom:'0.5rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>Contact No.</label>
                <input type="tel" value={form.contact} onChange={set('contact')} placeholder="10 digits" required maxLength={10} style={inp}
                  onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'} />
              </div>
            </div>
            <button type="submit" disabled={loading} style={{ width:'100%', padding:'0.95rem', background:loading?'#4338ca':'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', borderRadius:'14px', color:'#fff', fontSize:'1rem', fontWeight:700, cursor:loading?'not-allowed':'pointer', boxShadow:'0 6px 28px rgba(99,102,241,0.4)', opacity:loading?0.75:1, transition:'all 0.2s', letterSpacing:'0.01em' }}>
              {loading ? 'Verifying…' : 'Enter Exam Portal →'}
            </button>
          </form>

          <div style={{ marginTop:'1.75rem', paddingTop:'1.5rem', borderTop:'1px solid rgba(255,255,255,0.06)', textAlign:'center' }}>
            <span style={{ color:'#475569', fontSize:'0.75rem' }}>🔒 Secure · Proctored · ISTE Student Chapter, GMRIT</span>
          </div>
        </div>

        <p style={{ textAlign:'center', marginTop:'1.25rem', color:'#475569', fontSize:'0.875rem' }}>
          Faculty / Admin?{' '}
          <button onClick={onAdmin} style={{ color:'#818cf8', background:'none', border:'none', cursor:'pointer', fontWeight:600, fontSize:'0.875rem' }}>Admin Portal →</button>
        </p>
      </div>
    </div>
  );
}
