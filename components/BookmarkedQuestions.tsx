import React, { useState } from 'react';
import type { Question } from '../types';
import { QuestionDetail } from './QuestionDetail';
import { BookmarkIcon } from './icons/BookmarkIcon';
import { FlashcardReview } from './FlashcardReview';
import { useLanguage } from '../utils/LanguageContext';
import { List, Layers } from 'lucide-react';

interface BookmarkedQuestionsProps {
    questions: Question[];
    onToggleBookmark: (question: Question) => void;
    onBackToDashboard: () => void;
    onStartQuiz: () => void;
}

export const BookmarkedQuestions: React.FC<BookmarkedQuestionsProps> = ({ 
    questions, 
    onToggleBookmark, 
    onBackToDashboard, 
    onStartQuiz 
}) => {
    const { t, language } = useLanguage();
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'flashcards'>('flashcards'); // Default to flashcard for fresh engagement

    if (!questions || questions.length === 0) {
        return (
            <div className="text-center animate-fade-in bg-card p-8 rounded-lg">
                <h2 className="text-2xl font-bold mb-4 text-foreground">{t('no_bookmarks')}</h2>
                <p className="text-lg text-slate-300">{t('no_bookmarks_desc')}</p>
                <button onClick={onBackToDashboard} className="mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-8 rounded-lg text-lg">
                    {language === 'es' ? 'Volver al Panel' : 'Back to Dashboard'}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
            {/* Header section with view toggle */}
            <div className="text-center space-y-4">
                 <h2 className="text-3xl font-black mb-2 text-foreground tracking-tight">
                    {t('your_bookmarks')}
                 </h2>
                 
                 {/* Visual Selector for Flashcards vs List View */}
                 <div className="inline-flex bg-slate-950/40 border border-border/80 p-1.5 rounded-2xl gap-1">
                     <button
                         onClick={() => setViewMode('flashcards')}
                         className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                             viewMode === 'flashcards' 
                                 ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                                 : 'text-slate-400 hover:text-white'
                         }`}
                     >
                         <Layers className="w-4 h-4" />
                         <span>{t('flashcard_mode')}</span>
                     </button>
                     <button
                         onClick={() => setViewMode('list')}
                         className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                             viewMode === 'list' 
                                 ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                                 : 'text-slate-400 hover:text-white'
                         }`}
                     >
                         <List className="w-4 h-4" />
                         <span>{t('list_mode')}</span>
                     </button>
                 </div>
            </div>
            
            {/* Conditional content based on mode */}
            {viewMode === 'flashcards' ? (
                <div className="bg-gradient-to-b from-card/30 to-background border border-border/40 p-6 md:p-8 rounded-3xl shadow-md">
                    <FlashcardReview 
                        questions={questions} 
                        onToggleBookmark={onToggleBookmark} 
                        onBackToDashboard={onBackToDashboard} 
                    />
                </div>
            ) : (
                <div className="space-y-3">
                    {questions.map((question, index) => (
                        <div key={index} className="border border-border/40 rounded-2xl overflow-hidden bg-card/40 hover:bg-card/75 transition-colors">
                            <div className="w-full p-5 text-left flex justify-between items-center">
                                <button
                                    onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                                    className="flex-1 truncate pr-4 text-slate-200 text-left text-base md:text-lg font-bold hover:text-primary transition-colors"
                                >
                                    P{index + 1}: {question.question}
                                </button>
                                <button 
                                    onClick={() => onToggleBookmark(question)}
                                    className="text-yellow-400 hover:text-yellow-500 shrink-0 ml-4 p-1.5"
                                    aria-label="Quitar marcador"
                                >
                                    <BookmarkIcon filled={true} />
                                </button>
                            </div>
                            {activeIndex === index && (
                                <div className="border-t border-border/50 bg-slate-950/25 p-5">
                                    <QuestionDetail question={question} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
            
            {/* Global Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-border/40">
                <button 
                    onClick={onBackToDashboard} 
                    title={language === 'es' ? 'Volver al panel principal' : 'Back to main dashboard'} 
                    className="flex-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-black py-3.5 px-8 rounded-xl text-xs uppercase tracking-widest transition-all"
                >
                    {language === 'es' ? 'Volver al Panel' : 'Back to Dashboard'}
                </button>
                <button 
                    onClick={onStartQuiz} 
                    title={language === 'es' ? 'Iniciar una sesión de práctica únicamente con tus preguntas guardadas' : 'Start practice session with bookmarked questions'} 
                    className="flex-1 bg-primary hover:bg-primary/95 active:scale-95 text-white font-black py-3.5 px-8 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary/10"
                >
                    {t('review_bookmarks')}
                </button>
            </div>
        </div>
    );
};