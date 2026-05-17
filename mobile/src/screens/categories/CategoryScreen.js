import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator, Animated, Dimensions, FlatList,
  RefreshControl, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from "react-native";
import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { categoryService, ttsService, wordsService } from "../../services/api";
import { useLanguage, LANGUAGES } from "../../context/LanguageContext";
import { F } from "../../styles/fonts";

const { width } = Dimensions.get("window");
const CARD_W = (width - 48) / 2;

const TYPE_COLORS = {
  "Bazat":           { grad:["#38bdf8","#3b82f6"], accent:"#3b82f6" },
  "Numra":           { grad:["#818cf8","#6366f1"], accent:"#6366f1" },
  "Tjera":           { grad:["#a78bfa","#8b5cf6"], accent:"#8b5cf6" },
  "Fraza":           { grad:["#fb7185","#f43f5e"], accent:"#f43f5e" },
  "Koha":            { grad:["#34d399","#10b981"], accent:"#10b981" },
  "Mjedisi":         { grad:["#fbbf24","#f59e0b"], accent:"#f59e0b" },
  "Natyra":          { grad:["#4ade80","#22c55e"], accent:"#22c55e" },
  "Njerëzit":        { grad:["#f472b6","#ec4899"], accent:"#ec4899" },
  "Gramatikë":       { grad:["#f87171","#ef4444"], accent:"#ef4444" },
  "Të Përgjithshme": { grad:["#facc15","#eab308"], accent:"#eab308" },
  "Mbiemra":         { grad:["#e879f9","#d946ef"], accent:"#d946ef" },
  "Vocabulary":      { grad:["#60a5fa","#3b82f6"], accent:"#3b82f6" },
  "Folje":           { grad:["#c084fc","#a855f7"], accent:"#a855f7" },
  "Kulturë":         { grad:["#fb923c","#f97316"], accent:"#f97316" },
  default:           { grad:["#94a3b8","#64748b"], accent:"#64748b" },
};
const ICON_MAP = {
  book:"book", numbers:"calculator", palette:"color-palette",
  handshake:"people", speech:"chatbubbles", calendar:"calendar",
  clock:"time", transport:"car", tree:"leaf", flag:"flag",
  heart:"heart", work:"briefcase", seasons:"snow", family:"people",
  hobbies:"sparkles", food:"restaurant", home:"home", clothes:"shirt",
  shopping:"bag", body:"hand-left", travel:"airplane",
  restaurant:"cafe", nature:"trail-sign", animals:"paw",
  language:"language", default:"folder-open",
};
const LEVEL_COLORS = {
  A1:"#10b981", A2:"#06b6d4", B1:"#8b5cf6",
  B2:"#f59e0b", C1:"#f97316", C2:"#ef4444",
};
const LETTERS = ["A","B","C","D"];
const CORRECT_MSGS = ["Shkëlqyeshëm!","Bravo!","E saktë!","Vazhdoni kështu!"];

function tc(type) { return TYPE_COLORS[type] || TYPE_COLORS.default; }

// ── Streak dot ────────────────────────────────────────────────────────────────
function StreakDot({ state }) {
  const bg = state === "correct" ? "#22c55e"
           : state === "wrong"   ? "#ef4444"
           : state === "current" ? "transparent" : "#e2e8f0";
  const border = state === "current" ? "#14b8a6" : "transparent";
  return (
    <View style={[sq.dot, { backgroundColor:bg, borderColor:border, borderWidth: state==="current" ? 2 : 0 }]} />
  );
}

// ── Answer button ─────────────────────────────────────────────────────────────
function AnswerBtn({ letter, text, state, onPress, disabled }) {
  const scale = useRef(new Animated.Value(1)).current;
  const bg     = state==="correct" ? "#f0fdf4"
               : state==="wrong"   ? "#fef2f2"
               : state==="reveal"  ? "#f0fdf4" : "#fff";
  const border = state==="correct" ? "#22c55e"
               : state==="wrong"   ? "#ef4444"
               : state==="reveal"  ? "#22c55e" : "#e2e8f0";
  const txtCol = state==="correct" ? "#15803d"
               : state==="wrong"   ? "#b91c1c"
               : state==="reveal"  ? "#15803d" : "#1e293b";
  const ltrBg  = state==="correct" ? "#dcfce7"
               : state==="wrong"   ? "#fee2e2"
               : state==="reveal"  ? "#dcfce7" : "#f8fafc";
  const ltrCol = state==="correct" ? "#16a34a"
               : state==="wrong"   ? "#dc2626"
               : state==="reveal"  ? "#16a34a" : "#64748b";

  return (
    <Animated.View style={{ transform:[{scale}] }}>
      <TouchableOpacity
        style={[sq.optBtn, { backgroundColor:bg, borderColor:border }]}
        onPress={() => {
          if (disabled) return;
          Animated.sequence([
            Animated.spring(scale,{toValue:0.96,tension:300,friction:10,useNativeDriver:true}),
            Animated.spring(scale,{toValue:1,  tension:300,friction:10,useNativeDriver:true}),
          ]).start();
          onPress();
        }}
        activeOpacity={disabled ? 1 : 0.8}
        disabled={disabled}
      >
        <View style={[sq.optLetter, { backgroundColor:ltrBg, borderColor:border }]}>
          <Text style={[sq.optLetterText, { color:ltrCol }]}>{letter}</Text>
        </View>
        <Text style={[sq.optText, { color:txtCol }]} numberOfLines={2}>{text}</Text>
        {(state==="correct"||state==="reveal") && (
          <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
        )}
        {state==="wrong" && (
          <Ionicons name="close-circle" size={18} color="#ef4444" />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Kuiz i Përzier ────────────────────────────────────────────────────────────────
function MixedQuiz({ words, onFinish }) {
  const questions = useMemo(() => words.map((w, i) => {
    const wrong = words.filter((_,j) => j!==i)
      .sort(() => Math.random()-0.5).slice(0,3).map(x => x.translation);
    const opts = [w.translation,...wrong].sort(() => Math.random()-0.5);
    return { word:w.word, correctIdx:opts.indexOf(w.translation), options:opts };
  }), []);

  const [idx,      setIdx]     = useState(0);
  const [answers,  setAnswers] = useState({});
  const [history,  setHistory] = useState([]);
  const [streak,   setStreak]  = useState(0);
  const [score,    setScore]   = useState(0);
  const [xp,       setXp]      = useState(0);
  const [done,     setDone]    = useState(false);
  const [comboTxt, setCombo]   = useState("");
  const comboAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const totalQ     = questions.length;
  const q          = questions[idx];
  const submitted  = answers[idx];
  const isAnswered = submitted !== undefined;
  const isCorrect  = isAnswered && submitted === q.correctIdx;
  const isLast     = idx === totalQ - 1;
  const progress   = (idx + 1) / totalQ;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [idx]);

  function showCombo(text) {
    setCombo(text);
    comboAnim.setValue(0);
    Animated.sequence([
      Animated.spring(comboAnim, { toValue:1, tension:80, friction:8, useNativeDriver:true }),
      Animated.delay(1800),
      Animated.timing(comboAnim, { toValue:0, duration:260, useNativeDriver:true }),
    ]).start();
  }

  function pick(optIdx) {
    if (isAnswered) return;
    const correct   = optIdx === q.correctIdx;
    const newStreak = correct ? streak + 1 : 0;
    const newHist   = [...history];
    newHist[idx]    = correct;
    setAnswers(prev => ({ ...prev, [idx]:optIdx }));
    setHistory(newHist);
    setStreak(newStreak);
    if (correct) {
      setScore(s => s + (newStreak > 2 ? 2 : 1));
      if (newStreak > 2) showCombo(`${newStreak} Rreshte Saktë!`);
    }
    if (!isLast) {
      setTimeout(() => setIdx(i => i + 1), 900);
    }
  }

  function submitFinal() {
    const correctCount = history.filter(Boolean).length;
    const pct = Math.round((correctCount / totalQ) * 100);
    if (pct >= 80) {
      const earned = 15;
      setXp(earned);
      wordsService.addQuizXp(earned).catch(() => {});
    }
    setDone(true);
  }

  // Result screen
  if (done) {
    const correct = history.filter(Boolean).length;
    const pct     = Math.round((correct / totalQ) * 100);
    const passed  = pct >= 60;
    return (
      <SafeAreaView style={sq.root} edges={["bottom"]}>
        <View style={sq.resultWrap}>
          <LinearGradient
            colors={passed ? ["#34d399","#14b8a6"] : ["#fbbf24","#f97316"]}
            style={sq.resultIcon}
          >
            <Ionicons name="trophy" size={40} color="#fff" />
          </LinearGradient>
          <Text style={sq.resultTitle}>{passed ? "Urime!" : "Vazhdo të Praktikosh!"}</Text>
          <Text style={sq.resultSub}>
            {passed ? "Shkëlqyeshëm, e kaluat quiz-in!" : "Provoni përsëri për rezultat më të mirë"}
          </Text>
          <View style={sq.statsRow}>
            <View style={sq.statBox}>
              <Text style={[sq.statVal, { color: passed?"#14b8a6":"#f97316" }]}>{pct}%</Text>
              <Text style={sq.statLbl}>Rezultati</Text>
            </View>
            <View style={sq.statBox}>
              <Text style={[sq.statVal, { color: passed?"#14b8a6":"#f97316" }]}>{correct}/{totalQ}</Text>
              <Text style={sq.statLbl}>Të sakta</Text>
            </View>
            {xp > 0 && (
              <View style={[sq.statBox, sq.statXp]}>
                <Text style={[sq.statVal, { color:"#d97706" }]}>+{xp}</Text>
                <Text style={[sq.statLbl, { color:"#b45309" }]}>XP Fituar</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[sq.doneBtn, { backgroundColor: passed?"#14b8a6":"#f97316" }]}
            onPress={onFinish}
            activeOpacity={0.85}
          >
            <Text style={sq.doneBtnTxt}>Kthehu te Kategoritë</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={sq.root} edges={["bottom"]}>
      {/* Combo toast */}
      <Animated.View pointerEvents="none" style={[sq.combo, {
        opacity: comboAnim,
        transform:[{ translateY: comboAnim.interpolate({ inputRange:[0,1], outputRange:[-30,0] }) }],
      }]}>
        <LinearGradient colors={["#f97316","#fbbf24"]} style={sq.comboGrad}>
          <Ionicons name="flame" size={14} color="#fff" />
          <Text style={sq.comboTxt}>{comboTxt}</Text>
        </LinearGradient>
      </Animated.View>

      <ScrollView
        contentContainerStyle={sq.body}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={sq.topBar}>
          <TouchableOpacity style={sq.backBtn} onPress={onFinish} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={16} color="#64748b" />
            <Text style={sq.backTxt}>Mbrapa</Text>
          </TouchableOpacity>
          <View style={{ flex:1 }} />
          <View style={sq.mixBadge}>
            <Ionicons name="shuffle" size={13} color="#6366f1" />
            <Text style={sq.mixBadgeTxt}>Kuiz i Përzier</Text>
          </View>
        </View>

        {/* Progress */}
        <View style={sq.progressSection}>
          <View style={sq.progressLabels}>
            <Text style={sq.progressLeft}>Pyetja {idx+1} nga {totalQ}</Text>
            <Text style={sq.progressRight}>{Math.round(progress*100)}%</Text>
          </View>
          <View style={sq.progressTrack}>
            <Animated.View style={[sq.progressFill, {
              width: progressAnim.interpolate({ inputRange:[0,1], outputRange:["0%","100%"] }),
            }]} />
          </View>
        </View>

        {/* Streak dots */}
        <View style={sq.dotsRow}>
          {Array.from({ length: totalQ }, (_,i) => (
            <StreakDot
              key={i}
              state={history[i]===true ? "correct" : history[i]===false ? "wrong" : i===idx ? "current" : "idle"}
            />
          ))}
        </View>

        {/* Question card */}
        <View style={sq.card}>
          <LinearGradient colors={["#6366f1","#818cf8"]} style={sq.cardAccent} />
          <Text style={sq.qLabel}>PYETJA {String(idx+1).padStart(2,"0")}</Text>
          <Text style={sq.qWord}>{q.word}</Text>
          <View style={sq.options}>
            {q.options.map((opt, i) => {
              let state = "idle";
              if (isAnswered) {
                if (i === q.correctIdx && submitted === i) state = "correct";
                else if (i === submitted && submitted !== q.correctIdx) state = "wrong";
                else if (i === q.correctIdx) state = "reveal";
              }
              return (
                <AnswerBtn
                  key={i}
                  letter={LETTERS[i]}
                  text={opt}
                  state={state}
                  disabled={isAnswered}
                  onPress={() => pick(i)}
                />
              );
            })}
          </View>
        </View>

        {/* Feedback bar */}
        {isAnswered && (
          <View style={[sq.feedback, {
            backgroundColor: isCorrect ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
            borderColor:     isCorrect ? "rgba(34,197,94,0.4)"  : "rgba(239,68,68,0.4)",
          }]}>
            <Ionicons
              name={isCorrect ? "checkmark-circle" : "close-circle"}
              size={22}
              color={isCorrect ? "#22c55e" : "#ef4444"}
            />
            <View style={{ flex:1 }}>
              <Text style={[sq.fbTitle, { color: isCorrect?"#16a34a":"#dc2626" }]}>
                {isCorrect ? "Saktë!" : "Gabim!"}
              </Text>
              <Text style={[sq.fbSub, { color: isCorrect?"#15803d":"#b91c1c" }]}>
                {isCorrect
                  ? CORRECT_MSGS[idx % 4]
                  : `Përgjigja: "${q.options[q.correctIdx]}"`}
              </Text>
            </View>
            {isLast && (
              <TouchableOpacity style={sq.submitBtn} onPress={submitFinal} activeOpacity={0.85}>
                <Ionicons name="trophy" size={14} color="#fff" />
                <Text style={sq.submitBtnTxt}>Dërgo</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Category card ─────────────────────────────────────────────────────────────
function CategoryCard({ item, isFinished, onPress, index }) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;
  const scale      = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const delay = Math.min(index,14)*35;
    Animated.parallel([
      Animated.timing(opacity,    { toValue:1, duration:300, delay, useNativeDriver:true }),
      Animated.spring(translateY, { toValue:0, delay, tension:70, friction:11, useNativeDriver:true }),
    ]).start();
  }, []);

  const c      = tc(item.type);
  const icon   = ICON_MAP[item.icon] || ICON_MAP.default;
  const lvCol  = LEVEL_COLORS[item.level] || "#10b981";

  return (
    <Animated.View style={{ opacity, transform:[{translateY},{scale}], width:CARD_W, marginBottom:12 }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn ={() => Animated.spring(scale,{toValue:0.96,tension:220,friction:10,useNativeDriver:true}).start()}
        onPressOut={() => Animated.spring(scale,{toValue:1,  tension:220,friction:10,useNativeDriver:true}).start()}
        activeOpacity={1}
        style={s.card}
      >
        <View style={[s.cardTop, { backgroundColor: c.accent+"15" }]}>
          <LinearGradient colors={c.grad} style={s.cardIcon}>
            <Ionicons name={icon} size={20} color="#fff" />
          </LinearGradient>
          {isFinished && <Ionicons name="checkmark-circle" size={16} color="#10b981" />}
        </View>
        <View style={s.cardBody}>
          <Text style={s.cardName} numberOfLines={2}>{item.category}</Text>
          <View style={[s.lvBadge, { backgroundColor:lvCol+"18", borderColor:lvCol+"44" }]}>
            <Text style={[s.lvBadgeTxt, { color:lvCol }]}>{item.level}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Word row ──────────────────────────────────────────────────────────────────
function WordRow({ word, index, isPlaying, isLoadingAudio, onPlay }) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-14)).current;

  useEffect(() => {
    const delay = Math.min(index,18)*28;
    Animated.parallel([
      Animated.timing(opacity,    { toValue:1, duration:260, delay, useNativeDriver:true }),
      Animated.timing(translateX, { toValue:0, duration:260, delay, useNativeDriver:true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform:[{translateX}] }}>
      <View style={s.wordRow}>
        <View style={s.wordRowTop}>
          <View style={s.wordNum}>
            <Text style={s.wordNumTxt}>{index+1}</Text>
          </View>
          <View style={s.wordBody}>
            <Text style={s.wordDe}>{word.word}</Text>
            <Text style={s.wordAl}>{word.translation}</Text>
          </View>
          <TouchableOpacity
            style={[s.audioBtn, isPlaying && s.audioBtnOn]}
            onPress={() => onPlay(word, index)}
            activeOpacity={0.75}
          >
            {isLoadingAudio
              ? <ActivityIndicator size="small" color="#10b981" />
              : <Ionicons name={isPlaying ? "volume-high" : "volume-medium-outline"} size={16} color={isPlaying ? "#fff" : "#10b981"} />
            }
          </TouchableOpacity>
        </View>
        {!!word.examples?.[0] && (
          <Text style={s.wordEx}>{word.examples[0].replace(/\s*\(/g, " - ").replace(/\)/g, "").trim()}</Text>
        )}
      </View>
    </Animated.View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function CategoryScreen() {
  const { language } = useLanguage();

  const [categories,      setCategories]     = useState([]);
  const [finishedIds,     setFinishedIds]     = useState([]);
  const [selected,        setSelected]        = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [detailLoading,   setDetailLoading]   = useState(false);
  const [refreshing,      setRefreshing]      = useState(false);
  const [finishing,       setFinishing]       = useState(false);
  const [xpToast,         setXpToast]         = useState(null);
  const [playingIdx,      setPlayingIdx]      = useState(null);
  const [loadingAudioIdx, setLoadingAudioIdx] = useState(null);
  const [mixedQuiz,       setMixedQuiz]       = useState(null);
  const [quizLoading,     setQuizLoading]     = useState(false);
  const [filter,          setFilter]          = useState("all"); // "all" | "finished"

  const soundRef  = useRef(null);
  const toastAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { fetchAll(); }, [language]);
  useEffect(() => () => stopAudio(), []);

  async function fetchAll() {
    try {
      setLoading(true);
      const [catRes, finRes] = await Promise.allSettled([
        categoryService.getAll({ limit:200 }, language),
        categoryService.getFinished(language),
      ]);
      if (catRes.status === "fulfilled") {
        const d = catRes.value?.data ?? catRes.value;
        setCategories(Array.isArray(d) ? d : (d?.data ?? d?.categories ?? []));
      }
      if (finRes.status === "fulfilled") {
        const d = finRes.value?.data ?? finRes.value;
        setFinishedIds(d?.finishedCategoryIds ?? []);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function openCategory(item) {
    try {
      setDetailLoading(true);
      stopAudio();
      const res = await categoryService.getById(item._id);
      const d   = res?.data?.data ?? res?.data ?? res;
      setSelected({
        _id:         item._id,
        category:    item.category,
        level:       d.level       ?? item.level       ?? "A1",
        type:        d.type        ?? item.type        ?? "other",
        description: d.description ?? item.description ?? "",
        words:       d.words       ?? [],
      });
    } catch {
      setSelected({ ...item, words:[] });
    } finally {
      setDetailLoading(false);
    }
  }

  async function finishCategory() {
    if (!selected || finishing) return;
    try {
      setFinishing(true);
      const res = await categoryService.finish(selected._id);
      const d   = res?.data ?? res;
      setFinishedIds(prev => [...prev, selected._id]);
      showXpToast(d?.xpGained ?? 10);
    } catch { /* already finished */ }
    finally { setFinishing(false); }
  }

  function showXpToast(xp) {
    setXpToast(xp);
    toastAnim.setValue(0);
    Animated.sequence([
      Animated.spring(toastAnim, { toValue:1, tension:80, friction:8, useNativeDriver:true }),
      Animated.delay(1800),
      Animated.timing(toastAnim, { toValue:0, duration:300, useNativeDriver:true }),
    ]).start(() => setXpToast(null));
  }

  async function startMixedQuiz() {
    if (finishedIds.length < 2) return;
    try {
      setQuizLoading(true);
      const res  = await categoryService.getFinishedWords(language);
      const d    = res?.data ?? res;
      const all  = (d?.words ?? d?.data?.words ?? []).filter(w => w.word && w.translation);
      const picked = [...all].sort(() => Math.random()-0.5).slice(0,10);
      setMixedQuiz(picked);
    } catch { /* silent */ }
    finally { setQuizLoading(false); }
  }

  function stopAudio() {
    if (soundRef.current) { soundRef.current.unloadAsync(); soundRef.current = null; }
    setPlayingIdx(null);
    setLoadingAudioIdx(null);
  }

  async function playAudio(word, index) {
    if (playingIdx === index) { stopAudio(); return; }
    stopAudio();
    try {
      setLoadingAudioIdx(index);
      const url = await ttsService.getCategoryAudio(selected._id, index, word.word, selected.level, language);
      if (!url) return;
      await Audio.setAudioModeAsync({ playsInSilentModeIOS:true });
      const { sound } = await Audio.Sound.createAsync({ uri:url }, { shouldPlay:true });
      soundRef.current = sound;
      setPlayingIdx(index);
      sound.setOnPlaybackStatusUpdate(st => {
        if (st.didJustFinish) { setPlayingIdx(null); soundRef.current = null; }
      });
    } catch { setPlayingIdx(null); }
    finally  { setLoadingAudioIdx(null); }
  }

  const isFinished = id => finishedIds.includes(id);

  // ── Mixed quiz active ────────────────────────────────────────────────────────
  if (mixedQuiz) {
    return <MixedQuiz words={mixedQuiz} onFinish={() => setMixedQuiz(null)} />;
  }

  // ── Detail view ──────────────────────────────────────────────────────────────
  if (selected) {
    const c        = tc(selected.type);
    const finished = isFinished(selected._id);

    return (
      <SafeAreaView style={s.root} edges={["bottom"]}>
        {xpToast != null && (
          <Animated.View pointerEvents="none" style={[s.xpToast, {
            opacity: toastAnim,
            transform:[{ scale: toastAnim.interpolate({ inputRange:[0,1], outputRange:[0.7,1] }) }],
          }]}>
            <Ionicons name="star" size={15} color="#fbbf24" />
            <Text style={s.xpToastTxt}>+{xpToast} XP</Text>
          </Animated.View>
        )}

        <LinearGradient colors={c.grad} style={s.detailHeader}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => { stopAudio(); setSelected(null); }}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={s.detailTitle} numberOfLines={3}>{selected.category}</Text>
          <View style={s.detailMeta}>
            <View style={s.whiteBadge}>
              <Text style={s.whiteBadgeTxt}>{selected.level}</Text>
            </View>
            <Text style={s.detailCount}>{selected.words.length} fjalë</Text>
            {finished && (
              <View style={s.doneBadge}>
                <Ionicons name="checkmark-circle" size={12} color="#fff" />
                <Text style={s.doneBadgeTxt}>Përfunduar</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {detailLoading ? (
          <ActivityIndicator color="#10b981" size="large" style={{ marginTop:40 }} />
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingHorizontal:16, paddingTop:12, paddingBottom: finished ? 40 : 110 }}
            showsVerticalScrollIndicator={false}
          >
            {selected.words.map((word, i) => (
              <WordRow
                key={i} word={word} index={i}
                isPlaying={playingIdx === i}
                isLoadingAudio={loadingAudioIdx === i}
                onPlay={playAudio}
              />
            ))}
            {selected.words.length === 0 && (
              <View style={s.empty}>
                <Ionicons name="document-outline" size={40} color="#cbd5e1" />
                <Text style={s.emptyTxt}>Nuk ka fjalë</Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* Finish button */}
        {!finished && selected.words.length > 0 && (
          <View style={s.finishBar}>
            <TouchableOpacity
              style={[s.finishBtn, finishing && { opacity:0.6 }]}
              onPress={finishCategory}
              disabled={finishing}
              activeOpacity={0.85}
            >
              <LinearGradient colors={["#10b981","#059669"]} style={s.finishBtnGrad}>
                {finishing
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <>
                      <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                      <Text style={s.finishBtnTxt}>Shëno si Përfunduar  •  +10 XP</Text>
                    </>
                }
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────────
  const canMixed    = finishedIds.length >= 2;
  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];
  const remaining   = categories.length - finishedIds.length;
  const visibleCats = filter === "finished"
    ? categories.filter(c => finishedIds.includes(c._id))
    : categories;

  return (
    <SafeAreaView style={s.root} edges={["bottom"]}>
      {/* ── Header ── */}
      <LinearGradient
        colors={["#f0f9ff", "#e0f2fe", "#f8fafc"]}
        start={{ x:0, y:0 }} end={{ x:1, y:1 }}
        style={s.hero}
      >
        {/* Title row */}
        <View style={s.heroTop}>
          <View style={{ flex:1 }}>
            <Text style={s.heroTitle}>Kategoritë</Text>
            <Text style={s.heroSub}>Mëso fjalë të reja sipas temave</Text>
          </View>
          <View style={s.langChip}>
            <Ionicons name="globe-outline" size={12} color="#0ea5e9" />
            <Text style={s.langChipTxt}>{currentLang.name}</Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={s.heroStats}>
          <View style={s.heroStat}>
            <View style={[s.heroStatIcon, { backgroundColor:"#e0f2fe" }]}>
              <Ionicons name="folder-open-outline" size={14} color="#0ea5e9" />
            </View>
            <View>
              <Text style={s.heroStatVal}>{categories.length}</Text>
              <Text style={s.heroStatLbl}>Kategori</Text>
            </View>
          </View>
          <View style={s.heroStatDivider} />
          <View style={s.heroStat}>
            <View style={[s.heroStatIcon, { backgroundColor:"#f0fdf4" }]}>
              <Ionicons name="checkmark-circle-outline" size={14} color="#10b981" />
            </View>
            <View>
              <Text style={[s.heroStatVal, { color:"#10b981" }]}>{finishedIds.length}</Text>
              <Text style={s.heroStatLbl}>Përfunduar</Text>
            </View>
          </View>
          <View style={s.heroStatDivider} />
          <View style={s.heroStat}>
            <View style={[s.heroStatIcon, { backgroundColor:"#fff7ed" }]}>
              <Ionicons name="time-outline" size={14} color="#f97316" />
            </View>
            <View>
              <Text style={[s.heroStatVal, { color:"#f97316" }]}>{remaining}</Text>
              <Text style={s.heroStatLbl}>Mbetur</Text>
            </View>
          </View>
        </View>

        {/* Action row: filter + mix quiz */}
        <View style={s.actionRow}>
          {/* Filter button */}
          <TouchableOpacity
            style={[s.filterBtn, filter === "finished" && s.filterBtnActive]}
            onPress={() => setFilter(f => f === "all" ? "finished" : "all")}
            activeOpacity={0.8}
          >
            <Ionicons
              name={filter === "finished" ? "checkmark-done" : "filter-outline"}
              size={14}
              color={filter === "finished" ? "#fff" : "#6366f1"}
            />
            <Text style={[s.filterBtnTxt, filter === "finished" && { color:"#fff" }]}>
              {filter === "finished" ? "Të Gjitha" : "Filtro"}
            </Text>
          </TouchableOpacity>

          {/* Mix Quiz button */}
          <TouchableOpacity
            style={[s.mixBtn, !canMixed && { opacity:0.45 }]}
            onPress={startMixedQuiz}
            disabled={!canMixed || quizLoading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={canMixed ? ["#6366f1","#4f46e5"] : ["#94a3b8","#8ca4b8"]}
              start={{ x:0, y:0 }} end={{ x:1, y:0 }}
              style={s.mixBtnGrad}
            >
              {quizLoading
                ? <ActivityIndicator size="small" color="#fff" />
                : <>
                    <View style={s.mixBtnIcon}>
                      <Ionicons name="shuffle" size={14} color={canMixed ? "#a5b4fc" : "#e2e8f0"} />
                    </View>
                    <Text style={s.mixBtnTxt}>Kuiz i Përzier</Text>
                    {canMixed && (
                      <View style={s.mixBtnBadge}>
                        <Text style={s.mixBtnBadgeTxt}>+15 XP</Text>
                      </View>
                    )}
                  </>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {!canMixed && (
          <View style={s.heroHint}>
            <Ionicons name="lock-closed-outline" size={11} color="#94a3b8" />
            <Text style={s.heroHintTxt}>Përfundo 2 kategori për të zhbllokuar Kuizin e Përzier</Text>
          </View>
        )}
      </LinearGradient>

      {loading ? (
        <ActivityIndicator color="#10b981" size="large" style={{ marginTop:40 }} />
      ) : (
        <FlatList
          data={visibleCats}
          keyExtractor={item => item._id}
          numColumns={2}
          columnWrapperStyle={{ gap:12, paddingHorizontal:16 }}
          contentContainerStyle={{ paddingTop:12, paddingBottom:40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} tintColor="#10b981" />
          }
          renderItem={({ item, index }) => (
            <CategoryCard item={item} index={index} isFinished={isFinished(item._id)} onPress={() => openCategory(item)} />
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name={filter === "finished" ? "checkmark-done-circle-outline" : "folder-open-outline"} size={48} color="#cbd5e1" />
              <Text style={s.emptyTxt}>
                {filter === "finished" ? "Nuk keni përfunduar asnjë kategori" : "Nuk u gjetën kategori"}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex:1, backgroundColor:"#f8fafc" },

  // Header
  hero: {
    paddingHorizontal:18, paddingTop:16, paddingBottom:18,
    borderBottomWidth:1, borderBottomColor:"#e0f2fe",
  },
  heroTop: {
    flexDirection:"row", alignItems:"flex-start",
    justifyContent:"space-between", marginBottom:14,
  },
  heroTitle: { color:"#0f172a", fontSize:28, fontFamily:F.black, marginBottom:2 },
  heroSub:   { color:"#64748b", fontSize:13, fontFamily:F.regular },
  langChip: {
    flexDirection:"row", alignItems:"center", gap:5,
    backgroundColor:"#e0f2fe", borderRadius:20, borderWidth:1,
    borderColor:"#bae6fd", paddingHorizontal:11, paddingVertical:6, marginTop:4,
  },
  langChipTxt: { color:"#0369a1", fontSize:12, fontFamily:F.bold },

  heroStats: {
    flexDirection:"row", alignItems:"center",
    backgroundColor:"rgba(255,255,255,0.85)", borderRadius:16, padding:14,
    borderWidth:1, borderColor:"#e0f2fe",
    marginBottom:12,
    shadowColor:"#0ea5e9", shadowOpacity:0.06, shadowRadius:8,
    shadowOffset:{ width:0, height:2 }, elevation:2,
  },
  heroStat:        { flex:1, flexDirection:"row", alignItems:"center", gap:8 },
  heroStatDivider: { width:1, height:32, backgroundColor:"#e0f2fe", marginHorizontal:4 },
  heroStatIcon:    { width:30, height:30, borderRadius:9, alignItems:"center", justifyContent:"center" },
  heroStatVal:     { color:"#1e293b", fontSize:16, fontFamily:F.black },
  heroStatLbl:     { color:"#94a3b8", fontSize:10, fontFamily:F.xbold, letterSpacing:0.3 },

  // Action row
  actionRow: { flexDirection:"row", gap:10, marginBottom:10 },
  filterBtn: {
    flexDirection:"row", alignItems:"center", gap:6,
    backgroundColor:"rgba(255,255,255,0.9)", borderRadius:12, borderWidth:1.5,
    borderColor:"#c7d2fe", paddingHorizontal:14, paddingVertical:10,
  },
  filterBtnActive: { backgroundColor:"#6366f1", borderColor:"#6366f1" },
  filterBtnTxt:  { color:"#6366f1", fontSize:13, fontFamily:F.bold },

  mixBtn:     { flex:1, borderRadius:14, overflow:"hidden" },
  mixBtnGrad: {
    flexDirection:"row", alignItems:"center", justifyContent:"center",
    gap:8, paddingHorizontal:14, paddingVertical:11,
  },
  mixBtnIcon: {
    width:24, height:24, borderRadius:7,
    backgroundColor:"rgba(255,255,255,0.15)",
    alignItems:"center", justifyContent:"center",
  },
  mixBtnTxt:      { color:"#fff", fontSize:13, fontFamily:F.xbold, flex:1 },
  mixBtnBadge:    {
    backgroundColor:"rgba(255,255,255,0.2)", borderRadius:8,
    paddingHorizontal:7, paddingVertical:2,
  },
  mixBtnBadgeTxt: { color:"#fff", fontSize:10, fontFamily:F.bold },

  heroHint: {
    flexDirection:"row", alignItems:"center", gap:6,
    backgroundColor:"rgba(255,255,255,0.6)", borderRadius:10,
    paddingHorizontal:10, paddingVertical:7, borderWidth:1, borderColor:"#e0f2fe",
  },
  heroHintTxt: { color:"#94a3b8", fontSize:11, fontFamily:F.semi, flex:1 },

  card: {
    backgroundColor:"#fff", borderRadius:16,
    borderWidth:1, borderColor:"#f1f5f9", overflow:"hidden",
    shadowColor:"#000", shadowOffset:{width:0,height:2},
    shadowOpacity:0.06, shadowRadius:8, elevation:3,
  },
  cardTop:  { padding:14, flexDirection:"row", alignItems:"flex-start", justifyContent:"space-between" },
  cardIcon: { width:42, height:42, borderRadius:12, alignItems:"center", justifyContent:"center" },
  cardBody: { paddingHorizontal:12, paddingBottom:12, gap:8 },
  cardName: { color:"#1e293b", fontSize:13, fontFamily:F.bold, lineHeight:18 },
  lvBadge:  { alignSelf:"flex-start", paddingHorizontal:7, paddingVertical:2, borderRadius:6, borderWidth:1 },
  lvBadgeTxt:{ fontSize:10, fontFamily:F.xbold },

  detailHeader: { paddingHorizontal:16, paddingTop:14, paddingBottom:16 },
  backBtn: {
    width:34, height:34, borderRadius:10, backgroundColor:"rgba(0,0,0,0.18)",
    alignItems:"center", justifyContent:"center", marginBottom:12, alignSelf:"flex-start",
  },
  detailTitle: { color:"#fff", fontSize:22, fontFamily:F.black, flexShrink:1 },
  detailMeta:  { flexDirection:"row", alignItems:"center", flexWrap:"wrap", gap:8, marginTop:8 },
  detailCount: { color:"rgba(255,255,255,0.8)", fontSize:12, fontWeight:"600" },
  whiteBadge:  {
    backgroundColor:"rgba(255,255,255,0.25)", borderRadius:7,
    paddingHorizontal:8, paddingVertical:3, borderWidth:1, borderColor:"rgba(255,255,255,0.4)",
  },
  whiteBadgeTxt: { color:"#fff", fontSize:10, fontWeight:"800" },
  doneBadge: {
    flexDirection:"row", alignItems:"center", gap:4,
    backgroundColor:"rgba(255,255,255,0.2)", borderRadius:8,
    paddingHorizontal:8, paddingVertical:3,
  },
  doneBadgeTxt: { color:"#fff", fontSize:10, fontWeight:"700" },

  wordRow: {
    backgroundColor:"#fff", borderWidth:1, borderColor:"#f1f5f9",
    borderRadius:14, padding:12, marginBottom:8,
    shadowColor:"#000", shadowOffset:{width:0,height:1},
    shadowOpacity:0.04, shadowRadius:4, elevation:1,
  },
  wordRowTop: { flexDirection:"row", alignItems:"center", gap:10 },
  wordNum:    { width:26, height:26, borderRadius:8, backgroundColor:"#f0fdf4", borderWidth:1, borderColor:"#bbf7d0", alignItems:"center", justifyContent:"center", flexShrink:0 },
  wordNumTxt: { color:"#16a34a", fontSize:11, fontWeight:"800" },
  wordBody:   { flex:1 },
  wordDe:     { color:"#94a3b8", fontSize:14, fontWeight:"700", marginBottom:2 },
  wordAl:     { color:"#f59e0b", fontSize:13, fontWeight:"700" },
  wordEx:     { color:"#64748b", fontSize:11, fontStyle:"italic", marginTop:6, lineHeight:16 },
  audioBtn:   { width:34, height:34, borderRadius:10, alignItems:"center", justifyContent:"center", backgroundColor:"#f0fdf4", borderWidth:1, borderColor:"#bbf7d0", flexShrink:0 },
  audioBtnOn: { backgroundColor:"#10b981", borderColor:"#10b981" },

  finishBar: {
    position:"absolute", bottom:0, left:0, right:0,
    paddingHorizontal:16, paddingBottom:24, paddingTop:10,
    backgroundColor:"rgba(248,250,252,0.97)",
    borderTopWidth:1, borderTopColor:"#f1f5f9",
  },
  finishBtn:    { borderRadius:14, overflow:"hidden" },
  finishBtnGrad:{ flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8, paddingVertical:14 },
  finishBtnTxt: { color:"#fff", fontSize:15, fontFamily:F.xbold },

  xpToast: {
    position:"absolute", top:20, alignSelf:"center",
    flexDirection:"row", alignItems:"center", gap:6,
    backgroundColor:"#1e293b", borderWidth:1.5, borderColor:"#fbbf24",
    borderRadius:20, paddingHorizontal:16, paddingVertical:8, zIndex:999,
  },
  xpToastTxt: { color:"#fbbf24", fontSize:15, fontWeight:"900" },

  empty:    { alignItems:"center", marginTop:80, gap:12 },
  emptyTxt: { color:"#94a3b8", fontSize:15, fontWeight:"600" },
});

// ── Quiz styles ────────────────────────────────────────────────────────────────
const sq = StyleSheet.create({
  root: { flex:1, backgroundColor:"#f8fafc" },

  combo: {
    position:"absolute", top:12, left:0, right:0,
    alignItems:"center", zIndex:999,
  },
  comboGrad: {
    flexDirection:"row", alignItems:"center", gap:6,
    paddingHorizontal:20, paddingVertical:9, borderRadius:99,
    shadowColor:"#f97316", shadowOffset:{width:0,height:6},
    shadowOpacity:0.4, shadowRadius:16, elevation:8,
  },
  comboTxt: { color:"#fff", fontSize:14, fontWeight:"800" },

  body: { paddingHorizontal:16, paddingTop:16, paddingBottom:40 },

  topBar: { flexDirection:"row", alignItems:"center", marginBottom:20 },
  backBtn: {
    flexDirection:"row", alignItems:"center", gap:4,
    backgroundColor:"#fff", borderWidth:1, borderColor:"#e2e8f0",
    borderRadius:12, paddingHorizontal:12, paddingVertical:8,
  },
  backTxt: { color:"#64748b", fontSize:13, fontWeight:"700" },
  mixBadge: {
    flexDirection:"row", alignItems:"center", gap:5,
    borderRadius:10, paddingHorizontal:12, paddingVertical:6,
    backgroundColor:"#eef2ff", borderWidth:1, borderColor:"#c7d2fe",
  },
  mixBadgeTxt: { color:"#4f46e5", fontSize:12, fontWeight:"800", letterSpacing:0.3 },

  progressSection: { marginBottom:14 },
  progressLabels:  { flexDirection:"row", justifyContent:"space-between", marginBottom:8 },
  progressLeft:    { color:"#64748b", fontSize:13, fontWeight:"700" },
  progressRight:   { color:"#6366f1", fontSize:13, fontWeight:"700" },
  progressTrack:   { height:8, backgroundColor:"#e2e8f0", borderRadius:99, overflow:"hidden" },
  progressFill:    { height:"100%", backgroundColor:"#6366f1", borderRadius:99 },

  dotsRow: { flexDirection:"row", justifyContent:"center", flexWrap:"wrap", gap:6, marginBottom:16 },
  dot: { width:10, height:10, borderRadius:5 },

  card: {
    backgroundColor:"#fff", borderRadius:20,
    padding:20, marginBottom:12,
    shadowColor:"#000", shadowOffset:{width:0,height:4},
    shadowOpacity:0.08, shadowRadius:16, elevation:4,
    borderWidth:1, borderColor:"rgba(0,0,0,0.06)",
    overflow:"hidden",
  },
  cardAccent: { position:"absolute", top:0, left:0, right:0, height:3 },
  qLabel: {
    fontSize:11, fontWeight:"800", color:"#94a3b8",
    letterSpacing:1.2, textTransform:"uppercase", marginBottom:10,
  },
  qWord:   { fontSize:24, fontWeight:"800", color:"#1e293b", marginBottom:20, lineHeight:30 },
  options: { gap:10 },

  optBtn: {
    flexDirection:"row", alignItems:"center", gap:12,
    borderWidth:1.5, borderRadius:14,
    paddingVertical:13, paddingHorizontal:14,
  },
  optLetter: {
    width:30, height:30, borderRadius:9, borderWidth:1,
    alignItems:"center", justifyContent:"center",
  },
  optLetterText: { fontSize:13, fontWeight:"800" },
  optText: { flex:1, fontSize:14, fontWeight:"600" },

  feedback: {
    flexDirection:"row", alignItems:"center", gap:12,
    borderWidth:2, borderRadius:16,
    paddingVertical:14, paddingHorizontal:14, marginBottom:12,
  },
  fbTitle: { fontSize:11, fontWeight:"800", textTransform:"uppercase", letterSpacing:0.7, marginBottom:2 },
  fbSub:   { fontSize:13, fontWeight:"700" },
  submitBtn: {
    flexDirection:"row", alignItems:"center", gap:6,
    backgroundColor:"#6366f1", borderRadius:12,
    paddingHorizontal:14, paddingVertical:9,
  },
  submitBtnTxt: { color:"#fff", fontSize:13, fontWeight:"800" },

  resultWrap: {
    flex:1, alignItems:"center", justifyContent:"center",
    paddingHorizontal:24,
  },
  resultIcon: {
    width:80, height:80, borderRadius:24,
    alignItems:"center", justifyContent:"center", marginBottom:16,
  },
  resultTitle: { color:"#0f172a", fontSize:26, fontWeight:"900", marginBottom:6 },
  resultSub:   { color:"#64748b", fontSize:14, textAlign:"center", marginBottom:24 },
  statsRow:    { flexDirection:"row", gap:10, marginBottom:24, width:"100%" },
  statBox:     { flex:1, backgroundColor:"#f8fafc", borderRadius:14, padding:16, alignItems:"center" },
  statXp:      { backgroundColor:"#fefce8", borderWidth:1, borderColor:"#fde68a" },
  statVal:     { fontSize:24, fontWeight:"900", marginBottom:4 },
  statLbl:     { fontSize:12, color:"#64748b", fontWeight:"600" },
  doneBtn:     { width:"100%", borderRadius:14, paddingVertical:15, alignItems:"center" },
  doneBtnTxt:  { color:"#fff", fontSize:15, fontWeight:"800" },
});
