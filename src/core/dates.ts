/** Local-calendar date helpers. Days are "YYYY-MM-DD" in the device's time zone. */

const pad = (n: number) => String(n).padStart(2, "0");

export function localDay(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDay(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(day: string, n: number): string {
  const d = parseDay(day);
  d.setDate(d.getDate() + n);
  return localDay(d);
}

export function daysBetween(a: string, b: string): number {
  const ms = parseDay(b).getTime() - parseDay(a).getTime();
  return Math.round(ms / 86_400_000);
}

/** Monday-first week containing `day`. */
export function weekOf(day: string): string[] {
  const d = parseDay(day);
  const offset = (d.getDay() + 6) % 7; // Mon=0 … Sun=6
  const monday = addDays(day, -offset);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function lastNDays(n: number, today: string = localDay()): string[] {
  return Array.from({ length: n }, (_, i) => addDays(today, i - n + 1));
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "October 2026" / "Октябрь 2026" — standalone month name. */
export function monthLabel(day: string, loc = "en-GB"): string {
  const d = parseDay(day);
  const month = new Intl.DateTimeFormat(loc, { month: "long" }).formatToParts(d).find((p) => p.type === "month")?.value ?? "";
  // East Slavic languages need the nominative ("октябрь", not "октября"): LLLL-style via a standalone format
  const standalone = /^(ru|uk|be)\b/.test(loc) ? new Intl.DateTimeFormat(loc, { month: "long", year: "numeric" }).format(d).replace(/\s*\d{4}.*$/, "") : month;
  return `${cap(standalone || month)} ${d.getFullYear()}`;
}

/** Narrow weekday name, Monday-first index (0 = Monday). */
export function weekdayLetter(index: number, loc = "en-GB"): string {
  // 2024-01-01 was a Monday
  const d = new Date(2024, 0, 1 + index);
  return cap(new Intl.DateTimeFormat(loc, { weekday: "narrow" }).format(d));
}

/** Short date like "23 Oct" / "23 окт." */
export function shortDate(day: string, loc = "en-GB"): string {
  return new Intl.DateTimeFormat(loc, { day: "numeric", month: "short" }).format(parseDay(day));
}

/** Long date for headers like "Friday, 23 October" / "пятница, 23 октября". */
export function longDate(day: string, loc = "en-GB"): string {
  return cap(new Intl.DateTimeFormat(loc, { weekday: "long", day: "numeric", month: "long" }).format(parseDay(day)));
}
