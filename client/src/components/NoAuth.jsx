"use client"

import { BookOpen, Headphones, CheckCircle, Zap, ArrowRight, Star, Users, PenLine, Target, Trophy } from "lucide-react"

const FLOATING_WORDS = [
  { word: "Hallo",    top: "8%",  left: "4%",  size: 18, delay: 0,    dur: 6 },
  { word: "Bonjour",  top: "15%", left: "88%", size: 15, delay: 1.2,  dur: 7 },
  { word: "Ciao",     top: "28%", left: "92%", size: 13, delay: 0.5,  dur: 8 },
  { word: "Hola",     top: "42%", left: "2%",  size: 14, delay: 2,    dur: 7.5 },
  { word: "Danke",    top: "55%", left: "90%", size: 16, delay: 0.8,  dur: 6.5 },
  { word: "Merci",    top: "68%", left: "5%",  size: 13, delay: 1.5,  dur: 8 },
  { word: "Grazie",   top: "78%", left: "87%", size: 17, delay: 0.3,  dur: 7 },
  { word: "Amigo",    top: "20%", left: "7%",  size: 12, delay: 2.5,  dur: 9 },
  { word: "Sprache",  top: "60%", left: "93%", size: 14, delay: 1,    dur: 7.5 },
  { word: "Lernen",   top: "85%", left: "10%", size: 16, delay: 0.6,  dur: 6 },
  { word: "Língua",   top: "35%", left: "5%",  size: 20, delay: 1.8,  dur: 8.5 },
  { word: "Hello",    top: "72%", left: "88%", size: 19, delay: 0.4,  dur: 7 },
  { word: "Musik",    top: "90%", left: "80%", size: 13, delay: 2.2,  dur: 6.5 },
  { word: "Langue",   top: "48%", left: "94%", size: 15, delay: 1.6,  dur: 8 },
  { word: "Mundo",    top: "12%", left: "78%", size: 12, delay: 3,    dur: 9 },
]

const features = [
  { icon: BookOpen,    title: "Mësime Interaktive", desc: "Ushtrime dinamike që përshtaten me tempin tuaj.",  bg: "#eef2ff", border: "#c7d2fe", gradient: "from-indigo-500 to-violet-600" },
  { icon: Headphones,  title: "Dëgjim & Shqiptim",  desc: "Audio nga folës amtarë natyrorë.",                bg: "#ecfeff", border: "#a5f3fc", gradient: "from-cyan-500 to-blue-600" },
  { icon: CheckCircle, title: "Teste të Nivelit",   desc: "Provoni njohuritë nga A1 deri C2.",               bg: "#fff1f2", border: "#fecdd3", gradient: "from-rose-500 to-pink-600" },
  { icon: Zap,         title: "Progres i Shpejtë",  desc: "XP dhe seria ditore ju mbajnë motivuar.",         bg: "#fffbeb", border: "#fde68a", gradient: "from-amber-500 to-orange-500" },
]

const avatars = [
  { letter: "A", from: "#f43f5e", to: "#e11d48" },
  { letter: "B", from: "#8b5cf6", to: "#7c3aed" },
  { letter: "L", from: "#06b6d4", to: "#0891b2" },
  { letter: "E", from: "#f59e0b", to: "#d97706" },
  { letter: "M", from: "#10b981", to: "#059669" },
]

const testimonials = [
  { name: "Arta K.",    city: "Tiranë",    text: "Brenda 3 muajsh arrita nivelin A2! Platforma është shumë e lehtë për t'u përdorur.", from: "#f43f5e", to: "#e11d48", letter: "A" },
  { name: "Besnik M.", city: "Prishtinë", text: "Kuizet dhe testet e nivelit më ndihmuan shumë për provimet e gjuhës. Rekomandoj!",     from: "#8b5cf6", to: "#7c3aed", letter: "B" },
  { name: "Lora S.",   city: "Shkodër",   text: "Seria ditore dhe XP-ja më mbajnë të motivuar çdo ditë. Nuk e lë dot!",              from: "#06b6d4", to: "#0891b2", letter: "L" },
]

const NoAuth = () => {
  const handleGetStarted = () => { window.location.href = "/signup" }
  const handleSignIn    = () => { window.location.href = "/signin" }

  return (
    <div style={{ background: "#fafafa", minHeight: "100vh", color: "#0f172a", position: "relative", overflowX: "hidden" }}>

      {/* ── keyframes ── */}
      <style>{`
        @keyframes floatWord {
          0%   { transform: translateY(0px) rotate(-2deg);  opacity: 0.55; }
          50%  { transform: translateY(-18px) rotate(2deg); opacity: 0.85; }
          100% { transform: translateY(0px) rotate(-2deg);  opacity: 0.55; }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(24px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>

      {/* ── floating multilingual words ── */}
      {FLOATING_WORDS.map((w, i) => (
        <div key={i} style={{
          position: "fixed",
          top: w.top, left: w.left,
          fontSize: w.size,
          fontWeight: 800,
          letterSpacing: "-0.01em",
          color: "#f59e0b",
          textShadow: "0 2px 12px rgba(245,158,11,0.45), 0 0 30px rgba(251,191,36,0.2)",
          animation: `floatWord ${w.dur}s ease-in-out ${w.delay}s infinite`,
          userSelect: "none",
          pointerEvents: "none",
          zIndex: 0,
          fontFamily: "monospace",
        }}>{w.word}</div>
      ))}

      {/* top glow */}
      <div style={{
        position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
        width: 800, height: 400, pointerEvents: "none", zIndex: 1,
        background: "radial-gradient(ellipse at top, rgba(139,92,246,0.07) 0%, transparent 70%)",
      }} />

      {/* ═══════ HERO ═══════ */}
      <section style={{ position: "relative", zIndex: 2, paddingTop: 96, paddingBottom: 88, paddingLeft: 24, paddingRight: 24 }}>
        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center", animation: "fadeUp 0.7s ease both" }}>

          {/* Social proof pill */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 12,
            background: "#fff", border: "1px solid #e2e8f0",
            boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
            borderRadius: 999, padding: "8px 18px", marginBottom: 36,
          }}>
            <div style={{ display: "flex", marginRight: 2 }}>
              {avatars.map((a, i) => (
                <div key={i} style={{
                  background: `linear-gradient(135deg,${a.from},${a.to})`,
                  border: "2px solid #fafafa",
                  width: 27, height: 27, borderRadius: "50%", marginLeft: i === 0 ? 0 : -8,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700, color: "#fff",
                }}>{a.letter}</div>
              ))}
            </div>
            <span style={{ width: 1, height: 14, background: "#e2e8f0" }} />
            <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>
              <span style={{ color: "#7c3aed", fontWeight: 800 }}>3,000+</span> nxënës të regjistruar
            </span>
            <div style={{ display: "flex", gap: 2 }}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={12} style={{ fill: "#fbbf24", color: "#fbbf24" }} />
              ))}
            </div>
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: "clamp(2.6rem,6vw,4.2rem)", fontWeight: 900, lineHeight: 1.08, letterSpacing: "-0.03em", marginBottom: "1.1rem" }}>
            <span style={{ color: "#0f172a" }}>Mëso Gjuhë të Reja</span><br />
            <span style={{ background: "linear-gradient(90deg,#7c3aed,#6366f1,#8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              si një profesionist
            </span>
          </h1>

          <p style={{ fontSize: "1.1rem", color: "#64748b", maxWidth: 520, margin: "0 auto 2.25rem", lineHeight: 1.75 }}>
            Platforma nr.1 shqiptare për mësimin e gjuhëve të huaja. Mësime interaktive, kuize, teste të nivelit dhe shumë më tepër — falas.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 32 }}>
            <button onClick={handleGetStarted} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "linear-gradient(135deg,#7c3aed,#6366f1)",
              color: "#fff", fontWeight: 700, fontSize: "1rem",
              padding: "14px 32px", borderRadius: 16, border: "none", cursor: "pointer",
              boxShadow: "0 8px 28px rgba(124,58,237,0.38), 0 2px 8px rgba(124,58,237,0.2)",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(124,58,237,0.48), 0 4px 12px rgba(124,58,237,0.25)" }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)";    e.currentTarget.style.boxShadow = "0 8px 28px rgba(124,58,237,0.38), 0 2px 8px rgba(124,58,237,0.2)" }}
            >
              Fillo falas tani <ArrowRight size={18} />
            </button>
            <button onClick={handleSignIn} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#fff", color: "#475569", fontWeight: 600, fontSize: "1rem",
              padding: "14px 32px", borderRadius: 16, cursor: "pointer",
              border: "1.5px solid #e2e8f0",
              boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)" }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)";    e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.07)" }}
            >
              Kam llogari — Kyçu
            </button>
          </div>

        </div>
      </section>

      {/* ═══════ STATS ═══════ */}
      <section style={{ position: "relative", zIndex: 2, padding: "0 24px 72px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 16 }}>
          {[
            { value: "3,000+", label: "Nxënës aktivë",     icon: Users,    color: "#7c3aed", bg: "#eef2ff" },
            { value: "5,000+", label: "Ushtrime",           icon: PenLine,  color: "#0891b2", bg: "#ecfeff" },
            { value: "A1–C2",  label: "Të gjitha nivelet",  icon: Target,   color: "#e11d48", bg: "#fff1f2" },
            { value: "95%",    label: "Shkalla e suksesit", icon: Trophy,   color: "#d97706", bg: "#fffbeb" },
          ].map((s, i) => {
            const Icon = s.icon
            return (
            <div key={i} style={{
              background: "#fff", border: "1.5px solid #f1f5f9",
              borderRadius: 20, padding: "24px 16px", textAlign: "center",
              boxShadow: "0 4px 20px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 10px 32px rgba(0,0,0,0.1)" }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)";    e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)" }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <Icon size={22} style={{ color: s.color }} />
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 500 }}>{s.label}</div>
            </div>
          )})}
        </div>
      </section>

      {/* ═══════ FEATURES ═══════ */}
      <section style={{ position: "relative", zIndex: 2, padding: "0 24px 72px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <h2 style={{ fontSize: "1.9rem", fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Gjithçka që nevojitet për sukses</h2>
            <p style={{ color: "#94a3b8", fontSize: "1rem" }}>Mjete profesionale për mësimin e gjuhëve të huaja</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <div key={i} style={{
                  background: f.bg, border: `1.5px solid ${f.border}`,
                  borderRadius: 20, padding: 24,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(0,0,0,0.1)" }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)";    e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.05)" }}
                >
                  <div className={`bg-gradient-to-br ${f.gradient}`} style={{
                    width: 44, height: 44, borderRadius: 12,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", marginBottom: 16,
                    boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
                  }}>
                    <Icon size={22} />
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a", marginBottom: 6 }}>{f.title}</h3>
                  <p style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════ TESTIMONIALS ═══════ */}
      <section style={{ position: "relative", zIndex: 2, padding: "0 24px 72px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <h2 style={{ fontSize: "1.9rem", fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Çfarë thonë nxënësit tanë</h2>
            <p style={{ color: "#94a3b8" }}>Rezultate reale nga nxënës realë</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
            {testimonials.map((t, i) => (
              <div key={i} style={{
                background: "#fff", border: "1.5px solid #f1f5f9",
                borderRadius: 20, padding: 24,
                boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.09)" }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)";    e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)" }}
              >
                <div style={{ display: "flex", gap: 2, marginBottom: 14 }}>
                  {[...Array(5)].map((_, j) => <Star key={j} size={14} style={{ fill: "#fbbf24", color: "#fbbf24" }} />)}
                </div>
                <p style={{ fontSize: "0.9rem", color: "#64748b", lineHeight: 1.7, marginBottom: 18 }}>"{t.text}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    background: `linear-gradient(135deg,${t.from},${t.to})`,
                    width: 36, height: 36, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0,
                    boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
                  }}>{t.letter}</div>
                  <div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0f172a" }}>{t.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{t.city}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ BOTTOM CTA ═══════ */}
      <section style={{ position: "relative", zIndex: 2, padding: "0 24px 88px" }}>
        <div style={{
          maxWidth: 700, margin: "0 auto",
          background: "linear-gradient(135deg,#7c3aed,#6366f1)",
          borderRadius: 28, padding: "56px 40px", textAlign: "center",
          boxShadow: "0 24px 64px rgba(124,58,237,0.32), 0 8px 24px rgba(124,58,237,0.2)",
          overflow: "hidden", position: "relative",
        }}>
          <div style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,255,255,0.12) 0%,transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -60, left: -60, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,255,255,0.08) 0%,transparent 70%)", pointerEvents: "none" }} />

          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <div style={{ display: "flex" }}>
                {avatars.map((a, i) => (
                  <div key={i} style={{
                    background: `linear-gradient(135deg,${a.from},${a.to})`,
                    border: "2px solid #7c3aed",
                    width: 34, height: 34, borderRadius: "50%", marginLeft: i === 0 ? 0 : -10,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700, color: "#fff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  }}>{a.letter}</div>
                ))}
                <div style={{
                  background: "rgba(255,255,255,0.2)", border: "2px solid #7c3aed",
                  width: 34, height: 34, borderRadius: "50%", marginLeft: -10,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.9)",
                }}>+3K</div>
              </div>
            </div>

            <h2 style={{ fontSize: "clamp(1.5rem,4vw,2.2rem)", fontWeight: 900, color: "#fff", marginBottom: 12, lineHeight: 1.2 }}>
              Gati të bashkoheni me 3,000+ nxënës?
            </h2>
            <p style={{ color: "rgba(255,255,255,0.72)", marginBottom: 28, fontSize: "1rem" }}>
              Regjistrohuni sot — pa kartë krediti, falas.
            </p>
            <button onClick={handleGetStarted} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#fff", color: "#7c3aed",
              fontWeight: 700, fontSize: "1rem",
              padding: "14px 36px", borderRadius: 16, border: "none", cursor: "pointer",
              boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.boxShadow = "0 10px 32px rgba(0,0,0,0.22)" }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)";    e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.18)" }}
            >
              Krijoni llogari falas <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

    </div>
  )
}

export default NoAuth
