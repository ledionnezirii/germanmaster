import React, { useEffect, useState } from 'react';

// Fiksimi i Gabimit: Për shkak të pamundësisë së kompilatorit për të zgjidhur @paddle/paddle-js, 
// po përdorim funksionin për të ngarkuar skriptin Paddle.js direkt nga CDN.

// Funksioni për të ngarkuar skriptin e Paddle
const loadPaddleScript = (token, environment) => {
    return new Promise((resolve, reject) => {
        if (window.Paddle) {
            // Nëse tashmë është ngarkuar, thjesht inicializoje dhe zgjidhe
            window.Paddle.Setup({
                token: token,
                environment: environment,
            });
            return resolve(window.Paddle);
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
        script.onload = () => {
            if (window.Paddle) {
                // Konfigurimi i instancës pasi skripti të jetë ngarkuar
                window.Paddle.Setup({
                    token: token,
                    environment: environment,
                });
                resolve(window.Paddle);
            } else {
                reject(new Error("Skripti i Paddle u ngarkua, por objekti Paddle nuk u gjet."));
            }
        };
        script.onerror = (error) => reject(error);
        document.head.appendChild(script);
    });
};

// ✅ Të dhënat tuaja të konfirmuara LIVE të marra nga environment-i i Netlify
const LIVE_PRICE_ID = 'pri_01kaeqv42kdc02p39rzrb8gme3'; 
const SUCCESS_DOMAIN = 'https://17061968.netlify.app'; 
const CUSTOMER_EMAIL = 'ledion.678@gmail.com'; 
const CUSTOMER_COUNTRY = 'XK'; // Kodi i vendit (Kosova)

function Payments() {
    
    // Përdorim useState për të ruajtur instancën e Paddle (i cili tani është window.Paddle)
    const [paddleInstance, setPaddleInstance] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;
        
        const initialize = async () => {
            // Lexoni variablat e mjedisit të vendosura në Netlify
            const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || 'live_0ef1c5946ac5d34cf6db8d711cd';
            const environment = (process.env.NEXT_PUBLIC_PADDLE_ENV === 'production' ? 'production' : 'sandbox');

            if (!token) {
                setError("NEXT_PUBLIC_PADDLE_CLIENT_TOKEN nuk është vendosur!");
                setIsLoading(false);
                return;
            }

            try {
                // Inicializimi duke ngarkuar skriptin nga CDN
                const paddle = await loadPaddleScript(token, environment);

                if (isMounted) {
                    setPaddleInstance(paddle);
                    setIsLoading(false);
                }

            } catch (err) {
                const errorMessage = "Gabim gjatë inicializimit të Paddle. Kontrolloni tokenin dhe domenët e miratuar.";
                console.error(errorMessage, err);
                if (isMounted) {
                    setError(errorMessage);
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
        if (!paddleInstance || error) {
             console.error("Shërbimi i pagesave nuk është gati. Gabimi:", error);
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
            <h2 style={{ fontFamily: 'Inter, sans-serif' }}>Abonohu në Premium (€1.00/muaj)</h2>
            
            <button
                onClick={handleCheckout}
                disabled={isLoading || error} // Butoni është i fikur gjatë ngarkimit ose gabimit
                style={{
                    padding: '12px 24px',
                    fontSize: '18px',
                    fontWeight: '600',
                    backgroundColor: '#0070f3',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: (isLoading || error) ? 'not-allowed' : 'pointer',
                    opacity: (isLoading || error) ? 0.6 : 1,
                    boxShadow: '0 4px 15px rgba(0, 112, 243, 0.4)',
                    transition: 'all 0.3s ease-in-out'
                }}
            >
                {isLoading ? 'Duke u ngarkuar...' : (error ? 'Gabim: Shih Konsolën' : 'Bli Tani')}
            </button>
            {isLoading && <p style={{ color: '#555', marginTop: '10px' }}>Duke inicializuar shërbimin e pagesave...</p>}
            {error && <p style={{ color: 'red', marginTop: '10px', fontWeight: 'bold' }}>{error}</p>}
        </div>
    );
}

export default Payments;