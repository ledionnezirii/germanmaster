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
  Zap,
  CheckCircle,
  XCircle,
  Calendar,
  Search,
  Sparkles,
  Trophy,
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
  const [notification, setNotification] = useState(null);
  const [quizCycle, setQuizCycle] = useState([]);
  const [quizCycleIndex, setQuizCycleIndex] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [savingXp, setSavingXp] = useState(false);

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
    setShowQuizResults(false);
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
    setTimeout(() => loadNextQuizWord(), 1500);
  };

  const finishQuiz = async () => {
    setShowQuizResults(true);
    const accuracy = quizScore.total > 0 ? (quizScore.correct / quizScore.total) * 100 : 0;
    
    // Award 5 XP if accuracy >= 60%
    if (accuracy >= 60) {
      setSavingXp(true);
      try {
        await wordsService.addQuizXp(5);
        showNotification("Urime! Fituat 5 XP bonus!", "success");
      } catch (error) {
        console.error("Error adding XP:", error);
      } finally {
        setSavingXp(false);
      }
    }
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
    <div className="w-full mx-auto px-4 py-6">
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
            <button
              key={tab.id}
              onClick={() => tab.id === "quiz" ? startQuiz() : setActiveView(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeView === tab.id
                  ? "bg-white text-teal-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
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
                { icon: Zap, title: "Fitoni XP", desc: "Nëse keni 60%+ saktësi, fitoni 5 XP bonus në fund të kuizit." },
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

            <button
              onClick={() => setActiveView("words")}
              className="w-full mt-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl font-medium transition-colors"
            >
              E Kuptova!
            </button>
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
            {/* Quiz Results Modal */}
            <AnimatePresence>
              {showQuizResults && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl text-center"
                  >
                    <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <Trophy size={36} className="text-white" />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Kuizi Përfundoi!</h2>
                    
                    <div className="bg-gray-50 rounded-2xl p-6 my-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Përgjigje të sakta:</span>
                        <span className="font-bold text-emerald-600 text-lg">{quizScore.correct}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Totali i pyetjeve:</span>
                        <span className="font-bold text-gray-800 text-lg">{quizScore.total}</span>
                      </div>
                      <div className="border-t pt-4 flex justify-between items-center">
                        <span className="text-gray-500">Saktësia:</span>
                        <span className={`font-bold text-lg ${
                          quizScore.total > 0 && (quizScore.correct / quizScore.total) >= 0.6 
                            ? "text-emerald-600" 
                            : "text-amber-600"
                        }`}>
                          {quizScore.total > 0 ? Math.round((quizScore.correct / quizScore.total) * 100) : 0}%
                        </span>
                      </div>
                      
                      {quizScore.total > 0 && (quizScore.correct / quizScore.total) >= 0.6 && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="bg-amber-50 rounded-xl p-4 flex items-center justify-center gap-2"
                        >
                          <Zap size={20} className="text-amber-500" />
                          <span className="font-semibold text-amber-700">+5 XP Bonus!</span>
                        </motion.div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowQuizResults(false);
                          setActiveView("words");
                        }}
                        className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-medium transition-colors"
                      >
                        Kthehu
                      </button>
                      <button
                        onClick={() => {
                          setShowQuizResults(false);
                          startQuiz();
                        }}
                        className="flex-1 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl font-medium transition-colors"
                      >
                        Luaj Përsëri
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quiz Stats */}
            <div className="flex justify-between items-center mb-6">
              <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100">
                <span className="text-sm text-gray-500">Rezultati: </span>
                <span className="font-semibold text-teal-600">{quizScore.correct}/{quizScore.total}</span>
              </div>
              <button
                onClick={finishQuiz}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-medium transition-colors text-sm"
              >
                Perfundo Kuizin
              </button>
            </div>

            {/* Quiz Card */}
            <div className="bg-gradient-to-br from-teal-500 to-emerald-500 rounded-3xl p-8 text-center mb-6 shadow-xl">
              <p className="text-teal-100 text-sm mb-3 uppercase tracking-wide">Përktheni</p>
              <h2 className="text-5xl font-bold text-white mb-2">{currentQuizWord.word}</h2>
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-3">
              {multipleChoiceOptions.map((option, idx) => {
                const isSelected = selectedAnswer?._id === option._id;
                const isCorrect = option._id === currentQuizWord._id;
                const showResult = quizResult !== null;

                return (
                  <button
                    key={option._id}
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
                        <CheckCircle size={20} className="text-emerald-500" />
                      )}
                      {showResult && isSelected && !isCorrect && (
                        <XCircle size={20} className="text-rose-500" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Result Feedback */}
            {quizResult !== null && (
              <div className={`mt-4 p-4 rounded-2xl flex items-center justify-center gap-2 ${
                quizResult ? "bg-emerald-50" : "bg-rose-50"
              }`}>
                <span className={`font-medium ${quizResult ? "text-emerald-600" : "text-rose-600"}`}>
                  {quizResult ? "E saktë!" : "Gabim!"}
                </span>
              </div>
            )}
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
                <div
                  key={i}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                >
                  <div className={`w-8 h-8 bg-${stat.color}-50 rounded-lg flex items-center justify-center mb-2`}>
                    <stat.icon size={16} className={`text-${stat.color}-500`} />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  <p className="text-xs text-gray-400">{stat.label}</p>
                </div>
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
              <button
                onClick={() => setShowAddForm(true)}
                className="w-12 h-12 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/30 transition-colors"
              >
                <Plus size={20} />
              </button>
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
                        <XCircle size={18} className="text-gray-400" />
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

                      <button
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
                      </button>
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {currentWords.map((word, idx) => (
                    <div
                      key={word._id}
                      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 group relative hover:shadow-md transition-shadow"
                    >
                      <button
                        onClick={() => handleRemoveWord(word._id)}
                        className="absolute top-3 right-3 p-1.5 bg-rose-50 rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} className="text-rose-500" />
                      </button>
                      <h3 className="text-xl font-semibold text-teal-600 mb-2 pr-8">{word.word}</h3>
                      <p className="text-base text-gray-500">{word.translation}</p>
                      <p className="text-xs text-gray-300 mt-4">
                        {new Date(word.createdAt).toLocaleDateString("sq-AL")}
                      </p>
                    </div>
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