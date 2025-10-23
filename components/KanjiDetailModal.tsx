import React, { useEffect, useState } from 'react';
import type { Kanji, WaniKaniRadical, WaniKaniVocabulary, KanjiApiData } from '../types';
import { useWaniKaniData } from '../hooks/useWaniKaniData';
import { getKanjiDetailsFromKanjiApi } from '../services/jishoService';
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
        const svgContent = `<svg xmlns="http://www.w.org/2000/svg" viewBox="0 0 1024 1024" className="w-full h-full" style="filter: invert(1);"><g>${svgImage.url.substring(svgImage.url.indexOf('<path'))}</g></svg>`;
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

const Mnemonic: React.FC<{ mnemonicHtml: string; hint?: string }> = ({ mnemonicHtml, hint }) => {
    const processedHtml = mnemonicHtml
        .replace(/<p>/g, '<p class="mb-3 last:mb-0 leading-relaxed">')
        .replace(/<span class="kanji">/g, '<span class="text-theme-accent font-semibold">')
        .replace(/<span class="radical">/g, '<span class="text-indigo-400 font-semibold">')
        .replace(/<span class="reading">/g, '<span class="text-cyan-400 font-semibold">');

    return (
        <div className="bg-theme-bg p-4 rounded-lg text-theme-text-muted text-base">
            {hint && <p className="text-sm italic border-l-4 border-theme-border pl-3 mb-4"><strong>Hint:</strong> {hint}</p>}
            <div dangerouslySetInnerHTML={{ __html: processedHtml }} />
        </div>
    );
};


const WaniKaniDataView: React.FC<{ data: NonNullable<ReturnType<typeof useWaniKaniData>['data']> }> = ({ data }) => {
    const { kanji, radicals, vocabulary } = data;
    const { meaning_mnemonic, reading_mnemonic, meaning_hint, reading_hint } = kanji.data;
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

            {meaning_mnemonic && ( <Section title="Meaning Mnemonic"><Mnemonic mnemonicHtml={meaning_mnemonic} hint={meaning_hint} /></Section>)}
            {reading_mnemonic && ( <Section title="Reading Mnemonic"><Mnemonic mnemonicHtml={reading_mnemonic} hint={reading_hint} /></Section>)}

            <Section title="Vocabulary">
                <div className="space-y-2 max-h-56 overflow-y-auto pr-2 -mr-2 custom-scrollbar">
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

const FallbackDataView: React.FC<{ data: KanjiApiData }> = ({ data }) => {
    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-7xl font-bold text-theme-text">{data.kanji}</h2>
                <div className="flex flex-wrap gap-2 justify-center mt-3">
                     <Pill className="bg-theme-primary text-theme-primary-text text-base">{data.meanings.join(', ')}</Pill>
                </div>
                <p className="text-xs text-theme-text-muted mt-2">(Fallback data from KanjiAPI.dev)</p>
            </div>
            <Section title="Readings">
                <div className="space-y-3">
                    {data.on_readings.length > 0 && <div><h4 className="text-xs text-theme-text-muted mb-1">On'yomi</h4><div className="flex flex-wrap gap-2">{data.on_readings.map(r => <Pill key={r}>{r}</Pill>)}</div></div>}
                    {data.kun_readings.length > 0 && <div><h4 className="text-xs text-theme-text-muted mb-1">Kun'yomi</h4><div className="flex flex-wrap gap-2">{data.kun_readings.map(r => <Pill key={r}>{r}</Pill>)}</div></div>}
                </div>
            </Section>
             <Section title="Stats">
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div><h4 className="text-xs text-theme-text-muted">JLPT</h4><p className="text-2xl">{data.jlpt ? `N${data.jlpt}` : 'N/A'}</p></div>
                    <div><h4 className="text-xs text-theme-text-muted">Strokes</h4><p className="text-2xl">{data.stroke_count}</p></div>
                </div>
            </Section>
        </div>
    )
};

const KanjiDetailsView: React.FC<{ character: string; onClose: () => void }> = ({ character, onClose }) => {
    const waniKani = useWaniKaniData(character);
    const [fallbackData, setFallbackData] = useState<KanjiApiData | null>(null);
    const [isFallbackLoading, setIsFallbackLoading] = useState(false);

    useEffect(() => {
        const fetchFallback = async () => {
            if (waniKani.error && !waniKani.isLoading && !fallbackData) {
                setIsFallbackLoading(true);
                const data = await getKanjiDetailsFromKanjiApi(character);
                setFallbackData(data);
                setIsFallbackLoading(false);
            }
        };
        fetchFallback();
    }, [waniKani.error, waniKani.isLoading, character, fallbackData]);

    if (waniKani.isLoading || isFallbackLoading) {
        return <div className="flex flex-col items-center justify-center text-center p-8 gap-4"><SpinnerIcon /><p>Loading Kanji data...</p></div>;
    }
    
    if (waniKani.data) {
        return <WaniKaniDataView data={waniKani.data} />;
    }
    
    if (fallbackData) {
        return <FallbackDataView data={fallbackData} />;
    }

    if (waniKani.error) {
        return (
             <div className="text-center p-8">
                <p className="text-red-400 mb-4">{waniKani.error}</p>
                <p className="text-sm text-theme-text-muted">Could not load details for this Kanji from WaniKani or the fallback dictionary.</p>
            </div>
        );
    }

    return null;
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
      <div className="bg-theme-surface rounded-lg shadow-2xl p-6 w-full max-w-2xl relative border border-theme-border max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 text-theme-text-muted hover:text-theme-text transition-colors" aria-label="Close details">
          <CloseIcon />
        </button>
        <KanjiDetailsView character={kanji.character} onClose={onClose} />
      </div>
    </div>
  );
};

export default KanjiDetailModal;