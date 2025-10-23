import type { WordToken, KanjiApiData } from '../types';

const JishoAPI = 'https://jisho.org/api/v1/search/words?keyword=';
const KanjiAPI = 'https://kanjiapi.dev/v1/kanji/';

// Simple cache to avoid re-fetching during a session
const wordCache = new Map<string, WordToken | null>();
const kanjiCache = new Map<string, KanjiApiData | null>();


// Function to parse JLPT tags from Jisho
const parseJlptLevel = (tags: string[]): number => {
    const jlptTag = tags.find(tag => tag.startsWith('jlpt-n'));
    if (jlptTag) {
        return parseInt(jlptTag.replace('jlpt-n', ''), 10);
    }
    return 0;
};

// A list of common particles to handle gracefully
const particles = new Set(['は', 'が', 'を', 'に', 'へ', 'と', 'も', 'の', 'で', 'か', 'よ', 'ね', 'わ', '。', '、']);


const createDefaultToken = (word: string): WordToken => ({
    word: word,
    reading: '?',
    definition: 'Definition not found.',
    jlptLevel: 0,
});

export const getWordDetails = async (word: string): Promise<WordToken> => {
    if (wordCache.has(word)) {
        return wordCache.get(word) || createDefaultToken(word);
    }

    if (particles.has(word)) {
        const particleToken: WordToken = {
            word: word,
            reading: word,
            definition: 'Particle',
            jlptLevel: 0,
        };
        wordCache.set(word, particleToken);
        return particleToken;
    }

    try {
        const response = await fetch(`${JishoAPI}${encodeURIComponent(word)}`);
        if (!response.ok) {
            console.warn(`Jisho API request failed for "${word}": ${response.statusText}`);
            wordCache.set(word, null);
            return createDefaultToken(word);
        }
        
        const json = await response.json();

        if (json.data && json.data.length > 0) {
            // Prioritize common words and exact matches for better accuracy.
            const sortedData = [...json.data].sort((a: any, b: any) => (b.is_common ? 1 : 0) - (a.is_common ? 1 : 0));
            const bestMatch = sortedData.find((d: any) => d.japanese.some((j: any) => j.word === word || j.reading === word)) || sortedData[0];

            const reading = bestMatch.japanese[0]?.reading;
            const sense = bestMatch.senses[0];
            const definition = sense?.english_definitions?.join('; ');

            // Only create a full token if we have the essential data.
            if (reading && definition) {
                 const token: WordToken = {
                    word: word,
                    reading: reading,
                    definition: definition,
                    jlptLevel: parseJlptLevel(bestMatch.jlpt || []),
                };
                wordCache.set(word, token);
                return token;
            }
        }

        // If no suitable match was found after all checks, return the default token.
        wordCache.set(word, null);
        return createDefaultToken(word);
    } catch (error) {
        console.error(`Error fetching from Jisho API for "${word}":`, error);
        wordCache.set(word, null);
        return createDefaultToken(word);
    }
};


export const getKanjiDetailsFromKanjiApi = async (character: string): Promise<KanjiApiData | null> => {
    if (kanjiCache.has(character)) {
        return kanjiCache.get(character) || null;
    }

    try {
        const response = await fetch(`${KanjiAPI}${encodeURIComponent(character)}`);
        if (!response.ok) {
            if (response.status === 404) {
                console.warn(`KanjiAPI: Character "${character}" not found.`);
            } else {
                console.warn(`KanjiAPI request failed for "${character}": ${response.statusText}`);
            }
            kanjiCache.set(character, null);
            return null;
        }
        
        const json: KanjiApiData = await response.json();
        kanjiCache.set(character, json);
        return json;
    } catch (error) {
        console.error(`Error fetching from KanjiAPI for "${character}":`, error);
        kanjiCache.set(character, null);
        return null;
    }
};