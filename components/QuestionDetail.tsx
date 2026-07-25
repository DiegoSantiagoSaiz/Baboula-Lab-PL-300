import React from 'react';
import type { Question } from '../types';
import { DexelExplains } from './DexelExplains';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';

interface QuestionDetailProps {
    question: Question;
    userAnswer?: string | string[] | null;
}

export const QuestionDetail: React.FC<QuestionDetailProps> = ({ question, userAnswer }) => {
    
    const isOptionSelected = (opt: string) => {
        if (!userAnswer) return false;
        return Array.isArray(userAnswer) ? userAnswer.includes(opt) : userAnswer === opt;
    };

    const isOptionCorrect = (opt: string) => {
        return Array.isArray(question.answer) ? question.answer.includes(opt) : question.answer === opt;
    };

    const getOptionClass = (opt: string) => {
        const correct = isOptionCorrect(opt);
        const selected = isOptionSelected(opt);
        if (correct) return 'bg-success/10 border-success/50 text-success';
        if (selected && !correct) return 'bg-danger/10 border-danger/50 text-danger';
        return 'bg-card opacity-50 border-border';
    };

    const isCorrect = React.useMemo(() => {
        if (userAnswer === null || userAnswer === undefined) return false;
        if (Array.isArray(question.answer) && Array.isArray(userAnswer)) {
            if (question.type === 'BuildList') return JSON.stringify(question.answer) === JSON.stringify(userAnswer);
            return question.answer.length === userAnswer.length && [...question.answer].sort().join(',') === [...userAnswer].sort().join(',');
        }
        return question.answer === userAnswer;
    }, [question, userAnswer]);

    return (
        <div className="bg-card/50 p-6 md:p-8 my-4 rounded-2xl border border-border animate-fade-in shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 flex gap-2">
               {userAnswer === null ? (
                 <span className="bg-yellow-400/20 text-yellow-400 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Skipped</span>
               ) : (
                 isCorrect 
                  ? <span className="bg-success/20 text-success text-[8px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1"><CheckIcon className="w-3 h-3" /> Correct</span>
                  : <span className="bg-danger/20 text-danger text-[8px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1"><XIcon className="w-3 h-3" /> Incorrect</span>
               )}
            </div>

            <span className="text-[8px] font-black bg-primary/20 text-primary-light px-2 py-0.5 rounded-full uppercase tracking-widest mb-4 inline-block border border-primary/20">
                {question.type} • REVIEW
            </span>
            
            {question.context && (
                <div className="mb-6 p-4 bg-slate-800/40 rounded-xl text-xs text-slate-400 italic font-serif leading-relaxed border border-border/50">
                    {question.context}
                </div>
            )}

            <h3 className="text-base md:text-lg font-bold mb-6 text-slate-100 leading-snug">{question.question}</h3>
            
            <div className="space-y-2 mb-8">
                {question.options.map((option, index) => (
                    <div key={index} className={`p-3 rounded-xl border-2 flex items-center justify-between transition-all min-h-[48px] ${getOptionClass(option)}`}>
                        <span className="text-xs font-bold flex-1 break-words mr-3">{option}</span>
                        <div className="flex gap-1 shrink-0">
                            {isOptionCorrect(option) && <CheckIcon className="w-4 h-4" />}
                            {isOptionSelected(option) && !isOptionCorrect(option) && <XIcon className="w-4 h-4" />}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 bg-slate-900/20 rounded-xl p-3">
                 <DexelExplains question={question} userAnswer={userAnswer} isCorrect={isCorrect} />
            </div>
        </div>
    );
};