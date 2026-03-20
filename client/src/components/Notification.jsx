"use client"
import { useState, useEffect, useRef } from "react"

const STYLES = `
@keyframes notif-slide-down {
  from { opacity: 0; transform: translateY(-110%); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes notif-slide-up {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-110%); }
}
@keyframes notif-shimmer {
  0%   { transform: translateX(-150%) skewX(-20deg); }
  100% { transform: translateX(500%) skewX(-20deg); }
}
@keyframes notif-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(74,222,128,0.6); }
  50%       { box-shadow: 0 0 0 6px rgba(74,222,128,0); }
}
.notif-enter { animation: notif-slide-down 0.5s cubic-bezier(0.22,1,0.36,1) both; }
.notif-exit  { animation: notif-slide-up  0.38s cubic-bezier(0.4,0,1,1) forwards; }
.notif-shimmer-anim { animation: notif-shimmer 4s ease-in-out infinite; }
.notif-pulse-anim   { animation: notif-pulse 2.2s ease-in-out infinite; }
`

const THEMES = {
  info: {
    bg: "linear-gradient(100deg, #0a2540 0%, #0e4d6b 45%, #0a2540 100%)",
    accent: "#38bdf8",
    tag: "rgba(56,189,248,0.15)",
    tagBorder: "rgba(56,189,248,0.3)",
    tagColor: "#7dd3fc",
  },
  success: {
    bg: "linear-gradient(100deg, #052e16 0%, #166534 45%, #052e16 100%)",
    accent: "#4ade80",
    tag: "rgba(74,222,128,0.12)",
    tagBorder: "rgba(74,222,128,0.3)",
    tagColor: "#86efac",
  },
  warning: {
    bg: "linear-gradient(100deg, #431407 0%, #92400e 45%, #431407 100%)",
    accent: "#fbbf24",
    tag: "rgba(251,191,36,0.12)",
    tagBorder: "rgba(251,191,36,0.3)",
    tagColor: "#fcd34d",
  },
  error: {
    bg: "linear-gradient(100deg, #450a0a 0%, #991b1b 45%, #450a0a 100%)",
    accent: "#f87171",
    tag: "rgba(248,113,113,0.12)",
    tagBorder: "rgba(248,113,113,0.3)",
    tagColor: "#fca5a5",
  },
  promo: {
    bg: "linear-gradient(100deg, #2e1065 0%, #6d28d9 45%, #2e1065 100%)",
    accent: "#c084fc",
    tag: "rgba(192,132,252,0.15)",
    tagBorder: "rgba(192,132,252,0.3)",
    tagColor: "#d8b4fe",
  },
  giveaway: {
    bg: "linear-gradient(100deg, #1a0533 0%, #5b21b6 35%, #7c3aed 55%, #1a0533 100%)",
    accent: "#a78bfa",
    tag: "rgba(167,139,250,0.15)",
    tagBorder: "rgba(167,139,250,0.35)",
    tagColor: "#c4b5fd",
  },
}

const Notification = ({
  message,
  type = "info",
  storageKey = "notification_last_seen",
  tags = [],
}) => {
  const [visible, setVisible] = useState(false)
  const [hiding, setHiding] = useState(false)
  const [hoverClose, setHoverClose] = useState(false)
  const styleInjected = useRef(false)

  useEffect(() => {
    if (!styleInjected.current) {
      const el = document.createElement("style")
      el.textContent = STYLES
      document.head.appendChild(el)
      styleInjected.current = true
    }
  }, [])

  useEffect(() => {
    const check = () => {
      const last = localStorage.getItem(storageKey)
      if (!last || Date.now() - parseInt(last) > 10 * 60 * 1000) {
        setVisible(true)
      }
    }
    check()
    const id = setInterval(check, 10 * 60 * 1000)
    return () => clearInterval(id)
  }, [storageKey])

  const dismiss = () => {
    setHiding(true)
    setTimeout(() => {
      setVisible(false)
      setHiding(false)
      localStorage.setItem(storageKey, Date.now().toString())
    }, 380)
  }

  if (!visible) return null

  const theme = THEMES[type] || THEMES.info

  return (
    <div
      className={hiding ? "notif-exit" : "notif-enter"}
      style={{
        width: "100%",
        position: "relative",
        overflow: "hidden",
        background: theme.bg,
        borderBottom: `1px solid ${theme.accent}22`,
      }}
    >
      {/* shimmer sweep */}
      <div
        className="notif-shimmer-anim"
        style={{
          position: "absolute",
          inset: 0,
          width: "30%",
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "9px 52px 9px 18px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          position: "relative",
          zIndex: 1,
          flexWrap: "wrap",
        }}
      >
        {/* pulse dot */}
        <span
          className="notif-pulse-anim"
          style={{
            width: 8, height: 8,
            borderRadius: "50%",
            background: "#4ade80",
            flexShrink: 0,
          }}
        />

        {/* message */}
        <p
          style={{
            fontSize: 13.5,
            color: "rgba(255,255,255,0.88)",
            lineHeight: 1.55,
            margin: 0,
            flex: 1,
            textAlign: "center",
          }}
          dangerouslySetInnerHTML={{ __html: message }}
        />

        {/* tags */}
        {tags.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 11.5,
                  fontWeight: 500,
                  padding: "2px 9px",
                  borderRadius: 999,
                  background: theme.tag,
                  border: `0.5px solid ${theme.tagBorder}`,
                  color: theme.tagColor,
                  whiteSpace: "nowrap",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* close button */}
        <button
          onClick={dismiss}
          onMouseEnter={() => setHoverClose(true)}
          onMouseLeave={() => setHoverClose(false)}
          aria-label="Mbyll"
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            width: 28, height: 28,
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
            background: hoverClose ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.09)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: hoverClose ? "#fff" : "rgba(255,255,255,0.6)",
            transition: "background 0.15s, color 0.15s, transform 0.15s",
            scale: hoverClose ? "1.1" : "1",
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

export default Notification