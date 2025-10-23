import { useState, useEffect } from 'react';
import type { EnrichedKanjiData } from '../types';
import { getEnrichedKanjiData } from '../services/wanikaniService';

export const useWaniKaniData = (character: string | null) => {
  const [data, setData] = useState<EnrichedKanjiData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!character) {
      setData(null);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setData(null);

      try {
        const result = await getEnrichedKanjiData(character);
        setData(result);
      } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError("An unknown error occurred while fetching WaniKani data.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [character]);

  return { data, isLoading, error };
};
