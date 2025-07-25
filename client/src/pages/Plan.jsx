"use client"

import { useState, useEffect } from "react"
import { planService, authService } from "../services/api"
import { CheckCircle2 } from "lucide-react"

export default function PlanPage() {
  const [selectedLevel, setSelectedLevel] = useState(null)
  const [plan, setPlan] = useState(null)
  const [userXp, setUserXp] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [submittingTopicId, setSubmittingTopicId] = useState(null) // New state for tracking submission

  const levels = ["A1", "A2", "B1", "B2", "C1", "C2"]

  useEffect(() => {
    const fetchPlanAndXp = async () => {
      if (!selectedLevel) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const xpResponse = await authService.getProfile()
        setUserXp(xpResponse.data.xp)

        const planResponse = await planService.getPlanByLevel(selectedLevel)
        setPlan(planResponse.data)
      } catch (err) {
        console.error(`Failed to fetch plan or XP for level ${selectedLevel}:`, err)
        setError(
          `Dështoi ngarkimi i planit të mësimit të gjermanishtes për nivelin ${selectedLevel}. Ju lutemi provoni përsëri.`,
        )
        setPlan(null)
      } finally {
        setLoading(false)
      }
    }

    fetchPlanAndXp()
  }, [selectedLevel])

  const handleLevelSelect = (level) => {
    setSelectedLevel(level)
    setPlan(null)
    setError(null)
  }

  const handleMarkAsFinished = async (topicId) => {
    if (!plan || submittingTopicId) return // Prevent multiple submissions or if no plan

    setSubmittingTopicId(topicId) // Set the topic currently being submitted

    // Optimistic UI update: Update the plan state immediately
    setPlan((prevPlan) => {
      if (!prevPlan) return null // Should not happen if !plan check passes

      const updatedTopics = prevPlan.topics.map((topic) =>
        topic._id === topicId
          ? { ...topic, isCompleted: true, xpAwarded: 100, completedAt: new Date().toISOString() } // Use ISO string for consistency
          : topic,
      )
      return { ...prevPlan, topics: updatedTopics }
    })

    try {
      const response = await planService.markTopicAsCompleted(plan._id, topicId)
      if (response.success) {
        console.log("Updated plan from server:", response.data.plan)
        // The optimistic update should already reflect the change.
        // We can re-verify or just update XP from the response.
        setUserXp(response.data.userXp)
      }
    } catch (err) {
      console.error("Failed to mark topic as finished:", err)
      // Revert optimistic update if API call fails
      setPlan((prevPlan) => {
        if (!prevPlan) return null
        const revertedTopics = prevPlan.topics.map((topic) =>
          topic._id === topicId
            ? { ...topic, isCompleted: false, xpAwarded: 0, completedAt: undefined } // Revert to original state
            : topic,
        )
        return { ...prevPlan, topics: revertedTopics }
      })

      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message)
      } else {
        setError("Dështoi shënimi i temës si e përfunduar. Ju lutemi provoni përsëri.")
      }
    } finally {
      setSubmittingTopicId(null) // Clear the submitting state regardless of success or failure
    }
  }

  if (!selectedLevel) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-900">
          Zgjidhni Nivelin Tuaj të Mësimit të Gjermanishtes
        </h1>
        <p className="text-lg text-gray-700 mb-4 text-center max-w-2xl">
          Kjo është seksioni i planit të mësimit ku mund të shënoni temat që tashmë i zotëroni.
        </p>
        <p className="text-base text-gray-900 mb-8 text-center max-w-2xl font-medium">
          Nëse nuk e njihni një temë, ju lutemi shkoni dhe mësojeni atë fillimisht. Pasi ta keni mësuar dhe zotëruar,
          kthehuni këtu dhe shënojeni si "Përfunduar" për të ndjekur progresin tuaj!
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-6 w-full max-w-6xl">
          {levels.map((level) => (
            <div
              key={level}
              onClick={() => handleLevelSelect(level)}
              className="rounded-lg border bg-white text-gray-900 shadow-sm p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200 flex flex-col items-center justify-center text-center"
            >
              <div className="pb-2">
                <h3 className="text-4xl font-extrabold text-blue-600">{level}</h3>
              </div>
              <div className="pt-2">
                <p className="text-sm text-gray-700">
                  {level === "A1" && "Nivel fillestar për bazat e gjermanishtes."}
                  {level === "A2" && "Nivel paramesatar, zgjeroni fjalorin dhe gramatikën."}
                  {level === "B1" && "Nivel mesatar, komunikim i pavarur në situata të përditshme."}
                  {level === "B2" && "Nivel i lartë mesatar, kuptim dhe shprehje më komplekse."}
                  {level === "C1" && "Nivel i avancuar, përdorim i rrjedhshëm dhe i saktë i gjuhës."}
                  {level === "C2" && "Nivel i zotërimit, aftësi gati amtare në gjermanisht."}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-900">Po ngarkohet plani i mësimit të gjermanishtes për nivelin {selectedLevel}...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-red-500 p-4">
        <p>{error}</p>
        <button
          onClick={() => setSelectedLevel(null)}
          className="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors duration-200"
        >
          Kthehu te Zgjedhja e Nivelit
        </button>
      </div>
    )
  }

  if (!plan || !plan.topics || plan.topics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <p className="text-gray-900">Nuk u gjet asnjë plan mësimi i gjermanishtes për nivelin {selectedLevel}.</p>
        <button
          onClick={() => setSelectedLevel(null)}
          className="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors duration-200"
        >
          Kthehu te Zgjedhja e Nivelit
        </button>
      </div>
    )
  }

  const completedTopicsCount = plan.topics.filter((topic) => topic.isCompleted).length
  const totalTopicsCount = plan.topics.length
  const progressPercentage = totalTopicsCount > 0 ? (completedTopicsCount / totalTopicsCount) * 100 : 0

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900">Plani i Mësimit të Gjermanishtes {plan.level}</h1>
          <p className="text-gray-700">
            Ndiqni progresin tuaj përmes temave thelbësore për Gjermanishten {plan.level}.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedLevel(null)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Ndrysho Nivelin: {plan.level}
          </button>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2 text-gray-900">Progresi i Përgjithshëm</h2>
        <div className="flex items-center gap-4">
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-primary/20">
            <div
              role="progressbar"
              aria-valuenow={progressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              style={{ transform: `translateX(-${100 - progressPercentage}%)` }}
              className="h-full w-full flex-1 bg-primary transition-all"
            />
          </div>
          <span className="text-sm font-medium text-gray-900">{`${Math.round(progressPercentage)}%`}</span>
        </div>
        <p className="text-sm text-gray-700 mt-1">
          {completedTopicsCount} nga {totalTopicsCount} tema të përfunduara.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plan.topics.map((topic) => (
          <div
            key={topic._id}
            className={`rounded-lg border bg-card text-card-foreground shadow-sm p-6 ${
              topic.isCompleted ? "border-green-500 shadow-md" : ""
            }`}
          >
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-lg font-medium text-gray-900">{topic.title}</h3>
              {topic.isCompleted && <CheckCircle2 className="h-6 w-6 text-green-500" aria-label="Përfunduar" />}
            </div>
            <div className="p-0 space-y-4">
              <p className="text-sm text-gray-700">{topic.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`topic-${topic._id}`}
                    checked={topic.isCompleted}
                    disabled
                    className="h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  />
                  <label
                    htmlFor={`topic-${topic._id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-900"
                  >
                    Përfunduar
                  </label>
                </div>
                {!topic.isCompleted && (
                  <button
                    onClick={() => handleMarkAsFinished(topic._id)}
                    disabled={topic.isCompleted || submittingTopicId === topic._id}
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-9 px-3
                      ${
                        topic.isCompleted || submittingTopicId === topic._id
                          ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                          : "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                      }`}
                  >
                    {submittingTopicId === topic._id ? "Po shënohet..." : "Shëno si Përfunduar"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
