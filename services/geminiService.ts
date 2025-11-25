
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { VocabularyLevel, WordContextData, QuizQuestion, Language, TargetLanguage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getLanguageName = (lang: TargetLanguage | Language) => {
  switch (lang) {
    case 'zh': return 'Chinese';
    case 'es': return 'Spanish';
    case 'en': return 'English';
    default: return 'English';
  }
};

// 1. Generate Text Context (Definitions, Sentences, Dialogues)
export const generateWordContexts = async (
  words: string[],
  level: VocabularyLevel,
  lang: Language,
  targetLang: TargetLanguage
): Promise<WordContextData[]> => {
  const model = "gemini-2.5-flash";
  
  const responseSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        word: { type: Type.STRING, description: "The word being defined." },
        definition: { type: Type.STRING, description: "A simple definition suited to the student's level." },
        gloss: { type: Type.STRING, description: "A very concise 1-3 word meaning/translation in the native language." },
        sentence: { type: Type.STRING, description: "A sentence using the word in context, suited to the level." },
        dialogue: { type: Type.STRING, description: "A short 2-3 line dialogue demonstrating the word." },
        imagePrompt: { type: Type.STRING, description: "A detailed visual description to generate an image representing the sentence context." }
      },
      required: ["word", "definition", "gloss", "sentence", "dialogue", "imagePrompt"],
    },
  };

  const targetLangName = getLanguageName(targetLang);
  const nativeLangName = getLanguageName(lang);

  const languageInstruction = `
    Provide the 'definition' in ${nativeLangName} (simple explanation).
    Provide the 'gloss' in ${nativeLangName} (MAX 2-3 words, essentially a translation or keyword).
    Ensure the 'sentence' and 'dialogue' are in ${targetLangName}.
    The 'word' should be the ${targetLangName} word provided.
  `;

  const prompt = `
    You are an expert ${targetLangName} teacher. 
    The student has a vocabulary size of roughly ${level} words.
    The student's primary language is ${nativeLangName}.
    Create learning materials for the following ${targetLangName} words: ${words.join(", ")}.
    
    ${languageInstruction}
    
    For each word:
    1. Define it simply.
    2. Provide a 'gloss' which is just the core meaning or translation (1-2 words).
    3. Create a sentence context in ${targetLangName} (respecting the ${level} word level).
    4. Create a short dialogue (A/B) in ${targetLangName} (respecting the ${level} word level).
    5. Create a prompt for an AI image generator that visualizes the 'sentence' or 'dialogue' clearly.
    
    Return the result as JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as WordContextData[];
  } catch (error) {
    console.error("Error generating word context:", error);
    throw error;
  }
};

// 1b. Regenerate Single Word Context
export const regenerateSingleWordContext = async (
  word: string,
  level: VocabularyLevel,
  lang: Language,
  targetLang: TargetLanguage
): Promise<WordContextData | null> => {
  const model = "gemini-2.5-flash";
  
  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      word: { type: Type.STRING },
      definition: { type: Type.STRING },
      gloss: { type: Type.STRING },
      sentence: { type: Type.STRING },
      dialogue: { type: Type.STRING },
      imagePrompt: { type: Type.STRING }
    },
    required: ["word", "definition", "gloss", "sentence", "dialogue", "imagePrompt"],
  };

  const targetLangName = getLanguageName(targetLang);
  const nativeLangName = getLanguageName(lang);

  const prompt = `
    You are an expert ${targetLangName} teacher.
    The student has a vocabulary size of roughly ${level} words.
    The student's primary language is ${nativeLangName}.
    Regenerate learning materials for the ${targetLangName} word: "${word}".
    Create a DIFFERENT context (sentence and dialogue) than usual if possible.
    
    Provide the 'definition' in ${nativeLangName}.
    Provide the 'gloss' in ${nativeLangName} (MAX 2-3 words).
    Ensure the 'sentence' and 'dialogue' are in ${targetLangName}.
    
    Return the result as JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as WordContextData;
  } catch (error) {
    console.error("Error regenerating single word:", error);
    return null;
  }
};

// 2. Generate Image for a specific word context
export const generateWordImage = async (imagePrompt: string): Promise<string | undefined> => {
  const model = "gemini-2.5-flash-image"; 

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { text: `Create a colorful, illustrative educational image for this scene: ${imagePrompt}. Style: Digital art, clean lines, friendly.` }
        ]
      },
      config: {
        // No responseMimeType for image generation models usually, but we want the inlineData
      }
    });

    // Extract image from response parts
    for (const candidate of response.candidates || []) {
      for (const part of candidate.content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return undefined;
  } catch (error) {
    console.error("Error generating image:", error);
    return undefined; // Fail gracefully
  }
};

// 3. Generate Quiz Questions
export const generateQuiz = async (
  words: WordContextData[], 
  level: VocabularyLevel, 
  lang: Language,
  targetLang: TargetLanguage,
  variation: number = 0 // Used to force a different response if calling multiple times
): Promise<QuizQuestion[]> => {
  const model = "gemini-2.5-flash";
  const wordList = words.map(w => w.word).join(", ");
  const targetLangName = getLanguageName(targetLang);
  const nativeLangName = getLanguageName(lang);

  const responseSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        question: { type: Type.STRING },
        options: { 
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        correctAnswer: { type: Type.STRING },
        explanation: { type: Type.STRING }
      },
      required: ["id", "question", "options", "correctAnswer", "explanation"]
    }
  };

  const prompt = `
    Create a fun, interactive quiz for a student with a vocabulary level of ${level}.
    The student's primary language is ${nativeLangName}, and they are learning ${targetLangName}.
    The quiz should test their understanding of these specific ${targetLangName} words: ${wordList}.
    Create 1 question per word.
    
    Iteration Seed: ${variation} (Ensure the questions are DIFFERENT from a standard set if this number is > 0).
    Mix up the question types. Don't just do definitions.
    
    The questions can be:
    - Fill in the blank (Sentence in ${targetLangName})
    - Choose the correct definition (Options in ${nativeLangName})
    - Scenario based matching
    - Synonym/Antonym identification
    
    Ensure 'options' is an array of 4 possible answers.
    Provide the 'explanation' in ${nativeLangName}.
    
    Return as JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema,
      }
    });
    
    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as QuizQuestion[];

  } catch (error) {
    console.error("Error generating quiz:", error);
    throw error;
  }
};
