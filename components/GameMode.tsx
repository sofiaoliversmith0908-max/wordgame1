
import React, { useState, useEffect } from 'react';
import { QuizQuestion, WordCardData, VocabularyLevel, Language, TargetLanguage, GameType } from '../types';
import { generateQuiz } from '../services/geminiService';
import { LoadingOverlay } from './LoadingSpinner';
import { TRANSLATIONS } from '../translations';

interface GameModeProps {
  words: WordCardData[];
  level: VocabularyLevel;
  onBack: () => void;
  language: Language;
  targetLang: TargetLanguage;
}

export const GameMode: React.FC<GameModeProps> = ({ words, level, onBack, language, targetLang }) => {
  const [gameType, setGameType] = useState<GameType | null>(null);
  const t = TRANSLATIONS[language];

  if (!gameType) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <h2 className="text-3xl font-bold text-center text-slate-800 mb-8">{t.chooseGameMode}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quiz */}
          <button 
            onClick={() => setGameType(GameType.QUIZ)}
            className="group bg-white p-8 rounded-2xl shadow-md border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all"
          >
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform">
              📝
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{t.gameQuiz}</h3>
            <p className="text-slate-500 text-sm">Test your knowledge with multiple choice questions.</p>
          </button>

          {/* Match */}
          <button 
             onClick={() => setGameType(GameType.MATCH)}
             className="group bg-white p-8 rounded-2xl shadow-md border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all"
          >
            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform">
              🧩
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{t.gameMatch}</h3>
            <p className="text-slate-500 text-sm">Match words with their meanings or images.</p>
          </button>

          {/* Flashcards */}
          <button 
             onClick={() => setGameType(GameType.FLASHCARD)}
             className="group bg-white p-8 rounded-2xl shadow-md border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all"
          >
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform">
              🗂️
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{t.gameFlashcard}</h3>
            <p className="text-slate-500 text-sm">Flip cards to practice and memorize.</p>
          </button>
        </div>
        <div className="mt-8 text-center">
            <button onClick={onBack} className="text-slate-500 hover:text-slate-700 font-medium underline">
                {t.goBack}
            </button>
        </div>
      </div>
    );
  }

  // Render specific game
  return (
    <div className="relative">
       <button onClick={() => setGameType(null)} className="absolute -top-12 left-0 text-slate-500 hover:text-indigo-600 font-medium flex items-center gap-1">
          ← {t.chooseGameMode}
       </button>
       {gameType === GameType.QUIZ && <QuizGame words={words} level={level} language={language} targetLang={targetLang} onBack={onBack} />}
       {gameType === GameType.MATCH && <MatchGame words={words} language={language} onBack={onBack} />}
       {gameType === GameType.FLASHCARD && <FlashcardGame words={words} language={language} onBack={onBack} />}
    </div>
  );
};

// --- Sub-Components for specific games ---

// 1. QUIZ GAME
const QuizGame: React.FC<any> = ({ words, level, language, targetLang, onBack }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [quizIteration, setQuizIteration] = useState(0);
  const t = TRANSLATIONS[language];

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        setLoading(true);
        // Pass iteration count to force variety in prompt
        const q = await generateQuiz(words, level, language, targetLang, quizIteration);
        setQuestions(q);
        setCurrentIndex(0);
        setScore(0);
        setIsFinished(false);
        setSelectedOption(null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadQuiz();
  }, [words, level, language, targetLang, quizIteration]);

  const handleOptionClick = (option: string) => {
    if (selectedOption) return;
    setSelectedOption(option);
    if (option === questions[currentIndex].correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
    } else {
      setIsFinished(true);
    }
  };

  const handleTryNew = () => {
    setQuizIteration(prev => prev + 1);
  };

  if (loading) return <LoadingOverlay message={quizIteration > 0 ? t.loadingNew : t.preparingQuiz} />;
  if (questions.length === 0) return <div className="text-center p-10">{t.quizError}</div>;

  if (isFinished) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 text-center animate-fade-in">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">{t.greatJob}</h2>
        <p className="text-slate-500 mb-6">{t.completedPractice}</p>
        <div className="text-6xl font-black text-indigo-600 mb-2">
          {score}<span className="text-3xl text-slate-300">/{questions.length}</span>
        </div>
        <p className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-8">{t.finalScore}</p>
        
        <div className="space-y-3">
             <button onClick={handleTryNew} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                {t.tryNewQuestions}
            </button>
            <button onClick={onBack} className="w-full py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors">
                {t.returnToLesson}
            </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
          <span>{t.quizQuestionOf.replace('{current}', String(currentIndex + 1)).replace('{total}', String(questions.length))}</span>
          <span>{t.score.replace('{score}', String(score))}</span>
        </div>
        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden p-6 sm:p-8">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6 leading-snug">{currentQ.question}</h3>
        <div className="space-y-3">
          {currentQ.options.map((option: string, idx: number) => {
            let btnClass = "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50";
            if (selectedOption) {
              if (option === currentQ.correctAnswer) btnClass = "border-green-500 bg-green-50 text-green-700 ring-1 ring-green-500";
              else if (option === selectedOption) btnClass = "border-red-500 bg-red-50 text-red-700 ring-1 ring-red-500";
              else btnClass = "border-slate-100 opacity-50";
            }
            return (
              <button key={idx} onClick={() => handleOptionClick(option)} disabled={!!selectedOption} className={`w-full text-left p-4 rounded-xl border-2 font-medium transition-all duration-200 ${btnClass}`}>{option}</button>
            );
          })}
        </div>
        {selectedOption && (
          <div className="mt-6 pt-6 border-t border-slate-100 animate-fade-in">
             <div className="mb-4">
                <p className="font-bold text-sm text-slate-400 uppercase">{t.explanation}</p>
                <p className="text-slate-700 mt-1">{currentQ.explanation}</p>
             </div>
             <button onClick={handleNext} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200">{currentIndex === questions.length - 1 ? t.finishQuiz : t.nextQuestion}</button>
          </div>
        )}
      </div>
    </div>
  );
};

// 2. MEMORY MATCH GAME
const MatchGame: React.FC<any> = ({ words, language, onBack }) => {
  const t = TRANSLATIONS[language];
  type Mode = 'grid' | 'connect';
  const [mode, setMode] = useState<Mode>('grid');
  
  // -- Shared Data Logic --
  interface Card { id: number; content: string; type: 'word' | 'def'; wordId: string; matched: boolean; imageUrl?: string }
  const [cards, setCards] = useState<Card[]>([]);
  const [seed, setSeed] = useState(0);

  // Initialize deck
  useEffect(() => {
    const deck: Card[] = [];
    words.forEach((w: WordCardData, idx: number) => {
      // Use short gloss for matching, fallback to definition if missing
      const displayMeaning = w.gloss || w.definition;
      
      deck.push({ id: idx * 2, content: w.word, type: 'word', wordId: w.word, matched: false });
      deck.push({ id: idx * 2 + 1, content: displayMeaning, type: 'def', wordId: w.word, matched: false, imageUrl: w.imageUrl });
    });
    setCards(deck.sort(() => Math.random() - 0.5));
  }, [words, seed]);

  const handleRestart = () => {
      setSeed(prev => prev + 1); // Triggers re-shuffle
  };

  return (
    <div className="max-w-4xl mx-auto">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
             <div className="bg-slate-100 p-1 rounded-lg flex text-xs font-bold text-slate-500 shadow-inner">
               <button 
                onClick={() => setMode('grid')}
                className={`px-4 py-1.5 rounded-md transition-all ${mode === 'grid' ? 'bg-white text-indigo-600 shadow-sm font-extrabold' : 'hover:text-slate-700'}`}
               >
                 {t.modeGrid}
               </button>
               <button 
                onClick={() => setMode('connect')}
                className={`px-4 py-1.5 rounded-md transition-all ${mode === 'connect' ? 'bg-white text-indigo-600 shadow-sm font-extrabold' : 'hover:text-slate-700'}`}
               >
                 {t.modeConnect}
               </button>
            </div>
            <button onClick={handleRestart} className="group text-sm font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 hover:border-indigo-200 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {t.tryNewGame}
            </button>
        </div>

        {mode === 'grid' ? (
            <GridMatch cards={cards} setCards={setCards} language={language} onBack={onBack} totalPairs={words.length} />
        ) : (
            <ConnectMatch cards={cards} setCards={setCards} language={language} onBack={onBack} totalPairs={words.length} />
        )}
    </div>
  );
};

// Sub-component: Grid Match
const GridMatch: React.FC<any> = ({ cards, setCards, language, onBack, totalPairs }) => {
    const t = TRANSLATIONS[language];
    const [flipped, setFlipped] = useState<number[]>([]);
    const [matchedCount, setMatchedCount] = useState(0);
    const [moves, setMoves] = useState(0);

    // Reset local state when cards change (shuffle)
    useEffect(() => {
        setFlipped([]);
        setMatchedCount(0);
        setMoves(0);
    }, [cards]);

    const handleCardClick = (id: number) => {
        if (flipped.length === 2 || flipped.includes(id) || cards.find((c: any) => c.id === id)?.matched) return;
        
        const newFlipped = [...flipped, id];
        setFlipped(newFlipped);

        if (newFlipped.length === 2) {
          setMoves(p => p + 1);
          const card1 = cards.find((c: any) => c.id === newFlipped[0]);
          const card2 = cards.find((c: any) => c.id === newFlipped[1]);

          if (card1 && card2 && card1.wordId === card2.wordId) {
            setTimeout(() => {
                setCards((prev: any) => prev.map((c: any) => (c.id === newFlipped[0] || c.id === newFlipped[1]) ? { ...c, matched: true } : c));
                setFlipped([]);
                setMatchedCount(p => p + 1);
            }, 500);
          } else {
            setTimeout(() => setFlipped([]), 1000);
          }
        }
    };

    if (matchedCount === totalPairs && totalPairs > 0) {
        return (
           <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 text-center animate-fade-in">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-slate-800 mb-2">{t.greatJob}</h2>
              <p className="text-slate-500 mb-6">{t.completedPractice}</p>
              <p className="text-lg font-bold text-indigo-600 mb-6">{t.moves.replace('{count}', String(moves))}</p>
              <button onClick={onBack} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 shadow-lg">{t.returnToLesson}</button>
           </div>
        );
    }

    return (
        <div className="animate-fade-in">
             <div className="text-center mb-6 text-slate-400 font-bold text-sm uppercase tracking-widest">{t.moves.replace('{count}', String(moves))}</div>
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {cards.map((card: any) => {
                const isFlipped = flipped.includes(card.id) || card.matched;
                return (
                    <button 
                        key={card.id} 
                        onClick={() => handleCardClick(card.id)}
                        className={`aspect-[3/4] rounded-2xl p-2 relative perspective-1000 transition-all duration-500 ${card.matched ? 'opacity-0 pointer-events-none scale-75' : 'hover:-translate-y-1'}`}
                    >
                        <div className={`w-full h-full relative preserve-3d transition-transform duration-500 ${isFlipped ? 'rotate-y-180' : ''}`}>
                            {/* Front (Hidden) */}
                            <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl shadow-md flex items-center justify-center border-4 border-white ring-1 ring-black/5">
                                <span className="text-4xl text-white opacity-80">⚛</span>
                            </div>
                            {/* Back (Revealed) */}
                            <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white border-2 border-indigo-100 rounded-2xl shadow-xl flex items-center justify-center p-3 overflow-hidden">
                                {card.type === 'def' && card.imageUrl ? (
                                    <div className="flex flex-col items-center h-full w-full justify-center gap-2">
                                        <img src={card.imageUrl} className="w-16 h-16 object-cover rounded-full shadow-sm" alt="hint"/>
                                        <span className="text-sm font-bold text-center text-slate-600 leading-tight">{card.content}</span>
                                    </div>
                                ) : (
                                    <span className={`font-bold text-slate-700 text-center ${card.content.length > 10 ? 'text-sm' : 'text-xl'}`}>{card.content}</span>
                                )}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
        </div>
       
    );
};

// Sub-component: Connect Match
const ConnectMatch: React.FC<any> = ({ cards, setCards, language, onBack, totalPairs }) => {
    const t = TRANSLATIONS[language];
    // Separate cards into two lists
    const [leftCol, setLeftCol] = useState<any[]>([]);
    const [rightCol, setRightCol] = useState<any[]>([]);
    const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
    const [matchedIds, setMatchedIds] = useState<number[]>([]);
    const [errorIds, setErrorIds] = useState<number[]>([]);

    useEffect(() => {
        // Filter and shuffle independently
        const words = cards.filter((c: any) => c.type === 'word');
        const defs = cards.filter((c: any) => c.type === 'def');
        // Shuffle defs differently than words to ensure lines cross
        const shuffledDefs = [...defs].sort(() => Math.random() - 0.5);
        setLeftCol(words);
        setRightCol(shuffledDefs);
        setMatchedIds([]);
        setSelectedLeft(null);
    }, [cards]);

    const handleLeftClick = (id: number) => {
        if (matchedIds.includes(id)) return;
        setSelectedLeft(id);
        setErrorIds([]);
    };

    const handleRightClick = (id: number) => {
        // Check strictly for null, as ID 0 is falsy
        if (matchedIds.includes(id) || selectedLeft === null) return;
        
        const leftCard = leftCol.find(c => c.id === selectedLeft);
        const rightCard = rightCol.find(c => c.id === id);

        if (leftCard && rightCard && leftCard.wordId === rightCard.wordId) {
            // Match
            setMatchedIds(prev => [...prev, leftCard.id, rightCard.id]);
            setSelectedLeft(null);
        } else {
            // Error
            setErrorIds([selectedLeft, id]);
            setTimeout(() => setErrorIds([]), 500);
            setSelectedLeft(null);
        }
    };

    if (matchedIds.length === totalPairs * 2 && totalPairs > 0) {
        return (
             <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 text-center animate-fade-in">
              <div className="text-6xl mb-4">🧩</div>
              <h2 className="text-3xl font-bold text-slate-800 mb-2">{t.greatJob}</h2>
              <p className="text-slate-500 mb-6">{t.completedPractice}</p>
              <button onClick={onBack} className="w-full mt-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 shadow-lg">{t.returnToLesson}</button>
           </div>
        );
    }

    return (
        <div className="flex gap-8 sm:gap-20 animate-fade-in max-w-3xl mx-auto px-4">
            {/* Left Column (Words) */}
            <div className="flex-1 space-y-4">
                {leftCol.map(card => {
                    const isMatched = matchedIds.includes(card.id);
                    const isSelected = selectedLeft === card.id;
                    const isError = errorIds.includes(card.id);
                    
                    return (
                        <div key={card.id} className="relative group">
                            <button
                                onClick={() => handleLeftClick(card.id)}
                                className={`w-full py-5 px-6 rounded-l-2xl rounded-r-lg border-2 text-left transition-all relative z-10 shadow-sm
                                    ${isMatched ? 'bg-emerald-50 border-emerald-400 text-emerald-800 opacity-60' : 
                                      isError ? 'bg-rose-50 border-rose-400 text-rose-700 animate-shake' :
                                      isSelected ? 'bg-indigo-50 border-indigo-500 text-indigo-800 -translate-x-2' : 
                                      'bg-white border-slate-100 text-slate-700 hover:border-indigo-200 hover:-translate-x-1'}`}
                            >
                                <span className="font-bold text-lg">{card.content}</span>
                            </button>
                            {/* Connector Node */}
                            <div className={`absolute top-1/2 -right-3 w-6 h-6 rounded-full border-4 z-20 transform -translate-y-1/2 transition-colors
                                ${isMatched ? 'bg-emerald-400 border-white' : 
                                  isSelected ? 'bg-indigo-500 border-white scale-125' : 
                                  'bg-slate-200 border-white group-hover:bg-indigo-300'}`}>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Right Column (Definitions/Images) */}
            <div className="flex-1 space-y-4">
                {rightCol.map(card => {
                     const isMatched = matchedIds.includes(card.id);
                     const isError = errorIds.includes(card.id);
                     return (
                        <div key={card.id} className="relative group">
                             {/* Connector Node */}
                            <div className={`absolute top-1/2 -left-3 w-6 h-6 rounded-full border-4 z-20 transform -translate-y-1/2 transition-colors
                                ${isMatched ? 'bg-emerald-400 border-white' : 
                                  isError ? 'bg-rose-400 border-white' :
                                  'bg-slate-200 border-white group-hover:bg-indigo-300'}`}>
                            </div>
                            
                            <button
                                onClick={() => handleRightClick(card.id)}
                                className={`w-full h-full min-h-[72px] p-3 pl-6 rounded-r-2xl rounded-l-lg border-2 text-sm font-medium transition-all flex items-center justify-center relative z-10 shadow-sm
                                    ${isMatched ? 'bg-emerald-50 border-emerald-400 opacity-60' : 
                                      isError ? 'bg-rose-50 border-rose-400 animate-shake' :
                                      'bg-white border-slate-100 text-slate-600 hover:border-indigo-200 hover:translate-x-1'}`}
                            >
                                 {card.imageUrl ? (
                                    <div className="flex items-center gap-3 text-left w-full">
                                         <img src={card.imageUrl} className="w-10 h-10 object-cover rounded-lg bg-slate-100" alt=""/>
                                         <span className="line-clamp-2 font-semibold">{card.content}</span>
                                    </div>
                                 ) : (
                                     <span className="text-center font-semibold">{card.content}</span>
                                 )}
                            </button>
                        </div>
                    )
                })}
            </div>
            
             <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.3s ease-in-out;
                }
            `}</style>
        </div>
    );
};

// 3. FLASHCARD GAME
const FlashcardGame: React.FC<any> = ({ words, language, onBack }) => {
    const t = TRANSLATIONS[language];
    const [index, setIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [shuffledWords, setShuffledWords] = useState<WordCardData[]>([]);
    const [seed, setSeed] = useState(0);
    const [mode, setMode] = useState<'word-front' | 'image-front'>('word-front');

    useEffect(() => {
        setShuffledWords([...words].sort(() => Math.random() - 0.5));
        setIndex(0);
        setIsFlipped(false);
    }, [words, seed]);

    const handleNext = () => {
        setIsFlipped(false);
        setTimeout(() => setIndex(prev => (prev + 1) % shuffledWords.length), 200);
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setTimeout(() => setIndex(prev => (prev - 1 + shuffledWords.length) % shuffledWords.length), 200);
    };
    
    const handleShuffle = () => setSeed(s => s + 1);

    if (shuffledWords.length === 0) return null;
    const currentWord = shuffledWords[index];
    
    // Fallback to definition if gloss is missing
    const shortMeaning = currentWord.gloss || currentWord.definition;

    return (
        <div className="max-w-md mx-auto h-[600px] flex flex-col">
            
            {/* Controls */}
             <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                 <div className="bg-slate-100 p-1 rounded-lg flex text-xs font-bold text-slate-500 shadow-inner">
                   <button 
                    onClick={() => { setMode('word-front'); setIsFlipped(false); }}
                    className={`px-3 py-1.5 rounded-md transition-all ${mode === 'word-front' ? 'bg-white text-indigo-600 shadow-sm' : 'hover:text-slate-700'}`}
                   >
                     {t.modeWordFront}
                   </button>
                   <button 
                    onClick={() => { setMode('image-front'); setIsFlipped(false); }}
                    className={`px-3 py-1.5 rounded-md transition-all ${mode === 'image-front' ? 'bg-white text-indigo-600 shadow-sm' : 'hover:text-slate-700'}`}
                   >
                     {t.modeImageFront}
                   </button>
                </div>
                <button onClick={handleShuffle} className="text-sm font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border border-slate-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {t.tryNewGame}
                </button>
            </div>

            <div className="flex-grow relative perspective-1000 group cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
                <div className={`w-full h-full relative preserve-3d transition-transform duration-700 ${isFlipped ? 'rotate-y-180' : ''}`}>
                    
                    {/* Front */}
                    <div className="absolute inset-0 backface-hidden bg-white rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center justify-center p-8">
                        {mode === 'word-front' ? (
                            <>
                                <span className="text-slate-300 font-bold uppercase tracking-widest text-xs mb-8">Tap to reveal</span>
                                <h2 className="text-5xl font-black text-slate-800 mb-4">{currentWord.word}</h2>
                            </>
                        ) : (
                            <div className="flex flex-col items-center h-full w-full justify-center">
                                {currentWord.imageUrl ? (
                                    <img src={currentWord.imageUrl} className="w-full max-h-[240px] object-contain rounded-xl mb-6" alt="context" />
                                ) : (
                                    <div className="w-full h-40 bg-slate-50 flex items-center justify-center text-slate-400 mb-6 rounded-xl">{t.noImage}</div>
                                )}
                                <p className="text-2xl text-slate-700 font-bold text-center leading-tight">{shortMeaning}</p>
                            </div>
                        )}
                        <p className="text-slate-300 text-xs mt-auto uppercase tracking-widest font-bold absolute bottom-8">{t.flipCard}</p>
                    </div>

                    {/* Back */}
                    <div className="absolute inset-0 backface-hidden rotate-y-180 bg-slate-900 text-white rounded-3xl shadow-xl flex flex-col overflow-hidden">
                        {mode === 'word-front' ? (
                            // Showing Image/Def on back
                             <>
                                {currentWord.imageUrl && (
                                    <div className="h-1/2 w-full bg-slate-800 relative">
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent z-10"></div>
                                        <img src={currentWord.imageUrl} className="w-full h-full object-cover opacity-80" alt="context" />
                                    </div>
                                )}
                                <div className="p-8 flex flex-col flex-grow justify-center text-center relative z-20">
                                    <p className="text-3xl font-bold mb-4">{shortMeaning}</p>
                                    <p className="text-slate-400 italic text-lg leading-relaxed">"{currentWord.sentence}"</p>
                                </div>
                             </>
                        ) : (
                            // Showing Word on back
                            <div className="w-full h-full flex flex-col items-center justify-center p-8">
                                <span className="text-slate-500 font-bold uppercase tracking-widest text-sm mb-4">The Word Is</span>
                                <h2 className="text-6xl font-black text-white mb-4 tracking-tight">{currentWord.word}</h2>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mt-8 px-4">
                <button onClick={handlePrev} className="px-6 py-3 rounded-xl bg-white border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 shadow-sm">{t.prevCard}</button>
                <span className="font-mono text-slate-400 font-bold text-sm tracking-widest">{index + 1} / {shuffledWords.length}</span>
                <button onClick={handleNext} className="px-6 py-3 rounded-xl bg-indigo-600 font-bold text-white hover:bg-indigo-700 shadow-md shadow-indigo-200">{t.nextCard}</button>
            </div>
        </div>
    );
};
