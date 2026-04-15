import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus, Users, Trash2, Shield } from "lucide-react";

interface Trainer {
  id: string;
  email: string;
  full_name: string | null;
  team_name: string | null;
  role: string;
  created_at: string;
}

export const TrainerManagement = () => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newTrainer, setNewTrainer] = useState({
    email: "",
    password: "",
    fullName: "",
    teamName: "",
    role: "coach" as "coach" | "user",
  });

  useEffect(() => { loadTrainers(); }, []);

  const loadTrainers = async () => {
    const { data, error } = await supabase.functions.invoke("manage-trainers", {
      body: { action: "list" },
    });
    if (!error && data?.trainers) setTrainers(data.trainers);
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
          role: newTrainer.role,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`${newTrainer.role === "coach" ? "Coach" : "Treinador"} criado com sucesso!`);
      setNewTrainer({ email: "", password: "", fullName: "", teamName: "", role: "coach" });
      setShowDialog(false);
      loadTrainers();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar");
    } finally {
      setIsLoading(false);
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
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover");
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
            <div key={trainer.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-primary" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{trainer.full_name || "Sem nome"}</p>
                    <Badge variant={trainer.role === "coach" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                      {trainer.role === "coach" ? "Coach" : "Treinador"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {trainer.email}
                    {trainer.team_name ? ` · ${trainer.team_name}` : ""}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleDeleteTrainer(trainer.id)} className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
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
              <Select value={newTrainer.role} onValueChange={(v) => setNewTrainer({ ...newTrainer, role: v as any })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coach">Coach</SelectItem>
                  <SelectItem value="user">Treinador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nome Completo *</Label>
              <Input placeholder="Nome do profissional" value={newTrainer.fullName} onChange={(e) => setNewTrainer({ ...newTrainer, fullName: e.target.value })} />
            </div>
            <div>
              <Label>Nome da Equipe</Label>
              <Input placeholder="Ex: Team Elite, Studio Fit" value={newTrainer.teamName} onChange={(e) => setNewTrainer({ ...newTrainer, teamName: e.target.value })} />
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" placeholder="email@exemplo.com" value={newTrainer.email} onChange={(e) => setNewTrainer({ ...newTrainer, email: e.target.value })} />
            </div>
            <div>
              <Label>Senha *</Label>
              <Input type="password" placeholder="Mínimo 6 caracteres" value={newTrainer.password} onChange={(e) => setNewTrainer({ ...newTrainer, password: e.target.value })} />
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
