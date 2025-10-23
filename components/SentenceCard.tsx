import React, { useState } from 'react';
import type { JapaneseSentence, EnglishSentence, SentenceWithContext, WordToken } from '../types';
import { GenerationMode } from '../types';
import { ThumbsUpIcon, ThumbsDownIcon } from './icons';

interface SentenceCardProps {
  sentenceWithContext: SentenceWithContext;
  mode: GenerationMode;
  onUpdateReview: (characters: string[], performance: 'correct' | 'incorrect') => void;
  onWordClick: (word: WordToken) => void;
  isRevealed: boolean;
  onToggleReveal: () => void;
}

const getJlptColorClass = (level: number): string => {
  switch (level) {
    case 5: return 'text-orange-400'; // N5
    case 4: return 'text-green-400';  // N4
    case 3: return 'text-sky-400';    // N3
    case 2: return 'text-purple-400'; // N2
    case 1: return 'text-pink-500';   // N1
    default: return 'text-theme-text'; // Default/no level
  }
};

const SentenceCard: React.FC<SentenceCardProps> = ({ sentenceWithContext, mode, onUpdateReview, onWordClick, isRevealed, onToggleReveal }) => {
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  const { sentence, usedKanjiInSentence } = sentenceWithContext;

  const handleFeedback = (performance: 'correct' | 'incorrect') => {
    if (usedKanjiInSentence.length > 0) {
      onUpdateReview(usedKanjiInSentence, performance);
    }
    setFeedbackGiven(true);
  };

  const renderJapaneseTokens = (tokens: WordToken[]) => (
    <p className="text-3xl mb-2 font-light tracking-wide text-theme-text flex flex-wrap items-center leading-loose">
      {tokens.map((token, i) => {
        // Don't style particles or make them clickable.
        if (token.definition === 'Particle') {
            return <span key={i} className="px-1 text-theme-text font-normal">{token.word}</span>;
        }
        return (
            <button 
                key={i} 
                className={`hover:bg-theme-primary/20 rounded px-1 -mx-1 py-1 transition-colors focus:outline-none focus:bg-theme-primary/30 ${getJlptColorClass(token.jlptLevel)}`}
                onClick={() => onWordClick(token)}
                aria-label={`View details for ${token.word}`}
                title={token.jlptLevel > 0 ? `JLPT N${token.jlptLevel}` : 'Common word'}
            >
                {token.word}
            </button>
        );
      })}
    </p>
  );

  const renderContent = () => {
    if (mode === GenerationMode.Japanese) {
      const s = sentence as JapaneseSentence;
      return (
        <div>
          {isRevealed ? renderJapaneseTokens(s.tokens) : <p className="text-3xl mb-2 font-light tracking-wide text-theme-text">{s.japanese}</p>}
          {isRevealed && (
            <div className="mt-4 pt-4 border-t border-theme-border/50 space-y-2">
              <p className="text-theme-accent text-lg">{s.hiragana}</p>
              <p className="text-theme-text-muted text-base italic">"{s.english}"</p>
            </div>
          )}
        </div>
      );
    } else {
      const s = sentence as EnglishSentence;
      return (
        <div>
          <p className="text-2xl mb-2 font-light text-theme-text">"{s.english}"</p>
          {isRevealed && (
            <div className="mt-4 pt-4 border-t border-theme-border/50">
              {renderJapaneseTokens(s.tokens)}
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className={`bg-theme-surface border border-theme-border p-6 rounded-lg shadow-lg transition-opacity duration-500 ${feedbackGiven ? 'opacity-50' : ''}`}>
      <div className="min-h-[8rem] flex items-center">
        {renderContent()}
      </div>
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-theme-border">
        <div className="flex-1">
            {isRevealed && feedbackGiven && <p className="text-sm text-theme-accent">Feedback recorded!</p>}
        </div>
        <div className="flex justify-end items-center gap-3">
            {isRevealed && !feedbackGiven && usedKanjiInSentence.length > 0 && (
                <>
                    <button 
                        onClick={() => handleFeedback('incorrect')}
                        className="flex items-center gap-2 text-sm bg-red-900/60 hover:bg-red-800/80 text-red-200 font-semibold py-2 px-4 rounded-md transition-colors"
                        aria-label="Mark as needs review"
                    >
                        <ThumbsDownIcon /> Needs Review
                    </button>
                    <button 
                        onClick={() => handleFeedback('correct')}
                        className="flex items-center gap-2 text-sm bg-green-900/60 hover:bg-green-800/80 text-green-200 font-semibold py-2 px-4 rounded-md transition-colors"
                        aria-label="Mark as known"
                    >
                        <ThumbsUpIcon /> I Knew This
                    </button>
                </>
            )}
            <button
            onClick={onToggleReveal}
            className="text-sm bg-theme-border hover:bg-theme-border/70 text-theme-accent font-semibold py-2 px-4 rounded-md transition-colors"
            >
            {isRevealed ? 'Hide Details' : 'Reveal Answer'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default SentenceCard;