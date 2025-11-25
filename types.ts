
export enum AppView {
  INPUT = 'INPUT',
  LEARNING = 'LEARNING',
  GAME = 'GAME'
}

export enum VocabularyLevel {
  BEGINNER_100 = 100,
  ELEMENTARY_500 = 500,
  INTERMEDIATE_1000 = 1000,
  UPPER_INT_2000 = 2000,
  ADVANCED_3000 = 3000,
  FLUENT_5000 = 5000,
  NATIVE_8000 = 8000
}

export type Language = 'en' | 'zh'; // UI Language (Mother tongue)
export type TargetLanguage = 'en' | 'es'; // Language to learn

export enum GameType {
  QUIZ = 'QUIZ',
  MATCH = 'MATCH',
  FLASHCARD = 'FLASHCARD'
}

export interface WordContextData {
  word: string;
  definition: string;
  gloss: string; // Short 1-2 word meaning
  sentence: string;
  dialogue: string;
  imagePrompt: string; // Used to generate the image
}

export interface WordCardData extends WordContextData {
  imageUrl?: string;
  isLoadingImage: boolean;
  isRegenerating?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}
