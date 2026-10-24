import { describe, expect, it } from "vitest";
import { asReviewQuestions, cardId, dueCards, INTERVALS, isCheckpoint, review, testCards } from "./srs";
import type { Card, Mcq } from "./types";

const m = (q: string, topic = "T"): Mcq => ({ id: "q1", q, options: ["a", "b", "c", "d"], answer: 1, explanation: "", topic });

describe("spaced repetition", () => {
  it("a new card: right → box 1 (in 3 days), wrong → box 0 (tomorrow)", () => {
    const right = review(undefined, m("A?"), "sk", true, "2026-10-01", "t");
    expect(right).toMatchObject({ box: 1, due: "2026-10-04", seen: 1, lapses: 0 });
    const wrong = review(undefined, m("B?"), "sk", false, "2026-10-01", "t");
    expect(wrong).toMatchObject({ box: 0, due: "2026-10-02", lapses: 0 });
    expect(right.id).toBe(cardId("sk", m("A?")));
  });
  it("climbs one box per right answer and falls to 0 on a mistake", () => {
    let c = review(undefined, m("A?"), "sk", true, "2026-10-01", "t");
    c = review(c, m("A?"), "sk", true, "2026-10-04", "t");
    expect(c).toMatchObject({ box: 2, due: `2026-10-${String(4 + INTERVALS[2]).padStart(2, "0")}` });
    c = review(c, m("A?"), "sk", false, "2026-10-11", "t");
    expect(c).toMatchObject({ box: 0, due: "2026-10-12", lapses: 1 });
  });
  it("answering again the same day does not move a card twice", () => {
    const c = review(undefined, m("A?"), "sk", true, "2026-10-01", "t");
    expect(review(c, m("A?"), "sk", true, "2026-10-01", "t")).toBe(c);
  });
  it("the same question gets the same card id regardless of option order", () => {
    const shuffled = { ...m("A?"), options: ["c", "b", "a", "d"], answer: 1 };
    expect(cardId("sk", shuffled)).toBe(cardId("sk", m("A?")));
  });
  it("due cards come most urgent first; review copies point to their cards", () => {
    const mk = (id: string, due: string, box: number): Card => ({ id, skillsetId: "sk", mcq: m(id), box, due, seen: 1, lapses: 0, createdAt: "t" });
    const due = dueCards([mk("a", "2026-10-05", 2), mk("b", "2026-10-03", 1), mk("c", "2026-10-09", 0), mk("d", "2026-10-03", 0)], "2026-10-05");
    expect(due.map((c) => c.id)).toEqual(["d", "b", "a"]);
    expect(asReviewQuestions(due)[0]).toMatchObject({ id: "sr1", cardId: "d" });
  });
  it("tests take questions round-robin over topics, weakest first", () => {
    const mk = (id: string, topic: string, box: number): Card => ({ id, skillsetId: "sk", mcq: m(id, topic), box, due: "x", seen: 1, lapses: 0, createdAt: "t" });
    const cards = [mk("a1", "A", 3), mk("a2", "A", 0), mk("a3", "A", 1), mk("b1", "B", 5), mk("c1", "C", 2)];
    expect(testCards(cards, 4).map((c) => c.id)).toEqual(["a2", "c1", "b1", "a3"]); // topics ordered by their weakest card
  });
  it("an intermediate test every 5 finished lessons (when there is enough to test)", () => {
    expect(isCheckpoint(5, 10)).toBe(true);
    expect(isCheckpoint(10, 10)).toBe(true);
    expect(isCheckpoint(4, 10)).toBe(false);
    expect(isCheckpoint(0, 10)).toBe(false);
    expect(isCheckpoint(5, 2)).toBe(false);
  });
});
