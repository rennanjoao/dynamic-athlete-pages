import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Pill, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProtocolPayloadSchema } from "@/lib/protocolSchema";
import ProtocolQuestionButton from "@/components/student/ProtocolQuestionButton";

export default function Supplements() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) setUserId(data.session.user.id);
    });
  }, []);

  const { data: planData, isLoading } = useQuery({
    queryKey: ["student-supps-json", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from("coach_plans").select("diet_strategy_json").eq("student_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
      return data ?? null;
    },
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const rawPayload = planData?.diet_strategy_json || {};
  const parsed = ProtocolPayloadSchema.safeParse(rawPayload);
  const safePayload: any = parsed.success ? parsed.data : rawPayload;
  
  const supplementationGuideline = safePayload?.guidelines?.supplementation;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-3 flex items-center gap-3 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Suplementação</h1>
          <p className="text-xs text-muted-foreground">Fármacos e Vitaminas</p>
        </div>
        <ProtocolQuestionButton context="supplement" variant="icon" />
      </header>


      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6 border-b border-border/50 pb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Pill className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Protocolo Ativo</h2>
                <p className="text-sm text-muted-foreground">Siga as dosagens prescritas.</p>
              </div>
            </div>

            {supplementationGuideline ? (
              <div className="space-y-4">
                <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                    {supplementationGuideline}
                  </p>
                </div>
                
                <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-600/90 dark:text-blue-400">
                    A suplementação tem horários estratégicos. Em caso de desconforto gástrico, suspenda o uso e comunique o treinador.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground italic py-8">Nenhum protocolo de suplementação publicado.</p>
            )}

            {/* BOTÃO DE DÚVIDA DA SUPLEMENTAÇÃO */}
            <div className="mt-6 border-t border-border/50 pt-6">
              <ProtocolQuestionButton context="supplement" variant="full" />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
