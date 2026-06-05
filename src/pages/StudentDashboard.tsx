/**
 * StudentDashboard.tsx — O Hub Diário do Aluno (Rota /daily)
 * Arquivo 100% completo com Hooks de dados, Gráfico de Evolução e Checklist.
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { 
  Flame, Droplets, Dumbbell, UtensilsCrossed, TrendingUp, CheckCircle2, 
  Circle, ChevronRight, Apple, Pill, Loader2, LogOut 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// Gamification Components (Certifique-se de que esses arquivos existam, senão comente as chamadas deles no JSX)
import ScoreCard from "@/components/gamification/ScoreCard";
import RankingTeaser from "@/components/gamification/RankingTeaser";

// ─── GRÁFICO OTIMIZADO ───
function WeightChart({ data }: { data: any[] }) {
  if (!data || data.length < 2) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 text-center shadow-sm">
        <TrendingUp className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          Faça pelo menos 2 check-ins com peso para gerar o gráfico de evolução.
        </p>
      </div>
    );
  }

  // Domínio Dinâmico para evitar "Linha Reta"
  const weights = data.map(d => Number(d.weight));
  const minWeight = Math.floor(Math.min(...weights)) - 1;
  const maxWeight = Math.ceil(Math.max(...weights)) + 1;

  return (
    <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Histórico de Evolução</h3>
      </div>
      <div className="h-[160px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 0, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis domain={[minWeight, maxWeight]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12, color: "hsl(var(--foreground))" }} 
              formatter={(v: number) => [`${v} kg`, "Peso"]} 
            />
            <Area type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={3} fill="url(#wGrad)" dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }} activeDot={{ r: 6 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <Button variant="outline" className="w-full mt-4 text-xs" onClick={() => window.location.href = '/evolution'}>
        Ver Histórico Completo
      </Button>
    </div>
  );
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [userId, setUserId] = useState<string>("");
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => { 
    supabase.auth.getSession().then(({ data }) => { 
      if (data.session?.user) setUserId(data.session.user.id); 
      else navigate("/auth");
    }); 
  }, [navigate]);

  // 1. Busca Histórico de Peso (a partir dos Check-ins)
  const { data: weightHistory, isLoading: loadingWeight } = useQuery({
    queryKey: ["weight-history", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("check_ins")
        .select("submitted_at, current_metrics")
        .eq("student_id", userId)
        .order("submitted_at", { ascending: true });

      if (!data) return [];
      return data
        .map(c => {
          const metrics = c.current_metrics as Record<string, any>;
          return {
            date: new Date(c.submitted_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
            weight: metrics?.peso || metrics?.weight || null
          };
        })
        .filter(d => d.weight !== null);
    }
  });

  // 2. Busca Macros / Plano
  const { data: plan, isLoading: loadingPlan } = useQuery({
    queryKey: ["coach-plan", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from("coach_plans").select("*").eq("student_id", userId).maybeSingle();
      return data;
    }
  });

  // 3. Busca Estado Diário (Checklist)
  const { data: dailyLog, isLoading: loadingDaily } = useQuery({
    queryKey: ["daily-log", userId, today],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("daily_logs")
        .select("*")
        .eq("student_id", userId)
        .eq("log_date", today)
        .maybeSingle();
      
      // Se a tabela não existir ou der erro, retornamos falso para tudo
      if (error) return { diet_ok: false, workout_ok: false, water_ok: false };
      return (data as any) || { diet_ok: false, workout_ok: false, water_ok: false };
    }
  });

  const updateDaily = useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await (supabase as any)
        .from("daily_logs")
        .upsert({
          student_id: userId,
          log_date: today,
          ...((dailyLog as any) || {}),
          ...updates,
        }, { onConflict: "student_id, log_date" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["daily-log"] }),
    onError: () => toast.error("Erro ao salvar progresso diário.")
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const isLoading = !userId || loadingWeight || loadingPlan || loadingDaily;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      
      {/* HEADER LIMPO COM LOGOUT */}
      <header className="sticky top-0 z-40 bg-card border-b border-border/50 px-4 py-4 flex items-center justify-between shadow-sm">
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Meu Dia</h1>
          <p className="text-xs text-muted-foreground">Seu progresso diário</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive h-9">
          <LogOut className="w-4 h-4 sm:mr-1.5" /> 
          <span className="hidden sm:inline text-xs">Sair</span>
        </Button>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        
        {/* NAVEGAÇÃO RÁPIDA */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Button variant="outline" size="sm" className="shrink-0 text-xs shadow-sm bg-card" onClick={() => navigate("/routine")}>
            <Apple className="w-3.5 h-3.5 mr-1.5 text-amber-500" /> Dieta
          </Button>
          <Button variant="outline" size="sm" className="shrink-0 text-xs shadow-sm bg-card" onClick={() => navigate("/workout-plan")}>
            <Dumbbell className="w-3.5 h-3.5 mr-1.5 text-blue-500" /> Treino
          </Button>
          <Button variant="outline" size="sm" className="shrink-0 text-xs shadow-sm bg-card" onClick={() => navigate("/supplements")}>
            <Pill className="w-3.5 h-3.5 mr-1.5 text-purple-500" /> Suplementos
          </Button>
          <Button variant="outline" size="sm" className="shrink-0 text-xs shadow-sm bg-card" onClick={() => navigate("/evolution")}>
            <TrendingUp className="w-3.5 h-3.5 mr-1.5 text-emerald-500" /> Evolução
          </Button>
        </div>

        {/* GAMIFICAÇÃO (Se estiver usando no projeto, descomente os dois abaixo) */}
        {/* <ScoreCard /> */}
        {/* <RankingTeaser /> */}

        {/* CHECKLIST DIÁRIO */}
        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <h3 className="text-sm font-bold text-foreground">Checklist de Hoje</h3>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/50">
            <div className="flex items-center gap-3">
              <UtensilsCrossed className="w-4 h-4 text-amber-500" />
              <div>
                <p className="text-sm font-semibold">Dieta 100%</p>
                <p className="text-[10px] text-muted-foreground">Bateu todos os macros?</p>
              </div>
            </div>
            <Switch 
              checked={(dailyLog as any)?.diet_ok} 
              onCheckedChange={(v) => updateDaily.mutate({ diet_ok: v })} 
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/50">
            <div className="flex items-center gap-3">
              <Dumbbell className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm font-semibold">Treino Feito</p>
                <p className="text-[10px] text-muted-foreground">Completou a sessão de hoje?</p>
              </div>
            </div>
            <Switch 
              checked={(dailyLog as any)?.workout_ok} 
              onCheckedChange={(v) => updateDaily.mutate({ workout_ok: v })} 
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/50">
            <div className="flex items-center gap-3">
              <Droplets className="w-4 h-4 text-cyan-500" />
              <div>
                <p className="text-sm font-semibold">Meta de Água</p>
                <p className="text-[10px] text-muted-foreground">{plan?.water_l || 2.5} Litros</p>
              </div>
            </div>
            <Switch 
              checked={(dailyLog as any)?.water_ok} 
              onCheckedChange={(v) => updateDaily.mutate({ water_ok: v })} 
            />
          </div>
        </div>

        {/* METAS E MACROS (Com base no Plano do Coach) */}
        {plan && (
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-card rounded-xl border border-border p-3 text-center shadow-sm">
              <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Kcal</p>
              <p className="text-sm font-bold text-foreground">{plan.calories || plan.base_calories || "—"}</p>
            </div>
            <div className="bg-card rounded-xl border border-amber-500/20 p-3 text-center shadow-sm">
              <p className="text-[10px] uppercase font-bold text-amber-500 mb-1">Carb</p>
              <p className="text-sm font-bold text-foreground">{plan.carbs_g || plan.base_carbs_g || "—"}g</p>
            </div>
            <div className="bg-card rounded-xl border border-blue-500/20 p-3 text-center shadow-sm">
              <p className="text-[10px] uppercase font-bold text-blue-500 mb-1">Prot</p>
              <p className="text-sm font-bold text-foreground">{plan.protein_g || plan.base_protein_g || "—"}g</p>
            </div>
            <div className="bg-card rounded-xl border border-rose-500/20 p-3 text-center shadow-sm">
              <p className="text-[10px] uppercase font-bold text-rose-500 mb-1">Gord</p>
              <p className="text-sm font-bold text-foreground">{plan.fat_g || plan.base_fat_g || "—"}g</p>
            </div>
          </div>
        )}

        {/* GRÁFICO DE EVOLUÇÃO */}
        <WeightChart data={weightHistory || []} />
        
      </main>
    </div>
  );
}
