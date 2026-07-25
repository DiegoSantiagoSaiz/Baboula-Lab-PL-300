import React from 'react';
import { SunIcon } from './icons/SunIcon';
import { Sunset, Sparkles, Sprout } from 'lucide-react';

interface ThemeToggleProps {
  theme: 'light' | 'dim' | 'dark' | 'forest';
  toggleTheme: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggleTheme }) => {
  const renderIcon = () => {
    if (theme === 'light') return <SunIcon className="w-6 h-6 text-orange-500" />;
    if (theme === 'dim') return <Sunset className="w-6 h-6 text-indigo-400" />;
    if (theme === 'dark') return <Sparkles className="w-6 h-6 text-purple-400" />;
    return <Sprout className="w-6 h-6 text-emerald-400" />;
  };

  const getThemeLabel = () => {
    if (theme === 'light') return 'Light';
    if (theme === 'dim') return 'Dim';
    if (theme === 'dark') return 'Tokyo';
    return 'Forest';
  };

  const getNextThemeLabel = () => {
    if (theme === 'light') return 'Dim';
    if (theme === 'dim') return 'Tokyo';
    if (theme === 'dark') return 'Forest';
    return 'Light';
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-xl bg-card hover:bg-border border border-border transition-all focus:outline-none focus:ring-2 focus:ring-primary shadow-sm flex items-center justify-center"
      aria-label={`Switch theme (Current: ${getThemeLabel()})`}
      title={`Switch to ${getNextThemeLabel()} Mode`}
    >
      {renderIcon()}
    </button>
  );
};
