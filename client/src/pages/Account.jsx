"use client"
import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../context/AuthContext"
import { authService } from "../services/api"
import { User, Star, Trophy, Clock, BookOpen, Camera, Loader2, Flame } from "lucide-react" // Added Flame icon
import { useNavigate } from "react-router-dom"

const Account = () => {
  const { user, logout, updateUser, loading: authLoading } = useAuth() // Get loading state from AuthContext
  const navigate = useNavigate()

  // Local state for managing the profile picture URL displayed
  // This allows for immediate visual update after upload,
  // and defaults to the URL from AuthContext's user object.
  const [profilePictureDisplayUrl, setProfilePictureDisplayUrl] = useState(user?.profilePicture || null)
  const [uploading, setUploading] = useState(false)
  const [imageError, setImageError] = useState(false) // State to track image loading errors

  // Effect to update the display URL when the user object from AuthContext changes
  useEffect(() => {
    console.log("Account.jsx: User object from AuthContext changed:", user)
    setProfilePictureDisplayUrl(user?.profilePicture || null)
    // Reset imageError when the profilePicture URL from AuthContext changes
    if (user?.profilePicture) {
      setImageError(false)
    }
  }, [user?.profilePicture, user]) // Re-run if profilePicture URL or the entire user object changes

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert("Madhësia e skedarit duhet të jetë më pak se 5MB") // Albanian: File size must be less than 5MB
      return
    }
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      alert("Lejohen vetëm skedarët JPEG, PNG dhe GIF") // Albanian: Only JPEG, PNG, and GIF files are allowed
      return
    }
    setUploading(true)
    setImageError(false) // Reset error before new upload attempt
    try {
      const formData = new FormData()
      formData.append("profilePicture", file)
      const response = await authService.uploadProfilePicture(formData)
      const newProfilePicture = response.data.profilePicture // This should be the absolute URL
      console.log("Account.jsx: Upload successful. New profile picture URL:", newProfilePicture)
      // Immediately update the local display URL
      setProfilePictureDisplayUrl(newProfilePicture)
      // Update AuthContext, which will also persist to localStorage
      updateUser({ profilePicture: newProfilePicture })
      event.target.value = "" // Clear the file input
    } catch (error) {
      console.error("Account.jsx: Error uploading profile picture:", error)
      setImageError(true) // Set error if upload fails
      alert("Dështoi ngarkimi i fotos së profilit. Ju lutemi provoni përsëri.") // Albanian: Failed to upload profile picture. Please try again.
    } finally {
      setUploading(false)
    }
  }

  const handleImageError = () => {
    console.log("Account.jsx: Image failed to load (onError triggered). Setting imageError to true.")
    setImageError(true)
  }

  const handleImageLoad = () => {
    console.log("Account.jsx: Image loaded successfully (onLoad triggered). Setting imageError to false.")
    setImageError(false)
  }

  const handleSignOut = () => {
    logout()
    navigate("/signin")
  }

  const getXPProgress = useCallback(() => {
    if (!user || user.xp === undefined || user.level === undefined) return 0 // Handle cases where user or its properties might be null/undefined
    const baseXP = 100
    // Ensure level is a string like "A1", "B2", etc. and parse the number part
    const currentLevelNum = Number.parseInt(user.level?.replace(/[^0-9]/g, "") || "1") // Extract number, default to 1
    // Calculate XP required for current and next level
    const currentLevelXP = baseXP * Math.pow(1.5, currentLevelNum - 1)
    const nextLevelXP = baseXP * Math.pow(1.5, currentLevelNum)
    // Ensure xpForNextLevel is not zero to avoid division by zero
    const xpForNextLevel = nextLevelXP - currentLevelXP
    if (xpForNextLevel <= 0) return 100 // If no XP needed for next level, assume 100% progress
    const xpInCurrentLevel = user.xp - currentLevelXP
    const progress = (xpInCurrentLevel / xpForNextLevel) * 100
    return Math.min(Math.max(progress, 0), 100) || 0 // Ensure progress is between 0 and 100
  }, [user]) // Recalculate only when user object changes

  // Display loading spinner if AuthContext is still loading or if user is null
  if (authLoading || !user) {
    console.log("Account.jsx: Displaying loading state. authLoading:", authLoading, "user:", user)
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-gray-600">Duke ngarkuar profilin tuaj...</p> {/* Albanian: Loading your profile... */}
        </div>
      </div>
    )
  }

  console.log("Account.jsx: Rendering Account component with user:", user)
  console.log("Account.jsx: Current profilePictureDisplayUrl:", profilePictureDisplayUrl, "imageError:", imageError)

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Profile Picture */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
              {profilePictureDisplayUrl && !imageError ? (
                <img
                  key={profilePictureDisplayUrl} // Key helps React re-render if URL changes
                  src={profilePictureDisplayUrl || "/placeholder.svg"}
                  alt="Profili" // Albanian: Profile
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
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <h1 className="text-2xl font-bold text-gray-900">
                {user.firstName} {user.lastName}
              </h1>
            </div>
            <p className="text-gray-600 mt-1">{user.email}</p>
            <div className="mt-3 flex items-center justify-center md:justify-start gap-2 flex-wrap">
              <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm font-medium">
                Niveli {user.level} {/* Albanian: Level */}
              </span>
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                {user.xp} XP
              </span>
            </div>
          </div>
          {/* Logout Button */}
          <button
            onClick={handleSignOut}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Dilni {/* Albanian: Sign Out */}
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
              <p className="text-sm text-gray-600 font-medium">Pikë XP</p> {/* Albanian: XP Points */}
              <p className="text-2xl font-bold text-gray-900">{user.xp}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <Trophy className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Niveli Aktual</p> {/* Albanian: Current Level */}
              <p className="text-2xl font-bold text-gray-900">{user.level}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Orë Studimi</p> {/* Albanian: Study Hours */}
              <p className="text-2xl font-bold text-gray-900">{user.studyHours}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <BookOpen className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Teste të Përfunduara</p>{" "}
              {/* Albanian: Tests Completed */}
              <p className="text-2xl font-bold text-gray-900">{user.completedTests}</p>
            </div>
          </div>
        </div>
        {/* STREAK BOX - Same size as other boxes */}
        <div className="bg-gradient-to-r from-orange-50 to-red-100 rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-3 rounded-lg">
              <Flame className="h-6 w-6 text-orange-600" /> {/* Replaced emoji with Lucide icon */}
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Ditë Rresht</p> {/* Albanian: Day Streak */}
              <p className="text-2xl font-bold text-gray-900">{user.streakCount}</p>
            </div>
          </div>
        </div>
      </div>
      {/* Achievements Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-yellow-600" />
          <h2 className="text-xl font-bold text-gray-900">Arritjet</h2> {/* Albanian: Achievements */}
        </div>
        {user.achievements && user.achievements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {user.achievements.map((achievement, index) => (
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
                        Fituan më {new Date(achievement.date).toLocaleDateString()} {/* Albanian: Earned on */}
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
            <p className="text-gray-600 mb-2">Ende nuk ka arritje</p> {/* Albanian: No achievements yet */}
            <p className="text-sm text-gray-500">Vazhdoni të mësoni për të fituar arritjen tuaj të parë!</p>{" "}
            {/* Albanian: Keep learning to earn your first achievement! */}
          </div>
        )}
      </div>
    </div>
  )
}

export default Account
