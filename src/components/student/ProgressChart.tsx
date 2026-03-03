import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useMeasurements } from "@/hooks/useMeasurements";
import { TrendingUp } from "lucide-react";

export const ProgressChart = () => {
  const { bodyMeasurements, skinfoldMeasurements } = useMeasurements();

  const chartData = [...bodyMeasurements, ...skinfoldMeasurements]
    .sort((a, b) => new Date(a.measurement_date).getTime() - new Date(b.measurement_date).getTime())
    .slice(-14)
    .map((measurement) => ({
      date: new Date(measurement.measurement_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      gordura: measurement.body_fat_percentage || 0,
      peso: measurement.weight || 0,
    }));

  if (chartData.length === 0) {
    return (
      <div className="glass rounded-2xl p-8">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Evolução de Medidas</h2>
        </div>
        <p className="text-muted-foreground text-center py-8">
          Nenhuma medida registrada ainda.
        </p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-8">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">Evolução de Medidas</h2>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="gradientGordura" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(350, 89%, 50%)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="hsl(350, 89%, 50%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradientPeso" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(350, 100%, 60%)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(350, 100%, 60%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "12px",
              backdropFilter: "blur(16px)",
            }}
          />
          <Legend />
          <Area type="monotone" dataKey="gordura" name="% Gordura" stroke="hsl(var(--primary))" fill="url(#gradientGordura)" strokeWidth={2} />
          <Area type="monotone" dataKey="peso" name="Peso (kg)" stroke="hsl(var(--primary-light))" fill="url(#gradientPeso)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>

      {chartData.length > 1 && (
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="glass rounded-xl p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Mudança % Gordura</p>
            <p className="text-2xl font-bold text-gradient mt-1">
              {(chartData[chartData.length - 1].gordura - chartData[0].gordura).toFixed(1)}%
            </p>
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Mudança Peso</p>
            <p className="text-2xl font-bold text-gradient mt-1">
              {(chartData[chartData.length - 1].peso - chartData[0].peso).toFixed(1)} kg
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
