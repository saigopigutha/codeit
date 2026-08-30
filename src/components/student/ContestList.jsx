import React, { useState } from 'react';
import Logo from '../ui/Logo';

function formatDuration(min) {
  return min >= 60 ? `${Math.floor(min / 60)}h ${min % 60 > 0 ? ' ' + (min % 60) + 'm' : ''}`.trim() : `${min}m`;
}

export default function ContestList({ contests = [], student, onEnterWithToken, onLogout }) {
  const [activeNav, setActiveNav] = useState('contests');
  const [tab, setTab] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedContest, setSelectedContest] = useState(null);
  const [tokenInput, setTokenInput] = useState('');
  const [tokenErr, setTokenErr] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [agreedToRules, setAgreedToRules] = useState(false);

  const filtered = contests.filter(c => {
    const matchTab = tab === 'All' || c.status === tab;
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.desc || '').toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const handleCardClick = c => {
    if (c.status === 'Closed') return;
    if (c.status === 'Upcoming') {
      alert('This contest has not started yet. Check back when the status turns OPEN.');
      return;
    }
    if (c.questions?.length === 0) {
      alert('This contest has no questions configured yet. Please contact your instructor.');
      return;
    }
    setSelectedContest(c);
    setTokenInput('');
    setTokenErr('');
    setShowInstructions(false);
    setAgreedToRules(false);
  };

  const handleVerifyToken = e => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setTokenErr('Please enter the contest access token / passcode.');
      return;
    }
    // Check token with parent handler or move to instructions
    setShowInstructions(true);
  };

  const handleFinalStart = () => {
    if (!agreedToRules) return;
    const res = onEnterWithToken(selectedContest, tokenInput);
    if (res && !res.success) {
      setShowInstructions(false);
      setTokenErr(res.error || 'Invalid access token.');
    } else {
      setSelectedContest(null);
      setShowInstructions(false);
    }
  };

  const navItems = [
    { id: 'contests', label: 'Contests', icon: '🏠' },
    { id: 'my-tests', label: 'My Tests', icon: '📋' },
    { id: 'history', label: 'History', icon: '🔖' },
    { id: 'alerts', label: 'Alerts', icon: '🔔', badge: 3 },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex">
      {/* ── Left Sidebar (code.zone style) ── */}
      <aside className="w-64 bg-[#111111] border-r border-[#2a2a2a] p-5 flex flex-col justify-between flex-shrink-0">
        <div>
          {/* Logo */}
          <div className="mb-8 pl-1">
            <Logo size="md" subtitle="GMRIT Exam Portal" />
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map(item => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'text-orange-500 bg-orange-500/10 font-semibold'
                      : 'text-gray-400 hover:text-gray-100 hover:bg-[#1a1a1a]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile Card at Bottom */}
        <div className="pt-4 border-t border-[#2a2a2a]">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 font-mono font-bold flex items-center justify-center text-xs flex-shrink-0">
                {(student?.name || 'S')[0].toUpperCase()}
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-white truncate">{student?.name || 'Student'}</div>
                <div className="text-[10px] font-mono text-gray-400 truncate">
                  {student?.jntuNo} · {student?.branch}
                </div>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Logout"
              className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-[#2a2a2a] transition-colors cursor-pointer"
            >
              🚪
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content Canvas ── */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Top Sticky Header with Search */}
        <header className="sticky top-0 z-20 bg-[#0d0d0d]/90 backdrop-blur-md border-b border-[#2a2a2a] px-8 py-4 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search contests by name or topic..."
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-gray-100 placeholder-gray-500 rounded-lg pl-9 pr-4 py-2 text-xs outline-none transition-all duration-200 font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            {['All', 'Open', 'Upcoming', 'Closed'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  tab === t
                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                    : 'bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 hover:text-gray-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </header>

        {/* Contests Grid Canvas */}
        <div className="p-8 max-w-5xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Available Contests</h1>
              <p className="text-xs text-gray-400 mt-0.5">Select an active contest to enter and verify your token</p>
            </div>
            <span className="text-xs font-mono text-gray-500">{filtered.length} Contests found</span>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-12 text-center text-gray-500">
              <div className="text-3xl mb-2 font-mono text-orange-500">&lt;/&gt;</div>
              <h3 className="text-sm font-semibold text-gray-300">No contests available in this category</h3>
              <p className="text-xs text-gray-500 mt-1">Check back soon or select another status filter above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map(c => {
                const isOpen = c.status === 'Open';
                const isUpcoming = c.status === 'Upcoming';

                return (
                  <div
                    key={c.id}
                    onClick={() => handleCardClick(c)}
                    className={`bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 transition-all duration-200 relative group ${
                      isOpen
                        ? 'border-l-4 border-l-orange-500 hover:border-orange-500/50 cursor-pointer shadow-lg shadow-black/40'
                        : 'opacity-70 cursor-not-allowed'
                    }`}
                  >
                    {/* Status Dot + Type Tag */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isOpen ? 'bg-green-500 animate-pulse' : isUpcoming ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                        />
                        <span
                          className={`text-[11px] font-bold uppercase tracking-wider ${
                            isOpen ? 'text-green-400' : isUpcoming ? 'text-yellow-400' : 'text-red-400'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>

                      <span className="bg-[#111111] border border-[#2a2a2a] text-gray-400 text-[10px] font-mono uppercase px-2 py-0.5 rounded">
                        {c.type}
                      </span>
                    </div>

                    <h2 className="text-base font-bold text-white group-hover:text-orange-400 transition-colors mb-1.5">
                      {c.name}
                    </h2>
                    <p className="text-xs text-gray-400 line-clamp-2 mb-4 leading-relaxed">
                      {c.desc || 'Comprehensive coding and technical MCQs proctored assessment.'}
                    </p>

                    {/* Specs & Enter Button */}
                    <div className="pt-3 border-t border-[#2a2a2a] flex items-center justify-between text-xs font-mono text-gray-400">
                      <div className="flex items-center gap-3">
                        <span>❓ {c.questions?.length || 0} Qs</span>
                        <span>⏱ {formatDuration(c.duration)}</span>
                        <span>📊 {c.marks} Marks</span>
                      </div>

                      {isOpen && (
                        <button className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                          <span>Enter</span>
                          <span>→</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ── 1. Enter Password / Token Modal ── */}
      {selectedContest && !showInstructions && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center text-lg">
                🔒
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Enter Contest Password</h2>
                <div className="text-xs text-gray-400 font-mono">{selectedContest.name}</div>
              </div>
            </div>

            <div className="bg-[#111111] border border-[#2a2a2a] rounded-lg p-3 my-4 text-xs font-mono text-gray-400 flex items-center justify-between">
              <span>Duration: {selectedContest.duration} min</span>
              <span>Questions: {selectedContest.questions?.length}</span>
              <span>Marks: {selectedContest.marks}</span>
            </div>

            {tokenErr && (
              <div className="mb-4 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
                ⚠️ {tokenErr}
              </div>
            )}

            <form onSubmit={handleVerifyToken}>
              <div className="mb-5">
                <label className="block text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2">
                  Access Token / Password
                </label>
                <input
                  type="text"
                  placeholder="e.g. ROUND2-2024-CODE"
                  value={tokenInput}
                  onChange={e => setTokenInput(e.target.value.toUpperCase())}
                  autoFocus
                  required
                  className="w-full bg-[#111111] border border-[#2a2a2a] focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 text-white font-mono rounded-lg px-4 py-3 text-sm outline-none uppercase transition-all duration-200"
                />
                <p className="text-[11px] text-gray-500 mt-1.5 font-mono">
                  Enter the exam passcode provided by your instructor.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedContest(null)}
                  className="flex-1 py-2.5 border border-[#2a2a2a] hover:border-gray-600 text-gray-300 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-lg shadow-orange-500/20"
                >
                  Proceed →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 2. Instructions Page Modal (Full-Screen Dark) ── */}
      {selectedContest && showInstructions && (
        <div className="fixed inset-0 z-50 bg-[#0d0d0d] flex items-center justify-center p-6">
          <div className="w-full max-w-xl bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#2a2a2a]">
              <Logo size="sm" />
              <span className="text-xs font-mono text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                {selectedContest.name}
              </span>
            </div>

            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
              <span>📋</span> Before you begin
            </h2>
            <p className="text-xs text-orange-400 font-mono mb-5 flex items-center gap-1.5">
              <span>⚠️</span> This assessment is strictly proctored.
            </p>

            <div className="space-y-2.5 text-xs text-gray-300 font-mono bg-[#111111] border border-[#2a2a2a] rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 text-green-400">
                <span>✅</span> Stay in fullscreen mode at all times.
              </div>
              <div className="flex items-center gap-2 text-green-400">
                <span>✅</span> Do not switch tabs, minimize windows, or open other apps.
              </div>
              <div className="flex items-center gap-2 text-green-400">
                <span>✅</span> Copy-paste and right-click are strictly disabled.
              </div>
              <div className="flex items-center gap-2 text-red-400">
                <span>❌</span> 3 proctoring violations = automatic test submission.
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6 text-center text-xs font-mono">
              <div className="bg-[#111111] border border-[#2a2a2a] p-3 rounded-lg">
                <div className="text-gray-500 text-[10px] uppercase">Duration</div>
                <div className="font-bold text-white mt-0.5">{selectedContest.duration} min</div>
              </div>
              <div className="bg-[#111111] border border-[#2a2a2a] p-3 rounded-lg">
                <div className="text-gray-500 text-[10px] uppercase">Questions</div>
                <div className="font-bold text-white mt-0.5">{selectedContest.questions?.length}</div>
              </div>
              <div className="bg-[#111111] border border-[#2a2a2a] p-3 rounded-lg">
                <div className="text-gray-500 text-[10px] uppercase">Total Marks</div>
                <div className="font-bold text-orange-400 mt-0.5">{selectedContest.marks}</div>
              </div>
            </div>

            <label className="flex items-center gap-3 mb-6 p-3 rounded-lg border border-[#2a2a2a] hover:border-orange-500/30 bg-[#111111] cursor-pointer text-xs text-gray-300 select-none">
              <input
                type="checkbox"
                checked={agreedToRules}
                onChange={e => setAgreedToRules(e.target.checked)}
                className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
              />
              <span>I have read and agree to all proctoring rules and exam policies.</span>
            </label>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowInstructions(false);
                  setSelectedContest(null);
                }}
                className="flex-1 py-3 border border-[#2a2a2a] hover:border-gray-600 text-gray-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!agreedToRules}
                onClick={handleFinalStart}
                className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-lg shadow-orange-500/20"
              >
                Enter Fullscreen &amp; Start →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
