import React, { useState } from "react"
import { usePayment } from "../context/PaymentContext"

const Payments = ({ userId }) => {
  const { loading, error, createPayment } = usePayment()
  const [selectedPlan, setSelectedPlan] = useState("1_month")

  const handleSubmit = (e) => {
    e.preventDefault()
    createPayment({ userId, subscriptionType: selectedPlan })
  }

  return (
    <div>
      <h1>Subscribe to a plan</h1>

      <form onSubmit={handleSubmit}>
        <select value={selectedPlan} onChange={(e) => setSelectedPlan(e.target.value)}>
          <option value="1_month">1 Month</option>
          <option value="3_months">3 Months</option>
          <option value="1_year">1 Year</option>
        </select>

        <button type="submit" disabled={loading}>
          {loading ? "Processing..." : "Subscribe Now"}
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  )
}

export default Payments
