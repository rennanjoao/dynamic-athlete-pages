/**
 * ProtocolImportExport.tsx — Permite ao coach baixar/importar o protocolo
 * em JSON ou Excel (.xlsx) para edição manual no PC ou via IA.
 */

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload, FileSpreadsheet, FileJson } from "lucide-react";
import { ProtocolPayloadSchema, type ProtocolPayload } from "@/lib/protocolSchema";
import { exportProtocolXlsx, importProtocolXlsx, ProtocolXlsxError } from "@/lib/protocolXlsx";
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
      "Importe de volta pelo painel do Coach > Protocolo > Importar.",
    ],
    payload: p,
  };
}

export default function ProtocolImportExport({ payload, studentName, onImport }: Props) {
  const jsonRef = useRef<HTMLInputElement>(null);
  const xlsxRef = useRef<HTMLInputElement>(null);

  const ensurePayload = (): ProtocolPayload =>
    payload ??
    ProtocolPayloadSchema.parse({
      setup: { split: "ABC", mealsCount: 5, carbCycle: false },
    });

  const downloadJson = () => {
    const data = buildTemplateNotes(ensurePayload());
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safe = studentName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    a.download = `protocolo-esboco-${safe || "aluno"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadXlsx = () => {
    try {
      exportProtocolXlsx(ensurePayload(), studentName);
    } catch (e) {
      toast.error("Falha ao gerar Excel: " + (e instanceof Error ? e.message : ""));
    }
  };

  const onJsonFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const raw = JSON.parse(text);
      const candidate = raw?.payload && typeof raw.payload === "object" ? raw.payload : raw;
      const parsed = ProtocolPayloadSchema.parse(candidate);
      onImport(parsed);
      toast.success("Esboço JSON importado. Revise e salve.");
    } catch (err) {
      console.error("import json error", err);
      toast.error("JSON inválido: " + (err instanceof Error ? err.message : "formato"));
    } finally {
      if (jsonRef.current) jsonRef.current.value = "";
    }
  };

  const onXlsxFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await importProtocolXlsx(file);
      onImport(parsed);
      toast.success("Planilha importada. Revise e salve.");
    } catch (err) {
      console.error("import xlsx error", err);
      toast.error("Excel inválido: " + (err instanceof Error ? err.message : "formato"));
    } finally {
      if (xlsxRef.current) xlsxRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Button variant="outline" size="sm" onClick={downloadXlsx} type="button" title="Baixar esboço .xlsx">
        <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" /> Excel
      </Button>
      <Button variant="outline" size="sm" onClick={() => xlsxRef.current?.click()} type="button" title="Importar .xlsx">
        <Upload className="w-3.5 h-3.5 mr-1.5" /> Importar Excel
      </Button>
      <Button variant="ghost" size="sm" onClick={downloadJson} type="button" title="Baixar JSON">
        <FileJson className="w-3.5 h-3.5 mr-1.5" /> JSON
      </Button>
      <Button variant="ghost" size="sm" onClick={() => jsonRef.current?.click()} type="button" title="Importar JSON">
        <Download className="w-3.5 h-3.5 rotate-180 mr-1.5" /> Importar JSON
      </Button>
      <input ref={xlsxRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onXlsxFile} />
      <input ref={jsonRef} type="file" accept="application/json,.json" className="hidden" onChange={onJsonFile} />
    </div>
  );
}
