"use client"

import { useEffect, useState } from "react"
import { paymentService, subscriptionService, authService } from "../services/api"

const Payment = () => {
  const [paddleInitialized, setPaddleInitialized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState(null)
  const [error, setError] = useState(null)

  const PADDLE_CLIENT_TOKEN = import.meta.env.VITE_PADDLE_CLIENT_TOKEN_TEST
  const PRICE_MONTHLY = import.meta.env.VITE_PADDLE_PRICE_MONTHLY_TEST

  // Initialize Paddle
  useEffect(() => {
    console.log("🔍 Paddle Token:", PADDLE_CLIENT_TOKEN ? "EXISTS" : "MISSING")
    console.log("🔍 Token value:", PADDLE_CLIENT_TOKEN)
    console.log("🔍 Price ID:", PRICE_MONTHLY ? "EXISTS" : "MISSING")
    console.log("🔍 Price value:", PRICE_MONTHLY)
    console.log("🔍 window.Paddle:", window.Paddle ? "EXISTS" : "MISSING")
    
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
              authService.getProfile()
                .then(response => {
                  const userData = response.data?.user
                  if (userData) {
                    localStorage.setItem("user", JSON.stringify(userData))
                    alert("Pagesa u krye me sukses! Faleminderit për abonimin.")
                    localStorage.removeItem("subscription_expired")
                    setTimeout(() => window.location.reload(), 1500)
                  }
                })
                .catch(err => {
                  console.error("Failed to refresh user data:", err)
                  alert("Pagesa u krye me sukses! Faleminderit për abonimin.")
                  localStorage.removeItem("subscription_expired")
                  setTimeout(() => window.location.reload(), 2000)
                })
            }
          }
        })

        window.Paddle.Environment.set('sandbox')
        
        console.log("✅ Paddle initialized successfully with sandbox environment!")
        setPaddleInitialized(true)
      } catch (err) {
        console.error("❌ Paddle initialization error:", err)
        setError("Paddle initialization failed: " + err.message)
      }
    }

    if (window.Paddle) {
      console.log("✅ Paddle already loaded, initializing...")
      initPaddle()
    } else {
      console.log("⏳ Waiting for Paddle to load...")
      const check = setInterval(() => {
        if (window.Paddle) {
          console.log("✅ Paddle loaded after waiting, initializing...")
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
  }, [PADDLE_CLIENT_TOKEN])

  // Fetch user and subscription data
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("💾 Fetching user data from localStorage...")
        const token = localStorage.getItem("authToken")
        console.log("💾 Auth token exists:", !!token)
        
        if (!token) {
          console.log("❌ No auth token found, redirecting to signin")
          window.location.href = "/signin"
          return
        }

        const userStr = localStorage.getItem("user")
        console.log("💾 User string from localStorage:", userStr)
        
        if (userStr) {
          const userData = JSON.parse(userStr)
          console.log("💾 Parsed user data:", JSON.stringify(userData, null, 2))
          console.log("💾 User ID:", userData.id)
          console.log("💾 User email:", userData.email)
          console.log("💾 User subscription:", JSON.stringify(userData.subscription, null, 2))
          
          setUser(userData)

          console.log("🔍 Checking subscription status...")
          const status = await subscriptionService.checkStatus()
          console.log("🔍 Subscription status:", JSON.stringify(status, null, 2))
          setSubscriptionStatus(status)
        } else {
          console.log("⚠️ No user data in localStorage")
        }
      } catch (err) {
        console.error("❌ Error fetching data:", err)
        console.error("❌ Error message:", err.message)
        console.error("❌ Error stack:", err.stack)
        setError("Dështoi ngarkimi i të dhënave")
      } finally {
        setLoading(false)
        console.log("✅ Data fetch completed, loading = false")
      }
    }

    fetchData()
    localStorage.removeItem("subscription_expired")
  }, [])

  // Open Paddle Checkout
  const openCheckout = () => {
    console.log("\n==================== OPENING CHECKOUT ====================")
    console.log("🛒 Paddle initialized:", paddleInitialized)
    console.log("🛒 User state:", user ? "EXISTS" : "NULL")
    console.log("🛒 User data:", user ? JSON.stringify(user, null, 2) : "NO USER")
    console.log("🛒 Price ID:", PRICE_MONTHLY)
    console.log("🛒 Price ID type:", typeof PRICE_MONTHLY)
    console.log("🛒 Price ID length:", PRICE_MONTHLY ? PRICE_MONTHLY.length : 0)
    
    // Validation checks with detailed logging
    if (!paddleInitialized) {
      console.error("❌ Paddle not initialized yet")
      return alert("Sistemi i pagesave nuk është gati. Ju lutem prisni...")
    }
    
    if (!user) {
      console.error("❌ No user found, redirecting to signin")
      return (window.location.href = "/signin")
    }

    if (!PRICE_MONTHLY) {
      console.error("❌ No price ID configured")
      return setError("ID e çmimit (VITE_PADDLE_PRICE_MONTHLY_TEST) mungon.")
    }

    // Validate user email
    if (!user.email) {
      console.error("❌ User has no email:", user)
      return setError("Email i përdoruesit mungon. Ju lutem rifreskoni faqen.")
    }

    // Validate user ID
    if (!user.id) {
      console.error("❌ User has no ID:", user)
      return setError("ID e përdoruesit mungon. Ju lutem rifreskoni faqen.")
    }

    // Build checkout config
    const checkoutConfig = {
      items: [{ 
        priceId: PRICE_MONTHLY, 
        quantity: 1 
      }],
      customer: {
        email: user.email,
      },
      customData: { 
        userId: user.id 
      },
      successCallback: () => {
        console.log("✅ Checkout success callback triggered")
        alert("Pagesa u krye me sukses!")
        setTimeout(() => window.location.reload(), 2000)
      },
    }

    console.log("📦 Checkout config to send to Paddle:")
    console.log(JSON.stringify(checkoutConfig, null, 2))
    console.log("📦 Items:", JSON.stringify(checkoutConfig.items, null, 2))
    console.log("📦 Customer:", JSON.stringify(checkoutConfig.customer, null, 2))
    console.log("📦 CustomData:", JSON.stringify(checkoutConfig.customData, null, 2))

    try {
      console.log("🚀 Calling window.Paddle.Checkout.open...")
      window.Paddle.Checkout.open(checkoutConfig)
      console.log("✅ Paddle.Checkout.open called successfully")
    } catch (err) {
      console.error("❌❌❌ Checkout failed:", err)
      console.error("❌ Error name:", err.name)
      console.error("❌ Error message:", err.message)
      console.error("❌ Error stack:", err.stack)
      setError("Dështoi hapja e checkout. Ju lutem provoni përsëri.")
    }
  }

  // Cancel subscription
  const handleCancelSubscription = async () => {
    if (!window.confirm("Jeni të sigurt që dëshironi të anuloni abonimin tuaj?")) return

    try {
      await paymentService.cancelSubscription(user.id)
      alert("Abonimi u anulua me sukses")
      window.location.reload()
    } catch (err) {
      console.error("Gabim në anulimin e abonimit:", err)
      setError("Dështoi anulimi i abonimit. Ju lutem kontaktoni mbështetjen.")
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent mb-4"></div>
          <p className="text-gray-700 font-medium">Duke ngarkuar detajet e abonimit...</p>
        </div>
      </div>
    )

  const subscriptionActive = subscriptionStatus?.active && subscriptionStatus?.type === "1_month"
  const isFreeTrial = subscriptionStatus?.type === "free_trial" && subscriptionStatus?.active
  const hasSubscription = subscriptionStatus && subscriptionStatus?.type
  const isCancelled = subscriptionStatus?.cancelled && subscriptionStatus?.daysRemaining > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white py-8 px-4 shadow-lg rounded-3xl">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Abonimi & Faturat</h1>
          <p className="text-red-100">Menaxho planin tënd të abonimit dhe shiko detajet e pagesave</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-8 px-4">
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

        <div className="grid md:grid-cols-2 gap-6">
          {isCancelled && (
            <div className="md:col-span-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-5 shadow-lg text-white">
              <div className="flex items-start gap-3">
                <div className="bg-white/20 rounded-full p-2">
                  <span className="text-2xl">⏰</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1">Abonimi i Anuluar</h3>
                  <p className="text-orange-100 text-sm mb-2">
                    Abonimi yt është anuluar, por ke akoma{" "}
                    <span className="font-bold text-white text-lg">{subscriptionStatus.daysRemaining}</span> ditë qasje
                    të mbetur.
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

          {isFreeTrial && !isCancelled && (
            <div className="md:col-span-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-5 shadow-lg text-white">
              <div className="flex items-start gap-3">
                <div className="bg-white/20 rounded-full p-2">
                  <span className="text-2xl">🎉</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1">Periudha Falas Aktive</h3>
                  <p className="text-blue-100 text-sm mb-2">
                    Të kanë mbetur{" "}
                    <span className="font-bold text-white text-lg">{subscriptionStatus.daysRemaining}</span> ditë në
                    periudhën tënde falas.
                  </p>
                  {subscriptionStatus.expiresAt && (
                    <div className="bg-white/10 rounded-lg px-3 py-1.5 inline-block">
                      <p className="text-xs">
                        📅 Përfundon më:{" "}
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
            <div className="md:col-span-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-5 shadow-lg text-white">
              <div className="flex items-start gap-3">
                <div className="bg-white/20 rounded-full p-2">
                  <span className="text-2xl">👑</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1">Abonimi Premium Aktiv</h3>
                  <p className="text-green-100 text-sm mb-2">
                    Të kanë mbetur{" "}
                    <span className="font-bold text-white text-lg">{subscriptionStatus.daysRemaining || 30}</span> ditë
                    deri në rinovim.
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

          {(!hasSubscription || !subscriptionActive || isCancelled) && (
            <div className="md:col-span-2 bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white text-center">
                <div className="inline-block bg-white/20 rounded-full p-3 mb-3">
                  <span className="text-3xl">⭐</span>
                </div>
                <h2 className="text-2xl font-bold mb-1">Abonimi Premium</h2>
                <p className="text-red-100">Zhblloko të gjitha veçoritë dhe vazhdo udhëtimin tënd të të mësuarit</p>
              </div>

              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-5xl font-bold text-red-600">€1.00</span>
                  </div>
                  <p className="text-gray-500 mb-4">për muaj</p>
                  <div className="bg-red-50 rounded-lg p-3">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">Përfitimet e Premium:</h4>
                    <ul className="space-y-1.5 text-left text-gray-700 text-sm">
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Qasje të pakufizuar në të gjitha leksionet</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Përmbajtje ekskluzive premium</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Mbështetje prioritare</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Pa reklama</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <button
                  onClick={openCheckout}
                  disabled={!paddleInitialized}
                  className={`w-full py-3 px-6 text-lg font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg ${paddleInitialized
                      ? "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800"
                      : "bg-gray-300 text-gray-600 cursor-not-allowed"
                    }`}
                >
                  {paddleInitialized ? "💳 Abonohu Tani" : "Duke ngarkuar sistemin e pagesave..."}
                </button>
                <p className="text-center text-xs text-gray-500 mt-3">
                  🔒 Pagesë e sigurt me Paddle. Anulo në çdo kohë.
                </p>
              </div>
            </div>
          )}

          {subscriptionActive && !isCancelled && (
            <div className="md:col-span-2 bg-white rounded-xl shadow-lg p-5 border-2 border-gray-100">
              <div className="flex items-start gap-3 mb-4">
                <div className="bg-red-100 rounded-full p-2">
                  <span className="text-xl">⚙️</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Menaxho Abonimin</h2>
                  <p className="text-gray-600 text-sm">
                    Dëshiron të anulosh? Mund ta anulosh abonimin tënd në çdo kohë. Do të vazhdosh të kesh qasje deri në
                    fund të periudhës së faturimit.
                  </p>
                </div>
              </div>
              <button
                onClick={handleCancelSubscription}
                className="px-5 py-2.5 text-red-600 font-semibold border-2 border-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"
              >
                Anulo Abonimin
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Payment