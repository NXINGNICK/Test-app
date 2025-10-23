import React, { useState } from 'react';
import type { Kanji, JapaneseSentence, EnglishSentence, SentenceWithContext, VocabularyItem, WordToken } from '../types';
import { GenerationMode } from '../types';
import { generateJapaneseSentences, generateEnglishSentences } from '../services/geminiService';
import SentenceCard from './SentenceCard';
import WordDetailModal from './WordDetailModal';
import { SpinnerIcon, RefreshIcon } from './icons';

interface SentenceGeneratorProps {
  kanjiList: Kanji[];
  vocabList: VocabularyItem[];
  onUpdateKanjiUsage: (characters: string[]) => void;
  onUpdateKanjiReview: (characters: string[], performance: 'correct' | 'incorrect') => void;
  onAddVocabularyItem: (word: WordToken) => void;
  onAddKanji: (text: string) => Promise<number>;
}

const MASTERED_SRS_LEVEL = 7; 
const PROMPT_KANJI_LIMIT = 10;

const SentenceGenerator: React.FC<SentenceGeneratorProps> = ({ kanjiList, vocabList, onUpdateKanjiUsage, onUpdateKanjiReview, onAddVocabularyItem, onAddKanji }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentences, setSentences] = useState<SentenceWithContext[]>([]);
  const [sessionMode, setSessionMode] = useState<GenerationMode>(GenerationMode.Japanese);
  const [jlptFilter, setJlptFilter] = useState<number>(0);
  const [selectedWord, setSelectedWord] = useState<WordToken | null>(null);
  const [sessionInProgress, setSessionInProgress] = useState(false);
  
  const selectKanjiForPrompt = (): Kanji[] => {
    const now = Date.now();
    let candidates = jlptFilter > 0 ? kanjiList.filter(k => k.jlptLevel === jlptFilter) : [...kanjiList];
    if (candidates.length === 0) return [];
    
    const dueForReview = candidates.filter(k => k.nextReviewAt <= now).sort((a,b) => a.srsLevel - b.srsLevel);
    const leeches = candidates.filter(k => k.nextReviewAt > now && k.srsLevel > 0 && k.srsLevel <= 3 && k.correctStreak <= 1).sort((a, b) => a.lastReviewedAt - b.lastReviewedAt);
    const learningKanji = candidates.filter(k => k.nextReviewAt > now && k.srsLevel < MASTERED_SRS_LEVEL).sort((a, b) => b.addedAt - a.addedAt);
    
    const finalSelection = new Map<string, Kanji>();
    const addItem = (kanji: Kanji) => { if (finalSelection.size < PROMPT_KANJI_LIMIT) { finalSelection.set(kanji.character, kanji); } };
    
    dueForReview.forEach(addItem);
    leeches.forEach(addItem);
    learningKanji.forEach(addItem);
    
    if (finalSelection.size === 0 && candidates.length > 0) {
        const sortedByStaleness = candidates.sort((a,b) => a.lastUsedAt - b.lastUsedAt);
        sortedByStaleness.slice(0, PROMPT_KANJI_LIMIT).forEach(addItem);
    }
    
    return Array.from(finalSelection.values());
  };

  const handleGenerate = async () => {
    const selectedKanji = selectKanjiForPrompt();

    if (selectedKanji.length === 0) {
      setError("No Kanji available for sentence generation with the current filters.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSentences([]);

    try {
      let targetLevel: number | undefined;
      if (jlptFilter > 0) {
        targetLevel = jlptFilter;
      } else {
        const kanjiWithLevels = kanjiList.filter(k => k.jlptLevel !== null && k.jlptLevel > 0);
        if (kanjiWithLevels.length > 0) {
            const sumOfLevels = kanjiWithLevels.reduce((acc, k) => acc + k.jlptLevel!, 0);
            targetLevel = Math.max(1, Math.min(5, Math.round(sumOfLevels / kanjiWithLevels.length)));
        }
      }

      let result: (JapaneseSentence | EnglishSentence)[];
      
      if (sessionMode === GenerationMode.Japanese) {
        result = await generateJapaneseSentences(selectedKanji, targetLevel);
      } else {
        result = await generateEnglishSentences(selectedKanji, targetLevel);
      }

      const sentencesWithContext = result.map(s => ({
          sentence: s,
          usedKanjiInSentence: kanjiList.filter(k => s.japanese.includes(k.character)).map(k => k.character)
      }));
      
      setSentences(sentencesWithContext);
      setSessionInProgress(true);
      const allUsedKanji = [...new Set(sentencesWithContext.flatMap(s => s.usedKanjiInSentence))];
      onUpdateKanjiUsage(allUsedKanji);

    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
      setSessionInProgress(false);
    } finally {
      setIsLoading(false);
    }
  };

  const StartSessionScreen = () => (
    <div className="text-center max-w-lg mx-auto">
        <h2 className="text-3xl font-bold text-theme-text mb-2">Ready to Learn?</h2>
        <p className="text-theme-text-muted mb-8">Configure your review session and let the AI generate targeted practice sentences.</p>
        
        <div className="bg-theme-surface border border-theme-border p-6 rounded-xl space-y-6">
            <div>
                <label className="block text-sm font-medium text-theme-text-muted mb-2">Target JLPT Level</label>
                <select value={jlptFilter} onChange={e => setJlptFilter(Number(e.target.value))} className="w-full bg-theme-bg border border-theme-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-theme-primary text-theme-text">
                    <option value={0}>Automatic (Based on Library)</option>
                    <option value={5}>N5</option> <option value={4}>N4</option> <option value={3}>N3</option> <option value={2}>N2</option> <option value={1}>N1</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-theme-text-muted mb-2">Generation Mode</label>
                <div className="grid grid-cols-2 gap-2 bg-theme-bg p-1 rounded-md border border-theme-border">
                    <button onClick={() => setSessionMode(GenerationMode.Japanese)} className={`px-4 py-2 text-sm font-medium rounded ${sessionMode === GenerationMode.Japanese ? 'bg-theme-primary/80 text-theme-primary-text' : 'text-theme-text-muted hover:bg-theme-border'}`}>Japanese</button>
                    <button onClick={() => setSessionMode(GenerationMode.English)} className={`px-4 py-2 text-sm font-medium rounded ${sessionMode === GenerationMode.English ? 'bg-theme-secondary/80 text-theme-primary-text' : 'text-theme-text-muted hover:bg-theme-border'}`}>English</button>
                </div>
            </div>
             <button
                onClick={handleGenerate}
                disabled={isLoading || kanjiList.length === 0}
                className="w-full bg-gradient-to-r from-theme-primary to-theme-accent hover:brightness-110 disabled:from-theme-border disabled:to-theme-border/80 disabled:cursor-not-allowed disabled:text-theme-text-muted text-theme-primary-text font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center text-lg shadow-lg"
            >
                {isLoading ? <SpinnerIcon /> : 'Start Review Session'}
            </button>
             {kanjiList.length === 0 && <p className="text-xs text-yellow-400 mt-2">Your Kanji library is empty. Please add some Kanji to start a session.</p>}
        </div>
    </div>
  );

  const SessionScreen = () => (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-theme-text">Review Session</h2>
            <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="flex items-center gap-2 text-sm bg-theme-surface hover:bg-theme-border border border-theme-border text-theme-accent font-semibold py-2 px-4 rounded-md transition-colors"
                title="Generate new sentences with the same settings"
            >
                {isLoading ? <SpinnerIcon /> : <RefreshIcon />} New Set
            </button>
        </div>
        <div className="space-y-4">
            {sentences.map((sentenceWithContext, index) => (
            <SentenceCard key={index} sentenceWithContext={sentenceWithContext} mode={sessionMode!} onUpdateReview={onUpdateKanjiReview} onWordClick={setSelectedWord} />
            ))}
        </div>
    </div>
  );


  return (
    <div className="h-full">
      {error && <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-md mb-4">{error}</div>}
      
      {!sessionInProgress && !isLoading ? <StartSessionScreen /> : null}
      
      {isLoading && !sessionInProgress && (
            <div className="text-center py-8 text-theme-text-muted flex flex-col items-center gap-4">
                <SpinnerIcon />
                <p>Building your personalized review session...</p>
            </div>
      )}

      {sessionInProgress ? <SessionScreen/> : null}

      <WordDetailModal 
        word={selectedWord}
        onClose={() => setSelectedWord(null)}
        kanjiList={kanjiList}
        vocabList={vocabList}
        onAddVocabulary={onAddVocabularyItem}
        onAddKanji={onAddKanji}
      />
    </div>
  );
};

export default SentenceGenerator;