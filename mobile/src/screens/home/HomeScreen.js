import { useEffect, useState, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, StyleSheet, Dimensions, Animated, Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { userService, leaderboardService, dailyChallengeService, dictionaryService, generateDicebearUrl } from "../../services/api";
import pathService from "../path/pathService";
import { F } from "../../styles/fonts";
import { computeXpLevel } from "../../utils/xpLevel";

const { width } = Dimensions.get("window");
const STAT_W   = (width - 32 - 24) / 4;  // 4 equal cards with 8px gaps and 16px side margins

const LEVEL_ORDER  = ["A1", "A2", "B1", "B2", "C1", "C2"];

const LEVEL_XP_MIN = { A1: 0,    A2: 500,  B1: 1500, B2: 3500, C1: 7000,  C2: 12000 };
const LEVEL_XP_MAX = { A1: 500,  A2: 1500, B1: 3500, B2: 7000, C1: 12000, C2: 20000 };
const LEVEL_COLORS = { A1: "#10b981", A2: "#0ea5e9", B1: "#8b5cf6", B2: "#ec4899", C1: "#f97316", C2: "#ef4444" };
const LEVEL_DESC   = { A1: "Fillestar", A2: "Elementar", B1: "Ndërmjetës", B2: "Avancuar", C1: "Avancuar", C2: "Zotërim" };

const QUICK = [
  { icon: "headset",     label: "Dëgjim",  sub: "Praktikë audio",  tab: "Listen",     colors: ["#38bdf8", "#0ea5e9"] },
  { icon: "book",        label: "Fjalor",  sub: "Mëso fjalë",      tab: "Dictionary", colors: ["#34d399", "#10b981"] },
  { icon: "school",      label: "Kuize",   sub: "Testo veten",     tab: "Quizzes",    colors: ["#a78bfa", "#8b5cf6"] },
  { icon: "chatbubbles", label: "Fraza",   sub: "Shprehje",        tab: "Phrases",    colors: ["#fb923c", "#f97316"] },
];

const MEDAL_ICONS = ["trophy", "ribbon", "ribbon"]; // gold trophy for 1st, ribbon for 2nd/3rd

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: "Mirëmëngjesi", icon: "sunny-outline" };
  if (h < 18) return { text: "Mirëdita",     icon: "partly-sunny-outline" };
  return             { text: "Mirëmbrëmje",  icon: "moon-outline" };
}

function calcProgress(xp, level) {
  const min = LEVEL_XP_MIN[level] ?? 0;
  const max = LEVEL_XP_MAX[level] ?? 1000;
  return Math.min(Math.max((xp - min) / (max - min), 0), 1);
}

function nextLevel(level) {
  const idx = LEVEL_ORDER.indexOf(level);
  return LEVEL_ORDER[idx + 1] || level;
}

function fmtXp(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}

function getName(item) {
  if (item?.emri && item?.mbiemri) return `${item.emri} ${item.mbiemri[0]}.`;
  return item?.name || "Nxënës";
}

function getLevelColor(level) {
  if (level <= 2)  return "#60a5fa"; // blue
  if (level <= 4)  return "#34d399"; // teal
  if (level <= 6)  return "#a3e635"; // lime
  if (level <= 8)  return "#fbbf24"; // yellow
  if (level <= 10) return "#fb923c"; // orange
  if (level <= 13) return "#f97316"; // deep orange
  if (level <= 17) return "#ef4444"; // red
  if (level <= 22) return "#dc2626"; // deep red
  return "#b91c1c";                  // fire red
}

function getRankIcon(rank) {
  if (!rank)      return { name: "people-outline",   color: "#9ca3af" };
  if (rank <= 5)  return { name: "trophy",           color: "#fbbf24" };
  if (rank <= 15) return { name: "ribbon",           color: "#94a3b8" };
  if (rank <= 30) return { name: "flame",            color: "#f97316" };
  if (rank <= 50) return { name: "shield-checkmark", color: "#60a5fa" };
  return               { name: "person-outline",     color: "#9ca3af" };
}

function LevelRing({ level, completed, total, color, size = 68 }) {
  const progress = total > 0 ? completed / total : 0;
  const sw = 5;
  const r  = (size - sw) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ   = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(Math.max(progress, 0), 1));
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={cx} cy={cy} r={r} stroke="#e8e2da" strokeWidth={sw} fill="none" />
        <Circle
          cx={cx} cy={cy} r={r}
          stroke={color}
          strokeWidth={sw}
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </Svg>
      <Text style={{ fontSize: 14, fontFamily: F.black, color: "#0f172a" }}>{level}</Text>
      <Text style={{ fontSize: 9, fontFamily: F.bold, color, marginTop: 1 }}>{Math.round(progress * 100)}%</Text>
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const insets = useSafeAreaInsets();

  const [xpData,        setXpData]        = useState(null);
  const [myRank,        setMyRank]        = useState(null);
  const [topThree,      setTopThree]      = useState([]);
  const [challengeDone, setChallengeDone] = useState(false);
  const [dictUnlocked,  setDictUnlocked]  = useState(0);
  const [pathStats,     setPathStats]     = useState({ completed: 0, total: 0 });
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);


  async function fetchData() {
    try {
      const [xpRes, rankRes, challengeRes, weeklyRes, dictRes, pathRes] = await Promise.all([
        userService.getXp(),
        leaderboardService.getMyRank(),
        dailyChallengeService.get(),
        leaderboardService.getWeekly(),
        dictionaryService.getUnlockStats(),
        pathService.getAll({ level: user?.level || "A1", language }).catch(() => null),
      ]);
      setXpData(xpRes.data);
      setMyRank(rankRes.data);
      setChallengeDone(challengeRes.data?.alreadyCompleted ?? false);
      setTopThree((weeklyRes.data || []).slice(0, 3));
      setDictUnlocked(dictRes.data?.totalUnlocks ?? 0);
      if (pathRes) {
        const topics = pathRes.data?.topics ?? (Array.isArray(pathRes.data) ? pathRes.data : []);
        setPathStats({
          completed: topics.filter(t => t.userProgress?.isCompleted).length,
          total: topics.length,
        });
      }
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }

  useEffect(() => { fetchData(); }, []);

  const totalXp  = xpData?.data?.totalXp ?? xpData?.totalXp ?? user?.xp ?? 0;
  const level    = user?.level ?? "A1";
  const lvlColor = LEVEL_COLORS[level] ?? "#10b981";
  const progress = calcProgress(totalXp, level);
  const nextLvl  = nextLevel(level);
  const rankIcon = getRankIcon(myRank?.rank);

  const { xpLevel, xpInCurrentLevel, xpForNextLevel, levelEndXp, levelStartXp, progress: xpLevelProgress } = computeXpLevel(totalXp);
  const levelColor = getLevelColor(xpLevel);

  return (
    <View style={s.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingTop: 12 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchData(); }}
            tintColor="#10b981"
          />
        }
      >
        {/* ── HEADER ── */}
        {(() => {
          const greet = greeting();
          return (
            <View style={s.headerCard}>
              <View style={s.headerLeft}>
                <View style={s.greetRow}>
                  <Ionicons name={greet.icon} size={14} color="#b45309" />
                  <Text style={s.greeting}>{greet.text}</Text>
                </View>
                <Text style={s.userName}>{user?.emri || "Nxënës"} 👋</Text>
                <Text style={s.headerSub}>Vazhdo të mësuarit sot</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate("Path")} activeOpacity={0.85}>
                <LevelRing
                  level={level}
                  completed={pathStats.completed}
                  total={pathStats.total}
                  color={lvlColor}
                />
              </TouchableOpacity>
            </View>
          );
        })()}

        {/* ── XP CARD ── */}
        <View style={s.xpCard}>
          <View style={s.xpCardTop}>
            <View style={s.xpLeft}>
              <Text style={s.xpCardLbl}>PËRVOJË TOTALE</Text>
              {loading
                ? <ActivityIndicator color="#10b981" style={{ marginVertical: 10 }} />
                : <Text style={s.xpNum}>
                    {totalXp.toLocaleString()}
                    <Text style={s.xpUnit}> XP</Text>
                  </Text>
              }
              <View style={s.xpPills}>
                <View style={s.xpPill}>
                  <Ionicons name="trending-up-outline" size={11} color="#10b981" />
                  <Text style={[s.xpPillTxt, { color: "#10b981" }]}>+{xpData?.dailyXp ?? 0} sot</Text>
                </View>
                <View style={s.xpPill}>
                  <Ionicons name="calendar-outline" size={11} color="#0ea5e9" />
                  <Text style={[s.xpPillTxt, { color: "#0ea5e9" }]}>+{xpData?.weeklyXp ?? 0} javë</Text>
                </View>
              </View>
            </View>

            <View style={[s.rankRing, { borderColor: levelColor + "88", borderBottomColor: levelColor, shadowColor: levelColor }]}>
              <View style={[s.rankRingInner, { backgroundColor: levelColor + "22" }]}>
                <Text style={[s.rankLevelTxt, { color: levelColor }]}>LVL</Text>
                <Text style={[s.rankLevelNum, { color: levelColor }]}>{xpLevel}</Text>
              </View>
            </View>
          </View>

          {/* XP level progress bar */}
          <View style={s.xpLvlMeta}>
            <Text style={s.xpLvlLabel}>Niveli i Përvojës</Text>
            <Text style={s.xpLvlPct}>{levelEndXp.toLocaleString()} XP</Text>
          </View>
          <View style={s.xpLvlTrack}>
            <View style={[s.xpLvlFill, { width: `${Math.round(xpLevelProgress * 100)}%`, backgroundColor: levelColor }]} />
          </View>
        </View>

        {/* ── DAILY CHALLENGE ── */}
        <TouchableOpacity
          onPress={() => navigation.navigate("DailyChallenge")}
          activeOpacity={0.9}
          style={{ marginHorizontal: 16, marginTop: 10 }}
        >
          <LinearGradient
            colors={challengeDone ? ["#94a3b8", "#64748b"] : ["#ef4444", "#dc2626"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={s.challengeCard}
          >
            <View style={s.challengeLeft}>
              <View style={[s.challengeBadge, { flexDirection: "row", alignItems: "center", gap: 5 }]}>
                <Ionicons
                  name={challengeDone ? "checkmark-circle" : "flame"}
                  size={11} color="#fff"
                />
                <Text style={s.challengeBadgeTxt}>
                  {challengeDone ? "KOMPLETUAR" : "SFIDA E DITËS"}
                </Text>
              </View>
              <Text style={s.challengeTitle}>
                {challengeDone ? "Sfida e sotme u krye!" : "Kuiz i përditshëm"}
              </Text>
              <Text style={s.challengeSub}>
                {challengeDone
                  ? "Kthehu nesër për sfidën e re"
                  : "Fjalë • Fraza • Fjali • Shqiptim"}
              </Text>
            </View>
            <View style={s.challengeRight}>
              {challengeDone ? (
                <Ionicons name="checkmark-circle" size={38} color="rgba(255,255,255,0.9)" />
              ) : (
                <View style={s.challengeXpBadge}>
                  <Text style={s.challengeXpTxt}>+25</Text>
                  <Text style={s.challengeXpUnit}>XP</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* ── STATS ROW (4 compact cards) ── */}
        <View style={s.statsRow}>
          <StatChip icon="star"   iconColor="#f59e0b" bg={["#fffbeb","#fef3c7"]} textColor="#d97706"
            value={loading ? "—" : fmtXp(totalXp)} label="XP" delay={0} />
          <StatChip icon="flame"  iconColor="#ef4444" bg={["#fff1f2","#fee2e2"]} textColor="#dc2626"
            value={`${user?.streakCount ?? 0}`} label="DITË" delay={50} />
          <StatChip icon="trophy" iconColor="#8b5cf6" bg={["#faf5ff","#ede9fe"]} textColor="#7c3aed"
            value={level} label="NIVEL" delay={100} />
          <StatChip icon="book"   iconColor="#0d9488" bg={["#f0fdfa","#ccfbf1"]} textColor="#0d9488"
            value={`${dictUnlocked}`} label="FJALOR" delay={150} />
        </View>

        {/* ── WEEKLY STREAK ── */}
        <WeeklyStreakWidget
          streakCount={user?.streakCount ?? 0}
        />

        {/* ── WEEKLY TOP 3 ── */}
        <WeeklyTop3
          topThree={topThree}
          userId={user?._id}
          loading={loading}
          onPress={() => navigation.navigate("Leaderboard")}
        />

        <View style={s.body}>

          {/* ── QUICK STUDY ── */}
          <Text style={s.sectionLbl}>STUDIM I SHPEJTË</Text>
          <View style={s.quickGrid}>
            {QUICK.map(({ icon, label, sub, tab, colors }) => (
              <TouchableOpacity
                key={tab}
                style={s.quickCard}
                onPress={() => navigation.navigate(tab)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={s.quickGrad}
                >
                  <View style={s.quickIconWrap}>
                    <Ionicons name={icon} size={20} color="#fff" />
                  </View>
                  <Text style={s.quickLbl}>{label}</Text>
                  <Text style={s.quickSub}>{sub}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── NIVELET ── */}
          <Text style={s.sectionLbl}>STUDIM SIPAS NIVELIT</Text>
          <View style={s.levelRow}>
            {LEVEL_ORDER.map((lvl) => {
              const c      = LEVEL_COLORS[lvl];
              const active = lvl === level;
              return (
                <TouchableOpacity
                  key={lvl}
                  style={[s.levelPill, { backgroundColor: c + "18", borderColor: active ? c : c + "40", borderWidth: active ? 2 : 1.5 }]}
                  onPress={() => navigation.navigate("Dictionary", { screen: "DictionaryList", params: { level: lvl } })}
                  activeOpacity={0.8}
                >
                  <Text style={[s.levelPillLbl,  { color: c }]}>{lvl}</Text>
                  <Text style={[s.levelPillDesc, { color: c + "bb" }]}>{LEVEL_DESC[lvl]}</Text>
                  {active && <View style={[s.levelActiveDot, { backgroundColor: c }]} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── PREMIUM ── */}
          {!user?.isPaid && (
            <TouchableOpacity onPress={() => navigation.navigate("Profile")} activeOpacity={0.9}>
              <LinearGradient colors={["#fffbeb", "#fef9c3"]} style={s.premiumCard}>
                <View style={s.premiumIcon}>
                  <Ionicons name="diamond" size={24} color="#d97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.premiumTitle}>Bëhu Premium</Text>
                  <Text style={s.premiumSub}>Hap të gjithë nivelet dhe teste të pafundme</Text>
                </View>
                <View style={s.premiumArrow}>
                  <Ionicons name="chevron-forward" size={16} color="#d97706" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

        </View>
      </ScrollView>
    </View>
  );
}

// ── Weekly Streak Widget ───────────────────────────────────────────────────────
const WEEK_DAYS = ["Hë", "Ma", "Me", "En", "Pr", "Sh", "Di"];

function WeeklyStreakWidget({ streakCount = 0 }) {
  const todayDow = (new Date().getDay() + 6) % 7; // 0=Mon … 6=Sun

  return (
    <View style={s.streakWidget}>
      <Text style={s.streakWidgetLbl}>STRIKA E JAVËS</Text>
      <View style={s.streakDaysRow}>
        {WEEK_DAYS.map((abbr, idx) => {
          const isToday  = idx === todayDow;
          const isActive = idx <= todayDow && streakCount >= (todayDow - idx + 1);
          const isMissed = idx < todayDow && !isActive;

          return (
            <View key={abbr} style={s.streakDayCol}>
              <Text style={[
                s.streakDayLbl,
                isToday  && s.streakDayLblActive,
                isMissed && s.streakDayLblMissed,
              ]}>
                {abbr}
              </Text>
              <View style={[
                s.streakDayCircle,
                isActive  && s.streakDayCircleActive,
                isToday && !isActive && s.streakDayCircleToday,
                isMissed  && s.streakDayCircleMissed,
              ]}>
                {isActive  && <Ionicons name="checkmark" size={16} color="#fff" />}
                {isMissed  && <Ionicons name="sad-outline" size={18} color="#ef4444" />}
                {isToday && !isActive && <View style={s.streakDayDot} />}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── Weekly Podium Component ────────────────────────────────────────────────────
const PODIUM_COLORS = {
  0: { ring: "#f59e0b", bg: ["#fffbeb", "#fef3c7"], base: ["#f59e0b", "#d97706"], crown: "#f59e0b" },  // gold  (1st)
  1: { ring: "#94a3b8", bg: ["#f8fafc", "#f1f5f9"], base: ["#94a3b8", "#64748b"], crown: "#94a3b8" },  // silver (2nd)
  2: { ring: "#cd7c3a", bg: ["#fff7ed", "#ffedd5"], base: ["#cd7c3a", "#9a5c24"], crown: "#cd7c3a" },  // bronze (3rd)
};
const PODIUM_HEIGHTS = [110, 80, 60]; // 1st, 2nd, 3rd base heights
// display order: 2nd (left), 1st (center), 3rd (right)
const DISPLAY_ORDER = [1, 0, 2];

function WeeklyTop3({ topThree, userId, loading, onPress }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnims = [
    useRef(new Animated.Value(0.6)).current,
    useRef(new Animated.Value(0.6)).current,
    useRef(new Animated.Value(0.6)).current,
  ];

  useEffect(() => {
    if (loading) return;
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    DISPLAY_ORDER.forEach((rankIdx, order) => {
      Animated.spring(scaleAnims[order], {
        toValue: 1, delay: order * 100,
        tension: 55, friction: 8, useNativeDriver: true,
      }).start();
    });
  }, [loading]);

  return (
    <View style={[s.section, { marginTop: 14 }]}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionLbl}>TOP 3 KËSAJ JAVE</Text>
        <TouchableOpacity onPress={onPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={s.seeAll}>Shiko të gjithë →</Text>
        </TouchableOpacity>
      </View>

      <LinearGradient colors={["#fffdf8", "#fef6e4", "#fdf0d0"]} style={s.podiumCard}>
        {/* Diagonal shine overlay */}
        <LinearGradient
          colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.55)", "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.6 }}
          style={s.podiumShine}
          pointerEvents="none"
        />

        {/* Decorative stars */}
        <View style={s.podiumStarsRow}>
          {[0, 1, 2].map((i) => (
            <Ionicons key={i} name="star" size={i === 1 ? 14 : 9} color={i === 1 ? "#f59e0b" : "#fcd34d"} />
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color="#f59e0b" style={{ paddingVertical: 32 }} />
        ) : topThree.length === 0 ? (
          <Text style={s.podiumEmpty}>Nuk ka të dhëna ende.</Text>
        ) : (
          <View style={s.podiumRow}>
            {DISPLAY_ORDER.map((rankIdx, displayPos) => {
              const item = topThree[rankIdx];
              if (!item) return null;
              const isMe   = item._id === userId;
              const colors = PODIUM_COLORS[rankIdx];
              const height = PODIUM_HEIGHTS[rankIdx];
              const isFirst = rankIdx === 0;
              const avatarSize = isFirst ? 64 : 52;

              return (
                <Animated.View
                  key={item._id ?? rankIdx}
                  style={[s.podiumSlot, isFirst && s.podiumSlotCenter, { transform: [{ scale: scaleAnims[displayPos] }] }]}
                >
                  {isFirst
                    ? <Ionicons name="trophy" size={24} color="#f59e0b" style={{ marginBottom: 4 }} />
                    : <View style={{ height: 28 }} />
                  }

                  {/* Medal badge */}
                  <View style={[s.medalBadge, { backgroundColor: colors.ring + "22", borderColor: colors.ring }]}>
                    <Ionicons name={MEDAL_ICONS[rankIdx]} size={13} color={colors.ring} />
                  </View>

                  {/* Avatar */}
                  <View style={[
                    s.avatarRing,
                    { borderColor: colors.ring, width: avatarSize + 8, height: avatarSize + 8, borderRadius: (avatarSize + 8) / 2 },
                    isMe && s.avatarRingMe,
                  ]}>
                    <Image
                      source={{ uri: generateDicebearUrl(item._id, item.avatarStyle || "adventurer") }}
                      style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }}
                    />
                  </View>

                  {/* Name */}
                  <Text style={[s.podiumName, isFirst && s.podiumNameFirst, isMe && s.podiumNameMe]} numberOfLines={1}>
                    {getName(item)}
                  </Text>

                  {/* XP pill */}
                  <View style={[s.xpPillPodium, { backgroundColor: colors.ring + "20" }]}>
                    <Text style={[s.xpPillPodiumTxt, { color: colors.ring }]}>
                      {fmtXp(item.xp)} XP
                    </Text>
                  </View>

                  {/* Podium base — 3D */}
                  <LinearGradient
                    colors={colors.base}
                    style={[s.podiumBase, { height }]}
                  >
                    {/* Shine strip on base */}
                    <LinearGradient
                      colors={["rgba(255,255,255,0.3)", "rgba(255,255,255,0)"]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFillObject}
                      pointerEvents="none"
                    />
                    <Text style={s.podiumRank}>#{rankIdx + 1}</Text>
                  </LinearGradient>
                </Animated.View>
              );
            })}
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

// ── Compact Stat Chip ─────────────────────────────────────────────────────────
function StatChip({ icon, iconColor, bg, textColor, value, label, delay = 0 }) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;
  const scale      = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 300, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay, tension: 80, friction: 11, useNativeDriver: true }),
    ]).start();
  }, []);

  const pressIn  = () => Animated.spring(scale, { toValue: 0.93, tension: 200, friction: 10, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    tension: 200, friction: 10, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }, { scale }], width: STAT_W }}>
      <TouchableOpacity onPressIn={pressIn} onPressOut={pressOut} activeOpacity={1}>
        <LinearGradient colors={bg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.statChip}>
          <View style={[s.chipIcon, { backgroundColor: iconColor + "20" }]}>
            <Ionicons name={icon} size={14} color={iconColor} />
          </View>
          <Text style={[s.chipValue, { color: textColor }]}>{value}</Text>
          <Text style={s.chipLabel}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8f5f0" },

  // Header card
  headerCard: {
    marginHorizontal: 16, marginTop: 6, marginBottom: 4,
    backgroundColor: "#fffdf8",
    borderRadius: 22, padding: 16,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderWidth: 1, borderColor: "#ede9e0",
    borderBottomWidth: 4, borderBottomColor: "#e2ddd6",
    shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  headerLeft: { flex: 1 },
  greetRow:   { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 3 },
  greeting:   { color: "#b45309", fontSize: 11, fontFamily: F.bold, letterSpacing: 0.3 },
  userName:   { color: "#0f172a", fontSize: 24, fontFamily: F.black, marginBottom: 2 },
  headerSub:  { color: "#a8a29e", fontSize: 11, fontFamily: F.regular },

  // XP Card
  xpCard: {
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: "#fff", borderRadius: 24, padding: 18,
    borderWidth: 1, borderColor: "#e2e8f0",
    borderBottomWidth: 5, borderBottomColor: "#cbd5e1",
    shadowColor: "#000", shadowOpacity: 0.13, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  xpCardTop:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  xpLeft:     { flex: 1 },
  xpCardLbl:  { color: "#94a3b8", fontSize: 10, fontFamily: F.xbold, letterSpacing: 1.2 },
  xpNum:      { color: "#0f172a", fontSize: 36, fontFamily: F.black, marginTop: 4, letterSpacing: -1 },
  xpUnit:     { fontSize: 16, fontFamily: F.semi, color: "#64748b" },
  xpPills:    { flexDirection: "row", gap: 7, marginTop: 10 },
  xpPill:     {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#f8fafc", borderRadius: 20,
    paddingHorizontal: 9, paddingVertical: 4,
    borderWidth: 1, borderColor: "#f1f5f9",
  },
  xpPillTxt:  { fontSize: 10, fontFamily: F.bold },

  rankRing: {
    width: 84, height: 84, borderRadius: 42, borderWidth: 3,
    alignItems: "center", justifyContent: "center", marginLeft: 12,
    shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 8,
    borderBottomWidth: 5,
  },
  rankRingInner:  { width: 70, height: 70, borderRadius: 35, alignItems: "center", justifyContent: "center" },
  rankSub:        { fontSize: 9, fontFamily: F.bold, marginTop: 1 },
  rankLevelTxt:   { fontSize: 10, fontFamily: F.bold, color: "#d97706", letterSpacing: 1 },
  rankLevelNum:   { fontSize: 26, fontFamily: F.black, color: "#d97706", lineHeight: 28 },

  progressRow:   { flexDirection: "row", justifyContent: "space-between", marginBottom: 7 },
  progressLbl:   { color: "#64748b", fontSize: 11, fontFamily: F.bold },
  progressPct:   { fontSize: 11, fontFamily: F.xbold },
  progressTrack: { height: 7, backgroundColor: "#f1f5f9", borderRadius: 4, overflow: "hidden" },
  progressFill:  { height: 7, borderRadius: 4 },

  xpInfoRow:      { flexDirection: "row", gap: 8, marginTop: 12, marginBottom: 8 },
  xpInfoChip:     { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: "#fbbf2414", borderWidth: 1, borderColor: "#fbbf2466" },
  xpInfoChipTxt:  { color: "#d97706", fontSize: 11, fontFamily: F.bold },

  xpLvlRow:       { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 },
  xpLvlBadge:     { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: "#fbbf2422", borderWidth: 1.5, borderColor: "#fbbf2466" },
  xpLvlBadgeTxt:  { color: "#d97706", fontSize: 10, fontFamily: F.black, letterSpacing: 0.5 },
  xpLvlMeta:      { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  xpLvlLabel:     { color: "#64748b", fontSize: 11, fontFamily: F.bold },
  xpLvlPct:       { color: "#d97706", fontSize: 11, fontFamily: F.xbold },
  xpLvlTrack:     { height: 6, backgroundColor: "#f1f5f9", borderRadius: 4, overflow: "hidden" },
  xpLvlFill:      { height: "100%", backgroundColor: "#fbbf24", borderRadius: 4 },

  // Stats row (4 chips)
  statsRow: { flexDirection: "row", gap: 8, marginHorizontal: 16, marginTop: 12, marginBottom: 4 },
  statChip: {
    borderRadius: 16, paddingVertical: 10, paddingHorizontal: 6,
    alignItems: "center",
    borderBottomWidth: 4, borderBottomColor: "rgba(0,0,0,0.15)",
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 5 }, elevation: 6,
  },
  chipIcon:  { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  chipValue: { fontSize: 17, fontFamily: F.black, letterSpacing: -0.3, marginBottom: 2 },
  chipLabel: { fontSize: 8, fontFamily: F.xbold, color: "#9ca3af", letterSpacing: 0.5 },

  // Weekly Top 3
  section:       { paddingHorizontal: 16 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionLbl:    { fontSize: 11, fontFamily: F.xbold, color: "#94a3b8", letterSpacing: 1.4 },
  seeAll:        { fontSize: 11, fontFamily: F.bold, color: "#6366f1" },

  // Podium card
  podiumCard: {
    borderRadius: 24, paddingTop: 16, paddingBottom: 0,
    paddingHorizontal: 12, overflow: "hidden",
    borderWidth: 1, borderColor: "#f0e8d8",
    borderBottomWidth: 5, borderBottomColor: "#e8dac0",
    shadowColor: "#c8a96e", shadowOpacity: 0.22, shadowRadius: 16, shadowOffset: { width: 0, height: 5 }, elevation: 7,
  },
  podiumShine: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  podiumStarsRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 12, zIndex: 2 },
  podiumEmpty:    { textAlign: "center", color: "#92400e", fontSize: 13, fontFamily: F.semi, paddingVertical: 32 },

  podiumRow:       { flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 8, zIndex: 2 },
  podiumSlot:      { flex: 1, alignItems: "center" },
  podiumSlotCenter:{ flex: 1.15 },

  medalBadge: {
    borderWidth: 1.5, borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 3, marginBottom: 6,
    alignItems: "center", justifyContent: "center",
  },

  avatarRing: {
    borderWidth: 3, alignItems: "center", justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  avatarRingMe: { borderStyle: "dashed" },

  podiumName: {
    fontSize: 11, fontFamily: F.xbold, color: "#475569",
    textAlign: "center", marginBottom: 5, width: "100%",
  },
  podiumNameFirst: { fontSize: 12, color: "#0f172a" },
  podiumNameMe:    { color: "#6366f1" },

  xpPillPodium:    { borderRadius: 12, paddingHorizontal: 9, paddingVertical: 3, marginBottom: 10 },
  xpPillPodiumTxt: { fontSize: 11, fontFamily: F.bold },

  podiumBase: {
    width: "100%", borderTopLeftRadius: 10, borderTopRightRadius: 10,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
    borderTopWidth: 2, borderTopColor: "rgba(255,255,255,0.4)",
  },
  podiumRank: { color: "rgba(255,255,255,0.95)", fontFamily: F.black, fontSize: 16 },

  // Body sections
  body:       { paddingHorizontal: 16, paddingTop: 16 },

  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 28 },
  quickCard: {
    width: (width - 44) / 2, borderRadius: 20, overflow: "hidden",
    borderBottomWidth: 5, borderBottomColor: "rgba(0,0,0,0.18)",
    shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  quickGrad:     { padding: 16, minHeight: 106, justifyContent: "space-between" },
  quickIconWrap: { width: 38, height: 38, borderRadius: 11, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center" },
  quickLbl:      { color: "#fff", fontFamily: F.xbold, fontSize: 14, marginTop: 8 },
  quickSub:      { color: "rgba(255,255,255,0.75)", fontSize: 10, fontFamily: F.regular },

  levelRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  levelPill: {
    flex: 1, minWidth: (width - 72) / 3 - 2,
    borderRadius: 16, paddingVertical: 12,
    alignItems: "center", position: "relative",
  },
  levelPillLbl:   { fontSize: 17, fontFamily: F.black },
  levelPillDesc:  { fontSize: 9, fontFamily: F.bold, marginTop: 2 },
  levelActiveDot: { width: 6, height: 6, borderRadius: 3, position: "absolute", bottom: 6 },

  // Weekly Streak Widget
  streakWidget: {
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: "#fff", borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: "#f1f5f9",
    borderBottomWidth: 4, borderBottomColor: "#e2e8f0",
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  streakWidgetLbl: { fontSize: 11, fontFamily: F.xbold, color: "#94a3b8", letterSpacing: 1.4, marginBottom: 12 },
  streakDaysRow:   { flexDirection: "row", justifyContent: "space-between" },
  streakDayCol:    { alignItems: "center", gap: 5 },
  streakDayLbl:    { fontSize: 11, fontFamily: F.bold, color: "#94a3b8" },
  streakDayLblActive: { color: "#f97316" },
  streakDayLblMissed: { color: "#fca5a5" },
  streakDayCircle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "#f1f5f9",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  streakDayCircleActive: {
    backgroundColor: "#f97316",
    shadowColor: "#f97316", shadowOpacity: 0.4, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  streakDayCircleToday:  { borderWidth: 2, borderColor: "#f97316", backgroundColor: "#fff7ed" },
  streakDayCircleMissed: { backgroundColor: "#fef2f2", borderWidth: 1.5, borderColor: "#fca5a5" },
  streakDayDot:    { width: 7, height: 7, borderRadius: 4, backgroundColor: "#f97316" },

  // Daily Challenge
  challengeCard: {
    borderRadius: 20, padding: 18,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    shadowColor: "#ef4444", shadowOpacity: 0.22, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  challengeLeft:     { flex: 1 },
  challengeBadge:    {
    alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4, marginBottom: 7,
  },
  challengeBadgeTxt: { color: "#fff", fontSize: 10, fontFamily: F.xbold, letterSpacing: 0.8 },
  challengeTitle:    { color: "#fff", fontSize: 17, fontFamily: F.black, marginBottom: 3 },
  challengeSub:      { color: "rgba(255,255,255,0.8)", fontSize: 11, fontFamily: F.regular },
  challengeRight:    { marginLeft: 14, alignItems: "center" },
  challengeXpBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7, alignItems: "center",
  },
  challengeXpTxt:  { color: "#fff", fontSize: 22, fontFamily: F.black, lineHeight: 26 },
  challengeXpUnit: { color: "rgba(255,255,255,0.85)", fontSize: 11, fontFamily: F.bold },

  // Premium
  premiumCard: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 20, padding: 14,
    borderWidth: 1.5, borderColor: "#fcd34d",
    gap: 12, marginBottom: 8,
    shadowColor: "#fbbf24", shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  premiumIcon:  { width: 46, height: 46, borderRadius: 13, backgroundColor: "#fef3c7", alignItems: "center", justifyContent: "center" },
  premiumTitle: { color: "#92400e", fontFamily: F.xbold, fontSize: 14 },
  premiumSub:   { color: "#b45309", fontSize: 11, fontFamily: F.regular, marginTop: 2 },
  premiumArrow: { width: 28, height: 28, borderRadius: 9, backgroundColor: "#fde68a55", alignItems: "center", justifyContent: "center" },
});
