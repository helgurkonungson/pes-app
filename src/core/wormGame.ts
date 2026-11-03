/**
 * "Worm's garden" — the calm waiting game (ADR-030, redesigned in 0.21). Seen from above, the worm
 * crawls up a slowly scrolling garden; the learner steers it left and right (drag, tap, ←/→) to
 * gather pages and books (score) and apples (lives). Now and then a bird's shadow grows on the
 * ground before it swoops, and a mole's mound swells before it pops up: steer away from both.
 * A hit costs a life (3 at the start, 5 at most) and gives a moment of safety; since 1.0 a page or
 * a book that crawls past uncollected costs a life too (missed apples don't). No lives left ends
 * the round. Slow and forgiving on purpose — it should calm, not stress.
 * Pure and deterministic for a given random source, so it is unit tested; the canvas only draws.
 */
export const W = 320;
export const H = 360;
/** The worm's head stays on this line; the garden scrolls down past it. */
export const WORM_Y = H - 78;
export const WORM_R = 10;
export const ITEM_R = 11;
export const MOLE_R = 13;
/** How close (px) a bird's strike lands around its shadow's centre. */
export const BIRD_REACH = 24;
export const LIVES_START = 3;
export const LIVES_MAX = 5;
/** Side margin the worm keeps from the garden's edges. */
export const EDGE = 18;
/** Steering speed (px/s): the worm glides to where the finger is, never jumps. */
export const STEER_SPEED = 210;
/** Warning before a bird strikes: its shadow grows on the ground this long (s). */
export const BIRD_WARN = 2.2;
/** After a hit the worm blinks and can't be hit again for this long (s). */
export const SAFE_AFTER_HIT = 1.8;
/** A mole's mound turns into the mole when it is this far above the worm. */
export const MOLE_POP_AHEAD = 110;

export type ItemKind = "page" | "book" | "apple";
export const POINTS: Record<ItemKind, number> = { page: 1, book: 3, apple: 2 };

export interface Item {
  id: number;
  kind: ItemKind;
  x: number;
  y: number;
  /** Passed the worm uncollected (a page or a book: already cost its life). */
  missed?: boolean;
}

export interface Bird {
  id: number;
  x: number;
  /** Seconds since the shadow appeared; the strike comes at BIRD_WARN. */
  age: number;
  struck: boolean;
}

export interface Mole {
  id: number;
  x: number;
  y: number;
  /** 0 = only a mound, 1 = fully out. */
  up: number;
}

export interface GameState {
  mode: "idle" | "play" | "over";
  t: number;
  /** Time in the current round (s). */
  played: number;
  x: number;
  /** Where the learner steers to (null: keep going straight). */
  target: number | null;
  lives: number;
  score: number;
  /** Seconds of safety left after a hit. */
  safe: number;
  /** Ground scrolled so far (px) — the canvas draws the garden from it. */
  scroll: number;
  items: Item[];
  birds: Bird[];
  moles: Mole[];
  nextItemIn: number;
  nextBirdIn: number;
  nextMoleIn: number;
  nextId: number;
  /** Last thing that happened, for a short flash in the UI. */
  event: { kind: "pick" | "apple" | "hit" | "miss"; at: number } | null;
}

export function newGame(): GameState {
  return {
    mode: "idle",
    t: 0,
    played: 0,
    x: W / 2,
    target: null,
    lives: LIVES_START,
    score: 0,
    safe: 0,
    scroll: 0,
    items: [],
    birds: [],
    moles: [],
    nextItemIn: 0.6,
    nextBirdIn: 5,
    nextMoleIn: 9,
    nextId: 1,
    event: null,
  };
}

const clampX = (x: number) => Math.max(EDGE, Math.min(W - EDGE, x));

/** Starts a round (from idle); a finished round is restarted by the UI with a new game. */
export function start(s: GameState): GameState {
  return s.mode === "idle" ? { ...s, mode: "play" } : s;
}

/** Steer towards x (a finger or a click on the garden), or stop steering (null). Starts an idle round. */
export function steer(s: GameState, x: number | null): GameState {
  if (s.mode === "over") return s;
  return { ...start(s), target: x === null ? null : clampX(x) };
}

/** Ground speed (px/s): slow, a little quicker as the score grows, with a low cap. */
export const groundSpeed = (score: number) => Math.min(58 + score * 0.6, 92);

function pickKind(lives: number, r: number): ItemKind {
  // apples are rarer, and rarer still while the lives are full
  const apple = lives < LIVES_MAX ? 0.14 : 0.05;
  if (r < apple) return "apple";
  return r < apple + 0.3 ? "book" : "page";
}

/** A spot for a reward that isn't right on top of a mole. */
function freeX(moles: Mole[], rnd: () => number): number {
  for (let i = 0; i < 6; i++) {
    const x = EDGE + 6 + rnd() * (W - 2 * EDGE - 12);
    if (moles.every((m) => Math.abs(m.x - x) > 40 || m.y > 40)) return x;
  }
  return W / 2;
}

const near = (ax: number, ay: number, bx: number, by: number, r: number) => (ax - bx) ** 2 + (ay - by) ** 2 < r * r;

/**
 * Advances the game by `dt` seconds. `hazards: false` keeps birds and moles away (end-to-end tests
 * use it so a round lasts as long as they need).
 */
export function step(s: GameState, dt: number, rnd: () => number = Math.random, opts: { hazards?: boolean } = {}): GameState {
  dt = Math.min(dt, 0.05); // a dropped frame never teleports anything into the worm
  const t = s.t + dt;
  if (s.mode !== "play") {
    // idle: the worm wiggles in place; over: everything stops where it was
    return { ...s, t, x: s.mode === "idle" ? W / 2 + Math.sin(t * 1.4) * 10 : s.x };
  }
  const speed = groundSpeed(s.score);

  // steering: glide towards the target
  let x = s.x;
  if (s.target !== null) {
    const d = s.target - x;
    const max = STEER_SPEED * dt;
    x = clampX(Math.abs(d) <= max ? s.target : x + Math.sign(d) * max);
  }

  let { lives, score, nextId } = s;
  let safe = Math.max(0, s.safe - dt);
  let event = s.event;
  const hit = () => {
    if (safe > 0) return;
    lives--;
    safe = SAFE_AFTER_HIT;
    event = { kind: "hit", at: t };
  };

  // things on the ground scroll down past the worm
  const items: Item[] = [];
  for (const it of s.items) {
    const y = it.y + speed * dt;
    if (near(x, WORM_Y, it.x, y, WORM_R + ITEM_R)) {
      if (it.kind === "apple" && lives < LIVES_MAX) {
        lives++;
        event = { kind: "apple", at: t };
      } else {
        score += POINTS[it.kind];
        event = { kind: "pick", at: t };
      }
      continue;
    }
    // a page or a book left behind costs a life (1.0); not in the test mode without hazards
    let missed = it.missed;
    if (!missed && it.kind !== "apple" && y > WORM_Y + WORM_R + ITEM_R && opts.hazards !== false) {
      missed = true;
      lives--;
      event = { kind: "miss", at: t };
    }
    if (y < H + ITEM_R * 2) items.push({ ...it, y, missed });
  }

  const moles: Mole[] = [];
  for (const m of s.moles) {
    const y = m.y + speed * dt;
    // the mound comes first (a warning), the mole pops out only close to the worm's line
    const up = y >= WORM_Y - MOLE_POP_AHEAD ? Math.min(1, m.up + dt * 3) : 0;
    if (up >= 0.6 && near(x, WORM_Y, m.x, y, WORM_R + MOLE_R - 3)) hit();
    if (y < H + MOLE_R * 3) moles.push({ ...m, y, up });
  }

  const birds: Bird[] = [];
  for (const b of s.birds) {
    const age = b.age + dt;
    let struck = b.struck;
    if (!struck && age >= BIRD_WARN) {
      struck = true;
      if (Math.abs(x - b.x) < BIRD_REACH + WORM_R - 4) hit();
    }
    if (age < BIRD_WARN + 0.9) birds.push({ ...b, age, struck });
  }

  let nextItemIn = s.nextItemIn - dt;
  if (nextItemIn <= 0) {
    items.push({ id: nextId++, kind: pickKind(lives, rnd()), x: freeX(moles, rnd), y: -ITEM_R * 2 });
    nextItemIn = 0.9 + rnd() * 0.8;
  }
  let nextBirdIn = s.nextBirdIn - dt;
  let nextMoleIn = s.nextMoleIn - dt;
  if (opts.hazards !== false) {
    if (nextBirdIn <= 0) {
      // the shadow appears near the worm, so it is a real (but fair) threat
      birds.push({ id: nextId++, x: clampX(x + (rnd() - 0.5) * 120), age: 0, struck: false });
      nextBirdIn = Math.max(4.5, 8 - score * 0.04) + rnd() * 3;
    }
    if (nextMoleIn <= 0) {
      moles.push({ id: nextId++, x: clampX(EDGE + 10 + rnd() * (W - 2 * EDGE - 20)), y: -MOLE_R * 2, up: 0 });
      nextMoleIn = Math.max(5, 9 - score * 0.04) + rnd() * 4;
    }
  }

  return {
    ...s,
    mode: lives <= 0 ? "over" : "play",
    t,
    played: s.played + dt,
    x,
    lives: Math.max(0, lives),
    score,
    safe,
    scroll: s.scroll + speed * dt,
    items,
    birds,
    moles,
    nextItemIn,
    nextBirdIn,
    nextMoleIn,
    nextId,
    event,
  };
}

/** Test switch: a hit right now (end-to-end tests end a round without waiting for a bird). */
export function hitNow(s: GameState): GameState {
  if (s.mode !== "play") return s;
  const lives = s.lives - 1;
  return { ...s, lives: Math.max(0, lives), safe: SAFE_AFTER_HIT, mode: lives <= 0 ? "over" : "play", event: { kind: "hit", at: s.t } };
}
