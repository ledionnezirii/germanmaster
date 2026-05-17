import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { quizService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { SectionHeader } from "../../components/Headers";
import { getSectionTexts } from "../../utils/sectionTexts";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const LEVEL_STYLES = {
  A1: { tint: "#10b981", soft: "#d1fae5" },
  A2: { tint: "#0ea5e9", soft: "#e0f2fe" },
  B1: { tint: "#6366f1", soft: "#e0e7ff" },
  B2: { tint: "#f97316", soft: "#ffedd5" },
  C1: { tint: "#ec4899", soft: "#fce7f3" },
  C2: { tint: "#ef4444", soft: "#fee2e2" },
};

export default function QuizScreen({ navigation }) {
  useAuth();
  const { language } = useLanguage();
  const [quizzes, setQuizzes] = useState([]);
  const [completedQuizzes, setCompletedQuizzes] = useState([]);
  const [completedQuizData, setCompletedQuizData] = useState([]);
  const [freeLimit, setFreeLimit] = useState(5);
  const [isPaid, setIsPaid] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState("A1");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [language]);

  async function loadData(isRefresh = false) {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [quizRes, completedRes] = await Promise.allSettled([
        quizService.getAll({ language }),
        quizService.getCompleted(),
      ]);

      if (quizRes.status === "fulfilled") {
        const list = Array.isArray(quizRes.value.data) ? quizRes.value.data : [];
        setQuizzes(list);
      } else {
        setQuizzes([]);
        setError("Could not load quizzes right now.");
      }

      if (completedRes.status === "fulfilled") {
        const payload = completedRes.value.data || {};
        const completed = Array.isArray(payload.quizzes) ? payload.quizzes : [];
        setCompletedQuizzes(completed.map((quiz) => quiz._id));
        setCompletedQuizData(completed);
        setIsPaid(Boolean(payload.isPaid));
        setFreeLimit(payload.freeLimit || 5);
      }
    } catch {
      setError("Could not load quizzes right now.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const filteredQuizzes = useMemo(
    () => quizzes.filter((quiz) => quiz.level === selectedLevel),
    [quizzes, selectedLevel]
  );

  const completedCount = completedQuizzes.length;
  const availableMixedQuestions = completedQuizData.flatMap((quiz) => quiz.questions || []);
  const canStartMixed = isPaid && availableMixedQuestions.length >= 2;
  const lockedCount = Math.max(quizzes.length - completedCount, 0);
  const currentLevelCount = filteredQuizzes.length;

  function isCompleted(quizId) {
    return completedQuizzes.includes(quizId);
  }

  function isLocked(quizId) {
    return !isCompleted(quizId) && !isPaid && completedCount >= freeLimit;
  }

  function startMixedQuiz() {
    if (!isPaid) {
      return;
    }

    if (availableMixedQuestions.length < 2) {
      return;
    }

    const mixedQuestions = [...availableMixedQuestions]
      .sort(() => Math.random() - 0.5)
      .slice(0, 10);

    navigation.navigate("QuizDetail", {
      quiz: {
        _id: "mixed",
        title: "Mixed Quiz",
        level: "MIX",
        xp: 0,
        isMixed: true,
        questions: mixedQuestions,
      },
    });
  }

  function renderQuizCard({ item }) {
    const completed = isCompleted(item._id);
    const locked = isLocked(item._id);
    const palette = LEVEL_STYLES[item.level] || LEVEL_STYLES.A1;
    const questionsCount = item.questions?.length || 0;

    return (
      <TouchableOpacity
        activeOpacity={0.88}
        disabled={locked}
        style={[
          styles.quizCard,
          locked && styles.quizCardLocked,
          completed && styles.quizCardCompleted,
        ]}
        onPress={() => navigation.navigate("QuizDetail", { quiz: item })}
      >
        <View style={styles.quizCardTop}>
          <View style={[styles.quizIconBox, { backgroundColor: palette.soft }]}>
            <Ionicons
              name={locked ? "lock-closed" : completed ? "checkmark-circle" : "school-outline"}
              size={22}
              color={locked ? "#94a3b8" : completed ? "#10b981" : palette.tint}
            />
          </View>
          <View
            style={[
              styles.levelBadge,
              { backgroundColor: palette.soft, borderColor: `${palette.tint}33` },
            ]}
          >
            <Text style={[styles.levelBadgeText, { color: palette.tint }]}>{item.level}</Text>
          </View>
        </View>

        <Text
          numberOfLines={2}
          style={[styles.quizTitle, locked && styles.quizTitleLocked]}
        >
          {item.title || "Untitled quiz"}
        </Text>
        <Text style={[styles.quizSubtitle, locked && styles.quizSubtitleLocked]}>
          {questionsCount} questions
        </Text>

        <View style={styles.quizFooter}>
          <View style={styles.quizMetaRow}>
            <Ionicons name="flash" size={14} color={locked ? "#cbd5e1" : "#f59e0b"} />
            <Text style={[styles.quizMetaText, locked && styles.quizMetaTextLocked]}>
              {item.xp || 0} XP
            </Text>
          </View>

          <View
            style={[
              styles.quizStatePill,
              completed
                ? styles.quizStatePillDone
                : locked
                  ? styles.quizStatePillLocked
                  : styles.quizStatePillStart,
            ]}
          >
            <Text
              style={[
                styles.quizStateText,
                completed
                  ? styles.quizStateTextDone
                  : locked
                    ? styles.quizStateTextLocked
                    : styles.quizStateTextStart,
              ]}
            >
              {completed ? "Done" : locked ? "Premium" : "Start"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color="#6366f1" size="large" />
          </View>
        ) : (
          <FlatList
            data={filteredQuizzes}
            keyExtractor={(item) => item._id}
            renderItem={renderQuizCard}
            numColumns={1}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadData(true)}
                tintColor="#6366f1"
              />
            }
            ListHeaderComponent={
              <>
                <SectionHeader
                  gradientColors={["#312e81", "#4f46e5", "#6366f1"]}
                  icon="school"
                  {...getSectionTexts("quiz", language)}
                  selectedLevel={selectedLevel}
                  onLevelChange={setSelectedLevel}
                >
                  {/* Mixed quiz button */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={startMixedQuiz}
                    disabled={!canStartMixed}
                    style={{ opacity: canStartMixed ? 1 : 0.55 }}
                  >
                    <LinearGradient
                      colors={["#14b8a6", "#0d9488"]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={styles.mixBtn}
                    >
                      <Ionicons name={isPaid ? "shuffle" : "lock-closed"} size={15} color="#fff" />
                      <Text style={styles.mixBtnText}>Kuiz i Përzier</Text>
                      <View style={styles.mixBtnBadge}>
                        <Text style={styles.mixBtnBadgeTxt}>
                          {!isPaid ? "Premium" : canStartMixed ? `${Math.min(availableMixedQuestions.length, 10)} pyetje` : `${completedCount}/2`}
                        </Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </SectionHeader>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                <View style={{ height: 16 }} />
              </>
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="book-outline" size={28} color="#94a3b8" />
                <Text style={styles.emptyTitle}>Nuk ka kuize në këtë nivel</Text>
                <Text style={styles.emptyText}>Provo një nivel tjetër ose rifreskoje.</Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
}


const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#faf8f5",
  },
  safeArea: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 28,
  },

  // ── Mix button (inside SectionHeader children)
  mixBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
  },
  mixBtnText: { color: "#fff", fontSize: 13, fontWeight: "700", flex: 1 },
  mixBtnBadge: {
    backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  mixBtnBadgeTxt: { color: "rgba(255,255,255,0.9)", fontSize: 11, fontWeight: "700" },

  // ── Quiz Cards
  columnWrapper: {
    gap: 10,
    paddingHorizontal: 4,
    marginBottom: 2,
  },
  quizCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 14,
    minHeight: 180,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    borderBottomWidth: 4,
    borderBottomColor: "#ddd8d2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  quizCardLocked: {
    backgroundColor: "#f8fafc",
    borderBottomColor: "#cbd5e1",
  },
  quizCardCompleted: {
    borderColor: "#a7f3d0",
    borderBottomColor: "#6ee7b7",
  },
  quizCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  quizIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: "900",
  },
  quizTitle: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
    marginBottom: 4,
    minHeight: 40,
  },
  quizTitleLocked: {
    color: "#94a3b8",
  },
  quizSubtitle: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "600",
  },
  quizSubtitleLocked: {
    color: "#cbd5e1",
  },
  quizFooter: {
    marginTop: "auto",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  quizMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  quizMetaText: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "700",
  },
  quizMetaTextLocked: {
    color: "#cbd5e1",
  },
  quizStatePill: {
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  quizStatePillStart: {
    backgroundColor: "#dcfce7",
  },
  quizStatePillDone: {
    backgroundColor: "#d1fae5",
  },
  quizStatePillLocked: {
    backgroundColor: "#e2e8f0",
  },
  quizStateText: {
    fontSize: 10,
    fontWeight: "900",
  },
  quizStateTextStart: {
    color: "#166534",
  },
  quizStateTextDone: {
    color: "#047857",
  },
  quizStateTextLocked: {
    color: "#64748b",
  },

  // ── Empty State
  emptyState: {
    backgroundColor: "#fff",
    borderRadius: 20,
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginTop: 4,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  emptyTitle: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 8,
  },
  emptyText: {
    color: "#64748b",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },

  // ── Error
  errorText: {
    color: "#fecaca",
    backgroundColor: "rgba(127,29,29,0.55)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    fontSize: 13,
    fontWeight: "600",
    marginHorizontal: 16,
  },
});
