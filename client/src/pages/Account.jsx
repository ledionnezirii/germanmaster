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

  const [achievementCarouselIndex, setAchievementCarouselIndex] = useState(0)

  useEffect(() => {
    setProfilePictureDisplayUrl(user?.profilePicture || null)
    if (user?.profilePicture) setImageError(false)
  }, [user])

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setLoadingCertificates(true)
        console.log("[v0] Fetching certificates for user:", user?.id, "level:", user?.level)

        const response = await certificatesService.getUserCertificates()
        const userCertificates = response.data.certificates || []
        console.log("[v0] Fetched certificates:", userCertificates.length)
        setCertificates(userCertificates)

        if (user && user.level) {
          console.log("[v0] User has level:", user.level)
          const hasCertificateForCurrentLevel = userCertificates.some((cert) => cert.level === user.level)
          console.log("[v0] Has certificate for current level:", hasCertificateForCurrentLevel)
          console.log("[v0] Is issuing certificate:", issuingCertificate)

          if (!hasCertificateForCurrentLevel && !issuingCertificate) {
            setIssuingCertificate(true)
            try {
              console.log("[v0] Auto-issuing certificate for level:", user.level)
              const issueResponse = await certificatesService.issueCertificate()
              console.log("[v0] Issue response:", issueResponse.data)

              if (issueResponse.data.success) {
                console.log("[v0] Certificate issued successfully")
                const refreshResponse = await certificatesService.getUserCertificates()
                console.log("[v0] Refreshed certificates:", refreshResponse.data.certificates?.length)
                setCertificates(refreshResponse.data.certificates || [])
              } else {
                console.log("[v0] Certificate issue failed:", issueResponse.data.message)
              }
            } catch (issueError) {
              console.error("[v0] Error auto-issuing certificate:", issueError)
              console.error("[v0] Error response:", issueError.response?.data)
            } finally {
              setIssuingCertificate(false)
            }
          } else {
            console.log("[v0] Skipping auto-issue:", {
              hasCertificate: hasCertificateForCurrentLevel,
              isIssuing: issuingCertificate,
            })
          }
        } else {
          console.log("[v0] User or level not set:", { user: !!user, level: user?.level })
        }
      } catch (error) {
        console.error("[v0] Error fetching certificates:", error)
        console.error("[v0] Error response:", error.response?.data)
        if (error.response?.status !== 404) {
          console.error("[v0] Unexpected error:", error)
        }
      } finally {
        setLoadingCertificates(false)
      }
    }

    if (user) {
      fetchCertificates()
    } else {
      console.log("[v0] No user, skipping certificate fetch")
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

  useEffect(() => {
    if (achievements.length === 0) return

    const interval = setInterval(() => {
      setAchievementCarouselIndex((prev) => {
        const maxIndex = Math.max(0, achievements.length - 1)
        return prev >= maxIndex ? 0 : prev + 1
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [achievements.length])

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

  const getCategoryIcon = (category) => {
    switch (category) {
      case "xp":
        return Star
      case "streak":
        return Flame
      case "tests":
        return BookOpen
      default:
        return Award
    }
  }

  const handleAchievementPrev = () => {
    setAchievementCarouselIndex((prev) => Math.max(0, prev - 1))
  }

  const handleAchievementNext = () => {
    setAchievementCarouselIndex((prev) => Math.min(achievements.length - 1, prev + 1))
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {certificates.map((certificate) => (
              <div
                key={certificate._id}
                className={`bg-gradient-to-r ${getCertificateBadgeColor(certificate.level)} rounded-xl p-6 border-2 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="bg-white p-4 rounded-full shadow-sm">
                    <Award className={`h-10 w-10 ${getCertificateIconColor(certificate.level)}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-xl mb-2">Niveli {certificate.level}</h3>
                    <p className="text-sm text-gray-600 mb-1">
                      Lëshuar më:{" "}
                      {new Date(certificate.issuedAt).toLocaleDateString("sq-AL", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">Nr. Serie: {certificate.serialNumber}</p>
                  </div>
                  <button
                    onClick={() => handleDownloadCertificate(certificate._id, certificate.level)}
                    disabled={downloadingCert === certificate._id}
                    className="w-full bg-white text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm border border-gray-200"
                  >
                    {downloadingCert === certificate._id ? (
                      <>
                        <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        <span>Duke shkarkuar...</span>
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
              {user.level ? (
                <p className="text-sm text-teal-800">
                  <strong>Certifikata juaj po përgatitet!</strong> Nëse sapo keni përfunduar një test, rifreskoni faqen
                  për të parë certifikatën tuaj të nivelit {user.level}.
                </p>
              ) : (
                <p className="text-sm text-teal-800">
                  <strong>Certifikata e ardhshme:</strong> Përfundoni testin e nivelit A1 për të marrë certifikatën tuaj
                  të parë!
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Account
