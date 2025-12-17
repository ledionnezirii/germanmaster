"use client"

import { useEffect, useState } from "react"
import { paymentService, subscriptionService } from "../services/api"

const Payment = () => {
  const [paddleInitialized, setPaddleInitialized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState(null)
  const [error, setError] = useState(null)

  const PADDLE_CLIENT_TOKEN = import.meta.env.VITE_PADDLE_CLIENT_TOKEN
  const PRICE_MONTHLY = import.meta.env.VITE_PADDLE_PRICE_MONTHLY

  // Initialize Paddle
  useEffect(() => {
    const initPaddle = () => {
      if (!PADDLE_CLIENT_TOKEN) {
        setError("Token i Paddle (VITE_PADDLE_CLIENT_TOKEN) mungon në skedarin .env.")
        return
      }

      if (!window.Paddle) {
        setError("Paddle nuk u ngarkua")
        return
      }

      window.Paddle.Initialize({
        token: PADDLE_CLIENT_TOKEN,
        eventCallback: (data) => {
          if (data.type === "checkout.completed") {
            alert("Pagesa u krye me sukses! Faleminderit për abonimin.")
            localStorage.removeItem("subscription_expired")
            setTimeout(() => window.location.reload(), 2000)
          }
          if (data.type === "checkout.closed") console.log("Checkout u mbyll nga përdoruesi")
          if (data.type === "checkout.error") {
            const errorMessage = data.data?.error || "Gabim i panjohur në checkout"
            console.error("Gabim në Checkout:", errorMessage)
            setError(`Gabim në pagesë: ${errorMessage}`)
          }
        },
      })

      setPaddleInitialized(true)
    }

    if (window.Paddle) initPaddle()
    else {
      const check = setInterval(() => {
        if (window.Paddle) {
          clearInterval(check)
          initPaddle()
        }
      }, 100)

      setTimeout(() => {
        clearInterval(check)
        if (!window.Paddle) setError("Sistemi i pagesave dështoi të ngarkohet")
      }, 10000)
    }
  }, [PADDLE_CLIENT_TOKEN])

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
          setSubscriptionStatus(status)
        }
      } catch (err) {
        setError("Dështoi ngarkimi i të dhënave")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    localStorage.removeItem("subscription_expired")
  }, [])

  // Open Paddle Checkout
  const openCheckout = () => {
    if (!paddleInitialized) return alert("Sistemi i pagesave nuk është gati. Ju lutem prisni...")
    if (!user) return (window.location.href = "/signin")

    if (!PRICE_MONTHLY) {
      return setError("ID e çmimit (VITE_PADDLE_PRICE_MONTHLY) mungon.")
    }

    try {
      window.Paddle.Checkout.open({
        items: [{ priceId: PRICE_MONTHLY, quantity: 1 }],
        customer: {
          email: user.email,
        },
        customData: { userId: user.id },
        successCallback: () => {
          alert("Pagesa u krye me sukses!")
          setTimeout(() => window.location.reload(), 2000)
        },
      })
    } catch (err) {
      console.error("Checkout dështoi:", err)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-3">Abonimi & Faturat</h1>
          <p className="text-gray-600 text-lg">Menaxho planin tënd të abonimit</p>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-600 rounded-lg p-5 mb-8 shadow-md">
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
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

        <div className="grid md:grid-cols-2 gap-8">
          {isFreeTrial && (
            <div className="md:col-span-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 shadow-xl text-white">
              <div className="flex items-start gap-4">
                <div className="bg-white/20 rounded-full p-3">
                  <span className="text-3xl">🎉</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">Periudha Falas Aktive</h3>
                  <p className="text-blue-100 text-base mb-3">
                    Të kanë mbetur{" "}
                    <span className="font-bold text-white text-xl">{subscriptionStatus.daysRemaining}</span> ditë në
                    periudhën tënde falas.
                  </p>
                  {subscriptionStatus.expiresAt && (
                    <div className="bg-white/10 rounded-lg px-4 py-2 inline-block">
                      <p className="text-sm">
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

          {subscriptionActive && (
            <div className="md:col-span-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 shadow-xl text-white">
              <div className="flex items-start gap-4">
                <div className="bg-white/20 rounded-full p-3">
                  <span className="text-3xl">👑</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">Abonimi Premium Aktiv</h3>
                  <p className="text-green-100 text-base mb-3">
                    Të kanë mbetur{" "}
                    <span className="font-bold text-white text-xl">{subscriptionStatus.daysRemaining || 30}</span> ditë
                    deri në rinovim.
                  </p>
                  {subscriptionStatus.expiresAt && (
                    <div className="bg-white/10 rounded-lg px-4 py-2 inline-block">
                      <p className="text-sm">
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

          {(!hasSubscription || !subscriptionActive) && (
            <div className="md:col-span-2 bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-red-700 p-8 text-white text-center">
                <div className="inline-block bg-white/20 rounded-full p-4 mb-4">
                  <span className="text-5xl">⭐</span>
                </div>
                <h2 className="text-3xl font-bold mb-2">Abonimi Premium</h2>
                <p className="text-red-100 text-lg">
                  Zhblloko të gjitha veçoritë dhe vazhdo udhëtimin tënd të të mësuarit
                </p>
              </div>

              <div className="p-8">
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-6xl font-bold text-red-600">€1.00</span>
                  </div>
                  <p className="text-gray-500 text-lg">për muaj</p>
                  <div className="mt-6 bg-red-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Përfitimet e Premium:</h4>
                    <ul className="space-y-2 text-left text-gray-700">
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
                  className={`w-full py-4 px-8 text-xl font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg ${
                    paddleInitialized
                      ? "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800"
                      : "bg-gray-300 text-gray-600 cursor-not-allowed"
                  }`}
                >
                  {paddleInitialized ? "💳 Abonohu Tani" : "Duke ngarkuar sistemin e pagesave..."}
                </button>
                <p className="text-center text-sm text-gray-500 mt-4">
                  🔒 Pagesë e sigurt me Paddle. Anulo në çdo kohë.
                </p>
              </div>
            </div>
          )}

          {subscriptionActive && (
            <div className="md:col-span-2 bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-100">
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-red-100 rounded-full p-3">
                  <span className="text-2xl">⚙️</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Menaxho Abonimin</h2>
                  <p className="text-gray-600">
                    Dëshiron të anulosh? Mund ta anulosh abonimin tënd në çdo kohë. Do të vazhdosh të kesh qasje deri në
                    fund të periudhës së faturimit.
                  </p>
                </div>
              </div>
              <button
                onClick={handleCancelSubscription}
                className="px-6 py-3 text-red-600 font-semibold border-2 border-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
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
