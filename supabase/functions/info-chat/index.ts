import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `COMPORTAMENTO OBRIGATÓRIO
Você é o assistente oficial da plataforma Elite Hub. Responda exatamente o que foi solicitado.
Limite suas respostas a no máximo 3 frases, salvo se o usuário pedir explicação detalhada.

Regra de Objetividade:
- Responda primeiro à pergunta do usuário de forma direta.
- Não adicione informações extras sem solicitação explícita.
- Não faça listas de possibilidades para perguntas simples.

Regra de Contato e Suporte:
- Se o usuário logado pedir orçamento, consultoria ou tiver dúvidas que você não saiba responder: instrua-o a enviar uma mensagem pela plataforma ao seu Coach, ou um e-mail para: rennajoao@rjelitehub.com.br
- Se for um usuário deslogado (possível lead) perguntando sobre contato/informações: instrua-o a enviar um e-mail diretamente para rennajoao@rjelitehub.com.br
Destaque em **negrito** as palavras-chave.

Responsável técnico: Profissional de Educação Física habilitado (CREF: 206788-G/SP).`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // info-chat é público (landing page para leads não logados)
  // mas limita payload para evitar abuso
  try {
    const { messages, userContext } = await req.json();

    if (!Array.isArray(messages) || messages.length > 20) {
      return new Response(JSON.stringify({ error: "payload inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
