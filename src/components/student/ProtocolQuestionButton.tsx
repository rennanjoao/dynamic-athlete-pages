import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MessageCircle, Send, Loader2, Bot } from "lucide-react";
import { toast } from "sonner";
import { notifyCoach } from "@/lib/notifyCoach";

type Context = "exercise" | "meal" | "supplement" | "general";

interface Props {
  context: Context;
  itemRef?: string;
  studentName?: string;
  studentEmail?: string;
  variant?: "icon" | "button" | "full";
}

const contextLabels: Record<Context, string> = {
  exercise: "Treino / Exercício",
  meal: "Dieta / Refeição",
  supplement: "Suplementação",
  general: "Protocolo (Geral)",
};

export default function ProtocolQuestionButton({ context, itemRef, studentName, studentEmail, variant = "icon" }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [coachData, setCoachData] = useState<{ id: string; email: string | null } | null>(null);

  useEffect(() => {
    if (!open || coachData) return;
    (async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        const uid = session?.session?.user?.id;
        if (!uid) return;
        const { data: link } = await supabase.from("coach_students").select("coach_id").eq("student_id", uid).eq("status", "active").maybeSingle();
        if (link?.coach_id) {
          const { data: profile } = await supabase.from("profiles").select("notification_email, email").eq("user_id", link.coach_id).maybeSingle();
          setCoachData({ id: link.coach_id, email: profile?.notification_email || profile?.email || null });
        }
      } catch (e) {
        console.warn("Aviso: Coach lookup falhou.", e);
      }
    })();
  }, [open, coachData]);

  const send = async () => {
    if (!text.trim()) { toast.error("Escreva sua dúvida"); return; }
    setSending(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const uid = session?.session?.user?.id;

      if (coachData?.id) {
        // 1. INSERE NO BANCO (Isso faz o painel do Coach apitar em tempo real)
        const { error: dbError } = await supabase.from("coach_notifications").insert({
          coach_id: coachData.id,
          student_id: uid,
          student_name: studentName || "Aluno",
          context: contextLabels[context],
          message: text.trim()
        });
        if (dbError) throw dbError;

        // 2. DISPARA O EMAIL (Edge Function)
        if (coachData.email) {
          await notifyCoach({
            coachEmail: coachData.email,
            studentName,
            studentEmail,
            kind: "question",
            subject: `Dúvida sobre ${contextLabels[context]} — ${studentName ?? "Aluno"}`,
            summary: text.trim(),
            data: { contexto: contextLabels[context], item: itemRef || "—" },
          });
        }
      }
      
      toast.success("Dúvida enviada ao seu treinador!");
      
      // Aviso da IA
      setTimeout(() => {
        toast("A IA também pode te ajudar!", {
          description: "Use o botão de Chat para obter suporte sobre seu protocolo instantaneamente.",
          icon: <Bot className="w-5 h-5 text-primary" />,
          duration: 8000,
        });
      }, 1500);

      setText("");
      setOpen(false);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao enviar. Tente novamente.");
    } finally {
      setSending(false);
    }
  };

  if (variant === "full") {
    return (
      <>
        <Button variant="outline" className="w-full mt-4 border-dashed border-primary/50 text-primary hover:bg-primary/5" onClick={() => setOpen(true)}>
          <MessageCircle className="w-4 h-4 mr-2" /> Tenho uma dúvida sobre {contextLabels[context].toLowerCase()}
        </Button>
        <QuestionDialog open={open} setOpen={setOpen} text={text} setText={setText} send={send} sending={sending} context={context} />
      </>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center justify-center p-2 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
        <MessageCircle className="w-4 h-4" />
      </button>
      <QuestionDialog open={open} setOpen={setOpen} text={text} setText={setText} send={send} sending={sending} context={context} />
    </>
  );
}

function QuestionDialog({ open, setOpen, text, setText, send, sending, context }: any) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Relatar Dúvida</DialogTitle>
          <DialogDescription className="text-xs">
            Sua dúvida sobre <strong>{contextLabels[context as Context]}</strong> será enviada para o painel do seu treinador.
          </DialogDescription>
        </DialogHeader>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Descreva sua dúvida detalhadamente..." className="min-h-[120px] text-sm" />
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={sending}>Cancelar</Button>
          <Button size="sm" onClick={send} disabled={sending || !text.trim()}>{sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />} Enviar para o Coach</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
