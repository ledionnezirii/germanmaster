import { useState, useEffect } from "react"
import api from "../services/api"

export default function Payments() {
  const [loading, setLoading] = useState(false)
  const [hasSubscription, setHasSubscription] = useState(false)
  const [subscriptionData, setSubscriptionData] = useState(null)
  const [toast, setToast] = useState(null)

  // Your Paddle product details from the screenshot
  const PADDLE_PRODUCT_ID = "pro_01kac2n1hcxsyhang2nv1g99xa"
  const PADDLE_PRICE_ID = "pri_01kac2nw5dah48555mz9cgm5ev"

  const showToast = (title, description, variant = "default") => {
    setToast({ title, description, variant })
    setTimeout(() => setToast(null), 5000)
  }

  useEffect(() => {
    // Load Paddle.js
    const script = document.createElement("script")
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js"
    script.async = true
    document.body.appendChild(script)

    script.onload = () => {
      if (window.Paddle) {
        // Initialize Paddle with your vendor ID (sandbox mode)
        window.Paddle.Environment.set("sandbox")
        window.Paddle.Initialize({
          token: process.env.REACT_APP_PADDLE_CLIENT_TOKEN || "test_your_paddle_client_token",
        })
      }
    }

    // Check if user already has subscription
    checkSubscriptionStatus()

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const checkSubscriptionStatus = async () => {
    try {
      const response = await api.get("/payments/subscription/status")
      if (response.data?.subscription) {
        setHasSubscription(true)
        setSubscriptionData(response.data.subscription)
      }
    } catch (error) {
      console.log("No active subscription found")
    }
  }

  const handleSubscribe = async () => {
    if (!window.Paddle) {
      showToast("Error", "Payment system is loading. Please try again.", "destructive")
      return
    }

    setLoading(true)

    try {
      // Get checkout URL from your backend
      const response = await api.post("/payments/create-checkout", {
        priceId: PADDLE_PRICE_ID,
      })

      const { checkoutUrl } = response.data

      // Open Paddle checkout
      window.Paddle.Checkout.open({
        items: [
          {
            priceId: PADDLE_PRICE_ID,
            quantity: 1,
          },
        ],
        customData: {
          userId: localStorage.getItem("userId") || "",
        },
        successUrl: window.location.origin + "/payment-success",
        closeUrl: window.location.origin + "/payments",
      })
    } catch (error) {
      console.error("Checkout error:", error)
      showToast("Error", error.response?.data?.message || "Failed to start checkout", "destructive")
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!subscriptionData?.paddleSubscriptionId) return

    try {
      setLoading(true)
      await api.post("/payments/subscription/cancel", {
        subscriptionId: subscriptionData.paddleSubscriptionId,
      })
      
      showToast("Success", "Subscription cancelled successfully")
      
      setHasSubscription(false)
      setSubscriptionData(null)
    } catch (error) {
      showToast("Error", error.response?.data?.message || "Failed to cancel subscription", "destructive")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      {toast && (
        <div className="fixed right-4 top-4 z-50 animate-in slide-in-from-top-2">
          <div className={`rounded-lg border p-4 shadow-lg ${
            toast.variant === "destructive" 
              ? "border-red-200 bg-red-50" 
              : "border-green-200 bg-green-50"
          }`}>
            <h4 className={`font-semibold ${
              toast.variant === "destructive" ? "text-red-900" : "text-green-900"
            }`}>
              {toast.title}
            </h4>
            <p className={`mt-1 text-sm ${
              toast.variant === "destructive" ? "text-red-700" : "text-green-700"
            }`}>
              {toast.description}
            </p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Upgrade to Premium</h1>
          <p className="mt-2 text-slate-600">
            Get access to all premium features and content
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Free Plan */}
          <div className="flex flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-2xl font-bold text-slate-900">Free Plan</h3>
              <div className="mt-2">
                <span className="text-4xl font-bold text-slate-900">€0</span>
                <span className="text-slate-600">/month</span>
              </div>
            </div>

            <ul className="mb-6 flex-1 space-y-3">
              <li className="flex items-center gap-2 text-slate-900">
                <svg
                  className="h-5 w-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Basic content access
              </li>
              <li className="flex items-center gap-2 text-slate-900">
                <svg
                  className="h-5 w-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Limited daily challenges
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                No advanced features
              </li>
            </ul>

            <button
              disabled
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-400 cursor-not-allowed"
            >
              Current Plan
            </button>
          </div>

          {/* Premium Plan */}
          <div className="relative flex flex-col rounded-lg border-2 border-blue-500 bg-white p-6 shadow-lg">
            <div className="absolute -top-3 right-6 rounded-full bg-blue-600 px-4 py-1 text-sm font-semibold text-white">
              Best Value
            </div>

            <div className="mb-4">
              <h3 className="text-2xl font-bold text-slate-900">Premium Plan</h3>
              <div className="mt-2">
                <span className="text-4xl font-bold text-slate-900">€1.00</span>
                <span className="text-slate-600">/month</span>
              </div>
            </div>

            <ul className="mb-6 flex-1 space-y-3">
              <li className="flex items-center gap-2 text-slate-900">
                <svg
                  className="h-5 w-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Unlimited content access
              </li>
              <li className="flex items-center gap-2 text-slate-900">
                <svg
                  className="h-5 w-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                All challenges & tests
              </li>
              <li className="flex items-center gap-2 text-slate-900">
                <svg
                  className="h-5 w-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Pronunciation practice
              </li>
              <li className="flex items-center gap-2 text-slate-900">
                <svg
                  className="h-5 w-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Ad-free experience
              </li>
              <li className="flex items-center gap-2 text-slate-900">
                <svg
                  className="h-5 w-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Priority support
              </li>
            </ul>

            {hasSubscription ? (
              <div className="space-y-3">
                <button
                  disabled
                  className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white cursor-not-allowed opacity-70"
                >
                  Active Subscription
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Processing..." : "Cancel Subscription"}
                </button>
                {subscriptionData && (
                  <p className="text-center text-sm text-slate-600">
                    Next billing: {new Date(subscriptionData.nextBillingDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Loading..." : "Subscribe Now"}
              </button>
            )}
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-xl font-bold text-slate-900">What You'll Get</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h4 className="mb-2 font-semibold text-slate-900">Unlimited Learning</h4>
              <p className="text-sm text-slate-600">
                Access all lessons, exercises, and practice materials without any restrictions.
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold text-slate-900">Advanced Features</h4>
              <p className="text-sm text-slate-600">
                Unlock pronunciation tools, grammar deep-dives, and personalized learning paths.
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold text-slate-900">Track Progress</h4>
              <p className="text-sm text-slate-600">
                Get detailed analytics, certificates, and achievements to monitor your learning journey.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-8">
          <h3 className="mb-4 text-2xl font-bold text-slate-900">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h4 className="mb-2 font-semibold text-slate-900">Can I cancel anytime?</h4>
              <p className="text-sm text-slate-600">
                Yes, you can cancel your subscription at any time. You'll continue to have access until the
                end of your billing period.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h4 className="mb-2 font-semibold text-slate-900">Is payment secure?</h4>
              <p className="text-sm text-slate-600">
                We use Paddle, a trusted payment processor that handles all transactions securely.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h4 className="mb-2 font-semibold text-slate-900">What payment methods are accepted?</h4>
              <p className="text-sm text-slate-600">
                We accept all major credit cards, PayPal, and other payment methods through Paddle.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
