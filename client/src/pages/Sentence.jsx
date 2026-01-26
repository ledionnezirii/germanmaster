'use client';

import { useState, useEffect } from "react";
import { sentenceService } from "../services/api";
import { Star, Zap, TrendingUp, LogOut, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Main Sentence Page Component - handles both list and quiz views
export default function SentencePage() {
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [quizTitle, setQuizTitle] = useState("");

  const levels = ["all", "A1", "A2", "B1", "B2", "C1", "C2"];

  // SEO Effect
  useEffect(() => {
    // Update page title
    document.title = "Ndërto Fjali Gjermanisht - Praktiko Strukturën e Fjalive | Ushtrime Interaktive"
    
    // Update or create meta description
    let metaDescription = document.querySelector('meta[name="description"]')
    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.name = 'description'
      document.head.appendChild(metaDescription)
    }
    metaDescription.content = "Praktiko ndërtimin e fjalive gjermane duke rregulluar fjalët në rendin e saktë. Përmirësoni sintaksën nga A1 deri C2. Fillo sot!"
    
    // Update or create meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]')
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta')
      metaKeywords.name = 'keywords'
      document.head.appendChild(metaKeywords)
    }
    metaKeywords.content = "ndërto fjali, fjali gjermanisht, sentence building, satzbau deutsch, strukturë fjali, sintaksë gjermane, ushtrime fjali"
    
    // Update canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]')
    if (!canonicalLink) {
      canonicalLink = document.createElement('link')
      canonicalLink.rel = 'canonical'
      document.head.appendChild(canonicalLink)
    }
    canonicalLink.href = `${window.location.origin}/sentences`
    
    // Update Open Graph meta tags
    updateMetaTag('og:title', 'Ndërto Fjali Gjermanisht - Praktiko Strukturën e Fjalive')
    updateMetaTag('og:description', 'Praktiko ndërtimin e fjalive gjermane duke rregulluar fjalët në rendin e saktë. Përshtat për të gjitha nivelet.')
    updateMetaTag('og:url', `${window.location.origin}/sentences`)
    updateMetaTag('og:type', 'website')
    
    // Update Twitter meta tags
    updateMetaTag('twitter:title', 'Ndërto Fjali Gjermanisht - Praktiko Strukturën e Fjalive')
    updateMetaTag('twitter:description', 'Praktiko ndërtimin e fjalive gjermane duke rregulluar fjalët në rendin e saktë. Përshtat për të gjitha nivelet.')
    
    // Add structured data for sentence page
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "LearningResource",
      "name": "Ndërto Fjali Gjermanisht",
      "description": "Praktiko ndërtimin e fjalive gjermane duke rregulluar fjalët në rendin e saktë",
      "url": `${window.location.origin}/sentences`,
      "educationalLevel": ["Beginner", "Intermediate", "Advanced"],
      "inLanguage": ["de", "sq"],
      "learningResourceType": "Interactive Exercise",
      "offers": {
        "@type": "Offer",
        "category": "Educational Services"
      }
    }
    
    let structuredDataScript = document.querySelector('script[type="application/ld+json"][data-sentence]')
    if (!structuredDataScript) {
      structuredDataScript = document.createElement('script')
      structuredDataScript.type = 'application/ld+json'
      structuredDataScript.setAttribute('data-sentence', 'true')
      document.head.appendChild(structuredDataScript)
    }
    structuredDataScript.textContent = JSON.stringify(structuredData)
    
    // Cleanup function
    return () => {
      // Remove the structured data script when component unmounts
      const script = document.querySelector('script[type="application/ld+json"][data-sentence]')
      if (script) script.remove()
    }
  }, [])
  
  // Helper function to update meta tags
  const updateMetaTag = (property, content) => {
    let metaTag = document.querySelector(`meta[property="${property}"]`) || 
                  document.querySelector(`meta[name="${property}"]`)
    if (!metaTag) {
      metaTag = document.createElement('meta')
      metaTag.setAttribute(property.startsWith('og:') ? 'property' : 'name', property)
      document.head.appendChild(metaTag)
    }
    metaTag.content = content
  }

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
      <div className="max-w-6xl mx-auto w-full">
        {/* Header - Same style as Listen */}
        <header className="mb-4 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-xl border border-orange-100 p-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full transform translate-x-16 -translate-y-16 opacity-50" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-amber-100 to-orange-100 rounded-full transform -translate-x-8 translate-y-8 opacity-50" />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Ndërto Fjali</h1>
                  <p className="text-gray-600">Ndërto fjali duke rregulluar fjalët në rendin e saktë</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Level Filter - Same style as Listen */}
        <div className="bg-white border border-orange-100 p-4 rounded-2xl mb-4 shadow-lg flex-shrink-0">
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
                      ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white border-orange-500 shadow-orange-500/30"
                      : getLevelColor(level) + " border-2"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
                }`}
              >
                {level === "all" ? "Të gjitha" : level}
              </button>
            ))}
          </div>
        </div>

        {/* Quiz List */}
        <SentenceList
          level={selectedLevel}
          onSelectQuiz={(quizId, title) => {
            setSelectedQuizId(quizId);
            setQuizTitle(title);
          }}
        />
      </div>
    </div>
  );
}

// Quiz Component
export function SentenceQuiz({ quizId, quizTitle, selectedLevel, onComplete, onBack }) {
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

  // Fetch quiz data
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await sentenceService.getSentenceById(quizId);
        const quizData = response.data?.data || response.data || response;
        setQuiz(quizData);

        // Initialize first question's available words
        if (quizData.questions && quizData.questions.length > 0) {
          const shuffled = [...quizData.questions[0].options].sort(() => Math.random() - 0.5);
          setAvailableWords(shuffled);
        }
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Dështoi ngarkimi i kuizit");
        setLoading(false);
      }
    };

    if (quizId) {
      fetchQuiz();
    } else {
      setLoading(false);
      setError("Asnjë kuiz nuk u zgjodh");
    }
  }, [quizId]);

  const currentQuestion = quiz?.questions?.[currentQuestionIndex];
  const totalQuestions = quiz?.questions?.length || 0;

  const handleWordSelect = (word, index) => {
    setSelectedWords([...selectedWords, word]);
    setAvailableWords(availableWords.filter((_, i) => i !== index));
  };

  const handleWordRemove = (word, index) => {
    setAvailableWords([...availableWords, word]);
    setSelectedWords(selectedWords.filter((_, i) => i !== index));
  };

  const handleCheckAnswer = () => {
    const userAnswer = selectedWords.join(" ");
    const newAnswers = [...answers, userAnswer];
    setAnswers(newAnswers);

    if (currentQuestionIndex < totalQuestions - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setSelectedWords([]);
      const shuffled = [...quiz.questions[nextIndex].options].sort(() => Math.random() - 0.5);
      setAvailableWords(shuffled);
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
      
      // Show XP animation if passed
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
    const shuffled = [...quiz.questions[0].options].sort(() => Math.random() - 0.5);
    setAvailableWords(shuffled);
    setAnswers([]);
    setResults(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" style={{ backgroundColor: '#FFF8F0' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" style={{ borderColor: '#F97316', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4" style={{ backgroundColor: '#FFF8F0' }}>
        <div className="text-red-500 text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>{error}</div>
        <button
          onClick={onBack}
          className="px-6 py-2 rounded-lg transition-colors"
          style={{ backgroundColor: '#666', color: '#fff', fontFamily: 'Inter, sans-serif' }}
        >
          Kthehu
        </button>
      </div>
    );
  }

  // Results screen - After Quiz Summary
  if (results) {
    const correctCount = results.correctCount || 0;
    const incorrectCount = totalQuestions - correctCount;

    return (
      <div className="min-h-screen p-4 flex flex-col">
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
                className="bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 px-8 py-6 rounded-2xl shadow-2xl border-2 border-orange-500"
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(249, 115, 22, 0.3)",
                    "0 0 40px rgba(249, 115, 22, 0.5)",
                    "0 0 20px rgba(249, 115, 22, 0.3)"
                  ]
                }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                  >
                    <Star className="h-10 w-10 text-orange-600" />
                  </motion.div>
                  <div>
                    <div className="text-3xl font-bold">+{xpGained} XP</div>
                    <div className="text-sm font-medium">Urime!</div>
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    <Zap className="h-10 w-10 text-orange-600" />
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-6xl mx-auto w-full">
          {/* Header - Same style as Listen page */}
          <header className="mb-4 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-xl border border-orange-100 p-6 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full transform translate-x-16 -translate-y-16 opacity-50" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-amber-100 to-orange-100 rounded-full transform -translate-x-8 translate-y-8 opacity-50" />
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{quizTitle || quiz?.title || "Ndërto Fjali"}</h1>
                    <p className="text-gray-600">Rezultatet e kuizit</p>
                  </div>
                  <button
                    onClick={onComplete || onBack}
                    className="text-orange-600 hover:text-orange-700 p-1 transition-colors"
                    aria-label="Kthehu te Kuizet"
                  >
                    <LogOut className="h-5 w-5 sm:h-6 sm:w-6 cursor-pointer" />
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Level Filter - Same style as Listen page but disabled/display only */}
          {/* <div className="bg-white border border-orange-100 p-4 rounded-2xl mb-4 shadow-lg flex-shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-semibold text-gray-800">Niveli</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-orange-500 to-amber-600 text-white border border-orange-500 shadow-orange-500/30">
                {quiz?.level || selectedLevel || "A1"}
              </span>
            </div>
          </div> */}

          {/* Results Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl border border-orange-100 p-6 mb-4"
          >
            <div className="text-center mb-6">
              <div className="text-6xl mb-4" style={{ color: results.passed ? '#22c55e' : '#ef4444' }}>
                {results.passed ? "🎉" : "💪"}
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#1a1a2e', fontFamily: 'Poppins, sans-serif' }}>
                {results.passed ? "Shkëlqyeshëm!" : "Vazhdo të Praktikosh!"}
              </h2>
              <p className="text-gray-600">{results.message}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="rounded-xl p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                <div className="flex items-center justify-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <div className="text-2xl font-bold text-green-600">{correctCount}</div>
                </div>
                <div className="text-sm text-gray-600 text-center mt-1">Saktë</div>
              </div>
              <div className="rounded-xl p-4 bg-gradient-to-br from-red-50 to-rose-50 border border-red-200">
                <div className="flex items-center justify-center gap-2">
                  <X className="w-5 h-5 text-red-600" />
                  <div className="text-2xl font-bold text-red-600">{incorrectCount}</div>
                </div>
                <div className="text-sm text-gray-600 text-center mt-1">Gabim</div>
              </div>
              <div className="rounded-xl p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200">
                <div className="text-2xl font-bold text-blue-600 text-center">{results.accuracy}%</div>
                <div className="text-sm text-gray-600 text-center mt-1">Saktësia</div>
              </div>
              <div className="rounded-xl p-4 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200">
                <div className="flex items-center justify-center gap-1">
                  <Star className="w-5 h-5 text-orange-600" />
                  <div className="text-2xl font-bold text-orange-600">+{results.xpAwarded || 0}</div>
                </div>
                <div className="text-sm text-gray-600 text-center mt-1">XP Fituar</div>
              </div>
            </div>

            {/* Detailed Results */}
             <div className="space-y-3 mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Rezultatet e Detajuara:</h3>
              {results.results?.map((result, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-xl border-2 ${
                    result.isCorrect 
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300' 
                      : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-full ${result.isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                      {result.isCorrect 
                        ? <Check className="w-4 h-4 text-green-600" />
                        : <X className="w-4 h-4 text-red-600" />
                      }
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-500 mb-1">Pyetja {index + 1}</div>
                      <div className="font-medium text-gray-900 mb-2">{result.question}</div>
                      <div className="text-sm">
                        <span className="text-gray-500">Përgjigja jote: </span>
                        <span className={result.isCorrect ? 'text-green-700' : 'text-red-700'}>
                          {result.userAnswer || "(bosh)"}
                        </span>
                      </div>
                      {!result.isCorrect && (
                        <div className="text-sm mt-1">
                          <span className="text-gray-500">Përgjigja e saktë: </span>
                          <span className="text-green-700 font-medium">{result.correctAnswer}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div> 

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <motion.button
                onClick={handleRetry}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/30 hover:from-orange-600 hover:to-amber-700 transition-all"
              >
                Provo Përsëri
              </motion.button>
              <motion.button
                onClick={onComplete || onBack}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-6 py-3 rounded-xl font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all border border-gray-200"
              >
                Kthehu te Kuizet
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Quiz screen
  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#FFF8F0', fontFamily: 'Poppins, sans-serif' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="p-2 transition-colors rounded-lg"
            style={{ color: '#666' }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex-1 mx-4">
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#e5e7eb' }}>
              <div
                className="h-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`, backgroundColor: '#F97316' }}
              />
            </div>
          </div>

          <div className="text-sm" style={{ color: '#666', fontFamily: 'Inter, sans-serif' }}>
            {currentQuestionIndex + 1} / {totalQuestions}
          </div>
        </div>

        {/* Quiz Info */}
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold mb-2" style={{ color: '#1a1a2e', fontFamily: 'Poppins, sans-serif' }}>{quiz?.title}</h1>
          <div className="flex items-center justify-center gap-4 text-sm">
            <span className="px-3 py-1 rounded-full" style={{ backgroundColor: '#eff6ff', color: '#3b82f6', fontFamily: 'Inter, sans-serif' }}>
              Niveli: {quiz?.level}
            </span>
            <span className="px-3 py-1 rounded-full" style={{ backgroundColor: '#FFF7ED', color: '#F97316', fontFamily: 'Inter, sans-serif' }}>
              +{quiz?.xp} XP
            </span>
          </div>
        </div>

        {/* Question */}
        <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <p className="text-sm mb-2" style={{ color: '#666', fontFamily: 'Inter, sans-serif' }}>Përkthe këtë fjali:</p>
          <h2 className="text-xl font-medium" style={{ color: '#1a1a2e', fontFamily: 'Poppins, sans-serif' }}>{currentQuestion?.question}</h2>
        </div>

        {/* Selected words (user's answer) */}
        <div className="rounded-2xl p-4 mb-6 min-h-[80px]" style={{ backgroundColor: '#fff', border: '2px dashed #e5e7eb' }}>
          <div className="flex flex-wrap gap-2">
            {selectedWords.length === 0 ? (
              <p className="text-sm" style={{ color: '#999', fontFamily: 'Inter, sans-serif' }}>Kliko fjalët më poshtë për të formuar fjali...</p>
            ) : (
              selectedWords.map((word, index) => (
                <button
                  key={`selected-${index}`}
                  onClick={() => handleWordRemove(word, index)}
                  className="px-4 py-2 rounded-lg font-medium transition-colors"
                  style={{ backgroundColor: '#F97316', color: '#fff', fontFamily: 'Inter, sans-serif' }}
                >
                  {word}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Available words (options) */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {availableWords.map((word, index) => (
            <button
              key={`available-${index}`}
              onClick={() => handleWordSelect(word, index)}
              className="px-4 py-2 rounded-lg font-medium transition-colors"
              style={{ backgroundColor: '#fff', color: '#333', border: '1px solid #e5e7eb', fontFamily: 'Inter, sans-serif' }}
            >
              {word}
            </button>
          ))}
        </div>

        {/* Check button */}
        <button
          onClick={handleCheckAnswer}
          disabled={selectedWords.length === 0 || isSubmitting}
          className="w-full py-4 rounded-xl font-bold text-lg transition-colors"
          style={{
            backgroundColor: selectedWords.length === 0 ? '#e5e7eb' : '#F97316',
            color: selectedWords.length === 0 ? '#999' : '#fff',
            cursor: selectedWords.length === 0 ? 'not-allowed' : 'pointer',
            fontFamily: 'Poppins, sans-serif'
          }}
        >
          {isSubmitting
            ? "Duke dërguar..."
            : currentQuestionIndex === totalQuestions - 1
            ? "Përfundo"
            : "Kontrollo"}
        </button>
      </div>
    </div>
  );
}

// Sentence Quiz List Component with Pagination
export function SentenceList({ level, onSelectQuiz }) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [finishedIds, setFinishedIds] = useState([]);
  const itemsPerPage = 30;

  const getLevelColor = (lvl) => {
    switch (lvl) {
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

  // Fetch finished sentences IDs
  useEffect(() => {
    const fetchFinished = async () => {
      try {
        const response = await sentenceService.getFinishedSentences();
        const finished = response.data?.data || response.data || response || [];
        const ids = finished.map(s => s._id);
        setFinishedIds(ids);
      } catch (err) {
        // If endpoint doesn't exist yet, just continue
      }
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
          response = await sentenceService.getSentencesByLevel(level);
        } else {
          response = await sentenceService.getAllSentences({ page: currentPage, limit: itemsPerPage });
        }
        
        const data = response.data?.data || response.data || response;
        const quizzesArray = data.sentences || data || [];
        const pagination = data.pagination;
        
        setQuizzes(Array.isArray(quizzesArray) ? quizzesArray : []);
        if (pagination) {
          setTotalPages(pagination.pages || 1);
        } else {
          setTotalPages(Math.ceil((Array.isArray(quizzesArray) ? quizzesArray.length : 0) / itemsPerPage));
        }
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Dështoi ngarkimi i kuizeve");
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [level, currentPage]);

  // Reset page when level changes
  useEffect(() => {
    setCurrentPage(1);
  }, [level]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-t-transparent" style={{ borderColor: '#F97316', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-8" style={{ color: '#ef4444', fontFamily: 'Inter, sans-serif' }}>{error}</div>;
  }

  if (quizzes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📝</div>
        <p className="text-lg" style={{ color: '#666', fontFamily: 'Poppins, sans-serif' }}>Asnjë kuiz nuk është i disponueshëm</p>
        <p className="text-sm mt-2" style={{ color: '#999', fontFamily: 'Inter, sans-serif' }}>Kontrollo më vonë për ushtrime të reja të ndërtimit të fjalive</p>
      </div>
    );
  }

  return (
    <div>
      {/* Grid with 3 boxes per row - same style as Listen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {quizzes.map((quiz) => {
          const isFinished = finishedIds.includes(quiz._id) || quiz.isCompleted;
          return (
            <div
              key={quiz._id}
              onClick={() => onSelectQuiz(quiz._id, quiz.title)}
              className={`p-4 rounded-2xl shadow-lg border-2 transition-all duration-200 cursor-pointer overflow-hidden relative group h-fit hover:-translate-y-1 ${
                isFinished
                  ? "bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-amber-300 hover:border-amber-400"
                  : "bg-white border-gray-100 hover:border-orange-300"
              }`}
            >
              <div
                className={`absolute top-3 right-3 ${getLevelColor(quiz.level)} px-2 py-1 rounded-lg text-xs font-bold shadow-sm border`}
              >
                {quiz.level}
              </div>
              <div className="relative z-10">
                <h3
                  className={`text-sm font-bold mb-2 pr-14 truncate ${
                    isFinished
                      ? "text-amber-700 group-hover:text-amber-800"
                      : "text-gray-800 group-hover:text-orange-700"
                  }`}
                >
                  {quiz.title}
                </h3>
                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                  <span className={`text-xs font-medium ${isFinished ? "text-amber-500" : "text-gray-400"}`}>
                    {quiz.questions?.length || 0} pyetje
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shadow-sm border border-orange-200">
                      <Star className="h-3 w-3" />
                      {quiz.xp || 10}
                    </span>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-semibold shadow-sm ${
                        isFinished
                          ? "bg-gradient-to-r from-amber-400 to-orange-400 text-white"
                          : "bg-gradient-to-r from-orange-500 to-amber-500 text-white"
                      }`}
                    >
                      {isFinished ? "✓ Kryer" : "Fillo"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: currentPage === 1 ? '#e5e7eb' : '#F97316',
              color: currentPage === 1 ? '#999' : '#fff',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Mbrapa
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className="w-10 h-10 rounded-lg font-medium transition-colors"
                  style={{
                    backgroundColor: currentPage === pageNum ? '#F97316' : '#fff',
                    color: currentPage === pageNum ? '#fff' : '#333',
                    border: '1px solid #e5e7eb',
                    fontFamily: 'Inter, sans-serif'
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: currentPage === totalPages ? '#e5e7eb' : '#F97316',
              color: currentPage === totalPages ? '#999' : '#fff',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Para
          </button>
        </div>
      )}
    </div>
  );
}