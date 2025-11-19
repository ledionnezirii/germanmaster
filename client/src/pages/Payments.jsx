import React, { useEffect, useState } from 'react';
import { initializePaddle } from '@paddle/paddle-js';

// ✅ Të dhënat tuaja të konfirmuara LIVE
// Për Paddle Billing (v2), preferohet përdorimi VETËM i tokenit për Front-end
const CLIENT_SIDE_TOKEN = 'live_0ef1c5946ac5d34cf6db8d711cd'; 
const LIVE_PRICE_ID = 'pri_01kaeqv42kdc02p39rzrb8gme3'; // ID e Abonimit (€1.00/muaj)
const SUCCESS_DOMAIN = 'https://17061968.netlify.app'; 
const CUSTOMER_EMAIL = 'ledion.678@gmail.com'; //
const CUSTOMER_COUNTRY = 'XK'; // I detyrueshëm për transaksionet LIVE


function Payments() {
    
    // Përdorim useState për të ruajtur instancën e Paddle dhe statusin e ngarkimit
    const [paddleInstance, setPaddleInstance] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        
        const initialize = async () => {
            try {
                // 🛑 1. Përdorim 'await' për të pritur inicializimin
                // 🛑 2. Përdorim vetëm 'token' dhe 'environment: production'
                const paddle = await initializePaddle({
                    environment: 'production', 
                    token: CLIENT_SIDE_TOKEN,
                });

                if (isMounted) {
                    setPaddleInstance(paddle);
                    setIsLoading(false);
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
        // Kontrolloni nëse instanca Paddle është ngarkuar
        if (!paddleInstance) {
            alert("Shërbimi i pagesave ende nuk është gati. Ju lutem provoni përsëri.");
            return;
        }

        // ✅ Thirrja e Checkout me të gjithë parametrat e detyrueshëm
        paddleInstance.Checkout.open({
            items: [
                {
                    priceId: LIVE_PRICE_ID,
                    quantity: 1,
                },
            ],
            
            // Detyrimi i të dhënave të klientit për të shmangur gabimet 400/403
            customer: {
                email: CUSTOMER_EMAIL,
                address: {
                    country: CUSTOMER_COUNTRY, 
                }
            },
            
            // Konfigurimet shtesë
            settings: {
                locale: 'sq',
                currency: 'EUR',
                successUrl: `${SUCCESS_DOMAIN}/pagesa-sukses`,
                cancelUrl: `${SUCCESS_DOMAIN}/pagesa-anuluar`,
            },
            
            eventCallback: (data) => {
                if (data.event === 'Checkout.Complete') {
                    console.log("Pagesa LIVE u krye me sukses!", data);
                }
            }
        });
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h2>Abonohu në Premium (€1.00/muaj)</h2>
            
            <button
                onClick={handleCheckout}
                disabled={isLoading} // Butoni është i fikur gjatë ngarkimit
                style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    backgroundColor: '#0070f3',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.7 : 1,
                }}
            >
                {isLoading ? 'Duke u ngarkuar...' : 'Bli Tani'}
            </button>
            {isLoading && <p>Duke inicializuar shërbimin e pagesave...</p>}
        </div>
    );
}

export default Payments;