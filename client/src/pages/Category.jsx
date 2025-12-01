"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { categoriesService } from "../services/api"
import { useAuth } from "../context/AuthContext"
import { FolderOpen, ArrowLeft, BookOpen, Calendar, Palette, Smile, Heart, User, Grid, Globe, Leaf, Bus, Briefcase, Hand, Coffee, Film, TreePine, Guitar, HardHat, Book, Sword, BellRing, Castle, Swords, Hammer, CheckCircle, Trophy, BookCopy, SortDesc, PaletteIcon, Handshake, Speech, Calendar1Icon, Clock, CarTaxiFront, TreePalm, Flag, HeartIcon, Workflow, CloudSnow, User2, Sparkles, GlassWater, Home, ShoppingBag, ShoppingBagIcon, Shirt, HandIcon, Plane, Sandwich, Mountain, PawPrint, XCircle, Languages } from 'lucide-react'
import { NumberedListIcon } from "@heroicons/react/24/outline"

const iconMap = {
  default: FolderOpen,
  Book: BookCopy,
  numbers: NumberedListIcon,
  palette: PaletteIcon,
  handshake: Handshake,
  speech: Speech,
  calendar: Calendar1Icon,
  clock: Clock,
  transport: CarTaxiFront,
  tree: TreePalm,
  flag: Flag,
  heart: HeartIcon,
  work: Workflow,
  seasons: CloudSnow,
  family: User2,
  hobbies: Sparkles,
  food: GlassWater,
  home: Home,
  clothes: Shirt,
  shopping: ShoppingBagIcon,
  body: HandIcon,
  travel: Plane,
  restaurant: Sandwich,
  nature: Mountain,
  animals: PawPrint
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
  const [notificationVisible, setNotificationVisible] = useState(false)

  const { user, updateUser, refreshProfile } = useAuth()

  const showNotification = (message, type = "success") => {
    setNotification({ message, type })
    setNotificationVisible(true)
    setTimeout(() => {
      setNotificationVisible(false)
      setTimeout(() => setNotification(null), 300)
    }, 3000)
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [selectedCategory])

  useEffect(() => {
    const fetchFinishedCategories = async () => {
      try {
        const response = await categoriesService.getFinishedCategories()
        const data = response.data || response
        const ids = data.finishedCategoryIds || []
        setFinishedCategoryIds(ids)
      } catch (error) {
        setFinishedCategoryIds([])
      }
    }

    if (user) {
      fetchFinishedCategories()
    }
  }, [user])

  const availableWordTypes = useMemo(() => {
    if (categories.length === 0) {
      return [{ value: "all", label: "Të gjitha" }]
    }

    const uniqueTypes = [...new Set(categories.map((cat) => cat.type).filter(Boolean))]
    return [
      { value: "all", label: "Të gjitha" },
      ...uniqueTypes.map((type) => ({
        value: type,
        label: type.charAt(0).toUpperCase() + type.slice(1),
      })),
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
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          loadMoreCategories()
        }
      },
      { threshold: 0.1 },
    )

    const sentinel = document.getElementById("load-more-sentinel")
    if (sentinel) {
      observer.observe(sentinel)
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel)
      }
    }
  }, [loadMoreCategories, loadingMore])

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      const response = await categoriesService.getAllCategories({ limit: 100 })

      let categoriesData = []
      if (response.data) {
        if (Array.isArray(response.data)) {
          categoriesData = response.data
        } else if (response.data.data && Array.isArray(response.data.data)) {
          categoriesData = response.data.data
        } else if (response.data.categories && Array.isArray(response.data.categories)) {
          categoriesData = response.data.categories
        }
      }

      setCategories(categoriesData)
    } catch (error) {
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

      const categoryWithWords = {
        id: categoryId,
        name: categoryName,
        words: categoryData.words || [],
        description: categoryData.description || "",
        level: categoryData.level || "",
        type: categoryData.type || "other",
      }

      setSelectedCategory(categoryWithWords)
    } catch (error) {
      setSelectedCategory({
        id: categoryId,
        name: categoryName,
        words: [],
        description: "Gabim gjatë ngarkimit të detajeve të kategorisë",
        level: "",
        type: "other",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  const handleFinishCategory = async () => {
    if (!selectedCategory || !selectedCategory.id) return

    try {
      setFinishingCategory(true)
      const response = await categoriesService.finishCategory(selectedCategory.id)

      const data = response.data || response
      setXpGained(data.xpGained || 0)
      
      showNotification(`Urime! Përfunduat "${selectedCategory.name}"! +${data.xpGained || 0} XP 🎉`, "success")
      
      setShowCongrats(true)

      try {
        const finishedResponse = await categoriesService.getFinishedCategories()
        const finishedData = finishedResponse.data || finishedResponse
        const ids = finishedData.finishedCategoryIds || []
        setFinishedCategoryIds(ids)
      } catch (fetchError) {
        // Silently handle
      }

      try {
        await refreshProfile()
      } catch (refreshError) {
        // Silently handle
      }

      setTimeout(() => {
        setShowCongrats(false)
        setSelectedCategory(null)
      }, 5000)
    } catch (error) {
      showNotification(error.response?.data?.message || "Gabim gjatë përfundimit të kategorisë", "error")
    } finally {
      setFinishingCategory(false)
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case "Bazat":
        return "bg-cyan-100 text-cyan-700"
      case "Numra":
        return "bg-indigo-100 text-indigo-700"
      case "Tjera":
        return "bg-purple-100 text-purple-700"
      case "Fraza":
        return "bg-rose-100 text-rose-700"
      case "Koha":
        return "bg-emerald-100 text-emerald-700"
      case "Mjedisi":
        return "bg-amber-100 text-amber-700"
      case "Natyra":
        return "bg-green-100 text-green-700"
      case "Njerëzit":
        return "bg-pink-100 text-pink-700"
      case "Gramatikë":
        return "bg-red-200 text-red-800"
      case "Të Përgjithshme":
        return "bg-yellow-200 text-yellow-800"
      case "Mbiemra":
        return "bg-pink-200 text-pink-800"
      case "Vocabulary":
        return "bg-blue-200 text-blue-800"
      case "Folje":
        return "bg-violet-200 text-violet-800"
      case "Kulturë":
        return "bg-purple-200 text-purple-800"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  // Notification component
  const NotificationElement = notification && (
    <div
      className={`fixed bottom-5 right-5 px-6 py-4 rounded-2xl font-semibold text-sm shadow-2xl z-50 flex items-center gap-3 transition-all duration-300 ease-out transform ${
        notificationVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-4 opacity-0 scale-95"
      } ${
        notification.type === "success" 
          ? "bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white" 
          : "bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 text-white"
      }`}
      style={{
        boxShadow: notification.type === "success" 
          ? "0 10px 40px rgba(16, 185, 129, 0.4)" 
          : "0 10px 40px rgba(239, 68, 68, 0.4)"
      }}
    >
      <div className="p-1.5 rounded-full bg-white/20">
        {notification.type === "success" ? <CheckCircle size={20} /> : <XCircle size={20} />}
      </div>
      <span className="max-w-xs">{notification.message}</span>
    </div>
  )

  if (showCongrats) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        {NotificationElement}
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <Trophy className="h-10 w-10 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Urime!</h2>
          <p className="text-lg text-gray-700 mb-6">
            Ju përfunduat kategorinë <span className="font-semibold text-teal-600">{selectedCategory?.name}</span>!
          </p>
          <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl p-6 mb-6">
            <p className="text-white text-sm font-medium mb-2">XP e Fituar</p>
            <p className="text-5xl font-bold text-white">+{xpGained}</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-6">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Vazhdo kështu!</span>
          </div>
          <button
            onClick={() => {
              setShowCongrats(false)
              setSelectedCategory(null)
            }}
            className="w-full flex items-center justify-center gap-2 text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 transition-all duration-200 px-6 py-3 rounded-xl shadow-md hover:shadow-lg"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kthehu te Kategoritë</span>
          </button>
        </div>
      </div>
    )
  }

  if (selectedCategory) {
    const categoryIdStr = String(selectedCategory.id?._id || selectedCategory.id)
    const isCategoryFinished = finishedCategoryIds.includes(categoryIdStr)

    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        {NotificationElement}
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {selectedCategory.name}
                </h1>
                {selectedCategory.type && (
                  <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full w-fit ${getTypeColor(selectedCategory.type)}`}>
                    {availableWordTypes.find((t) => t.value === selectedCategory.type)?.label || selectedCategory.type}
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all duration-200 px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Kthehu</span>
                </button>
                <button
                  onClick={handleFinishCategory}
                  disabled={finishingCategory || isCategoryFinished}
                  className={`flex items-center gap-2 text-sm font-medium text-white transition-all duration-200 px-5 py-2.5 rounded-xl shadow-md disabled:cursor-not-allowed ${
                    isCategoryFinished
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 hover:shadow-lg"
                  }`}
                >
                  {finishingCategory ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Duke përfunduar...</span>
                    </>
                  ) : isCategoryFinished ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>E përfunduar</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Përfundo</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center min-h-64">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
                  <p className="text-sm text-gray-600">Duke ngarkuar detajet...</p>
                </div>
              </div>
            ) : selectedCategory.words && selectedCategory.words.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {selectedCategory.words.map((wordObj, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 mb-1">{wordObj.word}</h3>
                      <p className="text-sm text-gray-700 mb-1">{wordObj.translation}</p>
                      {wordObj.pronunciation && (
                        <p className="text-xs text-gray-500 italic">/{wordObj.pronunciation}/</p>
                      )}
                    </div>
                    {wordObj.examples && wordObj.examples.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <h4 className="text-xs font-medium text-gray-700 mb-2">Shembuj:</h4>
                        <ul className="space-y-1">
                          {wordObj.examples.slice(0, 2).map((example, exIndex) => (
                            <li key={exIndex} className="text-xs text-gray-600 leading-relaxed">
                              • {example}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nuk u gjetën fjalë</h3>
                <p className="text-sm text-gray-600">Kjo kategori nuk ka ende fjalë.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {NotificationElement}
      
      {/* Dark Header */}
      <header className="bg-slate-800 text-white px-6 py-8 sm:px-8 lg:px-12 rounded-2xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Kategoritë e Fjalëve</h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
                Eksploroni fjalorin tonë të organizuar gjerman. Mësoni fjalë të reja dhe zgjeroni fjalorin tuaj në mënyrë sistematike.
              </p>
              <p className="text-teal-400 text-sm mt-4 font-medium">
                Kategori të përfunduara: {finishedCategoryIds.length}
              </p>
            </div>
            <div className="hidden sm:flex items-center justify-center w-14 h-14 bg-teal-500 rounded-xl">
              <Languages className="h-7 w-7 text-white" />
            </div>
          </div>
        </div>
      </header>

      {/* Categories Grid */}
      <div className="px-6 py-8 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center min-h-64">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
                <p className="text-sm text-gray-600">Duke ngarkuar kategoritë...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
                {Array.isArray(categories) && categories.length > 0 ? (
                  categories.slice(0, visibleCategories).map((category) => {
                    const IconComponent = iconMap[category.icon] || iconMap.default
                    const categoryIdStr = String(category._id?._id || category._id)
                    const isCompleted = finishedCategoryIds.includes(categoryIdStr)

                    return (
                      <div
                        key={category._id}
                        onClick={() => fetchCategoryDetails(category._id, category.category)}
                        className="group bg-white rounded-2xl p-5 border border-gray-200 transition-all duration-300 cursor-pointer hover:shadow-lg hover:border-gray-300 hover:-translate-y-1 relative"
                      >
                        {/* Completed badge */}
                        {isCompleted && (
                          <div className="absolute top-4 right-4">
                            <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center shadow-sm">
                              <CheckCircle className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        )}

                        {/* Icon */}
                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors">
                          <IconComponent className="h-6 w-6 text-gray-600" />
                        </div>

                        {/* Title */}
                        <h3 className="text-sm font-semibold text-gray-900 mb-3 line-clamp-2 min-h-[2.5rem]">
                          {category.category}
                        </h3>

                        {/* Type Badge */}
                        {category.type && (
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(category.type)}`}>
                            {availableWordTypes.find((t) => t.value === category.type)?.label || category.type}
                          </span>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <div className="col-span-full">
                    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                      <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Nuk ka kategori të disponueshme
                      </h3>
                      <p className="text-sm text-gray-600">
                        Kategoritë do të shfaqen këtu kur të shtohen.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {categories.length > visibleCategories && (
                <div id="load-more-sentinel" className="mt-8 flex justify-center">
                  {loadingMore ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-600"></div>
                      Duke ngarkuar më shumë...
                    </div>
                  ) : (
                    <button
                      onClick={loadMoreCategories}
                      className="px-6 py-3 text-sm font-medium text-teal-600 bg-white border border-teal-200 rounded-xl hover:bg-teal-50 hover:border-teal-300 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      Ngarko më shumë ({categories.length - visibleCategories} të tjera)
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Category