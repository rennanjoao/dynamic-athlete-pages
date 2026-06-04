import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Apple, Clock, Scale, CheckCircle2, Repeat } from "lucide-react";
import CarbCycleSelector, { type CarbMode } from "@/components/student/CarbCycleSelector";

// Motor Matemático Dinâmico (Regex)
function applySmartMath(text: string, mode: CarbMode, isCooked: boolean, isCarbGroup: boolean, highPct = 15, lowPct = 15) {
  if (!text) return "";
  let finalStr = text;
  const carbMult =
    mode === "high" ? 1 + highPct / 100 :
    (mode === "low" || mode === "off") ? 1 - lowPct / 100 : 1;

  let cookedMult = 1;
  const lStr = text.toLowerCase();

  if (isCooked) {
    if (/(arroz|macarrão|massa|cuscuz|creme de arroz|aveia)/.test(lStr)) cookedMult = 3;
    else if (/(mandioca|batata)/.test(lStr)) cookedMult = 1.3;
    else if (/(frango|carne|patinho|peixe|tilápia|salmão|boi|suíno|porco|coração)/.test(lStr)) cookedMult = 0.7;
  }

  finalStr = finalStr.replace(/(\d+)(\s*)(g|ml|kg)/gi, (match, num, space, unit) => {
    let val = Number(num);
    if (isCarbGroup) val = val * carbMult;
    val = val * cookedMult;
    return `${Math.round(val)}${space}${unit}`;
  });

  if (isCooked) {
    finalStr = finalStr.replace(/\bcru(a)?\b/gi, "pronto").replace(/\b(cozido|grelhado|assado)\b/gi, "pronto");
  } else {
    finalStr = finalStr.replace(/\bpronto(a)?\b/gi, "cru").replace(/\bcozido(a)?\b/gi, "cru").replace(/\bgrelhado(a)?\b/gi, "cru");
  }

  return finalStr;
}

export default function StructuredMealsViewer({ payload }: { payload: any }) {
  const safeData = payload || {};
  const meals = Array.isArray(safeData.meals) ? safeData.meals : [];
  const [mode, setMode] = useState<CarbMode>("base");
  const highPct: number = safeData.carbCycleHighPct ?? 15;
  const lowPct: number = safeData.carbCycleLowPct ?? 15;

  if (meals.length === 0) return null;

  return (
    <div className="space-y-4 w-full">
      {safeData.setup?.carbCycle && (
        <CarbCycleSelector value={mode} onChange={setMode} highPct={highPct} lowPct={lowPct} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full items-stretch">
        {meals.map((meal: any, i: number) => (
          <MealCard key={i} meal={meal} mode={mode} index={i} highPct={highPct} lowPct={lowPct} />
        ))}
      </div>
    </div>
  );
}

const KIND_META: Record<string, { emoji: string; label: string; color: string; isCarb: boolean }> = {
  carb: { emoji: "🟡", label: "Carbo", color: "text-amber-600", isCarb: true },
  protein: { emoji: "🔵", label: "Proteína", color: "text-blue-600", isCarb: false },
  fat: { emoji: "🔴", label: "Gordura", color: "text-rose-500", isCarb: false },
};

function MealCard({ meal, mode, index, highPct, lowPct }: { meal: any; mode: CarbMode; index: number; highPct: number; lowPct: number }) {
  const [isCooked, setIsCooked] = useState(false);

  const allOptions = Array.isArray(meal.options) ? meal.options : [];
  // Group by kind, preserving order
  const grouped: Record<string, any[]> = { carb: [], protein: [], fat: [] };
  allOptions.forEach((o: any) => {
    const k = o?.kind ?? "carb";
    if (grouped[k]) grouped[k].push(o);
  });

  // Filter out completely empty options (no items with name)
  const filterOpt = (opts: any[]) =>
    opts.filter((o) => Array.isArray(o.items) && o.items.some((it: any) => it?.name?.trim()));

  const carbOpts = filterOpt(grouped.carb);
  const protOpts = filterOpt(grouped.protein);
  const fatOpts = filterOpt(grouped.fat);

  const subs = meal.substitutions ?? {};
  const filterSub = (arr: any) =>
    (Array.isArray(arr) ? arr : []).filter((s: any) =>
      typeof s === "string" ? s.trim() : s?.name?.trim()
    );
  const subCarb = filterSub(subs.carb);
  const subProt = filterSub(subs.protein);
  const subFat = filterSub(subs.fat);

  const isEmpty = !carbOpts.length && !protOpts.length && !fatOpts.length;

  return (
    <Card className="bg-card/60 border border-border/60 rounded-xl shadow-sm flex flex-col h-full overflow-hidden">
      <CardHeader className="px-4 py-3 border-b border-border/40 bg-muted/10">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Apple className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-base text-foreground">{meal.name || `Refeição ${index + 1}`}</span>
          </div>
          {meal.time && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground bg-background px-2 py-1 rounded-md border">
              <Clock className="w-3 h-3" /> {meal.time}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-4 py-4 flex-1 flex flex-col">
        <div className="flex items-center justify-end mb-3">
          <button
            onClick={() => setIsCooked(!isCooked)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold border transition-colors ${
              isCooked
                ? "bg-orange-500 text-white border-orange-600 shadow-md"
                : "bg-background text-muted-foreground border-border hover:border-primary/50"
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            {isCooked ? "PRONTO" : "CRU"}
          </button>
        </div>

        <div className="space-y-3 flex-1">
          {(["carb", "protein", "fat"] as const).flatMap((kind) => {
            const opts = kind === "carb" ? carbOpts : kind === "protein" ? protOpts : fatOpts;
            return opts.map((opt: any, idx: number) => {
              const effectiveMode: CarbMode = meal.carbCycle ? mode : "base";
              return (
                <OptionBlock
                  key={`${kind}-${idx}`}
                  kind={kind}
                  title={opt.title || `${KIND_META[kind].label} — Opção ${idx + 1}`}
                  items={opt.items}
                  mode={effectiveMode}
                  isCooked={isCooked}
                  optionIndex={idx + 1}
                  highPct={highPct}
                  lowPct={lowPct}
                />
              );
            });
          })}

          {isEmpty && (
            <p className="text-sm text-muted-foreground italic text-center py-4">Refeição em branco.</p>
          )}
        </div>

        {(subCarb.length > 0 || subProt.length > 0 || subFat.length > 0) && (
          <div className="mt-4 pt-3 border-t border-border/40 space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1">
              <Repeat className="w-3 h-3" /> Substituições
            </p>
            {subCarb.length > 0 && <SubLine kind="carb" items={subCarb} mode={meal.carbCycle ? mode : "base"} isCooked={isCooked} highPct={highPct} lowPct={lowPct} />}
            {subProt.length > 0 && <SubLine kind="protein" items={subProt} mode={meal.carbCycle ? mode : "base"} isCooked={isCooked} highPct={highPct} lowPct={lowPct} />}
            {subFat.length > 0 && <SubLine kind="fat" items={subFat} mode={meal.carbCycle ? mode : "base"} isCooked={isCooked} highPct={highPct} lowPct={lowPct} />}
          </div>
        )}

        {meal.notes && (
          <div className="mt-4 pt-3 border-t border-border/40">
            <p className="text-xs text-muted-foreground italic">{meal.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OptionBlock({
  kind, title, items, mode, isCooked, optionIndex,
}: {
  kind: "carb" | "protein" | "fat";
  title: string;
  items: any[];
  mode: CarbMode;
  isCooked: boolean;
  optionIndex: number;
}) {
  const meta = KIND_META[kind];
  const filled = (items ?? []).filter((it: any) => it?.name?.trim());
  if (!filled.length) return null;

  return (
    <div className="bg-background rounded-lg border border-border/60 p-3 shadow-sm">
      <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${meta.color}`}>
        <CheckCircle2 className="w-3.5 h-3.5" /> {meta.emoji} {title || `${meta.label} — Opção ${optionIndex}`}
      </h4>
      <ul className="space-y-1.5">
        {filled.map((it: any, idx: number) => {
          const weightText = applySmartMath(it.weight || "", mode, isCooked, meta.isCarb);
          return (
            <li key={idx} className="text-sm text-foreground flex items-start gap-2 pl-2">
              <span className="text-muted-foreground mt-0.5">•</span>
              <span className="leading-relaxed flex-1">
                <span className="font-medium">{it.name}</span>
                {weightText && (
                  <span className="text-muted-foreground"> — {weightText}</span>
                )}
                {isCooked && weightText && (
                  <Badge variant="outline" className="ml-2 bg-orange-500/10 text-orange-600 border-orange-500/20 text-[10px] py-0 px-1">Pronto</Badge>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SubLine({
  kind, items, mode, isCooked,
}: { kind: "carb" | "protein" | "fat"; items: any[]; mode: CarbMode; isCooked: boolean }) {
  const meta = KIND_META[kind];
  return (
    <div className="text-xs">
      <span className={`font-bold ${meta.color}`}>{meta.emoji} {meta.label}:</span>{" "}
      <span className="text-foreground/90">
        {items.map((it: any, idx: number) => {
          const name = typeof it === "string" ? it : it?.name ?? "";
          const w = typeof it === "string" ? "" : applySmartMath(it?.weight || "", mode, isCooked, meta.isCarb);
          return (
            <span key={idx}>
              {idx > 0 && <span className="text-muted-foreground"> · </span>}
              {name}{w && <span className="text-muted-foreground"> ({w})</span>}
            </span>
          );
        })}
      </span>
    </div>
  );
}
