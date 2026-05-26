/**
 * ProtocolViewer.tsx
 * Renderiza o HTML do protocolo dentro de iframe sandboxed.
 * Botão "Baixar PDF" abre nova janela apenas com o protocolo (window.print()).
 */

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, FileText } from "lucide-react";
import type { Protocol } from "@/hooks/useStudentData";
import { toast } from "sonner";

interface Props {
  protocol: Protocol | null;
}

export default function ProtocolViewer({ protocol }: Props) {
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!ref.current || !protocol) return;
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
      </head><body>${protocol.html_content}
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
    <Card className="bg-card/60 border-border overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h3 className="text-sm font-bold text-foreground">{protocol.title}</h3>
          <p className="text-[11px] text-muted-foreground">
            Atualizado em {new Date(protocol.updated_at).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <Button size="sm" onClick={exportPDF}>
          <Download className="w-3.5 h-3.5 mr-1.5" /> Baixar PDF
        </Button>
      </div>
      <iframe
        ref={ref}
        title="Protocolo"
        sandbox="allow-same-origin"
        className="w-full h-[calc(100vh-260px)] min-h-[480px] bg-white"
      />
    </Card>
  );
}
