import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Audio } from "expo-av";
import { wordAudioService, ttsService } from "../../services/api";
import { useLanguage } from "../../context/LanguageContext";

const LANG_CONFIG = {
  de: { name: "Gjermanisht", flag: "🇩🇪" },
  en: { name: "Anglisht",    flag: "🇬🇧" },
  fr: { name: "Frëngjisht",  flag: "🇫🇷" },
  tr: { name: "Turqisht",    flag: "🇹🇷" },
  it: { name: "Italisht",    flag: "🇮🇹" },
};

export default function WordAudioQuizScreen({ route, navigation }) {
  const { set, isMixed = false, mixedWords } = route.params;
  const { language } = useLanguage();
  const langConfig = LANG_CONFIG[language] || LANG_CONFIG.de;
  const words = isMixed ? (mixedWords || []) : (set?.words || []);

  const [matched, setMatched] = useState({});
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [wrongPair, setWrongPair] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(null);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState(null);

  const shuffledRightRef = useRef(null);
  if (!shuffledRightRef.current) {
    shuffledRightRef.current = [...words].sort(() => Math.random() - 0.5);
  }
  const shuffledRight = shuffledRightRef.current;

  const matchedCount = Object.keys(matched).length;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: words.length > 0 ? matchedCount / words.length : 0,
      duration: 450,
      easing: Easing.out(Easing.back(1.2)),
      useNativeDriver: false,
    }).start();
  }, [matchedCount]);

  async function playAudio(word, wordIndex) {
    try {
      const sid = word.setId || set?._id;
      const widx = word.wordIndex !== undefined ? word.wordIndex : wordIndex;
      const lvl = word.level || set?.level;
      const url = await ttsService.getWordAudioAudio(sid, widx, word.germanWord, lvl, language);
      if (!url) return;
      const { sound } = await Audio.Sound.createAsync({ uri: url });
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((st) => { if (st.didJustFinish) sound.unloadAsync(); });
    } catch { /* silent fallback */ }
  }

  function handleLeftPress(word, index) {
    if (matched[word.germanWord]) return;
    setSelectedLeft(word.germanWord);
    setIsSpeaking(word.germanWord);
    playAudio(word, index);
    setTimeout(() => setIsSpeaking(null), 2400);
  }

  async function handleRightPress(albanianWord) {
    if (!selectedLeft) return;
    if (Object.values(matched).includes(albanianWord)) return;
    const selectedWord = words.find((w) => w.germanWord === selectedLeft);
    if (!selectedWord) return;

    if (selectedWord.albanianWord === albanianWord) {
      const newMatched = { ...matched, [selectedLeft]: albanianWord };
      setMatched(newMatched);
      setSelectedLeft(null);
      setWrongPair(null);

      if (Object.keys(newMatched).length === words.length) {
        try {
          if (isMixed) {
            const res = await wordAudioService.submitMixedQuiz();
            const xp = res.data?.data?.xpAwarded ?? res.data?.xpAwarded ?? 10;
            setResult({ passed: true, percentage: 100, xpAwarded: xp });
          } else {
            const res = await wordAudioService.submitQuiz(set._id, words.length, words.length);
            setResult(res.data || { passed: true, percentage: 100, xpAwarded: set?.xp || 0 });
          }
        } catch {
          setResult({ passed: true, percentage: 100, xpAwarded: isMixed ? 10 : (set?.xp || 0) });
        }
        setFinished(true);
      }
    } else {
      setWrongPair({ german: selectedLeft, albanian: albanianWord });
      setTimeout(() => { setWrongPair(null); setSelectedLeft(null); }, 650);
    }
  }

  if (finished && result) {
    return <ResultScreen result={result} isMixed={isMixed} onBack={() => navigation.goBack()} />;
  }

  const title = isMixed ? "Quiz Mikst" : (set?.title || "Bashko Fjalët");

  return (
    <View style={s.root}>
      {/* ─── Clean light header ─── */}
      <LinearGradient
        colors={["#ffffff", "#f9fafb", "#ffffff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.headerGrad}
      />
      <View style={s.headerGlow} />

      <SafeAreaView edges={["top"]} style={s.headerSafe}>
        {/* Top bar */}
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={20} color="#374151" />
          </TouchableOpacity>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={s.topTitle}>{title}</Text>
            <Text style={s.topSub}>Dëgjo · Lidh · Mëso</Text>
          </View>

          <View style={s.counterPill}>
            <View style={s.counterDot} />
            <Text style={s.counterText}>{matchedCount}/{words.length}</Text>
          </View>
        </View>

        {/* Refined progress bar */}
        <View style={s.progressWrap}>
          <View style={s.progressTrack}>
            <Animated.View
              style={[
                s.progressFill,
                {
                  width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
                },
              ]}
            />
          </View>
        </View>
      </SafeAreaView>

      {/* ─── Game area ─── */}
      <ScrollView
        style={s.gameArea}
        contentContainerStyle={s.gameContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Minimal instruction */}
        <View style={s.instructionChip}>
          <View style={s.instructionDot} />
          <Text style={s.instructionText}>
            {selectedLeft
              ? "Zgjidhni përkthimin"
              : "Trokitni për të dëgjuar"}
          </Text>
        </View>

        <View style={s.columnsRow}>
          {/* ── LEFT COLUMN (audio) ── */}
          <View style={s.col}>
            <View style={s.colHead}>
              <Text style={s.colHeadFlag}>{langConfig.flag}</Text>
              <Text style={s.colHeadText}>DËGJO</Text>
            </View>

            {words.map((word, idx) => {
              const isMatched  = !!matched[word.germanWord];
              const isSelected = selectedLeft === word.germanWord;
              const isWrong    = wrongPair?.german === word.germanWord;
              const speaking   = isSpeaking === word.germanWord;

              return (
                <LeftButton
                  key={`L${idx}`}
                  isMatched={isMatched}
                  isSelected={isSelected}
                  isWrong={isWrong}
                  speaking={speaking}
                  flag={langConfig.flag}
                  onPress={() => handleLeftPress(word, idx)}
                />
              );
            })}
          </View>

          {/* ── RIGHT COLUMN (Albanian) ── */}
          <View style={s.col}>
            <View style={s.colHead}>
              <Text style={s.colHeadFlag}>🇦🇱</Text>
              <Text style={s.colHeadText}>GJEJ</Text>
            </View>

            {shuffledRight.map((word, idx) => {
              const isMatched = Object.values(matched).includes(word.albanianWord);
              const isWrong   = wrongPair?.albanian === word.albanianWord;
              const isActive  = !!selectedLeft && !isMatched;

              return (
                <RightButton
                  key={`R${idx}`}
                  label={word.albanianWord}
                  isMatched={isMatched}
                  isWrong={isWrong}
                  isActive={isActive}
                  onPress={() => handleRightPress(word.albanianWord)}
                />
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Left Button ───────────────────────────────────────────────────────────────
function LeftButton({ isMatched, isSelected, isWrong, speaking, flag, onPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (speaking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.02, duration: 400, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1,    duration: 400, useNativeDriver: true }),
        ])
      ).start();
    } else {
      scaleAnim.stopAnimation();
      Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    }
  }, [speaking]);

  useEffect(() => {
    if (!isWrong) return;
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -9, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  9, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -7, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  7, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -4, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  0, duration: 45, useNativeDriver: true }),
    ]).start();
  }, [isWrong]);

  let bgColor, borderColor, borderBottomColor, iconColor, iconName;

  if (isMatched) {
    bgColor = "#dcfce7";
    borderColor = "#22c55e"; borderBottomColor = "#15803d";
    iconColor = "#16a34a";
    iconName = "checkmark-circle";
  } else if (isWrong) {
    bgColor = "#fee2e2";
    borderColor = "#ef4444"; borderBottomColor = "#b91c1c";
    iconColor = "#dc2626";
    iconName = "close-circle";
  } else if (speaking) {
    bgColor = "#dbeafe";
    borderColor = "#3b82f6"; borderBottomColor = "#1d4ed8";
    iconColor = "#2563eb";
    iconName = "volume-high";
  } else if (isSelected) {
    bgColor = "#e0e7ff";
    borderColor = "#6366f1"; borderBottomColor = "#4338ca";
    iconColor = "#4f46e5";
    iconName = "volume-medium";
  } else {
    bgColor = "#ffffff";
    borderColor = "#e5e7eb"; borderBottomColor = "#c8d0da";
    iconColor = "#6b7280";
    iconName = "volume-medium-outline";
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }, { translateX: shakeAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        disabled={isMatched}
        activeOpacity={0.7}
        style={[s.wordBtn, { backgroundColor: bgColor, borderColor, borderBottomColor }]}
      >
        <View style={s.wordBtnInner}>
          {/* Icon */}
          <View style={[s.wordBtnIconWrap, { backgroundColor: isMatched ? "rgba(34,197,94,0.15)" : "rgba(0,0,0,0.04)" }]}>
            <Ionicons name={iconName} size={16} color={iconColor} />
          </View>

          {/* Flag */}
          <Text style={s.wordBtnFlag}>{flag}</Text>

          {/* Sound wave when speaking */}
          {speaking && <SoundWave />}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Right Button ──────────────────────────────────────────────────────────────
function RightButton({ label, isMatched, isWrong, isActive, onPress }) {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isWrong) return;
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -9, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  9, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -7, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  7, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -4, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  0, duration: 45, useNativeDriver: true }),
    ]).start();
  }, [isWrong]);

  let bgColor, textColor, borderColor, borderBottomColor, iconName, iconColor;

  if (isMatched) {
    bgColor = "#dcfce7";
    textColor = "#16a34a";
    borderColor = "#22c55e"; borderBottomColor = "#15803d";
    iconName = "checkmark-circle";
    iconColor = "#16a34a";
  } else if (isWrong) {
    bgColor = "#fee2e2";
    textColor = "#dc2626";
    borderColor = "#ef4444"; borderBottomColor = "#b91c1c";
    iconName = "close-circle";
    iconColor = "#dc2626";
  } else if (isActive) {
    bgColor = "#e0e7ff";
    textColor = "#1f2937";
    borderColor = "#6366f1"; borderBottomColor = "#4338ca";
    iconName = null;
    iconColor = null;
  } else {
    bgColor = "#ffffff";
    textColor = "#9ca3af";
    borderColor = "#e5e7eb"; borderBottomColor = "#c8d0da";
    iconName = null;
    iconColor = null;
  }

  return (
    <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
    <TouchableOpacity
      onPress={onPress}
      disabled={isMatched}
      activeOpacity={0.7}
      style={[s.wordBtn, { backgroundColor: bgColor, borderColor, borderBottomColor }]}
    >
      <View style={s.wordBtnInner}>
        {/* Flag / icon */}
        <View style={[s.wordBtnIconWrap, { backgroundColor: isMatched ? "rgba(34,197,94,0.15)" : "rgba(0,0,0,0.04)" }]}>
          {iconName ? (
            <Ionicons name={iconName} size={14} color={iconColor} />
          ) : (
            <Text style={{ fontSize: 12 }}>🇦🇱</Text>
          )}
        </View>
        {/* Albanian text */}
        <Text numberOfLines={2} style={[s.wordBtnText, { color: textColor }]}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
    </Animated.View>
  );
}

// ── Sound Wave ────────────────────────────────────────────────────────────────
function SoundWave() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 600, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration: 600, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const heights = [3, 8, 5, 10, 3, 6, 5];
  return (
    <View style={s.soundWave}>
      {heights.map((h, i) => (
        <Animated.View key={i} style={{
          width: 2, borderRadius: 1,
          backgroundColor: "#3b82f6",
          height: anim.interpolate({ inputRange: [0, 1], outputRange: [h * 0.35, h] }),
        }} />
      ))}
    </View>
  );
}

// ── Result Screen ─────────────────────────────────────────────────────────────
function ResultScreen({ result, isMixed, onBack }) {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 65, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  const xp = result.xpAwarded || 0;
  const pct = result.percentage || 100;
  const passed = result.passed !== false;

  return (
    <View style={rs.root}>
      <LinearGradient
        colors={["#ffffff", "#f9fafb", "#ffffff"]}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Subtle accent glow */}
      <View style={[rs.accentGlow, { backgroundColor: passed ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)" }]} />

      <SafeAreaView style={rs.safe}>
        <Animated.View style={[rs.card, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
          {/* Icon */}
          <View style={[rs.iconCircle, { borderColor: passed ? "#166534" : "#991b1b" }]}>
            <Ionicons 
              name={passed ? "trophy" : "refresh"} 
              size={32} 
              color={passed ? "#22c55e" : "#ef4444"} 
            />
          </View>

          {/* Score */}
          <Text style={[rs.scoreVal, { color: passed ? "#22c55e" : "#ef4444" }]}>{pct}%</Text>
          <Text style={rs.scoreLabel}>Rezultati</Text>

          <Text style={rs.resultTitle}>
            {isMixed ? "Quiz Mikst Kryer!" : passed ? "Shkëlqyeshëm!" : "Provo Sërish!"}
          </Text>
          <Text style={rs.resultSub}>
            {passed ? "Ke lidhur të gjitha fjalët me sukses." : "Kthehu dhe provo edhe njëherë."}
          </Text>

          {/* XP Card */}
          {xp > 0 && (
            <View style={rs.xpCard}>
              <Ionicons name="flash" size={20} color="#eab308" />
              <Text style={rs.xpVal}>+{xp}</Text>
              <Text style={rs.xpLabel}>XP</Text>
            </View>
          )}

          {result.alreadyFinished && (
            <Text style={rs.noteText}>Ky set ishte kryer më parë — asnjë XP i ri</Text>
          )}

          {/* Stats row */}
          <View style={rs.statsRow}>
            <ResultStat label="Fjalë" value={`${result.totalQuestions || "–"}`} icon="layers-outline" color="#a78bfa" />
            <ResultStat label="Saktësi" value="100%" icon="checkmark-done" color="#22c55e" />
          </View>

          {/* CTA */}
          <TouchableOpacity style={rs.btn} onPress={onBack} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
            <Text style={rs.btnText}>Kthehu te Setet</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

function ResultStat({ label, value, icon, color }) {
  return (
    <View style={rs.statBox}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[rs.statVal, { color }]}>{value}</Text>
      <Text style={rs.statLabel}>{label}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },

  // Header
  headerGrad: { position: "absolute", top: 0, left: 0, right: 0, height: 120 },
  headerGlow: {
    position: "absolute", top: 30, left: "50%", marginLeft: -80,
    width: 160, height: 80, borderRadius: 80,
    backgroundColor: "rgba(99,102,241,0.06)",
  },
  headerSafe: { zIndex: 10 },

  // Top bar
  topBar: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingTop: 4, paddingBottom: 4,
    gap: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#f3f4f6",
    borderWidth: 1, borderColor: "#e5e7eb",
    alignItems: "center", justifyContent: "center",
  },
  topTitle: {
    color: "#111827", fontSize: 16, fontWeight: "700",
    letterSpacing: -0.3,
  },
  topSub: {
    color: "#9ca3af",
    fontSize: 11, fontWeight: "500", marginTop: 1,
  },
  counterPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#f3f4f6",
    borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: "#e5e7eb",
  },
  counterDot: {
    width: 5, height: 5, borderRadius: 2.5,
    backgroundColor: "#22c55e",
  },
  counterText: { color: "#374151", fontSize: 12, fontWeight: "600" },

  // Progress
  progressWrap: { paddingHorizontal: 14, paddingBottom: 3 },
  progressTrack: {
    height: 3, borderRadius: 1.5,
    backgroundColor: "#e5e7eb",
    overflow: "hidden",
  },
  progressFill: { 
    height: "100%", borderRadius: 1.5,
    backgroundColor: "#6366f1",
  },

  // Game area
  gameArea: { flex: 1, backgroundColor: "#ffffff" },
  gameContent: { paddingHorizontal: 12, paddingTop: 2, paddingBottom: 24 },

  // Instructions
  instructionChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6,
    marginBottom: 12,
    borderWidth: 1, borderColor: "#e5e7eb",
  },
  instructionDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: "#6366f1",
  },
  instructionText: { color: "#6b7280", fontSize: 11, fontWeight: "500" },

  // Columns
  columnsRow: { flexDirection: "row", gap: 8 },
  col: { flex: 1, gap: 6 },
  colHead: { 
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 6,
    paddingVertical: 8, marginBottom: 2,
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    borderWidth: 1, borderColor: "#e5e7eb",
  },
  colHeadFlag: { fontSize: 14 },
  colHeadText: {
    color: "#6b7280", fontSize: 10,
    fontWeight: "700", letterSpacing: 1,
  },

  // Word buttons
  wordBtn: {
    borderRadius: 10, borderWidth: 1, borderBottomWidth: 3,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 3, elevation: 3,
  },
  wordBtnInner: {
    flexDirection: "row", alignItems: "center",
    gap: 8, paddingHorizontal: 10, paddingVertical: 10,
    minHeight: 44,
  },
  wordBtnIconWrap: {
    width: 26, height: 26, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  wordBtnFlag: { fontSize: 14, flexShrink: 0 },
  wordBtnText: {
    flex: 1, fontSize: 12, fontWeight: "600", lineHeight: 16,
  },
  soundWave: { 
    flexDirection: "row", alignItems: "center", 
    gap: 1.5, marginLeft: "auto" 
  },
});

const rs = StyleSheet.create({
  root: { flex: 1 },
  accentGlow: {
    position: "absolute", top: "30%", left: "50%", marginLeft: -120,
    width: 240, height: 240, borderRadius: 120,
  },
  safe: { flex: 1, justifyContent: "center", paddingHorizontal: 20 },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20, padding: 28,
    borderWidth: 1, borderColor: "#e5e7eb",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  
  iconCircle: {
    width: 60, height: 60, borderRadius: 30,
    borderWidth: 2,
    backgroundColor: "#f9fafb",
    alignItems: "center", justifyContent: "center",
    marginBottom: 16,
  },

  scoreVal: { fontSize: 40, fontWeight: "700", letterSpacing: -1 },
  scoreLabel: { color: "#9ca3af", fontSize: 12, fontWeight: "600", marginTop: 2, marginBottom: 20 },

  resultTitle: {
    color: "#111827", fontSize: 20, fontWeight: "700",
    textAlign: "center", marginBottom: 6, letterSpacing: -0.3,
  },
  resultSub: {
    color: "#6b7280",
    fontSize: 13, textAlign: "center",
    lineHeight: 20, marginBottom: 24,
  },

  // XP
  xpCard: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#fef9c3",
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10, 
    marginBottom: 16,
    borderWidth: 1, borderColor: "#fde047",
  },
  xpVal: { color: "#a16207", fontSize: 20, fontWeight: "700" },
  xpLabel: { color: "#ca8a04", fontSize: 13, fontWeight: "600" },

  noteText: {
    color: "#9ca3af", fontSize: 11,
    textAlign: "center", marginBottom: 14, lineHeight: 16,
  },

  statsRow: { 
    flexDirection: "row", gap: 10, 
    marginBottom: 24, width: "100%" 
  },
  statBox: {
    flex: 1, alignItems: "center", gap: 4,
    backgroundColor: "#f9fafb",
    borderRadius: 12, paddingVertical: 14,
    borderWidth: 1, borderColor: "#e5e7eb",
  },
  statVal: { fontSize: 18, fontWeight: "700" },
  statLabel: { color: "#9ca3af", fontSize: 11, fontWeight: "600" },

  // CTA
  btn: { 
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8,
    backgroundColor: "#6366f1",
    borderRadius: 12, paddingVertical: 14,
    width: "100%",
  },
  btnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
