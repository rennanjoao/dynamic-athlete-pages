/**
 * CarbCycleSelector.tsx — Botões para o aluno alternar manualmente
 * entre Carbo Alto / Base / Carbo Baixo na visualização da dieta do dia.
 *
 * Só aparece se o coach ativou ciclo de carbo no protocolo.
 */

import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export type CarbMode = "high" | "base" | "low";

interface Props {
  value: CarbMode;
  onChange: (m: CarbMode) => void;
  className?: string;
}

const options: { id: CarbMode; label: string; icon: typeof TrendingUp; cls: string }[] = [
  { id: "high", label: "Carbo Alto", icon: TrendingUp, cls: "data-[active=true]:bg-emerald-500/20 data-[active=true]:text-emerald-400 data-[active=true]:border-emerald-500/40" },
  { id: "base", label: "Base", icon: Minus, cls: "data-[active=true]:bg-blue-500/20 data-[active=true]:text-blue-400 data-[active=true]:border-blue-500/40" },
  { id: "low", label: "Carbo Baixo", icon: TrendingDown, cls: "data-[active=true]:bg-amber-500/20 data-[active=true]:text-amber-400 data-[active=true]:border-amber-500/40" },
];

export default function CarbCycleSelector({ value, onChange, className }: Props) {
  return (
    <div className={`flex items-center gap-2 rounded-xl border border-border bg-card/40 p-1.5 ${className ?? ""}`}>
      {options.map((o) => {
        const Icon = o.icon;
        const active = value === o.id;
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
