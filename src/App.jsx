import React, { useState, useEffect } from 'react';
import StudentLogin from './components/student/StudentLogin.jsx';
import ContestList from './components/student/ContestList.jsx';
import TestInterface from './components/student/TestInterface.jsx';
import ResultsPage from './components/student/ResultsPage.jsx';
import AdminLogin from './components/admin/AdminLogin.jsx';
import AdminDashboard from './components/admin/AdminDashboard.jsx';
import Toast from './components/common/Toast.jsx';

const DEFAULT_ADMINS = [
  {
    id: 1,
    name: 'Chief Exam Controller',
    email: 'admin@gmrit.edu.in',
    password: 'admin123',
    role: 'Super Admin',
    department: 'GMRIT Examination Cell',
    status: 'Active',
    addedAt: '30 Aug 2026'
  },
  {
    id: 2,
    name: 'Sai Gopi Gutha',
    email: 'saigopigutha@gmail.com',
    password: 'admin',
    role: 'Super Admin',
    department: 'CSE Department',
    status: 'Active',
    addedAt: '30 Aug 2026'
  }
];

const VALID_PAGES = ['login', 'contests', 'test', 'results', 'adminLogin', 'adminDash'];

export default function App() {
  const [page, setPage] = useState(() => {
    try {
      const savedPage = localStorage.getItem('codeit_page');
      return VALID_PAGES.includes(savedPage) ? savedPage : 'login';
    } catch (e) {
      return 'login';
    }
  });
  const [student, setStudent] = useState(() => {
    try { return JSON.parse(localStorage.getItem('codeit_student')); } catch(e) { return null; }
  });
  const [selectedContest, setSelectedContest] = useState(() => {
    try { return JSON.parse(localStorage.getItem('codeit_selected_contest')); } catch(e) { return null; }
  });
  const [testResult, setTestResult] = useState(null);
  const [toast, setToast] = useState(null);

  // Platform Admins state
  const [admins, setAdmins] = useState(() => {
    try {
      const saved = localStorage.getItem('codeit_admins');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return DEFAULT_ADMINS;
  });

  // Submissions state
  const [submissions, setSubmissions] = useState(() => {
    try {
      const saved = localStorage.getItem('codeit_submissions');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return [];
  });

  // Persistent contest state (starts empty if no contests saved, never re-seeds old deleted data)
  const [contests, setContests] = useState(() => {
    try {
      const saved = localStorage.getItem('codeit_contests');
      if (saved !== null) {
        return JSON.parse(saved);
      }
    } catch(e) {}
    return [];
  });

  // Save state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('codeit_page', page);
      if (student) localStorage.setItem('codeit_student', JSON.stringify(student));
      else localStorage.removeItem('codeit_student');

      if (selectedContest) localStorage.setItem('codeit_selected_contest', JSON.stringify(selectedContest));
      else localStorage.removeItem('codeit_selected_contest');

      localStorage.setItem('codeit_contests', JSON.stringify(contests));
      localStorage.setItem('codeit_submissions', JSON.stringify(submissions));
      localStorage.setItem('codeit_admins', JSON.stringify(admins));
    } catch(e) {}
  }, [page, student, selectedContest, contests, submissions, admins]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const nav = (pg, extra = {}) => {
    if (extra.student !== undefined) setStudent(extra.student);
    if (extra.contest !== undefined) setSelectedContest(extra.contest);
    if (extra.result !== undefined) setTestResult(extra.result);
    setPage(pg);
  };

  const handleLogout = () => {
    setStudent(null);
    setSelectedContest(null);
    setTestResult(null);
    localStorage.removeItem('codeit_student');
    localStorage.removeItem('codeit_selected_contest');
    setPage('login');
    showToast('Logged out successfully', 'success');
  };

  const handleEnterContestWithToken = (contest, enteredCode) => {
    const codeClean = (enteredCode || '').trim().toUpperCase();
    const pwClean = (enteredCode || '').trim();

    // Check master token or password
    const isMasterToken = (contest.token && contest.token.toUpperCase() === codeClean) ||
                          (contest.password && contest.password === pwClean);

    // Check single-use tokens
    const singleUseMatch = (contest.accessTokens || []).find(
      t => t.code.toUpperCase() === codeClean
    );

    if (singleUseMatch) {
      if (singleUseMatch.isUsed && singleUseMatch.usedBy !== student?.jntuNo) {
        return { success: false, error: `This access token was already redeemed by ${singleUseMatch.usedBy}.` };
      }

      // Mark token as used
      setContests(prev => prev.map(c => {
        if (c.id !== contest.id) return c;
        const updatedTokens = (c.accessTokens || []).map(t => {
          if (t.id === singleUseMatch.id) {
            return { ...t, isUsed: true, usedBy: student?.jntuNo, usedAt: new Date().toLocaleTimeString() };
          }
          return t;
        });
        return { ...c, accessTokens: updatedTokens };
      }));

      showToast(`Token verified! Welcome to ${contest.name}`, 'success');
      nav('test', { contest });
      return { success: true };
    }

    if (isMasterToken) {
      showToast(`Access granted to ${contest.name}`, 'success');
      nav('test', { contest });
      return { success: true };
    }

    return { success: false, error: 'Invalid access token. Please check the code with your instructor.' };
  };

  const handleTestFinish = (result) => {
    const now = new Date();
    const formattedTime = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ', ' +
      now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    const newSub = {
      id: Date.now(),
      jntuNo: student?.jntuNo || 'N/A',
      name: student?.name || 'Anonymous',
      branch: student?.branch || 'CSE',
      contestId: selectedContest?.id,
      contest: selectedContest?.name || 'Contest',
      score: result.score,
      total: result.total,
      percentage: result.total > 0 ? Math.round((result.score / result.total) * 100) : 0,
      timeTaken: result.timeTaken,
      time: formattedTime,
      submittedAt: formattedTime,
      refreshes: result.refreshCount || 0,
      warnings: result.warnings || 0,
      answers: result.answers,
      code: result.code,
      codingScores: result.codingScores
    };

    setSubmissions(prev => [newSub, ...prev]);

    // Update real submission count on contest
    setContests(prev => prev.map(c => {
      if (c.id === selectedContest?.id) {
        return { ...c, students: (c.students || 0) + 1 };
      }
      return c;
    }));

    // Post to backend API if available
    fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jntuNo: student?.jntuNo,
        studentName: student?.name,
        branch: student?.branch,
        contestId: selectedContest?.id,
        contestName: selectedContest?.name,
        score: result.score,
        totalMarks: result.total,
        mcqCorrect: result.mcqCorrect,
        timeTaken: result.timeTaken,
        refreshes: result.refreshCount || 0,
        warnings: result.warnings || 0,
        submittedAt: formattedTime,
        answers: result.answers,
        code: result.code
      })
    }).catch(() => {});

    showToast('Test submitted successfully!', 'success');
    nav('results', { result });
  };

  return (
    <div>
      {(page === 'login' || (!VALID_PAGES.includes(page))) && (
        <StudentLogin
          onLogin={s => {
            showToast(`Welcome, ${s.name}!`, 'success');
            nav('contests', { student: s });
          }}
          onAdmin={() => nav('adminLogin')}
        />
      )}
      {page === 'contests' && (
        <ContestList
          contests={contests}
          student={student || { name: 'Student', jntuNo: '24341A0501', branch: 'CSE' }}
          onEnterWithToken={handleEnterContestWithToken}
          onLogout={handleLogout}
        />
      )}
      {page === 'test' && (
        <TestInterface
          student={student || { name: 'Student', jntuNo: '24341A0501', branch: 'CSE' }}
          contest={selectedContest || contests[0]}
          onFinish={handleTestFinish}
        />
      )}
      {page === 'results' && (
        <ResultsPage
          student={student || { name: 'Student', jntuNo: '24341A0501', branch: 'CSE' }}
          contest={selectedContest || contests[0]}
          result={testResult || { score: 45, total: 50, timeTaken: 1800, warnings: 0, refreshCount: 0 }}
          onBack={() => nav('contests')}
        />
      )}
      {page === 'adminLogin' && (
        <AdminLogin
          admins={admins}
          onLogin={() => {
            showToast('Welcome to Admin Portal', 'success');
            nav('adminDash');
          }}
          onBack={() => nav('login')}
        />
      )}
      {page === 'adminDash' && (
        <AdminDashboard
          contests={contests}
          setContests={setContests}
          submissions={submissions}
          setSubmissions={setSubmissions}
          admins={admins}
          setAdmins={setAdmins}
          showToast={showToast}
          onLogout={() => {
            showToast('Admin logged out', 'info');
            nav('login');
          }}
        />
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
