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
  const [showXpAnimation, setShowXpAnimation] = useState(false)
  const [xpEarned, setXpEarned] = useState(0)

  const MAX_ATTEMPTS = 5

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

        setXpEarned(result.xpEarned || puzzle.xpReward || 0)
        setShowXpAnimation(true)
        setTimeout(() => setShowXpAnimation(false), 3000)

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
      {showXpAnimation && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
          <div className="animate-bounce-in-scale">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse rounded-full bg-yellow-400 opacity-50 blur-3xl"></div>
              <div className="relative rounded-full bg-gradient-to-br from-yellow-400 via-orange-400 to-yellow-500 p-1 shadow-2xl">
                <div className="rounded-full bg-white px-8 py-6 dark:bg-gray-900">
                  <div className="text-center">
                    <div className="mb-2 text-5xl">🎉</div>
                    <div className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">+{xpEarned} XP</div>
                    <div className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-400">Great job!</div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -left-4 animate-ping text-2xl">✨</div>
              <div className="absolute -top-4 -right-4 animate-ping text-2xl delay-100">✨</div>
              <div className="absolute -bottom-4 -left-4 animate-ping text-2xl delay-200">✨</div>
              <div className="absolute -bottom-4 -right-4 animate-ping text-2xl delay-300">✨</div>
            </div>
          </div>
        </div>
      )}

      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-3 py-3 sm:px-4 sm:py-4">
          <div>
            <h1 className="text-balance text-xl font-bold text-gray-900 dark:text-white sm:text-2xl md:text-3xl">
              German Word Puzzle
            </h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
              Guess the 5-letter word in {MAX_ATTEMPTS} tries
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 sm:text-sm">XP:</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400 sm:text-xl">{user?.xp || 0}</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 sm:text-sm">Level:</span>
              <span className="text-base font-bold text-indigo-600 dark:text-indigo-400 sm:text-lg">
                {user?.level || "A1"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-3 py-4 sm:px-4 sm:py-8">
        <div className="w-full max-w-md space-y-4 sm:space-y-6">
          {stats && (
            <div className="grid grid-cols-3 gap-2 rounded-lg bg-white/80 p-3 shadow-lg backdrop-blur-sm dark:bg-gray-800/80 sm:gap-4 sm:p-4">
              <div className="text-center">
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400 sm:text-2xl">
                  {stats.completedPuzzles || 0}
                </p>
                <p className="text-[10px] text-gray-600 dark:text-gray-400 sm:text-xs">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-green-600 dark:text-green-400 sm:text-2xl">
                  {stats.completionRate || 0}%
                </p>
                <p className="text-[10px] text-gray-600 dark:text-gray-400 sm:text-xs">Success Rate</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400 sm:text-2xl">
                  {puzzle.xpReward || 0}
                </p>
                <p className="text-[10px] text-gray-600 dark:text-gray-400 sm:text-xs">XP Reward</p>
              </div>
            </div>
          )}

          <div className="space-y-1.5 sm:space-y-2">
            {guesses.map((guess, rowIndex) => (
              <div key={rowIndex} className="flex justify-center gap-1.5 sm:gap-2">
                {guess.word.split("").map((letter, colIndex) => (
                  <div
                    key={colIndex}
                    className={`flex h-12 w-12 items-center justify-center rounded-lg border-2 text-xl font-bold uppercase transition-all duration-300 sm:h-14 sm:w-14 sm:text-2xl ${getTileColor(guess.feedback[colIndex])}`}
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

            {gameStatus === "playing" && guesses.length < MAX_ATTEMPTS && (
              <div className="flex justify-center gap-1.5 sm:gap-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className={`flex h-12 w-12 items-center justify-center rounded-lg border-2 text-xl font-bold uppercase transition-all sm:h-14 sm:w-14 sm:text-2xl ${
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

            {Array.from({ length: MAX_ATTEMPTS - guesses.length - (gameStatus === "playing" ? 1 : 0) }).map(
              (_, rowIndex) => (
                <div key={`empty-${rowIndex}`} className="flex justify-center gap-1.5 sm:gap-2">
                  {Array.from({ length: 5 }).map((_, colIndex) => (
                    <div
                      key={colIndex}
                      className="h-12 w-12 rounded-lg border-2 border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800 sm:h-14 sm:w-14"
                    />
                  ))}
                </div>
              ),
            )}
          </div>

          {message && (
            <div
              className={`rounded-lg p-3 text-center text-sm font-medium shadow-lg sm:p-4 sm:text-base ${
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

          {gameStatus === "playing" && (
            <button
              onClick={handleSubmitGuess}
              disabled={currentGuess.length !== 5}
              className="w-full rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-600 sm:text-lg"
            >
              Submit Guess
            </button>
          )}

          {(gameStatus === "won" || gameStatus === "lost" || gameStatus === "completed") && (
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition-all hover:bg-indigo-700 active:scale-95 sm:text-lg"
            >
              Check for New Puzzle
            </button>
          )}

          {puzzle.hints && gameStatus === "playing" && (
            <div className="rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20 sm:p-4">
              <p className="text-xs font-medium text-yellow-800 dark:text-yellow-300 sm:text-sm">
                💡 Hint: {puzzle.hints}
              </p>
            </div>
          )}

          {puzzle.difficulty && (
            <div className="flex justify-center">
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-semibold sm:px-4 sm:text-xs ${
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
        
        @keyframes bounce-in-scale {
          0% {
            transform: scale(0) translateY(100px);
            opacity: 0;
          }
          50% {
            transform: scale(1.1) translateY(-10px);
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
        
        .animate-bounce-in-scale {
          animation: bounce-in-scale 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        .delay-100 {
          animation-delay: 0.1s;
        }
        
        .delay-200 {
          animation-delay: 0.2s;
        }
        
        .delay-300 {
          animation-delay: 0.3s;
        }
      `}</style>
    </div>
  )
}
