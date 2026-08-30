import React, { useState, useEffect } from 'react';
import StudentLogin from './components/student/StudentLogin.jsx';
import ContestList from './components/student/ContestList.jsx';
import TestInterface from './components/student/TestInterface.jsx';
import ResultsPage from './components/student/ResultsPage.jsx';
import AdminLogin from './components/admin/AdminLogin.jsx';
import AdminDashboard from './components/admin/AdminDashboard.jsx';
import Toast from './components/common/Toast.jsx';

const DEFAULT_CONTESTS = [
  {
    id: 1,
    name: 'ISTE Coding Challenge – Round 1',
    desc: 'Algorithmic challenges with multiple test cases. Solve in Python, C++, C, Java, or JavaScript.',
    duration: 90,
    marks: 100,
    type: 'Coding',
    status: 'Open',
    token: 'ISTE-2024-CODE',
    password: 'iste2024',
    accessTokens: [],
    students: 0,
    questions: [
      {
        id: 1,
        type: 'mcq',
        text: 'What is the time complexity of binary search on a sorted array of n elements?',
        options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
        correct: 1,
        marks: 10
      },
      {
        id: 2,
        type: 'mcq',
        text: 'Which data structure follows the Last In, First Out (LIFO) principle?',
        options: ['Queue', 'Deque', 'Stack', 'Linked List'],
        correct: 2,
        marks: 10
      },
      {
        id: 3,
        type: 'mcq',
        text: 'What is the output of: print(type([])) in Python?',
        options: ["<class 'list'>", '[]', 'list', 'None'],
        correct: 0,
        marks: 10
      },
      {
        id: 4,
        type: 'code',
        title: 'Sum of Array Elements',
        text: `Given an integer array of size N, calculate and print the sum of all elements in the array.

Input Format:
- First line contains an integer N (size of array).
- Second line contains N space-separated integers.

Output Format:
- Print a single integer representing the sum of all elements.

Constraints:
- 1 <= N <= 10^5
- -10^9 <= Array[i] <= 10^9`,
        marks: 35,
        testCases: [
          { id: 1, input: '5\n1 2 3 4 5', expected: '15', isHidden: false, explanation: '1 + 2 + 3 + 4 + 5 = 15' },
          { id: 2, input: '4\n10 20 30 40', expected: '100', isHidden: false, explanation: '10 + 20 + 30 + 40 = 100' },
          { id: 3, input: '3\n-5 10 -2', expected: '3', isHidden: true, explanation: 'Negative numbers handled' },
          { id: 4, input: '1\n999', expected: '999', isHidden: true, explanation: 'Single element case' }
        ]
      },
      {
        id: 5,
        type: 'code',
        title: 'Palindrome String Checker',
        text: `Given a string S, check if it is a palindrome. Print "true" if it is a palindrome, otherwise print "false" (lowercase).

A palindrome is a string that reads the same forwards and backwards.

Input Format:
- A single line containing the string S.

Output Format:
- Print "true" or "false".

Constraints:
- 1 <= |S| <= 10^5
- S contains lowercase English letters.`,
        marks: 35,
        testCases: [
          { id: 1, input: 'racecar', expected: 'true', isHidden: false, explanation: '"racecar" reads same backwards' },
          { id: 2, input: 'codeit', expected: 'false', isHidden: false, explanation: '"codeit" != "tiedoc"' },
          { id: 3, input: 'madam', expected: 'true', isHidden: true, explanation: 'Odd length palindrome' },
          { id: 4, input: 'noon', expected: 'true', isHidden: true, explanation: 'Even length palindrome' }
        ]
      }
    ]
  },
  {
    id: 2,
    name: 'DSA Fundamentals MCQ Test',
    desc: '25 MCQ on data structures, algorithms and complexity theory.',
    duration: 60,
    marks: 50,
    type: 'MCQ',
    status: 'Upcoming',
    token: 'DSA-2024-EXAM',
    password: 'dsa2024',
    accessTokens: [],
    students: 0,
    questions: []
  },
  {
    id: 3,
    name: 'Web Dev Hackathon – Qualifier',
    desc: 'Build responsive webpages given design specs. HTML, CSS, JS allowed.',
    duration: 120,
    marks: 150,
    type: 'Coding',
    status: 'Upcoming',
    token: 'WEB-2024-HACK',
    password: 'web2024',
    accessTokens: [],
    students: 0,
    questions: []
  },
  {
    id: 4,
    name: 'Python Basics Assessment',
    desc: 'Beginner-level Python problems with multiple test cases.',
    duration: 45,
    marks: 50,
    type: 'Coding',
    status: 'Open',
    token: 'PY-2024-BASIC',
    password: 'python2024',
    accessTokens: [],
    students: 0,
    questions: [
      {
        id: 1,
        type: 'mcq',
        text: 'Which keyword is used to define a function in Python?',
        options: ['func', 'define', 'def', 'function'],
        correct: 2,
        marks: 10
      },
      {
        id: 2,
        type: 'mcq',
        text: 'What does len("hello") return?',
        options: ['4', '5', '6', 'error'],
        correct: 1,
        marks: 10
      },
      {
        id: 3,
        type: 'code',
        title: 'N-th Fibonacci Number',
        text: `Given an integer N, compute and print the N-th Fibonacci number.
Fibonacci sequence: F(0)=0, F(1)=1, F(2)=1, F(3)=2, F(4)=3, F(5)=5...

Input Format:
- Single line with integer N.

Output Format:
- Print the N-th Fibonacci number.`,
        marks: 30,
        testCases: [
          { id: 1, input: '6', expected: '8', isHidden: false, explanation: 'F(6) = 8' },
          { id: 2, input: '0', expected: '0', isHidden: false, explanation: 'F(0) = 0' },
          { id: 3, input: '10', expected: '55', isHidden: true, explanation: 'F(10) = 55' }
        ]
      }
    ]
  }
];

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

export default function App() {
  const [page, setPage] = useState(() => localStorage.getItem('codeit_page') || 'login');
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

  // Persistent contest state
  const [contests, setContests] = useState(() => {
    try {
      const saved = localStorage.getItem('codeit_contests');
      if (saved) {
        const parsed = JSON.parse(saved);
        const savedSubs = JSON.parse(localStorage.getItem('codeit_submissions') || '[]');
        return parsed.map(c => ({
          ...c,
          token: c.token || (c.password ? c.password.toUpperCase() + '-TOKEN' : `CONTEST-${c.id}-TOKEN`),
          accessTokens: c.accessTokens || [],
          admins: c.admins || ['admin@gmrit.edu.in'],
          students: savedSubs.filter(s => s.contestId === c.id).length
        }));
      }
    } catch(e) {}
    return DEFAULT_CONTESTS.map(c => ({ ...c, admins: c.admins || ['admin@gmrit.edu.in'] }));
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
      {page === 'login' && <StudentLogin onLogin={s => { showToast(`Welcome, ${s.name}!`, 'success'); nav('contests', { student: s }); }} onAdmin={() => nav('adminLogin')} />}
      {page === 'contests' && <ContestList contests={contests} student={student} onEnterWithToken={handleEnterContestWithToken} onLogout={handleLogout} />}
      {page === 'test' && <TestInterface student={student} contest={selectedContest} onFinish={handleTestFinish} />}
      {page === 'results' && <ResultsPage student={student} contest={selectedContest} result={testResult} onBack={() => nav('contests')} />}
      {page === 'adminLogin' && <AdminLogin admins={admins} onLogin={() => { showToast('Welcome to Admin Portal', 'success'); nav('adminDash'); }} onBack={() => nav('login')} />}
      {page === 'adminDash' && <AdminDashboard contests={contests} setContests={setContests} submissions={submissions} setSubmissions={setSubmissions} admins={admins} setAdmins={setAdmins} showToast={showToast} onLogout={() => { showToast('Admin logged out', 'info'); nav('login'); }} />}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
