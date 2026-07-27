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

// Same locale-safety concern as formatDisplayDate, plus aeb has no ICU data
// at all, so it always falls back to the numeric "MM/YYYY" form.
export function monthYearLabel(year, month, locale = "fr") {
  const d = new Date(Date.UTC(year, month, 1));
  try {
    return d.toLocaleDateString(locale, { year: "numeric", month: "long", timeZone: "UTC" });
  } catch {
    return `${String(month + 1).padStart(2, "0")}/${year}`;
  }
}

// Monday-first 6x7 grid (nulls for the leading/trailing blanks) of a given
// month, entirely in UTC so it can't drift a day depending on the viewer's
// timezone.
export function getMonthGrid(year, month) {
  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const startWeekday = (firstOfMonth.getUTCDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ day, iso });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
