import React, { useEffect, useMemo } from 'react';
import type { WordToken, Kanji, VocabularyItem } from '../types';
import { CloseIcon, BookmarkIcon } from './icons';

const KANJI_REGEX = /[\u4e00-\u9faf\u3400-\u4dbf]/g;

interface WordDetailModalProps {
  word: WordToken | null;
  kanjiList: Kanji[];
  vocabList: VocabularyItem[];
  onClose: () => void;
  onAddVocabulary: (word: WordToken) => void;
  onAddKanji: (kanji: string) => void;
}

const DetailRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="flex justify-between items-baseline py-3 border-b border-theme-border">
        <dt className="text-theme-text-muted">{label}</dt>
        <dd className="text-theme-text font-medium text-right text-lg">{value}</dd>
    </div>
);

const WordDetailModal: React.FC<WordDetailModalProps> = ({ word, kanjiList, vocabList, onClose, onAddVocabulary, onAddKanji }) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const isAlreadyInVocab = useMemo(() => {
    if (!word) return false;
    return vocabList.some(item => item.word === word.word);
  }, [word, vocabList]);

  if (!word) {
    return null;
  }

  const handleAdd = () => {
    onAddVocabulary(word);
    
    const existingKanji = new Set(kanjiList.map(k => k.character));
    const kanjiInWord = word.word.match(KANJI_REGEX) || [];
    const newKanji = kanjiInWord.filter(k => !existingKanji.has(k));
  
    if (newKanji.length > 0) {
      onAddKanji(newKanji.join(''));
      console.debug(`WordDetailModal: Adding new Kanji found in word: ${newKanji.join(', ')}`);
    }
    
    onClose();
  };

  return (
    <div 
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
      <div 
        className="bg-theme-surface rounded-lg shadow-2xl p-6 w-full max-w-md relative border border-theme-border"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-theme-text-muted hover:text-theme-text transition-colors"
          aria-label="Close details"
        >
          <CloseIcon />
        </button>
        
        <div className="text-center mb-6">
            <h2 className="text-5xl font-bold text-theme-text">{word.word}</h2>
        </div>

        <dl className="space-y-1 mb-6">
            <DetailRow label="Reading" value={word.reading} />
            <DetailRow label="Definition" value={`"${word.definition}"`} />
        </dl>

        {!isAlreadyInVocab && (
            <button
                onClick={handleAdd}
                className="w-full bg-theme-primary hover:brightness-110 text-theme-primary-text font-bold py-3 px-4 rounded-md transition-all flex items-center justify-center gap-2"
            >
                <BookmarkIcon /> Add to Library
            </button>
        )}
      </div>
    </div>
  );
};

export default WordDetailModal;
