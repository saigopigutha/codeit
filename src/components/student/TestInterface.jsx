import React, { useState, useEffect, useRef } from 'react';
import { SUPPORTED_LANGUAGES, STARTER_TEMPLATES } from '../../utils/codeTemplates.js';
import { runTestCase, runAllTestCases } from '../../utils/codeRunner.js';

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
    setRefreshCount(initialRefreshes); // 0 on first open, 1+ on subsequent refreshes
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

  // Auto-Save progress to LocalStorage
  useEffect(() => {
    const dataToSave = {
      timeLeft,
      current,
      answers,
      code,
      lang,
      submissions,
      warnings,
      savedAt: Date.now()
    };
    try {
      localStorage.setItem(contestKey, JSON.stringify(dataToSave));
    } catch (e) {}
  }, [timeLeft, current, answers, code, lang, submissions, warnings]);

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

  // 🛡️ PROCTORING: Track Tab Switch / Window Blur
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setWarnings(w => {
          const next = w + 1;
          setProctorAlert(`⚠️ Warning ${next}: Tab switch / window minimization detected! All events are logged for proctoring.`);
          return next;
        });
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
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
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };
  const timerColor = timeLeft < 300 ? '#ef4444' : timeLeft < 600 ? '#f59e0b' : '#22c55e';

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

  // Handle Tab key inside code editor (inserts 4 spaces instead of blurring)
  const handleCodeKeyDown = (e) => {
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
      localStorage.removeItem(contestKey); // Clear session after completion
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

  const answeredCount =
    Object.keys(answers).length +
    Object.keys(code).filter(k => (code[k] || '').trim().length > 0).length;

  if (!q) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#64748b' }}>No questions available.</div>;

  const sampleTestCases = (q.testCases || []).filter(tc => !tc.isHidden);
  const qSubmission = submissions[q.id];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f172a', overflow: 'hidden' }}>
      {/* Top Navbar */}
      <header style={{ background: '#111827', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0.65rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f1f5f9' }}>{contest?.name}</div>
            <div style={{ color: '#64748b', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>ISTE Proctored</span>
              {warnings > 0 && <span style={{ color: '#f87171', fontWeight: 700 }}>· ⚠️ {warnings} Tab Switches</span>}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: isFullscreen ? '#86efac' : '#94a3b8',
              padding: '0.35rem 0.75rem',
              cursor: 'pointer',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            {isFullscreen ? '⛶ Fullscreen ON' : '⛶ Fullscreen'}
          </button>

          <div style={{ textAlign: 'right' }}>
            <span style={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 600 }}>{student?.name}</span>
            <span style={{ color: '#64748b', fontSize: '0.75rem', marginLeft: '0.5rem' }}>({student?.jntuNo})</span>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${timerColor}40`, borderRadius: '10px', padding: '0.35rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ color: timerColor, fontSize: '0.75rem' }}>⏱</span>
            <span style={{ color: timerColor, fontWeight: 700, fontSize: '0.95rem', fontVariantNumeric: 'tabular-nums' }}>{fmt(timeLeft)}</span>
          </div>

          <button onClick={() => setConfirmSubmit(true)} style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '10px', color: '#fff', padding: '0.5rem 1.15rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}>
            Submit Test ✓
          </button>
        </div>
      </header>

      {/* Proctoring Warning Banner */}
      {proctorAlert && (
        <div style={{ background: 'rgba(239,68,68,0.2)', borderBottom: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', padding: '0.5rem 1.5rem', fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{proctorAlert}</span>
          <button onClick={() => setProctorAlert(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* Main Workspace */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Navigator */}
        <aside style={{ width: '220px', flexShrink: 0, background: '#111827', borderRight: '1px solid rgba(255,255,255,0.07)', padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Questions</span>
            <span style={{ color: '#818cf8', fontSize: '0.75rem', fontWeight: 600 }}>{answeredCount}/{questions.length}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.4rem' }}>
            {questions.map((qItem, idx) => {
              const isMcqDone = qItem.type === 'mcq' && answers[qItem.id] !== undefined;
              const isCodeDone = qItem.type === 'code' && (code[qItem.id]?.trim().length > 0 || submissions[qItem.id]);
              const done = isMcqDone || isCodeDone;
              const isSelected = idx === current;
              const sub = submissions[qItem.id];

              return (
                <button
                  key={qItem.id}
                  onClick={() => { setCurrent(idx); setRunResult(null); setActiveTab('testcases'); }}
                  style={{
                    aspectRatio: '1',
                    borderRadius: '8px',
                    border: `1px solid ${isSelected ? '#6366f1' : sub?.allPassed ? '#22c55e' : done ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`,
                    background: isSelected ? 'rgba(99,102,241,0.25)' : sub?.allPassed ? 'rgba(34,197,94,0.15)' : done ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)',
                    color: isSelected ? '#a5b4fc' : sub?.allPassed ? '#86efac' : done ? '#93c5fd' : '#64748b',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  {idx + 1}
                  {qItem.type === 'code' && <span style={{ position: 'absolute', bottom: '2px', right: '3px', fontSize: '0.55rem', opacity: 0.7 }}>&lt;&gt;</span>}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem', fontSize: '0.7rem', color: '#475569', lineHeight: 1.7 }}>
            <div><span style={{ color: '#86efac' }}>■</span> All Passed (100%)</div>
            <div><span style={{ color: '#93c5fd' }}>■</span> Attempted</div>
            <div><span style={{ color: '#a5b4fc' }}>■</span> Active Question</div>
            <div><span style={{ color: '#475569' }}>■</span> Unanswered</div>
          </div>
        </aside>

        {/* Question Area & Editor */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* MCQ Question Mode */}
          {q.type === 'mcq' && (
            <div style={{ flex: 1, padding: '2.5rem', overflowY: 'auto' }}>
              <div style={{ maxWidth: '780px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <span style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', padding: '0.25rem 0.7rem', fontSize: '0.78rem', fontWeight: 700 }}>Question {current + 1} of {questions.length}</span>
                  <span style={{ background: 'rgba(34,197,94,0.12)', color: '#86efac', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', padding: '0.25rem 0.7rem', fontSize: '0.78rem', fontWeight: 600 }}>Multiple Choice</span>
                  <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: '0.85rem' }}>{q.marks} Marks</span>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '1.75rem', marginBottom: '1.5rem' }}>
                  <p style={{ fontSize: '1.05rem', lineHeight: 1.6, color: '#f1f5f9', whiteSpace: 'pre-wrap' }}>{q.text}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {q.options.map((opt, i) => {
                    const isSelected = answers[q.id] === i;
                    return (
                      <button
                        key={i}
                        onClick={() => handleMCQ(q.id, i)}
                        style={{
                          textAlign: 'left',
                          padding: '1rem 1.25rem',
                          background: isSelected ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isSelected ? '#6366f1' : 'rgba(255,255,255,0.08)'}`,
                          borderRadius: '12px',
                          color: isSelected ? '#c7d2fe' : '#e2e8f0',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: isSelected ? 600 : 400,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.85rem',
                          transition: 'all 0.15s'
                        }}
                      >
                        <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: isSelected ? '#6366f1' : 'rgba(255,255,255,0.06)', border: `1px solid ${isSelected ? '#6366f1' : 'rgba(255,255,255,0.12)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: isSelected ? '#fff' : '#64748b' }}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem' }}>
                  <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0} style={{ padding: '0.65rem 1.4rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: current === 0 ? '#334155' : '#94a3b8', cursor: current === 0 ? 'not-allowed' : 'pointer', fontWeight: 600 }}>← Previous</button>
                  {current < questions.length - 1 ? (
                    <button onClick={() => setCurrent(c => c + 1)} style={{ padding: '0.65rem 1.4rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '10px', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Next Question →</button>
                  ) : (
                    <button onClick={() => setConfirmSubmit(true)} style={{ padding: '0.65rem 1.4rem', background: 'linear-gradient(135deg,#22c55e,#16a34a)', border: 'none', borderRadius: '10px', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Submit Test ✓</button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Coding Question Mode — Split Pane */}
          {q.type === 'code' && (
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              {/* Left Column: Problem Description & Test Cases */}
              <div style={{ width: '45%', borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', background: '#0b1120' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
                      {q.title || `Problem ${current + 1}`}
                    </h2>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                      Max Score: <strong style={{ color: '#818cf8' }}>{q.marks} Marks</strong> · {q.testCases?.length || 0} Test Cases
                    </div>
                  </div>
                  {qSubmission && (
                    <div style={{ background: qSubmission.allPassed ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)', border: `1px solid ${qSubmission.allPassed ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`, borderRadius: '12px', padding: '0.3rem 0.75rem', textAlign: 'right' }}>
                      <div style={{ color: qSubmission.allPassed ? '#86efac' : '#fcd34d', fontWeight: 700, fontSize: '0.78rem' }}>
                        {qSubmission.passedCount}/{qSubmission.totalCount} Passed
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.68rem' }}>
                        +{Math.round(q.marks * qSubmission.scoreRatio)} marks
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
                  <div style={{ color: '#cbd5e1', fontSize: '0.88rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                    {q.text}
                  </div>

                  {sampleTestCases.length > 0 && (
                    <div style={{ marginTop: '2rem' }}>
                      <h4 style={{ color: '#94a3b8', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem', fontWeight: 700 }}>
                        Sample Test Cases
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {sampleTestCases.map((tc, idx) => (
                          <div key={tc.id || idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '0.85rem 1rem' }}>
                            <div style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 700, marginBottom: '0.4rem' }}>
                              Sample #{idx + 1}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                              <div>
                                <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Input</div>
                                <pre style={{ background: '#020617', padding: '0.5rem', borderRadius: '6px', fontSize: '0.78rem', color: tc.input?.trim() ? '#e2e8f0' : '#475569', fontStyle: tc.input?.trim() ? 'normal' : 'italic', margin: 0, whiteSpace: 'pre-wrap' }}>{tc.input?.trim() || '(No Input)'}</pre>
                              </div>
                              <div>
                                <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Expected Output</div>
                                <pre style={{ background: '#020617', padding: '0.5rem', borderRadius: '6px', fontSize: '0.78rem', color: '#86efac', margin: 0, whiteSpace: 'pre-wrap' }}>{tc.expected}</pre>
                              </div>
                            </div>
                            {tc.explanation && (
                              <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                💡 {tc.explanation}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ padding: '0.85rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', background: '#111827' }}>
                  <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0} style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: current === 0 ? '#334155' : '#94a3b8', cursor: current === 0 ? 'not-allowed' : 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>← Prev</button>
                  {current < questions.length - 1 ? (
                    <button onClick={() => setCurrent(c => c + 1)} style={{ padding: '0.5rem 1rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700 }}>Next →</button>
                  ) : (
                    <button onClick={() => setConfirmSubmit(true)} style={{ padding: '0.5rem 1rem', background: 'linear-gradient(135deg,#22c55e,#16a34a)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700 }}>Finish Test</button>
                  )}
                </div>
              </div>

              {/* Right Column: Code Editor & Live Runner */}
              <div style={{ width: '55%', display: 'flex', flexDirection: 'column', background: '#0a0e1a' }}>
                <div style={{ padding: '0.65rem 1.25rem', background: '#111827', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>Language:</span>
                    <select
                      value={currentLang}
                      onChange={e => handleLangChange(q.id, e.target.value)}
                      style={{ background: '#1e293b', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', padding: '0.35rem 0.85rem', color: '#f1f5f9', fontSize: '0.82rem', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
                    >
                      {SUPPORTED_LANGUAGES.map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={handleResetCode} title="Reset to starter template" style={{ padding: '0.35rem 0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer' }}>
                      ↺ Reset Template
                    </button>
                  </div>
                </div>

                <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', minHeight: '260px' }}>
                  <textarea
                    value={currentCode}
                    onChange={e => handleCodeChange(q.id, e.target.value)}
                    onKeyDown={handleCodeKeyDown}
                    spellCheck={false}
                    placeholder={`// Write your ${currentLang} solution here...`}
                    style={{
                      flex: 1,
                      width: '100%',
                      background: '#0d1117',
                      border: 'none',
                      padding: '1rem 1.25rem',
                      color: '#e6edf3',
                      fontSize: '0.88rem',
                      fontFamily: '"JetBrains Mono", Consolas, "Courier New", monospace',
                      lineHeight: 1.7,
                      outline: 'none',
                      resize: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Runner Panel */}
                <div style={{ height: '240px', borderTop: '1px solid rgba(255,255,255,0.08)', background: '#111827', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 1rem', background: '#0b1120', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => setActiveTab('testcases')}
                        style={{
                          padding: '0.35rem 0.85rem',
                          borderRadius: '6px',
                          border: 'none',
                          background: activeTab === 'testcases' ? 'rgba(99,102,241,0.2)' : 'transparent',
                          color: activeTab === 'testcases' ? '#818cf8' : '#64748b',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Sample Test Cases
                      </button>
                      <button
                        onClick={() => setActiveTab('custom')}
                        style={{
                          padding: '0.35rem 0.85rem',
                          borderRadius: '6px',
                          border: 'none',
                          background: activeTab === 'custom' ? 'rgba(99,102,241,0.2)' : 'transparent',
                          color: activeTab === 'custom' ? '#818cf8' : '#64748b',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Custom Input
                      </button>
                      {runResult && (
                        <button
                          onClick={() => setActiveTab('result')}
                          style={{
                            padding: '0.35rem 0.85rem',
                            borderRadius: '6px',
                            border: 'none',
                            background: activeTab === 'result' ? 'rgba(34,197,94,0.2)' : 'transparent',
                            color: activeTab === 'result' ? '#86efac' : '#64748b',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Execution Results {runResult.type === 'submit' && `(${runResult.data.passedCount}/${runResult.data.totalCount})`}
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <button
                        onClick={handleRunCode}
                        disabled={isRunning || isSubmittingCode}
                        style={{
                          padding: '0.45rem 1.1rem',
                          background: isRunning ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.15)',
                          border: '1px solid rgba(99,102,241,0.3)',
                          borderRadius: '8px',
                          color: '#c7d2fe',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: isRunning ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {isRunning ? '⏳ Running...' : '▶ Run Code'}
                      </button>

                      <button
                        onClick={handleSubmitCode}
                        disabled={isRunning || isSubmittingCode}
                        style={{
                          padding: '0.45rem 1.25rem',
                          background: isSubmittingCode ? '#15803d' : 'linear-gradient(135deg,#22c55e,#16a34a)',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: isSubmittingCode ? 'not-allowed' : 'pointer',
                          boxShadow: '0 2px 10px rgba(34,197,94,0.3)'
                        }}
                      >
                        {isSubmittingCode ? '⏳ Evaluating...' : '⚡ Submit Code'}
                      </button>
                    </div>
                  </div>

                  <div style={{ flex: 1, padding: '0.85rem 1.25rem', overflowY: 'auto' }}>
                    {activeTab === 'testcases' && (
                      <div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          {sampleTestCases.map((tc, idx) => (
                            <button
                              key={tc.id || idx}
                              onClick={() => setSelectedTestCaseIdx(idx)}
                              style={{
                                padding: '0.3rem 0.75rem',
                                borderRadius: '6px',
                                border: `1px solid ${selectedTestCaseIdx === idx ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                                background: selectedTestCaseIdx === idx ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
                                color: selectedTestCaseIdx === idx ? '#c7d2fe' : '#94a3b8',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Case #{idx + 1}
                            </button>
                          ))}
                        </div>

                        {sampleTestCases[selectedTestCaseIdx] && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Input</div>
                              <pre style={{ background: '#020617', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.78rem', color: sampleTestCases[selectedTestCaseIdx].input?.trim() ? '#e2e8f0' : '#475569', fontStyle: sampleTestCases[selectedTestCaseIdx].input?.trim() ? 'normal' : 'italic', margin: 0, whiteSpace: 'pre-wrap', maxHeight: '90px', overflowY: 'auto' }}>
                                {sampleTestCases[selectedTestCaseIdx].input?.trim() || '(No Input)'}
                              </pre>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Expected Output</div>
                              <pre style={{ background: '#020617', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.78rem', color: '#86efac', margin: 0, whiteSpace: 'pre-wrap', maxHeight: '90px', overflowY: 'auto' }}>
                                {sampleTestCases[selectedTestCaseIdx].expected}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'custom' && (
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Provide custom standard input for your program:</div>
                        <textarea
                          rows={4}
                          value={customInput}
                          onChange={e => setCustomInput(e.target.value)}
                          placeholder="e.g. 5&#10;1 2 3 4 5"
                          style={{
                            width: '100%',
                            background: '#020617',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            padding: '0.5rem 0.75rem',
                            color: '#f1f5f9',
                            fontSize: '0.8rem',
                            fontFamily: 'monospace',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    )}

                    {activeTab === 'result' && runResult && (
                      <div>
                        {runResult.type === 'sample' && (
                          <div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                              {runResult.results.map((res, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    padding: '0.25rem 0.65rem',
                                    borderRadius: '6px',
                                    background: res.passed ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                                    color: res.passed ? '#86efac' : '#f87171',
                                    border: `1px solid ${res.passed ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.3rem'
                                  }}
                                >
                                  {res.passed ? '✓' : '✗'} Case #{idx + 1}
                                </span>
                              ))}
                            </div>

                            {runResult.results.map((res, idx) => (
                              <div key={idx} style={{ background: '#020617', borderRadius: '8px', padding: '0.65rem 0.85rem', marginBottom: '0.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', marginBottom: '0.3rem' }}>
                                  <span>Test Case #{idx + 1}</span>
                                  <span>{res.durationMs}ms</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
                                  <div>
                                    <span style={{ color: '#64748b' }}>Your Output:</span>
                                    <pre style={{ margin: '0.2rem 0 0', color: res.passed ? '#86efac' : '#f87171', whiteSpace: 'pre-wrap' }}>{res.actualOutput || '(no output)'}</pre>
                                  </div>
                                  <div>
                                    <span style={{ color: '#64748b' }}>Expected Output:</span>
                                    <pre style={{ margin: '0.2rem 0 0', color: '#86efac', whiteSpace: 'pre-wrap' }}>{res.expectedOutput}</pre>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {runResult.type === 'custom' && (
                          <div style={{ background: '#020617', borderRadius: '8px', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: 700, marginBottom: '0.3rem' }}>
                              Custom Execution Output ({runResult.data.durationMs}ms):
                            </div>
                            <pre style={{ margin: 0, color: '#e2e8f0', fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
                              {runResult.data.actualOutput || '(no output generated)'}
                            </pre>
                            {runResult.data.error && (
                              <div style={{ marginTop: '0.5rem', color: '#f87171', fontSize: '0.75rem' }}>
                                ⚠️ {runResult.data.error}
                              </div>
                            )}
                          </div>
                        )}

                        {runResult.type === 'submit' && (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', padding: '0.5rem 0.75rem', background: runResult.data.allPassed ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)', borderRadius: '8px', border: `1px solid ${runResult.data.allPassed ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
                              <div>
                                <span style={{ fontWeight: 800, fontSize: '0.88rem', color: runResult.data.allPassed ? '#86efac' : '#fcd34d' }}>
                                  {runResult.data.allPassed ? '🎉 All Test Cases Passed!' : `⚠️ Passed ${runResult.data.passedCount} of ${runResult.data.totalCount} Test Cases`}
                                </span>
                                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                  Score Earned: {Math.round(q.marks * runResult.data.scoreRatio)} / {q.marks} Marks
                                </div>
                              </div>
                              <span style={{ fontSize: '1.25rem' }}>{runResult.data.allPassed ? '✅' : '⚡'}</span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.5rem' }}>
                              {runResult.data.results.map((r, i) => (
                                <div
                                  key={i}
                                  style={{
                                    background: '#020617',
                                    borderRadius: '6px',
                                    padding: '0.45rem 0.6rem',
                                    border: `1px solid ${r.passed ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                  }}
                                >
                                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                    {r.isHidden ? '🔒 Case ' : 'Test '}#{i + 1}
                                  </span>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: r.passed ? '#86efac' : '#f87171' }}>
                                    {r.passed ? 'Passed' : 'Failed'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Submit Dialog */}
      {confirmSubmit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '22px', padding: '2.25rem', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '2.75rem', marginBottom: '0.75rem' }}>📝</div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', color: '#f1f5f9' }}>Submit Examination?</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: '0.4rem' }}>
              You have answered <strong>{answeredCount}</strong> of <strong>{questions.length}</strong> questions.
            </p>
            {warnings > 0 && (
              <p style={{ color: '#f87171', fontSize: '0.78rem', marginBottom: '0.5rem' }}>
                ⚠️ {warnings} proctoring violations (tab switches) will be included in the report.
              </p>
            )}
            <p style={{ color: '#475569', fontSize: '0.78rem', marginBottom: '1.75rem' }}>
              All code submissions and MCQ answers will be finalized.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setConfirmSubmit(false)} style={{ flex: 1, padding: '0.85rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#94a3b8', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={() => handleSubmit(false)} style={{ flex: 1, padding: '0.85rem', background: 'linear-gradient(135deg,#22c55e,#16a34a)', border: 'none', borderRadius: '12px', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Confirm Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
