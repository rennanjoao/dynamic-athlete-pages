import { useRef, useState } from "react";
import { Dumbbell, Trophy, Download, Share2, X, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  workoutName: string;
  durationSec: number;
  totalSets: number;
  completedExercises: number;
  coachName?: string;
  onClose: () => void;
}

function fmtDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}h${String(m % 60).padStart(2, "0")}`;
  }
  return `${m}min ${String(s).padStart(2, "0")}s`;
}

export default function WorkoutShareCard({
  workoutName,
  durationSec,
  totalSets,
  completedExercises,
  coachName,
  onClose,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const today = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const generateBlob = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: "#111827",
      scale: 2,
      useCORS: true,
    });
    return await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
  };

  const handleShare = async () => {
    try {
      setBusy(true);
      const blob = await generateBlob();
      if (!blob) throw new Error("falha");
      const file = new File([blob], "treino-elite.png", { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Treino destruído!" } as ShareData);
      } else {
        // fallback download
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "treino-elite.png";
        a.click();
        URL.revokeObjectURL(url);
        toast.info("Compartilhamento não suportado. Imagem baixada.");
      }
    } catch (e) {
      toast.error("Não foi possível compartilhar.");
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    try {
      setBusy(true);
      const blob = await generateBlob();
      if (!blob) throw new Error("falha");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "treino-elite.png";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Imagem salva!");
    } catch {
      toast.error("Erro ao salvar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-card w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-4 space-y-4 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground">Treino concluído</h3>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>

        {/* SHARE CARD — fixed dark theme */}
        <div
          ref={cardRef}
          id="share-card"
          style={{ backgroundColor: "#111827", color: "#fff" }}
          className="rounded-xl p-6 w-full aspect-[4/5] flex flex-col"
        >
          <div className="flex items-start justify-between">
            <div>
              <p style={{ color: "#fff" }} className="font-black text-lg leading-tight">Elite Prime Hub</p>
              {coachName && <p style={{ color: "#9ca3af" }} className="text-xs mt-1">Coach: {coachName}</p>}
            </div>
            <div
              style={{ backgroundColor: "#e94560" }}
              className="w-12 h-12 rounded-lg flex items-center justify-center"
            >
              <Dumbbell className="w-7 h-7 text-white" />
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center my-4">
            <Trophy style={{ color: "#e94560" }} className="w-16 h-16 mb-3" />
            <p style={{ color: "#fff" }} className="text-3xl font-black leading-tight">Treino destruído.</p>
            <p style={{ color: "#9ca3af" }} className="text-sm mt-2">Consistência é o único atalho.</p>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { l: "Duração", v: fmtDuration(durationSec) },
              { l: "Séries", v: String(totalSets) },
              { l: "Exercícios", v: String(completedExercises) },
              { l: "Treino", v: workoutName },
            ].map((s, i) => (
              <div key={i} style={{ backgroundColor: "#0f3460" }} className="p-2 rounded-lg">
                <p style={{ color: "#9ca3af" }} className="text-[10px] uppercase">{s.l}</p>
                <p style={{ color: "#fff" }} className="font-bold text-sm truncate">{s.v}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-[10px]" style={{ color: "#6b7280" }}>
            <span>Elite Prime Hub · eliteprimehub.app</span>
            <span>{today}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <Button onClick={handleShare} disabled={busy} className="w-full">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
            Compartilhar no Instagram
          </Button>
          <Button onClick={handleSave} disabled={busy} variant="secondary" className="w-full">
            <Download className="w-4 h-4" /> Salvar imagem
          </Button>
          <Button onClick={onClose} variant="ghost" className="w-full">Fechar</Button>
        </div>
      </div>
    </div>
  );
}
