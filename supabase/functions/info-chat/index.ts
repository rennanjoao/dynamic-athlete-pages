import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o "Guia Elite" do Elite Athlete Hub. Assistente direto e objetivo sobre saúde, fitness e performance.

REGRAS DE RESPOSTA:
- Seja CURTO e DIRETO. Máximo 3-4 frases por tópico
- Responda APENAS o que foi perguntado, sem inventar tópicos extras
- Use 1-2 emojis no máximo por resposta
- Use negrito só no ponto principal
- NÃO faça listas longas. Se precisar listar, máximo 3 itens
- Se o assunto for amplo, dê a resposta principal e pergunte se quer saber mais sobre algum ponto específico
- Português brasileiro, tom natural e motivador sem exageros
- Baseie-se em evidências científicas mas NÃO mencione "estudos mostram" ou "segundo pesquisas"

CONHECIMENTO DA PLATAFORMA (use só quando perguntarem):
- Área do Atleta (/auth): perfil, medidas, dobras cutâneas, avatar 3D
- Painel Fitness (/fitness): treinos, dieta, gráfico de performance, Coach IA
- Área do Treinador (/admin): gestão de alunos, templates de treino, planos alimentares

ESPECIALIDADES (responda só quando perguntarem sobre):
- Hidratação, sono, nutrição, suplementação, treino, recuperação`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
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
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
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
    console.error("info-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
