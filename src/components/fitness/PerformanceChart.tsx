import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface PerformanceLog {
  date: string;
  workouts_completed: number;
  meals_completed: number;
  total_workouts: number;
  total_meals: number;
}

interface PerformanceChartProps {
  data: PerformanceLog[];
}

export const PerformanceChart = ({ data }: PerformanceChartProps) => {
  const chartData = data.map((log) => ({
    date: new Date(log.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    treinos: log.total_workouts > 0 ? Math.round((log.workouts_completed / log.total_workouts) * 100) : 0,
    dieta: log.total_meals > 0 ? Math.round((log.meals_completed / log.total_meals) * 100) : 0,
  }));

  if (chartData.length === 0) {
    return (
      <Card className="p-8 shadow-sm">
        <h2 className="text-2xl font-bold mb-4 text-foreground">Performance dos Últimos 14 Dias</h2>
        <p className="text-muted-foreground text-center py-8">
          Nenhum dado de performance disponível ainda. Complete treinos e refeições para ver seu progresso!
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-8 shadow-sm">
      <h2 className="text-2xl font-bold mb-6 text-foreground">Performance dos Últimos 14 Dias</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
          <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="treinos"
            name="Treinos (%)"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--primary))" }}
          />
          <Line
            type="monotone"
            dataKey="dieta"
            name="Dieta (%)"
            stroke="hsl(var(--primary-light))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--primary-light))" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
