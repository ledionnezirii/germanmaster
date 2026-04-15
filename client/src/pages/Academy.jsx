import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { academyService } from "../services/api";

// ── Icons ──────────────────────────────────────────────────────────────────────
const Icon = ({ path, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d={path} />
  </svg>
);
const I = {
  users:     "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  plus:      "M12 5v14M5 12h14",
  trash:     "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  edit:      "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  chevronR:  "M9 18l6-6-6-6",
  x:         "M18 6L6 18M6 6l12 12",
  book:      "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z",
  shield:    "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  trophy:    "M6 9H2V3h4v6zM22 9h-4V3h4v6zM12 19v-3M8 22h8M6 9c0 3.31 2.69 6 6 6s6-2.69 6-6",
  arrowL:    "M19 12H5M12 19l-7-7 7-7",
  userPlus:  "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM19 8v6M22 11h-6",
  userMinus: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 11h-6",
  key:       "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
  hash:      "M4 9h16M4 15h16M10 3L8 21M16 3l-2 18",
  star:      "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  zap:       "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  copy:      "M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M8 4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2zM16 12H8M12 8v8",
  check:     "M20 6L9 17l-5-5",
  logIn:     "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3",
};

const LEVEL_COLORS = {
  A1: { bg: "#e8f5e9", text: "#2e7d32", border: "#a5d6a7" },
  A2: { bg: "#e3f2fd", text: "#1565c0", border: "#90caf9" },
  B1: { bg: "#fff3e0", text: "#e65100", border: "#ffcc80" },
  B2: { bg: "#fce4ec", text: "#880e4f", border: "#f48fb1" },
  C1: { bg: "#f3e5f5", text: "#4a148c", border: "#ce93d8" },
  C2: { bg: "#fafafa", text: "#212121", border: "#bdbdbd" },
};

// ── Shared UI primitives ───────────────────────────────────────────────────────
const LevelBadge = ({ level }) => {
  const c = LEVEL_COLORS[level] || { bg: "#f5f5f5", text: "#666", border: "#ddd" };
  return (
    <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em" }}>
      {level}
    </span>
  );
};

const LevelBadgeDark = ({ level }) => (
  <span style={{ background: "rgba(255,255,255,0.2)", color: "#fff", padding: "3px 12px", borderRadius: 20, fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", border: "1px solid rgba(255,255,255,0.3)" }}>
    {level}
  </span>
);

const Avatar = ({ name = "", size = 36 }) => {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const hue = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `hsl(${hue},55%,62%)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: size * 0.36, flexShrink: 0 }}>
      {initials || "?"}
    </div>
  );
};

const Modal = ({ open, onClose, title, children, width = 480 }) => {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(10,14,26,0.72)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: width, boxShadow: "0 24px 80px rgba(0,0,0,0.22)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #f0f0f0" }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4, borderRadius: 6, display: "flex" }}>
            <Icon path={I.x} size={20} />
          </button>
        </div>
        <div style={{ padding: "24px" }}>{children}</div>
      </div>
    </div>
  );
};

const Field = ({ label, children, hint }) => (
  <div style={{ marginBottom: 18 }}>
    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{label}</label>
    {children}
    {hint && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>{hint}</p>}
  </div>
);

const Input = (props) => (
  <input {...props} style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, color: "#0f172a", outline: "none", background: "#fafafa", transition: "border 0.15s", ...props.style }}
    onFocus={e => e.target.style.borderColor = "#6366f1"}
    onBlur={e => e.target.style.borderColor = "#e2e8f0"}
  />
);

const Sel = ({ children, ...props }) => (
  <select {...props} style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, color: "#0f172a", outline: "none", background: "#fafafa", cursor: "pointer", ...props.style }}
    onFocus={e => e.target.style.borderColor = "#6366f1"}
    onBlur={e => e.target.style.borderColor = "#e2e8f0"}
  >
    {children}
  </select>
);

const Btn = ({ variant = "primary", children, icon, loading, ...props }) => {
  const vs = {
    primary: { background: "#6366f1", color: "#fff", border: "none" },
    danger:  { background: "#ef4444", color: "#fff", border: "none" },
    ghost:   { background: "transparent", color: "#6366f1", border: "1.5px solid #e0e0ff" },
    green:   { background: "#16a34a", color: "#fff", border: "none" },
  };
  return (
    <button {...props} disabled={loading || props.disabled}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "opacity 0.15s", opacity: loading ? 0.7 : 1, ...vs[variant], ...props.style }}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.85"; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
    >
      {icon && <Icon path={icon} size={15} />}
      {loading ? "Loading…" : children}
    </button>
  );
};

const StatCard = ({ label, value, icon, color = "#6366f1" }) => (
  <div style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", border: "1px solid #f0f0f8", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", color }}>
      <Icon path={icon} size={20} />
    </div>
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2, fontWeight: 500 }}>{label}</div>
    </div>
  </div>
);

function ActionBtn({ icon, onClick, danger }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: "1px solid #f0f0f8", color: danger ? "#ef4444" : "#94a3b8", padding: 6, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s, color 0.15s" }}
      onMouseEnter={e => { e.currentTarget.style.background = danger ? "#fef2f2" : "#f8f9ff"; e.currentTarget.style.color = danger ? "#ef4444" : "#6366f1"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = danger ? "#ef4444" : "#94a3b8"; }}
    >
      <Icon path={icon} size={14} />
    </button>
  );
}

function EmptyState({ icon, title, subtitle }) {
  return (
    <div style={{ textAlign: "center", padding: "80px 20px", color: "#94a3b8" }}>
      <div style={{ width: 60, height: 60, borderRadius: 18, background: "#f0f0ff", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", color: "#c7c9f5" }}>
        <Icon path={icon} size={28} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 14 }}>{subtitle}</div>
    </div>
  );
}

function LoadingGrid({ rows = 3 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 18 }}>
      <style>{`@keyframes acpulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
      {Array.from({ length: rows * 3 }).map((_, i) => (
        <div key={i} style={{ background: "#fff", borderRadius: 14, padding: 22, border: "1px solid #eef0f6", animation: "acpulse 1.4s ease-in-out infinite" }}>
          <div style={{ height: 18, background: "#f0f0f8", borderRadius: 8, marginBottom: 10, width: "60%" }} />
          <div style={{ height: 13, background: "#f5f5fb", borderRadius: 6, marginBottom: 7, width: "90%" }} />
          <div style={{ height: 13, background: "#f5f5fb", borderRadius: 6, width: "70%" }} />
        </div>
      ))}
    </div>
  );
}

function PageHeader({ title, subtitle, back, actions }) {
  return (
    <div style={{ background: "#fff", borderBottom: "1px solid #eef0f6", padding: "0 32px", display: "flex", alignItems: "center", height: 64, position: "sticky", top: 0, zIndex: 100, gap: 0 }}>
      {back && (
        <button onClick={back} style={{ background: "none", border: "none", cursor: "pointer", color: "#6366f1", display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, marginRight: 16, padding: "6px 10px", borderRadius: 8 }}
          onMouseEnter={e => e.currentTarget.style.background = "#f0f0ff"}
          onMouseLeave={e => e.currentTarget.style.background = "none"}
        >
          <Icon path={I.arrowL} size={16} /> Back
        </button>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
          <Icon path={I.shield} size={17} />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: "#94a3b8" }}>{subtitle}</div>}
        </div>
      </div>
      {actions && <div style={{ display: "flex", gap: 8 }}>{actions}</div>}
    </div>
  );
}

// ── Shared leaderboard table ───────────────────────────────────────────────────
function LeaderboardTable({ leaderboard, currentUserId, isTeacher, onRemove, groupId }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #eef0f6", overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
      {!leaderboard?.leaderboard?.length ? (
        <EmptyState icon={I.users} title="No students yet" subtitle="Add students to see the leaderboard." />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
            <thead>
              <tr style={{ background: "#f8f9fc" }}>
                {["Rank", "Student", "Level", "XP", "Weekly XP", "Streak", "Words", "Grammar", "Quizzes", ...(isTeacher ? [""] : [])].map(h => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap", borderBottom: "1px solid #f0f0f8" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leaderboard.leaderboard.map((s, i) => {
                const isMe = String(s._id) === String(currentUserId);
                return (
                  <tr key={s._id} style={{ borderBottom: "1px solid #f8f9fc", background: isMe ? "#f0f4ff" : i < 3 ? ["#fffbeb","#f8f9ff","#f5fff5"][i] : "#fff" }}>
                    <td style={{ padding: "12px 14px", fontWeight: 800, fontSize: 16, color: ["#f59e0b","#94a3b8","#b45309","#64748b"][Math.min(i,3)] }}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${s.rank}`}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar name={s.name} size={34} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                            {s.name}
                            {isMe && <span style={{ fontSize: 10, background: "#e0e7ff", color: "#4f46e5", padding: "1px 7px", borderRadius: 20, fontWeight: 700 }}>YOU</span>}
                          </div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>{s.level ? <LevelBadge level={s.level} /> : <span style={{ color: "#cbd5e1", fontSize: 13 }}>—</span>}</td>
                    <td style={{ padding: "12px 14px", fontWeight: 700, color: "#6366f1" }}>{(s.xp || 0).toLocaleString()}</td>
                    <td style={{ padding: "12px 14px", color: "#0ea5e9", fontWeight: 600 }}>{(s.weeklyXp || 0).toLocaleString()}</td>
                    <td style={{ padding: "12px 14px" }}><span style={{ fontWeight: 600, color: s.streakCount > 0 ? "#f59e0b" : "#94a3b8", fontSize: 13 }}>🔥 {s.streakCount || 0}</span></td>
                    <td style={{ padding: "12px 14px", color: "#64748b", fontSize: 13 }}>{s.wordsLearned || 0}</td>
                    <td style={{ padding: "12px 14px", color: "#64748b", fontSize: 13 }}>{s.grammarTopics || 0}</td>
                    <td style={{ padding: "12px 14px", color: "#64748b", fontSize: 13 }}>{s.quizzesCompleted || 0}</td>
                    {isTeacher && (
                      <td style={{ padding: "12px 14px" }}>
                        <button onClick={() => onRemove(groupId, s._id)} title="Remove student"
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 4, borderRadius: 6, opacity: 0.45, transition: "opacity 0.15s" }}
                          onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                          onMouseLeave={e => e.currentTarget.style.opacity = "0.45"}
                        >
                          <Icon path={I.userMinus} size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// STUDENT VIEW
// ══════════════════════════════════════════════════════════════
function StudentView({ currentUser }) {
  const [myGroup,    setMyGroup]    = useState(null);
  const [leaderboard,setLeaderboard]= useState(null);
  const [loading,    setLoading]    = useState(true);
  const [lbLoading,  setLbLoading]  = useState(false);
  const [view,       setView]       = useState("group"); // "group" | "leaderboard"
  const [joinCode,   setJoinCode]   = useState("");
  const [joining,    setJoining]    = useState(false);
  const [joinError,  setJoinError]  = useState("");
  const [copied,     setCopied]     = useState(false);

  useEffect(() => { fetchMyGroup(); }, []);

  const fetchMyGroup = async () => {
    setLoading(true);
    try {
      const res = await academyService.getMyGroup();
      const g = res.data?.data ?? res.data;
      setMyGroup(g || null);
    } catch { setMyGroup(null); }
    finally { setLoading(false); }
  };

  const fetchLeaderboard = async () => {
    if (!myGroup?._id) return;
    setLbLoading(true);
    try {
      const res = await academyService.getGroupLeaderboard(myGroup._id);
      setLeaderboard(res.data?.data || res.data);
    } catch { /* silent */ }
    finally { setLbLoading(false); }
  };

  const openLeaderboard = () => {
    setView("leaderboard");
    if (!leaderboard) fetchLeaderboard();
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setJoining(true); setJoinError("");
    try {
      await academyService.joinGroupByCode(joinCode.trim().toUpperCase());
      await fetchMyGroup();
      setView("group"); setJoinCode("");
    } catch (e) {
      setJoinError(e.response?.data?.message || "Invalid join code. Please try again.");
    } finally { setJoining(false); }
  };

  const myRank = leaderboard?.leaderboard?.find(s => String(s._id) === String(currentUser?._id));

  if (loading) {
    return (
      <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", minHeight: "100vh", background: "#f7f8fc" }}>
        <PageHeader title="My Academy" subtitle="Loading…" />
        <div style={{ padding: "32px 20px", maxWidth: 900, margin: "0 auto" }}><LoadingGrid rows={1} /></div>
      </div>
    );
  }

  // ── No group: show join screen ─────────────────────────────────────────────
  if (!myGroup) {
    return (
      <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", minHeight: "100vh", background: "#f7f8fc" }}>
        <PageHeader title="My Academy" subtitle="Join a group to get started" />
        <div style={{ maxWidth: 460, margin: "64px auto", padding: "0 20px" }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 40, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", border: "1px solid #eef0f6", textAlign: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: "#fff" }}>
              <Icon path={I.key} size={30} />
            </div>
            <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: "#0f172a" }}>Join a Group</h2>
            <p style={{ margin: "0 0 28px", color: "#64748b", fontSize: 14, lineHeight: 1.6 }}>
              Enter the 6-character join code your teacher gave you.
            </p>
            <input
              value={joinCode}
              onChange={e => { setJoinCode(e.target.value.toUpperCase().slice(0, 6)); setJoinError(""); }}
              onKeyDown={e => e.key === "Enter" && handleJoin()}
              placeholder="AB12CD"
              maxLength={6}
              style={{ width: "100%", boxSizing: "border-box", padding: "14px 16px", border: `2px solid ${joinError ? "#fca5a5" : "#e2e8f0"}`, borderRadius: 12, fontSize: 24, fontWeight: 800, letterSpacing: "0.35em", textAlign: "center", textTransform: "uppercase", outline: "none", background: "#fafafa", color: "#0f172a", marginBottom: joinError ? 8 : 20, transition: "border 0.15s" }}
              onFocus={e => { if (!joinError) e.target.style.borderColor = "#6366f1"; }}
              onBlur={e => { if (!joinError) e.target.style.borderColor = "#e2e8f0"; }}
            />
            {joinError && <p style={{ margin: "0 0 16px", fontSize: 13, color: "#ef4444", fontWeight: 500 }}>{joinError}</p>}
            <Btn loading={joining} onClick={handleJoin} style={{ width: "100%", justifyContent: "center", padding: "13px", fontSize: 15 }}>
              <Icon path={I.logIn} size={16} /> Join Group
            </Btn>
          </div>
        </div>
      </div>
    );
  }

  // ── Has group ──────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", minHeight: "100vh", background: "#f7f8fc" }}>
      <PageHeader
        title={view === "leaderboard" ? "Class Leaderboard" : myGroup?.name || "My Group"}
        subtitle={view === "leaderboard" ? myGroup?.name : (myGroup?.academyId?.name || "Your class")}
        back={view === "leaderboard" ? () => setView("group") : null}
      />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
        {view === "group" && (
          <>
            {/* Hero card */}
            <div style={{ background: "linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)", borderRadius: 20, padding: "28px 32px", marginBottom: 20, color: "#fff", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", right: -20, top: -20, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
              <div style={{ position: "absolute", right: 30, bottom: -30, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
              <div style={{ position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon path={I.users} size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.1 }}>{myGroup?.name}</div>
                    <div style={{ fontSize: 13, opacity: 0.75, marginTop: 2 }}>{myGroup?.academyId?.name}</div>
                  </div>
                  {myGroup?.level && <LevelBadgeDark level={myGroup.level} />}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                  {[
                    { label: "Your XP", value: (currentUser?.xp || 0).toLocaleString() },
                    { label: "Your Rank", value: myRank ? `#${myRank.rank}` : "—" },
                    { label: "Streak", value: `🔥 ${currentUser?.streakCount || 0}` },
                  ].map(s => (
                    <div key={s.label} style={{ background: "rgba(255,255,255,0.13)", borderRadius: 12, padding: "12px 16px" }}>
                      <div style={{ fontSize: 18, fontWeight: 800 }}>{s.value}</div>
                      <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Join code display */}
            {myGroup?.joinCode && (
              <div style={{ background: "#fff", borderRadius: 14, padding: "14px 20px", marginBottom: 16, border: "1px solid #eef0f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f0f0ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366f1" }}>
                    <Icon path={I.hash} size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Group Join Code</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", letterSpacing: "0.2em" }}>{myGroup.joinCode}</div>
                  </div>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(myGroup.joinCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  style={{ background: copied ? "#f0fdf4" : "#f8f9ff", border: `1px solid ${copied ? "#bbf7d0" : "#e2e8f0"}`, color: copied ? "#16a34a" : "#6366f1", padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}>
                  <Icon path={copied ? I.check : I.copy} size={14} />
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            )}

            {/* Leaderboard button */}
            <button onClick={openLeaderboard}
              style={{ width: "100%", background: "#fff", border: "1px solid #eef0f6", borderRadius: 14, padding: "18px 24px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", transition: "box-shadow 0.2s, transform 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(99,102,241,0.12)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 6px rgba(0,0,0,0.04)"; e.currentTarget.style.transform = "none"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: "#fff8e1", display: "flex", alignItems: "center", justifyContent: "center", color: "#f59e0b" }}>
                  <Icon path={I.trophy} size={20} />
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>Class Leaderboard</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 1 }}>See how you rank against your classmates</div>
                </div>
              </div>
              <Icon path={I.chevronR} size={18} />
            </button>
          </>
        )}

        {view === "leaderboard" && (
          lbLoading ? <LoadingGrid rows={1} /> : leaderboard ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 14, marginBottom: 24 }}>
                <StatCard label="Classmates" value={leaderboard.totalStudents} icon={I.users} color="#6366f1" />
                {myRank && <StatCard label="Your Rank" value={`#${myRank.rank}`} icon={I.trophy} color="#f59e0b" />}
                {myRank && <StatCard label="Your XP" value={(myRank.xp || 0).toLocaleString()} icon={I.zap} color="#10b981" />}
              </div>
              <LeaderboardTable leaderboard={leaderboard} currentUserId={currentUser?._id} isTeacher={false} />
            </>
          ) : <EmptyState icon={I.trophy} title="Leaderboard unavailable" subtitle="Could not load leaderboard data." />
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TEACHER / ADMIN VIEW
// ══════════════════════════════════════════════════════════════
function TeacherAdminView({ currentUser }) {
  const isAdmin   = currentUser?.role === "admin";
  const isTeacher = currentUser?.role === "academyAdmin";

  const [view,          setView]          = useState("academies");
  const [selectedAcademy,setSelectedAcademy]= useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [academies,     setAcademies]     = useState([]);
  const [groups,        setGroups]        = useState([]);
  const [leaderboard,   setLeaderboard]   = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState(null);
  const [modal,         setModal]         = useState(null);
  const [formData,      setFormData]      = useState({});
  const [submitting,    setSubmitting]    = useState(false);
  const [searchEmail,   setSearchEmail]   = useState("");

  useEffect(() => { if (view === "academies") fetchAcademies(); }, [view]);
  useEffect(() => { if (view === "groups")    fetchGroups();    }, [view]);

  const fetchAcademies = async () => {
    setLoading(true); setError(null);
    try { const res = await academyService.getAllAcademies(); setAcademies(Array.isArray(res.data) ? res.data : res.data?.data || []); }
    catch { setError("Failed to load academies."); } finally { setLoading(false); }
  };
  const fetchGroups = async () => {
    setLoading(true); setError(null);
    try { const res = await academyService.getMyGroups(); setGroups(Array.isArray(res.data) ? res.data : res.data?.data || []); }
    catch { setError("Failed to load groups."); } finally { setLoading(false); }
  };
  const fetchLeaderboard = async (groupId) => {
    setLoading(true); setError(null);
    try { const res = await academyService.getGroupLeaderboard(groupId); setLeaderboard(res.data?.data || res.data); }
    catch { setError("Failed to load leaderboard."); } finally { setLoading(false); }
  };

  const openGroups      = (a) => { setSelectedAcademy(a); setView("groups"); };
  const openLeaderboard = (g) => { setSelectedGroup(g); setView("leaderboard"); fetchLeaderboard(g._id); };
  const goBack = () => {
    if (view === "leaderboard") setView("groups");
    else if (view === "groups") { setView("academies"); setSelectedAcademy(null); }
  };

  const handleCreateAcademy = async () => {
    if (!formData.name?.trim()) return; setSubmitting(true);
    try { await academyService.createAcademy({ name: formData.name, description: formData.description }); setModal(null); setFormData({}); fetchAcademies(); }
    catch (e) { alert(e.response?.data?.message || "Error"); } finally { setSubmitting(false); }
  };
  const handleUpdateAcademy = async () => {
    setSubmitting(true);
    try { await academyService.updateAcademy(formData._id, { name: formData.name, description: formData.description }); setModal(null); setFormData({}); fetchAcademies(); }
    catch (e) { alert(e.response?.data?.message || "Error"); } finally { setSubmitting(false); }
  };
  const handleDeleteAcademy = async (id) => {
    if (!window.confirm("Delete this academy and all its groups?")) return;
    try { await academyService.deleteAcademy(id); fetchAcademies(); } catch (e) { alert(e.response?.data?.message || "Error"); }
  };
  const handleCreateGroup = async () => {
    if (!formData.name?.trim() || !formData.level) return; setSubmitting(true);
    try { await academyService.createGroup({ name: formData.name, level: formData.level }); setModal(null); setFormData({}); fetchGroups(); }
    catch (e) { alert(e.response?.data?.message || "Error"); } finally { setSubmitting(false); }
  };
  const handleUpdateGroup = async () => {
    setSubmitting(true);
    try { await academyService.updateGroup(formData._id, { name: formData.name, level: formData.level }); setModal(null); setFormData({}); fetchGroups(); }
    catch (e) { alert(e.response?.data?.message || "Error"); } finally { setSubmitting(false); }
  };
  const handleDeleteGroup = async (id) => {
    if (!window.confirm("Delete this group?")) return;
    try { await academyService.deleteGroup(id); fetchGroups(); } catch (e) { alert(e.response?.data?.message || "Error"); }
  };
  const handleAddStudent = async () => {
    if (!searchEmail.trim()) return; setSubmitting(true);
    try { await academyService.addStudentToGroup(formData.groupId, { email: searchEmail.trim().toLowerCase() }); setModal(null); setSearchEmail(""); setFormData({}); fetchGroups(); }
    catch (e) { alert(e.response?.data?.message || "Student not found"); } finally { setSubmitting(false); }
  };
  const handleRemoveStudent = async (groupId, studentId) => {
    if (!window.confirm("Remove this student from the group?")) return;
    try { await academyService.removeStudentFromGroup(groupId, studentId); fetchLeaderboard(groupId); }
    catch (e) { alert(e.response?.data?.message || "Error"); }
  };

  const headerTitle = view === "academies" ? "Academies" : view === "groups" ? (selectedAcademy?.name || "Groups") : selectedGroup?.name;
  const headerSub   = view === "leaderboard" ? "Leaderboard" : view === "groups" ? "Manage groups" : "Manage academies";
  const headerActions = (
    <>
      {view === "academies" && isAdmin   && <Btn icon={I.plus}    onClick={() => { setFormData({}); setModal("createAcademy"); }}>New Academy</Btn>}
      {view === "groups"    && isTeacher && <Btn icon={I.plus}    onClick={() => { setFormData({}); setModal("createGroup"); }}>New Group</Btn>}
      {view === "leaderboard" && isTeacher && selectedGroup && <Btn icon={I.userPlus} onClick={() => { setFormData({ groupId: selectedGroup._id }); setModal("addStudent"); }}>Add Student</Btn>}
    </>
  );

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", minHeight: "100vh", background: "#f7f8fc" }}>
      <PageHeader title={headerTitle} subtitle={headerSub} back={view !== "academies" ? goBack : null} actions={headerActions} />

      <div style={{ padding: "32px", maxWidth: 1100, margin: "0 auto" }}>
        {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", padding: "12px 16px", borderRadius: 10, marginBottom: 24, fontSize: 14 }}>{error}</div>}

        {view === "academies" && (
          loading ? <LoadingGrid /> :
          academies.length === 0 ? <EmptyState icon={I.shield} title="No academies yet" subtitle={isAdmin ? "Create your first academy to get started." : "No academies assigned to you yet."} /> : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 18 }}>
              {academies.map(a => (
                <AcademyCard key={a._id} academy={a} isAdmin={isAdmin}
                  onView={() => openGroups(a)}
                  onEdit={() => { setFormData({ _id: a._id, name: a.name, description: a.description }); setModal("editAcademy"); }}
                  onDelete={() => handleDeleteAcademy(a._id)}
                />
              ))}
            </div>
          )
        )}

        {view === "groups" && (
          loading ? <LoadingGrid /> :
          groups.length === 0 ? <EmptyState icon={I.users} title="No groups yet" subtitle={isTeacher ? "Create your first group to start adding students." : "No groups."} /> : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 18 }}>
              {groups.map(g => (
                <GroupCard key={g._id} group={g} isTeacher={isTeacher}
                  onLeaderboard={() => openLeaderboard(g)}
                  onEdit={() => { setFormData({ _id: g._id, name: g.name, level: g.level }); setModal("editGroup"); }}
                  onDelete={() => handleDeleteGroup(g._id)}
                  onAddStudent={() => { setFormData({ groupId: g._id }); setModal("addStudent"); }}
                />
              ))}
            </div>
          )
        )}

        {view === "leaderboard" && (
          loading ? <LoadingGrid rows={1} /> : leaderboard ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 14, marginBottom: 28 }}>
                <StatCard label="Total Students" value={leaderboard.totalStudents} icon={I.users} color="#6366f1" />
                <StatCard label="Level" value={leaderboard.level || "—"} icon={I.book} color="#f59e0b" />
              </div>
              <LeaderboardTable leaderboard={leaderboard} currentUserId={currentUser?._id} isTeacher={isTeacher} onRemove={handleRemoveStudent} groupId={selectedGroup?._id} />
            </>
          ) : null
        )}
      </div>

      {/* Modals */}
      <Modal open={modal === "createAcademy"} onClose={() => setModal(null)} title="Create Academy">
        <Field label="Academy Name"><Input placeholder="e.g. Gjuha Academy Prishtinë" value={formData.name || ""} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} /></Field>
        <Field label="Description (optional)">
          <textarea value={formData.description || ""} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Brief description…" rows={3}
            style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none", resize: "vertical", background: "#fafafa" }} />
        </Field>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn loading={submitting} onClick={handleCreateAcademy}>Create Academy</Btn>
        </div>
      </Modal>

      <Modal open={modal === "editAcademy"} onClose={() => setModal(null)} title="Edit Academy">
        <Field label="Academy Name"><Input value={formData.name || ""} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} /></Field>
        <Field label="Description">
          <textarea value={formData.description || ""} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={3}
            style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none", resize: "vertical", background: "#fafafa" }} />
        </Field>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn loading={submitting} onClick={handleUpdateAcademy}>Save Changes</Btn>
        </div>
      </Modal>

      <Modal open={modal === "createGroup"} onClose={() => setModal(null)} title="Create Group">
        <Field label="Group Name" hint='e.g. "A1 Monday 18:00"'><Input placeholder="Group name" value={formData.name || ""} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} /></Field>
        <Field label="Level">
          <Sel value={formData.level || ""} onChange={e => setFormData(p => ({ ...p, level: e.target.value }))}>
            <option value="">Select level…</option>
            {["A1","A2","B1","B2","C1","C2"].map(l => <option key={l}>{l}</option>)}
          </Sel>
        </Field>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn loading={submitting} onClick={handleCreateGroup}>Create Group</Btn>
        </div>
      </Modal>

      <Modal open={modal === "editGroup"} onClose={() => setModal(null)} title="Edit Group">
        <Field label="Group Name"><Input value={formData.name || ""} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} /></Field>
        <Field label="Level">
          <Sel value={formData.level || ""} onChange={e => setFormData(p => ({ ...p, level: e.target.value }))}>
            <option value="">Select level…</option>
            {["A1","A2","B1","B2","C1","C2"].map(l => <option key={l}>{l}</option>)}
          </Sel>
        </Field>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn loading={submitting} onClick={handleUpdateGroup}>Save Changes</Btn>
        </div>
      </Modal>

      <Modal open={modal === "addStudent"} onClose={() => { setModal(null); setSearchEmail(""); }} title="Add Student to Group">
        <Field label="Student Email" hint="Enter the student's registered email address.">
          <Input type="email" placeholder="student@example.com" value={searchEmail} onChange={e => setSearchEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddStudent()} />
        </Field>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Btn variant="ghost" onClick={() => { setModal(null); setSearchEmail(""); }}>Cancel</Btn>
          <Btn icon={I.userPlus} loading={submitting} onClick={handleAddStudent}>Add Student</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ── AcademyCard ────────────────────────────────────────────────────────────────
function AcademyCard({ academy, isAdmin, onView, onEdit, onDelete }) {
  const admin = academy.academyAdmin;
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #eef0f6", padding: "22px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", transition: "box-shadow 0.2s, transform 0.15s", cursor: "pointer" }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(99,102,241,0.12)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 6px rgba(0,0,0,0.04)"; e.currentTarget.style.transform = "none"; }}
      onClick={onView}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            <Icon path={I.shield} size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>{academy.name}</div>
            <div style={{ fontSize: 12, color: academy.isActive !== false ? "#22c55e" : "#ef4444", fontWeight: 600, marginTop: 1 }}>
              {academy.isActive !== false ? "● Active" : "● Inactive"}
            </div>
          </div>
        </div>
        {isAdmin && (
          <div style={{ display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
            <ActionBtn icon={I.edit} onClick={onEdit} />
            <ActionBtn icon={I.trash} onClick={onDelete} danger />
          </div>
        )}
      </div>
      {academy.description && <p style={{ margin: "0 0 14px", fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>{academy.description}</p>}
      {admin && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "#f8f9ff", borderRadius: 8 }}>
          <Avatar name={`${admin.emri || ""} ${admin.mbiemri || ""}`} size={26} />
          <div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>Academy Admin</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{admin.emri} {admin.mbiemri}</div>
          </div>
        </div>
      )}
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "flex-end", color: "#6366f1", fontSize: 13, fontWeight: 600, gap: 4 }}>
        View Groups <Icon path={I.chevronR} size={15} />
      </div>
    </div>
  );
}

// ── GroupCard (teacher view — shows join code) ─────────────────────────────────
function GroupCard({ group, isTeacher, onLeaderboard, onEdit, onDelete, onAddStudent }) {
  const count = group.studentCount ?? group.students?.length ?? 0;
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #eef0f6", padding: "20px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", transition: "box-shadow 0.2s, transform 0.15s" }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(99,102,241,0.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 6px rgba(0,0,0,0.04)"; e.currentTarget.style.transform = "none"; }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: "#f0f4ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366f1" }}>
            <Icon path={I.users} size={19} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{group.name}</div>
            <div style={{ marginTop: 3 }}><LevelBadge level={group.level} /></div>
          </div>
        </div>
        {isTeacher && (
          <div style={{ display: "flex", gap: 4 }}>
            <ActionBtn icon={I.edit} onClick={onEdit} />
            <ActionBtn icon={I.trash} onClick={onDelete} danger />
          </div>
        )}
      </div>

      {isTeacher && group.joinCode && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8f9ff", borderRadius: 8, padding: "8px 12px", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Icon path={I.key} size={13} />
            <span style={{ fontWeight: 800, letterSpacing: "0.15em", color: "#4f46e5", fontSize: 15 }}>{group.joinCode}</span>
          </div>
          <button onClick={() => { navigator.clipboard.writeText(group.joinCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: copied ? "#16a34a" : "#6366f1", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            <Icon path={copied ? I.check : I.copy} size={12} />
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748b", fontSize: 13, marginBottom: 14 }}>
        <Icon path={I.users} size={14} /> {count} student{count !== 1 ? "s" : ""}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onLeaderboard} style={{ flex: 1, background: "#f0f0ff", color: "#6366f1", border: "none", borderRadius: 9, padding: "8px 0", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "background 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.background = "#e0e0ff"}
          onMouseLeave={e => e.currentTarget.style.background = "#f0f0ff"}
        >
          <Icon path={I.trophy} size={14} /> Leaderboard
        </button>
        {isTeacher && (
          <button onClick={onAddStudent} style={{ background: "#f0fdf4", color: "#16a34a", border: "none", borderRadius: 9, padding: "8px 12px", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "#dcfce7"}
            onMouseLeave={e => e.currentTarget.style.background = "#f0fdf4"}
          >
            <Icon path={I.userPlus} size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ROOT EXPORT — routes by role automatically
// ══════════════════════════════════════════════════════════════
export default function Academy() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role === "user") return <StudentView currentUser={user} />;
  return <TeacherAdminView currentUser={user} />;
}