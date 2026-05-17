import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { authService } from "../../services/api";

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim().toLowerCase());
      Alert.alert("Email Sent", "Check your inbox for password reset instructions.", [
        { text: "OK", onPress: () => navigation.navigate("SignIn") },
      ]);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={["#0f0f1a", "#1a1a2e", "#16213e"]} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, padding: 24 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#6c63ff" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Ionicons name="lock-open-outline" size={56} color="#6c63ff" style={{ marginBottom: 16 }} />
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>Enter your email and we'll send you reset instructions.</Text>
        </View>

        <Text style={styles.label}>Email</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="mail-outline" size={18} color="#6c63ff" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#444466"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send Reset Link</Text>}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: { marginTop: 16, marginBottom: 24 },
  header: { alignItems: "center", marginBottom: 36 },
  title: { fontSize: 26, fontWeight: "700", color: "#fff" },
  subtitle: { color: "#8888aa", fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 20 },
  label: { color: "#aaaacc", fontSize: 13, fontWeight: "600", marginBottom: 8 },
  inputWrapper: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#1e1e3a", borderRadius: 12,
    borderWidth: 1, borderColor: "#2a2a4a", paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, color: "#fff", paddingVertical: 14, fontSize: 15 },
  btn: {
    backgroundColor: "#6c63ff", borderRadius: 12,
    paddingVertical: 15, alignItems: "center", marginTop: 20,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
