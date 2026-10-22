/** Small design-system components. */
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { type CSSProperties, type ReactNode, useEffect, useState } from "react";
import { create } from "zustand";
import { PORTIONS, clampMinutes } from "../core/planner";
import { useNav } from "../nav/store";

/** Opens a web page in the system browser (in-app links would replace the app's WebView). */
export function openExternal(url: string): void {
  if (Capacitor.isNativePlatform()) Browser.open({ url }).catch(() => undefined);
  else window.open(url, "_blank", "noopener");
}

export function ExtLink({ href, children, className, style }: { href: string; children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <a
      href={href}
      className={className}
      style={style}
      onClick={(e) => {
        e.preventDefault();
        openExternal(href);
      }}
    >
      {children}
    </a>
  );
}

export function TopBar({ title, onBack, right }: { title?: string; onBack?: () => void; right?: ReactNode }) {
  const pop = useNav((s) => s.pop);
  return (
    <div className="topbar">
      <div className="slot">
        <button className="round-btn" aria-label="Back" onClick={onBack ?? pop}>
          <ChevronLeft size={22} />
        </button>
      </div>
      <h1 className="ellipsis">{title}</h1>
      <div className="slot">{right}</div>
    </div>
  );
}

export function Bar({ value, knob, thin }: { value: number; knob?: boolean; thin?: boolean }) {
  const v = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  return (
    <div className={`bar${knob ? " knob" : ""}${thin ? " thin" : ""}`} role="progressbar" aria-valuenow={Math.round(v * 100)} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${v * 100}%` }} />
    </div>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button className={`toggle${on ? " on" : ""}`} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} />;
}

export function Chevron() {
  return (
    <span className="chev" aria-hidden>
      <ChevronRight size={16} />
    </span>
  );
}

export function MenuRow({ icon, label, value, onClick, right }: { icon?: ReactNode; label: string; value?: ReactNode; onClick?: () => void; right?: ReactNode }) {
  return (
    <button className="menu-row" onClick={onClick} disabled={!onClick && !right}>
      {icon}
      <span className="grow">{label}</span>
      {value !== undefined && <span className="value">{value}</span>}
      {right ?? (onClick ? <Chevron /> : null)}
    </button>
  );
}

export function MinutesPicker({ value, onChange }: { value: number; onChange: (m: number) => void }) {
  const isPreset = (PORTIONS as readonly number[]).includes(value);
  const [custom, setCustom] = useState(!isPreset);
  const [text, setText] = useState(isPreset ? "" : String(value));
  return (
    <div className="stack">
      <div className="chips" role="radiogroup" aria-label="Portion size">
        {PORTIONS.map((m) => (
          <button
            key={m}
            className={`chip${!custom && value === m ? " on" : ""}`}
            role="radio"
            aria-checked={!custom && value === m}
            onClick={() => {
              setCustom(false);
              onChange(m);
            }}
          >
            {m} min
          </button>
        ))}
        <button className={`chip${custom ? " on" : ""}`} onClick={() => setCustom(true)}>
          Custom
        </button>
      </div>
      {custom && (
        <input
          className="input"
          inputMode="numeric"
          placeholder="Minutes (3–120)"
          value={text}
          onChange={(e) => {
            const t = e.target.value.replace(/[^\d]/g, "").slice(0, 3);
            setText(t);
            if (t) onChange(clampMinutes(parseInt(t, 10)));
          }}
        />
      )}
    </div>
  );
}

export function Empty({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="art">{icon}</div>
      <h3 className="section-title">{title}</h3>
      {text && <p className="muted small">{text}</p>}
      {action}
    </div>
  );
}

export function Sheet({ title, onClose, children }: { title?: string; onClose: () => void; children: ReactNode }) {
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="grab" />
        {title && <h2>{title}</h2>}
        {children}
      </div>
    </>
  );
}

// ---------- toast ----------

const useToastStore = create<{ msg: string | null; show: (m: string) => void }>((set) => ({
  msg: null,
  show: (msg) => {
    set({ msg });
    setTimeout(() => set((s) => (s.msg === msg ? { msg: null } : s)), 2600);
  },
}));

export const toast = (m: string) => useToastStore.getState().show(m);

export function Toaster() {
  const msg = useToastStore((s) => s.msg);
  return msg ? (
    <div className="toast" role="status">
      {msg}
    </div>
  ) : null;
}

// ---------- confirm ----------

const useConfirmStore = create<{
  q: { title: string; text?: string; ok: string; danger?: boolean; resolve: (v: boolean) => void } | null;
}>(() => ({ q: null }));

export function confirmDialog(title: string, opts: { text?: string; ok?: string; danger?: boolean } = {}): Promise<boolean> {
  return new Promise((resolve) => useConfirmStore.setState({ q: { title, text: opts.text, ok: opts.ok ?? "OK", danger: opts.danger, resolve } }));
}

export function ConfirmHost() {
  const q = useConfirmStore((s) => s.q);
  if (!q) return null;
  const done = (v: boolean) => {
    useConfirmStore.setState({ q: null });
    q.resolve(v);
  };
  return (
    <Sheet title={q.title} onClose={() => done(false)}>
      {q.text && <p className="muted" style={{ marginBottom: 18 }}>{q.text}</p>}
      <div className="row">
        <button className="btn dark grow" onClick={() => done(false)}>
          Cancel
        </button>
        <button className={`btn grow ${q.danger ? "danger" : "primary"}`} onClick={() => done(true)}>
          {q.ok}
        </button>
      </div>
    </Sheet>
  );
}

/** Re-renders every `ms` milliseconds (for clocks/timers). */
export function useTick(ms: number) {
  const [, set] = useState(0);
  useEffect(() => {
    const t = setInterval(() => set((x) => x + 1), ms);
    return () => clearInterval(t);
  }, [ms]);
}
