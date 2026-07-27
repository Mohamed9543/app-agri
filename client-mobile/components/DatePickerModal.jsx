import { useEffect, useState } from "react";
import { Modal, View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { todayISO, getMonthGrid, monthYearLabel } from "../lib/date";

function parseYearMonth(iso) {
  const [y, m] = iso.split("-").map(Number);
  return { year: y, month: m - 1 };
}

export default function DatePickerModal({ visible, onCancel, onConfirm }) {
  const { t, i18n } = useTranslation();
  const today = todayISO();
  const [selected, setSelected] = useState(today);
  const [view, setView] = useState(parseYearMonth(today));

  useEffect(() => {
    if (visible) {
      setSelected(today);
      setView(parseYearMonth(today));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const weekdays = t("dateModal.weekdaysShort").split(",");
  const weeks = getMonthGrid(view.year, view.month);

  function changeMonth(delta) {
    let month = view.month + delta;
    let year = view.year;
    if (month < 0) {
      month = 11;
      year -= 1;
    } else if (month > 11) {
      month = 0;
      year += 1;
    }
    setView({ year, month });
  }

  function goToday() {
    setSelected(today);
    setView(parseYearMonth(today));
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-black/40 px-6">
        <View className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg">
          <Text className="mb-3 text-lg font-bold text-slate-800">{t("dateModal.title")}</Text>

          <View className="mb-3 flex-row items-center justify-between">
            <Pressable onPress={() => changeMonth(-1)} hitSlop={8} className="px-2 py-1">
              <Text className="text-lg text-brand-700">‹</Text>
            </Pressable>
            <Text className="font-medium capitalize text-slate-800">
              {monthYearLabel(view.year, view.month, i18n.language)}
            </Text>
            <Pressable onPress={() => changeMonth(1)} hitSlop={8} className="px-2 py-1">
              <Text className="text-lg text-brand-700">›</Text>
            </Pressable>
          </View>

          <View className="flex-row">
            {weekdays.map((w, i) => (
              <View key={i} className="w-[14.28%] items-center py-1">
                <Text className="text-xs text-slate-400">{w}</Text>
              </View>
            ))}
          </View>

          {weeks.map((week, wi) => (
            <View key={wi} className="flex-row">
              {week.map((cell, ci) => {
                if (!cell) return <View key={ci} className="aspect-square w-[14.28%]" />;
                const isSelected = cell.iso === selected;
                const isToday = cell.iso === today;
                return (
                  <Pressable
                    key={ci}
                    onPress={() => setSelected(cell.iso)}
                    className="aspect-square w-[14.28%] items-center justify-center py-1"
                  >
                    <View
                      className={
                        "h-8 w-8 items-center justify-center rounded-full " +
                        (isSelected ? "bg-brand-700" : isToday ? "bg-brand-50" : "")
                      }
                    >
                      <Text className={isSelected ? "font-medium text-white" : "text-slate-700"}>{cell.day}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}

          <Pressable onPress={goToday} className="mt-2 self-start rounded-md bg-brand-50 px-3 py-1.5">
            <Text className="text-sm font-medium text-brand-700">{t("dateModal.today")}</Text>
          </Pressable>

          <View className="mt-4 flex-row gap-2">
            <Pressable onPress={onCancel} className="flex-1 rounded-md bg-slate-200 px-4 py-2.5">
              <Text className="text-center text-slate-700">{t("dateModal.cancel")}</Text>
            </Pressable>
            <Pressable onPress={() => onConfirm(selected)} className="flex-1 rounded-md bg-brand-700 px-4 py-2.5">
              <Text className="text-center font-medium text-white">{t("dateModal.continue")}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
