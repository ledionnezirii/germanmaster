'use client';

import React, { useState, useEffect } from "react";
import { BookOpen, Trophy, Award, ChevronLeft, ChevronRight, Check, X, Edit3, List, Volume2, Loader2, Star, Zap, LogOut } from "lucide-react";
import { structureService, ttsService } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function StructurePage() {
  const { user, updateUser } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState('A1');
  const [structures, setStructures] = useState([]);
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [completedStructures, setCompletedStructures] = useState([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizMode, setQuizMode] = useState('write');
  const [loading, setLoading] = useState(false);

  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  useEffect(() => {
    fetchStructures();
    fetchUserProgress();
  }, [selectedLevel]);

  const fetchStructures = async () => {
    try {
      setLoading(true);
      const response = await structureService.getAllStructures(selectedLevel);
      setStructures(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching structures:', error);
      setStructures([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProgress = async () => {
    try {
      const response = await structureService.getUserProgress();
      const completed = response.data.completedStructures || [];
      setCompletedStructures(completed.map(s => s._id || s));
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case "A1": return "bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 border-emerald-200";
      case "A2": return "bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-600 border-blue-200";
      case "B1": return "bg-gradient-to-br from-violet-50 to-purple-50 text-violet-600 border-violet-200";
      case "B2": return "bg-gradient-to-br from-amber-50 to-orange-50 text-amber-600 border-amber-200";
      case "C1": return "bg-gradient-to-br from-rose-50 to-pink-50 text-rose-600 border-rose-200";
      case "C2": return "bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-600 border-indigo-200";
      default: return "bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 border-emerald-200";
    }
  };

  const typeIcons = {
    verbs: '📝', sentences: '💬', nouns: '📦', adjectives: '🎨', phrases: '💡', grammar: '📚'
  };

  const isCompleted = (structureId) => completedStructures.includes(structureId);

  const handleStartQuiz = (mode) => {
    setQuizMode(mode);
    setShowQuiz(true);
  };

  // Quiz View
  if (selectedStructure && showQuiz) {
    return (
      <StructureQuiz
        structure={selectedStructure}
        quizMode={quizMode}
        onBack={() => setShowQuiz(false)}
        onComplete={(result) => {
          if (result?.completed) {
            fetchUserProgress();
            if (result.xpAwarded > 0) {
              updateUser({ xp: (user?.xp || 0) + result.xpAwarded });
            }
          }
          setShowQuiz(false);
        }}
        isCompleted={isCompleted(selectedStructure._id)}
      />
    );
  }

  // Detail View
  if (selectedStructure) {
    return (
      <StructureDetail
        structure={selectedStructure}
        typeIcons={typeIcons}
        isCompleted={isCompleted(selectedStructure._id)}
        onBack={() => setSelectedStructure(null)}
        onStartQuiz={handleStartQuiz}
      />
    );
  }

  // List View
  return (
    <div className="min-h-screen p-4 flex flex-col bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto w-full">
        {/* Header */}
        <header className="mb-4 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 p-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full transform translate-x-16 -translate-y-16 opacity-50" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-100 to-indigo-100 rounded-full transform -translate-x-8 translate-y-8 opacity-50" />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl shadow-lg">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Struktura e Gjuhës</h1>
                    <p className="text-gray-600 text-sm">Mëso gjermanishten hap pas hapi</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                    <Trophy className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-amber-700 text-sm">{user?.xp || 0} XP</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                    <Award className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-green-700 text-sm">{completedStructures.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Level Filter */}
        <div className="bg-white border border-indigo-100 p-4 rounded-2xl mb-4 shadow-lg flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold text-gray-800">Filtro sipas Nivelit</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {levels.map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border shadow-sm hover:shadow-md hover:scale-105 active:scale-95 ${
                  selectedLevel === level
                    ? level === "all"
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-indigo-500 shadow-indigo-500/30"
                      : getLevelColor(level) + " border-2"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
                }`}
              >
                {level === "all" ? "Të gjitha" : level}
              </button>
            ))}
          </div>
        </div>

        {/* Structure List */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : structures.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-lg text-gray-600">Asnjë temë nuk është e disponueshme</p>
            <p className="text-sm mt-2 text-gray-400">Kontrollo më vonë për tema të reja</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {structures.map((structure) => {
              const isFinished = isCompleted(structure._id);
              return (
                <div
                  key={structure._id}
                  onClick={() => setSelectedStructure(structure)}
                  className={`p-4 rounded-2xl shadow-lg border-2 transition-all duration-200 cursor-pointer overflow-hidden relative group h-fit hover:-translate-y-1 ${
                    isFinished
                      ? "bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-green-300 hover:border-green-400"
                      : "bg-white border-gray-100 hover:border-indigo-300"
                  }`}
                >
                  <div className={`absolute top-3 right-3 ${getLevelColor(structure.level)} px-2 py-1 rounded-lg text-xs font-bold shadow-sm border`}>
                    {structure.level}
                  </div>
                  
                  {isFinished && (
                    <div className="absolute top-3 left-3 bg-green-500 text-white rounded-full p-1">
                      <Check className="w-3 h-3" />
                    </div>
                  )}

                  <div className="relative z-10">
                    <div className="text-3xl mb-2">{typeIcons[structure.type] || '📖'}</div>
                    <span className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold mb-1">
                      {structure.type?.toUpperCase()}
                    </span>
                    <h3 className={`text-sm font-bold mb-1 pr-10 truncate ${
                      isFinished ? "text-green-700 group-hover:text-green-800" : "text-gray-800 group-hover:text-indigo-700"
                    }`}>
                      {structure.title}
                    </h3>
                    {structure.description && (
                      <p className="text-xs text-gray-500 truncate">{structure.description}</p>
                    )}
                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                      <span className={`text-xs font-medium ${isFinished ? "text-green-500" : "text-gray-400"}`}>
                        {structure.items?.length || 0} artikuj
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 px-2 py-1 rounded-full font-bold flex items-center gap-1 shadow-sm border border-indigo-200">
                          <Star className="h-3 w-3" />
                          {structure.xp}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold shadow-sm ${
                          isFinished
                            ? "bg-gradient-to-r from-green-400 to-emerald-400 text-white"
                            : "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                        }`}>
                          {isFinished ? "✓" : "Fillo"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Structure Detail Component
function StructureDetail({ structure, typeIcons, isCompleted, onBack, onStartQuiz }) {
  const [playingAudio, setPlayingAudio] = useState(null);

  const items = structure.items || [];

  const playAudio = async (itemIndex, germanWord) => {
    try {
      setPlayingAudio(itemIndex);
      const audioUrl = await ttsService.getStructureAudio(structure._id, itemIndex, germanWord, structure.level);
      const audio = new Audio(audioUrl);
      audio.onended = () => setPlayingAudio(null);
      audio.onerror = () => setPlayingAudio(null);
      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setPlayingAudio(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-500" />
            </button>
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{typeIcons[structure.type] || '📖'}</span>
              <div>
                <h1 className="text-sm font-semibold text-slate-900 leading-tight">{structure.title}</h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    {structure.level}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {items.length} artikuj
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isCompleted && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
                <Check className="w-3 h-3" /> Përfunduar
              </span>
            )}
            <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
              <Star className="w-3 h-3" /> +{structure.xp} XP
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4">
        {/* Description + Quiz Actions */}
        {(structure.description || true) && (
          <div className="mb-4">
            {structure.description && (
              <p className="text-xs text-slate-500 mb-3">{structure.description}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => onStartQuiz('write')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                {isCompleted ? 'Riprovo - Shkruaj' : 'Kuiz - Shkruaj'}
              </button>
              <button
                onClick={() => onStartQuiz('options')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors"
              >
                <List className="w-3.5 h-3.5" />
                {isCompleted ? 'Riprovo - Zgjedh' : 'Kuiz - Zgjedh'}
              </button>
            </div>
          </div>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {items.map((item, index) => (
            <div
              key={index}
              className="group bg-white rounded-xl border border-slate-200 p-3.5 hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-slate-900 leading-snug truncate">
                    {item.german}
                  </p>
                  <p className="text-sm text-slate-500 mt-0.5 truncate">
                    {item.albanian}
                  </p>
                </div>
                <button
                  onClick={() => playAudio(index, item.german)}
                  disabled={playingAudio === index}
                  className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40"
                >
                  {playingAudio === index ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
              </div>
              {item.example && (
                <p className="text-[11px] text-slate-400 italic mt-2 pt-2 border-t border-slate-100 leading-relaxed">
                  {item.example}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Quiz Component - One question at a time with auto-advance
function StructureQuiz({ structure, quizMode, onBack, onComplete, isCompleted }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showXpAnimation, setShowXpAnimation] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [shuffledOptions, setShuffledOptions] = useState([]);

  const items = structure.items || [];
  const totalQuestions = items.length;
  const currentItem = items[currentIndex];

  // Generate options for current question
  useEffect(() => {
    if (quizMode === 'options' && currentItem) {
      const correctAnswer = currentItem.german;
      const options = [correctAnswer];
      const otherItems = items.filter(item => item.german !== correctAnswer);
      
      while (options.length < 4 && otherItems.length > 0) {
        const randomIndex = Math.floor(Math.random() * otherItems.length);
        const randomOption = otherItems[randomIndex].german;
        if (!options.includes(randomOption)) {
          options.push(randomOption);
        }
        otherItems.splice(randomIndex, 1);
      }
      
      setShuffledOptions(options.sort(() => Math.random() - 0.5));
    }
  }, [currentIndex, quizMode, currentItem, items]);

  const handleAnswer = (answer) => {
    const newAnswers = { ...answers, [currentIndex]: answer };
    setAnswers(newAnswers);
    
    // Auto-advance to next question
    setTimeout(() => {
      if (currentIndex < totalQuestions - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        handleSubmit(newAnswers);
      }
    }, 300);
  };

  const handleWriteSubmit = () => {
    if (!answers[currentIndex]) return;
    
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleSubmit(answers);
    }
  };

  const handleSubmit = async (finalAnswers) => {
    setIsSubmitting(true);
    
    let correct = 0;
    const detailedResults = items.map((item, index) => {
      const userAnswer = (finalAnswers[index] || '').toLowerCase().trim();
      const correctAnswer = item.german.toLowerCase().trim();
      const isCorrect = userAnswer === correctAnswer;
      if (isCorrect) correct++;
      
      return {
        question: item.albanian,
        userAnswer: finalAnswers[index] || '',
        correctAnswer: item.german,
        isCorrect
      };
    });

    const score = Math.round((correct / totalQuestions) * 100);

    try {
      const response = await structureService.submitQuiz(structure._id, score);
      const result = {
        ...response.data,
        correctCount: correct,
        accuracy: score,
        results: detailedResults
      };
      setResults(result);

      if (result.completed && result.xpAwarded > 0) {
        setXpGained(result.xpAwarded);
        setShowXpAnimation(true);
        setTimeout(() => setShowXpAnimation(false), 3000);
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      // Show results even if API fails
      setResults({
        correctCount: correct,
        accuracy: score,
        results: detailedResults,
        completed: score >= 70,
        xpAwarded: 0
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setAnswers({});
    setResults(null);
  };

  // Results View
  if (results) {
    const incorrectCount = totalQuestions - results.correctCount;

    return (
      <div className="min-h-screen p-4 flex flex-col bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        {/* XP Animation */}
        {showXpAnimation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 px-8 py-6 rounded-2xl shadow-2xl border-2 border-indigo-500 animate-bounce">
              <div className="flex items-center gap-3">
                <Star className="h-10 w-10 text-indigo-600 animate-spin" />
                <div>
                  <div className="text-3xl font-bold">+{xpGained} XP</div>
                  <div className="text-sm font-medium">Urime!</div>
                </div>
                <Zap className="h-10 w-10 text-indigo-600" />
              </div>
            </div>
          </div>
        )}

        <div className="max-w-2xl mx-auto w-full">
          {/* Header */}
          <header className="mb-4">
            <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 p-6 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full transform translate-x-16 -translate-y-16 opacity-50" />
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{structure.title}</h1>
                  <p className="text-gray-600 text-sm">Rezultatet e kuizit</p>
                </div>
                <button onClick={() => onComplete(results)} className="text-indigo-600 hover:text-indigo-700 p-1 transition-colors">
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </header>

          {/* Results Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 p-6">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">{results.completed ? "🎉" : "💪"}</div>
              <h2 className="text-2xl font-bold mb-2 text-gray-900">
                {results.completed ? "Shkëlqyeshëm!" : "Vazhdo të Praktikosh!"}
              </h2>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="rounded-xl p-3 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                <div className="flex items-center justify-center gap-1">
                  <Check className="w-4 h-4 text-green-600" />
                  <div className="text-xl font-bold text-green-600">{results.correctCount}</div>
                </div>
                <div className="text-xs text-gray-600 text-center">Saktë</div>
              </div>
              <div className="rounded-xl p-3 bg-gradient-to-br from-red-50 to-rose-50 border border-red-200">
                <div className="flex items-center justify-center gap-1">
                  <X className="w-4 h-4 text-red-600" />
                  <div className="text-xl font-bold text-red-600">{incorrectCount}</div>
                </div>
                <div className="text-xs text-gray-600 text-center">Gabim</div>
              </div>
              <div className="rounded-xl p-3 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200">
                <div className="text-xl font-bold text-blue-600 text-center">{results.accuracy}%</div>
                <div className="text-xs text-gray-600 text-center">Saktësia</div>
              </div>
              <div className="rounded-xl p-3 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200">
                <div className="flex items-center justify-center gap-1">
                  <Star className="w-4 h-4 text-indigo-600" />
                  <div className="text-xl font-bold text-indigo-600">+{results.xpAwarded || 0}</div>
                </div>
                <div className="text-xs text-gray-600 text-center">XP Fituar</div>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
              {results.results?.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-xl border ${
                    result.isCorrect 
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                      : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`p-1 rounded-full ${result.isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                      {result.isCorrect ? <Check className="w-3 h-3 text-green-600" /> : <X className="w-3 h-3 text-red-600" />}
                    </div>
                    <div className="flex-1 text-sm">
                      <div className="font-medium text-gray-900">{result.question}</div>
                      <div className="text-xs mt-1">
                        <span className="text-gray-500">Përgjigja: </span>
                        <span className={result.isCorrect ? 'text-green-700' : 'text-red-700'}>{result.userAnswer || "(bosh)"}</span>
                      </div>
                      {!result.isCorrect && (
                        <div className="text-xs">
                          <span className="text-gray-500">Saktë: </span>
                          <span className="text-green-700 font-medium">{result.correctAnswer}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleRetry}
                className="flex-1 px-4 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:from-indigo-600 hover:to-purple-700 transition-all text-sm"
              >
                Provo Përsëri
              </button>
              <button
                onClick={() => onComplete(results)}
                className="flex-1 px-4 py-2.5 rounded-xl font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all border border-gray-200 text-sm"
              >
                Kthehu
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz View - One question at a time
  return (
    <div className="min-h-screen p-4 flex flex-col bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-xl mx-auto w-full">
        {/* Header with progress */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="p-2 text-gray-600 hover:bg-white rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 mx-4">
            <div className="h-2 rounded-full overflow-hidden bg-gray-200">
              <div
                className="h-full transition-all duration-300 bg-gradient-to-r from-indigo-500 to-purple-600"
                style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
              />
            </div>
          </div>
          <div className="text-sm text-gray-600 font-medium">{currentIndex + 1} / {totalQuestions}</div>
        </div>

        {/* Quiz Info */}
        <div className="text-center mb-6">
          <h1 className="text-lg font-bold text-gray-900 mb-2">{structure.title}</h1>
          <div className="flex items-center justify-center gap-3 text-xs">
            <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium">Niveli: {structure.level}</span>
            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-medium flex items-center gap-1">
              <Star className="h-3 w-3" /> +{structure.xp} XP
            </span>
          </div>
        </div>

        {/* Question Card */}
        {currentItem && (
          <>
            <div className="bg-white rounded-2xl p-6 mb-6 shadow-xl border border-indigo-100">
              <p className="text-xs text-gray-500 mb-2">Shkruaj në gjermanisht:</p>
              <h2 className="text-xl font-bold text-gray-900">{currentItem.albanian}</h2>
              {currentItem.example && (
                <p className="text-sm text-gray-500 mt-2 italic">Shembull: {currentItem.example}</p>
              )}
            </div>

            {/* Answer Area */}
            {quizMode === 'write' ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={answers[currentIndex] || ''}
                  onChange={(e) => setAnswers({ ...answers, [currentIndex]: e.target.value })}
                  placeholder="Shkruaj përgjigjen këtu..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none text-lg"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleWriteSubmit()}
                />
                <button
                  onClick={handleWriteSubmit}
                  disabled={!answers[currentIndex] || isSubmitting}
                  className="w-full py-3 rounded-xl font-bold text-lg transition-colors bg-gradient-to-r from-indigo-500 to-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Duke dërguar..." : currentIndex === totalQuestions - 1 ? "Përfundo" : "Vazhdo"}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {shuffledOptions.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(option)}
                    className={`p-4 rounded-xl font-medium text-sm transition-all border-2 ${
                      answers[currentIndex] === option
                        ? 'bg-indigo-500 text-white border-indigo-500'
                        : 'bg-white text-gray-800 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
