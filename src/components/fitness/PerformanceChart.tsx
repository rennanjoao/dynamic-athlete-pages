import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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
      <div className="glass rounded-2xl p-8">
        <h2 className="text-xl font-bold mb-4 text-foreground">Performance dos Últimos 14 Dias</h2>
        <p className="text-muted-foreground text-center py-8">
          Nenhum dado de performance disponível ainda.
        </p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-8">
      <h2 className="text-xl font-bold mb-6 text-foreground">Performance dos Últimos 14 Dias</h2>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="gradientTreinos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(350, 89%, 50%)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="hsl(350, 89%, 50%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradientDieta" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(350, 100%, 60%)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(350, 100%, 60%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, 100]} fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "12px",
              backdropFilter: "blur(16px)",
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="treinos"
            name="Treinos (%)"
            stroke="hsl(var(--primary))"
            fill="url(#gradientTreinos)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="dieta"
            name="Dieta (%)"
            stroke="hsl(var(--primary-light))"
            fill="url(#gradientDieta)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
