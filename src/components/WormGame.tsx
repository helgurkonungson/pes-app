/**
 * The waiting game (ADR-030): while a lesson is written the learner can play "worm vs birds".
 * When the lesson is ready, a round in progress is played to the end (until the worm is hit);
 * an untouched or finished game lets the lesson open at once. `onDone` is called then.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { flap, GROUND, H, newGame, SKY, step, W, WORM_X, type GameState } from "../core/wormGame";
import { useT } from "../i18n";

const BEST_KEY = "pes.worm.best";
/**
 * Test switch for e2e tests: localStorage "pes.worm.calm" = "1" → no birds, and `window.__wormHold(true)`
 * pauses the physics while a round goes on (so a test can hold a round open for as long as it needs,
 * independent of the machine's speed); `__wormHold(false)` lets the worm fall again.
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
  sky: string;
  cloud: string;
  storm: string;
  stormDark: string;
  soil: string;
  soilDark: string;
  grass: string;
  worm: string;
  wormDark: string;
  bird: string;
  birdDark: string;
  beak: string;
  eye: string;
  pupil: string;
}

function palette(el: Element): Palette {
  const cs = getComputedStyle(el);
  const v = (n: string) => cs.getPropertyValue(n).trim();
  return {
    sky: v("--surface-2"),
    cloud: v("--surface-3"),
    storm: v("--storm"),
    stormDark: v("--storm-dark"),
    soil: v("--soil"),
    soilDark: v("--soil-dark"),
    grass: v("--leaf"),
    worm: v("--worm"),
    wormDark: v("--worm-dark"),
    bird: v("--book"),
    birdDark: v("--book-dark"),
    beak: v("--accent"),
    eye: v("--paper"),
    pupil: v("--on-accent"),
  };
}

function draw(ctx: CanvasRenderingContext2D, s: GameState, p: Palette) {
  ctx.clearRect(0, 0, W, H);
  // sky with a few slow clouds
  ctx.fillStyle = p.sky;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = p.cloud;
  for (let i = 0; i < 3; i++) {
    const x = ((W + 80) - ((s.t * (12 + i * 5) + i * 140) % (W + 160))) - 40;
    const y = 78 + i * 66;
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.arc(x + 16, y - 6, 18, 0, Math.PI * 2);
    ctx.arc(x + 34, y, 13, 0, Math.PI * 2);
    ctx.fill();
  }
  // the sky above: a band of heavy clouds — touching it ends the round, like the ground.
  // Its puffy lower edge reaches down to SKY and drifts left while playing.
  const drift = s.mode === "play" ? (s.t * 60) % 32 : 0;
  ctx.fillStyle = p.stormDark;
  ctx.fillRect(0, 0, W, SKY - 12);
  for (let x = -drift - 16; x < W + 32; x += 32) {
    ctx.beginPath();
    ctx.arc(x + 16, SKY - 12, 12, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = p.storm;
  ctx.fillRect(0, 0, W, SKY - 16);
  for (let x = -drift - 16; x < W + 32; x += 32) {
    ctx.beginPath();
    ctx.arc(x + 16, SKY - 15, 11, 0, Math.PI * 2);
    ctx.arc(x + 32, SKY - 20, 9, 0, Math.PI * 2);
    ctx.fill();
  }

  // soil with grass and pebbles moving left
  ctx.fillStyle = p.soil;
  ctx.fillRect(0, GROUND, W, H - GROUND);
  ctx.fillStyle = p.grass;
  ctx.fillRect(0, GROUND, W, 5);
  ctx.fillStyle = p.soilDark;
  const shift = s.mode === "play" ? (s.t * 150) % 40 : 0;
  for (let x = -shift; x < W + 40; x += 40) {
    ctx.beginPath();
    ctx.arc(x + 10, GROUND + 15, 3, 0, Math.PI * 2);
    ctx.arc(x + 28, GROUND + 25, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // birds
  for (const b of s.birds) {
    const flapUp = Math.sin(s.t * 16 + b.id) > 0;
    ctx.fillStyle = p.birdDark;
    ctx.beginPath(); // wing
    ctx.moveTo(b.x - 2, b.y - 2);
    ctx.lineTo(b.x + 14, b.y + (flapUp ? -20 : 14));
    ctx.lineTo(b.x + 10, b.y + 2);
    ctx.fill();
    ctx.fillStyle = p.bird;
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, 16, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = p.beak; // beak points at the worm
    ctx.beginPath();
    ctx.moveTo(b.x - 14, b.y - 4);
    ctx.lineTo(b.x - 26, b.y + 1);
    ctx.lineTo(b.x - 14, b.y + 5);
    ctx.fill();
    ctx.fillStyle = p.eye;
    ctx.beginPath();
    ctx.arc(b.x - 6, b.y - 4, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = p.pupil;
    ctx.beginPath();
    ctx.arc(b.x - 7.5, b.y - 3.5, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = p.pupil; // a frown
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(b.x - 11, b.y - 10);
    ctx.lineTo(b.x - 2, b.y - 8);
    ctx.stroke();
  }

  // the worm: segments trail behind the head and wiggle; it tilts with its speed
  const tilt = Math.max(-1, Math.min(1, s.vy / 400));
  const segs = [11, 10, 9, 8, 7, 6];
  for (let i = segs.length - 1; i >= 0; i--) {
    const x = WORM_X - i * 8.5;
    const y = s.y + i * tilt * 5 + Math.sin(s.t * 9 - i * 0.9) * (s.mode === "over" ? 0 : 2.5) * (i / 3);
    ctx.fillStyle = p.worm;
    ctx.beginPath();
    ctx.arc(x, y, segs[i], 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = p.wormDark;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  // face
  const ex = WORM_X + 3;
  const ey = s.y - 3;
  if (s.mode === "over") {
    ctx.strokeStyle = p.pupil;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ex - 3, ey - 3);
    ctx.lineTo(ex + 3, ey + 3);
    ctx.moveTo(ex + 3, ey - 3);
    ctx.lineTo(ex - 3, ey + 3);
    ctx.stroke();
  } else {
    ctx.fillStyle = p.eye;
    ctx.beginPath();
    ctx.arc(ex, ey, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = p.pupil;
    ctx.beginPath();
    ctx.arc(ex + 1.2, ey + (s.vy < 0 ? -1 : 0.8), 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function WormGame({ ready = false, onDone, onPlay }: { ready?: boolean; onDone?: () => void; onPlay?: () => void }) {
  const t = useT();
  const canvas = useRef<HTMLCanvasElement>(null);
  const game = useRef<GameState>(newGame());
  const [mode, setMode] = useState<GameState["mode"]>("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(readBest);
  const overAt = useRef(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  // the loop: one requestAnimationFrame, React re-renders only when the mode or score changes
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
    const opts = { birds: !testing };
    let held = false;
    const w = window as unknown as { __wormHold?: (on: boolean) => void };
    const hold = (on: boolean) => {
      held = on;
    };
    if (testing) w.__wormHold = hold;
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const prev = game.current;
      const next = document.visibilityState === "visible" && !(held && prev.mode === "play") ? step(prev, dt, Math.random, opts) : prev;
      game.current = next;
      if (next.mode !== prev.mode) {
        if (next.mode === "over") overAt.current = now;
        setMode(next.mode);
      }
      if (next.score !== prev.score) setScore(next.score);
      draw(ctx, next, pal);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      theme.disconnect();
      if (w.__wormHold === hold) delete w.__wormHold;
    };
  }, []);

  // a new record is kept once the round ends
  useEffect(() => {
    if (mode === "over" && score > best) {
      setBest(score);
      saveBest(score);
    }
  }, [mode, score, best]);

  // the lesson is ready: wait for the round to end, then hand over
  useEffect(() => {
    if (!ready || mode === "play") return;
    const tm = setTimeout(() => doneRef.current?.(), mode === "over" ? 1400 : 0);
    return () => clearTimeout(tm);
  }, [ready, mode]);

  const tap = useCallback(() => {
    const g = game.current;
    if (g.mode === "over") {
      // ready: the lesson opens; otherwise a moment's pause so a late tap doesn't restart at once
      if (ready || performance.now() - overAt.current < 500) return;
      game.current = flap({ ...newGame(), mode: "play" });
      setScore(0);
      setMode("play");
      onPlay?.();
      return;
    }
    game.current = flap(g);
    if (g.mode === "idle") {
      setMode("play");
      onPlay?.();
    }
  }, [ready, onPlay]);

  return (
    <div className="worm-game">
      <button
        type="button"
        className="worm-canvas"
        aria-label={t("game.aria")}
        onPointerDown={(e) => {
          e.preventDefault();
          tap();
        }}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter" || e.key === "ArrowUp") {
            e.preventDefault();
            tap();
          }
        }}
      >
        <canvas ref={canvas} aria-hidden />
        {mode !== "idle" && (
          <span className="worm-score" aria-live="off">
            {score}
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
        <p className="worm-ready small" role="status">
          {t("game.readyPlaying")}
        </p>
      )}
    </div>
  );
}
