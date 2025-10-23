import type { WaniKaniSubject, WaniKaniKanji, WaniKaniRadical, WaniKaniVocabulary, EnrichedKanjiData } from '../types';

const API_BASE_URL = 'https://api.wanikani.com/v2';
const API_KEY_STORAGE_KEY = 'wanikaniApiKey';
const CACHE_PREFIX = 'wanikani_subject_';
const CACHE_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

// --- API Key Management ---
export const getWaniKaniApiKey = (): string | null => {
  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const setWaniKaniApiKey = (apiKey: string): void => {
  try {
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
  } catch (error) {
    console.error("Failed to save WaniKani API key to local storage", error);
  }
};

// --- Caching Layer ---
interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

const getFromCache = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    
    const entry: CacheEntry<T> = JSON.parse(item);
    if (Date.now() - entry.timestamp > CACHE_EXPIRATION_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
};

const setInCache = <T>(key: string, data: T): void => {
  try {
    const entry: CacheEntry<T> = {
      timestamp: Date.now(),
      data,
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    console.error(`Failed to save to cache with key ${key}`, error);
  }
};


// --- API Fetching ---
const fetchFromWaniKani = async <T>(endpoint: string, apiKey: string): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Wanikani-Revision': '20170710',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`WaniKani API error: ${response.status} ${response.statusText}. ${errorData.error || ''}`.trim());
  }

  const data = await response.json();
  return data;
};

interface WaniKaniCollectionResponse<T> {
    data: T[];
    total_count: number;
}

const getSubjectsByIds = async (ids: number[], apiKey: string): Promise<WaniKaniSubject[]> => {
    if (ids.length === 0) return [];
    
    const idsToFetch: number[] = [];
    const cachedSubjects: WaniKaniSubject[] = [];

    // Check cache first
    ids.forEach(id => {
        const cached = getFromCache<WaniKaniSubject>(`${CACHE_PREFIX}${id}`);
        if (cached) {
            cachedSubjects.push(cached);
        } else {
            idsToFetch.push(id);
        }
    });

    if (idsToFetch.length === 0) {
        return cachedSubjects;
    }

    const fetchedData = await fetchFromWaniKani<WaniKaniCollectionResponse<WaniKaniSubject>>(`subjects?ids=${idsToFetch.join(',')}`, apiKey);
    const subjects = fetchedData.data;
    
    // Add new data to cache
    subjects.forEach(subject => setInCache(`${CACHE_PREFIX}${subject.id}`, subject));

    return [...cachedSubjects, ...subjects];
};

const getKanjiSubject = async (character: string, apiKey: string): Promise<WaniKaniKanji | null> => {
    const cacheKey = `${CACHE_PREFIX}kanji_${character}`;
    const cached = getFromCache<WaniKaniKanji>(cacheKey);
    if (cached) return cached;

    const response = await fetchFromWaniKani<WaniKaniCollectionResponse<WaniKaniKanji>>(`subjects?types=kanji&slugs=${encodeURIComponent(character)}`, apiKey);

    if (response.data.length > 0) {
        const kanji = response.data[0];
        setInCache(cacheKey, kanji); // Cache by character for the initial lookup
        setInCache(`${CACHE_PREFIX}${kanji.id}`, kanji); // Also cache by ID for subsequent lookups
        return kanji;
    }
    return null;
};


// --- Main Service Function ---
export const getEnrichedKanjiData = async (character: string): Promise<EnrichedKanjiData> => {
    const apiKey = getWaniKaniApiKey();
    if (!apiKey) {
        throw new Error("WaniKani API key not set. Please add it in the settings.");
    }
    
    const kanjiSubject = await getKanjiSubject(character, apiKey);
    if (!kanjiSubject) {
        throw new Error(`Kanji "${character}" not found on WaniKani.`);
    }

    const componentIds = kanjiSubject.data.component_subject_ids;
    const amalgamationIds = kanjiSubject.data.amalgamation_subject_ids;
    
    const [componentSubjects, amalgamationSubjects] = await Promise.all([
        getSubjectsByIds(componentIds, apiKey),
        getSubjectsByIds(amalgamationIds, apiKey),
    ]);
    
    const radicals = componentSubjects.filter(s => s.object === 'radical') as WaniKaniRadical[];
    const vocabulary = amalgamationSubjects.filter(s => s.object === 'vocabulary') as WaniKaniVocabulary[];

    return {
        kanji: kanjiSubject,
        radicals,
        vocabulary,
    };
};

export const validateApiKey = async (apiKey: string): Promise<boolean> => {
    try {
        await fetchFromWaniKani('user', apiKey);
        return true;
    } catch {
        return false;
    }
}
