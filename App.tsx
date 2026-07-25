// Implemented the main App component to handle state management, view routing, data persistence, and theme.
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dashboard } from './components/Dashboard';
import { Quiz } from './components/Quiz';
import { SessionReview } from './components/SessionReview';
import { BookmarkedQuestions } from './components/BookmarkedQuestions';
import { StudyHub } from './components/StudyHub';
import type { ProgressData, Question, ExamResult, Difficulty, TimerSetting, QuizMode, QuestionCategoryFilter, User, ActiveSession } from './types';
import { PowerBiIcon } from './components/icons/PowerBiIcon';
import { PerformanceSummaryModal } from './components/PerformanceSummaryModal';
import { ThemeToggle } from './components/ThemeToggle';
import { PracticeExamDownloader } from './components/PracticeExamDownloader';
import { Auth } from './components/Auth';
import * as authService from './services/authService';
import { db, auth as firebaseAuth, handleFirestoreError } from './services/firebase';
import { 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    collection, 
    addDoc, 
    query, 
    getDocs, 
    deleteDoc,
    serverTimestamp,
    onSnapshot 
} from 'firebase/firestore';
import { UserIcon } from './components/icons/UserIcon';
import { LogoutIcon } from './components/icons/LogoutIcon';

import { MonsterBackground } from './components/MonsterBackground';
import { GeminiChat } from './components/GeminiChat';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from './utils/LanguageContext';

type View = 'dashboard' | 'quiz' | 'review' | 'bookmarks' | 'study-hub';
export type Theme = 'light' | 'dim' | 'dark' | 'forest';

const INITIAL_PROGRESS: ProgressData = {
  totalQuestions: 0,
  totalCorrect: 0,
  currentStreak: 0,
  categoryStats: {
    'Prepare the data': { correct: 0, total: 0 },
    'Model the data': { correct: 0, total: 0 },
    'Visualize and analyze the data': { correct: 0, total: 0 },
    'Deploy and maintain assets': { correct: 0, total: 0 },
  },
  bookmarkedQuestions: [],
  accuracyHistory: [],
  examHistory: [],
  region: 'asturias',
  confidenceRatings: {},
};

const APP_DATA_KEY = 'pl300-progress';

interface SessionSummary {
    score: number;
    total: number;
    accuracy: string;
    timeTaken: number;
}

const App: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [view, setView] = useState<View>('dashboard');
  const [progressData, setProgressData] = useState<ProgressData>(INITIAL_PROGRESS);
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  
  const [quizSettings, setQuizSettings] = useState<{ difficulty: Difficulty; timer: TimerSetting; mode: QuizMode; category: QuestionCategoryFilter; }>({
    difficulty: 'Adaptive',
    timer: 15,
    mode: 'Practice',
    category: 'All',
  });
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [theme, setTheme] = useState<Theme>('dim');
  const [showPracticeExamModal, setShowPracticeExamModal] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Effect to load theme on initial load
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const validThemes: Theme[] = ['light', 'dim', 'dark', 'forest'];
    const initialTheme = savedTheme && validThemes.includes(savedTheme) ? savedTheme : 'forest';
    setTheme(initialTheme);
  }, []);

  // Effect to apply theme class and save to localStorage
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'dim', 'forest');
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'dim') {
      // Apply both so 'dark:' tailwind variants trigger, but 'dim' CSS vars take priority
      root.classList.add('dim', 'dark');
    } else if (theme === 'forest') {
      // Apply both so 'dark:' tailwind variants trigger, but 'forest' CSS vars take priority
      root.classList.add('forest', 'dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const toggleTheme = () => {
    setTheme(prevTheme => {
        if (prevTheme === 'light') return 'dim';
        if (prevTheme === 'dim') return 'dark';
        if (prevTheme === 'dark') return 'forest';
        return 'light';
    });
  };

  // Handle Auth State
  useEffect(() => {
    const unsubscribe = authService.listenToAuthChanges(async (fbUser) => {
      if (fbUser) {
        const userData: User = { 
            email: fbUser.email || '', 
            alias: fbUser.displayName || 'Learner' 
        };
        setUser(userData);
        setIsGuest(false);
        
        try {
            // Fetch Firestore data - can be loaded from offline cache
            const userRef = doc(db, 'users', fbUser.uid);
            const userSnap = await getDoc(userRef);
            
            let fsData: any = {};
            if (userSnap.exists()) {
                fsData = userSnap.data();
            }
            
            // Fetch exams and bookmarks separately for full state with offline try-catch resilience
            let history: ExamResult[][] = [];
            try {
                const examsQuery = query(collection(db, 'users', fbUser.uid, 'exams'));
                const examsSnap = await getDocs(examsQuery);
                history = examsSnap.docs.map(d => d.data().results as ExamResult[]);
            } catch (examsErr) {
                console.warn("Could not fetch exams from Firestore (using cache or empty):", examsErr);
            }
            
            let bookmarks: Question[] = [];
            try {
                const bookmarksQuery = query(collection(db, 'users', fbUser.uid, 'bookmarks'));
                const bookmarksSnap = await getDocs(bookmarksQuery);
                bookmarks = bookmarksSnap.docs.map(d => d.data().question as Question);
            } catch (bookmarksErr) {
                console.warn("Could not fetch bookmarks from Firestore (using cache or empty):", bookmarksErr);
            }

            // Fetch active session if any
            let activeSess: ActiveSession | null = null;
            try {
                const activeSessionRef = doc(db, 'users', fbUser.uid, 'activeSession', 'current');
                const activeSessionSnap = await getDoc(activeSessionRef);
                if (activeSessionSnap.exists()) {
                    activeSess = activeSessionSnap.data() as ActiveSession;
                }
            } catch (sessErr) {
                console.error("Failed to load active session from Firestore", sessErr);
            }
            setActiveSession(activeSess);

            const loadedProgress: ProgressData = {
                totalQuestions: fsData.totalQuestions || 0,
                totalCorrect: fsData.totalCorrect || 0,
                currentStreak: fsData.currentStreak || 0,
                categoryStats: fsData.categoryStats || INITIAL_PROGRESS.categoryStats,
                accuracyHistory: fsData.accuracyHistory || [],
                examHistory: history,
                bookmarkedQuestions: bookmarks,
                region: fsData.region || 'asturias',
                confidenceRatings: fsData.confidenceRatings || {}
            };

            setProgressData(loadedProgress);
            // Save a redundant backup in localStorage in case of complete initial startup offline state later
            localStorage.setItem(`${APP_DATA_KEY}_${fbUser.uid}`, JSON.stringify(loadedProgress));
        } catch (err) {
            console.error("Error loading user progress from Firestore (attempting offline backup):", err);
            try {
                const savedData = localStorage.getItem(`${APP_DATA_KEY}_${fbUser.uid}`);
                if (savedData) {
                    setProgressData(JSON.parse(savedData));
                }
            } catch (fallbackErr) {
                console.error("Offline localStorage backup load failed:", fallbackErr);
            }
        }
      } else {
        setUser(null);
        setActiveSession(null);
        // If not guest, we'll show Auth screen
      }
      setAuthInitialized(true);
    });
    return () => unsubscribe();
  }, []);

  // Effect to load local data for guest
  useEffect(() => {
    if (!isGuest || user) return;
    try {
      const savedData = localStorage.getItem(APP_DATA_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setProgressData({
          ...INITIAL_PROGRESS,
          ...parsedData,
          categoryStats: { ...INITIAL_PROGRESS.categoryStats, ...(parsedData.categoryStats || {}), },
          bookmarkedQuestions: parsedData.bookmarkedQuestions || [],
          accuracyHistory: parsedData.accuracyHistory || [],
          examHistory: parsedData.examHistory || [],
          confidenceRatings: parsedData.confidenceRatings || {},
        });
      }
      const savedActiveSession = localStorage.getItem('pl300-active-session');
      if (savedActiveSession) {
        setActiveSession(JSON.parse(savedActiveSession));
      } else {
        setActiveSession(null);
      }
    } catch {}
  }, [isGuest, user]);

  // Effect to save local data for guest
  useEffect(() => {
    if (!isGuest || user) return;
    localStorage.setItem(APP_DATA_KEY, JSON.stringify(progressData));
  }, [progressData, isGuest, user]);

  const handleQuizEnd = useCallback(async (results: ExamResult[], timeTaken: number) => {
    setExamResults(results);
    
    // Clear active session
    setActiveSession(null);
    if (firebaseAuth.currentUser) {
        const uid = firebaseAuth.currentUser.uid;
        const activeSessionRef = doc(db, 'users', uid, 'activeSession', 'current');
        try {
            await deleteDoc(activeSessionRef);
        } catch (e) {
            console.error("Error clearing active session from Firestore", e);
        }
    } else {
        localStorage.removeItem('pl300-active-session');
    }

    if (results.length === 0) {
        setView('review');
        return;
    }

    const newData = JSON.parse(JSON.stringify(progressData));
    let newStreak = progressData.currentStreak;
    let sessionCorrect = 0;

    results.forEach(result => {
      newData.totalQuestions += 1;
      const category = result.question.category;
      if (!newData.categoryStats[category]) {
         newData.categoryStats[category] = { correct: 0, total: 0 };
      }
      newData.categoryStats[category].total += 1;

      if (result.isCorrect) {
        newData.totalCorrect += 1;
        newData.categoryStats[category].correct += 1;
        newStreak += 1;
        sessionCorrect += 1;
      } else {
        newStreak = 0;
      }
    });
    newData.currentStreak = newStreak;

    const sessionAccuracy = (sessionCorrect / results.length) * 100;
    newData.accuracyHistory.push({
        session: newData.accuracyHistory.length + 1,
        accuracy: sessionAccuracy,
    });
    
    const newHistory = [...(progressData.examHistory || []), results].slice(-10);
    newData.examHistory = newHistory;

    setProgressData(newData);

    // Sync to Firestore if user exists
    if (firebaseAuth.currentUser) {
        const uid = firebaseAuth.currentUser.uid;
        try {
            const userRef = doc(db, 'users', uid);
            await updateDoc(userRef, {
                totalQuestions: newData.totalQuestions,
                totalCorrect: newData.totalCorrect,
                currentStreak: newData.currentStreak,
                categoryStats: newData.categoryStats,
                accuracyHistory: newData.accuracyHistory,
                lastUpdated: serverTimestamp()
            });

            // Save individual exam session
            await addDoc(collection(db, 'users', uid, 'exams'), {
                sessionId: Date.now().toString(),
                timestamp: new Date().toISOString(),
                results: results,
                score: sessionCorrect,
                total: results.length,
                timeTaken: timeTaken
            });
        } catch (e) {
            console.error("Firestore sync error", e);
        }
    }

    const score = sessionCorrect;
    const total = results.length;
    const accuracy = total > 0 ? ((score / total) * 100).toFixed(0) : '0';

    setSessionSummary({ score, total, accuracy, timeTaken });
    setShowSummaryModal(true);
  }, [progressData]);

  const handleStartQuiz = useCallback((settings: { difficulty: Difficulty; timer: TimerSetting; mode: QuizMode; category: QuestionCategoryFilter; }) => {
    // Clear active session since a new session is starting
    setActiveSession(null);
    if (firebaseAuth.currentUser) {
        const uid = firebaseAuth.currentUser.uid;
        const activeSessionRef = doc(db, 'users', uid, 'activeSession', 'current');
        deleteDoc(activeSessionRef).catch(e => console.error("Error discarding active session on starting a new quiz", e));
    } else {
        localStorage.removeItem('pl300-active-session');
    }
    setQuizSettings(settings);
    setView('quiz');
  }, []);

  const handleSaveAndExit = useCallback(async (
    questions: (Question | null)[],
    answersState: Record<number, string | string[] | null>,
    matchingState: Record<number, Record<string, string>>,
    resultsMap: Record<number, ExamResult>,
    timeLeft: number,
    currentQuestionIndex: number
  ) => {
    const session: ActiveSession = {
      sessionId: activeSession?.sessionId || `session_${Date.now()}`,
      difficulty: quizSettings.difficulty,
      timer: quizSettings.timer,
      mode: quizSettings.mode,
      category: quizSettings.category,
      timeLeft,
      currentQuestionIndex,
      questions,
      answersState,
      matchingState,
      resultsMap,
      timestamp: new Date().toISOString()
    };

    setActiveSession(session);

    if (firebaseAuth.currentUser) {
      const uid = firebaseAuth.currentUser.uid;
      const activeSessionRef = doc(db, 'users', uid, 'activeSession', 'current');
      try {
        await setDoc(activeSessionRef, session);
      } catch (e) {
        console.error("Error saving active session to Firestore", e);
      }
    } else {
      localStorage.setItem('pl300-active-session', JSON.stringify(session));
    }

    setView('dashboard');
  }, [activeSession, quizSettings]);

  const handleResumeSession = useCallback(() => {
    if (activeSession) {
      setQuizSettings({
        difficulty: activeSession.difficulty,
        timer: activeSession.timer,
        mode: activeSession.mode,
        category: activeSession.category
      });
      setView('quiz');
    }
  }, [activeSession]);

  const handleDiscardActiveSession = useCallback(async () => {
    setActiveSession(null);
    localStorage.removeItem('pl300-active-session');
    if (firebaseAuth.currentUser) {
      const uid = firebaseAuth.currentUser.uid;
      const activeSessionRef = doc(db, 'users', uid, 'activeSession', 'current');
      try {
          await deleteDoc(activeSessionRef);
      } catch (e) {
          console.error("Error deleting active session from Firestore", e);
      }
    }
  }, []);

  const handleCloseSummaryModal = useCallback(() => {
    setShowSummaryModal(false);
    setView('review');
  }, []);

  const handleToggleBookmark = useCallback(async (question: Question) => {
    const isBookmarked = progressData.bookmarkedQuestions.some(bq => bq.question === question.question);
    
    setProgressData(prevData => ({
      ...prevData,
      bookmarkedQuestions: isBookmarked
        ? prevData.bookmarkedQuestions.filter(bq => bq.question !== question.question)
        : [...prevData.bookmarkedQuestions, question],
    }));

    if (firebaseAuth.currentUser) {
        const uid = firebaseAuth.currentUser.uid;
        // Simple hash to avoid btoa issues with non-latin characters
        const hash = question.question.split('').reduce((acc, char) => {
            return ((acc << 5) - acc) + char.charCodeAt(0) | 0;
        }, 0);
        const bookmarkId = `bm_${Math.abs(hash)}_${question.question.length}`;
        const bookmarkRef = doc(db, 'users', uid, 'bookmarks', bookmarkId);
        
        try {
            if (isBookmarked) {
                await deleteDoc(bookmarkRef);
            } else {
                await setDoc(bookmarkRef, {
                    questionId: bookmarkId,
                    question: question,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (e) {
            console.error("Bookmark sync error", e);
        }
    }
  }, [progressData.bookmarkedQuestions]);

  const isBookmarked = useCallback((question: Question) => progressData.bookmarkedQuestions.some(bq => bq.question === question.question), [progressData.bookmarkedQuestions]);
  const handleViewBookmarks = useCallback(() => setView('bookmarks'), []);
  const handleViewStudyHub = useCallback(() => setView('study-hub'), []);
  const handleStartBookmarkReview = useCallback(() => handleStartQuiz({ difficulty: 'Easy', timer: 0, mode: 'BookmarkReview', category: 'All' }), [handleStartQuiz]);
  const handleBackToDashboard = useCallback(() => { setExamResults([]); setSessionSummary(null); setView('dashboard'); }, []);
  const handleResetProgress = useCallback(() => {
    let confirmReset = true;
    try {
      confirmReset = window.confirm(t('reset_confirm'));
    } catch (e) {
      console.warn("window.confirm is blocked in this environment, bypassing", e);
      confirmReset = true;
    }
    if (confirmReset) {
        setProgressData(INITIAL_PROGRESS);
        setView('dashboard');
    }
  }, [t]);

  const handleRegionChange = useCallback(async (newRegion: string) => {
    setProgressData(prev => ({ ...prev, region: newRegion }));
    if (firebaseAuth.currentUser) {
        const userRef = doc(db, 'users', firebaseAuth.currentUser.uid);
        await updateDoc(userRef, { region: newRegion }).catch(e => handleFirestoreError(e, 'update', 'users/region'));
    }
  }, []);

  const handleUpdateConfidenceRating = useCallback(async (question: Question, rating: number) => {
    setProgressData(prevData => {
      const updatedRatings = {
        ...(prevData.confidenceRatings || {}),
        [question.question]: {
          question,
          rating,
          timestamp: new Date().toISOString()
        }
      };

      const newData = {
        ...prevData,
        confidenceRatings: updatedRatings
      };

      if (firebaseAuth.currentUser) {
        const uid = firebaseAuth.currentUser.uid;
        const userRef = doc(db, 'users', uid);
        updateDoc(userRef, {
          confidenceRatings: updatedRatings,
          lastUpdated: serverTimestamp()
        }).catch(e => console.error("Firestore sync error for confidence ratings", e));
      }

      return newData;
    });
  }, []);

  const renderAppContent = () => {
    let content;
    switch (view) {
      case 'quiz':
        content = <Quiz 
                    {...quizSettings} 
                    bookmarkedQuestions={progressData.bookmarkedQuestions} 
                    onQuizEnd={handleQuizEnd} 
                    onToggleBookmark={handleToggleBookmark} 
                    isBookmarked={isBookmarked}
                    initialSession={activeSession}
                    onSaveAndExit={handleSaveAndExit}
                  />;
        break;
      case 'review':
        content = <SessionReview 
                    results={examResults} 
                    onBackToDashboard={handleBackToDashboard} 
                    theme={theme}
                    confidenceRatings={progressData.confidenceRatings || {}}
                    onUpdateConfidenceRating={handleUpdateConfidenceRating}
                  />;
        break;
      case 'bookmarks':
        content = <BookmarkedQuestions questions={progressData.bookmarkedQuestions} onToggleBookmark={handleToggleBookmark} onBackToDashboard={handleBackToDashboard} onStartQuiz={handleStartBookmarkReview} />;
        break;
      case 'study-hub':
        content = <StudyHub 
                    onBackToDashboard={handleBackToDashboard} 
                    categoryStats={progressData.categoryStats} 
                    onStartQuiz={handleStartQuiz} 
                    confidenceRatings={progressData.confidenceRatings || {}}
                    onUpdateConfidenceRating={handleUpdateConfidenceRating}
                    onToggleBookmark={handleToggleBookmark}
                    bookmarkedQuestions={progressData.bookmarkedQuestions}
                  />;
        break;
      case 'dashboard':
      default:
        content = <Dashboard 
                    progressData={progressData} 
                    onStartQuiz={handleStartQuiz} 
                    onViewBookmarks={handleViewBookmarks} 
                    onViewStudyHub={handleViewStudyHub}
                    onResetProgress={handleResetProgress} 
                    onDownloadPracticeExam={() => setShowPracticeExamModal(true)}
                    onRegionChange={handleRegionChange}
                    activeSession={activeSession}
                    onResumeSession={handleResumeSession}
                    onDiscardSession={handleDiscardActiveSession}
                    theme={theme} />;
    }
    return (
      <motion.div
        key={view}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="w-full font-sans"
      >
        {content}
      </motion.div>
    );
  };

  if (!authInitialized) return <div className="min-h-screen grid place-items-center bg-background"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent shadow-xl"></div></div>;

  if (!user && !isGuest) {
    return (
        <div className="bg-background text-foreground min-h-screen font-sans flex flex-col">
            <header className="py-4 border-b border-border bg-card/50 backdrop-blur-md">
                <div className="max-w-screen-2xl mx-auto px-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <img 
                            src="/Icono Baboula Data Lab.jpeg" 
                            alt="Baboulas Data Lab Logo" 
                            className="w-10 h-10 object-contain rounded-2xl shadow-md border border-border"
                            referrerPolicy="no-referrer"
                        />
                        <h1 className="text-2xl font-black tracking-tight text-primary font-sans uppercase">Baboulas Data Lab</h1>
                    </div>
                </div>
            </header>
            <main className="flex-1 flex items-center justify-center p-4">
                <Auth 
                    onAuthSuccess={(u) => { setUser(u); setIsGuest(false); }} 
                    onContinueAsGuest={() => setIsGuest(true)} 
                />
            </main>
        </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen font-sans relative">
      <MonsterBackground />
      <header className="py-4 border-b border-border bg-card/30 backdrop-blur-md print:hidden relative z-50">
        <div className="max-w-screen-2xl mx-auto px-4 flex justify-between items-center gap-4">
          <div className="flex-shrink-0 flex items-center gap-2 sm:gap-3 cursor-pointer group" onClick={handleBackToDashboard}>
            <img 
                src="/Icono Baboula Data Lab.jpeg" 
                alt="Baboulas Data Lab Logo" 
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-2xl shadow-md border border-border group-hover:scale-110 transition-transform duration-300"
                referrerPolicy="no-referrer"
            />
            <h1 className="text-base sm:text-2xl md:text-3xl font-black tracking-tight font-sans flex items-center gap-1 group">
                <span className="text-primary group-hover:text-secondary transition-colors font-sans uppercase">Baboulas</span>
                <span className="text-secondary bg-secondary/10 px-2 py-0.5 rounded-xl group-hover:bg-secondary/20 transition-colors font-sans uppercase">Data Lab</span>
                <span className="text-foreground/40 hidden sm:inline ml-2 text-lg font-medium tracking-normal font-sans">PL-300</span>
            </h1>

          </div>
          <div className="flex-shrink-0 flex items-center gap-2 sm:gap-4">
            {user && (
                <div className="hidden md:flex flex-shrink-0 items-center gap-3 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-border">
                    <UserIcon className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">{user.alias}</span>
                    <button 
                        onClick={async () => { await authService.logout(); window.location.reload(); }} 
                        className="p-1 hover:text-danger transition-colors"
                        title={t('logout')}
                    >
                        <LogoutIcon className="w-4 h-4" />
                    </button>
                </div>
            )}
            <div className="flex bg-card p-1 rounded-xl border border-border shadow-sm items-center">
                <button
                    onClick={() => setLanguage('en')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-black tracking-widest transition-all ${
                        language === 'en'
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-slate-400 hover:text-primary dark:hover:text-white'
                    }`}
                    title="Switch to English"
                >
                    EN
                </button>
                <button
                    onClick={() => setLanguage('es')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-black tracking-widest transition-all ${
                        language === 'es'
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-slate-400 hover:text-primary dark:hover:text-white'
                    }`}
                    title="Cambiar a Español"
                >
                    ES
                </button>
            </div>
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          </div>
        </div>
      </header>
      {!isOnline && (
        <div className="bg-amber-500/20 text-amber-500 border-b border-amber-500/30 py-2.5 px-4 text-xs font-bold text-center tracking-wide animate-fade-in flex items-center justify-center gap-2 relative z-50">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span>
            {language === 'es' 
              ? 'Modo sin conexión activo — Panel y el historial de exámenes recientes se cargan desde el almacenamiento local.' 
              : 'Offline Mode Active — Core dashboard and recent exam history are loaded from local cache.'}
          </span>
        </div>
      )}
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          {renderAppContent()}
        </AnimatePresence>
      </main>
       {showSummaryModal && sessionSummary && (
            <PerformanceSummaryModal summary={sessionSummary} onClose={handleCloseSummaryModal} />
        )}
        {showPracticeExamModal && (
            <PracticeExamDownloader onClose={() => setShowPracticeExamModal(false)} />
        )}
      <GeminiChat />
      <footer className="text-center py-4 text-slate-500 dark:text-slate-400 text-sm border-t border-border mt-8 print:hidden">
        <p>{t('app_powered_by')}</p>
      </footer>
    </div>
  );
};

export default App;