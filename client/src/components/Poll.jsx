import React, { useState, useEffect } from "react";
import { pollService } from "../services/api";

function getVisitorId() {
  let id = localStorage.getItem("poll_visitor_id");
  if (!id) {
    id = "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("poll_visitor_id", id);
  }
  return id;
}

export default function Poll() {
  const [poll, setPoll] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedIndex, setVotedIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [animateResults, setAnimateResults] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const visitorId = getVisitorId();

  useEffect(() => {
    async function fetchPoll() {
      try {
        const res = await pollService.getActivePoll(visitorId);
        const data = res.data;

        const stored = localStorage.getItem("poll_dismissed");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed && parsed.pollId === data._id && parsed.dismissed) {
              setDismissed(true);
              setLoading(false);
              return;
            }
          } catch {
            localStorage.removeItem("poll_dismissed");
          }
        }

        setPoll(data);

        if (data.hasVoted) {
          setHasVoted(true);
          setVotedIndex(data.votedOptionIndex);
          setDismissed(true);
          localStorage.setItem(
            "poll_dismissed",
            JSON.stringify({ pollId: data._id, dismissed: true })
          );
          setLoading(false);
          return;
        }
      } catch (err) {
        if (err.response && err.response.status !== 404) {
          console.error("Failed to load poll:", err);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchPoll();
  }, [visitorId]);

  async function handleVote(optionIndex) {
    if (hasVoted || voting) return;
    setVoting(true);

    try {
      const res = await pollService.vote(poll._id, optionIndex, visitorId);
      const data = res.data;

      setPoll((prev) => ({
        ...prev,
        options: data.options,
        totalVotes: data.totalVotes,
      }));
      setVotedIndex(optionIndex);
      setHasVoted(true);

      setTimeout(() => setAnimateResults(true), 100);
    } catch (err) {
      if (err.response && err.response.status === 409) {
        setDismissed(true);
        localStorage.setItem(
          "poll_dismissed",
          JSON.stringify({ pollId: poll._id, dismissed: true })
        );
      } else {
        console.error("Vote failed:", err);
      }
    } finally {
      setVoting(false);
    }
  }

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem(
      "poll_dismissed",
      JSON.stringify({ pollId: poll._id, dismissed: true })
    );
  }

  if (dismissed || loading || !poll) return null;

  const colors = {
    bg: "#0f1117",
    card: "#181b23",
    cardBorder: "#2a2d38",
    accent: "#6c5ce7",
    accentHover: "#7e6ff0",
    accentGlow: "rgba(108, 92, 231, 0.25)",
    text: "#f1f1f4",
    textMuted: "#9ca3af",
    barBg: "#23262f",
    success: "#00cec9",
    successGlow: "rgba(0, 206, 201, 0.2)",
  };

  const styles = {
    overlay: {
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0, 0, 0, 0.65)",
      backdropFilter: "blur(6px)",
      animation: "pollFadeIn 0.35s ease",
    },
    card: {
      position: "relative",
      width: "100%",
      maxWidth: 460,
      margin: "0 16px",
      backgroundColor: colors.card,
      border: `1px solid ${colors.cardBorder}`,
      borderRadius: 16,
      padding: "32px 28px 24px",
      boxShadow: `0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px ${colors.cardBorder}`,
      animation: "pollSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      color: colors.text,
    },
    badge: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 12px",
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: colors.accent,
      backgroundColor: colors.accentGlow,
      borderRadius: 20,
      marginBottom: 16,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: "50%",
      backgroundColor: colors.accent,
      animation: "pollPulse 1.5s ease infinite",
    },
    question: {
      fontSize: 20,
      fontWeight: 700,
      lineHeight: 1.35,
      marginBottom: 6,
      color: colors.text,
    },
    description: {
      fontSize: 14,
      lineHeight: 1.55,
      color: colors.textMuted,
      marginBottom: 24,
    },
    optionBtn: (index) => ({
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "14px 16px",
      marginBottom: 10,
      backgroundColor: hoveredIndex === index ? "#1f222c" : "transparent",
      border: `1px solid ${hoveredIndex === index ? colors.accent : colors.cardBorder}`,
      borderRadius: 10,
      cursor: voting ? "not-allowed" : "pointer",
      transition: "all 0.2s ease",
      color: colors.text,
      fontSize: 15,
      fontWeight: 500,
      textAlign: "left",
      fontFamily: "inherit",
      outline: "none",
      opacity: voting ? 0.6 : 1,
    }),
    optionCircle: (index) => ({
      width: 20,
      height: 20,
      borderRadius: "50%",
      border: `2px solid ${hoveredIndex === index ? colors.accent : colors.cardBorder}`,
      flexShrink: 0,
      transition: "border-color 0.2s ease",
    }),
    resultRow: { marginBottom: 14 },
    resultHeader: (isVoted) => ({
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
      fontSize: 14,
      fontWeight: isVoted ? 600 : 400,
      color: isVoted ? colors.accent : colors.text,
    }),
    barOuter: {
      width: "100%",
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.barBg,
      overflow: "hidden",
    },
    barInner: (pct, isVoted) => ({
      height: "100%",
      borderRadius: 4,
      width: animateResults ? `${pct}%` : "0%",
      backgroundColor: isVoted ? colors.accent : colors.textMuted,
      transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
    }),
    votedBadge: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      fontSize: 11,
      color: colors.success,
      fontWeight: 600,
    },
    totalVotes: {
      textAlign: "center",
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 20,
      paddingTop: 16,
      borderTop: `1px solid ${colors.cardBorder}`,
    },
    dismissBtn: {
      display: "block",
      width: "100%",
      padding: "12px 0",
      marginTop: 14,
      fontSize: 14,
      fontWeight: 600,
      color: colors.text,
      backgroundColor: colors.accent,
      border: "none",
      borderRadius: 10,
      cursor: "pointer",
      transition: "background-color 0.2s ease",
      fontFamily: "inherit",
      outline: "none",
    },
    thanksMsg: {
      textAlign: "center",
      marginTop: 8,
      fontSize: 13,
      color: colors.success,
      fontWeight: 500,
      animation: "pollFadeIn 0.5s ease",
    },
  };

  const keyframesId = "poll-keyframes";
  if (typeof document !== "undefined" && !document.getElementById(keyframesId)) {
    const styleTag = document.createElement("style");
    styleTag.id = keyframesId;
    styleTag.textContent = `
      @keyframes pollFadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes pollSlideUp { from { opacity: 0; transform: translateY(24px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
      @keyframes pollPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    `;
    document.head.appendChild(styleTag);
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.badge}>
          <span style={styles.dot} />
          Sondazh Live
        </div>

        <h2 style={styles.question}>{poll.question}</h2>
        {poll.description && <p style={styles.description}>{poll.description}</p>}

        {!hasVoted && (
          <div>
            {poll.options.map((opt, i) => (
              <button
                key={opt._id || i}
                style={styles.optionBtn(i)}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => handleVote(i)}
                disabled={voting}
                aria-label={`Votoni për ${opt.text}`}
              >
                <span style={styles.optionCircle(i)} />
                {opt.text}
              </button>
            ))}
          
          </div>
        )}

        {hasVoted && (
          <div>
            {poll.options.map((opt, i) => {
              const isVoted = i === votedIndex;
              return (
                <div key={opt._id || i} style={styles.resultRow}>
                  <div style={styles.resultHeader(isVoted)}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {opt.text}
                      {isVoted && (
                        <span style={styles.votedBadge}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Ju
                        </span>
                      )}
                    </span>
                    <span>{opt.percentage}%</span>
                  </div>
                  <div style={styles.barOuter}>
                    <div style={styles.barInner(opt.percentage, isVoted)} />
                  </div>
                </div>
              );
            })}
          
            <p style={styles.thanksMsg}>Faleminderit për votën tuaj!</p>
            <button
              style={styles.dismissBtn}
              onClick={handleDismiss}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.accentHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.accent)}
            >
              Vazhdo në faqe
            </button>
          </div>
        )}
      </div>
    </div>
  );
}