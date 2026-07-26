import * as XLSX from "xlsx";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

export async function exportLignesToXlsx({ lignes, parcelleName, sheetName, columns }) {
  const rows = lignes.flatMap((l) =>
    l.valeurs.length ? l.valeurs.map((v, i) => [l.numero, i + 1, v.valeur]) : [[l.numero, "", ""]]
  );
  const ws = XLSX.utils.aoa_to_sheet([columns, ...rows]);
  ws["!cols"] = [{ wch: 8 }, { wch: 10 }, { wch: 10 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const base64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });

  const safeName = (parcelleName || "parcelle").replace(/[^a-z0-9]+/gi, "_");
  const file = new File(Paths.cache, `${safeName}.xlsx`);
  if (file.exists) file.delete();
  file.create();
  file.write(base64, { encoding: "base64" });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(file.uri, {
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      dialogTitle: safeName,
    });
  }
  return file.uri;
}
