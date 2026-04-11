/**
 * ScoreCard.tsx — Card com pontuação total, nível e breakdown
 */

import { Trophy, Star, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const LEVELS = [
  { name: "Iniciante", min: 0, color: "text-slate-500" },
  { name: "Bronze", min: 500, color: "text-amber-700" },
  { name: "Prata", min: 2000, color: "text-slate-400" },
  { name: "Ouro", min: 5000, color: "text-yellow-500" },
  { name: "Diamante", min: 10000, color: "text-cyan-400" },
  { name: "Elite", min: 25000, color: "text-purple-500" },
];

export function getLevel(score: number) {
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (score >= LEVELS[i].min) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || null;
      break;
    }
  }
  return { current, next };
}

interface ScoreBreakdown {
  workout: number;
  diet: number;
  water: number;
  sleep: number;
}

interface Props {
  totalScore: number;
  todayScore: number;
  breakdown: ScoreBreakdown;
}

export default function ScoreCard({ totalScore, todayScore, breakdown }: Props) {
  const { current, next } = getLevel(totalScore);
  const progressToNext = next
    ? Math.min(((totalScore - current.min) / (next.min - current.min)) * 100, 100)
    : 100;

  return (
    <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 rounded-2xl p-4 text-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-300" />
          <span className="font-bold text-sm">Pontuação</span>
        </div>
        <Badge className="bg-white/20 text-white border-white/30 text-xs">
          <Star className={`w-3 h-3 mr-1 ${current.color}`} />
          {current.name}
        </Badge>
      </div>

      {/* Score display */}
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-3xl font-black tabular-nums">
          {totalScore.toLocaleString("pt-BR")}
        </span>
        <span className="text-sm text-blue-200">pts total</span>
      </div>
      <div className="flex items-center gap-1.5 mb-3">
        <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
        <span className="text-xs text-emerald-300 font-semibold">
          +{todayScore} pts hoje
        </span>
      </div>

      {/* Level progress */}
      {next && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-blue-200 mb-1">
            <span>{current.name}</span>
            <span>{next.name}</span>
          </div>
          <div className="h-2 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-yellow-300 transition-all duration-700"
              style={{ width: `${progressToNext}%` }}
            />
          </div>
          <p className="text-right text-xs text-blue-200 mt-1">
            {(next.min - totalScore).toLocaleString("pt-BR")} pts para {next.name}
          </p>
        </div>
      )}

      {/* Today's breakdown */}
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { label: "Treino", pts: breakdown.workout, max: 100, emoji: "🏋️" },
          { label: "Dieta", pts: breakdown.diet, max: 80, emoji: "🥗" },
          { label: "Água", pts: breakdown.water, max: 50, emoji: "💧" },
          { label: "Sono", pts: breakdown.sleep, max: 70, emoji: "😴" },
        ].map((item) => (
          <div key={item.label} className="bg-white/10 rounded-lg p-2 text-center">
            <span className="text-lg">{item.emoji}</span>
            <p className="text-xs font-bold mt-0.5">
              {item.pts}/{item.max}
            </p>
            <p className="text-[10px] text-blue-200">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
