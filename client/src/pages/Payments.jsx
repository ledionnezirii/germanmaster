"use client"
import { Check, Zap, Star } from "lucide-react"

// Paddle publishable key
const PADDLE_VENDOR_ID = 123456
const PRODUCT_MONTHLY = 111111
const PRODUCT_QUARTERLY = 222222
const PRODUCT_YEARLY = 333333

// Inicilizojmë Paddle (script)
if (typeof window !== "undefined" && !window.Paddle) {
  const script = document.createElement("script")
  script.src = "https://cdn.paddle.com/paddle/paddle.js"
  script.onload = () => {
    window.Paddle.Setup({ vendor: PADDLE_VENDOR_ID })
  }
  document.body.appendChild(script)
}

const PricingCard = ({ title, price, period, productId, onSelect, isPopular, savings, features }) => (
  <div className={`relative group ${isPopular ? "md:-mt-2 md:scale-95" : ""}`}>
    {isPopular && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-3 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
          <Star className="w-2.5 h-2.5 fill-current" />
          Më i Preferuari
        </div>
      </div>
    )}

    <div
      className={`relative h-full bg-white rounded-xl overflow-hidden transition-all duration-300 ${
        isPopular ? "shadow-2xl border-2 border-violet-200" : "shadow-lg hover:shadow-xl border border-gray-100"
      } group-hover:-translate-y-1`}
    >
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
          isPopular ? "bg-gradient-to-br from-violet-50 to-indigo-50" : "bg-gradient-to-br from-gray-50 to-white"
        }`}
      />

      <div className="relative p-4">
        {/* Header */}
        <div className="text-center mb-3">
          <h3 className="text-base font-bold text-gray-900 mb-1">{title}</h3>
          {savings && (
            <div className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              Kursen {savings}
            </div>
          )}
        </div>

        {/* Price */}
        <div className="text-center mb-4">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              ${price}
            </span>
            <span className="text-gray-500 text-sm">/{period}</span>
          </div>
        </div>

        {/* Features */}
        <ul className="space-y-2 mb-4">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <div className="mt-0.5 flex-shrink-0">
                <Check className="w-4 h-4 text-green-500" />
              </div>
              <span className="text-gray-600 text-xs">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <button
          onClick={() => onSelect(productId)}
          className={`w-full py-2 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-sm ${
            isPopular
              ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-lg hover:shadow-xl"
              : "bg-gray-900 text-white hover:bg-gray-800"
          }`}
        >
          <Zap className="w-3 h-3" />
          Fillo Tani
        </button>
      </div>
    </div>
  </div>
)

const Payments = () => {
  const handlePayment = (productId) => {
    if (!window.Paddle) return alert("Paddle nuk u ngarkua ende")

    window.Paddle.Checkout.open({
      product: productId,
      email: "",
      successCallback: (data) => {
        console.log("Pagesa u krye me sukses:", data)
        alert("Faleminderit për pagesën!")
      },
      closeCallback: () => {
        console.log("Dritarja e pagesës u mbyll")
      },
    })
  }

  const plans = [
    {
      title: "Mujor",
      price: "9.99",
      period: "muaj",
      productId: PRODUCT_MONTHLY,
      features: [
        "Qasje e plotë në të gjitha veçoritë",
        "Mbështetje 24/7",
        "Përditësime të rregullta",
        "Pa kufizime përdorimi",
      ],
    },
    {
      title: "3 Mujor",
      price: "24.99",
      period: "3 muaj",
      productId: PRODUCT_QUARTERLY,
      isPopular: true,
      savings: "17%",
      features: [
        "Të gjitha veçoritë e planit mujor",
        "Mbështetje prioritare",
        "Analitika të avancuara",
        "Zbritje 17% ndaj planit mujor",
        "Pa kosto shtesë",
      ],
    },
    {
      title: "Vjetor",
      price: "99.99",
      period: "vit",
      productId: PRODUCT_YEARLY,
      savings: "17%",
      features: [
        "Të gjitha veçoritë premium",
        "Mbështetje VIP",
        "Raporte të detajuara",
        "Kursen 2 muaj falas",
        "Garancia kthimi parash",
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
       

        {/* Main Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Zgjidh Planin Tënd
          </h1>
          <p className="text-gray-600 text-sm max-w-2xl mx-auto">
            Filloni me çmim të përballueshëm. Anullo në çdo kohë.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {plans.map((plan, idx) => (
            <PricingCard key={idx} {...plan} onSelect={handlePayment} />
          ))}
        </div>

        {/* Trust indicators */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-6 flex-wrap text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-green-500" />
              <span>Pagesa e Sigurt</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-green-500" />
              <span>Anullo Kur të Dëshirosh</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-green-500" />
              <span>Mbështetje 24/7</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Payments
