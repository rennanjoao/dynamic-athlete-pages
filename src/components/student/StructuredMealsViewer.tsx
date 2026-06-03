import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Apple, Clock, Info, CheckCircle2, Scale } from "lucide-react";
import CarbCycleSelector, { type CarbMode } from "@/components/student/CarbCycleSelector";

// Motor Matemático Dinâmico (Regex)
function applySmartMath(text: string, mode: CarbMode, isCooked: boolean, isCarbGroup: boolean) {
  let finalStr = text;
  const carbMult = mode === "high" ? 1.15 : mode === "low" ? 0.85 : mode === "off" ? 0.85 : 1;

  // Fatores de conversão (Cru -> Cozido/Grelhado)
  let cookedMult = 1;
  const lStr = text.toLowerCase();
  
  if (isCooked) {
    if (/(arroz|macarrão|massa|cuscuz|creme de arroz|aveia)/.test(lStr)) cookedMult = 3;
    else if (/(mandioca|batata)/.test(lStr)) cookedMult = 1.3;
    else if (/(frango|carne|patinho|peixe|tilápia|salmão|boi|suíno|porco|coração)/.test(lStr)) cookedMult = 0.7;
    else if (/(ovo|clara)/.test(lStr)) cookedMult = 1; 
  }

  // Encontra qualquer número seguido de 'g' ou 'ml' e aplica o cálculo
  finalStr = finalStr.replace(/(\d+)(\s*)(g|ml|kg)/gi, (match, num, space, unit) => {
    let val = Number(num);
    if (isCarbGroup) val = val * carbMult; // Aplica ciclo de carbo apenas nos carboidratos
    val = val * cookedMult; // Aplica redução/aumento de cozimento
    return `${Math.round(val)}${space}${unit}`;
  });

  // Ajuste semântico visual
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

  if (meals.length === 0) return null;

  return (
    <div className="space-y-4 w-full">
      {safeData.setup?.carbCycle && <CarbCycleSelector value={mode} onChange={setMode} />}
      
      <Accordion type="single" collapsible className="w-full space-y-3">
        {meals.map((meal: any, i: number) => (
          <MealAccordionItem key={i} meal={meal} mode={mode} index={i} />
        ))}
      </Accordion>
    </div>
  );
}

function MealAccordionItem({ meal, mode, index }: { meal: any; mode: CarbMode; index: number }) {
  const [isCooked, setIsCooked] = useState(false);

  // Arrays de grupos (Duck typing para evitar crashes se o JSON vier incompleto)
  const carbs = Array.isArray(meal.carbs) ? meal.carbs.filter(Boolean) : [];
  const proteins = Array.isArray(meal.proteins) ? meal.proteins.filter(Boolean) : [];
  const fats = Array.isArray(meal.fats) ? meal.fats.filter(Boolean) : [];
  const free = Array.isArray(meal.free) ? meal.free.filter(Boolean) : [];

  const c = meal.macros?.carbs || 0;
  const p = meal.macros?.protein || 0;
  const f = meal.macros?.fat || 0;

  return (
    <AccordionItem value={`meal-${index}`} className="bg-card/60 border border-border/60 rounded-xl overflow-hidden shadow-sm">
      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 transition-all">
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Apple className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-base text-foreground text-left">{meal.name || `Refeição ${index + 1}`}</span>
          </div>
          {meal.time && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground bg-background px-2 py-1 rounded-md border">
              <Clock className="w-3 h-3" /> {meal.time}
            </span>
          )}
        </div>
      </AccordionTrigger>
      
      <AccordionContent className="px-4 pb-4 pt-1 border-t border-border/40">
        
        {/* Badges de Macros e Botão Cru/Cozido */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 mt-3">
          <div className="flex flex-wrap gap-1.5">
            {c > 0 && <Badge variant="outline" className="text-amber-600 border-amber-600/30 bg-amber-600/5">{c}g Carbo</Badge>}
            {p > 0 && <Badge variant="outline" className="text-blue-600 border-blue-600/30 bg-blue-600/5">{p}g Prot</Badge>}
            {f > 0 && <Badge variant="outline" className="text-rose-500 border-rose-500/30 bg-rose-500/5">{f}g Gord</Badge>}
          </div>

          <button
            onClick={() => setIsCooked(!isCooked)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold border transition-colors ${
              isCooked 
                ? 'bg-orange-500 text-white border-orange-600 shadow-md' 
                : 'bg-background text-muted-foreground border-border hover:border-primary/50'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            {isCooked ? 'Medida: PRONTO' : 'Medida: CRU'}
          </button>
        </div>

        <div className="space-y-4">
          <FoodGroup title="🟡 Carboidratos (Escolha 1)" items={carbs} color="text-amber-600" mode={mode} isCooked={isCooked} isCarb={true} />
          <FoodGroup title="🔵 Proteínas (Escolha 1)" items={proteins} color="text-blue-600" mode={mode} isCooked={isCooked} isCarb={false} />
          <FoodGroup title="🔴 Gorduras (Escolha 1)" items={fats} color="text-rose-500" mode={mode} isCooked={isCooked} isCarb={false} />
          <FoodGroup title="🟢 Vegetais & Livres (À vontade)" items={free} color="text-emerald-500" mode={mode} isCooked={isCooked} isCarb={false} />
          
          {(!carbs.length && !proteins.length && !fats.length && !free.length) && (
            <p className="text-sm text-muted-foreground italic text-center py-4">Grupos de alimentos não cadastrados.</p>
          )}
        </div>

        {meal.notes && (
          <div className="mt-5 p-3 rounded-lg bg-primary/5 border border-primary/20 flex gap-2 items-start">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">{meal.notes}</p>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

function FoodGroup({ title, items, color, mode, isCooked, isCarb }: { title: string; items: string[]; color: string; mode: CarbMode; isCooked: boolean; isCarb: boolean }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="bg-background rounded-lg border border-border/60 p-3 shadow-sm">
      <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${color}`}>
        <CheckCircle2 className="w-3.5 h-3.5" /> {title}
      </h4>
      <ul className="space-y-2">
        {items.map((item, idx) => {
          // A mágica matemática acontece AQUI
          const calculatedText = applySmartMath(item, mode, isCooked, isCarb);
          
          return (
            <li key={idx} className="text-sm text-foreground flex items-start gap-2 pl-2">
              <span className="text-muted-foreground mt-0.5">•</span>
              <span className="leading-relaxed">
                {calculatedText}
                {isCooked && <Badge variant="outline" className="ml-2 bg-orange-500/10 text-orange-600 border-orange-500/20 text-[10px] py-0 px-1">Pronto</Badge>}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
