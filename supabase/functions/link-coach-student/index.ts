/**
 * link-coach-student — vincula o aluno autenticado a um coach.
 * Usa a service_role para contornar a RLS de coach_students,
 * que só permite INSERT pelo próprio coach.
 *
 * Body: { coachId: string }
 * Header: Authorization: Bearer <access_token do aluno>
 */

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const { coachId } = await req.json();
    if (!coachId || typeof coachId !== "string") {
      return new Response(JSON.stringify({ error: "coachId obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(JSON.stringify({ error: "não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "sessão inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const studentId = userData.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Garante apenas um coach ativo por aluno.
    await admin
      .from("coach_students")
      .update({ status: "inactive", updated_at: new Date().toISOString() })
      .eq("student_id", studentId)
      .eq("status", "active")
      .neq("coach_id", coachId);

    const { error: upsertErr } = await admin
      .from("coach_students")
      .upsert(
        { coach_id: coachId, student_id: studentId, status: "active" },
        { onConflict: "coach_id,student_id" }
      );
    if (upsertErr) {
      console.error("upsert error", upsertErr);
      return new Response(JSON.stringify({ error: upsertErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
