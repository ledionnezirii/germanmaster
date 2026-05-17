import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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

const LEVEL_STYLES = {
  A1: { tint: "#10b981", soft: "#d1fae5" },
  A2: { tint: "#0ea5e9", soft: "#e0f2fe" },
  B1: { tint: "#6366f1", soft: "#e0e7ff" },
  B2: { tint: "#ec4899", soft: "#fce7f3" },
  C1: { tint: "#f97316", soft: "#ffedd5" },
  C2: { tint: "#ef4444", soft: "#fee2e2" },
};

export default function WordDetailScreen({ route, navigation }) {
  const { word: routeWord } = route.params;

  const [word, setWord] = useState(routeWord);
  const [loadingWord, setLoadingWord] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    loadFreshWord();
  }, [routeWord?._id]);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

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

      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      const res = await ttsService.getWordAudio(word._id);
      const audioUrl = res.data?.audioUrl || res.data?.url;
      if (!audioUrl) return;

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        setIsPlaying(Boolean(status.isPlaying));
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });

      setSound(newSound);
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    } finally {
      setLoadingAudio(false);
    }
  }

  const german = word?.word || word?.deutsch || "";
  const translation = word?.translation || word?.english || word?.shqip || "";
  const example = word?.example || word?.exampleSentence || "";
  const exampleTranslation = word?.exampleTranslation || "";
  const article = word?.article || "";
  const plural = word?.plural || "";
  const wordType = word?.wordType || "";
  const pronunciation = word?.pronunciation || "";
  const palette = LEVEL_STYLES[word?.level] || LEVEL_STYLES.A1;

  const infoCards = useMemo(
    () =>
      [
        { label: "Translation", value: translation, icon: "swap-horizontal-outline" },
        { label: "Article", value: article, icon: "bookmark-outline" },
        { label: "Plural", value: plural, icon: "copy-outline" },
        { label: "Type", value: wordType, icon: "shapes-outline" },
        { label: "Pronunciation", value: pronunciation, icon: "mic-outline" },
      ].filter((item) => item.value),
    [translation, article, plural, wordType, pronunciation]
  );

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#0f172a", "#0f766e", "#84cc16"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroBg}
      />
      <View style={styles.glowOne} />
      <View style={styles.glowTwo} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.topBarTextWrap}>
            <Text style={styles.topBarTitle}>Word detail</Text>
            <Text style={styles.topBarSubtitle}>Study the word and hear the pronunciation.</Text>
          </View>

          {word?.level ? (
            <View style={[styles.levelPill, { backgroundColor: palette.soft }]}>
              <Text style={[styles.levelPillText, { color: palette.tint }]}>{word.level}</Text>
            </View>
          ) : (
            <View style={{ width: 44 }} />
          )}
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <View style={[styles.wordBadge, { backgroundColor: palette.soft }]}>
              <Ionicons name="language" size={22} color={palette.tint} />
            </View>

            <Text style={styles.germanWord}>{german}</Text>
            <Text style={styles.translationText}>{translation || "No translation available"}</Text>

            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.audioButton, loadingAudio && styles.audioButtonDisabled]}
              onPress={playAudio}
              disabled={loadingAudio}
            >
              {loadingAudio ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Ionicons
                  name={isPlaying ? "volume-high" : "play"}
                  size={18}
                  color="#ffffff"
                />
              )}
              <Text style={styles.audioButtonText}>
                {isPlaying ? "Playing..." : "Listen"}
              </Text>
            </TouchableOpacity>
          </View>

          {loadingWord ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color="#0f766e" />
              <Text style={styles.loadingText}>Refreshing word details...</Text>
            </View>
          ) : null}

          <View style={styles.gridWrap}>
            {infoCards.map((item) => (
              <View key={item.label} style={styles.infoCard}>
                <View style={styles.infoHeader}>
                  <Ionicons name={item.icon} size={16} color="#0f766e" />
                  <Text style={styles.infoLabel}>{item.label}</Text>
                </View>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            ))}
          </View>

          {example ? (
            <View style={styles.exampleCard}>
              <View style={styles.exampleHeader}>
                <Ionicons name="chatbubble-ellipses-outline" size={16} color="#166534" />
                <Text style={styles.exampleLabel}>Example sentence</Text>
              </View>
              <Text style={styles.exampleText}>{example}</Text>
              {exampleTranslation ? (
                <Text style={styles.exampleTranslation}>{exampleTranslation}</Text>
              ) : null}
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#eef4f7",
  },
  heroBg: {
    ...StyleSheet.absoluteFillObject,
    height: 320,
  },
  glowOne: {
    position: "absolute",
    top: 56,
    right: -32,
    width: 150,
    height: 150,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  glowTwo: {
    position: "absolute",
    top: 190,
    left: -36,
    width: 130,
    height: 130,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 18,
    gap: 12,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  topBarTitle: {
    color: "#ffffff",
    fontSize: 19,
    fontWeight: "800",
  },
  topBarSubtitle: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    marginTop: 2,
  },
  levelPill: {
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  levelPillText: {
    fontSize: 11,
    fontWeight: "900",
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 28,
  },
  heroCard: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 30,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  wordBadge: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  germanWord: {
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "900",
    textAlign: "center",
  },
  translationText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },
  audioButton: {
    marginTop: 18,
    backgroundColor: "#0f172a",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  audioButtonDisabled: {
    opacity: 0.7,
  },
  audioButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  loadingCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 16,
  },
  loadingText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "700",
  },
  gridWrap: {
    gap: 12,
  },
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 18,
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  infoLabel: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
  infoValue: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
  },
  exampleCard: {
    backgroundColor: "#f0fdf4",
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    marginTop: 16,
  },
  exampleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  exampleLabel: {
    color: "#166534",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
  exampleText: {
    color: "#14532d",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 23,
  },
  exampleTranslation: {
    color: "#4b5563",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    fontStyle: "italic",
  },
});
