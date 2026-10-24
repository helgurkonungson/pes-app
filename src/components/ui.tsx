/** Small design-system components. */
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { type CSSProperties, type ReactNode, useEffect, useId, useState } from "react";
import { create } from "zustand";
import { PORTIONS, clampMinutes } from "../core/planner";
import { useT } from "../i18n";
import { onBack, useNav } from "../nav/store";

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
  const t = useT();
  return (
    <header className="topbar">
      <div className="slot">
        <button className="round-btn" aria-label={t("common.back")} onClick={onBack ?? pop}>
          <ChevronLeft size={22} />
        </button>
      </div>
      <h1 className="ellipsis">{title}</h1>
      <div className="slot">{right}</div>
    </header>
  );
}

/** Large left-aligned title for tab screens. */
export function PageTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <header className="page-title">
      <h1>{children}</h1>
      {right}
    </header>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <h2 className="section-label">{children}</h2>;
}

export function Bar({ value, knob, thin, label }: { value: number; knob?: boolean; thin?: boolean; label?: string }) {
  const v = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  return (
    <div className={`bar${knob ? " knob" : ""}${thin ? " thin" : ""}`} role="progressbar" aria-label={label} aria-valuenow={Math.round(v * 100)} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${v * 100}%`, minWidth: v > 0 ? undefined : 0 }} />
    </div>
  );
}

export function Toggle({ on, onChange, label, id }: { on: boolean; onChange: (v: boolean) => void; label: string; id?: string }) {
  return <button id={id} className={`toggle${on ? " on" : ""}`} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} />;
}

export function Chevron() {
  return (
    <span className="chev" aria-hidden>
      <ChevronRight size={16} />
    </span>
  );
}

/**
 * A row in a grouped list. Clickable rows are buttons; rows with a control on the
 * right (a switch) are plain containers so we never nest buttons.
 */
export function MenuRow({ icon, label, hint, value, onClick, right, danger }: { icon?: ReactNode; label: string; hint?: string; value?: ReactNode; onClick?: () => void; right?: ReactNode; danger?: boolean }) {
  const body = (
    <>
      {icon && <span className={`row-icon${danger ? " danger" : ""}`}>{icon}</span>}
      <span className="grow">
        <span className={`row-label${danger ? " danger" : ""}`}>{label}</span>
        {hint && <span className="row-hint">{hint}</span>}
      </span>
      {value !== undefined && <span className="value">{value}</span>}
      {right ?? (onClick ? <Chevron /> : null)}
    </>
  );
  if (onClick && !right) {
    return (
      <button className="menu-row" onClick={onClick}>
        {body}
      </button>
    );
  }
  return <div className="menu-row">{body}</div>;
}

export function Group({ children }: { children: ReactNode }) {
  return <div className="group">{children}</div>;
}

/** Single-choice control laid out as equal segments (wraps on narrow screens). */
export function Segmented<V extends string | number>({ value, options, onChange, label, cols }: { value: V; options: { id: V; label: string }[]; onChange: (v: V) => void; label: string; cols?: number }) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label} style={{ gridTemplateColumns: `repeat(${cols ?? options.length}, 1fr)` }}>
      {options.map((o) => (
        <button key={String(o.id)} role="radio" aria-checked={value === o.id} className={value === o.id ? "on" : ""} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function MinutesPicker({ value, onChange, label }: { value: number; onChange: (m: number) => void; label?: string }) {
  const t = useT();
  const id = useId();
  const isPreset = (PORTIONS as readonly number[]).includes(value);
  const [custom, setCustom] = useState(!isPreset);
  const [text, setText] = useState(isPreset ? "" : String(value));
  return (
    <div className="stack">
      <div className="segmented" role="radiogroup" aria-label={label ?? t("portion.label")} style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
        {PORTIONS.map((m) => (
          <button
            key={m}
            role="radio"
            aria-checked={!custom && value === m}
            className={!custom && value === m ? "on" : ""}
            onClick={() => {
              setCustom(false);
              onChange(m);
            }}
          >
            {t("portion.min", { n: m })}
          </button>
        ))}
        <button role="radio" aria-checked={custom} className={custom ? "on" : ""} onClick={() => setCustom(true)} aria-label={t("portion.custom")}>
          {custom && !isPreset ? t("portion.min", { n: value }) : "…"}
        </button>
      </div>
      {custom && (
        <div className="field">
          <label htmlFor={id}>{t("portion.customLabel")}</label>
          <input
            id={id}
            className="input"
            inputMode="numeric"
            placeholder="3–120"
            value={text}
            autoFocus
            onChange={(e) => {
              const v = e.target.value.replace(/[^\d]/g, "").slice(0, 3);
              setText(v);
              if (v) onChange(clampMinutes(parseInt(v, 10)));
            }}
          />
        </div>
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
  const t = useT();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const off = onBack(() => {
      onClose();
      return true;
    });
    return () => {
      window.removeEventListener("keydown", onKey);
      off();
    };
  }, [onClose]);
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="grab" />
        <div className="sheet-head">
          {title && <h2>{title}</h2>}
          <button className="round-btn ghost" aria-label={t("common.close")} onClick={onClose}>
            <X size={20} />
          </button>
        </div>
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
    setTimeout(() => set((s) => (s.msg === msg ? { msg: null } : s)), 3200);
  },
}));

export const toast = (m: string) => useToastStore.getState().show(m);

export function Toaster() {
  const msg = useToastStore((s) => s.msg);
  return (
    <div className="toast-host" aria-live="polite">
      {msg ? (
        <div className="toast" role="status">
          {msg}
        </div>
      ) : null}
    </div>
  );
}

// ---------- confirm ----------

const useConfirmStore = create<{
  q: { title: string; text?: string; ok: string; cancel?: string; danger?: boolean; resolve: (v: boolean) => void } | null;
}>(() => ({ q: null }));

export function confirmDialog(title: string, opts: { text?: string; ok?: string; cancel?: string; danger?: boolean } = {}): Promise<boolean> {
  return new Promise((resolve) => useConfirmStore.setState({ q: { title, text: opts.text, ok: opts.ok ?? "OK", cancel: opts.cancel, danger: opts.danger, resolve } }));
}

export function ConfirmHost() {
  const q = useConfirmStore((s) => s.q);
  const t = useT();
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
          {q.cancel ?? t("common.cancel")}
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
