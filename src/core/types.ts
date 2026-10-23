/** Domain types shared by the whole app. Pure data — no DOM, no storage. */

export type LearnerLevel = "beginner" | "intermediate" | "advanced";
export type Difficulty = "e" | "m" | "h";
export type LessonLanguage = "English" | "Russian" | "Source";
/** Interface language. "system" follows the phone's language. */
export type UiLanguage = "system" | "en" | "ru";
/** How lessons are made: "auto" uses AI when it works and falls back to offline lessons; "offline" never calls AI. */
export type AiMode = "auto" | "offline";
/** Where a lesson came from. */
export type LessonMode = "ai" | "offline" | "course";
/** Error kinds that make AI unusable until the learner fixes something. */
export type AiBlock = "no-key" | "auth" | "credits";
/** AI provider whose key the learner uses. */
export type ProviderId = "anthropic" | "openai" | "gemini" | "yandex" | "qwen" | "groq" | "nvidia" | "custom";

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
  openScore?: number;
  minutesSpent: number;
  badges: string[];
  levelUp?: number;
  streak: number;
}

export type SessionKind = "placement" | "lesson";
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
