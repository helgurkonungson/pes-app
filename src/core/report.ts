/**
 * "Report this lesson" (Google Play AI-generated content policy, App Store 1.2):
 * what is attached to a report and how it reads for the developer. Pure — unit tested.
 */
import type { Page } from "./flow";
import type { LessonReport, ReportReason, Session } from "./types";

export const REPORT_REASONS: ReportReason[] = ["harmful", "inappropriate", "wrong", "quality", "other"];
export const EXCERPT_MAX = 1500;
export const COMMENT_MAX = 1000;

const cut = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s);

/** The text of the page the learner was looking at. */
export function pageText(page: Page | undefined, extra?: { openAnswerFeedback?: string }): string {
  if (!page) return "";
  switch (page.kind) {
    case "theory":
      return [page.section.heading, page.section.body, ...(page.keyPoints ?? [])].join("\n");
    case "mcq":
      return [page.mcq.q, ...page.mcq.options.map((o, i) => `${"ABCDEF"[i]}) ${o}`), page.mcq.explanation].filter(Boolean).join("\n");
    case "recap":
      return page.recap.join("\n");
    case "open":
      return [page.q, ...page.rubric, extra?.openAnswerFeedback ?? ""].filter(Boolean).join("\n");
    case "intro":
      return page.text;
    default:
      return "";
  }
}

/** "lesson · theory 2/3" */
export function pageWhere(session: Pick<Session, "kind">, page: Page | undefined): string {
  if (!page) return session.kind;
  const pos = "index" in page && "of" in page ? ` ${page.index + 1}/${page.of}` : "";
  return `${session.kind} · ${page.step}${pos}`;
}

export function buildReport(input: {
  session: Pick<Session, "id" | "skillsetId" | "kind" | "lesson">;
  page?: Page;
  /** Text to report when no page is given (e.g. a lesson opened from history). */
  text?: string;
  reason: ReportReason;
  comment?: string;
  provider?: LessonReport["provider"];
  model?: string;
  version: string;
  at: string;
}): LessonReport {
  const { session } = input;
  const excerpt = input.page ? pageText(input.page) : (input.text ?? "");
  return {
    at: input.at,
    sessionId: session.id,
    skillsetId: session.skillsetId,
    reason: input.reason,
    comment: input.comment?.trim() ? cut(input.comment.trim(), COMMENT_MAX) : undefined,
    where: input.page ? pageWhere(session, input.page) : `${session.kind} · history`,
    excerpt: cut(excerpt.trim(), EXCERPT_MAX),
    lessonTitle: session.lesson?.title,
    mode: session.lesson?.mode ?? (session.lesson ? "ai" : undefined),
    // a provider/model only matters for AI-written content
    provider: (session.lesson?.mode ?? "ai") === "ai" ? input.provider : undefined,
    model: (session.lesson?.mode ?? "ai") === "ai" ? input.model : undefined,
    version: input.version,
  };
}

/** Plain text for e-mail / share sheet. */
export function reportsToText(reports: LessonReport[]): string {
  return reports
    .map((r) =>
      [
        `--- Report ${r.at} · v${r.version}`,
        `Reason: ${r.reason}`,
        `Where: ${r.where}${r.lessonTitle ? ` · "${r.lessonTitle}"` : ""}`,
        `Made by: ${r.mode ?? "?"}${r.provider ? ` · ${r.provider}${r.model ? ` / ${r.model}` : ""}` : ""}`,
        r.comment ? `Comment: ${r.comment}` : "",
        "Content:",
        r.excerpt,
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n");
}
