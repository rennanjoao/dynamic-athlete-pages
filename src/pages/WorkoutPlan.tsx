/**
 * WorkoutPlan.tsx — Visualização do Plano de Treino com Periodização
 *
 * Diretrizes semanais + Acordeão de treinos A/B/C/D
 * Lê dados de coach_plans.workout_periodization_json
 */

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Dumbbell,
  Calendar,
  Target,
  Timer,
  ArrowLeft,
  Loader2,
  Zap,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  cadence?: string;      // e.g. "3-1-2-0"
  rest?: string;          // e.g. "60s"
  notes?: string;
}

interface TrainingDay {
  id: string;             // "A", "B", "C", "D"
  label: string;          // "Peito & Tríceps"
  exercises: Exercise[];
}

interface WeekDirective {
  week: number;
  sets: string;
  reps: string;
  cadence: string;
  intensity: string;
  focus: string;
}

interface WorkoutPeriodization {
  trainingDays: TrainingDay[];
  weeklyDirectives: WeekDirective[];
  currentWeek?: number;
}

// ─── Default data ────────────────────────────────────────────────────────────

const DEFAULT_PERIODIZATION: WorkoutPeriodization = {
  currentWeek: 1,
  weeklyDirectives: [
    { week: 1, sets: "4-5", reps: "6-8", cadence: "3-1-2-0", intensity: "RPE 7-8", focus: "Força e hipertrofia" },
    { week: 2, sets: "4", reps: "8-10", cadence: "3-0-2-0", intensity: "RPE 7", focus: "Volume moderado" },
    { week: 3, sets: "5", reps: "5-6", cadence: "4-1-2-1", intensity: "RPE 8-9", focus: "Força máxima" },
    { week: 4, sets: "3", reps: "12-15", cadence: "2-0-2-0", intensity: "RPE 5-6", focus: "Deload / recuperação" },
  ],
  trainingDays: [
    {
      id: "A",
      label: "Peito & Tríceps",
      exercises: [
        { name: "Supino reto com barra", sets: "4", reps: "6-8", cadence: "3-1-2-0", rest: "90s" },
        { name: "Supino inclinado halteres", sets: "4", reps: "8-10", cadence: "3-0-2-0", rest: "75s" },
        { name: "Crucifixo cabo", sets: "3", reps: "10-12", cadence: "2-1-2-0", rest: "60s" },
        { name: "Tríceps pulley corda", sets: "4", reps: "10-12", cadence: "2-0-2-0", rest: "60s" },
        { name: "Tríceps francês", sets: "3", reps: "8-10", cadence: "3-0-2-0", rest: "60s" },
      ],
    },
    {
      id: "B",
      label: "Costas & Bíceps",
      exercises: [
        { name: "Barra fixa pronada", sets: "4", reps: "6-8", cadence: "2-1-3-0", rest: "90s" },
        { name: "Remada curvada", sets: "4", reps: "8-10", cadence: "2-0-3-0", rest: "75s" },
        { name: "Pulldown unilateral", sets: "3", reps: "10-12", cadence: "2-1-2-0", rest: "60s" },
        { name: "Rosca direta barra", sets: "4", reps: "8-10", cadence: "2-0-3-0", rest: "60s" },
        { name: "Rosca martelo", sets: "3", reps: "10-12", cadence: "2-0-2-0", rest: "60s" },
      ],
    },
    {
      id: "C",
      label: "Pernas (Quad & Posterior)",
      exercises: [
        { name: "Agachamento livre", sets: "5", reps: "5-8", cadence: "3-1-2-0", rest: "120s" },
        { name: "Leg Press 45°", sets: "4", reps: "8-10", cadence: "3-0-2-0", rest: "90s" },
        { name: "Cadeira extensora", sets: "3", reps: "10-12", cadence: "2-1-2-0", rest: "60s" },
        { name: "Mesa flexora", sets: "4", reps: "8-10", cadence: "3-1-2-0", rest: "75s" },
        { name: "Stiff romeno", sets: "3", reps: "10-12", cadence: "3-0-2-0", rest: "75s" },
        { name: "Panturrilha em pé", sets: "4", reps: "12-15", cadence: "2-1-3-0", rest: "45s" },
      ],
    },
    {
      id: "D",
      label: "Ombro & Abdômen",
      exercises: [
        { name: "Desenvolvimento halteres", sets: "4", reps: "8-10", cadence: "2-0-2-0", rest: "75s" },
        { name: "Elevação lateral", sets: "4", reps: "12-15", cadence: "2-1-2-0", rest: "45s" },
        { name: "Elevação frontal alternada", sets: "3", reps: "10-12", cadence: "2-0-2-0", rest: "60s" },
        { name: "Face pull", sets: "3", reps: "12-15", cadence: "2-1-2-0", rest: "45s" },
        { name: "Abdominal infra", sets: "3", reps: "15-20", rest: "30s" },
        { name: "Prancha isométrica", sets: "3", reps: "45-60s", rest: "30s" },
      ],
    },
  ],
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useWorkoutPlan(userId: string) {
  return useQuery({
    queryKey: ["workout-plan", userId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("coach_plans")
        .select("workout_periodization_json")
        .eq("student_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data?.workout_periodization_json && Object.keys(data.workout_periodization_json).length > 0) {
        return data.workout_periodization_json as WorkoutPeriodization;
      }
      return DEFAULT_PERIODIZATION;
    },
    staleTime: 5 * 60_000,
    enabled: !!userId,
  });
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function WorkoutPlan() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) setUserId(data.session.user.id);
      else navigate("/auth");
    });
  }, [navigate]);

  const { data: plan, isLoading } = useWorkoutPlan(userId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const periodization = plan ?? DEFAULT_PERIODIZATION;
  const currentWeek = periodization.currentWeek ?? 1;
  const currentDirective = periodization.weeklyDirectives.find((w) => w.week === currentWeek);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-lg font-bold text-foreground">Plano de Treino</h1>
          <p className="text-xs text-muted-foreground">Periodização Mensal</p>
        </div>
        <Badge className="ml-auto bg-primary/10 text-primary border-primary/20">
          Semana {currentWeek}
        </Badge>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* Current week directive */}
        {currentDirective && (
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-4 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-yellow-300" />
              <span className="font-bold text-sm">Diretriz da Semana {currentWeek}</span>
            </div>
            <p className="text-base font-bold mb-2">{currentDirective.focus}</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Séries", value: currentDirective.sets, icon: Dumbbell },
                { label: "Reps", value: currentDirective.reps, icon: Zap },
                { label: "Cadência", value: currentDirective.cadence, icon: Timer },
                { label: "Intensidade", value: currentDirective.intensity, icon: TrendingUp },
              ].map((item) => (
                <div key={item.label} className="bg-white/10 rounded-lg p-2.5">
                  <p className="text-xs text-blue-200">{item.label}</p>
                  <p className="text-sm font-bold">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Week selector */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="w-4 h-4 text-primary" />
              Visão do Mês
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {periodization.weeklyDirectives.map((w) => {
              const isCurrent = w.week === currentWeek;
              return (
                <div
                  key={w.week}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all
                    ${isCurrent ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20" : "bg-card border-border/50"}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                    ${isCurrent ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    S{w.week}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isCurrent ? "font-bold text-foreground" : "text-foreground"}`}>
                      {w.focus}
                      {isCurrent && <span className="text-xs text-primary ml-2">← Atual</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {w.sets} sets × {w.reps} reps • {w.intensity}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Training days accordion */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Dumbbell className="w-4 h-4 text-primary" />
              Divisão de Treinos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="space-y-2">
              {periodization.trainingDays.map((day) => (
                <AccordionItem key={day.id} value={day.id} className="border rounded-lg px-3">
                  <AccordionTrigger className="py-3">
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <Badge className="bg-primary/10 text-primary border-primary/20 w-8 h-6 justify-center text-xs">
                        {day.id}
                      </Badge>
                      {day.label}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1">
                      {day.exercises.map((ex, i) => (
                        <div key={i} className="flex items-start gap-3 py-2.5 border-b border-border/30 last:border-0">
                          <span className="text-xs text-muted-foreground font-mono w-5 shrink-0 pt-0.5">
                            {i + 1}.
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{ex.name}</p>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {ex.sets} × {ex.reps}
                              </Badge>
                              {ex.cadence && (
                                <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                                  ⏱ {ex.cadence}
                                </Badge>
                              )}
                              {ex.rest && (
                                <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                                  ⏸ {ex.rest}
                                </Badge>
                              )}
                            </div>
                            {ex.notes && (
                              <p className="text-xs text-muted-foreground mt-1 italic">{ex.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <div className="h-6" />
      </main>
    </div>
  );
}
