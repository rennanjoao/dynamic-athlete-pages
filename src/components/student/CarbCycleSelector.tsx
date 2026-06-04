/**
 * CarbCycleSelector.tsx — Botões: Carbo Alto / Base / Off (Baixo).
 * Mostra percentuais customizáveis pelo coach.
 */

import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export type CarbMode = "high" | "base" | "off" | "low";

interface Props {
  value: CarbMode;
  onChange: (m: CarbMode) => void;
  highPct?: number;
  lowPct?: number;
  className?: string;
}

export default function CarbCycleSelector({ value, onChange, highPct = 15, lowPct = 15, className }: Props) {
  const v: CarbMode = value === "low" ? "off" : value;
  const options: { id: CarbMode; label: string; icon: typeof TrendingUp; cls: string }[] = [
    { id: "high", label: `Alto +${highPct}%`, icon: TrendingUp, cls: "data-[active=true]:bg-emerald-500/20 data-[active=true]:text-emerald-400 data-[active=true]:border-emerald-500/40" },
    { id: "base", label: "Base", icon: Minus, cls: "data-[active=true]:bg-blue-500/20 data-[active=true]:text-blue-400 data-[active=true]:border-blue-500/40" },
    { id: "off", label: `Off −${lowPct}%`, icon: TrendingDown, cls: "data-[active=true]:bg-amber-500/20 data-[active=true]:text-amber-400 data-[active=true]:border-amber-500/40" },
  ];
  return (
    <div className={`flex items-center gap-2 rounded-xl border border-border bg-card/40 p-1.5 ${className ?? ""}`}>
      {options.map((o) => {
        const Icon = o.icon;
        const active = v === o.id;
        return (
          <Button
            key={o.id}
            type="button"
            variant="ghost"
            size="sm"
            data-active={active}
            onClick={() => onChange(o.id)}
            className={`flex-1 h-9 text-xs gap-1.5 border border-transparent transition-colors ${o.cls}`}
          >
            <Icon className="w-3.5 h-3.5" />
            {o.label}
          </Button>
        );
      })}
    </div>
  );
}
