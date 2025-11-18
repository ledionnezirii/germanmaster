import React, { useEffect, useState } from 'react';
import { Check, Lock, Calendar, Headphones, Star } from 'lucide-react'

// ID-të tuaja të çmimeve (Price IDs) - Kjo është ID e Sandbox
const MONTHLY_PRICE_ID = 'pri_01kac2nw5dah485s5mz9qcm5ev';

export default function PricingPage() {
    // Shteti për të ndjekur nëse Paddle është ngarkuar, inicializuar dhe nëse ka gabime
    const [isPaddleLoaded, setIsPaddleLoaded] = useState(false);
    const [paddleError, setPaddleError] = useState(false);
    
    // ID-ja e Shitësit Paddle (Sandbox)
    const PADDLE_SELLER_ID = '257357'; 

    useEffect(() => {
        const maxRetries = 10; // Rritja e tentativave për shkak të gabimeve të kohës
        let timeoutId;

        // Funksioni i vetë-ekzekutuar dhe rekursiv për të pritur derisa Paddle të jetë gati
        const checkAndInitialize = (currentAttempt = 0) => {
            // Kontrollo nëse objekti global 'Paddle' ekziston dhe nëse funksioni 'initialize' është në dispozicion.
            if (window.Paddle && typeof window.Paddle.initialize === 'function') {
                
                // Inicializo Paddle.js vetëm nëse nuk është inicializuar
                if (!isPaddleLoaded) { 
                    try {
                        window.Paddle.initialize({
                            seller: PADDLE_SELLER_ID,
                            environment: 'sandbox', // Përdorim sandbox për qëllime testimi
                            eventCallback: function(data) {
                                console.log('Paddle Event:', data);
                            }
                        });
                        setIsPaddleLoaded(true);
                        setPaddleError(false);
                        console.log("Paddle.js u inicializua me sukses.");

                    } catch (error) {
                        console.error("Paddle initialization error:", error);
                        setPaddleError(true);
                    }
                }
            } else if (currentAttempt < maxRetries) { 
                // Përdorim vonesë në rritje (exponential backoff) me jitter (vonesë e rastësishme)
                const delay = Math.pow(2, currentAttempt) * 100 + Math.random() * 100;
                console.log(`Paddle not ready, retrying in ${delay.toFixed(0)}ms (attempt ${currentAttempt + 1}/${maxRetries})`);
                
                // Rifillo kontrollin pas vonesës me një tentativë më shumë
                timeoutId = setTimeout(() => checkAndInitialize(currentAttempt + 1), delay);
            } else {
                console.error("Paddle.js nuk u ngarkua saktë ose inicializimi dështoi pas tentativave maksimale.");
                setPaddleError(true);
            }
        };

        // Kontrollon dhe ngarkon skriptin
        let script = document.getElementById('paddle-script');

        if (!script) {
            script = document.createElement('script');
            script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
            script.id = 'paddle-script';
            script.async = true; // Sigurohu që të jetë async

            script.onload = () => {
                console.log('Paddle script loaded from CDN. Starting initialization checks...');
                // Jepi pak kohë (100ms), pastaj fillo kontrollin rekursiv
                timeoutId = setTimeout(() => checkAndInitialize(0), 100); 
            };

            script.onerror = () => {
                console.error("Failed to load Paddle.js from CDN");
                setPaddleError(true);
            };
            
            document.head.appendChild(script); // Shto skriptin në head
        } else {
             // Nëse skripti ekziston, fillo kontrollin menjëherë
            checkAndInitialize(0);
        }

        // Funksioni i pastrimit për të anuluar timeout-et
        return () => {
            clearTimeout(timeoutId);
        };
    }, [isPaddleLoaded, paddleError]); 

    // Funksioni për të hapur dritaren e checkout-it
    const handleCheckout = (priceId) => {
        if (!isPaddleLoaded) {
            console.warn('Paddle nuk është ngarkuar akoma. Ju lutem prisni ose rifreskoni.');
            return;
        }

        // Thirrja e Paddle.Checkout.open me ID-në e çmimit
        window.Paddle.Checkout.open({
            items: [{ priceId: priceId }],
            method: 'popup', 
            // Përdorim një email testimi sipas rekomandimeve të Paddle
            customer: {
                email: 'test@example.com' 
            }
        });
    };

    return (
        <main className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-50 py-12 px-4 font-sans">
            
            {/* Header Section */}
            <div className="max-w-4xl mx-auto text-center mb-10">
                <h1 className="text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">Zgjidh Planin Tënd</h1>
                <p className="text-lg text-slate-600">Fillo me një çmim të përballueshëm. Anuloje kur të duash. Nuk ka kontrata.</p>
                
                {/* Mesazhi i gabimit Paddle.js */}
                {paddleError && (
                    <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl text-base font-medium">
                        <span className="font-extrabold">Gabim:</span> Shërbimi i Pagesave (Paddle.js) nuk u ngarkua dot. Ju lutemi provoni të **rifreskoni faqen** për të provuar përsëri.
                    </div>
                )}
            </div>

            {/* Trust Indicators */}
            <div className="max-w-4xl mx-auto flex justify-center gap-6 mb-12 flex-wrap">
                <div className="flex items-center gap-2 text-slate-700 bg-white p-3 rounded-full shadow-lg">
                    <Lock className="w-5 h-5 text-green-600" />
                    <span className="text-base font-medium">Pagesa 100% të Sigurta</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 bg-white p-3 rounded-full shadow-lg">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <span className="text-base font-medium">Anulim në çdo kohë</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 bg-white p-3 rounded-full shadow-lg">
                    <Headphones className="w-5 h-5 text-green-600" />
                    <span className="text-base font-medium">Suport 24/7</span>
                </div>
            </div>

            {/* Pricing Cards Container */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Monthly Plan (E vetmja me checkout aktiv) */}
                <div className="bg-white rounded-2xl p-8 shadow-2xl hover:shadow-3xl transition duration-500 border border-gray-100">
                    <h3 className="text-2xl font-bold text-slate-900 mb-4 border-b pb-3">Mujor</h3>
                    <div className="mb-8">
                        <span className="text-5xl font-extrabold text-slate-900">€1.00</span>
                        <span className="text-xl text-slate-600">/muaj</span>
                    </div>

                    <ul className="space-y-4 mb-8">
                        {[
                            'Qasje e plotë në të gjitha funksionet',
                            'Suport 24/7 përmes emailit',
                            'Përditësime të rregullta të përmbajtjes',
                            'Përdorim i pakufizuar i pyetjeve'
                        ].map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                                <Check className="w-6 h-6 mt-0.5 text-blue-600 flex-shrink-0" />
                                <span className="text-base text-slate-700">{feature}</span>
                            </li>
                        ))}
                    </ul>

                    {/* BUTONI ME NDALUESIN DHE ANIMACIONIN E NGARKIMIT */}
                    <button
                        onClick={() => handleCheckout(MONTHLY_PRICE_ID)} 
                        disabled={!isPaddleLoaded || paddleError}
                        className={`w-full py-4 rounded-xl font-extrabold text-lg transition duration-300 shadow-xl ${
                            isPaddleLoaded && !paddleError
                                ? 'bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-[1.01]' 
                                : 'bg-slate-300 text-slate-500 cursor-not-allowed flex items-center justify-center'
                        }`}
                    >
                        {paddleError ? 'Gabim Ngarkimi' : isPaddleLoaded ? 'Fillo Tani (Testo këtë!)' : (
                            <span className='flex items-center'>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> 
                                Duke ngarkuar...
                            </span>
                        )}
                    </button>
                    <p className='text-xs text-center text-slate-500 mt-3'>Paddle.js është i nevojshëm për pagesë.</p>
                </div>

                {/* 3-Month Plan (Most Popular) - BUTTON I ÇAKTIVIZUAR */}
                <div className="relative transform scale-[1.05] z-10">
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <div className="bg-purple-600 text-white px-5 py-2 rounded-full font-extrabold text-sm flex items-center gap-2 shadow-xl border-2 border-white">
                            <Star className="w-4 h-4 fill-white" />
                            Më i Popullarizuari
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-8 shadow-2xl border-4 border-purple-600 pt-12 hover:shadow-3xl transition duration-500">
                        <h3 className="text-2xl font-bold text-slate-900 mb-2 border-b pb-3">3-Mujor</h3>
                        <div className="mb-3">
                            <span className="inline-block bg-green-100 text-green-700 text-sm font-semibold px-3 py-1 rounded-full">
                                Kurseni 17%
                            </span>
                        </div>

                        <div className="mb-8">
                            <span className="text-5xl font-extrabold text-purple-600">€2.49</span>
                            <span className="text-xl text-slate-600">/3 muaj</span>
                        </div>

                        <ul className="space-y-4 mb-8">
                            {[
                                'Të gjitha funksionet e planit mujor',
                                'Suport prioritar përmes chat-it',
                                'Analitika të avancuara të performancës',
                                '17% më lirë krahasuar me muajor',
                                'Pa kosto shtesë, vetëm kostoja e pagesës',
                                'Integrim i Retain (vetëm për llogaritë LIVE)'
                            ].map((feature, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                    <Check className="w-6 h-6 mt-0.5 text-blue-600 flex-shrink-0" />
                                    <span className="text-base text-slate-700">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            disabled 
                            className="w-full bg-purple-400 text-white py-4 rounded-xl font-extrabold text-lg cursor-not-allowed shadow-md opacity-70"
                        >
                            Së Shpejti (Premium)
                        </button>
                    </div>
                </div>

                {/* Annual Plan - BUTTON I ÇAKTIVIZUAR */}
                <div className="bg-white rounded-2xl p-8 shadow-2xl hover:shadow-3xl transition duration-500 border border-gray-100">
                    <h3 className="text-2xl font-bold text-slate-900 mb-2 border-b pb-3">Vjetor</h3>
                    <div className="mb-3">
                        <span className="inline-block bg-green-100 text-green-700 text-sm font-semibold px-3 py-1 rounded-full">
                            Kurseni 25%
                        </span>
                    </div>

                    <div className="mb-8">
                        <span className="text-5xl font-extrabold text-slate-900">€9.99</span>
                        <span className="text-xl text-slate-600">/vit</span>
                    </div>

                    <ul className="space-y-4 mb-8">
                        {[
                            'Të gjitha funksionet premium',
                            'Suport VIP me video thirrje',
                            'Raporte të detajuara mujore',
                            '2 muaj FALAS krahasuar me Mujor',
                            'Garanci për kthimin e parave 30-ditore'
                        ].map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                                <Check className="w-6 h-6 mt-0.5 text-blue-600 flex-shrink-0" />
                                <span className="text-base text-slate-700">{feature}</span>
                            </li>
                        ))}
                    </ul>

                    <button
                        disabled 
                        className="w-full bg-slate-300 text-white py-4 rounded-xl font-extrabold text-lg cursor-not-allowed shadow-md opacity-70"
                    >
                        Së Shpejti (Premium)
                    </button>
                </div>
            </div>
            
            <div className="max-w-4xl mx-auto text-center mt-12 pt-8 border-t border-gray-300">
                <p className="text-sm text-slate-500">
                    <strong className='font-semibold text-slate-700'>Shënim:</strong> Për momentin, vetëm plani mujor (€1.00) është i lidhur me API-në Paddle për qëllime testimi. Planet e tjera janë çaktivizuar.
                </p>
            </div>
        </main>
    )
}