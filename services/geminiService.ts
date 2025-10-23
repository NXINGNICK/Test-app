import { GoogleGenAI, Type } from "@google/genai";
import type { Kanji, JapaneseSentence, EnglishSentence } from '../types';

console.debug("geminiService.ts loaded");

if (!process.env.API_KEY) {
    console.error("API_KEY environment variable is not set.");
    throw new Error("API_KEY environment variable is not set.");
} else {
    console.debug("geminiService: API_KEY is present.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = ai.models;

const fileToGenerativePart = (base64: string, mimeType: string) => {
    return {
        inlineData: {
            data: base64,
            mimeType,
        },
    };
};

export const extractKanjiFromImage = async (base64Image: string): Promise<string[]> => {
    console.debug("geminiService: extractKanjiFromImage called.");
    try {
        const imagePart = fileToGenerativePart(base64Image, "image/jpeg");
        const prompt = "Identify all unique Japanese Kanji characters in this image. Return only a single string of the Kanji characters with no separators.";
        console.debug("geminiService: Sending prompt to Gemini for image extraction:", prompt);

        const response = await model.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: prompt }] },
        });

        console.debug("geminiService: Raw response from image extraction:", response);
        const text = response.text.trim();
        const result = text ? text.split('') : [];
        console.debug("geminiService: Extracted Kanji from image:", result);
        return result;
    } catch (error) {
        console.error("Error extracting Kanji from image:", error);
        throw new Error("Failed to analyze image with Gemini API.");
    }
};

const jlptSchema = {
    type: Type.OBJECT,
    properties: {
        kanjiDetails: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    character: { type: Type.STRING },
                    jlpt: { type: Type.INTEGER, description: "JLPT level (5, 4, 3, 2, 1). Return 0 if not in JLPT." }
                },
                required: ["character", "jlpt"]
            }
        }
    }
};

export const getKanjiJlptLevels = async (characters: string[]): Promise<Record<string, number>> => {
    console.debug("geminiService: getKanjiJlptLevels called with:", characters);
    if (characters.length === 0) return {};
    const prompt = `For the following Kanji characters, provide their JLPT level: ${characters.join(', ')}. If a character is not part of the JLPT system, use 0 for its level.`;
    console.debug("geminiService: Sending prompt to Gemini for JLPT levels:", prompt);
    try {
        const response = await model.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: jlptSchema
            }
        });
        console.debug("geminiService: Raw response from JLPT levels:", response.text);
        const json = JSON.parse(response.text.trim());
        console.debug("geminiService: Parsed JSON for JLPT levels:", json);
        const levels: Record<string, number> = {};
        if (json.kanjiDetails) {
            for (const detail of json.kanjiDetails) {
                levels[detail.character] = detail.jlpt;
            }
        }
        console.debug("geminiService: Final JLPT levels object:", levels);
        return levels;
    } catch (error) {
        console.error("Error fetching JLPT levels:", error);
        throw new Error("Failed to fetch JLPT levels from Gemini API.");
    }
};

const wordTokenSchema = {
  type: Type.OBJECT,
  properties: {
    word: { type: Type.STRING, description: "A single Japanese word or particle from the sentence." },
    reading: { type: Type.STRING, description: "The hiragana or katakana reading of the word." },
    definition: { type: Type.STRING, description: "A concise English definition of the word." }
  },
  required: ["word", "reading", "definition"]
};

const japaneseSentenceSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      japanese: { type: Type.STRING, description: "The sentence in Japanese using Kanji." },
      hiragana: { type: Type.STRING, description: "The Hiragana reading of the sentence." },
      english: { type: Type.STRING, description: "The English translation of the sentence." },
      tokens: { type: Type.ARRAY, items: wordTokenSchema, description: "A tokenized breakdown of the Japanese sentence into its component words/particles." }
    },
    required: ["japanese", "hiragana", "english", "tokens"],
  },
};

export const generateJapaneseSentences = async (kanji: Kanji[], targetJlptLevel?: number): Promise<JapaneseSentence[]> => {
  console.debug("geminiService: generateJapaneseSentences called with kanji:", kanji.map(k=>k.character), "and target JLPT level:", targetJlptLevel);
  const kanjiChars = kanji.map(k => k.character).join(', ');
  
  const levelInstruction = targetJlptLevel
    ? `The vocabulary and grammar used, excluding the provided Kanji list, should be appropriate for a JLPT N${targetJlptLevel} learner. The overall sentence structure should feel natural for this level.`
    : `The sentences should be at an intermediate level (around JLPT N4 to N3).`;

  const prompt = `Create 5 distinct, natural-sounding Japanese sentences. ${levelInstruction} You MUST incorporate some of the following Kanji: ${kanjiChars}. Prioritize the first few Kanji in the list as they are the most important for the user to practice. For each sentence, also provide a tokenized breakdown of the Japanese sentence into its component words and particles. Each token must include the word, its reading, and a concise English definition.`;
  console.debug("geminiService: Sending prompt to Gemini for Japanese sentences:", prompt);

  try {
    const response = await model.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: japaneseSentenceSchema,
      },
    });
    
    console.debug("geminiService: Raw response for Japanese sentences:", response.text);
    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    console.debug("geminiService: Parsed Japanese sentences:", result);
    return result;
  } catch (error) {
    console.error("Error generating Japanese sentences:", error);
    throw new Error("Failed to generate Japanese sentences with Gemini API.");
  }
};

const englishSentenceSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        english: { type: Type.STRING, description: "An English sentence incorporating the meaning of a Kanji." },
        japanese: { type: Type.STRING, description: "A natural Japanese translation of the English sentence, using the original Kanji." },
        tokens: { type: Type.ARRAY, items: wordTokenSchema, description: "A tokenized breakdown of the Japanese translation." }
      },
      required: ["english", "japanese", "tokens"],
    },
  };

export const generateEnglishSentences = async (kanji: Kanji[], targetJlptLevel?: number): Promise<EnglishSentence[]> => {
    console.debug("geminiService: generateEnglishSentences called with kanji:", kanji.map(k=>k.character), "and target JLPT level:", targetJlptLevel);
    const kanjiChars = kanji.map(k => k.character).join(', ');
    
    const levelInstruction = targetJlptLevel
        ? `The English sentences should be suitable for a JLPT N${targetJlptLevel} learner's comprehension level. The corresponding Japanese translations MUST also use vocabulary and grammar appropriate for this level (excluding the provided Kanji).`
        : `The English sentences should be at an intermediate level. The corresponding Japanese translations should be around JLPT N4 to N3 level.`;

    const prompt = `Create 5 distinct English sentences. ${levelInstruction} Each English sentence should subtly incorporate the meaning of one or more of the following Japanese Kanji: ${kanjiChars}. Prioritize the first few Kanji in the list. For each English sentence, provide a natural Japanese translation that uses the source Kanji. Also provide a tokenized breakdown of the Japanese translation into its component words/particles, where each token includes the word, its reading, and a concise English definition.`;
    console.debug("geminiService: Sending prompt to Gemini for English sentences:", prompt);

    try {
        const response = await model.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: englishSentenceSchema,
            },
        });
        
        console.debug("geminiService: Raw response for English sentences:", response.text);
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        console.debug("geminiService: Parsed English sentences:", result);
        return result;
    } catch (error) {
        console.error("Error generating English sentences:", error);
        throw new Error("Failed to generate English sentences with Gemini API.");
    }
};
