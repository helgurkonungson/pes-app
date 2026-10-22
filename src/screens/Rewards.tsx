import { Flame, Lock, Trophy, Users } from "lucide-react";
import { Bar } from "../components/ui";
import { BadgeIcon } from "../components/visuals";
import { BADGES } from "../core/badges";
import { localDay } from "../core/dates";
import { levelProgress, rankFor } from "../core/scoring";
import { liveStreak } from "../core/streak";
import { useProfile } from "../data/hooks";

export function Rewards() {
  const profile = useProfile();
  if (!profile) return <div className="screen" />;
  const lp = levelProgress(profile.xp);
  const streak = liveStreak(profile.streak, localDay());
  const earned = BADGES.filter((b) => profile.badges[b.id]).length;

  return (
    <div className="screen with-tabbar">
      <div className="topbar">
        <h1 style={{ textAlign: "left", fontSize: 26, fontWeight: 700 }}>Rewards</h1>
      </div>
      <div className="stack">
        <div className="card accent-card">
          <div className="row-between">
            <div>
              <p className="small" style={{ opacity: 0.7, fontWeight: 600 }}>
                Level {lp.level}
              </p>
              <h2 className="display" style={{ fontSize: 30 }}>
                {rankFor(lp.level)}
              </h2>
            </div>
            <div className="icon-dot" style={{ width: 58, height: 58, background: "#1c1d20", color: "var(--accent)" }}>
              <Trophy size={28} />
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <div className="row-between small" style={{ marginBottom: 6, fontWeight: 600 }}>
              <span>{profile.xp.toLocaleString()} XP</span>
              <span style={{ opacity: 0.7 }}>{lp.toNext} XP to level {lp.level + 1}</span>
            </div>
            <div className="bar" style={{ background: "rgba(12,26,25,.15)" }}>
              <i style={{ width: `${lp.ratio * 100}%`, background: "#1c1d20" }} />
            </div>
          </div>
        </div>

        <div className="grid-2">
          <div className="card tight">
            <Flame size={22} className="accent" />
            <div className="big-number" style={{ marginTop: 6 }}>
              {streak}
              <small>days</small>
            </div>
            <p className="small muted">Current streak</p>
          </div>
          <div className="card tight">
            <Trophy size={22} className="accent" />
            <div className="big-number" style={{ marginTop: 6 }}>
              {profile.streak.best}
              <small>days</small>
            </div>
            <p className="small muted">Best streak</p>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Badges</h2>
            <span className="small muted">
              {earned} / {BADGES.length}
            </span>
          </div>
          <Bar value={earned / BADGES.length} thin />
        </div>
        <div className="badges">
          {BADGES.map((b) => {
            const has = !!profile.badges[b.id];
            return (
              <div key={b.id} className={`badge${has ? "" : " locked"}`}>
                <div className="medal">{has ? <BadgeIcon name={b.icon} /> : <Lock size={20} />}</div>
                <div className="t">{b.title}</div>
                <div className="d">{b.description}</div>
              </div>
            );
          })}
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Leaderboard</h2>
            <span className="pill accent">Soon</span>
          </div>
          <div className="lb-row me">
            <span className="lb-rank">1</span>
            <div className="avatar" style={{ width: 38, height: 38, fontSize: 15 }}>
              {profile.name[0]?.toUpperCase()}
            </div>
            <div className="grow">
              <div className="bold">{profile.name} (you)</div>
              <div className="small muted">
                Level {lp.level} · {rankFor(lp.level)}
              </div>
            </div>
            <span className="bold accent">{profile.xp.toLocaleString()} XP</span>
          </div>
          <div className="row small muted" style={{ marginTop: 10 }}>
            <Users size={16} /> Compete with friends once accounts arrive in a coming update.
          </div>
        </div>
      </div>
    </div>
  );
}
