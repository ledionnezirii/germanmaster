"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import {
  authService,
  certificatesService,
  achievementsService,
  generateAvatarOptions,
  generateDicebearUrl,
} from "../services/api"
import { User, Star, BookOpen, Flame, Award, Download, FileText, Pencil, X, Search } from "lucide-react"
import { useNavigate } from "react-router-dom"
import logo from "../../public/logo.png"

const Account = () => {
  const { user, logout, updateUser, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [selectedAvatarStyle, setSelectedAvatarStyle] = useState(user?.avatarStyle || "adventurer-1")
  const [updating, setUpdating] = useState(false)
  const [showAvatarSelector, setShowAvatarSelector] = useState(false)
  const [avatarError, setAvatarError] = useState(null)
  const [nextAvatarChangeDate, setNextAvatarChangeDate] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(0)
  const [avatarStyles, setAvatarStyles] = useState([])

  const [certificates, setCertificates] = useState([])
  const [loadingCertificates, setLoadingCertificates] = useState(true)
  const [downloadingCert, setDownloadingCert] = useState(null)
  const [issuingCertificate, setIssuingCertificate] = useState(false)

  const [achievements, setAchievements] = useState([])
  const [loadingAchievements, setLoadingAchievements] = useState(true)
  const [achievementStats, setAchievementStats] = useState(null)
  const [groupedAchievements, setGroupedAchievements] = useState({ xp: [], streak: [], tests: [] })

  const [achievementCarouselIndex, setAchievementCarouselIndex] = useState(0)

  const AVATARS_PER_PAGE = 20

  useEffect(() => {
    const allAvatars = generateAvatarOptions()
    setAvatarStyles(allAvatars)
  }, [])

  useEffect(() => {
    setSelectedAvatarStyle(user?.avatarStyle || "adventurer-1")
  }, [user])

  const getFilteredAvatars = () => {
    if (!searchQuery.trim()) {
      return avatarStyles
    }
    return avatarStyles.filter((style) => style.toLowerCase().includes(searchQuery.toLowerCase()))
  }

  const filteredAvatars = getFilteredAvatars()
  const totalPages = Math.ceil(filteredAvatars.length / AVATARS_PER_PAGE)
  const paginatedAvatars = filteredAvatars.slice(currentPage * AVATARS_PER_PAGE, (currentPage + 1) * AVATARS_PER_PAGE)

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setLoadingCertificates(true)
        const response = await certificatesService.getUserCertificates()
        const userCertificates = response.data.certificates || []
        setCertificates(userCertificates)

        if (user && user.level) {
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
      if (!user?.id) return

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

  const handleAvatarStyleSelect = async (style) => {
    setUpdating(true)
    setAvatarError(null)
    try {
      const response = await authService.updateAvatarStyle(style)
      setSelectedAvatarStyle(style)
      updateUser({ avatarStyle: style })
      setShowAvatarSelector(false)
      setNextAvatarChangeDate(response.data.nextAvailableChange)
    } catch (error) {
      console.error("Error updating avatar style:", error)
      if (error.response?.status === 429) {
        const errorMessage = error.response?.data?.message || "You must wait before changing your avatar again"
        setAvatarError(errorMessage)
      } else {
        setAvatarError("Dështoi ndryshimi i avatari. Ju lutemi provoni përsëri.")
      }
    } finally {
      setUpdating(false)
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
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-8">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative">
            <button
              onClick={() => {
                setShowAvatarSelector(!showAvatarSelector)
                setAvatarError(null)
              }}
              className="relative w-32 h-32 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer"
              disabled={updating}
              title="Kliko për të ndryshuar avatarin"
            >
              <img
                src={generateDicebearUrl(user?.id, selectedAvatarStyle) || "/placeholder.svg"}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </button>
            <div className="absolute -bottom-1 -right-1 bg-teal-600 text-white p-2 rounded-full shadow-lg border-2 border-white">
              <Pencil className="h-4 w-4" />
            </div>
            {updating && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                <div className="h-8 w-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {showAvatarSelector && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-blue-50">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Zgjidhni Avatarin Tuaj</h3>
                    <p className="text-sm text-gray-600 mt-1">Zgjidhni nga mbi 500 opsione të ndryshme</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowAvatarSelector(false)
                      setAvatarError(null)
                    }}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-full transition-colors"
                    title="Mbyll"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                  <div className="mb-6 flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
                    <Search className="h-5 w-5 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Kërkoni avatar (p.sh., 'adventurer', 'pixel')..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setCurrentPage(0)
                      }}
                      className="flex-1 bg-transparent outline-none text-gray-700"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery("")
                          setCurrentPage(0)
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {avatarError && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                      <p className="text-sm text-red-800 font-medium">{avatarError}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {paginatedAvatars.map((style) => {
                      const styleName = style.split("-").slice(0, -1).join("-")
                      return (
                        <button
                          key={style}
                          onClick={() => handleAvatarStyleSelect(style)}
                          className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200 ${
                            selectedAvatarStyle === style
                              ? "border-3 border-teal-500 bg-teal-50 shadow-lg scale-105"
                              : "border-2 border-gray-200 hover:border-teal-300 hover:shadow-md"
                          }`}
                          disabled={updating}
                        >
                          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 shadow-sm">
                            <img
                              src={generateDicebearUrl(user?.id, style) || "/placeholder.svg"}
                              alt={style}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-xs text-gray-700 text-center capitalize font-medium leading-tight">
                            {style.replace("-", " ")}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Mbrapa
                    </button>
                    <span className="text-sm text-gray-600">
                      Faqja {currentPage + 1} nga {totalPages} ({filteredAvatars.length} avatarë)
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={currentPage >= totalPages - 1}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Përpara
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="text-center md:text-left flex-1">
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                {user.firstName} {user.lastName}
              </h1>
              <div className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-xs font-bold">PRO</div>
            </div>
            <p className="text-gray-600 mt-2 flex items-center gap-2 justify-center md:justify-start">
              <User className="h-4 w-4" />
              {user.email}
            </p>
            <div className="mt-4 flex items-center justify-center md:justify-start gap-3 flex-wrap">
              <span className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md">
                Niveli {user.level}
              </span>
              <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-4 py-2 rounded-full text-sm font-bold shadow-md">
                {user.xp} XP
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              logout()
              navigate("/signin")
            }}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Dil
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-yellow-50 via-yellow-100 to-yellow-50 rounded-2xl p-6 hover:shadow-lg transition-all duration-200 border border-yellow-200 hover:scale-105">
          <div className="flex items-center gap-4">
            <div className="bg-yellow-200 p-4 rounded-xl shadow-sm">
              <Star className="h-7 w-7 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-semibold">Pikët XP</p>
              <p className="text-3xl font-bold text-gray-900">{user.xp}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 via-green-100 to-green-50 rounded-2xl p-6 hover:shadow-lg transition-all duration-200 border border-green-200 hover:scale-105">
          <div className="flex items-center gap-4">
            <div className="bg-green-200 p-4 rounded-xl shadow-sm">
              <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-semibold">Niveli Aktual</p>
              <p className="text-3xl font-bold text-gray-900">{user.level}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 via-purple-100 to-purple-50 rounded-2xl p-6 hover:shadow-lg transition-all duration-200 border border-purple-200 hover:scale-105">
          <div className="flex items-center gap-4">
            <div className="bg-purple-200 p-4 rounded-xl shadow-sm">
              <BookOpen className="h-7 w-7 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-semibold">Teste të Përfunduara</p>
              <p className="text-3xl font-bold text-gray-900">{user.completedTests}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 via-orange-100 to-red-50 rounded-2xl p-6 hover:shadow-lg transition-all duration-200 border border-orange-200 hover:scale-105">
          <div className="flex items-center gap-4">
            <div className="bg-orange-200 p-4 rounded-xl shadow-sm">
              <Flame className="h-7 w-7 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-semibold">Ditë Rresht</p>
              <p className="text-3xl font-bold text-gray-900">{user.streakCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Certificates Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-teal-100 p-3 rounded-xl">
            <Award className="h-7 w-7 text-teal-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Certifikatat</h2>
          <span className="bg-teal-100 text-teal-700 px-3 py-1.5 rounded-full text-sm font-bold ml-auto">
            {certificates.length}
          </span>
        </div>

        {loadingCertificates || issuingCertificate ? (
          <div className="text-center py-16">
            <div className="h-10 w-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">
              {issuingCertificate ? "Duke krijuar certifikatën tuaj..." : "Duke ngarkuar certifikatat..."}
            </p>
          </div>
        ) : certificates.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {certificates.map((certificate) => (
              <div
                key={certificate._id}
                className="bg-gradient-to-br from-purple-50 via-purple-100 to-pink-50 rounded-2xl p-6 border-2 border-purple-300 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="bg-white p-1 rounded-full shadow-md">
                    <img src={logo || "/placeholder.svg"} className="w-24 h-24 rounded-full" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-2xl mb-2">Niveli {certificate.level}</h3>
                    <p className="text-sm text-gray-600 mb-1 font-medium">
                      Lëshuar:{" "}
                      {new Date(certificate.issuedAt).toLocaleDateString("sq-AL", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownloadCertificate(certificate._id, certificate.level)}
                    disabled={downloadingCert === certificate._id}
                    className="w-full text-gray-700  px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer  font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    {downloadingCert === certificate._id ? (
                      <>
                        <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        <span>Duke shkarkuar...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-5 w-5" />
                        Shkarko PDF
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center shadow-inner">
              <FileText className="h-16 w-16 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Ende Nuk Keni Certifikata</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Vazhdoni të mësoni dhe përfundoni testet për të fituar certifikatën tuaj të parë!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Account
