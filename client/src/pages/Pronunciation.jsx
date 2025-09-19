"use client"

import { useState, useEffect } from "react"
import { Mic, MicOff, Volume2, Check, Star, RotateCcw, ArrowLeft, ArrowRight } from "lucide-react"
import { pronunciationService } from "../services/api"

const PronunciationPractice = () => {
  const [packages, setPackages] = useState([])
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState(null)
  const [synthesis, setSynthesis] = useState(null)
  const [sessionStats, setSessionStats] = useState({
    correctAnswers: 0,
    totalAttempts: 0,
    completedWords: [],
    totalXP: 0,
  })
  const [feedback, setFeedback] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(false)
  const [completedPackages, setCompletedPackages] = useState(new Set())

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if ("webkitSpeechRecognition" in window) {
      const recognitionInstance = new window.webkitSpeechRecognition()
      recognitionInstance.continuous = false
      recognitionInstance.interimResults = false
      recognitionInstance.lang = "de-DE"
      setRecognition(recognitionInstance)
    }

    if ("speechSynthesis" in window) {
      setSynthesis(window.speechSynthesis)
    }

    loadPackages()
    loadCompletedPackages()
  }, [])

  const loadCompletedPackages = async () => {
    try {
      console.log("[v0] Attempting to load completed packages...")
      console.log("[v0] Making API call to:", "/api/pronunciation/completed-pronunciation-packages")
      const response = await pronunciationService.getUserCompletedPackages()
      console.log("[v0] Completed packages response:", response)
      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response headers:", response.headers)

      const completedIds = response.data?.data?.completedPronunciationPackages || []
      console.log("[v0] Extracted completed IDs:", completedIds)
      setCompletedPackages(new Set(completedIds.map((pkg) => pkg._id || pkg)))
    } catch (error) {
      console.error("[v0] Error loading completed packages:", error)
      console.error("[v0] Error details:", error.response?.data)
      console.error("[v0] Error status:", error.response?.status)
      console.error("[v0] Error message:", error.message)
      setCompletedPackages(new Set())
    }
  }

  const loadPackages = async () => {
    try {
      setLoading(true)
      console.log("[v0] Loading packages...")
      const response = await pronunciationService.getWords()
      console.log("[v0] Packages response:", response)
      console.log("[v0] Response data:", response.data)
      console.log("[v0] Response data type:", typeof response.data)
      console.log("[v0] Is response.data an array?", Array.isArray(response.data))

      const packagesData = response.data

      // Handle different response structures
      if (packagesData && typeof packagesData === "object") {
        if (Array.isArray(packagesData)) {
          // Already an array
          setPackages(packagesData)
        } else if (packagesData.packages && Array.isArray(packagesData.packages)) {
          // Data is nested under packages property
          setPackages(packagesData.packages)
        } else if (packagesData.data && Array.isArray(packagesData.data)) {
          // Data is nested under data property
          setPackages(packagesData.data)
        } else {
          // Unknown structure, log and set empty array
          console.error("[v0] Unknown packages data structure:", packagesData)
          setPackages([])
        }
      } else {
        // No data or invalid data
        console.log("[v0] No packages data found")
        setPackages([])
      }
    } catch (error) {
      console.error("[v0] Error loading packages:", error)
      console.error("[v0] Error details:", error.response?.data)
      setPackages([]) // Always ensure it's an array
    } finally {
      setLoading(false)
    }
  }

  const startListening = () => {
    if (recognition && !sessionStats.completedWords.includes(currentWordIndex)) {
      setIsListening(true)
      setFeedback("")

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase()
        checkPronunciation(transcript)
      }

      recognition.onerror = () => {
        setIsListening(false)
        setFeedback("Error with speech recognition. Please try again.")
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
    }
  }

  const checkPronunciation = async (spokenText) => {
    const currentWord = selectedPackage.words[currentWordIndex]

    try {
      const response = await pronunciationService.checkPronunciation(selectedPackage._id, currentWordIndex, spokenText)

      const { correct, xpAdded, alreadyCompleted } = response.data

      setSessionStats((prev) => ({
        ...prev,
        totalAttempts: prev.totalAttempts + 1,
        correctAnswers: correct ? prev.correctAnswers + 1 : prev.correctAnswers,
        completedWords:
          correct && !prev.completedWords.includes(currentWordIndex)
            ? [...prev.completedWords, currentWordIndex]
            : prev.completedWords,
        totalXP: prev.totalXP + xpAdded,
      }))

      if (alreadyCompleted) {
        setFeedback("Tashmë e përfunduar! Nuk merr XP shtesë.")
      } else if (correct) {
        setFeedback(`Shkëlqyeshëm! +${xpAdded} XP`)
      } else {
        setFeedback("Provo përsëri! Dëgjo shqiptimin.")
      }
    } catch (error) {
      console.error("Error checking pronunciation:", error)
      setFeedback("Gabim në kontrollimin e shqiptimit. Provo përsëri.")
    }
  }

  const playPronunciation = (word) => {
    if (synthesis) {
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.lang = "de-DE"
      utterance.rate = 0.8
      synthesis.speak(utterance)
    }
  }

  const nextWord = () => {
    if (currentWordIndex < selectedPackage.words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1)
      setFeedback("")
    } else {
      const passThreshold = Math.ceil(selectedPackage.words.length * 0.7)
      if (sessionStats.completedWords.length >= passThreshold) {
        setCompletedPackages((prev) => new Set([...prev, selectedPackage._id]))
        // The completion will be saved to database via the backend when checking pronunciation
      }
      setShowResults(true)
    }
  }

  const prevWord = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(currentWordIndex - 1)
      setFeedback("")
    }
  }

  const resetSession = () => {
    setCurrentWordIndex(0)
    setSessionStats({
      correctAnswers: 0,
      totalAttempts: 0,
      completedWords: [],
      totalXP: 0,
    })
    setFeedback("")
    setShowResults(false)
  }

  const selectPackage = (pkg) => {
    setSelectedPackage(pkg)
    resetSession()
  }

  const progressPercentage = selectedPackage
    ? (sessionStats.completedWords.length / selectedPackage.words.length) * 100
    : 0

  const passThreshold = selectedPackage ? Math.ceil(selectedPackage.words.length * 0.7) : 0
  const hasPassed = sessionStats.completedWords.length >= passThreshold

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
        }}
      >
        <div style={{ textAlign: "center", color: "#64748b" }}>
          <div style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Duke u ngarkuar...</div>
        </div>
      </div>
    )
  }

  if (!selectedPackage) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
          padding: "1rem",
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto", width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <h1
              style={{
                fontSize: "clamp(1.8rem, 4vw, 2.2rem)",
                fontWeight: "700",
                color: "#1e293b",
                marginBottom: "0.5rem",
                letterSpacing: "-0.025em",
              }}
            >
              Praktika e Shqiptimit
            </h1>
            <p
              style={{
                color: "#64748b",
                fontSize: "clamp(1rem, 2.5vw, 1.1rem)",
                maxWidth: "600px",
                margin: "0 auto",
              }}
            >
              Zgjidh një paketë për të filluar praktikën e shqiptimit gjerman
            </p>
          </div>

          {!Array.isArray(packages) || packages.length === 0 ? (
            <div
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "3rem 2rem",
                textAlign: "center",
                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                border: "1px solid #e2e8f0",
              }}
            >
              <p style={{ color: "#64748b", fontSize: "1.1rem" }}>
                {!Array.isArray(packages)
                  ? "Gabim në ngarkimin e paketave. Ju lutem rifreskoni faqen."
                  : "Nuk ka paketa shqiptimi të disponueshme. Ju lutem kontaktoni administratorin tuaj."}
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "1.25rem",
              }}
            >
              {packages.map((pkg) => (
                <div
                  key={pkg._id}
                  onClick={() => selectPackage(pkg)}
                  style={{
                    background: completedPackages.has(pkg._id) ? "#fb923c" : "white",
                    borderRadius: "12px",
                    padding: "1.75rem",
                    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    border: "1px solid #e2e8f0",
                    color: completedPackages.has(pkg._id) ? "white" : "inherit",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)"
                    e.currentTarget.style.boxShadow = "0 4px 12px -2px rgba(0, 0, 0, 0.1)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)"
                    e.currentTarget.style.boxShadow = "0 1px 3px 0 rgba(0, 0, 0, 0.1)"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "1rem",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "1.25rem",
                        fontWeight: "600",
                        color: completedPackages.has(pkg._id) ? "white" : "#1e293b",
                        flex: "1",
                        minWidth: "0",
                      }}
                    >
                      {pkg.title}
                    </h3>
                    <span
                      style={{
                        background: completedPackages.has(pkg._id) ? "rgba(255,255,255,0.2)" : "#10b981",
                        color: "white",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "9999px",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        flexShrink: "0",
                      }}
                    >
                      {pkg.level}
                    </span>
                  </div>
                  <p
                    style={{
                      color: completedPackages.has(pkg._id) ? "rgba(255,255,255,0.8)" : "#64748b",
                      marginBottom: "1rem",
                      fontSize: "0.95rem",
                    }}
                  >
                    {pkg.words?.length || 0} fjalë për të praktikuar
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Star size={16} style={{ color: completedPackages.has(pkg._id) ? "white" : "#f59e0b" }} />
                    <span
                      style={{
                        color: completedPackages.has(pkg._id) ? "rgba(255,255,255,0.8)" : "#64748b",
                        fontSize: "0.875rem",
                      }}
                    >
                      Deri në {pkg.words?.reduce((sum, word) => sum + (word.xp || 5), 0) || 0} XP
                    </span>
                  </div>
                  {completedPackages.has(pkg._id) && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginTop: "1rem",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                      }}
                    >
                      <Check size={16} />E përfunduar
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (showResults) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
          padding: "1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ maxWidth: "500px", width: "100%" }}>
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "2.5rem 2rem",
              boxShadow: "0 4px 12px -2px rgba(0, 0, 0, 0.1)",
              textAlign: "center",
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                width: "70px",
                height: "70px",
                background: hasPassed ? "#10b981" : "#f59e0b",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.5rem",
              }}
            >
              {hasPassed ? <Check size={32} color="white" /> : <Star size={32} color="white" />}
            </div>

            <h2
              style={{
                fontSize: "1.75rem",
                fontWeight: "700",
                color: "#1e293b",
                marginBottom: "1rem",
              }}
            >
              {hasPassed ? "Urime!" : "Vazhdo të praktikosh!"}
            </h2>

            <p
              style={{
                color: "#64748b",
                fontSize: "1rem",
                marginBottom: "2rem",
                lineHeight: "1.5",
              }}
            >
              {hasPassed
                ? `Kalove me ${sessionStats.correctAnswers}/${selectedPackage.words.length} të sakta!`
                : `Ke ${sessionStats.correctAnswers}/${selectedPackage.words.length} të sakta. Duhen ${passThreshold} për të kaluar.`}
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1.5rem",
                marginBottom: "2rem",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.75rem", fontWeight: "700", color: "#10b981" }}>{sessionStats.totalXP}</div>
                <div style={{ color: "#64748b", fontSize: "0.875rem" }}>XP të fituara</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.75rem", fontWeight: "700", color: "#3b82f6" }}>
                  {Math.round((sessionStats.correctAnswers / selectedPackage.words.length) * 100)}%
                </div>
                <div style={{ color: "#64748b", fontSize: "0.875rem" }}>Saktësi</div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={resetSession}
                style={{
                  background: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "0.75rem 1.5rem",
                  fontSize: "0.95rem",
                  fontWeight: "500",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  transition: "background-color 0.2s ease",
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = "#059669")}
                onMouseLeave={(e) => (e.target.style.backgroundColor = "#10b981")}
              >
                <RotateCcw size={16} />
                Provo Përsëri
              </button>
              <button
                onClick={() => setSelectedPackage(null)}
                style={{
                  background: "#6b7280",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "0.75rem 1.5rem",
                  fontSize: "0.95rem",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "background-color 0.2s ease",
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = "#4b5563")}
                onMouseLeave={(e) => (e.target.style.backgroundColor = "#6b7280")}
              >
                Kthehu te Paketat
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentWord = selectedPackage.words[currentWordIndex]
  const isWordCompleted = sessionStats.completedWords.includes(currentWordIndex)

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        padding: "1rem",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto", width: "100%" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <button
            onClick={() => setSelectedPackage(null)}
            style={{
              background: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "0.5rem 1rem",
              cursor: "pointer",
              color: "#64748b",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.9rem",
            }}
          >
            <ArrowLeft size={16} />
            Kthehu
          </button>
          <h1
            style={{
              fontSize: "clamp(1.2rem, 3vw, 1.5rem)",
              fontWeight: "600",
              color: "#1e293b",
              textAlign: "center",
              flex: "1",
            }}
          >
            {selectedPackage.title}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Star size={16} style={{ color: "#f59e0b" }} />
            <span style={{ fontWeight: "600", color: "#1e293b", fontSize: "0.95rem" }}>{sessionStats.totalXP} XP</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "0.5rem",
              fontSize: "0.875rem",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            <span style={{ color: "#64748b" }}>
              Progresi: {sessionStats.completedWords.length}/{selectedPackage.words.length}
            </span>
            <span style={{ color: "#64748b" }}>Duhen {passThreshold} për të kaluar</span>
          </div>
          <div
            style={{
              width: "100%",
              height: "6px",
              background: "#e2e8f0",
              borderRadius: "3px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progressPercentage}%`,
                height: "100%",
                background: "#10b981",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        {/* Word Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(50px, 1fr))",
            gap: "0.5rem",
            marginBottom: "1.5rem",
            maxWidth: "100%",
          }}
        >
          {selectedPackage.words.map((_, index) => (
            <div
              key={index}
              onClick={() => setCurrentWordIndex(index)}
              style={{
                aspectRatio: "1",
                minHeight: "50px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: "500",
                border: currentWordIndex === index ? "2px solid #10b981" : "1px solid #e2e8f0",
                background: sessionStats.completedWords.includes(index)
                  ? "#10b981"
                  : currentWordIndex === index
                    ? "#f0f9ff"
                    : "white",
                color: sessionStats.completedWords.includes(index)
                  ? "white"
                  : currentWordIndex === index
                    ? "#10b981"
                    : "#64748b",
                transition: "all 0.2s ease",
              }}
            >
              {sessionStats.completedWords.includes(index) ? <Check size={18} /> : index + 1}
            </div>
          ))}
        </div>

        {/* Main Practice Card */}
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "clamp(2rem, 4vw, 3rem)",
            boxShadow: "0 4px 12px -2px rgba(0, 0, 0, 0.1)",
            textAlign: "center",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ marginBottom: "2rem" }}>
            <h2
              style={{
                fontSize: "clamp(2rem, 6vw, 3rem)",
                fontWeight: "700",
                color: "#1e293b",
                marginBottom: "1rem",
                wordBreak: "break-word",
              }}
            >
              {currentWord.word}
            </h2>
            <p
              style={{
                fontSize: "clamp(1rem, 3vw, 1.25rem)",
                color: "#64748b",
                marginBottom: "0.5rem",
              }}
            >
              [{currentWord.pronunciation}]
            </p>
            <p
              style={{
                fontSize: "clamp(0.95rem, 2.5vw, 1.1rem)",
                color: "#64748b",
              }}
            >
              {currentWord.translation}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "1rem",
              marginBottom: "2rem",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => playPronunciation(currentWord.word)}
              style={{
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: "60px",
                height: "60px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#2563eb"
                e.target.style.transform = "scale(1.05)"
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#3b82f6"
                e.target.style.transform = "scale(1)"
              }}
            >
              <Volume2 size={24} />
            </button>

            <button
              onClick={startListening}
              disabled={isListening || isWordCompleted}
              style={{
                background: isListening ? "#ef4444" : isWordCompleted ? "#6b7280" : "#10b981",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: "80px",
                height: "80px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: isListening || isWordCompleted ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                fontSize: "1.1rem",
                fontWeight: "500",
              }}
              onMouseEnter={(e) => {
                if (!isListening && !isWordCompleted) {
                  e.target.style.backgroundColor = "#059669"
                  e.target.style.transform = "scale(1.05)"
                }
              }}
              onMouseLeave={(e) => {
                if (!isListening && !isWordCompleted) {
                  e.target.style.backgroundColor = "#10b981"
                  e.target.style.transform = "scale(1)"
                }
              }}
            >
              {isWordCompleted ? <Check size={32} /> : isListening ? <MicOff size={32} /> : <Mic size={32} />}
            </button>
          </div>

          {feedback && (
            <div
              style={{
                padding: "1rem",
                borderRadius: "8px",
                marginBottom: "2rem",
                background:
                  feedback.includes("Shkëlqyeshëm") || feedback.includes("Correct")
                    ? "#dcfce7"
                    : feedback.includes("Tashmë e përfunduar")
                      ? "#fef3c7"
                      : "#fee2e2",
                color:
                  feedback.includes("Shkëlqyeshëm") || feedback.includes("Correct")
                    ? "#166534"
                    : feedback.includes("Tashmë e përfunduar")
                      ? "#92400e"
                      : "#dc2626",
                fontWeight: "500",
                fontSize: "0.95rem",
              }}
            >
              {feedback}
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <button
              onClick={prevWord}
              disabled={currentWordIndex === 0}
              style={{
                background: currentWordIndex === 0 ? "#f1f5f9" : "#64748b",
                color: currentWordIndex === 0 ? "#94a3b8" : "white",
                border: "none",
                borderRadius: "8px",
                padding: "0.75rem 1.25rem",
                cursor: currentWordIndex === 0 ? "not-allowed" : "pointer",
                fontWeight: "500",
                fontSize: "0.9rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <ArrowLeft size={16} />E mëparshme
            </button>

            <span
              style={{
                color: "#64748b",
                fontSize: "0.875rem",
                textAlign: "center",
                minWidth: "fit-content",
              }}
            >
              {currentWordIndex + 1} nga {selectedPackage.words.length}
            </span>

            <button
              onClick={nextWord}
              style={{
                background: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "0.75rem 1.25rem",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "0.9rem",
                transition: "background-color 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#059669")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#10b981")}
            >
              {currentWordIndex === selectedPackage.words.length - 1 ? "Përfundo" : "Tjetri"}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PronunciationPractice
