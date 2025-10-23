// FIX: This file contained a copy of geminiService.ts, causing circular dependencies.
// It has been replaced with the correct type definitions for the application.

export interface Kanji {
  character: string;
  addedAt: number;
  usedCount: number;
  lastUsedAt: number;
  jlptLevel: number | null;
  srsLevel: number;
  nextReviewAt: number;
  lastReviewedAt: number;
  correctStreak: number;
}

export interface WordToken {
  word: string;
  reading: string;
  definition: string;
}

export interface VocabularyItem extends WordToken {
  addedAt: number;
}

export interface JapaneseSentence {
  japanese: string;
  hiragana: string;
  english: string;
  tokens: WordToken[];
}

export interface EnglishSentence {
  english: string;
  japanese: string;
  tokens: WordToken[];
}

export interface SentenceWithContext {
  sentence: JapaneseSentence | EnglishSentence;
  usedKanjiInSentence: string[];
}

export enum GenerationMode {
  Japanese = 'JAPANESE',
  English = 'ENGLISH',
}

// --- WaniKani API Types ---

export interface WaniKaniMeaning {
  meaning: string;
  primary: boolean;
  accepted_answer: boolean;
}

export interface WaniKaniReading {
  type: 'onyomi' | 'kunyomi' | 'nanori';
  primary: boolean;
  reading: string;
  accepted_answer: boolean;
}

interface CharacterImage {
  url: string;
  content_type: string;
  metadata: {
      style_name?: string;
      color?: string;
      dimensions?: string;
      inline_styles?: boolean;
  }
}

export interface WaniKaniRadical {
  id: number;
  object: 'radical';
  url: string;
  data_updated_at: string | null;
  data: {
      created_at: string;
      level: number;
      slug: string;
      hidden_at: string | null;
      document_url: string;
      characters: string | null;
      character_images: CharacterImage[];
      meanings: WaniKaniMeaning[];
      amalgamation_subject_ids: number[];
      meaning_mnemonic: string;
      lesson_position: number;
  };
}

export interface WaniKaniKanji {
  id: number;
  object: 'kanji';
  url: string;
  data_updated_at: string | null;
  data: {
      created_at: string;
      level: number;
      slug: string;
      hidden_at: string | null;
      document_url: string;
      characters: string;
      meanings: WaniKaniMeaning[];
      readings: WaniKaniReading[];
      component_subject_ids: number[];
      amalgamation_subject_ids: number[];
      visually_similar_subject_ids: number[];
      meaning_mnemonic: string;
      meaning_hint: string;
      reading_mnemonic: string;
      reading_hint: string;
      lesson_position: number;
  };
}

export interface WaniKaniVocabulary {
  id: number;
  object: 'vocabulary';
  url: string;
  data_updated_at: string | null;
  data: {
      created_at: string;
      level: number;
      slug: string;
      hidden_at: string | null;
      document_url: string;
      characters: string;
      meanings: WaniKaniMeaning[];
      readings: WaniKaniReading[];
      parts_of_speech: string[];
      component_subject_ids: number[];
      meaning_mnemonic: string;
      reading_mnemonic: string;
      context_sentences: { en: string; ja: string }[];
      pronunciation_audios: {
          url: string;
          metadata: {
              gender: string;
              source_id: number;
              pronunciation: string;
              voice_actor_id: number;
              voice_actor_name: string;
              voice_description: string;
          };
          content_type: string;
      }[];
      lesson_position: number;
  };
}

export type WaniKaniSubject = WaniKaniKanji | WaniKaniRadical | WaniKaniVocabulary;

export interface EnrichedKanjiData {
  kanji: WaniKaniKanji;
  radicals: WaniKaniRadical[];
  vocabulary: WaniKaniVocabulary[];
}
