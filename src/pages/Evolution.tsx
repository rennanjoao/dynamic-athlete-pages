/**
 * Evolution.tsx — Painel de evolução do aluno.
 * Tabs: Dashboard (comparativo) · Histórico (timeline) · Anamnese (visualização).
 * Tudo consumindo `useStudentData` em tempo real.
 */

import { useEffect, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useStudentData } from "@/hooks/useStudentData";
import ComparisonBoard from "@/components/student/ComparisonBoard";
import EvolutionTimeline from "@/components/student/EvolutionTimeline";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ClipboardList, Plus, Loader2 } from "lucide-react";

// Importa o Visualizador da Anamnese (mesmo usado pelo Coach, em modo somente leitura)
const AnamnesisViewer = lazy(() => import("@/components/anamnesis/AnamnesisViewer"));

export default function Evolution() {
  const navigate = useNavigate();
  // Removido o `protocol` do hook, pois não será mais usado nesta tela.
  const { anamnesis, checkIns, loading, studentId } = useStudentData();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate("/auth");
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-foreground">Minha Evolução</h1>
            <p className="text-[11px] text-muted-foreground">
              Acompanhe seu progresso e histórico
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-5">
        {loading || !studentId ? (
          <>
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-32 w-full" />
          </>
        ) : (
          <Tabs defaultValue="dashboard" className="space-y-5">
            {/* O grid agora tem 3 opções, com a Anamnese no lugar do Protocolo */}
            <TabsList className="grid grid-cols-3 w-full bg-card border border-border">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
              <TabsTrigger value="anamnese">Anamnese</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-4 mt-0">
              <ComparisonBoard
                anamnesis={anamnesis}
                latestCheckIn={checkIns[0] ?? null}
              />
              <Button className="w-full" onClick={() => navigate("/check-in")}>
                <Plus className="w-4 h-4 mr-2" /> Novo check-in
              </Button>
            </TabsContent>

            <TabsContent value="historico" className="mt-0">
              <EvolutionTimeline checkIns={checkIns} />
            </TabsContent>

            {/* Nova Aba de Visualização da Anamnese (Somente Leitura) */}
            <TabsContent value="anamnese" className="mt-0">
              <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                <div className="mb-4 pb-4 border-b border-border/50">
                  <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-primary" /> Visualização da Anamnese
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Estes são os dados iniciais que você enviou ao seu treinador para a montagem do protocolo.
                  </p>
                </div>
                
                <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}>
                  <AnamnesisViewer studentId={studentId} studentName="Meu Histórico Base" />
                </Suspense>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
