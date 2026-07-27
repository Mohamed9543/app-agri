import { useCallback, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList } from "react-native";
import { Link, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { api } from "../../../../lib/api";
import { confirmAsync } from "../../../../lib/confirm";
import { todayISO, formatDisplayDate } from "../../../../lib/date";

export default function ParcelleWork() {
  const { t, i18n } = useTranslation();
  const { parcelleId, date: dateParam } = useLocalSearchParams();
  const date = dateParam || todayISO();
  const router = useRouter();

  const [parcelle, setParcelle] = useState(null);
  const [lignes, setLignes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLigne, setActiveLigne] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get(`/parcelles/${parcelleId}`, { params: { date } })
      .then(({ data }) => {
        setParcelle(data.parcelle);
        setLignes(data.lignes.filter((l) => l.status === "terminee"));
        const enCours = data.lignes.find((l) => l.status === "en_cours");
        setActiveLigne(enCours || null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [parcelleId, date]);

  useFocusEffect(load);

  async function handleAjouterLigne() {
    setError("");
    setBusy(true);
    try {
      const { data } = await api.post(`/parcelles/${parcelleId}/lignes`, { date });
      setActiveLigne(data.ligne);
      setInputValue("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSuivant() {
    if (inputValue === "") return;
    setError("");
    setBusy(true);
    try {
      const { data } = await api.post(`/lignes/${activeLigne.id}/valeurs`, { valeur: inputValue });
      setActiveLigne((prev) => ({ ...prev, valeurs: [...prev.valeurs, data.valeur] }));
      setInputValue("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRetour() {
    if (inputValue !== "") {
      setInputValue("");
      return;
    }
    if (!activeLigne || activeLigne.valeurs.length === 0) return;
    setBusy(true);
    try {
      await api.post(`/lignes/${activeLigne.id}/retour`);
      setActiveLigne((prev) => ({ ...prev, valeurs: prev.valeurs.slice(0, -1) }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleAnnuler() {
    const ok = await confirmAsync(t("work.confirmCancelLigne"));
    if (!ok) return;
    setBusy(true);
    try {
      await api.delete(`/lignes/${activeLigne.id}`);
      setActiveLigne(null);
      setInputValue("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleStop() {
    setError("");
    setBusy(true);
    try {
      let ligne = activeLigne;
      if (inputValue !== "") {
        const { data } = await api.post(`/lignes/${ligne.id}/valeurs`, { valeur: inputValue });
        ligne = { ...ligne, valeurs: [...ligne.valeurs, data.valeur] };
      }
      const { data } = await api.post(`/lignes/${ligne.id}/stop`);
      setLignes((prev) => [...prev, data.ligne]);
      setActiveLigne(null);
      setInputValue("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Text className="p-6 text-slate-400">{t("app.loading")}</Text>;
  if (!parcelle) return <Text className="p-6 text-red-600">{error || t("work.notFound")}</Text>;

  return (
    <View className="flex-1 px-4 py-6">
      <Pressable onPress={() => router.back()} className="mb-3">
        <Text className="text-sm text-brand-700">{t("work.back")}</Text>
      </Pressable>
      <Text className="mb-1 text-xl font-bold text-slate-800">{parcelle.name}</Text>
      <Text className="text-sm text-slate-500">{t("work.sessionDate", { date: formatDisplayDate(date, i18n.language) })}</Text>
      <Text className="mb-4 text-sm text-slate-500">
        {t("work.lignesFinished", { count: lignes.length })}
      </Text>

      {!!error && <Text className="mb-3 text-sm text-red-600">{error}</Text>}

      {!activeLigne ? (
        <View className="gap-4">
          <Pressable
            onPress={handleAjouterLigne}
            disabled={busy}
            className="w-full rounded-lg bg-brand-700 px-4 py-5 shadow disabled:opacity-60"
          >
            <Text className="text-center text-lg font-semibold text-white">{t("work.addLigne")}</Text>
          </Pressable>

          {lignes.length > 0 && (
            <FlatList
              data={lignes}
              keyExtractor={(l) => String(l.id)}
              scrollEnabled={false}
              contentContainerClassName="gap-2"
              renderItem={({ item: l }) => (
                <View className="rounded-md bg-white p-3 shadow-sm">
                  <Text className="text-sm">
                    <Text className="font-medium">{t("work.ligneTitle", { n: l.numero })}</Text>
                    <Text className="text-slate-500"> — {t("work.valueCount", { count: l.valeurs.length })}</Text>
                  </Text>
                </View>
              )}
            />
          )}

          <Link href={`/parcelles/${parcelleId}/tableau?date=${date}`} asChild>
            <Pressable className="w-full rounded-lg bg-slate-800 px-4 py-3.5">
              <Text className="text-center font-medium text-white">{t("work.finishAndView")}</Text>
            </Pressable>
          </Link>
        </View>
      ) : (
        <View className="rounded-xl bg-white p-4 shadow">
          <Text className="mb-3 text-center text-lg font-bold text-brand-800">
            {t("work.ligneTitle", { n: activeLigne.numero })}
          </Text>

          {activeLigne.valeurs.length > 0 && (
            <View className="mb-4 flex-row flex-wrap gap-2">
              {activeLigne.valeurs.map((v, i) => (
                <View key={v.id} className="rounded-full bg-brand-50 px-3 py-1">
                  <Text className="text-sm font-medium text-brand-800">
                    #{i + 1}: {v.valeur}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <TextInput
            keyboardType="decimal-pad"
            value={inputValue}
            onChangeText={setInputValue}
            onSubmitEditing={handleSuivant}
            placeholder={t("work.placeholder")}
            placeholderTextColor="#94a3b8"
            className="mb-4 w-full rounded-lg border-2 border-brand-200 px-4 py-4 text-center text-2xl"
          />

          <View className="flex-row flex-wrap gap-2">
            <Pressable
              onPress={handleAnnuler}
              disabled={busy}
              className="w-[48%] rounded-md bg-red-50 px-4 py-3.5 disabled:opacity-60"
            >
              <Text className="text-center font-medium text-red-600">{t("work.cancel")}</Text>
            </Pressable>
            <Pressable
              onPress={handleRetour}
              disabled={busy}
              className="w-[48%] rounded-md bg-slate-100 px-4 py-3.5 disabled:opacity-60"
            >
              <Text className="text-center font-medium text-slate-700">{t("work.retour")}</Text>
            </Pressable>
            <Pressable
              onPress={handleSuivant}
              disabled={busy || inputValue === ""}
              className="w-[48%] rounded-md bg-brand-600 px-4 py-3.5 disabled:opacity-60"
            >
              <Text className="text-center font-medium text-white">{t("work.next")}</Text>
            </Pressable>
            <Pressable
              onPress={handleStop}
              disabled={busy}
              className="w-[48%] rounded-md bg-slate-800 px-4 py-3.5 disabled:opacity-60"
            >
              <Text className="text-center font-medium text-white">{t("work.stop")}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
