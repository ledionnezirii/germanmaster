import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"

export default function PracticePage() {
  const { user, token } = useAuth()
  const [practices, setPractices] = useState([])
  const [selectedPractice, setSelectedPractice] = useState(null)
  const [userAnswers, setUserAnswers] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showXpAnimation, setShowXpAnimation] = useState(false)
  const [filters, setFilters] = useState({
    level: "all",
    category: "all",
    type: "all",
  })

  useEffect(() => {
    fetchPractices()
  }, [filters])

  const fetchPractices = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      if (filters.level !== "all") queryParams.append("level", filters.level)
      if (filters.category !== "all") queryParams.append("category", filters.category)
      if (filters.type !== "all") queryParams.append("type", filters.type)

      const response = await fetch(`/api/practice?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (data.success) {
        setPractices(data.data)
      }
    } catch (error) {
      console.error("Error fetching practices:", error)
    } finally {
      setLoading(false)
    }
  }

  const startPractice = (practice) => {
    setSelectedPractice(practice)
    setUserAnswers(new Array(practice.questions.length).fill(""))
    setResult(null)
    setShowXpAnimation(false)
  }

  const handleAnswerChange = (questionIndex, value) => {
    const newAnswers = [...userAnswers]
    newAnswers[questionIndex] = value
    setUserAnswers(newAnswers)
  }

  const submitPractice = async () => {
    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/practice/${selectedPractice._id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answers: userAnswers }),
      })

      const data = await response.json()
      if (data.success) {
        setResult(data.data)
        // <CHANGE> Trigger XP animation after result is set
        if (data.data.xpAwarded > 0) {
          setTimeout(() => setShowXpAnimation(true), 300)
        }
      }
    } catch (error) {
      console.error("Error submitting practice:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetPractice = () => {
    setSelectedPractice(null)
    setUserAnswers([])
    setResult(null)
    setShowXpAnimation(false)
    fetchPractices()
  }

  const renderQuestion = (question, index) => {
    const practice = selectedPractice

    switch (practice.type) {
      case "dropdown":
        return (
          <div key={index} style={{ marginBottom: "12px" }}>
            <p style={{ fontSize: "14px", fontWeight: "500", color: "#1f2937", marginBottom: "6px", fontFamily: "Poppins, sans-serif" }}>
              {question.questionText}
            </p>
            {question.hint && (
              <p style={{ fontSize: "12px", color: "#6b7280", fontStyle: "italic", marginBottom: "6px", fontFamily: "Inter, sans-serif" }}>
                💡 {question.hint}
              </p>
            )}
            <select
              value={userAnswers[index] || ""}
              onChange={(e) => handleAnswerChange(index, e.target.value)}
              disabled={!!result}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "2px solid #d1d5db",
                borderRadius: "8px",
                backgroundColor: "#fff",
                color: "#1f2937",
                fontSize: "13px",
                fontFamily: "Inter, sans-serif",
                outline: "none",
              }}
            >
              <option value="">Zgjidhni përgjigjen...</option>
              {question.options.map((option, optIndex) => (
                <option key={optIndex} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {result && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
                {result.gradedAnswers[index].isCorrect ? (
                  <svg style={{ height: "16px", width: "16px", color: "#16a34a" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg style={{ height: "16px", width: "16px", color: "#dc2626" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span style={{ color: result.gradedAnswers[index].isCorrect ? "#16a34a" : "#dc2626", fontWeight: "500", fontSize: "13px", fontFamily: "Poppins, sans-serif" }}>
                  {result.gradedAnswers[index].isCorrect ? "Saktë!" : "Gabim"}
                </span>
              </div>
            )}
          </div>
        )

      case "fillin":
        if (question.blanks && question.blanks.length > 0) {
          return (
            <div key={index} style={{ marginBottom: "12px" }}>
              <p style={{ fontSize: "14px", fontWeight: "500", color: "#1f2937", marginBottom: "6px", fontFamily: "Poppins, sans-serif" }}>
                {question.questionText}
              </p>
              {question.hint && (
                <p style={{ fontSize: "12px", color: "#6b7280", fontStyle: "italic", marginBottom: "6px", fontFamily: "Inter, sans-serif" }}>
                  💡 {question.hint}
                </p>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {question.blanks.map((blank, blankIndex) => (
                  <input
                    key={blankIndex}
                    type="text"
                    placeholder={`Zbrazëtira ${blankIndex + 1}...`}
                    value={Array.isArray(userAnswers[index]) ? userAnswers[index][blankIndex] || "" : ""}
                    onChange={(e) => {
                      const newBlanks = Array.isArray(userAnswers[index]) ? [...userAnswers[index]] : new Array(question.blanks.length).fill("")
                      newBlanks[blankIndex] = e.target.value
                      handleAnswerChange(index, newBlanks)
                    }}
                    disabled={!!result}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "2px solid #d1d5db",
                      borderRadius: "8px",
                      backgroundColor: "#fff",
                      color: "#1f2937",
                      fontSize: "13px",
                      fontFamily: "Inter, sans-serif",
                      outline: "none",
                    }}
                  />
                ))}
              </div>
              {result && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
                  {result.gradedAnswers[index].isCorrect ? (
                    <svg style={{ height: "16px", width: "16px", color: "#16a34a" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg style={{ height: "16px", width: "16px", color: "#dc2626" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <span style={{ color: result.gradedAnswers[index].isCorrect ? "#16a34a" : "#dc2626", fontWeight: "500", fontSize: "13px", fontFamily: "Poppins, sans-serif" }}>
                    {result.gradedAnswers[index].isCorrect ? "Saktë!" : "Gabim"}
                  </span>
                </div>
              )}
            </div>
          )
        } else {
          return (
            <div key={index} style={{ marginBottom: "12px" }}>
              <p style={{ fontSize: "14px", fontWeight: "500", color: "#1f2937", marginBottom: "6px", fontFamily: "Poppins, sans-serif" }}>
                {question.questionText}
              </p>
              {question.hint && (
                <p style={{ fontSize: "12px", color: "#6b7280", fontStyle: "italic", marginBottom: "6px", fontFamily: "Inter, sans-serif" }}>
                  💡 {question.hint}
                </p>
              )}
              <input
                type="text"
                placeholder="Përgjigja juaj..."
                value={userAnswers[index] || ""}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                disabled={!!result}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "2px solid #d1d5db",
                  borderRadius: "8px",
                  backgroundColor: "#fff",
                  color: "#1f2937",
                  fontSize: "13px",
                  fontFamily: "Inter, sans-serif",
                  outline: "none",
                }}
              />
              {result && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
                  {result.gradedAnswers[index].isCorrect ? (
                    <svg style={{ height: "16px", width: "16px", color: "#16a34a" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg style={{ height: "16px", width: "16px", color: "#dc2626" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <span style={{ color: result.gradedAnswers[index].isCorrect ? "#16a34a" : "#dc2626", fontWeight: "500", fontSize: "13px", fontFamily: "Poppins, sans-serif" }}>
                    {result.gradedAnswers[index].isCorrect ? "Saktë!" : "Gabim"}
                  </span>
                </div>
              )}
            </div>
          )
        }

      case "checkbox":
        return (
          <div key={index} style={{ marginBottom: "12px" }}>
            <p style={{ fontSize: "14px", fontWeight: "500", color: "#1f2937", marginBottom: "6px", fontFamily: "Poppins, sans-serif" }}>
              {question.questionText}
            </p>
            {question.hint && (
              <p style={{ fontSize: "12px", color: "#6b7280", fontStyle: "italic", marginBottom: "6px", fontFamily: "Inter, sans-serif" }}>
                💡 {question.hint}
              </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {question.options.map((option, optIndex) => {
                const currentAnswers = Array.isArray(userAnswers[index]) ? userAnswers[index] : []
                const isChecked = currentAnswers.includes(option)

                return (
                  <label key={optIndex} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", padding: "6px", borderRadius: "6px" }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        let newAnswers = [...currentAnswers]
                        if (e.target.checked) {
                          newAnswers.push(option)
                        } else {
                          newAnswers = newAnswers.filter((a) => a !== option)
                        }
                        handleAnswerChange(index, newAnswers)
                      }}
                      disabled={!!result}
                      style={{ width: "16px", height: "16px" }}
                    />
                    <span style={{ color: "#1f2937", fontSize: "13px", fontFamily: "Inter, sans-serif" }}>{option}</span>
                  </label>
                )
              })}
            </div>
            {result && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
                {result.gradedAnswers[index].isCorrect ? (
                  <svg style={{ height: "16px", width: "16px", color: "#16a34a" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg style={{ height: "16px", width: "16px", color: "#dc2626" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span style={{ color: result.gradedAnswers[index].isCorrect ? "#16a34a" : "#dc2626", fontWeight: "500", fontSize: "13px", fontFamily: "Poppins, sans-serif" }}>
                  {result.gradedAnswers[index].isCorrect ? "Saktë!" : "Gabim"}
                </span>
              </div>
            )}
          </div>
        )

      case "radio":
        return (
          <div key={index} style={{ marginBottom: "12px" }}>
            <p style={{ fontSize: "14px", fontWeight: "500", color: "#1f2937", marginBottom: "6px", fontFamily: "Poppins, sans-serif" }}>
              {question.questionText}
            </p>
            {question.hint && (
              <p style={{ fontSize: "12px", color: "#6b7280", fontStyle: "italic", marginBottom: "6px", fontFamily: "Inter, sans-serif" }}>
                💡 {question.hint}
              </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {question.options.map((option, optIndex) => (
                <label key={optIndex} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", padding: "6px", borderRadius: "6px" }}>
                  <input
                    type="radio"
                    name={`question-${index}`}
                    value={option}
                    checked={userAnswers[index] === option}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    disabled={!!result}
                    style={{ width: "16px", height: "16px" }}
                  />
                  <span style={{ color: "#1f2937", fontSize: "13px", fontFamily: "Inter, sans-serif" }}>{option}</span>
                </label>
              ))}
            </div>
            {result && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
                {result.gradedAnswers[index].isCorrect ? (
                  <svg style={{ height: "16px", width: "16px", color: "#16a34a" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg style={{ height: "16px", width: "16px", color: "#dc2626" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span style={{ color: result.gradedAnswers[index].isCorrect ? "#16a34a" : "#dc2626", fontWeight: "500", fontSize: "13px", fontFamily: "Poppins, sans-serif" }}>
                  {result.gradedAnswers[index].isCorrect ? "Saktë!" : "Gabim"}
                </span>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #eef2ff 100%)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "48px", height: "48px", border: "4px solid #2563eb", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }}></div>
          <p style={{ color: "#6b7280", marginTop: "16px", fontFamily: "Poppins, sans-serif" }}>Duke u ngarkuar...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (selectedPractice) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #eef2ff 100%)", padding: "24px 16px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ backgroundColor: "#fff", borderRadius: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", padding: "24px", border: "1px solid #e5e7eb" }}>
            {/* Header */}
            <div style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: "16px", marginBottom: "20px" }}>
              <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#1f2937", marginBottom: "12px", fontFamily: "Poppins, sans-serif" }}>
                {selectedPractice.title}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ padding: "4px 12px", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", fontSize: "12px", fontWeight: "600", borderRadius: "12px", fontFamily: "Inter, sans-serif" }}>
                  {selectedPractice.level}
                </span>
                <span style={{ padding: "4px 12px", backgroundColor: "#f3f4f6", color: "#1f2937", fontSize: "12px", fontWeight: "500", borderRadius: "12px", fontFamily: "Inter, sans-serif" }}>
                  {selectedPractice.category}
                </span>
                <span style={{ padding: "4px 12px", backgroundColor: "#f3f4f6", color: "#1f2937", fontSize: "12px", fontWeight: "500", borderRadius: "12px", textTransform: "capitalize", fontFamily: "Inter, sans-serif" }}>
                  {selectedPractice.type}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#d97706", fontWeight: "600", fontFamily: "Inter, sans-serif" }}>
                  <svg style={{ height: "16px", width: "16px" }} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>{selectedPractice.xp} XP</span>
                </div>
              </div>
            </div>

            {/* Example */}
            {selectedPractice.exampleSentence && (
              <div style={{ background: "linear-gradient(135deg, #dbeafe, #e0e7ff)", padding: "12px", borderRadius: "10px", borderLeft: "4px solid #3b82f6", marginBottom: "16px" }}>
                <p style={{ fontSize: "12px", fontWeight: "600", color: "#1e3a8a", marginBottom: "6px", fontFamily: "Poppins, sans-serif" }}>Shembull:</p>
                <p style={{ fontSize: "13px", color: "#1f2937", fontFamily: "Inter, sans-serif" }}>{selectedPractice.exampleSentence}</p>
              </div>
            )}

            {/* Description */}
            {selectedPractice.description && (
              <p style={{ color: "#6b7280", fontSize: "13px", lineHeight: "1.6", marginBottom: "16px", fontFamily: "Inter, sans-serif" }}>
                {selectedPractice.description}
              </p>
            )}

            {/* Progress */}
            {!result && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                  <span style={{ color: "#6b7280", fontWeight: "500", fontFamily: "Poppins, sans-serif" }}>Progresi</span>
                  <span style={{ fontWeight: "600", color: "#1f2937", fontFamily: "Inter, sans-serif" }}>
                    {userAnswers.filter((a) => a && (Array.isArray(a) ? a.length > 0 : a !== "")).length} / {selectedPractice.questions.length}
                  </span>
                </div>
                <div style={{ width: "100%", backgroundColor: "#e5e7eb", borderRadius: "8px", height: "8px", overflow: "hidden" }}>
                  <div
                    style={{
                      background: "linear-gradient(90deg, #3b82f6, #6366f1)",
                      height: "8px",
                      borderRadius: "8px",
                      transition: "width 0.5s ease-out",
                      width: `${(userAnswers.filter((a) => a && (Array.isArray(a) ? a.length > 0 : a !== "")).length / selectedPractice.questions.length) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            )}

            {/* Questions */}
            <div style={{ marginBottom: "16px" }}>
              {selectedPractice.questions.map((question, index) => (
                <div key={index} style={{ background: "linear-gradient(135deg, #f9fafb, #f3f4f6)", padding: "16px", borderRadius: "10px", border: "2px solid #e5e7eb", marginBottom: "12px" }}>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <div style={{ flexShrink: 0, width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: "#fff", fontFamily: "Poppins, sans-serif" }}>{index + 1}</span>
                    </div>
                    <div style={{ flex: 1 }}>{renderQuestion(question, index)}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Result with XP Animation */}
            {result && (
              <div style={{ background: "linear-gradient(135deg, #dbeafe, #e0e7ff, #ede9fe)", padding: "24px", borderRadius: "16px", border: "2px solid #93c5fd", marginBottom: "16px", position: "relative", overflow: "hidden" }}>
                {/* <CHANGE> Added XP animation overlay */}
                {showXpAnimation && (
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      fontSize: "48px",
                      fontWeight: "700",
                      color: "#d97706",
                      animation: "xpFloat 2s ease-out forwards",
                      zIndex: 10,
                      textShadow: "0 2px 10px rgba(217, 119, 6, 0.5)",
                      fontFamily: "Poppins, sans-serif",
                    }}
                  >
                    +{result.xpAwarded} XP
                  </div>
                )}
                <style>{`
                  @keyframes xpFloat {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                    50% { opacity: 1; transform: translate(-50%, -70%) scale(1.2); }
                    100% { opacity: 0; transform: translate(-50%, -100%) scale(1); }
                  }
                `}</style>

                <div style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#1f2937", fontFamily: "Poppins, sans-serif" }}>Rezultati</h3>
                    <span
                      style={{
                        padding: "6px 16px",
                        fontSize: "16px",
                        fontWeight: "700",
                        borderRadius: "12px",
                        background: result.passed ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #ef4444, #dc2626)",
                        color: "#fff",
                        fontFamily: "Poppins, sans-serif",
                      }}
                    >
                      {result.score}%
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div style={{ backgroundColor: "#fff", padding: "12px", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                      <p style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px", fontFamily: "Inter, sans-serif" }}>Përgjigje të sakta</p>
                      <p style={{ fontSize: "24px", fontWeight: "700", color: "#16a34a", fontFamily: "Poppins, sans-serif" }}>
                        {result.correctCount} / {result.totalQuestions}
                      </p>
                    </div>
                    <div style={{ backgroundColor: "#fff", padding: "12px", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                      <p style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px", fontFamily: "Inter, sans-serif" }}>XP e fituar</p>
                      <p style={{ fontSize: "24px", fontWeight: "700", color: "#d97706", fontFamily: "Poppins, sans-serif" }}>+{result.xpAwarded}</p>
                    </div>
                  </div>
                  {result.passed ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#16a34a", backgroundColor: "#dcfce7", padding: "10px", borderRadius: "8px", marginTop: "12px" }}>
                      <svg style={{ height: "20px", width: "20px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span style={{ fontWeight: "600", fontSize: "14px", fontFamily: "Poppins, sans-serif" }}>Kaluar! Punë e shkëlqyer! 🎉</span>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#d97706", backgroundColor: "#fef3c7", padding: "10px", borderRadius: "8px", marginTop: "12px" }}>
                      <svg style={{ height: "20px", width: "20px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span style={{ fontWeight: "600", fontSize: "14px", fontFamily: "Poppins, sans-serif" }}>Vazhdo të praktikosh! Ti mund ta bësh! 💪</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: "12px" }}>
              {!result ? (
                <>
                  <button
                    onClick={submitPractice}
                    disabled={isSubmitting}
                    style={{
                      flex: 1,
                      padding: "12px 20px",
                      background: "linear-gradient(135deg, #2563eb, #6366f1)",
                      color: "#fff",
                      fontWeight: "600",
                      borderRadius: "10px",
                      border: "none",
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      opacity: isSubmitting ? 0.5 : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      fontSize: "14px",
                      fontFamily: "Poppins, sans-serif",
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <div style={{ width: "16px", height: "16px", border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
                        Duke kontrolluar...
                      </>
                    ) : (
                      "Dërgo përgjigjet"
                    )}
                  </button>
                  <button
                    onClick={resetPractice}
                    style={{
                      padding: "12px 20px",
                      backgroundColor: "#e5e7eb",
                      color: "#1f2937",
                      fontWeight: "600",
                      borderRadius: "10px",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontFamily: "Poppins, sans-serif",
                    }}
                  >
                    Anulo
                  </button>
                </>
              ) : (
                <button
                  onClick={resetPractice}
                  style={{
                    width: "100%",
                    padding: "12px 20px",
                    background: "linear-gradient(135deg, #2563eb, #6366f1)",
                    color: "#fff",
                    fontWeight: "600",
                    borderRadius: "10px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontFamily: "Poppins, sans-serif",
                  }}
                >
                  Kthehu te lista
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #eef2ff 100%)", padding: "24px 16px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h1 style={{ fontSize: "36px", fontWeight: "700", background: "linear-gradient(135deg, #2563eb, #6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "8px", fontFamily: "Poppins, sans-serif" }}>
            Praktiko Gjermanishten
          </h1>
          <p style={{ fontSize: "14px", color: "#6b7280", maxWidth: "600px", margin: "0 auto", fontFamily: "Inter, sans-serif" }}>
            Përmirëso njohuritë e tua në gjermanisht me lloje të ndryshme ushtrimesh
          </p>
        </div>

        {/* Filters */}
        <div style={{ backgroundColor: "#fff", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", padding: "20px", border: "1px solid #e5e7eb", marginBottom: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "6px", fontFamily: "Poppins, sans-serif" }}>Niveli</label>
              <select
                value={filters.level}
                onChange={(e) => setFilters({ ...filters, level: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "2px solid #d1d5db",
                  borderRadius: "8px",
                  backgroundColor: "#fff",
                  color: "#1f2937",
                  fontSize: "13px",
                  fontFamily: "Inter, sans-serif",
                  outline: "none",
                }}
              >
                <option value="all">Të gjitha nivelet</option>
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="C1">C1</option>
                <option value="C2">C2</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "6px", fontFamily: "Poppins, sans-serif" }}>Kategoria</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "2px solid #d1d5db",
                  borderRadius: "8px",
                  backgroundColor: "#fff",
                  color: "#1f2937",
                  fontSize: "13px",
                  fontFamily: "Inter, sans-serif",
                  outline: "none",
                }}
              >
                <option value="all">Të gjitha kategoritë</option>
                <option value="Verben">Foljet</option>
                <option value="Artikel">Artikujt</option>
                <option value="Präpositionen">Parafjalët</option>
                <option value="Adjektive">Mbiemrat</option>
                <option value="Pronomen">Përemrat</option>
                <option value="Konjugation">Konjugimi</option>
                <option value="Deklination">Deklinimi</option>
                <option value="Satzbau">Struktura e fjalisë</option>
                <option value="Wortschatz">Fjalori</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "6px", fontFamily: "Poppins, sans-serif" }}>Lloji i ushtrimit</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "2px solid #d1d5db",
                  borderRadius: "8px",
                  backgroundColor: "#fff",
                  color: "#1f2937",
                  fontSize: "13px",
                  fontFamily: "Inter, sans-serif",
                  outline: "none",
                }}
              >
                <option value="all">Të gjitha llojet</option>
                <option value="dropdown">Dropdown</option>
                <option value="fillin">Plotëso zbrazëtirat</option>
                <option value="checkbox">Zgjedhje të shumta</option>
                <option value="radio">Zgjedhje e vetme</option>
              </select>
            </div>
          </div>
        </div>

        {/* Practices Grid */}
        {practices.length === 0 ? (
          <div style={{ backgroundColor: "#fff", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", padding: "48px", border: "1px solid #e5e7eb", textAlign: "center" }}>
            <svg style={{ height: "48px", width: "48px", margin: "0 auto 16px", color: "#9ca3af" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1f2937", marginBottom: "8px", fontFamily: "Poppins, sans-serif" }}>Nuk u gjetën ushtrime</h3>
            <p style={{ color: "#6b7280", fontSize: "13px", fontFamily: "Inter, sans-serif" }}>Provo filtra të tjerë ose kthehu më vonë.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {practices.map((practice) => (
              <div
                key={practice._id}
                onClick={() => startPractice(practice)}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: "12px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  padding: "16px",
                  border: "1px solid #e5e7eb",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)"
                  e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.12)"
                  e.currentTarget.style.borderColor = "#93c5fd"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"
                  e.currentTarget.style.borderColor = "#e5e7eb"
                }}
              >
                <h3 style={{ fontWeight: "700", fontSize: "16px", color: "#1f2937", marginBottom: "8px", fontFamily: "Poppins, sans-serif", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                  {practice.title}
                </h3>
                {practice.description && (
                  <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "12px", fontFamily: "Inter, sans-serif", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {practice.description}
                  </p>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
                  <span style={{ padding: "3px 10px", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", fontSize: "11px", fontWeight: "600", borderRadius: "10px", fontFamily: "Inter, sans-serif" }}>
                    {practice.level}
                  </span>
                  <span style={{ padding: "3px 10px", backgroundColor: "#f3f4f6", color: "#1f2937", fontSize: "11px", fontWeight: "500", borderRadius: "10px", fontFamily: "Inter, sans-serif" }}>
                    {practice.category}
                  </span>
                  <span style={{ padding: "3px 10px", backgroundColor: "#f3f4f6", color: "#1f2937", fontSize: "11px", fontWeight: "500", borderRadius: "10px", textTransform: "capitalize", fontFamily: "Inter, sans-serif" }}>
                    {practice.type}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "12px", borderTop: "1px solid #e5e7eb" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#6b7280", fontFamily: "Inter, sans-serif" }}>
                    <svg style={{ height: "14px", width: "14px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{practice.questions.length} pyetje</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: "600", color: "#d97706", fontFamily: "Inter, sans-serif" }}>
                    <svg style={{ height: "14px", width: "14px" }} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>{practice.xp} XP</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}