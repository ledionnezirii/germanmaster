import { useState, useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Modal, Alert, Dimensions,
} from "react-native";
import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { pronunciationService, ttsService } from "../../services/api";
import { useLanguage } from "../../context/LanguageContext";
import { SectionHeader } from "../../components/Headers";
import { getSectionTexts } from "../../utils/sectionTexts";

const { width } = Dimensions.get("window");

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const LEVEL_COLORS = {
  A1: { bg: "#fff0eb", text: "#c9200a" },
  A2: { bg: "#fff5e6", text: "#b55e00" },
  B1: { bg: "#e8eeff", text: "#2d4fd1" },
  B2: { bg: "#efe8ff", text: "#6b36d4" },
  C1: { bg: "#fff0f0", text: "#c43030" },
  C2: { bg: "#c9200a", text: "#fff" },
};

const EMPTY_STATS = { correctAnswers: 0, totalAttempts: 0, completedWords: [], totalXP: 0 };

export default function PronunciationScreen() {
  const { language } = useLanguage();

  // ── view: 'list' | 'practice' | 'results'
  const [view, setView] = useState("list");
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState("A1");
  const [loading, setLoading] = useState(false);
  const [completedPackages, setCompletedPackages] = useState(new Set());
  const [isPaid, setIsPaid] = useState(false);
  const [freeLimit, setFreeLimit] = useState(5);
  const [showPaywall, setShowPaywall] = useState(false);

  // ── practice state
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [sessionStats, setSessionStats] = useState(EMPTY_STATS);

  const recordingRef = useRef(null);
  const soundRef = useRef(null);
  const audioCacheRef = useRef({});

  useEffect(() => {
    loadPackages();
    loadCompletedPackages();
  }, [language]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingRef.current) recordingRef.current.stopAndUnloadAsync().catch(() => {});
      if (soundRef.current) soundRef.current.unloadAsync().catch(() => {});
    };
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const response = await pronunciationService.getPackages(language);
      const data = response.data;
      if (Array.isArray(data)) setPackages(data);
      else if (data?.packages) setPackages(data.packages);
      else setPackages([]);
    } catch {
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCompletedPackages = async () => {
    try {
      const response = await pronunciationService.getUserCompletedPackages();
      const data = response.data || {};
      const ids = (data.completedPronunciationPackages || []).map((p) =>
        typeof p === "object" ? p._id?.toString() : p.toString()
      );
      setCompletedPackages(new Set(ids));
      setIsPaid(data.isPaid || false);
      setFreeLimit(data.freeLimit || 5);
    } catch {
      setCompletedPackages(new Set());
    }
  };

  const filteredPackages = packages.filter((pkg) => pkg.level === selectedLevel);
  const uniqueLevels = [...new Set(packages.map((p) => p.level))].sort();

  // ── package selection ──────────────────────────────────────────────────────
  const selectPackage = (pkg) => {
    const isCompleted = completedPackages.has(pkg._id.toString());
    const isLocked = !isCompleted && !isPaid && completedPackages.size >= freeLimit;
    if (isLocked) { setShowPaywall(true); return; }
    setSelectedPackage(pkg);
    setCurrentWordIndex(0);
    setSessionStats(EMPTY_STATS);
    setFeedback(null);
    setView("practice");
  };

  // ── audio playback ─────────────────────────────────────────────────────────
  const playPronunciation = async (word, wordId, level) => {
    if (isPlaying) return;
    try {
      if (soundRef.current) { await soundRef.current.unloadAsync(); soundRef.current = null; }
      setIsPlaying(true);
      const key = `${wordId}_${level}`;
      let audioUrl = audioCacheRef.current[key];
      if (!audioUrl) {
        audioUrl = await ttsService.getPronunciationAudio(wordId, word, level, language);
        audioCacheRef.current[key] = audioUrl;
      }
      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((s) => { if (s.didJustFinish) setIsPlaying(false); });
      await sound.playAsync();
    } catch {
      setIsPlaying(false);
    }
  };

  // ── recording ──────────────────────────────────────────────────────────────
  const startRecording = async () => {
    const isWordDone = sessionStats.completedWords.includes(currentWordIndex);
    if (isWordDone) return;
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Leje e refuzuar", "Aksesi në mikrofon u refuzua.");
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      setFeedback(null);
      setTimeout(() => stopRecording(), 4000);
    } catch {
      setIsRecording(false);
      setFeedback({ type: "error", text: "Nuk mund të fillojë regjistrimi." });
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;
    try {
      setIsRecording(false);
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      if (uri) await transcribeAndCheck(uri);
    } catch {
      setIsRecording(false);
      setFeedback({ type: "error", text: "Gabim gjatë regjistrimit." });
    }
  };

  const transcribeAndCheck = async (uri) => {
    try {
      const formData = new FormData();
      formData.append("audio", { uri, type: "audio/m4a", name: "recording.m4a" });
      formData.append("language", language);
      const token = await SecureStore.getItemAsync("authToken");
      const res = await fetch("https://api.gjuhagjermane.com/api/pronunciation/transcribe", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("failed");
      const json = await res.json();
      const transcript = json.data?.transcript || json.transcript;
      if (!transcript) {
        setFeedback({ type: "error", text: "Nuk u njoh zëri. Provo përsëri." });
        return;
      }
      await checkPronunciation(transcript);
    } catch {
      setFeedback({ type: "error", text: "Nuk u njoh zëri. Provo përsëri." });
    }
  };

  const checkPronunciation = async (spokenText) => {
    if (!selectedPackage) return;
    try {
      const response = await pronunciationService.checkPronunciation(
        selectedPackage._id, currentWordIndex, spokenText
      );
      const { correct, xpAdded, similarity: simScore } = response.data;

      let captured = null;
      setSessionStats((prev) => {
        const updated = correct && !prev.completedWords.includes(currentWordIndex)
          ? [...prev.completedWords, currentWordIndex]
          : prev.completedWords;
        captured = updated;
        return {
          ...prev,
          totalAttempts: prev.totalAttempts + 1,
          correctAnswers: correct ? prev.correctAnswers + 1 : prev.correctAnswers,
          completedWords: updated,
          totalXP: prev.totalXP + (xpAdded || 0),
        };
      });

      if (correct) {
        setFeedback({
          type: "correct",
          text: simScore >= 85 ? "Perfekt!" : "Mirë — mjaft afër!",
          xp: xpAdded,
          score: simScore,
        });
        setTimeout(() => advanceWord(captured), 800);
      } else {
        setFeedback({ type: "wrong", text: "Jo saktë — provo përsëri!", score: simScore });
      }
    } catch {
      setFeedback({ type: "error", text: "Gabim gjatë kontrollit. Provo përsëri." });
    }
  };

  const advanceWord = (newCompletedWords) => {
    if (!selectedPackage) return;
    const count = newCompletedWords?.length ?? sessionStats.completedWords.length;
    if (currentWordIndex < selectedPackage.words.length - 1) {
      setCurrentWordIndex((i) => i + 1);
      setFeedback(null);
    } else {
      if (count >= selectedPackage.words.length) {
        setCompletedPackages((prev) => new Set([...prev, selectedPackage._id.toString()]));
      }
      setView("results");
    }
  };

  const resetSession = () => {
    setCurrentWordIndex(0);
    setSessionStats(EMPTY_STATS);
    setFeedback(null);
    setView("practice");
  };

  const backToList = () => {
    setSelectedPackage(null);
    setView("list");
  };

  // ════════════════════════════════════════════════════════════════════════════
  // RESULTS VIEW
  // ════════════════════════════════════════════════════════════════════════════
  if (view === "results" && selectedPackage) {
    const accuracy = sessionStats.totalAttempts
      ? Math.round((sessionStats.correctAnswers / sessionStats.totalAttempts) * 100)
      : 0;
    const allPerfect = sessionStats.completedWords.length === selectedPackage.words.length;

    return (
      <SafeAreaView style={s.root}>
        <View style={s.resultsWrap}>
          <LinearGradient
            colors={allPerfect ? ["#1e3a5f", "#1d4ed8", "#3b82f6"] : ["#555", "#888"]}
            style={s.resultsHero}
          >
            <View style={s.resultsTrophy}>
              <Ionicons name={allPerfect ? "trophy" : "star"} size={28} color="#fff" />
            </View>
            <Text style={s.resultsTitle}>{allPerfect ? "Paketa e Përfunduar!" : "Sesioni Mbaroi"}</Text>
            <Text style={s.resultsSubtitle}>{selectedPackage.title}</Text>
          </LinearGradient>

          <View style={s.resultsStats}>
            {[
              { value: sessionStats.completedWords.length, label: "Fjalë të mësuara" },
              { value: `${accuracy}%`, label: "Saktësi" },
              { value: `+${sessionStats.totalXP}`, label: "XP fituar" },
            ].map((item, i) => (
              <View key={i} style={s.resultsStat}>
                <Text style={s.resultsStatNum}>{item.value}</Text>
                <Text style={s.resultsStatLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          <View style={s.resultsActions}>
            {!allPerfect && (
              <TouchableOpacity style={s.btnPrimary} onPress={resetSession} activeOpacity={0.85}>
                <Ionicons name="refresh" size={16} color="#fff" />
                <Text style={s.btnPrimaryText}>Provo përsëri</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.btnSecondary} onPress={backToList} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={16} color="#555" />
              <Text style={s.btnSecondaryText}>Kthehu tek paketat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PRACTICE VIEW
  // ════════════════════════════════════════════════════════════════════════════
  if (view === "practice" && selectedPackage) {
    const currentWord = selectedPackage.words[currentWordIndex];
    const isWordDone = sessionStats.completedWords.includes(currentWordIndex);
    const progress = (sessionStats.completedWords.length / selectedPackage.words.length) * 100;

    return (
      <SafeAreaView style={s.root}>
        <ScrollView contentContainerStyle={s.practiceScroll} showsVerticalScrollIndicator={false}>

          {/* ── Top bar ── */}
          <View style={s.practiceTopbar}>
            <TouchableOpacity style={s.backBtn} onPress={backToList} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={18} color="#555" />
            </TouchableOpacity>
            <View style={{ flex: 1, gap: 5 }}>
              <Text style={s.pkgName}>{selectedPackage.title} · {selectedPackage.level}</Text>
              <View style={s.progressTrack}>
                <View style={[s.progressFill, { width: `${progress}%` }]} />
              </View>
            </View>
            <Text style={s.wordCounter}>
              {currentWordIndex + 1}/{selectedPackage.words.length}
            </Text>
          </View>

          {/* ── Dots ── */}
          <View style={s.dots}>
            {selectedPackage.words.map((_, i) => (
              <View
                key={i}
                style={[
                  s.dot,
                  sessionStats.completedWords.includes(i) ? s.dotDone
                    : i === currentWordIndex ? s.dotCurrent : null,
                ]}
              />
            ))}
          </View>

          {/* ── Word card ── */}
          <View style={s.wordCard}>
            {isWordDone && (
              <View style={s.doneBadge}>
                <Ionicons name="checkmark-circle" size={13} color="#2d8a50" />
                <Text style={s.doneBadgeText}>Përfunduar</Text>
              </View>
            )}
            <Text style={s.wordMain}>{currentWord?.word}</Text>
            <Text style={s.wordPhonetic}>[{currentWord?.pronunciation}]</Text>
            <Text style={s.wordTranslation}>{currentWord?.translation}</Text>

            <TouchableOpacity
              style={[s.listenBtn, isPlaying && s.listenBtnDisabled]}
              onPress={() =>
                playPronunciation(
                  currentWord?.word,
                  currentWord?._id || `${selectedPackage._id}_${currentWordIndex}`,
                  selectedPackage.level,
                )
              }
              disabled={isPlaying}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isPlaying ? "volume-high" : "volume-medium"}
                size={14}
                color={isPlaying ? "#aaa" : "#1d4ed8"}
              />
              <Text style={[s.listenBtnText, isPlaying && { color: "#aaa" }]}>
                {isPlaying ? "Po luhet..." : "Dëgjo"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Mic card ── */}
          <View style={s.micCard}>
            <Text style={s.micInstruction}>
              {isWordDone
                ? "Fjala u përfundua — kalo tek tjetra"
                : isRecording
                ? "Po dëgjon..."
                : "Shtyp mikrofonin dhe thuaj fjalën me zë"}
            </Text>

            {/* mic button + rings */}
            <View style={s.micOuter}>
              {isRecording && (
                <>
                  <View style={[s.micRing, s.micRing1]} />
                  <View style={[s.micRing, s.micRing2]} />
                  <View style={[s.micRing, s.micRing3]} />
                </>
              )}
              <TouchableOpacity
                style={[
                  s.micBtn,
                  isRecording && s.micBtnListening,
                  isWordDone && s.micBtnDone,
                ]}
                onPress={isRecording ? stopRecording : startRecording}
                disabled={isWordDone}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={isRecording ? "mic-off" : "mic"}
                  size={26}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>

            {/* waveform */}
            {isRecording && (
              <View style={s.waveform}>
                {[5, 10, 18, 13, 22, 14, 9].map((h, i) => (
                  <View key={i} style={[s.waveBar, { height: h }]} />
                ))}
              </View>
            )}

            {/* feedback */}
            {feedback && (
              <View style={[
                s.feedbackBox,
                feedback.type === "correct" ? s.feedbackCorrect
                  : feedback.type === "wrong" ? s.feedbackWrong
                  : s.feedbackError,
              ]}>
                <Ionicons
                  name={
                    feedback.type === "correct" ? "checkmark-circle"
                      : feedback.type === "wrong" ? "refresh-circle"
                      : "alert-circle"
                  }
                  size={15}
                  color={
                    feedback.type === "correct" ? "#2d8a50"
                      : feedback.type === "wrong" ? "#b91c1c"
                      : "#888"
                  }
                />
                <Text style={[
                  s.feedbackText,
                  {
                    color: feedback.type === "correct" ? "#2d8a50"
                      : feedback.type === "wrong" ? "#b91c1c"
                      : "#888",
                  },
                ]}>
                  {feedback.text}
                  {feedback.xp > 0 && (
                    <Text style={s.feedbackXP}> · +{feedback.xp} XP</Text>
                  )}
                </Text>
                {feedback.score != null && (
                  <Text style={[
                    s.feedbackScore,
                    feedback.type === "wrong" && s.feedbackScoreWrong,
                  ]}>
                    {feedback.score}%
                  </Text>
                )}
              </View>
            )}
          </View>

        </ScrollView>
      </SafeAreaView>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PACKAGE LIST VIEW
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <View style={s.root}>

      {/* ── Paywall modal ── */}
      <Modal visible={showPaywall} transparent animationType="fade" onRequestClose={() => setShowPaywall(false)}>
        <TouchableOpacity style={s.paywallOverlay} activeOpacity={1} onPress={() => setShowPaywall(false)}>
          <View style={s.paywallCard} onStartShouldSetResponder={() => true}>
            <View style={s.paywallIconBox}>
              <Ionicons name="crown" size={28} color="#f59e0b" />
            </View>
            <Text style={s.paywallTitle}>Limit i Arritur</Text>
            <Text style={s.paywallText}>
              Versioni falas lejon vetëm{" "}
              <Text style={{ fontWeight: "700", color: "#059669" }}>5</Text>{" "}
              paketa të përfunduara.
            </Text>
            <Text style={s.paywallSub}>
              Kaloni në planin Premium për akses të pakufizuar.
            </Text>
            <TouchableOpacity style={s.paywallCloseBtn} onPress={() => setShowPaywall(false)} activeOpacity={0.8}>
              <Text style={s.paywallCloseBtnText}>Mbyll</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <SafeAreaView edges={["bottom"]} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>

          <SectionHeader
            gradientColors={["#1e3a5f", "#1d4ed8", "#3b82f6"]}
            icon="mic"
            levels={uniqueLevels.length > 0 ? uniqueLevels : LEVELS}
            {...getSectionTexts("pronunciation", language)}
            selectedLevel={selectedLevel}
            onLevelChange={setSelectedLevel}
          />

          <View style={s.listBody}>
        {/* ── Packages ── */}
        {loading ? (
          <ActivityIndicator color="#1d4ed8" style={{ marginTop: 40 }} size="large" />
        ) : filteredPackages.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="mic-outline" size={40} color="#ccc" />
            <Text style={s.emptyText}>Nuk u gjetën paketa për këtë nivel</Text>
          </View>
        ) : (
          <View style={s.grid}>
            {filteredPackages.map((pkg) => {
              const isCompleted = completedPackages.has(pkg._id.toString());
              const isLocked = !isCompleted && !isPaid && completedPackages.size >= freeLimit;
              const lc = LEVEL_COLORS[pkg.level] || { bg: "#f1f0ec", text: "#555" };

              return (
                <TouchableOpacity
                  key={pkg._id}
                  style={[s.pkgCard, isCompleted && s.pkgCardDone, isLocked && s.pkgCardLocked]}
                  onPress={() => selectPackage(pkg)}
                  activeOpacity={isLocked ? 0.6 : 0.82}
                >
                  {/* top accent bar */}
                  <LinearGradient
                    colors={
                      isCompleted ? ["#2d8a50", "#7dd4a8"]
                        : isLocked ? ["transparent", "transparent"]
                        : ["#1e3a5f", "#1d4ed8", "#3b82f6"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={s.pkgAccent}
                  />

                  <View style={s.pkgCardInner}>
                    <View style={s.pkgCardTop}>
                      <View style={[s.levelTag, { backgroundColor: lc.bg }]}>
                        <Text style={[s.levelTagText, { color: lc.text }]}>{pkg.level}</Text>
                      </View>
                      {isCompleted && <Ionicons name="checkmark-circle" size={16} color="#2d8a50" />}
                      {isLocked && <Ionicons name="lock-closed" size={16} color="#9ca3af" />}
                    </View>

                    <Text style={[s.pkgTitle, isLocked && s.pkgTitleLocked]} numberOfLines={2}>
                      {pkg.title}
                    </Text>
                    <Text style={[s.pkgMeta, isLocked && s.pkgMetaLocked]}>
                      {pkg.words?.length || 0} fjalë
                    </Text>

                    <View style={s.pkgFooter}>
                      <View style={s.pkgStartWrap}>
                        {!isLocked && (
                          <View style={[s.micDot, { backgroundColor: isCompleted ? "#2d8a50" : "#1d4ed8" }]} />
                        )}
                        <Text style={[
                          s.pkgStart,
                          isCompleted && s.pkgStartDone,
                          isLocked && s.pkgStartLocked,
                        ]}>
                          {isCompleted ? "Përfunduar" : isLocked ? "Premium" : "Fillo praktikën"}
                        </Text>
                      </View>
                      <Text style={s.pkgArrow}>→</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f9f7f5" },

  // ── List view
  listBody: { padding: 16, paddingBottom: 40 },

  empty: { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyText: { fontSize: 14, color: "#bbb", fontWeight: "500" },

  grid: { gap: 12 },

  pkgCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ede8e3",
    overflow: "hidden",
  },
  pkgCardDone: { borderColor: "#b6dfc5", backgroundColor: "#fafff9" },
  pkgCardLocked: { borderColor: "#e5e7eb", backgroundColor: "#f9fafb" },
  pkgAccent: { height: 3 },
  pkgCardInner: { padding: 16 },
  pkgCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  levelTag: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 6 },
  levelTagText: { fontSize: 11, fontWeight: "700" },
  pkgTitle: { fontSize: 15, fontWeight: "600", color: "#1a1a1a", marginBottom: 4, lineHeight: 20 },
  pkgTitleLocked: { color: "#9ca3af" },
  pkgMeta: { fontSize: 12, color: "#aaa", marginBottom: 14 },
  pkgMetaLocked: { color: "#d1d5db" },
  pkgFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pkgStartWrap: { flexDirection: "row", alignItems: "center", gap: 5 },
  micDot: { width: 6, height: 6, borderRadius: 3 },
  pkgStart: { fontSize: 12, fontWeight: "600", color: "#1d4ed8" },
  pkgStartDone: { color: "#2d8a50" },
  pkgStartLocked: { color: "#9ca3af" },
  pkgArrow: { fontSize: 14, color: "#ddd" },

  // ── Practice view
  practiceScroll: { padding: 20, paddingBottom: 40 },

  practiceTopbar: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5ddd8",
    alignItems: "center", justifyContent: "center",
  },
  pkgName: { fontSize: 12, color: "#888", fontWeight: "500", marginBottom: 5 },
  progressTrack: { height: 5, backgroundColor: "#dbeafe", borderRadius: 10, overflow: "hidden" },
  progressFill: {
    height: "100%",
    backgroundColor: "#1d4ed8",
    borderRadius: 10,
  },
  wordCounter: { fontSize: 12, color: "#aaa", fontWeight: "500" },

  dots: { flexDirection: "row", flexWrap: "wrap", gap: 4, justifyContent: "center", marginBottom: 20 },
  dot: { width: 8, height: 5, borderRadius: 10, backgroundColor: "#ede9e3" },
  dotCurrent: { width: 14, backgroundColor: "#93c5fd" },
  dotDone: { width: 14, backgroundColor: "#1d4ed8" },

  wordCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ede8e3",
    padding: 28,
    alignItems: "center",
    marginBottom: 14,
  },
  doneBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#edf7f0",
    borderWidth: 1, borderColor: "#b6dfc5",
    paddingHorizontal: 11, paddingVertical: 4,
    borderRadius: 20, marginBottom: 14,
  },
  doneBadgeText: { fontSize: 11, fontWeight: "700", color: "#2d8a50" },
  wordMain: { fontSize: 44, fontWeight: "800", color: "#111", letterSpacing: -1, marginBottom: 8, textAlign: "center" },
  wordPhonetic: { fontSize: 16, color: "#1d4ed8", fontStyle: "italic", marginBottom: 4, textAlign: "center" },
  wordTranslation: { fontSize: 14, color: "#aaa", marginBottom: 20, textAlign: "center" },
  listenBtn: {
    flexDirection: "row", alignItems: "center", gap: 7,
    backgroundColor: "#eff6ff",
    borderWidth: 1, borderColor: "#bfdbfe",
    paddingHorizontal: 18, paddingVertical: 9,
    borderRadius: 20,
  },
  listenBtnDisabled: { backgroundColor: "#f5f5f5", borderColor: "#e0e0e0" },
  listenBtnText: { fontSize: 13, fontWeight: "600", color: "#1d4ed8" },

  micCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ede8e3",
    padding: 24,
    alignItems: "center",
  },
  micInstruction: { fontSize: 13, color: "#aaa", marginBottom: 22, textAlign: "center" },

  micOuter: { alignItems: "center", justifyContent: "center", marginBottom: 10 },
  micRing: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "#1d4ed8",
    opacity: 0.35,
  },
  micRing1: { width: 80, height: 80 },
  micRing2: { width: 100, height: 100, opacity: 0.22 },
  micRing3: { width: 120, height: 120, opacity: 0.12 },
  micBtn: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#1d4ed8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    backgroundColor: "#1d4ed8",
  },
  micBtnListening: { backgroundColor: "#1e40af" },
  micBtnDone: {
    backgroundColor: "#ddd",
    shadowOpacity: 0,
    elevation: 0,
  },

  waveform: { flexDirection: "row", alignItems: "flex-end", gap: 4, height: 28, marginTop: 12 },
  waveBar: { width: 4, backgroundColor: "#1d4ed8", borderRadius: 4 },

  feedbackBox: {
    flexDirection: "row", alignItems: "center", gap: 9,
    marginTop: 16, paddingHorizontal: 14, paddingVertical: 11,
    borderRadius: 12, borderWidth: 1, width: "100%",
  },
  feedbackCorrect: { backgroundColor: "#edf7f0", borderColor: "#b6dfc5" },
  feedbackWrong: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  feedbackError: { backgroundColor: "#f8f8f8", borderColor: "#e0e0e0" },
  feedbackText: { fontSize: 13, fontWeight: "500", flex: 1 },
  feedbackXP: { color: "#1d4ed8", fontWeight: "700" },
  feedbackScore: {
    fontSize: 12, fontWeight: "700", color: "#2d8a50",
    backgroundColor: "rgba(45,138,80,0.12)",
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20,
  },
  feedbackScoreWrong: {
    color: "#b91c1c", backgroundColor: "rgba(185,28,28,0.1)",
  },

  // ── Results view
  resultsWrap: { flex: 1, justifyContent: "center", padding: 24 },
  resultsHero: { borderRadius: 20, padding: 32, alignItems: "center", marginBottom: 0 },
  resultsTrophy: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 14,
  },
  resultsTitle: { fontSize: 22, fontWeight: "800", color: "#fff", marginBottom: 4, textAlign: "center" },
  resultsSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.75)", textAlign: "center" },

  resultsStats: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1,
    borderColor: "#ede8e3",
    paddingVertical: 20,
  },
  resultsStat: { flex: 1, alignItems: "center" },
  resultsStatNum: { fontSize: 24, fontWeight: "700", color: "#1d4ed8" },
  resultsStatLabel: { fontSize: 11, color: "#bbb", marginTop: 4 },

  resultsActions: {
    backgroundColor: "#fff",
    borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1,
    borderColor: "#ede8e3",
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
    padding: 18, gap: 10,
  },
  btnPrimary: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#1d4ed8",
    paddingVertical: 14, borderRadius: 12,
    shadowColor: "#1d4ed8", shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8,
    elevation: 4,
  },
  btnPrimaryText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  btnSecondary: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#f5f3ef", paddingVertical: 14, borderRadius: 12,
  },
  btnSecondaryText: { color: "#555", fontSize: 14, fontWeight: "600" },

  // ── Paywall
  paywallOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", padding: 24 },
  paywallCard: {
    backgroundColor: "#fff", borderRadius: 24, padding: 28, width: "100%",
    alignItems: "center", borderWidth: 2, borderColor: "#d1fae5",
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  paywallIconBox: {
    width: 72, height: 72, borderRadius: 18,
    backgroundColor: "#fffbeb", borderWidth: 2, borderColor: "#fcd34d",
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  paywallTitle: { fontSize: 20, fontWeight: "800", color: "#1a1a1a", marginBottom: 8 },
  paywallText: { fontSize: 14, color: "#555", textAlign: "center", marginBottom: 6, lineHeight: 20 },
  paywallSub: { fontSize: 12, color: "#aaa", textAlign: "center", marginBottom: 20, lineHeight: 18 },
  paywallCloseBtn: {
    width: "100%", paddingVertical: 13, borderRadius: 12,
    backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#e2e8f0",
    alignItems: "center",
  },
  paywallCloseBtnText: { fontSize: 14, fontWeight: "700", color: "#555" },
});
