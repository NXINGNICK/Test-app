
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-slate-800/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 md:px-6 py-4">
        <h1 className="text-2xl md:text-3xl font-bold text-cyan-400">
          漢字 AI センテンス
          <span className="text-slate-300 ml-3 text-xl font-normal hidden sm:inline">Kanji AI Sentence Creator</span>
        </h1>
      </div>
    </header>
  );
};

export default Header;
