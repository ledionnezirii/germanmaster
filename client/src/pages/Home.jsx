"use client"

import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useLanguage } from "../context/LanguageContext"
import { useState, useEffect } from "react"
import SEO from "../components/SEO"
import {
  BookOpen,
  Headphones,
  Languages,
  Star,
  Play,
  Heart,
  Flame,
  TrendingUp,
  Award,
  Trophy,
  PenBox,
  LockIcon,
  BrainCircuit,
  GraduationCap,
} from "lucide-react"

const LANG_CONTENT = {
  de: {
    heroTitle: "Mësoni Gjermanisht",
    heroSubtitle: "Zotëroni gjermanishten përmes mësimeve interaktive, ushtrimeve të dëgjimit dhe praktikës së personalizuar. Filloni udhëtimin tuaj drejt rrjedhshmërisë sot.",
    seoTitle: "Gjuha Gjermane - Mësoni Gjuhën Gjermane Online | Kursa Interaktive",
    seoDesc: "Mësoni gjuhën gjermane online me kursa interaktive, ushtrime, teste dhe më shumë.",
    flagImg: "https://flagcdn.com/w80/de.png",
    gradient: "linear-gradient(135deg, #1e2a5e 0%, #2a3f8f 40%, #1a5aab 75%, #ff3860 100%)",
    floatingWords: ["Hallo", "Danke", "Wasser", "Buch", "Freund", "Schule", "Liebe", "Haus", "Arbeit", "Zeit", "Sprache", "Lernen"],
  },
  en: {
    heroTitle: "Mësoni Anglisht",
    heroSubtitle: "Zotëroni anglishten përmes mësimeve interaktive, ushtrimeve të dëgjimit dhe praktikës së personalizuar. Filloni udhëtimin tuaj drejt rrjedhshmërisë sot.",
    seoTitle: "Gjuha Angleze - Mësoni Gjuhën Angleze Online | Kursa Interaktive",
    seoDesc: "Mësoni gjuhën angleze online me kursa interaktive, ushtrime, teste dhe më shumë.",
    flagImg: "https://flagcdn.com/w80/gb.png",
    gradient: "linear-gradient(135deg, #0a2fa0 0%, #1a4abf 50%, #e81530 100%)",
    floatingWords: ["Hello", "Thanks", "Water", "Book", "Friend", "School", "Love", "House", "Work", "Time", "Language", "Learn"],
  },
  fr: {
    heroTitle: "Mësoni Frëngjisht",
    heroSubtitle: "Zotëroni frëngjishten përmes mësimeve interaktive, ushtrimeve të dëgjimit dhe praktikës së personalizuar. Filloni udhëtimin tuaj drejt rrjedhshmërisë sot.",
    seoTitle: "Gjuha Frënge - Mësoni Gjuhën Frënge Online | Kursa Interaktive",
    seoDesc: "Mësoni gjuhën frënge online me kursa interaktive, ushtrime, teste dhe më shumë.",
    flagImg: "https://flagcdn.com/w80/fr.png",
    gradient: "linear-gradient(135deg, #0a2fd4 0%, #2a55e0 50%, #f02535 100%)",
    floatingWords: ["Bonjour", "Merci", "Eau", "Livre", "Ami", "École", "Amour", "Maison", "Travail", "Temps", "Langue", "Apprendre"],
  },
  tr: {
    heroTitle: "Mësoni Turqisht",
    heroSubtitle: "Zotëroni turqishten përmes mësimeve interaktive, ushtrimeve të dëgjimit dhe praktikës së personalizuar. Filloni udhëtimin tuaj drejt rrjedhshmërisë sot.",
    seoTitle: "Gjuha Turke - Mësoni Gjuhën Turke Online | Kursa Interaktive",
    seoDesc: "Mësoni gjuhën turke online me kursa interaktive, ushtrime, teste dhe më shumë.",
    flagImg: "https://flagcdn.com/w80/tr.png",
    gradient: "linear-gradient(135deg, #d40010 0%, #ff1020 60%, #b00008 100%)",
    floatingWords: ["Merhaba", "Teşekkür", "Su", "Kitap", "Arkadaş", "Okul", "Aşk", "Ev", "İş", "Zaman", "Dil", "Öğren"],
  },
  it: {
    heroTitle: "Mësoni Italisht",
    heroSubtitle: "Zotëroni italishten përmes mësimeve interaktive, ushtrimeve të dëgjimit dhe praktikës së personalizuar. Filloni udhëtimin tuaj drejt rrjedhshmërisë sot.",
    seoTitle: "Gjuha Italiane - Mësoni Gjuhën Italiane Online | Kursa Interaktive",
    seoDesc: "Mësoni gjuhën italiane online me kursa interaktive, ushtrime, teste dhe më shumë.",
    flagImg: "https://flagcdn.com/w80/it.png",
    gradient: "linear-gradient(135deg, #00a84f 0%, #20c060 50%, #e83040 100%)",
    floatingWords: ["Ciao", "Grazie", "Acqua", "Libro", "Amico", "Scuola", "Amore", "Casa", "Lavoro", "Tempo", "Lingua", "Imparare"],
  },
}

const Home = () => {
  const { isAuthenticated, user, loading, updateUser } = useAuth()
  const { language } = useLanguage()

  const content = LANG_CONTENT[language] || LANG_CONTENT.de

  // Profile is already fetched by AuthContext on init — no extra call needed here

  const features = [
    { icon: Headphones,   title: "Praktikë Dëgjimi", path: "/listen",      bgImage: "/images/listenCarousel.png" },
    { icon: PenBox,       title: "Fraza",             path: "/phrases",     bgImage: "/images/phrasesCarousel.png" },
    { icon: LockIcon,     title: "Teste te nivelit",  path: "/dictionary",  bgImage: "/images/testsCarousel.png" },
    { icon: BrainCircuit, title: "Kuize",             path: "/quizes",      bgImage: "/images/quizesCarousel.png" },
    { icon: GraduationCap, title: "Testet e Nivelit",  path: "/tests",       bgImage: "/images/testsCarousel.png" },
    { icon: BookOpen,     title: "Fjalor",            path: "/dictionary",  bgImage: "/images/dictionaryCarousel.png" },
    { icon: Trophy,       title: "Renditja",          path: "/leaderboard", bgImage: "/images/leaderboardCarousel.png" },
  ]

  const quickStats = [
    {
      icon: Star,
      label: "Pikë XP",
      value: user?.xp || 0,
      bgColor: "bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A]",
      textColor: "text-[#D97706]",
      iconColor: "text-[#F59E0B]",
    },
    {
      icon: Flame,
      label: "Ditë Rresht",
      value: user?.streakCount || 0,
      bgColor: "bg-gradient-to-br from-[#FED7AA] to-[#FDBA74]",
      textColor: "text-[#EA580C]",
      iconColor: "text-[#F97316]",
    },
    {
      icon: Award,
      label: "Niveli",
      value: (user?.languageProgress || []).find(p => p.language === language)?.level || (language === "de" ? user?.level : null) || "-",
      bgColor: "bg-gradient-to-br from-[#DDD6FE] to-[#C4B5FD]",
      textColor: "text-[#7C3AED]",
      iconColor: "text-[#8B5CF6]",
    },
    {
      icon: Heart,
      label: "Fjalë të Mësuara",
      value: user?.dictionaryUnlockedCounts?.[language] || 0,
      bgColor: "bg-gradient-to-br from-[#FBCFE8] to-[#F9A8D4]",
      textColor: "text-[#DB2777]",
      iconColor: "text-[#EC4899]",
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    )
  }

  return (
    <>
      <SEO
        title={content.seoTitle}
        description={content.seoDesc}
        keywords="gjuha gjermane, mesimi gjermanishtes, kursa gjermane, gjermanisht online, learn german, deutsche sprache, A1 B1 C1"
        ogImage="/images/home-og.jpg"
        canonicalUrl="https://gjuhagjermane.com/"
      />
      <div className="min-h-screen bg-white">

        {/* ── HERO ── */}
        <div style={{ background: content.gradient, position: "relative", overflow: "hidden", borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
          {/* decorative circles */}
          <div style={{ position: "absolute", top: -60, right: -60, width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
          <div style={{ position: "absolute", bottom: -80, left: -40, width: 250, height: 250, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

          {/* floating language words */}
          {content.floatingWords.map((word, i) => (
            <div key={word} style={{
              position: "absolute",
              left: `${[6,20,70,83,4,58,28,88,43,13,63,48][i % 12]}%`,
              top: `${[12,58,18,52,78,8,68,32,47,88,22,72][i % 12]}%`,
              fontSize: [22,30,18,34,26,20,32,24,28,18,29,23][i % 12],
              fontWeight: 800,
              color: "rgba(255,220,50,0.55)",
              pointerEvents: "none",
              userSelect: "none",
              letterSpacing: 2,
              animation: `floatWord${i % 3} ${5 + (i % 4)}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
              whiteSpace: "nowrap",
              textShadow: "0 2px 12px rgba(255,180,0,0.4)",
            }}>
              {word}
            </div>
          ))}
          <style>{`
            @keyframes floatWord0 {
              0%   { transform: translateY(0px)   translateX(0px);  opacity: 0.25; }
              33%  { transform: translateY(-14px) translateX(6px);  opacity: 0.45; }
              66%  { transform: translateY(-6px)  translateX(-4px); opacity: 0.35; }
              100% { transform: translateY(0px)   translateX(0px);  opacity: 0.25; }
            }
            @keyframes floatWord1 {
              0%   { transform: translateY(0px)   translateX(0px);  opacity: 0.3; }
              40%  { transform: translateY(-18px) translateX(-7px); opacity: 0.5; }
              70%  { transform: translateY(-8px)  translateX(5px);  opacity: 0.38; }
              100% { transform: translateY(0px)   translateX(0px);  opacity: 0.3; }
            }
            @keyframes floatWord2 {
              0%   { transform: translateY(0px)   translateX(0px);  opacity: 0.28; }
              50%  { transform: translateY(-12px) translateX(8px);  opacity: 0.48; }
              80%  { transform: translateY(-4px)  translateX(-6px); opacity: 0.32; }
              100% { transform: translateY(0px)   translateX(0px);  opacity: 0.28; }
            }
          `}</style>

          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 relative z-10" style={{ paddingTop: "clamp(28px, 6vw, 64px)", paddingBottom: "clamp(60px, 8vw, 100px)" }}>
            <div className="text-center">
              {/* Big flag */}
              <div style={{ marginBottom: "clamp(8px, 2vw, 16px)", display: "inline-block" }}>
                <img
                  src={content.flagImg}
                  alt={content.heroTitle}
                  style={{ width: "clamp(60px, 10vw, 100px)", height: "auto", borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
                />
              </div>

              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(24px, 6vw, 58px)", fontWeight: 400, color: "#fff", letterSpacing: -1, lineHeight: 1.1, marginBottom: "clamp(8px, 2vw, 16px)", textShadow: "0 2px 12px rgba(0,0,0,0.3)" }}>
                {content.heroTitle}
                <span style={{ display: "block", fontSize: "clamp(15px, 3.5vw, 34px)", fontWeight: 300, opacity: 0.85, marginTop: 4 }}>
                  Në Mënyrë Efektive
                </span>
              </h1>
              <p style={{ margin: "0 auto clamp(16px, 3vw, 32px)", maxWidth: 560, fontSize: "clamp(13px, 2vw, 16px)", color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>
                {content.heroSubtitle}
              </p>

              {isAuthenticated ? (
                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link to="/translate"
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 9999, background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.4)", color: "#fff", height: 38, padding: "0 22px", fontWeight: 600, fontSize: 13, backdropFilter: "blur(8px)", textDecoration: "none", transition: "all 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.3)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
                  >
                    <Play className="h-4 w-4" />
                    Vazhdo Mësimin
                  </Link>
                  <Link to="/account"
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 9999, background: "#fff", color: "#1f2937", height: 38, padding: "0 22px", fontWeight: 600, fontSize: 13, textDecoration: "none", transition: "all 0.2s", boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}
                  >
                    <TrendingUp className="h-4 w-4" />
                    Shiko Progresin
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link to="/signup"
                    style={{ display: "inline-flex", alignItems: "center", borderRadius: 9999, background: "#fff", color: "#1f2937", height: 38, padding: "0 22px", fontWeight: 600, fontSize: 13, textDecoration: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}
                  >
                    Fillo Falas
                  </Link>
                  <Link to="/signin"
                    style={{ display: "inline-flex", alignItems: "center", borderRadius: 9999, background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.4)", color: "#fff", height: 38, padding: "0 22px", fontWeight: 600, fontSize: 13, backdropFilter: "blur(8px)", textDecoration: "none" }}
                  >
                    Hyr
                  </Link>
                </div>
              )}
            </div>
          </div>
          {/* wavy bottom border */}
          <div style={{ position: "absolute", bottom: -1, left: 0, right: 0, lineHeight: 0, pointerEvents: "none" }}>
            <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ width: "100%", height: 60, display: "block" }}>
              <path d="M0,30 C240,60 480,0 720,30 C960,60 1200,0 1440,30 L1440,60 L0,60 Z" fill="#ffffff" />
            </svg>
          </div>
        </div>

        {/* ── QUICK STATS ── */}
        {isAuthenticated && user && (
          <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="rounded-2xl bg-white border-2 border-gray-200 p-6 shadow-xl shadow-gray-100/50">
              <div className="mb-6 flex items-center gap-3">
                <div className="text-4xl">👋</div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Mirë se vini përsëri, {user.firstName || user.emri || "//"}!
                  </h2>
                  <p className="text-sm text-gray-600 flex items-center gap-1.5">
                    <img src={content.flagImg} alt="" style={{ width: 22, height: "auto", borderRadius: 3, boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
                    Vazhdoni progresin tuaj të shkëlqyer
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {quickStats.map((stat, index) => {
                  const Icon = stat.icon
                  const isStreak = stat.label === "Ditë Rresht"
                  const isXP = stat.label === "Pikë XP"
                  const isLevel = stat.label === "Niveli"
                  const isHeart = stat.label === "Fjalë të Mësuara"

                  return (
                    <div key={index}
                      className={`rounded-xl ${stat.bgColor} p-6 text-center transition-transform hover:scale-105 cursor-pointer shadow-lg hover:shadow-xl`}>
                      <div className="mb-3 flex justify-center">
                        {isStreak && (
                          <div className="relative">
                            <div className="absolute inset-0 animate-[fireGlow_1.5s_ease-in-out_infinite]">
                              <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                            </div>
                            <Icon className={`h-6 w-6 ${stat.iconColor} relative animate-[fireFlicker_0.8s_ease-in-out_infinite]`} />
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#FBBF24] rounded-full animate-[spark_1.2s_ease-in-out_infinite] shadow-lg shadow-yellow-400/50" />
                            <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-[#EF4444] rounded-full animate-[spark_1.5s_ease-in-out_infinite] shadow-lg shadow-red-500/50" style={{ animationDelay: "0.3s" }} />
                          </div>
                        )}
                        {isXP && (
                          <div className="relative animate-[starShine_2s_ease-in-out_infinite]">
                            <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                            <div className="absolute inset-0 animate-[starPulse_2s_ease-in-out_infinite]">
                              <Icon className={`h-6 w-6 ${stat.iconColor} opacity-50`} />
                            </div>
                          </div>
                        )}
                        {isLevel && (
                          <div className="relative animate-[awardBounce_2s_ease-in-out_infinite]">
                            <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                            <div className="absolute -inset-1 bg-[#8B5CF6] rounded-full opacity-20 animate-[awardGlow_2s_ease-in-out_infinite]" />
                          </div>
                        )}
                        {isHeart && (
                          <div className="relative">
                            <Icon className={`h-6 w-6 ${stat.iconColor} animate-[heartBeat_1.5s_ease-in-out_infinite]`} />
                            <div className="absolute inset-0 animate-[heartPulse_1.5s_ease-in-out_infinite]">
                              <Icon className={`h-6 w-6 ${stat.iconColor} opacity-30`} />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className={`text-3xl font-bold ${stat.textColor} mb-1`}>{stat.value}</div>
                      <div className="text-sm font-medium text-gray-700">{stat.label}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── FEATURE CARDS ── */}
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Link key={index} to={isAuthenticated ? feature.path : "/signin"}
                  className="group relative overflow-hidden rounded-2xl h-32 sm:h-40 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                  <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                    style={{ backgroundImage: `url(${feature.bgImage})` }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                  <div className="absolute inset-0 flex flex-col items-center justify-end p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-5 w-5 text-white drop-shadow-lg" />
                    </div>
                    <h3 className="text-white font-bold text-sm sm:text-base text-center drop-shadow-lg">
                      {feature.title}
                    </h3>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* ── INFO CARDS ── */}
        <div className="mx-auto max-w-5xl px-4 pb-16 pt-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Languages,
                title: "Mësim Interaktiv",
                desc: "Angazhohuni me përmbajtje dinamike dhe ushtrime praktike",
                gradient: "linear-gradient(135deg, #6d28d9, #8b5cf6)",
                glow: "rgba(109,40,217,0.15)",
              },
              {
                icon: TrendingUp,
                title: "Gjurmoni Progresin",
                desc: "Monitoroni zhvillimin tuaj me statistika të detajuara",
                gradient: "linear-gradient(135deg, #0891b2, #06b6d4)",
                glow: "rgba(8,145,178,0.15)",
              },
              {
                icon: Star,
                title: "Mësim i Personalizuar",
                desc: "Përshtateni eksperiencën tuaj sipas nivelit dhe qëllimeve tuaja",
                gradient: "linear-gradient(135deg, #d97706, #f59e0b)",
                glow: "rgba(217,119,6,0.15)",
                extra: "sm:col-span-2 lg:col-span-1",
              },
            ].map(({ icon: Icon, title, desc, gradient, glow, extra = "" }, i) => (
              <div key={i} className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${extra}`}
                style={{ background: "#fff", boxShadow: `0 4px 24px ${glow}`, border: "1px solid rgba(0,0,0,0.06)" }}>
                {/* background glow blob */}
                <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: glow, filter: "blur(30px)", pointerEvents: "none" }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: gradient, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, boxShadow: `0 4px 14px ${glow}` }}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  )
}

export default Home