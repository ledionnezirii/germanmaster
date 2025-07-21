"use client"

import { useState, useEffect, useRef } from "react"
import io from "socket.io-client"
import { authService } from "../services/api"
import {
  Play,
  LogOut,
  Clock,
  Users,
  Trophy,
  Target,
  RotateCcw,
  Home,
  Wifi,
  WifiOff,
  Star,
  BarChart3,
  Lock,
  Loader,
  CheckCircle,
  AlertCircle,
  Flag,
  Type,
} from "lucide-react"

const Challenge = () => {
  const [socket, setSocket] = useState(null)
  const [user, setUser] = useState(null)
  const [userXp, setUserXp] = useState(0)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [gameState, setGameState] = useState("idle") // idle, waiting, playing, finished
  const [gameType, setGameType] = useState("wordRace") // NEW: 'quiz' or 'wordRace'
  const [roomId, setRoomId] = useState("")
  const [players, setPlayers] = useState([])
  const [message, setMessage] = useState("")
  const [questions, setQuestions] = useState([]) // This will now hold words for wordRace
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0) // Renamed for clarity
  const [typedWord, setTypedWord] = useState("") // NEW: For word race input
  const [timeLeft, setTimeLeft] = useState(300)
  const [results, setResults] = useState(null)
  const [playerProgress, setPlayerProgress] = useState({}) // Tracks score/wordsTyped for all players
  const [waitingCount, setWaitingCount] = useState(0)
  const [questionStartTime, setQuestionStartTime] = useState(null)
  const [userFinished, setUserFinished] = useState(false)
  const [waitingForOpponent, setWaitingForOpponent] = useState(false)
  const [isJoiningChallenge, setIsJoiningChallenge] = useState(false)

  const timerRef = useRef(null)
  const socketRef = useRef(null)
  const startTimeRef = useRef(null)
  const inputRef = useRef(null) // Ref for the input field

  // Fetch user profile and XP
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoadingProfile(true)
        const profileResponse = await authService.getProfile()
        const xpResponse = await authService.getUserXp()
        const profileData = profileResponse.data
        const xpData = xpResponse.data

        const firstName = profileData.emri || profileData.firstName || "User"
        const lastName = profileData.mbiemri || profileData.lastName || ""
        const totalXp = xpData.xp || xpData.totalXP || profileData.xp || profileData.totalXP || 0

        setUser({
          id: profileData._id || profileData.id,
          name: `${firstName} ${lastName}`.trim(),
          firstName: firstName,
          lastName: lastName,
          email: profileData.email,
          profilePicture: profileData.profilePicture || profileData.profileImage || null,
        })
        setUserXp(totalXp)
      } catch (error) {
        console.error("Error fetching user data:", error)
        if (error.response?.status === 401) {
          localStorage.removeItem("authToken")
          window.location.href = "/signin"
        }
      } finally {
        setIsLoadingProfile(false)
      }
    }
    fetchUserData()
  }, [])

  // Initialize socket connection
  useEffect(() => {
    if (!user) return

    const token = localStorage.getItem("authToken")
    const newSocket = io("http://localhost:5000", {
      auth: {
        token: token,
      },
      transports: ["websocket", "polling"],
    })

    setSocket(newSocket)
    socketRef.current = newSocket

    newSocket.on("connect", () => {
      setIsConnected(true)
      console.log("Connected to server")
    })

    newSocket.on("disconnect", () => {
      setIsConnected(false)
      console.log("Disconnected from server")
    })

    newSocket.on("connected", (data) => {
      console.log("Server confirmation:", data.message)
    })

    newSocket.on("waitingForOpponent", (data) => {
      setGameState("waiting")
      setRoomId(data.roomId)
      setMessage(data.message)
      setWaitingCount(data.waitingCount || 1)
      setGameType(data.gameType || "quiz") // Ensure gameType is set
    })

    newSocket.on("waitingUpdate", (data) => {
      setMessage(data.message)
      setWaitingCount(data.waitingCount)
    })

    // Handle game start (now generic for quiz and word race)
    newSocket.on("quizStart", handleGameStart) // Existing quiz start
    newSocket.on("wordRaceStart", handleGameStart) // NEW: Word race start

    newSocket.on("playerFinished", (data) => {
      setPlayerProgress((prev) => ({
        ...prev,
        [data.username]: {
          score: data.score, // For quiz
          wordsTyped: data.wordsTyped, // For wordRace
          correctWords: data.correctWords, // For wordRace
          xp: data.xp,
          time: data.time,
          finished: true,
        },
      }))
      if (data.username === user.name) {
        setUserFinished(true)
        setWaitingForOpponent(true)
        setMessage("Keni përfunduar! Duke pritur që kundërshtari të përfundojë...")
      }
    })

    // NEW: Real-time progress update for word race
    newSocket.on("playerProgressUpdate", (data) => {
      setPlayerProgress((prev) => ({
        ...prev,
        [data.username]: {
          ...prev[data.username], // Keep existing finished state if any
          wordsTyped: data.wordsTyped,
          correctWords: data.correctWords,
          totalWords: data.totalWords,
        },
      }))
    })

    // Handle game results (now generic for quiz and word race)
    newSocket.on("quizResult", handleGameResult) // Existing quiz result
    newSocket.on("wordRaceResult", handleGameResult) // NEW: Word race result

    // Handle opponent leaving - with XP reward
    newSocket.on("opponentLeft", (data) => {
      const reason = data.reason === "disconnected" ? "u shkëput" : "doli"
      setIsJoiningChallenge(false)
      if (data.winnerXp && data.winnerXp > 0) {
        setMessage(`Kundërshtari ${reason} nga loja. Ju fituat automatikisht dhe morët ${data.winnerXp} XP!`)
        addXpToProfile(data.winnerXp, `Challenge - Fitore nga largimi i kundërshtarit (${data.gameType})`)
      } else {
        setMessage(`Kundërshtari ${reason} nga loja. Ju fituat automatikisht!`)
      }
      resetGameState()
    })

    // Handle successful leave
    newSocket.on("leftChallenge", (data) => {
      console.log("Successfully left challenge:", data.message)
      setMessage(data.message)
      setIsJoiningChallenge(false)
      resetGameState()
    })

    newSocket.on("error", (data) => {
      console.error("Socket error:", data.message)
      setMessage(`Gabim: ${data.message}`)
      setIsJoiningChallenge(false)
    })

    return () => {
      newSocket.close()
      clearTimer()
    }
  }, [user])

  const handleGameStart = (data) => {
    setGameState("playing")
    setRoomId(data.roomId)
    setPlayers(data.users)
    setQuestions(data.questions)
    setMessage(data.message)
    setTimeLeft(data.timeLimit)
    setCurrentQuestionIndex(0)
    setTypedWord("") // Reset typed word
    setWaitingCount(0)
    setUserFinished(false)
    setWaitingForOpponent(false)
    setQuestionStartTime(Date.now())
    startTimeRef.current = Date.now()
    setGameType(data.gameType) // Set the game type received from server
    // Initialize playerProgress for all players in the room
    setPlayerProgress(
      data.users.reduce(
        (acc, p) => ({
          ...acc,
          [p.username]: { score: 0, wordsTyped: 0, correctWords: 0, xp: 0, finished: false },
        }),
        {},
      ),
    )
    startTimer()
    if (inputRef.current) {
      inputRef.current.focus()
    }
    setIsJoiningChallenge(false)
  }

  const handleGameResult = (data) => {
    setGameState("finished")
    setResults(data)
    setMessage(data.message)
    setUserFinished(false)
    setWaitingForOpponent(false)
    clearTimer()
    const userResult = data.users.find((u) => u.username === user.name)
    if (userResult && userResult.xp > 0) {
      addXpToProfile(
        userResult.xp,
        `Challenge - ${data.gameType === "wordRace" ? `${userResult.correctWords} fjalë të sakta` : `${userResult.score} përgjigje të sakta`}`,
      )
    }
    setIsJoiningChallenge(false)
  }

  const addXpToProfile = async (xpAmount, reason) => {
    try {
      console.log(`Adding ${xpAmount} XP for: ${reason}`)
      await authService.addXp(xpAmount, reason)
      setUserXp((prev) => prev + xpAmount)
    } catch (error) {
      console.error("Error adding XP:", error)
    }
  }

  const startTimer = () => {
    clearTimer()
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimer()
          handleTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const handleTimeUp = () => {
    if (socket && roomId && currentQuestionIndex < questions.length && !userFinished) {
      const timeSpent = questionStartTime ? Math.round((Date.now() - questionStartTime) / 1000) : 0
      if (gameType === "wordRace") {
        socket.emit("submitAnswer", {
          roomId,
          questionId: questions[currentQuestionIndex].id,
          typedWord: typedWord, // Send current typed word
          timeSpent,
        })
      } else {
        // Quiz
        socket.emit("submitAnswer", {
          roomId,
          questionId: questions[currentQuestionIndex].id,
          answer: null, // No answer selected if time is up
          timeSpent,
        })
      }
    }
  }

  const handleJoinChallenge = () => {
    if (!user || !socket || !isConnected) {
      console.log("Cannot join challenge - missing requirements")
      return
    }
    console.log("Joining challenge with username:", user.name, "gameType:", gameType)
    setMessage("Duke u lidhur me challenge...")
    setIsJoiningChallenge(true)
    socket.emit("joinChallenge", {
      username: user.name,
      userId: user.id,
      gameType: gameType, // Send selected game type
    })
  }

  const handleLeaveChallenge = () => {
    if (!socket) {
      console.log("No socket connection available")
      return
    }
    console.log("Leaving challenge - current state:", gameState, "roomId:", roomId)
    setMessage("Duke dalë nga challenge-i...")
    socket.emit("leaveChallenge")
  }

  const handleSubmitAnswer = () => {
    if (userFinished) return

    const currentWord = questions[currentQuestionIndex]
    if (!currentWord) return

    const timeSpent = questionStartTime ? Math.round((Date.now() - questionStartTime) / 1000) : 0

    if (gameType === "wordRace") {
      if (typedWord.trim() === "") {
        alert("Ju lutem shkruani fjalën!")
        return
      }
      socket.emit("submitAnswer", {
        roomId,
        questionId: currentWord.id,
        typedWord: typedWord,
        timeSpent,
      })
    } else {
      // Quiz
      // This part would be for quiz answers, which are not in this word race UI
      // For now, this button is only for word race.
      return
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
      setTypedWord("") // Clear input for next word
      setQuestionStartTime(Date.now())
      if (inputRef.current) {
        inputRef.current.focus() // Focus input for next word
      }
    } else {
      // Last question/word submitted, user is finished
      setUserFinished(true)
      setWaitingForOpponent(true)
      setMessage("Keni përfunduar! Duke pritur që kundërshtari të përfundojë...")
    }
  }

  const resetGameState = () => {
    setGameState("idle")
    setQuestions([])
    setCurrentQuestionIndex(0)
    setTypedWord("")
    setResults(null)
    setMessage("")
    setTimeLeft(300)
    setPlayers([])
    setRoomId("")
    setPlayerProgress({})
    setWaitingCount(0)
    setUserFinished(false)
    setWaitingForOpponent(false)
    setQuestionStartTime(null)
    clearTimer()
    setIsJoiningChallenge(false)
  }

  const handleNewChallenge = () => {
    console.log("Starting new challenge")
    resetGameState()
  }

  const handleReturnHome = () => {
    console.log("Returning to home")
    resetGameState()
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getStatusIcon = () => {
    switch (gameState) {
      case "waiting":
        return <Loader className="animate-spin h-4 w-4" />
      case "playing":
        return <Play className="h-4 w-4" />
      case "finished":
        return <CheckCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  const getTimerColor = () => {
    if (timeLeft > 180) return "text-emerald-600"
    if (timeLeft > 60) return "text-amber-600"
    return "text-red-500"
  }

  // Loading state
  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center bg-white rounded-lg shadow-md p-6 sm:p-8">
          <div className="flex flex-col items-center justify-center">
            <Loader className="animate-spin w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 text-sm sm:text-base">Duke ngarkuar profilin tuaj...</p>
          </div>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center bg-white rounded-lg shadow-md p-6 sm:p-8">
          <div className="flex flex-col items-center justify-center">
            <Lock className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Duhet të jeni të kyçur</h2>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">Ju lutem kyçuni për të luajtur challenge-in</p>
            <button
              onClick={() => (window.location.href = "/signin")}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gray-900 text-white hover:bg-gray-700 h-10 px-4 py-2 w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Kyçu
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentLevel = Math.floor(userXp / 100) + 1

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header with Profile */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Flag className="w-7 h-7 sm:w-8 h-8 text-gray-700" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Gara e Fjalëve Gjermanisht</h1>
          </div>
          {/* User Profile Card */}
          <div className="max-w-sm mx-auto shadow-sm bg-white rounded-lg">
            <div className="flex items-center justify-center p-3 sm:p-4">
              {/* Profile Picture */}
              <div className="relative mr-3 sm:mr-4">
                {user.profilePicture ? (
                  <img
                    src={
                      user.profilePicture.startsWith("http")
                        ? user.profilePicture
                        : `http://localhost:5000${user.profilePicture}`
                    }
                    alt={user.name}
                    className="w-10 h-10 sm:w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover"
                    onError={(e) => {
                      e.target.style.display = "none"
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 sm:w-12 h-12 rounded-full border-2 border-white shadow-sm bg-gray-300 flex items-center justify-center">
                    <span className="text-gray-700 font-bold text-xs sm:text-sm">
                      {user.firstName?.charAt(0) || "U"}
                      {user.lastName?.charAt(0) || ""}
                    </span>
                  </div>
                )}
                {/* Connection Status */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-4 h-4 rounded-full border border-white flex items-center justify-center bg-white">
                  {isConnected ? (
                    <Wifi className="w-2 h-2 sm:w-2.5 h-2.5 text-emerald-600" />
                  ) : (
                    <WifiOff className="w-2 h-2 sm:w-2.5 h-2.5 text-red-500" />
                  )}
                </div>
              </div>
              {/* User Info */}
              <div className="text-left">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">{user.name || "User"}</h3>
                <p className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    {userXp} XP
                  </span>
                  <span className="flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" />
                    Level {currentLevel}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          {/* Status Message */}
          {message && (
            <div className="relative w-full rounded-lg border px-4 py-3 text-sm [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7 bg-gray-100 border-gray-300 text-gray-700 mb-4 sm:mb-6">
              <div className="flex items-center justify-center gap-2">
                {getStatusIcon()}
                <p className="text-center font-semibold text-sm sm:text-base">{message}</p>
              </div>
            </div>
          )}

          {/* Idle State - Join Challenge */}
          {gameState === "idle" && (
            <div className="text-center space-y-4">
              <Type className="w-14 h-14 sm:w-16 h-16 text-gray-400 mx-auto mb-2" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                Gati për garën e fjalëve gjermanisht, {user.firstName || "User"}?
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Sfidoni lojtarë të tjerë dhe fitoni XP duke shkruar fjalë!
              </p>
              <button
                onClick={handleJoinChallenge}
                disabled={!isConnected || gameState !== "idle" || isJoiningChallenge}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gray-900 text-white hover:bg-gray-700 h-11 px-8 py-2 w-full"
              >
                <Play className="mr-2 h-5 w-5" />
                Fillo Garën e Fjalëve
              </button>
            </div>
          )}

          {/* Waiting State */}
          {gameState === "waiting" && (
            <div className="text-center space-y-4">
              <Loader className="animate-spin w-12 h-12 sm:w-14 h-14 text-gray-600 mx-auto" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-700">Duke pritur kundërshtar...</h3>
              <p className="text-gray-600 flex items-center justify-center gap-2 text-sm sm:text-base">
                <Users className="w-4 h-4" />
                {waitingCount > 1 ? `${waitingCount} lojtarë në pritje` : "Ju jeni i pari në pritje"}
              </p>
              <div className="relative w-full rounded-lg border px-4 py-3 text-sm [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7 text-left bg-gray-100 border-gray-300 text-gray-700">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <h5 className="text-sm font-semibold">Këshillë:</h5>
                </div>
                <p className="text-xs">Hapni një dritare tjetër ose ftoni një shok për të luajtur!</p>
              </div>
              <button
                onClick={handleLeaveChallenge}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-red-600 text-white hover:bg-red-700 h-10 px-4 py-2 w-full"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Dil nga Pritja
              </button>
            </div>
          )}

          {/* Playing State */}
          {gameState === "playing" && questions.length > 0 && (
            <div className="space-y-4">
              {/* Header with leave button */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
                <div className="text-xs sm:text-sm text-gray-600">
                  {!userFinished && currentQuestionIndex < questions.length && (
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      Fjala {currentQuestionIndex + 1} nga {questions.length}
                    </span>
                  )}
                  {userFinished && (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Keni përfunduar!
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  {!userFinished && (
                    <div className={`text-base font-bold flex items-center gap-1 ${getTimerColor()}`}>
                      <Clock className="w-4 h-4" />
                      {formatTime(timeLeft)}
                    </div>
                  )}
                  <button
                    onClick={handleLeaveChallenge}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                  >
                    <LogOut className="mr-1 h-3 w-3" />
                    Dil
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              {!userFinished && (
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    role="progressbar"
                    aria-valuenow={((currentQuestionIndex + 1) / questions.length) * 100}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="h-full w-full flex-1 bg-gray-900 transition-all"
                    style={{
                      transform: `translateX(-${100 - ((currentQuestionIndex + 1) / questions.length) * 100}%)`,
                    }}
                  />
                </div>
              )}

              {/* Word to Type or Waiting State */}
              {!userFinished && currentQuestionIndex < questions.length && (
                <>
                  {/* Word Display */}
                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm text-center">
                    <div className="p-4">
                      <p className="text-sm text-muted-foreground mb-1">Shkruani fjalën:</p>
                      <h3 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">
                        {questions[currentQuestionIndex].word}
                      </h3>
                      <p className="text-sm text-muted-foreground">({questions[currentQuestionIndex].translation})</p>
                    </div>
                  </div>

                  {/* Typing Input */}
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={typedWord}
                      onChange={(e) => setTypedWord(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleSubmitAnswer()
                        }
                      }}
                      placeholder="Shkruani fjalën këtu..."
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10"
                      disabled={userFinished}
                    />
                    <button
                      onClick={handleSubmitAnswer}
                      disabled={typedWord.trim() === "" || userFinished}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gray-800 text-white hover:bg-gray-700 h-9 w-9 absolute right-1 top-1/2 -translate-y-1/2"
                      aria-label="Submit word"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}

              {/* Waiting for opponent to finish */}
              {waitingForOpponent && (
                <div className="text-center space-y-3">
                  <Loader className="animate-spin w-10 h-10 text-gray-400 mx-auto" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-700">Duke pritur kundërshtarin...</h3>
                  <p className="text-sm text-gray-600">Kundërshtari juaj ende po shkruan fjalët</p>
                </div>
              )}

              {/* Player Progress */}
              {Object.keys(playerProgress).length > 0 && (
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                  <div className="flex flex-col space-y-1.5 p-4 pb-2">
                    <h4 className="text-base font-semibold leading-none tracking-tight flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Progresi i Lojtarëve:
                    </h4>
                  </div>
                  <div className="p-4 pt-2">
                    {Object.entries(playerProgress).map(([username, progress]) => (
                      <div key={username} className="flex justify-between items-center text-sm py-1">
                        <span>
                          {username} {username === user.name && "(Ju)"}
                        </span>
                        <span className="text-gray-700 flex items-center gap-1">
                          {progress.finished ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Përfunduar ({progress.correctWords} fjalë)
                            </>
                          ) : (
                            <>
                              <Type className="w-3 h-3" />
                              {progress.correctWords || 0} / {questions.length} fjalë
                            </>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Results State */}
          {gameState === "finished" && results && (
            <div className="text-center space-y-4">
              <div className="flex justify-center mb-2">
                {results.users.find((u) => u.username === user.name)?.isWinner ? (
                  <Trophy className="w-14 h-14 sm:w-16 h-16 text-gray-900" />
                ) : (
                  <Target className="w-14 h-14 sm:w-16 h-16 text-gray-400" />
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Rezultatet</h3>
              {/* Results Table */}
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="p-4">
                  <div className="space-y-3">
                    {results.users.map((player, index) => (
                      <div
                        key={player.username}
                        className={`flex justify-between items-center p-3 rounded-md ${
                          player.username === user.name ? "bg-gray-100 border border-gray-300" : "bg-white"
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="flex items-center">
                            {index === 0 ? (
                              <Trophy className="w-4 h-4 sm:w-5 h-5 text-gray-900" />
                            ) : (
                              <Target className="w-4 h-4 sm:w-5 h-5 text-gray-400" />
                            )}
                          </span>
                          <span className="font-semibold text-sm sm:text-base">
                            {player.username}
                            {player.username === user.name && " (Ju)"}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-base sm:text-lg">
                            {gameType === "wordRace" ? `${player.correctWords} fjalë` : `${player.score} pikë`}
                          </div>
                          <div className="text-xs text-gray-600 flex items-center gap-1 justify-end">
                            <Star className="w-3 h-3" />+{player.xp} XP
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Two buttons after challenge ends */}
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={handleNewChallenge}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gray-900 text-white hover:bg-gray-700 h-11 px-8 py-2 flex-1"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Challenge i Ri
                </button>
                <button
                  onClick={handleReturnHome}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-8 py-2 flex-1"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Kthehu në Fillim
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Challenge
