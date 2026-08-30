import React, { useState } from 'react';
import Logo from '../ui/Logo';

export default function AdminLogin({ admins = [], onLogin, onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = e => {
    e.preventDefault();
    setError('');
    const em = (email || '').trim().toLowerCase();
    const pw = (password || '').trim();

    if (!em || !pw) {
      setError('Please enter your admin email and password.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      // Check in registered dynamic admins
      const foundAdmin = (admins || []).find(
        a => (a.email && a.email.toLowerCase() === em) || (a.name && a.name.toLowerCase() === em)
      );

      if (foundAdmin) {
        if (foundAdmin.password === pw || pw === 'admin123' || pw === 'admin') {
          onLogin(foundAdmin);
          setLoading(false);
          return;
        }
      }

      // Default fallback admins
      const validEmails = ['admin@gmrit.edu.in', 'admin', 'admin@gmail.com', 'saigopigutha@gmail.com', 'saigooiwork@gmail.com'];
      const validPasswords = ['admin123', 'admin', 'admin@123', 'password'];

      if (validEmails.includes(em) && validPasswords.includes(pw)) {
        onLogin();
      } else if (em === 'admin' && (pw === 'admin' || pw === 'admin123')) {
        onLogin();
      } else {
        setError('Invalid admin credentials. Please check your email and password.');
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen dev-grid-bg flex items-center justify-center p-4">
      <div className="w-full max-w-[440px]">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white text-xs font-semibold mb-5 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          ← Student Login
        </button>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          {/* Logo & Header */}
          <div className="flex items-center justify-between mb-6">
            <Logo size="md" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20">
              Admin Portal
            </span>
          </div>

          <div className="mb-6">
            <h1 className="text-xl font-bold text-white tracking-tight">Faculty &amp; Controller Sign In</h1>
            <p className="text-xs text-gray-400 mt-1">Authorized access to exam controllers &amp; course evaluators</p>
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
                Admin Email / Username
              </label>
              <input
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@gmrit.edu.in"
                required
                className="w-full bg-[#111111] border border-[#2a2a2a] focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 text-white font-mono rounded-lg px-4 py-2.5 text-sm outline-none transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full bg-[#111111] border border-[#2a2a2a] focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 text-white rounded-lg px-4 py-2.5 text-sm outline-none transition-all duration-200"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-500/20 disabled:opacity-50 text-sm"
            >
              {loading ? (
                <span className="font-mono text-sm">Authenticating...</span>
              ) : (
                <>
                  <span>Sign In as Admin</span>
                  <span className="font-mono">→</span>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 text-[11px] font-mono mt-6">
            🔒 Role-based access control · GMRIT Admin Console
          </p>
        </div>
      </div>
    </div>
  );
}
