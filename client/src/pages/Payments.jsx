import { Check, Lock, Calendar, Headphones, Star } from 'lucide-react'

// ID-të tuaja të çmimeve (Price IDs)
const MONTHLY_PRICE_ID = 'pri_01kac2nw5dah485s5mz9qcm5ev';
const THREE_MONTH_PRICE_ID = 'pri_03example3month'; 
const ANNUAL_PRICE_ID = 'pri_02exampleAnnual'; 

export default function PricingPage() {
  
  // Funksion i FIKSUAR - Përdor 'prices' për ridrejtimin e drejtpërdrejtë të V2
  const handleCheckout = (priceId) => {
    
    // URL-ja e saktë e Paddle Billing (V2) për çmime: përdor 'prices'
    const checkoutUrl = `https://checkout.paddle.com/prices/${priceId}`;
    
    // Hap dritaren e re, e cila do të tregojë checkout-in e Paddle
    window.open(checkoutUrl, '_blank');
    
    // Shënim: Pas pagesës, klienti ridrejtohet në URL-në e "Thank You Page" të konfiguruar në Paddle.
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

          <button
            onClick={() => handleCheckout(MONTHLY_PRICE_ID)} 
            className="w-full bg-slate-900 text-white py-2 rounded-lg font-semibold text-sm hover:bg-slate-800 transition"
          >
            Fillo Tani
          </button>
        </div>

        {/* 3-Month Plan (Most Popular) */}
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
              onClick={() => handleCheckout(THREE_MONTH_PRICE_ID)} 
              className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold text-sm hover:bg-purple-700 transition"
            >
              Zgjidh Planin
            </button>
          </div>
        </div>

        {/* Annual Plan */}
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
            onClick={() => handleCheckout(ANNUAL_PRICE_ID)} 
            className="w-full bg-slate-900 text-white py-2 rounded-lg font-semibold text-sm hover:bg-slate-800 transition"
          >
            Fillo Tani
          </button>
        </div>
      </div>
    </main>
  )
}