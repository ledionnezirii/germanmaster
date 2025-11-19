import React, { useEffect } from 'react';
import { initializePaddle } from '@paddle/paddle-js';

// ✅ Your confirmed LIVE details
const VENDOR_ID = 257357;
const CLIENT_SIDE_TOKEN = 'live_0ef1c5946ac5d34cf6db8d711cd';
const LIVE_PRICE_ID = 'pri_01kaeqv42kdc02p39rzrb8gme3';
const SUCCESS_DOMAIN = 'https://17061968.netlify.app';
const CUSTOMER_EMAIL = 'ledion.678@gmail.com';

function Payments() {
  useEffect(() => {
    // Initialize Paddle SDK
    initializePaddle({
      vendor: VENDOR_ID,
      token: CLIENT_SIDE_TOKEN,
    });
  }, []);

  const handleCheckout = () => {
    // Open Paddle checkout with required parameters
    window.Paddle.Checkout.open({
      items: [
        {
          priceId: LIVE_PRICE_ID,
          quantity: 1,
        },
      ],
      customer: {
        email: CUSTOMER_EMAIL,
      },
      successUrl: `${SUCCESS_DOMAIN}/success`,
      cancelUrl: `${SUCCESS_DOMAIN}/cancel`,
    });
  };

  return (
    <div>
      <h2>Subscribe to Premium (€1.00/month)</h2>
      <button onClick={handleCheckout}>Buy Now</button>
    </div>
  );
}

export default Payments;
