import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LoginGate } from "./components/LoginGate";
import "./App.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LoginGate />
  </StrictMode>
);

