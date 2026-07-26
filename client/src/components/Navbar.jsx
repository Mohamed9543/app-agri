import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  if (!user) return null;

  return (
    <header className="sticky top-0 z-10 bg-brand-800 text-white shadow">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-semibold">
          🌱 {t("app.name")}
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <LanguageSwitcher />
          <span className="hidden sm:inline opacity-90">{user.name}</span>
          <button
            onClick={logout}
            className="rounded-md bg-brand-700 px-3 py-1.5 hover:bg-brand-600 active:scale-95"
          >
            {t("nav.logout")}
          </button>
        </div>
      </div>
    </header>
  );
}
