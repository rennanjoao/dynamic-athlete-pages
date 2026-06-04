import { useLocation } from "react-router-dom";
import { FitnessChatBot } from "@/components/fitness/FitnessChatBot";

const HIDDEN_ROUTES = new Set(["/", "/auth", "/admin-login", "/student"]);

export const GlobalAIAssistant = () => {
  const { pathname } = useLocation();
  if (HIDDEN_ROUTES.has(pathname)) return null;
  return <FitnessChatBot />;
};
