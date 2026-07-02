import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider } from "@/hooks/use-auth";
import "./index.css";

if (typeof document !== "undefined") {
  document.documentElement.classList.add("dark");
}

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>,
);
