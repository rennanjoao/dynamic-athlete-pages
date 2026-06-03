import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  // NOVO: Renderizador de Foto (Slot tracejado)
  if (field.type === "file") {
    return (
      <div className="relative aspect-[3/4] w-full max-w-[140px] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-all overflow-hidden bg-card">
        {v ? (
          <>
            <img src={v as string} alt="Preview" className="w-full h-full object-cover" />
            <button type="button" onClick={() => onChange("")} className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white">
              <X size={12} />
            </button>
          </>
        ) : (
          <>
            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => onChange(reader.result);
                reader.readAsDataURL(file);
              }
            }} />
            <Camera className="text-muted-foreground mb-2" size={24} />
            <span className="text-[10px] uppercase font-bold text-muted-foreground">{field.label}</span>
          </>
        )}
      </div>
    );
  }

  // ... (manter o restante do seu código FormField original)
  if (field.type === "textarea") { /* ... seu textarea ... */ }
  // ... (o restante permanece igual)
}
