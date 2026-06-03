/**
 * AdminGuard.tsx — Guard de rota com suporte a roles múltiplos
 *
 * Uso:
 *   <AdminGuard>              → aceita role 'admin'
 *   <AdminGuard requiredRole="coach">  → aceita role 'coach' OU 'admin'
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  children: React.ReactNode;
  requiredRole?: "admin" | "coach";
}

export const AdminGuard = ({ children, requiredRole = "admin" }: Props) => {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/admin-login", { replace: true });
        return;
      }

      const [{ data: isAdmin }, { data: isCoach }] = await Promise.all([
        supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
        supabase.rpc("has_role", { _user_id: user.id, _role: "coach" }),
      ]);

      const hasAccess =
        Boolean(isAdmin) ||
        (requiredRole === "coach" && Boolean(isCoach));

      if (!hasAccess) {
        await supabase.auth.signOut();
        navigate("/admin-login", { replace: true });
        return;
      }

      if (mounted) {
        setAuthorized(true);
        setChecking(false);
      }
    };

    check();

    return () => {
      mounted = false;
    };
  }, [navigate, requiredRole]);

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return authorized ? <>{children}</> : null;
};
