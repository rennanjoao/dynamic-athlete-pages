import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useFitnessProgress } from "@/hooks/useFitnessProgress";
import { HoverBlock } from "@/components/fitness/HoverBlock";
import { WorkoutCard } from "@/components/fitness/WorkoutCard";
import { DietCard } from "@/components/fitness/DietCard";
import { PerformanceChart } from "@/components/fitness/PerformanceChart";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Dumbbell, UtensilsCrossed, Activity } from "lucide-react";

const SAMPLE_WORKOUTS = [
  {
    id: "A",
    nome: "Treino A (Iniciante)",
    exercicios: [
      "Supino reto – 3x10-12 (1s excêntrica / 2s concêntrica)",
      "Puxada frente – 3x10-12",
      "Agachamento livre – 3x10-12",
      "Elevação lateral – 3x10-12",
    ],
  },
  {
    id: "B",
    nome: "Treino B (Iniciante)",
    exercicios: [
      "Remada baixa – 3x10-12",
      "Desenvolvimento – 3x10-12",
      "Leg Press – 3x10-12",
      "Tríceps pulley – 3x10-12",
    ],
  },
  {
    id: "C",
    nome: "Treino C (Iniciante)",
    exercicios: [
      "Supino inclinado – 3x10-12",
      "Puxada supinada – 3x10-12",
      "Agachamento sumô – 3x10-12",
      "Rosca direta – 3x10-12",
    ],
  },
];

const SAMPLE_MEALS = [
  { id: "cafe", refeicao: "Café da manhã", item: "Ovos + pão integral + fruta" },
  { id: "almoco", refeicao: "Almoço", item: "Arroz + feijão + frango + salada" },
  { id: "tarde", refeicao: "Lanche da tarde", item: "Iogurte + aveia + fruta" },
  { id: "jantar", refeicao: "Jantar", item: "Frango ou peixe + legumes" },
];

export default function Fitness() {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { workoutProgress, dietProgress, performanceLogs, loading, toggleWorkout, toggleDiet } = useFitnessProgress(
    user?.id
  );

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/");
      } else {
        setUser(session.user);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-background">
      <ThemeToggle />
      
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="animate-fade-in-down">
          <h1 className="text-4xl font-bold text-foreground mb-2">Painel Fitness</h1>
          <p className="text-muted-foreground">Acompanhe seu progresso diário</p>
        </div>

        {/* Quick Access Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up">
          <HoverBlock title="Treinos" img="/treino.jpg" />
          <HoverBlock title="Dietas" img="/dieta.jpg" />
          <HoverBlock title="Aeróbicos" img="/aerobico.jpg" />
        </div>

        {/* Workouts Section */}
        <div className="space-y-4 animate-fade-in-up">
          <div className="flex items-center gap-3">
            <Dumbbell className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Treinos do Dia</h2>
          </div>
          <div className="grid gap-4">
            {SAMPLE_WORKOUTS.map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                completed={workoutProgress[workout.id] || false}
                onToggle={toggleWorkout}
              />
            ))}
          </div>
        </div>

        {/* Diet Section */}
        <div className="space-y-4 animate-fade-in-up">
          <div className="flex items-center gap-3">
            <UtensilsCrossed className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Plano Alimentar</h2>
          </div>
          <div className="grid gap-4">
            {SAMPLE_MEALS.map((meal) => (
              <DietCard
                key={meal.id}
                meal={meal}
                completed={dietProgress[meal.id] || false}
                onToggle={toggleDiet}
              />
            ))}
          </div>
        </div>

        {/* Performance Chart */}
        <div className="animate-fade-in-up">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Performance</h2>
          </div>
          <PerformanceChart data={performanceLogs} />
        </div>
      </div>
    </div>
  );
}
