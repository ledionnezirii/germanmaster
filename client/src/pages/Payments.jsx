"use client"

import { useEffect, useState } from "react"
import { paymentService, subscriptionService } from "../services/api"

const PRICE_ID = "pri_01kaeqvvk2kdc02p39zrb8gne3"
const PADDLE_CLIENT_TOKEN = "live_e7e364df3364c92dfaae35d7163"

const Payment = () => {
  const [paddleInitialized, setPaddleInitialized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const initPaddle = () => {
      if (window.Paddle) {
        window.Paddle.Initialize({
          token: PADDLE_CLIENT_TOKEN,
          eventCallback: (data) => {
            if (data.type === "checkout.completed") {
              alert("Payment completed! Thank you for subscribing.")
              localStorage.removeItem("subscription_expired")
              // Force refresh user data after payment
              setTimeout(() => window.location.reload(), 2000)
            }

            if (data.type === "checkout.closed") {
              console.log("Checkout closed by user")
            }

            if (data.type === "checkout.error") {
              const errorMessage = data.data?.error || "Unknown checkout error"
              console.error("Checkout Error:", errorMessage)
              setError(`Payment error: ${errorMessage}`)
            }
          },
        })
        setPaddleInitialized(true)
      } else {
        setError("Payment system not loaded. Please refresh the page.")
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
          setError("Payment system failed to load. Please refresh the page.")
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

          // Get subscription status
          const status = await subscriptionService.checkStatus()
          console.log("[Payment] Subscription status:", status)
          setSubscriptionStatus(status)
        }
      } catch (err) {
        setError("Failed to load data")
        console.error("Error fetching data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Clear the subscription expired flag when visiting payment page
    localStorage.removeItem("subscription_expired")
  }, [])

  const openCheckout = () => {
    if (!paddleInitialized) {
      alert("Payment system not ready. Please wait...")
      return
    }

    if (!user) {
      alert("Please sign in to continue.")
      window.location.href = "/signin"
      return
    }

    setError(null)

    try {
      window.Paddle.Checkout.open({
        items: [{ priceId: PRICE_ID, quantity: 1 }],
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
      setError("Failed to open checkout. Please try again.")
    }
  }

  const handleCancelSubscription = async () => {
    if (!window.confirm("Are you sure you want to cancel your subscription?")) {
      return
    }

    try {
      await paymentService.cancelSubscription(user.id)
      alert("Subscription cancelled successfully")
      window.location.reload()
    } catch (err) {
      console.error("Cancel error:", err)
      setError("Failed to cancel subscription. Please contact support.")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading subscription details...</div>
      </div>
    )
  }

  const subscriptionActive = subscriptionStatus?.active || false

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-2">Subscription & Billing</h1>
      <p className="text-gray-600 mb-8">Manage your subscription and payment details</p>

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

      {/* Trial Status Banner */}
      {subscriptionStatus?.type === "free_trial" && subscriptionStatus?.active && (
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

      {/* Paid Subscription Banner */}
      {subscriptionStatus?.type === "1_month" && subscriptionStatus?.active && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="text-green-900 font-semibold mb-1">✅ Premium Subscription Active</h3>
          <p className="text-green-700 text-sm">
            You have {subscriptionStatus.daysRemaining} day(s) remaining in your subscription.
            {subscriptionStatus.expiresAt && (
              <span className="block mt-1">
                Expires on: {new Date(subscriptionStatus.expiresAt).toLocaleDateString()}
              </span>
            )}
          </p>
        </div>
      )}

      {/* Expired Trial Banner */}
      {subscriptionStatus?.expired && !subscriptionActive && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-red-900 font-semibold mb-1">⚠️ Free Trial Expired</h3>
          <p className="text-red-700 text-sm">
            Your free trial has ended. Subscribe now to continue accessing all features.
          </p>
        </div>
      )}

      {/* Current Status Card */}
      <div className="border border-gray-200 rounded-lg p-6 mb-6 bg-white">
        <h2 className="text-xl font-semibold mb-3">
          {subscriptionActive ? "✅ Active Subscription" : "❌ No Active Subscription"}
        </h2>
        <p className="text-gray-600 mb-4">
          {subscriptionActive
            ? "You have full access to all premium features"
            : "Subscribe to access all premium features"}
        </p>

        {subscriptionActive && subscriptionStatus && (
          <div className="space-y-2 text-sm">
            <p>
              <strong>Plan:</strong> {subscriptionStatus.type === "1_month" ? "Premium Monthly" : subscriptionStatus.type === "free_trial" ? "Free Trial" : "Premium"}
            </p>
            <p>
              <strong>Status:</strong> {subscriptionStatus.active ? "Active" : "Inactive"}
            </p>
            {subscriptionStatus.expiresAt && (
              <p>
                <strong>Expires on:</strong> {new Date(subscriptionStatus.expiresAt).toLocaleDateString()}
              </p>
            )}
            <p>
              <strong>Days remaining:</strong> {subscriptionStatus.daysRemaining}
            </p>
          </div>
        )}
      </div>

      {/* Pricing Card */}
      {!subscriptionActive && (
        <div className="border-2 border-red-600 rounded-lg p-8 bg-white mb-6">
          <h2 className="text-2xl font-bold mb-2">Premium Subscription</h2>
          <p className="text-gray-600 mb-6">Unlock all features and continue your learning journey</p>

          <div className="text-center mb-8">
            <div className="text-5xl font-bold text-red-600">€1.00</div>
            <p className="text-gray-600 text-sm">per month</p>
          </div>

          <ul className="space-y-3 mb-8">
            {[
              "Unlimited access to all lessons",
              "All grammar topics unlocked",
              "Pronunciation practice",
              "Progress tracking & certificates",
              "Access from up to 2 devices",
            ].map((feature, index) => (
              <li key={index} className="flex items-center">
                <span className="text-green-600 mr-3 text-lg">✓</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={openCheckout}
            disabled={!paddleInitialized}
            className={`w-full py-3 px-6 text-lg font-bold rounded-lg transition-colors mb-3 ${
              paddleInitialized
                ? "bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                : "bg-gray-300 text-gray-600 cursor-not-allowed"
            }`}
          >
            {paddleInitialized ? "💳 Subscribe Now" : "Loading Payment System..."}
          </button>

          <p className="text-center text-xs text-gray-600">Secure payment powered by Paddle. Cancel anytime.</p>
        </div>
      )}

      {/* Cancel Subscription - Only show for paid subscriptions */}
      {subscriptionActive && subscriptionStatus?.type === "1_month" && (
        <div className="border border-gray-200 rounded-lg p-6 bg-white">
          <h2 className="text-xl font-semibold mb-3">Manage Subscription</h2>
          <p className="text-sm text-gray-600 mb-4">
            Need to cancel? You can cancel your subscription anytime. You'll continue to have access until the end of
            your billing period.
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