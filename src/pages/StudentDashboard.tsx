/**
 * StudentDashboard.tsx — Visão do Aluno (Gamificada)
 *
 * Design: Mobile-first, gamificado, foco em checklist diário + pontuação.
 * Scoring: Treino 100pts, Dieta 80pts, Água 50pts, Sono 70pts
 * Libs: Recharts, Lucide, Shadcn/UI, Supabase, React Query
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Flame,
  Droplets,
  Dumbbell,
  UtensilsCrossed,
  TrendingUp,
  CheckCircle2,
  Circle,
  Trophy,
  LogOut,
  ChevronRight,
  Zap,
  Moon,
  ClipboardList,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import ScoreCard from "@/components/gamification/ScoreCard";
import RankingTeaser from "@/components/gamification/RankingTeaser";

// ─── Scoring Constants ───────────────────────────────────────────────────────

const SCORE_WEIGHTS = {
  workout: 100,
  diet: 80,      // per meal (total split across meals)
  water: 50,
  sleep: 70,
  rest_day: 40,
  updates: 150,
} as const;

// ─── Types ───────────────────────────────────────────────────────────────────

interface Macro {
  label: string;
  unit: string;
  current: number;
  goal: number;
  color: string;
  icon: React.ReactNode;
}

interface CheckItem {
  id: string;
  label: string;
  type: "workout" | "meal";
  completed: boolean;
}

interface WeightPoint {
  date: string;
  weight: number;
}

// ─── Hook: Daily State ────────────────────────────────────────────────────────

function useDailyState(userId: string) {
  const today = new Date().toISOString().split("T")[0];

  return useQuery({
    queryKey: ["daily", userId, today],
    queryFn: async () => {
      const [workouts, meals, measurements] = await Promise.all([
        supabase
          .from("workout_progress")
          .select("workout_id, completed")
          .eq("user_id", userId),
        supabase
          .from("diet_progress")
          .select("meal_id, completed")
          .eq("user_id", userId)
          .eq("date", today),
        supabase
          .from("body_measurements")
          .select("weight, measurement_date")
          .eq("user_id", userId)
          .order("measurement_date", { ascending: false })
          .limit(30),
      ]);

      return {
        workouts: workouts.data ?? [],
        meals: meals.data ?? [],
        weightHistory: (measurements.data ?? []).map((m) => ({
          date: new Date(m.measurement_date).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
          }),
          weight: Number(m.weight),
        })),
      };
    },
    staleTime: 30_000,
  });
}

// ─── Hook: Toggle Checklist ───────────────────────────────────────────────────

function useToggleItem(userId: string) {
  const qc = useQueryClient();
  const today = new Date().toISOString().split("T")[0];

  return useMutation({
    mutationFn: async ({
      id,
      type,
      current,
    }: {
      id: string;
      type: "workout" | "meal";
      current: boolean;
    }) => {
      const table = type === "workout" ? "workout_progress" : "diet_progress";
      const idField = type === "workout" ? "workout_id" : "meal_id";
      const newVal = !current;

      // Optimistic — handled in onMutate
      let query = (supabase as any)
        .from(table)
        .select("id")
        .eq("user_id", userId)
        .eq(idField, id);
      if (type === "meal") {
        query = query.eq("date", today);
      }
      const { data: existing } = await query.maybeSingle();

      if (existing) {
        await (supabase as any)
          .from(table)
          .update({
            completed: newVal,
            completed_at: newVal ? new Date().toISOString() : null,
          })
          .eq("id", existing.id);
      } else {
        await (supabase as any).from(table).insert({
          user_id: userId,
          [idField]: id,
          ...(type === "meal" ? { date: today } : {}),
          completed: newVal,
          completed_at: newVal ? new Date().toISOString() : null,
        });
      }
      return { id, type, newVal };
    },
    onMutate: async ({ id, type, current }) => {
      await qc.cancelQueries({ queryKey: ["daily", userId, today] });
      const prev = qc.getQueryData(["daily", userId, today]);
      qc.setQueryData(["daily", userId, today], (old: any) => {
        if (!old) return old;
        if (type === "workout") {
          return {
            ...old,
            workouts: old.workouts.map((w: any) =>
              w.workout_id === id ? { ...w, completed: !current } : w
            ),
          };
        }
        return {
          ...old,
          meals: old.meals.map((m: any) =>
            m.meal_id === id ? { ...m, completed: !current } : m
          ),
        };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev)
        qc.setQueryData(["daily", userId, today], ctx.prev);
      toast.error("Erro ao atualizar. Tente novamente.");
    },
    onSuccess: ({ newVal, type }) => {
      toast.success(
        newVal
          ? type === "workout"
            ? "🏋️ Treino marcado!"
            : "✅ Refeição concluída!"
          : "Desmarcado"
      );
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["daily", userId, today] });
    },
  });
}

// ─── Static sample data (replace with real plan from Supabase) ───────────────

const SAMPLE_WORKOUTS = [
  { id: "A", label: "Treino A — Peito & Tríceps" },
  { id: "B", label: "Treino B — Costas & Bíceps" },
  { id: "C", label: "Treino C — Pernas & Ombro" },
];

const SAMPLE_MEALS = [
  { id: "cafe", label: "☕ Café da manhã" },
  { id: "almoco", label: "🥗 Almoço" },
  { id: "lanche", label: "🍎 Lanche da tarde" },
  { id: "jantar", label: "🍽️ Jantar" },
];

// ─── Macro Bar ────────────────────────────────────────────────────────────────

function MacroBar({ label, unit, current, goal, color }: Macro) {
  const pct = Math.min(Math.round((current / goal) * 100), 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-[#0F172A]">{label}</span>
        <span className="text-slate-500">
          {current}
          {unit} / {goal}
          {unit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-right text-xs font-semibold" style={{ color }}>
        {pct}%
      </p>
    </div>
  );
}

// ─── Checklist Item ───────────────────────────────────────────────────────────

function CheckRow({
  item,
  onToggle,
  loading,
}: {
  item: CheckItem;
  onToggle: () => void;
  loading: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={loading}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-200 text-left
        ${
          item.completed
            ? "bg-emerald-50 border-emerald-200"
            : "bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/40"
        }`}
    >
      {item.completed ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
      ) : (
        <Circle className="w-5 h-5 text-slate-300 shrink-0" />
      )}
      <span
        className={`flex-1 text-sm font-medium ${
          item.completed
            ? "text-emerald-700 line-through decoration-emerald-300"
            : "text-[#0F172A]"
        }`}
      >
        {item.label}
      </span>
      {!item.completed && (
        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
      )}
    </button>
  );
}

// ─── XP / Streak Bar ─────────────────────────────────────────────────────────

function XPBar({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const streak = 4; // TODO: fetch from DB

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 text-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-300" />
          <span className="font-bold text-sm">Progresso de Hoje</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-orange-300" />
          <span className="text-sm font-bold">{streak} dias seguidos</span>
        </div>
      </div>
      <div className="h-2.5 rounded-full bg-white/20 overflow-hidden">
        <div
          className="h-full rounded-full bg-yellow-300 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-xs text-blue-200">
          {done}/{total} tarefas
        </span>
        <span className="text-xs font-bold text-yellow-300">{pct}% completo</span>
      </div>
    </div>
  );
}

// ─── Weight Chart ─────────────────────────────────────────────────────────────

function WeightChart({ data }: { data: WeightPoint[] }) {
  if (data.length < 2) return null;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-blue-500" />
        <h3 className="text-sm font-semibold text-[#0F172A]">
          Evolução de Peso
        </h3>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={data} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            domain={["dataMin - 1", "dataMax + 1"]}
          />
          <Tooltip
            contentStyle={{
              background: "#fff",
              border: "0.5px solid #e2e8f0",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v: number) => [`${v} kg`, "Peso"]}
          />
          <Area
            type="monotone"
            dataKey="weight"
            stroke="#3B82F6"
            strokeWidth={2}
            fill="url(#wGrad)"
            dot={{ r: 3, fill: "#3B82F6", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Hook: Score persistence ──────────────────────────────────────────────────

function useSaveScore(userId: string) {
  const today = new Date().toISOString().split("T")[0];
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (scores: {
      workout_score: number;
      diet_score: number;
      water_score: number;
      sleep_score: number;
      daily_score: number;
    }) => {
      const { data: existing } = await (supabase as any)
        .from("performance_logs")
        .select("id")
        .eq("user_id", userId)
        .eq("date", today)
        .maybeSingle();

      if (existing) {
        await (supabase as any)
          .from("performance_logs")
          .update({ ...scores })
          .eq("id", existing.id);
      } else {
        await (supabase as any)
          .from("performance_logs")
          .insert({ user_id: userId, date: today, ...scores });
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["totalScore", userId] });
    },
  });
}

function useTotalScore(userId: string) {
  return useQuery({
    queryKey: ["totalScore", userId],
    queryFn: async () => {
      const { data: logs } = await (supabase as any)
        .from("performance_logs")
        .select("daily_score")
        .eq("user_id", userId);
      return (logs ?? []).reduce((sum: number, l: any) => sum + (l.daily_score ?? 0), 0);
    },
    staleTime: 30_000,
  });
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>("");
  const [waterMl, setWaterMl] = useState(0);
  const [sleepChecked, setSleepChecked] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Get auth user
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) setUserId(data.session.user.id);
    });
  }, []);

  const { data, isLoading } = useDailyState(userId);
  const toggle = useToggleItem(userId);
  const saveScore = useSaveScore(userId);
  const { data: totalScore = 0 } = useTotalScore(userId);

  const workoutMap = useMemo(() => {
    const m: Record<string, boolean> = {};
    data?.workouts.forEach((w) => (m[w.workout_id] = w.completed));
    return m;
  }, [data?.workouts]);

  const mealMap = useMemo(() => {
    const m: Record<string, boolean> = {};
    data?.meals.forEach((ml) => (m[ml.meal_id] = ml.completed));
    return m;
  }, [data?.meals]);

  const items: CheckItem[] = [
    ...SAMPLE_WORKOUTS.map((w) => ({
      ...w,
      type: "workout" as const,
      completed: workoutMap[w.id] ?? false,
    })),
    ...SAMPLE_MEALS.map((ml) => ({
      ...ml,
      type: "meal" as const,
      completed: mealMap[ml.id] ?? false,
    })),
  ];

  const doneCount = items.filter((i) => i.completed).length;

  // Calculate today's scores
  const workoutsCompleted = items.filter((i) => i.type === "workout" && i.completed).length;
  const mealsCompleted = items.filter((i) => i.type === "meal" && i.completed).length;
  const totalWorkouts = items.filter((i) => i.type === "workout").length;
  const totalMeals = items.filter((i) => i.type === "meal").length;

  const workoutScore = totalWorkouts > 0
    ? Math.round((workoutsCompleted / totalWorkouts) * SCORE_WEIGHTS.workout)
    : 0;
  const dietScore = totalMeals > 0
    ? Math.round((mealsCompleted / totalMeals) * SCORE_WEIGHTS.diet)
    : 0;
  const waterGoalMl = 2500;
  const waterScore = waterMl >= waterGoalMl ? SCORE_WEIGHTS.water : Math.round((waterMl / waterGoalMl) * SCORE_WEIGHTS.water);
  const sleepScore = sleepChecked ? SCORE_WEIGHTS.sleep : 0;
  const todayScore = workoutScore + dietScore + waterScore + sleepScore;

  // Auto-save score when it changes
  const persistScore = useCallback(() => {
    if (!userId) return;
    saveScore.mutate({
      workout_score: workoutScore,
      diet_score: dietScore,
      water_score: waterScore,
      sleep_score: sleepScore,
      daily_score: todayScore,
    });
  }, [userId, workoutScore, dietScore, waterScore, sleepScore, todayScore]);

  // Save on meaningful changes
  useEffect(() => {
    if (!userId || todayScore === 0) return;
    const timeout = setTimeout(persistScore, 1500);
    return () => clearTimeout(timeout);
  }, [todayScore, persistScore, userId]);

  // Handle anonymous toggle
  const handleAnonymousToggle = async (val: boolean) => {
    setIsAnonymous(val);
    if (!userId) return;
    const today = new Date().toISOString().split("T")[0];
    await (supabase as any)
      .from("performance_logs")
      .update({ is_anonymous: val })
      .eq("user_id", userId)
      .eq("date", today);
  };

  // Sample macros — replace with real plan values
  const macros: Macro[] = [
    { label: "Proteína", unit: "g", current: 120, goal: 160, color: "#3B82F6", icon: null },
    { label: "Carboidrato", unit: "g", current: 200, goal: 300, color: "#F59E0B", icon: null },
    { label: "Gordura", unit: "g", current: 45, goal: 60, color: "#EF4444", icon: null },
    { label: "Água", unit: "L", current: +(waterMl / 1000).toFixed(1), goal: 2.5, color: "#06B6D4", icon: null },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando seu plano...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-foreground">Olá, Atleta 👋</h1>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/anamnesis")}
              title="Anamnese"
            >
              <ClipboardList className="w-4 h-4" />
            </Button>
            <button
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* ── Score Card (Gamificação) ── */}
        <ScoreCard
          totalScore={totalScore}
          todayScore={todayScore}
          breakdown={{
            workout: workoutScore,
            diet: dietScore,
            water: waterScore,
            sleep: sleepScore,
          }}
        />

        {/* ── Macros ── */}
        <div className="bg-card rounded-2xl border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <h2 className="text-sm font-semibold text-foreground">Macros de Hoje</h2>
            <Badge variant="secondary" className="ml-auto text-xs">2.100 kcal</Badge>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            {macros.map((m) => (
              <MacroBar key={m.label} {...m} />
            ))}
          </div>
        </div>

        {/* ── Treinos ── */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Dumbbell className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-semibold text-foreground">Treinos</h2>
            <Badge variant="outline" className="ml-auto text-xs">
              +{SCORE_WEIGHTS.workout} pts
            </Badge>
          </div>
          {items
            .filter((i) => i.type === "workout")
            .map((item) => (
              <CheckRow
                key={item.id}
                item={item}
                loading={toggle.isPending}
                onToggle={() =>
                  toggle.mutate({ id: item.id, type: item.type, current: item.completed })
                }
              />
            ))}
        </div>

        {/* ── Refeições ── */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <UtensilsCrossed className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-semibold text-foreground">Plano Alimentar</h2>
            <Badge variant="outline" className="ml-auto text-xs">
              +{SCORE_WEIGHTS.diet} pts
            </Badge>
          </div>
          {items
            .filter((i) => i.type === "meal")
            .map((item) => (
              <CheckRow
                key={item.id}
                item={item}
                loading={toggle.isPending}
                onToggle={() =>
                  toggle.mutate({ id: item.id, type: item.type, current: item.completed })
                }
              />
            ))}
        </div>

        {/* ── Hidratação (gamificada) ── */}
        <div className="bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Droplets className="w-4 h-4 text-cyan-500" />
            <h2 className="text-sm font-semibold text-foreground">Hidratação</h2>
            <Badge variant="outline" className="ml-auto text-xs border-cyan-300 text-cyan-600">
              +{SCORE_WEIGHTS.water} pts
            </Badge>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">
              {(waterMl / 1000).toFixed(1)} L / {(waterGoalMl / 1000).toFixed(1)} L
            </span>
            {waterMl >= waterGoalMl && (
              <Badge className="bg-cyan-100 text-cyan-700 border-cyan-200 text-xs">
                ✅ Meta atingida!
              </Badge>
            )}
          </div>
          <div className="h-2 rounded-full bg-cyan-100 dark:bg-cyan-900 overflow-hidden mb-3">
            <div
              className="h-full rounded-full bg-cyan-500 transition-all duration-500"
              style={{ width: `${Math.min((waterMl / waterGoalMl) * 100, 100)}%` }}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[200, 300, 500].map((ml) => (
              <button
                key={ml}
                onClick={() => {
                  setWaterMl((prev) => prev + ml);
                  toast.success(`+${ml}ml registrado! 💧`);
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-card border border-cyan-200
                  text-cyan-700 hover:bg-cyan-100 transition-colors"
              >
                +{ml} ml
              </button>
            ))}
          </div>
        </div>

        {/* ── Sono Check-in ── */}
        <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Moon className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-semibold text-foreground">Qualidade do Sono</h2>
            <Badge variant="outline" className="ml-auto text-xs border-indigo-300 text-indigo-600">
              +{SCORE_WEIGHTS.sleep} pts
            </Badge>
          </div>
          <button
            onClick={() => {
              setSleepChecked((prev) => {
                const next = !prev;
                toast.success(next ? "Sono registrado! 😴 +70 pts" : "Sono desmarcado");
                return next;
              });
            }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-200 text-left
              ${sleepChecked
                ? "bg-indigo-100 dark:bg-indigo-900/50 border-indigo-300"
                : "bg-card border-border hover:border-indigo-300"
              }`}
          >
            {sleepChecked ? (
              <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
            )}
            <span className={`flex-1 text-sm font-medium ${
              sleepChecked ? "text-indigo-700 dark:text-indigo-300" : "text-foreground"
            }`}>
              Dormi bem esta noite (7h+ de sono)
            </span>
          </button>
        </div>

        {/* ── Weight Chart ── */}
        <WeightChart data={data?.weightHistory ?? []} />

        {/* ── Ranking Top 3 ── */}
        <RankingTeaser />

        {/* ── Conquistas ── */}
        <div className="bg-card rounded-2xl border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <h2 className="text-sm font-semibold text-foreground">Conquistas</h2>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { label: "7 dias seguidos", unlocked: totalScore >= 500 },
              { label: "Primeira semana", unlocked: totalScore >= 300 },
              { label: "Bronze", unlocked: totalScore >= 500 },
              { label: "Prata", unlocked: totalScore >= 2000 },
              { label: "Ouro", unlocked: totalScore >= 5000 },
            ].map((badge) => (
              <Badge
                key={badge.label}
                variant={badge.unlocked ? "default" : "outline"}
                className={`text-xs ${
                  badge.unlocked
                    ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                    : "text-muted-foreground border-muted"
                }`}
              >
                {badge.unlocked ? "🏅 " : "🔒 "}
                {badge.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* ── Privacy toggle ── */}
        <div className="bg-card rounded-2xl border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">🕶️</span>
              <Label className="text-sm font-medium">Modo anônimo no ranking</Label>
            </div>
            <Switch checked={isAnonymous} onCheckedChange={handleAnonymousToggle} />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            Quando ativado, seu nome aparece como "Anônimo" no ranking.
          </p>
        </div>

        <div className="h-6" />
      </main>
    </div>
  );
}
