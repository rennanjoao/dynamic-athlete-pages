/**
 * RankingTeaser.tsx — Top 3 alunos por pontuação
 * Respeita is_anonymous: exibe "Anônimo" se true
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, Award } from "lucide-react";

interface RankedStudent {
  position: number;
  name: string;
  score: number;
}

const PODIUM_STYLES = [
  { icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-50 border-yellow-200", ring: "ring-yellow-300" },
  { icon: Medal, color: "text-slate-400", bg: "bg-slate-50 border-slate-200", ring: "ring-slate-300" },
  { icon: Award, color: "text-amber-600", bg: "bg-amber-50 border-amber-200", ring: "ring-amber-300" },
];

export default function RankingTeaser() {
  const { data: ranking = [], isLoading } = useQuery({
    queryKey: ["ranking-top3"],
    queryFn: async () => {
      // Aggregate total daily_score per user from performance_logs
      const { data: logs } = await (supabase as any)
        .from("performance_logs")
        .select("user_id, daily_score, is_anonymous")
        .order("daily_score", { ascending: false });

      if (!logs || logs.length === 0) return [];

      // Aggregate scores per user
      const userScores: Record<string, { score: number; anonymous: boolean }> = {};
      for (const log of logs) {
        if (!userScores[log.user_id]) {
          userScores[log.user_id] = { score: 0, anonymous: !!log.is_anonymous };
        }
        userScores[log.user_id].score += (log.daily_score ?? 0);
      }

      const userIds = Object.keys(userScores);

      // Fetch names for non-anonymous users
      const { data: profiles } = await supabase
        .from("student_profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const nameMap: Record<string, string> = {};
      (profiles ?? []).forEach((p) => {
        nameMap[p.user_id] = p.full_name;
      });

      const sorted = userIds
        .map((uid) => ({
          userId: uid,
          score: userScores[uid].score,
          anonymous: userScores[uid].anonymous,
          name: userScores[uid].anonymous
            ? "Anônimo"
            : nameMap[uid]?.split(" ")[0] || "Aluno",
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      return sorted.map((s, i) => ({
        position: i + 1,
        name: s.name,
        score: s.score,
      }));
    },
    staleTime: 5 * 60_000,
  });

  if (isLoading || ranking.length === 0) return null;

  return (
    <div className="rounded-2xl border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Trophy className="w-4 h-4 text-yellow-500" />
        <h3 className="text-sm font-bold text-foreground">Ranking Top 3</h3>
      </div>
      <div className="space-y-2">
        {ranking.map((student, i) => {
          const style = PODIUM_STYLES[i] || PODIUM_STYLES[2];
          const Icon = style.icon;
          return (
            <div
              key={i}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${style.bg} transition-all`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${style.bg} ring-2 ${style.ring}`}>
                <Icon className={`w-4 h-4 ${style.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {student.name}
                </p>
              </div>
              <span className="text-sm font-bold tabular-nums text-foreground">
                {student.score.toLocaleString("pt-BR")} pts
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
