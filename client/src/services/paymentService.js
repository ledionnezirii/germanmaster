import api from "./api"

export const paymentService = {
  // KORRIGJIM: Ndryshuar rruga për të përputhur me "/checkout/create"
  createCheckout: (priceId) => api.post("/payments/checkout/create", { priceId }),

  // KORRIGJIM: Shtuar userId në URL, duke u përputhur me rrugën e Backend-it
  getSubscriptionStatus: (userId) => api.get(`/payments/subscription/${userId}`),

  // KORRIGJIM: Shtuar userId në URL, duke u përputhur me rrugën e Backend-it
  getPaymentHistory: (userId) => api.get(`/payments/${userId}`),

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