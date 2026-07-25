import React, { useState, useRef, useMemo } from 'react';
import { generatePracticeExamStream, generateSpeech } from '../services/geminiService';
import { DocumentDownloadIcon } from './icons/DocumentDownloadIcon';
import { XIcon } from './icons/XIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { StopIcon } from './icons/StopIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { Loader } from './Loader';
import { useLanguage } from '../utils/LanguageContext';

declare const saveAs: (blob: Blob, filename: string) => void;

interface PracticeExamDownloaderProps {
    onClose: () => void;
}

export const PracticeExamDownloader: React.FC<PracticeExamDownloaderProps> = ({ onClose }) => {
    const { language, t } = useLanguage();
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');
    const [examContent, setExamContent] = useState('');
    const [includeAnswers, setIncludeAnswers] = useState(true);
    const examContentRef = useRef('');

    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    const handleGenerate = async () => {
        stopSpeaking();
        setIsGenerating(true);
        setError('');
        setExamContent('');
        examContentRef.current = '';
        
        try {
            await generatePracticeExamStream((chunk) => {
                examContentRef.current += chunk;
                setExamContent(examContentRef.current);
            }, 10, language); 
        } catch (err) {
            setError(language === 'es' ? "Error al generar el contenido. Por favor, verifica tu conexión." : "Error generating content. Please verify your connection.");
        } finally {
            setIsGenerating(false);
        }
    };

    const stopSpeaking = () => {
        if (audioSourceRef.current) {
            try { audioSourceRef.current.stop(); } catch (e) {}
            audioSourceRef.current = null;
        }
        setIsSpeaking(false);
        setIsGeneratingAudio(false);
    };

    const handleReadAloud = async () => {
        if (isSpeaking || isGeneratingAudio) { stopSpeaking(); return; }
        if (!examContent) return;

        if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
            await window.aistudio.openSelectKey();
        }

        setIsGeneratingAudio(true);
        try {
            if (!audioContextRef.current) audioContextRef.current = new AudioContext();
            const textToRead = examContent.substring(0, 2000).replace(/\[ANSWER_(START|END)\]/g, '');
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
            alert(language === 'es' ? "Error al generar el audio." : "Audio generation failed.");
        }
    };

    const handleDownloadTxt = () => {
        if (!examContent) return;
        
        let text = examContent;
        // Clean markers for the text file
        text = text.replace(/\[ANSWER_START\]/g, language === 'es' ? '\n--- SOLUCIÓN ---\n' : '\n--- SOLUTION ---\n')
                   .replace(/\[ANSWER_END\]/g, '\n-----------------\n');
        
        if (!includeAnswers) {
            text = examContent.replace(/\[ANSWER_START\][\s\S]*?\[ANSWER_END\]/g, language === 'es' ? '\n[Respuesta oculta para entrenamiento]\n' : '\n[Answer hidden for practice]\n');
        }

        const header = language === 'es' 
            ? `EXAMEN DE PRÁCTICA MICROSOFT PL-300\nGenerado el: ${new Date().toLocaleString()}\n\n`
            : `MICROSOFT PL-300 PRACTICE EXAM\nGenerated on: ${new Date().toLocaleString()}\n\n`;
        const blob = new Blob([header + text], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, `PL300_Practice_Exam_${new Date().getTime()}.txt`);
    };

    const processedHtml = useMemo(() => {
        let text = examContent;
        if (!text) return '';
        
        let html = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/^### (.*$)/gim, '<h3 class="text-primary font-bold mt-4">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="border-b border-border pb-2 mt-6">$1</h2>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br />');

        if (!includeAnswers) {
            html = html.replace(/\[ANSWER_START\][\s\S]*?\[ANSWER_END\]/g, `<div class="p-4 border border-dashed border-border text-slate-500 italic text-center my-4">*- (${language === 'es' ? 'Clave de respuestas oculta' : 'Answer key hidden'})*</div>`);
        } else {
            html = html.replace(/\[ANSWER_START\]/g, '<div class="bg-primary/5 border-l-4 border-primary p-6 my-6 rounded-r-xl">')
                       .replace(/\[ANSWER_END\]/g, '</div>');
        }
        return html;
    }, [examContent, includeAnswers, language]);

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" role="dialog">
            <div className="bg-card rounded-[2rem] shadow-2xl w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col animate-pop-in">
                <div className="p-6 border-b border-border flex justify-between items-center bg-card/80 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <DocumentDownloadIcon className="text-primary w-8 h-8" />
                        <div>
                            <h2 className="text-xl font-black">{t('exam_generator')}</h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t('offline_practice_set')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-all text-slate-400 hover:text-white">
                        <XIcon />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 bg-background/50 custom-scrollbar">
                    {error && <div className="p-4 bg-danger/10 border border-danger/20 text-danger rounded-xl text-sm font-bold">{error}</div>}
                    
                    {!examContent && !isGenerating ? (
                        <div className="py-20 text-center space-y-6">
                            <SparklesIcon className="w-12 h-12 text-primary/40 mx-auto animate-pulse" />
                            <h3 className="text-3xl font-black">{t('offline_practice_set')}</h3>
                            <p className="text-slate-400 max-w-md mx-auto font-medium">{t('exam_gen_desc')}</p>
                            <button onClick={handleGenerate} className="bg-primary hover:bg-primary/90 text-white font-black py-4 px-10 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95">
                                {t('btn_gen_exam')}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="sticky top-0 z-10 p-4 bg-card/95 backdrop-blur-md border border-border rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4">
                                <label className="flex items-center gap-3 text-xs font-black cursor-pointer uppercase">
                                    <input type="checkbox" checked={includeAnswers} onChange={e => setIncludeAnswers(e.target.checked)} className="w-5 h-5 rounded bg-slate-900 border-border" />
                                    {t('include_answers')}
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={handleReadAloud} className="bg-slate-800 text-slate-300 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-700 flex items-center gap-2 transition-all">
                                        {isSpeaking ? <StopIcon className="w-4 h-4" /> : <SpeakerIcon className="w-4 h-4" />}
                                        {isSpeaking ? t('stop_btn') : t('listen_btn')}
                                    </button>
                                    <button onClick={handleDownloadTxt} className="bg-success text-white px-8 py-2.5 rounded-xl text-xs font-black hover:bg-success/90 transition-all shadow-lg flex items-center gap-2">
                                        <DownloadIcon className="w-4 h-4" />
                                        {t('download_txt')}
                                    </button>
                                </div>
                            </div>

                            <div 
                                className="bg-card p-8 md:p-12 rounded-3xl border border-border font-serif leading-relaxed text-slate-200 shadow-inner min-h-[400px]"
                                dangerouslySetInnerHTML={{ __html: processedHtml || (isGenerating ? `<p class="animate-pulse">${t('formulating_questions')}</p>` : '') }} 
                            />
                            
                            {isGenerating && (
                                <div className="flex justify-center p-4">
                                   <Loader text={t('streaming_exam')} />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-card/80 border-t border-border flex justify-center">
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-300 font-bold text-xs uppercase tracking-widest transition-colors">{t('close_generator')}</button>
                </div>
            </div>
        </div>
    );
};