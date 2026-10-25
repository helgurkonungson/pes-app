/**
 * Read lessons aloud with the phone's own speech engine (offline, free).
 * Android: @capacitor-community/text-to-speech; browser: the Web Speech API.
 */
import { Capacitor } from "@capacitor/core";
import { TextToSpeech } from "@capacitor-community/text-to-speech";

/** Plain text from light Markdown: no **, list dashes or heading marks. */
export function speakable(md: string): string {
  return md
    .replace(/\*\*|__|`/g, "")
    .replace(/^#+\s*/gm, "")
    .replace(/^\s*[-•*]\s+/gm, "")
    .replace(/^\s*\d+[.)]\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

const count = (text: string, re: RegExp) => (text.match(re) ?? []).length;

// frequent short words that tell Latin-script languages apart
const STOPWORDS: [string, RegExp][] = [
  ["en-US", /\b(the|and|of|to|is|in|that|with|for|are)\b/gi],
  ["es-ES", /\b(el|la|los|las|de|que|y|en|es|por|con|una)\b/gi],
  ["de-DE", /\b(der|die|das|und|ist|nicht|mit|ein|eine|zu|den|auf)\b/gi],
  ["fr-FR", /\b(le|la|les|et|des|est|une|dans|que|pour|du|pas)\b/gi],
];

/**
 * BCP-47 language of a text for the speech engine: by script (Cyrillic, Han, Devanagari, Latin),
 * then by letters (Ukrainian і/ї/є/ґ, Belarusian ў) or frequent words. `hint` (e.g. the interface
 * locale) breaks ties inside a script.
 */
export function speechLang(text: string, hint?: string): string {
  const cyr = count(text, /[\u0400-\u04ff]/g);
  const lat = count(text, /[A-Za-z\u00c0-\u024f]/g);
  const han = count(text, /[\u4e00-\u9fff]/g);
  const dev = count(text, /[\u0900-\u097f]/g);
  const top = Math.max(cyr, lat, han, dev);
  if (top === 0) return hint ?? "en-US";
  if (han === top) return "zh-CN";
  if (dev === top) return "hi-IN";
  if (cyr === top) {
    if (count(text, /ў/gi) > 0) return "be-BY";
    if (count(text, /[їєґ]/gi) > 0 || (count(text, /і/gi) > 0 && count(text, /[ыэъё]/gi) === 0)) return "uk-UA";
    return "ru-RU";
  }
  const scores = STOPWORDS.map(([loc, re]) => [loc, count(text, re)] as const).sort((a, b) => b[1] - a[1]);
  if (scores[0][1] === 0 || scores[0][1] === scores[1][1]) {
    const h = hint && STOPWORDS.find(([loc]) => loc.slice(0, 2) === hint.slice(0, 2));
    if (h) return h[0];
  }
  return scores[0][1] > 0 ? scores[0][0] : "en-US";
}

/** Engines cut very long inputs: speak in pieces of whole sentences (≤ ~1500 chars). */
export function pieces(text: string, max = 1500): string[] {
  const out: string[] = [];
  let cur = "";
  // sentences without regex lookbehind (old Safari can't parse it)
  const sentences = text.replace(/([.!?…])\s+/g, "$1\n").split("\n");
  for (const s of sentences) {
    if (cur && (cur + " " + s).length > max) {
      out.push(cur);
      cur = s;
    } else cur = cur ? `${cur} ${s}` : s;
  }
  if (cur.trim()) out.push(cur);
  return out.filter((p) => p.trim());
}

let run = 0;

/** Speaks the text; resolves when finished or stopped. Throws when no engine is available. */
export async function speak(text: string, hint?: string): Promise<void> {
  const my = ++run;
  const lang = speechLang(text, hint);
  const parts = pieces(text);
  if (Capacitor.isNativePlatform()) {
    for (const p of parts) {
      if (my !== run) return;
      await TextToSpeech.speak({ text: p, lang, rate: 1.0, pitch: 1.0, volume: 1.0, category: "playback" });
    }
    return;
  }
  const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
  if (!synth) throw new Error("no speech synthesis");
  for (const p of parts) {
    if (my !== run) return;
    await new Promise<void>((resolve, reject) => {
      const u = new SpeechSynthesisUtterance(p);
      u.lang = lang;
      u.onend = () => resolve();
      u.onerror = (e) => (e.error === "interrupted" || e.error === "canceled" ? resolve() : reject(new Error(e.error)));
      synth.speak(u);
    });
  }
}

export async function stopSpeaking(): Promise<void> {
  run++;
  try {
    if (Capacitor.isNativePlatform()) await TextToSpeech.stop();
    else window.speechSynthesis?.cancel();
  } catch {
    /* nothing to stop */
  }
}
