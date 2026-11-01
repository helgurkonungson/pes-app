import { describe, expect, it } from "vitest";
import { BIRD_WARN, EDGE, groundSpeed, hitNow, ITEM_R, LIVES_MAX, LIVES_START, MOLE_POP_AHEAD, newGame, SAFE_AFTER_HIT, start, steer, step, W, WORM_Y, type GameState } from "./wormGame";

const seq = (...v: number[]) => {
  let i = 0;
  return () => v[i++ % v.length];
};
const run = (s: GameState, seconds: number, rnd: () => number = seq(0.5), opts: { hazards?: boolean } = {}) => {
  for (let t = 0; t < seconds && s.mode !== "over"; t += 1 / 60) s = step(s, 1 / 60, rnd, opts);
  return s;
};
/** A round with nothing spawning by itself, so a test places exactly what it needs. */
const quiet = (s: GameState): GameState => ({ ...start(s), nextItemIn: 1e9, nextBirdIn: 1e9, nextMoleIn: 1e9 });

describe("worm's garden — the calm waiting game", () => {
  it("waits for the first touch; steering starts the round and the worm glides, never jumps", () => {
    let s = run(newGame(), 3);
    expect(s.mode).toBe("idle");
    expect(s.lives).toBe(LIVES_START);
    s = steer(s, W - 40);
    expect(s.mode).toBe("play");
    const x0 = s.x;
    s = step(s, 1 / 60);
    expect(s.x - x0).toBeGreaterThan(0);
    expect(s.x - x0).toBeLessThan(5); // a glide, not a teleport
    s = run(s, 2);
    expect(s.x).toBe(W - 40);
    expect(steer(s, -500).target).toBe(EDGE); // kept inside the garden
    expect(steer(s, null).target).toBeNull();
  });

  it("pages and books add to the score, apples give lives up to five", () => {
    let s = quiet(newGame());
    s = { ...s, items: [{ id: 1, kind: "page", x: s.x, y: WORM_Y - 30 }, { id: 2, kind: "book", x: s.x, y: WORM_Y - 70 }] };
    s = run(s, 1.5);
    expect(s.score).toBe(4);
    expect(s.items).toHaveLength(0);
    s = { ...s, items: [{ id: 3, kind: "apple", x: s.x, y: WORM_Y - 20 }] };
    s = run(s, 0.6);
    expect(s.lives).toBe(LIVES_START + 1);
    s = { ...s, lives: LIVES_MAX, items: [{ id: 4, kind: "apple", x: s.x, y: WORM_Y - 20 }] };
    s = run(s, 0.6);
    expect(s.lives).toBe(LIVES_MAX); // never above the maximum…
    expect(s.score).toBe(6); // …a spare apple counts as points
  });

  it("things the worm misses scroll away", () => {
    let s = quiet(newGame());
    s = { ...s, items: [{ id: 1, kind: "page", x: s.x + 100, y: WORM_Y }] };
    s = run(s, 3);
    expect(s.items).toHaveLength(0);
    expect(s.score).toBe(0);
  });

  it("a bird's shadow warns first; staying under it costs a life, moving away doesn't", () => {
    let s = quiet(newGame());
    s = { ...s, birds: [{ id: 1, x: s.x, age: 0, struck: false }] };
    s = run(s, BIRD_WARN - 0.1);
    expect(s.lives).toBe(LIVES_START); // only the shadow so far
    s = run(s, 0.3);
    expect(s.lives).toBe(LIVES_START - 1);
    expect(s.safe).toBeGreaterThan(0);

    let d = quiet(newGame());
    d = { ...d, birds: [{ id: 1, x: d.x, age: 0, struck: false }] };
    d = steer(d, d.x + 90);
    d = run(d, BIRD_WARN + 0.5);
    expect(d.lives).toBe(LIVES_START);
  });

  it("a mole is a mound until it is close, then pops out; bumping into it costs a life", () => {
    let s = quiet(newGame());
    s = { ...s, moles: [{ id: 1, x: s.x, y: 0, up: 0 }] };
    s = run(s, 0.5);
    expect(s.moles[0].up).toBe(0); // far away: just a mound
    while (s.moles[0] && s.moles[0].y < WORM_Y - MOLE_POP_AHEAD + 5) s = step(s, 1 / 60);
    s = run(s, 0.4);
    expect(s.moles[0].up).toBeGreaterThan(0.6);
    s = run(s, 3);
    expect(s.lives).toBe(LIVES_START - 1);
  });

  it("a hit gives a moment of safety; the last life ends the round, and everything stops", () => {
    let s = quiet(newGame());
    s = hitNow(s);
    expect(s.lives).toBe(LIVES_START - 1);
    s = { ...s, birds: [{ id: 1, x: s.x, age: BIRD_WARN - 0.05, struck: false }] };
    s = run(s, 0.2);
    expect(s.lives).toBe(LIVES_START - 1); // still safe
    s = run(s, SAFE_AFTER_HIT);
    s = hitNow(hitNow(s));
    expect(s.mode).toBe("over");
    expect(s.lives).toBe(0);
    const frozen = run(s, 1);
    expect(frozen.scroll).toBe(s.scroll);
    expect(steer(s, 10)).toBe(s); // touching doesn't revive it
  });

  it("calm pace: slow ground with a low cap, gaps between hazards, none in test mode", () => {
    expect(groundSpeed(0)).toBeLessThan(70);
    expect(groundSpeed(10_000)).toBe(92);
    const s = run(start(newGame()), 60, seq(0.1, 0.9, 0.5, 0.3, 0.7));
    expect(s.score).toBeGreaterThanOrEqual(0);
    const calm = run(start(newGame()), 30, seq(0.5), { hazards: false });
    expect(calm.birds).toHaveLength(0);
    expect(calm.moles).toHaveLength(0);
    expect(calm.items.length).toBeGreaterThan(0);
    expect(calm.items.every((i) => i.x >= EDGE && i.x <= W - EDGE && i.y <= 400 + ITEM_R)).toBe(true);
  });
});
