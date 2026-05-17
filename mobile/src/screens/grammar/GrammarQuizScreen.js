import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Animated, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { grammarAppService } from "../../services/api";
import { F } from "../../styles/fonts";

const TYPE_META = {
  articles:         { label: "Artikujt",          icon: "text-outline",                color: "#6366f1", grad: ["#4f46e5", "#7c3aed"] },
  nouns:            { label: "Emrat",              icon: "book-outline",                color: "#f59e0b", grad: ["#d97706", "#f97316"] },
  verbs:            { label: "Foljet",             icon: "flash-outline",               color: "#10b981", grad: ["#059669", "#14b8a6"] },
  adjectives:       { label: "Mbiemrat",           icon: "color-palette-outline",       color: "#ec4899", grad: ["#db2777", "#f472b6"] },
  adverbs:          { label: "Ndajfoljet",         icon: "arrow-forward-outline",       color: "#8b5cf6", grad: ["#7c3aed", "#a78bfa"] },
  prepositions:     { label: "Parafjalët",         icon: "link-outline",                color: "#14b8a6", grad: ["#0d9488", "#14b8a6"] },
  conjunctions:     { label: "Lidhëzat",           icon: "git-merge-outline",           color: "#f97316", grad: ["#ea580c", "#f97316"] },
  modal_verbs:      { label: "Foljet Modale",      icon: "settings-outline",            color: "#0ea5e9", grad: ["#0284c7", "#0ea5e9"] },
  simple_past:      { label: "E Shkuara",          icon: "time-outline",                color: "#ef4444", grad: ["#dc2626", "#ef4444"] },
  present_perfect:  { label: "Perfekti",           icon: "checkmark-done-outline",      color: "#22c55e", grad: ["#16a34a", "#22c55e"] },
  past_perfect:     { label: "Pluskvamperfekti",   icon: "return-down-back-outline",    color: "#64748b", grad: ["#475569", "#64748b"] },
  future:           { label: "E Ardhmja",          icon: "rocket-outline",              color: "#7c3aed", grad: ["#6d28d9", "#8b5cf6"] },
  imperative:       { label: "Urdhërorja",         icon: "megaphone-outline",           color: "#dc2626", grad: ["#b91c1c", "#ef4444"] },
  passive:          { label: "Pësori",             icon: "swap-horizontal-outline",     color: "#059669", grad: ["#047857", "#059669"] },
  cases:            { label: "Rasat",              icon: "layers-outline",              color: "#0891b2", grad: ["#0369a1", "#0891b2"] },
  word_order:       { label: "Rendi i Fjalëve",    icon: "reorder-three-outline",       color: "#d97706", grad: ["#b45309", "#d97706"] },
  relative_clauses: { label: "Fjali Relative",     icon: "git-branch-outline",          color: "#7c3aed", grad: ["#6d28d9", "#7c3aed"] },
  conditional:      { label: "Kushtorja",          icon: "help-circle-outline",         color: "#be185d", grad: ["#9d174d", "#be185d"] },
  comparative:      { label: "Krahasorja",         icon: "bar-chart-outline",           color: "#0369a1", grad: ["#075985", "#0369a1"] },
  numbers:          { label: "Numrat",             icon: "calculator-outline",          color: "#4338ca", grad: ["#3730a3", "#4f46e5"] },
  pronouns:         { label: "Përemrat",           icon: "person-outline",              color: "#b45309", grad: ["#92400e", "#b45309"] },
  other:            { label: "Të Tjera",           icon: "ellipsis-horizontal-outline", color: "#6b7280", grad: ["#4b5563", "#6b7280"] },
};

const LETTERS = ["A", "B", "C", "D"];

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function XpBurst({ visible, xp }) {
  const scale   = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0.5);
    opacity.setValue(0);
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale,   { toValue: 1.15, stiffness: 260, damping: 16, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]),
      Animated.spring(scale, { toValue: 1, stiffness: 260, damping: 16, useNativeDriver: true }),
      Animated.delay(500),
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [visible]);

  if (!visible) return null;
  return (
    <Animated.View pointerEvents="none" style={[s.xpFloat, { opacity, transform: [{ scale }] }]}>
      <LinearGradient colors={["#0f172a", "#1e293b"]} style={s.xpPill}>
        <Text style={s.xpNum}>+{xp}</Text>
        <Text style={s.xpLbl}>XP</Text>
      </LinearGradient>
    </Animated.View>
  );
}

export default function GrammarQuizScreen({ route, navigation }) {
  const { itemId, itemTitle, type, setNum } = route.params;
  const meta = TYPE_META[type] || TYPE_META.other;

  const [loading,    setLoading]    = useState(true);
  const [questions,  setQuestions]  = useState([]);   // remaining unanswered
  const [totalInSet, setTotalInSet] = useState(0);    // all exercises in this box
  const [alreadyDone,setAlreadyDone]= useState(0);    // done before this session
  const [idx,        setIdx]        = useState(0);
  const [selected,   setSelected]   = useState(null);
  const [score,      setScore]      = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [done,       setDone]       = useState(false);
  const [showXp,     setShowXp]     = useState(false);
  const [animXp,     setAnimXp]     = useState(0);

  const fadeAnim     = useRef(new Animated.Value(1)).current;
  const slideAnim    = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res       = await grammarAppService.getById(itemId);
      const item      = res.data;
      const exercises = item.exercises || [];
      setTotalInSet(exercises.length);

      const raw     = await AsyncStorage.getItem(`gq_done_${itemId}`);
      const doneIds = new Set(raw ? JSON.parse(raw) : []);
      setAlreadyDone(doneIds.size);

      const remaining = exercises.filter((ex) => !doneIds.has(String(ex._id)));

      if (remaining.length === 0) {
        setDone(true);
      } else {
        setQuestions(shuffle(remaining));
        progressAnim.setValue(0);
      }
    } catch {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!questions.length) return;
    Animated.timing(progressAnim, {
      toValue: idx / questions.length,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [idx, questions.length]);

  async function handleAnswer(opt) {
    if (selected !== null) return;
    setSelected(opt);
    const current = questions[idx];
    const correct = current.correctAnswer;

    // Persist this question as answered (regardless of correct/wrong)
    const raw     = await AsyncStorage.getItem(`gq_done_${itemId}`);
    const doneIds = raw ? JSON.parse(raw) : [];
    const qId     = String(current._id);
    if (!doneIds.includes(qId)) {
      doneIds.push(qId);
      await AsyncStorage.setItem(`gq_done_${itemId}`, JSON.stringify(doneIds));
    }

    if (opt === correct) {
      setScore((sc) => sc + 1);
      setAnimXp(5);
      setShowXp(true);
      setTimeout(() => setShowXp(false), 1200);
    } else {
      setWrongCount((w) => w + 1);
    }
  }

  function nextQuestion() {
    if (idx + 1 >= questions.length) {
      Animated.timing(progressAnim, { toValue: 1, duration: 300, useNativeDriver: false }).start();
      setDone(true);
      return;
    }
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -30, duration: 160, useNativeDriver: true }),
      ]),
    ]).start(() => {
      setIdx((i) => i + 1);
      setSelected(null);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  }

  async function resetAndRestart() {
    await AsyncStorage.removeItem(`gq_done_${itemId}`);
    setIdx(0);
    setSelected(null);
    setScore(0);
    setWrongCount(0);
    setDone(false);
    progressAnim.setValue(0);
    fadeAnim.setValue(1);
    slideAnim.setValue(0);
    load();
  }

  // ── Header row (shared) ──────────────────────────────────────────────────────
  const HeaderBar = ({ showClose = false }) => (
    <LinearGradient colors={meta.grad} style={s.quizTopBar}>
      <SafeAreaView edges={["top"]}>
        <View style={s.quizTopRow}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name={showClose ? "close" : "arrow-back"} size={18} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.heroTitle}>{meta.label} · Set {setNum}</Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );

  // ── LOADING ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={s.root}>
        <HeaderBar />
        <View style={s.center}>
          <ActivityIndicator color={meta.color} size="large" />
        </View>
      </View>
    );
  }

  // ── ALL DONE (set complete) ──────────────────────────────────────────────────
  if (done) {
    const sessionAnswered = questions.length; // how many were shown this session
    const pct   = sessionAnswered > 0 ? Math.round((score / sessionAnswered) * 100) : 100;
    const stars = wrongCount === 0 ? 3 : wrongCount <= Math.ceil(sessionAnswered * 0.3) ? 2 : 1;
    const totalXp = score * 5;
    const isFullyComplete = alreadyDone + sessionAnswered >= totalInSet;

    return (
      <View style={s.root}>
        <View style={s.heroOnlyBar}>
          <LinearGradient colors={meta.grad} style={s.heroBg}>
            <SafeAreaView edges={["top"]}>
              <View style={s.quizTopRow}>
                <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                  <Ionicons name="arrow-back" size={18} color="#fff" />
                </TouchableOpacity>
                <Text style={s.heroTitle}>{meta.label} · Set {setNum}</Text>
              </View>
            </SafeAreaView>
          </LinearGradient>
        </View>

        <ScrollView contentContainerStyle={s.doneContent}>
          <LinearGradient
            colors={meta.grad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.doneHero}
          >
            <Ionicons
              name={isFullyComplete ? "trophy" : "checkmark-circle"}
              size={56}
              color="#fff"
              style={{ marginBottom: 10, opacity: 0.95 }}
            />
            <Text style={s.doneTitle}>
              {isFullyComplete
                ? "Seti Kompletuar! 🎉"
                : sessionAnswered === 0
                ? "Tashmë të gjitha janë bërë!"
                : pct === 100
                ? "Perfekt! 🎉"
                : pct >= 70
                ? "Shumë Mirë! 🌟"
                : "Vazhdo të Praktikosh!"}
            </Text>
            <Text style={s.doneSub}>
              {sessionAnswered === 0
                ? `Të gjitha ${totalInSet} pyetjet u përgjigjen tashmë`
                : isFullyComplete
                ? `Të gjitha ${totalInSet} pyetjet u përfunduan`
                : `${alreadyDone + sessionAnswered}/${totalInSet} pyetje të bëra gjithsej`}
            </Text>

            {sessionAnswered > 0 && (
              <View style={s.starsRow}>
                {[1, 2, 3].map((n) => (
                  <Text key={n} style={{ fontSize: 32, opacity: n <= stars ? 1 : 0.2 }}>⭐</Text>
                ))}
              </View>
            )}
          </LinearGradient>

          {sessionAnswered > 0 && (
            <View style={s.statsRow}>
              {[
                { label: "Saktë",     value: `${score}/${sessionAnswered}`, color: "#10b981", bg: "#f0fdf4", border: "#a7f3d0" },
                { label: "Saktësi",  value: `${pct}%`,                     color: "#6366f1", bg: "#eef2ff", border: "#c7d2fe" },
                { label: "XP Fituar",value: `+${totalXp}`,                 color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
              ].map((st) => (
                <View key={st.label} style={[s.statBox, { backgroundColor: st.bg, borderColor: st.border }]}>
                  <Text style={[s.statVal, { color: st.color }]}>{st.value}</Text>
                  <Text style={s.statLbl}>{st.label}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={s.doneBtns}>
            <TouchableOpacity style={s.doneExitBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={15} color="#64748b" />
              <Text style={s.doneExitText}>Kthehu</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={resetAndRestart} style={{ flex: 2 }} activeOpacity={0.82}>
              <LinearGradient
                colors={meta.grad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.doneRetryBtn}
              >
                <Ionicons name="refresh" size={15} color="#fff" />
                <Text style={s.doneRetryText}>Rifillo Setin</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── ACTIVE QUIZ ──────────────────────────────────────────────────────────────
  const current  = questions[idx];
  const answered = selected !== null;
  const isRight  = selected === current.correctAnswer;

  const progressWidth = progressAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ["0%", "100%"],
  });

  // How many remain globally (already done + current session idx)
  const globalDone    = alreadyDone + idx;
  const globalRemain  = totalInSet - globalDone;

  return (
    <View style={s.root}>
      {/* ── Quiz top bar ── */}
      <LinearGradient colors={meta.grad} style={s.quizTopBar}>
        <SafeAreaView edges={["top"]}>
          <View style={s.quizTopRow}>
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>

            {/* Progress bar */}
            <View style={s.progressTrack}>
              <Animated.View
                style={[
                  s.progressFill,
                  { width: progressWidth, backgroundColor: "rgba(255,255,255,0.9)" },
                ]}
              />
            </View>

            <View style={s.counterBox}>
              <Text style={s.counterText}>{idx + 1}</Text>
              <Text style={s.counterSep}>/</Text>
              <Text style={s.counterTotal}>{questions.length}</Text>
            </View>
          </View>

          {/* Score chips + global progress */}
          <View style={s.scoreRow}>
            <View style={s.scoreChip}>
              <Ionicons name="checkmark-circle" size={13} color="#34d399" />
              <Text style={s.scoreChipText}>{score}</Text>
            </View>
            <View style={[s.scoreChip, { borderColor: "rgba(239,68,68,0.4)" }]}>
              <Ionicons name="close-circle" size={13} color="#f87171" />
              <Text style={s.scoreChipText}>{wrongCount}</Text>
            </View>
            <View style={[s.scoreChip, { borderColor: "rgba(255,255,255,0.2)", marginLeft: "auto" }]}>
              <Ionicons name="layers-outline" size={12} color="rgba(255,255,255,0.7)" />
              <Text style={[s.scoreChipText, { color: "rgba(255,255,255,0.8)", fontSize: 11 }]}>
                {globalRemain} mbetur
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={s.quizContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Set label */}
          <View style={s.topicLabel}>
            <Ionicons name={meta.icon} size={12} color={meta.color} />
            <Text style={[s.topicLabelText, { color: meta.color }]}>
              Set {setNum} · {itemTitle}
            </Text>
          </View>

          {/* Question card */}
          <View style={s.questionCard}>
            <Text style={s.questionText}>{current.question}</Text>
          </View>

          {/* Options */}
          <View style={s.optionsWrap}>
            {(current.options || []).map((opt, oi) => {
              const isCorrect = opt === current.correctAnswer;
              const isSel     = selected === opt;

              let bg = "#fff", border = "#e2e8f0", textCol = "#1e293b";
              let letterBg = "#f1f5f9", letterCol = "#64748b";

              if (answered && isCorrect) {
                bg = "#f0fdf4"; border = "#22c55e"; textCol = "#15803d";
                letterBg = "#dcfce7"; letterCol = "#16a34a";
              } else if (answered && isSel && !isCorrect) {
                bg = "#fff1f2"; border = "#ef4444"; textCol = "#dc2626";
                letterBg = "#fee2e2"; letterCol = "#dc2626";
              } else if (answered) {
                textCol = "#cbd5e1"; letterCol = "#e2e8f0";
              }

              return (
                <TouchableOpacity
                  key={oi}
                  disabled={answered}
                  onPress={() => handleAnswer(opt)}
                  style={[s.optionBtn, { backgroundColor: bg, borderColor: border }]}
                  activeOpacity={0.78}
                >
                  <View style={[s.optionLetter, { backgroundColor: letterBg }]}>
                    <Text style={[s.optionLetterText, { color: letterCol }]}>{LETTERS[oi]}</Text>
                  </View>
                  <Text style={[s.optionText, { color: textCol }]}>{opt}</Text>
                  {answered && isCorrect && (
                    <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                  )}
                  {answered && isSel && !isCorrect && (
                    <Ionicons name="close-circle" size={20} color="#ef4444" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Feedback */}
          {answered && (
            <View style={[s.feedbackBox, isRight ? s.feedbackRight : s.feedbackWrong]}>
              <Ionicons
                name={isRight ? "checkmark-circle" : "close-circle"}
                size={18}
                color={isRight ? "#059669" : "#dc2626"}
              />
              <View style={{ flex: 1 }}>
                <Text style={[s.feedbackTitle, { color: isRight ? "#059669" : "#dc2626" }]}>
                  {isRight ? "Saktë! +5 XP" : `Gabim! Saktë: ${current.correctAnswer}`}
                </Text>
                {current.explanation ? (
                  <Text style={s.feedbackExplanation}>{current.explanation}</Text>
                ) : null}
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* ── Next button ── */}
      {answered && (
        <View style={s.nextWrap}>
          <TouchableOpacity onPress={nextQuestion} activeOpacity={0.85}>
            <LinearGradient
              colors={meta.grad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.nextBtn}
            >
              <Text style={s.nextBtnText}>
                {idx + 1 >= questions.length ? "Shiko Rezultatin" : "Pyetja Tjetër"}
              </Text>
              <Ionicons
                name={idx + 1 >= questions.length ? "trophy" : "arrow-forward"}
                size={18}
                color="#fff"
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      <XpBurst visible={showXp} xp={animXp} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#faf8ff" },

  heroOnlyBar: { overflow: "hidden" },
  heroBg:      { paddingHorizontal: 16, paddingBottom: 14 },

  quizTopBar:  { paddingHorizontal: 16, paddingBottom: 14 },
  quizTopRow:  { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  heroTitle:   { color: "#fff", fontSize: 15, fontFamily: F.black, flex: 1 },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center", justifyContent: "center",
  },

  progressTrack: { flex: 1, height: 8, backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 99, overflow: "hidden" },
  progressFill:  { height: "100%", borderRadius: 99 },
  counterBox:    { flexDirection: "row", alignItems: "baseline", gap: 2 },
  counterText:   { color: "#fff", fontSize: 16, fontFamily: F.black },
  counterSep:    { color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: F.bold },
  counterTotal:  { color: "rgba(255,255,255,0.6)", fontSize: 12, fontFamily: F.bold },

  scoreRow:      { flexDirection: "row", gap: 8, alignItems: "center" },
  scoreChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 99,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: "rgba(52,211,153,0.4)",
  },
  scoreChipText: { color: "#fff", fontSize: 13, fontFamily: F.black },

  quizContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 120 },

  topicLabel:     { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  topicLabelText: { fontSize: 11, fontFamily: F.bold, letterSpacing: 0.5 },

  questionCard: {
    backgroundColor: "#fff",
    borderRadius: 20, padding: 22, marginBottom: 20,
    borderWidth: 1.5, borderColor: "#ede9f8",
    borderBottomWidth: 5, borderBottomColor: "#ddd6fe",
    shadowColor: "#7c3aed", shadowOpacity: 0.08,
    shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  questionText: { color: "#1e293b", fontSize: 18, fontFamily: F.xbold, lineHeight: 26, textAlign: "center" },

  optionsWrap: { gap: 10, marginBottom: 16 },
  optionBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 14, borderWidth: 1.5,
    borderBottomWidth: 4, borderBottomColor: "#e2e8f0",
    paddingHorizontal: 14, paddingVertical: 14,
    shadowColor: "#000", shadowOpacity: 0.05,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  optionLetter:     { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  optionLetterText: { fontSize: 13, fontFamily: F.black },
  optionText:       { flex: 1, fontSize: 15, fontFamily: F.semi, lineHeight: 20 },

  feedbackBox:   { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 8 },
  feedbackRight: { backgroundColor: "#f0fdf4", borderColor: "#a7f3d0" },
  feedbackWrong: { backgroundColor: "#fff1f2", borderColor: "#fecaca" },
  feedbackTitle: { fontSize: 14, fontFamily: F.xbold, marginBottom: 3 },
  feedbackExplanation: { color: "#64748b", fontSize: 12, fontFamily: F.regular, lineHeight: 18 },

  nextWrap: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: "#faf8ff", borderTopWidth: 1, borderTopColor: "#ede9f8" },
  nextBtn:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 16, paddingVertical: 16 },
  nextBtnText: { color: "#fff", fontSize: 16, fontFamily: F.black },

  doneContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },
  doneHero:    { borderRadius: 24, padding: 36, alignItems: "center", marginBottom: 20 },
  doneTitle:   { color: "#fff", fontSize: 24, fontFamily: F.black, marginBottom: 6, textAlign: "center" },
  doneSub:     { color: "rgba(255,255,255,0.75)", fontSize: 13, fontFamily: F.regular, textAlign: "center" },
  starsRow:    { flexDirection: "row", gap: 8, marginTop: 14 },
  statsRow:    { flexDirection: "row", gap: 10, marginBottom: 20 },
  statBox:     { flex: 1, alignItems: "center", paddingVertical: 16, borderRadius: 16, borderWidth: 1 },
  statVal:     { fontSize: 20, fontFamily: F.black, marginBottom: 4 },
  statLbl:     { fontSize: 10, fontFamily: F.semi, color: "#94a3b8", textAlign: "center" },
  doneBtns:    { flexDirection: "row", gap: 10 },
  doneExitBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, backgroundColor: "#f1f5f9", borderRadius: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: "#e2e8f0",
  },
  doneExitText:  { color: "#64748b", fontSize: 14, fontFamily: F.bold },
  doneRetryBtn:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, paddingVertical: 14 },
  doneRetryText: { color: "#fff", fontSize: 14, fontFamily: F.black },

  center:     { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },

  xpFloat: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", zIndex: 99, pointerEvents: "none" },
  xpPill:  { alignItems: "center", borderRadius: 24, paddingHorizontal: 32, paddingVertical: 20, borderWidth: 1, borderColor: "rgba(16,185,129,0.4)", shadowColor: "#10b981", shadowOpacity: 0.4, shadowRadius: 20, elevation: 16 },
  xpNum:   { color: "#34d399", fontSize: 48, fontFamily: F.black, lineHeight: 52 },
  xpLbl:   { color: "rgba(255,255,255,0.55)", fontSize: 12, fontFamily: F.xbold, letterSpacing: 1.5 },
});
