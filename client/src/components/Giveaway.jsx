"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { giveawayService, generateDicebearUrl } from "../services/api";
import { useAuth } from "../context/AuthContext";

// ─── Image compressor (canvas) — keeps base64 small ──────────────────────────
function compressImage(file, maxWidth = 900, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject("Not an image");
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ─── Rotating Text Hook ───────────────────────────────────────────────────────
function useRotatingText(items, interval = 2800) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % items.length);
        setVisible(true);
      }, 300);
    }, interval);
    return () => clearInterval(timer);
  }, [items, interval]);

  return { text: items[index], visible };
}

// ─── Countdown Hook ───────────────────────────────────────────────────────────
function useCountdown(endTime) {
  const calc = useCallback(() => {
    const diff = new Date(endTime) - new Date();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
    return {
      days:    Math.floor(diff / 86400000),
      hours:   Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000)  / 60000),
      seconds: Math.floor((diff % 60000)    / 1000),
      done: false,
    };
  }, [endTime]);

  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);
  return time;
}

// ─── Countdown Display ────────────────────────────────────────────────────────
function CountdownTimer({ endTime, large = false }) {
  const { days, hours, minutes, seconds, done } = useCountdown(endTime);
  if (done) return <span className="text-red-500 font-semibold text-sm">Dhurata Perfundoi</span>;

  const units = [
    { label: "Dite", value: days },
    { label: "Ore",  value: hours },
    { label: "Min",  value: minutes },
    { label: "Sek",  value: seconds },
  ];

  return (
    <div className={`flex ${large ? "gap-3" : "gap-1.5"}`}>
      {units.map(({ label, value }) => (
        <div key={label} className={`bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl text-center shadow-md ${large ? "px-4 py-3 min-w-[60px]" : "px-2.5 py-1.5 min-w-[40px]"}`}>
          <div className={`font-bold text-white tracking-tight ${large ? "text-2xl" : "text-base"}`}>
            {String(value).padStart(2, "0")}
          </div>
          <div className={`text-white/40 uppercase tracking-widest mt-0.5 ${large ? "text-[9px]" : "text-[8px]"}`}>
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── User Avatar ──────────────────────────────────────────────────────────────
function UserAvatar({ userId, avatarStyle, size = "md", name = "" }) {
  const sizeMap = { sm: "w-7 h-7", md: "w-10 h-10", lg: "w-14 h-14", xl: "w-18 h-18" };
  const fontMap = { sm: "text-xs", md: "text-sm", lg: "text-base", xl: "text-lg" };
  const src = userId ? generateDicebearUrl(userId, avatarStyle || "adventurer") : null;

  return (
    <div className={`${sizeMap[size]} rounded-full overflow-hidden bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center flex-shrink-0 border-2 border-white shadow-sm`}>
      {src
        ? <img src={src} alt={name} className="w-full h-full object-cover" />
        : <span className={`text-indigo-500 font-bold ${fontMap[size]}`}>{(name?.[0] || "?").toUpperCase()}</span>
      }
    </div>
  );
}

// ─── Participant Avatar (Hellcase grid style) ─────────────────────────────────
function ParticipantAvatar({ participant, isCurrentUser, index }) {
  const [hovered, setHovered] = useState(false);
  const src = participant.userId
    ? generateDicebearUrl(participant.userId, participant.avatarStyle || "adventurer")
    : null;

  return (
    <div
      className="relative group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ animationDelay: `${(index % 20) * 30}ms` }}
    >
      <div className={`relative rounded-full transition-all duration-300 ${
        isCurrentUser
          ? "p-[2px] bg-gradient-to-br from-violet-500 via-indigo-500 to-purple-500 shadow-lg shadow-violet-400/50"
          : "p-[2px] bg-transparent hover:bg-gradient-to-br hover:from-indigo-400 hover:to-violet-400"
      }`}>
        <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center ${
          isCurrentUser ? "ring-0" : ""
        }`}>
          {src ? (
            <img src={src} alt={participant.emri} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white font-bold text-lg">
              {(participant.emri?.[0] || "?").toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {isCurrentUser && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] bg-violet-500 text-white px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap shadow-md">
          Ti
        </span>
      )}

      {hovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 pointer-events-none">
          <div className="bg-slate-900/95 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap border border-slate-700/50">
            {participant.emri} {participant.mbiemri}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/95" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Participants Grid ────────────────────────────────────────────────────────
function ParticipantsGrid({ participants, currentUser }) {
  const [showAll, setShowAll] = useState(false);
  const INITIAL_COUNT = 40;
  const displayed = showAll ? participants : participants.slice(0, INITIAL_COUNT);

  if (!participants?.length) {
    return (
      <div className="text-center py-16 bg-white/50 rounded-2xl border border-slate-100">
        <div className="text-4xl mb-3">🎯</div>
        <p className="font-semibold text-slate-600 text-sm">Ende nuk ka pjesemarres.</p>
        <p className="text-slate-400 text-xs mt-1">Behu i pari qe regjistrohet!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-slate-800">Pjesemarresit</span>
          <span className="text-sm text-slate-400 font-semibold">({participants.length})</span>
        </div>
        <div className="ml-auto flex -space-x-2">
          {participants.slice(0, 4).map((p, i) => (
            <div key={i} className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-indigo-100" style={{ zIndex: 4 - i }}>
              {p.userId && (
                <img src={generateDicebearUrl(p.userId, p.avatarStyle || "adventurer")} alt="" className="w-full h-full object-cover" />
              )}
            </div>
          ))}
          {participants.length > 4 && (
            <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-500" style={{ zIndex: 0 }}>
              +{participants.length - 4}
            </div>
          )}
        </div>
      </div>

      <div className="p-5">
        <div className="flex flex-wrap gap-3">
          {displayed.map((p, i) => {
            const isCurrentUser = p.userId?.toString() === currentUser?._id?.toString();
            return (
              <ParticipantAvatar key={i} participant={p} isCurrentUser={isCurrentUser} index={i} />
            );
          })}
        </div>

        {!showAll && participants.length > INITIAL_COUNT && (
          <button onClick={() => setShowAll(true)} className="mt-5 w-full py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all">
            Shiko te gjithë {participants.length - INITIAL_COUNT} pjesemarres te tjerë →
          </button>
        )}
        {showAll && participants.length > INITIAL_COUNT && (
          <button onClick={() => setShowAll(false)} className="mt-5 w-full py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-400 hover:bg-slate-50 transition-all">
            Trego me pak ↑
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Audit Log Modal ──────────────────────────────────────────────────────────
function AuditLogModal({ giveawayId, onClose }) {
  const [log, setLog]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    giveawayService.getAuditLog(giveawayId)
      .then(res => setLog(res.data || res))
      .catch(err => setError(err.response?.data?.message || "Deshtoi ngarkimi"))
      .finally(() => setLoading(false));
  }, [giveawayId]);

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">Regjistri i Auditimit</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors text-lg">×</button>
        </div>

        {loading && <p className="text-center text-slate-400 py-8 text-sm">Duke ngarkuar...</p>}
        {error   && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}

        {log && (
          <div className="flex flex-col gap-3">
            <div className="bg-slate-50 rounded-xl p-4 grid gap-1.5 text-sm text-slate-500">
              <p><span className="font-semibold text-slate-800">Terhequr me:</span> {new Date(log.drawnAt).toLocaleString()}</p>
              <p><span className="font-semibold text-slate-800">Metoda:</span> {log.method}</p>
              <p><span className="font-semibold text-slate-800">Total pjesemarres:</span> {log.totalPoolSize}</p>
              <p><span className="font-semibold text-slate-800">Pjesemarres unik:</span> {log.uniqueParticipants}</p>
              {log.ineligibleParticipants !== undefined && (
                <p><span className="font-semibold text-slate-800">Jo te kualifikuar (plan):</span> {log.ineligibleParticipants}</p>
              )}
              {log.cappedPlanParticipants !== undefined && (
                <p><span className="font-semibold text-slate-800">Plan mujor (kuote 20%):</span> {log.cappedPlanParticipants} hyre / {log.cappedPlanWinners} fituan</p>
              )}
              {log.eligibleParticipants !== undefined && (
                <p><span className="font-semibold text-slate-800">Pjesemarres te kualifikuar:</span> {log.eligibleParticipants}</p>
              )}
              {log.monthlyQuotaApplied !== undefined && (
                <p><span className="font-semibold text-slate-800">Kuote mujore e aplikuar:</span> max {log.monthlyQuotaApplied} fitues mujor</p>
              )}
              {log.note && <p className="text-amber-500 font-medium mt-1">{log.note}</p>}
            </div>

            {log.winners?.length > 0 && (
              <div>
                <p className="font-semibold text-slate-800 mb-2 text-sm">Fituesit</p>
                <div className="flex flex-col gap-1.5">
                  {log.winners.map((w, i) => (
                    <div key={i} className="flex items-center justify-between bg-amber-50 rounded-xl px-4 py-2.5">
                      <span className="font-semibold text-slate-800 text-sm">#{i + 1} — {w.userId}</span>
                      <span className="text-xs text-slate-400">{new Date(w.wonAt).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {log.winners?.length === 0 && (
              <p className="text-center text-slate-400 py-5 text-sm">Nuk u zgjodhën fitues.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Image Picker ─────────────────────────────────────────────────────────────
function ImagePicker({ value, onChange }) {
  const [mode, setMode]           = useState(value?.startsWith("data:") ? "upload" : "url");
  const [preview, setPreview]     = useState(value || "");
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { setUploadErr("Fotoja duhet te jete me e vogel se 8MB."); return; }
    setUploadErr("");
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      setPreview(compressed);
      onChange(compressed);
    } catch { setUploadErr("Gabim gjate ngarkimit te fotos."); }
    finally { setUploading(false); }
  };

  const handleUrl = (e) => { setPreview(e.target.value); onChange(e.target.value); };
  const clearImage = () => { setPreview(""); onChange(""); if (fileRef.current) fileRef.current.value = ""; };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {[{ key: "url", label: "🔗 Link URL" }, { key: "upload", label: "📷 Ngarko Foto" }].map(t => (
          <button key={t.key} type="button" onClick={() => { setMode(t.key); clearImage(); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${mode === t.key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {mode === "url" ? (
        <input type="url" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all bg-white"
          placeholder="https://i.imgur.com/abc123.jpg" value={preview} onChange={handleUrl} />
      ) : (
        <div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          {!preview ? (
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-200 rounded-xl py-8 flex flex-col items-center gap-2 text-slate-400 hover:border-indigo-300 hover:text-indigo-400 transition-all">
              {uploading ? <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-500 rounded-full animate-spin" /> : (
                <>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <span className="text-xs font-semibold">Shtyp per te zgjedhur foto</span>
                  <span className="text-[11px]">Galerise ose kamera • max 8MB</span>
                </>
              )}
            </button>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-slate-200">
              <img src={preview} alt="Preview" className="w-full h-40 object-cover" />
              <button type="button" onClick={clearImage} className="absolute top-2 right-2 w-7 h-7 bg-slate-900/70 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-500/80 transition-colors">×</button>
              <button type="button" onClick={() => fileRef.current?.click()} className="absolute bottom-2 right-2 bg-white/90 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow hover:bg-white transition-colors">Ndrysho</button>
            </div>
          )}
          {uploadErr && <p className="text-red-500 text-xs mt-1">{uploadErr}</p>}
        </div>
      )}

      {mode === "url" && preview && (
        <div className="relative rounded-xl overflow-hidden border border-slate-200">
          <img src={preview} alt="Preview" className="w-full h-36 object-cover" onError={() => setPreview("")} />
          <button type="button" onClick={clearImage} className="absolute top-2 right-2 w-7 h-7 bg-slate-900/70 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-500/80 transition-colors">×</button>
        </div>
      )}
    </div>
  );
}

// ─── Create Giveaway Form ─────────────────────────────────────────────────────
function CreateGiveawayForm({ onCreated, onClose }) {
  const [form, setForm] = useState({ title: "", description: "", imageUrl: "", endTime: "", maxWinners: 1, maxParticipants: "", minXp: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

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
        minXp: form.minXp ? parseInt(form.minXp) : 0,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Deshtoi krijimi i dhurimit");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all bg-white";
  const labelCls = "block text-xs font-semibold text-slate-500 mb-1.5";

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900">Krijo Dhurate</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors text-xl flex items-center justify-center">×</button>
        </div>

        {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className={labelCls}>Titulli</label>
            <input className={inputCls} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Shkruaj titullin e dhurimit" required />
          </div>
          <div>
            <label className={labelCls}>Pershkrimi</label>
            <textarea className={`${inputCls} resize-y min-h-[90px]`} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Pershkruaj dhuraten..." required />
          </div>
          <div>
            <label className={labelCls}>Foto <span className="font-normal text-slate-400">(opsionale)</span></label>
            <ImagePicker value={form.imageUrl} onChange={val => setForm({ ...form, imageUrl: val })} />
          </div>
          <div>
            <label className={labelCls}>Data dhe Ora e Perfundimit</label>
            <input type="datetime-local" className={inputCls} value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Fitues Maksimal</label>
              <input type="number" min={1} className={inputCls} value={form.maxWinners} onChange={e => setForm({ ...form, maxWinners: parseInt(e.target.value) })} required />
            </div>
            <div>
              <label className={labelCls}>Pjesemarres Maks. <span className="font-normal text-slate-400 text-[10px]">(bosh = pa limit)</span></label>
              <input type="number" min={1} className={inputCls} placeholder="pa limit" value={form.maxParticipants} onChange={e => setForm({ ...form, maxParticipants: e.target.value })} />
            </div>
          </div>
          <div>
            <label className={labelCls}>XP Minimal per Hyrje <span className="font-normal text-slate-400 text-[10px]">(0 = pa kerkese)</span></label>
            <input type="number" min={0} className={inputCls} placeholder="0" value={form.minXp} onChange={e => setForm({ ...form, minXp: parseInt(e.target.value) || 0 })} />
            <p className="text-[11px] text-slate-400 mt-1">P.sh. vendos 50 qe vetem perdoruesit me 50+ XP te mund te hyjne.</p>
          </div>
          <button type="submit" disabled={loading}
            className={`w-full py-3 rounded-xl font-bold text-sm text-white transition-all mt-1 ${loading ? "bg-indigo-300 cursor-not-allowed" : "bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 shadow-lg shadow-indigo-200"}`}>
            {loading ? "Duke krijuar..." : "Krijo Dhurate"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Giveaway Detail Page ─────────────────────────────────────────────────────
function GiveawayDetailPage({ giveaway, currentUser, onBack, onRefresh }) {
  const [loading, setLoading]     = useState(false);
  const [message, setMessage]     = useState("");
  const [detail, setDetail]       = useState(giveaway);
  const [showAudit, setShowAudit] = useState(false);

  const isAdmin    = currentUser?.role === "admin";
  const isEnded    = detail.status === "ended" || new Date(detail.endTime) <= new Date();
  const isFull     = detail.maxParticipants != null && detail.participants?.length >= detail.maxParticipants;
  const isEntered  = detail.participants?.some(p => p.userId?.toString() === currentUser?._id?.toString());
  const userXp     = currentUser?.xp || 0;
  const meetsXpReq = !detail.minXp || userXp >= detail.minXp;

  const enter = async () => {
    setLoading(true); setMessage("");
    try {
      const res = await giveawayService.enterGiveaway(detail._id);
      setDetail(res.data || res);
      setMessage("Jeni regjistruar ne dhurate!");
      onRefresh();
    } catch (err) {
      setMessage(err.response?.data?.message || "Gabim gjate regjistrimit");
    } finally { setLoading(false); }
  };

  const pickWinners = async () => {
    setLoading(true); setMessage("");
    try {
      const res = await giveawayService.pickWinners(detail._id);
      setDetail(res.data || res);
      onRefresh();
    } catch (err) {
      setMessage(err.response?.data?.message || "Gabim gjate zgjedhjes");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative">
        {detail.imageUrl ? (
          <div className="relative h-64">
            <img src={detail.imageUrl} alt={detail.title} className="w-full h-full rounded-4xl object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
          </div>
        ) : (
          <div className="h-52 bg-gradient-to-br from-slate-900 via-slate-800 to-violet-950" />
        )}

        <button onClick={onBack} className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-semibold text-slate-800 flex items-center gap-2 shadow-md hover:bg-white transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Kthehu
        </button>

        <span className={`absolute top-4 right-4 text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wide ${isEnded ? "bg-white/90 text-slate-500" : "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-md"}`}>
          {isEnded ? "Perfundoi" : "Aktive"}
        </span>

        <div className="absolute bottom-5 left-5 right-5">
          <h1 className="text-white font-extrabold text-2xl md:text-3xl drop-shadow-lg leading-tight">{detail.title}</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex flex-wrap gap-6 items-start">
            <div className="flex-1 min-w-[200px]">
              <p className="text-slate-500 text-sm leading-relaxed">{detail.description}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                  👥 {detail.participants?.length || 0}{detail.maxParticipants != null && <span className="text-slate-400">/{detail.maxParticipants}</span>}
                </span>
                <span className="flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                  🏆 {detail.maxWinners} fitues
                </span>
                {detail.minXp > 0 && (
                  <span className="flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-amber-200">
                    ⚡ Min. {detail.minXp} XP
                  </span>
                )}
                {isFull && !isEnded && (
                  <span className="bg-red-50 text-red-500 text-xs font-semibold px-3 py-1.5 rounded-full border border-red-200">Plot</span>
                )}
              </div>
            </div>
            {!isEnded && (
              <div className="text-center">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Koha e Mbetur</p>
                <CountdownTimer endTime={detail.endTime} large />
              </div>
            )}
          </div>
        </div>

        {!isEnded && !isAdmin && (
          <div className="text-center space-y-3">
            {detail.minXp > 0 && !meetsXpReq && !isEntered && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 text-sm text-amber-800 font-semibold">
                ⚡ Duhen <strong>{detail.minXp} XP</strong> per te hyre. Ti ke aktualisht <strong>{userXp} XP</strong>.
              </div>
            )}
            {message && <p className="text-indigo-500 font-semibold text-sm">{message}</p>}
            <button onClick={enter} disabled={loading || isEntered || isFull || !meetsXpReq}
              className={`px-10 py-3.5 rounded-2xl font-bold text-base transition-all ${
                isEntered ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-200"
                : !meetsXpReq || isFull ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-200 hover:from-indigo-600 hover:to-violet-600 hover:-translate-y-0.5"
              }`}>
              {isEntered ? "✓ Je Regjistruar" : !meetsXpReq ? `⚡ Duhen ${detail.minXp} XP` : isFull ? "Plot" : loading ? "Duke u regjistruar..." : "Regjistrohu ne Dhurate"}
            </button>
            {isEntered && <p className="text-xs text-slate-400">Fat te mire! Fituesit do te shpallen kur te perfundoje dhurata.</p>}
          </div>
        )}

        {isAdmin && !isEnded && (
          <div className="text-center space-y-3">
            {message && <p className="text-red-500 font-semibold text-sm">{message}</p>}
            <button onClick={pickWinners} disabled={loading}
              className={`px-8 py-3 rounded-xl font-bold text-sm text-white transition-all ${loading ? "bg-amber-300 cursor-not-allowed" : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-200"}`}>
              {loading ? "Duke zgjedhur..." : "Zgjidh Fituesit Tani"}
            </button>
          </div>
        )}

        {isAdmin && isEnded && (
          <div className="flex justify-end">
            <button onClick={() => setShowAudit(true)} className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
              📋 Shiko Regjistrin e Auditimit
            </button>
          </div>
        )}

        {isEnded && (
          <div>
            <h2 className="text-base font-bold text-slate-800 mb-3">
              {detail.winners?.length > 0 ? "🏆 Fituesit" : "Duke zgjedhur fituesit..."}
            </h2>
            {detail.winners?.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {detail.winners.map((w, i) => {
                  const medals = ["I", "II", "III"];
                  const isYou = w.userId?.toString() === currentUser?._id?.toString();
                  return (
                    <div key={i} className={`flex items-center gap-3 rounded-2xl px-4 py-3 border ${isYou ? "bg-gradient-to-r from-violet-50 to-indigo-50 border-violet-200" : "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200"}`}>
                      <span className={`text-xs font-black min-w-[20px] ${isYou ? "text-violet-600" : "text-amber-700"}`}>{medals[i] || i + 1}</span>
                      <UserAvatar userId={w.userId} avatarStyle={w.avatarStyle} size="sm" name={w.emri} />
                      <span className="font-bold text-slate-800 text-sm flex-1">{w.emri} {w.mbiemri}</span>
                      {isYou && <span className="text-[11px] bg-violet-500 text-white px-3 py-1 rounded-full font-bold flex-shrink-0">Je Ti</span>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-9 bg-white rounded-2xl text-slate-400 text-sm">
                {detail.participants?.length === 0 ? "Askush nuk u regjistrua ne kete dhurate." : "Ende nuk jane zgjedhur fitues."}
              </div>
            )}
          </div>
        )}

        <ParticipantsGrid participants={detail.participants || []} currentUser={currentUser} />
      </div>

      {showAudit && <AuditLogModal giveawayId={detail._id} onClose={() => setShowAudit(false)} />}
    </div>
  );
}

// ─── Giveaway Card ────────────────────────────────────────────────────────────
function GiveawayCard({ giveaway, onClick }) {
  const isEnded = giveaway.status === "ended" || new Date(giveaway.endTime) <= new Date();
  const isFull  = giveaway.maxParticipants != null && giveaway.participants?.length >= giveaway.maxParticipants;

  return (
    <div onClick={() => onClick(giveaway)} className="bg-white rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 shadow-sm border border-slate-100 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-200/60">
      {giveaway.imageUrl ? (
        <img src={giveaway.imageUrl} alt={giveaway.title} className="w-full h-32 object-cover" />
      ) : (
        <div className="w-full h-20 bg-gradient-to-br from-slate-900 to-violet-950 flex items-center justify-center">
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Dhurate</span>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-bold text-slate-800 text-sm leading-snug flex-1">{giveaway.title}</h3>
          <div className="flex gap-1 flex-shrink-0">
            {isFull && !isEnded && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-100">Plot</span>}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isEnded ? "bg-slate-50 text-slate-400 border-slate-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"}`}>
              {isEnded ? "Perfundoi" : "Aktive"}
            </span>
          </div>
        </div>
        <p className="text-slate-400 text-xs mb-3 line-clamp-2 leading-relaxed">{giveaway.description}</p>
        {!isEnded && <div className="mb-3"><CountdownTimer endTime={giveaway.endTime} /></div>}

        {giveaway.participants?.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex">
              {giveaway.participants.slice(0, 5).map((p, i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-indigo-50"
                  style={{ marginLeft: i > 0 ? "-6px" : "0", zIndex: 5 - i, position: "relative" }}>
                  <img src={generateDicebearUrl(p.userId, p.avatarStyle || "adventurer")} alt={p.emri} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            {giveaway.participants.length > 5 && <span className="text-xs text-slate-400">+{giveaway.participants.length - 5}</span>}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-2.5">
          <span>
            <span className="font-bold text-slate-700">{giveaway.participants?.length || 0}</span>
            {giveaway.maxParticipants != null && <span>/{giveaway.maxParticipants}</span>} pjesemarres
          </span>
          {giveaway.minXp > 0 && (
            <span className="bg-amber-50 text-amber-600 font-bold px-2 py-0.5 rounded-full text-[11px] border border-amber-200">⚡ {giveaway.minXp} XP</span>
          )}
          <span><span className="font-bold text-slate-700">{giveaway.maxWinners}</span> fitues</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Giveaway Page ───────────────────────────────────────────────────────
export default function Giveaway() {
  const { user } = useAuth();

  const currentUser = {
    _id:              user?.id,
    emri:             user?.firstName,
    mbiemri:          user?.lastName,
    email:            user?.email,
    role:             user?.role,
    xp:               user?.xp,
    subscriptionType: user?.subscription?.type || null,
    avatarStyle:      user?.avatarStyle,
  };

  const [giveaways, setGiveaways]               = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [selectedGiveaway, setSelectedGiveaway] = useState(null);
  const [showCreate, setShowCreate]             = useState(false);
  const [filter, setFilter]                     = useState("all");

  const isAdmin = currentUser?.role === "admin";

  // Rotating taglines for the hero
  const rotatingPhrases = [
    "Çdo javë. Një fitues.",
    "Hyr. Prit. Fito.",
    "Shpërblime çdo javë.",
    "Fati është i yti.",
  ];
  const { text: rotatingText, visible: rotatingVisible } = useRotatingText(rotatingPhrases);

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
    if (filter === "ended")  return ended;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Compact Hero ── */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-violet-950 px-5 pt-8 pb-6 overflow-hidden">
        {/* Ambient blobs */}
        <div className="absolute -top-10 -left-8 w-56 h-56 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-6 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center gap-3">

          {/* Icon + title row */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 12 20 22 4 22 4 12"/>
                <rect x="2" y="7" width="20" height="5"/>
                <line x1="12" y1="22" x2="12" y2="7"/>
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
              </svg>
            </div>
            <h1 className="text-white font-extrabold text-2xl tracking-tight">Dhurata</h1>
          </div>

          {/* Rotating tagline */}
          <div className="h-7 flex items-center justify-center">
            <p
              className="text-sm font-bold tracking-wide"
              style={{
                background: "linear-gradient(90deg, #a78bfa, #818cf8, #f472b6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                opacity: rotatingVisible ? 1 : 0,
                transform: rotatingVisible ? "translateY(0)" : "translateY(6px)",
                transition: "opacity 0.3s ease, transform 0.3s ease",
              }}
            >
              {rotatingText}
            </p>
          </div>

          {/* 3-step how-it-works strip */}
          <div className="flex items-center gap-1 mt-1">
            {[
              { icon: "✋", label: "Regjistrohu" },
              { icon: "⏳", label: "Prit" },
              { icon: "🎉", label: "Fito" },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="flex flex-col items-center gap-0.5 bg-white/8 backdrop-blur-sm rounded-xl px-3.5 py-2 border border-white/10">
                  <span className="text-base leading-none">{step.icon}</span>
                  <span className="text-white/70 text-[10px] font-semibold tracking-wide">{step.label}</span>
                </div>
                {i < 2 && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/25 flex-shrink-0 mx-0.5">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                )}
              </div>
            ))}
          </div>

          {/* Weekly badge */}
          <div className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-400/25 rounded-full px-3.5 py-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-emerald-300 text-[11px] font-bold tracking-wide uppercase">Dhurata te reja çdo javë</span>
          </div>

        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-5xl mx-auto px-4 py-5">
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-100">
            {[
              { key: "all",    label: "Te gjitha" },
              { key: "active", label: "Aktive" },
              { key: "ended",  label: "Perfunduara" },
            ].map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === f.key ? "bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                {f.label}
              </button>
            ))}
          </div>
          {isAdmin && (
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-200 transition-all">
              + Krijo Dhurate
            </button>
          )}
        </div>

        {/* Cards */}
        {loading ? (
          <div className="text-center py-16 text-slate-400">
            <div className="w-9 h-9 border-2 border-slate-200 border-t-indigo-500 rounded-full mx-auto mb-4 animate-spin" />
            <p className="text-sm">Duke ngarkuar dhurata...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-base font-semibold text-slate-500 mb-1">Nuk u gjetën dhurata</p>
            <p className="text-sm">Kontrollo me vone per mundesi te reja!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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