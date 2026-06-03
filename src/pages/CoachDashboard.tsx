/**
 * CoachDashboard.tsx — Painel completo do Coach
 * Tabs: Alunos, Financeiro, Leads
 * Dados blindados contra retornos de JSON.
 */

import { useState, useMemo, lazy, Suspense, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCoachStudents, type StudentStatus, type AlertLevel } from "@/hooks/useCoachStudents";
import { useLeads, type Lead } from "@/hooks/useLeads";
import { useCoachFinances, type FinanceRecord } from "@/hooks/useCoachFinances";
import {
  AlertTriangle, CheckCircle2, Search, Filter, Users, Bell, Pencil,
  Dumbbell, UtensilsCrossed, BarChart3, ClipboardList, ArrowLeft,
  Loader2, Plus, Trash2, DollarSign, UserPlus, Phone, Mail,
  TrendingUp, Calendar, Save, X, User, FileText,
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
  const lastActivity =
    student.daysInactive === 0 ? "Hoje" :
    student.daysInactive === 1 ? "Ontem" :
    student.daysInactive >= 999 ? "Sem registro" :
    `${student.daysInactive}d sem registro`;

  const safeName = student.name || "Aluno";
  const initials = safeName.split(" ").slice(0, 2).map((n) => n[0] || "").join("");

  let displayWeight: string | number | undefined;
  if (typeof student.currentWeight === 'object' && student.currentWeight !== null) {
      displayWeight = (student.currentWeight as any).peso || (student.currentWeight as any).weight || undefined;
  } else {
      displayWeight = student.currentWeight as string | number | undefined;
  }

  return (
    <div className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-colors ${
      student.alertLevel === "critical" ? "bg-red-50/60 border-red-100 dark:bg-red-950/20 dark:border-red-900" :
      student.alertLevel === "warning" ? "bg-amber-50/50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900" :
      "bg-card border-border"
    }`}>
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 bg-primary/10 text-primary uppercase">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground truncate">{safeName}</p>
          <AlertBadge level={student.alertLevel || "ok"} />
        </div>
        <p className="text-xs text-muted-foreground truncate">{student.goal || "Objetivo não definido"} · {lastActivity}</p>
      </div>

      {displayWeight !== undefined && displayWeight !== null && (
        <div className="hidden sm:block text-right shrink-0">
          <p className="text-xs text-muted-foreground">Peso</p>
          <p className="text-sm font-semibold text-foreground">{displayWeight} kg</p>
        </div>
      )}

      <div className="flex items-center gap-1 shrink-0">
        <button onClick={() => onAnamnesis(student)} className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary transition-colors" title="Ver Anamnese">
          <ClipboardList className="w-4 h-4" />
        </button>
        <button onClick={() => onProtocol(student)} className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary transition-colors" title="Protocolo">
          <FileText className="w-4 h-4" />
        </button>
        <button onClick={() => onEdit(student)} className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary transition-colors" title="Editar Protocolo">
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
  const [form, setForm] = useState({ full_name: "", email: "", whatsapp: "", notes: "", source: "" });

  const addLead = useMutation({
    mutationFn: async () => {
      if (!form.full_name) throw new Error("Nome é obrigatório");
      const { error } = await supabase.from("coach_leads").insert({
        coach_id: coachId,
        full_name: form.full_name,
        email: form.email || null,
        whatsapp: form.whatsapp || null,
        notes: form.notes || null,
        source: form.source || null,
        status: "new",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lead adicionado!");
      setForm({ full_name: "", email: "", whatsapp: "", notes: "", source: "" });
      setShowAdd(false);
      qc.invalidateQueries({ queryKey: ["coach-leads"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("coach_leads").update({ status }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["coach-leads"] });
    toast.success("Status atualizado");
  };

  const [deleteLeadId, setDeleteLeadId] = useState<string | null>(null);
  const confirmDeleteLead = async () => {
    if (!deleteLeadId) return;
    await supabase.from("coach_leads").delete().eq("id", deleteLeadId);
    qc.invalidateQueries({ queryKey: ["coach-leads"] });
    toast.success("Lead removido");
    setDeleteLeadId(null);
  };


  const statusLabels: Record<string, { label: string; cls: string }> = {
    new: { label: "Novo", cls: "bg-blue-100 text-blue-700" },
    contacted: { label: "Em contato", cls: "bg-amber-100 text-amber-700" },
    negotiating: { label: "Negociando", cls: "bg-purple-100 text-purple-700" },
    converted: { label: "Convertido", cls: "bg-emerald-100 text-emerald-700" },
    lost: { label: "Perdido", cls: "bg-red-100 text-red-700" },
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
                <p className="text-sm font-semibold text-foreground">{lead.full_name}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  {lead.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</span>}
                  {lead.whatsapp && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.whatsapp}</span>}
                  {lead.source && <span>· {lead.source}</span>}
                </div>
                {lead.notes && <p className="text-xs text-muted-foreground mt-1">{lead.notes}</p>}
              </div>
              <Select value={lead.status} onValueChange={(v) => updateStatus(lead.id, v)}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([s, info]) => (
                    <SelectItem key={s} value={s} className="text-xs">{info.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button onClick={() => setDeleteLeadId(lead.id)} className="p-1.5 text-muted-foreground hover:text-destructive">
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
            <div><Label className="text-xs">Nome *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="mt-1 h-9 text-sm" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 h-9 text-sm" /></div>
              <div><Label className="text-xs">WhatsApp</Label><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className="mt-1 h-9 text-sm" /></div>
            </div>
            <div><Label className="text-xs">Origem</Label><Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="Instagram, indicação..." className="mt-1 h-9 text-sm" /></div>
            <div><Label className="text-xs">Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1 text-sm h-16" /></div>
            <Button onClick={() => addLead.mutate()} disabled={addLead.isPending} className="w-full">
              {addLead.isPending ? "Salvando..." : "Adicionar Lead"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteLeadId} onOpenChange={(o) => !o && setDeleteLeadId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover lead?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteLead} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Finances Tab ────────────────────────────────────────────────────────────

function FinancesTab({ coachId, students }: { coachId: string; students: StudentStatus[] }) {
  const { data: finances = [], isLoading } = useCoachFinances(coachId);
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    student_id: "",
    description: "",
    amount: "",
    due_date: "",
  });

  const addFinance = useMutation({
    mutationFn: async () => {
      if (!form.description || !form.amount) throw new Error("Descrição e valor são obrigatórios");
      const { error } = await supabase.from("coach_finances").insert({
        coach_id: coachId,
        student_id: form.student_id || null,
        description: form.description,
        amount: Number(form.amount),
        due_date: form.due_date || null,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Registro financeiro adicionado!");
      setForm({ student_id: "", description: "", amount: "", due_date: "" });
      setShowAdd(false);
      qc.invalidateQueries({ queryKey: ["coach-finances"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const togglePaid = async (id: string, currentlyPaid: boolean) => {
    await supabase.from("coach_finances").update({
      status: currentlyPaid ? "pending" : "paid",
      paid_at: currentlyPaid ? null : new Date().toISOString(),
    }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["coach-finances"] });
    toast.success(currentlyPaid ? "Marcado como pendente" : "Marcado como pago");
  };

  const deleteFinance = async (id: string) => {
    if (!confirm("Remover registro?")) return;
    await supabase.from("coach_finances").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["coach-finances"] });
  };

  const totalReceita = finances.filter((f) => f.status === "paid").reduce((s, f) => s + Number(f.amount), 0);
  const totalPendente = finances.filter((f) => f.status === "pending").reduce((s, f) => s + Number(f.amount), 0);
  const totalAtrasado = finances.filter((f) => f.status === "pending" && f.due_date && new Date(f.due_date) < new Date()).reduce((s, f) => s + Number(f.amount), 0);

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
                const isOverdue = f.status === "pending" && f.due_date && new Date(f.due_date) < new Date();
                return (
                  <TableRow key={f.id}>
                    <TableCell className="text-sm font-medium">{f.description}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{studentName || "—"}</TableCell>
                    <TableCell className="text-sm font-semibold text-right">R$ {Number(f.amount).toFixed(2)}</TableCell>
                    <TableCell className="text-xs">{f.due_date ? new Date(f.due_date).toLocaleDateString("pt-BR") : "—"}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => togglePaid(f.id, f.status === "paid")}
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full border cursor-pointer ${
                          f.status === "paid"
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                            : isOverdue
                              ? "bg-red-100 text-red-700 border-red-200"
                              : "bg-amber-100 text-amber-700 border-amber-200"
                        }`}
                      >
                        {f.status === "paid" ? "Pago" : isOverdue ? "Atrasado" : "Pendente"}
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
            <Button onClick={() => addFinance.mutate()} disabled={addFinance.isPending} className="w-full">
              {addFinance.isPending ? "Salvando..." : "Adicionar Registro"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── (Vínculo de aluno agora é automático via código de convite na anamnese) ─

// ─── Profile (team name) Dialog ──────────────────────────────────────────────

function ProfileDialog({ coachId, open, onClose }: { coachId: string; open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!open || !coachId) return;
    supabase
      .from("profiles")
      .select("full_name, team_name, invite_code")
      .eq("user_id", coachId)
      .maybeSingle()
      .then(({ data }) => {
        setFullName(data?.full_name || "");
        setTeamName(data?.team_name || "");
        setInviteCode((data as { invite_code?: string } | null)?.invite_code || "");
      });
  }, [open, coachId]);

  const generateCode = async () => {
    setGenerating(true);
    try {
      const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      for (let attempt = 0; attempt < 6; attempt++) {
        let code = "";
        for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
        const { data: exists } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("invite_code", code)
          .maybeSingle();
        if (!exists) {
          setInviteCode(code);
          toast.success("Código gerado. Lembre de salvar.");
          return;
        }
      }
      toast.error("Não foi possível gerar um código único. Tente de novo.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = async () => {
    if (!inviteCode) return;
    await navigator.clipboard.writeText(inviteCode);
    toast.success("Código copiado");
  };

  const save = async () => {
    setLoading(true);
    try {
      const code = inviteCode.trim().toUpperCase() || null;
      if (code) {
        const { data: clash } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("invite_code", code)
          .neq("user_id", coachId)
          .maybeSingle();
        if (clash) {
          toast.error("Este código já está em uso por outro coach.");
          setLoading(false);
          return;
        }
      }
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, team_name: teamName, invite_code: code })
        .eq("user_id", coachId);
      if (error) throw error;
      toast.success("Perfil atualizado");
      qc.invalidateQueries({ queryKey: ["coach-profile", coachId] });
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader><DialogTitle>Meu Perfil</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">Nome completo</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 h-9 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Nome da equipe / empresa</Label>
            <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Ex: Equipe Performance" className="mt-1 h-9 text-sm" />
          </div>
          <div className="rounded-lg border border-border bg-card/40 p-3 space-y-2">
            <Label className="text-xs text-primary uppercase tracking-wider">Código de convite</Label>
            <p className="text-[11px] text-muted-foreground">
              Compartilhe este código com seus alunos. Ao usá-lo na anamnese, o aluno é vinculado automaticamente a você.
            </p>
            <div className="flex gap-2">
              <Input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="EX: ELITE26"
                maxLength={12}
                className="h-9 text-sm font-mono tracking-widest uppercase"
              />
              <Button type="button" variant="outline" size="sm" onClick={generateCode} disabled={generating}>
                {generating ? "..." : "Gerar"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={copyCode} disabled={!inviteCode}>
                Copiar
              </Button>
            </div>
          </div>
          <Button onClick={save} disabled={loading} className="w-full">
            {loading ? "Salvando..." : "Salvar"}
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
  
  const [showProfile, setShowProfile] = useState(false);
  const qc = useQueryClient();

  const { data: students = [], isLoading } = useCoachStudents(coachId);

  const filtered = useMemo(() => {
    return students
      .filter((s) => {
        const safeName = s.name || "";
        const matchSearch = safeName.toLowerCase().includes(search.toLowerCase());
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
    await supabase.from("coach_students")
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
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {stats.critical > 0 && (
              <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400 text-xs font-semibold px-2.5 py-1.5 rounded-lg">
                <Bell className="w-3.5 h-3.5" />
                {stats.critical} aluno{stats.critical > 1 ? "s" : ""} em alerta
              </div>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowProfile(true)} className="gap-1.5">
              <User className="w-3.5 h-3.5" /> Perfil
            </Button>
          </div>
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
              <Select value={filter} onValueChange={(v) => setFilter(v as "all" | AlertLevel)}>
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
              <Button size="sm" variant="outline" onClick={() => setShowProfile(true)} className="h-9 gap-1.5">
                <UserPlus className="w-3.5 h-3.5" /> Meu código de convite
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
                    ? "Nenhum aluno vinculado ainda. Compartilhe seu código de convite — o aluno será vinculado automaticamente ao enviar a anamnese."
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
                    onProtocol={(st) => { setSelectedStudent(st); setView("protocol"); }}
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

        {coachId && <ProfileDialog coachId={coachId} open={showProfile} onClose={() => setShowProfile(false)} />}

        <Dialog open={!!editingStudent} onOpenChange={() => setEditingStudent(null)}>
          {editingStudent && (
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-base font-bold">Editar Protocolo — {editingStudent.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-1">
                <p className="text-sm text-muted-foreground">Abra o Protocolo para editar macros base, dieta, treino, ciclo e diretrizes.</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditingStudent(null)}>Cancelar</Button>
                  <Button size="sm" className="flex-1" onClick={() => {
                    setSelectedStudent(editingStudent);
                    setView("protocol");
                    setEditingStudent(null);
                  }}>
                    <FileText className="w-3.5 h-3.5 mr-1.5" /> Abrir Protocolo
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
