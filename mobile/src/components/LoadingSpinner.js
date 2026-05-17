import { View, ActivityIndicator, Text, StyleSheet } from "react-native";

export default function LoadingSpinner({ message = "Loading..." }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#6c63ff" />
      {message && <Text style={styles.text}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  text: { color: "#8888aa", fontSize: 14 },
});
