import { useEffect, useMemo, useRef, useState } from "react";
import { X, Play, Pause, RotateCcw, Check, Image as ImageIcon, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import WorkoutShareCard from "./WorkoutShareCard";

interface Exercise {
  name: string;
  sets?: number | string;
  reps?: string | number;
  rest?: string;
  notes?: string;
}
interface Day {
  key: string;
  focus?: string;
  exercises?: Exercise[];
}
interface Props {
  workouts: Day[];
  userId: string;
  coachName?: string;
  onClose: () => void;
}

type SessionState = {
  startedAt: number;
  selectedDay: string;
  completed: Record<string, number[]>; // exId -> setIndexes done
};

const todayKey = () => new Date().toISOString().slice(0, 10);
const exId = (dayKey: string, exIdx: number) => `${dayKey}::${exIdx}`;

function parseSets(s: Exercise["sets"]): number {
  if (typeof s === "number") return s;
  const m = String(s ?? "").match(/\d+/);
  return m ? Math.max(1, parseInt(m[0], 10)) : 3;
}
function parseRestSec(rest?: string): number {
  if (!rest) return 60;
  const str = rest.toLowerCase();
  const m = str.match(/(\d+)\s*(min|m|s|seg)?/);
  if (!m) return 60;
  const n = parseInt(m[1], 10);
  if (m[2] && m[2].startsWith("m")) return n * 60;
  return n;
}
function fmtMMSS(s: number) {
  const m = Math.floor(s / 60), sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export default function WorkoutMode({ workouts, userId, coachName, onClose }: Props) {
  const storageKey = `workout_session_${userId}_${todayKey()}`;
  const [selectedDay, setSelectedDay] = useState<string>(workouts[0]?.key ?? "");
  const [completed, setCompleted] = useState<Record<string, number[]>>({});
  const [startedAt, setStartedAt] = useState<number>(0);
  const [now, setNow] = useState<number>(Date.now());
  const [showShare, setShowShare] = useState(false);
  const [currentExIdx, setCurrentExIdx] = useState(0);

  // restore session
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const s: SessionState = JSON.parse(raw);
        setStartedAt(s.startedAt || Date.now());
        setSelectedDay(s.selectedDay || workouts[0]?.key || "");
        setCompleted(s.completed || {});
      } else {
        setStartedAt(Date.now());
      }
    } catch {
      setStartedAt(Date.now());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persist
  useEffect(() => {
    if (!startedAt) return;
    const s: SessionState = { startedAt, selectedDay, completed };
    localStorage.setItem(storageKey, JSON.stringify(s));
  }, [startedAt, selectedDay, completed, storageKey]);

  // clock for duration
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Rest timer
  const day = workouts.find((d) => d.key === selectedDay) ?? workouts[0];
  const exercises = day?.exercises ?? [];
  const currentEx = exercises[currentExIdx];
  const currentExSets = parseSets(currentEx?.sets);
  const currentExKey = day ? exId(day.key, currentExIdx) : "";
  const currentDoneSets = completed[currentExKey] ?? [];

  const defaultRest = parseRestSec(currentEx?.rest);
  const [restRemaining, setRestRemaining] = useState<number>(defaultRest);
  const [restRunning, setRestRunning] = useState<boolean>(false);
  const restRef = useRef<number | null>(null);

  useEffect(() => {
    setRestRemaining(defaultRest);
    setRestRunning(false);
  }, [defaultRest, currentExKey]);

  useEffect(() => {
    if (!restRunning) {
      if (restRef.current) window.clearInterval(restRef.current);
      return;
    }
    restRef.current = window.setInterval(() => {
      setRestRemaining((r) => {
        if (r <= 1) {
          setRestRunning(false);
          if (navigator.vibrate) navigator.vibrate(500);
          toast.success("Descanso finalizado!");
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (restRef.current) window.clearInterval(restRef.current);
    };
  }, [restRunning]);

  const toggleSet = (setIdx: number) => {
    setCompleted((prev) => {
      const arr = prev[currentExKey] ?? [];
      const next = arr.includes(setIdx) ? arr.filter((i) => i !== setIdx) : [...arr, setIdx];
      return { ...prev, [currentExKey]: next };
    });
    setRestRemaining(defaultRest);
    setRestRunning(true);
  };

  const isExerciseDone = (idx: number) => {
    const k = exId(day!.key, idx);
    return (completed[k]?.length ?? 0) >= parseSets(exercises[idx]?.sets);
  };

  const toggleExerciseDone = (idx: number) => {
    const k = exId(day!.key, idx);
    const total = parseSets(exercises[idx]?.sets);
    setCompleted((prev) => {
      const done = (prev[k]?.length ?? 0) >= total;
      if (done) return { ...prev, [k]: [] };
      return { ...prev, [k]: Array.from({ length: total }, (_, i) => i) };
    });
  };

  // progress
  const totalSetsDay = exercises.reduce((acc, e) => acc + parseSets(e.sets), 0);
  const doneSetsDay = exercises.reduce((acc, _, idx) => {
    return acc + (completed[exId(day!.key, idx)]?.length ?? 0);
  }, 0);
  const progressPct = totalSetsDay ? Math.round((doneSetsDay / totalSetsDay) * 100) : 0;
  const completedExCount = exercises.reduce((acc, _, idx) => acc + (isExerciseDone(idx) ? 1 : 0), 0);
  const hasAnyDone = completedExCount > 0 || doneSetsDay > 0;

  const elapsedSec = startedAt ? Math.floor((now - startedAt) / 1000) : 0;

  const handleClose = () => {
    if (hasAnyDone) {
      if (!confirm("Sair do modo treino? Seu progresso fica salvo neste dispositivo.")) return;
    }
    onClose();
  };

  const handleFinish = () => setShowShare(true);

  const handleSharedDone = () => {
    localStorage.removeItem(storageKey);
    setShowShare(false);
    onClose();
  };

  if (!day) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-muted-foreground mb-4">Nenhum treino disponível.</p>
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={handleClose}><X className="w-5 h-5" /></Button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground truncate">Treino {day.key} {day.focus ? `· ${day.focus}` : ""}</p>
          <p className="text-xs text-muted-foreground">{fmtMMSS(elapsedSec)} em andamento</p>
        </div>
        <Badge className="bg-primary text-primary-foreground animate-pulse">ATIVO</Badge>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 pb-32">
        {/* Rest timer */}
        <div style={{ backgroundColor: "#0f3460" }} className="rounded-xl p-5 text-center text-white">
          <p className="text-xs uppercase tracking-wider text-white/70">descanso entre séries</p>
          <p className="text-5xl font-black my-2 tabular-nums">{fmtMMSS(restRemaining)}</p>
          <div className="flex gap-2 justify-center mt-3">
            {!restRunning ? (
              <Button size="sm" onClick={() => setRestRunning(true)} className="bg-primary hover:bg-primary/90">
                <Play className="w-4 h-4" /> Iniciar
              </Button>
            ) : (
              <Button size="sm" onClick={() => setRestRunning(false)} variant="secondary">
                <Pause className="w-4 h-4" /> Pausar
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => { setRestRunning(false); setRestRemaining(defaultRest); }}
              className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white">
              <RotateCcw className="w-4 h-4" /> Reset
            </Button>
          </div>
        </div>

        {/* Day pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {workouts.map((d) => (
            <button
              key={d.key}
              onClick={() => { setSelectedDay(d.key); setCurrentExIdx(0); }}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                d.key === selectedDay
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card text-foreground border-border hover:bg-muted"
              }`}
            >
              {d.key}{d.focus ? ` · ${d.focus}` : ""}
            </button>
          ))}
        </div>

        {/* Sets bubbles */}
        {currentEx && (
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-sm">{currentEx.name}</p>
              <p className="text-xs text-muted-foreground">{currentDoneSets.length}/{currentExSets} séries</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: currentExSets }).map((_, i) => {
                const done = currentDoneSets.includes(i);
                const isCurrent = !done && i === Math.min(currentDoneSets.length, currentExSets - 1);
                return (
                  <button
                    key={i}
                    onClick={() => toggleSet(i)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
                      done
                        ? "bg-foreground text-background border-foreground"
                        : isCurrent
                          ? "border-primary text-primary"
                          : "border-border text-muted-foreground"
                    }`}
                  >
                    {done ? <Check className="w-4 h-4" /> : i + 1}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Exercises */}
        <div className="space-y-2">
          {exercises.map((ex, idx) => {
            const done = isExerciseDone(idx);
            const isCurrent = idx === currentExIdx;
            return (
              <div
                key={idx}
                onClick={() => setCurrentExIdx(idx)}
                className={`flex items-center gap-3 bg-card border rounded-xl p-3 cursor-pointer transition-all ${
                  isCurrent ? "border-primary shadow-[0_0_0_1px_hsl(var(--primary))]" : "border-border"
                }`}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); toggleExerciseDone(idx); }}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    done ? "bg-primary border-primary text-primary-foreground" : "border-border"
                  }`}
                >
                  {done && <Check className="w-4 h-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm truncate ${done ? "line-through text-muted-foreground" : ""}`}>{ex.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {parseSets(ex.sets)} × {ex.reps ?? "-"} · descanso {ex.rest ?? "-"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); toast.info("🚀 Em breve! Os GIFs dos movimentos estão chegando."); }}
                >
                  <ImageIcon className="w-4 h-4" /> GIF
                </Button>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold flex items-center gap-2"><Flame className="w-4 h-4 text-primary" /> Progresso</p>
            <p className="text-sm font-bold">{progressPct}%</p>
          </div>
          <Progress value={progressPct} />
          <p className="text-xs text-muted-foreground mt-2">{doneSetsDay}/{totalSetsDay} séries do treino</p>
        </div>
      </div>

      {/* Finish button */}
      {hasAnyDone && (
        <div className="fixed bottom-0 inset-x-0 p-4 bg-background/95 backdrop-blur border-t z-20">
          <div className="max-w-2xl mx-auto">
            <Button onClick={handleFinish} className="w-full h-12 text-base font-bold">
              Concluir treino
            </Button>
          </div>
        </div>
      )}

      {showShare && (
        <WorkoutShareCard
          workoutName={`${day.key}${day.focus ? ` · ${day.focus}` : ""}`}
          durationSec={elapsedSec}
          totalSets={doneSetsDay}
          completedExercises={completedExCount}
          coachName={coachName}
          onClose={handleSharedDone}
        />
      )}
    </div>
  );
}
