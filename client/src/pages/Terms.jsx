"use client"

import React from "react"

const Terms = () => {
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
          {/* Section 1 */}
          <section className="bg-gray-50 p-6 rounded-xl border-l-4 border-amber-600">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="bg-amber-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">
                1
              </span>
              Pranimi i Kushteve
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Duke përdorur platformën tonë <strong>gjuhagjermane.com</strong>, ju pranoni dhe pajtoheni me këto kushte
              përdorimi. Nëse nuk jeni dakord me to, ju lutemi mos përdorni shërbimin.
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-gray-50 p-6 rounded-xl border-l-4 border-blue-500">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">
                2
              </span>
              Përdorimi i Shërbimit
            </h2>
            <ul className="list-disc list-inside space-y-3 text-gray-700">
              <li>Përdoruesi merr akses në përmbajtje premium pas kryerjes së pagesës.</li>
              <li>Platforma është për përdorim personal dhe jo për rishitje apo shpërndarje.</li>
              <li>Përdoruesi është përgjegjës për sigurinë e llogarisë dhe fjalëkalimit të tij.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="bg-gray-50 p-6 rounded-xl border-l-4 border-green-500">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">
                3
              </span>
              Politika e Privatësisë
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Ne mbledhim vetëm informacionet e nevojshme për funksionimin e shërbimit (si emri, mbiemri, emaili dhe të
              dhënat e progresit). Këto të dhëna ruhen në mënyrë të sigurt dhe nuk ndahen me palë të treta pa pëlqimin
              tuaj, përveç rasteve kur kërkohet me ligj.
            </p>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-800 text-sm font-medium">
                🔒 Të dhënat tuaja janë të enkriptuara dhe mbrohen me standarde të larta sigurie.
              </p>
            </div>
          </section>

          {/* Section 4 */}
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
              çdo kërkesë për rimbursim.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Në përputhje me politikat e Paddle, ne ofrojmë një periudhë rimbursimi prej{" "}
              <strong>14 ditësh</strong> nga data e blerjes, me kusht që përdoruesi të mos ketë filluar përdorimin e
              materialeve dixhitale.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mt-3">
              <li>Pamundësi për të hyrë në materialet e blera për arsye teknike.</li>
              <li>Gabim teknik në pagesë ose tarifim i dyfishtë.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              Për çdo kërkesë rimbursimi, ju lutemi kontaktoni <strong>support@gjuhagjermane.com</strong> brenda 14
              ditëve nga data e pagesës.
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

          {/* Section 5 */}
          <section className="bg-gray-50 p-6 rounded-xl border-l-4 border-red-500">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">
                5
              </span>
              Ndryshimet në Kushte dhe Politika
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Ne rezervojmë të drejtën për të ndryshuar këto kushte ose politikat në çdo kohë. Ndryshimet do të
              publikohen në këtë faqe dhe do të hyjnë në fuqi menjëherë pas publikimit.
            </p>
          </section>

          {/* Section 6 */}
          <section className="bg-gray-50 p-6 rounded-xl border-l-4 border-cyan-500">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="bg-cyan-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">
                6
              </span>
              Kontakt
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Për çdo pyetje ose mbështetje, ju mund të na kontaktoni në{" "}
              <strong>support@gjuhagjermane.com</strong>.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-8 border-t-2 border-gray-200">
          <p className="text-center text-gray-600 leading-relaxed">
            Duke përdorur këtë faqe, ju pranoni këto kushte dhe politikat e përfshira më sipër.
          </p>
          <p className="text-center text-sm text-gray-500 mt-4">
            Data e përditësimit të fundit: {new Date().toLocaleDateString("sq-AL")}
          </p>
        </div>
      </div>
    </div>
  )
}

export default Terms
