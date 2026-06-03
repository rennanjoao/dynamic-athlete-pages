import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Apple, Clock, Repeat, CheckCircle2, Scale } from "lucide-react";
import { useState } from "react";

// Micro-CSS injetado para suportar tags HTML dinâmicas geradas no JSON (se existirem)
const DYNAMIC_CSS = `
  .meal-dynamic-container .peso-pronto { display: none; }
  .meal-dynamic-container.show-pronto .peso-pronto { display: inline; color: #e67e22; font-weight: 700; }
  .meal-dynamic-container.show-pronto .peso-cru { display: none; }
  .meal-dynamic-container .peso-cru { font-weight: 700; color: #ff4444; }

  .meal-dynamic-container .val-carbo-high,
  .meal-dynamic-container .val-carbo-low { display: none; }

  .meal-dynamic-container.show-high .val-carbo-base { display: none; }
  .meal-dynamic-container.show-high .val-carbo-high { display: inline; color: #2ecc71; font-weight: 700; }

  .meal-dynamic-container.show-low .val-carbo-base { display: none; }
  .meal-dynamic-container.show-low .val-carbo-low { display: inline; color: #f1c40f; font-weight: 700; }
`;

export default function StructuredMealsViewer({ payload }: { payload: any }) {
  const safeData = payload || {};
  const meals = Array.isArray(safeData.meals) ? safeData.meals : [];

  if (meals.length === 0) return null;

  return (
    <div className="space-y-4">
      <style>{DYNAMIC_CSS}</style>
      {meals.map((meal: any, i: number) => (
        <MealCard key={i} meal={meal} />
      ))}
    </div>
  );
}

const CARB_MULT: Record<string, number> = { high: 1.15, base: 1, off: 0.85, low: 0.85 };

function MealCard({ meal }: { meal: any }) {
  // Estados locais para interatividade total na refeição
  const [mode, setMode] = useState<"base" | "high" | "low">("base");
  const [isCooked, setIsCooked] = useState(false);

  // Extração defensiva
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

  const containerClass = `space-y-4 pt-4 meal-dynamic-container ${isCooked ? 'show-pronto' : ''} show-${mode}`;

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

        {/* BOTÕES INTERATIVOS (Cru/Pronto e Ciclagem) */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <button
            onClick={() => setIsCooked(!isCooked)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
              isCooked 
                ? 'bg-orange-500/20 text-orange-500 border-orange-500/50' 
                : 'bg-background text-muted-foreground border-border hover:border-primary/50'
            }`}
          >
            <Scale className="w-3 h-3 inline mr-1" />
            {isCooked ? 'Pronto (Cozido)' : 'Cru'}
          </button>

          <div className="flex bg-background border border-border rounded-md overflow-hidden">
            <button 
              onClick={() => setMode('base')} 
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${mode === 'base' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
            >
              ⏺️ Base
            </button>
            <button 
              onClick={() => setMode('high')} 
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${mode === 'high' ? 'bg-[#2ecc71] text-white' : 'text-muted-foreground hover:bg-muted'}`}
            >
              ⬆️ Alto
            </button>
            <button 
              onClick={() => setMode('low')} 
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${mode === 'low' ? 'bg-[#f1c40f] text-black' : 'text-muted-foreground hover:bg-muted'}`}
            >
              ⬇️ Baixo
            </button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className={containerClass}>
        {/* Opções Renderizadas */}
        {validOptions.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {validOptions.map((opt: any, idx: number) => (
              <div key={idx} className="p-3 rounded-md bg-background border border-border/60 space-y-2">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {opt.title || `Opção ${idx + 1}`}
                </h4>
                {/* Processamento de HTML interno para tags dinâmicas funcionarem */}
                <div 
                  className="text-sm text-foreground whitespace-pre-wrap leading-relaxed pl-5"
                  dangerouslySetInnerHTML={{ __html: opt.items }}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">Opções não detalhadas nesta refeição.</p>
        )}

        {/* Exibição Estruturada de JSON (Ciclagem e Pesos via Campos Nativos) */}
        {mode === 'high' && meal.qtyHighCarb && (
          <div className="p-2 mt-2 bg-[#2ecc71]/10 border border-[#2ecc71]/30 rounded text-sm text-[#2ecc71]">
            <strong>⬆️ Quantidades (Carbo Alto):</strong> {meal.qtyHighCarb}
          </div>
        )}
        {mode === 'low' && meal.qtyLowCarb && (
          <div className="p-2 mt-2 bg-[#f1c40f]/10 border border-[#f1c40f]/30 rounded text-sm text-[#f1c40f]">
            <strong>⬇️ Quantidades (Carbo Baixo):</strong> {meal.qtyLowCarb}
          </div>
        )}
        {isCooked && meal.cookedNotes && (
          <div className="p-2 mt-2 bg-orange-500/10 border border-orange-500/30 rounded text-sm text-orange-600">
            <strong>⚖️ Peso Pronto:</strong> {meal.cookedNotes}
          </div>
        )}

        {/* Substituições Gerais */}
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
