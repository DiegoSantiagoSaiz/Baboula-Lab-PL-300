
export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Adaptive';
export type TimerSetting = 5 | 10 | 15 | 0; // 0 for unlimited
export type QuizMode = 'Practice' | 'Exam' | 'BookmarkReview';

export type QuestionType = 
  | 'MultipleChoice' 
  | 'MultiSelect' 
  | 'BuildList' 
  | 'Matching' 
  | 'CaseStudy';

export type QuestionCategory = 
  | 'Prepare the data'
  | 'Model the data'
  | 'Visualize and analyze the data'
  | 'Deploy and maintain assets';

export type QuestionCategoryFilter = QuestionCategory | 'All';
export type StudyGuideLength = 'Concise' | 'Detailed' | 'Comprehensive';

export interface Question {
  type: QuestionType;
  question: string;
  context?: string; // For Case Studies
  options: string[];
  // For MultipleChoice: string
  // For MultiSelect: string[]
  // For BuildList: string[] (ordered)
  // For Matching: string[] (pairs like "A:1")
  answer: string | string[];
  explanation: string;
  category: QuestionCategory;
  difficulty: Difficulty;
}

export interface ExamResult {
  question: Question;
  userAnswer: string | string[] | null;
  isCorrect: boolean;
  confidenceRating?: number;
}

export interface CategoryStat {
  correct: number;
  total: number;
}

export interface AccuracyHistoryPoint {
  session: number;
  accuracy: number;
}

export interface ProgressData {
  totalQuestions: number;
  totalCorrect: number;
  currentStreak: number;
  categoryStats: {
    'Prepare the data': CategoryStat;
    'Model the data': CategoryStat;
    'Visualize and analyze the data': CategoryStat;
    'Deploy and maintain assets': CategoryStat;
  };
  bookmarkedQuestions: Question[];
  accuracyHistory: AccuracyHistoryPoint[];
  examHistory: ExamResult[][];
  region?: string;
  confidenceRatings?: Record<string, { question: Question; rating: number; timestamp: string }>;
}

export interface User {
    email: string;
    alias?: string;
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
    timestamp: number;
}

export interface ActiveSession {
  sessionId: string;
  difficulty: Difficulty;
  timer: TimerSetting;
  mode: QuizMode;
  category: QuestionCategoryFilter;
  timeLeft: number;
  currentQuestionIndex: number;
  questions: (Question | null)[];
  answersState: Record<number, string | string[] | null>;
  matchingState: Record<number, Record<string, string>>;
  resultsMap: Record<number, ExamResult>;
  timestamp: string;
}
