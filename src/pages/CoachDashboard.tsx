/**
 * CoachDashboard.tsx — Painel completo do Coach
 */

import { useState, useMemo, lazy, Suspense, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCoachStudents, type StudentStatus, type AlertLevel } from "@/hooks/useCoachStudents";
import { useLeads, type Lead } from "@/hooks/useLeads";
import { useCoachFinances, type FinanceRecord } from "@/hooks/useCoachFinances";
import {
  AlertTriangle, CheckCircle2, Search, Filter, Users, Pencil,
  Dumbbell, UtensilsCrossed, BarChart3, ClipboardList, ArrowLeft,
  Loader2, Plus, Trash2, DollarSign, UserPlus, Phone, Mail,
  TrendingUp, Calendar, Save, X, User, FileText, LogOut,
} from "lucide-react";
import CoachNotificationBell from "@/components/coach/CoachNotificationBell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const AnamnesisViewer = lazy(() => import("@/components/anamnesis/AnamnesisViewer"));
const ProtocolBuilder = lazy(() => import("@/components/coach/ProtocolBuilder"));

type CoachView = "list" | "anamnesis" | "protocol";

function useCoachId() {
  const [coachId, setCoachId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setCoachId(data.session?.user?.id || null);
    });
  }, []);
  return coachId;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ label, value, icon, accent }: { label: string; value: number | string; icon: React.ReactNode; accent: string }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: `${accent}15` }}>
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function AlertBadge({ level }: { level: AlertLevel }) {
  const map: Record<AlertLevel, { label: string; cls: string }> = {
    critical: { label: "Crítico", cls: "bg-red-100 text-red-700 border-red-200" },
    warning: { label: "Atenção", cls: "bg-amber-100 text-amber-700 border-amber-200" },
    ok: { label: "Em dia", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  };
  const { label, cls } = map[level] || map.ok;
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cls}`}>{label}</span>;
}

function StudentRow({
  student, onEdit, onAnamnesis, onProtocol, onUnlink,
}: {
  student: StudentStatus;
  onEdit: (s: StudentStatus) => void;
  onAnamnesis: (s: StudentStatus) => void;
  onProtocol: (s: StudentStatus) => void;
  onUnlink: (s: StudentStatus) => void;
}) {
  const lastActivity = student.daysInactive === 0 ? "Hoje" : student.daysInactive === 1 ? "Ontem" : student.daysInactive >= 999 ? "Sem registro" : `${student.daysInactive}d sem registro`;
  const safeName = student.name || "Aluno";
  const initials = safeName.split(" ").slice(0, 2).map((n) => n[0] || "").join("");

  return (
    <div className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-colors ${student.alertLevel === "critical" ? "bg-red-50/60 border-red-100 dark:bg-red-950/20 dark:border-red-900" : student.alertLevel === "warning" ? "bg-amber-50/50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900" : "bg-card border-border"}`}>
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 bg-primary/10 text-primary uppercase">{initials}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground truncate">{safeName}</p>
          <AlertBadge level={student.alertLevel || "ok"} />
        </div>
        <p className="text-xs text-muted-foreground truncate">{student.goal || "Objetivo não definido"} · {lastActivity}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={() => onAnamnesis(student)} className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary transition-colors"><ClipboardList className="w-4 h-4" /></button>
        <button onClick={() => onProtocol(student)} className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary transition-colors"><FileText className="w-4 h-4" /></button>
        <button onClick={() => onEdit(student)} className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary transition-colors"><Pencil className="w-4 h-4" /></button>
        <button onClick={() => onUnlink(student)} className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-destructive transition-colors"><X className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CoachDashboard() {
  const coachId = useCoachId();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | AlertLevel>("all");
  const [editingStudent, setEditingStudent] = useState<StudentStatus | null>(null);
  const [view, setView] = useState<CoachView>("list");
  const [selectedStudent, setSelectedStudent] = useState<StudentStatus | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<StudentStatus | null>(null);
  const qc = useQueryClient();

  const { data: students = [], isLoading } = useCoachStudents(coachId);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const matchSearch = (s.name || "").toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === "all" || s.alertLevel === filter;
      return matchSearch && matchFilter;
    });
  }, [students, search, filter]);

  const stats = useMemo(() => ({
    total: students.length,
    critical: students.filter((s) => s.alertLevel === "critical").length,
    warning: students.filter((s) => s.alertLevel === "warning").length,
    ok: students.filter((s) => s.alertLevel === "ok").length,
  }), [students]);

  // View control
  if (view !== "list" && selectedStudent) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => { setView("list"); setSelectedStudent(null); }}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-sm font-bold text-foreground">
              {view === "anamnesis" ? "Anamnese" : "Protocolo"} — {selectedStudent.name || "Aluno"}
            </h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-6">
          <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}>
            {view === "anamnesis" ? (
              <AnamnesisViewer studentId={selectedStudent.id} studentName={selectedStudent.name} />
            ) : (
              <ProtocolBuilder studentId={selectedStudent.id} studentName={selectedStudent.name} />
            )}
          </Suspense>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">Painel Coach</h1>
          </div>
          <div className="flex items-center gap-2">
            <CoachNotificationBell />
            
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive h-9">
              <LogOut className="w-4 h-4 mr-1.5" /> Sair
            </Button>
            
            <Button variant="outline" size="sm" onClick={() => setShowProfile(true)} className="gap-1.5 h-9">
              <User className="w-3.5 h-3.5" /> Perfil
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Tabs defaultValue="students" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="students"><Users className="w-4 h-4 mr-2" /> Alunos</TabsTrigger>
            <TabsTrigger value="finances"><DollarSign className="w-4 h-4 mr-2" /> Financeiro</TabsTrigger>
            <TabsTrigger value="leads"><TrendingUp className="w-4 h-4 mr-2" /> Leads</TabsTrigger>
          </TabsList>
          
          <TabsContent value="students" className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Total" value={stats.total} icon={<Users className="w-4 h-4" />} accent="#3B82F6" />
              <StatCard label="Crítico" value={stats.critical} icon={<AlertTriangle className="w-4 h-4" />} accent="#EF4444" />
              <StatCard label="Atenção" value={stats.warning} icon={<AlertTriangle className="w-4 h-4" />} accent="#F59E0B" />
              <StatCard label="Em dia" value={stats.ok} icon={<CheckCircle2 className="w-4 h-4" />} accent="#10B981" />
            </div>
            
            <div className="space-y-2">
                {filtered.map((s) => (
                  <StudentRow
                    key={s.id}
                    student={s}
                    onEdit={setEditingStudent}
                    onAnamnesis={(st) => { setSelectedStudent(st); setView("anamnesis"); }}
                    onProtocol={(st) => { setSelectedStudent(st); setView("protocol"); }}
                    onUnlink={(st) => setUnlinkTarget(st)}
                  />
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
