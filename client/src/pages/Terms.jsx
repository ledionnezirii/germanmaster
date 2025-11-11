"use client"

import React from "react"

const Terms = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-2xl p-8 md:p-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-gray-900 border-b-4 border-amber-600 inline-block pb-2">
            Kushtet e Përdorimit dhe Politika e Privatësisë
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
              Duke përdorur platformën tonë <strong>gjuhagjermane</strong>, ju pranoni dhe pajtoheni me këto kushte
              përdorimi. Nëse nuk jeni dakord me këto kushte, ju lutemi mos përdorni shërbimin tonë.
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
              <li className="flex items-start">
                <span className="text-amber-600 mr-2 mt-1">✓</span>
                <span>
                  Pagesa jep përdoruesit akses në përmbajtje premium dhe materiale mësimore ekskluzive.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-amber-600 mr-2 mt-1">✓</span>
                <span>
                  Përdorimi i platformës është vetëm për qëllime personale dhe jo për rishitje ose shpërndarje.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-amber-600 mr-2 mt-1">✓</span>
                <span>
                  Ju jeni përgjegjës për ruajtjen e sigurisë së llogarisë dhe fjalëkalimit tuaj.
                </span>
              </li>
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
              Ne e respektojmë privatësinë e përdoruesve tanë dhe mbledhim vetëm informacionet e nevojshme për
              funksionimin e platformës (si emri, mbiemri, emaili dhe të dhënat e progresit në mësim).
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Të gjitha të dhënat ruhen në mënyrë të sigurt dhe nuk ndahen me palë të treta pa pëlqimin tuaj, përveç
              rasteve kur kërkohet me ligj. Përdoruesi mund të kërkojë fshirjen e të dhënave të tij në çdo kohë duke
              kontaktuar mbështetjen tonë.
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
              Pagesat për shërbimet premium përpunohen në mënyrë të sigurt nga partnerët tanë të pagesave si Paddle. Ne
              nuk ruajmë informacione të kartave të kreditit.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Të gjitha pagesat janë **jo të rimbursueshme**. Ju lutemi sigurohuni që jeni të kënaqur me shërbimin para
              se të bëni pagesën. Në rast të ndonjë problemi teknik, ju mund të na kontaktoni në <strong>support@gjuhagjermane.com</strong>.
            </p>
          </section>


          {/* Section 5 */}
          <section className="bg-gray-50 p-6 rounded-xl border-l-4 border-red-500">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">
                5
              </span>
              Ndryshimet në Kushte dhe Privatësi
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Ne rezervojmë të drejtën për të ndryshuar këto kushte ose politikat tona të privatësisë në çdo kohë. Të
              gjitha ndryshimet do të publikohen në këtë faqe dhe do të hyjnë në fuqi menjëherë pas publikimit.
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
              Për çdo pyetje, kërkesë për mbështetje ose çështje lidhur me privatësinë, ju mund të na kontaktoni në:{" "}
              <strong>support@gjuhagjermane.com</strong>
            </p>
          </section>
        </div>

        {/* Footer Note */}
        <div className="mt-10 pt-8 border-t-2 border-gray-200">
          <p className="text-center text-gray-600 leading-relaxed">
            Duke përdorur faqen tonë dhe produktet, ju pranoni këto kushte dhe politikat që përmban kjo faqe.
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
