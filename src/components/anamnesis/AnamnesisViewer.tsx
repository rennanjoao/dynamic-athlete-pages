/**
 * AnamnesisViewer.tsx — Visualizador de anamnese para o Coach
 * Lê os dados do aluno e permite exportar PDF
 */

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import {
  FileDown,
  User,
  Activity,
  Dumbbell,
  Pill,
  Apple,
  Moon,
  Brain,
  Stethoscope,
  Loader2,
} from "lucide-react";

type AnamnesisData = Record<string, any>;

const SECTIONS = [
  {
    key: "general",
    title: "Dados Gerais",
    icon: User,
    fields: [
      { key: "full_name", label: "Nome" },
      { key: "age", label: "Idade" },
      { key: "city_state", label: "Cidade/UF" },
      { key: "whatsapp", label: "WhatsApp" },
      { key: "height", label: "Altura (cm)" },
      { key: "total_weight", label: "Peso (kg)" },
      { key: "lean_mass_bf", label: "Massa Magra / BF (%)" },
      { key: "waist_cm", label: "Cintura (cm)" },
      { key: "hip_cm", label: "Quadril (cm)" },
      { key: "arm_contracted_right", label: "Braço Contrat. D (cm)" },
      { key: "arm_contracted_left", label: "Braço Contrat. E (cm)" },
      { key: "arm_relaxed_right", label: "Braço Relax. D (cm)" },
      { key: "arm_relaxed_left", label: "Braço Relax. E (cm)" },
      { key: "thigh_right", label: "Coxa D (cm)" },
      { key: "thigh_left", label: "Coxa E (cm)" },
      { key: "calf_right", label: "Panturrilha D (cm)" },
      { key: "calf_left", label: "Panturrilha E (cm)" },
    ],
  },
  {
    key: "routine",
    title: "Rotina",
    icon: Activity,
    fields: [
      { key: "profession_schedule", label: "Profissão e horários" },
      { key: "study_schedule", label: "Estudos" },
      { key: "physical_activities", label: "Atividades físicas" },
      { key: "activity_times", label: "Horários" },
      { key: "sleep_schedule", label: "Horário de sono" },
      { key: "consulting_goals", label: "Objetivos" },
    ],
  },
  {
    key: "training",
    title: "Treinamento",
    icon: Dumbbell,
    fields: [
      { key: "time_without_rest", label: "Tempo sem descanso" },
      { key: "periodizes_training", label: "Periodiza treino" },
      { key: "stagnation_feeling", label: "Estagnação" },
      { key: "muscle_pump", label: "Pump muscular" },
    ],
  },
  {
    key: "substances",
    title: "Substâncias",
    icon: Pill,
    fields: [
      { key: "prescribed_meds", label: "Medicamentos" },
      { key: "drugs_history", label: "Histórico de drogas" },
      { key: "hormones_history", label: "Hormônios" },
      { key: "stimulants", label: "Estimulantes" },
    ],
  },
  {
    key: "tgi",
    title: "TGI e Dieta",
    icon: Apple,
    fields: [
      { key: "food_recall", label: "Recordatório alimentar" },
      { key: "feces_consistency", label: "Bristol" },
      { key: "feces_obs", label: "Obs. fezes" },
      { key: "gastric_issues", label: "Problemas gástricos" },
      { key: "food_availability", label: "Disponibilidade alimentos" },
      { key: "allergies", label: "Alergias" },
    ],
  },
  {
    key: "rest",
    title: "Descanso",
    icon: Moon,
    fields: [
      { key: "sleep_latency", label: "Latência do sono" },
      { key: "wakes_rested", label: "Acorda descansado" },
      { key: "night_awakenings", label: "Despertares noturnos" },
      { key: "night_symptoms", label: "Sintomas noturnos" },
      { key: "daytime_fatigue_peaks", label: "Picos de fadiga" },
      { key: "hrv_fvc_avg", label: "HRV / FVC médio" },
    ],
  },
  {
    key: "neuro",
    title: "Neurológico",
    icon: Brain,
    fields: [
      { key: "motivation", label: "Motivação" },
      { key: "concentration", label: "Concentração" },
      { key: "short_term_memory", label: "Memória curta" },
      { key: "learning_memory", label: "Memória aprendizado" },
      { key: "learning_ease", label: "Facilidade aprendizado" },
      { key: "sexual_initiative", label: "Iniciativa sexual" },
      { key: "simple_pleasures", label: "Prazeres simples" },
      { key: "empathy", label: "Empatia" },
      { key: "sociability", label: "Sociabilidade" },
      { key: "verbal_fluency", label: "Fluência verbal" },
      { key: "neuro_obs", label: "Observações" },
    ],
  },
  {
    key: "clinical",
    title: "Scans Clínicos",
    icon: Stethoscope,
    fields: [
      { key: "morning_erection", label: "Ereção matinal" },
      { key: "hair_loss", label: "Queda de cabelo" },
      { key: "hair_health", label: "Saúde capilar" },
      { key: "morning_temperature", label: "Temperatura matinal" },
      { key: "pre_existing_diseases", label: "Doenças pré-existentes" },
      { key: "negative_diff_3_years", label: "Diferenças neg. 3 anos" },
      { key: "surgeries", label: "Cirurgias" },
      { key: "dental_canal", label: "Canal dentário" },
      { key: "implants", label: "Implantes" },
      { key: "final_obs", label: "Observações finais" },
    ],
  },
];

function formatValue(val: any): string {
  if (val === null || val === undefined || val === "") return "—";
  if (typeof val === "boolean") return val ? "Sim" : "Não";
  return String(val);
}

interface Props {
  studentId: string;
  studentName?: string;
}

export default function AnamnesisViewer({ studentId, studentName }: Props) {
  const [data, setData] = useState<AnamnesisData | null>(null);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAnamnesis();
  }, [studentId]);

  async function fetchAnamnesis() {
    setLoading(true);
    const { data: rows, error } = await (supabase as any)
      .from("clinical_anamnesis")
      .select("*")
      .eq("user_id", studentId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      toast.error("Erro ao carregar anamnese");
    } else if (rows && rows.length > 0) {
      setData(rows[0]);
    }
    setLoading(false);
  }

  function handleExportPDF() {
    if (!contentRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Popup bloqueado. Permita popups para exportar.");
      return;
    }
    const html = `
      <!DOCTYPE html>
      <html><head>
        <title>Anamnese - ${studentName || data?.full_name || "Aluno"}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; max-width: 800px; margin: 0 auto; color: #1a1a1a; }
          h1 { font-size: 20px; border-bottom: 2px solid #3B82F6; padding-bottom: 8px; }
          h2 { font-size: 16px; color: #3B82F6; margin-top: 24px; }
          .field { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee; }
          .label { font-weight: 600; color: #555; }
          .value { text-align: right; max-width: 50%; }
          @media print { body { padding: 0; } }
        </style>
      </head><body>
        <h1>Anamnese Clínica — ${studentName || data?.full_name || "Aluno"}</h1>
        <p style="color:#777;font-size:12px">Gerado em ${new Date().toLocaleDateString("pt-BR")}</p>
        ${SECTIONS.map(
          (s) => `
          <h2>${s.title}</h2>
          ${s.fields
            .map(
              (f) =>
                `<div class="field"><span class="label">${f.label}</span><span class="value">${formatValue(data?.[f.key])}</span></div>`
            )
            .join("")}
        `
        ).join("")}
      </body></html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Este aluno ainda não preencheu a anamnese.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" ref={contentRef}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{data.full_name || studentName}</h2>
          <p className="text-sm text-muted-foreground">
            Atualizado em {new Date(data.updated_at).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <Button onClick={handleExportPDF} variant="outline" size="sm">
          <FileDown className="w-4 h-4 mr-1.5" />
          Exportar PDF
        </Button>
      </div>

      <Accordion type="multiple" defaultValue={["general"]} className="space-y-2">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <AccordionItem key={section.key} value={section.key} className="border rounded-lg px-4">
              <AccordionTrigger className="py-3">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Icon className="w-4 h-4 text-primary" />
                  {section.title}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-2 py-2">
                  {section.fields.map((f) => (
                    <div key={f.key} className="flex items-center justify-between py-1.5 text-sm">
                      <span className="text-muted-foreground">{f.label}</span>
                      <span className="font-medium text-right max-w-[50%]">
                        {formatValue(data[f.key])}
                      </span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
