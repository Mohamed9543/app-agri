export function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Calendar dates like "2026-01-15" have no time-of-day, so every check here
// anchors to UTC midnight ("...T00:00:00Z") and reads back with UTC getters.
// Parsing/reading in local time instead (the previous version's bug) shifts
// the date by a day for any timezone with a non-zero UTC offset — e.g.
// "2026-01-15" was being rejected as invalid on this very machine.
export function isValidISODate(value) {
  if (!DATE_RE.test(value)) return false;
  const d = new Date(value + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

// aeb (Tunisian Darija) has no standard BCP-47 locale for the platform's
// date formatter, so it falls back to the plain ISO string rather than
// throwing or silently mis-formatting.
export function formatDisplayDate(isoDate, locale = "fr") {
  if (!isoDate) return "";
  const d = new Date(isoDate + "T00:00:00Z");
  try {
    return d.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
  } catch {
    return isoDate;
  }
}
