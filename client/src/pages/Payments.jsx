import React, { useEffect, useState } from 'react';
import { initializePaddle } from '@paddle/paddle-js'; 

// Të dhënat tuaja të konfirmuara LIVE
const VENDOR_ID = 257357; 

// TOKEN-i juaj i ri i Front-end-it
const CLIENT_SIDE_TOKEN = 'live_0ef1c5946ac5d34cf6db8d711cd'; 

// Përdorim ID-në e re të abonimit (më pak gjasa të ketë problem konfigurimi)
const LIVE_PRICE_ID = 'pri_01kaeqv42kdc02p39rzrb8gme3'; 

// Adresa juaj e vendosur në Netlify
const SUCCESS_DOMAIN = 'https://17061968.netlify.app'; 

// Email i detyrueshëm për LIVE
const CUSTOMER_EMAIL_TEST = 'ledion.678@gmail.com'; 

const Payments = () => {
    
  const [paddleInstance, setPaddleInstance] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const initialize = async () => {
      try {
        console.log("Inicializimi i Paddle LIVE me Client-Side Token...");
        
        // NDERRIMI KRYESOR: Përdorim tokenin në vend të VENDOR_ID
        const paddle = await initializePaddle({
          environment: 'production', 
          token: CLIENT_SIDE_TOKEN, 
          // Në Paddle Billing, 'vendor' shpesh nuk nevojitet kur përdoret 'token'
        });

        if (isMounted) {
          setPaddleInstance(paddle);
          setIsLoading(false);
          console.log("Paddle u inicializua me sukses. Gati për Checkout.");
        }

      } catch (error) {
        console.error("Gabim gjatë inicializimit të Paddle:", error);
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
        
        items: [
          {
            priceId: LIVE_PRICE_ID, 
            quantity: 1, 
          }
        ],

        customer: {
            email: CUSTOMER_EMAIL_TEST,
            // Shtojmë vendin për të shmangur gabimet e faturimit
            address: {
                country: 'XK', 
            }
        },

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

      {/* ... Mesazhet e Statusit ... */}
    </div>
  );
};

export default Payments;