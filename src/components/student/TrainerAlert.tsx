import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStudentData } from "@/hooks/useStudentData";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Zap } from "lucide-react";

export const TrainerAlert = () => {
  const { protocol, studentId } = useStudentData();
  const [message, setMessage] = useState<string | null>(null);
  const [protocolUpdateAlert, setProtocolUpdateAlert] = useState(false);
  const prevProtocolDate = useRef<string | null>(null);

  useEffect(() => {
    if (protocol?.updated_at) {
      if (prevProtocolDate.current && prevProtocolDate.current !== protocol.updated_at) {
        setProtocolUpdateAlert(true);
        setTimeout(() => setProtocolUpdateAlert(false), 15000);
      }
      prevProtocolDate.current = protocol.updated_at;
    }
  }, [protocol?.updated_at]);

  useEffect(() => {
    if (!studentId) return;

    const fetchAlert = async () => {
      const { data } = await supabase
        .from("daily_alerts")
        .select("message, frequency, target_date")
        .eq("student_id", studentId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const today = new Date();
        const todayString = today.toISOString().split("T")[0];
        const currentDay = today.getDay(); // 0 = Domingo, 1 = Segunda-feira...
        
        const alert = data[0];

        // Regra de validação estrita para o tipo de frequência
        if (
          alert.frequency === "daily" || 
          (alert.frequency === "weekly" && currentDay === 1) || 
          (alert.frequency === "once" && alert.target_date === todayString)
        ) {
          setMessage(alert.message);
        } else {
          setMessage(null);
        }
      } else {
        setMessage(null);
      }
    };

    fetchAlert();

    const channel = supabase
      .channel("student-alerts-daily")
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_alerts", filter: `student_id=eq.${studentId}` }, () => fetchAlert())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [studentId]);

  if (!message && !protocolUpdateAlert) return null;

  return (
    <>
      <style>
        {`
          @keyframes softPulse {
            0%, 100% { transform: translateY(0); box-shadow: 0 0 0 0 hsla(145, 63%, 50%, 0.35); }
            50% { transform: translateY(-1px); box-shadow: 0 0 0 6px hsla(145, 63%, 50%, 0); }
          }
          .animate-soft-pulse {
            animation: softPulse 2.2s ease-in-out infinite;
          }
        `}
      </style>

      {protocolUpdateAlert && (
        <Alert 
          className="mb-6 border backdrop-blur-md animate-soft-pulse cursor-pointer shadow-lg transition-all" 
          style={{
            backgroundColor: "hsla(145, 63%, 12%, 0.95)",
            borderColor: "hsl(145, 63%, 50%)",
          }}
          onClick={() => setProtocolUpdateAlert(false)}
        >
          <Zap className="h-5 w-5" style={{ color: "hsl(145, 63%, 50%)" }} />
          <AlertTitle className="font-bold tracking-wide" style={{ color: "hsl(145, 63%, 50%)" }}>
            Protocolo Atualizado!
          </AlertTitle>
          <AlertDescription className="mt-1 text-gray-200">
            O seu treinador acabou de atualizar o seu Treino / Dieta. As mudanças já se encontram disponíveis no ecrã. (Clique para dispensar)
          </AlertDescription>
        </Alert>
      )}

      {message && !protocolUpdateAlert && (
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
      )}
    </>
  );
};
