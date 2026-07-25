import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles, Minimize2, Maximize2 } from 'lucide-react';
import type { ChatMessage } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const GeminiChat: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

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
        };
        window.addEventListener('open-baboulas-chat', handleOpenChat);
        return () => {
            window.removeEventListener('open-baboulas-chat', handleOpenChat);
        };
    }, []);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            role: 'user',
            text: input,
            timestamp: Date.now(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const history = messages.map(msg => ({
                role: msg.role,
                parts: [{ text: msg.text }]
            }));

            // Include current user message in history for context if not using chat session
            // But skill suggests generateContent with structured contents if needed
            // For a simple chatbot, generateContent with the full conversation is often easiest unless it's very long

            const prompt = input;
            
            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: [
                    ...history,
                    { role: 'user', parts: [{ text: prompt }] }
                ],
                config: {
                    systemInstruction: "You are Baboulas AI, a helpful and highly efficient PL-300 Power BI exam tutor from Baboulas Data Lab. You are professional, concise, encouraging, and focus on helping students pass their Microsoft Certified: Power BI Data Analyst Associate exam. Keep responses focused on Power BI and the PL-300 curriculum.",
                    thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
                }
            });

            const botMessage: ChatMessage = {
                role: 'model',
                text: response.text || "I'm sorry, I couldn't process that. Let me try again.",
                timestamp: Date.now(),
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error("Gemini Error:", error);
            const botMessage: ChatMessage = {
                role: 'model',
                text: "Oops! Something went wrong with my connection. Please try again in a moment.",
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, botMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ 
                            opacity: 1, 
                            scale: 1, 
                            y: 0,
                            height: isMinimized ? 'auto' : '500px',
                            width: '380px'
                        }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-card border-2 border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden mb-4"
                    >
                        {/* Header */}
                        <div className="bg-primary p-4 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-xl">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-black text-sm uppercase tracking-tighter">Baboulas AI Chat</span>
                                    <span className="text-[10px] opacity-80 uppercase font-bold">PL-300 Tutor</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={() => setIsMinimized(!isMinimized)}
                                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                                </button>
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {!isMinimized && (
                            <>
                                {/* Messages Container */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
                                    {messages.length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center p-1 overflow-hidden">
                                                <img src="/Dexel.jpg" alt="Dexel" className="w-full h-full object-cover rounded-xl" />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="font-bold text-foreground">Ask me anything about PL-300!</h4>
                                                <p className="text-xs text-slate-500">I can help with DAX, Power Query, Data Modeling, and more.</p>
                                            </div>
                                            <div className="flex flex-wrap justify-center gap-2">
                                                {[
                                                    "What is DAX?",
                                                    "Explain Star Schema",
                                                    "PL-300 exam topics",
                                                ].map(q => (
                                                    <button 
                                                        key={q}
                                                        onClick={() => {
                                                            setInput(q);
                                                            // We set input and the next render will have it, but we can't trigger handleSend directly easily without a ref or timeout
                                                        }}
                                                        className="text-[10px] font-bold bg-white dark:bg-card border border-border px-3 py-1.5 rounded-full hover:border-primary transition-colors hover:text-primary shadow-sm"
                                                    >
                                                        {q}
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
                                            <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                                <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${msg.role === 'user' ? 'bg-secondary text-white' : 'bg-primary/10'}`}>
                                                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <img src="/Dexel.jpg" alt="Dexel" className="w-full h-full object-cover rounded-full" />}
                                                </div>
                                                <div className={`p-3 rounded-2xl text-sm ${
                                                    msg.role === 'user' 
                                                    ? 'bg-secondary text-white rounded-tr-none shadow-md' 
                                                    : 'bg-white dark:bg-card text-foreground border border-border rounded-tl-none shadow-sm'
                                                 }`}>
                                                    {msg.text}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex justify-start">
                                            <div className="flex gap-2 max-w-[85%] flex-row">
                                                <div className="mt-1 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center animate-pulse overflow-hidden">
                                                    <img src="/Dexel.jpg" alt="Dexel" className="w-full h-full object-cover rounded-full" />
                                                </div>
                                                <div className="p-3 bg-white dark:bg-card border border-border rounded-2xl rounded-tl-none shadow-sm">
                                                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Form */}
                                <form onSubmit={handleSend} className="p-4 border-t border-border bg-white dark:bg-card">
                                    <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-border focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                        <input 
                                            type="text" 
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            placeholder="Ask Baboulas AI..."
                                            className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none placeholder:font-bold"
                                        />
                                        <button 
                                            type="submit"
                                            disabled={!input.trim() || isLoading}
                                            className="bg-primary text-white p-2 rounded-xl hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
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

            {/* Float Button */}
            {!isOpen && (
                <motion.button
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(true)}
                    className="bg-primary p-4 rounded-full text-white shadow-2xl relative group"
                >
                    <div className="absolute -inset-1 bg-primary rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <MessageCircle className="w-8 h-8 relative z-10" />
                    <div className="absolute -top-1 -right-1 bg-red-500 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center animate-bounce">
                        <span className="text-[8px] font-black">!</span>
                    </div>
                </motion.button>
            )}
        </div>
    );
};
