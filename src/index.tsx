import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";


const container = document.getElementById("root");
const root = createRoot(container!);
root.render(<App />);

// Register service worker for offline support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/serviceWorker.js")
      .then((reg) => console.log("Service Worker registered:", reg))
      .catch((err) => console.error("Service Worker registration failed:", err));
  });
}

