import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { listenService } from "../../services/api";

const LEVELS = ["all", "A1", "A2", "B1", "B2", "C1", "C2"];

const LEVEL_STYLES = {
  A1: { bg: "#ecfdf5", text: "#059669", border: "#a7f3d0" },
  A2: { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" },
  B1: { bg: "#f5f3ff", text: "#7c3aed", border: "#ddd6fe" },
  B2: { bg: "#fffbeb", text: "#d97706", border: "#fde68a" },
  C1: { bg: "#fff1f2", text: "#e11d48", border: "#fecdd3" },
  C2: { bg: "#eef2ff", text: "#4338ca", border: "#c7d2fe" },
};

const FLAG_URLS = {
  de: "https://flagcdn.com/w80/de.png",
  en: "https://flagcdn.com/w80/gb.png",
  fr: "https://flagcdn.com/w80/fr.png",
  tr: "https://flagcdn.com/w80/tr.png",
  it: "https://flagcdn.com/w80/it.png",
};

function getBaseXP(level) {
  const map = { A1: 10, A2: 20, B1: 30, B2: 40, C1: 50, C2: 60 };
  return map[level] || 20;
}

export default function ListenScreen({ navigation }) {
  const [tests, setTests] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [completedIds, setCompletedIds] = useState(new Set());
  const [isPaid, setIsPaid] = useState(false);
  const [freeLimit, setFreeLimit] = useState(5);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [selectedLevel]);

  async function loadData(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params = { limit: 100 };
      if (selectedLevel !== "all") params.level = selectedLevel;

      const [testsRes, progressRes] = await Promise.all([
        listenService.getAll(params),
        listenService.getProgress(),
      ]);

      const testsData = testsRes.data?.tests || testsRes.data || [];
      const progressData = progressRes.data || {};
      const completed = new Set((progressData.completedTestIds || []).map(String));

      setTests(testsData);
      setCompletedIds(completed);
      setIsPaid(Boolean(progressData.isPaid));
      setFreeLimit(progressData.freeLimit || 5);
      setError("");
    } catch {
      setTests([]);
      setError("Nuk mund të ngarkoheshin testet tani.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function renderTest({ item, index }) {
    const isCompleted = completedIds.has(String(item._id)) || item.isCompleted;
    const completedCount = completedIds.size;
    const isLocked = !isCompleted && !isPaid && completedCount >= freeLimit;
    const levelStyle = LEVEL_STYLES[item.level] || LEVEL_STYLES.A1;
    const xp = item.xpReward || getBaseXP(item.level);

    return (
      <TouchableOpacity
        activeOpacity={0.88}
        style={[
          styles.card,
          isCompleted && styles.cardCompleted,
          isLocked && styles.cardLocked,
        ]}
        onPress={() => {
          if (isLocked) {
            navigation.navigate("Premium");
          } else {
            navigation.navigate("ListenDetail", { test: item });
          }
        }}
      >
        {/* Decorative volume icon */}
        <View style={styles.cardDecorIcon}>
          <Ionicons name="volume-high" size={56} color={
            isCompleted ? "#fde68a" : isLocked ? "#e2e8f0" : "#f0fdf4"
          } />
        </View>

        {/* Lock icon */}
        {isLocked && (
          <View style={styles.lockIcon}>
            <Ionicons name="lock-closed" size={14} color="#94a3b8" />
          </View>
        )}

        {/* Level badge */}
        <View style={[styles.levelBadge, { backgroundColor: levelStyle.bg, borderColor: levelStyle.border }]}>
          <Text style={[styles.levelBadgeText, { color: levelStyle.text }]}>{item.level}</Text>
        </View>

        {/* Title */}
        <Text
          numberOfLines={2}
          style={[
            styles.cardTitle,
            isCompleted && styles.cardTitleCompleted,
            isLocked && styles.cardTitleLocked,
          ]}
        >
          {item.title}
        </Text>

        {/* Preview text */}
        <Text
          numberOfLines={2}
          style={[
            styles.cardPreview,
            isCompleted && styles.cardPreviewCompleted,
            isLocked && styles.cardPreviewLocked,
          ]}
        >
          {item.text ? item.text.substring(0, 80) + "..." : "Ushtrim Audio"}
        </Text>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <Text style={[styles.cardMeta, isCompleted && { color: "#f59e0b" }, isLocked && { color: "#cbd5e1" }]}>
            Gjermanisht • Audio
          </Text>
          <View style={styles.cardFooterRight}>
            {!isLocked && (
              <View style={styles.xpChip}>
                <Ionicons name="star" size={10} color="#059669" />
                <Text style={styles.xpChipText}>{isCompleted ? "2" : xp}</Text>
              </View>
            )}
            <View style={[
              styles.stateChip,
              isCompleted && styles.stateChipDone,
              isLocked && styles.stateChipLocked,
              !isCompleted && !isLocked && styles.stateChipStart,
            ]}>
              <Text style={[
                styles.stateChipText,
                isCompleted && styles.stateChipTextDone,
                isLocked && styles.stateChipTextLocked,
                !isCompleted && !isLocked && styles.stateChipTextStart,
              ]}>
                {isCompleted ? "✓ Kryer" : isLocked ? "Premium" : "Dëgjo"}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  const ListHeader = (
    <>
      {/* Hero banner */}
      <LinearGradient
        colors={["#065f46", "#059669", "#10b981", "#6ee7b7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroCircle1} />
        <View style={styles.heroCircle2} />

        <View style={styles.heroContent}>
          <View style={{ flex: 1 }}>
            <View style={styles.heroEyebrowRow}>
              <Ionicons name="headset" size={13} color="rgba(255,255,255,0.85)" />
              <Text style={styles.heroEyebrow}>Praktikë Gjuhësore</Text>
            </View>
            <Text style={styles.heroTitle}>Praktika e Dëgjimit</Text>
            <Text style={styles.heroSub}>
              Dëgjoni audio dhe shkruani atë që dëgjuat — nga A1 deri C2
            </Text>
          </View>

          <View style={styles.heroFlag}>
            <Image
              source={{ uri: FLAG_URLS.de }}
              style={styles.heroFlagImg}
            />
          </View>
        </View>
      </LinearGradient>

      {/* Level filter */}
      <View style={styles.filterCard}>
        <Text style={styles.filterLabel}>Filtro sipas Nivelit</Text>
        <FlatList
          horizontal
          data={LEVELS}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.levelList}
          renderItem={({ item }) => {
            const active = selectedLevel === item;
            const lStyle = LEVEL_STYLES[item];
            return (
              <TouchableOpacity
                onPress={() => setSelectedLevel(item)}
                style={[
                  styles.levelChip,
                  active && item === "all" && styles.levelChipActiveAll,
                  active && item !== "all" && lStyle && {
                    backgroundColor: lStyle.bg,
                    borderColor: lStyle.border,
                    borderWidth: 2,
                  },
                ]}
              >
                <Text style={[
                  styles.levelChipText,
                  active && item === "all" && styles.levelChipTextActiveAll,
                  active && item !== "all" && lStyle && { color: lStyle.text },
                ]}>
                  {item === "all" ? "Të gjitha" : item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </>
  );

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {loading ? (
        <View style={styles.loadingWrap}>
          {ListHeader}
          <View style={styles.spinnerWrap}>
            <ActivityIndicator color="#059669" size="large" />
          </View>
        </View>
      ) : (
        <FlatList
          data={tests}
          keyExtractor={(item) => item._id}
          renderItem={renderTest}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadData(true)}
              tintColor="#059669"
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Ionicons name="volume-high-outline" size={36} color="#a7f3d0" />
              <Text style={styles.emptyTitle}>Nuk u gjetën teste</Text>
              <Text style={styles.emptyText}>
                Provoni të zgjidhni nivele të ndryshme ose kontrolloni më vonë
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },

  loadingWrap: { flex: 1 },
  spinnerWrap: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 200 },

  listContent: { paddingBottom: 32 },

  // ── Hero
  hero: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 14,
    borderRadius: 20,
    padding: 20,
    overflow: "hidden",
    position: "relative",
  },
  heroCircle1: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  heroCircle2: {
    position: "absolute",
    bottom: -50,
    right: 70,
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  heroEyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 6,
  },
  heroEyebrow: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 30,
    marginBottom: 6,
  },
  heroSub: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    lineHeight: 17,
    maxWidth: 240,
  },
  heroFlag: {
    backgroundColor: "rgba(0,0,0,0.15)",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  heroFlagImg: { width: 44, height: 30, borderRadius: 4 },

  // ── Filter
  filterCard: {
    marginHorizontal: 16,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 14,
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f0fdf4",
  },
  filterLabel: {
    color: "#374151",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 10,
  },
  levelList: { gap: 8, paddingRight: 4 },
  levelChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  levelChipActiveAll: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  levelChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
  },
  levelChipTextActiveAll: {
    color: "#ffffff",
  },

  errorText: {
    marginHorizontal: 16,
    color: "#991b1b",
    backgroundColor: "#fee2e2",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 13,
    fontWeight: "600",
  },

  // ── Card
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: "#f1f5f9",
    shadowColor: "#0f172a",
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    overflow: "hidden",
    position: "relative",
  },
  cardCompleted: {
    backgroundColor: "#fffbeb",
    borderColor: "#fcd34d",
  },
  cardLocked: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
  },
  cardDecorIcon: {
    position: "absolute",
    bottom: -10,
    right: -10,
  },
  lockIcon: {
    position: "absolute",
    top: 14,
    left: 14,
    zIndex: 2,
  },
  levelBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    zIndex: 2,
  },
  levelBadgeText: { fontSize: 10, fontWeight: "800" },

  cardTitle: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 6,
    marginBottom: 5,
    paddingRight: 48,
    lineHeight: 21,
  },
  cardTitleCompleted: { color: "#92400e" },
  cardTitleLocked: { color: "#94a3b8" },

  cardPreview: {
    color: "#6b7280",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  cardPreviewCompleted: { color: "#b45309" },
  cardPreviewLocked: { color: "#cbd5e1" },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 10,
    marginTop: 4,
  },
  cardMeta: { color: "#9ca3af", fontSize: 11, fontWeight: "600" },
  cardFooterRight: { flexDirection: "row", alignItems: "center", gap: 8 },

  xpChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#ecfdf5",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  xpChipText: { color: "#065f46", fontSize: 11, fontWeight: "800" },

  stateChip: { borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5 },
  stateChipStart: { backgroundColor: "#059669" },
  stateChipDone: { backgroundColor: "#f59e0b" },
  stateChipLocked: { backgroundColor: "#e2e8f0" },
  stateChipText: { fontSize: 11, fontWeight: "800" },
  stateChipTextStart: { color: "#ffffff" },
  stateChipTextDone: { color: "#ffffff" },
  stateChipTextLocked: { color: "#94a3b8" },

  // ── Empty
  emptyCard: {
    marginHorizontal: 16,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    alignItems: "center",
    paddingVertical: 36,
    paddingHorizontal: 24,
    marginTop: 8,
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f0fdf4",
  },
  emptyTitle: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 12,
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },
});
