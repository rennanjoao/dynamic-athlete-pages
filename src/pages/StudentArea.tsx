/**
 * StudentArea.tsx — Hub central da Área do Aluno.
 */

import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TrainerAlert } from "@/components/student/TrainerAlert";
import { ProgressChart } from "@/components/student/ProgressChart";
import { SplashScreen } from "@/components/student/SplashScreen";
import { useStudentData } from "@/hooks/useStudentData";
import {
  LogOut,
  ClipboardList,
  Activity,
  FileText,
  Dumbbell,
  Apple,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const NAV_CARDS = [
  {
    to: "/anamnesis",
    icon: ClipboardList,
    title: "Anamnese",
    desc: "Sua linha de base completa — atualize quando algo importante mudar.",
  },
  {
    to: "/check-in",
    icon: FileText,
    title: "Feedback / Check-in",
    desc: "Envie seu feedback periódico para o coach calibrar o protocolo.",
  },
  {
    to: "/evolution",
    icon: Activity,
    title: "Painel de Evolução Completo",
    desc: "Acesse todas as métricas detalhadas e fotos de progresso.",
  },
  {
    to: "/workout-plan",
    icon: Dumbbell,
    title: "Treino do dia",
    desc: "Sessão atual com séries, RPE e cadência.",
  },
  {
    to: "/routine",
    icon: Apple,
    title: "Estratégia Nutricional",
    desc: "Diretrizes alimentares, hidratação e suplementação do seu protocolo.",
  },
];

const MOTIVATIONAL_MESSAGES = [
  "Parabéns pelo foco! Cada dia conta na sua evolução.",
  "A persistência é o caminho do sucesso. Continue firme!",
  "Resultados exigem tempo e constância. Você está no caminho certo!",
  "Não pare agora! O seu corpo já está agradecendo o esforço.",
  "Disciplina constrói resultados que a motivação não alcança sozinha.",
  "A sua dedicação diária é o que constrói a sua melhor versão!",
  "O suor de hoje é o resultado de amanhã. Excelente trabalho!"
];

const StudentArea = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [quote, setQuote] = useState("");
  
  const { anamnesis, loading } = useStudentData();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/");
      else setUser(session.user);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/");
      else setUser(session.user);
    });
    
    setQuote(MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)]);
    
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const payloadAna = (anamnesis?.payload as Record<string, any>) || {};
  const firstName = payloadAna.nome ? payloadAna.nome.split(" ")[0] : "Aluno";

  return (
    <div className="min-h-screen bg-background">
      {/* 
        SPLASH SCREEN COLOCADO NO TOPO ABSOLUTO.
        Desta forma ele renderiza instantaneamente, mesmo se a página estiver "Carregando..."
      */}
      <SplashScreen />

      {loading ? (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground animate-pulse">Carregando seus dados...</p>
        </div>
      ) : (
        <>
          <header className="border-b border-border glass-strong">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Área do Aluno <span className="text-primary">·</span> Elite Lab{" "}
                  <span className="text-primary">Hub</span>
                </h1>
                <p className="text-xs text-muted-foreground">
                  Olá, {firstName} — escolha um módulo abaixo
                </p>
              </div>
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" /> Sair
                </Button>
              </div>
            </div>
          </header>

          <main className="container mx-auto px-4 py-8 space-y-10 max-w-5xl">
            <TrainerAlert />

            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Seus módulos
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {NAV_CARDS.map(({ to, icon: Icon, title, desc }) => (
                  <Link key={to} to={to}>
                    <Card className="p-5 card-hover group hover:border-primary/40 h-full">
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:glow-primary transition-all">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold text-foreground">{title}</h3>
                            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>

            <section className="pt-4">
              <div className="flex flex-col items-center justify-center text-center mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 textSe o Splash Screen não ativou ou não ficou visível, isso ocorre por dois motivos técnicos principais: ou o componente está sendo esmagado pelo `z-index` de outros elementos da interface (como pop-ups do Shadcn), ou o arquivo do componente não foi criado corretamente no projeto.

Para forçar a sobreposição absoluta na tela e travar o scroll do usuário até que ele clique ou o tempo acabe, aplique esta correção definitiva.

### 1. Correção do Splash Screen (Prioridade Máxima de Tela)
Se você ainda não criou o arquivo, crie-o agora. Substitua/Cole todo o conteúdo em **`src/components/student/SplashScreen.tsx`**:

```tsx
import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

export const SplashScreen = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    // Trava o scroll da página enquanto o splash estiver aberto
    document.body.style.overflow = "hidden";
    
    const timer = setTimeout(() => {
      closeSplash();
    }, 6000);
    
    return () => {
      document.body.style.overflow = "auto";
      clearTimeout(timer);
    };
  }, []);

  const closeSplash = () => {
    setIsAnimatingOut(true);
    O motivo pelo qual o *Splash Screen* não ativou para você é o estado de **carregamento (`loading`)** do React. 

Na versão anterior, se o sistema demorasse 1 ou 2 segundos para baixar os dados do aluno no Supabase, a página entrava no bloco `if (loading) return <Carregando...>` e **destruía** o Splash Screen antes mesmo dele aparecer. Quando o carregamento terminava, a tela já pulava direto para os botões.

A solução correta é colocar o Splash Screen na **raiz** do componente. Assim, ele roda a animação perfeitamente por cima de tudo e ainda serve para "esconder" o tempo de carregamento da base de dados, tornando a experiência fluida.

Substitua **todo** o conteúdo de **`src/pages/StudentArea.tsx`** por esta versão corrigida:

```tsx
/**
 * StudentArea.tsx — Hub central da Área do Aluno.
 */

import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TrainerAlert } from "@/components/student/TrainerAlert";
import { ProgressChart } from "@/components/student/ProgressChart";
import { SplashScreen } from "@/components/student/SplashScreen";
import { useStudentData } from "@/hooks/useStudentData";
import {
  LogOut,
  ClipboardList,
  Activity,
  FileText,
  Dumbbell,
  Apple,
  ArrowRight,
  Sparkles,
  Loader2
} from "lucide-react";

const NAV_CARDS = [
  {
    to: "/anamnesis",
    icon: ClipboardList,
    title: "Anamnese",
    desc: "Sua linha de base completa — atualize quando algo importante mudar.",
  },
  {
    to: "/check-in",
    icon: FileText,
    title: "Feedback / Check-in",
    desc: "Envie seu feedback periódico para o coach calibrar o protocolo.",
  },
  {
    to: "/evolution",
    icon: Activity,
    title: "Painel de Evolução Completo",
    desc: "Acesse todas as métricas detalhadas e fotos de progresso.",
  },
  {
    to: "/workout-plan",
    icon: Dumbbell,
    title: "Treino do dia",
    desc: "Sessão atual com séries, RPE e cadência.",
  },
  {
    to: "/routine",
    icon: Apple,
    title: "Estratégia Nutricional",
    desc: "Diretrizes alimentares, hidratação e suplementação do seu protocolo.",
  },
];

const MOTIVATIONAL_MESSAGES = [
  "Parabéns pelo foco! Cada dia conta na sua evolução.",
  "A persistência é o caminho do sucesso. Continue firme!",
  "Resultados exigem tempo e constância. Você está no caminho certo!",
  "Não pare agora! O seu corpo já está agradecendo o esforço.",
  "Disciplina constrói resultados que a motivação não alcança sozinha.",
  "A sua dedicação diária é o que constrói a sua melhor versão!",
  "O suor de hoje é o resultado de amanhã. Excelente trabalho!"
];

const StudentArea = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [quote, setQuote] = useState("");
  
  const { anamnesis, loading } = useStudentData();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/");
      else setUser(session.user);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/");
      else setUser(session.user);
    });
    
    setQuote(MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)]);
    
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const payloadAna = (anamnesis?.payload as Record<string, any>) || {};
  const firstName = payloadAna.nome ? payloadAna.nome.split(" ")[0] : "Aluno";

  return (
    <>
      {/* O Splash Screen agora fica fora do IF de loading, garantindo que ele sempre rode imediatamente */}
      <SplashScreen />

      {loading ? (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-primary opacity-20" />
        </div>
      ) : (
        <div className="min-h-screen bg-background">
          <header className="border-b border-border glass-strong">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Área do Aluno <span className="text-primary">·</span> Elite Lab{" "}
                  <span className="text-primary">Hub</span>
                </h1>
                <p className="text-xs text-muted-foreground">
                  Olá, {firstName} — escolha um módulo abaixo
                </p>
              </div>
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" /> Sair
                </Button>
              </div>
            </div>
          </header>

          <main className="container mx-auto px-4 py-8 space-y-10 max-w-5xl">
            <TrainerAlert />

            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Seus módulos
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {NAV_CARDS.map(({ to, icon: Icon, title, desc }) => (
                  <Link key={to} to={to}>
                    <Card className="p-5 card-hover group hover:border-primary/40 h-full">
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:glow-primary transition-all">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold text-foreground">{title}</h3>
                            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>

            <section className="pt-4">
              <div className="flex flex-col items-center justify-center text-center mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary mb-3">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-semibold">Seu Progresso</span>
                </div>
                <p className="text-muted-foreground text-sm max-w-xl animate-fade-in">
                  {quote}
                </p>
              </div>
              
              <ProgressChart />
            </section>
          </main>
        </div>
      )}
    </>
  );
};

export default StudentArea;
