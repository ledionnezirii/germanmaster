import { useEffect, useRef, useState, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, Animated, Easing, Keyboard,
  KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { getChallengeSocket, disconnectChallengeSocket } from "../../services/challengeSocket";
import { useAuth } from "../../context/AuthContext";
import { F } from "../../styles/fonts";

const QUESTION_TIME = 15; // seconds per question

export default function ChallengeGameScreen({ navigation, route }) {
  const { user } = useAuth();
  const insets   = useSafeAreaInsets();
  const { roomId, questions = [], users = [], gameType } = route.params || {};

  const isQuiz     = gameType === "quiz";
  const isWordRace = gameType === "wordRace";
  const myUsername = user?.emri || user?.username || "";
  const opponent   = users.find(u => u.username !== myUsername) || users[0] || {};

  // ── Game state
  const [phase,          setPhase]          = useState("game"); // game | result
  const [qIdx,           setQIdx]           = useState(0);
  const [selected,       setSelected]       = useState(null);   // quiz: index
  const [typed,          setTyped]          = useState("");      // wordRace
  const [answered,       setAnswered]       = useState(false);
  const [timeLeft,       setTimeLeft]       = useState(QUESTION_TIME);
  const [myScore,        setMyScore]        = useState(0);
  const [oppScore,       setOppScore]       = useState(0);
  const [myCorrect,      setMyCorrect]      = useState(0);
  const [oppCorrect,     setOppCorrect]     = useState(0);
  const [opponentDone,   setOpponentDone]   = useState(false);
  const [result,         setResult]         = useState(null);
  const [feedback,       setFeedback]       = useState(null); // "correct" | "wrong"
  const [opponentLeft,   setOpponentLeft]   = useState(false);

  const timerRef    = useRef(null);
  const timerAnim   = useRef(new Animated.Value(1)).current;
  const shakeAnim   = useRef(new Animated.Value(0)).current;
  const resultScale = useRef(new Animated.Value(0.8)).current;
  const inputRef    = useRef(null);

  const socket = getChallengeSocket();
  const q = questions[qIdx];

  // ── Socket events
  useEffect(() => {
    if (!socket) return;

    socket.on("answerSubmitted", (data) => {
      if (data.userId === user?.id || data.username === myUsername) {
        setMyScore(data.score ?? 0);
      } else {
        setOppScore(data.score ?? 0);
      }
    });

    socket.on("playerFinished", (data) => {
      if (data.username !== myUsername) {
        setOpponentDone(true);
        if (isQuiz) setOppScore(data.score ?? 0);
        if (isWordRace) setOppCorrect(data.correctWords ?? 0);
      }
    });

    socket.on("playerProgressUpdate", (data) => {
      if (data.username !== myUsername) {
        setOppCorrect(data.correctWords ?? 0);
      }
    });

    socket.on("quizResult", (data) => showResult(data));
    socket.on("wordRaceResult", (data) => showResult(data));

    socket.on("opponentLeft", (data) => {
      setOpponentLeft(true);
      setOpponentDone(true);
    });

    return () => {
      socket.off("answerSubmitted");
      socket.off("playerFinished");
      socket.off("playerProgressUpdate");
      socket.off("quizResult");
      socket.off("wordRaceResult");
      socket.off("opponentLeft");
    };
  }, [socket, myUsername, qIdx]);

  function showResult(data) {
    clearTimer();
    setResult(data);
    setPhase("result");
    Animated.spring(resultScale, { toValue: 1, friction: 6, useNativeDriver: true }).start();
  }

  // Fallback: if server never sends result after last question, end game after 10s
  useEffect(() => {
    if (phase !== "game") return;
    if (qIdx + 1 < questions.length) return;
    if (!answered) return;
    const timeout = setTimeout(() => {
      setPhase("result");
      setResult({ message: "Loja përfundoi.", users: [], winner: null });
    }, 10000);
    return () => clearTimeout(timeout);
  }, [qIdx, phase, answered, questions.length]);

  // ── Timer
  useEffect(() => {
    if (phase !== "game" || answered) return;
    startTimer();
    return () => clearTimer();
  }, [qIdx, phase, answered]);

  function startTimer() {
    clearTimer();
    setTimeLeft(QUESTION_TIME);
    timerAnim.setValue(1);
    Animated.timing(timerAnim, {
      toValue: 0,
      duration: QUESTION_TIME * 1000,
      useNativeDriver: false,
      easing: Easing.linear,
    }).start();
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearTimer(); handleTimeUp(); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  function clearTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    timerAnim.stopAnimation();
  }

  function handleTimeUp() {
    if (answered) return;
    setAnswered(true);
    setFeedback("wrong");
    submitAnswer(null);
    setTimeout(advanceQuestion, 1200);
  }

  // ── Answer submission
  function handleSelectOption(optionText, idx) {
    if (answered) return;
    clearTimer();
    setSelected(idx);
    setAnswered(true);
    const isCorrect = idx === q?.correctAnswer || optionText === q?.correctAnswer;
    setFeedback(isCorrect ? "correct" : "wrong");
    if (isCorrect) setMyCorrect(p => p + 1);
    else {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 8,  duration: 55, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 4,  duration: 55, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0,  duration: 55, useNativeDriver: true }),
      ]).start();
    }
    submitAnswer(optionText);
    setTimeout(advanceQuestion, 1400);
  }

  function handleWordSubmit() {
    if (answered || !typed.trim()) return;
    Keyboard.dismiss();
    clearTimer();
    setAnswered(true);
    const correct = typed.trim().toLowerCase() === q?.word?.toLowerCase();
    setFeedback(correct ? "correct" : "wrong");
    if (correct) setMyCorrect(p => p + 1);
    socket?.emit("submitAnswer", { roomId, questionId: q.id, typedWord: typed.trim(), timeSpent: (QUESTION_TIME - timeLeft) * 1000 });
    setTimeout(advanceQuestion, 1400);
  }

  function submitAnswer(answer) {
    socket?.emit("submitAnswer", { roomId, questionId: q.id, answer, timeSpent: (QUESTION_TIME - timeLeft) * 1000 });
  }

  function advanceQuestion() {
    const isLast = qIdx + 1 >= questions.length;
    setSelected(null);
    setTyped("");
    setFeedback(null);
    if (isLast) {
      // Keep answered=true so the question stays locked while we wait for server result
      return;
    }
    setAnswered(false);
    setQIdx(p => p + 1);
  }

  // ── Leave game
  function leaveGame() {
    socket?.emit("leaveChallenge");
    disconnectChallengeSocket();
    navigation.goBack();
  }

  function playAgain() {
    disconnectChallengeSocket();
    navigation.goBack();
  }

  // ── Timer color (derived from state — Animated color interpolation unsupported in bare workflow)
  function getTimerColor(t) {
    if (t > 10) return "#10b981";
    if (t > 5)  return "#f59e0b";
    if (t > 2)  return "#f97316";
    return "#ef4444";
  }

  // ── Result screen
  if (phase === "result" && result) {
    const me  = result.users?.find(u => u.username === myUsername);
    const opp = result.users?.find(u => u.username !== myUsername);
    const iWon = me?.isWinner;
    const tied = !result.winner;

    return (
      <View style={[sr.root, { paddingTop: insets.top }]}>
        <Animated.View style={[sr.card, { transform: [{ scale: resultScale }] }]}>
          <Text style={sr.resultEmoji}>{tied ? "🤝" : iWon ? "🏆" : "💪"}</Text>
          <Text style={sr.resultTitle}>{tied ? "Barazim!" : iWon ? "Fituat!" : "Humbët!"}</Text>
          <Text style={sr.resultSub}>{result.message}</Text>

          {opponentLeft && (
            <View style={sr.leftPill}>
              <Text style={sr.leftTxt}>Kundërshtari doli nga loja</Text>
            </View>
          )}

          <View style={sr.scores}>
            {[me, opp].map((p, i) => p ? (
              <View key={i} style={[sr.scoreCard, p.isWinner && sr.scoreCardWinner]}>
                <Text style={sr.scoreName} numberOfLines={1}>{p.username}</Text>
                {isQuiz && <Text style={sr.scoreVal}>{p.score ?? 0}<Text style={sr.scoreUnit}>/{questions.length}</Text></Text>}
                {isWordRace && <Text style={sr.scoreVal}>{p.correctWords ?? 0}<Text style={sr.scoreUnit}> fjalë</Text></Text>}
                <View style={sr.xpPill}>
                  <Ionicons name="flash" size={10} color="#f59e0b" />
                  <Text style={sr.xpTxt}>+{p.xp ?? 0} XP</Text>
                </View>
                {p.isWinner && <Ionicons name="trophy" size={16} color="#f59e0b" style={{ marginTop: 6 }} />}
              </View>
            ) : null)}
          </View>

          <TouchableOpacity style={sr.playAgainBtn} onPress={playAgain} activeOpacity={0.85}>
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={sr.playAgainTxt}>Luco Sërisht</Text>
          </TouchableOpacity>
          <TouchableOpacity style={sr.homeBtn} onPress={playAgain} activeOpacity={0.8}>
            <Text style={sr.homeTxt}>Kthehu</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  if (!q) return null;

  // ── Game screen
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[g.root, { paddingTop: insets.top }]}>

        {/* ── Header: vs bar ── */}
        <View style={g.header}>
          {/* Me */}
          <View style={g.playerCol}>
            <View style={[g.playerAvatar, g.playerAvatarMe]}>
              <Text style={g.playerInitial}>{myUsername[0]?.toUpperCase() || "M"}</Text>
            </View>
            <Text style={g.playerName} numberOfLines={1}>{myUsername}</Text>
            <Text style={g.playerScore}>{isQuiz ? myScore : myCorrect}</Text>
          </View>

          {/* VS */}
          <View style={g.vsBox}>
            <Text style={g.vsTxt}>VS</Text>
            <Text style={g.qCounter}>{qIdx + 1}/{questions.length}</Text>
          </View>

          {/* Opponent */}
          <View style={[g.playerCol, { alignItems: "flex-end" }]}>
            <View style={[g.playerAvatar, g.playerAvatarOpp, opponentDone && g.playerAvatarDone]}>
              <Text style={g.playerInitial}>{opponent.username?.[0]?.toUpperCase() || "O"}</Text>
            </View>
            <Text style={g.playerName} numberOfLines={1}>{opponent.username || "..."}</Text>
            <Text style={g.playerScore}>{isQuiz ? oppScore : oppCorrect}</Text>
          </View>
        </View>

        {/* ── Timer bar ── */}
        <View style={g.timerTrack}>
          <Animated.View style={[g.timerFill, { width: timerAnim.interpolate({ inputRange: [0,1], outputRange: ["0%","100%"] }), backgroundColor: getTimerColor(timeLeft)}]} />
        </View>
        <Text style={g.timerTxt}>{timeLeft}s</Text>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>

          {/* ── Question card ── */}
          <Animated.View style={[g.questionCard, { transform: [{ translateX: shakeAnim }] }]}>
            {isWordRace && (
              <View style={g.categoryPill}>
                <Text style={g.categoryTxt}>{q.category || "Fjalë"}</Text>
              </View>
            )}
            <Text style={g.questionTxt}>
              {isQuiz ? q.question : q.translation}
            </Text>
            {isWordRace && (
              <Text style={g.questionHint}>Shkruaj fjalën gjermane</Text>
            )}
            {feedback && (
              <View style={[g.feedbackBadge, feedback === "correct" ? g.feedbackCorrect : g.feedbackWrong]}>
                <Ionicons name={feedback === "correct" ? "checkmark-circle" : "close-circle"} size={14} color="#fff" />
                <Text style={g.feedbackTxt}>{feedback === "correct" ? "Saktë!" : isWordRace ? `Saktë: ${q.word}` : "Gabim!"}</Text>
              </View>
            )}
          </Animated.View>

          {/* ── Quiz options ── */}
          {isQuiz && q.options?.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrect  = (answered && (i === q.correctAnswer || opt === q.correctAnswer));
            const isWrong    = answered && isSelected && !isCorrect;
            return (
              <TouchableOpacity
                key={i}
                style={[g.option, isCorrect && g.optionCorrect, isWrong && g.optionWrong, isSelected && !answered && g.optionSelected]}
                onPress={() => handleSelectOption(opt, i)}
                disabled={answered}
                activeOpacity={0.8}
              >
                <View style={[g.optionLetter, isCorrect && g.optionLetterCorrect, isWrong && g.optionLetterWrong]}>
                  <Text style={[g.optionLetterTxt, (isCorrect || isWrong) && { color: "#fff" }]}>{["A","B","C","D"][i]}</Text>
                </View>
                <Text style={[g.optionTxt, isCorrect && { color: "#047857", fontFamily: F.bold }, isWrong && { color: "#b91c1c", fontFamily: F.bold }]} numberOfLines={2}>{opt}</Text>
                {isCorrect && <Ionicons name="checkmark-circle" size={18} color="#10b981" />}
                {isWrong   && <Ionicons name="close-circle"     size={18} color="#ef4444" />}
              </TouchableOpacity>
            );
          })}

          {/* ── Word Race input ── */}
          {isWordRace && (
            <View style={g.wordInputWrap}>
              <TextInput
                ref={inputRef}
                style={[g.wordInput, feedback === "correct" && g.wordInputCorrect, feedback === "wrong" && g.wordInputWrong]}
                value={typed}
                onChangeText={setTyped}
                placeholder="Shkruaj këtu..."
                placeholderTextColor="#a8a29e"
                autoCapitalize="none"
                editable={!answered}
                returnKeyType="done"
                onSubmitEditing={handleWordSubmit}
                autoFocus
              />
              <TouchableOpacity
                style={[g.wordSubmitBtn, (!typed.trim() || answered) && g.wordSubmitBtnDisabled]}
                onPress={handleWordSubmit}
                disabled={!typed.trim() || answered}
                activeOpacity={0.85}
              >
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* ── Leave button ── */}
          <TouchableOpacity style={g.leaveBtn} onPress={leaveGame} activeOpacity={0.8}>
            <Text style={g.leaveTxt}>Braktis lojën</Text>
          </TouchableOpacity>

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Result styles
const sr = StyleSheet.create({
  root:            { flex: 1, backgroundColor: "#0f172a", alignItems: "center", justifyContent: "center", padding: 20 },
  card:            { backgroundColor: "#fffdf8", borderRadius: 28, padding: 28, width: "100%", alignItems: "center", borderBottomWidth: 5, borderBottomColor: "#e2ddd6", shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 12 },
  resultEmoji:     { fontSize: 56, marginBottom: 8 },
  resultTitle:     { fontFamily: F.black, fontSize: 28, color: "#0f172a", marginBottom: 4 },
  resultSub:       { fontFamily: F.regular, fontSize: 13, color: "#a8a29e", textAlign: "center", marginBottom: 20 },
  leftPill:        { backgroundColor: "#fff7ed", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: "#fed7aa", marginBottom: 16 },
  leftTxt:         { fontFamily: F.semi, fontSize: 12, color: "#f97316" },
  scores:          { flexDirection: "row", gap: 12, marginBottom: 24, width: "100%" },
  scoreCard:       { flex: 1, backgroundColor: "#f8f5f0", borderRadius: 18, padding: 16, alignItems: "center", borderWidth: 1.5, borderColor: "#ede9e0", borderBottomWidth: 4, borderBottomColor: "#e2ddd6" },
  scoreCardWinner: { backgroundColor: "#fffbeb", borderColor: "#fde68a", borderBottomColor: "#f59e0b" },
  scoreName:       { fontFamily: F.bold, fontSize: 12, color: "#78716c", marginBottom: 6 },
  scoreVal:        { fontFamily: F.black, fontSize: 26, color: "#0f172a" },
  scoreUnit:       { fontFamily: F.semi, fontSize: 12, color: "#a8a29e" },
  xpPill:          { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#fffbeb", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4, borderWidth: 1, borderColor: "#fde68a" },
  xpTxt:           { fontFamily: F.bold, fontSize: 11, color: "#b45309" },
  playAgainBtn:    { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#0f172a", borderRadius: 16, paddingVertical: 14, paddingHorizontal: 32, width: "100%", justifyContent: "center", marginBottom: 10, borderBottomWidth: 4, borderBottomColor: "#020617" },
  playAgainTxt:    { fontFamily: F.black, fontSize: 15, color: "#fff" },
  homeBtn:         { paddingVertical: 12 },
  homeTxt:         { fontFamily: F.bold, fontSize: 14, color: "#a8a29e" },
});

// ── Game styles
const g = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8f5f0" },

  // Header
  header:            { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, backgroundColor: "#fffdf8", borderBottomWidth: 1, borderBottomColor: "#ede9e0" },
  playerCol:         { flex: 1, alignItems: "flex-start" },
  playerAvatar:      { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center", marginBottom: 4, borderWidth: 2 },
  playerAvatarMe:    { backgroundColor: "#d1fae5", borderColor: "#6ee7b7" },
  playerAvatarOpp:   { backgroundColor: "#dbeafe", borderColor: "#93c5fd" },
  playerAvatarDone:  { backgroundColor: "#fef3c7", borderColor: "#fde68a" },
  playerInitial:     { fontFamily: F.black, fontSize: 18, color: "#0f172a" },
  playerName:        { fontFamily: F.bold, fontSize: 11, color: "#78716c", maxWidth: 90 },
  playerScore:       { fontFamily: F.black, fontSize: 22, color: "#0f172a", marginTop: 2 },
  vsBox:             { alignItems: "center", paddingHorizontal: 12 },
  vsTxt:             { fontFamily: F.black, fontSize: 13, color: "#a8a29e", letterSpacing: 2 },
  qCounter:          { fontFamily: F.bold, fontSize: 11, color: "#b45309", marginTop: 2 },

  // Timer
  timerTrack: { height: 6, backgroundColor: "#f1ede4" },
  timerFill:  { height: "100%", borderRadius: 0 },
  timerTxt:   { fontFamily: F.black, fontSize: 11, color: "#78716c", textAlign: "right", paddingRight: 14, paddingTop: 3, paddingBottom: 6 },

  // Question card
  questionCard:  { backgroundColor: "#fffdf8", borderRadius: 20, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: "#ede9e0", borderBottomWidth: 4, borderBottomColor: "#e2ddd6", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3, marginTop: 8 },
  categoryPill:  { backgroundColor: "#f1ede4", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start", marginBottom: 10, borderWidth: 1, borderColor: "#e5e0d5" },
  categoryTxt:   { fontFamily: F.semi, fontSize: 10, color: "#a8a29e", letterSpacing: 0.5 },
  questionTxt:   { fontFamily: F.black, fontSize: 18, color: "#0f172a", lineHeight: 26 },
  questionHint:  { fontFamily: F.regular, fontSize: 12, color: "#a8a29e", marginTop: 6 },
  feedbackBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, alignSelf: "flex-start" },
  feedbackCorrect: { backgroundColor: "#10b981" },
  feedbackWrong:   { backgroundColor: "#ef4444" },
  feedbackTxt:   { fontFamily: F.bold, fontSize: 12, color: "#fff" },

  // Quiz options
  option:             { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fffdf8", borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: "#ede9e0", borderBottomWidth: 3, borderBottomColor: "#e2ddd6", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  optionSelected:     { borderColor: "#6366f1", backgroundColor: "#eef2ff", borderBottomColor: "#818cf8" },
  optionCorrect:      { borderColor: "#a7f3d0", backgroundColor: "#ecfdf5", borderBottomColor: "#34d399" },
  optionWrong:        { borderColor: "#fecaca", backgroundColor: "#fff1f2", borderBottomColor: "#f87171" },
  optionLetter:       { width: 32, height: 32, borderRadius: 10, backgroundColor: "#f1ede4", borderWidth: 1, borderColor: "#e5e0d5", alignItems: "center", justifyContent: "center" },
  optionLetterCorrect:{ backgroundColor: "#10b981", borderColor: "#10b981" },
  optionLetterWrong:  { backgroundColor: "#ef4444", borderColor: "#ef4444" },
  optionLetterTxt:    { fontFamily: F.black, fontSize: 13, color: "#78716c" },
  optionTxt:          { flex: 1, fontFamily: F.semi, fontSize: 14, color: "#0f172a" },

  // Word race
  wordInputWrap:        { flexDirection: "row", gap: 10, marginBottom: 14 },
  wordInput:            { flex: 1, backgroundColor: "#fffdf8", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontFamily: F.bold, fontSize: 16, color: "#0f172a", borderWidth: 1.5, borderColor: "#ede9e0", borderBottomWidth: 3, borderBottomColor: "#e2ddd6" },
  wordInputCorrect:     { borderColor: "#a7f3d0", backgroundColor: "#ecfdf5", borderBottomColor: "#34d399" },
  wordInputWrong:       { borderColor: "#fecaca", backgroundColor: "#fff1f2", borderBottomColor: "#f87171" },
  wordSubmitBtn:        { width: 52, borderRadius: 16, backgroundColor: "#0f172a", alignItems: "center", justifyContent: "center", borderBottomWidth: 3, borderBottomColor: "#020617" },
  wordSubmitBtnDisabled:{ backgroundColor: "#e5e0d5", borderBottomColor: "#d6d0c7" },

  // Leave
  leaveBtn: { alignItems: "center", paddingVertical: 16, marginTop: 8 },
  leaveTxt: { fontFamily: F.semi, fontSize: 13, color: "#cbd5e1" },
});
