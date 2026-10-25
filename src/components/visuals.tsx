/** Rings, hero artwork, chart, markdown and badge icons. */
import {
  Award, BookOpenCheck, Brain, Flame, Footprints, Layers, Medal, Repeat, Target, Timer, Zap,
  type LucideIcon,
} from "lucide-react";
import { Fragment, type ReactNode } from "react";

// ---------- concentric rings ----------

export function Rings({ values, size = 128, stroke = 13 }: { values: number[]; size?: number; stroke?: number }) {
  const gap = 4;
  const c = size / 2;
  return (
    <svg className="rings" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <defs>
        <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" style={{ stopColor: "var(--accent-light)" }} />
          <stop offset="55%" style={{ stopColor: "var(--accent)" }} />
          <stop offset="100%" style={{ stopColor: "var(--accent-strong)" }} />
        </linearGradient>
      </defs>
      {values.map((v, i) => {
        const r = c - stroke / 2 - i * (stroke + gap);
        if (r <= stroke / 2) return null;
        const len = 2 * Math.PI * r;
        const val = Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
        return (
          <g key={i} transform={`rotate(-90 ${c} ${c})`}>
            <circle cx={c} cy={c} r={r} fill="none" style={{ stroke: "var(--track)" }} strokeWidth={stroke} />
            {val > 0 && (
              <circle
                cx={c}
                cy={c}
                r={r}
                fill="none"
                stroke="url(#ringGrad)"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${Math.max(0.001, val * len)} ${len}`}
                style={{ transition: "stroke-dasharray .6s ease" }}
                opacity={1 - i * 0.12}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function ScoreRing({ score, max = 10 }: { score: number; max?: number }) {
  return (
    <div className="score-ring">
      <Rings values={[score / max]} size={92} stroke={10} />
      <div className="n">{score}</div>
    </div>
  );
}

// ---------- hero artwork ----------

/** Generated cover for a skillset: a clean hue gradient with a soft shade at the bottom (no pattern, no watermark). */
export function HeroBg({ hue, big }: { hue: number; name?: string; big?: boolean }) {
  const a = `hsl(${hue} 58% 52%)`;
  const b = `hsl(${(hue + 28) % 360} 46% 30%)`;
  const id = `g${hue}${big ? "b" : "s"}`;
  return (
    <svg className="hero-bg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={a} />
          <stop offset="100%" stopColor={b} />
        </linearGradient>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="40%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#${id})`} />
      <rect width="400" height="300" fill={`url(#${id}s)`} />
    </svg>
  );
}

// ---------- line chart ----------

export function LineChart({ values, labels, height = 120 }: { values: number[]; labels?: string[]; height?: number }) {
  const w = 320;
  const h = height;
  const max = Math.max(1, ...values);
  const n = values.length;
  const pts = values.map((v, i) => [n === 1 ? w / 2 : (i / (n - 1)) * (w - 16) + 8, h - 14 - (v / max) * (h - 30)] as const);
  // smooth path (Catmull-Rom → Bézier)
  let d = pts.length ? `M ${pts[0][0]} ${pts[0][1]}` : "";
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${p2[0]} ${p2[1]}`;
  }
  const last = pts[pts.length - 1];
  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} aria-hidden>
        <line x1="8" x2={w - 8} y1={h - 14} y2={h - 14} style={{ stroke: "var(--chart-grid)" }} strokeDasharray="2 5" />
        <path d={d} fill="none" style={{ stroke: "var(--chart-line)" }} strokeWidth="2.5" strokeLinecap="round" />
        {last && <circle cx={last[0]} cy={last[1]} r="5" style={{ fill: "var(--accent)", stroke: "var(--bg)" }} strokeWidth="2" />}
      </svg>
      {labels && (
        <div className="chart-axis">
          {labels.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- markdown (safe subset, no HTML) ----------

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("**")) out.push(<strong key={k++}>{t.slice(2, -2)}</strong>);
    else if (t.startsWith("`")) out.push(<code key={k++}>{t.slice(1, -1)}</code>);
    else out.push(<em key={k++}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ text }: { text: string }) {
  const lines = text.replace(/\r/g, "").split("\n");
  const blocks: ReactNode[] = [];
  let para: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  const flushPara = () => {
    if (para.length) blocks.push(<p key={blocks.length}>{inline(para.join(" "))}</p>);
    para = [];
  };
  const flushList = () => {
    if (list) {
      const items = list.items.map((it, i) => <li key={i}>{inline(it)}</li>);
      blocks.push(list.ordered ? <ol key={blocks.length}>{items}</ol> : <ul key={blocks.length}>{items}</ul>);
    }
    list = null;
  };
  for (const raw of lines) {
    const line = raw.trim();
    const ul = line.match(/^[-*•]\s+(.*)$/);
    const ol = line.match(/^\d+[.)]\s+(.*)$/);
    const h = line.match(/^#{1,4}\s+(.*)$/);
    if (!line) {
      flushPara();
      flushList();
    } else if (h) {
      flushPara();
      flushList();
      blocks.push(
        <p key={blocks.length}>
          <strong>{h[1]}</strong>
        </p>,
      );
    } else if (ul || ol) {
      flushPara();
      const ordered = !!ol;
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push((ul ?? ol)![1]);
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return <div className="prose">{blocks.map((b, i) => <Fragment key={i}>{b}</Fragment>)}</div>;
}

// ---------- badge icons ----------

const BADGE_ICONS: Record<string, LucideIcon> = {
  target: Target,
  footprints: Footprints,
  flame: Flame,
  zap: Zap,
  brain: Brain,
  timer: Timer,
  layers: Layers,
  repeat: Repeat,
  "book-open-check": BookOpenCheck,
  medal: Medal,
};

export function BadgeIcon({ name, size = 24 }: { name: string; size?: number }) {
  const I = BADGE_ICONS[name] ?? Award;
  return <I size={size} />;
}
