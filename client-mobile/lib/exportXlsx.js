import { Platform } from "react-native";
import * as XLSX from "xlsx";

function lignesToRows(lignes) {
  return lignes.flatMap((l) =>
    l.valeurs.length ? l.valeurs.map((v, i) => [l.numero, i + 1, v.valeur]) : [[l.numero, "", ""]]
  );
}

// Excel sheet names: max 31 chars, no \ / ? * [ ] :, can't be blank or a
// duplicate of another sheet in the same workbook.
function sanitizeSheetName(name, usedNames) {
  let safe = (name || "Parcelle").replace(/[\\/?*[\]:]/g, "_").slice(0, 31) || "Parcelle";
  let candidate = safe;
  let n = 2;
  while (usedNames.has(candidate)) {
    const suffix = ` (${n})`;
    candidate = safe.slice(0, 31 - suffix.length) + suffix;
    n += 1;
  }
  usedNames.add(candidate);
  return candidate;
}

async function writeAndShareWorkbook(wb, filenameBase) {
  const safeName = filenameBase.replace(/[^a-z0-9]+/gi, "_");

  if (Platform.OS === "web") {
    XLSX.writeFile(wb, `${safeName}.xlsx`, { bookType: "xlsx" });
    return null;
  }

  const { File, Paths } = await import("expo-file-system");
  const Sharing = await import("expo-sharing");

  const base64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
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

export async function exportLignesToXlsx({ lignes, parcelleName, sheetName, columns }) {
  const ws = XLSX.utils.aoa_to_sheet([columns, ...lignesToRows(lignes)]);
  ws["!cols"] = [{ wch: 8 }, { wch: 10 }, { wch: 10 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(sheetName, new Set()));
  return writeAndShareWorkbook(wb, parcelleName || "parcelle");
}

// One workbook, one sheet per parcelle, all for the same day — e.g. a
// station with parcelles SUN and SAVERA exports a single .xlsx with a
// "SUN" sheet and a "SAVERA" sheet, both scoped to the chosen date.
export async function exportStationToXlsx({ stationName, date, parcelles, columns }) {
  const wb = XLSX.utils.book_new();
  const usedNames = new Set();
  for (const p of parcelles) {
    const ws = XLSX.utils.aoa_to_sheet([columns, ...lignesToRows(p.lignes)]);
    ws["!cols"] = [{ wch: 8 }, { wch: 10 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(p.name, usedNames));
  }
  return writeAndShareWorkbook(wb, `${stationName || "station"}_${date}`);
}
