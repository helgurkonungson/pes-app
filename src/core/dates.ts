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

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

export function monthLabel(day: string): string {
  const d = parseDay(day);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function weekdayLetter(index: number): string {
  return WEEKDAYS[index] ?? "";
}

export function relativeDay(day: string, today: string = localDay()): string {
  const diff = daysBetween(day, today);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  const d = parseDay(day);
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}
