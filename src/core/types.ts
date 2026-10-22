/** Domain types shared by the whole app. Pure data — no DOM, no storage. */

export type LearnerLevel = "beginner" | "intermediate" | "advanced";
export type Difficulty = "e" | "m" | "h";
export type LessonLanguage = "English" | "Russian" | "Source";

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
}

export interface DayActivity {
  day: string;
  minutes: number;
  xp: number;
  sessions: number;
  correct: number;
  total: number;
}
