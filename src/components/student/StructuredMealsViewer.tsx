import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Apple, Clock, Repeat, CheckCircle2 } from "lucide-react";
import CarbCycleSelector, { type CarbMode } from "@/components/student/CarbCycleSelector";
import { useState } from "react";

// Aceita qualquer estrutura flexível sem quebrar
export default function StructuredMealsViewer({ payload }: { payload: any }) {
  const [mode, setMode] = useState<CarbMode>("base");

  // Força a leitura do payload bruto caso o schema falhe
  const safeData = payload || {};
  const meals = Array.isArray(safeData.meals) ? safeData.meals : [];
  const hasCarbCycle = safeData.setup?.carbCycle === true;

  if (meals.length === 0) return null;

  return (
    <div className="space-y-4">
      {hasCarbCycle && <CarbCycleSelector value={mode} onChange={setMode} />}
      {meals.map((meal: any, i: number) => (
        <MealCard key={i} meal={meal} mode={mode} />
      ))}
    </div>
  );
}

const CARB_MULT: Record<string, number> = { high: 1.15, base: 1, off: 0.85, low: 0.85 };

function MealCard({ meal, mode }: { meal: any; mode: string }) {
  // Extração defensiva de dados (se não existir, assume 0 ou vazio)
  const c = Math.round((meal.macros?.carbs || 0) * (CARB_MULT[mode] || 1));
  const p = meal.macros?.protein || 0;
  const f = meal.macros?.fat || 0;
  
  const subsCarb = Array.isArray(meal.substitutions?.carb) ? meal.substitutions.carb : [];
  const subsProt = Array.isArray(meal.substitutions?.protein) ? meal.substitutions.protein : [];
  const subsFat = Array.isArray(meal.substitutions?.fat) ? meal.substitutions.fat : [];

  const hasCarbSubs = c > 0 && subsCarb.some((s: string) => s && s.trim() !== "");
  const hasProteinSubs = p > 0 && subsProt.some((s: string) => s && s.trim() !== "");
  const hasFatSubs = f > 0 && subsFat.some((s: string) => s && s.trim() !== "");
  
  const options = Array.isArray(meal.options) ? meal.options : [];
  const validOptions = options.filter((opt: any) => opt?.items && opt.items.trim() !== "");

  return (
    <Card className="bg-card/60 border-border overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="flex items-center gap-2">
            <Apple className="w-4 h-4 text-primary" />
            {meal.name || "Refeição"}
          </span>
          {meal.time && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground font-normal">
              <Clock className="w-3 h-3" /> {meal.time}
            </span>
          )}
        </CardTitle>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {c > 0 && (
            <Badge variant="outline" className="text-amber-600 border-amber-600/40">
              {c}g Carbo{mode !== "base" && <span className="opacity-60 ml-1">({mode === "high" ? "+15%" : "-15%"})</span>}
            </Badge>
          )}
          {p > 0 && <Badge variant="outline" className="text-blue-600 border-blue-600/40">{p}g Proteína</Badge>}
          {f > 0 && <Badge variant="outline" className="text-rose-500 border-rose-500/40">{f}g Gordura</Badge>}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 pt-4">
        {validOptions.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {validOptions.map((opt: any, idx: number) => (
              <div key={idx} className="p-3 rounded-md bg-background border border-border/60 space-y-2">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {opt.title || `Opção ${idx + 1}`}
                </h4>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed pl-5">
                  {opt.items}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">Opções não detalhadas nesta refeição.</p>
        )}

        {(hasCarbSubs || hasProteinSubs || hasFatSubs) && (
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 mt-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Repeat className="w-3.5 h-3.5 text-primary" /> Substituições
            </div>
            {hasCarbSubs && <SubRow label="Carbo" color="text-amber-600" items={subsCarb} />}
            {hasProteinSubs && <SubRow label="Proteína" color="text-blue-600" items={subsProt} />}
            {hasFatSubs && <SubRow label="Gordura" color="text-rose-500" items={subsFat} />}
          </div>
        )}

        {meal.notes && (
          <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-2 mt-2">
            {meal.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function SubRow({ label, color, items }: { label: string; color: string; items: string[] }) {
  const valid = items.filter((s) => s && s.trim() !== "");
  if (valid.length === 0) return null;
  return (
    <div className="text-xs">
      <span className={`font-semibold ${color}`}>{label}:</span>{" "}
      <span className="text-muted-foreground">{valid.join("  •  ")}</span>
    </div>
  );
}
