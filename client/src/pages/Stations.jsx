import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api";

export default function Stations() {
  const { t } = useTranslation();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  function load() {
    setLoading(true);
    api
      .get("/stations")
      .then(({ data }) => setStations(data.stations))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleCreate(e) {
    e.preventDefault();
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
    if (!confirm(t("stations.confirmDelete"))) return;
    await api.delete(`/stations/${id}`);
    load();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-4 text-xl font-bold text-slate-800">{t("stations.title")}</h1>

      <form onSubmit={handleCreate} className="mb-6 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("stations.newPlaceholder")}
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 focus:border-brand-600 focus:outline-none"
        />
        <button
          type="submit"
          disabled={creating}
          className="rounded-md bg-brand-700 px-4 py-2 font-medium text-white hover:bg-brand-800 disabled:opacity-60"
        >
          {t("stations.add")}
        </button>
      </form>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-slate-400">{t("app.loading")}</p>
      ) : stations.length === 0 ? (
        <p className="rounded-md bg-white p-6 text-center text-slate-400 shadow">
          {t("stations.empty")}
        </p>
      ) : (
        <ul className="space-y-2">
          {stations.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-md bg-white p-4 shadow-sm"
            >
              <Link to={`/stations/${s.id}`} className="flex-1">
                <p className="font-medium text-slate-800">{s.name}</p>
                <p className="text-xs text-slate-400">
                  {t("stations.parcelleCount", { count: s._count.parcelles })}
                </p>
              </Link>
              <button
                onClick={() => handleDelete(s.id)}
                className="ml-3 text-sm text-red-500 hover:underline"
              >
                {t("stations.delete")}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
