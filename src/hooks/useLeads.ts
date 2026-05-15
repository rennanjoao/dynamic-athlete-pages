import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Lead {
  id: string;
  full_name: string;
  email: string | null;
  whatsapp: string | null;
  status: string;
  notes: string | null;
  source: string | null;
  created_at: string;
}

export function useLeads(coachId: string | null) {
  return useQuery({
    queryKey: ["coach-leads", coachId],
    queryFn: async (): Promise<Lead[]> => {
      if (!coachId) return [];
      const { data } = await supabase
        .from("coach_leads")
        .select("*")
        .eq("coach_id", coachId)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!coachId,
  });
}
