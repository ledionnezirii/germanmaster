"use client"

import { useEffect, useState } from "react"
import { paymentService, subscriptionService, authService } from "../services/api"
import { useAuth } from "../context/AuthContext"
import {
  CheckCircle,
  AlertTriangle,
  X,
  Loader2,
  Shield,
  Zap,
  BookOpen,
  Star,
  HeadphonesIcon,
  Ban,
  RefreshCw,
  Clock,
  Calendar,
  CreditCard,
  Instagram,
  ArrowRight,
  Sparkles,
  Info
} from "lucide-react"

const Payment = () => {
  const { updateUser } = useAuth()
  const [paddleInitialized, setPaddleInitialized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState(null)
  const [error, setError] = useState(null)
  const [processingPlan, setProcessingPlan] = useState(null)
  const [processingPayment, setProcessingPayment] = useState(false)

  const PADDLE_CLIENT_TOKEN = import.meta.env.VITE_PADDLE_CLIENT_TOKEN

  const PRICES = {
    monthly: import.meta.env.VITE_PADDLE_PRICE_MONTHLY,
    quarterly: import.meta.env.VITE_PADDLE_PRICE_QUARTERLY,
    yearly: import.meta.env.VITE_PADDLE_PRICE_YEARLY,
  }

  const PLANS = [
    {
      id: "monthly",
      name: "Mujor",
      price: "€9.99",
      period: "per muaj",
      description: "Me i popullarizuari",
      priceId: PRICES.monthly,
      popular: true,
    },
    {
      id: "quarterly",
      name: "3-Mujor",
      price: "€19.99",
      period: "per 3 muaj",
      originalPrice: "€30.00",
      savings: "Kurse 16%",
      description: "Vlera me e mire",
      priceId: PRICES.quarterly,
      popular: false,
    },
    {
      id: "yearly",
      name: "Vjetor",
      price: "€69.99",
      period: "per vit",
      originalPrice: "€100",
      savings: "Kurse 31%",
      description: "Kursimi maksimal",
      priceId: PRICES.yearly,
      popular: false,
    },
  ]

  const pollPaymentStatus = async (maxAttempts = 15, interval = 2000) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await authService.getProfile()
        const userData = response.data?.user || response.data

        if (userData && userData.isPaid && userData.isActive) {
          updateUser({
            subscription: userData.subscription,
            isPaid: true,
            isActive: true,
            subscriptionType: userData.subscriptionType,
            subscriptionExpiresAt: userData.subscriptionExpiresAt,
            subscriptionCancelled: false,
          })

          setUser(userData)

          const status = await subscriptionService.checkStatus()
          setSubscriptionStatus(status)

          localStorage.removeItem("subscription_expired")

          return true
        }

        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, interval))
        }
      } catch (err) {
        console.error(`Polling attempt ${attempt} failed:`, err)
      }
    }

    return false
  }

  useEffect(() => {
    const initPaddle = () => {
      if (!PADDLE_CLIENT_TOKEN) {
        setError("Token i Paddle (VITE_PADDLE_CLIENT_TOKEN) mungon ne skedarin .env.")
        return
      }

      if (!window.Paddle) {
        setError("Paddle nuk u ngarkua")
        return
      }

      try {
        window.Paddle.Initialize({
          token: PADDLE_CLIENT_TOKEN,
          eventCallback: async (data) => {
            if (data.type === "checkout.completed") {
              setProcessingPayment(true)

              await new Promise((resolve) => setTimeout(resolve, 2000))

              const confirmed = await pollPaymentStatus()

              setProcessingPayment(false)

              if (confirmed) {
                alert(
                  "Pagesa u krye me sukses! Qasja juaj eshte aktive TANI!\n\nUI-ja eshte perditesuar - keni qasje te plote ne te gjitha vecorite Premium."
                )
              } else {
                alert(
                  "Pagesa u krye me sukses!\n\nPo rifreskojme faqen per te perditesuar te dhenat tuaja..."
                )
                setTimeout(() => window.location.reload(), 1500)
              }
            }

            if (data.type === "checkout.error") {
              setProcessingPayment(false)
              setError(
                "Pagesa deshtoi. Ju lutem provoni perseri. NUK eshte terhequr asnje pagese nga llogaria juaj."
              )
            }
          },
        })

        window.Paddle.Environment.set("production")
        setPaddleInitialized(true)
      } catch (err) {
        setError("Paddle initialization failed: " + err.message)
      }
    }

    if (window.Paddle) {
      initPaddle()
    } else {
      const check = setInterval(() => {
        if (window.Paddle) {
          clearInterval(check)
          initPaddle()
        }
      }, 100)

      setTimeout(() => {
        clearInterval(check)
        if (!window.Paddle) {
          setError("Sistemi i pagesave deshtoi te ngarkohet")
        }
      }, 10000)
    }
  }, [PADDLE_CLIENT_TOKEN, updateUser])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("authToken")

        if (!token) {
          window.location.href = "/signin"
          return
        }

        const userStr = localStorage.getItem("user")

        if (userStr) {
          const userData = JSON.parse(userStr)
          setUser(userData)

          const status = await subscriptionService.checkStatus()
          setSubscriptionStatus(status)
        }
      } catch (err) {
        setError("Deshtoi ngarkimi i te dhenave")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    localStorage.removeItem("subscription_expired")
  }, [])

  const openCheckout = async (priceId, planId) => {
    if (!paddleInitialized) {
      return alert("Sistemi i pagesave nuk eshte gati. Ju lutem prisni...")
    }

    if (!user) {
      return (window.location.href = "/signin")
    }

    if (!priceId) {
      return setError("ID e cmimit mungon.")
    }

    if (!user.email || !user.id) {
      return setError("Te dhenat e perdoruesit jane te pakompletuara. Ju lutem rifreskoni faqen.")
    }

    setProcessingPlan(planId)

    try {
      const checkResponse = await paymentService.createCheckoutSession(user.id, priceId)

      if (!checkResponse.success && checkResponse.code === "ALREADY_SUBSCRIBED") {
        const data = checkResponse.data
        alert(
          `Ju tashme keni qasje aktive (${data.subscriptionType})!\n\n` +
            `Perfundon me: ${new Date(data.expiresAt).toLocaleDateString("sq-AL")}\n` +
            `Dite te mbetura: ${data.daysRemaining}\n\n` +
            `Ju keni qasje te plote ne te gjitha vecorite Premium.`
        )
        setProcessingPlan(null)
        return
      }
    } catch (err) {
      if (err.response?.status === 409) {
        const data = err.response.data.data
        alert(
          `Ju tashme keni qasje aktive!\n\n` +
            `Perfundon me: ${new Date(data.expiresAt).toLocaleDateString("sq-AL")}\n` +
            `Dite te mbetura: ${data.daysRemaining}\n\n` +
            `Ju keni qasje te plote ne te gjitha vecorite Premium.`
        )
        setProcessingPlan(null)
        return
      }
    }

    try {
      window.Paddle.Checkout.open({
        settings: {
          displayMode: "overlay",
          theme: "light",
          locale: "en",
        },
        items: [
          {
            priceId: priceId,
            quantity: 1,
          },
        ],
        customer: {
          email: user.email,
        },
        customData: {
          userId: user.id,
        },
      })

      setProcessingPlan(null)
    } catch (err) {
      setError(
        "Deshtoi hapja e checkout: " +
          err.message +
          ". NUK eshte terhequr asnje pagese. Ju lutem provoni perseri."
      )
      setProcessingPlan(null)
    }
  }

  if (loading)
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: "linear-gradient(135deg, #0f1a0f 0%, #1a1200 100%)", fontFamily: "Inter, system-ui, sans-serif" }}
      >
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    )

  const subscriptionActive =
    subscriptionStatus?.active && subscriptionStatus?.type !== "free_trial"
  const isFreeTrial =
    subscriptionStatus?.type === "free_trial" && subscriptionStatus?.active
  const isExpired = !subscriptionStatus?.active
  const shouldShowBuyButton = isExpired || isFreeTrial

  return (
    <div
      className="min-h-screen rounded-4xl"
      style={{ background: "linear-gradient(135deg, #0d1a0d 0%, #1c1400 50%, #0d1a0d 100%)", fontFamily: "Inter, system-ui, sans-serif" }}
    >
      {/* Payment Processing Overlay */}
      {processingPayment && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div
            className="p-10 max-w-md mx-4 text-center shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #0f2010, #1c1600)",
              borderRadius: "3rem",
            }}
          >
            <Loader2 className="w-14 h-14 text-green-400 animate-spin mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Duke procesuar pagesen...
            </h3>
            <p className="text-gray-400 text-sm mb-5">
              Ju lutem prisni derisa te konfirmohet pagesa dhe t'ju aktivizohet qasja.
            </p>
            <div className="bg-orange-500/10 rounded-3xl px-4 py-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-400 flex-shrink-0" />
              <p className="text-xs text-orange-300">
                Mos e mbyllni kete faqe derisa te perfundoje procesi...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div 
      className="rounded-4xl"
      style={{ background: "rgba(0,0,0,0.4)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-orange-500 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Abonimi & Faturat
            </h1>
          </div>
          <p className="text-gray-400 text-sm sm:text-base" style={{ marginLeft: "52px" }}>
            Menaxho planin tend te abonimit dhe shiko detajet e pagesave
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Error */}
        {error && (
          <div className="bg-red-900/20 rounded-3xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm flex-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Active Subscription */}
        {subscriptionActive && (
          <div className="bg-green-900/20 rounded-3xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-base font-semibold text-green-300 mb-1">
                  Qasja Aktive - Akses i Plote
                </h3>
                <p className="text-green-400/80 text-sm mb-3">
                  Qasja jote <span className="font-semibold text-green-300">Premium</span> eshte aktive.
                </p>
                {subscriptionStatus.expiresAt && (
                  <div className="inline-flex items-center gap-1.5 bg-green-500/10 rounded-full px-3 py-1.5">
                    <Calendar className="w-3.5 h-3.5 text-green-400" />
                    <p className="text-xs text-green-300">
                      Perfundon me:{" "}
                      <span className="font-semibold">
                        {new Date(subscriptionStatus.expiresAt).toLocaleDateString("sq-AL")}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Free Trial */}
        {isFreeTrial && (
          <div className="bg-orange-900/20 rounded-3xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-base font-semibold text-orange-300 mb-1">
                  Periudha Falas Aktive
                </h3>
                <p className="text-orange-400/80 text-sm">
                  Te kane mbetur{" "}
                  <span className="font-bold text-orange-300 text-lg">
                    {subscriptionStatus.daysRemaining}
                  </span>{" "}
                  dite ne periudhen tende falas.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Plans */}
        {shouldShowBuyButton && (
          <div className="mb-10">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
                Zgjidh Planin Tend
              </h2>
              <p className="text-gray-400 text-sm">
                Shiko cmimet me poshte dhe kryeni pagesen online
              </p>
            </div>

<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 text-left ${
                    plan.popular
                      ? "shadow-2xl shadow-orange-500/20"
                      : "shadow-lg hover:shadow-xl"
                  }`}
                  style={{
                    borderRadius: "2rem",
                    background: plan.popular
                      ? "linear-gradient(160deg, rgba(34,60,34,0.95) 0%, rgba(45,30,10,0.95) 100%)"
                      : "transparent",
                    border: plan.popular 
                      ? "1px solid rgba(74,222,128,0.2)"
                      : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
{plan.popular && (
                    <div
                      className="text-white text-xs font-semibold px-4 py-2 text-center tracking-wide uppercase"
                      style={{ 
                        background: "linear-gradient(90deg, #16a34a, #ea580c)",
                        borderRadius: "2rem 2rem 0 0"
                      }}
                    >
                      Me i popullarizuari
                    </div>
                  )}
                  {plan.savings && !plan.popular && (
                    <div 
                      className="absolute top-5 right-5 text-green-300 text-xs font-medium px-3 py-1.5"
                      style={{
                        background: "rgba(74,222,128,0.15)",
                        borderRadius: "1rem",
                      }}
                    >
                      {plan.savings}
                    </div>
                  )}

                  <div className="p-7">
                    <h3 className="text-lg font-bold text-white mb-0.5">
                      {plan.name}
                    </h3>
                    <p className="text-sm text-gray-400 mb-5">
                      {plan.description}
                    </p>

                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        {plan.originalPrice && (
                          <span className="text-gray-600 line-through text-base mr-1">
                            {plan.originalPrice}
                          </span>
                        )}
                        <span
                          className="text-3xl font-bold tracking-tight"
                          style={{ color: plan.popular ? "#fb923c" : "#4ade80" }}
                        >
                          {plan.price}
                        </span>
                      </div>
                      <span className="text-gray-500 text-sm">
                        {plan.period}
                      </span>
                    </div>

<button
                      onClick={() => openCheckout(plan.priceId, plan.id)}
                      disabled={processingPlan === plan.id || processingPayment}
                      className="w-full py-3.5 px-4 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 hover:opacity-90"
                      style={{
                        borderRadius: "1.25rem",
                        background: plan.popular
                          ? "linear-gradient(90deg, #16a34a, #ea580c)"
                          : "transparent",
                        border: plan.popular ? "none" : "1px solid rgba(74,222,128,0.3)",
                        color: plan.popular ? "#fff" : "#4ade80",
                      }}
                    >
                      {processingPlan === plan.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Duke procesuar...
                        </>
                      ) : (
                        <>
                          Bli Tani
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Benefits */}
            <div
              className="p-6 sm:p-8 mt-8"
              style={{
                borderRadius: "3rem",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <h4 className="font-bold text-white mb-5 text-base flex items-center gap-2">
                <Star className="w-4 h-4 text-orange-400" />
                Perfitimet e Premium
              </h4>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { icon: Zap, text: "Qasje e menjehereshme pas pageses" },
                  { icon: BookOpen, text: "Shperblime te ndryshme" },
                  { icon: Sparkles, text: "Permbajtje ekskluzive premium" },
                  { icon: HeadphonesIcon, text: "Mbeshtetje prioritare" },
                  { icon: Ban, text: "Pa reklama" },
                  { icon: RefreshCw, text: "Riblej kur te skadoje" },
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3 py-1.5">
                    <div
                      className="w-7 h-7 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(74,222,128,0.1)" }}
                    >
                      <benefit.icon className="w-3.5 h-3.5 text-green-400" />
                    </div>
                    <span className="text-sm text-gray-300">{benefit.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Alternative Payment Warning */}
            <div
              className="p-6 sm:p-8 mt-6"
              style={{
                borderRadius: "3rem",
                background: "rgba(249,115,22,0.06)",
              }}
            >
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-bold text-orange-300 mb-2 text-base">
                    Nuk mund te kryeni pagesen online?
                  </h4>
                  <p className="text-orange-400/70 text-sm leading-relaxed mb-4">
                    Nese nuk keni mundesi te kryeni pagesen permes sistemit online, mund ta beni pagesen permes metodave alternative:
                  </p>
                  <div className="grid sm:grid-cols-3 gap-3 mb-4">
                    {["Western Union", "Ria", "Transfer Bankar"].map((method) => (
                      <div
                        key={method}
                        className="px-4 py-3 text-center"
                        style={{
                          borderRadius: "2rem",
                          background: "rgba(249,115,22,0.08)",
                        }}
                      >
                        <p className="font-semibold text-orange-200 text-sm">{method}</p>
                      </div>
                    ))}
                  </div>
                  <div
                    className="flex items-center gap-2 px-4 py-3"
                    style={{
                      borderRadius: "2rem",
                      background: "rgba(249,115,22,0.08)",
                    }}
                  >
                    <Instagram className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <p className="text-sm text-orange-300">
                      Per me shume informata na kontaktoni ne Instagram:{" "}
                      <a
                        href="https://www.instagram.com/gjuhagjermanee/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-orange-200 underline underline-offset-2 hover:text-white transition-colors"
                      >
                        @gjuhagjermanee
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mt-6">
              <Shield className="w-4 h-4 text-green-600" />
              <p className="text-xs text-gray-500">
                Pagese e sigurt me Paddle.{" "}
                <span className="font-medium text-gray-400">
                  Qasja aktivizohet menjehere pas pageses.
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Payment
