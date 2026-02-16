"use client"

import { useState, useEffect } from "react"
import { academyService } from "../services/api"

const Academy = () => {
  const [academies, setAcademies] = useState([])
  const [selectedAcademy, setSelectedAcademy] = useState(null)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [view, setView] = useState("academies")
  const [loading, setLoading] = useState(true)
  const [leaderboard, setLeaderboard] = useState([])
  const [userRole, setUserRole] = useState(null)
  const [userId, setUserId] = useState(null)
  const [inviteLink, setInviteLink] = useState("")
  const [showInviteLink, setShowInviteLink] = useState(false)

  const [academyForm, setAcademyForm] = useState({ name: "", description: "" })
  const [groupForm, setGroupForm] = useState({ name: "", description: "", teacherId: "" })
  const [taskForm, setTaskForm] = useState({ title: "", description: "", xpReward: 50, dueDate: "" })
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteSending, setInviteSending] = useState(false)

  const [teacherCode, setTeacherCode] = useState("")
  const [joiningByCode, setJoiningByCode] = useState(false)

  const [showCreateAcademy, setShowCreateAcademy] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [showInviteForm, setShowInviteForm] = useState(false)
  
  // NEW: PIN unlock state
  const [showPinUnlock, setShowPinUnlock] = useState(false)
  const [teacherPin, setTeacherPin] = useState("")
  const [unlocking, setUnlocking] = useState(false)
  const [generatedPin, setGeneratedPin] = useState("")
  
  // NEW: Available teachers for group creation
  const [availableTeachers, setAvailableTeachers] = useState([])

  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setUserRole(user.role || "user")
        setUserId(user._id || user.id)
      } catch (e) {
        setUserRole("user")
      }
    }
    fetchAcademies()
    if (isAcademyAdmin) {
      fetchTeachers()
    }
  }, [])

  const fetchTeachers = async () => {
    // You'll need to add this endpoint to your backend
    // For now, you can manually add teachers or fetch all users with role="teacher"
    // This is placeholder - implement based on your user management
    setAvailableTeachers([])
  }

  const fetchAcademies = async () => {
    try {
      setLoading(true)
      const response = await academyService.getAllAcademies()
      setAcademies(response.data || response || [])
    } catch (error) {
      alert("Failed to fetch academies: " + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  const createAcademy = async (e) => {
    e.preventDefault()
    try {
      await academyService.createAcademy(academyForm)
      setAcademyForm({ name: "", description: "" })
      setShowCreateAcademy(false)
      await fetchAcademies()
      alert("Academy created successfully!")
    } catch (error) {
      alert(error.response?.data?.message || "Error creating academy")
    }
  }

  const createGroup = async (e) => {
    e.preventDefault()
    if (!groupForm.teacherId) {
      alert("Please select a teacher for this group")
      return
    }
    try {
      const response = await academyService.createGroup(selectedAcademy._id, groupForm)
      
      // Show the generated PIN to admin
      if (response.teacherPin) {
        setGeneratedPin(response.teacherPin)
        alert(`Group created! Teacher PIN: ${response.teacherPin}\n\nPlease share this PIN with the teacher privately.`)
      }
      
      setGroupForm({ name: "", description: "", teacherId: "" })
      setShowCreateGroup(false)
      await fetchAcademies()
      const updatedAcademies = await academyService.getAllAcademies()
      const data = updatedAcademies.data || updatedAcademies || []
      const updated = data.find((a) => a._id === selectedAcademy._id)
      if (updated) setSelectedAcademy(updated)
    } catch (error) {
      alert(error.response?.data?.message || "Error creating group")
    }
  }

  const unlockGroupWithPin = async (e) => {
    e.preventDefault()
    if (!teacherPin.trim() || teacherPin.length !== 6) {
      alert("Please enter a valid 6-digit PIN")
      return
    }
    try {
      setUnlocking(true)
      await academyService.unlockGroupWithPin(selectedAcademy._id, selectedGroup._id, teacherPin)
      setTeacherPin("")
      setShowPinUnlock(false)
      await fetchAcademies()
      const updatedAcademies = await academyService.getAllAcademies()
      const data = updatedAcademies.data || updatedAcademies || []
      const updated = data.find((a) => a._id === selectedAcademy._id)
      if (updated) {
        setSelectedAcademy(updated)
        const updatedGroup = updated.groups.find(g => g._id === selectedGroup._id)
        if (updatedGroup) setSelectedGroup(updatedGroup)
      }
      alert("Group unlocked successfully! You can now manage this group.")
    } catch (error) {
      alert(error.response?.data?.message || "Invalid PIN code")
    } finally {
      setUnlocking(false)
    }
  }

  const inviteStudent = async (e) => {
    e.preventDefault()
    try {
      setInviteSending(true)
      const response = await academyService.inviteStudent(selectedAcademy._id, selectedGroup._id, inviteEmail)
      setInviteEmail("")
      if (response.inviteLink) {
        setInviteLink(response.inviteLink)
        setShowInviteLink(true)
      }
      await fetchAcademies()
      if (response.emailSent) {
        alert("Invitation email sent to " + inviteEmail + " successfully!")
      } else {
        alert("Invitation created but email could not be sent. Share the invite link manually.")
      }
    } catch (error) {
      alert(error.response?.data?.message || "Error sending invitation")
    } finally {
      setInviteSending(false)
    }
  }

  const handleJoinByCode = async (e) => {
    e.preventDefault()
    if (!teacherCode.trim()) {
      alert("Please enter the teacher code")
      return
    }
    try {
      setJoiningByCode(true)
      const response = await academyService.joinByTeacherCode(teacherCode.trim().toUpperCase())
      setTeacherCode("")
      await fetchAcademies()
      alert(response.message || "Joined group successfully!")
    } catch (error) {
      alert(error.response?.data?.message || "Invalid code or error joining")
    } finally {
      setJoiningByCode(false)
    }
  }

  const acceptInvitation = async (groupId) => {
    try {
      await academyService.acceptInvitation(selectedAcademy._id, groupId)
      await fetchAcademies()
      alert("Joined group successfully!")
    } catch (error) {
      alert(error.response?.data?.message || "Error joining group")
    }
  }

  const createTask = async (e) => {
    e.preventDefault()
    try {
      await academyService.createTask(selectedAcademy._id, selectedGroup._id, taskForm)
      setTaskForm({ title: "", description: "", xpReward: 50, dueDate: "" })
      setShowCreateTask(false)
      await fetchAcademies()
      alert("Task created successfully!")
    } catch (error) {
      alert(error.response?.data?.message || "Error creating task")
    }
  }

  const completeTask = async (taskId) => {
    try {
      const response = await academyService.completeTask(selectedAcademy._id, selectedGroup._id, taskId)
      await fetchAcademies()
      alert(response.message || "Task completed successfully!")
    } catch (error) {
      alert(error.response?.data?.message || "Error completing task")
    }
  }

  const fetchLeaderboard = async () => {
    try {
      const response = await academyService.getGroupLeaderboard(selectedAcademy._id, selectedGroup._id)
      setLeaderboard(response.data || response || [])
    } catch (error) {
      // silent fail
    }
  }

  const getLevelColor = (level) => {
    if (level >= 20) return "from-amber-400 to-yellow-500 text-amber-950"
    if (level >= 15) return "from-rose-400 to-pink-500 text-white"
    if (level >= 10) return "from-orange-400 to-red-500 text-white"
    if (level >= 5) return "from-sky-400 to-blue-500 text-white"
    return "from-emerald-400 to-green-500 text-white"
  }

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink)
    alert("Invite link copied!")
  }

  const copyTeacherCode = (code) => {
    navigator.clipboard.writeText(code)
    alert("Code copied!")
  }

  const getTeacherName = (group) => {
    if (group.teacher && typeof group.teacher === "object") {
      return `${group.teacher.emri || ""} ${group.teacher.mbiemri || ""}`.trim()
    }
    return "Teacher"
  }

  const isAcademyAdmin = userRole === "academyAdmin" || userRole === "admin"
  const isTeacher = userRole === "teacher"

  const isGroupTeacher = (group) => {
    return (
      group?.teacher?.toString() === userId ||
      group?.teacher === userId ||
      (typeof group?.teacher === "object" && group?.teacher?._id === userId)
    )
  }

  const breadcrumbs = []
  breadcrumbs.push({ label: "Academies", action: () => { setSelectedAcademy(null); setSelectedGroup(null); setView("academies") } })
  if (selectedAcademy) {
    breadcrumbs.push({ label: selectedAcademy.name, action: () => { setSelectedGroup(null); setView("groups") } })
  }
  if (selectedGroup) {
    breadcrumbs.push({ label: selectedGroup.name, action: () => setView("tasks") })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 animate-pulse" />
            <div className="absolute inset-0 h-14 w-14 rounded-2xl border-2 border-transparent border-t-white/40 animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-800 tracking-tight">Loading</p>
            <p className="text-xs text-gray-400 mt-1">Please wait...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/80">
      {/* Header */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-white/70 border-b border-gray-200/60">
        <div className="max-w-6xl mx-auto px-5 py-3.5">
          <div className="flex items-center justify-between">
            <nav className="flex items-center gap-1 text-sm min-w-0" aria-label="Breadcrumb">
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1 min-w-0">
                  {i > 0 && (
                    <svg className="h-3.5 w-3.5 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                  {i < breadcrumbs.length - 1 ? (
                    <button
                      onClick={crumb.action}
                      className="text-gray-400 hover:text-indigo-600 transition-colors truncate max-w-[140px] font-medium"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span className="font-bold text-gray-900 truncate max-w-[200px]">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>

            <span
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase ${
                isAcademyAdmin
                  ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200"
                  : isTeacher
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200"
                  : "bg-gray-100 text-gray-500 border border-gray-200"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isAcademyAdmin || isTeacher ? "bg-white/60" : "bg-gray-400"}`} />
              {isAcademyAdmin ? "Admin" : isTeacher ? "Teacher" : "Student"}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-6">
        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mb-8 p-1 bg-white rounded-2xl shadow-sm border border-gray-100 w-fit">
          {[
            { key: "academies", label: "Academies", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253", show: true },
            { key: "groups", label: "Groups", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", show: !!selectedAcademy },
            { key: "tasks", label: "Tasks", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4", show: !!selectedGroup },
            { key: "leaderboard", label: "Leaderboard", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", show: !!selectedGroup },
          ]
            .filter((t) => t.show)
            .map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setView(tab.key)
                  if (tab.key === "leaderboard") fetchLeaderboard()
                }}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 ${
                  view === tab.key
                    ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200/50"
                    : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
        </div>

        {/* Join by Code (students only) */}
        {!isAcademyAdmin && !isTeacher && view === "academies" && (
          <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 p-[1px]">
            <div className="rounded-[15px] bg-white p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-200">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Join with Teacher Code</p>
                  <p className="text-xs text-gray-400">Enter the 6-character code from your teacher</p>
                </div>
              </div>
              <form onSubmit={handleJoinByCode} className="flex gap-3">
                <input
                  type="text"
                  value={teacherCode}
                  onChange={(e) => setTeacherCode(e.target.value.toUpperCase())}
                  className="flex-1 h-12 px-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-base font-mono font-black tracking-[0.3em] uppercase text-center text-indigo-600 placeholder:text-gray-300 placeholder:font-normal placeholder:tracking-normal placeholder:text-sm focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 transition-all"
                  placeholder="ENTER CODE"
                  maxLength={6}
                  required
                />
                <button
                  type="submit"
                  disabled={joiningByCode}
                  className="h-12 px-6 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                >
                  {joiningByCode ? (
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : "Join"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Teacher PIN Unlock (teachers only, when viewing a group) */}
        {isTeacher && selectedGroup && !selectedGroup.teacherUnlocked && isGroupTeacher(selectedGroup) && (
          <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 p-[1px]">
            <div className="rounded-[15px] bg-white p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-200">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Unlock Group</p>
                  <p className="text-xs text-gray-400">Enter your 6-digit PIN to access this group</p>
                </div>
              </div>
              <form onSubmit={unlockGroupWithPin} className="flex gap-3">
                <input
                  type="text"
                  value={teacherPin}
                  onChange={(e) => setTeacherPin(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 h-12 px-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-base font-mono font-black tracking-[0.3em] text-center text-amber-600 placeholder:text-gray-300 placeholder:font-normal placeholder:tracking-normal placeholder:text-sm focus:outline-none focus:border-amber-300 focus:ring-4 focus:ring-amber-50 transition-all"
                  placeholder="ENTER PIN"
                  maxLength={6}
                  required
                />
                <button
                  type="submit"
                  disabled={unlocking}
                  className="h-12 px-6 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-amber-200 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50"
                >
                  {unlocking ? (
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : "Unlock"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ACADEMIES VIEW - Keep existing code but update role checks */}
        {view === "academies" && (
          <div className="space-y-6">
            {isAcademyAdmin && (
              <div>
                <button
                  onClick={() => setShowCreateAcademy(!showCreateAcademy)}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${
                    showCreateAcademy
                      ? "bg-gray-900 text-white shadow-lg shadow-gray-300"
                      : "bg-white text-gray-700 border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50"
                  }`}
                >
                  <svg className={`h-4 w-4 transition-transform duration-200 ${showCreateAcademy ? "rotate-45" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {showCreateAcademy ? "Close" : "Create New Academy"}
                </button>

                {showCreateAcademy && (
                  <div className="mt-4 rounded-2xl bg-white border border-gray-100 p-6 shadow-xl shadow-gray-100/50">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="h-8 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-violet-600" />
                      <h3 className="text-base font-bold text-gray-900">New Academy</h3>
                    </div>
                    <form onSubmit={createAcademy} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-[0.15em]">Name</label>
                        <input
                          type="text"
                          value={academyForm.name}
                          onChange={(e) => setAcademyForm({ ...academyForm, name: e.target.value })}
                          className="w-full h-12 px-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-medium placeholder:text-gray-300 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 transition-all"
                          placeholder="Enter academy name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-[0.15em]">Description</label>
                        <textarea
                          value={academyForm.description}
                          onChange={(e) => setAcademyForm({ ...academyForm, description: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-medium placeholder:text-gray-300 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 transition-all resize-none"
                          placeholder="Enter description (optional)"
                          rows={2}
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full h-12 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all duration-200"
                      >
                        Create Academy
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* Academy list - keep existing rendering */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">My Academies</h2>
                <span className="text-xs font-semibold text-gray-300 bg-gray-50 px-3 py-1 rounded-full">{academies.length} total</span>
              </div>

              {/* Keep existing academy rendering code */}
              {academies.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {academies.map((academy, idx) => (
                    <button
                      key={academy._id}
                      onClick={() => {
                        setSelectedAcademy(academy)
                        setView("groups")
                      }}
                      className="group text-left rounded-2xl bg-white border border-gray-100 p-5 hover:shadow-xl hover:shadow-indigo-100/50 hover:-translate-y-1 hover:border-indigo-200 transition-all duration-300"
                    >
                      {/* Keep existing academy card content */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className={`flex items-center justify-center h-11 w-11 rounded-xl bg-gradient-to-br ${
                          ['from-indigo-400 to-violet-500', 'from-rose-400 to-pink-500', 'from-amber-400 to-orange-500', 'from-emerald-400 to-teal-500', 'from-sky-400 to-blue-500'][idx % 5]
                        } shadow-lg shrink-0`}>
                          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <span className="text-[10px] font-semibold text-gray-300 bg-gray-50 px-2 py-0.5 rounded-md">{new Date(academy.createdAt).toLocaleDateString("en-US")}</span>
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mb-1.5 truncate">{academy.name}</h3>
                      <p className="text-xs text-gray-400 mb-4 line-clamp-2 leading-relaxed">{academy.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 text-[11px] font-semibold text-gray-500">
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {academy.groups?.length || 0} groups
                        </span>
                        <svg className="h-4 w-4 text-gray-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-gray-200 bg-white">
                  <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 mb-4">
                    <svg className="h-7 w-7 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <p className="text-base font-bold text-gray-900 mb-1">No academies yet</p>
                  <p className="text-xs text-gray-400 mb-5">Start by creating your first academy</p>
                  {isAcademyAdmin && (
                    <button
                      onClick={() => setShowCreateAcademy(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Academy
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* GROUPS VIEW - Update with teacher selection and PIN display */}
        {view === "groups" && selectedAcademy && (
          <div className="space-y-6">
            {isAcademyAdmin && (
              <div>
                <button
                  onClick={() => setShowCreateGroup(!showCreateGroup)}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${
                    showCreateGroup
                      ? "bg-gray-900 text-white shadow-lg shadow-gray-300"
                      : "bg-white text-gray-700 border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50"
                  }`}
                >
                  <svg className={`h-4 w-4 transition-transform duration-200 ${showCreateGroup ? "rotate-45" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {showCreateGroup ? "Close" : "Create New Group"}
                </button>

                {showCreateGroup && (
                  <div className="mt-4 rounded-2xl bg-white border border-gray-100 p-6 shadow-xl shadow-gray-100/50">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="h-8 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-violet-600" />
                      <h3 className="text-base font-bold text-gray-900">New Group</h3>
                    </div>
                    <form onSubmit={createGroup} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-[0.15em]">Group Name</label>
                        <input
                          type="text"
                          value={groupForm.name}
                          onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                          className="w-full h-12 px-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-medium placeholder:text-gray-300 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 transition-all"
                          placeholder="Enter group name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-[0.15em]">Description</label>
                        <textarea
                          value={groupForm.description}
                          onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-medium placeholder:text-gray-300 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 transition-all resize-none"
                          placeholder="Enter description (optional)"
                          rows={2}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-[0.15em]">Assign Teacher</label>
                        <input
                          type="text"
                          value={groupForm.teacherId}
                          onChange={(e) => setGroupForm({ ...groupForm, teacherId: e.target.value })}
                          className="w-full h-12 px-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-medium placeholder:text-gray-300 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 transition-all"
                          placeholder="Enter teacher user ID"
                          required
                        />
                        <p className="text-xs text-gray-400 mt-1">Enter the teacher's user ID. A PIN will be generated for them.</p>
                      </div>
                      <button
                        type="submit"
                        className="w-full h-12 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all duration-200"
                      >
                        Create Group
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* Group list - update to show lock status */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">Groups</h2>
                <span className="text-xs font-semibold text-gray-300 bg-gray-50 px-3 py-1 rounded-full">{selectedAcademy.groups?.length || 0} total</span>
              </div>

              {selectedAcademy.groups?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedAcademy.groups.map((group, idx) => (
                    <div
                      key={group._id}
                      onClick={() => {
                        setSelectedGroup(group)
                        setView("tasks")
                      }}
                      className="group rounded-2xl bg-white border border-gray-100 p-5 hover:shadow-xl hover:shadow-indigo-100/50 hover:-translate-y-1 hover:border-indigo-200 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br ${
                            ['from-indigo-400 to-violet-500', 'from-rose-400 to-pink-500', 'from-amber-400 to-orange-500', 'from-emerald-400 to-teal-500'][idx % 4]
                          } shadow-lg shrink-0`}>
                            <svg className="h-4.5 w-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{group.name}</h3>
                            {!group.teacherUnlocked && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 mt-0.5">
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Locked
                              </span>
                            )}
                          </div>
                        </div>
                        {group.teacherCode && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              copyTeacherCode(group.teacherCode)
                            }}
                            className="shrink-0 px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-lg text-[11px] font-mono font-black tracking-widest text-indigo-600 hover:from-indigo-100 hover:to-violet-100 transition-all"
                            title="Click to copy code"
                          >
                            {group.teacherCode}
                          </button>
                        )}
                      </div>

                      {group.description && (
                        <p className="text-xs text-gray-400 mb-3 line-clamp-2 leading-relaxed">{group.description}</p>
                      )}

                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center justify-center h-5 w-5 rounded-full bg-gray-50">
                          <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <span className="text-xs text-gray-400">
                          Teacher: <span className="font-semibold text-gray-700">{getTeacherName(group)}</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 text-[11px] font-semibold text-gray-500">
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 5.197V21" />
                            </svg>
                            {group.members?.length || 0}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 text-[11px] font-semibold text-gray-500">
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            {group.tasks?.length || 0}
                          </span>
                        </div>
                        <svg className="h-4 w-4 text-gray-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-gray-200 bg-white">
                  <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 mb-4">
                    <svg className="h-7 w-7 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="text-base font-bold text-gray-900 mb-1">No groups yet</p>
                  <p className="text-xs text-gray-400 mb-5">Create the first group for this academy</p>
                  {isAcademyAdmin && (
                    <button
                      onClick={() => setShowCreateGroup(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Group
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TASKS VIEW - Update teacher checks and add locked group warning */}
        {view === "tasks" && selectedGroup && (
          <div className="space-y-5">
            {/* Keep existing group info header and rest of tasks view */}
            {/* Just update isGroupAdmin checks to isGroupTeacher */}
            {/* The rest of the tasks view stays the same */}
            
            {/* Group info header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 p-5 text-white">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-20 -translate-x-20" />
              <div className="relative flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm shrink-0">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold truncate">{selectedGroup.name}</h3>
                    <p className="text-xs text-white/70 mt-0.5">
                      Teacher: <span className="font-semibold text-white/90">{getTeacherName(selectedGroup)}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedGroup.teacherCode && (
                    <button
                      onClick={() => copyTeacherCode(selectedGroup.teacherCode)}
                      className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-lg text-[11px] font-mono font-black tracking-widest hover:bg-white/30 transition-colors"
                    >
                      {selectedGroup.teacherCode}
                    </button>
                  )}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-[11px] font-semibold">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 5.197V21" />
                    </svg>
                    {selectedGroup.members?.length || 0} students
                  </span>
                </div>
              </div>
            </div>

            {/* Teacher action buttons (only if group is unlocked) */}
            {isGroupTeacher(selectedGroup) && selectedGroup.teacherUnlocked && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setShowCreateTask(!showCreateTask); setShowInviteForm(false) }}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${
                    showCreateTask
                      ? "bg-gray-900 text-white shadow-lg"
                      : "bg-white text-gray-700 border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                  }`}
                >
                  <svg className={`h-3.5 w-3.5 transition-transform duration-200 ${showCreateTask ? "rotate-45" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Task
                </button>
                <button
                  onClick={() => { setShowInviteForm(!showInviteForm); setShowCreateTask(false) }}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${
                    showInviteForm
                      ? "bg-gray-900 text-white shadow-lg"
                      : "bg-white text-gray-700 border-2 border-dashed border-gray-200 hover:border-emerald-300 hover:text-emerald-600"
                  }`}
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Invite Students
                </button>
              </div>
            )}

            {/* Create task form (keep existing but update check) */}
            {showCreateTask && isGroupTeacher(selectedGroup) && selectedGroup.teacherUnlocked && (
              <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-xl shadow-gray-100/50">
                {/* Keep existing task form code */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-8 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-violet-600" />
                  <h4 className="text-base font-bold text-gray-900">New Task</h4>
                </div>
                <form onSubmit={createTask} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-[0.15em]">Title</label>
                    <input
                      type="text"
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                      className="w-full h-12 px-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-medium placeholder:text-gray-300 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 transition-all"
                      placeholder="Enter task title"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-[0.15em]">Description</label>
                    <textarea
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-medium placeholder:text-gray-300 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 transition-all resize-none"
                      placeholder="Enter description"
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-[0.15em]">XP Reward</label>
                      <input
                        type="number"
                        value={taskForm.xpReward}
                        onChange={(e) => setTaskForm({ ...taskForm, xpReward: Number.parseInt(e.target.value) })}
                        className="w-full h-12 px-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 transition-all"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-[0.15em]">Due Date</label>
                      <input
                        type="date"
                        value={taskForm.dueDate}
                        onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                        className="w-full h-12 px-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 transition-all"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all duration-200"
                  >
                    Create Task
                  </button>
                </form>
              </div>
            )}

            {/* Invite form (keep existing but update check) */}
            {showInviteForm && isGroupTeacher(selectedGroup) && selectedGroup.teacherUnlocked && (
              <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-xl shadow-gray-100/50">
                {/* Keep existing invite form code */}
                <div className="flex items-center gap-3 mb-1">
                  <div className="h-8 w-1 rounded-full bg-gradient-to-b from-emerald-400 to-teal-500" />
                  <h4 className="text-base font-bold text-gray-900">Invite Student</h4>
                </div>
                <p className="text-xs text-gray-400 mb-5 ml-4">Enter student email to send invitation.</p>
                <form onSubmit={inviteStudent} className="flex gap-3">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1 h-12 px-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-medium placeholder:text-gray-300 focus:outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50 transition-all"
                    placeholder="email@example.com"
                    required
                  />
                  <button
                    type="submit"
                    disabled={inviteSending}
                    className="h-12 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-200 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {inviteSending ? (
                      <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : "Send"}
                  </button>
                </form>
                {showInviteLink && inviteLink && (
                  <div className="mt-5 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl">
                    <p className="text-xs font-bold text-emerald-700 mb-2.5">Invite link generated!</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inviteLink}
                        readOnly
                        className="flex-1 h-10 px-3 bg-white border border-emerald-200 rounded-lg text-xs font-mono text-emerald-700"
                      />
                      <button
                        onClick={copyInviteLink}
                        className="h-10 px-4 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                    <button
                      onClick={() => setShowInviteLink(false)}
                      className="mt-2.5 text-[11px] font-semibold text-emerald-500 hover:text-emerald-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tasks list - keep existing, just update permissions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">Tasks</h2>
                <span className="text-xs font-semibold text-gray-300 bg-gray-50 px-3 py-1 rounded-full">{selectedGroup.tasks?.length || 0} total</span>
              </div>

              {selectedGroup.tasks?.length > 0 ? (
                <div className="space-y-3">
                  {selectedGroup.tasks.map((task) => {
                    const isCompleted = task.completedBy?.some((comp) => comp.userId?.toString() === userId)
                    return (
                      <div
                        key={task._id}
                        className={`rounded-2xl border-2 p-5 transition-all duration-300 ${
                          isCompleted
                            ? "border-emerald-200 bg-gradient-to-r from-emerald-50/80 to-teal-50/50"
                            : "border-gray-100 bg-white hover:shadow-lg hover:shadow-gray-100/80 hover:-translate-y-0.5 hover:border-gray-200"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2.5 mb-1.5">
                              {isCompleted && (
                                <div className="flex items-center justify-center h-6 w-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-200 shrink-0">
                                  <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                              <h3 className={`text-sm font-bold truncate ${isCompleted ? "text-emerald-700" : "text-gray-900"}`}>
                                {task.title}
                              </h3>
                            </div>
                            {task.description && (
                              <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{task.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-[11px] font-black text-amber-700">
                              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              {task.xpReward} XP
                            </span>
                            {!isCompleted && selectedGroup.teacherUnlocked && (
                              <button
                                onClick={() => completeTask(task._id)}
                                className="h-9 px-4 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all duration-200"
                              >
                                Complete
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                          {task.dueDate && (
                            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400">
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {new Date(task.dueDate).toLocaleDateString("en-US")}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400">
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 5.197V21" />
                            </svg>
                            {task.completedBy?.length || 0} completed
                          </span>
                          {isCompleted && (
                            <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Completed
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-gray-200 bg-white">
                  <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 mb-4">
                    <svg className="h-7 w-7 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <p className="text-base font-bold text-gray-900 mb-1">No tasks yet</p>
                  <p className="text-xs text-gray-400 mb-5">Create the first task for this group</p>
                  {isGroupTeacher(selectedGroup) && selectedGroup.teacherUnlocked && (
                    <button
                      onClick={() => setShowCreateTask(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Task
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* LEADERBOARD VIEW - Keep existing, no changes needed */}
        {view === "leaderboard" && selectedGroup && (
          <div>
            {/* Keep existing leaderboard code */}
          </div>
        )}
      </div>
    </div>
  )
}

export default Academy