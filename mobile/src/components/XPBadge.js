import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function XPBadge({ amount, size = "md" }) {
  const small = size === "sm";
  return (
    <View style={[styles.badge, small && styles.badgeSm]}>
      <Ionicons name="star" size={small ? 12 : 14} color="#fbbf24" />
      <Text style={[styles.text, small && styles.textSm]}>+{amount} XP</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#fbbf2422", borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: "#fbbf2444",
  },
  badgeSm: { paddingHorizontal: 7, paddingVertical: 3 },
  text: { color: "#fbbf24", fontWeight: "700", fontSize: 13 },
  textSm: { fontSize: 11 },
});
