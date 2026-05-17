import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, AppState, Dimensions,
  Modal, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { testService } from "../../services/api";

const { width } = Dimensions.get("window");
const TOTAL_TIME = 30 * 60;
const FREE_LIMIT = 2;

const LEVELS = [
  { code: "A1", name: "Fillestar",        desc: "Gjuha bazike",          icon: "leaf",           colors: ["#dbeafe", "#bfdbfe"], accent: "#2563eb", btn: "#2563eb" },
  { code: "A2", name: "Elementar",        desc: "Aftësi elementare",     icon: "school",         colors: ["#dcfce7", "#bbf7d0"], accent: "#16a34a", btn: "#16a34a" },
  { code: "B1", name: "Mesatar",          desc: "Nivel mesatar",         icon: "book",           colors: ["#fef9c3", "#fef08a"], accent: "#ca8a04", btn: "#ca8a04" },
  { code: "B2", name: "Mesatar i Lartë",  desc: "Aftësi të larta",       icon: "bar-chart",      colors: ["#ffedd5", "#fed7aa"], accent: "#ea580c", btn: "#ea580c" },
  { code: "C1", name: "Avancuar",         desc: "Njohuri të avancuara",  icon: "rocket",         colors: ["#f3e8ff", "#e9d5ff"], accent: "#9333ea", btn: "#9333ea" },
  { code: "C2", name: "Përsosmëri",       desc: "Nivel gjuhëtari",       icon: "trophy",         colors: ["#ffe4e6", "#fecdd3"], accent: "#e11d48", btn: "#e11d48" },
];

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function genSession() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function TestScreen({ navigation }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const insets = useSafeAreaInsets();
  const userId = user?.id || user?._id;
  const isPaid = user?.isPaid || false;

  const [view,          setView]          = useState("levels"); // levels | list | taking
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [levelTests,    setLevelTests]    = useState([]);
  const [selectedTest,  setSelectedTest]  = useState(null);
  const [availability,  setAvailability]  = useState({});
  const [freeUsed,      setFreeUsed]      = useState(0);
  const [loading,       setLoading]       = useState(false);
  const [userAnswers,      setUserAnswers]      = useState({});
  const [timeLeft,         setTimeLeft]         = useState(TOTAL_TIME);
  const [startTime,        setStartTime]        = useState(null);
  const [sessionId,        setSessionId]        = useState(null);
  const [showInstr,        setShowInstr]        = useState(false);
  const [showPremium,      setShowPremium]      = useState(false);
  const [submitting,       setSubmitting]       = useState(false);
  const [result,           setResult]           = useState(null);
  const [currentQIdx,      setCurrentQIdx]      = useState(0);

  const timerRef      = useRef(null);
  const submittingRef = useRef(false);
  const appStateRef   = useRef(AppState.currentState);
  const dotsRef       = useRef(null);

  // ── Persist / restore test state ──────────────────────────────────────────
  useEffect(() => {
    restoreTestState();
    fetchAvailability();
  }, [userId, language]);

  async function restoreTestState() {
    try {
      const saved = await SecureStore.getItemAsync("activeTest");
      if (!saved) return;
      const { testId, answers, start, session } = JSON.parse(saved);
      const elapsed = Math.floor((Date.now() - start) / 1000);
      if (elapsed >= TOTAL_TIME) {
        await SecureStore.deleteItemAsync("activeTest");
        return;
      }
      const res = await testService.getById(testId);
      const test = res?.data?.data ?? res?.data ?? res;
      setSelectedTest(test);
      setUserAnswers(answers);
      setStartTime(start);
      setSessionId(session);
      setTimeLeft(Math.max(0, TOTAL_TIME - elapsed));
      setView("taking");
    } catch {
      await SecureStore.deleteItemAsync("activeTest");
    }
  }

  async function saveTestState(testId, answers, start, session) {
    await SecureStore.setItemAsync("activeTest", JSON.stringify({ testId, answers, start, session }));
  }

  async function clearTestState() {
    await SecureStore.deleteItemAsync("activeTest");
  }

  // ── App background = security violation ───────────────────────────────────
  useEffect(() => {
    if (view !== "taking" || !selectedTest) return;
    const sub = AppState.addEventListener("change", (next) => {
      if (appStateRef.current === "active" && next === "background" && !submittingRef.current) {
        handleViolation("tab_switch");
      }
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, [view, selectedTest, userAnswers]);

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (view !== "taking" || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          autoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [view]);

  // Save answers on change
  useEffect(() => {
    if (view === "taking" && selectedTest && startTime && sessionId) {
      saveTestState(selectedTest._id, userAnswers, startTime, sessionId);
    }
  }, [userAnswers]);

  // ── Fetch data ────────────────────────────────────────────────────────────
  async function fetchAvailability() {
    if (!userId) return;
    try {
      const res = await testService.getAvailability(userId, language);
      const d = res?.data?.data ?? res?.data ?? {};
      setAvailability(d.availability || {});
      if (typeof d.freeTestsUsed === "number") setFreeUsed(d.freeTestsUsed);
    } catch {}
  }

  async function fetchTestsByLevel(level) {
    setLoading(true);
    try {
      const res = await testService.getAll({ level, language });
      const list = res?.data?.data ?? res?.data ?? [];
      const withQ = await Promise.all(
        (Array.isArray(list) ? list : []).map(async t => {
          try {
            const full = await testService.getById(t._id);
            return full?.data?.data ?? full?.data ?? t;
          } catch { return t; }
        })
      );
      setLevelTests(withQ);
    } catch { setLevelTests([]); }
    finally { setLoading(false); }
  }

  // ── Submit helpers ────────────────────────────────────────────────────────
  async function autoSubmit() {
    if (submittingRef.current) return;
    submittingRef.current = true;
    await doSubmit(true);
    submittingRef.current = false;
  }

  async function handleViolation(type) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    const level = selectedTest?.level;
    try {
      await testService.submitViolation(selectedTest._id, {
        answers: toArray(userAnswers),
        userId,
        violationType: type,
        forceFailure: true,
      });
    } catch {}
    await finishTest({ passed: false, score: 0, level, xpEarned: 0, error: "violation" });
    submittingRef.current = false;
  }

  async function doSubmit(auto = false) {
    if (!userId || !selectedTest) return;
    const level = selectedTest.level;
    try {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const res = await testService.submit(selectedTest._id, toArray(userAnswers), elapsed, userId);
      const d = res?.data?.data ?? res?.data ?? res;
      await finishTest({
        passed: d?.passed ?? false,
        score: d?.percentage ?? d?.score ?? 0,
        level,
        xpEarned: d?.xpEarned ?? 0,
        questionResults: d?.results ?? [],
      });
    } catch (err) {
      const status = err?.response?.status;
      if (status === 403) {
        await finishTest({ passed: false, score: 0, level, xpEarned: 0, error: "limit", questionResults: [] });
      } else {
        await finishTest({ passed: false, score: 0, level, xpEarned: 0, error: "network", questionResults: [] });
      }
    }
  }

  async function finishTest(res) {
    clearInterval(timerRef.current);
    await clearTestState();
    setResult(res);
    setUserAnswers({});
    setTimeLeft(TOTAL_TIME);
    setStartTime(null);
    setSessionId(null);
    setSubmitting(false);
    submittingRef.current = false;
    fetchAvailability();
    setView("results");
  }

  function goBackToLevels() {
    setResult(null);
    setSelectedLevel(null);
    setLevelTests([]);
    setView("levels");
  }

  function toArray(answers) {
    return Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer }));
  }

  function getLevelAvailability(code) {
    const a = availability[code];
    if (!a) {
      if (!isPaid && freeUsed >= FREE_LIMIT) return { available: false, reason: "free_limit_reached", locked: true };
      return { available: true, reason: "not_taken", locked: false };
    }
    return a;
  }

  function startTest(test) {
    const start = Date.now();
    const session = genSession();
    setSelectedTest(test);
    setStartTime(start);
    setSessionId(session);
    setTimeLeft(TOTAL_TIME);
    setUserAnswers({});
    setCurrentQIdx(0);
    setView("taking");
    submittingRef.current = false;
  }

  // ── Timer color ───────────────────────────────────────────────────────────
  const timerColor = timeLeft <= 300 ? "#ef4444" : timeLeft <= 900 ? "#f97316" : "#10b981";

  // ─────────────────────────────────────────────────────────────────────────
  // EXAM VIEW
  // ─────────────────────────────────────────────────────────────────────────
  if (view === "taking" && selectedTest) {
    const questions  = selectedTest.questions || [];
    const total      = questions.length;
    const answered   = Object.keys(userAnswers).length;
    const q          = questions[currentQIdx];
    const qId        = q?._id || currentQIdx;
    const chosen     = userAnswers[qId];
    const isLast     = currentQIdx === total - 1;
    const allAnswered = answered === total;

    const goNext = () => {
      if (currentQIdx < total - 1) {
        setCurrentQIdx(i => i + 1);
        dotsRef.current?.scrollTo({ x: Math.max(0, (currentQIdx + 1) * 36 - 100), animated: true });
      }
    };
    const goPrev = () => { if (currentQIdx > 0) setCurrentQIdx(i => i - 1); };

    return (
      <View style={s.root}>
        <SafeAreaView style={{ flex: 1 }}>

          {/* Top bar */}
          <View style={s.examHeader}>
            <View style={s.examTimer}>
              <Ionicons name="time-outline" size={16} color={timerColor} />
              <Text style={[s.examTimerTxt, { color: timerColor }]}>{fmtTime(timeLeft)}</Text>
            </View>
            <View style={s.examProgress}>
              <Text style={s.examProgressTxt}>{answered}/{total} zgjedhur</Text>
              <View style={s.examTrack}>
                <View style={[s.examFill, { width: `${Math.round((answered / total) * 100)}%` }]} />
              </View>
            </View>
            <TouchableOpacity
              style={s.examCancelBtn}
              onPress={() => Alert.alert("Anulo Testin", "Nëse anuloni, testi dështon.", [
                { text: "Vazhdo", style: "cancel" },
                { text: "Anulo", style: "destructive", onPress: () => handleViolation("test_abandoned") },
              ])}
            >
              <Ionicons name="close" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>

          {/* Security notice */}
          <View style={s.secWarning}>
            <Ionicons name="shield-outline" size={13} color="#b91c1c" />
            <Text style={s.secWarningTxt}>Mos dilni nga aplikacioni! Largimi konsiderohet shkelje.</Text>
          </View>

          {/* Single question */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 16 }}>
            {q && (
              <View style={s.qCard}>
                <View style={s.qHeader}>
                  <View style={s.qNum}><Text style={s.qNumTxt}>{q.questionNumber || currentQIdx + 1}</Text></View>
                  <Text style={s.qText}>{q.questionText}</Text>
                </View>
                <View style={s.qOptions}>
                  {q.options?.map((opt, oi) => {
                    const active = chosen === opt.label;
                    return (
                      <TouchableOpacity
                        key={oi}
                        style={[s.option, active && s.optionActive]}
                        onPress={() => setUserAnswers(prev => ({ ...prev, [qId]: opt.label }))}
                        activeOpacity={0.8}
                      >
                        <View style={[s.optionBubble, active && s.optionBubbleActive]}>
                          {active && <View style={s.optionDot} />}
                        </View>
                        <Text style={[s.optionTxt, active && s.optionTxtActive]}>
                          <Text style={{ fontWeight: "800" }}>{opt.label})</Text>{"  "}{opt.text}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Prev / Next / Submit */}
          <View style={s.navBar}>
            <TouchableOpacity
              style={[s.navBtn, currentQIdx === 0 && s.navBtnDisabled]}
              disabled={currentQIdx === 0}
              onPress={goPrev}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={18} color={currentQIdx === 0 ? "#cbd5e1" : "#6366f1"} />
              <Text style={[s.navBtnTxt, currentQIdx === 0 && { color: "#cbd5e1" }]}>Para</Text>
            </TouchableOpacity>

            {isLast ? (
              <TouchableOpacity
                style={[s.submitBtn, (!allAnswered || submitting) && s.submitBtnDisabled]}
                disabled={!allAnswered || submitting}
                onPress={async () => {
                  if (submittingRef.current) return;
                  if (!allAnswered) {
                    Alert.alert("Pyetje pa Përgjigje", `Kanë mbetur ${total - answered} pyetje pa u zgjedhur.`);
                    return;
                  }
                  submittingRef.current = true;
                  setSubmitting(true);
                  await doSubmit();
                }}
                activeOpacity={0.85}
              >
                {submitting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <><Ionicons name="checkmark-circle" size={17} color="#fff" /><Text style={s.submitBtnTxt}>Dorëzo</Text></>
                }
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={s.navBtnNext} onPress={goNext} activeOpacity={0.85}>
                <Text style={s.navBtnNextTxt}>Tjetër</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

        </SafeAreaView>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RESULTS VIEW
  // ─────────────────────────────────────────────────────────────────────────
  if (view === "results" && result) {
    const lv = LEVELS.find(l => l.code === result.level) || LEVELS[0];
    const score = typeof result.score === "number" ? result.score : 0;
    const isError = !!result.error;

    return (
      <View style={s.root}>
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

            {/* Header banner */}
            <View style={[
              rs.banner,
              result.passed
                ? { backgroundColor: "#f0fdf4", borderColor: "#86efac", borderBottomColor: "#4ade80" }
                : isError
                ? { backgroundColor: "#f5f3ff", borderColor: "#ddd6fe", borderBottomColor: "#a78bfa" }
                : { backgroundColor: "#fff1f2", borderColor: "#fca5a5", borderBottomColor: "#f87171" },
            ]}>
              <View style={rs.bannerIcon}>
                <Ionicons
                  name={result.passed ? "checkmark-circle" : isError ? "warning" : "close-circle"}
                  size={52}
                  color={result.passed ? "#10b981" : isError ? "#8b5cf6" : "#ef4444"}
                />
              </View>
              <Text style={[
                rs.bannerTitle,
                { color: result.passed ? "#065f46" : isError ? "#4c1d95" : "#991b1b" },
              ]}>
                {result.passed
                  ? "Kaluat Testin!"
                  : isError === "limit"    ? "Limit i Arritur"
                  : isError === "violation" ? "Shkelje e Sigurisë"
                  : isError               ? "Gabim Teknik"
                  : "Nuk Kaluat"}
              </Text>
              <Text style={[
                rs.bannerSub,
                { color: result.passed ? "#047857" : isError ? "#6d28d9" : "#b91c1c" },
              ]}>
                {result.passed
                  ? `Ju kaluat nivelin ${result.level} me sukses`
                  : isError === "limit"
                  ? "Keni arritur limitin e testeve falas"
                  : isError === "violation"
                  ? "Keni dalë nga aplikacioni gjatë testit"
                  : isError
                  ? "Ka ndodhur një gabim gjatë dorëzimit"
                  : `Rezultati juaj nuk arriti pragun e kalimit`}
              </Text>
            </View>

            {/* Score card */}
            {!isError && (
              <View style={rs.scoreCard}>
                <View style={rs.scoreRow}>
                  <View style={rs.scoreStat}>
                    <Text style={rs.scoreStatVal}>{score}%</Text>
                    <Text style={rs.scoreStatLbl}>Rezultati</Text>
                  </View>
                  <View style={[rs.scoreDivider]} />
                  <View style={rs.scoreStat}>
                    <Text style={[rs.scoreStatVal, { color: result.passed ? "#10b981" : "#ef4444" }]}>
                      {result.passed ? "KALOI" : "DËSHTOI"}
                    </Text>
                    <Text style={rs.scoreStatLbl}>Statusi</Text>
                  </View>
                  <View style={[rs.scoreDivider]} />
                  <View style={rs.scoreStat}>
                    <Text style={rs.scoreStatVal}>75%</Text>
                    <Text style={rs.scoreStatLbl}>Pragu</Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={rs.progressWrap}>
                  <View style={rs.progressTrack}>
                    <View style={[rs.progressFill, {
                      width: `${Math.min(score, 100)}%`,
                      backgroundColor: result.passed ? "#10b981" : "#ef4444",
                    }]} />
                    {/* Threshold marker */}
                    <View style={[rs.progressMark, { left: "75%" }]} />
                  </View>
                  <View style={rs.progressLabels}>
                    <Text style={rs.progressLabelLeft}>0%</Text>
                    <Text style={rs.progressLabelMid}>75%</Text>
                    <Text style={rs.progressLabelRight}>100%</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Per-question boxes */}
            {result.questionResults?.length > 0 && (
              <View style={rs.qBoxesCard}>
                <Text style={rs.qBoxesTitle}>Rezultati për Pyetje</Text>
                <View style={rs.qBoxesGrid}>
                  {result.questionResults.map((qr, i) => (
                    <View key={i} style={[rs.qBox, qr.isCorrect ? rs.qBoxCorrect : rs.qBoxWrong]}>
                      <Ionicons name={qr.isCorrect ? "checkmark" : "close"} size={12} color={qr.isCorrect ? "#10b981" : "#ef4444"} />
                      <Text style={[rs.qBoxNum, qr.isCorrect ? { color: "#10b981" } : { color: "#ef4444" }]}>
                        {qr.questionNumber || i + 1}
                      </Text>
                    </View>
                  ))}
                </View>
                <View style={rs.qBoxLegend}>
                  <View style={rs.qBoxLegendItem}>
                    <View style={[rs.qBoxLegendDot, { backgroundColor: "#10b981" }]} />
                    <Text style={rs.qBoxLegendTxt}>Saktë ({result.questionResults.filter(r => r.isCorrect).length})</Text>
                  </View>
                  <View style={rs.qBoxLegendItem}>
                    <View style={[rs.qBoxLegendDot, { backgroundColor: "#ef4444" }]} />
                    <Text style={rs.qBoxLegendTxt}>Gabim ({result.questionResults.filter(r => !r.isCorrect).length})</Text>
                  </View>
                </View>
              </View>
            )}

            {/* XP earned */}
            {result.passed && result.xpEarned > 0 && (
              <View style={rs.xpCard}>
                <Ionicons name="star" size={22} color="#fbbf24" />
                <View style={{ flex: 1 }}>
                  <Text style={rs.xpTitle}>+{result.xpEarned} XP Fituar!</Text>
                  <Text style={rs.xpSub}>Keni fituar pikë eksperience për kalimin e testit</Text>
                </View>
              </View>
            )}

            {/* Tip */}
            {!result.passed && !isError && (
              <View style={rs.tipCard}>
                <Ionicons name="bulb-outline" size={18} color="#d97706" />
                <Text style={rs.tipTxt}>
                  {score < 30
                    ? "Studioni materialin e nivelit dhe provoni sërish. Rishikoni fjalorin dhe gramatikën!"
                    : score < 60
                    ? "Jeni duke u afruar! Rishikoni gabimet dhe provoni sërish."
                    : "Shumë afër! Nevojiten edhe pak pyetje të sakta. Provoni sërish!"}
                </Text>
              </View>
            )}

            {isError === "limit" && (
              <View style={rs.tipCard}>
                <Ionicons name="lock-closed-outline" size={18} color="#7c3aed" />
                <Text style={[rs.tipTxt, { color: "#6d28d9" }]}>
                  Keni përdorur të 2 testet falas. Kaloni në Premium për akses të pakufizuar në të gjitha testet.
                </Text>
              </View>
            )}

            {/* Back button */}
            <TouchableOpacity style={rs.backBtn} onPress={goBackToLevels} activeOpacity={0.85}>
              <Ionicons name="arrow-back" size={16} color="#fff" />
              <Text style={rs.backBtnTxt}>Kthehu te Nivelet</Text>
            </TouchableOpacity>

          </ScrollView>
        </SafeAreaView>

      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LEVEL LIST
  // ─────────────────────────────────────────────────────────────────────────
  if (view === "list") {
    return (
      <View style={s.root}>
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
            <TouchableOpacity style={s.backBtn} onPress={() => { setView("levels"); setLevelTests([]); }} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={15} color="#10b981" />
              <Text style={s.backBtnTxt}>Kthehu</Text>
            </TouchableOpacity>

            <View style={s.listHeader}>
              <Text style={s.listHeaderTitle}>Testet e Nivelit {selectedLevel}</Text>
              <Text style={s.listHeaderSub}>Zgjidhni një test për të filluar</Text>
            </View>

            {loading ? (
              <View style={s.center}><ActivityIndicator color="#10b981" size="large" /></View>
            ) : levelTests.length === 0 ? (
              <View style={s.emptyCard}>
                <Ionicons name="document-outline" size={28} color="#94a3b8" />
                <Text style={s.emptyTitle}>Nuk ka teste për nivelin {selectedLevel}</Text>
              </View>
            ) : (
              levelTests.map(test => {
                const lv = LEVELS.find(l => l.code === test.level) || LEVELS[0];
                return (
                  <View key={test._id} style={s.testCard}>
                    <View style={s.testCardTop}>
                      <View style={[s.testLevelBadge, { backgroundColor: lv.accent + "18" }]}>
                        <Text style={[s.testLevelBadgeTxt, { color: lv.accent }]}>{test.level}</Text>
                      </View>
                      <Text style={s.testTitle} numberOfLines={2}>{test.title || `Test ${test.level}`}</Text>
                    </View>
                    <View style={s.testMeta}>
                      <View style={s.testMetaItem}>
                        <Ionicons name="help-circle-outline" size={14} color="#64748b" />
                        <Text style={s.testMetaTxt}>{test.questions?.length || 0} pyetje</Text>
                      </View>
                      <View style={s.testMetaItem}>
                        <Ionicons name="time-outline" size={14} color="#64748b" />
                        <Text style={s.testMetaTxt}>30 minuta</Text>
                      </View>
                      <View style={s.testMetaItem}>
                        <Ionicons name="trending-up-outline" size={14} color="#64748b" />
                        <Text style={s.testMetaTxt}>85% për të kaluar</Text>
                      </View>
                    </View>
                    <View style={s.testBtns}>
                      <TouchableOpacity
                        style={s.testBtnSecondary}
                        onPress={() => {
                          if (!isPaid && freeUsed >= FREE_LIMIT) { setShowPremium(true); return; }
                          setSelectedTest(test); setShowInstr(true);
                        }}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="eye-outline" size={15} color="#64748b" />
                        <Text style={s.testBtnSecondaryTxt}>Udhëzime</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[s.testBtnPrimary, { backgroundColor: lv.btn }]}
                        onPress={() => {
                          if (!isPaid && freeUsed >= FREE_LIMIT) { setShowPremium(true); return; }
                          startTest(test);
                        }}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="play" size={15} color="#fff" />
                        <Text style={s.testBtnPrimaryTxt}>Fillo Testin</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </SafeAreaView>

        <InstructionsModal
          visible={showInstr}
          test={selectedTest}
          onClose={() => { setShowInstr(false); setSelectedTest(null); }}
          onStart={() => {
            if (!isPaid && freeUsed >= FREE_LIMIT) { setShowInstr(false); setShowPremium(true); return; }
            setShowInstr(false);
            startTest(selectedTest);
          }}
        />
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LEVEL SELECTOR
  // ─────────────────────────────────────────────────────────────────────────
  const freeRemaining = Math.max(0, FREE_LIMIT - freeUsed);

  return (
    <SafeAreaView edges={["top"]} style={s.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, backgroundColor: "#f8f5f0" }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40, backgroundColor: "#f8f5f0" }}
      >

        {/* ── Hero Header ── */}
        <View style={s.hero}>
          <View style={s.heroRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.heroLabel}>VLERËSIM GJUHËSOR</Text>
              <Text style={s.heroTitle}>Teste Gramatike</Text>
              <Text style={s.heroSub}>Testoni njohuritë tuaja • A1 – C2</Text>
            </View>
            <View style={s.heroStat}>
              <Ionicons name="document-text" size={16} color="#6366f1" style={{ marginBottom: 3 }} />
              <Text style={s.heroStatNum}>{freeUsed}</Text>
              <Text style={s.heroStatLbl}>Kryer</Text>
            </View>
          </View>

          {/* Free limit bar */}
          {!isPaid && (
            <TouchableOpacity
              onPress={freeUsed >= FREE_LIMIT ? () => setShowPremium(true) : undefined}
              activeOpacity={0.85}
              style={s.heroLimitRow}
            >
              <Ionicons
                name={freeUsed >= FREE_LIMIT ? "lock-closed" : "time-outline"}
                size={13}
                color={freeUsed >= FREE_LIMIT ? "#7c3aed" : "#6366f1"}
              />
              <Text style={s.heroLimitTxt}>
                {freeUsed >= FREE_LIMIT
                  ? "Limite arritur — Premium për akses të plotë"
                  : `Plan Falas · ${freeRemaining}/${FREE_LIMIT} teste falas të mbetura`}
              </Text>
              <View style={s.heroLimitDots}>
                {Array.from({ length: FREE_LIMIT }).map((_, i) => (
                  <View key={i} style={[s.heroLimitDot, i < freeUsed && s.heroLimitDotUsed]} />
                ))}
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Level Grid ── */}
        <View style={s.levelGrid}>
          {LEVELS.map(lv => {
            const avail  = getLevelAvailability(lv.code);
            const locked = avail.reason === "free_limit_reached";
            const passed = avail.reason === "passed";

            return (
              <TouchableOpacity
                key={lv.code}
                style={[s.levelCard, locked && s.levelCardLocked]}
                onPress={() => {
                  if (locked) { setShowPremium(true); return; }
                  setSelectedLevel(lv.code);
                  fetchTestsByLevel(lv.code);
                  setView("list");
                }}
                activeOpacity={0.85}
              >
                <LinearGradient colors={lv.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.levelCardGrad}>
                  {/* Badges row */}
                  <View style={s.levelCardTop}>
                    <View style={[s.levelCodeBadge, { borderColor: lv.accent + "50", backgroundColor: "#fff" }]}>
                      <Text style={[s.levelCodeTxt, { color: lv.accent }]}>{lv.code}</Text>
                    </View>
                    {passed && (
                      <View style={[s.levelStatusBadge, { backgroundColor: "#10b981" }]}>
                        <Ionicons name="checkmark" size={11} color="#fff" />
                      </View>
                    )}
                    {locked && (
                      <View style={[s.levelStatusBadge, { backgroundColor: "#fff" }]}>
                        <Ionicons name="lock-closed" size={11} color="#f59e0b" />
                      </View>
                    )}
                  </View>

                  {/* Center icon */}
                  <View style={[s.levelIconWrap, { backgroundColor: lv.accent + "18", borderColor: lv.accent + "30" }]}>
                    <Ionicons name={locked ? "lock-closed" : lv.icon} size={26} color={locked ? "#9ca3af" : lv.accent} />
                  </View>

                  <Text style={[s.levelName, { color: lv.accent }]}>{lv.name}</Text>
                  <Text style={[s.levelDesc, { color: lv.accent + "99" }]}>{lv.desc}</Text>

                  {passed && avail.lastScore && (
                    <View style={s.levelScoreRow}>
                      <Ionicons name="checkmark-circle" size={11} color="#10b981" />
                      <Text style={[s.levelScore, { color: "#10b981" }]}>{avail.lastScore}%</Text>
                    </View>
                  )}

                  <View style={[s.levelBtn, { backgroundColor: locked ? "#e5e7eb" : lv.btn }]}>
                    {locked ? (
                      <><Ionicons name="star" size={12} color="#9ca3af" /><Text style={[s.levelBtnTxt, { color: "#9ca3af" }]}>Premium</Text></>
                    ) : (
                      <><Ionicons name="play" size={12} color="#fff" /><Text style={s.levelBtnTxt}>Fillo</Text></>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <PremiumModal visible={showPremium} onClose={() => setShowPremium(false)} />
    </SafeAreaView>
  );
}

// ── Instructions Modal ────────────────────────────────────────────────────────
function InstructionsModal({ visible, test, onClose, onStart }) {
  if (!test) return null;
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={m.overlay}>
        <TouchableOpacity style={m.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={m.sheet}>
          <View style={m.handle} />
          <View style={m.header}>
            <View style={{ flex: 1 }}>
              <Text style={m.title}>Udhëzime për Testin</Text>
              <Text style={m.sub}>{test.title} — Niveli {test.level}</Text>
            </View>
            <TouchableOpacity style={m.closeBtn} onPress={onClose} activeOpacity={0.8}>
              <Ionicons name="close" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
            {/* Warning */}
            <View style={m.warningBox}>
              <View style={m.warningHeader}>
                <Ionicons name="shield-outline" size={18} color="#dc2626" />
                <Text style={m.warningTitle}>PARALAJMËRIM I RËNDËSISHËM!</Text>
              </View>
              {[
                "NUK LEJOHET dalja nga aplikacioni gjatë testit",
                "NUK LEJOHET kalimi në aplikacione të tjera",
                "Çdo shkelje = DËSHTIM I MENJËHERSHËM!",
              ].map((w, i) => (
                <Text key={i} style={m.warningItem}>• {w}</Text>
              ))}
            </View>

            {/* Time */}
            <View style={m.infoRow}>
              <Ionicons name="time-outline" size={15} color="#d97706" />
              <Text style={m.infoTxt}>Koha e Testit: <Text style={{ fontWeight: "800" }}>30 Minuta</Text> — Dorëzohet automatikisht kur mbarojë.</Text>
            </View>

            {/* Rules */}
            {[
              "Keni 30 minuta për të përfunduar.",
              "Çdo pyetje ka vetëm një përgjigje të saktë.",
              "Nevojitet 85% ose më shumë për të kaluar.",
              "Nëse dështoni, mund ta rimarrni menjëherë.",
            ].map((r, i) => (
              <View key={i} style={m.rule}>
                <View style={m.ruleBullet}><Text style={m.ruleBulletTxt}>{i + 1}</Text></View>
                <Text style={m.ruleTxt}>{r}</Text>
              </View>
            ))}

            {/* Stats */}
            <View style={m.statsRow}>
              <View style={m.statItem}>
                <Text style={m.statLbl}>Pyetje</Text>
                <Text style={m.statVal}>{test.questions?.length || 0}</Text>
              </View>
              <View style={m.statItem}>
                <Text style={m.statLbl}>Koha</Text>
                <Text style={m.statVal}>30 min</Text>
              </View>
              <View style={m.statItem}>
                <Text style={m.statLbl}>Pikët</Text>
                <Text style={m.statVal}>85%</Text>
              </View>
            </View>
          </ScrollView>

          <View style={m.footer}>
            <TouchableOpacity style={m.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={m.cancelTxt}>Anulo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={m.startBtn} onPress={onStart} activeOpacity={0.85}>
              <Ionicons name="play" size={16} color="#fff" />
              <Text style={m.startTxt}>Fillo Testin</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Premium Modal ─────────────────────────────────────────────────────────────
function PremiumModal({ visible, onClose }) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableOpacity style={pm.overlay} onPress={onClose} activeOpacity={1}>
        <TouchableOpacity style={pm.card} activeOpacity={1}>
          <LinearGradient colors={["#f59e0b", "#f97316", "#ef4444"]} style={pm.topGrad}>
            <View style={pm.crownBox}>
              <Ionicons name="crown" size={36} color="#fff" />
            </View>
            <Text style={pm.topTitle}>Funksion Premium</Text>
            <Text style={pm.topSub}>Testet janë ekskluzive për abonentët Premium</Text>
          </LinearGradient>
          <View style={pm.body}>
            {["Qasje në të gjitha testet A1–C2", "Certifikim i nivelit tuaj", "Rezultate dhe historik", "Pa kufizime"].map(p => (
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
  root:   { flex: 1, backgroundColor: "#f8f5f0" },
  center: { paddingVertical: 60, alignItems: "center" },

  // Hero header
  hero: {
    marginHorizontal: 16, marginTop: 12, marginBottom: 20,
    backgroundColor: "#f5f3ff",
    borderRadius: 22, padding: 20,
    borderWidth: 1, borderColor: "#ddd6fe",
    borderBottomWidth: 5, borderBottomColor: "#c4b5fd",
    shadowColor: "#6366f1", shadowOpacity: 0.13, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 7,
  },
  heroRow:      { flexDirection: "row", alignItems: "flex-start", marginBottom: 14 },
  heroLabel:    { color: "#7c3aed", fontSize: 10, fontWeight: "700", letterSpacing: 1.2, marginBottom: 4 },
  heroTitle:    { color: "#0f172a", fontSize: 26, fontWeight: "900", letterSpacing: -0.5, marginBottom: 4 },
  heroSub:      { color: "#6d28d9", fontSize: 12, fontWeight: "500" },
  heroStat:     { backgroundColor: "#ede9fe", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, alignItems: "center", borderWidth: 1, borderColor: "#ddd6fe" },
  heroStatNum:  { color: "#4c1d95", fontSize: 20, fontWeight: "900", lineHeight: 22 },
  heroStatLbl:  { color: "#7c3aed", fontSize: 10, fontWeight: "600", marginTop: 2 },
  heroLimitRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#ede9fe", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: "#ddd6fe" },
  heroLimitTxt: { flex: 1, fontSize: 12, fontWeight: "600", color: "#5b21b6" },
  heroLimitDots:{ flexDirection: "row", gap: 4 },
  heroLimitDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#c4b5fd" },
  heroLimitDotUsed: { backgroundColor: "#7c3aed" },

  // Level grid
  levelGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 16 },
  levelCard: {
    width: (width - 44) / 2, borderRadius: 20,
    borderBottomWidth: 5, borderBottomColor: "rgba(0,0,0,0.13)",
    shadowColor: "#000", shadowOpacity: 0.10, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  levelCardLocked: { opacity: 0.7 },
  levelCardGrad:   { padding: 14, borderRadius: 20, overflow: "hidden" },
  levelCardTop:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  levelCodeBadge:  { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  levelCodeTxt:    { fontSize: 13, fontWeight: "900" },
  levelStatusBadge:{ width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  levelIconWrap:   { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 12, borderWidth: 1 },
  levelName:       { fontSize: 13, fontWeight: "800", marginBottom: 2, textAlign: "center" },
  levelDesc:       { fontSize: 10, fontWeight: "500", marginBottom: 10, textAlign: "center" },
  levelScoreRow:   { flexDirection: "row", alignItems: "center", gap: 4, justifyContent: "center", marginBottom: 8 },
  levelScore:      { fontSize: 11, fontWeight: "700" },
  levelBtn:        { borderRadius: 10, paddingVertical: 8, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 4, marginTop: 2 },
  levelBtnTxt:     { color: "#fff", fontSize: 12, fontWeight: "800" },

  // Back button
  backBtn:    { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#f0fdf4", borderRadius: 12, alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 8, marginBottom: 16, borderWidth: 1, borderColor: "#bbf7d0" },
  backBtnTxt: { color: "#10b981", fontSize: 13, fontWeight: "700" },

  // List header
  listHeader: {
    backgroundColor: "#fff", borderRadius: 20, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: "#e2e8f0",
    borderBottomWidth: 5, borderBottomColor: "#cbd5e1",
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  listHeaderTitle: { color: "#0f172a", fontSize: 20, fontWeight: "900" },
  listHeaderSub:   { color: "#64748b", fontSize: 13, marginTop: 4 },

  // Test card
  testCard: {
    backgroundColor: "#fff", borderRadius: 20, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: "#e2e8f0",
    borderBottomWidth: 5, borderBottomColor: "#cbd5e1",
    shadowColor: "#000", shadowOpacity: 0.09, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  testCardTop: { marginBottom: 12 },
  testLevelBadge: { alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8 },
  testLevelBadgeTxt: { fontSize: 12, fontWeight: "800" },
  testTitle:   { color: "#0f172a", fontSize: 15, fontWeight: "800" },
  testMeta:    { flexDirection: "row", gap: 14, marginBottom: 14, flexWrap: "wrap" },
  testMetaItem:{ flexDirection: "row", alignItems: "center", gap: 4 },
  testMetaTxt: { color: "#64748b", fontSize: 12, fontWeight: "600" },
  testBtns:    { flexDirection: "row", gap: 10 },
  testBtnSecondary: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: "#e2e8f0", backgroundColor: "#f8fafc" },
  testBtnSecondaryTxt: { color: "#64748b", fontSize: 13, fontWeight: "700" },
  testBtnPrimary: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 12 },
  testBtnPrimaryTxt: { color: "#fff", fontSize: 13, fontWeight: "800" },

  // Empty
  emptyCard:  { alignItems: "center", backgroundColor: "#fff", borderRadius: 20, padding: 40, gap: 12, borderWidth: 1, borderColor: "#f1f5f9" },
  emptyTitle: { color: "#0f172a", fontSize: 15, fontWeight: "800", textAlign: "center" },

  // Exam
  examHeader:      { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  examTimer:       { flexDirection: "row", alignItems: "center", gap: 5 },
  examTimerTxt:    { fontSize: 20, fontWeight: "900" },
  examProgress:    { flex: 1, gap: 4 },
  examProgressTxt: { color: "#64748b", fontSize: 11, fontWeight: "600", textAlign: "right" },
  examTrack:       { height: 6, backgroundColor: "#f1f5f9", borderRadius: 3, overflow: "hidden" },
  examFill:        { height: 6, backgroundColor: "#10b981", borderRadius: 3 },
  examCancelBtn:   { width: 32, height: 32, borderRadius: 9, backgroundColor: "#fff1f2", borderWidth: 1, borderColor: "#fecaca", alignItems: "center", justifyContent: "center" },

  secWarning:    { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fff1f2", paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#fecaca" },
  secWarningTxt: { flex: 1, color: "#b91c1c", fontSize: 11, fontWeight: "600" },

  // Questions
  qCard: {
    backgroundColor: "#fff", borderRadius: 16, marginBottom: 12,
    borderWidth: 1, borderColor: "#e2e8f0",
    borderBottomWidth: 4, borderBottomColor: "#cbd5e1",
    shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  qHeader:  { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderBottomWidth: 1, borderBottomColor: "#f8fafc" },
  qNum:     { minWidth: 28, height: 28, borderRadius: 8, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },
  qNumTxt:  { color: "#374151", fontSize: 12, fontWeight: "800" },
  qText:    { flex: 1, color: "#0f172a", fontSize: 13, fontWeight: "600", lineHeight: 19 },
  qOptions: { padding: 12, gap: 8 },
  option:        { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12, borderRadius: 12, backgroundColor: "#f8fafc", borderWidth: 1.5, borderColor: "#e2e8f0" },
  optionActive:  { backgroundColor: "#f0fdf4", borderColor: "#10b981" },
  optionBubble:  { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#cbd5e1", alignItems: "center", justifyContent: "center", marginTop: 1 },
  optionBubbleActive: { borderColor: "#10b981" },
  optionDot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: "#10b981" },
  optionTxt:     { flex: 1, color: "#374151", fontSize: 13, lineHeight: 19 },
  optionTxtActive:{ color: "#0f172a", fontWeight: "700" },

  // Question dots
  dotsScroll: { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9", maxHeight: 52 },
  dotsRow:    { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  dot:        { width: 30, height: 30, borderRadius: 8, backgroundColor: "#f1f5f9", borderWidth: 1.5, borderColor: "#e2e8f0", alignItems: "center", justifyContent: "center" },
  dotAnswered:{ backgroundColor: "#6366f1", borderColor: "#6366f1" },
  dotCurrent: { backgroundColor: "#312e81", borderColor: "#312e81" },
  dotTxt:     { fontSize: 10, fontWeight: "700", color: "#94a3b8" },

  // Nav bar
  navBar:        { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  navBtn:        { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 13, borderRadius: 14, borderWidth: 1.5, borderColor: "#e2e8f0", backgroundColor: "#f8fafc" },
  navBtnDisabled:{ borderColor: "#f1f5f9" },
  navBtnTxt:     { fontSize: 14, fontWeight: "700", color: "#6366f1" },
  navBtnNext:    { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 13, borderRadius: 14, backgroundColor: "#6366f1" },
  navBtnNextTxt: { fontSize: 14, fontWeight: "800", color: "#fff" },
  submitBtn:     { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#10b981", borderRadius: 14, paddingVertical: 13 },
  submitBtnDisabled: { backgroundColor: "#a7f3d0" },
  submitBtnTxt:  { color: "#fff", fontWeight: "800", fontSize: 14 },
});

// ── Modal styles ──────────────────────────────────────────────────────────────
const m = StyleSheet.create({
  overlay:  { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet:    { backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "90%" },
  handle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: "#e2e8f0", alignSelf: "center", marginTop: 12, marginBottom: 4 },
  header:   { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  title:    { color: "#0f172a", fontSize: 17, fontWeight: "900", marginBottom: 2 },
  sub:      { color: "#64748b", fontSize: 13 },
  closeBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", alignItems: "center", justifyContent: "center" },

  warningBox:    { backgroundColor: "#fff1f2", borderRadius: 14, borderWidth: 1.5, borderColor: "#fca5a5", padding: 14 },
  warningHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  warningTitle:  { color: "#dc2626", fontWeight: "900", fontSize: 13 },
  warningItem:   { color: "#b91c1c", fontSize: 12, fontWeight: "600", marginBottom: 4 },

  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#fffbeb", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#fde68a" },
  infoTxt: { flex: 1, color: "#92400e", fontSize: 12, fontWeight: "500", lineHeight: 18 },

  rule:        { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  ruleBullet:  { width: 22, height: 22, borderRadius: 7, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },
  ruleBulletTxt:{ color: "#374151", fontSize: 11, fontWeight: "800" },
  ruleTxt:     { flex: 1, color: "#374151", fontSize: 13, lineHeight: 19 },

  statsRow: { flexDirection: "row", gap: 8 },
  statItem: { flex: 1, backgroundColor: "#f8fafc", borderRadius: 12, padding: 12, alignItems: "center", borderWidth: 1, borderColor: "#f1f5f9" },
  statLbl:  { color: "#94a3b8", fontSize: 10, fontWeight: "700", marginBottom: 4 },
  statVal:  { color: "#0f172a", fontSize: 16, fontWeight: "900" },

  footer:    { flexDirection: "row", gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  cancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 13, borderWidth: 1.5, borderColor: "#e2e8f0", alignItems: "center" },
  cancelTxt: { color: "#64748b", fontWeight: "700", fontSize: 14 },
  startBtn:  { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 13, backgroundColor: "#0f172a" },
  startTxt:  { color: "#fff", fontWeight: "800", fontSize: 14 },
});

// ── Results styles ────────────────────────────────────────────────────────────
const rs = StyleSheet.create({
  banner: {
    borderRadius: 24, padding: 28, alignItems: "center", marginBottom: 16, gap: 8,
    borderWidth: 1.5,
    borderBottomWidth: 5,
    shadowColor: "#000", shadowOpacity: 0.09, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 7,
  },
  bannerIcon:  { marginBottom: 4 },
  bannerTitle: { fontSize: 26, fontWeight: "900", textAlign: "center" },
  bannerSub:   { fontSize: 14, textAlign: "center", lineHeight: 20 },

  scoreCard: {
    backgroundColor: "#fff", borderRadius: 20, padding: 20, marginBottom: 14,
    borderWidth: 1, borderColor: "#e2e8f0",
    borderBottomWidth: 5, borderBottomColor: "#cbd5e1",
    shadowColor: "#000", shadowOpacity: 0.09, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  scoreRow:     { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  scoreStat:    { flex: 1, alignItems: "center", gap: 4 },
  scoreDivider: { width: 1, height: 40, backgroundColor: "#f1f5f9" },
  scoreStatVal: { color: "#0f172a", fontSize: 22, fontWeight: "900" },
  scoreStatLbl: { color: "#94a3b8", fontSize: 11, fontWeight: "700" },

  progressWrap:       { gap: 6 },
  progressTrack:      { height: 10, backgroundColor: "#f1f5f9", borderRadius: 5, overflow: "visible", position: "relative" },
  progressFill:       { height: 10, borderRadius: 5 },
  progressMark:       { position: "absolute", top: -3, width: 2, height: 16, backgroundColor: "#374151", borderRadius: 1 },
  progressLabels:     { flexDirection: "row", justifyContent: "space-between" },
  progressLabelLeft:  { color: "#94a3b8", fontSize: 10, fontWeight: "600" },
  progressLabelMid:   { color: "#374151", fontSize: 10, fontWeight: "700" },
  progressLabelRight: { color: "#94a3b8", fontSize: 10, fontWeight: "600" },

  xpCard:   { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#fffbeb", borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1.5, borderColor: "#fde68a" },
  xpTitle:  { color: "#92400e", fontSize: 15, fontWeight: "800" },
  xpSub:    { color: "#b45309", fontSize: 12, marginTop: 2 },

  tipCard:  { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#fffbeb", borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: "#fcd34d" },
  tipTxt:   { flex: 1, color: "#92400e", fontSize: 13, lineHeight: 19 },

  backBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#0f172a", borderRadius: 16, paddingVertical: 15, marginTop: 4 },
  backBtnTxt: { color: "#fff", fontSize: 15, fontWeight: "800" },

  // Question boxes
  qBoxesCard: {
    backgroundColor: "#fff", borderRadius: 20, padding: 18, marginBottom: 14,
    borderWidth: 1, borderColor: "#e2e8f0",
    borderBottomWidth: 5, borderBottomColor: "#cbd5e1",
    shadowColor: "#000", shadowOpacity: 0.09, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  qBoxesTitle:    { color: "#0f172a", fontSize: 14, fontWeight: "800", marginBottom: 14 },
  qBoxesGrid:     { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  qBox:           { width: 42, height: 42, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1.5, gap: 1 },
  qBoxCorrect:    { backgroundColor: "#f0fdf4", borderColor: "#10b981" },
  qBoxWrong:      { backgroundColor: "#fff1f2", borderColor: "#ef4444" },
  qBoxNum:        { fontSize: 10, fontWeight: "800" },
  qBoxLegend:     { flexDirection: "row", gap: 20, marginTop: 14 },
  qBoxLegendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  qBoxLegendDot:  { width: 10, height: 10, borderRadius: 3 },
  qBoxLegendTxt:  { fontSize: 12, fontWeight: "600", color: "#64748b" },
});

const pm = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: 24 },
  card:       { backgroundColor: "#fff", borderRadius: 28, width: "100%", overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 24, elevation: 12 },
  topGrad:    { padding: 28, alignItems: "center" },
  crownBox:   { width: 72, height: 72, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  topTitle:   { color: "#fff", fontSize: 22, fontWeight: "900", marginBottom: 4 },
  topSub:     { color: "rgba(255,255,255,0.8)", fontSize: 13, textAlign: "center" },
  body:       { padding: 24, gap: 12 },
  perk:       { flexDirection: "row", alignItems: "center", gap: 12 },
  perkDot:    { width: 22, height: 22, borderRadius: 11, backgroundColor: "#f59e0b", alignItems: "center", justifyContent: "center" },
  perkTxt:    { color: "#374151", fontSize: 13, fontWeight: "600" },
  upgradeBtn: { backgroundColor: "#f59e0b", borderRadius: 16, paddingVertical: 15, alignItems: "center", marginTop: 8 },
  upgradeTxt: { color: "#fff", fontWeight: "900", fontSize: 15 },
  dismissTxt: { color: "#94a3b8", fontSize: 13, textAlign: "center", marginTop: 4 },
});
