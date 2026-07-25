import React, { useState, useMemo, useEffect } from 'react';
import type { ExamResult, CategoryStat, Difficulty, QuestionCategory, Question } from '../types';
import { SimpleBarChart } from './SimpleBarChart';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';
import { QuestionDetail } from './QuestionDetail';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Star, Download } from 'lucide-react';
import { useLanguage } from '../utils/LanguageContext';
import { jsPDF } from 'jspdf';

interface SessionReviewProps {
    results: ExamResult[];
    onBackToDashboard: () => void;
    theme: 'light' | 'dark';
    confidenceRatings: Record<string, { question: Question; rating: number; timestamp: string }>;
    onUpdateConfidenceRating: (question: Question, rating: number) => void;
}

export const SessionReview: React.FC<SessionReviewProps> = ({ 
    results, 
    onBackToDashboard, 
    theme,
    confidenceRatings,
    onUpdateConfidenceRating
}) => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const { language } = useLanguage();
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    const handleExportPDF = async () => {
        setIsGeneratingPdf(true);
        try {
            // Give browser a tiny tick to update state
            await new Promise((resolve) => setTimeout(resolve, 50));
            
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const isEs = language === 'es';
            const leftMargin = 20;
            const contentWidth = 170;
            const pageHeight = 297;
            const marginBottom = 20;
            let y = 20;

            const ensureSpace = (neededHeight: number) => {
                if (y + neededHeight > pageHeight - marginBottom) {
                    doc.addPage();
                    y = 20;
                    // Print Page Header
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(8);
                    doc.setTextColor(148, 163, 184); // Slate 400
                    doc.text(
                        isEs 
                            ? 'PL-300 Power Practice — Repaso de Sesión de Estudio' 
                            : 'PL-300 Power Practice — Exam Study Review Session', 
                        leftMargin, 
                        12
                    );
                    doc.line(leftMargin, 14, leftMargin + contentWidth, 14);
                    doc.setTextColor(30, 41, 59); // Slate 800
                }
            };

            const printParagraph = (
                text: string, 
                fontSize = 10, 
                isBold = false, 
                indent = 0, 
                color = [30, 41, 59], 
                spacing = 5,
                drawLeftBorder = false
            ) => {
                doc.setFont('helvetica', isBold ? 'bold' : 'normal');
                doc.setFontSize(fontSize);
                doc.setTextColor(color[0], color[1], color[2]);
                const lines: string[] = doc.splitTextToSize(text, contentWidth - indent);
                for (const line of lines) {
                    ensureSpace(spacing);
                    if (drawLeftBorder) {
                        doc.setDrawColor(13, 148, 136); // Teal 600
                        doc.setLineWidth(0.8);
                        doc.line(leftMargin + indent - 3, y - 3.5, leftMargin + indent - 3, y + 1);
                    }
                    doc.text(line, leftMargin + indent, y);
                    y += spacing;
                }
            };

            const drawDivider = (spacingBefore = 4, spacingAfter = 6) => {
                ensureSpace(spacingBefore + 1 + spacingAfter);
                y += spacingBefore;
                doc.setDrawColor(226, 232, 240); // Slate 200
                doc.setLineWidth(0.3);
                doc.line(leftMargin, y, leftMargin + contentWidth, y);
                y += spacingAfter;
            };

            const isOptionCorrect = (opt: string, correctAnswer: string | string[]) => {
                if (Array.isArray(correctAnswer)) {
                    return correctAnswer.includes(opt);
                }
                return correctAnswer === opt;
            };

            const isOptionSelected = (opt: string, userAnswer: string | string[] | null) => {
                if (!userAnswer) return false;
                if (Array.isArray(userAnswer)) {
                    return userAnswer.includes(opt);
                }
                return userAnswer === opt;
            };

            // --- 1. PDF TITLE & HEADER ---
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(22);
            doc.setTextColor(15, 118, 110); // Teal 700
            doc.text('PL-300 POWER PRACTICE', leftMargin, y);
            y += 8;

            doc.setFontSize(14);
            doc.setTextColor(71, 85, 105); // Slate 600
            doc.setFont('helvetica', 'normal');
            doc.text(
                isEs ? 'Resumen Detallado de Sesión de Examen' : 'Detailed Exam Session Study Guide',
                leftMargin,
                y
            );
            y += 10;

            // Draw header accent line
            doc.setDrawColor(13, 148, 136);
            doc.setLineWidth(1.5);
            doc.line(leftMargin, y, leftMargin + contentWidth, y);
            y += 10;

            // --- 2. SUMMARY METADATA ---
            printParagraph(
                isEs ? 'Información General' : 'General Session Details',
                12,
                true,
                0,
                [15, 118, 110],
                6
            );

            const timestamp = new Date().toLocaleString(isEs ? 'es-ES' : 'en-US', {
                dateStyle: 'medium',
                timeStyle: 'short'
            });

            printParagraph(`${isEs ? 'Fecha y Hora:' : 'Date & Time:'} ${timestamp}`, 10, false, 4, [71, 85, 105], 5);
            printParagraph(`${isEs ? 'Puntuación Obtenida:' : 'Obtained Score:'} ${percentage}% (${score} / ${total} ${isEs ? 'Correctas' : 'Correct'})`, 10, false, 4, [71, 85, 105], 5);
            printParagraph(`${isEs ? 'Nivel de Rendimiento:' : 'Performance Level:'} ${perf.title.replace(/👑|⭐|👏|📖|⚡/g, '').trim()}`, 10, false, 4, [71, 85, 105], 5);
            
            drawDivider(4, 6);

            // --- 3. CATEGORY & DIFFICULTY BREAKDOWNS ---
            printParagraph(
                isEs ? 'Rendimiento por Tema de Examen' : 'Performance by Exam Domain',
                12,
                true,
                0,
                [15, 118, 110],
                6
            );

            // Print each category
            Object.entries(breakdownStats.categoryStats).forEach(([cat, stats]) => {
                const s = stats as CategoryStat;
                const pct = s.total > 0 ? ((s.correct / s.total) * 100).toFixed(0) : '0';
                printParagraph(`• ${cat}: ${pct}% (${s.correct} / ${s.total})`, 10, false, 4, [30, 41, 59], 5);
            });

            y += 4;

            printParagraph(
                isEs ? 'Rendimiento por Nivel de Dificultad' : 'Performance by Difficulty Level',
                12,
                true,
                0,
                [15, 118, 110],
                6
            );

            // Print each difficulty
            Object.entries(breakdownStats.difficultyStats).forEach(([diff, stats]) => {
                const s = stats as CategoryStat;
                const pct = s.total > 0 ? ((s.correct / s.total) * 100).toFixed(0) : '0';
                printParagraph(`• ${diff}: ${pct}% (${s.correct} / ${s.total})`, 10, false, 4, [30, 41, 59], 5);
            });

            drawDivider(6, 8);

            // --- 4. DETAILED QUESTION REVIEW ---
            printParagraph(
                isEs ? 'Revisión Pregunta por Pregunta' : 'Question by Question In-Depth Review',
                14,
                true,
                0,
                [15, 118, 110],
                8
            );

            results.forEach((res, idx) => {
                ensureSpace(45); // Make sure there is enough space to start a question block
                y += 4;

                const statusText = res.userAnswer === null
                    ? (isEs ? 'OMITIDA' : 'SKIPPED')
                    : res.isCorrect
                        ? (isEs ? 'CORRECTA' : 'CORRECT')
                        : (isEs ? 'INCORRECTA' : 'INCORRECT');
                
                const statusColor = res.userAnswer === null
                    ? [234, 179, 8] // Yellow
                    : res.isCorrect
                        ? [16, 185, 129] // Green
                        : [239, 68, 68]; // Red

                // Question Header
                printParagraph(
                    `Q${idx + 1}. [${statusText}]`,
                    11,
                    true,
                    0,
                    statusColor,
                    5.5
                );

                // Muted metadata (Category & Difficulty)
                printParagraph(
                    `${isEs ? 'Categoría' : 'Category'}: ${res.question.category}  |  ${isEs ? 'Dificultad' : 'Difficulty'}: ${res.question.difficulty}`,
                    8.5,
                    false,
                    0,
                    [148, 163, 184],
                    4.5
                );

                y += 2;

                // Case Study Context
                if (res.question.context) {
                    printParagraph(
                        isEs ? 'Contexto del Caso de Estudio:' : 'Case Study Context:',
                        9.5,
                        true,
                        0,
                        [71, 85, 105],
                        5
                    );
                    printParagraph(
                        res.question.context,
                        9.5,
                        false,
                        0,
                        [71, 85, 105],
                        4.5,
                        true
                    );
                    y += 2;
                }

                // Question Text
                printParagraph(
                    res.question.question,
                    10.5,
                    true,
                    0,
                    [30, 41, 59],
                    5
                );

                y += 2.5;

                // Render options / answer patterns
                if (res.question.type === 'MultipleChoice' || res.question.type === 'MultiSelect' || res.question.type === 'CaseStudy') {
                    res.question.options.forEach((opt) => {
                        const isCorrectOpt = isOptionCorrect(opt, res.question.answer);
                        const isSelectedOpt = isOptionSelected(opt, res.userAnswer);

                        let prefix = '[ ] ';
                        let optColor = [30, 41, 59];
                        let isBoldOpt = false;

                        if (isCorrectOpt && isSelectedOpt) {
                            prefix = isEs ? '[✔ Seleccionada y Correcta] ' : '[✔ Selected & Correct] ';
                            optColor = [16, 185, 129];
                            isBoldOpt = true;
                        } else if (isCorrectOpt) {
                            prefix = isEs ? '[✔ Opción Correcta] ' : '[✔ Correct Option] ';
                            optColor = [13, 148, 136];
                            isBoldOpt = true;
                        } else if (isSelectedOpt) {
                            prefix = isEs ? '[✗ Seleccionada - Incorrecta] ' : '[✗ Selected - Incorrect] ';
                            optColor = [239, 68, 68];
                            isBoldOpt = true;
                        }

                        printParagraph(
                            `${prefix}${opt}`,
                            9.5,
                            isBoldOpt,
                            4,
                            optColor,
                            4.5
                        );
                    });
                } else if (res.question.type === 'BuildList') {
                    // Correct list
                    printParagraph(
                        isEs ? 'Orden Correcto:' : 'Correct Ordered Steps:',
                        9.5,
                        true,
                        4,
                        [13, 148, 136],
                        4.5
                    );
                    const correctAnswers = Array.isArray(res.question.answer) ? res.question.answer : [res.question.answer];
                    correctAnswers.forEach((ansOpt, sIdx) => {
                        printParagraph(
                            `${sIdx + 1}. ${ansOpt}`,
                            9.5,
                            false,
                            8,
                            [30, 41, 59],
                            4.5
                        );
                    });

                    // User list
                    printParagraph(
                        isEs ? 'Tu Orden Seleccionado:' : 'Your Ordered Steps:',
                        9.5,
                        true,
                        4,
                        res.isCorrect ? [16, 185, 129] : [239, 68, 68],
                        4.5
                    );
                    if (!res.userAnswer) {
                        printParagraph(
                            isEs ? '[Sin respuesta / Omitido]' : '[No Answer / Skipped]',
                            9.5,
                            false,
                            8,
                            [148, 163, 184],
                            4.5
                        );
                    } else {
                        const userAnswers = Array.isArray(res.userAnswer) ? res.userAnswer : [res.userAnswer];
                        userAnswers.forEach((ansOpt, sIdx) => {
                            const matchesCorrect = correctAnswers[sIdx] === ansOpt;
                            printParagraph(
                                `${sIdx + 1}. ${ansOpt} ${matchesCorrect ? '✓' : '✗'}`,
                                9.5,
                                false,
                                8,
                                matchesCorrect ? [16, 185, 129] : [239, 68, 68],
                                4.5
                            );
                        });
                    }
                } else if (res.question.type === 'Matching') {
                    // Correct matches
                    printParagraph(
                        isEs ? 'Emparejamientos Correctos:' : 'Correct Matches:',
                        9.5,
                        true,
                        4,
                        [13, 148, 136],
                        4.5
                    );
                    const correctMatches = Array.isArray(res.question.answer) ? res.question.answer : [res.question.answer];
                    correctMatches.forEach((matchLine) => {
                        printParagraph(
                            `• ${matchLine}`,
                            9.5,
                            false,
                            8,
                            [30, 41, 59],
                            4.5
                        );
                    });

                    // User matches
                    printParagraph(
                        isEs ? 'Tus Emparejamientos:' : 'Your Matches:',
                        9.5,
                        true,
                        4,
                        res.isCorrect ? [16, 185, 129] : [239, 68, 68],
                        4.5
                    );
                    if (!res.userAnswer) {
                        printParagraph(
                            isEs ? '[Sin respuesta / Omitido]' : '[No Answer / Skipped]',
                            9.5,
                            false,
                            8,
                            [148, 163, 184],
                            4.5
                        );
                    } else {
                        const userMatches = Array.isArray(res.userAnswer) ? res.userAnswer : [res.userAnswer];
                        userMatches.forEach((matchLine) => {
                            const isMatchCorrect = correctMatches.includes(matchLine);
                            printParagraph(
                                `• ${matchLine} ${isMatchCorrect ? '✓' : '✗'}`,
                                9.5,
                                false,
                                8,
                                isMatchCorrect ? [16, 185, 129] : [239, 68, 68],
                                4.5
                            );
                        });
                    }
                }

                y += 2.5;

                // Explanation
                printParagraph(
                    isEs ? 'Explicación Técnica:' : 'Technical Explanation:',
                    9.5,
                    true,
                    0,
                    [15, 118, 110],
                    4.5
                );
                printParagraph(
                    res.question.explanation,
                    9.5,
                    false,
                    4,
                    [71, 85, 105],
                    4.5,
                    true // draw teal left accent line!
                );

                if (idx < results.length - 1) {
                    drawDivider(6, 6);
                }
            });

            // Save PDF
            const filename = `PL300_Practice_Session_${new Date().toISOString().slice(0, 10)}.pdf`;
            doc.save(filename);
        } catch (pdfErr) {
            console.error("PDF generation failed:", pdfErr);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const breakdownStats = useMemo(() => {
        const categoryStats: { [key in QuestionCategory]?: CategoryStat } = {};
        const difficultyStats: { [key in Difficulty]?: CategoryStat } = {};

        for (const result of results) {
            const { category, difficulty } = result.question;
            const { isCorrect } = result;

            if (!categoryStats[category]) {
                categoryStats[category] = { correct: 0, total: 0 };
            }
            if (!difficultyStats[difficulty]) {
                difficultyStats[difficulty] = { correct: 0, total: 0 };
            }

            categoryStats[category]!.total += 1;
            difficultyStats[difficulty]!.total += 1;
            if (isCorrect) {
                categoryStats[category]!.correct += 1;
                difficultyStats[difficulty]!.correct += 1;
            }
        }
        
        const finalCategoryStats = Object.fromEntries(Object.entries(categoryStats).filter(([, stats]) => stats!.total > 0));
        const finalDifficultyStats = Object.fromEntries(Object.entries(difficultyStats).filter(([, stats]) => stats!.total > 0));

        return { categoryStats: finalCategoryStats, difficultyStats: finalDifficultyStats };
    }, [results]);

    if (!results || results.length === 0) {
        return (
            <div className="text-center animate-fade-in">
                <p className="text-lg">The exam session ended before any questions were answered.</p>
                <button onClick={onBackToDashboard} title="Back to Dashboard" className="mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-8 rounded-lg text-lg">
                    Back to Dashboard
                </button>
            </div>
        );
    }
    
    const score = results.filter(r => r.isCorrect).length;
    const total = results.length;
    // FIX: Ensure `percentage` is always a string to avoid type errors with `parseInt`.
    const percentage = total > 0 ? ((score / total) * 100).toFixed(0) : '0';
    const percentNum = parseInt(percentage);

    useEffect(() => {
        if (percentNum >= 80) {
            // Fireworks style confetti for high scores (80% or higher)
            const duration = 4 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 25, spread: 360, ticks: 50, zIndex: 100 };

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval = setInterval(() => {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 45 * (timeLeft / duration);
                
                // Fire from multiple random positions
                confetti({ 
                    ...defaults, 
                    particleCount, 
                    origin: { x: randomInRange(0.15, 0.35), y: randomInRange(0.2, 0.5) } 
                });
                confetti({ 
                    ...defaults, 
                    particleCount, 
                    origin: { x: randomInRange(0.65, 0.85), y: randomInRange(0.2, 0.5) } 
                });
            }, 250);

            return () => clearInterval(interval);
        } else if (percentNum >= 70) {
            // Delightful single explosion for passing scores (70%-79%)
            confetti({
                particleCount: 120,
                spread: 80,
                origin: { y: 0.65 },
                colors: ['#06b6d4', '#3b82f6', '#f59e0b', '#10b981']
            });
        }
    }, [percentNum]);

    // Choose visual styling based on performance
    const getPerformanceDetails = () => {
        if (percentNum >= 90) {
            return {
                title: "🏆 EXCEPTIONAL PERFORMANCE",
                subtitle: "Absolutely incredible! You have completely mastered these PL-300 topics.",
                bgColor: "from-amber-500/10 via-primary/5 to-emerald-500/10",
                borderColor: "border-amber-400 dark:border-amber-500/50",
                textColor: "text-amber-500 dark:text-amber-400",
                badgeBg: "bg-amber-400 text-black",
                icon: "👑"
            };
        } else if (percentNum >= 80) {
            return {
                title: "🥇 GOLD PERFORMANCE",
                subtitle: "Excellent work! You are fully on track to crush your official PL-300 exam.",
                bgColor: "from-emerald-500/10 via-background to-primary/10",
                borderColor: "border-emerald-500/50",
                textColor: "text-emerald-500 dark:text-emerald-400",
                badgeBg: "bg-emerald-500 text-white",
                icon: "⭐"
            };
        } else if (percentNum >= 70) {
            return {
                title: "🥈 SILVER PERFORMANCE",
                subtitle: "Good job! You passed the session. Keep polishing weak spots to achieve a maximum score.",
                bgColor: "from-cyan-500/10 via-background to-primary/5",
                borderColor: "border-cyan-500/30",
                textColor: "text-cyan-500 dark:text-cyan-400",
                badgeBg: "bg-cyan-500 text-white",
                icon: "👏"
            };
        } else if (percentNum >= 50) {
            return {
                title: "📈 ON THE RIGHT TRACK",
                subtitle: "Good effort! Practice makes perfect. Review your mistakes to level up.",
                bgColor: "from-yellow-500/5 via-background to-primary/5",
                borderColor: "border-yellow-500/30",
                textColor: "text-yellow-500 dark:text-yellow-400",
                badgeBg: "bg-yellow-500 text-black",
                icon: "📖"
            };
        } else {
            return {
                title: "💪 STRENGTH AND DEDICATION",
                subtitle: "Keep your head up! Every mistake is a golden opportunity to learn and grow.",
                bgColor: "from-rose-500/5 via-background to-primary/5",
                borderColor: "border-rose-500/30",
                textColor: "text-rose-500 dark:text-rose-400",
                badgeBg: "bg-rose-500 text-white",
                icon: "⚡"
            };
        }
    };

    const perf = getPerformanceDetails();

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Elegant Celebratory Results Card */}
            <motion.div 
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className={`bg-gradient-to-br ${perf.bgColor} p-8 md:p-12 rounded-[2.5rem] text-center border-4 border-dashed ${perf.borderColor} shadow-2xl relative overflow-visible`}
            >
                {/* Visual particle sparks in background */}
                {percentNum >= 80 && (
                    <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] pointer-events-none opacity-30">
                        <div className="absolute top-10 left-1/4 w-3 h-3 bg-primary rounded-full animate-ping"></div>
                        <div className="absolute bottom-10 right-1/4 w-2.5 h-2.5 bg-secondary rounded-full animate-ping delay-300"></div>
                        <div className="absolute top-1/2 right-12 w-3.5 h-3.5 bg-amber-400 rounded-full animate-ping delay-700"></div>
                    </div>
                )}

                {/* Performance Badge */}
                <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 15 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black shadow-lg uppercase tracking-wider mb-6 bg-card border border-border"
                >
                    <span className="text-base">{perf.icon}</span>
                    <span className="text-foreground">{perf.title}</span>
                </motion.div>

                {/* Main Large Score Indicator */}
                <div className="relative inline-block mb-6">
                    <motion.h2 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5, type: "spring", stiffness: 150, damping: 12 }}
                        className={`text-7xl md:text-8xl font-black font-sans tracking-tight ${perf.textColor} drop-shadow-md`}
                    >
                        {percentage}%
                    </motion.h2>
                    {percentNum >= 80 && (
                        <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="absolute -top-4 -right-8 text-2xl"
                        >
                            ✨
                        </motion.div>
                    )}
                </div>

                {/* Score Message Description */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="max-w-xl mx-auto space-y-3"
                >
                    <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">
                        Exam Session Completed
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 font-bold text-lg leading-snug">
                        {perf.subtitle}
                    </p>
                    <div className="pt-2 flex justify-center gap-6 text-sm font-mono text-muted-foreground bg-card/40 py-2.5 px-6 rounded-2xl w-fit mx-auto border border-border/50">
                        <span>CORRECT: <strong className="text-foreground">{score}</strong></span>
                        <span className="opacity-30">|</span>
                        <span>TOTAL: <strong className="text-foreground">{total}</strong></span>
                    </div>
                    <div className="pt-4 flex justify-center">
                        <button
                            onClick={handleExportPDF}
                            disabled={isGeneratingPdf}
                            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-700/50 text-white font-bold py-2 px-5 rounded-xl text-sm transition-all shadow-md hover:shadow-lg active:scale-95"
                        >
                            <Download className="w-4 h-4" />
                            {isGeneratingPdf 
                                ? (language === 'es' ? 'Generando PDF...' : 'Generating PDF...') 
                                : (language === 'es' ? 'Exportar como PDF' : 'Export as Study PDF')}
                        </button>
                    </div>
                </motion.div>
            </motion.div>

            <div className="bg-card p-6 rounded-lg shadow-lg border border-border">
                <h3 className="text-2xl font-bold mb-4 text-center">Performance Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="text-xl font-semibold mb-2 text-center text-slate-700 dark:text-slate-300">By Category</h4>
                        <SimpleBarChart data={breakdownStats.categoryStats} theme={theme} />
                    </div>
                    <div>
                        <h4 className="text-xl font-semibold mb-2 text-center text-slate-700 dark:text-slate-300">By Difficulty</h4>
                        <SimpleBarChart data={breakdownStats.difficultyStats} theme={theme} />
                    </div>
                </div>
            </div>
            
            <div>
                <h3 className="text-2xl font-bold mb-4">Review Your Answers</h3>
                <div className="space-y-2">
                    {results.map((result, index) => (
                        <div key={index}>
                            <button 
                                onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                                className="w-full bg-card hover:bg-border border border-border p-4 rounded-lg text-left flex justify-between items-center transition-all"
                            >
                                <span className="flex-1 truncate pr-4 text-slate-700 dark:text-slate-300">Q{index + 1}: {result.question.question}</span>
                                {result.userAnswer === null 
                                    ? <span className="text-sm font-semibold text-yellow-500 px-2">SKIPPED</span>
                                    : result.isCorrect 
                                        ? <CheckIcon /> 
                                        : <XIcon />
                                }
                            </button>
                            {activeIndex === index && (
                                <div className="border border-t-0 border-border/50 bg-slate-950/15 rounded-b-lg p-5 space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border/55">
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-200">Confidence Rating</h4>
                                            <p className="text-xs text-slate-400">Rate how confident you feel in this concept (1 = lowest, 5 = highest)</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => {
                                                const questionText = result.question.question;
                                                const currentRating = confidenceRatings[questionText]?.rating || 0;
                                                const isFilled = star <= currentRating;
                                                return (
                                                    <button
                                                        key={star}
                                                        onClick={() => onUpdateConfidenceRating(result.question, star)}
                                                        className={`p-1 transition-all hover:scale-110 ${
                                                            isFilled ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
                                                        }`}
                                                        title={`Rate ${star} of 5`}
                                                    >
                                                        <Star className={`w-5 h-5 ${isFilled ? 'fill-current' : ''}`} />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <QuestionDetail question={result.question} userAnswer={result.userAnswer} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="text-center flex flex-col sm:flex-row items-center justify-center gap-4">
                <button onClick={onBackToDashboard} title="Back to Dashboard" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-8 rounded-lg text-lg w-full sm:w-auto">
                    Back to Dashboard
                </button>
                <button
                    onClick={handleExportPDF}
                    disabled={isGeneratingPdf}
                    className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-700/50 text-white font-bold py-3 px-8 rounded-lg text-lg flex items-center justify-center gap-2 w-full sm:w-auto transition-all shadow-md active:scale-95"
                >
                    <Download className="w-5 h-5" />
                    {isGeneratingPdf 
                        ? (language === 'es' ? 'Generando PDF...' : 'Generating PDF...') 
                        : (language === 'es' ? 'Exportar PDF de Estudio' : 'Export Study PDF')}
                </button>
            </div>
        </div>
    );
};