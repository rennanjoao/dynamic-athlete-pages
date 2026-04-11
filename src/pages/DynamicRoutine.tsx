/**
 * DynamicRoutine.tsx — Rotina Dinâmica (Ciclo de Carboidratos)
 *
 * Abas R1-R4 + Estratégia Semanal + Seletor de Bônus Carbo Alto
 * Lê dados de coach_plans.diet_strategy_json
 */

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Apple,
  Flame,
  TrendingUp,
  TrendingDown,
  Calendar,
  ChevronRight,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MealItem {
  name: string;
  quantity: string;
  macros?: { protein?: number; carbs?: number; fat?: number; kcal?: number };
}

interface Meal {
  id: string;
  label: string;
  items: MealItem[];
  highCarbBonus?: MealItem[];   // extra items on high-carb days
  gastricSub?: MealItem[];      // gastric substitutions
}

interface WeekDay {
  day: string;       // "Segunda", "Terça" ...
  type: "high" | "low" | "moderate" | "rest";
  label: string;
}

interface DietStrategy {
  meals: Meal[];
  weeklyPlan: WeekDay[];
  baseCalories?: number;
  highCarbDelta?: number;
  lowCarbDelta?: number;
}

// ─── Default/Sample data ─────────────────────────────────────────────────────

const DEFAULT_STRATEGY: DietStrategy = {
  baseCalories: 2100,
  highCarbDelta: 300,
  lowCarbDelta: -200,
  meals: [
    {
      id: "R1",
      label: "R1 — Café da Manhã",
      items: [
        { name: "Ovos mexidos", quantity: "3 unidades", macros: { protein: 18, carbs: 2, fat: 15, kcal: 210 } },
        { name: "Pão integral", quantity: "2 fatias", macros: { protein: 6, carbs: 24, fat: 2, kcal: 140 } },
        { name: "Café preto", quantity: "200ml", macros: { protein: 0, carbs: 0, fat: 0, kcal: 5 } },
      ],
      highCarbBonus: [],
      gastricSub: [
        { name: "Tapioca", quantity: "2 unidades", macros: { protein: 1, carbs: 26, fat: 0, kcal: 110 } },
      ],
    },
    {
      id: "R2",
      label: "R2 — Almoço",
      items: [
        { name: "Arroz branco", quantity: "150g", macros: { protein: 4, carbs: 42, fat: 0, kcal: 195 } },
        { name: "Frango grelhado", quantity: "200g", macros: { protein: 46, carbs: 0, fat: 6, kcal: 240 } },
        { name: "Brócolis", quantity: "100g", macros: { protein: 3, carbs: 7, fat: 0, kcal: 34 } },
      ],
      highCarbBonus: [],
      gastricSub: [],
    },
    {
      id: "R3",
      label: "R3 — Lanche/Pré-treino",
      items: [
        { name: "Whey Protein", quantity: "1 scoop", macros: { protein: 24, carbs: 3, fat: 2, kcal: 120 } },
        { name: "Banana", quantity: "1 unidade", macros: { protein: 1, carbs: 27, fat: 0, kcal: 105 } },
      ],
      highCarbBonus: [
        { name: "Fruta extra (mamão)", quantity: "1 fatia", macros: { protein: 1, carbs: 15, fat: 0, kcal: 60 } },
        { name: "Sobremesa fit", quantity: "1 porção", macros: { protein: 5, carbs: 20, fat: 3, kcal: 120 } },
      ],
      gastricSub: [],
    },
    {
      id: "R4",
      label: "R4 — Jantar",
      items: [
        { name: "Batata doce", quantity: "200g", macros: { protein: 2, carbs: 40, fat: 0, kcal: 172 } },
        { name: "Carne moída magra", quantity: "150g", macros: { protein: 30, carbs: 0, fat: 8, kcal: 190 } },
        { name: "Salada mista", quantity: "à vontade", macros: { protein: 2, carbs: 5, fat: 2, kcal: 40 } },
      ],
      highCarbBonus: [],
      gastricSub: [],
    },
  ],
  weeklyPlan: [
    { day: "Segunda", type: "high", label: "Dia Alto" },
    { day: "Terça", type: "low", label: "Dia Baixo" },
    { day: "Quarta", type: "high", label: "Dia Alto" },
    { day: "Quinta", type: "low", label: "Dia Baixo" },
    { day: "Sexta", type: "high", label: "Dia Alto" },
    { day: "Sábado", type: "moderate", label: "Moderado" },
    { day: "Domingo", type: "rest", label: "Descanso" },
  ],
};

const DAY_TYPE_STYLES: Record<string, { bg: string; text: string; icon: any }> = {
  high: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", icon: TrendingUp },
  low: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300", icon: TrendingDown },
  moderate: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", icon: Flame },
  rest: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400", icon: Calendar },
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useDietStrategy(userId: string) {
  return useQuery({
    queryKey: ["diet-strategy", userId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("coach_plans")
        .select("diet_strategy_json, base_calories, base_protein_g, base_carbs_g, base_fat_g")
        .eq("student_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data?.diet_strategy_json && Object.keys(data.diet_strategy_json).length > 0) {
        return data.diet_strategy_json as DietStrategy;
      }
      return DEFAULT_STRATEGY;
    },
    staleTime: 5 * 60_000,
    enabled: !!userId,
  });
}

// ─── Components ──────────────────────────────────────────────────────────────

function MealItemRow({ item }: { item: MealItem }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
        <p className="text-xs text-muted-foreground">{item.quantity}</p>
      </div>
      {item.macros && (
        <div className="flex gap-2 text-xs text-muted-foreground shrink-0">
          {item.macros.protein != null && (
            <span className="text-blue-600 font-medium">{item.macros.protein}P</span>
          )}
          {item.macros.carbs != null && (
            <span className="text-amber-600 font-medium">{item.macros.carbs}C</span>
          )}
          {item.macros.fat != null && (
            <span className="text-red-500 font-medium">{item.macros.fat}G</span>
          )}
        </div>
      )}
    </div>
  );
}

function BonusSelector({ bonus }: { bonus: MealItem[] }) {
  const [selected, setSelected] = useState<string>("");

  if (bonus.length === 0) return null;

  return (
    <div className="mt-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
      <Label className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 mb-2">
        🎁 Bônus Carbo Alto
      </Label>
      <Select value={selected} onValueChange={setSelected}>
        <SelectTrigger className="h-9 text-sm">
          <SelectValue placeholder="Escolha um bônus..." />
        </SelectTrigger>
        <SelectContent>
          {bonus.map((b, i) => (
            <SelectItem key={i} value={b.name}>
              {b.name} — {b.quantity}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selected && (
        <div className="mt-2">
          {bonus.filter((b) => b.name === selected).map((b, i) => (
            <MealItemRow key={i} item={b} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DynamicRoutine() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [activeTab, setActiveTab] = useState("R1");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) setUserId(data.session.user.id);
      else navigate("/auth");
    });
  }, [navigate]);

  const { data: strategy, isLoading } = useDietStrategy(userId);

  // Determine today's carb type
  const todayIndex = new Date().getDay(); // 0=Sun
  const dayMap = [6, 0, 1, 2, 3, 4, 5]; // JS Sunday=0 → our index
  const todayPlan = strategy?.weeklyPlan?.[dayMap[todayIndex]];
  const isHighCarb = todayPlan?.type === "high";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const meals = strategy?.meals ?? DEFAULT_STRATEGY.meals;
  const weeklyPlan = strategy?.weeklyPlan ?? DEFAULT_STRATEGY.weeklyPlan;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-lg font-bold text-foreground">Rotina Dinâmica</h1>
          <p className="text-xs text-muted-foreground">Ciclo de Carboidratos</p>
        </div>
        {todayPlan && (
          <Badge className={`ml-auto ${DAY_TYPE_STYLES[todayPlan.type]?.bg} ${DAY_TYPE_STYLES[todayPlan.type]?.text} border-0`}>
            {todayPlan.label}
          </Badge>
        )}
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* Today's banner */}
        {todayPlan && (
          <div className={`rounded-2xl p-4 ${DAY_TYPE_STYLES[todayPlan.type]?.bg}`}>
            <div className="flex items-center gap-2">
              {(() => {
                const Icon = DAY_TYPE_STYLES[todayPlan.type]?.icon;
                return Icon ? <Icon className={`w-5 h-5 ${DAY_TYPE_STYLES[todayPlan.type]?.text}`} /> : null;
              })()}
              <div>
                <p className={`text-sm font-bold ${DAY_TYPE_STYLES[todayPlan.type]?.text}`}>
                  Hoje: {todayPlan.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {todayPlan.type === "high" && `+${strategy?.highCarbDelta ?? 300} kcal • Mais carboidratos`}
                  {todayPlan.type === "low" && `${strategy?.lowCarbDelta ?? -200} kcal • Menos carboidratos`}
                  {todayPlan.type === "moderate" && "Calorias na média"}
                  {todayPlan.type === "rest" && "Dia de descanso ativo"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Meal Tabs R1-R4 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full">
            {meals.map((meal) => (
              <TabsTrigger key={meal.id} value={meal.id} className="text-xs font-semibold">
                {meal.id}
              </TabsTrigger>
            ))}
          </TabsList>
          {meals.map((meal) => (
            <TabsContent key={meal.id} value={meal.id}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Apple className="w-4 h-4 text-primary" />
                    {meal.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-border/50">
                    {meal.items.map((item, i) => (
                      <MealItemRow key={i} item={item} />
                    ))}
                  </div>

                  {/* Gastric substitutions */}
                  {meal.gastricSub && meal.gastricSub.length > 0 && (
                    <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-2">
                        🔄 Substituições Gástricas
                      </p>
                      {meal.gastricSub.map((item, i) => (
                        <MealItemRow key={i} item={item} />
                      ))}
                    </div>
                  )}

                  {/* High carb bonus selector */}
                  {isHighCarb && meal.highCarbBonus && meal.highCarbBonus.length > 0 && (
                    <BonusSelector bonus={meal.highCarbBonus} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Weekly Strategy */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="w-4 h-4 text-primary" />
              Estratégia Semanal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {weeklyPlan.map((day, i) => {
              const style = DAY_TYPE_STYLES[day.type];
              const Icon = style?.icon;
              const isToday = dayMap[todayIndex] === i;
              return (
                <div
                  key={day.day}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all
                    ${isToday ? `${style?.bg} border-primary/30 ring-1 ring-primary/20` : "bg-card border-border/50"}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${style?.bg}`}>
                    {Icon && <Icon className={`w-4 h-4 ${style?.text}`} />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isToday ? "text-foreground font-bold" : "text-foreground"}`}>
                      {day.day}
                      {isToday && <span className="text-xs text-primary ml-2">← Hoje</span>}
                    </p>
                  </div>
                  <Badge variant="outline" className={`text-xs ${style?.text}`}>
                    {day.label}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="h-6" />
      </main>
    </div>
  );
}
