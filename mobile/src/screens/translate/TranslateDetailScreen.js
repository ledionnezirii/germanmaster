import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { translateService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function TranslateDetailScreen({ route, navigation }) {
  const { refreshUser } = useAuth();
  const { textItem } = route.params;
  const insets = useSafeAreaInsets();

  const [fullText, setFullText] = useState(null);
  const [loading, setLoading] = useState(true);

  // Quiz state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [history, setHistory] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState(null); // null = in progress
  const [userAnswers, setUserAnswers] = useState([]);

  useEffect(() => {
    loadText();
  }, []);

  async function loadText() {
    try {
      const res = await translateService.getById(textItem._id);
      setFullText(res.data || res);
    } catch {
      Alert.alert("Gabim", "Nuk mund të ngarkohet teksti.");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }

  const questions = fullText?.questions || [];
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];
  const progressPct = totalQuestions
    ? ((currentIndex + 1) / totalQuestions) * 100
    : 0;

  function handleSelectOption(option) {
    if (answered) return;
    setSelectedAnswer(option);
    setAnswered(true);

    const newAnswers = [...userAnswers];
    newAnswers[currentIndex] = option;
    setUserAnswers(newAnswers);

    const newHistory = [
      ...history,
      {
        questionId: currentQuestion._id,
        answer: option,
        isCorrect: option === currentQuestion.correctAnswer,
      },
    ];
    setHistory(newHistory);

    setTimeout(() => {
      if (currentIndex < totalQuestions - 1) {
        setCurrentIndex((prev) => prev + 1);
        setSelectedAnswer(null);
        setAnswered(false);
      } else {
        submitAnswers(newAnswers, newHistory);
      }
    }, 900);
  }

  async function submitAnswers(answers, finalHistory) {
    setSubmitting(true);
    const formatted = questions.map((q, i) => ({
      questionId: q._id,
      answer: answers[i] || "",
    }));

    try {
      const res = await translateService.submit(textItem._id, formatted);
      const data = res.data || res;
      if (data.limitReached) {
        Alert.alert(
          "Premium i nevojshëm",
          "Ke arritur kufirin falas. Kalo në Premium për akses të pakufizuar."
        );
      }
      setQuizResult(data);
      if (data.passed) await refreshUser?.();
    } catch {
      const correct = finalHistory.filter((h) => h.isCorrect).length;
      const score = totalQuestions
        ? Math.round((correct / totalQuestions) * 100)
        : 0;
      setQuizResult({
        score,
        passed: score >= 70,
        correctAnswers: correct,
        totalQuestions,
        xpAwarded: 0,
        results: finalHistory.map((h) => ({
          isCorrect: h.isCorrect,
          correctAnswer: questions.find((q) => q._id === h.questionId)
            ?.correctAnswer,
        })),
      });
    } finally {
      setSubmitting(false);
    }
  }

  function retryQuiz() {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setHistory([]);
    setUserAnswers([]);
    setQuizResult(null);
    setSubmitting(false);
  }

  // ── LOADING ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color="#7c3aed" size="large" />
        <Text style={styles.loadingText}>Duke ngarkuar tekstin…</Text>
      </View>
    );
  }

  const quizComplete = quizResult !== null || submitting;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* ── Purple gradient top bar ── */}
        <LinearGradient
          colors={["#4c1d95", "#6d28d9", "#7c3aed", "#a78bfa"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.topBar}
        >
          <View style={styles.topBarLeft}>
            <Text numberOfLines={1} style={styles.topBarTitle}>
              {fullText?.title || textItem?.title}
            </Text>
            <View style={styles.topBarMeta}>
              <View style={styles.levelPill}>
                <Text style={styles.levelPillText}>
                  Niveli {fullText?.level || textItem?.level}
                </Text>
              </View>
              <Text style={styles.topBarCount}>
                {totalQuestions} pyetje
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={14} color="#ffffff" />
            <Text style={styles.backBtnText}>Kthehu</Text>
          </TouchableOpacity>
        </LinearGradient>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Text panel ── */}
            <View style={styles.textPanel}>
              <View style={styles.textPanelHeader}>
                <View style={styles.textPanelIcon}>
                  <Ionicons name="book" size={15} color="#0891b2" />
                </View>
                <Text style={styles.textPanelLabel}>Teksti për Lexim</Text>
              </View>
              <View style={styles.textBox}>
                <Text style={styles.textPassage}>{fullText?.text}</Text>
              </View>
            </View>

            {/* ── Quiz panel ── */}
            <View style={styles.quizPanel}>
              {!quizComplete ? (
                <>
                  {/* Progress row */}
                  <View style={styles.progressRow}>
                    <Text style={styles.progressLabel}>
                      Pyetja {currentIndex + 1}/{totalQuestions}
                    </Text>
                    <View style={styles.progressTrack}>
                      <View
                        style={[styles.progressFill, { width: `${progressPct}%` }]}
                      />
                    </View>
                    <Text style={styles.progressCount}>
                      {userAnswers.length}/{totalQuestions}
                    </Text>
                  </View>

                  {/* Question box */}
                  {currentQuestion && (
                    <>
                      <View style={styles.questionBox}>
                        <Text style={styles.questionText}>
                          {currentQuestion.question}
                        </Text>
                      </View>

                      {/* Options */}
                      <View style={styles.optionsWrap}>
                        {(currentQuestion.options || []).map((option, index) => {
                          const isSelected = selectedAnswer === option;
                          const isCorrect =
                            option === currentQuestion.correctAnswer;
                          const showFeedback = answered;

                          let optStyle = styles.optionDefault;
                          let textStyle = styles.optionTextDefault;
                          let iconName = null;
                          let iconColor = null;

                          if (showFeedback) {
                            if (isSelected && isCorrect) {
                              optStyle = styles.optionCorrectSelected;
                              textStyle = styles.optionTextCorrect;
                              iconName = "checkmark-circle";
                              iconColor = "#ffffff";
                            } else if (isSelected && !isCorrect) {
                              optStyle = styles.optionWrongSelected;
                              textStyle = styles.optionTextWrong;
                              iconName = "close-circle";
                              iconColor = "#ffffff";
                            } else if (!isSelected && isCorrect) {
                              optStyle = styles.optionCorrectReveal;
                              textStyle = styles.optionTextCorrectReveal;
                              iconName = "checkmark-circle";
                              iconColor = "#059669";
                            }
                          }

                          return (
                            <TouchableOpacity
                              key={`${option}-${index}`}
                              activeOpacity={0.85}
                              disabled={answered}
                              onPress={() => handleSelectOption(option)}
                              style={[styles.optionCard, optStyle]}
                            >
                              <Text style={[styles.optionText, textStyle]}>
                                {option}
                              </Text>
                              {showFeedback && iconName && (
                                <View
                                  style={[
                                    styles.optionIcon,
                                    isSelected && isCorrect && styles.optionIconCorrect,
                                    isSelected && !isCorrect && styles.optionIconWrong,
                                    !isSelected && isCorrect && styles.optionIconReveal,
                                  ]}
                                >
                                  <Ionicons
                                    name={iconName}
                                    size={14}
                                    color={iconColor}
                                  />
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </>
                  )}
                </>
              ) : submitting ? (
                <View style={styles.submittingWrap}>
                  <ActivityIndicator color="#7c3aed" />
                  <Text style={styles.submittingText}>
                    Duke dërguar rezultatin…
                  </Text>
                </View>
              ) : quizResult ? (
                <>
                  {/* Score banner */}
                  <LinearGradient
                    colors={
                      quizResult.passed
                        ? ["#10b981", "#0d9488"]
                        : ["#7c3aed", "#9333ea"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.scoreBanner}
                  >
                    <Text style={styles.scoreBannerEmoji}>
                      {quizResult.passed ? "🎉" : "💪"}
                    </Text>
                    <Text style={styles.scoreBannerTitle}>
                      {quizResult.passed ? "Urime!" : "Provo Përsëri!"}
                    </Text>
                    {quizResult.xpAwarded > 0 && (
                      <View style={styles.xpRow}>
                        <Ionicons name="star" size={16} color="#fde68a" />
                        <Text style={styles.xpText}>
                          +{quizResult.xpAwarded} XP
                        </Text>
                      </View>
                    )}
                  </LinearGradient>

                  {/* 3-stat grid */}
                  <View style={styles.statsRow}>
                    <View style={[styles.statCard, styles.statCardCorrect]}>
                      <View style={[styles.statIcon, styles.statIconCorrect]}>
                        <Ionicons name="checkmark" size={16} color="#059669" />
                      </View>
                      <Text style={[styles.statValue, { color: "#059669" }]}>
                        {quizResult.correctAnswers || 0}
                      </Text>
                      <Text style={styles.statLabel}>Sakte</Text>
                    </View>

                    <View style={[styles.statCard, styles.statCardWrong]}>
                      <View style={[styles.statIcon, styles.statIconWrong]}>
                        <Ionicons name="close" size={16} color="#ef4444" />
                      </View>
                      <Text style={[styles.statValue, { color: "#ef4444" }]}>
                        {(quizResult.totalQuestions || totalQuestions) -
                          (quizResult.correctAnswers || 0)}
                      </Text>
                      <Text style={styles.statLabel}>Gabim</Text>
                    </View>

                    <View style={[styles.statCard, styles.statCardScore]}>
                      <View style={[styles.statIcon, styles.statIconScore]}>
                        <Ionicons name="star" size={16} color="#7c3aed" />
                      </View>
                      <Text style={[styles.statValue, { color: "#7c3aed" }]}>
                        {quizResult.score ||
                          Math.round(
                            ((quizResult.correctAnswers || 0) /
                              (quizResult.totalQuestions || totalQuestions)) *
                              100
                          )}
                        %
                      </Text>
                      <Text style={styles.statLabel}>Rezultat</Text>
                    </View>
                  </View>

                  {/* Per-question summary */}
                  {quizResult.results && quizResult.results.length > 0 && (
                    <View style={styles.summaryCard}>
                      <Text style={styles.summaryTitle}>PËRMBLEDHJE</Text>
                      {quizResult.results.map((r, i) => (
                        <View
                          key={i}
                          style={[
                            styles.summaryRow,
                            r.isCorrect
                              ? styles.summaryRowCorrect
                              : styles.summaryRowWrong,
                          ]}
                        >
                          <View
                            style={[
                              styles.summaryDot,
                              r.isCorrect
                                ? styles.summaryDotCorrect
                                : styles.summaryDotWrong,
                            ]}
                          >
                            <Ionicons
                              name={r.isCorrect ? "checkmark" : "close"}
                              size={11}
                              color="#ffffff"
                            />
                          </View>
                          <Text
                            style={[
                              styles.summaryRowText,
                              r.isCorrect
                                ? styles.summaryRowTextCorrect
                                : styles.summaryRowTextWrong,
                            ]}
                          >
                            Pyetja {i + 1}
                          </Text>
                          {!r.isCorrect && r.correctAnswer && (
                            <Text
                              style={styles.summaryCorrectAnswer}
                              numberOfLines={1}
                            >
                              → {r.correctAnswer}
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Actions */}
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.primaryBtnText}>
                      Vazhdo me Tekst Tjetër
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={retryQuiz}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.secondaryBtnText}>Provo Përsëri</Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },
  safeArea: { flex: 1 },

  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    backgroundColor: "#f8fafc",
  },
  loadingText: { color: "#94a3b8", fontSize: 14, fontWeight: "600" },

  // ── Top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 12,
  },
  topBarLeft: { flex: 1, minWidth: 0 },
  topBarTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  topBarMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  levelPill: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  levelPillText: { color: "#ffffff", fontSize: 11, fontWeight: "700" },
  topBarCount: { color: "rgba(255,255,255,0.7)", fontSize: 11 },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backBtnText: { color: "#ffffff", fontSize: 12, fontWeight: "700" },

  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 32,
    gap: 12,
  },

  // ── Text panel
  textPanel: {
    backgroundColor: "#f8fafc",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  textPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  textPanelIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#cffafe",
    alignItems: "center",
    justifyContent: "center",
  },
  textPanelLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1f2937",
  },
  textBox: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#0f172a",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  textPassage: {
    color: "#374151",
    fontSize: 13,
    lineHeight: 22,
    fontWeight: "400",
  },

  // ── Quiz panel
  quizPanel: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    gap: 14,
  },

  // Progress row
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#374151",
    minWidth: 70,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#7c3aed",
  },
  progressCount: {
    fontSize: 11,
    color: "#9ca3af",
    minWidth: 32,
    textAlign: "right",
  },

  // Question
  questionBox: {
    backgroundColor: "#f5f3ff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#ede9fe",
  },
  questionText: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 22,
  },

  // Options
  optionsWrap: { gap: 10 },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    gap: 10,
  },
  optionDefault: {
    backgroundColor: "#ffffff",
    borderColor: "#f1f5f9",
  },
  optionCorrectSelected: {
    backgroundColor: "#ecfdf5",
    borderColor: "#34d399",
  },
  optionWrongSelected: {
    backgroundColor: "#fff1f2",
    borderColor: "#f87171",
  },
  optionCorrectReveal: {
    backgroundColor: "#ecfdf5",
    borderColor: "#6ee7b7",
    opacity: 0.85,
  },
  optionText: { flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 20 },
  optionTextDefault: { color: "#1f2937" },
  optionTextCorrect: { color: "#065f46" },
  optionTextWrong: { color: "#991b1b" },
  optionTextCorrectReveal: { color: "#065f46" },

  optionIcon: {
    width: 22,
    height: 22,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  optionIconCorrect: { backgroundColor: "#10b981" },
  optionIconWrong: { backgroundColor: "#ef4444" },
  optionIconReveal: { backgroundColor: "#10b981" },

  submittingWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 20,
  },
  submittingText: { color: "#64748b", fontSize: 13, fontWeight: "600" },

  // ── Result
  scoreBanner: {
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
  },
  scoreBannerEmoji: { fontSize: 28, marginBottom: 4 },
  scoreBannerTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },
  xpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
  },
  xpText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },

  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  statCardCorrect: { backgroundColor: "#ecfdf5", borderColor: "#a7f3d0" },
  statCardWrong: { backgroundColor: "#fff1f2", borderColor: "#fecaca" },
  statCardScore: { backgroundColor: "#f5f3ff", borderColor: "#ddd6fe" },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  statIconCorrect: { backgroundColor: "#a7f3d0" },
  statIconWrong: { backgroundColor: "#fecaca" },
  statIconScore: { backgroundColor: "#ddd6fe" },
  statValue: { fontSize: 20, fontWeight: "900", marginBottom: 2 },
  statLabel: { fontSize: 11, color: "#6b7280", fontWeight: "600" },

  summaryCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    gap: 8,
  },
  summaryTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: "#6b7280",
    letterSpacing: 1,
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  summaryRowCorrect: {
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0",
  },
  summaryRowWrong: {
    backgroundColor: "#fff1f2",
    borderColor: "#fecaca",
  },
  summaryDot: {
    width: 20,
    height: 20,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  summaryDotCorrect: { backgroundColor: "#10b981" },
  summaryDotWrong: { backgroundColor: "#ef4444" },
  summaryRowText: { fontSize: 12, fontWeight: "700" },
  summaryRowTextCorrect: { color: "#065f46" },
  summaryRowTextWrong: { color: "#991b1b" },
  summaryCorrectAnswer: {
    flex: 1,
    fontSize: 11,
    color: "#6b7280",
    textAlign: "right",
  },

  primaryBtn: {
    backgroundColor: "#7c3aed",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },

  secondaryBtn: {
    backgroundColor: "#f3f4f6",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  secondaryBtnText: { color: "#374151", fontSize: 14, fontWeight: "700" },
});
