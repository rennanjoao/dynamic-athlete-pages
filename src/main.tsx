import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installChunkErrorReloader } from "./lib/lazyWithRetry";

installChunkErrorReloader();

createRoot(document.getElementById("root")!).render(<App />);
