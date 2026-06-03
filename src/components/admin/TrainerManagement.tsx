import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus, Users, Trash2, Shield, Mail, Key, Dices, LockKeyhole } from "lucide-react";

interface Trainer {
  id: string;
  email: string;
  full_name: string | null;
  team_name: string | null;
  notification_email: string | null;
  role: string;
  created_at: string;
  invite_code?: string | null;
}

interface ProfileInviteInfo {
  user_id: string;
  invite_code: string | null;
  notification_email: string | null;
}

interface ManageTrainersResponse {
  trainers?: Trainer[];
  error?: string;
}

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message || fallback : fallback;

export const TrainerManagement = () => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newTrainer, setNewTrainer] = useState({
    email: "",
    password: "",
    fullName: "",
    teamName: "",
    notificationEmail: "",
    role: "coach" as "coach" | "user",
  });

  useEffect(() => { loadTrainers(); }, []);

  const loadTrainers = async () => {
    const { data, error } = await supabase.functions.invoke<ManageTrainersResponse>("manage-trainers", {
      body: { action: "list" },
    });
    
    if (!error && data?.trainers) {
      // Fazemos um fetch extra na tabela profiles para garantir compatibilidade com dados antigos.
      const ids = data.trainers.map((t) => t.id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, invite_code, notification_email')
        .in('user_id', ids);

      const mergedTrainers = data.trainers.map((t) => {
        const profile = (profiles as ProfileInviteInfo[] | null)?.find(p => p.user_id === t.id);
        return {
          ...t,
          invite_code: t.invite_code || profile?.invite_code || null,
          notification_email: t.notification_email || profile?.notification_email || null,
        };
      });

      setTrainers(mergedTrainers);
    }
  };

  const handleCreateTrainer = async () => {
    if (!newTrainer.email || !newTrainer.password || !newTrainer.fullName) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (newTrainer.password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-trainers", {
        body: {
          action: "create",
          email: newTrainer.email,
          password: newTrainer.password,
          fullName: newTrainer.fullName,
          teamName: newTrainer.teamName || null,
          notificationEmail: newTrainer.notificationEmail || newTrainer.email,
          role: newTrainer.role,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`${newTrainer.role === "coach" ? "Coach" : "Treinador"} criado com sucesso!`);
      setNewTrainer({ email: "", password: "", fullName: "", teamName: "", notificationEmail: "", role: "coach" });
      setShowDialog(false);
      loadTrainers();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Erro ao criar"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateNotificationEmail = async (trainerId: string, email: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ notification_email: email })
        .eq("user_id", trainerId);
      if (error) throw error;
      toast.success("Email de notificação atualizado!");
      loadTrainers();
    } catch {
      toast.error("Erro ao atualizar email");
    }
  };

  const handleUpdateInviteCode = async (trainerId: string, newCode: string) => {
    try {
      const code = newCode.trim().toUpperCase();
      if (!code) throw new Error("O código não pode estar vazio.");

      const { error } = await supabase
        .from("profiles")
        .update({ invite_code: code })
        .eq("user_id", trainerId);
        
      if (error) {
        // Trata erro de UNIQUE constraint se o código já existir
        if (error.code === '23505') throw new Error("Este código já está em uso por outro profissional.");
        throw error;
      }
      
      toast.success("Código de convite salvo!");
      loadTrainers();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Erro ao salvar código"));
    }
  };

  const handleUpdatePassword = async (trainerId: string, password: string) => {
    try {
      if (password.length < 6) throw new Error("A senha deve ter no mínimo 6 caracteres");
      const { data, error } = await supabase.functions.invoke("manage-trainers", {
        body: { action: "update-password", trainerId, password },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Senha atualizada com sucesso!");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Erro ao atualizar senha"));
    }
  };

  const handleDeleteTrainer = async (trainerId: string) => {
    if (!confirm("Tem certeza que deseja remover este profissional?")) return;
    try {
      const { data, error } = await supabase.functions.invoke("manage-trainers", {
        body: { action: "delete", trainerId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Profissional removido");
      loadTrainers();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Erro ao remover"));
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Gestão de Profissionais</h2>
        </div>
        <Button onClick={() => setShowDialog(true)} size="sm" className="gap-2">
          <UserPlus className="w-4 h-4" />
          Novo Profissional
        </Button>
      </div>

      {trainers.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Nenhum profissional cadastrado ainda.
        </p>
      ) : (
        <div className="space-y-2">
          {trainers.map((trainer) => (
            <TrainerRow
              key={trainer.id}
              trainer={trainer}
              onDelete={handleDeleteTrainer}
              onUpdateEmail={handleUpdateNotificationEmail}
              onUpdateCode={handleUpdateInviteCode}
              onUpdatePassword={handleUpdatePassword}
            />
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Criar Novo Profissional</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Tipo</Label>
              <Select value={newTrainer.role} onValueChange={(v) => setNewTrainer({ ...newTrainer, role: v as "coach" | "user" })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="coach">Coach / Treinador</SelectItem>
                  <SelectItem value="user">Aluno</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nome Completo *</Label>
              <Input placeholder="Nome do profissional" value={newTrainer.fullName}
                onChange={(e) => setNewTrainer({ ...newTrainer, fullName: e.target.value })} />
            </div>
            <div>
              <Label>Nome da Equipe</Label>
              <Input placeholder="Ex: Team Elite, Studio Fit" value={newTrainer.teamName}
                onChange={(e) => setNewTrainer({ ...newTrainer, teamName: e.target.value })} />
            </div>
            <div>
              <Label>Email de login *</Label>
              <Input type="email" placeholder="email@exemplo.com" value={newTrainer.email}
                onChange={(e) => setNewTrainer({ ...newTrainer, email: e.target.value })} />
            </div>
            <div>
              <Label>Email para receber notificações dos alunos</Label>
              <p className="text-[11px] text-muted-foreground mb-1">
                Se diferente do login. Deixe vazio para usar o mesmo.
              </p>
              <Input type="email" placeholder="notificacoes@exemplo.com" value={newTrainer.notificationEmail}
                onChange={(e) => setNewTrainer({ ...newTrainer, notificationEmail: e.target.value })} />
            </div>
            <div>
              <Label>Senha *</Label>
              <Input type="password" placeholder="Mínimo 6 caracteres" value={newTrainer.password}
                onChange={(e) => setNewTrainer({ ...newTrainer, password: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateTrainer} disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar Profissional"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

/* ── Linha do treinador com edição inline ─────────── */
function TrainerRow({ trainer, onDelete, onUpdateEmail, onUpdateCode, onUpdatePassword }: {
  trainer: Trainer;
  onDelete: (id: string) => void;
  onUpdateEmail: (id: string, email: string) => void;
  onUpdateCode: (id: string, code: string) => void;
  onUpdatePassword: (id: string, password: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editingCode, setEditingCode] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [emailVal, setEmailVal] = useState(trainer.notification_email || trainer.email || "");
  const [codeVal, setCodeVal] = useState(trainer.invite_code || "");
  const [passwordVal, setPasswordVal] = useState("");

  const generateRandomCode = () => {
    setCodeVal(Math.random().toString(36).substring(2, 8).toUpperCase());
  };

  return (
    <div className="p-3 rounded-lg bg-secondary/30 border border-border/50 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-4 h-4 text-primary" />
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{trainer.full_name || "Sem nome"}</p>
              <Badge variant={trainer.role === "coach" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                {trainer.role === "coach" ? "Coach" : "Aluno"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {trainer.email}{trainer.team_name ? ` · ${trainer.team_name}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => { setEditingCode(!editingCode); setEditing(false); setEditingPassword(false); }} title="Editar código de convite">
            <Key className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setEditing(!editing); setEditingCode(false); setEditingPassword(false); }} title="Editar email de notificação">
            <Mail className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setEditingPassword(!editingPassword); setEditing(false); setEditingCode(false); }} title="Alterar senha de acesso">
            <LockKeyhole className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(trainer.id)} className="text-destructive hover:text-destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {editing && (
        <div className="flex gap-2 items-center pt-1 border-t border-border/20 mt-2">
          <div className="flex-1">
            <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Email de notificação dos alunos</p>
            <Input
              type="email"
              value={emailVal}
              onChange={e => setEmailVal(e.target.value)}
              placeholder="email@exemplo.com"
              className="h-8 text-xs"
            />
          </div>
          <Button size="sm" className="mt-4 h-8 text-xs" onClick={() => { onUpdateEmail(trainer.id, emailVal); setEditing(false); }}>
            Salvar
          </Button>
        </div>
      )}

      {editingCode && (
        <div className="flex gap-2 items-center pt-1 border-t border-border/20 mt-2">
          <div className="flex-1">
            <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Código de Convite</p>
            <div className="flex gap-2">
              <Input
                type="text"
                value={codeVal}
                onChange={e => setCodeVal(e.target.value.toUpperCase())}
                placeholder="Ex: ELITE2026"
                className="h-8 text-xs font-mono uppercase"
              />
              <Button size="sm" variant="outline" className="h-8 px-2 shrink-0" onClick={generateRandomCode} title="Gerar código aleatório">
                <Dices className="w-4 h-4 text-primary" />
              </Button>
            </div>
          </div>
          <Button size="sm" className="mt-4 h-8 text-xs" onClick={() => { onUpdateCode(trainer.id, codeVal); setEditingCode(false); }}>
            Salvar
          </Button>
        </div>
      )}

      {editingPassword && (
        <div className="flex gap-2 items-center pt-1 border-t border-border/20 mt-2">
          <div className="flex-1">
            <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Nova senha de acesso</p>
            <Input
              type="password"
              value={passwordVal}
              onChange={e => setPasswordVal(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="h-8 text-xs"
            />
          </div>
          <Button size="sm" className="mt-4 h-8 text-xs" onClick={() => { onUpdatePassword(trainer.id, passwordVal); setPasswordVal(""); setEditingPassword(false); }}>
            Salvar
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Mail className="w-3 h-3" />
          Notificações: {trainer.notification_email || trainer.email || "—"}
        </p>
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Key className="w-3 h-3" />
          Código: <span className="font-mono font-bold text-foreground">{trainer.invite_code || "Não gerado"}</span>
        </p>
      </div>
    </div>
  );
}
