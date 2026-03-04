import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageCircle, X, Send, Sparkles, Zap,
  Droplets, Moon, Apple, Dumbbell, Heart, Brain,
  TrendingUp, Users, Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const KNOWLEDGE_BASE: Record<string, string> = {
  // Site features
  "treino|exercicio|musculação|academia": `💪 **Treinos Inteligentes**\n\nNosso sistema oferece:\n- **10+ templates esportivos**: Bodybuilding, Powerlifting, CrossFit, BJJ, Calistenia, Corrida, Triathlon, Natação, Ciclismo e Fisioterapia\n- Controle de **RPE, cadência, séries e descanso**\n- Periodização personalizada\n- Checklist interativo de exercícios\n\n👉 Acesse pela **Área do Atleta** ou **Painel Fitness** para começar!`,

  "dieta|nutrição|alimentação|comida|macro|caloria": `🍎 **Nutrição & Plano Alimentar**\n\nRecursos disponíveis:\n- Plano alimentar completo com **macronutrientes**\n- Controle de refeições diárias com checklist\n- Suplementação com horários otimizados\n- Ajuste de macros para **cutting, bulking ou recomposição**\n\n💡 **Dica**: Consuma 1.6-2.2g de proteína por kg de peso corporal para maximizar a síntese proteica muscular.`,

  "agua|hidratação|beber|líquido": `💧 **Hidratação — O Pilar Esquecido**\n\nA hidratação adequada impacta diretamente:\n- **Performance**: -2% de desidratação = -20% de rendimento\n- **Recuperação muscular**: Água transporta nutrientes às fibras\n- **Cognição**: Desidratação reduz foco e tempo de reação\n\n📊 **Meta diária**: 35-40ml por kg de peso corporal\n- Ex: 80kg → 2.8 a 3.2 litros/dia\n- Em treino intenso: adicionar 500-750ml por hora de exercício\n\n🔥 **Sinais de desidratação**: Urina escura, fadiga, dor de cabeça, cãibras.`,

  "sono|dormir|descanso|recuperação|sleep": `🌙 **Sono — O Maior Anabólico Natural**\n\nDurante o sono profundo:\n- Liberação de **GH (Hormônio do Crescimento)** — pico às 22h-2h\n- **Reparação das fibras musculares** micro-lesionadas no treino\n- Consolidação da **memória motora** (técnica de exercícios)\n- Regulação do **cortisol** (hormônio do estresse)\n\n📊 **Recomendação**: 7-9 horas por noite\n\n💡 **Dicas para melhorar o sono**:\n- Evite telas 1h antes de dormir\n- Quarto escuro e fresco (18-20°C)\n- Magnésio e ZMA podem auxiliar\n- Horário fixo de dormir/acordar`,

  "resultado|progresso|evolução|meta|objetivo": `📈 **Resultados & Acompanhamento**\n\nA plataforma oferece:\n- **Gráficos de evolução** de peso, medidas e % de gordura\n- Avaliação por **dobras cutâneas** (Jackson-Pollock 3/7 dobras)\n- **Avatar 3D** que reflete sua composição corporal\n- Histórico completo de todas as medições\n\n⏱️ **Expectativas realistas**:\n- Hipertrofia: 0.5-1kg de massa magra/mês (iniciantes)\n- Emagrecimento saudável: 0.5-1kg/semana\n- Ganho de força: 5-10% por mês (iniciantes)`,

  "avatar|3d|personalização": `🎮 **Avatar 3D Personalizado**\n\nCrie seu avatar único:\n- Personalização de **pele, cabelo, olhos**\n- Roupas e **tênis Nike** customizáveis\n- Garrafa d'água de academia\n- Avatar reflete suas medidas corporais reais\n\n👉 Acesse na **Área do Atleta** > aba "Avatar 3D"`,

  "suplemento|whey|creatina|cafeína": `💊 **Suplementação Inteligente**\n\nSuplementos com evidência científica:\n- **Creatina**: 3-5g/dia — força e volume muscular\n- **Whey Protein**: 20-40g pós-treino\n- **Cafeína**: 3-6mg/kg — performance e foco\n- **Vitamina D**: Se exposição solar insuficiente\n- **Ômega 3**: Anti-inflamatório e saúde cardiovascular\n\n⚠️ Suplementos complementam, não substituem uma boa alimentação!`,

  "saude|saúde|bem-estar|prevenção": `❤️ **Saúde & Performance**\n\nOs 4 pilares da alta performance:\n\n1. 🏋️ **Treino**: Estímulo progressivo e periodizado\n2. 🍎 **Nutrição**: Combustível adequado para o corpo\n3. 💧 **Hidratação**: Base de todas as funções metabólicas\n4. 🌙 **Sono**: Onde a recuperação acontece\n\n💡 Negligenciar qualquer pilar compromete todos os outros. A plataforma te ajuda a monitorar cada um deles!`,

  "como funciona|o que faz|funcionalidade|recurso|feature": `🚀 **O que o Elite Athlete Hub oferece:**\n\n1. **🏋️ Painel Fitness** — Treinos do dia, dieta e performance\n2. **📊 Área do Atleta** — Medidas, dobras cutâneas, avatar 3D\n3. **👨‍💼 Área do Treinador** — Gestão de alunos e planos\n4. **🤖 Coach IA** — Assistente inteligente de performance\n5. **📱 HTML Offline** — Plano exportável para usar na academia\n\n👉 Comece pela **Área do Atleta** para configurar seu perfil!`,

  "treinador|personal|professor|admin": `👨‍💼 **Área do Treinador**\n\nFerramentas para profissionais:\n- Cadastro e gestão de múltiplos alunos\n- Montagem de treinos com 10+ templates esportivos\n- Planos alimentares e suplementação\n- Controle de hidratação com garrafa animada\n- Exportação de planos em HTML offline\n- Envio de planos por e-mail\n\n👉 Acesse pelo botão **"Área do Treinador"** na página inicial`,
};

const findAnswer = (question: string): string => {
  const q = question.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  for (const [keywords, answer] of Object.entries(KNOWLEDGE_BASE)) {
    const keys = keywords.split("|");
    if (keys.some(k => q.includes(k.normalize("NFD").replace(/[\u0300-\u036f]/g, "")))) {
      return answer;
    }
  }
  
  return `🤔 Boa pergunta! Aqui estão algumas coisas que posso te ajudar:\n\n- **Treinos** — Como funcionam os templates e protocolos\n- **Nutrição** — Dicas de dieta e suplementação\n- **Hidratação** — Por que beber água é essencial\n- **Sono** — O maior anabólico natural\n- **Resultados** — O que esperar e como acompanhar\n- **Avatar 3D** — Personalização do seu personagem\n\n💡 Tente perguntar sobre algum desses temas!`;
};

const QUICK_ACTIONS = [
  { label: "O que posso fazer aqui?", prompt: "como funciona o site", icon: Sparkles },
  { label: "Dicas de Hidratação", prompt: "hidratação", icon: Droplets },
  { label: "Importância do Sono", prompt: "sono e recuperação", icon: Moon },
  { label: "Resultados Esperados", prompt: "que resultados posso ter", icon: TrendingUp },
  { label: "Saúde & Performance", prompt: "saúde e bem-estar", icon: Heart },
];

const NAV_LINKS = [
  { label: "Área do Atleta", path: "/auth", icon: Users, description: "Perfil, medidas e avatar 3D" },
  { label: "Painel Fitness", path: "/fitness", icon: Activity, description: "Treinos, dieta e performance" },
  { label: "Área do Treinador", path: "/admin", icon: Dumbbell, description: "Gestão de alunos e planos" },
];

const INITIAL_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: "Olá! 👋 Sou o **Guia da Plataforma**. Posso te contar tudo sobre o Elite Athlete Hub, dar dicas de **saúde, hidratação e sono**, e te direcionar para a área certa!\n\nUse os atalhos abaixo ou me pergunte qualquer coisa! 🚀",
};

export const InfoChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: msg };
    const answer = findAnswer(msg);
    const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: answer };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput("");
  };

  const renderContent = (content: string) => {
    return content.split("\n").map((line, i) => {
      let processed = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.*?)`/g, '<code class="bg-primary/10 px-1 rounded text-primary text-xs">$1</code>');
      
      if (line.startsWith("- ")) {
        processed = `<span class="flex gap-1.5 items-start"><span class="text-primary mt-0.5">•</span><span>${processed.slice(2)}</span></span>`;
      }

      return (
        <span
          key={i}
          className={`block ${line === "" ? "h-2" : ""}`}
          dangerouslySetInnerHTML={{ __html: processed }}
        />
      );
    });
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
                  <p className="font-bold text-sm text-foreground">Guia da Plataforma</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Informativo • Dicas de Saúde
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
                      <div className="space-y-0.5">{renderContent(msg.content)}</div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}

              {/* Quick Actions */}
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

                  {/* Navigation Links */}
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
                  placeholder="Pergunte sobre o site, saúde, treinos..."
                  className="rounded-xl bg-secondary/30 border-border/20 text-sm"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="rounded-xl shrink-0 glow-primary"
                  disabled={!input.trim()}
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
