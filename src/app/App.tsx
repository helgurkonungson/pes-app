import { applyTheme } from "./theme";
import { autoSendLogs } from "../data/logSend";
import { retryUnsent } from "../data/reports";
import { scheduleReminders } from "../native/reminders";
import { settleStreakNow } from "../data/repo";
import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useLiveQuery } from "dexie-react-hooks";
import { type ComponentType, lazy, Suspense, useEffect, useState } from "react";
import { create } from "zustand";
import { ConfirmHost, toast, Toaster } from "../components/ui";
import { db, getProfile } from "../data/db";
import { requestPersistentStorage, restoreIfEmpty, writeSnapshot } from "../data/safety";
import { resolveLang, t, useLang } from "../i18n";
import { type Route, useNav } from "../nav/store";
import { Home } from "../screens/Home";
import { SessionScreen } from "../screens/Session";
import { SkillsetDetail } from "../screens/SkillsetDetail";
import { Skillsets } from "../screens/Skillsets";
import { autoUpdateCheckEnabled, dailyUpdateCheck, type UpdateInfo } from "../update/updater";
import { TabBar } from "./TabBar";
import { SITE_URL } from "../build";
import { useTutorial } from "./tutorialStore";

/**
 * Screens opened now and then load as separate chunks (smaller start-up script); Home,
 * Skillsets, a skillset and the lesson stay in the main bundle. All chunks ship inside the
 * APK, so this never needs the network.
 */
function named<M, K extends keyof M>(load: () => Promise<M>, key: K) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- props come from M[K]
  return lazy(async () => ({ default: (await load())[key] as M[K] & ComponentType<any> }));
}
const loadSettings = () => import("../screens/Settings");
const loadProgress = () => import("../screens/Progress");
const Settings = named(loadSettings, "Settings");
const Progress = named(loadProgress, "Progress");
const Onboarding = named(() => import("../screens/Onboarding"), "Onboarding");
const Sources = named(() => import("../screens/Sources"), "Sources");
const SkillsetEdit = named(() => import("../screens/SkillsetEdit"), "SkillsetEdit");
const History = named(() => import("../screens/History"), "History");
const LessonView = named(() => import("../screens/History"), "LessonView");
const Logs = named(() => import("../screens/Logs"), "Logs");
const Reports = named(() => import("../screens/Reports"), "Reports");
const Pro = named(() => import("../screens/Pro"), "Pro");
const Tutorial = named(() => import("../components/Tutorial"), "Tutorial");
import { UpdatePrompt } from "./UpdatePrompt";

/** The newer release (Home banner, Settings row) and whether the "new version" pop-up is open. */
export const useUpdate = create<{ info: UpdateInfo | null; prompt: boolean; set: (i: UpdateInfo | null) => void; closePrompt: () => void }>((set) => ({
  info: null,
  prompt: false,
  set: (info) => set({ info }),
  closePrompt: () => set({ prompt: false }),
}));

/** Daily update check: on start and whenever the app comes back to the foreground on a new day. */
function runDailyUpdateCheck(): void {
  dailyUpdateCheck()
    .then(({ info, fresh }) => useUpdate.setState((s) => ({ info, prompt: s.prompt || (fresh && !!info) })))
    .catch(() => undefined); // offline or GitHub down — retried on the next launch
}

function RouteView({ route }: { route: Route }) {
  switch (route.name) {
    case "skillset":
      return <SkillsetDetail id={route.id} />;
    case "skillsetEdit":
      return <SkillsetEdit id={route.id} />;
    case "sources":
      return <Sources id={route.id} />;
    case "session":
      return <SessionScreen skillsetId={route.skillsetId} minutes={route.minutes} offline={route.offline} />;
    case "history":
      return <History id={route.id} />;
    case "lesson":
      return <LessonView sessionId={route.sessionId} />;
    case "logs":
      return <Logs />;
    case "reports":
      return <Reports />;
    case "pro":
      return <Pro />;
  }
}

/** Startup: recover from an empty database, keep storage persistent, then show the app. */
function useBoot(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (await restoreIfEmpty()) toast(t("backup.autoRestored"));
      } catch {
        /* never block the app on recovery */
      }
      await getProfile(); // creates the default profile on first launch
      if (alive) setReady(true);
      requestPersistentStorage();
      void retryUnsent(); // lesson reports that could not be delivered last time
      void autoSendLogs().catch(() => undefined); // problems from the last run, if the learner allowed it
      // refresh the automatic snapshot a little after start, off the critical path
      setTimeout(() => writeSnapshot(), 8000);
    })();
    return () => {
      alive = false;
    };
  }, []);
  return ready;
}

export function App() {
  const ready = useBoot();
  // null = no profile row (first launch or after "Delete all data"); undefined = still loading
  const profile = useLiveQuery(() => db.profile.get("me").then((p) => p ?? null), []);
  const { tab, stack } = useNav();
  const setLang = useLang((s) => s.set);
  const replay = useTutorial((s) => s.open);

  // the interface language follows the profile (or the phone when set to "system")
  useEffect(() => {
    // no saved preference (e.g. right after "Delete all data") → keep the language in use
    if (profile?.uiLanguage) setLang(resolveLang(profile.uiLanguage));
  }, [profile?.uiLanguage, profile, setLang]);

  // light / dark / system (ADR-022)
  useEffect(() => {
    if (profile) applyTheme(profile.theme);
  }, [profile?.theme, profile]);

  useEffect(() => {
    if (ready && profile === null) getProfile(); // recreate the default profile → onboarding
  }, [ready, profile]);

  useEffect(() => {
    // keep focused fields visible above the on-screen keyboard
    const onFocus = (e: FocusEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "TEXTAREA" || el.tagName === "INPUT")) setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 350);
    };
    document.addEventListener("focusin", onFocus);
    return () => document.removeEventListener("focusin", onFocus);
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const sub = CapApp.addListener("backButton", () => {
      if (!useNav.getState().back()) CapApp.minimizeApp();
    });
    // snapshot when the app goes to the background (the OS may kill it later)
    const state = CapApp.addListener("appStateChange", ({ isActive }) => {
      if (!isActive) writeSnapshot();
      else void settleStreakNow().then(scheduleReminders); // a new day may have started; "studied today?" and due cards may have changed
    });
    return () => {
      sub.then((s) => s.remove());
      state.then((s) => s.remove());
    };
  }, []);

  useEffect(() => {
    // after boot: the check writes to the profile, and an empty database must be restored first
    if (ready) void settleStreakNow().then(scheduleReminders); // missed days: freezes, rest days, repair (ADR-029)
    if (!ready || !autoUpdateCheckEnabled()) return;
    runDailyUpdateCheck();
    if (!Capacitor.isNativePlatform()) return;
    const sub = CapApp.addListener("appStateChange", ({ isActive }) => {
      if (isActive) runDailyUpdateCheck();
    });
    return () => {
      sub.then((s) => s.remove());
    };
  }, [ready]);

  // deep links: the OpenRouter sign-in comes back as online.chompbook.app://oauth/openrouter?code=…
  useEffect(() => {
    if (!ready) return;
    const handle = (url: string) => void import("../ai/openrouterConnect").then((m) => m.handleOpenRouterCallback(url));
    const onEvent = (e: Event) => handle(String((e as CustomEvent<string>).detail));
    const onMessage = (e: MessageEvent) => {
      if (e.origin === SITE_URL && (e.data as { type?: string } | null)?.type === "pes-oauth") handle(String((e.data as { url: unknown }).url));
    };
    window.addEventListener("pes:deeplink", onEvent);
    window.addEventListener("message", onMessage);
    if (!Capacitor.isNativePlatform())
      return () => {
        window.removeEventListener("pes:deeplink", onEvent);
        window.removeEventListener("message", onMessage);
      };
    void CapApp.getLaunchUrl().then((r) => r?.url && handle(r.url)).catch(() => undefined);
    const sub = CapApp.addListener("appUrlOpen", ({ url }) => handle(url));
    return () => {
      window.removeEventListener("pes:deeplink", onEvent);
      window.removeEventListener("message", onMessage);
      void sub.then((s) => s.remove());
    };
  }, [ready]);

  // the two other tabs are warmed up once the app is idle, so the first tap shows them at once
  useEffect(() => {
    if (!ready) return;
    const tm = setTimeout(() => void Promise.all([loadSettings(), loadProgress()]).catch(() => undefined), 3000);
    return () => clearTimeout(tm);
  }, [ready]);

  if (!ready || !profile) return <div className="app" />;
  if (!profile.onboarded) {
    return (
      <div className="app">
        <Suspense fallback={<div className="onb" />}>
          <Onboarding />
        </Suspense>
        <ConfirmHost />
        <Toaster />
      </div>
    );
  }

  const top = stack[stack.length - 1];
  const tutorial = replay || profile.tutorial === "pending";
  return (
    <div className="app">
      <Suspense fallback={<div className="screen" />}>
        {top ? (
          <RouteView key={JSON.stringify(top)} route={top} />
        ) : (
          <>
            {tab === "home" && <Home />}
            {tab === "skillsets" && <Skillsets />}
            {tab === "progress" && <Progress />}
            {tab === "settings" && <Settings />}
          </>
        )}
      </Suspense>
      {!top && <TabBar />}
      {tutorial ? (
        <Suspense fallback={<div className="tutorial" />}>
          <Tutorial />
        </Suspense>
      ) : (
        <UpdatePrompt />
      )}
      <ConfirmHost />
      <Toaster />
    </div>
  );
}
