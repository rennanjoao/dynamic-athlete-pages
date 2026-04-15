/**
 * AnamnesisForm.tsx — Formulário multi-step de Anamnese Clínica
 * Mobile-first, shadcn/ui, Supabase
 */

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  User,
  Activity,
  Dumbbell,
  Pill,
  Apple,
  Moon,
  Brain,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  Save,
  Check,
} from "lucide-react";

const STEPS = [
  { label: "Dados Gerais", icon: User },
  { label: "Rotina", icon: Activity },
  { label: "Treinamento", icon: Dumbbell },
  { label: "Substâncias", icon: Pill },
  { label: "TGI e Dieta", icon: Apple },
  { label: "Descanso", icon: Moon },
  { label: "Neurológico", icon: Brain },
  { label: "Scans Clínicos", icon: Stethoscope },
];

const BRISTOL_SCALE = [
  { value: "type_1", label: "Tipo 1 – Caroços duros separados" },
  { value: "type_2", label: "Tipo 2 – Salsicha com caroços" },
  { value: "type_3", label: "Tipo 3 – Salsicha com rachaduras" },
  { value: "type_4", label: "Tipo 4 – Salsicha lisa e macia" },
  { value: "type_5", label: "Tipo 5 – Pedaços macios" },
  { value: "type_6", label: "Tipo 6 – Pastoso" },
  { value: "type_7", label: "Tipo 7 – Líquido" },
];

type FormData = Record<string, string | number | boolean | null>;

export default function AnamnesisForm({ userId }: { userId: string }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>({});
  const [saving, setSaving] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);

  // Fetch available coaches
  const { data: coaches = [] } = useQuery({
    queryKey: ["available-coaches"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("manage-trainers", {
        body: { action: "list-coaches" },
      });
      if (error || data?.error) return [];
      return data?.coaches || [];
    },
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    loadExisting();
  }, [userId]);

  async function loadExisting() {
    const { data: rows } = await (supabase as any)
      .from("clinical_anamnesis")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);
    if (rows && rows.length > 0) {
      setExistingId(rows[0].id);
      setData(rows[0] as FormData);
    }
  }

  function set(key: string, value: string | number | boolean | null) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload: Record<string, any> = { ...data, user_id: userId };
      delete payload.id;
      delete payload.created_at;
      delete payload.updated_at;

      if (existingId) {
        const { error } = await (supabase as any)
          .from("clinical_anamnesis")
          .update(payload)
          .eq("id", existingId);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await (supabase as any)
          .from("clinical_anamnesis")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        if (inserted) setExistingId(inserted.id);
      }
      toast.success("Anamnese salva com sucesso!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  function TextInput({ field, label, placeholder, type = "text" }: { field: string; label: string; placeholder?: string; type?: string }) {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={field} className="text-sm font-medium">{label}</Label>
        <Input
          id={field}
          type={type}
          placeholder={placeholder}
          value={(data[field] as string) || ""}
          onChange={(e) => set(field, type === "number" ? (e.target.value ? Number(e.target.value) : null) : e.target.value)}
        />
      </div>
    );
  }

  function TextArea({ field, label, placeholder }: { field: string; label: string; placeholder?: string }) {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={field} className="text-sm font-medium">{label}</Label>
        <Textarea
          id={field}
          placeholder={placeholder}
          value={(data[field] as string) || ""}
          onChange={(e) => set(field, e.target.value)}
          rows={3}
        />
      </div>
    );
  }

  function NumericSlider({ field, label, min = 0, max = 10 }: { field: string; label: string; min?: number; max?: number }) {
    const val = typeof data[field] === "number" ? (data[field] as number) : 5;
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">{label}</Label>
          <Badge variant="outline" className="text-xs">{val}/{max}</Badge>
        </div>
        <Slider
          value={[val]}
          min={min}
          max={max}
          step={1}
          onValueChange={([v]) => set(field, v)}
        />
      </div>
    );
  }

  function renderStep() {
    switch (step) {
      case 0: // Dados Gerais
        return (
          <div className="grid gap-4">
            <TextInput field="full_name" label="Nome completo" />
            <div className="grid grid-cols-2 gap-3">
              <TextInput field="age" label="Idade" type="number" />
              <TextInput field="city_state" label="Cidade/UF" />
            </div>
            <TextInput field="whatsapp" label="WhatsApp" placeholder="+55 (00) 00000-0000" />

            {/* Coach Selector */}
            {coaches.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Coach / Treinador</Label>
                <Select
                  value={(data.coach_id as string) || ""}
                  onValueChange={(v) => set("coach_id", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione seu coach" />
                  </SelectTrigger>
                  <SelectContent>
                    {coaches.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.full_name}{c.team_name ? ` — ${c.team_name}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <TextInput field="height" label="Altura (cm)" type="number" />
              <TextInput field="total_weight" label="Peso total (kg)" type="number" />
            </div>
            <TextInput field="lean_mass_bf" label="Massa magra / BF (%)" type="number" />
            <h4 className="text-sm font-semibold text-muted-foreground mt-2">Circunferências (cm)</h4>
            <div className="grid grid-cols-2 gap-3">
              <TextInput field="waist_cm" label="Cintura" type="number" />
              <TextInput field="hip_cm" label="Quadril" type="number" />
              <TextInput field="arm_contracted_right" label="Braço contrat. D" type="number" />
              <TextInput field="arm_contracted_left" label="Braço contrat. E" type="number" />
              <TextInput field="arm_relaxed_right" label="Braço relax. D" type="number" />
              <TextInput field="arm_relaxed_left" label="Braço relax. E" type="number" />
              <TextInput field="thigh_right" label="Coxa D" type="number" />
              <TextInput field="thigh_left" label="Coxa E" type="number" />
              <TextInput field="calf_right" label="Panturrilha D" type="number" />
              <TextInput field="calf_left" label="Panturrilha E" type="number" />
            </div>
          </div>
        );
      case 1: // Rotina
        return (
          <div className="grid gap-4">
            <TextArea field="profession_schedule" label="Profissão e horários" placeholder="Ex: Contador, 8h–18h seg-sex" />
            <TextArea field="study_schedule" label="Estudos" placeholder="Horários de estudo, se aplicável" />
            <TextArea field="physical_activities" label="Atividades físicas" placeholder="Musculação, corrida, etc." />
            <TextInput field="activity_times" label="Horários das atividades" placeholder="Ex: 06h, 18h" />
            <TextInput field="sleep_schedule" label="Horário de sono" placeholder="Ex: 23h–07h" />
            <TextArea field="consulting_goals" label="Objetivos da consultoria" placeholder="O que espera alcançar?" />
          </div>
        );
      case 2: // Treinamento
        return (
          <div className="grid gap-4">
            <TextInput field="time_without_rest" label="Tempo sem descanso do treino" placeholder="Ex: 3 meses" />
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label>Periodiza treino?</Label>
              <Switch
                checked={!!data.periodizes_training}
                onCheckedChange={(v) => set("periodizes_training", v)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Sensação de estagnação</Label>
              <Select value={(data.stagnation_feeling as string) || "none"} onValueChange={(v) => set("stagnation_feeling", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  <SelectItem value="mild">Leve</SelectItem>
                  <SelectItem value="moderate">Moderada</SelectItem>
                  <SelectItem value="severe">Severa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Pump muscular</Label>
              <Select value={(data.muscle_pump as string) || "normal"} onValueChange={(v) => set("muscle_pump", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="absent">Ausente</SelectItem>
                  <SelectItem value="low">Baixo</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 3: // Substâncias
        return (
          <div className="grid gap-4">
            <TextArea field="prescribed_meds" label="Medicamentos prescritos" placeholder="Nome, dosagem, frequência" />
            <TextArea field="drugs_history" label="Histórico de drogas" placeholder="Se aplicável" />
            <TextArea field="hormones_history" label="Histórico de hormônios" placeholder="TRT, anabolizantes, etc." />
            <TextArea field="stimulants" label="Estimulantes" placeholder="Cafeína, pré-treino, etc." />
          </div>
        );
      case 4: // TGI e Dieta
        return (
          <div className="grid gap-4">
            <TextArea field="food_recall" label="Recordatório alimentar (24h)" placeholder="Descreva o que comeu ontem" />
            <div className="space-y-1.5">
              <Label>Consistência das fezes (Bristol)</Label>
              <Select value={(data.feces_consistency as string) || "type_4"} onValueChange={(v) => set("feces_consistency", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BRISTOL_SCALE.map((b) => (
                    <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <TextArea field="feces_obs" label="Observações (fezes)" />
            <TextArea field="gastric_issues" label="Problemas gástricos" placeholder="Refluxo, gases, inchaço, etc." />
            <TextArea field="food_availability" label="Disponibilidade de alimentos" placeholder="Alimentos de fácil acesso" />
            <TextArea field="allergies" label="Alergias e intolerâncias" />
          </div>
        );
      case 5: // Descanso
        return (
          <div className="grid gap-4">
            <TextInput field="sleep_latency" label="Latência do sono" placeholder="Ex: 15 min" />
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label>Acorda descansado(a)?</Label>
              <Switch
                checked={data.wakes_rested !== false}
                onCheckedChange={(v) => set("wakes_rested", v)}
              />
            </div>
            <TextInput field="night_awakenings" label="Despertares noturnos" type="number" />
            <TextArea field="night_symptoms" label="Sintomas noturnos" placeholder="Bruxismo, apneia, etc." />
            <TextArea field="daytime_fatigue_peaks" label="Picos de fadiga diurna" placeholder="Horários em que sente mais cansaço" />
            <TextInput field="hrv_fvc_avg" label="HRV / FVC médio" type="number" />
          </div>
        );
      case 6: // Neurológico
        return (
          <div className="grid gap-4">
            <p className="text-sm text-muted-foreground">Avalie cada item de 0 (muito ruim) a 10 (excelente).</p>
            <NumericSlider field="motivation" label="Motivação" />
            <NumericSlider field="concentration" label="Concentração" />
            <NumericSlider field="short_term_memory" label="Memória curta" />
            <NumericSlider field="learning_memory" label="Memória de aprendizado" />
            <NumericSlider field="learning_ease" label="Facilidade de aprendizado" />
            <NumericSlider field="sexual_initiative" label="Iniciativa sexual" />
            <NumericSlider field="simple_pleasures" label="Prazeres simples" />
            <NumericSlider field="empathy" label="Empatia" />
            <NumericSlider field="sociability" label="Sociabilidade" />
            <NumericSlider field="verbal_fluency" label="Fluência verbal" />
            <TextArea field="neuro_obs" label="Observações neurológicas" />
          </div>
        );
      case 7: // Scans Clínicos
        return (
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label>Ereção matinal</Label>
              <Select value={(data.morning_erection as string) || "normal"} onValueChange={(v) => set("morning_erection", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="absent">Ausente</SelectItem>
                  <SelectItem value="weak">Fraca</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="strong">Forte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Queda de cabelo</Label>
              <Select value={(data.hair_loss as string) || "none"} onValueChange={(v) => set("hair_loss", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  <SelectItem value="mild">Leve</SelectItem>
                  <SelectItem value="moderate">Moderada</SelectItem>
                  <SelectItem value="severe">Severa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Saúde capilar</Label>
              <Select value={(data.hair_health as string) || "normal"} onValueChange={(v) => set("hair_health", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="poor">Ruim</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="good">Boa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <TextInput field="morning_temperature" label="Temperatura matinal (°C)" type="number" />
            <TextArea field="pre_existing_diseases" label="Doenças pré-existentes" />
            <TextArea field="negative_diff_3_years" label="Diferenças negativas (últimos 3 anos)" placeholder="Mudanças negativas na saúde" />
            <TextArea field="surgeries" label="Cirurgias" />
            <TextArea field="dental_canal" label="Canal dentário" />
            <TextArea field="implants" label="Implantes" />
            <TextArea field="final_obs" label="Observações finais" />
          </div>
        );
      default:
        return null;
    }
  }

  const StepIcon = STEPS[step].icon;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Etapa {step + 1} de {STEPS.length}</span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors
                ${i === step
                  ? "bg-primary text-primary-foreground"
                  : i < step
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
            >
              {i < step ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <StepIcon className="w-5 h-5 text-primary" />
            {STEPS[step].label}
          </CardTitle>
        </CardHeader>
        <CardContent>{renderStep()}</CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
        </Button>

        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)}>
            Próximo <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-1" />
            {saving ? "Salvando..." : "Salvar Anamnese"}
          </Button>
        )}
      </div>
    </div>
  );
}
