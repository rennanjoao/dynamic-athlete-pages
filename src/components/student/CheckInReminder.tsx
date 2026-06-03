/**
 * CheckInReminder — Aviso discreto quando passaram 14+ dias desde
 * o último feedback do aluno (ou desde a anamnese, se nunca enviou).
 */

import { Link } from "react-router-dom";
import { useStudentData } from "@/hooks/useStudentData";
import { Clock, ArrowRight } from "lucide-react";

const REMINDER_DAYS = 14;

function daysBetween(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86_400_000);
}

export function CheckInReminder() {
  const { checkIns, anamnesis, loading } = useStudentData();
  if (loading) return null;

  const lastCheckin = checkIns?.[0]?.submitted_at ?? null;
  const lastAnamnesis = anamnesis?.submitted_at ?? anamnesis?.updated_at ?? null;

  const daysSinceCheckin = daysBetween(lastCheckin);
  const daysSinceAnamnesis = daysBetween(lastAnamnesis);

  // Sem anamnese ainda → não mostra (o aluno está no onboarding).
  if (daysSinceAnamnesis == null) return null;

  // Tem check-in → conta a partir do último.
  // Sem check-in ainda → conta a partir da anamnese.
  const referenceDays = daysSinceCheckin ?? daysSinceAnamnesis;
  if (referenceDays < REMINDER_DAYS) return null;

  const label = lastCheckin
    ? `Já se passaram ${referenceDays} dias desde seu último feedback.`
    : `Já se passaram ${referenceDays} dias desde sua anamnese — envie seu primeiro check-in.`;

  return (
    <Link
      to="/check-in"
      className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 hover:border-amber-500/60 hover:bg-amber-500/10 transition-colors"
    >
      <div className="w-9 h-9 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
        <Clock className="w-4 h-4 text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-200">{label}</p>
        <p className="text-xs text-amber-200/70">
          Atualize seu coach com um novo feedback para manter o protocolo calibrado.
        </p>
      </div>
      <ArrowRight className="w-4 h-4 text-amber-300 shrink-0" />
    </Link>
  );
}
