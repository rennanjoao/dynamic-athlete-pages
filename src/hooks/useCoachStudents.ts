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
  // legados (mantidos para compatibilidade com colunas existentes)
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

/**
 * Regra de alerta (anamnese ou feedback):
 *   < 3 dias  → ok
 *   3–5 dias  → warning (atenção)
 *   ≥ 6 dias  → critical
 */
function getAlertLevel(lastAnamnesis: string | null, lastFeedback: string | null): AlertLevel {
  const a = daysSince(lastAnamnesis);
  const f = daysSince(lastFeedback);
  const d = Math.min(a, f);
  if (d >= 6) return "critical";
  if (d >= 3) return "warning";
  return "ok";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb: any = supabase;

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

      // Buscar nomes em student_profiles e profiles (fallback)
      const [{ data: sProfiles }, { data: profiles }] = await Promise.all([
        sb.from("student_profiles").select("user_id, full_name").in("user_id", studentIds),
        sb.from("profiles").select("user_id, full_name, email").in("user_id", studentIds),
      ]);

      const students: StudentStatus[] = [];
      for (const sid of studentIds) {
        const sp = sProfiles?.find((p: any) => p.user_id === sid);
        const pp = profiles?.find((p: any) => p.user_id === sid);

        // Anamnese mais recente
        const { data: ana } = await sb
          .from("anamnesis")
          .select("submitted_at, updated_at, payload")
          .eq("student_id", sid)
          .order("updated_at", { ascending: false })
          .limit(1);

        // Último check-in/feedback
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

        // Resolve nome: student_profiles > profiles > payload anamnese > email > "Aluno"
        const anaName = (ana?.[0]?.payload as Record<string, unknown> | undefined)?.nome as string | undefined;
        const name =
          sp?.full_name ||
          pp?.full_name ||
          anaName ||
          (pp?.email ? pp.email.split("@")[0] : "") ||
          `Aluno ${sid.slice(0, 6)}`;

        const daysInactive = Math.min(daysSince(lastAnamnesis), daysSince(lastFeedback));

        students.push({
          id: sid,
          name,
          email: pp?.email || "",
          lastAnamnesis,
          lastFeedback,
          lastWorkout: null,
          lastMeal: null,
          alertLevel: getAlertLevel(lastAnamnesis, lastFeedback),
          daysInactive,
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
