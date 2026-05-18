import { useEffect, useRef, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Animated, Easing, Image,
  TouchableWithoutFeedback, ActivityIndicator, FlatList,
  AppState,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import {
  useSafeAreaInsets,
  SafeAreaInsetsContext,
} from "react-native-safe-area-context";

import HomeScreen             from "../screens/home/HomeScreen";
import DailyChallengeScreen  from "../screens/home/DailyChallengeScreen";
import PathScreen            from "../screens/path/PathScreen";
import PathQuizScreen        from "../screens/path/PathQuizScreen";
import SectionTestScreen     from "../screens/path/SectionTestScreen";
import DictionaryScreen      from "../screens/dictionary/DictionaryScreen";
import WordDetailScreen      from "../screens/dictionary/WordDetailScreen";
import ListenScreen          from "../screens/listen/ListenScreen";
import ListenDetailScreen    from "../screens/listen/ListenDetailScreen";
import QuizScreen            from "../screens/quiz/QuizScreen";
import QuizDetailScreen      from "../screens/quiz/QuizDetailScreen";
import LeaderboardScreen     from "../screens/leaderboard/LeaderboardScreen";
import ProfileScreen         from "../screens/profile/ProfileScreen";
import PrivacyPolicyScreen   from "../screens/profile/PrivacyPolicyScreen";
import PremiumScreen         from "../screens/premium/PremiumScreen";
import CreateWordScreen      from "../screens/createword/CreateWordScreen";
import WordAudioScreen       from "../screens/wordaudio/WordAudioScreen";
import WordAudioQuizScreen   from "../screens/wordaudio/WordAudioQuizScreen";
import PhraseScreen          from "../screens/phrases/PhraseScreen";
import SentenceScreen        from "../screens/sentences/SentenceScreen";
import TranslateScreen       from "../screens/translate/TranslateScreen";
import TranslateDetailScreen from "../screens/translate/TranslateDetailScreen";
import PronunciationScreen   from "../screens/pronunciation/PronunciationScreen";
// import CategoryScreen        from "../screens/categories/CategoryScreen";
import GrammarScreen         from "../screens/grammar/GrammarScreen";
import GrammarDetailScreen   from "../screens/grammar/GrammarDetailScreen";
import GrammarQuizScreen     from "../screens/grammar/GrammarQuizScreen";
import AiTutorScreen         from "../screens/aiTutor/AiTutorScreen";
// import TestScreen             from "../screens/tests/TestScreen";
// import WordsScreen            from "../screens/words/WordsScreen";
// import ChallengeScreen        from "../screens/challenge/ChallengeScreen";
// import ChallengeGameScreen    from "../screens/challenge/ChallengeGameScreen";

import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { usePushNotifications } from "../hooks/usePushNotifications";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { useLanguage, LANGUAGES } from "../context/LanguageContext";
import { generateDicebearUrl, notificationService } from "../services/api";

const NOTIF_ICON_MAP = { "bell":"notifications-outline","trophy":"trophy-outline","book":"book-outline","book-open":"book-outline","clock":"time-outline","check-circle":"checkmark-circle-outline","alert-triangle":"warning-outline","x-circle":"close-circle-outline","message-circle":"chatbubble-outline","star":"star-outline" };
const NOTIF_COLOR    = { success:"#10b981",warning:"#f59e0b",error:"#ef4444",info:"#0ea5e9",default:"#8b5cf6" };
const NOTIF_BG       = { success:"#f0fdf4",warning:"#fffbeb",error:"#fff1f2",info:"#f0f9ff",default:"#faf5ff" };

function notifTimeAgo(d) {
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1) return "Tani";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h/24)}d`;
}

function NotifRow({ item, onRead, onDelete }) {
  const icon  = NOTIF_ICON_MAP[item.icon] || "notifications-outline";
  const color = NOTIF_COLOR[item.color]   || NOTIF_COLOR.default;
  const bg    = NOTIF_BG[item.color]      || NOTIF_BG.default;
  return (
    <TouchableOpacity style={[nb.row, !item.isRead && nb.rowUnread]} onPress={!item.isRead ? onRead : undefined} activeOpacity={0.8}>
      <View style={[nb.iconBox, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={{ flex:1, gap:3 }}>
        <Text style={[nb.title, !item.isRead && nb.titleUnread]} numberOfLines={1}>{item.title}</Text>
        <Text style={nb.message} numberOfLines={2}>{item.message}</Text>
        <Text style={nb.time}>{notifTimeAgo(item.createdAt)}</Text>
      </View>
      <View style={{ alignItems:"center", gap:8 }}>
        {!item.isRead && <View style={nb.dot} />}
        <TouchableOpacity onPress={onDelete} hitSlop={{ top:8, bottom:8, left:8, right:8 }}>
          <Ionicons name="trash-outline" size={15} color="#cbd5e1" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
import { navigationRef } from "./navigationRef";

const Tab = createBottomTabNavigator();
const DS  = createStackNavigator();
const QS  = createStackNavigator();
const LS  = createStackNavigator();
const WAS = createStackNavigator();
const TS  = createStackNavigator();
const HS  = createStackNavigator();
const PRS = createStackNavigator();
const PS  = createStackNavigator();
const GS  = createStackNavigator();
const ATS = createStackNavigator();
// const CS  = createStackNavigator();

const HomeNav = () => (
  <HS.Navigator screenOptions={{ headerShown: false }}>
    <HS.Screen name="HomeMain"       component={HomeScreen} />
    <HS.Screen name="DailyChallenge" component={DailyChallengeScreen} />
  </HS.Navigator>
);
// const ChallengeNav = () => (
//   <CS.Navigator screenOptions={{ headerShown: false }}>
//     <CS.Screen name="ChallengeMain" component={ChallengeScreen} />
//     <CS.Screen name="ChallengeGame" component={ChallengeGameScreen} />
//   </CS.Navigator>
// );
const DictNav = () => (
  <DS.Navigator screenOptions={{ headerShown: false }}>
    <DS.Screen name="DictionaryList" component={DictionaryScreen} />
    <DS.Screen name="WordDetail"     component={WordDetailScreen} />
  </DS.Navigator>
);
const QuizNav = () => (
  <QS.Navigator screenOptions={{ headerShown: false }}>
    <QS.Screen name="QuizList"   component={QuizScreen} />
    <QS.Screen name="QuizDetail" component={QuizDetailScreen} />
  </QS.Navigator>
);
const ListenNav = () => (
  <LS.Navigator screenOptions={{ headerShown: false }}>
    <LS.Screen name="ListenList"   component={ListenScreen} />
    <LS.Screen name="ListenDetail" component={ListenDetailScreen} />
  </LS.Navigator>
);
const WordAudioNav = () => (
  <WAS.Navigator screenOptions={{ headerShown: false }}>
    <WAS.Screen name="WordAudioList" component={WordAudioScreen} />
    <WAS.Screen name="WordAudioQuiz" component={WordAudioQuizScreen} />
  </WAS.Navigator>
);
const TranslateNav = () => (
  <TS.Navigator screenOptions={{ headerShown: false }}>
    <TS.Screen name="TranslateList"   component={TranslateScreen} />
    <TS.Screen name="TranslateDetail" component={TranslateDetailScreen} />
  </TS.Navigator>
);
const ProfileNav = () => (
  <PRS.Navigator screenOptions={{ headerShown: false }}>
    <PRS.Screen name="ProfileMain"   component={ProfileScreen} />
    <PRS.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
  </PRS.Navigator>
);
const PathNav = () => (
  <PS.Navigator screenOptions={{ headerShown: false }}>
    <PS.Screen name="PathMain"       component={PathScreen} />
    <PS.Screen name="PathQuiz"       component={PathQuizScreen} />
    <PS.Screen name="SectionTest"    component={SectionTestScreen} />
  </PS.Navigator>
);
const GrammarNav = () => (
  <GS.Navigator screenOptions={{ headerShown: false }}>
    <GS.Screen name="GrammarMain"   component={GrammarScreen} />
    <GS.Screen name="GrammarDetail" component={GrammarDetailScreen} />
    <GS.Screen name="GrammarQuiz"   component={GrammarQuizScreen} />
  </GS.Navigator>
);
const AiTutorNav = () => (
  <ATS.Navigator screenOptions={{ headerShown: false }}>
    <ATS.Screen name="AiTutorMain" component={AiTutorScreen} />
  </ATS.Navigator>
);

// ── Top navigation bar ─────────────────────────────────────────────────────────
function TopBar({ topInset }) {
  const { isOpen, toggle }           = useSidebar();
  const { user }                     = useAuth();
  const { language, switchLanguage } = useLanguage();

  const [langVisible,    setLangVisible]    = useState(false);
  const [unreadCount,    setUnreadCount]    = useState(0);
  const [notifsOpen,     setNotifsOpen]     = useState(false);
  const [notifs,         setNotifs]         = useState([]);
  const [notifsLoading,  setNotifsLoading]  = useState(false);
  const slideAnim      = useRef(new Animated.Value(500)).current;
  const fadeAnim       = useRef(new Animated.Value(0)).current;
  const notifSlideAnim = useRef(new Animated.Value(600)).current;
  const notifFadeAnim  = useRef(new Animated.Value(0)).current;

  const fetchUnreadCount = () => {
    if (!user) return;
    notificationService.getUnreadCount()
      .then(r => setUnreadCount(r?.data?.count ?? 0))
      .catch(() => {});
  };

  useEffect(() => {
    fetchUnreadCount();

    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    // Refresh immediately when app comes back to foreground
    const sub = AppState.addEventListener("change", state => {
      if (state === "active") fetchUnreadCount();
    });

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [user]);

  function openNotifs() {
    setNotifsOpen(true);
    setNotifsLoading(true);
    Animated.parallel([
      Animated.timing(notifSlideAnim, { toValue: 0,   duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(notifFadeAnim,  { toValue: 1,   duration: 240, easing: Easing.out(Easing.ease),  useNativeDriver: true }),
    ]).start();
    notificationService.getAll({ limit: 50 })
      .then(r => { const d = r?.data?.notifications ?? r?.data ?? []; setNotifs(Array.isArray(d) ? d : []); })
      .catch(() => setNotifs([]))
      .finally(() => setNotifsLoading(false));
    notificationService.getUnreadCount()
      .then(uc => setUnreadCount(uc?.data?.count ?? 0))
      .catch(() => {});
  }

  function closeNotifs() {
    Animated.parallel([
      Animated.timing(notifSlideAnim, { toValue: 600, duration: 280, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(notifFadeAnim,  { toValue: 0,   duration: 220, easing: Easing.in(Easing.ease),  useNativeDriver: true }),
    ]).start(() => setNotifsOpen(false));
  }

  async function markRead(id) {
    try {
      await notificationService.markAsRead(id);
      setNotifs(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  }

  async function markAllRead() {
    try {
      await notificationService.markAllAsRead();
      setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  }

  async function deleteNotif(id) {
    try {
      await notificationService.delete(id);
      setNotifs(prev => prev.filter(n => n._id !== id));
    } catch {}
  }

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
  const avatarUrl   = user?.id && user?.avatarStyle
    ? generateDicebearUrl(user.id, user.avatarStyle)
    : null;
  const initials = user?.emri
    ? user.emri.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  function openLang() {
    setLangVisible(true);
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0,   duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1,   duration: 240, easing: Easing.out(Easing.ease),  useNativeDriver: true }),
    ]).start();
  }

  function closeLang(callback) {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 500, duration: 280, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 0,   duration: 220, easing: Easing.in(Easing.ease),  useNativeDriver: true }),
    ]).start(() => { setLangVisible(false); callback?.(); });
  }

  return (
    <>
      <View style={[s.topBar, { paddingTop: topInset }]}>
        {/* ── Left: hamburger + logo ── */}
        <View style={s.topLeft}>
          <TouchableOpacity style={s.menuBtn} onPress={toggle} activeOpacity={0.75}>
            <Ionicons name={isOpen ? "close-outline" : "menu-outline"} size={22} color="#0f172a" />
          </TouchableOpacity>
          <Image
            source={require("../assets/logoTr.png")}
            style={s.logoImage}
            resizeMode="contain"
          />
          <Text style={s.logoName}>Ilirika</Text>
        </View>

        {/* ── Right: notifications + language + avatar ── */}
        <View style={s.topRight}>
          <TouchableOpacity
            style={s.notifBtn}
            onPress={openNotifs}
            activeOpacity={0.75}
          >
            <Ionicons name="notifications-outline" size={20} color="#0f172a" />
            {unreadCount > 0 && (
              <View style={s.notifBadge}>
                <Text style={s.notifBadgeTxt}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={s.langBtn} onPress={openLang} activeOpacity={0.8}>
            <Text style={s.langFlag}>{currentLang.flag}</Text>
            <Text style={s.langCode}>{currentLang.code.toUpperCase()}</Text>
            <Ionicons name="chevron-down" size={10} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity
            style={s.avatarBtn}
            onPress={() => navigationRef.isReady() && navigationRef.navigate("Profile")}
            activeOpacity={0.8}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={s.avatarImg} />
            ) : (
              <View style={s.avatarFallback}>
                <Text style={s.avatarInitials}>{initials}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Notifications bottom-sheet ── */}
      <Modal visible={notifsOpen} transparent animationType="none" onRequestClose={closeNotifs}>
        <TouchableWithoutFeedback onPress={closeNotifs}>
          <Animated.View style={[nb.overlay, { opacity: notifFadeAnim }]} />
        </TouchableWithoutFeedback>
        <Animated.View style={[nb.sheet, { transform: [{ translateY: notifSlideAnim }] }]}>
          <View style={nb.handle} />
          <View style={nb.header}>
            <View style={{ flex:1 }}>
              <Text style={nb.headerTitle}>Njoftimet</Text>
              <Text style={nb.headerSub}>{unreadCount > 0 ? `${unreadCount} të palexuara` : "Të gjitha të lexuara"}</Text>
            </View>
            {unreadCount > 0 && (
              <TouchableOpacity style={nb.markAllBtn} onPress={markAllRead} activeOpacity={0.8}>
                <Text style={nb.markAllTxt}>Lexo të gjitha</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={nb.backBtn} onPress={closeNotifs} activeOpacity={0.75}>
              <Ionicons name="close" size={18} color="#0f172a" />
            </TouchableOpacity>
          </View>

          {notifsLoading ? (
            <View style={nb.center}>
              <ActivityIndicator color="#10b981" size="large" />
            </View>
          ) : notifs.length === 0 ? (
            <View style={nb.center}>
              <View style={nb.emptyIcon}>
                <Ionicons name="notifications-off-outline" size={32} color="#94a3b8" />
              </View>
              <Text style={nb.emptyTitle}>Nuk ka njoftime</Text>
              <Text style={nb.emptySub}>Njoftimet tuaja do të shfaqen këtu</Text>
            </View>
          ) : (
            <FlatList
              data={notifs}
              keyExtractor={item => item._id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding:16, gap:8, paddingBottom:32 }}
              renderItem={({ item }) => (
                <NotifRow item={item} onRead={() => markRead(item._id)} onDelete={() => deleteNotif(item._id)} />
              )}
            />
          )}
        </Animated.View>
      </Modal>

      {/* ── Language bottom-sheet ── */}
      <Modal
        visible={langVisible}
        transparent
        animationType="none"
        onRequestClose={() => closeLang()}
      >
        <TouchableWithoutFeedback onPress={() => closeLang()}>
          <Animated.View style={[s.modalOverlay, { opacity: fadeAnim }]}>
            <TouchableWithoutFeedback>
              <Animated.View style={[s.langSheet, { transform: [{ translateY: slideAnim }] }]}>
                <View style={s.sheetHandle} />
                <Text style={s.sheetTitle}>Zgjidhni Gjuhën</Text>
                <Text style={s.sheetSub}>Gjuha që dëshironi të mësoni</Text>

                {LANGUAGES.map((lang) => {
                  const active = lang.code === language;
                  return (
                    <TouchableOpacity
                      key={lang.code}
                      style={[s.langOption, active && s.langOptionActive]}
                      onPress={() => closeLang(() => switchLanguage(lang.code))}
                      activeOpacity={0.8}
                    >
                      <View style={[s.langFlagWrap, active && s.langFlagWrapActive]}>
                        <Text style={s.langFlagLarge}>{lang.flag}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.langName, active && s.langNameActive]}>{lang.name}</Text>
                        <Text style={s.langLabel}>{lang.label}</Text>
                      </View>
                      {active
                        ? <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                        : <Ionicons name="chevron-forward"  size={15} color="#cbd5e1" />
                      }
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity style={s.cancelBtn} onPress={() => closeLang()} activeOpacity={0.8}>
                  <Text style={s.cancelText}>Anulo</Text>
                </TouchableOpacity>
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

// ── Language switch overlay ────────────────────────────────────────────────────
function LangSwitchOverlay() {
  const { switching, newLangObj } = useLanguage();
  const scaleAnim = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    if (switching) {
      navigationRef.isReady() && navigationRef.navigate("Home");
      Animated.spring(scaleAnim, { toValue: 1, friction: 7, useNativeDriver: true }).start();
    } else {
      scaleAnim.setValue(0.88);
    }
  }, [switching]);

  return (
    <Modal visible={switching} transparent animationType="fade">
      <View style={s.langOverlay}>
        <Animated.View style={[s.langOverlayCard, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={s.langOverlayFlag}>{newLangObj?.flag || "🌐"}</Text>
          <Text style={s.langOverlayTitle}>Po ndryshohet gjuha</Text>
          <Text style={s.langOverlaySub}>{newLangObj?.name || ""}</Text>
          <ActivityIndicator color="#10b981" size="small" style={{ marginTop: 16 }} />
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Main layout ────────────────────────────────────────────────────────────────
function MainLayout() {
  const insets = useSafeAreaInsets();
  usePushNotifications();

  return (
    <View style={s.root}>
      <TopBar topInset={insets.top} />

      <View style={{ flex: 1 }}>
        <SafeAreaInsetsContext.Provider
          value={{ top: 0, bottom: insets.bottom, left: insets.left, right: insets.right }}
        >
          <Tab.Navigator
            screenOptions={{
              headerShown: false,
              tabBarStyle: { display: "none" },
            }}
          >
            <Tab.Screen name="Home"          component={HomeNav} />
            <Tab.Screen name="Path"          component={PathNav} />
            <Tab.Screen name="Dictionary"    component={DictNav} />
            <Tab.Screen name="Listen"        component={ListenNav} />
            <Tab.Screen name="Quizzes"       component={QuizNav} />
            <Tab.Screen name="Grammar"       component={GrammarNav} />
            <Tab.Screen name="Phrases"       component={PhraseScreen} />
            <Tab.Screen name="Sentences"     component={SentenceScreen} />
            <Tab.Screen name="Translate"     component={TranslateNav} />
            <Tab.Screen name="CreateWord"    component={CreateWordScreen} />
            <Tab.Screen name="WordAudio"     component={WordAudioNav} />
            <Tab.Screen name="Pronunciation" component={PronunciationScreen} />
            {/* <Tab.Screen name="Categories"    component={CategoryScreen} /> */}
            <Tab.Screen name="Leaderboard"   component={LeaderboardScreen} />
            {/* <Tab.Screen name="Challenge"     component={ChallengeNav} /> */}
            {/* <Tab.Screen name="Tests"         component={TestScreen} /> */}
            {/* <Tab.Screen name="Words"         component={WordsScreen} /> */}
            <Tab.Screen name="AiTutor"       component={AiTutorNav} />
            <Tab.Screen name="Profile"       component={ProfileNav} />
            <Tab.Screen name="Premium"       component={PremiumScreen} />
          </Tab.Navigator>
        </SafeAreaInsetsContext.Provider>

        <Sidebar />
        <LangSwitchOverlay />
      </View>
    </View>
  );
}

// ── Root export ────────────────────────────────────────────────────────────────
export default function MainNavigator() {
  return (
    <SidebarProvider>
      <MainLayout />
    </SidebarProvider>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  // ── Top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: "#fffdf8",
    borderBottomWidth: 1,
    borderBottomColor: "#ede9e0",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f1ede4",
    borderWidth: 1,
    borderColor: "#e5e0d5",
    alignItems: "center",
    justifyContent: "center",
  },
  topLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
    flex: 1,
  },
  logoImage: {
    width: 52,
    height: 52,
  },
  logoName: {
    color: "#0f172a",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  notifBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#f1ede4",
    borderWidth: 1, borderColor: "#e5e0d5",
    alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  notifBadge: {
    position: "absolute", top: -4, right: -4,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: "#ef4444",
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: "#fffdf8",
  },
  notifBadgeTxt: { color: "#fff", fontSize: 8, fontWeight: "900" },
  topRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  langBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f1ede4",
    borderWidth: 1,
    borderColor: "#e5e0d5",
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  langFlag: {
    fontSize: 14,
  },
  langCode: {
    color: "#0f172a",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  avatarBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#6ee7b7",
  },
  avatarImg: {
    width: 34,
    height: 34,
  },
  avatarFallback: {
    width: 34,
    height: 34,
    backgroundColor: "#d1fae5",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    color: "#065f46",
    fontSize: 12,
    fontWeight: "900",
  },

  // ── Language modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  langSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingBottom: 36,
    paddingTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 16,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "#e2e8f0",
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetTitle: { fontSize: 19, fontWeight: "900", color: "#0f172a", marginBottom: 3 },
  sheetSub:   { fontSize: 13, color: "#94a3b8", fontWeight: "500", marginBottom: 18 },
  langOption: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingVertical: 13, paddingHorizontal: 14,
    borderRadius: 16, marginBottom: 10,
    backgroundColor: "#f8fafc",
    borderWidth: 1.5, borderColor: "#f1f5f9",
  },
  langOptionActive: { backgroundColor: "#ecfdf5", borderColor: "#6ee7b7" },
  langFlagWrap: {
    width: 46, height: 46, borderRadius: 13,
    backgroundColor: "#f1f5f9",
    alignItems: "center", justifyContent: "center",
  },
  langFlagWrapActive: { backgroundColor: "#d1fae5" },
  langFlagLarge: { fontSize: 24 },
  langName:       { fontSize: 14, fontWeight: "800", color: "#1e293b", marginBottom: 2 },
  langNameActive: { color: "#0f766e" },
  langLabel:      { fontSize: 12, color: "#94a3b8", fontWeight: "500" },
  cancelBtn: {
    marginTop: 4, paddingVertical: 14,
    borderRadius: 14, backgroundColor: "#f8fafc",
    alignItems: "center",
    borderWidth: 1, borderColor: "#e2e8f0",
  },
  cancelText: { fontSize: 14, fontWeight: "700", color: "#64748b" },

  // ── Language switch overlay
  langOverlay: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.72)",
    alignItems: "center",
    justifyContent: "center",
  },
  langOverlayCard: {
    backgroundColor: "#0f172a",
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 44,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.25)",
    shadowColor: "#10b981",
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 20,
  },
  langOverlayFlag:  { fontSize: 48, marginBottom: 16 },
  langOverlayTitle: { color: "#f1f5f9", fontSize: 17, fontWeight: "800", marginBottom: 4 },
  langOverlaySub:   { color: "#34d399", fontSize: 13, fontWeight: "600" },
});

const nb = StyleSheet.create({
  overlay:     { ...StyleSheet.absoluteFillObject, backgroundColor:"rgba(0,0,0,0.45)" },
  sheet:       { position:"absolute", bottom:0, left:0, right:0, height:"72%", backgroundColor:"#fffdf8", borderTopLeftRadius:28, borderTopRightRadius:28, overflow:"hidden", shadowColor:"#000", shadowOpacity:0.18, shadowRadius:24, elevation:16 },
  handle:      { width:40, height:4, borderRadius:2, backgroundColor:"#e2e8f0", alignSelf:"center", marginTop:12, marginBottom:4 },
  header:      { flexDirection:"row", alignItems:"center", gap:12, paddingHorizontal:16, paddingVertical:12, backgroundColor:"#fffdf8", borderBottomWidth:1, borderBottomColor:"#ede9e0" },
  backBtn:     { width:36, height:36, borderRadius:10, backgroundColor:"#f1ede4", borderWidth:1, borderColor:"#ede9e0", alignItems:"center", justifyContent:"center" },
  headerTitle: { color:"#0f172a", fontSize:17, fontWeight:"800", marginBottom:1 },
  headerSub:   { color:"#94a3b8", fontSize:12 },
  markAllBtn:  { backgroundColor:"#f0fdf4", borderRadius:10, borderWidth:1, borderColor:"#a7f3d0", paddingHorizontal:10, paddingVertical:6 },
  markAllTxt:  { color:"#059669", fontSize:12, fontWeight:"700" },
  center:      { flex:1, alignItems:"center", justifyContent:"center", gap:12 },
  emptyIcon:   { width:64, height:64, borderRadius:18, backgroundColor:"#f8fafc", borderWidth:1, borderColor:"#f1f5f9", alignItems:"center", justifyContent:"center" },
  emptyTitle:  { color:"#0f172a", fontSize:16, fontWeight:"800" },
  emptySub:    { color:"#94a3b8", fontSize:13, textAlign:"center" },
  row:         { flexDirection:"row", alignItems:"flex-start", gap:12, backgroundColor:"#fff", borderRadius:16, padding:14, borderWidth:1, borderColor:"#f1f5f9" },
  rowUnread:   { backgroundColor:"#f0f9ff", borderColor:"#bae6fd" },
  iconBox:     { width:42, height:42, borderRadius:13, alignItems:"center", justifyContent:"center" },
  title:       { color:"#64748b", fontSize:13, fontWeight:"600" },
  titleUnread: { color:"#0f172a", fontWeight:"800" },
  message:     { color:"#94a3b8", fontSize:12, lineHeight:17 },
  time:        { color:"#cbd5e1", fontSize:11, fontWeight:"600" },
  dot:         { width:8, height:8, borderRadius:4, backgroundColor:"#0ea5e9" },
});
