import { useEffect, useState, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Alert, StyleSheet, Image, Linking, Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { useAuthRequest, makeRedirectUri } from "expo-auth-session";
import { useAuth } from "../../context/AuthContext";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = "731357407621-rl3kh33odf6dhpg20d3pchciqrl3i6lm.apps.googleusercontent.com";
const GOOGLE_DISCOVERY = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

function GoogleIcon() {
  return (
    <View style={gi.wrap}>
      <View style={[gi.seg, gi.blue]} />
      <View style={[gi.seg, gi.green]} />
      <View style={[gi.seg, gi.yellow]} />
      <View style={[gi.seg, gi.red]} />
      <View style={gi.hole} />
    </View>
  );
}
const gi = StyleSheet.create({
  wrap:   { width: 20, height: 20, borderRadius: 10, overflow: "hidden", position: "relative" },
  seg:    { position: "absolute", width: 10, height: 10 },
  blue:   { top: 0,  left: 10, backgroundColor: "#4285F4" },
  green:  { top: 10, left: 10, backgroundColor: "#34A853" },
  yellow: { top: 10, left: 0,  backgroundColor: "#FBBC05" },
  red:    { top: 0,  left: 0,  backgroundColor: "#EA4335" },
  hole:   { position: "absolute", top: 5, left: 5, width: 10, height: 10, borderRadius: 5, backgroundColor: "#fff" },
});

export default function SignUpScreen({ navigation }) {
  const { register, googleLogin } = useAuth();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [gLoading, setGLoading]   = useState(false);
  const [focused, setFocused]     = useState(null);
  const [tosAccepted, setTos]     = useState(false);
  const [error, setError]         = useState("");

  const cardFade  = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardFade,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(cardSlide, { toValue: 0, duration: 440, useNativeDriver: true }),
    ]).start();
  }, []);

  const set = (k) => (v) => { setForm((f) => ({ ...f, [k]: v })); setError(""); };

  const redirectUri = makeRedirectUri({ useProxy: true });
  const [request, response, promptAsync] = useAuthRequest(
    { clientId: GOOGLE_CLIENT_ID, scopes: ["openid", "profile", "email"], usePKCE: true, redirectUri },
    GOOGLE_DISCOVERY
  );

  useEffect(() => {
    if (response?.type === "success") {
      const token = response.authentication?.accessToken;
      if (token) handleGoogleSignUp(token);
    }
  }, [response]);

  async function handleGoogleSignUp(accessToken) {
    setGLoading(true);
    setError("");
    try {
      await googleLogin(accessToken);
    } catch (err) {
      setError(err.response?.data?.message || "Regjistrimi me Google dështoi. Provoni përsëri.");
    } finally {
      setGLoading(false);
    }
  }

  async function handleRegister() {
    setError("");
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.password) {
      setError("Ju lutem plotësoni të gjitha fushat.");
      return;
    }
    if (form.password.length < 6) {
      setError("Fjalëkalimi duhet të ketë të paktën 6 karaktere.");
      return;
    }
    if (!tosAccepted) {
      setError("Ju duhet të pranoni kushtet dhe afatet për të vazhduar.");
      return;
    }
    setLoading(true);
    try {
      await register({
        emri: form.firstName.trim(),
        mbiemri: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        termsAccepted: true,
      });
      Alert.alert("Llogaria u krijua!", "Kontrolloni email-in tuaj për verifikim.", [
        { text: "OK", onPress: () => navigation.navigate("SignIn") },
      ]);
    } catch (err) {
      const msg = err.response?.data?.message || "";
      if (msg.toLowerCase().includes("ekziston") || msg.toLowerCase().includes("exists")) {
        setError("Ky email është tashmë i regjistruar. Klikoni 'Hyni këtu' për të hyrë.");
      } else {
        setError("Ky email është tashmë i regjistruar. Klikoni 'Hyni këtu' për të hyrë.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={s.root}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[s.card, { opacity: cardFade, transform: [{ translateY: cardSlide }] }]}>

            {/* Header */}
            <View style={s.header}>
              <Image
                source={require("../../assets/mainlogo.png")}
                style={s.logo}
                resizeMode="cover"
              />
              <Text style={s.title}>Regjistrohu</Text>
              <Text style={s.subtitle}>Krijo llogarinë tënde falas</Text>
            </View>

            {/* Error */}
            {!!error && (
              <View style={s.errorBanner}>
                <Text style={s.errorEmoji}>⚠️</Text>
                <Text style={s.errorTxt}>{error}</Text>
              </View>
            )}

            {/* Google */}
            <TouchableOpacity
              style={s.googleBtn}
              onPress={() => promptAsync({ useProxy: true })}
              disabled={!request || gLoading}
              activeOpacity={0.85}
            >
              {gLoading
                ? <ActivityIndicator size="small" color="#374151" />
                : <GoogleIcon />
              }
              <Text style={s.googleTxt}>
                {gLoading ? "Duke u regjistruar..." : "Regjistrohu me Google"}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={s.divRow}>
              <View style={s.divLine} />
              <Text style={s.divTxt}>ose regjistrohu me email</Text>
              <View style={s.divLine} />
            </View>

            {/* Name row */}
            <View style={s.nameRow}>
              {[
                { key: "firstName", label: "Emri",    placeholder: "Emri" },
                { key: "lastName",  label: "Mbiemri", placeholder: "Mbiemri" },
              ].map(({ key, label, placeholder }) => (
                <View key={key} style={[s.fieldWrap, s.fieldHalf]}>
                  <Text style={s.fieldLabel}>{label}</Text>
                  <View style={[s.inputBox, focused === key && s.inputBoxFocused]}>
                    <TextInput
                      style={s.input}
                      placeholder={placeholder}
                      placeholderTextColor="#9ca3af"
                      value={form[key]}
                      onChangeText={set(key)}
                      autoCapitalize="words"
                      autoCorrect={false}
                      onFocus={() => setFocused(key)}
                      onBlur={() => setFocused(null)}
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* Email */}
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>Adresa e email-it</Text>
              <View style={[s.inputBox, focused === "email" && s.inputBoxFocused]}>
                <TextInput
                  style={s.input}
                  placeholder="Shkruani email-in tuaj"
                  placeholderTextColor="#9ca3af"
                  value={form.email}
                  onChangeText={set("email")}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                />
              </View>
            </View>

            {/* Password */}
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>Fjalëkalimi</Text>
              <View style={[s.inputBox, focused === "password" && s.inputBoxFocused]}>
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  placeholder="Të paktën 6 karaktere"
                  placeholderTextColor="#9ca3af"
                  value={form.password}
                  onChangeText={set("password")}
                  secureTextEntry={!showPass}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                />
                <TouchableOpacity onPress={() => setShowPass(p => !p)} style={{ padding: 4 }}>
                  <Text style={{ fontSize: 16 }}>{showPass ? "🙈" : "👁️"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms */}
            <TouchableOpacity
              onPress={() => setTos(v => !v)}
              style={s.tosRow}
              activeOpacity={0.8}
            >
              <View style={[s.checkbox, tosAccepted && s.checkboxOn]}>
                {tosAccepted && <Ionicons name="checkmark" size={13} color="#fff" />}
              </View>
              <Text style={s.tosTxt}>
                Unë pranoj{" "}
                <Text
                  style={s.tosLink}
                  onPress={() => Linking.openURL("https://germanmaster.app/terms")}
                >
                  Kushtet dhe Afatet
                </Text>
                {" "}dhe jam dakord me rregullat e platformës.
              </Text>
            </TouchableOpacity>

            {/* Submit */}
            <TouchableOpacity onPress={handleRegister} disabled={loading} activeOpacity={0.85} style={{ marginTop: 16 }}>
              <LinearGradient
                colors={loading ? ["#9ca3af", "#9ca3af"] : ["#14B8A6", "#06B6D4"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.primaryBtn}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.primaryBtnTxt}>Krijoni llogarinë</Text>
                }
              </LinearGradient>
            </TouchableOpacity>

            {/* Switch */}
            <View style={s.switchRow}>
              <Text style={s.switchTxt}>Keni tashmë një llogari? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("SignIn")} activeOpacity={0.75}>
                <Text style={s.switchLink}>Hyni këtu</Text>
              </TouchableOpacity>
            </View>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: "#f0f9f9" },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 20, paddingVertical: 32 },

  card: {
    backgroundColor: "rgba(255,255,255,0.97)",
    borderRadius: 28,
    padding: 28,
    shadowColor: "#000",
    shadowOpacity: 0.13,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
  },

  // Header
  header:   { alignItems: "center", marginBottom: 20 },
  logo:     { width: 60, height: 60, borderRadius: 30, marginBottom: 14, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 10, elevation: 4 },
  title:    { fontSize: 22, fontWeight: "800", color: "#374151", marginBottom: 4 },
  subtitle: { fontSize: 13, color: "#6b7280" },

  // Error
  errorBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca",
    borderRadius: 10, padding: 12, marginBottom: 16,
  },
  errorEmoji: { fontSize: 16, lineHeight: 20, flexShrink: 0 },
  errorTxt:   { flex: 1, color: "#dc2626", fontSize: 12, lineHeight: 18 },

  // Google
  googleBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12,
    paddingVertical: 13, paddingHorizontal: 16,
    borderWidth: 2, borderColor: "#e5e7eb",
    borderRadius: 14, backgroundColor: "#fff",
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    marginBottom: 20,
  },
  googleTxt: { color: "#374151", fontWeight: "700", fontSize: 14 },

  // Divider
  divRow:  { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 },
  divLine: { flex: 1, height: 1, backgroundColor: "#e5e7eb" },
  divTxt:  { color: "#9ca3af", fontSize: 11, fontWeight: "500" },

  // Name row
  nameRow:   { flexDirection: "row", gap: 10 },
  fieldHalf: { flex: 1 },

  // Fields
  fieldWrap:  { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: "#374151", marginBottom: 5 },
  inputBox: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#f9fafb", borderWidth: 1.5, borderColor: "#d1d5db",
    borderRadius: 10, paddingHorizontal: 12,
  },
  inputBoxFocused: { borderColor: "#14B8A6", backgroundColor: "#f0fdfa" },
  input: { flex: 1, color: "#111827", paddingVertical: 11, fontSize: 14 },

  // Terms
  tosRow:      { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 4 },
  checkbox: {
    width: 20, height: 20, borderRadius: 5,
    borderWidth: 2, borderColor: "#d1d5db",
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#fff", flexShrink: 0, marginTop: 1,
  },
  checkboxOn:  { backgroundColor: "#14B8A6", borderColor: "#14B8A6" },
  tosTxt:      { flex: 1, fontSize: 12, color: "#6b7280", lineHeight: 18 },
  tosLink:     { color: "#14B8A6", fontWeight: "700" },

  // Primary button
  primaryBtn: {
    borderRadius: 14, paddingVertical: 15,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#14B8A6", shadowOpacity: 0.35, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  primaryBtnTxt: { color: "#fff", fontWeight: "800", fontSize: 16 },

  // Switch
  switchRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 20 },
  switchTxt:  { color: "#6b7280", fontSize: 13 },
  switchLink: { color: "#0891B2", fontSize: 13, fontWeight: "700" },
});
