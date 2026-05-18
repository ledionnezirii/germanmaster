import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Audio } from "expo-av";
import { dictionaryService, ttsService } from "../../services/api";
import { F } from "../../styles/fonts";

const { width: SCREEN_W } = Dimensions.get("window");
const GRID_PAD = 18;
const GRID_GAP = 12;
const INFO_W = (SCREEN_W - GRID_PAD * 2 - GRID_GAP) / 2;

const LEVEL_STYLES = {
  A1: { tint: "#10b981", soft: "#d1fae5", grad: ["#34d399", "#10b981"], depth: "#6ee7b7" },
  A2: { tint: "#0ea5e9", soft: "#e0f2fe", grad: ["#38bdf8", "#0ea5e9"], depth: "#7dd3fc" },
  B1: { tint: "#6366f1", soft: "#e0e7ff", grad: ["#818cf8", "#6366f1"], depth: "#a5b4fc" },
  B2: { tint: "#ec4899", soft: "#fce7f3", grad: ["#f472b6", "#ec4899"], depth: "#f9a8d4" },
  C1: { tint: "#f97316", soft: "#ffedd5", grad: ["#fb923c", "#f97316"], depth: "#fdba74" },
  C2: { tint: "#ef4444", soft: "#fee2e2", grad: ["#f87171", "#ef4444"], depth: "#fca5a5" },
};

const INFO_COLORS = {
  "Përkthimi":  "#6366f1",
  "Neni":       "#0ea5e9",
  "Shumësi":    "#ec4899",
  "Lloji":      "#f97316",
  "Shqiptimi":  "#10b981",
};

export default function WordDetailScreen({ route, navigation }) {
  const { word: routeWord } = route.params;

  const [word, setWord]           = useState(routeWord);
  const [loadingWord, setLoadingWord] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [sound, setSound]         = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => { loadFreshWord(); }, [routeWord?._id]);
  useEffect(() => () => { if (sound) sound.unloadAsync(); }, [sound]);

  async function loadFreshWord() {
    if (!routeWord?._id) return;
    setLoadingWord(true);
    try {
      const res = await dictionaryService.getById(routeWord._id);
      setWord(res.data || routeWord);
    } catch {
      setWord(routeWord);
    } finally {
      setLoadingWord(false);
    }
  }

  async function playAudio() {
    if (loadingAudio || !word?._id) return;
    setLoadingAudio(true);
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      if (sound) { await sound.unloadAsync(); setSound(null); }
      const res = await ttsService.getWordAudio(word._id);
      const audioUrl = res.data?.audioUrl || res.data?.url;
      if (!audioUrl) return;
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );
      newSound.setOnPlaybackStatusUpdate((s) => {
        if (!s.isLoaded) return;
        setIsPlaying(Boolean(s.isPlaying));
        if (s.didJustFinish) setIsPlaying(false);
      });
      setSound(newSound);
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    } finally {
      setLoadingAudio(false);
    }
  }

  const german      = word?.word          || word?.deutsch || "";
  const translation = word?.translation   || word?.english || word?.shqip || "";
  const example     = word?.example       || word?.exampleSentence || "";
  const exTrans     = word?.exampleTranslation || "";
  const article     = word?.article       || "";
  const plural      = word?.plural        || "";
  const wordType    = word?.wordType      || word?.partOfSpeech || "";
  const pronunc     = word?.pronunciation || "";
  const palette     = LEVEL_STYLES[word?.level] || LEVEL_STYLES.A1;

  const infoItems = useMemo(
    () =>
      [
        { label: "Përkthimi", value: translation, icon: "swap-horizontal-outline", full: true },
        { label: "Neni",      value: article,     icon: "bookmark-outline",        full: false },
        { label: "Shumësi",   value: plural,      icon: "copy-outline",            full: false },
        { label: "Lloji",     value: wordType,    icon: "shapes-outline",          full: false },
        { label: "Shqiptimi", value: pronunc,     icon: "mic-outline",             full: false },
      ].filter((i) => i.value),
    [translation, article, plural, wordType, pronunc]
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>

        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Detajet e Fjalës</Text>
          {word?.level ? (
            <View style={[styles.levelPill, { backgroundColor: palette.soft }]}>
              <Text style={[styles.levelPillText, { color: palette.tint }]}>{word.level}</Text>
            </View>
          ) : (
            <View style={{ width: 48 }} />
          )}
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Hero card (3D) ── */}
          <View style={styles.heroOuter}>
            <View style={[styles.heroDepth, { backgroundColor: palette.depth }]} />
            <LinearGradient
              colors={palette.grad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              {/* Decorative bubbles */}
              <View style={styles.bubble1} />
              <View style={styles.bubble2} />

              {/* Language icon badge */}
              <View style={styles.heroBadge}>
                <Ionicons name="language" size={22} color="#fff" />
              </View>

              {/* German word */}
              <Text style={styles.heroWord}>{german}</Text>

              {/* Translation */}
              <Text style={styles.heroTranslation}>{translation}</Text>

              {/* Audio button */}
              <TouchableOpacity
                onPress={playAudio}
                disabled={loadingAudio}
                activeOpacity={0.88}
                style={[styles.audioBtn, loadingAudio && { opacity: 0.7 }]}
              >
                {loadingAudio ? (
                  <ActivityIndicator color={palette.tint} size="small" />
                ) : (
                  <Ionicons
                    name={isPlaying ? "volume-high" : "play-circle"}
                    size={20}
                    color={palette.tint}
                  />
                )}
                <Text style={[styles.audioBtnText, { color: palette.tint }]}>
                  {isPlaying ? "Duke luajtur..." : "Dëgjo shqiptimin"}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* Loading refresh indicator */}
          {loadingWord && (
            <View style={styles.refreshRow}>
              <ActivityIndicator color={palette.tint} size="small" />
              <Text style={styles.refreshText}>Duke rifreskuar...</Text>
            </View>
          )}

          {/* ── Info cards grid (3D) ── */}
          {infoItems.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Informacion i Fjalës</Text>
              <View style={styles.infoGrid}>
                {infoItems.map((item) => {
                  const color = INFO_COLORS[item.label] || palette.tint;
                  const cardW = item.full ? SCREEN_W - GRID_PAD * 2 : INFO_W;
                  return (
                    <View key={item.label} style={[styles.infoWrapper, { width: cardW }]}>
                      {/* 3D depth border effect */}
                      <View
                        style={[
                          styles.infoFace,
                          {
                            borderBottomColor: color + "70",
                            borderRightColor:  color + "70",
                          },
                        ]}
                      >
                        <View style={[styles.infoIcon, { backgroundColor: color + "15" }]}>
                          <Ionicons name={item.icon} size={16} color={color} />
                        </View>
                        <Text style={styles.infoLabel}>{item.label}</Text>
                        <Text style={styles.infoValue} numberOfLines={2}>{item.value}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {/* ── Example sentence card (3D) ── */}
          {example ? (
            <>
              <Text style={styles.sectionLabel}>Shembull Fjalie</Text>
              <View style={styles.exWrapper}>
                <View style={styles.exDepth} />
                <View style={styles.exFace}>
                  <View style={styles.exHeaderRow}>
                    <View style={styles.exIconWrap}>
                      <Ionicons name="chatbubble-ellipses-outline" size={14} color="#10b981" />
                    </View>
                    <Text style={styles.exLang}>Gjermanisht</Text>
                  </View>
                  <Text style={styles.exText}>"{example}"</Text>
                  {exTrans ? (
                    <Text style={styles.exTranslation}>{exTrans}</Text>
                  ) : null}
                </View>
              </View>
            </>
          ) : null}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f1f5f9" },
  safe: { flex: 1 },

  // ── Top bar ──
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: GRID_PAD,
    paddingTop: 6,
    paddingBottom: 14,
    gap: 12,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  topTitle: {
    flex: 1,
    color: "#0f172a",
    fontSize: 19,
    fontFamily: F.black,
  },
  levelPill: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  levelPillText: {
    fontSize: 12,
    fontFamily: F.black,
  },

  // ── Scroll ──
  scroll: {
    paddingHorizontal: GRID_PAD,
    paddingBottom: 40,
  },

  // ── Hero 3D ──
  heroOuter: {
    position: "relative",
    marginBottom: 28,
    // extra margin so depth shadow doesn't clip
  },
  heroDepth: {
    position: "absolute",
    top: 8,
    left: 6,
    right: -6,
    bottom: -8,
    borderRadius: 28,
    opacity: 0.4,
  },
  heroCard: {
    borderRadius: 28,
    paddingHorizontal: 26,
    paddingTop: 30,
    paddingBottom: 26,
    alignItems: "center",
    overflow: "hidden",
  },
  bubble1: {
    position: "absolute",
    top: -50,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  bubble2: {
    position: "absolute",
    bottom: -55,
    left: -25,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  heroBadge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  heroWord: {
    color: "#fff",
    fontSize: 44,
    fontFamily: F.black,
    textAlign: "center",
    lineHeight: 50,
    marginBottom: 10,
  },
  heroTranslation: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 17,
    fontFamily: F.semi,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  audioBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 13,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  audioBtnText: {
    fontSize: 15,
    fontFamily: F.xbold,
  },

  // ── Refresh ──
  refreshRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  refreshText: {
    color: "#64748b",
    fontSize: 13,
    fontFamily: F.bold,
  },

  // ── Section label ──
  sectionLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontFamily: F.black,
    textTransform: "uppercase",
    letterSpacing: 1.1,
    marginBottom: 12,
  },

  // ── Info grid ──
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
    marginBottom: 26,
  },
  infoWrapper: {
    // width set inline
  },
  infoFace: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    // top + left: subtle light border
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderTopColor: "#e8ecf1",
    borderLeftColor: "#e8ecf1",
    // bottom + right: thick colored border = 3D effect
    borderBottomWidth: 4,
    borderRightWidth: 3,
    // borderBottomColor + borderRightColor set inline
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  infoLabel: {
    color: "#94a3b8",
    fontSize: 10,
    fontFamily: F.black,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  infoValue: {
    color: "#0f172a",
    fontSize: 19,
    fontFamily: F.xbold,
    lineHeight: 25,
  },

  // ── Example card (3D) ──
  exWrapper: {
    position: "relative",
    marginBottom: 12,
  },
  exDepth: {
    position: "absolute",
    top: 6,
    left: 5,
    right: -5,
    bottom: -6,
    borderRadius: 22,
    backgroundColor: "#6ee7b7",
    opacity: 0.35,
  },
  exFace: {
    backgroundColor: "#f0fdf4",
    borderRadius: 22,
    padding: 18,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderTopColor: "#bbf7d0",
    borderLeftColor: "#bbf7d0",
    borderBottomWidth: 4,
    borderRightWidth: 3,
    borderBottomColor: "#10b98170",
    borderRightColor: "#10b98170",
  },
  exHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  exIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "#d1fae5",
    alignItems: "center",
    justifyContent: "center",
  },
  exLang: {
    color: "#166534",
    fontSize: 11,
    fontFamily: F.black,
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
  exText: {
    color: "#14532d",
    fontSize: 16,
    fontFamily: F.bold,
    lineHeight: 25,
    marginBottom: 8,
  },
  exTranslation: {
    color: "#4b5563",
    fontSize: 13,
    fontFamily: F.semi,
    lineHeight: 20,
    fontStyle: "italic",
  },
});
