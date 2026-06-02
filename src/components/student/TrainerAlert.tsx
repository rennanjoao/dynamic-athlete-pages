import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStudentData } from "@/hooks/useStudentData";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Zap } from "lucide-react";

export const TrainerAlert = () => {
  // 1. Puxamos os dados dinâmicos do aluno (que já têm Realtime ativo na tabela protocols)
  const { protocol, studentId } = useStudentData();
  
  const [message, setMessage] = useState<string | null>(null);
  
  // Estado para controlar o Pop-up de Vibração
  const [protocolUpdateAlert, setProtocolUpdateAlert] = useState(false);
  
  // Guardamos a última data do protocolo em memória para não causar re-renders infinitos
  const prevProtocolDate = useRef<string | null>(null);

  // 2. Detetor de Atualização em Tempo Real (Treino / Dieta)
  useEffect(() => {
    if (protocol?.updated_at) {
      // Se já tínhamos registo de uma data anterior, e ela acabou de mudar na base de dados...
      if (prevProtocolDate.current && prevProtocolDate.current !== protocol.updated_at) {
        // Dispara o alerta vibratório!
        setProtocolUpdateAlert(true);
        
        // Opcional: O alerta fecha-se sozinho após 15 segundos
        setTimeout(() => setProtocolUpdateAlert(false), 15000);
      }
      prevProtocolDate.current = protocol.updated_at;
    }
  }, [protocol?.updated_at]);

  // 3. O código original que deteta as Mensagens Diárias
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
      .channel("student-alerts-daily")
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_alerts", filter: `student_id=eq.${studentId}` }, () => fetchAlert())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [studentId]);

  if (!message && !protocolUpdateAlert) return null;

  return (
    <>
      {/* Estilo embutido para a Animação de Vibração sem mexer no Tailwind Config */}
      <style>
        {`
          @keyframes vibrate {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-4px) rotate(-3deg); }
            40% { transform: translateX(4px) rotate(3deg); }
            60% { transform: translateX(-4px) rotate(-3deg); }
            80% { transform: translateX(4px) rotate(3deg); }
          }
          .animate-vibrate {
            animation: vibrate 0.4s ease-in-out infinite;
          }
        `}
      </style>

      {/* POP-UP 1: ATUALIZAÇÃO DO TREINO / DIETA (Tem prioridade, vibra e aparece no topo) */}
      {protocolUpdateAlert && (
        <Alert 
          className="mb-6 border backdrop-blur-md animate-vibrate cursor-pointer shadow-lg transition-all" 
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

      {/* POP-UP 2: MENSAGEM DIÁRIA ORIGINAL (Aparece se o alerta vibratório não estiver ativo) */}
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
