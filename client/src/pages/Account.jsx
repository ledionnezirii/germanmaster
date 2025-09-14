"use client"
import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../context/AuthContext"
import { authService } from "../services/api"
import { User, Star, Trophy, Clock, BookOpen, Camera, Loader2, Flame } from "lucide-react"
import { useNavigate } from "react-router-dom"

const Account = () => {
  const { user, logout, updateUser, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [profilePictureDisplayUrl, setProfilePictureDisplayUrl] = useState(user?.profilePicture || null)
  const [uploading, setUploading] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    setProfilePictureDisplayUrl(user?.profilePicture || null)
    if (user?.profilePicture) setImageError(false)
  }, [user?.profilePicture, user])

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert("Madhësia e skedarit duhet të jetë më pak se 5MB")
      return
    }
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      alert("Lejohen vetëm skedarët JPEG, PNG dhe GIF")
      return
    }
    setUploading(true)
    setImageError(false)
    try {
      const formData = new FormData()
      formData.append("profilePicture", file)
      const response = await authService.uploadProfilePicture(formData)
      const newProfilePicture = response.data.profilePicture
      setProfilePictureDisplayUrl(newProfilePicture)
      updateUser({ profilePicture: newProfilePicture })
      event.target.value = ""
    } catch (error) {
      setImageError(true)
      alert("Dështoi ngarkimi i fotos së profilit. Ju lutemi provoni përsëri.")
    } finally {
      setUploading(false)
    }
  }

  const lastAchievement = user?.newAchievements && user.newAchievements.length > 0
    ? user.newAchievements[user.newAchievements.length - 1]
    : null

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-gray-600">Duke ngarkuar profilin tuaj...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
              {profilePictureDisplayUrl && !imageError ? (
                <img
                  key={profilePictureDisplayUrl}
                  src={profilePictureDisplayUrl}
                  alt="Profili"
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                  onLoad={() => setImageError(false)}
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
          <div className="text-center md:text-left flex-1">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <h1 className="text-2xl font-bold text-gray-900">
                {user.firstName} {user.lastName}
              </h1>
            </div>
            <p className="text-gray-600 mt-1">{user.email}</p>
            <div className="mt-3 flex items-center justify-center md:justify-start gap-2 flex-wrap">
              <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm font-medium">
                Niveli {user.level}
              </span>
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                {user.xp} XP
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              logout()
              navigate("/signin")
            }}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Dilni
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Pikë XP</p>
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
              <p className="text-sm text-gray-600 font-medium">Niveli Aktual</p>
              <p className="text-2xl font-bold text-gray-900">{user.level}</p>
            </div>
          </div>
        </div>

        {/* Last Achievement Box */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-100 rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Trophy className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Arritja e fundit</p>
              <p className="text-2xl font-bold text-gray-900">{lastAchievement || "Asnjë arritje"}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <BookOpen className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Teste të Përfunduara</p>
              <p className="text-2xl font-bold text-gray-900">{user.completedTests}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-red-100 rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-3 rounded-lg">
              <Flame className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Ditë Rresht</p>
              <p className="text-2xl font-bold text-gray-900">{user.streakCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-yellow-600" />
          <h2 className="text-xl font-bold text-gray-900">Arritjet</h2>
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
                    <h3 className="font-semibold text-gray-900">{achievement}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">Ende nuk ka arritje</p>
            <p className="text-sm text-gray-500">Vazhdoni të mësoni për të fituar arritjen tuaj të parë!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Account
