"use client"

import { useState, useEffect, useRef } from "react"
import { io } from "socket.io-client"
import { raceService, quizService, authService, SOCKET_URL } from "../services/api"
import { Users, Zap, Clock, Target, Trophy, Crown, Copy, Check } from "lucide-react"

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"]
const QUESTION_TIME = 10

// Inline UI components
const Button = ({
  children,
  onClick,
  disabled,
  className = "",
  variant = "default",
  size = "default",
  type = "button",
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50"
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 bg-white hover:bg-gray-50",
    ghost: "hover:bg-gray-100",
  }
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 px-3 text-sm",
    lg: "h-11 px-8",
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

const Card = ({ children, className = "", ...props }) => (
  <div className={`rounded-lg border bg-white shadow-sm ${className}`} {...props}>
    {children}
  </div>
)

const CardHeader = ({ children, className = "" }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
)

const CardTitle = ({ children, className = "" }) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>{children}</h3>
)

const CardDescription = ({ children, className = "" }) => (
  <p className={`text-sm text-gray-600 ${className}`}>{children}</p>
)

const CardContent = ({ children, className = "" }) => <div className={`p-6 pt-0 ${className}`}>{children}</div>

const Badge = ({ children, className = "", variant = "default", ...props }) => {
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
    destructive: "bg-red-600 text-white hover:bg-red-700",
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}

const Input = ({ className = "", ...props }) => (
  <input
    className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
)

const Label = ({ children, className = "", htmlFor }) => (
  <label htmlFor={htmlFor} className={`text-sm font-medium leading-none ${className}`}>
    {children}
  </label>
)

const Progress = ({ value, className = "" }) => (
  <div className={`relative h-2 w-full overflow-hidden rounded-full bg-gray-200 ${className}`}>
    <div className="h-full bg-blue-600 transition-all" style={{ width: `${value}%` }} />
  </div>
)

export default function RaceGame() {
  const [view, setView] = useState("lobby")
  const [rooms, setRooms] = useState([])
  const [currentRoom, setCurrentRoom] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState("A1")
  const [gameState, setGameState] = useState(null)
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const socketRef = useRef(null)
  const timerRef = useRef(null)
  const [copied, setCopied] = useState(false)

  // Form states for creating room
  const [roomName, setRoomName] = useState("")
  const [maxPlayers, setMaxPlayers] = useState(4)
  const [questionsCount, setQuestionsCount] = useState(10)
  const [level, setLevel] = useState("A1")

  const [availableQuizzes, setAvailableQuizzes] = useState([])
  const [selectedQuiz, setSelectedQuiz] = useState(null)
  const [loadingQuizzes, setLoadingQuizzes] = useState(false)

  // Join by code
  const [roomCodeInput, setRoomCodeInput] = useState("")

  useEffect(() => {
    loadUser()
    loadRooms()
    initSocket()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (gameState?.timeLeft !== undefined) {
      setTimeLeft(gameState.timeLeft)
    }
  }, [gameState?.timeLeft])

  useEffect(() => {
    if (gameState?.status === "playing" && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [gameState?.status, gameState?.currentQuestion])

  const loadUser = async () => {
    try {
      const response = await authService.getProfile()
      setUser(response.data)
    } catch (error) {
      console.error("Failed to load user:", error)
    }
  }

  const loadRooms = async () => {
    try {
      const response = await raceService.getAvailableRooms()
      const roomsData = response.data?.rooms || response.data
      setRooms(Array.isArray(roomsData) ? roomsData : [])
    } catch (error) {
      console.error("Failed to load rooms:", error)
      setRooms([])
    }
  }

  const initSocket = () => {
    const token = localStorage.getItem("authToken")
    if (!token) return

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    })

    newSocket.on("connect", () => {
      console.log("Connected to race server")
    })

    newSocket.on("playerJoined", (data) => {
      console.log("Player joined:", data)
      if (currentRoom) {
        setGameState((prev) => (prev ? { ...prev, players: data.players } : null))
      }
    })

    newSocket.on("playerReady", (data) => {
      console.log("Player ready:", data)
      if (currentRoom) {
        setGameState((prev) => (prev ? { ...prev, players: data.players } : null))
      }
    })

    newSocket.on("gameStarting", (data) => {
      console.log("Game starting countdown:", data)
    })

    newSocket.on("gameStarted", (data) => {
      console.log("Game started:", data)
      setGameState({
        status: "playing",
        currentQuestion: data.question,
        currentQuestionIndex: data.questionIndex,
        timeLeft: QUESTION_TIME,
        players: currentRoom?.players || [],
      })
      setTimeLeft(QUESTION_TIME)
    })

    newSocket.on("nextQuestion", (data) => {
      console.log("Next question:", data)
      setGameState({
        status: "playing",
        currentQuestion: data.question,
        currentQuestionIndex: data.questionIndex,
        players: data.leaderboard,
        timeLeft: QUESTION_TIME,
      })
      setSelectedAnswer(null)
      setTimeLeft(QUESTION_TIME)
    })

    newSocket.on("playerAnswered", (data) => {
      console.log("Player answered:", data)
    })

    newSocket.on("gameFinished", (data) => {
      console.log("Game finished:", data)
      setGameState({
        status: "finished",
        players: data.leaderboard,
      })
      loadUser()
    })

    newSocket.on("playerLeft", (data) => {
      console.log("Player left:", data)
      if (currentRoom) {
        setGameState((prev) => (prev ? { ...prev, players: data.players } : null))
      }
    })

    newSocket.on("raceError", (error) => {
      console.error("Race error:", error)
      alert(error.message)
    })

    socketRef.current = newSocket
  }

  const loadQuizzes = async () => {
    setLoadingQuizzes(true)
    try {
      const response = await quizService.getAllQuizzes()
      const quizzes = response.data || response
      setAvailableQuizzes(Array.isArray(quizzes) ? quizzes : [])
    } catch (error) {
      console.error("Failed to load quizzes:", error)
      alert("Failed to load quizzes")
      setAvailableQuizzes([])
    } finally {
      setLoadingQuizzes(false)
    }
  }

  const handleNavigateToCreate = () => {
    setView("selectQuiz")
    loadQuizzes()
  }

  const handleCreateRoom = async (e) => {
    e.preventDefault()

    if (!selectedQuiz) {
      alert("Please select a quiz first")
      return
    }

    setLoading(true)
    try {
      const response = await raceService.createRoom({
        roomName,
        level,
        maxPlayers,
        questionsCount,
        quizId: selectedQuiz._id, // Pass quiz ID to backend
      })

      const roomData = response.data?.room || response.data

      if (roomData && socketRef.current) {
        socketRef.current.emit("joinRace", {
          roomId: roomData.roomId,
          userId: user?._id,
          username: user?.emri,
        })
        setView("room")
        setCurrentRoom(roomData)
        setGameState({
          status: "waiting",
          players: roomData.players || [],
        })
      }
    } catch (error) {
      console.error("Failed to create room:", error)
      alert("Failed to create room")
    } finally {
      setLoading(false)
    }
  }

  const handleJoinRoom = async (room) => {
    setLoading(true)
    try {
      await raceService.joinRoom(room.roomId)

      if (socketRef.current) {
        socketRef.current.emit("joinRace", {
          roomId: room.roomId,
          userId: user?._id,
          username: user?.emri,
        })
        setView("room")
        setCurrentRoom(room)
        setGameState({
          status: "waiting",
          players: room.players || [],
        })
      }
    } catch (error) {
      console.error("Failed to join room:", error)
      alert("Failed to join room")
    } finally {
      setLoading(false)
    }
  }

  const handleLeaveRoom = () => {
    if (currentRoom && socketRef.current) {
      socketRef.current.emit("leaveRace", {
        roomId: currentRoom.roomId,
        userId: user?._id,
      })
      setCurrentRoom(null)
      setGameState(null)
      setView("lobby")
      loadRooms()
    }
  }

  const handleReady = () => {
    if (currentRoom && socketRef.current) {
      socketRef.current.emit("playerReady", {
        roomId: currentRoom.roomId,
        userId: user?._id,
      })
    }
  }

  const handleAnswerSelect = (answer) => {
    if (!gameState || gameState.status !== "playing" || selectedAnswer !== null) return

    setSelectedAnswer(answer)

    if (currentRoom && socketRef.current && gameState.currentQuestion) {
      socketRef.current.emit("submitAnswer", {
        roomId: currentRoom.roomId,
        userId: user?._id,
        questionIndex: gameState.currentQuestionIndex,
        answer: gameState.currentQuestion.options.indexOf(answer),
        timeSpent: QUESTION_TIME - timeLeft,
      })
    }
  }

  const handleJoinByCode = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      console.log("[v0] Looking up room with code:", roomCodeInput.toUpperCase())
      const response = await raceService.getRoomByCode(roomCodeInput.toUpperCase())
      console.log("[v0] getRoomByCode response:", response)

      const roomData = response.data?.room || response.data

      if (roomData) {
        console.log("[v0] Room found:", roomData)
        console.log("[v0] Room MongoDB ID:", roomData._id)
        console.log("[v0] Room status:", roomData.status)

        // Check if room is still accepting players
        if (roomData.status !== "waiting") {
          alert("Room has already started or is no longer accepting players")
          setLoading(false)
          return
        }

        // Use MongoDB _id for joining, not the roomId (which is the room code)
        const joinResponse = await raceService.joinRoom(roomData._id)
        console.log("[v0] Join room response:", joinResponse)

        if (socketRef.current) {
          socketRef.current.emit("joinRace", {
            roomId: roomData._id,
            userId: user?._id,
            username: user?.emri,
          })

          const updatedRoom = joinResponse.data?.room || joinResponse.data || roomData

          setView("room")
          setCurrentRoom(updatedRoom)
          setGameState({
            status: "waiting",
            players: updatedRoom.players || [],
          })
          setRoomCodeInput("")
        }
      }
    } catch (error) {
      console.error("[v0] Failed to join room:", error)
      console.error("[v0] Error response:", error.response?.data)
      const errorMsg = error.response?.data?.message || "Room not found or already started"
      alert(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handlePlayVsComputer = async () => {
    setLoading(true)
    try {
      const response = await raceService.createRoom({
        roomName: `${user?.emri || "Player"} vs Computer`,
        level: selectedLevel,
        maxPlayers: 2,
        questionsCount: 10,
        gameMode: "vs-computer",
      })

      const roomData = response.data?.room || response.data

      if (roomData && socketRef.current) {
        socketRef.current.emit("joinRace", {
          roomId: roomData.roomId,
          userId: user?._id,
          username: user?.emri,
        })
        setView("room")
        setCurrentRoom(roomData)
        setGameState({
          status: "waiting",
          players: roomData.players || [],
        })
      }
    } catch (error) {
      console.error("Failed to create computer match:", error)
      alert("Failed to create computer match")
    } finally {
      setLoading(false)
    }
  }

  const copyRoomCode = () => {
    if (currentRoom) {
      navigator.clipboard.writeText(currentRoom.roomId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Quiz Selection View - user selects quiz before creating room
  if (view === "selectQuiz") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Button variant="outline" onClick={() => setView("lobby")} className="mb-6">
            ← Back to Lobby
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Select a Quiz</CardTitle>
              <CardDescription>Choose a quiz from the database for your race room</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingQuizzes ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading quizzes...</p>
                </div>
              ) : availableQuizzes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No quizzes available in the database</p>
                  <p className="text-sm text-gray-500 mt-2">Please add quizzes to the database first</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {availableQuizzes.map((quiz) => (
                      <div
                        key={quiz._id}
                        onClick={() => setSelectedQuiz(quiz)}
                        className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                          selectedQuiz?._id === quiz._id
                            ? "border-blue-600 bg-blue-50 ring-2 ring-blue-600"
                            : "border-gray-200 hover:border-blue-400"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{quiz.title || `Quiz ${quiz._id.slice(-6)}`}</h4>
                            {quiz.description && <p className="text-sm text-gray-600 mt-1">{quiz.description}</p>}
                            <div className="flex items-center gap-2 mt-2">
                              {quiz.level && (
                                <Badge variant="outline" className="text-xs">
                                  {quiz.level}
                                </Badge>
                              )}
                              {quiz.questions && (
                                <span className="text-xs text-gray-500">
                                  {Array.isArray(quiz.questions) ? quiz.questions.length : quiz.questionsCount || 0}{" "}
                                  questions
                                </span>
                              )}
                            </div>
                          </div>
                          {selectedQuiz?._id === quiz._id && (
                            <div className="ml-2">
                              <Check className="h-6 w-6 text-blue-600" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button
                      onClick={() => {
                        if (selectedQuiz) {
                          setView("create")
                        } else {
                          alert("Please select a quiz first")
                        }
                      }}
                      disabled={!selectedQuiz}
                    >
                      Continue to Room Setup →
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Create Room View
  if (view === "create") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
        <div className="max-w-2xl mx-auto">
          <Button variant="outline" onClick={() => setView("selectQuiz")} className="mb-6">
            ← Back to Quiz Selection
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Create New Race Room</CardTitle>
              <CardDescription>Set up your race and wait for players to join</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedQuiz && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">Selected Quiz:</p>
                  <p className="text-lg font-semibold text-blue-700">
                    {selectedQuiz.title || `Quiz ${selectedQuiz._id.slice(-6)}`}
                  </p>
                  {selectedQuiz.description && <p className="text-sm text-blue-600 mt-1">{selectedQuiz.description}</p>}
                </div>
              )}

              <form onSubmit={handleCreateRoom} className="space-y-6">
                <div>
                  <Label htmlFor="roomName">Room Name</Label>
                  <Input
                    id="roomName"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="My Awesome Race"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="level">Level</Label>
                  <select
                    id="level"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    {LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="maxPlayers">Max Players: {maxPlayers}</Label>
                  <input
                    id="maxPlayers"
                    type="range"
                    min="2"
                    max="10"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(Number.parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>2</span>
                    <span>10</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="questionsCount">Questions: {questionsCount}</Label>
                  <input
                    id="questionsCount"
                    type="range"
                    min="5"
                    max="20"
                    value={questionsCount}
                    onChange={(e) => setQuestionsCount(Number.parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>5</span>
                    <span>20</span>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Creating..." : "Create Room"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Lobby View
  if (view === "lobby") {
    const filteredRooms = rooms
      .filter((room) => room.status === "waiting")
      .filter((room) => selectedLevel === "all" || room.level === selectedLevel)

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Button onClick={handleNavigateToCreate} className="flex-1" size="lg">
              <Zap className="mr-2 h-5 w-5" />
              Create Room
            </Button>

            <Button className="flex-1" onClick={() => setView("join")} size="lg" variant="outline">
              <Target className="mr-2 h-5 w-5" />
              Join by Code
            </Button>

            <Button className="flex-1" onClick={() => setView("playVsComputer")} size="lg" variant="ghost">
              <Trophy className="mr-2 h-5 w-5" />
              Play vs Computer
            </Button>
          </div>

          {/* Level Filter */}
          <div className="mb-6">
            <Label className="mb-2 block text-lg font-semibold">Filter by Level</Label>
            <div className="flex gap-2 flex-wrap">
              <Badge
                variant={selectedLevel === "all" ? "default" : "outline"}
                className="cursor-pointer text-base px-4 py-2"
                onClick={() => setSelectedLevel("all")}
              >
                All Levels
              </Badge>
              {LEVELS.map((lvl) => (
                <Badge
                  key={lvl}
                  variant={selectedLevel === lvl ? "default" : "outline"}
                  className="cursor-pointer text-base px-4 py-2"
                  onClick={() => setSelectedLevel(lvl)}
                >
                  {lvl}
                </Badge>
              ))}
            </div>
          </div>

          {/* Online Rooms - 4 boxes per row */}
          <div>
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
              <Zap className="w-8 h-8 text-yellow-500" />
              Online Rooms
            </h2>

            {filteredRooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredRooms.map((room) => (
                  <Card
                    key={room._id}
                    className="hover:shadow-xl transition-all hover:scale-105 border-2 border-gray-200"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <Badge className="bg-gradient-to-r from-blue-500 to-purple-500">{room.level}</Badge>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          {room.players?.length || 0}/{room.maxPlayers}
                        </div>
                      </div>
                      <CardTitle className="text-lg line-clamp-2">{room.roomName}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        {room.questionsCount} questions
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4 text-blue-500" />
                        {QUESTION_TIME}s per question
                      </div>
                      <div className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                        Code: {room.roomId}
                      </div>
                      <Button onClick={() => handleJoinRoom(room)} disabled={loading} className="w-full" size="sm">
                        Join Room
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="py-16">
                <CardContent>
                  <div className="text-center">
                    <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600 text-lg">No rooms available at the moment.</p>
                    <p className="text-gray-400 mb-4">Create one to get started!</p>
                    <Button onClick={handleNavigateToCreate}>Create Room</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Room View
  if (view === "room" && currentRoom) {
    const currentPlayer = gameState?.players?.find((p) => p.userId === user?._id)
    const isReady = currentPlayer?.isReady
    const allPlayersReady = gameState?.players?.every((p) => p.isReady) && (gameState?.players?.length || 0) >= 1
    const currentQuestion = gameState?.currentQuestion

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">{currentRoom.roomName}</h1>
              <p className="text-gray-600">Level: {currentRoom.level}</p>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-sm font-mono bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                  Room Code: {currentRoom.roomId}
                </p>
                <Button variant="outline" size="sm" onClick={copyRoomCode} className="h-8 w-8 p-0 bg-transparent">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <Button variant="outline" onClick={handleLeaveRoom}>
              Leave Room
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Game Area */}
            <div className="lg:col-span-2">
              {gameState?.status === "waiting" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Waiting for Players</CardTitle>
                    <CardDescription>
                      {gameState.players?.length} / {currentRoom.maxPlayers} players
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {gameState.players?.map((player, idx) => (
                          <Badge key={idx} variant={player.isReady ? "default" : "outline"}>
                            {player.username} {player.isReady && "✓"}
                          </Badge>
                        ))}
                      </div>

                      {!isReady ? (
                        <Button onClick={handleReady} className="w-full">
                          Ready Up!
                        </Button>
                      ) : (
                        <div className="text-center">
                          <p className="text-green-600 font-semibold mb-2">You are ready!</p>
                          {allPlayersReady ? (
                            <p className="text-gray-600">Game starting soon...</p>
                          ) : (
                            <p className="text-gray-600">Waiting for other players...</p>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {gameState?.status === "playing" && currentQuestion && (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>
                        Question {(gameState.currentQuestionIndex || 0) + 1} / {currentRoom.questionsCount}
                      </CardTitle>
                      <Badge variant={timeLeft > 5 ? "default" : "destructive"}>
                        <Clock className="w-4 h-4 mr-1" />
                        {timeLeft}s
                      </Badge>
                    </div>
                    <Progress value={(timeLeft / QUESTION_TIME) * 100} className="mt-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold mb-2">{currentQuestion.question}</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {currentQuestion.options?.map((option, idx) => (
                        <Button
                          key={idx}
                          variant={selectedAnswer === option ? "default" : "outline"}
                          onClick={() => handleAnswerSelect(option)}
                          disabled={selectedAnswer !== null}
                          className="h-24 text-lg font-semibold"
                        >
                          {option}
                        </Button>
                      ))}
                    </div>

                    {selectedAnswer && (
                      <div className="mt-4 text-center text-green-600 font-semibold">
                        Answer submitted! Waiting for others...
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {gameState?.status === "finished" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-6 h-6 text-yellow-500" />
                      Game Finished!
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {gameState.players
                        ?.sort((a, b) => b.score - a.score)
                        .map((player, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center justify-between p-4 rounded-lg ${
                              idx === 0 ? "bg-yellow-100" : "bg-gray-100"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {idx === 0 && <Crown className="w-5 h-5 text-yellow-500" />}
                              <span className="font-bold text-lg">{idx + 1}.</span>
                              <span className="font-semibold">{player.username}</span>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">{player.score} points</p>
                              <p className="text-sm text-gray-600">
                                {player.correctAnswers} / {currentRoom.questionsCount} correct
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>

                    <Button onClick={() => setView("lobby")} className="w-full mt-6">
                      Back to Lobby
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Leaderboard Sidebar */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Leaderboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {gameState?.players
                      ?.sort((a, b) => b.score - a.score)
                      .map((player, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded bg-gray-50">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{idx + 1}.</span>
                            <span className="text-sm">{player.username}</span>
                          </div>
                          <span className="font-bold text-blue-600">{player.score}</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
