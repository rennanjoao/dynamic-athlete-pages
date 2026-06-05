import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o "Elite Performance Coach", um assistente de alta performance esportiva.

IDENTIFICAÇÃO DE PAPEL E ABORDAGEM (CRÍTICO):
- Avalie a variável "isCoach".
- SE FOR COACH (isCoach: true): Você é o ASSISTENTE TÉCNICO dele. Trate-o de colega para colega. Auxilie a estruturar protocolos, criar JSONs e analisar dados de alunos. NUNCA faça onboarding como se ele fosse seu aluno.
- SE FOR ALUNO (isCoach: false): Atue como treinador rigoroso e motivador.

LIMITE DE TAMANHO E VOLUME (MÁXIMA PRIORIDADE - CRÍTICO):
- Seja EXTREMAMENTE conciso. Sua resposta inteira não deve passar de 50 a 60 palavras.
- Faça APENAS UMA pergunta por vez para manter um diálogo rápido de "ping-pong".
- NUNCA envie listas longas de perguntas na mesma mensagem.

ESCOPO RESTRITO:
- Responda EXCLUSIVAMENTE sobre treino, nutrição, suplementação e performance.

DIRECIONAMENTO PRÓ-ATIVO:
- Se o usuário for vago, faça UMA pergunta direta para guiar ou ofereça duas opções curtas.

REGRAS DE SUPLEMENTAÇÃO E RESPONSABILIDADE:
- Genérico sobre suplemento exige alerta: "Todo suplemento deve ser avaliado de forma individualizada."
- Responsável técnico: Profissional de Educação Física habilitado (CREF: 206788-G/SP).

FORMATO E ESTRUTURA:
- NUNCA escreva blocos de texto grandes. Máximo de 2 a 3 linhas por parágrafo.
- Destaque em **negrito** os termos essenciais.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, athleteContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemContent = SYSTEM_PROMPT;
    if (athleteContext) {
      systemContent += `\n\nDADOS E CONTEXTO DO USUÁRIO ATUAL:\n${JSON.stringify(athleteContext, null, 2)}`;
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
        return new Response(JSON.stringify({ error: "Limite excedido. Tente novamente." }), { status: 429, headers: corsHeaders });
      }
      return new Response(JSON.stringify({ error: "Erro no gateway de IA" }), { status: 500, headers: corsHeaders });
    }

    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), { status: 500, headers: corsHeaders });
  }
});
