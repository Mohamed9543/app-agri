import { useEffect, useState } from "react";
import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { I18nextProvider } from "react-i18next";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../context/AuthContext";
import i18n, { loadStoredLanguage, syncNativeDirection } from "../lib/i18n";
import "../global.css";

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const lang = await loadStoredLanguage();
      syncNativeDirection(lang);
      setReady(true);
    })();
  }, []);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <AuthProvider>
          <StatusBar style="auto" />
          <Slot />
        </AuthProvider>
      </I18nextProvider>
    </SafeAreaProvider>
  );
}
