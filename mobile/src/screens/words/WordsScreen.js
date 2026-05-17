import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, Animated, Dimensions, FlatList,
  KeyboardAvoidingView, Modal, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage, LANGUAGES } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { wordsService } from "../../services/api";

const LANG_CONFIG = {
  de: { wordLabel: "Fjala Gjermanisht", transLabel: "Përkthimi Shqip", wordPH: "p.sh. das Haus",  transPH: "p.sh. shtëpia", umlauts: true  },
  en: { wordLabel: "Fjala Anglisht",    transLabel: "Përkthimi Shqip", wordPH: "p.sh. house",     transPH: "p.sh. shtëpia", umlauts: false },
  fr: { wordLabel: "Fjala Frëngjisht",  transLabel: "Përkthimi Shqip", wordPH: "p.sh. la maison", transPH: "p.sh. shtëpia", umlauts: false },
  tr: { wordLabel: "Fjala Turqisht",    transLabel: "Përkthimi Shqip", wordPH: "p.sh. ev",        transPH: "p.sh. shtëpia", umlauts: false },
  it: { wordLabel: "Fjala Italisht",    transLabel: "Përkthimi Shqip", wordPH: "p.sh. la casa",   transPH: "p.sh. shtëpia", umlauts: false },
};

const PALETTE = [
  ["#6366f1","#818cf8"], ["#10b981","#34d399"], ["#f59e0b","#fbbf24"],
  ["#ef4444","#f87171"], ["#0ea5e9","#38bdf8"], ["#8b5cf6","#a78bfa"],
  ["#f97316","#fb923c"], ["#14b8a6","#2dd4bf"],
];
const QUIZ_LETTERS = ["A", "B", "C", "D"];

function paletteFor(word) {
  let h = 0;
  for (let i = 0; i < word.length; i++) h = (h * 31 + word.charCodeAt(i)) % PALETTE.length;
  return PALETTE[h];
}

// ── XP Burst overlay ─────────────────────────────────────────────────────────
function XpBurst({ xp, visible }) {
  const scale   = useRef(new Animated.Value(0.4)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0.4);
    opacity.setValue(0);
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale,   { toValue: 1.2, stiffness: 280, damping: 18, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }),
      ]),
      Animated.spring(scale, { toValue: 1, stiffness: 280, damping: 18, useNativeDriver: true }),
      Animated.delay(400),
      Animated.timing(opacity, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start();
  }, [visible, xp]);

  if (!visible) return null;
  return (
    <Animated.View pointerEvents="none" style={[xb.wrap, { opacity, transform: [{ scale }] }]}>
      <LinearGradient colors={["#0f172a","#1e293b"]} style={xb.pill}>
        <Text style={xb.plus}>+{xp}</Text>
        <Text style={xb.label}>XP EARNED!</Text>
      </LinearGradient>
    </Animated.View>
  );
}

const xb = StyleSheet.create({
  wrap:  { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", zIndex: 99 },
  pill:  { alignItems: "center", borderRadius: 28, paddingHorizontal: 36, paddingVertical: 24, borderWidth: 1, borderColor: "rgba(16,185,129,0.4)", shadowColor: "#10b981", shadowOpacity: 0.4, shadowRadius: 24, elevation: 20 },
  plus:  { color: "#34d399", fontSize: 56, fontWeight: "900", lineHeight: 60 },
  label: { color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: "800", letterSpacing: 1.5, marginTop: 4 },
});

// ── WordCard ──────────────────────────────────────────────────────────────────
function WordCard({ item, onEdit, onDelete }) {
  const [c1, c2] = paletteFor(item.word);
  return (
    <View style={s.wordCard}>
      <LinearGradient colors={[c1, c2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.wordAvatar}>
        <Text style={s.wordAvatarTxt}>{item.word[0]?.toUpperCase()}</Text>
      </LinearGradient>
      <View style={s.wordBody}>
        <Text style={s.wordTxt} numberOfLines={1}>{item.word}</Text>
        {!!item.translation && <Text style={s.wordTrans} numberOfLines={1}>{item.translation}</Text>}
        {!!item.notes && <Text style={s.wordNotes} numberOfLines={1}>{item.notes}</Text>}
      </View>
      <View style={s.wordActions}>
        <TouchableOpacity style={s.actionEdit} onPress={() => onEdit(item)} activeOpacity={0.7}>
          <Ionicons name="pencil" size={14} color="#64748b" />
        </TouchableOpacity>
        <TouchableOpacity style={s.actionDel} onPress={() => onDelete(item._id)} activeOpacity={0.7}>
          <Ionicons name="trash" size={14} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── QuizOption ────────────────────────────────────────────────────────────────
function QuizOption({ opt, index, chosen, quizWordId, onPress }) {
  const isChosen  = chosen === opt._id;
  const isCorrect = opt._id === quizWordId;
  let bg = "#fff", border = "#e2e8f0", txtColor = "#1e293b";
  let letterBg = "#f1f5f9", letterTxt = "#64748b";
  if (chosen) {
    if (isCorrect)     { bg = "#f0fdf4"; border = "#10b981"; txtColor = "#065f46"; letterBg = "#10b981"; letterTxt = "#fff"; }
    else if (isChosen) { bg = "#fff1f2"; border = "#ef4444"; txtColor = "#991b1b"; letterBg = "#ef4444"; letterTxt = "#fff"; }
  }
  return (
    <TouchableOpacity style={[s.quizOption, { backgroundColor: bg, borderColor: border }]} onPress={onPress} disabled={!!chosen} activeOpacity={0.8}>
      <View style={[s.quizLetter, { backgroundColor: letterBg }]}>
        <Text style={[s.quizLetterTxt, { color: letterTxt }]}>{QUIZ_LETTERS[index]}</Text>
      </View>
      <Text style={[s.quizOptionTxt, { color: txtColor }]}>{opt.translation || opt.word}</Text>
      {chosen && isCorrect && <Ionicons name="checkmark-circle" size={18} color="#10b981" />}
      {chosen && isChosen && !isCorrect && <Ionicons name="close-circle" size={18} color="#ef4444" />}
    </TouchableOpacity>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function WordsScreen() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const isPaid = user?.isPaid || false;

  const [view, setView]         = useState("list");
  const [words, setWords]       = useState([]);
  const [stats, setStats]       = useState({ totalWords: 0, wordsThisWeek: 0, wordsThisMonth: 0 });
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [showAdd, setShowAdd]   = useState(false);
  const [editWord, setEditWord] = useState(null);

  const [formWord, setFormWord]               = useState("");
  const [formTranslation, setFormTranslation] = useState("");
  const [formNotes, setFormNotes]             = useState("");
  const [saving, setSaving]                   = useState(false);

  const [quizWord, setQuizWord]       = useState(null);
  const [quizOptions, setQuizOptions] = useState([]);
  const [chosen, setChosen]           = useState(null);
  const [xpEarned, setXpEarned]       = useState(0);
  const [streak, setStreak]           = useState(0);
  const [qIndex, setQIndex]           = useState(0);
  const [correct, setCorrect]         = useState(0);
  const [quizDone, setQuizDone]       = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [showXpBurst, setShowXpBurst] = useState(false);
  const [burstXp, setBurstXp]         = useState(0);
  const recentIds = useRef([]);
  const QUIZ_TOTAL = 10;

  useEffect(() => { loadData(); }, [language]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await wordsService.getAll(language);
      const list = Array.isArray(res?.data) ? res.data
        : Array.isArray(res?.data?.data) ? res.data.data : [];
      setWords(list);
    } catch { setWords([]); }
    try {
      const res = await wordsService.getStats(language);
      const d = res?.data?.totalWords != null ? res.data : res?.data?.data ?? {};
      setStats({ totalWords: d.totalWords ?? 0, wordsThisWeek: d.wordsThisWeek ?? 0, wordsThisMonth: d.wordsThisMonth ?? 0 });
    } catch {}
    setLoading(false);
  }

  function openAdd() { setEditWord(null); setFormWord(""); setFormTranslation(""); setFormNotes(""); setShowAdd(true); }
  function openEdit(w) { setEditWord(w); setFormWord(w.word); setFormTranslation(w.translation || ""); setFormNotes(w.notes || ""); setShowAdd(true); }

  async function saveWord() {
    if (!formWord.trim()) { Alert.alert("Gabim", "Ju lutem shkruani fjalën."); return; }
    setSaving(true);
    try {
      const payload = { word: formWord.trim(), translation: formTranslation.trim(), notes: formNotes.trim(), language };
      const extract = (res) => {
        const d = res?.data;
        if (d && typeof d === "object" && !Array.isArray(d) && d._id) return d;
        if (d?.data && d.data._id) return d.data;
        return d;
      };
      if (editWord) {
        const res = await wordsService.update(editWord._id, payload);
        setWords(prev => prev.map(w => w._id === editWord._id ? extract(res) : w));
      } else {
        const res = await wordsService.add(payload);
        setWords(prev => [extract(res), ...prev]);
        setStats(s => ({ ...s, totalWords: s.totalWords + 1, wordsThisWeek: s.wordsThisWeek + 1 }));
      }
      setShowAdd(false);
    } catch (err) { Alert.alert("Gabim", err?.response?.data?.message || "Ndodhi një gabim."); }
    setSaving(false);
  }

  async function deleteWord(id) {
    Alert.alert("Fshi Fjalën", "Jeni të sigurt?", [
      { text: "Anulo", style: "cancel" },
      { text: "Fshi", style: "destructive", onPress: async () => {
        try {
          await wordsService.remove(id);
          setWords(prev => prev.filter(w => w._id !== id));
          setStats(s => ({ ...s, totalWords: Math.max(0, s.totalWords - 1) }));
        } catch { Alert.alert("Gabim", "Nuk mund të fshihet fjala."); }
      }},
    ]);
  }

  function startQuiz() {
    if (!isPaid) { setShowPremium(true); return; }
    if (words.length < 4) { Alert.alert("Jo mjaftueshëm fjalë", "Duhet të paktën 4 fjalë për kuizin."); return; }
    recentIds.current = [];
    setStreak(0); setXpEarned(0); setQIndex(0); setCorrect(0); setQuizDone(false);
    setView("quiz");
    loadQuizWord(words, 0);
  }

  function loadQuizWord(wordList, idx) {
    setChosen(null);
    const pool = wordList ?? words;
    if (pool.length < 4) { setView("list"); return; }
    const available = pool.filter(w => !recentIds.current.includes(w._id));
    const pickFrom  = available.length >= 1 ? available : pool;
    const picked    = pickFrom[Math.floor(Math.random() * pickFrom.length)];
    recentIds.current = [picked._id, ...recentIds.current].slice(0, 5);
    const wrong = pool.filter(w => w._id !== picked._id).sort(() => Math.random() - 0.5).slice(0, 3);
    setQuizWord(picked);
    setQuizOptions([...wrong, picked].sort(() => Math.random() - 0.5));
  }

  async function pickAnswer(opt) {
    if (chosen) return;
    setChosen(opt._id);
    const isCorrect = opt._id === quizWord._id;
    const nextIdx = qIndex + 1;

    if (isCorrect) {
      const ns = streak + 1; setStreak(ns);
      const xp = ns >= 5 ? 15 : ns >= 3 ? 10 : 5;
      setXpEarned(prev => prev + xp);
      setCorrect(prev => prev + 1);
      setBurstXp(xp);
      setShowXpBurst(true);
      setTimeout(() => setShowXpBurst(false), 900);
      try { await wordsService.addQuizXp(xp); } catch {}
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      if (nextIdx >= QUIZ_TOTAL) {
        setQIndex(nextIdx);
        setQuizDone(true);
      } else {
        setQIndex(nextIdx);
        loadQuizWord(null, nextIdx);
      }
    }, isCorrect ? 900 : 1200);
  }

  const filtered = search.trim()
    ? words.filter(w => w.word.toLowerCase().includes(search.toLowerCase()) || (w.translation || "").toLowerCase().includes(search.toLowerCase()))
    : words;

  const langObj = LANGUAGES.find(l => l.code === language);

  // ── QUIZ VIEW ───────────────────────────────────────────────────────────────
  if (view === "quiz") {
    // ── Results screen ──
    if (quizDone) {
      const pct = Math.round((correct / QUIZ_TOTAL) * 100);
      const medal = pct === 100 ? "🏆" : pct >= 70 ? "🥇" : pct >= 40 ? "🥈" : "🥉";
      return (
        <View style={s.root}>
          <View style={s.quizHeader}>
            <TouchableOpacity style={s.backBtn} onPress={() => setView("list")} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={16} color="#0f172a" />
              <Text style={s.backBtnTxt}>Kthehu</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 40, alignItems: "center" }}>
            <View style={s.resultCard}>
              <Text style={s.resultMedal}>{medal}</Text>
              <Text style={s.resultTitle}>Kuizi Përfundoi!</Text>
              <Text style={s.resultSub}>
                {pct >= 70 ? "Punë e shkëlqyer!" : pct >= 40 ? "Vazhdoni të praktikoni!" : "Mos u dorëzoni, praktikoni më shumë!"}
              </Text>

              <View style={s.resultStatsRow}>
                <View style={s.resultStat}>
                  <Text style={s.resultStatVal}>{correct}/{QUIZ_TOTAL}</Text>
                  <Text style={s.resultStatLbl}>Të Sakta</Text>
                </View>
                <View style={s.resultStatDivider} />
                <View style={s.resultStat}>
                  <Text style={[s.resultStatVal, { color: "#fbbf24" }]}>+{xpEarned}</Text>
                  <Text style={s.resultStatLbl}>XP Fituar</Text>
                </View>
                <View style={s.resultStatDivider} />
                <View style={s.resultStat}>
                  <Text style={[s.resultStatVal, { color: "#f97316" }]}>{streak}</Text>
                  <Text style={s.resultStatLbl}>Streak</Text>
                </View>
              </View>

              {/* Score bar */}
              <View style={s.resultBarTrack}>
                <LinearGradient
                  colors={pct >= 70 ? ["#10b981","#34d399"] : pct >= 40 ? ["#f59e0b","#fbbf24"] : ["#ef4444","#f87171"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[s.resultBarFill, { width: `${pct}%` }]}
                />
              </View>
              <Text style={s.resultPct}>{pct}% saktësi</Text>
            </View>

            <TouchableOpacity style={s.playAgainBtn} onPress={() => startQuiz()} activeOpacity={0.85}>
              <LinearGradient colors={["#10b981","#14b8a6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.playAgainGrad}>
                <Ionicons name="refresh" size={18} color="#fff" />
                <Text style={s.playAgainTxt}>Luaj Përsëri</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={s.backListBtn} onPress={() => setView("list")} activeOpacity={0.8}>
              <Text style={s.backListTxt}>Kthehu te lista</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    // ── Active question ──
    return (
      <View style={s.root}>
        <View style={s.quizHeader}>
          <TouchableOpacity style={s.backBtn} onPress={() => setView("list")} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={16} color="#0f172a" />
            <Text style={s.backBtnTxt}>Kthehu</Text>
          </TouchableOpacity>
          <View style={s.quizMeta}>
            <View style={s.streakBadge}>
              <Ionicons name="flame" size={14} color="#f97316" />
              <Text style={s.streakTxt}>{streak}</Text>
            </View>
            <View style={s.xpBadge}>
              <Ionicons name="star" size={13} color="#fbbf24" />
              <Text style={s.xpBadgeTxt}>+{xpEarned} XP</Text>
            </View>
            <View style={s.qCountBadge}>
              <Text style={s.qCountTxt}>{qIndex + 1}/{QUIZ_TOTAL}</Text>
            </View>
          </View>
        </View>

        {/* Progress bar */}
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${((qIndex) / QUIZ_TOTAL) * 100}%` }]} />
        </View>

        {quizWord ? (
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}>
            <View style={s.quizCard}>
              <Text style={s.quizPrompt}>Cila është përkthimi i:</Text>
              <Text style={s.quizWordTxt}>{quizWord.word}</Text>
              {!!quizWord.notes && <Text style={s.quizNotes}>{quizWord.notes}</Text>}
            </View>
            <Text style={s.quizSubLbl}>Zgjidhni përgjigjen e saktë:</Text>
            {quizOptions.map((opt, i) => (
              <QuizOption key={opt._id} opt={opt} index={i} chosen={chosen} quizWordId={quizWord._id} onPress={() => pickAnswer(opt)} />
            ))}
            {streak >= 3 && (
              <View style={s.streakCard}>
                <Ionicons name="flame" size={20} color="#f97316" />
                <Text style={s.streakCardTxt}>{streak} radhë të sakta! +{streak >= 5 ? 15 : 10} XP secila</Text>
              </View>
            )}
          </ScrollView>
        ) : (
          <View style={s.center}><ActivityIndicator color="#10b981" size="large" /></View>
        )}
        <XpBurst xp={burstXp} visible={showXpBurst} />
        <PremiumModal visible={showPremium} onClose={() => setShowPremium(false)} />
      </View>
    );
  }

  // ── LIST VIEW ───────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <FlatList
        data={filtered}
        keyExtractor={item => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        ListHeaderComponent={
          <>
            {/* ── Hero ── */}
            <View style={s.hero}>
              <View style={s.heroTop}>
                <View style={s.heroLeft}>
                  <View style={s.heroIconBox}>
                    <Text style={s.heroFlag}>{langObj?.flag ?? "🌐"}</Text>
                  </View>
                  <View>
                    <Text style={s.heroTitle}>Fjalët e Mia</Text>
                    <Text style={s.heroSub}>{langObj?.name ?? "Gjuhë"} → Shqip</Text>
                  </View>
                </View>
                <TouchableOpacity style={s.quizBtn} onPress={startQuiz} activeOpacity={0.85}>
                  <Ionicons name="game-controller" size={15} color="#fff" />
                  <Text style={s.quizBtnTxt}>Kuiz</Text>
                </TouchableOpacity>
              </View>

              {/* Description */}
              <View style={s.heroDescRow}>
                <Ionicons name="information-circle-outline" size={14} color="#0d9488" />
                <Text style={s.heroDesc}>
                  Këtu mund të ruani dhe praktikoni fjalët tuaja personale në{" "}
                  <Text style={s.heroDescLang}>{langObj?.name ?? "gjuhën e zgjedhur"}</Text>.
                  Shto fjalë të reja, shiko përkthimet dhe testo veten me kuizin.
                </Text>
              </View>

              {/* Stats */}
              <View style={s.statsRow}>
                {[
                  { label: "Gjithsej", val: stats.totalWords,     icon: "library",       color: "#0d9488" },
                  { label: "Kjo javë", val: stats.wordsThisWeek,  icon: "calendar",      color: "#6366f1" },
                  { label: "Ky muaj",  val: stats.wordsThisMonth, icon: "stats-chart",   color: "#f59e0b" },
                ].map(st => (
                  <View key={st.label} style={s.statCard}>
                    <Ionicons name={st.icon} size={14} color={st.color} style={{ marginBottom: 4 }} />
                    <Text style={[s.statVal, { color: st.color }]}>{st.val}</Text>
                    <Text style={s.statLbl}>{st.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* ── Search + add ── */}
            <View style={s.searchRow}>
              <View style={s.searchBox}>
                <Ionicons name="search-outline" size={16} color="#94a3b8" />
                <TextInput
                  style={s.searchInput}
                  placeholder="Kërko fjalë..."
                  placeholderTextColor="#94a3b8"
                  value={search}
                  onChangeText={setSearch}
                />
                {!!search && (
                  <TouchableOpacity onPress={() => setSearch("")}>
                    <Ionicons name="close-circle" size={16} color="#cbd5e1" />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity style={s.addBtn} onPress={openAdd} activeOpacity={0.85}>
                <Ionicons name="add" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            {loading && <View style={s.center}><ActivityIndicator color="#14b8a6" size="large" /></View>}

            {!loading && filtered.length === 0 && (
              <View style={s.emptyCard}>
                <View style={s.emptyIconBox}>
                  <Ionicons name="library-outline" size={30} color="#14b8a6" />
                </View>
                <Text style={s.emptyTitle}>{search ? "Asnjë fjalë nuk u gjet" : "Nuk keni fjalë ende"}</Text>
                <Text style={s.emptySub}>{search ? "Provoni një kërkim tjetër" : "Shtoni fjalën tuaj të parë"}</Text>
                {!search && (
                  <TouchableOpacity style={s.emptyAddBtn} onPress={openAdd} activeOpacity={0.85}>
                    <Ionicons name="add" size={16} color="#fff" />
                    <Text style={s.emptyAddBtnTxt}>Shto Fjalën e Parë</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {!loading && filtered.length > 0 && (
              <View style={s.sectionRow}>
                <Text style={s.sectionLbl}>{filtered.length} FJALË</Text>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => <WordCard item={item} onEdit={openEdit} onDelete={deleteWord} />}
      />

      <AddWordModal
        visible={showAdd} editWord={editWord} language={language}
        formWord={formWord} formTranslation={formTranslation} formNotes={formNotes} saving={saving}
        setFormWord={setFormWord} setFormTranslation={setFormTranslation} setFormNotes={setFormNotes}
        onClose={() => setShowAdd(false)} onSave={saveWord}
      />
      <PremiumModal visible={showPremium} onClose={() => setShowPremium(false)} />
    </View>
  );
}

// ── Add / Edit Modal ──────────────────────────────────────────────────────────
function AddWordModal({ visible, editWord, language, formWord, formTranslation, formNotes, saving,
  setFormWord, setFormTranslation, setFormNotes, onClose, onSave }) {
  const cfg      = LANG_CONFIG[language] ?? LANG_CONFIG.de;
  const langFlag = LANGUAGES.find(l => l.code === language)?.flag ?? "🌐";
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={m.overlay}>
          <TouchableOpacity style={m.backdrop} onPress={onClose} activeOpacity={1} />
          <View style={m.sheet}>
            <View style={m.handle} />
            <View style={m.header}>
              <View style={{ flex: 1 }}>
                <Text style={m.title}>{editWord ? "Ndrysho Fjalën" : "Shto Fjalë të Re"}</Text>
                <Text style={m.headerSub}>{langFlag} {cfg.wordLabel} → 🇦🇱 Shqip</Text>
              </View>
              <TouchableOpacity style={m.closeBtn} onPress={onClose} activeOpacity={0.8}>
                <Ionicons name="close" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
              <View style={m.field}>
                <Text style={m.label}>{cfg.wordLabel} *</Text>
                <TextInput style={m.input} value={formWord} onChangeText={setFormWord} placeholder={cfg.wordPH} placeholderTextColor="#94a3b8" autoCapitalize="none" />
              </View>
              {cfg.umlauts && (
                <View style={m.umlauts}>
                  {["ä","ö","ü","ß","Ä","Ö","Ü"].map(ch => (
                    <TouchableOpacity key={ch} style={m.umlautBtn} onPress={() => setFormWord(prev => prev + ch)} activeOpacity={0.7}>
                      <Text style={m.umlautTxt}>{ch}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <View style={m.field}>
                <Text style={m.label}>{cfg.transLabel}</Text>
                <TextInput style={m.input} value={formTranslation} onChangeText={setFormTranslation} placeholder={cfg.transPH} placeholderTextColor="#94a3b8" />
              </View>
              <View style={m.field}>
                <Text style={m.label}>Shënime (opsionale)</Text>
                <TextInput style={[m.input, m.inputMulti]} value={formNotes} onChangeText={setFormNotes} placeholder="Shënime ose kontekst..." placeholderTextColor="#94a3b8" multiline numberOfLines={3} textAlignVertical="top" />
              </View>
            </ScrollView>
            <View style={m.footer}>
              <TouchableOpacity style={m.cancelBtn} onPress={onClose} activeOpacity={0.8}>
                <Text style={m.cancelTxt}>Anulo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[m.saveBtn, saving && m.saveBtnDisabled]} disabled={saving} onPress={onSave} activeOpacity={0.85}>
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <><Ionicons name={editWord ? "checkmark" : "add"} size={16} color="#fff" /><Text style={m.saveTxt}>{editWord ? "Ruaj" : "Shto Fjalën"}</Text></>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Premium Modal ─────────────────────────────────────────────────────────────
function PremiumModal({ visible, onClose }) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableOpacity style={pm.overlay} onPress={onClose} activeOpacity={1}>
        <TouchableOpacity style={pm.card} activeOpacity={1}>
          <LinearGradient colors={["#0f172a","#1e293b"]} style={pm.topDark}>
            <View style={pm.crownBox}><Ionicons name="game-controller" size={34} color="#fff" /></View>
            <Text style={pm.topTitle}>Kuiz Premium</Text>
            <Text style={pm.topSub}>Kuizi i fjalëve është funksion Premium</Text>
          </LinearGradient>
          <View style={pm.body}>
            {["Testohu me fjalët tuaja","Fitoni XP për çdo përgjigje të saktë","Seria e suksesit (streak) bonus XP","Pa kufizime"].map(p => (
              <View key={p} style={pm.perk}>
                <View style={pm.perkDot}><Ionicons name="checkmark" size={12} color="#fff" /></View>
                <Text style={pm.perkTxt}>{p}</Text>
              </View>
            ))}
            <TouchableOpacity style={pm.upgradeBtn} onPress={onClose} activeOpacity={0.85}>
              <Text style={pm.upgradeTxt}>Shiko Planet Premium</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} activeOpacity={0.8}>
              <Text style={pm.dismissTxt}>Jo tani</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: "#f1f5f9" },
  center: { paddingVertical: 60, alignItems: "center" },

  // Hero
  hero: {
    marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    backgroundColor: "#f0fdfa",
    borderRadius: 22, padding: 16, overflow: "hidden",
    borderWidth: 1, borderColor: "#ccfbf1",
    borderBottomWidth: 5, borderBottomColor: "#99f6e4",
    shadowColor: "#000", shadowOpacity: 0.09, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 7,
  },
  heroTop:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  heroLeft:   { flexDirection: "row", alignItems: "center", gap: 12 },
  heroIconBox:{ width: 46, height: 46, borderRadius: 14, backgroundColor: "#ccfbf1", borderWidth: 1, borderColor: "#99f6e4", alignItems: "center", justifyContent: "center" },
  heroFlag:   { fontSize: 26 },
  heroTitle:  { color: "#0f172a", fontSize: 20, fontWeight: "900", letterSpacing: -0.3 },
  heroSub:    { color: "#0d9488", fontSize: 12, fontWeight: "600", marginTop: 2 },
  heroDescRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 14, backgroundColor: "#ccfbf1", borderRadius: 12, padding: 10 },
  heroDesc:   { flex: 1, color: "#0f766e", fontSize: 12, fontWeight: "500", lineHeight: 18 },
  heroDescLang:{ color: "#0d9488", fontWeight: "800" },

  quizBtn:    { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#0d9488", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 },
  quizBtnTxt: { color: "#fff", fontWeight: "800", fontSize: 13 },

  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: 16, paddingVertical: 14, alignItems: "center",
    borderWidth: 1, borderColor: "#e2e8f0",
    borderBottomWidth: 4, borderBottomColor: "#cbd5e1",
    shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  statVal:  { fontSize: 22, fontWeight: "900", marginBottom: 2 },
  statLbl:  { color: "#64748b", fontSize: 10, fontWeight: "700" },

  // Search
  searchRow:   { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingVertical: 14 },
  searchBox:   { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 11, borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  searchInput: { flex: 1, color: "#0f172a", fontSize: 14, fontWeight: "500" },
  addBtn:      { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#0f172a", shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },

  sectionRow: { paddingHorizontal: 16, paddingBottom: 8 },
  sectionLbl: { color: "#94a3b8", fontSize: 10, fontWeight: "800", letterSpacing: 1.5 },

  // Empty
  emptyCard:    { alignItems: "center", backgroundColor: "#fff", borderRadius: 24, margin: 16, padding: 36, gap: 12, borderWidth: 1, borderColor: "#f1f5f9", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  emptyIconBox: { width: 64, height: 64, borderRadius: 20, backgroundColor: "#f0fdfa", borderWidth: 1, borderColor: "#99f6e4", alignItems: "center", justifyContent: "center" },
  emptyTitle:   { color: "#0f172a", fontSize: 16, fontWeight: "800", textAlign: "center" },
  emptySub:     { color: "#64748b", fontSize: 13, textAlign: "center", lineHeight: 18 },
  emptyAddBtn:  { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#0f172a", borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12, marginTop: 4 },
  emptyAddBtnTxt:{ color: "#fff", fontWeight: "800", fontSize: 14 },

  // Word card
  wordCard:      { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", marginHorizontal: 16, marginBottom: 8, borderRadius: 18, padding: 14, gap: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2, borderWidth: 1, borderColor: "#f1f5f9" },
  wordAvatar:    { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  wordAvatarTxt: { color: "#fff", fontSize: 20, fontWeight: "900" },
  wordBody:      { flex: 1, minWidth: 0 },
  wordTxt:       { color: "#0f172a", fontSize: 15, fontWeight: "800" },
  wordTrans:     { color: "#475569", fontSize: 13, fontWeight: "500", marginTop: 1 },
  wordNotes:     { color: "#94a3b8", fontSize: 11, marginTop: 2 },
  wordActions:   { flexDirection: "row", gap: 6 },
  actionEdit:    { width: 34, height: 34, borderRadius: 10, backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", alignItems: "center", justifyContent: "center" },
  actionDel:     { width: 34, height: 34, borderRadius: 10, backgroundColor: "#fff1f2", borderWidth: 1, borderColor: "#fecaca", alignItems: "center", justifyContent: "center" },

  // Quiz
  quizHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1, borderBottomColor: "#e2e8f0",
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  backBtn:    { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#f1f5f9", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: "#e2e8f0" },
  backBtnTxt: { color: "#0f172a", fontSize: 13, fontWeight: "700" },
  quizMeta:   { flexDirection: "row", gap: 8 },
  streakBadge:{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#fff7ed", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: "#fed7aa" },
  streakTxt:  { color: "#f97316", fontWeight: "800", fontSize: 14 },
  xpBadge:    { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#fffbeb", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: "#fde68a" },
  xpBadgeTxt: { color: "#d97706", fontWeight: "800", fontSize: 13 },
  quizCard: {
    backgroundColor: "#fff", borderRadius: 24, padding: 28, alignItems: "center", marginBottom: 24, gap: 10,
    borderWidth: 1, borderColor: "#e2e8f0",
    borderBottomWidth: 5, borderBottomColor: "#cbd5e1",
    shadowColor: "#000", shadowOpacity: 0.10, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 7,
  },
  quizPrompt:    { color: "#64748b", fontSize: 13, fontWeight: "600" },
  quizWordTxt:   { color: "#0f172a", fontSize: 32, fontWeight: "900", textAlign: "center" },
  quizNotes:     { color: "#475569", fontSize: 13, textAlign: "center" },
  quizSubLbl:    { color: "#64748b", fontSize: 12, fontWeight: "700", marginBottom: 10 },
  quizOption:    { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, borderWidth: 1.5, padding: 14, marginBottom: 10, gap: 12 },
  quizLetter:    { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  quizLetterTxt: { fontSize: 13, fontWeight: "900" },
  quizOptionTxt: { fontSize: 14, fontWeight: "600", flex: 1 },
  streakCard:    { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff7ed", borderRadius: 14, padding: 14, marginTop: 4, borderWidth: 1, borderColor: "#fed7aa" },
  streakCardTxt: { color: "#c2410c", fontWeight: "700", fontSize: 13 },

  // Progress bar
  progressTrack: { height: 4, backgroundColor: "#e2e8f0" },
  progressFill:  { height: 4, backgroundColor: "#10b981", borderRadius: 2 },

  // Question counter badge
  qCountBadge: { backgroundColor: "#f1f5f9", borderRadius: 9, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: "#e2e8f0" },
  qCountTxt:   { color: "#0f172a", fontWeight: "800", fontSize: 12 },

  // Results
  resultCard: {
    width: "100%", backgroundColor: "#fff", borderRadius: 28, padding: 28, alignItems: "center", marginBottom: 20,
    borderWidth: 1, borderColor: "#e2e8f0",
    borderBottomWidth: 5, borderBottomColor: "#cbd5e1",
    shadowColor: "#000", shadowOpacity: 0.10, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 7,
  },
  resultMedal:      { fontSize: 56, marginBottom: 12 },
  resultTitle:      { color: "#0f172a", fontSize: 24, fontWeight: "900", marginBottom: 6 },
  resultSub:        { color: "#64748b", fontSize: 14, textAlign: "center", marginBottom: 24 },
  resultStatsRow:   { flexDirection: "row", alignItems: "center", gap: 0, marginBottom: 24, backgroundColor: "#f8fafc", borderRadius: 18, paddingVertical: 16, paddingHorizontal: 8, width: "100%", borderWidth: 1, borderColor: "#e2e8f0" },
  resultStat:       { flex: 1, alignItems: "center" },
  resultStatVal:    { color: "#0f172a", fontSize: 26, fontWeight: "900" },
  resultStatLbl:    { color: "#94a3b8", fontSize: 10, fontWeight: "700", marginTop: 3 },
  resultStatDivider:{ width: 1, height: 36, backgroundColor: "#e2e8f0" },
  resultBarTrack:   { width: "100%", height: 10, backgroundColor: "#f1f5f9", borderRadius: 5, overflow: "hidden", marginBottom: 8 },
  resultBarFill:    { height: 10, borderRadius: 5 },
  resultPct:        { color: "#94a3b8", fontSize: 12, fontWeight: "700" },

  playAgainBtn:  { width: "100%", borderRadius: 18, overflow: "hidden", marginBottom: 12 },
  playAgainGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16 },
  playAgainTxt:  { color: "#fff", fontWeight: "900", fontSize: 16 },
  backListBtn:   { paddingVertical: 12 },
  backListTxt:   { color: "#64748b", fontWeight: "700", fontSize: 14 },
});

const m = StyleSheet.create({
  overlay:  { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet:    { backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "90%" },
  handle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: "#e2e8f0", alignSelf: "center", marginTop: 12 },
  header:   { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  title:    { color: "#0f172a", fontSize: 18, fontWeight: "900" },
  headerSub:{ color: "#64748b", fontSize: 12, fontWeight: "600", marginTop: 2 },
  closeBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", alignItems: "center", justifyContent: "center" },
  field:    { gap: 6 },
  label:    { color: "#374151", fontSize: 13, fontWeight: "700" },
  input:    { backgroundColor: "#f8fafc", borderRadius: 12, borderWidth: 1.5, borderColor: "#e2e8f0", paddingHorizontal: 14, paddingVertical: 12, color: "#0f172a", fontSize: 14 },
  inputMulti:{ height: 80 },
  umlauts:  { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  umlautBtn:{ backgroundColor: "#f1f5f9", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: "#e2e8f0" },
  umlautTxt:{ color: "#0f0f13", fontWeight: "800", fontSize: 14 },
  footer:   { flexDirection: "row", gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  cancelBtn:{ flex: 1, paddingVertical: 13, borderRadius: 13, borderWidth: 1.5, borderColor: "#e2e8f0", alignItems: "center" },
  cancelTxt:{ color: "#64748b", fontWeight: "700", fontSize: 14 },
  saveBtn:  { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 13, backgroundColor: "#0f172a" },
  saveBtnDisabled:{ opacity: 0.5 },
  saveTxt:  { color: "#fff", fontWeight: "800", fontSize: 14 },
});

const pm = StyleSheet.create({
  overlay:   { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", padding: 24 },
  card:      { backgroundColor: "#fff", borderRadius: 28, width: "100%", overflow: "hidden" },
  topDark:   { padding: 28, alignItems: "center" },
  crownBox:  { width: 70, height: 70, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  topTitle:  { color: "#fff", fontSize: 22, fontWeight: "900", marginBottom: 4 },
  topSub:    { color: "rgba(255,255,255,0.6)", fontSize: 13, textAlign: "center" },
  body:      { padding: 24, gap: 12 },
  perk:      { flexDirection: "row", alignItems: "center", gap: 12 },
  perkDot:   { width: 22, height: 22, borderRadius: 11, backgroundColor: "#0f172a", alignItems: "center", justifyContent: "center" },
  perkTxt:   { color: "#374151", fontSize: 13, fontWeight: "600" },
  upgradeBtn:{ backgroundColor: "#0f172a", borderRadius: 16, paddingVertical: 15, alignItems: "center", marginTop: 8 },
  upgradeTxt:{ color: "#fff", fontWeight: "900", fontSize: 15 },
  dismissTxt:{ color: "#94a3b8", fontSize: 13, textAlign: "center", marginTop: 4 },
});
