import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

/**
 * Reusable hero header for all screens.
 *
 * Props:
 *  colors      – LinearGradient color array  (default: amber/gold)
 *  icon        – Ionicons name for the eyebrow row
 *  eyebrow     – small uppercase label above the title
 *  title       – large bold title
 *  subtitle    – smaller text below title
 *  statIcon    – Ionicons name shown in the right stat box
 *  statValue   – number / string displayed large in stat box
 *  statLabel   – small label under stat value
 *  children    – optional extra content rendered below the gradient block
 */
export default function ScreenHeader({
  colors      = ["#b45309", "#d97706", "#f59e0b", "#fcd34d"],
  icon        = "book-outline",
  eyebrow     = "",
  title       = "",
  subtitle    = "",
  statIcon    = null,
  statValue   = null,
  statLabel   = "",
  children,
}) {
  const showStat = statIcon !== null && statValue !== null;

  return (
    <>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.hero}
      >
        {/* decorative circles */}
        <View style={s.heroCircle1} />
        <View style={s.heroCircle2} />

        {/* left: eyebrow + title + subtitle */}
        <View style={s.heroLeft}>
          {!!eyebrow && (
            <View style={s.eyebrowRow}>
              <Ionicons name={icon} size={12} color="rgba(255,255,255,0.85)" />
              <Text style={s.eyebrow}>{eyebrow}</Text>
            </View>
          )}
          <Text style={s.title}>{title}</Text>
          {!!subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
        </View>

        {/* right: optional stat box */}
        {showStat && (
          <View style={s.statBox}>
            <View style={s.statIconWrap}>
              <Ionicons name={statIcon} size={16} color="#fff" />
            </View>
            <View>
              <Text style={s.statValue}>{statValue}</Text>
              <Text style={s.statLabel}>{statLabel}</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      {children}
    </>
  );
}

// ── Preset color palettes for quick use ──────────────────────────────────────
export const HEADER_COLORS = {
  amber:   ["#b45309", "#d97706", "#f59e0b", "#fcd34d"],
  purple:  ["#4c1d95", "#6d28d9", "#7c3aed", "#a78bfa"],
  emerald: ["#064e3b", "#065f46", "#10b981", "#34d399"],
  blue:    ["#1e3a5f", "#1d4ed8", "#3b82f6", "#93c5fd"],
  rose:    ["#881337", "#be123c", "#f43f5e", "#fda4af"],
  dark:    ["#0f0f13", "#1e1e2e", "#2d2d40", "#3d3d55"],
  teal:    ["#134e4a", "#0f766e", "#14b8a6", "#5eead4"],
  orange:  ["#7c2d12", "#c2410c", "#ea580c", "#fb923c"],
};

const s = StyleSheet.create({
  hero: {
    flexDirection: "row",
    alignItems: "center",
    padding: 22,
    borderRadius: 20,
    marginBottom: 12,
    overflow: "hidden",
    position: "relative",
  },

  heroCircle1: {
    position: "absolute", top: -40, right: -40,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  heroCircle2: {
    position: "absolute", bottom: -50, right: 60,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  heroLeft: { flex: 1 },

  eyebrowRow: {
    flexDirection: "row", alignItems: "center",
    gap: 5, marginBottom: 8,
  },
  eyebrow: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11, fontWeight: "700",
    letterSpacing: 0.8, textTransform: "uppercase",
  },

  title: {
    color: "#fff",
    fontSize: 26, fontWeight: "900",
    marginBottom: 6, lineHeight: 30,
  },
  subtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13, lineHeight: 18,
  },

  statBox: {
    backgroundColor: "rgba(0,0,0,0.15)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 14, padding: 14,
    flexDirection: "row", alignItems: "center",
    gap: 10, marginLeft: 12,
  },
  statIconWrap: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  statValue: {
    color: "#fff", fontSize: 20,
    fontWeight: "700", lineHeight: 22,
  },
  statLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11, fontWeight: "600",
  },
});
