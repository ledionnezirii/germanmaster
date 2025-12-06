const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000"

export const paymentService = {
  createCheckoutSession: async (userId, priceId) => {
    const token = localStorage.getItem("authToken")
    const response = await fetch(`${API_BASE_URL}/api/payments/checkout/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, priceId }),
    })
    if (!response.ok) throw new Error("Failed to create checkout session")
    return response.json()
  },

  getUserSubscription: async (userId) => {
    const token = localStorage.getItem("authToken")
    const response = await fetch(`${API_BASE_URL}/api/payments/subscription/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (!response.ok) throw new Error("Failed to fetch subscription")
    return response.json()
  },

  getUserPayments: async (userId) => {
    const token = localStorage.getItem("authToken")
    const response = await fetch(`${API_BASE_URL}/api/payments/payments/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (!response.ok) throw new Error("Failed to fetch payments")
    return response.json()
  },

  cancelSubscription: async (userId) => {
    const token = localStorage.getItem("authToken")
    const response = await fetch(`${API_BASE_URL}/api/payments/subscription/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId }),
    })
    if (!response.ok) throw new Error("Failed to cancel subscription")
    return response.json()
  },
}
