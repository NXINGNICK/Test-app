import { useState, useEffect, useCallback } from 'react';
import type { VocabularyItem, WordToken } from '../types';

const VOCAB_STORAGE_KEY = 'vocabularyLibrary';

export const useVocabularyLibrary = () => {
  const [vocabList, setVocabList] = useState<VocabularyItem[]>([]);

  useEffect(() => {
    try {
      const storedVocab = localStorage.getItem(VOCAB_STORAGE_KEY);
      if (storedVocab) {
        setVocabList(JSON.parse(storedVocab));
      }
    } catch (error) {
      console.error("Failed to load Vocabulary from local storage", error);
    }
  }, []);

  const saveVocabList = (list: VocabularyItem[]) => {
    try {
      const sortedList = [...list].sort((a, b) => b.addedAt - a.addedAt);
      setVocabList(sortedList);
      localStorage.setItem(VOCAB_STORAGE_KEY, JSON.stringify(sortedList));
    } catch (error) {
      console.error("Failed to save Vocabulary to local storage", error);
    }
  };
  
  const addVocabularyItem = useCallback((wordToken: WordToken) => {
    const existingWords = new Set(vocabList.map(item => item.word));
    if (existingWords.has(wordToken.word)) {
        console.debug(`Vocabulary item "${wordToken.word}" already exists.`);
        return;
    }

    const newItem: VocabularyItem = {
        ...wordToken,
        addedAt: Date.now(),
    };
    
    saveVocabList([...vocabList, newItem]);
  }, [vocabList]);

  const deleteVocabularyItem = useCallback((word: string) => {
    console.debug(`useVocabularyLibrary: deleteVocabularyItem called for: ${word}`);
    const updatedList = vocabList.filter((item) => item.word !== word);
    saveVocabList(updatedList);
  }, [vocabList]);


  return { vocabList, addVocabularyItem, deleteVocabularyItem };
};
