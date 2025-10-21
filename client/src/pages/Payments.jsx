import React from "react";
import { Check, Zap, Star } from "lucide-react";

// Paddle publishable key
const PADDLE_VENDOR_ID = 123456;
const PRODUCT_MONTHLY = 111111;
const PRODUCT_QUARTERLY = 222222;
const PRODUCT_YEARLY = 333333;

// Inicilizojmë Paddle (script)
if (typeof window !== "undefined" && !window.Paddle) {
  const script = document.createElement("script");
  script.src = "https://cdn.paddle.com/paddle/paddle.js";
  script.onload = () => {
    window.Paddle.Setup({ vendor: PADDLE_VENDOR_ID });
  };
  document.body.appendChild(script);
}

const PricingCard = ({ 
  title, 
  price, 
  period, 
  productId, 
  onSelect, 
  isPopular, 
  savings,
  features 
}) => (
  <div className={`relative group ${isPopular ? 'md:-mt-4 md:scale-105' : ''}`}>
    {isPopular && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1 shadow-lg">
          <Star className="w-3 h-3 fill-current" />
          Më i Preferuari
        </div>
      </div>
    )}
    
    <div className={`relative h-full bg-white rounded-2xl overflow-hidden transition-all duration-300 ${
      isPopular 
        ? 'shadow-2xl border-2 border-violet-200' 
        : 'shadow-lg hover:shadow-xl border border-gray-100'
    } group-hover:-translate-y-1`}>
      
      {/* Gradient overlay */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
        isPopular 
          ? 'bg-gradient-to-br from-violet-50 to-indigo-50' 
          : 'bg-gradient-to-br from-gray-50 to-white'
      }`} />
      
      <div className="relative p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          {savings && (
            <div className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
              Kursen {savings}
            </div>
          )}
        </div>

        {/* Price */}
        <div className="text-center mb-8">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-5xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              ${price}
            </span>
            <span className="text-gray-500 text-lg">/{period}</span>
          </div>
        </div>

        {/* Features */}
        <ul className="space-y-3 mb-8">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">
                <Check className="w-5 h-5 text-green-500" />
              </div>
              <span className="text-gray-600 text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <button
          onClick={() => onSelect(productId)}
          className={`w-full py-3.5 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
            isPopular
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          <Zap className="w-4 h-4" />
          Fillo Tani
        </button>
      </div>
    </div>
  </div>
);

const Payments = () => {
  const handlePayment = (productId) => {
    if (!window.Paddle) return alert("Paddle nuk u ngarkua ende");

    window.Paddle.Checkout.open({
      product: productId,
      email: "",
      successCallback: (data) => {
        console.log("Pagesa u krye me sukses:", data);
        alert("Faleminderit për pagesën!");
      },
      closeCallback: () => {
        console.log("Dritarja e pagesës u mbyll");
      },
    });
  };

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
        "Pa kufizime përdorimi"
      ]
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
        "Pa kosto shtesë"
      ]
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
        "Garanci kthimi parash"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Zgjidh Planin Tënd
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Filloni me çmim të përballueshëm. Anullo në çdo kohë.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, idx) => (
            <PricingCard
              key={idx}
              {...plan}
              onSelect={handlePayment}
            />
          ))}
        </div>

        {/* Trust indicators */}
        <div className="mt-16 text-center">
          <div className="flex items-center justify-center gap-8 flex-wrap text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Pagesa e Sigurt</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Anullo Kur të Dëshirosh</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Mbështetje 24/7</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payments;