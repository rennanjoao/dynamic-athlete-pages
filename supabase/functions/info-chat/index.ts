import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o "Guia Elite" do Elite Athlete Hub. Assistente direto e objetivo sobre saúde, fitness e performance.

LIMITE DE TAMANHO E VOLUME (MÁXIMA PRIORIDADE - CRÍTICO):
- Seja EXTREMAMENTE conciso. Sua resposta inteira não deve passar de 50 a 60 palavras.
- Faça APENAS UMA pergunta por vez para manter a fluidez do bate-papo. Não empilhe perguntas.
- O diálogo deve ser dinâmico. Fale pouco para o usuário interagir mais.

ESCOPO RESTRITO (CRÍTICO):
- Responda EXCLUSIVAMENTE sobre saúde, fitness, treino, nutrição, suplementação e navegação na plataforma.

DIRECIONAMENTO PRÓ-ATIVO:
- Se o usuário parecer perdido, sugira rapidamente 2 opções de ajuda.

REGRAS DE SUPLEMENTAÇÃO E RESPONSABILIDADE:
- Assunto suplemento genérico exige alerta: "Cada suplemento exige avaliação individualizada."
- Metodologia validada por Profissional de Educação Física habilitado (CREF: 206788-G/SP).

SUPORTE A COACHES E ADMINS:
- Ajude com o uso de ferramentas da plataforma e IAs para formatar JSON de protocolos, sempre de forma muito resumida.

REGRAS DE RESPOSTA E FORMATO:
- NUNCA escreva blocos de texto grandes. MÁXIMO 1 a 2 frases por parágrafo.
- Destaque em **negrito** as palavras-chave.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, userContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemContent = SYSTEM_PROMPT;
    if (userContext) {
      systemContent += `\n\nDADOS DO USUÁRIO ATUAL:\n${JSON.stringify(userContext, null, 2)}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemContent }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: "Erro na IA" }), { status: response.status, headers: corsHeaders });
    }

    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), { status: 500, headers: corsHeaders });
  }
});
