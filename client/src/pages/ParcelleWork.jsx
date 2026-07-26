import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api";

export default function ParcelleWork() {
  const { t } = useTranslation();
  const { parcelleId } = useParams();
  const navigate = useNavigate();

  const [parcelle, setParcelle] = useState(null);
  const [lignes, setLignes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLigne, setActiveLigne] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    setLoading(true);
    api
      .get(`/parcelles/${parcelleId}`)
      .then(({ data }) => {
        setParcelle(data.parcelle);
        setLignes(data.lignes.filter((l) => l.status === "terminee"));
        const enCours = data.lignes.find((l) => l.status === "en_cours");
        if (enCours) setActiveLigne(enCours);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [parcelleId]);

  async function handleAjouterLigne() {
    setError("");
    setBusy(true);
    try {
      const { data } = await api.post(`/parcelles/${parcelleId}/lignes`);
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
    if (!confirm(t("work.confirmCancelLigne"))) return;
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

  if (loading) return <p className="p-6 text-slate-400">{t("app.loading")}</p>;
  if (!parcelle) return <p className="p-6 text-red-600">{error || t("work.notFound")}</p>;

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <button onClick={() => navigate(-1)} className="mb-3 text-sm text-brand-700 hover:underline">
        {t("work.back")}
      </button>
      <h1 className="mb-1 text-xl font-bold text-slate-800">{parcelle.name}</h1>
      <p className="mb-4 text-sm text-slate-500">{t("work.lignesFinished", { count: lignes.length })}</p>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {!activeLigne ? (
        <div className="space-y-4">
          <button
            onClick={handleAjouterLigne}
            disabled={busy}
            className="w-full rounded-lg bg-brand-700 px-4 py-4 text-lg font-semibold text-white shadow hover:bg-brand-800 disabled:opacity-60"
          >
            {t("work.addLigne")}
          </button>

          {lignes.length > 0 && (
            <ul className="space-y-2">
              {lignes.map((l) => (
                <li key={l.id} className="rounded-md bg-white p-3 text-sm shadow-sm">
                  <span className="font-medium">{t("work.ligneTitle", { n: l.numero })}</span>{" "}
                  <span className="text-slate-500">
                    — {t("work.valueCount", { count: l.valeurs.length })}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <Link
            to={`/parcelles/${parcelleId}/tableau`}
            className="block w-full rounded-lg bg-slate-800 px-4 py-3 text-center font-medium text-white hover:bg-slate-900"
          >
            {t("work.finishAndView")}
          </Link>
        </div>
      ) : (
        <div className="rounded-xl bg-white p-4 shadow">
          <h2 className="mb-3 text-center text-lg font-bold text-brand-800">
            {t("work.ligneTitle", { n: activeLigne.numero })}
          </h2>

          {activeLigne.valeurs.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {activeLigne.valeurs.map((v, i) => (
                <span
                  key={v.id}
                  className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-800"
                >
                  #{i + 1}: {v.valeur}
                </span>
              ))}
            </div>
          )}

          <input
            type="number"
            inputMode="decimal"
            autoFocus
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSuivant()}
            placeholder={t("work.placeholder")}
            className="mb-4 w-full rounded-lg border-2 border-brand-200 px-4 py-4 text-center text-2xl focus:border-brand-600 focus:outline-none"
          />

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleAnnuler}
              disabled={busy}
              className="rounded-md bg-red-50 px-4 py-3 font-medium text-red-600 hover:bg-red-100 disabled:opacity-60"
            >
              {t("work.cancel")}
            </button>
            <button
              onClick={handleRetour}
              disabled={busy}
              className="rounded-md bg-slate-100 px-4 py-3 font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-60"
            >
              {t("work.retour")}
            </button>
            <button
              onClick={handleSuivant}
              disabled={busy || inputValue === ""}
              className="rounded-md bg-brand-600 px-4 py-3 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {t("work.next")}
            </button>
            <button
              onClick={handleStop}
              disabled={busy}
              className="rounded-md bg-slate-800 px-4 py-3 font-medium text-white hover:bg-slate-900 disabled:opacity-60"
            >
              {t("work.stop")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
