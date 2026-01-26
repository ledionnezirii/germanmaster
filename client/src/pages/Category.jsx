"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { categoriesService, ttsService } from "../services/api"
import { 
  FolderOpen, ArrowLeft, BookOpen, Calendar, Check, 
  Grid, Globe, Leaf, Briefcase, Coffee, Film, Guitar, 
  Book, Trophy, Clock, Car, TreePine, Flag, Heart, 
  Snowflake, Users, Sparkles, UtensilsCrossed, Home, 
  Shirt, ShoppingBag, Hand, Plane, Mountain, PawPrint, 
  X, Languages, Hash, Palette, MessageCircle, Timer,
  Volume2, VolumeX, Play, Pause, Star, Zap, TrendingUp, LogOut
} from 'lucide-react'
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

const Category = () => {
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
  
  // Audio state
  const [playingAudioIndex, setPlayingAudioIndex] = useState(null)
  const [loadingAudioIndex, setLoadingAudioIndex] = useState(null)
  const [audioCache, setAudioCache] = useState({})
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
        const response = await categoriesService.getFinishedCategories()
        const data = response.data || response
        setFinishedCategoryIds(data.finishedCategoryIds || [])
      } catch {
        setFinishedCategoryIds([])
      }
    }
    fetchFinishedCategories()
  }, [])

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

  useEffect(() => { fetchCategories() }, [])

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      const response = await categoriesService.getAllCategories({ limit: 100 })
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
        selectedCategory.level || "A1"
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
            <div className="flex items-center justify-center min-h-96">
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
                    className="bg-white rounded-xl p-4 border-2 border-emerald-200 hover:border-emerald-300 hover:shadow-md transition-all animate-stagger-in"
                    style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-900 text-sm">{wordObj.word}</h3>
                        <p className="text-slate-600 text-sm mt-0.5">{wordObj.translation}</p>
                        {wordObj.pronunciation && (
                          <p className="text-slate-400 text-xs mt-1 italic">/{wordObj.pronunciation}/</p>
                        )}
                      </div>
                      
                      {/* Audio Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          playWordAudio(wordObj, index)
                        }}
                        disabled={isLoading}
                        className={`flex-shrink-0 p-2.5 rounded-xl transition-all active:scale-90 ${
                          isPlaying 
                            ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30" 
                            : isLoading
                              ? "bg-slate-100 text-slate-400"
                              : "bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200"
                        }`}
                        title={isPlaying ? "Ndalo" : "Dëgjo"}
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 animate-spin rounded-full border-b-2 border-current"></div>
                        ) : isPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {wordObj.examples?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-emerald-100">
                        <p className="text-xs text-emerald-600 font-medium mb-1.5">Shembuj</p>
                        {wordObj.examples.slice(0, 2).map((example, i) => (
                          <p key={i} className="text-xs text-slate-500 leading-relaxed">• {example}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-xl border-2 border-emerald-200">
              <BookOpen className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Nuk ka fjalë në këtë kategori</p>
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
        @keyframes bounce-in { 0% { transform: scale(0.9); opacity: 0; } 50% { transform: scale(1.05); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes stagger-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-bounce-in { animation: bounce-in 0.4s ease-out; }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
        .animate-stagger-in { animation: stagger-in 0.3s ease-out backwards; }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 p-4 flex flex-col">
        {NotificationToast}
        
        <div className="max-w-6xl mx-auto w-full">
          {/* Header */}
          <header className="mb-4 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-xl border-2 border-emerald-200 p-6 overflow-hidden relative animate-slide-up">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full transform translate-x-16 -translate-y-16 opacity-50" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-teal-100 to-emerald-100 rounded-full transform -translate-x-8 translate-y-8 opacity-50" />
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Kategori Fjalësh</h1>
                    <p className="text-slate-600 text-sm">Eksploro kategori të ndryshme të fjalëve gjermane</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Languages className="w-6 h-6 text-emerald-600" />
                    <span className="text-sm font-semibold text-emerald-700">{categories.length} kategori</span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center min-h-96">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
            </div>
          ) : categories.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 flex-1 overflow-y-auto">
                {categories.slice(0, visibleCategories).map((category, index) => {
                  const IconComponent = iconMap[category.icon] || FolderOpen
                  const categoryIdStr = String(category._id?._id || category._id)
                  const isCompleted = finishedCategoryIds.includes(categoryIdStr)
                  const style = getTypeStyle(category.type)

                  return (
                    <div
                      key={category._id}
                      onClick={() => fetchCategoryDetails(category._id, category.category)}
                      className={`group bg-white rounded-xl p-4 border-2 cursor-pointer transition-all relative hover:-translate-y-1 animate-stagger-in ${
                        isCompleted
                          ? "bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-amber-300 hover:border-amber-400"
                          : "border-emerald-200 hover:border-emerald-300 hover:shadow-lg"
                      }`}
                      style={{ animationDelay: `${Math.min(index * 20, 400)}ms` }}
                    >
                      {isCompleted && (
                        <div className="absolute top-3 right-3">
                          <div className="w-5 h-5 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full flex items-center justify-center shadow-sm">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      )}
                      
                      <div className={`w-10 h-10 rounded-lg ${style.bg} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform border ${style.border}`}>
                        <IconComponent className={`w-5 h-5 ${style.text}`} />
                      </div>
                      
                      <h3 className={`text-sm font-semibold line-clamp-2 mb-2 min-h-[2.5rem] ${
                        isCompleted
                          ? "text-amber-700 group-hover:text-amber-800"
                          : "text-gray-800 group-hover:text-emerald-700"
                      }`}>
                        {category.category}
                      </h3>
                      
                      <div className="flex items-center justify-between">
                        {category.type && (
                          <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-md ${style.bg} ${style.text}`}>
                            {category.type}
                          </span>
                        )}
                        <span
                          className={`text-xs px-3 py-1 rounded-full font-semibold shadow-sm ${
                            isCompleted
                              ? "bg-gradient-to-r from-amber-400 to-orange-400 text-white"
                              : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                          }`}
                        >
                          {isCompleted ? "✓ Kryer" : "Hap"}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {categories.length > visibleCategories && (
                <div id="load-more-sentinel" className="mt-8 flex justify-center">
                  {loadingMore ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                  ) : (
                    <button
                      onClick={loadMoreCategories}
                      className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/30 active:scale-95"
                    >
                      Shfaq më shumë ({categories.length - visibleCategories})
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 bg-white rounded-xl border-2 border-emerald-200">
              <Grid className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Nuk ka kategori të disponueshme</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Category