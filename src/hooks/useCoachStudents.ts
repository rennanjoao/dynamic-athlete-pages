import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AlertLevel = "critical" | "warning" | "ok";

export interface StudentStatus {
  id: string;
  name: string;
  email: string;
  lastFeedback: string | null;
  lastAnamnesis: string | null;
  alertLevel: AlertLevel;
  daysInactive: number;
  daysSinceLastFeedback: number;
  lastWorkout: string | null;
  lastMeal: string | null;
  goal: string;
  currentWeight: number | null;
  targetWeight: number | null;
}

function daysSince(dateStr: string | null): number {
  if (!dateStr) return 999;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function getAlertLevel(
  lastAnamnesis: string | null,
  lastFeedback: string | null,
  feedbackIntervalDays: number
): AlertLevel {
  const d = Math.min(daysSince(lastAnamnesis), daysSince(lastFeedback));
  if (d >= feedbackIntervalDays) return "critical";
  if (d >= Math.floor(feedbackIntervalDays * 0.6)) return "warning";
  return "ok";
}

export function useCoachStudents(coachId: string | null, feedbackIntervalDays = 7) {
  return useQuery({
    queryKey: ["coach-students", coachId, feedbackIntervalDays],
    queryFn: async (): Promise<StudentStatus[]> => {
      if (!coachId) return [];

      const { data: links } = await supabase
        .from("coach_students")
        .select("student_id")
        .eq("coach_id", coachId)
        .eq("status", "active");

      if (!links || links.length === 0) return [];
      const studentIds = links.map((l) => l.student_id);

      // Todas as queries em paralelo — sem N+1
      const [
        { data: sProfiles },
        { data: profiles },
        { data: allAna },
        { data: allCi },
        { data: allPlans },
        { data: allBm },
      ] = await Promise.all([
        supabase
          .from("student_profiles")
          .select("user_id, full_name")
          .in("user_id", studentIds),
        supabase
          .from("profiles")
          .select("user_id, full_name, email")
          .in("user_id", studentIds),
        supabase
          .from("anamnesis")
          .select("student_id, submitted_at, updated_at, payload")
          .in("student_id", studentIds)
          .order("updated_at", { ascending: false }),
        supabase
          .from("check_ins")
          .select("student_id, submitted_at")
          .in("student_id", studentIds)
          .order("submitted_at", { ascending: false }),
        supabase
          .from("coach_plans")
          .select("student_id, goal")
          .in("student_id", studentIds)
          .eq("coach_id", coachId),
        supabase
          .from("body_measurements")
          .select("user_id, weight, measurement_date")
          .in("user_id", studentIds)
          .order("measurement_date", { ascending: false }),
      ]);

      // Índices em memória para lookup O(1)
      const anaByStudent = new Map<string, typeof allAna extends (infer T)[] | null ? T : never>();
      allAna?.forEach((a) => { if (!anaByStudent.has(a.student_id)) anaByStudent.set(a.student_id, a); });

      const ciByStudent = new Map<string, typeof allCi extends (infer T)[] | null ? T : never>();
      allCi?.forEach((c) => { if (!ciByStudent.has(c.student_id)) ciByStudent.set(c.student_id, c); });

      const planByStudent = new Map<string, typeof allPlans extends (infer T)[] | null ? T : never>();
      allPlans?.forEach((p) => { if (!planByStudent.has(p.student_id)) planByStudent.set(p.student_id, p); });

      const bmByStudent = new Map<string, typeof allBm extends (infer T)[] | null ? T : never>();
      allBm?.forEach((b) => { if (!bmByStudent.has(b.user_id)) bmByStudent.set(b.user_id, b); });

      const students: StudentStatus[] = studentIds.map((sid) => {
        const sp = sProfiles?.find((p) => p.user_id === sid);
        const pp = profiles?.find((p) => p.user_id === sid);
        const ana = anaByStudent.get(sid);
        const ci = ciByStudent.get(sid);
        const plan = planByStudent.get(sid);
        const bm = bmByStudent.get(sid);

        const lastAnamnesis = ana?.submitted_at || ana?.updated_at || null;
        const lastFeedback = ci?.submitted_at || null;
        const anaName = (ana?.payload as Record<string, unknown> | undefined)?.nome as string | undefined;

        const name =
          sp?.full_name ||
          pp?.full_name ||
          anaName ||
          (pp?.email ? pp.email.split("@")[0] : "") ||
          `Aluno ${sid.slice(0, 6)}`;

        return {
          id: sid,
          name,
          email: pp?.email || "",
          lastAnamnesis,
          lastFeedback,
          lastWorkout: null,
          lastMeal: null,
          alertLevel: getAlertLevel(lastAnamnesis, lastFeedback, feedbackIntervalDays),
          daysInactive: Math.min(daysSince(lastAnamnesis), daysSince(lastFeedback)),
          daysSinceLastFeedback: daysSince(lastFeedback),
          goal: plan?.goal || "—",
          currentWeight: bm?.weight ? Number(bm.weight) : null,
          targetWeight: null,
        };
      });

      return students.sort((a, b) => {
        const order: Record<AlertLevel, number> = { critical: 0, warning: 1, ok: 2 };
        return order[a.alertLevel] - order[b.alertLevel];
      });
    },
    enabled: !!coachId,
    refetchInterval: 60_000,
  });
}
