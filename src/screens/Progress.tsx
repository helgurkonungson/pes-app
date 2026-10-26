import { useLiveQuery } from "dexie-react-hooks";
import { ChevronLeft, ChevronRight, Clock, Flame, Lock, Moon, Snowflake, Sparkles, Target, Trophy, Zap } from "lucide-react";
import { useState } from "react";
import { Bar, PageTitle, SectionLabel, toast } from "../components/ui";
import { BadgeIcon, LineChart } from "../components/visuals";
import { BADGES } from "../core/badges";
import { addDays, lastNDays, localDay, monthLabel, parseDay, shortDate, weekdayLetter, weekOf } from "../core/dates";
import { levelProgress, pct, rankFor } from "../core/scoring";
import { canBuyFreeze, ENERGY, FREEZE_COST, MAX_FREEZES } from "../core/energy";
import { keptAs, liveStreak } from "../core/streak";
import type { Profile } from "../core/types";
import { buyStreakFreeze } from "../data/repo";
import { db } from "../data/db";
import { useProfile, useSkillsetSummaries } from "../data/hooks";
import { type Key, locale, useT } from "../i18n";

/** Energy balance, freezes and how to earn more (ADR-029). */
function EnergyCard({ profile }: { profile: Profile }) {
  const t = useT();
  const energy = profile.energy ?? 0;
  const freezes = profile.freezes ?? 0;
  const full = freezes >= MAX_FREEZES;
  const can = canBuyFreeze(energy, freezes);
  const [m7, m30, m100] = ENERGY.milestones.map(([, e]) => e);
  return (
    <section className="card stack" aria-label={t("energy.title")}>
      <div className="row-between">
        <div>
          <p className="small muted bold">{t("energy.title")}</p>
          <div className="big-number energy-number">
            <Zap size={24} aria-hidden /> {energy}
          </div>
        </div>
        <div className="freeze-stock" aria-label={t("energy.freezesOf", { n: freezes, max: MAX_FREEZES })}>
          <p className="small muted bold">{t("energy.freezes")}</p>
          <div className="row" style={{ gap: 4, justifyContent: "flex-end" }} aria-hidden>
            {Array.from({ length: MAX_FREEZES }, (_, i) => (
              <span key={i} className={`frost${i < freezes ? " on" : ""}`}>
                <Snowflake size={18} />
              </span>
            ))}
          </div>
        </div>
      </div>
      <button
        className={`btn ${can ? "primary" : "dark"} block`}
        disabled={!can}
        onClick={async () => {
          if (await buyStreakFreeze()) toast(t("energy.bought"));
        }}
      >
        <Snowflake size={18} /> {full ? t("energy.full") : can ? t("energy.buy", { cost: FREEZE_COST }) : t("energy.need", { n: FREEZE_COST - energy })}
        {can && <Zap size={16} aria-hidden />}
      </button>
      <p className="small muted">{t("energy.freezeHint")}</p>
      <details className="earn">
        <summary className="small bold">{t("energy.how")}</summary>
        <ul className="small muted">
          <li>{t("energy.earn.session", { n: ENERGY.session })}</li>
          <li>{t("energy.earn.review", { n: ENERGY.reviewCorrect })}</li>
          <li>{t("energy.earn.perfect", { n: ENERGY.perfect })}</li>
          <li>{t("energy.earn.test", { a: ENERGY.checkpoint, b: ENERGY.final })}</li>
          <li>{t("energy.earn.streak", { a: m7, b: m30, c: m100 })}</li>
          <li>{t("energy.earn.week", { n: ENERGY.cleanWeek })}</li>
          <li>{t("energy.earn.comeback", { n: ENERGY.comeback })}</li>
        </ul>
      </details>
    </section>
  );
}

export function Progress() {
  const t = useT();
  const today = localDay();
  const loc = locale();
  const [selected, setSelected] = useState(today);
  const profile = useProfile();
  const list = useSkillsetSummaries();
  const activity = useLiveQuery(() => db.activity.toArray(), []) ?? [];
  if (!profile) return <div className="screen with-tabbar" />;

  const week = weekOf(selected);
  const byDay = new Map(activity.map((a) => [a.day, a]));
  const day = byDay.get(selected) ?? { day: selected, minutes: 0, xp: 0, sessions: 0, correct: 0, total: 0 };
  const goal = profile.dailyGoal || 15;
  const days14 = lastNDays(14, today);
  const values14 = days14.map((d) => byDay.get(d)?.minutes ?? 0);
  const totals = activity.reduce((a, x) => ({ minutes: a.minutes + x.minutes, sessions: a.sessions + x.sessions }), { minutes: 0, sessions: 0 });
  const lp = levelProgress(profile.xp);
  const streak = liveStreak(profile.streak, today);
  const earned = BADGES.filter((b) => profile.badges[b.id]);
  const badges = [...earned, ...BADGES.filter((b) => !profile.badges[b.id])];

  return (
    <div className="screen with-tabbar">
      <PageTitle>{t("tab.progress")}</PageTitle>
      <div className="stack-lg">
        <section className="card accent-card" aria-label={t("progress.level")}>
          <div className="row-between">
            <div>
              <p className="small" style={{ opacity: 0.75, fontWeight: 600 }}>
                {t("progress.levelN", { n: lp.level })}
              </p>
              <h2 className="display" style={{ fontSize: 28 }}>
                {t(`rank.${rankFor(lp.level)}` as Key)}
              </h2>
            </div>
            <span className="trophy" aria-hidden>
              <Trophy size={26} />
            </span>
          </div>
          <div style={{ marginTop: 16 }}>
            <div className="row-between small" style={{ marginBottom: 6, fontWeight: 600 }}>
              <span>{t("progress.xpTotal", { n: profile.xp.toLocaleString(loc) })}</span>
              <span style={{ opacity: 0.75 }}>{t("progress.toNext", { n: lp.toNext, level: lp.level + 1 })}</span>
            </div>
            <div className="bar on-accent" role="progressbar" aria-valuenow={Math.round(lp.ratio * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={t("progress.level")}>
              <i style={{ width: `${lp.ratio * 100}%` }} />
            </div>
          </div>
        </section>

        <div className="grid-2">
          <div className="card tight">
            <Flame size={20} className="accent" />
            <div className="big-number" style={{ marginTop: 6 }}>
              {streak}
              <small>{t("progress.daysUnit", { n: streak })}</small>
            </div>
            <p className="small muted">{t("progress.streak")}</p>
          </div>
          <div className="card tight">
            <Trophy size={20} className="accent" />
            <div className="big-number" style={{ marginTop: 6 }}>
              {profile.streak.best}
              <small>{t("progress.daysUnit", { n: profile.streak.best })}</small>
            </div>
            <p className="small muted">{t("progress.best")}</p>
          </div>
          <div className="card tight">
            <Clock size={20} className="accent" />
            <div className="big-number" style={{ marginTop: 6 }}>
              {totals.minutes}
              <small>{t("progress.minUnit")}</small>
            </div>
            <p className="small muted">{t("progress.allMinutes")}</p>
          </div>
          <div className="card tight">
            <Target size={20} className="accent" />
            <div className="big-number" style={{ marginTop: 6 }}>
              {totals.sessions}
            </div>
            <p className="small muted">{t("progress.allSessions")}</p>
          </div>
        </div>

        <EnergyCard profile={profile} />

        <section className="card" aria-label={t("progress.calendar")}>
          <div className="row-between" style={{ marginBottom: 12 }}>
            <button className="round-btn ghost" aria-label={t("progress.prevWeek")} onClick={() => setSelected(addDays(selected, -7))}>
              <ChevronLeft size={18} />
            </button>
            <span className="bold">{monthLabel(selected, loc)}</span>
            <button className="round-btn ghost" aria-label={t("progress.nextWeek")} disabled={addDays(week[6], 1) > today} onClick={() => setSelected(addDays(selected, 7) > today ? today : addDays(selected, 7))}>
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="week">
            {week.map((d, i) => {
              const a = byDay.get(d);
              const kept = a?.sessions ? undefined : keptAs(profile.streak, d);
              return (
                <button
                  key={d}
                  className={`day${d === selected ? " on" : ""}${a?.sessions ? " has" : ""}${kept ? ` kept-${kept}` : ""}${d > today ? " future" : ""}`}
                  onClick={() => d <= today && setSelected(d)}
                  disabled={d > today}
                  aria-pressed={d === selected}
                >
                  <span className="w">{weekdayLetter(i, loc)}</span>
                  <span className="d">{parseDay(d).getDate()}</span>
                  <span className="sr-only">
                    , {shortDate(d, loc)}
                    {kept ? `, ${t(kept === "rest" ? "progress.dayRest" : "progress.dayFrozen")}` : ""}
                  </span>
                  {kept === "freeze" && <Snowflake size={10} className="kept-mark" aria-hidden />}
                  {kept === "rest" && <Moon size={10} className="kept-mark" aria-hidden />}
                </button>
              );
            })}
          </div>
          <div className="day-stats">
            <div>
              <div className="k">
                <Clock size={13} /> {t("stat.minutes")}
              </div>
              <div className="v">
                {day.minutes}
                <small>/ {goal}</small>
              </div>
            </div>
            <div>
              <div className="k">
                <Sparkles size={13} /> XP
              </div>
              <div className="v">{day.xp}</div>
            </div>
            <div>
              <div className="k">
                <Target size={13} /> {t("stat.accuracy")}
              </div>
              <div className="v">{pct(day.total ? day.correct / day.total : null)}</div>
            </div>
          </div>
          <p className="small muted center" style={{ marginTop: 10 }}>
            {day.sessions
              ? t("progress.sessionsThatDay", { n: day.sessions })
              : keptAs(profile.streak, selected) === "freeze"
                ? t("progress.keptFreeze")
                : keptAs(profile.streak, selected) === "rest"
                  ? t("progress.keptRest")
                  : t("progress.noSessionsThatDay")}
          </p>
        </section>

        <section className="card">
          <div className="card-head">
            <h2>{t("progress.last14")}</h2>
            <span className="small muted">{t("progress.minUnit")}</span>
          </div>
          {values14.some((v) => v > 0) ? (
            <LineChart values={values14} labels={[days14[0], days14[4], days14[9], days14[13]].map((d) => shortDate(d, loc))} />
          ) : (
            <p className="muted small">{t("progress.chartEmpty")}</p>
          )}
        </section>

        {list && list.length > 0 && (
          <section className="card">
            <div className="card-head">
              <h2>{t("progress.bySkillset")}</h2>
            </div>
            <div className="stack-lg">
              {list.map((x) => (
                <div key={x.s.id}>
                  <div className="row-between small" style={{ marginBottom: 6 }}>
                    <span className="bold ellipsis grow">{x.s.name}</span>
                    <span className="muted">
                      {Math.round(x.coverage * 100)}% · {t("portion.min", { n: x.s.minutesSpent })} · {pct(x.accuracy)}
                    </span>
                  </div>
                  <Bar value={x.coverage} thin label={x.s.name} />
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="stack">
          <div className="row-between">
            <SectionLabel>{t("progress.badges")}</SectionLabel>
            <span className="small muted">
              {earned.length} / {BADGES.length}
            </span>
          </div>
          <div className="badges">
            {badges.map((b) => {
              const has = !!profile.badges[b.id];
              return (
                <div key={b.id} className={`badge${has ? "" : " locked"}`}>
                  <div className="medal" aria-hidden>
                    {has ? <BadgeIcon name={b.icon} /> : <Lock size={20} />}
                  </div>
                  <div className="t">{t(`badge.${b.id}.t` as Key)}</div>
                  <div className="d">{t(`badge.${b.id}.d` as Key)}</div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
