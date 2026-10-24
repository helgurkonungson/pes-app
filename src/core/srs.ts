/**
 * Spaced repetition (Leitner boxes). Every question a learner answers in a lesson
 * becomes a card; a right answer moves it to the next box (longer interval), a wrong
 * answer or "I don't know" sends it back to box 0 (tomorrow). Pure functions.
 */
import { addDays } from "./dates";
import type { Card, Mcq } from "./types";

/** Days until the next review for each box. */
export const INTERVALS = [1, 3, 7, 14, 30, 60] as const;
export const MAX_BOX = INTERVALS.length - 1;

/** Every this many finished lessons the review step is an intermediate test. */
export const CHECKPOINT_EVERY = 5;

/** Stable fingerprint of a question (same text + options = same card). */
export function fingerprint(m: Pick<Mcq, "q" | "options" | "answer">): string {
  const src = `${m.q}|${[...m.options].sort().join("|")}|${m.options[m.answer]}`;
  let h = 5381;
  for (let i = 0; i < src.length; i++) h = ((h << 5) + h + src.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export function cardId(skillsetId: string, m: Mcq): string {
  return `${skillsetId}:${fingerprint(m)}`;
}

/** A card after one answer on `day`. A new card starts in box 0 (or 1 when answered right). */
export function review(card: Card | undefined, m: Mcq, skillsetId: string, right: boolean, day: string, now: string): Card {
  const base: Card = card ?? { id: cardId(skillsetId, m), skillsetId, mcq: cleanMcq(m), box: 0, due: day, seen: 0, lapses: 0, createdAt: now };
  // answering again on the same day (e.g. a lesson re-opened) doesn't move a card twice
  if (card && card.lastDay === day) return card;
  const box = right ? (card ? Math.min(MAX_BOX, card.box + 1) : 1) : 0;
  return {
    ...base,
    box,
    due: addDays(day, INTERVALS[box]),
    seen: base.seen + 1,
    lapses: base.lapses + (right || !card ? 0 : 1),
    lastDay: day,
  };
}

/** The question as stored on a card: without lesson-specific ids. */
function cleanMcq(m: Mcq): Mcq {
  const { ref: _ref, cardId: _c, ...rest } = m;
  return { ...rest, id: "card" };
}

/** Cards due on `day`, most urgent first (oldest due date, then lowest box, then most lapses). */
export function dueCards(cards: Card[], day: string): Card[] {
  return cards.filter((c) => c.due <= day).sort((a, b) => a.due.localeCompare(b.due) || a.box - b.box || b.lapses - a.lapses);
}

/** Questions for the review step from cards; each copy points back to its card. */
export function asReviewQuestions(cards: Card[], prefix = "sr"): Mcq[] {
  return cards.map((c, i) => ({ ...c.mcq, id: `${prefix}${i + 1}`, cardId: c.id }));
}

/**
 * Questions for an intermediate or final test: spread over topics, weaker cards first
 * but mastered ones included too (the point is to check what stuck).
 */
export function testCards(cards: Card[], count: number): Card[] {
  const byTopic = new Map<string, Card[]>();
  for (const c of [...cards].sort((a, b) => a.box - b.box || b.lapses - a.lapses)) {
    const t = c.mcq.topic ?? "";
    byTopic.set(t, [...(byTopic.get(t) ?? []), c]);
  }
  const out: Card[] = [];
  // round-robin over topics so one topic can't fill the test
  for (let round = 0; out.length < count; round++) {
    let added = false;
    for (const list of byTopic.values()) {
      if (list[round] && out.length < count) {
        out.push(list[round]);
        added = true;
      }
    }
    if (!added) break;
  }
  return out;
}

/** True when this lesson's review step should be an intermediate test. */
export function isCheckpoint(lessonsDone: number, cards: number): boolean {
  return lessonsDone > 0 && lessonsDone % CHECKPOINT_EVERY === 0 && cards >= 4;
}
