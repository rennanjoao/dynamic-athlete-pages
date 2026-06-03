/**
 * ProtocolViewer.tsx
 * Renderiza o protocolo do aluno em duas seções:
 *  1. Refeições estruturadas (Protocolo Master payload — opções + substituições + ciclo de carbo)
 *  2. HTML clássico (compatibilidade) com botão de exportar PDF
 */

import { useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, FileText } from "lucide-react";
import type { Protocol } from "@/hooks/useStudentData";
import { toast } from "sonner";
import { ProtocolPayloadSchema } from "@/lib/protocolSchema";
import StructuredMealsViewer from "@/components/student/StructuredMealsViewer";
import StudentToolbar from "@/components/student/StudentToolbar";

interface Props {
  protocol: Protocol | null;
}

export default function ProtocolViewer({ protocol }: Props) {
  const ref = useRef<HTMLIFrameElement>(null);

  const structured = useMemo(() => {
    if (!protocol?.payload) return null;
    const parsed = ProtocolPayloadSchema.safeParse(protocol.payload);
    if (!parsed.success) return null;
    if (!parsed.data.meals || parsed.data.meals.length === 0) return null;
    return parsed.data;
  }, [protocol]);

  useEffect(() => {
    if (!ref.current || !protocol?.html_content) return;
    const doc = ref.current.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(protocol.html_content);
    doc.close();
  }, [protocol]);

  function exportPDF() {
    if (!protocol) return;
    const w = window.open("", "_blank");
    if (!w) { toast.error("Permita popups para exportar"); return; }
    w.document.write(`
      <!doctype html><html><head><meta charset="utf-8"><title>${protocol.title}</title>
      <style>@media print{@page{margin:14mm;}}</style>
      </head><body>${protocol.html_content || ""}
      <script>window.onload=()=>setTimeout(()=>window.print(),300);</script>
      </body></html>
    `);
    w.document.close();
  }

  if (!protocol) {
    return (
      <Card className="bg-card/60 border-border p-8 text-center">
        <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
        <p className="text-sm text-muted-foreground">
          Seu coach ainda não publicou um protocolo ativo.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-card/60 border-border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="text-sm font-bold text-foreground">{protocol.title}</h3>
            <p className="text-[11px] text-muted-foreground">
              Atualizado em {new Date(protocol.updated_at).toLocaleDateString("pt-BR")}
            </p>
          </div>
          {protocol.html_content && (
            <Button size="sm" onClick={exportPDF}>
              <Download className="w-3.5 h-3.5 mr-1.5" /> Baixar PDF
            </Button>
          )}
        </div>

        {structured ? (
          <div className="p-4 space-y-4">
            <StudentToolbar />
            <StructuredMealsViewer payload={structured} />
          </div>
        ) : (
          <iframe
            ref={ref}
            title="Protocolo"
            sandbox="allow-same-origin"
            className="w-full h-[calc(100vh-260px)] min-h-[480px] bg-white"
          />
        )}
      </Card>
    </div>
  );
}
