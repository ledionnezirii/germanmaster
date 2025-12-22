"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { subscriptionService } from "../services/api"
import { AlertCircle, Crown, Sparkles, Zap } from "lucide-react"

const SubscriptionGate = ({ children }) => {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [subscriptionStatus, setSubscriptionStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated || authLoading) {
      setLoading(false)
      return
    }

    const checkSubscription = async () => {
      try {
        const status = await subscriptionService.checkStatus()
        setSubscriptionStatus(status)
      } catch (error) {
        console.error("Failed to check subscription status:", error)
      } finally {
        setLoading(false)
      }
    }

    checkSubscription()

    // Check every minute
    const interval = setInterval(checkSubscription, 60000)

    return () => clearInterval(interval)
  }, [isAuthenticated, authLoading])

  if (loading && isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-sm text-gray-600">Duke ngarkuar...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return children
  }

  if (subscriptionStatus?.active && subscriptionStatus?.daysRemaining <= 3) {
    return (
      <div>
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 p-3 mb-3 shadow-sm">
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0">
              <AlertCircle className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-semibold text-amber-900 mb-1">Periudha provuese po mbaron</h4>
              <p className="text-xs text-amber-800">
                Periudha juaj falas skadon në <span className="font-bold">{subscriptionStatus.daysRemaining} ditë</span>
                . Abonohuni tani për të vazhduar pa ndërprerje.
              </p>
              <button
                onClick={() => navigate("/payments")}
                className="mt-2 inline-flex items-center gap-1.5 bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-amber-700 transition-colors shadow-sm"
              >
                <Crown className="h-3 w-3" />
                Shiko planet
              </button>
            </div>
          </div>
        </div>
        {children}
      </div>
    )
  }

  if (subscriptionStatus?.expired) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            {/* Icon Header */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-lg opacity-20 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-full">
                  <Crown className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="text-center mb-5">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Periudha juaj falas ka përfunduar</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Faleminderit që provuat platformën tonë! Periudha juaj falas 2-ditore ka mbaruar. Abonohuni tani për të
                vazhduar mësimin e gjermanishtes me qasje të pakufizuar në të gjitha funksionet.
              </p>
            </div>

            {/* Features List */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
              <h3 className="text-xs font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                Çfarë do të fitoni me abonimin:
              </h3>
              <ul className="space-y-2">
                {[
                  "Qasje e pakufizuar në të gjitha mësimet",
                  "Ushtrime të avancuara gramatikore",
                  "Kuize dhe teste interaktive",
                  "Ndjekje e progresit dhe analizë",
                ].map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs text-gray-700">
                    <Zap className="h-3.5 w-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => navigate("/payments")}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 px-4 rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Shiko planet e abonimit
              </button>

              <button
                onClick={() => navigate("/")}
                className="w-full bg-white text-gray-700 py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors border border-gray-200"
              >
                Kthehu në faqen kryesore
              </button>
            </div>

            {/* Footer Note */}
            <p className="text-center text-xs text-gray-500 mt-4">
              Pyetje? Kontaktoni ekipin tonë të mbështetjes për ndihmë.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return children
}

export default SubscriptionGate
