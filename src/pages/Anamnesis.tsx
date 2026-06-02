/**
 * Anamnesis.tsx — Nova ficha de anamnese com Vinculação de Treinador (coach_students).
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ANAMNESIS_SECTIONS, extractBaseline } from "@/lib/anamnesisSchema";
import { FormField } from "@/components/student/FormField";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CheckCircle2, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb: any = supabase;
const DRAFT_KEY = "anamnesis_draft_v1";

export default function Anamnesis() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [data, setData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [coaches, setCoaches] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session?.user) { navigate("/auth"); return; }
      const uid = sess.session.user.id;
      setUserId(uid);

      // Busca os Treinadores Disponíveis
      const { data: coachList } = await sb.from("profiles").select("user_id, full_name, team_name").eq("role", "coach");
      if (coachList) setCoaches(coachList);

      // Busca a Anamnese do Aluno
      const { data: row } = await sb.from("anamnesis").select("*").eq("student_id", uid).maybeSingle();

      if (row) {
        setData((row.payload as Record<string, unknown>) || {});
        setSubmitted(!!row.submitted_at);
      } else {
        try {
          const draft = localStorage.getItem(DRAFT_KEY);
          if (draft) setData(JSON.parse(draft));
        } catch { /* ignore */ }
      }
      setLoading(false);
    })();
  }, [navigate]);

  useEffect(() => {
    if (loading) return;
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(data)); } catch { /* ignore */ }
  }, [data, loading]);

  const progress = useMemo(() => {
    const all = ANAMNESIS_SECTIONS.flatMap((s) => s.fields);
    const filled = all.filter((f) => {
      const v = data[f.key];
      return v !== undefined && v !== null && v !== "";
    }).length;
    return Math.round((filled / all.length) * 100);
  }, [data]);

  async function persist(submit: boolean) {
    if (!userId) return;
    if (submit && !data.coach_id) {
      toast.error("Por favor, selecione quem será o seu treinador.");
      return;
    }

    setSaving(true);
    try {
      const baseline = extractBaseline(data);
      const payload = {
        student_id: userId,
        payload: data,
        baseline_metrics: baseline,
        ...(submit ? { submitted_at: new Date().toISOString() } : {}),
      };
      
      const { error } = await sb.from("anamnesis").upsert(payload, { onConflict: "student_id" });
      if (error) throw error;

      if (submit) {
         // Atualiza o Perfil Silenciosamente
         const alturaFormatada = data.altura ? parseFloat(String(data.altura)) : null;
         await sb.from("profiles").upsert({
            user_id: userId,
            full_name: data.nome || "Aluno",
            gender: data.genero === "F" ? "female" : "male",
            height: alturaFormatada,
            birth_date: data.data_nasc || null
         }, { onConflict: "user_id" });

         // Realiza o Vínculo Físico Treinador x Aluno
         const { error: insErr } = await sb.from("coach_students").insert({
            coach_id: data.coach_id,
            student_id: userId,
            status: "active"
         });
         
         // Se já existir, força a ativação
         if (insErr && insErr.code === "23505") {
            await sb.from("coach_students").update({ status: "active" }).eq("coach_id", data.coach_id).eq("student_id", userId);
         }
      }

      toast.success(submit ? "Anamnese enviada com sucesso!" : "Rascunho salvo.");
      
      if (submit) {
        setSubmitted(true);
        try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
        qc.invalidateQueries({ queryKey: ["anamnesis", userId] });
        setTimeout(() => navigate("/student-area"), 1200);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao salvar";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-foreground">Anamnese Clínica</h1>
            <p className="text-[11px] text-muted-foreground">
              {submitted ? "Editar e reenviar" : "Preencha uma vez — vira sua linha de base"}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold text-primary">{progress}%</div>
            <div className="w-20 h-1 bg-muted rounded-full overflow-hidden mt-0.5">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* BLOCO EXCLUSIVO PARA ESCOLHER O TREINADOR */}
        {!submitted && coaches.length > 0 && (
          <Card className="bg-primary/5 border-primary/30 p-5 shadow-sm">
            <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-4">
              Vínculo de Acompanhamento
            </h2>
            <div className="grid grid-cols-1">
              <Label className="text-xs text-foreground font-semibold mb-2 block">
                Selecione o seu Treinador *
              </Label>
              <Select value={(data.coach_id as string) || ""} onValueChange={(v) => setData(p => ({ ...p, coach_id: v }))}>
                <SelectTrigger className="w-full h-10 bg-background border-border">
                  <SelectValue placeholder="Escolha quem irá montar o seu protocolo..." />
                </SelectTrigger>
                <SelectContent>
                  {coaches.map(c => (
                    <SelectItem key={c.user_id} value={c.user_id}>
                      {c.full_name} {c.team_name ? `(${c.team_name})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>
        )}

        {ANAMNESIS_SECTIONS.map((sec) => (
          <Card key={sec.id} className="bg-card/60 border-border p-5">
            <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-4">
              {sec.title}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {sec.fields.map((f) => (
                <div key={f.key} className={f.half ? "col-span-1" : "col-span-2"}>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">
                    {f.label}
                  </Label>
                  <FormField
                    field={f}
                    value={data[f.key]}
                    onChange={(v) => setData((p) => ({ ...p, [f.key]: v }))}
                  />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border z-20">
        <div className="max-w-3xl mx-auto px-4 py-3 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => persist(false)} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar rascunho
          </Button>
          <Button className="flex-1" onClick={() => persist(true)} disabled={saving || progress < 30}>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {submitted ? "Reenviar" : "Enviar anamnese"}
          </Button>
        </div>
      </footer>
    </div>
  );
}
