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
  daysSinceLastFeedback: number; // FIX: contador de dias desde o último feedback
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

function getAlertLevel(lastAnamnesis: string | null, lastFeedback: string | null, feedbackIntervalDays: number): AlertLevel {
  const a = daysSince(lastAnamnesis);
  const f = daysSince(lastFeedback);
  const d = Math.min(a, f);
  if (d >= feedbackIntervalDays) return "critical";
  if (d >= Math.floor(feedbackIntervalDays * 0.6)) return "warning";
  return "ok";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb: any = supabase;

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

      const [{ data: sProfiles }, { data: profiles }] = await Promise.all([
        sb.from("student_profiles").select("user_id, full_name").in("user_id", studentIds),
        sb.from("profiles").select("user_id, full_name, email").in("user_id", studentIds),
      ]);

      const students: StudentStatus[] = [];
      for (const sid of studentIds) {
        const sp = sProfiles?.find((p: any) => p.user_id === sid);
        const pp = profiles?.find((p: any) => p.user_id === sid);

        const { data: ana } = await sb
          .from("anamnesis")
          .select("submitted_at, updated_at, payload")
          .eq("student_id", sid)
          .order("updated_at", { ascending: false })
          .limit(1);

        const { data: ci } = await sb
          .from("check_ins")
          .select("submitted_at")
          .eq("student_id", sid)
          .order("submitted_at", { ascending: false })
          .limit(1);

        const { data: plan } = await sb
          .from("coach_plans")
          .select("goal")
          .eq("student_id", sid)
          .eq("coach_id", coachId)
          .limit(1);

        const { data: bm } = await sb
          .from("body_measurements")
          .select("weight")
          .eq("user_id", sid)
          .order("measurement_date", { ascending: false })
          .limit(1);

        const lastAnamnesis = ana?.[0]?.submitted_at || ana?.[0]?.updated_at || null;
        const lastFeedback = ci?.[0]?.submitted_at || null;

        const anaName = (ana?.[0]?.payload as Record<string, unknown> | undefined)?.nome as string | undefined;
        const name =
          sp?.full_name ||
          pp?.full_name ||
          anaName ||
          (pp?.email ? pp.email.split("@")[0] : "") ||
          `Aluno ${sid.slice(0, 6)}`;

        const daysInactive = Math.min(daysSince(lastAnamnesis), daysSince(lastFeedback));
        // FIX: conta dias desde o último feedback especificamente
        const daysSinceLastFeedback = daysSince(lastFeedback);

        students.push({
          id: sid,
          name,
          email: pp?.email || "",
          lastAnamnesis,
          lastFeedback,
          lastWorkout: null,
          lastMeal: null,
          alertLevel: getAlertLevel(lastAnamnesis, lastFeedback, feedbackIntervalDays),
          daysInactive,
          daysSinceLastFeedback,
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
