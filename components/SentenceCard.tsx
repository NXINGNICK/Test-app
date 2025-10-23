import React, { useState } from 'react';
import type { JapaneseSentence, EnglishSentence, SentenceWithContext } from '../types';
import { GenerationMode } from '../types';
import { ThumbsUpIcon, ThumbsDownIcon } from './icons';

interface SentenceCardProps {
  sentenceWithContext: SentenceWithContext;
  mode: GenerationMode;
  onUpdateReview: (characters: string[], performance: 'correct' | 'incorrect') => void;
}

const SentenceCard: React.FC<SentenceCardProps> = ({ sentenceWithContext, mode, onUpdateReview }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  const { sentence, usedKanjiInSentence } = sentenceWithContext;

  const handleFeedback = (performance: 'correct' | 'incorrect') => {
    console.debug(`SentenceCard: handleFeedback called for Kanji: ${usedKanjiInSentence} with performance: ${performance}`);
    if (usedKanjiInSentence.length > 0) {
      onUpdateReview(usedKanjiInSentence, performance);
    }
    setFeedbackGiven(true);
  };

  const renderContent = () => {
    if (mode === GenerationMode.Japanese) {
      const s = sentence as JapaneseSentence;
      return (
        <div>
          <p className="text-2xl mb-2 font-light tracking-wide text-theme-text">{s.japanese}</p>
          {isRevealed && (
            <div className="mt-4 pt-4 border-t border-theme-border space-y-2">
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
          <p className="text-xl mb-2 font-light text-theme-text">"{s.english}"</p>
          {isRevealed && (
            <div className="mt-4 pt-4 border-t border-theme-border">
              <p className="text-theme-accent text-2xl tracking-wide">{s.japanese}</p>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className={`bg-theme-bg p-4 rounded-lg shadow-md transition-all ${feedbackGiven ? 'opacity-70' : ''}`}>
      {renderContent()}
      <div className="flex justify-end items-center mt-3 gap-3">
        {isRevealed && !feedbackGiven && usedKanjiInSentence.length > 0 && (
            <>
                <button 
                    onClick={() => handleFeedback('incorrect')}
                    className="flex items-center gap-2 text-sm bg-red-800/60 hover:bg-red-700/80 text-red-200 font-semibold py-1 px-3 rounded-md transition-colors"
                    aria-label="Mark as needs review"
                >
                    <ThumbsDownIcon /> Needs review
                </button>
                <button 
                    onClick={() => handleFeedback('correct')}
                    className="flex items-center gap-2 text-sm bg-green-800/60 hover:bg-green-700/80 text-green-200 font-semibold py-1 px-3 rounded-md transition-colors"
                    aria-label="Mark as known"
                >
                    <ThumbsUpIcon /> I knew this
                </button>
            </>
        )}
        <button
          onClick={() => setIsRevealed(!isRevealed)}
          className="text-sm bg-theme-surface hover:bg-theme-border text-theme-accent font-semibold py-1 px-3 rounded-md transition-colors"
        >
          {isRevealed ? 'Hide' : 'Reveal'}
        </button>
      </div>
    </div>
  );
};

export default SentenceCard;
