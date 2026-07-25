import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../utils/LanguageContext';
import type { Question } from '../types';
import { 
    ChevronLeft, 
    ChevronRight, 
    RotateCw, 
    Bookmark, 
    BookmarkCheck,
    CheckCircle2, 
    Info, 
    HelpCircle,
    Trophy,
    Sparkles
} from 'lucide-react';

interface FlashcardReviewProps {
    questions: Question[];
    onToggleBookmark: (question: Question) => void;
    onBackToDashboard: () => void;
}

export const FlashcardReview: React.FC<FlashcardReviewProps> = ({ 
    questions, 
    onToggleBookmark, 
    onBackToDashboard 
}) => {
    const { t, language } = useLanguage();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    // Reset card state when moving to next/prev
    const handleNext = () => {
        setIsFlipped(false);
        setSelectedOption(null);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % questions.length);
        }, 150);
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setSelectedOption(null);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + questions.length) % questions.length);
        }, 150);
    };

    const currentQuestion = questions[currentIndex];
    
    // Check if the selected option is correct
    const isAnswerCorrect = (option: string) => {
        if (!currentQuestion) return false;
        if (Array.isArray(currentQuestion.answer)) {
            return currentQuestion.answer.includes(option);
        }
        return currentQuestion.answer === option;
    };

    // Helper to format correct answer display
    const renderCorrectAnswerString = () => {
        if (!currentQuestion) return '';
        if (Array.isArray(currentQuestion.answer)) {
            return currentQuestion.answer.join(', ');
        }
        return currentQuestion.answer;
    };

    if (!currentQuestion) return null;

    return (
        <div id="flashcard-review-container" className="space-y-6 max-w-2xl mx-auto py-2">
            {/* Top Stats and Progress bar */}
            <div className="flex items-center justify-between px-2">
                <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono">
                        {language === 'es' ? 'Fichas de Repaso' : 'Review Progress'}
                    </span>
                    <div className="text-sm font-extrabold text-foreground font-mono">
                        {currentIndex + 1} / {questions.length} {language === 'es' ? 'Preguntas' : 'Questions'}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
                        {currentQuestion.category}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${
                        currentQuestion.difficulty === 'Hard' 
                            ? 'bg-danger/10 border-danger/30 text-danger'
                            : currentQuestion.difficulty === 'Medium'
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                                : 'bg-success/10 border-success/30 text-success'
                    }`}>
                        {currentQuestion.difficulty}
                    </span>
                </div>
            </div>

            {/* Seamless Progress bar */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                    className="h-full bg-gradient-to-r from-primary to-primary/80"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>

            {/* Instruction tooltip */}
            <div className="text-center">
                <p className="text-xs text-slate-400 font-semibold flex items-center justify-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-primary" />
                    {t('flashcard_instruction')}
                </p>
            </div>

            {/* 3D Flashcard Container */}
            <div 
                style={{ perspective: 1200 }} 
                className="w-full min-h-[460px] md:min-h-[440px] relative"
            >
                <motion.div
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                    style={{ transformStyle: "preserve-3d" }}
                    className="w-full h-full min-h-[460px] md:min-h-[440px] relative"
                >
                    {/* FRONT SIDE (Question) */}
                    <div 
                        style={{ backfaceVisibility: "hidden" }} 
                        className={`absolute inset-0 w-full h-full min-h-[460px] md:min-h-[440px] bg-card border border-border/70 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-xl cursor-pointer ${
                            isFlipped ? 'pointer-events-none' : 'pointer-events-auto'
                        }`}
                        onClick={() => setIsFlipped(true)}
                    >
                        <div className="space-y-4">
                            {/* Card Top Branding */}
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                    <HelpCircle className="w-4 h-4 text-primary" />
                                    <span>{language === 'es' ? 'Pregunta' : 'Question'}</span>
                                </div>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleBookmark(currentQuestion);
                                    }}
                                    className="p-1.5 hover:bg-slate-800/60 rounded-xl text-yellow-400 transition-all active:scale-95"
                                    aria-label="Bookmark"
                                >
                                    <BookmarkCheck className="w-5 h-5 fill-current" />
                                </button>
                            </div>

                            {/* Question Title */}
                            <div className="space-y-2">
                                {currentQuestion.context && (
                                    <div className="text-xs text-slate-400 font-medium bg-slate-950/40 p-3 rounded-xl border border-border/40 max-h-24 overflow-y-auto mb-2 leading-relaxed">
                                        <span className="font-bold uppercase text-primary block mb-1">Scenario/Context:</span>
                                        {currentQuestion.context}
                                    </div>
                                )}
                                <h3 className="text-base md:text-lg font-black tracking-tight text-white leading-snug">
                                    {currentQuestion.question}
                                </h3>
                            </div>

                            {/* Options Checklist */}
                            <div className="space-y-2.5 pt-2">
                                {currentQuestion.options.map((option, idx) => (
                                    <div 
                                        key={idx}
                                        onClick={(e) => {
                                            e.stopPropagation(); // Don't flip card when clicking option
                                            setSelectedOption(option);
                                        }}
                                        className={`p-3.5 rounded-xl border text-sm font-medium transition-all flex items-center gap-3 select-none ${
                                            selectedOption === option 
                                                ? 'bg-primary/10 border-primary text-slate-100 shadow-md' 
                                                : 'bg-slate-950/20 border-border/60 hover:border-slate-500 hover:bg-slate-950/40 text-slate-300'
                                        }`}
                                    >
                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-black text-xs shrink-0 transition-colors ${
                                            selectedOption === option 
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

                        {/* Front Bottom Prompt */}
                        <div className="flex items-center justify-center gap-2 pt-4 border-t border-border/40 text-xs font-bold text-slate-400 group-hover:text-primary transition-colors">
                            <RotateCw className="w-3.5 h-3.5 animate-pulse text-primary" />
                            <span>{t('show_explanation')}</span>
                        </div>
                    </div>

                    {/* BACK SIDE (Explanation) */}
                    <div 
                        style={{ 
                            backfaceVisibility: "hidden",
                            transform: "rotateY(180deg)"
                        }} 
                        className={`absolute inset-0 w-full h-full min-h-[460px] md:min-h-[440px] bg-slate-900 border border-border/70 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-xl cursor-pointer overflow-y-auto custom-scrollbar ${
                            !isFlipped ? 'pointer-events-none' : 'pointer-events-auto'
                        }`}
                        onClick={() => setIsFlipped(false)}
                    >
                        <div className="space-y-4">
                            {/* Card Top branding */}
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                    <Trophy className="w-4 h-4 text-success" />
                                    <span>{language === 'es' ? 'Explicación y Respuesta' : 'Answer & Explanation'}</span>
                                </div>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleBookmark(currentQuestion);
                                    }}
                                    className="p-1.5 hover:bg-slate-800/60 rounded-xl text-yellow-400 transition-all active:scale-95"
                                    aria-label="Bookmark"
                                >
                                    <BookmarkCheck className="w-5 h-5 fill-current" />
                                </button>
                            </div>

                            {/* Correct Answer Block */}
                            <div className="bg-success/5 border border-success/20 p-4 rounded-2xl space-y-1.5">
                                <div className="text-[10px] font-black uppercase tracking-widest text-success flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    {t('correct_answer')}
                                </div>
                                <p className="text-sm md:text-base font-black text-slate-100">
                                    {renderCorrectAnswerString()}
                                </p>
                            </div>

                            {/* Detailed Explanation */}
                            <div className="space-y-2">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    {language === 'es' ? 'Justificación técnica' : 'Technical Justification'}
                                </div>
                                <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-border/40 whitespace-pre-line">
                                    {currentQuestion.explanation}
                                </p>
                            </div>

                            {/* User Selected option result */}
                            {selectedOption && (
                                <div className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                                    isAnswerCorrect(selectedOption)
                                        ? 'bg-success/5 border-success/20 text-success'
                                        : 'bg-danger/5 border-danger/20 text-danger'
                                }`}>
                                    <Sparkles className="w-4 h-4" />
                                    <span>
                                        {language === 'es' 
                                            ? `Tu selección: "${selectedOption}" (${isAnswerCorrect(selectedOption) ? '¡Correcto!' : 'Incorrecto'})`
                                            : `Your guess: "${selectedOption}" (${isAnswerCorrect(selectedOption) ? 'Correct' : 'Incorrect'})`
                                        }
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Back Bottom Prompt */}
                        <div className="flex items-center justify-center gap-2 pt-4 border-t border-border/40 text-xs font-bold text-slate-400">
                            <RotateCw className="w-3.5 h-3.5 text-primary" />
                            <span>{t('show_question')}</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between gap-4 pt-2">
                <button 
                    onClick={handlePrev} 
                    className="flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white font-black py-2.5 px-4 rounded-xl text-xs uppercase tracking-widest transition-all"
                >
                    <ChevronLeft className="w-4 h-4" />
                    <span>{t('prev_card')}</span>
                </button>

                <button 
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 active:scale-95 text-primary border border-primary/20 font-black py-2.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all"
                >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>{t('flip_card')}</span>
                </button>

                <button 
                    onClick={handleNext} 
                    className="flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white font-black py-2.5 px-4 rounded-xl text-xs uppercase tracking-widest transition-all"
                >
                    <span>{t('next_card')}</span>
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* Custom scrollbar stylesheet */}
            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
            `}} />
        </div>
    );
};
