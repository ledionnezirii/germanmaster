import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { translateService } from "../../services/api";
import { useLanguage } from "../../context/LanguageContext";

const FLAG_URLS = {
  de: "https://flagcdn.com/w80/de.png",
  en: "https://flagcdn.com/w80/gb.png",
  fr: "https://flagcdn.com/w80/fr.png",
  tr: "https://flagcdn.com/w80/tr.png",
  it: "https://flagcdn.com/w80/it.png",
};

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const LEVEL_PALETTE = {
  A1: { tint: "#059669", soft: "#ecfdf5", border: "#6ee7b7", text: "#065f46" },
  A2: { tint: "#0284c7", soft: "#eff6ff", border: "#93c5fd", text: "#1e40af" },
  B1: { tint: "#7c3aed", soft: "#f5f3ff", border: "#c4b5fd", text: "#4c1d95" },
  B2: { tint: "#d97706", soft: "#fffbeb", border: "#fcd34d", text: "#92400e" },
  C1: { tint: "#e11d48", soft: "#fff1f2", border: "#fda4af", text: "#9f1239" },
  C2: { tint: "#4338ca", soft: "#eef2ff", border: "#a5b4fc", text: "#1e1b4b" },
};

export default function TranslateScreen({ navigation }) {
  const { language } = useLanguage();
  const [texts, setTexts] = useState([]);
  const [completedIds, setCompletedIds] = useState([]);
  const [isPaid, setIsPaid] = useState(false);
  const [freeLimit, setFreeLimit] = useState(5);
  const [selectedLevel, setSelectedLevel] = useState("A1");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    loadData();
  }, [language]);

  async function loadData(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [textsRes, progressRes] = await Promise.allSettled([
        translateService.getAll({ language, limit: 200, page: 1 }),
        translateService.getUserProgress(),
      ]);

      if (textsRes.status === "fulfilled") {
        const raw = textsRes.value.data;
        const list = Array.isArray(raw?.texts)
          ? raw.texts
          : Array.isArray(raw)
          ? raw
          : [];
        setTexts(list);
      } else {
        setTexts([]);
      }

      if (progressRes.status === "fulfilled") {
        const payload = progressRes.value.data || {};
        const progress = Array.isArray(payload.progress) ? payload.progress : [];
        setCompletedIds(
          progress
            .filter((p) => p.completed)
            .map((p) => (p.textId?._id || p.textId)?.toString())
            .filter(Boolean)
        );
        setIsPaid(Boolean(payload.isPaid));
        setFreeLimit(payload.freeLimit || 5);
      }
    } catch {
      setTexts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const filteredTexts = useMemo(
    () => texts.filter((t) => t.level === selectedLevel),
    [texts, selectedLevel]
  );

  const completedCount = completedIds.length;

  function isCompleted(id) {
    return completedIds.includes(id?.toString());
  }

  function isLocked(id) {
    return !isCompleted(id) && !isPaid && completedCount >= freeLimit;
  }

  function renderCard({ item }) {
    const completed = isCompleted(item._id);
    const locked = isLocked(item._id);
    const pal = LEVEL_PALETTE[item.level] || LEVEL_PALETTE.A1;
    const preview = item.text ? item.text.substring(0, 90) + "…" : "Tekst për lexim";

    return (
      <TouchableOpacity
        activeOpacity={0.88}
        style={[
          styles.card,
          completed && styles.cardCompleted,
          locked && styles.cardLocked,
        ]}
        onPress={() => locked ? setShowPaywall(true) : navigation.navigate("TranslateDetail", { textItem: item })}
      >
        {/* Watermark book icon */}
        <Ionicons
          name="book"
          size={80}
          color={completed ? "#fde68a" : locked ? "#e2e8f0" : "#f1f5f9"}
          style={styles.watermark}
        />

        {/* Lock icon top-left */}
        {locked && (
          <View style={styles.lockIcon}>
            <Ionicons name="lock-closed" size={14} color="#94a3b8" />
          </View>
        )}

        {/* Level badge top-right */}
        <View style={[styles.levelBadge, { backgroundColor: pal.soft, borderColor: pal.border }]}>
          <Text style={[styles.levelBadgeText, { color: pal.tint }]}>{item.level}</Text>
        </View>

        {/* Content */}
        <View style={styles.cardBody}>
          <Text
            numberOfLines={1}
            style={[
              styles.cardTitle,
              completed && styles.cardTitleCompleted,
              locked && styles.cardTitleLocked,
            ]}
          >
            {item.title || "Pa titull"}
          </Text>
          <Text
            numberOfLines={2}
            style={[
              styles.cardPreview,
              completed && styles.cardPreviewCompleted,
              locked && styles.cardPreviewLocked,
            ]}
          >
            {preview}
          </Text>
        </View>

        {/* Footer */}
        <View style={[styles.cardFooter, completed && styles.cardFooterCompleted]}>
          <Text style={[styles.questionsText, locked && styles.questionsTextLocked, completed && styles.questionsTextCompleted]}>
            {item.questionCount ?? item.questions?.length ?? 0} pyetje
          </Text>
          <View style={styles.footerRight}>
            {!completed && !locked && (
              <View style={styles.xpBadge}>
                <Ionicons name="star" size={11} color="#059669" />
                <Text style={styles.xpBadgeText}>{item.xpReward || 0}</Text>
              </View>
            )}
            <View
              style={[
                styles.statePill,
                completed
                  ? styles.statePillCompleted
                  : locked
                  ? styles.statePillLocked
                  : styles.statePillStart,
              ]}
            >
              <Text
                style={[
                  styles.stateText,
                  completed
                    ? styles.stateTextCompleted
                    : locked
                    ? styles.stateTextLocked
                    : styles.stateTextStart,
                ]}
              >
                {completed ? "Përfunduar" : locked ? "Premium" : "Fillo"}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.root}>
      {/* ── Paywall modal ── */}
      <Modal visible={showPaywall} transparent animationType="fade" onRequestClose={() => setShowPaywall(false)}>
        <TouchableWithoutFeedback onPress={() => setShowPaywall(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalBox}>
                <View style={styles.modalIconWrap}>
                  <Ionicons name="diamond" size={32} color="#f59e0b" />
                </View>
                <Text style={styles.modalTitle}>Limit i Arritur</Text>
                <Text style={styles.modalBody}>
                  Versioni falas lejon vetëm{" "}
                  <Text style={styles.modalHighlight}>{freeLimit}</Text> tekste të përfunduara.
                </Text>
                <Text style={styles.modalSub}>
                  Kaloni në planin Premium për të pasur akses të pakufizuar në të gjitha tekstet.
                </Text>
                <TouchableOpacity
                  style={styles.modalClose}
                  onPress={() => setShowPaywall(false)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalCloseText}>Mbyll</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <SafeAreaView style={styles.safeArea}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color="#7c3aed" size="large" />
          </View>
        ) : (
          <FlatList
            data={filteredTexts}
            keyExtractor={(item) => item._id}
            renderItem={renderCard}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadData(true)}
                tintColor="#7c3aed"
              />
            }
            ListHeaderComponent={
              <>
                {/* ── Purple gradient header */}
                <LinearGradient
                  colors={["#4c1d95", "#6d28d9", "#7c3aed", "#a78bfa"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroCard}
                >
                  {/* Glow blobs */}
                  <View style={styles.heroBlob1} />
                  <View style={styles.heroBlob2} />

                  <View style={styles.heroContent}>
                    <View style={styles.heroLeft}>
                      <View style={styles.heroSubRow}>
                        <Ionicons name="book-outline" size={13} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.heroSub}>PRAKTIKË GJUHËSORE</Text>
                      </View>
                      <Text style={styles.heroTitle}>Praktika e{"\n"}Përkthimit</Text>
                      <Text style={styles.heroDesc}>
                        Praktiko kuptimin e leximit me tekste gjermane dhe pyetje
                      </Text>
                    </View>
                    <View style={styles.heroFlagBox}>
                      <Image
                        source={{ uri: FLAG_URLS[language] || FLAG_URLS.de }}
                        style={styles.heroFlagImg}
                      />
                    </View>
                  </View>
                </LinearGradient>

                {/* ── Filter card */}
                <View style={styles.filterCard}>
                  <View style={styles.filterHeader}>
                    <Ionicons name="filter" size={15} color="#14b8a6" />
                    <Text style={styles.filterTitle}>Filtro sipas Nivelit</Text>
                  </View>
                  <View style={styles.levelRow}>
                    {LEVELS.map((lvl) => {
                      const selected = lvl === selectedLevel;
                      const pal = LEVEL_PALETTE[lvl];
                      return (
                        <TouchableOpacity
                          key={lvl}
                          onPress={() => setSelectedLevel(lvl)}
                          style={[
                            styles.levelChip,
                            selected && {
                              backgroundColor: pal.soft,
                              borderColor: pal.border,
                              borderWidth: 2,
                            },
                          ]}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.levelChipText,
                              { color: selected ? pal.tint : "#6b7280" },
                              selected && { fontWeight: "800" },
                            ]}
                          >
                            {lvl}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </>
            }
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <View style={styles.emptyBox}>
                  <Ionicons name="book" size={36} color="#14b8a6" />
                  <Text style={styles.emptyTitle}>Nuk u gjetën tekste</Text>
                  <Text style={styles.emptyText}>
                    Provoni të zgjidhni nivele të ndryshme ose kontrolloni më vonë
                  </Text>
                </View>
              </View>
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },
  safeArea: { flex: 1 },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { paddingBottom: 28 },

  // ── Hero
  heroCard: {
    marginHorizontal: 14,
    marginTop: 14,
    marginBottom: 12,
    borderRadius: 20,
    padding: 24,
    overflow: "hidden",
    position: "relative",
  },
  heroBlob1: {
    position: "absolute", top: -40, right: -40,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  heroBlob2: {
    position: "absolute", bottom: -50, right: 60,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  heroContent: {
    position: "relative",
    zIndex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  heroLeft: { flex: 1 },
  heroSubRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 8 },
  heroSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 34,
    marginBottom: 8,
  },
  heroDesc: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    lineHeight: 18,
    maxWidth: 220,
  },
  heroFlagBox: {
    backgroundColor: "rgba(0,0,0,0.15)",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignSelf: "center",
  },
  heroFlagImg: { width: 44, height: 30, borderRadius: 4 },

  // ── Filter
  filterCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginHorizontal: 14,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#d1fae5",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  filterHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  filterTitle: { fontSize: 14, fontWeight: "700", color: "#1f2937" },
  levelRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  levelChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  levelChipText: { fontSize: 12, fontWeight: "600" },

  // ── Card
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    marginHorizontal: 14,
    marginBottom: 10,
    padding: 16,
    borderWidth: 2,
    borderColor: "#f1f5f9",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardCompleted: {
    backgroundColor: "#fffbeb",
    borderColor: "#fcd34d",
  },
  cardLocked: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
  },
  watermark: {
    position: "absolute",
    bottom: -10,
    right: -10,
    opacity: 1,
  },
  lockIcon: {
    position: "absolute",
    top: 14,
    left: 14,
    zIndex: 2,
  },
  levelBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    zIndex: 2,
  },
  levelBadgeText: { fontSize: 11, fontWeight: "800" },

  cardBody: { marginTop: 4, marginBottom: 10, paddingRight: 50 },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1f2937",
    marginBottom: 6,
  },
  cardTitleCompleted: { color: "#92400e" },
  cardTitleLocked: { color: "#9ca3af" },
  cardPreview: {
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 18,
  },
  cardPreviewCompleted: { color: "#b45309" },
  cardPreviewLocked: { color: "#d1d5db" },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  cardFooterCompleted: { borderTopColor: "#fde68a" },
  questionsText: { fontSize: 12, fontWeight: "600", color: "#9ca3af" },
  questionsTextCompleted: { color: "#d97706" },
  questionsTextLocked: { color: "#d1d5db" },
  footerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  xpBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  xpBadgeText: { fontSize: 11, fontWeight: "800", color: "#059669" },
  statePill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  statePillStart: {
    backgroundColor: "#059669",
  },
  statePillCompleted: {
    backgroundColor: "#f97316",
  },
  statePillLocked: {
    backgroundColor: "#6b7280",
  },
  stateText: { fontSize: 11, fontWeight: "700" },
  stateTextStart: { color: "#ffffff" },
  stateTextCompleted: { color: "#ffffff" },
  stateTextLocked: { color: "#ffffff" },

  // ── Paywall modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  modalBox: {
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 28,
    width: "100%",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#d1fae5",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
  },
  modalIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "#fffbeb",
    borderWidth: 2,
    borderColor: "#fde68a",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  modalBody: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 6,
  },
  modalHighlight: {
    fontWeight: "900",
    color: "#059669",
  },
  modalSub: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 24,
  },
  modalClose: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6b7280",
  },

  // ── Empty
  emptyWrap: { paddingHorizontal: 14, paddingTop: 8 },
  emptyBox: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: "#a7f3d0",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyTitle: {
    color: "#1f2937",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 12,
    marginBottom: 6,
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
});
