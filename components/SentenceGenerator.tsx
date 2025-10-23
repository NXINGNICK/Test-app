import React, { useState } from 'react';
import type { Kanji, JapaneseSentence, EnglishSentence, SentenceWithContext } from '../types';
import { GenerationMode } from '../types';
import { generateJapaneseSentences, generateEnglishSentences } from '../services/geminiService';
import SentenceCard from './SentenceCard';
import { SpinnerIcon } from './icons';

interface SentenceGeneratorProps {
  kanjiList: Kanji[];
  onUpdateKanjiUsage: (characters: string[]) => void;
  onUpdateKanjiReview: (characters: string[], performance: 'correct' | 'incorrect') => void;
}

const SentenceGenerator: React.FC<SentenceGeneratorProps> = ({ kanjiList, onUpdateKanjiUsage, onUpdateKanjiReview }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentences, setSentences] = useState<SentenceWithContext[]>([]);
  const [mode, setMode] = useState<GenerationMode | null>(null);
  const [jlptFilter, setJlptFilter] = useState<number>(0); // 0 for any
  
  const selectKanjiForPrompt = (): Kanji[] => {
    const now = Date.now();
    let candidates = [...kanjiList];

    if (jlptFilter > 0) {
        candidates = candidates.filter(k => k.jlptLevel === jlptFilter);
    }
    
    if (candidates.length === 0) return [];

    const dueForReview = candidates
        .filter(k => k.nextReviewAt <= now)
        .sort((a,b) => a.srsLevel - b.srsLevel); // Prioritize lower SRS levels

    if (dueForReview.length > 0) {
        return dueForReview.slice(0, 7); // Focus on up to 7 review items
    }
    
    // If no reviews, fall back to recency and staleness
    if (candidates.length <= 7) return candidates;

    const sortedByRecency = [...candidates].sort((a, b) => b.addedAt - a.addedAt);
    const sortedByStaleness = [...candidates].sort((a, b) => a.lastUsedAt - b.lastUsedAt);

    const recentKanji = sortedByRecency.slice(0, 5);
    const staleKanji = sortedByStaleness.slice(0, 3);
    
    const combined = new Map<string, Kanji>();
    [...recentKanji, ...staleKanji].forEach(k => combined.set(k.character, k));
    
    return Array.from(combined.values());
  };

  const handleGenerate = async (generationMode: GenerationMode) => {
    const selectedKanji = selectKanjiForPrompt();

    if (selectedKanji.length === 0) {
      setError("No Kanji available for sentence generation with the current filters. Please add some or adjust your filters.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSentences([]);
    setMode(generationMode);

    try {
      let result: (JapaneseSentence | EnglishSentence)[];
      const targetLevel = jlptFilter > 0 ? jlptFilter : undefined;

      if (generationMode === GenerationMode.Japanese) {
        result = await generateJapaneseSentences(selectedKanji, targetLevel);
      } else {
        result = await generateEnglishSentences(selectedKanji, targetLevel);
      }

      const sentencesWithContext = result.map(s => {
        const japaneseText = generationMode === GenerationMode.Japanese ? (s as JapaneseSentence).japanese : (s as EnglishSentence).japanese;
        const usedKanjiInSentence = kanjiList
            .filter(k => japaneseText.includes(k.character))
            .map(k => k.character);
        return { sentence: s, usedKanjiInSentence };
      });
      
      setSentences(sentencesWithContext);
      const allUsedKanji = [...new Set(sentencesWithContext.flatMap(s => s.usedKanjiInSentence))];
      onUpdateKanjiUsage(allUsedKanji);

    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4 text-cyan-300">Sentence Generation</h2>
      <div className="mb-4">
        <select value={jlptFilter} onChange={e => setJlptFilter(Number(e.target.value))} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500">
            <option value={0}>Target JLPT Level (Any)</option>
            <option value={5}>N5</option>
            <option value={4}>N4</option>
            <option value={3}>N3</option>
            <option value={2}>N2</option>
            <option value={1}>N1</option>
        </select>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <button
          onClick={() => handleGenerate(GenerationMode.Japanese)}
          disabled={isLoading}
          className="w-full sm:w-1/2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition-colors flex items-center justify-center"
        >
          {isLoading && mode === GenerationMode.Japanese && <SpinnerIcon />} Form Japanese Sentences
        </button>
        <button
          onClick={() => handleGenerate(GenerationMode.English)}
          disabled={isLoading}
          className="w-full sm:w-1/2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition-colors flex items-center justify-center"
        >
          {isLoading && mode === GenerationMode.English && <SpinnerIcon />} Form English Sentences
        </button>
      </div>

      {error && <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-md mb-4">{error}</div>}

      <div className="space-y-4">
        {isLoading && (
            <div className="text-center py-8 text-slate-400">
                <p>AI is thinking... this may take a moment.</p>
            </div>
        )}
        {!isLoading && sentences.length === 0 && (
            <div className="text-center py-8 text-slate-400">
                <p>Generate sentences to start your review session!</p>
            </div>
        )}
        {sentences.map((sentenceWithContext, index) => (
          <SentenceCard key={index} sentenceWithContext={sentenceWithContext} mode={mode!} onUpdateReview={onUpdateKanjiReview} />
        ))}
      </div>
    </div>
  );
};

export default SentenceGenerator;
