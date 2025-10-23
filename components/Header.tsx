import React from 'react';
import { SettingsIcon } from './icons';

interface HeaderProps {
    onOpenThemeCustomizer: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenThemeCustomizer }) => {
  return (
    <header className="bg-theme-surface/80 backdrop-blur-sm sticky top-0 z-10 border-b border-theme-border">
      <div className="container mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-theme-accent">
          漢字 AI センテンス
          <span className="text-theme-text ml-3 text-xl font-normal hidden sm:inline">Kanji AI Sentence Creator</span>
        </h1>
        <button 
          onClick={onOpenThemeCustomizer} 
          className="text-theme-text-muted hover:text-theme-text transition-colors"
          aria-label="Open theme settings"
        >
            <SettingsIcon />
        </button>
      </div>
    </header>
  );
};

export default Header;
