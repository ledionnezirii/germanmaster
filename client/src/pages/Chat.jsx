"use client"
import { useState, useEffect, useRef } from "react"
import { questionsService, authService } from "../services/api"
import { useLanguage } from "../context/LanguageContext"
import {
  Send, Bot, User, Settings, Lightbulb,
  RefreshCw, CheckCircle, XCircle, Star,
  X, ChevronDown, Zap,
} from "lucide-react"


/* ── Typewriter component ── */
const TypewriterText = ({ text, onDone }) => {
  const [displayed, setDisplayed] = useState("")
  const [done, setDone]           = useState(false)
  const indexRef = useRef(0)

  useEffect(() => {
    setDisplayed("")
    setDone(false)
    indexRef.current = 0
    if (!text) { setDone(true); onDone?.(); return }

    const id = setInterval(() => {
      indexRef.current += 1
      setDisplayed(text.slice(0, indexRef.current))
      if (indexRef.current >= text.length) {
        clearInterval(id)
        setDone(true)
        onDone?.()
      }
    }, 18)
    return () => clearInterval(id)
  }, [text])

  return (
    <span className="whitespace-pre-line break-words">
      {displayed}
      {!done && (
        <span className="inline-block w-0.5 h-3.5 ml-0.5 rounded-full align-middle animate-pulse"
          style={{ background: "currentColor", opacity: 0.5 }} />
      )}
    </span>
  )
}

/* ── thin scrollbar + message pop-in animation ── */
const SCROLLBAR_CSS = `
  .duo-scroll {
    scrollbar-width: thin;
    scrollbar-color: #d1fae5 transparent;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
  }
  .duo-scroll::-webkit-scrollbar { width: 5px; }
  .duo-scroll::-webkit-scrollbar-track { background: transparent; margin: 8px 0; }
  .duo-scroll::-webkit-scrollbar-thumb { background: #d1fae5; border-radius: 99px; transition: background 0.2s; }
  .duo-scroll::-webkit-scrollbar-thumb:hover { background: #6ee7b7; }
  .duo-scroll::-webkit-scrollbar-thumb:active { background: #34d399; }

  @keyframes pop-in {
    0%   { transform: scale(0.88) translateY(6px); opacity: 0; }
    70%  { transform: scale(1.03) translateY(0); }
    100% { transform: scale(1)    translateY(0); opacity: 1; }
  }
  .msg-enter { animation: pop-in 0.22s ease-out both; }

  @keyframes bounce-dot {
    0%, 80%, 100% { transform: translateY(0); }
    40%           { transform: translateY(-6px); }
  }
  .dot-1 { animation: bounce-dot 1s 0s   infinite; }
  .dot-2 { animation: bounce-dot 1s 0.15s infinite; }
  .dot-3 { animation: bounce-dot 1s 0.3s  infinite; }
`

const Chat = () => {
  const { language } = useLanguage()
  const [messages, setMessages] = useState([])
  const [currentInput, setCurrentInput] = useState("")
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [selectedLevel, setSelectedLevel] = useState("A1")
  const [selectedCategory, setSelectedCategory] = useState("grammar")
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hintIndex, setHintIndex] = useState(0)
  const [askedQuestionIds, setAskedQuestionIds] = useState([])
  const [userProfile, setUserProfile] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showGermanChars, setShowGermanChars] = useState(false)

  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const inputRef = useRef(null)
  const settingsRef = useRef(null)

  const germanChars = ["ä", "ö", "ü", "ß", "Ä", "Ö", "Ü"]

  const categories = [
    { value: "grammar",       label: "Gramatikë" },
    { value: "vocabulary",    label: "Fjalor" },
    { value: "articles",      label: "Artikuj" },
    { value: "Begginers",     label: "Fillestarë" },
    { value: "Präpositionen", label: "Parafjalë" },
    { value: "Adjectives",    label: "Mbiemra" },
    { value: "Perfekt",       label: "Perfekt (e kryer)" },
    { value: "mixed",         label: "Të përziera" },
  ]

  const levels = ["A1", "A2", "B1", "B2", "C1", "C2"]

  const levelColor = {
    A1: "#58cc02", A2: "#14b8a6",
    B1: "#3b82f6", B2: "#8b5cf6",
    C1: "#f97316", C2: "#ef4444",
  }

  /* inject CSS */
  useEffect(() => {
    const el = document.createElement("style")
    el.textContent = SCROLLBAR_CSS
    document.head.appendChild(el)
    return () => document.head.removeChild(el)
  }, [])

  const fetchUserProfile = async () => {
    try { const r = await authService.getProfile(); setUserProfile(r.data) } catch {}
  }

  useEffect(() => {
    if (currentQuestion && inputRef.current && !loading)
      setTimeout(() => inputRef.current?.focus(), 100)
  }, [currentQuestion, loading])

  useEffect(() => {
    const close = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setShowSettings(false)
    }
    if (showSettings) document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [showSettings])

  const insertCharacter = (char) => {
    const inp = inputRef.current
    if (!inp) return
    const s = inp.selectionStart, e2 = inp.selectionEnd
    const next = currentInput.slice(0, s) + char + currentInput.slice(e2)
    setCurrentInput(next)
    setTimeout(() => { inp.focus(); inp.setSelectionRange(s + 1, s + 1) }, 0)
  }

  const scrollToBottom = () => {
    if (messagesContainerRef.current)
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
  }

  useEffect(() => { setTimeout(scrollToBottom, 100) }, [messages])

  // Re-fetch when level, category OR language changes
  useEffect(() => {
    fetchUserProfile()
    setMessages([{
      id: Date.now(), type: "bot",
      content: "Mirë se vini! 🎉 Do t'ju bëj pyetje për të praktikuar gjermanishten. Le të fillojmë!",
      timestamp: new Date(),
    }])
    setAskedQuestionIds([])
    setCurrentQuestion(null)
    const t = setTimeout(() => fetchQuestion(), 500)
    return () => clearTimeout(t)
  }, [selectedLevel, selectedCategory, language])

  const fetchQuestion = async () => {
    if (loading) return
    setLoading(true)
    try {
      const res = await questionsService.getRandomQuestion({
        level: selectedLevel,
        category: selectedCategory === "mixed" ? undefined : selectedCategory,
        excludeIds: askedQuestionIds.join(","),
        language,
      })
      if (res.data) {
        setCurrentQuestion(res.data)
        setHintIndex(0)
        setAskedQuestionIds((p) => [...p, res.data._id])
        setMessages((p) => [...p, {
          id: Date.now(), type: "bot",
          content: res.data.question,
          timestamp: new Date(), questionData: res.data,
        }])
      } else {
        if (askedQuestionIds.length > 0) {
          setAskedQuestionIds([])
          setMessages((p) => [...p, {
            id: Date.now(), type: "bot",
            content: "Ke përfunduar të gjitha pyetjet! Le të fillojmë përsëri. 🔄",
            timestamp: new Date(),
          }])
        }
        setTimeout(() => fetchQuestion(), 1000)
      }
    } catch {
      setMessages((p) => [...p, {
        id: Date.now(), type: "bot",
        content: "Nuk ka pyetje të disponueshme. Provo një kombinim tjetër!",
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!currentInput.trim() || !currentQuestion) return
    setMessages((p) => [...p, {
      id: Date.now(), type: "user", content: currentInput, timestamp: new Date(),
    }])
    const ans = currentInput
    setCurrentInput("")
    setTimeout(scrollToBottom, 50)
    try {
      const res = await questionsService.answerQuestion(currentQuestion._id, ans)
      const r = res.data
      const correct = r.correct || r.score >= 70
      if (correct) {
        setScore((p) => p + (r.xpAwarded || Math.max(1, Math.floor(r.score / 20))))
        setStreak((p) => p + 1)
      } else {
        setStreak(0)
      }
      let content = r.message || ""
      if (r.reasonWhy)   content += `\n\n${r.reasonWhy}`
      if (r.grammarRule) content += `\n\n📚 ${r.grammarRule}`
      if (r.detailedFeedback && r.score < 90) content += `\n\n${r.detailedFeedback}`
      if (r.xpAwarded)   content += `\n\n+${r.xpAwarded} XP`
      let answerComparison = null
      if (r.userAnswer && r.correctAnswer && r.userAnswer !== r.correctAnswer)
        answerComparison = { userAnswer: r.userAnswer, correctAnswer: r.correctAnswer, score: r.score }
      setMessages((p) => [...p, {
        id: Date.now() + 1, type: "bot", content,
        timestamp: new Date(), isCorrect: correct, score: r.score,
        responseIcon: correct ? "success" : "error", answerComparison,
      }])
      setTimeout(() => fetchQuestion(), 2500)
    } catch {
      setMessages((p) => [...p, {
        id: Date.now() + 1, type: "bot",
        content: "Pati një gabim. Ju lutem provoni përsëri.",
        timestamp: new Date(), isCorrect: false,
      }])
    }
  }

  const showNextHint = () => {
    if (currentQuestion?.hints && hintIndex < currentQuestion.hints.length) {
      setMessages((p) => [...p, {
        id: Date.now(), type: "bot",
        content: currentQuestion.hints[hintIndex],
        timestamp: new Date(), isHint: true,
      }])
      setHintIndex(hintIndex + 1)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const resetQuestions = () => {
    setAskedQuestionIds([])
    setShowSettings(false)
    setStreak(0)
    setMessages((p) => [...p, {
      id: Date.now(), type: "bot",
      content: "Pyetjet u rivendosën! Le të fillojmë. 🚀",
      timestamp: new Date(),
    }])
    setTimeout(() => fetchQuestion(), 1000)
  }

  const currentCategoryLabel = categories.find((c) => c.value === selectedCategory)?.label
  const activeLevelColor = levelColor[selectedLevel] || "#58cc02"

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: "100dvh", background: "#f7fef4", fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}>

      {/* ══════════════ HEADER ══════════════ */}
      <header className="flex-shrink-0 bg-white px-5 py-3 flex items-center justify-between"
        style={{ borderBottom: "3px solid #e5f7d3" }}>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#58cc02,#46a302)", boxShadow: "0 4px 0 #2d8500" }}>
            <span className="text-white font-black text-sm">DE</span>
          </div>
          <div>
            <p className="text-sm font-black text-gray-800 leading-none">gjuhagjermane</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-black text-white px-1.5 py-0.5 rounded-full"
                style={{ background: activeLevelColor }}>
                {selectedLevel}
              </span>
              <span className="text-[11px] text-gray-400 font-bold">{currentCategoryLabel}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-2xl font-black text-xs"
            style={{ background: "#fff3e0", border: "2px solid #ffcc80", color: "#e65100" }}>
            🔥 {streak}
          </div>
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-2xl font-black text-xs"
            style={{ background: "#fffde7", border: "2px solid #fff176", color: "#f57f17" }}>
            <Zap className="w-3 h-3" style={{ fill: "#f9a825", color: "#f9a825" }} />
            {score}
          </div>

          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setShowSettings((s) => !s)}
              className="p-2 rounded-2xl transition-all"
              style={{ background: showSettings ? "#f3f4f6" : "white", border: "2px solid #e5e7eb" }}
            >
              <Settings className="w-4 h-4 text-gray-500" />
            </button>

            {showSettings && (
              <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-3xl p-5 w-72"
                style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)", border: "2px solid #e5f7d3" }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-black text-gray-800">Cilësimet ⚙️</span>
                  <button onClick={() => setShowSettings(false)} className="p-1 rounded-lg hover:bg-gray-100">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Niveli</p>
                <div className="grid grid-cols-6 gap-1.5 mb-4">
                  {levels.map((lv) => (
                    <button key={lv}
                      onClick={() => { setSelectedLevel(lv); setShowSettings(false) }}
                      className="py-1.5 text-xs font-black rounded-xl transition-all"
                      style={selectedLevel === lv
                        ? { background: levelColor[lv] || "#58cc02", color: "white", border: "2px solid transparent", boxShadow: `0 3px 0 rgba(0,0,0,0.2)` }
                        : { background: "white", color: "#374151", border: "2px solid #e5e7eb" }
                      }
                    >{lv}</button>
                  ))}
                </div>

                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Kategoria</p>
                <select
                  value={selectedCategory}
                  onChange={(e) => { setSelectedCategory(e.target.value); setShowSettings(false) }}
                  className="w-full rounded-2xl px-3 py-2 text-sm font-bold text-gray-700 mb-3 outline-none"
                  style={{ background: "#f9fafb", border: "2px solid #e5e7eb" }}
                >
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>

                <button onClick={resetQuestions}
                  className="w-full text-white py-2.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all active:translate-y-0.5"
                  style={{ background: "#58cc02", border: "none", boxShadow: "0 4px 0 #46a302" }}>
                  <RefreshCw className="w-4 h-4" />
                  Rivendos pyetjet
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ══════════════ MESSAGES ══════════════ */}
      <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto duo-scroll"
        style={{ scrollBehavior: "smooth", overscrollBehavior: "contain" }}>
        <div className="px-5 py-5 space-y-4 max-w-3xl mx-auto w-full">

          {messages.map((msg, i) => (
            <div key={msg.id}
              className={`flex items-end gap-3 msg-enter ${msg.type === "user" ? "justify-end" : "justify-start"}`}
              style={{ animationDelay: `${i * 0.015}s` }}
            >
              {msg.type === "bot" && (
                <div className="w-9 h-9 rounded-2xl flex-shrink-0 flex items-center justify-center"
                  style={{
                    background: msg.isHint
                      ? "linear-gradient(135deg,#fbbf24,#d97706)"
                      : "linear-gradient(135deg,#58cc02,#46a302)",
                    boxShadow: msg.isHint ? "0 3px 0 #b45309" : "0 3px 0 #2d8500",
                  }}>
                  {msg.isHint
                    ? <Lightbulb className="w-4 h-4 text-white" />
                    : <Bot className="w-4 h-4 text-white" />}
                </div>
              )}

              <div className="max-w-[76%]">
                <div className="px-4 py-3 rounded-3xl text-[13.5px] leading-relaxed font-semibold"
                  style={
                    msg.type === "user"
                      ? { background: "#1cb0f6", color: "white", borderRadius: "20px 20px 6px 20px", boxShadow: "0 4px 0 #0d9fd8" }
                      : msg.isHint
                      ? { background: "#fffbeb", color: "#78350f", border: "2px solid #fcd34d", borderRadius: "20px 20px 20px 6px", boxShadow: "0 4px 0 #fcd34d" }
                      : msg.responseIcon === "success"
                      ? { background: "#f0fdf4", color: "#14532d", border: "2px solid #86efac", borderRadius: "20px 20px 20px 6px", boxShadow: "0 4px 0 #86efac" }
                      : msg.responseIcon === "error"
                      ? { background: "#fff1f2", color: "#881337", border: "2px solid #fda4af", borderRadius: "20px 20px 20px 6px", boxShadow: "0 4px 0 #fda4af" }
                      : { background: "white", color: "#1f2937", border: "2px solid #e5f7d3", borderRadius: "20px 20px 20px 6px", boxShadow: "0 4px 0 #c8e6c9" }
                  }
                >
                  <div className="flex items-start gap-2">
                    {msg.responseIcon === "success" && <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#22c55e" }} />}
                    {msg.responseIcon === "error"   && <XCircle   className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#f43f5e" }} />}
                    <div className="min-w-0 w-full">
                      {msg.type === "bot"
                        ? <TypewriterText key={msg.id} text={msg.content} onDone={scrollToBottom} />
                        : <span className="whitespace-pre-line break-words">{msg.content}</span>
                      }

                      {msg.answerComparison && (
                        <div className="mt-2.5 pt-2.5 space-y-1.5" style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-black opacity-50">Ti:</span>
                            <span className="px-2 py-0.5 rounded-lg font-black" style={{ background: "#fecdd3", color: "#9f1239" }}>
                              {msg.answerComparison.userAnswer}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-black opacity-50">Saktë:</span>
                            <span className="px-2 py-0.5 rounded-lg font-black" style={{ background: "#bbf7d0", color: "#14532d" }}>
                              {msg.answerComparison.correctAnswer}
                            </span>
                          </div>
                        </div>
                      )}

                      {msg.score != null && (
                        <div className="flex items-center gap-1 mt-1.5 text-[11px] opacity-40 font-bold">
                          <Star className="w-3 h-3" /> {msg.score}%
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {msg.type === "user" && (
                <div className="w-9 h-9 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden"
                  style={{ background: "#1cb0f6", boxShadow: "0 3px 0 #0d9fd8" }}>
                  {userProfile?.profilePicture
                    ? <img src={userProfile.profilePicture} alt="" className="w-full h-full object-cover" />
                    : <User className="w-4 h-4 text-white" />}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-end gap-3">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#58cc02,#46a302)", boxShadow: "0 3px 0 #2d8500" }}>
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="px-5 py-4 rounded-3xl"
                style={{ background: "white", border: "2px solid #e5f7d3", borderRadius: "20px 20px 20px 6px", boxShadow: "0 4px 0 #c8e6c9" }}>
                <div className="flex gap-1.5 items-center">
                  <div className="w-2.5 h-2.5 rounded-full dot-1" style={{ background: "#58cc02" }} />
                  <div className="w-2.5 h-2.5 rounded-full dot-2" style={{ background: "#58cc02" }} />
                  <div className="w-2.5 h-2.5 rounded-full dot-3" style={{ background: "#58cc02" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ══════════════ INPUT ══════════════ */}
      <div className="flex-shrink-0 bg-white px-5 py-4" style={{ borderTop: "3px solid #e5f7d3" }}>
        <div className="max-w-3xl mx-auto w-full">

          <div className="mb-2.5">
            <button
              onClick={() => setShowGermanChars((p) => !p)}
              className="flex items-center gap-1 text-[11px] font-bold transition-colors"
              style={{ color: showGermanChars ? "#58cc02" : "#9ca3af" }}
            >
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showGermanChars ? "rotate-180" : ""}`} />
              Shkronja gjermane
            </button>
            {showGermanChars && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {germanChars.map((ch) => (
                  <button key={ch} onClick={() => insertCharacter(ch)}
                    className="w-9 h-9 rounded-xl text-sm font-black transition-all active:translate-y-0.5"
                    style={{ background: "white", border: "2px solid #e5e7eb", color: "#374151", boxShadow: "0 3px 0 #d1d5db" }}
                    onMouseEnter={e => Object.assign(e.currentTarget.style, { background: "#f0fdf4", borderColor: "#86efac", color: "#14532d", boxShadow: "0 3px 0 #86efac" })}
                    onMouseLeave={e => Object.assign(e.currentTarget.style, { background: "white", borderColor: "#e5e7eb", color: "#374151", boxShadow: "0 3px 0 #d1d5db" })}
                  >{ch}</button>
                ))}
              </div>
            )}
          </div>

          {currentQuestion?.hints && hintIndex < currentQuestion.hints.length && (
            <button onClick={showNextHint}
              className="flex items-center gap-1.5 text-xs font-black mb-2.5 transition-colors"
              style={{ color: "#d97706" }}>
              <Lightbulb className="w-3.5 h-3.5" />
              Ndihmë ({hintIndex + 1}/{currentQuestion.hints.length})
            </button>
          )}

          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              placeholder={currentQuestion ? "Shkruaj përgjigjen tënde..." : "Duke ngarkuar..."}
              disabled={loading || !currentQuestion}
              autoComplete="off"
              className="flex-1 rounded-2xl px-4 py-3 text-sm font-bold outline-none transition-all"
              style={{ background: "#f9fafb", border: "2px solid #e5e7eb", color: "#1f2937" }}
              onFocus={e => Object.assign(e.target.style, { borderColor: "#58cc02", background: "white" })}
              onBlur={e => Object.assign(e.target.style, { borderColor: "#e5e7eb", background: "#f9fafb" })}
            />
            <button
              type="submit"
              disabled={!currentInput.trim() || loading || !currentQuestion}
              className="px-5 py-3 rounded-2xl font-black text-white transition-all active:translate-y-0.5"
              style={(!currentInput.trim() || loading || !currentQuestion)
                ? { background: "#d1d5db", boxShadow: "none", cursor: "not-allowed" }
                : { background: "#58cc02", boxShadow: "0 4px 0 #46a302", cursor: "pointer" }
              }
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Chat