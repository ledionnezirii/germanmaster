'use client';

import { useState, useEffect } from "react";
import { sentenceService, authService } from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import { Star, Zap, LogOut, Check, X, Lock, Crown, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FREE_SENTENCE_LIMIT = 5;

/* ─────────────────────────────────────────
   PAYWALL MODAL
───────────────────────────────────────── */
function PaywallModal({ onClose, isExpired }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 24 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="bg-white rounded-3xl shadow-2xl border border-orange-100 p-8 max-w-sm w-full text-center"
          onClick={e => e.stopPropagation()}
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 flex items-center justify-center mx-auto mb-5 shadow-inner">
            <Crown className="h-10 w-10 text-amber-500" />
          </div>

          {isExpired ? (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Abonimi ka Skaduar</h2>
              <p className="text-gray-500 text-sm mb-2 leading-relaxed">
                Abonimi juaj <span className="font-bold text-orange-500">Premium</span> ka skaduar.
              </p>
              <p className="text-gray-400 text-xs mb-7 leading-relaxed">
                Rinovoni tani për të rifituar akses të plotë të pakufizuar.
              </p>
              <button
                onClick={() => { window.location.href = "/payments"; }}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl font-semibold text-sm shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:brightness-105 active:scale-[0.98] transition-all mb-3"
              >
                Rinovo Abonimin Premium
              </button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Limit i Arritur</h2>
              <p className="text-gray-500 text-sm mb-2 leading-relaxed">
                Versioni falas lejon vetëm{" "}
                <span className="font-bold text-orange-500">{FREE_SENTENCE_LIMIT} kuize</span> të përfunduara.
              </p>
              <p className="text-gray-400 text-xs mb-7 leading-relaxed">
                Kaloni në planin Premium për akses të pakufizuar.
              </p>
              <button
                onClick={() => { window.location.href = "/payments"; }}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl font-semibold text-sm shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:brightness-105 active:scale-[0.98] transition-all mb-3"
              >
                Shiko Planet Premium
              </button>
            </>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-50 text-gray-500 rounded-2xl font-medium text-sm border border-gray-200 hover:bg-gray-100 active:scale-[0.98] transition-all"
          >
            Mbyll
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────
   LEVEL COLOR MAP
───────────────────────────────────────── */
const levelColorMap = {
  A1: "from-emerald-50 to-teal-50 text-emerald-600 border-emerald-200",
  A2: "from-blue-50 to-cyan-50 text-blue-600 border-blue-200",
  B1: "from-violet-50 to-purple-50 text-violet-600 border-violet-200",
  B2: "from-amber-50 to-orange-50 text-amber-600 border-amber-200",
  C1: "from-rose-50 to-pink-50 text-rose-600 border-rose-200",
  C2: "from-indigo-50 to-blue-50 text-indigo-600 border-indigo-200",
};
const getLevelColor = (lvl) =>
  `bg-gradient-to-br ${levelColorMap[lvl] || levelColorMap.A1}`;

/* ─────────────────────────────────────────
   BACK BUTTON — reusable
───────────────────────────────────────── */
function BackButton({ onClick, label = "Kthehu" }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: -3 }}
      whileTap={{ scale: 0.95 }}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 font-medium text-sm shadow-sm hover:shadow-md hover:border-orange-200 hover:text-orange-600 transition-all"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </motion.button>
  );
}

/* ─────────────────────────────────────────
   SENTENCE PAGE (main)
───────────────────────────────────────── */
export default function SentencePage() {
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState("A1");
  const [quizTitle, setQuizTitle] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [hadPaid, setHadPaid] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const { language } = useLanguage();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];

  useEffect(() => {
    document.title = "Ndërto Fjali Gjermanisht - Praktiko Strukturën e Fjalive | Ushtrime Interaktive";
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content =
      "Praktiko ndërtimin e fjalive gjermane duke rregulluar fjalët në rendin e saktë. Përmirësoni sintaksën nga A1 deri C2. Fillo sot!";

    const loadUser = async () => {
      try {
        const res = await authService.getProfile();
        const user = res.data?.user || res.data || res;
        setIsPaid(user?.isPaid === true);
        setHadPaid(user?.hadPaid === true || user?.isPaid === true);
      } catch {
        try {
          const stored = localStorage.getItem("user");
          if (stored) {
            const parsed = JSON.parse(stored);
            setIsPaid(parsed?.isPaid === true);
            setHadPaid(parsed?.hadPaid === true || parsed?.isPaid === true);
          }
        } catch {}
      }
    };
    loadUser();
  }, []);

  if (selectedQuizId) {
    return (
      <SentenceQuiz
        quizId={selectedQuizId}
        quizTitle={quizTitle}
        selectedLevel={selectedLevel}
        onBack={() => setSelectedQuizId(null)}
        onComplete={() => setSelectedQuizId(null)}
      />
    );
  }

  return (
    <div className="min-h-screen p-4 flex flex-col">
      {showPaywall && (
        <PaywallModal
          onClose={() => setShowPaywall(false)}
          isExpired={hadPaid && !isPaid}
        />
      )}

      <div className="max-w-6xl mx-auto w-full">
        {/* HEADER */}
        <header className="mb-5">
          <div style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 24,
            background: "linear-gradient(135deg, #6d28d9 0%, #7c3aed 40%, #8b5cf6 75%, #a78bfa 100%)",
            borderRadius: 20,
            padding: isMobile ? "20px" : "28px 32px",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
            <div style={{ position: "absolute", bottom: -60, right: 80, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

            <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                <Zap size={14} />
                Praktikë Gjuhësore
              </div>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 28 : 38, fontWeight: 400, color: "#fff", letterSpacing: -0.5, lineHeight: 1.1, margin: "0 0 8px" }}>
                Ndërto Fjali
              </h1>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", margin: 0, maxWidth: 380, lineHeight: 1.5 }}>
                Rregulloni fjalët në rendin e saktë dhe fitoni XP
              </p>
            </div>

            <div style={{ display: "flex", gap: 12, flexShrink: 0, position: "relative", zIndex: 1, alignSelf: "center", width: isMobile ? "100%" : "auto" }}>
              <div style={{ background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "center", flex: isMobile ? 1 : "unset", minWidth: isMobile ? 0 : 100 }}>
                <img
                  src={{ de: "https://flagcdn.com/w80/de.png", en: "https://flagcdn.com/w80/gb.png", fr: "https://flagcdn.com/w80/fr.png" }[language] || "https://flagcdn.com/w80/de.png"}
                  alt={language}
                  style={{ width: 56, height: 38, objectFit: "cover", borderRadius: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
                />
              </div>
            </div>
          </div>
        </header>

        {/* LEVEL FILTER */}
        <div className="bg-white border border-orange-100 p-4 rounded-2xl mb-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Filtro sipas Nivelit</p>
          <div className="flex flex-wrap gap-2">
            {levels.map((level) => {
              const active = selectedLevel === level;
              return (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md ${
                    active
                      ? level === "all"
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-transparent shadow-orange-200"
                        : `${getLevelColor(level)} border-2 shadow-sm`
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {level === "all" ? "Të gjitha" : level}
                </button>
              );
            })}
          </div>
        </div>

        {/* QUIZ LIST */}
        <SentenceList
          level={selectedLevel}
          language={language}
          isPaid={isPaid}
          hadPaid={hadPaid}
          onSelectQuiz={(quizId, title) => {
            setSelectedQuizId(quizId);
            setQuizTitle(title);
          }}
          onLimitReached={() => setShowPaywall(true)}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   SENTENCE QUIZ
───────────────────────────────────────── */
export function SentenceQuiz({ quizId, quizTitle, onComplete, onBack }) {
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedWords, setSelectedWords] = useState([]);
  const [availableWords, setAvailableWords] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showXpAnimation, setShowXpAnimation] = useState(false);
  const [xpGained, setXpGained] = useState(0);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await sentenceService.getSentenceById(quizId);
        const quizData = response.data?.data || response.data || response;
        setQuiz(quizData);
        if (quizData.questions?.length > 0) {
          setAvailableWords([...quizData.questions[0].options].sort(() => Math.random() - 0.5));
        }
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Dështoi ngarkimi i kuizit");
        setLoading(false);
      }
    };
    if (quizId) fetchQuiz();
    else { setLoading(false); setError("Asnjë kuiz nuk u zgjodh"); }
  }, [quizId]);

  const currentQuestion = quiz?.questions?.[currentQuestionIndex];
  const totalQuestions = quiz?.questions?.length || 0;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const handleWordSelect = (word, index) => {
    setSelectedWords(prev => [...prev, word]);
    setAvailableWords(prev => prev.filter((_, i) => i !== index));
  };

  const handleWordRemove = (word, index) => {
    setAvailableWords(prev => [...prev, word]);
    setSelectedWords(prev => prev.filter((_, i) => i !== index));
  };

  const handleCheckAnswer = () => {
    const userAnswer = selectedWords.join(" ");
    const newAnswers = [...answers, userAnswer];
    setAnswers(newAnswers);
    if (currentQuestionIndex < totalQuestions - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setSelectedWords([]);
      setAvailableWords([...quiz.questions[nextIndex].options].sort(() => Math.random() - 0.5));
    } else {
      handleSubmit(newAnswers);
    }
  };

  const handleSubmit = async (finalAnswers) => {
    try {
      setIsSubmitting(true);
      const response = await sentenceService.submitSentence(quizId, finalAnswers);
      const resultData = response.data?.data || response.data || response;
      setResults(resultData);
      if (resultData.passed && resultData.xpAwarded > 0) {
        setXpGained(resultData.xpAwarded);
        setShowXpAnimation(true);
        setTimeout(() => setShowXpAnimation(false), 3000);
      }
      setIsSubmitting(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Dështoi dërgimi i kuizit");
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setCurrentQuestionIndex(0);
    setSelectedWords([]);
    setAvailableWords([...quiz.questions[0].options].sort(() => Math.random() - 0.5));
    setAnswers([]);
    setResults(null);
    setError(null);
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
      </div>
    );
  }

  /* ── Error ── */
  if (error && !results) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 px-4">
        <div className="text-5xl">😕</div>
        <p className="text-red-500 text-center">{error}</p>
        <BackButton onClick={onBack} label="Kthehu te Kuizet" />
      </div>
    );
  }

  /* ── Results ── */
  if (results) {
    const correctCount = results.correctCount || 0;
    const incorrectCount = totalQuestions - correctCount;
    return (
      <div className="min-h-screen p-4 flex flex-col">
        {/* XP pop */}
        <AnimatePresence>
          {showXpAnimation && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: -50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: -50 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            >
              <motion.div
                className="bg-white text-orange-600 px-8 py-6 rounded-2xl shadow-2xl border-2 border-orange-300"
                animate={{ boxShadow: ["0 0 20px rgba(249,115,22,0.2)", "0 0 40px rgba(249,115,22,0.4)", "0 0 20px rgba(249,115,22,0.2)"] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                <div className="flex items-center gap-3">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, ease: "easeInOut" }}>
                    <Star className="h-9 w-9 text-orange-500" />
                  </motion.div>
                  <div>
                    <div className="text-3xl font-bold">+{xpGained} XP</div>
                    <div className="text-sm font-medium text-gray-500">Urime!</div>
                  </div>
                  <motion.div animate={{ scale: [1, 1.25, 1] }} transition={{ duration: 0.6, repeat: Infinity }}>
                    <Zap className="h-9 w-9 text-orange-500" />
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-3xl mx-auto w-full">
          {/* Results header */}
          <header className="mb-5">
            <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-5 flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-gray-900">{quizTitle || quiz?.title}</h1>
                <p className="text-gray-400 text-sm">Rezultatet e kuizit</p>
              </div>
              <button
                onClick={onComplete || onBack}
                className="p-2 rounded-xl text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-all"
                title="Mbyll"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </header>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6 mb-4">
            {/* Hero */}
            <div className="text-center mb-7">
              <div className="text-6xl mb-3">{results.passed ? "🎉" : "💪"}</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {results.passed ? "Shkëlqyeshëm!" : "Vazhdo të Praktikosh!"}
              </h2>
              <p className="text-gray-500 text-sm">{results.message}</p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
              {[
                { icon: <Check className="w-5 h-5 text-emerald-600" />, value: correctCount, label: "Saktë", bg: "from-emerald-50 to-teal-50 border-emerald-200", text: "text-emerald-600" },
                { icon: <X className="w-5 h-5 text-red-500" />, value: incorrectCount, label: "Gabim", bg: "from-red-50 to-rose-50 border-red-200", text: "text-red-500" },
                { value: `${results.accuracy}%`, label: "Saktësia", bg: "from-blue-50 to-cyan-50 border-blue-200", text: "text-blue-600" },
                { icon: <Star className="w-4 h-4 text-orange-500" />, value: `+${results.xpAwarded || 0}`, label: "XP Fituar", bg: "from-orange-50 to-amber-50 border-orange-200", text: "text-orange-600" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className={`rounded-2xl p-4 bg-gradient-to-br ${stat.bg} border`}
                >
                  <div className={`flex items-center justify-center gap-1.5 ${stat.text} text-2xl font-bold mb-1`}>
                    {stat.icon}{stat.value}
                  </div>
                  <div className="text-xs text-gray-500 text-center">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Detailed results */}
            <h3 className="text-base font-semibold text-gray-800 mb-3">Rezultatet e Detajuara</h3>
            <div className="space-y-3 mb-7">
              {results.results?.map((result, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className={`p-4 rounded-xl border-2 ${result.isCorrect ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200" : "bg-gradient-to-r from-red-50 to-rose-50 border-red-200"}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-full mt-0.5 ${result.isCorrect ? "bg-emerald-100" : "bg-red-100"}`}>
                      {result.isCorrect ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-red-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-400 mb-0.5">Pyetja {index + 1}</div>
                      <div className="font-medium text-gray-800 text-sm mb-1.5">{result.question}</div>
                      <div className="text-sm">
                        <span className="text-gray-400">Përgjigja jote: </span>
                        <span className={result.isCorrect ? "text-emerald-700 font-medium" : "text-red-600 font-medium"}>
                          {result.userAnswer || "(bosh)"}
                        </span>
                      </div>
                      {!result.isCorrect && (
                        <div className="text-sm mt-0.5">
                          <span className="text-gray-400">E sakta: </span>
                          <span className="text-emerald-700 font-medium">{result.correctAnswer}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                onClick={handleRetry}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-200 hover:brightness-105 transition-all"
              >
                Provo Përsëri
              </motion.button>
              <motion.button
                onClick={onComplete || onBack}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex-1 py-3 rounded-xl font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Kthehu te Kuizet
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  /* ── Active quiz ── */
  return (
    <div className="min-h-screen bg-[#FFF8F0] p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">

        {/* TOP BAR */}
        <div className="flex items-center gap-4 mb-8">
          <BackButton onClick={onBack} label="Kuizet" />
          <div className="flex-1 flex items-center gap-3">
            <div className="flex-1 h-2.5 rounded-full bg-gray-200 overflow-hidden shadow-inner">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
            <span className="text-sm font-semibold text-gray-500 whitespace-nowrap tabular-nums">
              {currentQuestionIndex + 1} / {totalQuestions}
            </span>
          </div>
        </div>

        {/* Quiz meta */}
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-gray-900 mb-3">{quiz?.title}</h1>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold border border-blue-100">
              Niveli: {quiz?.level}
            </span>
            <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-semibold border border-orange-100 flex items-center gap-1">
              <Star className="h-3 w-3" /> +{quiz?.xp} XP
            </span>
          </div>
        </div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
            className="bg-white rounded-2xl p-6 mb-5 shadow-md border border-gray-100"
          >
            <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Përkthe këtë fjali:</p>
            <h2 className="text-xl font-semibold text-gray-900 leading-relaxed">{currentQuestion?.question}</h2>
          </motion.div>
        </AnimatePresence>

        {/* Answer area */}
        <div className="bg-white rounded-2xl p-4 mb-5 min-h-[72px] border-2 border-dashed border-gray-200 shadow-sm">
          {selectedWords.length === 0 ? (
            <p className="text-sm text-gray-300 select-none">Kliko fjalët më poshtë për të formuar fjalinë…</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedWords.map((word, index) => (
                <button
                  key={`sel-${index}`}
                  onClick={() => handleWordRemove(word, index)}
                  className="px-4 py-2 rounded-xl font-medium text-sm bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm shadow-orange-200 hover:brightness-110 active:scale-95 transition-all"
                >
                  {word}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Word bank */}
        <div className="flex flex-wrap justify-center gap-2.5 mb-8">
          {availableWords.map((word, index) => (
            <button
              key={`avail-${index}`}
              onClick={() => handleWordSelect(word, index)}
              className="px-4 py-2 rounded-xl font-medium text-sm bg-white text-gray-700 border border-gray-200 shadow-sm hover:border-orange-300 hover:text-orange-600 hover:shadow-md active:scale-95 transition-all"
            >
              {word}
            </button>
          ))}
        </div>

        {/* Check / Submit button */}
        <motion.button
          onClick={handleCheckAnswer}
          disabled={selectedWords.length === 0 || isSubmitting}
          whileTap={selectedWords.length > 0 ? { scale: 0.97 } : {}}
          className={`w-full py-4 rounded-2xl font-bold text-base transition-all shadow-lg ${
            selectedWords.length === 0 || isSubmitting
              ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
              : "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-orange-200 hover:brightness-105 cursor-pointer"
          }`}
        >
          {isSubmitting
            ? "Duke dërguar…"
            : currentQuestionIndex === totalQuestions - 1
            ? "✓ Përfundo"
            : "Kontrollo →"}
        </motion.button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   SENTENCE LIST + PAGINATION
───────────────────────────────────────── */
export function SentenceList({ level, language, onSelectQuiz, isPaid, hadPaid, onLimitReached }) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [finishedIds, setFinishedIds] = useState([]);
  const itemsPerPage = 30;

  useEffect(() => {
    const fetchFinished = async () => {
      try {
        const response = await sentenceService.getFinishedSentences();
        const finished = response.data?.data || response.data || response || [];
        setFinishedIds(finished.map(s => s._id));
      } catch {}
    };
    fetchFinished();
  }, []);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        setError(null);
        let response;
        if (level && level !== "all") {
          response = await sentenceService.getSentencesByLevel(level, language);
        } else {
          response = await sentenceService.getAllSentences({ page: currentPage, limit: itemsPerPage, language });
        }
        const data = response.data?.data || response.data || response;
        const quizzesArray = data.sentences || data || [];
        const pagination = data.pagination;
        setQuizzes(Array.isArray(quizzesArray) ? quizzesArray : []);
        if (pagination) setTotalPages(pagination.pages || 1);
        else setTotalPages(Math.ceil((Array.isArray(quizzesArray) ? quizzesArray.length : 0) / itemsPerPage));
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Dështoi ngarkimi i kuizeve");
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, [level, currentPage, language]);

  useEffect(() => { setCurrentPage(1); }, [level, language]);

  const handleQuizClick = (quiz) => {
    if (!isPaid) {
      const isWithinFreeLimit = finishedIds.length < FREE_SENTENCE_LIMIT && !finishedIds.includes(quiz._id);
      const alreadyInFreeSlot = finishedIds.includes(quiz._id) && finishedIds.length <= FREE_SENTENCE_LIMIT;

      if (!alreadyInFreeSlot && finishedIds.length >= FREE_SENTENCE_LIMIT) {
        onLimitReached?.();
        return;
      }
      if (!finishedIds.includes(quiz._id) && finishedIds.length >= FREE_SENTENCE_LIMIT) {
        onLimitReached?.();
        return;
      }
    }

    onSelectQuiz(quiz._id, quiz.title);
  };

  /* ── Loading — matches Phrase spinner ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
      </div>
    );
  }

  if (error) return <div className="text-center py-8 text-red-400">{error}</div>;

  if (quizzes.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📝</div>
        <p className="text-gray-400">Asnjë kuiz nuk është i disponueshëm</p>
      </div>
    );
  }

  /* ── Pagination helpers ── */
  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [];
    if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push("...");
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1);
      pages.push("...");
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push("...");
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
      pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div>
      {/* Quiz cards */}
      <motion.div
        key={currentPage}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8"
      >
        {quizzes.map((quiz, idx) => {
          const isFinished = finishedIds.includes(quiz._id) || quiz.isCompleted;

          const strictLocked = !isPaid && !isFinished && finishedIds.length >= FREE_SENTENCE_LIMIT;

          return (
            <motion.div
              key={quiz._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03, duration: 0.25 }}
              onClick={() => handleQuizClick(quiz)}
              className={`relative p-4 rounded-2xl border-2 cursor-pointer overflow-hidden group transition-all duration-200 hover:-translate-y-1 ${
                strictLocked
                  ? "bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200 hover:border-gray-300"
                  : isFinished
                  ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 hover:border-amber-300 shadow-sm shadow-amber-100"
                  : "bg-white border-gray-100 hover:border-orange-200 shadow-sm hover:shadow-md"
              }`}
            >
              {/* Level badge */}
              <div className={`absolute top-3 left-3 ${getLevelColor(quiz.level)} px-2 py-0.5 rounded-lg text-xs font-bold border`}>
                {quiz.level}
              </div>

              {/* Lock icon */}
              {strictLocked && (
                <div className="absolute top-3 right-3">
                  <Lock className="h-4 w-4 text-gray-300" />
                </div>
              )}

              <div className="mt-8">
                <h3 className={`text-sm font-bold mb-2 truncate ${
                  strictLocked ? "text-gray-300" : isFinished ? "text-amber-700" : "text-gray-800 group-hover:text-orange-700"
                }`}>
                  {quiz.title}
                </h3>

                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <span className={`text-xs ${strictLocked ? "text-gray-300" : "text-gray-400"}`}>
                    {quiz.questions?.length || 0} pyetje
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5 border ${
                      strictLocked
                        ? "bg-gray-100 text-gray-300 border-gray-200"
                        : "bg-orange-50 text-orange-600 border-orange-100"
                    }`}>
                      <Star className="h-3 w-3" />{quiz.xp || 10}
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      strictLocked
                        ? "bg-gray-200 text-gray-400"
                        : isFinished
                        ? "bg-gradient-to-r from-amber-400 to-orange-400 text-white"
                        : "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm"
                    }`}>
                      {strictLocked ? "Premium" : isFinished ? "✓ Kryer" : "Fillo"}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          <motion.button
            whileHover={currentPage > 1 ? { scale: 1.05 } : {}}
            whileTap={currentPage > 1 ? { scale: 0.95 } : {}}
            onClick={() => currentPage > 1 && setCurrentPage(p => p - 1)}
            disabled={currentPage === 1}
            className={`flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${
              currentPage === 1
                ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600 shadow-sm hover:shadow-md cursor-pointer"
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Mbrapa</span>
          </motion.button>

          {getPageNumbers().map((page, i) =>
            page === "..." ? (
              <span key={`ellipsis-${i}`} className="px-2 py-2 text-gray-400 text-sm select-none">…</span>
            ) : (
              <motion.button
                key={page}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-xl text-sm font-semibold border transition-all ${
                  currentPage === page
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-transparent shadow-md shadow-orange-200"
                    : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600 shadow-sm hover:shadow-md"
                }`}
              >
                {page}
              </motion.button>
            )
          )}

          <motion.button
            whileHover={currentPage < totalPages ? { scale: 1.05 } : {}}
            whileTap={currentPage < totalPages ? { scale: 0.95 } : {}}
            onClick={() => currentPage < totalPages && setCurrentPage(p => p + 1)}
            disabled={currentPage === totalPages}
            className={`flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${
              currentPage === totalPages
                ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600 shadow-sm hover:shadow-md cursor-pointer"
            }`}
          >
            <span className="hidden sm:inline">Para</span>
            <ChevronRight className="h-4 w-4" />
          </motion.button>
        </div>
      )}
    </div>
  );
}