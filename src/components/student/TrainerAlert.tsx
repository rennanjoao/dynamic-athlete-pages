import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export const TrainerAlert = () => {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlert = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await (supabase as any)
        .from("daily_alerts")
        .select("message, frequency, target_date")
        .eq("student_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const today = new Date().toISOString().split("T")[0];
        const alert = data[0];
        if (alert.frequency === "daily" || alert.frequency === "weekly" || (alert.frequency === "once" && alert.target_date === today)) {
          setMessage(alert.message);
        } else {
          setMessage(null);
        }
      }
    };

    fetchAlert();

    const channel = supabase
      .channel("student-alerts")
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_alerts" }, () => fetchAlert())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (!message) return null;

  return (
    <Alert className="mb-6 border backdrop-blur-md animate-fade-in-down" style={{
      backgroundColor: "hsla(145, 63%, 42%, 0.1)",
      borderColor: "hsla(145, 63%, 42%, 0.2)",
    }}>
      <Info className="h-5 w-5" style={{ color: "hsl(145, 63%, 49%)" }} />
      <AlertTitle className="font-bold tracking-wide" style={{ color: "hsl(145, 63%, 49%)" }}>
        Mensagem do Treinador
      </AlertTitle>
      <AlertDescription className="mt-1" style={{ color: "hsla(145, 63%, 90%, 0.8)" }}>
        "{message}"
      </AlertDescription>
    </Alert>
  );
};
