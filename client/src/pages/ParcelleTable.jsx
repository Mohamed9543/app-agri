import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import { api } from "../api";

export default function ParcelleTable() {
  const { t } = useTranslation();
  const { parcelleId } = useParams();
  const navigate = useNavigate();

  const [parcelle, setParcelle] = useState(null);
  const [lignes, setLignes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // valeur id being edited
  const [editValue, setEditValue] = useState("");

  function load() {
    setLoading(true);
    api
      .get(`/parcelles/${parcelleId}`)
      .then(({ data }) => {
        setParcelle(data.parcelle);
        setLignes(data.lignes);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [parcelleId]);

  async function handleDeleteLigne(id) {
    if (!confirm(t("table.confirmDeleteLigne"))) return;
    await api.delete(`/lignes/${id}`);
    load();
  }

  async function handleDeleteValeur(id) {
    if (!confirm(t("table.confirmDeleteValue"))) return;
    await api.delete(`/valeurs/${id}`);
    load();
  }

  function startEdit(v) {
    setEditing(v.id);
    setEditValue(String(v.valeur));
  }

  async function saveEdit(id) {
    const num = Number(editValue);
    if (Number.isNaN(num)) return;
    await api.put(`/valeurs/${id}`, { valeur: num });
    setEditing(null);
    load();
  }

  function handleExport() {
    const header = [t("table.colLigne"), t("table.colNumero"), t("table.colValeur")];
    const rows = lignes.flatMap((l) =>
      l.valeurs.length
        ? l.valeurs.map((v, i) => [l.numero, i + 1, v.valeur])
        : [[l.numero, "", ""]]
    );
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    ws["!cols"] = [{ wch: 8 }, { wch: 10 }, { wch: 10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t("table.sheetName"));
    const safeName = (parcelle?.name || "parcelle").replace(/[^a-z0-9]+/gi, "_");
    XLSX.writeFile(wb, `${safeName}.xlsx`, { bookType: "xlsx" });
  }

  if (loading) return <p className="p-6 text-slate-400">{t("app.loading")}</p>;
  if (!parcelle) return <p className="p-6 text-red-600">{error || t("table.notFound")}</p>;

  const totalValeurs = lignes.reduce((sum, l) => sum + l.valeurs.length, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <button onClick={() => navigate(-1)} className="mb-3 text-sm text-brand-700 hover:underline">
        {t("table.back")}
      </button>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-slate-800">
          {t("table.title", { name: parcelle.name })}
        </h1>
        <button
          onClick={handleExport}
          disabled={totalValeurs === 0}
          className="rounded-md bg-brand-700 px-4 py-2 font-medium text-white hover:bg-brand-800 disabled:opacity-40"
        >
          {t("table.download")}
        </button>
      </div>

      {lignes.length === 0 ? (
        <p className="rounded-md bg-white p-6 text-center text-slate-400 shadow">
          {t("table.empty")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-brand-800 text-left text-white">
                <th className="border border-brand-900/20 px-4 py-2">{t("table.colLigne")}</th>
                <th className="border border-brand-900/20 px-4 py-2">{t("table.colNumero")}</th>
                <th className="border border-brand-900/20 px-4 py-2">{t("table.colValeur")}</th>
                <th className="border border-brand-900/20 px-4 py-2">{t("table.colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l) =>
                l.valeurs.length > 0 ? (
                  l.valeurs.map((v, i) => (
                    <tr key={v.id} className="odd:bg-white even:bg-slate-50">
                      <td className="border border-slate-200 px-4 py-2 align-middle font-medium">
                        <div className="flex items-center gap-2">
                          {l.numero}
                          {i === 0 && (
                            <span
                              className={
                                "rounded-full px-2 py-0.5 text-[10px] font-normal " +
                                (l.status === "terminee"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-100 text-amber-700")
                              }
                            >
                              {l.status === "terminee" ? t("table.statusDone") : t("table.statusOngoing")}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="border border-slate-200 px-4 py-2">{i + 1}</td>
                      <td className="border border-slate-200 px-4 py-2">
                        {editing === v.id ? (
                          <input
                            autoFocus
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && saveEdit(v.id)}
                            onBlur={() => saveEdit(v.id)}
                            className="w-20 rounded border border-brand-400 px-1 text-center"
                          />
                        ) : (
                          <button onClick={() => startEdit(v)} className="font-medium hover:underline">
                            {v.valeur}
                          </button>
                        )}
                      </td>
                      <td className="border border-slate-200 px-4 py-2">
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleDeleteValeur(v.id)}
                            className="text-sm text-red-500 hover:underline"
                          >
                            {t("table.deleteValue")}
                          </button>
                          {i === 0 && (
                            <button
                              onClick={() => handleDeleteLigne(l.id)}
                              className="text-sm text-slate-500 hover:underline"
                            >
                              {t("table.deleteLigne")}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr key={l.id} className="odd:bg-white even:bg-slate-50">
                    <td className="border border-slate-200 px-4 py-2 font-medium">{l.numero}</td>
                    <td className="border border-slate-200 px-4 py-2 text-slate-400">—</td>
                    <td className="border border-slate-200 px-4 py-2 text-slate-400">—</td>
                    <td className="border border-slate-200 px-4 py-2">
                      <button
                        onClick={() => handleDeleteLigne(l.id)}
                        className="text-sm text-slate-500 hover:underline"
                      >
                        {t("table.deleteLigne")}
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
