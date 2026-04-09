/**
 * CoachDashboard.tsx — Visão do Coach (Refatorada)
 *
 * Filosofia: "Estado de Alerta" primeiro — quais alunos precisam de atenção AGORA.
 * Acesso ao PlanEditor em menos de 3 cliques.
 * Design: Clean, denso de informação mas sem ruído visual.
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  Users,
  TrendingUp,
  Bell,
  ChevronDown,
  X,
  Save,
  Pencil,
  Dumbbell,
  UtensilsCrossed,
  BarChart3,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

type AlertLevel = "critical" | "warning" | "ok";

interface StudentStatus {
  id: string;
  name: string;
  email: string;
  lastWorkout: string | null;   // ISO date
  lastMeal: string | null;
  alertLevel: AlertLevel;
  daysInactive: number;
  goal: string;
  currentWeight: number | null;
  targetWeight: number | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysSince(dateStr: string | null): number {
  if (!dateStr) return 999;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / 86_400_000);
}

function getAlertLevel(student: Omit<StudentStatus, "alertLevel" | "daysInactive">): AlertLevel {
  const days = daysSince(student.lastWorkout ?? student.lastMeal);
  if (days >= 3) return "critical";
  if (days >= 1) return "warning";
  return "ok";
}

// ─── Mock fetch (replace with real Supabase query joining tables) ─────────────

async function fetchStudentStatuses(): Promise<StudentStatus[]> {
  // TODO: Join student_profiles + workout_progress + diet_progress in a
  // Supabase RPC / view with admin RLS policy for coaches.
  // For now returns typed mock until backend view is created.
  const mock = [
    { id: "1", name: "Lucas Mendes",   email: "lucas@email.com",  lastWorkout: "2024-01-07", lastMeal: "2024-01-07", goal: "Hipertrofia",   currentWeight: 78,  targetWeight: 85 },
    { id: "2", name: "Ana Paula",      email: "ana@email.com",    lastWorkout: "2024-01-05", lastMeal: "2024-01-06", goal: "Emagrecimento", currentWeight: 68,  targetWeight: 60 },
    { id: "3", name: "Carlos Silva",   email: "carlos@email.com", lastWorkout: null,         lastMeal: "2024-01-04", goal: "Recomp.",       currentWeight: 90,  targetWeight: 85 },
    { id: "4", name: "Fernanda Costa", email: "fe@email.com",     lastWorkout: "2024-01-08", lastMeal: "2024-01-08", goal: "Performance",   currentWeight: 65,  targetWeight: 65 },
    { id: "5", name: "Rafael Lima",    email: "rafa@email.com",   lastWorkout: "2024-01-03", lastMeal: "2024-01-03", goal: "Hipertrofia",   currentWeight: 82,  targetWeight: 90 },
  ] as const;

  return mock.map((s) => ({
    ...s,
    daysInactive: daysSince(s.lastWorkout ?? s.lastMeal),
    alertLevel: getAlertLevel(s),
    lastWorkout: s.lastWorkout,
    lastMeal: s.lastMeal,
  }));
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
        style={{ background: `${accent}15` }}
      >
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-[#0F172A]">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

// ─── Alert Badge ──────────────────────────────────────────────────────────────

function AlertBadge({ level }: { level: AlertLevel }) {
  const map: Record<AlertLevel, { label: string; cls: string }> = {
    critical: { label: "Crítico",   cls: "bg-red-100 text-red-700 border-red-200" },
    warning:  { label: "Atenção",   cls: "bg-amber-100 text-amber-700 border-amber-200" },
    ok:       { label: "Em dia",    cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  };
  const { label, cls } = map[level];
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cls}`}>
      {label}
    </span>
  );
}

// ─── Plan Editor Sheet (quick inline edit) ────────────────────────────────────

function PlanEditorDialog({
  student,
  onClose,
}: {
  student: StudentStatus;
  onClose: () => void;
}) {
  const [calories, setCalories] = useState("2200");
  const [protein, setProtein] = useState("160");
  const [note, setNote] = useState("");
  const qc = useQueryClient();

  const save = () => {
    // TODO: persist to student's plan table
    toast.success(`Plano de ${student.name} atualizado!`);
    qc.invalidateQueries({ queryKey: ["students"] });
    onClose();
  };

  return (
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle className="text-base font-bold text-[#0F172A]">
          Editar Plano — {student.name}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4 pt-1">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-slate-500">Calorias/dia</Label>
            <Input
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className="mt-1 h-9 text-sm"
              type="number"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Proteína (g)</Label>
            <Input
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              className="mt-1 h-9 text-sm"
              type="number"
            />
          </div>
        </div>
        <div>
          <Label className="text-xs text-slate-500">Observação para o aluno</Label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ex: Aumentar proteína pós-treino..."
            className="mt-1 text-sm resize-none h-20"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" className="flex-1 bg-[#3B82F6] hover:bg-blue-600" onClick={save}>
            <Save className="w-3.5 h-3.5 mr-1.5" />
            Salvar
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

// ─── Student Row ──────────────────────────────────────────────────────────────

function StudentRow({
  student,
  onEdit,
}: {
  student: StudentStatus;
  onEdit: (s: StudentStatus) => void;
}) {
  const lastActivity =
    student.daysInactive === 0
      ? "Hoje"
      : student.daysInactive === 1
      ? "Ontem"
      : student.daysInactive >= 999
      ? "Nunca"
      : `${student.daysInactive}d atrás`;

  return (
    <div
      className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-colors
        ${
          student.alertLevel === "critical"
            ? "bg-red-50/60 border-red-100"
            : student.alertLevel === "warning"
            ? "bg-amber-50/50 border-amber-100"
            : "bg-white border-slate-100"
        }`}
    >
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
        style={{
          background:
            student.alertLevel === "critical"
              ? "#FEE2E2"
              : student.alertLevel === "warning"
              ? "#FEF9C3"
              : "#DBEAFE",
          color:
            student.alertLevel === "critical"
              ? "#DC2626"
              : student.alertLevel === "warning"
              ? "#D97706"
              : "#2563EB",
        }}
      >
        {student.name
          .split(" ")
          .slice(0, 2)
          .map((n) => n[0])
          .join("")}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-[#0F172A] truncate">
            {student.name}
          </p>
          <AlertBadge level={student.alertLevel} />
        </div>
        <p className="text-xs text-slate-400 truncate">
          {student.goal} · última atividade: {lastActivity}
        </p>
      </div>

      {/* Weight progress */}
      {student.currentWeight && student.targetWeight && (
        <div className="hidden sm:block text-right shrink-0">
          <p className="text-xs text-slate-400">Peso</p>
          <p className="text-sm font-semibold text-[#0F172A]">
            {student.currentWeight}
            <span className="text-slate-300"> / </span>
            <span className="text-blue-500">{student.targetWeight}</span> kg
          </p>
        </div>
      )}

      {/* Actions */}
      <button
        onClick={() => onEdit(student)}
        className="shrink-0 p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition-colors"
        title="Editar plano"
      >
        <Pencil className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CoachDashboard() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | AlertLevel>("all");
  const [editingStudent, setEditingStudent] = useState<StudentStatus | null>(null);

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: fetchStudentStatuses,
    refetchInterval: 60_000, // refresh every minute
  });

  const filtered = useMemo(() => {
    return students
      .filter((s) => {
        const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === "all" || s.alertLevel === filter;
        return matchSearch && matchFilter;
      })
      .sort((a, b) => {
        const order: Record<AlertLevel, number> = { critical: 0, warning: 1, ok: 2 };
        return order[a.alertLevel] - order[b.alertLevel];
      });
  }, [students, search, filter]);

  const stats = useMemo(
    () => ({
      total: students.length,
      critical: students.filter((s) => s.alertLevel === "critical").length,
      warning: students.filter((s) => s.alertLevel === "warning").length,
      ok: students.filter((s) => s.alertLevel === "ok").length,
    }),
    [students]
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-[#0F172A]">Painel Coach</h1>
            <p className="text-xs text-slate-400">
              {new Date().toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {stats.critical > 0 && (
              <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg">
                <Bell className="w-3.5 h-3.5" />
                {stats.critical} aluno{stats.critical > 1 ? "s" : ""} em alerta
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Total de alunos"
            value={stats.total}
            icon={<Users className="w-4 h-4" />}
            accent="#3B82F6"
          />
          <StatCard
            label="Em alerta crítico"
            value={stats.critical}
            icon={<AlertTriangle className="w-4 h-4" />}
            accent="#EF4444"
          />
          <StatCard
            label="Precisam atenção"
            value={stats.warning}
            icon={<Bell className="w-4 h-4" />}
            accent="#F59E0B"
          />
          <StatCard
            label="Em dia"
            value={stats.ok}
            icon={<CheckCircle2 className="w-4 h-4" />}
            accent="#10B981"
          />
        </div>

        {/* ── Alert Banner ── */}
        {stats.critical > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">
                {stats.critical} aluno{stats.critical > 1 ? "s" : ""} sem atividade há 3+ dias
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                Clique em "Editar" para ajustar o plano ou enviar um alerta personalizado.
              </p>
            </div>
          </div>
        )}

        {/* ── Filters ── */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar aluno..."
              className="pl-8 h-9 text-sm bg-white"
            />
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="w-36 h-9 text-sm bg-white">
              <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="critical">Crítico</SelectItem>
              <SelectItem value="warning">Atenção</SelectItem>
              <SelectItem value="ok">Em dia</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ── Student List ── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            Nenhum aluno encontrado.
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((s) => (
              <StudentRow key={s.id} student={s} onEdit={setEditingStudent} />
            ))}
          </div>
        )}

        {/* ── Quick Actions ── */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          {[
            { icon: <Dumbbell className="w-4 h-4" />, label: "Novo Treino", color: "#3B82F6" },
            { icon: <UtensilsCrossed className="w-4 h-4" />, label: "Novo Plano", color: "#10B981" },
            { icon: <BarChart3 className="w-4 h-4" />, label: "Relatório", color: "#8B5CF6" },
          ].map(({ icon, label, color }) => (
            <button
              key={label}
              className="flex flex-col items-center gap-2 py-4 rounded-xl border border-slate-100 bg-white
                hover:border-blue-200 hover:bg-blue-50/40 transition-colors"
            >
              <span style={{ color }}>{icon}</span>
              <span className="text-xs font-medium text-slate-600">{label}</span>
            </button>
          ))}
        </div>
      </main>

      {/* ── Plan Editor Dialog ── */}
      <Dialog open={!!editingStudent} onOpenChange={() => setEditingStudent(null)}>
        {editingStudent && (
          <PlanEditorDialog
            student={editingStudent}
            onClose={() => setEditingStudent(null)}
          />
        )}
      </Dialog>
    </div>
  );
}
