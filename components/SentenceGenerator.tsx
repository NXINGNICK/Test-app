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
    console.debug("SentenceGenerator: selectKanjiForPrompt called.");
    const now = Date.now();
    let candidates = [...kanjiList];
    console.debug("SentenceGenerator: Initial candidates:", candidates.length);

    if (jlptFilter > 0) {
        candidates = candidates.filter(k => k.jlptLevel === jlptFilter);
        console.debug("SentenceGenerator: Candidates after JLPT filter (N" + jlptFilter + "):", candidates.length);
    }
    
    if (candidates.length === 0) {
        console.debug("SentenceGenerator: No candidates after filtering.");
        return [];
    }

    const dueForReview = candidates
        .filter(k => k.nextReviewAt <= now)
        .sort((a,b) => a.srsLevel - b.srsLevel); // Prioritize lower SRS levels
    console.debug("SentenceGenerator: Due for review candidates:", dueForReview.map(k => k.character));

    if (dueForReview.length > 0) {
        const result = dueForReview.slice(0, 7); // Focus on up to 7 review items
        console.debug("SentenceGenerator: Selected due for review Kanji:", result.map(k => k.character));
        return result;
    }
    
    // If no reviews, fall back to recency and staleness
    console.debug("SentenceGenerator: No items due for review. Falling back to recency/staleness.");
    if (candidates.length <= 7) {
      console.debug("SentenceGenerator: Selected all remaining candidates as there are 7 or less:", candidates.map(k => k.character));
      return candidates;
    }

    const sortedByRecency = [...candidates].sort((a, b) => b.addedAt - a.addedAt);
    const sortedByStaleness = [...candidates].sort((a, b) => a.lastUsedAt - b.lastUsedAt);

    const recentKanji = sortedByRecency.slice(0, 5);
    const staleKanji = sortedByStaleness.slice(0, 3);
    
    const combined = new Map<string, Kanji>();
    [...recentKanji, ...staleKanji].forEach(k => combined.set(k.character, k));
    
    const finalSelection = Array.from(combined.values());
    console.debug("SentenceGenerator: Selected Kanji by recency/staleness:", finalSelection.map(k => k.character));
    return finalSelection;
  };

  const handleGenerate = async (generationMode: GenerationMode) => {
    console.debug(`SentenceGenerator: handleGenerate called with mode: ${generationMode}`);
    const selectedKanji = selectKanjiForPrompt();
    console.debug("SentenceGenerator: Kanji selected for prompt:", selectedKanji.map(k => ({char: k.character, srs: k.srsLevel, due: new Date(k.nextReviewAt).toISOString()})));

    if (selectedKanji.length === 0) {
      const errorMsg = "No Kanji available for sentence generation with the current filters. Please add some or adjust your filters.";
      console.error("SentenceGenerator:", errorMsg);
      setError(errorMsg);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSentences([]);
    setMode(generationMode);

    try {
      let targetLevel: number | undefined;
      if (jlptFilter > 0) {
        targetLevel = jlptFilter;
      } else {
        const kanjiWithLevels = kanjiList.filter(k => k.jlptLevel !== null && k.jlptLevel > 0);
        if (kanjiWithLevels.length > 0) {
            const sumOfLevels = kanjiWithLevels.reduce((acc, k) => acc + k.jlptLevel!, 0);
            const averageLevel = Math.round(sumOfLevels / kanjiWithLevels.length);
            targetLevel = Math.max(1, Math.min(5, averageLevel)); // Clamp between N1 and N5
            console.debug(`SentenceGenerator: No JLPT filter selected. Calculated average JLPT level of library: N${targetLevel}`);
        } else {
            console.debug("SentenceGenerator: No JLPT filter and no Kanji with JLPT levels in library. Target level is undefined.");
        }
      }

      let result: (JapaneseSentence | EnglishSentence)[];
      
      console.debug(`SentenceGenerator: Starting sentence generation API call with target level: ${targetLevel ? 'N' + targetLevel : 'default (N4/N3)'}.`);
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
      
      console.debug("SentenceGenerator: Successfully received and processed sentences:", sentencesWithContext);
      setSentences(sentencesWithContext);
      const allUsedKanji = [...new Set(sentencesWithContext.flatMap(s => s.usedKanjiInSentence))];
      console.debug("SentenceGenerator: Updating usage for Kanji:", allUsedKanji);
      onUpdateKanjiUsage(allUsedKanji);

    } catch (err) {
      console.error("SentenceGenerator: Error during generation:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-theme-surface p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4 text-theme-accent">Sentence Generation</h2>
      <div className="mb-4">
        <select value={jlptFilter} onChange={e => setJlptFilter(Number(e.target.value))} className="w-full bg-theme-bg border border-theme-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-theme-primary text-theme-text">
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
          className="w-full sm:w-1/2 bg-theme-primary hover:brightness-110 disabled:bg-theme-border disabled:cursor-not-allowed text-theme-primary-text font-bold py-3 px-4 rounded-md transition-all flex items-center justify-center"
        >
          {isLoading && mode === GenerationMode.Japanese && <SpinnerIcon />} Form Japanese Sentences
        </button>
        <button
          onClick={() => handleGenerate(GenerationMode.English)}
          disabled={isLoading}
          className="w-full sm:w-1/2 bg-theme-secondary hover:brightness-110 disabled:bg-theme-border disabled:cursor-not-allowed text-theme-primary-text font-bold py-3 px-4 rounded-md transition-all flex items-center justify-center"
        >
          {isLoading && mode === GenerationMode.English && <SpinnerIcon />} Form English Sentences
        </button>
      </div>

      {error && <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-md mb-4">{error}</div>}

      <div className="space-y-4">
        {isLoading && (
            <div className="text-center py-8 text-theme-text-muted">
                <p>AI is thinking... this may take a moment.</p>
            </div>
        )}
        {!isLoading && sentences.length === 0 && (
            <div className="text-center py-8 text-theme-text-muted">
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
