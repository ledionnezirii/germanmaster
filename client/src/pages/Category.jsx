"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { categoriesService } from "../services/api"
import { useAuth } from "../context/AuthContext"
import { FolderOpen, ArrowLeft, BookOpen, Calendar, Palette, Smile, Heart, User, Grid, Globe, Leaf, Bus, Briefcase, Hand, Coffee, Film, TreePine, Guitar, HardHat, Book, Sword, BellRing, Castle, Swords, Hammer, CheckCircle, Trophy, BookCopy, SortDesc, PaletteIcon, Handshake, Speech, Calendar1Icon, Clock, CarTaxiFront, TreePalm, Flag, HeartIcon, Workflow, CloudSnow, User2, Sparkles, GlassWater, Home, ShoppingBag, ShoppingBagIcon, Shirt, HandIcon, Plane, Sandwich, Mountain, PawPrint } from 'lucide-react'
import { NumberedListIcon } from "@heroicons/react/24/outline"

const iconMap = {
  default: FolderOpen,
  Book: BookCopy,
  numbers:NumberedListIcon,
  palette:PaletteIcon,
  handshake:Handshake,
  speech:Speech,
  calendar:Calendar1Icon,
  clock:Clock,
  transport:CarTaxiFront,
  tree:TreePalm,
  flag:Flag,
  heart:HeartIcon,
  work:Workflow,
  seasons:CloudSnow,
  family:User2,
  hobbies:Sparkles,
  food:GlassWater,
  home:Home,
  clothes:Shirt,
  shopping:ShoppingBagIcon,
  body:HandIcon,
  travel:Plane,
  restaurant:Sandwich,
  nature:Mountain,
  animals:PawPrint
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
        return "bg-gradient-to-br from-[#CCFBF1] to-[#99F6E4] text-[#0D9488] border-[#5EEAD4]"
      case "A2":
        return "bg-gradient-to-br from-[#99F6E4] to-[#5EEAD4] text-[#0D9488] border-[#2DD4BF]"
      case "B1":
        return "bg-gradient-to-br from-[#5EEAD4] to-[#2DD4BF] text-[#0F766E] border-[#14B8A6]"
      case "B2":
        return "bg-gradient-to-br from-[#2DD4BF] to-[#14B8A6] text-white border-[#0D9488]"
      case "C1":
        return "bg-gradient-to-br from-[#14B8A6] to-[#0D9488] text-white border-[#0F766E]"
      case "C2":
        return "bg-gradient-to-br from-[#0D9488] to-[#0F766E] text-white border-[#115E59]"
      default:
        return "bg-gradient-to-br from-[#F0FDFA] to-[#CCFBF1] text-[#14B8A6] border-[#99F6E4]"
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
      <div className="min-h-screen bg-gray-50 p-2 sm:p-3 lg:p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 mb-3 sm:mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 text-balance">
                  {selectedCategory.name}
                </h1>
                {selectedCategory.type && (
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-teal-50 text-teal-700 rounded-full border border-teal-200 w-fit">
                    {availableWordTypes.find((t) => t.value === selectedCategory.type)?.label || selectedCategory.type}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all duration-200 px-3 py-2 rounded-lg shadow-sm hover:shadow-md w-fit"
                  aria-label="Kthehu te Kategoritë"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Kthehu</span>
                </button>
                <button
                  onClick={handleFinishCategory}
                  disabled={finishingCategory || isCategoryFinished}
                  className={`flex items-center gap-1.5 text-xs font-medium text-white transition-all duration-200 px-4 py-2 rounded-lg shadow-md disabled:cursor-not-allowed ${
                    isCategoryFinished
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 hover:shadow-lg"
                  }`}
                  aria-label="Përfundo kategorinë"
                >
                  {finishingCategory ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                      <span>Duke përfunduar...</span>
                    </>
                  ) : isCategoryFinished ? (
                    <>
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>E përfunduar</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-3.5 w-3.5" />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
                {selectedCategory.words.map((wordObj, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-100 hover:border-gray-200 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">{wordObj.word}</h3>
                      </div>
                      <p className="text-xs text-gray-700 mb-1">{wordObj.translation}</p>
                      {wordObj.pronunciation && (
                        <p className="text-xs text-gray-500 italic">/{wordObj.pronunciation}/</p>
                      )}
                    </div>
                    {wordObj.examples && wordObj.examples.length > 0 && (
                      <div className="mt-2">
                        <h4 className="text-xs font-medium text-gray-700 mb-1">Shembuj:</h4>
                        <ul className="space-y-0.5">
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
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <div className="bg-white rounded-xl shadow-sm border-2 border-[#99F6E4] p-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Kategoritë e Fjalëve</h1>
              <p className="text-gray-600 leading-relaxed">
                Eksploroni fjalorin tonë të organizuar gjerman. Mësoni fjalë të reja dhe zgjeroni fjalorin tuaj në mënyrë sistematike.
              </p>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Kategori të përfunduara: {finishedCategoryIds.length}
            </p>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center min-h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="text-sm text-gray-600">Duke ngarkuar kategoritë...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
              {Array.isArray(categories) && categories.length > 0 ? (
                categories.slice(0, visibleCategories).map((category, index) => {
                  const IconComponent = iconMap[category.icon] || iconMap.default

                  const categoryIdStr = String(category._id?._id || category._id)
                  const isCompleted = finishedCategoryIds.includes(categoryIdStr)

                  return (
                    <div
                      key={category._id}
                      onClick={() => fetchCategoryDetails(category._id, category.category)}
                      className={`group rounded-lg p-2.5 border transition-all duration-200 cursor-pointer relative overflow-hidden hover:shadow-md ${
                        isCompleted
                          ? "bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] border-[#FDE68A]"
                          : "bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] border-[#FDE68A]"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${
                          isCompleted ? "bg-[#FDE68A]" : "bg-[#FDE68A]"
                        }`}>
                          <IconComponent className="h-4 w-4 text-gray-700" />
                        </div>

                        {isCompleted && (
                          <div className="flex items-center gap-1 bg-gradient-to-r from-teal-400 to-emerald-400 text-white px-1.5 py-0.5 rounded-full text-[10px] font-medium shadow-sm">
                            <CheckCircle className="h-2.5 w-2.5" />
                          </div>
                        )}
                      </div>

                      <h3 className="text-xs font-semibold mb-2 line-clamp-2 text-gray-900 min-h-[2rem]">
                        {category.category}
                      </h3>

                      <div className="mt-auto">
                        {category.type && (
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                            category.type === "Gramatikë" 
                              ? "bg-[#FCA5A5] text-[#7F1D1D]"
                              : category.type === "Të Përgjithshme"
                              ? "bg-[#FDE047] text-[#713F12]"
                              : category.type === "Mbiemra"
                              ? "bg-[#F9A8D4] text-[#831843]"
                              : category.type === "Vocabulary"
                              ? "bg-[#93C5FD] text-[#1E3A8A]"
                              : category.type === "Folje"
                              ? "bg-[#C4B5FD] text-[#4C1D95]"
                              : category.type === "Kulturë"
                              ? "bg-[#D8B4FE] text-[#581C87]"
                              : "bg-gray-200 text-gray-700"
                          }`}>
                            {availableWordTypes.find((t) => t.value === category.type)?.label || category.type}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="col-span-full">
                  <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                    <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-base font-medium text-gray-900 mb-2">
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
              <div id="load-more-sentinel" className="mt-6 flex justify-center">
                {loadingMore ? (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
                    Duke ngarkuar më shumë...
                  </div>
                ) : (
                  <button
                    onClick={loadMoreCategories}
                    className="px-4 py-2 text-xs font-medium text-teal-600 bg-white border border-teal-200 rounded-lg hover:bg-teal-50 hover:border-teal-300 transition-all duration-200 shadow-sm hover:shadow-md"
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
  )
}

export default Category