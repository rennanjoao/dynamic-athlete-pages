/**
 * ProtocolImportExport.tsx — Permite ao coach baixar o esboço do protocolo
 * em JSON estruturado e voltar a importar o JSON editado (no PC ou via IA).
 */

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";
import { ProtocolPayloadSchema, type ProtocolPayload } from "@/lib/protocolSchema";
import { toast } from "sonner";

interface Props {
  payload: ProtocolPayload | null;
  studentName: string;
  onImport: (next: ProtocolPayload) => void;
}

function buildTemplateNotes(p: ProtocolPayload) {
  return {
    _instructions: [
      "Edite os campos abaixo no PC, IA ou editor de texto e salve novamente como JSON.",
      "Mantenha a mesma estrutura. Campos opcionais podem ficar vazios.",
      "Importe de volta pelo painel do Coach > Protocolo > Importar esboço.",
    ],
    _campos: {
      setup: "split (AB|ABC|ABCD|ABCDE|ABCDEF), mealsCount (2-10), carbCycle (true/false)",
      macros: "calories, protein, carbs, fat, water (L), goal",
      guidelines: "training, diet, weekOrganization, supplementation (texto livre)",
      workouts: "lista de dias com {key, focus, exercises:[{name, sets, reps, cadence, rest, notes}]}",
      meals: "lista com {name, time, foods, qtyHighCarb, qtyLowCarb, substitutions}",
      carbCycle: "{ mon|tue|wed|thu|fri|sat|sun : 'high'|'low'|'off' }",
    },
    payload: p,
  };
}

export default function ProtocolImportExport({ payload, studentName, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const download = () => {
    const data = payload
      ? buildTemplateNotes(payload)
      : buildTemplateNotes(
          ProtocolPayloadSchema.parse({
            setup: { split: "ABC", mealsCount: 5, carbCycle: false },
          })
        );
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safe = studentName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    a.download = `protocolo-esboco-${safe || "aluno"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const raw = JSON.parse(text);
      // Aceita formato com wrapper { payload: ... } ou payload puro
      const candidate = raw?.payload && typeof raw.payload === "object" ? raw.payload : raw;
      const parsed = ProtocolPayloadSchema.parse(candidate);
      onImport(parsed);
      toast.success("Esboço importado. Revise e salve.");
    } catch (err) {
      console.error("import error", err);
      toast.error("JSON inválido: " + (err instanceof Error ? err.message : "formato"));
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={download} type="button">
        <Download className="w-3.5 h-3.5 mr-1.5" /> Baixar esboço
      </Button>
      <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} type="button">
        <Upload className="w-3.5 h-3.5 mr-1.5" /> Importar
      </Button>
      <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
    </div>
  );
}
