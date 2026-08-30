import React, { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  UploadCloud,
  FileSpreadsheet,
  Settings,
  Plus,
  Trash2,
  Lock,
  Unlock,
  RefreshCw,
  LogOut,
  ChevronRight,
  Shield,
  Monitor,
  Maximize,
  Code,
  Check,
  Award,
  Clock,
  Menu,
  Eye,
  PlusCircle,
  Database
} from "lucide-react";
import { Question, Student, AdminSettings, Submission, TestCase } from "./types";
import { LANGUAGE_TEMPLATES, downloadCSV } from "./data";

// =========================================================================
// SVG LOGO COMPONENTS (Clean, elegant, professional vector graphics)
// =========================================================================

function IsteLogo() {
  return (
    <div className="flex items-center gap-2">
      <svg className="w-8 h-8 text-indigo-600" viewBox="0 0 100 100" fill="currentColor">
        {/* outer tech gear representation */}
        <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray="10 6" />
        <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="3" />
        {/* open book representation */}
        <path d="M32 58 L50 48 L68 58 L68 38 L50 28 L32 38 Z" fill="currentColor" opacity="0.9" />
        <path d="M50 28 L50 48" stroke="white" strokeWidth="2" />
        {/* flame of knowledge */}
        <path d="M47 18 Q50 10 53 18 Q55 22 50 26 Q45 22 47 18 Z" fill="#6366f1" />
      </svg>
      <div>
        <div className="font-display font-bold text-lg leading-tight tracking-tight text-slate-900">ISTE</div>
        <div className="text-[9px] font-medium tracking-wider text-indigo-600 uppercase">Student Chapter</div>
      </div>
    </div>
  );
}

function GmritduLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="text-right">
        <div className="font-display font-bold text-lg leading-tight tracking-tight text-slate-900">GMRIT DU</div>
        <div className="text-[8px] font-medium tracking-wide text-slate-500 uppercase">Deemed to be University</div>
      </div>
      <svg className="w-9 h-9 text-indigo-700" viewBox="0 0 100 100" fill="currentColor">
        {/* professional university crest/shield */}
        <path d="M15 20 C15 20 50 10 50 10 C50 10 85 20 85 20 C85 45 80 75 50 90 C20 75 15 45 15 20 Z" fill="none" stroke="currentColor" strokeWidth="6" />
        <path d="M22 25 L50 17 L78 25 C78 45 74 68 50 82 C26 68 22 45 22 25 Z" fill="currentColor" opacity="0.1" />
        {/* inner icons: book and star */}
        <rect x="35" y="32" width="30" height="20" rx="3" fill="currentColor" />
        <polygon points="50,58 53,64 60,65 55,70 56,77 50,73 44,77 45,70 40,65 47,64" fill="#f59e0b" />
        <path d="M35 42 H65" stroke="white" strokeWidth="2" />
      </svg>
    </div>
  );
}

function formatCodeInWorkspace(code: string, language: string): string {
  const lines = code.split("\n");
  const tab = "    ";
  
  if (language === "python") {
    let result: string[] = [];
    let currentIndent = 0;
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (!line) {
        result.push("");
        continue;
      }
      
      let reduceIndent = false;
      if (
        line.startsWith("elif") || 
        line.startsWith("else:") || 
        line.startsWith("except") || 
        line.startsWith("finally:")
      ) {
        currentIndent = Math.max(0, currentIndent - 1);
        reduceIndent = true;
      }

      result.push(tab.repeat(currentIndent) + line);

      if (reduceIndent) {
        currentIndent++;
      }

      if (line.endsWith(":")) {
        currentIndent++;
      }
    }
    return result.join("\n");
  } else {
    let result: string[] = [];
    let indentLevel = 0;
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (!line) {
        result.push("");
        continue;
      }

      if (line.startsWith("}") || line.startsWith("]")) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      result.push(tab.repeat(indentLevel) + line);

      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      indentLevel += openBraces - closeBraces;
      if (indentLevel < 0) indentLevel = 0;
    }
    return result.join("\n");
  }
}

function highlightCode(code: string, theme: "light" | "dark" = "dark"): string {
  if (!code) return "";
  
  const tokenRegex = RegExp([
    "(?<comment>\\/\\/[^\\n]*|#[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)",
    "(?<string>\"(?:\\\\.|[^\"\\\\])*\"|'(?:\\\\.|[^'\\\\])*'|\\`(?:\\\\.|[^\\`\\\\])*\\`)",
    "(?<preprocessor>#[a-zA-Z]+)",
    "(?<keyword>\\b(?:def|class|if|else|elif|for|while|return|import|from|in|and|or|not|pass|const|let|var|function|require|public|private|protected|static|void|throws|new|using|namespace|include|int|double|float|char|boolean|try|catch|finally|except|as|with|yield|break|continue|default|switch|case|true|false|null|undefined|None)\\b)",
    "(?<builtin>\\b(?:print|console|log|std|iostream|vector|string|sys|fs|BufferedReader|InputStreamReader|System|out|println|StringTokenizer|Main|String|args|IOException|stdio|stdlib)\\b)",
    "(?<number>\\b(?:0x[\\da-fA-F]+|\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)\\b)",
  ].join("|"), "g");

  let lastIndex = 0;
  let html = "";

  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  };

  let match;
  while ((match = tokenRegex.exec(code)) !== null) {
    if (match.index > lastIndex) {
      html += escapeHtml(code.substring(lastIndex, match.index));
    }

    const groups = match.groups as Record<string, string | undefined>;
    const matchedText = match[0];

    if (groups.comment) {
      const color = theme === "dark" ? "text-slate-500 italic" : "text-slate-400 italic";
      html += `<span class="${color}">${escapeHtml(matchedText)}</span>`;
    } else if (groups.string) {
      const color = theme === "dark" ? "text-amber-300 font-medium" : "text-emerald-600 font-medium";
      html += `<span class="${color}">${escapeHtml(matchedText)}</span>`;
    } else if (groups.preprocessor) {
      const color = theme === "dark" ? "text-pink-400" : "text-pink-600";
      html += `<span class="${color}">${escapeHtml(matchedText)}</span>`;
    } else if (groups.keyword) {
      const color = theme === "dark" ? "text-sky-400 font-bold" : "text-blue-600 font-bold";
      html += `<span class="${color}">${escapeHtml(matchedText)}</span>`;
    } else if (groups.builtin) {
      const color = theme === "dark" ? "text-indigo-300" : "text-indigo-600";
      html += `<span class="${color}">${escapeHtml(matchedText)}</span>`;
    } else if (groups.number) {
      const color = theme === "dark" ? "text-rose-400" : "text-rose-600";
      html += `<span class="${color}">${escapeHtml(matchedText)}</span>`;
    } else {
      html += escapeHtml(matchedText);
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < code.length) {
    html += escapeHtml(code.substring(lastIndex));
  }

  if (code.endsWith("\n")) {
    html += "\n ";
  }

  return html || "&nbsp;";
}

export default function App() {
  // Navigation & Authentication states
  const [view, setView] = useState<"login" | "signup" | "student_dashboard" | "student_test" | "student_results" | "admin_dashboard">("login");
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  
  // Authenticated states
  const [studentUser, setStudentUser] = useState<Student | null>(null);
  
  // Admin credentials input
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  
  // Student registration state
  const [regJntu, setRegJntu] = useState("");
  const [regName, setRegName] = useState("");
  const [regBranch, setRegBranch] = useState("CSE");
  const [regSection, setRegSection] = useState("A");
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState("");

  // Student login state
  const [loginJntu, setLoginJntu] = useState("");
  const [loginName, setLoginName] = useState("");
  const [loginBranch, setLoginBranch] = useState("CSE");
  const [loginSection, setLoginSection] = useState("A");
  const [loginYear, setLoginYear] = useState("1st Year");
  const [loginError, setLoginError] = useState("");

  // Database synchronizations
  const [questions, setQuestions] = useState<Question[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [settings, setSettings] = useState<AdminSettings>({
    testDurationMinutes: 60,
    globalRefreshLimit: 3,
    testIsActive: true,
  });

  // active exam states
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<string>("python");
  const [codeMap, setCodeMap] = useState<Record<string, string>>({});
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(3600); // in seconds
  const [editorTheme, setEditorTheme] = useState<"light" | "dark">("dark");
  const [wordWrap, setWordWrap] = useState<boolean>(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  
  // notification logs
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  const [showNotification, setShowNotification] = useState<string | null>(null);

  // Admin interactive panel states
  const [activeAdminTab, setActiveAdminTab] = useState<"leaderboard" | "settings" | "questions">("leaderboard");
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    title: "",
    description: "",
    difficulty: "Easy",
    inputFormat: "",
    outputFormat: "",
    sampleInput: "",
    sampleOutput: "",
    testCases: [
      { input: "", expectedOutput: "", isHidden: false },
      { input: "", expectedOutput: "", isHidden: true }
    ]
  });

  // Refs for tracking exam environment
  const testContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial settings, questions & students from DB API on mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const res = await fetch("/api/db");
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
        setStudents(data.students || []);
        setSettings(data.settings || { testDurationMinutes: 60, globalRefreshLimit: 3, testIsActive: true });
      }
    } catch (err) {
      console.error("Error loading server data:", err);
    }
  };

  const triggerNotification = (message: string) => {
    setShowNotification(message);
    setSystemLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev.slice(0, 19)]);
    setTimeout(() => {
      setShowNotification(null);
    }, 4000);
  };

  // Sync settings helper
  const syncSettings = async (updated: AdminSettings) => {
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        triggerNotification("Exam settings successfully updated.");
      }
    } catch (err) {
      console.error("Error updating settings:", err);
    }
  };

  // =========================================================================
  // AUTHENTICATION LOGIC
  // =========================================================================

  const handleStudentSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");
    setSignupSuccess("");

    if (!regJntu || !regName || !regBranch || !regSection) {
      setSignupError("Please fill in all the required fields.");
      return;
    }

    try {
      const res = await fetch("/api/auth/student/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jntuNo: regJntu,
          name: regName,
          branch: regBranch,
          section: regSection,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSignupSuccess(`Account created successfully for ${data.name}! You can now login.`);
        setRegJntu("");
        setRegName("");
        // Reload student list for leaderboard sync
        fetchInitialData();
      } else {
        setSignupError(data.error || "Signup failed.");
      }
    } catch (err) {
      setSignupError("Server connection error during signup.");
    }
  };

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!loginJntu || !loginName || !loginBranch || !loginSection || !loginYear) {
      setLoginError("Please enter all details (Name, Branch, Section, Year, and JNTU No.) to start.");
      return;
    }

    try {
      const res = await fetch("/api/auth/student/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jntuNo: loginJntu,
          name: loginName,
          branch: loginBranch,
          section: loginSection,
          year: loginYear,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStudentUser(data);
        if (data.submitted) {
          setView("student_results");
        } else {
          setView("student_dashboard");
        }
        triggerNotification(`Welcome to the exam, ${data.name}!`);
        // Refresh admin statistics or initial data to reflect the student registration/login
        fetchInitialData();
      } else {
        setLoginError(data.error || "Authentication failed.");
      }
    } catch (err) {
      setLoginError("Server connection error during login.");
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError("");

    if (adminPassword === "admin123") {
      fetchInitialData();
      setView("admin_dashboard");
      triggerNotification("Admin session authenticated successfully.");
      setAdminPassword("");
    } else {
      setAdminError("Incorrect Administrator Access Code.");
    }
  };

  const handleLogout = () => {
    setStudentUser(null);
    setIsFullscreen(false);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setView("login");
    triggerNotification("Logged out successfully.");
  };

  // =========================================================================
  // EXAM CONTROL & INTEGRITY MECHANISMS (Anti-Cheat & Fullscreen)
  // =========================================================================

  const startCodingTest = async () => {
    if (!studentUser) return;

    if (!settings.testIsActive) {
      triggerNotification("The test is currently inactive or closed by the Administrator.");
      return;
    }

    let updatedUser: any = null;
    // Initialize timer based on remaining duration or startup
    try {
      const res = await fetch("/api/students/start-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jntuNo: studentUser.jntuNo }),
      });
      if (res.ok) {
        updatedUser = await res.json();
        setStudentUser(updatedUser);
        
        // Calculate remaining seconds
        const elapsedSeconds = Math.floor((Date.now() - (updatedUser.startTime || Date.now())) / 1000);
        const totalDurationSeconds = settings.testDurationMinutes * 60;
        const remaining = Math.max(0, totalDurationSeconds - elapsedSeconds);
        setTimeRemaining(remaining);
      }
    } catch (err) {
      console.error("Error setting test start time:", err);
      setTimeRemaining(settings.testDurationMinutes * 60);
    }

    // Initialize code map with all templates
    const initialMap: Record<string, string> = {};
    questions.forEach((q) => {
      LANGUAGE_TEMPLATES.forEach((lang) => {
        initialMap[`${q.id}_${lang.id}`] = lang.boilerplate || "";
      });
    });

    // Populate with pre-existing student submissions if they exist
    const activeUser = updatedUser || studentUser;
    if (activeUser && activeUser.submissions) {
      activeUser.submissions.forEach((sub: any) => {
        initialMap[`${sub.questionId}_${sub.language}`] = sub.code;
      });
    }
    setCodeMap(initialMap);

    if (questions.length > 0) {
      setSelectedQuestion(questions[0]);
    }

    // Navigate and enter secure screen
    setView("student_test");
    triggerNotification("Exam initialized. Security tracking active.");
    
    // Request Fullscreen
    setTimeout(() => {
      enterFullscreenMode();
    }, 500);
  };

  const enterFullscreenMode = () => {
    const element = testContainerRef.current;
    if (element) {
      element.requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
          triggerNotification("Secured Fullscreen lock activated.");
        })
        .catch((err) => {
          console.warn("Fullscreen request rejected:", err);
          triggerNotification("WARNING: Full Screen mode is MANDATORY. Please click 'Maximize' to resume.");
        });
    }
  };

  // Integrity violation trigger
  const logViolation = async (violationType: "reload" | "blur" | "fullscreen") => {
    if (!studentUser || view !== "student_test") return;

    try {
      const res = await fetch("/api/students/violations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jntuNo: studentUser.jntuNo, type: violationType }),
      });

      if (res.ok) {
        const updated = await res.json();
        setStudentUser(updated);
        
        if (updated.status === "blocked") {
          // Exit full screen and freeze
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          }
          setIsFullscreen(false);
          triggerNotification("CRITICAL: You have been temporarily BLOCKED due to excessive security violations!");
        } else {
          const remainingTolerance = (updated.refreshLimit || settings.globalRefreshLimit) - updated.violations;
          triggerNotification(`ALERT: Integrity violation detected (${violationType.toUpperCase()})! Remaining tolerance: ${remainingTolerance + 1}`);
        }
      }
    } catch (err) {
      console.error("Error logging integrity violation:", err);
    }
  };

  // Secure full-screen listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (view === "student_test" && !document.fullscreenElement) {
        setIsFullscreen(false);
        logViolation("fullscreen");
      }
    };

    const handleVisibilityChange = () => {
      if (view === "student_test" && document.hidden) {
        logViolation("blur");
      }
    };

    // BeforeUnload hook to stop accidental reloads
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (view === "student_test") {
        e.preventDefault();
        e.returnValue = "Are you sure you want to exit the exam? Your progress will be saved but violations are tracked.";
        return e.returnValue;
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [view, studentUser]);

  // Exam timer countdown
  useEffect(() => {
    if (view === "student_test" && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            autoSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [view, timeRemaining]);

  // Auto-submit on timer expiry
  const autoSubmitExam = async () => {
    triggerNotification("Time is up! Submitting your answers automatically.");
    await finalizeSubmission();
  };

  const manualSubmitExam = async () => {
    if (window.confirm("Are you sure you want to finish the exam and submit your answers early?")) {
      await finalizeSubmission();
    }
  };

  const finalizeSubmission = async () => {
    if (!studentUser) return;

    try {
      const res = await fetch("/api/students/submit-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jntuNo: studentUser.jntuNo }),
      });

      if (res.ok) {
        const data = await res.json();
        setStudentUser(data);
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
        setView("student_results");
        triggerNotification("Exam successfully submitted. Well done!");
        fetchInitialData(); // Sync leaderboards
      }
    } catch (err) {
      console.error("Submission completion failed:", err);
    }
  };

  // =========================================================================
  // CODING ARENA CORE LOGIC (Gemini evaluation & compilation)
  // =========================================================================

  const handleLanguageChange = (langId: string) => {
    setCurrentLanguage(langId);
    if (selectedQuestion) {
      const template = LANGUAGE_TEMPLATES.find((t) => t.id === langId)?.boilerplate || "";
      // Initialize or reuse code
      if (!codeMap[`${selectedQuestion.id}_${langId}`]) {
        setCodeMap((prev) => ({
          ...prev,
          [`${selectedQuestion.id}_${langId}`]: template,
        }));
      }
    }
  };

  const runCodeCompile = async () => {
    if (!studentUser || !selectedQuestion) return;
    const code = codeMap[`${selectedQuestion.id}_${currentLanguage}`] || "";

    setIsEvaluating(true);
    setEvaluationResult(null);
    triggerNotification("Compiling and evaluating your solution...");

    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jntuNo: studentUser.jntuNo,
          questionId: selectedQuestion.id,
          language: currentLanguage,
          code,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setEvaluationResult(data.evaluation);
        setStudentUser(data.student);
        
        if (data.evaluation.status === "Passed") {
          triggerNotification("SUCCESS: All sample and hidden test cases passed!");
        } else if (data.evaluation.status === "Failed") {
          triggerNotification("COMPILE/LOGIC ALERTS: Some test cases failed.");
        } else {
          triggerNotification("COMPILER ERROR: Check the evaluation console.");
        }
        fetchInitialData(); // Sync general stats
      } else {
        triggerNotification("Evaluation failed due to server connection issues.");
      }
    } catch (err) {
      console.error(err);
      triggerNotification("Server communication timeout during evaluation.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleScroll = () => {
    if (textareaRef.current) {
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
      }
      if (highlightRef.current) {
        highlightRef.current.scrollTop = textareaRef.current.scrollTop;
        highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
      }
    }
  };

  const handleFormatCode = () => {
    if (!selectedQuestion) return;
    const currentCode = codeMap[`${selectedQuestion.id}_${currentLanguage}`] || "";
    const formatted = formatCodeInWorkspace(currentCode, currentLanguage);
    setCodeMap((prev) => ({
      ...prev,
      [`${selectedQuestion.id}_${currentLanguage}`]: formatted,
    }));
    triggerNotification("Auto-Formatted code layout successfully.");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea || !selectedQuestion) return;
    const { selectionStart, selectionEnd, value } = textarea;

    if (e.key === "Tab") {
      e.preventDefault();
      const tabChar = "    ";
      const newValue = value.substring(0, selectionStart) + tabChar + value.substring(selectionEnd);
      
      setCodeMap((prev) => ({
        ...prev,
        [`${selectedQuestion.id}_${currentLanguage}`]: newValue,
      }));

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + tabChar.length;
      }, 0);
    }

    const closingMap: Record<string, string> = {
      "{": "}",
      "(": ")",
      "[": "]",
      '"': '"',
      "'": "'",
    };
    if (closingMap[e.key] !== undefined) {
      e.preventDefault();
      const char = e.key;
      const closingChar = closingMap[char];
      const newValue = value.substring(0, selectionStart) + char + closingChar + value.substring(selectionEnd);

      setCodeMap((prev) => ({
        ...prev,
        [`${selectedQuestion.id}_${currentLanguage}`]: newValue,
      }));

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
      }, 0);
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const lines = value.substring(0, selectionStart).split("\n");
      const currentLine = lines[lines.length - 1];
      const match = currentLine.match(/^(\s*)/);
      let indent = match ? match[1] : "";

      const trimmed = currentLine.trim();
      if (trimmed.endsWith(":") || trimmed.endsWith("{") || trimmed.endsWith("(")) {
        indent += "    ";
      }

      const insertedText = "\n" + indent;
      const newValue = value.substring(0, selectionStart) + insertedText + value.substring(selectionEnd);

      setCodeMap((prev) => ({
        ...prev,
        [`${selectedQuestion.id}_${currentLanguage}`]: newValue,
      }));

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + insertedText.length;
      }, 0);
    }
  };

  // =========================================================================
  // ADMIN CONTROL MANAGEMENT
  // =========================================================================

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.title || !newQuestion.description) {
      alert("Please provide at least a title and description.");
      return;
    }

    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newQuestion),
      });

      if (res.ok) {
        const updatedQuestions = await res.json();
        setQuestions(updatedQuestions);
        triggerNotification("New problem statement created successfully.");
        // Reset form
        setNewQuestion({
          title: "",
          description: "",
          difficulty: "Easy",
          inputFormat: "",
          outputFormat: "",
          sampleInput: "",
          sampleOutput: "",
          testCases: [
            { input: "", expectedOutput: "", isHidden: false },
            { input: "", expectedOutput: "", isHidden: true }
          ]
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteQuestion = async (qId: string) => {
    if (window.confirm("Are you sure you want to permanently delete this question?")) {
      try {
        const res = await fetch(`/api/questions/${qId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          const data = await res.json();
          setQuestions(data.questions);
          triggerNotification("Question deleted successfully.");
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Individual student management (Reset violations, toggle block)
  const manageStudentLimit = async (jntuNo: string, action: string, value?: any) => {
    try {
      const res = await fetch("/api/students/manage-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jntuNo, action, value }),
      });
      if (res.ok) {
        triggerNotification("Student status updated.");
        fetchInitialData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Bulk settings
  const handleBulkIncrease = async () => {
    if (window.confirm("Increase violation limit for all students by 1? This will also unlock students whose violations fall below the new limit.")) {
      try {
        const res = await fetch("/api/students/manage-limit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "bulk-increase", value: 1 }),
        });
        if (res.ok) {
          triggerNotification("Tolerance count increased globally for all students.");
          fetchInitialData();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // =========================================================================
  // HELPER FORMATTERS
  // =========================================================================

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "Easy":
        return "bg-green-100 text-green-800 border-green-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Hard":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/40 flex flex-col text-slate-800 select-none">
      
      {/* =========================================================================
          GLOBAL SYSTEM HEADER
          ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 h-16 px-4 md:px-8 flex items-center justify-between shrink-0">
        <IsteLogo />
        <div className="hidden sm:flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 text-xs font-semibold text-indigo-700">
          <Database className="w-3.5 h-3.5" />
          <span>Local Campus Network Mode</span>
        </div>
        <GmritduLogo />
      </header>

      {/* =========================================================================
          NOTIFICATIONS (Floating alert helper)
          ========================================================================= */}
      {showNotification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white font-medium text-xs md:text-sm px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-800 animate-bounce">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{showNotification}</span>
        </div>
      )}

      {/* =========================================================================
          MAIN RENDERING CHANNELS
          ========================================================================= */}
      <main className="flex-1 flex flex-col">

        {/* -------------------------------------------------------------------------
            LOGIN & REGISTRATION PORTAL
            ------------------------------------------------------------------------- */}
        {view === "login" && (
          <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 md:py-16 grid md:grid-cols-12 gap-8 items-center">
            
            {/* Banner info column */}
            <div className="md:col-span-7 flex flex-col gap-6">
              <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase">Assessment & Coding Platform</span>
              <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Evaluate Student <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-700">Coding Knowledge</span> Live
              </h1>
              <p className="text-slate-600 text-base leading-relaxed max-w-xl">
                A secure, lightweight exam portal designed for college local networks. Provides simulated multi-language compilers, live leaderboards, and persistent anti-cheat telemetry.
              </p>

              <div className="grid grid-cols-2 gap-4 max-w-md">
                <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs">
                  <Shield className="w-5 h-5 text-indigo-600 mb-2" />
                  <div className="font-semibold text-sm">Anti-Cheat Shield</div>
                  <p className="text-xs text-slate-500 mt-1">Locks fullscreen, blocks copy-paste & track tab departures.</p>
                </div>
                <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs">
                  <Code className="w-5 h-5 text-indigo-600 mb-2" />
                  <div className="font-semibold text-sm">Automated Grading</div>
                  <p className="text-xs text-slate-500 mt-1">Secure server grading for C, C++, Java, Python & JS solutions.</p>
                </div>
              </div>
            </div>

            {/* Form control column */}
            <div className="md:col-span-5 bg-white border border-slate-200 rounded-xl shadow-sm p-6 md:p-8">
              
              {/* Tab Selector: Student vs Admin */}
              <div className="flex bg-slate-100 p-1.5 rounded-xl mb-6">
                <button
                  onClick={() => setIsAdminMode(false)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    !isAdminMode ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Student Portal
                </button>
                <button
                  onClick={() => setIsAdminMode(true)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    isAdminMode ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Admin Access
                </button>
              </div>

              {!isAdminMode ? (
                /* STUDENT CHANNEL */
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-900 mb-1">Student Portal</h2>
                  <p className="text-xs text-slate-500 mb-4">Provide your details to register or resume your coding exam immediately.</p>

                  <form onSubmit={handleStudentLogin} className="space-y-3.5">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        JNTU Registration Number (Unique ID)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 24341A0574"
                        value={loginJntu}
                        onChange={(e) => setLoginJntu(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold tracking-wide uppercase focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Full Name (with initials)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sai Gopi G"
                        value={loginName}
                        onChange={(e) => setLoginName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Year
                        </label>
                        <select
                          value={loginYear}
                          onChange={(e) => setLoginYear(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white outline-none transition-all cursor-pointer"
                        >
                          <option value="1st Year">1st Year</option>
                          <option value="2nd Year">2nd Year</option>
                          <option value="3rd Year">3rd Year</option>
                          <option value="4th Year">4th Year</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Branch
                        </label>
                        <select
                          value={loginBranch}
                          onChange={(e) => setLoginBranch(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white outline-none transition-all cursor-pointer"
                        >
                          <option value="CSE">CSE</option>
                          <option value="ECE">ECE</option>
                          <option value="IT">IT</option>
                          <option value="MECH">MECH</option>
                          <option value="CIVIL">CIVIL</option>
                          <option value="EEE">EEE</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Section
                        </label>
                        <select
                          value={loginSection}
                          onChange={(e) => setLoginSection(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white outline-none transition-all cursor-pointer"
                        >
                          <option value="A">Sec A</option>
                          <option value="B">Sec B</option>
                          <option value="C">Sec C</option>
                          <option value="D">Sec D</option>
                        </select>
                      </div>
                    </div>

                    {loginError && (
                      <div className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{loginError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Enter Exam Arena</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              ) : (
                /* ADMIN CHANNEL */
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-900 mb-2">Administrator Portal</h2>
                  <p className="text-xs text-slate-500 mb-6">Enter official developer access key to manage exam schedules and monitor students.</p>

                  <form onSubmit={handleAdminLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Developer Access Code
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all"
                        />
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">Default lab credential is <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">admin123</span></div>
                    </div>

                    {adminError && (
                      <div className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{adminError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-950 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
                    >
                      <span>Authorize Session</span>
                      <Shield className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}

            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------------
            STUDENT SIGNUP PAGE
            ------------------------------------------------------------------------- */}
        {view === "signup" && (
          <div className="flex-1 max-w-md mx-auto w-full px-4 py-12 flex flex-col justify-center">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 md:p-8">
              <h2 className="font-display text-2xl font-bold text-slate-900 mb-2">Student Registration</h2>
              <p className="text-xs text-slate-500 mb-6">Create a locally mapped student entry. Your JNTU number serves as your unique login ID.</p>

              <form onSubmit={handleStudentSignup} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    JNTU Registration Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 24341A0574"
                    value={regJntu}
                    onChange={(e) => setRegJntu(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold tracking-wider uppercase focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Full Name (with initials)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sai Gopi G"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Branch
                    </label>
                    <select
                      value={regBranch}
                      onChange={(e) => setRegBranch(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:bg-white outline-none transition-all"
                    >
                      <option value="CSE">CSE</option>
                      <option value="ECE">ECE</option>
                      <option value="IT">IT</option>
                      <option value="MECH">MECH</option>
                      <option value="CIVIL">CIVIL</option>
                      <option value="EEE">EEE</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Section
                    </label>
                    <select
                      value={regSection}
                      onChange={(e) => setRegSection(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:bg-white outline-none transition-all"
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                      <option value="D">Section D</option>
                    </select>
                  </div>
                </div>

                {signupError && (
                  <div className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{signupError}</span>
                  </div>
                )}

                {signupSuccess && (
                  <div className="text-xs font-semibold text-green-600 bg-green-50 p-2.5 rounded-lg border border-green-100 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{signupSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all"
                >
                  Create Student Registry
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                <button
                  onClick={() => setView("login")}
                  className="text-xs font-bold text-slate-500 hover:text-slate-900 hover:underline transition-all"
                >
                  Already have an account? Go back to login
                </button>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------------
            STUDENT PRE-EXAM DASHBOARD
            ------------------------------------------------------------------------- */}
        {view === "student_dashboard" && studentUser && (
          <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 flex flex-col gap-8">
            
            {/* Student metadata header */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 font-display font-bold text-lg flex items-center justify-center">
                  {studentUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-900">{studentUser.name}</h2>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="font-semibold text-slate-700">{studentUser.jntuNo}</span>
                    <span>•</span>
                    <span>Year: <span className="font-semibold text-slate-700">{studentUser.year || "N/A"}</span></span>
                    <span>•</span>
                    <span>Branch: <span className="font-semibold text-slate-700">{studentUser.branch}</span></span>
                    <span>•</span>
                    <span>Section: <span className="font-semibold text-slate-700">{studentUser.section}</span></span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 border border-rose-100 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit Session</span>
              </button>
            </div>

            {/* Test rules & entry point */}
            <div className="grid md:grid-cols-3 gap-6">
              
              {/* Left col: stats */}
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm text-center">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Scheduled Duration</div>
                  <div className="font-display text-3xl font-extrabold text-indigo-950">{settings.testDurationMinutes} Minutes</div>
                  <div className="text-[10px] text-slate-500 mt-2">Continuous time tracking. Submit early if finished.</div>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm text-center">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Integrity Tolerance</div>
                  <div className="font-display text-3xl font-extrabold text-rose-700">{studentUser.refreshLimit || settings.globalRefreshLimit} Refreshes</div>
                  <div className="text-[10px] text-slate-500 mt-2">Maximum allowed tab switches / screen exits.</div>
                </div>
              </div>

              {/* Right col: mandatory instructions */}
              <div className="md:col-span-2 bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 text-indigo-800">
                    <Shield className="w-5 h-5 text-indigo-600" />
                    <span>Mandatory Exam Guidelines</span>
                  </h3>
                  
                  <ul className="space-y-3.5 text-xs text-slate-600">
                    <li className="flex items-start gap-3.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center shrink-0">1</span>
                      <p className="leading-normal">
                        <strong className="text-slate-900">Mandatory Fullscreen:</strong> The exam will launch and run strictly in fullscreen. Exit fullscreen will count as an integrity infraction.
                      </p>
                    </li>
                    <li className="flex items-start gap-3.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center shrink-0">2</span>
                      <p className="leading-normal">
                        <strong className="text-slate-900">Right-Click & Copy-Paste Disabled:</strong> You cannot copy external code into the editor or right-click to inspect. All text entries must be original.
                      </p>
                    </li>
                    <li className="flex items-start gap-3.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center shrink-0">3</span>
                      <p className="leading-normal">
                        <strong className="text-slate-900">No Tab Switching / Reloads:</strong> Opening other tabs, minimizing, or reloading the webpage triggers system violation warnings. Exceeding your limit will block you instantly.
                      </p>
                    </li>
                  </ul>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                  <div className="text-[11px] text-slate-400">Ensure browser allows fullscreen requests.</div>
                  <button
                    onClick={startCodingTest}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                  >
                    <span>Authorize & Launch Test</span>
                    <Play className="w-4 h-4 fill-white" />
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* -------------------------------------------------------------------------
            STUDENT SECURE EXAM CONSOLE (The Secure Coding Arena)
            ------------------------------------------------------------------------- */}
        {view === "student_test" && studentUser && (
          <div
            ref={testContainerRef}
            onContextMenu={(e) => {
              e.preventDefault();
              triggerNotification("SECURITY: Right-click menu is locked on this test canvas.");
            }}
            className="flex-1 bg-white flex flex-col text-slate-800 select-none relative"
          >
            {/* Secured Exam Top Nav Bar */}
            <div className="bg-slate-900 text-white px-4 md:px-8 py-3.5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold uppercase tracking-widest bg-rose-600 text-white px-2.5 py-0.5 rounded-sm">SECURE MODE</span>
                <div className="text-sm font-semibold tracking-wide hidden sm:block">
                  Student: <span className="text-slate-300 font-normal">{studentUser.name}</span> ({studentUser.jntuNo})
                </div>
              </div>

              {/* Live Countdowns & Violations Indicators */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3.5 py-1 rounded-lg">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="font-mono text-sm font-bold text-amber-300">{formatTimer(timeRemaining)}</span>
                </div>

                <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3.5 py-1 rounded-lg text-xs font-bold">
                  <span>Violations:</span>
                  <span className={`font-mono text-sm px-1.5 py-0.2 rounded-sm ${
                    studentUser.violations > 0 ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"
                  }`}>{studentUser.violations} / {studentUser.refreshLimit || settings.globalRefreshLimit}</span>
                </div>

                <button
                  onClick={manualSubmitExam}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all"
                >
                  Submit Test
                </button>
              </div>
            </div>

            {/* Check if student is blocked */}
            {studentUser.status === "blocked" ? (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-xs z-50 flex flex-col items-center justify-center p-8 text-center select-none">
                <Lock className="w-20 h-20 text-rose-600 mb-6 animate-pulse" />
                <h2 className="font-display text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Exam Locked Temporarily</h2>
                <p className="text-slate-600 max-w-md text-sm leading-relaxed mb-8">
                  Student <span className="font-bold text-slate-900">{studentUser.name} ({studentUser.jntuNo})</span> has exceeded the allowed system limit of reloads, tab switches, or exiting full screen mode.
                </p>
                <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs font-semibold px-6 py-4 rounded-xl max-w-md">
                  Please alert the supervisor in your computer lab to restore your exam. They can reset your counts from the Admin Dashboard.
                </div>
              </div>
            ) : (
              /* Secured Arena Layout Split Panel */
              <div className="flex-1 grid md:grid-cols-12 overflow-hidden">
                
                {/* Left Panel: Question description (md:col-span-5) */}
                <div className="md:col-span-5 border-r border-slate-200 flex flex-col h-full bg-slate-50 overflow-y-auto">
                  
                  {/* Tabs/Selectors for added questions */}
                  <div className="bg-white border-b border-slate-200 p-3 flex gap-2 overflow-x-auto shrink-0">
                    {questions.map((q, idx) => (
                      <button
                        key={q.id}
                        onClick={() => setSelectedQuestion(q)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border shrink-0 transition-all ${
                          selectedQuestion?.id === q.id
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-xs"
                            : "bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                      >
                        Problem {idx + 1}: {q.title}
                      </button>
                    ))}
                  </div>

                  {selectedQuestion ? (
                    <div className="p-6 flex-1 flex flex-col gap-5">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="font-display text-xl font-extrabold text-slate-900 tracking-tight">
                          {selectedQuestion.title}
                        </h3>
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full border ${getDifficultyColor(selectedQuestion.difficulty)}`}>
                          {selectedQuestion.difficulty}
                        </span>
                      </div>

                      {/* Description Markdown Renderer Block */}
                      <div className="text-xs text-slate-700 leading-relaxed bg-white border border-slate-200 rounded-xl p-4 shadow-2xs whitespace-pre-line font-sans">
                        {selectedQuestion.description}
                      </div>

                      {/* Format indicators */}
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                          <strong className="text-slate-900 block mb-1">Input Format:</strong>
                          <span className="text-slate-500 leading-normal block">{selectedQuestion.inputFormat || "Standard input values."}</span>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                          <strong className="text-slate-900 block mb-1">Output Format:</strong>
                          <span className="text-slate-500 leading-normal block">{selectedQuestion.outputFormat || "Single formatted line."}</span>
                        </div>
                      </div>

                      {/* Sample Test Case indicators */}
                      <div className="space-y-3">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Sample Test Case</div>
                        <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
                          <div className="bg-slate-900 text-slate-200 rounded-lg p-3">
                            <div className="text-[9px] text-slate-500 uppercase font-sans font-bold tracking-wide mb-1.5">Standard Input</div>
                            <pre className="whitespace-pre-wrap">{selectedQuestion.sampleInput}</pre>
                          </div>
                          <div className="bg-slate-900 text-slate-200 rounded-lg p-3">
                            <div className="text-[9px] text-slate-500 uppercase font-sans font-bold tracking-wide mb-1.5">Expected Output</div>
                            <pre className="whitespace-pre-wrap">{selectedQuestion.sampleOutput}</pre>
                          </div>
                        </div>
                      </div>

                      {/* Help warning on fullscreen */}
                      {!isFullscreen && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 text-xs flex gap-3 shadow-2xs">
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                          <div>
                            <strong className="block mb-0.5">Fullscreen compliance required:</strong>
                            Please click the lock button below to restore full screen lock immediately before security locks you.
                          </div>
                        </div>
                      )}

                      <button
                        onClick={enterFullscreenMode}
                        className="w-full mt-auto py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-200 flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Maximize className="w-3.5 h-3.5" />
                        <span>Force Secure Fullscreen</span>
                      </button>

                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-500">No questions loaded. Contact your instructor.</div>
                  )}

                </div>

                {/* Right Panel: Integrated Editor Console (md:col-span-7) */}
                <div className="md:col-span-7 flex flex-col h-full bg-white overflow-hidden">
                  
                  {/* Editor settings & actions header */}
                  <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                      <select
                        value={currentLanguage}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-100 cursor-pointer"
                      >
                        {LANGUAGE_TEMPLATES.map((lang) => (
                          <option key={lang.id} value={lang.id}>
                            {lang.name}
                          </option>
                        ))}
                      </select>

                      <div className="flex bg-slate-200 p-0.5 rounded-lg shrink-0">
                        <button
                          onClick={() => setEditorTheme("dark")}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-md cursor-pointer ${
                            editorTheme === "dark" ? "bg-slate-900 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          Dark
                        </button>
                        <button
                          onClick={() => setEditorTheme("light")}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-md cursor-pointer ${
                            editorTheme === "light" ? "bg-slate-900 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          Light
                        </button>
                      </div>

                      <button
                        onClick={handleFormatCode}
                        disabled={!selectedQuestion}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                        title="Automatically structure and format indentation of your code"
                      >
                        <Code className="w-3 h-3 text-slate-500" />
                        <span>Format Code</span>
                      </button>

                      <button
                        onClick={() => setWordWrap(!wordWrap)}
                        className={`px-2.5 py-1.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                          wordWrap
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                        title="Toggle long lines wrap vs horizontal scrolling"
                      >
                        <span>Wrap: {wordWrap ? "On" : "Off"}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={runCodeCompile}
                        disabled={isEvaluating || !selectedQuestion}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        {isEvaluating ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Grading...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-white" />
                            <span>Run & Grade Solution</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* High fidelity monospaced code writer with custom Line Numbers */}
                  <div className="flex-1 flex overflow-hidden relative">
                    {selectedQuestion ? (
                      <div className="flex-1 flex overflow-hidden h-full">
                        {/* Line Numbers Column */}
                        <div
                          ref={lineNumbersRef}
                          className={`w-10 py-4 pr-2 text-right font-mono text-[11px] leading-relaxed select-none overflow-hidden shrink-0 border-r ${
                            editorTheme === "dark"
                              ? "bg-slate-950 border-slate-800 text-slate-600"
                              : "bg-slate-50 border-slate-200 text-slate-400"
                          }`}
                          style={{ minHeight: "100%" }}
                        >
                          {Array.from({ length: (codeMap[`${selectedQuestion.id}_${currentLanguage}`] || "").split("\n").length || 1 }).map((_, idx) => (
                            <div key={idx} className="leading-relaxed font-semibold">
                              {idx + 1}
                            </div>
                          ))}
                        </div>

                        {/* Main Textarea and Syntax Highlighter Wrapper */}
                        <div className="flex-1 h-full relative overflow-hidden">
                          {/* Highlighter Display */}
                          <pre
                            ref={highlightRef}
                            className={`absolute inset-0 p-4 pl-2 font-mono text-[11px] leading-relaxed pointer-events-none select-none overflow-hidden ${
                              wordWrap ? "whitespace-pre-wrap" : "whitespace-pre"
                            } ${
                              editorTheme === "dark"
                                ? "bg-slate-950 text-slate-300"
                                : "bg-white text-slate-700"
                            }`}
                            dangerouslySetInnerHTML={{
                              __html: highlightCode(codeMap[`${selectedQuestion.id}_${currentLanguage}`] || "", editorTheme),
                            }}
                          />

                          {/* Raw Interactive Textarea */}
                          <textarea
                            ref={textareaRef}
                            value={codeMap[`${selectedQuestion.id}_${currentLanguage}`] || ""}
                            onScroll={handleScroll}
                            onKeyDown={handleKeyDown}
                            onCopy={(e) => {
                              e.preventDefault();
                              triggerNotification("SECURITY: Copying code from this editor is strictly disabled.");
                            }}
                            onPaste={(e) => {
                              e.preventDefault();
                              triggerNotification("SECURITY: Pasting code into this editor is strictly disabled.");
                            }}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCodeMap((prev) => ({
                                ...prev,
                                [`${selectedQuestion.id}_${currentLanguage}`]: val,
                              }));
                            }}
                            spellCheck={false}
                            className={`absolute inset-0 p-4 pl-2 font-mono text-[11px] focus:outline-none resize-none leading-relaxed overflow-auto bg-transparent border-0 focus:ring-0 ${
                              wordWrap ? "whitespace-pre-wrap" : "whitespace-pre"
                            } ${
                              editorTheme === "dark"
                                ? "text-transparent caret-emerald-400"
                                : "text-transparent caret-slate-900"
                            }`}
                            placeholder="# Write your secure coding solution here..."
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
                        Please select a question statement first.
                      </div>
                    )}
                  </div>

                  {/* Compiler results output tray (shrink-0) */}
                  <div className="bg-slate-50 border-t border-slate-200 h-64 flex flex-col shrink-0 overflow-hidden">
                    <div className="bg-slate-100 px-4 py-2 flex items-center justify-between border-b border-slate-200 shrink-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Grading Output Console</span>
                      {evaluationResult && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold">Status:</span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm ${
                            evaluationResult.status === "Passed"
                              ? "bg-green-100 text-green-800"
                              : evaluationResult.status === "Error"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}>{evaluationResult.status}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] text-slate-700">
                      {!evaluationResult ? (
                        <div className="text-slate-400 italic">No compile logs or test metrics. Submit code to run the automated grader.</div>
                      ) : (
                        <div className="space-y-4">
                          {evaluationResult.errorMsg ? (
                            <div className="text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-lg leading-normal whitespace-pre-wrap">
                              {evaluationResult.errorMsg}
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {evaluationResult.testCases?.map((tc: any, i: number) => (
                                <div key={i} className="flex flex-col gap-1 bg-white border border-slate-200 rounded-lg p-3 shadow-2xs">
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="font-sans font-bold text-xs text-slate-800">
                                      Test Case #{tc.index + 1} {selectedQuestion?.testCases[tc.index]?.isHidden ? "(Hidden Case)" : ""}
                                    </span>
                                    <span className={`flex items-center gap-1 text-[10px] font-bold uppercase ${tc.passed ? "text-emerald-600" : "text-rose-600"}`}>
                                      {tc.passed ? (
                                        <>
                                          <CheckCircle className="w-3.5 h-3.5" />
                                          <span>Passed</span>
                                        </>
                                      ) : (
                                        <>
                                          <XCircle className="w-3.5 h-3.5" />
                                          <span>Mismatch / Failed</span>
                                        </>
                                      )}
                                    </span>
                                  </div>
                                  
                                  {!selectedQuestion?.testCases[tc.index]?.isHidden ? (
                                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                                      <div>
                                        <span className="font-sans font-semibold text-slate-700">Expected:</span>
                                        <pre className="mt-0.5 bg-slate-50 p-1.5 rounded">{selectedQuestion?.testCases[tc.index]?.expectedOutput || tc.actualOutput}</pre>
                                      </div>
                                      <div>
                                        <span className="font-sans font-semibold text-slate-700">Actual output:</span>
                                        <pre className="mt-0.5 bg-slate-50 p-1.5 rounded">{tc.actualOutput || "(No output)"}</pre>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-[10px] text-slate-400 italic mt-1 font-sans">Hidden inputs used. Output comparison hidden to prevent hardcoding.</div>
                                  )}
                                </div>
                              ))}
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
        )}

        {/* -------------------------------------------------------------------------
            STUDENT FINISHED / RESULTS DISPLAY
            ------------------------------------------------------------------------- */}
        {view === "student_results" && studentUser && (
          <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-12 text-center flex flex-col justify-center">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 md:p-12">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="w-9 h-9" />
              </div>

              <h2 className="font-display text-3xl font-extrabold text-slate-900 tracking-tight">Test Completed successfully</h2>
              <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed mt-2 mb-8">
                Your answers have been stored in the campus network. Your evaluation is complete and leaderboard stats are synchronized.
              </p>

              <div className="border border-slate-100 rounded-xl p-6 bg-slate-50 max-w-sm mx-auto space-y-4 mb-8">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 uppercase font-semibold">Student Name:</span>
                  <span className="font-bold text-slate-900">{studentUser.name}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 uppercase font-semibold">JNTU Number:</span>
                  <span className="font-bold font-mono text-slate-900">{studentUser.jntuNo}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 uppercase font-semibold">Year & Branch:</span>
                  <span className="font-bold text-slate-900">{studentUser.year || "N/A"} - {studentUser.branch}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 uppercase font-semibold">Section:</span>
                  <span className="font-bold text-slate-900">Section {studentUser.section}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 uppercase font-semibold">Problems Solved:</span>
                  <span className="font-extrabold text-indigo-600">{studentUser.problemsSolved} Solved</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 uppercase font-semibold">Violations Detected:</span>
                  <span className="font-bold text-slate-900">{studentUser.violations} total</span>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleLogout}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-950 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all"
                >
                  Return to portal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------------
            ADMINISTRATOR DASHBOARD
            ------------------------------------------------------------------------- */}
        {view === "admin_dashboard" && (
          <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
            
            {/* Dashboard Header Bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="font-display text-2xl font-extrabold text-slate-900 tracking-tight">Supervising Dashboard</h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span className="font-semibold text-indigo-600">Lab Console Active</span>
                  <span>•</span>
                  <span>Total questions: <span className="font-semibold text-slate-800">{questions.length}</span></span>
                  <span>•</span>
                  <span>Students registered: <span className="font-semibold text-slate-800">{students.length}</span></span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => downloadCSV(students)}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Download CSV</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-xs font-bold uppercase tracking-wider rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Exit Session</span>
                </button>
              </div>
            </div>

            {/* Admin layout navigation */}
            <div className="flex bg-white border border-slate-200 p-1.5 rounded-xl shrink-0 gap-2 shadow-xs">
              <button
                onClick={() => setActiveAdminTab("leaderboard")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeAdminTab === "leaderboard" ? "bg-slate-100 text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Student Performance & Leaderboard
              </button>
              <button
                onClick={() => setActiveAdminTab("questions")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeAdminTab === "questions" ? "bg-slate-100 text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Question Set Manager
              </button>
              <button
                onClick={() => setActiveAdminTab("settings")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeAdminTab === "settings" ? "bg-slate-100 text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Global Settings & System Controls
              </button>
            </div>

            {/* TAB CONTENT: LEADERBOARD & STUDENT STATS */}
            {activeAdminTab === "leaderboard" && (
              <div className="grid lg:grid-cols-12 gap-6">
                
                {/* Students list & controls (lg:col-span-9) */}
                <div className="lg:col-span-9 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                  <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="font-display font-bold text-slate-900">Student Statistics</h3>
                    <button
                      onClick={handleBulkIncrease}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold uppercase tracking-wide rounded-lg border border-slate-200 transition-all cursor-pointer"
                    >
                      +1 Violation Tolerance for All
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-3.5">Student Details</th>
                          <th className="px-6 py-3.5 text-center">Solved Count</th>
                          <th className="px-6 py-3.5 text-center">Time Taken (Sec)</th>
                          <th className="px-6 py-3.5 text-center">Violations</th>
                          <th className="px-6 py-3.5 text-center">Security Status</th>
                          <th className="px-6 py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {students.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-10 text-center text-slate-400 italic">No registered student entries found yet.</td>
                          </tr>
                        ) : (
                          [...students]
                            .sort((a, b) => {
                              if (b.problemsSolved !== a.problemsSolved) return b.problemsSolved - a.problemsSolved;
                              return (a.timeTakenSeconds || 0) - (b.timeTakenSeconds || 0);
                            })
                            .map((st, idx) => (
                              <tr key={st.jntuNo} className="hover:bg-slate-50/50 transition-all">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center">
                                      {idx + 1}
                                    </div>
                                    <div>
                                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                        <span>{st.name}</span>
                                        {st.submitted && <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded">Submitted</span>}
                                      </div>
                                      <div className="text-[10px] text-slate-500 font-medium">
                                        {st.jntuNo} • {st.year ? `${st.year} • ` : ""}{st.branch} Section {st.section}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center font-bold text-indigo-600 text-sm">
                                  {st.problemsSolved} / {questions.length}
                                </td>
                                <td className="px-6 py-4 text-center font-mono font-medium text-slate-600">
                                  {st.timeTakenSeconds || "Tracking..."}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className={`font-mono text-xs px-2 py-0.5 rounded-sm ${
                                    st.violations > (st.refreshLimit || settings.globalRefreshLimit)
                                      ? "bg-rose-100 text-rose-800 font-extrabold"
                                      : "bg-slate-100 text-slate-700"
                                  }`}>{st.violations} / {st.refreshLimit || settings.globalRefreshLimit}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  {st.status === "blocked" ? (
                                    <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">
                                      <Lock className="w-3 h-3" />
                                      <span>BLOCKED</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">
                                      <Unlock className="w-3 h-3" />
                                      <span>ACTIVE</span>
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="inline-flex gap-2">
                                    <button
                                      onClick={() => manageStudentLimit(st.jntuNo, "reset-violations")}
                                      className="px-2.5 py-1 text-[10px] font-bold uppercase text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md transition-all cursor-pointer"
                                    >
                                      Reset Infractions
                                    </button>
                                    
                                    {st.status === "blocked" ? (
                                      <button
                                        onClick={() => manageStudentLimit(st.jntuNo, "set-status", "active")}
                                        className="px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-all cursor-pointer"
                                      >
                                        Unlock Student
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => manageStudentLimit(st.jntuNo, "set-status", "blocked")}
                                        className="px-2.5 py-1 text-[10px] font-bold uppercase text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-all cursor-pointer"
                                      >
                                        Lock Student
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Live integrity logs (lg:col-span-3) */}
                <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col h-[500px]">
                  <h3 className="font-display font-bold text-slate-900 mb-3 text-sm flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <span>Live Integrity Logs</span>
                  </h3>
                  
                  <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-2 text-slate-600">
                    {systemLogs.length === 0 ? (
                      <div className="text-slate-400 italic text-center mt-10">No security telemetry logs yet.</div>
                    ) : (
                      systemLogs.map((log, idx) => (
                        <div key={idx} className="p-2 bg-slate-50 border-l-2 border-rose-500 rounded-r-md leading-normal">
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* TAB CONTENT: QUESTIONS MANAGER */}
            {activeAdminTab === "questions" && (
              <div className="grid lg:grid-cols-12 gap-6">
                
                {/* List of existing questions */}
                <div className="lg:col-span-7 space-y-4">
                  <h3 className="font-display font-bold text-slate-900 text-lg">Current Problem Pool</h3>
                  
                  {questions.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400 italic">
                      No questions available. Use the creation tool on the right to add some.
                    </div>
                  ) : (
                    questions.map((q, idx) => (
                      <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">Problem #{idx+1}</span>
                            <h4 className="font-display font-bold text-slate-900 text-base">{q.title}</h4>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase rounded-full border ${getDifficultyColor(q.difficulty)}`}>
                              {q.difficulty}
                            </span>
                            <button
                              onClick={() => deleteQuestion(q.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg bg-slate-50 hover:bg-rose-50 transition-all border border-slate-100 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 leading-relaxed truncate">{q.description}</p>
                        
                        <div className="text-[10px] text-slate-400 font-semibold border-t border-slate-100 pt-3.5 flex items-center gap-4">
                          <span>Inputs: <strong className="text-slate-700">{q.sampleInput.slice(0, 20)}...</strong></span>
                          <span>Expected: <strong className="text-slate-700">{q.sampleOutput.slice(0, 20)}...</strong></span>
                          <span>Test cases: <strong className="text-slate-700">{q.testCases?.length || 0} (both sample & hidden)</strong></span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Form to add new question */}
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                  <h3 className="font-display font-bold text-slate-900 text-lg mb-4 flex items-center gap-1.5">
                    <Plus className="w-5 h-5 text-indigo-600" />
                    <span>Create Problem Statement</span>
                  </h3>

                  <form onSubmit={handleCreateQuestion} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Problem Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Find Palindromes"
                        value={newQuestion.title || ""}
                        onChange={(e) => setNewQuestion((prev) => ({ ...prev, title: e.target.value }))}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:bg-white outline-none focus:ring-1 focus:ring-indigo-100"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Difficulty</label>
                        <select
                          value={newQuestion.difficulty || "Easy"}
                          onChange={(e: any) => setNewQuestion((prev) => ({ ...prev, difficulty: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold outline-none"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Problem Description (Supports Markdown/newlines)</label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Define the task objective clearly, detailing any specific logical constraints."
                        value={newQuestion.description || ""}
                        onChange={(e) => setNewQuestion((prev) => ({ ...prev, description: e.target.value }))}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white outline-none focus:ring-1 focus:ring-indigo-100 leading-normal"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Sample Input</label>
                        <textarea
                          rows={2}
                          placeholder="e.g. 5"
                          value={newQuestion.sampleInput || ""}
                          onChange={(e) => setNewQuestion((prev) => ({ ...prev, sampleInput: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:bg-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Expected Output</label>
                        <textarea
                          rows={2}
                          placeholder="e.g. True"
                          value={newQuestion.sampleOutput || ""}
                          onChange={(e) => setNewQuestion((prev) => ({ ...prev, sampleOutput: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:bg-white outline-none"
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2">
                      <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">Automated Grader Configurations</div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">Hidden test cases are used internally for final submissions. Students can see outcomes of sample test cases but hidden cases prevent cheating.</p>
                      
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            const updatedCases = [...(newQuestion.testCases || [])];
                            updatedCases.push({ input: "", expectedOutput: "", isHidden: false });
                            setNewQuestion(prev => ({ ...prev, testCases: updatedCases }));
                          }}
                          className="py-1.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 rounded-lg cursor-pointer transition-all"
                        >
                          + Add Sample Case
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updatedCases = [...(newQuestion.testCases || [])];
                            updatedCases.push({ input: "", expectedOutput: "", isHidden: true });
                            setNewQuestion(prev => ({ ...prev, testCases: updatedCases }));
                          }}
                          className="py-1.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 rounded-lg cursor-pointer transition-all"
                        >
                          + Add Hidden Case
                        </button>
                      </div>

                      {/* Display added test cases */}
                      <div className="max-h-36 overflow-y-auto space-y-2 mt-2">
                        {newQuestion.testCases?.map((tc, idx) => (
                          <div key={idx} className="bg-white border border-slate-200 rounded-lg p-2.5 flex flex-col gap-1.5 relative">
                            <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Case #{idx+1} ({tc.isHidden ? "Hidden" : "Sample"})</span>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="Input"
                                value={tc.input}
                                onChange={(e) => {
                                  const cases = [...(newQuestion.testCases || [])];
                                  cases[idx].input = e.target.value;
                                  setNewQuestion(prev => ({ ...prev, testCases: cases }));
                                }}
                                className="px-2 py-1 bg-slate-50 text-[10px] font-mono rounded"
                              />
                              <input
                                type="text"
                                placeholder="Expected Output"
                                value={tc.expectedOutput}
                                onChange={(e) => {
                                  const cases = [...(newQuestion.testCases || [])];
                                  cases[idx].expectedOutput = e.target.value;
                                  setNewQuestion(prev => ({ ...prev, testCases: cases }));
                                }}
                                className="px-2 py-1 bg-slate-50 text-[10px] font-mono rounded"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const cases = (newQuestion.testCases || []).filter((_, i) => i !== idx);
                                setNewQuestion(prev => ({ ...prev, testCases: cases }));
                              }}
                              className="absolute top-1 right-1 text-[10px] text-rose-500 hover:underline cursor-pointer"
                            >
                              Del
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all cursor-pointer"
                    >
                      Publish Question
                    </button>
                  </form>
                </div>

              </div>
            )}

            {/* TAB CONTENT: SETTINGS & SYSTEM CONTROLS */}
            {activeAdminTab === "settings" && (
              <div className="max-w-xl mx-auto w-full bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="font-display font-bold text-slate-900 text-lg mb-4 flex items-center gap-1.5">
                  <Settings className="w-5 h-5 text-indigo-600" />
                  <span>Exam Configuration Panel</span>
                </h3>

                <div className="space-y-6">
                  
                  {/* Test active lock switch */}
                  <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <div>
                      <strong className="text-xs text-slate-900 block font-bold uppercase">Enable Code Portal Access</strong>
                      <p className="text-[11px] text-slate-500 leading-normal mt-0.5">Toggle this block to lock or unlock the coding arena registration/exam start.</p>
                    </div>

                    <button
                      onClick={() => syncSettings({ ...settings, testIsActive: !settings.testIsActive })}
                      className={`px-4 py-2 text-xs font-bold uppercase rounded-lg border transition-all cursor-pointer ${
                        settings.testIsActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : "bg-rose-50 text-rose-700 border-rose-100"
                      }`}
                    >
                      {settings.testIsActive ? "Portal Open (Active)" : "Portal Closed (Inactive)"}
                    </button>
                  </div>

                  {/* Settings inputs */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Exam Duration (Minutes)</label>
                      <input
                        type="number"
                        min="5"
                        max="240"
                        value={settings.testDurationMinutes}
                        onChange={(e) => syncSettings({ ...settings, testDurationMinutes: parseInt(e.target.value) || 60 })}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:ring-1 focus:ring-indigo-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Global Infraction Limit</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={settings.globalRefreshLimit}
                        onChange={(e) => syncSettings({ ...settings, globalRefreshLimit: parseInt(e.target.value) || 3 })}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:ring-1 focus:ring-indigo-100"
                      />
                    </div>
                  </div>

                  <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl text-xs space-y-1.5 leading-relaxed text-indigo-950">
                    <strong className="font-bold block text-indigo-900 uppercase tracking-wide">Campus Network Infrastructure Warnings</strong>
                    <p>All student registrations, solution files, and integrity logs are updated instantly on this backend database. If a student PC has a blackout, they can immediately log back in to restore their current timers and saved code snippets.</p>
                  </div>

                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* =========================================================================
          GLOBAL SYSTEM FOOTER
          ========================================================================= */}
      <footer className="bg-white border-t border-slate-200 py-4 px-8 text-center text-[10px] text-slate-400 font-medium tracking-wide flex flex-col sm:flex-row justify-between items-center gap-2">
        <span>© 2026 ISTE & GMRITDU. Managed Locally in College Intranet Network.</span>
        <div className="flex gap-4">
          <span>Secure Browser Environment: OK</span>
          <span>•</span>
          <span>Grader Engines: ONLINE</span>
        </div>
      </footer>

    </div>
  );
}
