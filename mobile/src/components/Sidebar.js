import { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  StyleSheet,
  Dimensions,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSidebar } from "../context/SidebarContext";
import { navigationRef } from "../navigation/navigationRef";
import { useAuth } from "../context/AuthContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SIDEBAR_WIDTH = Math.min(280, SCREEN_WIDTH * 0.78);

const ROUTE_TO_TAB = {
  Home: "Home",
  PathMain: "Path",
  PathQuiz: "Path",
  DictionaryList: "Dictionary",
  WordDetail: "Dictionary",
  ListenList: "Listen",
  ListenDetail: "Listen",
  QuizList: "Quizzes",
  QuizDetail: "Quizzes",
  Phrases: "Phrases",
  Sentences: "Sentences",
  TranslateList: "Translate",
  TranslateDetail: "Translate",
  GrammarMain: "Grammar",
  GrammarDetail: "Grammar",
  CreateWord: "CreateWord",
  WordAudioList: "WordAudio",
  WordAudioQuiz: "WordAudio",
  Pronunciation: "Pronunciation",
  // Categories: "Categories",
  Leaderboard: "Leaderboard",
  // ChallengeMain: "Challenge",
  // ChallengeGame: "Challenge",
  Profile: "Profile",
  ProfileMain: "Profile",
  PrivacyPolicy: "Profile",
  // Tests: "Tests",
  // Words: "Words",
  Premium: "Premium",
};

const MENU_ITEMS = [
  { iconOff: "home-outline",    iconOn: "home",    label: "Kryefaqja",  tab: "Home" },
  { iconOff: "map-outline",     iconOn: "map",     label: "Mëso",       tab: "Path" },
  { iconOff: "book-outline",    iconOn: "book",    label: "Fjalori",    tab: "Dictionary" },
  { iconOff: "headset-outline", iconOn: "headset", label: "Dëgjo",      tab: "Listen" },
  { iconOff: "school-outline",  iconOn: "school",  label: "Kuizet",     tab: "Quizzes" },
  { iconOff: "library-outline",     iconOn: "library",     label: "Gramatika",  tab: "Grammar" },
  { iconOff: "chatbubbles-outline", iconOn: "chatbubbles", label: "Fraza",      tab: "Phrases" },
  { iconOff: "create-outline",      iconOn: "create",      label: "Fjali",      tab: "Sentences" },
  { iconOff: "language-outline",    iconOn: "language",    label: "Përkthimi",  tab: "Translate" },
  { iconOff: "pencil-outline",  iconOn: "pencil",  label: "Krijo Fjalë",   tab: "CreateWord" },
  { iconOff: "musical-notes-outline", iconOn: "musical-notes", label: "Bashko Fjalët", tab: "WordAudio" },
  { iconOff: "mic-outline",     iconOn: "mic",     label: "Shqiptimi",  tab: "Pronunciation" },
  // { iconOff: "folder-open-outline", iconOn: "folder-open", label: "Kategoritë", tab: "Categories" },
  { iconOff: "trophy-outline",  iconOn: "trophy",  label: "Renditja",     tab: "Leaderboard" },
  // { iconOff: "flash-outline",   iconOn: "flash",   label: "Sfida 1v1",    tab: "Challenge" },
  // { iconOff: "document-text-outline", iconOn: "document-text", label: "Teste", tab: "Tests" },
  // { iconOff: "library-outline", iconOn: "library", label: "Fjalët e Mia", tab: "Words" },
  { iconOff: "person-outline",  iconOn: "person",  label: "Llogaria",   tab: "Profile" },
];

export default function Sidebar() {
  const { isOpen, close } = useSidebar();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;

  const [activeTab, setActiveTab] = useState("Home");
  const [mounted, setMounted]     = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (navigationRef.isReady()) {
        const route = navigationRef.getCurrentRoute();
        if (route) setActiveTab(ROUTE_TO_TAB[route.name] || "Home");
      }
      setMounted(true);

      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 340,
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.back(1.05)),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -SIDEBAR_WIDTH,
          duration: 260,
          easing: Easing.bezier(0.55, 0, 0.45, 1),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 220,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.96,
          duration: 240,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => setMounted(false));
    }
  }, [isOpen]);

  function navigate(tab) {
    close();
    setTimeout(() => {
      if (navigationRef.isReady()) navigationRef.navigate(tab);
    }, 60);
  }

  if (!mounted) return null;

  return (
    <>
      {/* ── Backdrop ── */}
      <Animated.View
        pointerEvents={isOpen ? "auto" : "none"}
        style={[s.backdrop, { opacity: fadeAnim }]}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={close} activeOpacity={1} />
      </Animated.View>

      {/* ── Panel ── */}
      <Animated.View
        style={[
          s.panel,
          {
            transform: [{ translateX: slideAnim }, { scaleY: scaleAnim }],
          },
        ]}
      >
        {/* Creamy background */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "#fffdf8" }]} />

        {/* ── MENU ITEMS ── */}
        <ScrollView
          style={s.nav}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 8, paddingTop: 0 }}
        >
          <Text style={s.sectionLabel}>NAVIGIMI</Text>

          {MENU_ITEMS.map((item) => {
            const active = activeTab === item.tab;
            return (
              <TouchableOpacity
                key={item.tab}
                style={[s.menuItem, active && s.menuItemActive]}
                onPress={() => navigate(item.tab)}
                activeOpacity={0.7}
              >
                {/* Active left bar */}
                {active && (
                  <LinearGradient
                    colors={["#10b981", "#14b8a6"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={s.activeBar}
                  />
                )}

                {/* Icon */}
                <View style={[s.iconBox, active && s.iconBoxActive]}>
                  <Ionicons
                    name={active ? item.iconOn : item.iconOff}
                    size={18}
                    color={active ? "#10b981" : "#94a3b8"}
                  />
                </View>

                {/* Label */}
                <Text style={[s.menuLabel, active && s.menuLabelActive]}>
                  {item.label}
                </Text>

                {/* Active chevron */}
                {active && (
                  <Ionicons name="chevron-forward" size={12} color="#10b981" style={{ opacity: 0.7 }} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── FOOTER ── */}
        <View style={[s.footer, { paddingBottom: Math.max(insets.bottom + 12, 22) }]}>
          <View style={s.footerDivider} />

          {user?.isPaid ? (() => {
            const expiresAt = user?.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : null;
            const days = expiresAt ? Math.max(0, Math.ceil((expiresAt - Date.now()) / 86400000)) : 0;
            const SUB_DAYS = { free_trial:7, "1_day":1, "1_month":30, "3_months":90, "1_year":365 };
            const totalDays = SUB_DAYS[user?.subscriptionType] || 30;
            const pct = totalDays > 0 ? Math.max(0, Math.min(1, days / totalDays)) : 0;
            const daysLabel = days === 0 ? "Ka skaduar" : days === 1 ? "1 ditë mbetur" : `${days} ditë mbetur`;
            const dateLabel = expiresAt
              ? expiresAt.toLocaleDateString("sq-AL", { day:"numeric", month:"short", year:"numeric" })
              : "";

            return (
              /* ── Subscription expiry card ── */
              <View style={s.subCard}>
                <View style={s.subTop}>
                  <View style={s.subIconBox}>
                    <Ionicons name="diamond" size={SIDEBAR_WIDTH < 240 ? 12 : 14} color="#d97706" />
                  </View>
                  <View style={s.subInfo}>
                    <Text style={s.subTitle} numberOfLines={1}>Premium Aktiv</Text>
                    {dateLabel ? (
                      <Text style={s.subExpires} numberOfLines={1} ellipsizeMode="tail">
                        Skadon {dateLabel}
                      </Text>
                    ) : null}
                  </View>
                  <View style={s.activeDot} />
                </View>

                {/* Progress bar */}
                <View style={s.subTrack}>
                  <View style={[s.subFill, { width: `${pct * 100}%` }]} />
                </View>

                <View style={s.subBottom}>
                  <Ionicons name="time-outline" size={11} color="#d97706" />
                  <Text style={s.subDays} numberOfLines={1}>{daysLabel}</Text>
                </View>
              </View>
            );
          })() : (
            /* ── Go Premium button ── */
            <TouchableOpacity
              style={s.premiumBtn}
              onPress={() => navigate("Premium")}
              activeOpacity={0.82}
            >
              <View style={s.premiumIconBox}>
                <Ionicons name="sparkles" size={15} color="#d97706" />
              </View>
              <Text style={s.premiumLabel}>Kaloni në Premium</Text>
              <Ionicons name="arrow-forward" size={13} color="#d97706" style={{ opacity: 0.8 }} />
            </TouchableOpacity>
          )}

          <Text style={s.copyright}>
            © {new Date().getFullYear()} gjuhagjermane
            {"\n"}
            <Text style={s.copyrightSub}>Të gjitha të drejtat e rezervuara.</Text>
          </Text>
        </View>
      </Animated.View>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,6,23,0.6)",
    zIndex: 200,
  },

  panel: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    zIndex: 300,
    overflow: "hidden",
    borderRightWidth: 1,
    borderRightColor: "#ede9e0",
    shadowColor: "#000",
    shadowOffset: { width: 8, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 24,
  },

  closeBtn: {
    position: "absolute",
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },

  // User card
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingBottom: 18,
    gap: 14,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(52,211,153,0.12)",
    borderWidth: 2,
    borderColor: "rgba(52,211,153,0.35)",
  },
  avatarText: {
    color: "#34d399",
    fontSize: 22,
    fontWeight: "900",
  },
  userInfo: {
    flex: 1,
    gap: 6,
  },
  userName: {
    color: "#f1f5f9",
    fontSize: 15,
    fontWeight: "800",
  },
  userBadges: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  levelBadge: {
    backgroundColor: "rgba(16,185,129,0.18)",
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.28)",
  },
  levelBadgeText: {
    color: "#34d399",
    fontSize: 11,
    fontWeight: "900",
  },
  streakBadge: {
    backgroundColor: "rgba(249,115,22,0.12)",
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  streakText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fb923c",
  },
  xpText: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "700",
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginHorizontal: 14,
    marginBottom: 0,
  },

  // Nav
  nav: {
    flex: 1,
    paddingHorizontal: 10,
  },
  sectionLabel: {
    color: "#a3a099",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginLeft: 12,
    marginTop: 10,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 10,
    marginBottom: 2,
    position: "relative",
    overflow: "hidden",
  },
  menuItemActive: {
    backgroundColor: "rgba(16,185,129,0.1)",
  },
  activeBar: {
    position: "absolute",
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 3,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
    backgroundColor: "#f1ede4",
  },
  iconBoxActive: {
    backgroundColor: "rgba(16,185,129,0.14)",
  },
  menuLabel: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  menuLabelActive: {
    color: "#0f172a",
    fontWeight: "700",
  },

  // Footer
  footer: {
    paddingHorizontal: 14,
    paddingTop: 0,
  },
  footerDivider: {
    height: 1,
    backgroundColor: "#ede9e0",
    marginBottom: 14,
  },
  premiumBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 13,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#fcd34d",
    backgroundColor: "#fffbeb",
    gap: 10,
  },
  premiumIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#fef3c7",
    alignItems: "center",
    justifyContent: "center",
  },
  premiumLabel: {
    color: "#d97706",
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
  subCard: {
    backgroundColor: "#fffbeb",
    borderRadius: Math.round(SIDEBAR_WIDTH * 0.048),
    paddingVertical: Math.round(SIDEBAR_WIDTH * 0.04),
    paddingHorizontal: Math.round(SIDEBAR_WIDTH * 0.045),
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#fde68a",
    gap: Math.round(SIDEBAR_WIDTH * 0.022),
  },
  subTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: Math.round(SIDEBAR_WIDTH * 0.03),
  },
  subIconBox: {
    width: Math.round(SIDEBAR_WIDTH * 0.096),
    height: Math.round(SIDEBAR_WIDTH * 0.096),
    borderRadius: Math.round(SIDEBAR_WIDTH * 0.026),
    backgroundColor: "#fef3c7",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  subInfo: {
    flex: 1,
    minWidth: 0,
  },
  subTitle: {
    color: "#92400e",
    fontSize: Math.max(10, Math.round(SIDEBAR_WIDTH * 0.046)),
    fontWeight: "700",
  },
  subExpires: {
    color: "#b45309",
    fontSize: Math.max(9, Math.round(SIDEBAR_WIDTH * 0.037)),
    fontWeight: "500",
    marginTop: 1,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#10b981",
    flexShrink: 0,
  },
  subTrack: {
    height: 5,
    borderRadius: 999,
    backgroundColor: "#fde68a",
    overflow: "hidden",
  },
  subFill: {
    height: 5,
    borderRadius: 999,
    backgroundColor: "#f59e0b",
  },
  subBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  subDays: {
    color: "#d97706",
    fontSize: Math.max(9, Math.round(SIDEBAR_WIDTH * 0.04)),
    fontWeight: "700",
    flexShrink: 1,
  },

  copyright: {
    color: "#a3a099",
    fontSize: 10,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 16,
  },
  copyrightSub: {
    color: "#a3a099",
    fontSize: 10,
  },
});
