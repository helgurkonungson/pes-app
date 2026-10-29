/**
 * Chompbook Pro (ADR-037): built-in AI with a subscription through Google Play.
 * - Google Play build: plans from the store, free trial, legal text, restore, manage.
 * - Active Pro: renewal date, today's allowance, switch lessons back to Chompbook AI.
 * - GitHub APK / web: Pro is sold in the Google Play version.
 */
import { Check, Crown, ExternalLink, RotateCcw, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getApiKey } from "../ai/key";
import { AgeBlocked, AgeGate } from "../components/AgeGate";
import { FreeAiSheet } from "../components/FreeAi";
import { Bar, ExtLink, openExternal, toast, TopBar } from "../components/ui";
import { localDay, longDate } from "../core/dates";
import { manageSubscriptionUrl, type PlanView, type ProUsage, usageView } from "../core/pro";
import { updateProfile } from "../data/db";
import { useProfile } from "../data/hooks";
import { type Key, locale, useLang, useT } from "../i18n";
import { useNav } from "../nav/store";
import { buy, fetchUsage, loadPlans, proPurchasable, restore, usePro } from "../pro/purchases";
import { APP_ID, PLAY_URL, SITE_URL as SITE } from "../build";

function legalUrl(page: "terms" | "privacy", lang: string): string {
  return `${SITE}/${page}/${lang === "ru" ? "ru/" : ""}`;
}

export function Pro() {
  const t = useT();
  const lang = useLang((s) => s.lang);
  const profile = useProfile();
  const pop = useNav((s) => s.pop);
  const status = usePro((s) => s.status);
  const managementUrl = usePro((s) => s.managementUrl);
  const [free, setFree] = useState(false);
  const [plans, setPlans] = useState<PlanView[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [chosen, setChosen] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "buy" | "restore">(null);
  const [usage, setUsage] = useState<ProUsage | null>(null);
  const purchasable = proPurchasable();
  const active = status.active || !!profile?.pro?.active;

  const load = useCallback(() => {
    setLoadError(false);
    setPlans(null);
    loadPlans()
      .then((p) => {
        setPlans(p);
        setChosen((c) => c ?? p[0]?.id ?? null);
      })
      .catch(() => setLoadError(true));
  }, []);

  useEffect(() => {
    if (purchasable && !active) load();
  }, [purchasable, active, load]);

  useEffect(() => {
    if (active) void fetchUsage().then(setUsage);
  }, [active]);

  if (!profile) return <div className="screen" />;
  const date = (iso: string | null | undefined) => (iso ? longDate(localDay(new Date(iso)), locale()) : "");

  const features = (
    <ul className="gemini-list">
      {(["pro.f1", "pro.f2", "pro.f3", "pro.f4"] as Key[]).map((k) => (
        <li key={k}>
          <Check size={18} aria-hidden /> <span>{t(k)}</span>
        </li>
      ))}
    </ul>
  );

  const legalLinks = (
    <p className="faint small center">
      <ExtLink href={legalUrl("terms", lang)}>{t("pro.terms")}</ExtLink> · <ExtLink href={legalUrl("privacy", lang)}>{t("pro.privacy")}</ExtLink>
    </p>
  );

  // ---------- Pro is active ----------
  if (active) {
    const u = usageView(usage);
    const until = status.until ?? profile.pro?.until ?? null;
    const inUse = profile.provider === "chompbook";
    return (
      <div className="screen">
        <TopBar title={t("pro.title")} />
        <div className="stack-lg">
          <div className="pro-hero" aria-hidden>
            <Crown size={56} />
          </div>
          <div className="stack" data-testid="pro-active">
            <h2 className="section-title">{t("pro.activeTitle")}</h2>
            {until && <p className="muted small">{status.trial ? t("pro.trialUntil", { date: date(until) }) : status.willRenew ? t("pro.renews", { date: date(until) }) : t("pro.ends", { date: date(until) })}</p>}
          </div>
          {u && (
            <section className="card stack">
              <div className="row-between">
                <span className="bold">{t("pro.today")}</span>
                <span className="small muted">{t("pro.lessonsLeft", { n: u.lessonsLeft })}</span>
              </div>
              <Bar value={1 - u.ratio} label={t("pro.lessonsLeft", { n: u.lessonsLeft })} />
              <p className="faint small">{t("pro.resets")}</p>
            </section>
          )}
          {inUse ? (
            <div className="banner small" role="status">
              <Sparkles size={18} aria-hidden /> <span className="grow">{t("pro.inUse")}</span>
            </div>
          ) : (
            <button
              className="btn primary block"
              onClick={async () => {
                if (!(await getApiKey("chompbook"))) return toast(t("pro.loadFailed"));
                await updateProfile({ provider: "chompbook", aiBlock: undefined });
                toast(t("pro.inUse"));
              }}
            >
              <Sparkles size={20} /> {t("pro.useIt")}
            </button>
          )}
          {purchasable && (
            <button className="btn ghost block" onClick={() => openExternal(managementUrl ?? manageSubscriptionUrl(APP_ID))}>
              <ExternalLink size={18} /> {t("pro.manage")}
            </button>
          )}
          {legalLinks}
        </div>
      </div>
    );
  }

  // ---------- not sold in this build ----------
  if (!purchasable) {
    return (
      <div className="screen with-cta">
        <TopBar title={t("pro.title")} />
        <div className="stack-lg">
          <div className="pro-hero" aria-hidden>
            <Crown size={56} />
          </div>
          <p>{t("pro.lead")}</p>
          {features}
          <div className="banner small" role="note" data-testid="pro-play-only">
            <span className="grow">{t("pro.playOnly")}</span>
          </div>
          <button className="btn ghost block" onClick={() => openExternal(PLAY_URL)}>
            <ExternalLink size={18} /> {t("pro.openPlay")}
          </button>
        </div>
        <div className="cta-bar">
          <button className="btn primary block" onClick={() => setFree(true)}>
            <Sparkles size={20} /> {t("pro.free")}
          </button>
        </div>
        {free && (
          <FreeAiSheet
            onClose={() => setFree(false)}
            onDone={() => {
              setFree(false);
              pop();
            }}
          />
        )}
      </div>
    );
  }

  // ---------- paywall ----------
  const plan = plans?.find((p) => p.id === chosen) ?? null;
  const group = profile.ageGroup;
  const purchase = async () => {
    if (!plan) return;
    setBusy("buy");
    try {
      if ((await buy(plan.id)) === "ok") {
        toast(t("pro.thanks"));
        void fetchUsage().then(setUsage);
      }
    } catch {
      toast(t("pro.buyFailed"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="screen with-cta">
      <TopBar title={t("pro.title")} />
      <div className="stack-lg">
        <div className="pro-hero" aria-hidden>
          <Crown size={56} />
        </div>
        <p>{t("pro.lead")}</p>
        {features}
        {!group ? (
          <AgeGate onDone={() => undefined} />
        ) : group === "child" ? (
          <AgeBlocked onClose={pop} />
        ) : (
          <>
            {!plans && !loadError && <p className="muted pulse">{t("pro.loading")}</p>}
            {loadError && (
              <div className="stack">
                <div className="error-box" role="alert">
                  {t("pro.loadFailed")}
                </div>
                <button className="btn ghost block" onClick={load}>
                  <RotateCcw size={18} /> {t("common.retry")}
                </button>
              </div>
            )}
            {plans && (
              <div className="stack" role="radiogroup" aria-label={t("pro.title")} data-testid="pro-plans">
                {plans.map((p) => (
                  <button key={p.id} role="radio" aria-checked={p.id === chosen} className={`list-card inner${p.id === chosen ? " selected" : ""}`} onClick={() => setChosen(p.id)}>
                    <span className="grow" style={{ textAlign: "left" }}>
                      <span className="bold block">
                        {p.kind === "annual" ? t("pro.annual") : p.kind === "monthly" ? t("pro.monthly") : p.id}
                        {p.savePct && <span className="pill accent tiny-pill">{t("pro.save", { p: p.savePct })}</span>}
                      </span>
                      <span className="small muted block">
                        {p.price}
                        {p.perMonth ? ` · ${t("pro.perMonth", { price: p.perMonth })}` : ""}
                        {p.trialDays ? ` · ${t("pro.trialDays", { n: p.trialDays })}` : ""}
                      </span>
                    </span>
                    {p.id === chosen && <Check size={20} className="accent" aria-hidden />}
                  </button>
                ))}
              </div>
            )}
            {plan && (
              <div className="stack">
                <p className="faint small">
                  {plan.kind === "annual" ? t("pro.legalYear", { price: plan.price }) : t("pro.legalMonth", { price: plan.price })} {t("pro.legalCancel")}
                  {plan.trialDays ? ` ${t("pro.legalTrial")}` : ""}
                </p>
              </div>
            )}
            <button
              className="btn ghost block"
              disabled={!!busy}
              onClick={async () => {
                setBusy("restore");
                try {
                  toast((await restore()) ? t("pro.restored") : t("pro.nothingToRestore"));
                } catch {
                  toast(t("pro.nothingToRestore"));
                } finally {
                  setBusy(null);
                }
              }}
            >
              <RotateCcw size={18} /> {t("pro.restore")}
            </button>
            {legalLinks}
          </>
        )}
      </div>
      {group && group !== "child" && (
        <div className="cta-bar">
          <button className="btn primary block" disabled={!plan || !!busy} onClick={purchase} data-testid="pro-buy">
            <Crown size={20} /> {busy === "buy" ? t("common.checking") : plan?.trialDays ? t("pro.startTrial") : t("pro.subscribe")}
          </button>
        </div>
      )}
    </div>
  );
}
