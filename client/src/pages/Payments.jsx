import React, { useEffect, useState } from 'react'; // Shtohet React dhe Hooks
import { Check, Lock, Calendar, Headphones, Star } from 'lucide-react'

// ID-të tuaja të çmimeve (Price IDs)
const MONTHLY_PRICE_ID = 'pri_01kac2nw5dah485s5mz9qcm5ev';

// ID-të e rreme janë të çaktivizuara (siç u diskutua)
// const THREE_MONTH_PRICE_ID = 'pri_01xyz123abc456def789ghi012jkl'; 
// const ANNUAL_PRICE_ID = 'pri_01mno345pqr678stu901vwx234yza'; 

export default function PricingPage() {
    const [isPaddleLoaded, setIsPaddleLoaded] = useState(false);
    
    // RREGULLIM: E bëmë PADDLE_SELLER_ID të jetë një numër (integer) duke hequr thonjëzat.
    const PADDLE_SELLER_ID = 257357; 

    useEffect(() => {
        // Funksioni për ngarkimin e skriptit të Paddle
        const loadPaddleScript = () => {
            if (window.Paddle) {
                // Skripti është ngarkuar, tani inicializoje
                window.Paddle.Setup({
                    seller: PADDLE_SELLER_ID,
                    eventCallback: function(data) {
                        // Këtu mund të vendosni logjikën për ngjarjet e checkout-it
                        console.log('Paddle Event:', data);
                    }
                });
                setIsPaddleLoaded(true);
            } else {
                console.error("Paddle.js nuk u ngarkua saktë.");
            }
        };

        // Krijimi i elementit të skriptit
        const script = document.createElement('script');
        script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
        script.async = true;
        script.onload = loadPaddleScript;
        
        // Shto skriptin në body
        document.body.appendChild(script);

        // Funksioni i pastrimit
        return () => {
            // Sigurohu që të heqësh skriptin kur komponenti çngarkohet
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []); 

  // Funksioni i rregulluar: Përdorimi i Paddle.js për të hapur overlay-in
  const handleCheckout = (priceId) => {
        if (!isPaddleLoaded) {
            // Ky mesazh tani parandalohet nga butoni i çaktivizuar
            console.warn('Paddle nuk është ngarkuar akoma. Provoni përsëri pas pak.'); 
            return;
        }

        // Përdorni funksionin e ndërfaqes (Overlay) të Paddle.js.
        // Shtohet 'method: popup' dhe 'customer.email' për të shmangur gabimet e CSP/400.
        window.Paddle.Checkout.open({
            items: [{ priceId: priceId }],
            // Detyro Paddle të hapë dritaren si pop-up, duke shmangur disa çështje iFrame/CSP
            method: 'popup', 
            // Siguron një email bazë, shpesh i nevojshëm për të shmangur gabimet 400 (Bad Request)
            customer: {
                email: 'test@example.com' 
            }
        });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-50 py-8 px-4">
      
      {/* Header Section */}
      <div className="max-w-4xl mx-auto text-center mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Zgjidh Planin Tënd</h1>
        <p className="text-sm text-slate-600">Fillo me një çmim të përballueshëm. Anuloje kur të duash.</p>
      </div>

      {/* Trust Indicators */}
      <div className="max-w-4xl mx-auto flex justify-center gap-6 mb-8 flex-wrap">
        <div className="flex items-center gap-2 text-slate-700 bg-white p-2 rounded-4xl">
          <Lock className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium">Pagesa të Sigurta</span>
        </div>
        <div className="flex items-center gap-2 text-slate-700 bg-white p-2 rounded-4xl">
          <Calendar className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium">Qasje e plotë</span>
        </div>
        <div className="flex items-center gap-2 text-slate-700 bg-white p-2 rounded-4xl">
          <Headphones className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium">Suport 24/7</span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Monthly Plan */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-slate-900 mb-3">Mujor</h3>
          <div className="mb-6">
            <span className="text-3xl font-bold text-slate-900">€1.00</span>
            <span className="text-sm text-slate-600">/muaj</span>
          </div>

          <ul className="space-y-3 mb-6">
            {[
              'Qasje e plotë në të gjitha funksionet',
              'Suport 24/7',
              'Përditësime të rregullta',
              'Përdorim i pakufizuar'
            ].map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-slate-700">{feature}</span>
              </li>
            ))}
          </ul>

            {/* BUTONI I PËRDITËSUAR ME NDALUESIN E NGARKIMIT */}
          <button
            onClick={() => handleCheckout(MONTHLY_PRICE_ID)} 
            disabled={!isPaddleLoaded}
            className={`w-full py-2 rounded-lg font-semibold text-sm transition ${
                isPaddleLoaded 
                    ? 'bg-slate-900 text-white hover:bg-slate-800' 
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed flex items-center justify-center'
            }`}
          >
            {isPaddleLoaded ? 'Fillo Tani (Testo këtë!)' : (
                <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Duke ngarkuar...</>
            )}
          </button>
        </div>

        {/* 3-Month Plan (Most Popular) - BUTTON I ÇAKTIVIZUAR PËR TESTIM */}
        <div className="relative">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
            <div className="bg-purple-600 text-white px-4 py-1.5 rounded-full font-semibold text-xs flex items-center gap-1.5">
              <Star className="w-3 h-3 fill-white" />
              Më i Popullarizuari
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-600 pt-10">
            <h3 className="text-lg font-bold text-slate-900 mb-1.5">3-Mujor</h3>
            <div className="mb-2">
              <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded">
                Kurseni 17%
              </span>
            </div>

            <div className="mb-6">
              <span className="text-3xl font-bold text-purple-600">€2.49</span>
              <span className="text-sm text-slate-600">/3 muaj</span>
            </div>

            <ul className="space-y-3 mb-6">
              {[
                'Të gjitha funksionet e planit mujor',
                'Suport prioritar',
                'Analitika të avancuara',
                '17% më lirë krahasuar me muajor',
                'Pa kosto shtesë'
              ].map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-slate-700">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              disabled 
              className="w-full bg-purple-300 text-white py-2 rounded-lg font-semibold text-sm cursor-not-allowed"
            >
              Së Shpejti...
            </button>
          </div>
        </div>

        {/* Annual Plan - BUTTON I ÇAKTIVIZUAR PËR TESTIM */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-slate-900 mb-3">Vjetor</h3>
          <div className="mb-2">
            <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded">
              Kurseni 25%
            </span>
          </div>

          <div className="mb-6">
            <span className="text-3xl font-bold text-slate-900">€9.99</span>
            <span className="text-sm text-slate-600">/vit</span>
            </div>

          <ul className="space-y-3 mb-6">
            {[
              'Të gjitha funksionet premium',
              'Suport VIP',
              'Raporte të detajuara',
              '2 muaj falas',
              'Garanci për kthimin e parave'
            ].map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-slate-700">{feature}</span>
              </li>
            ))}
          </ul>

          <button
            disabled 
            className="w-full bg-slate-300 text-white py-2 rounded-lg font-semibold text-sm cursor-not-allowed"
          >
            Së Shpejti...
          </button>
        </div>
      </div>
    </main>
  )
}