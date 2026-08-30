export interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface Question {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  inputFormat: string;
  outputFormat: string;
  sampleInput: string;
  sampleOutput: string;
  testCases: TestCase[];
}

export interface Submission {
  questionId: string;
  language: string;
  code: string;
  status: 'Passed' | 'Failed' | 'Error';
  passedCount: number;
  totalCount: number;
  errorMsg?: string;
  timestamp: number;
}

export interface Student {
  jntuNo: string; // unique username / ID (uppercase, e.g. 24341A0574)
  name: string;
  branch: string;
  section: string;
  year?: string; // e.g. "I", "II", "III", "IV" or "1st", "2nd", etc.
  status: 'active' | 'blocked';
  violations: number; // current violation count
  refreshLimit: number; // custom refresh limit for this student
  problemsSolved: number;
  timeTakenSeconds: number;
  startTime?: number; // timestamp when test started
  endTime?: number; // timestamp when test ended / submitted
  submitted: boolean;
  submissions: Submission[];
}

export interface AdminSettings {
  testDurationMinutes: number;
  globalRefreshLimit: number;
  testIsActive: boolean;
}

export interface DatabaseState {
  questions: Question[];
  students: Student[];
  settings: AdminSettings;
}
