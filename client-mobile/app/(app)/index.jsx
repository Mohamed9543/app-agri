import { useCallback, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList } from "react-native";
import { Link, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";
import { confirmAsync } from "../../lib/confirm";

export default function Stations() {
  const { t } = useTranslation();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get("/stations")
      .then(({ data }) => setStations(data.stations))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(load);

  async function handleCreate() {
    if (!name.trim()) {
      setError(t("stations.emptyNameError"));
      return;
    }
    setError("");
    setCreating(true);
    try {
      await api.post("/stations", { name });
      setName("");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id) {
    const ok = await confirmAsync(t("stations.confirmDelete"));
    if (!ok) return;
    await api.delete(`/stations/${id}`);
    load();
  }

  return (
    <View className="flex-1 px-4 py-6">
      <Text className="mb-4 text-xl font-bold text-slate-800">{t("stations.title")}</Text>

      <View className="mb-6 flex-row gap-2">
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t("stations.newPlaceholder")}
          placeholderTextColor="#94a3b8"
          className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2.5 text-base"
        />
        <Pressable
          onPress={handleCreate}
          disabled={creating}
          className="justify-center rounded-md bg-brand-700 px-4 py-2.5 disabled:opacity-60"
        >
          <Text className="font-medium text-white">{t("stations.add")}</Text>
        </Pressable>
      </View>
      {!!error && <Text className="mb-3 text-sm text-red-600">{error}</Text>}

      {loading ? (
        <Text className="text-slate-400">{t("app.loading")}</Text>
      ) : stations.length === 0 ? (
        <View className="rounded-md bg-white p-6 shadow-sm">
          <Text className="text-center text-slate-400">{t("stations.empty")}</Text>
        </View>
      ) : (
        <FlatList
          data={stations}
          keyExtractor={(s) => String(s.id)}
          contentContainerClassName="gap-2"
          renderItem={({ item: s }) => (
            <View className="flex-row items-center justify-between rounded-md bg-white p-4 shadow-sm">
              <Link href={`/stations/${s.id}`} asChild>
                <Pressable className="flex-1">
                  <Text className="font-medium text-slate-800">{s.name}</Text>
                  <Text className="text-xs text-slate-400">
                    {t("stations.parcelleCount", { count: s._count.parcelles })}
                  </Text>
                </Pressable>
              </Link>
              <Pressable onPress={() => handleDelete(s.id)} className="ml-3">
                <Text className="text-sm text-red-500">{t("stations.delete")}</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}
