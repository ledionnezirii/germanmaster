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
  GraduationCap,
} from "lucide-react"

const Challenge = () => {
  const [socket, setSocket] = useState(null)
  const [user, setUser] = useState(null)
  const [userXp, setUserXp] = useState(0)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [gameState, setGameState] = useState("idle")
  const [roomId, setRoomId] = useState("")
  const [players, setPlayers] = useState([])
  const [message, setMessage] = useState("")
  const [questions, setQuestions] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [timeLeft, setTimeLeft] = useState(300)
  const [results, setResults] = useState(null)
  const [playerProgress, setPlayerProgress] = useState({})
  const [waitingCount, setWaitingCount] = useState(0)
  const [questionStartTime, setQuestionStartTime] = useState(null)
  const [userFinished, setUserFinished] = useState(false)
  const [waitingForOpponent, setWaitingForOpponent] = useState(false)

  const timerRef = useRef(null)
  const socketRef = useRef(null)
  const startTimeRef = useRef(null)

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
    })

    newSocket.on("waitingUpdate", (data) => {
      setMessage(data.message)
      setWaitingCount(data.waitingCount)
    })

    newSocket.on("quizStart", (data) => {
      setGameState("playing")
      setRoomId(data.roomId)
      setPlayers(data.users)
      setQuestions(data.questions)
      setMessage(data.message)
      setTimeLeft(data.timeLimit)
      setCurrentQuestion(0)
      setSelectedAnswer(null)
      setWaitingCount(0)
      setUserFinished(false)
      setWaitingForOpponent(false)
      setQuestionStartTime(Date.now())
      startTimeRef.current = Date.now()
      startTimer()
    })

    newSocket.on("playerFinished", (data) => {
      setPlayerProgress((prev) => ({
        ...prev,
        [data.username]: {
          score: data.score,
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

    newSocket.on("quizResult", (data) => {
      setGameState("finished")
      setResults(data)
      setMessage(data.message)
      setUserFinished(false)
      setWaitingForOpponent(false)
      clearTimer()

      const userResult = data.users.find((u) => u.username === user.name)
      if (userResult && userResult.xp > 0) {
        addXpToProfile(userResult.xp, `Challenge - ${userResult.score} correct answers`)
      }
    })

    // Handle opponent leaving - with XP reward
    newSocket.on("opponentLeft", (data) => {
      const reason = data.reason === "disconnected" ? "u shkëput" : "doli"

      // Show XP reward message if provided
      if (data.winnerXp && data.winnerXp > 0) {
        setMessage(`Kundërshtari ${reason} nga loja. Ju fituat automatikisht dhe morët ${data.winnerXp} XP!`)
        addXpToProfile(data.winnerXp, "Challenge - Fitore nga largimi i kundërshtarit")
      } else {
        setMessage(`Kundërshtari ${reason} nga loja. Ju fituat automatikisht!`)
      }

      setGameState("idle")
      setWaitingCount(0)
      setUserFinished(false)
      setWaitingForOpponent(false)
      clearTimer()
    })

    // Handle successful leave
    newSocket.on("leftChallenge", (data) => {
      console.log("Successfully left challenge:", data.message)
      setMessage(data.message)
      setGameState("idle")
      setWaitingCount(0)
      setUserFinished(false)
      setWaitingForOpponent(false)
      setRoomId("")
      setPlayers([])
      setQuestions([])
      setCurrentQuestion(0)
      setSelectedAnswer(null)
      setResults(null)
      setPlayerProgress({})
      setQuestionStartTime(null)
      clearTimer()
    })

    newSocket.on("error", (data) => {
      console.error("Socket error:", data.message)
      setMessage(`Gabim: ${data.message}`)
    })

    return () => {
      newSocket.close()
      clearTimer()
    }
  }, [user])

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
    if (socket && roomId && currentQuestion < questions.length && !userFinished) {
      const timeSpent = questionStartTime ? Math.round((Date.now() - questionStartTime) / 1000) : 0

      socket.emit("quizAnswer", {
        roomId,
        questionId: questions[currentQuestion].id,
        answer: selectedAnswer !== null ? questions[currentQuestion].options[selectedAnswer] : "",
        timeSpent,
      })
    }
  }

  const handleJoinChallenge = () => {
    if (!user || !socket || !isConnected) {
      console.log("Cannot join challenge - missing requirements")
      return
    }

    console.log("Joining challenge with username:", user.name)
    setMessage("Duke u lidhur me challenge...")

    socket.emit("joinChallenge", {
      username: user.name,
      userId: user.id,
    })
  }

  const handleLeaveChallenge = () => {
    if (!socket) {
      console.log("No socket connection available")
      return
    }

    console.log("Leaving challenge - current state:", gameState, "roomId:", roomId)

    // Show immediate feedback
    setMessage("Duke dalë nga challenge-i...")

    // Emit leave event
    socket.emit("leaveChallenge")
  }

  const handleAnswerSelect = (answerIndex) => {
    if (userFinished) return
    setSelectedAnswer(answerIndex)
  }

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) {
      alert("Ju lutem zgjidhni një përgjigje!")
      return
    }

    if (socket && roomId && questions[currentQuestion] && !userFinished) {
      const timeSpent = questionStartTime ? Math.round((Date.now() - questionStartTime) / 1000) : 0

      socket.emit("quizAnswer", {
        roomId,
        questionId: questions[currentQuestion].id,
        answer: questions[currentQuestion].options[selectedAnswer],
        timeSpent,
      })

      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion((prev) => prev + 1)
        setSelectedAnswer(null)
        setQuestionStartTime(Date.now())
      }
    }
  }

  const handleNewChallenge = () => {
    console.log("Starting new challenge")
    setGameState("idle")
    setQuestions([])
    setCurrentQuestion(0)
    setSelectedAnswer(null)
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
  }

  const handleReturnHome = () => {
    console.log("Returning to home")
    handleNewChallenge()
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getStatusColor = () => {
    switch (gameState) {
      case "waiting":
        return "bg-amber-50 border-amber-200 text-amber-800"
      case "playing":
        return "bg-emerald-50 border-emerald-200 text-emerald-800"
      case "finished":
        return "bg-green-50 border-green-200 text-green-800"
      default:
        return "bg-stone-50 border-stone-200 text-stone-800"
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
      <div className="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 text-center max-w-sm w-full">
          <Loader className="animate-spin w-12 h-12 sm:w-16 sm:h-16 text-amber-600 mx-auto mb-4" />
          <p className="text-stone-600 text-sm sm:text-base">Duke ngarkuar profilin tuaj...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 text-center max-w-md w-full">
          <Lock className="w-12 h-12 sm:w-16 sm:h-16 text-stone-400 mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold text-stone-800 mb-4">Duhet të jeni të kyçur</h2>
          <p className="text-stone-600 mb-6 text-sm sm:text-base">Ju lutem kyçuni për të luajtur challenge-in</p>
          <button
            onClick={() => (window.location.href = "/signin")}
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all duration-200 flex items-center gap-2 mx-auto text-sm sm:text-base"
          >
            <LogOut className="w-4 h-4" />
            Kyçu
          </button>
        </div>
      </div>
    )
  }

  const currentLevel = Math.floor(userXp / 100) + 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50 to-orange-100 p-2 sm:p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with Profile */}
        <div className="text-center mb-4 sm:mb-8">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Flag className="w-8 h-8 sm:w-10 sm:h-10 text-amber-700" />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-800">Challenge Gjermanisht</h1>
          </div>

          {/* User Profile Card */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-3 sm:p-4 mb-3 sm:mb-4 max-w-sm sm:max-w-md mx-auto shadow-lg">
            <div className="flex items-center justify-center space-x-3 sm:space-x-4">
              {/* Profile Picture */}
              <div className="relative">
                {user.profilePicture ? (
                  <img
                    src={
                      user.profilePicture.startsWith("http")
                        ? user.profilePicture
                        : `http://localhost:5000${user.profilePicture}`
                    }
                    alt={user.name}
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-3 sm:border-4 border-white shadow-lg object-cover"
                    onError={(e) => {
                      e.target.style.display = "none"
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-3 sm:border-4 border-white shadow-lg bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center">
                    <span className="text-white font-bold text-sm sm:text-xl">
                      {user.firstName?.charAt(0) || "U"}
                      {user.lastName?.charAt(0) || ""}
                    </span>
                  </div>
                )}

                {/* Connection Status */}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-white flex items-center justify-center bg-white">
                  {isConnected ? (
                    <Wifi className="w-2 h-2 sm:w-3 sm:h-3 text-emerald-600" />
                  ) : (
                    <WifiOff className="w-2 h-2 sm:w-3 sm:h-3 text-red-500" />
                  )}
                </div>
              </div>

              {/* User Info */}
              <div className="text-left">
                <h3 className="text-stone-800 font-bold text-sm sm:text-lg">{user.name || "User"}</h3>
                <div className="flex items-center space-x-2 sm:space-x-4 text-stone-600 text-xs sm:text-sm">
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4" />
                    {userXp} XP
                  </span>
                  <span className="flex items-center gap-1">
                    <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                    Level {currentLevel}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-2">
            {isConnected ? (
              <div className="flex items-center gap-2 text-stone-700 text-xs sm:text-sm">
                <Wifi className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>E lidhur</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-stone-700 text-xs sm:text-sm">
                <WifiOff className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>E shkëputur</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 lg:p-8">
          {/* Status Message */}
          {message && (
            <div className={`p-3 sm:p-4 rounded-xl border-2 mb-4 sm:mb-6 ${getStatusColor()}`}>
              <p className="text-center font-semibold flex items-center justify-center gap-2 text-sm sm:text-base">
                {gameState === "waiting" && <Loader className="animate-spin w-4 h-4" />}
                {gameState === "playing" && <Play className="w-4 h-4" />}
                {gameState === "finished" && <CheckCircle className="w-4 h-4" />}
                {message}
              </p>
            </div>
          )}

          {/* Idle State - Join Challenge */}
          {gameState === "idle" && (
            <div className="text-center space-y-4 sm:space-y-6">
              <GraduationCap className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-stone-400 mx-auto mb-4" />
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-xl sm:text-2xl font-bold text-stone-800">
                  Gati për challenge gjermanisht, {user.firstName || "User"}?
                </h3>
                <p className="text-stone-600 text-sm sm:text-base">Sfidoni lojtarë të tjerë dhe fitoni XP!</p>
              </div>

              <button
                onClick={handleJoinChallenge}
                disabled={!isConnected}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 sm:py-4 px-6 sm:px-8 rounded-xl font-bold text-sm sm:text-lg hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 sm:gap-3"
              >
                <Play className="w-5 h-5 sm:w-6 sm:h-6" />
                Fillo Challenge-in Gjermanisht
              </button>
            </div>
          )}

          {/* Waiting State */}
          {gameState === "waiting" && (
            <div className="text-center space-y-4 sm:space-y-6">
              <Loader className="animate-spin w-12 h-12 sm:w-16 sm:h-16 text-amber-600 mx-auto" />
              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-bold text-stone-700">Duke pritur kundërshtar...</h3>
                <p className="text-stone-600 flex items-center justify-center gap-2 text-sm sm:text-base">
                  <Users className="w-4 h-4" />
                  {waitingCount > 1 ? `${waitingCount} lojtarë në pritje` : "Ju jeni i pari në pritje"}
                </p>
                <div className="bg-amber-50 p-3 sm:p-4 rounded-xl">
                  <p className="text-xs sm:text-sm text-amber-700 flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <strong>Këshillë:</strong> Hapni një dritare tjetër ose ftoni një shok për të luajtur!
                  </p>
                </div>
              </div>

              <button
                onClick={handleLeaveChallenge}
                className="bg-red-400 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-xl hover:bg-red-500 transition-colors flex items-center gap-2 mx-auto text-sm sm:text-base"
              >
                <LogOut className="w-4 h-4" />
                Dil nga Pritja
              </button>
            </div>
          )}

          {/* Playing State */}
          {gameState === "playing" && questions.length > 0 && (
            <div className="space-y-4 sm:space-y-6">
              {/* Header with leave button */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                <div className="text-xs sm:text-sm text-stone-600">
                  {!userFinished && currentQuestion < questions.length && (
                    <span className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Pyetja {currentQuestion + 1} nga {questions.length}
                    </span>
                  )}
                  {userFinished && (
                    <span className="text-emerald-600 font-semibold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Keni përfunduar!
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-3 sm:space-x-4">
                  {!userFinished && (
                    <div className={`text-base sm:text-lg font-bold flex items-center gap-2 ${getTimerColor()}`}>
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                      {formatTime(timeLeft)}
                    </div>
                  )}
                  <button
                    onClick={handleLeaveChallenge}
                    className="bg-red-400 text-white py-2 px-3 sm:px-4 rounded-lg text-xs sm:text-sm hover:bg-red-500 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                    Dil
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              {!userFinished && (
                <div className="w-full bg-stone-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                  ></div>
                </div>
              )}

              {/* Question or Waiting State */}
              {!userFinished && currentQuestion < questions.length && (
                <>
                  {/* Question */}
                  <div className="bg-stone-50 p-4 sm:p-6 rounded-xl">
                    <h3 className="text-lg sm:text-xl font-bold text-stone-800 mb-4">
                      {questions[currentQuestion].question}
                    </h3>

                    {/* Answer Options */}
                    <div className="space-y-3">
                      {questions[currentQuestion].options.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => handleAnswerSelect(index)}
                          className={`w-full p-3 sm:p-4 text-left rounded-xl border-2 transition-all duration-200 text-sm sm:text-base ${
                            selectedAnswer === index
                              ? "border-amber-500 bg-amber-50 text-amber-800"
                              : "border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                          }`}
                        >
                          <span className="font-semibold mr-3">{String.fromCharCode(65 + index)}.</span>
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={selectedAnswer === null}
                    className="w-full bg-gradient-to-r from-emerald-500 to-green-500 text-white py-3 sm:py-4 px-6 sm:px-8 rounded-xl font-bold text-sm sm:text-lg hover:from-emerald-600 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:gap-3"
                  >
                    {currentQuestion === questions.length - 1 ? (
                      <>
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        Përfundo Challenge-in
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                        Pyetja Tjetër
                      </>
                    )}
                  </button>
                </>
              )}

              {/* Waiting for opponent to finish */}
              {waitingForOpponent && (
                <div className="text-center space-y-4">
                  <Loader className="animate-spin w-12 h-12 sm:w-16 sm:h-16 text-stone-400 mx-auto" />
                  <h3 className="text-lg sm:text-xl font-bold text-stone-700">Duke pritur kundërshtarin...</h3>
                  <p className="text-stone-600 text-sm sm:text-base">Kundërshtari juaj ende po përgjigjet pyetjeve</p>
                </div>
              )}

              {/* Player Progress */}
              {Object.keys(playerProgress).length > 0 && (
                <div className="bg-stone-50 p-3 sm:p-4 rounded-xl">
                  <h4 className="font-bold text-stone-700 mb-2 flex items-center gap-2 text-sm sm:text-base">
                    <Users className="w-4 h-4" />
                    Progresi i Lojtarëve:
                  </h4>
                  {Object.entries(playerProgress).map(([username, progress]) => (
                    <div key={username} className="flex justify-between items-center text-xs sm:text-sm">
                      <span>{username}</span>
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        {progress.score} pikë ({progress.time}s)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Results State */}
          {gameState === "finished" && results && (
            <div className="text-center space-y-4 sm:space-y-6">
              <div className="flex justify-center mb-4">
                {results.users.find((u) => u.username === user.name)?.isWinner ? (
                  <Trophy className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-amber-500" />
                ) : (
                  <Target className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-stone-400" />
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-xl sm:text-2xl font-bold text-stone-800">Rezultatet</h3>

                {/* Results Table */}
                <div className="bg-stone-50 rounded-xl p-4 sm:p-6">
                  <div className="space-y-3">
                    {results.users.map((player, index) => (
                      <div
                        key={player.username}
                        className={`flex justify-between items-center p-3 rounded-xl ${
                          player.username === user.name ? "bg-amber-100 border-2 border-amber-300" : "bg-white"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="flex items-center">
                            {index === 0 ? (
                              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
                            ) : (
                              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-stone-400" />
                            )}
                          </span>
                          <span className="font-semibold text-sm sm:text-base">
                            {player.username}
                            {player.username === user.name && " (Ju)"}
                          </span>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-base sm:text-lg">{player.score} pikë</div>
                          <div className="text-xs sm:text-sm text-stone-600 flex items-center gap-1 justify-end">
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
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 sm:py-4 px-6 sm:px-8 rounded-xl font-bold text-sm sm:text-lg hover:from-amber-600 hover:to-orange-600 flex items-center justify-center gap-2 sm:gap-3"
                >
                  <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                  Challenge i Ri
                </button>
                <button
                  onClick={handleReturnHome}
                  className="flex-1 bg-gradient-to-r from-stone-500 to-stone-600 text-white py-3 sm:py-4 px-6 sm:px-8 rounded-xl font-bold text-sm sm:text-lg hover:from-stone-600 hover:to-stone-700 flex items-center justify-center gap-2 sm:gap-3"
                >
                  <Home className="w-4 h-4 sm:w-5 sm:h-5" />
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
