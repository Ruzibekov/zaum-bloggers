import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/onest";
import "./styles/tokens.css";
import "./styles/global.css";
import { App } from "./App";

const container = document.getElementById("root");
if (!container) throw new Error("Root element #root is missing");

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
