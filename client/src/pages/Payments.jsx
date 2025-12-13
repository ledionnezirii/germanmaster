import React, { useEffect, useState } from "react"

const API_BASE_URL = "/api"

const subscriptionService = {
  checkStatus: async () => {
    console.log("[Subscription] Checking subscription status...")
    const userStr = localStorage.getItem("user")
    console.log("[Subscription] User from localStorage:", userStr)

    if (!userStr) {
      console.log("[Subscription] No user found in localStorage")
      return { active: false, expired: true, daysRemaining: 0 }
    }

    try {
      const user = JSON.parse(userStr)
      console.log("[Subscription] Parsed user:", user)

      if (!user.subscription) {
        console.log("[Subscription] No subscription object found")
        return { active: false, expired: true, daysRemaining: 0 }
      }

      const now = new Date()
      const expiresAt = new Date(user.subscription.expiresAt)

      console.log("[Subscription] Now:", now)
      console.log("[Subscription] Expires at:", expiresAt)
      console.log("[Subscription] Time difference (ms):", expiresAt - now)

      const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24))
      const isExpired = expiresAt <= now
      const isActive = user.subscription.active && !isExpired

      console.log("[Subscription] Days remaining:", daysRemaining)
      console.log("[Subscription] Is expired:", isExpired)
      console.log("[Subscription] Is active:", isActive)

      return {
        active: isActive,
        expired: isExpired,
        daysRemaining: Math.max(0, daysRemaining),
        type: user.subscription.type,
        expiresAt: user.subscription.expiresAt,
        trialStartedAt: user.subscription.trialStartedAt,
      }
    } catch (error) {
      console.error("[Subscription] Error parsing user data:", error)
      return { active: false, expired: true, daysRemaining: 0 }
    }
  },
}

const paymentService = {
  cancelSubscription: async (userId) => {
    const token = localStorage.getItem("authToken")
    const response = await fetch(`${API_BASE_URL}/payments/subscription/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId }),
    })
    if (!response.ok) throw new Error("Failed to cancel subscription")
    return response.json()
  },
}

const PRICE_IDS = {
  livetest: "pri_01kaeqvvk2kdc02p39zrb8gne3",
  monthly: "pri_01kcc0xq5n2zkh5926cfcnyakr",
  quarterly: "pri_01kcc0z1n998kjm07xxn5kph81",
  yearly: "pri_01kcc103vzc3xm5th0w3e3wrfx"
}

const PADDLE_CLIENT_TOKEN = "live_e7e364df3364c92dfaae35d7163"

export default function Payment() {
  const [paddleInitialized, setPaddleInitialized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState(null)
  const [error, setError] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState("livetest")

  const plans = [
    { id: "livetest", name: "LiveTest", price: "€1.00", period: "test", description: "Test Plan", test: true, priceId: PRICE_IDS.livetest },
    { id: "monthly", name: "1 Muaj", price: "€4.99", period: "muaj", description: "Pagesë mujore", priceId: PRICE_IDS.monthly },
    { id: "quarterly", name: "3 Muaj", price: "€11.99", period: "3 muaj", description: "Kurse €2.98", savings: "20%", priceId: PRICE_IDS.quarterly },
    { id: "yearly", name: "1 Vit", price: "€39.99", period: "vit", description: "Kurse €19.89", savings: "33%", popular: true, priceId: PRICE_IDS.yearly }
  ]

  useEffect(() => {
    const initPaddle = () => {
      if (window.Paddle) {
        window.Paddle.Initialize({
          token: PADDLE_CLIENT_TOKEN,
          eventCallback: (data) => {
            if (data.type === "checkout.completed") {
              alert("Pagesa u krye me sukses! Faleminderit për abonimin.")
              localStorage.removeItem("subscription_expired")
              // Reload the page after 2 seconds to get fresh data
              setTimeout(() => {
                window.location.reload()
              }, 2000)
            }

            if (data.type === "checkout.closed") {
              console.log("Checkout closed by user")
            }

            if (data.type === "checkout.error") {
              const errorMessage = data.data?.error || "Gabim i panjohur"
              console.error("Checkout Error:", errorMessage)
              setError(`Gabim pagese: ${errorMessage}`)
            }
          },
        })
        setPaddleInitialized(true)
      } else {
        setError("Sistemi i pagesës nuk u ngarkua. Ju lutemi rifreskoni faqen.")
      }
    }

    if (window.Paddle) {
      initPaddle()
    } else {
      const checkPaddle = setInterval(() => {
        if (window.Paddle) {
          clearInterval(checkPaddle)
          initPaddle()
        }
      }, 100)

      setTimeout(() => {
        clearInterval(checkPaddle)
        if (!window.Paddle) {
          setError("Sistemi i pagesës dështoi të ngarkohej. Ju lutemi rifreskoni faqen.")
        }
      }, 10000)
    }
  }, [])

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
          console.log("[Payment] Subscription status:", status)
          setSubscriptionStatus(status)
        }
      } catch (err) {
        setError("Dështoi ngarkimi i të dhënave")
        console.error("Error fetching data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    localStorage.removeItem("subscription_expired")
  }, [])

  const openCheckout = (priceId) => {
    if (!paddleInitialized) {
      alert("Sistemi i pagesës nuk është gati. Ju lutemi prisni...")
      return
    }

    if (!user) {
      alert("Ju lutemi identifikohuni për të vazhduar.")
      window.location.href = "/signin"
      return
    }

    setError(null)

    try {
      window.Paddle.Checkout.open({
        items: [{ priceId: priceId, quantity: 1 }],
        customer: { email: user.email },
        customData: { userId: user.id },
        settings: {
          locale: "en",
          displayMode: "overlay",
          theme: "light",
        },
      })
    } catch (err) {
      console.error("Failed to open checkout:", err)
      setError("Dështoi hapja e pagesës. Ju lutemi provoni përsëri.")
    }
  }

  const handleCancelSubscription = async () => {
    if (!window.confirm("Jeni të sigurt që dëshironi të anuloni abonimin tuaj?")) {
      return
    }

    try {
      await paymentService.cancelSubscription(user.id)
      alert("Abonimi u anulua me sukses")
      window.location.reload()
    } catch (err) {
      console.error("Cancel error:", err)
      setError("Dështoi anulimi i abonimit. Ju lutemi kontaktoni mbështetjen.")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Duke ngarkuar detajet e abonimit...</p>
        </div>
      </div>
    )
  }

  const subscriptionActive = subscriptionStatus?.active || false
  const isFreeTrial = subscriptionStatus?.type === "free_trial"
  const isPaidSubscription = subscriptionActive && !isFreeTrial

  // Show pricing plans if: not active, expired, OR on free trial
  const showPricingPlans = !subscriptionActive || subscriptionStatus?.expired || isFreeTrial

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">Abonimi & Faturimi</h1>
          <p className="text-lg text-slate-600">Menaxhoni abonimin dhe detajet e pagesës tuaj</p>
          
          {/* Refresh Button - Simple page reload */}
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 Rifresko Faqen
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-8 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-red-800">{error}</p>
                <p className="text-sm text-red-600 mt-2">
                  Nëse sapo keni bërë pagesën, prisni 1-2 minuta dhe rifreskoni faqen.
                </p>
              </div>
              <button onClick={() => setError(null)} className="text-red-600 font-bold hover:text-red-800 text-xl ml-4">
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Trial Status Banner */}
        {isFreeTrial && subscriptionActive && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 mb-8 shadow-sm">
            <h3 className="text-blue-900 font-semibold text-lg mb-2">🎁 Prova Falas Aktive</h3>
            <p className="text-blue-700">
              Ju keni <span className="font-bold">{subscriptionStatus.daysRemaining} ditë</span> të mbetura në provën tuaj falas.
              {subscriptionStatus.expiresAt && (
                <span className="block mt-2 text-sm">
                  Prova përfundon më: {new Date(subscriptionStatus.expiresAt).toLocaleDateString('sq-AL')}
                </span>
              )}
            </p>
            <p className="text-blue-600 mt-3 text-sm font-medium">
              Abonohuni tani për të vazhduar aksesin pas përfundimit të provës!
            </p>
          </div>
        )}

        {/* Paid Subscription Banner */}
        {isPaidSubscription && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 mb-8 shadow-sm">
            <h3 className="text-green-900 font-semibold text-lg mb-2">✅ Abonimi Premium Aktiv</h3>
            <p className="text-green-700">
              Ju keni <span className="font-bold">{subscriptionStatus.daysRemaining} ditë</span> të mbetura në abonimin tuaj.
              {subscriptionStatus.expiresAt && (
                <span className="block mt-2 text-sm">
                  Skadon më: {new Date(subscriptionStatus.expiresAt).toLocaleDateString('sq-AL')}
                </span>
              )}
            </p>
          </div>
        )}

        {/* Expired Trial Banner */}
        {subscriptionStatus?.expired && !subscriptionActive && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-6 mb-8 shadow-sm">
            <h3 className="text-red-900 font-semibold text-lg mb-2">⚠️ Prova Falas Ka Skaduar</h3>
            <p className="text-red-700">
              Prova juaj falas ka përfunduar. Abonohuni tani për të vazhduar aksesin në të gjitha veçoritë.
            </p>
          </div>
        )}

        {/* Current Status Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 mb-10 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-4 h-4 rounded-full ${subscriptionActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <h2 className="text-2xl font-bold text-slate-900">
              {isPaidSubscription ? "Abonim Premium Aktiv" : isFreeTrial && subscriptionActive ? "Provë Falas Aktive" : "Asnjë Abonim Aktiv"}
            </h2>
          </div>
          <p className="text-slate-600 mb-6">
            {isPaidSubscription
              ? "Ju keni akses të plotë në të gjitha veçoritë premium"
              : isFreeTrial && subscriptionActive
              ? "Ju jeni duke përdorur provën falas. Abonohuni për akses të vazhdueshëm."
              : "Abonohuni për të aksesuar të gjitha veçoritë premium"}
          </p>

          {subscriptionActive && subscriptionStatus && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Plani</p>
                <p className="font-semibold text-slate-900">
                  {isFreeTrial ? "Provë Falas" : "Premium"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Statusi</p>
                <p className="font-semibold text-green-600">Aktiv</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Skadon më</p>
                <p className="font-semibold text-slate-900">
                  {subscriptionStatus.expiresAt ? new Date(subscriptionStatus.expiresAt).toLocaleDateString('sq-AL') : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Ditë të mbetura</p>
                <p className="font-semibold text-slate-900">{subscriptionStatus.daysRemaining}</p>
              </div>
            </div>
          )}
        </div>

        {/* Pricing Cards - Show for free trial users AND non-subscribers */}
        {showPricingPlans && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">Zgjidhni Planin Tuaj</h2>
            {isFreeTrial && subscriptionActive && (
              <p className="text-center text-slate-600 mb-8">Përmirësoni tani për të siguruar aksesin tuaj pas provës falas</p>
            )}
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative bg-white rounded-2xl p-6 cursor-pointer transition-all duration-300 ${
                    selectedPlan === plan.id
                      ? 'border-2 border-red-600 shadow-lg shadow-red-100 scale-[1.02]'
                      : 'border border-slate-200 hover:border-slate-300 hover:shadow-md'
                  } ${plan.popular ? 'ring-2 ring-red-600 ring-offset-2' : ''} ${plan.test ? 'border-blue-400' : ''}`}
                >
                  {plan.test && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                        🧪 TEST
                      </span>
                    </div>
                  )}
                  
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-red-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                        MË POPULLORË
                      </span>
                    </div>
                  )}
                  
                  {plan.savings && (
                    <div className="absolute top-4 right-4">
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                        -{plan.savings}
                      </span>
                    </div>
                  )}

                  <div className="text-center pt-4">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                    <div className="mb-2">
                      <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                      <span className="text-slate-500">/{plan.period}</span>
                    </div>
                    <p className="text-sm text-slate-500">{plan.description}</p>
                  </div>

                  <div className={`mt-6 w-6 h-6 rounded-full border-2 mx-auto flex items-center justify-center ${
                    selectedPlan === plan.id ? 'border-red-600 bg-red-600' : 'border-slate-300'
                  }`}>
                    {selectedPlan === plan.id && (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Features List */}
            <div className="mt-10 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6 text-center">Çfarë Përfshihet</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  "Akses i pakufizuar në të gjitha mësimet",
                  "Të gjitha temat e gramatikës të zhbllokuara",
                  "Praktikë e shqiptimit",
                  "Ndjekja e progresit & certifikatat",
                  "Akses nga deri në 2 pajisje",
                  "Mbështetje prioritare",
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => openCheckout(plans.find(p => p.id === selectedPlan)?.priceId)}
                disabled={!paddleInitialized}
                className={`w-full mt-8 py-4 px-6 text-lg font-bold rounded-xl transition-all duration-300 ${
                  paddleInitialized
                    ? "bg-red-600 text-white hover:bg-red-700 hover:shadow-lg hover:shadow-red-200 cursor-pointer"
                    : "bg-slate-300 text-slate-500 cursor-not-allowed"
                }`}
              >
                {paddleInitialized ? `💳 Abonohu Tani - ${plans.find(p => p.id === selectedPlan)?.price}` : "Duke ngarkuar sistemin e pagesës..."}
              </button>

              <p className="text-center text-sm text-slate-500 mt-4">
                Pagesë e sigurt përmes Paddle. Anuloni në çdo kohë.
              </p>
            </div>
          </div>
        )}

        {/* Cancel Subscription - Only for paid subscribers */}
        {isPaidSubscription && (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-3">Menaxho Abonimin</h2>
            <p className="text-slate-600 mb-6">
              Keni nevojë të anuloni? Mund të anuloni abonimin tuaj në çdo kohë. Do të vazhdoni të keni akses deri në fund të periudhës së faturimit.
            </p>
            <button
              onClick={handleCancelSubscription}
              className="px-6 py-3 text-red-600 border-2 border-red-600 rounded-xl font-semibold hover:bg-red-600 hover:text-white transition-all duration-300"
            >
              Anulo Abonimin
            </button>
          </div>
        )}
      </div>
    </div>
  )
}