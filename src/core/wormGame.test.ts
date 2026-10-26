import { describe, expect, it } from "vitest";
import { birdSpeed, flap, FLAP_VY, GROUND, H, hits, newGame, step, W, WORM_R, WORM_X } from "./wormGame";

const seq = (...v: number[]) => {
  let i = 0;
  return () => v[i++ % v.length];
};
const run = (s: ReturnType<typeof newGame>, seconds: number, rnd = seq(0.5), tap?: (s: ReturnType<typeof newGame>) => boolean) => {
  for (let t = 0; t < seconds && s.mode !== "over"; t += 1 / 60) {
    if (tap?.(s)) s = flap(s);
    s = step(s, 1 / 60, rnd);
  }
  return s;
};

describe("worm vs birds", () => {
  it("idles until the first tap, then gravity pulls and a tap lifts", () => {
    let s = run(newGame(), 3);
    expect(s.mode).toBe("idle");
    expect(Math.abs(s.y - H * 0.45)).toBeLessThanOrEqual(6);
    s = flap(s);
    expect(s.mode).toBe("play");
    expect(s.vy).toBe(FLAP_VY);
    const y0 = s.y;
    s = step(s, 0.1);
    expect(s.y).toBeLessThan(y0); // still going up
    s = run(s, 0.5);
    expect(s.vy).toBeGreaterThan(0); // falling again
  });

  it("falling into the ground ends the round; the worm lies on the soil", () => {
    const s = run(flap(newGame()), 5);
    expect(s.mode).toBe("over");
    expect(s.y).toBe(GROUND - WORM_R);
    expect(flap(s)).toBe(s); // a tap doesn't revive it
  });

  it("can't fly off the top", () => {
    let s = flap(newGame());
    for (let i = 0; i < 120; i++) s = step(flap(s), 1 / 60, () => 0.99);
    expect(s.y).toBeGreaterThanOrEqual(WORM_R);
  });

  it("birds fly in from the right and each one passed scores a point; a bird in the worm's way ends the round", () => {
    // keep the worm hovering near the middle; birds at the very top (rnd 0) can't touch it
    const hover = (s: ReturnType<typeof newGame>) => s.y > H * 0.45 && s.vy > 0;
    const s = run(flap(newGame()), 8, () => 0, hover);
    expect(s.mode).toBe("play");
    expect(s.score).toBeGreaterThanOrEqual(3);
    expect(s.birds.every((b) => b.x <= W + 40)).toBe(true);
    // a bird right on the worm
    expect(hits(100, { x: WORM_X + 5, y: 104 })).toBe(true);
    expect(hits(100, { x: WORM_X + 60, y: 100 })).toBe(false);
    const crash = step({ ...flap(newGame()), y: 150, vy: 0, birds: [{ id: 1, x: WORM_X + 2, baseY: 150, y: 150, amp: 0, freq: 0, phase: 0, passed: false }] }, 1 / 60);
    expect(crash.mode).toBe("over");
  });

  it("gets harder with the score, up to a limit", () => {
    expect(birdSpeed(0)).toBeLessThan(birdSpeed(10));
    expect(birdSpeed(1000)).toBe(270);
  });

  it("a long frame is clamped", () => {
    const s = step({ ...flap(newGame()), vy: 0 }, 2);
    expect(s.t).toBeCloseTo(0.05);
  });
});
