import React from 'react';
import { SettingsIcon, LibraryIcon } from './icons';

interface HeaderProps {
    onOpenThemeCustomizer: () => void;
    onToggleLibrary: () => void;
    isLibraryOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ onOpenThemeCustomizer, onToggleLibrary, isLibraryOpen }) => {
  return (
    <header className="bg-theme-surface/80 backdrop-blur-sm sticky top-0 z-20 border-b border-theme-border">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
            <button 
              onClick={onToggleLibrary} 
              className="text-theme-text-muted hover:text-theme-text transition-colors"
              aria-label={isLibraryOpen ? "Close library" : "Open library"}
            >
                <LibraryIcon />
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-theme-accent">
            漢字 AI
            <span className="text-theme-text ml-2 text-lg font-normal hidden sm:inline">Sentence Creator</span>
            </h1>
        </div>
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