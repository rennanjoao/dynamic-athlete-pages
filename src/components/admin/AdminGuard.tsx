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
    const check = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate(requiredRole === "coach" ? "/auth" : "/admin-login");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const userRoles = roles?.map((r) => r.role) ?? [];
      const hasAccess =
        userRoles.includes("admin") ||
        (requiredRole === "coach" && userRoles.includes("coach"));

      if (!hasAccess) {
        navigate(requiredRole === "coach" ? "/fitness" : "/admin-login");
        return;
      }

      setAuthorized(true);
      setChecking(false);
    };

    check();
  }, [navigate, requiredRole]);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return authorized ? <>{children}</> : null;
};
