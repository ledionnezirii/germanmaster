// German quiz questions database
const quizQuestions = [
  {
    id: 1,
    question: "Wie sagt man 'Hello' auf Deutsch?",
    options: ["Hallo", "Tschüss", "Danke", "Bitte"],
    correctAnswer: "Hallo",
    category: "Greetings",
  },
  {
    id: 2,
    question: "Was bedeutet 'Danke'?",
    options: ["Please", "Thank you", "Sorry", "Excuse me"],
    correctAnswer: "Thank you",
    category: "Politeness",
  },

]

// Helper function to get random questions
const getRandomQuestions = (count = 10, category = null) => {
  try {
    let filteredQuestions = quizQuestions

    if (category) {
      filteredQuestions = quizQuestions.filter((q) => q.category === category)
    }

    if (filteredQuestions.length === 0) {
      console.warn(`No questions found for category: ${category}`)
      filteredQuestions = quizQuestions // Fallback to all questions
    }

    const shuffled = [...filteredQuestions].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, Math.min(count, shuffled.length))
  } catch (error) {
    console.error("Error in getRandomQuestions:", error)
    return quizQuestions.slice(0, count) // Fallback
  }
}

// Get all available categories
const getCategories = () => {
  try {
    const categories = [...new Set(quizQuestions.map((q) => q.category))].sort()
    return categories
  } catch (error) {
    console.error("Error getting categories:", error)
    return []
  }
}

// Get questions by difficulty (based on category complexity)
const getQuestionsByDifficulty = (difficulty, count = 10) => {
  try {
    let difficultyCategories = []

    switch (difficulty.toLowerCase()) {
      case "easy":
        difficultyCategories = ["Greetings", "Numbers", "Colors"]
        break
      case "medium":
        difficultyCategories = ["Food & Drink", "Politeness", "Expressions"]
        break
      case "hard":
        difficultyCategories = ["Grammar"]
        break
      default:
        return getRandomQuestions(count) // Return random if difficulty not recognized
    }

    const filteredQuestions = quizQuestions.filter((q) => difficultyCategories.includes(q.category))

    if (filteredQuestions.length === 0) {
      return getRandomQuestions(count) // Fallback
    }

    const shuffled = [...filteredQuestions].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, Math.min(count, shuffled.length))
  } catch (error) {
    console.error("Error getting questions by difficulty:", error)
    return getRandomQuestions(count)
  }
}

// Validate question structure
const validateQuestion = (question) => {
  const requiredFields = ["id", "question", "options", "correctAnswer", "category"]
  return requiredFields.every((field) => question.hasOwnProperty(field))
}

// Get question statistics
const getQuestionStats = () => {
  try {
    const stats = {
      total: quizQuestions.length,
      categories: {},
      difficulties: {
        easy: 0,
        medium: 0,
        hard: 0,
      },
    }

    quizQuestions.forEach((q) => {
      // Count by category
      stats.categories[q.category] = (stats.categories[q.category] || 0) + 1

      // Count by difficulty
      if (["Greetings", "Numbers", "Colors"].includes(q.category)) {
        stats.difficulties.easy++
      } else if (["Food & Drink", "Politeness", "Expressions"].includes(q.category)) {
        stats.difficulties.medium++
      } else if (["Grammar"].includes(q.category)) {
        stats.difficulties.hard++
      }
    })

    return stats
  } catch (error) {
    console.error("Error getting question stats:", error)
    return { total: 0, categories: {}, difficulties: { easy: 0, medium: 0, hard: 0 } }
  }
}

module.exports = {
  quizQuestions,
  getRandomQuestions,
  getCategories,
  getQuestionsByDifficulty,
  validateQuestion,
  getQuestionStats,
}
