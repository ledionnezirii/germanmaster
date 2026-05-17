import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { quizService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const OPTION_LABELS = ["A", "B", "C", "D"];
const OPTION_KEYS = ["a", "b", "c", "d"];

const TYPE_LABELS = {
  "multiple-choice": "Zgjedhje e shumëfishtë",
  "fill-in": "Plotëso",
  "drop-down": "Zgjidhni",
};

export default function QuizDetailScreen({ route, navigation }) {
  const { refreshUser } = useAuth();
  const { quiz } = route.params;
  const insets = useSafeAreaInsets();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submittedAnswers, setSubmittedAnswers] = useState({});
  const [history, setHistory] = useState([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadQuiz();
  }, []);

  useEffect(() => {
    const submitted = submittedAnswers[currentIndex];
    if (!submitted || submitted.isCorrect) return;
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -9, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  9, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -7, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  7, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -4, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  0, duration: 45, useNativeDriver: true }),
    ]).start();
  }, [submittedAnswers[currentIndex]]);

  async function loadQuiz() {
    // Questions are already embedded in route params — use them directly
    if (Array.isArray(quiz.questions) && quiz.questions.length > 0) {
      setQuestions(quiz.questions);
      setLoading(false);
      return;
    }
    // Fallback: fetch from API (mixed quizzes or params without questions)
    try {
      if (quiz.isMixed) {
        setQuestions([]);
        return;
      }
      const res = await quizService.getById(quiz._id);
      const data = res.data || {};
      setQuestions(Array.isArray(data.questions) ? data.questions : []);
    } catch (err) {
      console.warn("loadQuiz error:", err?.message);
      Alert.alert("Gabim", "Nuk mund të ngarkojmë këtë kuiz.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const currentAnswer = answers[currentIndex] ?? "";
  const submittedAnswer = submittedAnswers[currentIndex];
  const isSubmitted = Boolean(submittedAnswer);
  const progress = totalQuestions ? ((currentIndex + 1) / totalQuestions) * 100 : 0;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  const summary = useMemo(() => {
    const correctAnswers = history.filter(Boolean).length;
    const total = history.length || totalQuestions;
    const percentage = total ? Math.round((correctAnswers / total) * 100) : 0;
    return {
      correctAnswers,
      totalQuestions: total,
      percentage,
      wrongAnswers: Math.max(total - correctAnswers, 0),
      passed: percentage >= 70,
    };
  }, [history, totalQuestions]);

  function resetQuizState() {
    setCurrentIndex(0);
    setAnswers({});
    setSubmittedAnswers({});
    setHistory([]);
    setCurrentStreak(0);
    setScore(0);
    setResult(null);
    setSubmitting(false);
  }

  function normalizeAnswerForQuestion(question, answer) {
    if (!question) return answer;
    if (question.type === "fill-in") return String(answer || "").trim();
    return answer;
  }

  function getOptionKey(index) {
    return OPTION_KEYS[index] || String(index + 1);
  }

  function getOptionTextFromStoredAnswer(question, storedAnswer) {
    if (!question || !Array.isArray(question.options)) return String(storedAnswer || "");
    const normalized = String(storedAnswer || "").trim().toLowerCase();
    const optionIndex = OPTION_KEYS.indexOf(normalized);
    if (optionIndex >= 0 && question.options[optionIndex] !== undefined) {
      return question.options[optionIndex];
    }
    return String(storedAnswer || "");
  }

  function isCorrectAnswer(question, answer) {
    const expected = String(question?.correctAnswer || "").trim().toLowerCase();
    const received = String(answer || "").trim().toLowerCase();
    return expected === received;
  }

  function handleAnswer(answer) {
    if (!currentQuestion || isSubmitted) return;

    const normalizedAnswer = normalizeAnswerForQuestion(currentQuestion, answer);
    const correct = isCorrectAnswer(currentQuestion, normalizedAnswer);
    const xpPerQuestion = Math.round((quiz.xp || 0) / Math.max(totalQuestions, 1));
    const streakAfterAnswer = correct ? currentStreak + 1 : 0;

    setAnswers((prev) => ({ ...prev, [currentIndex]: normalizedAnswer }));
    setSubmittedAnswers((prev) => ({
      ...prev,
      [currentIndex]: { answer: normalizedAnswer, isCorrect: correct },
    }));
    setHistory((prev) => {
      const next = [...prev];
      next[currentIndex] = correct;
      return next;
    });
    setCurrentStreak(streakAfterAnswer);

    if (correct) {
      const gained = streakAfterAnswer > 2 ? xpPerQuestion * 2 : xpPerQuestion;
      setScore((prev) => prev + gained);
    }

    setTimeout(() => {
      if (!isLastQuestion) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        submitQuiz();
      }
    }, 700);
  }

  async function submitQuiz() {
    if (!questions.length) return;
    setSubmitting(true);

    const answersArray = questions.map((_, index) => answers[index] || "");

    try {
      if (quiz.isMixed) {
        const correctAnswers = questions.reduce((count, question, index) => {
          return count + (isCorrectAnswer(question, answersArray[index]) ? 1 : 0);
        }, 0);
        const percentage = Math.round((correctAnswers / questions.length) * 100);
        setResult({ passed: percentage >= 70, percentage, xpEarned: 0, correctAnswers, totalQuestions: questions.length, alreadyCompleted: false });
        return;
      }

      const res = await quizService.submit(quiz._id, { answers: answersArray });
      const data = res.data || {};

      if (data.limitReached) {
        Alert.alert("Premium i nevojshëm", "Keni arritur kufirin falas. Upgrade-oni për të zhbllokuar më shumë kuize.");
      }

      setResult(data);
      if (data.passed) await refreshUser();
    } catch {
      const correctAnswers = questions.reduce((count, question, index) => {
        return count + (isCorrectAnswer(question, answersArray[index]) ? 1 : 0);
      }, 0);
      const percentage = Math.round((correctAnswers / questions.length) * 100);
      setResult({ passed: percentage >= 70, percentage, xpEarned: 0, correctAnswers, totalQuestions: questions.length, alreadyCompleted: false });
    } finally {
      setSubmitting(false);
    }
  }

  function renderQuestionInput() {
    if (!currentQuestion) return null;

    if (currentQuestion.type === "fill-in") {
      return (
        <View style={styles.fillInWrap}>
          <TextInput
            value={currentAnswer}
            onChangeText={(value) =>
              !isSubmitted && setAnswers((prev) => ({ ...prev, [currentIndex]: value }))
            }
            editable={!isSubmitted}
            placeholder="Shkruaj përgjigjen tënde..."
            placeholderTextColor="#94a3b8"
            style={[
              styles.answerInput,
              isSubmitted && submittedAnswer?.isCorrect && styles.answerInputCorrect,
              isSubmitted && !submittedAnswer?.isCorrect && styles.answerInputWrong,
            ]}
          />
          <TouchableOpacity
            activeOpacity={0.88}
            disabled={!currentAnswer.trim() || isSubmitted}
            onPress={() => handleAnswer(currentAnswer)}
            style={[
              styles.submitAnswerBtn,
              (!currentAnswer.trim() || isSubmitted) && styles.submitAnswerBtnDisabled,
            ]}
          >
            <Text style={styles.submitAnswerText}>Kontrollo</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const options = [...new Set(currentQuestion.options || [])];

    return (
      <View style={styles.optionsWrap}>
        {options.map((option, index) => {
          const optionLabel = OPTION_LABELS[index] || `${index + 1}`;
          const optionKey = getOptionKey(index);
          const wasSelected = submittedAnswer?.answer === optionKey;
          const isCorrect = String(currentQuestion.correctAnswer || "").trim().toLowerCase() === optionKey;

          let optionStyle = null;
          let optionTextStyle = null;

          if (isSubmitted) {
            if (wasSelected && submittedAnswer?.isCorrect) {
              optionStyle = styles.optionCorrect;
              optionTextStyle = styles.optionTextCorrect;
            } else if (wasSelected && !submittedAnswer?.isCorrect) {
              optionStyle = styles.optionWrong;
              optionTextStyle = styles.optionTextWrong;
            } else if (isCorrect) {
              optionStyle = styles.optionReveal;
              optionTextStyle = styles.optionTextCorrect;
            }
          }

          const isWrongSelected = wasSelected && isSubmitted && !submittedAnswer?.isCorrect;
          return (
            <Animated.View
              key={`${option}-${index}`}
              style={isWrongSelected ? { transform: [{ translateX: shakeAnim }] } : undefined}
            >
              <TouchableOpacity
                activeOpacity={0.9}
                disabled={isSubmitted}
                onPress={() => handleAnswer(optionKey)}
                style={[styles.optionCard, optionStyle]}
              >
                <View style={[styles.optionLabelBox, optionStyle && styles.optionLabelBoxActive]}>
                  <Text style={[styles.optionLabelText, optionTextStyle]}>{optionLabel}</Text>
                </View>
                <Text style={[styles.optionText, optionTextStyle]}>{option}</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    );
  }

  function renderResultScreen() {
    const payload = result || summary;
    const passed = Boolean(payload.passed ?? summary.passed);
    const percentage = payload.percentage ?? payload.score ?? summary.percentage;
    const correctAnswers = payload.correctAnswers ?? summary.correctAnswers;
    const total = payload.totalQuestions ?? summary.totalQuestions;
    const xpEarned = payload.xpEarned || payload.xpAwarded || 0;

    return (
      <ScrollView contentContainerStyle={styles.resultScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.resultHero}>
          <View style={[styles.resultIconWrap, passed ? styles.resultIconWrapPass : styles.resultIconWrapFail]}>
            <Ionicons
              name={passed ? "trophy" : "refresh-circle"}
              size={34}
              color={passed ? "#166534" : "#9a3412"}
            />
          </View>
          <Text style={styles.resultTitle}>{passed ? "Kuizi kaloi!" : "Provo sërish"}</Text>
          <Text style={styles.resultText}>
            {passed
              ? "Keni kaluar kuizin dhe progresi juaj është ruajtur."
              : "Mund të riprovo menjëherë dhe të përmirësosh rezultatin."}
          </Text>
        </View>

        <View style={styles.scoreRing}>
          <Text style={styles.scoreRingValue}>{percentage}%</Text>
          <Text style={styles.scoreRingLabel}>Rezultati final</Text>
        </View>

        <View style={styles.resultStatsRow}>
          <ResultStat label="Saktë" value={`${correctAnswers}`} accent="#16a34a" />
          <ResultStat label="Gabim" value={`${Math.max(total - correctAnswers, 0)}`} accent="#dc2626" />
          <ResultStat label="XP" value={`${xpEarned}`} accent="#d97706" />
        </View>

        <View style={styles.resultSummaryCard}>
          <View style={styles.resultSummaryRow}>
            <Text style={styles.resultSummaryLabel}>Pyetje</Text>
            <Text style={styles.resultSummaryValue}>{total}</Text>
          </View>
          <View style={styles.resultSummaryRow}>
            <Text style={styles.resultSummaryLabel}>Seria finale</Text>
            <Text style={styles.resultSummaryValue}>{currentStreak}</Text>
          </View>
          <View style={styles.resultSummaryRow}>
            <Text style={styles.resultSummaryLabel}>XP sesioni</Text>
            <Text style={styles.resultSummaryValue}>{score} XP</Text>
          </View>
        </View>

        <TouchableOpacity activeOpacity={0.88} style={styles.primaryBtn} onPress={resetQuizState}>
          <Text style={styles.primaryBtnText}>Riprovo kuizin</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.88} style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryBtnText}>Kthehu te kuizet</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (loading) {
    return (
      <LinearGradient colors={["#312e81", "#4f46e5"]} style={styles.loadingScreen}>
        <ActivityIndicator color="#ffffff" size="large" />
      </LinearGradient>
    );
  }

  if (!questions.length) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyTitle}>Ky kuiz nuk ka pyetje ende.</Text>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryBtnText}>Kthehu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (result) {
    return (
      <LinearGradient colors={["#eff6ff", "#ffffff"]} style={styles.resultScreen}>
        <SafeAreaView style={{ flex: 1 }}>{renderResultScreen()}</SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
        {/* Header + timeline — single gradient block */}
        <LinearGradient
          colors={["#fefcf8", "#fdf9f3", "#faf5ee"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientHeader, { paddingTop: insets.top + 14 }]}
        >
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color="#1e293b" />
            </TouchableOpacity>
            <View style={styles.topBarTextWrap}>
              <Text numberOfLines={1} style={styles.quizName}>{quiz.title || "Kuiz"}</Text>
              <Text style={styles.quizMeta}>Pyetja {currentIndex + 1} nga {totalQuestions}</Text>
            </View>
            {quiz.xp ? (
              <LinearGradient
                colors={["#fbbf24", "#f59e0b", "#b45309"]}
                start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                style={styles.xpPill}
              >
                <Ionicons name="star" size={13} color="#fff" />
                <Text style={styles.xpPillText}>+{quiz.xp} XP</Text>
              </LinearGradient>
            ) : null}
            <LinearGradient
              colors={["#fb923c", "#f97316", "#c2410c"]}
              start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
              style={styles.streakPill}
            >
              <Ionicons name="flame" size={14} color="#fff" />
              <Text style={styles.streakPillText}>{currentStreak}</Text>
            </LinearGradient>
          </View>

          <View style={styles.timelineCard}>
            <View style={styles.timelineDots}>
              {questions.map((_, index) => {
                const state = history[index];
                const isCurrent = index === currentIndex;
                return (
                  <View
                    key={index}
                    style={[
                      styles.timelineDot,
                      state === true && styles.timelineDotCorrect,
                      state === false && styles.timelineDotWrong,
                      state === undefined && !isCurrent && styles.timelineDotIdle,
                      isCurrent && styles.timelineDotCurrent,
                    ]}
                  />
                );
              })}
            </View>
          </View>
        </LinearGradient>

        {/* Main content — no scroll, fills screen */}
        <View style={styles.content}>
          {/* Progress */}
          <View style={styles.progressWrap}>
            <View style={styles.progressHeaderRow}>
              <Text style={styles.progressTitle}>Progresi</Text>
              <View style={styles.questionIndexPill}>
                <Text style={styles.questionIndexText}>{currentIndex + 1}/{totalQuestions}</Text>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <View style={styles.progressMetaRow}>
              <Text style={styles.progressMetaText}>{quiz.level || "A1"}</Text>
            </View>
          </View>

          {/* Question card — flex:1 fills all remaining space */}
          <View style={styles.questionCard}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ flexGrow: 1 }}
            >
              <View style={styles.questionBadge}>
                <Text style={styles.questionBadgeText}>
                  {TYPE_LABELS[currentQuestion.type] || currentQuestion.type}
                </Text>
              </View>
              <Text style={styles.questionTitle}>{currentQuestion.questionText}</Text>
              {renderQuestionInput()}
            </ScrollView>
          </View>

          {submitting ? (
            <View style={styles.submittingCard}>
              <ActivityIndicator color="#6366f1" size="small" />
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

function ResultStat({ label, value, accent }) {
  return (
    <View style={styles.resultStatCard}>
      <Text style={[styles.resultStatValue, { color: accent }]}>{value}</Text>
      <Text style={styles.resultStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f0f2f8",
  },
  safeArea: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  gradientHeader: {
    shadowColor: "#b8a898",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },

  // ── Top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.07)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  quizName: {
    color: "#1e293b",
    fontSize: 17,
    fontWeight: "800",
  },
  quizMeta: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 1,
  },
  xpPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: "#f59e0b",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  xpPillText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
  },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 7,
    shadowColor: "#f97316",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  streakPillText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
  },

  // ── Main content (no scroll)
  content: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 22,
    paddingBottom: 14,
    gap: 12,
  },

  // ── Progress
  progressWrap: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    borderBottomWidth: 4,
    borderBottomColor: "#c8d0da",
    shadowColor: "#6366f1",
    shadowOpacity: 0.09,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  progressHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  progressTitle: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "800",
  },
  questionIndexPill: {
    backgroundColor: "#ede9fe",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  questionIndexText: {
    color: "#6366f1",
    fontSize: 11,
    fontWeight: "800",
  },
  progressTrack: {
    height: 7,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
    overflow: "hidden",
  },
  progressFill: {
    height: 7,
    borderRadius: 999,
    backgroundColor: "#6366f1",
  },
  progressMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  progressMetaText: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // ── Question card
  questionCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    borderBottomWidth: 5,
    borderBottomColor: "#c8d0da",
    shadowColor: "#0f172a",
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  questionBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#ede9fe",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 14,
  },
  questionBadgeText: {
    color: "#6366f1",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // ── Answer banner (shown after user picks)
  answerBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  answerBannerCorrect: {
    backgroundColor: "#dcfce7",
    borderWidth: 1,
    borderColor: "#86efac",
  },
  answerBannerWrong: {
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#fca5a5",
  },
  answerBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  answerBannerTextCorrect: {
    color: "#166534",
  },
  answerBannerTextWrong: {
    color: "#b91c1c",
  },

  questionTitle: {
    color: "#0f172a",
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 30,
    marginBottom: 20,
  },

  // ── Options
  optionsWrap: {
    gap: 10,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderBottomWidth: 5,
    borderBottomColor: "#b8c4d0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  optionCorrect: {
    backgroundColor: "#f0fdf4",
    borderColor: "#4ade80",
    borderBottomColor: "#16a34a",
  },
  optionWrong: {
    backgroundColor: "#fef2f2",
    borderColor: "#f87171",
    borderBottomColor: "#b91c1c",
  },
  optionReveal: {
    backgroundColor: "#eff6ff",
    borderColor: "#93c5fd",
    borderBottomColor: "#3b82f6",
  },
  optionLabelBox: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e2e8f0",
  },
  optionLabelBoxActive: {
    backgroundColor: "#ffffff",
  },
  optionLabelText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "900",
  },
  optionText: {
    flex: 1,
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
  },
  optionTextCorrect: {
    color: "#166534",
  },
  optionTextWrong: {
    color: "#b91c1c",
  },

  // ── Fill-in
  fillInWrap: {
    gap: 12,
  },
  answerInput: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "600",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  answerInputCorrect: {
    borderColor: "#4ade80",
    backgroundColor: "#f0fdf4",
  },
  answerInputWrong: {
    borderColor: "#f87171",
    backgroundColor: "#fef2f2",
  },
  submitAnswerBtn: {
    backgroundColor: "#6366f1",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderBottomWidth: 4,
    borderBottomColor: "#4338ca",
    shadowColor: "#6366f1",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  submitAnswerBtnDisabled: {
    opacity: 0.4,
  },
  submitAnswerText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },

  // ── Timeline (part of the gradient header block)
  timelineCard: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  timelineDots: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  timelineDot: {
    width: 11,
    height: 11,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  timelineDotIdle: {
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  timelineDotCurrent: {
    backgroundColor: "#f59e0b",
    transform: [{ scale: 1.25 }],
  },
  timelineDotCorrect: {
    backgroundColor: "#22c55e",
  },
  timelineDotWrong: {
    backgroundColor: "#ef4444",
  },

  // ── Submitting
  submittingCard: {
    alignItems: "center",
    paddingVertical: 8,
  },

  // ── Result screen
  resultScreen: {
    flex: 1,
  },
  resultScroll: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 28,
  },
  resultHero: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 22,
  },
  resultIconWrap: {
    width: 78,
    height: 78,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  resultIconWrapPass: {
    backgroundColor: "#dcfce7",
  },
  resultIconWrapFail: {
    backgroundColor: "#ffedd5",
  },
  resultTitle: {
    color: "#0f172a",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 8,
  },
  resultText: {
    color: "#64748b",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 300,
  },
  scoreRing: {
    backgroundColor: "#ffffff",
    borderRadius: 30,
    paddingVertical: 28,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#0f172a",
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  scoreRingValue: {
    color: "#6366f1",
    fontSize: 48,
    fontWeight: "900",
  },
  scoreRingLabel: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "700",
  },
  resultStatsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  resultStatCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 12,
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  resultStatValue: {
    fontSize: 26,
    fontWeight: "900",
  },
  resultStatLabel: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  resultSummaryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 26,
    padding: 18,
    marginBottom: 18,
    gap: 14,
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  resultSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultSummaryLabel: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "700",
  },
  resultSummaryValue: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "900",
  },
  primaryBtn: {
    backgroundColor: "#6366f1",
    borderRadius: 22,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  secondaryBtn: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    paddingVertical: 16,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "800",
  },
  emptyWrap: {
    flex: 1,
    backgroundColor: "#f0f2f8",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 16,
  },
  emptyTitle: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
});
