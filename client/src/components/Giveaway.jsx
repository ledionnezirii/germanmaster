"use client";

import { useState, useEffect, useCallback } from "react";
import { giveawayService, generateDicebearUrl } from "../services/api";

// ─── Countdown Hook ───────────────────────────────────────────────────────────
function useCountdown(endTime) {
  const calc = useCallback(() => {
    const diff = new Date(endTime) - new Date();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
      done: false,
    };
  }, [endTime]);

  const [time, setTime] = useState(calc);
  useEffect(() => {
    const interval = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(interval);
  }, [calc]);
  return time;
}

// ─── Countdown Display ────────────────────────────────────────────────────────
function CountdownTimer({ endTime, large = false }) {
  const { days, hours, minutes, seconds, done } = useCountdown(endTime);
  if (done) return <span style={{ color: "#ef4444", fontWeight: 600 }}>Dhurata Perfundoi</span>;
  
  const units = [
    { label: "Dite", value: days },
    { label: "Ore", value: hours },
    { label: "Min", value: minutes },
    { label: "Sek", value: seconds },
  ];

  return (
    <div style={{ display: "flex", gap: large ? "12px" : "8px" }}>
      {units.map(({ label, value }) => (
        <div
          key={label}
          style={{
            background: "linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%)",
            borderRadius: large ? "16px" : "12px",
            padding: large ? "16px 20px" : "8px 12px",
            minWidth: large ? "72px" : "48px",
            textAlign: "center",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          }}
        >
          <div
            style={{
              fontSize: large ? "28px" : "18px",
              fontWeight: 700,
              color: "#fff",
              fontFamily: "system-ui, -apple-system, sans-serif",
              letterSpacing: "-0.02em",
            }}
          >
            {String(value).padStart(2, "0")}
          </div>
          <div
            style={{
              fontSize: large ? "11px" : "9px",
              color: "rgba(255,255,255,0.5)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginTop: "4px",
            }}
          >
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── User Avatar ──────────────────────────────────────────────────────────────
function UserAvatar({ userId, avatarStyle, size = "md", name = "" }) {
  const sizes = { sm: 32, md: 48, lg: 64, xl: 80 };
  const s = sizes[size];
  const src = userId ? generateDicebearUrl(userId, avatarStyle || "adventurer") : null;
  
  return (
    <div
      style={{
        width: s,
        height: s,
        borderRadius: "50%",
        overflow: "hidden",
        background: "linear-gradient(135deg, #f0f4ff 0%, #e8ecf8 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        border: "3px solid #fff",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      }}
    >
      {src ? (
        <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span style={{ color: "#6366f1", fontWeight: 700, fontSize: s * 0.4 }}>
          {(name?.[0] || "?").toUpperCase()}
        </span>
      )}
    </div>
  );
}

// ─── Audit Log Modal (Admin) ──────────────────────────────────────────────────
function AuditLogModal({ giveawayId, onClose }) {
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    giveawayService.getAuditLog(giveawayId)
      .then(res => setLog(res.data || res))
      .catch(err => setError(err.response?.data?.message || "Deshtoi ngarkimi i regjistrit te auditimit"))
      .finally(() => setLoading(false));
  }, [giveawayId]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 15, 25, 0.7)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: "16px",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "24px",
          boxShadow: "0 25px 80px rgba(0,0,0,0.25)",
          width: "100%",
          maxWidth: "480px",
          padding: "28px",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1e1e2e" }}>Regjistri i Auditimit</h2>
          <button
            onClick={onClose}
            style={{
              background: "#f4f4f8",
              border: "none",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              cursor: "pointer",
              fontSize: "20px",
              color: "#64748b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {loading && <p style={{ textAlign: "center", color: "#94a3b8", padding: "40px 0" }}>Duke ngarkuar...</p>}
        {error && (
          <p style={{ color: "#ef4444", fontSize: "14px", background: "#fef2f2", padding: "12px 16px", borderRadius: "12px" }}>
            {error}
          </p>
        )}

        {log && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ background: "#f8fafc", borderRadius: "16px", padding: "20px" }}>
              <div style={{ display: "grid", gap: "8px", fontSize: "14px", color: "#64748b" }}>
                <p><span style={{ fontWeight: 600, color: "#1e1e2e" }}>Terhequr me:</span> {new Date(log.drawnAt).toLocaleString()}</p>
                <p><span style={{ fontWeight: 600, color: "#1e1e2e" }}>Metoda:</span> {log.method}</p>
                <p><span style={{ fontWeight: 600, color: "#1e1e2e" }}>Totali i biletave:</span> {log.totalPoolSize}</p>
                <p><span style={{ fontWeight: 600, color: "#1e1e2e" }}>Pjesemarresit:</span> {log.uniqueParticipants}</p>
                {log.note && <p style={{ color: "#f59e0b", fontWeight: 500, marginTop: "8px" }}>{log.note}</p>}
              </div>
            </div>

            {log.winners?.length > 0 && (
              <div>
                <p style={{ fontWeight: 600, color: "#1e1e2e", marginBottom: "12px" }}>Fituesit</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {log.winners.map((w, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)",
                        borderRadius: "12px",
                        padding: "12px 16px",
                      }}
                    >
                      <span style={{ fontWeight: 600, color: "#1e1e2e" }}>#{i + 1} — {w.userId}</span>
                      <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "#64748b" }}>
                        <span>{w.xp} XP</span>
                        <span>{w.tickets} bileta</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {log.winners?.length === 0 && (
              <p style={{ textAlign: "center", color: "#94a3b8", padding: "24px 0" }}>Nuk u zgjodhën fitues.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Create Giveaway Form (Admin) ─────────────────────────────────────────────
function CreateGiveawayForm({ onCreated, onClose }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    imageUrl: "",
    endTime: "",
    maxWinners: 1,
    maxParticipants: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (form.maxParticipants && parseInt(form.maxWinners) > parseInt(form.maxParticipants)) {
      setError("Numri i fituesve nuk mund te tejkaloje numrin maksimal te pjesemarresve.");
      setLoading(false);
      return;
    }

    try {
      await giveawayService.createGiveaway({
        ...form,
        maxParticipants: form.maxParticipants ? parseInt(form.maxParticipants) : null,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Deshtoi krijimi i dhurimit");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    border: "2px solid #e2e8f0",
    borderRadius: "12px",
    padding: "12px 16px",
    fontSize: "14px",
    outline: "none",
    transition: "all 0.2s",
    background: "#fff",
  };

  const labelStyle = {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: "#475569",
    marginBottom: "8px",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 15, 25, 0.7)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: "16px",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "24px",
          boxShadow: "0 25px 80px rgba(0,0,0,0.25)",
          width: "100%",
          maxWidth: "500px",
          padding: "32px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#1e1e2e" }}>Krijo Dhurate</h2>
          <button
            onClick={onClose}
            style={{
              background: "#f4f4f8",
              border: "none",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              cursor: "pointer",
              fontSize: "24px",
              color: "#64748b",
            }}
          >
            ×
          </button>
        </div>
        
        {error && (
          <p style={{ color: "#ef4444", fontSize: "14px", background: "#fef2f2", padding: "12px 16px", borderRadius: "12px", marginBottom: "16px" }}>
            {error}
          </p>
        )}
        
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={labelStyle}>Titulli</label>
            <input
              style={inputStyle}
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Shkruaj titullin e dhurimit"
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Pershkrimi</label>
            <textarea
              style={{ ...inputStyle, resize: "vertical", minHeight: "100px" }}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Pershkruaj dhuraten..."
              required
            />
          </div>
          <div>
            <label style={labelStyle}>URL e Fotos <span style={{ fontWeight: 400, color: "#94a3b8" }}>(opsionale)</span></label>
            <input
              style={inputStyle}
              value={form.imageUrl}
              onChange={e => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div>
            <label style={labelStyle}>Data dhe Ora e Perfundimit</label>
            <input
              type="datetime-local"
              style={inputStyle}
              value={form.endTime}
              onChange={e => setForm({ ...form, endTime: e.target.value })}
              required
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Fitues Maksimal</label>
              <input
                type="number"
                min={1}
                style={inputStyle}
                value={form.maxWinners}
                onChange={e => setForm({ ...form, maxWinners: parseInt(e.target.value) })}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Pjesemarres Maksimal <span style={{ fontWeight: 400, color: "#94a3b8", fontSize: "11px" }}>(bosh = pa limit)</span></label>
              <input
                type="number"
                min={1}
                style={inputStyle}
                placeholder="∞"
                value={form.maxParticipants}
                onChange={e => setForm({ ...form, maxParticipants: e.target.value })}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: loading ? "#c7d2fe" : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              color: "#fff",
              fontWeight: 600,
              padding: "14px",
              borderRadius: "14px",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "15px",
              marginTop: "8px",
              boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
              transition: "all 0.2s",
            }}
          >
            {loading ? "Duke krijuar..." : "Krijo Dhurate"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Full Page Giveaway Detail ────────────────────────────────────────────────
function GiveawayDetailPage({ giveaway, currentUser, onBack, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [detail, setDetail] = useState(giveaway);
  const [showAudit, setShowAudit] = useState(false);

  const isEntered = detail.participants?.some(p => p.email === currentUser?.email);
  const isAdmin = currentUser?.role === "admin";
  const isEnded = detail.status === "ended" || new Date(detail.endTime) <= new Date();
  const isFull = detail.maxParticipants != null && detail.participants?.length >= detail.maxParticipants;

  const enter = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await giveawayService.enterGiveaway(detail._id);
      setDetail(res.data || res);
      setMessage("Jeni regjistruar ne dhurate!");
      onRefresh();
    } catch (err) {
      setMessage(err.response?.data?.message || "Gabim gjate regjistrimit ne dhurate");
    } finally {
      setLoading(false);
    }
  };

  const pickWinners = async () => {
    setLoading(true);
    try {
      const res = await giveawayService.pickWinners(detail._id);
      setDetail(res.data || res);
      onRefresh();
    } catch (err) {
      setMessage(err.response?.data?.message || "Gabim gjate zgjedhjes se fituesve");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Hero Section */}
      <div style={{ position: "relative" }}>
        {detail.imageUrl ? (
          <div style={{ position: "relative", height: "320px" }}>
            <img src={detail.imageUrl} alt={detail.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(15,15,25,0.9) 0%, transparent 60%)" }} />
          </div>
        ) : (
          <div style={{ height: "280px", background: "linear-gradient(135deg, #1e1e2e 0%, #2d2d44 50%, #4c1d95 100%)" }} />
        )}
        
        <button
          onClick={onBack}
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            background: "rgba(255,255,255,0.95)",
            border: "none",
            borderRadius: "50px",
            padding: "10px 20px",
            fontSize: "14px",
            fontWeight: 600,
            color: "#1e1e2e",
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Kthehu
        </button>

        <span
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: isEnded ? "rgba(255,255,255,0.9)" : "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
            color: isEnded ? "#64748b" : "#fff",
            fontSize: "12px",
            fontWeight: 700,
            padding: "8px 16px",
            borderRadius: "50px",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          }}
        >
          {isEnded ? "Perfundoi" : "Aktive"}
        </span>

        <div style={{ position: "absolute", bottom: "24px", left: "24px", right: "24px" }}>
          <h1
            style={{
              color: "#fff",
              fontSize: "clamp(24px, 5vw, 36px)",
              fontWeight: 800,
              textShadow: "0 4px 20px rgba(0,0,0,0.4)",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {detail.title}
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 20px" }}>
        {/* Info Card */}
        <div
          style={{
            background: "#fff",
            borderRadius: "24px",
            padding: "28px",
            boxShadow: "0 4px 30px rgba(0,0,0,0.06)",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: "32px", alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: "250px" }}>
              <p style={{ color: "#475569", lineHeight: 1.7, fontSize: "15px", margin: 0 }}>{detail.description}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f1f5f9", padding: "8px 16px", borderRadius: "50px" }}>
                  <span style={{ fontSize: "16px" }}>👥</span>
                  <span style={{ fontSize: "14px", color: "#1e1e2e", fontWeight: 600 }}>
                    {detail.participants?.length || 0}
                    {detail.maxParticipants != null && <span style={{ color: "#94a3b8" }}> / {detail.maxParticipants}</span>}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f1f5f9", padding: "8px 16px", borderRadius: "50px" }}>
                  <span style={{ fontSize: "16px" }}>🏆</span>
                  <span style={{ fontSize: "14px", color: "#1e1e2e", fontWeight: 600 }}>
                    {detail.maxWinners} fitues
                  </span>
                </div>
                {isFull && !isEnded && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#fef2f2", padding: "8px 16px", borderRadius: "50px" }}>
                    <span style={{ fontSize: "14px", color: "#ef4444", fontWeight: 600 }}>Plot</span>
                  </div>
                )}
              </div>
            </div>
            {!isEnded && (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "12px" }}>
                  Koha e Mbetur
                </p>
                <CountdownTimer endTime={detail.endTime} large />
              </div>
            )}
          </div>
        </div>

        {/* Enter Button */}
        {!isEnded && !isAdmin && (
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            {message && (
              <p style={{ marginBottom: "16px", color: "#6366f1", fontWeight: 600, fontSize: "15px" }}>{message}</p>
            )}
            <button
              onClick={enter}
              disabled={loading || isEntered || isFull}
              style={{
                background: isEntered
                  ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                  : isFull
                  ? "#e2e8f0"
                  : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                color: isFull && !isEntered ? "#94a3b8" : "#fff",
                border: "none",
                borderRadius: "20px",
                padding: "18px 48px",
                fontSize: "17px",
                fontWeight: 700,
                cursor: loading || isEntered || isFull ? "default" : "pointer",
                boxShadow: isEntered
                  ? "0 8px 30px rgba(34,197,94,0.35)"
                  : isFull
                  ? "none"
                  : "0 8px 30px rgba(99,102,241,0.35)",
                transition: "all 0.3s",
                transform: loading || isEntered || isFull ? "none" : "translateY(0)",
              }}
            >
              {isEntered ? "Je Regjistruar!" : isFull ? "Plot" : loading ? "Duke u regjistruar..." : "Regjistrohu ne Dhurate"}
            </button>
            {isEntered && (
              <p style={{ marginTop: "12px", fontSize: "14px", color: "#94a3b8" }}>
                Fat te mire! Fituesit do te shpallen kur te perfundoje dhurata.
              </p>
            )}
          </div>
        )}

        {/* Admin Actions */}
        {isAdmin && !isEnded && (
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <button
              onClick={pickWinners}
              disabled={loading}
              style={{
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                color: "#fff",
                border: "none",
                borderRadius: "16px",
                padding: "16px 40px",
                fontSize: "16px",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 8px 30px rgba(245,158,11,0.35)",
              }}
            >
              Zgjidh Fituesit Tani
            </button>
          </div>
        )}

        {/* Audit Log Button */}
        {isAdmin && isEnded && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "24px" }}>
            <button
              onClick={() => setShowAudit(true)}
              style={{
                background: "#fff",
                border: "2px solid #e2e8f0",
                borderRadius: "12px",
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: 600,
                color: "#64748b",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              Shiko Regjistrin e Auditimit
            </button>
          </div>
        )}

        {/* Winners Section */}
        {isEnded && (
          <div style={{ marginBottom: "40px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1e1e2e", marginBottom: "20px" }}>
              {detail.winners?.length > 0 ? "Fituesit" : "Duke zgjedhur fituesit..."}
            </h2>
            {detail.winners?.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
                {detail.winners.map((w, i) => {
                  const medals = ["🥇", "🥈", "🥉"];
                  const isYou = w.email === currentUser?.email;
                  const tickets = Math.min(1 + Math.floor((w.xp || 0) / 10), 10);
                  return (
                    <div
                      key={i}
                      style={{
                        background: isYou
                          ? "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)"
                          : "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
                        borderRadius: "20px",
                        padding: "24px",
                        textAlign: "center",
                        border: isYou ? "2px solid #8b5cf6" : "2px solid #fcd34d",
                        boxShadow: isYou ? "0 8px 30px rgba(139,92,246,0.2)" : "0 8px 30px rgba(252,211,77,0.2)",
                      }}
                    >
                      <span style={{ fontSize: "32px", display: "block", marginBottom: "12px" }}>{medals[i] || "🏅"}</span>
                      <UserAvatar userId={w.userId} avatarStyle={w.avatarStyle} size="xl" name={w.emri} />
                      <p style={{ marginTop: "16px", fontWeight: 700, color: "#1e1e2e", fontSize: "15px" }}>
                        {w.emri} {w.mbiemri}
                      </p>
                      {w.xp > 0 && (
                        <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "12px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "11px", background: "rgba(255,255,255,0.8)", padding: "4px 10px", borderRadius: "20px", fontWeight: 600, color: "#d97706" }}>
                            {w.xp} XP
                          </span>
                          <span style={{ fontSize: "11px", background: "rgba(255,255,255,0.8)", padding: "4px 10px", borderRadius: "20px", fontWeight: 600, color: "#7c3aed" }}>
                            {tickets} bileta
                          </span>
                        </div>
                      )}
                      {isYou && (
                        <span
                          style={{
                            display: "inline-block",
                            marginTop: "12px",
                            fontSize: "12px",
                            background: "#8b5cf6",
                            color: "#fff",
                            padding: "6px 14px",
                            borderRadius: "20px",
                            fontWeight: 700,
                          }}
                        >
                          Je Ti!
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px 24px",
                  background: "#fff",
                  borderRadius: "20px",
                  color: "#94a3b8",
                }}
              >
                {detail.participants?.length === 0 ? "Askush nuk u regjistrua ne kete dhurate." : "Ende nuk jane zgjedhur fitues."}
              </div>
            )}
          </div>
        )}

        {/* Participants Section */}
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1e1e2e", marginBottom: "20px" }}>
Pjesemarresit
            <span style={{ marginLeft: "8px", fontWeight: 400, color: "#94a3b8", fontSize: "16px" }}>
              ({detail.participants?.length || 0}{detail.maxParticipants != null && ` / ${detail.maxParticipants}`})
            </span>
          </h2>
          {!detail.participants?.length ? (
            <div
              style={{
                textAlign: "center",
                padding: "64px 24px",
                background: "#fff",
                borderRadius: "20px",
                color: "#94a3b8",
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>👀</div>
              <p>Ende nuk ka pjesemarres. Behu i pari qe regjistrohet!</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px" }}>
              {detail.participants.map((p, i) => {
                const isCurrentUser = p.email === currentUser?.email;
                return (
                  <div
                    key={i}
                    style={{
                      background: "#fff",
                      borderRadius: "20px",
                      padding: "20px",
                      textAlign: "center",
                      border: isCurrentUser ? "2px solid #8b5cf6" : "2px solid transparent",
                      boxShadow: isCurrentUser ? "0 8px 30px rgba(139,92,246,0.15)" : "0 4px 20px rgba(0,0,0,0.04)",
                      transition: "all 0.2s",
                    }}
                  >
                    <UserAvatar userId={p.userId} avatarStyle={p.avatarStyle} size="lg" name={p.emri} />
                    <p style={{ marginTop: "12px", fontWeight: 600, color: "#1e1e2e", fontSize: "14px" }}>
                      {p.emri} {p.mbiemri}
                    </p>
                 
                    {isCurrentUser && (
                      <span
                        style={{
                          display: "inline-block",
                          marginTop: "10px",
                          fontSize: "11px",
                          background: "#ede9fe",
                          color: "#7c3aed",
                          padding: "4px 12px",
                          borderRadius: "20px",
                          fontWeight: 600,
                        }}
                      >
                        Ti
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showAudit && <AuditLogModal giveawayId={detail._id} onClose={() => setShowAudit(false)} />}
    </div>
  );
}

// ─── Giveaway Card ─────────────────────────────────────────────────────────────
function GiveawayCard({ giveaway, onClick }) {
  const isEnded = giveaway.status === "ended" || new Date(giveaway.endTime) <= new Date();
  const isFull = giveaway.maxParticipants != null && giveaway.participants?.length >= giveaway.maxParticipants;

  return (
    <div
      onClick={() => onClick(giveaway)}
      style={{
        background: "#fff",
        borderRadius: "24px",
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        border: "1px solid rgba(0,0,0,0.04)",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-8px)";
        e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)";
      }}
    >
      {giveaway.imageUrl ? (
        <img src={giveaway.imageUrl} alt={giveaway.title} style={{ width: "100%", height: "160px", objectFit: "cover" }} />
      ) : (
        <div
          style={{
            width: "100%",
            height: "120px",
            background: "linear-gradient(135deg, #1e1e2e 0%, #4c1d95 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "48px",
          }}
        >
          🎁
        </div>
      )}
      <div style={{ padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "8px" }}>
          <h3 style={{ fontWeight: 700, color: "#1e1e2e", fontSize: "16px", margin: 0, lineHeight: 1.3 }}>{giveaway.title}</h3>
          <div style={{ display: "flex", gap: "6px", flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {isFull && !isEnded && (
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: "20px",
                  background: "#fef2f2",
                  color: "#ef4444",
                }}
              >
                Plot
              </span>
            )}
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: "20px",
                background: isEnded ? "#f1f5f9" : "#dcfce7",
                color: isEnded ? "#64748b" : "#16a34a",
              }}
            >
              {isEnded ? "Perfundoi" : "Aktive"}
            </span>
          </div>
        </div>
        <p
          style={{
            color: "#64748b",
            fontSize: "13px",
            margin: "0 0 16px 0",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            lineHeight: 1.5,
          }}
        >
          {giveaway.description}
        </p>
        {!isEnded && (
          <div style={{ marginBottom: "16px" }}>
            <CountdownTimer endTime={giveaway.endTime} />
          </div>
        )}
        {giveaway.participants?.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <div style={{ display: "flex" }}>
              {giveaway.participants.slice(0, 5).map((p, i) => (
                <div
                  key={i}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    border: "2px solid #fff",
                    overflow: "hidden",
                    background: "#f0f4ff",
                    marginLeft: i > 0 ? "-8px" : "0",
                    position: "relative",
                    zIndex: 5 - i,
                  }}
                >
                  <img
                    src={generateDicebearUrl(p.userId, p.avatarStyle || "adventurer")}
                    alt={p.emri}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              ))}
            </div>
            {giveaway.participants.length > 5 && (
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>+{giveaway.participants.length - 5}</span>
            )}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "13px", color: "#94a3b8" }}>
          <span>
            <span style={{ marginRight: "4px" }}>👥</span>
            <span style={{ color: "#1e1e2e", fontWeight: 600 }}>{giveaway.participants?.length || 0}</span>
            {giveaway.maxParticipants != null && <span> / {giveaway.maxParticipants}</span>}
          </span>
          <span>
            <span style={{ marginRight: "4px" }}>🏆</span>
            <span style={{ color: "#1e1e2e", fontWeight: 600 }}>{giveaway.maxWinners}</span> fitues
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Giveaway Page ───────────────────────────────────────────────────────
export default function Giveaway({ currentUser }) {
  const [giveaways, setGiveaways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGiveaway, setSelectedGiveaway] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState("all");

  const isAdmin = currentUser?.role === "admin";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await giveawayService.getAllGiveaways();
      setGiveaways(res.data || res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (selectedGiveaway) {
    return (
      <GiveawayDetailPage
        giveaway={selectedGiveaway}
        currentUser={currentUser}
        onBack={() => setSelectedGiveaway(null)}
        onRefresh={() => {
          load();
          giveawayService.getGiveawayById(selectedGiveaway._id)
            .then(res => setSelectedGiveaway(res.data || res))
            .catch(() => {});
        }}
      />
    );
  }

  const filtered = giveaways.filter((g) => {
    const ended = g.status === "ended" || new Date(g.endTime) <= new Date();
    if (filter === "active") return !ended;
    if (filter === "ended") return ended;
    return true;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Hero Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e1e2e 0%, #2d2d44 50%, #4c1d95 100%)",
          padding: "64px 20px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative elements */}
        <div
          style={{
            position: "absolute",
            top: "-50%",
            left: "-10%",
            width: "300px",
            height: "300px",
            background: "radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(40px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-30%",
            right: "-5%",
            width: "250px",
            height: "250px",
            background: "radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(40px)",
          }}
        />
        
        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              width: "80px",
              height: "80px",
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              borderRadius: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: "36px",
              boxShadow: "0 8px 30px rgba(99,102,241,0.4)",
            }}
          >
            🎁
          </div>
          <h1
            style={{
              color: "#fff",
              fontSize: "clamp(28px, 6vw, 42px)",
              fontWeight: 800,
              margin: "0 0 12px 0",
              letterSpacing: "-0.02em",
            }}
          >
            Dhurata
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", margin: 0, maxWidth: "400px", marginLeft: "auto", marginRight: "auto" }}>
            Regjistrohu per mundesine te fitosh cmime te jashtezakonshme
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 20px" }}>
        {/* Filter Bar */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "32px" }}>
          <div style={{ display: "flex", gap: "8px", background: "#fff", padding: "6px", borderRadius: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            {[
              { key: "all", label: "Te gjitha" },
              { key: "active", label: "Aktive" },
              { key: "ended", label: "Perfunduara" }
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  padding: "10px 20px",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: filter === f.key ? "linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%)" : "transparent",
                  color: filter === f.key ? "#fff" : "#64748b",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowCreate(true)}
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                color: "#fff",
                border: "none",
                borderRadius: "14px",
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "18px" }}>+</span>
              Krijo Dhurate
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "#94a3b8" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                border: "4px solid #e2e8f0",
                borderTopColor: "#6366f1",
                borderRadius: "50%",
                margin: "0 auto 20px",
                animation: "spin 1s linear infinite",
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p>Duke ngarkuar dhuratat...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "#94a3b8" }}>
            <div style={{ fontSize: "64px", marginBottom: "20px" }}>🎁</div>
            <p style={{ fontSize: "18px", fontWeight: 600, color: "#475569" }}>Nuk u gjeten dhurata</p>
            <p style={{ fontSize: "14px", marginTop: "8px" }}>Kontrollo me vone per mundesi te reja!</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
            {filtered.map((g) => (
              <GiveawayCard key={g._id} giveaway={g} onClick={setSelectedGiveaway} />
            ))}
          </div>
        )}
      </div>

      {showCreate && <CreateGiveawayForm onCreated={load} onClose={() => setShowCreate(false)} />}
    </div>
  );
}
