import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useMeasurements } from "@/hooks/useMeasurements";
import { TrendingUp } from "lucide-react";

export const ProgressChart = () => {
  const { bodyMeasurements, skinfoldMeasurements } = useMeasurements();

  const chartData = [...bodyMeasurements, ...skinfoldMeasurements]
    .sort((a, b) => new Date(a.measurement_date).getTime() - new Date(b.measurement_date).getTime())
    .slice(-14) // Last 14 measurements
    .map((measurement) => ({
      date: new Date(measurement.measurement_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      gordura: measurement.body_fat_percentage || 0,
      peso: measurement.weight || 0,
    }));

  if (chartData.length === 0) {
    return (
      <Card className="p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Evolução de Medidas</h2>
        </div>
        <p className="text-muted-foreground text-center py-8">
          Nenhuma medida registrada ainda. Registre suas medidas para acompanhar sua evolução!
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-8 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Evolução de Medidas</h2>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
          <YAxis stroke="hsl(var(--muted-foreground))" />
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
            dataKey="gordura"
            name="% Gordura"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--primary))" }}
          />
          <Line
            type="monotone"
            dataKey="peso"
            name="Peso (kg)"
            stroke="hsl(var(--primary-light))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--primary-light))" }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-6 grid grid-cols-2 gap-4">
        {chartData.length > 1 && (
          <>
            <div className="bg-primary/10 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Mudança % Gordura</p>
              <p className="text-2xl font-bold text-primary">
                {(chartData[chartData.length - 1].gordura - chartData[0].gordura).toFixed(1)}%
              </p>
            </div>
            <div className="bg-primary/10 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Mudança Peso</p>
              <p className="text-2xl font-bold text-primary">
                {(chartData[chartData.length - 1].peso - chartData[0].peso).toFixed(1)} kg
              </p>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};
