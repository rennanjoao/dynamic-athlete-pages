/**
 * RoutineBuilder.tsx — Coach cria rotina dinâmica (dieta + treino) para um aluno
 * Salva em coach_plans com diet_strategy_json e workout_periodization_json
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Save,
  Plus,
  Trash2,
  Apple,
  Dumbbell,
  Loader2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MealItem {
  name: string;
  portion: string;
  macros: string;
}

interface Meal {
  id: string;
  label: string;
  time: string;
  items: MealItem[];
}

interface CarbDay {
  type: "alto" | "moderado" | "baixo" | "descanso";
  meals: Meal[];
}

interface DietStrategy {
  carbCycle: Record<string, CarbDay>;
  highCarbBonus: string[];
  substitutions: Record<string, string>;
}

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  note: string;
}

interface TrainingSplit {
  id: string;
  label: string;
  focus: string;
  exercises: Exercise[];
}

interface WorkoutPeriodization {
  weekDirective: {
    sets: string;
    reps: string;
    rpe: string;
    cadence: string;
  };
  splits: TrainingSplit[];
}

interface Props {
  studentId: string;
  studentName: string;
  onClose: () => void;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

const defaultMeal = (): Meal => ({
  id: crypto.randomUUID(),
  label: "Refeição",
  time: "08:00",
  items: [{ name: "", portion: "", macros: "" }],
});

const defaultExercise = (): Exercise => ({
  name: "",
  sets: "3",
  reps: "10-12",
  rest: "60s",
  note: "",
});

const defaultSplit = (): TrainingSplit => ({
  id: crypto.randomUUID(),
  label: "Treino A",
  focus: "Peito / Tríceps",
  exercises: [defaultExercise()],
});

// ─── Component ───────────────────────────────────────────────────────────────

export default function RoutineBuilder({ studentId, studentName, onClose }: Props) {
  const qc = useQueryClient();

  // Macro base
  const [calories, setCalories] = useState(2200);
  const [protein, setProtein] = useState(160);
  const [carbs, setCarbs] = useState(250);
  const [fat, setFat] = useState(55);
  const [water, setWater] = useState(2.5);
  const [goal, setGoal] = useState("hipertrofia");
  const [notes, setNotes] = useState("");

  // Diet strategy
  const [meals, setMeals] = useState<Meal[]>([defaultMeal()]);
  const [carbDayType, setCarbDayType] = useState<CarbDay["type"]>("moderado");
  const [highCarbBonus, setHighCarbBonus] = useState("");

  // Workout
  const [directive, setDirective] = useState({
    sets: "3-4",
    reps: "8-12",
    rpe: "7-8",
    cadence: "2-0-2",
  });
  const [splits, setSplits] = useState<TrainingSplit[]>([defaultSplit()]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      const coachId = session?.session?.user?.id;
      if (!coachId) throw new Error("Sessão expirada");

      const dietStrategy: DietStrategy = {
        carbCycle: {
          [carbDayType]: {
            type: carbDayType,
            meals,
          },
        },
        highCarbBonus: highCarbBonus.split(",").map((s) => s.trim()).filter(Boolean),
        substitutions: {},
      };

      const workoutPeriodization: WorkoutPeriodization = {
        weekDirective: directive,
        splits,
      };

      // Check if plan exists
      const { data: existing } = await supabase
        .from("coach_plans")
        .select("id")
        .eq("student_id", studentId)
        .eq("coach_id", coachId)
        .limit(1);

      const payload = {
        coach_id: coachId,
        student_id: studentId,
        calories,
        protein_g: protein,
        carbs_g: carbs,
        fat_g: fat,
        water_l: water,
        goal,
        notes,
        diet_strategy_json: dietStrategy as any,
        workout_periodization_json: workoutPeriodization as any,
      };

      if (existing && existing.length > 0) {
        const { error } = await supabase
          .from("coach_plans")
          .update(payload)
          .eq("id", existing[0].id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("coach_plans")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(`Rotina de ${studentName} salva com sucesso!`);
      qc.invalidateQueries({ queryKey: ["students"] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao salvar rotina");
    },
  });

  // Meal helpers
  const addMeal = () => setMeals((prev) => [...prev, defaultMeal()]);
  const removeMeal = (idx: number) => setMeals((prev) => prev.filter((_, i) => i !== idx));
  const updateMealField = (idx: number, field: keyof Meal, value: string) => {
    setMeals((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  };
  const addMealItem = (mealIdx: number) => {
    setMeals((prev) =>
      prev.map((m, i) =>
        i === mealIdx ? { ...m, items: [...m.items, { name: "", portion: "", macros: "" }] } : m
      )
    );
  };
  const updateMealItem = (mealIdx: number, itemIdx: number, field: keyof MealItem, value: string) => {
    setMeals((prev) =>
      prev.map((m, i) =>
        i === mealIdx
          ? {
              ...m,
              items: m.items.map((it, j) => (j === itemIdx ? { ...it, [field]: value } : it)),
            }
          : m
      )
    );
  };

  // Split helpers
  const addSplit = () => setSplits((prev) => [...prev, { ...defaultSplit(), label: `Treino ${String.fromCharCode(65 + prev.length)}` }]);
  const removeSplit = (idx: number) => setSplits((prev) => prev.filter((_, i) => i !== idx));
  const addExercise = (splitIdx: number) => {
    setSplits((prev) =>
      prev.map((s, i) =>
        i === splitIdx ? { ...s, exercises: [...s.exercises, defaultExercise()] } : s
      )
    );
  };
  const updateExercise = (splitIdx: number, exIdx: number, field: keyof Exercise, value: string) => {
    setSplits((prev) =>
      prev.map((s, i) =>
        i === splitIdx
          ? {
              ...s,
              exercises: s.exercises.map((e, j) => (j === exIdx ? { ...e, [field]: value } : e)),
            }
          : s
      )
    );
  };
  const removeExercise = (splitIdx: number, exIdx: number) => {
    setSplits((prev) =>
      prev.map((s, i) =>
        i === splitIdx ? { ...s, exercises: s.exercises.filter((_, j) => j !== exIdx) } : s
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Rotina — {studentName}</h2>
          <p className="text-sm text-muted-foreground">Configure dieta e treino completos</p>
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          size="sm"
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-1.5" />
          )}
          Salvar Rotina
        </Button>
      </div>

      {/* Macros base */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Macros Base</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <Label className="text-xs">Calorias</Label>
              <Input type="number" value={calories} onChange={(e) => setCalories(+e.target.value)} className="mt-1 h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Proteína (g)</Label>
              <Input type="number" value={protein} onChange={(e) => setProtein(+e.target.value)} className="mt-1 h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Carboidrato (g)</Label>
              <Input type="number" value={carbs} onChange={(e) => setCarbs(+e.target.value)} className="mt-1 h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Gordura (g)</Label>
              <Input type="number" value={fat} onChange={(e) => setFat(+e.target.value)} className="mt-1 h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Água (L)</Label>
              <Input type="number" step="0.1" value={water} onChange={(e) => setWater(+e.target.value)} className="mt-1 h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Objetivo</Label>
              <Select value={goal} onValueChange={setGoal}>
                <SelectTrigger className="mt-1 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hipertrofia">Hipertrofia</SelectItem>
                  <SelectItem value="emagrecimento">Emagrecimento</SelectItem>
                  <SelectItem value="recomposicao">Recomposição</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="manter">Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="diet" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="diet" className="gap-1.5">
            <Apple className="w-3.5 h-3.5" /> Dieta
          </TabsTrigger>
          <TabsTrigger value="workout" className="gap-1.5">
            <Dumbbell className="w-3.5 h-3.5" /> Treino
          </TabsTrigger>
        </TabsList>

        {/* ── Diet Tab ── */}
        <TabsContent value="diet" className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <Label className="text-xs">Tipo do Dia</Label>
              <Select value={carbDayType} onValueChange={(v) => setCarbDayType(v as CarbDay["type"])}>
                <SelectTrigger className="w-40 mt-1 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alto">🔴 Carbo Alto</SelectItem>
                  <SelectItem value="moderado">🟡 Carbo Moderado</SelectItem>
                  <SelectItem value="baixo">🟢 Carbo Baixo</SelectItem>
                  <SelectItem value="descanso">⚪ Descanso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs">Bônus Carbo Alto (vírgula)</Label>
              <Input
                value={highCarbBonus}
                onChange={(e) => setHighCarbBonus(e.target.value)}
                placeholder="Ex: batata doce, arroz branco"
                className="mt-1 h-9 text-sm"
              />
            </div>
          </div>

          {meals.map((meal, mealIdx) => (
            <Card key={meal.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Input
                      value={meal.label}
                      onChange={(e) => updateMealField(mealIdx, "label", e.target.value)}
                      className="h-8 w-40 text-sm font-semibold"
                    />
                    <Input
                      value={meal.time}
                      onChange={(e) => updateMealField(mealIdx, "time", e.target.value)}
                      className="h-8 w-20 text-sm"
                      placeholder="HH:mm"
                    />
                    <Badge variant="secondary" className="text-xs">
                      R{mealIdx + 1}
                    </Badge>
                  </div>
                  {meals.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeMeal(mealIdx)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {meal.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="grid grid-cols-3 gap-2">
                    <Input
                      value={item.name}
                      onChange={(e) => updateMealItem(mealIdx, itemIdx, "name", e.target.value)}
                      placeholder="Alimento"
                      className="h-8 text-sm"
                    />
                    <Input
                      value={item.portion}
                      onChange={(e) => updateMealItem(mealIdx, itemIdx, "portion", e.target.value)}
                      placeholder="Porção"
                      className="h-8 text-sm"
                    />
                    <Input
                      value={item.macros}
                      onChange={(e) => updateMealItem(mealIdx, itemIdx, "macros", e.target.value)}
                      placeholder="Macros (P/C/G)"
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => addMealItem(mealIdx)}>
                  <Plus className="w-3 h-3 mr-1" /> Alimento
                </Button>
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" size="sm" onClick={addMeal}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Nova Refeição
          </Button>
        </TabsContent>

        {/* ── Workout Tab ── */}
        <TabsContent value="workout" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Diretiva Semanal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">Séries</Label>
                  <Input value={directive.sets} onChange={(e) => setDirective((d) => ({ ...d, sets: e.target.value }))} className="mt-1 h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Repetições</Label>
                  <Input value={directive.reps} onChange={(e) => setDirective((d) => ({ ...d, reps: e.target.value }))} className="mt-1 h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">RPE</Label>
                  <Input value={directive.rpe} onChange={(e) => setDirective((d) => ({ ...d, rpe: e.target.value }))} className="mt-1 h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Cadência</Label>
                  <Input value={directive.cadence} onChange={(e) => setDirective((d) => ({ ...d, cadence: e.target.value }))} className="mt-1 h-9 text-sm" />
                </div>
              </div>
            </CardContent>
          </Card>

          {splits.map((split, splitIdx) => (
            <Card key={split.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Input
                      value={split.label}
                      onChange={(e) => setSplits((prev) => prev.map((s, i) => (i === splitIdx ? { ...s, label: e.target.value } : s)))}
                      className="h-8 w-32 text-sm font-semibold"
                    />
                    <Input
                      value={split.focus}
                      onChange={(e) => setSplits((prev) => prev.map((s, i) => (i === splitIdx ? { ...s, focus: e.target.value } : s)))}
                      className="h-8 flex-1 text-sm"
                      placeholder="Grupo muscular"
                    />
                  </div>
                  {splits.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeSplit(splitIdx)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {split.exercises.map((ex, exIdx) => (
                  <div key={exIdx} className="grid grid-cols-5 gap-2 items-center">
                    <Input value={ex.name} onChange={(e) => updateExercise(splitIdx, exIdx, "name", e.target.value)} placeholder="Exercício" className="h-8 text-sm col-span-2" />
                    <Input value={ex.sets} onChange={(e) => updateExercise(splitIdx, exIdx, "sets", e.target.value)} placeholder="Séries" className="h-8 text-sm" />
                    <Input value={ex.reps} onChange={(e) => updateExercise(splitIdx, exIdx, "reps", e.target.value)} placeholder="Reps" className="h-8 text-sm" />
                    <div className="flex gap-1">
                      <Input value={ex.rest} onChange={(e) => updateExercise(splitIdx, exIdx, "rest", e.target.value)} placeholder="Desc" className="h-8 text-sm" />
                      {split.exercises.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeExercise(splitIdx, exIdx)}>
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => addExercise(splitIdx)}>
                  <Plus className="w-3 h-3 mr-1" /> Exercício
                </Button>
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" size="sm" onClick={addSplit}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Novo Split
          </Button>
        </TabsContent>
      </Tabs>

      {/* Notes */}
      <div>
        <Label className="text-xs">Observações gerais</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Orientações para o aluno..."
          className="mt-1 text-sm resize-none h-20"
        />
      </div>
    </div>
  );
}
