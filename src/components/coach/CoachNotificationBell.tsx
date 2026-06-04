import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Trash2, Check, Loader2, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";

interface Notification {
  id: string;
  coach_id: string;
  student_id: string | null;
  student_name: string;
  context: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

function contextBadgeColor(ctx: string) {
  const c = ctx.toLowerCase();
  if (c.includes("treino") || c.includes("exerc")) return "bg-blue-500/15 text-blue-600 border-blue-500/30";
  if (c.includes("dieta") || c.includes("refeição") || c.includes("meal")) return "bg-amber-500/15 text-amber-600 border-amber-500/30";
  if (c.includes("supl")) return "bg-emerald-500/15 text-emerald-600 border-emerald-500/30";
  return "bg-muted text-muted-foreground border-border";
}

function fmtWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

export default function CoachNotificationBell() {
  const [coachId, setCoachId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setCoachId(data.session.user.id);
        fetchNotifications(data.session.user.id);
      }
    });
  }, []);

  const fetchNotifications = async (uid: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("coach_notifications")
      .select("*")
      .eq("coach_id", uid)
      .eq("is_read", false)
      .order("created_at", { ascending: false });
    if (!error && data) setNotifications(data as Notification[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!coachId) return;

    const channel = supabase
      .channel("coach-notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "coach_notifications", filter: `coach_id=eq.${coachId}` },
        (payload) => {
          const n = payload.new as Notification;
          setNotifications((prev) => [n, ...prev]);
          toast(`Nova dúvida de ${n.student_name}`, {
            description: `${n.context}: "${n.message.substring(0, 60)}${n.message.length > 60 ? "…" : ""}"`,
            icon: <Bell className="w-4 h-4 text-primary" />,
            duration: 6000,
            action: { label: "Ver", onClick: () => setOpen(true) },
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coachId]);

  const markRead = async (id: string) => {
    const { error } = await supabase
      .from("coach_notifications")
      .update({ is_read: true })
      .eq("id", id);
    if (error) { toast.error("Falha ao marcar como lida"); return; }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const remove = async (id: string) => {
    const { error } = await supabase
      .from("coach_notifications")
      .delete()
      .eq("id", id);
    if (error) { toast.error("Falha ao excluir"); return; }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="relative p-2 cursor-pointer hover:bg-muted rounded-full transition-colors"
          aria-label="Caixa de dúvidas"
        >
          <Bell className="w-5 h-5 text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full border-2 border-background">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Inbox className="w-4 h-4 text-primary" /> Dúvidas dos Alunos
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              Nenhuma dúvida pendente
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className="rounded-lg border border-border bg-card p-3 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm text-foreground truncate">{n.student_name}</span>
                  <Badge variant="outline" className={`text-[10px] ${contextBadgeColor(n.context)}`}>
                    {n.context}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">{fmtWhen(n.created_at)}</p>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{n.message}</p>
                <div className="flex justify-end gap-2 pt-1">
                  <Button size="sm" variant="ghost" onClick={() => remove(n.id)} className="h-7 text-xs text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => markRead(n.id)} className="h-7 text-xs">
                    <Check className="w-3.5 h-3.5 mr-1" /> Marcar como lida
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
