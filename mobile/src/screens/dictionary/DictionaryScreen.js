import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Audio } from "expo-av";
import {
  dictionaryService,
  favoritesService,
  ttsService,
  wordsService,
} from "../../services/api";
import { useLanguage } from "../../context/LanguageContext";

const FREE_DAILY_LIMIT = 5;
const PAID_DAILY_LIMIT = 25;
const WORDS_PER_PAGE = 32;
const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = (SCREEN_W - 36 - 10) / 2;

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

function getLevelStyle(level) {
  switch (level) {
    case "A1": return { bg: "#ecfdf5", text: "#065f46", border: "#a7f3d0" };
    case "A2": return { bg: "#d1fae5", text: "#064e3b", border: "#6ee7b7" };
    case "B1": return { bg: "#ccfbf1", text: "#0f766e", border: "#5eead4" };
    case "B2": return { bg: "#99f6e4", text: "#134e4a", border: "#2dd4bf" };
    case "C1": return { bg: "#0891b2", text: "#ffffff", border: "#0891b2" };
    case "C2": return { bg: "#0f766e", text: "#ffffff", border: "#0f766e" };
    default:   return { bg: "#f9fafb", text: "#374151", border: "#e5e7eb" };
  }
}

function getPosStyle(pos) {
  switch ((pos || "").toLowerCase()) {
    case "noun":
    case "emër":      return { bg: "#eff6ff", text: "#1d4ed8" };
    case "verb":
    case "folje":     return { bg: "#f0fdf4", text: "#15803d" };
    case "adjective":
    case "mbiemër":   return { bg: "#faf5ff", text: "#7e22ce" };
    case "adverb":
    case "ndajfolje": return { bg: "#fff7ed", text: "#c2410c" };
    default:          return { bg: "#f9fafb", text: "#374151" };
  }
}

// ── Paywall Modal ─────────────────────────────────────────────────────────────
function PaywallModal({ visible, onClose, isPaid, dailyLimit }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.modalBox}>
          <LinearGradient
            colors={["#7c3aed", "#6366f1", "#3b82f6"]}
            style={styles.modalHeader}
          >
            <View style={styles.modalIconWrap}>
              <Ionicons name="diamond" size={32} color="#fff" />
            </View>
            <Text style={styles.modalTitle}>
              {isPaid ? "Limiti Ditor u Arrit!" : "Zhblloko më shumë!"}
            </Text>
            <Text style={styles.modalSubtitle}>
              {isPaid
                ? `Keni arritur limitin ditor prej ${dailyLimit} fjalësh`
                : `Versioni falas — ${dailyLimit} fjalë/ditë`}
            </Text>
          </LinearGradient>

          <View style={styles.modalBody}>
            <Text style={styles.modalBodyText}>
              {isPaid
                ? "Keni zhbllokuar të gjitha fjalët e sotme. Kthehuni nesër!"
                : "Keni shfrytëzuar të gjitha zhbllokimet falas për sot."}
            </Text>
            {!isPaid && (
              <Text style={styles.modalBodySub}>
                Kaloni në Premium dhe zhbllokoni deri në {PAID_DAILY_LIMIT} fjalë çdo ditë.
              </Text>
            )}

            {!isPaid && (
              <View style={styles.perksBox}>
                {[
                  `Deri në ${PAID_DAILY_LIMIT} fjalë të reja çdo ditë`,
                  "Të gjitha nivelet A1 → C2",
                  "Audio shqiptim për çdo fjalë",
                  "Pa reklama",
                ].map((perk) => (
                  <View key={perk} style={styles.perkRow}>
                    <View style={styles.perkDot}>
                      <Ionicons name="checkmark" size={11} color="#fff" />
                    </View>
                    <Text style={styles.perkText}>{perk}</Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={styles.modalBtn}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#7c3aed", "#6366f1", "#3b82f6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalBtnGradient}
              >
                <Text style={styles.modalBtnText}>
                  {isPaid ? "Kuptova, Faleminderit!" : "Premium — Shiko Çmimet"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} style={styles.modalDismiss}>
              <Text style={styles.modalDismissText}>Jo tani, mbyll</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ── Regular Quiz ──────────────────────────────────────────────────────────────
function QuizView({ quizQuestions, level, onClose, onXpAwarded }) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [xpGiven, setXpGiven] = useState(false);

  const progress = quizQuestions.length > 0 ? ((idx + 1) / quizQuestions.length) * 100 : 0;
  const q = quizQuestions[idx];

  async function handleAnswer(option) {
    if (submitted) return;
    setSelected(option);
    setSubmitted(true);
    const isCorrect = option === q.correctAnswer;
    const newCorrect = isCorrect ? correct + 1 : correct;
    if (isCorrect) setCorrect(newCorrect);

    setTimeout(async () => {
      if (idx < quizQuestions.length - 1) {
        setIdx(idx + 1);
        setSelected(null);
        setSubmitted(false);
      } else {
        const passed = newCorrect >= 9;
        setDone(true);
        if (passed && !xpGiven) {
          try { await wordsService.addQuizXp(5); } catch {}
          setXpGiven(true);
          onXpAwarded && onXpAwarded(5);
        }
      }
    }, 1200);
  }

  if (done) {
    const passed = correct >= 9;
    return (
      <View style={styles.quizRoot}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.quizTopBar}>
            <TouchableOpacity onPress={onClose} style={styles.quizBackBtn}>
              <Ionicons name="arrow-back" size={20} color="#64748b" />
              <Text style={styles.quizBackText}>Fjalori</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 18 }}>
            <View style={[styles.quizResultCard, { overflow: "hidden" }]}>
              <LinearGradient
                colors={passed ? ["#7c3aed", "#4f46e5"] : ["#f59e0b", "#f97316"]}
                style={styles.quizResultHeader}
              >
                <View style={styles.quizResultIcon}>
                  <Ionicons name={passed ? "trophy" : "refresh"} size={36} color="#fff" />
                </View>
                <Text style={styles.quizResultTitle}>{passed ? "Urime! 🎉" : "Provo Përsëri!"}</Text>
                <Text style={styles.quizResultSub}>{passed ? "Punë e shkëlqyer!" : "Nevojiten të paktën 9 të sakta."}</Text>
              </LinearGradient>
              <View style={styles.quizResultBody}>
                <View style={styles.quizStatsRow}>
                  {[
                    { label: "Saktë", value: `${correct}/${quizQuestions.length}`, color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
                    { label: "Saktësi", value: `${Math.round((correct / quizQuestions.length) * 100)}%`, color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
                    { label: "XP Fituar", value: `+${passed && xpGiven ? 5 : 0}`, color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
                  ].map((s) => (
                    <View key={s.label} style={[styles.quizStatCard, { backgroundColor: s.bg, borderColor: s.border }]}>
                      <Text style={[styles.quizStatValue, { color: s.color }]}>{s.value}</Text>
                      <Text style={styles.quizStatLabel}>{s.label}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.quizResultBtns}>
                  <TouchableOpacity style={styles.quizExitBtn} onPress={onClose}>
                    <Ionicons name="close" size={16} color="#64748b" />
                    <Text style={styles.quizExitBtnText}>Dil</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quizRetryBtn}
                    onPress={() => { setIdx(0); setSelected(null); setSubmitted(false); setCorrect(0); setDone(false); setXpGiven(false); }}
                  >
                    <LinearGradient colors={["#7c3aed", "#4f46e5"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.quizRetryGradient}>
                      <Ionicons name="refresh" size={15} color="#fff" />
                      <Text style={styles.quizRetryText}>Provo Përsëri</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.quizRoot}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.quizTopBar}>
          <TouchableOpacity onPress={onClose} style={styles.quizBackBtn}>
            <Ionicons name="arrow-back" size={20} color="#64748b" />
            <Text style={styles.quizBackText}>Fjalori</Text>
          </TouchableOpacity>
          <View style={styles.quizProgressWrap}>
            <View style={[styles.quizProgressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.quizCounter}>{idx + 1}/{quizQuestions.length}</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 18 }}>
          <View style={styles.quizScoreBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.quizScoreText}>{correct} saktë</Text>
            <Text style={styles.quizDot}>·</Text>
            <Text style={styles.quizLevelText}>{level}</Text>
          </View>

          <View style={styles.quizWordCard}>
            <Text style={styles.quizWordLabel}>Çfarë do të thotë</Text>
            <Text style={styles.quizWord}>{q?.word}</Text>
          </View>

          <View style={styles.quizOptions}>
            {q?.options.map((option, i) => {
              const isCorrect = option === q.correctAnswer;
              const isSelected = selected === option;
              let bg = "#fff", border = "#e2e8f0", textColor = "#1e293b";
              if (submitted) {
                if (isCorrect) { bg = "#10b981"; border = "#10b981"; textColor = "#fff"; }
                else if (isSelected) { bg = "#f87171"; border = "#f87171"; textColor = "#fff"; }
                else { bg = "#f8fafc"; border = "#e2e8f0"; textColor = "#94a3b8"; }
              }
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => handleAnswer(option)}
                  disabled={submitted}
                  style={[styles.quizOption, { backgroundColor: bg, borderColor: border }]}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.quizOptionText, { color: textColor }]}>{option}</Text>
                  {submitted && isCorrect && <Ionicons name="checkmark-circle" size={20} color="#fff" />}
                  {submitted && isSelected && !isCorrect && <Ionicons name="close-circle" size={20} color="#fff" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ── Listen Quiz ───────────────────────────────────────────────────────────────
function ListenQuizView({ listenWords, allUnlocked, level, language, onClose }) {
  const [idx, setIdx] = useState(0);
  const [options, setOptions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [playing, setPlaying] = useState(false);
  const soundRef = useRef(null);

  useEffect(() => {
    buildOptions(0);
    return () => { if (soundRef.current) soundRef.current.unloadAsync(); };
  }, []);

  function buildOptions(i) {
    const correct = listenWords[i];
    const others = allUnlocked.filter((w) => w._id !== correct._id);
    const wrong = [...others].sort(() => Math.random() - 0.5).slice(0, 3);
    setOptions([...wrong, correct].sort(() => Math.random() - 0.5));
  }

  async function playAudio() {
    if (playing) return;
    const word = listenWords[idx];
    if (!word) return;
    try {
      setPlaying(true);
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      if (soundRef.current) { await soundRef.current.unloadAsync(); soundRef.current = null; }
      const url = await ttsService.getDictionaryAudio(word._id, word.word, word.level, language);
      if (!url) { setPlaying(false); return; }
      const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((s) => {
        if (!s.isLoaded) return;
        setPlaying(Boolean(s.isPlaying));
        if (s.didJustFinish) setPlaying(false);
      });
    } catch {
      setPlaying(false);
    }
  }

  async function handleAnswer(option) {
    if (selectedId !== null) return;
    const isCorrect = option._id === listenWords[idx]?._id;
    setSelectedId(option._id);
    const newScore = isCorrect ? score + 1 : score;
    if (isCorrect) setScore(newScore);

    setTimeout(async () => {
      const next = idx + 1;
      if (next >= listenWords.length) {
        setDone(true);
        try { await wordsService.addQuizXp(newScore); } catch {}
      } else {
        setIdx(next);
        buildOptions(next);
        setSelectedId(null);
      }
    }, 800);
  }

  const LETTERS = ["A", "B", "C", "D"];
  const progressPct = listenWords.length > 0 ? (idx / listenWords.length) * 100 : 0;
  const correctWord = listenWords[idx];

  if (done) {
    const passed = score >= Math.ceil(listenWords.length * 0.6);
    return (
      <View style={styles.quizRoot}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.quizTopBar}>
            <TouchableOpacity onPress={onClose} style={styles.quizBackBtn}>
              <Ionicons name="arrow-back" size={20} color="#64748b" />
              <Text style={styles.quizBackText}>Fjalori</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 18 }}>
            <View style={[styles.quizResultCard, { overflow: "hidden" }]}>
              <LinearGradient
                colors={["#4f46e5", "#4338ca"]}
                style={styles.quizResultHeader}
              >
                <View style={styles.quizResultIcon}>
                  <Ionicons name="headset" size={36} color="#fff" />
                </View>
                <Text style={styles.quizResultTitle}>{passed ? "Urime! 🎉" : "Provo Përsëri!"}</Text>
                <Text style={styles.quizResultSub}>{passed ? "Kuizi i dëgjimit u krye!" : "Vazhdo të praktikosh dëgjimin."}</Text>
              </LinearGradient>
              <View style={styles.quizResultBody}>
                <View style={styles.quizStatsRow}>
                  {[
                    { label: "Saktë", value: `${score}/${listenWords.length}`, color: "#4f46e5", bg: "#eef2ff", border: "#c7d2fe" },
                    { label: "Saktësi", value: `${Math.round((score / listenWords.length) * 100)}%`, color: "#0ea5e9", bg: "#f0f9ff", border: "#bae6fd" },
                    { label: "XP Fituar", value: `+${score}`, color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
                  ].map((s) => (
                    <View key={s.label} style={[styles.quizStatCard, { backgroundColor: s.bg, borderColor: s.border }]}>
                      <Text style={[styles.quizStatValue, { color: s.color }]}>{s.value}</Text>
                      <Text style={styles.quizStatLabel}>{s.label}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity style={styles.quizExitBtn} onPress={onClose}>
                  <Ionicons name="close" size={16} color="#64748b" />
                  <Text style={styles.quizExitBtnText}>Dil</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.quizRoot}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.quizTopBar}>
          <TouchableOpacity onPress={onClose} style={styles.quizBackBtn}>
            <Ionicons name="arrow-back" size={20} color="#64748b" />
            <Text style={styles.quizBackText}>Fjalori</Text>
          </TouchableOpacity>
          <View style={styles.quizProgressWrap}>
            <View style={[styles.quizProgressFill, { width: `${progressPct}%`, backgroundColor: "#6366f1" }]} />
          </View>
          <Text style={styles.quizCounter}>{idx + 1}/{listenWords.length}</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 18 }}>
          <Text style={styles.listenInstruction}>Dëgjo dhe zgjedh frazën e saktë</Text>

          <View style={styles.playerCard}>
            <View style={styles.waveRow}>
              {Array.from({ length: 15 }).map((_, i) => (
                <View key={i} style={[styles.waveBar, { height: [5,10,18,13,22,14,24,9,20,12,17,7,21,11,9][i], opacity: playing ? 1 : 0.5 }]} />
              ))}
            </View>
            <TouchableOpacity
              onPress={playAudio}
              disabled={playing}
              style={[styles.playBtn, playing && { opacity: 0.75 }]}
              activeOpacity={0.85}
            >
              <LinearGradient colors={["#4f46e5", "#6366f1"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.playBtnGradient}>
                <Ionicons name={playing ? "pause" : "play"} size={18} color="#fff" />
                <Text style={styles.playBtnText}>{playing ? "Duke luajtur..." : "Dëgjo"}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.listenGrid}>
            {options.map((option, i) => {
              const isCorrect = option._id === correctWord?._id;
              const isSelected = selectedId === option._id;
              const answered = selectedId !== null;
              let borderColor = "#e2e8f0", letterColor = "#818cf8";
              if (answered) {
                if (isCorrect) { borderColor = "#22c55e"; letterColor = "#22c55e"; }
                else if (isSelected) { borderColor = "#ef4444"; letterColor = "#ef4444"; }
                else { borderColor = "#e2e8f0"; letterColor = "#cbd5e1"; }
              }
              return (
                <TouchableOpacity
                  key={option._id}
                  onPress={() => handleAnswer(option)}
                  disabled={answered}
                  style={[styles.listenOption, { borderColor, opacity: answered && !isCorrect && !isSelected ? 0.5 : 1 }]}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.listenLetter, { color: letterColor }]}>{LETTERS[i]}</Text>
                  <Text style={styles.listenOptionText} numberOfLines={2}>{option.translation}</Text>
                  {answered && isCorrect && <Text style={styles.listenCorrectWord}>{option.word}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function DictionaryScreen({ navigation, route }) {
  const { language } = useLanguage();
  const initialLevel = route?.params?.level || "A1";

  const [words, setWords] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState(initialLevel);
  const [showFavorites, setShowFavorites] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalWords, setTotalWords] = useState(0);
  const [unlocking, setUnlocking] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [unlockStats, setUnlockStats] = useState({
    todayUnlocks: 0,
    remainingUnlocks: FREE_DAILY_LIMIT,
    dailyLimit: FREE_DAILY_LIMIT,
    canUnlock: true,
    nextResetTime: null,
    isPaid: false,
  });

  // Quiz states
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);

  // Listen Quiz states
  const [showListenQuiz, setShowListenQuiz] = useState(false);
  const [listenWords, setListenWords] = useState([]);
  const [listenAllUnlocked, setListenAllUnlocked] = useState([]);

  const soundRef = useRef(null);

  useEffect(() => {
    fetchWords(selectedLevel, 1, searchTerm);
    fetchFavorites();
    fetchUnlockStats();
  }, [selectedLevel, fetchWords]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWords(selectedLevel, 1, searchTerm);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    return () => { if (soundRef.current) soundRef.current.unloadAsync(); };
  }, []);

  const fetchWords = useCallback(async (level, page, search, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const params = { page, limit: WORDS_PER_PAGE, language };
      if (level !== "all") params.level = level;
      if (search.trim()) params.search = search.trim();
      const res = await dictionaryService.getAll(params);
      const data = Array.isArray(res.data) ? res.data : res.data?.words || [];
      const pagination = res.data?.pagination || {};
      const total = pagination.totalWords || pagination.total || 0;
      setWords(data);
      setTotalWords(total);
      setTotalPages(Math.max(1, Math.ceil(total / WORDS_PER_PAGE)));
      setCurrentPage(page);
    } catch {
      setWords([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [language]);

  async function fetchFavorites() {
    try {
      const res = await favoritesService.getFavorites();
      const favs = res.data?.favorites || res.data || [];
      setFavorites(favs.map((f) => f.wordId || f._id || f));
    } catch {
      setFavorites([]);
    }
  }

  async function fetchUnlockStats() {
    try {
      const res = await dictionaryService.getUnlockStats();
      setUnlockStats(res.data || res);
    } catch {}
  }

  async function handleUnlock(wordId) {
    if (!unlockStats.canUnlock) { setShowPaywall(true); return; }
    setUnlocking(wordId);
    try {
      await dictionaryService.unlockWord(wordId, language);
      setWords((prev) => prev.map((w) => w._id === wordId ? { ...w, isUnlocked: true } : w));
      await fetchUnlockStats();
    } catch (e) {
      Alert.alert("Gabim", e.response?.data?.message || "Ndodhi një gabim gjatë zhbllokimit.");
    } finally {
      setUnlocking(null);
    }
  }

  async function toggleFavorite(wordId) {
    const isFav = favorites.includes(wordId);
    try {
      if (isFav) {
        await favoritesService.removeFavorite(wordId);
        setFavorites((prev) => prev.filter((id) => id !== wordId));
      } else {
        await favoritesService.addFavorite(wordId);
        setFavorites((prev) => [...prev, wordId]);
      }
    } catch {}
  }

  async function playPronunciation(word) {
    if (playingId === word._id) {
      if (soundRef.current) { await soundRef.current.stopAsync(); }
      setPlayingId(null);
      return;
    }
    try {
      setPlayingId(word._id);
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      if (soundRef.current) { await soundRef.current.unloadAsync(); soundRef.current = null; }
      const url = await ttsService.getDictionaryAudio(word._id, word.word, word.level, language);
      if (!url) { setPlayingId(null); return; }
      const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((s) => {
        if (!s.isLoaded) return;
        if (s.didJustFinish) setPlayingId(null);
      });
    } catch {
      setPlayingId(null);
      Alert.alert("Gabim", "Nuk mund të luhet audioja.");
    }
  }

  async function startQuiz() {
    if (!unlockStats.isPaid) { setShowPaywall(true); return; }
    setQuizLoading(true);
    try {
      const res = await dictionaryService.getAll({ level: selectedLevel, limit: 100 });
      const all = Array.isArray(res.data) ? res.data : res.data?.words || [];
      const unlocked = all.filter((w) => w.isUnlocked);
      if (unlocked.length < 15) {
        Alert.alert("Pamjaftueshëm", `Nevojiten të paktën 15 fjalë të zhbllokkuara. Ju keni ${unlocked.length}.`);
        return;
      }
      const selected = [...unlocked].sort(() => Math.random() - 0.5).slice(0, 15);
      const questions = selected.map((word) => {
        const others = unlocked.filter((w) => w._id !== word._id);
        const wrong = others.sort(() => Math.random() - 0.5).slice(0, 3).map((w) => w.translation);
        return {
          word: word.word,
          correctAnswer: word.translation,
          options: [...wrong, word.translation].sort(() => Math.random() - 0.5),
        };
      });
      setQuizQuestions(questions);
      setShowQuiz(true);
    } catch {
      Alert.alert("Gabim", "Ndodhi një gabim gjatë fillimit të kuizit.");
    } finally {
      setQuizLoading(false);
    }
  }

  async function startListenQuiz() {
    if (!unlockStats.isPaid) { setShowPaywall(true); return; }
    try {
      const res = await dictionaryService.getAll({ level: selectedLevel, limit: 100 });
      const all = Array.isArray(res.data) ? res.data : res.data?.words || [];
      const unlocked = all.filter((w) => w.isUnlocked);
      if (unlocked.length < 4) {
        Alert.alert("Pamjaftueshëm", `Nevojiten të paktën 4 fjalë të zhbllokkuara. Ju keni ${unlocked.length}.`);
        return;
      }
      const selected = [...unlocked].sort(() => Math.random() - 0.5).slice(0, Math.min(15, unlocked.length));
      setListenWords(selected);
      setListenAllUnlocked(unlocked);
      setShowListenQuiz(true);
    } catch {
      Alert.alert("Gabim", "Ndodhi një gabim gjatë ngarkimit të fjalëve.");
    }
  }

  // Filtered words for favorites view
  const displayWords = showFavorites
    ? words.filter((w) => favorites.includes(w._id))
    : words;

  // Quiz screen
  if (showQuiz) {
    return (
      <QuizView
        quizQuestions={quizQuestions}
        level={selectedLevel}
        onClose={() => setShowQuiz(false)}
        onXpAwarded={() => {}}
      />
    );
  }

  // Listen quiz screen
  if (showListenQuiz) {
    return (
      <ListenQuizView
        listenWords={listenWords}
        allUnlocked={listenAllUnlocked}
        level={selectedLevel}
        language={language}
        onClose={() => setShowListenQuiz(false)}
      />
    );
  }

  function renderHeader() {
    const { todayUnlocks, remainingUnlocks, dailyLimit, canUnlock, isPaid } = unlockStats;

    return (
      <>
        {/* ── Hero Header ── */}
        <LinearGradient
          colors={["#b45309", "#d97706", "#f59e0b", "#fcd34d"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroCircle1} />
          <View style={styles.heroCircle2} />
          <View style={styles.heroLeft}>
            <View style={styles.heroEyebrowRow}>
              <Ionicons name="book-outline" size={12} color="rgba(255,255,255,0.85)" />
              <Text style={styles.heroEyebrow}>Praktikë Gjuhësore</Text>
            </View>
            <Text style={styles.heroTitle}>Fjalor Gjermanisht</Text>
            <Text style={styles.heroSub}>Zhbllokoni dhe mësoni fjalë të reja</Text>
          </View>
          <View style={styles.heroStat}>
            <View style={styles.heroStatIcon}>
              <Ionicons name="book-outline" size={16} color="#fff" />
            </View>
            <View>
              <Text style={styles.heroStatValue}>{todayUnlocks}</Text>
              <Text style={styles.heroStatLabel}>Zhbllokuar Sot</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Unlock Banner ── */}
        {!canUnlock && !isPaid ? (
          <View style={styles.bannerWrap}>
            <LinearGradient colors={["#7c3aed", "#4f46e5"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.bannerTop}>
              <Ionicons name="diamond" size={16} color="#fff" />
              <Text style={styles.bannerTopText}>Limiti ditor i arritur</Text>
            </LinearGradient>
            <View style={styles.bannerBody}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>
                  Keni hapur të gjitha <Text style={{ color: "#8b5cf6" }}>{FREE_DAILY_LIMIT} fjalët falas</Text> të sotit.
                </Text>
                <Text style={styles.bannerSub}>
                  Me Premium hap deri në <Text style={{ color: "#4f46e5", fontWeight: "800" }}>{PAID_DAILY_LIMIT} fjalë çdo ditë</Text>.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowPaywall(true)} style={styles.bannerBtn}>
                <Text style={styles.bannerBtnText}>Premium</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : !canUnlock && isPaid ? (
          <View style={styles.bannerWrap}>
            <LinearGradient colors={["#f59e0b", "#f97316"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.bannerTop}>
              <Ionicons name="diamond" size={16} color="#fff" />
              <Text style={styles.bannerTopText}>Limiti ditor i arritur</Text>
            </LinearGradient>
            <View style={styles.bannerBodySimple}>
              <Text style={styles.bannerTitle}>
                Keni zhbllokuar të gjitha <Text style={{ color: "#d97706", fontWeight: "800" }}>{PAID_DAILY_LIMIT} fjalët</Text> Premium të sotit. Kthehuni nesër!
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.unlocksCard, isPaid ? styles.unlocksCardPaid : styles.unlocksCardFree]}>
            <View style={[styles.unlocksIcon, isPaid ? styles.unlocksIconPaid : styles.unlocksIconFree]}>
              <Ionicons name={isPaid ? "diamond" : "lock-open-outline"} size={18} color={isPaid ? "#f59e0b" : "#fff"} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.unlocksTitle}>
                {isPaid ? "Premium" : "Plan Falas"} · {remainingUnlocks}/{dailyLimit} fjalë sot
              </Text>
              <View style={styles.dotsRow}>
                {Array.from({ length: Math.min(dailyLimit, 15) }).map((_, i) => (
                  <View key={i} style={[styles.dot, i < todayUnlocks
                    ? [styles.dotFilled, { backgroundColor: isPaid ? "#f59e0b" : "#8b5cf6" }]
                    : styles.dotEmpty]} />
                ))}
                {dailyLimit > 15 && <Text style={styles.dotsMore}>+{dailyLimit - 15}</Text>}
              </View>
            </View>
            {!isPaid && (
              <TouchableOpacity onPress={() => setShowPaywall(true)} style={styles.premiumChip}>
                <Text style={styles.premiumChipText}>Premium →{PAID_DAILY_LIMIT}/ditë</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Level Selection ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardLabel}>Niveli i gjuhës</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.levelRow}>
            {LEVELS.map((lv) => {
              const active = selectedLevel === lv;
              const style = getLevelStyle(lv);
              return (
                <TouchableOpacity
                  key={lv}
                  onPress={() => { setSelectedLevel(lv); setCurrentPage(1); fetchWords(lv, 1, searchTerm); }}
                  style={[styles.levelChip, active && { backgroundColor: style.bg, borderColor: style.border }]}
                >
                  <Text style={[styles.levelChipText, active && { color: style.text }]}>{lv}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Quiz Buttons ── */}
        <View style={styles.quizBtnsRow}>
          <TouchableOpacity
            onPress={startQuiz}
            style={[styles.quizCard, unlockStats.isPaid ? styles.quizCardActive : styles.quizCardLocked]}
            activeOpacity={0.85}
          >
            {quizLoading ? (
              <ActivityIndicator color={unlockStats.isPaid ? "#fff" : "#94a3b8"} size="small" />
            ) : (
              <View style={[styles.quizCardIcon, unlockStats.isPaid ? styles.quizCardIconActive : styles.quizCardIconLocked]}>
                <Ionicons name={unlockStats.isPaid ? "play" : "lock-closed"} size={16} color={unlockStats.isPaid ? "#fff" : "#94a3b8"} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <View style={styles.quizCardTitleRow}>
                <Text style={[styles.quizCardTitle, !unlockStats.isPaid && { color: "#94a3b8" }]}>Kuiz Rregullt</Text>
                {!unlockStats.isPaid && <Ionicons name="diamond-outline" size={13} color="#f59e0b" />}
              </View>
              <Text style={[styles.quizCardSub, unlockStats.isPaid ? styles.quizCardSubActive : { color: "#94a3b8" }]}>
                {unlockStats.isPaid ? `15 pyetje · ${selectedLevel}` : "Premium"}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={startListenQuiz}
            style={[styles.quizCard, unlockStats.isPaid ? styles.quizCardListen : styles.quizCardLocked]}
            activeOpacity={0.85}
          >
            <View style={[styles.quizCardIcon, unlockStats.isPaid ? styles.quizCardIconListen : styles.quizCardIconLocked]}>
              <Ionicons name={unlockStats.isPaid ? "headset" : "lock-closed"} size={16} color={unlockStats.isPaid ? "#fff" : "#94a3b8"} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.quizCardTitleRow}>
                <Text style={[styles.quizCardTitle, !unlockStats.isPaid && { color: "#94a3b8" }]}>Kuiz Dëgjimi</Text>
                {!unlockStats.isPaid && <Ionicons name="diamond-outline" size={13} color="#f59e0b" />}
              </View>
              <Text style={[styles.quizCardSub, unlockStats.isPaid ? styles.quizCardSubListen : { color: "#94a3b8" }]}>
                {unlockStats.isPaid ? `15 pyetje · ${selectedLevel}` : "Premium"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Search & Favorites ── */}
        <View style={styles.sectionCard}>
          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={18} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Kërko fjalë ose përkthim..."
              placeholderTextColor="#94a3b8"
              value={searchTerm}
              onChangeText={setSearchTerm}
              autoCorrect={false}
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm("")}>
                <Ionicons name="close-circle" size={18} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            onPress={() => setShowFavorites(!showFavorites)}
            style={[styles.favBtn, showFavorites && styles.favBtnActive]}
          >
            <Ionicons name={showFavorites ? "heart" : "heart-outline"} size={14} color={showFavorites ? "#fff" : "#64748b"} />
            <Text style={[styles.favBtnText, showFavorites && { color: "#fff" }]}>Të Preferuarat</Text>
            {favorites.length > 0 && (
              <View style={[styles.favCount, showFavorites && { backgroundColor: "rgba(255,255,255,0.25)" }]}>
                <Text style={[styles.favCountText, showFavorites && { color: "#fff" }]}>{favorites.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </>
    );
  }

  function renderWordCard({ item, index }) {
    const word = item;
    const isFav = favorites.includes(word._id);
    const isLocked = !word.isUnlocked;
    const isPlaying = playingId === word._id;
    const lvStyle = getLevelStyle(word.level);
    const firstExample = word.examples?.[0];
    const posStyle = getPosStyle(word.partOfSpeech);

    return (
      <View style={[styles.wordCard, index % 2 === 0 ? { marginRight: 5 } : { marginLeft: 5 }]}>
        {/* Locked overlay */}
        {isLocked && (
          <View style={styles.lockOverlay}>
            <Ionicons name="lock-closed" size={24} color="#9ca3af" />
            <TouchableOpacity
              onPress={() => handleUnlock(word._id)}
              disabled={unlocking === word._id || !unlockStats.canUnlock}
              style={[
                styles.unlockBtn,
                unlocking === word._id && { backgroundColor: "#e5e7eb" },
                !unlockStats.canUnlock && { backgroundColor: "#e5e7eb" },
              ]}
              activeOpacity={0.85}
            >
              {unlocking === word._id ? (
                <ActivityIndicator size="small" color="#9ca3af" />
              ) : (
                <Text style={[styles.unlockBtnText, !unlockStats.canUnlock && { color: "#9ca3af" }]}>
                  {unlockStats.canUnlock ? "Hap Fjalën" : "Limit u arrit"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Card content (blurred behind lock) */}
        <View style={[isLocked && { opacity: 0 }]}>
          <View style={styles.wordCardTop}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.wordTitle} numberOfLines={1}>{word.word}</Text>
              <Text style={styles.wordTranslation} numberOfLines={1}>{word.translation}</Text>
            </View>
            <View style={styles.wordActions}>
              <TouchableOpacity
                onPress={() => !isLocked && playPronunciation(word)}
                disabled={isLocked}
                style={[styles.wordActionBtn, isPlaying && styles.wordActionBtnPlaying]}
              >
                <Ionicons name={isPlaying ? "volume-high" : "volume-medium-outline"} size={14} color={isPlaying ? "#10b981" : "#9ca3af"} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => !isLocked && toggleFavorite(word._id)}
                disabled={isLocked}
                style={[styles.wordActionBtn, isFav && styles.wordActionBtnFav]}
              >
                <Ionicons name={isFav ? "heart" : "heart-outline"} size={14} color={isFav ? "#f43f5e" : "#9ca3af"} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.wordBadges}>
            <View style={[styles.lvBadge, { backgroundColor: lvStyle.bg, borderColor: lvStyle.border }]}>
              <Text style={[styles.lvBadgeText, { color: lvStyle.text }]}>{word.level}</Text>
            </View>
            {word.partOfSpeech && (
              <View style={[styles.posBadge, { backgroundColor: posStyle.bg }]}>
                <Text style={[styles.posBadgeText, { color: posStyle.text }]}>{word.partOfSpeech}</Text>
              </View>
            )}
          </View>

          {firstExample?.german && (
            <View style={styles.exampleBox}>
              <Text style={styles.exampleText} numberOfLines={2}>"{firstExample.german}"</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  function renderPagination() {
    if (totalPages <= 1) return null;
    const pages = [];
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    for (let i = start; i <= end; i++) pages.push(i);

    return (
      <View style={styles.paginationCard}>
        <Text style={styles.paginationInfo}>
          Faqja <Text style={{ fontWeight: "900", color: "#0f172a" }}>{currentPage}</Text> nga{" "}
          <Text style={{ fontWeight: "900", color: "#0f172a" }}>{totalPages}</Text>
        </Text>
        <View style={styles.paginationBtns}>
          <TouchableOpacity
            onPress={() => { fetchWords(selectedLevel, currentPage - 1, searchTerm); }}
            disabled={currentPage === 1}
            style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
          >
            <Ionicons name="chevron-back" size={14} color={currentPage === 1 ? "#d1d5db" : "#374151"} />
          </TouchableOpacity>
          {pages.map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => fetchWords(selectedLevel, p, searchTerm)}
              style={[styles.pageBtn, currentPage === p && styles.pageBtnActive]}
            >
              <Text style={[styles.pageBtnText, currentPage === p && { color: "#fff" }]}>{p}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => fetchWords(selectedLevel, currentPage + 1, searchTerm)}
            disabled={currentPage === totalPages}
            style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
          >
            <Ionicons name="chevron-forward" size={14} color={currentPage === totalPages ? "#d1d5db" : "#374151"} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        <FlatList
          data={displayWords}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          renderItem={renderWordCard}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                fetchWords(selectedLevel, 1, searchTerm, true);
                fetchFavorites();
                fetchUnlockStats();
              }}
              tintColor="#d97706"
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={
            <>
              {renderPagination()}
              {!loading && displayWords.length === 0 && (
                <View style={styles.emptyCard}>
                  <View style={styles.emptyIconWrap}>
                    <Ionicons name="book-outline" size={32} color="#10b981" />
                  </View>
                  <Text style={styles.emptyTitle}>Nuk u gjetën fjalë</Text>
                  <Text style={styles.emptyText}>
                    {showFavorites
                      ? "Ende nuk ka fjalë të preferuara."
                      : "Nuk ka fjalë të disponueshme për nivelin e zgjedhur."}
                  </Text>
                </View>
              )}
            </>
          }
          ListEmptyComponent={
            loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color="#d97706" size="large" />
              </View>
            ) : null
          }
        />
      </SafeAreaView>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        isPaid={unlockStats.isPaid}
        dailyLimit={unlockStats.dailyLimit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },

  // ── Hero ──
  hero: {
    flexDirection: "row",
    alignItems: "center",
    padding: 22,
    borderRadius: 20,
    marginBottom: 12,
    overflow: "hidden",
    position: "relative",
  },
  heroCircle1: {
    position: "absolute", top: -40, right: -40,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  heroCircle2: {
    position: "absolute", bottom: -50, right: 60,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  heroLeft: { flex: 1 },
  heroEyebrowRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 8 },
  heroEyebrow: { color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" },
  heroTitle: { color: "#fff", fontSize: 26, fontWeight: "900", marginBottom: 6, lineHeight: 30 },
  heroSub: { color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 18 },
  heroStat: {
    backgroundColor: "rgba(0,0,0,0.15)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 14, padding: 14,
    flexDirection: "row", alignItems: "center", gap: 10,
    marginLeft: 12,
  },
  heroStatIcon: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  heroStatValue: { color: "#fff", fontSize: 20, fontWeight: "700", lineHeight: 22 },
  heroStatLabel: { color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: "600" },

  // ── Unlock banner ──
  bannerWrap: {
    borderRadius: 16, overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1, borderColor: "#ddd6fe",
  },
  bannerTop: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10 },
  bannerTopText: { color: "#fff", fontWeight: "800", fontSize: 13, flex: 1 },
  bannerBody: {
    backgroundColor: "#fff", paddingHorizontal: 14, paddingVertical: 12,
    flexDirection: "row", alignItems: "center", gap: 12,
  },
  bannerBodySimple: { backgroundColor: "#fff", paddingHorizontal: 14, paddingVertical: 12 },
  bannerTitle: { color: "#1e293b", fontSize: 13, fontWeight: "700", marginBottom: 4 },
  bannerSub: { color: "#64748b", fontSize: 12 },
  bannerBtn: {
    backgroundColor: "linear", paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 12, backgroundColor: "#7c3aed",
  },
  bannerBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },

  // ── Unlock dots card ──
  unlocksCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 16, padding: 14, marginBottom: 12,
    borderWidth: 1,
  },
  unlocksCardFree: { backgroundColor: "#faf5ff", borderColor: "#ddd6fe" },
  unlocksCardPaid: { backgroundColor: "#fffbeb", borderColor: "#fde68a" },
  unlocksIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  unlocksIconFree: { backgroundColor: "#7c3aed" },
  unlocksIconPaid: { backgroundColor: "#fef3c7" },
  unlocksTitle: { color: "#0f172a", fontSize: 13, fontWeight: "800", marginBottom: 6 },
  dotsRow: { flexDirection: "row", alignItems: "center", gap: 4, flexWrap: "wrap" },
  dot: { width: 14, height: 14, borderRadius: 7 },
  dotFilled: {},
  dotEmpty: { borderWidth: 2, borderColor: "#d1d5db", backgroundColor: "#fff" },
  dotsMore: { fontSize: 11, color: "#94a3b8", fontWeight: "700" },
  premiumChip: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    backgroundColor: "#f5f3ff", borderWidth: 1, borderColor: "#ddd6fe",
  },
  premiumChipText: { color: "#7c3aed", fontSize: 11, fontWeight: "800" },

  // ── Section cards ──
  sectionCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 14,
    marginBottom: 12,
    shadowColor: "#0f172a", shadowOpacity: 0.04, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  sectionCardLabel: { color: "#374151", fontSize: 12, fontWeight: "800", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.6 },

  // ── Level chips ──
  levelRow: { gap: 8, paddingRight: 4 },
  levelChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1.5, borderColor: "#e2e8f0", backgroundColor: "#fff",
  },
  levelChipText: { fontSize: 12, fontWeight: "800", color: "#64748b" },

  // ── Quiz buttons ──
  quizBtnsRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  quizCard: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 10,
    padding: 14, borderRadius: 14, borderWidth: 1,
  },
  quizCardActive: {
    backgroundColor: "#7c3aed", borderColor: "transparent",
  },
  quizCardListen: {
    backgroundColor: "#0f766e", borderColor: "transparent",
  },
  quizCardLocked: { backgroundColor: "#f1f5f9", borderColor: "#e2e8f0" },
  quizCardIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  quizCardIconActive: { backgroundColor: "rgba(255,255,255,0.2)" },
  quizCardIconListen: { backgroundColor: "rgba(255,255,255,0.2)" },
  quizCardIconLocked: { backgroundColor: "#e2e8f0" },
  quizCardTitleRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 },
  quizCardTitle: { fontSize: 13, fontWeight: "800", color: "#fff" },
  quizCardSub: { fontSize: 11 },
  quizCardSubActive: { color: "rgba(255,255,255,0.75)" },
  quizCardSubListen: { color: "rgba(255,255,255,0.75)" },

  // ── Search & Favorites ──
  searchRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1.5, borderColor: "#e2e8f0", borderRadius: 14,
    paddingHorizontal: 14, backgroundColor: "#f8fafc", marginBottom: 10,
  },
  searchInput: {
    flex: 1, color: "#0f172a", paddingVertical: 11,
    fontSize: 14, fontWeight: "600",
  },
  favBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10,
    borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#fff",
    alignSelf: "flex-start",
  },
  favBtnActive: {
    backgroundColor: "#f43f5e", borderColor: "transparent",
  },
  favBtnText: { fontSize: 13, fontWeight: "700", color: "#64748b" },
  favCount: {
    backgroundColor: "#fce7f3", paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 99,
  },
  favCountText: { fontSize: 11, fontWeight: "800", color: "#f43f5e" },

  // ── Word cards ──
  listContent: { paddingHorizontal: 18, paddingBottom: 28, paddingTop: 8 },
  columnWrapper: { marginBottom: 10 },
  wordCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 18, padding: 14,
    borderWidth: 1, borderColor: "#f1f5f9",
    shadowColor: "#0f172a", shadowOpacity: 0.05,
    shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    position: "relative",
    minHeight: 120,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(248,250,252,0.95)",
    borderRadius: 18,
    zIndex: 10,
    alignItems: "center", justifyContent: "center",
    gap: 8,
  },
  unlockBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    backgroundColor: "#7c3aed",
  },
  unlockBtnText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  wordCardTop: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  wordTitle: { color: "#0f172a", fontSize: 15, fontWeight: "800", lineHeight: 20, marginBottom: 2 },
  wordTranslation: { color: "#64748b", fontSize: 12, fontWeight: "600" },
  wordActions: { flexDirection: "row", gap: 2, marginLeft: 4 },
  wordActionBtn: {
    width: 28, height: 28, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#f8fafc",
  },
  wordActionBtnPlaying: { backgroundColor: "#d1fae5" },
  wordActionBtnFav: { backgroundColor: "#fce7f3" },
  wordBadges: { flexDirection: "row", gap: 5, flexWrap: "wrap", marginBottom: 8 },
  lvBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, borderWidth: 1,
  },
  lvBadgeText: { fontSize: 11, fontWeight: "900" },
  posBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  posBadgeText: { fontSize: 11, fontWeight: "700" },
  exampleBox: {
    backgroundColor: "#f0fdf4", borderRadius: 10, padding: 8,
    borderWidth: 1, borderColor: "#d1fae5", marginTop: 4,
  },
  exampleText: { color: "#374151", fontSize: 11, fontStyle: "italic", lineHeight: 16 },

  // ── Pagination ──
  paginationCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 14,
    marginTop: 8,
    shadowColor: "#0f172a", shadowOpacity: 0.04, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 2,
    alignItems: "center", gap: 10,
  },
  paginationInfo: { color: "#64748b", fontSize: 12, fontWeight: "600" },
  paginationBtns: { flexDirection: "row", alignItems: "center", gap: 6 },
  pageBtn: {
    minWidth: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center",
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0", paddingHorizontal: 8,
  },
  pageBtnActive: { backgroundColor: "#10b981", borderColor: "#10b981" },
  pageBtnDisabled: { backgroundColor: "#f9fafb", borderColor: "#f1f5f9" },
  pageBtnText: { fontSize: 13, fontWeight: "800", color: "#374151" },

  // ── Empty / Loading ──
  emptyCard: { alignItems: "center", paddingVertical: 40, paddingHorizontal: 20 },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: "#ecfdf5", alignItems: "center", justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: { color: "#0f172a", fontSize: 16, fontWeight: "800", marginBottom: 6 },
  emptyText: { color: "#64748b", fontSize: 13, textAlign: "center", lineHeight: 20 },
  loadingWrap: { paddingVertical: 60, alignItems: "center" },

  // ── Paywall Modal ──
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center", justifyContent: "center", padding: 20,
  },
  modalBox: {
    backgroundColor: "#fff", borderRadius: 28,
    width: "100%", maxWidth: 380, overflow: "hidden",
  },
  modalHeader: { paddingHorizontal: 28, paddingTop: 32, paddingBottom: 24, alignItems: "center" },
  modalIconWrap: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center", justifyContent: "center", marginBottom: 14,
  },
  modalTitle: { color: "#fff", fontSize: 22, fontWeight: "900", marginBottom: 4, textAlign: "center" },
  modalSubtitle: { color: "rgba(255,255,255,0.8)", fontSize: 13, textAlign: "center" },
  modalBody: { padding: 24 },
  modalBodyText: { color: "#374151", fontSize: 13, fontWeight: "700", marginBottom: 6, textAlign: "center" },
  modalBodySub: { color: "#94a3b8", fontSize: 12, textAlign: "center", marginBottom: 16 },
  perksBox: {
    backgroundColor: "#faf5ff", borderWidth: 1, borderColor: "#ede9fe",
    borderRadius: 16, padding: 14, marginBottom: 16, gap: 8,
  },
  perkRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  perkDot: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: "#8b5cf6", alignItems: "center", justifyContent: "center",
  },
  perkText: { color: "#374151", fontSize: 12, fontWeight: "700", flex: 1 },
  modalBtn: { borderRadius: 16, overflow: "hidden", marginBottom: 8 },
  modalBtnGradient: { paddingVertical: 16, alignItems: "center", justifyContent: "center" },
  modalBtnText: { color: "#fff", fontSize: 15, fontWeight: "900" },
  modalDismiss: { alignItems: "center", paddingVertical: 8 },
  modalDismissText: { color: "#94a3b8", fontSize: 13, fontWeight: "600" },

  // ── Quiz / Listen quiz ──
  quizRoot: { flex: 1, backgroundColor: "#f8fafc" },
  quizTopBar: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9",
    paddingHorizontal: 16, paddingVertical: 12,
  },
  quizBackBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  quizBackText: { color: "#64748b", fontSize: 14, fontWeight: "700" },
  quizProgressWrap: {
    flex: 1, height: 8, backgroundColor: "#e2e8f0",
    borderRadius: 99, overflow: "hidden",
  },
  quizProgressFill: { height: "100%", backgroundColor: "#8b5cf6", borderRadius: 99 },
  quizCounter: { fontSize: 12, fontWeight: "800", color: "#8b5cf6", minWidth: 36, textAlign: "right" },
  quizScoreBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#ede9fe",
    borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8,
    alignSelf: "center", marginBottom: 16,
  },
  quizScoreText: { fontSize: 14, fontWeight: "700", color: "#374151" },
  quizDot: { color: "#d1d5db" },
  quizLevelText: { fontSize: 12, fontWeight: "800", color: "#8b5cf6", textTransform: "uppercase" },
  quizWordCard: {
    backgroundColor: "#fff", borderRadius: 24,
    shadowColor: "#0f172a", shadowOpacity: 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: 4 }, elevation: 4,
    padding: 24, alignItems: "center", marginBottom: 18,
  },
  quizWordLabel: { fontSize: 11, fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 },
  quizWord: { fontSize: 36, fontWeight: "900", color: "#0f172a", textAlign: "center" },
  quizOptions: { gap: 10 },
  quizOption: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 18, paddingVertical: 16,
    borderRadius: 18, borderWidth: 2,
  },
  quizOptionText: { fontSize: 15, fontWeight: "700", flex: 1 },
  quizResultCard: {
    backgroundColor: "#fff", borderRadius: 28,
    shadowColor: "#0f172a", shadowOpacity: 0.1, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  quizResultHeader: { padding: 36, alignItems: "center" },
  quizResultIcon: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center", marginBottom: 14,
  },
  quizResultTitle: { color: "#fff", fontSize: 28, fontWeight: "900", marginBottom: 6 },
  quizResultSub: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
  quizResultBody: { padding: 20 },
  quizStatsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  quizStatCard: {
    flex: 1, alignItems: "center", padding: 14,
    borderRadius: 16, borderWidth: 1,
  },
  quizStatValue: { fontSize: 22, fontWeight: "900", marginBottom: 2 },
  quizStatLabel: { fontSize: 11, color: "#94a3b8", fontWeight: "700" },
  quizResultBtns: { flexDirection: "row", gap: 10 },
  quizExitBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 13, borderRadius: 14, backgroundColor: "#f1f5f9",
  },
  quizExitBtnText: { color: "#64748b", fontSize: 14, fontWeight: "800" },
  quizRetryBtn: { flex: 1, borderRadius: 14, overflow: "hidden" },
  quizRetryGradient: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 13,
  },
  quizRetryText: { color: "#fff", fontSize: 14, fontWeight: "800" },

  // ── Listen quiz specifics ──
  listenInstruction: {
    textAlign: "center", fontSize: 11, fontWeight: "800", color: "#94a3b8",
    textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 18,
  },
  playerCard: {
    backgroundColor: "#fff", borderRadius: 24, padding: 28,
    alignItems: "center", marginBottom: 16,
    shadowColor: "#0f172a", shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  waveRow: { flexDirection: "row", alignItems: "center", gap: 3, height: 32, marginBottom: 20 },
  waveBar: { width: 3, borderRadius: 99, backgroundColor: "#a5b4fc" },
  playBtn: { borderRadius: 99, overflow: "hidden" },
  playBtnGradient: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 32, paddingVertical: 14,
  },
  playBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  listenGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  listenOption: {
    width: (SCREEN_W - 36 - 10) / 2,
    backgroundColor: "#fff", borderWidth: 2,
    borderRadius: 18, padding: 16, alignItems: "center",
  },
  listenLetter: { fontSize: 13, fontWeight: "900", marginBottom: 4 },
  listenOptionText: { fontSize: 14, fontWeight: "700", textAlign: "center", color: "#1e293b", lineHeight: 20 },
  listenCorrectWord: { fontSize: 11, color: "#94a3b8", fontWeight: "600", marginTop: 4 },
});
