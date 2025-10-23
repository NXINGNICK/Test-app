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
            // Find the best match, often the one that is an exact word match
            const bestMatch = json.data.find((d: any) => d.japanese.some((j: any) => j.word === word)) || json.data[0];
            
            const token: WordToken = {
                word: word, // Use original word from sentence for consistency
                reading: bestMatch.japanese[0]?.reading || word,
                definition: bestMatch.senses[0]?.english_definitions.join('; ') || 'No definition found.',
                jlptLevel: parseJlptLevel(bestMatch.jlpt),
            };
            wordCache.set(word, token);
            return token;
        } else {
             wordCache.set(word, null); // Cache the miss
             return createDefaultToken(word);
        }
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