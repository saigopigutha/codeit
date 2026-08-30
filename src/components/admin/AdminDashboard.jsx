import React, { useState } from 'react';

function Badge({ text }) {
  const map = { Open: '#22c55e', Upcoming: '#f59e0b', Closed: '#ef4444' };
  const c = map[text] || '#818cf8';
  return <span style={{ background: `${c}18`, color: c, border: `1px solid ${c}35`, borderRadius: '20px', padding: '0.2rem 0.75rem', fontSize: '0.72rem', fontWeight: 700 }}>{text}</span>;
}

const MOCK_STUDENTS = [
  { jntuNo: '24341A0574', name: 'Sai Gopi Gutha', branch: 'CSE', score: 87, contest: 'ISTE Coding Challenge – Round 1', time: '30 Aug, 3:01 PM' },
  { jntuNo: '24341A0510', name: 'Arjun Reddy', branch: 'ECE', score: 72, contest: 'ISTE Coding Challenge – Round 1', time: '30 Aug, 3:15 PM' },
  { jntuNo: '23341A0322', name: 'Priya Sharma', branch: 'IT', score: 94, contest: 'Python Basics Assessment', time: '30 Aug, 3:22 PM' },
  { jntuNo: '22341A05B7', name: 'Kiran Kumar', branch: 'ME', score: 55, contest: 'ISTE Coding Challenge – Round 1', time: '30 Aug, 3:30 PM' },
];

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

export default function AdminDashboard({ contests, setContests, onLogout }) {
  const [tab, setTab] = useState('overview');
  // Create contest modal
  const [showCreate, setShowCreate] = useState(false);
  const [newC, setNewC] = useState({ name: '', desc: '', duration: 60, type: 'Mixed', password: '', status: 'Upcoming' });
  // Question management panel
  const [editContest, setEditContest] = useState(null);
  const [addingQ, setAddingQ] = useState(null); // null | MCQ-draft | code-draft
  const [addType, setAddType] = useState('mcq');

  const totalStudents = 214;
  const activeContests = contests.filter(c => c.status === 'Open').length;
  const totalSubs = contests.reduce((s, c) => s + (c.students || 0), 0);

  /* ── Create contest ── */
  const handleCreate = e => {
    e.preventDefault();
    const nc = { ...newC, id: Date.now(), students: 0, questions: [], marks: 0 };
    setContests(cs => [...cs, nc]);
    setEditContest(nc);
    setShowCreate(false);
    setNewC({ name: '', desc: '', duration: 60, type: 'Mixed', password: '', status: 'Upcoming' });
    setTab('questions');
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
      <aside style={{ width: '225px', flexShrink: 0, background: '#111827', borderRight: '1px solid rgba(255,255,255,0.07)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{logoSvg}</div>
          <div><div style={{ fontWeight: 800, fontSize: '1rem' }}>CodeIT</div><div style={{ color: '#475569', fontSize: '0.7rem' }}>Admin Portal</div></div>
        </div>
        {navItem('overview', 'Overview', '📊')}
        {navItem('contests', 'Contests', '🏆')}
        {navItem('students', 'Students', '👥')}
        {tab === 'questions' && navItem('questions', editContest ? `Questions: ${editContest.name.substring(0, 18)}…` : 'Questions', '❓')}
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
            {tab === 'students' && 'Student Submissions'}
            {tab === 'questions' && (editContest ? `Contest: ${editContest.name}` : 'Question Editor')}
            {tab === 'settings' && 'Platform Settings'}
          </h1>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {tab === 'contests' && <button onClick={() => setShowCreate(true)} style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '10px', color: '#fff', padding: '0.55rem 1.1rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>+ New Contest</button>}
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
                {[['👥', 'Total Students', totalStudents, '#6366f1'], ['🔥', 'Active Contests', activeContests, '#f59e0b'], ['📝', 'Total Submissions', totalSubs, '#22c55e'], ['❓', 'Total Questions', contests.reduce((s, c) => s + (c.questions?.length || 0), 0), '#8b5cf6']].map(([ic, lbl, val, col]) => (
                  <div key={lbl} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '1.5rem' }}>
                    <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{ic}</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: col }}>{val}</div>
                    <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '0.2rem', fontWeight: 500 }}>{lbl}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '1.5rem' }}>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: '#94a3b8' }}>Contest List</h2>
                {contests.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '0.6rem' }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name}</span>
                      <span style={{ color: '#64748b', fontSize: '0.78rem', marginLeft: '0.75rem' }}>{c.questions?.length || 0} questions · {c.marks} total marks · {c.students || 0} submissions</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Badge text={c.status} />
                      <button onClick={() => openQuestions(c)} style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '8px', color: '#818cf8', padding: '0.3rem 0.7rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>Manage Questions ❓</button>
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
                      <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: '0.5rem' }}>{c.desc || 'No description.'}</p>
                      <div style={{ color: '#475569', fontSize: '0.78rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                        <span>⏱ {c.duration} min</span>
                        <span>📊 {c.marks} marks</span>
                        <span>❓ {c.questions?.length || 0} questions</span>
                        <span>👥 {c.students || 0} submissions</span>
                        <span>🔑 Password: <strong style={{ color: '#a5b4fc' }}>{c.password}</strong></span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button onClick={() => openQuestions(c)} style={{ padding: '0.5rem 0.9rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '8px', color: '#818cf8', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>❓ Questions ({c.questions?.length || 0})</button>
                      <button onClick={() => toggleStatus(c.id)} style={{ padding: '0.5rem 0.9rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Toggle Status</button>
                      <button onClick={() => deleteContest(c.id)} style={{ padding: '0.5rem 0.9rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#f87171', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
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
                          <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.75rem' }}>Add sample test cases (visible to students) and hidden test cases (for grading).</p>
                        </div>
                        <button type="button" onClick={addTestCase} style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', color: '#818cf8', padding: '0.4rem 0.85rem', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                          + Add Test Case
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        {(addingQ.testCases || []).map((tc, idx) => (
                          <div key={tc.id || idx} style={{ background: '#0a0f1d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: tc.isHidden ? '#f59e0b' : '#86efac' }}>
                                  Test Case #{idx + 1} {tc.isHidden ? '(🔒 Hidden)' : '(👁️ Sample)'}
                                </span>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer' }}>
                                  <input
                                    type="checkbox"
                                    checked={tc.isHidden}
                                    onChange={e => updateTestCase(idx, 'isHidden', e.target.checked)}
                                  />
                                  Hidden Test Case
                                </label>
                              </div>
                              {(addingQ.testCases || []).length > 1 && (
                                <button type="button" onClick={() => removeTestCase(idx)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.75rem' }}>
                                  Remove
                                </button>
                              )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.5rem' }}>
                              <div>
                                <label style={{ display: 'block', color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Input (Optional)</label>
                                <textarea
                                  rows={2}
                                  value={tc.input}
                                  onChange={e => updateTestCase(idx, 'input', e.target.value)}
                                  placeholder="Leave empty if no standard input required..."
                                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '0.4rem 0.6rem', color: '#f1f5f9', fontSize: '0.8rem', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Expected Output *</label>
                                <textarea
                                  rows={2}
                                  value={tc.expected}
                                  onChange={e => updateTestCase(idx, 'expected', e.target.value)}
                                  placeholder="e.g. 15 or Hello World"
                                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '0.4rem 0.6rem', color: '#86efac', fontSize: '0.8rem', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
                                />
                              </div>
                            </div>

                            {!tc.isHidden && (
                              <div>
                                <input
                                  value={tc.explanation || ''}
                                  onChange={e => updateTestCase(idx, 'explanation', e.target.value)}
                                  placeholder="Explanation for sample testcase (optional)"
                                  style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '6px', padding: '0.35rem 0.6rem', color: '#94a3b8', fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box' }}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Marks *</label>
                      <input
                        type="number"
                        min={1}
                        max={200}
                        value={addingQ.marks}
                        onChange={e => setAddingQ(q => ({ ...q, marks: parseInt(e.target.value) || 1 }))}
                        style={{ width: '100px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.65rem 0.9rem', color: '#f1f5f9', fontSize: '0.875rem', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => setAddingQ(null)} style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#94a3b8', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                    <button onClick={saveQuestion} style={{ padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '10px', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Save Question ✓</button>
                  </div>
                </div>
              )}

              {/* Question List */}
              {(!editContest.questions || editContest.questions.length === 0) && !addingQ ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#475569', background: 'rgba(255,255,255,0.02)', borderRadius: '18px', border: '1px dashed rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❓</div>
                  <p style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#64748b' }}>No questions yet</p>
                  <p style={{ fontSize: '0.85rem' }}>Click <strong style={{ color: '#86efac' }}>+ MCQ</strong> or <strong style={{ color: '#fcd34d' }}>+ Coding (with Test Cases)</strong> above to add questions.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {(editContest.questions || []).map((q, i) => (
                    <div key={q.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
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

          {/* ── STUDENTS ── */}
          {tab === 'students' && (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['JNTU No.', 'Name', 'Branch', 'Score', 'Contest', 'Time'].map(h => (
                      <th key={h} style={{ padding: '1rem 1.25rem', textAlign: 'left', color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_STUDENTS.map((s, i) => (
                    <tr key={s.jntuNo} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                      <td style={{ padding: '1rem 1.25rem', fontFamily: 'monospace', color: '#818cf8', fontSize: '0.875rem' }}>{s.jntuNo}</td>
                      <td style={{ padding: '1rem 1.25rem', fontWeight: 600, fontSize: '0.9rem' }}>{s.name}</td>
                      <td style={{ padding: '1rem 1.25rem', color: '#94a3b8', fontSize: '0.875rem' }}>{s.branch}</td>
                      <td style={{ padding: '1rem 1.25rem' }}><span style={{ color: s.score >= 75 ? '#86efac' : s.score >= 50 ? '#fcd34d' : '#f87171', fontWeight: 700 }}>{s.score}%</span></td>
                      <td style={{ padding: '1rem 1.25rem', color: '#64748b', fontSize: '0.8rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.contest}</td>
                      <td style={{ padding: '1rem 1.25rem', color: '#475569', fontSize: '0.8rem' }}>{s.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  <button onClick={() => alert('Settings saved!')} style={{ alignSelf: 'flex-start', padding: '0.65rem 1.5rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '10px', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem' }}>Save Settings</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Create Contest Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }} onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '22px', padding: '2.25rem', width: '100%', maxWidth: '500px', boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}>
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
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Contest Password *</label>
                  <input value={newC.password} onChange={e => setNewC(n => ({ ...n, password: e.target.value }))} placeholder="Password students need to enter" required style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.75rem 1rem', color: '#f1f5f9', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
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
