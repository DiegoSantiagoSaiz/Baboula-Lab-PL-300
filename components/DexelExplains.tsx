import React, { useState, useEffect } from 'react';
import type { Question } from '../types';
import { getPersonalizedFeedback } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { RelatedTips } from './RelatedTips';
import { useLanguage } from '../utils/LanguageContext';

interface DexelExplainsProps {
    question: Question;
    userAnswer?: any;
    isCorrect: boolean;
}

export const DexelExplains: React.FC<DexelExplainsProps> = ({ question, userAnswer, isCorrect }) => {
    const { language } = useLanguage();
    const [explanationLength, setExplanationLength] = useState<'short' | 'detailed'>('detailed');
    const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
    const [shortFeedback, setShortFeedback] = useState<string | null>(null);
    const [detailedFeedback, setDetailedFeedback] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Clear caches when question or answer changes
        setShortFeedback(null);
        setDetailedFeedback(null);
        setError(null);
    }, [question, userAnswer]);

    useEffect(() => {
        const fetchFeedback = async () => {
            if (userAnswer === undefined || userAnswer === null) return;
            
            // Check if we already have the feedback for the current requested length
            if (explanationLength === 'short' && shortFeedback) return;
            if (explanationLength === 'detailed' && detailedFeedback) return;

            setIsLoadingFeedback(true);
            setError(null);
            try {
                const result = await getPersonalizedFeedback(question, userAnswer, isCorrect, language, explanationLength);
                if (explanationLength === 'short') {
                    setShortFeedback(result);
                } else {
                    setDetailedFeedback(result);
                }
            } catch (err) {
                setError(language === 'es' ? "No se pudo obtener el feedback de la IA." : "Couldn't get AI feedback.");
            } finally {
                setIsLoadingFeedback(false);
            }
        };

        fetchFeedback();
    }, [question, userAnswer, isCorrect, language, explanationLength, shortFeedback, detailedFeedback]);

    const activeFeedback = explanationLength === 'short' ? shortFeedback : detailedFeedback;
    const explanationToShow = activeFeedback || (explanationLength === 'short' ? (language === 'es' ? `**Respuesta Correcta:** ${Array.isArray(question.answer) ? question.answer.join(', ') : question.answer}.` : `**Correct Answer:** ${Array.isArray(question.answer) ? question.answer.join(', ') : question.answer}.`) : `${language === 'es' ? '**Respuesta Correcta:**' : '**Correct Answer:**'} ${Array.isArray(question.answer) ? question.answer.join(', ') : question.answer}\n\n${question.explanation}`);

    const avatarSrc = "/Dexel.jpg";
    const avatarAlt = "Dexel Mascot";

    return (
        <div className="bg-background/10 dark:bg-background/30 p-4 md:p-6 rounded-2xl border border-border animate-fade-in-up relative overflow-hidden">
            <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 relative bg-background/50 rounded-2xl border border-border flex items-center justify-center p-1 overflow-hidden shadow-sm">
                    <img 
                        src={avatarSrc} 
                        alt={avatarAlt} 
                        className="w-full h-full object-contain rounded-xl"
                        referrerPolicy="no-referrer"
                    />
                </div>
                <div className="flex-1 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <h4 className="font-bold text-lg flex items-center gap-2 text-foreground font-display">
                            <SparklesIcon className="w-5 h-5 text-primary" />
                            Baboulas Data Lab Insights
                        </h4>
                        
                        {/* Segmented Control for Short / Detailed explanation */}
                        <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-border self-start sm:self-auto shadow-inner">
                            <button
                                onClick={() => setExplanationLength('short')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                                    explanationLength === 'short'
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'text-slate-500 hover:text-primary'
                                }`}
                            >
                                {language === 'es' ? 'Corto' : 'Short'}
                            </button>
                            <button
                                onClick={() => setExplanationLength('detailed')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                                    explanationLength === 'detailed'
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'text-slate-500 hover:text-primary'
                                }`}
                            >
                                {language === 'es' ? 'Detallado' : 'Detailed'}
                            </button>
                        </div>
                    </div>
                    
                    <div className="text-slate-700 dark:text-slate-300 prose prose-sm dark:prose-invert max-w-none leading-relaxed">
                        {explanationToShow.split('\n').map((line, i) => <span key={i} className="block mb-2">{line}</span>)}
                    </div>
                </div>
            </div>
            
            {isLoadingFeedback && (
                <div className="mt-4 text-sm text-primary flex items-center gap-2 animate-pulse font-semibold">
                    <SparklesIcon className="w-4 h-4 animate-spin" />
                    {language === 'es' ? 'Generando explicación personalizada...' : 'Generating personalized explanation...'}
                </div>
            )}
            {error && (
                <div className="mt-2 text-xs text-red-500 font-semibold">
                    {error}
                </div>
            )}
            {userAnswer !== undefined && <RelatedTips question={question} />}
        </div>
    );
};
