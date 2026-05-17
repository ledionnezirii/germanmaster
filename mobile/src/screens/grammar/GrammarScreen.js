import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Animated, Dimensions, FlatList,
  RefreshControl, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { grammarAppService } from "../../services/api";
import { useLanguage } from "../../context/LanguageContext";
import { F } from "../../styles/fonts";

const { width } = Dimensions.get("window");
const LEVELS = ["A1", "A2", "B1", "B2"];

const TYPE_META = {
  articles:         { label: "Artikujt",        icon: "text-outline",              color: "#6366f1", bg: "#eef2ff" },
  nouns:            { label: "Emrat",            icon: "book-outline",              color: "#f59e0b", bg: "#fffbeb" },
  verbs:            { label: "Foljet",           icon: "flash-outline",             color: "#10b981", bg: "#f0fdf4" },
  adjectives:       { label: "Mbiemrat",         icon: "color-palette-outline",     color: "#ec4899", bg: "#fdf2f8" },
  adverbs:          { label: "Ndajfoljet",       icon: "arrow-forward-outline",     color: "#8b5cf6", bg: "#f5f3ff" },
  prepositions:     { label: "Parafjalët",       icon: "link-outline",              color: "#14b8a6", bg: "#f0fdfa" },
  conjunctions:     { label: "Lidhëzat",         icon: "git-merge-outline",         color: "#f97316", bg: "#fff7ed" },
  modal_verbs:      { label: "Foljet Modale",    icon: "settings-outline",          color: "#0ea5e9", bg: "#f0f9ff" },
  simple_past:      { label: "E Shkuara",        icon: "time-outline",              color: "#ef4444", bg: "#fff1f2" },
  present_perfect:  { label: "Perfekti",         icon: "checkmark-done-outline",    color: "#22c55e", bg: "#f0fdf4" },
  past_perfect:     { label: "Pluskvamperf.",    icon: "return-down-back-outline",  color: "#64748b", bg: "#f8fafc" },
  future:           { label: "E Ardhmja",        icon: "rocket-outline",            color: "#7c3aed", bg: "#f5f3ff" },
  imperative:       { label: "Urdhërorja",       icon: "megaphone-outline",         color: "#dc2626", bg: "#fff1f2" },
  passive:          { label: "Pësori",           icon: "swap-horizontal-outline",   color: "#059669", bg: "#ecfdf5" },
  cases:            { label: "Rasat",            icon: "layers-outline",            color: "#0891b2", bg: "#f0f9ff" },
  word_order:       { label: "Rendi i Fjalëve",  icon: "reorder-three-outline",     color: "#d97706", bg: "#fffbeb" },
  relative_clauses: { label: "Fjali Relative",   icon: "git-branch-outline",        color: "#7c3aed", bg: "#f5f3ff" },
  conditional:      { label: "Kushtorja",        icon: "help-circle-outline",       color: "#be185d", bg: "#fdf2f8" },
  comparative:      { label: "Krahasorja",       icon: "bar-chart-outline",         color: "#0369a1", bg: "#f0f9ff" },
  numbers:          { label: "Numrat",           icon: "calculator-outline",        color: "#4338ca", bg: "#eef2ff" },
  pronouns:         { label: "Përemrat",         icon: "person-outline",            color: "#b45309", bg: "#fffbeb" },
  other:            { label: "Të Tjera",         icon: "ellipsis-horizontal-outline", color: "#6b7280", bg: "#f8fafc" },
};

function TypeCard({ type, count, onPress, index }) {
  const meta    = TYPE_META[type] || TYPE_META.other;
  const opacity = useRef(new Animated.Value(0)).current;
  const slideY  = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const delay = Math.min(index, 16) * 45;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 340, delay, useNativeDriver: true }),
      Animated.spring(slideY,  { toValue: 0, delay, tension: 70, friction: 11, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY: slideY }], flex: 1 }}>
      <TouchableOpacity style={[s.typeCard, { borderColor: meta.color + "44" }]} onPress={onPress} activeOpacity={0.78}>
        <View style={[s.typeIconWrap, { backgroundColor: meta.bg, borderColor: meta.color + "33" }]}>
          <Ionicons name={meta.icon} size={22} color={meta.color} />
        </View>
        <Text style={[s.typeLabel, { color: meta.color }]} numberOfLines={2}>{meta.label}</Text>
        <View style={[s.typeBadge, { backgroundColor: meta.bg, borderColor: meta.color + "33" }]}>
          <Text style={[s.typeBadgeText, { color: meta.color }]}>{count}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function GrammarScreen({ navigation }) {
  const { language }    = useLanguage();
  const [level, setLevel]     = useState("A1");
  const [types, setTypes]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 480, useNativeDriver: true }).start();
  }, []);

  useEffect(() => { loadTypes(); }, [level, language]);

  async function loadTypes(isRefresh = false) {
    if (!isRefresh) setLoading(true);
    try {
      const res = await grammarAppService.getTypes(level, language);
      setTypes(Array.isArray(res.data) ? res.data : []);
    } catch {
      setTypes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Pair up types into rows of 2
  const pairs = [];
  for (let i = 0; i < types.length; i += 2) {
    pairs.push(types.slice(i, i + 2));
  }

  const headerSlide = headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-22, 0] });

  return (
    <View style={s.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadTypes(true); }} tintColor="#7c3aed" />
        }
      >
        {/* ── HEADER ── */}
        <Animated.View style={{ opacity: headerAnim, transform: [{ translateY: headerSlide }] }}>
          <LinearGradient colors={["#312e81", "#4c1d95", "#7c3aed"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
            <SafeAreaView edges={["top"]}>
              <View style={s.heroRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.heroLabel}>MËSO GJERMANISHT</Text>
                  <Text style={s.heroTitle}>Gramatika</Text>
                  <Text style={s.heroSub}>Zgjedh nivelin dhe kategorinë</Text>
                </View>
                <View style={s.heroIconWrap}>
                  <Ionicons name="library-outline" size={32} color="rgba(255,255,255,0.9)" />
                </View>
              </View>

              {/* Level tabs */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 4 }}>
                {LEVELS.map((lv) =>
                  level === lv ? (
                    <LinearGradient key={lv} colors={["#a78bfa", "#7c3aed"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.levelTabActive}>
                      <Text style={s.levelTabTextActive}>{lv}</Text>
                    </LinearGradient>
                  ) : (
                    <TouchableOpacity key={lv} style={s.levelTab} onPress={() => setLevel(lv)} activeOpacity={0.75}>
                      <Text style={s.levelTabText}>{lv}</Text>
                    </TouchableOpacity>
                  )
                )}
              </ScrollView>
            </SafeAreaView>
          </LinearGradient>
        </Animated.View>

        {/* ── SECTION TITLE ── */}
        <View style={s.sectionRow}>
          <View style={s.sectionDot} />
          <Text style={s.sectionTitle}>Kategoritë — Niveli {level}</Text>
        </View>

        {/* ── TYPE GRID ── */}
        {loading ? (
          <View style={s.center}>
            <ActivityIndicator color="#7c3aed" size="large" />
          </View>
        ) : types.length === 0 ? (
          <View style={s.emptyWrap}>
            <Ionicons name="library-outline" size={48} color="#c4b5fd" />
            <Text style={s.emptyTitle}>Nuk ka tema</Text>
            <Text style={s.emptySub}>Nuk ka tema gramatikore për nivelin {level}</Text>
          </View>
        ) : (
          <View style={s.grid}>
            {pairs.map((pair, ri) => (
              <View key={ri} style={s.gridRow}>
                {pair.map((t, ci) => (
                  <TypeCard
                    key={t.type}
                    type={t.type}
                    count={t.count}
                    index={ri * 2 + ci}
                    onPress={() => navigation.navigate("GrammarDetail", { type: t.type, level, language })}
                  />
                ))}
                {pair.length === 1 && <View style={{ flex: 1 }} />}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#faf8ff" },

  // Header
  hero:        { paddingHorizontal: 20, paddingBottom: 22 },
  heroRow:     { flexDirection: "row", alignItems: "flex-start", marginBottom: 16 },
  heroLabel:   { color: "rgba(255,255,255,0.65)", fontSize: 10, fontFamily: F.bold, letterSpacing: 1.2, marginBottom: 4 },
  heroTitle:   { color: "#fff", fontSize: 28, fontFamily: F.black, letterSpacing: -0.5, marginBottom: 4 },
  heroSub:     { color: "rgba(255,255,255,0.6)", fontSize: 12, fontFamily: F.regular },
  heroIconWrap:{ width: 56, height: 56, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },

  // Level tabs
  levelTab:           { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.14)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  levelTabActive:     { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  levelTabText:       { color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: F.bold },
  levelTabTextActive: { color: "#fff", fontSize: 13, fontFamily: F.xbold },

  // Section
  sectionRow:  { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 20, marginBottom: 14 },
  sectionDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: "#7c3aed" },
  sectionTitle:{ color: "#1e293b", fontSize: 14, fontFamily: F.xbold },

  // Grid
  grid:        { paddingHorizontal: 12, paddingBottom: 32, gap: 10 },
  gridRow:     { flexDirection: "row", gap: 10 },

  // Type card
  typeCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1.5,
    borderBottomWidth: 4,
    borderBottomColor: "#e2e8f0",
    padding: 16,
    alignItems: "center",
    gap: 10,
    shadowColor: "#7c3aed",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  typeIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  typeLabel: {
    fontSize: 12,
    fontFamily: F.xbold,
    textAlign: "center",
    lineHeight: 16,
  },
  typeBadge: {
    borderRadius: 99,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  typeBadgeText: { fontSize: 11, fontFamily: F.bold },

  // States
  center:     { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyWrap:  { alignItems: "center", paddingVertical: 60, paddingHorizontal: 32, gap: 12 },
  emptyTitle: { color: "#1e293b", fontSize: 16, fontFamily: F.xbold },
  emptySub:   { color: "#94a3b8", fontSize: 13, fontFamily: F.regular, textAlign: "center", lineHeight: 20 },
});
