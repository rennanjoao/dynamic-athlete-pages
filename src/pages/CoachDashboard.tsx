/**
 * CoachDashboard.tsx — Painel completo do Coach
 * Tabs: Alunos, Financeiro, Leads
 * Dados reais do banco de dados via coach_students
 */

import { useState, useMemo, lazy, Suspense, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertTriangle, CheckCircle2, Search, Filter, Users, Bell, Pencil,
  Dumbbell, UtensilsCrossed, BarChart3, ClipboardList, ArrowLeft,
  Loader2, Plus, Trash2, DollarSign, UserPlus, Phone, Mail,
  TrendingUp, Calendar, Save, X,
} from "lucide-react";
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
import { toast } from "sonner";

const AnamnesisViewer = lazy(() => import("@/components/anamnesis/AnamnesisViewer"));
const RoutineBuilder = lazy(() => import("@/components/coach/RoutineBuilder"));

// ─── Types ───────────────────────────────────────────────────────────────────

type AlertLevel = "critical" | "warning" | "ok";
type CoachView = "list" | "anamnesis" | "routine";

interface StudentStatus {
  id: string;
  name: string;
  email: string;
  lastWorkout: string | null;
  lastMeal: string | null;
  alertLevel: AlertLevel;
  daysInactive: number;
  goal: string;
  currentWeight: number | null;
  targetWeight: number | null;
}

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  notes: string | null;
  source: string | null;
  created_at: string;
}

interface FinanceRecord {
  id: string;
  student_id: string | null;
  student_name?: string;
  description: string;
  amount: number;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  category: string;
  created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysSince(dateStr: string | null): number {
  if (!dateStr) return 999;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function getAlertLevel(lastWorkout: string | null, lastMeal: string | null): AlertLevel {
  const days = daysSince(lastWorkout ?? lastMeal);
  if (days >= 3) return "critical";
  if (days >= 1) return "warning";
  return "ok";
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useCoachId() {
  const [coachId, setCoachId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setCoachId(data.session?.user?.id || null);
    });
  }, []);
  return coachId;
}

function useCoachStudents(coachId: string | null) {
  return useQuery({
    queryKey: ["coach-students", coachId],
    queryFn: async (): Promise<StudentStatus[]> => {
      if (!coachId) return [];

      // Get linked students
      const { data: links } = await (supabase as any)
        .from("coach_students")
        .select("student_id")
        .eq("coach_id", coachId)
        .eq("status", "active");

      if (!links || links.length === 0) return [];
      const studentIds = links.map((l: any) => l.student_id);

      // Get profiles
      const { data: profiles } = await supabase
        .from("student_profiles")
        .select("user_id, full_name")
        .in("user_id", studentIds);

      // Get latest workout/diet progress per student
      const students: StudentStatus[] = [];
      for (const sid of studentIds) {
        const profile = profiles?.find((p) => p.user_id === sid);

        const { data: lastW } = await supabase
          .from("workout_progress")
          .select("completed_at")
          .eq("user_id", sid)
          .eq("completed", true)
          .order("completed_at", { ascending: false })
          .limit(1);

        const { data: lastD } = await supabase
          .from("diet_progress")
          .select("completed_at")
          .eq("user_id", sid)
          .eq("completed", true)
          .order("completed_at", { ascending: false })
          .limit(1);

        // Get plan
        const { data: plan } = await supabase
          .from("coach_plans")
          .select("goal")
          .eq("student_id", sid)
          .eq("coach_id", coachId)
          .limit(1);

        // Get latest weight
        const { data: bm } = await supabase
          .from("body_measurements")
          .select("weight")
          .eq("user_id", sid)
          .order("measurement_date", { ascending: false })
          .limit(1);

        const lastWorkout = lastW?.[0]?.completed_at || null;
        const lastMeal = lastD?.[0]?.completed_at || null;

        students.push({
          id: sid,
          name: profile?.full_name || "Aluno",
          email: "",
          lastWorkout,
          lastMeal,
          alertLevel: getAlertLevel(lastWorkout, lastMeal),
          daysInactive: daysSince(lastWorkout ?? lastMeal),
          goal: plan?.[0]?.goal || "—",
          currentWeight: bm?.[0]?.weight ? Number(bm[0].weight) : null,
          targetWeight: null,
        });
      }

      return students.sort((a, b) => {
        const order: Record<AlertLevel, number> = { critical: 0, warning: 1, ok: 2 };
        return order[a.alertLevel] - order[b.alertLevel];
      });
    },
    enabled: !!coachId,
    refetchInterval: 60_000,
  });
}

function useLeads(coachId: string | null) {
  return useQuery({
    queryKey: ["coach-leads", coachId],
    queryFn: async (): Promise<Lead[]> => {
      if (!coachId) return [];
      const { data } = await (supabase as any)
        .from("coach_leads")
        .select("*")
        .eq("coach_id", coachId)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!coachId,
  });
}

function useFinances(coachId: string | null) {
  return useQuery({
    queryKey: ["coach-finances", coachId],
    queryFn: async (): Promise<FinanceRecord[]> => {
      if (!coachId) return [];
      const { data } = await (supabase as any)
        .from("coach_finances")
        .select("*")
        .eq("coach_id", coachId)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!coachId,
  });
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
  const { label, cls } = map[level];
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cls}`}>{label}</span>;
}

function StudentRow({
  student, onEdit, onAnamnesis, onRoutine, onUnlink,
}: {
  student: StudentStatus;
  onEdit: (s: StudentStatus) => void;
  onAnamnesis: (s: StudentStatus) => void;
  onRoutine: (s: StudentStatus) => void;
  onUnlink: (s: StudentStatus) => void;
}) {
  const lastActivity =
    student.daysInactive === 0 ? "Hoje" :
    student.daysInactive === 1 ? "Ontem" :
    student.daysInactive >= 999 ? "Nunca" :
    `${student.daysInactive}d atrás`;

  return (
    <div className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-colors ${
      student.alertLevel === "critical" ? "bg-red-50/60 border-red-100 dark:bg-red-950/20 dark:border-red-900" :
      student.alertLevel === "warning" ? "bg-amber-50/50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900" :
      "bg-card border-border"
    }`}>
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 bg-primary/10 text-primary">
        {student.name.split(" ").slice(0, 2).map((n) => n[0]).join("")}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground truncate">{student.name}</p>
          <AlertBadge level={student.alertLevel} />
        </div>
        <p className="text-xs text-muted-foreground truncate">{student.goal} · {lastActivity}</p>
      </div>
      {student.currentWeight && (
        <div className="hidden sm:block text-right shrink-0">
          <p className="text-xs text-muted-foreground">Peso</p>
          <p className="text-sm font-semibold text-foreground">{student.currentWeight} kg</p>
        </div>
      )}
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={() => onAnamnesis(student)} className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary transition-colors" title="Ver Anamnese">
          <ClipboardList className="w-4 h-4" />
        </button>
        <button onClick={() => onRoutine(student)} className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary transition-colors" title="Criar Rotina">
          <Dumbbell className="w-4 h-4" />
        </button>
        <button onClick={() => onEdit(student)} className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary transition-colors" title="Editar Plano">
          <Pencil className="w-4 h-4" />
        </button>
        <button onClick={() => onUnlink(student)} className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-destructive transition-colors" title="Desvincular">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Leads Tab ───────────────────────────────────────────────────────────────

function LeadsTab({ coachId }: { coachId: string }) {
  const { data: leads = [], isLoading } = useLeads(coachId);
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "", source: "" });

  const addLead = useMutation({
    mutationFn: async () => {
      if (!form.name) throw new Error("Nome é obrigatório");
      const { error } = await (supabase as any).from("coach_leads").insert({
        coach_id: coachId,
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        notes: form.notes || null,
        source: form.source || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lead adicionado!");
      setForm({ name: "", email: "", phone: "", notes: "", source: "" });
      setShowAdd(false);
      qc.invalidateQueries({ queryKey: ["coach-leads"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateStatus = async (id: string, status: string) => {
    await (supabase as any).from("coach_leads").update({ status }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["coach-leads"] });
    toast.success("Status atualizado");
  };

  const deleteLead = async (id: string) => {
    if (!confirm("Remover lead?")) return;
    await (supabase as any).from("coach_leads").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["coach-leads"] });
    toast.success("Lead removido");
  };

  const statusColors: Record<string, string> = {
    novo: "bg-blue-100 text-blue-700",
    contato: "bg-amber-100 text-amber-700",
    negociando: "bg-purple-100 text-purple-700",
    convertido: "bg-emerald-100 text-emerald-700",
    perdido: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Leads</h3>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Novo Lead
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : leads.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum lead cadastrado.</p>
      ) : (
        <div className="space-y-2">
          {leads.map((lead) => (
            <div key={lead.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{lead.name}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  {lead.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</span>}
                  {lead.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>}
                  {lead.source && <span>· {lead.source}</span>}
                </div>
                {lead.notes && <p className="text-xs text-muted-foreground mt-1">{lead.notes}</p>}
              </div>
              <Select value={lead.status} onValueChange={(v) => updateStatus(lead.id, v)}>
                <SelectTrigger className="w-28 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(statusColors).map((s) => (
                    <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button onClick={() => deleteLead(lead.id)} className="p-1.5 text-muted-foreground hover:text-destructive">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>Novo Lead</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-xs">Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 h-9 text-sm" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 h-9 text-sm" /></div>
              <div><Label className="text-xs">Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 h-9 text-sm" /></div>
            </div>
            <div><Label className="text-xs">Origem</Label><Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="Instagram, indicação..." className="mt-1 h-9 text-sm" /></div>
            <div><Label className="text-xs">Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1 text-sm h-16" /></div>
            <Button onClick={() => addLead.mutate()} disabled={addLead.isPending} className="w-full">
              {addLead.isPending ? "Salvando..." : "Adicionar Lead"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Finances Tab ────────────────────────────────────────────────────────────

function FinancesTab({ coachId, students }: { coachId: string; students: StudentStatus[] }) {
  const { data: finances = [], isLoading } = useFinances(coachId);
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    student_id: "",
    description: "",
    amount: "",
    due_date: "",
    category: "mensalidade",
  });

  const addFinance = useMutation({
    mutationFn: async () => {
      if (!form.description || !form.amount) throw new Error("Descrição e valor são obrigatórios");
      const { error } = await (supabase as any).from("coach_finances").insert({
        coach_id: coachId,
        student_id: form.student_id || null,
        description: form.description,
        amount: Number(form.amount),
        due_date: form.due_date || null,
        category: form.category,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Registro financeiro adicionado!");
      setForm({ student_id: "", description: "", amount: "", due_date: "", category: "mensalidade" });
      setShowAdd(false);
      qc.invalidateQueries({ queryKey: ["coach-finances"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const togglePaid = async (id: string, currentlyPaid: boolean) => {
    await (supabase as any).from("coach_finances").update({
      status: currentlyPaid ? "pendente" : "pago",
      paid_at: currentlyPaid ? null : new Date().toISOString(),
    }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["coach-finances"] });
    toast.success(currentlyPaid ? "Marcado como pendente" : "Marcado como pago");
  };

  const deleteFinance = async (id: string) => {
    if (!confirm("Remover registro?")) return;
    await (supabase as any).from("coach_finances").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["coach-finances"] });
  };

  const totalReceita = finances.filter((f) => f.status === "pago").reduce((s, f) => s + Number(f.amount), 0);
  const totalPendente = finances.filter((f) => f.status === "pendente").reduce((s, f) => s + Number(f.amount), 0);
  const totalAtrasado = finances.filter((f) => f.status === "pendente" && f.due_date && new Date(f.due_date) < new Date()).reduce((s, f) => s + Number(f.amount), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Receita (pago)" value={`R$ ${totalReceita.toFixed(0)}`} icon={<DollarSign className="w-4 h-4" />} accent="#10B981" />
        <StatCard label="Pendente" value={`R$ ${totalPendente.toFixed(0)}`} icon={<Calendar className="w-4 h-4" />} accent="#F59E0B" />
        <StatCard label="Atrasado" value={`R$ ${totalAtrasado.toFixed(0)}`} icon={<AlertTriangle className="w-4 h-4" />} accent="#EF4444" />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Registros Financeiros</h3>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Novo Registro
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : finances.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum registro financeiro.</p>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Descrição</TableHead>
                <TableHead className="text-xs">Aluno</TableHead>
                <TableHead className="text-xs text-right">Valor</TableHead>
                <TableHead className="text-xs">Vencimento</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {finances.map((f) => {
                const studentName = students.find((s) => s.id === f.student_id)?.name;
                const isOverdue = f.status === "pendente" && f.due_date && new Date(f.due_date) < new Date();
                return (
                  <TableRow key={f.id}>
                    <TableCell className="text-sm font-medium">{f.description}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{studentName || "—"}</TableCell>
                    <TableCell className="text-sm font-semibold text-right">R$ {Number(f.amount).toFixed(2)}</TableCell>
                    <TableCell className="text-xs">{f.due_date ? new Date(f.due_date).toLocaleDateString("pt-BR") : "—"}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => togglePaid(f.id, f.status === "pago")}
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full border cursor-pointer ${
                          f.status === "pago"
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                            : isOverdue
                              ? "bg-red-100 text-red-700 border-red-200"
                              : "bg-amber-100 text-amber-700 border-amber-200"
                        }`}
                      >
                        {f.status === "pago" ? "Pago" : isOverdue ? "Atrasado" : "Pendente"}
                      </button>
                    </TableCell>
                    <TableCell>
                      <button onClick={() => deleteFinance(f.id)} className="p-1 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>Novo Registro Financeiro</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-xs">Descrição *</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex: Mensalidade Janeiro" className="mt-1 h-9 text-sm" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Valor (R$) *</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="mt-1 h-9 text-sm" /></div>
              <div><Label className="text-xs">Vencimento</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="mt-1 h-9 text-sm" /></div>
            </div>
            <div>
              <Label className="text-xs">Aluno (opcional)</Label>
              <Select value={form.student_id} onValueChange={(v) => setForm({ ...form, student_id: v })}>
                <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Selecionar aluno" /></SelectTrigger>
                <SelectContent>
                  {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensalidade">Mensalidade</SelectItem>
                  <SelectItem value="avulso">Avulso</SelectItem>
                  <SelectItem value="pacote">Pacote</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => addFinance.mutate()} disabled={addFinance.isPending} className="w-full">
              {addFinance.isPending ? "Salvando..." : "Adicionar Registro"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Link Student Dialog ─────────────────────────────────────────────────────

function LinkStudentDialog({ coachId, open, onClose }: { coachId: string; open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const handleLink = async () => {
    if (!email) { toast.error("Digite o email do aluno"); return; }
    setLoading(true);
    try {
      // Find student by email in profiles
      // We need to use edge function for this since we can't query auth.users
      const { data: profiles } = await supabase
        .from("student_profiles")
        .select("user_id, full_name");

      // Since we can't search by email from client, we search all and check
      // This is a workaround - in production you'd use an edge function
      if (!profiles || profiles.length === 0) {
        toast.error("Nenhum aluno encontrado. O aluno precisa estar cadastrado.");
        return;
      }

      // For now, let user input user_id or search by name
      const found = profiles.find(
        (p) => p.full_name?.toLowerCase().includes(email.toLowerCase())
      );

      if (!found) {
        toast.error("Aluno não encontrado. Busque pelo nome cadastrado.");
        return;
      }

      const { error } = await (supabase as any).from("coach_students").insert({
        coach_id: coachId,
        student_id: found.user_id,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("Este aluno já está vinculado.");
        } else {
          throw error;
        }
        return;
      }

      toast.success(`${found.full_name} vinculado com sucesso!`);
      setEmail("");
      onClose();
      qc.invalidateQueries({ queryKey: ["coach-students"] });
    } catch (e: any) {
      toast.error(e.message || "Erro ao vincular aluno");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader><DialogTitle>Vincular Aluno</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">Nome do aluno</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Busque pelo nome cadastrado" className="mt-1 h-9 text-sm" />
          </div>
          <Button onClick={handleLink} disabled={loading} className="w-full">
            {loading ? "Vinculando..." : "Vincular Aluno"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const qc = useQueryClient();

  const { data: students = [], isLoading } = useCoachStudents(coachId);

  const filtered = useMemo(() => {
    return students
      .filter((s) => {
        const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
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

  const goBack = () => { setView("list"); setSelectedStudent(null); };

  const handleUnlink = async (student: StudentStatus) => {
    if (!confirm(`Desvincular ${student.name}?`)) return;
    await (supabase as any).from("coach_students")
      .update({ status: "inactive" })
      .eq("coach_id", coachId)
      .eq("student_id", student.id);
    qc.invalidateQueries({ queryKey: ["coach-students"] });
    toast.success("Aluno desvinculado");
  };

  // Detail views
  if (view !== "list" && selectedStudent) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={goBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-sm font-bold text-foreground">
              {view === "anamnesis" ? "Anamnese" : "Criar Rotina"} — {selectedStudent.name}
            </h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-6">
          <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}>
            {view === "anamnesis" ? (
              <AnamnesisViewer studentId={selectedStudent.id} studentName={selectedStudent.name} />
            ) : (
              <RoutineBuilder studentId={selectedStudent.id} studentName={selectedStudent.name} onClose={goBack} />
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
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          {stats.critical > 0 && (
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400 text-xs font-semibold px-2.5 py-1.5 rounded-lg">
              <Bell className="w-3.5 h-3.5" />
              {stats.critical} aluno{stats.critical > 1 ? "s" : ""} em alerta
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Tabs defaultValue="students" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="students" className="gap-1.5 text-xs sm:text-sm">
              <Users className="w-3.5 h-3.5" /> Alunos
            </TabsTrigger>
            <TabsTrigger value="finances" className="gap-1.5 text-xs sm:text-sm">
              <DollarSign className="w-3.5 h-3.5" /> Financeiro
            </TabsTrigger>
            <TabsTrigger value="leads" className="gap-1.5 text-xs sm:text-sm">
              <TrendingUp className="w-3.5 h-3.5" /> Leads
            </TabsTrigger>
          </TabsList>

          {/* ── Students Tab ── */}
          <TabsContent value="students" className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Total de alunos" value={stats.total} icon={<Users className="w-4 h-4" />} accent="#3B82F6" />
              <StatCard label="Em alerta crítico" value={stats.critical} icon={<AlertTriangle className="w-4 h-4" />} accent="#EF4444" />
              <StatCard label="Precisam atenção" value={stats.warning} icon={<Bell className="w-4 h-4" />} accent="#F59E0B" />
              <StatCard label="Em dia" value={stats.ok} icon={<CheckCircle2 className="w-4 h-4" />} accent="#10B981" />
            </div>

            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar aluno..." className="pl-8 h-9 text-sm" />
              </div>
              <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
                <SelectTrigger className="w-36 h-9 text-sm">
                  <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Filtrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="critical">Crítico</SelectItem>
                  <SelectItem value="warning">Atenção</SelectItem>
                  <SelectItem value="ok">Em dia</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={() => setShowLinkDialog(true)} className="h-9 gap-1.5">
                <UserPlus className="w-3.5 h-3.5" /> Vincular Aluno
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {students.length === 0
                    ? "Nenhum aluno vinculado. Clique em 'Vincular Aluno' para começar."
                    : "Nenhum aluno encontrado com os filtros atuais."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((s) => (
                  <StudentRow
                    key={s.id}
                    student={s}
                    onEdit={setEditingStudent}
                    onAnamnesis={(st) => { setSelectedStudent(st); setView("anamnesis"); }}
                    onRoutine={(st) => { setSelectedStudent(st); setView("routine"); }}
                    onUnlink={handleUnlink}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Finances Tab ── */}
          <TabsContent value="finances">
            {coachId && <FinancesTab coachId={coachId} students={students} />}
          </TabsContent>

          {/* ── Leads Tab ── */}
          <TabsContent value="leads">
            {coachId && <LeadsTab coachId={coachId} />}
          </TabsContent>
        </Tabs>

        {coachId && <LinkStudentDialog coachId={coachId} open={showLinkDialog} onClose={() => setShowLinkDialog(false)} />}

        <Dialog open={!!editingStudent} onOpenChange={() => setEditingStudent(null)}>
          {editingStudent && (
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-base font-bold">Editar Plano — {editingStudent.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-1">
                <p className="text-sm text-muted-foreground">Use o RoutineBuilder para editar o plano completo de dieta e treino.</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditingStudent(null)}>Cancelar</Button>
                  <Button size="sm" className="flex-1" onClick={() => {
                    setSelectedStudent(editingStudent);
                    setView("routine");
                    setEditingStudent(null);
                  }}>
                    <Dumbbell className="w-3.5 h-3.5 mr-1.5" /> Abrir Rotina
                  </Button>
                </div>
              </div>
            </DialogContent>
          )}
        </Dialog>
      </main>
    </div>
  );
}
