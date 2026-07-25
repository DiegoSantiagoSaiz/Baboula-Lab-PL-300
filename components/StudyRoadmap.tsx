import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../utils/LanguageContext';
import type { ProgressData, QuestionCategory, Difficulty, TimerSetting, QuizMode, QuestionCategoryFilter } from '../types';
import { 
    Database, 
    Network, 
    BarChart3, 
    CloudLightning, 
    CheckCircle2, 
    ChevronDown, 
    ChevronUp, 
    Play, 
    Award, 
    Compass, 
    Check,
    Sparkles,
    Calendar,
    Target
} from 'lucide-react';

interface StudyRoadmapProps {
    categoryStats: ProgressData['categoryStats'];
    onStartPracticeCategory: (category: QuestionCategory) => void;
    theme: 'light' | 'dim' | 'dark';
}

const ROADMAP_STEPS = [
    {
        key: 'Prepare the data' as QuestionCategory,
        translationKey: 'prep_data',
        weight: '25-30%',
        icon: Database,
        color: 'from-violet-500 to-indigo-600',
        borderColor: 'border-violet-500/20 dark:border-violet-500/30',
        bgGlow: 'bg-violet-500/10',
        textColor: 'text-violet-600 dark:text-violet-400',
        progressColor: 'bg-violet-500',
        subTopics: [
            { id: "prep_1", name: "Get Data from Sources", desc: "Querying, parameters, and storage modes (DirectQuery, Import, Dual)." },
            { id: "prep_2", name: "Clean & Transform Data", desc: "Data profiling, resolving column types, formatting, and null handling." },
            { id: "prep_3", name: "Load & Shape Data", desc: "Advanced Editor, M query optimization, and staging queries." }
        ]
    },
    {
        key: 'Model the data' as QuestionCategory,
        translationKey: 'model_data',
        weight: '25-30%',
        icon: Network,
        color: 'from-emerald-500 to-teal-600',
        borderColor: 'border-emerald-500/20 dark:border-emerald-500/30',
        bgGlow: 'bg-emerald-500/10',
        textColor: 'text-emerald-600 dark:text-emerald-400',
        progressColor: 'bg-emerald-500',
        subTopics: [
            { id: "model_1", name: "Design Data Models", desc: "Star schemas, relationships, cardinality, and cross-filter directions." },
            { id: "model_2", name: "Write DAX Measures", desc: "CALCULATE, time-intelligence, variables, and row/filter contexts." },
            { id: "model_3", name: "Optimize Calculations", desc: "Performance tuning, resolving performance bottlenecks, and indexing." }
        ]
    },
    {
        key: 'Visualize and analyze the data' as QuestionCategory,
        translationKey: 'viz_data',
        weight: '25-30%',
        icon: BarChart3,
        color: 'from-blue-500 to-cyan-600',
        borderColor: 'border-blue-500/20 dark:border-blue-500/30',
        bgGlow: 'bg-blue-500/10',
        textColor: 'text-blue-600 dark:text-blue-400',
        progressColor: 'bg-blue-500',
        subTopics: [
            { id: "viz_1", name: "Build Reports", desc: "Creating charts, custom visuals, and formatting report elements." },
            { id: "viz_2", name: "Enhance for Usability", desc: "Bookmarks, tooltips, drillthroughs, and accessible navigation." },
            { id: "viz_3", name: "Discover Insights", desc: "AI split trees, key influencers, anomaly detection, and smart narratives." }
        ]
    },
    {
        key: 'Deploy and maintain assets' as QuestionCategory,
        translationKey: 'deploy_assets',
        weight: '15-20%',
        icon: CloudLightning,
        color: 'from-amber-500 to-orange-600',
        borderColor: 'border-amber-500/20 dark:border-amber-500/30',
        bgGlow: 'bg-amber-500/10',
        textColor: 'text-amber-600 dark:text-amber-400',
        progressColor: 'bg-amber-500',
        subTopics: [
            { id: "deploy_1", name: "Manage Workspace Assets", desc: "Dashboards, deployment pipelines, workspaces, and lineage." },
            { id: "deploy_2", name: "Configure Security & RLS", desc: "Static and dynamic row-level security, DAX filter rules." },
            { id: "deploy_3", name: "Dataset Refresh Schedules", desc: "Gateway setup, incremental refreshes, and scheduled updates." }
        ]
    }
];

export const StudyRoadmap: React.FC<StudyRoadmapProps> = ({ categoryStats, onStartPracticeCategory, theme }) => {
    const { t, language } = useLanguage();
    const [expandedStep, setExpandedStep] = useState<number | null>(0); // Default open first step

    // Local manual progress mapping
    const [completedSubTopics, setCompletedSubTopics] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('pl300_roadmap_completed');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('pl300_roadmap_completed', JSON.stringify(completedSubTopics));
        } catch {}
    }, [completedSubTopics]);

    const handleToggleSubTopic = (id: string) => {
        setCompletedSubTopics(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const totalSubTopicsCount = useMemo(() => {
        return ROADMAP_STEPS.reduce((acc, step) => acc + step.subTopics.length, 0);
    }, []);

    const overallProgressPercent = useMemo(() => {
        if (totalSubTopicsCount === 0) return 0;
        return Math.round((completedSubTopics.length / totalSubTopicsCount) * 100);
    }, [completedSubTopics, totalSubTopicsCount]);

    // Check if step is completed (all subtopics checked)
    const isStepCompleted = (stepIndex: number) => {
        const step = ROADMAP_STEPS[stepIndex];
        return step.subTopics.every(topic => completedSubTopics.includes(topic.id));
    };

    return (
        <div id="study-roadmap" className="space-y-8 w-full max-w-4xl mx-auto">
            {/* Header / Intro Card */}
            <div className="bg-gradient-to-br from-indigo-900/50 via-slate-900 to-indigo-950/40 dark:from-indigo-950/40 dark:to-slate-900 border border-indigo-500/20 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
                <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-3 max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-black text-primary tracking-widest uppercase">
                            <Compass className="w-3.5 h-3.5" />
                            {t('roadmap_overall_header')}
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                            {t('roadmap_title')}
                        </h2>
                        <p className="text-sm text-slate-400 font-medium leading-relaxed">
                            {t('roadmap_desc')}
                        </p>
                    </div>

                    {/* Overall Progress Gauge */}
                    <div className="bg-slate-950/60 border border-border/80 p-5 rounded-2xl flex flex-col items-center justify-center shrink-0 w-full md:w-44 text-center">
                        <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase mb-2">
                            {t('roadmap_total_progress')}
                        </span>
                        <div className="relative w-20 h-20 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle 
                                    cx="40" 
                                    cy="40" 
                                    r="34" 
                                    className="stroke-slate-800" 
                                    strokeWidth="6" 
                                    fill="transparent" 
                                />
                                <motion.circle 
                                    cx="40" 
                                    cy="40" 
                                    r="34" 
                                    className="stroke-primary" 
                                    strokeWidth="6" 
                                    fill="transparent" 
                                    strokeDasharray={213.6}
                                    initial={{ strokeDashoffset: 213.6 }}
                                    animate={{ strokeDashoffset: 213.6 - (213.6 * overallProgressPercent) / 100 }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <span className="absolute text-xl font-black text-slate-100 font-mono">
                                {overallProgressPercent}%
                            </span>
                        </div>
                        <span className="text-[10px] font-bold text-primary mt-2">
                            {completedSubTopics.length} / {totalSubTopicsCount} {language === 'es' ? 'Completados' : 'Completed'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Step-by-Step Interactive Timeline */}
            <div className="relative pl-4 md:pl-8 space-y-6">
                {/* Vertical Connector Line */}
                <div className="absolute left-6 md:left-10 top-6 bottom-6 w-[2px] bg-gradient-to-b from-primary/30 via-border/30 to-slate-800/10 hidden sm:block"></div>

                {ROADMAP_STEPS.map((step, idx) => {
                    const stats = categoryStats[step.key] || { correct: 0, total: 0 };
                    const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                    const isExpanded = expandedStep === idx;
                    const stepCompleted = isStepCompleted(idx);
                    const StepIcon = step.icon;

                    const stepCompletedCount = step.subTopics.filter(t => completedSubTopics.includes(t.id)).length;
                    const totalStepTopics = step.subTopics.length;

                    return (
                        <div key={step.key} className="relative">
                            {/* Step Indicator Dot (Timeline Node) */}
                            <div className="absolute -left-6 md:-left-10 top-5 z-10 hidden sm:flex items-center justify-center">
                                <motion.button
                                    onClick={() => setExpandedStep(isExpanded ? null : idx)}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 shadow-lg transition-all ${
                                        stepCompleted 
                                            ? 'bg-success border-success text-white shadow-success/20' 
                                            : isExpanded 
                                                ? 'bg-slate-900 border-primary text-primary shadow-primary/10'
                                                : 'bg-card border-border text-slate-400'
                                    }`}
                                >
                                    {stepCompleted ? (
                                        <Check className="w-5 h-5 stroke-[3]" />
                                    ) : (
                                        <span className="font-mono text-sm font-black">{idx + 1}</span>
                                    )}
                                </motion.button>
                            </div>

                            {/* Main Card */}
                            <motion.div 
                                layout="position"
                                className={`bg-card rounded-3xl border transition-all overflow-hidden ${
                                    isExpanded 
                                        ? 'border-primary/40 shadow-xl ring-1 ring-primary/5' 
                                        : 'border-border/60 hover:border-border shadow-sm'
                                }`}
                            >
                                {/* Header (Clickable to Toggle Expand) */}
                                <div 
                                    onClick={() => setExpandedStep(isExpanded ? null : idx)}
                                    className="p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer select-none"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-2xl ${step.bgGlow} ${step.textColor} shrink-0 hidden sm:block`}>
                                            <StepIcon className="w-6 h-6" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono">
                                                    {language === 'es' ? `Área 0${idx + 1}` : `Domain 0${idx + 1}`} • Weight {step.weight}
                                                </span>
                                                {stepCompleted && (
                                                    <span className="inline-flex items-center gap-1 bg-success/10 border border-success/20 text-success text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                                                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                                                        {t('roadmap_step_completed')}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-base md:text-lg font-extrabold text-foreground tracking-tight leading-snug">
                                                {t(step.translationKey)}
                                            </h3>
                                        </div>
                                    </div>

                                    {/* Accordion Action & mini status */}
                                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t border-border/40 pt-3 md:pt-0 md:border-0">
                                        {/* Dynamic real-time stats */}
                                        <div className="flex items-center gap-3 text-xs">
                                            {stats.total > 0 ? (
                                                <div className="flex items-center gap-2 bg-slate-950/40 px-3 py-1.5 rounded-xl border border-border/40">
                                                    <Target className="w-3.5 h-3.5 text-success" />
                                                    <span className="font-bold text-slate-400">
                                                        {language === 'es' ? 'Precisión:' : 'Accuracy:'}
                                                    </span>
                                                    <span className="font-black text-slate-100 font-mono">{accuracy}%</span>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-950/20 px-2.5 py-1.5 rounded-lg border border-border/20">
                                                    {language === 'es' ? 'Sin Intentar' : 'No Attempts'}
                                                </span>
                                            )}
                                            
                                            <div className="bg-primary/5 border border-primary/10 text-primary font-black px-3 py-1.5 rounded-xl font-mono text-[10px] tracking-wider uppercase">
                                                {stepCompletedCount}/{totalStepTopics} {language === 'es' ? 'Temas' : 'Topics'}
                                            </div>
                                        </div>

                                        <button className="text-slate-400 p-1.5 hover:text-white transition-colors">
                                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Topics list */}
                                <AnimatePresence initial={false}>
                                    {isExpanded && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.25, ease: "easeInOut" }}
                                            className="border-t border-border/50 bg-background/30"
                                        >
                                            <div className="p-5 md:p-6 space-y-5">
                                                {/* Category Learning Checklist */}
                                                <div className="space-y-3">
                                                    {step.subTopics.map((topic) => {
                                                        const isChecked = completedSubTopics.includes(topic.id);
                                                        return (
                                                            <div 
                                                                key={topic.id}
                                                                onClick={() => handleToggleSubTopic(topic.id)}
                                                                className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer select-none group ${
                                                                    isChecked 
                                                                        ? 'bg-success/5 border-success/30 hover:border-success/40' 
                                                                        : 'bg-card border-border/60 hover:bg-slate-950/20 hover:border-border'
                                                                }`}
                                                            >
                                                                {/* Custom styled checkbox */}
                                                                <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                                                                    isChecked 
                                                                        ? 'bg-success border-success text-white' 
                                                                        : 'bg-slate-950 border-border group-hover:border-slate-500'
                                                                }`}>
                                                                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3.5]" />}
                                                                </div>

                                                                <div className="space-y-1">
                                                                    <h4 className={`text-sm font-extrabold tracking-tight ${
                                                                        isChecked ? 'text-slate-200 line-through decoration-slate-500 decoration-1' : 'text-slate-100'
                                                                    }`}>
                                                                        {topic.name}
                                                                    </h4>
                                                                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                                                        {topic.desc}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-3 border-t border-border/40">
                                                    <p className="text-xs text-slate-400 font-bold flex items-center gap-1.5">
                                                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                                                        {stepCompleted 
                                                            ? t('roadmap_all_mastered') 
                                                            : (language === 'es' ? 'Marca temas como listos según estudies en el Hub.' : 'Complete the topics as you learn them in the Study Hub.')
                                                        }
                                                    </p>

                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onStartPracticeCategory(step.key);
                                                        }}
                                                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
                                                    >
                                                        <Play className="w-3.5 h-3.5 fill-current" />
                                                        {t('roadmap_practice_now')}
                                                    </motion.button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
