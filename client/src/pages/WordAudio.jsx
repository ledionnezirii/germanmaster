"use client";
import { useState, useEffect, useRef } from "react";
import { wordAudioService, ttsService } from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Lock, Star, LogOut, Volume, Check, X, Zap } from "lucide-react";

async function speakGerman(text, setId, wordIndex, level, language = "de") {
  try {
    const url = await ttsService.getWordAudioAudio(setId, wordIndex, text, level, language);
    const audio = new Audio(url);
    audio.play();
  } catch (error) {
    console.error("Failed to play audio:", error);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const langMap = { de: "de-DE", en: "en-GB", fr: "fr-FR", tr: "tr-TR", it: "it-IT" };
      utterance.lang = langMap[language] || "de-DE";
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
            Versioni falas lejon vetëm <span className="font-bold text-emerald-600">5</span> sete të përfunduara.
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
  const { language } = useLanguage();
  const [sets, setSets] = useState([]);
  const [finishedIds, setFinishedIds] = useState([]);
  const [activeSet, setActiveSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState("A1");
  const [showPaywall, setShowPaywall] = useState(false);
  const [activeMixedQuiz, setActiveMixedQuiz] = useState(false);
  const [showQuizInfo, setShowQuizInfo] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [freeLimit, setFreeLimit] = useState(3);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [setsRes, finishedRes] = await Promise.all([
          wordAudioService.getAllSets({ level: selectedLevel }, language),
          wordAudioService.getFinishedSets(language),
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
  }, [language, selectedLevel]);

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
      <div className="flex items-center justify-center min-h-48">
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

  if (activeMixedQuiz) {
    const finishedSets = sets.filter(s => finishedIds.includes(s._id));
    const allWords = finishedSets.flatMap(s =>
      s.words.map((word, idx) => ({ ...word, setId: s._id, wordIndex: idx, level: s.level }))
    );
    const mixed = [...allWords].sort(() => Math.random() - 0.5).slice(0, 10);
    return (
      <MixedQuizScreen
        words={mixed}
        language={language}
        onFinish={() => setActiveMixedQuiz(false)}
      />
    );
  }

  return (
    <div className="min-h-screen p-4 flex flex-col">
      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}

      <AnimatePresence>
        {showQuizInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowQuizInfo(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="bg-white rounded-3xl shadow-2xl border-2 border-pink-200 p-8 max-w-sm w-full text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-300 flex items-center justify-center mx-auto mb-5">
                <Zap className="h-10 w-10 text-pink-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Quiz Mikst</h2>
              <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                Ky quiz mikson fjalët nga <span className="font-bold text-pink-600">të gjitha setet</span> që ke përfunduar dhe të sfidon t'i bashkosh sërish — por të perziera!
              </p>
              <p className="text-gray-400 text-xs mb-3 leading-relaxed">
                {finishedIds.length === 0
                  ? "Nuk ke përfunduar asnjë set akoma. Fillo me setet e nivelit tënd dhe kthehu këtu!"
                  : "Ke përfunduar vetëm 1 set. Duhet të paktën 1 set tjetër për të filluar Quiz Mikst."}
              </p>
              <p className="text-gray-400 text-xs mb-6 leading-relaxed">
                Minimumi i kërkuar: <span className="font-bold text-gray-600">2 sete</span> të përfunduara.
              </p>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
                <div
                  className="bg-gradient-to-r from-pink-400 to-rose-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((finishedIds.length / 2) * 100, 100)}%` }}
                />
              </div>
              <button
                onClick={() => setShowQuizInfo(false)}
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all border-none cursor-pointer"
              >
                Kuptova!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto w-full">
        <header className="mb-4 flex-shrink-0">
          <div style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 24,
            background: "linear-gradient(135deg, #9d174d 0%, #db2777 40%, #ec4899 75%, #f9a8d4 100%)",
            borderRadius: 20,
            padding: isMobile ? "20px" : "28px 32px",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
            <div style={{ position: "absolute", bottom: -60, right: 80, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

            <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                <Volume size={14} />
                Praktikë Gjuhësore
              </div>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 28 : 38, fontWeight: 400, color: "#fff", letterSpacing: -0.5, lineHeight: 1.1, margin: "0 0 8px" }}>
                Bashko Fjalet
              </h1>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", margin: 0, maxWidth: 380, lineHeight: 1.5 }}>
                Zgjidh nje fjale dhe zgjidh fjalet {(LANG_CONFIG[language] || LANG_CONFIG.de).name} - Shqip
              </p>
            </div>

            <div style={{ display: "flex", gap: 12, flexShrink: 0, position: "relative", zIndex: 1, alignSelf: "center", width: isMobile ? "100%" : "auto" }}>
              {(() => {
                const canQuiz = finishedIds.length >= 2;
                const mixedLocked = !isPaid;
                return (
                  <button
                    onClick={() => mixedLocked ? setShowPaywall(true) : canQuiz ? setActiveMixedQuiz(true) : setShowQuizInfo(true)}
                    style={{
                      background: mixedLocked ? "rgba(0,0,0,0.2)" : canQuiz ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)",
                      border: `1px solid ${mixedLocked ? "rgba(255,255,255,0.15)" : canQuiz ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.1)"}`,
                      borderRadius: 14,
                      padding: "14px 18px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      cursor: "pointer",
                      flex: isMobile ? 1 : "unset",
                      transition: "background 0.2s",
                      opacity: mixedLocked ? 0.7 : canQuiz ? 1 : 0.6,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.3)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = mixedLocked ? "rgba(0,0,0,0.2)" : canQuiz ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"; }}
                  >
                    <div style={{ width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "rgba(255,255,255,0.2)" }}>
                      {mixedLocked ? <Crown size={16} color="rgba(255,215,0,0.9)" /> : canQuiz ? <Zap size={16} color="#fff" /> : <Lock size={16} color="rgba(255,255,255,0.7)" />}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1, marginBottom: 2 }}>Quiz Mikst</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                        {mixedLocked ? "Premium" : canQuiz ? "Fillo tani" : `${finishedIds.length}/2 sete`}
                      </div>
                    </div>
                  </button>
                );
              })()}
            </div>
          </div>
        </header>

        <div className="bg-white border border-emerald-100 p-4 rounded-2xl mb-4 shadow-lg flex-shrink-0">
          <div className="flex flex-wrap gap-2">
            {["A1", "A2", "B1", "B2"].map((level) => (
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
                    done
                      ? "bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-amber-300 hover:border-amber-400"
                      : isLocked
                      ? "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:border-gray-300"
                      : "bg-white border-gray-100 hover:border-emerald-300"
                  }`}
                >
                  <div className={`absolute top-3 right-3 ${getLevelColor(set.level)} px-2 py-1 rounded-lg text-xs font-bold shadow-sm border`}>
                    {set.level}
                  </div>

                  {isLocked && (
                    <div className="absolute top-3 left-3 z-20">
                      <Lock className="w-4 h-4 text-gray-400" />
                    </div>
                  )}

                  <div className="relative z-10">
                    <h3 className={`text-sm font-bold mb-2 pr-14 truncate ${
                      done ? "text-amber-700 group-hover:text-amber-800" : isLocked ? "text-gray-400" : "text-gray-800 group-hover:text-emerald-700"
                    }`}>
                      {set.title}
                    </h3>
                    <p className={`text-xs line-clamp-2 leading-relaxed ${done ? "text-amber-600" : isLocked ? "text-gray-300" : "text-gray-500"}`}>
                      {set.words?.length} fjale për të mësuar
                    </p>
                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                      <span className={`text-xs font-medium ${done ? "text-amber-500" : isLocked ? "text-gray-300" : "text-gray-400"}`}>
                        {(LANG_CONFIG[language] || LANG_CONFIG.de).name} • Shqip
                      </span>
                      <div className="flex items-center gap-2">
                        {!isLocked && (
                          <span className="text-xs bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shadow-sm border border-emerald-200">
                            <Star className="h-3 w-3" />
                            {set.xp}
                          </span>
                        )}
                        <span className={`text-xs px-3 py-1 rounded-full font-semibold shadow-sm ${
                          done
                            ? "bg-gradient-to-r from-amber-400 to-orange-400 text-white"
                            : isLocked
                            ? "bg-gray-200 text-gray-400"
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

const LANG_CONFIG = {
  de: { name: "Gjermanisht", flag: "https://flagcdn.com/w40/de.png", speechLang: "de-DE" },
  en: { name: "Anglisht",    flag: "https://flagcdn.com/w40/gb.png", speechLang: "en-GB" },
  fr: { name: "Frëngjisht",  flag: "https://flagcdn.com/w40/fr.png", speechLang: "fr-FR" },
  tr: { name: "Turqisht",    flag: "https://flagcdn.com/w40/tr.png", speechLang: "tr-TR" },
  it: { name: "Italisht",    flag: "https://flagcdn.com/w40/it.png", speechLang: "it-IT" },
}

function QuizScreen({ set, onFinish }) {
  const { language } = useLanguage();
  const langConfig = LANG_CONFIG[set.language] || LANG_CONFIG[language] || LANG_CONFIG.de;
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
    speakGerman(word.germanWord, set._id, index, set.level, language);
    setSelectedGerman(word);
    setTimeout(() => setIsSpeaking(null), 2000);
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

  const SoundWave = () => {
    const bars = [0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8, 0.4];
    return (
      <span className="flex items-center gap-px ml-auto">
        {bars.map((h, i) => (
          <motion.span
            key={i}
            className="block w-[3px] rounded-full bg-white/90"
            animate={{ scaleY: [h * 0.4, h, h * 0.5, h * 0.9, h * 0.3] }}
            transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.07 }}
            style={{ height: 14, transformOrigin: "center" }}
          />
        ))}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50/30 flex flex-col">
      {/* Slim top bar */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2 max-w-4xl mx-auto w-full">
        <button
          onClick={() => onFinish(false, false)}
          className="w-8 h-8 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all shadow-sm flex-shrink-0"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
        {/* Progress bar */}
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 flex-shrink-0">
          {Object.keys(matched).length}/{set.words.length}
        </span>
      </div>

      {/* Quiz Content */}
      <div className="flex-1 px-3 pb-3 max-w-4xl mx-auto w-full">
        <div className="flex flex-row gap-2.5 h-full">
          {/* Language Column - LEFT */}
          <div className="flex-1 flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl shadow-sm mb-1">
              <img src={langConfig.flag} alt="" style={{ width: 16, height: 11, borderRadius: 2 }} />
              <span className="text-xs font-bold text-white uppercase tracking-wider">{langConfig.name}</span>
            </div>
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
                  whileTap={{ scale: 0.96 }}
                  className={`w-full px-2.5 py-2 rounded-xl border-2 font-semibold text-xs transition-all duration-200 flex items-center gap-2 relative overflow-hidden ${
                    isMatched
                      ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 text-emerald-600"
                      : isWrong
                      ? "bg-red-50 border-red-400 text-red-600"
                      : speaking
                      ? "bg-gradient-to-r from-amber-400 to-orange-400 border-amber-300 text-white shadow-md shadow-amber-400/40"
                      : isSelected
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 border-blue-400 text-white shadow-md shadow-blue-500/30"
                      : "bg-white border-gray-200 text-gray-700 hover:border-sky-400 hover:shadow-sm cursor-pointer"
                  }`}
                >
                  {speaking && (
                    <motion.span
                      className="absolute inset-0 rounded-xl border-2 border-amber-200"
                      initial={{ opacity: 0.8, scale: 1 }}
                      animate={{ opacity: 0, scale: 1.06 }}
                      transition={{ duration: 0.65, repeat: Infinity, ease: "easeOut" }}
                    />
                  )}
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isMatched ? "bg-emerald-100" : speaking ? "bg-white/25" : isSelected ? "bg-white/20" : "bg-gray-100"
                  }`}>
                    {isMatched ? (
                      <Check className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <Volume className={`h-3 w-3 ${isSelected || speaking ? "text-white" : "text-gray-600"}`} />
                    )}
                  </div>
                  <img src={langConfig.flag} alt="" style={{ width: 13, height: 9, borderRadius: 2, flexShrink: 0 }} />
                  {speaking && <SoundWave />}
                </motion.button>
              );
            })}
          </div>

          {/* Albanian Column - RIGHT */}
          <div className="flex-1 flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-sm mb-1">
              <AlbanianFlag size={16} />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Shqip</span>
            </div>
            {shuffledAlbanian.map((word, idx) => {
              const isMatched = Object.values(matched).includes(word.albanianWord);
              const isWrong = wrongPair?.albanian === word.albanianWord;

              return (
                <motion.button
                  key={`alb-${idx}`}
                  onClick={() => handleAlbanianClick(word.albanianWord)}
                  disabled={isMatched}
                  whileTap={{ scale: 0.96 }}
                  className={`w-full px-2.5 py-2 rounded-xl border-2 font-semibold text-xs transition-all duration-200 flex items-center gap-2 ${
                    isMatched
                      ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 text-emerald-600"
                      : isWrong
                      ? "bg-red-50 border-red-400 text-red-600 animate-pulse"
                      : selectedGerman
                      ? "bg-white border-red-300 text-gray-700 hover:border-red-500 hover:bg-red-50 cursor-pointer hover:shadow-sm"
                      : "bg-gray-50 border-gray-200 text-gray-400 cursor-default"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isMatched ? "bg-emerald-100" : selectedGerman ? "bg-red-100" : "bg-gray-100"
                  }`}>
                    {isMatched ? (
                      <Check className="h-3 w-3 text-emerald-600" />
                    ) : isWrong ? (
                      <X className="h-3 w-3 text-red-500" />
                    ) : (
                      <AlbanianFlag size={13} />
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
  );
}

function MixedQuizScreen({ words, language, onFinish }) {
  const langConfig = LANG_CONFIG[language] || LANG_CONFIG.de;
  const [matched, setMatched] = useState({});
  const [selectedGerman, setSelectedGerman] = useState(null);
  const [wrongPair, setWrongPair] = useState(null);
  const [finished, setFinished] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(null);

  const shuffledAlbanianRef = useRef(null);
  if (!shuffledAlbanianRef.current) {
    shuffledAlbanianRef.current = [...words].sort(() => Math.random() - 0.5);
  }
  const shuffledAlbanian = shuffledAlbanianRef.current;

  const handleGermanClick = (word, index) => {
    if (matched[word.germanWord]) return;
    setIsSpeaking(word.germanWord);
    speakGerman(word.germanWord, word.setId, word.wordIndex ?? index, word.level, language);
    setSelectedGerman(word);
    setTimeout(() => setIsSpeaking(null), 2000);
  };

  const handleAlbanianClick = async (albanianWord) => {
    if (!selectedGerman) return;
    if (Object.values(matched).includes(albanianWord)) return;

    if (selectedGerman.albanianWord === albanianWord) {
      const newMatched = { ...matched, [selectedGerman.germanWord]: albanianWord };
      setMatched(newMatched);
      setSelectedGerman(null);
      setWrongPair(null);
      if (Object.keys(newMatched).length === words.length) {
        try {
          const res = await wordAudioService.submitMixedQuiz();
          setXpAwarded(res.data?.data?.xpAwarded ?? 10);
        } catch {
          setXpAwarded(10);
        }
        setFinished(true);
      }
    } else {
      setWrongPair({ german: selectedGerman.germanWord, albanian: albanianWord });
      setTimeout(() => { setWrongPair(null); setSelectedGerman(null); }, 700);
    }
  };

  if (finished) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 p-8 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">&#127881;</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Perfekt!</h2>
          <p className="text-sm text-gray-500 mb-4">Ke përfunduar quiz-in mikst me sukses!</p>
          {xpAwarded != null && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-3 mb-6">
              <p className="text-emerald-700 font-bold text-lg">+{xpAwarded} XP</p>
            </div>
          )}
          <button
            onClick={onFinish}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all"
          >
            Kthehu te fjalet
          </button>
        </div>
      </div>
    );
  }

  const progressPercent = (Object.keys(matched).length / words.length) * 100;

  const SoundWave = () => {
    const bars = [0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8, 0.4];
    return (
      <span className="flex items-center gap-px ml-auto">
        {bars.map((h, i) => (
          <motion.span
            key={i}
            className="block w-[3px] rounded-full bg-white/90"
            animate={{ scaleY: [h * 0.4, h, h * 0.5, h * 0.9, h * 0.3] }}
            transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.07 }}
            style={{ height: 14, transformOrigin: "center" }}
          />
        ))}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50/30 flex flex-col">
      <div className="flex items-center gap-2 px-3 pt-3 pb-2 max-w-4xl mx-auto w-full">
        <button
          onClick={onFinish}
          className="w-8 h-8 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all shadow-sm flex-shrink-0"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-pink-500 via-rose-400 to-orange-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 flex-shrink-0">
          {Object.keys(matched).length}/{words.length}
        </span>
      </div>

      <div className="flex-1 px-3 pb-3 max-w-4xl mx-auto w-full">
        <div className="flex flex-row gap-2.5 h-full">
          <div className="flex-1 flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl shadow-sm mb-1">
              <img src={langConfig.flag} alt="" style={{ width: 16, height: 11, borderRadius: 2 }} />
              <span className="text-xs font-bold text-white uppercase tracking-wider">{langConfig.name}</span>
            </div>
            {words.map((word, idx) => {
              const isMatched = !!matched[word.germanWord];
              const isSelected = selectedGerman?.germanWord === word.germanWord;
              const isWrong = wrongPair?.german === word.germanWord;
              const speaking = isSpeaking === word.germanWord;
              return (
                <motion.button
                  key={`mix-ger-${idx}`}
                  onClick={() => handleGermanClick(word, idx)}
                  disabled={isMatched}
                  whileTap={{ scale: 0.96 }}
                  className={`w-full px-2.5 py-2 rounded-xl border-2 font-semibold text-xs transition-all duration-200 flex items-center gap-2 relative overflow-hidden ${
                    isMatched ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 text-emerald-600"
                    : isWrong ? "bg-red-50 border-red-400 text-red-600"
                    : speaking ? "bg-gradient-to-r from-amber-400 to-orange-400 border-amber-300 text-white shadow-md shadow-amber-400/40"
                    : isSelected ? "bg-gradient-to-r from-blue-500 to-cyan-500 border-blue-400 text-white shadow-md shadow-blue-500/30"
                    : "bg-white border-gray-200 text-gray-700 hover:border-sky-400 hover:shadow-sm cursor-pointer"
                  }`}
                >
                  {speaking && (
                    <motion.span
                      className="absolute inset-0 rounded-xl border-2 border-amber-200"
                      initial={{ opacity: 0.8, scale: 1 }}
                      animate={{ opacity: 0, scale: 1.06 }}
                      transition={{ duration: 0.65, repeat: Infinity, ease: "easeOut" }}
                    />
                  )}
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isMatched ? "bg-emerald-100" : speaking ? "bg-white/25" : isSelected ? "bg-white/20" : "bg-gray-100"
                  }`}>
                    {isMatched ? <Check className="h-3 w-3 text-emerald-600" /> : <Volume className={`h-3 w-3 ${isSelected || speaking ? "text-white" : "text-gray-600"}`} />}
                  </div>
                  <img src={langConfig.flag} alt="" style={{ width: 13, height: 9, borderRadius: 2, flexShrink: 0 }} />
                  {speaking && <SoundWave />}
                </motion.button>
              );
            })}
          </div>

          <div className="flex-1 flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-sm mb-1">
              <AlbanianFlag size={16} />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Shqip</span>
            </div>
            {shuffledAlbanian.map((word, idx) => {
              const isMatched = Object.values(matched).includes(word.albanianWord);
              const isWrong = wrongPair?.albanian === word.albanianWord;
              return (
                <motion.button
                  key={`mix-alb-${idx}`}
                  onClick={() => handleAlbanianClick(word.albanianWord)}
                  disabled={isMatched}
                  whileTap={{ scale: 0.96 }}
                  className={`w-full px-2.5 py-2 rounded-xl border-2 font-semibold text-xs transition-all duration-200 flex items-center gap-2 ${
                    isMatched ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 text-emerald-600"
                    : isWrong ? "bg-red-50 border-red-400 text-red-600 animate-pulse"
                    : selectedGerman ? "bg-white border-red-300 text-gray-700 hover:border-red-500 hover:bg-red-50 cursor-pointer hover:shadow-sm"
                    : "bg-gray-50 border-gray-200 text-gray-400 cursor-default"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isMatched ? "bg-emerald-100" : selectedGerman ? "bg-red-100" : "bg-gray-100"
                  }`}>
                    {isMatched ? <Check className="h-3 w-3 text-emerald-600" /> : isWrong ? <X className="h-3 w-3 text-red-500" /> : <AlbanianFlag size={13} />}
                  </div>
                  <span className="flex-1 text-left truncate">{word.albanianWord}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
