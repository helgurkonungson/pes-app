/** "The lesson is still being written · step 4 of 9" with a thin bar — on the lesson screen and on lesson cards. */
import type { LessonBuilding } from "../core/types";
import { useT } from "../i18n";

export function BuildProgress({ building, compact }: { building: LessonBuilding; compact?: boolean }) {
  const t = useT();
  const i = Math.min(building.done + 1, building.total);
  const label = building.error ? t("build.stopped") : t("build.progress", { i, n: building.total });
  return (
    <div className={`build-progress${compact ? " compact" : ""}${building.error ? " stopped" : ""}`}>
      <div className="gen-bar" role="progressbar" aria-valuemin={0} aria-valuemax={building.total} aria-valuenow={building.done} aria-label={label}>
        <span style={{ width: `${Math.round((building.done / Math.max(1, building.total)) * 100)}%` }} />
      </div>
      <span className="small muted">{label}</span>
    </div>
  );
}
