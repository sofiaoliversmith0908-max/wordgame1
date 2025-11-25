import React from 'react';
import { WordCardData, Language } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { TRANSLATIONS } from '../translations';

interface WordCardProps {
  data: WordCardData;
  language: Language;
  onRegenerate: () => void;
}

export const WordCard: React.FC<WordCardProps> = ({ data, language, onRegenerate }) => {
  const t = TRANSLATIONS[language];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col h-full relative group/card">
      
      {/* Regenerate Button */}
      <button 
        onClick={onRegenerate}
        disabled={data.isRegenerating}
        className="absolute top-3 right-3 z-20 bg-white/90 backdrop-blur text-slate-600 p-2 rounded-full shadow-sm border border-slate-200 hover:text-indigo-600 hover:border-indigo-300 transition-all opacity-0 group-hover/card:opacity-100 disabled:opacity-50"
        title={t.regenerate}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ${data.isRegenerating ? 'animate-spin text-indigo-500' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>

      {/* Image Section */}
      <div className="relative w-full h-48 sm:h-56 bg-slate-100 flex items-center justify-center overflow-hidden group">
        {data.isLoadingImage || data.isRegenerating ? (
          <div className="flex flex-col items-center gap-2 z-10">
            <LoadingSpinner />
            <span className="text-xs text-slate-400 font-medium">
              {data.isRegenerating ? t.craftingBtn : t.paintingScene}
            </span>
          </div>
        ) : data.imageUrl ? (
          <img 
            src={data.imageUrl} 
            alt={`Illustration for ${data.word}`} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
          />
        ) : (
          <div className="text-slate-400 text-sm">{t.noImage}</div>
        )}
        
        {/* Overlay for regenerating state */}
        {data.isRegenerating && (
           <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-0"></div>
        )}

        {/* Word Overlay */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-4 pt-12 z-10">
          <h3 className="text-2xl font-bold text-white capitalize tracking-wide">{data.word}</h3>
        </div>
      </div>

      {/* Content Section */}
      <div className={`p-6 flex flex-col flex-grow space-y-4 relative ${data.isRegenerating ? 'opacity-50 pointer-events-none' : ''}`}>
        
        {/* Definition */}
        <div>
          <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">{t.definitionLabel}</h4>
          <p className="text-slate-700 font-medium leading-relaxed">
            {data.definition}
          </p>
        </div>

        {/* Sentence */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
           <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t.contextLabel}</h4>
           <p className="text-slate-600 italic">"{data.sentence}"</p>
        </div>

        {/* Dialogue */}
        <div className="flex-grow">
           <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t.dialogueLabel}</h4>
           <div className="space-y-2">
             {data.dialogue.split('\n').map((line, idx) => (
               <div key={idx} className={`text-sm flex gap-2 ${idx % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className={`w-1 h-full min-h-[20px] rounded-full ${idx % 2 === 0 ? 'bg-indigo-400' : 'bg-violet-400'}`}></div>
                  <p className="text-slate-600 bg-white px-2 py-1 rounded shadow-sm border border-slate-50 w-fit max-w-[90%]">
                    {line.replace(/^[A-Z]:\s*/, '')}
                  </p>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};
