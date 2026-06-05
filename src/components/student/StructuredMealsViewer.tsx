import { useState } from "react";
import { Clock, TrendingUp, TrendingDown, Minus, Scale, Flame, Dna, Wheat, Droplets } from "lucide-react";
import { type CarbMode } from "@/components/student/CarbCycleSelector";

// ─── Math engine ──────────────────────────────────────────────────────────────
function applySmartMath(text: string, mode: CarbMode, isCooked: boolean, isCarbGroup: boolean, highPct = 15, lowPct = 15): string {
  if (!text) return "";
  const carbMult = mode === "high" ? 1 + highPct / 100 : (mode === "low" || mode === "off") ? 1 - lowPct / 100 : 1;
  let cookedMult = 1;
  const lStr = text.toLowerCase();
  if (isCooked) {
    if (/(arroz|macarrão|massa|cuscuz|creme de arroz|aveia)/.test(lStr)) cookedMult = 3;
    else if (/(mandioca|batata)/.test(lStr)) cookedMult = 1.3;
    else if (/(frango|carne|patinho|peixe|tilápia|salmão|boi|suíno|porco|coração)/.test(lStr)) cookedMult = 0.7;
  }
  let out = text.replace(/(\d+)(\s*)(g|ml|kg)/gi, (_, num, sp, unit) => {
    let v = Number(num);
    if (isCarbGroup) v *= carbMult;
    v *= cookedMult;
    return `${Math.round(v)}${sp}${unit}`;
  });
  if (isCooked) {
    out = out.replace(/\bcru(a)?\b/gi, "pronto").replace(/\b(cozido|grelhado|assado)\b/gi, "pronto");
  } else {
    out = out.replace(/\bpronto(a)?\b/gi, "cru").replace(/\bcozido(a)?\b/gi, "cru");
  }
  return out;
}

// Strip any HTML tags that may have been injected into saved data
function stripHtml(str: string): string {
  return (str || "").replace(/<[^>]*>/g, "").trim();
}

// ─── Constants ────────────────────────────────────────────────────────────────
const KIND_META = {
  carb:    { label: "CARBOIDRATO", color: "text-amber-400",  border: "border-amber-500/20",  bg: "bg-amber-500/5"  },
  protein: { label: "PROTEÍNA",    color: "text-blue-400",   border: "border-blue-500/20",   bg: "bg-blue-500/5"   },
  fat:     { label: "GORDURA",     color: "text-rose-400",   border: "border-rose-500/20",   bg: "bg-rose-500/5"   },
} as const;

// ─── NutritionStrategyHeader ─────────────────────────────────────────────────
function NutritionStrategyHeader({
  payload, isCooked, setIsCooked, mode, setMode,
}: {
  payload: any; isCooked: boolean; setIsCooked: (v: boolean) => void; mode: CarbMode; setMode: (m: CarbMode) => void;
}) {
  const m = payload?.macros ?? {};
  const hasCarbCycle = payload?.setup?.carbCycle === true;
  const highPct = payload?.carbCycleHighPct ?? 15;
  const lowPct  = payload?.carbCycleLowPct  ?? 15;
  const macros = [
    { icon: Flame,    value: m.calories ?? "—", unit: "kcal", label: "Energia"  },
    { icon: Dna,      value: m.protein  ?? "—", unit: "g",    label: "Proteína" },
    { icon: Wheat,    value: m.carbs    ?? "—", unit: "g",    label: "Carbo"    },
    { icon: Droplets, value: m.fat      ?? "—", unit: "g",    label: "Gordura"  },
  ];
  return (
    <div className="glass-strong rounded-2xl overflow-hidden glow-primary mb-6">
      <div className="gradient-primary-soft px-5 py-3 border-b border-white/5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-primary/70 font-bold">Estratégia Nutricional</p>
      </div>
      <div className="grid grid-cols-4 divide-x divide-white/5">
        {macros.map(({ icon: Icon, value, unit, label }) => (
          <div key={label} className="flex flex-col items-center py-4 px-2">
            <Icon className="w-3.5 h-3.5 text-primary/60 mb-1.5" />
            <span className="text-xl font-black text-foreground leading-none">{value}</span>
            <span className="text-[10px] text-primary font-bold mt-0.5">{unit}</span>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</span>
          </div>
        ))}
      </div>
      <div className="px-4 pb-4 space-y-2.5">
        <div className="flex gap-2">
          {[false, true].map((cooked) => (
            <button key={String(cooked)} type="button" onClick={() => setIsCooked(cooked)}
              className={`flex-1 h-9 rounded-xl text-xs font-bold border transition-all ${isCooked === cooked ? "gradient-primary text-white border-primary/40 glow-primary" : "glass border-white/10 text-muted-foreground hover:border-white/20"}`}>
              <Scale className="w-3.5 h-3.5 inline mr-1.5 opacity-70" />
              {cooked ? "COZIDO" : "CRU"}
            </button>
          ))}
        </div>
        {hasCarbCycle && (
          <div className="flex gap-2">
            {([
              { id: "base" as CarbMode, label: "DIA BASE",          Icon: Minus,        cls: "data-[on=true]:bg-blue-500/20  data-[on=true]:border-blue-500/40  data-[on=true]:text-blue-300"    },
              { id: "high" as CarbMode, label: `ALTO +${highPct}%`, Icon: TrendingUp,   cls: "data-[on=true]:bg-emerald-500/20 data-[on=true]:border-emerald-500/40 data-[on=true]:text-emerald-300" },
              { id: "off"  as CarbMode, label: `OFF −${lowPct}%`,   Icon: TrendingDown, cls: "data-[on=true]:bg-amber-500/20  data-[on=true]:border-amber-500/40  data-[on=true]:text-amber-300"   },
            ] as const).map(({ id, label, Icon, cls }) => (
              <button key={id} type="button" data-on={mode === id} onClick={() => setMode(id)}
                className={`flex-1 h-9 rounded-xl text-[10px] font-bold border border-white/10 glass flex items-center justify-center gap-1 transition-all ${cls}`}>
                <Icon className="w-3 h-3" />{label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MacroSection ─────────────────────────────────────────────────────────────
// Each kind is filtered STRICTLY — only opts where opt.kind === kind.
// Items are rendered per-option, never flattened across kinds.
function MacroSection({
  kind, opts, mode, isCooked, highPct, lowPct,
}: {
  kind: "carb" | "protein" | "fat"; opts: any[]; mode: CarbMode; isCooked: boolean; highPct: number; lowPct: number;
}) {
  const cfg = KIND_META[kind];
  const isCarb = kind === "carb";

  // Only options that strictly belong to this kind (already pre-filtered by caller)
  const filledOpts = opts.filter((o: any) =>
    Array.isArray(o.items) && o.items.some((it: any) => stripHtml(it?.baseName || it?.name || ""))
  );
  if (!filledOpts.length) return null;

  // Build flat ordered list of items from all options of this kind
  const items: { name: string; weight: string; isFirst: boolean }[] = [];
  filledOpts.forEach((opt: any) => {
    (opt.items as any[]).forEach((it: any) => {
      const name = stripHtml(it?.baseName || it?.name || "");
      if (!name) return;
      const rawText = it.rawWeight ? `${it.rawWeight}g` : stripHtml(it.weight || "");
      const weight = rawText ? applySmartMath(rawText, mode, isCooked, isCarb, highPct, lowPct) : "";
      items.push({ name, weight, isFirst: items.length === 0 });
    });
  });

  if (!items.length) return null;

  const note = filledOpts.find((o: any) => o.notes?.trim())?.notes;

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-3`}>
      <p className={`text-[10px] uppercase tracking-[0.18em] font-black mb-2.5 ${cfg.color}`}>
        ESCOLHA 1 {cfg.label}
      </p>
      <ul className="space-y-1">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-baseline justify-between gap-3 px-1 py-1">
            <div className="flex items-center gap-2 min-w-0">
              {item.isFirst && (
                <span className="text-[9px] text-muted-foreground/60 shrink-0 font-medium">✓</span>
              )}
              {!item.isFirst && (
                <span className="text-[9px] text-muted-foreground/30 shrink-0">·</span>
              )}
              <span className={`text-sm leading-snug truncate ${item.isFirst ? "text-foreground font-medium" : "text-foreground/70"}`}>
                {item.name}
              </span>
            </div>
            {item.weight && (
              <span className={`text-xs tabular-nums shrink-0 ${item.isFirst ? `font-bold ${cfg.color}` : "text-muted-foreground"}`}>
                {item.weight}
              </span>
            )}
          </li>
        ))}
      </ul>
      {note && <p className="text-[11px] text-muted-foreground italic mt-2 pl-1">{note}</p>}
    </div>
  );
}

// ─── MealCard ─────────────────────────────────────────────────────────────────
const MEAL_ICONS = ["☀️", "🥗", "💪", "🍽️", "🌙", "⚡", "🥤", "🌿"];

function MealCard({ meal, index, mode, isCooked, highPct, lowPct }: {
  meal: any; index: number; mode: CarbMode; isCooked: boolean; highPct: number; lowPct: number;
}) {
  const [open, setOpen] = useState(index === 0);
  const allOptions: any[] = Array.isArray(meal.options) ? meal.options : [];

  // Strict per-kind grouping — never mix
  const carbOpts    = allOptions.filter((o: any) => o?.kind === "carb");
  const proteinOpts = allOptions.filter((o: any) => o?.kind === "protein");
  const fatOpts     = allOptions.filter((o: any) => o?.kind === "fat");

  const effectiveMode: CarbMode = meal.carbCycle ? mode : "base";
  const icon = MEAL_ICONS[index % MEAL_ICONS.length];

  return (
    <div className="glass rounded-2xl overflow-hidden card-hover border border-white/[0.06]">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left">
        <div className="flex items-center gap-3">
          <span className="text-xl leading-none">{icon}</span>
          <div>
            <p className="font-bold text-foreground text-sm leading-tight">{meal.name || `Refeição ${index + 1}`}</p>
            {meal.time && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" />{meal.time}
              </p>
            )}
          </div>
        </div>
        <span className={`text-muted-foreground transition-transform duration-200 text-xs ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2.5 border-t border-white/5 pt-3">
          <MacroSection kind="carb"    opts={carbOpts}    mode={effectiveMode} isCooked={isCooked} highPct={highPct} lowPct={lowPct} />
          <MacroSection kind="protein" opts={proteinOpts} mode={effectiveMode} isCooked={isCooked} highPct={highPct} lowPct={lowPct} />
          <MacroSection kind="fat"     opts={fatOpts}     mode={effectiveMode} isCooked={isCooked} highPct={highPct} lowPct={lowPct} />

          {meal.substitutions && Object.values(meal.substitutions).some((arr: any) => arr?.length) && (
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2">Substituições</p>
              {(["carb", "protein", "fat"] as const).map((k) => {
                const items: any[] = meal.substitutions?.[k] ?? [];
                const filled = items.filter((it: any) => stripHtml(typeof it === "string" ? it : it?.name || ""));
                if (!filled.length) return null;
                const cfg = KIND_META[k];
                return (
                  <div key={k} className="flex flex-wrap gap-x-2 gap-y-0.5 mb-1">
                    <span className={`text-[10px] font-bold uppercase ${cfg.color} shrink-0`}>{cfg.label}:</span>
                    {filled.map((it: any, i: number) => {
                      const name = stripHtml(typeof it === "string" ? it : it?.name ?? "");
                      const rawW = typeof it === "string" ? "" : (it?.rawWeight ? `${it.rawWeight}g` : stripHtml(it?.weight || ""));
                      const w = rawW ? applySmartMath(rawW, effectiveMode, isCooked, k === "carb", highPct, lowPct) : "";
                      return (
                        <span key={i} className="text-xs text-foreground/60">
                          {name}{w ? ` (${w})` : ""}{i < filled.length - 1 ? " ·" : ""}
                        </span>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {meal.notes && <p className="text-xs text-muted-foreground italic px-1">{stripHtml(meal.notes)}</p>}
        </div>
      )}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function StructuredMealsViewer({ payload }: { payload: any }) {
  const safeData = payload || {};
  const meals: any[] = Array.isArray(safeData.meals) ? safeData.meals : [];
  const [mode, setMode] = useState<CarbMode>("base");
  const [isCooked, setIsCooked] = useState(false);
  const highPct: number = safeData.carbCycleHighPct ?? 15;
  const lowPct: number  = safeData.carbCycleLowPct  ?? 15;

  if (meals.length === 0) return null;

  return (
    <div className="space-y-4 w-full">
      <NutritionStrategyHeader payload={safeData} isCooked={isCooked} setIsCooked={setIsCooked} mode={mode} setMode={setMode} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {meals.map((meal: any, i: number) => (
          <MealCard key={i} meal={meal} index={i} mode={mode} isCooked={isCooked} highPct={highPct} lowPct={lowPct} />
        ))}
      </div>
    </div>
  );
}
