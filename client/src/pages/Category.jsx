"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { categoriesService, ttsService, wordAudioService, authService } from "../services/api"
import { useLanguage } from "../context/LanguageContext"
import {
  FolderOpen, ArrowLeft, BookOpen, Calendar, Check,
  Grid, Globe, Leaf, Briefcase, Coffee, Film, Guitar,
  Book, Trophy, Clock, Car, TreePine, Flag, Heart,
  Snowflake, Users, Sparkles, UtensilsCrossed, Home,
  Shirt, ShoppingBag, Hand, Plane, Mountain, PawPrint,
  X, Languages, Hash, Palette, MessageCircle, Timer,
  Volume2, VolumeX, Play, Pause, Star, Zap, TrendingUp, LogOut, Lock, Crown,
  Shuffle, CheckCircle, XCircle, Flame
} from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion"
import SEO from "../components/SEO"

const iconMap = {
  default: FolderOpen,
  Book: Book,
  numbers: Hash,
  palette: Palette,
  handshake: Users,
  speech: MessageCircle,
  calendar: Calendar,
  clock: Clock,
  transport: Car,
  tree: TreePine,
  flag: Flag,
  heart: Heart,
  work: Briefcase,
  seasons: Snowflake,
  family: Users,
  hobbies: Sparkles,
  food: UtensilsCrossed,
  home: Home,
  clothes: Shirt,
  shopping: ShoppingBag,
  body: Hand,
  travel: Plane,
  restaurant: Coffee,
  nature: Mountain,
  animals: PawPrint
}

const typeStyles = {
  "Bazat": { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
  "Numra": { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  "Tjera": { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
  "Fraza": { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  "Koha": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  "Mjedisi": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  "Natyra": { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  "Njerëzit": { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200" },
  "Gramatikë": { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  "Të Përgjithshme": { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  "Mbiemra": { bg: "bg-fuchsia-50", text: "text-fuchsia-700", border: "border-fuchsia-200" },
  "Vocabulary": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  "Folje": { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  "Kulturë": { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  default: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" }
}

const typeGradients = {
  "Bazat":           "from-sky-400 to-blue-500",
  "Numra":           "from-indigo-400 to-violet-500",
  "Tjera":           "from-violet-400 to-purple-500",
  "Fraza":           "from-rose-400 to-pink-500",
  "Koha":            "from-emerald-400 to-teal-500",
  "Mjedisi":         "from-amber-400 to-yellow-500",
  "Natyra":          "from-green-400 to-emerald-500",
  "Njerëzit":        "from-pink-400 to-rose-500",
  "Gramatikë":       "from-red-400 to-orange-500",
  "Të Përgjithshme": "from-yellow-400 to-amber-500",
  "Mbiemra":         "from-fuchsia-400 to-pink-500",
  "Vocabulary":      "from-blue-400 to-cyan-500",
  "Folje":           "from-purple-400 to-indigo-500",
  "Kulturë":         "from-orange-400 to-amber-500",
  default:           "from-slate-400 to-gray-500"
}

const Category = () => {
  const { language } = useLanguage()
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [visibleCategories, setVisibleCategories] = useState(20)
  const [loadingMore, setLoadingMore] = useState(false)
  const [finishingCategory, setFinishingCategory] = useState(false)
  const [showCongrats, setShowCongrats] = useState(false)
  const [xpGained, setXpGained] = useState(0)
  const [finishedCategoryIds, setFinishedCategoryIds] = useState([])
  const [notification, setNotification] = useState(null)
  const [showXpAnimation, setShowXpAnimation] = useState(false)
  const [activeMixedQuiz, setActiveMixedQuiz] = useState(false)
  const [showQuizInfo, setShowQuizInfo] = useState(false)
  const [mixedQuizWords, setMixedQuizWords] = useState([])
  const [isPaid, setIsPaid] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  
  // Audio state
  const [playingAudioIndex, setPlayingAudioIndex] = useState(null)
  const [loadingAudioIndex, setLoadingAudioIndex] = useState(null)
  const [audioCache, setAudioCache] = useState({})
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])
  const audioRef = useRef(null)

  const showNotification = (message, type = "success") => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  // Cleanup audio on unmount or category change
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      Object.values(audioCache).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [])

  // Reset audio state when category changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setPlayingAudioIndex(null)
    setLoadingAudioIndex(null)
    setAudioCache({})
  }, [selectedCategory?.id])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [selectedCategory])

  useEffect(() => {
    const fetchFinishedCategories = async () => {
      try {
        const response = await categoriesService.getFinishedCategories(language)
        const data = response.data || response
        setFinishedCategoryIds(data.finishedCategoryIds || [])
        if (data.isPaid !== undefined) setIsPaid(data.isPaid)
      } catch {
        setFinishedCategoryIds([])
      }
    }
    fetchFinishedCategories()
  }, [language])

  const loadMoreCategories = useCallback(() => {
    if (loadingMore || visibleCategories >= categories.length) return
    setLoadingMore(true)
    setTimeout(() => {
      setVisibleCategories((prev) => Math.min(prev + 20, categories.length))
      setLoadingMore(false)
    }, 300)
  }, [loadingMore, visibleCategories, categories.length])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && !loadingMore) loadMoreCategories() },
      { threshold: 0.1 }
    )
    const sentinel = document.getElementById("load-more-sentinel")
    if (sentinel) observer.observe(sentinel)
    return () => { if (sentinel) observer.unobserve(sentinel) }
  }, [loadMoreCategories, loadingMore])

  useEffect(() => { fetchCategories() }, [language])

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      const response = await categoriesService.getAllCategories({ limit: 100 }, language)
      let categoriesData = []
      if (response.data) {
        if (Array.isArray(response.data)) categoriesData = response.data
        else if (response.data.data && Array.isArray(response.data.data)) categoriesData = response.data.data
        else if (response.data.categories && Array.isArray(response.data.categories)) categoriesData = response.data.categories
      }
      setCategories(categoriesData)
    } catch {
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCategoryDetails = useCallback(async (categoryId, categoryName) => {
    try {
      setLoading(true)
      const response = await categoriesService.getCategoryById(categoryId)
      const categoryData = response.data.data || response.data
      setSelectedCategory({
        id: categoryId,
        name: categoryName,
        words: categoryData.words || [],
        description: categoryData.description || "",
        level: categoryData.level || "A1",
        type: categoryData.type || "other",
      })
    } catch {
      setSelectedCategory({ id: categoryId, name: categoryName, words: [], description: "", level: "A1", type: "other" })
    } finally {
      setLoading(false)
    }
  }, [])

  // Play audio for a word
  const playWordAudio = async (wordObj, index) => {
    if (!selectedCategory?.id || !wordObj?.word) return

    if (playingAudioIndex === index && audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setPlayingAudioIndex(null)
      return
    }

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }

    const cacheKey = `${selectedCategory.id}_${index}`

    if (audioCache[cacheKey]) {
      const audio = new Audio(audioCache[cacheKey])
      audioRef.current = audio
      
      audio.onended = () => {
        setPlayingAudioIndex(null)
      }
      
      audio.onerror = () => {
        setPlayingAudioIndex(null)
        showNotification("Gabim në riprodhimin e audios", "error")
      }
      
      setPlayingAudioIndex(index)
      audio.play().catch(() => {
        setPlayingAudioIndex(null)
      })
      return
    }

    try {
      setLoadingAudioIndex(index)
      
      const response = await ttsService.getCategoryAudio(
        selectedCategory.id,
        index,
        wordObj.word,
        selectedCategory.level || "A1",
        language
      )
      
      const audioUrl = response.url || response.data?.url || response
      
      setAudioCache(prev => ({
        ...prev,
        [cacheKey]: audioUrl
      }))
      
      const audio = new Audio(audioUrl)
      audioRef.current = audio
      
      audio.onended = () => {
        setPlayingAudioIndex(null)
      }
      
      audio.onerror = () => {
        setPlayingAudioIndex(null)
        setLoadingAudioIndex(null)
        showNotification("Gabim në riprodhimin e audios", "error")
      }
      
      setLoadingAudioIndex(null)
      setPlayingAudioIndex(index)
      audio.play().catch(() => {
        setPlayingAudioIndex(null)
      })
      
    } catch (error) {
      console.error('[TTS] Error fetching category audio:', error)
      setLoadingAudioIndex(null)
      setPlayingAudioIndex(null)
      showNotification("Nuk mund të luhet audio", "error")
    }
  }

  const handleOpenMixedQuiz = async () => {
    if (!isPaid) { setShowPaywall(true); return; }
    if (finishedCategoryIds.length < 2) { setShowQuizInfo(true); return; }
    try {
      const res = await categoriesService.getFinishedCategoriesWords(language)
      const words = (res.data?.data?.words || res.data?.words || [])
        .filter(w => w.word && w.translation)
      const mixed = [...words].sort(() => Math.random() - 0.5).slice(0, 10)
      setMixedQuizWords(mixed)
      setActiveMixedQuiz(true)
    } catch {
      showNotification("Gabim në ngarkimin e fjalëve", "error")
    }
  }

  const handleFinishCategory = async () => {
    if (!selectedCategory?.id) return
    try {
      setFinishingCategory(true)
      const response = await categoriesService.finishCategory(selectedCategory.id)
      const data = response.data || response
      setXpGained(data.xpGained || 0)
      setShowXpAnimation(true)
      setTimeout(() => setShowXpAnimation(false), 3000)
      showNotification(`Urime! +${data.xpGained || 0} XP`, "success")
      setShowCongrats(true)
      
      try {
        const finishedResponse = await categoriesService.getFinishedCategories()
        setFinishedCategoryIds((finishedResponse.data || finishedResponse).finishedCategoryIds || [])
      } catch {}
      
      setTimeout(() => {
        setShowCongrats(false)
        setSelectedCategory(null)
      }, 4000)
    } catch (error) {
      showNotification(error.response?.data?.message || "Gabim", "error")
    } finally {
      setFinishingCategory(false)
    }
  }

  const getTypeStyle = (type) => typeStyles[type] || typeStyles.default

  // XP Animation Component - CSS only
  const XpAnimationOverlay = showXpAnimation && (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none animate-fade-in">
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 px-8 py-6 rounded-2xl shadow-2xl border-2 border-emerald-500 animate-bounce-in">
        <div className="flex items-center gap-3">
          <Star className="h-10 w-10 text-emerald-600 animate-spin-slow" />
          <div>
            <div className="text-3xl font-bold">+{xpGained} XP</div>
            <div className="text-sm font-medium">Urime!</div>
          </div>
          <Zap className="h-10 w-10 text-emerald-600 animate-pulse" />
        </div>
      </div>
    </div>
  )

  // Notification Toast - CSS only
  const NotificationToast = notification && (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg backdrop-blur-sm animate-slide-up ${
        notification.type === "success" 
          ? "bg-emerald-500/95 text-white" 
          : "bg-red-500/95 text-white"
      }`}
    >
      {notification.type === "success" ? <Check size={18} /> : <X size={18} />}
      <span className="text-sm font-medium">{notification.message}</span>
    </div>
  )

  const PaywallModal = showPaywall && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowPaywall(false)}>
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-emerald-200 p-8 max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 flex items-center justify-center mx-auto mb-5">
          <Crown className="h-10 w-10 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Kërkohet Premium</h2>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          Quiz Mikst është ekskluziv për anëtarët <span className="font-bold text-emerald-600">Premium</span>. Kaloni në Premium për akses të plotë.
        </p>
        <button onClick={() => { window.location.href = "/payments" }} className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold text-sm shadow-lg mb-3 cursor-pointer border-none">
          Shiko Planet Premium
        </button>
        <button onClick={() => setShowPaywall(false)} className="w-full py-2.5 bg-gray-50 text-gray-500 rounded-xl font-medium text-sm border border-gray-200 hover:bg-gray-100 transition-all cursor-pointer">
          Mbyll
        </button>
      </div>
    </div>
  )

  if (activeMixedQuiz) {
    return (
      <CategoryMixedQuizScreen
        words={mixedQuizWords}
        language={language}
        onFinish={() => setActiveMixedQuiz(false)}
      />
    )
  }

  // Congrats Screen
  if (showCongrats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 flex items-center justify-center p-6">
        <style>{`
          @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
          @keyframes bounce-in { 0% { transform: scale(0.9); opacity: 0; } 50% { transform: scale(1.05); } 100% { transform: scale(1); opacity: 1; } }
          @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .animate-fade-in { animation: fade-in 0.3s ease-out; }
          .animate-bounce-in { animation: bounce-in 0.4s ease-out; }
          .animate-slide-up { animation: slide-up 0.3s ease-out; }
          .animate-spin-slow { animation: spin-slow 1s linear infinite; }
        `}</style>
        {NotificationToast}
        {XpAnimationOverlay}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-emerald-200 p-8 max-w-sm w-full text-center animate-bounce-in">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Urime!</h2>
          <p className="text-slate-600 text-sm mb-6">
            Përfunduat <span className="font-semibold text-slate-900">{selectedCategory?.name}</span>
          </p>
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl py-4 px-6 mb-6 shadow-lg shadow-emerald-500/30">
            <p className="text-emerald-100 text-xs font-medium mb-1">XP e fituar</p>
            <p className="text-3xl font-bold text-white">+{xpGained}</p>
          </div>
          <button
            onClick={() => { setShowCongrats(false); setSelectedCategory(null) }}
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/30 active:scale-95"
          >
            Vazhdo
          </button>
        </div>
      </div>
    )
  }

  // Category Detail View
  if (selectedCategory) {
    const categoryIdStr = String(selectedCategory.id?._id || selectedCategory.id)
    const isCategoryFinished = finishedCategoryIds.includes(categoryIdStr)
    const style = getTypeStyle(selectedCategory.type)

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 p-2 sm:p-4">
        <style>{`
          @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
          @keyframes bounce-in { 0% { transform: scale(0.9); opacity: 0; } 50% { transform: scale(1.05); } 100% { transform: scale(1); opacity: 1; } }
          @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes stagger-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fade-in { animation: fade-in 0.3s ease-out; }
          .animate-bounce-in { animation: bounce-in 0.4s ease-out; }
          .animate-slide-up { animation: slide-up 0.3s ease-out; }
          .animate-spin-slow { animation: spin-slow 1s linear infinite; }
          .animate-stagger-in { animation: stagger-in 0.3s ease-out backwards; }
        `}</style>
        {NotificationToast}
        {XpAnimationOverlay}
        
        <div className="max-w-6xl mx-auto">
          {/* Header Card */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-emerald-200 p-4 sm:p-6 mb-4 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-emerald-600 hover:text-emerald-700 p-1 transition-colors"
                  aria-label="Kthehu te Kategoritë"
                >
                  <LogOut className="h-5 w-5 sm:h-6 sm:w-6 cursor-pointer" />
                </button>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{selectedCategory.name}</h1>
                  {selectedCategory.type && (
                    <span className={`inline-block mt-1 px-2.5 py-0.5 text-xs font-medium rounded-full ${style.bg} ${style.text}`}>
                      {selectedCategory.type}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-1 rounded-full border border-emerald-500">
                  <Star className="h-3 w-3 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700">
                    {selectedCategory.words?.length || 0} fjalë
                  </span>
                </div>
                
                <button
                  onClick={handleFinishCategory}
                  disabled={finishingCategory || isCategoryFinished}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                    isCategoryFinished
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30"
                  }`}
                >
                  {finishingCategory ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">{isCategoryFinished ? "E përfunduar" : "Përfundo"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Words Grid */}
          {loading ? (
            <div className="flex items-center justify-center min-h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
            </div>
          ) : selectedCategory.words?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedCategory.words.map((wordObj, index) => {
                const isPlaying = playingAudioIndex === index
                const isLoading = loadingAudioIndex === index

                return (
                  <div
                    key={index}
                    className="group bg-[#FEFCF8] rounded-2xl p-4 border border-stone-200 hover:border-stone-300 hover:shadow-md transition-all duration-200 animate-stagger-in"
                    style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Index badge */}
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center mt-0.5">
                        <span className="text-xs font-bold text-stone-400">{index + 1}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-bold text-gray-900 text-base leading-tight">{wordObj.word}</h3>
                            <p className="text-stone-500 text-sm mt-0.5">{wordObj.translation}</p>
                            {wordObj.pronunciation && (
                              <p className="text-stone-400 text-xs mt-1 italic font-light">/{wordObj.pronunciation}/</p>
                            )}
                          </div>

                          {/* Audio Button */}
                          <button
                            onClick={(e) => { e.stopPropagation(); playWordAudio(wordObj, index) }}
                            disabled={isLoading}
                            className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                              isPlaying
                                ? "bg-teal-500 text-white shadow-md shadow-teal-200"
                                : isLoading
                                  ? "bg-stone-100 text-stone-300"
                                  : "bg-stone-100 text-stone-500 hover:bg-teal-50 hover:text-teal-600"
                            }`}
                            title={isPlaying ? "Ndalo" : "Dëgjo"}
                          >
                            {isLoading ? (
                              <div className="w-3.5 h-3.5 animate-spin rounded-full border-b-2 border-current" />
                            ) : isPlaying ? (
                              <Pause className="w-3.5 h-3.5" />
                            ) : (
                              <Volume2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {wordObj.examples?.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-stone-100">
                            {wordObj.examples.slice(0, 2).map((example, i) => (
                              <p key={i} className="text-xs text-stone-400 leading-relaxed mt-1">"{example}"</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-[#FEFCF8] rounded-2xl border border-stone-200">
              <BookOpen className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <p className="text-stone-400 text-sm">Nuk ka fjalë në këtë kategori</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Main Categories View
  return (
    <>
      <SEO 
        title="Kategori Fjalësh - Mësoni Fjalët Gjermane"
        description="Eksploro kategori të ndryshme të fjalëve gjermane. Mësoni fjalë të përditshme, profesionale dhe specifike."
        keywords="kategori fjalësh, fjalë gjermane, fjalor gjermanisht, mesimi fjalëve, perkthim fjalësh"
      />
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes bounce-in { 0% { transform: scale(0.95); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes stagger-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        .animate-bounce-in { animation: bounce-in 0.25s ease-out; }
        .animate-slide-up { animation: slide-up 0.2s ease-out; }
        .animate-stagger-in { animation: stagger-in 0.2s ease-out backwards; }
      `}</style>
<div className="min-h-screen bg-slate-50/50 p-3 sm:p-4 flex flex-col">
        {PaywallModal}
        {NotificationToast}

        <AnimatePresence>
          {showQuizInfo && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
              onClick={() => setShowQuizInfo(false)}
            >
              <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0, y: 20 }}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className="bg-white rounded-3xl shadow-2xl border-2 border-emerald-200 p-8 max-w-sm w-full text-center"
                onClick={e => e.stopPropagation()}
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 flex items-center justify-center mx-auto mb-5">
                  <Shuffle className="h-10 w-10 text-emerald-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Quiz Mikst</h2>
                <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                  Ky quiz mikson fjalët nga <span className="font-bold text-emerald-600">të gjitha kategoritë</span> që ke përfunduar dhe të sfidon t'i bashkosh sërish — por të perziera!
                </p>
                <p className="text-gray-400 text-xs mb-3 leading-relaxed">
                  {finishedCategoryIds.length === 0
                    ? "Nuk ke përfunduar asnjë kategori akoma. Eksploro dhe kliko 'Përfundo' në kategoritë e tua!"
                    : "Ke përfunduar vetëm 1 kategori. Duhet të paktën 1 tjetër për të filluar Quiz Mikst."}
                </p>
                <p className="text-gray-400 text-xs mb-6 leading-relaxed">
                  Minimumi i kërkuar: <span className="font-bold text-gray-600">2 kategori</span> të përfunduara.
                </p>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-teal-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((finishedCategoryIds.length / 2) * 100, 100)}%` }}
                  />
                </div>
                <button
                  onClick={() => setShowQuizInfo(false)}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all border-none cursor-pointer"
                >
                  Kuptova!
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="max-w-6xl mx-auto w-full">
          {/* Header */}
          <header className="mb-4 flex-shrink-0">
            <div style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 24,
              background: "linear-gradient(135deg, #14532d 0%, #16a34a 40%, #22c55e 75%, #86efac 100%)",
              borderRadius: 20,
              padding: isMobile ? "20px" : "28px 32px",
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
              <div style={{ position: "absolute", bottom: -60, right: 80, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

              <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                  <FolderOpen size={14} />
                  Praktikë Gjuhësore
                </div>
                <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 28 : 38, fontWeight: 400, color: "#fff", letterSpacing: -0.5, lineHeight: 1.1, margin: "0 0 8px" }}>
                  Kategori Fjalësh
                </h1>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", margin: 0, maxWidth: 380, lineHeight: 1.5 }}>
                  Eksploro kategori të ndryshme të fjalëve gjermane
                </p>
              </div>

              <div style={{ display: "flex", gap: 12, flexShrink: 0, position: "relative", zIndex: 1, alignSelf: "center", width: isMobile ? "100%" : "auto" }}>
                {(() => {
                  const canQuiz = finishedCategoryIds.length >= 2
                  const mixedLocked = !isPaid
                  return (
                    <motion.button
                      onClick={handleOpenMixedQuiz}
                      whileHover={{ scale: 1.04, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        position: "relative",
                        background: mixedLocked
                          ? "rgba(0,0,0,0.25)"
                          : canQuiz
                          ? "linear-gradient(135deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.12) 100%)"
                          : "rgba(0,0,0,0.18)",
                        border: `1.5px solid ${canQuiz && !mixedLocked ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.18)"}`,
                        borderRadius: 18,
                        padding: "14px 20px",
                        display: "flex", alignItems: "center", gap: 12,
                        cursor: "pointer",
                        flex: isMobile ? 1 : "unset",
                        backdropFilter: "blur(8px)",
                        boxShadow: canQuiz && !mixedLocked
                          ? "0 8px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.25)"
                          : "0 4px 16px rgba(0,0,0,0.15)",
                        overflow: "hidden",
                      }}
                    >
                      {canQuiz && !mixedLocked && (
                        <motion.div
                          animate={{ x: ["−100%", "200%"] }}
                          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.5 }}
                          style={{
                            position: "absolute", top: 0, left: 0, width: "40%", height: "100%",
                            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
                            pointerEvents: "none",
                          }}
                        />
                      )}
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                        background: mixedLocked
                          ? "linear-gradient(135deg, rgba(251,191,36,0.35), rgba(245,158,11,0.2))"
                          : canQuiz
                          ? "linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.15))"
                          : "rgba(255,255,255,0.12)",
                        border: "1px solid rgba(255,255,255,0.25)",
                        boxShadow: canQuiz && !mixedLocked ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                      }}>
                        {mixedLocked ? <Crown size={18} color="rgba(251,191,36,1)" /> : canQuiz ? <Shuffle size={18} color="#fff" /> : <Lock size={18} color="rgba(255,255,255,0.6)" />}
                      </div>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", lineHeight: 1, marginBottom: 4, letterSpacing: "-0.01em" }}>
                          Quiz Mikst
                        </div>
                        <div style={{
                          fontSize: 11, fontWeight: 600, letterSpacing: "0.02em",
                          color: mixedLocked ? "rgba(251,191,36,0.85)" : canQuiz ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.45)",
                        }}>
                          {mixedLocked ? "🔒 Premium" : canQuiz ? "▶ Fillo tani" : `${finishedCategoryIds.length}/2 kategori`}
                        </div>
                      </div>
                    </motion.button>
                  )
                })()}
              </div>
            </div>
          </header>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center min-h-48">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent"></div>
            </div>
          ) : categories.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3">
                {categories.slice(0, visibleCategories).map((category, index) => {
                  const IconComponent = iconMap[category.icon] || FolderOpen
                  const categoryIdStr = String(category._id?._id || category._id)
                  const isCompleted = finishedCategoryIds.includes(categoryIdStr)
                  const style = getTypeStyle(category.type)
                  const gradient = typeGradients[category.type] || typeGradients.default

                  return (
                    <div
                      key={category._id}
                      onClick={() => fetchCategoryDetails(category._id, category.category)}
                      className={`group relative cursor-pointer transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] ${
                        index < 12 ? 'animate-stagger-in' : ''
                      }`}
                      style={index < 12 ? { animationDelay: `${index * 25}ms` } : undefined}
                    >
                      <div className={`relative rounded-xl overflow-hidden border ${
                        isCompleted 
                          ? 'border-amber-200 bg-gradient-to-b from-amber-50 to-white' 
                          : 'border-slate-200/80 bg-white hover:border-slate-300'
                      } shadow-sm hover:shadow-md`}>
                        {/* Compact icon header */}
                        <div className={`bg-gradient-to-br ${gradient} px-3 py-2.5 flex items-center gap-2`}>
                          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                            <IconComponent className="w-3.5 h-3.5 text-white" />
                          </div>
                          <h3 className="text-[11px] sm:text-xs font-semibold text-white leading-tight line-clamp-2 flex-1">
                            {category.category}
                          </h3>
                          {isCompleted && (
                            <div className="w-4.5 h-4.5 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                              <Check className="w-2.5 h-2.5 text-amber-500" />
                            </div>
                          )}
                        </div>

                        {/* Minimal footer */}
                        <div className="px-2.5 py-2 flex items-center justify-between gap-1.5">
                          {category.type ? (
                            <span className={`text-[9px] sm:text-[10px] font-medium px-1.5 py-0.5 rounded-md truncate max-w-[60%] ${style.bg} ${style.text}`}>
                              {category.type}
                            </span>
                          ) : <span />}
                          <span className={`text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded-md flex-shrink-0 ${
                            isCompleted
                              ? "bg-amber-100 text-amber-600"
                              : "bg-slate-100 text-slate-500 group-hover:bg-emerald-500 group-hover:text-white"
                          }`}>
                            {isCompleted ? "Kryer" : "Hap"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {categories.length > visibleCategories && (
                <div id="load-more-sentinel" className="mt-6 flex justify-center">
                  {loadingMore ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-emerald-500 border-t-transparent"></div>
                  ) : (
                    <button
                      onClick={loadMoreCategories}
                      className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md active:scale-95"
                    >
                      +{categories.length - visibleCategories} më shumë
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <Grid className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 text-xs">Nuk ka kategori të disponueshme</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

const LANG_SPEECH = { de: "de-DE", en: "en-GB", fr: "fr-FR", tr: "tr-TR", it: "it-IT" }
const LANG_FLAG = { de: "https://flagcdn.com/w40/de.png", en: "https://flagcdn.com/w40/gb.png", fr: "https://flagcdn.com/w40/fr.png", tr: "https://flagcdn.com/w40/tr.png", it: "https://flagcdn.com/w40/it.png" }

function AlbanianFlagSvg({ size = 16 }) {
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
  )
}

const CAT_QUIZ_STYLES = `
  @keyframes catQuizBounce {
    0%   { transform: scale(1); }
    40%  { transform: scale(1.06); }
    70%  { transform: scale(0.97); }
    100% { transform: scale(1); }
  }
  @keyframes catQuizShake {
    0%,100% { transform: translateX(0); }
    15%     { transform: translateX(-8px); }
    30%     { transform: translateX(8px); }
    45%     { transform: translateX(-6px); }
    60%     { transform: translateX(6px); }
    75%     { transform: translateX(-3px); }
    90%     { transform: translateX(3px); }
  }
  .cat-quiz-correct { animation: catQuizBounce 0.4s cubic-bezier(.34,1.56,.64,1); }
  .cat-quiz-wrong   { animation: catQuizShake 0.45s ease; }
`

if (typeof document !== "undefined" && !document.getElementById("cat-quiz-anim-styles")) {
  const tag = document.createElement("style")
  tag.id = "cat-quiz-anim-styles"
  tag.textContent = CAT_QUIZ_STYLES
  document.head.appendChild(tag)
}

const LETTER_MAP_CAT    = ["a", "b", "c", "d"]
const LETTER_LABELS_CAT = ["A", "B", "C", "D"]

function CatAnswerButton({ label, text, state, disabled, onClick }) {
  const styles = {
    idle:    { border: "2px solid #e2e8f0", background: "#f8fafc", color: "#1e293b" },
    correct: { border: "2px solid #22c55e", background: "rgba(34,197,94,0.08)", color: "#15803d" },
    wrong:   { border: "2px solid #ef4444", background: "rgba(239,68,68,0.08)", color: "#b91c1c" },
    reveal:  { border: "2px solid #22c55e", background: "rgba(34,197,94,0.06)", color: "#15803d" },
  }[state]
  const keyStyles = {
    idle:    { background: "rgba(0,0,0,0.06)", color: "#64748b" },
    correct: { background: "#22c55e", color: "white" },
    wrong:   { background: "#ef4444", color: "white" },
    reveal:  { background: "#22c55e", color: "white" },
  }[state]
  const animClass = state === "correct" ? "cat-quiz-correct" : state === "wrong" ? "cat-quiz-wrong" : ""
  return (
    <button onClick={onClick} disabled={disabled} className={animClass}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "16px 18px", borderRadius: 16,
        fontFamily: "inherit", fontSize: 15, fontWeight: 700,
        cursor: disabled ? "default" : "pointer",
        textAlign: "left", width: "100%",
        transition: "transform 0.15s, box-shadow 0.15s, border-color 0.15s, background 0.15s",
        ...styles,
      }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.08)" } }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "" }}
    >
      <span style={{
        minWidth: 32, height: 32, borderRadius: 10,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 800, flexShrink: 0,
        ...keyStyles,
      }}>
        {state === "correct" || state === "reveal" ? <Check size={14} /> : state === "wrong" ? <XCircle size={14} /> : label}
      </span>
      {text}
    </button>
  )
}

function CatStreakDot({ state }) {
  const base = { width: 20, height: 20, borderRadius: "50%", transition: "all 0.3s", flexShrink: 0 }
  if (state === "correct") return <div style={{ ...base, background: "#22c55e", boxShadow: "0 0 10px rgba(34,197,94,0.5)" }} />
  if (state === "wrong")   return <div style={{ ...base, background: "#ef4444", boxShadow: "0 0 8px rgba(239,68,68,0.4)" }} />
  if (state === "current") return <div style={{ ...base, background: "#facc15", boxShadow: "0 0 12px rgba(250,204,21,0.7)", animation: "pulse 1s infinite" }} />
  return <div style={{ ...base, background: "#e2e8f0", border: "2px solid #cbd5e1" }} />
}

function CategoryMixedQuizScreen({ words, language, onFinish }) {
  const questions = useMemo(() => {
    return words.map((w, i) => {
      const wrong = words.filter((_, j) => j !== i)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(x => x.translation)
      const opts = [w.translation, ...wrong].sort(() => Math.random() - 0.5)
      const correctLetter = LETTER_MAP_CAT[opts.indexOf(w.translation)]
      return { word: w.word, correct: correctLetter, options: opts }
    })
  }, [])

  const [currentIndex, setCurrentIndex]         = useState(0)
  const [submittedAnswers, setSubmittedAnswers]  = useState({})
  const [history, setHistory]                   = useState([])
  const [currentStreak, setCurrentStreak]       = useState(0)
  const [showResult, setShowResult]             = useState(false)
  const [score, setScore]                       = useState(0)
  const [comboVisible, setComboVisible]         = useState(false)
  const [comboText, setComboText]               = useState("")
  const [xpEarned, setXpEarned]                 = useState(0)
  const [isMobile]                              = useState(window.innerWidth < 640)
  const comboTimerRef                           = useRef(null)

  const totalQ         = questions.length
  const q              = questions[currentIndex]
  const progress       = ((currentIndex + 1) / totalQ) * 100
  const submitted      = submittedAnswers[currentIndex]
  const isSubmitted    = submitted !== undefined
  const isCorrect      = isSubmitted && submitted.isCorrect
  const isLastQuestion = currentIndex === totalQ - 1

  const handleAnswer = (letter) => {
    const correct = letter === q.correct
    setSubmittedAnswers(prev => ({ ...prev, [currentIndex]: { answer: letter, isCorrect: correct } }))
    const newStreak = correct ? currentStreak + 1 : 0
    setCurrentStreak(newStreak)
    const newHistory = [...history]
    newHistory[currentIndex] = correct
    setHistory(newHistory)
    if (correct) {
      setScore(s => s + (newStreak > 2 ? 2 : 1))
      if (newStreak > 2) {
        setComboText(`${newStreak} Rreshte Saktë!`)
        setComboVisible(true)
        clearTimeout(comboTimerRef.current)
        comboTimerRef.current = setTimeout(() => setComboVisible(false), 2200)
      }
    }
    setTimeout(() => {
      if (!isLastQuestion) {
        setCurrentIndex(i => i + 1)
      } else {
        const correctCount = newHistory.filter(Boolean).length
        const pct = Math.round((correctCount / totalQ) * 100)
        if (pct >= 80) {
          const xp = 15
          setXpEarned(xp)
          authService.addXp(xp, "Category Mixed Quiz").catch(() => {})
        }
        setShowResult(true)
      }
    }, 1000)
  }

  if (showResult) {
    const correctCount = history.filter(Boolean).length
    const pct = Math.round((correctCount / totalQ) * 100)
    const passed = pct >= 60
    return (
      <div style={{ minHeight: "100vh", background: "#f8f9fc", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ width: "100%", maxWidth: 440 }}>
          <div style={{ background: "white", borderRadius: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.1)", padding: 36, textAlign: "center" }}>
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
              style={{
                width: 96, height: 96, borderRadius: 28, margin: "0 auto 20px",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: passed
                  ? "linear-gradient(135deg, #34d399, #14b8a6)"
                  : "linear-gradient(135deg, #fbbf24, #f97316)",
                boxShadow: passed ? "0 12px 32px rgba(20,184,166,0.35)" : "0 12px 32px rgba(249,115,22,0.35)",
              }}>
              <Trophy size={48} color="white" />
            </motion.div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#1e293b", marginBottom: 8 }}>
              {passed ? "Urime!" : "Vazhdo të Praktikosh!"}
            </h2>
            <p style={{ color: "#64748b", marginBottom: 28, fontSize: 14 }}>
              {passed ? "Shkëlqyeshëm, e kaluat quiz-in!" : "Provoni përsëri për rezultat më të mirë"}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: xpEarned > 0 ? "1fr 1fr 1fr" : "1fr 1fr", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Rezultati", value: `${pct}%` },
                { label: "Të sakta", value: `${correctCount}/${totalQ}` },
                ...(xpEarned > 0 ? [{ label: "XP Fituar", value: `+${xpEarned}` }] : []),
              ].map((s, i) => (
                <div key={s.label} style={{ background: i === 2 ? "linear-gradient(135deg, #fef9c3, #fef3c7)" : "#f8fafc", borderRadius: 16, padding: "18px 12px", border: i === 2 ? "1px solid #fde68a" : "none" }}>
                  <div style={{ fontSize: passed ? 28 : 26, fontWeight: 800, color: i === 2 ? "#d97706" : passed ? "#14b8a6" : "#f97316", marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 13, color: i === 2 ? "#b45309" : "#64748b", fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <button onClick={onFinish} style={{
              width: "100%", padding: "16px", borderRadius: 16, border: "none",
              background: passed ? "linear-gradient(135deg, #14b8a6, #22c55e)" : "linear-gradient(135deg, #fbbf24, #f97316)",
              color: "white", fontSize: 16, fontWeight: 700, cursor: "pointer",
              boxShadow: passed ? "0 8px 24px rgba(20,184,166,0.3)" : "0 8px 24px rgba(249,115,22,0.3)",
            }}>
              Kthehu te Kategoritë
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#f8f9fc",
      backgroundImage: "radial-gradient(ellipse 60% 40% at 20% 10%, rgba(20,184,166,0.06) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 80% 80%, rgba(16,185,129,0.05) 0%, transparent 60%)",
      padding: isMobile ? "16px 12px" : "32px 16px",
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      {/* Combo toast */}
      <div style={{ position: "fixed", top: 72, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 200, pointerEvents: "none" }}>
        <motion.div
          initial={false}
          animate={{ y: comboVisible ? 0 : -80, opacity: comboVisible ? 1 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          style={{
            background: "linear-gradient(135deg, #f97316, #fbbf24)",
            color: "white", padding: isMobile ? "8px 20px" : "10px 28px", borderRadius: 99,
            fontWeight: 800, fontSize: isMobile ? 14 : 17,
            boxShadow: "0 8px 30px rgba(249,115,22,0.4)",
            display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap",
          }}>
          <Flame size={isMobile ? 15 : 18} />
          {comboText}
        </motion.div>
      </div>

      <div style={{ width: "100%", maxWidth: 660 }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 10, marginBottom: isMobile ? 16 : 24 }}>
          <button onClick={onFinish} style={{
            display: "flex", alignItems: "center", gap: 4,
            background: "white", border: "1px solid #e2e8f0", color: "#64748b",
            padding: isMobile ? "7px 10px" : "8px 16px", borderRadius: 12, fontFamily: "inherit",
            fontSize: isMobile ? 13 : 14, fontWeight: 700, cursor: "pointer",
          }}>
            <ArrowLeft size={15} /> {!isMobile && "Mbrapa"}
          </button>
          <div style={{ flex: 1 }} />
          <span style={{
            background: "linear-gradient(135deg, #14b8a6, #22c55e)", color: "white",
            padding: "6px 14px", borderRadius: 10, fontSize: 13, fontWeight: 800,
          }}>
            MIX
          </span>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: isMobile ? 14 : 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, fontWeight: 700 }}>
            <span style={{ color: "#64748b" }}>Pyetja {currentIndex + 1} nga {totalQ}</span>
            <span style={{ color: "#14b8a6" }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ height: 8, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
            <motion.div animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ height: "100%", background: "linear-gradient(90deg, #14b8a6, #34d399)", borderRadius: 99 }}
            />
          </div>
        </div>

        {/* Streak dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: isMobile ? 6 : 8, marginBottom: isMobile ? 14 : 20, flexWrap: "wrap" }}>
          {Array.from({ length: totalQ }, (_, i) => (
            <CatStreakDot key={i} state={history[i] === true ? "correct" : history[i] === false ? "wrong" : i === currentIndex ? "current" : "idle"} />
          ))}
        </div>

        {/* Question card */}
        <div style={{
          background: "white", border: "1px solid rgba(0,0,0,0.07)",
          borderRadius: isMobile ? 18 : 24,
          padding: isMobile ? "20px 16px 24px" : "32px 36px 36px",
          marginBottom: 12,
          boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #14b8a6, #22c55e)" }} />
          <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
            PYETJA {String(currentIndex + 1).padStart(2, "0")}
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={currentIndex}
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
              style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800, color: "#1e293b", lineHeight: 1.3, marginBottom: isMobile ? 20 : 28 }}>
              {q.word}
            </motion.div>
          </AnimatePresence>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 10 : 12 }}>
            {q.options.map((opt, idx) => {
              const letter = LETTER_MAP_CAT[idx]
              const wasSelected = submitted?.answer === letter
              const isThisCorrect = q.correct === letter
              let state = "idle"
              if (isSubmitted) {
                if (wasSelected && submitted.isCorrect) state = "correct"
                else if (wasSelected && !submitted.isCorrect) state = "wrong"
                else if (isThisCorrect) state = "reveal"
              }
              return (
                <CatAnswerButton key={idx}
                  label={LETTER_LABELS_CAT[idx]} text={opt} state={state}
                  disabled={isSubmitted}
                  onClick={() => handleAnswer(letter)}
                />
              )
            })}
          </div>
        </div>

        {/* Feedback bar */}
        <AnimatePresence>
          {isSubmitted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              style={{
                display: "flex", alignItems: "center", gap: isMobile ? 10 : 14,
                padding: isMobile ? "14px" : "16px 20px", borderRadius: 16,
                border: `2px solid ${isCorrect ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}`,
                background: isCorrect ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                marginBottom: 12,
              }}>
              <div style={{ color: isCorrect ? "#22c55e" : "#ef4444", flexShrink: 0 }}>
                {isCorrect ? <CheckCircle size={22} /> : <XCircle size={22} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: isCorrect ? "#16a34a" : "#dc2626", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>
                  {isCorrect ? "Saktë!" : "Gabim!"}
                </div>
                <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, color: isCorrect ? "#15803d" : "#b91c1c" }}>
                  {isCorrect
                    ? ["Shkëlqyeshëm!", "Bravo!", "E saktë!", "Vazhdoni kështu!"][currentIndex % 4]
                    : `Përgjigja: "${q.options[LETTER_MAP_CAT.indexOf(q.correct)]}"`}
                </div>
              </div>
              {isLastQuestion && (
                <button onClick={() => setShowResult(true)} style={{
                  background: "#14b8a6", border: "none", color: "white",
                  padding: isMobile ? "9px 14px" : "10px 20px", borderRadius: 12, fontFamily: "inherit",
                  fontSize: 13, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap",
                  display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
                }}>
                  <Trophy size={14} /> Dërgo
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default Category
