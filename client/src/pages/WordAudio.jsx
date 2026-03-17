"use client";
import { useState, useEffect, useRef } from "react";
import { wordAudioService, ttsService } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Lock, Star, LogOut, Volume, Check, X } from "lucide-react";

async function speakGerman(text, setId, wordIndex, level) {
  try {
    const url = await ttsService.getWordAudioAudio(setId, wordIndex, text, level);
    const audio = new Audio(url);
    audio.play();
  } catch (error) {
    console.error("Failed to play audio:", error);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "de-DE";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }
}

const getLevelColor = (level) => {
  switch (level) {
    case "A1": return "bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 border-emerald-200";
    case "A2": return "bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-600 border-blue-200";
    case "B1": return "bg-gradient-to-br from-violet-50 to-purple-50 text-violet-600 border-violet-200";
    case "B2": return "bg-gradient-to-br from-amber-50 to-orange-50 text-amber-600 border-amber-200";
    default:   return "bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 border-emerald-200";
  }
};

const levels = ["all", "A1", "A2", "B1", "B2"];

// German Flag Component
function GermanFlag({ size = 16 }) {
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 5 3" className="rounded-sm shadow-sm flex-shrink-0">
      <rect width="5" height="1" y="0" fill="#000000"/>
      <rect width="5" height="1" y="1" fill="#DD0000"/>
      <rect width="5" height="1" y="2" fill="#FFCC00"/>
    </svg>
  );
}

// Albanian Flag Component
function AlbanianFlag({ size = 16 }) {
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 140 100" className="rounded-sm shadow-sm flex-shrink-0">
      <rect width="140" height="100" fill="#E41E20"/>
      <g transform="translate(70,50)">
        <path d="M0,-35 L5,-25 L15,-25 L7,-17 L10,-7 L0,-13 L-10,-7 L-7,-17 L-15,-25 L-5,-25 Z" fill="#000000" transform="scale(0.8)"/>
        <ellipse cx="0" cy="5" rx="18" ry="12" fill="#000000"/>
        <ellipse cx="-12" cy="-5" rx="6" ry="8" fill="#000000"/>
        <ellipse cx="12" cy="-5" rx="6" ry="8" fill="#000000"/>
      </g>
    </svg>
  );
}

function PaywallModal({ onClose }) {
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
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="bg-white rounded-3xl shadow-2xl border-2 border-emerald-200 p-8 max-w-sm w-full text-center"
          onClick={e => e.stopPropagation()}
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 flex items-center justify-center mx-auto mb-5">
            <Crown className="h-10 w-10 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Limit i Arritur</h2>
          <p className="text-gray-500 text-sm mb-2 leading-relaxed">
            Versioni falas lejon vetëm <span className="font-bold text-emerald-600">3</span> sete të përfunduara.
          </p>
          <p className="text-gray-400 text-xs mb-6 leading-relaxed">
            Kaloni në planin Premium për të pasur akses të pakufizuar në të gjitha setet Word Audio.
          </p>
          <button
            onClick={() => { window.location.href = "/payments"; }}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all border-none cursor-pointer mb-3"
          >
            Shiko Planet Premium
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-50 text-gray-500 rounded-xl font-medium text-sm border border-gray-200 hover:bg-gray-100 transition-all cursor-pointer"
          >
            Mbyll
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function WordAudio() {
  const [sets, setSets] = useState([]);
  const [finishedIds, setFinishedIds] = useState([]);
  const [activeSet, setActiveSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [showPaywall, setShowPaywall] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [freeLimit, setFreeLimit] = useState(3);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = selectedLevel !== "all" ? { level: selectedLevel } : {};
        const [setsRes, finishedRes] = await Promise.all([
          wordAudioService.getAllSets(params),
          wordAudioService.getFinishedSets(),
        ]);

        setSets(setsRes.data || []);

        const finishedData = finishedRes.data || {};
        const ids = finishedData.finishedIds || [];

        setFinishedIds(ids.map((item) => item.setId || item._id || item.toString()));
        setIsPaid(finishedData.isPaid || false);
        setFreeLimit(finishedData.freeLimit || 3);
      } catch (error) {
        console.error("Failed to load sets:", error);
        setSets([]);
        setFinishedIds([]);
      }
      setLoading(false);
    };
    load();
  }, [selectedLevel]);

  const handleFinish = (setId, passed, limitReached) => {
    if (limitReached) {
      setShowPaywall(true);
    } else if (passed && !finishedIds.includes(setId)) {
      setFinishedIds((prev) => [...prev, setId]);
    }
    setActiveSet(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (activeSet) {
    return (
      <QuizScreen
        set={activeSet}
        onFinish={(passed, limitReached) => handleFinish(activeSet._id, passed, limitReached)}
      />
    );
  }

  return (
    <div className="min-h-screen p-4 flex flex-col">
      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}

      <div className="max-w-6xl mx-auto w-full">
        <header className="mb-4 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 p-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full transform translate-x-16 -translate-y-16 opacity-50" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-teal-100 to-emerald-100 rounded-full transform -translate-x-8 translate-y-8 opacity-50" />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Word Match</h1>
                  <p className="text-gray-600">Zgjidh nje fjale dhe zgjidh fjalet Gjermanisht - Shqip</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Teste të përfunduara: {finishedIds.length}
              </p>
            </div>
          </div>
        </header>

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
                    ? level === "all"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-500 shadow-emerald-500/30"
                      : getLevelColor(level) + " border-2"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
                }`}
              >
                {level === "all" ? "Të gjitha" : level}
              </button>
            ))}
          </div>
        </div>

        {sets.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="bg-white rounded-2xl p-8 inline-block border border-gray-100 shadow-xl">
              <h3 className="text-base font-semibold text-gray-800 mb-2">Nuk ka fjale</h3>
              <p className="text-gray-500 text-sm">
                Provoni të zgjidhni nivele të ndryshme ose kontrolloni më vonë
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 flex-1 overflow-y-auto">
            {sets.map((set) => {
              const done = finishedIds.includes(set._id);
              const isLocked = !done && !isPaid && finishedIds.length >= freeLimit;

              return (
                <div
                  key={set._id}
                  onClick={() => {
                    if (isLocked) {
                      setShowPaywall(true);
                    } else {
                      setActiveSet(set);
                    }
                  }}
                  className={`p-4 rounded-2xl shadow-lg border-2 transition-all duration-200 cursor-pointer overflow-hidden relative group h-fit hover:-translate-y-1 ${
                    isLocked
                      ? "bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-amber-300 hover:border-amber-400"
                      : done
                      ? "bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-amber-300 hover:border-amber-400"
                      : "bg-white border-gray-100 hover:border-emerald-300"
                  }`}
                >
                  <div className={`absolute top-3 right-3 ${getLevelColor(set.level)} px-2 py-1 rounded-lg text-xs font-bold shadow-sm border`}>
                    {set.level}
                  </div>

                  {isLocked && !done && (
                    <div className="absolute top-3 left-3 w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-md">
                      <Lock className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div className="relative z-10">
                    <h3 className={`text-sm font-bold mb-2 pr-14 truncate ${
                      isLocked || done ? "text-amber-700 group-hover:text-amber-800" : "text-gray-800 group-hover:text-emerald-700"
                    }`}>
                      {set.title}
                    </h3>
                    <p className={`text-xs line-clamp-2 leading-relaxed ${isLocked || done ? "text-amber-600" : "text-gray-500"}`}>
                      {set.words?.length} fjale për të mësuar
                    </p>
                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                      <span className={`text-xs font-medium ${isLocked || done ? "text-amber-500" : "text-gray-400"}`}>
                        Gjermanisht • Shqip
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shadow-sm border border-emerald-200">
                          <Star className="h-3 w-3" />
                          {set.xp}
                        </span>
                        <span className={`text-xs px-3 py-1 rounded-full font-semibold shadow-sm ${
                          done
                            ? "bg-gradient-to-r from-amber-400 to-orange-400 text-white"
                            : isLocked
                            ? "bg-gradient-to-r from-amber-300 to-orange-300 text-white"
                            : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                        }`}>
                          {done ? "Kryer" : isLocked ? "Premium" : "Fillo"}
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

function QuizScreen({ set, onFinish }) {
  const [matched, setMatched] = useState({});
  const [selectedGerman, setSelectedGerman] = useState(null);
  const [wrongPair, setWrongPair] = useState(null);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);

  const shuffledAlbanianRef = useRef(null);
  if (!shuffledAlbanianRef.current) {
    shuffledAlbanianRef.current = [...set.words].sort(() => Math.random() - 0.5);
  }
  const shuffledAlbanian = shuffledAlbanianRef.current;

  const handleGermanClick = (word, index) => {
    if (matched[word.germanWord]) return;
    setIsSpeaking(word.germanWord);
    speakGerman(word.germanWord, set._id, index, set.level);
    setSelectedGerman(word);
    setTimeout(() => setIsSpeaking(null), 1500);
  };

  const handleAlbanianClick = async (albanianWord) => {
    if (!selectedGerman) return;
    if (Object.values(matched).includes(albanianWord)) return;

    const isCorrect = selectedGerman.albanianWord === albanianWord;

    if (isCorrect) {
      const newMatched = { ...matched, [selectedGerman.germanWord]: albanianWord };
      setMatched(newMatched);
      setSelectedGerman(null);
      setWrongPair(null);

      if (Object.keys(newMatched).length === set.words.length) {
        try {
          const res = await wordAudioService.submitQuiz(set._id, set.words.length, set.words.length);
          const data = res.data || {
            passed: true,
            percentage: 100,
            score: set.words.length,
            totalQuestions: set.words.length,
            xpAwarded: set.xp,
          };
          setResult(data);
          if (data.limitReached) {
            setShowPaywall(true);
          }
        } catch (e) {
          console.error("Failed to submit quiz:", e);
          setResult({
            passed: true,
            percentage: 100,
            score: set.words.length,
            totalQuestions: set.words.length,
            xpAwarded: set.xp,
          });
        }
        setFinished(true);
      }
    } else {
      setWrongPair({ german: selectedGerman.germanWord, albanian: albanianWord });
      setTimeout(() => {
        setWrongPair(null);
        setSelectedGerman(null);
      }, 700);
    }
  };

  if (finished && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 flex items-center justify-center p-4">
        {showPaywall && (
          <PaywallModal onClose={() => {
            setShowPaywall(false);
            onFinish(result.passed, result.limitReached);
          }} />
        )}

        <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 p-8 max-w-sm w-full text-center">
          {result.limitReached ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Limit i Arritur</h2>
              <p className="text-sm text-gray-600 mb-4">
                Ke përfunduar {result.percentage}%, por limiti i seteve falas është arritur.
              </p>
              <p className="text-xs text-gray-500 mb-6">
                Versioni falas lejon vetëm 3 sete. Kaloni në Premium për akses të pakufizuar.
              </p>
              <button
                onClick={() => { window.location.href = "/payments"; }}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all mb-2"
              >
                Shiko Planet Premium
              </button>
              <button
                onClick={() => onFinish(result.passed, result.limitReached)}
                className="w-full py-2.5 bg-gray-50 text-gray-600 rounded-xl font-medium text-sm border border-gray-200 hover:bg-gray-100 transition-all"
              >
                Kthehu ne faqen kryesore
              </button>
            </>
          ) : (
            <>
              <div className="text-5xl mb-4">&#127881;</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {result.passed ? "Kaluat!" : "Provo perseri!"}
              </h2>
              <p className="text-4xl font-bold text-emerald-600 mb-4">
                {result.percentage}%
              </p>
              {result.xpAwarded > 0 && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-3 mb-6">
                  <p className="text-emerald-700 font-bold text-lg">+{result.xpAwarded} XP</p>
                </div>
              )}
              {result.alreadyFinished && (
                <p className="text-xs text-gray-500 mb-4">Kjo ushtrim është përfunduar më parë</p>
              )}
              <button
                onClick={() => onFinish(result.passed, false)}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all"
              >
                Kthehu te fjalet
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const progressPercent = (Object.keys(matched).length / set.words.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 p-3 max-w-4xl mx-auto">
          <button
            onClick={() => onFinish(false, false)}
            className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-all"
          >
            <LogOut className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-gray-900 text-sm truncate">{set.title}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">{set.level}</span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-amber-600 font-medium">{set.xp} XP</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-700">{Object.keys(matched).length}/{set.words.length}</span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Instruction banner */}
      <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-b border-amber-200/50 py-2.5 px-4">
        <p className="text-xs text-amber-700 font-medium text-center flex items-center justify-center gap-2">
          <Volume className="h-3.5 w-3.5" />
          <span>Kliko fjalen Gjermanisht per ta degjuar, pastaj gjej perkthimin Shqip</span>
        </p>
      </div>

      {/* Quiz Content */}
      <div className="flex-1 p-4 max-w-4xl mx-auto w-full">
        <div className="flex flex-row gap-4 h-full">
          {/* German Column - LEFT */}
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            <div className="flex items-center justify-center gap-2 mb-2 py-2 bg-gray-900 rounded-xl">
              <GermanFlag size={18} />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Gjermanisht</span>
            </div>
            <div className="flex flex-col gap-2">
              {set.words.map((word, idx) => {
                const isMatched = !!matched[word.germanWord];
                const isSelected = selectedGerman?.germanWord === word.germanWord;
                const isWrong = wrongPair?.german === word.germanWord;
                const speaking = isSpeaking === word.germanWord;

                return (
                  <motion.button
                    key={`ger-${idx}`}
                    onClick={() => handleGermanClick(word, idx)}
                    disabled={isMatched}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full px-3 py-2.5 rounded-xl border-2 font-semibold text-xs transition-all flex items-center gap-2 ${
                      isMatched
                        ? "bg-emerald-50 border-emerald-200 text-emerald-600 opacity-60"
                        : isWrong
                        ? "bg-red-50 border-red-300 text-red-600 animate-pulse"
                        : isSelected
                        ? "bg-gradient-to-r from-gray-400 to-gray-800 text-white shadow-lg shadow-gray-900/20"
                        : "bg-white border-gray-200 text-gray-700 hover:border-gray-900 hover:shadow-md cursor-pointer"
                    } ${speaking ? "ring-2 ring-amber-40 ring-offset-1" : ""}`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isMatched ? "bg-emerald-100" : isSelected ? "bg-white/20" : "bg-gray-100"
                    }`}>
                      {isMatched ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600 font-bold" />
                      ) : (
                        <Volume className={`h-3.5 w-3.5 ${isSelected ? "text-white" : "text-gray-800"}`} />
                      )}
                    </div>
                    <GermanFlag size={14} />
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Albanian Column - RIGHT */}
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            <div className="flex items-center justify-center gap-2 mb-2 py-2 bg-red-600 rounded-xl">
              <AlbanianFlag size={18} />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Shqip</span>
            </div>
            <div className="flex flex-col gap-2">
              {shuffledAlbanian.map((word, idx) => {
                const isMatched = Object.values(matched).includes(word.albanianWord);
                const isWrong = wrongPair?.albanian === word.albanianWord;

                return (
                  <motion.button
                    key={`alb-${idx}`}
                    onClick={() => handleAlbanianClick(word.albanianWord)}
                    disabled={isMatched}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full px-3 py-2.5 rounded-xl border-2 font-bold text-xm transition-all flex items-center gap-2 ${
                      isMatched
                        ? "bg-green-200 border-emerald-700 font-bold opacity-60"
                        : isWrong
                        ? "bg-red-50 border-red-500 text-red-600 animate-pulse"
                        : selectedGerman
                        ? "bg-white border-red-200 text-gray-700 hover:border-red-500 hover:bg-red-50 cursor-pointer hover:shadow-md"
                        : "bg-gray-50 border-gray-200 text-gray-400"
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isMatched ? "bg-emerald-100" : selectedGerman ? "bg-red-100" : "bg-gray-100"
                    }`}>
                      {isMatched ? (
                        <Check className="h-3.5 w-3.5 text-green-800 font-bold" />
                      ) : isWrong ? (
                        <X className="h-3.5 w-3.5 text-red-500" />
                      ) : (
                        <AlbanianFlag size={18} />
                      )}
                    </div>
                    <span className="flex-1 text-left truncate">{word.albanianWord}</span>
                    
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
