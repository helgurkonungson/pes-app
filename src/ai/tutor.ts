/** Prompts, tool schemas and the three AI jobs: placement test, lesson, grading. */
import { normalizeGrade, normalizeLesson, normalizePlacement } from "../core/normalize";
import { type SessionPlan, truncateWords } from "../core/planner";
import type { Chunk, LessonContent, LessonLanguage, Mcq, OpenGrade, PlacementContent, Skillset } from "../core/types";
import { research, type ResearchNotes, structured, type ToolDef } from "./client";

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

const LESSON_TOOL: ToolDef = {
  name: "emit_lesson",
  description: "Return the complete learning session.",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string" },
      review: {
        type: "object",
        properties: {
          recap: { type: "array", items: { type: "string" } },
          questions: { type: "array", items: MCQ_SCHEMA },
        },
        required: ["recap", "questions"],
      },
      theory: {
        type: "object",
        properties: {
          sections: {
            type: "array",
            items: { type: "object", properties: { heading: { type: "string" }, body: { type: "string", description: "Light Markdown" } }, required: ["heading", "body"] },
          },
          keyPoints: { type: "array", items: { type: "string" } },
        },
        required: ["sections", "keyPoints"],
      },
      quiz: { type: "array", items: MCQ_SCHEMA },
      open: {
        type: "object",
        properties: { q: { type: "string" }, rubric: { type: "array", items: { type: "string" } } },
        required: ["q", "rubric"],
      },
    },
    required: ["title", "review", "theory", "quiz", "open"],
  },
};

const PLACEMENT_TOOL: ToolDef = {
  name: "emit_placement",
  description: "Return the placement test.",
  input_schema: {
    type: "object",
    properties: { intro: { type: "string" }, questions: { type: "array", items: MCQ_SCHEMA } },
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
  return `Write everything in ${lang}.`;
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

function excerpts(chunks: Chunk[], sourceTitles: Map<string, string>, maxWordsEach: number): string {
  return chunks
    .map((c) => `<excerpt title="${c.title.replace(/"/g, "'")}" source="${(sourceTitles.get(c.sourceId) ?? "").replace(/"/g, "'")}">\n${truncateWords(c.text, maxWordsEach)}\n</excerpt>`)
    .join("\n\n");
}

function learnerLine(s: Skillset): string {
  if (!s.placement) return "unknown (no placement test yet)";
  const p = s.placement;
  const gaps = p.gaps.length ? `; weaker topics: ${p.gaps.join(", ")}` : "";
  return `${p.level} (placement ${p.score}/${p.total}${gaps})`;
}

// ---------- jobs ----------

export interface Progress {
  (stage: "research" | "writing" | "grading", detail?: string): void;
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
    ? `SOURCE SAMPLES (spread across the learner's material):\n${excerpts(opts.samples, opts.sourceTitles, 700)}`
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
  return normalizePlacement(raw);
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
}): Promise<{ lesson: LessonContent; notes?: ResearchNotes }> {
  const { skillset: s, plan } = opts;
  let notes: ResearchNotes | undefined;

  if (s.useInternet) {
    opts.onProgress?.("research", "Searching the web for fresh material…");
    const focus = opts.chunks.length ? opts.chunks.map((c) => c.title).join("; ") : `next topic after: ${opts.previousTitles.slice(-3).join("; ") || "the basics"}`;
    try {
      notes = await research({
        model: opts.model,
        maxSearches: plan.minutes >= 30 ? 4 : 2,
        signal: opts.signal,
        prompt: [
          `Skillset: ${s.name}. Learner goal: ${s.goal || "—"}.`,
          `Today's lesson focus: ${focus}.`,
          "Search the web for up-to-date, authoritative information that complements this focus: precise definitions, recent developments, practical examples, useful numbers.",
          "Then write 5–8 compact bullet notes in English. End each bullet with the source domain in parentheses.",
          opts.chunks.length ? `\nExcerpt of the source material for context:\n${truncateWords(opts.chunks[0].text, 500)}` : "",
        ].join("\n"),
      });
    } catch (e) {
      if ((e as { kind?: string }).kind === "aborted" || (e as { kind?: string }).kind === "auth") throw e;
      notes = undefined; // research is optional — continue with sources only
    }
  }

  opts.onProgress?.("writing", "Writing your lesson…");
  const perChunk = Math.max(600, Math.floor(plan.sourceWords / Math.max(1, opts.chunks.length)));
  const material = opts.chunks.length
    ? `NEW MATERIAL — SOURCE EXCERPTS (teach these, in order):\n${excerpts(opts.chunks, opts.sourceTitles, perChunk)}`
    : `NEW MATERIAL: there are no unread source excerpts. Teach the next logical topic of a solid curriculum for this skillset and goal.${opts.previousTitles.length ? ` Lessons already done: ${opts.previousTitles.slice(-12).join("; ")}.` : ""}`;

  const last = opts.lastLesson
    ? `LAST LESSON (for the review step)\nTitle: ${opts.lastLesson.title}\nKey points:\n${opts.lastLesson.theory.keyPoints.map((k) => `- ${k}`).join("\n")}`
    : "LAST LESSON: none — this is the first lesson. In review.recap list 2–3 prerequisites the learner needs today; review.questions may check those prerequisites.";
  const mistakes = opts.mistakes.length ? `RECENT MISTAKES (the learner answered these wrong):\n${opts.mistakes.map((m) => `- ${m.q} (correct: ${m.options[m.answer]})`).join("\n")}` : "";
  const web = notes?.text ? `WEB NOTES (fresh information found online — use where helpful):\n${notes.text}` : "";

  const prompt = [
    `SKILLSET: ${s.name}`,
    `LEARNER GOAL: ${s.goal || "—"}`,
    `LEARNER LEVEL: ${learnerLine(s)}`,
    `SESSION: #${opts.number}, portion of ${plan.minutes} minutes.`,
    "",
    last,
    mistakes,
    "",
    material,
    web ? `\n${web}` : "",
    "",
    "Build the session with the emit_lesson tool:",
    `1. review.recap: 3–5 bullets with the key points of the last lesson.`,
    `2. review.questions: exactly ${plan.reviewQuestions} recall question(s) on the last lesson${opts.mistakes.length ? " and the recent mistakes" : ""}.`,
    `3. theory.sections: ${plan.theorySections} section(s), about ${plan.theoryWords} words in total, teaching the new material. Build on what the learner knows, define terms, give one concrete example per section.`,
    "4. theory.keyPoints: 3–6 takeaways of today's theory.",
    `5. quiz: exactly ${plan.quizQuestions} questions on today's new theory only. Mix difficulty, tag topics.`,
    "6. open: one open question that makes the learner apply today's theory to a realistic situation (answerable in 3–6 sentences), with a 3–4 point rubric.",
    "7. title: a short lesson title.",
  ]
    .filter((l) => l !== undefined)
    .join("\n");

  const maxTokens = Math.min(32000, Math.round(plan.theoryWords * 2.2) + (plan.quizQuestions + plan.reviewQuestions) * 260 + 1500);
  const raw = await structured<unknown>({ model: opts.model, system: tutorSystem(s.language), prompt, tool: LESSON_TOOL, maxTokens, signal: opts.signal });
  const lesson = normalizeLesson(raw);
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
