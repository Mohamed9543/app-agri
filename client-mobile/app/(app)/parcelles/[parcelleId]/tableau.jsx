import { useCallback, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { api } from "../../../../lib/api";
import { confirmAsync } from "../../../../lib/confirm";
import { exportLignesToXlsx } from "../../../../lib/exportXlsx";
import { formatDisplayDate } from "../../../../lib/date";

export default function ParcelleTable() {
  const { t, i18n } = useTranslation();
  const { parcelleId, date } = useLocalSearchParams();
  const router = useRouter();
  const dateLabel = date === "none" ? t("history.undated") : formatDisplayDate(date, i18n.language);

  const [parcelle, setParcelle] = useState(null);
  const [lignes, setLignes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [exporting, setExporting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get(`/parcelles/${parcelleId}`, { params: { date } })
      .then(({ data }) => {
        setParcelle(data.parcelle);
        setLignes(data.lignes);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [parcelleId, date]);

  useFocusEffect(load);

  async function handleDeleteLigne(id) {
    const ok = await confirmAsync(t("table.confirmDeleteLigne"));
    if (!ok) return;
    await api.delete(`/lignes/${id}`);
    load();
  }

  async function handleDeleteValeur(id) {
    const ok = await confirmAsync(t("table.confirmDeleteValue"));
    if (!ok) return;
    await api.delete(`/valeurs/${id}`);
    load();
  }

  function startEdit(v) {
    setEditing(v.id);
    setEditValue(String(v.valeur));
  }

  async function saveEdit(id) {
    const num = Number(editValue);
    if (Number.isNaN(num)) {
      setEditing(null);
      return;
    }
    await api.put(`/valeurs/${id}`, { valeur: num });
    setEditing(null);
    load();
  }

  async function handleExport() {
    setExporting(true);
    try {
      await exportLignesToXlsx({
        lignes,
        parcelleName: `${parcelle?.name || ""}_${date === "none" ? "sans_date" : date}`,
        sheetName: t("table.sheetName"),
        columns: [t("table.colLigne"), t("table.colNumero"), t("table.colValeur")],
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  }

  if (loading) return <Text className="p-6 text-slate-400">{t("app.loading")}</Text>;
  if (!parcelle) return <Text className="p-6 text-red-600">{error || t("table.notFound")}</Text>;

  const totalValeurs = lignes.reduce((sum, l) => sum + l.valeurs.length, 0);

  return (
    <ScrollView className="flex-1 px-4 py-6" contentContainerClassName="pb-10">
      <Pressable onPress={() => router.back()} className="mb-3">
        <Text className="text-sm text-brand-700">{t("table.back")}</Text>
      </Pressable>

      <View className="mb-4 flex-row flex-wrap items-center justify-between gap-2">
        <Text className="text-xl font-bold text-slate-800">
          {t("table.title", { name: parcelle.name, date: dateLabel })}
        </Text>
        <Pressable
          onPress={handleExport}
          disabled={totalValeurs === 0 || exporting}
          className="rounded-md bg-brand-700 px-4 py-2.5 disabled:opacity-40"
        >
          <Text className="font-medium text-white">{t("table.download")}</Text>
        </Pressable>
      </View>
      {!!error && <Text className="mb-3 text-sm text-red-600">{error}</Text>}

      {lignes.length === 0 ? (
        <View className="rounded-md bg-white p-6 shadow-sm">
          <Text className="text-center text-slate-400">{t("table.empty")}</Text>
        </View>
      ) : (
        <ScrollView horizontal>
          <View className="overflow-hidden rounded-md bg-white shadow-sm">
            <View className="flex-row bg-brand-800">
              <Text className="w-20 border border-brand-900/20 px-4 py-2 font-medium text-white">
                {t("table.colLigne")}
              </Text>
              <Text className="w-20 border border-brand-900/20 px-4 py-2 font-medium text-white">
                {t("table.colNumero")}
              </Text>
              <Text className="w-24 border border-brand-900/20 px-4 py-2 font-medium text-white">
                {t("table.colValeur")}
              </Text>
              <Text className="w-40 border border-brand-900/20 px-4 py-2 font-medium text-white">
                {t("table.colActions")}
              </Text>
            </View>

            {lignes.map((l) =>
              l.valeurs.length > 0 ? (
                l.valeurs.map((v, i) => (
                  <View key={v.id} className={"flex-row " + (i % 2 === 0 ? "bg-white" : "bg-slate-50")}>
                    <View className="w-20 flex-row items-center gap-1 border border-slate-200 px-4 py-2">
                      <Text className="font-medium">{l.numero}</Text>
                      {i === 0 && (
                        <View
                          className={
                            "rounded-full px-2 py-0.5 " +
                            (l.status === "terminee" ? "bg-emerald-100" : "bg-amber-100")
                          }
                        >
                          <Text
                            className={
                              "text-[10px] " +
                              (l.status === "terminee" ? "text-emerald-700" : "text-amber-700")
                            }
                          >
                            {l.status === "terminee" ? t("table.statusDone") : t("table.statusOngoing")}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="w-20 border border-slate-200 px-4 py-2">{i + 1}</Text>
                    <View className="w-24 border border-slate-200 px-4 py-2">
                      {editing === v.id ? (
                        <TextInput
                          autoFocus
                          keyboardType="numeric"
                          value={editValue}
                          onChangeText={setEditValue}
                          onSubmitEditing={() => saveEdit(v.id)}
                          onBlur={() => saveEdit(v.id)}
                          className="w-16 rounded border border-brand-400 px-1 text-center"
                        />
                      ) : (
                        <Pressable onPress={() => startEdit(v)}>
                          <Text className="font-medium">{v.valeur}</Text>
                        </Pressable>
                      )}
                    </View>
                    <View className="w-40 flex-row gap-3 border border-slate-200 px-4 py-2">
                      <Pressable onPress={() => handleDeleteValeur(v.id)}>
                        <Text className="text-sm text-red-500">{t("table.deleteValue")}</Text>
                      </Pressable>
                      {i === 0 && (
                        <Pressable onPress={() => handleDeleteLigne(l.id)}>
                          <Text className="text-sm text-slate-500">{t("table.deleteLigne")}</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <View key={l.id} className="flex-row bg-white">
                  <Text className="w-20 border border-slate-200 px-4 py-2 font-medium">{l.numero}</Text>
                  <Text className="w-20 border border-slate-200 px-4 py-2 text-slate-400">—</Text>
                  <Text className="w-24 border border-slate-200 px-4 py-2 text-slate-400">—</Text>
                  <View className="w-40 border border-slate-200 px-4 py-2">
                    <Pressable onPress={() => handleDeleteLigne(l.id)}>
                      <Text className="text-sm text-slate-500">{t("table.deleteLigne")}</Text>
                    </Pressable>
                  </View>
                </View>
              )
            )}
          </View>
        </ScrollView>
      )}
    </ScrollView>
  );
}
