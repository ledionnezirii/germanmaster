"use client"

import { useEffect, useState } from "react"
import { paymentService, subscriptionService, authService } from "../services/api"
import { useAuth } from "../context/AuthContext"

const Payment = () => {
  const { updateUser } = useAuth()
  const [paddleInitialized, setPaddleInitialized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState(null)
  const [error, setError] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState("monthly")

  const PADDLE_CLIENT_TOKEN = import.meta.env.VITE_PADDLE_CLIENT_TOKEN_TEST
  
  // All 4 price IDs
  const PRICES = {
    daily: import.meta.env.VITE_PADDLE_PRICE_DAILY_TEST,
    monthly: import.meta.env.VITE_PADDLE_PRICE_MONTHLY_TEST,
    quarterly: import.meta.env.VITE_PADDLE_PRICE_QUARTERLY_TEST,
    yearly: import.meta.env.VITE_PADDLE_PRICE_YEARLY_TEST,
  }

  const PLANS = [
    {
      id: "daily",
      name: "Ditor",
      price: "€1.00",
      period: "për ditë",
      description: "Ideal për të provuar",
      priceId: PRICES.daily,
      popular: false,
    },
    {
      id: "monthly",
      name: "Mujor",
      price: "€12.00",
      period: "për muaj",
      description: "Më i popullarizuari",
      priceId: PRICES.monthly,
      popular: true,
    },
    {
      id: "quarterly",
      name: "3-Mujor",
      price: "€25.00",
      period: "për 3 muaj",
      originalPrice: "€36.00",
      savings: "Kurse 30%",
      description: "Vlera më e mirë",
      priceId: PRICES.quarterly,
      popular: false,
    },
    {
      id: "yearly",
      name: "Vjetor",
      price: "€100.00",
      period: "për vit",
      originalPrice: "€144.00",
      savings: "Kurse 31%",
      description: "Kursimi maksimal",
      priceId: PRICES.yearly,
      popular: false,
    },
  ]

  // Initialize Paddle
  useEffect(() => {
    console.log("🔍 Paddle Token:", PADDLE_CLIENT_TOKEN ? "EXISTS" : "MISSING")

    const initPaddle = () => {
      if (!PADDLE_CLIENT_TOKEN) {
        console.error("❌ PADDLE_CLIENT_TOKEN is missing")
        setError("Token i Paddle (VITE_PADDLE_CLIENT_TOKEN_TEST) mungon në skedarin .env.")
        return
      }

      if (!window.Paddle) {
        console.error("❌ window.Paddle is missing")
        setError("Paddle nuk u ngarkua")
        return
      }

      console.log("✅ Initializing Paddle with token:", PADDLE_CLIENT_TOKEN)

      try {
        window.Paddle.Initialize({
          token: PADDLE_CLIENT_TOKEN,
          eventCallback: (data) => {
            console.log("📢 Paddle event:", data)
            if (data.type === "checkout.completed") {
              console.log("✅ Payment completed! Refreshing user data...")
              
              // Wait a moment for webhook to process
              setTimeout(async () => {
                try {
                  const response = await authService.getProfile()
                  const userData = response.data?.user
                  
                  if (userData) {
                    // Update user in AuthContext (this updates both state and localStorage)
                    updateUser({
                      subscription: userData.subscription,
                      isPaid: true,
                      subscriptionType: userData.subscriptionType,
                      subscriptionExpiresAt: userData.subscriptionExpiresAt,
                    })
                    
                    alert("✅ Pagesa u krye me sukses! Abonimi juaj është aktiv MENJËHERË!")
                    localStorage.removeItem("subscription_expired")
                    
                    // Refresh subscription status
                    const status = await subscriptionService.checkStatus()
                    setSubscriptionStatus(status)
                  }
                } catch (err) {
                  console.error("Failed to refresh user data:", err)
                  alert("✅ Pagesa u krye me sukses! Ju lutem rifreskoni faqen për të parë ndryshimet.")
                  setTimeout(() => window.location.reload(), 2000)
                }
              }, 2000)
            }
            if (data.type === "checkout.error") {
              console.error("❌ Payment error:", data)
              setError(
                "❌ Pagesa dështoi. Ju lutem provoni përsëri. NUK është tërhequr asnjë pagesë nga llogaria juaj.",
              )
            }
          },
        })

        window.Paddle.Environment.set("sandbox")

        console.log("✅ Paddle initialized successfully!")
        setPaddleInitialized(true)
      } catch (err) {
        console.error("❌ Paddle initialization error:", err)
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
          console.error("❌ Paddle failed to load after 10 seconds")
          setError("Sistemi i pagesave dështoi të ngarkohet")
        }
      }, 10000)
    }
  }, [PADDLE_CLIENT_TOKEN, updateUser])

  // Fetch user and subscription data
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
          console.log("🔍 Subscription status:", status)
          setSubscriptionStatus(status)
        }
      } catch (err) {
        console.error("❌ Error fetching data:", err)
        setError("Dështoi ngarkimi i të dhënave")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    localStorage.removeItem("subscription_expired")
  }, [])

  const openCheckout = async (priceId) => {
    console.log("\n==================== OPENING CHECKOUT ====================")
    console.log("Selected price ID:", priceId)

    if (!paddleInitialized) {
      return alert("Sistemi i pagesave nuk është gati. Ju lutem prisni...")
    }

    if (!user) {
      return (window.location.href = "/signin")
    }

    if (!priceId) {
      return setError("ID e çmimit mungon.")
    }

    if (!user.email || !user.id) {
      return setError("Të dhënat e përdoruesit janë të pakompletuara. Ju lutem rifreskoni faqen.")
    }

    try {
      console.log("🔍 Checking for existing active subscription before checkout...")
      const checkResponse = await paymentService.createCheckoutSession(user.id, priceId)

      if (!checkResponse.success && checkResponse.code === "ALREADY_SUBSCRIBED") {
        console.log("⚠️ User already has active subscription")
        const data = checkResponse.data
        alert(
          `✅ Ju tashmë keni një abonim aktiv (${data.subscriptionType})!\n\n` +
            `📅 Përfundon më: ${new Date(data.expiresAt).toLocaleDateString("sq-AL")}\n` +
            `⏰ Ditë të mbetura: ${data.daysRemaining}\n\n` +
            `Ju keni qasje të plotë në të gjitha veçoritë Premium.`,
        )
        return
      }
    } catch (err) {
      if (err.response?.status === 409) {
        const data = err.response.data.data
        alert(
          `✅ Ju tashmë keni një abonim aktiv!\n\n` +
            `📅 Përfundon më: ${new Date(data.expiresAt).toLocaleDateString("sq-AL")}\n` +
            `⏰ Ditë të mbetura: ${data.daysRemaining}\n\n` +
            `Ju keni qasje të plotë në të gjitha veçoritë Premium.`,
        )
        return
      }
      console.error("❌ Error checking subscription:", err)
    }

    const checkoutConfig = {
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
    }

    try {
      console.log("🚀 Opening Paddle checkout...")
      window.Paddle.Checkout.open(checkoutConfig)
    } catch (err) {
      console.error("❌ Checkout failed:", err)
      setError("❌ Dështoi hapja e checkout. NUK është tërhequr asnjë pagesë. Ju lutem provoni përsëri.")
    }
  }

  const handleCancelSubscription = async () => {
    if (
      !window.confirm(
        "Jeni të sigurt që dëshironi të anuloni abonimin tuaj? Do të vazhdoni të keni qasje të plotë deri në fund të periudhës së faturimit.",
      )
    )
      return

    try {
      const response = await paymentService.cancelSubscription(user.id)
      console.log("✅ Cancellation response:", response)
      
      // Refresh user data to get updated subscription status
      const profileResponse = await authService.getProfile()
      const userData = profileResponse.data?.user
      
      if (userData) {
        // Update user in AuthContext
        updateUser({
          subscription: userData.subscription,
          subscriptionCancelled: true,
        })
        
        // Refresh subscription status
        const status = await subscriptionService.checkStatus()
        setSubscriptionStatus(status)
      }
      
      alert(
        response.message ||
          "Abonimi u anulua me sukses. Do të keni qasje të plotë deri në fund të periudhës së faturimit.",
      )
    } catch (err) {
      console.error("Gabim në anulimin e abonimit:", err)
      setError("Dështoi anulimi i abonimit. Ju lutem kontaktoni mbështetjen.")
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-50" style={{ fontFamily: 'Inter, sans-serif' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent mb-4"></div>
          <p className="text-gray-700 font-medium">Duke ngarkuar detajet e abonimit...</p>
        </div>
      </div>
    )

  const subscriptionActive = subscriptionStatus?.active && subscriptionStatus?.type !== "free_trial"
  const isFreeTrial = subscriptionStatus?.type === "free_trial" && subscriptionStatus?.active
  const isCancelled = subscriptionStatus?.cancelled && subscriptionStatus?.daysRemaining > 0
  const isExpired = !subscriptionStatus?.active

  const shouldShowBuyButton = isExpired || isFreeTrial
  const shouldShowCancelButton = subscriptionActive && !isCancelled

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white py-8 px-4 shadow-lg rounded-3xl">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>Abonimi & Faturat</h1>
          <p className="text-red-100">Menaxho planin tënd të abonimit dhe shiko detajet e pagesave</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-8 px-4">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-600 rounded-lg p-4 mb-6 shadow-md">
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <p className="text-red-900 font-medium">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 font-bold hover:text-red-800 text-xl leading-none"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Status Banners */}
        {isCancelled && (
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-5 shadow-lg text-white mb-6">
            <div className="flex items-start gap-3">
              <div className="bg-white/20 rounded-full p-2">
                <span className="text-2xl">⏰</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Abonimi i Anuluar</h3>
                <p className="text-orange-100 text-sm mb-2">
                  Abonimi yt është anuluar, por ke akoma{" "}
                  <span className="font-bold text-white text-lg">{subscriptionStatus.daysRemaining}</span> ditë qasje
                  të mbetur. <strong>Nuk do të faturohesh përsëri.</strong>
                </p>
                {subscriptionStatus.expiresAt && (
                  <div className="bg-white/10 rounded-lg px-3 py-1.5 inline-block">
                    <p className="text-xs">
                      📅 Qasja përfundon më:{" "}
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

        {subscriptionActive && !isCancelled && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-5 shadow-lg text-white mb-6">
            <div className="flex items-start gap-3">
              <div className="bg-white/20 rounded-full p-2">
                <span className="text-2xl">✅</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>✅ Abonimi Aktiv - Qasje e Plotë!</h3>
                <p className="text-green-100 text-sm mb-2">
                  Abonimi yt <span className="font-bold text-white">Premium</span> është aktiv.
                </p>
                {subscriptionStatus.expiresAt && (
                  <div className="bg-white/10 rounded-lg px-3 py-1.5 inline-block">
                    <p className="text-xs">
                      📅 Rinovohet më:{" "}
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

        {isFreeTrial && !isCancelled && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-5 shadow-lg text-white mb-6">
            <div className="flex items-start gap-3">
              <div className="bg-white/20 rounded-full p-2">
                <span className="text-2xl">🎉</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Periudha Falas Aktive</h3>
                <p className="text-blue-100 text-sm mb-2">
                  Të kanë mbetur{" "}
                  <span className="font-bold text-white text-lg">{subscriptionStatus.daysRemaining}</span> ditë në
                  periudhën tënde falas.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Plans */}
        {shouldShowBuyButton && (
          <div className="mb-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>Zgjidh Planin Tënd</h2>
              <p className="text-gray-600">Zhblloko të gjitha veçoritë dhe vazhdo udhëtimin tënd</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                    selectedPlan === plan.id
                      ? "ring-4 ring-red-500 shadow-2xl"
                      : "hover:shadow-xl"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      MË I POPULLARIZUARI
                    </div>
                  )}
                  {plan.savings && (
                    <div className="absolute top-0 left-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-br-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {plan.savings}
                    </div>
                  )}

                  <div className={`p-6 ${plan.popular ? "pt-10" : ""}`}>
                    <h3 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>{plan.name}</h3>
                    <p className="text-sm text-gray-500 mb-4">{plan.description}</p>

                    <div className="mb-4">
                      {plan.originalPrice && (
                        <span className="text-gray-400 line-through text-lg mr-2">{plan.originalPrice}</span>
                      )}
                      <span className="text-4xl font-bold text-red-600" style={{ fontFamily: 'Poppins, sans-serif' }}>{plan.price}</span>
                      <span className="text-gray-500 text-sm ml-1 block mt-1">{plan.period}</span>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full border-2 mx-auto ${
                        selectedPlan === plan.id
                          ? "bg-red-500 border-red-500"
                          : "border-gray-300"
                      } flex items-center justify-center`}
                    >
                      {selectedPlan === plan.id && (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Benefits */}
            <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
              <h4 className="font-semibold text-gray-900 mb-4 text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>✅ Përfitimet e Premium:</h4>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>Qasje MENJËHERË pas pagesës</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>Qasje të pakufizuar në të gjitha leksionet</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>Përmbajtje ekskluzive premium</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>Mbështetje prioritare</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>Pa reklama</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>Anulo në çdo kohë</span>
                </div>
              </div>
            </div>

            {/* Subscribe Button */}
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  const plan = PLANS.find((p) => p.id === selectedPlan)
                  if (plan) openCheckout(plan.priceId)
                }}
                disabled={!paddleInitialized}
                className={`px-12 py-4 text-xl font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg ${
                  paddleInitialized
                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800"
                    : "bg-gray-300 text-gray-600 cursor-not-allowed"
                }`}
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                {paddleInitialized
                  ? `💳 Abonohu me Planin ${PLANS.find((p) => p.id === selectedPlan)?.name}`
                  : "Duke ngarkuar sistemin e pagesave..."}
              </button>
              <p className="text-center text-xs text-gray-500 mt-3">
                🔒 Pagesë e sigurt me Paddle. Anulo në çdo kohë.
                <br />⚡ <strong>Nuk paguani nëse transakti dështon.</strong>
              </p>
            </div>
          </div>
        )}

        {/* Cancel Subscription Section */}
        {shouldShowCancelButton && (
          <div className="bg-white rounded-xl shadow-lg p-5 border-2 border-gray-100">
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-red-100 rounded-full p-2">
                <span className="text-xl">⚙️</span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Menaxho Abonimin</h2>
                <p className="text-gray-600 text-sm">
                  Dëshiron të anulosh? Mund ta anulosh abonimin tënd në çdo kohë.{" "}
                  <strong>Do të vazhdosh të kesh qasje të plotë deri në fund të periudhës së faturimit</strong> dhe
                  nuk do të faturohesh përsëri.
                </p>
              </div>
            </div>
            <button
              onClick={handleCancelSubscription}
              className="px-5 py-2.5 text-red-600 font-semibold border-2 border-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Anulo Abonimin
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Payment