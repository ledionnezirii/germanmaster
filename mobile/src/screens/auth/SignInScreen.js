import { useEffect, useState, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, StyleSheet, Image, Animated,
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

export default function SignInScreen({ navigation }) {
  const { login, googleLogin } = useAuth();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [focused, setFocused]   = useState(null);
  const [error, setError]       = useState("");

  const cardFade  = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardFade,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(cardSlide, { toValue: 0, duration: 440, useNativeDriver: true }),
    ]).start();
  }, []);

  const redirectUri = makeRedirectUri({ useProxy: true });
  const [request, response, promptAsync] = useAuthRequest(
    { clientId: GOOGLE_CLIENT_ID, scopes: ["openid", "profile", "email"], usePKCE: true, redirectUri },
    GOOGLE_DISCOVERY
  );

  useEffect(() => {
    if (response?.type === "success") {
      const token = response.authentication?.accessToken;
      if (token) handleGoogleLogin(token);
    }
  }, [response]);

  async function handleGoogleLogin(accessToken) {
    setGLoading(true);
    setError("");
    try {
      await googleLogin(accessToken);
    } catch (err) {
      setError(err.response?.data?.message || "Hyrja me Google dështoi. Provoni përsëri.");
    } finally {
      setGLoading(false);
    }
  }

  async function handleLogin() {
    setError("");
    if (!email.trim() || !password) {
      setError("Ju lutem shkruani email-in dhe fjalëkalimin.");
      return;
    }
    setLoading(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || "";
      if (msg.toLowerCase().includes("device") || err.response?.status === 403) {
        setError("Jeni të kyçur në 2 pajisje. Ju lutemi dilni nga një pajisje për të vazhduar.");
      } else if (msg.toLowerCase().includes("google")) {
        setError("Ky llogari përdor Google Sign-In. Ju lutemi hyni me Google.");
      } else {
        setError("Email ose fjalëkalimi i pasaktë. Ju lutemi provoni përsëri.");
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
              <Text style={s.title}>Hyr në llogari</Text>
              <Text style={s.subtitle}>Mirë se erdhe përsëri!</Text>
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
                {gLoading ? "Duke u kyçur..." : "Vazhdo me Google"}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={s.divRow}>
              <View style={s.divLine} />
              <Text style={s.divTxt}>ose vazhdo me email</Text>
              <View style={s.divLine} />
            </View>

            {/* Email */}
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>Adresa e email-it</Text>
              <View style={[s.inputBox, focused === "email" && s.inputBoxFocused]}>
                <Ionicons
                  name="at-outline"
                  size={17}
                  color={focused === "email" ? "#14B8A6" : "#9ca3af"}
                  style={s.inputIcon}
                />
                <TextInput
                  style={s.input}
                  placeholder="Shkruani email-in tuaj"
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={(v) => { setEmail(v); setError(""); }}
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
              <View style={[s.inputBox, focused === "pass" && s.inputBoxFocused]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={17}
                  color={focused === "pass" ? "#14B8A6" : "#9ca3af"}
                  style={s.inputIcon}
                />
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  placeholder="Shkruani fjalëkalimin tuaj"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={(v) => { setPassword(v); setError(""); }}
                  secureTextEntry={!showPass}
                  onFocus={() => setFocused("pass")}
                  onBlur={() => setFocused(null)}
                />
                <TouchableOpacity onPress={() => setShowPass(p => !p)} style={{ padding: 4 }}>
                  <Ionicons
                    name={showPass ? "eye-off-outline" : "eye-outline"}
                    size={17}
                    color="#9ca3af"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot password */}
            <TouchableOpacity
              onPress={() => navigation.navigate("ForgotPassword")}
              style={s.forgotRow}
            >
              <Text style={s.forgotTxt}>Keni harruar fjalëkalimin?</Text>
            </TouchableOpacity>

            {/* Submit */}
            <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
              <LinearGradient
                colors={loading ? ["#9ca3af", "#9ca3af"] : ["#14B8A6", "#06B6D4"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.primaryBtn}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.primaryBtnTxt}>Hyni</Text>
                }
              </LinearGradient>
            </TouchableOpacity>

            {/* Switch */}
            <View style={s.switchRow}>
              <Text style={s.switchTxt}>Nuk keni llogari? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("SignUp")} activeOpacity={0.75}>
                <Text style={s.switchLink}>Regjistrohuni këtu</Text>
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
    padding: 32,
    shadowColor: "#000",
    shadowOpacity: 0.13,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
  },

  // Header
  header:   { alignItems: "center", marginBottom: 24 },
  logo:     { width: 64, height: 64, borderRadius: 32, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 10, elevation: 4 },
  title:    { fontSize: 22, fontWeight: "800", color: "#1f2937", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#6b7280" },

  // Error
  errorBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca",
    borderRadius: 10, padding: 12, marginBottom: 16,
  },
  errorEmoji: { fontSize: 16, lineHeight: 20 },
  errorTxt:   { flex: 1, color: "#b91c1c", fontSize: 13, lineHeight: 18 },

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
  divRow:  { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 },
  divLine: { flex: 1, height: 1, backgroundColor: "#e5e7eb" },
  divTxt:  { color: "#9ca3af", fontSize: 12, fontWeight: "500" },

  // Fields
  fieldWrap:  { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  inputBox: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#f9fafb", borderWidth: 1.5, borderColor: "#d1d5db",
    borderRadius: 10, paddingHorizontal: 12,
  },
  inputBoxFocused: { borderColor: "#14B8A6", backgroundColor: "#f0fdfa" },
  inputIcon: { marginRight: 8 },
  input:     { flex: 1, color: "#111827", paddingVertical: 13, fontSize: 14 },

  // Forgot
  forgotRow: { alignSelf: "flex-end", marginBottom: 20, marginTop: 2 },
  forgotTxt: { color: "#0891B2", fontSize: 13, fontWeight: "600" },

  // Primary button
  primaryBtn: {
    borderRadius: 14, paddingVertical: 15,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#14B8A6", shadowOpacity: 0.35, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  primaryBtnTxt: { color: "#fff", fontWeight: "800", fontSize: 16 },

  // Switch
  switchRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 24 },
  switchTxt:  { color: "#6b7280", fontSize: 14 },
  switchLink: { color: "#0891B2", fontSize: 14, fontWeight: "700" },
});
