import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../utils/LanguageContext';
import type { ProgressData, Difficulty, TimerSetting, QuizMode, QuestionCategoryFilter, ExamResult, Question, ActiveSession } from '../types';
import { ProgressChart } from './ProgressChart';
import { StudyGuide } from './StudyGuide';
import { CurriculumHeatmap } from './CurriculumHeatmap';
import { CategoryStatsProgress } from './CategoryStatsProgress';
import { TrashIcon } from './icons/TrashIcon';
import { BookmarkIcon } from './icons/BookmarkIcon';
import { FlameIcon } from './icons/FlameIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TargetIcon } from './icons/TargetIcon';
import { calculateReadinessScore } from '../utils/readinessScore';
import { ExamReadinessGauge } from './ExamReadinessGauge';
import { InfoIcon } from './icons/InfoIcon';
import { DocumentDownloadIcon } from './icons/DocumentDownloadIcon';
import { SearchIcon } from './icons/SearchIcon';
import { QuestionDetail } from './QuestionDetail';
import { SparklesIcon } from './icons/SparklesIcon';
import { ExamCalendar } from './ExamCalendar';
import { StudyRoadmap } from './StudyRoadmap';
import { LayoutGrid, TrendingUp, BookOpen, Settings, Brain, Zap, Target, Award, Compass } from 'lucide-react';
import { DashboardSkeleton } from './Skeletons';
import { DexelMascot } from './DexelMascot';

interface DashboardProps {
    progressData: ProgressData;
    onStartQuiz: (settings: { difficulty: Difficulty; timer: TimerSetting; mode: QuizMode; category: QuestionCategoryFilter; }) => void;
    onViewBookmarks: () => void;
    onViewStudyHub: () => void;
    onResetProgress: () => void;
    onDownloadPracticeExam: () => void;
    onRegionChange: (region: string) => void;
    theme: 'light' | 'dim' | 'dark';
    activeSession?: ActiveSession | null;
    onResumeSession?: () => void;
    onDiscardSession?: () => void;
}

type TabType = 'practice' | 'roadmap' | 'analytics' | 'study_guide';

export const Dashboard: React.FC<DashboardProps> = ({ 
    progressData, 
    onStartQuiz, 
    onViewBookmarks, 
    onViewStudyHub, 
    onResetProgress, 
    onDownloadPracticeExam, 
    onRegionChange, 
    theme,
    activeSession = null,
    onResumeSession,
    onDiscardSession,
}) => {
    const { language, t } = useLanguage();
    const [activeTab, setActiveTab] = useState<TabType>('practice');
    const [difficulty, setDifficulty] = useState<Difficulty>('Adaptive');
    const [timer, setTimer] = useState<TimerSetting>(15);
    const [category, setCategory] = useState<QuestionCategoryFilter>('All');
    const [isLoading, setIsLoading] = useState(true);
    const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);

    useEffect(() => {
        setIsConfirmingDiscard(false);
    }, [activeSession]);

    useEffect(() => {
        if (!isConfirmingDiscard) return;
        const timerId = setTimeout(() => {
            setIsConfirmingDiscard(false);
        }, 4000);
        return () => clearTimeout(timerId);
    }, [isConfirmingDiscard]);

    useEffect(() => {
        setIsLoading(true);
        const timeout = setTimeout(() => {
            setIsLoading(false);
        }, 500);
        return () => clearTimeout(timeout);
    }, [activeTab]);

    const overallAccuracy = progressData.totalQuestions > 0 ? ((progressData.totalCorrect / progressData.totalQuestions) * 100).toFixed(1) + '%' : 'N/A';
    const readinessScore = calculateReadinessScore(progressData);

    const mascotMood = readinessScore > 75 ? 'happy' : readinessScore > 50 ? 'neutral' : 'thinking';

    const getStreakStyles = (streak: number) => {
        if (streak >= 10) return { color: 'text-red-500', animation: 'animate-pulse' };
        if (streak >= 5) return { color: 'text-orange-400', animation: '' };
        if (streak > 0) return { color: 'text-yellow-400', animation: '' };
        return { color: 'text-slate-500 dark:text-slate-400', animation: '' };
    };
    const streakStyles = getStreakStyles(progressData.currentStreak);

    const handleStartPractice = () => {
        onStartQuiz({ difficulty, timer, mode: 'Practice', category });
    };

    const handleStartExam = () => {
        onStartQuiz({ difficulty: 'Hard', timer: 10, mode: 'Exam', category: 'All' });
    };

    const handleResetPracticeSettings = () => {
        setDifficulty('Adaptive');
        setTimer(15);
        setCategory('All');
    };

    if (isLoading) {
        return (
            <div className="max-w-6xl mx-auto space-y-8 p-4 md:p-0 px-4 md:px-8 w-full">
                {/* Clean, Professional Tab Navigation for Study focus */}
                <div className="flex flex-col items-center gap-4 max-w-2xl mx-auto py-3">
                    <div className="flex flex-wrap sm:flex-nowrap justify-center bg-card/75 backdrop-blur-md p-1 rounded-2xl border border-border/80 shadow-md relative overflow-hidden gap-1 sm:gap-0">
                        <button
                            onClick={() => setActiveTab('practice')}
                            className={`relative z-10 flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all tracking-tight ${
                                activeTab === 'practice' 
                                ? 'bg-primary text-white shadow-sm' 
                                : 'text-slate-500 hover:text-primary'
                            }`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                            <span>{t('train_tab')}</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('roadmap')}
                            className={`relative z-10 flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all tracking-tight ${
                                activeTab === 'roadmap' 
                                ? 'bg-primary text-white shadow-sm' 
                                : 'text-slate-500 hover:text-primary'
                            }`}
                        >
                            <Compass className="w-4 h-4" />
                            <span>{t('roadmap_tab')}</span>
                        </button>
                        
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`relative z-10 flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all tracking-tight ${
                                activeTab === 'analytics' 
                                ? 'bg-primary/95 text-white shadow-sm' 
                                : 'text-slate-500 hover:text-primary'
                            }`}
                        >
                            <TrendingUp className="w-4 h-4" />
                            <span>{t('analytics_tab')}</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('study_guide')}
                            className={`relative z-10 flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all tracking-tight ${
                                activeTab === 'study_guide' 
                                ? 'bg-primary/90 text-white shadow-sm' 
                                : 'text-slate-500 hover:text-primary'
                            }`}
                        >
                            <BookOpen className="w-4 h-4" />
                            <span>{t('study_guide_tab')}</span>
                        </button>
                    </div>
                </div>
                <DashboardSkeleton />
            </div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto space-y-8 p-4 md:p-0 px-4 md:px-8 w-full"
        >

            {/* Elegant, Premium & Compact Tab Navigation */}
            <div className="flex flex-col items-center gap-4 max-w-2xl mx-auto py-3">
                <div className="flex flex-wrap sm:flex-nowrap justify-center bg-card/75 backdrop-blur-md p-1 rounded-2xl border border-border/80 shadow-md relative overflow-hidden gap-1 sm:gap-0">
                    <button
                        onClick={() => setActiveTab('practice')}
                        className={`relative z-10 flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all tracking-tight ${
                            activeTab === 'practice' 
                            ? 'bg-primary text-white shadow-sm' 
                            : 'text-slate-500 hover:text-primary'
                        }`}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        <span>{t('train_tab')}</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('roadmap')}
                        className={`relative z-10 flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all tracking-tight ${
                            activeTab === 'roadmap' 
                            ? 'bg-primary text-white shadow-sm' 
                            : 'text-slate-500 hover:text-primary'
                        }`}
                    >
                        <Compass className="w-4 h-4" />
                        <span>{t('roadmap_tab')}</span>
                    </button>
                    
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`relative z-10 flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all tracking-tight ${
                            activeTab === 'analytics' 
                            ? 'bg-primary/95 text-white shadow-sm' 
                            : 'text-slate-500 hover:text-primary'
                        }`}
                    >
                        <TrendingUp className="w-4 h-4" />
                        <span>{t('analytics_tab')}</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('study_guide')}
                        className={`relative z-10 flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all tracking-tight ${
                            activeTab === 'study_guide' 
                            ? 'bg-primary/90 text-white shadow-sm' 
                            : 'text-slate-500 hover:text-primary'
                        }`}
                    >
                        <BookOpen className="w-4 h-4" />
                        <span>{t('study_guide_tab')}</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {activeTab === 'practice' ? (
                            <>
                                {activeSession && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="lg:col-span-12 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-primary/10 border-2 border-amber-500/50 p-6 rounded-[2.5rem] shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden backdrop-blur-md"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-inner">
                                                <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">
                                                    {language === 'es' ? 'Sesión de Prueba Guardada' : 'Saved Practice Session'}
                                                </h4>
                                                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono">
                                                    <span>{activeSession.mode === 'Exam' ? (language === 'es' ? 'Simulación de Examen' : 'Exam Simulation') : (language === 'es' ? 'Modo de Práctica' : 'Practice Mode')}</span>
                                                    <span className="opacity-40">•</span>
                                                    <span>{activeSession.category}</span>
                                                    <span className="opacity-40">•</span>
                                                    <span>{language === 'es' ? `Pregunta ${activeSession.currentQuestionIndex + 1}/10` : `Question ${activeSession.currentQuestionIndex + 1}/10`}</span>
                                                    {activeSession.timer > 0 && activeSession.timeLeft !== Infinity && (
                                                        <>
                                                            <span className="opacity-40">•</span>
                                                            <span>{Math.floor(activeSession.timeLeft / 60)}m {activeSession.timeLeft % 60}s {language === 'es' ? 'restante' : 'remaining'}</span>
                                                        </>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 relative z-10 w-full md:w-auto shrink-0">
                                            <button
                                                onClick={() => {
                                                    if (isConfirmingDiscard) {
                                                        onDiscardSession?.();
                                                        setIsConfirmingDiscard(false);
                                                    } else {
                                                        setIsConfirmingDiscard(true);
                                                    }
                                                }}
                                                className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl border transition-all shadow-sm active:scale-95 font-black text-xs ${
                                                    isConfirmingDiscard 
                                                        ? 'bg-red-500 border-red-500 text-white hover:bg-red-600' 
                                                        : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/10'
                                                }`}
                                            >
                                                {isConfirmingDiscard 
                                                    ? (language === 'es' ? '¿Confirmar?' : 'Are you sure?') 
                                                    : (language === 'es' ? 'Descartar' : 'Discard')
                                                }
                                            </button>
                                            <button
                                                onClick={onResumeSession}
                                                className="flex-1 md:flex-none px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>{language === 'es' ? 'Reanudar' : 'Resume'}</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Hero Section with New Brand Identity */}
                                <div className="lg:col-span-12 flex flex-col md:flex-row items-center gap-6 bg-gradient-to-br from-primary/5 via-card/80 to-secondary/5 p-6 md:p-8 rounded-3xl border border-border/80 shadow-md relative overflow-hidden backdrop-blur-sm">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
                                    <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>

                                    {/* Centered Dynamic Welcoming Text with generous reading layouts */}
                                    <div className="space-y-2.5 text-center md:text-left relative z-10 flex-1">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center md:justify-start">
                                            <h2 className="text-xl md:text-3xl font-black font-display tracking-tight text-foreground leading-none flex items-center gap-2 justify-center md:justify-start">
                                                <span className="text-primary font-sans uppercase">Baboulas</span> 
                                                <span className="text-secondary font-sans uppercase">Data Lab</span>
                                            </h2>
                                            <div className="inline-flex self-center sm:self-auto items-center bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                <span>{t('method_title')}</span>
                                            </div>
                                        </div>

                                        <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 font-medium max-w-xl leading-relaxed">
                                            {language === 'es' ? (
                                                <>Impulsa tu preparación para la certificación <span className="text-primary font-bold">PL-300 Power BI</span> con entrenamientos interactivos de alto rendimiento.</>
                                            ) : (
                                                <>Empower your <span className="text-primary font-bold">PL-300 Power BI</span> certification journey with interactive high-performance workouts.</>
                                            )}
                                        </p>
                                        
                                        <div className="pt-1 flex flex-wrap gap-2 justify-center md:justify-start">
                                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-muted-foreground uppercase border border-border/60 bg-card/60 px-2.5 py-1 rounded-lg">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                {t('official_portal')}
                                            </span>
                                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-muted-foreground uppercase border border-border/60 bg-card/60 px-2.5 py-1 rounded-lg">
                                                📊 {t('optimized_focus')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Dexel Mascot on the Right Side of the Hero */}
                                    <div className="w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60 lg:w-68 lg:h-68 flex-shrink-0 relative z-10 select-none flex flex-col items-center justify-center">
                                        <DexelMascot 
                                            mood="cheering" 
                                            showBubble={true}
                                            message={language === 'es' ? "¡Hola! ¿Listo para entrenar? ¡Haz clic aquí para chatear con Dexel!" : "Hey! Ready to study? Click here to chat with Dexel!"}
                                            className="w-full h-full"
                                        />
                                    </div>
                                </div>

                                {/* Left Side: Quiz Settings */}
                                <motion.div 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="lg:col-span-7 space-y-8"
                                >
                                    <div className="bg-card p-8 rounded-3xl shadow-xl border border-border space-y-6 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                                        {/* Monster Spot Decoration */}
                                        <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-secondary/10 rounded-full blur-xl"></div>
                                        <div className="flex justify-between items-center relative z-10">
                                            <h3 className="text-2xl font-black tracking-tight flex items-center gap-2 font-display">
                                                <Settings className="w-6 h-6 text-primary" /> 
                                                {t('practice_session')}
                                            </h3>
                                            <button onClick={handleResetPracticeSettings} className="text-xs font-bold text-slate-500 hover:text-primary transition-colors hover:scale-105">{t('reset')}</button>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-slate-500 uppercase flex items-center gap-1.5">{t('difficulty')} <InfoIcon className="w-3 h-3" /></label>
                                                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className="w-full bg-input border border-border rounded-xl p-3 font-semibold text-foreground">
                                                    <option value="Adaptive">{t('adaptive')}</option>
                                                    <option value="Easy">{t('easy')}</option>
                                                    <option value="Medium">{t('medium')}</option>
                                                    <option value="Hard">{t('hard')}</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-slate-500 uppercase">{t('category')}</label>
                                                <select value={category} onChange={(e) => setCategory(e.target.value as QuestionCategoryFilter)} className="w-full bg-input border border-border rounded-xl p-3 font-semibold text-foreground">
                                                    <option value="All">{t('all_categories')}</option>
                                                    <option value="Prepare the data">{t('prep_data')}</option>
                                                    <option value="Model the data">{t('model_data')}</option>
                                                    <option value="Visualize and analyze the data">{t('viz_data')}</option>
                                                    <option value="Deploy and maintain assets">{t('deploy_assets')}</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-500 uppercase">{t('timer')}</label>
                                            <select value={timer} onChange={(e) => setTimer(Number(e.target.value) as TimerSetting)} className="w-full bg-input border border-border rounded-xl p-3 font-semibold text-foreground">
                                                <option value={15}>{t('timer_15')}</option>
                                                <option value={10}>{t('timer_10')}</option>
                                                <option value={5}>{t('timer_5')}</option>
                                                <option value={0}>{t('timer_unlimited')}</option>
                                            </select>
                                        </div>

                                        <button onClick={handleStartPractice} className="group relative w-full overflow-hidden bg-gradient-to-r from-primary via-teal-500 to-primary text-white font-black py-5 px-6 rounded-2xl text-xl shadow-[0_15px_30px_-10px_rgba(var(--primary),0.5)] transition-all hover:scale-[1.02] hover:shadow-[0_20px_40px_-10px_rgba(var(--primary),0.6)] active:scale-95">
                                            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                                            {/* Monster Spots */}
                                            <div className="absolute top-1 left-2 w-4 h-4 bg-white/10 rounded-full blur-sm"></div>
                                            <div className="absolute bottom-2 right-4 w-6 h-6 bg-white/5 rounded-full blur-md"></div>
                                            <span className="relative z-10 flex items-center justify-center gap-2">
                                                {t('start_practice')}
                                            </span>
                                        </button>

                                    </div>

                                    <div className="bg-card p-8 rounded-3xl shadow-xl border border-border overflow-hidden relative group">
                                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-danger/10 rotate-45 rounded-xl border-4 border-danger/5 group-hover:rotate-90 transition-transform duration-500"></div>
                                        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center">
                                            <div className="flex-1 space-y-2">
                                                <h4 className="text-2xl font-black flex items-center gap-2"><FlameIcon className="w-6 h-6 text-red-500" /> {t('exam_sim')}</h4>
                                                <p className="text-sm text-slate-500 font-medium">{t('exam_desc')}</p>
                                            </div>
                                            <button onClick={handleStartExam} className="group relative w-full md:w-auto px-10 py-5 bg-gradient-to-r from-red-600 via-orange-500 to-red-500 text-white rounded-[2rem] font-black text-xl shadow-[0_15px_30px_-10px_rgba(220,38,38,0.5)] hover:shadow-[0_20px_40px_-10px_rgba(220,38,38,0.6)] hover:-translate-y-2 active:scale-95 transition-all flex items-center justify-center gap-3 overflow-hidden">
                                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                                {/* Monster Spots */}
                                                <div className="absolute top-2 right-4 w-5 h-5 bg-white/10 rounded-full blur-sm"></div>
                                                <div className="absolute bottom-1 left-2 w-3 h-3 bg-white/20 rounded-full"></div>
                                                <FlameIcon className="w-6 h-6 relative z-10 animate-pulse" />
                                                <span className="relative z-10">{t('start_exam')}</span>
                                            </button>

                                        </div>
                                    </div>
                                </motion.div>

                                {/* Right Side: Schedule and Quick Links */}
                                <motion.div 
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="lg:col-span-5 space-y-6"
                                >
                                    <ExamCalendar 
                                        currentRegion={progressData.region} 
                                        onRegionChange={onRegionChange} 
                                    />
                                    
                                    <div className="grid grid-cols-1 gap-4">
                                        <motion.button 
                                            whileHover={{ y: -2, scale: 1.01 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={onViewBookmarks} 
                                            className="w-full bg-card hover:bg-border border border-border p-5 rounded-2xl flex items-center justify-between font-bold shadow-sm transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-yellow-400/10 rounded-lg">
                                                    <BookmarkIcon filled={true} className="text-yellow-400 w-5 h-5" />
                                                </div>
                                                <span className="font-display">{t('bookmarked_questions_count', { count: progressData.bookmarkedQuestions.length })}</span>
                                            </div>
                                            <svg className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                        </motion.button>
                                        
                                        <motion.button 
                                            whileHover={{ y: -2, scale: 1.01 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={onDownloadPracticeExam} 
                                            className="w-full bg-card hover:bg-border border border-border p-5 rounded-2xl flex items-center justify-between font-bold shadow-sm transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-primary/10 rounded-lg">
                                                    <DocumentDownloadIcon className="text-primary w-5 h-5" />
                                                </div>
                                                <span className="font-display">{t('download_exam_txt')}</span>
                                            </div>
                                            <svg className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                        </motion.button>
                                    </div>

                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="bg-card p-6 rounded-2xl border border-border relative overflow-hidden"
                                    >
                                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-red-500/5 rounded-full blur-xl"></div>
                                        <div className="flex items-center justify-between relative z-10">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-red-500/10 rounded-lg">
                                                    <FlameIcon className={`w-6 h-6 ${streakStyles.color}`} />
                                                </div>
                                                <span className="font-bold text-slate-500 font-display">{t('study_streak')}</span>
                                            </div>
                                            <span className={`text-4xl font-black ${streakStyles.color} font-mono tracking-tighter`}>{progressData.currentStreak}</span>
                                        </div>
                                    </motion.div>
                                </motion.div>

                                {/* El Método Baboulas - Clean & Professional Pillars (Moved to Bottom) */}
                                <motion.div 
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.05 }}
                                    className="lg:col-span-12 bg-card border border-border/80 rounded-[2rem] p-6 md:p-8 shadow-sm relative overflow-hidden mt-4"
                                >
                                    <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
                                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-2xl pointer-events-none"></div>
                                    
                                    <div className="relative z-10 space-y-6">
                                        <div className="text-center max-w-2xl mx-auto space-y-2">
                                            <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                                                <Zap className="w-3.5 h-3.5 text-primary" /> {t('method_title')}
                                            </div>
                                            <h3 className="text-2xl md:text-3xl font-black font-display tracking-tight text-foreground">
                                                {t('why_baboulas')}
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                                                {t('why_baboulas_desc')}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {/* Pillar 1 */}
                                            <div className="bg-background/40 dark:bg-background/20 border border-border/60 p-5 rounded-xl hover:border-primary/30 hover:shadow-md transition-all group/pillar flex flex-col justify-between space-y-3">
                                                <div className="space-y-2">
                                                    <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 group-hover/pillar:scale-110 transition-transform">
                                                        <Brain className="w-4.5 h-4.5" />
                                                    </div>
                                                    <h4 className="font-extrabold text-base text-foreground font-display">{t('pillar1_title')}</h4>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                                                        {t('pillar1_desc')}
                                                    </p>
                                                </div>
                                                <div className="text-[9px] font-black text-violet-500 uppercase tracking-wider">{t('pillar1_tag')}</div>
                                            </div>

                                            {/* Pillar 2 */}
                                            <div className="bg-background/40 dark:bg-background/20 border border-border/60 p-5 rounded-xl hover:border-primary/30 hover:shadow-md transition-all group/pillar flex flex-col justify-between space-y-3">
                                                <div className="space-y-2">
                                                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover/pillar:scale-110 transition-transform">
                                                        <Zap className="w-4.5 h-4.5" />
                                                    </div>
                                                    <h4 className="font-extrabold text-base text-foreground font-display">{t('pillar2_title')}</h4>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                                                        {t('pillar2_desc')}
                                                    </p>
                                                </div>
                                                <div className="text-[9px] font-black text-emerald-500 uppercase tracking-wider">{t('pillar2_tag')}</div>
                                            </div>

                                            {/* Pillar 3 */}
                                            <div className="bg-background/40 dark:bg-background/20 border border-border/60 p-5 rounded-xl hover:border-primary/30 hover:shadow-md transition-all group/pillar flex flex-col justify-between space-y-3">
                                                <div className="space-y-2">
                                                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover/pillar:scale-110 transition-transform">
                                                        <Target className="w-4.5 h-4.5" />
                                                    </div>
                                                    <h4 className="font-extrabold text-base text-foreground font-display">{t('pillar3_title')}</h4>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                                                        {t('pillar3_desc')}
                                                    </p>
                                                </div>
                                                <div className="text-[9px] font-black text-blue-500 uppercase tracking-wider">{t('pillar3_tag')}</div>
                                            </div>

                                            {/* Pillar 4 */}
                                            <div className="bg-background/40 dark:bg-background/20 border border-border/60 p-5 rounded-xl hover:border-primary/30 hover:shadow-md transition-all group/pillar flex flex-col justify-between space-y-3">
                                                <div className="space-y-2">
                                                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover/pillar:scale-110 transition-transform">
                                                        <Award className="w-4.5 h-4.5" />
                                                    </div>
                                                    <h4 className="font-extrabold text-base text-foreground font-display">{t('pillar4_title')}</h4>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                                                        {t('pillar4_desc')}
                                                    </p>
                                                </div>
                                                <div className="text-[9px] font-black text-amber-500 uppercase tracking-wider">{t('pillar4_tag')}</div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </>
                        ) : activeTab === 'roadmap' ? (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="lg:col-span-12"
                            >
                                <StudyRoadmap 
                                    categoryStats={progressData.categoryStats}
                                    onStartPracticeCategory={(category) => {
                                        onStartQuiz({ difficulty: 'Adaptive', timer: 15, mode: 'Practice', category });
                                    }}
                                    theme={theme}
                                />
                            </motion.div>
                        ) : activeTab === 'analytics' ? (
                            <>
                                {/* Performance Hub Top Grid */}
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="lg:col-span-8 space-y-6"
                                >
                                    <div className="bg-card p-4 md:p-8 rounded-3xl border border-border shadow-lg relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                                        <h3 className="text-xl font-black mb-6 flex items-center gap-2 relative z-10 font-display">
                                            <TrendingUp className="w-6 h-6 text-primary" /> 
                                            {t('your_evolution')}
                                        </h3>
                                        <div className="relative z-10 h-[300px]">
                                            <ProgressChart 
                                                categoryData={progressData.categoryStats} 
                                                historyData={progressData.accuracyHistory}
                                                theme={theme}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="bg-card p-6 md:p-8 rounded-3xl border border-border flex items-center justify-between group hover:shadow-xl transition-all relative overflow-hidden">
                                            <div className="flex items-center gap-4 relative z-10">
                                                <div className="p-3 bg-primary/10 rounded-2xl group-hover:bg-primary transition-colors shrink-0">
                                                    <PencilIcon className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-3xl font-black font-mono tracking-tighter">{progressData.totalQuestions}</span>
                                                    <span className="font-bold text-slate-500 uppercase text-[10px] tracking-widest font-display">{t('questions')}</span>
                                                </div>
                                            </div>
                                            <div className="text-slate-200 dark:text-slate-800 font-black text-6xl select-none absolute right-4 opacity-10">P</div>
                                        </div>
                                        <div className="bg-card p-6 md:p-8 rounded-3xl border border-border flex items-center justify-between group hover:shadow-xl transition-all relative overflow-hidden">
                                            <div className="flex items-center gap-4 relative z-10">
                                                <div className="p-3 bg-success/10 rounded-2xl group-hover:bg-success transition-colors shrink-0">
                                                    <TargetIcon className="w-6 h-6 text-success group-hover:text-white transition-colors" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-3xl font-black font-mono tracking-tighter">{overallAccuracy}</span>
                                                    <span className="font-bold text-slate-500 uppercase text-[10px] tracking-widest font-display">{t('accuracy')}</span>
                                                </div>
                                            </div>
                                            <div className="text-slate-200 dark:text-slate-800 font-black text-6xl select-none absolute right-4 opacity-10">%</div>
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div 
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="lg:col-span-4 space-y-6"
                                >
                                    <ExamReadinessGauge score={readinessScore} theme={theme} />
                                    
                                    <CategoryStatsProgress categoryStats={progressData.categoryStats} />
                                    
                                    <div className="flex justify-center pt-4">
                                        <button onClick={onResetProgress} className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-danger transition-colors uppercase tracking-[0.2em] py-2 px-4 rounded-xl hover:bg-danger/5">
                                            <TrashIcon className="w-4 h-4" /> {t('reset_data')}
                                        </button>
                                    </div>
                                </motion.div>

                                {/* Full Width Curriculum Heatmap */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="lg:col-span-12 w-full overflow-hidden"
                                >
                                    <CurriculumHeatmap categoryStats={progressData.categoryStats} theme={theme} />
                                </motion.div>
                            </>
                        ) : (
                            <>
                                {/* Study Guide Hub View */}
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="lg:col-span-8 space-y-8"
                                >
                                    <StudyGuide categoryStats={progressData.categoryStats} />
                                </motion.div>

                                <motion.div 
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="lg:col-span-4 space-y-6"
                                >
                                    <div className="bg-gradient-to-br from-indigo-600 via-primary to-purple-600 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                                        {/* Monster Horn Pattern */}
                                        <div className="absolute top-2 left-2 flex gap-1 opacity-20">
                                            <div className="w-4 h-4 bg-white rounded-full"></div>
                                            <div className="w-2 h-2 bg-white rounded-full mt-2"></div>
                                        </div>
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                                    <SparklesIcon className="w-6 h-6 text-white" />
                                                </div>
                                                <h3 className="text-2xl font-black font-display">{t('study_hub')}</h3>
                                            </div>
                                            <p className="text-sm text-white/80 mb-8 font-medium leading-relaxed">{t('study_hub_desc')}</p>
                                            <button onClick={onViewStudyHub} className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-black py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 group-hover:shadow-white/20">
                                                {t('enter_hub')}
                                                <BookOpen className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Clean Offline Study Guidance Card */}
                                    <div className="bg-card p-6 rounded-3xl border border-border relative overflow-hidden">
                                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-xl"></div>
                                        <h4 className="font-extrabold text-sm text-foreground mb-2 flex items-center gap-1.5 font-display relative z-10">
                                            💡 {language === 'es' ? 'Concentración Activa' : 'Active Study Tip'}
                                        </h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium relative z-10">
                                            {language === 'es' 
                                                ? 'Estudiar sobre papel incrementa la retención de datos técnicos en un 40%. Imprime guías compactas generadas por IA y repásalas libre de pantallas.' 
                                                : 'Studying on paper increases technical data retention by 40%. Generate compact AI-designed guides, print them out, and study offline.'}
                                        </p>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </div>
            </motion.div>
    );
};
