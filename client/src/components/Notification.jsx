"use client"
import { useState, useEffect, useRef } from "react"

const STYLES = `
@keyframes notif-in {
  from { opacity: 0; transform: translateY(-100%); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes notif-out {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-100%); }
}
@keyframes notif-dot-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.4; transform: scale(0.6); }
}
.notif-enter { animation: notif-in  0.4s cubic-bezier(0.22,1,0.36,1) both; }
.notif-exit  { animation: notif-out 0.28s cubic-bezier(0.4,0,1,1) forwards; }
.notif-dot   { animation: notif-dot-pulse 2s ease-in-out infinite; }

.notif-wrap {
  width: 100%;
  position: relative;
}
.notif-inner {
  max-width: 960px;
  margin: 0 auto;
  padding: 10px 44px 10px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.notif-msg {
  flex: 1;
  min-width: 0;
  font-size: 13.5px;
  line-height: 1.5;
  margin: 0;
}
.notif-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  flex-shrink: 0;
}
.notif-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 9px;
  border-radius: 999px;
  white-space: nowrap;
  letter-spacing: 0.2px;
}
.notif-close {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 26px; height: 26px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .notif-inner {
    padding: 10px 40px 10px 14px;
    gap: 8px;
  }
  .notif-msg { font-size: 12.5px; min-width: 100%; order: 3; }
  .notif-tags { order: 4; }
}
`

const THEMES = {
  info: {
    bg: "#eff6ff",
    border: "#bfdbfe",
    dot: "#3b82f6",
    msgColor: "#1e40af",
    tagBg: "#dbeafe",
    tagColor: "#1d4ed8",
    iconColor: "#3b82f6",
    closeBg: "rgba(59,130,246,0.08)",
    closeHover: "rgba(59,130,246,0.18)",
    closeColor: "#3b82f6",
  },
  success: {
    bg: "#f0fdf4",
    border: "#bbf7d0",
    dot: "#22c55e",
    msgColor: "#14532d",
    tagBg: "#dcfce7",
    tagColor: "#166534",
    iconColor: "#22c55e",
    closeBg: "rgba(34,197,94,0.08)",
    closeHover: "rgba(34,197,94,0.18)",
    closeColor: "#16a34a",
  },
  warning: {
    bg: "#fffbeb",
    border: "#fde68a",
    dot: "#f59e0b",
    msgColor: "#78350f",
    tagBg: "#fef3c7",
    tagColor: "#92400e",
    iconColor: "#f59e0b",
    closeBg: "rgba(245,158,11,0.08)",
    closeHover: "rgba(245,158,11,0.18)",
    closeColor: "#d97706",
  },
  error: {
    bg: "#fff1f2",
    border: "#fecdd3",
    dot: "#ef4444",
    msgColor: "#881337",
    tagBg: "#ffe4e6",
    tagColor: "#9f1239",
    iconColor: "#ef4444",
    closeBg: "rgba(239,68,68,0.08)",
    closeHover: "rgba(239,68,68,0.18)",
    closeColor: "#dc2626",
  },
  promo: {
    bg: "#faf5ff",
    border: "#e9d5ff",
    dot: "#a855f7",
    msgColor: "#4c1d95",
    tagBg: "#f3e8ff",
    tagColor: "#6b21a8",
    iconColor: "#a855f7",
    closeBg: "rgba(168,85,247,0.08)",
    closeHover: "rgba(168,85,247,0.18)",
    closeColor: "#9333ea",
  },
  giveaway: {
    bg: "linear-gradient(90deg, #fdf4ff 0%, #faf5ff 50%, #eff6ff 100%)",
    border: "#d8b4fe",
    dot: "#8b5cf6",
    msgColor: "#2e1065",
    tagBg: "#ede9fe",
    tagColor: "#5b21b6",
    iconColor: "#8b5cf6",
    closeBg: "rgba(139,92,246,0.08)",
    closeHover: "rgba(139,92,246,0.18)",
    closeColor: "#7c3aed",
  },
}

const ICONS = {
  info: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 8v4m0 4h.01"/></svg>,
  success: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  warning: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>,
  error: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M15 9l-6 6M9 9l6 6"/></svg>,
  promo: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>,
  giveaway: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/></svg>,
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
    }, 280)
  }

  if (!visible) return null

  const t = THEMES[type] || THEMES.info

  return (
    <div
      className={`notif-wrap ${hiding ? "notif-exit" : "notif-enter"}`}
      style={{
        background: t.bg,
        borderBottom: `1px solid ${t.border}`,
      }}
    >
      <style>{STYLES}</style>
      <div className="notif-inner">
        {/* icon */}
        <span style={{ color: t.iconColor, flexShrink: 0, display: "flex", alignItems: "center" }}>
          {ICONS[type] || ICONS.info}
        </span>

        {/* live dot */}
        <span
          className="notif-dot"
          style={{
            width: 6, height: 6,
            borderRadius: "50%",
            background: t.dot,
            flexShrink: 0,
            display: "inline-block",
          }}
        />

        {/* message */}
        <p
          className="notif-msg"
          style={{ color: t.msgColor, fontWeight: 500 }}
          dangerouslySetInnerHTML={{ __html: message }}
        />

        {/* tags */}
        {tags.length > 0 && (
          <div className="notif-tags">
            {tags.map((tag) => (
              <span
                key={tag}
                className="notif-tag"
                style={{ background: t.tagBg, color: t.tagColor }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* close */}
      <button
        onClick={dismiss}
        onMouseEnter={() => setHoverClose(true)}
        onMouseLeave={() => setHoverClose(false)}
        aria-label="Mbyll"
        className="notif-close"
        style={{
          background: hoverClose ? t.closeHover : t.closeBg,
          color: t.closeColor,
        }}
      >
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
          <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}

export default Notification
