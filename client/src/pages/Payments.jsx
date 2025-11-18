import { useState, useEffect } from "react"
import api from "../services/api"

export default function Payments() {
  const [loading, setLoading] = useState(false)
  const [hasSubscription, setHasSubscription] = useState(false)
  const [subscriptionData, setSubscriptionData] = useState(null)
  const [toast, setToast] = useState(null)
  const [user, setUser] = useState(null)
  const [paddleReady, setPaddleReady] = useState(false)

  // Your Paddle product details
  const PADDLE_PRODUCT_ID = "pro_01kac2n1hcxsyhang2nv1g99xa"
  const PADDLE_PRICE_ID = "pri_01kac2nw5dah48555mz9cgm5ev"
  const PADDLE_SELLER_ID = "257357"

  const showToast = (title, description, variant = "default") => {
    setToast({ title, description, variant })
    setTimeout(() => setToast(null), 5000)
  }

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        console.log("[v0] Loaded user from localStorage:", parsedUser)
      } catch (error) {
        console.error("[v0] Failed to parse user data:", error)
      }
    }

    // Load Paddle.js
    const script = document.createElement("script")
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js"
    script.async = true
    document.body.appendChild(script)

    script.onload = () => {
      if (window.Paddle) {
        try {
          const clientToken = import.meta.env.VITE_PADDLE_CLIENT_TOKEN
          
          if (!clientToken) {
            console.warn("[v0] VITE_PADDLE_CLIENT_TOKEN not set. Using seller ID for initialization.")
          }

          // Initialize Paddle with clientToken OR seller ID
          window.Paddle.Initialize({
            token: clientToken || PADDLE_SELLER_ID,
            pwCustomer: {
              email: user?.email,
            },
          })

          console.log("[v0] Paddle initialized successfully")
          setPaddleReady(true)
        } catch (error) {
          console.error("[v0] Failed to initialize Paddle:", error)
          showToast("Error", "Failed to initialize payment system", "destructive")
        }
      }
    }

    script.onerror = () => {
      console.error("[v0] Failed to load Paddle script")
      showToast("Error", "Failed to load payment system", "destructive")
    }

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  useEffect(() => {
    if (user?.id) {
      checkSubscriptionStatus()
    }
  }, [user])

  const checkSubscriptionStatus = async () => {
    if (!user?.id) {
      console.log("[v0] No user ID found")
      return
    }

    try {
      console.log("[v0] Checking subscription for user:", user.id)
      const response = await api.get(`/payments/subscription/${user.id}`)
      if (response.data?.data) {
        setHasSubscription(true)
        setSubscriptionData(response.data.data)
        console.log("[v0] Active subscription found:", response.data.data)
      }
    } catch (error) {
      console.log("[v0] No active subscription found:", error.response?.data?.message || error.message)
    }
  }

  const handleSubscribe = async () => {
    if (!paddleReady || !window.Paddle) {
      showToast("Error", "Payment system is loading. Please try again.", "destructive")
      return
    }

    if (!user?.id) {
      showToast("Error", "Please log in to subscribe", "destructive")
      return
    }

    setLoading(true)

    try {
      console.log("[v0] Creating checkout for user:", user.id)
      console.log("[v0] Price ID:", PADDLE_PRICE_ID)

      const response = await api.post("/payments/checkout/create", {
        userId: user.id,
        priceId: PADDLE_PRICE_ID,
      })

      console.log("[v0] Checkout response:", response.data)

      if (window.Paddle.Checkout) {
        window.Paddle.Checkout.open({
          items: [
            {
              priceId: PADDLE_PRICE_ID,
              quantity: 1,
            },
          ],
          customer: user?.email ? { email: user.email } : undefined,
          customData: {
            userId: user.id,
          },
          settings: {
            successUrl: `${window.location.origin}/payments?success=true`,
            theme: "light",
          },
        })
      } else {
        throw new Error("Paddle Checkout not available")
      }

      showToast("Success", "Opening checkout...")
    } catch (error) {
      console.error("[v0] Checkout error:", error)
      showToast("Error", error.response?.data?.message || error.message || "Failed to start checkout", "destructive")
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!subscriptionData?.paddleSubscriptionId) {
      showToast("Error", "Subscription ID not found", "destructive")
      return
    }

    try {
      setLoading(true)
      console.log("[v0] Cancelling subscription:", subscriptionData.paddleSubscriptionId)
      
      await api.post("/payments/subscription/cancel", {
        userId: user.id,
      })
      
      showToast("Success", "Subscription cancelled successfully")
      
      setHasSubscription(false)
      setSubscriptionData(null)
    } catch (error) {
      console.error("[v0] Cancel error:", error)
      showToast("Error", error.response?.data?.message || "Failed to cancel subscription", "destructive")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      {/* Toast notification */}
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
                disabled={loading || !user || !paddleReady}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {!paddleReady ? "Loading payment system..." : loading ? "Loading..." : !user ? "Please Log In" : "Subscribe Now"}
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
