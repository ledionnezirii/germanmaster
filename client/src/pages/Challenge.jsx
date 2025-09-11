import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { authService } from "../services/api";
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
  Zap,
  Sparkles,
  GamepadIcon,
  Crown,
  Flame,
  Timer,
  Bolt,
  Swords,
  Shield,
  Rocket,
  Award,
} from "lucide-react";

const Challenge = () => {
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(null);
  const [userXp, setUserXp] = useState(0);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState("idle");
  const [gameType, setGameType] = useState("wordRace");
  const [roomId, setRoomId] = useState("");
  const [players, setPlayers] = useState([]);
  const [message, setMessage] = useState("");
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [typedWord, setTypedWord] = useState("");
  const [timeLeft, setTimeLeft] = useState(300);
  const [results, setResults] = useState(null);
  const [playerProgress, setPlayerProgress] = useState({});
  const [waitingCount, setWaitingCount] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [userFinished, setUserFinished] = useState(false);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [isJoiningChallenge, setIsJoiningChallenge] = useState(false);

  const timerRef = useRef(null);
  const socketRef = useRef(null);
  const startTimeRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch user profile and XP
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoadingProfile(true);
        const profileResponse = await authService.getProfile();
        const xpResponse = await authService.getUserXp();
        const profileData = profileResponse.data;
        const xpData = xpResponse.data;

        const firstName = profileData.emri || profileData.firstName || "User";
        const lastName = profileData.mbiemri || profileData.lastName || "";
        const totalXp =
          xpData.xp ||
          xpData.totalXP ||
          profileData.xp ||
          profileData.totalXP ||
          0;

        setUser({
          id: profileData._id || profileData.id,
          name: `${firstName} ${lastName}`.trim(),
          firstName: firstName,
          lastName: lastName,
          email: profileData.email,
          profilePicture:
            profileData.profilePicture || profileData.profileImage || null,
        });
        setUserXp(totalXp);
      } catch (error) {
        console.error("Error fetching user data:", error);
        if (error.response?.status === 401) {
          localStorage.removeItem("authToken");
          window.location.href = "/signin";
        }
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchUserData();
  }, []);

  // Initialize socket connection
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem("authToken");
    const newSocket = io("http://192.168.1.48:5000", {
      auth: {
        token: token,
      },
      transports: ["websocket", "polling"],
    });

    setSocket(newSocket);
    socketRef.current = newSocket;

    newSocket.on("connect", () => {
      setIsConnected(true);
      console.log("Connected to server");
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
      console.log("Disconnected from server");
    });

    newSocket.on("connected", (data) => {
      console.log("Server confirmation:", data.message);
    });

    newSocket.on("waitingForOpponent", (data) => {
      setGameState("waiting");
      setRoomId(data.roomId);
      setMessage(data.message);
      setWaitingCount(data.waitingCount || 1);
      setGameType(data.gameType || "quiz");
    });

    newSocket.on("waitingUpdate", (data) => {
      setMessage(data.message);
      setWaitingCount(data.waitingCount);
    });

    newSocket.on("quizStart", handleGameStart);
    newSocket.on("wordRaceStart", handleGameStart);

    newSocket.on("playerFinished", (data) => {
      setPlayerProgress((prev) => ({
        ...prev,
        [data.username]: {
          score: data.score,
          wordsTyped: data.wordsTyped,
          correctWords: data.correctWords,
          xp: data.xp,
          time: data.time,
          finished: true,
        },
      }));
      if (data.username === user.name) {
        setUserFinished(true);
        setWaitingForOpponent(true);
        setMessage("You finished! Waiting for opponent to complete...");
      }
    });

    newSocket.on("playerProgressUpdate", (data) => {
      setPlayerProgress((prev) => ({
        ...prev,
        [data.username]: {
          ...prev[data.username],
          wordsTyped: data.wordsTyped,
          correctWords: data.correctWords,
          totalWords: data.totalWords,
        },
      }));
    });

    newSocket.on("quizResult", handleGameResult);
    newSocket.on("wordRaceResult", handleGameResult);

    newSocket.on("opponentLeft", (data) => {
      const reason = data.reason === "disconnected" ? "disconnected" : "left";
      setIsJoiningChallenge(false);
      if (data.winnerXp && data.winnerXp > 0) {
        setMessage(
          `Opponent ${reason} the game. You won automatically and gained ${data.winnerXp} XP!`,
        );
        addXpToProfile(
          data.winnerXp,
          `Challenge - Victory by opponent leaving (${data.gameType})`,
        );
      } else {
        setMessage(`Opponent ${reason} the game. You won automatically!`);
      }
      resetGameState();
    });

    newSocket.on("leftChallenge", (data) => {
      console.log("Successfully left challenge:", data.message);
      setMessage(data.message);
      setIsJoiningChallenge(false);
      resetGameState();
    });

    newSocket.on("error", (data) => {
      console.error("Socket error:", data.message);
      setMessage(`Error: ${data.message}`);
      setIsJoiningChallenge(false);
    });

    return () => {
      newSocket.close();
      clearTimer();
    };
  }, [user]);

  const handleGameStart = (data) => {
    setGameState("playing");
    setRoomId(data.roomId);
    setPlayers(data.users);
    setQuestions(data.questions);
    setMessage(data.message);
    setTimeLeft(data.timeLimit);
    setCurrentQuestionIndex(0);
    setTypedWord("");
    setWaitingCount(0);
    setUserFinished(false);
    setWaitingForOpponent(false);
    setQuestionStartTime(Date.now());
    startTimeRef.current = Date.now();
    setGameType(data.gameType);
    setPlayerProgress(
      data.users.reduce(
        (acc, p) => ({
          ...acc,
          [p.username]: {
            score: 0,
            wordsTyped: 0,
            correctWords: 0,
            xp: 0,
            finished: false,
          },
        }),
        {},
      ),
    );
    startTimer();
    if (inputRef.current) {
      inputRef.current.focus();
    }
    setIsJoiningChallenge(false);
  };

  const handleGameResult = (data) => {
    setGameState("finished");
    setResults(data);
    setMessage(data.message);
    setUserFinished(false);
    setWaitingForOpponent(false);
    clearTimer();
    const userResult = data.users.find((u) => u.username === user.name);
    if (userResult && userResult.xp > 0) {
      addXpToProfile(
        userResult.xp,
        `Challenge - ${data.gameType === "wordRace" ? `${userResult.correctWords} correct words` : `${userResult.score} correct answers`}`,
      );
    }
    setIsJoiningChallenge(false);
  };

  const addXpToProfile = async (xpAmount, reason) => {
    try {
      console.log(`Adding ${xpAmount} XP for: ${reason}`);
      await authService.addXp(xpAmount, reason);
      setUserXp((prev) => prev + xpAmount);
    } catch (error) {
      console.error("Error adding XP:", error);
    }
  };

  const startTimer = () => {
    clearTimer();
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleTimeUp = () => {
    if (
      socket &&
      roomId &&
      currentQuestionIndex < questions.length &&
      !userFinished
    ) {
      const timeSpent = questionStartTime
        ? Math.round((Date.now() - questionStartTime) / 1000)
        : 0;
      if (gameType === "wordRace") {
        socket.emit("submitAnswer", {
          roomId,
          questionId: questions[currentQuestionIndex].id,
          typedWord: typedWord,
          timeSpent,
        });
      } else {
        socket.emit("submitAnswer", {
          roomId,
          questionId: questions[currentQuestionIndex].id,
          answer: null,
          timeSpent,
        });
      }
    }
  };

  const handleJoinChallenge = () => {
    if (!user || !socket || !isConnected) {
      console.log("Cannot join challenge - missing requirements");
      return;
    }
    console.log(
      "Joining challenge with username:",
      user.name,
      "gameType:",
      gameType,
    );
    setMessage("Connecting to challenge...");
    setIsJoiningChallenge(true);
    socket.emit("joinChallenge", {
      username: user.name,
      userId: user.id,
      gameType: gameType,
    });
  };

  const handleLeaveChallenge = () => {
    if (!socket) {
      console.log("No socket connection available");
      return;
    }
    console.log(
      "Leaving challenge - current state:",
      gameState,
      "roomId:",
      roomId,
    );
    setMessage("Leaving challenge...");
    socket.emit("leaveChallenge");
  };

  const handleSubmitAnswer = () => {
    if (userFinished) return;

    const currentWord = questions[currentQuestionIndex];
    if (!currentWord) return;

    const timeSpent = questionStartTime
      ? Math.round((Date.now() - questionStartTime) / 1000)
      : 0;

    if (gameType === "wordRace") {
      if (typedWord.trim() === "") {
        alert("Please type the word!");
        return;
      }
      socket.emit("submitAnswer", {
        roomId,
        questionId: currentWord.id,
        typedWord: typedWord,
        timeSpent,
      });
    } else {
      return;
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setTypedWord("");
      setQuestionStartTime(Date.now());
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } else {
      setUserFinished(true);
      setWaitingForOpponent(true);
      setMessage("You finished! Waiting for opponent to complete...");
    }
  };

  const resetGameState = () => {
    setGameState("idle");
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setTypedWord("");
    setResults(null);
    setMessage("");
    setTimeLeft(300);
    setPlayers([]);
    setRoomId("");
    setPlayerProgress({});
    setWaitingCount(0);
    setUserFinished(false);
    setWaitingForOpponent(false);
    setQuestionStartTime(null);
    clearTimer();
    setIsJoiningChallenge(false);
  };

  const handleNewChallenge = () => {
    console.log("Starting new challenge");
    resetGameState();
  };

  const handleReturnHome = () => {
    console.log("Returning to home");
    resetGameState();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusIcon = () => {
    switch (gameState) {
      case "waiting":
        return <Loader className="animate-spin h-5 w-5" />;
      case "playing":
        return <Zap className="h-5 w-5" />;
      case "finished":
        return <Trophy className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getTimerColor = () => {
    if (timeLeft > 180) return "text-emerald-400";
    if (timeLeft > 60) return "text-amber-400";
    return "text-red-400";
  };

  const currentLevel = Math.floor(userXp / 100) + 1;

  // Loading state
  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 animate-pulse"></div>

          <div className="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 text-center shadow-2xl">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-purple-500/20 border-b-purple-500 rounded-full animate-spin animation-delay-150"></div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">
                  Loading Your Profile
                </h3>
                <p className="text-slate-400">
                  Getting ready for the challenge...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto">
          <div className="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 text-center shadow-2xl">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <Lock className="w-10 h-10 text-white" />
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-white">
                  Authentication Required
                </h2>
                <p className="text-slate-400">
                  Please sign in to join the word racing challenge
                </p>
              </div>

              <button
                onClick={() => (window.location.href = "/signin")}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign In to Play</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Rocket className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Word Race Arena
            </h1>
          </div>

          {/* User Profile Card */}
          <div className="inline-flex items-center space-x-4 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 shadow-xl">
            <div className="relative">
              {user.profilePicture ? (
                <img
                  src={
                    user.profilePicture.startsWith("http")
                      ? user.profilePicture
                      : `http://localhost:5000${user.profilePicture}`
                  }
                  alt={user.name}
                  className="w-12 h-12 rounded-full border-2 border-purple-500 object-cover shadow-lg"
                />
              ) : (
                <div className="w-12 h-12 rounded-full border-2 border-purple-500 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">
                    {user.firstName?.charAt(0) || "U"}
                    {user.lastName?.charAt(0) || ""}
                  </span>
                </div>
              )}

              {/* Connection Status */}
              <div
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-800 flex items-center justify-center ${isConnected ? "bg-emerald-500" : "bg-red-500"}`}
              >
                {isConnected ? (
                  <Wifi className="w-2 h-2 text-white" />
                ) : (
                  <WifiOff className="w-2 h-2 text-white" />
                )}
              </div>
            </div>

            <div className="text-left">
              <h3 className="text-lg font-bold text-white">
                {user.name || "Player"}
              </h3>
              <div className="flex items-center space-x-4 text-sm">
                <span className="flex items-center space-x-1 text-yellow-400">
                  <Star className="w-4 h-4" />
                  <span className="font-semibold">{userXp}</span>
                  <span>XP</span>
                </span>
                <span className="flex items-center space-x-1 text-purple-400">
                  <Crown className="w-4 h-4" />
                  <span>Level {currentLevel}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Game Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
          {/* Status Message */}
          {message && (
            <div className="bg-slate-700/50 border border-slate-600/50 rounded-xl p-4 mb-6 text-center">
              <div className="flex items-center justify-center space-x-3">
                {getStatusIcon()}
                <p className="font-semibold text-slate-300">{message}</p>
              </div>
            </div>
          )}

          {/* Idle State - Join Challenge */}
          {gameState === "idle" && (
            <div className="text-center space-y-6">
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xl">
                <Swords className="w-12 h-12 text-white" />
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-white">
                  Ready for Battle, {user.firstName || "Champion"}?
                </h3>
                <p className="text-slate-400 text-lg">
                  Challenge other players and earn XP by typing words faster
                  than lightning!
                </p>
              </div>

              <button
                onClick={handleJoinChallenge}
                disabled={
                  !isConnected || gameState !== "idle" || isJoiningChallenge
                }
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center justify-center space-x-3 text-lg"
              >
                <Play className="w-6 h-6" />
                <span>Start Word Race Challenge</span>
                <Bolt className="w-6 h-6" />
              </button>
            </div>
          )}

          {/* Waiting State */}
          {gameState === "waiting" && (
            <div className="text-center space-y-6">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto shadow-xl">
                <Timer className="w-12 h-12 text-white animate-pulse" />
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-white">
                  Finding Worthy Opponent...
                </h3>
                <div className="flex items-center justify-center space-x-2 text-slate-400">
                  <Users className="w-5 h-5" />
                  <span>
                    {waitingCount > 1
                      ? `${waitingCount} players waiting`
                      : "You're first in queue"}
                  </span>
                </div>
              </div>

              {/* Animated waiting dots */}
              <div className="flex justify-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce animation-delay-200"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce animation-delay-400"></div>
              </div>

              <div className="bg-slate-700/50 border border-slate-600/50 rounded-xl p-4">
                <div className="flex items-center space-x-2 text-blue-400 mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-semibold">Pro Tip:</span>
                </div>
                <p className="text-slate-400 text-sm">
                  Open another tab or invite a friend to join the battle!
                </p>
              </div>

              <button
                onClick={handleLeaveChallenge}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
              >
                <LogOut className="w-5 h-5" />
                <span>Leave Queue</span>
              </button>
            </div>
          )}

          {/* Playing State */}
          {gameState === "playing" && questions.length > 0 && (
            <div className="space-y-6">
              {/* Game Header */}
              <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  {!userFinished && currentQuestionIndex < questions.length && (
                    <div className="flex items-center space-x-2 text-slate-400">
                      <Target className="w-5 h-5" />
                      <span className="font-semibold">
                        Word {currentQuestionIndex + 1} of {questions.length}
                      </span>
                    </div>
                  )}
                  {userFinished && (
                    <div className="flex items-center space-x-2 text-emerald-400">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-semibold">Challenge Complete!</span>
                    </div>
                  )}
                </div>

                {!userFinished && (
                  <div
                    className={`flex items-center space-x-2 text-xl font-bold ${getTimerColor()}`}
                  >
                    <Clock className="w-6 h-6" />
                    <span>{formatTime(timeLeft)}</span>
                  </div>
                )}
              </div>

              {/* Current Word Display */}
              {!userFinished && currentQuestionIndex < questions.length && (
                <div className="text-center space-y-6">
                  <div className="bg-gradient-to-br from-slate-700/50 to-slate-600/50 border border-slate-600/50 rounded-2xl p-8">
                    <h2 className="text-4xl font-bold text-white mb-2">
                      {questions[currentQuestionIndex]?.word}
                    </h2>
                    <p className="text-slate-400 text-lg">
                      Translation:{" "}
                      {questions[currentQuestionIndex]?.translation}
                    </p>
                  </div>

                  {/* Input Field */}
                  <div className="space-y-4">
                    <input
                      ref={inputRef}
                      type="text"
                      value={typedWord}
                      onChange={(e) => setTypedWord(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSubmitAnswer()
                      }
                      placeholder="Type the word here..."
                      className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-6 py-4 text-white text-xl font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                      disabled={userFinished}
                    />

                    <button
                      onClick={handleSubmitAnswer}
                      disabled={userFinished || typedWord.trim() === ""}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2 text-lg"
                    >
                      <Zap className="w-5 h-5" />
                      <span>Submit Word</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Player Progress */}
              {Object.keys(playerProgress).length > 0 && (
                <div className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>Live Battle Stats</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(playerProgress).map(
                      ([username, progress]) => (
                        <div
                          key={username}
                          className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/30"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-semibold text-white">
                              {username}
                            </span>
                            {progress.finished && (
                              <div className="flex items-center space-x-1 text-emerald-400">
                                <Trophy className="w-4 h-4" />
                                <span className="text-sm">Finished</span>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="text-center">
                              <div className="text-yellow-400 font-bold text-lg">
                                {progress.correctWords || 0}
                              </div>
                              <div className="text-slate-400">Correct</div>
                            </div>
                            <div className="text-center">
                              <div className="text-blue-400 font-bold text-lg">
                                {progress.wordsTyped || 0}
                              </div>
                              <div className="text-slate-400">Total</div>
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

              {/* Leave Challenge Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleLeaveChallenge}
                  className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-400 hover:text-red-300 font-semibold py-2 px-6 rounded-lg transition-all duration-300 flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Leave Challenge</span>
                </button>
              </div>
            </div>
          )}

          {/* Results State */}
          {gameState === "finished" && results && (
            <div className="text-center space-y-6">
              <div className="w-24 h-24 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto shadow-xl">
                <Award className="w-12 h-12 text-white" />
              </div>

              <div className="space-y-3">
                <h3 className="text-3xl font-bold text-white">
                  Battle Complete!
                </h3>
                <p className="text-slate-400 text-lg">{results.message}</p>
              </div>

              {/* Results Table */}
              <div className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-6">
                <h4 className="text-xl font-bold text-white mb-4">
                  Final Results
                </h4>

                <div className="space-y-3">
                  {results.users.map((result, index) => (
                    <div
                      key={index}
                      className={`bg-slate-800/50 rounded-lg p-4 border ${result.isWinner ? "border-yellow-500/50 bg-yellow-500/10" : "border-slate-600/30"}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {result.isWinner && (
                            <Crown className="w-5 h-5 text-yellow-400" />
                          )}
                          <span className="font-semibold text-white">
                            {result.username}
                          </span>
                        </div>

                        <div className="flex items-center space-x-4 text-sm">
                          <div className="text-center">
                            <div className="text-yellow-400 font-bold">
                              {result.correctWords}
                            </div>
                            <div className="text-slate-400">Correct</div>
                          </div>
                          <div className="text-center">
                            <div className="text-green-400 font-bold">
                              +{result.xp}
                            </div>
                            <div className="text-slate-400">XP</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleNewChallenge}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>New Challenge</span>
                </button>

                <button
                  onClick={handleReturnHome}
                  className="flex-1 bg-slate-600/50 hover:bg-slate-600/70 border border-slate-500/50 text-slate-300 hover:text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <Home className="w-5 h-5" />
                  <span>Home</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Challenge;
