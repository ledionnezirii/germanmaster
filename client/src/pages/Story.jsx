import React, { useState, useEffect, useRef, useCallback } from "react";
import { storyService, ttsService, authService } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, ChevronLeft, Star, Zap, TrendingUp,
  Check, X, Volume2, Lock, Crown
} from "lucide-react";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const SCENARIO_CONFIG = {
  restaurant: { label: "Restorant", icon: "utensils" },
  store: { label: "Dyqan", icon: "store" },
  school: { label: "Shkollë", icon: "school" },
  doctor: { label: "Mjek", icon: "doctor" },
  hotel: { label: "Hotel", icon: "hotel" },
  bakery: { label: "Furrë Buke", icon: "bakery" },
  airport: { label: "Aeroport", icon: "airport" },
  train_station: { label: "Stacion Treni", icon: "train" },
  bank: { label: "Bankë", icon: "bank" },
  pharmacy: { label: "Farmaci", icon: "pharmacy" },
  custom: { label: "Dialog", icon: "chat" },
};

function ScenarioIcon({ scenario, size = 20, className = "" }) {
  const paths = {
    restaurant: <><circle cx="12" cy="12" r="10" /><path d="M8 12h8M12 8v4" /></>,
    store: <><path d="M6 2L3 7v13a1 1 0 001 1h16a1 1 0 001-1V7l-3-5z" /><path d="M3 7h18M16 10a4 4 0 01-8 0" /></>,
    school: <><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></>,
    doctor: <><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></>,
    hotel: <><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22V12h6v10M12 6h.01" /></>,
    bakery: <><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" /></>,
    airport: <><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z" /></>,
    train: <><rect x="4" y="3" width="16" height="14" rx="2" /><path d="M4 11h16M12 3v14M4 17l-2 4M20 17l2 4M8 21h8" /></>,
    bank: <><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" /></>,
    pharmacy: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M12 8v8M8 12h8" /></>,
    chat: <><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {paths[scenario] || paths.chat}
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
            Versioni falas lejon vetëm <span className="font-bold text-emerald-600"> 3</span> të përfunduara.
          </p>
          <p className="text-gray-400 text-xs mb-6 leading-relaxed">
            Kaloni në planin Premium për të pasur akses të pakufizuar në të gjithë dialogët.
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

function SpeakerAvatar({ name, isUser }) {
  const initial = (name || "?")[0].toUpperCase();
  return (
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 border ${
      isUser
        ? "bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 border-emerald-200"
        : "bg-gradient-to-br from-slate-50 to-gray-100 text-gray-600 border-gray-200"
    }`}>
      {initial}
    </div>
  );
}

function ChatMessage({ speaker, text, albanianText, isUser, isSpeaking, onSpeak, correct }) {
  const isAnswer = isUser && correct !== undefined;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`flex gap-2.5 mb-1 ${isUser ? "flex-row-reverse ml-auto" : ""}`}
      style={{ maxWidth: "92%" }}
    >
      <SpeakerAvatar name={speaker || (isUser ? "Ti" : "?")} isUser={isUser} />
      <div className="flex-1 min-w-0">
        {speaker && (
          <p className={`text-[11px] font-semibold text-gray-400 mb-1 ${isUser ? "text-right" : "text-left"}`}>
            {speaker}
          </p>
        )}
        <div className={`px-4 py-3 shadow-sm ${
          isUser
            ? isAnswer
              ? correct
                ? "rounded-[16px_16px_4px_16px] bg-gradient-to-br from-emerald-50 to-green-50 border-[1.5px] border-emerald-200 text-emerald-800"
                : "rounded-[16px_16px_4px_16px] bg-gradient-to-br from-red-50 to-rose-50 border-[1.5px] border-red-200 text-red-800"
              : "rounded-[16px_16px_4px_16px] bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
            : "rounded-[16px_16px_16px_4px] bg-white border border-gray-100"
        }`}>
          <p className={`text-sm leading-relaxed m-0 ${isAnswer ? "font-semibold" : ""} ${!isUser && !isAnswer ? "text-gray-800" : ""}`}>
            {text}
          </p>
          {albanianText && (
            <p className={`text-xs mt-1.5 italic leading-snug ${isUser ? "text-white/70" : "text-gray-400"}`}>
              {albanianText}
            </p>
          )}
          {!isUser && onSpeak && (
            <button onClick={onSpeak} disabled={isSpeaking}
              className={`mt-2 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border transition-all ${
                isSpeaking
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                  : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
              }`}>
              <Volume2 className="h-3 w-3" />
              {isSpeaking ? "Duke folur..." : "Dëgjo"}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function FeedbackBadge({ correct, correctAnswer }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 500, delay: 0.1 }}
      className="flex justify-end mb-2 mt-0.5 pr-12"
    >
      <div className={`text-xs font-semibold px-3.5 py-1 rounded-full flex items-center gap-1.5 ${
        correct
          ? "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-600 border border-emerald-200"
          : "bg-gradient-to-r from-red-50 to-rose-50 text-red-600 border border-red-200"
      }`}>
        {correct ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
        {correct ? "Saktë!" : `${correctAnswer}`}
      </div>
    </motion.div>
  );
}

function WordOrderInput({ step, onAnswer }) {
  const [selected, setSelected] = useState([]);
  const [available, setAvailable] = useState([...step.wordChoices]);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const pick = (word, idx) => {
    if (submitted) return;
    setSelected(p => [...p, word]);
    setAvailable(p => p.filter((_, i) => i !== idx));
  };

  const unpick = (word, idx) => {
    if (submitted) return;
    setAvailable(p => [...p, word]);
    setSelected(p => p.filter((_, i) => i !== idx));
  };

  const submit = () => {
    const answer = selected.join(" ");
    const correct = answer.trim().toLowerCase() === step.correctAnswer.trim().toLowerCase();
    setIsCorrect(correct);
    setSubmitted(true);
    onAnswer({ userAnswer: answer, correctAnswer: step.correctAnswer, correct });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="mb-2 ml-12"
    >
      <div className="p-5 rounded-2xl bg-white border-2 border-emerald-100 shadow-lg">
      
        <div className={`min-h-[52px] flex flex-wrap gap-2 p-3.5 rounded-xl mb-3.5 transition-all duration-300 ${
          submitted
            ? isCorrect
              ? "border-2 border-emerald-400 bg-emerald-50/30"
              : "border-2 border-red-400 bg-red-50/30"
            : "border-2 border-dashed border-emerald-200 bg-gradient-to-br from-slate-50 to-emerald-50/20"
        }`}>
          {selected.length === 0 && (
            <span className="text-gray-300 text-sm py-1">{"Kliko fjalët..."}</span>
          )}
          {selected.map((word, i) => (
            <motion.button
              key={`s-${i}`}
              onClick={() => unpick(word, i)}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              className={`px-4 py-2 border-none rounded-xl text-sm font-semibold text-white shadow-md transition-all ${
                submitted
                  ? isCorrect
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                    : "bg-gradient-to-r from-red-500 to-rose-500"
                  : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 cursor-pointer"
              }`}
            >
              {word}
            </motion.button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {available.map((word, i) => (
            <motion.button
              key={`a-${i}`}
              onClick={() => pick(word, i)}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 rounded-xl text-sm font-medium border-[1.5px] border-emerald-200 bg-white text-gray-700 cursor-pointer shadow-sm hover:shadow-md hover:border-emerald-400 hover:text-emerald-700 transition-all"
            >
              {word}
            </motion.button>
          ))}
        </div>
        {!submitted ? (
          <motion.button
            onClick={submit}
            disabled={selected.length === 0}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-3 border-none rounded-xl text-sm font-semibold transition-all ${
              selected.length === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white cursor-pointer shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40"
            }`}
          >
            Kontrollo
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
            className={`py-3 px-4 rounded-xl text-center font-semibold text-sm flex items-center justify-center gap-2 ${
              isCorrect
                ? "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-600 border border-emerald-200"
                : "bg-gradient-to-r from-red-50 to-rose-50 text-red-600 border border-red-200"
            }`}
          >
            {isCorrect ? (
              <><Check className="h-4.5 w-4.5" /> Perfekt!</>
            ) : (
              <><X className="h-4.5 w-4.5" /> {`E saktë: "${step.correctAnswer}"`}</>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function TypingIndicator({ speaker }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2.5 items-start mb-1"
    >
      <SpeakerAvatar name={speaker || "?"} isUser={false} />
      <div>
        {speaker && <p className="text-[11px] font-semibold text-gray-400 mb-1">{speaker}</p>}
        <div className="px-5 py-3.5 bg-white border border-gray-100 rounded-[16px_16px_16px_4px] flex gap-1.5 shadow-sm">
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.16 }}
              className="w-[7px] h-[7px] rounded-full bg-emerald-400 inline-block"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function StoryPlayer({ story, onFinish, onBack }) {
  const [visibleSteps, setVisibleSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [waitingForAnswer, setWaitingForAnswer] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [result, setResult] = useState(null);
  const [canProceed, setCanProceed] = useState(false);
  const [showXpAnimation, setShowXpAnimation] = useState(false);
  const synthRef = useRef(window.speechSynthesis);
  const chatEndRef = useRef(null);
  const voicesRef = useRef([]);

  const step = story.steps[currentStepIndex];
  const isLastStep = currentStepIndex === story.steps.length - 1;
  const config = SCENARIO_CONFIG[story.scenario] || SCENARIO_CONFIG.custom;
  const progress = ((currentStepIndex + 1) / story.steps.length) * 100;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleSteps, showTyping, waitingForAnswer]);

  useEffect(() => {
    const loadVoices = () => {
      voicesRef.current = synthRef.current.getVoices();
    };
    loadVoices();
    synthRef.current.addEventListener("voiceschanged", loadVoices);
    return () => synthRef.current.removeEventListener("voiceschanged", loadVoices);
  }, []);

  const autoAdvance = useCallback((delayMs = 600) => {
    setTimeout(() => {
      setCurrentStepIndex(prev => {
        const nextIndex = prev + 1;
        if (nextIndex >= story.steps.length) {
          setCanProceed(true);
          return prev;
        }
        return nextIndex;
      });
    }, delayMs);
  }, [story.steps.length]);

  const speakText = useCallback(async (text, onEnd, speaker, stepIndex) => {
    if (speaker === "Erzähler") { onEnd?.(); return; }
    setIsSpeaking(true);
    try {
      const url = await ttsService.getStoryAudio(story._id, stepIndex, text, story.level);
      const audio = new Audio(url);
      audio.onended = () => { setIsSpeaking(false); onEnd?.(); };
      audio.onerror = () => { setIsSpeaking(false); onEnd?.(); };
      audio.play();
    } catch (e) {
      console.error("TTS error:", e);
      setIsSpeaking(false);
      onEnd?.();
    }
  }, [story]);

  useEffect(() => {
    if (!step) return;
    if (step.type === "narration" || step.type === "dialogue") {
      setShowTyping(true);
      setCanProceed(false);
      const delay = Math.min(700 + step.germanText.length * 18, 1800);
      const timer = setTimeout(() => {
        setShowTyping(false);
        setVisibleSteps(p => [...p, { ...step, index: currentStepIndex }]);
        speakText(step.germanText, () => {
          autoAdvance(800);
        }, step.speaker, currentStepIndex);
      }, delay);
      return () => clearTimeout(timer);
    }
    if (step.type === "question") {
      setShowTyping(true);
      const timer = setTimeout(() => {
        setShowTyping(false);
        setVisibleSteps(p => [...p, { ...step, index: currentStepIndex }]);
        speakText(step.germanText, () => setWaitingForAnswer(true), step.speaker, currentStepIndex);
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [currentStepIndex]);

  const handleReplay = (text, speaker, stepIndex) => speakText(text, null, speaker, stepIndex);

  const handleAnswer = data => {
    setAnswers(p => [...p, { stepIndex: currentStepIndex, ...data }]);
    setWaitingForAnswer(false);
    setVisibleSteps(p => [...p, {
      type: "user_answer", germanText: data.userAnswer,
      correct: data.correct, correctAnswer: data.correctAnswer,
      index: currentStepIndex,
    }]);
    autoAdvance(1500);
  };

  const handleNext = async () => {
    setCanProceed(false);
    if (isLastStep) {
      const totalQ = story.steps.filter(s => s.type === "question").length;
      const correct = answers.filter(a => a.correct).length;
      const score = totalQ > 0 ? Math.round((correct / totalQ) * 100) : 100;
      const passed = score >= 70;
      setResult({ score, correct, total: totalQ, passed });
      if (passed) { setShowXpAnimation(true); setTimeout(() => setShowXpAnimation(false), 3000); }
      try {
        const token = localStorage.getItem("authToken");
        const res = await fetch("/api/stories/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            storyId: story._id,
            answers: answers.map(a => ({ stepIndex: a.stepIndex, userAnswer: a.userAnswer, correctAnswer: a.correctAnswer })),
            totalQuestions: totalQ,
          }),
        });
        const json = await res.json();
        if (json.data) setResult(p => ({ ...p, xpAwarded: json.data.xpAwarded, alreadyFinished: json.data.alreadyFinished }));
      } catch (e) { console.error("Submit error", e); }
    } else {
      setCurrentStepIndex(p => p + 1);
    }
  };

  if (result) {
    return (
      <div className="h-[750px] bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 p-2 sm:p-4 rounded-xl shadow-lg border-2 border-emerald-200 overflow-hidden">
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
                className="bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 px-8 py-6 rounded-2xl shadow-2xl border-2 border-emerald-500"
                animate={{ boxShadow: ["0 0 20px rgba(16,185,129,0.3)", "0 0 40px rgba(16,185,129,0.5)", "0 0 20px rgba(16,185,129,0.3)"] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <div className="flex items-center gap-3">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, ease: "easeInOut" }}>
                    <Star className="h-10 w-10 text-emerald-600" />
                  </motion.div>
                  <div>
                    <div className="text-3xl font-bold">+{result.xpAwarded || 0} XP</div>
                    <div className="text-sm font-medium">Urime!</div>
                  </div>
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>
                    <Zap className="h-10 w-10 text-emerald-600" />
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col items-center justify-center h-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-white rounded-2xl shadow-xl border-2 border-emerald-200 p-8 sm:p-10 max-w-md w-full text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, delay: 0.2 }}
              className={`w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6 border-2 ${
                result.passed
                  ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-400"
                  : "bg-gradient-to-br from-red-50 to-rose-50 border-red-400"
              }`}
            >
              {result.passed
                ? <Check className="h-11 w-11 text-emerald-600" />
                : <X className="h-11 w-11 text-red-600" />
              }
            </motion.div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {result.passed ? "Shkëlqyeshëm!" : "Pothuajse!"}
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              {result.correct} nga {result.total} përgjigje të sakta
            </p>

            <div className={`text-5xl font-black mb-6 ${result.passed ? "text-emerald-600" : "text-red-600"}`}>
              {result.score}%
            </div>

            {result.passed && !result.alreadyFinished && result.xpAwarded > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 font-bold px-6 py-2.5 rounded-full border border-emerald-200 mb-5 mx-auto w-fit"
              >
                <TrendingUp className="h-5 w-5" />
                +{result.xpAwarded} XP fituar!
              </motion.div>
            )}

            {result.alreadyFinished && (
              <p className="text-xs text-gray-400 italic mb-5">Tashmë e përfunduar</p>
            )}

            <motion.button
              onClick={onFinish}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8 py-3 rounded-xl font-semibold text-sm shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all border-none cursor-pointer"
            >
              Kthehu te Dialogët
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[750px] bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 rounded-xl shadow-lg border-2 border-emerald-200 overflow-hidden flex flex-col">
      <div className="px-4 py-3 bg-white border-b-2 border-emerald-100 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => { synthRef.current.cancel(); onBack(); }}
          className="w-9 h-9 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center text-emerald-600 hover:from-emerald-100 hover:to-teal-100 transition-all cursor-pointer"
        >
          <ChevronLeft className="h-4.5 w-4.5" />
        </button>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-gray-900 truncate leading-tight">{story.title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{config.label} &middot; {story.level}</p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-24 h-[5px] bg-emerald-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <span className="text-xs text-gray-400 font-semibold tabular-nums">
            {currentStepIndex + 1}/{story.steps.length}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {story.scenarioDescription && visibleSteps.length === 0 && !showTyping && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-4 mt-3 mb-1 px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl text-center"
          >
            <p className="text-xs text-emerald-700 m-0 leading-relaxed">{story.scenarioDescription}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {visibleSteps.map((vs, i) => {
          if (vs.type === "user_answer") {
            return (
              <div key={`ua-${i}`}>
                <ChatMessage speaker="Ti" text={vs.germanText} isUser={true}
                  correct={vs.correct} />
                <FeedbackBadge correct={vs.correct} correctAnswer={vs.correctAnswer} />
              </div>
            );
          }
          if (vs.type === "narration") {
            return (
              <motion.div
                key={`n-${i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="flex justify-center mb-2"
              >
                <div className="bg-gradient-to-r from-emerald-500 to-teal-50 border border-red-200 rounded-full px-5 py-2 max-w-[85%]">
                  <p className="text-xs font-bold text-amber-400 text-center m-0 italic leading-relaxed">
                    {vs.germanText}
                  </p>
                  {vs.albanianText && (
                    <p className="text-[10px] text-emerald-500/70 text-center m-0 mt-0.5 italic">
                      {vs.albanianText}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          }
          if (vs.type === "question") {
            return (
              <div key={`q-${i}`}>
                <ChatMessage speaker={vs.speaker} text={vs.germanText}
                  albanianText={vs.albanianText} isUser={false}
                  isSpeaking={isSpeaking && currentStepIndex === vs.index}
                  onSpeak={() => handleReplay(vs.germanText, vs.speaker, vs.index)} />
                {waitingForAnswer && currentStepIndex === vs.index && (
                  <WordOrderInput step={vs} onAnswer={handleAnswer} />
                )}
              </div>
            );
          }
          return (
            <ChatMessage key={`s-${i}`} speaker={vs.speaker} text={vs.germanText}
              albanianText={vs.albanianText} isUser={false}
              isSpeaking={isSpeaking && currentStepIndex === vs.index}
              onSpeak={() => handleReplay(vs.germanText, vs.speaker, vs.index)} />
          );
        })}
        {showTyping && <TypingIndicator speaker={step?.speaker} />}
        <div ref={chatEndRef} />
      </div>

      <div className="px-4 py-3 bg-white border-t-2 border-emerald-100 flex-shrink-0">
        {canProceed && isLastStep && (
          <motion.button
            onClick={handleNext}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-none rounded-xl text-sm font-semibold cursor-pointer shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all"
          >
            Përfundo
          </motion.button>
        )}
        {waitingForAnswer && (
          <p className="text-center text-xs text-gray-400 py-2.5 m-0">
            Formo fjaliën duke klikuar fjalët më lart
          </p>
        )}
        {!waitingForAnswer && !canProceed && (
          <div className="text-center py-2.5">
            {isSpeaking && (
              <div className="flex items-center justify-center gap-2">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map(i => (
                    <motion.span
                      key={i}
                      animate={{ height: [14, 24, 14] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                      className="w-[3px] rounded-full bg-gradient-to-b from-emerald-400 to-teal-500 inline-block"
                      style={{ height: 14 }}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-400">Duke folur...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StoryCard({ story, isFinished, isLocked, onClick }) {
  const config = SCENARIO_CONFIG[story.scenario] || SCENARIO_CONFIG.custom;
  return (
    <motion.div
      onClick={() => onClick(story)}
      whileHover={{ y: -4, boxShadow: isLocked ? "0 8px 30px rgba(0,0,0,0.08)" : "0 8px 30px rgba(16,185,129,0.12)" }}
      whileTap={{ scale: 0.98 }}
      className={`relative cursor-pointer rounded-2xl border-2 overflow-hidden transition-all group ${
        isLocked
          ? "bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200 hover:border-gray-300"
          : isFinished
            ? "bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-amber-300 hover:border-amber-400"
            : "bg-white border-gray-100 hover:border-emerald-300"
      }`}
    >
      {isLocked && (
        <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-gray-400 to-slate-500 text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
          <Lock className="h-3 w-3" /> Premium
        </div>
      )}
      {!isLocked && isFinished && (
        <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
          <Check className="h-3 w-3" /> Kryer
        </div>
      )}

      <div className={`h-[90px] flex items-center justify-center border-b transition-all relative ${
        isLocked
          ? "bg-gradient-to-br from-gray-100 to-slate-100 border-gray-200 text-gray-400"
          : isFinished
            ? "bg-gradient-to-br from-amber-100/50 to-orange-100/50 border-amber-200 text-amber-500"
            : "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100 text-emerald-500 group-hover:from-emerald-100 group-hover:to-teal-100"
      }`}>
        <ScenarioIcon scenario={story.scenario} size={32} className={`transition-transform group-hover:scale-110 ${isLocked ? "opacity-40" : ""}`} />
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[1px]">
            <Lock className="h-8 w-8 text-gray-400 opacity-60" />
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2.5">
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg ${
            isLocked
              ? "bg-gray-100 text-gray-400"
              : isFinished
                ? "bg-amber-100 text-amber-600"
                : "bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 border border-emerald-200"
          }`}>
            {story.level}
          </span>
          <span className="text-[11px] text-gray-400 font-medium">{config.label}</span>
        </div>
        <h3 className={`text-sm font-bold mb-1 leading-tight truncate ${
          isLocked ? "text-gray-400" : isFinished ? "text-amber-700" : "text-gray-800 group-hover:text-emerald-700"
        }`}>
          {story.title}
        </h3>
        {story.albanianTitle && (
          <p className="text-xs text-gray-400 mb-2.5 leading-snug truncate">{story.albanianTitle}</p>
        )}
        <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
          <div className={`flex items-center gap-1 text-xs font-bold ${isLocked ? "text-gray-400" : "text-emerald-600"}`}>
            <Star className="h-3 w-3" /> +{story.xpReward || 10} XP
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-semibold shadow-sm ${
            isLocked
              ? "bg-gradient-to-r from-gray-400 to-slate-500 text-white"
              : isFinished
                ? "bg-gradient-to-r from-amber-400 to-orange-400 text-white"
                : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
          }`}>
            {isLocked ? "Premium" : isFinished ? "Kryer" : "Fillo"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

const FREE_STORY_LIMIT = 3;

export default function Stories() {
  const [stories, setStories] = useState([]);
  const [finishedIds, setFinishedIds] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedScenario, setSelectedScenario] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeStory, setActiveStory] = useState(null);
  const [isPaid, setIsPaid] = useState(true); // default true to avoid flicker
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    document.title = "Dialogë Gjermanisht - Praktikoni Biseda Reale | Ushtrime Dialogu";
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) { metaDesc = document.createElement("meta"); metaDesc.name = "description"; document.head.appendChild(metaDesc); }
    metaDesc.content = "Praktikoni dialogë në gjuhën gjermane me biseda interaktive. Përmirësoni aftësitë tuaja të të folurit me ushtrime nga A1 deri C2.";

    // Load user isPaid status
    const loadUser = async () => {
      try {
        const res = await authService.getProfile();
        const user = res.data?.user || res.data || res;
        setIsPaid(user?.isPaid === true);
      } catch (e) {
        // fallback: try localStorage
        try {
          const stored = localStorage.getItem("user");
          if (stored) {
            const u = JSON.parse(stored);
            setIsPaid(u?.isPaid === true);
          }
        } catch {}
      }
    };
    loadUser();
  }, []);

  useEffect(() => { fetchData(); }, [selectedLevel, selectedScenario]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, fRes] = await Promise.all([
        storyService.getAllStories(selectedLevel),
        storyService.getFinishedStories(),
      ]);
      let data = sRes.data || sRes || [];
      if (selectedScenario) data = data.filter(s => s.scenario === selectedScenario);
      setStories(Array.isArray(data) ? data : []);
      const fData = fRes.data || fRes || [];
      setFinishedIds((Array.isArray(fData) ? fData : []).map(s => s._id || s));
    } catch (e) { console.error("Fetch error:", e); }
    setLoading(false);
  };

  const startStory = async (story) => {
    // If user is not paid and has reached the free limit, show paywall
    if (!isPaid && finishedIds.length >= FREE_STORY_LIMIT && !finishedIds.includes(story._id)) {
      setShowPaywall(true);
      return;
    }
    try {
      const res = await storyService.getStoryById(story._id);
      setActiveStory(res.data || res);
    } catch (e) { console.error("Load error:", e); }
  };

  if (activeStory) {
    return (
      <>
        <StoryPlayer story={activeStory}
          onFinish={() => { setActiveStory(null); fetchData(); }}
          onBack={() => setActiveStory(null)} />
      </>
    );
  }

  const scenarios = Object.keys(SCENARIO_CONFIG);
  const levels = ["all", ...LEVELS];

  const getLevelColor = (level) => {
    const map = {
      A1: "bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 border-emerald-200",
      A2: "bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-600 border-blue-200",
      B1: "bg-gradient-to-br from-violet-50 to-purple-50 text-violet-600 border-violet-200",
      B2: "bg-gradient-to-br from-amber-50 to-orange-50 text-amber-600 border-amber-200",
      C1: "bg-gradient-to-br from-rose-50 to-pink-50 text-rose-600 border-rose-200",
      C2: "bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-600 border-indigo-200",
    };
    return map[level] || map.A1;
  };

  // For free users: stories beyond the limit are "locked" if not already finished
  const isStoryLocked = (story) => {
    if (isPaid) return false;
    if (finishedIds.includes(story._id)) return false;
    // Count how many unfinished stories appear before this one in the list
    // Lock all unfinished stories once the user has used up their 5 slots
    return finishedIds.length >= FREE_STORY_LIMIT;
  };

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
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-6 w-6 text-emerald-600" />
                    <h1 className="text-2xl font-bold text-gray-900">Dialogë Gjermanisht</h1>
                  </div>
                  <p className="text-gray-600 text-sm">Praktikoni biseda reale në gjermanisht me skenarë interaktivë</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <p className="text-xs text-gray-400">
                  Dialogë të përfunduara: {finishedIds.length}
                </p>
               
              </div>
            </div>
          </div>
        </header>

        <div className="bg-white border border-emerald-100 p-4 rounded-2xl mb-4 shadow-lg flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold text-gray-800">Filtro sipas Nivelit</h2>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {levels.map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level === "all" ? "" : level)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border shadow-sm hover:shadow-md hover:scale-105 active:scale-95 cursor-pointer ${
                  (level === "all" ? selectedLevel === "" : selectedLevel === level)
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

          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-sm font-semibold text-gray-800">Filtro sipas Skenarëve</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedScenario("")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border cursor-pointer ${
                selectedScenario === ""
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-500"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
              }`}
            >
              Të gjitha
            </button>
            {scenarios.map(key => {
              const cfg = SCENARIO_CONFIG[key];
              const active = selectedScenario === key;
              return (
                <button key={key} onClick={() => setSelectedScenario(key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-500"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
                  }`}
                >
                  <ScenarioIcon scenario={key} size={13} />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
          </div>
        ) : stories.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="bg-white rounded-2xl p-8 inline-block border border-gray-100 shadow-xl">
              <MessageSquare className="text-emerald-400 w-12 h-12 mx-auto mb-4" />
              <h3 className="text-base font-semibold text-gray-800 mb-2">Nuk u gjetën dialogë</h3>
              <p className="text-gray-500 text-sm">
                Provoni të zgjidhni nivele ose skenarë të ndryshme
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 flex-1">
            {stories.map(story => (
              <StoryCard key={story._id} story={story}
                isFinished={finishedIds.includes(story._id)}
                isLocked={isStoryLocked(story)}
                onClick={startStory} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}