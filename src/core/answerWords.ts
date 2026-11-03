/**
 * Words in a typed answer, for the "write at least a few words" check before AI grading.
 * Chinese / Japanese / Korean are written without spaces: every two of their characters count
 * as a word (before 0.19.2 a Chinese answer counted as one word and could never be checked).
 */
const CJK = /[぀-ヿ㐀-䶿一-鿿가-힯豈-﫿]/g;

export function answerWords(text: string): number {
  const cjk = (text.match(CJK) ?? []).length;
  const rest = text.replace(CJK, " ").trim();
  const spaced = rest ? rest.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length : 0;
  return spaced + Math.ceil(cjk / 2);
}

/** Adds dictated text to what is already typed (1.1.0): a space between, CJK glued without one. */
export function appendDictated(current: string, said: string): string {
  const add = said.trim();
  if (!add) return current;
  const base = current.replace(/\s+$/, "");
  if (!base) return add;
  const cjk = new RegExp(CJK.source); // without the global flag: no state between calls
  return base + (cjk.test(base.slice(-1)) && cjk.test(add[0]) ? "" : " ") + add;
}
