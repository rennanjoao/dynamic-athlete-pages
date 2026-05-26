/**
 * EvolutionTimeline.tsx
 * Timeline vertical estilo feed; cada nó = 1 check-in.
 */

import { Card } from "@/components/ui/card";
import { CHECKIN_METRICS } from "@/lib/checkInSchema";
import type { CheckIn } from "@/hooks/useStudentData";
import { MessageSquare } from "lucide-react";

interface Props {
  checkIns: CheckIn[];
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default function EvolutionTimeline({ checkIns }: Props) {
  if (checkIns.length === 0) {
    return (
      <Card className="bg-card/60 border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhum check-in ainda. Seus envios aparecerão aqui em ordem cronológica.
        </p>
      </Card>
    );
  }

  return (
    <div className="relative pl-6">
      {/* linha vertical */}
      <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />

      <div className="space-y-4">
        {checkIns.map((c, i) => {
          const prev = checkIns[i + 1] ?? null;
          const top = CHECKIN_METRICS.slice(0, 3);
          return (
            <div key={c.id} className="relative">
              <div className="absolute -left-4 top-3 w-3 h-3 rounded-full bg-primary ring-4 ring-background" />
              <Card className="bg-card/60 border-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-foreground">
                    {fmtDate(c.submitted_at)}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Check-in #{checkIns.length - i}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  {top.map((m) => {
                    const v = c.current_metrics?.[m.key];
                    const pv = prev?.current_metrics?.[m.key];
                    const d = typeof v === "number" && typeof pv === "number" ? v - pv : null;
                    return (
                      <div key={m.key} className="bg-background/50 rounded-lg p-2 text-center">
                        <div className="text-[10px] uppercase text-muted-foreground">{m.label}</div>
                        <div className="text-sm font-bold text-foreground tabular-nums">
                          {typeof v === "number" ? `${v}${m.unit}` : "—"}
                        </div>
                        {d != null && Math.abs(d) >= 0.05 && (
                          <div className={`text-[10px] tabular-nums ${d < 0 ? "text-emerald-400" : "text-amber-400"}`}>
                            {d > 0 ? "+" : ""}{d.toFixed(1)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {c.coach_feedback && (
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
                    <MessageSquare className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <p className="text-xs text-foreground/80">{c.coach_feedback}</p>
                  </div>
                )}

                {c.photo_url && (
                  <img src={c.photo_url} alt="Progresso" className="mt-3 rounded-lg max-h-60 object-cover w-full" />
                )}
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
