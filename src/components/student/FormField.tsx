import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { FieldDef } from "@/lib/anamnesisSchema";
import { Camera, X } from "lucide-react";

interface Props {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}

export function FormField({ field, value, onChange }: Props) {
  const v = value as string | number | undefined;

  // Foto (slot tracejado)
  if (field.type === "file") {
    return (
      <div className="relative aspect-[3/4] w-full max-w-[140px] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-all overflow-hidden bg-card">
        {v ? (
          <>
            <img src={v as string} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white"
            >
              <X size={12} />
            </button>
          </>
        ) : (
          <>
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => onChange(reader.result);
                  reader.readAsDataURL(file);
                }
              }}
            />
            <Camera className="text-muted-foreground mb-2" size={24} />
            <span className="text-[10px] uppercase font-bold text-muted-foreground">
              {field.label}
            </span>
          </>
        )}
      </div>
    );
  }

  // Botões de escolha única (estilo anamnese)
  if (field.type === "choices" && Array.isArray(field.options)) {
    const cols = field.options.length >= 4 ? 4 : field.options.length === 3 ? 3 : 2;
    return (
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
      >
        {field.options.map((opt) => {
          const sel = v === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(sel ? "" : opt)}
              className={cn(
                "px-3 py-2 rounded-lg text-xs font-medium border transition-all text-center",
                sel
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border/50 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <Textarea
        value={(v as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder as string | undefined}
        className="bg-card border-border text-sm min-h-[88px]"
      />
    );
  }

  if (field.type === "number") {
    return (
      <Input
        type="number"
        step={(field.step as string | number | undefined) ?? "any"}
        value={(v as string | number | undefined) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder as string | undefined}
        className="bg-card border-border text-sm h-10"
      />
    );
  }

  // Texto padrão
  return (
    <Input
      type="text"
      value={(v as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder as string | undefined}
      className="bg-card border-border text-sm h-10"
    />
  );
}
