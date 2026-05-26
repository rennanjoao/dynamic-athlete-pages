/**
 * AnamnesisViewer.tsx — Visualizador de anamnese para o Coach.
 * Lê da nova tabela `anamnesis` (payload em JSONB).
 */

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ANAMNESIS_SECTIONS } from "@/lib/anamnesisSchema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { FileDown, Loader2 } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb: any = supabase;

interface Props {
  studentId: string;
  studentName?: string;
}

function fmt(val: unknown): string {
  if (val === null || val === undefined || val === "") return "—";
  if (typeof val === "boolean") return val ? "Sim" : "Não";
  return String(val);
}

export default function AnamnesisViewer({ studentId, studentName }: Props) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: row, error } = await sb
        .from("anamnesis")
        .select("*")
        .eq("student_id", studentId)
        .maybeSingle();
      if (error) toast.error("Erro ao carregar anamnese");
      if (row) {
        setData((row.payload as Record<string, unknown>) || {});
        setUpdatedAt(row.updated_at as string);
      }
      setLoading(false);
    })();
  }, [studentId]);

  function exportPDF() {
    if (!data) return;
    const w = window.open("", "_blank");
    if (!w) { toast.error("Permita popups para exportar"); return; }
    const name = (data.nome as string) || studentName || "Aluno";
    const sections = ANAMNESIS_SECTIONS.map((s) => `
      <h2>${s.title}</h2>
      ${s.fields.map((f) => `
        <div class="row"><span class="lbl">${f.label}</span><span class="val">${fmt(data[f.key])}</span></div>
      `).join("")}
    `).join("");
    w.document.write(`
      <!doctype html><html><head><meta charset="utf-8"><title>Anamnese — ${name}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:24px;max-width:780px;margin:auto;color:#111}
        h1{font-size:20px;border-bottom:2px solid #B11226;padding-bottom:8px}
        h2{font-size:14px;color:#B11226;margin-top:22px;text-transform:uppercase;letter-spacing:.05em}
        .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee;font-size:13px}
        .lbl{color:#555;font-weight:600}
        .val{max-width:55%;text-align:right}
        @media print{body{padding:0}}
      </style></head><body>
      <h1>Anamnese — ${name}</h1>
      <p style="color:#888;font-size:11px">Gerado em ${new Date().toLocaleDateString("pt-BR")}</p>
      ${sections}
      <script>window.onload=()=>setTimeout(()=>window.print(),300);</script>
      </body></html>
    `);
    w.document.close();
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{(data.nome as string) || studentName}</h2>
          {updatedAt && (
            <p className="text-sm text-muted-foreground">
              Atualizado em {new Date(updatedAt).toLocaleDateString("pt-BR")}
            </p>
          )}
        </div>
        <Button onClick={exportPDF} variant="outline" size="sm">
          <FileDown className="w-4 h-4 mr-1.5" /> Exportar PDF
        </Button>
      </div>

      <Accordion type="multiple" defaultValue={["identificacao", "composicao"]} className="space-y-2">
        {ANAMNESIS_SECTIONS.map((s) => (
          <AccordionItem key={s.id} value={s.id} className="border rounded-lg px-4">
            <AccordionTrigger className="py-3">
              <span className="text-sm font-semibold text-primary">{s.title}</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-2 py-2">
                {s.fields.map((f) => (
                  <div key={f.key} className="flex items-center justify-between py-1.5 text-sm border-b border-border/40 last:border-0">
                    <span className="text-muted-foreground">{f.label}</span>
                    <span className="font-medium text-right max-w-[55%]">{fmt(data[f.key])}</span>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
