import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface StudentProfile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  gender: "male" | "female";
  height: number | null;
  birth_date: string | null;
}

export interface AvatarCustomization {
  skin_color: string;
  eye_color: string;
  hair_color: string;
  hair_style: string;
  clothing_color: string;
  nail_color: string | null;
  shoe_color: string;
  shoe_accent_color: string;
  water_bottle_color: string;
}

export const useStudentProfile = () => {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [customization, setCustomization] = useState<AvatarCustomization | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData, error: profileError } = await supabase
        .from("student_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profileData) {
        setProfile({
          ...profileData,
          gender: profileData.gender as "male" | "female"
        });
      }

      const { data: customData, error: customError } = await supabase
        .from("avatar_customization")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (customError && customError.code !== 'PGRST116') throw customError;

      setCustomization(customData);
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast.error("Erro ao carregar perfil");
    } finally {
      setLoading(false);
    }
  };

  const createOrUpdateProfile = async (profileData: Partial<StudentProfile>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("student_profiles")
        .upsert([{
          user_id: user.id,
          full_name: profileData.full_name || "",
          avatar_url: profileData.avatar_url || null,
          gender: profileData.gender || "male",
          height: profileData.height || null,
          birth_date: profileData.birth_date || null,
        }]);

      if (error) throw error;

      toast.success("Perfil atualizado com sucesso!");
      fetchProfile();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Erro ao atualizar perfil");
    }
  };

  const updateCustomization = async (customData: Partial<AvatarCustomization>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("avatar_customization")
        .upsert([{
          user_id: user.id,
          ...customData,
        }]);

      if (error) throw error;

      toast.success("Avatar personalizado!");
      fetchProfile();
    } catch (error: any) {
      console.error("Error updating customization:", error);
      toast.error("Erro ao personalizar avatar");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    customization,
    loading,
    createOrUpdateProfile,
    updateCustomization,
    refetch: fetchProfile,
  };
};
