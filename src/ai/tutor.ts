/** Prompts, tool schemas and the three AI jobs: placement test, lesson, grading. */
import { normalizeGrade, normalizeMcqs, normalizePlacement, rng } from "../core/normalize";
import { type SessionPlan, truncateWords } from "../core/planner";
import { languageForPrompt } from "../core/languages";
import type { Chunk, LessonContent, LessonDraft, LessonLanguage, Mcq, OpenGrade, PlacementContent, Skillset, TokenUsage } from "../core/types";
import { addUsage } from "./usage";
import { AiError, research, type ResearchNotes, structured, type ToolDef } from "./client";

// ---------- schemas ----------

const MCQ_SCHEMA = {
  type: "object",
  properties: {
    q: { type: "string", description: "Question text" },
    options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
    answer: { type: "integer", minimum: 0, maximum: 3, description: "Index of the correct option" },
    explanation: { type: "string", description: "Why the right answer is right and the others are wrong (1–3 sentences)" },
    difficulty: { type: "string", enum: ["e", "m", "h"] },
    topic: { type: "string", description: "Short topic name (2–4 words)" },
  },
  required: ["q", "options", "answer", "explanation", "difficulty", "topic"],
};

// A lesson is written in small steps (plan → each theory section → review → quiz):
// short answers finish before provider time limits (Gemini's free tier often fails on one
// big request), and every finished step is saved so an interrupted lesson resumes.

const PLAN_TOOL: ToolDef = {
  name: "emit_plan",
  description: "Return the plan of today's lesson.",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "Short lesson title" },
      sections: {
        type: "array",
        items: {
          type: "object",
          properties: {
            heading: { type: "string" },
            focus: { type: "string", description: "What exactly this section teaches (1–2 sentences)" },
            excerpts: { type: "array", items: { type: "integer" }, description: "Numbers of the source excerpts it draws on" },
          },
          required: ["heading", "focus"],
        },
      },
      keyPoints: { type: "array", items: { type: "string" } },
      open: {
        type: "object",
        properties: { q: { type: "string" }, rubric: { type: "array", items: { type: "string" } } },
        required: ["q", "rubric"],
      },
    },
    required: ["title", "sections", "keyPoints", "open"],
  },
};

const SECTION_TOOL: ToolDef = {
  name: "emit_section",
  description: "Return the text of one theory section.",
  input_schema: {
    type: "object",
    properties: { body: { type: "string", description: "Light Markdown" } },
    required: ["body"],
  },
};

const QUIZ_TOOL: ToolDef = {
  name: "emit_quiz",
  description: "Return the quiz on today's theory.",
  input_schema: {
    type: "object",
    properties: { questions: { type: "array", items: MCQ_SCHEMA } },
    required: ["questions"],
  },
};

const PLACEMENT_TOOL: ToolDef = {
  name: "emit_placement",
  description: "Return the placement test.",
  input_schema: {
    type: "object",
    properties: {
      intro: { type: "string" },
      questions: {
        type: "array",
        items: { ...MCQ_SCHEMA, properties: { ...MCQ_SCHEMA.properties, excerpt: { type: "integer", description: "Number of the source excerpt the question checks (0 if none)" } } },
      },
    },
    required: ["intro", "questions"],
  },
};

const GRADE_TOOL: ToolDef = {
  name: "grade_answer",
  description: "Return the grade for the learner's open answer.",
  input_schema: {
    type: "object",
    properties: {
      score: { type: "integer", minimum: 0, maximum: 10 },
      verdict: { type: "string", description: "One sentence summary for the learner" },
      strengths: { type: "array", items: { type: "string" } },
      gaps: { type: "array", items: { type: "string" } },
      modelAnswer: { type: "string" },
    },
    required: ["score", "verdict", "strengths", "gaps", "modelAnswer"],
  },
};

// ---------- prompt helpers ----------

function languageRule(lang: LessonLanguage): string {
  if (lang === "Source") return "Write in the same language as the source excerpts (if there are none, English).";
  return `Write everything in ${languageForPrompt(lang)}.`;
}

function tutorSystem(lang: LessonLanguage): string {
  return [
    "You are PES Tutor, an expert teacher who turns source material into short, rigorous daily lessons for adult professionals.",
    "Teach for understanding and application, not trivia. Be concrete: examples, numbers, mini-cases.",
    "Stay faithful to the sources; when general knowledge or web notes add something, integrate it and say so briefly. Never invent citations, quotes or page numbers.",
    "Theory bodies use light Markdown only: short paragraphs, **bold** key terms, '-' bullet lists, numbered lists. No tables, no HTML, no headings inside bodies.",
    languageRule(lang),
  ].join("\n");
}

function learnerLine(s: Skillset): string {
  if (!s.placement || s.placement.skipped) return "beginner — assume no prior knowledge of this skillset (start from the basics)";
  const p = s.placement;
  const gaps = p.gaps.length ? `; weaker topics: ${p.gaps.join(", ")}` : "";
  return `${p.level} (placement ${p.score}/${p.total}${gaps})`;
}

// ---------- jobs ----------

export interface Progress {
  (stage: "research" | "writing" | "grading", detail?: string, steps?: LessonSteps): void;
}

export async function generatePlacement(opts: {
  model: string;
  skillset: Skillset;
  samples: Chunk[];
  sourceTitles: Map<string, string>;
  count: number;
  signal?: AbortSignal;
}): Promise<PlacementContent> {
  const { skillset: s } = opts;
  const material = opts.samples.length
    ? `SOURCE SAMPLES (spread across the learner's material):\n${numberedExcerpts(opts.samples, opts.sourceTitles, 700)}`
    : "The learner has not added sources yet. Base the test on the core knowledge of this skillset and the learner's goal.";
  const prompt = [
    `SKILLSET: ${s.name}`,
    `LEARNER GOAL: ${s.goal || "—"}`,
    "",
    material,
    "",
    `Create a placement test with exactly ${opts.count} multiple-choice questions using the emit_placement tool.`,
    "- Measure where the learner stands on this material: about one third easy (e), one third medium (m), one third hard (h), ordered from easy to hard.",
    "- Cover 3–6 distinct topics; tag each question with a short topic name and reuse the exact same name for the same topic.",
    "- Test understanding and application, not recall of page details. 4 options, exactly one correct, plausible distractors.",
    opts.samples.length ? "- Ask two questions per excerpt (different aspects of it) and set excerpt to the number of the excerpt each question checks." : "",
    "- intro: 1–2 sentences telling the learner what the test covers and that guessing or tapping “I don't know” is fine.",
  ].join("\n");
  const raw = await structured<unknown>({
    model: opts.model,
    system: tutorSystem(s.language),
    prompt,
    tool: PLACEMENT_TOOL,
    maxTokens: Math.min(12000, opts.count * 260 + 800),
    signal: opts.signal,
  });
  // remember which part of the material each question checks, so known parts can be skipped
  const o = (raw ?? {}) as { questions?: { excerpt?: unknown; ref?: unknown }[] };
  if (Array.isArray(o.questions))
    for (const q of o.questions) {
      const n = Number(q?.excerpt);
      if (q && Number.isInteger(n) && n >= 1 && n <= opts.samples.length) q.ref = opts.samples[n - 1].id;
    }
  return normalizePlacement(raw);
}

export interface LessonSteps {
  done: number;
  total: number;
}

/** Steps a lesson takes with this plan (for the progress bar). */
export function lessonStepCount(sections: number, research: boolean): number {
  return (research ? 1 : 0) + 1 + sections + 1;
}

function numberedExcerpts(chunks: Chunk[], sourceTitles: Map<string, string>, maxWordsEach: number, only?: number[]): string {
  return chunks
    .map((c, i) => ({ c, n: i + 1 }))
    .filter(({ n }) => !only?.length || only.includes(n))
    .map(({ c, n }) => `<excerpt n="${n}" title="${c.title.replace(/"/g, "'")}" source="${(sourceTitles.get(c.sourceId) ?? "").replace(/"/g, "'")}">\n${truncateWords(c.text, maxWordsEach)}\n</excerpt>`)
    .join("\n\n");
}

const isStr = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const strList = (v: unknown): string[] => (Array.isArray(v) ? v.filter(isStr).map((x) => x.trim()) : []);

/** Re-asks once when an answer comes back malformed; other errors (and the second failure) go up. */
async function step<T>(run: () => Promise<unknown>, check: (raw: unknown) => T | null): Promise<T> {
  for (let i = 0; ; i++) {
    let raw: unknown;
    try {
      raw = await run();
    } catch (e) {
      if (i === 0 && e instanceof AiError && e.kind === "bad-response") continue;
      throw e;
    }
    const ok = check(raw);
    if (ok !== null) return ok;
    if (i > 0) throw new AiError("The AI answer was missing parts of the lesson.", "bad-response");
  }
}

/**
 * Builds the lesson from a draft. Questions get fixed shuffles (seeded), so a question
 * keeps its option order between the partial lessons and the final one.
 * Partial: only the parts written so far, in order, plus `building` progress.
 */
/** Review questions come ready-made from the app; drafts from 0.8 may still hold raw AI questions. */
function reviewQuestions(list: unknown[]): Mcq[] {
  return list.every((q) => typeof (q as Mcq)?.id === "string" && Array.isArray((q as Mcq).options)) ? (list as Mcq[]) : normalizeMcqs(list, "r", rng(1));
}

export function assembleLesson(draft: LessonDraft, total: number, done: number, final: boolean): LessonContent {
  const plan = draft.plan!;
  const sections: { heading: string; body: string }[] = [];
  for (let i = 0; i < plan.sections.length; i++) {
    const body = draft.sections[i];
    if (!isStr(body)) break;
    sections.push({ heading: plan.sections[i].heading, body });
  }
  const quiz = draft.quiz ? normalizeMcqs(draft.quiz, "q", rng(2)) : [];
  const lesson: LessonContent = {
    title: plan.title,
    review: { recap: (draft.review?.recap ?? []).slice(0, 6), questions: reviewQuestions(draft.review?.questions ?? []) },
    theory: { sections, keyPoints: plan.keyPoints.slice(0, 8) },
    quiz,
    open: { id: "open", q: plan.open.q, rubric: plan.open.rubric.slice(0, 6) },
  };
  if (draft.usage) lesson.usage = draft.usage;
  if (final) {
    if (!sections.length || sections.length < plan.sections.length || !quiz.length) throw new AiError("The lesson came back incomplete.", "bad-response");
  } else {
    lesson.building = { done, total, sections: plan.sections.length };
  }
  return lesson;
}

export async function generateLesson(opts: {
  model: string;
  skillset: Skillset;
  plan: SessionPlan;
  number: number;
  chunks: Chunk[];
  sourceTitles: Map<string, string>;
  lastLesson?: LessonContent;
  mistakes: Mcq[];
  previousTitles: string[];
  onProgress?: Progress;
  signal?: AbortSignal;
  /** False when the provider has no web search tool. */
  webSearch?: boolean;
  /** Steps finished earlier; filled in and passed to `saveDraft` after every step. */
  draft?: LessonDraft;
  saveDraft?: (d: LessonDraft) => Promise<void>;
  /** Called with the lesson so far (review + the parts already written) while the rest is being written. */
  onPartial?: (lesson: LessonContent) => Promise<void>;
  /** The review step, prepared by the app (due cards or an intermediate test). */
  review?: LessonContent["review"];
}): Promise<{ lesson: LessonContent; notes?: ResearchNotes }> {
  const { skillset: s, plan } = opts;
  const now = new Date().toISOString();
  const draft: LessonDraft = opts.draft ?? {
    id: s.id,
    skillsetId: s.id,
    minutes: plan.minutes,
    number: opts.number,
    chunkIds: opts.chunks.map((c) => c.id),
    createdAt: now,
    updatedAt: now,
    sections: [],
  };
  const onUsage = (u: TokenUsage) => {
    draft.usage = addUsage(draft.usage, u);
  };
  const save = async () => {
    draft.updatedAt = new Date().toISOString();
    await opts.saveDraft?.(draft);
  };
  const wantResearch = !!s.useInternet && opts.webSearch !== false;
  const total = () => lessonStepCount(draft.plan?.sections.length ?? plan.theorySections, wantResearch);
  const doneCount = () =>
    (wantResearch && draft.research !== undefined ? 1 : 0) + (draft.plan ? 1 : 0) + draft.sections.filter(isStr).length + (draft.quiz ? 1 : 0);
  const report = (stage: "research" | "writing", detail: string) => opts.onProgress?.(stage, detail, { done: doneCount(), total: total() });
  const system = tutorSystem(s.language);

  // 1. web research (Claude only, optional)
  if (wantResearch && draft.research === undefined) {
    report("research", "research");
    const focus = opts.chunks.length ? opts.chunks.map((c) => c.title).join("; ") : `next topic after: ${opts.previousTitles.slice(-3).join("; ") || "the basics"}`;
    try {
      const notes = await research({
        model: opts.model,
        maxSearches: plan.minutes >= 30 ? 4 : 2,
        signal: opts.signal,
        onUsage,
        prompt: [
          `Skillset: ${s.name}. Learner goal: ${s.goal || "—"}.`,
          `Today's lesson focus: ${focus}.`,
          "Search the web for up-to-date, authoritative information that complements this focus: precise definitions, recent developments, practical examples, useful numbers.",
          "Then write 5–8 compact bullet notes in English. End each bullet with the source domain in parentheses.",
          opts.chunks.length ? `\nExcerpt of the source material for context:\n${truncateWords(opts.chunks[0].text, 500)}` : "",
        ].join("\n"),
      });
      draft.research = notes.text ? notes : null;
    } catch (e) {
      const kind = (e as { kind?: string }).kind;
      if (kind === "aborted" || kind === "auth" || kind === "network") throw e;
      draft.research = null; // research is optional — continue with sources only
    }
    await save();
  }

  const perChunk = Math.max(600, Math.floor(plan.sourceWords / Math.max(1, opts.chunks.length)));
  const material = (only?: number[]) =>
    opts.chunks.length
      ? `NEW MATERIAL — SOURCE EXCERPTS (teach these, in order):\n${numberedExcerpts(opts.chunks, opts.sourceTitles, perChunk, only)}`
      : `NEW MATERIAL: there are no unread source excerpts. Teach the next logical topic of a solid curriculum for this skillset and goal.${opts.previousTitles.length ? ` Lessons already done: ${opts.previousTitles.slice(-12).join("; ")}.` : ""}`;
  const web = draft.research?.text ? `WEB NOTES (fresh information found online — use where helpful):\n${draft.research.text}` : "";
  const known = s.placement && !s.placement.skipped && s.placement.strengths.length ? `ALREADY KNOWN (placement test): ${s.placement.strengths.join(", ")} — don't re-teach these; focus on the weaker topics.` : "";
  const header = [`SKILLSET: ${s.name}`, `LEARNER GOAL: ${s.goal || "—"}`, `LEARNER LEVEL: ${learnerLine(s)}`, known, `SESSION: #${draft.number}, portion of ${plan.minutes} minutes.`].filter(Boolean).join("\n");

  // 2. plan
  if (!draft.plan) {
    report("writing", "plan");
    const prompt = [
      header,
      opts.previousTitles.length ? `EARLIER LESSONS: ${opts.previousTitles.slice(-8).join("; ")}` : "",
      "",
      material(),
      web ? `\n${web}` : "",
      "",
      "Plan today's lesson with the emit_plan tool (the sections themselves are written later):",
      `- sections: exactly ${plan.theorySections}, in teaching order, about ${Math.round(plan.theoryWords / plan.theorySections)} words each when written. For each: heading, focus (what exactly it teaches, 1–2 sentences) and excerpts (numbers of the source excerpts it uses).`,
      "- keyPoints: 3–6 takeaways of today's theory.",
      "- open: one open question that makes the learner apply today's theory to a realistic situation (answerable in 3–6 sentences), with a 3–4 point rubric.",
      "- title: a short lesson title.",
    ].join("\n");
    draft.plan = await step(
      () => structured<unknown>({ model: opts.model, system, prompt, tool: PLAN_TOOL, maxTokens: 1200 + plan.theorySections * 160, signal: opts.signal, onUsage }),
      (raw) => {
        const o = (raw ?? {}) as Record<string, any>;
        const sections = (Array.isArray(o.sections) ? o.sections : [])
          .map((x: any) => ({
            heading: isStr(x?.heading) ? x.heading.trim() : "",
            focus: isStr(x?.focus) ? x.focus.trim() : "",
            excerpts: (Array.isArray(x?.excerpts) ? x.excerpts : []).map(Number).filter((n: number) => Number.isInteger(n) && n >= 1 && n <= opts.chunks.length),
          }))
          .filter((x: { heading: string }) => x.heading)
          .slice(0, 8);
        const q = isStr(o.open?.q) ? o.open.q.trim() : "";
        if (!sections.length || !q) return null;
        return { title: isStr(o.title) ? o.title.trim() : "Today's lesson", sections, keyPoints: strList(o.keyPoints).slice(0, 8), open: { q, rubric: strList(o.open?.rubric).slice(0, 6) } };
      },
    );
    draft.sections = draft.plan.sections.map(() => null);
    await save();
  }
  const lessonPlan = draft.plan;
  const outline = lessonPlan.sections.map((x, i) => `${i + 1}. ${x.heading} — ${x.focus}`).join("\n");
  // once the review and part 1 exist the learner can start; later steps are added as they finish
  const partial = async () => {
    if (!opts.onPartial || !draft.review || !isStr(draft.sections[0]) || draft.quiz) return;
    await opts.onPartial(assembleLesson(draft, total(), doneCount(), false));
  };

  // 3. review step: made by the app (spaced-repetition cards / intermediate test), not by the AI;
  //    the first lesson of a skillset has nothing to review yet
  if (!draft.review) {
    draft.review = opts.review ?? { recap: [], questions: [] };
    await save();
  }
  await partial();

  // 4. theory, one section per request
  const words = Math.max(120, Math.round(plan.theoryWords / lessonPlan.sections.length));
  for (let i = 0; i < lessonPlan.sections.length; i++) {
    if (isStr(draft.sections[i])) continue;
    report("writing", `section ${i + 1}/${lessonPlan.sections.length}`);
    const sec = lessonPlan.sections[i];
    const prompt = [
      header,
      "",
      material(sec.excerpts),
      web ? `\n${web}` : "",
      "",
      `LESSON: ${lessonPlan.title}`,
      `PLAN:\n${outline}`,
      "",
      `Write SECTION ${i + 1} of ${lessonPlan.sections.length} — "${sec.heading}" — with the emit_section tool.`,
      `- About ${words} words teaching: ${sec.focus}`,
      "- Build on the earlier sections of the plan and leave later topics to their sections; no repetition.",
      "- Define new terms and give one concrete example (numbers, a mini-case).",
      "- body only: do not repeat the heading.",
    ].join("\n");
    draft.sections[i] = await step(
      () => structured<unknown>({ model: opts.model, system, prompt, tool: SECTION_TOOL, maxTokens: Math.min(8000, Math.round(words * 2.4) + 500), signal: opts.signal, onUsage }),
      (raw) => {
        const body = (raw as { body?: unknown } | null)?.body;
        return isStr(body) && body.trim().length >= 40 ? body.trim() : null;
      },
    );
    await save();
    await partial();
  }

  const theory = lessonPlan.sections.map((x, i) => `## ${x.heading}\n${draft.sections[i]}`).join("\n\n");

  // 5. quiz on what was actually written today
  if (!draft.quiz) {
    report("writing", "quiz");
    const prompt = [
      header,
      "",
      `TODAY'S THEORY (the learner has just read it):\n${theory}`,
      `KEY POINTS:\n${lessonPlan.keyPoints.map((k) => `- ${k}`).join("\n")}`,
      "",
      `Write the quiz with the emit_quiz tool: exactly ${plan.quizQuestions} multiple-choice questions on today's theory only. Test understanding and application, mix difficulty (e/m/h), tag each with a short topic. 4 options, exactly one correct, plausible distractors.`,
    ].join("\n");
    draft.quiz = await step(
      () => structured<unknown>({ model: opts.model, system, prompt, tool: QUIZ_TOOL, maxTokens: plan.quizQuestions * 320 + 700, signal: opts.signal, onUsage }),
      (raw) => {
        const q = (raw as { questions?: unknown } | null)?.questions;
        return Array.isArray(q) && normalizeMcqs(q, "q").length ? q : null;
      },
    );
    await save();
  }

  const lesson = assembleLesson(draft, total(), doneCount(), true);
  const notes = draft.research ?? undefined;
  if (notes?.links.length) lesson.links = notes.links;
  return { lesson, notes };
}

export async function gradeAnswer(opts: { model: string; language: LessonLanguage; lesson: LessonContent; answer: string; signal?: AbortSignal }): Promise<OpenGrade> {
  const prompt = [
    `QUESTION: ${opts.lesson.open.q}`,
    `RUBRIC:\n${opts.lesson.open.rubric.map((r) => `- ${r}`).join("\n")}`,
    `WHAT THE LESSON TAUGHT (key points):\n${opts.lesson.theory.keyPoints.map((k) => `- ${k}`).join("\n")}`,
    `LEARNER'S ANSWER:\n"""\n${opts.answer.trim()}\n"""`,
    "",
    "Grade with the grade_answer tool:",
    "- score 0–10: 10 = complete, accurate and well applied; 5 = partly right; 0 = empty or off-topic.",
    "- verdict: one encouraging but honest sentence.",
    "- strengths and gaps: short, specific bullets addressed to the learner (“You …”). Gaps say what was missing or wrong and how to fix it.",
    "- modelAnswer: a concise exemplary answer (3–6 sentences).",
  ].join("\n");
  const raw = await structured<unknown>({ model: opts.model, system: tutorSystem(opts.language), prompt, tool: GRADE_TOOL, maxTokens: 1800, signal: opts.signal });
  return normalizeGrade(raw);
}
