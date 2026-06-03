import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell } from "lucide-react";
import { toast } from "sonner";

export default function CoachNotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [coachId, setCoachId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setCoachId(data.session.user.id);
        fetchUnreadCount(data.session.user.id);
      }
    });
  }, []);

  const fetchUnreadCount = async (uid: string) => {
    const { count, error } = await supabase
      .from("coach_notifications")
      .select("*", { count: "exact", head: true })
      .eq("coach_id", uid)
      .eq("is_read", false);
      
    if (!error && count !== null) {
      setUnreadCount(count);
    }
  };

  useEffect(() => {
    if (!coachId) return;

    // Conecta ao Socket de Notificações
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'coach_notifications', filter: `coach_id=eq.${coachId}` },
        (payload) => {
          const newNotification = payload.new;
          
          // Incrementa o contador da bolinha vermelha
          setUnreadCount((prev) => prev + 1);

          // Dispara o "Apito" visual no painel
          toast(`Nova dúvida de ${newNotification.student_name}`, {
            description: `Contexto: ${newNotification.context}\n"${newNotification.message.substring(0, 50)}..."`,
            icon: <Bell className="w-5 h-5 text-red-500 animate-pulse" />,
            duration: 8000,
            action: {
              label: "Ler",
              onClick: () => {
                // Aqui você pode redirecionar para a caixa de entrada futura
                toast.dismiss();
              }
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coachId]);

  return (
    <div className="relative p-2 cursor-pointer hover:bg-muted rounded-full transition-colors">
      <Bell className="w-5 h-5 text-foreground" />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full border-2 border-background">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  );
}
