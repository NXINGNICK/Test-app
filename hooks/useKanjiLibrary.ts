import { useState, useEffect, useCallback } from 'react';
import type { Kanji } from '../types';
import { extractKanjiFromImage as geminiExtractKanjiFromImage } from '../services/geminiService';
import { getKanjiDetailsFromKanjiApi } from '../services/jishoService';

const KANJI_STORAGE_KEY = 'kanjiLibrary';
const KANJI_REGEX = /[\u4e00-\u9faf\u3400-\u4dbf]/g;

// SRS Intervals in milliseconds
const SRS_INTERVALS = [
  4 * 60 * 60 * 1000,       // 4 hours
  8 * 60 * 60 * 1000,       // 8 hours
  24 * 60 * 60 * 1000,      // 1 day
  3 * 24 * 60 * 60 * 1000,  // 3 days
  7 * 24 * 60 * 60 * 1000,  // 1 week
  2 * 7 * 24 * 60 * 60 * 1000, // 2 weeks
  30 * 24 * 60 * 60 * 1000, // 1 month
  4 * 30 * 24 * 60 * 60 * 1000, // 4 months
];

export const useKanjiLibrary = () => {
  const [kanjiList, setKanjiList] = useState<Kanji[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    try {
      const storedKanji = localStorage.getItem(KANJI_STORAGE_KEY);
      if (storedKanji) {
        setKanjiList(JSON.parse(storedKanji));
      }
    } catch (error) {
      console.error("Failed to load Kanji from local storage", error);
    }
  }, []);

  const saveKanjiList = (list: Kanji[]) => {
    try {
      const sortedList = [...list].sort((a, b) => b.addedAt - a.addedAt);
      setKanjiList(sortedList);
      localStorage.setItem(KANJI_STORAGE_KEY, JSON.stringify(sortedList));
    } catch (error) {
      console.error("Failed to save Kanji to local storage", error);
    }
  };
  
  const addKanji = useCallback(async (text: string): Promise<number> => {
    console.debug("useKanjiLibrary: addKanji called with text:", text);
    setIsLoading(true);
    try {
        const existingChars = new Set(kanjiList.map(k => k.character));
        const newKanjiChars = [...new Set(text.match(KANJI_REGEX) || [])].filter(
          (char) => !existingChars.has(char)
        );
        console.debug("useKanjiLibrary: Found new unique Kanji characters:", newKanjiChars);

        if (newKanjiChars.length > 0) {
            console.debug("useKanjiLibrary: Fetching details for new Kanji from dictionary API.");
            const kanjiDetailsPromises = newKanjiChars.map(char => getKanjiDetailsFromKanjiApi(char));
            const kanjiDetails = await Promise.all(kanjiDetailsPromises);

            const timestamp = Date.now();
            const newKanji: Kanji[] = newKanjiChars.map((character, index) => {
                const details = kanjiDetails[index];
                return {
                    character,
                    addedAt: timestamp,
                    usedCount: 0,
                    lastUsedAt: 0,
                    jlptLevel: details?.jlpt || null,
                    srsLevel: 0,
                    nextReviewAt: timestamp,
                    lastReviewedAt: 0,
                    correctStreak: 0,
                };
            });
          
            if (newKanji.length > 0) {
              console.debug("useKanjiLibrary: Saving new Kanji to list:", newKanji);
              saveKanjiList([...kanjiList, ...newKanji]);
            }
        }
        return newKanjiChars.length;
    } catch (error) {
        console.error("Failed to add Kanji:", error);
        throw error;
    } finally {
        setIsLoading(false);
    }
  }, [kanjiList]);

  const addKanjiFromImage = useCallback(async (base64Image: string) => {
    console.debug("useKanjiLibrary: addKanjiFromImage called.");
    setIsLoading(true);
    try {
      console.debug("useKanjiLibrary: Calling Gemini to extract Kanji from image.");
      const extractedKanjiText = (await geminiExtractKanjiFromImage(base64Image)).join('');
      console.debug("useKanjiLibrary: Extracted Kanji text from image:", extractedKanjiText);
      // The optimized addKanji function will handle the result efficiently.
      return await addKanji(extractedKanjiText);
    } catch (error) {
      console.error("Failed to extract or add Kanji from image:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [addKanji]);

  const deleteKanji = (character: string) => {
    console.debug(`useKanjiLibrary: deleteKanji called for: ${character}`);
    const updatedList = kanjiList.filter((k) => k.character !== character);
    saveKanjiList(updatedList);
  };

  const updateKanjiUsage = (characters: string[]) => {
    console.debug("useKanjiLibrary: updateKanjiUsage called for:", characters);
    const timestamp = Date.now();
    const updatedList = kanjiList.map(kanji => {
      if (characters.includes(kanji.character)) {
        return {
          ...kanji,
          usedCount: kanji.usedCount + 1,
          lastUsedAt: timestamp,
        };
      }
      return kanji;
    });
    saveKanjiList(updatedList);
  };

  const updateKanjiReview = (characters: string[], performance: 'correct' | 'incorrect') => {
    console.debug(`useKanjiLibrary: updateKanjiReview called for: ${characters} with performance: ${performance}`);
    const timestamp = Date.now();
    const updatedList = kanjiList.map(kanji => {
      if (characters.includes(kanji.character)) {
        let { srsLevel, correctStreak } = kanji;
        if (performance === 'correct') {
            srsLevel++;
            correctStreak++;
        } else {
            srsLevel = Math.max(0, srsLevel - 2);
            correctStreak = 0;
        }

        const interval = performance === 'correct' 
            ? SRS_INTERVALS[Math.min(srsLevel, SRS_INTERVALS.length - 1)]
            : SRS_INTERVALS[0] / 4; // Shorter penalty interval (1 hour)

        return {
          ...kanji,
          srsLevel,
          correctStreak,
          lastReviewedAt: timestamp,
          nextReviewAt: timestamp + interval,
        };
      }
      return kanji;
    });
    saveKanjiList(updatedList);
  };
  
  const updateKanjiProperty = useCallback((character: string, updates: Partial<Kanji>) => {
    console.debug(`useKanjiLibrary: updateKanjiProperty called for: ${character} with updates:`, updates);
    const updatedList = kanjiList.map(kanji => {
      if (kanji.character === character) {
        return { ...kanji, ...updates };
      }
      return kanji;
    });
    saveKanjiList(updatedList);
  }, [kanjiList]);


  return { kanjiList, addKanji, deleteKanji, updateKanjiUsage, isLoading, addKanjiFromImage, updateKanjiReview, updateKanjiProperty };
};