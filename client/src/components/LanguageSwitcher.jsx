import { useTranslation } from "react-i18next";
import { LANGUAGES, changeLanguage } from "../i18n";

export default function LanguageSwitcher({ className = "" }) {
  const { i18n } = useTranslation();

  return (
    <select
      value={i18n.language}
      onChange={(e) => changeLanguage(e.target.value)}
      aria-label="Language"
      className={
        "rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 " + className
      }
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  );
}
