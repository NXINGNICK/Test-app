import { useState, useEffect, useCallback } from 'react';
import type { VocabularyItem, WordToken } from '../types';

const KATAKANA_VOCAB_STORAGE_KEY = 'katakanaVocabularyLibrary';

export const useKatakanaLibrary = () => {
  const [katakanaList, setKatakanaList] = useState<VocabularyItem[]>([]);

  useEffect(() => {
    try {
      const storedVocab = localStorage.getItem(KATAKANA_VOCAB_STORAGE_KEY);
      if (storedVocab) {
        setKatakanaList(JSON.parse(storedVocab));
      }
    } catch (error) {
      console.error("Failed to load Katakana Vocabulary from local storage", error);
    }
  }, []);

  const saveKatakanaList = (list: VocabularyItem[]) => {
    try {
      const sortedList = [...list].sort((a, b) => b.addedAt - a.addedAt);
      setKatakanaList(sortedList);
      localStorage.setItem(KATAKANA_VOCAB_STORAGE_KEY, JSON.stringify(sortedList));
    } catch (error) {
      console.error("Failed to save Katakana Vocabulary to local storage", error);
    }
  };
  
  const addKatakanaItem = useCallback((wordToken: WordToken) => {
    const existingWords = new Set(katakanaList.map(item => item.word));
    if (existingWords.has(wordToken.word)) {
        console.debug(`Katakana item "${wordToken.word}" already exists.`);
        return;
    }

    const newItem: VocabularyItem = {
        ...wordToken,
        addedAt: Date.now(),
    };
    
    saveKatakanaList([...katakanaList, newItem]);
  }, [katakanaList]);

  const deleteKatakanaItem = useCallback((word: string) => {
    console.debug(`useKatakanaLibrary: deleteKatakanaItem called for: ${word}`);
    const updatedList = katakanaList.filter((item) => item.word !== word);
    saveKatakanaList(updatedList);
  }, [katakanaList]);


  return { katakanaList, addKatakanaItem, deleteKatakanaItem };
};
