import { I18nManager } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import fr from "./locales/fr.json";
import en from "./locales/en.json";
import ar from "./locales/ar.json";
import aeb from "./locales/aeb.json";

const LANG_KEY = "lang";

export const RTL_LANGUAGES = ["ar", "aeb"];

export const LANGUAGES = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "aeb", label: "الدارجة التونسية" },
];

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
    ar: { translation: ar },
    aeb: { translation: aeb },
  },
  lng: "fr",
  fallbackLng: "fr",
  interpolation: { escapeValue: false },
});

export async function loadStoredLanguage() {
  const stored = await AsyncStorage.getItem(LANG_KEY);
  const lang = LANGUAGES.some((l) => l.code === stored) ? stored : "fr";
  await i18n.changeLanguage(lang);
  return lang;
}

// RN can only apply a layout direction change after a reload, so we only
// flip the native RTL flags here; the caller is responsible for prompting
// a reload when isRTL actually changes.
export function syncNativeDirection(lang) {
  const shouldBeRTL = RTL_LANGUAGES.includes(lang);
  const changed = I18nManager.isRTL !== shouldBeRTL;
  I18nManager.allowRTL(shouldBeRTL);
  I18nManager.forceRTL(shouldBeRTL);
  return changed;
}

export async function changeLanguage(lang) {
  await AsyncStorage.setItem(LANG_KEY, lang);
  await i18n.changeLanguage(lang);
  return syncNativeDirection(lang);
}

export default i18n;
