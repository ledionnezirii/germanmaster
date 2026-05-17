import { useState, useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Animated, Dimensions, Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { SectionHeader } from "../../components/Headers";
import { useLanguage } from "../../context/LanguageContext";
import { createWordService } from "../../services/api";
import { getSectionTexts } from "../../utils/sectionTexts";
import { F } from "../../styles/fonts";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_W = (SCREEN_WIDTH - 16 * 2 - 10) / 2;

const LEVELS = ["A1", "A2", "B1", "B2"];

const LEVEL_STYLES = {
  A1: { bg: "#ecfdf5", border: "#6ee7b7", text: "#065f46", pill: "#d1fae5" },
  A2: { bg: "#eff6ff", border: "#93c5fd", text: "#1e40af", pill: "#dbeafe" },
  B1: { bg: "#f5f3ff", border: "#c4b5fd", text: "#5b21b6", pill: "#ede9fe" },
  B2: { bg: "#fffbeb", border: "#fcd34d", text: "#92400e", pill: "#fef3c7" },
};

function shuffleWord(word) {
  const arr = word.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── Paywall modal ─────────────────────────────────────────────────────────────
function PaywallModal({ visible, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={s.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={s.paywallCard}>
              <View style={s.paywallIconBox}>
                <Ionicons name="diamond" size={36} color="#f59e0b" />
              </View>
              <Text style={s.paywallTitle}>Limit i Arritur</Text>
              <Text style={s.paywallSub}>
                Versioni falas lejon vetëm{" "}
                <Text style={{ fontFamily: F.xbold, color: "#10b981" }}>5</Text>{" "}
                mësime të përfunduara.
              </Text>
              <Text style={s.paywallDesc}>
                Kaloni në planin Premium për akses të pakufizuar në të gjitha mësimet.
              </Text>
              <TouchableOpacity style={s.paywallPrimaryBtn} onPress={onClose} activeOpacity={0.85}>
                <LinearGradient
                  colors={["#10b981", "#0d9488"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={s.paywallBtnInner}
                >
                  <Text style={s.paywallPrimaryText}>Shiko Planet Premium</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={s.paywallSecondaryBtn} onPress={onClose} activeOpacity={0.8}>
                <Text style={s.paywallSecondaryText}>Mbyll</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// ── Stat card (results screen) ────────────────────────────────────────────────
function StatCard({ label, value, color, bg, border }) {
  return (
    <View style={[s.statCard, { backgroundColor: bg, borderColor: border }]}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={[s.statValue, { color }]}>{value}</Text>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function CreateWordScreen() {
  const { language } = useLanguage();

  const [gameState, setGameState]           = useState("menu");
  const [lessons, setLessons]               = useState([]);
  const [selectedLevel, setSelectedLevel]   = useState("A1");
  const [currentLesson, setCurrentLesson]   = useState(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userAnswers, setUserAnswers]       = useState([]);
  const [currentAnswer, setCurrentAnswer]   = useState("");
  const [usedIndices, setUsedIndices]       = useState([]);
  const [shuffledLetters, setShuffledLetters] = useState([]);
  const [results, setResults]               = useState(null);
  const [loading, setLoading]               = useState(false);
  const [lessonsLoading, setLessonsLoading] = useState(true);
  const [finishedLessons, setFinishedLessons] = useState([]);
  const [finishedLessonsData, setFinishedLessonsData] = useState([]);
  const [isPaid, setIsPaid]                 = useState(false);
  const [freeLimit, setFreeLimit]           = useState(5);
  // const [accuracy, setAccuracy]             = useState(null);
  const [showPaywall, setShowPaywall]       = useState(false);
  const [mixedWords,  setMixedWords]        = useState([]);

  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchLessons();
    fetchFinished();
  }, [selectedLevel, language]);

  useEffect(() => {
    if (!currentLesson) return;
    const pct = ((currentWordIndex + 1) / currentLesson.words.length) * 100;
    Animated.timing(progressAnim, { toValue: pct, duration: 380, useNativeDriver: false }).start();
  }, [currentWordIndex, currentLesson]);

  async function fetchLessons() {
    setLessonsLoading(true);
    try {
      const res = await createWordService.getAllLessons({ level: selectedLevel, language });
      setLessons(res.data || []);
    } catch {}
    finally { setLessonsLoading(false); }
  }

  async function fetchFinished() {
    try {
      const res = await createWordService.getFinishedLessons();
      const data = res.data || {};
      const list = data.lessons || [];
      setFinishedLessons(list.map((l) => l._id));
      setFinishedLessonsData(list);
      setFreeLimit(data.freeLimit || 5);
      if (data.isPaid !== undefined) setIsPaid(data.isPaid);
      // if (data.accuracy !== undefined) setAccuracy(data.accuracy);
    } catch {}
  }

  function startLesson(lesson) {
    progressAnim.setValue(0);
    setCurrentLesson(lesson);
    setCurrentWordIndex(0);
    setUserAnswers([]);
    setCurrentAnswer("");
    setUsedIndices([]);
    setShuffledLetters(shuffleWord(lesson.words[0].german));
    setResults(null);
    setGameState("playing");
  }

  function handleLetterPress(letter, index) {
    setCurrentAnswer((prev) => prev + letter);
    setUsedIndices((prev) => [...prev, index]);
  }

  function handleBackspace() {
    setCurrentAnswer((prev) => prev.slice(0, -1));
    setUsedIndices((prev) => prev.slice(0, -1));
  }

  function handleSubmitWord() {
    if (!currentAnswer.trim()) return;
    const newAnswers = [...userAnswers, currentAnswer];
    setUserAnswers(newAnswers);
    setCurrentAnswer("");

    if (currentWordIndex < currentLesson.words.length - 1) {
      const next = currentWordIndex + 1;
      setCurrentWordIndex(next);
      setUsedIndices([]);
      setShuffledLetters(shuffleWord(currentLesson.words[next].german));
    } else {
      submitLesson(newAnswers);
    }
  }

  async function submitLesson(answers) {
    setLoading(true);
    try {
      const res = await createWordService.submitLesson(currentLesson._id, answers);
      setResults(res.data);
      setGameState("results");
      if (res.data?.limitReached) setShowPaywall(true);
      else if (res.data?.passed) fetchFinished();
    } catch {}
    finally { setLoading(false); }
  }

  function startMixedQuiz() {
    if (!isPaid) { setShowPaywall(true); return; }
    const allWords = finishedLessonsData
      .filter((l) => !l.language || l.language === language)
      .flatMap((l) => l.words || []);
    if (allWords.length < 2) return;
    const shuffled = [...allWords].sort(() => Math.random() - 0.5).slice(0, 10);
    setMixedWords(shuffled);
    setCurrentWordIndex(0);
    setCurrentAnswer("");
    setUsedIndices([]);
    setUserAnswers([]);
    setShuffledLetters(shuffleWord(shuffled[0].german));
    progressAnim.setValue(0);
    setGameState("mixedQuiz");
  }

  function backToMenu() {
    setGameState("menu");
    setCurrentLesson(null);
    setCurrentWordIndex(0);
    setUserAnswers([]);
    setCurrentAnswer("");
    setUsedIndices([]);
    setResults(null);
    progressAnim.setValue(0);
  }

  const currentWord = currentLesson?.words[currentWordIndex];

  // ══════════════════════════════════════════════════════════════════
  // MENU
  // ══════════════════════════════════════════════════════════════════
  if (gameState === "menu") {
    return (
      <View style={s.root}>
        <SafeAreaView edges={["bottom"]} style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false}>

            <SectionHeader
              gradientColors={["#064e3b", "#059669", "#10b981"]}
              icon="pencil"
              levels={LEVELS}
              {...getSectionTexts("createWord", language)}
              selectedLevel={selectedLevel}
              onLevelChange={setSelectedLevel}
              // stat={{ icon: "stats-chart", value: accuracy !== null ? `${accuracy}%` : "—", label: "Saktësi" }}
            >
              <TouchableOpacity onPress={startMixedQuiz} activeOpacity={0.85}>
                <LinearGradient
                  colors={["#f59e0b", "#ea580c"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={s.mixBtn}
                >
                  <Ionicons name={isPaid ? "shuffle" : "lock-closed"} size={15} color="#fff" />
                  <Text style={s.mixBtnText}>Kuiz i Përzier</Text>
                  {isPaid ? (
                    <View style={s.mixBtnBadge}>
                      <Text style={s.mixBtnBadgeTxt}>
                        {Math.min(finishedLessonsData.filter((l) => !l.language || l.language === language).flatMap((l) => l.words || []).length, 10)} fjalë
                      </Text>
                    </View>
                  ) : (
                    <View style={s.mixBtnBadge}>
                      <Text style={s.mixBtnBadgeTxt}>Premium</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </SectionHeader>

            <View style={s.body}>

              {/* ── Lessons ── */}
              {lessonsLoading ? (
                <View style={s.centered}>
                  <ActivityIndicator size="large" color="#10b981" />
                  <Text style={s.loadingText}>Duke u ngarkuar mësimet...</Text>
                </View>
              ) : lessons.length === 0 ? (
                <View style={s.emptyBox}>
                  <Ionicons name="book-outline" size={42} color="#a7f3d0" />
                  <Text style={s.emptyTitle}>Nuk ka mësime</Text>
                  <Text style={s.emptySub}>
                    Nuk ka mësime për nivelin {selectedLevel}
                  </Text>
                </View>
              ) : (
                <View style={s.lessonGrid}>
                  {lessons.map((lesson, index) => {
                    const isFinished = finishedLessons.includes(lesson._id);
                    const isLocked   = !isPaid && index >= freeLimit;
                    const c = LEVEL_STYLES[lesson.level] || LEVEL_STYLES.A1;

                    return (
                      <TouchableOpacity
                        key={lesson._id}
                        style={[
                          s.lessonCard,
                          isFinished && s.lessonCardDone,
                          isLocked   && s.lessonCardLocked,
                        ]}
                        onPress={() => isLocked ? setShowPaywall(true) : startLesson(lesson)}
                        activeOpacity={0.8}
                      >
                        {/* Level badge */}
                        <View style={[s.lvlBadge, { backgroundColor: c.pill, borderColor: c.border }]}>
                          <Text style={[s.lvlBadgeText, { color: c.text }]}>{lesson.level}</Text>
                        </View>

                        {isLocked && (
                          <View style={s.lockWrap}>
                            <Ionicons name="lock-closed" size={13} color="#94a3b8" />
                          </View>
                        )}

                        <Text
                          style={[s.lessonTitle, isLocked && { color: "#94a3b8" }]}
                          numberOfLines={2}
                        >
                          {lesson.title}
                        </Text>
                        <Text style={[s.lessonWordCount, isLocked && { color: "#cbd5e1" }]}>
                          {lesson.words?.length ?? 0} fjalë për të mësuar
                        </Text>

                        <View style={[s.lessonDivider, isLocked && { borderColor: "#e2e8f0" }]} />

                        <View style={s.lessonFooter}>
                          {!isLocked && lesson.xp ? (
                            <View style={s.xpChip}>
                              <Ionicons name="star" size={8} color="#10b981" />
                              <Text style={s.xpChipText}>{lesson.xp}</Text>
                            </View>
                          ) : <View />}

                          <View style={[
                            s.statusChip,
                            isFinished ? s.chipDone : isLocked ? s.chipLocked : s.chipNew,
                          ]}>
                            <Text style={[s.statusChipText, isLocked && { color: "#94a3b8" }]}>
                              {isFinished ? "Kryer" : isLocked ? "Premium" : "Fillo"}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
        <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // MIXED QUIZ
  // ══════════════════════════════════════════════════════════════════
  if (gameState === "mixedQuiz") {
    const mixWord = mixedWords[currentWordIndex];
    if (!mixWord) return null;

    function handleMixLetter(letter, idx) {
      setCurrentAnswer((p) => p + letter);
      setUsedIndices((p) => [...p, idx]);
    }
    function handleMixBackspace() {
      setCurrentAnswer((p) => p.slice(0, -1));
      setUsedIndices((p) => p.slice(0, -1));
    }
    function handleMixSubmit() {
      if (!currentAnswer.trim()) return;
      const isCorrect = currentAnswer.trim().toLowerCase() === mixWord.german.trim().toLowerCase();
      const newAnswers = [...userAnswers, { word: mixWord, answer: currentAnswer, correct: isCorrect }];
      setUserAnswers(newAnswers);
      setCurrentAnswer("");
      if (currentWordIndex + 1 < mixedWords.length) {
        const next = currentWordIndex + 1;
        setCurrentWordIndex(next);
        setUsedIndices([]);
        setShuffledLetters(shuffleWord(mixedWords[next].german));
        const pct = ((next + 1) / mixedWords.length) * 100;
        Animated.timing(progressAnim, { toValue: pct, duration: 380, useNativeDriver: false }).start();
      } else {
        setResults(newAnswers);
        setGameState("mixedResults");
      }
    }

    const progressWidth = progressAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });

    return (
      <View style={s.root}>
        <SafeAreaView style={{ flex: 1 }}>
          {/* Top bar */}
          <View style={s.playBar}>
            <TouchableOpacity onPress={backToMenu} style={s.playClose}>
              <Ionicons name="close" size={18} color="#475569" />
            </TouchableOpacity>
            <View style={s.playProgress}>
              <Animated.View style={[s.playProgressFill, { width: progressWidth, backgroundColor: "#f59e0b" }]} />
            </View>
            <Text style={s.playCounter}>{currentWordIndex + 1}/{mixedWords.length}</Text>
          </View>

          <View style={s.playBody}>
            {/* Mixed quiz badge */}
            <View style={[s.mixBadge]}>
              <Ionicons name="shuffle" size={12} color="#f59e0b" />
              <Text style={s.mixBadgeText}>Kuiz i Përzier</Text>
            </View>

            {/* Albanian prompt */}
            <Text style={s.playHint}>Shkruaj fjalën gjermane për:</Text>
            <View style={s.promptCard}>
              <Text style={s.promptWord}>{mixWord.albanian}</Text>
            </View>

            {/* Answer display */}
            <View style={s.answerRow}>
              {currentAnswer.split("").map((ch, i) => (
                <View key={i} style={s.answerLetter}><Text style={s.answerLetterText}>{ch}</Text></View>
              ))}
              {currentAnswer.length === 0 && (
                <Text style={s.answerPlaceholder}>Zgjidhni shkronjat…</Text>
              )}
            </View>

            {/* Letter tiles */}
            <View style={s.lettersGrid}>
              {shuffledLetters.map((letter, idx) => {
                const used = usedIndices.includes(idx);
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[s.letterTile, used && s.letterTileUsed]}
                    onPress={() => !used && handleMixLetter(letter, idx)}
                    disabled={used}
                    activeOpacity={0.75}
                  >
                    <Text style={[s.letterTileText, used && s.letterTileTextUsed]}>{letter}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Actions */}
            <View style={s.playActions}>
              <TouchableOpacity style={s.eraseBtn} onPress={handleMixBackspace}>
                <Ionicons name="backspace-outline" size={18} color="#64748b" />
                <Text style={s.eraseBtnText}>Fshi</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.submitBtn, !currentAnswer && s.submitBtnDisabled]}
                onPress={handleMixSubmit}
                disabled={!currentAnswer}
                activeOpacity={0.85}
              >
                <LinearGradient colors={["#f59e0b", "#ea580c"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.submitBtnInner}>
                  <Text style={s.submitBtnText}>Dërgo</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── Mixed quiz results ────────────────────────────────────────────────────────
  if (gameState === "mixedResults" && results) {
    const correct = results.filter((r) => r.correct).length;
    const pct     = Math.round((correct / results.length) * 100);
    return (
      <View style={s.root}>
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={s.resultsScroll}>
            <Text style={{ fontSize: 64, textAlign: "center", marginBottom: 12 }}>
              {pct >= 70 ? "🏆" : "📚"}
            </Text>
            <Text style={s.resultsTitle}>Kuiz i Përzier Përfunduar!</Text>
            <View style={s.resultsStats}>
              <View style={[s.statCard, { backgroundColor: "#f0fdf4", borderColor: "#a7f3d0" }]}>
                <Text style={s.statLabel}>Rezultati</Text>
                <Text style={[s.statValue, { color: "#059669" }]}>{pct}%</Text>
              </View>
              <View style={[s.statCard, { backgroundColor: "#eff6ff", borderColor: "#93c5fd" }]}>
                <Text style={s.statLabel}>Saktë</Text>
                <Text style={[s.statValue, { color: "#2563eb" }]}>{correct}/{results.length}</Text>
              </View>
            </View>

            {results.map((r, i) => (
              <View key={i} style={[s.resultRow, { backgroundColor: r.correct ? "#f0fdf4" : "#fff1f2", borderColor: r.correct ? "#a7f3d0" : "#fda4af" }]}>
                <Ionicons name={r.correct ? "checkmark-circle" : "close-circle"} size={20} color={r.correct ? "#10b981" : "#ef4444"} />
                <View style={{ flex: 1 }}>
                  <Text style={s.resultAlb}>{r.word.albanian}</Text>
                  <Text style={[s.resultGer, { color: r.correct ? "#059669" : "#ef4444" }]}>
                    {r.answer}
                    {!r.correct && <Text style={{ color: "#64748b" }}> → {r.word.german}</Text>}
                  </Text>
                </View>
              </View>
            ))}

            <TouchableOpacity style={s.backMenuBtn} onPress={backToMenu}>
              <Text style={s.backMenuBtnText}>Kthehu te Mësimet</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // PLAYING
  // ══════════════════════════════════════════════════════════════════
  if (gameState === "playing" && currentWord) {
    const progressWidth = progressAnim.interpolate({
      inputRange: [0, 100],
      outputRange: ["0%", "100%"],
    });

    return (
      <View style={s.root}>
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={s.playScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Back */}
            <TouchableOpacity style={s.backBtn} onPress={backToMenu} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={15} color="#475569" />
              <Text style={s.backBtnText}>Kthehu</Text>
            </TouchableOpacity>

            <View style={s.playCard}>
              {/* Progress */}
              <View style={s.progressRow}>
                <Text style={s.progressLabel}>Progresi</Text>
                <View style={s.progressBadge}>
                  <Text style={s.progressBadgeText}>
                    {currentWordIndex + 1} / {currentLesson.words.length}
                  </Text>
                </View>
              </View>
              <View style={s.progressTrack}>
                <Animated.View style={[s.progressFill, { width: progressWidth }]} />
              </View>

              {/* Albanian prompt */}
              <View style={s.promptBox}>
                <Text style={s.promptLabel}>Formo fjalën gjermane për:</Text>
                <Text style={s.promptWord}>{currentWord.albanian}</Text>
              </View>

              {/* Answer display */}
              <View style={s.answerBox}>
                <Text style={[s.answerText, !currentAnswer && s.answerPlaceholder]}>
                  {currentAnswer || "· · ·"}
                </Text>
              </View>

              {/* Letter tiles */}
              <View style={s.tilesWrap}>
                {shuffledLetters.map((letter, idx) => {
                  const used = usedIndices.includes(idx);
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[s.tile, used && s.tileUsed]}
                      onPress={() => !used && handleLetterPress(letter, idx)}
                      disabled={used}
                      activeOpacity={0.65}
                    >
                      <Text style={[s.tileLetter, used && s.tileLetterUsed]}>
                        {letter.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Action buttons */}
              <View style={s.actions}>
                <TouchableOpacity style={s.deleteBtn} onPress={handleBackspace} activeOpacity={0.8}>
                  <Ionicons name="backspace-outline" size={17} color="#64748b" />
                  <Text style={s.deleteBtnText}>Fshi</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.submitBtn, (!currentAnswer.trim() || loading) && s.submitBtnOff]}
                  onPress={handleSubmitWord}
                  disabled={!currentAnswer.trim() || loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={
                      currentAnswer.trim() && !loading
                        ? ["#10b981", "#0d9488"]
                        : ["#e2e8f0", "#e2e8f0"]
                    }
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={s.submitBtnInner}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons
                          name="send"
                          size={14}
                          color={currentAnswer.trim() ? "#fff" : "#94a3b8"}
                        />
                        <Text style={[s.submitText, !currentAnswer.trim() && { color: "#94a3b8" }]}>
                          Dërgo
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // RESULTS
  // ══════════════════════════════════════════════════════════════════
  if (gameState === "results" && results) {
    return (
      <View style={s.root}>
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={s.resultsScroll} showsVerticalScrollIndicator={false}>
            <View style={s.resultsCard}>

              {/* Trophy / X */}
              <Ionicons
                name={results.passed ? "trophy" : "close-circle"}
                size={48}
                color={results.passed ? "#f59e0b" : "#f87171"}
                style={{ alignSelf: "center", marginBottom: 10 }}
              />
              <Text style={[s.resultTitle, { color: results.passed ? "#10b981" : "#ef4444" }]}>
                {results.passed ? "Urime!" : "Përpiqu Përsëri!"}
              </Text>
              <Text style={s.resultSub}>
                {results.passed
                  ? "Kalove mësimin me sukses!"
                  : "Nevojitet 75% ose më shumë për të kaluar"}
              </Text>

              {/* Stats */}
              <View style={s.statsRow}>
                <StatCard
                  label="Rezultati" value={`${results.scorePercentage}%`}
                  color="#10b981" bg="#ecfdf5" border="#6ee7b7"
                />
                <StatCard
                  label="Të sakta" value={`${results.correctCount}/${results.totalWords}`}
                  color="#0d9488" bg="#f0fdfa" border="#99f6e4"
                />
                <StatCard
                  label="XP Fituar" value={`+${results.xpAwarded}`}
                  color="#d97706" bg="#fffbeb" border="#fcd34d"
                />
              </View>

              {/* Detail rows */}
              <Text style={s.detailsHeader}>Detajet</Text>
              {results.results?.map((r, i) => (
                <View
                  key={i}
                  style={[s.detailRow, r.isCorrect ? s.detailCorrect : s.detailWrong]}
                >
                  <View style={{ flex: 1 }}>
                    <View style={s.detailAnswerRow}>
                      <Text style={s.detailAlbanian}>{currentLesson.words[i]?.albanian}</Text>
                      <Text style={s.detailArrow}>→</Text>
                      <Text style={[s.detailAnswer, r.isCorrect ? s.colorGreen : s.colorRed]}>
                        {r.userAnswer}
                      </Text>
                    </View>
                    {!r.isCorrect && (
                      <Text style={s.detailCorrection}>
                        E saktë:{" "}
                        <Text style={{ fontFamily: F.bold, color: "#059669" }}>
                          {currentLesson.words[i]?.german}
                        </Text>
                      </Text>
                    )}
                  </View>
                  <Ionicons
                    name={r.isCorrect ? "checkmark-circle" : "close-circle"}
                    size={17}
                    color={r.isCorrect ? "#10b981" : "#ef4444"}
                  />
                </View>
              ))}

              {/* Back button */}
              <TouchableOpacity style={s.backToMenuBtn} onPress={backToMenu} activeOpacity={0.85}>
                <LinearGradient
                  colors={["#10b981", "#0d9488"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={s.backToMenuInner}
                >
                  <Ionicons name="arrow-back" size={15} color="#fff" />
                  <Text style={s.backToMenuText}>Kthehu te Menuja</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
        <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />
      </View>
    );
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },

  // ── Hero
  hero: {
    paddingHorizontal: 20, paddingTop: 22, paddingBottom: 38,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    overflow: "hidden", position: "relative",
  },
  heroBubble1: {
    position: "absolute", top: -40, right: -40,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  heroBubble2: {
    position: "absolute", bottom: -50, right: 60,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  heroBadge: {
    flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 10,
  },
  heroBadgeText: {
    color: "rgba(255,255,255,0.85)", fontSize: 11,
    fontFamily: F.semi, textTransform: "uppercase", letterSpacing: 0.8,
  },
  heroTitle: {
    color: "#fff", fontSize: 32, fontFamily: F.black,
    marginBottom: 6, letterSpacing: -0.5,
  },
  heroSub: { color: "rgba(255,255,255,0.75)", fontSize: 13, lineHeight: 20 },

  // ── Body
  body: { padding: 16, marginTop: -12 },

  // ── Filter card
  filterCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    marginBottom: 14,
    shadowColor: "#000", shadowOpacity: 0.05,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  filterTitle: { fontSize: 13, fontFamily: F.bold, color: "#374151", marginBottom: 12 },
  levelRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  levelBtn: { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 12 },
  levelBtnText: { fontSize: 12, fontFamily: F.xbold },

  // ── Empty / loading
  centered: { alignItems: "center", paddingVertical: 40 },
  loadingText: { color: "#94a3b8", fontSize: 13, marginTop: 12 },
  emptyBox: {
    alignItems: "center", padding: 32, backgroundColor: "#fff",
    borderRadius: 20, borderWidth: 1, borderColor: "#f1f5f9",
  },
  emptyTitle: { color: "#374151", fontSize: 15, fontFamily: F.bold, marginTop: 12 },
  emptySub: { color: "#94a3b8", fontSize: 13, marginTop: 4 },

  // ── Lesson cards grid
  lessonGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  lessonCard: {
    width: CARD_W,
    backgroundColor: "#fff", borderRadius: 18, padding: 14,
    borderWidth: 1.5, borderBottomWidth: 4,
    borderColor: "#f1f5f9", borderBottomColor: "#ddd8d2",
    shadowColor: "#000", shadowOpacity: 0.08,
    shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  lessonCardDone:   { backgroundColor: "#fffbeb", borderColor: "#fcd34d", borderBottomColor: "#f59e0b" },
  lessonCardLocked: { backgroundColor: "#f8fafc", borderColor: "#e2e8f0", borderBottomColor: "#cbd5e1" },
  lvlBadge: {
    position: "absolute", top: 10, right: 10,
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 7, borderWidth: 1,
  },
  lvlBadgeText: { fontSize: 9, fontFamily: F.xbold },
  lockWrap: {
    position: "absolute", top: 11, left: 11,
    width: 22, height: 22, borderRadius: 6,
    backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#e2e8f0",
    alignItems: "center", justifyContent: "center",
  },
  lessonTitle: {
    color: "#1e293b", fontSize: 13, fontFamily: F.bold,
    marginTop: 26, marginBottom: 4, lineHeight: 18,
  },
  lessonWordCount: { color: "#94a3b8", fontSize: 11, fontFamily: F.regular, marginBottom: 10 },
  lessonDivider: { borderTopWidth: 1, borderColor: "#f0ede8", marginBottom: 10 },
  lessonFooter: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  xpChip: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "#f0fdf4", borderRadius: 6,
    paddingHorizontal: 5, paddingVertical: 2,
    borderWidth: 1, borderColor: "#a7f3d0",
  },
  xpChipText: { color: "#10b981", fontSize: 9, fontFamily: F.semi },
  statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  chipNew:    { backgroundColor: "#10b981" },
  chipDone:   { backgroundColor: "#f59e0b" },
  chipLocked: { backgroundColor: "#e2e8f0" },
  statusChipText: { color: "#fff", fontSize: 10, fontFamily: F.bold },

  // ── Playing
  playScroll: { padding: 16, paddingBottom: 32 },
  backBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0",
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9,
    marginBottom: 16,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  backBtnText: { color: "#475569", fontSize: 13, fontFamily: F.semi },
  playCard: {
    backgroundColor: "#fff", borderRadius: 20, padding: 20,
    borderWidth: 2, borderColor: "#6ee7b7",
    shadowColor: "#10b981", shadowOpacity: 0.1,
    shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },

  // Progress
  progressRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 8,
  },
  progressLabel: { fontSize: 12, color: "#64748b", fontFamily: F.regular },
  progressBadge: {
    backgroundColor: "#ecfdf5", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: "#a7f3d0",
  },
  progressBadgeText: { color: "#065f46", fontSize: 11, fontFamily: F.bold },
  progressTrack: {
    height: 7, backgroundColor: "#f1f5f9",
    borderRadius: 4, overflow: "hidden", marginBottom: 22,
  },
  progressFill: { height: "100%", backgroundColor: "#10b981", borderRadius: 4 },

  // Prompt
  promptBox: { alignItems: "center", marginBottom: 20 },
  promptLabel: { color: "#94a3b8", fontSize: 13, marginBottom: 6 },
  promptWord: {
    color: "#0f172a", fontSize: 30, fontFamily: F.black, letterSpacing: -0.5,
  },

  // Answer box
  answerBox: {
    backgroundColor: "#f8fafc", borderRadius: 14, padding: 18,
    minHeight: 64, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#d1fae5", marginBottom: 22,
  },
  answerText: {
    color: "#0f172a", fontSize: 26, fontFamily: F.bold, letterSpacing: 4,
  },
  answerPlaceholder: { color: "#e2e8f0" },

  // Tiles
  tilesWrap: {
    flexDirection: "row", flexWrap: "wrap",
    justifyContent: "center", gap: 8, marginBottom: 22,
  },
  tile: {
    width: 46, height: 46, borderRadius: 12,
    backgroundColor: "#ecfdf5", borderWidth: 2, borderColor: "#6ee7b7",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  tileUsed: {
    backgroundColor: "#f1f5f9", borderColor: "#e2e8f0", opacity: 0.35,
  },
  tileLetter: { color: "#065f46", fontSize: 17, fontFamily: F.xbold },
  tileLetterUsed: { color: "#94a3b8" },

  // Action buttons
  actions: { flexDirection: "row", gap: 10 },
  deleteBtn: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 6,
    backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0",
    borderRadius: 14, paddingVertical: 14,
  },
  deleteBtnText: { color: "#475569", fontSize: 13, fontFamily: F.semi },
  submitBtn: { flex: 2, borderRadius: 14, overflow: "hidden" },
  submitBtnOff: {},
  submitBtnInner: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 7, paddingVertical: 14,
  },
  submitText: { color: "#fff", fontSize: 14, fontFamily: F.bold },

  // ── Results
  resultsScroll: { padding: 16, paddingBottom: 32 },
  resultsCard: {
    backgroundColor: "#fff", borderRadius: 20, padding: 20,
    borderWidth: 2, borderColor: "#6ee7b7",
    shadowColor: "#10b981", shadowOpacity: 0.1,
    shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  resultTitle: {
    fontSize: 24, fontFamily: F.xbold, textAlign: "center",
    marginBottom: 4, letterSpacing: -0.3,
  },
  resultSub: { color: "#64748b", fontSize: 13, textAlign: "center", marginBottom: 20 },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, borderRadius: 12, padding: 12,
    alignItems: "center", borderWidth: 1,
  },
  statLabel: {
    color: "#94a3b8", fontSize: 9, fontFamily: F.bold,
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4,
  },
  statValue: { fontSize: 19, fontFamily: F.black },

  detailsHeader: {
    fontSize: 13, fontFamily: F.bold, color: "#374151", marginBottom: 10,
  },
  detailRow: {
    flexDirection: "row", alignItems: "center",
    padding: 12, borderRadius: 12, borderWidth: 1,
    marginBottom: 8, gap: 10,
  },
  detailCorrect: { backgroundColor: "#ecfdf5", borderColor: "#a7f3d0" },
  detailWrong:   { backgroundColor: "#fef2f2", borderColor: "#fca5a5" },
  detailAnswerRow: {
    flexDirection: "row", alignItems: "center",
    gap: 6, flexWrap: "wrap", marginBottom: 2,
  },
  detailAlbanian: { color: "#1e293b", fontSize: 13, fontFamily: F.bold },
  detailArrow: { color: "#94a3b8", fontSize: 12 },
  detailAnswer: { fontSize: 13, fontFamily: F.bold, letterSpacing: 0.5 },
  colorGreen: { color: "#059669" },
  colorRed:   { color: "#ef4444" },
  detailCorrection: { color: "#6ee7b7", fontSize: 11 },

  backToMenuBtn: { marginTop: 16, borderRadius: 14, overflow: "hidden" },
  backToMenuInner: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8, paddingVertical: 14,
  },
  backToMenuText: { color: "#fff", fontSize: 14, fontFamily: F.bold },

  // ── Paywall modal
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center", justifyContent: "center", padding: 24,
  },
  paywallCard: {
    backgroundColor: "#fff", borderRadius: 24, padding: 28,
    alignItems: "center", width: "100%",
    shadowColor: "#000", shadowOpacity: 0.15,
    shadowRadius: 20, elevation: 12,
  },
  paywallIconBox: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: "#fffbeb", borderWidth: 2, borderColor: "#fcd34d",
    alignItems: "center", justifyContent: "center", marginBottom: 18,
  },
  paywallTitle: { fontSize: 20, fontFamily: F.xbold, color: "#0f172a", marginBottom: 8 },
  paywallSub: {
    fontSize: 13, color: "#64748b", textAlign: "center",
    marginBottom: 6, lineHeight: 20,
  },
  paywallDesc: {
    fontSize: 12, color: "#94a3b8", textAlign: "center",
    marginBottom: 20, lineHeight: 18,
  },
  paywallPrimaryBtn: { width: "100%", borderRadius: 14, overflow: "hidden", marginBottom: 10 },
  paywallBtnInner: { paddingVertical: 14, alignItems: "center" },
  paywallPrimaryText: { color: "#fff", fontSize: 14, fontFamily: F.bold },
  paywallSecondaryBtn: {
    width: "100%", paddingVertical: 13, borderRadius: 14,
    backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0",
    alignItems: "center",
  },
  paywallSecondaryText: { color: "#64748b", fontSize: 13, fontFamily: F.semi },

  // ── Mix quiz button (in header)
  mixBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
  },
  mixBtnText: { color: "#fff", fontSize: 13, fontFamily: F.bold, flex: 1 },
  mixBtnBadge: {
    backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  mixBtnBadgeTxt: { color: "rgba(255,255,255,0.9)", fontSize: 11, fontFamily: F.bold },

  // ── Mixed quiz screen
  playBar: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "#f1f5f9",
  },
  playClose: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0",
    alignItems: "center", justifyContent: "center",
  },
  playProgress: {
    flex: 1, height: 8, backgroundColor: "#f1f5f9",
    borderRadius: 4, overflow: "hidden",
  },
  playProgressFill: { height: "100%", borderRadius: 4 },
  playCounter: {
    color: "#64748b", fontSize: 12, fontFamily: F.bold,
    minWidth: 30, textAlign: "right",
  },
  playBody: { flex: 1, padding: 16 },
  playHint: { color: "#94a3b8", fontSize: 13, textAlign: "center", marginBottom: 8 },

  mixBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#fffbeb", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    alignSelf: "center", borderWidth: 1, borderColor: "#fcd34d", marginBottom: 12,
  },
  mixBadgeText: { color: "#d97706", fontSize: 12, fontFamily: F.bold },

  promptCard: {
    backgroundColor: "#f8fafc", borderRadius: 16, padding: 20,
    alignItems: "center", marginBottom: 20,
    borderWidth: 1.5, borderColor: "#fcd34d",
  },

  answerRow: {
    flexDirection: "row", flexWrap: "wrap", gap: 6,
    justifyContent: "center", minHeight: 50, alignItems: "center",
    backgroundColor: "#f8fafc", borderRadius: 14, padding: 12,
    marginBottom: 20, borderWidth: 2, borderColor: "#fcd34d",
  },
  answerLetter: {
    backgroundColor: "#fff", borderRadius: 8, width: 36, height: 36,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#fcd34d",
  },
  answerLetterText: { color: "#0f172a", fontSize: 18, fontFamily: F.bold },

  lettersGrid: {
    flexDirection: "row", flexWrap: "wrap",
    justifyContent: "center", gap: 8, marginBottom: 20,
  },
  letterTile: {
    width: 46, height: 46, borderRadius: 12,
    backgroundColor: "#fffbeb", borderWidth: 2, borderColor: "#fcd34d",
    alignItems: "center", justifyContent: "center",
  },
  letterTileUsed: { backgroundColor: "#f1f5f9", borderColor: "#e2e8f0", opacity: 0.35 },
  letterTileText: { color: "#92400e", fontSize: 17, fontFamily: F.xbold },
  letterTileTextUsed: { color: "#94a3b8" },

  playActions: { flexDirection: "row", gap: 10 },
  eraseBtn: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 6,
    backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0",
    borderRadius: 14, paddingVertical: 14,
  },
  eraseBtnText: { color: "#475569", fontSize: 13, fontFamily: F.semi },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: "#fff", fontSize: 14, fontFamily: F.bold },

  // ── Mixed quiz results
  resultsTitle: {
    fontSize: 22, fontFamily: F.xbold, color: "#0f172a",
    textAlign: "center", marginBottom: 16,
  },
  resultsStats: { flexDirection: "row", gap: 10, marginBottom: 20 },
  resultRow: {
    flexDirection: "row", alignItems: "center",
    padding: 12, borderRadius: 12, borderWidth: 1,
    marginBottom: 8, gap: 10,
  },
  resultAlb: { color: "#1e293b", fontSize: 13, fontFamily: F.bold },
  resultGer: { fontSize: 12, fontFamily: F.semi, marginTop: 2 },
  backMenuBtn: {
    marginTop: 20, backgroundColor: "#10b981",
    borderRadius: 14, paddingVertical: 14, alignItems: "center",
  },
  backMenuBtnText: { color: "#fff", fontSize: 14, fontFamily: F.bold },
});
