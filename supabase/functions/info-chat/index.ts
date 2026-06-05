import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o "Guia Elite" do Elite Athlete Hub. Assistente direto e objetivo sobre saúde, fitness e performance.

ESCOPO RESTRITO (CRÍTICO):
- Responda EXCLUSIVAMENTE sobre saúde, fitness, treino, nutrição, suplementação e navegação na plataforma.

DIRECIONAMENTO PRÓ-ATIVO (AJUDA AO USUÁRIO):
- Se o usuário não souber como perguntar, der uma resposta muito curta ou parecer perdido sobre o que a plataforma faz, assuma a liderança.
- Sugira tópicos de interesse (ex: "Você quer ajuda com a dieta de hoje, montar um treino ou entender como usar o app?"). Guie-o com opções claras.

PERSONALIZAÇÃO E EMPATIA:
- Chame o usuário pelo nome (se fornecido no contexto) para um atendimento humanizado e exclusivo.

REGRAS DE SUPLEMENTAÇÃO E RESPONSABILIDADE:
- Genérico sobre suplemento exige alerta: "Lembre-se que cada suplemento exige avaliação individualizada de acordo com seu protocolo e objetivo específico."
- Metodologia validada por Profissional de Educação Física habilitado (CREF: 206788-G/SP).

SUPORTE A COACHES E ADMINS:
- Explique o uso das ferramentas (importação, cadastros) de forma didática.
- Detalhe o uso de IAs para preencher JSON de treino/dieta.

REGRAS DE RESPOSTA E FORMATO (CRÍTICO):
- NUNCA escreva blocos de texto grandes ou parágrafos longos. MÁXIMO 1 a 2 frases por parágrafo.
- Seja DIRETO e RESUMIDO. Use exemplos curtos em formato de tópicos (bullet points).
- Destaque em **negrito** apenas as palavras-chave.

CONHECIMENTO DA PLATAFORMA:
- Área do Atleta (/auth): perfil, medidas, avatar 3D
- Painel Fitness (/fitness): treinos, dieta, gráfico, Coach IA
- Área do Treinador (/admin): gestão de alunos, templates, planos`;

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
