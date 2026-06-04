/**
 * EvolutionTimeline.tsx
 * Timeline vertical estilo feed; cada nó = 1 check-in.
 * Clique no card abre dialog detalhado (somente leitura).
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CHECKIN_METRICS, CHECKIN_SECTIONS } from "@/lib/checkInSchema";
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
  const [selected, setSelected] = useState<CheckIn | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  if (checkIns.length === 0) {
    return (
      <Card className="bg-card/60 border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhum check-in ainda. Seus envios aparecerão aqui em ordem cronológica.
        </p>
      </Card>
    );
  }

  const prevOfSelected = selectedIndex >= 0 ? checkIns[selectedIndex + 1] ?? null : null;

  return (
    <>
      <div className="relative pl-6">
        <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />

        <div className="space-y-4">
          {checkIns.map((c, i) => {
            const prev = checkIns[i + 1] ?? null;
            const top = CHECKIN_METRICS.slice(0, 3);
            return (
              <div key={c.id} className="relative">
                <div className="absolute -left-4 top-3 w-3 h-3 rounded-full bg-primary ring-4 ring-background" />
                <button
                  type="button"
                  onClick={() => { setSelected(c); setSelectedIndex(i); }}
                  className="block w-full text-left"
                >
                  <Card className="bg-card/60 border-border p-4 hover:border-primary/50 hover:bg-card/80 transition-colors cursor-pointer">
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
                        <p className="text-xs text-foreground/80 line-clamp-2">{c.coach_feedback}</p>
                      </div>
                    )}

                    {c.photo_url && (
                      <img src={c.photo_url} alt="Progresso" className="mt-3 rounded-lg max-h-60 object-cover w-full" />
                    )}
                  </Card>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>Check-in — {fmtDate(selected.submitted_at)}</DialogTitle>
              </DialogHeader>

              {/* Métricas */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Métricas</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CHECKIN_METRICS.map((m) => {
                    const v = selected.current_metrics?.[m.key];
                    const pv = prevOfSelected?.current_metrics?.[m.key];
                    const d = typeof v === "number" && typeof pv === "number" ? v - pv : null;
                    return (
                      <div key={m.key} className="bg-background/50 rounded-lg p-2 text-center border border-border">
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
              </div>

              {/* Sections */}
              <div className="space-y-4 mt-4">
                {CHECKIN_SECTIONS.map((section) => {
                  const payload = (selected.payload ?? {}) as Record<string, unknown>;
                  const filled = section.fields.filter((f) => {
                    const v = payload[f.key];
                    return v !== undefined && v !== null && String(v).trim() !== "";
                  });
                  if (filled.length === 0) return null;
                  return (
                    <div key={section.id} className="space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-primary">{section.title}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {filled.map((f) => {
                          const v = payload[f.key];
                          return (
                            <div key={f.key} className="bg-background/40 rounded-md p-2 border border-border/50">
                              <div className="text-[10px] uppercase text-muted-foreground">{f.label}</div>
                              <div className="text-sm text-foreground break-words">{String(v)}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {selected.coach_feedback && (
                <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-primary mb-1">Feedback do treinador</p>
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap">{selected.coach_feedback}</p>
                    </div>
                  </div>
                </div>
              )}

              {selected.photo_url && (
                <img src={selected.photo_url} alt="Progresso" className="mt-4 rounded-lg max-h-96 object-cover w-full" />
              )}

              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setSelected(null)}>Fechar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
