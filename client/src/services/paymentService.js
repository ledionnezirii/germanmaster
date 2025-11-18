import api from "./api"

export const paymentService = {
  // Create checkout session
  createCheckout: (priceId) => api.post("/payments/create-checkout", { priceId }),

  // Get subscription status
  getSubscriptionStatus: () => api.get("/payments/subscription/status"),

  // Get user payment history
  getPaymentHistory: () => api.get("/payments/history"),

  // Cancel subscription
  cancelSubscription: (subscriptionId) =>
    api.post("/payments/subscription/cancel", { subscriptionId }),

  // Pause subscription
  pauseSubscription: (subscriptionId) =>
    api.post("/payments/subscription/pause", { subscriptionId }),

  // Resume subscription
  resumeSubscription: (subscriptionId) =>
    api.post("/payments/subscription/resume", { subscriptionId }),

  // Update payment method
  updatePaymentMethod: (subscriptionId, paymentMethodId) =>
    api.post("/payments/subscription/payment-method", {
      subscriptionId,
      paymentMethodId,
    }),
}

export default paymentService
