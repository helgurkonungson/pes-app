import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import { create } from "zustand";
import { ConfirmHost, toast, Toaster } from "../components/ui";
import { db, getProfile } from "../data/db";
import { requestPersistentStorage, restoreIfEmpty, writeSnapshot } from "../data/safety";
import { resolveLang, t, useLang } from "../i18n";
import { type Route, useNav } from "../nav/store";
import { History, LessonView } from "../screens/History";
import { Home } from "../screens/Home";
import { Onboarding } from "../screens/Onboarding";
import { Progress } from "../screens/Progress";
import { SessionScreen } from "../screens/Session";
import { Settings } from "../screens/Settings";
import { SkillsetDetail } from "../screens/SkillsetDetail";
import { SkillsetEdit } from "../screens/SkillsetEdit";
import { Skillsets } from "../screens/Skillsets";
import { Sources } from "../screens/Sources";
import { canSelfUpdate, checkForUpdate, type UpdateInfo } from "../update/updater";
import { TabBar } from "./TabBar";

export const useUpdate = create<{ info: UpdateInfo | null; set: (i: UpdateInfo | null) => void }>((set) => ({
  info: null,
  set: (info) => set({ info }),
}));

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

  // the interface language follows the profile (or the phone when set to "system")
  useEffect(() => {
    // no saved preference (e.g. right after "Delete all data") → keep the language in use
    if (profile?.uiLanguage) setLang(resolveLang(profile.uiLanguage));
  }, [profile?.uiLanguage, profile, setLang]);

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
    });
    return () => {
      sub.then((s) => s.remove());
      state.then((s) => s.remove());
    };
  }, []);

  useEffect(() => {
    if (!canSelfUpdate()) return;
    checkForUpdate()
      .then((i) => useUpdate.getState().set(i))
      .catch(() => undefined);
  }, []);

  if (!ready || !profile) return <div className="app" />;
  if (!profile.onboarded) {
    return (
      <div className="app">
        <Onboarding />
        <ConfirmHost />
        <Toaster />
      </div>
    );
  }

  const top = stack[stack.length - 1];
  return (
    <div className="app">
      {top ? (
        <RouteView key={JSON.stringify(top)} route={top} />
      ) : (
        <>
          {tab === "home" && <Home />}
          {tab === "skillsets" && <Skillsets />}
          {tab === "progress" && <Progress />}
          {tab === "settings" && <Settings />}
          <TabBar />
        </>
      )}
      <ConfirmHost />
      <Toaster />
    </div>
  );
}
