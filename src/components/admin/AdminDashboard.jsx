import React, { useState } from 'react';
import Logo from '../ui/Logo';

function Badge({ text }) {
  const map = { Open: '#22c55e', Upcoming: '#eab308', Closed: '#ef4444' };
  const c = map[text] || '#f97316';
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold px-2 py-0.5 rounded border" style={{ background: `${c}15`, color: c, borderColor: `${c}30` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
      {text}
    </span>
  );
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
  const [selectedSubmissionModal, setSelectedSubmissionModal] = useState(null);

  // Contest-Specific Dashboard & Analytics State
  const [analyticsContestId, setAnalyticsContestId] = useState(() => contests[0]?.id || 1);
  const [analyticsSearch, setAnalyticsSearch] = useState('');
  const [analyticsBranch, setAnalyticsBranch] = useState('All');

  const selectedTokenContest = contests.find(c => c.id === tokenContestId) || contests[0];
  const selectedAdminContest = contests.find(c => c.id === selectedContestAdminId) || contests[0];
  const selectedAnalyticsContest = contests.find(c => c.id === analyticsContestId) || contests[0];

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

  // Helper to calculate questions solved for a student submission
  const getSolvedCount = (sub, contest) => {
    if (!contest || !contest.questions) return { solved: 0, total: 0, mcqSolved: 0, codeSolved: 0 };
    let mcqSolved = 0;
    let codeSolved = 0;

    (contest.questions || []).forEach(q => {
      if (q.type === 'mcq') {
        if (sub.answers && sub.answers[q.id] === q.correct) {
          mcqSolved++;
        }
      } else if (q.type === 'code') {
        const codeScore = sub.codingScores?.[q.id]?.score;
        if (codeScore !== undefined && codeScore > 0) {
          codeSolved++;
        } else if (sub.code && sub.code[q.id] && sub.code[q.id].trim().length > 15) {
          codeSolved++;
        }
      }
    });

    return {
      solved: mcqSolved + codeSolved,
      total: contest.questions.length,
      mcqSolved,
      codeSolved
    };
  };

  // Export Contest Analytics to CSV
  const handleExportContestCSV = (contest, contestSubs) => {
    if (!contest) return;
    const sorted = [...contestSubs].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.timeTaken || 0) - (b.timeTaken || 0);
    });

    const headers = [
      'Rank',
      'JNTU Number',
      'Student Name',
      'Branch',
      'Score',
      'Total Marks',
      'Percentage',
      'Questions Solved',
      'Total Questions',
      'Time Taken (Min:Sec)',
      'Page Refreshes',
      'Tab Warnings',
      'Submitted At'
    ];

    const rows = sorted.map((s, index) => {
      const solvedInfo = getSolvedCount(s, contest);
      const timeFmt = s.timeTaken ? `${Math.floor(s.timeTaken / 60)}m ${s.timeTaken % 60}s` : 'N/A';
      const pct = s.percentage !== undefined ? s.percentage : Math.round((s.score / s.total) * 100);
      return [
        index + 1,
        `"${s.jntuNo || ''}"`,
        `"${(s.name || '').replace(/"/g, '""')}"`,
        `"${s.branch || ''}"`,
        s.score,
        s.total,
        `${pct}%`,
        solvedInfo.solved,
        solvedInfo.total,
        `"${timeFmt}"`,
        s.refreshes || 0,
        s.warnings || 0,
        `"${s.submittedAt || s.time || ''}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CodeIT_${contest.name.replace(/[^a-zA-Z0-9]/g, '_')}_Analytics.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify(`Exported CSV for ${contest.name}`, 'success');
  };

  const createContest = () => {
    if (!newC.name.trim()) return;
    const genToken = newC.token?.trim().toUpperCase() || `${newC.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase()}-${randomHex(4)}`;
    const created = {
      id: Date.now(),
      name: newC.name,
      desc: newC.desc,
      duration: Number(newC.duration),
      type: newC.type,
      marks: 100,
      students: 0,
      status: newC.status || 'Upcoming',
      token: genToken,
      password: genToken,
      accessTokens: [],
      admins: [],
      questions: []
    };
    setContests(cs => [...cs, created]);
    setNewC({ name: '', desc: '', duration: 60, type: 'Mixed', token: '', password: '', status: 'Upcoming' });
    setShowCreate(false);
    notify('Contest created successfully! Manage questions to add problems.');
  };

  const toggleStatus = id => {
    setContests(cs => cs.map(c => {
      if (c.id !== id) return c;
      const next = c.status === 'Open' ? 'Closed' : c.status === 'Closed' ? 'Upcoming' : 'Open';
      return { ...c, status: next };
    }));
  };

  const deleteContest = id => {
    if (window.confirm('Delete this contest permanently? All student tokens and question data will be lost.')) {
      setContests(cs => cs.filter(c => c.id !== id));
      notify('Contest deleted', 'info');
    }
  };

  // Question bank actions
  const openQuestions = c => {
    setEditContest(c);
    setAddingQ(null);
    setTab('questions');
  };

  const startAdd = type => {
    setAddType(type);
    setAddingQ(type === 'mcq' ? emptyMCQ() : emptyCode());
  };

  const saveQuestion = () => {
    if (!addingQ) return;
    if (addType === 'mcq' && !addingQ.text.trim()) { alert('Enter question text'); return; }
    if (addType === 'code' && (!addingQ.title.trim() || !addingQ.text.trim())) { alert('Enter problem title and description'); return; }

    const updated = {
      ...editContest,
      questions: [...(editContest.questions || []), addingQ]
    };
    // Recalculate marks
    updated.marks = updated.questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

    setContests(cs => cs.map(c => c.id === editContest.id ? updated : c));
    setEditContest(updated);
    setAddingQ(null);
    notify('Question added successfully!');
  };

  const deleteQuestion = qId => {
    const updated = {
      ...editContest,
      questions: editContest.questions.filter(q => q.id !== qId)
    };
    updated.marks = updated.questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
    setContests(cs => cs.map(c => c.id === editContest.id ? updated : c));
    setEditContest(updated);
    notify('Question deleted', 'info');
  };

  // ── Global & Contest Admin Management Handlers ──
  const handleAddPlatformAdmin = (e) => {
    e.preventDefault();
    if (!newAdmin.email.trim() || !newAdmin.name.trim()) return;

    const email = newAdmin.email.trim().toLowerCase();
    if (admins.some(a => a.email.toLowerCase() === email)) {
      notify('An administrator with this email already exists!', 'error');
      return;
    }

    const created = {
      id: Date.now(),
      name: newAdmin.name.trim(),
      email,
      password: newAdmin.password.trim() || 'admin123',
      role: newAdmin.role || 'Faculty Admin',
      department: newAdmin.department || 'CSE Department',
      createdAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    };

    setAdmins(prev => [...prev, created]);
    setShowAddAdminModal(false);
    setNewAdmin({ name: '', email: '', password: '', role: 'Faculty Admin', department: 'CSE Department' });
    notify(`Added ${created.name} (${created.role}) successfully!`);
  };

  const handleDeletePlatformAdmin = (adminId, adminEmail) => {
    if (admins.length <= 1) {
      notify('Cannot delete the last remaining platform admin!', 'error');
      return;
    }
    if (window.confirm(`Are you sure you want to remove administrator: ${adminEmail}?`)) {
      setAdmins(prev => prev.filter(a => a.id !== adminId));
      notify('Administrator removed', 'info');
    }
  };

  const handleAssignContestAdmin = (contestId, adminEmail) => {
    if (!adminEmail) return;
    setContests(prev => prev.map(c => {
      if (c.id !== contestId) return c;
      const currentAdmins = c.admins || [];
      if (currentAdmins.includes(adminEmail)) return c;
      return { ...c, admins: [...currentAdmins, adminEmail] };
    }));
    notify(`Assigned ${adminEmail} to this contest!`);
    setSelectedAdminToAssign('');
  };

  const handleRemoveContestAdmin = (contestId, adminEmail) => {
    setContests(prev => prev.map(c => {
      if (c.id !== contestId) return c;
      return { ...c, admins: (c.admins || []).filter(email => email !== adminEmail) };
    }));
    notify(`Removed coordinator ${adminEmail} from contest`, 'info');
  };

  // ── Access Token Handlers ──
  const handleSaveMasterToken = (contestId) => {
    const clean = customMasterToken.trim().toUpperCase();
    if (!clean) return;
    setContests(prev => prev.map(c => {
      if (c.id !== contestId) return c;
      return { ...c, token: clean, password: clean };
    }));
    setIsEditingMaster(false);
    notify(`Master token updated to: ${clean}`);
  };

  const handleGenerateBatchTokens = (contestId, count = 10, prefix = '') => {
    const contestObj = contests.find(c => c.id === contestId);
    if (!contestObj) return;

    const basePrefix = prefix.trim().toUpperCase() || `${contestObj.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase()}`;
    const newTokens = Array.from({ length: count }, () => ({
      id: Date.now() + Math.random(),
      code: `${basePrefix}-${randomHex(5)}`,
      createdAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      isUsed: false,
      usedBy: null,
      usedAt: null
    }));

    setContests(prev => prev.map(c => {
      if (c.id !== contestId) return c;
      return { ...c, accessTokens: [...(c.accessTokens || []), ...newTokens] };
    }));
    notify(`Generated ${count} single-use tokens!`);
  };

  const handleRevokeToken = (contestId, tokenId) => {
    setContests(prev => prev.map(c => {
      if (c.id !== contestId) return c;
      return { ...c, accessTokens: (c.accessTokens || []).filter(t => t.id !== tokenId) };
    }));
    notify('Token revoked', 'info');
  };

  const handleClearUsedTokens = (contestId) => {
    setContests(prev => prev.map(c => {
      if (c.id !== contestId) return c;
      return { ...c, accessTokens: (c.accessTokens || []).filter(t => !t.isUsed) };
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

  const navItem = (key, label, icon) => {
    const isActive = tab === key;
    return (
      <button
        onClick={() => setTab(key)}
        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
          isActive
            ? 'text-orange-500 bg-orange-500/10'
            : 'text-gray-400 hover:text-gray-100 hover:bg-[#1a1a1a]'
        }`}
      >
        <span className="text-sm">{icon}</span>
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#0d0d0d] text-[#f1f1f1]">
      {/* ── Left Sidebar (code.zone style) ── */}
      <aside className="w-60 flex-shrink-0 bg-[#111111] border-r border-[#2a2a2a] p-4 flex flex-col justify-between">
        <div>
          {/* Logo Header */}
          <div className="mb-6 pl-1 pb-4 border-b border-[#2a2a2a]">
            <Logo size="sm" subtitle="Admin Console" />
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {navItem('overview', 'Dashboard', '📊')}
            {navItem('contests', 'Contests', '🏆')}
            {navItem('analytics', 'Analytics', '📈')}
            {navItem('tokens', 'Access Tokens', '🔑')}
            {navItem('admins', 'Admins & Faculty', '👥')}
            {navItem('students', 'Submissions', '📋')}
            {tab === 'questions' && navItem('questions', editContest ? `Questions (${editContest.name.substring(0, 10)}…)` : 'Question Bank', '🗂️')}
            {navItem('settings', 'Settings', '⚙️')}
          </nav>
        </div>

        {/* User Profile Badge at Bottom */}
        <div className="pt-4 border-t border-[#2a2a2a]">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 font-mono font-bold flex items-center justify-center text-xs flex-shrink-0">
                A
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-white truncate">Super Admin</div>
                <div className="text-[10px] font-mono text-gray-500 truncate">admin@gmrit.edu.in</div>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Logout"
              className="text-gray-500 hover:text-red-400 p-1.5 rounded hover:bg-[#2a2a2a] transition-colors cursor-pointer"
            >
              🚪
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Canvas ── */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-[#0d0d0d]/90 backdrop-blur-md border-b border-[#2a2a2a] px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">
              {tab === 'overview' && 'Admin Dashboard Overview'}
              {tab === 'contests' && 'Contest Management'}
              {tab === 'analytics' && `Live Analytics: ${selectedAnalyticsContest?.name || 'Contest'}`}
              {tab === 'tokens' && 'Access Tokens & Single-Use Codes'}
              {tab === 'admins' && 'Platform & Contest Administrators'}
              {tab === 'students' && 'All Student Submissions'}
              {tab === 'questions' && (editContest ? `Questions: ${editContest.name}` : 'Question Bank')}
              {tab === 'settings' && 'Platform Settings'}
            </h1>
            <p className="text-[11px] font-mono text-gray-500">GMRIT Examination &amp; Proctoring Portal</p>
          </div>

          <div className="flex items-center gap-3">
            {tab === 'analytics' && selectedAnalyticsContest && (
              <button
                onClick={() => handleExportContestCSV(selectedAnalyticsContest, submissions.filter(s => s.contestId === selectedAnalyticsContest.id || s.contest === selectedAnalyticsContest.name))}
                className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-orange-500/20"
              >
                <span>📥</span>
                <span>Export CSV Report</span>
              </button>
            )}
            {tab === 'admins' && (
              <button
                onClick={() => setShowAddAdminModal(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-sm shadow-orange-500/20"
              >
                + Add Platform Admin
              </button>
            )}
            {(tab === 'contests' || tab === 'tokens') && (
              <button
                onClick={() => setShowCreate(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-sm shadow-orange-500/20"
              >
                + New Contest
              </button>
            )}
            {tab === 'questions' && editContest && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => startAdd('mcq')}
                  className="bg-[#1a1a1a] border border-[#2a2a2a] hover:border-orange-500 text-orange-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  + Add MCQ
                </button>
                <button
                  onClick={() => startAdd('code')}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  + Add Coding
                </button>
                <button
                  onClick={() => setTab('contests')}
                  className="text-gray-400 hover:text-white text-xs px-3 py-1.5 rounded-lg border border-[#2a2a2a] hover:border-gray-600 transition-colors cursor-pointer"
                >
                  ← Back
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Canvas Body */}
        <main className="p-8 flex-1 max-w-6xl w-full">
          {/* ── OVERVIEW TAB ── */}
          {tab === 'overview' && (
            <div className="space-y-6">
              {/* Top 4 KPI Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: '🔥', label: 'Active Contests', val: activeContests, color: '#f97316' },
                  { icon: '👥', label: 'Total Students', val: totalStudents, color: '#f1f1f1' },
                  { icon: '📝', label: 'Total Submissions', val: totalSubs, color: '#22c55e' },
                  { icon: '🛡️', label: 'Platform Admins', val: admins.length, color: '#eab308' },
                ].map(kpi => (
                  <div key={kpi.label} className="bg-[#1a1a1a] border border-[#2a2a2a] hover:border-orange-500/40 rounded-xl p-5 transition-all duration-200">
                    <div className="text-xl mb-2">{kpi.icon}</div>
                    <div className="text-2xl font-bold font-mono text-white tracking-tight">{kpi.val}</div>
                    <div className="text-[11px] font-mono uppercase tracking-wider text-gray-500 mt-1">{kpi.label}</div>
                  </div>
                ))}
              </div>

              {/* Recent Activity Stream (code.zone style) */}
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white tracking-tight">Recent Activity Stream</h3>
                  <span className="text-[11px] font-mono text-orange-400">Live feed</span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[#111111] border border-[#2a2a2a]">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-gray-200">DSA Quiz started — 43 students entered</span>
                    </div>
                    <span className="text-gray-500 text-[10px]">Just now</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-[#111111] border border-[#2a2a2a]">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-yellow-500" />
                      <span className="text-gray-200">Ravi Kumar (24341A0574) — fullscreen exit logged ⚠️</span>
                    </div>
                    <span className="text-gray-500 text-[10px]">2m ago</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-[#111111] border border-[#2a2a2a]">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-gray-200">Web Dev Challenge — results evaluated &amp; ready</span>
                    </div>
                    <span className="text-gray-500 text-[10px]">15m ago</span>
                  </div>
                </div>
              </div>

              {/* Live Contests Quick List */}
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white tracking-tight">Live Contests &amp; Access Tokens</h3>
                  <button
                    onClick={() => setTab('tokens')}
                    className="text-xs font-mono text-orange-400 hover:text-orange-300 font-semibold cursor-pointer"
                  >
                    Manage Tokens 🔑 →
                  </button>
                </div>

                <div className="space-y-3">
                  {contests.map(c => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-[#111111] border border-[#2a2a2a] hover:border-gray-700 transition-colors flex-wrap gap-3"
                    >
                      <div>
                        <div className="text-sm font-bold text-white">{c.name}</div>
                        <div className="text-xs font-mono text-gray-500 mt-0.5">
                          {c.questions?.length || 0} Questions · {c.marks} Marks · {c.students || 0} Submissions
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          onClick={() => copyToClipboard(c.token || c.password, 'Token')}
                          title="Click to copy token"
                          className="font-mono text-xs bg-[#1a1a1a] border border-[#2a2a2a] hover:border-orange-500/50 text-orange-400 px-2.5 py-1 rounded cursor-pointer"
                        >
                          🔑 {c.token || c.password} 📋
                        </span>
                        <Badge text={c.status} />
                        <button
                          onClick={() => openQuestions(c)}
                          className="bg-[#1a1a1a] border border-[#2a2a2a] hover:border-orange-500 text-gray-300 hover:text-white px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Questions 🗂️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── CONTESTS TAB ── */}
          {tab === 'contests' && (
            <div className="space-y-4">
              {contests.map(c => (
                <div
                  key={c.id}
                  className="bg-[#1a1a1a] border border-[#2a2a2a] hover:border-orange-500/30 rounded-xl p-6 transition-all"
                >
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-base font-bold text-white">{c.name}</h3>
                        <Badge text={c.status} />
                        <span className="text-[10px] font-mono uppercase bg-[#111111] border border-[#2a2a2a] text-gray-400 px-2 py-0.5 rounded">
                          {c.type}
                        </span>
                      </div>

                      <p className="text-xs text-gray-400 mb-4 leading-relaxed">{c.desc || 'No description provided.'}</p>

                      <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
                        <div className="flex items-center gap-1 bg-[#111111] border border-[#2a2a2a] px-2 py-1 rounded">
                          <span className="text-orange-400 font-bold">🔑 Token:</span>
                          <code className="text-white font-bold">{c.token || c.password}</code>
                          <button onClick={() => copyToClipboard(c.token || c.password, 'Token')} className="text-gray-400 hover:text-white ml-1 cursor-pointer">📋</button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button onClick={() => { setAnalyticsContestId(c.id); setTab('analytics'); }} className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer">
                        📊 Live Dashboard
                      </button>
                      <button onClick={() => { setSelectedContestAdminId(c.id); setAdminView('contest'); setTab('admins'); }} className="bg-[#111111] border border-[#2a2a2a] hover:border-gray-600 text-gray-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer">
                        🛡️ Admins
                      </button>
                      <button onClick={() => { setTokenContestId(c.id); setTab('tokens'); }} className="bg-[#111111] border border-[#2a2a2a] hover:border-gray-600 text-gray-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer">
                        🔑 Tokens
                      </button>
                      <button onClick={() => openQuestions(c)} className="bg-[#111111] border border-[#2a2a2a] hover:border-gray-600 text-gray-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer">
                        Questions ({c.questions?.length || 0})
                      </button>
                      <button onClick={() => toggleStatus(c.id)} className="bg-[#111111] border border-[#2a2a2a] text-gray-400 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer">
                        Status
                      </button>
                      <button onClick={() => deleteContest(c.id)} className="bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── CONTEST LIVE DASHBOARD & STUDENT ANALYTICS ── */}
          {tab === 'analytics' && (() => {
            const currentContest = selectedAnalyticsContest || contests[0];
            const contestSubs = submissions.filter(s => s.contestId === currentContest?.id || s.contest === currentContest?.name);

            const filteredSubs = contestSubs.filter(s => {
              const matchSearch = !analyticsSearch || 
                (s.name || '').toLowerCase().includes(analyticsSearch.toLowerCase()) || 
                (s.jntuNo || '').toLowerCase().includes(analyticsSearch.toLowerCase());
              const matchBranch = analyticsBranch === 'All' || (s.branch || '').toUpperCase() === analyticsBranch.toUpperCase();
              return matchSearch && matchBranch;
            });

            // Sort by score desc, then timeTaken asc
            const sortedRankedSubs = [...filteredSubs].sort((a, b) => {
              if (b.score !== a.score) return b.score - a.score;
              return (a.timeTaken || 0) - (b.timeTaken || 0);
            });

            const totalSubsCount = contestSubs.length;
            const totalContestMarks = currentContest?.marks || 100;
            const avgScoreVal = totalSubsCount > 0 ? (contestSubs.reduce((acc, s) => acc + s.score, 0) / totalSubsCount).toFixed(1) : '0';
            const avgPctVal = totalContestMarks > 0 ? Math.round((Number(avgScoreVal) / totalContestMarks) * 100) : 0;
            const highestScoreVal = totalSubsCount > 0 ? Math.max(...contestSubs.map(s => s.score)) : 0;
            const topStudentObj = contestSubs.find(s => s.score === highestScoreVal);
            const passingCount = contestSubs.filter(s => (s.percentage !== undefined ? s.percentage : (s.score / s.total) * 100) >= 50).length;
            const passRateVal = totalSubsCount > 0 ? Math.round((passingCount / totalSubsCount) * 100) : 0;
            const avgTimeSec = totalSubsCount > 0 ? Math.round(contestSubs.reduce((acc, s) => acc + (s.timeTaken || 0), 0) / totalSubsCount) : 0;
            const avgTimeFmt = `${Math.floor(avgTimeSec / 60)}m ${avgTimeSec % 60}s`;

            const branchesList = ['All', ...Array.from(new Set(contestSubs.map(s => s.branch).filter(Boolean)))];

            // Question success rate analytics
            const questionsAnalytics = (currentContest?.questions || []).map((q, qIdx) => {
              let solvedCount = 0;
              let totalScoreAwarded = 0;

              contestSubs.forEach(s => {
                if (q.type === 'mcq') {
                  if (s.answers && s.answers[q.id] === q.correct) {
                    solvedCount++;
                    totalScoreAwarded += q.marks;
                  }
                } else {
                  const qScore = s.codingScores?.[q.id]?.score;
                  if (qScore !== undefined && qScore > 0) {
                    solvedCount++;
                    totalScoreAwarded += qScore;
                  } else if (s.code && s.code[q.id] && s.code[q.id].trim().length > 15) {
                    solvedCount++;
                    totalScoreAwarded += q.marks;
                  }
                }
              });

              const rate = totalSubsCount > 0 ? Math.round((solvedCount / totalSubsCount) * 100) : 0;
              const avgQScore = totalSubsCount > 0 ? (totalScoreAwarded / totalSubsCount).toFixed(1) : '0';

              return {
                ...q,
                index: qIdx + 1,
                solvedCount,
                successRate: rate,
                avgQScore
              };
            });

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                {/* Top Contest Selector & Information Card */}
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '1.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <label style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Select Contest:
                      </label>
                      <select
                        value={analyticsContestId}
                        onChange={e => {
                          setAnalyticsContestId(Number(e.target.value));
                          setAnalyticsSearch('');
                          setAnalyticsBranch('All');
                        }}
                        style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: '0.65rem 1rem', color: '#f8fafc', fontSize: '0.95rem', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
                      >
                        {contests.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.status})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                      <button
                        onClick={() => handleExportContestCSV(currentContest, contestSubs)}
                        style={{ background: 'linear-gradient(135deg,#059669,#10b981)', border: 'none', borderRadius: '10px', color: '#fff', padding: '0.55rem 1.1rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        📥 Export CSV
                      </button>
                      <button
                        onClick={() => { setTokenContestId(currentContest?.id); setTab('tokens'); }}
                        style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '10px', color: '#a5b4fc', padding: '0.55rem 0.9rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
                      >
                        🔑 Manage Tokens
                      </button>
                    </div>
                  </div>

                  {/* Contest Quick Specs */}
                  {currentContest && (
                    <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.9rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.82rem', color: '#94a3b8' }}>
                      <span>Status: <Badge text={currentContest.status} /></span>
                      <span>Type: <strong style={{ color: '#cbd5e1' }}>{currentContest.type}</strong></span>
                      <span>Duration: <strong style={{ color: '#cbd5e1' }}>{currentContest.duration} Mins</strong></span>
                      <span>Total Marks: <strong style={{ color: '#86efac' }}>{currentContest.marks} Marks</strong></span>
                      <span>Questions: <strong style={{ color: '#818cf8' }}>{currentContest.questions?.length || 0}</strong></span>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span>Master Token:</span>
                        <code style={{ background: 'rgba(99,102,241,0.15)', color: '#c7d2fe', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 700 }}>
                          {currentContest.token || currentContest.password}
                        </code>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5 Executive KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1.25rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '1.4rem' }}>
                    <div style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>🎓</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#818cf8' }}>{totalSubsCount}</div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.2rem' }}>
                      Completed Tests
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '1.4rem' }}>
                    <div style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>📊</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8' }}>
                      {avgScoreVal} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>/ {totalContestMarks} ({avgPctVal}%)</span>
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.2rem' }}>
                      Average Score
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '1.4rem' }}>
                    <div style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>🏆</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fcd34d' }}>
                      {highestScoreVal} <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>({topStudentObj?.name ? topStudentObj.name.split(' ')[0] : 'N/A'})</span>
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.2rem' }}>
                      Highest Score (Rank 1)
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '1.4rem' }}>
                    <div style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>🎯</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: passRateVal >= 50 ? '#86efac' : '#f87171' }}>
                      {passRateVal}%
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.2rem' }}>
                      Pass Rate (Score ≥ 50%)
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '1.4rem' }}>
                    <div style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>⏱️</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#c084fc' }}>
                      {avgTimeFmt}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.2rem' }}>
                      Avg. Completion Time
                    </div>
                  </div>
                </div>

                {/* Question-by-Question Solved Matrix / Success Rate */}
                {questionsAnalytics.length > 0 && (
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '1.75rem' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.35rem', color: '#f1f5f9' }}>
                      🧩 Question-by-Question Success & Solved Rate
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
                      See how many students successfully solved each MCQ and Coding problem in this contest.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                      {questionsAnalytics.map(q => (
                        <div key={q.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '1.2rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', borderRadius: '6px', padding: '0.15rem 0.5rem', fontSize: '0.72rem', fontWeight: 700 }}>
                                Q{q.index}
                              </span>
                              <span style={{ background: q.type === 'mcq' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)', color: q.type === 'mcq' ? '#86efac' : '#fcd34d', borderRadius: '6px', padding: '0.15rem 0.5rem', fontSize: '0.7rem', fontWeight: 600 }}>
                                {q.type === 'mcq' ? 'MCQ' : 'Coding'}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>{q.marks} Marks</span>
                          </div>

                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {q.type === 'code' ? (q.title || 'Coding Problem') : (q.text || 'MCQ Question')}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', marginBottom: '0.4rem' }}>
                            <span style={{ color: '#94a3b8' }}>Solved by:</span>
                            <span style={{ fontWeight: 700, color: q.successRate >= 60 ? '#86efac' : q.successRate >= 40 ? '#fcd34d' : '#f87171' }}>
                              {q.solvedCount} / {totalSubsCount} Students ({q.successRate}%)
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${q.successRate}%`,
                                background: q.successRate >= 60 ? 'linear-gradient(90deg,#22c55e,#86efac)' : q.successRate >= 40 ? 'linear-gradient(90deg,#f59e0b,#fcd34d)' : 'linear-gradient(90deg,#ef4444,#f87171)',
                                borderRadius: '3px',
                                transition: 'width 0.3s ease'
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Student Leaderboard & Solved Breakdown Table */}
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', overflow: 'hidden' }}>
                  {/* Table Header & Controls */}
                  <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f1f5f9' }}>
                        🏆 Student Submissions & Solved Breakdown Leaderboard
                      </h3>
                      <p style={{ color: '#64748b', fontSize: '0.8rem' }}>
                        Ranked list of students who submitted this contest with exact questions solved count.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        value={analyticsSearch}
                        onChange={e => setAnalyticsSearch(e.target.value)}
                        placeholder="Search student or JNTU No..."
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '0.55rem 0.9rem', color: '#f8fafc', fontSize: '0.82rem', outline: 'none', width: '220px' }}
                      />

                      <select
                        value={analyticsBranch}
                        onChange={e => setAnalyticsBranch(e.target.value)}
                        style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '0.55rem 0.85rem', color: '#f8fafc', fontSize: '0.82rem', outline: 'none', cursor: 'pointer' }}
                      >
                        {branchesList.map(b => (
                          <option key={b} value={b}>
                            {b === 'All' ? 'All Branches' : b}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Leaderboard Table Content */}
                  {sortedRankedSubs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 1.5rem', color: '#64748b' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>No Submissions Match Filters</h3>
                      <p style={{ fontSize: '0.85rem', color: '#475569', maxWidth: '400px', margin: '0 auto' }}>
                        {totalSubsCount === 0 ? 'No students have completed this contest yet.' : 'Try adjusting your search query or branch filter.'}
                      </p>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            {['Rank', 'JNTU No.', 'Student Name', 'Branch', 'Questions Solved', 'Score & %', 'Time Taken', 'Refreshes 🔄', 'Submitted At', 'Action'].map(h => (
                              <th key={h} style={{ padding: '1rem 1.1rem', textAlign: 'left', color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sortedRankedSubs.map((s, i) => {
                            const rank = i + 1;
                            const rankBadge = rank === 1 ? '🥇 1' : rank === 2 ? '🥈 2' : rank === 3 ? '🥉 3' : `#${rank}`;
                            const solvedInfo = getSolvedCount(s, currentContest);
                            const timeTakenMin = s.timeTaken ? `${Math.floor(s.timeTaken / 60)}m ${s.timeTaken % 60}s` : '—';
                            const refreshCount = s.refreshes !== undefined ? s.refreshes : 0;
                            const pct = s.percentage !== undefined ? s.percentage : Math.round((s.score / s.total) * 100);

                            return (
                              <tr key={s.id || `${s.jntuNo}-${i}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                                <td style={{ padding: '1rem 1.1rem', fontWeight: 800, fontSize: '0.88rem', color: rank === 1 ? '#fcd34d' : rank === 2 ? '#e2e8f0' : rank === 3 ? '#fb923c' : '#64748b' }}>
                                  {rankBadge}
                                </td>
                                <td style={{ padding: '1rem 1.1rem', fontFamily: 'monospace', color: '#818cf8', fontSize: '0.875rem', fontWeight: 700 }}>
                                  {s.jntuNo}
                                </td>
                                <td style={{ padding: '1rem 1.1rem', fontWeight: 600, fontSize: '0.9rem', color: '#f8fafc' }}>
                                  {s.name}
                                </td>
                                <td style={{ padding: '1rem 1.1rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                                  {s.branch}
                                </td>
                                <td style={{ padding: '1rem 1.1rem' }}>
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: solvedInfo.solved === solvedInfo.total && solvedInfo.total > 0 ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.12)', border: `1px solid ${solvedInfo.solved === solvedInfo.total && solvedInfo.total > 0 ? 'rgba(34,197,94,0.3)' : 'rgba(99,102,241,0.25)'}`, borderRadius: '12px', padding: '0.25rem 0.65rem' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: solvedInfo.solved === solvedInfo.total && solvedInfo.total > 0 ? '#86efac' : '#a5b4fc' }}>
                                      {solvedInfo.solved} / {solvedInfo.total} Solved
                                    </span>
                                  </div>
                                </td>
                                <td style={{ padding: '1rem 1.1rem' }}>
                                  <span style={{ fontWeight: 800, color: '#f1f5f9', fontSize: '0.92rem' }}>{s.score} / {s.total}</span>
                                  <span style={{ marginLeft: '0.5rem', color: pct >= 75 ? '#86efac' : pct >= 50 ? '#fcd34d' : '#f87171', fontSize: '0.78rem', fontWeight: 700 }}>
                                    ({pct}%)
                                  </span>
                                </td>
                                <td style={{ padding: '1rem 1.1rem', color: '#38bdf8', fontSize: '0.82rem', fontFamily: 'monospace', fontWeight: 600 }}>
                                  {timeTakenMin}
                                </td>
                                <td style={{ padding: '1rem 1.1rem' }}>
                                  <span style={{ background: refreshCount > 0 ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.12)', color: refreshCount > 0 ? '#fcd34d' : '#86efac', border: `1px solid ${refreshCount > 0 ? 'rgba(245,158,11,0.3)' : 'rgba(34,197,94,0.25)'}`, borderRadius: '12px', padding: '0.2rem 0.6rem', fontSize: '0.72rem', fontWeight: 700 }}>
                                    {refreshCount} {refreshCount === 1 ? 'Refresh' : 'Refreshes'}
                                  </span>
                                </td>
                                <td style={{ padding: '1rem 1.1rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                                  {s.submittedAt || s.time || '—'}
                                </td>
                                <td style={{ padding: '1rem 1.1rem' }}>
                                  <button
                                    onClick={() => setSelectedSubmissionModal(s)}
                                    style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', color: '#a5b4fc', padding: '0.35rem 0.75rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
                                  >
                                    View Log 👁️
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

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

          {/* ── STUDENTS SUBMISSIONS WITH REFRESH COUNT & TIMESTAMPS ── */}
          {tab === 'students' && (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>Real-Time Student Submissions & Proctoring Logs</h3>
                  <p style={{ color: '#64748b', fontSize: '0.8rem' }}>Monitor submission timestamps, time taken, page refresh counts, and proctoring warnings.</p>
                </div>
                <div style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '10px', padding: '0.4rem 0.85rem', fontSize: '0.8rem', fontWeight: 700 }}>
                  Total: {submissions.length} Submissions
                </div>
              </div>

              {submissions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 1.5rem', color: '#64748b' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📋</div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>No Submissions Yet</h3>
                  <p style={{ fontSize: '0.85rem', color: '#475569', maxWidth: '400px', margin: '0 auto' }}>
                    Student submissions, scores, refresh counts, and proctoring logs will appear here automatically in real time as students complete exams.
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        {['JNTU No.', 'Name & Branch', 'Contest', 'Score', 'Submitted At', 'Time Taken', 'Refreshes 🔄', 'Warnings ⚠️', 'Action'].map(h => (
                          <th key={h} style={{ padding: '1rem 1.1rem', textAlign: 'left', color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((s, i) => {
                        const timeTakenMin = s.timeTaken ? `${Math.floor(s.timeTaken / 60)}m ${s.timeTaken % 60}s` : '—';
                        const refreshCount = s.refreshes !== undefined ? s.refreshes : 0;
                        const warningCount = s.warnings !== undefined ? s.warnings : 0;
                        const pct = s.percentage !== undefined ? s.percentage : Math.round((s.score / s.total) * 100);

                        return (
                          <tr key={s.id || `${s.jntuNo}-${i}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                            <td style={{ padding: '1rem 1.1rem', fontFamily: 'monospace', color: '#818cf8', fontSize: '0.875rem', fontWeight: 700 }}>{s.jntuNo}</td>
                            <td style={{ padding: '1rem 1.1rem' }}>
                              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#f8fafc' }}>{s.name}</div>
                              <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{s.branch}</div>
                            </td>
                            <td style={{ padding: '1rem 1.1rem', color: '#cbd5e1', fontSize: '0.82rem', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {s.contest}
                            </td>
                            <td style={{ padding: '1rem 1.1rem' }}>
                              <span style={{ fontWeight: 700, color: '#f1f5f9' }}>{s.score} / {s.total}</span>
                              <span style={{ marginLeft: '0.5rem', color: pct >= 75 ? '#86efac' : pct >= 50 ? '#fcd34d' : '#f87171', fontSize: '0.78rem', fontWeight: 700 }}>
                                ({pct}%)
                              </span>
                            </td>
                            <td style={{ padding: '1rem 1.1rem', color: '#cbd5e1', fontSize: '0.82rem' }}>
                              {s.submittedAt || s.time || '—'}
                            </td>
                            <td style={{ padding: '1rem 1.1rem', color: '#38bdf8', fontSize: '0.82rem', fontFamily: 'monospace', fontWeight: 600 }}>
                              {timeTakenMin}
                            </td>
                            <td style={{ padding: '1rem 1.1rem' }}>
                              <span style={{ background: refreshCount > 0 ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.12)', color: refreshCount > 0 ? '#fcd34d' : '#86efac', border: `1px solid ${refreshCount > 0 ? 'rgba(245,158,11,0.3)' : 'rgba(34,197,94,0.25)'}`, borderRadius: '12px', padding: '0.2rem 0.6rem', fontSize: '0.72rem', fontWeight: 700 }}>
                                {refreshCount} {refreshCount === 1 ? 'Refresh' : 'Refreshes'}
                              </span>
                            </td>
                            <td style={{ padding: '1rem 1.1rem' }}>
                              <span style={{ background: warningCount > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.12)', color: warningCount > 0 ? '#f87171' : '#86efac', border: `1px solid ${warningCount > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.25)'}`, borderRadius: '12px', padding: '0.2rem 0.6rem', fontSize: '0.72rem', fontWeight: 700 }}>
                                {warningCount} {warningCount === 1 ? 'Warning' : 'Warnings'}
                              </span>
                            </td>
                            <td style={{ padding: '1rem 1.1rem' }}>
                              <button onClick={() => setSelectedSubmissionModal(s)} style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', color: '#a5b4fc', padding: '0.35rem 0.75rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                                View Log 👁️
                              </button>
                            </td>
                          </tr>
                        );
                      })}
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

      {/* Submission Audit Details Modal */}
      {selectedSubmissionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '1rem' }} onClick={e => { if (e.target === e.currentTarget) setSelectedSubmissionModal(null); }}>
          <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '22px', padding: '2rem', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                  {selectedSubmissionModal.name} ({selectedSubmissionModal.jntuNo})
                </h2>
                <p style={{ color: '#818cf8', fontSize: '0.82rem', marginTop: '0.2rem' }}>
                  {selectedSubmissionModal.contest} · {selectedSubmissionModal.branch}
                </p>
              </div>
              <button onClick={() => setSelectedSubmissionModal(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer', padding: 0 }}>✕</button>
            </div>

            {/* Audit Log Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1rem' }}>
                <div style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>🕒 Submission Time</div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#f1f5f9', marginTop: '0.3rem' }}>
                  {selectedSubmissionModal.submittedAt || selectedSubmissionModal.time || '—'}
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1rem' }}>
                <div style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>⏱️ Time Taken</div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#38bdf8', marginTop: '0.3rem' }}>
                  {selectedSubmissionModal.timeTaken ? `${Math.floor(selectedSubmissionModal.timeTaken / 60)}m ${selectedSubmissionModal.timeTaken % 60}s` : '—'}
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1rem' }}>
                <div style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>🔄 Page Refreshes</div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: (selectedSubmissionModal.refreshes || 0) > 0 ? '#fcd34d' : '#86efac', marginTop: '0.3rem' }}>
                  {selectedSubmissionModal.refreshes || 0} {(selectedSubmissionModal.refreshes || 0) === 1 ? 'Refresh' : 'Refreshes'}
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1rem' }}>
                <div style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>⚠️ Tab Switches / Violations</div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: (selectedSubmissionModal.warnings || 0) > 0 ? '#f87171' : '#86efac', marginTop: '0.3rem' }}>
                  {selectedSubmissionModal.warnings || 0} {(selectedSubmissionModal.warnings || 0) === 1 ? 'Warning' : 'Warnings'}
                </div>
              </div>
            </div>

            {/* Score Summary */}
            <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '14px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Final Score:</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f1f5f9', marginLeft: '0.5rem' }}>
                  {selectedSubmissionModal.score} / {selectedSubmissionModal.total}
                </span>
              </div>
              <div style={{ fontWeight: 800, color: (selectedSubmissionModal.percentage || 0) >= 75 ? '#86efac' : '#fcd34d', fontSize: '1.1rem' }}>
                {selectedSubmissionModal.percentage || Math.round((selectedSubmissionModal.score / selectedSubmissionModal.total) * 100)}%
              </div>
            </div>

            {/* Submitted Code Preview */}
            {selectedSubmissionModal.code && Object.keys(selectedSubmissionModal.code).length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.6rem' }}>Submitted Code:</h4>
                {Object.entries(selectedSubmissionModal.code).map(([qId, sourceCode]) => (
                  <div key={qId} style={{ marginBottom: '0.75rem', background: '#020617', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.85rem' }}>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '0.4rem' }}>Question ID: #{qId}</div>
                    <pre style={{ margin: 0, fontSize: '0.8rem', color: '#e2e8f0', fontFamily: 'monospace', maxHeight: '180px', overflowY: 'auto' }}>
                      {sourceCode || '(No code submitted)'}
                    </pre>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => setSelectedSubmissionModal(null)} style={{ width: '100%', padding: '0.85rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#e2e8f0', cursor: 'pointer', fontWeight: 600 }}>
              Close Audit Log
            </button>
          </div>
        </div>
      )}

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
