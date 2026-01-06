import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Brain,
  Plus,
  HelpCircle,
  X,
  Zap,
  CheckCircle,
  XCircle,
  Calendar,
  Search,
  Sparkles,
} from "lucide-react";
import { wordsService } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Phrase() {
  const { user } = useAuth();
  const [words, setWords] = useState([]);
  const [filteredWords, setFilteredWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newWord, setNewWord] = useState("");
  const [translation, setTranslation] = useState("");
  const [adding, setAdding] = useState(false);
  const [stats, setStats] = useState({ totalWords: 0, wordsThisWeek: 0, wordsThisMonth: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const wordsPerPage = 30;

  const [activeView, setActiveView] = useState("words"); // words, quiz, help
  const [currentQuizWord, setCurrentQuizWord] = useState(null);
  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });
  const [totalXP, setTotalXP] = useState(0);
  const [notification, setNotification] = useState(null);
  const [quizCycle, setQuizCycle] = useState([]);
  const [quizCycleIndex, setQuizCycleIndex] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);

  const newWordInputRef = useRef(null);

  const insertUmlaut = (char) => {
    const input = newWordInputRef.current;
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const newValue = newWord.substring(0, start) + char + newWord.substring(end);
    setNewWord(newValue);
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + 1, start + 1);
    }, 0);
  };

  const umlauts = ["ä", "ö", "ü", "ß", "Ä", "Ö", "Ü"];

  useEffect(() => {
    if (user) {
      fetchWords();
      fetchStats();
    }
  }, [user]);

  const fetchWords = async () => {
    try {
      setLoading(true);
      const response = await wordsService.getLearnedWords();
      setWords(response.data || []);
      setFilteredWords(response.data || []);
    } catch (error) {
      console.error("Error fetching words:", error);
      showNotification("Gabim në ngarkim të fjalëve", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await wordsService.getWordStats();
      setStats(response.data || { totalWords: 0, wordsThisWeek: 0, wordsThisMonth: 0 });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const generateMultipleChoiceOptions = (correctWord, allWords) => {
    const wrongWords = allWords.filter((w) => w._id !== correctWord._id);
    const shuffledWrong = shuffleArray(wrongWords);
    const wrongOptions = shuffledWrong.slice(0, 3);
    const allOptions = [correctWord, ...wrongOptions];
    return shuffleArray(allOptions);
  };

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredWords(words);
    } else {
      const filtered = words.filter(
        (word) =>
          word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
          word.translation.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredWords(filtered);
    }
    setCurrentPage(1);
  }, [searchQuery, words]);

  const handleAddWord = async (e) => {
    e.preventDefault();
    if (!newWord.trim()) {
      showNotification("Ju lutem shkruani një fjalë", "error");
      return;
    }
    try {
      setAdding(true);
      const response = await wordsService.addLearnedWord({
        word: newWord,
        translation,
      });
      setWords([response.data, ...words]);
      setNewWord("");
      setTranslation("");
      setShowAddForm(false);
      showNotification("Fjala u shtua me sukses!", "success");
      fetchStats();
    } catch (error) {
      console.error("Error adding word:", error);
      showNotification(error.response?.data?.message || "Dështoi shtimi i fjalës", "error");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveWord = async (id) => {
    if (!window.confirm("Jeni i sigurt që dëshironi të fshini këtë fjalë?")) return;
    try {
      await wordsService.removeLearnedWord(id);
      setWords(words.filter((word) => word._id !== id));
      showNotification("Fjala u fshi!", "success");
      fetchStats();
    } catch (error) {
      console.error("Error removing word:", error);
      showNotification("Dështoi fshirja e fjalës", "error");
    }
  };

  const startQuiz = () => {
    if (words.length < 4) {
      showNotification("Ju nevojiten të paktën 4 fjalë!", "error");
      return;
    }
    setActiveView("quiz");
    setQuizScore({ correct: 0, total: 0 });
    setTotalXP(0);
    const shuffledWords = shuffleArray(words);
    setQuizCycle(shuffledWords);
    setQuizCycleIndex(0);
    const firstWord = shuffledWords[0];
    setCurrentQuizWord(firstWord);
    setMultipleChoiceOptions(generateMultipleChoiceOptions(firstWord, words));
    setSelectedAnswer(null);
    setQuizResult(null);
  };

  const loadNextQuizWord = () => {
    const nextIndex = quizCycleIndex + 1;
    let nextWord;
    if (nextIndex >= quizCycle.length) {
      const shuffledWords = shuffleArray(words);
      setQuizCycle(shuffledWords);
      setQuizCycleIndex(0);
      nextWord = shuffledWords[0];
    } else {
      setQuizCycleIndex(nextIndex);
      nextWord = quizCycle[nextIndex];
    }
    setCurrentQuizWord(nextWord);
    setMultipleChoiceOptions(generateMultipleChoiceOptions(nextWord, words));
    setSelectedAnswer(null);
    setQuizResult(null);
  };

  const handleAnswerSelection = (option) => {
    if (quizResult !== null) return;
    setSelectedAnswer(option);
    const isCorrect = option._id === currentQuizWord._id;
    setQuizResult(isCorrect);
    setQuizScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    if (isCorrect) {
      setTotalXP((prev) => prev + 1);
    }
    setTimeout(() => loadNextQuizWord(), 1800);
  };

  const indexOfLastWord = currentPage * wordsPerPage;
  const indexOfFirstWord = indexOfLastWord - wordsPerPage;
  const currentWords = filteredWords.slice(indexOfFirstWord, indexOfLastWord);
  const totalPages = Math.ceil(filteredWords.length / wordsPerPage);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen size={24} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Ju lutem identifikohuni</h2>
          <p className="text-gray-500 text-sm">Duhet të jeni të identifikuar për të parë fjalët tuaja të mësuara</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-6 right-6 px-4 py-3 rounded-2xl font-medium text-sm shadow-xl z-50 flex items-center gap-2 backdrop-blur-sm ${
              notification.type === "success"
                ? "bg-emerald-500/90 text-white"
                : "bg-rose-500/90 text-white"
            }`}
          >
            {notification.type === "success" ? <CheckCircle size={16} /> : <XCircle size={16} />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Pills */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center mb-8"
      >
        <div className="inline-flex bg-gray-100 p-1 rounded-2xl gap-1">
          {[
            { id: "words", icon: BookOpen, label: "Fjalët" },
            { id: "quiz", icon: Brain, label: "Kuizi" },
            { id: "help", icon: HelpCircle, label: "Ndihmë" },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => tab.id === "quiz" ? startQuiz() : setActiveView(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeView === tab.id
                  ? "bg-white text-teal-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Help View */}
      <AnimatePresence mode="wait">
        {activeView === "help" && (
          <motion.div
            key="help"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                <HelpCircle size={20} className="text-teal-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Si të Përdorni</h2>
            </div>
            
            <div className="space-y-4">
              {[
                { icon: Plus, title: "Shtoni Fjalë", desc: "Klikoni butonin + për të shtuar fjalë të reja gjermane." },
                { icon: Brain, title: "Luani Kuizin", desc: "Testoni njohuritë duke zgjedhur përkthimin e saktë." },
                { icon: Zap, title: "Fitoni XP", desc: "Çdo përgjigje e saktë ju jep 1 XP." },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-4 p-4 bg-gray-50 rounded-2xl"
                >
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <item.icon size={18} className="text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">{item.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveView("words")}
              className="w-full mt-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl font-medium transition-colors"
            >
              E Kuptova!
            </motion.button>
          </motion.div>
        )}

        {/* Quiz View */}
        {activeView === "quiz" && currentQuizWord && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Quiz Stats */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-3">
                <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100">
                  <span className="text-sm text-gray-500">Rezultati: </span>
                  <span className="font-semibold text-teal-600">{quizScore.correct}/{quizScore.total}</span>
                </div>
                <div className="bg-amber-50 px-4 py-2 rounded-2xl flex items-center gap-1.5">
                  <Zap size={14} className="text-amber-500" />
                  <span className="font-semibold text-amber-600">{totalXP} XP</span>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveView("words")}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </motion.button>
            </div>

            {/* Quiz Card */}
            <motion.div
              key={currentQuizWord._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-teal-500 to-emerald-500 rounded-3xl p-8 text-center mb-6 shadow-xl"
            >
              <p className="text-teal-100 text-sm mb-3 uppercase tracking-wide">Përktheni</p>
              <h2 className="text-5xl font-bold text-white mb-2">{currentQuizWord.word}</h2>
            </motion.div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-3">
              {multipleChoiceOptions.map((option, idx) => {
                const isSelected = selectedAnswer?._id === option._id;
                const isCorrect = option._id === currentQuizWord._id;
                const showResult = quizResult !== null;

                return (
                  <motion.button
                    key={option._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={!showResult ? { scale: 1.02 } : {}}
                    whileTap={!showResult ? { scale: 0.98 } : {}}
                    onClick={() => handleAnswerSelection(option)}
                    disabled={showResult}
                    className={`p-5 rounded-2xl text-left transition-all border-2 ${
                      showResult
                        ? isCorrect
                          ? "border-emerald-400 bg-emerald-50"
                          : isSelected
                          ? "border-rose-400 bg-rose-50"
                          : "border-gray-100 bg-gray-50 opacity-50"
                        : isSelected
                        ? "border-teal-400 bg-teal-50"
                        : "border-gray-100 bg-white hover:border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${
                        showResult && isCorrect ? "text-emerald-700" :
                        showResult && isSelected && !isCorrect ? "text-rose-700" :
                        "text-gray-700"
                      }`}>
                        {option.translation || option.word}
                      </span>
                      {showResult && isCorrect && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                          <CheckCircle size={20} className="text-emerald-500" />
                        </motion.div>
                      )}
                      {showResult && isSelected && !isCorrect && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                          <XCircle size={20} className="text-rose-500" />
                        </motion.div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Result Feedback */}
            <AnimatePresence>
              {quizResult !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`mt-4 p-4 rounded-2xl flex items-center justify-center gap-2 ${
                    quizResult ? "bg-emerald-50" : "bg-rose-50"
                  }`}
                >
                  <span className={`font-medium ${quizResult ? "text-emerald-600" : "text-rose-600"}`}>
                    {quizResult ? "E saktë! +1 XP" : "Gabim!"}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Words View */}
        {activeView === "words" && (
          <motion.div
            key="words"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { icon: Sparkles, label: "Totali", value: stats.totalWords, color: "teal" },
                { icon: Calendar, label: "Këtë Javë", value: stats.wordsThisWeek, color: "blue" },
                { icon: Zap, label: "Këtë Muaj", value: stats.wordsThisMonth, color: "amber" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                >
                  <div className={`w-8 h-8 bg-${stat.color}-50 rounded-lg flex items-center justify-center mb-2`}>
                    <stat.icon size={16} className={`text-${stat.color}-500`} />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  <p className="text-xs text-gray-400">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Search & Add */}
            <div className="flex gap-3 mb-6">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Kërko fjalë..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 text-sm transition-all"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddForm(true)}
                className="w-12 h-12 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/30 transition-colors"
              >
                <Plus size={20} />
              </motion.button>
            </div>

            {/* Add Word Modal */}
            <AnimatePresence>
              {showAddForm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                  onClick={() => setShowAddForm(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-800">Shto Fjalë të Re</h3>
                      <button
                        onClick={() => setShowAddForm(false)}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                      >
                        <X size={18} className="text-gray-400" />
                      </button>
                    </div>

                    <form onSubmit={handleAddWord} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          Fjala Gjermane
                        </label>
                        <input
                          ref={newWordInputRef}
                          type="text"
                          value={newWord}
                          onChange={(e) => setNewWord(e.target.value)}
                          placeholder="p.sh. Haus"
                          className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 text-sm"
                        />
                        <div className="flex gap-1.5 mt-2">
                          {umlauts.map((char) => (
                            <button
                              key={char}
                              type="button"
                              onClick={() => insertUmlaut(char)}
                              className="px-2.5 py-1.5 text-xs font-medium bg-gray-100 hover:bg-teal-100 hover:text-teal-700 rounded-lg transition-colors"
                            >
                              {char}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          Përkthimi (Shqip)
                        </label>
                        <input
                          type="text"
                          value={translation}
                          onChange={(e) => setTranslation(e.target.value)}
                          placeholder="p.sh. Shtëpi"
                          className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 text-sm"
                        />
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="submit"
                        disabled={adding || !newWord.trim()}
                        className="w-full py-3 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-2xl font-medium transition-all flex items-center justify-center gap-2"
                      >
                        {adding ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                          />
                        ) : (
                          <>
                            <Plus size={18} />
                            Shto Fjalën
                          </>
                        )}
                      </motion.button>
                    </form>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Words Grid */}
            {currentWords.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen size={24} className="text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">
                  {searchQuery ? "Nuk u gjet asnjë fjalë" : "Nuk keni shtuar ende fjalë"}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  {searchQuery ? "Provoni një kërkim tjetër" : "Klikoni + për të filluar"}
                </p>
              </motion.div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {currentWords.map((word, idx) => (
                    <motion.div
                      key={word._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      whileHover={{ y: -2 }}
                      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 group relative"
                    >
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleRemoveWord(word._id)}
                        className="absolute top-3 right-3 p-1.5 bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} className="text-rose-500" />
                      </motion.button>
                      <h3 className="text-lg font-semibold text-teal-600 mb-1">{word.word}</h3>
                      <p className="text-sm text-gray-500">{word.translation}</p>
                      <p className="text-xs text-gray-300 mt-3">
                        {new Date(word.createdAt).toLocaleDateString("sq-AL")}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={18} className="text-gray-600" />
                    </motion.button>
                    
                    <div className="flex gap-1.5 flex-wrap justify-center">
                      {[...Array(totalPages)].map((_, i) => {
                        const pageNumber = i + 1;
                        // Show first, last, current, and pages around current
                        if (
                          pageNumber === 1 ||
                          pageNumber === totalPages ||
                          (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                        ) {
                          return (
                            <motion.button
                              key={i}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setCurrentPage(pageNumber)}
                              className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                                currentPage === pageNumber
                                  ? "bg-teal-500 text-white shadow-lg shadow-teal-500/30"
                                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              {pageNumber}
                            </motion.button>
                          );
                        } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                          return (
                            <span key={i} className="w-10 h-10 flex items-center justify-center text-gray-400">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={18} className="text-gray-600" />
                    </motion.button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}