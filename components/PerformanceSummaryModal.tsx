import React from 'react';
import { CheckIcon } from './icons/CheckIcon';
import { TargetIcon } from './icons/TargetIcon';
import { StopwatchIcon } from './icons/StopwatchIcon';
import { PencilIcon } from './icons/PencilIcon';
import { useLanguage } from '../utils/LanguageContext';

interface PerformanceSummary {
    score: number;
    total: number;
    accuracy: string; // comes as a string from App.tsx
    timeTaken: number;
}

interface PerformanceSummaryModalProps {
    summary: PerformanceSummary;
    onClose: () => void;
}

const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
};

export const PerformanceSummaryModal: React.FC<PerformanceSummaryModalProps> = ({ summary, onClose }) => {
    const { t } = useLanguage();
    const accuracyValue = parseFloat(summary.accuracy);

    const getPerformanceMessage = () => {
        if (accuracyValue >= 80) return t('msg_excellent');
        if (accuracyValue >= 60) return t('msg_good');
        return t('msg_effort');
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="summary-title"
        >
            <div 
                className="bg-card rounded-lg shadow-2xl w-full max-w-lg animate-pop-in"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-border text-center">
                    <h2 id="summary-title" className="text-3xl font-bold">{t('session_complete')}</h2>
                    <p className="text-slate-300 mt-2">{getPerformanceMessage()}</p>
                </div>
                <div className="p-8 grid grid-cols-2 gap-6">
                    <div className="flex flex-col items-center justify-center p-4 bg-background/50 rounded-lg">
                        <PencilIcon className="w-8 h-8 text-slate-400 mb-2" />
                        <span className="text-sm font-semibold text-slate-300">{t('questions')}</span>
                        <span className="text-3xl font-bold">{summary.total}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 bg-background/50 rounded-lg">
                        <div className="w-8 h-8 flex items-center justify-center mb-2">
                             <CheckIcon />
                        </div>
                        <span className="text-sm font-semibold text-slate-300">{t('correct_count_label')}</span>
                        <span className="text-3xl font-bold">{summary.score}</span>
                    </div>
                    <div className={`flex flex-col items-center justify-center p-4 bg-background/50 rounded-lg`}>
                        <TargetIcon className="w-8 h-8 text-slate-400 mb-2" />
                        <span className="text-sm font-semibold text-slate-300">{t('accuracy')}</span>
                        <span className={`text-3xl font-bold ${accuracyValue >= 80 ? 'text-success' : accuracyValue >= 60 ? 'text-yellow-400' : 'text-danger'}`}>{summary.accuracy}%</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 bg-background/50 rounded-lg">
                        <StopwatchIcon className="w-8 h-8 text-slate-400 mb-2" />
                        <span className="text-sm font-semibold text-slate-300">{t('timer')}</span>
                        <span className="text-3xl font-bold">{formatTime(summary.timeTaken)}</span>
                    </div>
                </div>
                 <div className="p-6 border-t border-border text-center">
                      <button 
                        onClick={onClose} 
                        className="bg-primary hover:bg-primary-dark text-primary-foreground font-bold py-3 px-8 rounded-lg text-lg w-full sm:w-auto"
                    >
                        {t('btn_continue_review')}
                    </button>
                </div>
            </div>
        </div>
    );
};
