import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Bot, User, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const INITIAL_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: "Olá! 👋 Sou seu assistente fitness. Posso te ajudar com dúvidas sobre treinos, dieta, suplementação e suas métricas de performance. Como posso ajudar?",
  timestamp: new Date(),
};

export const FitnessChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate bot response (replace with actual AI call later)
    setTimeout(() => {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getBotResponse(userMsg.content),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <>
      {/* FAB Button */}
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
              className="w-14 h-14 rounded-full glow-primary shadow-2xl"
              size="icon"
            >
              <MessageCircle className="w-6 h-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] h-[520px] flex flex-col glass-strong rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">Fitness AI</p>
                  <p className="text-xs text-muted-foreground">Assistente de performance</p>
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
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "gradient-primary text-white rounded-br-md"
                        : "bg-secondary/60 text-foreground rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-secondary/60 px-4 py-3 rounded-2xl rounded-bl-md flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border/30">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Pergunte algo..."
                  className="rounded-xl bg-secondary/30 border-border/30 text-sm"
                />
                <Button type="submit" size="icon" className="rounded-xl shrink-0" disabled={!input.trim()}>
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

function getBotResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("treino") || lower.includes("exercício")) {
    return "Para otimizar seus treinos, foque em progressão de carga semanal, controle de cadência (2s excêntrica / 1s concêntrica) e mantenha o descanso entre 60-90s. Qual modalidade você pratica?";
  }
  if (lower.includes("dieta") || lower.includes("comida") || lower.includes("alimentação")) {
    return "Uma boa estratégia nutricional é dividir suas refeições em 4-6 porções ao dia, priorizando proteínas (1.6-2.2g/kg) e carboidratos complexos. Posso detalhar mais!";
  }
  if (lower.includes("suplemento") || lower.includes("creatina") || lower.includes("whey")) {
    return "Os suplementos mais evidenciados cientificamente são: Creatina (5g/dia), Whey Protein (pós-treino), Cafeína (3-6mg/kg pré-treino) e Vitamina D. Quer saber sobre algum específico?";
  }
  if (lower.includes("peso") || lower.includes("emagrecer") || lower.includes("gordura")) {
    return "Para perda de gordura, o deficit calórico é fundamental (300-500kcal abaixo do gasto). Combine treino de força com cardio moderado. Acompanhe suas medidas semanalmente!";
  }
  return "Entendi! Posso te ajudar com informações sobre treinos, dieta, suplementação e acompanhamento de performance. Seja mais específico para eu dar a melhor orientação! 💪";
}
