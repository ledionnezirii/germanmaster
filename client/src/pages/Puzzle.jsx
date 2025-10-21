"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../context/AuthContext"
import { puzzleService } from "../services/api"
import { Lock } from "lucide-react"

export default function Puzzle() {
  const { user, updateUser } = useAuth()
  const [puzzle, setPuzzle] = useState(null)
  const [currentGuess, setCurrentGuess] = useState("")
  const [guesses, setGuesses] = useState([])
  const [gameStatus, setGameStatus] = useState("playing")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [showXpAnimation, setShowXpAnimation] = useState(false)
  const [xpEarned, setXpEarned] = useState(0)

  const MAX_ATTEMPTS = 5

  const keyboardRows = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
  ]

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
          `Ju keni përfunduar tashmë enigmën e sotme! Fituat ${puzzleData.xpReward} XP. Kthehuni nesër për një të re.`,
        )
      }
    } catch (error) {
      console.error("Error fetching puzzle:", error)
      setMessage(error.response?.data?.message || "Dështoi ngarkimi i enigmës së sotme")
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

  const handleVirtualKeyPress = (key) => {
    if (gameStatus !== "playing") return

    if (key === "ENTER") {
      handleSubmitGuess()
    } else if (key === "⌫") {
      setCurrentGuess((prev) => prev.slice(0, -1))
    } else if (currentGuess.length < 5) {
      setCurrentGuess((prev) => prev + key.toLowerCase())
    }
  }

  const handleSubmitGuess = async () => {
    const guess = currentGuess.trim().toLowerCase()

    if (guess.length !== 5) {
      setMessage("Fjala duhet të jetë 5 shkronja!")
      return
    }

    if (guesses.some((g) => g.word === guess)) {
      setMessage("E keni provuar tashmë këtë fjalë!")
      return
    }

    try {
      const result = await puzzleService.submitAnswer(puzzle._id, guess)

      if (result.correct) {
        setGuesses([...guesses, { word: guess, feedback: Array(5).fill("correct") }])
        setGameStatus("won")
        setMessage(result.message || `Urime! Fituat ${result.xpEarned} XP!`)

        setXpEarned(result.xpEarned || puzzle.xpReward || 0)
        setShowXpAnimation(true)
        setTimeout(() => setShowXpAnimation(false), 1800)

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
          setMessage(`Loja mbaroi! Fat më të mirë nesër!`)
        } else {
          setMessage(`${MAX_ATTEMPTS - newGuesses.length} përpjekje të mbetura`)
        }
      }

      setCurrentGuess("")
    } catch (error) {
      console.error("Error submitting guess:", error)
      setMessage(error.response?.data?.message || "Gabim në dërgimin e përgjigjes")
    }
  }

  const getTileColor = (status) => {
    switch (status) {
      case "correct":
        return "bg-gradient-to-br from-emerald-500 to-green-600 border-emerald-400 text-white shadow-lg shadow-emerald-500/50"
      case "present":
        return "bg-gradient-to-br from-amber-400 to-orange-500 border-amber-300 text-white shadow-lg shadow-amber-500/50"
      case "absent":
        return "bg-gradient-to-br from-slate-400 to-slate-500 border-slate-300 text-white shadow-md"
      default:
        return "bg-white/80 backdrop-blur-sm border-slate-200 text-slate-700 dark:bg-slate-800/60 dark:border-slate-600 dark:text-slate-200"
    }
  }

  const getKeyColor = (letter) => {
    let status = null
    for (const guess of guesses) {
      const index = guess.word.toUpperCase().indexOf(letter)
      if (index !== -1) {
        const feedback = guess.feedback[index]
        if (feedback === "correct")
          return "bg-gradient-to-br from-emerald-500 to-green-600 text-white border-emerald-400 shadow-lg shadow-emerald-500/30"
        if (feedback === "present" && status !== "correct") status = "present"
        if (feedback === "absent" && !status) status = "absent"
      }
    }
    if (status === "present")
      return "bg-gradient-to-br from-amber-400 to-orange-500 text-white border-amber-300 shadow-lg shadow-amber-500/30"
    if (status === "absent")
      return "bg-gradient-to-br from-slate-400 to-slate-500 text-white border-slate-300 shadow-md"
    return "bg-white/90 backdrop-blur-sm text-slate-700 border-slate-200 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 dark:bg-slate-700/90 dark:text-slate-100 dark:border-slate-600"
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-indigo-950 dark:to-purple-950">
        <div className="text-center">
          <div className="mb-6 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-indigo-400 border-r-transparent shadow-2xl"></div>
          <p
            className="text-base font-medium text-slate-600 dark:text-slate-300"
            style={{ fontFamily: "Inter, sans-serif", letterSpacing: "-0.01em" }}
          >
            Duke ngarkuar...
          </p>
        </div>
      </div>
    )
  }

  if (!puzzle) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-indigo-950 dark:to-purple-950 p-4">
        <div className="rounded-3xl bg-white/70 backdrop-blur-xl p-8 text-center shadow-2xl border border-white/20 dark:bg-slate-800/70 dark:border-slate-700/30 max-w-sm">
          <div className="mb-3 text-5xl">🎯</div>
          <p
            className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2"
            style={{ fontFamily: "Inter, sans-serif", letterSpacing: "-0.02em" }}
          >
            Nuk ka enigmë sot
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400" style={{ fontFamily: "Inter, sans-serif" }}>
            Kthehuni nesër për një enigmë të re!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-indigo-950 dark:to-purple-950 relative">
      {showXpAnimation && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="animate-bounce-in-scale">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 opacity-60 blur-3xl"></div>
              <div className="relative rounded-3xl bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 p-1.5 shadow-2xl">
                <div className="rounded-[22px] bg-white px-8 py-6 dark:bg-slate-900">
                  <div className="text-center">
                    <div className="mb-3 text-5xl animate-bounce">🎉</div>
                    <div
                      className="text-4xl font-bold bg-gradient-to-r from-yellow-600 via-orange-600 to-pink-600 bg-clip-text text-transparent"
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, letterSpacing: "-0.03em" }}
                    >
                      +{xpEarned} XP
                    </div>
                    <div
                      className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
                      style={{ fontFamily: "Inter, sans-serif", letterSpacing: "0.05em" }}
                    >
                      PUNË E SHKËLQYER!
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -left-4 animate-ping text-2xl">✨</div>
              <div className="absolute -top-4 -right-4 animate-ping text-2xl">✨</div>
              <div className="absolute -bottom-4 -left-4 animate-ping text-2xl">✨</div>
              <div className="absolute -bottom-4 -right-4 animate-ping text-2xl">✨</div>
            </div>
          </div>
        </div>
      )}

      {(gameStatus === "won" || gameStatus === "lost" || gameStatus === "completed") && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 backdrop-blur-md">
          <div className="text-center animate-fade-in">
            <div className="mb-6 inline-flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 animate-pulse rounded-full bg-slate-400 opacity-40 blur-2xl"></div>
                <div className="relative bg-white/90 backdrop-blur-xl p-8 rounded-full shadow-2xl border-4 border-slate-300 dark:bg-slate-800/90 dark:border-slate-600">
                  <Lock className="w-16 h-16 text-slate-600 dark:text-slate-300" strokeWidth={2.5} />
                </div>
              </div>
            </div>
            <h2
              className="text-2xl font-bold text-white mb-3 drop-shadow-lg"
              style={{ fontFamily: "Inter, sans-serif", letterSpacing: "-0.02em" }}
            >
              Enigma e Mbyllur
            </h2>
            <p className="text-slate-200 mb-6 text-sm max-w-xs mx-auto" style={{ fontFamily: "Inter, sans-serif" }}>
              {gameStatus === "won"
                ? "Urime! Keni përfunduar enigmën e sotme."
                : gameStatus === "lost"
                  ? "Enigma e sotme ka përfunduar."
                  : "Keni përfunduar tashmë enigmën e sotme."}
            </p>
            <div className="inline-block m-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/30 mb-6">
              <p
                className="text-white text-xs font-semibold"
                style={{ fontFamily: "Inter, sans-serif", letterSpacing: "0.05em" }}
              >
                Kthehuni nesër për një enigmë të re! 🎯
              </p>
            </div>
            <button
              onClick={() => (window.location.href = "/")}
              className="bg-gradient-to-br from-indigo-400 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-2 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
              style={{ fontFamily: "Inter, sans-serif", letterSpacing: "-0.01em" }}
            >
              Kthehu ne faqen Kryesore
            </button>
          </div>
        </div>
      )}

      <main className="flex flex-1 flex-col items-center px-3 py-6 overflow-y-auto sm:px-4 sm:py-8">
        <div className="w-full max-w-md space-y-4">
          {stats && (
            <div className="grid grid-cols-3 gap-3 rounded-2xl bg-white/60 backdrop-blur-xl p-4 shadow-xl border border-white/20 dark:bg-slate-800/60 dark:border-slate-700/30">
              <div className="text-center">
                <p
                  className="text-2xl font-bold bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1"
                  style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, letterSpacing: "-0.03em" }}
                >
                  {stats.completedPuzzles || 0}
                </p>
                <p
                  className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-semibold"
                  style={{ fontFamily: "Inter, sans-serif", letterSpacing: "0.05em" }}
                >
                  Përfunduar
                </p>
              </div>
              <div className="text-center">
                <p
                  className="text-2xl font-bold bg-gradient-to-br from-emerald-600 to-green-600 bg-clip-text text-transparent mb-1"
                  style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, letterSpacing: "-0.03em" }}
                >
                  {stats.completionRate || 0}%
                </p>
                <p
                  className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-semibold"
                  style={{ fontFamily: "Inter, sans-serif", letterSpacing: "0.05em" }}
                >
                  Suksesi
                </p>
              </div>
              <div className="text-center">
                <p
                  className="text-2xl font-bold bg-gradient-to-br from-amber-600 to-orange-600 bg-clip-text text-transparent mb-1"
                  style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, letterSpacing: "-0.03em" }}
                >
                  {puzzle.xpReward || 0}
                </p>
                <p
                  className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-semibold"
                  style={{ fontFamily: "Inter, sans-serif", letterSpacing: "0.05em" }}
                >
                  XP Sot
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {guesses.map((guess, rowIndex) => (
              <div key={rowIndex} className="flex justify-center gap-1.5">
                {guess.word.split("").map((letter, colIndex) => (
                  <div
                    key={colIndex}
                    className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl border-2 text-xl font-bold uppercase transition-all duration-200 ${getTileColor(guess.feedback[colIndex])}`}
                    style={{
                      animationDelay: `${colIndex * 40}ms`,
                      animation: "flipIn 0.25s ease-out",
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 800,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {letter}
                  </div>
                ))}
              </div>
            ))}

            {gameStatus === "playing" && guesses.length < MAX_ATTEMPTS && (
              <div className="flex justify-center gap-1.5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl border-2 text-xl font-bold uppercase transition-all duration-100 ${
                      currentGuess[index]
                        ? "scale-105 border-indigo-400 bg-indigo-50 shadow-lg shadow-indigo-500/30 dark:border-indigo-400 dark:bg-indigo-900/50"
                        : "border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-600 dark:bg-slate-800/60"
                    }`}
                    style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, letterSpacing: "0.02em" }}
                  >
                    {currentGuess[index] || ""}
                  </div>
                ))}
              </div>
            )}

            {Array.from({ length: MAX_ATTEMPTS - guesses.length - (gameStatus === "playing" ? 1 : 0) }).map(
              (_, rowIndex) => (
                <div key={`empty-${rowIndex}`} className="flex justify-center gap-1.5">
                  {Array.from({ length: 5 }).map((_, colIndex) => (
                    <div
                      key={colIndex}
                      className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl border-2 border-slate-200 bg-white/50 backdrop-blur-sm dark:border-slate-600 dark:bg-slate-800/40"
                    />
                  ))}
                </div>
              ),
            )}
          </div>

          {message && (
            <div
              className={`rounded-xl p-3 text-center text-xs font-semibold shadow-lg backdrop-blur-xl border sm:text-sm ${
                gameStatus === "won"
                  ? "bg-emerald-100/80 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                  : gameStatus === "lost"
                    ? "bg-rose-100/80 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800"
                    : gameStatus === "completed"
                      ? "bg-purple-100/80 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800"
                      : "bg-indigo-100/80 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800"
              }`}
              style={{ fontFamily: "Inter, sans-serif", letterSpacing: "-0.01em" }}
            >
              {message}
            </div>
          )}

          {puzzle.hints && gameStatus === "playing" && (
            <div className="rounded-xl bg-amber-50/80 backdrop-blur-xl p-3 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/30 shadow-lg">
              <p
                className="text-xs font-medium text-amber-900 dark:text-amber-300 flex items-center gap-2"
                style={{ fontFamily: "Inter, sans-serif", letterSpacing: "-0.01em" }}
              >
                <span className="text-lg">💡</span>
                <span>{puzzle.hints}</span>
              </p>
            </div>
          )}

          {puzzle.difficulty && (
            <div className="flex justify-center">
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase shadow-lg ${
                  puzzle.difficulty === "easy"
                    ? "bg-gradient-to-r from-emerald-400 to-green-500 text-white"
                    : puzzle.difficulty === "medium"
                      ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white"
                      : "bg-gradient-to-r from-rose-400 to-red-500 text-white"
                }`}
                style={{ fontFamily: "Inter, sans-serif", letterSpacing: "0.08em" }}
              >
                {puzzle.difficulty === "easy" ? "LEHTË" : puzzle.difficulty === "medium" ? "MESATAR" : "VËSHTIRË"}
              </span>
            </div>
          )}

          {gameStatus === "playing" && (
            <div className="space-y-1.5 pb-3">
              {keyboardRows.map((row, rowIndex) => (
                <div key={rowIndex} className="flex justify-center gap-1">
                  {row.map((key) => (
                    <button
                      key={key}
                      onClick={() => handleVirtualKeyPress(key)}
                      className={`${
                        key === "ENTER" || key === "⌫"
                          ? "px-2.5 sm:px-3 text-[10px] font-bold"
                          : "w-7 sm:w-9 text-sm font-bold"
                      } h-11 sm:h-12 rounded-lg border-2 transition-all duration-100 ${
                        key === "ENTER" || key === "⌫"
                          ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-indigo-400 hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                          : getKeyColor(key)
                      }`}
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, letterSpacing: "0.02em" }}
                    >
                      {key === "ENTER" ? "DËRGO" : key}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        @keyframes flipIn {
          0% {
            transform: rotateX(0deg);
            opacity: 0.8;
          }
          50% {
            transform: rotateX(90deg);
            opacity: 0.9;
          }
          100% {
            transform: rotateX(0deg);
            opacity: 1;
          }
        }
        
        @keyframes bounce-in-scale {
          0% {
            transform: scale(0) translateY(30px);
            opacity: 0;
          }
          60% {
            transform: scale(1.05) translateY(-5px);
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes fade-in {
          0% {
            opacity: 0;
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-bounce-in-scale {
          animation: bounce-in-scale 0.35s ease-out;
        }
        
        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
      `}</style>
    </div>
  )
}
