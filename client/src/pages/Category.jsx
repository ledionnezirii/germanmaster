"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { categoriesService } from "../services/api"
import { useAuth } from "../context/AuthContext"
import { motion, AnimatePresence } from "framer-motion"
import { 
  FolderOpen, ArrowLeft, BookOpen, Calendar, Check, 
  Grid, Globe, Leaf, Briefcase, Coffee, Film, Guitar, 
  Book, Trophy, Clock, Car, TreePine, Flag, Heart, 
  Snowflake, Users, Sparkles, UtensilsCrossed, Home, 
  Shirt, ShoppingBag, Hand, Plane, Mountain, PawPrint, 
  X, Languages, Hash, Palette, MessageCircle, Timer
} from 'lucide-react'

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

  const { user, refreshProfile } = useAuth()

  const showNotification = (message, type = "success") => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

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
    if (user) fetchFinishedCategories()
  }, [user])

  const availableWordTypes = useMemo(() => {
    if (categories.length === 0) return [{ value: "all", label: "Të gjitha" }]
    const uniqueTypes = [...new Set(categories.map((cat) => cat.type).filter(Boolean))]
    return [
      { value: "all", label: "Të gjitha" },
      ...uniqueTypes.map((type) => ({ value: type, label: type.charAt(0).toUpperCase() + type.slice(1) })),
    ]
  }, [categories])

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
        level: categoryData.level || "",
        type: categoryData.type || "other",
      })
    } catch {
      setSelectedCategory({ id: categoryId, name: categoryName, words: [], description: "", level: "", type: "other" })
    } finally {
      setLoading(false)
    }
  }, [])

  const handleFinishCategory = async () => {
    if (!selectedCategory?.id) return
    try {
      setFinishingCategory(true)
      const response = await categoriesService.finishCategory(selectedCategory.id)
      const data = response.data || response
      setXpGained(data.xpGained || 0)
      showNotification(`Urime! +${data.xpGained || 0} XP`, "success")
      setShowCongrats(true)
      
      try {
        const finishedResponse = await categoriesService.getFinishedCategories()
        setFinishedCategoryIds((finishedResponse.data || finishedResponse).finishedCategoryIds || [])
      } catch {}
      
      try { await refreshProfile() } catch {}
      
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

  // Notification Toast
  const NotificationToast = (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg backdrop-blur-sm ${
            notification.type === "success" 
              ? "bg-emerald-500/95 text-white" 
              : "bg-red-500/95 text-white"
          }`}
        >
          {notification.type === "success" ? <Check size={18} /> : <X size={18} />}
          <span className="text-sm font-medium">{notification.message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )

  // Congrats Screen
  if (showCongrats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        {NotificationToast}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg"
          >
            <Trophy className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Urime!</h2>
          <p className="text-slate-600 text-sm mb-6">
            Përfunduat <span className="font-semibold text-slate-900">{selectedCategory?.name}</span>
          </p>
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl py-4 px-6 mb-6">
            <p className="text-emerald-100 text-xs font-medium mb-1">XP e fituar</p>
            <p className="text-3xl font-bold text-white">+{xpGained}</p>
          </div>
          <button
            onClick={() => { setShowCongrats(false); setSelectedCategory(null) }}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Vazhdo
          </button>
        </motion.div>
      </div>
    )
  }

  // Category Detail View
  if (selectedCategory) {
    const categoryIdStr = String(selectedCategory.id?._id || selectedCategory.id)
    const isCategoryFinished = finishedCategoryIds.includes(categoryIdStr)
    const style = getTypeStyle(selectedCategory.type)

    return (
      <div className="min-h-screen bg-slate-50">
        {NotificationToast}
        <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedCategory(null)}
                className="p-2 hover:bg-slate-200/80 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{selectedCategory.name}</h1>
                {selectedCategory.type && (
                  <span className={`inline-block mt-1 px-2.5 py-0.5 text-xs font-medium rounded-full ${style.bg} ${style.text}`}>
                    {selectedCategory.type}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleFinishCategory}
              disabled={finishingCategory || isCategoryFinished}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isCategoryFinished
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
              }`}
            >
              {finishingCategory ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{isCategoryFinished ? "E përfunduar" : "Përfundo"}</span>
            </button>
          </div>

          {/* Words Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-8 h-8 border-2 border-slate-200 border-t-slate-600 rounded-full" />
            </div>
          ) : selectedCategory.words?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedCategory.words.map((wordObj, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-white rounded-xl p-4 border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-900 text-sm">{wordObj.word}</h3>
                      <p className="text-slate-600 text-sm mt-0.5">{wordObj.translation}</p>
                      {wordObj.pronunciation && (
                        <p className="text-slate-400 text-xs mt-1 italic">/{wordObj.pronunciation}/</p>
                      )}
                    </div>
                  </div>
                  {wordObj.examples?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-xs text-slate-400 font-medium mb-1.5">Shembuj</p>
                      {wordObj.examples.slice(0, 2).map((example, i) => (
                        <p key={i} className="text-xs text-slate-500 leading-relaxed">• {example}</p>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Nuk ka fjalë në këtë kategori</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Main Categories View
  return (
    <div className="min-h-screen bg-slate-50">
      {NotificationToast}
      
      {/* Header */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Languages className="w-5 h-5" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold">Kategoritë</h1>
              </div>
              <p className="text-slate-400 text-sm max-w-md">
                Mësoni fjalë të reja dhe zgjeroni fjalorin tuaj
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium">{finishedCategoryIds.length} përfunduar</span>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-8 h-8 border-2 border-slate-200 border-t-slate-600 rounded-full" />
          </div>
        ) : categories.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {categories.slice(0, visibleCategories).map((category, index) => {
                const IconComponent = iconMap[category.icon] || iconMap.default
                const categoryIdStr = String(category._id?._id || category._id)
                const isCompleted = finishedCategoryIds.includes(categoryIdStr)
                const style = getTypeStyle(category.type)

                return (
                  <motion.div
                    key={category._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => fetchCategoryDetails(category._id, category.category)}
                    className="group bg-white rounded-xl p-4 border border-slate-200/80 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all relative"
                  >
                    {isCompleted && (
                      <div className="absolute top-3 right-3">
                        <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}
                    
                    <div className={`w-10 h-10 rounded-lg ${style.bg} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                      <IconComponent className={`w-5 h-5 ${style.text}`} />
                    </div>
                    
                    <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 mb-2 min-h-[2.5rem]">
                      {category.category}
                    </h3>
                    
                    {category.type && (
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-md ${style.bg} ${style.text}`}>
                        {category.type}
                      </span>
                    )}
                  </motion.div>
                )
              })}
            </div>

            {categories.length > visibleCategories && (
              <div id="load-more-sentinel" className="mt-8 flex justify-center">
                {loadingMore ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-6 h-6 border-2 border-slate-200 border-t-slate-600 rounded-full" />
                ) : (
                  <button
                    onClick={loadMoreCategories}
                    className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all"
                  >
                    Shfaq më shumë ({categories.length - visibleCategories})
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <Grid className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Nuk ka kategori të disponueshme</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Category