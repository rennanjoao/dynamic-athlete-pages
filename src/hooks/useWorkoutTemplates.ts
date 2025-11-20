import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WorkoutTemplate {
  id: string;
  name: string;
  description: string | null;
  level: string;
  treinos: Record<string, Array<{
    exercicio: string;
    series: string;
    descanso: string;
    observacao: string;
  }>>;
}

export const useWorkoutTemplates = () => {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("workout_templates")
        .select("*")
        .order("name");

      if (error) throw error;

      setTemplates((data || []) as unknown as WorkoutTemplate[]);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Erro ao carregar templates de treino");
    } finally {
      setLoading(false);
    }
  };

  return { templates, loading, refetch: fetchTemplates };
};
