import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, FlatList, Image, RefreshControl,
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { leaderboardService, generateDicebearUrl } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { F } from "../../styles/fonts";

// ── Leagues ────────────────────────────────────────────────────────────────────
const LEAGUES = [
  { id: 1, name: "Bronz",    emoji: "🥉", color: "#cd7c3a", grad: ["#fdba74","#f97316"], min: 0,     max: 5000     },
  { id: 2, name: "Argjend",  emoji: "🥈", color: "#94a3b8", grad: ["#e2e8f0","#94a3b8"], min: 5000,  max: 10000    },
  { id: 3, name: "Ar",       emoji: "🥇", color: "#f59e0b", grad: ["#fcd34d","#f59e0b"], min: 10000, max: 20000    },
  { id: 4, name: "Platinë",  emoji: "💎", color: "#06b6d4", grad: ["#67e8f9","#0891b2"], min: 20000, max: 30000    },
  { id: 5, name: "Diamant",  emoji: "💠", color: "#8b5cf6", grad: ["#c4b5fd","#7c3aed"], min: 30000, max: 50000    },
  { id: 6, name: "Legjendë", emoji: "👑", color: "#ef4444", grad: ["#fca5a5","#dc2626"], min: 50000, max: Infinity },
];

function getLeague(xp = 0) {
  for (let i = LEAGUES.length - 1; i >= 0; i--) {
    if (xp >= LEAGUES[i].min) return LEAGUES[i];
  }
  return LEAGUES[0];
}

const TIME_FRAMES = [
  { key: "all-time", label: "Gjithë kohës", icon: "infinite"    },
  { key: "weekly",   label: "Javore",        icon: "calendar"    },
  { key: "monthly",  label: "Mujore",        icon: "stats-chart" },
  { key: "liga",     label: "Liga",          icon: "shield"      },
];

const FETCHERS = {
  "all-time": () => leaderboardService.getAllTime(),
  "weekly":   () => leaderboardService.getWeekly(),
  "monthly":  () => leaderboardService.getMonthly(),
  "liga":     () => leaderboardService.getAllTime(),
};

const PODIUM = [
  { slot: 1, di: 0, medal: "🥈", gradColors: ["#94a3b8","#cbd5e1"], numColor: "#334155", h: 88  },
  { slot: 0, di: 0, medal: "🥇", gradColors: ["#f59e0b","#fbbf24"], numColor: "#78350f", h: 120 },
  { slot: 2, di: 0, medal: "🥉", gradColors: ["#fb923c","#fdba74"], numColor: "#7c2d12", h: 76  },
];

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const insets   = useSafeAreaInsets();
  const [timeFrame, setTimeFrame] = useState("all-time");
  const [data, setData]           = useState([]);
  const [myRank, setMyRank]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const countdown = useCountdown(timeFrame);

  const myXp     = user?.xp ?? myRank?.xp ?? 0;
  const myLeague = getLeague(myXp);
  const nextLeague = LEAGUES.find(l => l.id === myLeague.id + 1) || null;

  useEffect(() => { loadData(); }, [timeFrame]);

  async function loadData(isRefresh = false) {
    if (!isRefresh) setLoading(true);
    const [boardRes, rankRes] = await Promise.allSettled([
      FETCHERS[timeFrame](),
      leaderboardService.getMyRank(timeFrame === "liga" ? "all-time" : timeFrame),
    ]);
    if (boardRes.status === "fulfilled") {
      let d = boardRes.value.data;
      let list = Array.isArray(d) ? d : d?.leaderboard || [];
      if (timeFrame === "liga") {
        list = list.filter(u => {
          const uxp = u.xp ?? 0;
          return uxp >= myLeague.min && (myLeague.max === Infinity || uxp < myLeague.max);
        });
      }
      setData(list);
    } else setData([]);
    if (rankRes.status === "fulfilled") setMyRank(rankRes.value.data);
    setLoading(false);
    setRefreshing(false);
  }

  const top3 = data.slice(0, 3);
  const rest  = data.slice(3);

  return (
    <View style={s.root}>
      <FlatList
        data={loading ? [] : rest}
        keyExtractor={(item, i) => item._id || String(i)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(true); }} tintColor="#14b8a6" />
        }

        ListHeaderComponent={
          <>
            {/* ── Cream hero card ──────────────────────────────────── */}
            <View style={[s.heroCard, { paddingTop: insets.top + 14 }]}>
              <View style={s.heroTop}>
                <View style={s.heroIconBox}>
                  <Ionicons name="trophy" size={20} color="#b45309" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.heroLabelRow}>
                    <Ionicons name="podium-outline" size={11} color="#b45309" />
                    <Text style={s.heroLabel}>RENDITJA</Text>
                  </View>
                  <Text style={s.heroTitle}>Tabela e Renditjes</Text>
                  <Text style={s.heroSub}>Krahaso veten me të gjithë nxënësit</Text>
                </View>
                {myRank && (
                  <View style={s.myRankPill}>
                    <Text style={s.myRankPillText}>#{myRank.rank}</Text>
                  </View>
                )}
              </View>

              {/* ── Tabs ── */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabsRow}>
                {TIME_FRAMES.map(({ key, label, icon }) => {
                  const active = timeFrame === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      onPress={() => setTimeFrame(key)}
                      style={[s.tab, active && s.tabActive]}
                      activeOpacity={0.75}
                    >
                      <Ionicons name={icon} size={12} color={active ? "#fff" : "#94a3b8"} />
                      <Text style={[s.tabText, active && s.tabTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* ── Countdown banner ── */}
              {!!countdown && (
                <View style={s.countdownRow}>
                  <Ionicons name="time-outline" size={13} color="#b45309" />
                  <Text style={s.countdownLabel}>
                    {timeFrame === "weekly" ? "Java mbaron në:" : "Muaji mbaron në:"}
                  </Text>
                  <View style={s.countdownPill}>
                    <Text style={s.countdownTxt}>{countdown}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* ── League banner ────────────────────────────────────── */}
            <LeagueBanner
              league={myLeague}
              nextLeague={nextLeague}
              xp={myXp}
              isLeagueTab={timeFrame === "liga"}
            />

            {/* ── My rank banner ───────────────────────────────────── */}
            {myRank && (
              <View style={s.myRankBanner}>
                <View style={s.myRankLeft}>
                  <View style={s.myRankBadge}>
                    <Text style={s.myRankBadgeText}>#{myRank.rank}</Text>
                  </View>
                  <Image
                    source={{ uri: generateDicebearUrl(myRank._id, myRank.avatarStyle || "adventurer") }}
                    style={s.myRankAvatar}
                  />
                  <View>
                    <Text style={s.myRankName} numberOfLines={1}>Renditja juaj</Text>
                    <View style={s.myRankMeta}>
                      <Ionicons name="flame" size={11} color="#f97316" />
                      <Text style={s.myRankMetaTxt}>{myRank.streak || 0} ditë streak</Text>
                    </View>
                  </View>
                </View>
                <View style={s.myRankRight}>
                  <Ionicons name="flash" size={13} color="#eab308" />
                  <Text style={s.myRankXp}>{fmt(myRank.xp)}</Text>
                  <Text style={s.myRankXpLbl}>XP</Text>
                </View>
              </View>
            )}

            {/* ── Podium ───────────────────────────────────────────── */}
            {!loading && top3.length > 0 && (
              <View style={s.podiumWrap}>
                <View style={s.podiumHeader}>
                  <Ionicons name="podium" size={14} color="#14b8a6" />
                  <Text style={s.podiumHeaderTxt}>Top 3 Performuesit</Text>
                </View>
                <View style={s.podiumRow}>
                  {/* Silver (2nd) — Left */}
                  <PodiumSlot item={top3[1]} rank={2} medal="🥈" gradColors={["#94a3b8","#cbd5e1"]} numColor="#334155" height={88} user={user} />
                  {/* Gold (1st) — Center */}
                  <PodiumSlot item={top3[0]} rank={1} medal="🥇" gradColors={["#f59e0b","#fbbf24"]} numColor="#78350f" height={120} user={user} center />
                  {/* Bronze (3rd) — Right */}
                  <PodiumSlot item={top3[2]} rank={3} medal="🥉" gradColors={["#fb923c","#fdba74"]} numColor="#7c2d12" height={76} user={user} />
                </View>
              </View>
            )}

            {/* ── List label ───────────────────────────────────────── */}
            {!loading && rest.length > 0 && (
              <View style={s.listLabel}>
                <Text style={s.listLabelTxt}>RENDITJA E PLOTË</Text>
              </View>
            )}
          </>
        }

        ListEmptyComponent={
          loading ? (
            <View style={s.loader}>
              <ActivityIndicator color="#14b8a6" size="large" />
              <Text style={s.loaderTxt}>Po ngarkohet...</Text>
            </View>
          ) : (
            <View style={s.empty}>
              <Ionicons name="bar-chart-outline" size={28} color="#94a3b8" />
              <Text style={s.emptyTxt}>Nuk ka të dhëna akoma</Text>
            </View>
          )
        }

        renderItem={({ item, index }) => {
          const rank = index + 4;
          const me   = isMe(item, user);
          const rankTier = rank <= 10 ? "gold" : rank <= 20 ? "bronze" : "plain";
          return (
            <View style={[s.row, me && s.rowMe]}>
              <View style={[s.rankBadge, s[`rankBadge_${rankTier}`], me && s.rankBadge_me]}>
                <Text style={[s.rankNum, s[`rankNum_${rankTier}`], me && s.rankNum_me]}>{rank}</Text>
              </View>
              <Image
                source={{ uri: generateDicebearUrl(item._id, item.avatarStyle || "adventurer") }}
                style={[s.rowAvatar, me && s.rowAvatarMe]}
              />
              <View style={s.rowBody}>
                <Text numberOfLines={1} style={[s.rowName, me && s.rowNameMe]}>
                  {getName(item)}{me ? "  👤" : ""}
                </Text>
                <View style={s.rowStreak}>
                  <Ionicons name="flame" size={10} color="#f97316" />
                  <Text style={s.rowStreakTxt}>{item.streak || 0} ditë</Text>
                </View>
              </View>
              <View style={s.rowXp}>
                <Text style={[s.rowXpVal, me && s.rowXpValMe]}>{fmt(item.xp)}</Text>
                <Text style={s.rowXpLbl}>XP</Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

// ── League Banner ─────────────────────────────────────────────────────────────
function LeagueBanner({ league, nextLeague, xp, isLeagueTab }) {
  const progress = nextLeague
    ? Math.min((xp - league.min) / (nextLeague.min - league.min), 1)
    : 1;

  return (
    <LinearGradient
      colors={league.grad}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={[lb.card, { borderBottomColor: league.color }]}
    >
      <View style={lb.left}>
        <Text style={lb.emoji}>{league.emoji}</Text>
        <View>
          <Text style={lb.ligaLbl}>LIGA JUAJ</Text>
          <Text style={lb.ligaName}>{league.name}</Text>
        </View>
      </View>

      <View style={lb.right}>
        {nextLeague ? (
          <>
            <Text style={lb.xpTxt}>{fmt(xp)} / {fmt(nextLeague.min)} XP</Text>
            <View style={lb.barTrack}>
              <View style={[lb.barFill, { width: `${Math.round(progress * 100)}%` }]} />
            </View>
            <Text style={lb.nextLbl}>Drejt {nextLeague.emoji} {nextLeague.name}</Text>
          </>
        ) : (
          <>
            <Text style={lb.xpTxt}>{fmt(xp)} XP</Text>
            <Text style={lb.nextLbl}>Liga maksimale 👑</Text>
          </>
        )}
      </View>

      {isLeagueTab && (
        <View style={lb.activePill}>
          <Text style={lb.activePillTxt}>Shiko lidhjet e ligës</Text>
        </View>
      )}
    </LinearGradient>
  );
}

// ── Podium slot component ─────────────────────────────────────────────────────
function PodiumSlot({ item, rank, medal, gradColors, numColor, height, user, center }) {
  if (!item) return <View style={s.podiumSlot} />;
  const me = isMe(item, user);
  return (
    <View style={[s.podiumSlot, center && s.podiumSlotCenter]}>
      <Text style={s.podiumMedal}>{medal}</Text>
      <Image
        source={{ uri: generateDicebearUrl(item._id, item.avatarStyle || "adventurer") }}
        style={[s.podiumAvatar, center && s.podiumAvatarLg, me && s.podiumAvatarMe]}
      />
      <Text numberOfLines={1} style={[s.podiumName, me && { color: "#059669" }]}>
        {getName(item).split(" ")[0]}
      </Text>
      <Text style={s.podiumXp}>{fmt(item.xp)} XP</Text>
      <View style={s.podiumBaseWrap}>
        <LinearGradient colors={gradColors} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={[s.podiumBase, { height }]}>
          <Text style={[s.podiumNum, { color: numColor }]}>{rank}</Text>
        </LinearGradient>
      </View>
    </View>
  );
}

// ── Countdown helpers ─────────────────────────────────────────────────────────
function getResetDate(frame) {
  const now = new Date();
  if (frame === "weekly") {
    // Next Monday 00:00 local time
    const day = now.getDay(); // 0=Sun, 1=Mon ... 6=Sat
    const daysUntilMonday = day === 0 ? 1 : 8 - day;
    const next = new Date(now);
    next.setDate(now.getDate() + daysUntilMonday);
    next.setHours(0, 0, 0, 0);
    return next;
  }
  if (frame === "monthly") {
    // 1st of next month 00:00 local time
    return new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
  }
  return null;
}

function formatCountdown(ms) {
  if (ms <= 0) return "00d 00h 00m 00s";
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d)}d ${pad(h)}h ${pad(m)}m ${pad(s)}s`;
}

function useCountdown(frame) {
  const [label, setLabel] = useState("");
  const timerRef = useRef(null);

  useEffect(() => {
    if (frame === "all-time") { setLabel(""); return; }
    function tick() {
      const reset = getResetDate(frame);
      if (!reset) { setLabel(""); return; }
      setLabel(formatCountdown(reset - Date.now()));
    }
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [frame]);

  return label;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function isMe(item, user) {
  if (!item || !user) return false;
  return String(item._id || "") === String(user._id || user.id || "");
}
function getName(item) {
  if (item?.emri && item?.mbiemri) return `${item.emri} ${item.mbiemri}`;
  return item?.name || "Nxënës";
}
function fmt(v) { return Number(v || 0).toLocaleString(); }

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: "#f8f5f0" },
  listContent: { paddingBottom: 32 },

  // ── Hero card (matches HomeScreen headerCard)
  heroCard: {
    backgroundColor: "#fffdf8",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 4, borderBottomColor: "#e2ddd6",
    borderWidth: 1, borderColor: "#ede9e0",
    shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  heroTop: {
    flexDirection: "row", alignItems: "flex-start",
    gap: 12, marginBottom: 14,
  },
  heroIconBox: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: "#fef3c7",
    borderWidth: 1, borderColor: "#fde68a",
    alignItems: "center", justifyContent: "center",
    marginTop: 2,
  },
  heroLabelRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 3 },
  heroLabel:    { color: "#b45309", fontSize: 11, fontFamily: F.bold, letterSpacing: 0.3 },
  heroTitle:    { color: "#0f172a", fontSize: 22, fontFamily: F.black, marginBottom: 2 },
  heroSub:      { color: "#a8a29e", fontSize: 11, fontFamily: F.regular },
  myRankPill: {
    backgroundColor: "#ecfdf5",
    borderWidth: 1, borderColor: "#a7f3d0",
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    alignSelf: "flex-start",
  },
  myRankPillText: { color: "#059669", fontSize: 14, fontFamily: F.black },

  // Tabs
  tabsRow: { gap: 8, paddingRight: 4 },
  tab: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f1ede4",
    borderWidth: 1, borderColor: "#e5e0d5",
  },
  tabActive: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a",
  },
  tabText:       { color: "#94a3b8", fontSize: 12, fontFamily: F.bold },
  tabTextActive: { color: "#fff" },

  // ── Countdown
  countdownRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: 12, paddingHorizontal: 2,
  },
  countdownLabel: { color: "#78716c", fontSize: 11, fontFamily: F.bold },
  countdownPill: {
    backgroundColor: "#fef3c7",
    borderWidth: 1, borderColor: "#fde68a",
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3,
  },
  countdownTxt: { color: "#b45309", fontSize: 11, fontFamily: F.black, letterSpacing: 0.5 },

  // ── My rank banner
  myRankBanner: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: 12, marginTop: 12, marginBottom: 4,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: "#fffdf8",
    borderRadius: 18,
    borderWidth: 1.5, borderColor: "#a7f3d0",
    borderBottomWidth: 4, borderBottomColor: "#6ee7b7",
    shadowColor: "#10b981", shadowOpacity: 0.14,
    shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  myRankLeft:  { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  myRankBadge: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "#d1fae5",
    borderWidth: 1, borderColor: "#a7f3d0",
    alignItems: "center", justifyContent: "center",
  },
  myRankBadgeText: { color: "#059669", fontSize: 13, fontFamily: F.black },
  myRankAvatar:    { width: 32, height: 32, borderRadius: 10 },
  myRankName:      { color: "#0f172a", fontSize: 13, fontFamily: F.bold },
  myRankMeta:      { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  myRankMetaTxt:   { color: "#94a3b8", fontSize: 10, fontFamily: F.semi },
  myRankRight:     { flexDirection: "row", alignItems: "baseline", gap: 3 },
  myRankXp:        { color: "#0f172a", fontSize: 20, fontFamily: F.black },
  myRankXpLbl:     { color: "#94a3b8", fontSize: 10, fontFamily: F.bold },

  // ── Podium
  podiumWrap: {
    marginHorizontal: 12, marginTop: 12, marginBottom: 4,
    backgroundColor: "#fffdf8", borderRadius: 22,
    paddingHorizontal: 12, paddingTop: 16, paddingBottom: 0,
    borderWidth: 1, borderColor: "#ede9e0",
    borderBottomWidth: 4, borderBottomColor: "#e2ddd6",
    shadowColor: "#000", shadowOpacity: 0.1,
    shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 6,
  },
  podiumHeader: {
    flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16,
  },
  podiumHeaderTxt: { fontSize: 11, fontFamily: F.black, color: "#78716c", letterSpacing: 1 },
  podiumRow:       { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  podiumSlot:      { flex: 1, alignItems: "center" },
  podiumSlotCenter:{ marginBottom: 14 },
  podiumMedal:     { fontSize: 22, marginBottom: 5 },
  podiumAvatar:    {
    width: 44, height: 44, borderRadius: 15,
    borderWidth: 2.5, borderColor: "#e2e8f0", marginBottom: 6,
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  podiumAvatarLg:  {
    width: 56, height: 56, borderRadius: 18,
    borderColor: "#fcd34d", borderWidth: 3,
    shadowColor: "#f59e0b", shadowOpacity: 0.3, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  podiumAvatarMe:  { borderColor: "#34d399" },
  podiumName:      { fontSize: 11, fontFamily: F.black, color: "#0f172a", textAlign: "center", marginBottom: 2 },
  podiumXp:        { fontSize: 9, color: "#78716c", fontFamily: F.semi, marginBottom: 8 },
  podiumBaseWrap: {
    width: "100%",
    shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  podiumBase: {
    width: "100%", borderTopLeftRadius: 12, borderTopRightRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  podiumNum: { fontSize: 24, fontFamily: F.black },

  // ── List label
  listLabel: {
    paddingHorizontal: 16, paddingTop: 18, paddingBottom: 8,
  },
  listLabelTxt: {
    fontSize: 10, fontFamily: F.black, color: "#a8a29e", letterSpacing: 1.5,
  },

  // ── Row items
  row: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: 12, marginBottom: 6,
    paddingHorizontal: 12, paddingVertical: 11,
    backgroundColor: "#fffdf8",
    borderRadius: 16,
    borderWidth: 1, borderColor: "#ede9e0",
    borderBottomWidth: 3, borderBottomColor: "#e2ddd6",
    gap: 10,
    shadowColor: "#000", shadowOpacity: 0.05,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  rowMe: {
    backgroundColor: "#f0fdf4", borderColor: "#a7f3d0",
    borderBottomColor: "#6ee7b7",
    shadowColor: "#10b981", shadowOpacity: 0.1,
  },

  rankBadge: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  rankBadge_gold:   { backgroundColor: "#fef3c7", borderWidth: 1.5, borderColor: "#fcd34d", borderBottomWidth: 3, borderBottomColor: "#f59e0b" },
  rankBadge_bronze: { backgroundColor: "#fff7ed", borderWidth: 1.5, borderColor: "#fdba74", borderBottomWidth: 3, borderBottomColor: "#f97316" },
  rankBadge_plain:  { backgroundColor: "#f1ede4", borderWidth: 1.5, borderColor: "#e5e0d5", borderBottomWidth: 3, borderBottomColor: "#d6d0c7" },
  rankBadge_me:     { backgroundColor: "#d1fae5", borderWidth: 1.5, borderColor: "#6ee7b7", borderBottomWidth: 3, borderBottomColor: "#34d399" },
  rankNum:          { fontSize: 12, fontFamily: F.black },
  rankNum_gold:     { color: "#92400e" },
  rankNum_bronze:   { color: "#7c2d12" },
  rankNum_plain:    { color: "#78716c" },
  rankNum_me:       { color: "#059669" },

  rowAvatar:   { width: 38, height: 38, borderRadius: 12, borderWidth: 2, borderColor: "#ede9e0" },
  rowAvatarMe: { borderColor: "#6ee7b7" },

  rowBody:     { flex: 1, minWidth: 0 },
  rowName:     { color: "#0f172a", fontSize: 13, fontFamily: F.bold },
  rowNameMe:   { color: "#047857" },
  rowStreak:   { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  rowStreakTxt:{ color: "#a8a29e", fontSize: 10, fontFamily: F.semi },

  rowXp:       { alignItems: "flex-end" },
  rowXpVal:    { color: "#0f172a", fontSize: 15, fontFamily: F.black },
  rowXpValMe:  { color: "#047857" },
  rowXpLbl:    { color: "#a8a29e", fontSize: 9, fontFamily: F.bold, marginTop: 1 },

  // ── States
  loader:    { alignItems: "center", paddingVertical: 52, gap: 10 },
  loaderTxt: { color: "#14b8a6", fontSize: 13, fontFamily: F.semi },
  empty:     { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyTxt:  { color: "#94a3b8", fontSize: 13, fontFamily: F.semi },
});

// ── League banner styles ───────────────────────────────────────────────────────
const lb = StyleSheet.create({
  card: {
    marginHorizontal: 12, marginTop: 12,
    borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 16,
    flexDirection: "row", alignItems: "center",
    gap: 12,
    borderBottomWidth: 4,
    shadowColor: "#000", shadowOpacity: 0.18,
    shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  left: {
    flexDirection: "row", alignItems: "center", gap: 10, flex: 1,
  },
  emoji: {
    fontSize: 40,
    textShadowColor: "rgba(0,0,0,0.25)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4,
  },
  ligaLbl: {
    fontSize: 9, fontFamily: F.black, color: "rgba(0,0,0,0.45)", letterSpacing: 1.2,
  },
  ligaName: {
    fontSize: 22, fontFamily: F.black, color: "#fff",
    textShadowColor: "rgba(0,0,0,0.25)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4,
  },
  right: {
    flex: 1, alignItems: "flex-end",
  },
  xpTxt: {
    fontSize: 11, fontFamily: F.black, color: "rgba(0,0,0,0.55)", marginBottom: 5,
  },
  barTrack: {
    width: "100%", height: 9, borderRadius: 5,
    backgroundColor: "rgba(0,0,0,0.18)", overflow: "hidden",
  },
  barFill: {
    height: "100%", borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  nextLbl: {
    fontSize: 10, fontFamily: F.bold, color: "rgba(0,0,0,0.5)", marginTop: 5,
  },
  activePill: {
    position: "absolute", bottom: 10, left: "50%",
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    transform: [{ translateX: -60 }],
  },
  activePillTxt: {
    fontSize: 10, fontFamily: F.bold, color: "#fff",
  },
});
