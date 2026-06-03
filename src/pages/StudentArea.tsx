/**
 * StudentArea.tsx — Hub Central do Aluno
 * Tela inicial limpa com acesso rápido aos pilares do protocolo.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Apple, Dumbbell, Pill, TrendingUp, CheckCircle2, Loader2, User } from "lucide-react";

export default function StudentArea() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUserId(data.session.user.id);
      } else {
        navigate("/auth");
      }
    });
  }, [navigate]);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["student-profile-hub", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", userId)
        .maybeSingle();
      return data;
    },
  });

  const firstName = profile?.full_name ? profile.full_name.split(" ")[0] : "Aluno";

  const modules = [
    {
      title: "Dieta",
      description: "Plano alimentar, substituições e macros.",
      icon: Apple,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      route: "/routine",
    },
    {
      title: "Treino",
      description: "Séries, cadência e diretrizes biomecânicas.",
      icon: Dumbbell,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      route: "/workout-plan",
    },
    {
      title: "Suplementação",
      description: "Fármacos, vitaminas e horários de uso.",
      icon: Pill,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      route: "/supplements",
    },
    {
      title: "Evolução",
      description: "Fotos de progresso, gráficos e anamnese.",
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      route: "/evolution",
    },
    {
      title: "Check-in",
      description: "Envie seu feedback periódico para o treinador.",
      icon: CheckCircle2,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      route: "/check-in",
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="bg-card border-b border-border/50 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Olá, {firstName}</h1>
              <p className="text-xs text-muted-foreground">Bem-vindo ao seu painel central</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">
          Seu Protocolo
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {modules.map((mod) => (
            <Card 
              key={mod.title} 
              className={`cursor-pointer hover:shadow-md transition-all hover:-translate-y-1 bg-card/60 border ${mod.border}`}
              onClick={() => navigate(mod.route)}
            >
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${mod.bg}`}>
                  <mod.icon className={`w-6 h-6 ${mod.color}`} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{mod.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {mod.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 p-4 bg-muted/30 border border-border/50 rounded-xl text-center">
          <p className="text-xs text-muted-foreground">
            Precisa de ajuda? Acesse o chat da Inteligência Artificial no canto da tela ou envie uma dúvida diretamente dentro do módulo específico.
          </p>
        </div>
      </main>
    </div>
  );
}
