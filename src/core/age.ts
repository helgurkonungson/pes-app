/**
 * Neutral age screen (ADR-023): the learner picks a birth year once, before connecting an AI
 * service; only the band is kept. AI providers set their own minimum ages in their terms.
 */
export type AgeGroup = "child" | "teen" | "adult";

/** Band for a birth year. Unknown birthday → the younger reading (an 18th birthday may not have passed yet). */
export function ageGroupFromYear(year: number, today = new Date()): AgeGroup {
  const age = today.getFullYear() - year - 1; // conservative: assume the birthday is still ahead
  if (age >= 18) return "adult";
  if (age >= 13) return "teen";
  return "child";
}

export function meetsMinAge(group: AgeGroup | undefined, minAge: 13 | 18): boolean {
  if (!group) return false;
  return minAge === 13 ? group !== "child" : group === "adult";
}

/** Years offered on the age screen, newest first. */
export function birthYears(today = new Date()): number[] {
  const y = today.getFullYear();
  return Array.from({ length: 100 }, (_, i) => y - i);
}
