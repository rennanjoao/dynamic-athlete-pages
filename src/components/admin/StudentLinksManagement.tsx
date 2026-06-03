import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Loader2,
  Link2,
  Link2Off,
  Search,
  Users,
  UserCog,
  Filter,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Role = "admin" | "coach" | "user";

interface Person {
  user_id: string;
  full_name: string | null;
  email: string | null;
  roles: Role[];
}

interface CoachLink {
  student_id: string;
  coach_id: string;
  status: string;
  updated_at: string;
}

type FilterMode = "all" | "students" | "coaches";

export function StudentLinksManagement() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [links, setLinks] = useState<CoachLink[]>([]);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<FilterMode>("students");
  const [openFor, setOpenFor] = useState<string | null>(null);
  const [pendingCoach, setPendingCoach] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: roles }, { data: profiles }, { data: linkRows }] = await Promise.all([
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("profiles").select("user_id, full_name, email"),
        supabase.from("coach_students").select("student_id, coach_id, status, updated_at"),
      ]);

      const rolesMap = new Map<string, Role[]>();
      (roles ?? []).forEach((r) => {
        const arr = rolesMap.get(r.user_id) ?? [];
        arr.push(r.role as Role);
        rolesMap.set(r.user_id, arr);
      });

      const profileMap = new Map<string, { full_name: string | null; email: string | null }>();
      (profiles ?? []).forEach((p) => profileMap.set(p.user_id, { full_name: p.full_name, email: p.email }));

      const merged: Person[] = [];
      const allUserIds = new Set<string>([...rolesMap.keys(), ...profileMap.keys()]);
      allUserIds.forEach((uid) => {
        merged.push({
          user_id: uid,
          full_name: profileMap.get(uid)?.full_name ?? null,
          email: profileMap.get(uid)?.email ?? null,
          roles: rolesMap.get(uid) ?? [],
        });
      });

      merged.sort((a, b) => (a.full_name ?? "").localeCompare(b.full_name ?? ""));
      setPeople(merged);
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

  const isCoach = (p: Person) => p.roles.includes("coach") || p.roles.includes("admin");
  const isStudent = (p: Person) => !isCoach(p);

  const coaches = useMemo(() => people.filter(isCoach), [people]);
  const students = useMemo(() => people.filter(isStudent), [people]);

  const activeCoachByStudent = useMemo(() => {
    const m = new Map<string, CoachLink>();
    links.filter((l) => l.status === "active").forEach((l) => m.set(l.student_id, l));
    return m;
  }, [links]);

  const studentCountByCoach = useMemo(() => {
    const m = new Map<string, number>();
    activeCoachByStudent.forEach((l) => m.set(l.coach_id, (m.get(l.coach_id) ?? 0) + 1));
    return m;
  }, [activeCoachByStudent]);

  const coachName = (id?: string | null) => {
    if (!id) return "—";
    const c = coaches.find((c) => c.user_id === id);
    return c?.full_name || c?.email || id.slice(0, 8);
  };

  const filtered = useMemo(() => {
    const base =
      mode === "students" ? students : mode === "coaches" ? coaches : people;
    const q = search.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (p) =>
        (p.full_name ?? "").toLowerCase().includes(q) ||
        (p.email ?? "").toLowerCase().includes(q),
    );
  }, [mode, people, students, coaches, search]);

  const linkStudent = async (studentId: string, newCoachId: string) => {
    if (!newCoachId) return;
    setBusy(studentId);
    try {
      await supabase
        .from("coach_students")
        .update({ status: "inactive" })
        .eq("student_id", studentId)
        .eq("status", "active")
        .neq("coach_id", newCoachId);

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
      setOpenFor(null);
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

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Vínculos</h2>
          <Badge variant="secondary" className="text-[10px]">
            {activeCoachByStudent.size} ativos
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Select value={mode} onValueChange={(v) => setMode(v as FilterMode)}>
            <SelectTrigger className="h-8 text-xs w-[160px]">
              <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos ({people.length})</SelectItem>
              <SelectItem value="students">Alunos ({students.length})</SelectItem>
              <SelectItem value="coaches">Treinadores ({coaches.length})</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou email…"
          className="pl-8 h-9 text-sm"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">
          Nenhum {mode === "coaches" ? "treinador" : mode === "students" ? "aluno" : "usuário"} encontrado.
        </p>
      ) : (
        <ul className="divide-y divide-border/50">
          {filtered.map((p) => {
            const coach = isCoach(p);
            const active = activeCoachByStudent.get(p.user_id);
            const pending = pendingCoach[p.user_id] ?? "";
            const popoverOpen = openFor === p.user_id;

            return (
              <li
                key={p.user_id}
                className="flex items-center gap-3 py-2 text-sm"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">
                      {p.full_name || "Sem nome"}
                    </span>
                    {coach ? (
                      <Badge variant="outline" className="text-[9px] gap-1 py-0 h-4">
                        <UserCog className="w-2.5 h-2.5" />
                        {p.roles.includes("admin") ? "Admin" : "Coach"}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {p.email || p.user_id.slice(0, 12)}
                  </p>
                </div>

                {coach ? (
                  <Badge variant="secondary" className="text-[10px]">
                    {studentCountByCoach.get(p.user_id) ?? 0} alunos
                  </Badge>
                ) : (
                  <>
                    {active ? (
                      <Badge variant="default" className="gap-1 text-[10px]">
                        <Link2 className="w-2.5 h-2.5" />
                        {coachName(active.coach_id)}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        Sem vínculo
                      </Badge>
                    )}

                    <Popover
                      open={popoverOpen}
                      onOpenChange={(o) => setOpenFor(o ? p.user_id : null)}
                    >
                      <PopoverTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                          {active ? "Trocar" : "Vincular"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-64 p-3 space-y-2">
                        <p className="text-xs font-medium">Treinador</p>
                        <Select
                          value={pending}
                          onValueChange={(v) =>
                            setPendingCoach((map) => ({ ...map, [p.user_id]: v }))
                          }
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Selecionar…" />
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
                        <div className="flex items-center justify-between gap-2 pt-1">
                          {active && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-[11px] gap-1 text-destructive hover:text-destructive"
                              disabled={busy === p.user_id}
                              onClick={() => unlinkStudent(p.user_id, active.coach_id)}
                            >
                              <Link2Off className="w-3 h-3" /> Desvincular
                            </Button>
                          )}
                          <Button
                            size="sm"
                            className="ml-auto h-7 text-[11px]"
                            disabled={!pending || busy === p.user_id}
                            onClick={() => linkStudent(p.user_id, pending)}
                          >
                            {busy === p.user_id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              "Aplicar"
                            )}
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
