import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, Animated, Dimensions, FlatList,
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { SectionHeader } from "../../components/Headers";
import { sentenceService, userService } from "../../services/api";
import { useLanguage } from "../../context/LanguageContext";
import { getSectionTexts } from "../../utils/sectionTexts";
import { F } from "../../styles/fonts";

const { width } = Dimensions.get("window");
const CARD_W     = (width - 16 * 2 - 10) / 2;
const LEVELS     = ["A1", "A2", "B1", "B2", "C1", "C2"];
const FREE_LIMIT = 5;

const LEVEL_COLORS = {
  A1: { bg: "#ecfdf5", border: "#6ee7b7", text: "#065f46" },
  A2: { bg: "#eff6ff", border: "#93c5fd", text: "#1e40af" },
  B1: { bg: "#f5f3ff", border: "#c4b5fd", text: "#4c1d95" },
  B2: { bg: "#fffbeb", border: "#fcd34d", text: "#92400e" },
  C1: { bg: "#fff1f2", border: "#fda4af", text: "#9f1239" },
  C2: { bg: "#eef2ff", border: "#a5b4fc", text: "#312e81" },
};

// ── XP float animation ────────────────────────────────────────────────────────
function XpPop({ xp, visible }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!visible) return;
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 1800, useNativeDriver: true }).start();
  }, [visible]);
  if (!visible) return null;
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -90] });
  const opacity    = anim.interpolate({ inputRange: [0, 0.55, 1], outputRange: [1, 1, 0] });
  const scale      = anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [1, 1.25, 1.25] });
  return (
    <Animated.View pointerEvents="none" style={[s.xpFloat, { opacity, transform: [{ translateY }, { scale }] }]}>
      <Ionicons name="star" size={20} color="#f59e0b" />
      <Text style={s.xpFloatText}>+{xp} XP</Text>
    </Animated.View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function SentenceScreen() {
  const { language } = useLanguage();
  const [selectedLevel, setSelectedLevel] = useState("A1");
  const [activeQuiz, setActiveQuiz]       = useState(null);
  const [isPaid, setIsPaid]               = useState(false);
  const toastAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    userService.getProfile().then((res) => {
      const u = res.data?.user || res.data || res;
      setIsPaid(u?.isPaid === true);
    }).catch(() => {});
  }, []);

  function showToast() {
    toastAnim.setValue(0);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1400),
      Animated.timing(toastAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start();
  }

  if (activeQuiz) {
    return (
      <SentenceQuiz
        quizId={activeQuiz.id}
        quizTitle={activeQuiz.title}
        onBack={() => setActiveQuiz(null)}
      />
    );
  }

  return (
    <View style={s.root}>
      <FlatList
        data={[]}
        renderItem={null}
        keyExtractor={() => ""}
        ListHeaderComponent={
          <SectionHeader
            gradientColors={["#7c2d12", "#c2410c", "#ea580c"]}
            {...getSectionTexts("sentences", language)}
            selectedLevel={selectedLevel}
            onLevelChange={setSelectedLevel}
          />
        }
        ListFooterComponent={
          <SentenceList
            level={selectedLevel}
            language={language}
            isPaid={isPaid}
            onSelectQuiz={(id, title) => setActiveQuiz({ id, title })}
            onLockedPress={showToast}
          />
        }
      />

      <Animated.View
        pointerEvents="none"
        style={[s.toast, {
          opacity: toastAnim,
          transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
        }]}
      >
        <Text style={s.toastText}>Duhet të paguash për të aksesuar më shumë</Text>
      </Animated.View>
    </View>
  );
}

// ── Sentence list ─────────────────────────────────────────────────────────────
function SentenceList({ level, language, isPaid, onSelectQuiz, onLockedPress }) {
  const [quizzes,     setQuizzes]     = useState([]);
  const [finishedIds, setFinishedIds] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [error,       setError]       = useState(null);

  useEffect(() => {
    sentenceService.getFinishedSentences().then((res) => {
      const arr = res.data || [];
      setFinishedIds(arr.map((s) => s._id || s.id));
    }).catch(() => {});
  }, []);

  useEffect(() => { loadQuizzes(); }, [level, language]);

  async function loadQuizzes(isRefresh = false) {
    if (!isRefresh) setLoading(true);
    try {
      const res  = await sentenceService.getSentencesByLevel(level, language);
      const data = res.data || {};
      const arr  = data.sentences || data;
      setQuizzes(Array.isArray(arr) ? arr : []);
      setError(null);
    } catch {
      setError("Nuk mund të ngarkohen kuizet");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function handlePress(quiz) {
    const isFinished = finishedIds.includes(quiz._id || quiz.id);
    if (!isPaid && !isFinished && finishedIds.length >= FREE_LIMIT) {
      onLimitReached?.();
      return;
    }
    onSelectQuiz(quiz._id || quiz.id, quiz.title);
  }

  if (loading) return (
    <View style={{ padding: 48, alignItems: "center" }}>
      <ActivityIndicator color="#7c3aed" size="large" />
    </View>
  );

  if (error) return (
    <View style={{ padding: 32, alignItems: "center" }}>
      <Text style={{ color: "#ef4444", textAlign: "center", fontFamily: F.semi }}>{error}</Text>
      <TouchableOpacity style={s.retryBtn} onPress={() => loadQuizzes()}>
        <Text style={s.retryBtnText}>Provo Përsëri</Text>
      </TouchableOpacity>
    </View>
  );

  if (quizzes.length === 0) return (
    <View style={{ padding: 48, alignItems: "center", gap: 12 }}>
      <View style={s.emptyIcon}>
        <Ionicons name="create-outline" size={32} color="#94a3b8" />
      </View>
      <Text style={s.emptyText}>Asnjë kuiz nuk është i disponueshëm</Text>
    </View>
  );

  return (
    <View style={s.grid}>
      {quizzes.map((quiz, index) => {
        const qId        = quiz._id || quiz.id;
        const isFinished = finishedIds.includes(qId) || quiz.isCompleted;
        const locked     = !isPaid && !isFinished && index >= FREE_LIMIT;
        const lc         = LEVEL_COLORS[quiz.level] || LEVEL_COLORS.A1;

        return (
          <TouchableOpacity
            key={qId}
            onPress={() => locked ? onLockedPress?.() : handlePress(quiz)}
            activeOpacity={0.82}
            style={[s.quizCard, locked && s.quizCardLocked, isFinished && s.quizCardDone]}
          >
            {/* Level badge — top right */}
            <View style={[s.lvlBadge, { backgroundColor: lc.bg, borderColor: lc.border }]}>
              <Text style={[s.lvlBadgeText, { color: lc.text }]}>{quiz.level}</Text>
            </View>

            {/* Lock badge — top left */}
            {locked && (
              <View style={s.lockWrap}>
                <Ionicons name="lock-closed" size={13} color="#94a3b8" />
              </View>
            )}

            <Text
              style={[s.cardTitle, locked && { color: "#94a3b8" }]}
              numberOfLines={2}
            >
              {quiz.title}
            </Text>
            <Text style={[s.cardMeta, locked && { color: "#cbd5e1" }]}>
              {quiz.questions?.length || 0} pyetje
            </Text>

            <View style={[s.cardDivider, locked && { borderColor: "#e2e8f0" }]} />

            <View style={s.cardFooter}>
              {!locked && quiz.xp ? (
                <View style={s.xpBadge}>
                  <Ionicons name="star" size={8} color="#ea580c" />
                  <Text style={s.xpBadgeText}>{quiz.xp}</Text>
                </View>
              ) : <View />}
              <View style={[s.statusBadge, locked && s.statusBadgeLocked, isFinished && s.statusBadgeDone]}>
                <Text style={[s.statusBadgeText, locked && { color: "#94a3b8" }]}>
                  {locked ? "Premium" : isFinished ? "Kryer" : "Fillo"}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Sentence quiz (Duolingo-style) ────────────────────────────────────────────
function SentenceQuiz({ quizId, quizTitle, onBack }) {
  const [quiz,           setQuiz]          = useState(null);
  const [idx,            setIdx]           = useState(0);
  const [selectedWords,  setSelectedWords] = useState([]);
  const [availableWords, setAvailable]     = useState([]);
  const [answers,        setAnswers]       = useState([]);
  const [loading,        setLoading]       = useState(true);
  const [submitting,     setSubmitting]    = useState(false);
  const [results,        setResults]       = useState(null);
  const [error,          setError]         = useState(null);
  const [showXp,         setShowXp]        = useState(false);
  const [xpGained,       setXpGained]      = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    sentenceService.getSentenceById(quizId).then((res) => {
      const data = res.data?.data || res.data || res;
      setQuiz(data);
      if (data.questions?.length > 0) {
        setAvailable([...data.questions[0].options].sort(() => Math.random() - 0.5));
      }
    }).catch((e) => {
      setError(e.response?.data?.message || "Dështoi ngarkimi i kuizit");
    }).finally(() => setLoading(false));
  }, [quizId]);

  const totalQ  = quiz?.questions?.length || 0;
  const current = quiz?.questions?.[idx];

  useEffect(() => {
    if (!totalQ) return;
    Animated.timing(progressAnim, {
      toValue: ((idx + 1) / totalQ) * 100,
      duration: 350, useNativeDriver: false,
    }).start();
  }, [idx, totalQ]);

  function pickWord(word, wordIdx) {
    setSelectedWords((p) => [...p, word]);
    setAvailable((p) => p.filter((_, i) => i !== wordIdx));
  }

  function removeWord(word, wordIdx) {
    setAvailable((p) => [...p, word]);
    setSelectedWords((p) => p.filter((_, i) => i !== wordIdx));
  }

  async function checkAnswer() {
    const userAnswer = selectedWords.join(" ");
    const newAnswers = [...answers, userAnswer];
    setAnswers(newAnswers);

    if (idx < totalQ - 1) {
      const next = idx + 1;
      setIdx(next);
      setSelectedWords([]);
      setAvailable([...quiz.questions[next].options].sort(() => Math.random() - 0.5));
    } else {
      await submit(newAnswers);
    }
  }

  async function submit(finalAnswers) {
    try {
      setSubmitting(true);
      const res  = await sentenceService.submitSentence(quizId, finalAnswers);
      const data = res.data?.data || res.data || res;
      setResults(data);
      if (data.passed && data.xpAwarded > 0) {
        setXpGained(data.xpAwarded);
        setShowXp(true);
        setTimeout(() => setShowXp(false), 2200);
      }
    } catch (e) {
      Alert.alert("Gabim", e.response?.data?.message || "Dështoi dërgimi");
    } finally {
      setSubmitting(false);
    }
  }

  function retry() {
    setIdx(0);
    setSelectedWords([]);
    setAvailable([...quiz.questions[0].options].sort(() => Math.random() - 0.5));
    setAnswers([]);
    setResults(null);
    setError(null);
    progressAnim.setValue(0);
  }

  const progressWidth = progressAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });
  const disabled = selectedWords.length === 0 || submitting;

  // ── Loading ──
  if (loading) return (
    <View style={[q.root, { alignItems: "center", justifyContent: "center" }]}>
      <ActivityIndicator color="#58cc02" size="large" />
    </View>
  );

  // ── Error ──
  if (error) return (
    <SafeAreaView style={[q.root, { padding: 24, alignItems: "center", justifyContent: "center", gap: 16 }]}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#fee2e2", alignItems: "center", justifyContent: "center" }}>
        <Ionicons name="alert-circle-outline" size={32} color="#ef4444" />
      </View>
      <Text style={{ color: "#ef4444", textAlign: "center", fontFamily: F.semi, fontSize: 14 }}>{error}</Text>
      <TouchableOpacity onPress={onBack} style={q.backPill}>
        <Ionicons name="arrow-back" size={16} color="#64748b" />
        <Text style={q.backPillTxt}>Kthehu</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

  // ── Results ──
  if (results) {
    const correct   = results.correctCount || 0;
    const incorrect = totalQ - correct;
    const passed    = results.passed;

    return (
      <SafeAreaView style={q.root}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>

          {/* Hero result */}
          <View style={[q.resultHero, passed ? q.resultHeroPass : q.resultHeroFail]}>
            <View style={[q.resultIconCircle, { backgroundColor: passed ? "#d1fae5" : "#fee2e2" }]}>
              <Ionicons name={passed ? "trophy" : "refresh-circle"} size={40} color={passed ? "#10b981" : "#ef4444"} />
            </View>
            <Text style={[q.resultHeroTitle, { color: passed ? "#065f46" : "#991b1b" }]}>
              {passed ? "Shkëlqyeshëm!" : "Vazhdo të Praktikosh!"}
            </Text>
            {results.message ? <Text style={q.resultHeroSub}>{results.message}</Text> : null}
          </View>

          {/* Stats row */}
          <View style={q.statsRow}>
            {[
              { icon: "checkmark-circle", color: "#10b981", bg: "#f0fdf4", border: "#a7f3d0", value: correct,                    label: "Saktë" },
              { icon: "close-circle",     color: "#ef4444", bg: "#fff1f2", border: "#fecdd3", value: incorrect,                  label: "Gabim" },
              { icon: "analytics",        color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe", value: `${results.accuracy || 0}%`,label: "Saktësia" },
              { icon: "star",             color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", value: `+${results.xpAwarded||0}`, label: "XP" },
            ].map((st) => (
              <View key={st.label} style={[q.statCard, { backgroundColor: st.bg, borderColor: st.border }]}>
                <Ionicons name={st.icon} size={18} color={st.color} style={{ marginBottom: 4 }} />
                <Text style={[q.statVal, { color: st.color }]}>{st.value}</Text>
                <Text style={q.statLbl}>{st.label}</Text>
              </View>
            ))}
          </View>

          {/* Detail cards */}
          <Text style={q.detailTitle}>Rezultatet e Detajuara</Text>
          {results.results?.map((r, i) => (
            <View key={i} style={[q.detailCard, r.isCorrect ? q.detailOk : q.detailErr]}>
              <View style={[q.detailBadge, { backgroundColor: r.isCorrect ? "#d1fae5" : "#fee2e2" }]}>
                <Ionicons name={r.isCorrect ? "checkmark" : "close"} size={13} color={r.isCorrect ? "#10b981" : "#ef4444"} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={q.detailQ}>Pyetja {i + 1}</Text>
                <Text style={q.detailQuestion}>{r.question}</Text>
                <Text style={q.detailAnswer}>
                  <Text style={{ color: "#94a3b8" }}>Përgjigja: </Text>
                  <Text style={{ color: r.isCorrect ? "#065f46" : "#dc2626", fontFamily: F.bold }}>
                    {r.userAnswer || "(bosh)"}
                  </Text>
                </Text>
                {!r.isCorrect && (
                  <Text style={q.detailAnswer}>
                    <Text style={{ color: "#94a3b8" }}>E saktë: </Text>
                    <Text style={{ color: "#065f46", fontFamily: F.bold }}>{r.correctAnswer}</Text>
                  </Text>
                )}
              </View>
            </View>
          ))}

          {/* Buttons */}
          <View style={{ gap: 10, marginTop: 20 }}>
            <TouchableOpacity onPress={retry} activeOpacity={0.85} style={q.retryBtn}>
              <Ionicons name="refresh" size={16} color="#fff" />
              <Text style={q.retryBtnTxt}>Provo Përsëri</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onBack} activeOpacity={0.85} style={q.backBtn}>
              <Ionicons name="arrow-back" size={16} color="#64748b" />
              <Text style={q.backBtnTxt}>Kthehu te Kuizet</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        <XpPop xp={xpGained} visible={showXp} />
      </SafeAreaView>
    );
  }

  // ── Active quiz (Duolingo layout) ──
  return (
    <SafeAreaView style={q.root}>

      {/* ── Progress bar ── */}
      <View style={q.topBar}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={26} color="#afafaf" />
        </TouchableOpacity>
        <View style={q.progressTrack}>
          <Animated.View style={[q.progressFill, { width: progressWidth }]} />
        </View>
        <View style={q.xpChip}>
          <Ionicons name="flash" size={13} color="#ff9600" />
          <Text style={q.xpChipTxt}>{quiz?.xp || 10}</Text>
        </View>
      </View>

      {/* ── Content area ── */}
      <View style={q.content}>

        {/* Exercise type label */}
        <View style={q.exerciseLabel}>
          <Ionicons name="create-outline" size={14} color="#a855f7" />
          <Text style={q.exerciseLabelTxt}>FJALI · {quiz?.level}</Text>
        </View>

        {/* Instruction */}
        <Text style={q.instruction}>Përkthe këtë fjali</Text>

        {/* Question row: icon + speech bubble */}
        <View style={q.questionRow}>
          <View style={q.charCircle}>
            <Ionicons name="language" size={30} color="#1cb0f6" />
          </View>
          <View style={q.speechBubble}>
            <Text style={q.speechText}>{current?.question}</Text>
          </View>
        </View>

        {/* Answer drop zone */}
        <View style={q.answerZone}>
          {selectedWords.length === 0 ? (
            <Text style={q.answerPlaceholder}>Zgjidh fjalët më poshtë…</Text>
          ) : (
            <View style={q.wordRow}>
              {selectedWords.map((word, i) => (
                <TouchableOpacity
                  key={`sel-${i}`}
                  onPress={() => removeWord(word, i)}
                  activeOpacity={0.72}
                  style={q.selectedTile}
                >
                  <Text style={q.selectedTileText}>{word}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        <View style={q.answerDivider} />
      </View>

      {/* ── Fixed bottom: word bank + CHECK ── */}
      <View style={q.bottomSection}>
        <View style={q.wordBank}>
          {availableWords.map((word, i) => (
            <TouchableOpacity
              key={`bank-${i}`}
              onPress={() => pickWord(word, i)}
              activeOpacity={0.72}
              style={q.bankTile}
            >
              <Text style={q.bankTileText}>{word}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[q.checkBtn, disabled && q.checkBtnOff]}
          onPress={checkAnswer}
          disabled={disabled}
          activeOpacity={0.88}
        >
          <Text style={[q.checkBtnTxt, disabled && q.checkBtnTxtOff]}>
            {submitting ? "Duke dërguar…" : idx === totalQ - 1 ? "PËRFUNDO" : "KONTROLLO"}
          </Text>
        </TouchableOpacity>
      </View>

      <XpPop xp={xpGained} visible={showXp} />
    </SafeAreaView>
  );
}

// ── List screen styles ────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8f5f0" },

  toast: {
    position: "absolute", bottom: 48, alignSelf: "center", zIndex: 99,
    backgroundColor: "#1e293b", borderRadius: 20,
    paddingHorizontal: 20, paddingVertical: 11,
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10, elevation: 8,
  },
  toastText: { color: "#fff", fontSize: 13, fontFamily: F.semi },

  limitRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginHorizontal: 16, marginTop: 10,
    backgroundColor: "#f5f3ff", borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: "#ddd6fe",
  },
  limitText: { fontSize: 12, color: "#6d28d9", fontFamily: F.semi },

  emptyIcon: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#e2e8f0",
    alignItems: "center", justifyContent: "center",
  },
  emptyText: { color: "#94a3b8", fontSize: 14, fontFamily: F.semi, textAlign: "center" },

  retryBtn: { marginTop: 16, backgroundColor: "#7c3aed", borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  retryBtnText: { color: "#fff", fontFamily: F.bold, fontSize: 14 },

  grid: {
    flexDirection: "row", flexWrap: "wrap", gap: 10,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40,
  },
  quizCard: {
    width: CARD_W, backgroundColor: "#fff",
    borderRadius: 18, borderWidth: 1, borderColor: "#ede9e0",
    borderBottomWidth: 4, borderBottomColor: "#ddd8d2",
    padding: 12,
    shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
  quizCardLocked: { backgroundColor: "#f8fafc", borderColor: "#e2e8f0", borderBottomColor: "#cbd5e1" },
  quizCardDone:   { backgroundColor: "#fffbeb", borderColor: "#fcd34d", borderBottomColor: "#f59e0b" },

  lvlBadge: {
    position: "absolute", top: 10, right: 10,
    borderRadius: 6, borderWidth: 1,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  lvlBadgeText: { fontSize: 9, fontFamily: F.xbold },

  lockWrap: {
    position: "absolute", top: 10, left: 10,
    width: 22, height: 22, borderRadius: 6,
    backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#e2e8f0",
    alignItems: "center", justifyContent: "center",
  },

  cardTitle:   { fontSize: 13, fontFamily: F.bold, color: "#1e293b", marginTop: 28, marginBottom: 4, lineHeight: 18 },
  cardMeta:    { fontSize: 11, color: "#94a3b8", fontFamily: F.semi, marginBottom: 8 },
  cardDivider: { borderTopWidth: 1, borderTopColor: "#f1f5f9", marginBottom: 8 },
  cardFooter:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  xpBadge:    { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#fff7ed", borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2, borderWidth: 1, borderColor: "#fed7aa" },
  xpBadgeText:{ fontSize: 9, fontFamily: F.bold, color: "#ea580c" },

  statusBadge:      { backgroundColor: "#f97316", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  statusBadgeLocked:{ backgroundColor: "#e2e8f0" },
  statusBadgeDone:  { backgroundColor: "#10b981" },
  statusBadgeText:  { fontSize: 9, fontFamily: F.bold, color: "#fff" },

  toast: {
    position: "absolute", bottom: 50, alignSelf: "center", zIndex: 99,
    backgroundColor: "#1e293b", borderRadius: 20,
    paddingHorizontal: 18, paddingVertical: 10,
  },
  toastText: { color: "#fff", fontSize: 13, fontFamily: F.semi },

  xpFloat:     { position: "absolute", alignSelf: "center", top: "38%", flexDirection: "row", alignItems: "center", gap: 8 },
  xpFloatText: { fontSize: 38, fontFamily: F.black, color: "#f59e0b" },
});

// ── Quiz styles (Duolingo layout) ─────────────────────────────────────────────
const q = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },

  // ── Top progress bar
  topBar: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14,
  },
  progressTrack: {
    flex: 1, height: 16, backgroundColor: "#e5e5e5", borderRadius: 8, overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#58cc02", borderRadius: 8 },
  xpChip: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "#fff9f0", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1.5, borderColor: "#ffd280",
  },
  xpChipTxt: { fontSize: 13, fontFamily: F.bold, color: "#ff9600" },

  // ── Content
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },

  exerciseLabel: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  exerciseLabelTxt: { fontSize: 11, fontFamily: F.xbold, color: "#a855f7", letterSpacing: 1 },

  instruction: { fontSize: 22, fontFamily: F.black, color: "#1e293b", marginBottom: 22 },

  questionRow: { flexDirection: "row", alignItems: "flex-start", gap: 14, marginBottom: 28 },
  charCircle: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: "#e0f7ff",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#bae6fd",
    shadowColor: "#1cb0f6", shadowOpacity: 0.15, shadowRadius: 8, elevation: 3,
  },
  speechBubble: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    borderRadius: 16, borderWidth: 1.5, borderColor: "#e5e5e5",
    padding: 14, minHeight: 60,
    justifyContent: "center",
  },
  speechText: { fontSize: 17, fontFamily: F.bold, color: "#1e293b", lineHeight: 25 },

  // ── Answer zone
  answerZone: {
    minHeight: 72, paddingVertical: 12,
    justifyContent: "flex-start",
  },
  answerPlaceholder: { color: "#d1d5db", fontSize: 14, fontFamily: F.semi },
  wordRow:           { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  selectedTile: {
    backgroundColor: "#ddf4ff",
    borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1.5, borderColor: "#7dd3fc",
    borderBottomWidth: 3, borderBottomColor: "#38bdf8",
  },
  selectedTileText: { fontSize: 15, fontFamily: F.bold, color: "#0284c7" },

  answerDivider: { height: 2, backgroundColor: "#e5e5e5", marginTop: 4 },

  // ── Bottom section
  bottomSection: {
    paddingHorizontal: 20, paddingBottom: 24, paddingTop: 16,
    borderTopWidth: 1, borderTopColor: "#f1f5f9",
    backgroundColor: "#fff",
  },
  wordBank: {
    flexDirection: "row", flexWrap: "wrap",
    gap: 8, justifyContent: "center",
    marginBottom: 20, minHeight: 50,
  },
  bankTile: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 11,
    borderWidth: 1.5, borderColor: "#e5e5e5",
    borderBottomWidth: 3, borderBottomColor: "#c7c7c7",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  bankTileText: { fontSize: 15, fontFamily: F.bold, color: "#374151" },

  // CHECK button
  checkBtn: {
    backgroundColor: "#58cc02",
    borderRadius: 16, paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 4, borderBottomColor: "#46a302",
  },
  checkBtnOff: { backgroundColor: "#f0f0f0", borderBottomColor: "#d8d8d8" },
  checkBtnTxt: { fontSize: 16, fontFamily: F.black, color: "#fff", letterSpacing: 0.5 },
  checkBtnTxtOff: { color: "#afafaf" },

  // Back pill
  backPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#f1f5f9", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, borderColor: "#e2e8f0",
  },
  backPillTxt: { fontSize: 13, fontFamily: F.semi, color: "#64748b" },

  // ── Results
  resultHero: {
    borderRadius: 24, padding: 28,
    alignItems: "center", gap: 10,
    marginBottom: 16, borderWidth: 1,
  },
  resultHeroPass: { backgroundColor: "#f0fdf4", borderColor: "#a7f3d0" },
  resultHeroFail: { backgroundColor: "#fff1f2", borderColor: "#fecdd3" },
  resultIconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  resultHeroTitle: { fontSize: 22, fontFamily: F.black },
  resultHeroSub:   { fontSize: 13, fontFamily: F.regular, color: "#64748b", textAlign: "center" },

  statsRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 12, alignItems: "center", gap: 2 },
  statVal:  { fontSize: 18, fontFamily: F.black },
  statLbl:  { fontSize: 10, fontFamily: F.semi, color: "#94a3b8" },

  detailTitle: { fontSize: 15, fontFamily: F.bold, color: "#1e293b", marginBottom: 10 },
  detailCard:  { flexDirection: "row", borderRadius: 14, borderWidth: 1.5, padding: 14, marginBottom: 10, gap: 10 },
  detailOk:    { backgroundColor: "#f0fdf4", borderColor: "#a7f3d0" },
  detailErr:   { backgroundColor: "#fff1f2", borderColor: "#fecdd3" },
  detailBadge: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", marginTop: 2 },
  detailQ:       { fontSize: 10, color: "#94a3b8", fontFamily: F.semi, marginBottom: 3 },
  detailQuestion:{ fontSize: 13, fontFamily: F.bold, color: "#1e293b", marginBottom: 4 },
  detailAnswer:  { fontSize: 12, fontFamily: F.regular, marginBottom: 2 },

  retryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#58cc02", borderRadius: 16, paddingVertical: 14, borderBottomWidth: 3, borderBottomColor: "#46a302" },
  retryBtnTxt: { color: "#fff", fontFamily: F.black, fontSize: 15 },
  backBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#f1f5f9", borderRadius: 16, paddingVertical: 14, borderWidth: 1, borderColor: "#e2e8f0" },
  backBtnTxt: { fontSize: 15, fontFamily: F.bold, color: "#64748b" },
});
