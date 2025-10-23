import React, { useEffect } from 'react';
import type { Kanji, WaniKaniRadical, WaniKaniVocabulary, WaniKaniReading, WaniKaniMeaning } from '../types';
import { useWaniKaniData } from '../hooks/useWaniKaniData';
import { CloseIcon, SpinnerIcon } from './icons';

interface KanjiDetailModalProps {
  kanji: Kanji | null;
  onClose: () => void;
}

const RadicalCharacter: React.FC<{ radical: WaniKaniRadical }> = ({ radical }) => {
    if (radical.data.character) {
        return <span className="text-2xl">{radical.data.character}</span>;
    }
    const svgImage = radical.data.character_images.find(
        img => img.content_type === 'image/svg+xml' && img.metadata.style_name === 'original'
    );
    if (svgImage) {
        // Use a filter to invert the colors of the SVG for dark mode
        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" className="w-full h-full" style="filter: invert(1);"><g>${svgImage.url.substring(svgImage.url.indexOf('<path'))}</g></svg>`;
        return <div className="w-6 h-6" dangerouslySetInnerHTML={{ __html: svgContent }} />;
    }
    return null;
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h3 className="text-sm font-semibold text-theme-accent uppercase tracking-wider mb-2">{title}</h3>
        {children}
    </div>
);

const Pill: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = 'bg-theme-bg' }) => (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${className}`}>
        {children}
    </span>
);

const WaniKaniDetails: React.FC<{ character: string; onClose: () => void }> = ({ character, onClose }) => {
    const { data, isLoading, error } = useWaniKaniData(character);

    if (isLoading) {
        return <div className="flex flex-col items-center justify-center text-center p-8 gap-4"><SpinnerIcon /><p>Loading WaniKani data...</p></div>;
    }

    if (error) {
        return (
             <div className="text-center p-8">
                <p className="text-red-400 mb-4">{error}</p>
                <p className="text-sm text-theme-text-muted">Please ensure your API key is correct in the Settings menu (gear icon).</p>
            </div>
        );
    }

    if (!data) return null;

    const { kanji, radicals, vocabulary } = data;
    const primaryMeanings = kanji.data.meanings.filter(m => m.primary).map(m => m.meaning);
    const otherMeanings = kanji.data.meanings.filter(m => !m.primary).map(m => m.meaning);
    const onyomi = kanji.data.readings.filter(r => r.type === 'onyomi').map(r => r.reading);
    const kunyomi = kanji.data.readings.filter(r => r.type === 'kunyomi').map(r => r.reading);
    
    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-7xl font-bold text-theme-text">{kanji.data.characters}</h2>
                <div className="flex flex-wrap gap-2 justify-center mt-3">
                    {primaryMeanings.map(m => <Pill key={m} className="bg-theme-primary text-theme-primary-text text-base">{m}</Pill>)}
                </div>
                 {otherMeanings.length > 0 && <p className="text-xs text-theme-text-muted mt-2">Also: {otherMeanings.join(', ')}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Section title="Readings">
                    <div className="space-y-3">
                        {onyomi.length > 0 && <div><h4 className="text-xs text-theme-text-muted mb-1">On'yomi</h4><div className="flex flex-wrap gap-2">{onyomi.map(r => <Pill key={r}>{r}</Pill>)}</div></div>}
                        {kunyomi.length > 0 && <div><h4 className="text-xs text-theme-text-muted mb-1">Kun'yomi</h4><div className="flex flex-wrap gap-2">{kunyomi.map(r => <Pill key={r}>{r}</Pill>)}</div></div>}
                    </div>
                </Section>

                <Section title="Component Radicals">
                    <div className="flex flex-wrap gap-3">
                        {radicals.map(r => (
                            <div key={r.id} className="bg-theme-bg p-2 rounded-md flex items-center gap-3" title={r.data.meanings.find(m=>m.primary)?.meaning}>
                                <RadicalCharacter radical={r} />
                                <span className="text-sm text-theme-text">{r.data.meanings.find(m=>m.primary)?.meaning}</span>
                            </div>
                        ))}
                    </div>
                </Section>
            </div>

            <Section title="Vocabulary">
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 -mr-2">
                    {vocabulary.map(v => (
                        <div key={v.id} className="bg-theme-bg p-3 rounded-md">
                            <p className="text-lg text-theme-text">{v.data.characters} <span className="text-sm text-theme-accent ml-2">{v.data.readings[0].reading}</span></p>
                            <p className="text-sm text-theme-text-muted italic">"{v.data.meanings.find(m=>m.primary)?.meaning}"</p>
                        </div>
                    ))}
                </div>
            </Section>
        </div>
    );
};

const KanjiDetailModal: React.FC<KanjiDetailModalProps> = ({ kanji, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!kanji) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose} aria-modal="true" role="dialog">
      <div className="bg-theme-surface rounded-lg shadow-2xl p-6 w-full max-w-2xl relative border border-theme-border" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 text-theme-text-muted hover:text-theme-text transition-colors" aria-label="Close details">
          <CloseIcon />
        </button>
        <WaniKaniDetails character={kanji.character} onClose={onClose} />
      </div>
    </div>
  );
};

export default KanjiDetailModal;
