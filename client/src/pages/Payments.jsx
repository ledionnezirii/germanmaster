import React, { useEffect, useState } from 'react';
import { initializePaddle } from '@paddle/paddle-js'; 

// Të dhënat tuaja të konfirmuara LIVE
const VENDOR_ID = 257357; 

// Përdorim ID-në e re të produktit të Abonimit për shkak se ishte e sapokrijuar
const LIVE_PRICE_ID = 'pri_01kaeqv42kdc02p39rzrb8gme3'; 

// Adresa juaj e vendosur në Netlify
const SUCCESS_DOMAIN = 'https://17061968.netlify.app'; 

// Zëvendësojeni me emailin e përdoruesit aktual të kyçur
const CUSTOMER_EMAIL_TEST = 'ledion.678@gmail.com'; 

const Payments = () => {
    
  const [paddleInstance, setPaddleInstance] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const initialize = async () => {
      try {
        const paddle = await initializePaddle({
          environment: 'production', 
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
        
        items: [
          {
            priceId: LIVE_PRICE_ID, 
            quantity: 1, 
          }
        ],

        // SHTESA KRYESORE: Këto janë fushat minimale që shpesh kërkohen nga Paddle Billing
        customer: {
            email: CUSTOMER_EMAIL_TEST,
            // Shtojmë vendin për të ndihmuar Paddle në llogaritjen e taksave
            address: {
                country: 'XK', // Përdor 'XK' (Kosova) ose 'AL' (Shqipëria)
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