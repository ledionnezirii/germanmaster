"use client"

import { useState, useEffect, useRef } from "react"
import { wordsService } from "../services/api"
import { useAuth } from "../context/AuthContext"
import {
  BookOpen,
  Volume2,
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
  Infinity,
  Calendar,
} from "lucide-react"

export default function Words() {
  const { user } = useAuth()
  const [words, setWords] = useState([])
  const [filteredWords, setFilteredWords] = useState([])
  const [loading, setLoading] = useState(true)
  const [newWord, setNewWord] = useState("")
  const [translation, setTranslation] = useState("")
  const [adding, setAdding] = useState(false)
  const [stats, setStats] = useState({ totalWords: 0, wordsThisWeek: 0, wordsThisMonth: 0 })
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const wordsPerPage = 30

  const [quizMode, setQuizMode] = useState(false)
  const [currentQuizWord, setCurrentQuizWord] = useState(null)
  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState([])
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [quizResult, setQuizResult] = useState(null)
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 })
  const [totalXP, setTotalXP] = useState(0)
  const [showHowToPlay, setShowHowToPlay] = useState(false)
  const [notification, setNotification] = useState(null)
  const [quizCycle, setQuizCycle] = useState([])
  const [quizCycleIndex, setQuizCycleIndex] = useState(0)

  const newWordInputRef = useRef(null)

  const insertUmlaut = (char, inputRef, setValue) => {
    const input = inputRef.current
    if (!input) return

    const start = input.selectionStart
    const end = input.selectionEnd
    const currentValue = input.value

    const newValue = currentValue.substring(0, start) + char + currentValue.substring(end)
    setValue(newValue)

    setTimeout(() => {
      input.focus()
      input.setSelectionRange(start + 1, start + 1)
    }, 0)
  }

  const UmlautButtons = ({ inputRef, setValue }) => {
    const umlauts = ["ä", "ö", "ü", "ß", "Ä", "Ö", "Ü"]

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {umlauts.map((char) => (
          <button
            key={char}
            type="button"
            onClick={() => insertUmlaut(char, inputRef, setValue)}
            className="px-2 py-1 text-xs font-semibold bg-gradient-to-br from-[#E0F7F4] to-[#B8EDE8] hover:from-[#B8EDE8] hover:to-[#8FE3DC] border-1 border-yellow-400 rounded text-[#2D9D91] transition-all"
          >
            {char}
          </button>
        ))}
      </div>
    )
  }

  const shuffleArray = (array) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const generateMultipleChoiceOptions = (correctWord, allWords) => {
    const wrongWords = allWords.filter((w) => w._id !== correctWord._id)
    const shuffledWrong = shuffleArray(wrongWords)
    const wrongOptions = shuffledWrong.slice(0, 3)
    const allOptions = [correctWord, ...wrongOptions]
    return shuffleArray(allOptions)
  }

  const showNotification = (message, type = "success") => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  useEffect(() => {
    if (user) {
      setLoading(true)
      fetchWords()
      fetchStats()
    }
  }, [user])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredWords(words)
    } else {
      const filtered = words.filter(
        (word) =>
          word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
          word.translation.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredWords(filtered)
    }
    setCurrentPage(1)
  }, [searchQuery, words])

  const fetchWords = async () => {
    try {
      const [response] = await Promise.all([
        wordsService.getLearnedWords(),
        new Promise((resolve) => setTimeout(resolve, 500)),
      ])
      setWords(response.data || [])
      setFilteredWords(response.data || [])
    } catch (error) {
      console.error("Error fetching words:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await wordsService.getWordStats()
      setStats(response.data || { totalWords: 0, wordsThisWeek: 0, wordsThisMonth: 0 })
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const handleAddWord = async (e) => {
    e.preventDefault()

    if (!newWord.trim()) {
      showNotification("Ju lutem shkruani një fjalë", "error")
      return
    }

    try {
      setAdding(true)
      const response = await wordsService.addLearnedWord({
        word: newWord,
        translation,
      })

      setWords([response.data, ...words])
      setNewWord("")
      setTranslation("")
      showNotification("Fjala u shtua me sukses!", "success")
      fetchStats()
    } catch (error) {
      console.error("Error adding word:", error)
      showNotification(error.response?.data?.message || "Dështoi shtimi i fjalës", "error")
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveWord = async (id) => {
    if (!window.confirm("Jeni i sigurt që dëshironi të fshini këtë fjalë?")) return

    try {
      await wordsService.removeLearnedWord(id)
      setWords(words.filter((word) => word._id !== id))
      showNotification("Fjala u fshi me sukses!", "success")
      fetchStats()
    } catch (error) {
      console.error("Error removing word:", error)
      showNotification("Dështoi fshirja e fjalës", "error")
    }
  }

  const handleSpeak = (word) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.lang = "de-DE"
      utterance.rate = 0.8
      window.speechSynthesis.speak(utterance)
    } else {
      showNotification("Shqiptimi me zë nuk mbështetet në shfletuesin tuaj", "error")
    }
  }

  const startQuiz = () => {
    if (words.length === 0) {
      showNotification("Shtoni disa fjalë fillimisht për të filluar kuizin!", "error")
      return
    }
    if (words.length < 4) {
      showNotification("Ju nevojiten të paktën 4 fjalë për të filluar kuizin!", "error")
      return
    }
    setQuizMode(true)
    setQuizScore({ correct: 0, total: 0 })
    setTotalXP(0)
    const shuffledWords = shuffleArray(words)
    setQuizCycle(shuffledWords)
    setQuizCycleIndex(0)
    const firstWord = shuffledWords[0]
    setCurrentQuizWord(firstWord)
    setMultipleChoiceOptions(generateMultipleChoiceOptions(firstWord, words))
    setSelectedAnswer(null)
    setQuizResult(null)
  }

  const loadNextQuizWord = () => {
    const nextIndex = quizCycleIndex + 1

    let nextWord
    if (nextIndex >= quizCycle.length) {
      const shuffledWords = shuffleArray(words)
      setQuizCycle(shuffledWords)
      setQuizCycleIndex(0)
      nextWord = shuffledWords[0]
    } else {
      setQuizCycleIndex(nextIndex)
      nextWord = quizCycle[nextIndex]
    }

    setCurrentQuizWord(nextWord)
    setMultipleChoiceOptions(generateMultipleChoiceOptions(nextWord, words))
    setSelectedAnswer(null)
    setQuizResult(null)
  }

  const handleAnswerSelection = (option) => {
    setSelectedAnswer(option)
    setTimeout(() => {
      const isCorrect = option._id === currentQuizWord._id
      setQuizResult(isCorrect)
      setQuizScore((prev) => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
      }))

      if (isCorrect) {
        const xpEarned = 1
        setTotalXP((prev) => prev + xpEarned)
        wordsService.addQuizXp(1).catch((error) => {
          console.error("Error awarding XP:", error)
        })
      }

      setTimeout(() => {
        loadNextQuizWord()
      }, 1500)
    }, 100)
  }

  const endQuiz = () => {
    showNotification(
      `Kuizi Përfundoi! Rezultati: ${quizScore.correct} nga ${quizScore.total} të sakta. XP e Fituar: ${totalXP} XP 🎉`,
      "success",
    )
    setQuizMode(false)
    setCurrentQuizWord(null)
    setSelectedAnswer(null)
    setQuizResult(null)
    setQuizCycle([])
    setQuizCycleIndex(0)
    setMultipleChoiceOptions([])
  }

  const indexOfLastWord = currentPage * wordsPerPage
  const indexOfFirstWord = indexOfLastWord - wordsPerPage
  const currentWords = filteredWords.slice(indexOfFirstWord, indexOfLastWord)
  const totalPages = Math.ceil(filteredWords.length / wordsPerPage)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  if (!user) {
    return (
      <div className="max-w-full mx-auto p-4">
        <div className="border-1 border-yellow-400 rounded-lg p-8 text-center bg-white shadow-lg">
          <h2 className="text-xl font-semibold mb-2 text-gray-900">Ju lutem identifikohuni</h2>
          <p className="text-gray-600 text-sm">Duhet të jeni të identifikuar për të parë fjalët tuaja të mësuara</p>
        </div>
      </div>
    )
  }

  if (showHowToPlay) {
    return (
      <div className="max-w-full mx-auto p-4">
        <div className="border-1 border-yellow-400 rounded-xl p-6 bg-white shadow-lg max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-3">
              <HelpCircle size={28} className="text-[#3DAFA3]" />
              <h2 className="text-2xl font-bold text-gray-800">Si të Luani</h2>
            </div>
            <button
              onClick={() => setShowHowToPlay(false)}
              className="p-1.5 rounded-md bg-gradient-to-br from-[#E0F7F4] to-[#B8EDE8] hover:from-[#B8EDE8] hover:to-[#8FE3DC] border-1 border-yellow-400 transition-colors"
            >
              <X size={20} className="text-[#2D9D91]" />
            </button>
          </div>

          <div className="text-gray-700 text-sm leading-relaxed space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                <BookOpen size={18} className="text-[#3DAFA3]" />
                Shtoni Fjalë
              </h3>
              <p>
                Filloni duke shtuar fjalë gjermane që keni mësuar. Mund të shtoni përkthimin në shqip për çdo fjalë.
              </p>
            </div>

            <div>
              <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                <Brain size={18} className="text-[#2D9D91]" />
                Luani Kuizin
              </h3>
              <p>
                Klikoni "Fillo Kuizin" për të testuar njohuritë tuaja. Do t'ju tregohet një fjalë gjermane dhe ju duhet
                të zgjidhni përkthimin e saktë nga opsionet e dhëna.
              </p>
            </div>

            <div>
              <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                <Zap size={18} className="text-[#F59E0B]" />
                Fitoni XP
              </h3>
              <p>
                Për çdo përgjigje të saktë, fitoni 1 XP! Sa më shumë të praktikoni, aq më shumë XP do të grumbulloni.
              </p>
            </div>

            <div>
              <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                <Volume2 size={18} className="text-[#3DAFA3]" />
                Dëgjoni Shqiptimin
              </h3>
              <p>Klikoni ikonën e altoparlantit për të dëgjuar shqiptimin e saktë të fjalës gjermane.</p>
            </div>

            <div className="bg-gradient-to-br from-[#E0F7F4] to-[#B8EDE8] border-1 border-yellow-400 rounded-lg p-3 mt-5">
              <p className="text-sm text-[#2D9D91] m-0">
                💡 <strong>Këshillë:</strong> Praktikoni rregullisht për të përmirësuar aftësitë tuaja gjuhësore!
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowHowToPlay(false)}
            className="w-full mt-5 py-3 bg-gradient-to-r from-[#3DAFA3] to-[#5BC0BE] hover:from-[#2D9D91] hover:to-[#4AB0AE] text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-teal-500/20"
          >
            E Kuptova!
          </button>
        </div>
      </div>
    )
  }

  if (quizMode && currentQuizWord) {
    return (
      <div className="max-w-full mx-auto p-3">
        {notification && (
          <div
            className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg font-semibold text-xs shadow-lg z-50 flex items-center gap-2 ${
              notification.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
            }`}
          >
            {notification.type === "success" ? <CheckCircle size={16} /> : <XCircle size={16} />}
            {notification.message}
          </div>
        )}

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain size={24} className="text-[#3DAFA3]" />
            <h1 className="text-xl font-bold text-gray-800">Modaliteti i Kuizit</h1>
          </div>
          <div className="flex gap-3 text-xs">
            <p className="text-gray-600 bg-[#f4f5f7]/60 backdrop-blur-md border border-white/70 rounded-2xl shadow-lg p-2">
              Rezultati:{" "}
              <strong className="text-[#2D9D91]">
                {quizScore.correct}/{quizScore.total}
              </strong>
            </p>
            <p className="text-[#D97706] flex items-center gap-1 bg-[#f4f5f7]/60 backdrop-blur-md border border-white/30 rounded-2xl shadow-lg p-2">
              <Zap size={14} />
              <strong>{totalXP} XP</strong>
            </p>
          </div>
        </div>

        <div className="border-1 border-yellow-400 rounded-xl p-4 bg-white shadow-lg">
          <div>
            <div className="text-center py-8 px-4 mb-4 bg-gradient-to-br from-[#B8EDE8] to-[#8FE3DC] rounded-xl">
              <p className="text-xs text-gray-600 mb-2 font-medium uppercase tracking-wide">PËRKTHENI KËTË FJALË:</p>
              <h2 className="text-5xl font-bold text-[#3DAFA3] mb-4">{currentQuizWord.word}</h2>
              <button
                onClick={() => handleSpeak(currentQuizWord.word)}
                className="mt-2 px-4 py-2 bg-white border-2 border-[#3DAFA3] rounded-lg text-[#3DAFA3] hover:bg-[#E0F7F4] transition-all inline-flex items-center gap-2 text-sm font-semibold"
              >
                <Volume2 size={16} />
                Dëgjo
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Zgjidhni përkthimin e saktë:</p>
              <div className="grid grid-cols-2 gap-3">
                {multipleChoiceOptions.map((option) => {
                  const isSelected = selectedAnswer?._id === option._id
                  const isCorrect = option._id === currentQuizWord._id
                  const showResult = quizResult !== null

                  let buttonClass = "w-full p-4 text-left rounded-lg border-2 transition-all font-medium text-sm "

                  if (showResult) {
                    if (isSelected && isCorrect) {
                      buttonClass += "border-green-500 bg-green-50 text-green-700"
                    } else if (isSelected && !isCorrect) {
                      buttonClass += "border-red-500 bg-red-50 text-red-700"
                    } else if (isCorrect) {
                      buttonClass += "border-green-500 bg-green-50 text-green-700"
                    } else {
                      buttonClass += "border-gray-200 bg-gray-50 text-gray-400"
                    }
                  } else if (isSelected) {
                    buttonClass += "border-[#3DAFA3] bg-gradient-to-br from-[#E0F7F4] to-[#B8EDE8] text-[#2D9D91]"
                  } else {
                    buttonClass += "border-[#E5E7EB] bg-white hover:border-[#3DAFA3] hover:bg-[#E0F7F4] text-gray-700"
                  }

                  return (
                    <button
                      key={option._id}
                      onClick={() => !showResult && handleAnswerSelection(option)}
                      disabled={showResult}
                      className={buttonClass}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option.translation || option.word}</span>
                        {showResult && isCorrect && <CheckCircle size={18} className="text-green-500" />}
                        {showResult && isSelected && !isCorrect && <XCircle size={18} className="text-red-500" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {quizResult !== null && (
              <div
                className={`p-3 rounded-lg border-2 mb-3 ${
                  quizResult ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{quizResult ? "✓" : "✗"}</span>
                  <span className={`font-bold text-sm ${quizResult ? "text-green-500" : "text-red-500"}`}>
                    {quizResult ? "E saktë!" : "E pasaktë"}
                  </span>
                  {quizResult && (
                    <span className="ml-auto text-[#D97706] font-semibold text-xs flex items-center gap-1">
                      <Zap size={12} />
                      +1 XP
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={endQuiz}
                className="py-2 px-4 bg-white hover:bg-gradient-to-br hover:from-[#E0F7F4] hover:to-[#B8EDE8] text-[#2D9D91] border-1 border-yellow-400 rounded-lg text-sm font-semibold transition-all"
              >
                Mbyll Kuizin
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3DAFA3]"></div>
      </div>
    )
  }

  return (
    <div className="max-w-full mx-auto p-4">
      {notification && (
        <div
          className={`fixed bottom-5 right-5 px-5 py-3 rounded-lg font-semibold text-sm shadow-lg z-50 flex items-center gap-2 ${
            notification.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
          }`}
        >
          {notification.type === "success" ? <CheckCircle size={18} /> : <XCircle size={18} />}
          {notification.message}
        </div>
      )}

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-br from-[#E0F7F4] to-[#B8EDE8] p-5 rounded-xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-[#1d2726] via-[#2D9D91] to-[#5BC0BE] p-2.5 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
              <BookOpen size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Fjalët e Mia të Mësuara</h1>
              <p className="text-gray-600 text-sm mt-0.5">Mbani shënim të gjitha fjalët gjermane që keni mësuar</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {words.length > 0 && (
              <button
                onClick={startQuiz}
                className="px-4 py-2.5 bg-gradient-to-r from-[#3DAFA3] to-[#5BC0BE] hover:from-[#2D9D91] hover:to-[#4AB0AE] text-white rounded-lg text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-teal-500/20"
              >
                <Brain size={18} />
                Fillo Kuizin
              </button>
            )}
            <button
              onClick={() => setShowHowToPlay(true)}
              className="px-4 py-2.5 bg-white hover:bg-gradient-to-br hover:from-[#E0F7F4] hover:to-[#B8EDE8] text-[#2D9D91] border-1 border-yellow-400 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
            >
              <HelpCircle size={18} />
              Si të Luani
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white  p-4 rounded-xl shadow-md">
          <div className="flex items-center gap-2 mb-1">
            <Infinity size={20} className="text-[#3DAFA3] rounded-full" />
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Totali</p>
          </div>
          <p className="text-3xl font-bold text-[#2D9D91]">{stats.totalWords}</p>
          <p className="text-xs text-gray-500 mt-1">Fjalë të mësuara</p>
        </div>
       
        <div className="bg-white  p-4 rounded-xl shadow-md">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={18} className="text-[#3DAFA3]" />
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Këtë Muaj</p>
          </div>
          <p className="text-3xl font-bold text-[#2D9D91]">{stats.wordsThisMonth}</p>
          <p className="text-xs text-gray-500 mt-1">Fjalë të reja</p>
        </div>
         <div className="bg-white  p-4 rounded-xl shadow-md">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={18} className="text-[#3DAFA3]" />
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Këtë Javë</p>
          </div>
          <p className="text-3xl font-bold text-[#2D9D91]">{stats.wordsThisWeek}</p>
          <p className="text-xs text-gray-500 mt-1">Fjalë të reja</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center gap-2 mb-3">
            <Plus size={20} className="text-[#3DAFA3]" />
            <h2 className="text-lg font-bold text-gray-800">Shto një Fjalë të Re</h2>
          </div>
          <form onSubmit={handleAddWord} className="space-y-3">
            <div>
              <label htmlFor="word" className="block text-xs font-semibold text-gray-700 mb-1.5">
                Fjala Gjermane *
              </label>
              <input
                ref={newWordInputRef}
                id="word"
                type="text"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder="p.sh. Haus"
                className="w-full px-3 py-2 border-1 border-yellow-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3DAFA3] text-sm"
                required
              />
              <UmlautButtons inputRef={newWordInputRef} setValue={setNewWord} />
            </div>
            <div>
              <label htmlFor="translation" className="block text-xs font-semibold text-gray-700 mb-1.5">
                Përkthimi (Shqip)
              </label>
              <input
                id="translation"
                type="text"
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                placeholder="p.sh. Shtëpi"
                className="w-full px-3 py-2 border-1 border-yellow-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3DAFA3] text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={adding || !newWord.trim()}
              className="w-full py-2.5 bg-gradient-to-r from-[#4aaf3d] to-[#5BC0BE] hover:from-[#2D9D91] hover:to-[#4AB0AE] disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
            >
              {adding ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Duke shtuar...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Shto Fjalën
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <BookOpen size={20} className="text-[#3DAFA3]" />
            Fjalët e Mia ({filteredWords.length})
          </h2>
          <input
            type="text"
            placeholder="Kërko fjalë..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 px-3 py-2 border-1 border-yellow-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3DAFA3] text-sm"
          />
        </div>

        {currentWords.length === 0 ? (
          <div className="border-1 border-yellow-400 rounded-xl p-8 text-center bg-white shadow-md">
            <BookOpen size={48} className="mx-auto text-[#8FE3DC] mb-3" />
            <p className="text-gray-600 font-medium">
              {searchQuery.trim()
                ? "Nuk u gjetën fjalë që përputhen me kërkimin tuaj"
                : "Nuk keni shtuar ende asnjë fjalë"}
            </p>
            {!searchQuery.trim() && (
              <p className="text-gray-500 text-sm mt-2">Filloni duke shtuar fjalët tuaja të para më sipër!</p>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentWords.map((word) => (
                <div
                  key={word._id}
                  className="bg-white border-1 border-yellow-400 rounded-xl p-4 hover:border-[#3DAFA3] transition-all shadow-md hover:shadow-lg group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-[#2D9D91] mb-1">{word.word}</h3>
                      {word.translation && <p className="text-sm text-gray-600">{word.translation}</p>}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleSpeak(word.word)}
                        className="p-1.5 rounded-md bg-gradient-to-br from-[#E0F7F4] to-[#B8EDE8] hover:from-[#B8EDE8] hover:to-[#8FE3DC] border-1 border-yellow-400 transition-colors group-hover:scale-105"
                        title="Dëgjo"
                      >
                        <Volume2 size={16} className="text-[#2D9D91]" />
                      </button>
                      <button
                        onClick={() => handleRemoveWord(word._id)}
                        className="p-1.5 rounded-md bg-red-50 hover:bg-red-100 border-2 border-red-200 hover:border-red-300 transition-colors group-hover:scale-105"
                        title="Fshi"
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{new Date(word.createdAt).toLocaleDateString("sq-AL")}</p>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-white border-1 border-yellow-400 hover:bg-[#E0F7F4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={18} className="text-[#2D9D91]" />
                </button>
                <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => paginate(pageNumber)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                            currentPage === pageNumber
                              ? "bg-gradient-to-r from-[#3DAFA3] to-[#5BC0BE] text-white shadow-lg shadow-teal-500/20"
                              : "bg-white border-1 border-yellow-400 text-[#2D9D91] hover:bg-[#E0F7F4]"
                          }`}
                        >
                          {pageNumber}
                        </button>
                      )
                    } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                      return (
                        <span key={pageNumber} className="px-2 py-1.5 text-gray-400">
                          ...
                        </span>
                      )
                    }
                    return null
                  })}
                </div>
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-white border-1 border-yellow-400 hover:bg-[#E0F7F4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={18} className="text-[#2D9D91]" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
