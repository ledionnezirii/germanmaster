"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { authService } from "../services/api"
import { User, Star, Trophy, Clock, BookOpen, Camera, Loader2, Edit2, Save, X } from "lucide-react"

const Account = () => {
  const { user, logout, updateUser } = useAuth()
  const [userStats, setUserStats] = useState({
    firstName: "",
    lastName: "",
    email: "",
    profilePicture: null,
    xp: 0,
    level: "A1",
    studyHours: 0,
    completedTests: 0,
    achievements: [],
    streakCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const profileResponse = await authService.getProfile()
      const profileData = profileResponse.data.user || profileResponse.data

      const userData = {
        firstName: profileData.emri || profileData.firstName || "",
        lastName: profileData.mbiemri || profileData.lastName || "",
        email: profileData.email || "",
        profilePicture: profileData.profilePicture,
        xp: profileData.xp || 0,
        level: profileData.level || "A1",
        studyHours: profileData.studyHours || 0,
        completedTests: profileData.completedTests || 0,
        achievements: profileData.achievements || [],
        streakCount: profileData.streakCount || 0,
      }

      setUserStats(userData)
      setEditForm({
        firstName: userData.firstName,
        lastName: userData.lastName,
      })

      updateUser({
        firstName: userData.firstName,
        lastName: userData.lastName,
        xp: userData.xp,
        level: userData.level,
        profilePicture: userData.profilePicture,
        streakCount: userData.streakCount,
      })
    } catch (error) {
      console.error("Error fetching user data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB")
      return
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      alert("Only JPEG, PNG, and GIF files are allowed")
      return
    }

    setUploading(true)
    setImageError(false)

    try {
      const formData = new FormData()
      formData.append("profilePicture", file)
      const response = await authService.uploadProfilePicture(formData)
      const newProfilePicture = response.data.profilePicture

      setUserStats((prev) => ({ ...prev, profilePicture: newProfilePicture }))
      updateUser({ profilePicture: newProfilePicture })

      event.target.value = ""
    } catch (error) {
      console.error("Error uploading profile picture:", error)
      setImageError(true)
      alert("Failed to upload profile picture. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const handleImageError = () => setImageError(true)
  const handleImageLoad = () => setImageError(false)

  const handleEditToggle = () => {
    if (editing) {
      setEditForm({
        firstName: userStats.firstName,
        lastName: userStats.lastName,
      })
    }
    setEditing(!editing)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setEditForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSaveProfile = async () => {
    if (!editForm.firstName.trim() || !editForm.lastName.trim()) {
      alert("First name and last name are required")
      return
    }

    setSaving(true)
    try {
      await authService.updateProfile({
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
      })

      setUserStats((prev) => ({
        ...prev,
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
      }))

      updateUser({
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
      })

      setEditing(false)
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Failed to update profile. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const getXPProgress = () => {
    const baseXP = 100
    const currentLevelXP = baseXP * Math.pow(1.5, Number.parseInt(userStats.level.substring(1)) - 1)
    const nextLevelXP = baseXP * Math.pow(1.5, Number.parseInt(userStats.level.substring(1)))
    const progress = ((userStats.xp % currentLevelXP) / currentLevelXP) * 100
    return Math.min(progress, 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Profile Picture */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
              {userStats.profilePicture && !imageError ? (
                <img
                  src={userStats.profilePicture || "/placeholder.svg"}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                  onLoad={handleImageLoad}
                  crossOrigin="anonymous"
                />
              ) : (
                <User className="h-12 w-12 text-gray-400" />
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-teal-600 rounded-full p-2 cursor-pointer hover:bg-teal-700 transition-colors shadow-lg">
              <Camera className="h-4 w-4 text-white" />
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif"
                onChange={handleProfilePictureUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
            {uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="text-center md:text-left flex-1">
            {editing ? (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    name="firstName"
                    value={editForm.firstName}
                    onChange={handleInputChange}
                    placeholder="First Name"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    name="lastName"
                    value={editForm.lastName}
                    onChange={handleInputChange}
                    placeholder="Last Name"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2 justify-center md:justify-start">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save
                  </button>
                  <button
                    onClick={handleEditToggle}
                    className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {userStats.firstName} {userStats.lastName}
                  </h1>
                  <button
                    onClick={handleEditToggle}
                    className="p-1 text-gray-400 hover:text-teal-600 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-gray-600 mt-1">{userStats.email}</p>
                <div className="mt-3 flex items-center justify-center md:justify-start gap-2 flex-wrap">
                  <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm font-medium">
                    Level {userStats.level}
                  </span>
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                    {userStats.xp} XP
                  </span>
                </div>

                {/* XP Progress Bar */}
                <div className="mt-3 w-full max-w-xs mx-auto md:mx-0">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Progress to next level</span>
                    <span>{Math.round(getXPProgress())}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getXPProgress()}%` }}
                    ></div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Stats Grid - Now includes streak as 5th box */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">XP Points</p>
              <p className="text-2xl font-bold text-gray-900">{userStats.xp}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <Trophy className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Current Level</p>
              <p className="text-2xl font-bold text-gray-900">{userStats.level}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Study Hours</p>
              <p className="text-2xl font-bold text-gray-900">{userStats.studyHours}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <BookOpen className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Tests Completed</p>
              <p className="text-2xl font-bold text-gray-900">{userStats.completedTests}</p>
            </div>
          </div>
        </div>

        {/* STREAK BOX - Same size as other boxes */}
        <div className="bg-gradient-to-r from-orange-50 to-red-100 rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-3 rounded-lg">
              <span className="text-2xl">🔥</span>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Day Streak</p>
              <p className="text-2xl font-bold text-gray-900">{userStats.streakCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-yellow-600" />
          <h2 className="text-xl font-bold text-gray-900">Achievements</h2>
        </div>

        {userStats.achievements && userStats.achievements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userStats.achievements.map((achievement, index) => (
              <div
                key={index}
                className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-yellow-100 p-2 rounded-full">
                    <Trophy className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{achievement.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                    {achievement.date && (
                      <p className="text-xs text-gray-500 mt-2">
                        Earned on {new Date(achievement.date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">No achievements yet</p>
            <p className="text-sm text-gray-500">Keep learning to earn your first achievement!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Account
