"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { categoriesService } from "../services/api"
import { useAuth } from "../context/AuthContext"
import {
  FolderOpen,
  ArrowLeft,
  BookOpen,
  Calendar,
  Palette,
  Smile,
  Heart,
  User,
  Grid,
  Globe,
  Leaf,
  Bus,
  Briefcase,
  Hand,
  Coffee,
  Film,
  TreePine,
  Guitar,
  HardHat,
  Book,
  Sword,
  BellRing,
  Castle,
  Swords,
  Hammer,
  CheckCircle,
  Trophy,
} from "lucide-react"

const iconMap = {
  default: FolderOpen,
  calendar: Calendar,
  users: User,
  smile: Smile,
  heart: Heart,
  palette: Palette,
  grid: Grid,
  globe: Globe,
  leaf: Leaf,
  bus: Bus,
  briefcase: Briefcase,
  hand: Hand,
  coffee: Coffee,
  film: Film,
  tree: TreePine,
  guitar: Guitar,
  clothes: HardHat,
  book: Book,
  sword: Sword,
  ring: BellRing,
  haus: Castle,
  sport: Swords,
  hammer: Hammer,
}

const Category = () => {
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all")
  const [selectedLevelFilter, setSelectedLevelFilter] = useState("all")
  const [visibleCategories, setVisibleCategories] = useState(20)
  const [loadingMore, setLoadingMore] = useState(false)
  const [finishingCategory, setFinishingCategory] = useState(false)
  const [showCongrats, setShowCongrats] = useState(false)
  const [xpGained, setXpGained] = useState(0)
  const [finishedCategoryIds, setFinishedCategoryIds] = useState([])

  const { user, updateUser, refreshProfile } = useAuth()

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

  const filteredCategories = useMemo(() => {
    let filtered = categories

    if (selectedCategoryFilter !== "all") {
      filtered = filtered.filter((category) => {
        const categoryType = category.type || "other"
        return categoryType === selectedCategoryFilter
      })
    }

    if (selectedLevelFilter !== "all") {
      filtered = filtered.filter((category) => {
        return category.level === selectedLevelFilter
      })
    }

    return filtered
  }, [categories, selectedCategoryFilter, selectedLevelFilter])

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
    if (loadingMore || visibleCategories >= filteredCategories.length) return

    setLoadingMore(true)
    setTimeout(() => {
      setVisibleCategories((prev) => Math.min(prev + 20, filteredCategories.length))
      setLoadingMore(false)
    }, 300)
  }, [loadingMore, visibleCategories, filteredCategories.length])

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
    setVisibleCategories(20)
  }, [selectedCategoryFilter, selectedLevelFilter])

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
      setShowCongrats(true)

      try {
        const finishedResponse = await categoriesService.getFinishedCategories()
        const finishedData = finishedResponse.data || finishedResponse
        const ids = finishedData.finishedCategoryIds || []
        setFinishedCategoryIds(ids)
      } catch (fetchError) {
        // Silently handle - category was already finished successfully
      }

      try {
        await refreshProfile()
      } catch (refreshError) {
        // Silently handle - category was already finished successfully
      }

      setTimeout(() => {
        setShowCongrats(false)
        setSelectedCategory(null)
      }, 5000)
    } catch (error) {
      alert(error.response?.data?.message || "Gabim gjatë përfundimit të kategorisë")
    } finally {
      setFinishingCategory(false)
    }
  }

  const getLevelColor = (level) => {
    switch (level) {
      case "A1":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "A2":
        return "bg-emerald-100 text-emerald-700 border-emerald-300"
      case "B1":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "B2":
        return "bg-blue-100 text-blue-700 border-blue-300"
      case "C1":
        return "bg-purple-50 text-purple-700 border-purple-200"
      case "C2":
        return "bg-purple-100 text-purple-700 border-purple-300"
      default:
        return "bg-gray-50 text-gray-600 border-gray-200"
    }
  }

  if (showCongrats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-green-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-bounce-in">
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
            className="w-full flex items-center justify-center gap-2 text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 transition-all duration-200 px-6 py-3 rounded-lg shadow-md hover:shadow-lg"
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
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 text-balance">
                  {selectedCategory.name}
                </h1>
                {selectedCategory.type && (
                  <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-teal-50 text-teal-700 rounded-full border border-teal-200 w-fit">
                    {availableWordTypes.find((t) => t.value === selectedCategory.type)?.label || selectedCategory.type}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all duration-200 px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md w-fit"
                  aria-label="Kthehu te Kategoritë"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Kthehu</span>
                </button>
                <button
                  onClick={handleFinishCategory}
                  disabled={finishingCategory || isCategoryFinished}
                  className={`flex items-center gap-2 text-sm font-medium text-white transition-all duration-200 px-6 py-2.5 rounded-lg shadow-md disabled:cursor-not-allowed ${
                    isCategoryFinished
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 hover:shadow-lg"
                  }`}
                  aria-label="Përfundo kategorinë"
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
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                  <p className="text-sm text-gray-600">Duke ngarkuar detajet...</p>
                </div>
              </div>
            ) : selectedCategory.words && selectedCategory.words.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {selectedCategory.words.map((wordObj, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-gray-200 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-medium text-gray-900 truncate">{wordObj.word}</h3>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">{wordObj.translation}</p>
                      {wordObj.pronunciation && (
                        <p className="text-xs text-gray-500 italic">/{wordObj.pronunciation}/</p>
                      )}
                    </div>
                    {wordObj.examples && wordObj.examples.length > 0 && (
                      <div className="mt-3">
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
              <div className="text-center py-12">
                <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                <h3 className="text-base font-medium text-gray-900 mb-2">Nuk u gjetën fjalë</h3>
                <p className="text-sm text-gray-600">Kjo kategori nuk ka ende fjalë.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Word Categories</h1>
          <p className="text-gray-600">
            Explore our organized German vocabulary. Learn new words and expand your dictionary systematically.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              {availableWordTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSelectedCategoryFilter(type.value)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    selectedCategoryFilter === type.value
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
            <div>
              <select
                value={selectedLevelFilter}
                onChange={(e) => setSelectedLevelFilter(e.target.value)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer"
              >
                <option value="all">All levels</option>
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="C1">C1</option>
                <option value="C2">C2</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="text-sm text-gray-600">Duke ngarkuar kategoritë...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.isArray(filteredCategories) && filteredCategories.length > 0 ? (
                filteredCategories.slice(0, visibleCategories).map((category, index) => {
                  const IconComponent = iconMap[category.icon] || iconMap.default

                  const colorClasses = [
                    { bg: "bg-blue-100", icon: "bg-blue-100" },
                    { bg: "bg-purple-100", icon: "bg-purple-100" },
                    { bg: "bg-pink-100", icon: "bg-pink-100" },
                    { bg: "bg-orange-100", icon: "bg-orange-100" },
                    { bg: "bg-cyan-100", icon: "bg-cyan-100" },
                    { bg: "bg-yellow-100", icon: "bg-yellow-100" },
                    { bg: "bg-emerald-100", icon: "bg-emerald-100" },
                    { bg: "bg-indigo-100", icon: "bg-indigo-100" },
                  ]
                  const colorClass = colorClasses[index % colorClasses.length]

                  const categoryIdStr = String(category._id?._id || category._id)
                  const isCompleted = finishedCategoryIds.includes(categoryIdStr)

                  return (
                    <div
                      key={category._id}
                      onClick={() => fetchCategoryDetails(category._id, category.category)}
                      className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className={`w-12 h-12 ${colorClass.icon} rounded-xl flex items-center justify-center flex-shrink-0`}
                        >
                          <IconComponent className="h-6 w-6 text-gray-700" />
                        </div>

                        {isCompleted && (
                          <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-medium border border-green-200">
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Completed</span>
                          </div>
                        )}
                      </div>

                      <h3 className="text-base font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-gray-700 transition-colors">
                        {category.category}
                      </h3>

                      <div className="mt-auto">
                        <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-md text-xs font-medium">
                          {availableWordTypes.find((t) => t.value === category.type)?.label || "Kategori"}
                        </span>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="col-span-full">
                  <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                    <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-base font-medium text-gray-900 mb-2">
                      {selectedCategoryFilter === "all"
                        ? "Nuk ka kategori të disponueshme"
                        : `Nuk ka kategori me fjalë të llojit "${availableWordTypes.find((t) => t.value === selectedCategoryFilter)?.label}"`}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedCategoryFilter === "all"
                        ? "Kategoritë do të shfaqen këtu kur të shtohen."
                        : "Provoni një filtër tjetër ose shtoni kategori me fjalë të këtij lloji."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {filteredCategories.length > visibleCategories && (
              <div id="load-more-sentinel" className="mt-8 flex justify-center">
                {loadingMore ? (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
                    Duke ngarkuar më shumë...
                  </div>
                ) : (
                  <button
                    onClick={loadMoreCategories}
                    className="px-6 py-3 text-sm font-medium text-teal-600 bg-white border border-teal-200 rounded-lg hover:bg-teal-50 hover:border-teal-300 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    Ngarko më shumë ({filteredCategories.length - visibleCategories} të tjera)
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Category
