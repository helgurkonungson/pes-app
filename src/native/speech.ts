/**
 * Dictation for the open answer (1.1.0). On Android the phone's own speech recognition does the
 * work (the system "Speak now" window, usually Google's) and the app receives only the text; in a
 * browser the Web Speech API is used when it exists. Nothing is recorded or stored by the app.
 */
import { Capacitor } from "@capacitor/core";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";

type WebRecognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function webRecognition(): (new () => WebRecognition) | null {
  const w = window as unknown as { SpeechRecognition?: new () => WebRecognition; webkitSpeechRecognition?: new () => WebRecognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

let cached: Promise<boolean> | null = null;

/** Whether dictation can work here (checked once). */
export function dictationAvailable(): Promise<boolean> {
  cached ??= (async () => {
    if (!Capacitor.isNativePlatform()) return !!webRecognition();
    try {
      return (await SpeechRecognition.available()).available;
    } catch {
      return false;
    }
  })();
  return cached;
}

export class DictationError extends Error {
  constructor(public code: "denied" | "failed") {
    super(`dictation ${code}`);
  }
}

/** Listens once and returns what was said ("" when nothing was heard). `lang` is a BCP-47 tag. */
export async function dictate(lang: string, prompt?: string): Promise<string> {
  if (Capacitor.isNativePlatform()) {
    let perm = await SpeechRecognition.checkPermissions().catch(() => null);
    if (perm?.speechRecognition !== "granted") perm = await SpeechRecognition.requestPermissions().catch(() => null);
    if (perm?.speechRecognition !== "granted") throw new DictationError("denied");
    try {
      const r = await SpeechRecognition.start({ language: lang, maxResults: 1, prompt, popup: true, partialResults: false });
      return r.matches?.[0]?.trim() ?? "";
    } catch (e) {
      // closing the system window without speaking is not an error
      if (/no match|didn't understand|cancel/i.test(String((e as Error)?.message ?? e))) return "";
      throw new DictationError("failed");
    }
  }
  const Rec = webRecognition();
  if (!Rec) throw new DictationError("failed");
  return new Promise<string>((resolve, reject) => {
    const rec = new Rec();
    let text = "";
    rec.lang = lang;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      text = Array.from(e.results, (r) => r[0]?.transcript ?? "").join(" ").trim();
    };
    rec.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      reject(new DictationError(e.error === "not-allowed" ? "denied" : "failed"));
    };
    rec.onend = () => resolve(text);
    rec.start();
  });
}
