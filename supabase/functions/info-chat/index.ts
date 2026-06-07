import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o assistente oficial da plataforma Elite Hub.
Responda de forma direta, objetiva e em no máximo 3 frases, salvo pedido de detalhe.
Para orçamento ou dúvidas sem resposta indique o e-mail rennanjoao@rjelitehub.com.br.
Responsável técnico: CREF 206788-G/SP.`;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY ausente" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body?.messages) ? body.messages : null;
    if (!messages) {
      return new Response(JSON.stringify({ error: "payload inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let systemContent = SYSTEM_PROMPT;
    if (body.userContext) {
      systemContent += `\n\nDADOS DO USUÁRIO:\n${JSON.stringify(body.userContext, null, 2)}`;
    }

    const anthropicMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content ?? ""),
    }));

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        system: systemContent,
        messages: anthropicMessages,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return new Response(
        JSON.stringify({ error: err?.error?.message ?? "Erro na IA" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const json = await response.json();
    const text =
      Array.isArray(json?.content)
        ? json.content.map((p: { type: string; text?: string }) => (p.type === "text" ? p.text ?? "" : "")).join("")
        : "";

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
