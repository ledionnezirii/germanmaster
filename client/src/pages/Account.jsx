"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { useLanguage } from "../context/LanguageContext"
import {
  authService,
  certificatesService,
  achievementsService,
  generateAvatarOptions,
  generateDicebearUrl,
} from "../services/api"
import { User, Star, BookOpen, Flame, Award, Download, FileText, Pencil, X, Search, Mail } from "lucide-react"
import { useNavigate } from "react-router-dom"
import logo from "../../public/logo.png"
import SEO from "../components/SEO"

// ─── Language display config ────────────────────────────────────────────────────
const LANGUAGE_LABELS = {
  de: { label: "Gjermanisht", flag: "🇩🇪" },
  en: { label: "Anglisht",    flag: "🇬🇧" },
  fr: { label: "Frëngjisht",  flag: "🇫🇷" },
  tr: { label: "Turqisht",    flag: "🇹🇷" },
  it: { label: "Italisht",    flag: "🇮🇹" },
}

// ─── Verified badge ─────────────────────────────────────────────────────────────
const VerifiedBadge = ({ isVerified, onVerificationRequested }) => {
  const [loading,   setLoading]   = useState(false)
  const [requested, setRequested] = useState(false)

  const handleRequestVerification = async () => {
    setLoading(true)
    try {
      await authService.requestVerification()
      setRequested(true)
      if (onVerificationRequested) onVerificationRequested()
    } catch (error) {
      console.error("Error requesting verification:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <svg className={`w-5 h-5 ${isVerified ? "text-orange-500" : "text-gray-400"}`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span className={`text-sm font-medium ${isVerified ? "text-orange-500" : "text-gray-400"}`}>
          {isVerified ? "I verifikuar" : "I pa verifikuar"}
        </span>
      </div>
      {!isVerified && !requested && (
        <button
          onClick={handleRequestVerification}
          disabled={loading}
          className={`ml-2 px-3 py-1 text-xs font-medium rounded-full transition-all flex items-center gap-1 ${loading ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-teal-100 text-teal-700 hover:bg-teal-200 cursor-pointer"}`}
        >
          <Mail className="w-3 h-3" />
          {loading ? "Duke dërguar..." : "Verifikohu"}
        </button>
      )}
      {!isVerified && requested && (
        <span className="ml-2 text-xs text-green-600 font-medium">Kërkesa u dërgua!</span>
      )}
    </div>
  )
}

// ─── Account ────────────────────────────────────────────────────────────────────
const Account = () => {
  const { user, logout, updateUser, loading: authLoading } = useAuth()
  const { language } = useLanguage()
  const navigate = useNavigate()

  // Avatar
  const [selectedAvatarStyle, setSelectedAvatarStyle] = useState(user?.avatarStyle || "adventurer-1")
  const [updating,            setUpdating]            = useState(false)
  const [showAvatarSelector,  setShowAvatarSelector]  = useState(false)
  const [avatarError,         setAvatarError]         = useState(null)
  const [searchQuery,         setSearchQuery]         = useState("")
  const [currentPage,         setCurrentPage]         = useState(0)
  const [avatarStyles,        setAvatarStyles]        = useState([])
  const AVATARS_PER_PAGE = 20

  // Certificates
  const [certificates,      setCertificates]      = useState([])
  const [loadingCerts,      setLoadingCerts]       = useState(true)
  const [downloadingCert,   setDownloadingCert]    = useState(null)
  const [issuingCertificate, setIssuingCertificate] = useState(false)

  // Achievements
  const [achievements,       setAchievements]       = useState([])
  const [loadingAchievements, setLoadingAchievements] = useState(true)
  const [achievementStats,   setAchievementStats]   = useState(null)
  const [groupedAchievements, setGroupedAchievements] = useState({ xp: [], streak: [], tests: [] })
  const [achievementCarouselIndex, setAchievementCarouselIndex] = useState(0)

  // ─── Avatar setup ────────────────────────────────────────────────────────────

  useEffect(() => { setAvatarStyles(generateAvatarOptions()) }, [])
  useEffect(() => { setSelectedAvatarStyle(user?.avatarStyle || "adventurer-1") }, [user])

  const filteredAvatars  = searchQuery.trim()
    ? avatarStyles.filter((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
    : avatarStyles
  const totalPages       = Math.ceil(filteredAvatars.length / AVATARS_PER_PAGE)
  const paginatedAvatars = filteredAvatars.slice(currentPage * AVATARS_PER_PAGE, (currentPage + 1) * AVATARS_PER_PAGE)

  // ─── Certificates — fetch & auto-issue per language ──────────────────────────

  useEffect(() => {
    if (!user) return
    fetchCertificates()
  }, [user, language]) // re-run when language changes

  const fetchCertificates = async () => {
    try {
      setLoadingCerts(true)
      const response         = await certificatesService.getUserCertificates()
      const allCertificates  = response.data.certificates || []
      setCertificates(allCertificates)

      // Auto-issue: check if there's already a cert for current language
      if (!issuingCertificate) {
        const hasCertForLanguage = allCertificates.some(
          (cert) => (cert.language || "de") === language,
        )

        if (!hasCertForLanguage) {
          setIssuingCertificate(true)
          try {
            const issueResponse = await certificatesService.issueCertificate({ language })
            if (issueResponse.data?.success || issueResponse.data?.certificate) {
              // Re-fetch to get the fresh list
              const refreshResponse = await certificatesService.getUserCertificates()
              setCertificates(refreshResponse.data.certificates || [])
            }
          } catch (issueError) {
            // User might not have passed any tests in this language yet — that's fine
            console.error("[Account] Error auto-issuing certificate:", issueError)
          } finally {
            setIssuingCertificate(false)
          }
        }
      }
    } catch (error) {
      console.error("[Account] Error fetching certificates:", error)
    } finally {
      setLoadingCerts(false)
    }
  }

  // Certs for the currently selected language
  const certsForLanguage = certificates.filter(
    (cert) => (cert.language || "de") === language,
  )

  // ─── Achievements ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user?.id) return
    const fetchAchievements = async () => {
      try {
        setLoadingAchievements(true)
        const response = await achievementsService.getUserAchievements(user.id)
        if (response?.data) {
          const allAchievements = response.data.allAchievements || []
          setAchievements(allAchievements)
          setGroupedAchievements(response.data.groupedAchievements || { xp: [], streak: [], tests: [] })
          setAchievementStats(
            response.data.stats || {
              totalAchievements:    allAchievements.length,
              unlockedAchievements: allAchievements.filter((a) => a.isUnlocked).length,
              completionPercentage: allAchievements.length > 0
                ? Math.round((allAchievements.filter((a) => a.isUnlocked).length / allAchievements.length) * 100)
                : 0,
            },
          )
        }
      } catch (error) {
        console.error("[Account] Error fetching achievements:", error)
      } finally {
        setLoadingAchievements(false)
      }
    }
    fetchAchievements()
  }, [user])

  useEffect(() => {
    if (achievements.length === 0) return
    const interval = setInterval(() => {
      setAchievementCarouselIndex((prev) => (prev >= achievements.length - 1 ? 0 : prev + 1))
    }, 3000)
    return () => clearInterval(interval)
  }, [achievements.length])

  // ─── Avatar handlers ─────────────────────────────────────────────────────────

  const handleAvatarStyleSelect = async (style) => {
    setUpdating(true)
    setAvatarError(null)
    try {
      const response = await authService.updateAvatarStyle(style)
      setSelectedAvatarStyle(style)
      updateUser({ avatarStyle: style })
      setShowAvatarSelector(false)
    } catch (error) {
      if (error.response?.status === 429) {
        setAvatarError(error.response?.data?.message || "You must wait before changing your avatar again")
      } else {
        setAvatarError("Dështoi ndryshimi i avatari. Ju lutemi provoni përsëri.")
      }
    } finally {
      setUpdating(false)
    }
  }

  // ─── Certificate handlers ────────────────────────────────────────────────────

  const handleDownloadCertificate = async (certificateId, level, certLanguage) => {
    try {
      setDownloadingCert(certificateId)
      const response = await certificatesService.downloadCertificate(certificateId)
      const blob     = new Blob([response.data], { type: "application/pdf" })
      const url      = window.URL.createObjectURL(blob)
      const link     = document.createElement("a")
      link.href      = url
      link.download  = `Certifikata_${certLanguage || language}_${level}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("[Account] Error downloading certificate:", error)
      alert("Gabim në shkarkimin e certifikatës. Ju lutemi provoni përsëri.")
    } finally {
      setDownloadingCert(null)
    }
  }

  // ─── Guards ──────────────────────────────────────────────────────────────────

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
          <p className="text-gray-600">Duke ngarkuar profilin tuaj...</p>
        </div>
      </div>
    )
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <SEO
        title="Llogaria Ime"
        description="Shikoni profilin tuaj, arritjet, certifikatat dhe statistikat tuaja të mësimit."
        keywords="llogaria ime, profil, arritjet, certifikatat"
        type="profile"
      />

      <div className="max-w-6xl mx-auto space-y-4 p-4">

        {/* ── Profile header ── */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row items-center gap-8">

            {/* Avatar */}
            <div className="relative">
              <button
                onClick={() => { setShowAvatarSelector(!showAvatarSelector); setAvatarError(null) }}
                className="relative w-32 h-32 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-xl hover:shadow-2xl transition-all cursor-pointer"
                disabled={updating}
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
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                </div>
              )}
            </div>

            {/* Avatar selector modal */}
            {showAvatarSelector && (
              <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-blue-50">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Zgjidhni Avatarin Tuaj</h3>
                      <p className="text-sm text-gray-600 mt-1">Zgjidhni nga mbi 500 opsione</p>
                    </div>
                    <button onClick={() => { setShowAvatarSelector(false); setAvatarError(null) }} className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-full transition-colors">
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  <div className="p-6 flex-1 overflow-y-auto">
                    <div className="mb-6 flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
                      <Search className="h-5 w-5 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Kërkoni avatar..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(0) }}
                        className="flex-1 bg-transparent outline-none text-gray-700"
                      />
                      {searchQuery && (
                        <button onClick={() => { setSearchQuery(""); setCurrentPage(0) }}>
                          <X className="h-4 w-4 text-gray-500" />
                        </button>
                      )}
                    </div>
                    {avatarError && (
                      <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                        <p className="text-sm text-red-800 font-medium">{avatarError}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {paginatedAvatars.map((style) => (
                        <button
                          key={style}
                          onClick={() => handleAvatarStyleSelect(style)}
                          disabled={updating}
                          className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${selectedAvatarStyle === style ? "border-3 border-teal-500 bg-teal-50 shadow-lg scale-105" : "border-2 border-gray-200 hover:border-teal-300 hover:shadow-md"}`}
                        >
                          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 shadow-sm">
                            <img src={generateDicebearUrl(user?.id, style) || "/placeholder.svg"} alt={style} className="w-full h-full object-cover" />
                          </div>
                          <span className="text-xs text-gray-700 text-center capitalize font-medium leading-tight">
                            {style.replace("-", " ")}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="mt-6 flex items-center justify-between">
                      <button onClick={() => setCurrentPage((p) => Math.max(0, p - 1))} disabled={currentPage === 0} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">Mbrapa</button>
                      <span className="text-sm text-gray-600">Faqja {currentPage + 1} nga {totalPages}</span>
                      <button onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">Përpara</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* User info */}
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{user.firstName} {user.lastName}</h1>
              <div className="mt-2 flex flex-col gap-2">
                <p className="text-gray-600 flex items-center gap-2 justify-center md:justify-start">
                  <User className="h-4 w-4" /> {user.email}
                </p>
                <div className="flex justify-center md:justify-start">
                  <VerifiedBadge isVerified={user.isVerified || user.emailVerified} />
                </div>
              </div>
            </div>

            <button
              onClick={() => { logout(); navigate("/signin") }}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Dil
            </button>
          </div>
        </div>

        {/* ── Stats grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Pikët XP",             value: user.xp,             icon: <Star className="h-7 w-7 text-yellow-600" />,  bg: "from-yellow-50 via-yellow-100 to-yellow-50 border-yellow-200",  iconBg: "bg-yellow-200" },
            { label: "Niveli Aktual",         value: (user.languageProgress || []).find(p => p.language === language)?.level || (language === "de" ? user.level : null) || "-",          icon: <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, bg: "from-green-50 via-green-100 to-green-50 border-green-200", iconBg: "bg-green-200" },
            { label: "Teste të Përfunduara", value: user.completedTests, icon: <BookOpen className="h-7 w-7 text-purple-600" />, bg: "from-purple-50 via-purple-100 to-purple-50 border-purple-200", iconBg: "bg-purple-200" },
            { label: "Ditë Rresht",           value: user.streakCount,    icon: <Flame className="h-7 w-7 text-orange-600" />,  bg: "from-orange-50 via-orange-100 to-red-50 border-orange-200",    iconBg: "bg-orange-200" },
          ].map(({ label, value, icon, bg, iconBg }) => (
            <div key={label} className={`bg-gradient-to-br ${bg} rounded-2xl p-4 hover:shadow-lg transition-all border hover:scale-105`}>
              <div className="flex items-center gap-4">
                <div className={`${iconBg} p-4 rounded-xl shadow-sm`}>{icon}</div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold">{label}</p>
                  <p className="text-3xl font-bold text-gray-900">{value ?? "—"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Certificates ── */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-teal-100 p-2 rounded-lg">
              <Award className="h-5 w-5 text-teal-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Certifikatat</h2>

            {/* Language badge */}
            <span className="ml-1 text-lg" title={LANGUAGE_LABELS[language]?.label}>
              {LANGUAGE_LABELS[language]?.flag}
            </span>
            <span className="text-sm text-gray-500">{LANGUAGE_LABELS[language]?.label}</span>

            {/* Count badge for this language */}
            <span className="bg-teal-100 text-teal-700 px-2 py-1 rounded-full text-xs font-bold ml-auto">
              {certsForLanguage.length}
            </span>
          </div>

          {loadingCerts || issuingCertificate ? (
            <div className="text-center py-8">
              <div className="flex items-center justify-center mb-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
              </div>
              <p className="text-gray-600 text-sm font-medium">
                {issuingCertificate ? "Duke krijuar certifikatën tuaj..." : "Duke ngarkuar certifikatat..."}
              </p>
            </div>
          ) : certsForLanguage.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {certsForLanguage.map((certificate) => (
                <div
                  key={certificate._id}
                  className="bg-gradient-to-br from-purple-50 via-purple-100 to-pink-50 rounded-xl p-3 border-2 border-purple-300 shadow-md hover:shadow-lg transition-all"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-1 rounded-full shadow-sm flex-shrink-0">
                        <img src={logo || "/placeholder.svg"} className="w-12 h-12 rounded-full" alt="logo" />
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 justify-center">
                          <span className="text-lg">{LANGUAGE_LABELS[certificate.language || "de"]?.flag}</span>
                          <h3 className="font-bold text-gray-900 text-base">Niveli {certificate.level}</h3>
                        </div>
                        <p className="text-xs text-gray-500">{LANGUAGE_LABELS[certificate.language || "de"]?.label}</p>
                        <p className="text-xs text-gray-600 font-medium whitespace-nowrap">
                          {new Date(certificate.issuedAt).toLocaleDateString("sq-AL", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadCertificate(certificate._id, certificate.level, certificate.language)}
                      disabled={downloadingCert === certificate._id}
                      className="text-gray-700 px-3 py-2 rounded-lg transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transform hover:scale-105 text-sm w-full bg-white/50"
                    >
                      {downloadingCert === certificate._id ? (
                        <><div className="w-4 h-4 animate-spin rounded-full border-b-2 border-current" /><span>Duke shkarkuar...</span></>
                      ) : (
                        <><Download className="h-4 w-4" /> Shkarko</>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center shadow-inner">
                <FileText className="h-12 w-12 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Ende Nuk Keni Certifikata</h3>
              <p className="text-gray-600 text-sm max-w-md mx-auto">
                Përfundoni testet në{" "}
                <span className="font-semibold">{LANGUAGE_LABELS[language]?.label || language}</span>{" "}
                për të fituar certifikatën tuaj të parë!
              </p>
            </div>
          )}
        </div>

      </div>
    </>
  )
}

export default Account