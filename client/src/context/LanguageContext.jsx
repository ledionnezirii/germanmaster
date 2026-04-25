import { createContext, useContext, useState } from "react"

const LanguageContext = createContext()

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(
    localStorage.getItem("appLanguage") || "de"
  )
  const [switching, setSwitching] = useState(false)
  const [pendingLanguage, setPendingLanguage] = useState(null)

  const switchLanguage = (lang) => {
    if (lang === language || switching) return
    setPendingLanguage(lang)
    setSwitching(true)
    setTimeout(() => {
      setLanguage(lang)
      localStorage.setItem("appLanguage", lang)
      setSwitching(false)
      setPendingLanguage(null)
    }, 1800)
  }

  return (
    <LanguageContext.Provider value={{ language, switchLanguage, switching, pendingLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)