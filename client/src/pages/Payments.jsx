import React, { useEffect, useState } from 'react';
import { initializePaddle } from '@paddle/paddle-js'; 

// Të dhënat tuaja të konfirmuara LIVE
const VENDOR_ID = 257357; 

// ID-ja e re e produktit që sapo krijuat
const LIVE_PRICE_ID = 'pri_01kaeqv42kdc02p39rzrb8gme3'; 

// Email-i i klientit duhet të jetë dinamik
const CUSTOMER_EMAIL_PLACEHOLDER = 'ledion.678@gmail.com'; 

const Payments = () => {
    
  const [paddleInstance, setPaddleInstance] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const initialize = async () => {
      try {
        console.log("Inicializimi i Paddle LIVE me VENDOR ID:", VENDOR_ID);
        const paddle = await initializePaddle({
          environment: 'production', 
          vendor: VENDOR_ID,
        });

        if (isMounted) {
          setPaddleInstance(paddle);
          setIsLoading(false);
          console.log("Paddle u inicializua me sukses.");
        }

      } catch (error) {
        console.error("Gabim fatal gjatë inicializimit të Paddle:", error);
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
      console.log(`Po tentohet hapja e checkout-it për Price ID: ${LIVE_PRICE_ID}`);
      
      paddleInstance.Checkout.open({
        
        // Përdorimi i Price ID-së së re LIVE në strukturën 'items'
        items: [
          {
            priceId: LIVE_PRICE_ID, 
            quantity: 1, 
          }
        ],

        customer: {
            email: CUSTOMER_EMAIL_PLACEHOLDER 
        },

        settings: {
            locale: 'sq', 
            currency: 'EUR',
            successUrl: window.location.origin + '/pagesa-sukses', 
        },

        eventCallback: (data) => {
            if (data.event === 'Checkout.Complete') {
                console.log("Pagesa u krye me sukses! Transaksioni:", data);
            } else if (data.event === 'Checkout.Error') {
                console.error("Gabim gjatë procesimit të pagesës:", data);
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