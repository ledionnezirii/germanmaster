import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Audio } from "expo-av";
import { listenService, ttsService } from "../../services/api";

const BASE_HEIGHTS = [14, 22, 16, 28, 18, 26, 13];

export default function ListenDetailScreen({ route, navigation }) {
  const { test } = route.params;
  const insets = useSafeAreaInsets();

  const [sound, setSound]               = useState(null);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [audioError, setAudioError]     = useState(false);
  const [isPlaying, setIsPlaying]       = useState(false);
  const [userAnswer, setUserAnswer]     = useState("");
  const [result, setResult]             = useState(null);
  const [submitting, setSubmitting]     = useState(false);
  const [playCount, setPlayCount]       = useState(0);

  // ── Wave animation ──────────────────────────────────────────────────────────
  const waveAnims = useRef(BASE_HEIGHTS.map(() => new Animated.Value(0))).current;
  const waveLoops = useRef([]);

  useEffect(() => {
    waveLoops.current.forEach((a) => a.stop());
    waveLoops.current = [];

    if (isPlaying) {
      waveLoops.current = waveAnims.map((anim, i) => {
        const loop = Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 280 + i * 35,
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 280 + i * 35,
              useNativeDriver: false,
            }),
          ])
        );
        setTimeout(() => loop.start(), i * 70);
        return loop;
      });
    } else {
      waveAnims.forEach((anim) =>
        Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: false }).start()
      );
    }

    return () => waveLoops.current.forEach((a) => a.stop());
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
      waveLoops.current.forEach((a) => a.stop());
    };
  }, [sound]);

  const answerLength = userAnswer.trim().length;
  const progress = Math.min((answerLength / 120) * 100, 100);

  // ── Audio ───────────────────────────────────────────────────────────────────
  async function loadAndPlay() {
    if (loadingAudio) return;
    setLoadingAudio(true);
    setAudioError(false);

    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      let audioUrl = null;
      try {
        const res = await ttsService.getListenAudio(test._id, {
          text: test.text,
          level: test.level,
        });
        audioUrl = res.data?.url || res.data?.audioUrl;
      } catch {
        if (test.audioUrl) audioUrl = test.audioUrl;
      }

      if (!audioUrl) {
        setAudioError(true);
        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        setIsPlaying(Boolean(status.isPlaying));
        if (status.didJustFinish) setIsPlaying(false);
      });

      setSound(newSound);
      setIsPlaying(true);
      setPlayCount((c) => c + 1);
    } catch {
      setIsPlaying(false);
      setAudioError(true);
    } finally {
      setLoadingAudio(false);
    }
  }

  async function togglePlayPause() {
    if (!sound) { await loadAndPlay(); return; }

    const status = await sound.getStatusAsync();
    if (!status.isLoaded) { await loadAndPlay(); return; }

    if (status.isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
    } else {
      const didFinish =
        status.didJustFinish ||
        (typeof status.positionMillis === "number" &&
          typeof status.durationMillis === "number" &&
          status.durationMillis > 0 &&
          status.positionMillis >= status.durationMillis - 250);

      if (didFinish) {
        await sound.setPositionAsync(0);
        setPlayCount((c) => c + 1);
      }
      await sound.playAsync();
      setIsPlaying(true);
    }
  }

  async function submitAnswer() {
    if (!userAnswer.trim()) {
      Alert.alert("Përgjigja mungon", "Shkruaj çfarë dëgjove para se të kontrollosh.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await listenService.checkAnswer({ testId: test._id, userAnswer: userAnswer.trim() });
      setResult(res.data);
      if (res.data?.limitReached) {
        Alert.alert("Premium i nevojshëm", "Keni arritur kufirin falas. Kaloni në Premium për akses të pakufizuar.");
      }
    } catch (err) {
      Alert.alert("Gabim", err.response?.data?.message || "Dështoi kontrolli i përgjigjes.");
    } finally {
      setSubmitting(false);
    }
  }

  async function resetAttempt() {
    setResult(null);
    setUserAnswer("");
    setPlayCount(0);
    setIsPlaying(false);
    setAudioError(false);
    if (sound) { await sound.unloadAsync(); setSound(null); }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#0b132b", "#1c2541", "#0ea5e9"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroBg}
      />
      <View style={styles.glowOne} />
      <View style={styles.glowTwo} />

      <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
        {/* ── Header ── */}
        <LinearGradient
          colors={["rgba(11,19,43,0.95)", "rgba(28,37,65,0.85)", "transparent"]}
          style={[styles.topBar, { paddingTop: insets.top + 10 }]}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
            <Ionicons name="arrow-back" size={20} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.topBarCenter}>
            <Text numberOfLines={1} style={styles.topTitle}>{test.title}</Text>
            <Text style={styles.topSub}>Dëgjo me kujdes dhe shkruaj çfarë dëgjon</Text>
          </View>

          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>{test.level}</Text>
          </View>
        </LinearGradient>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={0}
        >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ── Player card ── */}
          <View style={styles.playerCard}>
            <View style={styles.playerCardTop}>
              <Text style={styles.playerCardTitle}>Ushtrim dëgjimi</Text>
              {playCount > 0 && (
                <View style={styles.playCountBadge}>
                  <Ionicons name="repeat" size={11} color="#93c5fd" />
                  <Text style={styles.playCountText}>{playCount}×</Text>
                </View>
              )}
            </View>

            {/* Animated wave */}
            <View style={styles.waveRow}>
              {BASE_HEIGHTS.map((base, i) => {
                const animatedHeight = waveAnims[i].interpolate({
                  inputRange: [0, 1],
                  outputRange: [base, base + 16],
                });
                return (
                  <Animated.View
                    key={i}
                    style={[
                      styles.waveBar,
                      {
                        height: animatedHeight,
                        opacity: isPlaying ? 1 : loadingAudio ? 0.5 : 0.45,
                        backgroundColor: isPlaying ? "#60a5fa" : "#bfdbfe",
                      },
                    ]}
                  />
                );
              })}
            </View>

            {audioError ? (
              <View style={styles.audioErrorRow}>
                <Ionicons name="alert-circle-outline" size={18} color="#fca5a5" />
                <Text style={styles.audioErrorText}>Nuk u ngarkua audio.</Text>
                <TouchableOpacity style={styles.audioRetryBtn} onPress={loadAndPlay}>
                  <Text style={styles.audioRetryText}>Riprovo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.playerRow}>
                <TouchableOpacity
                  style={[styles.playBtn, loadingAudio && styles.playBtnLoading]}
                  onPress={togglePlayPause}
                  disabled={loadingAudio}
                  activeOpacity={0.85}
                >
                  {loadingAudio
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Ionicons name={isPlaying ? "pause" : "play"} size={26} color="#fff" />
                  }
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                  <Text style={styles.playStateText}>
                    {loadingAudio
                      ? "Duke ngarkuar..."
                      : isPlaying
                        ? "Duke luajtur..."
                        : playCount === 0
                          ? "Gati për të dëgjuar"
                          : "I ndërprerë"}
                  </Text>
                  <Text style={styles.playHintText}>
                    Shtyp sa herë të duhet për të dëgjuar mirë.
                  </Text>
                </View>
              </View>
            )}

            {playCount > 0 && !audioError && (
              <TouchableOpacity style={styles.replayBtn} onPress={loadAndPlay} activeOpacity={0.8}>
                <Ionicons name="refresh-outline" size={15} color="#0f172a" />
                <Text style={styles.replayBtnText}>Dëgjo sërisht nga fillimi</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── Answer card ── */}
          <View style={styles.answerCard}>
            <View style={styles.answerHeader}>
              <Text style={styles.answerTitle}>Përgjigja jote</Text>
              <Text style={styles.answerCounter}>{answerLength} shkronja</Text>
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>

            <TextInput
              style={styles.answerInput}
              placeholder="Shkruaj fjalinë që dëgjove..."
              placeholderTextColor="#94a3b8"
              value={userAnswer}
              onChangeText={setUserAnswer}
              multiline
              numberOfLines={5}
              autoCorrect={false}
              textAlignVertical="top"
            />

            {!result && (
              <TouchableOpacity
                style={[styles.checkBtn, submitting && styles.checkBtnDisabled]}
                onPress={submitAnswer}
                disabled={submitting}
                activeOpacity={0.88}
              >
                {submitting
                  ? <ActivityIndicator color="#fff" />
                  : <>
                      <Ionicons name="sparkles" size={16} color="#fff" />
                      <Text style={styles.checkBtnText}>Kontrollo përgjigjen</Text>
                    </>
                }
              </TouchableOpacity>
            )}
          </View>

          {/* ── Result card ── */}
          {result && (
            <View style={[styles.resultCard, result.correct ? styles.resultCardOk : styles.resultCardErr]}>
              <View style={styles.resultTop}>
                <View style={[styles.resultIcon, result.correct ? styles.resultIconOk : styles.resultIconErr]}>
                  <Ionicons
                    name={result.correct ? "checkmark-circle" : "alert-circle"}
                    size={26}
                    color={result.correct ? "#166534" : "#9f1239"}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultHeading}>
                    {result.correct ? "Dëgjim i shkëlqyer!" : "Pothuajse saktë!"}
                  </Text>
                  <Text style={styles.resultSub}>
                    {result.message || "Shiko fjalinë e saktë dhe provo sërisht."}
                  </Text>
                </View>
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreBadgeVal}>{result.score || 0}%</Text>
                  <Text style={styles.scoreBadgeLbl}>Rezultat</Text>
                </View>
              </View>

              <View style={styles.resultStats}>
                <View style={styles.resultStat}>
                  <Text style={styles.resultStatVal}>{result.xpAwarded || 0}</Text>
                  <Text style={styles.resultStatLbl}>XP</Text>
                </View>
                <View style={styles.resultStat}>
                  <Text style={styles.resultStatVal}>{playCount}</Text>
                  <Text style={styles.resultStatLbl}>Dëgjime</Text>
                </View>
              </View>

              <View style={styles.compareBox}>
                <Text style={styles.compareLabel}>Përgjigja jote</Text>
                <Text style={styles.compareText}>{result.userAnswer}</Text>
                <Text style={[styles.compareLabel, { marginTop: 12 }]}>Transkripti i saktë</Text>
                <Text style={[styles.compareText, { color: "#166534" }]}>{result.correctAnswer}</Text>
              </View>

              <TouchableOpacity style={styles.retryBtn} onPress={resetAttempt} activeOpacity={0.85}>
                <Ionicons name="refresh-outline" size={15} color="#0f172a" />
                <Text style={styles.retryBtnText}>Provo sërisht</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: "#eef4f7" },
  heroBg:  { ...StyleSheet.absoluteFillObject, height: 320 },
  glowOne: { position: "absolute", top: 62,  right: -32, width: 150, height: 150, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.07)" },
  glowTwo: { position: "absolute", top: 190, left:  -34, width: 120, height: 120, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.05)" },
  safeArea: { flex: 1 },

  // ── Header
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center", justifyContent: "center",
  },
  topBarCenter: { flex: 1, minWidth: 0 },
  topTitle:     { color: "#fff", fontSize: 17, fontWeight: "800", lineHeight: 22 },
  topSub:       { color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 2, lineHeight: 15 },
  levelBadge:   { backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  levelBadgeText: { color: "#fff", fontSize: 11, fontWeight: "900" },

  content: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 4 },

  // ── Player card
  playerCard: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 26, padding: 18, marginBottom: 14,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
  },
  playerCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  playerCardTitle: { color: "#fff", fontSize: 14, fontWeight: "800" },
  playCountBadge:  { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(7,18,36,0.3)", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  playCountText:   { color: "#93c5fd", fontSize: 11, fontWeight: "800" },

  waveRow: { flexDirection: "row", justifyContent: "center", alignItems: "flex-end", gap: 6, height: 44, marginBottom: 18 },
  waveBar: { width: 9, borderRadius: 999 },

  audioErrorRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(185,28,28,0.28)", borderRadius: 14, padding: 12 },
  audioErrorText: { flex: 1, color: "#fecaca", fontSize: 13, fontWeight: "600" },
  audioRetryBtn:  { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 8, paddingHorizontal: 11, paddingVertical: 5 },
  audioRetryText: { color: "#fff", fontSize: 12, fontWeight: "800" },

  playerRow:     { flexDirection: "row", alignItems: "center", gap: 14 },
  playBtn: {
    width: 66, height: 66, borderRadius: 999,
    backgroundColor: "#0c1a3a",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  playBtnLoading: { opacity: 0.65 },
  playStateText:  { color: "#fff", fontSize: 15, fontWeight: "800", marginBottom: 4 },
  playHintText:   { color: "rgba(255,255,255,0.65)", fontSize: 12, lineHeight: 17 },

  replayBtn: { marginTop: 14, backgroundColor: "#fff8f0", borderRadius: 14, paddingVertical: 11, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  replayBtnText: { color: "#0f172a", fontSize: 13, fontWeight: "700" },

  // ── Answer card
  answerCard: { backgroundColor: "#fff", borderRadius: 26, padding: 18, marginBottom: 14, shadowColor: "#0f172a", shadowOpacity: 0.07, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  answerHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  answerTitle:   { color: "#0f172a", fontSize: 15, fontWeight: "800" },
  answerCounter: { color: "#94a3b8", fontSize: 12, fontWeight: "700" },
  progressTrack: { height: 6, borderRadius: 999, backgroundColor: "#e2e8f0", overflow: "hidden", marginBottom: 12 },
  progressFill:  { height: 6, borderRadius: 999, backgroundColor: "#0ea5e9" },
  answerInput: {
    minHeight: 110, borderRadius: 18, borderWidth: 1.5, borderColor: "#dbe3ed",
    backgroundColor: "#f8fafc", color: "#0f172a",
    paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 15, fontWeight: "500", lineHeight: 22, marginBottom: 14,
  },
  checkBtn:         { backgroundColor: "#0f766e", borderRadius: 18, paddingVertical: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 },
  checkBtnDisabled: { opacity: 0.55 },
  checkBtnText:     { color: "#fff", fontSize: 15, fontWeight: "900" },

  // ── Result card
  resultCard:    { borderRadius: 26, padding: 18, marginBottom: 10 },
  resultCardOk:  { backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0" },
  resultCardErr: { backgroundColor: "#fff1f2", borderWidth: 1, borderColor: "#fecdd3" },
  resultTop:     { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  resultIcon:    { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  resultIconOk:  { backgroundColor: "#dcfce7" },
  resultIconErr: { backgroundColor: "#ffe4e6" },
  resultHeading: { color: "#0f172a", fontSize: 17, fontWeight: "800", marginBottom: 2 },
  resultSub:     { color: "#64748b", fontSize: 13, lineHeight: 18 },
  scoreBadge:    { backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 11, paddingVertical: 8, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  scoreBadgeVal: { color: "#0f172a", fontSize: 16, fontWeight: "900" },
  scoreBadgeLbl: { color: "#94a3b8", fontSize: 9, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  resultStats:   { flexDirection: "row", gap: 10, marginBottom: 14 },
  resultStat:    { flex: 1, backgroundColor: "#fff", borderRadius: 18, paddingVertical: 14, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  resultStatVal: { color: "#0f172a", fontSize: 22, fontWeight: "900" },
  resultStatLbl: { color: "#94a3b8", fontSize: 11, fontWeight: "700", marginTop: 3 },
  compareBox:    { backgroundColor: "rgba(255,255,255,0.75)", borderRadius: 18, padding: 14, marginBottom: 14 },
  compareLabel:  { color: "#94a3b8", fontSize: 10, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 },
  compareText:   { color: "#0f172a", fontSize: 14, fontWeight: "600", lineHeight: 21 },
  retryBtn:      { backgroundColor: "#fff", borderRadius: 16, paddingVertical: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  retryBtnText:  { color: "#0f172a", fontSize: 14, fontWeight: "800" },
});
