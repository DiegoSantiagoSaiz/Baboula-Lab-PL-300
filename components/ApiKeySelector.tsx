import React from 'react';
import { KeyIcon } from './icons/KeyIcon';

interface ApiKeySelectorProps {
    onKeySelected: () => void;
}

// Fix: Resolved a TypeScript declaration conflict for `window.aistudio`.
// The error message indicates that 'window.aistudio' must be of type 'AIStudio'.
// Using a named interface `AIStudio` aligns this declaration with other potential
// declarations in the project, resolving the type mismatch.
declare global {
    interface AIStudio {
        hasSelectedApiKey: () => Promise<boolean>;
        openSelectKey: () => Promise<void>;
    }
    
    interface Window {
        aistudio?: AIStudio;
    }
}

export const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySelected }) => {
    
    const handleSelectKey = async () => {
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            // Persist the fact that the user has attempted to select a key for this session.
            sessionStorage.setItem('apiKeySelectionAttempted', 'true');
            // Assume key selection was successful to avoid race conditions and immediately unlock the app.
            onKeySelected();
        }
    };

    return (
        <div className="max-w-xl mx-auto mt-16 p-8 bg-card rounded-lg shadow-lg text-center animate-fade-in-up">
            <KeyIcon className="w-16 h-16 mx-auto text-primary mb-4" />
            <h2 className="text-3xl font-bold text-center mb-4">API Key Required</h2>
            <p className="text-slate-300 mb-6">
                To generate questions and personalized feedback, this application needs access to the Gemini API. Please select your API key to continue.
            </p>
            <button
                onClick={handleSelectKey}
                className="w-full bg-primary hover:bg-primary-dark text-primary-foreground font-bold py-3 px-4 rounded-lg text-lg"
            >
                Select API Key
            </button>
            <p className="text-xs text-slate-400 mt-4">
                This app uses generative AI. For information about billing, see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-primary-light hover:underline">Gemini API billing documentation</a>.
            </p>
        </div>
    );
};