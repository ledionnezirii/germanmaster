import React, { useState, useEffect } from "react";
import { createWordService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Trophy, Star, ArrowLeft, Delete, Send, BookOpen } from "lucide-react";

const Createword = () => {
  const { user } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState("A1");
  const [currentLesson, setCurrentLesson] = useState(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [gameState, setGameState] = useState("menu");
  const [results, setResults] = useState(null);
  const [finishedLessons, setFinishedLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usedIndices, setUsedIndices] = useState([]);
  const [shuffledLettersState, setShuffledLettersState] = useState([]);

  const levels = ["A1", "A2", "B1", "B2"];

  useEffect(() => {
    fetchLessons();
    fetchFinishedLessons();
  }, [selectedLevel]);

  const fetchLessons = async () => {
    try {
      const response = await createWordService.getAllLessons({ level: selectedLevel });
      setLessons(response.data);
    } catch (error) {
      console.error("Error fetching lessons:", error);
    }
  };

  const fetchFinishedLessons = async () => {
    try {
      const response = await createWordService.getFinishedLessons();
      setFinishedLessons(response.data.map((l) => l._id));
    } catch (error) {
      console.error("Error fetching finished lessons:", error);
    }
  };

  const startLesson = (lesson) => {
    setCurrentLesson(lesson);
    setCurrentWordIndex(0);
    setUserAnswers([]);
    setCurrentAnswer("");
    setUsedIndices([]);
    setShuffledLettersState(shuffleLetters(lesson.words[0].german));
    setGameState("playing");
    setResults(null);
  };

  const shuffleLetters = (word) => {
    const letters = word.split("");
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    return letters;
  };

  const handleLetterClick = (letter, index) => {
    setCurrentAnswer((prev) => prev + letter);
    setUsedIndices((prev) => [...prev, index]);
  };

  const handleBackspace = () => {
    setCurrentAnswer((prev) => prev.slice(0, -1));
    setUsedIndices((prev) => prev.slice(0, -1));
  };

  const handleSubmitWord = () => {
    if (!currentAnswer.trim()) return;

    const newAnswers = [...userAnswers, currentAnswer];
    setUserAnswers(newAnswers);
    setCurrentAnswer("");

    if (currentWordIndex < currentLesson.words.length - 1) {
      const nextIndex = currentWordIndex + 1;
      setCurrentWordIndex(nextIndex);
      setUsedIndices([]);
      setShuffledLettersState(shuffleLetters(currentLesson.words[nextIndex].german));
    } else {
      submitLesson(newAnswers);
    }
  };

  const submitLesson = async (answers) => {
    setLoading(true);
    try {
      const response = await createWordService.submitLesson(currentLesson._id, answers);
      setResults(response.data);
      setGameState("results");

      if (response.data.passed) {
        fetchFinishedLessons();
      }
    } catch (error) {
      console.error("Error submitting lesson:", error);
    } finally {
      setLoading(false);
    }
  };

  const backToMenu = () => {
    setGameState("menu");
    setCurrentLesson(null);
    setCurrentWordIndex(0);
    setUserAnswers([]);
    setCurrentAnswer("");
    setUsedIndices([]);
    setResults(null);
  };

  const getLevelColor = (level) => {
    switch (level) {
      case "A1":
        return "bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 border-emerald-200";
      case "A2":
        return "bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-600 border-blue-200";
      case "B1":
        return "bg-gradient-to-br from-violet-50 to-purple-50 text-violet-600 border-violet-200";
      case "B2":
        return "bg-gradient-to-br from-amber-50 to-orange-50 text-amber-600 border-amber-200";
      case "C1":
        return "bg-gradient-to-br from-rose-50 to-pink-50 text-rose-600 border-rose-200";
      case "C2":
        return "bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-600 border-indigo-200";
      default:
        return "bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 border-emerald-200";
    }
  };

  const currentWord = currentLesson?.words[currentWordIndex];
  const progress = currentLesson ? ((currentWordIndex + 1) / currentLesson.words.length) * 100 : 0;

  return (
    <div className="min-h-screen p-4 flex flex-col" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <div className="max-w-6xl mx-auto w-full">

        {/* Header - matching Listen style */}
        <header className="mb-4 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 p-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full transform translate-x-16 -translate-y-16 opacity-50" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-teal-100 to-emerald-100 rounded-full transform -translate-x-8 translate-y-8 opacity-50" />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {gameState !== "menu" && (
                    <motion.button
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={backToMenu}
                      className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 cursor-pointer hover:bg-emerald-100 transition-colors"
                      whileTap={{ scale: 0.95 }}
                    >
                      <ArrowLeft size={16} />
                    </motion.button>
                  )}
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">
                      {"Formo Fjal\u00ebn"}
                    </h1>
                    <p className="text-gray-600 text-sm">
                      {gameState === "menu"
                        ? "P\u00ebrmirso fjalorin t\u00ebnd duke formuar fjal\u00eb gjermanisht"
                        : gameState === "playing"
                        ? currentLesson?.title
                        : "Rezultatet"}
                    </p>
                  </div>
                </div>
                {gameState === "menu" && (
                  <p className="text-xs text-gray-400">
                    {"M\u00ebsime t\u00eb p\u00ebrfunduara: "}{finishedLessons.length}
                  </p>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Level Filter - matching Listen style */}
        {gameState === "menu" && (
          <div className="bg-white border border-emerald-100 p-4 rounded-2xl mb-4 shadow-lg flex-shrink-0">
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
                      ? getLevelColor(level) + " border-2"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* MENU STATE */}
        <AnimatePresence mode="wait">
          {gameState === "menu" && (
            <motion.div
              key="menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {lessons.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <div className="bg-white rounded-2xl p-8 inline-block border border-gray-100 shadow-xl">
                    <BookOpen className="text-emerald-400 w-12 h-12 mx-auto mb-4" />
                    <h3 className="text-base font-semibold text-gray-800 mb-2">{"Nuk ka m\u00ebsime"}</h3>
                    <p className="text-gray-500 text-sm">
                      {"Nuk ka m\u00ebsime p\u00ebr nivelin "}{selectedLevel}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {lessons.map((lesson, i) => {
                    const isFinished = finishedLessons.includes(lesson._id);
                    return (
                      <motion.div
                        key={lesson._id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => startLesson(lesson)}
                        className={`p-4 rounded-2xl shadow-lg border-2 transition-all duration-200 cursor-pointer overflow-hidden relative group h-fit hover:-translate-y-1 ${
                          isFinished
                            ? "bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-amber-300 hover:border-amber-400"
                            : "bg-white border-gray-100 hover:border-emerald-300"
                        }`}
                      >
                        <div className={`absolute top-3 right-3 ${getLevelColor(lesson.level)} px-2 py-1 rounded-lg text-xs font-bold shadow-sm border`}>
                          {lesson.level}
                        </div>
                        <BookOpen
                          className={`absolute -bottom-4 -right-4 w-20 h-20 ${
                            isFinished ? "text-amber-100" : "text-gray-100"
                          } transition-transform group-hover:scale-110`}
                        />
                        <div className="relative z-10">
                          <h3
                            className={`text-sm font-bold mb-2 pr-14 truncate ${
                              isFinished
                                ? "text-amber-700 group-hover:text-amber-800"
                                : "text-gray-800 group-hover:text-emerald-700"
                            }`}
                          >
                            {lesson.title}
                          </h3>
                          <p className={`text-xs line-clamp-2 leading-relaxed ${isFinished ? "text-amber-600" : "text-gray-500"}`}>
                            {lesson.words.length} {"fjal\u00eb gjermanisht"}
                          </p>
                          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                            <span className={`text-xs font-medium ${isFinished ? "text-amber-500" : "text-gray-400"}`}>
                              {"Gjermanisht \u2022 Fjal\u00eb"}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shadow-sm border border-emerald-200">
                                {lesson.xp} XP
                              </span>
                              <span
                                className={`text-xs px-3 py-1 rounded-full font-semibold shadow-sm ${
                                  isFinished
                                    ? "bg-gradient-to-r from-amber-400 to-orange-400 text-white"
                                    : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                                }`}
                              >
                                {isFinished ? "\u2713 Kryer" : "Fillo"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* PLAYING STATE */}
          {gameState === "playing" && currentWord && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="max-w-xl mx-auto"
            >
              <div className="bg-white rounded-2xl shadow-xl border-2 border-emerald-200 p-5 sm:p-6">
                {/* Progress bar */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 font-medium">Progresi</span>
                    <span className="text-xs font-bold text-emerald-700 bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-1 rounded-full border border-emerald-200">
                      {currentWordIndex + 1} / {currentLesson.words.length}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                    />
                  </div>
                </div>

                {/* Albanian word prompt */}
                <div className="text-center mb-6">
                  <p className="text-sm text-gray-500 mb-1">
                    {"Formo fjal\u00ebn gjermane p\u00ebr:"}
                  </p>
                  <motion.h2
                    key={currentWord.albanian}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="text-3xl font-bold text-gray-900"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    {currentWord.albanian}
                  </motion.h2>
                </div>

                {/* Answer display */}
                <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-5 mb-5 min-h-[64px] flex items-center justify-center border-2 border-emerald-100">
                  <motion.p
                    key={currentAnswer}
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-semibold"
                    style={{
                      fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                      letterSpacing: "0.12em",
                      color: currentAnswer ? "#1a1a1a" : "#ccc",
                    }}
                  >
                    {currentAnswer || "..."}
                  </motion.p>
                </div>

                {/* Letter tiles */}
                <div className="flex flex-wrap gap-2 justify-center mb-5">
                  {shuffledLettersState.map((letter, index) => {
                    const isUsed = usedIndices.includes(index);
                    return (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{
                          opacity: isUsed ? 0.25 : 1,
                          scale: isUsed ? 0.85 : 1,
                          y: isUsed ? 4 : 0,
                        }}
                        transition={{ duration: 0.15 }}
                        whileHover={!isUsed ? { scale: 1.1 } : {}}
                        whileTap={!isUsed ? { scale: 0.9 } : {}}
                        onClick={() => !isUsed && handleLetterClick(letter, index)}
                        disabled={isUsed}
                        className={`w-12 h-12 rounded-xl text-lg font-bold flex items-center justify-center transition-all shadow-sm ${
                          isUsed
                            ? "bg-gray-100 border-2 border-gray-200 text-gray-300 cursor-default"
                            : "bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 text-emerald-800 cursor-pointer hover:from-emerald-100 hover:to-teal-100 hover:border-emerald-300 hover:shadow-md"
                        }`}
                      >
                        {letter.toUpperCase()}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleBackspace}
                    className="flex-1 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 hover:bg-gray-100 transition-all"
                  >
                    <Delete size={15} />
                    Fshi
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSubmitWord}
                    disabled={!currentAnswer.trim() || loading}
                    className={`flex-[2] py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg ${
                      currentAnswer.trim() && !loading
                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white cursor-pointer hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/30 hover:shadow-emerald-500/40"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                    }`}
                  >
                    <Send size={14} />
                    {loading ? "Po ngarkohet..." : "D\u00ebrgo"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* RESULTS STATE */}
          {gameState === "results" && results && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-xl mx-auto"
            >
              <div className="bg-white rounded-2xl shadow-xl border-2 border-emerald-200 p-5 sm:p-6">
                {/* Result header */}
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                    className="mb-3"
                  >
                    {results.passed ? (
                      <Trophy size={48} className="mx-auto text-amber-400" />
                    ) : (
                      <XCircle size={48} className="mx-auto text-red-400" />
                    )}
                  </motion.div>
                  <h2
                    className={`text-2xl font-bold mb-1 ${results.passed ? "text-emerald-600" : "text-red-500"}`}
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    {results.passed ? "Urime!" : "P\u00ebrpiqu P\u00ebrs\u00ebri!"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {results.passed ? "Kalove m\u00ebsimin me sukses!" : "Nevojitet 75% ose m\u00eb shum\u00eb p\u00ebr t\u00eb kaluar"}
                  </p>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: "Rezultati", value: `${results.scorePercentage}%`, color: "text-emerald-600", bg: "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200" },
                    { label: "T\u00eb sakta", value: `${results.correctCount}/${results.totalWords}`, color: "text-teal-600", bg: "bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200" },
                    { label: "XP Fituar", value: `+${results.xpAwarded}`, color: "text-amber-600", bg: "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className={`${stat.bg} rounded-xl p-3.5 text-center border`}
                    >
                      <p className="text-[11px] text-gray-500 mb-1 font-medium uppercase tracking-wide">
                        {stat.label}
                      </p>
                      <p className={`text-xl font-bold ${stat.color}`}>
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Details list */}
                <div className="mb-5">
                  <p className="text-sm font-semibold text-gray-600 mb-3">
                    Detajet
                  </p>
                  <div className="flex flex-col gap-2">
                    {results.results.map((result, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.06 }}
                        className={`flex items-center gap-3 p-3 rounded-xl border ${
                          result.isCorrect
                            ? "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200"
                            : "bg-gradient-to-br from-red-50 to-rose-50 border-red-200"
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-gray-800">
                              {currentLesson.words[index].albanian}
                            </span>
                            <span className="text-xs text-gray-400">{"\u2192"}</span>
                            <span
                              className={`text-sm font-semibold ${result.isCorrect ? "text-emerald-700" : "text-red-600"}`}
                              style={{ fontFamily: "'JetBrains Mono', 'SF Mono', monospace" }}
                            >
                              {result.userAnswer}
                            </span>
                          </div>
                          {!result.isCorrect && (
                            <p className="text-xs text-emerald-600 opacity-80">
                              {"E sakt\u00eb: "}
                              <span style={{ fontFamily: "'JetBrains Mono', 'SF Mono', monospace", fontWeight: 600 }}>
                                {currentLesson.words[index].german}
                              </span>
                            </p>
                          )}
                        </div>
                        {result.isCorrect ? (
                          <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
                        ) : (
                          <XCircle size={16} className="text-red-500 flex-shrink-0" />
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Back button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={backToMenu}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40"
                >
                  <ArrowLeft size={15} />
                  Kthehu te Menuja
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Createword;
