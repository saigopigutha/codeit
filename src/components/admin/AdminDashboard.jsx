import React, { useState } from 'react';

function Badge({ text }) {
  const map = { Open: '#22c55e', Upcoming: '#f59e0b', Closed: '#ef4444' };
  const c = map[text] || '#818cf8';
  return <span style={{ background: `${c}18`, color: c, border: `1px solid ${c}35`, borderRadius: '20px', padding: '0.2rem 0.75rem', fontSize: '0.72rem', fontWeight: 700 }}>{text}</span>;
}

const emptyMCQ = () => ({ id: Date.now(), type: 'mcq', text: '', options: ['', '', '', ''], correct: 0, marks: 10 });
const emptyCode = () => ({
  id: Date.now(),
  type: 'code',
  title: '',
  text: '',
  marks: 35,
  testCases: [
    { id: 1, input: '', expected: '', isHidden: false, explanation: '' },
    { id: 2, input: '', expected: '', isHidden: true, explanation: '' }
  ]
});

const randomHex = len => Math.random().toString(36).substring(2, 2 + len).toUpperCase();

export default function AdminDashboard({ contests = [], setContests, submissions = [], setSubmissions, admins = [], setAdmins, showToast, onLogout }) {
  const [tab, setTab] = useState('overview');
  // Create contest modal
  const [showCreate, setShowCreate] = useState(false);
  const [newC, setNewC] = useState({ name: '', desc: '', duration: 60, type: 'Mixed', token: '', password: '', status: 'Upcoming' });
  // Question management panel
  const [editContest, setEditContest] = useState(null);
  const [addingQ, setAddingQ] = useState(null); // null | MCQ-draft | code-draft
  const [addType, setAddType] = useState('mcq');

  // Token management state
  const [tokenContestId, setTokenContestId] = useState(() => contests[0]?.id || 1);
  const [customMasterToken, setCustomMasterToken] = useState('');
  const [isEditingMaster, setIsEditingMaster] = useState(false);

  // Admin & Faculty Management state
  const [adminView, setAdminView] = useState('platform'); // 'platform' | 'contest'
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', role: 'Faculty Admin', department: 'CSE Department' });
  const [selectedContestAdminId, setSelectedContestAdminId] = useState(() => contests[0]?.id || 1);
  const [selectedAdminToAssign, setSelectedAdminToAssign] = useState('');

  const selectedTokenContest = contests.find(c => c.id === tokenContestId) || contests[0];
  const selectedAdminContest = contests.find(c => c.id === selectedContestAdminId) || contests[0];

  const totalStudents = new Set(submissions.map(s => s.jntuNo)).size;
  const activeContests = contests.filter(c => c.status === 'Open').length;
  const totalSubs = submissions.length;

  const notify = (msg, type = 'success') => {
    if (showToast) showToast(msg, type);
    else alert(msg);
  };

  const copyToClipboard = (text, label = 'Copied') => {
    navigator.clipboard.writeText(text);
    notify(`${label} copied to clipboard!`, 'success');
  };

  /* ── Create contest ── */
  const handleCreate = e => {
    e.preventDefault();
    const prefix = (newC.name || 'CONTEST').replace(/[^a-zA-Z0-9]/g, '').substring(0, 5).toUpperCase();
    const generatedToken = newC.token?.trim() || `${prefix}-${randomHex(4)}-CODE`;
    const nc = {
      ...newC,
      id: Date.now(),
      token: generatedToken,
      password: newC.password || generatedToken.toLowerCase(),
      accessTokens: [],
      admins: ['admin@gmrit.edu.in'],
      students: 0,
      questions: [],
      marks: 0
    };
    setContests(cs => [...cs, nc]);
    setEditContest(nc);
    setShowCreate(false);
    setNewC({ name: '', desc: '', duration: 60, type: 'Mixed', token: '', password: '', status: 'Upcoming' });
    setTab('questions');
    notify('Contest created successfully with access token!', 'success');
  };

  /* ── Delete contest ── */
  const deleteContest = id => {
    if (!window.confirm('Delete this contest?')) return;
    setContests(cs => cs.filter(c => c.id !== id));
    if (editContest?.id === id) { setEditContest(null); setTab('contests'); }
  };

  /* ── Toggle status ── */
  const toggleStatus = id => {
    setContests(cs => cs.map(c => {
      if (c.id !== id) return c;
      const next = { Open: 'Closed', Upcoming: 'Open', Closed: 'Upcoming' }[c.status];
      return { ...c, status: next };
    }));
  };

  /* ── Open question editor for a contest ── */
  const openQuestions = c => { setEditContest(c); setAddingQ(null); setTab('questions'); };

  /* ── Start adding a new question ── */
  const startAdd = type => { setAddType(type); setAddingQ(type === 'mcq' ? emptyMCQ() : emptyCode()); };

  /* ── Add / Delete test cases in draft coding question ── */
  const addTestCase = () => {
    if (!addingQ || addingQ.type !== 'code') return;
    setAddingQ(q => ({
      ...q,
      testCases: [...(q.testCases || []), { id: Date.now(), input: '', expected: '', isHidden: false, explanation: '' }]
    }));
  };

  const updateTestCase = (idx, field, value) => {
    setAddingQ(q => {
      const tc = [...(q.testCases || [])];
      tc[idx] = { ...tc[idx], [field]: value };
      return { ...q, testCases: tc };
    });
  };

  const removeTestCase = idx => {
    setAddingQ(q => ({
      ...q,
      testCases: (q.testCases || []).filter((_, i) => i !== idx)
    }));
  };

  /* ── Admin Management Handlers ── */
  const handleAddPlatformAdmin = e => {
    e.preventDefault();
    if (!newAdmin.name.trim() || !newAdmin.email.trim() || !newAdmin.password.trim()) {
      alert('Please fill all admin details.');
      return;
    }
    const cleanEmail = newAdmin.email.trim().toLowerCase();
    if (admins.some(a => a.email.toLowerCase() === cleanEmail)) {
      alert('An administrator with this email already exists.');
      return;
    }

    const created = {
      id: Date.now(),
      name: newAdmin.name.trim(),
      email: cleanEmail,
      password: newAdmin.password.trim(),
      role: newAdmin.role,
      department: newAdmin.department || 'Academic Department',
      status: 'Active',
      addedAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    };

    setAdmins(prev => [...prev, created]);
    setShowAddAdminModal(false);
    setNewAdmin({ name: '', email: '', password: '', role: 'Faculty Admin', department: 'CSE Department' });
    notify(`Admin "${created.name}" added successfully!`, 'success');
  };

  const handleDeletePlatformAdmin = id => {
    const target = admins.find(a => a.id === id);
    if (admins.length <= 1) {
      alert('At least one platform administrator must remain.');
      return;
    }
    if (target?.role === 'Super Admin' && admins.filter(a => a.role === 'Super Admin').length <= 1) {
      alert('Cannot delete the primary Super Administrator.');
      return;
    }
    if (!window.confirm(`Are you sure you want to remove administrator "${target?.name}"?`)) return;

    setAdmins(prev => prev.filter(a => a.id !== id));
    notify(`Administrator removed.`, 'info');
  };

  const handleAssignContestAdmin = (contestId, email) => {
    if (!email) return;
    setContests(cs => cs.map(c => {
      if (c.id !== contestId) return c;
      const current = c.admins || [];
      if (current.includes(email)) return c;
      return { ...c, admins: [...current, email] };
    }));
    setSelectedAdminToAssign('');
    notify(`Assigned ${email} as contest coordinator!`, 'success');
  };

  const handleRemoveContestAdmin = (contestId, email) => {
    setContests(cs => cs.map(c => {
      if (c.id !== contestId) return c;
      return { ...c, admins: (c.admins || []).filter(a => a !== email) };
    }));
    notify(`Removed ${email} from contest coordinators.`, 'info');
  };

  /* ── Save draft question to contest ── */
  const saveQuestion = () => {
    if (!addingQ) return;
    if (!addingQ.text.trim()) { alert('Question description cannot be empty.'); return; }
    
    if (addingQ.type === 'mcq') {
      if (addingQ.options.some(o => !o.trim())) { alert('All 4 MCQ options must be filled.'); return; }
    }

    if (addingQ.type === 'code') {
      if (!addingQ.testCases || addingQ.testCases.length === 0) {
        alert('Please add at least 1 test case for this coding problem.');
        return;
      }
      if (addingQ.testCases.some(tc => !tc.expected || !tc.expected.trim())) {
        alert('All test cases must have an Expected Output. Input is optional.');
        return;
      }
    }

    setContests(cs => cs.map(c => {
      if (c.id !== editContest.id) return c;
      const updatedQs = [...(c.questions || []), { ...addingQ, id: Date.now() }];
      const totalMarks = updatedQs.reduce((s, q) => s + q.marks, 0);
      return { ...c, questions: updatedQs, marks: totalMarks };
    }));

    setEditContest(ec => {
      const updatedQs = [...(ec.questions || []), { ...addingQ, id: Date.now() }];
      return { ...ec, questions: updatedQs, marks: updatedQs.reduce((s, q) => s + q.marks, 0) };
    });

    setAddingQ(null);
  };

  /* ── Delete a question from a contest ── */
  const deleteQuestion = qId => {
    setContests(cs => cs.map(c => {
      if (c.id !== editContest.id) return c;
      const updatedQs = c.questions.filter(q => q.id !== qId);
      return { ...c, questions: updatedQs, marks: updatedQs.reduce((s, q) => s + q.marks, 0) };
    }));
    setEditContest(ec => ({
      ...ec,
      questions: ec.questions.filter(q => q.id !== qId)
    }));
  };

  /* ── Token Management Handlers ── */
  const handleRegenerateMaster = (contestId) => {
    const c = contests.find(x => x.id === contestId);
    const prefix = (c?.name || 'CONTEST').replace(/[^a-zA-Z0-9]/g, '').substring(0, 5).toUpperCase();
    const newToken = `${prefix}-${randomHex(4)}-${randomHex(2)}`;
    setContests(cs => cs.map(item => item.id === contestId ? { ...item, token: newToken, password: newToken.toLowerCase() } : item));
    notify(`Master Access Token regenerated: ${newToken}`, 'success');
  };

  const handleSaveMaster = (contestId) => {
    if (!customMasterToken.trim()) return;
    const cleanToken = customMasterToken.trim().toUpperCase();
    setContests(cs => cs.map(item => item.id === contestId ? { ...item, token: cleanToken, password: cleanToken.toLowerCase() } : item));
    setIsEditingMaster(false);
    setCustomMasterToken('');
    notify(`Master Access Token updated to: ${cleanToken}`, 'success');
  };

  const handleGenerateSingleUseTokens = (contestId, count) => {
    const c = contests.find(x => x.id === contestId);
    const prefix = (c?.name || 'TOK').replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

    const newTokens = Array.from({ length: count }, (_, i) => ({
      id: `tok-${Date.now()}-${i}-${randomHex(3)}`,
      code: `${prefix}-${randomHex(4)}-${randomHex(2)}`,
      isUsed: false,
      usedBy: null,
      createdAt: dateStr
    }));

    setContests(cs => cs.map(item => {
      if (item.id !== contestId) return item;
      return {
        ...item,
        accessTokens: [...(item.accessTokens || []), ...newTokens]
      };
    }));

    notify(`Generated ${count} single-use student access tokens!`, 'success');
  };

  const handleDeleteToken = (contestId, tokenId) => {
    setContests(cs => cs.map(item => {
      if (item.id !== contestId) return item;
      return {
        ...item,
        accessTokens: (item.accessTokens || []).filter(t => t.id !== tokenId)
      };
    }));
  };

  const handleClearUsedTokens = (contestId) => {
    setContests(cs => cs.map(item => {
      if (item.id !== contestId) return item;
      return {
        ...item,
        accessTokens: (item.accessTokens || []).filter(t => !t.isUsed)
      };
    }));
    notify('Cleaned up used tokens', 'info');
  };

  const handleCopyAllUnusedTokens = (contest) => {
    const unused = (contest?.accessTokens || []).filter(t => !t.isUsed);
    if (unused.length === 0) {
      notify('No unused tokens available to copy.', 'info');
      return;
    }
    const tokenList = unused.map((t, idx) => `${idx + 1}. ${t.code}`).join('\n');
    copyToClipboard(tokenList, `${unused.length} Unused Tokens`);
  };

  const navItem = (key, label, icon) => (
    <button onClick={() => setTab(key)} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 1rem', borderRadius: '10px', border: 'none', background: tab === key ? 'rgba(99,102,241,0.15)' : 'none', color: tab === key ? '#818cf8' : '#64748b', cursor: 'pointer', fontSize: '0.875rem', fontWeight: tab === key ? 700 : 500, width: '100%', textAlign: 'left' }}>
      {icon} {label}
    </button>
  );

  const logoSvg = <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>;
  const inp = style => ({ style: { ...{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.7rem 0.9rem', color: '#f1f5f9', fontSize: '0.875rem', outline: 'none', width: '100%', boxSizing: 'border-box' }, ...style } });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a' }}>
      {/* Sidebar */}
      <aside style={{ width: '230px', flexShrink: 0, background: '#111827', borderRight: '1px solid rgba(255,255,255,0.07)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{logoSvg}</div>
          <div><div style={{ fontWeight: 800, fontSize: '1rem' }}>CodeIT</div><div style={{ color: '#475569', fontSize: '0.7rem' }}>Admin Portal</div></div>
        </div>
        {navItem('overview', 'Overview', '📊')}
        {navItem('contests', 'Contests', '🏆')}
        {navItem('tokens', 'Access Tokens', '🔑')}
        {navItem('admins', 'Admins & Faculty', '🛡️')}
        {navItem('students', 'Submissions', '👥')}
        {tab === 'questions' && navItem('questions', editContest ? `Questions: ${editContest.name.substring(0, 15)}…` : 'Questions', '❓')}
        {navItem('settings', 'Settings', '⚙️')}
        <div style={{ marginTop: 'auto' }}>
          <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 1rem', borderRadius: '10px', border: 'none', background: 'rgba(239,68,68,0.08)', color: '#f87171', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, width: '100%' }}>🚪 Logout</button>
        </div>
      </aside>

      {/* Main Area */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <header style={{ background: 'rgba(17,24,39,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 5, flexShrink: 0 }}>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            {tab === 'overview' && 'Dashboard Overview'}
            {tab === 'contests' && 'Contest Management'}
            {tab === 'tokens' && 'Contest Access Tokens & Single-Use Codes'}
            {tab === 'admins' && 'Platform & Contest Administrator Management'}
            {tab === 'students' && 'Student Submissions'}
            {tab === 'questions' && (editContest ? `Contest: ${editContest.name}` : 'Question Editor')}
            {tab === 'settings' && 'Platform Settings'}
          </h1>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {tab === 'admins' && (
              <button onClick={() => setShowAddAdminModal(true)} style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', border: 'none', borderRadius: '10px', color: '#fff', padding: '0.55rem 1.1rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
                + Add Platform Admin
              </button>
            )}
            {(tab === 'contests' || tab === 'tokens') && <button onClick={() => setShowCreate(true)} style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '10px', color: '#fff', padding: '0.55rem 1.1rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>+ New Contest</button>}
            {tab === 'questions' && editContest && (
              <>
                <button onClick={() => startAdd('mcq')} style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '10px', color: '#86efac', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>+ MCQ Question</button>
                <button onClick={() => startAdd('code')} style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', color: '#fcd34d', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>+ Coding Question (Test Cases)</button>
                <button onClick={() => setTab('contests')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#94a3b8', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>← Back</button>
              </>
            )}
          </div>
        </header>

        <main style={{ padding: '2rem', flex: 1 }}>
          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                {[['👥', 'Total Students', totalStudents, '#6366f1'], ['🔥', 'Active Contests', activeContests, '#f59e0b'], ['🛡️', 'Platform Admins', admins.length, '#8b5cf6'], ['📝', 'Total Submissions', totalSubs, '#22c55e']].map(([ic, lbl, val, col]) => (
                  <div key={lbl} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '1.5rem' }}>
                    <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{ic}</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: col }}>{val}</div>
                    <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '0.2rem', fontWeight: 500 }}>{lbl}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#94a3b8' }}>Live Contests & Access Tokens</h2>
                  <button onClick={() => setTab('tokens')} style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Manage All Tokens 🔑 →</button>
                </div>
                {contests.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name}</span>
                      <span style={{ color: '#64748b', fontSize: '0.78rem', marginLeft: '0.75rem' }}>{c.questions?.length || 0} questions · {c.marks} marks · {c.students || 0} submissions</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span onClick={() => copyToClipboard(c.token || c.password, 'Token')} title="Click to copy token" style={{ cursor: 'pointer', fontFamily: 'monospace', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', borderRadius: '8px', padding: '0.25rem 0.6rem', fontSize: '0.75rem', fontWeight: 700 }}>
                        🔑 {c.token || c.password} 📋
                      </span>
                      <Badge text={c.status} />
                      <button onClick={() => openQuestions(c)} style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '8px', color: '#818cf8', padding: '0.3rem 0.7rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>Questions ❓</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── CONTESTS ── */}
          {tab === 'contests' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {contests.map(c => (
                <div key={c.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{c.name}</h3>
                        <Badge text={c.status} />
                        <span style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '20px', padding: '0.15rem 0.65rem', fontSize: '0.7rem', fontWeight: 600 }}>{c.type}</span>
                      </div>
                      <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: '0.6rem' }}>{c.desc || 'No description.'}</p>
                      <div style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span>⏱ {c.duration} min</span>
                        <span>📊 {c.marks} marks</span>
                        <span>❓ {c.questions?.length || 0} questions</span>
                        <span>👥 {c.students || 0} submissions</span>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(99,102,241,0.15)', padding: '0.2rem 0.6rem', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.3)' }}>
                          <span style={{ color: '#818cf8', fontSize: '0.75rem', fontWeight: 700 }}>🔑 Token:</span>
                          <code style={{ color: '#fff', fontWeight: 700, fontSize: '0.8rem' }}>{c.token || c.password}</code>
                          <button onClick={() => copyToClipboard(c.token || c.password, 'Token')} style={{ background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', padding: 0, fontSize: '0.75rem' }}>📋</button>
                        </div>
                        <span>🛡️ Coordinators: <strong style={{ color: '#c7d2fe' }}>{(c.admins || []).length}</strong></span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button onClick={() => { setSelectedContestAdminId(c.id); setAdminView('contest'); setTab('admins'); }} style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '10px', color: '#c4b5fd', padding: '0.5rem 0.9rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>🛡️ Admins</button>
                      <button onClick={() => { setTokenContestId(c.id); setTab('tokens'); }} style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '10px', color: '#a5b4fc', padding: '0.5rem 0.9rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>🔑 Tokens</button>
                      <button onClick={() => openQuestions(c)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#e2e8f0', padding: '0.5rem 0.9rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>Questions ({c.questions?.length || 0})</button>
                      <button onClick={() => toggleStatus(c.id)} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#94a3b8', padding: '0.5rem 0.8rem', cursor: 'pointer', fontSize: '0.82rem' }}>Status</button>
                      <button onClick={() => deleteContest(c.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', color: '#f87171', padding: '0.5rem 0.8rem', cursor: 'pointer', fontSize: '0.82rem' }}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── ADMINS & FACULTY MANAGEMENT ── */}
          {tab === 'admins' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Sub-tab switcher */}
              <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem' }}>
                <button
                  onClick={() => setAdminView('platform')}
                  style={{ padding: '0.6rem 1.4rem', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', background: adminView === 'platform' ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : 'rgba(255,255,255,0.05)', color: adminView === 'platform' ? '#fff' : '#94a3b8' }}
                >
                  🌐 Global Website Admins ({admins.length})
                </button>
                <button
                  onClick={() => setAdminView('contest')}
                  style={{ padding: '0.6rem 1.4rem', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', background: adminView === 'contest' ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : 'rgba(255,255,255,0.05)', color: adminView === 'contest' ? '#fff' : '#94a3b8' }}
                >
                  🏆 Contest-Specific Coordinators
                </button>
              </div>

              {/* View 1: Global Platform Administrators */}
              {adminView === 'platform' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.25rem' }}>
                      <div style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Admins</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#c084fc', marginTop: '0.3rem' }}>{admins.length}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.25rem' }}>
                      <div style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Super Admins</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#818cf8', marginTop: '0.3rem' }}>
                        {admins.filter(a => a.role === 'Super Admin').length}
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.25rem' }}>
                      <div style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Faculty / Evaluators</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399', marginTop: '0.3rem' }}>
                        {admins.filter(a => a.role !== 'Super Admin').length}
                      </div>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', overflow: 'hidden' }}>
                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>Registered Platform Administrators</h3>
                        <p style={{ color: '#64748b', fontSize: '0.8rem' }}>These administrators have full or role-based access to the platform console.</p>
                      </div>
                      <button onClick={() => setShowAddAdminModal(true)} style={{ padding: '0.55rem 1.1rem', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', border: 'none', borderRadius: '10px', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}>
                        + Add Platform Admin
                      </button>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            {['Name', 'Email / Login', 'Role', 'Department', 'Status', 'Added On', 'Action'].map(h => (
                              <th key={h} style={{ padding: '0.9rem 1.25rem', textAlign: 'left', color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {admins.map((adm, i) => {
                            const roleColor = adm.role === 'Super Admin' ? '#c084fc' : adm.role === 'Faculty Admin' ? '#818cf8' : '#34d399';
                            return (
                              <tr key={adm.id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                                <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: '#f8fafc', fontSize: '0.9rem' }}>{adm.name}</td>
                                <td style={{ padding: '1rem 1.25rem', fontFamily: 'monospace', color: '#cbd5e1', fontSize: '0.85rem' }}>{adm.email}</td>
                                <td style={{ padding: '1rem 1.25rem' }}>
                                  <span style={{ background: `${roleColor}18`, color: roleColor, border: `1px solid ${roleColor}35`, borderRadius: '20px', padding: '0.2rem 0.7rem', fontSize: '0.72rem', fontWeight: 700 }}>
                                    {adm.role}
                                  </span>
                                </td>
                                <td style={{ padding: '1rem 1.25rem', color: '#94a3b8', fontSize: '0.85rem' }}>{adm.department}</td>
                                <td style={{ padding: '1rem 1.25rem' }}>
                                  <span style={{ color: '#22c55e', fontSize: '0.78rem', fontWeight: 600 }}>● Active</span>
                                </td>
                                <td style={{ padding: '1rem 1.25rem', color: '#64748b', fontSize: '0.8rem' }}>{adm.addedAt || '30 Aug 2026'}</td>
                                <td style={{ padding: '1rem 1.25rem' }}>
                                  <button onClick={() => handleDeletePlatformAdmin(adm.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}>
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* View 2: Contest-Specific Coordinators */}
              {adminView === 'contest' && selectedAdminContest && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Contest Selector Header */}
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select Contest:</span>
                      <select value={selectedContestAdminId} onChange={e => setSelectedContestAdminId(Number(e.target.value))} style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '0.6rem 1rem', color: '#f1f5f9', fontSize: '0.9rem', outline: 'none', cursor: 'pointer', fontWeight: 600 }}>
                        {contests.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({(c.admins || []).length} Coordinators)</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Assign Coordinator Card */}
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '1.75rem' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.35rem' }}>
                      🛡️ Coordinators Assigned to "{selectedAdminContest.name}"
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
                      These faculty coordinators manage questions, monitor live student submissions, and invigilate this specific contest.
                    </p>

                    {/* Quick Assign Form */}
                    <div style={{ display: 'flex', gap: '0.75rem', maxWidth: '600px', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
                      <select
                        value={selectedAdminToAssign}
                        onChange={e => setSelectedAdminToAssign(e.target.value)}
                        style={{ flex: 1, minWidth: '220px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '0.7rem 1rem', color: '#f1f5f9', fontSize: '0.875rem', outline: 'none' }}
                      >
                        <option value="">-- Choose Platform Admin to Assign --</option>
                        {admins.map(a => (
                          <option key={a.id} value={a.email}>{a.name} ({a.email}) - {a.role}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleAssignContestAdmin(selectedAdminContest.id, selectedAdminToAssign)}
                        disabled={!selectedAdminToAssign}
                        style={{ padding: '0.7rem 1.4rem', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', border: 'none', borderRadius: '10px', color: '#fff', cursor: selectedAdminToAssign ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: '0.875rem', opacity: selectedAdminToAssign ? 1 : 0.6 }}
                      >
                        + Assign to Contest
                      </button>
                    </div>

                    {/* Assigned Admins List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {(!selectedAdminContest.admins || selectedAdminContest.admins.length === 0) ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                          No coordinators assigned to this contest yet. Assign one above.
                        </div>
                      ) : (
                        selectedAdminContest.admins.map((email, idx) => {
                          const matchedAdmin = admins.find(a => a.email.toLowerCase() === email.toLowerCase());
                          return (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.25rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(124,58,237,0.2)', color: '#c4b5fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                                  🛡️
                                </span>
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>
                                    {matchedAdmin ? matchedAdmin.name : email}
                                  </div>
                                  <div style={{ color: '#64748b', fontSize: '0.78rem' }}>
                                    {email} {matchedAdmin && `· ${matchedAdmin.department} (${matchedAdmin.role})`}
                                  </div>
                                </div>
                              </div>
                              <button onClick={() => handleRemoveContestAdmin(selectedAdminContest.id, email)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', color: '#f87171', padding: '0.35rem 0.75rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                                Remove
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ACCESS TOKENS MANAGER ── */}
          {tab === 'tokens' && selectedTokenContest && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Contest Selector Header */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select Contest:</span>
                  <select value={tokenContestId} onChange={e => setTokenContestId(Number(e.target.value))} style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '0.6rem 1rem', color: '#f1f5f9', fontSize: '0.9rem', outline: 'none', cursor: 'pointer', fontWeight: 600 }}>
                    {contests.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.status})</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={() => handleCopyAllUnusedTokens(selectedTokenContest)} style={{ padding: '0.55rem 1.1rem', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '10px', color: '#a5b4fc', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                    📋 Copy All Unused Tokens
                  </button>
                  <button onClick={() => handleClearUsedTokens(selectedTokenContest.id)} style={{ padding: '0.55rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}>
                    🧹 Clear Used
                  </button>
                </div>
              </div>

              {/* Master Access Token Card */}
              <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.05) 100%)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '20px', padding: '1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>⭐</span>
                      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9' }}>Universal Master Access Token</h2>
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                      Any student with this token can unlock this contest multiple times. Share this with entire classes or invigilators.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <button onClick={() => copyToClipboard(selectedTokenContest.token || selectedTokenContest.password, 'Master Token')} style={{ padding: '0.6rem 1.25rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '10px', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}>
                      📋 Copy Master Token
                    </button>
                    <button onClick={() => handleRegenerateMaster(selectedTokenContest.id)} style={{ padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#cbd5e1', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                      🔄 Regenerate
                    </button>
                  </div>
                </div>

                {isEditingMaster ? (
                  <div style={{ display: 'flex', gap: '0.75rem', maxWidth: '480px', marginTop: '1rem' }}>
                    <input
                      type="text"
                      value={customMasterToken}
                      onChange={e => setCustomMasterToken(e.target.value.toUpperCase())}
                      placeholder="e.g. ISTE-2024-CODE"
                      style={{ flex: 1, background: '#111827', border: '1px solid rgba(99,102,241,0.5)', borderRadius: '10px', padding: '0.65rem 1rem', color: '#fff', fontSize: '1rem', fontWeight: 700, outline: 'none', letterSpacing: '0.05em' }}
                    />
                    <button onClick={() => handleSaveMaster(selectedTokenContest.id)} style={{ padding: '0.65rem 1.25rem', background: '#22c55e', border: 'none', borderRadius: '10px', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Save</button>
                    <button onClick={() => setIsEditingMaster(false)} style={{ padding: '0.65rem 1rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#94a3b8', cursor: 'pointer' }}>Cancel</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem' }}>
                    <div style={{ background: '#020617', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '12px', padding: '0.75rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
                      <code style={{ fontSize: '1.25rem', fontWeight: 800, color: '#a5b4fc', letterSpacing: '0.08em' }}>
                        {selectedTokenContest.token || selectedTokenContest.password}
                      </code>
                    </div>
                    <button onClick={() => { setCustomMasterToken(selectedTokenContest.token || selectedTokenContest.password); setIsEditingMaster(true); }} style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                      ✏️ Edit Custom Token
                    </button>
                  </div>
                )}
              </div>

              {/* Single-Use Token Batch Generator */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.25rem' }}>
                      🎫 Single-Use Student Access Tokens ({(selectedTokenContest.accessTokens || []).length})
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '0.8rem' }}>
                      Each token can only be used once by one student JNTU number. Prevents sharing among students.
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button onClick={() => handleGenerateSingleUseTokens(selectedTokenContest.id, 5)} style={{ padding: '0.5rem 0.9rem', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '10px', color: '#a5b4fc', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>+5 Tokens</button>
                    <button onClick={() => handleGenerateSingleUseTokens(selectedTokenContest.id, 10)} style={{ padding: '0.5rem 0.9rem', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '10px', color: '#a5b4fc', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>+10 Tokens</button>
                    <button onClick={() => handleGenerateSingleUseTokens(selectedTokenContest.id, 25)} style={{ padding: '0.5rem 0.9rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '10px', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}>+25 Tokens</button>
                  </div>
                </div>

                {(!selectedTokenContest.accessTokens || selectedTokenContest.accessTokens.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: '#64748b', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎫</div>
                    <div style={{ color: '#94a3b8', fontWeight: 600, marginBottom: '0.25rem' }}>No Single-Use Tokens Generated</div>
                    <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '1rem' }}>Generate single-use tokens above to distribute one-to-one tokens to your students.</p>
                    <button onClick={() => handleGenerateSingleUseTokens(selectedTokenContest.id, 10)} style={{ padding: '0.6rem 1.25rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '10px', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>Generate 10 Tokens Now</button>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                          {['#', 'Access Token Code', 'Status', 'Redeemed By (JNTU No.)', 'Redeemed At', 'Actions'].map(h => (
                            <th key={h} style={{ padding: '0.85rem 1rem', textAlign: 'left', color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTokenContest.accessTokens.map((t, idx) => (
                          <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                            <td style={{ padding: '0.85rem 1rem', color: '#475569', fontSize: '0.8rem' }}>{idx + 1}</td>
                            <td style={{ padding: '0.85rem 1rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <code style={{ fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 700, color: t.isUsed ? '#64748b' : '#818cf8' }}>{t.code}</code>
                                <button onClick={() => copyToClipboard(t.code, 'Token')} title="Copy Token" style={{ background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', padding: '0.2rem', fontSize: '0.8rem' }}>📋</button>
                              </div>
                            </td>
                            <td style={{ padding: '0.85rem 1rem' }}>
                              {t.isUsed ? (
                                <span style={{ background: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.3)', borderRadius: '20px', padding: '0.2rem 0.65rem', fontSize: '0.7rem', fontWeight: 700 }}>Used</span>
                              ) : (
                                <span style={{ background: 'rgba(34,197,94,0.12)', color: '#86efac', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '20px', padding: '0.2rem 0.65rem', fontSize: '0.7rem', fontWeight: 700 }}>Unused</span>
                              )}
                            </td>
                            <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', color: t.usedBy ? '#f1f5f9' : '#475569', fontSize: '0.85rem' }}>
                              {t.usedBy || '—'}
                            </td>
                            <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
                              {t.usedAt || t.createdAt || '—'}
                            </td>
                            <td style={{ padding: '0.85rem 1rem' }}>
                              <button onClick={() => handleDeleteToken(selectedTokenContest.id, t.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.78rem', padding: '0.2rem 0.5rem' }}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── QUESTIONS (WITH MULTIPLE TEST CASES BUILDER) ── */}
          {tab === 'questions' && editContest && (
            <div>
              <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '14px', padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <span style={{ fontWeight: 700, color: '#c7d2fe' }}>{editContest.name}</span>
                  <span style={{ color: '#64748b', fontSize: '0.82rem', marginLeft: '0.75rem' }}>
                    {editContest.questions?.length || 0} questions · {editContest.marks || 0} total marks
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => startAdd('mcq')} style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '10px', color: '#86efac', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>+ MCQ</button>
                  <button onClick={() => startAdd('code')} style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', color: '#fcd34d', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>+ Coding (with Test Cases)</button>
                </div>
              </div>

              {/* Add Question Form */}
              {addingQ && (
                <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px', padding: '1.75rem', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', color: addingQ.type === 'mcq' ? '#86efac' : '#fcd34d' }}>
                    {addingQ.type === 'mcq' ? '📝 Add Multiple Choice Question' : '💻 Add Coding Question with Multiple Test Cases'}
                  </h3>

                  {addingQ.type === 'code' && (
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Problem Title *</label>
                      <input
                        value={addingQ.title}
                        onChange={e => setAddingQ(q => ({ ...q, title: e.target.value }))}
                        placeholder="e.g. Reverse an Array / Two Sum"
                        {...inp({})}
                      />
                    </div>
                  )}

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                      {addingQ.type === 'mcq' ? 'Question Statement *' : 'Problem Description, Input/Output Format & Constraints *'}
                    </label>
                    <textarea
                      rows={5}
                      value={addingQ.text}
                      onChange={e => setAddingQ(q => ({ ...q, text: e.target.value }))}
                      placeholder={addingQ.type === 'mcq' ? 'e.g. What is the time complexity of QuickSort?' : 'Detailed problem description with input/output format and constraints...'}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.75rem 1rem', color: '#f1f5f9', fontSize: '0.875rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.6 }}
                    />
                  </div>

                  {/* MCQ Options */}
                  {addingQ.type === 'mcq' && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>Options (A–D) *</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                        {addingQ.options.map((opt, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span
                              style={{ width: '26px', height: '26px', borderRadius: '50%', background: addingQ.correct === i ? '#6366f1' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 700, color: addingQ.correct === i ? '#fff' : '#64748b', flexShrink: 0, cursor: 'pointer' }}
                              onClick={() => setAddingQ(q => ({ ...q, correct: i }))}
                            >
                              {String.fromCharCode(65 + i)}
                            </span>
                            <input
                              value={opt}
                              onChange={e => setAddingQ(q => { const o = [...q.options]; o[i] = e.target.value; return { ...q, options: o }; })}
                              placeholder={`Option ${String.fromCharCode(65 + i)}`}
                              {...inp({})}
                            />
                          </div>
                        ))}
                      </div>
                      <p style={{ color: '#475569', fontSize: '0.75rem', marginTop: '0.4rem' }}>Click letter circle to set the correct answer (Currently: {String.fromCharCode(65 + addingQ.correct)})</p>
                    </div>
                  )}

                  {/* Multiple Test Cases Manager for Coding Questions */}
                  {addingQ.type === 'code' && (
                    <div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#e2e8f0' }}>Test Cases (HackerRank Evaluation)</h4>
                          <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>Provide sample test cases for students and hidden test cases for final marks evaluation.</p>
                        </div>
                        <button type="button" onClick={addTestCase} style={{ padding: '0.4rem 0.8rem', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', color: '#a5b4fc', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>+ Add Test Case</button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {(addingQ.testCases || []).map((tc, idx) => (
                          <div key={tc.id || idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: tc.isHidden ? '#f59e0b' : '#38bdf8' }}>
                                Test Case #{idx + 1} {tc.isHidden ? '(🔒 Hidden)' : '(👁️ Public Sample)'}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer' }}>
                                  <input type="checkbox" checked={tc.isHidden} onChange={e => updateTestCase(idx, 'isHidden', e.target.checked)} />
                                  Hidden Test Case
                                </label>
                                {addingQ.testCases.length > 1 && (
                                  <button type="button" onClick={() => removeTestCase(idx)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.75rem' }}>Remove</button>
                                )}
                              </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.5rem' }}>
                              <div>
                                <label style={{ display: 'block', color: '#64748b', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Input (Standard Input / stdin)</label>
                                <textarea rows={2} value={tc.input} onChange={e => updateTestCase(idx, 'input', e.target.value)} placeholder="Input for this test case..." style={{ width: '100%', background: '#020617', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0.5rem', color: '#e2e8f0', fontSize: '0.78rem', fontFamily: 'monospace', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                              </div>
                              <div>
                                <label style={{ display: 'block', color: '#64748b', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Expected Output (Exact stdout) *</label>
                                <textarea rows={2} value={tc.expected} onChange={e => updateTestCase(idx, 'expected', e.target.value)} placeholder="Expected output string..." required style={{ width: '100%', background: '#020617', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0.5rem', color: '#86efac', fontSize: '0.78rem', fontFamily: 'monospace', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button type="button" onClick={saveQuestion} style={{ padding: '0.65rem 1.5rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '10px', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem' }}>Save Question</button>
                    <button type="button" onClick={() => setAddingQ(null)} style={{ padding: '0.65rem 1rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#94a3b8', cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
                  </div>
                </div>
              )}

              {/* Questions List for Contest */}
              {(!editContest.questions || editContest.questions.length === 0) ? (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '18px', padding: '3.5rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>❓</div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>No Questions Added Yet</h3>
                  <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '1.25rem' }}>Add MCQ or Coding questions with automated test case evaluation above.</p>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                    <button onClick={() => startAdd('mcq')} style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '10px', color: '#86efac', padding: '0.55rem 1.1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>+ Add MCQ</button>
                    <button onClick={() => startAdd('code')} style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', color: '#fcd34d', padding: '0.55rem 1.1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>+ Add Coding Problem</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {editContest.questions.map((q, i) => (
                    <div key={q.id || i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', padding: '0.2rem 0.6rem', fontSize: '0.75rem', fontWeight: 700 }}>Q{i + 1}</span>
                          <span style={{ background: q.type === 'mcq' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', color: q.type === 'mcq' ? '#86efac' : '#fcd34d', border: `1px solid ${q.type === 'mcq' ? 'rgba(34,197,94,0.25)' : 'rgba(245,158,11,0.25)'}`, borderRadius: '8px', padding: '0.2rem 0.6rem', fontSize: '0.72rem', fontWeight: 600 }}>
                            {q.type === 'mcq' ? 'MCQ' : `Coding Problem (${q.testCases?.length || 0} Test Cases)`}
                          </span>
                          <span style={{ color: '#64748b', fontSize: '0.78rem' }}>{q.marks} marks</span>
                        </div>
                        <button onClick={() => deleteQuestion(q.id)} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#f87171', padding: '0.3rem 0.65rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>Delete</button>
                      </div>

                      {q.type === 'code' && q.title && (
                        <h4 style={{ margin: '0 0 0.4rem', fontSize: '0.95rem', color: '#e2e8f0' }}>{q.title}</h4>
                      )}

                      <p style={{ fontSize: '0.875rem', color: '#cbd5e1', lineHeight: 1.5, whiteSpace: 'pre-wrap', marginBottom: '0.75rem' }}>{q.text}</p>

                      {q.type === 'mcq' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                          {q.options.map((opt, oi) => (
                            <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: q.correct === oi ? '#86efac' : '#64748b' }}>
                              <span style={{ fontWeight: 700 }}>{String.fromCharCode(65 + oi)}.</span> {opt}
                              {q.correct === oi && <span style={{ color: '#22c55e', fontSize: '0.7rem' }}>✓</span>}
                            </div>
                          ))}
                        </div>
                      )}

                      {q.type === 'code' && q.testCases && (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
                          {q.testCases.map((tc, tci) => (
                            <span key={tci} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '6px', padding: '0.2rem 0.5rem', fontSize: '0.7rem', color: tc.isHidden ? '#f59e0b' : '#94a3b8' }}>
                              {tc.isHidden ? '🔒 Hidden' : '👁️ Sample'} #{tci + 1}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── STUDENTS SUBMISSIONS ── */}
          {tab === 'students' && (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', overflow: 'hidden' }}>
              {submissions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 1.5rem', color: '#64748b' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📋</div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>No Submissions Yet</h3>
                  <p style={{ fontSize: '0.85rem', color: '#475569', maxWidth: '400px', margin: '0 auto' }}>
                    Student submissions, scores, and test details will appear here automatically in real time as students complete exams.
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        {['JNTU No.', 'Name', 'Branch', 'Score', 'Percentage', 'Contest', 'Submitted At'].map(h => (
                          <th key={h} style={{ padding: '1rem 1.25rem', textAlign: 'left', color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((s, i) => (
                        <tr key={s.id || `${s.jntuNo}-${i}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                          <td style={{ padding: '1rem 1.25rem', fontFamily: 'monospace', color: '#818cf8', fontSize: '0.875rem' }}>{s.jntuNo}</td>
                          <td style={{ padding: '1rem 1.25rem', fontWeight: 600, fontSize: '0.9rem' }}>{s.name}</td>
                          <td style={{ padding: '1rem 1.25rem', color: '#94a3b8', fontSize: '0.875rem' }}>{s.branch}</td>
                          <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: '#f1f5f9' }}>{s.score} / {s.total}</td>
                          <td style={{ padding: '1rem 1.25rem' }}>
                            <span style={{ color: (s.percentage || 0) >= 75 ? '#86efac' : (s.percentage || 0) >= 50 ? '#fcd34d' : '#f87171', fontWeight: 700 }}>
                              {s.percentage !== undefined ? `${s.percentage}%` : `${Math.round((s.score / s.total) * 100)}%`}
                            </span>
                          </td>
                          <td style={{ padding: '1rem 1.25rem', color: '#64748b', fontSize: '0.8rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.contest}</td>
                          <td style={{ padding: '1rem 1.25rem', color: '#475569', fontSize: '0.8rem' }}>{s.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── SETTINGS ── */}
          {tab === 'settings' && (
            <div style={{ maxWidth: '600px' }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '1.75rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem' }}>Platform Settings</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[['Platform Name', 'CodeIT – GMRIT'], ['Institution', 'GMR Institute of Technology'], ['Admin Email', 'admin@gmrit.edu.in'], ['MongoDB URI', 'mongodb://localhost:27017/codeit']].map(([lbl, val]) => (
                    <div key={lbl}>
                      <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>{lbl}</label>
                      <input defaultValue={val} style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.75rem 1rem', color: '#f1f5f9', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  ))}
                  <button onClick={() => notify('Settings saved successfully!')} style={{ alignSelf: 'flex-start', padding: '0.65rem 1.5rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '10px', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem' }}>Save Settings</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add Platform Admin Modal */}
      {showAddAdminModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }} onClick={e => { if (e.target === e.currentTarget) setShowAddAdminModal(false); }}>
          <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '22px', padding: '2.25rem', width: '100%', maxWidth: '480px', boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.3rem' }}>🛡️</span>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Add Platform Administrator</h2>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: '1.5rem' }}>Create admin access for faculty members or examination controllers.</p>
            <form onSubmit={handleAddPlatformAdmin}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Admin Full Name *</label>
                  <input value={newAdmin.name} onChange={e => setNewAdmin(a => ({ ...a, name: e.target.value }))} placeholder="e.g. Dr. K. Ramesh Kumar" required style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.75rem 1rem', color: '#f1f5f9', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Admin Email / Username *</label>
                  <input type="email" value={newAdmin.email} onChange={e => setNewAdmin(a => ({ ...a, email: e.target.value }))} placeholder="faculty@gmrit.edu.in" required style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.75rem 1rem', color: '#f1f5f9', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Password *</label>
                  <input type="text" value={newAdmin.password} onChange={e => setNewAdmin(a => ({ ...a, password: e.target.value }))} placeholder="Set login password" required style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.75rem 1rem', color: '#f1f5f9', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Role</label>
                    <select value={newAdmin.role} onChange={e => setNewAdmin(a => ({ ...a, role: e.target.value }))} style={{ width: '100%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.75rem 0.75rem', color: '#f1f5f9', fontSize: '0.875rem', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}>
                      <option>Super Admin</option>
                      <option>Faculty Admin</option>
                      <option>Exam Invigilator</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Department</label>
                    <input value={newAdmin.department} onChange={e => setNewAdmin(a => ({ ...a, department: e.target.value }))} placeholder="e.g. CSE / IT" style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.75rem 0.75rem', color: '#f1f5f9', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowAddAdminModal(false)} style={{ flex: 1, padding: '0.85rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#94a3b8', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '0.85rem', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', border: 'none', borderRadius: '12px', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>+ Add Administrator</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Contest Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }} onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '22px', padding: '2.25rem', width: '100%', maxWidth: '520px', boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>Create New Contest</h2>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Contest Name *</label>
                  <input value={newC.name} onChange={e => setNewC(n => ({ ...n, name: e.target.value }))} placeholder="e.g. Coding Assessment Round 2" required style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.75rem 1rem', color: '#f1f5f9', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Description</label>
                  <textarea value={newC.desc} onChange={e => setNewC(n => ({ ...n, desc: e.target.value }))} rows={2} placeholder="Brief description of the contest..." style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.75rem 1rem', color: '#f1f5f9', fontSize: '0.875rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Duration (min) *</label>
                    <input type="number" min={5} max={300} value={newC.duration} onChange={e => setNewC(n => ({ ...n, duration: e.target.value }))} required style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.75rem 0.75rem', color: '#f1f5f9', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Type</label>
                    <select value={newC.type} onChange={e => setNewC(n => ({ ...n, type: e.target.value }))} style={{ width: '100%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.75rem 0.75rem', color: '#f1f5f9', fontSize: '0.875rem', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}>
                      <option>Coding</option><option>MCQ</option><option>Mixed</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Status</label>
                    <select value={newC.status} onChange={e => setNewC(n => ({ ...n, status: e.target.value }))} style={{ width: '100%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.75rem 0.75rem', color: '#f1f5f9', fontSize: '0.875rem', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}>
                      <option>Open</option><option>Upcoming</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                    Access Token / Passcode (Optional, auto-generated if blank)
                  </label>
                  <input value={newC.token} onChange={e => setNewC(n => ({ ...n, token: e.target.value.toUpperCase() }))} placeholder="e.g. ROUND2-2024-CODE" style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.75rem 1rem', color: '#f1f5f9', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', textTransform: 'uppercase' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowCreate(false)} style={{ flex: 1, padding: '0.85rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#94a3b8', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '0.85rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '12px', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Create & Add Questions →</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
