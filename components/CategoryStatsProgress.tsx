import React from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../utils/LanguageContext';
import type { ProgressData, QuestionCategory } from '../types';
import { Database, Network, BarChart3, CloudLightning, ShieldCheck, HelpCircle } from 'lucide-react';

interface CategoryStatsProgressProps {
    categoryStats: ProgressData['categoryStats'];
}

export const CategoryStatsProgress: React.FC<CategoryStatsProgressProps> = ({ categoryStats }) => {
    const { t, language } = useLanguage();

    const categoryConfig = [
        {
            key: 'Prepare the data' as QuestionCategory,
            translationKey: 'prep_data',
            icon: Database,
            color: 'from-violet-500 to-indigo-600',
            borderColor: 'border-violet-500/20 dark:border-violet-500/30',
            bgGlow: 'bg-violet-500/10',
            textColor: 'text-violet-600 dark:text-violet-400',
            progressColor: 'bg-violet-500',
        },
        {
            key: 'Model the data' as QuestionCategory,
            translationKey: 'model_data',
            icon: Network,
            color: 'from-emerald-500 to-teal-600',
            borderColor: 'border-emerald-500/20 dark:border-emerald-500/30',
            bgGlow: 'bg-emerald-500/10',
            textColor: 'text-emerald-600 dark:text-emerald-400',
            progressColor: 'bg-emerald-500',
        },
        {
            key: 'Visualize and analyze the data' as QuestionCategory,
            translationKey: 'viz_data',
            icon: BarChart3,
            color: 'from-blue-500 to-cyan-600',
            borderColor: 'border-blue-500/20 dark:border-blue-500/30',
            bgGlow: 'bg-blue-500/10',
            textColor: 'text-blue-600 dark:text-blue-400',
            progressColor: 'bg-blue-500',
        },
        {
            key: 'Deploy and maintain assets' as QuestionCategory,
            translationKey: 'deploy_assets',
            icon: CloudLightning,
            color: 'from-amber-500 to-orange-600',
            borderColor: 'border-amber-500/20 dark:border-amber-500/30',
            bgGlow: 'bg-amber-500/10',
            textColor: 'text-amber-600 dark:text-amber-400',
            progressColor: 'bg-amber-500',
        },
    ];

    return (
        <div className="bg-card border border-border rounded-3xl p-5 md:p-6 relative overflow-hidden shadow-lg space-y-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
                <div>
                    <h4 className="text-xl font-black font-display text-foreground tracking-tight flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6 text-primary" />
                        {language === 'es' ? 'Rendimiento por Dominio Temático' : 'Domain Mastery breakdown'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {language === 'es' 
                            ? 'Monitorea tu precisión en tiempo real en los cuatro bloques oficiales del examen PL-300.' 
                            : 'Track your real-time accuracy across the four official PL-300 exam domains.'}
                    </p>
                </div>
                
                <div className="flex items-center gap-3 text-xs font-mono font-bold self-start md:self-center">
                    <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        {language === 'es' ? 'Fuerte' : 'Strong'} (&ge;80%)
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        {language === 'es' ? 'Medio' : 'Medium'} (60-79%)
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                        {language === 'es' ? 'Atención' : 'Critical'} (&lt;60%)
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                {categoryConfig.map(({ key, translationKey, icon: Icon, color, borderColor, bgGlow, textColor, progressColor }) => {
                    const stats = categoryStats[key] || { correct: 0, total: 0 };
                    const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                    
                    let feedbackText = '';
                    let feedbackColor = 'text-slate-400 dark:text-slate-500';
                    let progressBg = progressColor;

                    if (stats.total === 0) {
                        feedbackText = language === 'es' ? 'Sin comenzar' : 'Not started yet';
                    } else if (accuracy >= 80) {
                        feedbackText = language === 'es' ? 'Excelente' : 'Excellent Mastery';
                        feedbackColor = 'text-emerald-500';
                        progressBg = 'bg-emerald-500';
                    } else if (accuracy >= 60) {
                        feedbackText = language === 'es' ? 'Buen progreso' : 'On Track';
                        feedbackColor = 'text-amber-500';
                        progressBg = 'bg-amber-500';
                    } else {
                        feedbackText = language === 'es' ? 'Requiere práctica' : 'Needs Practice';
                        feedbackColor = 'text-rose-500';
                        progressBg = 'bg-rose-500';
                    }

                    return (
                        <div 
                            key={key} 
                            className={`p-5 rounded-2xl border ${borderColor} bg-background/20 dark:bg-background/10 hover:border-primary/20 hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-xl ${bgGlow} ${textColor} shrink-0`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-0.5 flex flex-col justify-center">
                                        <h5 className="font-extrabold text-sm text-foreground leading-tight">
                                            {t(translationKey)}
                                        </h5>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className={`text-2xl font-black font-mono tracking-tighter ${stats.total > 0 ? textColor : 'text-slate-400'}`}>
                                        {stats.total > 0 ? `${accuracy}%` : '--'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {/* Track / Progress Bar */}
                                {stats.total > 0 ? (
                                    <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative shadow-inner">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${accuracy}%` }}
                                            transition={{ duration: 1.2, ease: "easeOut" }}
                                            className={`h-full ${progressBg} rounded-full bg-gradient-to-r from-transparent to-white/20`}
                                        />
                                    </div>
                                ) : (
                                    <div className="h-3 w-full bg-slate-100/10 dark:bg-slate-800/20 border border-dashed border-border/40 rounded-full relative" />
                                )}

                                <div className="flex items-center justify-between text-xs font-bold font-display">
                                    <span className="text-slate-500 dark:text-slate-400">
                                        {language === 'es' ? 'Correctas: ' : 'Correct: '} 
                                        <span className="text-foreground font-mono">{stats.correct}</span>
                                        <span className="text-slate-400 dark:text-slate-600 font-mono"> / {stats.total}</span>
                                    </span>
                                    <span className={feedbackColor}>{feedbackText}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
