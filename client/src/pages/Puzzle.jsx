"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../context/AuthContext"
import { puzzleService } from "../services/api"

export default function Puzzle() {
  const { user, updateUser } = useAuth()
  const [puzzle, setPuzzle] = useState(null)
  const [currentGuess, setCurrentGuess] = useState("")
  const [guesses, setGuesses] = useState([])
  const [gameStatus, setGameStatus] = useState("playing") // playing, won, lost, completed
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)

  const MAX_ATTEMPTS = 5

  // Fetch today's puzzle
  useEffect(() => {
    fetchTodaysPuzzle()
    fetchStats()
  }, [])

  const fetchTodaysPuzzle = async () => {
    try {
      setLoading(true)
      const response = await puzzleService.getTodayPuzzle()
      const puzzleData = response

      setPuzzle(puzzleData)

      if (puzzleData.hasCompleted) {
        setGameStatus("completed")
        setMessage(
          `You've already completed today's puzzle! You earned ${puzzleData.xpReward} XP. Come back tomorrow for a new one.`,
        )
      }
    } catch (error) {
      console.error("Error fetching puzzle:", error)
      setMessage(error.response?.data?.message || "Failed to load today's puzzle")
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await puzzleService.getUserProgress()
      setStats(response)
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const handleKeyPress = useCallback(
    (e) => {
      if (gameStatus !== "playing") return

      if (e.key === "Enter") {
        handleSubmitGuess()
      } else if (e.key === "Backspace") {
        setCurrentGuess((prev) => prev.slice(0, -1))
      } else if (/^[a-zA-ZäöüßÄÖÜ]$/.test(e.key) && currentGuess.length < 5) {
        setCurrentGuess((prev) => prev + e.key.toLowerCase())
      }
    },
    [currentGuess, gameStatus],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [handleKeyPress])

 const handleSubmitGuess = async () => {
  const guess = currentGuess.trim().toLowerCase()

  if (guess.length !== 5) {
    setMessage("Word must be 5 letters!")
    return
  }

  if (guesses.some((g) => g.word === guess)) {
    setMessage("You already tried this word!")
    return
  }

  try {
    const result = await puzzleService.submitAnswer(puzzle._id, guess)

    if (result.correct) {
      setGuesses([...guesses, { word: guess, feedback: Array(5).fill("correct") }])
      setGameStatus("won")
      setMessage(result.message || `Congratulations! You earned ${result.xpEarned} XP!`)

      if (updateUser && result.user) {
        updateUser({
          xp: result.user.xp,
          level: result.user.level,
        })
      }
    } else {
      const newGuesses = [...guesses, { word: guess, feedback: result.feedback }]
      setGuesses(newGuesses)

      if (newGuesses.length >= MAX_ATTEMPTS) {
        setGameStatus("lost")
        setMessage(`Game over! Better luck tomorrow!`)
      } else {
        setMessage(`${MAX_ATTEMPTS - newGuesses.length} attempts remaining`)
      }
    }

    setCurrentGuess("")
  } catch (error) {
    console.error("Error submitting guess:", error)
    setMessage(error.response?.data?.message || "Error submitting guess")
  }
}


  const getTileColor = (status) => {
    switch (status) {
      case "correct":
        return "bg-green-500 border-green-600 text-white"
      case "present":
        return "bg-yellow-500 border-yellow-600 text-white"
      case "absent":
        return "bg-gray-500 border-gray-600 text-white"
      default:
        return "bg-background border-border text-foreground"
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="text-lg text-gray-700 dark:text-gray-300">Loading puzzle...</p>
        </div>
      </div>
    )
  }

  if (!puzzle) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="rounded-lg bg-white p-8 text-center shadow-xl dark:bg-gray-800">
          <p className="text-xl text-gray-700 dark:text-gray-300">No puzzle available today</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Check back tomorrow for a new puzzle!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-balance text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
              German Word Puzzle
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Guess the 5-letter word in {MAX_ATTEMPTS} tries</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">XP:</span>
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{user?.xp || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Level:</span>
              <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{user?.level || "A1"}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-6">
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-3 gap-4 rounded-lg bg-white/80 p-4 shadow-lg backdrop-blur-sm dark:bg-gray-800/80">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.completedPuzzles || 0}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completionRate || 0}%</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Success Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{puzzle.xpReward || 0}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">XP Reward</p>
              </div>
            </div>
          )}

          {/* Game Grid */}
          <div className="space-y-2">
            {/* Previous guesses */}
            {guesses.map((guess, rowIndex) => (
              <div key={rowIndex} className="flex justify-center gap-2">
                {guess.word.split("").map((letter, colIndex) => (
                  <div
                    key={colIndex}
                    className={`flex h-14 w-14 items-center justify-center rounded-lg border-2 text-2xl font-bold uppercase transition-all duration-300 ${getTileColor(guess.feedback[colIndex])}`}
                    style={{
                      animationDelay: `${colIndex * 100}ms`,
                      animation: "flipIn 0.5s ease-in-out",
                    }}
                  >
                    {letter}
                  </div>
                ))}
              </div>
            ))}

            {/* Current guess row */}
            {gameStatus === "playing" && guesses.length < MAX_ATTEMPTS && (
              <div className="flex justify-center gap-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className={`flex h-14 w-14 items-center justify-center rounded-lg border-2 text-2xl font-bold uppercase transition-all ${
                      currentGuess[index]
                        ? "scale-105 border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/30"
                        : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800"
                    }`}
                  >
                    {currentGuess[index] || ""}
                  </div>
                ))}
              </div>
            )}

            {/* Empty rows */}
            {Array.from({ length: MAX_ATTEMPTS - guesses.length - (gameStatus === "playing" ? 1 : 0) }).map(
              (_, rowIndex) => (
                <div key={`empty-${rowIndex}`} className="flex justify-center gap-2">
                  {Array.from({ length: 5 }).map((_, colIndex) => (
                    <div
                      key={colIndex}
                      className="h-14 w-14 rounded-lg border-2 border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800"
                    />
                  ))}
                </div>
              ),
            )}
          </div>

          {/* Message */}
          {message && (
            <div
              className={`rounded-lg p-4 text-center font-medium shadow-lg ${
                gameStatus === "won"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  : gameStatus === "lost"
                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                    : gameStatus === "completed"
                      ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
              }`}
            >
              {message}
            </div>
          )}

          {/* Submit Button */}
          {gameStatus === "playing" && (
            <button
              onClick={handleSubmitGuess}
              disabled={currentGuess.length !== 5}
              className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-600"
            >
              Submit Guess
            </button>
          )}

          {/* New Puzzle Button */}
          {(gameStatus === "won" || gameStatus === "lost" || gameStatus === "completed") && (
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:bg-indigo-700"
            >
              Check for New Puzzle
            </button>
          )}

          {/* Hints */}
          {puzzle.hints && gameStatus === "playing" && (
            <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">💡 Hint: {puzzle.hints}</p>
            </div>
          )}

          {/* Difficulty Badge */}
          {puzzle.difficulty && (
            <div className="flex justify-center">
              <span
                className={`rounded-full px-4 py-1 text-xs font-semibold ${
                  puzzle.difficulty === "easy"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                    : puzzle.difficulty === "medium"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                }`}
              >
                {puzzle.difficulty.toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        @keyframes flipIn {
          0% {
            transform: rotateX(0deg);
          }
          50% {
            transform: rotateX(90deg);
          }
          100% {
            transform: rotateX(0deg);
          }
        }
      `}</style>
    </div>
  )
}
