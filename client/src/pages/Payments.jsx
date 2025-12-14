import React, { useState, useEffect } from "react";
import { paymentService } from "../services/api";
import { useAuth } from "../context/AuthContext"; // Adjust to your auth hook

// Price configurations - UPDATE THESE with your actual Paddle price IDs
const PRICE_CONFIGS = {
  TEST_PLAN: {
    id: "pri_test_01_admin_only",
    name: "Test Plan",
    price: "€1",
    period: "mujor",
    features: ["Test only"],
    adminOnly: true,
  },
  ONE_MONTH: {
    id: "pri_01_your_1_month_price_id",
    name: "1 Muaj",
    price: "€9.99",
    period: "mujor",
    features: ["Qasje e plotë", "Të gjitha nivelet", "Certifikata"],
  },
  THREE_MONTHS: {
    id: "pri_01_your_3_month_price_id",
    name: "3 Muaj",
    price: "€24.99",
    period: "çdo 3 muaj",
    popular: true,
    features: ["Qasje e plotë", "Të gjitha nivelet", "Certifikata", "Zbritje 17%"],
  },
  ONE_YEAR: {
    id: "pri_01_your_1_year_price_id",
    name: "1 Vit",
    price: "€79.99",
    period: "vjetor",
    features: ["Qasje e plotë", "Të gjitha nivelet", "Certifikata", "Zbritje 33%"],
  },
};

export default function Payment() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState(null);
  const [error, setError] = useState(null);

  // Check if user is admin
  const isAdmin = user?.email === "your-admin@email.com"; // UPDATE THIS

  useEffect(() => {
    loadSubscription();
    loadPaddleScript();
  }, []);

  const loadSubscription = async () => {
    try {
      const response = await paymentService.getUserSubscription(user._id);
      setSubscription(response.subscription);
    } catch (err) {
      console.error("Failed to load subscription:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadPaddleScript = () => {
    if (window.Paddle) return;

    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;
    script.onload = () => {
      window.Paddle.Environment.set("sandbox"); // Change to 'production' for live
      window.Paddle.Initialize({
        token: "YOUR_PADDLE_CLIENT_TOKEN", // UPDATE THIS
      });
    };
    document.head.appendChild(script);
  };

  const handleSubscribe = async (priceId) => {
    try {
      setProcessingPlan(priceId);
      setError(null);

      const response = await paymentService.createCheckoutSession(priceId);

      if (response.success && response.checkoutUrl) {
        // Open Paddle checkout
        if (window.Paddle) {
          window.Paddle.Checkout.open({
            transactionId: response.transactionId,
          });
        } else {
          // Fallback: redirect to checkout URL
          window.location.href = response.checkoutUrl;
        }
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError("Ndodhi një gabim. Ju lutem provoni përsëri.");
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm("Jeni të sigurt që dëshironi të anuloni abonimin?")) {
      return;
    }

    try {
      setLoading(true);
      await paymentService.cancelSubscription();
      alert("Abonimi do të anulohet në fund të periudhës së faturimit.");
      loadSubscription();
    } catch (err) {
      console.error("Cancel error:", err);
      setError("Nuk u arrit anulimi. Ju lutem provoni përsëri.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Duke ngarkuar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Zgjidhni Planin Tuaj</h1>
          <p className="text-xl text-gray-600">Filloni 2 ditë falas, pastaj vazhdoni me një plan</p>
        </div>

        {/* Current Subscription Status */}
        {subscription?.active && (
          <div className="max-w-2xl mx-auto mb-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-900">Abonimi Aktiv</h3>
                <p className="text-green-700">
                  Plan: {subscription.type} - Skadon më:{" "}
                  {new Date(subscription.expiresAt).toLocaleDateString("sq-AL")}
                </p>
              </div>
              {!subscription.cancelAtPeriodEnd && (
                <button
                  onClick={handleCancelSubscription}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Anulo
                </button>
              )}
              {subscription.cancelAtPeriodEnd && (
                <span className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">Do të anulohet</span>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {Object.entries(PRICE_CONFIGS).map(([key, plan]) => {
            // Hide test plan from non-admin users
            if (plan.adminOnly && !isAdmin) return null;

            return (
              <div
                key={key}
                className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-transform hover:scale-105 ${
                  plan.popular ? "ring-2 ring-blue-600" : ""
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
                    Më i Popullarizuar
                  </div>
                )}

                {/* Admin Badge */}
                {plan.adminOnly && (
                  <div className="absolute top-0 left-0 bg-purple-600 text-white px-4 py-1 text-sm font-semibold rounded-br-lg">
                    Test Only
                  </div>
                )}

                <div className="p-8">
                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>

                  {/* Price */}
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 ml-2">/ {plan.period}</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-gray-700">
                        <svg
                          className="w-5 h-5 text-green-500 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Subscribe Button */}
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={processingPlan === plan.id || subscription?.active}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition ${
                      plan.popular
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-900 text-white hover:bg-gray-800"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {processingPlan === plan.id ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Duke procesuar...
                      </span>
                    ) : subscription?.active ? (
                      "Aktiv"
                    ) : (
                      "Zgjidh Këtë Plan"
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trial Info */}
        <div className="mt-12 text-center">
          <p className="text-gray-600">
            ✨ Filloni me 2 ditë provë falas - mund të anuloni në çdo kohë
          </p>
        </div>
      </div>
    </div>
  );
}