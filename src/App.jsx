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
    password: 'iste2024',
    students: 47,
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
    password: 'dsa2024',
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
    status: 'Closed',
    password: 'web2024',
    students: 83,
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
    password: 'python2024',
    students: 31,
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

  // Persistent contest state
  const [contests, setContests] = useState(() => {
    try {
      const saved = localStorage.getItem('codeit_contests');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return DEFAULT_CONTESTS;
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
    } catch(e) {}
  }, [page, student, selectedContest, contests]);

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

  return (
    <div>
      {page === 'login' && <StudentLogin onLogin={s => { showToast(`Welcome, ${s.name}!`, 'success'); nav('contests', { student: s }); }} onAdmin={() => nav('adminLogin')} />}
      {page === 'contests' && <ContestList contests={contests} student={student} onEnter={c => nav('test', { contest: c })} onLogout={handleLogout} />}
      {page === 'test' && <TestInterface student={student} contest={selectedContest} onFinish={r => { showToast('Test submitted successfully!', 'success'); nav('results', { result: r }); }} />}
      {page === 'results' && <ResultsPage student={student} contest={selectedContest} result={testResult} onBack={() => nav('contests')} />}
      {page === 'adminLogin' && <AdminLogin onLogin={() => { showToast('Welcome to Admin Portal', 'success'); nav('adminDash'); }} onBack={() => nav('login')} />}
      {page === 'adminDash' && <AdminDashboard contests={contests} setContests={setContests} onLogout={() => { showToast('Admin logged out', 'info'); nav('login'); }} />}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
