import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect } from "react";
import { create } from "zustand";
import { ConfirmHost, Toaster } from "../components/ui";
import { db, getProfile } from "../data/db";
import { type Route, useNav } from "../nav/store";
import { History, LessonView } from "../screens/History";
import { Home } from "../screens/Home";
import { Onboarding } from "../screens/Onboarding";
import { QuickStart } from "../screens/QuickStart";
import { Rewards } from "../screens/Rewards";
import { SessionScreen } from "../screens/Session";
import { Settings } from "../screens/Settings";
import { SkillsetDetail } from "../screens/SkillsetDetail";
import { SkillsetEdit } from "../screens/SkillsetEdit";
import { Skillsets } from "../screens/Skillsets";
import { Sources } from "../screens/Sources";
import { Stats } from "../screens/Stats";
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
      return <SessionScreen skillsetId={route.skillsetId} minutes={route.minutes} />;
    case "history":
      return <History id={route.id} />;
    case "lesson":
      return <LessonView sessionId={route.sessionId} />;
    case "settings":
      return <Settings />;
  }
}

export function App() {
  const profile = useLiveQuery(() => db.profile.get("me"), []);
  const { tab, stack, sheet } = useNav();

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
    getProfile(); // creates the default profile on first launch
    if (!Capacitor.isNativePlatform()) return;
    const sub = CapApp.addListener("backButton", () => {
      if (!useNav.getState().back()) CapApp.minimizeApp();
    });
    return () => {
      sub.then((s) => s.remove());
    };
  }, []);

  useEffect(() => {
    if (!canSelfUpdate()) return;
    checkForUpdate()
      .then((i) => useUpdate.getState().set(i))
      .catch(() => undefined);
  }, []);

  if (profile === undefined) return <div className="app" />;
  if (!profile.onboarded) {
    return (
      <div className="app">
        <Onboarding />
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
          {tab === "stats" && <Stats />}
          {tab === "rewards" && <Rewards />}
          <TabBar />
        </>
      )}
      {sheet === "quickstart" && <QuickStart />}
      <ConfirmHost />
      <Toaster />
    </div>
  );
}
