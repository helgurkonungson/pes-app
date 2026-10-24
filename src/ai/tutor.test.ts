/** Step-by-step lesson writing: order of steps, saving after each, resuming, re-asking on bad answers. */
import { beforeEach, describe, expect, it, vi } from "vitest";

const ai = vi.hoisted(() => ({ structured: vi.fn(), research: vi.fn() }));
vi.mock("./client", async (orig) => ({ ...(await orig<typeof import("./client")>()), structured: ai.structured, research: ai.research }));

import { planSession } from "../core/planner";
import type { Chunk, LessonDraft, Skillset } from "../core/types";
import { AiError } from "./client";
import { generateLesson, generatePlacement, lessonStepCount } from "./tutor";

const mcq = (i: number) => ({ q: `Question ${i}?`, options: ["Right", "Wrong 1", "Wrong 2", "Wrong 3"], answer: 0, explanation: "Because.", difficulty: "m", topic: "Basics" });

function reply(tool: string, prompt: string): unknown {
  if (tool === "emit_plan")
    return { title: "Decision rights", sections: [{ heading: "Who decides", focus: "Owners and stewards", excerpts: [1] }, { heading: "How to start", focus: "One domain first", excerpts: [2] }], keyPoints: ["Rights first"], open: { q: "How would you assign rights?", rubric: ["Owner named"] } };
  if (tool === "emit_section") {
    const n = prompt.match(/SECTION (\d+) of/)?.[1];
    return { body: `Body of section ${n}: owners approve definitions, stewards keep the rules.` };
  }
  if (tool === "emit_review") return { recap: ["Last time: the DAMA wheel"], questions: [mcq(1)] };
  if (tool === "emit_quiz") return { questions: [mcq(2), mcq(3)] };
  throw new Error(`unexpected tool ${tool}`);
}

const skillset = { id: "sk1", name: "Data governance", goal: "", language: "English", cursor: 0, lessonsDone: 0, createdAt: "x", minutes: 15 } as unknown as Skillset;
const lastLesson = { title: "DAMA wheel", review: { recap: [], questions: [] }, theory: { sections: [{ heading: "h", body: "b" }], keyPoints: ["Eleven knowledge areas"] }, quiz: [], open: { id: "open", q: "?", rubric: [] } } as import("../core/types").LessonContent;

const chunks = [
  { id: "c1", skillsetId: "sk1", sourceId: "s1", order: 0, title: "Rights", text: "Decision rights define who approves data definitions.", words: 7 },
  { id: "c2", skillsetId: "sk1", sourceId: "s1", order: 1, title: "Start", text: "Start with one domain and a measurable goal.", words: 8 },
] as unknown as Chunk[];

function run(draft?: LessonDraft, saved: LessonDraft[] = []) {
  return generateLesson({
    model: "gemini-3.8-flash",
    skillset,
    plan: { ...planSession(15), theorySections: 2 },
    number: 4,
    chunks,
    sourceTitles: new Map([["s1", "Handbook"]]),
    lastLesson,
    mistakes: [],
    previousTitles: [],
    draft,
    saveDraft: async (d) => {
      saved.push(structuredClone(d));
    },
  });
}

const tools = () => ai.structured.mock.calls.map((c) => (c[0] as { tool: { name: string } }).tool.name);

describe("lesson written in steps", () => {
  beforeEach(() => {
    ai.structured.mockReset();
    ai.structured.mockImplementation(async (o: { tool: { name: string }; prompt: string }) => reply(o.tool.name, o.prompt));
  });

  it("plans, reviews, writes each section, then the quiz — saving after every step", async () => {
    const saved: LessonDraft[] = [];
    const { lesson } = await run(undefined, saved);
    expect(tools()).toEqual(["emit_plan", "emit_review", "emit_section", "emit_section", "emit_quiz"]);
    expect(saved).toHaveLength(5);
    expect(lesson.title).toBe("Decision rights");
    expect(lesson.theory.sections.map((s) => s.heading)).toEqual(["Who decides", "How to start"]);
    expect(lesson.theory.sections[1].body).toContain("section 2");
    expect(lesson.quiz).toHaveLength(2);
    expect(lesson.review.questions).toHaveLength(1);
    expect(lesson.open.q).toBe("How would you assign rights?");
    // each section only gets the excerpts the plan assigned to it
    const sec2 = ai.structured.mock.calls[3][0] as { prompt: string };
    expect(sec2.prompt).toContain('n="2"');
    expect(sec2.prompt).not.toContain('n="1"');
    // the quiz is written from the theory that was actually written
    expect((ai.structured.mock.calls[4][0] as { prompt: string }).prompt).toContain("Body of section 1");
  });

  it("an interruption keeps finished steps; the next run continues from there", async () => {
    const saved: LessonDraft[] = [];
    let n = 0;
    ai.structured.mockImplementation(async (o: { tool: { name: string }; prompt: string }) => {
      if (o.tool.name === "emit_section" && ++n === 2) throw new AiError("No connection", "network");
      return reply(o.tool.name, o.prompt);
    });
    await expect(run(undefined, saved)).rejects.toMatchObject({ kind: "network" });
    const draft = saved.at(-1)!;
    expect(draft.plan?.title).toBe("Decision rights");
    expect(draft.sections).toEqual([expect.stringContaining("section 1"), null]);

    ai.structured.mockClear();
    ai.structured.mockImplementation(async (o: { tool: { name: string }; prompt: string }) => reply(o.tool.name, o.prompt));
    const { lesson } = await run(draft);
    expect(tools()).toEqual(["emit_section", "emit_quiz"]);
    expect(lesson.theory.sections).toHaveLength(2);
  });

  it("re-asks once when a step comes back malformed, then gives up with bad-response", async () => {
    let plans = 0;
    ai.structured.mockImplementation(async (o: { tool: { name: string }; prompt: string }) => {
      if (o.tool.name === "emit_plan" && ++plans === 1) return { title: "x", sections: [] };
      return reply(o.tool.name, o.prompt);
    });
    await run();
    expect(plans).toBe(2);

    ai.structured.mockImplementation(async (o: { tool: { name: string } }) => (o.tool.name === "emit_quiz" ? { questions: [] } : reply(o.tool.name, "SECTION 1 of")));
    await expect(run()).rejects.toMatchObject({ kind: "bad-response" });
  });

  it("reports progress as steps done of total", async () => {
    const seen: string[] = [];
    await generateLesson({
      model: "m", skillset, plan: { ...planSession(15), theorySections: 2 }, number: 1, chunks, sourceTitles: new Map(), lastLesson, mistakes: [], previousTitles: [],
      onProgress: (_s, detail, st) => seen.push(`${detail} ${st?.done}/${st?.total}`),
    });
    expect(seen).toEqual(["plan 0/5", "review 1/5", "section 1/2 2/5", "section 2/2 3/5", "quiz 4/5"]);
    expect(lessonStepCount(3, true)).toBe(7);
  });

  it("hands out partial lessons once the review and part 1 exist; questions keep their option order", async () => {
    const partials: import("../core/types").LessonContent[] = [];
    const { lesson } = await generateLesson({
      model: "m", skillset, plan: { ...planSession(15), theorySections: 2 }, number: 1, chunks, sourceTitles: new Map(), lastLesson, mistakes: [], previousTitles: [],
      onPartial: async (l) => {
        partials.push(structuredClone(l));
      },
    });
    expect(partials.map((p) => p.theory.sections.length)).toEqual([1, 2]);
    expect(partials[0].building).toEqual({ done: 3, total: 5, sections: 2 });
    expect(partials[0].quiz).toEqual([]);
    expect(partials[0].review.questions[0]).toEqual(lesson.review.questions[0]);
    expect(lesson.building).toBeUndefined();
    expect(lesson.quiz).toHaveLength(2);
  });

  it("the first lesson of a skillset (nothing learned yet) has no review step", async () => {
    const { lesson } = await generateLesson({
      model: "m", skillset, plan: { ...planSession(15), theorySections: 2 }, number: 1, chunks, sourceTitles: new Map(), mistakes: [], previousTitles: [],
    });
    expect(tools()).toEqual(["emit_plan", "emit_section", "emit_section", "emit_quiz"]);
    expect(lesson.review).toEqual({ recap: [], questions: [] });
  });

  it("a skipped placement test means: assume no prior knowledge", async () => {
    await generateLesson({
      model: "m", skillset: { ...skillset, placement: { score: 0, total: 0, level: "beginner", strengths: [], gaps: [], at: "x", skipped: true } }, plan: { ...planSession(15), theorySections: 2 }, number: 1, chunks, sourceTitles: new Map(), mistakes: [], previousTitles: [],
    });
    expect((ai.structured.mock.calls[0][0] as { prompt: string }).prompt).toContain("assume no prior knowledge");
  });

  it("topics the placement test showed as known are not re-taught", async () => {
    await generateLesson({
      model: "m", skillset: { ...skillset, placement: { score: 7, total: 10, level: "intermediate", strengths: ["Metadata"], gaps: ["Quality"], at: "x" } }, plan: { ...planSession(15), theorySections: 2 }, number: 1, chunks, sourceTitles: new Map(), mistakes: [], previousTitles: [],
    });
    expect((ai.structured.mock.calls[0][0] as { prompt: string }).prompt).toContain("ALREADY KNOWN (placement test): Metadata");
  });

  it("placement questions remember which excerpt (chunk) they check", async () => {
    ai.structured.mockResolvedValueOnce({ intro: "Hi", questions: [{ ...mcq(1), excerpt: 2 }, { ...mcq(2), excerpt: 1 }, { ...mcq(3), excerpt: 9 }, mcq(4)] });
    const p = await generatePlacement({ model: "m", skillset, samples: chunks, sourceTitles: new Map(), count: 4 });
    expect(p.questions.map((q) => q.ref)).toEqual(["c2", "c1", undefined, undefined]);
    expect((ai.structured.mock.calls.at(-1)![0] as { prompt: string }).prompt).toContain('<excerpt n="2"');
  });
});
