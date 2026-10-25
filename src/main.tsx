import "@fontsource-variable/plus-jakarta-sans";
import "./styles/app.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { installErrorLogging } from "./data/logs";
import { applySavedTheme } from "./app/theme";
import { initLang } from "./i18n";

installErrorLogging();
applySavedTheme();

// the interface language's dictionary is a separate chunk: load it before the first frame
void initLang().finally(() =>
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  ),
);
