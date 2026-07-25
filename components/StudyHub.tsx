import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { OFFLINE_FLASHCARDS } from '../utils/offlineFlashcards';
import { generatePracticeExamStream, generateSpeech, generateQuestion, getPersonalizedFeedback } from '../services/geminiService';
import { Loader } from './Loader';
import { SparklesIcon } from './icons/SparklesIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { useLanguage } from '../utils/LanguageContext';
import type { CategoryStat, Difficulty, TimerSetting, QuizMode, QuestionCategoryFilter, QuestionCategory, Question } from '../types';
import { 
    Activity, 
    BookOpen, 
    Compass, 
    CheckCircle2, 
    XCircle, 
    HelpCircle, 
    Play, 
    Award, 
    TrendingDown, 
    Lightbulb, 
    Sparkles,
    ChevronLeft,
    ChevronRight,
    Check,
    RotateCw,
    X,
    Flame,
    Star,
    Bookmark,
    BookmarkCheck,
    ThumbsUp,
    ThumbsDown,
    Brain,
    Zap
} from 'lucide-react';

declare const saveAs: (blob: Blob, filename: string) => void;

interface StudyHubProps {
    onBackToDashboard: () => void;
    categoryStats?: {
        'Prepare the data': CategoryStat;
        'Model the data': CategoryStat;
        'Visualize and analyze the data': CategoryStat;
        'Deploy and maintain assets': CategoryStat;
    };
    onStartQuiz?: (settings: { difficulty: Difficulty; timer: TimerSetting; mode: QuizMode; category: QuestionCategoryFilter; }) => void;
    confidenceRatings?: Record<string, { question: Question; rating: number; timestamp: string }>;
    onUpdateConfidenceRating?: (question: Question, rating: number) => void;
    onToggleBookmark?: (question: Question) => void;
    bookmarkedQuestions?: Question[];
}

type QuestionCount = 25 | 50 | 100;
type FontSize = 'sm' | 'base' | 'lg' | 'xl';
type TabType = 'guide' | 'knowledge_check' | 'flashcards';

const DEFAULT_CATEGORY_STATS = {
    'Prepare the data': { correct: 0, total: 0 },
    'Model the data': { correct: 0, total: 0 },
    'Visualize and analyze the data': { correct: 0, total: 0 },
    'Deploy and maintain assets': { correct: 0, total: 0 }
};

export const StudyHub: React.FC<StudyHubProps> = ({ 
    onBackToDashboard, 
    categoryStats = DEFAULT_CATEGORY_STATS,
    onStartQuiz,
    confidenceRatings = {},
    onUpdateConfidenceRating,
    onToggleBookmark,
    bookmarkedQuestions = []
}) => {
    const { t, language } = useLanguage();
    const [activeTab, setActiveTab] = useState<TabType>('knowledge_check'); // Default to knowledge check to drive engagement
    
    // Existing Study Guide States
    const [isGenerating, setIsGenerating] = useState(false);
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [selectedCount, setSelectedCount] = useState<QuestionCount>(25);
    const [includeAnswers, setIncludeAnswers] = useState(true);
    const [fontSize, setFontSize] = useState<FontSize>('base');

    // Flashcard Simulator States
    const [flashcardDeck, setFlashcardDeck] = useState<Question[]>([]);
    const [flashcardIndex, setFlashcardIndex] = useState(0);
    const [flashcardFlipped, setFlashcardFlipped] = useState(false);
    const [flashcardSelectedOption, setFlashcardSelectedOption] = useState<string | null>(null);
    const [isFlashcardSessionActive, setIsFlashcardSessionActive] = useState(false);
    const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
    const [flashcardsGenerationProgress, setFlashcardsGenerationProgress] = useState(0);
    const [flashcardConfig, setFlashcardConfig] = useState({
        category: 'All' as QuestionCategoryFilter,
        difficulty: 'Adaptive' as Difficulty,
        size: 5 as number,
        mode: 'offline' as 'offline' | 'ai'
    });

    // Independent Performance state saved in localStorage
    const [flashcardStats, setFlashcardStats] = useState(() => {
        try {
            const saved = localStorage.getItem('pl300_flashcard_performance');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (typeof parsed.totalViewed === 'number') return parsed;
            }
        } catch (e) {
            console.error("Failed to load flashcard performance", e);
        }
        return { totalViewed: 0, masteredCount: 0, reviewCount: 0 };
    });

    // Reset Flashcard Stats
    const handleResetFlashcardStats = () => {
        const defaultStats = { totalViewed: 0, masteredCount: 0, reviewCount: 0 };
        setFlashcardStats(defaultStats);
        localStorage.setItem('pl300_flashcard_performance', JSON.stringify(defaultStats));
    };

    // Load / Generate Flashcards deck
    const handleStartFlashcards = async () => {
        setIsGeneratingFlashcards(true);
        setFlashcardsGenerationProgress(0);
        setErrorMsg('');

        try {
            if (flashcardConfig.mode === 'offline') {
                // Filter offline cards based on config
                let filtered = OFFLINE_FLASHCARDS;
                if (flashcardConfig.category !== 'All') {
                    filtered = filtered.filter(q => q.category === flashcardConfig.category);
                }
                if (flashcardConfig.difficulty !== 'Adaptive') {
                    filtered = filtered.filter(q => q.difficulty === flashcardConfig.difficulty);
                }

                // If filter is too restrictive, fall back to any offline cards
                if (filtered.length === 0) {
                    filtered = OFFLINE_FLASHCARDS;
                }

                // Shuffle and slice to desired size
                const shuffled = [...filtered].sort(() => 0.5 - Math.random());
                const finalDeck = shuffled.slice(0, flashcardConfig.size);
                
                setFlashcardDeck(finalDeck);
                setFlashcardIndex(0);
                setFlashcardFlipped(false);
                setFlashcardSelectedOption(null);
                setIsFlashcardSessionActive(true);
            } else {
                // Generate dynamically with Gemini API!
                const generated: Question[] = [];
                const totalToGen = flashcardConfig.size;
                
                for (let i = 0; i < totalToGen; i++) {
                    setFlashcardsGenerationProgress(i + 1);
                    const q = await generateQuestion(
                        flashcardConfig.difficulty, 
                        flashcardConfig.category, 
                        language === 'es' ? 'es' : 'en'
                    );
                    generated.push(q);
                }

                setFlashcardDeck(generated);
                setFlashcardIndex(0);
                setFlashcardFlipped(false);
                setFlashcardSelectedOption(null);
                setIsFlashcardSessionActive(true);
            }
        } catch (err) {
            console.error("Error generating flashcards via AI, falling back to offline", err);
            // Fallback gracefully to offline questions of same category
            let filtered = OFFLINE_FLASHCARDS;
            if (flashcardConfig.category !== 'All') {
                filtered = filtered.filter(q => q.category === flashcardConfig.category);
            }
            const shuffled = [...filtered].sort(() => 0.5 - Math.random());
            const finalDeck = shuffled.slice(0, flashcardConfig.size);
            
            setFlashcardDeck(finalDeck);
            setFlashcardIndex(0);
            setFlashcardFlipped(false);
            setFlashcardSelectedOption(null);
            setIsFlashcardSessionActive(true);
            
            // Set error warning but let the session start anyway
            setErrorMsg(language === 'es' 
                ? 'El generador de IA no está disponible o se agostó el tiempo de espera. Hemos cargado fichas sin conexión para ti.' 
                : 'AI generator is currently busy or offline. Loaded expert-curated offline cards for you.');
        } finally {
            setIsGeneratingFlashcards(false);
        }
    };

    const handleMarkCardPerformance = (mastered: boolean) => {
        setFlashcardStats((prev: any) => {
            const updated = {
                totalViewed: prev.totalViewed + 1,
                masteredCount: prev.masteredCount + (mastered ? 1 : 0),
                reviewCount: prev.reviewCount + (mastered ? 0 : 1)
            };
            localStorage.setItem('pl300_flashcard_performance', JSON.stringify(updated));
            return updated;
        });

        // Advance card or wrap up
        if (flashcardIndex < flashcardDeck.length - 1) {
            setFlashcardFlipped(false);
            setFlashcardSelectedOption(null);
            setTimeout(() => {
                setFlashcardIndex(prev => prev + 1);
            }, 300);
        } else {
            // Finished session!
            setIsFlashcardSessionActive(false);
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    };

    // Knowledge Check States
    const categories: QuestionCategory[] = [
        'Prepare the data',
        'Model the data',
        'Visualize and analyze the data',
        'Deploy and maintain assets'
    ];

    // Compute category rankings (weak spots)
    const analyzedCategories = useMemo(() => {
        return categories.map(cat => {
            const stat = categoryStats[cat] || { correct: 0, total: 0 };
            const accuracy = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
            
            let status: 'untested' | 'critical' | 'needs_work' | 'mastered' = 'untested';
            if (stat.total > 0) {
                if (accuracy < 60) status = 'critical';
                else if (accuracy < 80) status = 'needs_work';
                else status = 'mastered';
            }

            return {
                category: cat,
                correct: stat.correct,
                total: stat.total,
                accuracy,
                status
            };
        });
    }, [categoryStats]);

    // Sorted: Untested first, then lowest accuracy first
    const sortedRecommendations = useMemo(() => {
        return [...analyzedCategories].sort((a, b) => {
            if (a.total === 0 && b.total > 0) return -1;
            if (b.total === 0 && a.total > 0) return 1;
            return a.accuracy - b.accuracy;
        });
    }, [analyzedCategories]);

    const [selectedCategory, setSelectedCategory] = useState<QuestionCategory>(
        sortedRecommendations[0]?.category || 'Prepare the data'
    );

    // Quick Test states
    const [quickQuestion, setQuickQuestion] = useState<Question | null>(null);
    const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [quickSubmitted, setQuickSubmitted] = useState(false);
    const [quickFeedback, setQuickFeedback] = useState('');
    const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const activeCategoryInfo = useMemo(() => {
        return analyzedCategories.find(c => c.category === selectedCategory) || {
            category: selectedCategory,
            correct: 0,
            total: 0,
            accuracy: 0,
            status: 'untested' as const
        };
    }, [analyzedCategories, selectedCategory]);

    const lowConfidenceQuestions = useMemo(() => {
        const ratingsArray = Object.values(confidenceRatings) as { question: Question; rating: number; timestamp: string }[];
        return ratingsArray
            .filter(item => item.rating <= 3)
            .sort((a, b) => {
                if (a.rating !== b.rating) {
                    return a.rating - b.rating; // Lowest rating first
                }
                return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(); // Newest first
            });
    }, [confidenceRatings]);

    const [expandedLowConfidenceIndex, setExpandedLowConfidenceIndex] = useState<number | null>(null);

    // Handle Quick Check Question Generation
    const handleGenerateQuickQuestion = async () => {
        setIsGeneratingQuestion(true);
        setQuickQuestion(null);
        setSelectedOptions([]);
        setQuickSubmitted(false);
        setQuickFeedback('');
        setErrorMsg('');
        
        try {
            const q = await generateQuestion('Adaptive', selectedCategory, language === 'es' ? 'es' : 'en');
            setQuickQuestion(q);
        } catch (err) {
            setErrorMsg(language === 'es' ? 'Error al obtener la pregunta de la IA. Por favor, inténtalo de nuevo.' : 'Failed to retrieve question from AI. Please try again.');
        } finally {
            setIsGeneratingQuestion(false);
        }
    };

    // Toggle multi-select or single-select options
    const handleSelectOption = (option: string) => {
        if (quickSubmitted) return;
        if (quickQuestion?.type === 'MultiSelect') {
            setSelectedOptions(prev => 
                prev.includes(option) 
                    ? prev.filter(o => o !== option) 
                    : [...prev, option]
            );
        } else {
            setSelectedOptions([option]);
        }
    };

    // Answer check helper
    const isAnswerCorrect = useMemo(() => {
        if (!quickQuestion) return false;
        const ans = quickQuestion.answer;
        if (Array.isArray(ans)) {
            if (selectedOptions.length !== ans.length) return false;
            return selectedOptions.every(o => ans.includes(o));
        }
        return selectedOptions[0] === ans;
    }, [quickQuestion, selectedOptions]);

    const handleCheckAnswer = async () => {
        if (selectedOptions.length === 0 || !quickQuestion) return;
        setQuickSubmitted(true);
        setIsGeneratingFeedback(true);
        setQuickFeedback('');

        try {
            const feedback = await getPersonalizedFeedback(
                quickQuestion,
                quickQuestion.type === 'MultiSelect' ? selectedOptions : selectedOptions[0],
                isAnswerCorrect,
                language === 'es' ? 'es' : 'en',
                'detailed'
            );
            setQuickFeedback(feedback);
        } catch (err) {
            setQuickFeedback(quickQuestion.explanation);
        } finally {
            setIsGeneratingFeedback(false);
        }
    };

    // Existing Study Guide functions
    const generateQuickSet = async () => {
        setIsGenerating(true);
        setContent('');
        setTitle(language === 'es' ? `Set de Estudio Integrado PL-300` : `PL-300 Integrated Study Set`);
        try {
            await generatePracticeExamStream((chunk) => {
                setContent(prev => prev + chunk);
            }, selectedCount, language);
        } catch (err) {
            setContent(language === 'es' ? "Error durante la generación de la guía." : "Error during guide generation.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadTxt = () => {
        if (!content) return;
        
        let text = content;
        text = text.replace(/\[ANSWER_START\]/g, '\n--- ANSWER KEY ---\n')
                   .replace(/\[ANSWER_END\]/g, '\n------------------\n');
        
        if (!includeAnswers) {
            text = content.replace(/\[ANSWER_START\][\s\S]*?\[ANSWER_END\]/g, '\n[Answer Key Hidden]\n');
        }

        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, `PL300_StudyHub_${selectedCount}Q_${new Date().getTime()}.txt`);
    };

    const getFontSizeClass = () => {
        switch (fontSize) {
            case 'sm': return 'text-sm';
            case 'lg': return 'text-lg';
            case 'xl': return 'text-xl';
            default: return 'text-base';
        }
    };

    const processedContent = useMemo(() => {
        return content.replace(/\[ANSWER_START\]/g, '\n<div class="bg-primary/5 p-4 rounded-lg my-4 border-l-4 border-primary">')
                      .replace(/\[ANSWER_END\]/g, '</div>\n');
    }, [content]);

    return (
        <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-20">
            {/* Header section */}
            <div className="bg-card p-6 rounded-2xl shadow-xl border border-border flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4">
                    <button onClick={onBackToDashboard} className="p-2.5 hover:bg-border rounded-xl transition-all" aria-label="Go Back">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">
                            {language === 'es' ? 'Centro de Aprendizaje' : 'Learning Hub'}
                        </h2>
                        <p className="text-sm text-slate-400">
                            {language === 'es' ? 'Guías personalizadas y evaluación de debilidades en tiempo real' : 'Personalized guides & real-time weak spot evaluation'}
                        </p>
                    </div>
                </div>

                {/* Sub Tab Navigation */}
                <div className="inline-flex bg-slate-950/40 border border-border/80 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('knowledge_check')}
                        className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                            activeTab === 'knowledge_check' 
                                ? 'bg-primary text-primary-foreground shadow-md' 
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Compass className="w-4 h-4" />
                        <span>{t('knowledge_check_tab')}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('guide')}
                        className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                            activeTab === 'guide' 
                                ? 'bg-primary text-primary-foreground shadow-md' 
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <BookOpen className="w-4 h-4" />
                        <span>{t('study_guide_tab_hub')}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('flashcards')}
                        className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                            activeTab === 'flashcards' 
                                ? 'bg-primary text-primary-foreground shadow-md' 
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Brain className="w-4 h-4" />
                        <span>{language === 'es' ? 'Fichas' : 'Flashcards'}</span>
                    </button>
                </div>
            </div>

            {/* TAB 1: KNOWLEDGE CHECK */}
            {activeTab === 'knowledge_check' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Panel: Spot Analysis and Category Rank */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-md space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="w-5 h-5 text-primary" />
                                <h3 className="font-extrabold text-lg text-slate-200">
                                    {t('weak_areas_analysis')}
                                </h3>
                            </div>

                            <p className="text-xs text-slate-400 leading-relaxed">
                                {language === 'es' 
                                    ? 'Analizamos tus respuestas para priorizar temas no evaluados o con baja precisión.' 
                                    : 'We rank topics by prioritizing untested concepts or categories with lower accuracies.'
                                }
                            </p>

                            <div className="space-y-4 pt-2">
                                {sortedRecommendations.map((item, idx) => {
                                    const isSelected = selectedCategory === item.category;
                                    const isWeakest = idx === 0;

                                    return (
                                        <div 
                                            key={item.category}
                                            onClick={() => {
                                                setSelectedCategory(item.category);
                                                // Clear existing question state when shifting category
                                                setQuickQuestion(null);
                                                setSelectedOptions([]);
                                                setQuickSubmitted(false);
                                                setQuickFeedback('');
                                                setErrorMsg('');
                                            }}
                                            className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                                                isSelected 
                                                    ? 'bg-slate-900 border-primary/80 ring-1 ring-primary/40' 
                                                    : 'bg-slate-950/20 border-border/40 hover:border-slate-500 hover:bg-slate-950/40'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start gap-2">
                                                <span className="font-bold text-sm text-slate-100 leading-snug">
                                                    {item.category}
                                                </span>
                                                {isWeakest && (
                                                    <span className="text-[9px] shrink-0 font-black uppercase tracking-widest bg-danger/10 border border-danger/30 text-danger px-2 py-1 rounded-full flex items-center gap-1">
                                                        <Flame className="w-2.5 h-2.5 fill-current" />
                                                        {t('weakest_category')}
                                                    </span>
                                                )}
                                                {!isWeakest && item.status === 'untested' && (
                                                    <span className="text-[9px] shrink-0 font-black uppercase tracking-widest bg-amber-500/10 border border-amber-500/30 text-amber-500 px-2 py-1 rounded-full">
                                                        NEW
                                                    </span>
                                                )}
                                            </div>

                                            {/* Metrics row */}
                                            <div className="flex items-center justify-between text-xs text-slate-400 font-mono mt-3">
                                                <span>{t('questions_attempted')} <strong>{item.total}</strong></span>
                                                <span>{t('overall_accuracy')} <strong>{item.accuracy}%</strong></span>
                                            </div>

                                            {/* Custom clean progress bar */}
                                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
                                                <div 
                                                    className={`h-full rounded-full ${
                                                        item.status === 'untested' 
                                                            ? 'bg-slate-700' 
                                                            : item.status === 'critical'
                                                                ? 'bg-danger'
                                                                : item.status === 'needs_work'
                                                                    ? 'bg-amber-500'
                                                                    : 'bg-success'
                                                    }`}
                                                    style={{ width: `${item.accuracy}%` }}
                                                />
                                            </div>

                                            {/* Status Badge details */}
                                            <div className="text-[10px] font-bold mt-1 text-right">
                                                {item.status === 'untested' && <span className="text-slate-500">{t('priority_review')}</span>}
                                                {item.status === 'critical' && <span className="text-danger">{t('critical_warning')}</span>}
                                                {item.status === 'needs_work' && <span className="text-amber-500">{t('needs_work')}</span>}
                                                {item.status === 'mastered' && <span className="text-success">{t('mastery_achieved')}</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Recommendation Actions */}
                        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-3xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center gap-2">
                                <Award className="w-5 h-5 text-primary" />
                                <h4 className="font-extrabold text-slate-100 text-sm uppercase tracking-wider">
                                    {language === 'es' ? 'Práctica Personalizada Completa' : 'Full Custom Practice'}
                                </h4>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                {t('recommend_practice_desc')}
                            </p>
                            {onStartQuiz ? (
                                <button
                                    onClick={() => onStartQuiz({ difficulty: 'Adaptive', timer: 15, mode: 'Practice', category: selectedCategory })}
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black py-3 px-6 rounded-2xl text-xs uppercase tracking-widest transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2"
                                >
                                    <Play className="w-4 h-4 fill-current" />
                                    {t('start_targeted_practice')}
                                </button>
                            ) : (
                                <p className="text-[10px] text-slate-500 italic">
                                    {language === 'es' ? 'Acceso rápido disponible en el panel principal' : 'Quick launch available on dashboard'}
                                </p>
                            )}
                        </div>

                        {/* Low Confidence Focus Section */}
                        <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-md space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TrendingDown className="w-5 h-5 text-amber-500" />
                                    <h3 className="font-extrabold text-lg text-slate-200">
                                        {language === 'es' ? 'Foco en Baja Confianza' : 'Low Confidence Focus'}
                                    </h3>
                                </div>
                                <span className="text-xs font-mono bg-amber-500/10 border border-amber-500/30 text-amber-500 px-2 py-0.5 rounded-full">
                                    {lowConfidenceQuestions.length}
                                </span>
                            </div>

                            <p className="text-xs text-slate-400 leading-relaxed">
                                {language === 'es'
                                    ? 'Estas preguntas han sido marcadas con baja confianza (1-3 estrellas). Repásalas para mejorar tu dominio.'
                                    : 'Questions rated with 1-3 stars. Review explanations and update your confidence score directly here.'}
                            </p>

                            {lowConfidenceQuestions.length === 0 ? (
                                <div className="text-center py-6 border border-dashed border-border/40 rounded-2xl bg-slate-950/10">
                                    <Check className="w-8 h-8 text-success mx-auto mb-2" />
                                    <p className="text-xs text-slate-400 font-bold">
                                        {language === 'es' ? '¡Todo al día!' : 'All caught up!'}
                                    </p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                        {language === 'es' ? 'No tienes preguntas con baja confianza.' : 'No questions currently rated 1-3 stars.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                    {lowConfidenceQuestions.map((item, idx) => {
                                        const isExpanded = expandedLowConfidenceIndex === idx;
                                        const rating = item.rating;
                                        return (
                                            <div key={idx} className="border border-border/50 rounded-xl overflow-hidden bg-slate-950/10">
                                                <button
                                                    onClick={() => setExpandedLowConfidenceIndex(isExpanded ? null : idx)}
                                                    className="w-full p-3 text-left hover:bg-slate-950/20 transition-all flex items-center justify-between gap-2"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-slate-200 truncate">{item.question.question}</p>
                                                        <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wide font-mono truncate">{item.question.category}</p>
                                                    </div>
                                                    <div className="flex items-center gap-0.5 shrink-0">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <Star 
                                                                key={star} 
                                                                className={`w-3 h-3 ${
                                                                    star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
                                                                }`} 
                                                            />
                                                        ))}
                                                    </div>
                                                </button>
                                                
                                                {isExpanded && (
                                                    <div className="p-4 bg-slate-950/25 border-t border-border/40 space-y-3">
                                                        <div className="space-y-1">
                                                            <p className="text-xs font-bold text-slate-300">Question:</p>
                                                            <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-border/40">{item.question.question}</p>
                                                        </div>

                                                        <div className="space-y-1">
                                                            <p className="text-xs font-bold text-slate-300">Correct Answer:</p>
                                                            <p className="text-xs text-emerald-400 font-bold bg-emerald-500/5 p-2.5 rounded-lg border border-emerald-500/20">
                                                                {Array.isArray(item.question.answer) ? item.question.answer.join(', ') : item.question.answer}
                                                            </p>
                                                        </div>

                                                        <div className="space-y-1">
                                                            <p className="text-xs font-bold text-slate-300">Explanation:</p>
                                                            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-border/40">{item.question.explanation}</p>
                                                        </div>

                                                        {onUpdateConfidenceRating && (
                                                            <div className="pt-2 border-t border-border/30 flex flex-col gap-1.5">
                                                                <p className="text-[11px] font-bold text-slate-400">Update Confidence Score:</p>
                                                                <div className="flex items-center gap-1.5">
                                                                    {[1, 2, 3, 4, 5].map((star) => {
                                                                        const isStarFilled = star <= rating;
                                                                        return (
                                                                            <button
                                                                                key={star}
                                                                                onClick={() => onUpdateConfidenceRating(item.question, star)}
                                                                                className={`p-1 transition-all hover:scale-110 ${
                                                                                    isStarFilled ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
                                                                                }`}
                                                                                title={`Rate ${star} of 5`}
                                                                            >
                                                                                <Star className={`w-5 h-5 ${isStarFilled ? 'fill-current' : ''}`} />
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Interactive Quick Check Question */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="bg-card border border-border/60 rounded-[2rem] p-6 md:p-8 shadow-lg min-h-[400px] flex flex-col justify-between">
                            
                            <div>
                                <div className="flex justify-between items-center pb-4 border-b border-border/40 mb-6">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                                        <h4 className="font-black text-slate-100 text-sm uppercase tracking-wider">
                                            {language === 'es' ? 'Evaluación Inteligente' : 'Intelligent Assessment'}
                                        </h4>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-slate-900 border border-border text-slate-400 rounded-full">
                                        {activeCategoryInfo.accuracy}% {language === 'es' ? 'Precisión' : 'Accuracy'}
                                    </span>
                                </div>

                                {/* Placeholder State (No Question Loaded) */}
                                <AnimatePresence mode="wait">
                                    {!quickQuestion && !isGeneratingQuestion && (
                                        <motion.div 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="text-center py-12 space-y-6"
                                        >
                                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                                                <HelpCircle className="w-8 h-8 text-primary" />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-xl font-bold text-slate-100">{t('generate_quick_check')}</h3>
                                                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                                                    {t('quick_check_desc')}
                                                </p>
                                            </div>

                                            {errorMsg && (
                                                <div className="bg-danger/10 text-danger p-3 rounded-xl text-xs font-semibold max-w-sm mx-auto border border-danger/20 flex items-center gap-2 justify-center">
                                                    <XCircle className="w-4 h-4" />
                                                    <span>{errorMsg}</span>
                                                </div>
                                            )}

                                            <button 
                                                onClick={handleGenerateQuickQuestion}
                                                className="bg-primary hover:bg-primary/95 active:scale-95 text-primary-foreground font-black py-3.5 px-8 rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary/10"
                                            >
                                                {t('generate_quick_check')}
                                            </button>
                                        </motion.div>
                                    )}

                                    {/* Loading State */}
                                    {isGeneratingQuestion && (
                                        <motion.div 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="py-16 flex flex-col items-center justify-center space-y-4"
                                        >
                                            <Loader text={language === 'es' ? 'La IA está formulando una pregunta óptima en tiempo real...' : 'AI is formulating an optimal test question...'} />
                                        </motion.div>
                                    )}

                                    {/* Question Loaded State */}
                                    {quickQuestion && !isGeneratingQuestion && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="space-y-6"
                                        >
                                            {/* Meta data */}
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-primary bg-primary/15 px-2.5 py-1 rounded-md">
                                                    {quickQuestion.type}
                                                </span>
                                                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-400">
                                                    {quickQuestion.difficulty}
                                                </span>
                                            </div>

                                            {/* Context if scenario */}
                                            {quickQuestion.context && (
                                                <div className="bg-slate-950/40 p-4 rounded-xl border border-border/40 text-xs text-slate-300 leading-relaxed max-h-32 overflow-y-auto">
                                                    <span className="font-bold text-primary block mb-1">Scenario/Context:</span>
                                                    {quickQuestion.context}
                                                </div>
                                            )}

                                            {/* Question Text */}
                                            <h3 className="text-base md:text-lg font-black text-white leading-snug">
                                                {quickQuestion.question}
                                            </h3>

                                            {/* Options */}
                                            <div className="space-y-2.5 pt-2">
                                                {quickQuestion.options.map((option, idx) => {
                                                    const isSelected = selectedOptions.includes(option);
                                                    const isCorrectAns = Array.isArray(quickQuestion.answer) 
                                                        ? quickQuestion.answer.includes(option)
                                                        : quickQuestion.answer === option;

                                                    let containerStyle = "bg-slate-950/20 border-border/60 hover:border-slate-500 hover:bg-slate-950/40 text-slate-300";
                                                    let checkIndicator = null;

                                                    if (isSelected && !quickSubmitted) {
                                                        containerStyle = "bg-primary/15 border-primary text-slate-100 ring-1 ring-primary/30";
                                                    } else if (quickSubmitted) {
                                                        if (isCorrectAns) {
                                                            containerStyle = "bg-success/15 border-success text-success font-semibold";
                                                            checkIndicator = <CheckCircle2 className="w-4 h-4 text-success" />;
                                                        } else if (isSelected) {
                                                            containerStyle = "bg-danger/15 border-danger text-danger font-semibold";
                                                            checkIndicator = <XCircle className="w-4 h-4 text-danger" />;
                                                        } else {
                                                            containerStyle = "bg-slate-950/10 border-border/20 text-slate-500 pointer-events-none";
                                                        }
                                                    }

                                                    return (
                                                        <div
                                                            key={idx}
                                                            onClick={() => handleSelectOption(option)}
                                                            className={`p-3.5 rounded-xl border text-sm font-medium transition-all flex items-center justify-between gap-3 select-none cursor-pointer ${containerStyle}`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                                                                    isSelected && !quickSubmitted
                                                                        ? 'bg-primary text-white'
                                                                        : 'bg-slate-950 text-slate-400 border border-border'
                                                                }`}>
                                                                    {String.fromCharCode(65 + idx)}
                                                                </div>
                                                                <span className="leading-snug">{option}</span>
                                                            </div>
                                                            {checkIndicator}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Action Submit bar */}
                                            {!quickSubmitted ? (
                                                <div className="pt-4 border-t border-border/40 flex items-center justify-between gap-4">
                                                    <span className="text-xs text-slate-400 font-medium">
                                                        {quickQuestion.type === 'MultiSelect' 
                                                            ? (language === 'es' ? 'Selecciona múltiples respuestas' : 'Select multiple options')
                                                            : (language === 'es' ? 'Selecciona una respuesta' : 'Select single option')
                                                        }
                                                    </span>
                                                    <button
                                                        onClick={handleCheckAnswer}
                                                        disabled={selectedOptions.length === 0}
                                                        className="bg-primary hover:bg-primary/95 text-white font-black py-2.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all disabled:opacity-45"
                                                    >
                                                        {t('check_answer')}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-4 pt-4 border-t border-border/40 animate-fade-in">
                                                    {/* Outcome Alert */}
                                                    <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                                                        isAnswerCorrect 
                                                            ? 'bg-success/10 border-success/30 text-success' 
                                                            : 'bg-danger/10 border-danger/30 text-danger'
                                                    }`}>
                                                        {isAnswerCorrect ? <Check className="w-5 h-5 shrink-0" /> : <X className="w-5 h-5 shrink-0" />}
                                                        <div>
                                                            <h5 className="font-extrabold text-sm">{isAnswerCorrect ? t('correct') : t('incorrect')}</h5>
                                                            <p className="text-xs opacity-90 leading-snug">
                                                                {isAnswerCorrect 
                                                                    ? (language === 'es' ? '¡Excelente análisis técnico!' : 'Outstanding technical accuracy!')
                                                                    : (language === 'es' ? 'Revisa la justificación para corregir conceptos erróneos.' : 'Review the justification to resolve misconceptions.')
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Technical Feedback Box */}
                                                    <div className="space-y-2">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                                            <Lightbulb className="w-3.5 h-3.5 text-primary" />
                                                            {t('explanation')}
                                                        </span>
                                                        
                                                        {isGeneratingFeedback ? (
                                                            <div className="flex items-center gap-3 text-xs text-primary font-bold animate-pulse p-4 bg-slate-950/20 rounded-xl border border-border/40">
                                                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                                <span>{language === 'es' ? 'Consultando justificación experta de la IA...' : 'Fetching expert technical feedback...'}</span>
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-border/40 whitespace-pre-line">
                                                                {quickFeedback || quickQuestion.explanation}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Next Button */}
                                                    <div className="flex justify-end">
                                                        <button
                                                            onClick={handleGenerateQuickQuestion}
                                                            className="bg-slate-800 hover:bg-slate-700 text-white font-black py-2.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all flex items-center gap-1.5"
                                                        >
                                                            <RotateCw className="w-3.5 h-3.5" />
                                                            <span>{language === 'es' ? 'Siguiente Pregunta' : 'Try Another Question'}</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: STUDY GUIDE (ORIGINAL STREAMING FEATURE) */}
            {activeTab === 'guide' && (
                <>
                    <div className="bg-card p-6 rounded-2xl shadow-xl border border-border flex flex-col gap-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold">{t('study_guide_tab')}</h3>
                                <p className="text-xs text-slate-400">{t('study_hub_ready_desc')}</p>
                            </div>
                            
                            {content && !isGenerating && (
                                <button onClick={handleDownloadTxt} className="bg-success hover:bg-success/90 text-white font-extrabold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-all text-xs uppercase tracking-wider shadow-lg shadow-success/20">
                                    <DownloadIcon className="w-4 h-4" />
                                    {t('download_txt')}
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-border/50">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-wider text-slate-400">{t('num_questions')}</label>
                                <select 
                                    value={selectedCount} 
                                    onChange={(e) => setSelectedCount(Number(e.target.value) as QuestionCount)} 
                                    className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                >
                                    <option value={25}>25 {language === 'es' ? 'Preguntas' : 'Questions'}</option>
                                    <option value={50}>50 {language === 'es' ? 'Preguntas' : 'Questions'}</option>
                                    <option value={100}>100 {language === 'es' ? 'Preguntas' : 'Questions'}</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-wider text-slate-400">{t('text_display_size')}</label>
                                <div className="flex gap-2 bg-background p-1 border border-border rounded-lg">
                                    {(['sm', 'base', 'lg', 'xl'] as FontSize[]).map(size => (
                                        <button 
                                            key={size} 
                                            onClick={() => setFontSize(size)} 
                                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                                                fontSize === size 
                                                    ? 'bg-primary text-primary-foreground shadow-sm' 
                                                    : 'text-slate-500 hover:text-slate-300'
                                            }`}
                                        >
                                            {size.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {!content && !isGenerating ? (
                        <div className="bg-card/30 border-2 border-dashed border-border rounded-[2rem] p-20 text-center">
                            <h3 className="text-3xl font-extrabold mb-4">{t('study_hub_ready')}</h3>
                            <p className="text-slate-400 mb-8 max-w-md mx-auto text-sm">{t('study_hub_ready_desc')}</p>
                            <button 
                                onClick={generateQuickSet} 
                                className="bg-primary hover:bg-primary/95 text-primary-foreground py-4 px-12 rounded-2xl shadow-xl font-bold transition-all"
                            >
                                {t('generate_study_set')}
                            </button>
                        </div>
                    ) : (
                        <div className={`animate-fade-in bg-card p-8 md:p-16 rounded-[2.5rem] shadow-2xl border border-border min-h-screen ${getFontSizeClass()}`}>
                            {isGenerating && !content ? (
                                <Loader text={t('streaming_guide')} />
                            ) : (
                                <div>
                                     <h1 className="text-3xl font-black mb-8 border-b border-border pb-6">{title}</h1>
                                     <div className="whitespace-pre-wrap leading-relaxed text-slate-200" dangerouslySetInnerHTML={{ __html: processedContent }} />
                                     
                                     {isGenerating && (
                                         <div className="flex items-center gap-3 text-primary font-bold animate-pulse mt-8 p-4 bg-primary/5 rounded-xl border border-primary/15">
                                             <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                             <span>{t('streaming_content')}</span>
                                         </div>
                                     )}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* TAB 3: FLASHCARDS */}
            {activeTab === 'flashcards' && (
                <div className="space-y-8 animate-fade-in">
                    {/* If Loading / Generating AI cards */}
                    {isGeneratingFlashcards && (
                        <div className="bg-card border border-border/60 rounded-[2rem] p-12 text-center min-h-[450px] flex flex-col items-center justify-center space-y-6">
                            <Loader text={language === 'es' ? `Generando ficha ${flashcardsGenerationProgress} de ${flashcardConfig.size} con la IA de Gemini...` : `Formulating flashcard ${flashcardsGenerationProgress} of ${flashcardConfig.size} with Gemini AI...`} />
                        </div>
                    )}

                    {/* Active Flashcard Study View */}
                    {!isGeneratingFlashcards && isFlashcardSessionActive && flashcardDeck.length > 0 && (
                        <div className="max-w-2xl mx-auto space-y-6">
                            {/* Session Header Controls */}
                            <div className="flex items-center justify-between px-2">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary font-mono">
                                        {language === 'es' ? 'Simulador de Fichas' : 'Flashcard Progress'}
                                    </span>
                                    <div className="text-sm font-extrabold text-foreground font-mono">
                                        {flashcardIndex + 1} / {flashcardDeck.length} {language === 'es' ? 'Preguntas' : 'Questions'}
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
                                        {flashcardDeck[flashcardIndex].category}
                                    </span>
                                    <button
                                        onClick={() => setIsFlashcardSessionActive(false)}
                                        className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all"
                                        title={language === 'es' ? 'Finalizar sesión' : 'End Session'}
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Session Progress bar */}
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-gradient-to-r from-primary to-primary/80"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${((flashcardIndex + 1) / flashcardDeck.length) * 100}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>

                            {/* 3D Flashcard Container */}
                            <div style={{ perspective: 1200 }} className="w-full min-h-[480px] relative">
                                <motion.div
                                    animate={{ rotateY: flashcardFlipped ? 180 : 0 }}
                                    transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                                    style={{ transformStyle: "preserve-3d" }}
                                    className="w-full h-full min-h-[480px] relative"
                                >
                                    {/* FRONT SIDE (Question) */}
                                    <div 
                                        style={{ backfaceVisibility: "hidden" }} 
                                        className={`absolute inset-0 w-full h-full min-h-[480px] bg-card border border-border/70 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-xl cursor-pointer ${
                                            flashcardFlipped ? 'pointer-events-none opacity-0' : 'pointer-events-auto opacity-100'
                                        }`}
                                        onClick={() => setFlashcardFlipped(true)}
                                    >
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                                    <HelpCircle className="w-4 h-4 text-primary" />
                                                    <span>{language === 'es' ? 'Pregunta' : 'Question'}</span>
                                                </div>
                                                {onToggleBookmark && (
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onToggleBookmark(flashcardDeck[flashcardIndex]);
                                                        }}
                                                        className="p-1.5 hover:bg-slate-800/60 rounded-xl text-yellow-400 transition-all active:scale-95"
                                                        aria-label="Bookmark"
                                                    >
                                                        {bookmarkedQuestions.some(bq => bq.question === flashcardDeck[flashcardIndex].question) ? (
                                                            <BookmarkCheck className="w-5 h-5 fill-current" />
                                                        ) : (
                                                            <Bookmark className="w-5 h-5 text-slate-500" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                {flashcardDeck[flashcardIndex].context && (
                                                    <div className="text-xs text-slate-400 font-medium bg-slate-950/40 p-3 rounded-xl border border-border/40 max-h-24 overflow-y-auto mb-2 leading-relaxed">
                                                        <span className="font-bold uppercase text-primary block mb-1">Scenario/Context:</span>
                                                        {flashcardDeck[flashcardIndex].context}
                                                    </div>
                                                )}
                                                <h3 className="text-base md:text-lg font-black tracking-tight text-white leading-snug">
                                                    {flashcardDeck[flashcardIndex].question}
                                                </h3>
                                            </div>

                                            {/* Guessing Checklist */}
                                            <div className="space-y-2 pt-2">
                                                {flashcardDeck[flashcardIndex].options.map((option, idx) => (
                                                    <div 
                                                        key={idx}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setFlashcardSelectedOption(option);
                                                        }}
                                                        className={`p-3.5 rounded-xl border text-sm font-medium transition-all flex items-center gap-3 select-none ${
                                                            flashcardSelectedOption === option 
                                                                ? 'bg-primary/10 border-primary text-slate-100 shadow-md ring-1 ring-primary/30' 
                                                                : 'bg-slate-950/20 border-border/60 hover:border-slate-500 hover:bg-slate-950/40 text-slate-300'
                                                        }`}
                                                    >
                                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-black text-xs shrink-0 transition-colors ${
                                                            flashcardSelectedOption === option 
                                                                ? 'bg-primary text-white' 
                                                                : 'bg-slate-950 text-slate-400 border border-border'
                                                        }`}>
                                                            {String.fromCharCode(65 + idx)}
                                                        </div>
                                                        <span className="leading-snug">{option}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-center gap-2 pt-4 border-t border-border/40 text-xs font-bold text-slate-400 hover:text-primary transition-colors">
                                            <RotateCw className="w-3.5 h-3.5 animate-pulse text-primary" />
                                            <span>{language === 'es' ? 'Voltear para ver respuesta' : 'Flip card to see answer'}</span>
                                        </div>
                                    </div>

                                    {/* BACK SIDE (Answer & Explanation) */}
                                    <div 
                                        style={{ 
                                            backfaceVisibility: "hidden",
                                            transform: "rotateY(180deg)"
                                        }} 
                                        className={`absolute inset-0 w-full h-full min-h-[480px] bg-slate-900 border border-border/70 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-xl cursor-pointer overflow-y-auto custom-scrollbar ${
                                            !flashcardFlipped ? 'pointer-events-none opacity-0' : 'pointer-events-auto opacity-100'
                                        }`}
                                        onClick={() => setFlashcardFlipped(false)}
                                    >
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                                    <Award className="w-4 h-4 text-success" />
                                                    <span>{language === 'es' ? 'Respuesta y Justificación' : 'Answer & Justification'}</span>
                                                </div>
                                                {onToggleBookmark && (
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onToggleBookmark(flashcardDeck[flashcardIndex]);
                                                        }}
                                                        className="p-1.5 hover:bg-slate-800/60 rounded-xl text-yellow-400 transition-all active:scale-95"
                                                        aria-label="Bookmark"
                                                    >
                                                        {bookmarkedQuestions.some(bq => bq.question === flashcardDeck[flashcardIndex].question) ? (
                                                            <BookmarkCheck className="w-5 h-5 fill-current" />
                                                        ) : (
                                                            <Bookmark className="w-5 h-5 text-slate-500" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Correct Answer Block */}
                                            <div className="bg-success/5 border border-success/20 p-4 rounded-2xl space-y-1.5">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-success flex items-center gap-1.5">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    {language === 'es' ? 'Respuesta Correcta' : 'Correct Answer'}
                                                </div>
                                                <p className="text-sm md:text-base font-black text-slate-100 leading-snug">
                                                    {flashcardDeck[flashcardIndex].answer}
                                                </p>
                                            </div>

                                            {/* Detailed Explanation */}
                                            <div className="space-y-2">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                    {language === 'es' ? 'Explicación Técnica' : 'Technical Explanation'}
                                                </div>
                                                <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-border/40 whitespace-pre-line">
                                                    {flashcardDeck[flashcardIndex].explanation}
                                                </p>
                                            </div>

                                            {/* Guess result display */}
                                            {flashcardSelectedOption && (
                                                <div className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                                                    flashcardSelectedOption === flashcardDeck[flashcardIndex].answer
                                                        ? 'bg-success/5 border-success/20 text-success'
                                                        : 'bg-danger/5 border-danger/20 text-danger'
                                                }`}>
                                                    <Sparkles className="w-4 h-4" />
                                                    <span>
                                                        {language === 'es' 
                                                            ? `Tu predicción: "${flashcardSelectedOption}" (${flashcardSelectedOption === flashcardDeck[flashcardIndex].answer ? '¡Correcto!' : 'Incorrecto'})`
                                                            : `Your prediction: "${flashcardSelectedOption}" (${flashcardSelectedOption === flashcardDeck[flashcardIndex].answer ? 'Correct' : 'Incorrect'})`
                                                        }
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Performance evaluation buttons */}
                                        <div className="pt-4 border-t border-border/40 space-y-3" onClick={(e) => e.stopPropagation()}>
                                            <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                {language === 'es' ? '¿Cómo te fue con este concepto?' : 'Evaluate your understanding:'}
                                            </p>
                                            <div className="grid grid-cols-2 gap-4">
                                                <button
                                                    onClick={() => handleMarkCardPerformance(false)}
                                                    className="flex items-center justify-center gap-2 bg-danger/10 hover:bg-danger/20 active:scale-95 text-danger border border-danger/20 font-black py-3 px-4 rounded-xl text-xs uppercase tracking-widest transition-all"
                                                >
                                                    <ThumbsDown className="w-4 h-4" />
                                                    <span>{language === 'es' ? 'Repasar' : 'Need Review'}</span>
                                                </button>
                                                <button
                                                    onClick={() => handleMarkCardPerformance(true)}
                                                    className="flex items-center justify-center gap-2 bg-success/10 hover:bg-success/20 active:scale-95 text-success border border-success/20 font-black py-3 px-4 rounded-xl text-xs uppercase tracking-widest transition-all"
                                                >
                                                    <ThumbsUp className="w-4 h-4" />
                                                    <span>{language === 'es' ? '¡Dominado!' : 'Got It!'}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Card Navigation Controls */}
                            <div className="flex items-center justify-between gap-4 pt-2">
                                <button 
                                    onClick={() => {
                                        setFlashcardFlipped(false);
                                        setFlashcardSelectedOption(null);
                                        setTimeout(() => {
                                            setFlashcardIndex((prev) => (prev - 1 + flashcardDeck.length) % flashcardDeck.length);
                                        }, 200);
                                    }} 
                                    className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white font-black py-2.5 px-4 rounded-xl text-xs uppercase tracking-widest transition-all"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    <span>{language === 'es' ? 'Anterior' : 'Prev'}</span>
                                </button>

                                <button 
                                    onClick={() => setFlashcardFlipped(!flashcardFlipped)}
                                    className="flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 active:scale-95 text-primary border border-primary/20 font-black py-2.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all"
                                >
                                    <RotateCw className="w-3.5 h-3.5" />
                                    <span>{language === 'es' ? 'Voltear' : 'Flip Card'}</span>
                                </button>

                                <button 
                                    onClick={() => {
                                        setFlashcardFlipped(false);
                                        setFlashcardSelectedOption(null);
                                        setTimeout(() => {
                                            setFlashcardIndex((prev) => (prev + 1) % flashcardDeck.length);
                                        }, 200);
                                    }} 
                                    className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white font-black py-2.5 px-4 rounded-xl text-xs uppercase tracking-widest transition-all"
                                >
                                    <span>{language === 'es' ? 'Siguiente' : 'Next'}</span>
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Setup Screen / Stats Display */}
                    {!isGeneratingFlashcards && !isFlashcardSessionActive && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            {/* Setup Panel */}
                            <div className="lg:col-span-7 bg-card border border-border/60 rounded-[2rem] p-6 md:p-8 shadow-md space-y-6">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-primary animate-pulse" />
                                        <h3 className="text-xl font-extrabold text-slate-100">
                                            {language === 'es' ? 'Simulador de Fichas de Repaso' : 'Flashcard Simulator'}
                                        </h3>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        {language === 'es'
                                            ? 'Un modo de estudio interactivo diseñado para evaluar conceptos rápidamente uno a uno. Elige entre nuestro set experto local o genera fichas dinámicas con IA.'
                                            : 'An interactive study mode designed to review PL-300 concepts. Choose our expert-curated local card sets or generate dynamic cards using AI.'}
                                    </p>
                                </div>

                                {errorMsg && (
                                    <div className="bg-amber-500/10 text-amber-500 p-3.5 rounded-xl text-xs font-semibold border border-amber-500/20 flex items-center gap-2">
                                        <XCircle className="w-4 h-4 shrink-0" />
                                        <span>{errorMsg}</span>
                                    </div>
                                )}

                                <div className="space-y-4 pt-4 border-t border-border/40">
                                    {/* Category Select */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                                            {language === 'es' ? 'Dominio / Categoría' : 'Domain / Category'}
                                        </label>
                                        <select
                                            value={flashcardConfig.category}
                                            onChange={(e) => setFlashcardConfig(prev => ({ ...prev, category: e.target.value as QuestionCategoryFilter }))}
                                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                        >
                                            <option value="All">{language === 'es' ? 'Todos los Dominios (Recomendado)' : 'All Domains (Recommended)'}</option>
                                            <option value="Prepare the data">Prepare the data</option>
                                            <option value="Model the data">Model the data</option>
                                            <option value="Visualize and analyze the data">Visualize and analyze the data</option>
                                            <option value="Deploy and maintain assets">Deploy and maintain assets</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Difficulty */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                                                {language === 'es' ? 'Dificultad' : 'Difficulty'}
                                            </label>
                                            <select
                                                value={flashcardConfig.difficulty}
                                                onChange={(e) => setFlashcardConfig(prev => ({ ...prev, difficulty: e.target.value as Difficulty }))}
                                                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                            >
                                                <option value="Adaptive">{language === 'es' ? 'Adaptativo' : 'Adaptive'}</option>
                                                <option value="Easy">{language === 'es' ? 'Fácil' : 'Easy'}</option>
                                                <option value="Medium">{language === 'es' ? 'Medio' : 'Medium'}</option>
                                                <option value="Hard">{language === 'es' ? 'Difícil' : 'Hard'}</option>
                                            </select>
                                        </div>

                                        {/* Size */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                                                {language === 'es' ? 'Cantidad de Fichas' : 'Deck Size'}
                                            </label>
                                            <select
                                                value={flashcardConfig.size}
                                                onChange={(e) => setFlashcardConfig(prev => ({ ...prev, size: Number(e.target.value) }))}
                                                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                            >
                                                <option value={5}>5 {language === 'es' ? 'Fichas' : 'Cards'}</option>
                                                <option value={10}>10 {language === 'es' ? 'Fichas' : 'Cards'}</option>
                                                <option value={15}>15 {language === 'es' ? 'Fichas' : 'Cards'}</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Mode selector: offline vs AI */}
                                    <div className="space-y-2 pt-2">
                                        <label className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-1">
                                            {language === 'es' ? 'Origen de las Fichas' : 'Flashcard Source'}
                                        </label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                type="button"
                                                onClick={() => setFlashcardConfig(prev => ({ ...prev, mode: 'offline' }))}
                                                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                                                    flashcardConfig.mode === 'offline'
                                                        ? 'bg-slate-900 border-primary ring-1 ring-primary/30'
                                                        : 'bg-slate-950/20 border-border hover:border-slate-500'
                                                }`}
                                            >
                                                <div className="flex justify-between items-center w-full">
                                                    <span className="font-extrabold text-sm text-slate-100">
                                                        {language === 'es' ? 'Set Experto' : 'Curated Deck'}
                                                    </span>
                                                    <span className="text-[9px] font-black uppercase tracking-widest bg-success/15 text-success px-2 py-0.5 rounded-full font-mono">
                                                        OFFLINE
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                                                    {language === 'es' ? 'Instantáneo y 100% libre de conexión a Internet.' : 'Instant, lightweight, and 100% offline-compatible.'}
                                                </p>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setFlashcardConfig(prev => ({ ...prev, mode: 'ai' }))}
                                                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                                                    flashcardConfig.mode === 'ai'
                                                        ? 'bg-slate-900 border-primary ring-1 ring-primary/30'
                                                        : 'bg-slate-950/20 border-border hover:border-slate-500'
                                                }`}
                                            >
                                                <div className="flex justify-between items-center w-full">
                                                    <span className="font-extrabold text-sm text-slate-100">
                                                        {language === 'es' ? 'Generado por IA' : 'AI-Generated'}
                                                    </span>
                                                    <span className="text-[9px] font-black uppercase tracking-widest bg-primary/15 text-primary px-2 py-0.5 rounded-full font-mono">
                                                        GEMINI
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                                                    {language === 'es' ? 'Fichas dinámicas hechas a medida en tiempo real.' : 'Dynamic cards tailored specifically for your target domain.'}
                                                </p>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleStartFlashcards}
                                    className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-black py-4 px-6 rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                                >
                                    <Play className="w-4 h-4 fill-current" />
                                    <span>{language === 'es' ? 'Iniciar Sesión de Fichas' : 'Start Flashcard Session'}</span>
                                </button>
                            </div>

                            {/* Performance/Stats Panel */}
                            <div className="lg:col-span-5 bg-card border border-border/60 rounded-[2rem] p-6 md:p-8 shadow-md space-y-6">
                                <div className="flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-primary" />
                                    <h3 className="font-extrabold text-lg text-slate-200">
                                        {language === 'es' ? 'Progreso Independiente' : 'Independent Performance'}
                                    </h3>
                                </div>

                                <p className="text-xs text-slate-400 leading-relaxed">
                                    {language === 'es'
                                        ? 'Las estadísticas de este modo de estudio se registran de forma aislada para proporcionarte un indicador preciso de tu retención mental de conceptos.'
                                        : 'These metrics are tracked independently of normal quizzes to measure conceptual memory recall and visual retention.'}
                                </p>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="bg-slate-950/30 border border-border/50 p-4 rounded-2xl space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                                            {language === 'es' ? 'Vistas' : 'Total Reviewed'}
                                        </span>
                                        <span className="text-2xl font-black text-slate-100 font-mono">
                                            {flashcardStats.totalViewed}
                                        </span>
                                    </div>

                                    <div className="bg-slate-950/30 border border-border/50 p-4 rounded-2xl space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-success block">
                                            {language === 'es' ? 'Dominadas' : 'Mastered'}
                                        </span>
                                        <span className="text-2xl font-black text-success font-mono">
                                            {flashcardStats.masteredCount}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-slate-950/30 border border-border/50 p-4 rounded-2xl space-y-3">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-slate-400">
                                            {language === 'es' ? 'Tasa de Dominio Conceptual' : 'Conceptual Recall Rate'}
                                        </span>
                                        <span className="font-black font-mono text-primary">
                                            {flashcardStats.totalViewed > 0 
                                                ? Math.round((flashcardStats.masteredCount / flashcardStats.totalViewed) * 100) 
                                                : 0}%
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
                                            style={{ 
                                                width: `${flashcardStats.totalViewed > 0 
                                                    ? Math.round((flashcardStats.masteredCount / flashcardStats.totalViewed) * 100) 
                                                    : 0}%` 
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-xs pt-4 border-t border-border/40">
                                    <span className="text-slate-500 font-medium">
                                        {language === 'es' ? 'Pila de repaso pendiente:' : 'Awaiting review:'} <strong className="text-slate-300 font-mono">{flashcardStats.reviewCount}</strong>
                                    </span>
                                    {flashcardStats.totalViewed > 0 && (
                                        <button
                                            onClick={() => {
                                                let confirmReset = true;
                                                try {
                                                    confirmReset = window.confirm(language === 'es' ? '¿Estás seguro de que deseas restablecer las estadísticas de fichas de repaso?' : 'Are you sure you want to reset flashcard stats?');
                                                } catch (e) {
                                                    console.warn("window.confirm is blocked in this environment, bypassing", e);
                                                    confirmReset = true;
                                                }
                                                if (confirmReset) {
                                                    handleResetFlashcardStats();
                                                }
                                            }}
                                            className="text-[10px] font-black uppercase tracking-widest text-danger hover:underline transition-all"
                                        >
                                            {language === 'es' ? 'Restablecer' : 'Reset Stats'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
