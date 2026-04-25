"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  pathService, pathTtsService,
  wordAudioService, createWordService, ttsService,
} from "../services/api"
import { useLanguage } from "../context/LanguageContext"
import { motion, AnimatePresence } from "framer-motion"
import {
  Volume2, Check, X, Lock, Zap, Trophy,
  Loader2, Flame, BookOpen, Target,
  Headphones, MessageSquare, Type, Layers, PenLine,
  RefreshCw, Star, Gem, Globe, Map,
  Eye, Award, ArrowRight, RotateCcw,
  CheckCircle, XCircle, AlertCircle, Heart,
  Delete, Send,
} from "lucide-react"

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"]
const PASS_THRESHOLD = 4

const LEVEL_COLORS = {
  A1: { from: "from-green-400",   to: "to-emerald-600",  ring: "ring-emerald-400",  bg: "bg-emerald-500",  text: "text-emerald-600",  shadow: "shadow-emerald-200" },
  A2: { from: "from-teal-400",    to: "to-cyan-600",     ring: "ring-cyan-400",     bg: "bg-cyan-500",     text: "text-cyan-600",     shadow: "shadow-cyan-200"    },
  B1: { from: "from-blue-400",    to: "to-indigo-600",   ring: "ring-blue-400",     bg: "bg-blue-500",     text: "text-blue-600",     shadow: "shadow-blue-200"    },
  B2: { from: "from-violet-400",  to: "to-purple-600",   ring: "ring-violet-400",   bg: "bg-violet-500",   text: "text-violet-600",   shadow: "shadow-violet-200"  },
  C1: { from: "from-orange-400",  to: "to-red-500",      ring: "ring-orange-400",   bg: "bg-orange-500",   text: "text-orange-600",   shadow: "shadow-orange-200"  },
  C2: { from: "from-rose-500",    to: "to-pink-700",     ring: "ring-rose-400",     bg: "bg-rose-600",     text: "text-rose-600",     shadow: "shadow-rose-200"    },
}

const NODE_ICONS = [
  Target, Star, Flame, Gem, Trophy, Zap, BookOpen, Globe,
  Eye, Award, Layers, PenLine, MessageSquare, Headphones,
  Map, Heart, CheckCircle, RefreshCw, RotateCcw, Star,
]

const EXERCISE_META = {
  listenTest:    { icon: Headphones,    label: "Dëgjo & Shkruaj",  color: "text-blue-600",    bg: "bg-blue-100"    },
  translate:     { icon: MessageSquare, label: "Përkthe",          color: "text-indigo-600",  bg: "bg-indigo-100"  },
  dictionaryWord:{ icon: BookOpen,      label: "Fjalor",           color: "text-teal-600",    bg: "bg-teal-100"    },
  wordAudio:     { icon: Volume2,       label: "Audio Fjale",      color: "text-purple-600",  bg: "bg-purple-100"  },
  phrase:        { icon: Type,          label: "Frazë",            color: "text-emerald-600", bg: "bg-emerald-100" },
  sentence:      { icon: Layers,        label: "Ndërtoni Fjali",   color: "text-orange-600",  bg: "bg-orange-100"  },
  createWord:    { icon: PenLine,       label: "Krijo Fjalën",     color: "text-violet-600",  bg: "bg-violet-100"  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Answer checking
// ─────────────────────────────────────────────────────────────────────────────
const normalize = (t = "") =>
  t.toLowerCase().trim().replace(/\s+/g, " ").replace(/[.!?;:,]+$/, "")

const jaccard = (a, b) => {
  const sa = new Set(normalize(a).split(/\s+/).filter(Boolean))
  const sb = new Set(normalize(b).split(/\s+/).filter(Boolean))
  if (!sa.size && !sb.size) return 1
  if (!sa.size || !sb.size) return 0
  const inter = new Set([...sa].filter((w) => sb.has(w)))
  return inter.size / new Set([...sa, ...sb]).size
}

const checkAnswer = (exercise, userAnswer) => {
  const correct = exercise.answer || ""
  if (!correct) return { isCorrect: false, score: 0 }
  if (["listenTest", "translate", "phrase"].includes(exercise.type)) {
    const score = Math.round(jaccard(userAnswer, correct) * 100)
    return { isCorrect: score >= 60, score }
  }
  const isCorrect = normalize(userAnswer) === normalize(correct)
  return { isCorrect, score: isCorrect ? 100 : 0 }
}

// ─────────────────────────────────────────────────────────────────────────────
// Audio hook (for mixed exercises)
// ─────────────────────────────────────────────────────────────────────────────
function useAudio(exercise, level) {
  const [url, setUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [playing, setPlaying] = useState(false)
  const ref = useRef(null)

  const load = useCallback(async () => {
    if (!exercise) return
    if (exercise.audioUrl) { setUrl(exercise.audioUrl); return }
    const text = exercise.audioText || exercise.question || ""
    if (!text) return
    setLoading(true)
    try {
      const res = await pathTtsService.getExerciseAudio(exercise._id, text, level || "A1")
      const u = res?.data?.url || res?.url
      if (u) setUrl(u)
    } catch { } finally { setLoading(false) }
  }, [exercise, level])

  useEffect(() => { if (url && ref.current) ref.current.src = url }, [url])

  useEffect(() => {
    if (!exercise) return
    if (["listenTest", "wordAudio"].includes(exercise.type)) load()
  }, [exercise, load])

  const play = useCallback(async () => {
    if (!url) { await load(); return }
    if (ref.current) { ref.current.currentTime = 0; ref.current.play().catch(() => {}) }
  }, [url, load])

  return { url, loading, playing, setPlaying, play, ref }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared UI primitives
// ─────────────────────────────────────────────────────────────────────────────
function AudioButton({ loading, playing, onClick, size = "md" }) {
  const sz = size === "lg" ? "w-20 h-20" : "w-12 h-12"
  const ic = size === "lg" ? "w-9 h-9" : "w-5 h-5"
  return (
    <button onClick={onClick} disabled={loading}
      className={`${sz} rounded-2xl flex items-center justify-center shadow-md transition-all
        ${playing ? "bg-blue-600 scale-95" : "bg-blue-500 hover:bg-blue-600 hover:scale-105"}`}>
      {loading ? <Loader2 className={`${ic} text-white animate-spin`} /> : <Volume2 className={`${ic} text-white`} />}
    </button>
  )
}

function SoundWave({ playing }) {
  if (!playing) return null
  return (
    <div className="flex gap-0.5 items-end justify-center mt-2 h-5">
      {[3, 5, 4, 6, 3, 5, 4].map((h, i) => (
        <div key={i} className="w-1 bg-blue-400 rounded-full animate-pulse"
          style={{ height: `${h * 3}px`, animationDelay: `${i * 0.08}s` }} />
      ))}
    </div>
  )
}

function InputField({ value, onChange, disabled, isCorrect, placeholder = "Shkruaj përgjigjen..." }) {
  return (
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
      disabled={disabled} placeholder={placeholder} autoFocus
      className={`w-full border-2 rounded-2xl p-4 text-base focus:outline-none transition-colors
        ${disabled
          ? isCorrect ? "border-green-400 bg-green-50 text-green-800" : "border-red-400 bg-red-50 text-red-800"
          : "border-gray-200 focus:border-blue-400 bg-white"}`} />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Exercise renderers (mixed path)
// ─────────────────────────────────────────────────────────────────────────────
function DictionaryExercise({ ex, value, onChange, submitted, result }) {
  const { loading, playing, setPlaying, play, ref } = useAudio(ex)
  const options = ex.options || []
  return (
    <div className="flex flex-col gap-5">
      <audio ref={ref} onPlay={() => setPlaying(true)} onEnded={() => setPlaying(false)} />
      <div className="text-center py-6 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl border border-teal-100">
        <p className="text-xs font-bold text-teal-500 uppercase tracking-widest mb-3">Cfarë do të thotë kjo?</p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-4xl font-extrabold text-gray-800">{ex.question}</span>
          <button onClick={play} disabled={loading} className="p-2 rounded-xl bg-white shadow hover:shadow-md transition-shadow">
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-teal-500" /> : <Volume2 className="w-4 h-4 text-teal-500" />}
          </button>
        </div>
      </div>
      {options.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {options.map((opt) => (
            <button key={opt} onClick={() => !submitted && onChange(opt)} disabled={submitted}
              className={`p-4 rounded-2xl border-2 text-sm font-bold transition-all
                ${submitted && opt === value ? result?.isCorrect ? "border-green-500 bg-green-100 text-green-700" : "border-red-500 bg-red-100 text-red-700"
                  : submitted && opt === ex.answer ? "border-green-500 bg-green-100 text-green-700"
                  : value === opt ? "border-teal-500 bg-teal-50 text-teal-700"
                  : "border-gray-200 bg-white hover:border-teal-300 hover:bg-teal-50 text-gray-700"}`}>
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <InputField value={value} onChange={onChange} disabled={submitted} isCorrect={result?.isCorrect} placeholder="Shkruaj përkthimin..." />
      )}
    </div>
  )
}

function PhraseExercise({ ex, value, onChange, submitted, result }) {
  const { loading, playing, setPlaying, play, ref } = useAudio(ex)
  return (
    <div className="flex flex-col gap-5">
      <audio ref={ref} onPlay={() => setPlaying(true)} onEnded={() => setPlaying(false)} />
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
        <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-3">Përkthe këtë frazë</p>
        <div className="flex items-start justify-between gap-3">
          <p className="text-xl font-bold text-gray-800 flex-1 leading-relaxed">{ex.question}</p>
          <button onClick={play} disabled={loading} className="p-2 rounded-xl bg-white shadow hover:shadow-md flex-shrink-0">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-emerald-500" /> : <Volume2 className="w-5 h-5 text-emerald-500" />}
          </button>
        </div>
        <SoundWave playing={playing} />
      </div>
      <InputField value={value} onChange={onChange} disabled={submitted} isCorrect={result?.isCorrect} placeholder="Shkruaj përkthimin..." />
    </div>
  )
}

function SentenceExercise({ ex, value, onChange, submitted, result }) {
  const rawWords = ex.words || (ex.answer ? ex.answer.split(/\s+/) : [])
  const [shuffled] = useState(() => [...rawWords].sort(() => Math.random() - 0.5))
  const [selected, setSelected] = useState([])
  const add = (word, idx) => { if (submitted) return; const n = [...selected, { word, idx }]; setSelected(n); onChange(n.map((w) => w.word).join(" ")) }
  const remove = (pos) => { if (submitted) return; const n = selected.filter((_, i) => i !== pos); setSelected(n); onChange(n.map((w) => w.word).join(" ")) }
  const usedIdx = new Set(selected.map((w) => w.idx))
  return (
    <div className="flex flex-col gap-5">
      {ex.question && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-2">Rregulloni fjalinë</p>
          <p className="text-sm font-semibold text-gray-700">{ex.question}</p>
        </div>
      )}
      <div className={`min-h-14 border-2 rounded-2xl p-4 flex flex-wrap gap-2 items-center transition-colors
        ${submitted ? result?.isCorrect ? "border-green-400 bg-green-50" : "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"}`}>
        {selected.length === 0 && <span className="text-gray-400 text-sm italic">Kliko fjalët për të ndërtuar fjalinë</span>}
        {selected.map((w, i) => (
          <button key={i} onClick={() => remove(i)} disabled={submitted}
            className="px-3 py-1.5 bg-blue-500 text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-colors shadow-sm">
            {w.word}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {shuffled.map((word, i) => (
          <button key={i} onClick={() => add(word, i)} disabled={submitted || usedIdx.has(i)}
            className={`px-3 py-2 rounded-xl border-2 text-sm font-bold transition-all
              ${usedIdx.has(i) ? "border-gray-100 text-gray-300 bg-gray-50 cursor-default" : "border-gray-300 text-gray-700 bg-white hover:border-blue-400 hover:bg-blue-50 shadow-sm"}`}>
            {word}
          </button>
        ))}
      </div>
    </div>
  )
}

function CreateWordExercise({ ex, value, onChange, submitted, result }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="bg-violet-50 border border-violet-200 rounded-2xl p-6 text-center">
        <p className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-3">Shkruaj fjalën</p>
        <p className="text-3xl text-gray-800 font-extrabold">{ex.question}</p>
        {ex.translation && ex.translation !== ex.question && <p className="text-sm text-gray-400 mt-2 italic">{ex.translation}</p>}
      </div>
      <InputField value={value} onChange={onChange} disabled={submitted} isCorrect={result?.isCorrect} placeholder="Shkruaj fjalën në gjermanisht..." />
    </div>
  )
}

function ListenExercise({ ex, value, onChange, submitted, result, level }) {
  const { loading, playing, setPlaying, play, ref } = useAudio(ex, level)
  return (
    <div className="flex flex-col gap-5">
      <audio ref={ref} onPlay={() => setPlaying(true)} onEnded={() => setPlaying(false)} />
      <div className="text-center bg-blue-50 border border-blue-100 rounded-2xl p-6">
        <p className="text-sm text-blue-500 mb-5 font-bold">Dëgjo me vëmendje dhe shkruaj çfarë dëgjon</p>
        <div className="flex flex-col items-center gap-2">
          <AudioButton loading={loading} playing={playing} onClick={play} size="lg" />
          <SoundWave playing={playing} />
        </div>
      </div>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} disabled={submitted} rows={3}
        placeholder="Shkruaj çfarë dëgjove..."
        className={`w-full border-2 rounded-2xl p-4 text-base resize-none focus:outline-none transition-colors
          ${submitted ? result?.isCorrect ? "border-green-400 bg-green-50" : "border-red-400 bg-red-50" : "border-gray-200 focus:border-blue-400 bg-white"}`} />
    </div>
  )
}

function TranslateExercise({ ex, value, onChange, submitted, result }) {
  const { loading, playing, setPlaying, play, ref } = useAudio(ex)
  return (
    <div className="flex flex-col gap-5">
      <audio ref={ref} onPlay={() => setPlaying(true)} onEnded={() => setPlaying(false)} />
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Përkthe në gjuhën tënde</p>
            <p className="text-xl font-bold text-gray-800 leading-relaxed">{ex.question}</p>
          </div>
          {ex.audioText && (
            <button onClick={play} disabled={loading} className="p-2 rounded-xl bg-white shadow hover:shadow-md flex-shrink-0">
              {loading ? <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> : <Volume2 className="w-4 h-4 text-indigo-500" />}
            </button>
          )}
        </div>
      </div>
      <InputField value={value} onChange={onChange} disabled={submitted} isCorrect={result?.isCorrect} placeholder="Shkruaj përkthimin..." />
    </div>
  )
}

function WordAudioExercise({ ex, value, onChange, submitted, result, level }) {
  const { loading, playing, setPlaying, play, ref } = useAudio(ex, level)
  const options = ex.options || []
  return (
    <div className="flex flex-col gap-5">
      <audio ref={ref} onPlay={() => setPlaying(true)} onEnded={() => setPlaying(false)} />
      <div className="text-center bg-purple-50 border border-purple-100 rounded-2xl p-6">
        <p className="text-sm text-purple-500 mb-5 font-bold">Dëgjo dhe zgjidhni fjalën e saktë</p>
        <div className="flex flex-col items-center gap-2">
          <AudioButton loading={loading} playing={playing} onClick={play} size="lg" />
          <SoundWave playing={playing} />
        </div>
      </div>
      {options.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {options.map((opt) => (
            <button key={opt} onClick={() => !submitted && onChange(opt)} disabled={submitted}
              className={`p-4 rounded-2xl border-2 text-sm font-bold transition-all
                ${submitted && opt === value ? result?.isCorrect ? "border-green-500 bg-green-100 text-green-700" : "border-red-500 bg-red-100 text-red-700"
                  : submitted && opt === ex.answer ? "border-green-500 bg-green-100 text-green-700"
                  : value === opt ? "border-purple-500 bg-purple-50 text-purple-700"
                  : "border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50 text-gray-700"}`}>
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <InputField value={value} onChange={onChange} disabled={submitted} isCorrect={result?.isCorrect} placeholder="Shkruaj fjalën..." />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Mixed exercise view (path rounds)
// ─────────────────────────────────────────────────────────────────────────────
function ExerciseView({ pathId, pathLevel, roundIndex, onBack, onComplete }) {
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [idx, setIdx] = useState(0)
  const [answer, setAnswer] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const [results, setResults] = useState([])
  const [phase, setPhase] = useState("playing")
  const [xpData, setXpData] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await pathService.getRound(pathId, roundIndex)
        const data = res?.data?.round || res?.round
        if (data?.exercises) setExercises(data.exercises.map((ex) => ({ ...ex, _level: pathLevel })))
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    load()
  }, [pathId, roundIndex, pathLevel])

  const current = exercises[idx]
  const total = exercises.length
  const progress = total > 0 ? (idx / total) * 100 : 0

  const handleCheck = () => {
    if (submitted || !current) return
    const isMulti = ["dictionaryWord", "wordAudio"].includes(current.type) && (current.options?.length > 0)
    if (!isMulti && !answer.trim()) return
    const r = checkAnswer(current, answer)
    setResult(r)
    setSubmitted(true)
  }

  const handleNext = async () => {
    const newResults = [...results, { exerciseIndex: idx, correct: result?.isCorrect || false, score: result?.score || 0 }]
    setResults(newResults)
    if (idx + 1 < exercises.length) {
      setIdx((i) => i + 1); setAnswer(""); setSubmitted(false); setResult(null)
    } else {
      const correctCount = newResults.filter((r) => r.correct).length
      setSaving(true)
      try {
        const res = await pathService.completeRound(pathId, roundIndex, newResults)
        const data = res?.data || res
        setXpData({ ...data, correctCount })
        setPhase(data.passed === false ? "failed" : "passed")
      } catch {
        setXpData({ xpAwarded: 0, score: 0, correctCount, passed: correctCount >= PASS_THRESHOLD })
        setPhase(correctCount >= PASS_THRESHOLD ? "passed" : "failed")
      }
      setSaving(false)
    }
  }

  const handleRetry = () => {
    setIdx(0); setAnswer(""); setSubmitted(false); setResult(null)
    setResults([]); setPhase("playing"); setXpData(null)
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      <p className="text-gray-500 text-sm font-semibold">Po ngarkohen ushtrimet...</p>
    </div>
  )

  if (phase === "failed") {
    const correctCount = xpData?.correctCount ?? results.filter((r) => r.correct).length
    const score = Math.round((correctCount / (total || 1)) * 100)
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-6 py-8 px-2 max-w-sm mx-auto">
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.5 }}
          className="w-24 h-24 rounded-3xl bg-gradient-to-br from-red-400 to-rose-600 flex items-center justify-center shadow-xl shadow-red-200">
          <XCircle className="w-12 h-12 text-white" />
        </motion.div>
        <div className="text-center">
          <h2 className="text-2xl font-extrabold text-gray-800">Provo Përsëri</h2>
          <p className="text-gray-500 text-sm mt-1.5">{correctCount} nga {total} të sakta &mdash; duhen {PASS_THRESHOLD} për të kaluar</p>
        </div>
        <div className="w-full">
          <div className="flex justify-between text-xs font-semibold text-gray-400 mb-2"><span>Rezultati</span><span className="text-red-500">{score}%</span></div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.8 }}
              className="h-full rounded-full bg-gradient-to-r from-red-400 to-rose-500" />
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Kufi kalimi: {PASS_THRESHOLD}/{total} të sakta</span>
          </div>
        </div>
        <div className="flex flex-col gap-3 w-full pt-2">
          <button onClick={handleRetry}
            className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-200 hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2">
            <RotateCcw className="w-5 h-5" /> Provo Përsëri
          </button>
          <button onClick={onBack} className="w-full py-3.5 rounded-2xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
            Kthehu te Harta
          </button>
        </div>
      </motion.div>
    )
  }

  if (phase === "passed") {
    const correctCount = xpData?.correctCount ?? results.filter((r) => r.correct).length
    const score = xpData?.score ?? Math.round((correctCount / (total || 1)) * 100)
    const perfect = correctCount === total
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-6 py-8 px-2 max-w-sm mx-auto">
        <motion.div animate={{ scale: [1, 1.2, 1], rotate: perfect ? [0, 8, -8, 0] : 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className={`w-24 h-24 rounded-3xl flex items-center justify-center shadow-xl
            ${perfect ? "bg-gradient-to-br from-yellow-400 to-orange-500 shadow-yellow-200" : "bg-gradient-to-br from-green-400 to-emerald-600 shadow-green-200"}`}>
          {perfect ? <Trophy className="w-12 h-12 text-white" /> : <CheckCircle className="w-12 h-12 text-white" />}
        </motion.div>
        <div className="text-center">
          <h2 className="text-2xl font-extrabold text-gray-800">{perfect ? "Perfekt!" : "Raundi Kaloi!"}</h2>
          <p className="text-gray-500 text-sm mt-1.5">{correctCount} nga {total} të sakta</p>
        </div>
        <div className="w-full">
          <div className="flex justify-between text-xs font-semibold text-gray-400 mb-2"><span>Rezultati</span><span className={perfect ? "text-yellow-500" : "text-green-500"}>{score}%</span></div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.9, delay: 0.2 }}
              className={`h-full rounded-full ${perfect ? "bg-gradient-to-r from-yellow-400 to-orange-500" : "bg-gradient-to-r from-green-400 to-emerald-500"}`} />
          </div>
        </div>
        {xpData?.xpAwarded > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
            className="flex items-center gap-2.5 bg-yellow-50 border border-yellow-200 rounded-2xl px-6 py-3.5">
            <Zap className="w-6 h-6 text-yellow-500" />
            <span className="font-extrabold text-yellow-700 text-2xl">+{xpData.xpAwarded} XP</span>
          </motion.div>
        )}
        {xpData?.pathCompleted && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-2xl px-5 py-3">
            <Trophy className="w-5 h-5 text-purple-600" />
            <span className="text-purple-700 font-bold text-sm">Rruga u Perfundua!</span>
          </motion.div>
        )}
        <button onClick={() => onComplete(xpData)}
          className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg shadow-green-200 hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 mt-2">
          Vazhdo <ArrowRight className="w-5 h-5" />
        </button>
      </motion.div>
    )
  }

  if (!current) return null
  const meta = EXERCISE_META[current.type] || EXERCISE_META.translate
  const ExIcon = meta.icon
  const isMultiChoice = ["dictionaryWord", "wordAudio"].includes(current.type) && (current.options?.length > 0)
  const canSubmit = isMultiChoice ? !!answer : !!answer.trim()

  return (
    <div className="flex flex-col min-h-[70vh]">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }}
            className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full" />
        </div>
        <span className="text-sm font-extrabold text-gray-500 tabular-nums min-w-[36px] text-right">{idx + 1}/{total}</span>
      </div>
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold mb-5 self-start ${meta.bg} ${meta.color}`}>
        <ExIcon className="w-3.5 h-3.5" /> {meta.label}
      </div>
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div key={idx} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.18 }}>
            {current.type === "dictionaryWord" && <DictionaryExercise ex={current} value={answer} onChange={setAnswer} submitted={submitted} result={result} />}
            {current.type === "phrase"          && <PhraseExercise    ex={current} value={answer} onChange={setAnswer} submitted={submitted} result={result} />}
            {current.type === "sentence"        && <SentenceExercise  ex={current} value={answer} onChange={setAnswer} submitted={submitted} result={result} />}
            {current.type === "createWord"      && <CreateWordExercise ex={current} value={answer} onChange={setAnswer} submitted={submitted} result={result} />}
            {current.type === "listenTest"      && <ListenExercise    ex={current} value={answer} onChange={setAnswer} submitted={submitted} result={result} level={pathLevel} />}
            {current.type === "translate"       && <TranslateExercise ex={current} value={answer} onChange={setAnswer} submitted={submitted} result={result} />}
            {current.type === "wordAudio"       && <WordAudioExercise ex={current} value={answer} onChange={setAnswer} submitted={submitted} result={result} level={pathLevel} />}
          </motion.div>
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {submitted && result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`mt-5 rounded-2xl p-4 flex items-start gap-3 ${result.isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
            <div className={`p-1.5 rounded-full flex-shrink-0 ${result.isCorrect ? "bg-green-500" : "bg-red-500"}`}>
              {result.isCorrect ? <Check className="w-4 h-4 text-white" /> : <X className="w-4 h-4 text-white" />}
            </div>
            <div>
              <p className={`text-sm font-bold ${result.isCorrect ? "text-green-700" : "text-red-700"}`}>{result.isCorrect ? "Saktë!" : "Jo saktë"}</p>
              {!result.isCorrect && <p className="text-xs text-red-600 mt-0.5">Përgjigja e saktë: <span className="font-bold">{current?.answer || "—"}</span></p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mt-5">
        {!submitted ? (
          <button onClick={handleCheck} disabled={!canSubmit}
            className="w-full py-4 rounded-2xl font-extrabold text-base text-white shadow-lg transition-all bg-gradient-to-r from-blue-500 to-indigo-600 shadow-blue-200 disabled:from-gray-200 disabled:to-gray-300 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed hover:enabled:shadow-xl hover:enabled:-translate-y-0.5">
            Kontrollo
          </button>
        ) : (
          <button onClick={handleNext} disabled={saving}
            className="w-full py-4 rounded-2xl font-extrabold text-base text-white shadow-lg bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-200 hover:shadow-xl hover:-translate-y-0.5 transition-all">
            {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : idx + 1 < total ? "Tjetër" : "Përfundo Raundin"}
          </button>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// WordAudio matching quiz (full page)
// ─────────────────────────────────────────────────────────────────────────────
async function playWordAudio(text, setId, wordIndex, level, language) {
  try {
    const url = await ttsService.getWordAudioAudio(setId, wordIndex, text, level, language)
    const audio = new Audio(url)
    audio.play()
  } catch {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      const utt = new SpeechSynthesisUtterance(text)
      utt.lang = { de: "de-DE", en: "en-GB", fr: "fr-FR", tr: "tr-TR", it: "it-IT" }[language] || "de-DE"
      utt.rate = 0.9
      window.speechSynthesis.speak(utt)
    }
  }
}

function WordAudioQuizView({ set, language, onBack, onComplete }) {
  const [matched, setMatched] = useState({})
  const [selectedGerman, setSelectedGerman] = useState(null)
  const [wrongPair, setWrongPair] = useState(null)
  const [speaking, setSpeaking] = useState(null)
  const [phase, setPhase] = useState("playing") // "playing" | "done"
  const [xpData, setXpData] = useState(null)
  const [saving, setSaving] = useState(false)

  const shuffledAlbanian = useRef([...set.words].sort(() => Math.random() - 0.5)).current
  const progress = (Object.keys(matched).length / set.words.length) * 100

  const handleGermanClick = (word, index) => {
    if (matched[word.germanWord]) return
    setSpeaking(word.germanWord)
    playWordAudio(word.germanWord, set._id, index, set.level, language)
    setSelectedGerman(word)
    setTimeout(() => setSpeaking(null), 2000)
  }

  const handleAlbanianClick = async (albanianWord) => {
    if (!selectedGerman) return
    if (Object.values(matched).includes(albanianWord)) return
    const isCorrect = selectedGerman.albanianWord === albanianWord
    if (isCorrect) {
      const newMatched = { ...matched, [selectedGerman.germanWord]: albanianWord }
      setMatched(newMatched)
      setSelectedGerman(null)
      setWrongPair(null)
      if (Object.keys(newMatched).length === set.words.length) {
        setSaving(true)
        try {
          const res = await wordAudioService.submitQuiz(set._id, set.words.length, set.words.length)
          setXpData(res.data || { passed: true, percentage: 100, xpAwarded: set.xp })
        } catch {
          setXpData({ passed: true, percentage: 100, xpAwarded: set.xp })
        }
        setSaving(false)
        setPhase("done")
      }
    } else {
      setWrongPair({ german: selectedGerman.germanWord, albanian: albanianWord })
      setTimeout(() => { setWrongPair(null); setSelectedGerman(null) }, 700)
    }
  }

  if (phase === "done") {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-6 py-8 px-2 max-w-sm mx-auto">
        <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 8, -8, 0] }} transition={{ duration: 0.6 }}
          className="w-24 h-24 rounded-3xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-xl shadow-yellow-200">
          <Trophy className="w-12 h-12 text-white" />
        </motion.div>
        <div className="text-center">
          <h2 className="text-2xl font-extrabold text-gray-800">Perfekt!</h2>
          <p className="text-gray-500 text-sm mt-1.5">Ke çiftëzuar të gjitha {set.words.length} fjalët</p>
        </div>
        {xpData?.xpAwarded > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
            className="flex items-center gap-2.5 bg-yellow-50 border border-yellow-200 rounded-2xl px-6 py-3.5">
            <Zap className="w-6 h-6 text-yellow-500" />
            <span className="font-extrabold text-yellow-700 text-2xl">+{xpData.xpAwarded} XP</span>
          </motion.div>
        )}
        <button onClick={() => onComplete(xpData)}
          className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg shadow-green-200 hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 mt-2">
          Vazhdo <ArrowRight className="w-5 h-5" />
        </button>
      </motion.div>
    )
  }

  return (
    <div className="flex flex-col min-h-[70vh]">
      {/* Top bar */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
          <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }}
            className="h-full bg-gradient-to-r from-pink-400 to-rose-500 rounded-full" />
        </div>
        <span className="text-sm font-extrabold text-gray-500 tabular-nums min-w-[36px] text-right">
          {Object.keys(matched).length}/{set.words.length}
        </span>
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold mb-5 self-start bg-pink-100 text-pink-600">
        <Volume2 className="w-3.5 h-3.5" /> Bashko Fjalët
      </div>

      <p className="text-xs text-gray-400 text-center mb-4 font-medium">
        Kliko një fjalë gjermane, pastaj çiftëzoje me shqipen
      </p>

      {saving && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
        </div>
      )}

      <div className="flex gap-3 flex-1">
        {/* German column */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center justify-center gap-1.5 py-2 bg-gray-900 rounded-xl mb-1">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Gjermanisht</span>
          </div>
          {set.words.map((word, idx) => {
            const isMatched = !!matched[word.germanWord]
            const isSelected = selectedGerman?.germanWord === word.germanWord
            const isWrong = wrongPair?.german === word.germanWord
            const isSpeaking = speaking === word.germanWord
            return (
              <motion.button key={`g-${idx}`} onClick={() => handleGermanClick(word, idx)}
                disabled={isMatched} whileTap={{ scale: 0.96 }}
                className={`w-full px-3 py-2.5 rounded-xl border-2 font-bold text-xs transition-all flex items-center gap-2
                  ${isMatched ? "bg-emerald-50 border-emerald-300 text-emerald-600"
                    : isWrong ? "bg-red-50 border-red-400 text-red-600"
                    : isSpeaking ? "bg-gradient-to-r from-amber-400 to-orange-400 border-amber-300 text-white shadow-md"
                    : isSelected ? "bg-gradient-to-r from-blue-500 to-cyan-500 border-blue-400 text-white shadow-md"
                    : "bg-white border-gray-200 text-gray-700 hover:border-pink-400 hover:shadow-sm cursor-pointer"}`}>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0
                  ${isMatched ? "bg-emerald-100" : isSelected || isSpeaking ? "bg-white/20" : "bg-gray-100"}`}>
                  {isMatched ? <Check className="h-3 w-3 text-emerald-600" /> : <Volume2 className={`h-3 w-3 ${isSelected || isSpeaking ? "text-white" : "text-gray-600"}`} />}
                </div>
                <span className="truncate">{word.germanWord}</span>
              </motion.button>
            )
          })}
        </div>

        {/* Albanian column */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center justify-center gap-1.5 py-2 bg-red-700 rounded-xl mb-1">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Shqip</span>
          </div>
          {shuffledAlbanian.map((word, idx) => {
            const isMatched = Object.values(matched).includes(word.albanianWord)
            const isWrong = wrongPair?.albanian === word.albanianWord
            return (
              <motion.button key={`a-${idx}`} onClick={() => handleAlbanianClick(word.albanianWord)}
                disabled={isMatched} whileTap={{ scale: 0.96 }}
                className={`w-full px-3 py-2.5 rounded-xl border-2 font-bold text-xs transition-all flex items-center gap-2
                  ${isMatched ? "bg-emerald-50 border-emerald-300 text-emerald-600"
                    : isWrong ? "bg-red-50 border-red-400 text-red-600 animate-pulse"
                    : selectedGerman ? "bg-white border-red-300 text-gray-700 hover:border-red-500 hover:bg-red-50 cursor-pointer hover:shadow-sm"
                    : "bg-gray-50 border-gray-200 text-gray-400 cursor-default"}`}>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${isMatched ? "bg-emerald-100" : selectedGerman ? "bg-red-100" : "bg-gray-100"}`}>
                  {isMatched ? <Check className="h-3 w-3 text-emerald-600" /> : isWrong ? <X className="h-3 w-3 text-red-500" /> : <span className="text-xs">SQ</span>}
                </div>
                <span className="flex-1 text-left truncate">{word.albanianWord}</span>
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CreateWord letter scramble (full page)
// ─────────────────────────────────────────────────────────────────────────────
const shuffleLetters = (word) => {
  const letters = word.split("")
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]]
  }
  return letters
}

function CreateWordQuizView({ lesson, onBack, onComplete }) {
  const [wordIdx, setWordIdx] = useState(0)
  const [userAnswers, setUserAnswers] = useState([])
  const [currentAnswer, setCurrentAnswer] = useState("")
  const [usedIndices, setUsedIndices] = useState([])
  const [shuffled, setShuffled] = useState(() => shuffleLetters(lesson.words[0].german))
  const [phase, setPhase] = useState("playing") // "playing" | "results"
  const [results, setResults] = useState(null)
  const [saving, setSaving] = useState(false)

  const currentWord = lesson.words[wordIdx]
  const progress = ((wordIdx + 1) / lesson.words.length) * 100

  const handleLetterClick = (letter, idx) => {
    setCurrentAnswer((p) => p + letter)
    setUsedIndices((p) => [...p, idx])
  }

  const handleBackspace = () => {
    setCurrentAnswer((p) => p.slice(0, -1))
    setUsedIndices((p) => p.slice(0, -1))
  }

  const handleSubmit = async () => {
    if (!currentAnswer.trim()) return
    const newAnswers = [...userAnswers, currentAnswer]
    setUserAnswers(newAnswers)
    setCurrentAnswer("")

    if (wordIdx < lesson.words.length - 1) {
      const nextIdx = wordIdx + 1
      setWordIdx(nextIdx)
      setUsedIndices([])
      setShuffled(shuffleLetters(lesson.words[nextIdx].german))
    } else {
      setSaving(true)
      try {
        const res = await createWordService.submitLesson(lesson._id, newAnswers)
        setResults(res.data)
      } catch {
        const correct = newAnswers.filter((a, i) => normalize(a) === normalize(lesson.words[i]?.german || "")).length
        setResults({ passed: correct >= Math.ceil(lesson.words.length * 0.75), scorePercentage: Math.round((correct / lesson.words.length) * 100), correctCount: correct, totalWords: lesson.words.length, xpAwarded: correct === lesson.words.length ? lesson.xp : 0, results: newAnswers.map((a, i) => ({ userAnswer: a, isCorrect: normalize(a) === normalize(lesson.words[i]?.german || "") })) })
      }
      setSaving(false)
      setPhase("results")
    }
  }

  if (phase === "results" && results) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-5 max-w-sm mx-auto py-4">
        <div className="text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}
            className="mb-3 flex justify-center">
            {results.passed
              ? <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-xl shadow-yellow-200"><Trophy className="w-10 h-10 text-white" /></div>
              : <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-400 to-rose-600 flex items-center justify-center shadow-xl shadow-red-200"><XCircle className="w-10 h-10 text-white" /></div>}
          </motion.div>
          <h2 className={`text-2xl font-extrabold mb-1 ${results.passed ? "text-gray-800" : "text-gray-800"}`}>
            {results.passed ? "Urime!" : "Vazhdo të Mësosh!"}
          </h2>
          <p className="text-sm text-gray-500">{results.passed ? "Kalove mësimin me sukses!" : "Nevojitet 75% ose më shumë"}</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Rezultati", value: `${results.scorePercentage}%`, color: "text-emerald-600", bg: "from-emerald-50 to-teal-50 border-emerald-200" },
            { label: "Të sakta", value: `${results.correctCount}/${results.totalWords}`, color: "text-teal-600", bg: "from-teal-50 to-cyan-50 border-teal-200" },
            { label: "XP Fituar", value: `+${results.xpAwarded || 0}`, color: "text-amber-600", bg: "from-amber-50 to-yellow-50 border-amber-200" },
          ].map((s) => (
            <div key={s.label} className={`bg-gradient-to-br ${s.bg} rounded-2xl p-3 text-center border`}>
              <p className="text-[10px] text-gray-400 mb-1 font-bold uppercase tracking-wide">{s.label}</p>
              <p className={`text-lg font-extrabold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          {results.results?.map((r, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${r.isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{lesson.words[i]?.albanian}</span>
                  <span className="text-xs text-gray-400">→</span>
                  <span className={`text-sm font-bold font-mono ${r.isCorrect ? "text-emerald-700" : "text-red-600"}`}>{r.userAnswer}</span>
                </div>
                {!r.isCorrect && <p className="text-xs text-emerald-600 mt-0.5">E saktë: <span className="font-bold font-mono">{lesson.words[i]?.german}</span></p>}
              </div>
              {r.isCorrect ? <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
            </div>
          ))}
        </div>

        <button onClick={() => onComplete(results)}
          className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg shadow-emerald-200 hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2">
          Kthehu te Harta <ArrowRight className="w-5 h-5" />
        </button>
      </motion.div>
    )
  }

  return (
    <div className="flex flex-col min-h-[70vh]">
      {/* Top bar */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
          <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }}
            className="h-full bg-gradient-to-r from-violet-400 to-purple-500 rounded-full" />
        </div>
        <span className="text-sm font-extrabold text-gray-500 tabular-nums min-w-[36px] text-right">{wordIdx + 1}/{lesson.words.length}</span>
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold mb-5 self-start bg-violet-100 text-violet-600">
        <PenLine className="w-3.5 h-3.5" /> Formo Fjalën
      </div>

      {/* Albanian prompt */}
      <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5 text-center mb-5">
        <p className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-2">Formo fjalën gjermane për:</p>
        <AnimatePresence mode="wait">
          <motion.p key={currentWord?.albanian} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="text-3xl font-extrabold text-gray-800">{currentWord?.albanian}</motion.p>
        </AnimatePresence>
      </div>

      {/* Answer display */}
      <div className="bg-gray-50 border-2 border-violet-100 rounded-2xl p-4 min-h-16 flex items-center justify-center mb-5">
        <motion.p key={currentAnswer} initial={{ scale: 0.95 }} animate={{ scale: 1 }}
          className="text-2xl font-bold tracking-widest font-mono" style={{ color: currentAnswer ? "#1a1a1a" : "#ccc" }}>
          {currentAnswer || "..."}
        </motion.p>
      </div>

      {/* Letter tiles */}
      <div className="flex flex-wrap gap-2 justify-center mb-5">
        {shuffled.map((letter, i) => {
          const isUsed = usedIndices.includes(i)
          return (
            <motion.button key={i} onClick={() => !isUsed && handleLetterClick(letter, i)} disabled={isUsed}
              whileHover={!isUsed ? { scale: 1.1 } : {}} whileTap={!isUsed ? { scale: 0.9 } : {}}
              animate={{ opacity: isUsed ? 0.25 : 1, scale: isUsed ? 0.85 : 1 }} transition={{ duration: 0.15 }}
              className={`w-12 h-12 rounded-xl text-lg font-extrabold flex items-center justify-center shadow-sm transition-all
                ${isUsed ? "bg-gray-100 border-2 border-gray-200 text-gray-300 cursor-default"
                  : "bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200 text-violet-800 cursor-pointer hover:from-violet-100 hover:to-purple-100 hover:border-violet-300 hover:shadow-md"}`}>
              {letter.toUpperCase()}
            </motion.button>
          )
        })}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button onClick={handleBackspace}
          className="flex-1 py-3.5 rounded-2xl bg-gray-100 border border-gray-200 text-gray-600 text-sm font-bold cursor-pointer flex items-center justify-center gap-2 hover:bg-gray-200 transition-all">
          <Delete className="w-4 h-4" /> Fshi
        </button>
        <button onClick={handleSubmit} disabled={!currentAnswer.trim() || saving}
          className={`flex-[2] py-3.5 rounded-2xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg
            ${currentAnswer.trim() && !saving
              ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white cursor-pointer hover:from-violet-600 hover:to-purple-700 shadow-violet-200"
              : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"}`}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Dërgo</>}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Path map
// ─────────────────────────────────────────────────────────────────────────────
function PathMap({ path, userProgress, onSelectRound }) {
  const completedSet = new Set((userProgress?.completedRounds || []))
  const currentIdx = userProgress?.currentRoundIndex ?? 0
  const colors = LEVEL_COLORS[path.level] || LEVEL_COLORS.A1

  return (
    <div className="flex flex-col items-center gap-0 py-4">
      {path.rounds?.map((round, i) => {
        const isCompleted = completedSet.has(i)
        const isActive = i === currentIdx
        const isLocked = i > currentIdx
        const offset = i % 4 === 0 ? "ml-0" : i % 4 === 1 ? "ml-16" : i % 4 === 2 ? "ml-24" : "ml-8"
        const NodeIcon = NODE_ICONS[i % NODE_ICONS.length]
        return (
          <div key={round._id || i} className="flex flex-col items-center">
            {i > 0 && <div className="w-0.5 h-8 bg-gray-200" />}
            <div className={offset}>
              <motion.button whileHover={!isLocked ? { scale: 1.08 } : {}} whileTap={!isLocked ? { scale: 0.93 } : {}}
                onClick={() => !isLocked && onSelectRound(i)}
                className={`relative w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg transition-all select-none
                  ${isLocked ? "bg-gray-100 cursor-not-allowed shadow-sm border-2 border-gray-200"
                    : isActive ? `bg-gradient-to-br ${colors.from} ${colors.to} ring-4 ring-offset-2 ${colors.ring} shadow-xl ${colors.shadow}`
                    : `bg-gradient-to-br ${colors.from} ${colors.to} shadow-md ${colors.shadow}`}`}>
                {isActive && <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.25, 0, 0.25] }} transition={{ duration: 2, repeat: Infinity }} className={`absolute inset-0 rounded-2xl ${colors.bg}`} />}
                {isLocked ? <Lock className="w-8 h-8 text-gray-300" /> : <NodeIcon className="w-10 h-10 text-white relative z-10" />}
                {isCompleted && (
                  <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md border-2 border-white">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </motion.button>
              <div className="text-center mt-2 w-20">
                <p className={`text-xs font-bold leading-tight truncate ${isLocked ? "text-gray-300" : "text-gray-600"}`}>{round.title}</p>
                {!isLocked && (
                  <div className="flex items-center justify-center gap-0.5 mt-0.5">
                    <Zap className="w-2.5 h-2.5 text-yellow-500" />
                    <span className="text-xs text-yellow-600 font-bold">{round.xpReward}</span>
                  </div>
                )}
              </div>
              {isActive && !isCompleted && (
                <motion.div animate={{ y: [0, 4, 0] }} transition={{ duration: 1.2, repeat: Infinity }} className="flex justify-center mt-1.5">
                  <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full text-white ${colors.bg}`}>
                    {(userProgress?.completedCount || 0) > 0 ? "VAZHDO" : "FILLO"}
                  </span>
                </motion.div>
              )}
            </div>
          </div>
        )
      })}
      {path.rounds?.length > 0 && (userProgress?.completedRounds?.length || 0) >= path.rounds.length && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="mt-10 bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6 text-center w-full max-w-xs shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-3 shadow-md shadow-yellow-200">
            <Trophy className="w-7 h-7 text-white" />
          </div>
          <h3 className="font-extrabold text-orange-800 text-lg">Rruga Perfundoi!</h3>
          <p className="text-sm text-orange-600 mt-1">Ke perfunduar te gjitha {path.rounds.length} raundet!</p>
        </motion.div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// WordAudio section cards
// ─────────────────────────────────────────────────────────────────────────────
function WordAudioSection({ sets, finishedIds, loading, onSelect }) {
  if (loading) return (
    <div className="flex justify-center py-8">
      <Loader2 className="w-6 h-6 text-pink-400 animate-spin" />
    </div>
  )
  if (!sets.length) return (
    <div className="text-center py-6 text-gray-400 text-sm">Nuk ka sete për këtë nivel</div>
  )
  return (
    <div className="grid grid-cols-2 gap-3">
      {sets.map((set) => {
        const done = finishedIds.includes(set._id)
        return (
          <motion.button key={set._id} onClick={() => onSelect(set)}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            className={`p-4 rounded-2xl border-2 text-left transition-all shadow-sm hover:shadow-md
              ${done ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300" : "bg-white border-gray-200 hover:border-pink-300"}`}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className={`p-1.5 rounded-xl ${done ? "bg-amber-100" : "bg-pink-100"}`}>
                <Volume2 className={`w-4 h-4 ${done ? "text-amber-600" : "text-pink-600"}`} />
              </div>
              {done && <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />}
            </div>
            <p className={`text-sm font-bold truncate leading-snug ${done ? "text-amber-700" : "text-gray-800"}`}>{set.title}</p>
            <p className={`text-xs mt-1 ${done ? "text-amber-500" : "text-gray-400"}`}>{set.words?.length} fjalë</p>
            <div className="mt-2.5 flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-500" />
              <span className="text-xs font-bold text-yellow-600">{set.xp} XP</span>
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CreateWord section cards
// ─────────────────────────────────────────────────────────────────────────────
function CreateWordSection({ lessons, finishedIds, loading, onSelect }) {
  if (loading) return (
    <div className="flex justify-center py-8">
      <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
    </div>
  )
  if (!lessons.length) return (
    <div className="text-center py-6 text-gray-400 text-sm">Nuk ka mësime për këtë nivel</div>
  )
  return (
    <div className="grid grid-cols-2 gap-3">
      {lessons.map((lesson) => {
        const done = finishedIds.includes(lesson._id)
        return (
          <motion.button key={lesson._id} onClick={() => onSelect(lesson)}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            className={`p-4 rounded-2xl border-2 text-left transition-all shadow-sm hover:shadow-md
              ${done ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300" : "bg-white border-gray-200 hover:border-violet-300"}`}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className={`p-1.5 rounded-xl ${done ? "bg-amber-100" : "bg-violet-100"}`}>
                <PenLine className={`w-4 h-4 ${done ? "text-amber-600" : "text-violet-600"}`} />
              </div>
              {done && <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />}
            </div>
            <p className={`text-sm font-bold truncate leading-snug ${done ? "text-amber-700" : "text-gray-800"}`}>{lesson.title}</p>
            <p className={`text-xs mt-1 ${done ? "text-amber-500" : "text-gray-400"}`}>{lesson.words?.length} fjalë</p>
            <div className="mt-2.5 flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-500" />
              <span className="text-xs font-bold text-yellow-600">{lesson.xp} XP</span>
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section header
// ─────────────────────────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, subtitle, gradient }) {
  return (
    <div className={`rounded-2xl bg-gradient-to-r ${gradient} p-4 mb-4`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-extrabold text-white text-base leading-tight">{title}</h2>
          {subtitle && <p className="text-white/70 text-xs mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page header
// ─────────────────────────────────────────────────────────────────────────────
function PageHeader({ level, xpEarned, completedCount, totalRounds, colors }) {
  const pct = totalRounds > 0 ? Math.round((completedCount / totalRounds) * 100) : 0
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${colors.from} ${colors.to} p-5 mb-6 relative overflow-hidden shadow-lg ${colors.shadow}`}>
      <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Map className="w-3.5 h-3.5 text-white/60" />
              <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Rruga e te Nxenit</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white leading-tight">Gjermanisht {level}</h1>
            <p className="text-sm text-white/65 mt-0.5">{completedCount} nga {totalRounds} raunde te kryera</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
              <Zap className="w-4 h-4 text-yellow-300" />
              <span className="text-sm font-extrabold text-white">{xpEarned} XP</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-300" />
              <span className="text-xs font-extrabold text-white">{level}</span>
            </div>
          </div>
        </div>
        {totalRounds > 0 && (
          <div className="mt-4">
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                className="h-full bg-white rounded-full" />
            </div>
            <p className="text-xs text-white/50 mt-1 text-right">{pct}% e perfunduar</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Mini header shown during quizzes
// ─────────────────────────────────────────────────────────────────────────────
function QuizMiniHeader({ title, xp, colors }) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${colors.from} ${colors.to} px-5 py-3 mb-6 flex items-center justify-between shadow-md ${colors.shadow}`}>
      <div className="flex items-center gap-2">
        <Map className="w-4 h-4 text-white/70" />
        <span className="text-sm font-bold text-white/80">{title}</span>
      </div>
      {xp > 0 && (
        <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1">
          <Zap className="w-3.5 h-3.5 text-yellow-300" />
          <span className="text-xs font-bold text-white">{xp} XP</span>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function PathPage() {
  const { language } = useLanguage()
  const [level, setLevel] = useState("A1")

  // Main path state
  const [path, setPath] = useState(null)
  const [userProgress, setUserProgress] = useState(null)
  const [pageState, setPageState] = useState("idle")
  const [errorMsg, setErrorMsg] = useState("")

  // WordAudio state
  const [wordAudioSets, setWordAudioSets] = useState([])
  const [waFinished, setWaFinished] = useState([])
  const [waLoading, setWaLoading] = useState(false)

  // CreateWord state
  const [createWordLessons, setCreateWordLessons] = useState([])
  const [cwFinished, setCwFinished] = useState([])
  const [cwLoading, setCwLoading] = useState(false)

  // View routing
  const [view, setView] = useState("map") // "map" | "exercise" | "wordaudio" | "createword"
  const [activeRound, setActiveRound] = useState(null)
  const [activeWordSet, setActiveWordSet] = useState(null)
  const [activeCreateLesson, setActiveCreateLesson] = useState(null)

  // ── Load main path ─────────────────────────────────────────────────────────
  const loadPath = useCallback(async (forceRegenerate = false) => {
    setPageState(forceRegenerate ? "generating" : "loading")
    setErrorMsg("")
    try {
      if (!forceRegenerate) {
        const res = await pathService.getAllPaths({ level, language })
        const data = res?.data || res
        const existing = (data?.paths || []).find((p) => p.level === level)
        if (existing) {
          const detail = await pathService.getPathById(existing._id)
          const d = detail?.data || detail
          setPath(d.path)
          setUserProgress(d.userProgress)
          setPageState("ready")
          return
        }
      }
      setPageState("generating")
      const gen = await pathService.generatePath(level, language, forceRegenerate)
      const generated = gen?.data || gen
      const detail = await pathService.getPathById(generated._id)
      const d = detail?.data || detail
      setPath(d.path)
      setUserProgress(d.userProgress)
      setPageState("ready")
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || err?.message || "Ndodhi nje gabim")
      setPageState("error")
    }
  }, [level, language])

  // ── Load WordAudio sets ────────────────────────────────────────────────────
  const loadWordAudio = useCallback(async () => {
    setWaLoading(true)
    try {
      const [setsRes, finishedRes] = await Promise.all([
        wordAudioService.getAllSets({ level }, language),
        wordAudioService.getFinishedSets(),
      ])
      setWordAudioSets(setsRes?.data || [])
      const finishedData = finishedRes?.data || {}
      const ids = finishedData.finishedIds || []
      setWaFinished(ids.map((item) => item.setId || item._id || item.toString()))
    } catch { setWordAudioSets([]) }
    setWaLoading(false)
  }, [level, language])

  // ── Load CreateWord lessons ────────────────────────────────────────────────
  const loadCreateWord = useCallback(async () => {
    setCwLoading(true)
    try {
      const [lessonsRes, finishedRes] = await Promise.all([
        createWordService.getAllLessons({ level, language }),
        createWordService.getFinishedLessons(),
      ])
      setCreateWordLessons(lessonsRes?.data || [])
      const finishedData = finishedRes?.data || []
      setCwFinished(Array.isArray(finishedData) ? finishedData.map((l) => l._id || l) : [])
    } catch { setCreateWordLessons([]) }
    setCwLoading(false)
  }, [level, language])

  useEffect(() => {
    loadPath()
    loadWordAudio()
    loadCreateWord()
  }, [loadPath, loadWordAudio, loadCreateWord])

  const refreshProgress = useCallback(async () => {
    if (!path) return
    try {
      const detail = await pathService.getPathById(path._id)
      const d = detail?.data || detail
      setPath(d.path)
      setUserProgress(d.userProgress)
    } catch {}
  }, [path])

  const colors = LEVEL_COLORS[level] || LEVEL_COLORS.A1

  // ── WordAudio quiz view ────────────────────────────────────────────────────
  if (view === "wordaudio" && activeWordSet) {
    return (
      <div className="max-w-lg mx-auto pb-20">
        <QuizMiniHeader title={activeWordSet.title} xp={activeWordSet.xp} colors={colors} />
        <WordAudioQuizView
          set={activeWordSet}
          language={language}
          onBack={() => { setView("map"); setActiveWordSet(null) }}
          onComplete={() => {
            setView("map")
            setActiveWordSet(null)
            loadWordAudio()
          }}
        />
      </div>
    )
  }

  // ── CreateWord quiz view ───────────────────────────────────────────────────
  if (view === "createword" && activeCreateLesson) {
    return (
      <div className="max-w-lg mx-auto pb-20">
        <QuizMiniHeader title={activeCreateLesson.title} xp={activeCreateLesson.xp} colors={colors} />
        <CreateWordQuizView
          lesson={activeCreateLesson}
          onBack={() => { setView("map"); setActiveCreateLesson(null) }}
          onComplete={() => {
            setView("map")
            setActiveCreateLesson(null)
            loadCreateWord()
          }}
        />
      </div>
    )
  }

  // ── Exercise view ──────────────────────────────────────────────────────────
  if (view === "exercise" && activeRound !== null && path) {
    return (
      <div className="max-w-lg mx-auto pb-20">
        <QuizMiniHeader
          title={path.rounds?.[activeRound]?.title || `Raundi ${activeRound + 1}`}
          xp={path.rounds?.[activeRound]?.xpReward || 0}
          colors={colors}
        />
        <ExerciseView
          pathId={path._id}
          pathLevel={path.level}
          roundIndex={activeRound}
          onBack={() => { setView("map"); setActiveRound(null) }}
          onComplete={() => { setView("map"); setActiveRound(null); refreshProgress() }}
        />
      </div>
    )
  }

  // ── Map view ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto pb-20">
      <PageHeader
        level={level}
        xpEarned={userProgress?.totalXpEarned || 0}
        completedCount={userProgress?.completedCount || 0}
        totalRounds={path?.rounds?.length || 0}
        colors={colors}
      />

      {/* Level selector */}
      <div className="flex gap-2 flex-wrap mb-6">
        {LEVELS.map((lvl) => {
          const c = LEVEL_COLORS[lvl]
          return (
            <button key={lvl} onClick={() => setLevel(lvl)}
              className={`px-4 py-2 rounded-full text-sm font-extrabold border-2 transition-all
                ${level === lvl
                  ? `bg-gradient-to-r ${c.from} ${c.to} text-white border-transparent shadow-md`
                  : "bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600"}`}>
              {lvl}
            </button>
          )
        })}
      </div>

      {/* ── Main path ─────────────────────────────────────────────────────── */}
      <SectionHeader
        icon={Map}
        title="Rruga Kryesore"
        subtitle="Ushtrime te perziera — duhen 4/6 per te kaluar"
        gradient="from-blue-500 to-indigo-600"
      />

      {(pageState === "loading" || pageState === "generating") && (
        <div className="flex flex-col items-center gap-5 py-14">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colors.from} ${colors.to} flex items-center justify-center shadow-lg ${colors.shadow}`}>
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-gray-700 font-bold">{pageState === "generating" ? "Po ndertojme rrugën..." : "Po ngarkohet..."}</p>
            {pageState === "generating" && <p className="text-xs text-gray-400 mt-1.5 max-w-xs">Po marrim frazat, testet dhe me shume...</p>}
          </div>
        </div>
      )}

      {pageState === "error" && (
        <div className="text-center py-12 bg-red-50 rounded-2xl border border-red-100 px-6 mb-6">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <h3 className="font-extrabold text-red-700 mb-1">Nuk mund te gjenerohet rruga</h3>
          <p className="text-sm text-red-400 mb-4">{errorMsg}</p>
          <button onClick={() => loadPath()} className="px-6 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors">
            Provo Perseri
          </button>
        </div>
      )}

      {pageState === "ready" && path && (
        <>
          <div className="flex justify-end mb-3">
            <button onClick={() => loadPath(true)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors font-semibold py-1.5 px-2.5 rounded-xl hover:bg-gray-100">
              <RefreshCw className="w-3.5 h-3.5" /> Rigjeneroni rrugën
            </button>
          </div>
          <PathMap
            path={path}
            userProgress={userProgress}
            onSelectRound={(i) => { setActiveRound(i); setView("exercise") }}
          />
        </>
      )}

      {/* ── WordAudio section ──────────────────────────────────────────────── */}
      <div className="mt-10">
        <SectionHeader
          icon={Volume2}
          title="Bashko Fjalët"
          subtitle={`${wordAudioSets.length} sete ne nivel ${level}`}
          gradient="from-pink-500 to-rose-600"
        />
        <WordAudioSection
          sets={wordAudioSets}
          finishedIds={waFinished}
          loading={waLoading}
          onSelect={(set) => { setActiveWordSet(set); setView("wordaudio") }}
        />
      </div>

      {/* ── CreateWord section ─────────────────────────────────────────────── */}
      <div className="mt-10">
        <SectionHeader
          icon={PenLine}
          title="Formo Fjalën"
          subtitle={`${createWordLessons.length} mësime ne nivel ${level}`}
          gradient="from-violet-500 to-purple-600"
        />
        <CreateWordSection
          lessons={createWordLessons}
          finishedIds={cwFinished}
          loading={cwLoading}
          onSelect={(lesson) => { setActiveCreateLesson(lesson); setView("createword") }}
        />
      </div>
    </div>
  )
}
