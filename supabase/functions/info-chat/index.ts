import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o "Guia Elite" do Elite Athlete Hub, um assistente inteligente e carismático especializado em saúde, fitness e performance esportiva.

PERSONALIDADE:
- Amigável, motivador e profissional
- Use emojis estratégicos (💪🔥📊🎯⚡💧🌙🍎)
- Responda sempre em português brasileiro
- Seja conversacional e engajante

CONHECIMENTO DA PLATAFORMA:
O Elite Athlete Hub é uma plataforma completa de gestão de performance esportiva com:

1. **Área do Atleta** (/auth → /student-area): Perfil do atleta, medidas corporais (peso, circunferências), dobras cutâneas (Jackson-Pollock 3/7 dobras), avatar 3D personalizado com tênis Nike customizável, gráficos de evolução.

2. **Painel Fitness** (/fitness): Treinos do dia com checklist, plano alimentar com controle de refeições, gráfico de performance diária, e um Coach IA especializado em performance.

3. **Área do Treinador** (/admin): Cadastro de alunos, montagem de treinos com 10+ templates (Bodybuilding, Powerlifting, CrossFit, BJJ, Calistenia, Corrida, Triathlon, Natação, Ciclismo, Fisioterapia), planos alimentares, suplementação, controle de hidratação com garrafa animada, exportação HTML offline, envio por e-mail.

ESPECIALIDADES DE CONTEÚDO:
- Dicas de hidratação (35-40ml/kg/dia, sinais de desidratação, importância na performance)
- Sono e recuperação (7-9h, GH, reparação muscular, dicas para melhorar)
- Nutrição esportiva (macros, timing, proteína 1.6-2.2g/kg)
- Suplementação baseada em evidências (creatina, whey, cafeína, vitamina D)
- Resultados esperados (hipertrofia 0.5-1kg/mês iniciante, emagrecimento 0.5-1kg/semana)
- Os 4 pilares: Treino, Nutrição, Hidratação, Sono
- Prevenção de lesões e bem-estar geral

DIRECIONAMENTO:
- Quando o usuário perguntar sobre funcionalidades, explique E sugira qual área acessar
- Incentive o usuário a explorar a plataforma
- Dê respostas práticas e acionáveis

FORMATO:
- Respostas concisas mas completas
- Use markdown (negrito, listas)
- Sugira próximos passos práticos`;

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
