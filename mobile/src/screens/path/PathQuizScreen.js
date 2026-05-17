import { useEffect, useState, useRef, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions,
  Animated, ScrollView, TextInput, ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import pathService from "./pathService";
import { ttsService, heartsService } from "../../services/api";
import { Audio } from "expo-av";

const { width, height } = Dimensions.get("window");

const MAX_HEARTS = 3;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalise(s) {
  return (s || "").trim().toLowerCase().replace(/[^a-zäöüß0-9\s]/gi, "").replace(/\s+/g, " ");
}

function MCQQuestion({ question, onAnswer, disabled }) {
  const [selected, setSelected] = useState(null);

  const handleSelect = (opt) => {
    if (disabled || selected !== null) return;
    setSelected(opt);
    const correct = normalise(opt) === normalise(question.answer);
    onAnswer(correct, opt);
  };

  const opts = question.options || [];
  const isGrid = opts.length === 4;

  return (
    <View style={q.container}>
      {question.description ? <Text style={q.desc}>{question.description}</Text> : null}
      <View style={isGrid ? q.optionsGrid : q.optionsList}>
        {opts.map((opt, i) => {
          const isSelected = selected === opt;
          const correct = normalise(opt) === normalise(question.answer);
          let bgColor = "#f8fafc";
          let borderColor = "#e2e8f0";
          let borderBottomColor = "#c8d0da";
          if (isSelected) {
            bgColor = correct ? "#ecfdf5" : "#fef2f2";
            borderColor = correct ? "#10b981" : "#ef4444";
            borderBottomColor = correct ? "#047857" : "#b91c1c";
          }
          return (
            <TouchableOpacity
              key={i}
              style={[isGrid ? q.option : q.optionRow, { backgroundColor: bgColor, borderColor, borderBottomColor }]}
              onPress={() => handleSelect(opt)}
              activeOpacity={0.8}
              disabled={disabled || selected !== null}
            >
              <Text style={isGrid ? q.optionTxt : q.optionRowTxt}>{opt}</Text>
              {isSelected && (
                <Ionicons
                  name={correct ? "checkmark-circle" : "close-circle"}
                  size={20}
                  color={correct ? "#10b981" : "#ef4444"}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const SPECIAL_CHARS = {
  de: ["ä", "ö", "ü", "Ä", "Ö", "Ü", "ß"],
  fr: ["é", "è", "ê", "à", "â", "ç", "ô", "î", "û"],
  es: ["á", "é", "í", "ó", "ú", "ñ", "¡", "¿"],
  it: ["à", "è", "é", "ì", "î", "ò", "ó", "ù", "ú"],
  ru: [],
};

function TypeQuestion({ question, onAnswer, disabled, language = "de" }) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const selectionRef = useRef({ start: 0, end: 0 });

  const specialChars = SPECIAL_CHARS[language] || [];

  const handleSubmit = () => {
    if (submitted || !value.trim()) return;
    const correct = normalise(value) === normalise(question.answer);
    setIsCorrect(correct);
    setSubmitted(true);
    onAnswer(correct, value);
  };

  const insertChar = (char) => {
    if (submitted) return;
    const { start, end } = selectionRef.current;
    setValue((v) => v.slice(0, start) + char + v.slice(end));
    selectionRef.current = { start: start + char.length, end: start + char.length };
  };

  return (
    <View style={q.container}>
      {question.description ? <Text style={q.desc}>{question.description}</Text> : null}
      <TextInput
        style={[q.input, submitted && (isCorrect ? q.inputCorrect : q.inputWrong)]}
        value={value}
        onChangeText={setValue}
        placeholder="Shkruaj përgjigjen..."
        placeholderTextColor="#94a3b8"
        editable={!submitted && !disabled}
        onSubmitEditing={handleSubmit}
        onSelectionChange={({ nativeEvent: { selection } }) => { selectionRef.current = selection; }}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {/* Special character buttons */}
      {!submitted && specialChars.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={q.charRow}
          contentContainerStyle={q.charRowContent}
          keyboardShouldPersistTaps="always"
        >
          {specialChars.map((ch) => (
            <TouchableOpacity
              key={ch}
              style={q.charBtn}
              onPress={() => insertChar(ch)}
              activeOpacity={0.7}
            >
              <Text style={q.charTxt}>{ch}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      {submitted && (
        <View style={[q.feedback, isCorrect ? q.feedbackOk : q.feedbackErr]}>
          <Ionicons
            name={isCorrect ? "checkmark-circle" : "close-circle"}
            size={18}
            color={isCorrect ? "#10b981" : "#ef4444"}
          />
          <Text style={[q.feedbackTxt, { color: isCorrect ? "#10b981" : "#ef4444" }]}>
            {isCorrect ? "Saktë!" : `Gabim – "${question.answer}"`}
          </Text>
        </View>
      )}
      {!submitted && (
        <TouchableOpacity
          style={[q.submitBtn, !value.trim() && q.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!value.trim()}
          activeOpacity={0.85}
        >
          <Text style={q.submitBtnTxt}>Kontrollo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function OrderQuestion({ question, onAnswer, disabled }) {
  const [pool, setPool] = useState(() => shuffle(question.words || []));
  const [selected, setSelected] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);

  const addWord = (word, idx) => {
    if (submitted) return;
    setPool((p) => p.filter((_, i) => i !== idx));
    setSelected((s) => [...s, word]);
  };

  const removeWord = (word, idx) => {
    if (submitted) return;
    setSelected((s) => s.filter((_, i) => i !== idx));
    setPool((p) => [...p, word]);
  };

  const handleSubmit = () => {
    if (submitted || selected.length === 0) return;
    const answer = selected.join(" ");
    const correct = normalise(answer) === normalise(question.answer);
    setIsCorrect(correct);
    setSubmitted(true);
    onAnswer(correct, answer);
  };

  return (
    <View style={q.container}>
      {question.description ? <Text style={q.desc}>{question.description}</Text> : null}
      <View style={[q.answerZone, submitted && (isCorrect ? q.answerZoneOk : q.answerZoneErr)]}>
        {selected.length === 0 ? (
          <Text style={q.answerPlaceholder}>Shto fjalët këtu...</Text>
        ) : (
          <View style={q.wordRow}>
            {selected.map((w, i) => (
              <TouchableOpacity key={i} style={q.wordChipSelected} onPress={() => removeWord(w, i)} disabled={submitted}>
                <Text style={q.wordChipTxt}>{w}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      <View style={q.wordRow}>
        {pool.map((w, i) => (
          <TouchableOpacity key={i} style={q.wordChip} onPress={() => addWord(w, i)} disabled={submitted}>
            <Text style={q.wordChipTxt}>{w}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {submitted && (
        <View style={[q.feedback, isCorrect ? q.feedbackOk : q.feedbackErr]}>
          <Ionicons name={isCorrect ? "checkmark-circle" : "close-circle"} size={18} color={isCorrect ? "#10b981" : "#ef4444"} />
          <Text style={[q.feedbackTxt, { color: isCorrect ? "#10b981" : "#ef4444" }]}>
            {isCorrect ? "Saktë!" : `Gabim – "${question.answer}"`}
          </Text>
        </View>
      )}
      {!submitted && (
        <TouchableOpacity
          style={[q.submitBtn, selected.length === 0 && q.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={selected.length === 0}
          activeOpacity={0.85}
        >
          <Text style={q.submitBtnTxt}>Kontrollo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function AudioQuestion({ question, onAnswer, disabled }) {
  const [playing, setPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const soundRef = useRef(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    return () => { soundRef.current?.unloadAsync(); };
  }, []);

  const fetchAndPlay = async () => {
    try {
      setLoadingAudio(true);
      let url = audioUrl;
      if (!url && question.audioText) {
        url = await ttsService.getPhraseAudio("tmp", question.audioText, "A1", "de");
        setAudioUrl(url);
      }
      if (url) {
        await soundRef.current?.unloadAsync();
        const { sound } = await Audio.Sound.createAsync({ uri: url });
        soundRef.current = sound;
        setPlaying(true);
        await sound.playAsync();
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) setPlaying(false);
        });
      }
    } catch {
      setPlaying(false);
    } finally {
      setLoadingAudio(false);
    }
  };

  const handleSelect = (opt) => {
    if (disabled || selected !== null) return;
    setSelected(opt);
    const correct = normalise(opt) === normalise(question.answer);
    onAnswer(correct, opt);
  };

  return (
    <View style={q.container}>
      {question.description ? <Text style={q.desc}>{question.description}</Text> : null}
      <TouchableOpacity style={q.playBtn} onPress={fetchAndPlay} activeOpacity={0.85}>
        {loadingAudio ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Ionicons name={playing ? "pause" : "play"} size={28} color="#fff" />
        )}
      </TouchableOpacity>
      {(() => {
        const opts = question.options || [];
        const isGrid = opts.length === 4;
        return (
          <View style={isGrid ? q.optionsGrid : q.optionsList}>
            {opts.map((opt, i) => {
              const isSelected = selected === opt;
              const correct = normalise(opt) === normalise(question.answer);
              let bgColor = "#f8fafc";
              let borderColor = "#e2e8f0";
              let borderBottomColor = "#c8d0da";
              if (isSelected) {
                bgColor = correct ? "#ecfdf5" : "#fef2f2";
                borderColor = correct ? "#10b981" : "#ef4444";
                borderBottomColor = correct ? "#047857" : "#b91c1c";
              }
              return (
                <TouchableOpacity
                  key={i}
                  style={[isGrid ? q.option : q.optionRow, { backgroundColor: bgColor, borderColor, borderBottomColor }]}
                  onPress={() => handleSelect(opt)}
                  activeOpacity={0.8}
                  disabled={disabled || selected !== null}
                >
                  <Text style={isGrid ? q.optionTxt : q.optionRowTxt}>{opt}</Text>
                  {isSelected && (
                    <Ionicons
                      name={correct ? "checkmark-circle" : "close-circle"}
                      size={20}
                      color={correct ? "#10b981" : "#ef4444"}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        );
      })()}
    </View>
  );
}

const TYPE_LABELS = {
  mcq:   "ZGJIDH PËRGJIGJEN",
  type:  "SHKRUAJ",
  order: "RENDIT FJALËT",
  audio: "DËGJO & ZGJIDH",
};

function CharacterBubble({ text, topicColor, questionType, questionKey }) {
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    bounceAnim.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -7, duration: 750, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0,  duration: 750, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [questionKey]);

  return (
    <View style={cb.wrap}>
      <View style={cb.row}>
        <Animated.View style={[cb.charBox, { borderColor: topicColor + "35", backgroundColor: topicColor + "12", transform: [{ translateY: bounceAnim }] }]}>
          <Text style={cb.charEmoji}>🦉</Text>
        </Animated.View>
        <View style={cb.bubbleWrap}>
          <View style={[cb.tail, { borderRightColor: topicColor + "40" }]} />
          <View style={[cb.bubble, { borderColor: topicColor + "30" }]}>
            <Text style={cb.bubbleTxt}>{text}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function XpPop({ xp, visible }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
      opacity.setValue(1);
      Animated.parallel([
        Animated.timing(translateY, { toValue: -50, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 800, delay: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;
  return (
    <Animated.View style={[s.xpPop, { opacity, transform: [{ translateY }] }]}>
      <Text style={s.xpPopTxt}>+{xp} XP</Text>
    </Animated.View>
  );
}

function ExerciseResult({ passed, xpEarned, correctCount, totalCount, curExIdx, totalExercises, topicColor, onContinue }) {
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }).start();
  }, []);

  const isLast = curExIdx + 1 >= totalExercises;
  const btnLabel = !passed ? "Provo Përsëri" : isLast ? "Përfundo" : "Dil nga ushtrimi";

  return (
    <View style={er.root}>
      <Animated.View style={[er.card, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={er.emoji}>{passed ? "🎉" : "😅"}</Text>

        <Text style={[er.title, { color: passed ? "#10b981" : "#ef4444" }]}>
          {passed ? "Kaluar!" : "Provo Përsëri"}
        </Text>

        <Text style={er.exNum}>{curExIdx + 1} / {totalExercises}</Text>

        {passed && (
          <View style={[er.xpRow, { backgroundColor: topicColor + "15" }]}>
            <Ionicons name="star" size={20} color={topicColor} />
            <Text style={[er.xpTxt, { color: topicColor }]}>+{xpEarned} XP</Text>
          </View>
        )}

        <View style={er.starsRow}>
          {[0,1,2].map((i) => (
            <Ionicons key={i} name="star" size={34}
              color={i < Math.round((correctCount / Math.max(totalCount,1)) * 3) ? "#fbbf24" : "#e2e8f0"} />
          ))}
        </View>

        <Text style={er.sub}>{correctCount}/{totalCount} përgjigje të sakta</Text>

        <TouchableOpacity
          style={[er.btn, { backgroundColor: passed ? topicColor : "#ef4444" }]}
          onPress={onContinue}
          activeOpacity={0.85}
        >
          <Text style={er.btnTxt}>{btnLabel}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

function SummaryScreen({ xpEarned, correctCount, totalCount, topicColor, onContinue }) {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 7, useNativeDriver: true }).start();
  }, []);

  const passed = correctCount >= Math.max(1, Math.floor(totalCount * 0.75));

  return (
    <View style={s.summaryContainer}>
      <Animated.View style={[s.summaryCard, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={s.summaryEmoji}>{passed ? "🎉" : "😅"}</Text>
        <Text style={s.summaryTitle}>{passed ? "Ushtrim i Kaluar!" : "Provo Përsëri"}</Text>
        <Text style={s.summarySub}>{correctCount}/{totalCount} përgjigje të sakta</Text>
        <View style={[s.xpBadge, { backgroundColor: topicColor + "18" }]}>
          <Ionicons name="star" size={18} color={topicColor} />
          <Text style={[s.xpBadgeTxt, { color: topicColor }]}>+{xpEarned} XP fituar</Text>
        </View>
        <View style={s.starsRow}>
          {[0, 1, 2].map((i) => (
            <Ionicons
              key={i}
              name="star"
              size={32}
              color={i < Math.round((correctCount / totalCount) * 3) ? "#fbbf24" : "#e2e8f0"}
            />
          ))}
        </View>
        <TouchableOpacity
          style={[s.continueBtn, { backgroundColor: passed ? topicColor : "#64748b" }]}
          onPress={onContinue}
          activeOpacity={0.85}
        >
          <Text style={s.continueBtnTxt}>{passed ? "Vazhdo" : "Provo Përsëri"}</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export default function PathQuizScreen({ navigation, route }) {
  const {
    topicId,
    exerciseIndex: startExIdx = 0,
    topicTitle = "Ushtrim",
    topicIcon = "📚",
    topicIconFamily = null,
    topicColor = "#8b5cf6",
    totalExercises = 6,
    language = "de",
  } = route.params || {};

  const [curExIdx,   setCurExIdx]   = useState(startExIdx);
  const [exercise,   setExercise]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [hearts,     setHearts]     = useState(MAX_HEARTS);
  const [isPaid,     setIsPaid]     = useState(false);
  const [heartsResetsAt, setHeartsResetsAt] = useState(null);
  const [results,    setResults]    = useState([]);
  const [answered,   setAnswered]   = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [sessionXp,  setSessionXp]  = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionTotal,   setSessionTotal]   = useState(0);
  const [showXpPop,    setShowXpPop]    = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [exResult,     setExResult]     = useState(null);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim    = useRef(new Animated.Value(0)).current;

  // Fetch real hearts once on mount
  useEffect(() => {
    heartsService.get()
      .then((res) => {
        const d = res.data?.data || res.data;
        setIsPaid(d?.isPaid ?? false);
        setHearts(d?.hearts ?? MAX_HEARTS);
        setHeartsResetsAt(d?.heartsResetsAt ?? null);
      })
      .catch(() => {});
  }, []);

  // Load exercise whenever curExIdx changes
  useEffect(() => {
    setLoading(true);
    setExercise(null);
    pathService.getExercise(topicId, curExIdx)
      .then((res) => setExercise(res.data?.exercise || res.data))
      .catch((err) => console.warn("getExercise error:", err?.message))
      .finally(() => setLoading(false));
  }, [topicId, curExIdx]);

  // Progress bar = question progress within current exercise (resets each exercise)
  useEffect(() => {
    const totalQ = exercise?.questions?.length ?? 1;
    const pct = (currentQIdx / totalQ) * 100;
    Animated.timing(progressAnim, { toValue: pct, duration: 300, useNativeDriver: false }).start();
  }, [currentQIdx, exercise]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleSubmitExercise = useCallback(async (finalResults) => {
    setSubmitting(true);
    try {
      await pathService.completeExercise(topicId, curExIdx, finalResults);
    } catch (err) {
      console.warn("completeExercise error:", err?.message);
    }

    const correct = finalResults.filter((r) => r.correct).length;
    const total   = finalResults.length;
    const passed  = correct >= Math.max(1, Math.floor(total * 0.75));
    const exXp    = passed ? finalResults.reduce((s, r, i) => s + (r.correct ? (exercise?.questions?.[i]?.xpReward ?? 5) : 0), 0) : 0;

    if (passed) {
      setSessionCorrect((p) => p + correct);
      setSessionTotal((p) => p + total);
    }
    setSubmitting(false);
    setExResult({ passed, xpEarned: exXp, correct, total });
  }, [topicId, curExIdx, totalExercises, exercise]);

  const handleAnswer = useCallback((correct) => {
    setAnswered(true);
    const newResults = [...results, { questionIndex: currentQIdx, correct }];
    setResults(newResults);

    if (correct) {
      const qXp = exercise?.questions?.[currentQIdx]?.xpReward ?? 5;
      setSessionXp((p) => p + qXp);
      setShowXpPop(true);
      setTimeout(() => setShowXpPop(false), 1000);
    } else {
      shake();
      if (!isPaid) {
        // Deduct from server and update local state
        heartsService.lose()
          .then((res) => {
            const d = res.data?.data || res.data;
            setHearts(d?.hearts ?? 0);
            setHeartsResetsAt(d?.heartsResetsAt ?? null);
          })
          .catch(() => setHearts((h) => Math.max(0, h - 1)));

        const newHearts = Math.max(0, hearts - 1);
        if (newHearts === 0) {
          const totalQ = exercise?.questions?.length ?? 0;
          const failResults = [...newResults];
          for (let i = currentQIdx + 1; i < totalQ; i++) {
            failResults.push({ questionIndex: i, correct: false });
          }
          setTimeout(() => handleSubmitExercise(failResults), 1400);
          return;
        }
      }
    }

    setTimeout(() => {
      setAnswered(false);
      const totalQ = exercise?.questions?.length ?? 0;
      if (currentQIdx + 1 >= totalQ) {
        handleSubmitExercise(newResults);
      } else {
        setCurrentQIdx((i) => i + 1);
      }
    }, 1400);
  }, [currentQIdx, results, exercise, hearts, isPaid, handleSubmitExercise]);

  const handleExResultContinue = useCallback(() => {
    if (!exResult) return;
    if (!exResult.passed) {
      progressAnim.setValue(0);
      setExResult(null);
      setResults([]);
      setCurrentQIdx(0);
      setAnswered(false);
      heartsService.get().then((res) => {
        const d = res.data?.data || res.data;
        setHearts(d?.hearts ?? MAX_HEARTS);
        setHeartsResetsAt(d?.heartsResetsAt ?? null);
      }).catch(() => setHearts(MAX_HEARTS));
      return;
    }
    // Passed — always go back to path screen (user must re-enter for next exercise)
    navigation.goBack();
  }, [exResult, navigation]);

  if (loading) {
    return (
      <View style={[s.root, s.center]}>
        <ActivityIndicator size="large" color={topicColor} />
      </View>
    );
  }

  // Free user has no hearts — block entry
  if (!isPaid && hearts === 0 && !loading) {
    const resetsAt   = heartsResetsAt ? new Date(heartsResetsAt) : null;
    const diffMs     = resetsAt ? resetsAt - Date.now() : 0;
    const hoursLeft  = Math.max(0, Math.floor(diffMs / 3600000));
    const minsLeft   = Math.max(0, Math.floor((diffMs % 3600000) / 60000));
    return (
      <View style={[s.root, s.center]}>
        <Text style={{ fontSize: 52, marginBottom: 12 }}>💔</Text>
        <Text style={{ fontSize: 20, fontWeight: "900", color: "#0f172a", marginBottom: 6 }}>Mbaruan zemrat!</Text>
        <Text style={{ fontSize: 14, color: "#64748b", textAlign: "center", marginHorizontal: 32, lineHeight: 20 }}>
          {resetsAt
            ? `Zemrat rifreskohen pas ${hoursLeft}h ${minsLeft}m.\nProvo sërisht më vonë.`
            : "Zemrat rifreskohen çdo 24 orë."}
        </Text>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginTop: 16, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 16, borderWidth: 1.5, borderColor: "#e2e8f0" }}
        >
          <Text style={{ color: "#64748b", fontSize: 15, fontWeight: "700" }}>Kthehu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!exercise || !exercise.questions?.length) {
    return (
      <View style={[s.root, s.center]}>
        <Text style={{ fontSize: 16, color: "#64748b" }}>Nuk ka pyetje</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ color: topicColor, fontWeight: "700" }}>Kthehu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalQ = exercise.questions.length;
  const currentQuestion = exercise.questions[currentQIdx];

  if (exResult) {
    return (
      <ExerciseResult
        passed={exResult.passed}
        xpEarned={exResult.xpEarned}
        correctCount={exResult.correct}
        totalCount={exResult.total}
        curExIdx={curExIdx}
        totalExercises={totalExercises}
        topicColor={topicColor}
        onContinue={handleExResultContinue}
      />
    );
  }

  if (showSummary) {
    return (
      <SummaryScreen
        xpEarned={sessionXp}
        correctCount={sessionCorrect}
        totalCount={sessionTotal}
        topicColor={topicColor}
        onContinue={() => navigation.goBack()}
      />
    );
  }

  const renderQuestion = () => {
    const commonProps = {
      question: currentQuestion,
      onAnswer: handleAnswer,
      disabled: answered || submitting,
    };
    switch (currentQuestion.type) {
      case "order": return <OrderQuestion key={`${curExIdx}-${currentQIdx}`} {...commonProps} />;
      case "type":  return <TypeQuestion  key={`${curExIdx}-${currentQIdx}`} {...commonProps} language={language} />;
      case "audio": return <AudioQuestion key={`${curExIdx}-${currentQIdx}`} {...commonProps} />;
      case "mcq":
      default:      return <MCQQuestion   key={`${curExIdx}-${currentQIdx}`} {...commonProps} />;
    }
  };

  return (
    <View style={s.root}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.closeBtn}>
            <Ionicons name="close" size={22} color="#64748b" />
          </TouchableOpacity>
          <View style={s.progressTrack}>
            <Animated.View
              style={[
                s.progressFill,
                {
                  width: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }),
                  backgroundColor: topicColor,
                },
              ]}
            />
          </View>
          <View style={s.heartsRow}>
            {isPaid ? (
              <>
                <Ionicons name="heart" size={17} color="#ef4444" />
                <Ionicons name="heart" size={17} color="#ef4444" />
                <Ionicons name="heart" size={17} color="#ef4444" />
                <Text style={s.infinityTxt}>∞</Text>
              </>
            ) : (
              Array.from({ length: MAX_HEARTS }).map((_, i) => (
                <Ionicons
                  key={i}
                  name={i < hearts ? "heart" : "heart-outline"}
                  size={17}
                  color={i < hearts ? "#ef4444" : "#e2e8f0"}
                />
              ))
            )}
          </View>
        </View>

        <View style={s.breadcrumb}>
          {topicIconFamily === "Ionicons"
            ? <Ionicons name={topicIcon || "book-outline"} size={20} color={topicColor} />
            : <Text style={s.breadcrumbIcon}>{topicIcon}</Text>
          }
          <Text style={s.breadcrumbTxt}>{topicTitle}</Text>
          <View style={[s.exBadge, { backgroundColor: topicColor + "18" }]}>
            <Text style={[s.exBadgeTxt, { color: topicColor }]}>
              {curExIdx + 1}/{totalExercises}
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={s.questionScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <CharacterBubble
            text={
              currentQuestion.type === "order"
                ? `Bëj fjalinë:\n"${currentQuestion.answer}"`
                : currentQuestion.text
            }
            topicColor={topicColor}
            questionType={currentQuestion.type}
            questionKey={`${curExIdx}-${currentQIdx}`}
          />
          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            {renderQuestion()}
          </Animated.View>
        </ScrollView>

        <View style={s.xpPopContainer} pointerEvents="none">
          <XpPop xp={currentQuestion?.xpReward ?? 5} visible={showXpPop} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const cb = StyleSheet.create({
  wrap:      { marginBottom: 28 },
  row:       { flexDirection: "row", alignItems: "flex-end", gap: 14 },
  charBox:   {
    width: 110, height: 120, borderRadius: 28, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  charEmoji: { fontSize: 76 },
  bubbleWrap:{ flex: 1, position: "relative" },
  tail:      {
    position: "absolute", left: -10, bottom: 18,
    width: 0, height: 0,
    borderTopWidth: 9, borderTopColor: "transparent",
    borderBottomWidth: 9, borderBottomColor: "transparent",
    borderRightWidth: 12,
  },
  bubble:    {
    backgroundColor: "#fff", borderRadius: 18, padding: 16,
    borderWidth: 2,
    borderBottomWidth: 4, borderBottomColor: "#d4d8e0",
    shadowColor: "#000", shadowOpacity: 0.09, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  bubbleTxt: { fontSize: 18, fontWeight: "900", color: "#0f172a", lineHeight: 26 },
});

const q = StyleSheet.create({
  container: { paddingHorizontal: 4 },
  desc: {
    fontSize: 13, color: "#64748b", fontWeight: "500",
    backgroundColor: "#f8fafc", borderRadius: 10,
    padding: 12, marginBottom: 14, lineHeight: 18,
  },
  questionText: { fontSize: 22, fontWeight: "900", color: "#0f172a", marginBottom: 28, lineHeight: 30 },
  optionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  option: {
    alignItems: "center", justifyContent: "center",
    padding: 22, borderRadius: 20, borderWidth: 2.5,
    width: "48%", minHeight: 110, gap: 6,
    borderBottomWidth: 5, borderBottomColor: "#c8d0da",
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09, shadowRadius: 6, elevation: 4,
  },
  optionTxt: { fontSize: 17, fontWeight: "800", color: "#0f172a", textAlign: "center", flexWrap: "wrap" },
  optionsList: { gap: 12 },
  optionRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 16, borderRadius: 16, borderWidth: 2,
    borderBottomWidth: 5, borderBottomColor: "#c8d0da",
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09, shadowRadius: 6, elevation: 4,
  },
  optionRowTxt: { fontSize: 16, fontWeight: "700", color: "#0f172a", flex: 1 },
  input: {
    borderWidth: 2, borderColor: "#e2e8f0", borderRadius: 16, padding: 16,
    fontSize: 17, fontWeight: "700", color: "#0f172a",
    backgroundColor: "#f8fafc", marginBottom: 14,
  },
  inputCorrect: { borderColor: "#10b981", backgroundColor: "#ecfdf5" },
  inputWrong: { borderColor: "#ef4444", backgroundColor: "#fef2f2" },
  feedback: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, marginBottom: 14 },
  feedbackOk: { backgroundColor: "#ecfdf5" },
  feedbackErr: { backgroundColor: "#fef2f2" },
  feedbackTxt: { fontSize: 14, fontWeight: "700" },
  submitBtn: {
    backgroundColor: "#8b5cf6", paddingVertical: 16, borderRadius: 16, alignItems: "center", marginTop: 8,
    borderBottomWidth: 4, borderBottomColor: "#6d28d9",
    shadowColor: "#8b5cf6", shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 5,
  },
  submitBtnDisabled: { backgroundColor: "#cbd5e1", borderBottomColor: "#94a3b8" },
  submitBtnTxt: { color: "#fff", fontSize: 16, fontWeight: "900" },
  charRow:        { marginBottom: 12, marginTop: -4 },
  charRowContent: { flexDirection: "row", gap: 8, paddingVertical: 4 },
  charBtn: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, backgroundColor: "#fff",
    borderWidth: 2, borderColor: "#e2e8f0",
    borderBottomWidth: 4, borderBottomColor: "#c8d0da",
    shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  charTxt: { fontSize: 17, fontWeight: "800", color: "#0f172a" },
  answerZone: {
    minHeight: 64, borderWidth: 2, borderColor: "#e2e8f0",
    borderRadius: 16, padding: 12, marginBottom: 16, backgroundColor: "#f8fafc",
  },
  answerZoneOk: { borderColor: "#10b981", backgroundColor: "#ecfdf5" },
  answerZoneErr: { borderColor: "#ef4444", backgroundColor: "#fef2f2" },
  answerPlaceholder: { color: "#94a3b8", fontSize: 14, fontWeight: "500" },
  wordRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  wordChip: {
    backgroundColor: "#fff", paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 12, borderWidth: 2, borderColor: "#e2e8f0",
    borderBottomWidth: 4, borderBottomColor: "#c8d0da",
    shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  wordChipSelected: {
    backgroundColor: "#8b5cf620", paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 12, borderWidth: 2, borderColor: "#8b5cf6",
    borderBottomWidth: 4, borderBottomColor: "#6d28d9",
    shadowColor: "#8b5cf6", shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  wordChipTxt: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  playBtn: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: "#8b5cf6",
    alignItems: "center", justifyContent: "center", alignSelf: "center",
    marginVertical: 20,
    shadowColor: "#8b5cf6", shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8f5f0" },
  center: { alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9",
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0",
    alignItems: "center", justifyContent: "center",
  },
  progressTrack: { flex: 1, height: 10, backgroundColor: "#f1f5f9", borderRadius: 5, overflow: "hidden" },
  progressFill: { height: 10, borderRadius: 5 },
  heartsRow:   { flexDirection: "row", gap: 4, alignItems: "center" },
  infinityTxt: { fontSize: 14, fontWeight: "900", color: "#ef4444", marginLeft: 2 },
  breadcrumb: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 12 },
  breadcrumbIcon: { fontSize: 20 },
  breadcrumbTxt: { fontSize: 15, fontWeight: "800", color: "#0f172a", flex: 1 },
  exBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  exBadgeTxt: { fontSize: 12, fontWeight: "800" },
  questionCounter: {
    fontSize: 11, fontWeight: "800", color: "#94a3b8",
    letterSpacing: 1, paddingHorizontal: 20, marginBottom: 4,
  },
  questionScroll: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 },
  xpPopContainer: { position: "absolute", right: 28, bottom: 100, alignItems: "center" },
  xpPop: {
    backgroundColor: "#fbbf24", paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20,
    shadowColor: "#fbbf24", shadowOpacity: 0.5, shadowRadius: 8, elevation: 6,
  },
  xpPopTxt: { color: "#fff", fontSize: 15, fontWeight: "900" },
  summaryContainer: { flex: 1, backgroundColor: "#f8f5f0", alignItems: "center", justifyContent: "center", padding: 24 },
  summaryCard: {
    width: "100%", backgroundColor: "#fff", borderRadius: 28, padding: 32, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
  summaryEmoji: { fontSize: 56, marginBottom: 16 },
  summaryTitle: { fontSize: 26, fontWeight: "900", color: "#0f172a", marginBottom: 6, textAlign: "center" },
  summarySub: { fontSize: 15, color: "#64748b", fontWeight: "500", marginBottom: 24, textAlign: "center" },
  xpBadge: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, marginBottom: 20 },
  xpBadgeTxt: { fontSize: 18, fontWeight: "900" },
  starsRow: { flexDirection: "row", gap: 10, marginBottom: 28 },
  continueBtn: {
    width: "100%", flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 18,
    borderBottomWidth: 4, borderBottomColor: "rgba(0,0,0,0.18)",
  },
  continueBtnTxt: { color: "#fff", fontSize: 17, fontWeight: "900" },
});

const er = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8f5f0", alignItems: "center", justifyContent: "center", padding: 28 },
  card: {
    width: "100%", backgroundColor: "#fff", borderRadius: 32, padding: 32,
    alignItems: "center", gap: 12,
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
  emoji:   { fontSize: 64, marginBottom: 4 },
  title:   { fontSize: 28, fontWeight: "900", textAlign: "center" },
  exNum:   { fontSize: 14, fontWeight: "700", color: "#94a3b8", letterSpacing: 1 },
  xpRow:   { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16 },
  xpTxt:   { fontSize: 20, fontWeight: "900" },
  starsRow:{ flexDirection: "row", gap: 10 },
  sub:     { fontSize: 14, color: "#94a3b8", fontWeight: "600" },
  btn:     { width: "100%", paddingVertical: 18, borderRadius: 18, alignItems: "center", marginTop: 8, borderBottomWidth: 4, borderBottomColor: "rgba(0,0,0,0.18)" },
  btnTxt:  { color: "#fff", fontSize: 18, fontWeight: "900" },
});
