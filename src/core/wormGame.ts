/**
 * "Worm vs birds" — a one-tap game to pass the time while a lesson is written (ADR-030).
 * Flappy-style: gravity pulls the worm down, a tap lifts it; birds fly in from the right
 * (some swoop up and down) and touching one — or the ground — ends the round. Pure and
 * deterministic for a given random source, so it is unit tested; the canvas only draws.
 */
export const W = 320;
export const H = 360;
export const GROUND = H - 34; // top of the soil strip
export const WORM_X = 78;
export const WORM_R = 11; // collision radius of the worm's head end
export const GRAVITY = 1250; // px/s²
export const FLAP_VY = -380; // px/s
const MAX_FALL = 520;
const BIRD_R = 15;

export interface Bird {
  id: number;
  x: number;
  /** Centre line the bird flies along. */
  baseY: number;
  y: number;
  /** Swoop: amplitude (px) and angular speed (rad/s); 0 = flies straight. */
  amp: number;
  freq: number;
  phase: number;
  passed: boolean;
}

export interface GameState {
  mode: "idle" | "play" | "over";
  t: number;
  y: number;
  vy: number;
  birds: Bird[];
  nextBirdIn: number;
  nextId: number;
  score: number;
}

export function newGame(): GameState {
  return { mode: "idle", t: 0, y: H * 0.45, vy: 0, birds: [], nextBirdIn: 0.9, nextId: 1, score: 0 };
}

/** A tap: starts a round (from idle), lifts the worm (in play). A finished round is restarted by the UI. */
export function flap(s: GameState): GameState {
  if (s.mode === "over") return s;
  return { ...s, mode: "play", vy: FLAP_VY };
}

/** Birds speed up with the score, up to a limit. */
export const birdSpeed = (score: number) => Math.min(150 + score * 6, 270);

function spawn(s: GameState, rnd: () => number): Bird {
  const swoop = s.score >= 3 && rnd() < Math.min(0.25 + s.score * 0.03, 0.6);
  const amp = swoop ? 24 + rnd() * 30 : 0;
  const margin = 26 + amp;
  const baseY = margin + rnd() * (GROUND - 2 * margin);
  return { id: s.nextId, x: W + BIRD_R + 10, baseY, y: baseY, amp, freq: 2 + rnd() * 1.5, phase: rnd() * Math.PI * 2, passed: false };
}

export function hits(y: number, b: Pick<Bird, "x" | "y">): boolean {
  const dx = b.x - WORM_X;
  const dy = b.y - y;
  const r = WORM_R + BIRD_R - 4; // a little forgiving
  return dx * dx + dy * dy < r * r;
}

/** Advances the game by `dt` seconds. Idle: the worm bobs in place. */
export function step(s: GameState, dt: number, rnd: () => number = Math.random): GameState {
  dt = Math.min(dt, 0.05); // a dropped frame never teleports the worm into a bird
  const t = s.t + dt;
  if (s.mode === "idle") return { ...s, t, y: H * 0.45 + Math.sin(t * 3) * 6 };
  if (s.mode === "over") {
    // the worm drops to the ground after a hit
    const vy = Math.min(s.vy + GRAVITY * dt, MAX_FALL);
    return { ...s, t, vy, y: Math.min(s.y + vy * dt, GROUND - WORM_R) };
  }
  const vy = Math.min(s.vy + GRAVITY * dt, MAX_FALL);
  let y = s.y + vy * dt;
  let v = vy;
  if (y < WORM_R) {
    y = WORM_R;
    v = 0;
  }
  const speed = birdSpeed(s.score);
  let score = s.score;
  const birds: Bird[] = [];
  for (const b of s.birds) {
    const x = b.x - speed * dt;
    if (x < -BIRD_R * 2) continue;
    const by = b.baseY + (b.amp ? Math.sin(t * b.freq + b.phase) * b.amp : 0);
    let passed = b.passed;
    if (!passed && x < WORM_X - WORM_R - BIRD_R) {
      passed = true;
      score++;
    }
    birds.push({ ...b, x, y: by, passed });
  }
  let nextBirdIn = s.nextBirdIn - dt;
  let nextId = s.nextId;
  if (nextBirdIn <= 0) {
    const b = spawn({ ...s, score }, rnd);
    birds.push(b);
    nextId++;
    nextBirdIn = Math.max(0.75, 1.45 - score * 0.03) + rnd() * 0.35;
  }
  const crashed = y >= GROUND - WORM_R || birds.some((b) => hits(y, b));
  return { mode: crashed ? "over" : "play", t, y: Math.min(y, GROUND - WORM_R), vy: crashed ? Math.max(v, 0) : v, birds, nextBirdIn, nextId, score };
}
