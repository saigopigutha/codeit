import React, { useState } from 'react';

function formatDuration(min) { return min >= 60 ? `${Math.floor(min/60)}h ${min%60>0?' '+min%60+'m':''}`.trim() : `${min} min`; }

export default function ContestList({ contests = [], student, onEnter, onLogout }) {
  const [tab, setTab] = useState('All');
  const [modal, setModal] = useState(null);
  const [password, setPassword] = useState('');
  const [pwErr, setPwErr] = useState('');

  const filtered = contests.filter(c => tab === 'All' || c.status === tab);

  const handleClick = c => {
    if (c.status === 'Closed') return;
    if (c.status === 'Upcoming') { alert('This contest has not started yet. Check back later.'); return; }
    if (c.questions?.length === 0) { alert('This contest has no questions yet. Contact your instructor.'); return; }
    setModal(c); setPassword(''); setPwErr('');
  };

  const handleEnter = e => {
    e.preventDefault();
    if (password === modal.password) { onEnter(modal); setModal(null); }
    else setPwErr('Incorrect password. Ask your instructor for the correct one.');
  };

  const logoSvg = <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>;

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)' }}>
      <header style={{ background:'rgba(15,23,42,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(255,255,255,0.07)', padding:'0.9rem 2rem', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.7rem' }}>
          <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center' }}>{logoSvg}</div>
          <span style={{ fontWeight:800, fontSize:'1.25rem', letterSpacing:'-0.02em' }}>CodeIT</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'1.5rem' }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontWeight:600, fontSize:'0.9rem' }}>{student?.name}</div>
            <div style={{ color:'#64748b', fontSize:'0.75rem' }}>{student?.jntuNo} · {student?.branch}</div>
          </div>
          <button onClick={onLogout} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'10px', color:'#f87171', padding:'0.5rem 1.1rem', cursor:'pointer', fontSize:'0.85rem', fontWeight:600 }}>Logout</button>
        </div>
      </header>

      <main style={{ maxWidth:'960px', margin:'0 auto', padding:'2.5rem 1.5rem' }}>
        <div style={{ marginBottom:'2rem' }}>
          <h1 style={{ fontSize:'1.9rem', fontWeight:800, letterSpacing:'-0.02em', marginBottom:'0.5rem' }}>Available Contests</h1>
          <p style={{ color:'#64748b' }}>Select a contest to enter. Open contests require a password from your instructor.</p>
        </div>

        <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.75rem', flexWrap:'wrap' }}>
          {['All','Open','Upcoming','Closed'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding:'0.45rem 1.2rem', borderRadius:'20px', border:'none', cursor:'pointer', fontWeight:600, fontSize:'0.85rem', background:tab===t?'linear-gradient(135deg,#6366f1,#8b5cf6)':'rgba(255,255,255,0.06)', color:tab===t?'#fff':'#94a3b8', transition:'all 0.2s' }}>{t}</button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'4rem', color:'#475569' }}>
            <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🏁</div>
            <p>No contests in this category right now.</p>
          </div>
        )}

        <div style={{ display:'grid', gap:'1.25rem' }}>
          {filtered.map(c => {
            const statusColor = { Open:'#22c55e', Upcoming:'#f59e0b', Closed:'#ef4444' }[c.status] || '#818cf8';
            const clickable = c.status === 'Open';
            return (
              <div key={c.id} onClick={() => handleClick(c)}
                style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'20px', padding:'1.75rem', cursor:clickable?'pointer':'not-allowed', opacity:c.status==='Closed'?0.5:1, transition:'all 0.2s' }}
                onMouseEnter={e => { if(clickable){ e.currentTarget.style.borderColor='#6366f1'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(99,102,241,0.15)'; }}}
                onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.75rem' }}>
                  <h3 style={{ fontSize:'1.05rem', fontWeight:700, flex:1, paddingRight:'1rem' }}>{c.name}</h3>
                  <div style={{ display:'flex', gap:'0.5rem', flexShrink:0 }}>
                    <span style={{ background:`${statusColor}20`, color:statusColor, border:`1px solid ${statusColor}40`, borderRadius:'20px', padding:'0.2rem 0.8rem', fontSize:'0.72rem', fontWeight:700 }}>{c.status}</span>
                    <span style={{ background:'rgba(99,102,241,0.12)', color:'#818cf8', border:'1px solid rgba(99,102,241,0.25)', borderRadius:'20px', padding:'0.2rem 0.8rem', fontSize:'0.72rem', fontWeight:600 }}>{c.type}</span>
                  </div>
                </div>
                <p style={{ color:'#94a3b8', fontSize:'0.875rem', marginBottom:'1.1rem', lineHeight:1.5 }}>{c.desc}</p>
                <div style={{ display:'flex', gap:'2rem', flexWrap:'wrap' }}>
                  <span style={{ color:'#64748b', fontSize:'0.8rem' }}>⏱ {formatDuration(c.duration)}</span>
                  <span style={{ color:'#64748b', fontSize:'0.8rem' }}>📊 {c.marks} marks</span>
                  <span style={{ color:'#64748b', fontSize:'0.8rem' }}>❓ {c.questions?.length || 0} questions</span>
                  {c.students > 0 && <span style={{ color:'#64748b', fontSize:'0.8rem' }}>👥 {c.students} attempted</span>}
                </div>
                {c.status === 'Open' && c.questions?.length > 0 && (
                  <div style={{ marginTop:'1rem', paddingTop:'0.875rem', borderTop:'1px solid rgba(255,255,255,0.05)', color:'#6366f1', fontSize:'0.82rem', fontWeight:600 }}>Click to enter → password required</div>
                )}
                {c.status === 'Open' && c.questions?.length === 0 && (
                  <div style={{ marginTop:'1rem', paddingTop:'0.875rem', borderTop:'1px solid rgba(255,255,255,0.05)', color:'#f59e0b', fontSize:'0.82rem' }}>⚠ No questions added yet by instructor</div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:'1rem' }}
          onClick={e => { if(e.target===e.currentTarget) setModal(null); }}>
          <div style={{ background:'#111827', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'22px', padding:'2.25rem', width:'100%', maxWidth:'420px', boxShadow:'0 32px 80px rgba(0,0,0,0.7)' }}>
            <h2 style={{ fontSize:'1.2rem', fontWeight:700, marginBottom:'0.4rem' }}>Enter Contest</h2>
            <p style={{ color:'#64748b', fontSize:'0.875rem', marginBottom:'0.25rem' }}>{modal.name}</p>
            <p style={{ color:'#475569', fontSize:'0.78rem', marginBottom:'1.5rem' }}>{modal.questions?.length} questions · {modal.duration} min · {modal.marks} marks</p>
            {pwErr && <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#f87171', borderRadius:'10px', padding:'0.65rem 1rem', fontSize:'0.875rem', marginBottom:'1rem' }}>{pwErr}</div>}
            <form onSubmit={handleEnter}>
              <input type="password" placeholder="Contest password" value={password} onChange={e => setPassword(e.target.value)} autoFocus required
                style={{ width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', padding:'0.875rem 1rem', color:'#f1f5f9', fontSize:'0.9rem', outline:'none', marginBottom:'1rem', boxSizing:'border-box' }} />
              <div style={{ display:'flex', gap:'0.75rem' }}>
                <button type="button" onClick={() => setModal(null)} style={{ flex:1, padding:'0.8rem', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', color:'#94a3b8', cursor:'pointer', fontWeight:600 }}>Cancel</button>
                <button type="submit" style={{ flex:1, padding:'0.8rem', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', borderRadius:'12px', color:'#fff', cursor:'pointer', fontWeight:700 }}>Start Contest →</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
