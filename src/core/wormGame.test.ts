import { describe, expect, it } from "vitest";
import { birdSpeed, flap, FLAP_VY, GROUND, H, hits, newGame, outOfAir, SKY, step, W, WORM_R, WORM_X } from "./wormGame";

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

  it("flying into the sky ends the round like the ground; then the worm falls to the soil", () => {
    let s = flap(newGame());
    for (let i = 0; i < 120 && s.mode === "play"; i++) s = step(flap(s), 1 / 60, () => 0.99);
    expect(s.mode).toBe("over");
    expect(s.y).toBe(SKY + WORM_R);
    expect(s.vy).toBeGreaterThanOrEqual(0); // no more climbing
    for (let i = 0; i < 120; i++) s = step(s, 1 / 60);
    expect(s.y).toBe(GROUND - WORM_R);
    expect(outOfAir(H / 2)).toBe(false);
    expect(outOfAir(SKY + WORM_R)).toBe(true);
    expect(outOfAir(GROUND - WORM_R)).toBe(true);
  });

  it("steady taps keep the worm in the air: it hovers between the sky and the ground", () => {
    // a tap whenever the worm sinks below the middle (birds far up/down: rnd 0 → top lane)
    const s = run(flap(newGame()), 6, () => 0, (g) => g.y > H * 0.5 && g.vy > 0);
    expect(s.mode).toBe("play");
    expect(s.y).toBeGreaterThan(SKY + WORM_R);
    expect(s.y).toBeLessThan(GROUND - WORM_R);
  });

  it("birds always fly between the sky and the ground", () => {
    for (const r of [0, 0.5, 0.999]) {
      let s = { ...flap(newGame()), score: 20 };
      for (let i = 0; i < 6; i++) {
        s = { ...s, mode: "play" as const, y: H / 2, vy: 0, birds: [], nextBirdIn: 0 };
        s = step(s, 1 / 60, () => r);
        const b = s.birds[0];
        expect(b.baseY - b.amp).toBeGreaterThanOrEqual(SKY + 26);
        expect(b.baseY + b.amp).toBeLessThanOrEqual(GROUND - 26);
      }
    }
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

  it("without birds (test switch) the sky stays empty", () => {
    let s = flap(newGame());
    for (let i = 0; i < 180; i++) s = step(s.y > H * 0.5 && s.vy > 0 ? flap(s) : s, 1 / 60, () => 0.5, { birds: false });
    expect(s.mode).toBe("play");
    expect(s.birds).toHaveLength(0);
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
