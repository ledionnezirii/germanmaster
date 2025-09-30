"use client"
import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { authService, certificatesService } from "../services/api"
import { User, Star, Trophy, BookOpen, Camera, Loader2, Flame, Award, Download, FileText } from "lucide-react"
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
              <Trophy className="h-6 w-6 text-green-600" />
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
            <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-4" />
            <p className="text-gray-600">
              {issuingCertificate ? "Duke krijuar certifikatën tuaj..." : "Duke ngarkuar certifikatat..."}
            </p>
          </div>
        ) : certificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {certificates.map((certificate) => (
              <div
                key={certificate._id}
                className={`bg-gradient-to-r ${getCertificateBadgeColor(certificate.level)} rounded-xl p-6 border-2 hover:shadow-lg transition-all duration-200`}
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
                    className="w-full bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {downloadingCert === certificate._id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
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
