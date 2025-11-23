import React, { useEffect, useState } from 'react';

// Detajet e produkteve tuaja
const ITEMS_TO_PURCHASE = [
    {
      priceId: 'pri_01kaeqvvk2kdc02p39zrb8gne3', 
      quantity: 1
    }
];

// Detajet e klientit tuaj
const CUSTOMER_INFO = {
    email: "ledion.678@gmail.com", 
    address: {
      countryCode: "XK", 
      postalCode: "40000"
    }
};

// Tokeni juaj LIVE
const LIVE_TOKEN = "live_0ef1c5946ac5d34cf6db8d711cd"; 

// Adresa e vendosur për ridrejtim pas pagesës
const YOUR_DEPLOYED_URL = "https://17061968.netlify.app/billing";

// Sigurohu që skripta Paddle të jetë ngarkuar në index.html
const Payment = () => {
    const [paddleInitialized, setPaddleInitialized] = useState(false);
    const [loading, setLoading] = useState(true);

    // 1. Inicializimi i Paddle
    useEffect(() => {
        if (window.Paddle) {
            
            // Përdorim tokenin LIVE
            
            window.Paddle.Initialize({
                token: LIVE_TOKEN,
                eventCallback: function(data) {
                    console.log("Paddle Live Event Marrë:", data.type, data);
                    
                    if (data.type === 'checkout.completed') {
                        // Kjo ndodh kur pagesa përfundohet. 
                        // RIDREJTIMI DHE VERIFIKIMI BACKEND MBETEN KRITIK
                        alert(`Pagesa LIVE u përfundua! Porosia: ${data.data.id}. Përdoruesi do të ridrejtohet...`);
                    }
                    
                    if (data.type === 'checkout.error') {
                        // Trajtimi i sigurt i gabimeve (përdorimi i ?. për parandalimin e TypeError)
                        const errorMessage = data.data?.error || "Gabim i panjohur në checkout.";
                        console.error("Gabim në Checkout LIVE:", errorMessage, data);
                        alert(`Gabim gjatë pagesës: ${errorMessage}`);
                    }
                }
            });
            
            setPaddleInitialized(true);
            setLoading(false);
        } else {
            console.error("Gabim: Skripta Paddle nuk është ngarkuar. Kontrollo index.html!");
            setLoading(false);
        }
    }, []); 


    // 2. Funksioni për të hapur dritaren e pagesës
    const openCheckout = () => {
        if (!paddleInitialized) {
            alert("Paddle ende nuk është inicializuar.");
            return;
        }

        try {
            window.Paddle.Checkout.open({
                items: ITEMS_TO_PURCHASE,
                customer: CUSTOMER_INFO,
                settings: {
                    locale: 'en', 
                    displayMode: 'popup', 
                },
                // VLERAT E REJA PËR RIDREJTIMIN (SUCCESS/CANCEL URL)
                successUrl: `${YOUR_DEPLOYED_URL}?status=success&paddle_order_id={checkout.id}`, 
                cancelUrl: `${YOUR_DEPLOYED_URL}?status=cancelled`,
            });
        } catch (error) {
            console.error("Gabim gjatë hapjes së Checkout:", error);
            alert("Nuk arrita të hap dritaren e pagesës. Kontrollo konsolën.");
        }
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '50px' }}>Duke ngarkuar shërbimin e pagesës...</div>;
    }

    return (
        <div style={{ padding: '20px', textAlign: 'center', border: '1px solid #dc3545', borderRadius: '8px' }}>
            <h3>🔴 Pagesa me Paddle V2 (LIVE)</h3>
            <p style={{ color: '#6c757d', fontSize: '14px' }}>
                Redirect URL: <code style={{ color: '#dc3545' }}>{YOUR_DEPLOYED_URL}</code>
            </p>
            
            <button 
                onClick={openCheckout}
                disabled={!paddleInitialized}
                style={{
                    padding: '12px 25px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: paddleInitialized ? 'pointer' : 'not-allowed',
                    backgroundColor: paddleInitialized ? '#dc3545' : '#ccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    marginTop: '15px'
                }}
            >
                {paddleInitialized ? "Hap Checkout-in LIVE 💳" : "Paddle Duke Inicializuar..."}
            </button>
            <p style={{ marginTop: '10px', fontSize: '12px', color: '#dc3545' }}>
                Kjo do të rezultojë në një transaksion real (nëse llogaria juaj është zhbllokuar).
            </p>
        </div>
    );
};

export default Payment;