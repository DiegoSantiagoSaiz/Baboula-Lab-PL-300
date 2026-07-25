import React, { useState, useEffect } from 'react';
import type { Question } from '../types';
import { generateRelatedTips } from '../services/geminiService';
import { LightbulbIcon } from './icons/LightbulbIcon';

interface RelatedTipsProps {
    question: Question;
}

export const RelatedTips: React.FC<RelatedTipsProps> = ({ question }) => {
    const [tips, setTips] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTips = async () => {
            setIsLoading(true);
            const generatedTips = await generateRelatedTips(question);
            setTips(generatedTips);
            setIsLoading(false);
        };

        fetchTips();
    }, [question]);

    if (isLoading) {
        return (
            <div className="mt-4 text-sm text-yellow-400/80 flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Generating extra tips...</span>
            </div>
        );
    }
    
    if (tips.length === 0) {
        return null; // Don't render anything if there are no tips or an error occurred
    }

    return (
        <div className="mt-6 pt-4 border-t border-border/50 animate-fade-in">
            <h5 className="font-semibold text-md mb-2 flex items-center gap-2 text-yellow-400">
                <LightbulbIcon className="w-5 h-5" />
                Related Pro Tips
            </h5>
            <ul className="space-y-2 list-disc list-inside text-slate-300 pl-1">
                {tips.map((tip, index) => (
                    <li key={index} className="text-sm">{tip}</li>
                ))}
            </ul>
        </div>
    );
};
