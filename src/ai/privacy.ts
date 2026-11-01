/**
 * Part of every AI instruction the app sends (lessons, placement, grading, web research):
 * Chompbook doesn't collect personal data, so the AI must neither ask for it nor work with it.
 * Chompbook AI's server adds the same rules again (api/src/logic.ts, PRIVACY_RULES).
 */
export const PRIVACY_RULE = [
  "PRIVACY (strict): do not request or process users' personal data.",
  "Never ask the learner for personal information (name, age, contacts, address, school or employer, documents, health, finances, photos or similar), and never write questions or tasks that require sharing it — open questions use made-up, hypothetical situations.",
  "If the source material or the learner's answer contains personal data of the learner or of other private people (names, phone numbers, e-mails, addresses, ID or account numbers, health details), do not repeat, collect, analyse or draw conclusions from it: leave it out and work only with the subject matter. Facts about public figures and historical persons that belong to the subject are fine.",
].join(" ");
