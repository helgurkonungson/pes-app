import { useLiveQuery } from "dexie-react-hooks";
import { ChevronLeft, ChevronRight, Clock, Target, Zap } from "lucide-react";
import { useState } from "react";
import { Bar } from "../components/ui";
import { LineChart, Rings } from "../components/visuals";
import { addDays, lastNDays, localDay, monthLabel, parseDay, weekdayLetter, weekOf } from "../core/dates";
import { pct } from "../core/scoring";
import { db } from "../data/db";
import { useProfile, useSkillsetSummaries } from "../data/hooks";

export function Stats() {
  const today = localDay();
  const [selected, setSelected] = useState(today);
  const profile = useProfile();
  const list = useSkillsetSummaries();
  const week = weekOf(selected);
  const activity = useLiveQuery(() => db.activity.toArray(), []) ?? [];
  const byDay = new Map(activity.map((a) => [a.day, a]));
  const day = byDay.get(selected) ?? { day: selected, minutes: 0, xp: 0, sessions: 0, correct: 0, total: 0 };
  const goal = profile?.dailyGoal || 15;
  const days14 = lastNDays(14, today);
  const totals = activity.reduce((a, x) => ({ minutes: a.minutes + x.minutes, sessions: a.sessions + x.sessions, correct: a.correct + x.correct, total: a.total + x.total }), { minutes: 0, sessions: 0, correct: 0, total: 0 });

  return (
    <div className="screen with-tabbar">
      <div className="topbar">
        <h1 style={{ textAlign: "left", fontSize: 26, fontWeight: 700 }}>Activity calendar</h1>
      </div>
      <div className="stack">
        <div className="card">
          <div className="week">
            {week.map((d, i) => {
              const a = byDay.get(d);
              return (
                <button
                  key={d}
                  className={`day${d === selected ? " on" : ""}${a?.sessions ? " has" : ""}${d > today ? " future" : ""}`}
                  onClick={() => d <= today && setSelected(d)}
                  aria-label={d}
                >
                  <span className="w">{weekdayLetter(i)}</span>
                  <span className="d">{parseDay(d).getDate()}</span>
                </button>
              );
            })}
          </div>
          <div className="row" style={{ justifyContent: "center", marginTop: 12, gap: 16 }}>
            <button className="round-btn" style={{ width: 32, height: 32, background: "transparent" }} aria-label="Previous week" onClick={() => setSelected(addDays(selected, -7))}>
              <ChevronLeft size={18} />
            </button>
            <span className="bold">{monthLabel(selected)}</span>
            <button
              className="round-btn"
              style={{ width: 32, height: 32, background: "transparent" }}
              aria-label="Next week"
              onClick={() => setSelected(addDays(selected, 7) > today ? today : addDays(selected, 7))}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="card">
          <div style={{ display: "grid", placeItems: "center", margin: "6px 0 16px" }}>
            <Rings values={[day.minutes / goal, day.xp / 100, day.total ? day.correct / day.total : 0]} size={190} stroke={20} />
          </div>
          <div className="grid-2" style={{ gridTemplateColumns: "1fr 1fr 1fr", textAlign: "center" }}>
            <div>
              <div className="small muted">
                <Clock size={13} style={{ verticalAlign: -2 }} /> Minutes
              </div>
              <div className="big-number" style={{ fontSize: 24 }}>
                {day.minutes}
                <small>/ {goal}</small>
              </div>
            </div>
            <div>
              <div className="small muted">
                <Zap size={13} style={{ verticalAlign: -2 }} /> XP
              </div>
              <div className="big-number" style={{ fontSize: 24 }}>
                {day.xp}
              </div>
            </div>
            <div>
              <div className="small muted">
                <Target size={13} style={{ verticalAlign: -2 }} /> Correct
              </div>
              <div className="big-number" style={{ fontSize: 24 }}>
                {pct(day.total ? day.correct / day.total : null)}
              </div>
            </div>
          </div>
          <div className="divider" />
          <div className="row-between small">
            <span className="muted">Sessions this day</span>
            <span className="bold">{day.sessions}</span>
          </div>
          <div className="row-between small" style={{ marginTop: 6 }}>
            <span className="muted">All-time minutes</span>
            <span className="bold">{totals.minutes}</span>
          </div>
          <div className="row-between small" style={{ marginTop: 6 }}>
            <span className="muted">All-time accuracy</span>
            <span className="bold">{pct(totals.total ? totals.correct / totals.total : null)}</span>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Last 14 days</h2>
            <span className="small muted">minutes</span>
          </div>
          <LineChart values={days14.map((d) => byDay.get(d)?.minutes ?? 0)} labels={[days14[0], days14[4], days14[9], days14[13]].map((d) => `${parseDay(d).getDate()}/${parseDay(d).getMonth() + 1}`)} />
        </div>

        {list && list.length > 0 && (
          <div className="card">
            <div className="card-head">
              <h2>By skillset</h2>
            </div>
            <div className="stack-lg">
              {list.map((x) => (
                <div key={x.s.id}>
                  <div className="row-between small" style={{ marginBottom: 6 }}>
                    <span className="bold ellipsis grow">{x.s.name}</span>
                    <span className="muted">
                      {Math.round(x.coverage * 100)}% · {x.s.minutesSpent} min · {pct(x.accuracy)}
                    </span>
                  </div>
                  <Bar value={x.coverage} thin />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
