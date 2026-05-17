import { useCallback, useState } from "react";
import {
  ActivityIndicator, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { grammarAppService } from "../../services/api";
import { F } from "../../styles/fonts";

const TYPE_META = {
  articles:         { label: "Artikujt",          icon: "text-outline",                color: "#6366f1", grad: ["#4f46e5", "#7c3aed"] },
  nouns:            { label: "Emrat",              icon: "book-outline",                color: "#f59e0b", grad: ["#d97706", "#f97316"] },
  verbs:            { label: "Foljet",             icon: "flash-outline",               color: "#10b981", grad: ["#059669", "#14b8a6"] },
  adjectives:       { label: "Mbiemrat",           icon: "color-palette-outline",       color: "#ec4899", grad: ["#db2777", "#f472b6"] },
  adverbs:          { label: "Ndajfoljet",         icon: "arrow-forward-outline",       color: "#8b5cf6", grad: ["#7c3aed", "#a78bfa"] },
  prepositions:     { label: "Parafjalët",         icon: "link-outline",                color: "#14b8a6", grad: ["#0d9488", "#14b8a6"] },
  conjunctions:     { label: "Lidhëzat",           icon: "git-merge-outline",           color: "#f97316", grad: ["#ea580c", "#f97316"] },
  modal_verbs:      { label: "Foljet Modale",      icon: "settings-outline",            color: "#0ea5e9", grad: ["#0284c7", "#0ea5e9"] },
  simple_past:      { label: "E Shkuara",          icon: "time-outline",                color: "#ef4444", grad: ["#dc2626", "#ef4444"] },
  present_perfect:  { label: "Perfekti",           icon: "checkmark-done-outline",      color: "#22c55e", grad: ["#16a34a", "#22c55e"] },
  past_perfect:     { label: "Pluskvamperfekti",   icon: "return-down-back-outline",    color: "#64748b", grad: ["#475569", "#64748b"] },
  future:           { label: "E Ardhmja",          icon: "rocket-outline",              color: "#7c3aed", grad: ["#6d28d9", "#8b5cf6"] },
  imperative:       { label: "Urdhërorja",         icon: "megaphone-outline",           color: "#dc2626", grad: ["#b91c1c", "#ef4444"] },
  passive:          { label: "Pësori",             icon: "swap-horizontal-outline",     color: "#059669", grad: ["#047857", "#059669"] },
  cases:            { label: "Rasat",              icon: "layers-outline",              color: "#0891b2", grad: ["#0369a1", "#0891b2"] },
  word_order:       { label: "Rendi i Fjalëve",    icon: "reorder-three-outline",       color: "#d97706", grad: ["#b45309", "#d97706"] },
  relative_clauses: { label: "Fjali Relative",     icon: "git-branch-outline",          color: "#7c3aed", grad: ["#6d28d9", "#7c3aed"] },
  conditional:      { label: "Kushtorja",          icon: "help-circle-outline",         color: "#be185d", grad: ["#9d174d", "#be185d"] },
  comparative:      { label: "Krahasorja",         icon: "bar-chart-outline",           color: "#0369a1", grad: ["#075985", "#0369a1"] },
  numbers:          { label: "Numrat",             icon: "calculator-outline",          color: "#4338ca", grad: ["#3730a3", "#4f46e5"] },
  pronouns:         { label: "Përemrat",           icon: "person-outline",              color: "#b45309", grad: ["#92400e", "#b45309"] },
  other:            { label: "Të Tjera",           icon: "ellipsis-horizontal-outline", color: "#6b7280", grad: ["#4b5563", "#6b7280"] },
};

export default function GrammarDetailScreen({ route, navigation }) {
  const { type, level, language = "de" } = route.params;
  const meta   = TYPE_META[type] || TYPE_META.other;
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [boxes,   setBoxes]   = useState([]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [type, level, language])
  );

  async function load() {
    setLoading(true);
    try {
      const res   = await grammarAppService.getAll({ level, type, language, limit: 100 });
      const items = Array.isArray(res.data) ? res.data : [];

      const enriched = await Promise.all(
        items.map(async (item) => {
          const raw     = await AsyncStorage.getItem(`gq_done_${item._id}`);
          const doneIds = raw ? JSON.parse(raw) : [];
          return { ...item, doneCount: doneIds.length };
        })
      );

      setBoxes(enriched);
    } catch {
      setBoxes([]);
    } finally {
      setLoading(false);
    }
  }

  async function resetBox(itemId) {
    await AsyncStorage.removeItem(`gq_done_${itemId}`);
    load();
  }

  const totalQ    = boxes.reduce((a, b) => a + (b.exerciseCount || 0), 0);
  const totalDone = boxes.reduce((a, b) => a + Math.min(b.doneCount || 0, b.exerciseCount || 0), 0);

  // How tall the floating header is (safe area top + content)
  const HEADER_H = insets.top + 110;

  return (
    <View style={s.root}>

      {/* ── Full-bleed background gradient ── */}
      <LinearGradient colors={[meta.grad[0], meta.grad[1], "#faf8ff"]} style={s.bgGrad} />

      {/* ── Scrollable box list — goes behind the header ── */}
      {loading ? (
        <View style={[s.center, { paddingTop: HEADER_H }]}>
          <ActivityIndicator color={meta.color} size="large" />
        </View>
      ) : boxes.length === 0 ? (
        <View style={[s.center, { paddingTop: HEADER_H }]}>
          <Ionicons name="school-outline" size={52} color="#c4b5fd" />
          <Text style={s.emptyTitle}>Nuk ka sete</Text>
          <Text style={s.emptySub}>Nuk ka pyetje për këtë kategori</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[s.list, { paddingTop: HEADER_H + 8 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.sectionLabel}>{boxes.length} sete · {totalDone}/{totalQ} pyetje</Text>

          {boxes.map((box, i) => {
            const total    = box.exerciseCount || 0;
            const done     = Math.min(box.doneCount || 0, total);
            const pct      = total > 0 ? done / total : 0;
            const complete = total > 0 && done >= total;
            const started  = done > 0 && !complete;

            if (complete) {
              // ── FINISHED card ──────────────────────────────
              return (
                <View key={box._id} style={s.doneCard}>
                  <LinearGradient
                    colors={["#064e3b", "#065f46"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={s.doneCardInner}
                  >
                    {/* Checkmark stamp */}
                    <View style={s.doneStamp}>
                      <Ionicons name="checkmark-circle" size={38} color="#34d399" />
                    </View>

                    <View style={s.doneCardLeft}>
                      <Text style={s.doneSetNum}>SET {i + 1}</Text>
                      <Text style={s.doneTitle} numberOfLines={2}>{box.title}</Text>
                      <View style={s.doneStatRow}>
                        <View style={s.doneStat}>
                          <Ionicons name="help-circle-outline" size={12} color="#6ee7b7" />
                          <Text style={s.doneStatText}>{total} pyetje</Text>
                        </View>
                        <View style={s.doneStat}>
                          <Ionicons name="star" size={12} color="#fbbf24" />
                          <Text style={s.doneStatText}>Kompletuar</Text>
                        </View>
                      </View>
                    </View>

                    {/* Full progress bar */}
                    <View style={s.doneBar}>
                      <View style={s.doneBarFill} />
                    </View>

                    {/* Buttons */}
                    <View style={s.doneCardBtns}>
                      <TouchableOpacity style={s.doneResetBtn} onPress={() => resetBox(box._id)} activeOpacity={0.8}>
                        <Ionicons name="refresh" size={13} color="#6ee7b7" />
                        <Text style={s.doneResetText}>Rifillo</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={s.doneViewBtn}
                        activeOpacity={0.82}
                        onPress={() =>
                          navigation.navigate("GrammarQuiz", {
                            itemId: box._id, itemTitle: box.title, type, setNum: i + 1,
                          })
                        }
                      >
                        <Ionicons name="trophy" size={13} color="#064e3b" />
                        <Text style={s.doneViewText}>Rezultati</Text>
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </View>
              );
            }

            // ── NORMAL card ────────────────────────────────
            return (
              <View key={box._id} style={s.card}>
                <LinearGradient
                  colors={meta.grad}
                  style={s.cardAccent}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                />

                <View style={s.cardBody}>
                  <View style={s.cardTopRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.cardSetNum}>SET {i + 1}</Text>
                      <Text style={s.cardTitle} numberOfLines={2}>{box.title}</Text>
                    </View>
                    <View style={[s.countBadge, { backgroundColor: meta.color + "15" }]}>
                      <Ionicons name="help-circle-outline" size={12} color={meta.color} />
                      <Text style={[s.countBadgeText, { color: meta.color }]}>{total} pyetje</Text>
                    </View>
                  </View>

                  <View style={s.progressTrack}>
                    <View style={[s.progressFill, { width: `${pct * 100}%`, backgroundColor: meta.color }]} />
                  </View>
                  <Text style={s.progressLabel}>
                    {started ? `${done}/${total} të përfunduara` : `${total} pyetje në total`}
                  </Text>

                  <TouchableOpacity
                    activeOpacity={0.82}
                    onPress={() =>
                      navigation.navigate("GrammarQuiz", {
                        itemId: box._id, itemTitle: box.title, type, setNum: i + 1,
                      })
                    }
                  >
                    <LinearGradient
                      colors={meta.grad}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={s.startBtn}
                    >
                      <Text style={s.startBtnText}>
                        {started ? `Vazhdo  ${done}/${total}` : "Fillo"}
                      </Text>
                      <Ionicons name={started ? "play" : "arrow-forward"} size={14} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {/* ── Floating transparent header (on top of everything) ── */}
      <View style={[s.floatingHeader, { height: HEADER_H }]} pointerEvents="box-none">
        <LinearGradient
          colors={[meta.grad[0], meta.grad[1], meta.grad[1] + "00"]}
          style={StyleSheet.absoluteFill}
          locations={[0, 0.65, 1]}
        />
        <SafeAreaView edges={["top"]} style={s.headerInner}>
          <View style={s.heroRow}>
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={18} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.heroTitle}>{meta.label}</Text>
              <Text style={s.heroSub}>Niveli {level}</Text>
            </View>
            <View style={s.levelBadge}>
              <Text style={s.levelBadgeText}>{level}</Text>
            </View>
          </View>

          {totalQ > 0 && (
            <View style={s.overallRow}>
              <View style={s.overallTrack}>
                <View style={[s.overallFill, { width: `${(totalDone / totalQ) * 100}%` }]} />
              </View>
              <Text style={s.overallLabel}>{totalDone}/{totalQ}</Text>
            </View>
          )}
        </SafeAreaView>
      </View>

    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#faf8ff" },

  bgGrad: {
    position: "absolute", top: 0, left: 0, right: 0,
    height: 260,
  },

  // ── Floating header ──────────────────────────────────────────
  floatingHeader: {
    position: "absolute", top: 0, left: 0, right: 0,
  },
  headerInner:  { paddingHorizontal: 16, paddingBottom: 0 },
  heroRow:      { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 10 },
  heroTitle:    { color: "#fff", fontSize: 24, fontFamily: F.black },
  heroSub:      { color: "rgba(255,255,255,0.65)", fontSize: 12, fontFamily: F.semi, marginTop: 1 },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center", justifyContent: "center",
  },
  levelBadge: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 99, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  levelBadgeText: { color: "#fff", fontSize: 13, fontFamily: F.black },
  overallRow:     { flexDirection: "row", alignItems: "center", gap: 10 },
  overallTrack:   { flex: 1, height: 6, backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 99, overflow: "hidden" },
  overallFill:    { height: "100%", backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 99 },
  overallLabel:   { color: "rgba(255,255,255,0.75)", fontSize: 11, fontFamily: F.black, minWidth: 36, textAlign: "right" },

  // ── List ────────────────────────────────────────────────────
  list:         { paddingHorizontal: 16, gap: 12 },
  sectionLabel: {
    color: "#94a3b8", fontSize: 11, fontFamily: F.bold,
    letterSpacing: 0.6, textTransform: "uppercase",
    marginBottom: 2, paddingHorizontal: 2,
  },

  // ── Normal card ─────────────────────────────────────────────
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 18, overflow: "hidden",
    borderWidth: 1, borderColor: "#ede9f8",
    shadowColor: "#7c3aed", shadowOpacity: 0.07,
    shadowRadius: 10, shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  cardAccent: { width: 6 },
  cardBody:   { flex: 1, padding: 14, gap: 9 },

  cardTopRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  cardSetNum: { color: "#94a3b8", fontSize: 9, fontFamily: F.black, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 },
  cardTitle:  { color: "#1e293b", fontSize: 14, fontFamily: F.xbold, lineHeight: 20 },

  countBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 99, paddingHorizontal: 9, paddingVertical: 4, flexShrink: 0,
  },
  countBadgeText: { fontSize: 10, fontFamily: F.bold },

  progressTrack: { height: 6, backgroundColor: "#f1f5f9", borderRadius: 99, overflow: "hidden" },
  progressFill:  { height: "100%", borderRadius: 99 },
  progressLabel: { color: "#94a3b8", fontSize: 11, fontFamily: F.semi },

  startBtn: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 7,
    borderRadius: 12, paddingVertical: 11, marginTop: 2,
  },
  startBtnText: { color: "#fff", fontSize: 13, fontFamily: F.black },

  // ── Done card ───────────────────────────────────────────────
  doneCard: {
    borderRadius: 18, overflow: "hidden",
    shadowColor: "#064e3b", shadowOpacity: 0.25,
    shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  doneCardInner: { padding: 16, gap: 10 },
  doneStamp: {
    position: "absolute", top: 12, right: 14,
    opacity: 0.9,
  },
  doneCardLeft: { paddingRight: 48 },
  doneSetNum:   { color: "#6ee7b7", fontSize: 9, fontFamily: F.black, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 },
  doneTitle:    { color: "#fff", fontSize: 15, fontFamily: F.xbold, lineHeight: 20 },
  doneStatRow:  { flexDirection: "row", gap: 12, marginTop: 6 },
  doneStat:     { flexDirection: "row", alignItems: "center", gap: 5 },
  doneStatText: { color: "#6ee7b7", fontSize: 11, fontFamily: F.semi },

  doneBar:     { height: 5, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 99, overflow: "hidden" },
  doneBarFill: { height: "100%", width: "100%", backgroundColor: "#34d399", borderRadius: 99 },

  doneCardBtns: { flexDirection: "row", gap: 8 },
  doneResetBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 9,
    borderWidth: 1, borderColor: "rgba(110,231,183,0.3)",
  },
  doneResetText: { color: "#6ee7b7", fontSize: 12, fontFamily: F.bold },
  doneViewBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, backgroundColor: "#34d399", borderRadius: 10, paddingVertical: 9,
  },
  doneViewText: { color: "#064e3b", fontSize: 12, fontFamily: F.black },

  // ── States ──────────────────────────────────────────────────
  center:     { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyTitle: { color: "#1e293b", fontSize: 16, fontFamily: F.xbold },
  emptySub:   { color: "#94a3b8", fontSize: 13, fontFamily: F.regular, textAlign: "center", paddingHorizontal: 24 },
});
