import React from 'react';

export default function ResultsPage({ student, contest, result, onBack }) {
  if (!result) return null;
  const pct = Math.round((result.score / result.total) * 100);
  const grade = pct >= 90 ? 'A+' : pct >= 75 ? 'A' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : 'F';
  const gradeColor = pct >= 75 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
  const fmt = s => { const m = Math.floor(s / 60); const sec = s % 60; return `${m}m ${String(sec).padStart(2, '0')}s`; };

  const stats = [
    { label: 'Total Score', value: `${result.score} / ${result.total}`, color: '#818cf8' },
    { label: 'Percentage', value: `${pct}%`, color: gradeColor },
    { label: 'Grade', value: grade, color: gradeColor },
    { label: 'Time Taken', value: fmt(result.timeTaken), color: '#94a3b8' },
  ];

  const questions = contest?.questions || [];
  const mcqs = questions.filter(q => q.type === 'mcq');
  const codeQuestions = questions.filter(q => q.type === 'code');

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)' }}>
      <header style={{ background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0.9rem 2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
        </div>
        <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>CodeIT</span>
        <span style={{ color: '#475569', marginLeft: '0.5rem' }}>/ Examination Results</span>
      </header>

      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {/* Score Card */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '2.5rem', marginBottom: '2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-50px', left: '50%', transform: 'translateX(-50%)', width: '200px', height: '200px', background: `radial-gradient(circle,${gradeColor}15 0%,transparent 70%)`, borderRadius: '50%', pointerEvents: 'none' }} />
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Proctored Assessment Completed</div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.4rem' }}>{contest?.name}</h1>
          <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>{student?.name} · {student?.jntuNo} · {student?.branch}</p>

          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '120px', height: '120px', borderRadius: '50%', border: `4px solid ${gradeColor}`, background: `${gradeColor}15`, marginBottom: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: gradeColor, lineHeight: 1 }}>{grade}</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>{pct}%</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            {stats.map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Coding Questions Breakdown */}
        {codeQuestions.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '1.75rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', color: '#fcd34d', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              💻 Coding Problems Evaluation (HackerRank Test Cases)
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {codeQuestions.map((q, idx) => {
                const sub = result.submissions?.[q.id];
                const scoreInfo = result.codingScores?.[q.id] || { score: 0, maxMarks: q.marks, lang: 'python' };
                const userCode = result.code?.[q.id] || '';
                const passRatio = sub ? `${sub.passedCount}/${sub.totalCount} Test Cases Passed` : (userCode.trim().length > 15 ? 'Auto-Evaluated' : 'Not Attempted');

                return (
                  <div key={q.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#e2e8f0' }}>Problem {idx + 1}: {q.title || 'Coding Problem'}</span>
                        <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                          Language: <strong style={{ color: '#818cf8', textTransform: 'capitalize' }}>{scoreInfo.lang || 'Python'}</strong> · {passRatio}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: scoreInfo.score > 0 ? '#86efac' : '#f87171' }}>
                        +{scoreInfo.score} / {q.marks} Marks
                      </span>
                    </div>

                    {userCode && (
                      <details style={{ marginTop: '0.75rem' }}>
                        <summary style={{ color: '#94a3b8', fontSize: '0.78rem', cursor: 'pointer', outline: 'none' }}>
                          View Submitted Code ({userCode.split('\n').length} lines)
                        </summary>
                        <pre style={{ background: '#020617', padding: '0.85rem', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.8rem', fontFamily: 'monospace', marginTop: '0.5rem', maxHeight: '160px', overflowY: 'auto' }}>
                          {userCode}
                        </pre>
                      </details>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MCQ Breakdown */}
        {mcqs.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '1.75rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', color: '#86efac' }}>📝 Multiple Choice Breakdown</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {mcqs.map((q, i) => {
                const userAns = result.answers?.[q.id];
                const correct = userAns === q.correct;
                const notAnswered = userAns === undefined;
                return (
                  <div key={q.id} style={{ background: correct ? 'rgba(34,197,94,0.06)' : notAnswered ? 'rgba(100,116,139,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${correct ? 'rgba(34,197,94,0.2)' : notAnswered ? 'rgba(100,116,139,0.15)' : 'rgba(239,68,68,0.2)'}`, borderRadius: '12px', padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.82rem', fontWeight: 600 }}>Q{i + 1}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: correct ? '#86efac' : notAnswered ? '#64748b' : '#f87171' }}>{correct ? `+${q.marks}` : notAnswered ? '—' : '0'}</span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: '#e2e8f0', marginBottom: '0.5rem' }}>{q.text}</p>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {notAnswered ? <span style={{ color: '#64748b' }}>Not attempted</span> : (
                        <>
                          <span>Your answer: <strong style={{ color: correct ? '#86efac' : '#f87171' }}>{q.options[userAns]}</strong></span>
                          {!correct && <span style={{ marginLeft: '1rem' }}>Correct: <strong style={{ color: '#86efac' }}>{q.options[q.correct]}</strong></span>}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {result.auto && <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', padding: '0.875rem 1.25rem', color: '#fcd34d', fontSize: '0.875rem', marginBottom: '1.5rem' }}>⚠️ Test was auto-submitted when the timer expired.</div>}

        <button onClick={onBack} style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '14px', color: '#fff', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 28px rgba(99,102,241,0.3)' }}>← Back to Contest List</button>
      </main>
    </div>
  );
}
