import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const ALL_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const LEVEL_COLORS = {
  A1: "#10b981", A2: "#0ea5e9",
  B1: "#8b5cf6", B2: "#ec4899",
  C1: "#f97316", C2: "#ef4444",
};

/**
 * Shared section header — single boxed card with gradient top + white level picker bottom.
 *
 * Props:
 *   gradientColors   – [start, mid?, end] for the hero gradient
 *   label            – tiny uppercase eyebrow text
 *   title            – large heading
 *   subtitle         – description line
 *   description      – longer description box
 *   icon             – Ionicons name shown in eyebrow
 *   stat             – { icon, value, label } right-side badge  (null = hidden)
 *   progress         – 0..1  (null = hidden)
 *   levels           – level array (default ALL_LEVELS)
 *   selectedLevel
 *   onLevelChange
 *   children         – rendered inside the white bottom section (e.g. control row)
 */
export function SectionHeader({
  gradientColors = ["#7c2d12", "#c2410c", "#ea580c"],
  label = "PRAKTIKË GJUHËSORE",
  title,
  subtitle,
  description,
  icon = "sparkles",
  stat,
  progress,
  levels = ALL_LEVELS,
  selectedLevel,
  onLevelChange,
  children,
}) {
  return (
    /* Outer wrapper carries the shadow */
    <View style={s.outerShadow}>
      {/* Inner clips the gradient to the rounded corners */}
      <View style={s.innerClip}>

        {/* ── Gradient hero ──────────────────────────────────────────────────── */}
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.hero}
        >
          {/* Decorative blobs */}
          <View style={s.blob1} />
          <View style={s.blob2} />
          <View style={s.blob3} />

          <SafeAreaView edges={["top"]}>
            {/* Eyebrow */}
            <View style={s.eyebrowRow}>
              <View style={s.eyebrowPill}>
                <Ionicons name={icon} size={10} color="rgba(255,255,255,0.9)" />
                <Text style={s.eyebrowText}>{label}</Text>
              </View>
            </View>

            {/* Main row */}
            <View style={s.heroRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.heroTitle}>{title}</Text>
                {subtitle && <Text style={s.heroSub}>{subtitle}</Text>}
                {description && (
                  <View style={s.descBox}>
                    <Text style={s.descText}>{description}</Text>
                  </View>
                )}
              </View>

              {stat && (
                <View style={s.statBadge}>
                  <View style={s.statIconWrap}>
                    <Ionicons name={stat.icon} size={18} color="#fff" />
                  </View>
                  <Text style={s.statValue}>{stat.value}</Text>
                  <Text style={s.statLabel}>{stat.label}</Text>
                </View>
              )}
            </View>

            {/* Progress bar */}
            {progress != null && (
              <View style={s.progressWrap}>
                <View style={s.progressRow}>
                  <Text style={s.progressLbl}>Progresi</Text>
                  <Text style={s.progressPct}>{Math.round(progress * 100)}%</Text>
                </View>
                <View style={s.progressBg}>
                  <View style={[s.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
                </View>
              </View>
            )}
          </SafeAreaView>
        </LinearGradient>

        {/* ── White bottom: level picker + optional children ─────────────────── */}
        <View style={s.bottomBox}>
          <Text style={s.levelLabel}>Zgjidhni nivelin</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.levelRow}
          >
            {levels.map((level) => {
              const active = selectedLevel === level;
              const color  = LEVEL_COLORS[level];
              return active ? (
                <LinearGradient
                  key={level}
                  colors={[color, color + "cc"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.levelPillActive}
                >
                  <Text style={s.levelPillTextActive}>{level}</Text>
                </LinearGradient>
              ) : (
                <TouchableOpacity
                  key={level}
                  style={[s.levelPill, { borderColor: color + "55", backgroundColor: color + "10" }]}
                  onPress={() => onLevelChange?.(level)}
                  activeOpacity={0.75}
                >
                  <Text style={[s.levelPillText, { color }]}>{level}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {children && <View style={s.controls}>{children}</View>}
        </View>

      </View>
    </View>
  );
}

const s = StyleSheet.create({
  /* ── Box shell */
  outerShadow: {
    marginHorizontal: 5,
    marginTop: 5,
    borderRadius: 24,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.13,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 7 },
    elevation: 9,
  },
  innerClip: {
    borderRadius: 24,
    overflow: "hidden",
  },

  /* ── Hero */
  hero: {
    paddingHorizontal: 22,
    paddingBottom: 26,
  },

  /* Blobs */
  blob1: {
    position: "absolute", top: -40, right: -30,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  blob2: {
    position: "absolute", bottom: 10, right: 60,
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  blob3: {
    position: "absolute", top: 60, left: -40,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: "rgba(0,0,0,0.08)",
  },

  /* Eyebrow */
  eyebrowRow:  { marginBottom: 14, marginTop: 6 },
  eyebrowPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },
  eyebrowText: {
    color: "rgba(255,255,255,0.9)", fontSize: 10,
    fontWeight: "800", letterSpacing: 1.2,
  },

  /* Title row */
  heroRow:   { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  heroTitle: {
    color: "#fff", fontSize: 30, fontWeight: "900",
    letterSpacing: -0.8, lineHeight: 34, flex: 1,
  },
  heroSub: {
    color: "rgba(255,255,255,0.7)", fontSize: 13,
    fontWeight: "500", marginTop: 6, lineHeight: 18,
  },
  descBox: {
    marginTop: 12,
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    borderLeftWidth: 3, borderLeftColor: "rgba(255,255,255,0.4)",
  },
  descText: {
    color: "rgba(255,255,255,0.82)", fontSize: 12,
    fontWeight: "500", lineHeight: 18,
  },

  /* Stat badge */
  statBadge: {
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 20, padding: 14,
    alignItems: "center", minWidth: 70,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
  },
  statIconWrap: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center", marginBottom: 6,
  },
  statValue: { color: "#fff", fontSize: 18, fontWeight: "900", lineHeight: 20 },
  statLabel: {
    color: "rgba(255,255,255,0.65)", fontSize: 10,
    fontWeight: "600", marginTop: 2,
  },

  /* Progress */
  progressWrap: { marginTop: 20 },
  progressRow:  { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  progressLbl:  { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "600" },
  progressPct:  { color: "#fff", fontSize: 11, fontWeight: "800" },
  progressBg:   {
    height: 6, backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 99, overflow: "hidden",
  },
  progressFill: {
    height: "100%", backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 99,
  },

  /* ── White bottom */
  bottomBox: {
    backgroundColor: "#fff",
    paddingTop: 16,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.04)",
  },
  levelLabel: {
    fontSize: 10, fontWeight: "800", color: "#94a3b8",
    letterSpacing: 1.2, marginLeft: 16, marginBottom: 10,
  },
  levelRow: { paddingHorizontal: 14, gap: 8 },

  levelPill: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
  },
  levelPillActive: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000", shadowOpacity: 0.15,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  levelPillText:       { fontSize: 13, fontWeight: "800" },
  levelPillTextActive: { color: "#fff", fontSize: 13, fontWeight: "800" },

  /* Extra controls slot */
  controls: { marginTop: 12, paddingHorizontal: 14 },
});
