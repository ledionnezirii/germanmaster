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
  const [groupForm, setGroupForm] = useState({ name: "", description: "" })
  const [taskForm, setTaskForm] = useState({ title: "", description: "", xpReward: 50, dueDate: "" })
  const [inviteEmail, setInviteEmail] = useState("")

  useEffect(() => {
    // Get user from localStorage
    const userStr = localStorage.getItem("user")
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setUserRole(user.role || "user")
        setUserId(user._id || user.id)
        console.log("User loaded:", { role: user.role, id: user._id })
      } catch (e) {
        console.error("Error parsing user:", e)
        setUserRole("user")
      }
    }
    fetchAcademies()
  }, [])

  const fetchAcademies = async () => {
    try {
      setLoading(true)
      const response = await academyService.getAllAcademies()
      console.log("Academies response:", response)
      setAcademies(response.data || response || [])
    } catch (error) {
      console.error("Error fetching academies:", error)
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
      await fetchAcademies()
      alert("Academy created successfully!")
    } catch (error) {
      console.error("Create academy error:", error)
      alert(error.response?.data?.message || "Error creating academy")
    }
  }

  const createGroup = async (e) => {
    e.preventDefault()
    try {
      await academyService.createGroup(selectedAcademy._id, groupForm)
      setGroupForm({ name: "", description: "" })
      await fetchAcademies()
      alert("Group created successfully!")
    } catch (error) {
      console.error("Create group error:", error)
      alert(error.response?.data?.message || "Error creating group")
    }
  }

  const inviteStudent = async (e) => {
    e.preventDefault()
    try {
      const response = await academyService.inviteStudent(selectedAcademy._id, selectedGroup._id, inviteEmail)
      setInviteEmail("")
      if (response.inviteLink) {
        setInviteLink(response.inviteLink)
        setShowInviteLink(true)
      }
      await fetchAcademies()
      alert("Invitation sent successfully! Share the invite link with the student.")
    } catch (error) {
      console.error("Invite error:", error)
      alert(error.response?.data?.message || "Error sending invitation")
    }
  }

  const acceptInvitation = async (groupId) => {
    try {
      await academyService.acceptInvitation(selectedAcademy._id, groupId)
      await fetchAcademies()
      alert("Joined group successfully!")
    } catch (error) {
      console.error("Accept invitation error:", error)
      alert(error.response?.data?.message || "Error joining group")
    }
  }

  const createTask = async (e) => {
    e.preventDefault()
    try {
      await academyService.createTask(selectedAcademy._id, selectedGroup._id, taskForm)
      setTaskForm({ title: "", description: "", xpReward: 50, dueDate: "" })
      await fetchAcademies()
      alert("Task created successfully!")
    } catch (error) {
      console.error("Create task error:", error)
      alert(error.response?.data?.message || "Error creating task")
    }
  }

  const completeTask = async (taskId) => {
    try {
      const response = await academyService.completeTask(selectedAcademy._id, selectedGroup._id, taskId)
      await fetchAcademies()
      alert(response.message || "Task completed successfully!")
    } catch (error) {
      console.error("Complete task error:", error)
      alert(error.response?.data?.message || "Error completing task")
    }
  }

  const fetchLeaderboard = async () => {
    try {
      const response = await academyService.getGroupLeaderboard(selectedAcademy._id, selectedGroup._id)
      setLeaderboard(response.data || response || [])
    } catch (error) {
      console.error("Error fetching leaderboard:", error)
    }
  }

  const getLevelColor = (level) => {
    if (level >= 20) return "bg-purple-600"
    if (level >= 15) return "bg-red-600"
    if (level >= 10) return "bg-orange-600"
    if (level >= 5) return "bg-blue-600"
    return "bg-green-600"
  }

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink)
    alert("Invite link copied to clipboard!")
  }

  // Check if user is academy admin
  const isAcademyAdmin = userRole === "academyAdmin" || userRole === "admin"

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-2xl font-bold text-indigo-600">Loading Academy...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-4">
            Academy Management
          </h1>
          <p className="text-gray-600 text-lg">Manage academies, groups, tasks, and track progress</p>
          <div className="mt-2">
            <span
              className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${
                isAcademyAdmin ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"
              }`}
            >
              {isAcademyAdmin ? "Academy Admin" : "Student"} ({userRole})
            </span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-4 mb-8 overflow-x-auto">
          <button
            onClick={() => setView("academies")}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              view === "academies" ? "bg-indigo-600 text-white shadow-lg" : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Academies
          </button>
          {selectedAcademy && (
            <button
              onClick={() => setView("groups")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                view === "groups" ? "bg-indigo-600 text-white shadow-lg" : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Groups
            </button>
          )}
          {selectedGroup && (
            <>
              <button
                onClick={() => setView("tasks")}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  view === "tasks" ? "bg-indigo-600 text-white shadow-lg" : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Tasks
              </button>
              <button
                onClick={() => {
                  setView("leaderboard")
                  fetchLeaderboard()
                }}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  view === "leaderboard"
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Leaderboard
              </button>
            </>
          )}
        </div>

        {/* Academies View */}
        {view === "academies" && (
          <div className="space-y-6">
            {isAcademyAdmin && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Create New Academy</h2>
                <form onSubmit={createAcademy} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Academy Name</label>
                    <input
                      type="text"
                      value={academyForm.name}
                      onChange={(e) => setAcademyForm({ ...academyForm, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter academy name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={academyForm.description}
                      onChange={(e) => setAcademyForm({ ...academyForm, description: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter description"
                      rows="3"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Create Academy
                  </button>
                </form>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">My Academies</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {academies.map((academy) => (
                  <div
                    key={academy._id}
                    onClick={() => {
                      setSelectedAcademy(academy)
                      setView("groups")
                    }}
                    className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer hover:border-indigo-500"
                  >
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{academy.name}</h3>
                    <p className="text-gray-600 text-sm mb-3">{academy.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-indigo-600 font-medium">{academy.groups?.length || 0} Groups</span>
                      <span className="text-gray-500">{new Date(academy.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
              {academies.length === 0 && (
                <p className="text-gray-500 text-center py-8">No academies yet. Create your first academy!</p>
              )}
            </div>
          </div>
        )}

        {/* Groups View */}
        {view === "groups" && selectedAcademy && (
          <div className="space-y-6">
            <button
              onClick={() => {
                setSelectedAcademy(null)
                setView("academies")
              }}
              className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-2"
            >
              ← Back to Academies
            </button>

            {isAcademyAdmin && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Create New Group</h2>
                <form onSubmit={createGroup} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
                    <input
                      type="text"
                      value={groupForm.name}
                      onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter group name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={groupForm.description}
                      onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter description"
                      rows="3"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Create Group
                  </button>
                </form>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Groups</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedAcademy.groups?.map((group) => (
                  <div
                    key={group._id}
                    onClick={() => {
                      setSelectedGroup(group)
                      setView("tasks")
                    }}
                    className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer hover:border-indigo-500"
                  >
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{group.name}</h3>
                    <p className="text-gray-600 text-sm mb-3">{group.description}</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">Members:</span>
                        <span className="font-semibold text-indigo-600">{group.members?.length || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">Tasks:</span>
                        <span className="font-semibold text-green-600">{group.tasks?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {!selectedAcademy.groups?.length && (
                <p className="text-gray-500 text-center py-8">No groups yet. Create your first group!</p>
              )}
            </div>
          </div>
        )}

        {/* Tasks View */}
        {view === "tasks" && selectedGroup && (
          <div className="space-y-6">
            <button
              onClick={() => {
                setSelectedGroup(null)
                setView("groups")
              }}
              className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-2"
            >
              ← Back to Groups
            </button>

            {(selectedGroup.admin?.toString() === userId || selectedGroup.admin === userId) && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Create New Task</h2>
                <form onSubmit={createTask} className="space-y-4">
                  {/* ... rest of create task form ... */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Task Title</label>
                    <input
                      type="text"
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter task title"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter description"
                      rows="3"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">XP Reward</label>
                      <input
                        type="number"
                        value={taskForm.xpReward}
                        onChange={(e) => setTaskForm({ ...taskForm, xpReward: Number.parseInt(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                      <input
                        type="date"
                        value={taskForm.dueDate}
                        onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Create Task
                  </button>
                </form>
              </div>
            )}

            {(selectedGroup.admin?.toString() === userId || selectedGroup.admin === userId) && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Invite Students</h2>
                <form onSubmit={inviteStudent} className="space-y-4">
                  <div className="flex gap-4">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter student email"
                      required
                    />
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                      Send Invite
                    </button>
                  </div>
                </form>
                {showInviteLink && inviteLink && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="text-sm font-semibold text-green-800 mb-2">Invitation Link Generated!</h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inviteLink}
                        readOnly
                        className="flex-1 px-3 py-2 border border-green-300 rounded bg-white text-sm"
                      />
                      <button
                        onClick={copyInviteLink}
                        className="bg-green-600 text-white px-4 py-2 rounded font-medium hover:bg-green-700 transition-colors text-sm"
                      >
                        Copy Link
                      </button>
                    </div>
                    <button
                      onClick={() => setShowInviteLink(false)}
                      className="mt-2 text-sm text-green-700 hover:text-green-900"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Tasks</h2>
              <div className="space-y-4">
                {selectedGroup.tasks?.map((task) => {
                  const isCompleted = task.completedBy?.some((comp) => comp.userId?.toString() === userId)
                  return (
                    <div
                      key={task._id}
                      className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-800">{task.title}</h3>
                          <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                            {task.xpReward} XP
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                          <span className="ml-4">Completed by: {task.completedBy?.length || 0} students</span>
                        </div>
                        {!isCompleted && (
                          <button
                            onClick={() => completeTask(task._id)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors text-sm"
                          >
                            Complete Task
                          </button>
                        )}
                        {isCompleted && (
                          <span className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-semibold text-sm">
                            ✓ Completed
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              {!selectedGroup.tasks?.length && (
                <p className="text-gray-500 text-center py-8">No tasks yet. Create your first task!</p>
              )}
            </div>
          </div>
        )}

        {/* Leaderboard View */}
        {view === "leaderboard" && selectedGroup && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Group Leaderboard</h2>
            <div className="space-y-3">
              {leaderboard.map((member, index) => (
                <div
                  key={member._id}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all"
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                      index === 0
                        ? "bg-yellow-500"
                        : index === 1
                          ? "bg-gray-400"
                          : index === 2
                            ? "bg-orange-600"
                            : "bg-indigo-500"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800">
                      {member.emri} {member.mbiemri}
                    </h3>
                    <p className="text-sm text-gray-600">{member.email}</p>
                  </div>
                  {member.level && (
                    <span
                      className={`${getLevelColor(member.level)} text-white px-3 py-1 rounded-full text-sm font-semibold`}
                    >
                      Level {member.level}
                    </span>
                  )}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-indigo-600">{member.xp}</div>
                    <div className="text-xs text-gray-500">XP</div>
                  </div>
                </div>
              ))}
            </div>
            {leaderboard.length === 0 && (
              <p className="text-gray-500 text-center py-8">No members in this group yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Academy