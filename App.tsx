import React, { useState } from 'react';
import { AppView, VocabularyLevel, WordCardData, Language, TargetLanguage } from './types';
import { generateWordContexts, generateWordImage, regenerateSingleWordContext } from './services/geminiService';
import { WordInput } from './components/WordInput';
import { WordCard } from './components/WordCard';
import { GameMode } from './components/GameMode';
import { LoadingOverlay } from './components/LoadingSpinner';
import { TRANSLATIONS } from './translations';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.INPUT);
  const [level, setLevel] = useState<VocabularyLevel>(VocabularyLevel.ELEMENTARY_500);
  const [wordData, setWordData] = useState<WordCardData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [targetLang, setTargetLang] = useState<TargetLanguage>('en');

  const t = TRANSLATIONS[language];

  const handleStart = async (words: string[], selectedLevel: VocabularyLevel, selectedTargetLang: TargetLanguage) => {
    setIsLoading(true);
    setLevel(selectedLevel);
    setTargetLang(selectedTargetLang);
    
    try {
      // 1. Fetch Text Context
      const contexts = await generateWordContexts(words, selectedLevel, language, selectedTargetLang);
      
      // Initialize state with text data, waiting for images
      const initialData: WordCardData[] = contexts.map(c => ({
        ...c,
        isLoadingImage: true
      }));
      
      setWordData(initialData);
      setView(AppView.LEARNING);
      setIsLoading(false);

      // 2. Fetch Images in Background (Parallel)
      initialData.forEach(async (item, index) => {
        const base64Image = await generateWordImage(item.imagePrompt);
        setWordData(prev => {
          const newData = [...prev];
          if (newData[index]) {
             newData[index] = { 
               ...newData[index], 
               imageUrl: base64Image, 
               isLoadingImage: false 
             };
          }
          return newData;
        });
      });

    } catch (error) {
      console.error("Failed to generate lesson:", error);
      alert("Something went wrong generating the lesson. Please check your API key or try again.");
      setIsLoading(false);
    }
  };

  const handleRegenerateWord = async (index: number) => {
    const wordItem = wordData[index];
    if (!wordItem) return;

    // Set loading state for this card
    setWordData(prev => {
      const newData = [...prev];
      newData[index] = { ...newData[index], isRegenerating: true };
      return newData;
    });

    try {
      // 1. Regenerate Text
      const newContext = await regenerateSingleWordContext(wordItem.word, level, language, targetLang);
      
      if (!newContext) {
        throw new Error("Failed to regenerate context");
      }

      // Update text, set loading image
      setWordData(prev => {
        const newData = [...prev];
        newData[index] = {
           ...newData[index],
           ...newContext,
           isLoadingImage: true,
           isRegenerating: false // Text is done
        };
        return newData;
      });

      // 2. Regenerate Image
      const newImage = await generateWordImage(newContext.imagePrompt);
      
      setWordData(prev => {
        const newData = [...prev];
        newData[index] = {
           ...newData[index],
           imageUrl: newImage,
           isLoadingImage: false
        };
        return newData;
      });

    } catch (error) {
       console.error("Regeneration failed", error);
       // Revert loading state
       setWordData(prev => {
        const newData = [...prev];
        newData[index] = { ...newData[index], isRegenerating: false, isLoadingImage: false };
        return newData;
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView(AppView.INPUT)}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-indigo-300 shadow-md">
              L
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">{t.appTitle}</h1>
          </div>
          
          <div className="flex items-center gap-4">
             {view === AppView.LEARNING && (
               <button 
                  onClick={() => setView(AppView.GAME)}
                  className="hidden sm:flex bg-indigo-600 text-white px-5 py-2 rounded-full font-bold text-sm hover:bg-indigo-700 hover:shadow-lg transition-all active:scale-95 items-center gap-2"
               >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t.practiceMode}
               </button>
            )}
            
            {/* Language Switcher */}
            <div className="bg-slate-100 p-1 rounded-lg flex text-xs font-bold text-slate-500">
               <button 
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 rounded-md transition-all ${language === 'en' ? 'bg-white text-indigo-600 shadow-sm' : 'hover:text-slate-700'}`}
               >
                 EN
               </button>
               <button 
                onClick={() => setLanguage('zh')}
                className={`px-3 py-1.5 rounded-md transition-all ${language === 'zh' ? 'bg-white text-indigo-600 shadow-sm' : 'hover:text-slate-700'}`}
               >
                 中
               </button>
            </div>
          </div>
        </div>
        
        {/* Mobile secondary header for action buttons if needed */}
        {view === AppView.LEARNING && (
           <div className="sm:hidden px-4 pb-3 flex justify-end">
               <button 
                  onClick={() => setView(AppView.GAME)}
                  className="w-full bg-indigo-600 text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 flex items-center justify-center gap-2"
               >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t.practiceMode}
               </button>
           </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        
        {isLoading && <LoadingOverlay message={t.generatingOverlay} />}

        {view === AppView.INPUT && (
          <div className="mt-10 animate-fade-in-up">
             <div className="text-center mb-12">
                <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
                  {t.masterWordsTitle} <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">{t.inContext}</span>
                </h2>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                  {t.heroSubtitle}
                </p>
             </div>
             <WordInput onStart={handleStart} isLoading={isLoading} language={language} />
          </div>
        )}

        {view === AppView.LEARNING && (
          <div className="animate-fade-in">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wordData.map((data, idx) => (
                  <WordCard 
                    key={`${data.word}-${idx}`} 
                    data={data} 
                    language={language} 
                    onRegenerate={() => handleRegenerateWord(idx)}
                  />
                ))}
             </div>
             
             {wordData.length > 0 && (
               <div className="mt-12 text-center">
                 <button 
                  onClick={() => setView(AppView.GAME)}
                  className="bg-white border-2 border-indigo-600 text-indigo-700 px-8 py-3 rounded-xl font-bold text-lg hover:bg-indigo-50 transition-colors"
                 >
                   {t.startQuiz}
                 </button>
               </div>
             )}
          </div>
        )}

        {view === AppView.GAME && (
          <GameMode 
            words={wordData} 
            level={level} 
            onBack={() => setView(AppView.LEARNING)}
            language={language}
            targetLang={targetLang}
          />
        )}

      </main>
      
      {/* Footer */}
      <footer className="fixed bottom-0 w-full bg-white/80 backdrop-blur border-t border-slate-100 py-4 text-center text-xs text-slate-400 z-30">
        <p>{t.footer}</p>
      </footer>

      {/* Tailwind Utility for simple animation */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        .animate-fade-in {
          animation: opacity 0.5s ease-out forwards;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
};

export default App;
