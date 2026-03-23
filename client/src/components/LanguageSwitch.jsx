import { useLanguage } from "../context/LanguageContext"

const LANGUAGES = [
  { code: "de", flag: "🇩🇪", label: "DE" },
  { code: "en", flag: "🇬🇧", label: "EN" },
  { code: "fr", flag: "🇫🇷", label: "FR" },
]

const LanguageSwitch = () => {
  const { language, switchLanguage } = useLanguage()

  return (
    <div className="flex items-center gap-1 bg-white border-2 border-emerald-200 rounded-full px-2 py-1 shadow-sm">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => switchLanguage(lang.code)}
          className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 ${
            language === lang.code
              ? "bg-emerald-500 text-white shadow-md scale-105"
              : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
          }`}
        >
          <span>{lang.flag}</span>
          <span>{lang.label}</span>
        </button>
      ))}
    </div>
  )
}

export default LanguageSwitch