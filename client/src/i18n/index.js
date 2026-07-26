import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import fr from "./locales/fr.json";
import en from "./locales/en.json";
import ar from "./locales/ar.json";
import aeb from "./locales/aeb.json";

export const RTL_LANGUAGES = ["ar", "aeb"];

export const LANGUAGES = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "aeb", label: "الدارجة التونسية" },
];

const stored = localStorage.getItem("lang");
const initialLang = LANGUAGES.some((l) => l.code === stored) ? stored : "fr";

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
    ar: { translation: ar },
    aeb: { translation: aeb },
  },
  lng: initialLang,
  fallbackLng: "fr",
  interpolation: { escapeValue: false },
});

export function applyDirection(lang) {
  const dir = RTL_LANGUAGES.includes(lang) ? "rtl" : "ltr";
  document.documentElement.dir = dir;
  document.documentElement.lang = lang;
}

export function changeLanguage(lang) {
  localStorage.setItem("lang", lang);
  i18n.changeLanguage(lang);
  applyDirection(lang);
}

applyDirection(initialLang);

export default i18n;
