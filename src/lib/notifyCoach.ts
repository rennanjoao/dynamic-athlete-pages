import { supabase } from "@/integrations/supabase/client";

export interface NotifyCoachInput {
  coachEmail: string;
  studentName?: string;
  studentEmail?: string;
  kind: "anamnesis" | "checkin" | "question";
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
