import { useEffect, useMemo, useState } from "react";
import {
  Alert, FlatList, Image, Modal, RefreshControl,
  ScrollView, StyleSheet, Text, TouchableOpacity,
  View, ActivityIndicator, Dimensions, TextInput,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { generateDicebearUrl, userService, notificationService, authService } from "../../services/api";
import { F } from "../../styles/fonts";
import { computeXpLevel } from "../../utils/xpLevel";

const { width, height: SCREEN_H } = Dimensions.get("window");

const AVATAR_STYLES = [
  "adventurer","adventurer-neutral","avataaars","avataaars-neutral",
  "big-ears","big-ears-neutral","big-smile","beam",
  "bottts","bottts-neutral","croodles","croodles-neutral",
  "dylan","fun-emoji","glass","icons",
  "identicon","lorelei","lorelei-neutral","micah",
  "miniavs","notionists","notionists-neutral","open-peeps",
  "personas","pixel-art","pixel-art-neutral","rings",
  "shapes","skye","thumbs",
];


function normalizeAvatarUrl(url) {
  if (!url) return null;
  if (!url.includes("api.dicebear.com")) return url;
  return url.replace("/svg?","/png?").replace("/svg&","/png&");
}

function joinYear(user) {
  const d = user?.createdAt || user?.joinedAt;
  if (!d) return null;
  return new Date(d).getFullYear();
}

export default function ProfileScreen({ navigation, route }) {
  const { user, logout, refreshUser } = useAuth();
  const insets = useSafeAreaInsets();

  const [xp,           setXp]           = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [pickerOpen,   setPickerOpen]   = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [chosenStyle,  setChosenStyle]  = useState("adventurer");

  const [notifsOpen,   setNotifsOpen]   = useState(false);
  const [notifs,       setNotifs]       = useState([]);
  const [notifsLoading,setNotifsLoading]= useState(false);
  const [unreadCount,  setUnreadCount]  = useState(0);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [expanded,     setExpanded]     = useState(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [firstName,    setFirstName]    = useState("");
  const [lastName,     setLastName]     = useState("");
  const [currentPwd,   setCurrentPwd]   = useState("");
  const [newPwd,       setNewPwd]       = useState("");
  const [confirmPwd,   setConfirmPwd]   = useState("");
  const [deletePwd,    setDeletePwd]    = useState("");
  const [verifSent,    setVerifSent]    = useState(false);
  const [verifLoading, setVerifLoading] = useState(false);

  useEffect(() => { fetchXp(); }, []);
  useEffect(() => { if (route?.params?.openNotifs) openNotifs(); }, [route?.params?.openNotifs]);
  useEffect(() => { setChosenStyle(user?.avatarStyle || "adventurer"); }, [user?.avatarStyle]);

  async function fetchXp() {
    try { const r = await userService.getXp(); setXp(r.data); }
    catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }

  function onRefresh() {
    setRefreshing(true);
    Promise.all([fetchXp(), refreshUser()]).finally(() => setRefreshing(false));
  }

  function confirmLogout() {
    Alert.alert("Dil nga llogaria", "Jeni të sigurt që dëshironi të dilni?", [
      { text:"Anulo", style:"cancel" },
      { text:"Dil", style:"destructive", onPress: logout },
    ]);
  }

  async function pickAvatar(style) {
    if (!user?.id || saving || style === chosenStyle) { setPickerOpen(false); return; }
    setSaving(true);
    try {
      await userService.updateAvatarStyle(style);
      setChosenStyle(style);
      await refreshUser();
      setPickerOpen(false);
    } catch {
      Alert.alert("Gabim", "Nuk mund të përditësohet avatari juaj tani.");
    } finally { setSaving(false); }
  }

  async function openNotifs() {
    setNotifsOpen(true);
    setNotifsLoading(true);
    try {
      const r = await notificationService.getAll({ limit: 50 });
      const data = r?.data?.notifications ?? r?.data ?? [];
      setNotifs(Array.isArray(data) ? data : []);
      const uc = await notificationService.getUnreadCount();
      setUnreadCount(uc?.data?.count ?? 0);
    } catch { setNotifs([]); }
    finally { setNotifsLoading(false); }
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

  function openSettings() {
    setFirstName(user?.emri || user?.firstName || "");
    setLastName(user?.mbiemri || user?.lastName || "");
    setCurrentPwd(""); setNewPwd(""); setConfirmPwd(""); setDeletePwd("");
    setExpanded(null);
    setSettingsOpen(true);
  }

  function toggleExpand(section) {
    setExpanded(prev => prev === section ? null : section);
  }

  async function requestVerification() {
    setVerifLoading(true);
    try {
      await authService.requestVerification();
      setVerifSent(true);
    } catch {
      Alert.alert("Gabim", "Nuk mund të dërgohet email-i i verifikimit tani.");
    } finally { setVerifLoading(false); }
  }

  async function saveName() {
    if (!firstName.trim()) return Alert.alert("Gabim", "Emri nuk mund të jetë bosh");
    setSubmitting(true);
    try {
      await userService.updateProfile({ firstName: firstName.trim(), lastName: lastName.trim() });
      await refreshUser();
      setExpanded(null);
      Alert.alert("Sukses", "Emri u ndryshua me sukses");
    } catch {
      Alert.alert("Gabim", "Nuk mund të ndryshohet emri tani");
    } finally { setSubmitting(false); }
  }

  async function savePassword() {
    if (!currentPwd || !newPwd || !confirmPwd)
      return Alert.alert("Gabim", "Ju lutem plotësoni të gjitha fushat");
    if (newPwd.length < 6)
      return Alert.alert("Gabim", "Fjalëkalimi i ri duhet të ketë të paktën 6 karaktere");
    if (newPwd !== confirmPwd)
      return Alert.alert("Gabim", "Fjalëkalimet e reja nuk përputhen");
    setSubmitting(true);
    try {
      await userService.changePassword(currentPwd, newPwd);
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
      setExpanded(null);
      Alert.alert("Sukses", "Fjalëkalimi u ndryshua me sukses");
    } catch (e) {
      Alert.alert("Gabim", e?.response?.data?.message || "Fjalëkalimi aktual është i gabuar");
    } finally { setSubmitting(false); }
  }

  function confirmDelete() {
    Alert.alert(
      "Fshij Llogarinë",
      "Ky veprim është i pakthyeshëm. Të gjitha të dhënat tuaja do të fshihen përgjithmonë.",
      [
        { text: "Anulo", style: "cancel" },
        { text: "Fshij", style: "destructive", onPress: doDeleteAccount },
      ]
    );
  }

  async function doDeleteAccount() {
    setSubmitting(true);
    try {
      await userService.deleteAccount(deletePwd || undefined);
      await logout();
    } catch (e) {
      Alert.alert("Gabim", e?.response?.data?.message || "Nuk mund të fshihet llogaria tani");
    } finally { setSubmitting(false); }
  }

  const userId       = user?.id || user?._id;
  const avatarSource = normalizeAvatarUrl(user?.avatarUrl)
                    || normalizeAvatarUrl(user?.avatar)
                    || generateDicebearUrl(userId, chosenStyle || user?.avatarStyle || "adventurer");
  const initial   = (user?.emri || user?.firstName || "?")[0]?.toUpperCase() || "?";
  const totalXp   = xp?.data?.totalXp ?? xp?.totalXp ?? user?.xp ?? 0;
  const { xpLevel, xpInCurrentLevel, xpForNextLevel, levelEndXp, levelStartXp, progress: xpLevelProgress } = computeXpLevel(totalXp);

  const fullName  = [user?.emri || user?.firstName, user?.mbiemri || user?.lastName].filter(Boolean).join(" ") || "Nxënës";
  const username  = (user?.email || "").split("@")[0].toUpperCase();
  const year      = joinYear(user);
  const streak    = user?.streakCount ?? 0;
  const level     = user?.level ?? "A1";
  const tests     = user?.completedTests ?? 0;

  const avatarOptions = useMemo(() =>
    AVATAR_STYLES.map(style => ({
      style,
      url: generateDicebearUrl(userId || "preview", style),
    })), [userId]);

  const COLS   = 3;
  const ITEM_W = (width - 32 - 16) / COLS;

  return (
    <View style={s.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
      >
        {/* ── Hero card ── */}
        <View style={[s.hero, { paddingTop: insets.top + 20 }]}>
          {/* Settings + Privacy icons — top right */}
          <View style={s.heroIcons}>
            <TouchableOpacity style={s.topIconBtn} onPress={openSettings} activeOpacity={0.75}>
              <Ionicons name="settings-outline" size={20} color="#0f172a" />
            </TouchableOpacity>
            <TouchableOpacity style={s.topIconBtn} onPress={() => navigation.navigate("PrivacyPolicy")} activeOpacity={0.75}>
              <Ionicons name="document-text-outline" size={20} color="#0f172a" />
            </TouchableOpacity>
          </View>

          {/* Avatar */}
          <TouchableOpacity style={s.avatarWrap} onPress={() => setPickerOpen(true)} activeOpacity={0.88}>
            {avatarSource ? (
              <Image source={{ uri: avatarSource }} style={s.avatarImg} />
            ) : (
              <View style={s.avatarFallback}>
                <Text style={s.avatarInitial}>{initial}</Text>
              </View>
            )}
            <View style={s.editBadge}>
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Ionicons name="color-wand-outline" size={13} color="#fff" />
              }
            </View>
          </TouchableOpacity>

          <Text style={s.heroName}>{fullName}</Text>

          {/* Verification badge */}
          {user?.isVerified ? (
            <View style={s.verifBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#d97706" />
              <Text style={s.verifTxt}>I verifikuar</Text>
            </View>
          ) : (
            <View style={s.verifRow}>
              <View style={s.unverifiedBadge}>
                <Ionicons name="shield-outline" size={14} color="#94a3b8" />
                <Text style={s.unverifiedTxt}>I pa verifikuar</Text>
              </View>
              {!verifSent ? (
                <TouchableOpacity
                  style={s.verifBtn}
                  onPress={requestVerification}
                  disabled={verifLoading}
                  activeOpacity={0.8}
                >
                  {verifLoading
                    ? <ActivityIndicator size="small" color="#0d9488" />
                    : <Text style={s.verifBtnTxt}>Verifiko Email</Text>
                  }
                </TouchableOpacity>
              ) : (
                <View style={s.verifSentBox}>
                  <Ionicons name="checkmark-circle" size={13} color="#10b981" />
                  <Text style={s.verifSentTxt}>Email-i u dërgua!</Text>
                </View>
              )}
            </View>
          )}

          {/* Email box */}
          {user?.email ? (
            <View style={s.emailBox}>
              <Ionicons name="mail-outline" size={14} color="#64748b" />
              <Text style={s.emailTxt} numberOfLines={1}>{user.email}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Overview ── */}
        <Text style={s.sectionLabel}>STATISTIKA</Text>
        <View style={s.overviewGrid}>
          <OverviewItem icon="flame"          color="#f97316" bg="#fff7ed" label="Ditë Radhë"  value={streak === 0 ? "0 ditë" : `${streak} ditë`} />
          <OverviewItem icon="flash"          color="#f59e0b" bg="#fffbeb" label="XP Total"    value={loading ? "..." : `${totalXp} XP`} />
          <OverviewItem icon="school"         color="#8b5cf6" bg="#faf5ff" label="Niveli"      value={level || "A1"} />
          <OverviewItem icon="checkmark-done" color="#10b981" bg="#f0fdf4" label="Testet"      value={tests === 0 ? "Asnjë" : `${tests}`} />
        </View>


        {/* ── XP Level card ── */}
        <Text style={s.sectionLabel}>NIVELI I PËRVOJËS</Text>
        <View style={s.xpLevelCard}>
          <View style={s.xpLevelMeta}>
            <Text style={s.xpLevelName}>Level {xpLevel}</Text>
            <Text style={s.xpLevelNext}>{loading ? "..." : `${levelEndXp.toLocaleString()} XP`}</Text>
          </View>
          <View style={s.xpLevelTrack}>
            <View style={[s.xpLevelFill, { width: `${Math.round(xpLevelProgress * 100)}%` }]} />
          </View>
          <Text style={s.xpLevelHint}>
            {loading ? "" : `${xpForNextLevel} XP deri në Level ${xpLevel + 1}`}
          </Text>
        </View>

        {/* ── Logout ── */}
        <TouchableOpacity style={s.logoutBtn} onPress={confirmLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={18} color="#ef4444" />
          <Text style={s.logoutTxt}>Dil nga llogaria</Text>
        </TouchableOpacity>

        <Text style={s.version}>gjuhagjermane</Text>
        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>

      {/* ── Notifications modal (full screen) ── */}
      <Modal visible={notifsOpen} animationType="slide" transparent={false} onRequestClose={() => setNotifsOpen(false)}>
        <SafeAreaView style={{ flex:1, backgroundColor:"#f8f5f0" }}>
          {/* Header */}
          <View style={st.fullHeader}>
            <TouchableOpacity style={st.backBtn} onPress={() => setNotifsOpen(false)} activeOpacity={0.75}>
              <Ionicons name="chevron-down" size={20} color="#0f172a" />
            </TouchableOpacity>
            <View style={{ flex:1 }}>
              <Text style={st.fullTitle}>Njoftimet</Text>
              <Text style={st.fullSub}>{unreadCount > 0 ? `${unreadCount} të palexuara` : "Të gjitha të lexuara"}</Text>
            </View>
            {unreadCount > 0 && (
              <TouchableOpacity style={n.markAllBtn} onPress={markAllRead} activeOpacity={0.8}>
                <Text style={n.markAllTxt}>Lexo të gjitha</Text>
              </TouchableOpacity>
            )}
          </View>

          {notifsLoading ? (
            <View style={n.center}>
              <ActivityIndicator color="#10b981" size="large" />
              <Text style={n.loadingTxt}>Po ngarkohen njoftimet...</Text>
            </View>
          ) : notifs.length === 0 ? (
            <View style={n.center}>
              <View style={n.emptyIcon}>
                <Ionicons name="notifications-off-outline" size={32} color="#94a3b8" />
              </View>
              <Text style={n.emptyTitle}>Nuk ka njoftime</Text>
              <Text style={n.emptySub}>Njoftimet tuaja do të shfaqen këtu</Text>
              <TouchableOpacity
                style={n.seedBtn}
                activeOpacity={0.8}
                onPress={async () => {
                  try { await notificationService.seedTest(); await openNotifs(); } catch {}
                }}
              >
                <Ionicons name="flask-outline" size={15} color="#8b5cf6" />
                <Text style={n.seedTxt}>Testo Njoftimet</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={notifs}
              keyExtractor={item => item._id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding:16, gap:8 }}
              renderItem={({ item }) => (
                <NotifRow item={item} onRead={() => markRead(item._id)} onDelete={() => deleteNotif(item._id)} />
              )}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* ── Settings modal (full screen) ── */}
      <Modal visible={settingsOpen} animationType="slide" transparent={false} onRequestClose={() => setSettingsOpen(false)}>
        <SafeAreaView style={{ flex:1, backgroundColor:"#f8f5f0" }}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex:1 }}>
            {/* Header */}
            <View style={st.fullHeader}>
              <TouchableOpacity style={st.backBtn} onPress={() => setSettingsOpen(false)} activeOpacity={0.75}>
                <Ionicons name="chevron-down" size={20} color="#0f172a" />
              </TouchableOpacity>
              <View style={{ flex:1 }}>
                <Text style={st.fullTitle}>Cilësimet e Llogarisë</Text>
                <Text style={st.fullSub}>Ndrysho informacionin e llogarisë tënde</Text>
              </View>
            </View>

            <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:16, gap:10, paddingBottom:40 }} showsVerticalScrollIndicator={false}>
              <TouchableOpacity style={st.section} onPress={() => toggleExpand("name")} activeOpacity={0.8}>
                <View style={[st.sectionIcon, { backgroundColor:"#d1fae5" }]}>
                  <Ionicons name="person-outline" size={18} color="#10b981" />
                </View>
                <Text style={st.sectionLabel}>Ndrysho Emrin</Text>
                <Ionicons name={expanded === "name" ? "chevron-up" : "chevron-down"} size={16} color="#94a3b8" />
              </TouchableOpacity>
              {expanded === "name" && (
                <View style={st.form}>
                  <Text style={st.fieldLabel}>Emri</Text>
                  <TextInput style={st.input} value={firstName} onChangeText={setFirstName} placeholder="Emri juaj" placeholderTextColor="#94a3b8" />
                  <Text style={st.fieldLabel}>Mbiemri</Text>
                  <TextInput style={st.input} value={lastName} onChangeText={setLastName} placeholder="Mbiemri juaj" placeholderTextColor="#94a3b8" />
                  <TouchableOpacity style={st.saveBtn} onPress={saveName} disabled={submitting} activeOpacity={0.85}>
                    {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={st.saveBtnTxt}>Ruaj Ndryshimet</Text>}
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity style={st.section} onPress={() => toggleExpand("password")} activeOpacity={0.8}>
                <View style={[st.sectionIcon, { backgroundColor:"#e0f2fe" }]}>
                  <Ionicons name="lock-closed-outline" size={18} color="#0ea5e9" />
                </View>
                <Text style={st.sectionLabel}>Ndrysho Fjalëkalimin</Text>
                <Ionicons name={expanded === "password" ? "chevron-up" : "chevron-down"} size={16} color="#94a3b8" />
              </TouchableOpacity>
              {expanded === "password" && (
                <View style={st.form}>
                  <Text style={st.fieldLabel}>Fjalëkalimi Aktual</Text>
                  <TextInput style={st.input} value={currentPwd} onChangeText={setCurrentPwd} placeholder="••••••••" placeholderTextColor="#94a3b8" secureTextEntry />
                  <Text style={st.fieldLabel}>Fjalëkalimi i Ri</Text>
                  <TextInput style={st.input} value={newPwd} onChangeText={setNewPwd} placeholder="Minimum 6 karaktere" placeholderTextColor="#94a3b8" secureTextEntry />
                  <Text style={st.fieldLabel}>Konfirmo Fjalëkalimin e Ri</Text>
                  <TextInput style={st.input} value={confirmPwd} onChangeText={setConfirmPwd} placeholder="Përsërit fjalëkalimin e ri" placeholderTextColor="#94a3b8" secureTextEntry />
                  <TouchableOpacity style={st.saveBtn} onPress={savePassword} disabled={submitting} activeOpacity={0.85}>
                    {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={st.saveBtnTxt}>Ndrysho Fjalëkalimin</Text>}
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity style={[st.section, st.sectionDanger]} onPress={() => toggleExpand("delete")} activeOpacity={0.8}>
                <View style={[st.sectionIcon, { backgroundColor:"#fee2e2" }]}>
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </View>
                <Text style={[st.sectionLabel, { color:"#ef4444" }]}>Fshij Llogarinë</Text>
                <Ionicons name={expanded === "delete" ? "chevron-up" : "chevron-down"} size={16} color="#ef4444" />
              </TouchableOpacity>
              {expanded === "delete" && (
                <View style={[st.form, st.formDanger]}>
                  <Text style={st.dangerWarning}>
                    Ky veprim është i pakthyeshëm. Të gjitha të dhënat, progresi dhe arritjet tuaja do të fshihen përgjithmonë.
                  </Text>
                  {!user?.googleId && (
                    <>
                      <Text style={st.fieldLabel}>Vendosni fjalëkalimin për konfirmim</Text>
                      <TextInput style={st.input} value={deletePwd} onChangeText={setDeletePwd} placeholder="Fjalëkalimi juaj" placeholderTextColor="#94a3b8" secureTextEntry />
                    </>
                  )}
                  <TouchableOpacity style={st.deleteBtn} onPress={confirmDelete} disabled={submitting} activeOpacity={0.85}>
                    {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={st.deleteBtnTxt}>Fshij Llogarinë Përgjithmonë</Text>}
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* ── Avatar picker modal ── */}
      <Modal visible={pickerOpen} animationType="slide" transparent onRequestClose={() => setPickerOpen(false)}>
        <View style={mo.overlay}>
          <TouchableOpacity style={mo.backdrop} onPress={() => setPickerOpen(false)} activeOpacity={1} />
          <View style={mo.sheet}>
            <View style={mo.handle} />
            <View style={mo.sheetHeader}>
              <View style={{ flex:1 }}>
                <Text style={mo.sheetTitle}>Ndrysho Avatarin</Text>
                <Text style={mo.sheetSub}>Zgjidh një stil të ri për profilin tënd</Text>
              </View>
              <TouchableOpacity style={mo.closeBtn} onPress={() => setPickerOpen(false)} activeOpacity={0.8}>
                <Ionicons name="close" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>
            <View style={{ flex:1 }}>
              <FlatList
                data={avatarOptions}
                keyExtractor={item => item.style}
                numColumns={COLS}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={mo.grid}
                columnWrapperStyle={{ gap:8 }}
                renderItem={({ item }) => {
                  const active = item.style === chosenStyle;
                  return (
                    <TouchableOpacity
                      style={[mo.option, { width: ITEM_W }, active && mo.optionActive]}
                      onPress={() => pickAvatar(item.style)}
                      activeOpacity={0.8}
                      disabled={saving}
                    >
                      {active && (
                        <View style={mo.activeTick}>
                          <Ionicons name="checkmark" size={10} color="#fff" />
                        </View>
                      )}
                      <Image source={{ uri: item.url }} style={mo.optionImg} />
                      <Text style={[mo.optionLbl, active && mo.optionLblActive]} numberOfLines={1}>{item.style}</Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Overview item ─────────────────────────────────────────────────────────────
function OverviewItem({ icon, color, bg, label, value }) {
  return (
    <View style={[ov.cell, { backgroundColor: bg }]}>
      <View style={[ov.iconBox, { backgroundColor: color + "22" }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[ov.value, { color }]}>{value}</Text>
      <Text style={ov.label}>{label}</Text>
    </View>
  );
}

// ── Notification helpers ──────────────────────────────────────────────────────
const ICON_MAP = {
  "bell": "notifications-outline", "trophy": "trophy-outline",
  "book": "book-outline", "book-open": "book-outline",
  "clock": "time-outline", "check-circle": "checkmark-circle-outline",
  "alert-triangle": "warning-outline", "x-circle": "close-circle-outline",
  "message-circle": "chatbubble-outline", "star": "star-outline",
};
const COLOR_MAP = { success:"#10b981", warning:"#f59e0b", error:"#ef4444", info:"#0ea5e9", default:"#8b5cf6" };
const BG_MAP    = { success:"#f0fdf4", warning:"#fffbeb", error:"#fff1f2", info:"#f0f9ff", default:"#faf5ff" };

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Tani";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function NotifRow({ item, onRead, onDelete }) {
  const iconName = ICON_MAP[item.icon] || "notifications-outline";
  const color    = COLOR_MAP[item.color] || COLOR_MAP.default;
  const bg       = BG_MAP[item.color]   || BG_MAP.default;
  return (
    <TouchableOpacity style={[n.row, !item.isRead && n.rowUnread]} onPress={!item.isRead ? onRead : undefined} activeOpacity={0.8}>
      <View style={[n.iconBox, { backgroundColor: bg }]}>
        <Ionicons name={iconName} size={20} color={color} />
      </View>
      <View style={{ flex:1, gap:3 }}>
        <Text style={[n.title, !item.isRead && n.titleUnread]} numberOfLines={1}>{item.title}</Text>
        <Text style={n.message} numberOfLines={2}>{item.message}</Text>
        <Text style={n.time}>{timeAgo(item.createdAt)}</Text>
      </View>
      <View style={{ alignItems:"center", gap:8 }}>
        {!item.isRead && <View style={n.dot} />}
        <TouchableOpacity onPress={onDelete} hitSlop={{ top:8, bottom:8, left:8, right:8 }}>
          <Ionicons name="trash-outline" size={15} color="#cbd5e1" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex:1, backgroundColor:"#f8f5f0" },

  topIconBtn: { width:36, height:36, borderRadius:11, backgroundColor:"#f1ede4", alignItems:"center", justifyContent:"center", position:"relative", borderWidth:1, borderColor:"#ede9e0" },
  bellBadge:  { position:"absolute", top:3, right:3, width:15, height:15, borderRadius:8, backgroundColor:"#ef4444", alignItems:"center", justifyContent:"center", borderWidth:1.5, borderColor:"#fffdf8" },
  bellBadgeTxt: { color:"#fff", fontSize:7, fontFamily:F.black },
  heroIcons:  { position:"absolute", top:12, right:12, flexDirection:"row", gap:8 },

  hero: {
    backgroundColor:"#fffdf8", alignItems:"center", paddingTop:28, paddingBottom:24, paddingHorizontal:20,
    marginHorizontal:16, marginTop:10, marginBottom:4,
    borderRadius:22, borderWidth:1, borderColor:"#ede9e0",
    borderBottomWidth:4, borderBottomColor:"#e2ddd6",
    shadowColor:"#000", shadowOpacity:0.07, shadowRadius:10, shadowOffset:{width:0,height:3}, elevation:4,
    position:"relative",
  },
  avatarWrap: { width:100, height:100, borderRadius:50, borderWidth:3, borderColor:"#fff", marginBottom:14, position:"relative", shadowColor:"#000", shadowOpacity:0.1, shadowRadius:12, shadowOffset:{width:0,height:4}, elevation:6 },
  avatarImg:      { width:"100%", height:"100%", borderRadius:47, backgroundColor:"#fff" },
  avatarFallback: { width:"100%", height:"100%", borderRadius:47, backgroundColor:"#d1fae5", alignItems:"center", justifyContent:"center" },
  avatarInitial:  { color:"#10b981", fontSize:36, fontFamily:F.black },
  editBadge: { position:"absolute", right:-2, bottom:-2, width:28, height:28, borderRadius:14, backgroundColor:"#10b981", alignItems:"center", justifyContent:"center", borderWidth:2.5, borderColor:"#fffdf8" },

  heroName: { color:"#0f172a", fontSize:20, fontFamily:F.black, marginBottom:10 },

  emailBox: { flexDirection:"row", alignItems:"center", gap:7, backgroundColor:"#f1ede4", borderRadius:12, paddingHorizontal:14, paddingVertical:8, borderWidth:1, borderColor:"#ede9e0", marginBottom:10 },
  emailTxt: { color:"#64748b", fontSize:13, fontFamily:F.semi, flexShrink:1 },

  verifBadge:     { flexDirection:"row", alignItems:"center", gap:5, backgroundColor:"#fef3c7", borderRadius:20, paddingHorizontal:12, paddingVertical:6, borderWidth:1, borderColor:"#fde68a", marginBottom:10 },
  verifTxt:       { color:"#d97706", fontSize:12, fontFamily:F.bold },
  verifRow:       { flexDirection:"row", alignItems:"center", gap:8, marginBottom:10 },
  unverifiedBadge:{ flexDirection:"row", alignItems:"center", gap:5, backgroundColor:"#f8fafc", borderRadius:20, paddingHorizontal:12, paddingVertical:6, borderWidth:1, borderColor:"#e2e8f0" },
  unverifiedTxt:  { color:"#94a3b8", fontSize:12, fontFamily:F.bold },
  verifBtn:       { backgroundColor:"#ccfbf1", borderRadius:20, paddingHorizontal:12, paddingVertical:6, borderWidth:1, borderColor:"#99f6e4" },
  verifBtnTxt:    { color:"#0d9488", fontSize:12, fontFamily:F.bold },
  verifSentBox:   { flexDirection:"row", alignItems:"center", gap:4 },
  verifSentTxt:   { color:"#10b981", fontSize:12, fontFamily:F.bold },

  sectionLabel: { color:"#94a3b8", fontSize:11, fontFamily:F.xbold, letterSpacing:1.4, marginLeft:20, marginTop:18, marginBottom:8 },
  overviewGrid: { flexDirection:"row", flexWrap:"wrap", paddingHorizontal:12, gap:8 },

  actionRow:     { flexDirection:"row", paddingHorizontal:16, gap:10, marginBottom:4 },
  actionCard:    { flex:1, backgroundColor:"#fff", borderRadius:18, paddingVertical:16, alignItems:"center", gap:8, borderWidth:1, borderColor:"#ede9e0", shadowColor:"#000", shadowOpacity:0.04, shadowRadius:8, elevation:2 },
  actionIconBox: { width:46, height:46, borderRadius:14, alignItems:"center", justifyContent:"center", position:"relative" },
  actionLabel:   { color:"#1e293b", fontSize:11, fontFamily:F.bold, textAlign:"center" },
  actionBadge:   { position:"absolute", top:-4, right:-4, width:16, height:16, borderRadius:8, backgroundColor:"#ef4444", alignItems:"center", justifyContent:"center", borderWidth:1.5, borderColor:"#fff" },
  actionBadgeTxt:{ color:"#fff", fontSize:8, fontFamily:F.black },

  xpLevelCard:    { marginHorizontal:16, backgroundColor:"#fff", borderRadius:18, padding:16, borderWidth:1, borderColor:"#ede9e0", shadowColor:"#000", shadowOpacity:0.04, shadowRadius:8, elevation:2 },
  xpLevelRow:     { flexDirection:"row", alignItems:"center" },
  xpLevelBadge:   { width:56, height:56, borderRadius:16, backgroundColor:"#fbbf2422", borderWidth:1.5, borderColor:"#fbbf2466", alignItems:"center", justifyContent:"center" },
  xpLevelNum:     { color:"#d97706", fontSize:11, fontFamily:F.black, letterSpacing:0.5 },
  xpLevelMeta:    { flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:8 },
  xpLevelName:    { color:"#0f172a", fontSize:15, fontFamily:F.black },
  xpLevelNext:    { color:"#64748b", fontSize:12, fontFamily:F.bold },
  xpLevelTrack:   { height:8, backgroundColor:"#f1f5f9", borderRadius:6, overflow:"hidden" },
  xpLevelFill:    { height:"100%", backgroundColor:"#fbbf24", borderRadius:6 },
  xpLevelHint:    { color:"#94a3b8", fontSize:11, fontFamily:F.regular, marginTop:6 },

  logoutBtn: { flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8, backgroundColor:"#fff", borderWidth:1.5, borderColor:"#fecaca", borderRadius:16, paddingVertical:14, marginHorizontal:16, marginTop:14, marginBottom:8 },
  logoutTxt: { color:"#ef4444", fontFamily:F.bold, fontSize:14 },
  version:   { color:"#cbd5e1", textAlign:"center", fontSize:12, marginTop:8, fontFamily:F.regular },
});

const ov = StyleSheet.create({
  cell:   { width:(width-32-8)/2, borderRadius:18, padding:16, gap:6, alignItems:"flex-start", borderWidth:1, borderColor:"rgba(0,0,0,0.04)" },
  iconBox:{ width:36, height:36, borderRadius:10, alignItems:"center", justifyContent:"center", marginBottom:2 },
  value:  { fontSize:18, fontFamily:F.black },
  label:  { color:"#94a3b8", fontSize:11, fontFamily:F.bold },
});

const mo = StyleSheet.create({
  overlay: { flex:1, justifyContent:"flex-end", backgroundColor:"transparent" },
  backdrop:{ ...StyleSheet.absoluteFillObject, backgroundColor:"rgba(0,0,0,0.38)" },
  sheet:   { backgroundColor:"#fff", borderTopLeftRadius:28, borderTopRightRadius:28, paddingBottom:36, height:SCREEN_H*0.82 },
  handle:  { width:40, height:4, borderRadius:2, backgroundColor:"#e2e8f0", alignSelf:"center", marginTop:12, marginBottom:8 },
  sheetHeader: { flexDirection:"row", alignItems:"flex-start", justifyContent:"space-between", paddingHorizontal:20, paddingVertical:12, borderBottomWidth:1, borderBottomColor:"#f1f5f9" },
  sheetTitle:  { color:"#0f172a", fontSize:18, fontFamily:F.black, marginBottom:2 },
  sheetSub:    { color:"#94a3b8", fontSize:13, fontFamily:F.regular },
  closeBtn:    { width:34, height:34, borderRadius:10, backgroundColor:"#f8fafc", borderWidth:1, borderColor:"#e2e8f0", alignItems:"center", justifyContent:"center", marginTop:2 },
  grid:        { padding:16, gap:8 },
  option:      { backgroundColor:"#f8fafc", borderRadius:14, borderWidth:1.5, borderColor:"#e2e8f0", paddingVertical:12, paddingHorizontal:6, alignItems:"center", position:"relative" },
  optionActive:{ borderColor:"#10b981", backgroundColor:"#f0fdf4" },
  activeTick:  { position:"absolute", top:-5, right:-5, width:18, height:18, borderRadius:9, backgroundColor:"#10b981", alignItems:"center", justifyContent:"center", borderWidth:2, borderColor:"#fff" },
  optionImg:   { width:56, height:56, borderRadius:28, backgroundColor:"#fff", marginBottom:8 },
  optionLbl:      { color:"#64748b", fontSize:10, fontFamily:F.bold, textAlign:"center" },
  optionLblActive:{ color:"#10b981" },
});

const n = StyleSheet.create({
  center:    { flex:1, alignItems:"center", justifyContent:"center", gap:12 },
  loadingTxt:{ color:"#94a3b8", fontSize:13, fontFamily:F.semi },
  emptyIcon: { width:64, height:64, borderRadius:18, backgroundColor:"#f8fafc", borderWidth:1, borderColor:"#f1f5f9", alignItems:"center", justifyContent:"center" },
  emptyTitle:{ color:"#0f172a", fontSize:16, fontFamily:F.xbold },
  emptySub:  { color:"#94a3b8", fontSize:13, textAlign:"center", fontFamily:F.regular },
  markAllBtn:{ backgroundColor:"#f0fdf4", borderRadius:10, borderWidth:1, borderColor:"#a7f3d0", paddingHorizontal:10, paddingVertical:6, marginRight:8 },
  markAllTxt:{ color:"#059669", fontSize:12, fontFamily:F.bold },
  row:       { flexDirection:"row", alignItems:"flex-start", gap:12, backgroundColor:"#fff", borderRadius:16, padding:14, borderWidth:1, borderColor:"#f1f5f9" },
  rowUnread: { backgroundColor:"#f0f9ff", borderColor:"#bae6fd" },
  iconBox:   { width:42, height:42, borderRadius:13, alignItems:"center", justifyContent:"center" },
  title:       { color:"#64748b", fontSize:13, fontFamily:F.semi },
  titleUnread: { color:"#0f172a", fontFamily:F.xbold },
  message:     { color:"#94a3b8", fontSize:12, lineHeight:17, fontFamily:F.regular },
  time:        { color:"#cbd5e1", fontSize:11, fontFamily:F.semi },
  dot:  { width:8, height:8, borderRadius:4, backgroundColor:"#0ea5e9" },
  seedBtn:{ flexDirection:"row", alignItems:"center", gap:6, backgroundColor:"#faf5ff", borderRadius:12, borderWidth:1, borderColor:"#ddd6fe", paddingHorizontal:16, paddingVertical:10, marginTop:8 },
  seedTxt:{ color:"#8b5cf6", fontSize:13, fontFamily:F.bold },
});

const st = StyleSheet.create({
  fullHeader: { flexDirection:"row", alignItems:"center", gap:12, paddingHorizontal:16, paddingVertical:14, backgroundColor:"#fffdf8", borderBottomWidth:1, borderBottomColor:"#ede9e0" },
  backBtn:    { width:38, height:38, borderRadius:12, backgroundColor:"#f1ede4", alignItems:"center", justifyContent:"center" },
  fullTitle:  { color:"#0f172a", fontSize:18, fontFamily:F.black, marginBottom:1 },
  fullSub:    { color:"#94a3b8", fontSize:12, fontFamily:F.regular },
  section:      { flexDirection:"row", alignItems:"center", gap:12, backgroundColor:"#fff", borderRadius:16, paddingHorizontal:16, paddingVertical:14, borderWidth:1, borderColor:"#f1f5f9", shadowColor:"#000", shadowOpacity:0.04, shadowRadius:6, elevation:1 },
  sectionDanger:{ borderColor:"#fee2e2" },
  sectionIcon:  { width:38, height:38, borderRadius:12, alignItems:"center", justifyContent:"center" },
  sectionLabel: { flex:1, color:"#0f172a", fontFamily:F.bold, fontSize:14 },
  form:         { backgroundColor:"#f8fafc", borderRadius:16, padding:16, borderWidth:1, borderColor:"#f1f5f9", gap:8 },
  formDanger:   { backgroundColor:"#fff5f5", borderColor:"#fecaca" },
  fieldLabel:   { color:"#64748b", fontSize:12, fontFamily:F.bold, marginTop:4 },
  input:        { backgroundColor:"#fff", borderRadius:12, paddingHorizontal:14, paddingVertical:12, borderWidth:1.5, borderColor:"#e2e8f0", color:"#0f172a", fontSize:14, fontFamily:F.semi },
  saveBtn:      { backgroundColor:"#10b981", borderRadius:12, paddingVertical:13, alignItems:"center", marginTop:8 },
  saveBtnTxt:   { color:"#fff", fontFamily:F.xbold, fontSize:14 },
  dangerWarning:{ color:"#b91c1c", fontSize:12, fontFamily:F.semi, lineHeight:18, backgroundColor:"#fee2e2", borderRadius:10, padding:12, marginBottom:4 },
  deleteBtn:    { backgroundColor:"#ef4444", borderRadius:12, paddingVertical:13, alignItems:"center", marginTop:8 },
  deleteBtnTxt: { color:"#fff", fontFamily:F.xbold, fontSize:14 },
});
