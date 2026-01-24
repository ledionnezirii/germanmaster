"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { subscriptionService } from "../services/api"
import { AlertCircle, Crown, Sparkles, Check, Clock, ArrowRight } from "lucide-react"

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
        // console.log("[SubscriptionGate] Checking subscription status...")
        const status = await subscriptionService.checkStatus()
        // console.log("[SubscriptionGate] Status received:", status)
        setSubscriptionStatus(status)
      } catch (error) {
        // console.error("[SubscriptionGate] Failed to check subscription status:", error)
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
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="mt-4 text-sm font-medium text-slate-600">Duke ngarkuar...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return children
  }

  // Show warning if subscription will expire soon (3 days or less) and NOT cancelled
  if (subscriptionStatus?.active && subscriptionStatus?.daysRemaining <= 3 && !subscriptionStatus?.cancelled) {
    return (
      <div>
        <div className="mx-4 mt-4 mb-4 overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 shadow-sm">
          <div className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-slate-900">Abonimi juaj po mbaron</h4>
              <p className="mt-0.5 text-sm text-slate-600">
                Ju kanë mbetur <span className="font-bold text-amber-600">{subscriptionStatus.daysRemaining} ditë</span> të abonimit tuaj
              </p>
            </div>
            <button
              onClick={() => navigate("/payments")}
              className="flex-shrink-0 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md"
            >
              Abonohu
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        {children}
      </div>
    )
  }

  // Show expired screen if subscription is expired
  if (subscriptionStatus?.expired) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
        {/* Background decoration */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-emerald-100/50 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-teal-100/50 blur-3xl"></div>
        </div>

        <div className="relative max-w-lg w-full">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            {/* Header Section */}
            <div className="relative px-8 pt-10 pb-8 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25 mb-6">
                <Crown className="h-10 w-10 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold text-slate-900 mb-3 text-balance">
                Periudha juaj falas ka përfunduar
              </h2>
              <p className="text-slate-500 leading-relaxed max-w-sm mx-auto">
                Faleminderit që provuat platformën tonë! Abonohuni për të vazhduar mësimin e gjermanishtes.
              </p>
            </div>

            {/* Features Section */}
            <div className="px-8 pb-8">
              <div className="rounded-2xl bg-slate-50 p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-sm font-semibold text-slate-900">Çfarë përfitoni me abonimin</h3>
                </div>
                <ul className="space-y-4">
                  {[
                    "Qasje e pakufizuar në të gjitha mësimet",
                    "Ushtrime të avancuara gramatikore",
                    "Kuize dhe teste interaktive",
                    "Ndjekje e progresit dhe analizë",
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                        <Check className="h-3.5 w-3.5 text-emerald-600" strokeWidth={3} />
                      </div>
                      <span className="text-sm text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* CTA Section */}
            <div className="px-8 pb-8 space-y-3">
              <button
                onClick={() => navigate("/payments")}
                className="group w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 px-6 rounded-2xl text-base font-semibold shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0"
              >
                Shiko planet e abonimit
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </button>

              <button
                onClick={() => navigate("/")}
                className="w-full py-3.5 px-6 rounded-2xl text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                Kthehu në faqen kryesore
              </button>
            </div>

            {/* Footer */}
            <div className="px-8 pb-6">
              <p className="text-center text-xs text-slate-400">
                Keni pyetje? Na kontaktoni në çdo kohë për ndihmë.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return children
}

export default SubscriptionGate
