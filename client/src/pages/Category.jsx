"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { categoriesService } from "../services/api"
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
  Filter,
  Guitar,
  HardHat,
  Book,
  Sword,
  BellRing,
  Castle,
  Swords,
  Hammer,
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
  const [visibleCategories, setVisibleCategories] = useState(20) // Show 20 categories initially
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [selectedCategory])

  const filteredCategories = useMemo(() => {
    if (selectedCategoryFilter === "all") {
      return categories
    }
    return categories.filter((category) => {
      const categoryType = category.type || "other"
      return categoryType === selectedCategoryFilter
    })
  }, [categories, selectedCategoryFilter])

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
    // Simulate loading delay for smooth UX
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
  }, [selectedCategoryFilter])

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
      console.error("Error fetching categories:", error)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCategoryDetails = useCallback(async (categoryId, categoryName) => {
    try {
      setLoading(true) // Show loading while fetching details
      const response = await categoriesService.getCategoryById(categoryId)
      const categoryData = response.data.data || response.data

      const categoryWithWords = {
        name: categoryName,
        words: categoryData.words || [],
        description: categoryData.description || "",
        level: categoryData.level || "",
        type: categoryData.type || "other",
      }

      setSelectedCategory(categoryWithWords)
    } catch (error) {
      console.error("Error fetching category details:", error)
      setSelectedCategory({
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

  if (selectedCategory) {
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
              <button
                onClick={() => setSelectedCategory(null)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all duration-200 px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md w-fit"
                aria-label="Kthehu te Kategoritë"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Kthehu te Kategoritë</span>
                <span className="sm:hidden">Kthehu</span>
              </button>
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
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 text-balance">Kategoritë e Fjalëve</h1>
            <p className="text-sm sm:text-base text-gray-600 text-pretty">
              Eksploroni fjalorin gjermanisht të organizuar sipas temave dhe kategorive
            </p>
          </div>

          {/* Filter Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <p className="text-sm font-medium text-gray-700">Filtro sipas llojit:</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableWordTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSelectedCategoryFilter(type.value)}
                  className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg border transition-all duration-200 hover:shadow-sm ${
                    selectedCategoryFilter === type.value
                      ? "bg-teal-600 text-white border-teal-600 shadow-md hover:bg-teal-700"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
            {selectedCategoryFilter !== "all" && (
              <p className="text-xs text-gray-500 bg-teal-50 px-3 py-2 rounded-md border border-teal-100">
                Duke treguar kategoritë që përmbajnë fjalë të llojit "
                {availableWordTypes.find((t) => t.value === selectedCategoryFilter)?.label}"
              </p>
            )}
          </div>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="flex items-center justify-center min-h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              <p className="text-sm text-gray-600">Duke ngarkuar kategoritë...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
              {Array.isArray(filteredCategories) && filteredCategories.length > 0 ? (
                filteredCategories.slice(0, visibleCategories).map((category) => {
                  const IconComponent = iconMap[category.icon] || iconMap.default

                  return (
                    <div
                      key={category._id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-lg hover:border-gray-300 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group"
                      onClick={() => fetchCategoryDetails(category._id, category.category)}
                      aria-label={`Eksploro kategorinë ${category.category}`}
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-3 rounded-xl group-hover:from-teal-100 group-hover:to-teal-200 transition-all duration-300 flex-shrink-0 shadow-sm">
                          <IconComponent className="h-5 w-5 text-teal-600 group-hover:text-teal-700 group-hover:scale-110 transition-all duration-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 leading-tight text-pretty group-hover:text-gray-800 transition-colors duration-200">
                            {category.category}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                          Kategori
                        </span>
                        <div className="text-teal-600 group-hover:text-teal-700 font-semibold text-xs flex items-center gap-1.5 transition-all duration-200 bg-teal-50 group-hover:bg-teal-100 px-3 py-1.5 rounded-lg">
                          <span>Eksploro</span>
                          <ArrowLeft className="h-3 w-3 rotate-180 group-hover:translate-x-0.5 transition-transform duration-200" />
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="col-span-full">
                  <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                    <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-base font-medium text-gray-900 mb-2">
                      {selectedCategoryFilter === "all"
                        ? "Nuk ka kategori të disponueshme"
                        : `Nuk ka kategori me fjalë të llojit "${availableWordTypes.find((t) => t.value === selectedCategoryFilter)?.label}"`}
                    </h3>
                    <p className="text-sm text-gray-600 text-pretty">
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
