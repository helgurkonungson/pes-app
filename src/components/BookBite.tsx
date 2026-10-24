/**
 * Loading animation: the app's book gets eaten bite by bite (like the icon),
 * crumbs fly off at every bite, and once the book is finished a new one appears.
 * Decorative (aria-hidden): the screen's own status text says what is going on.
 */
import { useEffect, useId, useState } from "react";

type Circle = [cx: number, cy: number, r: number];

/** Each bite is a cluster of circles, like a scalloped tooth mark. Order: from the top-right corner leftwards. */
export const BITES: Circle[][] = [
  [[292, 56, 34], [262, 48, 22], [306, 90, 22]],
  [[302, 142, 40], [277, 121, 24], [288, 178, 26]],
  [[262, 208, 40], [231, 200, 24], [292, 212, 30]],
  [[214, 50, 38], [184, 46, 24], [241, 72, 26]],
  [[236, 132, 48], [206, 110, 30], [214, 168, 34], [266, 90, 30], [272, 180, 30]],
  [[166, 96, 52], [160, 160, 52], [132, 204, 36], [176, 44, 32], [206, 206, 32], [258, 58, 26], [160, 228, 22]],
  [[96, 70, 54], [60, 50, 36], [120, 122, 48]],
  [[72, 152, 62], [40, 108, 42], [102, 198, 46], [28, 192, 42]],
];

/** Outline of the whole book (cover included) — the bitten edges are drawn inside it. */
const SILHOUETTE = "M18 70 Q90 50 160 66 Q230 50 302 70 L302 212 Q230 194 160 216 Q90 194 18 212 Z";

const START_MS = 700;
const BITE_MS = 720;
const FINISHED_MS = 900;
const CENTER = { x: 160, y: 125 };

/** Crumbs for a bite: small paper flakes flying away from the book's centre. */
export function crumbsFor(bite: Circle[], seed: number): { x: number; y: number; dx: number; dy: number; rot: number; size: number; shade: boolean }[] {
  const [cx, cy] = bite[0];
  const base = Math.atan2(cy - CENTER.y, cx - CENTER.x);
  let s = seed * 9301 + 49297;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return Array.from({ length: 7 }, (_, i) => {
    const a = base + (i - 3) * 0.32 + (rnd() - 0.5) * 0.25;
    const dist = 34 + rnd() * 38;
    return { x: cx, y: cy, dx: Math.cos(a) * dist, dy: Math.sin(a) * dist + 26 + rnd() * 16, rot: (rnd() - 0.5) * 300, size: 4 + rnd() * 5, shade: i % 3 === 0 };
  });
}

function reducedMotion(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export function BookBite({ size = 220, bites: fixed }: { size?: number; /** Static frame (previews, tests). */ bites?: number }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  // bites taken so far; BITES.length = finished; -1 = a fresh book fading in
  const [state, setBites] = useState(() => (reducedMotion() ? 1 : 0));
  const bites = fixed ?? state;
  const [round, setRound] = useState(0);

  useEffect(() => {
    if (fixed !== undefined || reducedMotion()) return;
    const delay = bites === 0 ? START_MS : bites >= BITES.length ? FINISHED_MS : BITE_MS;
    const tm = setTimeout(() => {
      if (bites >= BITES.length) {
        setRound((r) => r + 1);
        setBites(0);
      } else setBites((b) => b + 1);
    }, delay);
    return () => clearTimeout(tm);
  }, [bites, fixed]);

  const finished = bites >= BITES.length;
  const last = bites > 0 ? BITES[bites - 1] : null;
  const crumbs = last && !reducedMotion() ? crumbsFor(last, bites + round * 13) : [];

  return (
    <svg className="book-bite" viewBox="0 0 320 250" width={size} height={(size * 250) / 320} aria-hidden="true" data-bites={bites}>
      <defs>
        <mask id={`bb-${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width="320" height="250">
          <rect x="0" y="0" width="320" height="250" fill="#fff" />
          {BITES.slice(0, bites).map((b, i) =>
            b.map(([cx, cy, r], j) => <circle key={`${i}-${j}`} className={i === bites - 1 ? "bb-new" : undefined} cx={cx} cy={cy} r={r} fill="#000" />),
          )}
        </mask>
        <clipPath id={`bbc-${id}`}>
          <path d={SILHOUETTE} />
        </clipPath>
      </defs>
      <ellipse className="bb-shadow" cx="160" cy="226" rx={finished ? 0 : 128} ry="9" />
      <g key={`${round}-${bites}`} className={`bb-book${bites > 0 && !finished ? " bb-chomp" : ""}${bites === 0 ? " bb-fresh" : ""}${finished ? " bb-gone" : ""}`} mask={`url(#bb-${id})`}>
        {/* cover with its thickness */}
        <path className="bb-cover-dark" d="M18 78 Q90 58 160 74 Q230 58 302 78 L302 212 Q230 194 160 216 Q90 194 18 212 Z" />
        <path className="bb-cover" d="M18 70 Q90 50 160 66 Q230 50 302 70 L302 204 Q230 186 160 208 Q90 186 18 204 Z" />
        <path className="bb-ribbon" d="M154 196 L166 196 L166 240 L160 233 L154 240 Z" />
        {/* stacked page edges */}
        <path className="bb-edge" d="M26 70 Q93 52 160 68 Q227 52 294 70 L294 198 Q227 182 160 202 Q93 182 26 198 Z" />
        <path className="bb-paper-shade" d="M28 64 Q94 46 160 62 Q226 46 292 64 L292 192 Q226 176 160 196 Q94 176 28 192 Z" />
        {/* pages */}
        <path className="bb-paper" d="M30 58 Q95 40 160 56 L160 190 Q95 172 30 186 Z" />
        <path className="bb-paper" d="M160 56 Q225 40 290 58 L290 186 Q225 172 160 190 Z" />
        <path className="bb-gutter" d="M148 54 Q154 55 160 56 L160 190 Q154 188 148 186 Z M160 56 Q166 55 172 54 L172 186 Q166 188 160 190 Z" />
        {/* a picture and text lines on the left page, heading and text on the right */}
        <path className="bb-pic" d="M46 66 Q86 56 132 64 L132 106 Q86 99 46 108 Z" />
        <path className="bb-hill" d="M46 108 Q70 84 96 86 Q118 88 132 100 L132 106 Q86 99 46 108 Z" />
        <circle className="bb-sun" cx="108" cy="78" r="8" />
        {[124, 140, 156].map((y, i) => (
          <path key={y} className="bb-line" d={`M48 ${y + 2} Q86 ${y - 6} ${i === 2 ? 104 : 130} ${y - 2}`} />
        ))}
        <path className="bb-heading" d="M182 72 Q214 64 244 66" />
        {[94, 110, 126, 142, 158].map((y, i) => (
          <path key={y} className="bb-line" d={`M182 ${y} Q228 ${y - 8} ${i === 4 ? 236 : 274} ${y - 4}`} />
        ))}
        {/* bitten edges show the stacked pages */}
        <g clipPath={`url(#bbc-${id})`}>
          {BITES.slice(0, bites).map((b, i) =>
            b.map(([cx, cy, r], j) => (
              <g key={`${i}-${j}`} className={i === bites - 1 ? "bb-new" : undefined}>
                <circle className="bb-rim" cx={cx} cy={cy} r={r + 5} />
                <circle className="bb-rim-line" cx={cx} cy={cy} r={r + 7} />
              </g>
            )),
          )}
        </g>
      </g>
      <g key={`c${round}-${bites}`}>
        {crumbs.map((c, i) => (
          <rect
            key={i}
            className={`bb-crumb${c.shade ? " shade" : ""}`}
            x={c.x - c.size / 2}
            y={c.y - c.size / 2}
            width={c.size}
            height={c.size * 0.8}
            rx={c.size * 0.25}
            style={{ ["--dx" as string]: `${c.dx}px`, ["--dy" as string]: `${c.dy}px`, ["--rot" as string]: `${c.rot}deg`, animationDelay: `${i * 18}ms` }}
          />
        ))}
      </g>
    </svg>
  );
}
