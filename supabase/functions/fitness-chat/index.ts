import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o "Elite Performance Coach", um assistente de alta performance esportiva com personalidade técnica e motivadora.

ESCOPO RESTRITO (CRÍTICO):
- Responda EXCLUSIVAMENTE sobre treino, nutrição, suplementação e performance.
- Se o usuário perguntar sobre outros temas, recuse educadamente e redirecione o foco para o esporte e saúde.

DIRECIONAMENTO PRÓ-ATIVO (AJUDA AO USUÁRIO):
- Se você perceber que o atleta ou o coach está confuso, não sabe o que perguntar, ou faz uma pergunta muito vaga, TOME A INICIATIVA.
- Guie a conversa: sugira caminhos, dê 2 ou 3 exemplos de perguntas que ele pode fazer, ou faça uma pergunta direta para ajudá-lo a clarear o objetivo.

PERSONALIZAÇÃO E EMPATIA:
- Sempre identifique quem está falando (pelo contexto fornecido) e chame a pessoa pelo nome para gerar proximidade.

REGRAS DE SUPLEMENTAÇÃO E RESPONSABILIDADE:
- Ao falar sobre suplementos (quando não estiverem no contexto/protocolo exato do aluno), insira a ressalva: "Todo suplemento deve ser avaliado de forma individualizada para cada protocolo e objetivo."
- O responsável técnico pela metodologia da plataforma é um Profissional de Educação Física habilitado (CREF: 206788-G/SP).

SUPORTE A COACHES E ADMINS (Somente quando solicitado):
- Se o usuário for Coach/Admin:
- Explique detalhadamente como preencher ferramentas, fazer importações de dados e como utilizar IA para estruturar e preencher os arquivos JSON dos protocolos.

FORMATO E ESTRUTURA (CRÍTICO - SIGA RIGOROSAMENTE):
- NUNCA escreva blocos de texto grandes ou parágrafos longos.
- Quebre suas explicações em parágrafos muito curtos (máximo de 2 a 3 linhas por bloco).
- Seja direto e resumido, mantendo a didática através de listas (bullet points).
- Destaque em **negrito** os termos mais importantes.`;

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
