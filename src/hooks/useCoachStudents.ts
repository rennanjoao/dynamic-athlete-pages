import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AlertLevel = "critical" | "warning" | "ok";

export interface StudentStatus {
  id: string;
  name: string;
  email: string;
  lastWorkout: string | null;
  lastMeal: string | null;
  alertLevel: AlertLevel;
  daysInactive: number;
  goal: string;
  currentWeight: number | null;
  targetWeight: number | null;
}

function daysSince(dateStr: string | null): number {
  if (!dateStr) return 999;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function getAlertLevel(lastWorkout: string | null, lastMeal: string | null): AlertLevel {
  const days = daysSince(lastWorkout ?? lastMeal);
  if (days >= 3) return "critical";
  if (days >= 1) return "warning";
  return "ok";
}

export function useCoachStudents(coachId: string | null) {
  return useQuery({
    queryKey: ["coach-students", coachId],
    queryFn: async (): Promise<StudentStatus[]> => {
      if (!coachId) return [];

      const { data: links } = await supabase
        .from("coach_students")
        .select("student_id")
        .eq("coach_id", coachId)
        .eq("status", "active");

      if (!links || links.length === 0) return [];
      const studentIds = links.map((l) => l.student_id);

      const { data: profiles } = await supabase
        .from("student_profiles")
        .select("user_id, full_name")
        .in("user_id", studentIds);

      const students: StudentStatus[] = [];
      for (const sid of studentIds) {
        const profile = profiles?.find((p) => p.user_id === sid);

        const { data: lastW } = await supabase
          .from("workout_progress")
          .select("completed_at")
          .eq("user_id", sid)
          .eq("completed", true)
          .order("completed_at", { ascending: false })
          .limit(1);

        const { data: lastD } = await supabase
          .from("diet_progress")
          .select("completed_at")
          .eq("user_id", sid)
          .eq("completed", true)
          .order("completed_at", { ascending: false })
          .limit(1);

        const { data: plan } = await supabase
          .from("coach_plans")
          .select("goal")
          .eq("student_id", sid)
          .eq("coach_id", coachId)
          .limit(1);

        const { data: bm } = await supabase
          .from("body_measurements")
          .select("weight")
          .eq("user_id", sid)
          .order("measurement_date", { ascending: false })
          .limit(1);

        const lastWorkout = lastW?.[0]?.completed_at || null;
        const lastMeal = lastD?.[0]?.completed_at || null;

        students.push({
          id: sid,
          name: profile?.full_name || "Aluno",
          email: "",
          lastWorkout,
          lastMeal,
          alertLevel: getAlertLevel(lastWorkout, lastMeal),
          daysInactive: daysSince(lastWorkout ?? lastMeal),
          goal: plan?.[0]?.goal || "—",
          currentWeight: bm?.[0]?.weight ? Number(bm[0].weight) : null,
          targetWeight: null,
        });
      }

      return students.sort((a, b) => {
        const order: Record<AlertLevel, number> = { critical: 0, warning: 1, ok: 2 };
        return order[a.alertLevel] - order[b.alertLevel];
      });
    },
    enabled: !!coachId,
    refetchInterval: 60_000,
  });
}
