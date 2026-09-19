import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, User, Loader2, Sparkles, Minimize2, Maximize2, HelpCircle } from 'lucide-react';
import type { ChatMessage } from '../types';
import { useLanguage } from '../utils/LanguageContext';

export const GeminiChat: React.FC = () => {
    const { language } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const handleOpenChat = () => {
            setIsOpen(true);
            setIsMinimized(false);
            setTimeout(() => {
                inputRef.current?.focus();
            }, 150);
        };
        window.addEventListener('open-baboulas-chat', handleOpenChat);
        return () => {
            window.removeEventListener('open-baboulas-chat', handleOpenChat);
        };
    }, []);

    const sendMessageText = async (textToSend: string) => {
        if (!textToSend.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            role: 'user',
            text: textToSend.trim(),
            timestamp: Date.now(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/gemini/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages,
                    input: textToSend.trim(),
                    language
                })
            });

            if (!response.ok) {
                throw new Error(`Chat API error: ${response.status}`);
            }

            const data = await response.json();
            const botMessage: ChatMessage = {
                role: 'model',
                text: data.text || (language === 'es' ? "¡Hola! Estoy listo para ayudarte a preparar tu examen PL-300." : "Hello! I am ready to help you prepare for your PL-300 exam."),
                timestamp: Date.now(),
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error("Gemini Chat Error:", error);
            const botMessage: ChatMessage = {
                role: 'model',
                text: language === 'es' 
                    ? "Lo siento, ha habido un problema temporal con el tutor. Por favor intenta preguntar de nuevo." 
                    : "I'm sorry, there was a temporary connection issue. Please ask your question again!",
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, botMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        await sendMessageText(input);
    };

    const suggestions = language === 'es' ? [
        "¿Qué es la función CALCULATE en DAX?",
        "Explícame el esquema en estrella (Star Schema)",
        "¿Cómo funciona RLS (Seguridad a Nivel de Fila)?",
        "Consejos clave para aprobar el PL-300"
    ] : [
        "What is the CALCULATE function in DAX?",
        "Explain Star Schema vs Snowflake",
        "How does Row-Level Security (RLS) work?",
        "Key tips to pass the PL-300 exam"
    ];

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end print:hidden">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ 
                            opacity: 1, 
                            scale: 1, 
                            y: 0,
                            height: isMinimized ? 'auto' : '520px',
                            width: 'min(92vw, 400px)'
                        }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-card border-2 border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden mb-4"
                    >
                        {/* Header */}
                        <div className="bg-primary p-4 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white/20 p-1 flex items-center justify-center overflow-hidden">
                                    <img src="/Dexel.jpg" alt="Dexel" className="w-full h-full object-cover rounded-lg" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-black text-sm uppercase tracking-tight">Dexel AI Tutor</span>
                                    <span className="text-[10px] opacity-90 font-medium">Baboulas Data Lab • PL-300</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={() => setIsMinimized(!isMinimized)}
                                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                    title={isMinimized ? "Maximize" : "Minimize"}
                                >
                                    {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                                </button>
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                    title="Close"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {!isMinimized && (
                            <>
                                {/* Messages Container */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
                                    {messages.length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-3">
                                            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center p-1.5 overflow-hidden shadow-inner border border-primary/20">
                                                <img src="/Dexel.jpg" alt="Dexel" className="w-full h-full object-cover rounded-xl" />
                                            </div>
                                            <div className="space-y-1 max-w-[280px]">
                                                <h4 className="font-bold text-foreground text-sm">
                                                    {language === 'es' ? '¡Hola! Soy Dexel, tu tutor PL-300' : 'Hi! I am Dexel, your PL-300 Tutor'}
                                                </h4>
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                    {language === 'es' 
                                                        ? 'Pregúntame cualquier duda sobre DAX, Power Query, modelado de datos o estrategias de examen.' 
                                                        : 'Ask me anything about DAX, Power Query, data modeling, or exam strategies.'}
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-1.5 w-full pt-2">
                                                {suggestions.map((q, idx) => (
                                                    <button 
                                                        key={idx}
                                                        onClick={() => sendMessageText(q)}
                                                        className="text-left text-xs font-semibold bg-card border border-border px-3 py-2 rounded-xl hover:border-primary hover:text-primary transition-all shadow-sm flex items-center gap-2 group"
                                                    >
                                                        <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0 group-hover:scale-110" />
                                                        <span className="truncate">{q}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {messages.map((msg, idx) => (
                                        <div 
                                            key={idx}
                                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`flex gap-2 max-w-[88%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                                <div className={`mt-1 h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-primary/10 border border-border'}`}>
                                                    {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <img src="/Dexel.jpg" alt="Dexel" className="w-full h-full object-cover rounded-full" />}
                                                </div>
                                                <div className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                                                    msg.role === 'user' 
                                                    ? 'bg-primary text-white rounded-tr-none shadow-md' 
                                                    : 'bg-card text-foreground border border-border rounded-tl-none shadow-sm'
                                                 }`}>
                                                    {msg.text}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex justify-start">
                                            <div className="flex gap-2 max-w-[85%] flex-row items-center">
                                                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center border border-border overflow-hidden">
                                                    <img src="/Dexel.jpg" alt="Dexel" className="w-full h-full object-cover rounded-full" />
                                                </div>
                                                <div className="p-3 bg-card border border-border rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                                                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                                    <span>{language === 'es' ? 'Dexel está pensando...' : 'Dexel is thinking...'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Form */}
                                <form onSubmit={handleSend} className="p-3 border-t border-border bg-card">
                                    <div className="flex gap-2 bg-muted/50 p-1 rounded-2xl border border-border focus-within:ring-2 focus-within:ring-primary/30 transition-all">
                                        <input 
                                            ref={inputRef}
                                            type="text" 
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            placeholder={language === 'es' ? 'Pregúntale a Dexel...' : 'Ask Dexel AI Tutor...'}
                                            className="flex-1 bg-transparent px-3 py-1.5 text-xs sm:text-sm focus:outline-none placeholder:text-muted-foreground font-medium"
                                        />
                                        <button 
                                            type="submit"
                                            disabled={!input.trim() || isLoading}
                                            className="bg-primary text-white p-2 rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100 shadow-sm"
                                            title="Send"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Float Mascot Trigger Button */}
            {!isOpen && (
                <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => setIsOpen(true)}
                    className="bg-card border-2 border-primary/40 p-2.5 rounded-full text-foreground shadow-2xl relative group flex items-center gap-2 hover:border-primary transition-all"
                    title={language === 'es' ? 'Chatear con Dexel AI Tutor' : 'Chat with Dexel AI Tutor'}
                >
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-primary/30 shadow-sm">
                        <img src="/Dexel.jpg" alt="Dexel Tutor" className="w-full h-full object-cover" />
                    </div>
                    <div className="hidden sm:flex flex-col text-left pr-2">
                        <span className="text-[10px] font-black uppercase text-primary tracking-wider">Dexel AI</span>
                        <span className="text-xs font-bold text-foreground">{language === 'es' ? 'Tutor PL-300' : 'Exam Tutor'}</span>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shadow">
                        <HelpCircle className="w-3.5 h-3.5" />
                    </div>
                </motion.button>
            )}
        </div>
    );
};
