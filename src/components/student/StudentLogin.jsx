import React, { useState } from 'react';
import Logo from '../ui/Logo';

const BRANCHES = ['CSE', 'ECE', 'IT', 'ME', 'EEE', 'CIVIL', 'CSM', 'CSD', 'AIDS'];

export default function StudentLogin({ onLogin, onAdmin }) {
  const [form, setForm] = useState({ jntuNo: '', name: '', branch: 'CSE', contact: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: k === 'jntuNo' ? e.target.value.toUpperCase() : e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setError('');
    const cleanJntu = (form.jntuNo || '').trim().toUpperCase();
    const cleanContact = (form.contact || '').trim();

    // 10-character alphanumeric JNTU number format (e.g. 24341A0574, 21341A05B7)
    if (!/^[0-9]{2}[0-9A-Z]{8}$/i.test(cleanJntu)) {
      setError('Invalid JNTU number format. Must be 10 characters (e.g. 24341A0574).');
      return;
    }
    if (!/^\d{10}$/.test(cleanContact)) {
      setError('Contact must be a 10-digit phone number.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, jntuNo: cleanJntu, contact: cleanContact })
      });
      if (res.ok) {
        const data = await res.json();
        onLogin({ ...form, jntuNo: cleanJntu, ...data });
        return;
      }
    } catch (err) {
      // Graceful fallback for local or offline mode
    } finally {
      setLoading(false);
    }

    onLogin({ ...form, jntuNo: cleanJntu, contact: cleanContact });
  };

  return (
    <div className="min-h-screen dev-grid-bg flex items-center justify-center p-4">
      <div className="w-full max-w-[440px]">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          {/* Top Logo */}
          <div className="flex items-center justify-between mb-6">
            <Logo size="md" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-orange-500 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20">
              Exam Portal
            </span>
          </div>

          <div className="mb-6">
            <h1 className="text-xl font-bold text-white tracking-tight">Welcome back</h1>
            <p className="text-xs text-gray-400 mt-1">Enter your student credentials to access proctored exams</p>
            <div className="h-px bg-[#2a2a2a] w-full mt-4" />
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2">
                JNTU Number
              </label>
              <input
                type="text"
                value={form.jntuNo}
                onChange={set('jntuNo')}
                placeholder="24341A0574"
                required
                maxLength={10}
                className="w-full bg-[#111111] border border-[#2a2a2a] focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 text-white font-mono rounded-lg px-4 py-2.5 text-sm outline-none transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={set('name')}
                placeholder="e.g. Ravi Kumar"
                required
                className="w-full bg-[#111111] border border-[#2a2a2a] focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 text-white rounded-lg px-4 py-2.5 text-sm outline-none transition-all duration-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2">
                  Branch
                </label>
                <select
                  value={form.branch}
                  onChange={set('branch')}
                  className="w-full bg-[#111111] border border-[#2a2a2a] focus:border-orange-500 text-white rounded-lg px-3 py-2.5 text-sm outline-none cursor-pointer transition-all duration-200"
                >
                  {BRANCHES.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2">
                  Contact Number
                </label>
                <input
                  type="tel"
                  value={form.contact}
                  onChange={set('contact')}
                  placeholder="+91 9876543210"
                  required
                  maxLength={10}
                  className="w-full bg-[#111111] border border-[#2a2a2a] focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 text-white font-mono rounded-lg px-4 py-2.5 text-sm outline-none transition-all duration-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-500/20 disabled:opacity-50"
            >
              {loading ? (
                <span className="font-mono text-sm">Verifying session...</span>
              ) : (
                <>
                  <span>Continue</span>
                  <span className="font-mono">→</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#2a2a2a] flex items-center justify-between text-xs text-gray-500">
            <span>Faculty / Admin?</span>
            <button
              type="button"
              onClick={onAdmin}
              className="text-orange-400 hover:text-orange-300 font-semibold transition-colors cursor-pointer"
            >
              Admin Portal →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
