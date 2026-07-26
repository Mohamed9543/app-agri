import { useState } from "react";
import { View, Text, Pressable, Modal, FlatList, Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { LANGUAGES, changeLanguage } from "../lib/i18n";

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  async function select(code) {
    setOpen(false);
    const rtlChanged = await changeLanguage(code);
    if (rtlChanged) {
      Alert.alert("", t("app.restartForDirection", "Redémarrez l'application pour appliquer le sens d'écriture."));
    }
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5"
      >
        <Text className="text-sm text-slate-700">{current.code.toUpperCase()}</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 justify-center bg-black/40 px-8" onPress={() => setOpen(false)}>
          <View className="rounded-xl bg-white p-2 shadow-lg">
            <FlatList
              data={LANGUAGES}
              keyExtractor={(l) => l.code}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => select(item.code)}
                  className={
                    "rounded-lg px-4 py-3 " + (item.code === current.code ? "bg-brand-50" : "")
                  }
                >
                  <Text className="text-base text-slate-800">{item.label}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
