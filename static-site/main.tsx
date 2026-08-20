import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Game, { LandscapeGate } from "../app/page";
import "../app/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LandscapeGate />
    <Game />
  </StrictMode>,
);
