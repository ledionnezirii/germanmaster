import { createContext, useContext, useEffect, useRef, useState } from "react";
import * as SecureStore from "expo-secure-store";

const LanguageContext = createContext(null);

export const LANGUAGES = [
  { code: "de", label: "Gjermanisht", flag: "🇩🇪", name: "Deutsch" },
  { code: "en", label: "Anglisht",    flag: "🇬🇧", name: "English" },
  { code: "fr", label: "Frëngjisht", flag: "🇫🇷", name: "Français" },
];

export function LanguageProvider({ children }) {
  const [language, setLanguage]   = useState("de");
  const [loaded, setLoaded]       = useState(false);
  const [switching, setSwitching] = useState(false);
  const [pendingLang, setPendingLang] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    SecureStore.getItemAsync("appLanguage").then((saved) => {
      if (saved && LANGUAGES.some((l) => l.code === saved)) {
        setLanguage(saved);
      }
      setLoaded(true);
    });
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  async function switchLanguage(lang) {
    if (lang === language) return;
    setPendingLang(lang);
    setSwitching(true);
    setLanguage(lang);
    await SecureStore.setItemAsync("appLanguage", lang);
    timerRef.current = setTimeout(() => {
      setSwitching(false);
      setPendingLang(null);
    }, 1800);
  }

  if (!loaded) return null;

  const newLangObj = LANGUAGES.find((l) => l.code === pendingLang) || null;

  return (
    <LanguageContext.Provider value={{ language, switchLanguage, switching, newLangObj }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
