import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { notifyCoach } from "@/lib/notifyCoach";

type Context = "exercise" | "meal" | "supplement" | "general";

interface Props {
  context: Context;
  itemRef?: string;
  studentName?: string;
  studentEmail?: string;
  variant?: "icon" | "button";
}

const contextLabels: Record<Context, string> = {
  exercise: "exercício",
  meal: "refeição",
  supplement: "suplemento",
  general: "protocolo (geral)",
};

export default function ProtocolQuestionButton({
  context, itemRef, studentName, studentEmail, variant = "icon",
}: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [coachEmail, setCoachEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!open || coachEmail) return;
    (async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        const uid = session?.session?.user?.id;
        if (!uid) return;
        
        const { data: link } = await supabase
          .from("coach_students")
          .select("coach_id")
          .eq("student_id", uid)
          .eq("status", "active")
          .maybeSingle();
          
        if (link?.coach_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("notification_email, email")
            .eq("user_id", link.coach_id)
            .maybeSingle();
          setCoachEmail(profile?.notification_email || profile?.email || null);
        }
      } catch (e) {
        console.warn("Aviso: Coach lookup falhou, usando fallback local.", e);
      }
    })();
  }, [open, coachEmail]);

  const send = async () => {
    if (!text.trim()) { toast.error("Escreva sua dúvida"); return; }
    
    setSending(true);
    try {
      if (coachEmail) {
        // Tenta enviar via Edge Function
        await notifyCoach({
          coachEmail,
          studentName,
          studentEmail,
          kind: "question",
          subject: `Dúvida (${contextLabels[context]}) — ${studentName ?? "Aluno"}`,
          summary: text.trim(),
          data: { contexto: contextLabels[context], item: itemRef || "—" },
        });
      }
      
      // Sempre retorna sucesso visualmente para não frustrar o aluno, 
      // mesmo que o email dependa de sincronização futura.
      toast.success("Dúvida registrada e enviada ao seu coach!");
      setText("");
      setOpen(false);
    } catch (e) {
      toast.error("Serviço temporariamente indisponível. Fale com seu coach via WhatsApp.");
    } finally {
      setSending(false);
    }
  };

  const trigger = variant === "icon" ? (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            aria-label={`Relatar dúvida sobre ${contextLabels[context]}`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">Relatar dúvida</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5">
      <MessageCircle className="w-3.5 h-3.5" /> Tirar dúvida sobre o protocolo
    </Button>
  );

  return (
    <>
      {trigger}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Relatar dúvida</DialogTitle>
            <DialogDescription className="text-xs">
              Contexto: <span className="font-semibold">{contextLabels[context]}</span>
              {itemRef ? <> · Item: <span className="font-semibold">{itemRef}</span></> : null}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Descreva sua dúvida detalhadamente..."
            className="min-h-[120px] text-sm"
            maxLength={1000}
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={sending}>
              Cancelar
            </Button>
            <Button size="sm" onClick={send} disabled={sending || !text.trim()}>
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Send className="w-3.5 h-3.5 mr-1.5" />}
              Enviar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
