import { describe, expect, it } from "vitest";
import { geminiNativeAnswer, geminiNativeRequest } from "./compat";

describe("Gemini over its native API (AQ. keys)", () => {
  it("turns a Chat Completions body into generateContent", () => {
    const { model, payload } = geminiNativeRequest({
      model: "models/gemini-flash-latest",
      messages: [
        { role: "system", content: "Be brief." },
        { role: "user", content: "Hi" },
        { role: "assistant", content: "Hello" },
      ],
      tools: [{ function: { name: "lesson", description: "A lesson", parameters: { type: "object" } } }],
      tool_choice: { function: { name: "lesson" } },
      max_tokens: 100,
      reasoning_effort: "low",
    });
    expect(model).toBe("gemini-flash-latest");
    expect(payload.systemInstruction).toEqual({ parts: [{ text: "Be brief." }] });
    expect(payload.contents).toEqual([
      { role: "user", parts: [{ text: "Hi" }] },
      { role: "model", parts: [{ text: "Hello" }] },
    ]);
    expect(payload.toolConfig).toEqual({ functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["lesson"] } });
    expect(payload.generationConfig).toEqual({ maxOutputTokens: 100, thinkingConfig: { thinkingLevel: "low" } });
  });
  it("turns the answer back into the Chat Completions shape, without thoughts", () => {
    const out = geminiNativeAnswer({
      candidates: [{ content: { parts: [{ text: "thinking…", thought: true }, { text: "Answer" }, { functionCall: { name: "lesson", args: { a: 1 } } }] }, finishReason: "MAX_TOKENS" }],
      usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 3, thoughtsTokenCount: 2 },
    }) as { choices: { message: { content: string; tool_calls: { function: { arguments: string } }[] }; finish_reason: string }[]; usage: { completion_tokens: number } };
    expect(out.choices[0].message.content).toBe("Answer");
    expect(JSON.parse(out.choices[0].message.tool_calls[0].function.arguments)).toEqual({ a: 1 });
    expect(out.choices[0].finish_reason).toBe("length");
    expect(out.usage.completion_tokens).toBe(5);
  });
});
