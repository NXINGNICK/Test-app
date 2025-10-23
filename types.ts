export interface Kanji {
  character: string;
  addedAt: number;
  usedCount: number;
  lastUsedAt: number;
  jlptLevel: number | null; // N5, N4, etc. as 5, 4, ... or null if not applicable
  srsLevel: number; // 0: new, 1: learning, etc.
  nextReviewAt: number;
  lastReviewedAt: number;
  correctStreak: number;
}

export interface JapaneseSentence {
  japanese: string;
  hiragana: string;
  english: string;
}

export interface EnglishSentence {
  english: string;
  japanese: string;
}

export enum GenerationMode {
  Japanese = 'japanese',
  English = 'english',
}

export interface SentenceWithContext {
  sentence: JapaneseSentence | EnglishSentence;
  usedKanjiInSentence: string[];
}
