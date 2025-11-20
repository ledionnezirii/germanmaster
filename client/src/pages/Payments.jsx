import React, { useEffect, useState } from 'react';

// Detajet e Konfigurimit të Abonimit
const PADDLE_CLIENT_TOKEN = 'live_0ef1c5946ac5d34cf6db8d711cd'; 
const SUBSCRIPTION_PRICE_ID = 'pri_01kaeqvvk2kdc02p39zrb8gne3'; 
const SUCCESS_URL = 'https://17061968.netlify.app/billing'; 

// Variabël globale për të shmangur ngarkimin e dyfishtë (i dobishëm për Strict Mode)
let paddleScriptLoaded = false;

const Payment = () => {
  const [isPaddleReady, setIsPaddleReady] = useState(false);

  // Funksioni për të hapur Paddle Checkout
  const handleCheckout = () => {
    if (window.Paddle && window.Paddle.Checkout) {
      window.Paddle.Checkout.open({
        items: [{ priceId: SUBSCRIPTION_PRICE_ID, quantity: 1 }],
        settings: { successUrl: SUCCESS_URL },
      });
    } else {
      alert('Shërbimi i Pagesës nuk është gati. Ju lutem provoni përsëri.');
    }
  };

  useEffect(() => {
    // 1. Defino Funksionin e Inicializimit
    const initializePaddle = async () => {
      // Sigurohu që setup të jetë i disponueshëm
      if (window.Paddle && typeof window.Paddle.setup === 'function') {
          try {
              await window.Paddle.setup({ token: PADDLE_CLIENT_TOKEN });
              console.log('✅ Paddle SDK V2 u inicializua me sukses.');
              setIsPaddleReady(true); // Aktivizo butonin
          } catch (error) {
              console.error('❌ Gabim gjatë inicializimit të Paddle (setup dështoi):', error);
          }
      } else {
          console.error('⚠️ Paddle setup funksioni nuk u gjet pas eventit ready.');
      }
    };

    // 2. Dëgjo Eventin paddle.ready
    // Kjo është zgjidhja më e sigurt kundër Strict Mode dhe vonesave të ngarkimit.
    window.addEventListener('paddle.ready', initializePaddle);

    // 3. Ngarko Skriptin (Vetëm një herë)
    if (!paddleScriptLoaded) {
      if (!document.querySelector('script[src="https://cdn.paddle.com/paddle/v2/paddle.js"]')) {
        const script = document.createElement('script');
        script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
        document.head.appendChild(script);
        paddleScriptLoaded = true;
      }
    }

    // 4. Pastrimi i Event Listener-it
    return () => {
      window.removeEventListener('paddle.ready', initializePaddle);
    };
  }, []); // useEffect ekzekutohet vetëm një herë pas montimit

  // ... (Pjesa e renderimit)
  return (
    <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      <h1>Abonimi i Ri Test LIVE</h1>
      <p style={{ color: '#555' }}>**Qasje e plotë** në të gjitha funksionalitetet e platformës.</p>
      
      <div style={{ margin: '20px 0', padding: '15px', border: '1px solid #ddd', borderRadius: '8px', display: 'inline-block' }}>
        <h3>€1.00 / Muaj</h3>
        <p style={{ margin: '5px 0', fontSize: '14px', color: '#777' }}>
          ID e Çmimit: `{SUBSCRIPTION_PRICE_ID}`
        </p>
      </div>
      
      <button 
        onClick={handleCheckout} 
        disabled={!isPaddleReady}
        style={{
          display: 'block',
          margin: '20px auto',
          padding: '12px 25px',
          fontSize: '18px',
          fontWeight: 'bold',
          cursor: isPaddleReady ? 'pointer' : 'not-allowed',
          backgroundColor: isPaddleReady ? '#0070f3' : '#cccccc',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          transition: 'background-color 0.3s'
        }}
      >
        {isPaddleReady ? 'Abonohu Tani' : 'Duke ngarkuar shërbimin e pagesës...'}
      </button>

      {!isPaddleReady && (
        <p style={{ marginTop: '15px', color: '#cc0000', fontSize: '14px' }}>
          Duke ngarkuar shërbimin e pagesës Paddle...
        </p>
      )}
    </div>
  );
};

export default Payment;