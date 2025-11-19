import React, { useEffect, useState } from 'react';
// Importi i saktë
import { initializePaddle } from '@paddle/paddle-js'; 

// Të dhënat tuaja të konfirmuara LIVE
const VENDOR_ID = 257357; 
const PRICE_ID = 'pri_01kac2nw5dah48555mzd9cgm5ev'; // €1.00/muaj

// Zëvendësoje këtë me emailin e përdoruesit të kyçur në sistemin tënd
const CUSTOMER_EMAIL_PLACEHOLDER = 'ledion.678@gmail.com'; 

const Payments = () => {
    
  const [paddleInstance, setPaddleInstance] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const initialize = async () => {
      try {
        const paddle = await initializePaddle({
          environment: 'production', // DUHET TË JETË 'production' PËR LIVE ID-TË
          vendor: VENDOR_ID,
        });

        if (isMounted) {
          setPaddleInstance(paddle);
          setIsLoading(false);
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
      paddleInstance.Checkout.open({
        
        // ZGJIDHJA E GABIMIT 400: Përdorimi i strukturës 'items'
        items: [
          {
            priceId: PRICE_ID, // ID-ja e çmimit tuaj
            quantity: 1, 
          }
        ],

        // Parametrat e domosdoshëm për LIVE
        customer: {
            email: CUSTOMER_EMAIL_PLACEHOLDER 
        },

        settings: {
            locale: 'sq', 
            currency: 'EUR'
        },

        eventCallback: (data) => {
            if (data.event === 'Checkout.Complete') {
                console.log("Pagesa LIVE u krye me sukses! Të dhënat:", data);
            }
        }
      });
    } else {
      alert("Shërbimi i pagesave ende nuk është gati. Ju lutemi provoni përsëri.");
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