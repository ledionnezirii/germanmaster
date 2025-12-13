"use client"
import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { CheckCircle2 } from "lucide-react"
import Script from "next/script"

const PRICE_IDS = {
  livetest: "pri_01jermfn4qrrv4g3x6rk7w0t1k",
  monthly: "pri_01jer0mtwdynbr15tzbtk2xre7",
  quarterly: "pri_01jer0nfthjr5xhgyjkq8gtb0w",
  yearly: "pri_01jer0p02wbfftnjw19bz7f0qb",
}

const PADDLE_CLIENT_TOKEN = "live_e7e364df3364c92dfaae35d7163"

export default function Payment() {
  const [paddleInitialized, setPaddleInitialized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState("livetest")
  const { user, refreshUser } = useAuth() // Get refreshUser from auth context

  const plans = [
    {
      id: "livetest",
      name: "LiveTest",
      price: "€1.00",
      period: "test",
      description: "Test Plan",
      test: true,
      priceId: PRICE_IDS.livetest,
    },
    {
      id: "monthly",
      name: "1 Muaj",
      price: "€4.99",
      period: "muaj",
      description: "Pagesë mujore",
      priceId: PRICE_IDS.monthly,
    },
    {
      id: "quarterly",
      name: "3 Muaj",
      price: "€11.99",
      period: "3 muaj",
      description: "Kurse €2.98",
      savings: "20%",
      priceId: PRICE_IDS.quarterly,
    },
    {
      id: "yearly",
      name: "1 Vit",
      price: "€39.99",
      period: "vit",
      description: "Kurse €19.89",
      savings: "33%",
      popular: true,
      priceId: PRICE_IDS.yearly,
    },
  ]

  useEffect(() => {
    const initPaddle = () => {
      if (window.Paddle) {
        window.Paddle.Initialize({
          token: PADDLE_CLIENT_TOKEN,
          eventCallback: async (data) => {
            if (data.type === "checkout.completed") {
              console.log("[v0] Checkout completed, refreshing user data...")

              setTimeout(async () => {
                try {
                  await refreshUser()
                  alert("Pagesa u krye me sukses! Faleminderit për abonimin.")
                  localStorage.removeItem("subscription_expired")
                  window.location.href = "/dashboard" // Redirect to dashboard
                } catch (error) {
                  console.error("[v0] Failed to refresh user data after payment:", error)
                  alert("Pagesa u krye, por dështoi rifreskimi. Ju lutemi rifreskoni faqen.")
                  window.location.reload()
                }
              }, 3000) // Wait 3 seconds for webhook to process
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
        setLoading(false)
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
          setLoading(false)
        }
      }, 10000)
    }
  }, [refreshUser]) // Add refreshUser to dependencies

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
      console.log("[v0] Opening checkout with userId:", user.id) // Add logging
      window.Paddle.Checkout.open({
        items: [{ priceId: priceId, quantity: 1 }],
        customer: { email: user.email },
        customData: { userId: user.id }, // This passes userId to webhook
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

  return (
    <>
      <Script
        src="https://cdn.paddle.com/paddle/v2/paddle.js"
        strategy="afterInteractive"
        onLoad={() => console.log("[v0] Paddle script loaded")}
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Zgjidh Planin Tënd</h1>
            <p className="text-lg text-gray-600">Vazhdo mësimin dhe hap të gjitha funksionet premium</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">{error}</div>
          )}

          {user?.subscription && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <p className="text-sm text-gray-700">
                Statusi aktual: <strong>{user.subscription.type}</strong>
                {user.subscription.active && (
                  <span className="ml-2 text-green-600">
                    (Aktiv - {user.subscription.daysRemaining} ditë të mbetura)
                  </span>
                )}
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-lg shadow-md border ${
                  selectedPlan === plan.id ? "ring-2 ring-indigo-500" : "border-gray-200"
                } ${plan.popular ? "border-indigo-500 border-2" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-indigo-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      MË POPULLORE
                    </span>
                  </div>
                )}
                {plan.savings && (
                  <div className="absolute -top-3 -right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    {plan.savings}
                  </div>
                )}

                {/* Card Header */}
                <div className="text-center p-6 border-b border-gray-100">
                  <h3 className="text-2xl font-semibold text-gray-900">{plan.name}</h3>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-500">/{plan.period}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
                </div>

                {/* Card Content */}
                <div className="p-6">
                  <button
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    onClick={() => {
                      setSelectedPlan(plan.id)
                      openCheckout(plan.priceId)
                    }}
                    disabled={loading || !paddleInitialized}
                  >
                    {loading ? "Duke u ngarkuar..." : "Zgjidh Këtë Plan"}
                  </button>

                  <ul className="mt-6 space-y-3">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="text-sm">Qasje e plotë në të gjitha kurset</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="text-sm">Asnjë reklamë</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="text-sm">Mbështetje prioritare</span>
                    </li>
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
