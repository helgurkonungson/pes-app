/** Hidden file inputs for importing a course file and restoring a backup. */
import { type ReactElement, useRef } from "react";
import { CourseError } from "../core/course";
import { importCourse } from "../data/courses";
import { BackupError, importBackup } from "../data/repo";
import { writeSnapshot } from "../data/safety";
import { type Key, t } from "../i18n";
import { useNav } from "../nav/store";
import { confirmDialog, toast } from "./ui";

const COURSE_ERR: Record<string, Key> = {
  "not-json": "course.err.notJson",
  "not-course": "course.err.notCourse",
  "newer-format": "course.err.newer",
  "no-id": "course.err.broken",
  "no-lessons": "course.err.broken",
  "bad-lesson": "course.err.broken",
};

export function useCourseImport(): { open: () => void; input: ReactElement } {
  const ref = useRef<HTMLInputElement>(null);
  const nav = useNav();
  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const r = await importCourse(await file.text());
      toast(r.updated ? t("course.updated", { title: r.course.title, n: r.newLessons }) : t("course.added", { title: r.course.title, n: r.course.lessons.length }));
      writeSnapshot();
      nav.setTab("skillsets");
      nav.push({ name: "skillset", id: r.skillset.id });
    } catch (e) {
      toast(e instanceof CourseError ? t(COURSE_ERR[e.code] ?? "course.err.broken") : t("course.err.read"));
    } finally {
      if (ref.current) ref.current.value = "";
    }
  };
  return {
    open: () => ref.current?.click(),
    input: <input ref={ref} type="file" accept=".json,application/json,text/plain,*/*" hidden data-testid="course-file" onChange={(e) => onFile(e.target.files?.[0])} />,
  };
}

export function useBackupRestore(after?: () => void): { open: () => void; input: ReactElement } {
  const ref = useRef<HTMLInputElement>(null);
  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (await confirmDialog(t("backup.restoreConfirm"), { text: t("backup.restoreConfirmText"), ok: t("backup.restoreOk"), danger: true })) {
        await importBackup(data);
        toast(t("backup.restored"));
        writeSnapshot();
        after?.();
      }
    } catch (e) {
      toast(e instanceof BackupError && e.message === "newer-backup" ? t("backup.err.newer") : t("backup.err.notBackup"));
    } finally {
      if (ref.current) ref.current.value = "";
    }
  };
  return {
    open: () => ref.current?.click(),
    input: <input ref={ref} type="file" accept=".json,application/json,text/plain,*/*" hidden data-testid="backup-file" onChange={(e) => onFile(e.target.files?.[0])} />,
  };
}
