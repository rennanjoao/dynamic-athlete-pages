import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { supabase } from "@/integrations/supabase/client";

export const NavigationControls = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthPage = location.pathname === "/auth" || location.pathname === "/";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="fixed top-4 left-4 right-4 z-50 flex justify-between items-center pointer-events-none">
      <div className="pointer-events-auto">
        {!isAuthPage && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground bg-background/50 backdrop-blur-sm border shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span className="text-xs">Voltar</span>
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 pointer-events-auto bg-background/50 backdrop-blur-sm p-1 rounded-full border shadow-sm">
        <ThemeToggle />
        {!isAuthPage && (
          <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 text-destructive hover:bg-destructive/10">
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
