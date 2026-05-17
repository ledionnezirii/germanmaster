import { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, RefreshControl, ScrollView, Modal,
  Animated, Pressable, Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { wordAudioService } from "../../services/api";
import { useLanguage } from "../../context/LanguageContext";
import { F } from "../../styles/fonts";

const { width } = Dimensions.get("window");
const CARD_W = (width - 14 * 2 - 10) / 2;

const LEVELS = ["A1", "A2", "B1", "B2"];

const LEVEL_COLORS = {
  A1: { bg: "#ecfdf5", border: "#6ee7b7", darkBorder: "#34d399", text: "#065f46" },
  A2: { bg: "#eff6ff", border: "#93c5fd", darkBorder: "#60a5fa", text: "#1e40af" },
  B1: { bg: "#f5f3ff", border: "#c4b5fd", darkBorder: "#a78bfa", text: "#4c1d95" },
  B2: { bg: "#fffbeb", border: "#fcd34d", darkBorder: "#fbbf24", text: "#92400e" },
};

const LANG_CONFIG = {
  de: { name: "Gjermanisht", flag: "🇩🇪" },
  en: { name: "Anglisht",    flag: "🇬🇧" },
  fr: { name: "Frëngjisht",  flag: "🇫🇷" },
  tr: { name: "Turqisht",    flag: "🇹🇷" },
  it: { name: "Italisht",    flag: "🇮🇹" },
};

// ── Premium Modal ─────────────────────────────────────────────────────────────
function PremiumModal({ visible, onClose }) {
  const scaleAnim   = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim,   { toValue: 1, tension: 80, friction: 10, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Pressable style={s.modalOverlay} onPress={onClose}>
        <Animated.View style={[s.modalCard, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
          <Pressable>
            <TouchableOpacity style={s.modalClose} onPress={onClose}>
              <Ionicons name="close" size={18} color="#94a3b8" />
            </TouchableOpacity>

            <LinearGradient colors={["#db2777", "#ec4899"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.modalIconWrap}>
              <Ionicons name="star" size={32} color="#fff" />
            </LinearGradient>

            <Text style={s.modalTitle}>Nevojitet Premium</Text>
            <Text style={s.modalDesc}>
              Versioni falas lejon vetëm{" "}
              <Text style={{ fontFamily: F.bold, color: "#db2777" }}>3 sete</Text> audio.{"\n"}
              Kaló në Premium për akses të{" "}
              <Text style={{ fontFamily: F.bold, color: "#db2777" }}>pakufizuar</Text>.
            </Text>

            <View style={s.featureList}>
              {[
                { icon: "infinite",    text: "Sete të pakufizuara" },
                { icon: "shuffle",     text: "Quiz i Përzier" },
                { icon: "trending-up", text: "Statistika të avancuara" },
              ].map((f) => (
                <View key={f.icon} style={s.featureRow}>
                  <View style={s.featureIcon}>
                    <Ionicons name={f.icon} size={14} color="#db2777" />
                  </View>
                  <Text style={s.featureText}>{f.text}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity onPress={onClose} activeOpacity={0.88} style={{ marginTop: 20 }}>
              <LinearGradient colors={["#db2777", "#ec4899"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.modalCTA}>
                <Ionicons name="star" size={15} color="#fff" />
                <Text style={s.modalCTAText}>Shiko Planet Premium</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} style={s.modalSkip}>
              <Text style={s.modalSkipText}>Tani jo</Text>
            </TouchableOpacity>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
function CardItem({ item, finishedIds, isPaid, freeLimit, langConfig, onPress, index }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 320, delay: index * 45, useNativeDriver: true }).start();
  }, []);

  const done   = finishedIds.includes(item._id);
  const locked = !done && !isPaid && finishedIds.length >= freeLimit;
  const lc     = LEVEL_COLORS[item.level] || LEVEL_COLORS.A1;

  return (
    <Animated.View style={{
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
      width: CARD_W,
    }}>
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={() => onPress(item)}
        style={[
          s.card,
          done   && s.cardDone,
          locked && s.cardLocked,
        ]}
      >
        {/* Level badge — top right */}
        <View style={[s.levelBadge, { backgroundColor: lc.bg, borderColor: lc.border }]}>
          <Text style={[s.levelBadgeText, { color: lc.text }]}>{item.level}</Text>
        </View>

        {/* Lock — top left */}
        {locked && (
          <View style={s.lockBadge}>
            <Ionicons name="lock-closed" size={11} color="#94a3b8" />
          </View>
        )}

        {/* Title */}
        <Text
          numberOfLines={2}
          style={[s.cardTitle, done && { color: "#92400e" }, locked && { color: "#94a3b8" }]}
        >
          {item.title}
        </Text>

        {/* Word count */}
        <Text style={[s.cardCount, locked && { color: "#cbd5e1" }]}>
          {item.words?.length || 0} fjalë për të mësuar
        </Text>

        {/* Divider */}
        <View style={[s.cardDivider, done && { borderColor: "#fde68a" }, locked && { borderColor: "#e2e8f0" }]} />

        {/* Footer */}
        <View style={s.cardFooter}>
          <Text style={[s.cardLang, locked && { color: "#cbd5e1" }]}>
            {langConfig.flag}  Shqip
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            {!locked && (
              <View style={s.xpBadge}>
                <Ionicons name="star" size={8} color="#10b981" />
                <Text style={s.xpText}>{item.xp || 0}</Text>
              </View>
            )}
            <View style={[s.startPill, done && s.startPillDone, locked && s.startPillLocked]}>
              <Text style={[s.startPillText, done && { color: "#fff" }, locked && { color: "#94a3b8" }]}>
                {done ? "Kryer" : locked ? "Premium" : "Fillo"}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function WordAudioScreen({ navigation }) {
  const { language } = useLanguage();
  const [sets, setSets]               = useState([]);
  const [finishedIds, setFinishedIds] = useState([]);
  const [isPaid, setIsPaid]           = useState(false);
  const [freeLimit, setFreeLimit]     = useState(3);
  const [selectedLevel, setSelectedLevel] = useState("A1");
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [showPremium, setShowPremium] = useState(false);

  const langConfig = LANG_CONFIG[language] || LANG_CONFIG.de;
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 480, useNativeDriver: true }).start();
  }, []);

  useEffect(() => { loadData(); }, [language, selectedLevel]);

  useEffect(() => {
    const unsub = navigation.addListener("focus", () => loadData(false, true));
    return unsub;
  }, [navigation, language, selectedLevel]);

  async function loadData(isRefresh = false, silent = false) {
    if (!silent) {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
    }
    try {
      const [setsRes, finishedRes] = await Promise.all([
        wordAudioService.getAllSets({ level: selectedLevel }, language),
        wordAudioService.getFinishedSets(language),
      ]);
      setSets(Array.isArray(setsRes.data) ? setsRes.data : []);
      const fd  = finishedRes.data || {};
      const ids = fd.finishedIds || [];
      setFinishedIds(ids.map((item) => item.setId || item._id || item.toString()));
      setIsPaid(fd.isPaid || false);
      setFreeLimit(fd.freeLimit || 3);
    } catch {
      setSets([]);
    } finally {
      if (!silent) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }

  const canMixedQuiz = finishedIds.length >= 2 && isPaid;

  function handleMixedQuiz() {
    if (!isPaid || finishedIds.length < 2) { setShowPremium(true); return; }
    const finishedSets = sets.filter((s) => finishedIds.includes(s._id));
    const mixedWords   = finishedSets
      .flatMap((s) => s.words.map((w, i) => ({ ...w, setId: s._id, wordIndex: i, level: s.level })))
      .sort(() => Math.random() - 0.5)
      .slice(0, 10);
    navigation.navigate("WordAudioQuiz", { isMixed: true, mixedWords });
  }

  function handleCardPress(set) {
    const done   = finishedIds.includes(set._id);
    const locked = !done && !isPaid && finishedIds.length >= freeLimit;
    if (locked) { setShowPremium(true); return; }
    navigation.navigate("WordAudioQuiz", { set });
  }

  const headerSlide = headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] });

  return (
    <View style={s.root}>
      <FlatList
        data={sets}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={s.columnWrap}
        renderItem={({ item, index }) => (
          <CardItem
            item={item}
            index={index}
            finishedIds={finishedIds}
            isPaid={isPaid}
            freeLimit={freeLimit}
            langConfig={langConfig}
            onPress={handleCardPress}
          />
        )}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor="#ec4899" />}
        contentContainerStyle={s.listContent}
        ListHeaderComponent={
          <Animated.View style={{ opacity: headerAnim, transform: [{ translateY: headerSlide }] }}>
            {/* ── Hero ─────────────────────────────────────────────────── */}
            <LinearGradient
              colors={["#9d174d", "#db2777", "#ec4899", "#f9a8d4"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={s.hero}
            >
              {/* Background bubbles */}
              <View style={s.heroBubble1} />
              <View style={s.heroBubble2} />

              <SafeAreaView edges={["top"]}>
                <View style={s.heroInner}>
                  {/* Left: titles */}
                  <View style={{ flex: 1 }}>
                    <View style={s.eyebrowRow}>
                      <Ionicons name="volume-medium" size={12} color="rgba(255,255,255,0.8)" />
                      <Text style={s.eyebrow}>PRAKTIKË GJUHËSORE</Text>
                    </View>
                    <Text style={s.heroTitle}>Bashko Fjalët</Text>
                    <Text style={s.heroSub}>
                      Lidh fjalët {langConfig.flag} me shqipen
                    </Text>
                  </View>

                  {/* Right: Mixed quiz button */}
                  <TouchableOpacity
                    onPress={handleMixedQuiz}
                    activeOpacity={0.82}
                    style={[s.mixedBtn, (!isPaid || !canMixedQuiz) && { opacity: 0.72 }]}
                  >
                    <View style={s.mixedBtnIcon}>
                      <Ionicons
                        name={!isPaid ? "star" : canMixedQuiz ? "shuffle" : "lock-closed"}
                        size={16}
                        color={!isPaid ? "rgba(255,215,0,0.95)" : "#fff"}
                      />
                    </View>
                    <View>
                      <Text style={s.mixedBtnTitle}>Quiz Mikst</Text>
                      <Text style={s.mixedBtnSub}>
                        {!isPaid ? "Premium" : canMixedQuiz ? "Fillo tani" : `${finishedIds.length}/2 sete`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </LinearGradient>

            {/* ── Level filter bar ─────────────────────────────────────── */}
            <View style={s.levelBar}>
              {LEVELS.map((lvl) => {
                const active = selectedLevel === lvl;
                const lc     = LEVEL_COLORS[lvl];
                return (
                  <TouchableOpacity
                    key={lvl}
                    onPress={() => setSelectedLevel(lvl)}
                    style={[
                      s.levelBtn,
                      active && { backgroundColor: lc.bg, borderColor: lc.border, borderBottomColor: lc.darkBorder },
                    ]}
                    activeOpacity={0.75}
                  >
                    <Text style={[s.levelBtnText, active && { color: lc.text, fontFamily: F.xbold }]}>
                      {lvl}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {loading && (
              <View style={{ paddingVertical: 32, alignItems: "center" }}>
                <ActivityIndicator color="#ec4899" size="small" />
              </View>
            )}
          </Animated.View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={s.empty}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🎵</Text>
              <Text style={s.emptyTitle}>Nuk ka sete</Text>
              <Text style={s.emptySub}>Provoni nivel tjetër ose rifreskoni.</Text>
            </View>
          ) : null
        }
      />

      <PremiumModal visible={showPremium} onClose={() => setShowPremium(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: "#faf8f5" },
  listContent: { paddingHorizontal: 14, paddingBottom: 40 },
  columnWrap:  { gap: 10, marginBottom: 10 },

  // ── Hero
  hero: {
    paddingHorizontal: 20, paddingBottom: 28,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    overflow: "hidden",
    marginBottom: 14,
  },
  heroBubble1: { position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,255,255,0.08)" },
  heroBubble2: { position: "absolute", bottom: -50, left: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(255,255,255,0.06)" },

  heroInner:  { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12 },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 8 },
  eyebrow:    { color: "rgba(255,255,255,0.8)", fontSize: 10, fontFamily: F.bold, letterSpacing: 1.2, textTransform: "uppercase" },
  heroTitle:  { color: "#fff", fontSize: 26, fontFamily: F.black, letterSpacing: -0.5, marginBottom: 5 },
  heroSub:    { color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: F.regular },

  mixedBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "rgba(0,0,0,0.18)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 16, padding: 12,
    flexShrink: 0,
  },
  mixedBtnIcon:  { width: 34, height: 34, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  mixedBtnTitle: { color: "#fff", fontSize: 12, fontFamily: F.bold, marginBottom: 1 },
  mixedBtnSub:   { color: "rgba(255,255,255,0.65)", fontSize: 10, fontFamily: F.semi },

  // ── Level bar
  levelBar: {
    flexDirection: "row", gap: 8,
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 14,
    borderWidth: 1, borderColor: "#f0ede8",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  levelBtn: {
    flex: 1, alignItems: "center", paddingVertical: 9,
    borderRadius: 10, borderWidth: 1.5, borderBottomWidth: 3,
    borderColor: "#e2e8f0", borderBottomColor: "#c8d0da",
    backgroundColor: "#f8fafc",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  levelBtnText: { fontSize: 12, fontFamily: F.bold, color: "#64748b" },

  // ── Cards
  card: {
    width: CARD_W,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5, borderColor: "#f0ede8", borderBottomWidth: 4, borderBottomColor: "#ddd8d2",
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4,
    overflow: "visible",
  },
  cardDone:   { backgroundColor: "#fffbeb", borderColor: "#fcd34d", borderBottomColor: "#f59e0b" },
  cardLocked: { backgroundColor: "#f8fafc", borderColor: "#e2e8f0", borderBottomColor: "#cbd5e1" },

  levelBadge: {
    position: "absolute", top: 10, right: 10,
    borderRadius: 7, borderWidth: 1,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  levelBadgeText: { fontSize: 9, fontFamily: F.bold },

  lockBadge: {
    position: "absolute", top: 11, left: 11,
    width: 22, height: 22, borderRadius: 6,
    backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#e2e8f0",
    alignItems: "center", justifyContent: "center",
  },

  cardTitle:   { fontSize: 13, fontFamily: F.bold, color: "#1e293b", marginTop: 28, marginBottom: 5, lineHeight: 18 },
  cardCount:   { fontSize: 11, fontFamily: F.regular, color: "#94a3b8", marginBottom: 12 },
  cardDivider: { borderTopWidth: 1, borderColor: "#f0ede8", marginBottom: 10 },
  cardFooter:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardLang:    { fontSize: 10, fontFamily: F.semi, color: "#94a3b8" },

  xpBadge: {
    flexDirection: "row", alignItems: "center", gap: 2,
    backgroundColor: "#f0fdf4", borderRadius: 6,
    paddingHorizontal: 5, paddingVertical: 2,
    borderWidth: 1, borderColor: "#a7f3d0",
  },
  xpText: { fontSize: 9, fontFamily: F.semi, color: "#10b981" },

  startPill: {
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: "#ec4899",
  },
  startPillDone:   { backgroundColor: "#f59e0b" },
  startPillLocked: { backgroundColor: "#e2e8f0" },
  startPillText:   { fontSize: 10, fontFamily: F.bold, color: "#fff" },

  // ── Empty
  empty:      { alignItems: "center", paddingVertical: 48, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 15, fontFamily: F.bold, color: "#1e293b", marginBottom: 4 },
  emptySub:   { fontSize: 12, fontFamily: F.regular, color: "#64748b", textAlign: "center" },

  // ── Premium Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  modalCard: {
    backgroundColor: "#fff", borderRadius: 28, padding: 28, width: "100%",
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 10,
  },
  modalClose:   { position: "absolute", top: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },
  modalIconWrap:{ width: 72, height: 72, borderRadius: 20, alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 16, marginTop: 8 },
  modalTitle:   { fontSize: 22, fontFamily: F.black, color: "#1e293b", textAlign: "center", marginBottom: 10 },
  modalDesc:    { fontSize: 13, fontFamily: F.regular, color: "#64748b", textAlign: "center", lineHeight: 20, marginBottom: 20 },
  featureList:  { gap: 10, marginBottom: 4 },
  featureRow:   { flexDirection: "row", alignItems: "center", gap: 10 },
  featureIcon:  { width: 30, height: 30, borderRadius: 8, backgroundColor: "#fdf2f8", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#fce7f3" },
  featureText:  { fontSize: 13, fontFamily: F.semi, color: "#374151" },
  modalCTA:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, paddingVertical: 15 },
  modalCTAText: { color: "#fff", fontSize: 15, fontFamily: F.bold },
  modalSkip:    { alignItems: "center", marginTop: 12 },
  modalSkipText:{ fontSize: 13, fontFamily: F.semi, color: "#94a3b8" },
});
