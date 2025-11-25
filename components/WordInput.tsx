import React, { useState } from 'react';
import { VocabularyLevel, Language, TargetLanguage } from '../types';
import { TRANSLATIONS } from '../translations';

interface WordInputProps {
  onStart: (words: string[], level: VocabularyLevel, targetLang: TargetLanguage) => void;
  isLoading: boolean;
  language: Language;
}

export const WordInput: React.FC<WordInputProps> = ({ onStart, isLoading, language }) => {
  const [text, setText] = useState('');
  const [level, setLevel] = useState<VocabularyLevel>(VocabularyLevel.ELEMENTARY_500);
  const [targetLang, setTargetLang] = useState<TargetLanguage>('en');

  const t = TRANSLATIONS[language];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const words = text
      .split(/[,\n]/) // Split by comma or newline
      .map(w => w.trim())
      .filter(w => w.length > 0);
    
    if (words.length === 0) return;
    
    onStart(words, level, targetLang);
  };

  const handleLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    // Find closest enum value
    const levels = Object.values(VocabularyLevel).filter(v => typeof v === 'number') as number[];
    const closest = levels.reduce((prev, curr) => {
      return (Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev);
    });
    setLevel(closest as VocabularyLevel);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">{t.startLearning}</h2>
        <p className="text-indigo-100 opacity-90">{t.enterWordsSubtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        
        {/* Target Language Selector */}
        <div>
           <label className="block text-sm font-semibold text-slate-700 mb-3">
            {t.targetLanguageLabel}
          </label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setTargetLang('en')}
              className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${
                targetLang === 'en' 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              🇺🇸 {t.learnEnglish}
            </button>
            <button
              type="button"
              onClick={() => setTargetLang('es')}
              className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${
                targetLang === 'es' 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              🇪🇸 {t.learnSpanish}
            </button>
          </div>
        </div>

        {/* Words Input */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            {t.targetWordsLabel}
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.targetWordsPlaceholder}
            className="w-full h-32 px-4 py-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none text-slate-700 text-lg placeholder:text-slate-400"
            disabled={isLoading}
          />
        </div>

        {/* Level Slider */}
        <div>
           <div className="flex justify-between items-end mb-4">
            <label className="block text-sm font-semibold text-slate-700">
              {t.proficiencyLevelLabel}
            </label>
            <span className="text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-full text-sm border border-indigo-100">
              {t.levels[level]}
            </span>
          </div>
          
          <div className="relative pt-2">
             <input
              type="range"
              min="100"
              max="8000"
              step="100"
              value={level}
              onChange={handleLevelChange}
              className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              disabled={isLoading}
            />
            <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
              <span>{t.levelBeginner}</span>
              <span>{t.levelIntermediate}</span>
              <span>{t.levelAdvanced}</span>
              <span>{t.levelNative}</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !text.trim()}
          className={`w-full py-4 rounded-xl text-lg font-bold text-white shadow-lg transition-all transform active:scale-[0.98] ${
            isLoading || !text.trim()
              ? 'bg-slate-300 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/30'
          }`}
        >
          {isLoading ? t.craftingBtn : t.generateBtn}
        </button>
      </form>
    </div>
  );
};
