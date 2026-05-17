import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, Animated, Dimensions, FlatList,
  Modal, RefreshControl, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from "react-native";
import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { phraseService, ttsService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { F } from "../../styles/fonts";

const { width } = Dimensions.get("window");
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const LETTERS = ["A", "B", "C", "D"];
const FREE_DAILY_LIMIT = 2;
const WAVE_HEIGHTS = [5, 10, 18, 13, 22, 14, 24, 9, 20, 12, 17, 7, 21, 11, 9];

const PAIR_COLORS = [
  { bg: "rgba(20,184,166,0.18)", border: "#14b8a6", text: "#0d9488" },
  { bg: "rgba(139,92,246,0.18)", border: "#8b5cf6", text: "#7c3aed" },
  { bg: "rgba(245,158,11,0.18)", border: "#f59e0b", text: "#d97706" },
  { bg: "rgba(244,114,182,0.18)", border: "#f472b6", text: "#db2777" },
  { bg: "rgba(59,130,246,0.18)", border: "#3b82f6", text: "#2563eb" },
  { bg: "rgba(34,197,94,0.18)", border: "#22c55e", text: "#16a34a" },
  { bg: "rgba(251,146,60,0.18)", border: "#fb923c", text: "#ea580c" },
  { bg: "rgba(6,182,212,0.18)", border: "#06b6d4", text: "#0891b2" },
  { bg: "rgba(232,121,249,0.18)", border: "#e879f9", text: "#a21caf" },
  { bg: "rgba(79,70,229,0.18)", border: "#4f46e5", text: "#4338ca" },
];

// ── Animated phrase card ────────────────────────────────────────────────────
function PhraseCard({ item, isFinished, isLocked, canUnlock, onMark, onLimit, onSpeak, isPlaying, index, showGerman, showAlbanian }) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;
  const scale      = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const delay = Math.min(index, 12) * 40;
    Animated.parallel([
      Animated.timing(opacity,    { toValue: isLocked ? 0.45 : 1, duration: 340, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay, tension: 72, friction: 11, useNativeDriver: true }),
    ]).start();
  }, []);

  const pressIn  = () => Animated.spring(scale, { toValue: 0.965, tension: 220, friction: 10, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,     tension: 220, friction: 10, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }, { scale }], marginBottom: 10 }}>
      <View style={[s.phraseCard, isFinished && s.phraseCardDone, isLocked && s.phraseCardLocked]}>
        <View style={[s.phraseAccent, { backgroundColor: isFinished ? "#10b981" : isLocked ? "#cbd5e1" : "#14b8a6" }]} />

        <View style={s.phraseBody}>
          {showGerman && !isLocked && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Text style={s.germanText} numberOfLines={2}>{item.german}</Text>
              <TouchableOpacity
                onPress={() => onSpeak(item)}
                style={[s.audioBtn, isPlaying && s.audioBtnActive]}
                activeOpacity={0.7}
              >
                <Ionicons name={isPlaying ? "volume-high" : "volume-medium"} size={14} color={isPlaying ? "#fff" : "#14b8a6"} />
              </TouchableOpacity>
            </View>
          )}
          {showAlbanian && !isLocked && <Text style={s.albanianText} numberOfLines={2}>{item.albanian}</Text>}
          {isLocked && <View style={s.lockedLine} />}
          <Text style={[s.xpChip, isFinished && { color: "#059669" }]}>+{item.xp} XP</Text>
        </View>

        <View style={s.phraseRight}>
          {isLocked && (
            <View style={s.lockCircle}>
              <Ionicons name="lock-closed" size={15} color="#94a3b8" />
            </View>
          )}
          {!isLocked && !isFinished && canUnlock && (
            <TouchableOpacity onPressIn={pressIn} onPressOut={pressOut} onPress={onMark} activeOpacity={1}>
              <LinearGradient colors={["#34d399", "#10b981"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.markBtnGrad}>
                <Ionicons name="add" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          )}
          {!isLocked && !isFinished && !canUnlock && (
            <TouchableOpacity onPress={onLimit} style={s.crownBtn}>
              <Ionicons name="star" size={16} color="#f59e0b" />
            </TouchableOpacity>
          )}
          {isFinished && <Ionicons name="checkmark-circle" size={28} color="#10b981" />}
        </View>
      </View>
    </Animated.View>
  );
}

// ── XP Burst animation ───────────────────────────────────────────────────────
function XpAnimation({ xp, visible }) {
  const scale   = useRef(new Animated.Value(0.4)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0.4);
    opacity.setValue(0);
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale,   { toValue: 1.2, stiffness: 280, damping: 18, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }),
      ]),
      Animated.spring(scale, { toValue: 1, stiffness: 280, damping: 18, useNativeDriver: true }),
      Animated.delay(400),
      Animated.timing(opacity, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start();
  }, [visible, xp]);

  if (!visible) return null;
  return (
    <Animated.View pointerEvents="none" style={[s.xpFloat, { opacity, transform: [{ scale }] }]}>
      <LinearGradient colors={["#0f172a","#1e293b"]} style={s.xpBurstPill}>
        <Text style={s.xpBurstNum}>+{xp}</Text>
        <Text style={s.xpBurstLbl}>XP EARNED!</Text>
      </LinearGradient>
    </Animated.View>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
export default function PhraseScreen() {
  const { user }     = useAuth();
  const { language } = useLanguage();

  const [selectedLevel, setSelectedLevel] = useState("A1");
  const [phrases, setPhrases]             = useState([]);
  const [finishedIds, setFinishedIds]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [progress, setProgress]           = useState({ totalPhrases: 0, finishedPhrases: 0, percentage: 0 });
  const [showGerman, setShowGerman]       = useState(true);
  const [showAlbanian, setShowAlbanian]   = useState(true);
  const [playingId, setPlayingId]         = useState(null);
  const soundRef                          = useRef(null);

  const [dailyLimitInfo, setDailyLimitInfo] = useState({
    dailyLimit: FREE_DAILY_LIMIT,
    dailyUnlocksUsed: 0,
    remainingUnlocks: FREE_DAILY_LIMIT,
    dailyLimitReached: false,
    hoursUntilReset: 0,
    minutesUntilReset: 0,
    isPaid: false,
  });

  const [showXp, setShowXp]             = useState(false);
  const [animXp, setAnimXp]             = useState(0);
  const [showPremiumGate, setShowPremiumGate] = useState(false);

  // ── Matching quiz ──────────────────────────────────────────────────────────
  const [quizMode, setQuizMode]           = useState(false);
  const [quizPhrases, setQuizPhrases]     = useState([]);
  const [shuffledAlb, setShuffledAlb]     = useState([]);
  const [matches, setMatches]             = useState({});
  const [selectedGerman, setSelectedGerman] = useState(null);
  const [selectedAlb, setSelectedAlb]     = useState(null);
  const [wrongPair, setWrongPair]         = useState(null);
  const [quizScore, setQuizScore]         = useState(0);
  const [quizComplete, setQuizComplete]   = useState(false);
  const [streak, setStreak]               = useState(0);
  const [maxStreak, setMaxStreak]         = useState(0);
  const [wrongCount, setWrongCount]       = useState(0);

  // ── Listen quiz ────────────────────────────────────────────────────────────
  const [listenMode, setListenMode]         = useState(false);
  const [listenPhrases, setListenPhrases]   = useState([]);
  const [listenIdx, setListenIdx]           = useState(0);
  const [listenOptions, setListenOptions]   = useState([]);
  const [listenSelected, setListenSelected] = useState(null);
  const [listenScore, setListenScore]       = useState(0);
  const [listenComplete, setListenComplete] = useState(false);
  const [listenPlaying, setListenPlaying]   = useState(false);
  const listenSoundRef                      = useRef(null);

  const waveAnims = useRef(WAVE_HEIGHTS.map(() => new Animated.Value(1))).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 480, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (!wrongPair) return;
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -9, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  9, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -7, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  7, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -4, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  0, duration: 45, useNativeDriver: true }),
    ]).start();
  }, [wrongPair]);

  useEffect(() => { loadData(); }, [selectedLevel, language]);

  useEffect(() => {
    return () => {
      if (soundRef.current) soundRef.current.unloadAsync();
      if (listenSoundRef.current) listenSoundRef.current.unloadAsync();
    };
  }, []);

  useEffect(() => {
    if (!listenPlaying) {
      waveAnims.forEach((a) => a.setValue(1));
      return;
    }
    const anims = waveAnims.map((a, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(a, { toValue: 2.2, duration: 350 + (i % 4) * 120, useNativeDriver: true }),
          Animated.timing(a, { toValue: 1,   duration: 350 + (i % 4) * 120, useNativeDriver: true }),
        ])
      )
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [listenPlaying]);

  async function loadData(isRefresh = false) {
    if (!isRefresh) setLoading(true);
    try {
      const [phrasesRes, finishedRes, progressRes] = await Promise.all([
        phraseService.getPhrasesByLevel(selectedLevel, {}, language),
        phraseService.getFinishedPhrases(),
        phraseService.getUserPhraseProgress(selectedLevel),
      ]);
      setPhrases(phrasesRes.data || []);
      setFinishedIds((finishedRes.data || []).map((p) => p._id || p.id));
      const prog = progressRes.data || {};
      setProgress({ totalPhrases: prog.totalPhrases || 0, finishedPhrases: prog.finishedPhrases || 0, percentage: prog.percentage || 0 });
      if (prog.dailyLimit !== undefined) {
        setDailyLimitInfo({
          dailyLimit: prog.dailyLimit,
          dailyUnlocksUsed: prog.dailyUnlocksUsed || 0,
          remainingUnlocks: prog.remainingUnlocks ?? prog.dailyLimit,
          dailyLimitReached: prog.dailyLimitReached || false,
          hoursUntilReset: prog.hoursUntilReset || 0,
          minutesUntilReset: prog.minutesUntilReset || 0,
          isPaid: prog.isPaid || false,
        });
      }
    } catch {
      Alert.alert("Gabim", "Nuk mund të ngarkohen frazat");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function markAsFinished(phraseId, xp) {
    if (finishedIds.includes(phraseId)) return;
    if (dailyLimitInfo.dailyLimitReached) {
      Alert.alert("Limit i arritur", `Riset pas ${dailyLimitInfo.hoursUntilReset}h ${dailyLimitInfo.minutesUntilReset}min`);
      return;
    }
    try {
      const res = await phraseService.markPhraseAsFinished(phraseId);
      setFinishedIds((prev) => [...prev, phraseId]);
      if (res.data) {
        setDailyLimitInfo((prev) => ({
          ...prev,
          dailyUnlocksUsed: res.data.dailyUnlocksUsed ?? prev.dailyUnlocksUsed,
          remainingUnlocks: res.data.remainingUnlocks ?? prev.remainingUnlocks,
          dailyLimitReached: (res.data.remainingUnlocks ?? prev.remainingUnlocks) <= 0,
          isPaid: res.data.isPaid ?? prev.isPaid,
        }));
      }
      setAnimXp(xp);
      setShowXp(true);
      setTimeout(() => setShowXp(false), 1800);
      loadData(true);
    } catch (err) {
      if (err.response?.status === 429) {
        setDailyLimitInfo((prev) => ({ ...prev, dailyLimitReached: true }));
        Alert.alert("Limit i arritur", "Keni arritur limitin ditor të frazave falas.");
      } else {
        Alert.alert("Gabim", "Nuk mund të shënohet fraza");
      }
    }
  }

  async function speakPhrase(phrase) {
    const phraseId = phrase._id || phrase.id;
    if (playingId === phraseId) {
      if (soundRef.current) await soundRef.current.stopAsync();
      setPlayingId(null);
      return;
    }
    try {
      setPlayingId(phraseId);
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      if (soundRef.current) { await soundRef.current.unloadAsync(); soundRef.current = null; }
      const url = await ttsService.getPhraseAudio(phraseId, phrase.german, selectedLevel, language);
      if (!url) { setPlayingId(null); return; }
      const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((st) => {
        if (!st.isLoaded) return;
        if (st.didJustFinish) setPlayingId(null);
      });
    } catch {
      setPlayingId(null);
    }
  }

  // ── Matching quiz ──────────────────────────────────────────────────────────
  function startQuiz() {
    if (!dailyLimitInfo.isPaid) { setShowPremiumGate(true); return; }
    const finished = phrases.filter((p) => finishedIds.includes(p._id || p.id));
    if (finished.length < 4) {
      Alert.alert("Jo mjaftueshëm", "Përfundo të paktën 4 fraza para kuizit");
      return;
    }
    const size     = Math.min(10, finished.length);
    const selected = [...finished].sort(() => Math.random() - 0.5).slice(0, size);
    setQuizPhrases(selected);
    setShuffledAlb([...selected].sort(() => Math.random() - 0.5));
    setMatches({});
    setSelectedGerman(null);
    setSelectedAlb(null);
    setWrongPair(null);
    setQuizScore(0);
    setQuizComplete(false);
    setStreak(0);
    setMaxStreak(0);
    setWrongCount(0);
    setQuizMode(true);
  }

  function handleMatch(gId, aId) {
    if (gId === aId) {
      const newMatches = { ...matches, [gId]: aId };
      const newStreak  = streak + 1;
      setMatches(newMatches);
      setStreak(newStreak);
      setMaxStreak((prev) => Math.max(prev, newStreak));
      setSelectedGerman(null);
      setSelectedAlb(null);
      setWrongPair(null);
      if (Object.keys(newMatches).length === quizPhrases.length) {
        setQuizComplete(true);
        const xp = Object.keys(newMatches).length;
        phraseService.addQuizXp(xp).catch(() => {});
        setAnimXp(xp);
        setShowXp(true);
        setTimeout(() => setShowXp(false), 1800);
      } else {
        setQuizScore((p) => p + 1);
      }
    } else {
      setStreak(0);
      setWrongCount((p) => p + 1);
      setWrongPair({ german: gId, albanian: aId });
      setTimeout(() => { setWrongPair(null); setSelectedGerman(null); setSelectedAlb(null); }, 700);
    }
  }

  function exitQuiz() {
    setQuizMode(false); setQuizComplete(false); setMatches({});
    setQuizScore(0); setSelectedGerman(null); setSelectedAlb(null);
    setWrongPair(null); setStreak(0); setMaxStreak(0); setWrongCount(0);
  }

  // ── Listen quiz ────────────────────────────────────────────────────────────
  function buildListenOptions(correct, pool) {
    const others = pool.filter((p) => (p._id || p.id) !== (correct._id || correct.id));
    const wrong  = [...others].sort(() => Math.random() - 0.5).slice(0, 3);
    return [...wrong, correct].sort(() => Math.random() - 0.5);
  }

  function startListenQuiz() {
    if (!dailyLimitInfo.isPaid) { setShowPremiumGate(true); return; }
    const finished = phrases.filter((p) => finishedIds.includes(p._id || p.id));
    if (finished.length < 4) {
      Alert.alert("Jo mjaftueshëm", "Përfundo të paktën 4 fraza para kuizit të dëgjimit");
      return;
    }
    const size     = Math.min(10, finished.length);
    const selected = [...finished].sort(() => Math.random() - 0.5).slice(0, size);
    setListenPhrases(selected);
    setListenIdx(0);
    setListenOptions(buildListenOptions(selected[0], finished));
    setListenSelected(null);
    setListenScore(0);
    setListenComplete(false);
    setListenPlaying(false);
    setListenMode(true);
  }

  async function playListenAudio(phrase) {
    if (!phrase || listenPlaying) return;
    try {
      setListenPlaying(true);
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      if (listenSoundRef.current) { await listenSoundRef.current.unloadAsync(); listenSoundRef.current = null; }
      const url = await ttsService.getPhraseAudio(phrase._id || phrase.id, phrase.german, selectedLevel, language);
      if (!url) { setListenPlaying(false); return; }
      const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
      listenSoundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((st) => {
        if (!st.isLoaded) return;
        if (st.didJustFinish) setListenPlaying(false);
      });
    } catch {
      setListenPlaying(false);
    }
  }

  function handleListenAnswer(option) {
    if (listenSelected !== null) return;
    const correctId  = listenPhrases[listenIdx]?._id || listenPhrases[listenIdx]?.id;
    const selectedId = option._id || option.id;
    setListenSelected(selectedId);
    const isCorrect = selectedId === correctId;
    if (isCorrect) setListenScore((s) => s + 1);
    setTimeout(() => nextListenQuestion(isCorrect ? 1 : 0), 900);
  }

  async function nextListenQuestion(scoreToAdd = 0) {
    const next     = listenIdx + 1;
    const newScore = listenScore + scoreToAdd;
    if (next >= listenPhrases.length) {
      setListenComplete(true);
      phraseService.addQuizXp(newScore).catch(() => {});
      setAnimXp(newScore);
      setShowXp(true);
      setTimeout(() => setShowXp(false), 1800);
      return;
    }
    const finished = phrases.filter((p) => finishedIds.includes(p._id || p.id));
    setListenIdx(next);
    setListenOptions(buildListenOptions(listenPhrases[next], finished));
    setListenSelected(null);
    setListenPlaying(false);
  }

  function exitListenQuiz() {
    if (listenSoundRef.current) listenSoundRef.current.unloadAsync();
    setListenMode(false); setListenComplete(false);
    setListenIdx(0); setListenScore(0);
    setListenSelected(null); setListenPlaying(false);
  }

  const progressPct = progress.totalPhrases > 0 ? (progress.finishedPhrases / progress.totalPhrases) * 100 : 0;
  const headerSlide = headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] });

  if (loading && !phrases.length) {
    return <View style={[s.root, { alignItems: "center", justifyContent: "center" }]}><ActivityIndicator color="#ea580c" size="large" /></View>;
  }

  // ── MATCHING QUIZ COMPLETE ─────────────────────────────────────────────────
  if (quizMode && quizComplete) {
    const correct = Object.keys(matches).length;
    const total   = quizPhrases.length;
    const stars   = wrongCount === 0 ? 3 : wrongCount <= 2 ? 2 : 1;
    return (
      <SafeAreaView style={s.root}>
        <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
          <LinearGradient colors={["#7c3aed", "#4f46e5", "#0891b2"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.completeHero}>
            <Ionicons name="trophy" size={54} color="#fff" style={{ marginBottom: 10, opacity: 0.95 }} />
            <Text style={s.completeTitle}>
              {wrongCount === 0 ? "Perfekt! 🎉" : wrongCount <= 2 ? "Shumë Mirë! 🌟" : "Kualifikuar!"}
            </Text>
            <Text style={s.completeSub}>
              {wrongCount === 0 ? "Asnjë gabim — Fenomenal!" : `${wrongCount} gabime — Vazhdo të praktikosh!`}
            </Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              {[1, 2, 3].map((s2) => (
                <Text key={s2} style={{ fontSize: 34, opacity: s2 <= stars ? 1 : 0.2 }}>⭐</Text>
              ))}
            </View>
          </LinearGradient>

          <View style={s.statsRow}>
            {[
              { label: "Çifte Saktë", value: `${correct}/${total}`, color: "#10b981", bg: "#f0fdf4", border: "#a7f3d0" },
              { label: "XP Fituar",   value: `+${correct}`,          color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
              { label: "Streak Max",  value: maxStreak,               color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe" },
            ].map((st) => (
              <View key={st.label} style={[s.statBox, { backgroundColor: st.bg, borderColor: st.border }]}>
                <Text style={[s.statVal, { color: st.color }]}>{st.value}</Text>
                <Text style={s.statLbl}>{st.label}</Text>
              </View>
            ))}
          </View>

          <View style={s.completeBtns}>
            <TouchableOpacity style={s.exitBtn} onPress={exitQuiz}>
              <Ionicons name="close" size={14} color="#64748b" />
              <Text style={s.exitBtnText}>Dil</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={startQuiz} style={{ flex: 2 }}>
              <LinearGradient colors={["#06b6d4", "#818cf8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.retryBtn}>
                <Ionicons name="refresh" size={15} color="#fff" />
                <Text style={s.retryBtnText}>Fillo Përsëri</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
        <XpAnimation xp={animXp} visible={showXp} />
      </SafeAreaView>
    );
  }

  // ── MATCHING QUIZ ACTIVE ───────────────────────────────────────────────────
  if (quizMode) {
    const matched = Object.keys(matches).length;
    const total   = quizPhrases.length;
    const pct     = total > 0 ? (matched / total) * 100 : 0;

    return (
      <SafeAreaView style={s.root}>
        {/* Top bar */}
        <View style={s.quizBar}>
          <TouchableOpacity style={s.quizCloseBtn} onPress={exitQuiz}>
            <Ionicons name="close" size={18} color="#64748b" />
          </TouchableOpacity>
          <View style={s.quizBarProgress}>
            <View style={[s.quizBarFill, { width: `${pct}%` }]} />
          </View>
          {/* Streak chip */}
          <View style={[s.streakChip, streak > 0 && s.streakChipActive]}>
            <Ionicons name="flash" size={11} color={streak > 0 ? "#d97706" : "#cbd5e1"} />
            <Text style={[s.streakText, streak > 0 && { color: "#d97706" }]}>{streak}</Text>
          </View>
          <Text style={s.quizBarCount}>{matched}/{total}</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          <Text style={s.quizInstruct}>Lidh frazën me përkthimin e saj</Text>

          <View style={s.quizColHeaders}>
            <View style={[s.quizColHead, { backgroundColor: "rgba(6,182,212,0.1)", borderColor: "rgba(6,182,212,0.3)" }]}>
              <Text style={[s.quizColHeadText, { color: "#0891b2" }]}>Gjermanisht</Text>
            </View>
            <View style={[s.quizColHead, { backgroundColor: "rgba(139,92,246,0.1)", borderColor: "rgba(139,92,246,0.3)" }]}>
              <Text style={[s.quizColHeadText, { color: "#7c3aed" }]}>Shqip</Text>
            </View>
          </View>

          {quizPhrases.map((gPhrase, idx) => {
            const gId      = gPhrase._id || gPhrase.id;
            const aPhrase  = shuffledAlb[idx];
            const aId      = aPhrase?._id || aPhrase?.id;
            const gMatched = !!matches[gId];
            const aMatched = Object.values(matches).includes(aId);
            const gSel     = selectedGerman === gId;
            const aSel     = selectedAlb === aId;
            const gWrong   = wrongPair?.german === gId;
            const aWrong   = wrongPair?.albanian === aId;

            const gStyle = gMatched ? s.quizPillMatched : gWrong ? s.quizPillWrong : gSel ? s.quizPillSelG : s.quizPill;
            const aStyle = aMatched ? s.quizPillMatched : aWrong ? s.quizPillWrong : aSel ? s.quizPillSelA : s.quizPill;
            const gTextColor = gMatched ? "#059669" : gWrong ? "#dc2626" : gSel ? "#0e7490" : "#1e293b";
            const aTextColor = aMatched ? "#059669" : aWrong ? "#dc2626" : aSel ? "#6d28d9" : "#1e293b";

            return (
              <View key={String(gId)} style={s.quizRow}>
                <Animated.View style={[{ flex: 1 }, gWrong && { transform: [{ translateX: shakeAnim }] }]}>
                  <TouchableOpacity
                    disabled={gMatched}
                    style={[s.quizPillBase, { flex: 1 }, gStyle]}
                    onPress={() => {
                      if (gSel) { setSelectedGerman(null); return; }
                      setSelectedGerman(gId);
                      if (selectedAlb) handleMatch(gId, selectedAlb);
                    }}
                  >
                    {gMatched && <Ionicons name="checkmark" size={11} color="#059669" style={{ marginRight: 4 }} />}
                    <Text style={[s.quizPillText, { color: gTextColor }]} numberOfLines={2}>{gPhrase.german}</Text>
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View style={[{ flex: 1 }, aWrong && { transform: [{ translateX: shakeAnim }] }]}>
                  <TouchableOpacity
                    disabled={aMatched || !aPhrase}
                    style={[s.quizPillBase, { flex: 1 }, aStyle]}
                    onPress={() => {
                      if (!aPhrase) return;
                      if (aSel) { setSelectedAlb(null); return; }
                      if (selectedGerman) handleMatch(selectedGerman, aId);
                      else setSelectedAlb(aId);
                    }}
                  >
                    {aMatched && <Ionicons name="checkmark" size={11} color="#059669" style={{ marginRight: 4 }} />}
                    <Text style={[s.quizPillText, { color: aTextColor }]} numberOfLines={2}>{aPhrase?.albanian}</Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            );
          })}
        </ScrollView>
        <XpAnimation xp={animXp} visible={showXp} />
      </SafeAreaView>
    );
  }

  // ── LISTEN QUIZ COMPLETE ───────────────────────────────────────────────────
  if (listenMode && listenComplete) {
    const pct = Math.round((listenScore / listenPhrases.length) * 100);
    return (
      <SafeAreaView style={s.root}>
        <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
          <LinearGradient colors={["#6366f1", "#4f46e5", "#4338ca"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.completeHero}>
            <View style={s.listenIconWrap}>
              <Ionicons name="headset" size={36} color="#fff" />
            </View>
            <Text style={s.completeTitle}>
              {listenScore >= Math.ceil(listenPhrases.length * 0.6) ? "Urime! 🎉" : "Provo Përsëri!"}
            </Text>
            <Text style={s.completeSub}>
              {listenScore >= Math.ceil(listenPhrases.length * 0.6) ? "Kuizi i dëgjimit u krye!" : "Vazhdo të praktikosh dëgjimin."}
            </Text>
          </LinearGradient>

          <View style={s.statsRow}>
            {[
              { label: "Saktë",    value: `${listenScore}/${listenPhrases.length}`, color: "#6366f1", bg: "#eef2ff", border: "#c7d2fe" },
              { label: "Saktësi", value: `${pct}%`,                                 color: "#0ea5e9", bg: "#f0f9ff", border: "#bae6fd" },
              { label: "XP Fituar", value: `+${listenScore}`,                        color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
            ].map((st) => (
              <View key={st.label} style={[s.statBox, { backgroundColor: st.bg, borderColor: st.border }]}>
                <Text style={[s.statVal, { color: st.color }]}>{st.value}</Text>
                <Text style={s.statLbl}>{st.label}</Text>
              </View>
            ))}
          </View>

          <View style={s.completeBtns}>
            <TouchableOpacity style={s.exitBtn} onPress={exitListenQuiz}>
              <Ionicons name="close" size={14} color="#64748b" />
              <Text style={s.exitBtnText}>Dil</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={startListenQuiz} style={{ flex: 2 }}>
              <LinearGradient colors={["#6366f1", "#4f46e5"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.retryBtn}>
                <Ionicons name="refresh" size={15} color="#fff" />
                <Text style={s.retryBtnText}>Provo Përsëri</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
        <XpAnimation xp={animXp} visible={showXp} />
      </SafeAreaView>
    );
  }

  // ── LISTEN QUIZ ACTIVE ─────────────────────────────────────────────────────
  if (listenMode) {
    const currentPhrase = listenPhrases[listenIdx];
    const correctId     = currentPhrase?._id || currentPhrase?.id;
    const pct           = listenPhrases.length > 0 ? (listenIdx / listenPhrases.length) * 100 : 0;

    return (
      <SafeAreaView style={s.root}>
        {/* Top bar */}
        <View style={s.quizBar}>
          <TouchableOpacity onPress={exitListenQuiz} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="arrow-back" size={16} color="#64748b" />
            <Text style={{ fontSize: 13, fontFamily: F.semi, color: "#64748b" }}>Frazat</Text>
          </TouchableOpacity>
          <View style={[s.quizBarProgress, { flex: 1 }]}>
            <View style={[s.quizBarFillIndigo, { width: `${pct}%` }]} />
          </View>
          <Text style={[s.quizBarCount, { color: "#6366f1" }]}>{listenIdx + 1}/{listenPhrases.length}</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <Text style={s.quizInstruct}>Dëgjo dhe zgjedh frazën e saktë</Text>

          {/* Player card */}
          <View style={s.playerCard}>
            {/* Animated waveform */}
            <View style={s.waveRow}>
              {WAVE_HEIGHTS.map((h, i) => (
                <Animated.View
                  key={i}
                  style={[s.waveBar, { height: h, transform: [{ scaleY: waveAnims[i] }] }]}
                />
              ))}
            </View>

            <TouchableOpacity
              onPress={() => playListenAudio(currentPhrase)}
              disabled={listenPlaying}
              style={[s.playBtn, listenPlaying && { opacity: 0.75 }]}
              activeOpacity={0.85}
            >
              <LinearGradient colors={["#4f46e5", "#6366f1"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.playBtnGrad}>
                <Ionicons name={listenPlaying ? "pause" : "play"} size={20} color="#fff" style={{ marginLeft: listenPlaying ? 0 : 2 }} />
                <Text style={s.playBtnText}>{listenPlaying ? "Duke luajtur..." : "Dëgjo"}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* 2×2 options */}
          <View style={s.optionsGrid}>
            {listenOptions.map((option, idx) => {
              const optId      = option._id || option.id;
              const isCorrect  = optId === correctId;
              const isSelected = listenSelected === optId;
              const answered   = listenSelected !== null;

              let borderColor = "#e2e8f0";
              let bgColor     = "#fff";
              let letterColor = "#818cf8";
              let textColor   = "#1e293b";
              let iconName    = null;
              let iconColor   = "#818cf8";

              if (answered) {
                if (isCorrect) {
                  borderColor = "#22c55e"; iconName = "checkmark"; iconColor = "#22c55e"; letterColor = "#22c55e";
                } else if (isSelected) {
                  borderColor = "#ef4444"; iconName = "close"; iconColor = "#ef4444"; letterColor = "#ef4444"; textColor = "#94a3b8";
                } else {
                  borderColor = "#e2e8f0"; textColor = "#cbd5e1"; letterColor = "#cbd5e1";
                }
              }

              return (
                <TouchableOpacity
                  key={String(optId)}
                  disabled={answered}
                  onPress={() => handleListenAnswer(option)}
                  style={[s.optionCard, { borderColor, backgroundColor: bgColor, opacity: answered && !isCorrect && !isSelected ? 0.5 : 1 }]}
                  activeOpacity={0.85}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 5 }}>
                    <Text style={[s.optionLetter, { color: letterColor }]}>{LETTERS[idx]}</Text>
                    {iconName && <Ionicons name={iconName} size={12} color={iconColor} />}
                  </View>
                  <Text style={[s.optionText, { color: textColor }]} numberOfLines={3}>{option.albanian}</Text>
                  {answered && isCorrect && (
                    <Text style={s.optionSub} numberOfLines={1}>{option.german}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
        <XpAnimation xp={animXp} visible={showXp} />
      </SafeAreaView>
    );
  }

  // ── MAIN LIST ─────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <FlatList
        data={phrases}
        keyExtractor={(item) => String(item._id || item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(true); }} tintColor="#ea580c" />}
        contentContainerStyle={s.listContent}
        ListHeaderComponent={
          <Animated.View style={{ opacity: headerAnim, transform: [{ translateY: headerSlide }] }}>
            <LinearGradient colors={["#7c2d12", "#c2410c", "#ea580c"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
              <SafeAreaView edges={["top"]}>
                {/* Title row */}
                <View style={s.heroRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.heroLabel}>PRAKTIKË GJUHËSORE</Text>
                    <Text style={s.heroTitle}>Fraza Gjermane</Text>
                    <Text style={s.heroSub}>Mëso fraza të zakonshme</Text>
                  </View>

                </View>

                {/* Progress bar */}
                <View style={s.progressRow}>
                  <View style={s.progressBg}>
                    <View style={[s.progressFill, { width: `${progressPct}%` }]} />
                  </View>
                  <Text style={s.progressLbl}>{Math.round(progressPct)}%</Text>
                </View>

                {/* Level tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 14 }} contentContainerStyle={{ gap: 8, paddingRight: 4 }}>
                  {LEVELS.map((level) =>
                    selectedLevel === level ? (
                      <LinearGradient key={level} colors={["#14b8a6", "#06b6d4"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.levelTabActive}>
                        <Text style={s.levelTabTextActive}>{level}</Text>
                      </LinearGradient>
                    ) : (
                      <TouchableOpacity key={level} style={s.levelTab} onPress={() => setSelectedLevel(level)}>
                        <Text style={s.levelTabText}>{level}</Text>
                      </TouchableOpacity>
                    )
                  )}
                </ScrollView>

                {/* Controls row */}
                <View style={s.controls}>
                  <TouchableOpacity style={[s.toggleBtn, showGerman && s.toggleBtnDE]} onPress={() => setShowGerman(!showGerman)}>
                    <Ionicons name={showGerman ? "eye" : "eye-off"} size={13} color={showGerman ? "#2563eb" : "#94a3b8"} />
                    <Text style={[s.toggleBtnText, showGerman && { color: "#2563eb" }]}>DE</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.toggleBtn, showAlbanian && s.toggleBtnAL]} onPress={() => setShowAlbanian(!showAlbanian)}>
                    <Ionicons name={showAlbanian ? "eye" : "eye-off"} size={13} color={showAlbanian ? "#7c3aed" : "#94a3b8"} />
                    <Text style={[s.toggleBtnText, showAlbanian && { color: "#7c3aed" }]}>AL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={startQuiz} style={{ flex: 1 }}>
                    <LinearGradient colors={["#f59e0b", "#ea580c"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.quizStartBtn}>
                      <Ionicons name={dailyLimitInfo.isPaid ? "shuffle" : "lock-closed"} size={13} color="#fff" />
                      <Text style={s.quizStartText}>Kuiz</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={startListenQuiz} style={{ flex: 1 }}>
                    <LinearGradient colors={["#14b8a6", "#06b6d4"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.quizStartBtn}>
                      <Ionicons name={dailyLimitInfo.isPaid ? "headset" : "lock-closed"} size={13} color="#fff" />
                      <Text style={s.quizStartText}>Dëgjim</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </LinearGradient>

            {/* Daily limit banner */}
            {dailyLimitInfo.dailyLimitReached ? (
              <View style={s.limitBanner}>
                <LinearGradient colors={["#f97316", "#f59e0b"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.limitBannerTop}>
                  <Ionicons name="star" size={14} color="#fff" />
                  <Text style={s.limitBannerTitle}>Limiti ditor i arritur</Text>
                  <Text style={s.limitBannerReset}>Riset pas {dailyLimitInfo.hoursUntilReset}h {dailyLimitInfo.minutesUntilReset}min</Text>
                </LinearGradient>
                <View style={s.limitBannerBody}>
                  <Text style={s.limitBannerDesc}>
                    Keni hapur të gjitha <Text style={{ color: "#f97316", fontFamily: F.bold }}>{FREE_DAILY_LIMIT} frazat falas</Text> të sotit.
                  </Text>
                </View>
              </View>
            ) : (
              <View style={[s.limitInfoRow, dailyLimitInfo.isPaid && { backgroundColor: "#fffbeb", borderColor: "#fde68a" }]}>
                <Ionicons name={dailyLimitInfo.isPaid ? "star" : "time"} size={14} color={dailyLimitInfo.isPaid ? "#f59e0b" : "#14b8a6"} />
                <Text style={[s.limitInfoText, dailyLimitInfo.isPaid && { color: "#92400e" }]}>
                  {dailyLimitInfo.isPaid ? "Premium" : "Plan Falas"} · {dailyLimitInfo.remainingUnlocks}/{dailyLimitInfo.dailyLimit} fraza sot
                </Text>
                <View style={s.limitDots}>
                  {Array.from({ length: dailyLimitInfo.dailyLimit }).map((_, i) => (
                    <View
                      key={i}
                      style={[s.limitDot, i < (dailyLimitInfo.dailyLimit - dailyLimitInfo.remainingUnlocks) && (dailyLimitInfo.isPaid ? s.limitDotPaid : s.limitDotFree)]}
                    />
                  ))}
                </View>
              </View>
            )}
          </Animated.View>
        }
        renderItem={({ item, index }) => {
          const isFinished = finishedIds.includes(item._id || item.id);
          const prevDone   = index === 0 || finishedIds.includes(phrases[index - 1]?._id || phrases[index - 1]?.id);
          const isLocked   = !isFinished && !prevDone;
          const canUnlock  = !isLocked && !isFinished && !dailyLimitInfo.dailyLimitReached;
          return (
            <PhraseCard
              item={item}
              isFinished={isFinished}
              isLocked={isLocked}
              canUnlock={canUnlock}
              onMark={() => markAsFinished(item._id || item.id, item.xp)}
              onLimit={() => Alert.alert("Limit i arritur", `Riset pas ${dailyLimitInfo.hoursUntilReset}h ${dailyLimitInfo.minutesUntilReset}min`)}
              onSpeak={speakPhrase}
              isPlaying={playingId === (item._id || item.id)}
              index={index}
              showGerman={showGerman}
              showAlbanian={showAlbanian}
            />
          );
        }}
      />
      <XpAnimation xp={animXp} visible={showXp} />

      {/* ── Premium gate modal ───────────────────────────────────────── */}
      <Modal visible={showPremiumGate} transparent animationType="fade" onRequestClose={() => setShowPremiumGate(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowPremiumGate(false)}>
          <TouchableOpacity activeOpacity={1} style={s.premiumCard}>
            <LinearGradient colors={["#7c3aed", "#4f46e5", "#0891b2"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.premiumCardHeader}>
              <View style={s.premiumLockCircle}>
                <Ionicons name="lock-closed" size={28} color="#fff" />
              </View>
              <Text style={s.premiumCardTitle}>Veçori Premium</Text>
              <Text style={s.premiumCardSub}>Kuizi i përputhjes dhe dëgjimit{"\n"}janë ekskluzive për anëtarët Premium</Text>
            </LinearGradient>

            <View style={s.premiumCardBody}>
              {[
                { icon: "shuffle",         text: "Kuiz përputhje frazash" },
                { icon: "headset",         text: "Kuiz dëgjimi interaktiv" },
                { icon: "infinite",        text: "Fraza të pakufizuara çdo ditë" },
                { icon: "flash",           text: "XP shtesë për çdo kuiz" },
              ].map(({ icon, text }) => (
                <View key={icon} style={s.premiumFeatureRow}>
                  <View style={s.premiumFeatureIcon}>
                    <Ionicons name={icon} size={14} color="#7c3aed" />
                  </View>
                  <Text style={s.premiumFeatureText}>{text}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={s.premiumCloseBtn} onPress={() => setShowPremiumGate(false)}>
              <Text style={s.premiumCloseBtnText}>Mbyll</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#faf8f5" },

  // Hero
  hero:         { paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  heroRow:      { flexDirection: "row", alignItems: "flex-start", marginBottom: 14 },
  heroLabel:    { color: "rgba(255,255,255,0.7)", fontSize: 10, fontFamily: F.bold, letterSpacing: 1.2, marginBottom: 4 },
  heroTitle:    { color: "#fff", fontSize: 26, fontFamily: F.black, letterSpacing: -0.5, marginBottom: 4 },
  heroSub:      { color: "rgba(255,255,255,0.65)", fontSize: 12, fontFamily: F.regular },


  // Progress bar
  progressRow:  { flexDirection: "row", alignItems: "center", gap: 10 },
  progressBg:   { flex: 1, height: 7, backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 99, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 99 },
  progressLbl:  { color: "rgba(255,255,255,0.8)", fontSize: 11, fontFamily: F.bold, minWidth: 28, textAlign: "right" },

  // Level tabs
  levelTab:           { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  levelTabActive:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  levelTabText:       { color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: F.bold },
  levelTabTextActive: { color: "#fff", fontSize: 12, fontFamily: F.xbold },

  // Controls
  controls:      { flexDirection: "row", gap: 8, marginTop: 14 },
  toggleBtn:     { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.4)" },
  toggleBtnDE:   { backgroundColor: "#eff6ff", borderColor: "#bfdbfe" },
  toggleBtnAL:   { backgroundColor: "#f5f3ff", borderColor: "#ddd6fe" },
  toggleBtnText: { fontSize: 12, fontFamily: F.bold, color: "#94a3b8" },
  quizStartBtn:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 10 },
  quizStartText: { color: "#fff", fontSize: 12, fontFamily: F.xbold },

  // Daily limit banner
  limitBanner:     { marginHorizontal: 16, marginTop: 12, marginBottom: 16, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: "#fed7aa" },
  limitBannerTop:  { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10 },
  limitBannerTitle:{ color: "#fff", fontFamily: F.bold, fontSize: 13, flex: 1 },
  limitBannerReset:{ color: "rgba(255,255,255,0.8)", fontSize: 11 },
  limitBannerBody: { backgroundColor: "#fff", paddingHorizontal: 14, paddingVertical: 10 },
  limitBannerDesc: { fontSize: 12, color: "#374151" },
  limitInfoRow:    { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 10, marginBottom: 16, backgroundColor: "#f0fdfa", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: "#ccfbf1" },
  limitInfoText:   { fontSize: 12, fontFamily: F.semi, color: "#0f766e", flex: 1 },
  limitDots:       { flexDirection: "row", gap: 4 },
  limitDot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: "#e2e8f0" },
  limitDotFree:    { backgroundColor: "#14b8a6" },
  limitDotPaid:    { backgroundColor: "#f59e0b" },

  // List
  listContent: { paddingHorizontal: 16, paddingTop: 32, paddingBottom: 32 },

  // Phrase card
  phraseCard:       { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, borderWidth: 1.5, borderBottomWidth: 4, borderColor: "#ede9e3", borderBottomColor: "#d4cfc8", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  phraseCardDone:   { backgroundColor: "#f0fdf4", borderColor: "#a7f3d0", borderBottomColor: "#6ee7b7" },
  phraseCardLocked: { borderColor: "#e2e8f0", borderBottomColor: "#c8d0da" },
  phraseAccent:     { width: 4, alignSelf: "stretch", borderTopLeftRadius: 14, borderBottomLeftRadius: 14 },
  phraseBody:       { flex: 1, paddingHorizontal: 14, paddingVertical: 14 },
  germanText:       { color: "#0f172a", fontSize: 15, fontFamily: F.xbold, letterSpacing: -0.2, flexShrink: 1 },
  albanianText:     { color: "#64748b", fontSize: 13, fontFamily: F.regular },
  lockedLine:       { height: 14, backgroundColor: "#e2e8f0", borderRadius: 6, marginBottom: 8, width: "70%" },
  xpChip:           { color: "#d97706", fontSize: 11, fontFamily: F.bold, marginTop: 7 },
  phraseRight:      { paddingRight: 16, paddingLeft: 4 },
  markBtnGrad:      { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", shadowColor: "#10b981", shadowOpacity: 0.4, shadowRadius: 8, elevation: 3 },
  lockCircle:       { width: 36, height: 36, borderRadius: 10, backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#e2e8f0", alignItems: "center", justifyContent: "center" },
  crownBtn:         { width: 36, height: 36, borderRadius: 10, backgroundColor: "#fffbeb", borderWidth: 1.5, borderColor: "#fde68a", alignItems: "center", justifyContent: "center" },
  audioBtn:         { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: "#14b8a6", alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  audioBtnActive:   { backgroundColor: "#14b8a6", borderColor: "#14b8a6" },

  // Quiz top bar
  quizBar:         { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  quizCloseBtn:    { width: 32, height: 32, borderRadius: 16, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },
  quizBarProgress: { flex: 1, height: 8, backgroundColor: "#e2e8f0", borderRadius: 99, overflow: "hidden" },
  quizBarFill:     { height: "100%", backgroundColor: "#06b6d4", borderRadius: 99 },
  quizBarFillIndigo:{ height: "100%", backgroundColor: "#6366f1", borderRadius: 99 },
  quizBarCount:    { fontSize: 12, fontFamily: F.bold, color: "#64748b", minWidth: 30, textAlign: "right" },
  streakChip:      { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#f1f5f9", borderRadius: 99, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: "#e2e8f0" },
  streakChipActive:{ backgroundColor: "rgba(251,191,36,0.12)", borderColor: "rgba(251,191,36,0.4)" },
  streakText:      { fontSize: 11, fontFamily: F.xbold, color: "#cbd5e1" },

  // Quiz pairs
  quizInstruct:    { textAlign: "center", fontSize: 11, fontFamily: F.bold, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 },
  quizColHeaders:  { flexDirection: "row", gap: 10, marginBottom: 10 },
  quizColHead:     { flex: 1, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  quizColHeadText: { fontSize: 11, fontFamily: F.bold },
  quizRow:         { flexDirection: "row", gap: 10, marginBottom: 10 },
  quizPillBase:    { flex: 1, flexDirection: "row", alignItems: "center", borderRadius: 10, borderWidth: 1.5, borderBottomWidth: 4, paddingHorizontal: 10, paddingVertical: 11, minHeight: 46, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.09, shadowRadius: 3, elevation: 3 },
  quizPill:        { backgroundColor: "#fff", borderColor: "#e2e8f0", borderBottomColor: "#c8d0da" },
  quizPillSelG:    { backgroundColor: "rgba(6,182,212,0.1)", borderColor: "#06b6d4", borderBottomColor: "#0e7490" },
  quizPillSelA:    { backgroundColor: "rgba(139,92,246,0.1)", borderColor: "#8b5cf6", borderBottomColor: "#6d28d9" },
  quizPillWrong:   { backgroundColor: "rgba(239,68,68,0.08)", borderColor: "#ef4444", borderBottomColor: "#b91c1c" },
  quizPillMatched: { backgroundColor: "rgba(34,197,94,0.12)", borderColor: "#22c55e", borderBottomColor: "#16a34a" },
  quizPillText:    { flex: 1, fontSize: 12, fontFamily: F.semi, color: "#1e293b", lineHeight: 16 },

  // Quiz complete
  completeHero:  { borderRadius: 24, padding: 36, alignItems: "center", marginBottom: 20 },
  completeTitle: { color: "#fff", fontSize: 26, fontFamily: F.black, marginBottom: 6, textAlign: "center" },
  completeSub:   { color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: F.regular, textAlign: "center" },
  statsRow:      { flexDirection: "row", gap: 10, marginBottom: 20 },
  statBox:       { flex: 1, alignItems: "center", paddingVertical: 16, borderRadius: 16, borderWidth: 1 },
  statVal:       { fontSize: 20, fontFamily: F.black, marginBottom: 4 },
  statLbl:       { fontSize: 10, fontFamily: F.semi, color: "#94a3b8", textAlign: "center" },
  completeBtns:  { flexDirection: "row", gap: 10 },
  exitBtn:       { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#f1f5f9", borderRadius: 16, paddingVertical: 14, borderWidth: 1, borderColor: "#e2e8f0" },
  exitBtnText:   { color: "#64748b", fontSize: 14, fontFamily: F.bold },
  retryBtn:      { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 16, paddingVertical: 14 },
  retryBtnText:  { color: "#fff", fontSize: 14, fontFamily: F.bold },

  // Listen quiz
  playerCard:    { backgroundColor: "#fff", borderRadius: 24, padding: 28, alignItems: "center", marginBottom: 16, borderWidth: 1, borderColor: "#f1f5f9", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  waveRow:       { flexDirection: "row", alignItems: "center", gap: 3, height: 40, marginBottom: 22 },
  waveBar:       { width: 3, borderRadius: 99, backgroundColor: "#a5b4fc" },
  playBtn:       { width: "100%" },
  playBtnGrad:   { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 99, paddingVertical: 14, paddingHorizontal: 36 },
  playBtnText:   { color: "#fff", fontSize: 16, fontFamily: F.xbold },
  optionsGrid:   { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  optionCard:    { width: (width - 44) / 2, backgroundColor: "#fff", borderRadius: 18, borderWidth: 2, padding: 16, alignItems: "center" },
  optionLetter:  { fontSize: 13, fontFamily: F.xbold },
  optionText:    { fontSize: 13, fontFamily: F.semi, textAlign: "center", lineHeight: 18 },
  optionSub:     { fontSize: 11, color: "#94a3b8", marginTop: 4, textAlign: "center" },
  listenIconWrap:{ width: 72, height: 72, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 16 },

  // XP float
  xpFloat:      { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", zIndex: 99 },
  xpBurstPill:  { alignItems: "center", borderRadius: 28, paddingHorizontal: 36, paddingVertical: 24, borderWidth: 1, borderColor: "rgba(16,185,129,0.4)", shadowColor: "#10b981", shadowOpacity: 0.4, shadowRadius: 24, elevation: 20 },
  xpBurstNum:   { color: "#34d399", fontSize: 56, fontFamily: F.black, lineHeight: 60 },
  xpBurstLbl:   { color: "rgba(255,255,255,0.6)", fontSize: 13, fontFamily: F.xbold, letterSpacing: 1.5, marginTop: 4 },

  // Premium gate modal
  modalOverlay:       { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", padding: 24 },
  premiumCard:        { width: "100%", borderRadius: 24, backgroundColor: "#fff", overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 24, elevation: 12 },
  premiumCardHeader:  { alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 },
  premiumLockCircle:  { width: 64, height: 64, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 14, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.3)" },
  premiumCardTitle:   { color: "#fff", fontSize: 22, fontFamily: F.black, marginBottom: 8 },
  premiumCardSub:     { color: "rgba(255,255,255,0.75)", fontSize: 13, fontFamily: F.regular, textAlign: "center", lineHeight: 20 },
  premiumCardBody:    { padding: 20, gap: 12 },
  premiumFeatureRow:  { flexDirection: "row", alignItems: "center", gap: 12 },
  premiumFeatureIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: "#f5f3ff", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#ddd6fe" },
  premiumFeatureText: { color: "#1e293b", fontSize: 13, fontFamily: F.semi, flex: 1 },
  premiumCloseBtn:    { margin: 20, marginTop: 4, backgroundColor: "#f1f5f9", borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0" },
  premiumCloseBtnText:{ color: "#64748b", fontSize: 14, fontFamily: F.bold },
});
