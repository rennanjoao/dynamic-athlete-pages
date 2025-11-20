import { CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Meal {
  id: string;
  refeicao: string;
  item: string;
}

interface DietCardProps {
  meal: Meal;
  completed: boolean;
  onToggle: (id: string) => void;
}

export const DietCard = ({ meal, completed, onToggle }: DietCardProps) => {
  return (
    <Card className="p-6 shadow-sm card-hover">
      <div className="flex justify-between items-center gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-2">{meal.refeicao}</h3>
          <p className="text-sm text-muted-foreground">{meal.item}</p>
        </div>
        <Button
          onClick={() => onToggle(meal.id)}
          variant={completed ? "default" : "outline"}
          size="sm"
          className="shrink-0"
        >
          {completed ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Feito
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
