import { useLanguage } from "../context/LanguageContext"

const LANGUAGES = [
  { code: "de", flag: "🇩🇪", label: "Deutsch" },
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "fr", flag: "🇫🇷", label: "Français" },
  { code: "tr", flag: "🇹🇷", label: "Türkçe" },
  { code: "it", flag: "🇮🇹", label: "Italiano" },
]

const LanguageSwitch = () => {
  const { language, switchLanguage } = useLanguage()

  return (
    <div className="flex items-center gap-1 bg-white border-2 border-emerald-200 rounded-full px-2 py-1 shadow-sm">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => switchLanguage(lang.code)}
          title={lang.label}
          className={`flex items-center justify-center w-8 h-8 rounded-full text-lg transition-all duration-200 ${
            language === lang.code
              ? "bg-emerald-500 shadow-md scale-105"
              : "hover:bg-gray-100"
          }`}
        >
          {lang.flag}
        </button>
      ))}
    </div>
  )
}

export default LanguageSwitch