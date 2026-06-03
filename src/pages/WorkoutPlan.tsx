import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Dumbbell, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ProtocolPayloadSchema } from "@/lib/protocolSchema";
import ProtocolQuestionButton from "@/components/student/ProtocolQuestionButton";

export default function WorkoutPlan() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) setUserId(data.session.user.id);
      else navigate("/auth");
    });
  }, [navigate]);

  const { data: planData, isLoading } = useQuery({
    queryKey: ["student-workout-json", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from("coach_plans").select("workout_periodization_json").eq("student_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
      return data ?? null;
    },
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const rawPayload = planData?.workout_periodization_json || {};
  const parsed = ProtocolPayloadSchema.safeParse(rawPayload);
  const safePayload = parsed.success ? parsed.data : rawPayload;
  
  const workouts = Array.isArray(safePayload.workouts) ? safePayload.workouts : [];
  const trainingGuideline = safePayload.guidelines?.training;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-3 flex items-center gap-3 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
        <div>
          <h1 className="text-lg font-bold text-foreground">Plano de Treino</h1>
          <p className="text-xs text-muted-foreground">Biomecânica e Periodização</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* DIRETRIZES DE TREINO EM EVIDÊNCIA */}
        {trainingGuideline && (
          <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl shadow-sm">
            <h3 className="text-amber-600 font-bold flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5" /> Atenção — Diretriz do Treinador
            </h3>
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {trainingGuideline}
            </p>
          </div>
        )}

        {workouts.length === 0 ? (
          <p className="text-center text-muted-foreground italic py-10">Treinos ainda não publicados.</p>
        ) : (
          <Accordion type="single" collapsible className="w-full space-y-4">
            {workouts.map((day: any, i: number) => (
              <AccordionItem key={i} value={`workout-${i}`} className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-muted/30">
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-black text-lg">
                      {day.key}
                    </div>
                    <div>
                      <h3 className="font-bold text-base">Treino {day.key}</h3>
                      <p className="text-xs text-muted-foreground">{day.focus || "Geral"}</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 border-t border-border/40">
                  <div className="space-y-4 mt-4">
                    {Array.isArray(day.exercises) && day.exercises.map((ex: any, idx: number) => (
                      <div key={idx} className="bg-background border border-border/50 rounded-lg p-3">
                        <h4 className="font-bold text-sm text-primary mb-2 flex items-start gap-2">
                          <span className="mt-0.5">•</span> {ex.name}
                        </h4>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <div className="bg-muted/50 p-2 rounded text-center">
                            <p className="text-[10px] text-muted-foreground uppercase">Séries</p>
                            <p className="font-semibold text-sm">{ex.sets || "-"}</p>
                          </div>
                          <div className="bg-muted/50 p-2 rounded text-center">
                            <p className="text-[10px] text-muted-foreground uppercase">Reps</p>
                            <p className="font-semibold text-sm">{ex.reps || "-"}</p>
                          </div>
                          <div className="bg-muted/50 p-2 rounded text-center">
                            <p className="text-[10px] text-muted-foreground uppercase">Pausa</p>
                            <p className="font-semibold text-sm">{ex.rest || "-"}</p>
                          </div>
                        </div>
                        {ex.notes && <p className="text-xs text-muted-foreground mt-2 italic bg-muted/30 p-2 rounded border-l-2 border-primary/50">{ex.notes}</p>}
                      </div>
                    ))}
                  </div>
                  
                  {/* BOTÃO DE DÚVIDA DO TREINO */}
                  <ProtocolQuestionButton context="exercise" variant="full" />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </main>
    </div>
  );
}
