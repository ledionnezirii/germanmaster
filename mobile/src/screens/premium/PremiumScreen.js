import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import { useAuth } from "../../context/AuthContext";
import { paymentService } from "../../services/api";
import { F } from "../../styles/fonts";

// ─── RevenueCat API keys ───────────────────────────────────────────────────────
// Replace with your actual RevenueCat project keys from app.revenuecat.com
const RC_IOS_KEY     = "appl_YOUR_IOS_KEY_HERE";
const RC_ANDROID_KEY = "goog_YOUR_ANDROID_KEY_HERE";

// ─── Fallback UI plans (used when offerings can't be fetched) ─────────────────
const FALLBACK_PLANS = [
  { id: "gjuha_monthly",   name: "Mujor",   price: "€9.99",  period: "/ muaj",   popular: true,  savings: null,     identifier: "gjuha_monthly"   },
  { id: "gjuha_quarterly", name: "3-Mujor", price: "€19.99", period: "/ 3 muaj", popular: false, savings: "Kurse 16%", identifier: "gjuha_quarterly" },
  { id: "gjuha_yearly",    name: "Vjetor",  price: "€69.99", period: "/ vit",    popular: false, savings: "Kurse 31%", identifier: "gjuha_yearly"   },
];

const BENEFITS = [
  { icon: "infinite",          label: "Të gjitha nivelet A1 → C2" },
  { icon: "book",              label: "Fjalor i plotë i zhbllokuar" },
  { icon: "shuffle",           label: "Kuize të pafundme" },
  { icon: "headset",           label: "Audio shqiptim për çdo fjalë" },
  { icon: "flame",             label: "Sfida ditore ekskluzive" },
  { icon: "ban",               label: "Pa reklama" },
];

// ─── Initialize RevenueCat once ───────────────────────────────────────────────
let rcInitialized = false;

async function initRC(userId) {
  if (rcInitialized) return;
  try {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    const apiKey = Platform.OS === "ios" ? RC_IOS_KEY : RC_ANDROID_KEY;
    await Purchases.configure({ apiKey, appUserID: userId });
    rcInitialized = true;
  } catch (e) {
    console.warn("[RC] init error:", e.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
export default function PremiumScreen({ navigation }) {
  const { user, refreshUser } = useAuth();
  const isPaid = user?.isPaid;

  const [offerings,  setOfferings]  = useState(null);
  const [purchasing, setPurchasing] = useState(null);
  const [restoring,  setRestoring]  = useState(false);

  // ── Initialize RevenueCat + fetch offerings in background ────────────────────
  // Plans show immediately from FALLBACK_PLANS; real prices replace them if RC loads
  useEffect(() => {
    if (!user?._id) return;
    let cancelled = false;

    (async () => {
      try {
        await Promise.race([
          initRC(user._id),
          new Promise((_, rej) => setTimeout(() => rej(new Error("RC init timeout")), 5000)),
        ]);
        const result = await Promise.race([
          Purchases.getOfferings(),
          new Promise((_, rej) => setTimeout(() => rej(new Error("RC offerings timeout")), 5000)),
        ]);
        if (!cancelled && result.current?.availablePackages?.length > 0) {
          setOfferings(result.current);
        }
      } catch (e) {
        console.warn("[RC] load error:", e.message);
      }
    })();

    return () => { cancelled = true; };
  }, [user?._id]);

  // ── Build plan list from RC offerings or fallback ─────────────────────────
  const plans = offerings?.availablePackages?.map((pkg) => {
    const product = pkg.product;
    return {
      id:         pkg.identifier,
      rcPackage:  pkg,
      name:       product.title?.replace(/\s*\(.*\)/, "") || pkg.identifier,
      price:      product.priceString,
      period:     getPeriodLabel(pkg.packageType),
      popular:    pkg.packageType === "MONTHLY",
      savings:    getSavings(pkg.packageType),
    };
  }) ?? FALLBACK_PLANS;

  // ── Purchase ──────────────────────────────────────────────────────────────
  async function handleBuy(plan) {
    if (!plan.rcPackage) {
      Alert.alert("Gabim", "Ky produkt nuk është i disponueshëm tani. Provoni sërish.");
      return;
    }
    setPurchasing(plan.id);
    try {
      const { customerInfo } = await Purchases.purchasePackage(plan.rcPackage);
      const activeEntitlement = customerInfo.entitlements.active["premium"]
        ?? customerInfo.entitlements.active[Object.keys(customerInfo.entitlements.active)[0]];

      const expirationAtMs = activeEntitlement?.expirationDate
        ? new Date(activeEntitlement.expirationDate).getTime()
        : null;

      // Notify our server (fallback grant in case webhook is delayed)
      await paymentService.manualGrant(
        user._id,
        plan.rcPackage?.product?.identifier ?? plan.id,
        expirationAtMs,
      ).catch(() => {});

      await refreshUser?.();

      Alert.alert(
        "Faleminderit!",
        "Abonimenti juaj Premium u aktivizua me sukses.",
        [{ text: "Vazhdoni", onPress: () => navigation?.goBack?.() }]
      );
    } catch (e) {
      if (!e.userCancelled) {
        Alert.alert("Gabim", e.message || "Blerja dështoi. Ju lutem provoni sërish.");
      }
    } finally {
      setPurchasing(null);
    }
  }

  // ── Restore purchases ─────────────────────────────────────────────────────
  async function handleRestore() {
    setRestoring(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      const hasActive = Object.keys(customerInfo.entitlements.active).length > 0;
      if (hasActive) {
        await refreshUser?.();
        Alert.alert("Sukses", "Blerjet tuaja u rivendosën me sukses.");
      } else {
        Alert.alert("Asnjë blerje aktive", "Nuk gjetëm blerje aktive me llogarinë tuaj.");
      }
    } catch (e) {
      Alert.alert("Gabim", e.message || "Rivendosja dështoi.");
    } finally {
      setRestoring(false);
    }
  }

  return (
    <SafeAreaView edges={["top"]} style={s.root}>
      {/* ── Header ── */}
      <LinearGradient
        colors={["#1c0a00", "#431407", "#9a3412"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={s.header}
      >
        <View style={s.glow1} />
        <View style={s.glow2} />

        {navigation?.canGoBack?.() && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={18} color="#fed7aa" />
          </TouchableOpacity>
        )}

        <View style={s.headerBody}>
          <View style={s.headerIconWrap}>
            <Ionicons name="diamond" size={22} color="#fbbf24" />
          </View>
          <Text style={s.headerTitle}>Premium</Text>
          <Text style={s.headerSub}>Zhbllo gjithçka — mëso pa kufij</Text>
        </View>
      </LinearGradient>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── Active banner ── */}
        {isPaid && (
          <View style={s.activeBanner}>
            <View style={s.activeBannerIcon}>
              <Ionicons name="checkmark-circle" size={22} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.activeBannerTitle}>Abonimenti Aktiv — Akses i Plotë</Text>
              <Text style={s.activeBannerSub}>Gëzoni të gjitha përfitimet Premium.</Text>
            </View>
          </View>
        )}

        {/* ── Plans ── */}
        {!isPaid && (
          <>
            <View style={s.plansHeading}>
              <Text style={s.plansTitle}>Zgjidhni Planin Tuaj</Text>
              <Text style={s.plansSub}>Pagesë e sigurt me App Store / Google Play</Text>
            </View>

            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                loading={purchasing === plan.id}
                disabled={!!purchasing || restoring}
                onPress={() => handleBuy(plan)}
              />
            ))}
          </>
        )}

        {/* ── Benefits ── */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <Ionicons name="star" size={15} color="#d97706" />
            <Text style={s.cardTitle}>Çfarë Përfshihet</Text>
          </View>
          <View style={s.benefitsGrid}>
            {BENEFITS.map((b, i) => (
              <View key={i} style={s.benefitRow}>
                <View style={s.benefitIcon}>
                  <Ionicons name={b.icon} size={14} color="#d97706" />
                </View>
                <Text style={s.benefitText}>{b.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Restore purchases ── */}
        {!isPaid && (
          <TouchableOpacity style={s.restoreBtn} onPress={handleRestore} disabled={restoring || !!purchasing} activeOpacity={0.75}>
            {restoring
              ? <ActivityIndicator size="small" color="#6366f1" />
              : <>
                  <Ionicons name="refresh-circle-outline" size={16} color="#6366f1" />
                  <Text style={s.restoreTxt}>Rivendos Blerjet</Text>
                </>
            }
          </TouchableOpacity>
        )}

        {/* ── Security note ── */}
        <View style={s.securityRow}>
          <Ionicons name="shield-checkmark" size={14} color="#059669" />
          <Text style={s.securityText}>
            Pagesë e sigurt me {Platform.OS === "ios" ? "App Store" : "Google Play"}.{" "}
            <Text style={{ fontFamily: F.bold, color: "#1e293b" }}>
              Qasja aktivizohet menjëherë pas pagesës.
            </Text>
          </Text>
        </View>

        <Text style={s.legalText}>
          Abonimenti rifreskohet automatikisht. Mund të anuloni në çdo kohë nga cilësimet e {Platform.OS === "ios" ? "App Store" : "Google Play"}.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getPeriodLabel(packageType) {
  switch (packageType) {
    case "MONTHLY":  return "/ muaj";
    case "THREE_MONTH": return "/ 3 muaj";
    case "ANNUAL":   return "/ vit";
    case "WEEKLY":   return "/ javë";
    case "DAILY":    return "/ ditë";
    default:         return "";
  }
}

function getSavings(packageType) {
  switch (packageType) {
    case "THREE_MONTH": return "Kurse 16%";
    case "ANNUAL":      return "Kurse 31%";
    default:            return null;
  }
}

// ─── Plan Card ────────────────────────────────────────────────────────────────
function PlanCard({ plan, loading, disabled, onPress }) {
  return (
    <TouchableOpacity
      style={[s.planCard, plan.popular && s.planCardPopular]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.88}
    >
      {plan.popular && (
        <LinearGradient colors={["#f59e0b", "#ea580c"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.popularBanner}>
          <Text style={s.popularBannerText}>MË I POPULLARIZUARI</Text>
        </LinearGradient>
      )}

      {plan.savings && !plan.popular && (
        <View style={s.savingsBadge}>
          <Text style={s.savingsBadgeText}>{plan.savings}</Text>
        </View>
      )}

      <View style={[s.planBody, plan.popular && { paddingTop: 16 }]}>
        <View style={s.planTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.planName}>{plan.name}</Text>
            <Text style={s.planPeriod}>{plan.period}</Text>
          </View>
          <Text style={[s.planPrice, plan.popular && { color: "#ea580c" }]}>{plan.price}</Text>
        </View>

        <View style={[s.buyBtn, plan.popular ? s.buyBtnPopular : s.buyBtnSecondary]}>
          {loading ? (
            <ActivityIndicator color={plan.popular ? "#fff" : "#15803d"} size="small" />
          ) : (
            <>
              <Text style={[s.buyBtnText, !plan.popular && { color: "#15803d" }]}>
                {plan.popular ? "Bli Tani" : "Zgjedh"}
              </Text>
              <Ionicons name="arrow-forward" size={14} color={plan.popular ? "#fff" : "#15803d"} />
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: "#f8f7f4" },
  scroll:  { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },

  // Header
  header: {
    paddingHorizontal: 18, paddingBottom: 26, paddingTop: 10,
    position: "relative", overflow: "hidden",
  },
  glow1: {
    position: "absolute", top: -60, right: -40,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: "rgba(249,115,22,0.25)",
  },
  glow2: {
    position: "absolute", bottom: -60, left: -40,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: "rgba(245,158,11,0.2)",
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center", marginBottom: 14,
  },
  headerBody:     { alignItems: "flex-start" },
  headerIconWrap: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
  },
  headerTitle: { color: "#fff", fontSize: 24, fontFamily: F.black, marginBottom: 4 },
  headerSub:   { color: "rgba(255,255,255,0.65)", fontSize: 13, fontFamily: F.regular },

  // Active banner
  activeBanner: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#ecfdf5", borderRadius: 18,
    padding: 16, marginBottom: 18,
    borderWidth: 1.5, borderColor: "#6ee7b7",
  },
  activeBannerIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "#d1fae5", alignItems: "center", justifyContent: "center",
  },
  activeBannerTitle: { color: "#065f46", fontSize: 14, fontFamily: F.xbold, marginBottom: 2 },
  activeBannerSub:   { color: "#059669", fontSize: 12, fontFamily: F.regular },

  // Plans heading
  plansHeading: { alignItems: "center", marginBottom: 18, marginTop: 4 },
  plansTitle:   { color: "#1c1917", fontSize: 22, fontFamily: F.black, marginBottom: 4, letterSpacing: -0.3 },
  plansSub:     { color: "#78716c", fontSize: 13, fontFamily: F.regular },

  // Plan card
  planCard: {
    backgroundColor: "#fff", borderRadius: 22, marginBottom: 12,
    borderWidth: 1.5, borderColor: "#e5e0d8", overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  planCardPopular: {
    borderColor: "#f97316", borderWidth: 2,
    shadowColor: "#f97316", shadowOpacity: 0.18, shadowRadius: 14, elevation: 5,
  },
  popularBanner: { paddingVertical: 8, alignItems: "center" },
  popularBannerText: { color: "#fff", fontSize: 10, fontFamily: F.black, letterSpacing: 1.5 },
  savingsBadge: {
    position: "absolute", top: 14, right: 14,
    backgroundColor: "#d1fae5", borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: "#6ee7b7", zIndex: 1,
  },
  savingsBadgeText: { color: "#065f46", fontSize: 10, fontFamily: F.xbold },

  planBody:    { padding: 18 },
  planTopRow:  { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  planName:    { color: "#1c1917", fontSize: 17, fontFamily: F.xbold, marginBottom: 2 },
  planPeriod:  { color: "#78716c", fontSize: 12, fontFamily: F.semi },
  planPrice:   { fontSize: 28, fontFamily: F.black, color: "#059669", letterSpacing: -0.5 },

  buyBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, borderRadius: 14, paddingVertical: 13,
  },
  buyBtnPopular:   { backgroundColor: "#f97316" },
  buyBtnSecondary: { backgroundColor: "#dcfce7", borderWidth: 2, borderColor: "#16a34a" },
  buyBtnText:      { color: "#fff", fontSize: 14, fontFamily: F.xbold },

  // Benefits card
  card: {
    backgroundColor: "#fff", borderRadius: 20,
    padding: 18, marginBottom: 12,
    borderWidth: 1.5, borderColor: "#e5e0d8",
    shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  cardTitle:    { color: "#1c1917", fontSize: 14, fontFamily: F.xbold },
  benefitsGrid: { gap: 11 },
  benefitRow:   { flexDirection: "row", alignItems: "center", gap: 10 },
  benefitIcon:  {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: "#fef3c7", alignItems: "center", justifyContent: "center",
  },
  benefitText: { color: "#44403c", fontSize: 13, fontFamily: F.semi, flex: 1 },

  // Restore
  restoreBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 7, paddingVertical: 13, marginBottom: 12,
    backgroundColor: "#eef2ff", borderRadius: 14,
    borderWidth: 1, borderColor: "#c7d2fe",
  },
  restoreTxt: { color: "#4f46e5", fontSize: 13, fontFamily: F.bold },

  // Security
  securityRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    justifyContent: "center", marginBottom: 10,
  },
  securityText: { color: "#78716c", fontSize: 11, fontFamily: F.regular, flex: 1, lineHeight: 16 },
  legalText:    { color: "#a8a29e", fontSize: 10, fontFamily: F.regular, textAlign: "center", lineHeight: 15 },
});
