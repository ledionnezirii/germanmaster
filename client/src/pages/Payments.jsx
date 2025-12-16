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
  const PRODUCT_MONTHLY = import.meta.env.VITE_PADDLE_PRODUCT_MONTHLY

  // Initialize Paddle
  useEffect(() => {
    const initPaddle = () => {
      if (!window.Paddle) {
        setError("Paddle not loaded")
        return
      }

      window.Paddle.Initialize({
        token: PADDLE_CLIENT_TOKEN,
        eventCallback: (data) => {
          if (data.type === "checkout.completed") {
            alert("Payment completed! Thank you for subscribing.")
            localStorage.removeItem("subscription_expired")
            setTimeout(() => window.location.reload(), 2000)
          }
          if (data.type === "checkout.closed") console.log("Checkout closed by user")
          if (data.type === "checkout.error") {
            const errorMessage = data.data?.error || "Unknown checkout error"
            console.error("Checkout Error:", errorMessage)
            setError(`Payment error: ${errorMessage}`)
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
        if (!window.Paddle) setError("Payment system failed to load")
      }, 10000)
    }
  }, [])

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
        setError("Failed to load data")
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
    if (!paddleInitialized) return alert("Payment system not ready. Please wait...")
    if (!user) return (window.location.href = "/signin")

    try {
      window.Paddle.Checkout.open({
        product: PRODUCT_MONTHLY,
        email: user.email,
        passthrough: JSON.stringify({ userId: user.id }),
        successCallback: () => {
          alert("Payment successful!")
          setTimeout(() => window.location.reload(), 2000)
        },
      })
    } catch (err) {
      console.error("Checkout failed:", err)
      setError("Failed to open checkout. Please try again.")
    }
  }

  // Cancel subscription
  const handleCancelSubscription = async () => {
    if (!window.confirm("Are you sure you want to cancel your subscription?")) return

    try {
      await paymentService.cancelSubscription(user.id)
      alert("Subscription cancelled successfully")
      window.location.reload()
    } catch (err) {
      console.error("Cancel subscription error:", err)
      setError("Failed to cancel subscription. Please contact support.")
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading subscription details...</div>
      </div>
    )

  const subscriptionActive = subscriptionStatus?.active && subscriptionStatus?.type === "1_month"
  const isFreeTrial = subscriptionStatus?.type === "free_trial" && subscriptionStatus?.active
  const hasSubscription = subscriptionStatus && subscriptionStatus?.type

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">Subscription & Billing</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-start">
            <p className="text-red-800">{error}</p>
            <button onClick={() => setError(null)} className="text-red-600 font-bold hover:text-red-800">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Free Trial Banner */}
      {isFreeTrial && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-blue-900 font-semibold mb-1">Free Trial Active</h3>
          <p className="text-blue-700 text-sm">
            You have {subscriptionStatus.daysRemaining} day(s) remaining in your free trial.
            {subscriptionStatus.expiresAt && (
              <span className="block mt-1">
                Trial ends on: {new Date(subscriptionStatus.expiresAt).toLocaleDateString()}
              </span>
            )}
          </p>
        </div>
      )}

      {/* Show Subscribe Button if no active subscription */}
      {(!hasSubscription || !subscriptionActive) && (
        <div className="border-2 border-red-600 rounded-lg p-8 bg-white mb-6">
          <h2 className="text-2xl font-bold mb-4">Premium Subscription</h2>
          <p className="text-gray-600 mb-6">Unlock all features and continue your learning journey</p>
          <div className="text-center mb-6">
            <div className="text-5xl font-bold text-red-600">€1.00</div>
            <p className="text-gray-600 text-sm">per month</p>
          </div>
          <button
            onClick={openCheckout}
            disabled={!paddleInitialized}
            className={`w-full py-3 px-6 text-lg font-bold rounded-lg transition-colors ${
              paddleInitialized ? "bg-red-600 text-white hover:bg-red-700" : "bg-gray-300 text-gray-600 cursor-not-allowed"
            }`}
          >
            {paddleInitialized ? "💳 Subscribe Now" : "Loading Payment System..."}
          </button>
          <p className="text-center text-xs text-gray-600 mt-2">Secure payment powered by Paddle. Cancel anytime.</p>
        </div>
      )}

      {/* Show Cancel Button if subscription is active */}
      {subscriptionActive && (
        <div className="border border-gray-200 rounded-lg p-6 bg-white">
          <h2 className="text-xl font-semibold mb-3">Manage Subscription</h2>
          <p className="text-sm text-gray-600 mb-4">
            Need to cancel? You can cancel your subscription anytime. You'll continue to have access until the end of your billing period.
          </p>
          <button
            onClick={handleCancelSubscription}
            className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
          >
            Cancel Subscription
          </button>
        </div>
      )}
    </div>
  )
}

export default Payment
