import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { F } from "../../styles/fonts";

const SECTIONS = [
  {
    num: "01",
    icon: "checkmark-circle-outline",
    color: "#d97706",
    bg: "#fef3c7",
    title: "Pranimi i Kushteve",
    content: [
      {
        type: "p",
        text: 'Duke përdorur platformën tonë gjuhagjermane.com, ju pranoni dhe pajtoheni me këto kushte përdorimi. Këto kushte përbëjnë një marrëveshje ligjore detyruese midis jush si përdorues dhe platformës. Nëse nuk jeni dakord me to, ju lutemi mos përdorni shërbimin.',
      },
    ],
  },
  {
    num: "02",
    icon: "shield-outline",
    color: "#2563eb",
    bg: "#dbeafe",
    title: "Përdorimi i Shërbimit dhe Pronësia Intelektuale",
    content: [
      { type: "bullet", text: "Përdoruesi merr akses në përmbajtje premium pas kryerjes së pagesës. Aksesi është i kufizuar dhe personal." },
      { type: "bullet", text: "Platforma është për përdorim personal dhe jo për rishitje, riprodhim, apo shpërndarje." },
      { type: "bullet", text: "Përdoruesi është përgjegjës për sigurinë e llogarisë dhe fjalëkalimit të tij." },
      { type: "bullet", text: "Të gjitha përmbajtjet, dizajni, logoja dhe softueri janë pronë ekskluzive e gjuhagjermane.com." },
    ],
  },
  {
    num: "03",
    icon: "lock-closed-outline",
    color: "#10b981",
    bg: "#d1fae5",
    title: "Politika e Privatësisë",
    content: [
      {
        type: "p",
        text: "Ne mbledhim vetëm informacionet e nevojshme për funksionimin e shërbimit dhe përmirësimin e eksperiencës tuaj. Këto të dhëna ruhen në mënyrë të sigurt dhe nuk ndahen me palë të treta pa pëlqimin tuaj.",
      },
      { type: "subtitle", text: "Përdorimi i Cookies" },
      {
        type: "p",
        text: 'Platforma jonë përdor "cookies" për të ruajtur seancat e përdoruesve dhe për të personalizuar përmbajtjen. Duke vazhduar përdorimin e shërbimit, ju pranoni përdorimin e cookies.',
      },
      { type: "highlight", icon: "lock-closed", color: "#065f46", bg: "#ecfdf5", text: "Të dhënat tuaja janë të enkriptuara dhe mbrohen me standarde të larta sigurie (SSL/TLS)." },
    ],
  },
  {
    num: "04",
    icon: "card-outline",
    color: "#7c3aed",
    bg: "#ede9fe",
    title: "Pagesat dhe Rimbursimet",
    content: [
      {
        type: "p",
        text: "Të gjitha pagesat përpunohen në mënyrë të sigurt nga Paddle.com Market Ltd. Asnjë informacion i kartës së kreditit nuk ruhet në serverat tanë.",
      },
      { type: "subtitle", text: "Politika e Rimbursimit" },
      {
        type: "p",
        text: "Ne ofrojmë një periudhë rimbursimi prej 30 ditësh nga data e blerjes. Për të kërkuar rimbursim kontaktoni: info@gjuhagjermane.com.",
      },
    ],
  },
  {
    num: "05",
    icon: "repeat-outline",
    color: "#f97316",
    bg: "#ffedd5",
    title: "Politika e Abonimit",
    content: [
      {
        type: "p",
        text: "Abonimet mund të anulohen në çdo kohë. Pas anulimit do të vazhdoni të keni akses deri në fund të periudhës së paguar.",
      },
      { type: "highlight", icon: "warning-outline", color: "#c2410c", bg: "#fff7ed", text: "Kontrolloni datën e rinovimit dhe anuloni abonimin nëse nuk dëshironi ta vazhdoni." },
    ],
  },
  {
    num: "06",
    icon: "information-circle-outline",
    color: "#ca8a04",
    bg: "#fef9c3",
    title: "Kufizimi i Përgjegjësisë",
    content: [
      {
        type: "p",
        text: 'Platforma ofrohet "siç është" pa asnjë garanci. gjuhagjermane.com nuk mban përgjegjësi për ndërprerjet e shërbimit apo gabimet teknike. Përgjegjësia maksimale është e kufizuar në shumën e paguar nga përdoruesi.',
      },
    ],
  },
  {
    num: "07",
    icon: "refresh-outline",
    color: "#ef4444",
    bg: "#fee2e2",
    title: "Ndryshimet në Kushte",
    content: [
      {
        type: "p",
        text: "Ne rezervojmë të drejtën për të ndryshuar këto kushte në çdo kohë. Ndryshimet hyjnë në fuqi menjëherë pas publikimit. Përdorimi i vazhdueshëm nënkupton pranimin e tyre.",
      },
    ],
  },
  {
    num: "08",
    icon: "mail-outline",
    color: "#0891b2",
    bg: "#cffafe",
    title: "Kontakt",
    content: [
      {
        type: "p",
        text: "Për çdo pyetje ose kërkesë, na kontaktoni drejtpërdrejt:",
      },
      { type: "info", icon: "globe-outline",     label: "Platforma",  value: "gjuhagjermane.com" },
      { type: "info", icon: "mail-outline",      label: "Email",      value: "info@gjuhagjermane.com" },
      { type: "info", icon: "logo-instagram",    label: "Instagram",  value: "@gjuhagjermanee" },
    ],
  },
];

function SectionBlock({ section }) {
  return (
    <View style={s.card}>
      {/* Card header */}
      <View style={s.cardHeader}>
        <View style={[s.cardIconBox, { backgroundColor: section.bg }]}>
          <Ionicons name={section.icon} size={20} color={section.color} />
        </View>
        <View style={s.cardTitleWrap}>
          <Text style={[s.cardNum, { color: section.color }]}>{section.num}</Text>
          <Text style={s.cardTitle}>{section.title}</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={s.cardDivider} />

      {/* Content */}
      {section.content.map((item, i) => {
        if (item.type === "p") {
          return <Text key={i} style={s.paragraph}>{item.text}</Text>;
        }
        if (item.type === "bullet") {
          return (
            <View key={i} style={s.bulletRow}>
              <View style={[s.bulletDot, { backgroundColor: section.color }]} />
              <Text style={s.bulletText}>{item.text}</Text>
            </View>
          );
        }
        if (item.type === "subtitle") {
          return (
            <Text key={i} style={[s.subtitle, { color: section.color }]}>{item.text}</Text>
          );
        }
        if (item.type === "highlight") {
          return (
            <View key={i} style={[s.highlight, { backgroundColor: item.bg, borderColor: item.color + "33" }]}>
              <Ionicons name={item.icon} size={14} color={item.color} style={{ marginTop: 1 }} />
              <Text style={[s.highlightText, { color: item.color }]}>{item.text}</Text>
            </View>
          );
        }
        if (item.type === "info") {
          return (
            <View key={i} style={s.infoRow}>
              <View style={[s.infoIconBox, { backgroundColor: section.bg }]}>
                <Ionicons name={item.icon} size={13} color={section.color} />
              </View>
              <Text style={s.infoLabel}>{item.label}</Text>
              <Text style={s.infoValue}>{item.value}</Text>
            </View>
          );
        }
        return null;
      })}
    </View>
  );
}

export default function PrivacyPolicyScreen({ navigation }) {
  return (
    <SafeAreaView edges={["top"]} style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <Ionicons name="chevron-back" size={20} color="#0f172a" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Politika e Privatësisë</Text>
          <Text style={s.headerSub}>Kushtet · Rimbursimi · Privatësia</Text>
        </View>
        <View style={[s.backBtn, { opacity: 0 }]} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
      >
        {/* Intro banner */}
        <View style={s.introBanner}>
          <View style={s.introIconBox}>
            <Ionicons name="document-text" size={22} color="#7c3aed" />
          </View>
          <Text style={s.introText}>
            Lexoni me kujdes kushtet dhe politikat e platformës tonë përpara se ta përdorni.
          </Text>
        </View>

        {SECTIONS.map((section) => (
          <SectionBlock key={section.num} section={section} />
        ))}

        {/* Footer */}
        <View style={s.footer}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#10b981" />
          <Text style={s.footerText}>
            Duke përdorur këtë platformë, ju pranoni të gjitha kushtet dhe politikat e mësipërme.
          </Text>
          <Text style={s.footerDate}>Përditësuar: 26 Janar 2026</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8f5f0" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: "#fffdf8",
    borderBottomWidth: 1,
    borderBottomColor: "#ede9e0",
    gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "#f1ede4",
    borderWidth: 1, borderColor: "#ede9e0",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { color: "#0f172a", fontSize: 17, fontFamily: F.black },
  headerSub:   { color: "#a8a29e", fontSize: 11, fontFamily: F.semi, marginTop: 1 },

  content: { paddingTop: 6, paddingHorizontal: 16, paddingBottom: 48, gap: 10 },

  introBanner: {
    backgroundColor: "#ede9fe",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1,
    borderColor: "#ddd6fe",
  },
  introIconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "#f5f3ff",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  introText: {
    flex: 1,
    color: "#5b21b6",
    fontSize: 13,
    fontFamily: F.semi,
    lineHeight: 20,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ede9e0",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  cardIconBox: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  cardTitleWrap: { flex: 1 },
  cardNum:   { fontSize: 10, fontFamily: F.black, letterSpacing: 1, marginBottom: 1 },
  cardTitle: { color: "#0f172a", fontSize: 15, fontFamily: F.black },
  cardDivider: { height: 1, backgroundColor: "#f1ede4", marginBottom: 12 },

  paragraph: {
    color: "#475569",
    fontSize: 13,
    fontFamily: F.regular,
    lineHeight: 21,
    marginBottom: 8,
  },

  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7, flexShrink: 0 },
  bulletText: { flex: 1, color: "#475569", fontSize: 13, fontFamily: F.regular, lineHeight: 21 },

  subtitle: {
    fontSize: 13,
    fontFamily: F.bold,
    marginTop: 4,
    marginBottom: 6,
  },

  highlight: {
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderWidth: 1,
  },
  highlightText: { flex: 1, fontSize: 12, fontFamily: F.semi, lineHeight: 18 },

  infoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  infoIconBox: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  infoLabel:   { color: "#64748b", fontSize: 12, fontFamily: F.bold, width: 72 },
  infoValue:   { color: "#0f172a", fontSize: 13, fontFamily: F.semi, flex: 1 },

  footer: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#ede9e0",
  },
  footerText: {
    color: "#64748b",
    fontSize: 12,
    fontFamily: F.semi,
    lineHeight: 18,
    textAlign: "center",
  },
  footerDate: { color: "#a8a29e", fontSize: 11, fontFamily: F.bold },
});
