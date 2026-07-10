import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

if (typeof document !== "undefined") {
  const storedTheme = localStorage.getItem("theme") || "dark";
  if (storedTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

createRoot(document.getElementById("root")!).render(<App />);
