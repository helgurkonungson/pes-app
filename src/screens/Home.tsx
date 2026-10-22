import { Download, Flame, Plus, Settings as Gear, Sparkles, Trophy } from "lucide-react";
import { useUpdate } from "../app/App";
import { Bar, Chevron, Empty } from "../components/ui";
import { Rings } from "../components/visuals";
import { pct } from "../core/scoring";
import { liveStreak } from "../core/streak";
import { localDay } from "../core/dates";
import { useProfile, useSkillsetSummaries, useToday } from "../data/hooks";
import { useNav } from "../nav/store";
import { installUpdate } from "../update/updater";
import { HeroBg } from "../components/visuals";

export function Home() {
  const profile = useProfile();
  const today = useToday();
  const list = useSkillsetSummaries();
  const { push, setTab } = useNav();
  const update = useUpdate((s) => s.info);
  if (!profile) return <div className="screen" />;

  const goal = profile.dailyGoal || 15;
  const ratio = today.minutes / goal;
  const streak = liveStreak(profile.streak, localDay());
  const acc = today.total ? today.correct / today.total : null;
  const firstName = profile.name.split(" ")[0] || "there";

  return (
    <div className="screen with-tabbar">
      <div className="stack">
        <div className="greet">
          <button className="avatar" aria-label="Settings" onClick={() => push({ name: "settings" })}>
            {firstName[0]?.toUpperCase()}
          </button>
          <div className="grow">
            <h1>Hello {firstName}!</h1>
            <p className="muted small">{today.sessions ? "Nice work today" : "Let's start your day"}</p>
          </div>
          <button className="round-btn" aria-label="Rewards" onClick={() => setTab("rewards")} style={{ borderRadius: "50%", background: "var(--surface-2)" }}>
            <Trophy size={20} />
          </button>
        </div>

        {update && (
          <button className="banner" onClick={() => installUpdate(update)}>
            <div className="icon-dot accent">
              <Download size={20} />
            </div>
            <div className="grow">
              <b>Update {update.version} is ready</b>
              <p className="muted small">Tap to download and install</p>
            </div>
          </button>
        )}

        <div className="card">
          <div className="row-between" style={{ marginBottom: 6 }}>
            <h2 className="section-title">Today</h2>
            <span className="row small muted" style={{ gap: 4 }}>
              <Flame size={16} color={streak ? "var(--accent)" : "currentColor"} /> {streak} day streak
            </span>
          </div>
          <div className="row">
            <div className="big-number grow">
              {today.minutes}
              <small>/ {goal} min</small>
            </div>
            <div style={{ width: "46%" }}>
              <p className="tiny muted" style={{ textAlign: "right", marginBottom: 4 }}>
                {Math.min(100, Math.round(ratio * 100))}%
              </p>
              <Bar value={ratio} knob />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Daily activity</h2>
            <button className="see-all" onClick={() => setTab("stats")}>
              See all
            </button>
          </div>
          <div className="row">
            <div className="ring-legend grow">
              <div>
                <div className="k">Minutes</div>
                <div className="v">
                  {today.minutes}
                  <small> / {goal}</small>
                </div>
              </div>
              <div>
                <div className="k">XP earned</div>
                <div className="v">
                  {today.xp}
                  <small> / 100</small>
                </div>
              </div>
              <div>
                <div className="k">Accuracy</div>
                <div className="v">{pct(acc)}</div>
              </div>
            </div>
            <Rings values={[ratio, today.xp / 100, acc ?? 0]} size={136} stroke={14} />
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Skillsets</h2>
            {list && list.length > 0 && (
              <button className="see-all" onClick={() => setTab("skillsets")}>
                See all
              </button>
            )}
          </div>
          {list === undefined ? null : list.length === 0 ? (
            <Empty
              icon={<Sparkles size={34} />}
              title="Create your first skillset"
              text="A skillset is a profession or skill you want to learn, with its own sources."
              action={
                <button className="btn primary" onClick={() => push({ name: "skillsetEdit" })}>
                  <Plus size={20} /> New skillset
                </button>
              }
            />
          ) : (
            <div className="stack">
              {list.map((x) => (
                <button key={x.s.id} className="list-card inner" onClick={() => push({ name: "skillset", id: x.s.id })}>
                  <div className="icon-dot" style={{ position: "relative", overflow: "hidden", color: "#fff", fontWeight: 700 }}>
                    <HeroBg hue={x.s.hue} name={x.s.name} />
                    <span style={{ position: "relative" }}>{x.s.name[0]?.toUpperCase()}</span>
                  </div>
                  <div className="grow">
                    <div className="bold ellipsis">{x.s.name}</div>
                    <div className="small muted ellipsis">
                      {x.nextLabel}
                      {x.hasReady ? " · ready" : ""}
                    </div>
                    {x.chunks > 0 && (
                      <div style={{ marginTop: 6 }}>
                        <Bar value={x.coverage} thin />
                      </div>
                    )}
                  </div>
                  <Chevron />
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="list-card" onClick={() => push({ name: "settings" })}>
          <div className="icon-dot">
            <Gear size={20} />
          </div>
          <div className="grow">
            <div className="bold">Settings</div>
            <div className="small muted">Key, daily goal, backup, updates</div>
          </div>
          <Chevron />
        </button>
      </div>
    </div>
  );
}
