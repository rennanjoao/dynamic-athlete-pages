import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WorkoutProgress {
  id: string;
  workout_id: string;
  completed: boolean;
  completed_at: string | null;
}

interface DietProgress {
  id: string;
  meal_id: string;
  date: string;
  completed: boolean;
  completed_at: string | null;
}

interface PerformanceLog {
  date: string;
  workouts_completed: number;
  meals_completed: number;
  total_workouts: number;
  total_meals: number;
}

export const useFitnessProgress = (userId: string | undefined) => {
  const [workoutProgress, setWorkoutProgress] = useState<Record<string, boolean>>({});
  const [dietProgress, setDietProgress] = useState<Record<string, boolean>>({});
  const [performanceLogs, setPerformanceLogs] = useState<PerformanceLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchProgress();
  }, [userId]);

  const fetchProgress = async () => {
    if (!userId) return;

    try {
      // Fetch workout progress
      const { data: workoutData, error: workoutError } = await supabase
        .from("workout_progress")
        .select("*")
        .eq("user_id", userId);

      if (workoutError) throw workoutError;

      const workoutMap: Record<string, boolean> = {};
      workoutData?.forEach((item: WorkoutProgress) => {
        workoutMap[item.workout_id] = item.completed;
      });
      setWorkoutProgress(workoutMap);

      // Fetch today's diet progress
      const today = new Date().toISOString().split("T")[0];
      const { data: dietData, error: dietError } = await supabase
        .from("diet_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("date", today);

      if (dietError) throw dietError;

      const dietMap: Record<string, boolean> = {};
      dietData?.forEach((item: DietProgress) => {
        dietMap[item.meal_id] = item.completed;
      });
      setDietProgress(dietMap);

      // Fetch performance logs (last 14 days)
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const { data: perfData, error: perfError } = await supabase
        .from("performance_logs")
        .select("*")
        .eq("user_id", userId)
        .gte("date", twoWeeksAgo.toISOString().split("T")[0])
        .order("date", { ascending: true });

      if (perfError) throw perfError;

      setPerformanceLogs(perfData || []);
    } catch (error) {
      console.error("Error fetching progress:", error);
      toast.error("Erro ao carregar progresso");
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkout = async (workoutId: string) => {
    if (!userId) {
      toast.error("Usuário não autenticado");
      return;
    }

    const newStatus = !workoutProgress[workoutId];

    try {
      const { data: existing } = await supabase
        .from("workout_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("workout_id", workoutId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("workout_progress")
          .update({
            completed: newStatus,
            completed_at: newStatus ? new Date().toISOString() : null,
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("workout_progress").insert({
          user_id: userId,
          workout_id: workoutId,
          completed: newStatus,
          completed_at: newStatus ? new Date().toISOString() : null,
        });
      }

      setWorkoutProgress((prev) => ({ ...prev, [workoutId]: newStatus }));
      await updatePerformanceLog();
      toast.success(newStatus ? "Treino concluído!" : "Treino desmarcado");
    } catch (error) {
      console.error("Error toggling workout:", error);
      toast.error("Erro ao atualizar treino");
    }
  };

  const toggleDiet = async (mealId: string) => {
    if (!userId) {
      toast.error("Usuário não autenticado");
      return;
    }

    const newStatus = !dietProgress[mealId];
    const today = new Date().toISOString().split("T")[0];

    try {
      const { data: existing } = await supabase
        .from("diet_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("meal_id", mealId)
        .eq("date", today)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("diet_progress")
          .update({
            completed: newStatus,
            completed_at: newStatus ? new Date().toISOString() : null,
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("diet_progress").insert({
          user_id: userId,
          meal_id: mealId,
          date: today,
          completed: newStatus,
          completed_at: newStatus ? new Date().toISOString() : null,
        });
      }

      setDietProgress((prev) => ({ ...prev, [mealId]: newStatus }));
      await updatePerformanceLog();
      toast.success(newStatus ? "Refeição concluída!" : "Refeição desmarcada");
    } catch (error) {
      console.error("Error toggling diet:", error);
      toast.error("Erro ao atualizar refeição");
    }
  };

  const updatePerformanceLog = async () => {
    if (!userId) return;

    const today = new Date().toISOString().split("T")[0];

    try {
      // Count today's completions
      const { data: workoutsToday } = await supabase
        .from("workout_progress")
        .select("completed")
        .eq("user_id", userId);

      const { data: mealsToday } = await supabase
        .from("diet_progress")
        .select("completed")
        .eq("user_id", userId)
        .eq("date", today);

      const workoutsCompleted = workoutsToday?.filter((w) => w.completed).length || 0;
      const totalWorkouts = workoutsToday?.length || 0;
      const mealsCompleted = mealsToday?.filter((m) => m.completed).length || 0;
      const totalMeals = mealsToday?.length || 0;

      // Upsert performance log
      await supabase.from("performance_logs").upsert(
        {
          user_id: userId,
          date: today,
          workouts_completed: workoutsCompleted,
          meals_completed: mealsCompleted,
          total_workouts: totalWorkouts,
          total_meals: totalMeals,
        },
        { onConflict: "user_id,date" }
      );

      // Refresh performance logs
      await fetchProgress();
    } catch (error) {
      console.error("Error updating performance log:", error);
    }
  };

  return {
    workoutProgress,
    dietProgress,
    performanceLogs,
    loading,
    toggleWorkout,
    toggleDiet,
    refetch: fetchProgress,
  };
};
