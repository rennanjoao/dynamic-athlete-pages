/**
 * StudentArea.tsx — Hub Central do Aluno
 * Tela inicial limpa com acesso rápido aos pilares do protocolo e alertas financeiros.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Apple, Dumbbell, Pill, TrendingUp, CheckCircle2, Loader2, User, AlertCircle, Copy, Check, X } from "lucide-react";

export default function StudentArea() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUserId(data.session.user.id);
      } else {
        navigate("/auth");
      }
    });
  }, [navigate]);

  const { data: profile, isLoading: profileLoading } = useQuery({
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

  // Busca faturas próximas do vencimento (<= 7 dias) ou atrasadas
  const { data: billingAlert } = useQuery({
    queryKey: ["student-billing-alert", userId],
    enabled: !!userId,
    queryFn: async () => {
      // 1. Acha o coach do aluno
      const { data: link } = await supabase.from("coach_students").select("coach_id").eq("student_id", userId).eq("status", "active").maybeSingle();
      if (!link?.coach_id) return null;

      // 2. Acha a chave PIX do coach
      const { data: coach } = await supabase.from("profiles").select("pix_key").eq("user_id", link.coach_id).maybeSingle();

      // 3. Acha o próximo vencimento pendente
      const { data: finance } = await supabase.from("coach_finances")
        .select("*")
        .eq("student_id", userId)
        .eq("status", "pending")
        .not("due_date", "is", null)
        .order("due_date", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!finance || !finance.due_date) return null;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(finance.due_date);
      dueDate.setHours(0, 0, 0, 0);
      
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Só retorna se faltar 7 dias ou menos (incluindo atrasados que são negativos)
      if (diffDays <= 7) {
        return {
          id: finance.id,
          amount: finance.amount,
          dueDate: finance.due_date,
          diffDays,
          pixKey: coach?.pix_key || "Chave PIX não informada pelo treinador.",
        };
      }
      return null;
    },
  });

  const firstName = profile?.full_name ? profile.full_name.split(" ")[0] : "Aluno";

  const copyPix = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  const dismissAlert = (id: string) => {
    setDismissedAlerts((prev) => [...prev, id]);
  };

  const modules = [
    { title: "Dieta", description: "Plano alimentar, substituições e macros.", icon: Apple, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", route: "/routine" },
    { title: "Treino", description: "Séries, cadência e diretrizes biomecânicas.", icon: Dumbbell, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", route: "/workout-plan" },
    { title: "Suplementação", description: "Fármacos, vitaminas e horários de uso.", icon: Pill, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20", route: "/supplements" },
    { title: "Evolução", description: "Fotos de progresso, gráficos e anamnese.", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", route: "/evolution" },
    { title: "Check-in", description: "Envie seu feedback periódico para o treinador.", icon: CheckCircle2, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20", route: "/check-in" },
  ];

  if (profileLoading) {
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
        
        {/* ALERTA DE COBRANÇA */}
        {billingAlert && !dismissedAlerts.includes(billingAlert.id) && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 relative shadow-sm">
            <button onClick={() => dismissAlert(billingAlert.id)} className="absolute top-3 right-3 text-amber-600 hover:text-amber-700">
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-amber-700 dark:text-amber-500">
                  {billingAlert.diffDays < 0 
                    ? `Sua mensalidade está atrasada há ${Math.abs(billingAlert.diffDays)} dia(s)`
                    : billingAlert.diffDays === 0 
                      ? "Sua mensalidade vence hoje!"
                      : `Sua mensalidade vence em ${billingAlert.diffDays} dias`}
                </h3>
                <p className="text-xs text-amber-600/80 dark:text-amber-400/80">
                  Vencimento: {new Date(billingAlert.dueDate).toLocaleDateString('pt-BR')} 
                  {billingAlert.amount > 0 && ` • Valor: R$ ${billingAlert.amount.toFixed(2)}`}
                </p>
                
                <div className="mt-3 bg-background/50 border border-amber-500/20 rounded-lg p-3">
                  <p className="text-[10px] font-bold uppercase text-amber-700/70 mb-1">Chave PIX do Treinador</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs font-mono bg-background px-2 py-1.5 rounded text-foreground truncate">
                      {billingAlert.pixKey}
                    </code>
                    <Button size="sm" variant="outline" className="shrink-0 h-8 bg-background" onClick={() => copyPix(billingAlert.pixKey)}>
                      {copiedPix ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className="pt-2">
                  <Button size="sm" onClick={() => dismissAlert(billingAlert.id)} className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8">
                    Já efetuei o pagamento / Ocultar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

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
