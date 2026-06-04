import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Pill, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  
  const supplementationGuideline: string = safePayload?.guidelines?.supplementation ?? "";
  const supplements: any[] = Array.isArray(safePayload?.supplements) ? safePayload.supplements : [];

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
        {supplements.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Pill className="w-4 h-4 text-primary" /> Suplementos
            </h2>
            {supplements.map((s: any, i: number) => (
              <Card key={i} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-foreground">{s.name}</span>
                  {s.timing && <Badge variant="outline" className="text-xs">{s.timing}</Badge>}
                </div>
                {s.dose && <p className="text-sm text-primary font-semibold">{s.dose}</p>}
                {s.notes && <p className="text-xs text-muted-foreground italic mt-1">{s.notes}</p>}
              </Card>
            ))}
          </div>
        )}

        {supplementationGuideline.trim() && (
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-bold mb-2 text-muted-foreground flex items-center gap-2">
              <Info className="w-4 h-4" /> Observações gerais
            </h3>
            <p className="text-sm whitespace-pre-wrap text-foreground/90">{supplementationGuideline}</p>
          </div>
        )}

        {supplements.length === 0 && !supplementationGuideline.trim() && (
          <p className="text-center text-muted-foreground italic py-10">
            Suplementação ainda não publicada pelo coach.
          </p>
        )}

        <div className="pt-2">
          <ProtocolQuestionButton context="supplement" variant="full" />
        </div>
      </main>
    </div>
  );
}
