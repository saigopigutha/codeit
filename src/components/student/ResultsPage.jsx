import React from 'react';
import Logo from '../ui/Logo';

export default function ResultsPage({ student, contest, result, onBack }) {
  if (!result) return null;
  const pct = Math.round((result.score / result.total) * 100);
  const grade = pct >= 90 ? 'A+' : pct >= 75 ? 'A' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : 'F';
  const gradeColor = pct >= 75 ? '#22c55e' : pct >= 50 ? '#f97316' : '#ef4444';
  const fmt = s => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${String(sec).padStart(2, '0')}s`;
  };

  const now = new Date();
  const submissionTime =
    result.submittedAt ||
    now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' at ' +
      now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const refreshes = result.refreshCount || 0;
  const tabWarnings = result.warnings || 0;

  const stats = [
    { label: 'Total Score', value: `${result.score} / ${result.total}`, color: '#f1f1f1' },
    { label: 'Percentage', value: `${pct}%`, color: gradeColor },
    { label: 'Grade', value: grade, color: gradeColor },
    { label: 'Time Taken', value: fmt(result.timeTaken || 0), color: '#f97316' },
  ];

  const questions = contest?.questions || [];
  const mcqs = questions.filter(q => q.type === 'mcq');
  const codeQuestions = questions.filter(q => q.type === 'code');

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#f1f1f1] flex flex-col">
      <header className="h-14 bg-[#111111] border-b border-[#2a2a2a] px-8 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <span className="text-xs font-mono text-gray-500">/ Results &amp; Proctoring Audit</span>
        </div>

        <button
          onClick={onBack}
          className="text-xs font-semibold text-gray-400 hover:text-white px-3 py-1.5 rounded-lg border border-[#2a2a2a] hover:border-gray-600 transition-colors cursor-pointer"
        >
          ← Contests
        </button>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-8 space-y-6">
        {/* Top Executive Score Banner */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8 text-center relative overflow-hidden shadow-2xl">
          <div className="text-xs font-mono uppercase tracking-widest text-orange-400 font-semibold mb-2">
            Assessment Completed
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">{contest?.name}</h1>
          <p className="text-xs font-mono text-gray-400 mb-6">
            {student?.name} · {student?.jntuNo} · {student?.branch}
          </p>

          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-orange-500 bg-orange-500/10 mb-6">
            <div>
              <div className="text-3xl font-extrabold text-white font-mono">{grade}</div>
              <div className="text-[11px] font-mono text-orange-400">{pct}%</div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-[#2a2a2a] max-w-2xl mx-auto">
            {stats.map(s => (
              <div key={s.label} className="bg-[#111111] border border-[#2a2a2a] p-3 rounded-xl">
                <div className="text-lg font-bold font-mono" style={{ color: s.color }}>
                  {s.value}
                </div>
                <div className="text-[10px] font-mono text-gray-500 uppercase mt-0.5 tracking-wider">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Proctoring Audit Log */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4 font-mono">
            <span>🛡️</span> Proctoring &amp; Submission Audit Log
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-[#111111] border border-[#2a2a2a] p-3.5 rounded-xl">
              <div className="text-[10px] text-gray-500 uppercase">🕒 Submitted At</div>
              <div className="font-bold text-white text-[11px] mt-1">{submissionTime}</div>
            </div>

            <div className="bg-[#111111] border border-[#2a2a2a] p-3.5 rounded-xl">
              <div className="text-[10px] text-gray-500 uppercase">🔄 Page Refreshes</div>
              <div className={`font-bold text-sm mt-1 ${refreshes > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                {refreshes} {refreshes === 1 ? 'Time' : 'Times'}
              </div>
            </div>

            <div className="bg-[#111111] border border-[#2a2a2a] p-3.5 rounded-xl">
              <div className="text-[10px] text-gray-500 uppercase">⚠️ Tab Switches</div>
              <div className={`font-bold text-sm mt-1 ${tabWarnings > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {tabWarnings} {tabWarnings === 1 ? 'Warning' : 'Warnings'}
              </div>
            </div>

            <div className="bg-[#111111] border border-[#2a2a2a] p-3.5 rounded-xl">
              <div className="text-[10px] text-gray-500 uppercase">🔒 Session Integrity</div>
              <div className="font-bold text-[11px] mt-1 text-green-400">
                {refreshes === 0 && tabWarnings === 0 ? '● Clean Attempt' : '⚠️ Logged for Faculty'}
              </div>
            </div>
          </div>
        </div>

        {/* Coding Problems Evaluation */}
        {codeQuestions.length > 0 && (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4 font-mono">
              <span>💻</span> Coding Challenge Test Case Results
            </h2>

            <div className="space-y-3">
              {codeQuestions.map((q, idx) => {
                const sub = result.submissions?.[q.id];
                const scoreInfo = result.codingScores?.[q.id] || { score: 0, maxMarks: q.marks, lang: 'python' };
                const userCode = result.code?.[q.id] || '';
                const passRatio = sub ? `${sub.passedCount}/${sub.totalCount} Test Cases Passed` : 'Auto-Evaluated';

                return (
                  <div key={q.id} className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4 text-xs font-mono">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-bold text-white">Problem {idx + 1}: {q.title || 'Coding Problem'}</span>
                        <div className="text-gray-500 text-[11px] mt-0.5">
                          Language: <span className="text-orange-400 capitalize">{scoreInfo.lang || 'python'}</span> · {passRatio}
                        </div>
                      </div>
                      <span className={`font-bold text-sm ${scoreInfo.score > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        +{scoreInfo.score} / {q.marks} Marks
                      </span>
                    </div>

                    {userCode && (
                      <details className="mt-3 pt-2 border-t border-[#2a2a2a]">
                        <summary className="text-gray-400 hover:text-orange-400 cursor-pointer outline-none select-none">
                          View Submitted Code ({userCode.split('\n').length} lines)
                        </summary>
                        <pre className="bg-[#141414] border border-[#2a2a2a] p-3 rounded-lg text-gray-200 mt-2 max-h-48 overflow-y-auto text-[11px] leading-relaxed">
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

        {/* Multiple Choice Breakdown */}
        {mcqs.length > 0 && (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4 font-mono">
              <span>📝</span> Multiple Choice Questions Breakdown
            </h2>

            <div className="space-y-3">
              {mcqs.map((q, i) => {
                const userAns = result.answers?.[q.id];
                const correct = userAns === q.correct;
                const notAnswered = userAns === undefined;

                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-xl border text-xs font-mono ${
                      correct
                        ? 'bg-green-500/5 border-green-500/30'
                        : notAnswered
                        ? 'bg-[#111111] border-[#2a2a2a]'
                        : 'bg-red-500/5 border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-gray-400 font-bold">Q{i + 1}</span>
                      <span className={`font-bold ${correct ? 'text-green-400' : notAnswered ? 'text-gray-500' : 'text-red-400'}`}>
                        {correct ? `+${q.marks}` : notAnswered ? '0 (Skipped)' : '0'}
                      </span>
                    </div>
                    <p className="text-gray-200 font-sans text-xs mb-2 leading-relaxed">{q.text}</p>
                    <div className="text-[11px] text-gray-400">
                      {notAnswered ? (
                        <span>Not attempted</span>
                      ) : (
                        <>
                          <span>Your answer: <strong className={correct ? 'text-green-400' : 'text-red-400'}>{q.options[userAns]}</strong></span>
                          {!correct && (
                            <span className="ml-3 text-green-400">Correct: <strong>{q.options[q.correct]}</strong></span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button
          onClick={onBack}
          className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold py-3.5 px-4 rounded-xl transition-all cursor-pointer shadow-lg shadow-orange-500/20 text-center text-sm"
        >
          ← Back to Contest List
        </button>
      </main>
    </div>
  );
}
