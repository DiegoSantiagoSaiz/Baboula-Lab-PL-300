import React from 'react';
import { BrainIcon } from './icons/BrainIcon';
import { useLanguage } from '../utils/LanguageContext';

interface ExamReadinessGaugeProps {
  score: number;
  theme: 'light' | 'dim' | 'dark';
}

export const ExamReadinessGauge: React.FC<ExamReadinessGaugeProps> = ({ score, theme }) => {
    const { language } = useLanguage();
    const getScoreProps = (s: number) => {
        if (s >= 80) {
            return {
                color: "text-success",
                bgColor: "bg-success/10",
                message: language === 'es'
                    ? "¡Vas por un camino excelente hacia el éxito!"
                    : "You are on an excellent path to success!"
            };
        }
        if (s >= 60) {
            return {
                color: "text-yellow-400",
                bgColor: "bg-yellow-400/10",
                message: language === 'es'
                    ? "¡Estás muy cerca! Enfócate en las áreas débiles."
                    : "You are very close! Focus on your weak areas."
            };
        }
        return {
            color: "text-danger",
            bgColor: "bg-danger/10",
            message: language === 'es'
                ? "Sigue practicando, ¡vas a lograr mejorar!"
                : "Keep practicing, you will improve!"
        };
    };

    const { color, bgColor, message } = getScoreProps(score);
    
    const radius = 50;
    const circumference = Math.PI * radius; // Circumference of a semi-circle
    const offset = circumference - (score / 100) * circumference;
    
    const getTrackColor = () => {
        if (theme === 'light') return 'hsl(214, 32%, 91%)';
        if (theme === 'dim') return 'hsl(215, 25%, 40%)';
        return 'hsl(215, 28%, 28%)';
    };

    return (
        <div className={`bg-card p-6 rounded-lg shadow-lg ${bgColor} border border-border animate-fade-in-up relative overflow-hidden group`}>
            {/* Subtle Monster Eyes */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-10 group-hover:opacity-30 transition-opacity">
                <div className="w-2 h-2 bg-foreground rounded-full"></div>
                <div className="w-2 h-2 bg-foreground rounded-full"></div>
            </div>
            <div className="flex justify-center items-center gap-3 mb-4">
                <BrainIcon className={`w-7 h-7 ${color}`} />
                <h3 className="text-xl font-bold">{language === 'es' ? 'Nivel de Preparación' : 'Readiness Level'}</h3>
            </div>
            <div className="relative w-48 h-24 mx-auto">
                <svg viewBox="0 0 120 60" className="w-full h-full">
                    <path
                        d="M 10 55 A 50 50 0 0 1 110 55"
                        fill="none"
                        stroke={getTrackColor()}
                        strokeWidth="10"
                        strokeLinecap="round"
                    />
                    <path
                        d="M 10 55 A 50 50 0 0 1 110 55"
                        fill="none"
                        className={`stroke-current ${color}`}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-4xl font-extrabold ${color}`}>{score}%</span>
                </div>
            </div>
            <p className="mt-2 text-slate-700 dark:text-slate-300 font-semibold">{message}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {language === 'es'
                    ? 'Calculado según precisión, tu categoría más débil y tendencia reciente.'
                    : 'Calculated based on accuracy, your weakest category, and recent trend.'}
            </p>
        </div>
    );
};