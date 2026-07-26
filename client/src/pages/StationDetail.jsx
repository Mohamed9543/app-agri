import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api";

export default function StationDetail() {
  const { t } = useTranslation();
  const { stationId } = useParams();
  const navigate = useNavigate();
  const [station, setStation] = useState(null);
  const [parcelles, setParcelles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [count, setCount] = useState("");
  const [names, setNames] = useState([]);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    api
      .get(`/stations/${stationId}`)
      .then(({ data }) => {
        setStation(data.station);
        setParcelles(data.parcelles);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [stationId]);

  function startAdd() {
    setShowAdd(true);
    setCount("");
    setNames([]);
  }

  function handleCountSubmit(e) {
    e.preventDefault();
    const n = parseInt(count, 10);
    if (!n || n < 1) return;
    setNames(
      Array.from({ length: n }, (_, i) =>
        t("stationDetail.defaultParcelleName", { n: parcelles.length + i + 1 })
      )
    );
  }

  async function handleSaveNames(e) {
    e.preventDefault();
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
    if (!confirm(t("stationDetail.confirmDeleteParcelle"))) return;
    await api.delete(`/parcelles/${id}`);
    load();
  }

  if (loading) return <p className="p-6 text-slate-400">{t("app.loading")}</p>;
  if (!station) return <p className="p-6 text-red-600">{error || t("stationDetail.notFound")}</p>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <button onClick={() => navigate("/")} className="mb-3 text-sm text-brand-700 hover:underline">
        {t("stationDetail.backToStations")}
      </button>
      <h1 className="mb-4 text-xl font-bold text-slate-800">{station.name}</h1>

      {!showAdd && (
        <button
          onClick={startAdd}
          className="mb-6 rounded-md bg-brand-700 px-4 py-2 font-medium text-white hover:bg-brand-800"
        >
          {t("stationDetail.addParcelles")}
        </button>
      )}

      {showAdd && names.length === 0 && (
        <form onSubmit={handleCountSubmit} className="mb-6 flex items-end gap-2 rounded-md bg-white p-4 shadow-sm">
          <div className="flex-1">
            <label className="mb-1 block text-sm text-slate-600">{t("stationDetail.countLabel")}</label>
            <input
              type="number"
              min="1"
              autoFocus
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-600 focus:outline-none"
            />
          </div>
          <button type="submit" className="rounded-md bg-brand-700 px-4 py-2 text-white hover:bg-brand-800">
            {t("stationDetail.next")}
          </button>
          <button
            type="button"
            onClick={() => setShowAdd(false)}
            className="rounded-md bg-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-300"
          >
            {t("stationDetail.cancel")}
          </button>
        </form>
      )}

      {showAdd && names.length > 0 && (
        <form onSubmit={handleSaveNames} className="mb-6 space-y-2 rounded-md bg-white p-4 shadow-sm">
          <p className="mb-2 text-sm text-slate-600">{t("stationDetail.nameEach")}</p>
          {names.map((n, i) => (
            <input
              key={i}
              required
              value={n}
              onChange={(e) => {
                const copy = [...names];
                copy[i] = e.target.value;
                setNames(copy);
              }}
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-600 focus:outline-none"
            />
          ))}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-brand-700 px-4 py-2 text-white hover:bg-brand-800 disabled:opacity-60"
            >
              {t("stationDetail.save")}
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="rounded-md bg-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-300"
            >
              {t("stationDetail.cancel")}
            </button>
          </div>
        </form>
      )}

      {parcelles.length === 0 ? (
        <p className="rounded-md bg-white p-6 text-center text-slate-400 shadow">
          {t("stationDetail.empty")}
        </p>
      ) : (
        <ul className="space-y-2">
          {parcelles.map((p) => (
            <li key={p.id} className="rounded-md bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">{p.name}</p>
                  <p className="text-xs text-slate-400">
                    {t("stationDetail.ligneCount", { count: p._count.lignes })}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteParcelle(p.id)}
                  className="text-sm text-red-500 hover:underline"
                >
                  {t("stationDetail.delete")}
                </button>
              </div>
              <div className="mt-3 flex gap-2">
                <Link
                  to={`/parcelles/${p.id}/travail`}
                  className="flex-1 rounded-md bg-brand-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-brand-700"
                >
                  {t("stationDetail.startWork")}
                </Link>
                <Link
                  to={`/parcelles/${p.id}/tableau`}
                  className="flex-1 rounded-md bg-slate-100 px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-200"
                >
                  {t("stationDetail.viewTable")}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
