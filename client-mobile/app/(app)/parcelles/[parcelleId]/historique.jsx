import { useCallback, useState } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { Link, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { api } from "../../../../lib/api";
import { formatDisplayDate } from "../../../../lib/date";

export default function ParcelleHistory() {
  const { t, i18n } = useTranslation();
  const { parcelleId } = useLocalSearchParams();
  const router = useRouter();

  const [parcelleName, setParcelleName] = useState("");
  const [jours, setJours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.get(`/parcelles/${parcelleId}`), api.get(`/parcelles/${parcelleId}/jours`)])
      .then(([parcelleRes, joursRes]) => {
        setParcelleName(parcelleRes.data.parcelle.name);
        setJours(joursRes.data.jours);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [parcelleId]);

  useFocusEffect(load);

  if (loading) return <Text className="p-6 text-slate-400">{t("app.loading")}</Text>;
  if (error) return <Text className="p-6 text-red-600">{error}</Text>;

  return (
    <View className="flex-1 px-4 py-6">
      <Pressable onPress={() => router.back()} className="mb-3">
        <Text className="text-sm text-brand-700">{t("history.back")}</Text>
      </Pressable>
      <Text className="mb-4 text-xl font-bold text-slate-800">
        {t("history.title", { name: parcelleName })}
      </Text>

      {jours.length === 0 ? (
        <View className="rounded-md bg-white p-6 shadow-sm">
          <Text className="text-center text-slate-400">{t("history.empty")}</Text>
        </View>
      ) : (
        <FlatList
          data={jours}
          keyExtractor={(j) => j.date || "none"}
          contentContainerClassName="gap-2"
          renderItem={({ item: j }) => (
            <Link href={`/parcelles/${parcelleId}/tableau?date=${j.date || "none"}`} asChild>
              <Pressable className="rounded-md bg-white p-4 shadow-sm">
                <View className="flex-row items-center justify-between">
                  <Text className="font-medium text-slate-800">
                    {j.date ? formatDisplayDate(j.date, i18n.language) : t("history.undated")}
                  </Text>
                  {j.hasActive && (
                    <View className="rounded-full bg-amber-100 px-2 py-0.5">
                      <Text className="text-[10px] text-amber-700">{t("history.ongoing")}</Text>
                    </View>
                  )}
                </View>
                <Text className="text-xs text-slate-400">
                  {t("history.ligneCount", { count: j.ligneCount })} · {t("history.valeurCount", { count: j.valeurCount })}
                </Text>
              </Pressable>
            </Link>
          )}
        />
      )}
    </View>
  );
}
