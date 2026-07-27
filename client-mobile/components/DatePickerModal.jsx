import { useEffect, useState } from "react";
import { Modal, View, Text, TextInput, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { todayISO, isValidISODate } from "../lib/date";

export default function DatePickerModal({ visible, onCancel, onConfirm }) {
  const { t } = useTranslation();
  const [value, setValue] = useState(todayISO());

  useEffect(() => {
    if (visible) setValue(todayISO());
  }, [visible]);

  const valid = isValidISODate(value);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-black/40 px-6">
        <View className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg">
          <Text className="mb-3 text-lg font-bold text-slate-800">{t("dateModal.title")}</Text>

          <Pressable onPress={() => setValue(todayISO())} className="mb-3 self-start rounded-md bg-brand-50 px-3 py-1.5">
            <Text className="text-sm font-medium text-brand-700">{t("dateModal.today")}</Text>
          </Pressable>

          <Text className="mb-1 text-sm text-slate-600">{t("dateModal.dateLabel")}</Text>
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder="AAAA-MM-JJ"
            placeholderTextColor="#94a3b8"
            keyboardType="numbers-and-punctuation"
            className="mb-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-base"
          />
          {!valid && <Text className="mb-2 text-xs text-red-600">{t("dateModal.invalid")}</Text>}

          <View className="mt-3 flex-row gap-2">
            <Pressable onPress={onCancel} className="flex-1 rounded-md bg-slate-200 px-4 py-2.5">
              <Text className="text-center text-slate-700">{t("dateModal.cancel")}</Text>
            </Pressable>
            <Pressable
              onPress={() => valid && onConfirm(value)}
              disabled={!valid}
              className="flex-1 rounded-md bg-brand-700 px-4 py-2.5 disabled:opacity-50"
            >
              <Text className="text-center font-medium text-white">{t("dateModal.continue")}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
