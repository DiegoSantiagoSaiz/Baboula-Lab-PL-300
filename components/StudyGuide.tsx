import React, { useState, useMemo, useEffect } from 'react';
import { generateStudyGuideStream } from '../services/geminiService';
import type { ProgressData, QuestionCategory, StudyGuideLength } from '../types';
import { Loader } from './Loader';
import { SparklesIcon } from './icons/SparklesIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { useLanguage } from '../utils/LanguageContext';

declare const saveAs: (blob: Blob, filename: string) => void;

interface StudyGuideProps {
  categoryStats: ProgressData['categoryStats'];
}

const categories: (QuestionCategory | 'All Topics')[] = [
    'Prepare the data',
    'Model the data',
    'Visualize and analyze the data',
    'Deploy and maintain assets',
    'All Topics'
];

export const StudyGuide: React.FC<StudyGuideProps> = ({ categoryStats }) => {
    const { language } = useLanguage();
    const [isGenerating, setIsGenerating] = useState(false);
    const [guideContent, setGuideContent] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState('');
    
    const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | 'All Topics'>('Prepare the data');
    const [selectedLength, setSelectedLength] = useState<StudyGuideLength>('Concise');

    const weakestCategory = useMemo(() => {
        let weakest: QuestionCategory | null = null;
        let lowestScore = 101; 

        (Object.keys(categoryStats) as QuestionCategory[]).forEach(key => {
            const stats = categoryStats[key];
            if (stats.total >= 3) { 
                const score = (stats.correct / stats.total) * 100;
                if (score < lowestScore) {
                    lowestScore = score;
                    weakest = key;
                }
            }
        });
        return weakest;
    }, [categoryStats]);

    useEffect(() => {
        if (weakestCategory) {
            setSelectedCategory(weakestCategory);
        }
    }, [weakestCategory]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError('');
        setGuideContent('');
        setShowModal(true); 
        
        const categoryToGenerate = selectedCategory === 'All Topics' ? 'All' : selectedCategory;

        try {
            await generateStudyGuideStream(categoryToGenerate, selectedLength, (chunk: string) => {
                setGuideContent(prev => prev + chunk);
            }, language);
        } catch (err) {
            setError(language === 'es' ? 'Ocurrió un error al generar la guía.' : 'An error occurred during generation.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = () => {
        if (!guideContent) return;
        
        const filename = `PL300_StudyGuide_${selectedCategory.substring(0, 15)}_${new Date().getTime()}.txt`;
        const blob = new Blob([guideContent], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, filename);
    };

    return (
        <>
            <div className="bg-card p-6 rounded-lg shadow-lg flex flex-col min-h-[220px]">
                <div className="flex items-center gap-4 mb-4">
                     <div className="p-3 bg-indigo-500/10 rounded-full text-indigo-400">
                        <SparklesIcon className="w-6 h-6"/>
                    </div>
                    <h3 className="text-xl font-bold">AI Study Guide</h3>
                </div>
                
                <p className="text-slate-300 mb-4 text-sm">Generate a customized technical overview for your study session.</p>

                <div className="mt-auto space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-slate-300 font-semibold mb-1 text-xs">Topic</label>
                            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value as any)} className="w-full bg-input border border-border rounded-md p-2 text-sm">
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div>
                             <label className="block text-slate-300 font-semibold mb-1 text-xs">Detail Level</label>
                            <select value={selectedLength} onChange={(e) => setSelectedLength(e.target.value as any)} className="w-full bg-input border border-border rounded-md p-2 text-sm">
                                <option value="Concise">Concise</option>
                                <option value="Detailed">Detailed</option>
                                <option value="Comprehensive">Comprehensive</option>
                            </select>
                        </div>
                    </div>

                    <button onClick={handleGenerate} disabled={isGenerating} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-4 rounded-md transition disabled:bg-slate-500 flex items-center justify-center gap-2">
                        {isGenerating ? 'Generating...' : 'Generate Study Guide'}
                    </button>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-card rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-border flex justify-between items-center">
                            <h2 className="text-2xl font-bold">Study Guide Preview</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-3xl">&times;</button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            {isGenerating && !guideContent && <Loader text="Generating content..." />}
                            {error && <p className="text-danger">{error}</p>}
                            {guideContent && <div className="prose prose-sm prose-invert max-w-none whitespace-pre-wrap leading-relaxed text-slate-200">{guideContent}</div>}
                        </div>
                         <div className="p-4 border-t border-border flex justify-between items-center">
                            <button onClick={handleDownload} disabled={!guideContent || isGenerating} className="flex items-center gap-2 bg-success text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50 shadow-lg">
                                <DownloadIcon />
                                Download (.txt)
                            </button>
                            <button onClick={() => setShowModal(false)} className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-6 rounded-lg">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};