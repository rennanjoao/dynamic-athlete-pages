/**
 * FormField.tsx — Renderizador genérico de campo da anamnese / check-in.
 * Aplica o tema carbon + carmesim.
 */

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { FieldDef } from "@/lib/anamnesisSchema";

interface Props {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}

export function FormField({ field, value, onChange }: Props) {
  const v = value as string | number | undefined;

  if (field.type === "textarea") {
    return (
      <Textarea
        rows={3}
        placeholder={field.placeholder}
        value={(v as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="bg-card border-border focus-visible:ring-primary"
      />
    );
  }

  if (field.type === "select") {
    return (
      <Select value={(v as string) ?? ""} onValueChange={onChange}>
        <SelectTrigger className="bg-card border-border">
          <SelectValue placeholder="Selecione…" />
        </SelectTrigger>
        <SelectContent>
          {field.options?.map((o) => (
            <SelectItem key={o} value={o}>{o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (field.type === "choices") {
    return (
      <div className="flex flex-wrap gap-2">
        {field.options?.map((o) => {
          const selected = v === o;
          return (
            <button
              type="button"
              key={o}
              onClick={() => onChange(selected ? "" : o)}
              className={cn(
                "px-3 py-2 rounded-lg text-xs font-medium border transition-all",
                selected
                  ? "bg-primary/15 border-primary text-primary"
                  : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {o}
            </button>
          );
        })}
      </div>
    );
  }

  if (field.type === "slider") {
    const num = typeof v === "number" ? v : Number(v ?? 5);
    return (
      <div className="space-y-2">
        <input
          type="range"
          min={field.min ?? 0}
          max={field.max ?? 10}
          value={num}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="text-xs text-muted-foreground text-right">
          <span className="text-primary font-semibold">{num}</span> / {field.max ?? 10}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <Input
        type={field.type}
        step={field.step}
        placeholder={field.placeholder}
        value={(v as string | number) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="bg-card border-border focus-visible:ring-primary pr-12"
      />
      {field.unit && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wider text-muted-foreground">
          {field.unit}
        </span>
      )}
    </div>
  );
}
