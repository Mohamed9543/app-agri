import { useCallback, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList, ScrollView } from "react-native";
import { Link, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { api } from "../../../lib/api";
import { confirmAsync } from "../../../lib/confirm";

export default function StationDetail() {
  const { t } = useTranslation();
  const { stationId } = useLocalSearchParams();
  const router = useRouter();
  const [station, setStation] = useState(null);
  const [parcelles, setParcelles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [count, setCount] = useState("");
  const [names, setNames] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get(`/stations/${stationId}`)
      .then(({ data }) => {
        setStation(data.station);
        setParcelles(data.parcelles);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [stationId]);

  useFocusEffect(load);

  function startAdd() {
    setShowAdd(true);
    setCount("");
    setNames([]);
  }

  function handleCountSubmit() {
    const n = parseInt(count, 10);
    if (!n || n < 1) return;
    setNames(
      Array.from({ length: n }, (_, i) =>
        t("stationDetail.defaultParcelleName", { n: parcelles.length + i + 1 })
      )
    );
  }

  async function handleSaveNames() {
    setError("");
    setSaving(true);
    try {
      await api.post(`/stations/${stationId}/parcelles`, { names });
      setShowAdd(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteParcelle(id) {
    const ok = await confirmAsync(t("stationDetail.confirmDeleteParcelle"));
    if (!ok) return;
    await api.delete(`/parcelles/${id}`);
    load();
  }

  if (loading) return <Text className="p-6 text-slate-400">{t("app.loading")}</Text>;
  if (!station)
    return <Text className="p-6 text-red-600">{error || t("stationDetail.notFound")}</Text>;

  return (
    <ScrollView className="flex-1 px-4 py-6" contentContainerClassName="pb-10">
      <Pressable onPress={() => router.back()} className="mb-3">
        <Text className="text-sm text-brand-700">{t("stationDetail.backToStations")}</Text>
      </Pressable>
      <Text className="mb-4 text-xl font-bold text-slate-800">{station.name}</Text>

      {!showAdd && (
        <Pressable onPress={startAdd} className="mb-6 rounded-md bg-brand-700 px-4 py-2.5">
          <Text className="text-center font-medium text-white">{t("stationDetail.addParcelles")}</Text>
        </Pressable>
      )}

      {showAdd && names.length === 0 && (
        <View className="mb-6 flex-row items-end gap-2 rounded-md bg-white p-4 shadow-sm">
          <View className="flex-1">
            <Text className="mb-1 text-sm text-slate-600">{t("stationDetail.countLabel")}</Text>
            <TextInput
              keyboardType="number-pad"
              value={count}
              onChangeText={setCount}
              className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-base"
            />
          </View>
          <Pressable onPress={handleCountSubmit} className="rounded-md bg-brand-700 px-4 py-2.5">
            <Text className="text-white">{t("stationDetail.next")}</Text>
          </Pressable>
          <Pressable onPress={() => setShowAdd(false)} className="rounded-md bg-slate-200 px-4 py-2.5">
            <Text className="text-slate-700">{t("stationDetail.cancel")}</Text>
          </Pressable>
        </View>
      )}

      {showAdd && names.length > 0 && (
        <View className="mb-6 gap-2 rounded-md bg-white p-4 shadow-sm">
          <Text className="mb-2 text-sm text-slate-600">{t("stationDetail.nameEach")}</Text>
          {names.map((n, i) => (
            <TextInput
              key={i}
              value={n}
              onChangeText={(val) => {
                const copy = [...names];
                copy[i] = val;
                setNames(copy);
              }}
              className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-base"
            />
          ))}
          {!!error && <Text className="text-sm text-red-600">{error}</Text>}
          <View className="flex-row gap-2 pt-2">
            <Pressable
              onPress={handleSaveNames}
              disabled={saving}
              className="rounded-md bg-brand-700 px-4 py-2.5 disabled:opacity-60"
            >
              <Text className="text-white">{t("stationDetail.save")}</Text>
            </Pressable>
            <Pressable onPress={() => setShowAdd(false)} className="rounded-md bg-slate-200 px-4 py-2.5">
              <Text className="text-slate-700">{t("stationDetail.cancel")}</Text>
            </Pressable>
          </View>
        </View>
      )}

      {parcelles.length === 0 ? (
        <View className="rounded-md bg-white p-6 shadow-sm">
          <Text className="text-center text-slate-400">{t("stationDetail.empty")}</Text>
        </View>
      ) : (
        <FlatList
          data={parcelles}
          keyExtractor={(p) => String(p.id)}
          scrollEnabled={false}
          contentContainerClassName="gap-2"
          renderItem={({ item: p }) => (
            <View className="rounded-md bg-white p-4 shadow-sm">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="font-medium text-slate-800">{p.name}</Text>
                  <Text className="text-xs text-slate-400">
                    {t("stationDetail.ligneCount", { count: p._count.lignes })}
                  </Text>
                </View>
                <Pressable onPress={() => handleDeleteParcelle(p.id)}>
                  <Text className="text-sm text-red-500">{t("stationDetail.delete")}</Text>
                </Pressable>
              </View>
              <View className="mt-3 flex-row gap-2">
                <Link href={`/parcelles/${p.id}/travail`} asChild>
                  <Pressable className="flex-1 rounded-md bg-brand-600 px-3 py-2.5">
                    <Text className="text-center text-sm font-medium text-white">
                      {t("stationDetail.startWork")}
                    </Text>
                  </Pressable>
                </Link>
                <Link href={`/parcelles/${p.id}/tableau`} asChild>
                  <Pressable className="flex-1 rounded-md bg-slate-100 px-3 py-2.5">
                    <Text className="text-center text-sm font-medium text-slate-700">
                      {t("stationDetail.viewTable")}
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          )}
        />
      )}
    </ScrollView>
  );
}
