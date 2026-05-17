import { useEffect, useState, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Animated, Dimensions, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { dailyChallengeService } from "../../services/api";
import { useLanguage } from "../../context/LanguageContext";

const { width } = Dimensions.get("window");

const TYPE_COLORS = {
  createword:    ["#6366f1", "#4f46e5"],
  wordaudio:     ["#0ea5e9", "#0284c7"],
  phrase:        ["#f97316", "#ea580c"],
  pronunciation: ["#8b5cf6", "#7c3aed"],
  sentence:      ["#10b981", "#059669"],
};
const TYPE_LABELS = {
  createword:    "Krijet Fjalë",
  wordaudio:     "Audio Fjalësh",
  phrase:        "Fraza",
  pronunciation: "Shqiptim",
  sentence:      "Fjali",
};

export default function DailyChallengeScreen({ navigation }) {
  const { language } = useLanguage();
  const [questions,   setQuestions]   = useState([]);
  const [current,     setCurrent]     = useState(0);
  const [selected,    setSelected]    = useState(null);
  const [answers,     setAnswers]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [done,        setDone]        = useState(false);
  const [result,      setResult]      = useState(null);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [submitting,  setSubmitting]  = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim     = useRef(new Animated.Value(1)).current;
  const scaleAnim    = useRef(new Animated.Value(0.95)).current;

  useEffect(() => { load(); }, [language]);

  async function load() {
    try {
      const res = await dailyChallengeService.get(language);
      if (res.data.alreadyCompleted) { setAlreadyDone(true); }
      else { setQuestions(res.data.questions || []); }
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (!questions.length) return;
    const pct = ((current) / questions.length) * 100;
    Animated.timing(progressAnim, { toValue: pct, duration: 400, useNativeDriver: false }).start();
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 9, useNativeDriver: true }),
    ]).start();
  }, [current, questions.length]);

  function animateOut(cb) {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0,    duration: 180, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 180, useNativeDriver: true }),
    ]).start(cb);
  }

  function handleSelect(idx) {
    if (selected !== null) return;
    const q       = questions[current];
    const correct = q.correctIndex === idx;
    setSelected(idx);
    const newAnswers = [...answers, { correct }];

    setTimeout(() => {
      animateOut(() => {
        setSelected(null);
        if (current + 1 < questions.length) {
          setCurrent((c) => c + 1);
        } else {
          finishQuiz(newAnswers);
        }
      });
    }, 900);
    setAnswers(newAnswers);
  }

  async function finishQuiz(finalAnswers) {
    const score = finalAnswers.filter((a) => a.correct).length;
    const total = questions.length;
    setDone(true);
    setSubmitting(true);
    try {
      const res = await dailyChallengeService.submit(score, total);
      setResult({ score, total, ...res.data });
    } catch {
      setResult({ score, total, passed: false, xpAwarded: 0 });
    } finally {
      setSubmitting(false);
    }
  }

  // ── Already completed ────────────────────────────────────────────────────────
  if (alreadyDone) {
    return (
      <View style={s.root}>
        <SafeAreaView style={s.safe}>
          <Header onBack={() => navigation.goBack()} />
          <View style={s.centerBox}>
            <Text style={{ fontSize: 64 }}>✅</Text>
            <Text style={s.doneTitle}>Sfida e kompletuar!</Text>
            <Text style={s.doneSub}>Kthehu nesër për sfidën e re.</Text>
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
              <Text style={s.backBtnTxt}>Kthehu</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={s.root}>
        <SafeAreaView style={s.safe}>
          <Header onBack={() => navigation.goBack()} />
          <View style={s.centerBox}>
            <ActivityIndicator color="#ef4444" size="large" />
            <Text style={s.loadingTxt}>Duke ngarkuar sfidën…</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── No questions ─────────────────────────────────────────────────────────────
  if (!questions.length && !done) {
    return (
      <View style={s.root}>
        <SafeAreaView style={s.safe}>
          <Header onBack={() => navigation.goBack()} />
          <View style={s.centerBox}>
            <Text style={{ fontSize: 48 }}>😕</Text>
            <Text style={s.doneTitle}>Nuk ka pyetje sot</Text>
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
              <Text style={s.backBtnTxt}>Kthehu</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── Result screen ────────────────────────────────────────────────────────────
  if (done) {
    if (submitting) {
      return (
        <LinearGradient colors={["#0f172a", "#1e1b4b"]} style={{ flex: 1 }}>
          <View style={s.centerBox}>
            <ActivityIndicator color="#a5b4fc" size="large" />
          </View>
        </LinearGradient>
      );
    }
    return (
      <ResultScreen
        result={result}
        answers={answers}
        onHome={() => navigation.goBack()}
      />
    );
  }

  // ── Quiz screen ──────────────────────────────────────────────────────────────
  const q      = questions[current];
  const colors = TYPE_COLORS[q.type] || ["#6366f1", "#4f46e5"];

  return (
    <View style={s.root}>
      <SafeAreaView style={s.safe}>
        <Header
          onBack={() => navigation.goBack()}
          right={
            <Text style={s.progress}>
              {current + 1} / {questions.length}
            </Text>
          }
        />

        <View style={s.progressTrack}>
          <Animated.View
            style={[
              s.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ["0%", "100%"],
                }),
                backgroundColor: colors[0],
              },
            ]}
          />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View style={[s.typeBadge, { backgroundColor: colors[0] + "22" }]}>
            <Text style={[s.typeBadgeTxt, { color: colors[0] }]}>
              {TYPE_LABELS[q.type] || q.type}
            </Text>
          </View>

          <Animated.View
            style={[s.questionCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
          >
            <LinearGradient colors={colors} style={s.questionGrad}>
              <Text style={s.questionTxt}>{q.question}</Text>
            </LinearGradient>
          </Animated.View>

          <View style={s.optionsWrap}>
            {q.options.map((opt, idx) => {
              let bg = "#fff";
              let border = "#e2e8f0";
              let txtColor = "#0f172a";

              if (selected !== null) {
                if (idx === q.correctIndex) {
                  bg = "#dcfce7"; border = "#16a34a"; txtColor = "#15803d";
                } else if (idx === selected) {
                  bg = "#fee2e2"; border = "#dc2626"; txtColor = "#b91c1c";
                }
              }

              return (
                <TouchableOpacity
                  key={idx}
                  style={[s.option, { backgroundColor: bg, borderColor: border }]}
                  onPress={() => handleSelect(idx)}
                  activeOpacity={0.8}
                  disabled={selected !== null}
                >
                  <View style={[s.optionLetter, { backgroundColor: colors[0] + "18" }]}>
                    <Text style={[s.optionLetterTxt, { color: colors[0] }]}>
                      {["A", "B", "C"][idx]}
                    </Text>
                  </View>
                  <Text style={[s.optionTxt, { color: txtColor }]}>{opt}</Text>
                  {selected !== null && idx === q.correctIndex && (
                    <Ionicons name="checkmark-circle" size={20} color="#16a34a" style={{ marginLeft: "auto" }} />
                  )}
                  {selected === idx && idx !== q.correctIndex && (
                    <Ionicons name="close-circle" size={20} color="#dc2626" style={{ marginLeft: "auto" }} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ── Result Screen Component ──────────────────────────────────────────────────
function ResultScreen({ result, answers, onHome }) {
  const { score = 0, total = 0, passed = false, xpAwarded = 0 } = result || {};
  const accuracy = total ? Math.round((score / total) * 100) : 0;
  const correctCount = answers.filter((a) => a.correct).length;
  const wrongCount   = answers.length - correctCount;

  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const trophyAnim = useRef(new Animated.Value(0)).current;
  const cardAnim   = useRef(new Animated.Value(0)).current;
  const xpAnim     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim,   { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(trophyAnim, { toValue: 1, tension: 55, friction: 7, useNativeDriver: true }),
      Animated.timing(cardAnim,   { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(xpAnim,     { toValue: 1, duration: 380, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
      <LinearGradient colors={["#0f172a", "#1e1b4b"]} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={r.scroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Trophy */}
            <Animated.View
              style={[r.trophyWrap, { transform: [{ scale: trophyAnim }] }]}
            >
              <View style={[r.trophyGlow, { borderColor: passed ? "#fbbf2444" : "#6366f144" }]}>
                <Text style={r.trophyEmoji}>{passed ? "🏆" : "📚"}</Text>
              </View>
            </Animated.View>

            {/* Title & subtitle */}
            <Text style={r.title}>
              {passed ? "Sfidë e fituar!" : "Provo sërsëri nesër!"}
            </Text>
            <Text style={r.subtitle}>
              {passed
                ? "Punë e shkëlqyer! Vazhdo kështu."
                : "Mos u dorëzo — nesër do ia dalësh!"}
            </Text>

            {/* Score stats pill */}
            <Animated.View
              style={[r.scorePill, { opacity: cardAnim, transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }]}
            >
              <View style={r.scoreStat}>
                <Text style={r.scoreNum}>{score}</Text>
                <Text style={r.scoreLabel}>SAKTË</Text>
              </View>
              <View style={r.divider} />
              <View style={r.scoreStat}>
                <Text style={r.scoreNum}>{total - score}</Text>
                <Text style={r.scoreLabel}>GABIM</Text>
              </View>
              <View style={r.divider} />
              <View style={r.scoreStat}>
                <Text style={[r.scoreNum, { color: passed ? "#4ade80" : "#f87171" }]}>
                  {accuracy}%
                </Text>
                <Text style={r.scoreLabel}>SAKTËSI</Text>
              </View>
            </Animated.View>

            {/* XP badge */}
            {passed && (
              <Animated.View
                style={{
                  opacity: xpAnim,
                  transform: [{ translateY: xpAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
                }}
              >
                <LinearGradient colors={["#f59e0b", "#d97706"]} style={r.xpCard}>
                  <Ionicons name="star" size={18} color="#fff" />
                  <Text style={r.xpText}>+{xpAwarded} XP fituar</Text>
                </LinearGradient>
              </Animated.View>
            )}

            {/* Accuracy bar */}
            <View style={r.barSection}>
              <View style={r.barTrack}>
                {correctCount > 0 && (
                  <View style={[r.barSegment, { flex: correctCount, backgroundColor: "#4ade80" }]} />
                )}
                {wrongCount > 0 && (
                  <View style={[r.barSegment, { flex: wrongCount, backgroundColor: "#f87171" }]} />
                )}
              </View>
              <View style={r.barLegend}>
                <View style={r.legendItem}>
                  <View style={[r.dot, { backgroundColor: "#4ade80" }]} />
                  <Text style={r.legendTxt}>{correctCount} të sakta</Text>
                </View>
                <View style={r.legendItem}>
                  <View style={[r.dot, { backgroundColor: "#f87171" }]} />
                  <Text style={r.legendTxt}>{wrongCount} gabime</Text>
                </View>
              </View>
            </View>

            {/* Answer chips grid */}
            <View style={r.chipGrid}>
              {answers.map((a, i) => (
                <View
                  key={i}
                  style={[
                    r.chip,
                    {
                      backgroundColor: a.correct ? "#14532d33" : "#7f1d1d33",
                      borderColor:     a.correct ? "#4ade80"   : "#f87171",
                    },
                  ]}
                >
                  <Ionicons
                    name={a.correct ? "checkmark" : "close"}
                    size={13}
                    color={a.correct ? "#4ade80" : "#f87171"}
                  />
                  <Text style={[r.chipTxt, { color: a.correct ? "#4ade80" : "#f87171" }]}>
                    Q{i + 1}
                  </Text>
                </View>
              ))}
            </View>

            {/* Home button */}
            <TouchableOpacity
              style={r.homeBtn}
              onPress={onHome}
              activeOpacity={0.85}
            >
              <LinearGradient colors={["#6366f1", "#4f46e5"]} style={r.homeBtnGrad}>
                <Ionicons name="home-outline" size={18} color="#fff" />
                <Text style={r.homeBtnTxt}>Kthehu në shtëpi</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </Animated.View>
  );
}

// ── Header ───────────────────────────────────────────────────────────────────
function Header({ onBack, right }) {
  return (
    <View style={s.header}>
      <TouchableOpacity onPress={onBack} style={s.backIcon}>
        <Ionicons name="arrow-back" size={22} color="#0f172a" />
      </TouchableOpacity>
      <Text style={s.headerTitle}>SFIDA E DITËS</Text>
      {right || <View style={{ width: 36 }} />}
    </View>
  );
}

// ── Quiz styles ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8f5f0" },
  safe: { flex: 1 },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  backIcon: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#e2e8f0",
  },
  headerTitle: { fontSize: 13, fontWeight: "800", color: "#0f172a", letterSpacing: 1.2 },
  progress:    { fontSize: 13, fontWeight: "700", color: "#64748b" },

  progressTrack: { height: 6, backgroundColor: "#f1f5f9", marginHorizontal: 16, borderRadius: 3, overflow: "hidden" },
  progressFill:  { height: 6, borderRadius: 3 },

  typeBadge:    { alignSelf: "flex-start", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 14 },
  typeBadgeTxt: { fontSize: 11, fontWeight: "800", letterSpacing: 0.8 },

  questionCard: { borderRadius: 24, overflow: "hidden", marginBottom: 24, elevation: 4, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  questionGrad: { padding: 28, minHeight: 130, justifyContent: "center" },
  questionTxt:  { color: "#fff", fontSize: 20, fontWeight: "800", lineHeight: 28 },

  optionsWrap: { gap: 12 },
  option: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderRadius: 16, padding: 16, borderWidth: 2,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  optionLetter:    { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  optionLetterTxt: { fontSize: 14, fontWeight: "900" },
  optionTxt:       { flex: 1, fontSize: 15, fontWeight: "600" },

  centerBox: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  doneTitle: { fontSize: 24, fontWeight: "900", color: "#0f172a", textAlign: "center" },
  doneSub:   { fontSize: 15, color: "#64748b", textAlign: "center" },
  loadingTxt:{ fontSize: 14, color: "#94a3b8", marginTop: 12 },

  backBtn:    { marginTop: 24, backgroundColor: "#0f172a", borderRadius: 16, paddingHorizontal: 32, paddingVertical: 14 },
  backBtnTxt: { color: "#fff", fontWeight: "800", fontSize: 15 },
});

// ── Result styles ─────────────────────────────────────────────────────────────
const r = StyleSheet.create({
  scroll: { padding: 24, alignItems: "center", paddingBottom: 52 },

  trophyWrap: { marginTop: 20, marginBottom: 22 },
  trophyGlow: {
    width: 116, height: 116, borderRadius: 58,
    backgroundColor: "#ffffff0e",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2,
  },
  trophyEmoji: { fontSize: 56 },

  title:    { fontSize: 28, fontWeight: "900", color: "#f1f5f9", textAlign: "center", letterSpacing: 0.3 },
  subtitle: { fontSize: 14, color: "#64748b", textAlign: "center", marginTop: 6, marginBottom: 28, lineHeight: 20 },

  scorePill: {
    flexDirection: "row",
    backgroundColor: "#ffffff0a",
    borderRadius: 24, borderWidth: 1, borderColor: "#ffffff12",
    paddingVertical: 22, paddingHorizontal: 20,
    width: "100%", marginBottom: 20,
  },
  scoreStat:  { flex: 1, alignItems: "center" },
  scoreNum:   { fontSize: 30, fontWeight: "900", color: "#f1f5f9" },
  scoreLabel: { fontSize: 10, color: "#475569", marginTop: 3, fontWeight: "700", letterSpacing: 0.8 },
  divider:    { width: 1, backgroundColor: "#ffffff10", marginHorizontal: 4 },

  xpCard: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 20, paddingHorizontal: 28, paddingVertical: 14,
    marginBottom: 24,
    shadowColor: "#f59e0b", shadowOpacity: 0.35, shadowRadius: 14, elevation: 6,
  },
  xpText: { color: "#fff", fontWeight: "900", fontSize: 18 },

  barSection: { width: "100%", marginBottom: 24 },
  barTrack:   { flexDirection: "row", height: 8, borderRadius: 4, overflow: "hidden" },
  barSegment: { borderRadius: 4 },
  barLegend:  { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot:        { width: 8, height: 8, borderRadius: 4 },
  legendTxt:  { fontSize: 12, color: "#64748b", fontWeight: "600" },

  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 32, width: "100%" },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 10, paddingHorizontal: 11, paddingVertical: 7,
    borderWidth: 1,
  },
  chipTxt: { fontSize: 12, fontWeight: "800" },

  homeBtn: {
    width: "100%", borderRadius: 18, overflow: "hidden",
    elevation: 8, shadowColor: "#6366f1", shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 4 },
  },
  homeBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 18 },
  homeBtnTxt:  { color: "#fff", fontWeight: "900", fontSize: 16, letterSpacing: 0.4 },
});
