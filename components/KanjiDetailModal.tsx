import React, { useEffect } from 'react';
import type { Kanji } from '../types';
import { CloseIcon } from './icons';

interface KanjiDetailModalProps {
  kanji: Kanji | null;
  onClose: () => void;
}

const formatDate = (timestamp: number) => {
  if (!timestamp || timestamp === 0) return 'Never';
  return new Date(timestamp).toLocaleString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const DetailRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="flex justify-between items-baseline py-2 border-b border-theme-border">
        <dt className="text-theme-text-muted">{label}</dt>
        <dd className="text-theme-text font-medium text-right">{value}</dd>
    </div>
);


const KanjiDetailModal: React.FC<KanjiDetailModalProps> = ({ kanji, onClose }) => {
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

  if (!kanji) {
    return null;
  }

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
            <h2 className="text-7xl font-bold text-theme-text">{kanji.character}</h2>
            <p className="text-theme-accent text-xl">{kanji.jlptLevel ? `JLPT N${kanji.jlptLevel}` : 'Not a JLPT Kanji'}</p>
        </div>

        <dl className="space-y-1">
            <DetailRow label="SRS Level" value={kanji.srsLevel} />
            <DetailRow label="Correct Streak" value={kanji.correctStreak} />
            <DetailRow label="Used in Sentences" value={kanji.usedCount} />
            <DetailRow label="Date Added" value={formatDate(kanji.addedAt)} />
            <DetailRow label="Last Used" value={formatDate(kanji.lastUsedAt)} />
            <DetailRow label="Last Reviewed" value={formatDate(kanji.lastReviewedAt)} />
            <DetailRow label="Next Review" value={formatDate(kanji.nextReviewAt)} />
        </dl>

      </div>
    </div>
  );
};

export default KanjiDetailModal;
