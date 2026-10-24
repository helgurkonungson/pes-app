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

/** BCP-47 language of a text: Russian when it is mostly Cyrillic. */
export function speechLang(text: string): string {
  const cyr = (text.match(/[А-Яа-яЁё]/g) ?? []).length;
  const lat = (text.match(/[A-Za-z]/g) ?? []).length;
  return cyr >= lat ? "ru-RU" : "en-US";
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
export async function speak(text: string): Promise<void> {
  const my = ++run;
  const lang = speechLang(text);
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
