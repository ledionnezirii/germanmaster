import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  ActivityIndicator, ScrollView, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import pathService from "./pathService";
import { F } from "../../styles/fonts";

const { width } = Dimensions.get("window");

function normalise(s) {
  return (s || "").trim().toLowerCase().replace(/[^a-zäöüß0-9\s]/gi, "").replace(/\s+/g, " ");
}

function CharacterBubble({ text, questionKey }) {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    bounceAnim.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -7, duration: 750, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0,  duration: 750, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [questionKey]);

  return (
    <View style={cb.wrap}>
      <View style={cb.row}>
        <Animated.View style={[cb.charBox, { transform: [{ translateY: bounceAnim }] }]}>
          <Text style={cb.emoji}>🦉</Text>
        </Animated.View>
        <View style={cb.bubbleWrap}>
          <View style={cb.tail} />
          <View style={cb.bubble}>
            <Text style={cb.txt}>{text}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function ResultScreen({ passed, score, correct, total, xpAwarded, onDone }) {
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }).start();
  }, []);

  return (
    <View style={rs.root}>
      <Animated.View style={[rs.card, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={rs.emoji}>{passed ? "🏆" : "😅"}</Text>
        <Text style={[rs.title, { color: passed ? "#f59e0b" : "#ef4444" }]}>
          {passed ? "Seksioni Kaluar!" : "Provo Përsëri"}
        </Text>
        <Text style={rs.score}>{score}%</Text>
        <Text style={rs.sub}>{correct}/{total} përgjigje të sakta</Text>

        {passed && xpAwarded > 0 && (
          <View style={rs.xpRow}>
            <Ionicons name="star" size={18} color="#f59e0b" />
            <Text style={rs.xpTxt}>+{xpAwarded} XP</Text>
          </View>
        )}

        <View style={rs.starsRow}>
          {[0,1,2].map((i) => (
            <Ionicons key={i} name="star" size={36}
              color={i < Math.round((correct / Math.max(total,1)) * 3) ? "#fbbf24" : "#e2e8f0"} />
          ))}
        </View>

        {!passed && (
          <Text style={rs.hint}>Duhet 70% për të kaluar. Rishiko temat dhe provo sërisht.</Text>
        )}

        <TouchableOpacity
          style={[rs.btn, { backgroundColor: passed ? "#f59e0b" : "#64748b" }]}
          onPress={onDone}
          activeOpacity={0.85}
        >
          <Text style={rs.btnTxt}>{passed ? "Vazhdo" : "Kthehu"}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export default function SectionTestScreen({ navigation, route }) {
  const {
    level        = "A1",
    sectionNum   = 1,
    language     = "de",
    sectionTitle = "Seksioni",
  } = route.params || {};

  const [loading,    setLoading]    = useState(true);
  const [questions,  setQuestions]  = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected,   setSelected]   = useState(null);
  const [answered,   setAnswered]   = useState(false);
  const [results,    setResults]    = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result,     setResult]     = useState(null);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    pathService.getSectionTest(level, sectionNum, language)
      .then((res) => setQuestions(res.data?.questions || res.data || []))
      .catch((e) => console.warn("SectionTest load:", e?.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const total = questions.length || 1;
    Animated.timing(progressAnim, {
      toValue: (currentIdx / total) * 100,
      duration: 300, useNativeDriver: false,
    }).start();
  }, [currentIdx, questions.length]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleSelect = useCallback(async (opt) => {
    if (answered) return;
    const q       = questions[currentIdx];
    const correct = normalise(opt) === normalise(q.answer);
    setSelected(opt);
    setAnswered(true);
    if (!correct) shake();

    const newResults = [...results, { questionIndex: currentIdx, correct }];
    setResults(newResults);

    setTimeout(async () => {
      if (currentIdx + 1 >= questions.length) {
        setSubmitting(true);
        try {
          const res = await pathService.submitSectionTest(level, sectionNum, language, newResults);
          const d   = res.data;
          setResult({ passed: d.passed, score: d.score, correct: d.correct, total: d.total, xpAwarded: d.xpAwarded ?? 0 });
        } catch (e) {
          const c = newResults.filter(r => r.correct).length;
          const t = newResults.length;
          setResult({ passed: false, score: Math.round(c / t * 100), correct: c, total: t, xpAwarded: 0 });
        } finally {
          setSubmitting(false);
        }
      } else {
        setCurrentIdx(i => i + 1);
        setSelected(null);
        setAnswered(false);
      }
    }, 1000);
  }, [answered, currentIdx, questions, results]);

  if (loading || submitting) {
    return (
      <View style={[s.root, s.center]}>
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text style={s.loadingTxt}>{loading ? "Duke ngarkuar testin…" : "Duke dorëzuar…"}</Text>
      </View>
    );
  }

  if (!questions.length) {
    return (
      <View style={[s.root, s.center]}>
        <Text style={{ fontSize: 16, color: "#64748b" }}>Nuk ka pyetje për këtë seksion</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ color: "#f59e0b", fontWeight: "700" }}>Kthehu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (result) {
    return <ResultScreen {...result} onDone={() => navigation.goBack()} />;
  }

  const q      = questions[currentIdx];
  const opts   = q.options || [];
  const isGrid = opts.length === 4;

  return (
    <View style={s.root}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.closeBtn}>
            <Ionicons name="close" size={22} color="#64748b" />
          </TouchableOpacity>
          <View style={s.progressTrack}>
            <Animated.View style={[s.progressFill, {
              width: progressAnim.interpolate({ inputRange: [0,100], outputRange: ["0%","100%"] }),
            }]} />
          </View>
          <View style={s.badge}>
            <Ionicons name="trophy" size={13} color="#f59e0b" />
            <Text style={s.badgeTxt}>{currentIdx + 1}/{questions.length}</Text>
          </View>
        </View>

        {/* Breadcrumb */}
        <View style={s.breadcrumb}>
          <Text style={s.bcEmoji}>🏆</Text>
          <View>
            <Text style={s.bcTitle}>{sectionTitle} — Test Final</Text>
            <Text style={s.bcSub}>Testo njohuritë e tua</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <CharacterBubble text={q.text || "Zgjidh përgjigjen e saktë"} questionKey={currentIdx} />

          {q.topicTitle ? (
            <View style={s.topicTag}>
              <Text style={s.topicTagTxt}>{q.topicIcon} {q.topicTitle}</Text>
            </View>
          ) : null}

          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            <View style={isGrid ? s.grid : s.list}>
              {opts.map((opt, i) => {
                const isSel   = selected === opt;
                const correct = normalise(opt) === normalise(q.answer);
                const bg      = isSel ? (correct ? "#ecfdf5" : "#fef2f2") : "#f8fafc";
                const border  = isSel ? (correct ? "#10b981" : "#ef4444") : "#e2e8f0";
                return (
                  <TouchableOpacity
                    key={i}
                    style={[isGrid ? s.optGrid : s.optRow, { backgroundColor: bg, borderColor: border }]}
                    onPress={() => handleSelect(opt)}
                    disabled={answered}
                    activeOpacity={0.8}
                  >
                    <Text style={isGrid ? s.optTxt : s.optRowTxt}>{opt}</Text>
                    {isSel && (
                      <Ionicons name={correct ? "checkmark-circle" : "close-circle"} size={20}
                        color={correct ? "#10b981" : "#ef4444"} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const cb = StyleSheet.create({
  wrap:      { marginBottom: 24 },
  row:       { flexDirection: "row", alignItems: "flex-end", gap: 14 },
  charBox:   {
    width: 100, height: 110, borderRadius: 24, borderWidth: 2,
    borderColor: "#fcd34d", backgroundColor: "#fef3c7",
    alignItems: "center", justifyContent: "center",
  },
  emoji:     { fontSize: 68 },
  bubbleWrap:{ flex: 1 },
  tail: {
    position: "absolute", left: -10, bottom: 18, width: 0, height: 0,
    borderTopWidth: 9, borderTopColor: "transparent",
    borderBottomWidth: 9, borderBottomColor: "transparent",
    borderRightWidth: 12, borderRightColor: "rgba(252,211,77,0.4)",
  },
  bubble: {
    backgroundColor: "#fff", borderRadius: 18, padding: 14,
    borderWidth: 2, borderColor: "rgba(252,211,77,0.4)",
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  txt: { fontSize: 17, fontFamily: F.black, color: "#0f172a", lineHeight: 24 },
});

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: "#f8f5f0" },
  center:     { alignItems: "center", justifyContent: "center" },
  loadingTxt: { marginTop: 12, fontSize: 13, fontFamily: F.semi, color: "#94a3b8" },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9",
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0",
    alignItems: "center", justifyContent: "center",
  },
  progressTrack: { flex: 1, height: 10, backgroundColor: "#f1f5f9", borderRadius: 5, overflow: "hidden" },
  progressFill:  { height: 10, borderRadius: 5, backgroundColor: "#f59e0b" },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#fef3c7", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  badgeTxt:    { fontSize: 12, fontFamily: F.black, color: "#d97706" },
  breadcrumb:  { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingVertical: 12 },
  bcEmoji:     { fontSize: 24 },
  bcTitle:     { fontSize: 15, fontFamily: F.black, color: "#0f172a" },
  bcSub:       { fontSize: 11, fontFamily: F.semi, color: "#f59e0b", marginTop: 1 },
  scroll:      { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 },
  topicTag:    {
    backgroundColor: "#fef3c7", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
    alignSelf: "flex-start", marginBottom: 16,
  },
  topicTagTxt: { fontSize: 12, fontFamily: F.bold, color: "#d97706" },
  grid:        { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  list:        { gap: 12 },
  optGrid: {
    alignItems: "center", justifyContent: "center",
    padding: 20, borderRadius: 18, borderWidth: 2.5,
    width: "48%", minHeight: 100, gap: 6,
  },
  optTxt:    { fontSize: 16, fontFamily: F.bold, color: "#0f172a", textAlign: "center" },
  optRow:    {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 16, borderRadius: 16, borderWidth: 2,
  },
  optRowTxt: { fontSize: 16, fontFamily: F.bold, color: "#0f172a", flex: 1 },
});

const rs = StyleSheet.create({
  root:     { flex: 1, backgroundColor: "#f8f5f0", alignItems: "center", justifyContent: "center", padding: 28 },
  card:     {
    width: "100%", backgroundColor: "#fff", borderRadius: 32, padding: 32,
    alignItems: "center", gap: 12,
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
  emoji:    { fontSize: 64, marginBottom: 4 },
  title:    { fontSize: 26, fontFamily: F.black, textAlign: "center" },
  score:    { fontSize: 48, fontFamily: F.black, color: "#0f172a" },
  sub:      { fontSize: 14, fontFamily: F.semi, color: "#94a3b8" },
  xpRow:    {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#fef3c7", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14,
  },
  xpTxt:    { fontSize: 18, fontFamily: F.black, color: "#d97706" },
  starsRow: { flexDirection: "row", gap: 10, marginVertical: 4 },
  hint:     { fontSize: 13, fontFamily: F.regular, color: "#94a3b8", textAlign: "center", lineHeight: 19 },
  btn:      { width: "100%", paddingVertical: 18, borderRadius: 18, alignItems: "center", marginTop: 8 },
  btnTxt:   { color: "#fff", fontSize: 17, fontFamily: F.black },
});
