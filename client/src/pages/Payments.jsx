// src/components/Payments.jsx
import React from "react";

// Paddle publishable key
const PADDLE_VENDOR_ID = 123456; // vendos Vendor ID tënd
const PRODUCT_MONTHLY = 111111;  // vendos Product ID për 1 muaj
const PRODUCT_QUARTERLY = 222222; // Product ID për 3 muaj
const PRODUCT_YEARLY = 333333; // Product ID për 1 vit

// Inicilizojmë Paddle (script)
if (typeof window !== "undefined" && !window.Paddle) {
  const script = document.createElement("script");
  script.src = "https://cdn.paddle.com/paddle/paddle.js";
  script.onload = () => {
    window.Paddle.Setup({ vendor: PADDLE_VENDOR_ID });
  };
  document.body.appendChild(script);
}

const Payments = () => {
  const handlePayment = (productId) => {
    if (!window.Paddle) return alert("Paddle nuk u ngarkua ende");

    window.Paddle.Checkout.open({
      product: productId,
      email: "", // mund të vendosësh email-in e përdoruesit nëse e ke
      successCallback: (data) => {
        console.log("Pagesa u krye me sukses:", data);
        alert("Faleminderit për pagesën!");
      },
      closeCallback: () => {
        console.log("Dritarja e pagesës u mbyll");
      },
    });
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-md rounded-lg text-center">
      <h2 className="text-2xl font-bold mb-6">Zgjidh planin tënd</h2>
      <div className="flex flex-col gap-4">
        <button
          onClick={() => handlePayment(PRODUCT_MONTHLY)}
          className="p-4 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          $9.99 / month
        </button>
        <button
          onClick={() => handlePayment(PRODUCT_QUARTERLY)}
          className="p-4 bg-green-500 text-white rounded hover:bg-green-600"
        >
          $24.99 / 3 months
        </button>
        <button
          onClick={() => handlePayment(PRODUCT_YEARLY)}
          className="p-4 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          $99.99 / year
        </button>
      </div>
    </div>
  );
};

export default Payments;
