/** Domain types shared by the whole app. Pure data — no DOM, no storage. */

export type LearnerLevel = "beginner" | "intermediate" | "advanced";
export type Difficulty = "e" | "m" | "h";
/** Language lessons are written in ("Source" = the language of the materials). */
export type LessonLanguage = "English" | "Russian" | "Ukrainian" | "Belarusian" | "Spanish" | "German" | "French" | "Chinese" | "Hindi" | "Source";
/** Interface language. "system" follows the phone's language. */
export type UiLanguage = "system" | "en" | "ru" | "uk" | "be" | "es" | "de" | "fr" | "zh" | "hi";
/** How lessons are made: "auto" uses AI when it works and falls back to offline lessons; "offline" never calls AI. */
export type AiMode = "auto" | "offline";
/** Where a lesson came from. */
export type LessonMode = "ai" | "offline" | "course";
/** Error kinds that make AI unusable until the learner fixes something. */
export type AiBlock = "no-key" | "auth" | "credits";
/** AI provider whose key the learner uses. */
export type ProviderId = "anthropic" | "openai" | "gemini" | "yandex" | "qwen" | "groq" | "nvidia" | "mistral" | "openrouter" | "custom";

export interface Skillset {
  id: string;
  name: string;
  goal: string;
  /** Hue (0–360) for the skillset's hero gradient. */
  hue: number;
  /** Default portion size in minutes. */
  minutes: number;
  useInternet: boolean;
  language: LessonLanguage;
  createdAt: string;
  placement?: PlacementResult;
  /** Final test result, once the material is covered. */
  final?: FinalResult;
  /** Order index of the next chunk to teach. */
  cursor: number;
  lessonsDone: number;
  xp: number;
  correct: number;
  total: number;
  minutesSpent: number;
  /** Learner (or the app, when AI is unavailable) chose to start without a placement test. */
  placementSkipped?: boolean;
  /** Word offset inside the chunk at `cursor` reached by offline reading. */
  cursorWord?: number;
  /** Set when the skillset was created from an imported course. */
  courseId?: string;
}

export interface PlacementResult {
  score: number;
  total: number;
  level: LearnerLevel;
  strengths: string[];
  gaps: string[];
  at: string;
  /** Material (chunk or course lesson ids) the learner already knows — lessons skip it. */
  known?: string[];
  /** The learner skipped the test: we assume they start from zero. */
  skipped?: boolean;
}

export type SourceKind = "pdf" | "epub" | "docx" | "text" | "url";

export interface Source {
  id: string;
  skillsetId: string;
  kind: SourceKind;
  title: string;
  origin: string;
  addedAt: string;
  words: number;
  chunks: number;
}

export interface Chunk {
  id: string;
  skillsetId: string;
  sourceId: string;
  /** Global order within the skillset (sources appended in the order added). */
  order: number;
  title: string;
  text: string;
  words: number;
  coveredAt?: string;
}

export interface Mcq {
  id: string;
  q: string;
  options: string[];
  answer: number;
  explanation: string;
  difficulty?: Difficulty;
  topic?: string;
  /** Placement tests: the material the question checks (chunk id or course lesson id). */
  ref?: string;
  /** Spaced repetition: the card this question was taken from. */
  cardId?: string;
}

export interface OpenQuestion {
  id: string;
  q: string;
  rubric: string[];
  /** Ready-made answer for self-checking (courses and offline lessons). */
  modelAnswer?: string;
}

export interface TheorySection {
  heading: string;
  body: string;
}

export interface LessonContent {
  title: string;
  review: { recap: string[]; questions: Mcq[] };
  theory: { sections: TheorySection[]; keyPoints: string[] };
  quiz: Mcq[];
  open: OpenQuestion;
  links?: { title: string; url: string }[];
  /** Missing in lessons made before v0.2 — those were all AI lessons. */
  mode?: LessonMode;
  /** Id of the course lesson this session teaches. */
  courseLessonId?: string;
  /** Why an offline lesson was made instead of an AI one. */
  fallback?: AiBlock | "offline-mode" | "network";
  /** Offline reading: where the reading stops (cursor after the lesson). */
  readTo?: { cursor: number; word: number };
  /** Set while the rest of an AI lesson is still being written in the background. */
  building?: LessonBuilding;
  /** The review step is an intermediate test this time (every few lessons). */
  checkpoint?: boolean;
  /** AI tokens used to write this lesson. */
  usage?: TokenUsage;
}

export interface LessonBuilding {
  /** Steps finished of all steps (plan, review, parts, quiz). */
  done: number;
  total: number;
  /** Theory parts planned (some may not be written yet). */
  sections: number;
  /** Writing stopped with this error kind (network, rate…); resumes on retry or return. */
  error?: string;
}

export interface PlacementContent {
  intro: string;
  questions: Mcq[];
}

export interface OpenGrade {
  score: number;
  verdict: string;
  strengths: string[];
  gaps: string[];
  modelAnswer: string;
  /** True when the learner graded themselves against the model answer. */
  self?: boolean;
}

export interface SessionProgress {
  page: number;
  /** question id → chosen option index */
  mcq: Record<string, number>;
  openAnswer?: string;
  grade?: OpenGrade;
  /** Active seconds spent in the session. */
  seconds: number;
}

export interface SessionResult {
  xp: number;
  correct: number;
  total: number;
  /** Intermediate test inside this lesson: right answers of its questions. */
  checkpoint?: { correct: number; total: number };
  openScore?: number;
  minutesSpent: number;
  badges: string[];
  levelUp?: number;
  streak: number;
}

/** placement = entry test; final = the final test once the material is covered (both use `placement` content). */
export type SessionKind = "placement" | "lesson" | "final";
export type SessionStatus = "ready" | "active" | "done";

export interface Session {
  id: string;
  skillsetId: string;
  kind: SessionKind;
  number: number;
  minutes: number;
  status: SessionStatus;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  chunkIds: string[];
  lesson?: LessonContent;
  placement?: PlacementContent;
  progress: SessionProgress;
  result?: SessionResult;
}

export interface StreakState {
  current: number;
  best: number;
  lastDay?: string;
}

export interface Profile {
  id: "me";
  name: string;
  xp: number;
  streak: StreakState;
  /** badge id → ISO date earned */
  badges: Record<string, string>;
  dailyGoal: number;
  model: string;
  onboarded: boolean;
  createdAt: string;
  uiLanguage?: UiLanguage;
  aiMode?: AiMode;
  /** Last persistent AI problem (cleared after the next successful AI call). */
  aiBlock?: { kind: AiBlock; at: string };
  /** Active AI provider (default: anthropic; `model` above is the Claude model). */
  provider?: ProviderId;
  /** Chosen model per non-Claude provider. */
  providerModels?: Partial<Record<ProviderId, string>>;
  /** Yandex AI Studio folder id (needed for model URIs). */
  yandexFolder?: string;
  /** DashScope region for Qwen. */
  qwenRegion?: "intl" | "cn";
  /** Base URL of a custom OpenAI-compatible server (Ollama, LM Studio, vLLM, a proxy…), e.g. http://192.168.1.10:11434/v1 */
  customBaseUrl?: string;
  /** Last automatic update check (the first launch of each day). */
  updateCheck?: UpdateCheck;
  /** Daily reminder (local notification). Unset = on at 19:00 once the learner allows notifications. */
  reminder?: { on: boolean; time: string };
  /** Age band from a neutral age screen (only the band is kept), asked before connecting an AI service. */
  ageGroup?: "child" | "teen" | "adult";
  /** Explicit consents for the assisted free connections (Groq, Mistral, OpenRouter). */
  aiConsents?: Partial<Record<ProviderId, { version: number; at: string }>>;
  /** Colour theme; default "system". */
  theme?: "system" | "light" | "dark";
  /** Explicit consent to create a free Gemini key in the learner's Google account (ADR-021). */
  geminiConsent?: { version: number; at: string; auto: boolean };
  /** AI tokens used, per calendar month ("2026-10"). */
  usage?: Record<string, TokenUsage>;
  /** First-run tutorial: "pending" right after onboarding; unset for learners who started before it existed. */
  tutorial?: "pending" | "done" | "skipped";
}

export interface TokenUsage {
  input: number;
  output: number;
  requests: number;
}

/**
 * Spaced repetition card: a question the learner met in a lesson, shown again in the
 * review step when due (Leitner boxes: 1, 3, 7, 14, 30, 60 days).
 */
export interface Card {
  /** skillsetId + question fingerprint: the same question never makes two cards. */
  id: string;
  skillsetId: string;
  mcq: Mcq;
  /** 0 = not learned yet … 5 = long-term. */
  box: number;
  /** Local day (YYYY-MM-DD) when it is due. */
  due: string;
  seen: number;
  lapses: number;
  createdAt: string;
  lastDay?: string;
}

/** Result of the final test of a skillset. */
export interface FinalResult {
  score: number;
  total: number;
  at: string;
  /** Topics answered wrong — their cards go back to the start. */
  weak: string[];
}

/** A newer app release found on GitHub. */
export interface UpdateInfo {
  version: string;
  /** Release notes (the CHANGELOG section, Markdown). */
  notes: string;
  apkUrl?: string;
  pageUrl: string;
  publishedAt: string;
}

/** Result of the automatic update check, kept so later launches that day need no network. */
export interface UpdateCheck {
  /** Local day of the check, "YYYY-MM-DD". */
  day: string;
  /** The newer release found then, if any. */
  available?: UpdateInfo;
}

// ---------- imported courses ----------

export interface CourseLesson {
  id: string;
  module?: string;
  title: string;
  sources: string[];
  theory: { sections: TheorySection[]; keyPoints: string[] };
  quiz: Mcq[];
  /** Asked in the review step of the following lesson. */
  recall: Mcq[];
  open: OpenQuestion;
}

export interface Course {
  id: string;
  version: number;
  title: string;
  description: string;
  language: LessonLanguage;
  goal: string;
  minutes: number;
  hue: number;
  lessons: CourseLesson[];
  importedAt: string;
}

export interface DayActivity {
  day: string;
  minutes: number;
  xp: number;
  sessions: number;
  correct: number;
  total: number;
}

/** One theory section as planned before it is written. */
export interface DraftSectionPlan {
  heading: string;
  /** What exactly this section teaches (1–2 sentences). */
  focus: string;
  /** 1-based numbers of the source excerpts it draws on. */
  excerpts: number[];
}

/**
 * An AI lesson being written step by step (plan → sections → review → quiz).
 * Every finished step is saved, so an interrupted lesson (phone asleep, app
 * closed, provider error) continues where it stopped instead of starting over.
 */
export interface LessonDraft {
  /** = skillsetId: one lesson in the works per skillset. */
  id: string;
  skillsetId: string;
  minutes: number;
  number: number;
  /** Source chunks the lesson teaches; a different set means a new draft. */
  chunkIds: string[];
  createdAt: string;
  updatedAt: string;
  /** Web notes (Claude only); null = searched, nothing usable. */
  research?: { text: string; links: { title: string; url: string }[] } | null;
  plan?: { title: string; sections: DraftSectionPlan[]; keyPoints: string[]; open: { q: string; rubric: string[] } };
  /** Section bodies by index; missing = not written yet. */
  sections: (string | null)[];
  review?: { recap: string[]; questions: unknown[] };
  quiz?: unknown[];
  /** AI tokens spent on this lesson so far. */
  usage?: TokenUsage;
}

/** One entry of the local error journal (Settings → Error log). Never contains keys. */
export interface LogEntry {
  id?: number;
  at: string;
  /** "error" (crash / unhandled), "ai" (AI request failed), "import" (file could not be read), "info". */
  kind: "error" | "ai" | "import" | "info";
  message: string;
  detail?: string;
  /** App version that logged it. */
  version: string;
}

/** Why a learner reported a lesson. */
export type ReportReason = "harmful" | "wrong" | "inappropriate" | "quality" | "other";

/**
 * "Report this lesson": kept on the phone and sent to the developer (Google Play's
 * AI-generated content policy, App Store guideline 1.2). Holds no keys or personal data
 * beyond what the learner typed.
 */
export interface LessonReport {
  id?: number;
  at: string;
  sessionId: string;
  skillsetId: string;
  reason: ReportReason;
  comment?: string;
  /** Session kind and step the learner was on, e.g. "lesson · theory 2/3". */
  where: string;
  /** The reported text (cut). */
  excerpt: string;
  lessonTitle?: string;
  mode?: LessonMode;
  provider?: ProviderId;
  model?: string;
  /** App version. */
  version: string;
  /** When it reached the developer (report endpoint); unset = only on the phone / shared by hand. */
  sentAt?: string;
}
