import React, { useEffect, useState } from 'react';
import { initializePaddle } from '@paddle/paddle-js'; 

// Të dhënat tuaja të konfirmuara LIVE
const VENDOR_ID = 257357; 

// Përdorim ID-në origjinale të produktit 'premium' (EUR 1.00/muaj)
const LIVE_PRICE_ID = 'pri_01kaeqvvk2kdc02p39zrb8gne3'; 
// NËSE DONI TË PËRDORNI TË REJËN: const LIVE_PRICE_ID = 'pri_01kaeqv42kdc02p39rzrb8gme3';

// Zëvendësojeni me emailin e përdoruesit të kyçur në aplikacionin tuaj
const CUSTOMER_EMAIL_TEST = 'ledion.678@gmail.com'; 
const SUCCESS_DOMAIN = 'https://17061968.netlify.app'; // Domeni juaj i miratuar

const Payments = () => {
    
  const [paddleInstance, setPaddleInstance] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const initialize = async () => {
      try {
        console.log("Inicializimi i Paddle LIVE...");
        const paddle = await initializePaddle({
          environment: 'production', // Mjedisi LIVE
          vendor: VENDOR_ID,
        });

        if (isMounted) {
          setPaddleInstance(paddle);
          setIsLoading(false);
        }

      } catch (error) {
        console.error("Gabim gjatë inicializimit të Paddle. Kontrolloni konsolën.", error);
        if (isMounted) {
            setIsLoading(false);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, []); 

  const handleCheckout = () => {
    if (paddleInstance) {
      
      paddleInstance.Checkout.open({
        
        // Përdorimi i strukturës 'items'
        items: [
          {
            priceId: LIVE_PRICE_ID, 
            quantity: 1, 
          }
        ],

        customer: {
            email: CUSTOMER_EMAIL_TEST 
        },

        // Shtojmë URL-në e suksesit duke përdorur domenin e miratuar
        settings: {
            locale: 'sq', 
            currency: 'EUR',
            successUrl: SUCCESS_DOMAIN + '/pagesa-sukses', 
        },

        eventCallback: (data) => {
            if (data.event === 'Checkout.Complete') {
                console.log("Pagesa LIVE u krye me sukses! Të dhënat:", data);
            }
        }
      });
    } else {
      alert("Shërbimi i pagesave ende nuk është gati.");
    }
  };

  return (
    <div>
      <h2>Abonohu në Premium</h2>
      
      <button 
        onClick={handleCheckout} 
        disabled={isLoading || !paddleInstance}
        style={{ padding: '10px 20px', fontSize: '16px' }}
      >
        {isLoading ? 'Duke u ngarkuar...' : 'Bli Tani (€1.00/muaj)'}
      </button>

      {isLoading && 
        <p style={{color: 'orange'}}>Duke ngarkuar shërbimin e pagesave...</p>}
      {!isLoading && !paddleInstance &&
        <p style={{color: 'red'}}>Gabim: Shërbimi i pagesave dështoi të ngarkohej. Kontrolloni konsolën.</p>}
    </div>
  );
};

export default Payments;