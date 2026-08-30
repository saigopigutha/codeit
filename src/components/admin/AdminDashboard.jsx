import React, { useState } from 'react';
import Logo from '../ui/Logo';

function Badge({ text }) {
  const map = { Open: '#22c55e', Upcoming: '#eab308', Soon: '#eab308', Closed: '#ef4444' };
  const c = map[text] || '#f97316';
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full border" style={{ background: `${c}15`, color: c, borderColor: `${c}30` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
      {text === 'Upcoming' ? 'Soon' : text}
    </span>
  );
}

const randomHex = len => Math.random().toString(36).substring(2, 2 + len).toUpperCase();

export default function AdminDashboard({
  contests = [],
  setContests,
  submissions = [],
  setSubmissions,
  admins = [],
  setAdmins,
  showToast,
  onLogout
}) {
  // Navigation: overview | contests | analytics | tokens | people | questions
  const [tab, setTab] = useState('overview');

  // Modal States
  const [showCreateContest, setShowCreateContest] = useState(false);
  const [newContest, setNewContest] = useState({
    name: '',
    desc: '',
    duration: 60,
    type: 'Mixed',
    status: 'Open',
    token: `GMRIT-${randomHex(5)}`
  });

  const [showAddAdmin, setShowAddAdminModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Faculty Admin',
    department: 'CSE'
  });

  const [showAssignCoordinator, setShowAssignCoordinator] = useState(false);
  const [selectedFacultyEmail, setSelectedFacultyEmail] = useState('');
  const [selectedAssignContestId, setSelectedAssignContestId] = useState(() => contests[0]?.id || 1);

  const [showGenerateTokens, setShowGenerateTokens] = useState(false);
  const [tokenGenCount, setTokenGenCount] = useState(10);
  const [customGenCount, setCustomGenCount] = useState('');

  // Active Context Selectors
  const [selectedContestId, setSelectedContestId] = useState(() => contests[0]?.id || 1);
  const [masterTokenInput, setMasterTokenInput] = useState('');
  const [isEditingMaster, setIsEditingMaster] = useState(false);

  // Analytics Filter States
  const [analyticsSearch, setAnalyticsSearch] = useState('');
  const [analyticsBranch, setAnalyticsBranch] = useState('All');

  // Question Management Modals
  const [showAddMCQ, setShowAddMCQ] = useState(false);
  const [mcqDraft, setMcqDraft] = useState({
    text: '',
    options: ['', '', '', ''],
    correct: 0,
    marks: 2,
    isLive: true
  });

  const [showAddCoding, setShowAddCoding] = useState(false);
  const [codingDraft, setCodingDraft] = useState({
    title: '',
    text: '',
    marks: 10,
    isLive: true,
    testCases: [
      { id: 1, input: '', expected: '', isHidden: false, explanation: '' },
      { id: 2, input: '', expected: '', isHidden: true, explanation: '' }
    ]
  });

  // Right-Side Sliding Drawer State
  const [selectedStudentDrawer, setSelectedStudentDrawer] = useState(null);

  // Active Contest Reference
  const activeContest = contests.find(c => c.id === selectedContestId) || contests[0] || {};

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
    if (!contest || !contest.questions) return { solved: 0, total: 0 };
    let count = 0;
    (contest.questions || []).forEach(q => {
      if (q.type === 'mcq') {
        if (sub.answers && sub.answers[q.id] === q.correct) count++;
      } else if (q.type === 'code') {
        const codeScore = sub.codingScores?.[q.id]?.score;
        if (codeScore !== undefined && codeScore > 0) count++;
        else if (sub.code && sub.code[q.id] && sub.code[q.id].trim().length > 15) count++;
      }
    });
    return { solved: count, total: contest.questions.length };
  };

  // Export Contest Analytics to CSV
  const handleExportCSV = () => {
    if (!activeContest) return;
    const contestSubs = submissions.filter(s => s.contestId === activeContest.id || s.contest === activeContest.name);
    const sorted = [...contestSubs].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.timeTaken || 0) - (b.timeTaken || 0);
    });

    const headers = ['Rank', 'JNTU Number', 'Student Name', 'Branch', 'Score', 'Total Marks', 'Percentage', 'Questions Solved', 'Time Taken', 'Refreshes', 'Warnings', 'Submitted At'];
    const rows = sorted.map((s, idx) => {
      const solvedInfo = getSolvedCount(s, activeContest);
      const timeFmt = s.timeTaken ? `${Math.floor(s.timeTaken / 60)}m ${s.timeTaken % 60}s` : 'N/A';
      const pct = s.percentage !== undefined ? s.percentage : Math.round((s.score / s.total) * 100);
      return [
        idx + 1,
        `"${s.jntuNo || ''}"`,
        `"${(s.name || '').replace(/"/g, '""')}"`,
        `"${s.branch || ''}"`,
        s.score,
        s.total,
        `${pct}%`,
        `"${solvedInfo.solved}/${solvedInfo.total}"`,
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
    link.setAttribute('download', `CodeIT_${activeContest.name.replace(/[^a-zA-Z0-9]/g, '_')}_Analytics.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify(`Exported CSV report for ${activeContest.name}`);
  };

  // Create Contest
  const handleCreateContestSubmit = e => {
    e.preventDefault();
    if (!newContest.name.trim()) return;
    const token = newContest.token.trim() || `GMRIT-${randomHex(5)}`;
    const created = {
      id: Date.now(),
      name: newContest.name.trim(),
      desc: newContest.desc.trim(),
      duration: Number(newContest.duration) || 60,
      type: newContest.type,
      status: newContest.status,
      marks: 50,
      students: 0,
      token,
      password: token,
      accessTokens: [],
      admins: ['admin@gmrit.edu.in'],
      questions: []
    };
    setContests(prev => [...prev, created]);
    setSelectedContestId(created.id);
    setShowCreateContest(false);
    setNewContest({ name: '', desc: '', duration: 60, type: 'Mixed', status: 'Open', token: `GMRIT-${randomHex(5)}` });
    notify(`Contest "${created.name}" created!`);
  };

  // Delete Contest
  const handleDeleteContest = id => {
    if (window.confirm('Are you sure you want to delete this contest permanently?')) {
      setContests(prev => prev.filter(c => c.id !== id));
      notify('Contest deleted', 'info');
    }
  };

  // Toggle Contest Status
  const handleToggleStatus = id => {
    setContests(prev =>
      prev.map(c => {
        if (c.id !== id) return c;
        const next = c.status === 'Open' ? 'Closed' : c.status === 'Closed' ? 'Upcoming' : 'Open';
        return { ...c, status: next };
      })
    );
  };

  // Generate Single-Use Tokens
  const handleGenerateBatchTokens = () => {
    const count = customGenCount ? Number(customGenCount) : tokenGenCount;
    if (!count || count <= 0) return;
    const prefix = activeContest.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase() || 'CSE';
    const newTokens = Array.from({ length: count }, (_, i) => ({
      id: `tok-${Date.now()}-${i}-${randomHex(3)}`,
      code: `${prefix}-${String(i + 1).padStart(3, '0')}-${randomHex(4)}`,
      isUsed: false,
      usedBy: null,
      claimedAt: null
    }));

    setContests(prev =>
      prev.map(c => {
        if (c.id !== activeContest.id) return c;
        return { ...c, accessTokens: [...(c.accessTokens || []), ...newTokens] };
      })
    );
    setShowGenerateTokens(false);
    setCustomGenCount('');
    notify(`Generated ${count} single-use tokens for ${activeContest.name}!`);
  };

  const handleRevokeToken = tokenId => {
    setContests(prev =>
      prev.map(c => {
        if (c.id !== activeContest.id) return c;
        return { ...c, accessTokens: (c.accessTokens || []).filter(t => t.id !== tokenId) };
      })
    );
    notify('Token revoked', 'info');
  };

  const handleClearAllTokens = () => {
    if (window.confirm(`Delete all single-use tokens for ${activeContest.name}?`)) {
      setContests(prev =>
        prev.map(c => {
          if (c.id !== activeContest.id) return c;
          return { ...c, accessTokens: [] };
        })
      );
      notify('All single-use tokens cleared!', 'info');
    }
  };

  const handleSaveMasterToken = () => {
    const clean = masterTokenInput.trim().toUpperCase();
    if (!clean) return;
    setContests(prev =>
      prev.map(c => {
        if (c.id !== activeContest.id) return c;
        return { ...c, token: clean, password: clean };
      })
    );
    setIsEditingMaster(false);
    notify(`Master token updated to: ${clean}`);
  };

  // Questions Manager Actions
  const handleToggleQuestionLive = qId => {
    setContests(prev =>
      prev.map(c => {
        if (c.id !== activeContest.id) return c;
        return {
          ...c,
          questions: (c.questions || []).map(q => (q.id === qId ? { ...q, isLive: q.isLive === false ? true : false } : q))
        };
      })
    );
  };

  const handleDeleteQuestion = qId => {
    if (window.confirm('Delete this question?')) {
      setContests(prev =>
        prev.map(c => {
          if (c.id !== activeContest.id) return c;
          const updated = (c.questions || []).filter(q => q.id !== qId);
          const totalMarks = updated.reduce((sum, item) => sum + (Number(item.marks) || 0), 0);
          return { ...c, questions: updated, marks: totalMarks };
        })
      );
      notify('Question deleted', 'info');
    }
  };

  const handleSaveMCQ = e => {
    e.preventDefault();
    if (!mcqDraft.text.trim()) return;
    const newQ = {
      id: Date.now(),
      type: 'mcq',
      text: mcqDraft.text.trim(),
      options: mcqDraft.options,
      correct: Number(mcqDraft.correct),
      marks: Number(mcqDraft.marks) || 2,
      isLive: mcqDraft.isLive
    };
    setContests(prev =>
      prev.map(c => {
        if (c.id !== activeContest.id) return c;
        const updated = [...(c.questions || []), newQ];
        const totalMarks = updated.reduce((sum, item) => sum + (Number(item.marks) || 0), 0);
        return { ...c, questions: updated, marks: totalMarks };
      })
    );
    setShowAddMCQ(false);
    setMcqDraft({ text: '', options: ['', '', '', ''], correct: 0, marks: 2, isLive: true });
    notify('MCQ Question added!');
  };

  const handleSaveCoding = e => {
    e.preventDefault();
    if (!codingDraft.title.trim() || !codingDraft.text.trim()) return;
    const newQ = {
      id: Date.now(),
      type: 'code',
      title: codingDraft.title.trim(),
      text: codingDraft.text.trim(),
      marks: Number(codingDraft.marks) || 10,
      isLive: codingDraft.isLive,
      testCases: codingDraft.testCases
    };
    setContests(prev =>
      prev.map(c => {
        if (c.id !== activeContest.id) return c;
        const updated = [...(c.questions || []), newQ];
        const totalMarks = updated.reduce((sum, item) => sum + (Number(item.marks) || 0), 0);
        return { ...c, questions: updated, marks: totalMarks };
      })
    );
    setShowAddCoding(false);
    setCodingDraft({
      title: '',
      text: '',
      marks: 10,
      isLive: true,
      testCases: [
        { id: 1, input: '', expected: '', isHidden: false, explanation: '' },
        { id: 2, input: '', expected: '', isHidden: true, explanation: '' }
      ]
    });
    notify('Coding Problem added with test cases!');
  };

  // People: Add Admin & Coordinator
  const handleAddAdminSubmit = e => {
    e.preventDefault();
    if (!newAdmin.name.trim() || !newAdmin.email.trim()) return;
    const email = newAdmin.email.trim().toLowerCase();
    if (admins.some(a => a.email.toLowerCase() === email)) {
      notify('Administrator with this email already exists', 'error');
      return;
    }
    const created = {
      id: Date.now(),
      name: newAdmin.name.trim(),
      email,
      password: newAdmin.password || 'admin123',
      role: newAdmin.role,
      department: newAdmin.department
    };
    setAdmins(prev => [...prev, created]);
    setShowAddAdminModal(false);
    setNewAdmin({ name: '', email: '', password: '', role: 'Faculty Admin', department: 'CSE' });
    notify(`Added ${created.name} (${created.role})!`);
  };

  const handleAssignCoordinatorSubmit = e => {
    e.preventDefault();
    if (!selectedFacultyEmail) return;
    setContests(prev =>
      prev.map(c => {
        if (c.id !== selectedAssignContestId) return c;
        const existing = c.admins || [];
        if (existing.includes(selectedFacultyEmail)) return c;
        return { ...c, admins: [...existing, selectedFacultyEmail] };
      })
    );
    setShowAssignCoordinator(false);
    notify(`Assigned coordinator to contest!`);
  };

  const handleRemoveCoordinator = (contestId, email) => {
    setContests(prev =>
      prev.map(c => {
        if (c.id !== contestId) return c;
        return { ...c, admins: (c.admins || []).filter(e => e !== email) };
      })
    );
    notify('Removed coordinator from contest', 'info');
  };

  // Calculations for Overview & Analytics
  const totalStudentsCount = new Set(submissions.map(s => s.jntuNo)).size;
  const activeContestsCount = contests.filter(c => c.status === 'Open').length;
  const totalSubsCount = submissions.length;

  const currentContestSubs = submissions.filter(s => s.contestId === activeContest?.id || s.contest === activeContest?.name);
  const filteredAnalyticsSubs = currentContestSubs.filter(s => {
    const matchSearch = !analyticsSearch || (s.name || '').toLowerCase().includes(analyticsSearch.toLowerCase()) || (s.jntuNo || '').toLowerCase().includes(analyticsSearch.toLowerCase());
    const matchBranch = analyticsBranch === 'All' || (s.branch || '').toUpperCase() === analyticsBranch.toUpperCase();
    return matchSearch && matchBranch;
  });

  const sortedRankedSubs = [...filteredAnalyticsSubs].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (a.timeTaken || 0) - (b.timeTaken || 0);
  });

  const contestTotalMarks = activeContest?.marks || 50;
  const avgScore = currentContestSubs.length > 0 ? (currentContestSubs.reduce((acc, s) => acc + s.score, 0) / currentContestSubs.length).toFixed(1) : '0';
  const topScore = currentContestSubs.length > 0 ? Math.max(...currentContestSubs.map(s => s.score)) : 0;
  const topStudent = currentContestSubs.find(s => s.score === topScore);
  const passCount = currentContestSubs.filter(s => (s.percentage !== undefined ? s.percentage : (s.score / s.total) * 100) >= 50).length;
  const passRate = currentContestSubs.length > 0 ? Math.round((passCount / currentContestSubs.length) * 100) : 0;
  const avgTimeSec = currentContestSubs.length > 0 ? Math.round(currentContestSubs.reduce((acc, s) => acc + (s.timeTaken || 0), 0) / currentContestSubs.length) : 0;
  const avgTimeStr = `${Math.floor(avgTimeSec / 60)}m ${avgTimeSec % 60}s`;

  // Question Analytics
  const questionsAnalytics = (activeContest?.questions || []).map((q, idx) => {
    let solvedCount = 0;
    currentContestSubs.forEach(s => {
      if (q.type === 'mcq') {
        if (s.answers && s.answers[q.id] === q.correct) solvedCount++;
      } else {
        const qScore = s.codingScores?.[q.id]?.score;
        if (qScore !== undefined && qScore > 0) solvedCount++;
        else if (s.code && s.code[q.id] && s.code[q.id].trim().length > 15) solvedCount++;
      }
    });
    const rate = currentContestSubs.length > 0 ? Math.round((solvedCount / currentContestSubs.length) * 100) : 0;
    return {
      ...q,
      idx: idx + 1,
      solvedCount,
      rate
    };
  });

  const navItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'contests', label: 'Contests', icon: '🏆' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'tokens', label: 'Tokens', icon: '🔑' },
    { id: 'people', label: 'People', icon: '👥' },
    { id: 'questions', label: 'Questions', icon: '❓' }
  ];

  return (
    <div className="flex min-h-screen bg-[#0d0d0d] text-[#f1f1f1] font-sans selection:bg-orange-500/30 selection:text-orange-200">
      {/* ── Fixed Left Sidebar (240px) ── */}
      <aside className="w-60 flex-shrink-0 bg-[#111111] border-r border-[#2a2a2a] p-4 flex flex-col justify-between h-screen sticky top-0">
        <div>
          {/* Logo Header */}
          <div className="mb-6 pl-1 pb-4 border-b border-[#2a2a2a]">
            <Logo size="sm" subtitle="Admin Console" />
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map(item => {
              const isActive = tab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'text-orange-500 bg-orange-500/10'
                      : 'text-gray-400 hover:text-gray-100 hover:bg-[#1f1f1f]'
                  }`}
                >
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Admin Info at Sidebar Bottom */}
        <div className="pt-4 border-t border-[#2a2a2a]">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                JD
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-white truncate">John Doe</div>
                <span className="text-[10px] font-mono uppercase bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded">
                  Super Admin
                </span>
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

      {/* ── Main Content Canvas ── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        {/* Top Sticky Bar */}
        <header className="sticky top-0 z-20 bg-[#0d0d0d]/90 backdrop-blur-md border-b border-[#2a2a2a] px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              {tab === 'overview' && 'Dashboard Overview'}
              {tab === 'contests' && 'Contests'}
              {tab === 'analytics' && `Analytics: ${activeContest?.name || 'Contest'}`}
              {tab === 'tokens' && 'Access Tokens'}
              {tab === 'people' && 'People & Faculty Management'}
              {tab === 'questions' && `Questions — ${activeContest?.name || 'Select Contest'}`}
            </h1>
            <p className="text-xs text-gray-500 font-mono">GMRIT Proctored Coding &amp; MCQ Platform</p>
          </div>

          <div className="flex items-center gap-3">
            {tab === 'contests' && (
              <button
                onClick={() => setShowCreateContest(true)}
                className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white px-5 py-2 rounded-lg font-semibold text-xs transition-all cursor-pointer shadow-sm shadow-orange-500/20"
              >
                + New Contest
              </button>
            )}

            {tab === 'analytics' && activeContest && (
              <button
                onClick={handleExportCSV}
                className="border border-[#2a2a2a] hover:border-orange-500 text-gray-300 hover:text-orange-400 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>📥</span>
                <span>Export CSV</span>
              </button>
            )}

            {tab === 'tokens' && (
              <button
                onClick={() => setShowGenerateTokens(true)}
                className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white px-4 py-2 rounded-lg font-semibold text-xs transition-all cursor-pointer shadow-sm shadow-orange-500/20"
              >
                + Generate Tokens
              </button>
            )}

            {tab === 'people' && (
              <button
                onClick={() => setShowAddAdminModal(true)}
                className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white px-4 py-2 rounded-lg font-semibold text-xs transition-all cursor-pointer shadow-sm shadow-orange-500/20"
              >
                + Add Admin
              </button>
            )}

            {tab === 'questions' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddMCQ(true)}
                  className="border border-[#2a2a2a] hover:border-orange-500 text-gray-300 hover:text-orange-400 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                >
                  + Add MCQ
                </button>
                <button
                  onClick={() => setShowAddCoding(true)}
                  className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white px-4 py-2 rounded-lg font-semibold text-xs transition-all cursor-pointer shadow-sm shadow-orange-500/20"
                >
                  + Add Coding
                </button>
              </div>
            )}
          </div>
        </header>

        {/* ── Main Tab Content ── */}
        <main className="p-8 flex-1 max-w-6xl w-full space-y-6">
          {/* ════════════════ TAB 1: OVERVIEW ════════════════ */}
          {tab === 'overview' && (
            <div className="space-y-6">
              {/* 4 KPI Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { val: totalStudentsCount || 128, lbl: 'Students' },
                  { val: activeContestsCount || 3, lbl: 'Active Contests' },
                  { val: admins.length || 6, lbl: 'Admins' },
                  { val: totalSubsCount || 891, lbl: 'Submissions' }
                ].map(card => (
                  <div key={card.lbl} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 hover:border-orange-500/40 transition-all">
                    <div className="text-3xl font-bold text-white font-mono">{card.val}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">{card.lbl}</div>
                  </div>
                ))}
              </div>

              {/* Live Contests Table */}
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white tracking-tight">Live Contests</h3>
                  <span className="text-xs font-mono text-gray-500">{contests.length} Contests active</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="text-gray-500 text-xs uppercase tracking-widest border-b border-[#2a2a2a] text-left">
                        <th className="pb-3 font-semibold">Contest Name</th>
                        <th className="pb-3 font-semibold">Type</th>
                        <th className="pb-3 font-semibold">Questions</th>
                        <th className="pb-3 font-semibold">Max Marks</th>
                        <th className="pb-3 font-semibold">Students</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contests.map(c => {
                        const subsCount = submissions.filter(s => s.contestId === c.id || s.contest === c.name).length;
                        return (
                          <tr key={c.id} className="border-b border-[#1f1f1f] hover:bg-[#1f1f1f] transition-colors">
                            <td className="py-3.5 font-bold text-white">{c.name}</td>
                            <td className="py-3.5 text-gray-400 font-mono text-xs">{c.type}</td>
                            <td className="py-3.5 text-gray-300 font-mono text-xs">{c.questions?.length || 0}</td>
                            <td className="py-3.5 text-orange-400 font-mono font-bold text-xs">{c.marks}</td>
                            <td className="py-3.5 text-gray-300 font-mono text-xs">{subsCount || c.students || 0}</td>
                            <td className="py-3.5">
                              <Badge text={c.status} />
                            </td>
                            <td className="py-3.5 text-right">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedContestId(c.id);
                                    setTab('contests');
                                  }}
                                  className="text-xs text-gray-400 hover:text-white px-2.5 py-1 rounded border border-[#2a2a2a] hover:border-gray-600 transition-colors cursor-pointer"
                                >
                                  Manage
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedContestId(c.id);
                                    setTab('analytics');
                                  }}
                                  className="text-xs text-orange-400 hover:text-orange-300 px-2.5 py-1 rounded bg-orange-500/10 border border-orange-500/20 transition-colors cursor-pointer"
                                >
                                  Analytics
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ TAB 2: CONTESTS ════════════════ */}
          {tab === 'contests' && (
            <div className="space-y-4">
              {contests.map(c => {
                const isOpen = c.status === 'Open';
                const subsCount = submissions.filter(s => s.contestId === c.id || s.contest === c.name).length;

                return (
                  <div
                    key={c.id}
                    className={`bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 transition-all ${
                      isOpen ? 'border-l-2 border-l-orange-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between flex-wrap gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-1.5">
                          <Badge text={c.status} />
                          <h3 className="text-base font-bold text-white">{c.name}</h3>
                        </div>
                        <p className="text-xs font-mono text-gray-400">
                          {c.type} • {c.questions?.length || 0} Questions • {c.marks} Marks • {c.duration} min
                        </p>
                      </div>

                      <div className="text-xs font-mono text-gray-400">
                        <span className="text-green-400 font-bold">{subsCount || c.students || 0}</span> students active
                      </div>
                    </div>

                    <div className="bg-[#111] border border-[#2a2a2a] rounded-lg p-2.5 mb-4 text-xs font-mono flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 uppercase">Token:</span>
                        <code className="text-orange-400 font-bold">{c.token || c.password}</code>
                      </div>
                      <button
                        onClick={() => copyToClipboard(c.token || c.password, 'Token')}
                        className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                      >
                        📋 Copy
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#2a2a2a] flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => {
                            setSelectedContestId(c.id);
                            setTab('analytics');
                          }}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          📊 Analytics
                        </button>
                        <button
                          onClick={() => {
                            setSelectedContestId(c.id);
                            setTab('tokens');
                          }}
                          className="border border-[#2a2a2a] hover:border-gray-600 text-gray-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          🔑 Tokens
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAssignContestId(c.id);
                            setTab('people');
                          }}
                          className="border border-[#2a2a2a] hover:border-gray-600 text-gray-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          👥 Admins
                        </button>
                        <button
                          onClick={() => {
                            setSelectedContestId(c.id);
                            setTab('questions');
                          }}
                          className="border border-[#2a2a2a] hover:border-gray-600 text-gray-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          ❓ Questions
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(c.id)}
                          className="border border-[#2a2a2a] hover:border-gray-600 text-gray-400 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer"
                        >
                          Toggle Status
                        </button>
                        <button
                          onClick={() => handleDeleteContest(c.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ════════════════ TAB 3: ANALYTICS ════════════════ */}
          {tab === 'analytics' && (
            <div className="space-y-6">
              {/* Top Contest Selector Dropdown */}
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <label className="text-xs uppercase font-mono tracking-widest text-gray-400 font-bold">
                    Select Contest:
                  </label>
                  <select
                    value={selectedContestId}
                    onChange={e => setSelectedContestId(Number(e.target.value))}
                    className="bg-[#111] border border-[#2a2a2a] focus:border-orange-500 text-white rounded-lg px-3.5 py-2 text-xs font-bold font-mono outline-none cursor-pointer"
                  >
                    {contests.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.status})
                      </option>
                    ))}
                  </select>
                </div>

                <span className="text-xs font-mono text-gray-400">
                  {currentContestSubs.length} Submissions Logged
                </span>
              </div>

              {/* 5 KPI Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">🎓 Completed</div>
                  <div className="text-xl font-bold font-mono text-white">{currentContestSubs.length}</div>
                </div>
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">📊 Avg Score</div>
                  <div className="text-xl font-bold font-mono text-orange-400">
                    {avgScore} <span className="text-xs text-gray-500">/ {contestTotalMarks}</span>
                  </div>
                </div>
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">🏆 Top Score</div>
                  <div className="text-xl font-bold font-mono text-green-400 truncate">
                    {topScore} <span className="text-xs text-gray-400 font-sans">({topStudent?.name ? topStudent.name.split(' ')[0] : '—'})</span>
                  </div>
                </div>
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">🎯 Pass Rate</div>
                  <div className={`text-xl font-bold font-mono ${passRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                    {passRate}%
                  </div>
                </div>
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">⏱️ Avg Time</div>
                  <div className="text-xl font-bold font-mono text-white">{avgTimeStr}</div>
                </div>
              </div>

              {/* Question Success Rate Table */}
              {questionsAnalytics.length > 0 && (
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
                  <h3 className="text-sm font-bold text-white mb-3">Question Success Rate</h3>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="text-gray-500 uppercase tracking-widest border-b border-[#2a2a2a] text-left">
                        <th className="pb-2.5 font-semibold w-10">#</th>
                        <th className="pb-2.5 font-semibold">Question Title</th>
                        <th className="pb-2.5 font-semibold w-24">Type</th>
                        <th className="pb-2.5 font-semibold w-20">Marks</th>
                        <th className="pb-2.5 font-semibold w-72">Success Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {questionsAnalytics.map(q => {
                        const barColor = q.rate >= 60 ? 'bg-green-500' : q.rate >= 40 ? 'bg-yellow-500' : 'bg-red-500';
                        return (
                          <tr key={q.id} className="border-b border-[#1f1f1f] hover:bg-[#1f1f1f] transition-colors">
                            <td className="py-2.5 font-mono text-gray-400">{q.idx}</td>
                            <td className="py-2.5 font-semibold text-white truncate max-w-xs">{q.title || q.text}</td>
                            <td className="py-2.5 font-mono uppercase text-gray-400">{q.type}</td>
                            <td className="py-2.5 font-mono text-orange-400 font-bold">{q.marks}</td>
                            <td className="py-2.5">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 h-1.5 rounded-full bg-[#2a2a2a] overflow-hidden">
                                  <div className={`h-full ${barColor}`} style={{ width: `${q.rate}%` }} />
                                </div>
                                <span className="font-mono text-gray-300 w-28 text-right">
                                  {q.rate}% ({q.solvedCount}/{currentContestSubs.length})
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Student Leaderboard Table */}
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
                <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                  <h3 className="text-sm font-bold text-white">Student Leaderboard</h3>

                  {/* Filters */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <input
                      type="text"
                      value={analyticsSearch}
                      onChange={e => setAnalyticsSearch(e.target.value)}
                      placeholder="Search JNTU No. or Name..."
                      className="bg-[#111] border border-[#2a2a2a] focus:border-orange-500 text-white rounded-lg px-3 py-1.5 text-xs font-mono outline-none w-56"
                    />

                    <select
                      value={analyticsBranch}
                      onChange={e => setAnalyticsBranch(e.target.value)}
                      className="bg-[#111] border border-[#2a2a2a] focus:border-orange-500 text-white rounded-lg px-3 py-1.5 text-xs outline-none cursor-pointer"
                    >
                      {['All', 'CSE', 'IT', 'ECE', 'AI&DS', 'ME', 'EEE'].map(b => (
                        <option key={b} value={b}>{b === 'All' ? 'All Branches' : b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="text-gray-500 uppercase tracking-widest border-b border-[#2a2a2a] text-left">
                        <th className="pb-3 font-semibold">Rank</th>
                        <th className="pb-3 font-semibold">JNTU No.</th>
                        <th className="pb-3 font-semibold">Name</th>
                        <th className="pb-3 font-semibold">Branch</th>
                        <th className="pb-3 font-semibold">Score</th>
                        <th className="pb-3 font-semibold">Solved</th>
                        <th className="pb-3 font-semibold">Time</th>
                        <th className="pb-3 font-semibold">Flags</th>
                        <th className="pb-3 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRankedSubs.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-center py-8 text-gray-500 font-mono">
                            No submissions found.
                          </td>
                        </tr>
                      ) : (
                        sortedRankedSubs.map((s, idx) => {
                          const rank = idx + 1;
                          const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
                          const solvedInfo = getSolvedCount(s, activeContest);
                          const flagsCount = (s.warnings || 0) + (s.refreshes || 0);
                          const isAuto = (s.warnings || 0) >= 3 || s.auto;
                          const timeStr = s.timeTaken ? `${Math.floor(s.timeTaken / 60)}m ${s.timeTaken % 60}s` : '—';

                          return (
                            <tr key={s.id || idx} className="border-b border-[#1f1f1f] hover:bg-[#1f1f1f] transition-colors">
                              <td className="py-3 font-bold font-mono text-sm">{rankIcon}</td>
                              <td className="py-3 font-mono text-orange-400 font-semibold">{s.jntuNo}</td>
                              <td className="py-3 font-bold text-white">{s.name}</td>
                              <td className="py-3 text-gray-400">{s.branch}</td>
                              <td className="py-3 font-mono font-bold text-white">{s.score}/{s.total}</td>
                              <td className="py-3 font-mono">
                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                  solvedInfo.solved === solvedInfo.total && solvedInfo.total > 0
                                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                    : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                }`}>
                                  {solvedInfo.solved}/{solvedInfo.total}
                                </span>
                              </td>
                              <td className="py-3 font-mono text-gray-300">{timeStr}</td>
                              <td className="py-3 font-mono">
                                {isAuto ? (
                                  <span className="text-red-400 bg-red-500/10 border border-red-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                    3 🚨 AUTO
                                  </span>
                                ) : flagsCount > 0 ? (
                                  <span className="text-yellow-400">{flagsCount} ⚠️</span>
                                ) : (
                                  <span className="text-green-400">0 ✅</span>
                                )}
                              </td>
                              <td className="py-3 text-right">
                                <button
                                  onClick={() => setSelectedStudentDrawer(s)}
                                  className="text-orange-400 hover:text-orange-300 font-semibold text-xs cursor-pointer"
                                >
                                  View Log 👁️
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ TAB 4: TOKENS ════════════════ */}
          {tab === 'tokens' && (
            <div className="space-y-6">
              {/* Top Contest Selector */}
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <label className="text-xs uppercase font-mono tracking-widest text-gray-400 font-bold">
                    Select Contest:
                  </label>
                  <select
                    value={selectedContestId}
                    onChange={e => {
                      setSelectedContestId(Number(e.target.value));
                      setIsEditingMaster(false);
                    }}
                    className="bg-[#111] border border-[#2a2a2a] focus:border-orange-500 text-white rounded-lg px-3.5 py-2 text-xs font-bold font-mono outline-none cursor-pointer"
                  >
                    {contests.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.status})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => {
                    const unused = (activeContest.accessTokens || []).filter(t => !t.isUsed);
                    if (unused.length === 0) return notify('No unused tokens to copy', 'info');
                    const text = unused.map((t, idx) => `${idx + 1}. ${t.code}`).join('\n');
                    copyToClipboard(text, `${unused.length} Unused Tokens`);
                  }}
                  className="border border-[#2a2a2a] hover:border-orange-500 text-gray-300 hover:text-orange-400 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer"
                >
                  📋 Copy All Unused
                </button>
              </div>

              {/* Master Token Card */}
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
                <h3 className="text-sm font-bold text-white mb-1">Contest Password (Master Token)</h3>
                <p className="text-xs text-gray-500 mb-4">Show on projector for all exam hall students</p>

                <div className="flex items-center gap-3 max-w-md">
                  {isEditingMaster ? (
                    <input
                      type="text"
                      value={masterTokenInput}
                      onChange={e => setMasterTokenInput(e.target.value.toUpperCase())}
                      className="flex-1 bg-[#111] border border-[#2a2a2a] focus:border-orange-500 text-white font-mono text-sm px-4 py-2 rounded-lg outline-none uppercase"
                    />
                  ) : (
                    <div className="flex-1 bg-[#111] border border-[#2a2a2a] px-4 py-2 rounded-lg font-mono text-sm font-bold text-orange-400">
                      {activeContest.token || activeContest.password}
                    </div>
                  )}

                  {isEditingMaster ? (
                    <button
                      onClick={handleSaveMasterToken}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Save
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setMasterTokenInput(activeContest.token || activeContest.password || '');
                        setIsEditingMaster(true);
                      }}
                      className="border border-[#2a2a2a] hover:border-gray-600 text-gray-300 px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Edit
                    </button>
                  )}

                  <button
                    onClick={() => copyToClipboard(activeContest.token || activeContest.password, 'Master Token')}
                    className="border border-[#2a2a2a] hover:border-orange-500 text-gray-300 hover:text-orange-400 px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>

              {/* Single-Use Tokens Table */}
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white">Single-Use Tokens ({activeContest.accessTokens?.length || 0})</h3>
                  {(activeContest.accessTokens || []).length > 0 && (
                    <button
                      onClick={handleClearAllTokens}
                      className="text-red-400 hover:text-red-300 border border-red-500/30 hover:bg-red-500/10 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      🗑️ Clear All Tokens
                    </button>
                  )}
                </div>

                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="text-gray-500 uppercase tracking-widest border-b border-[#2a2a2a] text-left">
                      <th className="pb-3 font-semibold">Token Code</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Claimed By</th>
                      <th className="pb-3 font-semibold">Claimed At</th>
                      <th className="pb-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeContest.accessTokens || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500 font-mono">
                          No single-use tokens generated for this contest yet. Click "+ Generate Tokens" above.
                        </td>
                      </tr>
                    ) : (
                      (activeContest.accessTokens || []).map(t => (
                        <tr key={t.id} className="border-b border-[#1f1f1f] hover:bg-[#1f1f1f] transition-colors">
                          <td className="py-3 font-mono font-bold text-orange-400">{t.code}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              t.isUsed
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'bg-green-500/10 text-green-400 border border-green-500/20'
                            }`}>
                              {t.isUsed ? '🔒 Used' : '🟢 Unused'}
                            </span>
                          </td>
                          <td className="py-3 font-mono text-gray-300">{t.usedBy || '—'}</td>
                          <td className="py-3 font-mono text-gray-500">{t.claimedAt || '—'}</td>
                          <td className="py-3 text-right">
                            {!t.isUsed && (
                              <button
                                onClick={() => handleRevokeToken(t.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1 rounded text-xs transition-colors cursor-pointer"
                              >
                                🗑️ Revoke
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════════════════ TAB 5: PEOPLE ════════════════ */}
          {tab === 'people' && (
            <div className="space-y-8">
              {/* Section A: Platform Admins */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">Section A — Platform Admins</h3>
                    <p className="text-xs text-gray-500">System controllers with global privileges</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {admins.map(admin => {
                    const initials = admin.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                      .substring(0, 2);
                    const isSuper = admin.role === 'Super Admin';

                    return (
                      <div key={admin.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white">{admin.name}</div>
                            <div className="text-xs font-mono text-gray-400 mt-0.5">{admin.email}</div>
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-[10px] font-mono text-gray-400">{admin.department || 'CSE'}</span>
                              <span
                                className={`text-[10px] font-mono font-bold rounded-full px-2 py-0.5 ${
                                  isSuper ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-gray-800 text-gray-300'
                                }`}
                              >
                                {admin.role}
                              </span>
                            </div>
                          </div>
                        </div>

                        {admins.length > 1 && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Remove administrator ${admin.email}?`)) {
                                setAdmins(prev => prev.filter(a => a.id !== admin.id));
                                notify('Admin removed', 'info');
                              }
                            }}
                            className="text-gray-500 hover:text-red-400 text-xs p-1 cursor-pointer"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section B: Contest Coordinators */}
              <div className="pt-6 border-t border-[#2a2a2a]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">Section B — Contest Coordinators</h3>
                    <p className="text-xs text-gray-500">Faculty assigned to specific examinations</p>
                  </div>
                  <button
                    onClick={() => setShowAssignCoordinator(true)}
                    className="border border-[#2a2a2a] hover:border-orange-500 text-gray-300 hover:text-orange-400 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  >
                    + Assign Coordinator
                  </button>
                </div>

                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="text-gray-500 uppercase tracking-widest border-b border-[#2a2a2a] text-left">
                        <th className="pb-3 font-semibold">Faculty / Admin Email</th>
                        <th className="pb-3 font-semibold">Assigned Contest</th>
                        <th className="pb-3 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contests.flatMap(c => (c.admins || []).map(email => ({ contestId: c.id, contestName: c.name, email }))).length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-6 text-center text-gray-500 font-mono">
                            No faculty coordinators assigned yet.
                          </td>
                        </tr>
                      ) : (
                        contests.flatMap(c =>
                          (c.admins || []).map(email => (
                            <tr key={`${c.id}-${email}`} className="border-b border-[#1f1f1f] hover:bg-[#1f1f1f] transition-colors">
                              <td className="py-3 font-mono font-bold text-white">{email}</td>
                              <td className="py-3 font-bold text-orange-400">{c.name}</td>
                              <td className="py-3 text-right">
                                <button
                                  onClick={() => handleRemoveCoordinator(c.id, email)}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1 rounded text-xs transition-colors cursor-pointer"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ TAB 6: QUESTIONS ════════════════ */}
          {tab === 'questions' && (
            <div className="space-y-6">
              {/* Contest Selector */}
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <label className="text-xs uppercase font-mono tracking-widest text-gray-400 font-bold">
                    Select Contest:
                  </label>
                  <select
                    value={selectedContestId}
                    onChange={e => setSelectedContestId(Number(e.target.value))}
                    className="bg-[#111] border border-[#2a2a2a] focus:border-orange-500 text-white rounded-lg px-3.5 py-2 text-xs font-bold font-mono outline-none cursor-pointer"
                  >
                    {contests.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-xs font-mono text-gray-400">
                  Total Questions: <span className="text-white font-bold">{activeContest.questions?.length || 0}</span> • Total Marks: <span className="text-orange-400 font-bold">{activeContest.marks}</span>
                </div>
              </div>

              {/* Questions Table */}
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="text-gray-500 uppercase tracking-widest border-b border-[#2a2a2a] text-left">
                      <th className="pb-3 font-semibold w-10">#</th>
                      <th className="pb-3 font-semibold">Question Title / Statement</th>
                      <th className="pb-3 font-semibold w-24">Type</th>
                      <th className="pb-3 font-semibold w-20">Marks</th>
                      <th className="pb-3 font-semibold w-28">Status</th>
                      <th className="pb-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeContest.questions || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500 font-mono">
                          No questions added to this contest yet. Use the buttons above to add MCQs or Coding problems.
                        </td>
                      </tr>
                    ) : (
                      (activeContest.questions || []).map((q, idx) => {
                        const isLive = q.isLive !== false;
                        return (
                          <tr key={q.id} className="border-b border-[#1f1f1f] hover:bg-[#1f1f1f] transition-colors">
                            <td className="py-3 font-mono text-gray-400">{idx + 1}</td>
                            <td className="py-3 font-semibold text-white truncate max-w-sm">
                              {q.type === 'code' ? q.title : q.text}
                            </td>
                            <td className="py-3 font-mono uppercase text-gray-400">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                q.type === 'code' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              }`}>
                                {q.type}
                              </span>
                            </td>
                            <td className="py-3 font-mono text-orange-400 font-bold">{q.marks}</td>
                            <td className="py-3">
                              {/* Orange Toggle Switch */}
                              <button
                                onClick={() => handleToggleQuestionLive(q.id)}
                                className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                                  isLive ? 'bg-orange-500 justify-end' : 'bg-gray-600 justify-start'
                                }`}
                              >
                                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                              </button>
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => handleDeleteQuestion(q.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1 rounded text-xs transition-colors cursor-pointer"
                              >
                                🗑️ Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ════════════════ 👁️ RIGHT-SIDE SLIDING DRAWER ════════════════ */}
      {selectedStudentDrawer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-[480px] bg-[#111111] border-l border-[#2a2a2a] h-full overflow-y-auto p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#2a2a2a] mb-5">
                <div>
                  <h3 className="text-base font-bold text-white">
                    {selectedStudentDrawer.name}
                  </h3>
                  <div className="text-xs font-mono text-orange-400 mt-0.5">
                    {selectedStudentDrawer.jntuNo} • {selectedStudentDrawer.branch}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStudentDrawer(null)}
                  className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#2a2a2a] cursor-pointer text-sm font-bold"
                >
                  ✕ Close
                </button>
              </div>

              {/* Contest & Score Pill */}
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 mb-5 flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 uppercase font-mono">Exam Session</div>
                  <div className="text-sm font-bold text-white">{selectedStudentDrawer.contest || activeContest.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 uppercase font-mono">Final Score</div>
                  <div className="text-base font-mono font-bold text-green-400">
                    {selectedStudentDrawer.score} / {selectedStudentDrawer.total} (
                    {selectedStudentDrawer.percentage !== undefined
                      ? selectedStudentDrawer.percentage
                      : Math.round((selectedStudentDrawer.score / selectedStudentDrawer.total) * 100)}
                    %)
                  </div>
                </div>
              </div>

              {/* Proctoring Timeline & Flags */}
              <div className="space-y-2.5 text-xs font-mono mb-6 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
                <div className="flex justify-between text-gray-300">
                  <span className="text-gray-500">🕒 Submitted:</span>
                  <span>{selectedStudentDrawer.submittedAt || selectedStudentDrawer.time || 'Today'}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span className="text-gray-500">⏱️ Time Taken:</span>
                  <span>{selectedStudentDrawer.timeTaken ? `${Math.floor(selectedStudentDrawer.timeTaken / 60)}m ${selectedStudentDrawer.timeTaken % 60}s` : 'N/A'}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span className="text-gray-500">🔄 Page Refreshes:</span>
                  <span className={selectedStudentDrawer.refreshes > 0 ? 'text-yellow-400' : 'text-green-400'}>
                    {selectedStudentDrawer.refreshes || 0}
                  </span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span className="text-gray-500">⚠️ Tab Switches:</span>
                  <span className={(selectedStudentDrawer.warnings || 0) >= 3 ? 'text-red-400 font-bold' : (selectedStudentDrawer.warnings || 0) > 0 ? 'text-yellow-400' : 'text-green-400'}>
                    {selectedStudentDrawer.warnings || 0} {(selectedStudentDrawer.warnings || 0) >= 3 ? '🚨 (Auto-submitted)' : ''}
                  </span>
                </div>
              </div>

              {/* Violation Log */}
              <div className="mb-6">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 font-mono">
                  Violation Log
                </h4>
                <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg p-3 space-y-2 font-mono text-xs text-gray-400">
                  <div className="flex items-center justify-between text-[11px]">
                    <span>[00:12:33] Fullscreen exited</span>
                    <span className="text-orange-400">⚠️</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span>[00:23:11] Tab switch detected</span>
                    <span className="text-orange-400">⚠️</span>
                  </div>
                  {(selectedStudentDrawer.warnings || 0) >= 3 && (
                    <div className="flex items-center justify-between text-[11px] text-red-400">
                      <span>[00:45:02] 3rd violation → Auto-submit</span>
                      <span>🚨</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Submitted Code Block */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 font-mono">
                  Submitted Code
                </h4>
                <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg p-4 font-mono text-xs text-green-400 overflow-x-auto max-h-60">
                  <pre className="leading-relaxed">
                    {selectedStudentDrawer.code && Object.values(selectedStudentDrawer.code)[0]
                      ? Object.values(selectedStudentDrawer.code)[0]
                      : `def binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-[#2a2a2a] flex gap-3 mt-6">
              <button
                onClick={() => {
                  if (window.confirm('Invalidate this student submission?')) {
                    notify('Submission marked invalid', 'info');
                    setSelectedStudentDrawer(null);
                  }
                }}
                className="flex-1 border border-red-500/30 text-red-400 hover:bg-red-500/10 py-2.5 rounded-lg text-xs font-semibold cursor-pointer"
              >
                🚫 Invalidate
              </button>
              <button
                onClick={() => {
                  const score = prompt('Enter new score:', selectedStudentDrawer.score);
                  if (score !== null) {
                    notify(`Score updated to ${score}`);
                    setSelectedStudentDrawer(null);
                  }
                }}
                className="flex-1 border border-[#2a2a2a] hover:border-orange-500 text-gray-300 hover:text-orange-400 py-2.5 rounded-lg text-xs font-semibold cursor-pointer"
              >
                ✏️ Override Score
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ MODALS ════════════════ */}

      {/* 1. + New Contest Modal */}
      {showCreateContest && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <h2 className="text-base font-bold text-white mb-1">Create New Contest</h2>
            <p className="text-xs text-gray-500 mb-6">Configure exam parameters and access passcode</p>

            <form onSubmit={handleCreateContestSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-mono text-gray-400 font-semibold mb-1.5">
                  Contest Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Data Structures & Algorithms Quiz"
                  value={newContest.name}
                  onChange={e => setNewContest({ ...newContest, name: e.target.value })}
                  required
                  className="w-full bg-[#111] border border-[#2a2a2a] focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-gray-100 rounded-lg px-4 py-2.5 outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-mono text-gray-400 font-semibold mb-1.5">
                  Description
                </label>
                <textarea
                  placeholder="Instructions or syllabus for students..."
                  value={newContest.desc}
                  onChange={e => setNewContest({ ...newContest, desc: e.target.value })}
                  className="w-full bg-[#111] border border-[#2a2a2a] focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-gray-100 rounded-lg px-4 py-2 text-xs outline-none h-20 resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs uppercase font-mono text-gray-400 font-semibold mb-1.5">
                    Duration (Min)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={300}
                    value={newContest.duration}
                    onChange={e => setNewContest({ ...newContest, duration: e.target.value })}
                    className="w-full bg-[#111] border border-[#2a2a2a] focus:border-orange-500 text-gray-100 rounded-lg px-3 py-2 outline-none text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-mono text-gray-400 font-semibold mb-1.5">
                    Contest Type
                  </label>
                  <select
                    value={newContest.type}
                    onChange={e => setNewContest({ ...newContest, type: e.target.value })}
                    className="w-full bg-[#111] border border-[#2a2a2a] text-gray-100 rounded-lg px-3 py-2 outline-none text-xs"
                  >
                    <option value="Mixed">Mixed</option>
                    <option value="Coding">Coding</option>
                    <option value="MCQ">MCQ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase font-mono text-gray-400 font-semibold mb-1.5">
                    Status
                  </label>
                  <select
                    value={newContest.status}
                    onChange={e => setNewContest({ ...newContest, status: e.target.value })}
                    className="w-full bg-[#111] border border-[#2a2a2a] text-gray-100 rounded-lg px-3 py-2 outline-none text-xs"
                  >
                    <option value="Open">Open</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-mono text-gray-400 font-semibold mb-1.5">
                  Master Access Token
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newContest.token}
                    onChange={e => setNewContest({ ...newContest, token: e.target.value.toUpperCase() })}
                    className="flex-1 bg-[#111] border border-[#2a2a2a] focus:border-orange-500 text-white font-mono rounded-lg px-4 py-2 text-xs uppercase outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setNewContest({ ...newContest, token: `GMRIT-${randomHex(5)}` })}
                    className="border border-[#2a2a2a] hover:border-orange-500 text-gray-300 hover:text-orange-400 px-3 py-2 rounded-lg text-xs font-mono cursor-pointer"
                  >
                    Auto-generate
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#2a2a2a]">
                <button
                  type="button"
                  onClick={() => setShowCreateContest(false)}
                  className="flex-1 border border-[#2a2a2a] hover:border-gray-600 text-gray-400 hover:text-white py-2.5 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white py-2.5 rounded-lg text-xs font-semibold cursor-pointer shadow-lg shadow-orange-500/20"
                >
                  Create Contest →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. + Generate Tokens Modal */}
      {showGenerateTokens && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-base font-bold text-white mb-1">Generate Single-Use Tokens</h2>
            <p className="text-xs text-gray-500 mb-5">Create unique access slips for {activeContest.name}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-mono text-gray-400 font-semibold mb-2">
                  Select Quantity
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 25, 50].map(cnt => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => {
                        setTokenGenCount(cnt);
                        setCustomGenCount('');
                      }}
                      className={`py-2 rounded-lg font-mono text-xs font-bold border transition-colors cursor-pointer ${
                        tokenGenCount === cnt && !customGenCount
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'border-[#2a2a2a] text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-mono text-gray-400 font-semibold mb-1.5">
                  Or Custom Quantity
                </label>
                <input
                  type="number"
                  placeholder="e.g. 100"
                  value={customGenCount}
                  onChange={e => setCustomGenCount(e.target.value)}
                  className="w-full bg-[#111] border border-[#2a2a2a] focus:border-orange-500 text-white font-mono rounded-lg px-4 py-2 text-xs outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#2a2a2a]">
                <button
                  onClick={() => setShowGenerateTokens(false)}
                  className="flex-1 border border-[#2a2a2a] text-gray-400 hover:text-white py-2.5 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateBatchTokens}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg text-xs font-semibold cursor-pointer shadow-lg shadow-orange-500/20"
                >
                  Generate →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. + Add Admin Modal */}
      {showAddAdmin && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-base font-bold text-white mb-1">Add Platform Admin</h2>
            <p className="text-xs text-gray-500 mb-5">Create a new evaluator or exam controller account</p>

            <form onSubmit={handleAddAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-mono text-gray-400 font-semibold mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. K. Ramesh"
                  value={newAdmin.name}
                  onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  required
                  className="w-full bg-[#111] border border-[#2a2a2a] focus:border-orange-500 text-white rounded-lg px-4 py-2 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-mono text-gray-400 font-semibold mb-1.5">
                  Email (@gmrit.edu.in)
                </label>
                <input
                  type="email"
                  placeholder="ramesh@gmrit.edu.in"
                  value={newAdmin.email}
                  onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  required
                  className="w-full bg-[#111] border border-[#2a2a2a] focus:border-orange-500 text-white font-mono rounded-lg px-4 py-2 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-mono text-gray-400 font-semibold mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newAdmin.password}
                  onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  className="w-full bg-[#111] border border-[#2a2a2a] focus:border-orange-500 text-white rounded-lg px-4 py-2 text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase font-mono text-gray-400 font-semibold mb-1.5">
                    Role
                  </label>
                  <select
                    value={newAdmin.role}
                    onChange={e => setNewAdmin({ ...newAdmin, role: e.target.value })}
                    className="w-full bg-[#111] border border-[#2a2a2a] text-white rounded-lg px-3 py-2 text-xs outline-none"
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="Faculty Admin">Faculty Admin</option>
                    <option value="Invigilator">Invigilator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase font-mono text-gray-400 font-semibold mb-1.5">
                    Department
                  </label>
                  <select
                    value={newAdmin.department}
                    onChange={e => setNewAdmin({ ...newAdmin, department: e.target.value })}
                    className="w-full bg-[#111] border border-[#2a2a2a] text-white rounded-lg px-3 py-2 text-xs outline-none"
                  >
                    {['CSE', 'IT', 'ECE', 'AI&DS', 'ME', 'EEE'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#2a2a2a]">
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(false)}
                  className="flex-1 border border-[#2a2a2a] text-gray-400 hover:text-white py-2.5 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg text-xs font-semibold cursor-pointer shadow-lg shadow-orange-500/20"
                >
                  Add Admin →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. + Assign Coordinator Modal */}
      {showAssignCoordinator && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-base font-bold text-white mb-1">Assign Contest Coordinator</h2>
            <p className="text-xs text-gray-500 mb-5">Delegate examination management to faculty</p>

            <form onSubmit={handleAssignCoordinatorSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-mono text-gray-400 font-semibold mb-1.5">
                  Pick Faculty / Admin
                </label>
                <select
                  value={selectedFacultyEmail}
                  onChange={e => setSelectedFacultyEmail(e.target.value)}
                  required
                  className="w-full bg-[#111] border border-[#2a2a2a] focus:border-orange-500 text-white font-mono rounded-lg px-3.5 py-2.5 text-xs outline-none"
                >
                  <option value="">-- Choose Admin --</option>
                  {admins.map(a => (
                    <option key={a.email} value={a.email}>
                      {a.name} ({a.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase font-mono text-gray-400 font-semibold mb-1.5">
                  Pick Contest
                </label>
                <select
                  value={selectedAssignContestId}
                  onChange={e => setSelectedAssignContestId(Number(e.target.value))}
                  className="w-full bg-[#111] border border-[#2a2a2a] focus:border-orange-500 text-white font-mono rounded-lg px-3.5 py-2.5 text-xs outline-none"
                >
                  {contests.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#2a2a2a]">
                <button
                  type="button"
                  onClick={() => setShowAssignCoordinator(false)}
                  className="flex-1 border border-[#2a2a2a] text-gray-400 hover:text-white py-2.5 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg text-xs font-semibold cursor-pointer shadow-lg shadow-orange-500/20"
                >
                  Assign →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. + Add MCQ Modal */}
      {showAddMCQ && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-white mb-1">Add Multiple Choice Question</h2>
            <p className="text-xs text-gray-500 mb-5">For {activeContest.name}</p>

            <form onSubmit={handleSaveMCQ} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-mono text-gray-400 font-semibold mb-1.5">
                  Question Statement
                </label>
                <textarea
                  placeholder="e.g. What is the time complexity of Merge Sort in the worst case?"
                  value={mcqDraft.text}
                  onChange={e => setMcqDraft({ ...mcqDraft, text: e.target.value })}
                  required
                  className="w-full bg-[#111] border border-[#2a2a2a] focus:border-orange-500 text-white rounded-lg px-4 py-2.5 text-xs outline-none h-24 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs uppercase font-mono text-gray-400 font-semibold">
                  Options (Select correct radio)
                </label>
                {['A', 'B', 'C', 'D'].map((letter, i) => (
                  <div key={letter} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="correctMCQ"
                      checked={mcqDraft.correct === i}
                      onChange={() => setMcqDraft({ ...mcqDraft, correct: i })}
                      className="w-4 h-4 accent-orange-500 cursor-pointer"
                    />
                    <input
                      type="text"
                      placeholder={`Option ${letter}`}
                      value={mcqDraft.options[i]}
                      onChange={e => {
                        const next = [...mcqDraft.options];
                        next[i] = e.target.value;
                        setMcqDraft({ ...mcqDraft, options: next });
                      }}
                      required
                      className="flex-1 bg-[#111] border border-[#2a2a2a] focus:border-orange-500 text-white rounded-lg px-3 py-2 text-xs outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs uppercase font-mono text-gray-400 font-semibold mb-1.5">
                    Marks
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={mcqDraft.marks}
                    onChange={e => setMcqDraft({ ...mcqDraft, marks: e.target.value })}
                    className="w-full bg-[#111] border border-[#2a2a2a] focus:border-orange-500 text-white font-mono rounded-lg px-3 py-2 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-mono text-gray-400 font-semibold mb-1.5">
                    Status
                  </label>
                  <select
                    value={mcqDraft.isLive ? 'Live' : 'Hidden'}
                    onChange={e => setMcqDraft({ ...mcqDraft, isLive: e.target.value === 'Live' })}
                    className="w-full bg-[#111] border border-[#2a2a2a] text-white rounded-lg px-3 py-2 text-xs outline-none"
                  >
                    <option value="Live">🟢 Live</option>
                    <option value="Hidden">🔴 Hidden</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#2a2a2a]">
                <button
                  type="button"
                  onClick={() => setShowAddMCQ(false)}
                  className="flex-1 border border-[#2a2a2a] text-gray-400 hover:text-white py-2.5 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg text-xs font-semibold cursor-pointer shadow-lg shadow-orange-500/20"
                >
                  Save Question →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. + Add Coding Question Modal */}
      {showAddCoding && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-white mb-1">Add Coding Problem</h2>
            <p className="text-xs text-gray-500 mb-5">Configure problem statement &amp; automated test cases</p>

            <form onSubmit={handleSaveCoding} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-mono text-gray-400 font-semibold mb-1.5">
                  Problem Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Implement Binary Search"
                  value={codingDraft.title}
                  onChange={e => setCodingDraft({ ...codingDraft, title: e.target.value })}
                  required
                  className="w-full bg-[#111] border border-[#2a2a2a] focus:border-orange-500 text-white rounded-lg px-4 py-2 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-mono text-gray-400 font-semibold mb-1.5">
                  Problem Description (Plain text / markdown)
                </label>
                <textarea
                  placeholder="Given a sorted array of integers and a target value..."
                  value={codingDraft.text}
                  onChange={e => setCodingDraft({ ...codingDraft, text: e.target.value })}
                  required
                  className="w-full bg-[#0d0d0d] border border-[#2a2a2a] focus:border-orange-500 text-white font-mono rounded-lg px-4 py-2.5 text-xs outline-none h-28 resize-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase font-mono text-gray-400 font-semibold mb-1.5">
                    Marks
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={codingDraft.marks}
                    onChange={e => setCodingDraft({ ...codingDraft, marks: e.target.value })}
                    className="w-full bg-[#111] border border-[#2a2a2a] focus:border-orange-500 text-white font-mono rounded-lg px-3 py-2 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-mono text-gray-400 font-semibold mb-1.5">
                    Status
                  </label>
                  <select
                    value={codingDraft.isLive ? 'Live' : 'Hidden'}
                    onChange={e => setCodingDraft({ ...codingDraft, isLive: e.target.value === 'Live' })}
                    className="w-full bg-[#111] border border-[#2a2a2a] text-white rounded-lg px-3 py-2 text-xs outline-none"
                  >
                    <option value="Live">🟢 Live</option>
                    <option value="Hidden">🔴 Hidden</option>
                  </select>
                </div>
              </div>

              {/* Test Cases Section */}
              <div className="pt-3 border-t border-[#2a2a2a]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono uppercase text-gray-400 font-bold">
                    Test Cases ({codingDraft.testCases.length})
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCodingDraft({
                          ...codingDraft,
                          testCases: [
                            ...codingDraft.testCases,
                            { id: Date.now(), input: '', expected: '', isHidden: false, explanation: '' }
                          ]
                        })
                      }
                      className="border border-[#2a2a2a] hover:border-orange-500 text-gray-300 hover:text-orange-400 px-2.5 py-1 rounded text-[11px] font-mono cursor-pointer"
                    >
                      + Add Sample
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCodingDraft({
                          ...codingDraft,
                          testCases: [
                            ...codingDraft.testCases,
                            { id: Date.now(), input: '', expected: '', isHidden: true, explanation: '' }
                          ]
                        })
                      }
                      className="border border-[#2a2a2a] hover:border-orange-500 text-gray-300 hover:text-orange-400 px-2.5 py-1 rounded text-[11px] font-mono cursor-pointer"
                    >
                      + Add Hidden 🔒
                    </button>
                  </div>
                </div>

                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {codingDraft.testCases.map((tc, idx) => (
                    <div key={tc.id || idx} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 text-xs font-mono">
                      <div className="flex items-center justify-between mb-2">
                        <span className={tc.isHidden ? 'text-yellow-400 font-bold' : 'text-green-400 font-bold'}>
                          {tc.isHidden ? `🔒 Hidden Test Case #${idx + 1}` : `👁️ Sample Test Case #${idx + 1}`}
                        </span>
                        {codingDraft.testCases.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setCodingDraft({
                                ...codingDraft,
                                testCases: codingDraft.testCases.filter((_, i) => i !== idx)
                              })
                            }
                            className="text-red-400 hover:text-red-300 text-xs cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] text-gray-500 uppercase mb-1">Standard Input (stdin)</label>
                          <textarea
                            placeholder="Input args..."
                            value={tc.input}
                            onChange={e => {
                              const next = [...codingDraft.testCases];
                              next[idx].input = e.target.value;
                              setCodingDraft({ ...codingDraft, testCases: next });
                            }}
                            className="w-full bg-[#0d0d0d] border border-[#2a2a2a] p-2 rounded text-white h-14 resize-none outline-none font-mono text-[11px]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-500 uppercase mb-1">Expected Output (stdout)</label>
                          <textarea
                            placeholder="Expected string..."
                            value={tc.expected}
                            onChange={e => {
                              const next = [...codingDraft.testCases];
                              next[idx].expected = e.target.value;
                              setCodingDraft({ ...codingDraft, testCases: next });
                            }}
                            required
                            className="w-full bg-[#0d0d0d] border border-[#2a2a2a] p-2 rounded text-green-400 h-14 resize-none outline-none font-mono text-[11px]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#2a2a2a]">
                <button
                  type="button"
                  onClick={() => setShowAddCoding(false)}
                  className="flex-1 border border-[#2a2a2a] text-gray-400 hover:text-white py-2.5 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg text-xs font-semibold cursor-pointer shadow-lg shadow-orange-500/20"
                >
                  Save Problem →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
