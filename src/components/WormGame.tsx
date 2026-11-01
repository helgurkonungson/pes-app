/**
 * The waiting game (ADR-030; the calm "worm's garden" since 0.21): while a lesson is written the
 * learner can guide a worm through a garden seen from above. When the lesson is ready, an untouched
 * or finished game lets it open at once; during a round a banner offers "Open the lesson", so the
 * learner decides when to stop. `onDone` is called then.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { BIRD_WARN, H, hitNow, type ItemKind, LIVES_MAX, newGame, steer, step, W, WORM_R, WORM_Y, type GameState } from "../core/wormGame";
import { useT } from "../i18n";

const BEST_KEY = "pes.worm.best";
/**
 * Test switch for e2e tests: localStorage "pes.worm.calm" = "1" → no birds or moles, and
 * `window.__wormHold(true)` pauses the game while a round goes on; `window.__wormHit()` costs a life
 * at once (so a test can end a round without waiting).
 */
const calm = () => {
  try {
    return localStorage.getItem("pes.worm.calm") === "1";
  } catch {
    return false;
  }
};
const readBest = () => {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
};
const saveBest = (n: number) => {
  try {
    localStorage.setItem(BEST_KEY, String(n));
  } catch {
    /* private mode: the record lives for this round only */
  }
};

interface Palette {
  soil: string;
  soilDark: string;
  grass: string;
  worm: string;
  wormDark: string;
  book: string;
  bookDark: string;
  paper: string;
  paperLine: string;
  apple: string;
  mole: string;
  shadow: string;
  pupil: string;
  accent: string;
  bad: string;
}

function palette(el: Element): Palette {
  const cs = getComputedStyle(el);
  const v = (n: string) => cs.getPropertyValue(n).trim();
  return {
    soil: v("--soil"),
    soilDark: v("--soil-dark"),
    grass: v("--leaf"),
    worm: v("--worm"),
    wormDark: v("--worm-dark"),
    book: v("--book"),
    bookDark: v("--book-dark"),
    paper: v("--paper"),
    paperLine: v("--paper-line"),
    apple: v("--ribbon"),
    mole: v("--mole"),
    shadow: v("--game-shadow"),
    pupil: v("--on-accent"),
    accent: v("--accent"),
    bad: v("--bad"),
  };
}

/** Small deterministic noise for the garden's pebbles and tufts. */
const hash = (n: number) => {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
};

function drawGround(ctx: CanvasRenderingContext2D, s: GameState, p: Palette) {
  ctx.fillStyle = p.soil;
  ctx.fillRect(0, 0, W, H);
  // pebbles and darker patches, scrolling down with the ground
  const tile = 60;
  const off = s.scroll % tile;
  const row0 = Math.floor(s.scroll / tile);
  ctx.fillStyle = p.soilDark;
  for (let r = -1; r <= H / tile + 1; r++) {
    const row = row0 - r;
    for (let i = 0; i < 5; i++) {
      const x = hash(row * 13 + i) * W;
      const y = r * tile + off + hash(row * 7 + i * 3) * tile;
      ctx.beginPath();
      ctx.ellipse(x, y, 2 + hash(row + i) * 3, 1.5 + hash(row * 3 + i) * 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // grass along both edges, with tufts
  ctx.fillStyle = p.grass;
  ctx.fillRect(0, 0, 10, H);
  ctx.fillRect(W - 10, 0, 10, H);
  const g = 26;
  const goff = s.scroll % g;
  for (let y = -g + goff; y < H + g; y += g) {
    for (const side of [0, 1]) {
      const bx = side ? W - 10 : 10;
      const dir = side ? -1 : 1;
      ctx.beginPath();
      ctx.moveTo(bx, y);
      ctx.lineTo(bx + dir * 7, y + 5);
      ctx.lineTo(bx, y + 10);
      ctx.fill();
    }
  }
}

function drawItem(ctx: CanvasRenderingContext2D, kind: ItemKind, x: number, y: number, p: Palette) {
  if (kind === "page") {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.15);
    ctx.fillStyle = p.paper;
    ctx.fillRect(-7, -9, 14, 18);
    ctx.strokeStyle = p.paperLine;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-4, -5 + i * 4);
      ctx.lineTo(4, -5 + i * 4);
      ctx.stroke();
    }
    ctx.restore();
  } else if (kind === "book") {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(0.12);
    ctx.fillStyle = p.paper;
    ctx.fillRect(-8, -10, 17, 21);
    ctx.fillStyle = p.book;
    ctx.fillRect(-9, -11, 16, 21);
    ctx.fillStyle = p.bookDark;
    ctx.fillRect(-9, -11, 4, 21);
    ctx.restore();
  } else {
    ctx.fillStyle = p.apple;
    ctx.beginPath();
    ctx.arc(x - 3, y + 1, 7, 0, Math.PI * 2);
    ctx.arc(x + 3, y + 1, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = p.soilDark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - 5);
    ctx.lineTo(x + 1, y - 10);
    ctx.stroke();
    ctx.fillStyle = p.grass;
    ctx.beginPath();
    ctx.ellipse(x + 5, y - 9, 4, 2, -0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function draw(ctx: CanvasRenderingContext2D, s: GameState, trail: number[], p: Palette) {
  ctx.clearRect(0, 0, W, H);
  drawGround(ctx, s, p);

  for (const it of s.items) drawItem(ctx, it.kind, it.x, it.y, p);

  // moles: a mound that swells, then the mole looks out
  for (const m of s.moles) {
    const swell = 8 + Math.min(1, Math.max(0, (m.y + 30) / 260)) * 6;
    ctx.fillStyle = p.soilDark;
    ctx.beginPath();
    ctx.ellipse(m.x, m.y + 3, swell + 4, swell, 0, 0, Math.PI * 2);
    ctx.fill();
    // loose crumbs around the mound, so it never looks like a bird's shadow
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + m.id;
      ctx.beginPath();
      ctx.arc(m.x + Math.cos(a) * (swell + 9), m.y + 3 + Math.sin(a) * (swell + 5), 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    if (m.up > 0) {
      const r = 11 * m.up;
      ctx.fillStyle = p.mole;
      ctx.beginPath();
      ctx.arc(m.x, m.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = p.worm; // pink nose, pointing at the worm
      ctx.beginPath();
      ctx.arc(m.x, m.y + r * 0.75, 3 * m.up, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = p.pupil;
      ctx.beginPath();
      ctx.arc(m.x - 4 * m.up, m.y + 2 * m.up, 1.5, 0, Math.PI * 2);
      ctx.arc(m.x + 4 * m.up, m.y + 2 * m.up, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // birds: first a shadow growing on the ground, then a swoop past it
  for (const b of s.birds) {
    const k = Math.min(1, b.age / BIRD_WARN);
    if (!b.struck) {
      ctx.globalAlpha = 0.25 + k * 0.5;
      ctx.fillStyle = p.shadow;
      ctx.beginPath();
      ctx.ellipse(b.x, WORM_Y, 8 + k * 22, 5 + k * 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      const f = (b.age - BIRD_WARN) / 0.9; // 0…1 after the strike: the bird flies off up the screen
      const by = WORM_Y - f * 260;
      ctx.globalAlpha = 1 - f * 0.7;
      const flap = Math.sin(s.t * 18) * 6;
      ctx.fillStyle = p.bookDark;
      ctx.beginPath(); // wings
      ctx.moveTo(b.x, by);
      ctx.lineTo(b.x - 26, by + 4 + flap);
      ctx.lineTo(b.x - 4, by + 8);
      ctx.lineTo(b.x + 4, by + 8);
      ctx.lineTo(b.x + 26, by + 4 + flap);
      ctx.fill();
      ctx.fillStyle = p.book;
      ctx.beginPath();
      ctx.ellipse(b.x, by + 2, 7, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = p.accent; // beak
      ctx.beginPath();
      ctx.moveTo(b.x - 3, by - 10);
      ctx.lineTo(b.x, by - 16);
      ctx.lineTo(b.x + 3, by - 10);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // the worm: the head leads, the body follows the path it took
  const blink = s.safe > 0 && Math.floor(s.t * 10) % 2 === 0;
  ctx.globalAlpha = blink ? 0.35 : 1;
  const segs = 7;
  for (let i = segs - 1; i >= 0; i--) {
    const x = (trail[i * 3] ?? s.x) + (s.mode === "over" ? 0 : Math.sin(s.t * 4 - i * 0.9) * 1.6);
    const y = WORM_Y + i * 9;
    ctx.fillStyle = p.worm;
    ctx.beginPath();
    ctx.arc(x, y, WORM_R - i * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = p.wormDark;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  // eyes look the way it crawls
  const look = Math.max(-2, Math.min(2, ((s.target ?? s.x) - s.x) / 10));
  for (const dx of [-4, 4]) {
    if (s.mode === "over") {
      ctx.strokeStyle = p.pupil;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(s.x + dx - 2, WORM_Y - 5);
      ctx.lineTo(s.x + dx + 2, WORM_Y - 1);
      ctx.moveTo(s.x + dx + 2, WORM_Y - 5);
      ctx.lineTo(s.x + dx - 2, WORM_Y - 1);
      ctx.stroke();
    } else {
      ctx.fillStyle = p.paper;
      ctx.beginPath();
      ctx.arc(s.x + dx, WORM_Y - 3, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = p.pupil;
      ctx.beginPath();
      ctx.arc(s.x + dx + look * 0.6, WORM_Y - 4, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // a soft ring when something happens (picked up / apple / hit)
  if (s.event && s.t - s.event.at < 0.35) {
    const f = (s.t - s.event.at) / 0.35;
    ctx.globalAlpha = 1 - f;
    ctx.strokeStyle = s.event.kind === "hit" ? p.bad : s.event.kind === "apple" ? p.apple : p.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(s.x, WORM_Y, WORM_R + 4 + f * 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // lives: apples in the top left corner (empty places for the ones that can still be gained)
  if (s.mode !== "idle") {
    for (let i = 0; i < LIVES_MAX; i++) {
      ctx.globalAlpha = i < s.lives ? 1 : 0.22;
      drawItem(ctx, "apple", 26 + i * 20, 22, p);
    }
    ctx.globalAlpha = 1;
  }
}

export function WormGame({ ready = false, onDone, onPlay }: { ready?: boolean; onDone?: () => void; onPlay?: () => void }) {
  const t = useT();
  const canvas = useRef<HTMLCanvasElement>(null);
  const game = useRef<GameState>(newGame());
  const [mode, setMode] = useState<GameState["mode"]>("idle");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(game.current.lives);
  const [best, setBest] = useState(readBest);
  const overAt = useRef(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const playRef = useRef(onPlay);
  playRef.current = onPlay;

  /** Applies a change from input; tells the screen when a round starts. */
  const apply = useCallback((next: GameState) => {
    const prev = game.current;
    game.current = next;
    if (prev.mode !== "play" && next.mode === "play") {
      setMode("play");
      setScore(next.score);
      setLives(next.lives);
      playRef.current?.();
    }
  }, []);

  // the loop: one requestAnimationFrame, React re-renders only when the mode, score or lives change
  useEffect(() => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    c.width = W * dpr;
    c.height = H * dpr;
    ctx.scale(dpr, dpr);
    let pal = palette(c);
    const theme = new MutationObserver(() => (pal = palette(c)));
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const testing = calm();
    const opts = { hazards: !testing };
    let held = false;
    const w = window as unknown as { __wormHold?: (on: boolean) => void; __wormHit?: () => void };
    const hold = (on: boolean) => {
      held = on;
    };
    const hit = () => {
      game.current = hitNow(game.current);
    };
    if (testing) {
      w.__wormHold = hold;
      w.__wormHit = hit;
    }
    const trail: number[] = [];
    // what React last heard about (input and test switches change the game outside the loop)
    const shown = { mode: game.current.mode, score: game.current.score, lives: game.current.lives };
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const prev = game.current;
      const next = document.visibilityState === "visible" && !(held && prev.mode === "play") ? step(prev, dt, Math.random, opts) : prev;
      game.current = next;
      if (next.mode === "play" || trail.length === 0) {
        trail.unshift(next.x);
        if (trail.length > 24) trail.length = 24;
      }
      if (next.mode !== shown.mode) {
        if (next.mode === "over") overAt.current = now;
        shown.mode = next.mode;
        setMode(next.mode);
      }
      if (next.score !== shown.score) setScore((shown.score = next.score));
      if (next.lives !== shown.lives) setLives((shown.lives = next.lives));
      draw(ctx, next, next.mode === "idle" ? [] : trail, pal);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      theme.disconnect();
      if (w.__wormHold === hold) delete w.__wormHold;
      if (w.__wormHit === hit) delete w.__wormHit;
    };
  }, []);

  // a new record is kept once the round ends
  useEffect(() => {
    if (mode === "over" && score > best) {
      setBest(score);
      saveBest(score);
    }
  }, [mode, score, best]);

  // the lesson is ready: open it at once unless a round is on (then the banner offers it)
  useEffect(() => {
    if (!ready || mode === "play") return;
    const tm = setTimeout(() => doneRef.current?.(), mode === "over" ? 1400 : 0);
    return () => clearTimeout(tm);
  }, [ready, mode]);

  /** Garden x of a pointer event (the canvas is scaled to fit the screen). */
  const gardenX = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return ((e.clientX - r.left) / Math.max(1, r.width)) * W;
  };

  /** A touch on a finished round starts a new one (after a moment, so a late touch doesn't). */
  const restart = useCallback((): boolean => {
    if (game.current.mode !== "over") return false;
    if (ready || performance.now() - overAt.current < 500) return true;
    game.current = newGame();
    apply({ ...game.current, mode: "play" });
    return true;
  }, [ready, apply]);

  const dragging = useRef(false);

  return (
    <div className="worm-game">
      <button
        type="button"
        className="worm-canvas"
        aria-label={t("game.aria")}
        onPointerDown={(e) => {
          e.preventDefault();
          if (restart()) return;
          dragging.current = true;
          e.currentTarget.setPointerCapture?.(e.pointerId);
          apply(steer(game.current, gardenX(e)));
        }}
        onPointerMove={(e) => {
          if (dragging.current) apply(steer(game.current, gardenX(e)));
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
        onPointerCancel={() => {
          dragging.current = false;
        }}
        onKeyDown={(e) => {
          const g = game.current;
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            if (restart()) return;
            apply(steer(g, e.key === "ArrowLeft" ? -W : 2 * W));
          } else if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            if (restart()) return;
            apply(steer(g, null));
          }
        }}
        onKeyUp={(e) => {
          // releasing the arrow: the worm stops where it is
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") apply(steer(game.current, game.current.x));
        }}
      >
        <canvas ref={canvas} aria-hidden />
        {mode !== "idle" && (
          <span className="worm-score" aria-live="off">
            {score}
            <span className="sr-only">{t("game.lives", { n: lives })}</span>
          </span>
        )}
        {mode === "idle" && <span className="worm-hint low">{t("game.tap")}</span>}
        {mode === "over" && (
          <span className="worm-hint" role="status">
            <b>{t("game.over")}</b>
            <span>{t("game.result", { score, best: Math.max(best, score) })}</span>
            <span>{ready ? t("game.ready") : t("game.again")}</span>
          </span>
        )}
      </button>
      {ready && mode === "play" && (
        <div className="worm-ready" role="status">
          <p className="small">{t("game.readyPlaying")}</p>
          <button type="button" className="btn primary block" onClick={() => doneRef.current?.()}>
            {t("game.open")}
          </button>
        </div>
      )}
    </div>
  );
}
