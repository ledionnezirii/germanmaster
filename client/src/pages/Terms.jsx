"use client"

import React from "react"

const Terms = () => {
  // Përdorim një datë statike për të ruajtur konsistencën e dokumentit ligjor.
  const lastUpdatedDate = "21 Janar 2026"

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-2xl p-8 md:p-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-gray-900 border-b-4 border-amber-600 inline-block pb-2">
            Kushtet e Përdorimit dhe Politikat e Privatësisë & Rimbursimit
          </h1>
          <p className="text-gray-600 text-lg mt-4">
            Lexoni me kujdes kushtet, politikat e privatësisë dhe rimbursimit përpara se të përdorni platformën tonë.
          </p>
        </div>

        <div className="space-y-8">
          {/* Seksioni 1: Pranimi i Kushteve - I pandryshuar */}
          <section className="bg-gray-50 p-6 rounded-xl border-l-4 border-amber-600">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="bg-amber-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">
                1
              </span>
              Pranimi i Kushteve
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Duke përdorur platformën tonë <strong>gjuhagjermane.com</strong>, ju pranoni dhe pajtoheni me këto kushte
              përdorimi. Këto kushte përbëjnë një marrëveshje ligjore detyruese midis jush si përdorues dhe
              platformës. Nëse nuk jeni dakord me to, ju lutemi mos përdorni shërbimin.
            </p>
          </section>

          {/* Seksioni 2: Përdorimi i Shërbimit dhe Pronësia Intelektuale - I Zgjeruar */}
          <section className="bg-gray-50 p-6 rounded-xl border-l-4 border-blue-500">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">
                2
              </span>
              Përdorimi i Shërbimit dhe Pronësia Intelektuale
            </h2>
            <ul className="list-disc list-inside space-y-3 text-gray-700">
              <li>Përdoruesi merr akses në përmbajtje premium pas kryerjes së pagesës. Aksesi është i kufizuar dhe personal.</li>
              <li>Platforma është për përdorim personal dhe jo për rishitje, riprodhim, apo shpërndarje. Çdo shpërndarje e materialeve (video, tekste, ushtrime) ndalohet rreptësisht dhe shkel të drejtat e autorit.</li>
              <li>Përdoruesi është përgjegjës për sigurinë e llogarisë dhe fjalëkalimit të tij. Ndarja e të dhënave të hyrjes me palë të treta çon në pezullimin e menjëhershëm të llogarisë pa të drejtë rimbursimi.</li>
              <li>Të gjitha përmbajtjet, dizajni, logoja dhe softueri janë pronë ekskluzive e <strong>gjuhagjermane.com</strong> dhe mbrohen nga ligjet ndërkombëtare të të drejtës së autorit.</li>
            </ul>
          </section>

          {/* Seksioni 3: Politika e Privatësisë - I Zgjeruar */}
          <section className="bg-gray-50 p-6 rounded-xl border-l-4 border-green-500">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">
                3
              </span>
              Politika e Privatësisë
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Ne mbledhim vetëm informacionet e nevojshme për funksionimin e shërbimit dhe përmirësimin e eksperiencës tuaj. Këto përfshijnë emrin, mbiemrin, emailin, të dhënat e progresit në kurse dhe informacione teknike (si adresa IP dhe lloji i shfletuesit). Këto të dhëna ruhen në mënyrë të sigurt dhe nuk ndahen me palë të treta pa pëlqimin tuaj, përveç rasteve kur kërkohet me ligj.
            </p>

            <h3 className="text-xl font-semibold text-gray-700 mb-2 mt-4">Përdorimi i Cookies</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Platforma jonë përdor "cookies" për të ruajtur seancat e përdoruesve, për të analizuar trafikun dhe për të personalizuar përmbajtjen. Duke vazhduar përdorimin e shërbimit, ju pranoni përdorimin e cookies sipas kësaj politike. Ju mund t'i çaktivizoni cookies përmes cilësimeve të shfletuesit tuaj, por kjo mund të ndikojë në funksionalitetin e platformës.
            </p>

            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-800 text-sm font-medium">
                🔒 Të dhënat tuaja janë të enkriptuara dhe mbrohen me standarde të larta sigurie (si SSL/TLS) për të siguruar konfidencialitetin.
              </p>
            </div>
          </section>

          {/* Seksioni 4: Pagesat dhe Rimbursimet - I Zgjeruar */}
          <section className="bg-gray-50 p-6 rounded-xl border-l-4 border-purple-500">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">
                4
              </span>
              Pagesat dhe Rimbursimet
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Të gjitha pagesat përpunohen në mënyrë të sigurt nga <strong>Paddle.com Market Ltd</strong>, e cila vepron
              si shitësi zyrtar (“Merchant of Record”). Paddle është përgjegjëse për përpunimin e pagesave, faturimin dhe
              çdo kërkesë për rimbursim. Asnjë informacion i kartës së kreditit nuk ruhet në serverat tanë.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Në përputhje me politikat e Paddle dhe natyrën e produkteve tona dixhitale, ne ofrojmë një periudhë rimbursimi prej{" "}
              <strong>14 ditësh</strong> nga data e blerjes. Rimbursimi nuk aplikohet nëse përdoruesi ka shkarkuar, parë një sasi të konsiderueshme të materialit, ose ka përfunduar modulet e para të kursit. Kërkesat e rimbursimit shqyrtohen rast pas rasti.
            </p>
            <h3 className="text-xl font-semibold text-gray-700 mb-2 mt-4">Rastet e rimbursimit:</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mt-3">
              <li>Pamundësi absolute për të hyrë në materialet e blera për arsye teknike, që nuk mund të zgjidhen nga mbështetja teknike.</li>
              <li>Gabim teknik në pagesë ose tarifim i dyfishtë.</li>
              <li>Produkti nuk përputhet me përshkrimin bazë të dhënë në faqen e shitjes.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              Për çdo kërkesë rimbursimi, ju lutemi kontaktoni <strong>support@gjuhagjermane.com</strong> brenda 14
              ditëve nga data e pagesës, duke përfshirë numrin e faturës.
            </p>
            <p className="text-gray-700 mt-3">
              Për më shumë informacion mbi politikat e Paddle, vizitoni{" "}
              <a
                href="https://www.paddle.com/legal"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-600 hover:text-amber-700 underline"
              >
                https://www.paddle.com/legal
              </a>
              .
            </p>
          </section>

{/* Seksioni 5: Politika e Abonimit dhe Pagesave - Seksion i RI */}
          <section className="bg-gray-50 p-6 rounded-xl border-l-4 border-orange-500">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">
                5
              </span>
              Politika e Abonimit dhe Pagesave
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Të gjitha abonimet janë <strong>jo të rimbursueshme</strong>. Përdoruesit janë përgjegjës për të menaxhuar dhe anuluar abonimet para rinovimit.
            </p>
            <div className="bg-orange-50 p-4 rounded-lg mb-4">
              <p className="text-orange-800 text-sm font-medium">
                ⚠️ Në rast të një <strong>dispute ose chargeback</strong>, aksesimi në platformë mund të <strong>ndalohet menjëherë</strong> dhe llogaria mund të <strong>pezullohet ose bllokohet për përdorim të mëtejshëm</strong>.
              </p>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Ju lutemi, kontrolloni datën e rinovimit dhe anuloni abonimin nëse nuk dëshironi ta vazhdoni.
            </p>
          </section>

          {/* Seksioni 6: Kufizimi i Përgjegjësisë */}
          <section className="bg-gray-50 p-6 rounded-xl border-l-4 border-yellow-600">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="bg-yellow-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">
                6
              </span>
              Kufizimi i Përgjegjësisë
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Platforma dhe përmbajtja e saj ofrohen "siç janë" pa asnjë garanci, të shprehur apo të nënkuptuar. <strong>gjuhagjermane.com</strong> nuk mban përgjegjësi për ndërprerjet e shërbimit, gabimet, dëmtimet e drejtpërdrejta, të tërthorta apo aksidentale që vijnë nga përdorimi apo pamundësia për të përdorur platformën, qoftë edhe nëse është njoftuar paraprakisht për mundësinë e këtyre dëmeve. Përgjegjësia maksimale, në çdo rast, do të jetë e kufizuar në shumën e paguar nga përdoruesi për shërbimin.
            </p>
          </section>

{/* Seksioni 7: Ndryshimet në Kushte dhe Politika */}
          <section className="bg-gray-50 p-6 rounded-xl border-l-4 border-red-500">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">
                7
              </span>
              Ndryshimet në Kushte dhe Politika
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Ne rezervojmë të drejtën për të ndryshuar këto kushte ose politikat në çdo kohë. Ndryshimet do të
              publikohen në këtë faqe dhe do të hyjnë në fuqi menjëherë pas publikimit. Përdorimi i vazhdueshëm i shërbimit pas publikimit të ndryshimeve nënkupton pranimin e tyre nga ana juaj.
            </p>
          </section>

{/* Seksioni 8: Kontakt */}
          <section className="bg-gray-50 p-6 rounded-xl border-l-4 border-cyan-500">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="bg-cyan-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">
                8
              </span>
              Kontakt
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Për çdo pyetje, koment, ose kërkesë për mbështetje në lidhje me këto Kushte Përdorimi ose Politikat, ju mund të na kontaktoni drejtpërdrejt në adresën e mëposhtme:{" "}
              <strong>info@gjuhagjermane.com</strong>.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-8 border-t-2 border-gray-200">
          <p className="text-center text-gray-600 leading-relaxed">
            Duke përdorur këtë faqe, ju pranoni këto kushte dhe politikat e përfshira më sipër.
          </p>
          <p className="text-center text-sm text-gray-500 mt-4">
            Data e përditësimit të fundit: <strong>{lastUpdatedDate}</strong>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Terms
