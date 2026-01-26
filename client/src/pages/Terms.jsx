"use client"

import React from "react"
import { useEffect } from "react"

const Terms = () => {
  const lastUpdatedDate = "26 Janar 2026"

  // SEO Meta Tags
  useEffect(() => {
    // Set page title
    document.title = "Kushtet e Përdorimit dhe Politika e Privatësisë | gjuhagjermane.com"
    
    // Meta description
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute("content", "Lexoni kushtet e përdorimit, politikën e privatësisë dhe politikën e rimbursimit për gjuhagjermane.com. Mësoni gjuhën gjermane online me kurse profesionale.")
    } else {
      const meta = document.createElement('meta')
      meta.name = "description"
      meta.content = "Lexoni kushtet e përdorimit, politikën e privatësisë dhe politikën e rimbursimit për gjuhagjermane.com. Mësoni gjuhën gjermane online me kurse profesionale."
      document.head.appendChild(meta)
    }

    // Keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]')
    if (metaKeywords) {
      metaKeywords.setAttribute("content", "kushtet e përdorimit, politika e privatësisë, gjuha gjermane, kurse online, mësim gjermanisht, rimbursim, aboniment")
    } else {
      const meta = document.createElement('meta')
      meta.name = "keywords"
      meta.content = "kushtet e përdorimit, politika e privatësisë, gjuha gjermane, kurse online, mësim gjermanisht, rimbursim, aboniment"
      document.head.appendChild(meta)
    }

    // Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle) {
      ogTitle.setAttribute("content", "Kushtet e Përdorimit dhe Politika e Privatësisë | gjuhagjermane.com")
    } else {
      const meta = document.createElement('meta')
      meta.setAttribute("property", "og:title")
      meta.content = "Kushtet e Përdorimit dhe Politika e Privatësisë | gjuhagjermane.com"
      document.head.appendChild(meta)
    }

    const ogDescription = document.querySelector('meta[property="og:description"]')
    if (ogDescription) {
      ogDescription.setAttribute("content", "Kushtet tona të përdorimit, politika e privatësisë dhe politika e rimbursimit për platformën gjuhagjermane.com")
    } else {
      const meta = document.createElement('meta')
      meta.setAttribute("property", "og:description")
      meta.content = "Kushtet tona të përdorimit, politika e privatësisë dhe politika e rimbursimit për platformën gjuhagjermane.com"
      document.head.appendChild(meta)
    }

    // Language
    document.documentElement.lang = "sq"

    // Canonical URL
    const canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      const link = document.createElement('link')
      link.rel = "canonical"
      link.href = "https://gjuhagjermane.com/terms"
      document.head.appendChild(link)
    }
  }, [])

  // JSON-LD Schema for Breadcrumbs and Organization
  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://gjuhagjermane.com/terms",
        "url": "https://gjuhagjermane.com/terms",
        "name": "Kushtet e Përdorimit dhe Politika e Privatësisë",
        "description": "Kushtet e përdorimit, politika e privatësisë dhe politika e rimbursimit për gjuhagjermane.com",
        "inLanguage": "sq",
        "dateModified": "2026-01-21",
        "publisher": {
          "@type": "Organization",
          "name": "gjuhagjermane.com",
          "url": "https://gjuhagjermane.com"
        }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Ballina",
            "item": "https://gjuhagjermane.com"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Kushtet e Përdorimit",
            "item": "https://gjuhagjermane.com/terms"
          }
        ]
      }
    ]
  }

  return (
    <>
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <article className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
        <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-2xl p-8 md:p-12">
          {/* Header with proper heading hierarchy */}
          <header className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-gray-900 border-b-4 border-amber-600 inline-block pb-2">
              Kushtet e Përdorimit dhe Politikat e Privatësisë & Rimbursimit
            </h1>
            <p className="text-gray-600 text-lg mt-4">
              Lexoni me kujdes kushtet, politikat e privatësisë dhe rimbursimit përpara se të përdorni platformën tonë.
            </p>
          </header>

          <div className="space-y-8">
            {/* Section 1 */}
            <section className="bg-gray-50 p-6 rounded-xl border-l-4 border-amber-600" aria-labelledby="section1">
              <h2 id="section1" className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="bg-amber-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm" aria-hidden="true">
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

            {/* Section 2 */}
            <section className="bg-gray-50 p-6 rounded-xl border-l-4 border-blue-500" aria-labelledby="section2">
              <h2 id="section2" className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm" aria-hidden="true">
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

            {/* Section 3 */}
            <section className="bg-gray-50 p-6 rounded-xl border-l-4 border-green-500" aria-labelledby="section3">
              <h2 id="section3" className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm" aria-hidden="true">
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

            {/* Section 4 */}
            <section className="bg-gray-50 p-6 rounded-xl border-l-4 border-purple-500" aria-labelledby="section4">
              <h2 id="section4" className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm" aria-hidden="true">
                  4
                </span>
                Pagesat dhe Rimbursimet
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Të gjitha pagesat përpunohen në mënyrë të sigurt nga <strong>Paddle.com Market Ltd</strong>, e cila vepron
                si shitësi zyrtar ("Merchant of Record"). Paddle është përgjegjëse për përpunimin e pagesave, faturimin dhe
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

            {/* Section 5 */}
            <section className="bg-gray-50 p-6 rounded-xl border-l-4 border-orange-500" aria-labelledby="section5">
              <h2 id="section5" className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm" aria-hidden="true">
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

            {/* Section 6 */}
            <section className="bg-gray-50 p-6 rounded-xl border-l-4 border-yellow-600" aria-labelledby="section6">
              <h2 id="section6" className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="bg-yellow-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm" aria-hidden="true">
                  6
                </span>
                Kufizimi i Përgjegjësisë
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Platforma dhe përmbajtja e saj ofrohen "siç janë" pa asnjë garanci, të shprehur apo të nënkuptuar. <strong>gjuhagjermane.com</strong> nuk mban përgjegjësi për ndërprerjet e shërbimit, gabimet, dëmtimet e drejtpërdrejta, të tërthorta apo aksidentale që vijnë nga përdorimi apo pamundësia për të përdorur platformën, qoftë edhe nëse është njoftuar paraprakisht për mundësinë e këtyre dëmeve. Përgjegjësia maksimale, në çdo rast, do të jetë e kufizuar në shumën e paguar nga përdoruesi për shërbimin.
              </p>
            </section>

            {/* Section 7 */}
            <section className="bg-gray-50 p-6 rounded-xl border-l-4 border-red-500" aria-labelledby="section7">
              <h2 id="section7" className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm" aria-hidden="true">
                  7
                </span>
                Ndryshimet në Kushte dhe Politika
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Ne rezervojmë të drejtën për të ndryshuar këto kushte ose politikat në çdo kohë. Ndryshimet do të
                publikohen në këtë faqe dhe do të hyjnë në fuqi menjëherë pas publikimit. Përdorimi i vazhdueshëm i shërbimit pas publikimit të ndryshimeve nënkupton pranimin e tyre nga ana juaj.
              </p>
            </section>

            {/* Section 8 */}
            <section className="bg-gray-50 p-6 rounded-xl border-l-4 border-cyan-500" aria-labelledby="section8">
              <h2 id="section8" className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="bg-cyan-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm" aria-hidden="true">
                  8
                </span>
                Kontakt
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Për çdo pyetje, koment, ose kërkesë për mbështetje në lidhje me këto Kushte Përdorimi ose Politikat, ju mund të na kontaktoni drejtpërdrejt në adresën e mëposhtme:{" "}
                <br />
                <strong>Email: info@gjuhagjermane.com</strong>
                <br />
                <strong>Instagram: gjuhagjermanee</strong>
              </p>
            </section>

            {/* Section 9 */}
            <section className="bg-gray-50 p-6 rounded-xl border-l-4 border-cyan-500" aria-labelledby="section9">
              <h2 id="section9" className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="bg-cyan-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm" aria-hidden="true">
                  9
                </span>
                Gjendja e Platformës
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Faqja është në zhvillim të vazhdueshëm dhe, si çdo platformë digjitale, mund
                të ketë gabime teknike (bugs), ndërprerje ose probleme funksionale. Nëse
                hasni ndonjë problem ose paqartësi, ju lutemi të na kontaktoni që ta
                përmirësojmë shërbimin.
              </p>
            </section>

            {/* Section 10 */}
            <section className="bg-gray-50 p-6 rounded-xl border-l-4 border-cyan-500" aria-labelledby="section10">
              <h2 id="section10" className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="bg-cyan-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm" aria-hidden="true">
                  10
                </span>
                Përgjegjësia dhe Saktësia e Përmbajtjes
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Përmbajtja e ofruar në këtë faqe interneti është krijuar për qëllime
                edukative dhe informuese. Ne përpiqemi që të gjitha informacionet, tekstet
                dhe ushtrimet të jenë sa më të sakta dhe të përditësuara, megjithatë nuk
                garantojmë që çdo informacion është 100% i saktë ose pa gabime.
                <br /><br />
                Disa të dhëna ose materiale mund të jenë marrë nga burime të ndryshme dhe,
                pavarësisht përpjekjeve tona, mund të përmbajnë gabime gramatikore,
                përkthimore ose teknike. Ne nuk mbajmë përgjegjësi për ndonjë pasojë që mund
                të vijë nga përdorimi i këtij informacioni.
              </p>
            </section>
          </div>

          {/* Footer */}
          <footer className="mt-10 pt-8 border-t-2 border-gray-200">
            <p className="text-center text-gray-600 leading-relaxed">
              Duke përdorur këtë faqe, ju pranoni këto kushte dhe politikat e përfshira më sipër.
            </p>
            <p className="text-center text-sm text-gray-500 mt-4">
              Data e përditësimit të fundit: <time dateTime="2026-01-21">{lastUpdatedDate}</time>
            </p>
          </footer>
        </div>
      </article>
    </>
  )
}

export default Terms