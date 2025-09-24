import React, { createContext, useContext, useState } from "react"
import { paymentService } from "../services/api" // Your axios API wrapper

const PaymentContext = createContext()

export const PaymentProvider = ({ children }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Create payment and redirect user to payment gateway
  const createPayment = async ({ userId, subscriptionType }) => {
    setLoading(true)
    setError(null)
    try {
      const orderId = `order_${Date.now()}_${Math.floor(Math.random() * 10000)}`
      const response = await paymentService.createPayment({
        userId,
        subscriptionType,
        orderId,
      })
      const paymentUrl = response.data.url
      window.location.href = paymentUrl // Redirect user
    } catch (err) {
      setError(err.response?.data?.error || "Payment failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <PaymentContext.Provider value={{ loading, error, createPayment }}>
      {children}
    </PaymentContext.Provider>
  )
}

export const usePayment = () => useContext(PaymentContext)
