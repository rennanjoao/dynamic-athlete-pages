/**
 * notifyCoach — Wrapper client-side para a edge function notify-coach.
 * Envia email ao coach via Resend (sem depender de Web3Forms Pro).
 * Tolerante a falha: nunca lança — apenas registra erro.
 */

import { supabase } from "@/integrations/supabase/client";

export interface NotifyCoachInput {
  coachEmail: string;
  studentName?: string;
  studentEmail?: string;
  kind: "anamnesis" | "checkin";
  subject?: string;
  summary?: string;
  data?: Record<string, unknown>;
  photos?: Record<string, string>;
}

export async function notifyCoach(input: NotifyCoachInput): Promise<boolean> {
  if (!input.coachEmail) return false;
  try {
    const { data, error } = await supabase.functions.invoke("notify-coach", {
      body: input,
    });
    if (error) {
      console.error("notify-coach error", error);
      return false;
    }
    return Boolean((data as { ok?: boolean })?.ok);
  } catch (e) {
    console.error("notify-coach exception", e);
    return false;
  }
}
