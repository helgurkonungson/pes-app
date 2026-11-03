import { describe, expect, it } from "vitest";
import { appendDictated } from "./answerWords";

describe("dictated answer (1.1.0)", () => {
  it("appends what was said after the typed text", () => {
    expect(appendDictated("", "  память  ")).toBe("память");
    expect(appendDictated("Сбой на этапе хранения.  ", "Повторю завтра")).toBe("Сбой на этапе хранения. Повторю завтра");
    expect(appendDictated("typed", "")).toBe("typed");
  });
  it("glues Chinese without a space", () => {
    expect(appendDictated("记忆", "很重要")).toBe("记忆很重要");
    expect(appendDictated("记忆", "很重要")).toBe("记忆很重要"); // the shared regex keeps no state between calls
  });
});
