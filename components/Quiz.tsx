import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Question, ExamResult, Difficulty, TimerSetting, QuizMode, QuestionCategoryFilter, ActiveSession } from '../types';
import { generateQuestion, generateSpeech } from '../services/geminiService';
import { Loader } from './Loader';
import { QuizSkeleton } from './Skeletons';
import { BookmarkIcon } from './icons/BookmarkIcon';
import { StopwatchIcon } from './icons/StopwatchIcon';
import { KeyboardShortcutsGuide } from './KeyboardShortcutsGuide';
import { DexelExplains } from './DexelExplains';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { StopIcon } from './icons/StopIcon';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';
import { useLanguage } from '../utils/LanguageContext';
import { Eye, EyeOff } from 'lucide-react';

interface QuizProps {
  difficulty: Difficulty;
  timer: TimerSetting;
  mode: QuizMode;
  category: QuestionCategoryFilter;
  bookmarkedQuestions: Question[];
  onQuizEnd: (results: ExamResult[], timeTaken: number) => void;
  onToggleBookmark: (question: Question) => void;
  isBookmarked: (question: Question) => boolean;
  initialSession?: ActiveSession | null;
  onSaveAndExit?: (
    questions: (Question | null)[],
    answersState: Record<number, string | string[] | null>,
    matchingState: Record<number, Record<string, string>>,
    resultsMap: Record<number, ExamResult>,
    timeLeft: number,
    currentQuestionIndex: number
  ) => void;
}

const TOTAL_QUESTIONS = 10;

export const Quiz: React.FC<QuizProps> = ({
  difficulty,
  timer,
  mode,
  category,
  bookmarkedQuestions,
  onQuizEnd,
  onToggleBookmark,
  isBookmarked,
  initialSession = null,
  onSaveAndExit,
}) => {
  const { language } = useLanguage();
  // We now store questions in a fixed-length array to support jumping to any index
  const totalInSet = mode === 'BookmarkReview' ? bookmarkedQuestions.length : TOTAL_QUESTIONS;
  
  const [questions, setQuestions] = useState<(Question | null)[]>(() => {
    if (initialSession && initialSession.questions) {
      return initialSession.questions;
    }
    return new Array(totalInSet).fill(null);
  });
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() => {
    if (initialSession && typeof initialSession.currentQuestionIndex === 'number') {
      return initialSession.currentQuestionIndex;
    }
    return 0;
  });
  
  const loadingIndexesRef = useRef<Set<number>>(new Set());
  
  // Track selected answers per question index to preserve state when jumping back and forth
  const [answersState, setAnswersState] = useState<Record<number, string | string[] | null>>(() => {
    if (initialSession && initialSession.answersState) {
      return initialSession.answersState;
    }
    return {};
  });
  
  // Track matching pairs per question index
  const [matchingState, setMatchingState] = useState<Record<number, Record<string, string>>>(() => {
    if (initialSession && initialSession.matchingState) {
      return initialSession.matchingState;
    }
    return {};
  });
  
  const [resultsMap, setResultsMap] = useState<Record<number, ExamResult>>(() => {
    if (initialSession && initialSession.resultsMap) {
      return initialSession.resultsMap;
    }
    return {};
  });
  
  const [isLoadingSpecific, setIsLoadingSpecific] = useState(false);
  
  const [timeLeft, setTimeLeft] = useState(() => {
    if (initialSession && typeof initialSession.timeLeft === 'number') {
      return initialSession.timeLeft;
    }
    return timer > 0 ? timer * 60 : Infinity;
  });
  
  const startTimeRef = useRef<number>(Date.now());

  const [isTickingSoundEnabled, setIsTickingSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('pl300_timer_alert');
    return saved === null ? true : saved === 'true';
  });

  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);

  const playTickSound = useCallback((secondsLeft: number) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const ctx = new AudioContextClass();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const isCritical = secondsLeft <= 15;
      const frequency = isCritical ? 1400 : 900;
      const volume = isCritical ? 0.12 : 0.05;
      const duration = isCritical ? 0.06 : 0.04;
      
      osc.type = isCritical ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(frequency / 2, ctx.currentTime + duration);
      
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      osc.start();
      osc.stop(ctx.currentTime + duration + 0.01);
      
      setTimeout(() => {
        ctx.close().catch(() => {});
      }, 150);
    } catch (e) {
      console.warn("Failed to play procedural tick sound:", e);
    }
  }, []);

  const toggleTickingSound = () => {
    setIsTickingSoundEnabled(prev => {
      const next = !prev;
      localStorage.setItem('pl300_timer_alert', String(next));
      return next;
    });
  };

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answersState[currentQuestionIndex] || null;
  const currentMatching = matchingState[currentQuestionIndex] || {};
  const isAnswered = !!resultsMap[currentQuestionIndex];

  const stopSpeaking = () => {
    if (audioSourceRef.current) {
        try { audioSourceRef.current.stop(); } catch (e) {}
        audioSourceRef.current = null;
    }
    setIsSpeaking(false);
    setIsGeneratingAudio(false);
  };

  const finishQuiz = useCallback(() => {
    stopSpeaking();
    const timeTaken = timer > 0 ? (timer * 60 - timeLeft) : Math.round((Date.now() - startTimeRef.current) / 1000);
    // Convert resultsMap to an array for the parent
    const finalResults = Object.values(resultsMap);
    onQuizEnd(finalResults, timeTaken);
  }, [onQuizEnd, resultsMap, timer, timeLeft]);

  const handleSaveAndExit = useCallback(() => {
    stopSpeaking();
    if (onSaveAndExit) {
      onSaveAndExit(
        questions,
        answersState,
        matchingState,
        resultsMap,
        timeLeft,
        currentQuestionIndex
      );
    }
  }, [onSaveAndExit, questions, answersState, matchingState, resultsMap, timeLeft, currentQuestionIndex]);

  useEffect(() => {
    if (timer === 0) return;
    if (timeLeft <= 0) { finishQuiz(); return; }
    
    if (timeLeft < 60 && timeLeft > 0 && isTickingSoundEnabled) {
      playTickSound(timeLeft);
    }

    const intervalId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(intervalId);
  }, [timeLeft, timer, finishQuiz, isTickingSoundEnabled, playTickSound]);

  const loadQuestionAtIndex = useCallback(async (index: number) => {
    if (questions[index] || loadingIndexesRef.current.has(index)) return; // Already loaded or loading

    loadingIndexesRef.current.add(index);
    if (index === currentQuestionIndex) {
      setIsLoadingSpecific(true);
    }
    try {
      const q = await generateQuestion(difficulty, category, language);
      setQuestions(prev => {
        const next = [...prev];
        next[index] = q;
        return next;
      });
    } catch (err) {
      console.error("Failed to load question at index", index);
    } finally {
      loadingIndexesRef.current.delete(index);
      if (index === currentQuestionIndex) {
        setIsLoadingSpecific(false);
      }
    }
  }, [questions, currentQuestionIndex, difficulty, category, language]);

  // Initial load
  useEffect(() => {
    const loadInitial = async () => {
      if (initialSession) {
        if (!questions[currentQuestionIndex]) {
          await loadQuestionAtIndex(currentQuestionIndex);
        }
        return;
      }
      if (mode === 'BookmarkReview') {
        if (bookmarkedQuestions.length === 0) { onQuizEnd([], 0); return; }
        setQuestions(bookmarkedQuestions);
      } else {
        await loadQuestionAtIndex(0);
      }
    };
    loadInitial();
  }, [mode, bookmarkedQuestions, onQuizEnd, loadQuestionAtIndex, initialSession]);

  const jumpToQuestion = async (index: number) => {
    if (index < 0 || index >= totalInSet) return;
    stopSpeaking();
    if (!questions[index]) {
      await loadQuestionAtIndex(index);
    }
    setCurrentQuestionIndex(index);
  };

  // Background prefetching pipeline for instant next-question transition
  useEffect(() => {
    if (mode === 'BookmarkReview' || initialSession) return;

    const timers: NodeJS.Timeout[] = [];

    // Staggered prefetch for Question i + 1 (starts after 100ms)
    const nextIdx = currentQuestionIndex + 1;
    if (nextIdx < totalInSet && !questions[nextIdx]) {
      const t1 = setTimeout(() => {
        loadQuestionAtIndex(nextIdx);
      }, 100);
      timers.push(t1);
    }

    // Staggered prefetch for Question i + 2 (buffer) (starts after 1000ms)
    const nextNextIdx = currentQuestionIndex + 2;
    if (nextNextIdx < totalInSet && !questions[nextNextIdx]) {
      const t2 = setTimeout(() => {
        loadQuestionAtIndex(nextNextIdx);
      }, 1000);
      timers.push(t2);
    }

    return () => {
      timers.forEach(t => clearTimeout(t));
    };
  }, [currentQuestionIndex, totalInSet, questions, loadQuestionAtIndex, mode, initialSession]);

  const handleReadAloud = async () => {
    if (isSpeaking || isGeneratingAudio) { stopSpeaking(); return; }
    if (!currentQuestion) return;

    // Trigger API key selection if needed for preview models
    if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
      await window.aistudio.openSelectKey();
    }

    setIsGeneratingAudio(true);
    try {
        if (!audioContextRef.current) audioContextRef.current = new AudioContext();
        const textToRead = `${currentQuestion.context || ''} ${currentQuestion.question}`;
        const buffer = await generateSpeech(textToRead, 'Puck', audioContextRef.current);
        setIsGeneratingAudio(false);
        setIsSpeaking(true);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => setIsSpeaking(false);
        audioSourceRef.current = source;
        source.start();
    } catch (err) {
        setIsGeneratingAudio(false);
        setIsSpeaking(false);
        alert("Audio generation failed. Please ensure you have a valid API key selected.");
    }
  };

  const toggleMultiSelect = (option: string) => {
    if (isAnswered) return;
    setAnswersState(prev => {
      const current = prev[currentQuestionIndex];
      const arr = Array.isArray(current) ? current : [];
      const nextArr = arr.includes(option) ? arr.filter(o => o !== option) : [...arr, option];
      return { ...prev, [currentQuestionIndex]: nextArr };
    });
  };

  const handleBuildListAdd = (option: string) => {
    if (isAnswered) return;
    setAnswersState(prev => {
      const current = prev[currentQuestionIndex];
      const arr = Array.isArray(current) ? current : [];
      if (arr.includes(option)) return prev;
      return { ...prev, [currentQuestionIndex]: [...arr, option] };
    });
  };

  const handleBuildListRemove = (option: string) => {
    if (isAnswered) return;
    setAnswersState(prev => {
      const current = prev[currentQuestionIndex];
      const arr = Array.isArray(current) ? current : [];
      return { ...prev, [currentQuestionIndex]: arr.filter(o => o !== option) };
    });
  };

  // Dedicated matching logic for the multi-question state
  const [selectedMatchKey, setSelectedMatchKey] = useState<string | null>(null);
  const handleMatching = (item: string, isKey: boolean) => {
    if (isAnswered) return;
    if (isKey) {
        setSelectedMatchKey(item === selectedMatchKey ? null : item);
    } else if (selectedMatchKey) {
        setMatchingState(prev => {
            const current = prev[currentQuestionIndex] || {};
            const next = { ...current };
            Object.keys(next).forEach(k => { if (next[k] === item) delete next[k]; });
            next[selectedMatchKey] = item;
            return { ...prev, [currentQuestionIndex]: next };
        });
        setSelectedMatchKey(null);
    }
  };

  const [bookmarkToast, setBookmarkToast] = useState<string | null>(null);

  const handleBookmarkToggle = (q: Question) => {
    onToggleBookmark(q);
    const willBeBookmarked = !isBookmarked(q);
    setBookmarkToast(willBeBookmarked ? (language === 'es' ? 'Pregunta guardada en marcadores' : 'Question bookmarked') : (language === 'es' ? 'Marcador eliminado' : 'Bookmark removed'));
    setTimeout(() => {
      setBookmarkToast(null);
    }, 2000);
  };

  const hasSelectedAnswer = currentQuestion?.type === 'Matching'
    ? Object.keys(currentMatching).length > 0
    : currentQuestion?.type === 'BuildList'
      ? (Array.isArray(currentAnswer) && currentAnswer.length > 0)
      : currentQuestion?.type === 'MultiSelect' || (Array.isArray(currentQuestion?.answer) && currentQuestion?.answer.length > 1)
        ? (Array.isArray(currentAnswer) && currentAnswer.length > 0)
        : (typeof currentAnswer === 'string' && currentAnswer.trim().length > 0);

  const handleSubmit = () => {
    if (!currentQuestion || isAnswered) return;
    
    let finalAnswer: string | string[] | null = currentAnswer;
    if (currentQuestion.type === 'Matching') {
      finalAnswer = Object.entries(currentMatching).map(([k, v]) => `${k}:${v}`);
    }
    
    if (!finalAnswer || (Array.isArray(finalAnswer) && finalAnswer.length === 0)) return;
    
    let isCorrect = false;
    const cleanAnswer = currentQuestion.answer;
    const isMultiAnswer = Array.isArray(cleanAnswer) && cleanAnswer.length > 1;

    if (!isMultiAnswer) {
      const normalizedCorrect = Array.isArray(cleanAnswer) ? cleanAnswer[0] : cleanAnswer;
      const normalizedUser = Array.isArray(finalAnswer) ? finalAnswer[0] : finalAnswer;
      isCorrect = String(normalizedUser).trim().toLowerCase() === String(normalizedCorrect).trim().toLowerCase();
    } else {
      const userArr = Array.isArray(finalAnswer) ? finalAnswer : [finalAnswer];
      const correctArr = Array.isArray(cleanAnswer) ? (cleanAnswer as string[]) : [cleanAnswer as string];
      if (currentQuestion.type === 'BuildList') {
        isCorrect = JSON.stringify(userArr) === JSON.stringify(correctArr);
      } else if (currentQuestion.type === 'Matching') {
        isCorrect = userArr.length === correctArr.length && [...userArr].sort().join(',') === [...correctArr].sort().join(',');
      } else {
        const normUser = userArr.map(u => String(u).trim().toLowerCase());
        const normCorrect = correctArr.map(c => String(c).trim().toLowerCase());
        isCorrect = normUser.length === normCorrect.length && normUser.every(v => normCorrect.includes(v));
      }
    }
    
    setResultsMap(prev => ({
        ...prev,
        [currentQuestionIndex]: { question: currentQuestion, userAnswer: finalAnswer, isCorrect }
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex + 1 < totalInSet) {
      jumpToQuestion(currentQuestionIndex + 1);
    } else {
      finishQuiz();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.hasAttribute('contenteditable')
      ) {
        return;
      }

      if (!currentQuestion) return;

      const key = e.key.toLowerCase();
      const isAnswered = !!resultsMap[currentQuestionIndex];

      if (e.key === 'Enter') {
        e.preventDefault();
        if (!isAnswered) {
          if (hasSelectedAnswer) {
            handleSubmit();
          }
        } else {
          handleNext();
        }
      } else if (key === 'n') {
        e.preventDefault();
        if (isAnswered) {
          handleNext();
        }
      } else if (key === 's') {
        e.preventDefault();
        if (mode !== 'Exam' && !isAnswered) {
          handleNext();
        }
      } else if (key === 'b') {
        e.preventDefault();
        handleBookmarkToggle(currentQuestion);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    currentQuestion,
    currentQuestionIndex,
    resultsMap,
    hasSelectedAnswer,
    mode,
    handleSubmit,
    handleNext,
    handleBookmarkToggle,
  ]);

  const renderOptions = () => {
    if (!currentQuestion) return null;
    const { type, options, answer } = currentQuestion;
    const safeOptions = Array.isArray(options) && options.length > 0 
      ? options 
      : (Array.isArray(answer) && answer.length > 0 ? answer : ["Option A", "Option B", "Option C", "Option D"]);

    const result = resultsMap[currentQuestionIndex];
    const isAnswered = !!result;

    const isMultiAnswer = Array.isArray(answer) && answer.length > 1 && type !== 'BuildList' && type !== 'Matching';

    if (type === 'MultiSelect' || isMultiAnswer) {
        return (
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between px-1 mb-1">
                <span className="text-[10px] font-black uppercase text-primary animate-pulse tracking-widest">
                    {language === 'es' 
                      ? `Selecciona ${Array.isArray(answer) ? answer.length : 1} respuestas` 
                      : `Select ${Array.isArray(answer) ? answer.length : 1} answers`}
                </span>
                <span className="text-[10px] font-black uppercase text-slate-500">
                    {Array.isArray(currentAnswer) ? currentAnswer.length : 0} {language === 'es' ? 'de' : 'of'} {Array.isArray(answer) ? answer.length : 1} {language === 'es' ? 'seleccionadas' : 'selected'}
                </span>
            </div>
            {safeOptions.map((opt, i) => {
              const isSelected = Array.isArray(currentAnswer) && currentAnswer.includes(opt);
              const isCorrect = Array.isArray(answer) ? answer.includes(opt) : answer === opt;
              let styleClass = 'border-border bg-card hover:border-slate-500';
              if (isAnswered) {
                if (isCorrect) styleClass = 'border-success bg-success/10 ring-2 ring-success/20';
                else if (isSelected) styleClass = 'border-danger bg-danger/10 ring-2 ring-danger/20';
                else styleClass = 'border-border bg-card opacity-50';
              } else if (isSelected) styleClass = 'border-primary bg-primary/10 ring-2 ring-primary/20';
              return (
                <button key={i} onClick={() => toggleMultiSelect(opt)} disabled={isAnswered} className={`w-full text-left px-5 py-4 rounded-xl border-2 flex items-center justify-between transition-all shadow-sm ${styleClass} min-h-[56px]`}>
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-5 h-5 rounded border-2 mt-0.5 shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-slate-600'}`}>
                      {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"/></svg>}
                    </div>
                    <span className="text-[14px] font-semibold text-slate-800 dark:text-slate-200 break-words leading-tight">{opt}</span>
                  </div>
                  {isAnswered && (isCorrect ? <CheckIcon className="w-5 h-5 shrink-0 ml-2 text-success" /> : (isSelected ? <XIcon className="w-5 h-5 shrink-0 ml-2 text-danger" /> : null))}
                </button>
              );
            })}
          </div>
        );
    }

    switch (type) {
      case 'BuildList':
        const buildListSelected = Array.isArray(currentAnswer) ? currentAnswer : [];
        const buildListAvailable = safeOptions.filter(o => !buildListSelected.includes(o));
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">{language === 'es' ? 'Opciones Disponibles' : 'Available Options'}</h4>
              {buildListAvailable.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleBuildListAdd(opt)}
                  disabled={isAnswered}
                  className="w-full text-left p-3.5 rounded-xl border-2 border-border bg-card hover:border-primary text-xs font-semibold text-foreground transition-all shadow-sm flex items-center justify-between gap-2"
                >
                  <span className="break-words leading-tight">{opt}</span>
                  <span className="text-primary font-bold shrink-0">+</span>
                </button>
              ))}
            </div>
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-primary">{language === 'es' ? 'Orden Seleccionado' : 'Selected Order'}</h4>
              {buildListSelected.length === 0 && (
                <div className="p-6 border-2 border-dashed border-border rounded-xl text-center text-xs text-muted-foreground">
                  {language === 'es' ? 'Haz clic en las opciones para agregarlas en el orden correcto' : 'Click options to add them in correct sequence'}
                </div>
              )}
              {buildListSelected.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleBuildListRemove(opt)}
                  disabled={isAnswered}
                  className="w-full text-left p-3.5 rounded-xl border-2 border-primary bg-primary/10 text-xs font-bold text-foreground transition-all shadow-sm flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-mono">{i + 1}</span>
                    <span className="break-words leading-tight">{opt}</span>
                  </div>
                  <span className="text-red-500 font-bold shrink-0">×</span>
                </button>
              ))}
            </div>
          </div>
        );
      case 'Matching':
        const rawPairs = Array.isArray(answer) ? answer : safeOptions;
        const keys = rawPairs.map((p: string) => (p.includes(':') ? p.split(':')[0].trim() : p));
        const targets = [...rawPairs.map((p: string) => (p.includes(':') ? p.split(':')[1].trim() : p))].sort();
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-1">{language === 'es' ? 'Elementos' : 'Items'}</div>
              {keys.map((k, i) => {
                const matchedVal = currentMatching[k];
                return (
                  <button key={i} onClick={() => handleMatching(k, true)} disabled={isAnswered} className={`w-full text-left p-3 rounded-xl border-2 text-[11px] font-bold transition-all flex justify-between items-center min-h-[44px] ${selectedMatchKey === k ? 'border-primary bg-primary/20 text-primary' : matchedVal ? 'border-success/30 bg-success/5 text-success' : 'border-border bg-card text-slate-800 dark:text-slate-200'}`}>
                    <span className="break-words leading-tight pr-1">{k}</span>
                    {matchedVal && <span className="shrink-0 bg-success/20 text-success text-[8px] px-1 py-0.5 rounded-full">OK</span>}
                  </button>
                );
              })}
            </div>
            <div className="space-y-2">
              <div className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-1">{language === 'es' ? 'Objetivos / Roles' : 'Targets / Roles'}</div>
              {targets.map((t, i) => {
                const matchedKey = Object.keys(currentMatching).find(k => currentMatching[k] === t);
                return (
                  <button key={i} onClick={() => handleMatching(t, false)} disabled={isAnswered || !selectedMatchKey} className={`w-full text-left p-3 rounded-xl border-2 text-[11px] font-bold transition-all flex flex-col min-h-[50px] ${matchedKey ? 'border-primary bg-primary/10' : selectedMatchKey ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'}`}>
                    <span className="break-words leading-tight text-slate-800 dark:text-slate-200">{t}</span>
                    {matchedKey && <span className="text-[8px] text-primary font-black mt-1 uppercase line-clamp-1">← {matchedKey}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      default:
        return (
          <div className="grid grid-cols-1 gap-3">
            {safeOptions.map((opt, i) => {
              const isSelected = currentAnswer === opt;
              const normalizedCorrect = Array.isArray(answer) ? answer[0] : answer;
              const isCorrect = String(normalizedCorrect).trim().toLowerCase() === String(opt).trim().toLowerCase();
              let styleClass = 'border-border bg-card hover:border-slate-500';
              if (isAnswered) {
                if (isCorrect) styleClass = 'border-success bg-success/10 ring-2 ring-success/20';
                else if (isSelected) styleClass = 'border-danger bg-danger/10 ring-2 ring-danger/20';
                else styleClass = 'border-border bg-card opacity-50';
              } else if (isSelected) styleClass = 'border-primary bg-primary/10 ring-2 ring-primary/20';
              return (
                <button key={i} onClick={() => setAnswersState(prev => ({...prev, [currentQuestionIndex]: opt}))} disabled={isAnswered} className={`w-full text-left px-5 py-4 rounded-xl border-2 flex items-center justify-between transition-all shadow-sm ${styleClass} min-h-[56px]`}>
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-5 h-5 mt-0.5 rounded-full border-2 shrink-0 ${isAnswered ? (isCorrect ? 'border-success bg-success' : (isSelected ? 'border-danger bg-danger' : 'border-slate-600')) : (isSelected ? 'border-primary bg-primary' : 'border-slate-600')}`} />
                    <span className="text-[14px] font-semibold text-slate-800 dark:text-slate-200 break-words leading-tight">{opt}</span>
                  </div>
                  {isAnswered && (isCorrect ? <CheckIcon className="w-5 h-5 shrink-0 ml-2" /> : (isSelected ? <XIcon className="w-5 h-5 shrink-0 ml-2" /> : null))}
                </button>
              );
            })}
          </div>
        );
    }
  };

  const QuestionMap = () => (
    <div className="flex flex-wrap gap-2 mb-6 justify-center">
        {questions.map((_, idx) => {
            const result = resultsMap[idx];
            const isCurrent = currentQuestionIndex === idx;
            const isGenerated = !!questions[idx];
            
            let statusClass = 'border-border bg-card text-slate-500';
            if (isCurrent) statusClass = 'border-primary ring-2 ring-primary/20 bg-primary/10 text-primary animate-pulse';
            else if (result) {
                statusClass = result.isCorrect ? 'border-success bg-success text-white' : 'border-danger bg-danger text-white';
            } else if (!isGenerated) {
                statusClass = 'border-dashed border-border opacity-40';
            }

            return (
                <button
                    key={idx}
                    onClick={() => jumpToQuestion(idx)}
                    className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center text-xs font-black transition-all hover:scale-105 active:scale-95 ${statusClass}`}
                    title={`Go to Question ${idx + 1}`}
                >
                    {idx + 1}
                </button>
            );
        })}
    </div>
  );

  if (isLoadingSpecific && !currentQuestion) return <QuizSkeleton />;

  return (
    <div className="max-w-4xl mx-auto pb-20 px-4">
        {isFocusMode ? (
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between gap-4 p-4 mb-8 bg-slate-900/40 border border-border/50 rounded-2xl shadow-lg backdrop-blur-md"
            >
                {/* Left side: minimal exit focus & save buttons */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsFocusMode(false)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-xl font-bold text-xs transition-all shadow-sm hover:scale-[1.02] active:scale-95"
                        title={language === 'es' ? 'Salir del Modo Foco' : 'Exit Focus Mode'}
                    >
                        <EyeOff className="w-4 h-4 text-amber-500 animate-pulse" />
                        <span>{language === 'es' ? 'Salir de Foco' : 'Exit Focus'}</span>
                    </button>
                    <button
                        onClick={handleSaveAndExit}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-border rounded-xl font-bold text-xs transition-all hover:scale-[1.02] active:scale-95"
                        title={language === 'es' ? 'Guardar y salir' : 'Save and exit'}
                    >
                        <span>{language === 'es' ? 'Guardar' : 'Save'}</span>
                    </button>
                </div>

                {/* Center: question progress */}
                <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-400">
                    <span>{language === 'es' ? 'Pregunta' : 'Question'}</span>
                    <span className="text-foreground bg-primary/20 px-2.5 py-0.5 rounded-lg text-primary font-mono font-black">
                        {currentQuestionIndex + 1}
                    </span>
                    <span>/</span>
                    <span className="font-mono">{totalInSet}</span>
                </div>

                {/* Right side: minimal timer */}
                {timer > 0 ? (
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                        <span className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0"></span>
                        <span className="font-mono">{Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2, '0')}</span>
                    </div>
                ) : (
                    <div className="text-xs text-slate-500 font-bold uppercase tracking-widest font-mono">
                        {mode === 'Exam' ? 'Exam' : 'Practice'}
                    </div>
                )}
            </motion.div>
        ) : (
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8"
            >
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={handleSaveAndExit}
                        className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-border rounded-xl font-black text-xs text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-white transition-all shadow-sm shrink-0 hover:scale-[1.02] active:scale-95"
                        title={language === 'es' ? 'Guardar progreso y salir al panel' : 'Save progress and exit to dashboard'}
                    >
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                        </svg>
                        <span>{language === 'es' ? 'Guardar y Salir' : 'Save & Exit'}</span>
                    </button>
                    <button
                        onClick={() => setIsFocusMode(true)}
                        className="flex items-center gap-2 px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-xl font-black text-xs transition-all shadow-sm shrink-0 hover:scale-[1.02] active:scale-95"
                        title={language === 'es' ? 'Activar Modo Foco' : 'Enable Focus Mode'}
                    >
                        <Eye className="w-4 h-4" />
                        <span>{language === 'es' ? 'Modo Foco' : 'Focus Mode'}</span>
                    </button>
                    <div className="h-6 w-[1px] bg-border hidden sm:block"></div>
                    <h2 className="text-xl font-black flex items-center gap-3 text-foreground font-display">
                        <div className="w-9 h-9 bg-primary/20 rounded-xl flex items-center justify-center text-primary shadow-sm border border-primary/20"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></div>
                        <span className="truncate tracking-tight">{mode === 'Exam' ? 'Exam Simulation' : 'Practice Mode'}</span>
                    </h2>
                </div>
                {timer > 0 && (
                    <div className="flex items-center gap-3">
                        {/* Ticking Sound Alert Toggle */}
                        <button 
                            onClick={toggleTickingSound}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all text-xs font-bold shadow-sm relative overflow-hidden ${
                                timeLeft < 60 && isTickingSoundEnabled 
                                ? 'animate-bounce border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                                : 'border-border bg-card text-slate-500 dark:text-slate-400 hover:text-primary'
                            }`}
                            title={isTickingSoundEnabled ? (language === 'es' ? 'Silenciar alerta de tiempo' : 'Mute time alert') : (language === 'es' ? 'Activar alerta de tiempo' : 'Unmute time alert')}
                        >
                            {isTickingSoundEnabled ? (
                                <>
                                    <span className="relative flex h-2 w-2">
                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${timeLeft < 60 ? 'bg-amber-500' : 'bg-primary'}`}></span>
                                        <span className={`relative inline-flex rounded-full h-2 w-2 ${timeLeft < 60 ? 'bg-amber-500' : 'bg-primary'}`}></span>
                                    </span>
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M12 18.75V5.25L7.75 9.5H4.5v5h3.25L12 18.75z" />
                                    </svg>
                                </>
                            ) : (
                                <>
                                    <span className="h-2 w-2 rounded-full bg-slate-400 animate-pulse"></span>
                                    <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 14l2-2m0 0l2-2m-2 2l2-2m-2 2l-2 2" />
                                    </svg>
                                </>
                            )}
                            <span className="hidden sm:inline">
                                {timeLeft < 60 ? (language === 'es' ? '¡Tiempo!' : 'Alert!') : (language === 'es' ? 'Alerta' : 'Alert')}
                            </span>
                        </button>

                        <div className={`flex items-center gap-2 font-mono font-bold px-3 py-1.5 rounded-xl border shadow-sm relative overflow-hidden group transition-all duration-300 ${
                            timeLeft < 60 
                            ? 'border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400 animate-pulse ring-2 ring-red-500/20' 
                            : 'border-border bg-card'
                        }`}>
                            <div className={`absolute inset-0 transition-colors ${timeLeft < 60 ? 'bg-red-500/5' : 'bg-primary/5 group-hover:bg-primary/10'}`}></div>
                            <div className={`absolute bottom-0 left-0 h-1 transition-all duration-300 ${timeLeft < 60 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]'}`} style={{ width: `${(timeLeft / (timer * 60)) * 100}%` }}></div>
                            <StopwatchIcon className={`w-4 h-4 relative z-10 ${timeLeft < 60 ? 'text-red-500 animate-spin' : 'text-primary'}`} />
                            <span className="text-sm text-foreground tabular-nums relative z-10">{Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2, '0')}</span>
                        </div>
                    </div>
                )}
            </motion.div>
        )}

        {!isFocusMode && <QuestionMap />}

        <AnimatePresence mode="wait">
            {!currentQuestion ? (
                <QuizSkeleton />
            ) : (
                <motion.div 
                    key={currentQuestionIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="space-y-6"
                >
                    {currentQuestion.context && (
                        <div className="p-6 bg-slate-900/5 dark:bg-slate-800/40 rounded-2xl border border-border/50 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 group-hover:bg-primary transition-colors"></div>
                            <h4 className="text-[10px] font-black uppercase text-primary tracking-[0.25em] mb-3 font-display">Case Study / Scenario</h4>
                            <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-serif italic">{currentQuestion.context}</div>
                        </div>
                    )}

                    <div className="bg-card p-6 md:p-10 rounded-[2rem] shadow-2xl border border-border relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
                        
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <span className="inline-block bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-primary/20 font-display">
                                    {currentQuestion.type} • ITEM {currentQuestionIndex + 1}
                                </span>
                            </div>
                            
                            <h3 className="text-xl md:text-2xl font-bold leading-tight text-foreground font-display mb-8">
                                {currentQuestion.question}
                            </h3>

                            <div className="min-h-[200px] mb-8">
                                {renderOptions()}
                            </div>

                            {isAnswered && resultsMap[currentQuestionIndex] && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="pt-8 border-t border-border"
                                >
                                    <div className={`mb-8 p-5 rounded-2xl border-2 flex items-center gap-6 ${resultsMap[currentQuestionIndex].isCorrect ? 'bg-success/5 border-success/30 text-success' : 'bg-danger/5 border-danger/30 text-danger'}`}>
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${resultsMap[currentQuestionIndex].isCorrect ? 'bg-success text-white' : 'bg-danger text-white'}`}>
                                            {resultsMap[currentQuestionIndex].isCorrect ? <CheckIcon className="w-6 h-6" /> : <XIcon className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black uppercase tracking-tight font-display">{resultsMap[currentQuestionIndex].isCorrect ? 'Correct! Excellent work' : 'Incorrect Answer'}</h4>
                                            <p className="text-[10px] opacity-80 font-bold uppercase tracking-widest">{resultsMap[currentQuestionIndex].isCorrect ? 'Official Status: Solved.' : 'Official Status: Needs review.'}</p>
                                        </div>
                                    </div>
                                    <DexelExplains 
                                        question={currentQuestion} 
                                        userAnswer={resultsMap[currentQuestionIndex].userAnswer} 
                                        isCorrect={resultsMap[currentQuestionIndex].isCorrect}
                                    />
                                </motion.div>
                            )}

                            <div className="mt-8 flex gap-3">
                                {currentQuestionIndex > 0 && (
                                    <button
                                        onClick={() => jumpToQuestion(currentQuestionIndex - 1)}
                                        className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-border text-slate-700 dark:text-slate-300 font-bold py-4 px-5 rounded-2xl text-[14px] transition-all flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-95 shrink-0"
                                        title={language === 'es' ? 'Pregunta anterior' : 'Previous question'}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                                        <span className="hidden sm:inline">{language === 'es' ? 'Anterior' : 'Previous'}</span>
                                    </button>
                                )}
                                {!isAnswered ? (
                                    <button 
                                        onClick={handleSubmit} 
                                        disabled={!hasSelectedAnswer} 
                                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-black py-4 px-6 rounded-2xl text-[14px] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg active:scale-95"
                                    >
                                        {language === 'es' ? 'Comprobar Respuesta' : 'Check Answer'}
                                    </button>
                                ) : (
                                    <button 
                                        onClick={handleNext} 
                                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-black py-4 px-6 rounded-2xl text-[14px] transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
                                    >
                                        {currentQuestionIndex + 1 === totalInSet 
                                            ? (language === 'es' ? 'Finalizar y Ver Puntuación' : 'Finish and View Score') 
                                            : (language === 'es' ? 'Siguiente Pregunta' : 'Next Question')}
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                                    </button>
                                )}
                            </div>

                            {/* Action Bar Overlay */}
                            <div className="absolute top-4 right-4 flex items-center gap-2">
                                {bookmarkToast && (
                                    <span className="text-[11px] font-bold bg-slate-900 text-white dark:bg-card dark:text-foreground px-2.5 py-1 rounded-lg shadow border border-border animate-fade-in">
                                        {bookmarkToast}
                                    </span>
                                )}
                                <button 
                                    onClick={() => handleBookmarkToggle(currentQuestion)} 
                                    className={`p-2 rounded-xl transition-all border ${isBookmarked(currentQuestion) ? 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20 shadow-lg shadow-yellow-500/10' : 'text-slate-500 bg-slate-100 dark:bg-slate-800/80 border-border hover:text-yellow-500'}`}
                                    title={isBookmarked(currentQuestion) ? (language === 'es' ? 'Quitar marcador' : 'Remove bookmark') : (language === 'es' ? 'Guardar en marcadores' : 'Bookmark question')}
                                >
                                    <BookmarkIcon filled={isBookmarked(currentQuestion)} className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
        {!isFocusMode && <KeyboardShortcutsGuide mode={mode} />}
    </div>
  );
};