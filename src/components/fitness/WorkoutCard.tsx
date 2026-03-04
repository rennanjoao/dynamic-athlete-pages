import { CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Workout {
  id: string;
  nome: string;
  exercicios: string[];
}

interface WorkoutCardProps {
  workout: Workout;
  completed: boolean;
  onToggle: (id: string) => void;
}

export const WorkoutCard = ({ workout, completed, onToggle }: WorkoutCardProps) => {
  return (
    <Card className="p-6 shadow-sm card-hover glass-strong">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-foreground mb-3">{workout.nome}</h3>
          <ul className="space-y-2">
            {workout.exercicios.map((ex, i) => (
              <li key={i} className="text-sm text-muted-foreground pl-4 relative before:content-['•'] before:absolute before:left-0">
                {ex}
              </li>
            ))}
          </ul>
        </div>
        <Button
          onClick={() => onToggle(workout.id)}
          variant={completed ? "default" : "outline"}
          size="sm"
          className="shrink-0"
        >
          {completed ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Concluído
            </>
          ) : (
            <>
              <Circle className="w-4 h-4 mr-2" />
              Marcar
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};
