import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check admin role
    const { data: isAdmin } = await adminClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Acesso negado");

    const { action, email, password, fullName, trainerId } = await req.json();

    if (action === "list") {
      // Get all users with 'user' role that were created by admin (trainers)
      // For now, list all non-admin users from profiles
      const { data: roles } = await adminClient
        .from("user_roles")
        .select("user_id")
        .eq("role", "user");

      const userIds = roles?.map((r: any) => r.user_id) || [];
      
      // Filter out the admin themselves
      const trainerIds = userIds.filter((id: string) => id !== user.id);

      const trainers = [];
      for (const id of trainerIds) {
        const { data: { user: trainerUser } } = await adminClient.auth.admin.getUserById(id);
        if (trainerUser) {
          const { data: profile } = await adminClient
            .from("profiles")
            .select("full_name")
            .eq("user_id", id)
            .single();

          trainers.push({
            id: trainerUser.id,
            email: trainerUser.email,
            full_name: profile?.full_name || null,
            created_at: trainerUser.created_at,
          });
        }
      }

      return new Response(JSON.stringify({ trainers }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create") {
      if (!email || !password || !fullName) {
        throw new Error("Email, senha e nome são obrigatórios");
      }

      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

      if (createError) throw createError;

      return new Response(JSON.stringify({ success: true, userId: newUser.user.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      if (!trainerId) throw new Error("ID do treinador é obrigatório");

      // Don't allow deleting yourself
      if (trainerId === user.id) throw new Error("Não é possível remover a si mesmo");

      const { error } = await adminClient.auth.admin.deleteUser(trainerId);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Ação inválida");
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
