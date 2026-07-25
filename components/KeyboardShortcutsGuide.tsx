
import React from 'react';
import type { QuizMode } from '../types';

interface KeyboardShortcutsGuideProps {
    mode: QuizMode;
}

export const KeyboardShortcutsGuide: React.FC<KeyboardShortcutsGuideProps> = ({ mode }) => {
  const keyStyle = "bg-slate-700 border-b-2 border-slate-900 rounded-md px-2 py-0.5 font-mono text-sm text-slate-300";

  return (
    <div className="text-center text-xs text-slate-400 mt-6 space-x-2 md:space-x-4">
      <span>
        <kbd className={keyStyle}>Enter</kbd> Submit
      </span>
      <span>
        <kbd className={keyStyle}>N</kbd> Next
      </span>
       {mode !== 'Exam' && (
        <span>
          <kbd className={keyStyle}>S</kbd> Skip
        </span>
       )}
      <span>
        <kbd className={keyStyle}>B</kbd> Bookmark
      </span>

    </div>
  );
};
