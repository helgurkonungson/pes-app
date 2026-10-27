import { describe, expect, it } from "vitest";
import { CourseTextError, courseFromText, shuffledOrder } from "./courseText";

const SRC = `---
id: t-course
title: Test
language: English
minutes: 7
hue: 10
---
# l-01 | Module | First lesson
## Part one
Body **one**.

Second paragraph.
## Part two
Body two.
!key Point A
?q:m Which is right?
- wrong 1
+ right
- wrong 2
- wrong 3
= Because.
?r:e Recall?
+ yes
- no
!open Why?
!rubric Says why
!model Because of reasons.
`;

describe("courseFromText", () => {
  it("parses header, sections, key points, questions and the open question", () => {
    const c = courseFromText(SRC);
    expect(c).toMatchObject({ id: "t-course", title: "Test", language: "English", minutes: 7, hue: 10 });
    const l = c.lessons[0];
    expect(l).toMatchObject({ id: "l-01", module: "Module", title: "First lesson" });
    expect(l.theory.sections).toEqual([
      { heading: "Part one", body: "Body **one**.\n\nSecond paragraph." },
      { heading: "Part two", body: "Body two." },
    ]);
    expect(l.theory.keyPoints).toEqual(["Point A"]);
    expect(l.quiz[0].options[l.quiz[0].answer]).toBe("right");
    expect(l.quiz[0].options.slice().sort()).toEqual(["right", "wrong 1", "wrong 2", "wrong 3"]);
    expect(l.quiz[0]).toMatchObject({ q: "Which is right?", explanation: "Because.", difficulty: "m", topic: "First lesson" });
    expect(l.recall[0].options[l.recall[0].answer]).toBe("yes");
    expect(l.open).toEqual({ q: "Why?", rubric: ["Says why"], modelAnswer: "Because of reasons." });
  });

  it("shuffles the same way for the same lesson and question, whatever the language", () => {
    expect(shuffledOrder(4, "l-01/q1")).toEqual(shuffledOrder(4, "l-01/q1"));
    const seen = new Set(Array.from({ length: 40 }, (_, i) => shuffledOrder(4, `x-${i}/q1`).indexOf(0)));
    expect(seen.size).toBe(4);
  });

  it("reports mistakes with the line number", () => {
    expect(() => courseFromText(SRC.replace("+ right", "- right"))).toThrow(CourseTextError);
    expect(() => courseFromText(SRC.replace("- wrong 1", "+ wrong 1"))).toThrow(/two \+ options/);
    expect(() => courseFromText("# no header")).toThrow(/header/);
  });
});
