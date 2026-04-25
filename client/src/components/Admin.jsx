
import React, { useState, useEffect, useCallback } from "react";
import { adminService, pathService, listenService, phraseService, sentenceService, wordAudioService, dictionaryService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [paidUsers, setPaidUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [visitorStats, setVisitorStats] = useState(null);
  const [visitorDays, setVisitorDays] = useState(30);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateVisitors, setDateVisitors] = useState(null);
  const [dateVisitorsLoading, setDateVisitorsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // ── Path manager state ──────────────────────────────────────────────────
  const [adminPaths, setAdminPaths] = useState([]);
  const [pathsLoading, setPathsLoading] = useState(false);
  const [selectedAdminPath, setSelectedAdminPath] = useState(null);
  const [pathForm, setPathForm] = useState({ title: "", description: "", level: "A1", language: "de", order: 0 });
  const [showPathForm, setShowPathForm] = useState(false);
  const [editingPath, setEditingPath] = useState(null);
  const [pathSaving, setPathSaving] = useState(false);
  const [showRoundForm, setShowRoundForm] = useState(false);
  const [roundForm, setRoundForm] = useState({ title: "", description: "", icon: "⭐", xpReward: 20, exercises: [] });
  const [roundSaving, setRoundSaving] = useState(false);
  const EXERCISE_TYPES = ["listenTest", "translate", "dictionaryWord", "wordAudio", "phrase", "sentence", "createWord"];
  const emptyExercise = { type: "translate", question: "", answer: "", translation: "", audioText: "", options: "", words: "", xpReward: 5, contentId: "", contentModel: "" };
  const [currentExercise, setCurrentExercise] = useState({ ...emptyExercise });
  // Content browser (pick from existing DB content)
  const [contentBrowser, setContentBrowser] = useState({ open: false, type: "", results: [], loading: false, level: "A1", search: "" });
  const [useExistingContent, setUseExistingContent] = useState(false);
  // ─────────────────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === "all-users") fetchAllUsers();
    if (activeTab === "paid-users") fetchPaidUsers();
    if (activeTab === "online-users") fetchOnlineUsers();
    if (activeTab === "visitors") fetchVisitorStats(visitorDays);
    if (activeTab === "paths") fetchAdminPaths();
  }, [activeTab, currentPage, searchTerm]);

  useEffect(() => {
    if (activeTab === "visitors") fetchVisitorStats(visitorDays);
  }, [visitorDays]);

  const fetchStats = async () => {
    try {
      const res = await adminService.getDashboardStats();
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAllUsers({
        page: currentPage,
        limit: 20,
        search: searchTerm,
      });
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
    setLoading(false);
  };

  const fetchPaidUsers = async () => {
    setLoading(true);
    try {
      const res = await adminService.getPaidUsers({
        page: currentPage,
        limit: 20,
      });
      setPaidUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error("Failed to fetch paid users:", err);
    }
    setLoading(false);
  };

  const fetchVisitorStats = async (days) => {
    setLoading(true);
    try {
      const res = await adminService.getVisitorStats(days);
      setVisitorStats(res.data);
    } catch (err) {
      console.error("Failed to fetch visitor stats:", err);
    }
    setLoading(false);
  };

  const fetchVisitorsByDate = async (date) => {
    if (selectedDate === date) { setSelectedDate(null); setDateVisitors(null); return; }
    setSelectedDate(date);
    setDateVisitorsLoading(true);
    try {
      const res = await adminService.getVisitorsByDate(date);
      setDateVisitors(res.data);
    } catch (err) {
      console.error("Failed to fetch visitors by date:", err);
    }
    setDateVisitorsLoading(false);
  };

  const fetchOnlineUsers = async () => {
    setLoading(true);
    try {
      const res = await adminService.getOnlineUsers();
      setOnlineUsers(res.data.users);
    } catch (err) {
      console.error("Failed to fetch online users:", err);
    }
    setLoading(false);
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Change this user's role to "${newRole}"?`)) return;
    try {
      await adminService.updateUserRole(userId, newRole);
      fetchAllUsers();
    } catch (err) {
      alert("Failed to update role");
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await adminService.toggleUserStatus(userId);
      fetchAllUsers();
    } catch (err) {
      alert("Failed to toggle status");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await adminService.deleteUser(userId);
      fetchAllUsers();
    } catch (err) {
      alert("Failed to delete user");
    }
  };

  // ── Path handlers ─────────────────────────────────────────────────────────
  const fetchAdminPaths = async () => {
    setPathsLoading(true);
    try {
      const res = await pathService.getAllPathsAdmin();
      const data = res?.data || res;
      setAdminPaths(data?.paths || []);
    } catch { alert("Failed to load paths"); }
    setPathsLoading(false);
  };

  const handleSavePath = async () => {
    if (!pathForm.title || !pathForm.level) return alert("Title and level required");
    setPathSaving(true);
    try {
      if (editingPath) {
        await pathService.updatePath(editingPath._id, pathForm);
      } else {
        await pathService.createPath(pathForm);
      }
      setShowPathForm(false);
      setEditingPath(null);
      setPathForm({ title: "", description: "", level: "A1", language: "de", order: 0 });
      fetchAdminPaths();
    } catch { alert("Failed to save path"); }
    setPathSaving(false);
  };

  const handleDeletePath = async (pathId) => {
    if (!window.confirm("Deactivate this path?")) return;
    try {
      await pathService.deletePath(pathId);
      fetchAdminPaths();
      if (selectedAdminPath?._id === pathId) setSelectedAdminPath(null);
    } catch { alert("Failed to delete path"); }
  };

  const handleEditPath = (path) => {
    setEditingPath(path);
    setPathForm({ title: path.title, description: path.description || "", level: path.level, language: path.language || "de", order: path.order || 0 });
    setShowPathForm(true);
  };

  const handleAddExerciseToRound = () => {
    const ex = { ...currentExercise };
    if (ex.options) ex.options = ex.options.split(",").map(s => s.trim()).filter(Boolean);
    if (ex.words) ex.words = ex.words.split(",").map(s => s.trim()).filter(Boolean);
    setRoundForm(prev => ({ ...prev, exercises: [...prev.exercises, ex] }));
    setCurrentExercise({ ...emptyExercise });
  };

  const handleRemoveExercise = (idx) => {
    setRoundForm(prev => ({ ...prev, exercises: prev.exercises.filter((_, i) => i !== idx) }));
  };

  const handleSaveRound = async () => {
    if (!roundForm.title) return alert("Round title required");
    if (roundForm.exercises.length === 0) return alert("Add at least one exercise");
    setRoundSaving(true);
    try {
      await pathService.addRound(selectedAdminPath._id, roundForm);
      setShowRoundForm(false);
      setRoundForm({ title: "", description: "", icon: "⭐", xpReward: 20, exercises: [] });
      // Refresh the selected path
      const res = await pathService.getAllPathsAdmin();
      const data = res?.data || res;
      const updated = (data?.paths || []).find(p => p._id === selectedAdminPath._id);
      setSelectedAdminPath(updated || selectedAdminPath);
      setAdminPaths(data?.paths || []);
    } catch { alert("Failed to save round"); }
    setRoundSaving(false);
  };

  const searchExistingContent = useCallback(async (overrides = {}) => {
    const type = overrides.type ?? contentBrowser.type;
    const level = overrides.level ?? contentBrowser.level;
    const search = overrides.search ?? contentBrowser.search;
    setContentBrowser(prev => ({ ...prev, loading: true, results: [] }));
    try {
      const params = { level, limit: 30 };
      if (search) params.search = search;
      let res;
      if (type === "listenTest") res = await listenService.getAllTests(params);
      else if (type === "phrase") res = await phraseService.getAllPhrases(params);
      else if (type === "sentence") res = await sentenceService.getAllSentences(params);
      else if (type === "wordAudio") res = await wordAudioService.getAllSets(params);
      else if (type === "dictionaryWord") res = await dictionaryService.getAllWords(params);
      const data = res?.data || res;
      const items = data?.tests || data?.phrases || data?.sentences || data?.sets || data?.words || [];
      setContentBrowser(prev => ({ ...prev, results: items, loading: false }));
    } catch {
      setContentBrowser(prev => ({ ...prev, loading: false }));
    }
  }, [contentBrowser.type, contentBrowser.level, contentBrowser.search]);

  const MODEL_MAP_FOR_TYPE = { listenTest: "Listen", phrase: "Phrase", sentence: "Sentence", wordAudio: "WordAudioSet", dictionaryWord: "Dictionary", translate: "Translate", createWord: "CreateWord" };

  const handlePickContent = (item) => {
    const model = MODEL_MAP_FOR_TYPE[contentBrowser.type] || "";
    // Build a pre-filled exercise from the content item
    let ex = { ...emptyExercise, type: contentBrowser.type, contentId: item._id, contentModel: model, xpReward: 5 };
    if (contentBrowser.type === "listenTest") {
      ex.question = item.title || item.text || "";
      ex.audioText = item.text || "";
      ex.answer = ""; // answer checked via Jaccard on backend
    } else if (contentBrowser.type === "phrase") {
      ex.question = item.german || "";
      ex.answer = item.albanian || "";
      ex.audioText = item.german || "";
    } else if (contentBrowser.type === "sentence") {
      ex.question = item.title || "";
      ex.answer = item.questions?.[0]?.correctSentence || "";
      ex.words = item.questions?.[0]?.options?.join(", ") || "";
    } else if (contentBrowser.type === "wordAudio") {
      ex.question = item.title || "";
      ex.audioText = item.words?.[0]?.germanWord || "";
      ex.answer = item.words?.[0]?.germanWord || "";
      ex.options = item.words?.map(w => w.germanWord).join(", ") || "";
    } else if (contentBrowser.type === "dictionaryWord") {
      ex.question = item.word || item.german || "";
      ex.answer = item.albanian || item.translation || "";
      ex.audioText = item.word || item.german || "";
    }
    setCurrentExercise(ex);
    setContentBrowser(prev => ({ ...prev, open: false }));
    setUseExistingContent(false);
  };

  const handleDeleteRound = async (roundIdx) => {
    if (!window.confirm("Delete this round?")) return;
    try {
      await pathService.deleteRound(selectedAdminPath._id, roundIdx);
      const res = await pathService.getAllPathsAdmin();
      const data = res?.data || res;
      const updated = (data?.paths || []).find(p => p._id === selectedAdminPath._id);
      setSelectedAdminPath(updated || null);
      setAdminPaths(data?.paths || []);
    } catch { alert("Failed to delete round"); }
  };
  // ─────────────────────────────────────────────────────────────────────────

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRevenue = (amount) => {
    if (amount === undefined || amount === null) return "€0";
    return `€${Number(amount).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "#FDFBF7" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-stone-300 border-t-stone-600 animate-spin" />
          <p className="text-stone-500 text-sm tracking-wide">Duke u hapur</p>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return null;
  }

  const tabs = [
    {
      id: "dashboard", label: "Dashboard", icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      )
    },
    {
      id: "all-users", label: "All Users", icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      )
    },
    {
      id: "paid-users", label: "Paid Users", icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      )
    },
    {
      id: "online-users", label: "Online", icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.808-3.808-9.98 0-13.789m13.788 0c3.808 3.808 3.808 9.981 0 13.79M12 12.75h.008v.008H12v-.008z" />
        </svg>
      )
    },
    {
      id: "visitors", label: "Visitors", icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      )
    },
    {
      id: "paths", label: "Paths", icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
        </svg>
      )
    },
  ];

  const statConfig = [
    { label: "Total Users", key: "totalUsers", bg: "bg-stone-50", accent: "text-stone-800", border: "border-stone-200", iconBg: "bg-stone-100" },
    { label: "Paid Users", key: "paidUsers", bg: "bg-emerald-50/50", accent: "text-emerald-700", border: "border-emerald-100", iconBg: "bg-emerald-100" },
    { label: "Free Users", key: "freeUsers", bg: "bg-amber-50/50", accent: "text-amber-700", border: "border-amber-100", iconBg: "bg-amber-100" },
    { label: "Online Now", key: "onlineCount", bg: "bg-sky-50/50", accent: "text-sky-700", border: "border-sky-100", iconBg: "bg-sky-100" },
    { label: "New Today", key: "newUsersToday", bg: "bg-rose-50/50", accent: "text-rose-700", border: "border-rose-100", iconBg: "bg-rose-100" },
    { label: "Active Subs", key: "activeSubscriptions", bg: "bg-teal-50/50", accent: "text-teal-700", border: "border-teal-100", iconBg: "bg-teal-100" },
  ];

  const statIcons = [
    <svg key="0" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
    <svg key="1" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>,
    <svg key="2" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>,
    <svg key="3" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>,
    <svg key="4" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    <svg key="5" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" /></svg>,
  ];

  const revenueCards = [
    {
      label: "This month",
      value: stats?.revenue?.thisMonth,
      bg: "bg-teal-50/50",
      accent: "text-teal-700",
      border: "border-teal-100",
      iconBg: "bg-teal-100",
    },
    {
      label: "Previous month",
      value: stats?.revenue?.prevMonth,
      bg: "bg-amber-50/50",
      accent: "text-amber-700",
      border: "border-amber-100",
      iconBg: "bg-amber-100",
    },
    {
      label: "Total revenue",
      value: stats?.revenue?.total,
      bg: "bg-stone-50",
      accent: "text-stone-800",
      border: "border-stone-200",
      iconBg: "bg-stone-100",
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FDFBF7" }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: "#EDE8DF", backgroundColor: "#FDFBF7" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#1C1917" }}>
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base sm:text-xl font-semibold tracking-tight" style={{ color: "#1C1917" }}>Admin Panel</h1>
              <p className="text-xs hidden sm:block" style={{ color: "#A8A29E" }}>Manage your platform</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium" style={{ backgroundColor: "#F5F0E8", color: "#78716C" }}>
              {user?.emri?.charAt(0) || "A"}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 sm:mb-8 p-1 rounded-xl overflow-x-auto" style={{ backgroundColor: "#F5F0E8" }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.id ? "shadow-sm" : "hover:opacity-80"
              }`}
              style={
                activeTab === tab.id
                  ? { backgroundColor: "#FFFFFF", color: "#1C1917", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                  : { backgroundColor: "transparent", color: "#78716C" }
              }
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── DASHBOARD TAB ── */}
        {activeTab === "dashboard" && stats && (
          <div className="space-y-6 sm:space-y-8">

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
              {statConfig.map((stat, index) => (
                <div
                  key={stat.label}
                  className={`rounded-2xl p-4 sm:p-6 border transition-all duration-200 hover:shadow-md ${stat.bg} ${stat.border}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium" style={{ color: "#78716C" }}>{stat.label}</p>
                      <p className={`text-2xl sm:text-4xl font-bold mt-2 sm:mt-3 tracking-tight ${stat.accent}`}>
                        {stats[stat.key]}
                      </p>
                    </div>
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${stat.iconBg} flex items-center justify-center ${stat.accent}`}>
                      {statIcons[index]}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Revenue Box ── */}
            {stats.revenue && (
              <div
                className="rounded-2xl border p-4 sm:p-6"
                style={{ backgroundColor: "#FFFFFF", borderColor: "#EDE8DF" }}
              >
                <div className="flex items-center gap-2 mb-4 sm:mb-5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#F5F0E8" }}>
                    <svg className="w-4 h-4" style={{ color: "#44403C" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold" style={{ color: "#1C1917" }}>Revenue</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
                  {revenueCards.map((r) => (
                    <div
                      key={r.label}
                      className={`rounded-2xl border p-4 sm:p-5 transition-all duration-200 hover:shadow-md ${r.bg} ${r.border}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs sm:text-sm font-medium" style={{ color: "#78716C" }}>
                            {r.label}
                          </p>
                          <p className={`text-xl sm:text-3xl font-bold mt-2 tracking-tight ${r.accent}`}>
                            {formatRevenue(r.value)}
                          </p>
                        </div>
                        <div className={`w-8 h-8 rounded-xl ${r.iconBg} flex items-center justify-center ${r.accent}`}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subscription breakdown */}
            {stats.subscriptionBreakdown?.length > 0 && (
              <div className="rounded-2xl border p-4 sm:p-6" style={{ backgroundColor: "#FFFFFF", borderColor: "#EDE8DF" }}>
                <h3 className="text-base sm:text-lg font-semibold mb-4 sm:mb-5" style={{ color: "#1C1917" }}>Subscription Breakdown</h3>
                <div className="overflow-hidden rounded-xl border overflow-x-auto" style={{ borderColor: "#EDE8DF" }}>
                  <table className="w-full">
                    <thead>
                      <tr style={{ backgroundColor: "#FAF8F4" }}>
                        <th className="text-left py-3.5 px-5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#A8A29E" }}>Type</th>
                        <th className="text-right py-3.5 px-5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#A8A29E" }}>Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.subscriptionBreakdown.map((item, idx) => (
                        <tr
                          key={item._id}
                          className="transition-colors"
                          style={{ borderTop: idx > 0 ? "1px solid #EDE8DF" : "none" }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#FAF8F4"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        >
                          <td className="py-3.5 px-5 text-sm font-medium" style={{ color: "#44403C" }}>{item._id || "N/A"}</td>
                          <td className="text-right py-3.5 px-5">
                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: "#F5F0E8", color: "#1C1917" }}>
                              {item.count}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ALL USERS TAB ── */}
        {activeTab === "all-users" && (
          <div className="space-y-4 sm:space-y-5">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-full sm:max-w-md">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#A8A29E" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border text-sm outline-none transition-all duration-200"
                  style={{ backgroundColor: "#FFFFFF", borderColor: "#EDE8DF", color: "#1C1917" }}
                  onFocus={(e) => e.target.style.borderColor = "#D6CFC3"}
                  onBlur={(e) => e.target.style.borderColor = "#EDE8DF"}
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-stone-200 border-t-stone-500 animate-spin" />
                  <p className="text-sm" style={{ color: "#A8A29E" }}>Loading users...</p>
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "#FFFFFF", borderColor: "#EDE8DF" }}>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                      <thead>
                        <tr style={{ backgroundColor: "#FAF8F4" }}>
                          {["Name", "Email", "Role", "Paid", "Sub Type", "XP", "Joined", "Status", "Actions"].map((h) => (
                            <th key={h} className="px-3 sm:px-5 py-3 sm:py-3.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "#A8A29E" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u, idx) => (
                          <tr
                            key={u._id}
                            className="transition-colors"
                            style={{ borderTop: idx > 0 ? "1px solid #EDE8DF" : "none" }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#FDFBF7"}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                          >
                            <td className="px-3 sm:px-5 py-3 sm:py-4 text-sm font-medium whitespace-nowrap" style={{ color: "#1C1917" }}>
                              {u.emri} {u.mbiemri}
                            </td>
                            <td className="px-3 sm:px-5 py-3 sm:py-4 text-sm" style={{ color: "#78716C" }}>{u.email}</td>
                            <td className="px-3 sm:px-5 py-3 sm:py-4">
                              <select
                                value={u.role}
                                onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                className="px-3 py-1.5 border rounded-lg text-xs font-medium outline-none cursor-pointer transition-colors"
                                style={{ backgroundColor: "#FAF8F4", borderColor: "#EDE8DF", color: "#44403C" }}
                              >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                                <option value="academyAdmin">Academy Admin</option>
                              </select>
                            </td>
                            <td className="px-3 sm:px-5 py-3 sm:py-4">
                              <span
                                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                                style={
                                  u.isPaid
                                    ? { backgroundColor: "#ECFDF5", color: "#065F46" }
                                    : { backgroundColor: "#FEF2F2", color: "#991B1B" }
                                }
                              >
                                <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: u.isPaid ? "#10B981" : "#EF4444" }} />
                                {u.isPaid ? "Yes" : "No"}
                              </span>
                            </td>
                            <td className="px-3 sm:px-5 py-3 sm:py-4">
                              <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: "#F5F0E8", color: "#44403C" }}>
                                {u.subscriptionType || "free_trial"}
                              </span>
                            </td>
                            <td className="px-3 sm:px-5 py-3 sm:py-4 text-sm font-bold" style={{ color: "#1C1917" }}>{u.xp || 0}</td>
                            <td className="px-3 sm:px-5 py-3 sm:py-4 text-xs whitespace-nowrap" style={{ color: "#A8A29E" }}>{formatDate(u.createdAt)}</td>
                            <td className="px-3 sm:px-5 py-3 sm:py-4">
                              <span
                                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                                style={
                                  u.isActive
                                    ? { backgroundColor: "#EFF6FF", color: "#1E40AF" }
                                    : { backgroundColor: "#F5F5F4", color: "#78716C" }
                                }
                              >
                                <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: u.isActive ? "#3B82F6" : "#A8A29E" }} />
                                {u.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-3 sm:px-5 py-3 sm:py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleToggleStatus(u._id)}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors border"
                                  style={{ backgroundColor: "#FAF8F4", borderColor: "#EDE8DF", color: "#78716C" }}
                                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F5F0E8"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#FAF8F4"; }}
                                  title={u.isActive ? "Deactivate" : "Activate"}
                                >
                                  {u.isActive ? (
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                  ) : (
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u._id)}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors border"
                                  style={{ backgroundColor: "#FEF2F2", borderColor: "#FECACA", color: "#DC2626" }}
                                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#FEE2E2"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#FEF2F2"; }}
                                  title="Delete user"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 sm:gap-3 pt-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                      className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ backgroundColor: "#FFFFFF", borderColor: "#EDE8DF", color: "#44403C" }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                      <span className="hidden sm:inline">Previous</span>
                    </button>
                    <div className="flex items-center gap-1.5">
                      <span className="px-3.5 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: "#1C1917", color: "#FFFFFF" }}>
                        {currentPage}
                      </span>
                      <span className="text-sm" style={{ color: "#A8A29E" }}>of {pagination.totalPages}</span>
                    </div>
                    <button
                      disabled={currentPage === pagination.totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                      className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ backgroundColor: "#FFFFFF", borderColor: "#EDE8DF", color: "#44403C" }}
                    >
                      <span className="hidden sm:inline">Next</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── PAID USERS TAB ── */}
        {activeTab === "paid-users" && (
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-emerald-200 border-t-emerald-500 animate-spin" />
                  <p className="text-sm" style={{ color: "#A8A29E" }}>Loading paid users...</p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "#FFFFFF", borderColor: "#EDE8DF" }}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr style={{ backgroundColor: "#F0FDF4" }}>
                        {["Name", "Email", "Sub Type", "Expires At", "Cancelled", "XP", "Streak"].map((h) => (
                          <th key={h} className="px-3 sm:px-5 py-3 sm:py-3.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "#15803D" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paidUsers.map((u, idx) => (
                        <tr
                          key={u._id}
                          className="transition-colors"
                          style={{ borderTop: idx > 0 ? "1px solid #EDE8DF" : "none" }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#FDFBF7"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        >
                          <td className="px-3 sm:px-5 py-3 sm:py-4 text-sm font-medium whitespace-nowrap" style={{ color: "#1C1917" }}>{u.emri} {u.mbiemri}</td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4 text-sm" style={{ color: "#78716C" }}>{u.email}</td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: "#EFF6FF", color: "#1E40AF" }}>
                              {u.subscriptionType || "N/A"}
                            </span>
                          </td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4 text-xs whitespace-nowrap" style={{ color: "#78716C" }}>{formatDate(u.subscriptionExpiresAt)}</td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4">
                            <span
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                              style={
                                u.subscriptionCancelled
                                  ? { backgroundColor: "#FEF2F2", color: "#991B1B" }
                                  : { backgroundColor: "#ECFDF5", color: "#065F46" }
                              }
                            >
                              <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: u.subscriptionCancelled ? "#EF4444" : "#10B981" }} />
                              {u.subscriptionCancelled ? "Yes" : "No"}
                            </span>
                          </td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4 text-sm font-bold" style={{ color: "#1C1917" }}>{u.xp || 0}</td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm" style={{ color: "#EA580C" }}>
                                <svg className="w-4 h-4 inline-block" fill="currentColor" viewBox="0 0 24 24"><path d="M12 23c-1.1 0-1.99-.89-1.99-1.99h3.98C13.99 22.11 13.1 23 12 23zm6-5v-5.5c0-3.07-2.13-5.64-5-6.32V5c0-.55-.45-1-1-1s-1 .45-1 1v1.18c-2.87.68-5 3.25-5 6.32V18l-2 2v1h16v-1l-2-2z" /></svg>
                              </span>
                              <span className="text-sm font-bold" style={{ color: "#EA580C" }}>{u.streakCount || 0}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── VISITORS TAB ── */}
        {activeTab === "visitors" && (
          <div className="space-y-5 sm:space-y-6">

            {/* Summary cards + day selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex gap-3">
                {[
                  { label: "Today", value: visitorStats?.today ?? "–", accent: "text-sky-700", bg: "bg-sky-50/60", border: "border-sky-100" },
                  { label: `Last ${visitorDays}d total`, value: visitorStats?.total ?? "–", accent: "text-stone-800", bg: "bg-stone-50", border: "border-stone-200" },
                ].map((c) => (
                  <div key={c.label} className={`rounded-2xl border px-5 py-3.5 ${c.bg} ${c.border}`}>
                    <p className="text-xs font-medium" style={{ color: "#78716C" }}>{c.label}</p>
                    <p className={`text-2xl font-bold mt-1 tracking-tight ${c.accent}`}>{c.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                {[7, 14, 30, 60].map((d) => (
                  <button
                    key={d}
                    onClick={() => setVisitorDays(d)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                    style={
                      visitorDays === d
                        ? { backgroundColor: "#1C1917", color: "#FFFFFF", borderColor: "#1C1917" }
                        : { backgroundColor: "#FFFFFF", color: "#78716C", borderColor: "#EDE8DF" }
                    }
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>

            {/* Bar chart */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-stone-200 border-t-stone-500 animate-spin" />
                  <p className="text-sm" style={{ color: "#A8A29E" }}>Loading visitor data...</p>
                </div>
              </div>
            ) : visitorStats?.data ? (() => {
              const maxV = Math.max(...visitorStats.data.map((r) => r.visitors), 1);
              return (
                <div className="rounded-2xl border p-4 sm:p-6" style={{ backgroundColor: "#FFFFFF", borderColor: "#EDE8DF" }}>
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#F5F0E8" }}>
                      <svg className="w-4 h-4" style={{ color: "#44403C" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-semibold" style={{ color: "#1C1917" }}>Daily Active Visitors</h3>
                  </div>

                  {/* Chart area */}
                  <div className="flex items-end gap-0.5 sm:gap-1 h-40 sm:h-52 overflow-x-auto pb-2">
                    {visitorStats.data.map((row) => {
                      const pct = maxV > 0 ? (row.visitors / maxV) * 100 : 0;
                      const isToday = row.date === new Date().toISOString().slice(0, 10);
                      const label = row.date.slice(5); // MM-DD
                      return (
                        <div
                          key={row.date}
                          className="group relative flex-1 min-w-[10px] flex flex-col items-center justify-end h-full"
                          title={`${row.date}: ${row.visitors} visitors`}
                        >
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                            <div className="rounded-lg px-2 py-1 text-xs font-semibold whitespace-nowrap shadow-md" style={{ backgroundColor: "#1C1917", color: "#FFFFFF" }}>
                              {row.visitors}
                            </div>
                          </div>
                          {/* Bar */}
                          <div
                            className="w-full rounded-t-sm transition-all duration-300"
                            style={{
                              height: `${Math.max(pct, row.visitors > 0 ? 2 : 0)}%`,
                              backgroundColor: isToday ? "#0EA5E9" : "#D6CFC3",
                              minHeight: row.visitors > 0 ? "4px" : "0",
                            }}
                          />
                          {/* Date label — only every ~7 days to avoid clutter */}
                          {visitorDays <= 14 && (
                            <span className="mt-1.5 text-[9px] sm:text-[10px] rotate-0 whitespace-nowrap" style={{ color: "#A8A29E" }}>{label}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* X-axis labels for wider ranges */}
                  {visitorDays > 14 && (
                    <div className="flex justify-between mt-2 px-0.5">
                      <span className="text-[10px]" style={{ color: "#A8A29E" }}>{visitorStats.data[0]?.date.slice(5)}</span>
                      <span className="text-[10px]" style={{ color: "#A8A29E" }}>
                        {visitorStats.data[Math.floor(visitorStats.data.length / 2)]?.date.slice(5)}
                      </span>
                      <span className="text-[10px]" style={{ color: "#0EA5E9", fontWeight: 600 }}>Today</span>
                    </div>
                  )}
                </div>
              );
            })() : null}

            {/* Table */}
            {!loading && visitorStats?.data && (() => {
              const maxV = Math.max(...visitorStats.data.map((r) => r.visitors), 1);
              return (
                <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "#FFFFFF", borderColor: "#EDE8DF" }}>
                  <table className="w-full">
                    <thead style={{ backgroundColor: "#FAF8F4" }}>
                      <tr>
                        <th className="text-left py-3 px-5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#A8A29E" }}>Date</th>
                        <th className="text-right py-3 px-5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#A8A29E" }}>Visitors</th>
                        <th className="py-3 px-5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#A8A29E" }}>Bar</th>
                        <th className="py-3 px-5 w-8" />
                      </tr>
                    </thead>
                    <tbody>
                      {[...visitorStats.data].reverse().map((row, idx) => {
                        const pct = Math.round((row.visitors / maxV) * 100);
                        const isToday = row.date === new Date().toISOString().slice(0, 10);
                        const isOpen = selectedDate === row.date;
                        return (
                          <React.Fragment key={row.date}>
                            <tr
                              className="transition-colors cursor-pointer"
                              style={{ borderTop: idx > 0 ? "1px solid #EDE8DF" : "none", backgroundColor: isOpen ? "#F0F9FF" : isToday ? "#F0F9FF" : "transparent" }}
                              onClick={() => row.visitors > 0 && fetchVisitorsByDate(row.date)}
                              onMouseEnter={(e) => { if (!isOpen) e.currentTarget.style.backgroundColor = "#FDFBF7"; }}
                              onMouseLeave={(e) => { if (!isOpen) e.currentTarget.style.backgroundColor = isToday ? "#F0F9FF" : "transparent"; }}
                            >
                              <td className="py-2.5 px-5 text-sm" style={{ color: isToday ? "#0284C7" : "#44403C", fontWeight: isToday ? 600 : 400 }}>
                                {row.date}{isToday ? " (today)" : ""}
                              </td>
                              <td className="text-right py-2.5 px-5">
                                <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-sm font-semibold" style={{ backgroundColor: row.visitors > 0 ? "#F0F9FF" : "#F5F5F4", color: row.visitors > 0 ? "#0369A1" : "#A8A29E" }}>
                                  {row.visitors}
                                </span>
                              </td>
                              <td className="py-2.5 px-5 w-48">
                                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#F5F0E8" }}>
                                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: isToday ? "#0EA5E9" : "#A8A29E" }} />
                                </div>
                              </td>
                              <td className="py-2.5 px-4">
                                {row.visitors > 0 && (
                                  <svg className="w-4 h-4 transition-transform duration-200" style={{ color: "#A8A29E", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                  </svg>
                                )}
                              </td>
                            </tr>

                            {/* Expanded user list */}
                            {isOpen && (
                              <tr style={{ borderTop: "1px solid #EDE8DF" }}>
                                <td colSpan={4} className="px-5 py-4" style={{ backgroundColor: "#FDFBF7" }}>
                                  {dateVisitorsLoading ? (
                                    <div className="flex items-center gap-2 py-2">
                                      <div className="w-4 h-4 rounded-full border-2 border-stone-200 border-t-stone-500 animate-spin" />
                                      <span className="text-xs" style={{ color: "#A8A29E" }}>Loading...</span>
                                    </div>
                                  ) : dateVisitors?.users?.length > 0 ? (
                                    <div className="space-y-2">
                                      <p className="text-xs font-semibold mb-3" style={{ color: "#78716C" }}>
                                        {dateVisitors.count} user{dateVisitors.count !== 1 ? "s" : ""} visited on {row.date}
                                      </p>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {dateVisitors.users.map((u) => (
                                          <div key={u._id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border" style={{ backgroundColor: "#FFFFFF", borderColor: "#EDE8DF" }}>
                                            <img
                                              src={`https://api.dicebear.com/9.x/${u.avatarStyle || "adventurer"}/svg?seed=${u._id}`}
                                              alt="avatar"
                                              className="w-8 h-8 rounded-full flex-shrink-0"
                                              style={{ backgroundColor: "#F5F0E8" }}
                                            />
                                            <div className="min-w-0">
                                              <p className="text-sm font-medium truncate" style={{ color: "#1C1917" }}>{u.emri} {u.mbiemri}</p>
                                              <p className="text-xs truncate" style={{ color: "#A8A29E" }}>{u.email}</p>
                                            </div>
                                            <div className="ml-auto flex-shrink-0 flex items-center gap-1.5">
                                              {u.isPaid && (
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ backgroundColor: "#ECFDF5", color: "#065F46" }}>PRO</span>
                                              )}
                                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={{ backgroundColor: "#EFF6FF", color: "#1E40AF" }}>{u.xp || 0} XP</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-xs py-1" style={{ color: "#A8A29E" }}>No user data found for this date.</p>
                                  )}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── ONLINE USERS TAB ── */}
        {activeTab === "online-users" && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: "#ECFDF5" }}>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "#10B981" }} />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: "#10B981" }} />
                  </span>
                  <span className="text-sm font-semibold" style={{ color: "#065F46" }}>
                    {onlineUsers.length} user{onlineUsers.length !== 1 ? "s" : ""} online
                  </span>
                </div>
              </div>
              <button
                onClick={fetchOnlineUsers}
                className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all"
                style={{ backgroundColor: "#1C1917", color: "#FFFFFF" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#292524"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#1C1917"}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.181-3.183" /></svg>
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-emerald-200 border-t-emerald-500 animate-spin" />
                  <p className="text-sm" style={{ color: "#A8A29E" }}>Loading online users...</p>
                </div>
              </div>
            ) : onlineUsers.length === 0 ? (
              <div className="rounded-2xl border p-8 sm:p-16 text-center" style={{ backgroundColor: "#FFFFFF", borderColor: "#EDE8DF" }}>
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "#F5F0E8" }}>
                  <svg className="w-8 h-8" style={{ color: "#A8A29E" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" /></svg>
                </div>
                <p className="text-sm font-medium" style={{ color: "#78716C" }}>No users currently online</p>
                <p className="text-xs mt-1" style={{ color: "#A8A29E" }}>Check back later</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {onlineUsers.map((u) => (
                  <div
                    key={u._id}
                    className="rounded-2xl border p-4 sm:p-5 transition-all duration-200 hover:shadow-md"
                    style={{ backgroundColor: "#FFFFFF", borderColor: "#EDE8DF" }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = "#D6CFC3"}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = "#EDE8DF"}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={`https://api.dicebear.com/9.x/${u.avatarStyle || "adventurer"}/svg?seed=${u._id}`}
                          alt="avatar"
                          className="w-12 h-12 rounded-full"
                          style={{ backgroundColor: "#F5F0E8" }}
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2" style={{ backgroundColor: "#10B981", borderColor: "#FFFFFF" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "#1C1917" }}>{u.emri} {u.mbiemri}</p>
                        <p className="text-xs truncate mt-0.5" style={{ color: "#A8A29E" }}>{u.email}</p>
                        <div className="flex items-center gap-3 mt-2.5">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: "#EFF6FF", color: "#1E40AF" }}>
                            XP {u.xp || 0}
                          </span>
                          <span className="text-xs font-bold flex items-center gap-1" style={{ color: "#EA580C" }}>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" /></svg>
                            {u.streakCount || 0}
                          </span>
                          {u.isPaid && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: "#ECFDF5", color: "#065F46" }}>
                              PRO
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PATH MANAGER TAB ─────────────────────────────────────────── */}
        {activeTab === "paths" && (
          <div>
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: "#1C1917" }}>Learning Paths</h2>
                <p className="text-xs mt-0.5" style={{ color: "#A8A29E" }}>{adminPaths.length} path{adminPaths.length !== 1 ? "s" : ""} total</p>
              </div>
              <div className="flex gap-2">
                {selectedAdminPath && (
                  <button
                    onClick={() => setSelectedAdminPath(null)}
                    className="px-4 py-2 rounded-xl text-xs font-medium border transition-all"
                    style={{ borderColor: "#EDE8DF", color: "#78716C" }}
                  >
                    ← Back to list
                  </button>
                )}
                <button
                  onClick={() => { setShowPathForm(true); setEditingPath(null); setPathForm({ title: "", description: "", level: "A1", language: "de", order: 0 }); }}
                  className="px-4 py-2 rounded-xl text-xs font-medium transition-all"
                  style={{ backgroundColor: "#1C1917", color: "#fff" }}
                >
                  + New Path
                </button>
              </div>
            </div>

            {/* Create / Edit Path modal */}
            {showPathForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                  <h3 className="font-bold text-gray-800 text-base mb-4">{editingPath ? "Edit Path" : "Create New Path"}</h3>
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Title *</label>
                      <input className="w-full mt-1 border rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={pathForm.title} onChange={e => setPathForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. German Basics" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Description</label>
                      <input className="w-full mt-1 border rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={pathForm.description} onChange={e => setPathForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional description" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Level *</label>
                        <select className="w-full mt-1 border rounded-xl p-2.5 text-sm focus:outline-none" value={pathForm.level} onChange={e => setPathForm(p => ({ ...p, level: e.target.value }))}>
                          {["A1","A2","B1","B2","C1","C2"].map(l => <option key={l}>{l}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Language</label>
                        <select className="w-full mt-1 border rounded-xl p-2.5 text-sm focus:outline-none" value={pathForm.language} onChange={e => setPathForm(p => ({ ...p, language: e.target.value }))}>
                          {["de","en","fr","tr","it"].map(l => <option key={l}>{l}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Order (position)</label>
                      <input type="number" className="w-full mt-1 border rounded-xl p-2.5 text-sm focus:outline-none" value={pathForm.order} onChange={e => setPathForm(p => ({ ...p, order: Number(e.target.value) }))} />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-5">
                    <button onClick={() => { setShowPathForm(false); setEditingPath(null); }} className="flex-1 py-2.5 rounded-xl border text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                    <button onClick={handleSavePath} disabled={pathSaving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                      {pathSaving ? "Saving..." : editingPath ? "Update" : "Create"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Add Round modal */}
            {showRoundForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 my-4">
                  <h3 className="font-bold text-gray-800 text-base mb-4">Add Round to "{selectedAdminPath?.title}"</h3>

                  {/* Round meta */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase">Round Title *</label>
                      <input className="w-full mt-1 border rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={roundForm.title} onChange={e => setRoundForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Greetings" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Icon (emoji)</label>
                      <input className="w-full mt-1 border rounded-xl p-2.5 text-sm focus:outline-none" value={roundForm.icon} onChange={e => setRoundForm(p => ({ ...p, icon: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">XP Reward</label>
                      <input type="number" className="w-full mt-1 border rounded-xl p-2.5 text-sm focus:outline-none" value={roundForm.xpReward} onChange={e => setRoundForm(p => ({ ...p, xpReward: Number(e.target.value) }))} />
                    </div>
                  </div>

                  {/* Exercises already added */}
                  {roundForm.exercises.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Exercises ({roundForm.exercises.length})</p>
                      <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                        {roundForm.exercises.map((ex, i) => (
                          <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 text-xs">
                            <span className="font-semibold text-blue-600 uppercase mr-2">{ex.type}</span>
                            <span className="flex-1 truncate text-gray-600">{ex.question || ex.audioText || ex.answer || "—"}</span>
                            <button onClick={() => handleRemoveExercise(i)} className="ml-2 text-red-400 hover:text-red-600 font-bold">✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Content browser modal */}
                  {contentBrowser.open && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
                      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 max-h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold text-gray-800 text-sm">Pick from existing: <span className="text-blue-600">{contentBrowser.type}</span></h4>
                          <button onClick={() => setContentBrowser(p => ({ ...p, open: false }))} className="text-gray-400 hover:text-gray-600 text-lg font-bold">✕</button>
                        </div>
                        <div className="flex gap-2 mb-3">
                          <select className="border rounded-lg p-2 text-xs focus:outline-none" value={contentBrowser.level} onChange={e => setContentBrowser(p => ({ ...p, level: e.target.value }))}>
                            {["A1","A2","B1","B2","C1","C2"].map(l => <option key={l}>{l}</option>)}
                          </select>
                          <input className="flex-1 border rounded-lg p-2 text-xs focus:outline-none" placeholder="Search..." value={contentBrowser.search} onChange={e => setContentBrowser(p => ({ ...p, search: e.target.value }))} />
                          <button onClick={searchExistingContent} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700">Search</button>
                        </div>
                        <div className="flex-1 overflow-y-auto flex flex-col gap-1.5">
                          {contentBrowser.loading && <p className="text-center text-gray-400 text-xs py-6">Loading...</p>}
                          {!contentBrowser.loading && contentBrowser.results.length === 0 && <p className="text-center text-gray-400 text-xs py-6">No results. Try a search or change level.</p>}
                          {contentBrowser.results.map(item => (
                            <button key={item._id} onClick={() => handlePickContent(item)}
                              className="text-left p-3 rounded-xl border hover:bg-blue-50 hover:border-blue-300 transition-all text-xs">
                              <span className="font-semibold text-gray-800 block truncate">
                                {item.title || item.german || item.word || item.text || item._id}
                              </span>
                              {(item.albanian || item.correctText || item.level) && (
                                <span className="text-gray-400 truncate block">
                                  {item.albanian || item.correctText || ""} · {item.level}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Add exercise form */}
                  <div className="border rounded-xl p-3 mb-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Add Exercise</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="col-span-2 flex gap-2">
                        <div className="flex-1">
                          <label className="text-xs text-gray-500">Type</label>
                          <select className="w-full mt-0.5 border rounded-lg p-2 text-xs focus:outline-none" value={currentExercise.type} onChange={e => setCurrentExercise(p => ({ ...emptyExercise, type: e.target.value }))}>
                            {EXERCISE_TYPES.map(t => <option key={t}>{t}</option>)}
                          </select>
                        </div>
                        {["listenTest","phrase","sentence","wordAudio","dictionaryWord"].includes(currentExercise.type) && (
                          <div className="flex items-end">
                            <button
                              onClick={() => { const t = currentExercise.type; setContentBrowser({ open: true, type: t, results: [], loading: false, level: "A1", search: "" }); searchExistingContent({ type: t, level: "A1", search: "" }); }}
                              className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-200 whitespace-nowrap"
                            >
                              📂 Pick from DB
                            </button>
                          </div>
                        )}
                      </div>
                      {currentExercise.contentId && (
                        <div className="col-span-2 text-xs bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 text-green-700 font-medium">
                          ✓ Linked to existing content (ID: {currentExercise.contentId.slice(-8)})
                        </div>
                      )}
                      <div className="col-span-2">
                        <label className="text-xs text-gray-500">Question / Prompt</label>
                        <input className="w-full mt-0.5 border rounded-lg p-2 text-xs focus:outline-none" value={currentExercise.question} onChange={e => setCurrentExercise(p => ({ ...p, question: e.target.value }))} placeholder="Text displayed to user" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Correct Answer *</label>
                        <input className="w-full mt-0.5 border rounded-lg p-2 text-xs focus:outline-none" value={currentExercise.answer} onChange={e => setCurrentExercise(p => ({ ...p, answer: e.target.value }))} placeholder="Correct answer" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Translation / Hint</label>
                        <input className="w-full mt-0.5 border rounded-lg p-2 text-xs focus:outline-none" value={currentExercise.translation} onChange={e => setCurrentExercise(p => ({ ...p, translation: e.target.value }))} placeholder="Hint shown to user" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-gray-500">Audio Text (for TTS)</label>
                        <input className="w-full mt-0.5 border rounded-lg p-2 text-xs focus:outline-none" value={currentExercise.audioText} onChange={e => setCurrentExercise(p => ({ ...p, audioText: e.target.value }))} placeholder="Text to convert to audio (leave blank to use question)" />
                      </div>
                      {(currentExercise.type === "wordAudio" || currentExercise.type === "dictionaryWord") && (
                        <div className="col-span-2">
                          <label className="text-xs text-gray-500">MCQ Options (comma-separated)</label>
                          <input className="w-full mt-0.5 border rounded-lg p-2 text-xs focus:outline-none" value={currentExercise.options} onChange={e => setCurrentExercise(p => ({ ...p, options: e.target.value }))} placeholder="Option1, Option2, Option3, Option4" />
                        </div>
                      )}
                      {currentExercise.type === "sentence" && (
                        <div className="col-span-2">
                          <label className="text-xs text-gray-500">Scrambled Words (comma-separated)</label>
                          <input className="w-full mt-0.5 border rounded-lg p-2 text-xs focus:outline-none" value={currentExercise.words} onChange={e => setCurrentExercise(p => ({ ...p, words: e.target.value }))} placeholder="Der, Hund, ist, groß" />
                        </div>
                      )}
                      <div>
                        <label className="text-xs text-gray-500">XP Reward</label>
                        <input type="number" className="w-full mt-0.5 border rounded-lg p-2 text-xs focus:outline-none" value={currentExercise.xpReward} onChange={e => setCurrentExercise(p => ({ ...p, xpReward: Number(e.target.value) }))} />
                      </div>
                    </div>
                    <button
                      onClick={handleAddExerciseToRound}
                      disabled={!currentExercise.answer}
                      className="w-full py-2 rounded-lg text-xs font-semibold text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 mt-1"
                    >
                      + Add Exercise to Round
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => { setShowRoundForm(false); setRoundForm({ title: "", description: "", icon: "⭐", xpReward: 20, exercises: [] }); }} className="flex-1 py-2.5 rounded-xl border text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                    <button onClick={handleSaveRound} disabled={roundSaving || roundForm.exercises.length === 0} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                      {roundSaving ? "Saving..." : "Save Round"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Path list or rounds view */}
            {!selectedAdminPath ? (
              pathsLoading ? (
                <div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-2 border-stone-300 border-t-stone-600 animate-spin" /></div>
              ) : adminPaths.length === 0 ? (
                <div className="text-center py-20 rounded-2xl border border-dashed" style={{ borderColor: "#EDE8DF" }}>
                  <p className="text-gray-400 mb-2">No paths yet</p>
                  <button onClick={() => setShowPathForm(true)} className="text-blue-500 text-sm font-semibold hover:underline">Create your first path →</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {adminPaths.map(path => (
                    <div key={path._id} className="rounded-2xl border p-4 bg-white hover:shadow-md transition-all" style={{ borderColor: "#EDE8DF" }}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white bg-blue-500 mr-2">{path.level}</span>
                          <span className="text-xs text-gray-400">{path.language}</span>
                        </div>
                        {!path.isActive && <span className="text-xs text-red-400 font-semibold">Inactive</span>}
                      </div>
                      <h3 className="font-bold text-gray-800 text-sm mb-1 line-clamp-1">{path.title}</h3>
                      {path.description && <p className="text-xs text-gray-400 mb-2 line-clamp-2">{path.description}</p>}
                      <p className="text-xs text-gray-500 mb-3">{path.rounds?.length || 0} rounds · {path.totalXp || 0} XP total</p>
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedAdminPath(path)} className="flex-1 py-1.5 rounded-lg text-xs font-semibold border hover:bg-gray-50" style={{ borderColor: "#EDE8DF", color: "#1C1917" }}>Manage Rounds</button>
                        <button onClick={() => handleEditPath(path)} className="py-1.5 px-3 rounded-lg text-xs font-semibold border hover:bg-blue-50 text-blue-600" style={{ borderColor: "#DBEAFE" }}>Edit</button>
                        <button onClick={() => handleDeletePath(path._id)} className="py-1.5 px-3 rounded-lg text-xs font-semibold border hover:bg-red-50 text-red-500" style={{ borderColor: "#FEE2E2" }}>Del</button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              /* Rounds view */
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-800">{selectedAdminPath.title}</h3>
                    <p className="text-xs text-gray-400">{selectedAdminPath.rounds?.length || 0} rounds · {selectedAdminPath.level} · {selectedAdminPath.language}</p>
                  </div>
                  <button
                    onClick={() => setShowRoundForm(true)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all"
                    style={{ backgroundColor: "#1C1917" }}
                  >
                    + Add Round
                  </button>
                </div>

                {(!selectedAdminPath.rounds || selectedAdminPath.rounds.length === 0) ? (
                  <div className="text-center py-16 rounded-2xl border border-dashed" style={{ borderColor: "#EDE8DF" }}>
                    <p className="text-gray-400 mb-2">No rounds yet</p>
                    <button onClick={() => setShowRoundForm(true)} className="text-blue-500 text-sm font-semibold hover:underline">Add the first round →</button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {selectedAdminPath.rounds.map((round, idx) => (
                      <div key={round._id || idx} className="rounded-2xl border p-4 bg-white" style={{ borderColor: "#EDE8DF" }}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-lg flex-shrink-0">
                              {round.icon || "⭐"}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800 text-sm">Round {idx + 1}: {round.title}</p>
                              <p className="text-xs text-gray-400">{round.exercises?.length || 0} exercises · {round.xpReward} XP</p>
                            </div>
                          </div>
                          <button onClick={() => handleDeleteRound(idx)} className="text-xs text-red-400 hover:text-red-600 font-semibold px-2 py-1 rounded-lg hover:bg-red-50">Delete</button>
                        </div>
                        {round.exercises && round.exercises.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {round.exercises.map((ex, ei) => (
                              <span key={ei} className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-600 border border-indigo-100">
                                {ex.type}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {/* ──────────────────────────────────────────────────────────────── */}

      </div>
    </div>
  );
};

export default Admin;