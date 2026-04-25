"use client"
import { useState, useEffect, useRef } from "react"
import {
  Mic,
  MicOff,
  Volume2,
  CheckCircle2,
  ArrowLeft,
  RotateCcw,
  Star,
  Trophy,
  Zap,
  Flame,
  Crown,
  Lock,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

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
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 flex items-center justify-center mx-auto mb-5">
            <Crown className="h-10 w-10 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Limit i Arritur</h2>
          <p className="text-gray-500 text-sm mb-2 leading-relaxed">
            Versioni falas lejon vetëm <span className="font-bold text-emerald-600">5</span> paketa të përfunduara.
          </p>
          <p className="text-gray-400 text-xs mb-6 leading-relaxed">
            Kaloni në planin Premium për të pasur akses të pakufizuar në të gjitha paketat.
          </p>
          <button
            onClick={() => { window.location.href = "/payments" }}
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
  )
}
import { pronunciationService, ttsService } from "../services/api.js"
import { useLanguage } from "../context/LanguageContext"
import { useAuth } from "../context/AuthContext"

const PronunciationPractice = () => {
  const { language } = useLanguage()
  const { user } = useAuth()
  const [packages, setPackages] = useState([])
  const [filteredPackages, setFilteredPackages] = useState([])
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioCache, setAudioCache] = useState({})
  // userStats removed — using user.xp from AuthContext instead
  const [sessionStats, setSessionStats] = useState({
    correctAnswers: 0,
    totalAttempts: 0,
    completedWords: [],
    totalXP: 0,
  })
  const [feedback, setFeedback] = useState(null)
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(false)
  const [completedPackages, setCompletedPackages] = useState(new Set())
  const [isPaid, setIsPaid] = useState(false)
  const [freeLimit, setFreeLimit] = useState(5)
  const [showPaywall, setShowPaywall] = useState(false)
  const [loadingPackage, setLoadingPackage] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState("A1")
  const [listeningSeconds, setListeningSeconds] = useState(0)
  const currentAudioRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerRef = useRef(null)

  useEffect(() => {
    loadPackages()
    loadCompletedPackages()
  }, [language])

  useEffect(() => {
    setFilteredPackages(packages.filter((pkg) => pkg.level === selectedLevel))
  }, [packages, selectedLevel])


  const loadCompletedPackages = async () => {
    try {
      const response = await pronunciationService.getUserCompletedPackages()
      const data = response.data || {}
      const completedIds = data.completedPronunciationPackages || []
      const completedIdStrings = completedIds.map((pkg) => {
        if (typeof pkg === "object" && pkg._id) return pkg._id.toString()
        if (typeof pkg === "string") return pkg
        return pkg.toString()
      })
      setCompletedPackages(new Set(completedIdStrings))
      setIsPaid(data.isPaid || false)
      setFreeLimit(data.freeLimit || 5)
    } catch {
      setCompletedPackages(new Set())
    }
  }

  const loadPackages = async () => {
    try {
      setLoading(true)
      const response = await pronunciationService.getWords({}, language)
      const packagesData = response.data
      if (Array.isArray(packagesData)) {
        setPackages(packagesData)
      } else if (packagesData?.packages) {
        setPackages(packagesData.packages)
      } else if (packagesData?.data) {
        setPackages(packagesData.data)
      } else {
        setPackages([])
      }
    } catch {
      setPackages([])
    } finally {
      setLoading(false)
    }
  }

  const startListening = async () => {
    if (sessionStats.completedWords.includes(currentWordIndex)) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setIsListening(true)
      setFeedback(null)
      setListeningSeconds(0)
      audioChunksRef.current = []

      let secs = 0
      timerRef.current = setInterval(() => {
        secs += 1
        setListeningSeconds(secs)
      }, 1000)

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        clearInterval(timerRef.current)
        stream.getTracks().forEach((t) => t.stop())
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        try {
          const transcript = await pronunciationService.transcribeAudio(audioBlob, language)
          checkPronunciation(transcript)
        } catch {
          setFeedback({ type: "error", text: "Nuk u njoh zëri. Provo përsëri." })
          setIsListening(false)
        }
      }

      mediaRecorder.start()
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop()
        }
        setIsListening(false)
      }, 4000)
    } catch {
      setIsListening(false)
      setFeedback({ type: "error", text: "Aksesi në mikrofon u refuzua." })
    }
  }

  const stopListening = () => {
    clearInterval(timerRef.current)
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop()
    }
    setIsListening(false)
  }

  const checkPronunciation = async (spokenText) => {
    if (!selectedPackage) return
    try {
      const response = await pronunciationService.checkPronunciation(
        selectedPackage._id,
        currentWordIndex,
        spokenText,
      )
      const { correct, xpAdded, similarity: simScore } = response.data

      let newCompletedWords = null
      setSessionStats((prev) => {
        const updatedCompleted =
          correct && !prev.completedWords.includes(currentWordIndex)
            ? [...prev.completedWords, currentWordIndex]
            : prev.completedWords
        newCompletedWords = updatedCompleted
        return {
          ...prev,
          totalAttempts: prev.totalAttempts + 1,
          correctAnswers: correct ? prev.correctAnswers + 1 : prev.correctAnswers,
          completedWords: updatedCompleted,
          totalXP: prev.totalXP + (xpAdded || 0),
        }
      })

      if (correct) {
        const isPerfect = simScore >= 85
        setFeedback({
          type: "correct",
          text: isPerfect ? "Perfekt!" : "Mirë — mjaft afër!",
          xp: xpAdded,
          score: simScore,
        })
        setTimeout(() => {
          advanceWord(newCompletedWords)
        }, 800)
      } else {
        setFeedback({
          type: "wrong",
          text: "Jo saktë — provo përsëri!",
          score: simScore,
        })
      }
    } catch {
      setFeedback({ type: "error", text: "Gabim gjatë kontrollit. Provo përsëri." })
    }
  }

  const playPronunciation = async (word, wordId, level) => {
    if (isPlaying) return
    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current.currentTime = 0
      }
      setIsPlaying(true)
      const cacheKey = `${wordId}_${level}`
      let audioUrl = audioCache[cacheKey]
      if (!audioUrl) {
        audioUrl = await ttsService.getPronunciationAudio(wordId, word, level, language)
        setAudioCache((prev) => ({ ...prev, [cacheKey]: audioUrl }))
      }
      const audio = new Audio(audioUrl)
      currentAudioRef.current = audio
      audio.onended = () => setIsPlaying(false)
      audio.play()
    } catch {
      setIsPlaying(false)
      setFeedback({ type: "error", text: "Gabim gjatë luajtjes së audios." })
    }
  }

  const advanceWord = (newCompletedWords) => {
    if (!selectedPackage) return
    const completedCount = newCompletedWords ? newCompletedWords.length : sessionStats.completedWords.length
    if (currentWordIndex < selectedPackage.words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1)
      setFeedback(null)
    } else {
      const allDone = completedCount >= selectedPackage.words.length
      if (allDone) {
        setCompletedPackages((prev) => new Set([...Array.from(prev), selectedPackage._id.toString()]))
      }
      setShowResults(true)
    }
  }

  const resetSession = () => {
    setCurrentWordIndex(0)
    setSessionStats({ correctAnswers: 0, totalAttempts: 0, completedWords: [], totalXP: 0 })
    setFeedback(null)
    setShowResults(false)
  }

  const selectPackage = (pkg) => {
    const isCompleted = completedPackages.has(pkg._id.toString())
    const isLocked = !isCompleted && !isPaid && completedPackages.size >= freeLimit
    if (isLocked) {
      setShowPaywall(true)
      return
    }
    setSelectedPackage(pkg)
    resetSession()
  }

  const backToPackages = () => {
    setSelectedPackage(null)
    resetSession()
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const getLevelColor = (level) => {
    const map = {
      A1: "level-A1",
      A2: "level-A2",
      B1: "level-B1",
      B2: "level-B2",
      C1: "level-C1",
      C2: "level-C2",
    }
    return map[level] || "level-default"
  }

  const uniqueLevels = Array.from(new Set(packages.map((pkg) => pkg.level))).sort()

  const progressPercentage = selectedPackage
    ? (sessionStats.completedWords.length / selectedPackage.words.length) * 100
    : 0

  const currentWord = selectedPackage?.words[currentWordIndex]
  const isWordDone = sessionStats.completedWords.includes(currentWordIndex)

  // ─── RESULTS SCREEN ───────────────────────────────────────────────────────
  if (selectedPackage && showResults) {
    const accuracy = sessionStats.totalAttempts
      ? Math.round((sessionStats.correctAnswers / sessionStats.totalAttempts) * 100)
      : 0
    const allPerfect = sessionStats.completedWords.length === selectedPackage.words.length

    return (
      <div className="pp-results-bg">
        <style>{styles}</style>
        <div className="results-wrap">
          <div className="results-card">
            <div className={`results-hero ${allPerfect ? "" : "results-hero--gray"}`}>
              <div className="results-trophy">
                {allPerfect ? <Trophy size={28} color="#fff" /> : <Star size={28} color="#fff" />}
              </div>
              <h2 className="results-title">{allPerfect ? "Paketa e Përfunduar!" : "Sesioni Mbaroi"}</h2>
              <p className="results-subtitle">{selectedPackage.title}</p>
            </div>

            <div className="results-stats">
              <div className="results-stat">
                <div className="results-stat-num">{sessionStats.completedWords.length}</div>
                <div className="results-stat-label">Fjalë të mësuara</div>
              </div>
              <div className="results-stat">
                <div className="results-stat-num">{accuracy}%</div>
                <div className="results-stat-label">Saktësi</div>
              </div>
              <div className="results-stat">
                <div className="results-stat-num">+{sessionStats.totalXP}</div>
                <div className="results-stat-label">XP fituar</div>
              </div>
            </div>

            <div className="results-actions">
              {!allPerfect && (
                <button onClick={resetSession} className="btn-primary">
                  <RotateCcw size={15} />
                  Provo përsëri — arrij 100%
                </button>
              )}
              <button onClick={backToPackages} className="btn-secondary">
                <ArrowLeft size={15} />
                Kthehu tek paketat
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── PRACTICE SCREEN ──────────────────────────────────────────────────────
  if (selectedPackage) {
    return (
      <div className="pp-root">
        <style>{styles}</style>
        <div className="practice-wrap">

          <div className="practice-topbar">
            <button onClick={backToPackages} className="practice-back-btn">
              <ArrowLeft size={18} />
            </button>
            <div className="practice-progress-wrap">
              <div className="practice-pkg-name">{selectedPackage.title} · {selectedPackage.level}</div>
              <div className="practice-prog-track">
                <div className="practice-prog-fill" style={{ width: `${progressPercentage}%` }} />
              </div>
            </div>
            <div className="practice-word-counter">
              {currentWordIndex + 1}/{selectedPackage.words.length}
            </div>
          </div>

          <div className="practice-dots">
            {selectedPackage.words.map((_, i) => (
              <div
                key={i}
                className={`practice-dot ${
                  sessionStats.completedWords.includes(i)
                    ? "practice-dot--done"
                    : i === currentWordIndex
                    ? "practice-dot--current"
                    : ""
                }`}
              />
            ))}
          </div>

          <div className="word-card">
            {isWordDone && (
              <div className="word-done-badge">
                <CheckCircle2 size={13} />
                Përfunduar
              </div>
            )}
            <div className="word-main">{currentWord?.word}</div>
            <div className="word-phonetic">[{currentWord?.pronunciation}]</div>
            <div className="word-translation">{currentWord?.translation}</div>
            <button
              onClick={() =>
                playPronunciation(
                  currentWord?.word,
                  currentWord?._id || `${selectedPackage._id}_${currentWordIndex}`,
                  selectedPackage.level,
                )
              }
              disabled={isPlaying}
              className="listen-btn"
            >
              <Volume2 size={14} />
              {isPlaying ? "Po luhet..." : "Dëgjo"}
            </button>
          </div>

          <div className="mic-card">
            <p className="mic-instruction">
              {isWordDone
                ? "Fjala u përfundua — kalo tek tjetra"
                : isListening
                ? "Po dëgjon..."
                : "Shtyp mikrofonin dhe thuaj fjalën me zë"}
            </p>

            <div className="mic-outer">
              {isListening && (
                <>
                  <span className="mic-ring mic-ring--1" />
                  <span className="mic-ring mic-ring--2" />
                  <span className="mic-ring mic-ring--3" />
                </>
              )}
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={isWordDone}
                className={`mic-btn ${isListening ? "mic-btn--listening" : ""} ${isWordDone ? "mic-btn--done" : ""}`}
              >
                {isListening ? <MicOff size={26} color="#fff" /> : <Mic size={26} color="#fff" />}
              </button>
            </div>

            {isListening && (
              <div className="waveform">
                {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.2].map((delay, i) => (
                  <div key={i} className="wave-bar" style={{ animationDelay: `${delay}s` }} />
                ))}
              </div>
            )}

            {feedback && (
              <div className={`feedback-box feedback-box--${feedback.type}`}>
                {feedback.type === "correct" && (
                  <>
                    <CheckCircle2 size={15} />
                    <span>
                      {feedback.text}
                      {feedback.xp > 0 && (
                        <span className="feedback-xp">
                          <Zap size={13} />+{feedback.xp} XP
                        </span>
                      )}
                    </span>
                    {feedback.score != null && (
                      <span className="feedback-score">{feedback.score}%</span>
                    )}
                  </>
                )}
                {feedback.type === "wrong" && (
                  <>
                    <RotateCcw size={15} />
                    <span>{feedback.text}</span>
                    {feedback.score != null && (
                      <span className="feedback-score feedback-score--wrong">{feedback.score}%</span>
                    )}
                  </>
                )}
                {feedback.type === "error" && <span>{feedback.text}</span>}
              </div>
            )}
          </div>

        </div>
      </div>
    )
  }

  // ─── PACKAGE LIST ─────────────────────────────────────────────────────────
  return (
    <div className="pp-root">
      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}
      <style>{styles}</style>

      {/* ── HERO HEADER ── */}
      <div className="pp-hero">
        <div className="pp-hero-left">
          <div className="pp-hero-eyebrow">
            <Flame size={14} />
            Praktikë Gjuhësore
          </div>
          <h1 className="pp-hero-title">Shqiptimi</h1>
          <p className="pp-hero-sub">
            Dëgjo çdo fjalë, regjistro zërin tënd — arrij 100% për të përfunduar një paketë.
          </p>
        </div>
        <div className="pp-hero-stats">
          <div className="pp-stat-card" style={{ minWidth: 100, justifyContent: "center" }}>
            <img
              src={{ de: "https://flagcdn.com/w80/de.png", en: "https://flagcdn.com/w80/gb.png", fr: "https://flagcdn.com/w80/fr.png" }[language] || "https://flagcdn.com/w80/de.png"}
              alt={language}
              style={{ width: 56, height: 38, objectFit: "cover", borderRadius: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
            />
          </div>
        </div>
      </div>

      {/* level filter */}
      <div className="pp-filters">
        {uniqueLevels.map((level) => (
          <button
            key={level}
            onClick={() => setSelectedLevel(level)}
            className={`pp-filter-btn ${selectedLevel === level ? "pp-filter-btn--active" : ""}`}
          >
            {level}
          </button>
        ))}
      </div>

      {/* package grid */}
{loading ? (
        <div className="flex items-center justify-center min-h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
        </div>
      ) : filteredPackages.length > 0 ? (
        <div className="pp-grid">
          {filteredPackages.map((pkg) => {
            const isCompleted = completedPackages.has(pkg._id.toString())
            const isLocked = !isCompleted && !isPaid && completedPackages.size >= freeLimit
            return (
              <button
                key={pkg._id}
                onClick={() => selectPackage(pkg)}
                className={`pp-card ${isCompleted ? "pp-card--completed" : isLocked ? "pp-card--locked" : ""}`}
              >
                <div className="pp-card-top">
                  <span className={`pp-level-tag ${getLevelColor(pkg.level)}`}>{pkg.level}</span>
                  {isCompleted && <CheckCircle2 size={16} className="pp-card-check" />}
                  {isLocked && <Lock size={16} className="pp-card-lock" />}
                </div>
                <h3 className={`pp-card-title ${isLocked ? "pp-card-title--locked" : ""}`}>{pkg.title}</h3>
                <p className={`pp-card-meta ${isLocked ? "pp-card-meta--locked" : ""}`}>{pkg.words?.length || 0} fjalë</p>
                <div className="pp-card-footer">
                  <span className={`pp-start-label ${isCompleted ? "pp-start-label--done" : isLocked ? "pp-start-label--locked" : ""}`}>
                    {!isLocked && <span className="pp-mic-dot" />}
                    {isCompleted ? "Përfunduar" : isLocked ? "Premium" : "Fillo praktikën"}
                  </span>
                  <span className="pp-arrow">→</span>
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="pp-empty">
          <Mic size={36} className="pp-empty-icon" />
          <p>Nuk u gjetën paketa për këtë nivel</p>
        </div>
      )}


    </div>
  )
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display&display=swap');

  .pp-root {
    font-family: 'DM Sans', sans-serif;
    background: #f9f7f5;
    min-height: 100vh;
    padding: 28px 32px;
    color: #1a1a1a;
  }

  .pp-results-bg {
    font-family: 'DM Sans', sans-serif;
    background: #f9f7f5;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }

  .pp-loading {
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
    background: #f9f7f5;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .pp-grid-loader {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 64px 0;
  }

  .pp-overlay-loader {
    position: fixed;
    inset: 0;
    background: rgba(255,255,255,0.65);
    backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
  }

  .pp-spinner-blue {
    width: 36px;
    height: 36px;
    border: 3px solid #dbeafe;
    border-top-color: #1d4ed8;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  .pp-spinner {
    width: 32px;
    height: 32px;
    border: 2px solid #dbeafe;
    border-top-color: #1d4ed8;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* ─── HERO HEADER ─── */
  .pp-hero {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
    background: linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 40%, #3b82f6 75%, #93c5fd 100%);
    border-radius: 20px;
    padding: 28px 32px;
    margin-bottom: 28px;
    position: relative;
    overflow: hidden;
  }

  .pp-hero::before {
    content: '';
    position: absolute;
    top: -40px; right: -40px;
    width: 200px; height: 200px;
    border-radius: 50%;
    background: rgba(255,255,255,0.07);
  }

  .pp-hero::after {
    content: '';
    position: absolute;
    bottom: -60px; right: 80px;
    width: 160px; height: 160px;
    border-radius: 50%;
    background: rgba(255,255,255,0.05);
  }

  .pp-hero-left { flex: 1; position: relative; z-index: 1; }

  .pp-hero-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 600;
    color: rgba(255,255,255,0.8);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
  }

  .pp-hero-title {
    font-family: 'DM Serif Display', serif;
    font-size: 38px;
    font-weight: 400;
    color: #fff;
    letter-spacing: -0.5px;
    line-height: 1.1;
    margin: 0 0 8px;
  }

  .pp-hero-sub {
    font-size: 13px;
    color: rgba(255,255,255,0.75);
    margin: 0;
    max-width: 380px;
    line-height: 1.5;
  }

  .pp-hero-stats {
    display: flex;
    gap: 12px;
    flex-shrink: 0;
    position: relative;
    z-index: 1;
    align-self: center;
  }

  .pp-stat-card {
    background: rgba(0,0,0,0.15);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 14px;
    padding: 14px 18px;
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 130px;
  }

  .pp-stat-icon {
    width: 34px; height: 34px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    background: rgba(255,255,255,0.2);
  }

  .pp-stat-num {
    font-size: 22px;
    font-weight: 600;
    color: #fff;
    line-height: 1;
    margin-bottom: 2px;
  }

  .pp-stat-label {
    font-size: 11px;
    color: rgba(255,255,255,0.7);
    font-weight: 500;
  }

  /* ─── FILTERS ─── */
  .pp-filters {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 22px;
  }

  .pp-filter-btn {
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 500;
    padding: 6px 14px;
    border-radius: 20px;
    border: 1px solid #e5ddd8;
    background: #fff;
    color: #666;
    cursor: pointer;
    transition: all 0.15s;
  }

  .pp-filter-btn:hover { border-color: #1d4ed8; color: #1d4ed8; }
  .pp-filter-btn--active { background: #1d4ed8 !important; color: #fff !important; border-color: #1d4ed8 !important; }

  /* ─── GRID ─── */
  .pp-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
    gap: 14px;
  }

  .pp-card {
    text-align: left;
    background: #fff;
    border-radius: 16px;
    border: 1px solid #ede8e3;
    padding: 18px 20px 16px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
  }

  .pp-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, #1e3a5f, #1d4ed8, #3b82f6);
    opacity: 0;
    transition: opacity 0.2s;
  }

  .pp-card:hover {
    border-color: #1d4ed8;
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(29,78,216,0.13);
  }

  .pp-card:hover::before { opacity: 1; }

  .pp-card--completed { border-color: #b6dfc5; background: #fafff9; }
  .pp-card--completed::before { background: linear-gradient(90deg, #2d8a50, #7dd4a8); opacity: 1; }

  .pp-card--locked { border-color: #e5e7eb; background: #f9fafb; }
  .pp-card--locked:hover { border-color: #d1d5db; box-shadow: none; transform: none; }
  .pp-card--locked::before { display: none; }
  .pp-card-lock { color: #9ca3af; flex-shrink: 0; }
  .pp-card-title--locked { color: #9ca3af; }
  .pp-card-meta--locked { color: #d1d5db; }
  .pp-start-label--locked { color: #9ca3af; }

  .pp-card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }

  .pp-level-tag {
    font-size: 11px;
    font-weight: 600;
    padding: 3px 9px;
    border-radius: 6px;
    letter-spacing: 0.3px;
  }

  .level-A1 { background: #fff0eb; color: #c9200a; }
  .level-A2 { background: #fff5e6; color: #b55e00; }
  .level-B1 { background: #e8eeff; color: #2d4fd1; }
  .level-B2 { background: #efe8ff; color: #6b36d4; }
  .level-C1 { background: #fff0f0; color: #c43030; }
  .level-C2 { background: #c9200a; color: #fff; }
  .level-default { background: #f1f0ec; color: #555; }

  .pp-card-check { color: #2d8a50; flex-shrink: 0; }

  .pp-card-title {
    font-size: 14px;
    font-weight: 500;
    color: #1a1a1a;
    line-height: 1.4;
    margin: 0 0 5px;
  }

  .pp-card-meta {
    font-size: 12px;
    color: #aaa;
    margin: 0 0 14px;
  }

  .pp-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .pp-start-label {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    font-weight: 500;
    color: #1d4ed8;
  }

  .pp-start-label--done { color: #2d8a50; }

  .pp-mic-dot {
    width: 6px; height: 6px;
    background: currentColor;
    border-radius: 50%;
    display: inline-block;
  }

  .pp-arrow {
    font-size: 13px;
    color: #ddd;
    transition: color 0.2s, transform 0.2s;
  }

  .pp-card:hover .pp-arrow { color: #1d4ed8; transform: translateX(3px); }

  /* ─── EMPTY ─── */
  .pp-empty {
    text-align: center;
    padding: 64px 0;
    color: #bbb;
  }

  .pp-empty-icon { margin: 0 auto 12px; display: block; opacity: 0.3; }
  .pp-empty p { font-size: 14px; font-weight: 500; }

  /* ─── PAGINATION ─── */
  .pp-pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-top: 32px;
  }

  .pp-page-btn {
    font-family: 'DM Sans', sans-serif;
    width: 36px; height: 36px;
    border-radius: 10px;
    border: 1px solid #e5ddd8;
    background: #fff;
    color: #555;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
  }

  .pp-page-btn:hover:not(:disabled) { border-color: #1d4ed8; color: #1d4ed8; }
  .pp-page-btn--active { background: #1d4ed8 !important; color: #fff !important; border-color: #1d4ed8 !important; }
  .pp-page-btn:disabled { opacity: 0.35; cursor: default; }

  /* ─── MOBILE WARNING ─── */
  .mobile-warning {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 12px;
    padding: 14px 16px;
    margin-bottom: 20px;
    font-size: 13px;
    color: #92400e;
  }

  .mobile-warning-icon { flex-shrink: 0; margin-top: 1px; color: #d97706; }

  /* ─── PRACTICE SCREEN ─── */
  .practice-wrap { max-width: 560px; margin: 0 auto; }

  .practice-topbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 22px;
  }

  .practice-back-btn {
    width: 36px; height: 36px;
    border-radius: 10px;
    border: 1px solid #e5ddd8;
    background: #fff;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: #555;
    transition: all 0.15s;
    flex-shrink: 0;
  }

  .practice-back-btn:hover { border-color: #1d4ed8; color: #1d4ed8; }

  .practice-progress-wrap { flex: 1; }

  .practice-pkg-name {
    font-size: 12px;
    color: #888;
    font-weight: 500;
    margin-bottom: 5px;
  }

  .practice-prog-track {
    height: 5px;
    background: #dbeafe;
    border-radius: 10px;
    overflow: hidden;
  }

  .practice-prog-fill {
    height: 100%;
    background: linear-gradient(90deg, #1e3a5f, #1d4ed8, #3b82f6);
    border-radius: 10px;
    transition: width 0.6s cubic-bezier(0.34,1.56,0.64,1);
  }

  .practice-word-counter {
    font-size: 12px;
    color: #aaa;
    font-weight: 500;
    flex-shrink: 0;
    text-align: right;
  }

  .practice-dots {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    justify-content: center;
    margin-bottom: 20px;
  }

  .practice-dot {
    height: 5px;
    border-radius: 10px;
    background: #ede9e3;
    width: 8px;
    transition: all 0.3s;
  }

  .practice-dot--current { background: #93c5fd; width: 14px; }
  .practice-dot--done { background: #1d4ed8; width: 14px; }

  /* ─── WORD CARD ─── */
  .word-card {
    background: #fff;
    border-radius: 20px;
    border: 1px solid #ede8e3;
    padding: 36px 32px;
    text-align: center;
    margin-bottom: 14px;
  }

  .word-done-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: #edf7f0;
    color: #2d8a50;
    border: 1px solid #b6dfc5;
    font-size: 11px;
    font-weight: 600;
    padding: 4px 11px;
    border-radius: 20px;
    margin-bottom: 14px;
  }

  .word-main {
    font-family: 'DM Serif Display', serif;
    font-size: 52px;
    font-weight: 400;
    color: #111;
    letter-spacing: -1px;
    line-height: 1;
    margin-bottom: 10px;
  }

  .word-phonetic {
    font-size: 16px;
    color: #1d4ed8;
    font-style: italic;
    margin-bottom: 5px;
  }

  .word-translation {
    font-size: 14px;
    color: #aaa;
    margin-bottom: 20px;
  }

  .listen-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: #1d4ed8;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    padding: 8px 18px;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .listen-btn:hover { background: #dbeafe; border-color: #1d4ed8; }
  .listen-btn:disabled { opacity: 0.5; cursor: default; }

  /* ─── MIC CARD ─── */
  .mic-card {
    background: #fff;
    border-radius: 20px;
    border: 1px solid #ede8e3;
    padding: 28px 24px;
    text-align: center;
    margin-bottom: 14px;
  }

  .mic-instruction {
    font-size: 13px;
    color: #aaa;
    margin-bottom: 22px;
  }

  .mic-outer {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 10px;
  }

  .mic-ring {
    position: absolute;
    border-radius: 50%;
    border: 1.5px solid #1d4ed8;
    opacity: 0;
    animation: pulse-ring 1.8s ease-out infinite;
  }

  .mic-ring--1 { width: 80px; height: 80px; animation-delay: 0s; }
  .mic-ring--2 { width: 100px; height: 100px; animation-delay: 0.4s; }
  .mic-ring--3 { width: 120px; height: 120px; animation-delay: 0.8s; }

  @keyframes pulse-ring {
    0% { opacity: 0.7; transform: scale(0.85); }
    100% { opacity: 0; transform: scale(1); }
  }

  .mic-btn {
    position: relative;
    width: 64px; height: 64px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1e3a5f, #1d4ed8, #3b82f6);
    border: none;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
    z-index: 1;
    box-shadow: 0 4px 18px rgba(29,78,216,0.4);
  }

  .mic-btn:hover { transform: scale(1.07); box-shadow: 0 6px 24px rgba(29,78,216,0.5); }
  .mic-btn--listening { background: linear-gradient(135deg, #1e3a5f, #1e40af) !important; }
  .mic-btn--done { background: #ddd !important; cursor: default; transform: none !important; box-shadow: none !important; }

  .waveform {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 4px;
    height: 28px;
    margin-top: 12px;
  }

  .wave-bar {
    width: 4px;
    background: linear-gradient(to top, #1d4ed8, #93c5fd);
    border-radius: 4px;
    height: 8px;
    animation: wave-anim 0.6s ease-in-out infinite alternate;
  }

  @keyframes wave-anim {
    from { height: 6px; }
    to { height: 22px; }
  }

  .feedback-box {
    display: flex;
    align-items: center;
    gap: 9px;
    margin-top: 16px;
    padding: 11px 16px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 500;
    border: 1px solid;
  }

  .feedback-box--correct { background: #edf7f0; color: #2d8a50; border-color: #b6dfc5; }
  .feedback-box--wrong { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
  .feedback-box--error { background: #f8f8f8; color: #888; border-color: #e0e0e0; }

  .feedback-score {
    margin-left: auto;
    font-size: 12px;
    font-weight: 700;
    background: rgba(45,138,80,0.12);
    color: #2d8a50;
    padding: 2px 8px;
    border-radius: 20px;
  }

  .feedback-score--wrong {
    background: rgba(185,28,28,0.1);
    color: #b91c1c;
  }

  .feedback-xp {
    margin-left: 8px;
    color: #1d4ed8;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }

  .xp-pill-wrap { text-align: center; }

  .xp-pill {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
    font-size: 13px;
    font-weight: 600;
    padding: 7px 16px;
    border-radius: 20px;
  }

  .xp-dot {
    width: 7px; height: 7px;
    background: #1d4ed8;
    border-radius: 50%;
    animation: xp-pulse 1.2s ease-in-out infinite;
    display: inline-block;
  }

  @keyframes xp-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.65); }
  }

  /* ─── RESULTS ─── */
  .results-wrap { max-width: 420px; width: 100%; }

  .results-card {
    background: #fff;
    border-radius: 24px;
    border: 1px solid #ede8e3;
    overflow: hidden;
  }

  .results-hero {
    background: linear-gradient(135deg, #1e3a5f, #1d4ed8, #3b82f6);
    padding: 36px 28px;
    text-align: center;
  }

  .results-hero--gray { background: linear-gradient(135deg, #666, #999); }

  .results-trophy {
    width: 64px; height: 64px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 14px;
  }

  .results-title {
    font-family: 'DM Serif Display', serif;
    font-size: 24px;
    font-weight: 400;
    color: #fff;
    margin: 0 0 5px;
  }

  .results-subtitle {
    font-size: 13px;
    color: rgba(255,255,255,0.75);
    margin: 0;
  }

  .results-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    padding: 22px 20px;
    border-bottom: 1px solid #f0ece6;
    gap: 4px;
  }

  .results-stat { text-align: center; }

  .results-stat-num {
    font-size: 24px;
    font-weight: 600;
    color: #1d4ed8;
    line-height: 1;
  }

  .results-stat-label {
    font-size: 11px;
    color: #bbb;
    margin-top: 4px;
  }

  .results-actions {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .btn-primary {
    font-family: 'DM Sans', sans-serif;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    background: linear-gradient(135deg, #1e3a5f, #1d4ed8, #3b82f6);
    color: #fff;
    border: none;
    padding: 13px 20px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.15s;
    width: 100%;
    box-shadow: 0 4px 14px rgba(29,78,216,0.3);
  }

  .skip-btn {
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 500;
    color: #6b7280;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 8px;
    transition: color 0.15s;
  }
  .skip-btn:hover { color: #1d4ed8; }

  .btn-primary:hover { opacity: 0.9; }

  .btn-secondary {
    font-family: 'DM Sans', sans-serif;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    background: #f5f3ef;
    color: #555;
    border: none;
    padding: 13px 20px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s;
    width: 100%;
  }

  .btn-secondary:hover { background: #ede9e3; }

  /* ─── RESPONSIVE ─── */
  @media (max-width: 640px) {
    .pp-root { padding: 16px; }
    .pp-hero { flex-direction: column; padding: 20px; }
    .pp-hero-title { font-size: 28px; }
    .pp-hero-stats { width: 100%; }
    .pp-stat-card { flex: 1; min-width: 0; }
    .word-main { font-size: 38px; }
  }
`

export default PronunciationPractice