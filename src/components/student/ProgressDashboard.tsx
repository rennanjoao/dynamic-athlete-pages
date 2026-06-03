/**
 * ProgressDashboard.tsx
 * Painel de evolução moderno e gamificado para o aluno.
 * - AreaChart com gradient, tooltip customizado e deltas.
 * - Cards de resumo (Peso, Gordura, Streak).
 * - Tabs para alternar métrica (Peso / Gordura / Cintura).
 */

import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import { useStudentData } from "@/hooks/useStudentData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown, TrendingUp, Flame, Scale, Percent, Ruler } from "lucide-react";

type MetricKey = "peso" | "gordura" | "cintura";

interface Point {
  idx: number;
  label: string;
  dateFull: string;
  peso: number;
  gordura: number;
  cintura: number;
}

const METRIC_META: Record<MetricKey, { label: string; unit: string; icon: typeof Scale; color: string }> = {
  peso: { label: "Peso", unit: "kg", icon: Scale, color: "hsl(var(--primary))" },
  gordura: { label: "Gordura", unit: "%", icon: Percent, color: "hsl(var(--primary))" },
  cintura: { label: "Cintura", unit: "cm", icon: Ruler, color: "hsl(var(--primary))" },
};

// RFM — Relative Fat Mass
const calcBF = (altura: number, cintura: number, genero: string) => {
  if (!altura || !cintura) return 0;
  const rfm = genero === "M" ? 64 - 20 * (altura / cintura) : 76 - 20 * (altura / cintura);
  return Math.max(2, Math.round(rfm * 10) / 10);
};

const fmt = (v: number, unit: string) => `${v.toFixed(1)} ${unit}`;

interface DeltaProps {
  delta: number;
  unit: string;
  goodDown?: boolean;
}
const DeltaBadge = ({ delta, unit, goodDown = true }: DeltaProps) => {
  if (!isFinite(delta) || delta === 0) {
    return <Badge variant="secondary" className="text-[10px]">— 0 {unit}</Badge>;
  }
  const isPositive = delta > 0;
  const isGood = goodDown ? !isPositive : isPositive;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  return (
    <Badge
      variant="outline"
      className={`text-[10px] gap-1 border-0 ${
        isGood
          ? "bg-emerald-500/15 text-emerald-400"
          : "bg-primary/15 text-primary"
      }`}
    >
      <Icon className="w-3 h-3" />
      {isPositive ? "+" : ""}
      {delta.toFixed(1)} {unit}
    </Badge>
  );
};

interface SummaryCardProps {
  icon: typeof Scale;
  label: string;
  value: string;
  delta?: React.ReactNode;
  accent?: string;
}
const SummaryCard = ({ icon: Icon, label, value, delta, accent }: SummaryCardProps) => (
  <Card className="bg-card/60 border-border/60 backdrop-blur">
    <CardContent className="p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className={`w-3.5 h-3.5 ${accent ?? ""}`} />
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground mt-2 leading-none">{value}</p>
      {delta && <div className="mt-2">{delta}</div>}
    </CardContent>
  </Card>
);

const CustomTooltip = ({
  active,
  payload,
  metric,
}: TooltipProps<number, string> & { metric: MetricKey }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as Point & { delta: number };
  const meta = METRIC_META[metric];
  const val = p[metric];
  const isGood = p.delta <= 0;
  return (
    <div className="rounded-lg border border-border/60 bg-background/95 backdrop-blur px-3 py-2 shadow-xl text-xs">
      <p className="font-semibold text-foreground">
        Check-in {p.idx} <span className="text-muted-foreground font-normal">· {p.dateFull}</span>
      </p>
      <p className="text-foreground mt-1">
        {meta.label}: <span className="font-bold">{fmt(val, meta.unit)}</span>
      </p>
      {p.idx > 1 && isFinite(p.delta) && p.delta !== 0 && (
        <p className={`mt-0.5 ${isGood ? "text-emerald-400" : "text-primary"}`}>
          {p.delta > 0 ? "▲ +" : "▼ "}
          {p.delta.toFixed(1)} {meta.unit} vs. anterior
        </p>
      )}
    </div>
  );
};

export const ProgressDashboard = () => {
  const { anamnesis, checkIns, loading } = useStudentData();
  const [metric, setMetric] = useState<MetricKey>("peso");

  const points = useMemo<Point[]>(() => {
    const baseline = anamnesis?.baseline_metrics || {};
    const payloadAna = (anamnesis?.payload as Record<string, unknown>) || {};
    const altura = Number(baseline.altura || 0);
    const genero = (payloadAna.genero as string) || "M";

    const raw: Array<Point & { ts: number }> = [];

    if (anamnesis?.submitted_at && baseline.peso) {
      const cintura = Number(baseline.cintura || 0);
      raw.push({
        idx: 0,
        ts: new Date(anamnesis.submitted_at).getTime(),
        label: new Date(anamnesis.submitted_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        dateFull: new Date(anamnesis.submitted_at).toLocaleDateString("pt-BR"),
        peso: Number(baseline.peso),
        cintura,
        gordura: calcBF(altura, cintura, genero),
      });
    }

    (checkIns || []).forEach((chk) => {
      if (!chk.current_metrics || !chk.submitted_at) return;
      const peso = Number(chk.current_metrics.peso || 0);
      if (!peso) return;
      const cintura = Number(chk.current_metrics.cintura || 0);
      raw.push({
        idx: 0,
        ts: new Date(chk.submitted_at).getTime(),
        label: new Date(chk.submitted_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        dateFull: new Date(chk.submitted_at).toLocaleDateString("pt-BR"),
        peso,
        cintura,
        gordura: calcBF(altura, cintura, genero),
      });
    });

    return raw
      .sort((a, b) => a.ts - b.ts)
      .slice(-14)
      .map((p, i) => ({ ...p, idx: i + 1 }));
  }, [anamnesis, checkIns]);

  const chartData = useMemo(() => {
    return points.map((p, i) => ({
      ...p,
      delta: i === 0 ? 0 : p[metric] - points[i - 1][metric],
    }));
  }, [points, metric]);

  // Streak: número de check-ins consecutivos (até 14 dias entre eles)
  const streak = useMemo(() => {
    const sorted = [...(checkIns || [])]
      .filter((c) => c.submitted_at)
      .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
    if (sorted.length === 0) return 0;
    let count = 1;
    for (let i = 0; i < sorted.length - 1; i++) {
      const diffDays =
        (new Date(sorted[i].submitted_at).getTime() - new Date(sorted[i + 1].submitted_at).getTime()) /
        86_400_000;
      if (diffDays <= 21) count++;
      else break;
    }
    return count;
  }, [checkIns]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <Card className="bg-card/60 border-border/60">
        <CardContent className="p-8 text-center">
          <Scale className="w-10 h-10 text-primary/60 mx-auto mb-3" />
          <h3 className="font-semibold text-foreground">Sem dados ainda</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Envie sua Anamnese para iniciar a linha do tempo.
          </p>
        </CardContent>
      </Card>
    );
  }

  const first = points[0];
  const last = points[points.length - 1];
  const deltaPeso = last.peso - first.peso;
  const deltaGordura = last.gordura - first.gordura;

  return (
    <div className="space-y-5">
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard
          icon={Scale}
          label="Peso atual"
          value={fmt(last.peso, "kg")}
          accent="text-primary"
          delta={<DeltaBadge delta={deltaPeso} unit="kg" />}
        />
        <SummaryCard
          icon={Percent}
          label="Gordura estimada"
          value={`${last.gordura.toFixed(1)}%`}
          accent="text-primary"
          delta={<DeltaBadge delta={deltaGordura} unit="%" />}
        />
        <SummaryCard
          icon={Flame}
          label="Sequência"
          value={`🔥 ${streak}`}
          accent="text-primary"
          delta={
            <span className="text-[10px] text-muted-foreground">
              {streak === 0
                ? "Faça seu 1º check-in"
                : streak === 1
                ? "quinzena registrada"
                : "quinzenas seguidas"}
            </span>
          }
        />
      </div>

      {/* Tabs + gráfico */}
      <Card className="bg-card/60 border-border/60">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-foreground">Linha do tempo</h3>
              <p className="text-[11px] text-muted-foreground">
                {points.length} registro{points.length > 1 ? "s" : ""} · últimos 14
              </p>
            </div>
            <Tabs value={metric} onValueChange={(v) => setMetric(v as MetricKey)}>
              <TabsList className="grid grid-cols-3 h-9">
                <TabsTrigger value="peso" className="text-xs">Peso</TabsTrigger>
                <TabsTrigger value="gordura" className="text-xs">Gordura</TabsTrigger>
                <TabsTrigger value="cintura" className="text-xs">Cintura</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradMetric" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  strokeOpacity={0.15}
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
                <Tooltip content={<CustomTooltip metric={metric} />} cursor={{ stroke: "hsl(var(--primary))", strokeOpacity: 0.3, strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey={metric}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  fill="url(#gradMetric)"
                  isAnimationActive
                  animationDuration={600}
                  dot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressDashboard;
