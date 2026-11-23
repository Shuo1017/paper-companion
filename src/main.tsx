import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CoverGate from "./CoverGate";
import "./globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode><CoverGate /></StrictMode>,
);
