"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { authService, certificatesService, achievementsService } from "../services/api"
import { User, Star, BookOpen, Camera, Flame, Award, Download, FileText } from "lucide-react"
import { useNavigate } from "react-router-dom"

const Account = () => {
  const { user, logout, updateUser, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [profilePictureDisplayUrl, setProfilePictureDisplayUrl] = useState(user?.profilePicture || null)
  const [uploading, setUploading] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [certificates, setCertificates] = useState([])
  const [loadingCertificates, setLoadingCertificates] = useState(true)
  const [downloadingCert, setDownloadingCert] = useState(null)
  const [issuingCertificate, setIssuingCertificate] = useState(false)

  const [achievements, setAchievements] = useState([])
  const [loadingAchievements, setLoadingAchievements] = useState(true)
  const [achievementStats, setAchievementStats] = useState(null)
  const [groupedAchievements, setGroupedAchievements] = useState({ xp: [], streak: [], tests: [] })

  useEffect(() => {
    setProfilePictureDisplayUrl(user?.profilePicture || null)
    if (user?.profilePicture) setImageError(false)
  }, [user?.profilePicture, user])

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setLoadingCertificates(true)
        const response = await certificatesService.getUserCertificates()
        const userCertificates = response.data.certificates || []
        setCertificates(userCertificates)

        if (user && user.level && user.level !== "A1") {
          const hasCertificateForCurrentLevel = userCertificates.some((cert) => cert.level === user.level)

          if (!hasCertificateForCurrentLevel && !issuingCertificate) {
            setIssuingCertificate(true)
            try {
              const issueResponse = await certificatesService.issueCertificate()
              if (issueResponse.data.success) {
                const refreshResponse = await certificatesService.getUserCertificates()
                setCertificates(refreshResponse.data.certificates || [])
              }
            } catch (issueError) {
              console.error("Error auto-issuing certificate:", issueError)
            } finally {
              setIssuingCertificate(false)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching certificates:", error)
        if (error.response?.status !== 404) {
          console.error("Unexpected error:", error)
        }
      } finally {
        setLoadingCertificates(false)
      }
    }

    if (user) {
      fetchCertificates()
    }
  }, [user])

  useEffect(() => {
    const fetchAchievements = async () => {
      if (!user?.id) {
        return
      }

      try {
        setLoadingAchievements(true)

        const response = await achievementsService.getUserAchievements(user.id)

        if (response && response.data) {
          const allAchievements = response.data.allAchievements || []
          const groupedAchs = response.data.groupedAchievements || { xp: [], streak: [], tests: [] }

          setAchievements(allAchievements)
          setGroupedAchievements(groupedAchs)

          const stats = response.data.stats || {
            totalAchievements: allAchievements.length,
            unlockedAchievements: allAchievements.filter((a) => a.isUnlocked).length,
            completionPercentage:
              allAchievements.length > 0
                ? Math.round((allAchievements.filter((a) => a.isUnlocked).length / allAchievements.length) * 100)
                : 0,
          }

          setAchievementStats(stats)
        }
      } catch (error) {
        console.error("Error fetching achievements:", error)
      } finally {
        setLoadingAchievements(false)
      }
    }

    if (user) {
      fetchAchievements()
    }
  }, [user])

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

  const handleDownloadCertificate = async (certificateId, level) => {
    try {
      setDownloadingCert(certificateId)
      const response = await certificatesService.downloadCertificate(certificateId)

      const blob = new Blob([response.data], { type: "application/pdf" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `Certifikata_${level}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading certificate:", error)
      alert("Gabim në shkarkimin e certifikatës. Ju lutemi provoni përsëri.")
    } finally {
      setDownloadingCert(null)
    }
  }

  const getCertificateBadgeColor = (level) => {
    const colors = {
      A1: "from-green-50 to-green-100 border-green-300",
      A2: "from-blue-50 to-blue-100 border-blue-300",
      B1: "from-purple-50 to-purple-100 border-purple-300",
      B2: "from-orange-50 to-orange-100 border-orange-300",
      C1: "from-red-50 to-red-100 border-red-300",
      C2: "from-yellow-50 to-yellow-100 border-yellow-300",
    }
    return colors[level] || "from-gray-50 to-gray-100 border-gray-300"
  }

  const getCertificateIconColor = (level) => {
    const colors = {
      A1: "text-green-600",
      A2: "text-blue-600",
      B1: "text-purple-600",
      B2: "text-orange-600",
      C1: "text-red-600",
      C2: "text-yellow-600",
    }
    return colors[level] || "text-gray-600"
  }

  const getAchievementBadgeColor = (category, isUnlocked) => {
    if (!isUnlocked) return "from-gray-50 to-gray-100 border-gray-300"

    const colors = {
      xp: "from-yellow-50 to-yellow-100 border-yellow-300",
      streak: "from-orange-50 to-orange-100 border-orange-300",
      tests: "from-purple-50 to-purple-100 border-purple-300",
    }
    return colors[category] || "from-blue-50 to-blue-100 border-blue-300"
  }

  const getAchievementIconColor = (category, isUnlocked) => {
    if (!isUnlocked) return "text-gray-400"

    const colors = {
      xp: "text-yellow-600",
      streak: "text-orange-600",
      tests: "text-purple-600",
    }
    return colors[category] || "text-blue-600"
  }

  const getCategoryDisplayName = (category) => {
    const names = {
      xp: "Pikë XP",
      streak: "Ditë Rresht",
      tests: "Teste",
    }
    return names[category] || category
  }

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Duke ngarkuar profilin tuaj...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
              {profilePictureDisplayUrl && !imageError ? (
                <img
                  key={profilePictureDisplayUrl}
                  src={profilePictureDisplayUrl || "/placeholder.svg"}
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
                <div className="h-6 w-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Niveli Aktual</p>
              <p className="text-2xl font-bold text-gray-900">{user.level}</p>
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-teal-600" />
            <h2 className="text-xl font-bold text-gray-900">Arritjet</h2>
          </div>
          {achievementStats && (
            <div className="flex items-center gap-4">
              <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm font-medium">
                {achievementStats.unlockedAchievements} / {achievementStats.totalAchievements} të shkyçura
              </span>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {achievementStats.completionPercentage}% të përfunduara
              </span>
            </div>
          )}
        </div>

        {loadingAchievements ? (
          <div className="text-center py-12">
            <div className="h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Duke ngarkuar arritjet...</p>
          </div>
        ) : achievements.length > 0 ? (
          <div className="space-y-8">
            {/* XP Achievements */}
            {groupedAchievements.xp && groupedAchievements.xp.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-600" />
                  Arritje XP
                  <span className="text-sm text-gray-500 font-normal">
                    ({groupedAchievements.xp.filter((a) => a.isUnlocked).length} / {groupedAchievements.xp.length})
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedAchievements.xp.map((achievement) => (
                    <div
                      key={achievement.key}
                      className={`bg-gradient-to-r ${getAchievementBadgeColor(achievement.category, achievement.isUnlocked)} rounded-xl p-5 border-2 shadow-md hover:shadow-lg transition-all duration-300 ${achievement.isUnlocked ? "hover:-translate-y-1" : "opacity-60"}`}
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between">
                          <div className="bg-white p-3 rounded-full shadow-sm">
                            <Award
                              className={`h-6 w-6 ${getAchievementIconColor(achievement.category, achievement.isUnlocked)}`}
                            />
                          </div>
                          {achievement.isUnlocked && (
                            <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                              ✓ Shkyçur
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-base mb-1">{achievement.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                          <div className="bg-white bg-opacity-70 rounded-lg px-2 py-1 inline-block">
                            <p className="text-xs font-semibold text-gray-700">
                              {achievement.isUnlocked ? `${achievement.xpThreshold} XP` : achievement.progressText}
                            </p>
                          </div>
                          {!achievement.isUnlocked && achievement.progress > 0 && (
                            <div className="mt-2">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${achievement.progress}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">{achievement.progress}% e përfunduar</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Streak Achievements */}
            {groupedAchievements.streak && groupedAchievements.streak.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-600" />
                  Arritje Ditësh Rresht
                  <span className="text-sm text-gray-500 font-normal">
                    ({groupedAchievements.streak.filter((a) => a.isUnlocked).length} /{" "}
                    {groupedAchievements.streak.length})
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedAchievements.streak.map((achievement) => (
                    <div
                      key={achievement.key}
                      className={`bg-gradient-to-r ${getAchievementBadgeColor(achievement.category, achievement.isUnlocked)} rounded-xl p-5 border-2 shadow-md hover:shadow-lg transition-all duration-300 ${achievement.isUnlocked ? "hover:-translate-y-1" : "opacity-60"}`}
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between">
                          <div className="bg-white p-3 rounded-full shadow-sm">
                            <Flame
                              className={`h-6 w-6 ${getAchievementIconColor(achievement.category, achievement.isUnlocked)}`}
                            />
                          </div>
                          {achievement.isUnlocked && (
                            <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                              ✓ Shkyçur
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-base mb-1">{achievement.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                          <div className="bg-white bg-opacity-70 rounded-lg px-2 py-1 inline-block">
                            <p className="text-xs font-semibold text-gray-700">
                              {achievement.isUnlocked
                                ? `${achievement.streakThreshold} ditë`
                                : achievement.progressText}
                            </p>
                          </div>
                          {!achievement.isUnlocked && achievement.progress > 0 && (
                            <div className="mt-2">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${achievement.progress}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">{achievement.progress}% e përfunduar</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Test Achievements */}
            {groupedAchievements.tests && groupedAchievements.tests.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                  Arritje Testesh
                  <span className="text-sm text-gray-500 font-normal">
                    ({groupedAchievements.tests.filter((a) => a.isUnlocked).length} / {groupedAchievements.tests.length}
                    )
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedAchievements.tests.map((achievement) => (
                    <div
                      key={achievement.key}
                      className={`bg-gradient-to-r ${getAchievementBadgeColor(achievement.category, achievement.isUnlocked)} rounded-xl p-5 border-2 shadow-md hover:shadow-lg transition-all duration-300 ${achievement.isUnlocked ? "hover:-translate-y-1" : "opacity-60"}`}
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between">
                          <div className="bg-white p-3 rounded-full shadow-sm">
                            <BookOpen
                              className={`h-6 w-6 ${getAchievementIconColor(achievement.category, achievement.isUnlocked)}`}
                            />
                          </div>
                          {achievement.isUnlocked && (
                            <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                              ✓ Shkyçur
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-base mb-1">{achievement.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                          <div className="bg-white bg-opacity-70 rounded-lg px-2 py-1 inline-block">
                            <p className="text-xs font-semibold text-gray-700">
                              {achievement.isUnlocked
                                ? `${achievement.testsThreshold} teste`
                                : achievement.progressText}
                            </p>
                          </div>
                          {!achievement.isUnlocked && achievement.progress > 0 && (
                            <div className="mt-2">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${achievement.progress}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">{achievement.progress}% e përfunduar</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-gray-50 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
              <Award className="h-12 w-12 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ende nuk ka arritje</h3>
            <p className="text-gray-600 mb-4">Vazhdoni të mësoni për të fituar arritjen tuaj të parë!</p>
            <div className="bg-teal-50 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-teal-800">
                <strong>Arritja e ardhshme:</strong> Fitoni më shumë XP për të shkyçur arritje të reja!
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Award className="h-6 w-6 text-teal-600" />
          <h2 className="text-xl font-bold text-gray-900">Certifikatat</h2>
          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm font-medium ml-2">
            {certificates.length}
          </span>
        </div>

        {loadingCertificates || issuingCertificate ? (
          <div className="text-center py-12">
            <div className="h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">
              {issuingCertificate ? "Duke krijuar certifikatën tuaj..." : "Duke ngarkuar certifikatat..."}
            </p>
          </div>
        ) : certificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((certificate) => (
              <div
                key={certificate._id}
                className={`bg-gradient-to-r ${getCertificateBadgeColor(certificate.level)} rounded-xl p-6 border-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="bg-white p-4 rounded-full shadow-md">
                    <Award className={`h-10 w-10 ${getCertificateIconColor(certificate.level)}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-2xl mb-1">Niveli {certificate.level}</h3>
                    <p className="text-sm text-gray-600 mb-1">
                      Lëshuar më:{" "}
                      {new Date(certificate.issuedAt).toLocaleDateString("sq-AL", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownloadCertificate(certificate._id, certificate.level)}
                    disabled={downloadingCert === certificate._id}
                    className="w-full bg-teal-600 text-white px-4 py-2.5 rounded-lg hover:bg-teal-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                  >
                    {downloadingCert === certificate._id ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Duke shkarkuar...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Shkarko PDF
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-gray-50 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
              <FileText className="h-12 w-12 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ende nuk ka certifikata</h3>
            <p className="text-gray-600 mb-4">Vazhdoni të mësoni për të fituar certifikatën tuaj të parë!</p>
            <div className="bg-teal-50 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-teal-800">
                <strong>Certifikata e ardhshme:</strong> Niveli {user.level === "A1" ? "A2" : user.level} kur të arrini
                nivelin e ri!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Account
