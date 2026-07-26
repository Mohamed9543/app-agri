import { View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Header() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  if (!user) return null;

  return (
    <View className="flex-row items-center justify-between bg-brand-800 px-4 py-3">
      <Text className="text-lg font-semibold text-white">🌱 {t("app.name")}</Text>
      <View className="flex-row items-center gap-3">
        <LanguageSwitcher />
        <Pressable onPress={logout} className="rounded-md bg-brand-700 px-3 py-1.5 active:opacity-70">
          <Text className="text-sm text-white">{t("nav.logout")}</Text>
        </Pressable>
      </View>
    </View>
  );
}
