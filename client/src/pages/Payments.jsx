import React, { useEffect, useState } from 'react';

// Your Paddle Classic Vendor ID (numeric)
const VENDOR_ID = 257357;

// Subscription product details for Paddle Classic
const PRODUCT_ID = 123456; // Replace with your actual Paddle classic product numeric ID

// Your app URLs and customer info
const SUCCESS_DOMAIN = 'https://17061968.netlify.app';
const CUSTOMER_EMAIL = 'ledion.678@gmail.com';
const CUSTOMER_COUNTRY = 'XK';

const loadPaddleScript = () =>
  new Promise((resolve, reject) => {
    if (window.Paddle) {
      window.Paddle.Setup({
        vendor: VENDOR_ID,
      });
      resolve(window.Paddle);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/paddle.js';
    script.onload = () => {
      if (window.Paddle) {
        window.Paddle.Setup({
          vendor: VENDOR_ID,
        });
        resolve(window.Paddle);
      } else {
        reject(new Error('Paddle script loaded but Paddle object not found.'));
      }
    };
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });

function Payments() {
  const [paddleInstance, setPaddleInstance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      try {
        const paddle = await loadPaddleScript();
        if (isMounted) {
          setPaddleInstance(paddle);
          setIsLoading(false);
        }
      } catch (err) {
        const errorMessage =
          'Gabim gjatë inicializimit të Paddle. Kontrolloni Vendor ID dhe domenët e miratuar.';
        console.error(errorMessage, err);
        if (isMounted) {
          setError(errorMessage);
          setIsLoading(false);
        }
      }
    }

    initialize();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCheckout = () => {
    if (!paddleInstance || error) {
      console.error('Shërbimi i pagesave nuk është gati. Gabimi:', error);
      return;
    }

    paddleInstance.Checkout.open({
      product: PRODUCT_ID,
      quantity: 1,
      email: CUSTOMER_EMAIL,
      successCallback: () => {
        window.location.href = `${SUCCESS_DOMAIN}/pagesa-sukses`;
      },
      closeCallback: () => {
        window.location.href = `${SUCCESS_DOMAIN}/pagesa-anuluar`;
      },
      locale: 'sq', // Albanian
      currency: 'EUR',
      country: CUSTOMER_COUNTRY,
    });
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2 style={{ fontFamily: 'Inter, sans-serif' }}>Abonohu në Premium (€1.00/muaj)</h2>
      <button
        onClick={handleCheckout}
        disabled={isLoading || error}
        style={{
          padding: '12px 24px',
          fontSize: '18px',
          fontWeight: '600',
          backgroundColor: '#0070f3',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: isLoading || error ? 'not-allowed' : 'pointer',
          opacity: isLoading || error ? 0.6 : 1,
          boxShadow: '0 4px 15px rgba(0, 112, 243, 0.4)',
          transition: 'all 0.3s ease-in-out',
        }}
      >
        {isLoading ? 'Duke u ngarkuar...' : error ? 'Gabim: Shih Konsolën' : 'Bli Tani'}
      </button>
      {isLoading && <p style={{ color: '#555', marginTop: '10px' }}>Duke inicializuar shërbimin e pagesave...</p>}
      {error && <p style={{ color: 'red', marginTop: '10px', fontWeight: 'bold' }}>{error}</p>}
    </div>
  );
}

export default Payments;
