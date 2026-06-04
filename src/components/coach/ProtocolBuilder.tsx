/**
 * ProtocolBuilder.tsx — Master Protocol Builder (Fase 2).
 *
 * Fluxo:
 *  1) Ao montar, busca protocolo ativo do aluno em `protocols` (is_template=false).
 *  2) Se existir → modo Edição (botão "Atualizar Protocolo").
 *  3) Se não existir → modal de Setup (split + qtd refeições + ciclo de carbo).
 *     "Gerar Base" monta o formulário dinâmico e salva.
 *
 * Persistência: tudo em `protocols.payload` (JSONB) validado por Zod.
 */

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, Save, Plus, Trash2, FileText, Dumbbell, UtensilsCrossed,
  Calendar, Sparkles, BarChart3, Activity, Pill, TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  ProtocolPayloadSchema, ProtocolPayload, SPLIT_OPTIONS, WEEKDAYS,
  buildBasePayload, makeEmptyExercise, makeEmptyMeal, type SplitValue,
} from "@/lib/protocolSchema";
import ProtocolImportExport from "./ProtocolImportExport";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb: any = supabase;

interface Props {
  studentId: string;
  studentName: string;
}

interface ProtocolRow {
  id: string;
  student_id: string;
  coach_id: string | null;
  name: string;
  is_template: boolean;
  payload: ProtocolPayload;
  active: boolean | null;
  updated_at: string;
}

export default function ProtocolBuilder({ studentId, studentName }: Props) {
  const qc = useQueryClient();
  const [coachId, setCoachId] = useState<string | null>(null);

  // estado local do formulário
  const [protocolId, setProtocolId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [payload, setPayload] = useState<ProtocolPayload | null>(null);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // modal de setup
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupSplit, setSetupSplit] = useState<SplitValue>("ABC");
  const [setupMeals, setSetupMeals] = useState(5);
  const [setupCarbCycle, setSetupCarbCycle] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setCoachId(data.session?.user?.id ?? null));
  }, []);

  // busca protocolo existente do aluno
  const { data: existing, isLoading } = useQuery({
    queryKey: ["protocol-builder", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await sb
        .from("protocols")
        .select("*")
        .eq("student_id", studentId)
        .eq("is_template", false)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as ProtocolRow | null) ?? null;
    },
  });

  // hidrata estado quando carrega
  useEffect(() => {
    if (existing) {
      setProtocolId(existing.id);
      setName(existing.name || `Protocolo — ${studentName}`);
      setActive(existing.active ?? true);
      const parsed = ProtocolPayloadSchema.safeParse(existing.payload);
      setPayload(parsed.success ? parsed.data : buildBasePayload({ split: "ABC", mealsCount: 5, carbCycle: false }));
    } else if (!isLoading && existing === null) {
      // sem protocolo → abre modal de setup automaticamente
      setSetupOpen(true);
    }
  }, [existing, isLoading, studentName]);

  const isEditMode = !!protocolId;

  function generateBase() {
    const base = buildBasePayload({
      split: setupSplit,
      mealsCount: setupMeals,
      carbCycle: setupCarbCycle,
    });
    setPayload(base);
    setName(`Protocolo — ${studentName}`);
    setActive(true);
    setProtocolId(null);
    setSetupOpen(false);
  }

  async function save() {
    if (!payload) return;
    if (!name.trim()) { toast.error("Dê um nome ao protocolo"); return; }
    setSaving(true);
    try {
      const parsed = ProtocolPayloadSchema.parse(payload);
      if (isEditMode && protocolId) {
        const { error } = await sb
          .from("protocols")
          .update({ name, payload: parsed, active, updated_at: new Date().toISOString() })
          .eq("id", protocolId);
        if (error) throw error;
        toast.success("Protocolo atualizado");
      } else {
        const { data, error } = await sb
          .from("protocols")
          .insert({
            student_id: studentId,
            coach_id: coachId,
            name,
            is_template: false,
            payload: parsed,
            active,
          })
          .select()
          .single();
        if (error) throw error;
        setProtocolId(data.id);
        toast.success("Protocolo criado");
      }

      // ── Sincroniza com coach_plans para que /routine e /workout-plan vejam ──
      if (coachId) {
        try {
          // Save the FULL parsed payload directly so the student-side viewer
          // can read the new structured meals (options + items with weight).
          const dietStrategyJson = parsed;
          const workoutPeriodizationJson = parsed;


          // coach_plans.goal aceita apenas: emagrecer | manter | hipertrofia | recomposicao
          const goalMap: Record<string, string> = {
            hipertrofia: "hipertrofia",
            emagrecimento: "emagrecer",
            emagrecer: "emagrecer",
            recomposicao: "recomposicao",
            performance: "manter",
            manter: "manter",
          };
          const safeGoal = goalMap[(parsed.macros?.goal ?? "manter").toLowerCase()] ?? "manter";

          const { error: planError } = await sb
            .from("coach_plans")
            .upsert(
              {
                student_id: studentId,
                coach_id: coachId,
                diet_strategy_json: dietStrategyJson,
                workout_periodization_json: workoutPeriodizationJson,
                base_calories: parsed.macros?.calories ?? 2200,
                base_protein_g: parsed.macros?.protein ?? 160,
                base_carbs_g: parsed.macros?.carbs ?? 250,
                base_fat_g: parsed.macros?.fat ?? 55,
                calories: parsed.macros?.calories ?? 2200,
                protein_g: parsed.macros?.protein ?? 160,
                carbs_g: parsed.macros?.carbs ?? 250,
                fat_g: parsed.macros?.fat ?? 55,
                water_l: parsed.macros?.water ?? 2.5,
                goal: safeGoal,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "coach_id,student_id" }
            );
          if (planError) {
            console.error("coach_plans sync error:", planError);
            toast.error("Protocolo salvo, mas a sincronização com a Dieta/Treino do aluno falhou", {
              description: planError.message,
              duration: 9000,
            });
          } else {
            toast.success("Dieta e Treino sincronizados com o aluno");
          }
        } catch (syncErr) {
          console.error("Sync coach_plans error:", syncErr);
          toast.error("Falha ao sincronizar com a área do aluno", {
            description: syncErr instanceof Error ? syncErr.message : String(syncErr),
            duration: 9000,
          });
        }
      }

      qc.invalidateQueries({ queryKey: ["protocol-builder", studentId] });
      qc.invalidateQueries({ queryKey: ["protocol", studentId] });
      qc.invalidateQueries({ queryKey: ["diet-strategy", studentId] });
      qc.invalidateQueries({ queryKey: ["workout-plan", studentId] });
      qc.invalidateQueries({ queryKey: ["coach-plan-presence", studentId] });
      qc.invalidateQueries({ queryKey: ["plan-macros", studentId] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header travado com aluno */}
      <Card className="bg-card/60 border-border p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold uppercase">
              {studentName.slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Aluno</p>
              <p className="text-sm font-semibold text-foreground truncate">{studentName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full ${
              isEditMode ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
            }`}>
              {isEditMode ? "Modo Edição" : "Novo Protocolo"}
            </span>
            <ProtocolImportExport
              payload={payload}
              studentName={studentName}
              onImport={(p) => { setPayload(p); setProtocolId(protocolId); }}
            />
            <Button variant="outline" size="sm" onClick={() => setSetupOpen(true)}>
              <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Recriar Base
            </Button>
          </div>
        </div>
      </Card>

      {/* Sem payload → empty state */}
      {!payload ? (
        <Card className="bg-card/60 border-border p-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground mb-4">
            Configure a base do protocolo (divisão de treino, refeições, ciclo de carbo).
          </p>
          <Button onClick={() => setSetupOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Gerar Base
          </Button>
        </Card>
      ) : (
        <>
          {/* Nome + ativo */}
          <Card className="bg-card/60 border-border p-4">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
              <div>
                <Label className="text-xs">Nome do protocolo</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-9 text-sm" />
              </div>
              <div className="flex items-center gap-2 pb-1">
                <Switch checked={active} onCheckedChange={setActive} id="active" />
                <Label htmlFor="active" className="text-xs cursor-pointer">Ativo</Label>
              </div>
            </div>
          </Card>

          {/* Tabs principais */}
          <Tabs defaultValue="macros">
            <TabsList className="grid grid-cols-5 w-full sm:w-[640px]">
              <TabsTrigger value="macros"><BarChart3 className="w-3.5 h-3.5 mr-1" />Macros</TabsTrigger>
              <TabsTrigger value="guidelines"><FileText className="w-3.5 h-3.5 mr-1" />Diretrizes & Supl.</TabsTrigger>
              <TabsTrigger value="workouts"><Dumbbell className="w-3.5 h-3.5 mr-1" />Treino</TabsTrigger>
              <TabsTrigger value="diet"><UtensilsCrossed className="w-3.5 h-3.5 mr-1" />Dieta</TabsTrigger>
              <TabsTrigger value="cycle"><Calendar className="w-3.5 h-3.5 mr-1" />Semana</TabsTrigger>
            </TabsList>

            {/* Macros base */}
            <TabsContent value="macros" className="mt-4">
              <MacrosTab payload={payload} setPayload={setPayload} />
            </TabsContent>

            {/* Diretrizes */}
            <TabsContent value="guidelines" className="mt-4">
              <GuidelinesTab payload={payload} setPayload={setPayload} />
            </TabsContent>

            {/* Treinos */}
            <TabsContent value="workouts" className="mt-4">
              <WorkoutsTab payload={payload} setPayload={setPayload} />
            </TabsContent>

            {/* Dieta */}
            <TabsContent value="diet" className="mt-4">
              <DietTab payload={payload} setPayload={setPayload} />
            </TabsContent>

            {/* Ciclo da semana */}
            <TabsContent value="cycle" className="mt-4">
              <WeekCycleTab payload={payload} setPayload={setPayload} />
            </TabsContent>
          </Tabs>

          {/* Salvar */}
          <div className="flex justify-end sticky bottom-4">
            <Button onClick={save} disabled={saving} size="lg" className="shadow-lg">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {isEditMode ? "Atualizar Protocolo" : "Criar Protocolo"}
            </Button>
          </div>
        </>
      )}

      {/* Modal de Setup */}
      <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Setup do Protocolo</DialogTitle>
            <DialogDescription className="text-xs">
              Define a estrutura base. Você ainda poderá editar tudo depois.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs">Divisão do treino</Label>
              <Select value={setupSplit} onValueChange={(v) => setSetupSplit(v as SplitValue)}>
                <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SPLIT_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-sm">{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Quantidade de refeições</Label>
              <Select value={String(setupMeals)} onValueChange={(v) => setSetupMeals(Number(v))}>
                <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[3,4,5,6,7,8].map((n) => (
                    <SelectItem key={n} value={String(n)} className="text-sm">{n} refeições</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label className="text-sm">Ciclo de carboidratos</Label>
                <p className="text-[11px] text-muted-foreground">Dias alto/baixo na semana</p>
              </div>
              <Switch checked={setupCarbCycle} onCheckedChange={setSetupCarbCycle} />
            </div>
            <Button onClick={generateBase} className="w-full">
              <Sparkles className="w-4 h-4 mr-2" /> Gerar Base
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sub-tabs ───────────────────────────────────────────────────────────────

function MacrosTab({ payload, setPayload }: { payload: ProtocolPayload; setPayload: (p: ProtocolPayload) => void }) {
  const m = payload.macros;
  const upd = (k: keyof typeof m, v: number | string) =>
    setPayload({ ...payload, macros: { ...m, [k]: v } as typeof m });
  return (
    <Card className="bg-card/60 border-border p-4">
      <p className="text-xs text-muted-foreground mb-3">
        Base calórica e macros do protocolo. Esses valores aparecem para o aluno e servem de referência para ciclo de carbo.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div><Label className="text-xs">Calorias</Label><Input type="number" value={m.calories} onChange={(e) => upd("calories", Number(e.target.value) || 0)} className="mt-1 h-9 text-sm" /></div>
        <div><Label className="text-xs">Proteína (g)</Label><Input type="number" value={m.protein} onChange={(e) => upd("protein", Number(e.target.value) || 0)} className="mt-1 h-9 text-sm" /></div>
        <div><Label className="text-xs">Carbo (g)</Label><Input type="number" value={m.carbs} onChange={(e) => upd("carbs", Number(e.target.value) || 0)} className="mt-1 h-9 text-sm" /></div>
        <div><Label className="text-xs">Gordura (g)</Label><Input type="number" value={m.fat} onChange={(e) => upd("fat", Number(e.target.value) || 0)} className="mt-1 h-9 text-sm" /></div>
        <div><Label className="text-xs">Água (L)</Label><Input type="number" step="0.1" value={m.water} onChange={(e) => upd("water", Number(e.target.value) || 0)} className="mt-1 h-9 text-sm" /></div>
        <div>
          <Label className="text-xs">Objetivo</Label>
          <Select value={m.goal} onValueChange={(v) => upd("goal", v)}>
            <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hipertrofia">Hipertrofia</SelectItem>
              <SelectItem value="emagrecimento">Emagrecimento</SelectItem>
              <SelectItem value="recomposicao">Recomposição</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="manter">Manutenção</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Ciclo de Carboidratos — percentuais customizáveis */}
      <div className="border-t border-border/40 pt-3 mt-4">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs font-semibold">Ciclo de Carboidratos</Label>
          <Switch
            checked={payload.setup.carbCycle}
            onCheckedChange={(v) =>
              setPayload({
                ...payload,
                setup: { ...payload.setup, carbCycle: v },
                carbCycle: v
                  ? Object.fromEntries(WEEKDAYS.map((d) => [d.key, "base"]))
                  : {},
              })
            }
          />
        </div>

        {payload.setup.carbCycle && (
          <div className="rounded-lg border border-border/40 bg-card/40 p-3 space-y-3 mt-2">
            <p className="text-[11px] text-muted-foreground">
              Variação percentual de carboidratos aplicada automaticamente para o aluno nos dias de ciclo.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-emerald-500">
                  Dia Alto — + %
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={payload.carbCycleHighPct ?? 15}
                    onChange={(e) =>
                      setPayload({ ...payload, carbCycleHighPct: Number(e.target.value) || 15 })
                    }
                    className="h-8 text-xs w-20"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Carbo base × {(1 + (payload.carbCycleHighPct ?? 15) / 100).toFixed(2)}
                </p>
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-amber-500">
                  Dia Off/Baixo — − %
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={payload.carbCycleLowPct ?? 15}
                    onChange={(e) =>
                      setPayload({ ...payload, carbCycleLowPct: Number(e.target.value) || 15 })
                    }
                    className="h-8 text-xs w-20"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Carbo base × {(1 - (payload.carbCycleLowPct ?? 15) / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function GuidelinesTab({ payload, setPayload }: { payload: ProtocolPayload; setPayload: (p: ProtocolPayload) => void }) {
  const upd = (k: keyof ProtocolPayload["guidelines"], v: string) =>
    setPayload({ ...payload, guidelines: { ...payload.guidelines, [k]: v } });
  return (
    <Card className="bg-card/60 border-border p-4 space-y-4">
      <Field label="Diretrizes de treino" hint="Regras gerais da semana (foco, intensidade, falha, descanso entre exercícios)">
        <Textarea value={payload.guidelines.training} onChange={(e) => upd("training", e.target.value)} className="min-h-[100px] text-sm" />
      </Field>
      <Field label="Diretrizes da dieta" hint="Hidratação, sal, fibras, suplementos com refeições etc.">
        <Textarea value={payload.guidelines.diet} onChange={(e) => upd("diet", e.target.value)} className="min-h-[100px] text-sm" />
      </Field>
      <Field label="Organização da semana" hint="Ex.: Seg/Qua/Sex carbo alto · Ter/Qui/Sab/Dom carbo baixo">
        <Textarea value={payload.guidelines.weekOrganization} onChange={(e) => upd("weekOrganization", e.target.value)} className="min-h-[80px] text-sm" />
      </Field>
      <Field label="Suplementação" hint="Listar suplementos, horários e dose">
        <Textarea value={payload.guidelines.supplementation} onChange={(e) => upd("supplementation", e.target.value)} className="min-h-[100px] text-sm" />
      </Field>
    </Card>
  );
}

function WorkoutsTab({ payload, setPayload }: { payload: ProtocolPayload; setPayload: (p: ProtocolPayload) => void }) {
  const updDay = (idx: number, patch: Partial<ProtocolPayload["workouts"][number]>) => {
    const next = [...payload.workouts];
    next[idx] = { ...next[idx], ...patch };
    setPayload({ ...payload, workouts: next });
  };
  const updExercise = (di: number, ei: number, patch: Partial<ProtocolPayload["workouts"][number]["exercises"][number]>) => {
    const next = [...payload.workouts];
    const exs = [...next[di].exercises];
    exs[ei] = { ...exs[ei], ...patch };
    next[di] = { ...next[di], exercises: exs };
    setPayload({ ...payload, workouts: next });
  };
  const addEx = (di: number) => updDay(di, { exercises: [...payload.workouts[di].exercises, makeEmptyExercise()] });
  const rmEx = (di: number, ei: number) =>
    updDay(di, { exercises: payload.workouts[di].exercises.filter((_, i) => i !== ei) });

  return (
    <div className="space-y-3">
      {payload.workouts.map((day, di) => (
        <Card key={day.key} className="bg-card/60 border-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
              {day.key}
            </div>
            <Input
              value={day.focus}
              onChange={(e) => updDay(di, { focus: e.target.value })}
              placeholder="Foco do treino (ex.: Peito + Tríceps)"
              className="h-9 text-sm flex-1"
            />
          </div>
          <div className="space-y-2">
            <div className="hidden md:grid grid-cols-[1.8fr_0.6fr_0.6fr_0.6fr_0.6fr_1fr_auto] gap-2 text-[10px] uppercase tracking-wider text-muted-foreground px-1">
              <div>Exercício</div><div>Séries</div><div>Reps</div><div>Cad.</div><div>Desc.</div><div>Obs.</div><div></div>
            </div>
            {day.exercises.map((ex, ei) => (
              <div key={ei} className="grid grid-cols-2 md:grid-cols-[1.8fr_0.6fr_0.6fr_0.6fr_0.6fr_1fr_auto] gap-2">
                <Input value={ex.name} onChange={(e) => updExercise(di, ei, { name: e.target.value })} placeholder="Supino reto" className="h-8 text-xs" />
                <Input value={ex.sets} onChange={(e) => updExercise(di, ei, { sets: e.target.value })} placeholder="4" className="h-8 text-xs" />
                <Input value={ex.reps} onChange={(e) => updExercise(di, ei, { reps: e.target.value })} placeholder="8-10" className="h-8 text-xs" />
                <Input value={ex.cadence} onChange={(e) => updExercise(di, ei, { cadence: e.target.value })} placeholder="3010" className="h-8 text-xs" />
                <Input value={ex.rest} onChange={(e) => updExercise(di, ei, { rest: e.target.value })} placeholder="60s" className="h-8 text-xs" />
                <Input value={ex.notes} onChange={(e) => updExercise(di, ei, { notes: e.target.value })} placeholder="—" className="h-8 text-xs" />
                <button onClick={() => rmEx(di, ei)} className="text-muted-foreground hover:text-destructive p-1.5">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => addEx(di)} className="h-7 text-xs mt-1">
              <Plus className="w-3 h-3 mr-1" /> Exercício
            </Button>
            <p className="text-[10px] text-muted-foreground mt-1">
              Deixe Reps/Cad./Desc. em branco para usar a diretriz geral.
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}

function DietTab({ payload, setPayload }: { payload: ProtocolPayload; setPayload: (p: ProtocolPayload) => void }) {
  const upd = (i: number, patch: Partial<ProtocolPayload["meals"][number]>) => {
    const next = [...payload.meals];
    next[i] = { ...next[i], ...patch };
    setPayload({ ...payload, meals: next });
  };
  const updMacro = (i: number, k: "carbs" | "protein" | "fat", v: number) => {
    upd(i, { macros: { ...payload.meals[i].macros, [k]: v } });
  };

  // Get options grouped by kind, ensuring 2 of each
  function getOptsForKind(meal: any, kind: "carb" | "protein" | "fat") {
    const all = Array.isArray(meal.options) ? meal.options : [];
    const filtered = all.filter((o: any) => o?.kind === kind);
    while (filtered.length < 2) filtered.push({ kind, title: `Opção ${filtered.length + 1}`, items: [{ name: "", weight: "" }] });
    return filtered.slice(0, 2);
  }

  function setOpts(mealIdx: number, newAll: any[]) {
    upd(mealIdx, { options: newAll as any });
  }

  function updOption(mealIdx: number, kind: "carb" | "protein" | "fat", optIdx: 0 | 1, patch: any) {
    const meal = payload.meals[mealIdx];
    const all = [...(meal.options as any[])];
    // Find the optIdx-th option of this kind in array
    let seen = -1;
    let targetGlobal = -1;
    for (let i = 0; i < all.length; i++) {
      if (all[i]?.kind === kind) {
        seen++;
        if (seen === optIdx) { targetGlobal = i; break; }
      }
    }
    if (targetGlobal === -1) {
      all.push({ kind, title: `Opção ${optIdx + 1}`, items: [{ name: "", weight: "" }], ...patch });
    } else {
      all[targetGlobal] = { ...all[targetGlobal], ...patch };
    }
    setOpts(mealIdx, all);
  }

  function updItem(mealIdx: number, kind: "carb" | "protein" | "fat", optIdx: 0 | 1, itemIdx: number, patch: { name?: string; weight?: string }) {
    const opts = getOptsForKind(payload.meals[mealIdx], kind);
    const items = [...(opts[optIdx].items as any[])];
    items[itemIdx] = { ...items[itemIdx], ...patch };
    updOption(mealIdx, kind, optIdx, { items });
  }

  function addItem(mealIdx: number, kind: "carb" | "protein" | "fat", optIdx: 0 | 1) {
    const opts = getOptsForKind(payload.meals[mealIdx], kind);
    const items = [...(opts[optIdx].items as any[]), { name: "", weight: "" }];
    updOption(mealIdx, kind, optIdx, { items });
  }

  function rmItem(mealIdx: number, kind: "carb" | "protein" | "fat", optIdx: 0 | 1, itemIdx: number) {
    const opts = getOptsForKind(payload.meals[mealIdx], kind);
    let items = [...(opts[optIdx].items as any[])];
    if (items.length <= 1) {
      items = [{ name: "", weight: "" }];
    } else {
      items.splice(itemIdx, 1);
    }
    updOption(mealIdx, kind, optIdx, { items });
  }

  function updSub(mealIdx: number, kind: "carb" | "protein" | "fat", subIdx: 0 | 1, patch: { name?: string; weight?: string }) {
    const subs: any = { ...payload.meals[mealIdx].substitutions };
    const arr = [...(subs[kind] ?? [{ name: "", weight: "" }, { name: "", weight: "" }])] as any[];
    while (arr.length < 2) arr.push({ name: "", weight: "" });
    arr[subIdx] = { ...arr[subIdx], ...patch };
    subs[kind] = arr;
    upd(mealIdx, { substitutions: subs });
  }

  const add = () => setPayload({ ...payload, meals: [...payload.meals, makeEmptyMeal(`Refeição ${payload.meals.length + 1}`)] });
  const rm = (i: number) => setPayload({ ...payload, meals: payload.meals.filter((_, idx) => idx !== i) });

  const KIND_LABEL: Record<string, { label: string; color: string }> = {
    carb: { label: "Carbo", color: "text-amber-500" },
    protein: { label: "Proteína", color: "text-blue-500" },
    fat: { label: "Gordura", color: "text-rose-500" },
  };

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-muted-foreground">
        Cada refeição tem 2 opções de cada macro (carbo, proteína, gordura). Adicione itens com nome e peso/medida. Opções vazias não aparecem para o aluno.
      </p>
      {payload.meals.map((m, i) => (
        <Card key={i} className="bg-card/60 border-border p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-[1.5fr_0.8fr_auto] gap-2">
            <Input value={m.name} onChange={(e) => upd(i, { name: e.target.value })} placeholder="Nome (Café, Almoço...)" className="h-9 text-sm" />
            <Input value={m.time} onChange={(e) => upd(i, { time: e.target.value })} placeholder="07:00" className="h-9 text-sm" />
            <button onClick={() => rm(i)} className="text-muted-foreground hover:text-destructive p-2">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {(["carb", "protein", "fat"] as const).map((kind) => {
            const opts = getOptsForKind(m, kind);
            return (
              <div key={kind} className="space-y-2">
                {[0, 1].map((optIdx) => {
                  const opt = opts[optIdx];
                  const items: any[] = Array.isArray(opt.items) ? opt.items : [];
                  return (
                    <div key={optIdx} className="rounded-lg border border-border/60 p-2.5 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] uppercase tracking-wider font-bold ${KIND_LABEL[kind].color}`}>
                          Opção de {KIND_LABEL[kind].label} {optIdx + 1}
                        </span>
                        <Input
                          value={opt.title}
                          onChange={(e) => updOption(i, kind, optIdx as 0 | 1, { title: e.target.value })}
                          placeholder={`Título (Opção ${optIdx + 1})`}
                          className="h-7 text-xs flex-1"
                        />
                      </div>
                      {items.map((it, ii) => (
                        <div key={ii} className="flex items-center gap-2">
                          <Input
                            value={it.name ?? ""}
                            onChange={(e) => updItem(i, kind, optIdx as 0 | 1, ii, { name: e.target.value })}
                            placeholder="Alimento / medida (ex: Arroz branco)"
                            className="h-8 text-xs flex-1"
                          />
                          <Input
                            value={it.weight ?? ""}
                            onChange={(e) => updItem(i, kind, optIdx as 0 | 1, ii, { weight: e.target.value })}
                            placeholder="ex: 150g"
                            className="h-8 text-xs w-28"
                          />
                          <button onClick={() => rmItem(i, kind, optIdx as 0 | 1, ii)} className="text-muted-foreground hover:text-destructive p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => addItem(i, kind, optIdx as 0 | 1)}
                        className="h-6 text-[11px] px-2"
                      >
                        <Plus className="w-3 h-3 mr-1" /> item
                      </Button>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Substituições */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Substituições rápidas</p>
            {(["carb", "protein", "fat"] as const).map((kind) => {
              const subs: any[] = Array.isArray((m.substitutions as any)?.[kind]) ? (m.substitutions as any)[kind] : [];
              const pair = [subs[0] ?? { name: "", weight: "" }, subs[1] ?? { name: "", weight: "" }];
              return (
                <div key={kind} className="rounded-lg border border-border/40 p-2 space-y-1.5">
                  <span className={`text-[10px] uppercase tracking-wider font-bold ${KIND_LABEL[kind].color}`}>
                    {KIND_LABEL[kind].label}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[0, 1].map((si) => (
                      <div key={si} className="flex items-center gap-2">
                        <Input
                          value={pair[si].name ?? ""}
                          onChange={(e) => updSub(i, kind, si as 0 | 1, { name: e.target.value })}
                          placeholder={`Substituição ${si + 1}`}
                          className="h-8 text-xs flex-1"
                        />
                        <Input
                          value={pair[si].weight ?? ""}
                          onChange={(e) => updSub(i, kind, si as 0 | 1, { weight: e.target.value })}
                          placeholder="peso"
                          className="h-8 text-xs w-24"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Macros colapsável */}
          <details className="rounded-lg border border-border/40 p-2">
            <summary className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground cursor-pointer">
              Macros + cálculo
            </summary>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-amber-500">Carbo (g)</Label>
                <Input type="number" value={m.macros.carbs} onChange={(e) => updMacro(i, "carbs", Number(e.target.value) || 0)} className="h-8 text-xs mt-1" />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-blue-500">Proteína (g)</Label>
                <Input type="number" value={m.macros.protein} onChange={(e) => updMacro(i, "protein", Number(e.target.value) || 0)} className="h-8 text-xs mt-1" />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-rose-500">Gordura (g)</Label>
                <Input type="number" value={m.macros.fat} onChange={(e) => updMacro(i, "fat", Number(e.target.value) || 0)} className="h-8 text-xs mt-1" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              Estimativa: <span className="font-bold text-foreground">{Math.round((m.macros.carbs || 0) * 4 + (m.macros.protein || 0) * 4 + (m.macros.fat || 0) * 9)} kcal</span>
              {" · "}Meta: <span className="font-bold text-foreground">{payload.macros.calories}</span> kcal / {payload.meals.length} ref ={" "}
              <span className="font-bold text-foreground">{Math.round(payload.macros.calories / Math.max(1, payload.meals.length))}</span> kcal/ref
            </p>
          </details>

          <Input
            value={m.notes ?? ""}
            onChange={(e) => upd(i, { notes: e.target.value })}
            placeholder="Observações da refeição (opcional)"
            className="h-8 text-xs"
          />
        </Card>
      ))}
      <Button variant="outline" size="sm" onClick={add}><Plus className="w-3.5 h-3.5 mr-1" /> Refeição</Button>
    </div>
  );
}


function WeekCycleTab({ payload, setPayload }: { payload: ProtocolPayload; setPayload: (p: ProtocolPayload) => void }) {
  if (!payload.setup.carbCycle) {
    return (
      <Card className="bg-card/60 border-border p-8 text-center">
        <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          Ciclo de carboidratos desativado nesse protocolo.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Use "Recriar Base" para ativá-lo.
        </p>
      </Card>
    );
  }
  const upd = (day: string, v: "high" | "base" | "off") =>
    setPayload({ ...payload, carbCycle: { ...payload.carbCycle, [day]: v } });

  return (
    <Card className="bg-card/60 border-border p-4">
      <p className="text-xs text-muted-foreground mb-3">
        Define o tipo de dia em cada dia da semana. A dieta mostrará a gramatura correta para o aluno.
      </p>
      <div className="space-y-2">
        {WEEKDAYS.map((d) => {
          const raw = payload.carbCycle[d.key] ?? "base";
          const v: "high" | "base" | "off" = raw === "low" ? "off" : (raw as "high" | "base" | "off");
          return (
            <div key={d.key} className="flex items-center gap-3">
              <div className="w-24 text-sm font-medium">{d.label}</div>
              <Select value={v} onValueChange={(val) => upd(d.key, val as "high" | "base" | "off")}>
                <SelectTrigger className="h-8 text-xs w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high" className="text-xs">Carbo Alto</SelectItem>
                  <SelectItem value="base" className="text-xs">Base</SelectItem>
                  <SelectItem value="off" className="text-xs">Off / Baixo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs font-semibold">{label}</Label>
      {hint && <p className="text-[10px] text-muted-foreground mb-1">{hint}</p>}
      <div className="mt-1">{children}</div>
    </div>
  );
}
