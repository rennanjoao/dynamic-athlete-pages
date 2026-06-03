import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Flame, Droplets, Dumbbell, UtensilsCrossed, TrendingUp, CheckCircle2, Circle, Trophy, ChevronRight, Moon, Apple, Pill } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import ScoreCard from "@/components/gamification/ScoreCard";
import RankingTeaser from "@/components/gamification/RankingTeaser";

// ... (Todo o bloco de lógicas de "useDailyState", "useToggleItem", "useTotalScore" etc. que você já tem no código permanecem exatamente iguais. Vou inserir a renderização visual alterada abaixo)

// -- COLOQUE ESTE GRÁFICO OTIMIZADO NO LUGAR DO "WeightChart" ANTIGO --
function WeightChart({ data }: { data: any[] }) {
  if (data.length < 2) return null;

  // Calculo de Domínio Dinâmico para evitar "Linha Reta"
  const weights = data.map(d => d.weight);
  const minWeight = Math.floor(Math.min(...weights)) - 1;
  const maxWeight = Math.ceil(Math.max(...weights)) + 1;

  return (
    <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Histórico de Evolução</h3>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={data} margin={{ top: 10, right: 0, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#c81d1d" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#c81d1d" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} />
          {/* Eixo Y Dinâmico */}
          <YAxis domain={[minWeight, maxWeight]} tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, fontSize: 12, color: "#fff" }} formatter={(v: number) => [`${v} kg`, "Peso"]} />
          <Area type="monotone" dataKey="weight" stroke="#c81d1d" strokeWidth={3} fill="url(#wGrad)" dot={{ r: 4, fill: "#c81d1d", strokeWidth: 0 }} activeDot={{ r: 6 }} />
        </AreaChart>
      </ResponsiveContainer>
      <Button variant="outline" className="w-full mt-4 text-xs" onClick={() => window.location.href = '/evolution'}>
        Ver Histórico e Anamnese Detalhada
      </Button>
    </div>
  );
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>("");
  // ... (mantenha os hooks de auth e busca de dados)
  
  useEffect(() => { supabase.auth.getSession().then(({ data }) => { if (data.session?.user) setUserId(data.session.user.id); }); }, []);

  // Simulação de carregamento (Mantenha sua lógica original aqui)
  const isLoading = false; 

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* HEADER LIMPO (Sem botões sobrepondo texto) */}
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-4 flex items-center justify-between shadow-sm">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">Meu Dia</h1>
          <p className="text-xs text-muted-foreground">Progresso e Metas</p>
        </div>
        {/* Espaço reservado se quiser adicionar um menu de engrenagem depois */}
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-6">
        
        {/* NAVEGAÇÃO RÁPIDA (Sem Anamnese, Com Suplementos) */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <Button variant="outline" size="sm" className="shrink-0 text-xs shadow-sm bg-card" onClick={() => navigate("/routine")}>
            <Apple className="w-3.5 h-3.5 mr-1.5" /> Dieta
          </Button>
          <Button variant="outline" size="sm" className="shrink-0 text-xs shadow-sm bg-card" onClick={() => navigate("/workout-plan")}>
            <Dumbbell className="w-3.5 h-3.5 mr-1.5" /> Treino
          </Button>
          <Button variant="outline" size="sm" className="shrink-0 text-xs shadow-sm bg-card border-primary/30 text-primary" onClick={() => navigate("/supplements")}>
            <Pill className="w-3.5 h-3.5 mr-1.5" /> Suplementos
          </Button>
          <Button variant="outline" size="sm" className="shrink-0 text-xs shadow-sm bg-card" onClick={() => navigate("/evolution")}>
            <TrendingUp className="w-3.5 h-3.5 mr-1.5" /> Evolução
          </Button>
        </div>

        {/* Mantenha o ScoreCard e Macros da sua versão original */}
        
        {/* GRÁFICO DE EVOLUÇÃO ATUALIZADO */}
        {/* <WeightChart data={data?.weightHistory ?? []} /> */}
        
      </main>
    </div>
  );
}
