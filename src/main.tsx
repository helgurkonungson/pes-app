import "@fontsource-variable/plus-jakarta-sans";
import "./styles/app.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { installErrorLogging } from "./data/logs";
import { applySavedTheme } from "./app/theme";

installErrorLogging();
applySavedTheme();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
