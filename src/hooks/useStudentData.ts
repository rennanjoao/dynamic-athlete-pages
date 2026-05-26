/**
 * useStudentData.ts
 * Fetch + Realtime das tabelas anamnesis, check_ins e protocols.
 * Aluno consome SEU próprio dado (RLS já filtra por auth.uid()).
 *
 * Coach/admin podem passar um studentId explicitamente.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Anamnesis {
  id: string;
  student_id: string;
  baseline_metrics: Record<string, number>;
  payload: Record<string, unknown>;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CheckIn {
  id: string;
  student_id: string;
  current_metrics: Record<string, number>;
  payload: Record<string, unknown>;
  coach_feedback: string | null;
  photo_url: string | null;
  submitted_at: string;
}

export interface Protocol {
  id: string;
  student_id: string;
  title: string;
  html_content: string;
  active: boolean;
  updated_at: string;
}

// Helper for tables that may not yet exist on the generated Database type
const sb = supabase as unknown as {
  from: (t: string) => ReturnType<typeof supabase.from>;
  channel: typeof supabase.channel;
  removeChannel: typeof supabase.removeChannel;
  auth: typeof supabase.auth;
};

export function useStudentData(explicitStudentId?: string) {
  const qc = useQueryClient();

  // Resolve effective studentId
  const { data: sessionUserId } = useQuery({
    queryKey: ["session-user-id"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session?.user?.id ?? null;
    },
    staleTime: 5 * 60_000,
  });

  const studentId = explicitStudentId ?? sessionUserId ?? null;

  const anamnesisQ = useQuery({
    queryKey: ["anamnesis", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await sb
        .from("anamnesis")
        .select("*")
        .eq("student_id", studentId!)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as Anamnesis) ?? null;
    },
  });

  const checkInsQ = useQuery({
    queryKey: ["check-ins", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await sb
        .from("check_ins")
        .select("*")
        .eq("student_id", studentId!)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as CheckIn[]) ?? [];
    },
  });

  const protocolQ = useQuery({
    queryKey: ["protocol", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await sb
        .from("protocols")
        .select("*")
        .eq("student_id", studentId!)
        .eq("active", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as Protocol) ?? null;
    },
  });

  // Realtime invalidation
  useEffect(() => {
    if (!studentId) return;
    const ch = sb
      .channel(`student-data-${studentId}`)
      .on("postgres_changes" as never, { event: "*", schema: "public", table: "anamnesis", filter: `student_id=eq.${studentId}` }, () => {
        qc.invalidateQueries({ queryKey: ["anamnesis", studentId] });
      })
      .on("postgres_changes" as never, { event: "*", schema: "public", table: "check_ins", filter: `student_id=eq.${studentId}` }, () => {
        qc.invalidateQueries({ queryKey: ["check-ins", studentId] });
      })
      .on("postgres_changes" as never, { event: "*", schema: "public", table: "protocols", filter: `student_id=eq.${studentId}` }, () => {
        qc.invalidateQueries({ queryKey: ["protocol", studentId] });
      })
      .subscribe();
    return () => {
      sb.removeChannel(ch);
    };
  }, [studentId, qc]);

  return {
    studentId,
    anamnesis: anamnesisQ.data ?? null,
    checkIns: checkInsQ.data ?? [],
    protocol: protocolQ.data ?? null,
    loading: anamnesisQ.isLoading || checkInsQ.isLoading || protocolQ.isLoading,
    error: anamnesisQ.error || checkInsQ.error || protocolQ.error,
  };
}
