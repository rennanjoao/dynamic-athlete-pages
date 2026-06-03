import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Link2, Link2Off, Search, Users, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Profile {
  user_id: string;
  full_name: string | null;
  email: string | null;
}

interface CoachLink {
  student_id: string;
  coach_id: string;
  status: string;
  updated_at: string;
}

export function StudentLinksManagement() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [students, setStudents] = useState<Profile[]>([]);
  const [coaches, setCoaches] = useState<Profile[]>([]);
  const [links, setLinks] = useState<CoachLink[]>([]);
  const [search, setSearch] = useState("");
  const [pendingCoach, setPendingCoach] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: roles }, { data: profiles }, { data: linkRows }] = await Promise.all([
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("profiles").select("user_id, full_name, email"),
        supabase.from("coach_students").select("student_id, coach_id, status, updated_at"),
      ]);

      const profileMap = new Map<string, Profile>();
      (profiles ?? []).forEach((p) =>
        profileMap.set(p.user_id, { user_id: p.user_id, full_name: p.full_name, email: p.email }),
      );

      const coachIds = new Set<string>();
      const studentIds = new Set<string>();
      (roles ?? []).forEach((r) => {
        if (r.role === "coach" || r.role === "admin") coachIds.add(r.user_id);
        if (r.role === "user") studentIds.add(r.user_id);
      });

      const coachList: Profile[] = [...coachIds]
        .map((id) => profileMap.get(id) ?? { user_id: id, full_name: null, email: null })
        .sort((a, b) => (a.full_name ?? "").localeCompare(b.full_name ?? ""));

      const studentList: Profile[] = [...studentIds]
        .map((id) => profileMap.get(id) ?? { user_id: id, full_name: null, email: null })
        .sort((a, b) => (a.full_name ?? "").localeCompare(b.full_name ?? ""));

      setCoaches(coachList);
      setStudents(studentList);
      setLinks((linkRows ?? []) as CoachLink[]);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao carregar vínculos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const activeCoachByStudent = useMemo(() => {
    const m = new Map<string, CoachLink>();
    links.filter((l) => l.status === "active").forEach((l) => m.set(l.student_id, l));
    return m;
  }, [links]);

  const coachName = (id?: string | null) => {
    if (!id) return "—";
    const c = coaches.find((c) => c.user_id === id);
    return c?.full_name || c?.email || id.slice(0, 8);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        (s.full_name ?? "").toLowerCase().includes(q) ||
        (s.email ?? "").toLowerCase().includes(q),
    );
  }, [students, search]);

  const linkStudent = async (studentId: string, newCoachId: string) => {
    if (!newCoachId) {
      toast.error("Selecione um treinador");
      return;
    }
    setBusy(studentId);
    try {
      // Desativa qualquer vínculo ativo anterior do aluno com OUTRO coach
      await supabase
        .from("coach_students")
        .update({ status: "inactive" })
        .eq("student_id", studentId)
        .eq("status", "active")
        .neq("coach_id", newCoachId);

      // Verifica se já existe vínculo com este coach (mesmo inativo)
      const { data: existing } = await supabase
        .from("coach_students")
        .select("id, status")
        .eq("coach_id", newCoachId)
        .eq("student_id", studentId)
        .maybeSingle();

      if (existing) {
        if (existing.status !== "active") {
          await supabase
            .from("coach_students")
            .update({ status: "active" })
            .eq("id", existing.id);
        }
      } else {
        const { error } = await supabase
          .from("coach_students")
          .insert({ coach_id: newCoachId, student_id: studentId, status: "active" });
        if (error) throw error;
      }
      toast.success("Vínculo atualizado");
      setPendingCoach((p) => ({ ...p, [studentId]: "" }));
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao vincular");
    } finally {
      setBusy(null);
    }
  };

  const unlinkStudent = async (studentId: string, coachId: string) => {
    setBusy(studentId);
    try {
      const { error } = await supabase
        .from("coach_students")
        .update({ status: "inactive" })
        .eq("student_id", studentId)
        .eq("coach_id", coachId)
        .eq("status", "active");
      if (error) throw error;
      toast.success("Vínculo removido");
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao desvincular");
    } finally {
      setBusy(null);
    }
  };

  const totalLinked = activeCoachByStudent.size;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Vínculos Aluno × Treinador
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Visualize e gerencie a vinculação de cada aluno a um treinador. Cada aluno só pode ter um treinador ativo.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Badge variant="secondary" className="gap-1">
            <UserCheck className="w-3 h-3" /> {totalLinked} vinculados
          </Badge>
          <Badge variant="outline">{students.length - totalLinked} sem treinador</Badge>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar aluno por nome ou email…"
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum aluno encontrado.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => {
            const active = activeCoachByStudent.get(s.user_id);
            const pending = pendingCoach[s.user_id] ?? "";
            return (
              <div
                key={s.user_id}
                className="flex flex-col md:flex-row md:items-center gap-3 p-3 rounded-lg border border-border/60 bg-card/40"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{s.full_name || "Sem nome"}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.email || s.user_id.slice(0, 12)}</p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Treinador:</span>
                  {active ? (
                    <Badge variant="default" className="gap-1">
                      <Link2 className="w-3 h-3" /> {coachName(active.coach_id)}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">Sem vínculo</Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Select
                    value={pending}
                    onValueChange={(v) => setPendingCoach((p) => ({ ...p, [s.user_id]: v }))}
                  >
                    <SelectTrigger className="h-9 text-xs w-[200px]">
                      <SelectValue placeholder={active ? "Trocar treinador…" : "Vincular treinador…"} />
                    </SelectTrigger>
                    <SelectContent>
                      {coaches
                        .filter((c) => c.user_id !== active?.coach_id)
                        .map((c) => (
                          <SelectItem key={c.user_id} value={c.user_id}>
                            {c.full_name || c.email || c.user_id.slice(0, 8)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    disabled={!pending || busy === s.user_id}
                    onClick={() => linkStudent(s.user_id, pending)}
                  >
                    {busy === s.user_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Aplicar"}
                  </Button>
                  {active && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy === s.user_id}
                      onClick={() => unlinkStudent(s.user_id, active.coach_id)}
                      title="Remover vínculo"
                    >
                      <Link2Off className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
