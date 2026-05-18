import { useRef, useState, useCallback, useEffect, useMemo, memo } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Keyboard, Platform,
  Dimensions, ScrollView, Modal, Animated, Easing,
  TouchableWithoutFeedback, Image,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { aiTutorService, generateDicebearUrl } from "../../services/api";
import { F } from "../../styles/fonts";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";

const { width, height } = Dimensions.get("window");

// ── Constants ─────────────────────────────────────────────────────────────────
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const LEVEL_COLOR = {
  A1: { color: "#10b981", bg: "#f0fdf4" },
  A2: { color: "#06b6d4", bg: "#ecfeff" },
  B1: { color: "#6366f1", bg: "#eef2ff" },
  B2: { color: "#8b5cf6", bg: "#f5f3ff" },
  C1: { color: "#f59e0b", bg: "#fffbeb" },
  C2: { color: "#ef4444", bg: "#fff1f2" },
};

const TRANSLATE_TOPIC = "__translate__";

const TOPICS = {
  de: [
    { label: "Të gjitha", value: null },
    { label: "Përkthim 🔄", value: TRANSLATE_TOPIC },
    { label: "Gramatikë", value: "gramatikë gjermane" },
    { label: "Artikujt",  value: "artikujt der die das" },
    { label: "Foljet",    value: "zgjedhimin e foljeve gjermane" },
    { label: "Rasat",     value: "rasat gjermane Nominativ Akkusativ Dativ" },
    { label: "Fjalori",   value: "fjalori gjerman" },
    { label: "Bisedë",    value: "bisedë praktike gjermane" },
  ],
  en: [
    { label: "Të gjitha", value: null },
    { label: "Përkthim 🔄", value: TRANSLATE_TOPIC },
    { label: "Gramatikë", value: "gramatikë angleze" },
    { label: "Kohët",     value: "kohët e foljeve angleze" },
    { label: "Fjalori",   value: "fjalori anglez" },
    { label: "Shkrimi",   value: "shkrimi i saktë anglez" },
    { label: "Bisedë",    value: "bisedë praktike angleze" },
  ],
  fr: [
    { label: "Të gjitha", value: null },
    { label: "Përkthim 🔄", value: TRANSLATE_TOPIC },
    { label: "Gramatikë", value: "gramatikë frënge" },
    { label: "Artikujt",  value: "artikujt frëngë le la les" },
    { label: "Foljet",    value: "zgjedhimin e foljeve frënge" },
    { label: "Fjalori",   value: "fjalori frëng" },
    { label: "Bisedë",    value: "bisedë praktike frënge" },
  ],
  it: [
    { label: "Të gjitha", value: null },
    { label: "Përkthim 🔄", value: TRANSLATE_TOPIC },
    { label: "Gramatikë", value: "gramatikë italiane" },
    { label: "Artikujt",  value: "artikujt italianë il la i le" },
    { label: "Foljet",    value: "zgjedhimin e foljeve italiane" },
    { label: "Fjalori",   value: "fjalori italian" },
    { label: "Bisedë",    value: "bisedë praktike italiane" },
  ],
  es: [
    { label: "Të gjitha", value: null },
    { label: "Përkthim 🔄", value: TRANSLATE_TOPIC },
    { label: "Gramatikë", value: "gramatikë spanjolle" },
    { label: "Gjinia",    value: "gjinia dhe artikujt spanjollë el la los las" },
    { label: "Foljet",    value: "zgjedhimin e foljeve spanjolle" },
    { label: "Fjalori",   value: "fjalori spanjoll" },
    { label: "Bisedë",    value: "bisedë praktike spanjolle" },
  ],
};

const LANG_INFO = {
  de: { flag: "🇩🇪", name: "gjermane" },
  en: { flag: "🇬🇧", name: "angleze" },
  fr: { flag: "🇫🇷", name: "frënge" },
  it: { flag: "🇮🇹", name: "italiane" },
  es: { flag: "🇪🇸", name: "spanjolle" },
};

// ── Parse QUIZ: prefix ────────────────────────────────────────────────────────
function parseMessage(content) {
  if (typeof content === "string" && content.startsWith("QUIZ:")) {
    try {
      const json = JSON.parse(content.slice(5).trim());
      if (json.question && Array.isArray(json.options) && json.options.length === 4) {
        if (!json.target && json.german) json.target = json.german;
        return { type: "quiz", quiz: json };
      }
    } catch (_) {}
  }
  return { type: "text" };
}

// ── Markdown renderer ─────────────────────────────────────────────────────────
const MarkdownText = memo(function MarkdownText({ text, style }) {
  const parts = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let last = 0, match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push({ t: text.slice(last, match.index), bold: false, italic: false });
    if (match[0].startsWith("**")) parts.push({ t: match[2], bold: true, italic: false });
    else                           parts.push({ t: match[3], bold: false, italic: true });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ t: text.slice(last), bold: false, italic: false });

  return (
    <Text style={style}>
      {parts.map((p, i) => (
        <Text key={i} style={[
          p.bold   && { fontFamily: F.black, color: "#0f172a" },
          p.italic && { fontStyle: "italic", color: "#4338ca" },
        ]}>{p.t}</Text>
      ))}
    </Text>
  );
});

// ── Avatars ───────────────────────────────────────────────────────────────────
const AiAvatar = memo(function AiAvatar({ size = 32 }) {
  return (
    <LinearGradient colors={["#f472b6", "#f97316"]} style={[av.ai, { width: size, height: size, borderRadius: size * 0.3 }]}>
      <Ionicons name="sparkles" size={size * 0.45} color="#fff" />
    </LinearGradient>
  );
});

const UserAvatar = memo(function UserAvatar({ user, size = 32 }) {
  const url = user?.id && user?.avatarStyle ? generateDicebearUrl(user.id, user.avatarStyle) : null;
  const initials = user?.emri ? user.emri.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?";
  const r = size * 0.3;
  if (url) return <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: r, borderWidth: 1.5, borderColor: "#6ee7b7" }} />;
  return (
    <View style={{ width: size, height: size, borderRadius: r, backgroundColor: "#d1fae5", alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontFamily: F.black, fontSize: size * 0.35, color: "#065f46" }}>{initials}</Text>
    </View>
  );
});

const av = StyleSheet.create({
  ai: { alignItems: "center", justifyContent: "center" },
});

// ── Quiz card ─────────────────────────────────────────────────────────────────
const QuizCard = memo(function QuizCard({ quiz, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const letters = ["A", "B", "C", "D"];

  function pick(idx) {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    onAnswer(idx === quiz.correct, quiz.options[quiz.correct], quiz.explanation);
  }

  return (
    <View style={q.card}>
      <View style={q.badge}><Ionicons name="help-circle" size={13} color="#6366f1" /><Text style={q.badgeText}>Kuiz</Text></View>
      <Text style={q.question}>{quiz.question}</Text>
      {quiz.target ? <Text style={q.target}>{quiz.target}</Text> : null}
      <View style={q.options}>
        {quiz.options.map((opt, idx) => {
          let bg = "#f8fafc", border = "#e2e8f0", color = "#0f172a";
          if (answered && idx === quiz.correct)           { bg = "#f0fdf4"; border = "#6ee7b7"; color = "#065f46"; }
          else if (answered && idx === selected)          { bg = "#fff1f2"; border = "#fca5a5"; color = "#991b1b"; }
          return (
            <TouchableOpacity key={idx} style={[q.option, { backgroundColor: bg, borderColor: border }]} onPress={() => pick(idx)} activeOpacity={answered ? 1 : 0.75} disabled={answered}>
              <View style={[q.letter, answered && idx === quiz.correct && q.letterOk, answered && idx === selected && idx !== quiz.correct && q.letterWrong]}>
                <Text style={[q.letterTxt, answered && idx === quiz.correct && { color: "#10b981" }, answered && idx === selected && idx !== quiz.correct && { color: "#ef4444" }]}>{letters[idx]}</Text>
              </View>
              <Text style={[q.optTxt, { color }]}>{opt}</Text>
              {answered && idx === quiz.correct && <Ionicons name="checkmark-circle" size={17} color="#10b981" style={{ marginLeft: "auto" }} />}
              {answered && idx === selected && idx !== quiz.correct && <Ionicons name="close-circle" size={17} color="#ef4444" style={{ marginLeft: "auto" }} />}
            </TouchableOpacity>
          );
        })}
      </View>
      {answered && (
        <View style={[q.explanation, selected === quiz.correct ? q.expOk : q.expWrong]}>
          <Ionicons name={selected === quiz.correct ? "checkmark-circle-outline" : "close-circle-outline"} size={15} color={selected === quiz.correct ? "#059669" : "#dc2626"} />
          <Text style={[q.expTxt, { color: selected === quiz.correct ? "#065f46" : "#991b1b" }]}>{quiz.explanation}</Text>
        </View>
      )}
    </View>
  );
});

// ── Message bubble ────────────────────────────────────────────────────────────
const MessageBubble = memo(function MessageBubble({ item, onAnswer, user }) {
  const isUser = item.role === "user";
  if (item.type === "quiz") {
    return (
      <View style={[mb.row, { alignItems: "flex-start" }]}>
        <AiAvatar />
        <QuizCard quiz={item.quiz} onAnswer={onAnswer} />
      </View>
    );
  }
  return (
    <View style={[mb.row, isUser && mb.rowUser]}>
      {isUser ? <UserAvatar user={user} /> : <AiAvatar />}
      <View style={[mb.bubble, isUser ? mb.bubbleUser : mb.bubbleAI]}>
        <MarkdownText text={item.content} style={[mb.text, isUser && mb.textUser]} />
      </View>
    </View>
  );
});

const TypingIndicator = memo(function TypingIndicator() {
  const d1 = useRef(new Animated.Value(0)).current;
  const d2 = useRef(new Animated.Value(0)).current;
  const d3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bounce = (dot, delay) => Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(dot, { toValue: -6, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(dot, { toValue: 0,  duration: 260, easing: Easing.in(Easing.quad),  useNativeDriver: true }),
        Animated.delay(480 - delay),
      ])
    );
    const a1 = bounce(d1, 0);
    const a2 = bounce(d2, 160);
    const a3 = bounce(d3, 320);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={mb.row}>
      <AiAvatar />
      <View style={[mb.bubble, mb.bubbleAI, { flexDirection: "row", gap: 6, alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 }]}>
        {[d1, d2, d3].map((d, i) => (
          <Animated.View key={i} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#f472b6", transform: [{ translateY: d }] }} />
        ))}
      </View>
    </View>
  );
});

// ── Settings sheet ────────────────────────────────────────────────────────────
const SettingsSheet = memo(function SettingsSheet({ visible, onClose, language, level, setLevel, topic, setTopic }) {
  const slideAnim = useRef(new Animated.Value(600)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const topics    = TOPICS[language] || TOPICS.de;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0,   duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(fadeAnim,  { toValue: 1,   duration: 240, useNativeDriver: true }),
      ]).start();
    } else {
      slideAnim.setValue(600);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  function close() {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 600, duration: 280, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 0,   duration: 220, useNativeDriver: true }),
    ]).start(() => onClose());
  }

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={close}>
      <TouchableWithoutFeedback onPress={close}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.45)", opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>
      <Animated.View style={[ss.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={ss.handle} />
        <View style={ss.header}>
          <Text style={ss.title}>Cilësimet e Tutorit</Text>
          <TouchableOpacity style={ss.closeBtn} onPress={close} activeOpacity={0.75}>
            <Ionicons name="close" size={18} color="#0f172a" />
          </TouchableOpacity>
        </View>

        <Text style={ss.sectionLabel}>NIVELI</Text>
        <View style={ss.chipRow}>
          {LEVELS.map(lv => {
            const active = level === lv;
            const c = LEVEL_COLOR[lv];
            return (
              <TouchableOpacity key={lv} style={[ss.chip, { borderColor: active ? c.color : "#e2e8f0", backgroundColor: active ? c.bg : "#f8fafc" }]} onPress={() => setLevel(active ? null : lv)} activeOpacity={0.75}>
                <Text style={[ss.chipText, { color: active ? c.color : "#94a3b8" }]}>{lv}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={ss.sectionLabel}>TEMA</Text>
        <View style={ss.chipRow}>
          {topics.map((t, i) => {
            const active = topic === t.value;
            return (
              <TouchableOpacity key={i} style={[ss.chip, { borderColor: active ? "#f472b6" : "#e2e8f0", backgroundColor: active ? "#fdf2f8" : "#f8fafc" }]} onPress={() => setTopic(active ? null : t.value)} activeOpacity={0.75}>
                {active && <Ionicons name="checkmark" size={11} color="#f472b6" />}
                <Text style={[ss.chipText, { color: active ? "#be185d" : "#64748b" }]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {(level || topic) && (
          <View style={ss.summary}>
            <Text style={ss.summaryText}>{[level && `Nivel: ${level}`, topic && `Temë: ${topic}`].filter(Boolean).join(" • ")}</Text>
            <TouchableOpacity onPress={() => { setLevel(null); setTopic(null); }} activeOpacity={0.75}>
              <Text style={ss.clearText}>Pastro</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={ss.doneBtn} onPress={close} activeOpacity={0.85}>
          <LinearGradient colors={["#f472b6", "#f97316"]} style={ss.doneGrad}>
            <Text style={ss.doneTxt}>Gati</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function AiTutorScreen({ navigation }) {
  const { language }   = useLanguage();
  const { user }       = useAuth();
  const insets         = useSafeAreaInsets();
  const [messages, setMessages]         = useState([]);
  const [input, setInput]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [level, setLevel]               = useState(null);
  const [topic, setTopic]               = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [kbHeight, setKbHeight]         = useState(0);
  const listRef = useRef(null);

  const firstName = user?.emri?.trim().split(/\s+/)[0] || "Student";
  const info      = LANG_INFO[language] || LANG_INFO.de;
  const hasChat   = messages.length > 0;

  const scrollDown = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => { setKbHeight(e.endCoordinates.height); scrollDown(); }
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKbHeight(0)
    );
    return () => { show.remove(); hide.remove(); };
  }, [scrollDown]);

  const handleAnswer = useCallback((correct, correctAnswer, explanation) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(), role: "assistant", type: "text",
      content: correct ? `✅ Saktë! ${explanation}` : `❌ Jo saktë. Përgjigja e saktë është: "${correctAnswer}"\n\n${explanation}`,
    }]);
    scrollDown();
  }, [scrollDown]);

  const buildHistory = useCallback((msgs, newMsg) => {
    const all = [...msgs, newMsg].filter(m => m.type === "text");
    const mapped = all.map(m => ({ role: m.role, content: m.content }));
    if (mapped.length > 0 && mapped[0].role === "user") {
      if (topic === TRANSLATE_TOPIC) {
        const lvl = level ? `Niveli: ${level}.` : "";
        mapped[0] = { ...mapped[0], content: `[MËNYRË PËRKTHIMI] ${lvl} Jep GJITHMONË 5 fjalë ose shprehje të shkurtra në gjuhën e synuar në një mesazh të vetëm. Numëro ato 1-5. Studenti do t'i përkthejë të gjitha bashkë. Pas përgjigjes, trego cilat janë saktë dhe cilat jo, pastaj jep 5 fjalë të reja. Studenti thotë: ${mapped[0].content}` };
      } else if (topic) {
        mapped[0] = { ...mapped[0], content: `[Tema: ${topic}] ${mapped[0].content}` };
      }
    }
    return mapped;
  }, [topic, level]);

  const sendText = useCallback(async (text) => {
    const t = text?.trim();
    if (!t || loading) return;
    const userMsg = { id: Date.now().toString(), role: "user", type: "text", content: t };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    Keyboard.dismiss();
    scrollDown();
    try {
      const history = buildHistory(messages, userMsg);
      const res     = await aiTutorService.chat(history, language, level);
      const raw     = res.message || res.data?.message || "";
      const parsed  = parseMessage(raw);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: "assistant",
        ...parsed,
        content: parsed.type === "text" ? (raw || "Nuk mora përgjigje.") : raw,
      }]);
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", type: "text", content: "Ndodhi një gabim. Provoni përsëri." }]);
    } finally {
      setLoading(false);
      scrollDown();
    }
  }, [loading, messages, language, level, scrollDown, buildHistory]);

  const send = useCallback(() => sendText(input), [input, sendText]);

  useEffect(() => {
    if (topic === TRANSLATE_TOPIC && messages.length === 0) {
      sendText("Fillo ushtrimet e përkthimit");
    }
  }, [topic]);

  const renderItem = useCallback(({ item }) => (
    <MessageBubble item={item} onAnswer={handleAnswer} user={user} />
  ), [handleAnswer, user]);

  const listFooter = useMemo(() => loading ? <TypingIndicator /> : null, [loading]);

  return (
      <SafeAreaView style={[s.safe, { paddingBottom: kbHeight }]} edges={[]}>

        {/* ── Header ── */}
        <View style={[s.header, { paddingTop: insets.top + 6 }]}>
          <TouchableOpacity style={s.headerBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
            <Ionicons name="arrow-back" size={19} color="#0f172a" />
          </TouchableOpacity>
          <TouchableOpacity style={s.headerBtn} onPress={() => setSettingsOpen(true)} activeOpacity={0.75}>
            <Ionicons name="options-outline" size={19} color="#0f172a" />
            {(level || topic) && <View style={s.settingsDot} />}
          </TouchableOpacity>
        </View>

        <SettingsSheet
          visible={settingsOpen} onClose={() => setSettingsOpen(false)}
          language={language}
          level={level} setLevel={setLevel}
          topic={topic} setTopic={setTopic}
        />

        {/* ── Empty state ── */}
        {!hasChat && !loading && (
          <View style={s.emptyWrap}>
            <View style={s.blobWrap}>
              <LinearGradient
                colors={["#f472b6", "#f97316", "#fb923c"]}
                start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
                style={s.blob}
              />
            </View>

            <Text style={s.greeting}>Hej {firstName},</Text>
            <Text style={s.greetingSub}>çfarë dëshironi të mësoni sot {info.flag}?</Text>

            {(level || topic) && (
              <View style={s.activeFilters}>
                {level && <View style={[s.filterChip, { backgroundColor: LEVEL_COLOR[level]?.bg }]}><Text style={[s.filterChipText, { color: LEVEL_COLOR[level]?.color }]}>{level}</Text></View>}
                {topic && <View style={s.filterChip}><Text style={s.filterChipText}>{topic}</Text></View>}
              </View>
            )}
          </View>
        )}

        {/* ── Chat list ── */}
        {hasChat && (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={item => item.id}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            renderItem={renderItem}
            ListFooterComponent={listFooter}
            removeClippedSubviews={Platform.OS === "android"}
            maxToRenderPerBatch={8}
            windowSize={8}
            initialNumToRender={12}
          />
        )}

        {/* Loading on empty state */}
        {!hasChat && loading && (
          <View style={s.emptyLoading}>
            <TypingIndicator />
          </View>
        )}

        {/* ── Input pill ── */}
        <View style={[s.inputCard, { marginBottom: kbHeight > 0 ? 8 : 16 + insets.bottom }]}>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="Filloni të shkruani..."
            placeholderTextColor="#94a3b8"
            multiline
            maxLength={800}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={send}
          />
          <View style={s.inputRow}>
            <View style={s.modeChips}>
              <View style={s.modeChip}>
                <LinearGradient colors={["#f472b6", "#f97316"]} style={s.modeChipDot} />
                <Text style={s.modeChipText}>AI Tutor</Text>
              </View>
              {level && (
                <View style={[s.modeChip, { backgroundColor: LEVEL_COLOR[level]?.bg }]}>
                  <Text style={[s.modeChipText, { color: LEVEL_COLOR[level]?.color }]}>{level}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[s.sendBtn, (!input.trim() || loading) && { opacity: 0.45 }]}
              onPress={send}
              disabled={!input.trim() || loading}
              activeOpacity={0.8}
            >
              <LinearGradient colors={["#f472b6", "#f97316"]} style={s.sendGrad}>
                <Ionicons name="arrow-up" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

      </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f4f4f6" },

  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 0, paddingBottom: 8,
    backgroundColor: "#f4f4f6",
    zIndex: 10,
  },
  headerBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    position: "relative",
  },
  settingsDot: {
    position: "absolute", top: -2, right: -2,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: "#f472b6", borderWidth: 1.5, borderColor: "#f4f4f6",
  },

  // Empty state
  emptyWrap: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 32, gap: 12,
  },
  blobWrap: {
    width: 180, height: 180,
    alignItems: "center", justifyContent: "center",
    marginBottom: 16,
  },
  blob: {
    width: 160, height: 160, borderRadius: 80,
    shadowColor: "#f472b6", shadowOpacity: 0.4,
    shadowRadius: 40, elevation: 10,
  },
  greeting:    { fontSize: 26, fontFamily: F.black, color: "#0f172a", textAlign: "center" },
  greetingSub: { fontSize: 17, fontFamily: F.semi,  color: "#64748b", textAlign: "center" },
  activeFilters: { flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 8 },
  filterChip: {
    backgroundColor: "#fff", borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12,
    borderWidth: 1, borderColor: "#e2e8f0",
  },
  filterChipText: { fontSize: 12, fontFamily: F.bold, color: "#64748b" },

  // Chat
  list: { padding: 16, gap: 12, paddingBottom: 8 },
  emptyLoading: { flex: 1, justifyContent: "flex-end", padding: 16 },

  // Input card
  inputCard: {
    marginHorizontal: 16, marginTop: 8, backgroundColor: "#fff",
    borderRadius: 24, padding: 14,
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
    gap: 10,
  },
  input: {
    fontSize: 15, fontFamily: F.regular, color: "#0f172a",
    minHeight: 24, maxHeight: 100,
    paddingVertical: 0,
  },
  inputRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  modeChips: { flexDirection: "row", gap: 8, alignItems: "center" },
  modeChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#f4f4f6", borderRadius: 20,
    paddingVertical: 5, paddingHorizontal: 10,
  },
  modeChipDot:  { width: 8, height: 8, borderRadius: 4 },
  modeChipText: { fontSize: 12, fontFamily: F.bold, color: "#64748b" },
  sendBtn: { borderRadius: 20 },
  sendGrad: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
});

const mb = StyleSheet.create({
  row:      { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 4 },
  rowUser:  { flexDirection: "row-reverse" },
  bubble: {
    maxWidth: width * 0.72, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 18, borderWidth: 1,
  },
  bubbleAI:   { backgroundColor: "#fff", borderColor: "#e2e8f0", borderBottomLeftRadius: 4 },
  bubbleUser: { backgroundColor: "#f472b6", borderColor: "#ec4899", borderBottomRightRadius: 4 },
  text:       { fontSize: 14, fontFamily: F.regular, color: "#0f172a", lineHeight: 21 },
  textUser:   { color: "#fff" },
});

const q = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: "#fff", borderRadius: 18,
    borderWidth: 1, borderColor: "#e2e8f0", padding: 14, gap: 10,
    maxWidth: width * 0.82,
  },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    alignSelf: "flex-start",
    backgroundColor: "#eef2ff", borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: "#c7d2fe",
  },
  badgeText: { fontSize: 11, fontFamily: F.bold, color: "#6366f1" },
  question:  { fontSize: 14, fontFamily: F.bold, color: "#0f172a", lineHeight: 20 },
  target: {
    fontSize: 16, fontFamily: F.xbold, color: "#1e293b",
    backgroundColor: "#f8fafc", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: "#e2e8f0", textAlign: "center",
  },
  options: { gap: 8 },
  option: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 12, borderWidth: 1.5, paddingVertical: 11, paddingHorizontal: 12,
  },
  letter: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#e2e8f0",
    alignItems: "center", justifyContent: "center",
  },
  letterOk:    { backgroundColor: "#d1fae5", borderColor: "#a7f3d0" },
  letterWrong: { backgroundColor: "#fee2e2", borderColor: "#fca5a5" },
  letterTxt:   { fontSize: 11, fontFamily: F.black, color: "#64748b" },
  optTxt:      { fontSize: 14, fontFamily: F.semi, flex: 1 },
  explanation: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    borderRadius: 12, padding: 10, borderWidth: 1,
  },
  expOk:    { backgroundColor: "#f0fdf4", borderColor: "#a7f3d0" },
  expWrong: { backgroundColor: "#fff1f2", borderColor: "#fca5a5" },
  expTxt:   { fontSize: 13, lineHeight: 18, flex: 1, fontFamily: F.semi },
});

const ss = StyleSheet.create({
  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, paddingBottom: 40,
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20, elevation: 16,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#e2e8f0", alignSelf: "center", marginBottom: 18 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 22 },
  title:  { fontSize: 17, fontFamily: F.black, color: "#0f172a" },
  closeBtn: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: "#f1ede4", borderWidth: 1, borderColor: "#e5e0d5",
    alignItems: "center", justifyContent: "center",
  },
  sectionLabel: { fontSize: 10, fontFamily: F.black, color: "#94a3b8", letterSpacing: 1.5, marginBottom: 10 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderRadius: 20, borderWidth: 1.5, paddingVertical: 7, paddingHorizontal: 14,
  },
  chipText: { fontSize: 13, fontFamily: F.bold },
  summary: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#fdf2f8", borderRadius: 12,
    paddingVertical: 8, paddingHorizontal: 12, marginBottom: 16,
    borderWidth: 1, borderColor: "#fbcfe8",
  },
  summaryText: { fontSize: 12, fontFamily: F.semi, color: "#be185d", flex: 1 },
  clearText:   { fontSize: 12, fontFamily: F.bold, color: "#ef4444" },
  doneBtn:     { borderRadius: 16, overflow: "hidden", marginTop: 4 },
  doneGrad:    { paddingVertical: 14, alignItems: "center" },
  doneTxt:     { fontSize: 15, fontFamily: F.black, color: "#fff" },
});
