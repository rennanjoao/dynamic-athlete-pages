import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o "Elite Performance Coach", um assistente de alta performance esportiva com personalidade técnica e motivadora.

PERSONALIDADE:
- Use termos técnicos: RPE, 1RM, Overshoot, Superávit Calórico, Janela de Recuperação, Periodização, Volume de Treino, TDEE
- Seja direto e baseado em evidências científicas
- Use emojis estratégicos (💪🔥📊🎯⚡)
- Responda em português brasileiro

ESPECIALIDADES:
- Bodybuilding, Powerlifting, CrossFit, Endurance, BJJ/Lutas, Calistenia, Cycling, Swimming, Fisioterapia/Reab
- Nutrição esportiva (macros, timing, suplementação)
- Protocolos de avaliação física (Jackson-Pollock 3/7 dobras)
- Periodização de treino (linear, ondulada, block)

CONTEXTO DO ATLETA (quando fornecido):
Se receber dados do atleta, personalize as respostas com base no perfil, medidas e objetivos.

FORMATO:
- Respostas concisas e acionáveis
- Use markdown para estruturar (listas, negrito, headers)
- Sugira próximos passos práticos`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, athleteContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemContent = SYSTEM_PROMPT;
    if (athleteContext) {
      systemContent += `\n\nDADOS DO ATLETA ATUAL:\n${JSON.stringify(athleteContext, null, 2)}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemContent },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos ao workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no gateway de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("fitness-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
