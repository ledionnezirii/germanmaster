"use client"

import { useState } from "react"

const NoAuth = () => {
  const [email, setEmail] = useState("")

  const handleGetStarted = (e) => {
    e.preventDefault()
    window.location.href = "/signup"
  }

  const handleSignIn = () => {
    window.location.href = "/signin"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 rounded-3xl">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-cyan-100 border-2 border-blue-300 text-blue-700 px-6 py-3 rounded-full text-sm font-semibold mb-8 shadow-lg">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Filloni udhëtimin tuaj gjuhësor sot
          </div>

          {/* Main Heading */}
          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight tracking-tight">
            Mësoni Gjermanisht
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 bg-clip-text text-transparent">
              në mënyrë inteligjente
            </span>
          </h1>

          <p className="text-xl text-gray-700 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
            Mësoni gjermanisht me mësime interaktive, praktika në kohë reale dhe rrugë mësimore të personalizuara të
            dizajnuara vetëm për ju.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <button
              onClick={handleGetStarted}
              className="group relative inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 shadow-xl"
            >
              Filloni falas
              <svg
                className="w-6 h-6 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <button
              onClick={handleSignIn}
              className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 px-10 py-5 rounded-2xl font-bold text-lg border-3 border-gray-300 hover:bg-gray-50 hover:border-blue-400 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Identifikohu
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center bg-white/60 backdrop-blur-sm rounded-2xl p-6 border-2 border-blue-200 shadow-lg">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                50K+
              </div>
              <div className="text-sm text-gray-700 font-semibold">Nxënës aktivë</div>
            </div>
            <div className="text-center bg-white/60 backdrop-blur-sm rounded-2xl p-6 border-2 border-cyan-200 shadow-lg">
              <div className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-2">
                1M+
              </div>
              <div className="text-sm text-gray-700 font-semibold">Mësime të përfunduara</div>
            </div>
            <div className="text-center bg-white/60 backdrop-blur-sm rounded-2xl p-6 border-2 border-blue-200 shadow-lg">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                95%
              </div>
              <div className="text-sm text-gray-700 font-semibold">Shkalla e suksesit</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-6 py-20 bg-gradient-to-b from-white/80 to-blue-50/80 backdrop-blur-sm rounded-3xl border-2 border-blue-200 shadow-2xl mb-12">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">Gjithçka që ju nevojitet për sukses</h2>
          <p className="text-gray-700 text-xl font-medium">Veçori të fuqishme për të përshpejtuar mësimin tuaj</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon={
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            }
            title="Mësime interaktive"
            description="Mësoni me mësime të shkurtra që përshtaten me ritmin dhe stilin tuaj të të mësuarit."
            color="from-blue-600 via-cyan-600 to-blue-700"
          />
          <FeatureCard
            icon={
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
              </svg>
            }
            title="Praktikë audio"
            description="Përmirësoni të kuptuarit tuaj të dëgjimit me audio nga folës amtarë dhe udhëzime për shqiptimin."
            color="from-emerald-600 via-teal-600 to-cyan-700"
          />
          <FeatureCard
            icon={
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                />
              </svg>
            }
            title="Mjete përkthimi"
            description="Praktikoni përkthime në kohë reale me reagim të menjëhershëm dhe korrigjime."
            color="from-amber-600 via-orange-600 to-red-600"
          />
          <FeatureCard
            icon={
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
            }
            title="Gjurmoni përparimin"
            description="Fitoni XP, ngrihuni në klasifikime dhe zhbllokoni arritje ndërsa mësoni."
            color="from-indigo-600 via-blue-600 to-cyan-600"
          />
        </div>
      </div>

      {/* Benefits Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-5xl font-bold text-gray-900 mb-8 leading-tight">Pse të zgjidhni platformën tonë?</h2>
            <div className="space-y-6">
              <BenefitItem
                title="Mësim i personalizuar"
                description="Mësime të drejtuara nga AI që përshtaten me nivelin tuaj dhe shpejtësinë e të mësuarit."
              />
              <BenefitItem
                title="Folës amtarë"
                description="Mësoni shqiptimin e saktë dhe kontekstin kulturor nga burime autentike."
              />
              <BenefitItem
                title="Rezultate të dëshmuara"
                description="95% e përdoruesve arrijnë aftësi bisedore brenda 6 muajsh."
              />
              <BenefitItem
                title="Mësoni kudo"
                description="Hyni në mësimet tuaja në çdo pajisje, online ose offline."
              />
            </div>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-br from-blue-100 via-cyan-50 to-blue-100 rounded-3xl p-10 border-4 border-blue-300 shadow-2xl">
              <div className="bg-white rounded-2xl p-8 mb-6 shadow-lg border-2 border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-700 text-sm font-semibold">Seria ditore</span>
                  <svg className="w-8 h-8 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-3">
                  47 ditë
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                  <div
                    className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 h-3 rounded-full shadow-md transition-all duration-300"
                    style={{ width: "78%" }}
                  ></div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <StatBox
                  label="Niveli"
                  value="12"
                  icon={
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  }
                />
                <StatBox
                  label="XP"
                  value="2.840"
                  icon={
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                      <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                      <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                    </svg>
                  }
                />
                <StatBox
                  label="Fjalë"
                  value="380"
                  icon={
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                    </svg>
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 rounded-3xl p-16 text-center border-4 border-blue-400 shadow-2xl">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/20 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">Gati për të filluar?</h2>
            <p className="text-blue-50 text-xl mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
              Bashkohuni me mijëra nxënës që tashmë janë në rrugën drejt rrjedhshmërisë.
            </p>
            <button
              onClick={handleGetStarted}
              className="inline-flex items-center gap-3 bg-white text-blue-600 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-blue-50 transition-all duration-300 hover:scale-105 shadow-2xl"
            >
              Krijoni llogari falas
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const FeatureCard = ({ icon, title, description, color }) => (
  <div className="group bg-white rounded-2xl p-8 border-3 border-blue-200 hover:border-blue-400 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-2xl">
    <div
      className={`bg-gradient-to-r ${color} w-14 h-14 rounded-2xl flex items-center justify-center mb-5 text-white group-hover:scale-110 transition-transform duration-300 shadow-lg`}
    >
      {icon}
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-700 leading-relaxed font-medium">{description}</p>
  </div>
)

const BenefitItem = ({ title, description }) => (
  <div className="flex gap-5">
    <div className="flex-shrink-0">
      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 flex items-center justify-center shadow-lg">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    </div>
    <div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-700 font-medium leading-relaxed">{description}</p>
    </div>
  </div>
)

const StatBox = ({ label, value, icon }) => (
  <div className="bg-white rounded-2xl p-5 text-center shadow-lg border-2 border-blue-200 hover:scale-105 transition-transform duration-300">
    <div className="text-blue-600 mb-2 flex justify-center">{icon}</div>
    <div className="text-2xl font-bold text-gray-900 mb-2">{value}</div>
    <div className="text-xs text-gray-700 font-semibold">{label}</div>
  </div>
)

export default NoAuth
