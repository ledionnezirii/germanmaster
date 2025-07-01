"use client"

import { useState, useEffect } from "react"
import { categoriesService } from "../services/api"
import { FolderOpen, Volume2, ArrowLeft, BookOpen } from "lucide-react"

const Category = () => {
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await categoriesService.getAllCategories()

      console.log("Categories response:", response) // Debug log

      // Handle different response structures
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

      console.log("Processed categories:", categoriesData) // Debug log
      setCategories(categoriesData)
    } catch (error) {
      console.error("Error fetching categories:", error)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCategoryDetails = async (categoryId, categoryName) => {
    try {
      const response = await categoriesService.getCategoryById(categoryId)
      const categoryData = response.data.data || response.data // Handle both response formats

      console.log("Category data received:", categoryData) // Debug log

      setSelectedCategory({
        name: categoryName,
        words: categoryData.words || [],
        description: categoryData.description || "",
        level: categoryData.level || "",
      })
    } catch (error) {
      console.error("Error fetching category details:", error)
      setSelectedCategory({
        name: categoryName,
        words: [],
        description: "Error loading category details",
        level: "",
      })
    }
  }

  const playPronunciation = (word) => {
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = "de-DE"
    window.speechSynthesis.speak(utterance)
  }

  if (selectedCategory) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{selectedCategory.name}</h1>
            <button
              onClick={() => setSelectedCategory(null)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Categories
            </button>
          </div>

          {selectedCategory.words && selectedCategory.words.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedCategory.words.map((wordObj, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{wordObj.word}</h3>
                      <p className="text-gray-700">{wordObj.translation}</p>
                      {wordObj.pronunciation && (
                        <p className="text-sm text-gray-500 italic">/{wordObj.pronunciation}/</p>
                      )}
                    </div>
                    <button
                      onClick={() => playPronunciation(wordObj.word)}
                      className="text-gray-400 hover:text-teal-600 transition-colors"
                    >
                      <Volume2 className="h-5 w-5" />
                    </button>
                  </div>

                  {wordObj.examples && wordObj.examples.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Examples:</h4>
                      <ul className="space-y-1">
                        {wordObj.examples.slice(0, 3).map((example, exIndex) => (
                          <li key={exIndex} className="text-sm text-gray-600">
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
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No words found</h3>
              <p className="text-gray-600">This category doesn't have any words yet.</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Word Categories</h1>
        <p className="text-gray-600">Explore German vocabulary organized by topics and themes</p>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.isArray(categories) && categories.length > 0 ? (
            categories.map((category) => (
              <div
                key={category._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => fetchCategoryDetails(category._id, category.category)}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-teal-100 p-3 rounded-lg">
                    <FolderOpen className="h-6 w-6 text-teal-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{category.category}</h3>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Category</span>
                  <button className="text-teal-600 hover:text-teal-700 font-medium text-sm">Explore →</button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No categories available</h3>
              <p className="text-gray-600">Categories will appear here when they are added.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Category
