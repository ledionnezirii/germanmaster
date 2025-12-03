






"use client"

import { useEffect, useState } from "react"
import { paymentService } from "../services/api"

// Configuration from .env
const PRICE_ID = "pri_01kaeqvvk2kdc02p39zrb8gne3"
const PADDLE_CLIENT_TOKEN = "live_0ef1c5946ac5d34cf6db8d711cd"
const REDIRECT_URL = "https://17061968.netlify.app/billing"

const Payment = () => {
  const [paddleInitialized, setPaddleInitialized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (window.Paddle) {
      window.Paddle.Initialize({
        token: PADDLE_CLIENT_TOKEN,
        eventCallback: (data) => {
          console.log("[v0] Paddle Event:", data.type, data)

          if (data.type === "checkout.completed") {
            alert(`Payment completed! Order: ${data.data.id}`)
            // Reload to fetch updated subscription
            setTimeout(() => window.location.reload(), 2000)
          }

          if (data.type === "checkout.error") {
            const errorMessage = data.data?.error || "Unknown checkout error"
            console.error("[v0] Checkout Error:", errorMessage, data)
            setError(`Payment error: ${errorMessage}`)
          }
        },
      })

      setPaddleInitialized(true)
    } else {
      console.error("[v0] Paddle script not loaded. Check index.html!")
      setError("Payment system not loaded. Please refresh the page.")
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

          // Fetch subscription from backend
          try {
            const subResponse = await paymentService.getUserSubscription(userData.id)
            setSubscription(subResponse)
            console.log("[v0] Subscription data:", subResponse)
          } catch (err) {
            console.log("[v0] No active subscription found:", err)
          }
        }
      } catch (err) {
        setError("Failed to load data")
        console.error("[v0] Error fetching data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const openCheckout = async () => {
    if (!paddleInitialized) {
      alert("Paddle not initialized yet")
      return
    }

    if (!user) {
      alert("User not found. Please sign in again.")
      return
    }

    try {
      // Call backend to create checkout session
      const response = await paymentService.createCheckoutSession(user.id, PRICE_ID)
      console.log("[v0] Checkout session created:", response)

      // Open Paddle checkout
      window.Paddle.Checkout.open({
        items: [{ priceId: PRICE_ID, quantity: 1 }],
        customer: { email: user.email },
        customData: { userId: user.id },
        settings: {
          locale: "en",
          displayMode: "overlay",
        },
        successUrl: `${REDIRECT_URL}?status=success&paddle_order_id={checkout.id}`,
        cancelUrl: `${REDIRECT_URL}?status=cancelled`,
      })
    } catch (error) {
      console.error("[v0] Checkout error:", error)
      setError("Failed to open checkout. Please try again.")
    }
  }

  const calculateTrialDaysLeft = () => {
    if (!user?.subscription?.expiresAt) return 0

    const now = new Date()
    const expiresAt = new Date(user.subscription.expiresAt)
    const diffTime = expiresAt - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return Math.max(0, diffDays)
  }

  const isTrialActive = () => {
    if (!user?.subscription) return false
    const now = new Date()
    const expiresAt = new Date(user.subscription.expiresAt)
    return user.subscription.type === "free_trial" && expiresAt > now
  }

  const isSubscriptionActive = () => {
    if (!subscription) return false
    const now = new Date()
    const expiresAt = new Date(subscription.expiresAt)
    return subscription.status === "active" && expiresAt > now
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <div>Loading subscription details...</div>
      </div>
    )
  }

  const trialDaysLeft = calculateTrialDaysLeft()
  const trialActive = isTrialActive()
  const subscriptionActive = isSubscriptionActive()

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "10px" }}>Subscription & Billing</h1>
      <p style={{ color: "#666", marginBottom: "30px" }}>Manage your subscription and payment details</p>

      {/* Error Message */}
      {error && (
        <div
          style={{
            backgroundColor: "#fee",
            border: "1px solid #fcc",
            borderRadius: "8px",
            padding: "15px",
            marginBottom: "20px",
            color: "#c00",
          }}
        >
          {error}
        </div>
      )}

      {/* Current Status Card */}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "20px",
          backgroundColor: "#fff",
        }}
      >
        <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "10px" }}>
          {subscriptionActive ? "✅ Active Subscription" : trialActive ? "⏰ Free Trial Active" : "❌ Trial Expired"}
        </h2>
        <p style={{ color: "#666", marginBottom: "15px" }}>
          {subscriptionActive
            ? "You have full access to all premium features"
            : trialActive
              ? `Your free trial ends in ${trialDaysLeft} day${trialDaysLeft !== 1 ? "s" : ""}`
              : "Your free trial has ended. Subscribe to continue learning"}
        </p>

        {trialActive && user?.subscription?.expiresAt && (
          <div
            style={{ backgroundColor: "#fff3cd", padding: "12px", borderRadius: "6px", border: "1px solid #ffc107" }}
          >
            <p style={{ fontSize: "14px", margin: 0 }}>
              ⏰ Your 2-day free trial ends on{" "}
              {new Date(user.subscription.expiresAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        )}

        {subscriptionActive && subscription && (
          <div style={{ marginTop: "15px" }}>
            <p style={{ fontSize: "14px", marginBottom: "5px" }}>
              <strong>Plan:</strong> {subscription.subscriptionType || "Premium"}
            </p>
            <p style={{ fontSize: "14px", marginBottom: "5px" }}>
              <strong>Next billing:</strong>{" "}
              {subscription.nextBillingDate ? new Date(subscription.nextBillingDate).toLocaleDateString() : "N/A"}
            </p>
            <p style={{ fontSize: "14px", marginBottom: "5px" }}>
              <strong>Amount:</strong> €{subscription.amount || "1.00"}
            </p>
          </div>
        )}
      </div>

      {/* Pricing Card - Show only if not subscribed */}
      {!subscriptionActive && (
        <div
          style={{
            border: "2px solid #dc3545",
            borderRadius: "12px",
            padding: "30px",
            backgroundColor: "#fff",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "10px" }}>Premium Subscription</h2>
          <p style={{ color: "#666", marginBottom: "20px" }}>Unlock all features and continue your learning journey</p>

          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <div style={{ fontSize: "48px", fontWeight: "bold", color: "#dc3545" }}>€1.00</div>
            <p style={{ fontSize: "14px", color: "#666" }}>per month</p>
          </div>

          <ul style={{ listStyle: "none", padding: 0, marginBottom: "30px" }}>
            <li style={{ padding: "8px 0", display: "flex", alignItems: "center" }}>
              <span style={{ color: "#28a745", marginRight: "10px", fontSize: "20px" }}>✓</span>
              <span>Unlimited access to all lessons</span>
            </li>
            <li style={{ padding: "8px 0", display: "flex", alignItems: "center" }}>
              <span style={{ color: "#28a745", marginRight: "10px", fontSize: "20px" }}>✓</span>
              <span>All grammar topics unlocked</span>
            </li>
            <li style={{ padding: "8px 0", display: "flex", alignItems: "center" }}>
              <span style={{ color: "#28a745", marginRight: "10px", fontSize: "20px" }}>✓</span>
              <span>Pronunciation practice</span>
            </li>
            <li style={{ padding: "8px 0", display: "flex", alignItems: "center" }}>
              <span style={{ color: "#28a745", marginRight: "10px", fontSize: "20px" }}>✓</span>
              <span>Progress tracking & certificates</span>
            </li>
            <li style={{ padding: "8px 0", display: "flex", alignItems: "center" }}>
              <span style={{ color: "#28a745", marginRight: "10px", fontSize: "20px" }}>✓</span>
              <span>Access from up to 2 devices</span>
            </li>
          </ul>

          <button
            onClick={openCheckout}
            disabled={!paddleInitialized}
            style={{
              width: "100%",
              padding: "15px 25px",
              fontSize: "18px",
              fontWeight: "bold",
              cursor: paddleInitialized ? "pointer" : "not-allowed",
              backgroundColor: paddleInitialized ? "#dc3545" : "#ccc",
              color: "white",
              border: "none",
              borderRadius: "8px",
              marginBottom: "10px",
            }}
          >
            {paddleInitialized ? "💳 Subscribe Now" : "Loading Payment System..."}
          </button>

          <p style={{ textAlign: "center", fontSize: "12px", color: "#666" }}>
            Secure payment powered by Paddle. Cancel anytime.
          </p>
        </div>
      )}

      {/* Cancel Subscription - Show only if subscribed */}
      {subscriptionActive && (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "12px",
            padding: "20px",
            backgroundColor: "#fff",
          }}
        >
          <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "10px" }}>Manage Subscription</h2>
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>
            Need to cancel? You can cancel your subscription anytime. You'll continue to have access until the end of
            your billing period.
          </p>
          <button
            onClick={async () => {
              if (window.confirm("Are you sure you want to cancel your subscription?")) {
                try {
                  await paymentService.cancelSubscription(user.id)
                  alert("Subscription cancelled successfully")
                  window.location.reload()
                } catch (err) {
                  setError("Failed to cancel subscription. Please contact support.")
                }
              }
            }}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              cursor: "pointer",
              backgroundColor: "#fff",
              color: "#dc3545",
              border: "1px solid #dc3545",
              borderRadius: "6px",
            }}
          >
            Cancel Subscription
          </button>
        </div>
      )}
    </div>
  )
}

export default Payment
