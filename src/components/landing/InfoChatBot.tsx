import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageCircle, X, Send, Brain, Zap,
  Droplets, Moon, TrendingUp, Heart,
  Users, Activity, Dumbbell
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/info-chat`;

const QUICK_ACTIONS = [
  { label: "O que posso fazer aqui?", prompt: "O que posso fazer nesta plataforma? Me explique todas as funcionalidades.", icon: Zap },
  { label: "Dicas de Hidratação", prompt: "Me dê dicas completas sobre hidratação e por que ela é importante para performance.", icon: Droplets },
  { label: "Importância do Sono", prompt: "Explique a importância do sono para resultados na academia e saúde.", icon: Moon },
  { label: "Resultados Esperados", prompt: "Quais resultados posso esperar com treino e dieta bem feitos?", icon: TrendingUp },
  { label: "Saúde & Performance", prompt: "Quais são os pilares da saúde e alta performance esportiva?", icon: Heart },
];

const NAV_LINKS = [
  { label: "Área do Atleta", path: "/auth", icon: Users, description: "Perfil, medidas e avatar 3D" },
  { label: "Painel Fitness", path: "/fitness", icon: Activity, description: "Treinos, dieta e performance" },
  { label: "Área do Treinador", path: "/admin-login", icon: Dumbbell, description: "Gestão de alunos e planos" },
];

const INITIAL_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: "Olá! 👋 Sou o **Guia Elite** da plataforma. Posso te contar tudo sobre o que fazemos aqui, dar dicas de **saúde, hidratação, sono e nutrição**, e te direcionar para a área certa!\n\nUse os atalhos abaixo ou me pergunte qualquer coisa! 🚀",
};

export const InfoChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (allMessages: { role: string; content: string }[]) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: allMessages }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: "Erro de conexão" }));
      if (resp.status === 429) toast.error("Limite de requisições excedido. Aguarde.");
      else if (resp.status === 402) toast.error("Créditos de IA esgotados.");
      else toast.error(err.error || "Erro ao conectar com IA");
      throw new Error(err.error);
    }

    if (!resp.body) throw new Error("No stream body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantSoFar = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") { streamDone = true; break; }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantSoFar += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant" && last.id !== "welcome") {
                return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
              }
              return [...prev, { id: Date.now().toString(), role: "assistant", content: assistantSoFar }];
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }
  };

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: msg };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    const history = [...messages.filter(m => m.id !== "welcome"), userMsg].map(m => ({
      role: m.role, content: m.content,
    }));

    try {
      await streamChat(history);
    } catch {
      // error already toasted
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="w-14 h-14 rounded-full glow-primary shadow-2xl animate-glow-pulse"
              size="icon"
            >
              <MessageCircle className="w-6 h-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-3rem)] h-[600px] flex flex-col glass-strong rounded-2xl overflow-hidden shadow-2xl border border-border/20"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/20 bg-card/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center glow-primary">
                  <Brain className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">Guia Elite AI</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online • IA Ativa
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-xl w-8 h-8">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "gradient-primary text-primary-foreground rounded-br-md"
                        : "bg-secondary/60 text-foreground rounded-bl-md"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0 max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex justify-start">
                  <div className="bg-secondary/60 px-4 py-3 rounded-2xl rounded-bl-md flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}

              {/* Quick Actions & Nav */}
              {messages.length <= 1 && (
                <div className="space-y-3 pt-2">
                  <div className="flex flex-wrap gap-2">
                    {QUICK_ACTIONS.map((action) => (
                      <button
                        key={action.label}
                        onClick={() => handleSend(action.prompt)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20"
                      >
                        <action.icon className="w-3 h-3" />
                        {action.label}
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-border/20 pt-3 mt-3">
                    <p className="text-xs text-muted-foreground mb-2 font-medium">🔗 Acesso Rápido:</p>
                    <div className="space-y-1.5">
                      {NAV_LINKS.map((link) => (
                        <button
                          key={link.path}
                          onClick={() => navigate(link.path)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left bg-card/50 hover:bg-primary/10 transition-colors border border-border/10 hover:border-primary/20 group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:glow-primary transition-all">
                            <link.icon className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-foreground">{link.label}</p>
                            <p className="text-[10px] text-muted-foreground">{link.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border/20">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Pergunte qualquer coisa..."
                  className="rounded-xl bg-secondary/30 border-border/20 text-sm"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="rounded-xl shrink-0 glow-primary"
                  disabled={!input.trim() || isLoading}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
