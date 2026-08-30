import React, { useState, useEffect, useRef } from 'react';
import { SUPPORTED_LANGUAGES, STARTER_TEMPLATES } from '../../utils/codeTemplates.js';
import { runTestCase, runAllTestCases } from '../../utils/codeRunner.js';
import Logo from '../ui/Logo';

export default function TestInterface({ student, contest, onFinish }) {
  const contestKey = `codeit_session_${contest?.id}_${student?.jntuNo}`;
  const refreshKey = `codeit_refreshes_${contest?.id}_${student?.jntuNo}`;
  const totalSec = (contest?.duration || 30) * 60;

  // Track page refreshes during exam
  const initialRefreshes = parseInt(sessionStorage.getItem(refreshKey) || '0', 10);
  const [refreshCount, setRefreshCount] = useState(initialRefreshes);

  useEffect(() => {
    const nextRefreshes = initialRefreshes + 1;
    sessionStorage.setItem(refreshKey, nextRefreshes.toString());
    setRefreshCount(initialRefreshes);
  }, []);

  // Restore session from localStorage if present
  const loadSaved = () => {
    try {
      const saved = localStorage.getItem(contestKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  };

  const savedSession = loadSaved();

  const [timeLeft, setTimeLeft] = useState(savedSession?.timeLeft !== undefined ? savedSession.timeLeft : totalSec);
  const [current, setCurrent] = useState(savedSession?.current || 0);
  const [answers, setAnswers] = useState(savedSession?.answers || {});
  const [code, setCode] = useState(savedSession?.code || {});
  const [lang, setLang] = useState(savedSession?.lang || {});
  const [flagged, setFlagged] = useState(savedSession?.flagged || {});
  const [visited, setVisited] = useState(savedSession?.visited || { 0: true });
  const [submissions, setSubmissions] = useState(savedSession?.submissions || {});
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  // Proctoring State
  const [warnings, setWarnings] = useState(savedSession?.warnings || 0);
  const [proctorAlert, setProctorAlert] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));

  // Runner state for current coding question
  const [activeTab, setActiveTab] = useState('testcases');
  const [selectedTestCaseIdx, setSelectedTestCaseIdx] = useState(0);
  const [customInput, setCustomInput] = useState('');
  const [runResult, setRunResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);

  const timerRef = useRef(null);
  const questions = contest?.questions || [];

  // Track visited questions
  useEffect(() => {
    setVisited(v => ({ ...v, [current]: true }));
  }, [current]);

  // Auto-Save progress to LocalStorage
  useEffect(() => {
    const dataToSave = {
      timeLeft,
      current,
      answers,
      code,
      lang,
      flagged,
      visited,
      submissions,
      warnings,
      savedAt: Date.now()
    };
    try {
      localStorage.setItem(contestKey, JSON.stringify(dataToSave));
    } catch (e) {}
  }, [timeLeft, current, answers, code, lang, flagged, visited, submissions, warnings]);

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleSubmit(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // 🛡️ PROCTORING: Track Tab Switch / Window Blur & Fullscreen
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setWarnings(w => {
          const next = w + 1;
          setProctorAlert(`⚠️ Warning ${next}/3: Fullscreen exit or tab switch detected! Return immediately or test will auto-submit.`);
          if (next >= 3) {
            setTimeout(() => handleSubmit(true), 1500);
          }
          return next;
        });
      }
    };

    const handleFullscreenChange = () => {
      const fs = Boolean(document.fullscreenElement);
      setIsFullscreen(fs);
      if (!fs) {
        setWarnings(w => {
          const next = w + 1;
          setProctorAlert(`⚠️ Warning ${next}/3: Fullscreen exit detected! Return to fullscreen immediately.`);
          return next;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Toggle Fullscreen Mode
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {}
  };

  const fmt = s => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const q = questions[current];
  const currentLang = lang[q?.id] || 'python';

  const handleLangChange = (qId, newLang) => {
    setLang(l => ({ ...l, [qId]: newLang }));
    const currentCode = code[qId] || '';
    const isDefault = Object.values(STARTER_TEMPLATES).some(t => t.trim() === currentCode.trim()) || currentCode.trim() === '';
    if (isDefault) {
      setCode(c => ({ ...c, [qId]: STARTER_TEMPLATES[newLang] || '' }));
    }
  };

  const handleMCQ = (qId, idx) => setAnswers(a => ({ ...a, [qId]: idx }));
  const handleCodeChange = (qId, val) => setCode(c => ({ ...c, [qId]: val }));

  const toggleFlag = qId => {
    setFlagged(f => ({ ...f, [qId]: !f[qId] }));
  };

  // Handle Tab key inside code editor (inserts 4 spaces instead of blurring)
  const handleCodeKeyDown = e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const value = target.value;
      const newValue = value.substring(0, start) + '    ' + value.substring(end);
      handleCodeChange(q.id, newValue);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    }
  };

  const currentCode = code[q?.id] !== undefined ? code[q?.id] : (STARTER_TEMPLATES[currentLang] || '');

  const handleResetCode = () => {
    if (window.confirm('Reset code to default template?')) {
      setCode(c => ({ ...c, [q.id]: STARTER_TEMPLATES[currentLang] || '' }));
    }
  };

  // Run Code against sample test cases
  const handleRunCode = () => {
    setIsRunning(true);
    setRunResult(null);

    setTimeout(() => {
      if (activeTab === 'custom') {
        const res = runTestCase(currentCode, currentLang, null, customInput);
        setRunResult({ type: 'custom', data: res });
      } else {
        const sampleTestCases = (q.testCases || []).filter(tc => !tc.isHidden);
        const casesToRun = sampleTestCases.length > 0 ? sampleTestCases : (q.testCases || []);
        const results = casesToRun.map(tc => runTestCase(currentCode, currentLang, tc));
        setRunResult({ type: 'sample', results });
      }
      setActiveTab('result');
      setIsRunning(false);
    }, 450);
  };

  // Submit Code against all test cases
  const handleSubmitCode = () => {
    setIsSubmittingCode(true);

    setTimeout(() => {
      const allTestCases = q.testCases || [];
      const evaluation = runAllTestCases(currentCode, currentLang, allTestCases);

      setSubmissions(prev => ({
        ...prev,
        [q.id]: {
          ...evaluation,
          lang: currentLang,
          code: currentCode
        }
      }));

      setRunResult({ type: 'submit', data: evaluation });
      setActiveTab('result');
      setIsSubmittingCode(false);
    }, 600);
  };

  // Final Submit
  const handleSubmit = (auto = false) => {
    clearInterval(timerRef.current);
    try {
      localStorage.removeItem(contestKey);
    } catch (e) {}

    let totalScore = 0;
    let mcqCorrect = 0;
    let codingScores = {};

    questions.forEach(question => {
      if (question.type === 'mcq') {
        if (answers[question.id] === question.correct) {
          totalScore += question.marks;
          mcqCorrect++;
        }
      } else if (question.type === 'code') {
        const sub = submissions[question.id];
        let qScore = 0;
        if (sub) {
          qScore = Math.round(question.marks * sub.scoreRatio);
        } else {
          const qCode = code[question.id] || '';
          if (qCode.trim().length > 15) {
            const evalResult = runAllTestCases(qCode, lang[question.id] || 'python', question.testCases || []);
            qScore = Math.round(question.marks * evalResult.scoreRatio);
          }
        }
        totalScore += qScore;
        codingScores[question.id] = {
          score: qScore,
          maxMarks: question.marks,
          lang: lang[question.id] || 'python',
          code: code[question.id] || ''
        };
      }
    });

    const maxTotalMarks = questions.reduce((s, item) => s + item.marks, 0);

    onFinish({
      score: totalScore,
      total: maxTotalMarks,
      mcqCorrect,
      codingScores,
      timeTaken: totalSec - timeLeft,
      auto,
      answers,
      code,
      lang,
      submissions,
      warnings,
      refreshCount: refreshCount || 0
    });
  };

  if (!q) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center text-gray-500 font-mono">
        No questions available for this contest.
      </div>
    );
  }

  // Calculate Breakdown for Question Summary Navigator
  const mcqQuestions = questions.filter(item => item.type === 'mcq');
  const codingQuestions = questions.filter(item => item.type === 'code');

  const mcqAnsweredCount = mcqQuestions.filter(item => answers[item.id] !== undefined).length;
  const mcqFlaggedCount = mcqQuestions.filter(item => flagged[item.id]).length;
  const mcqSkippedCount = mcqQuestions.filter(item => visited[questions.indexOf(item)] && answers[item.id] === undefined).length;

  const codingAttemptedCount = codingQuestions.filter(item => (code[item.id] || '').trim().length > 0 || submissions[item.id]).length;

  const sampleTestCases = (q.testCases || []).filter(tc => !tc.isHidden);
  const qSubmission = submissions[q.id];

  return (
    <div className="h-screen bg-[#0d0d0d] text-[#f1f1f1] flex flex-col overflow-hidden font-sans select-none">
      {/* ── Top App Bar (code.zone style) ── */}
      <header className="h-14 bg-[#111111] border-b border-[#2a2a2a] px-6 flex items-center justify-between flex-shrink-0 z-30">
        <div className="flex items-center gap-4">
          <Logo size="sm" />
          <div className="h-4 w-px bg-[#2a2a2a]" />
          <div className="text-xs font-bold text-white tracking-tight truncate max-w-xs">
            {contest?.name}
          </div>
          <span className="text-[10px] font-mono text-gray-500 bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-0.5 rounded">
            {q.type === 'code' ? 'Coding Challenge' : 'MCQ Section'}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Proctoring Warnings Pill */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono border ${
              warnings > 0
                ? 'bg-red-500/10 border-red-500/30 text-red-400 font-bold'
                : 'bg-green-500/10 border-green-500/20 text-green-400'
            }`}
          >
            <span>{warnings > 0 ? '⚠️' : '🛡️'}</span>
            <span>{warnings > 0 ? `${warnings} Warn` : 'Proctor Active'}</span>
          </div>

          {/* Countdown Timer */}
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-mono font-bold border ${
              timeLeft < 300
                ? 'bg-red-500/15 border-red-500/40 text-red-400 animate-pulse'
                : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
            }`}
          >
            <span>🕐</span>
            <span>{fmt(timeLeft)}</span>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="text-xs font-mono text-gray-400 hover:text-white px-2.5 py-1 rounded border border-[#2a2a2a] hover:border-gray-600 transition-colors cursor-pointer"
          >
            {isFullscreen ? '⛶ Fullscreen' : '⛶ Enter Fullscreen'}
          </button>

          {/* Submit Test Button */}
          <button
            onClick={() => setConfirmSubmit(true)}
            className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-sm shadow-orange-500/20"
          >
            Submit Test ✓
          </button>
        </div>
      </header>

      {/* ── Slide-Down Violation Warning Alert ── */}
      {proctorAlert && (
        <div className="bg-orange-500 text-black px-6 py-2 text-xs font-bold font-mono flex items-center justify-between z-40 animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{proctorAlert}</span>
          </div>
          <div className="flex items-center gap-3">
            {!isFullscreen && (
              <button
                onClick={toggleFullscreen}
                className="bg-black text-white px-2.5 py-0.5 rounded text-[11px] hover:bg-gray-900 cursor-pointer"
              >
                Return to Fullscreen
              </button>
            )}
            <button
              onClick={() => setProctorAlert(null)}
              className="text-black hover:text-gray-900 font-bold text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── 3-Column Main Workspace ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── Column 1: Left Question Navigator (code.zone style) ── */}
        <aside className="w-60 bg-[#111111] border-r border-[#2a2a2a] p-4 flex flex-col justify-between flex-shrink-0 overflow-y-auto">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
              <span>Questions</span>
              <span className="font-mono text-orange-400">
                {current + 1}/{questions.length}
              </span>
            </div>

            {/* Section 1: MCQs */}
            {mcqQuestions.length > 0 && (
              <div className="mb-5">
                <div className="text-[11px] font-mono uppercase tracking-widest text-gray-500 font-semibold mb-2">
                  MCQ ({mcqQuestions.length})
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {mcqQuestions.map(item => {
                    const idx = questions.indexOf(item);
                    const isCurrent = idx === current;
                    const isAnswered = answers[item.id] !== undefined;
                    const isFlagged = flagged[item.id];
                    const isVisited = visited[idx];

                    return (
                      <button
                        key={item.id}
                        onClick={() => setCurrent(idx)}
                        className={`aspect-square rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-all cursor-pointer relative ${
                          isCurrent
                            ? 'border-2 border-orange-500 bg-orange-500/20 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.3)]'
                            : isFlagged
                            ? 'bg-orange-500 text-white'
                            : isAnswered
                            ? 'bg-green-500/20 border border-green-500/40 text-green-400'
                            : isVisited
                            ? 'bg-[#242424] border border-[#333333] text-gray-400'
                            : 'bg-[#141414] border border-[#2a2a2a] text-gray-500 hover:border-gray-500'
                        }`}
                      >
                        {idx + 1}
                        {isAnswered && !isCurrent && !isFlagged && (
                          <span className="absolute -top-1 -right-1 text-[8px]">✅</span>
                        )}
                        {isFlagged && (
                          <span className="absolute -top-1 -right-1 text-[8px]">🔖</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section 2: Coding Challenges */}
            {codingQuestions.length > 0 && (
              <div>
                <div className="text-[11px] font-mono uppercase tracking-widest text-gray-500 font-semibold mb-2">
                  Coding ({codingQuestions.length})
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {codingQuestions.map(item => {
                    const idx = questions.indexOf(item);
                    const isCurrent = idx === current;
                    const isAnswered = (code[item.id] || '').trim().length > 0 || submissions[item.id];
                    const isFlagged = flagged[item.id];
                    const isVisited = visited[idx];

                    return (
                      <button
                        key={item.id}
                        onClick={() => setCurrent(idx)}
                        className={`aspect-square rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-all cursor-pointer relative ${
                          isCurrent
                            ? 'border-2 border-orange-500 bg-orange-500/20 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.3)]'
                            : isFlagged
                            ? 'bg-orange-500 text-white'
                            : isAnswered
                            ? 'bg-green-500/20 border border-green-500/40 text-green-400'
                            : isVisited
                            ? 'bg-[#242424] border border-[#333333] text-gray-400'
                            : 'bg-[#141414] border border-[#2a2a2a] text-gray-500 hover:border-gray-500'
                        }`}
                      >
                        {idx + 1}
                        <span className="text-[7px] absolute bottom-1 right-1 opacity-60">&lt;&gt;</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Navigator Legend */}
          <div className="pt-4 border-t border-[#2a2a2a] text-[11px] font-mono text-gray-500 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-green-500/40 border border-green-500" />
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-orange-500" />
              <span>Flagged</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded border border-orange-500" />
              <span>Current</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-[#141414] border border-[#2a2a2a]" />
              <span>Unvisited</span>
            </div>
          </div>
        </aside>

        {/* ── Column 2: Center Problem Statement & Code Editor Workspace ── */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#0d0d0d]">
          {/* MCQ Question Mode */}
          {q.type === 'mcq' && (
            <div className="flex-1 p-8 overflow-y-auto max-w-3xl mx-auto w-full">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold text-orange-400 uppercase tracking-wider">
                  Q{current + 1}. Multiple Choice
                </span>
                <span className="text-xs font-mono text-gray-400">{q.marks} Marks</span>
              </div>

              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 mb-6">
                <h2 className="text-base font-medium text-white leading-relaxed whitespace-pre-wrap">
                  {q.text}
                </h2>
              </div>

              {/* Options */}
              <div className="space-y-3 mb-8">
                {q.options?.map((opt, i) => {
                  const isSelected = answers[q.id] === i;
                  return (
                    <button
                      key={i}
                      onClick={() => handleMCQ(q.id, i)}
                      className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                        isSelected
                          ? 'bg-orange-500/10 border-orange-500 text-white font-medium shadow-sm shadow-orange-500/10'
                          : 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs font-mono ${
                          isSelected
                            ? 'border-orange-500 bg-orange-500 text-black font-bold'
                            : 'border-gray-600 text-gray-500'
                        }`}
                      >
                        {isSelected ? '●' : String.fromCharCode(65 + i)}
                      </div>
                      <span className="text-sm">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Bottom Nav Action Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-[#2a2a2a]">
                <button
                  onClick={() => toggleFlag(q.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-2 ${
                    flagged[q.id]
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'border-[#2a2a2a] hover:border-orange-500/50 text-gray-400 hover:text-orange-400'
                  }`}
                >
                  <span>🔖</span>
                  <span>{flagged[q.id] ? 'Flagged' : 'Flag Question'}</span>
                </button>

                <div className="flex gap-3">
                  <button
                    onClick={() => setCurrent(c => Math.max(0, c - 1))}
                    disabled={current === 0}
                    className="px-4 py-2 border border-[#2a2a2a] disabled:opacity-40 text-gray-300 rounded-lg text-xs font-semibold hover:border-gray-600 transition-colors cursor-pointer"
                  >
                    ← Previous
                  </button>
                  {current < questions.length - 1 ? (
                    <button
                      onClick={() => setCurrent(c => c + 1)}
                      className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Next →
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmSubmit(true)}
                      className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Submit Exam ✓
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Coding Question Mode */}
          {q.type === 'code' && (
            <div className="flex-1 flex overflow-hidden">
              {/* Left Pane: Problem Statement & Test cases */}
              <div className="w-1/2 border-r border-[#2a2a2a] flex flex-col bg-[#111111]">
                <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-white">{q.title || `Problem ${current + 1}`}</h2>
                    <div className="text-[11px] font-mono text-gray-400 mt-0.5">
                      Max Score: <span className="text-orange-400 font-bold">{q.marks} Marks</span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleFlag(q.id)}
                    className={`px-2.5 py-1 rounded text-xs font-mono border transition-colors cursor-pointer ${
                      flagged[q.id]
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'border-[#2a2a2a] text-gray-400 hover:text-orange-400'
                    }`}
                  >
                    🔖 {flagged[q.id] ? 'Flagged' : 'Flag'}
                  </button>
                </div>

                <div className="flex-1 p-5 overflow-y-auto space-y-4">
                  <div className="text-xs text-gray-300 leading-relaxed font-sans whitespace-pre-wrap">
                    {q.text}
                  </div>

                  {/* Sample Test Cases */}
                  {sampleTestCases.length > 0 && (
                    <div className="pt-4 border-t border-[#2a2a2a]">
                      <h4 className="text-xs font-mono uppercase tracking-widest text-gray-400 font-semibold mb-3">
                        Test Cases
                      </h4>
                      <div className="space-y-3">
                        {sampleTestCases.map((tc, idx) => (
                          <div key={tc.id || idx} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 text-xs font-mono">
                            <div className="text-orange-400 font-bold text-[11px] mb-2">Sample {idx + 1}</div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <div className="text-[10px] text-gray-500 uppercase mb-1">Input</div>
                                <pre className="bg-[#141414] p-2 rounded text-gray-300 overflow-x-auto">
                                  {tc.input?.trim() || '(No input)'}
                                </pre>
                              </div>
                              <div>
                                <div className="text-[10px] text-gray-500 uppercase mb-1">Expected Output</div>
                                <pre className="bg-[#141414] p-2 rounded text-green-400 overflow-x-auto">
                                  {tc.expected}
                                </pre>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Nav for Coding */}
                <div className="p-3 border-t border-[#2a2a2a] flex items-center justify-between bg-[#111111]">
                  <button
                    onClick={() => setCurrent(c => Math.max(0, c - 1))}
                    disabled={current === 0}
                    className="px-3 py-1.5 border border-[#2a2a2a] disabled:opacity-40 text-gray-300 rounded text-xs font-semibold hover:border-gray-600 transition-colors cursor-pointer"
                  >
                    ← Prev
                  </button>
                  {current < questions.length - 1 ? (
                    <button
                      onClick={() => setCurrent(c => c + 1)}
                      className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Next →
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmSubmit(true)}
                      className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Submit Exam ✓
                    </button>
                  )}
                </div>
              </div>

              {/* Right Pane: Code Editor + Runner */}
              <div className="w-1/2 flex flex-col bg-[#0d0d0d]">
                {/* Editor Header */}
                <div className="h-10 bg-[#111111] border-b border-[#2a2a2a] px-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <select
                      value={currentLang}
                      onChange={e => handleLangChange(q.id, e.target.value)}
                      className="bg-[#1a1a1a] border border-[#2a2a2a] text-white text-xs font-mono rounded px-2.5 py-1 outline-none cursor-pointer"
                    >
                      {SUPPORTED_LANGUAGES.map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>

                    <button
                      onClick={handleResetCode}
                      className="text-[11px] font-mono text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-[#2a2a2a] transition-colors"
                    >
                      ↺ Reset
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRunCode}
                      disabled={isRunning}
                      className="bg-[#1a1a1a] border border-[#2a2a2a] hover:border-orange-500 text-orange-400 text-xs font-mono font-semibold px-3 py-1 rounded transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>{isRunning ? 'Running...' : 'Run ▶'}</span>
                    </button>
                    <button
                      onClick={handleSubmitCode}
                      disabled={isSubmittingCode}
                      className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-mono font-semibold px-3 py-1 rounded transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>{isSubmittingCode ? 'Evaluating...' : 'Submit ⚡'}</span>
                    </button>
                  </div>
                </div>

                {/* Monaco / Monospace Textarea */}
                <div className="flex-1 relative bg-[#141414]">
                  <textarea
                    value={currentCode}
                    onChange={e => handleCodeChange(q.id, e.target.value)}
                    onKeyDown={handleCodeKeyDown}
                    spellCheck={false}
                    className="w-full h-full bg-[#141414] text-gray-200 font-mono text-xs p-4 outline-none resize-none leading-relaxed selection:bg-orange-500/30"
                    placeholder={`// Write your ${currentLang} solution here...`}
                  />
                </div>

                {/* Bottom Test Case Execution Drawer */}
                <div className="h-44 border-t border-[#2a2a2a] bg-[#111111] flex flex-col">
                  <div className="px-4 py-2 border-b border-[#2a2a2a] flex items-center gap-2 text-xs font-mono">
                    <button
                      onClick={() => setActiveTab('testcases')}
                      className={`px-2.5 py-1 rounded ${
                        activeTab === 'testcases'
                          ? 'bg-orange-500/10 text-orange-400 font-bold border border-orange-500/20'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Sample Tests
                    </button>
                    <button
                      onClick={() => setActiveTab('result')}
                      className={`px-2.5 py-1 rounded ${
                        activeTab === 'result'
                          ? 'bg-orange-500/10 text-orange-400 font-bold border border-orange-500/20'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Execution Output
                    </button>
                  </div>

                  <div className="flex-1 p-3 overflow-y-auto text-xs font-mono">
                    {activeTab === 'testcases' && (
                      <div className="flex gap-2">
                        {sampleTestCases.map((tc, idx) => (
                          <div key={idx} className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded p-2 text-[11px]">
                            <div className="text-gray-400 font-bold mb-1">Sample {idx + 1}</div>
                            <div className="text-gray-500 text-[10px]">Expected: <span className="text-green-400">{tc.expected}</span></div>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeTab === 'result' && runResult && (
                      <div>
                        {runResult.type === 'sample' && (
                          <div className="space-y-1.5">
                            {runResult.results.map((res, i) => (
                              <div
                                key={i}
                                className={`p-2 rounded border flex items-center justify-between ${
                                  res.passed
                                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                                }`}
                              >
                                <span>Sample {i + 1}: {res.passed ? '✅ Passed' : '❌ Wrong Output'}</span>
                                <span className="text-[10px] opacity-80">Got: {res.output || '(empty)'}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {runResult.type === 'submit' && (
                          <div className="p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded">
                            <div className="font-bold text-sm text-white mb-1">
                              Score: {runResult.data.passedCount} / {runResult.data.totalCount} Test Cases Passed
                            </div>
                            <div className="text-[11px] text-gray-400">
                              Awarded Marks: <span className="text-orange-400 font-bold">+{Math.round(q.marks * runResult.data.scoreRatio)}</span> / {q.marks}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'result' && !runResult && (
                      <div className="text-gray-500 text-center py-4">Click "Run ▶" or "Submit ⚡" to evaluate code.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* ── Column 3: Right Test Summary (code.zone style) ── */}
        <aside className="w-56 bg-[#111111] border-l border-[#2a2a2a] p-4 flex flex-col justify-between flex-shrink-0">
          <div>
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">
              Test Summary
            </h3>

            {/* Summary Metrics */}
            <div className="space-y-4 text-xs font-mono">
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3">
                <div className="text-gray-400 font-bold mb-2 text-[11px] uppercase tracking-wider">MCQ ({mcqQuestions.length})</div>
                <div className="space-y-1.5 text-gray-400 text-[11px]">
                  <div className="flex justify-between">
                    <span>Answered:</span>
                    <span className="text-green-400 font-bold">{mcqAnsweredCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Flagged:</span>
                    <span className="text-orange-400 font-bold">{mcqFlaggedCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Skipped:</span>
                    <span className="text-gray-500 font-bold">{mcqSkippedCount}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3">
                <div className="text-gray-400 font-bold mb-2 text-[11px] uppercase tracking-wider">Coding ({codingQuestions.length})</div>
                <div className="space-y-1.5 text-gray-400 text-[11px]">
                  <div className="flex justify-between">
                    <span>Attempted:</span>
                    <span className="text-green-400 font-bold">{codingAttemptedCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining:</span>
                    <span className="text-gray-500 font-bold">{codingQuestions.length - codingAttemptedCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setConfirmSubmit(true)}
            className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold text-xs py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-orange-500/20 text-center"
          >
            Submit Test
          </button>
        </aside>
      </div>

      {/* ── Confirm Submit Modal ── */}
      {confirmSubmit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Submit Examination?</h3>
            <p className="text-xs text-gray-400 mb-5 leading-relaxed font-mono">
              Are you sure you want to end the test? You cannot make any further changes once submitted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmSubmit(false)}
                className="flex-1 py-2.5 border border-[#2a2a2a] hover:border-gray-600 text-gray-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Continue Test
              </button>
              <button
                onClick={() => handleSubmit(false)}
                className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-lg shadow-orange-500/20"
              >
                Yes, Submit ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
