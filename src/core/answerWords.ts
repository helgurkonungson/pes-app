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
