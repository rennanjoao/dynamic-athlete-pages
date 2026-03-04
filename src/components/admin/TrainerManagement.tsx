import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { UserPlus, Users, Trash2, Shield } from "lucide-react";

interface Trainer {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

export const TrainerManagement = () => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newTrainer, setNewTrainer] = useState({ email: "", password: "", fullName: "" });

  useEffect(() => {
    loadTrainers();
  }, []);

  const loadTrainers = async () => {
    const { data, error } = await supabase.functions.invoke("manage-trainers", {
      body: { action: "list" },
    });
    if (!error && data?.trainers) {
      setTrainers(data.trainers);
    }
  };

  const handleCreateTrainer = async () => {
    if (!newTrainer.email || !newTrainer.password || !newTrainer.fullName) {
      toast.error("Preencha todos os campos");
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
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Treinador criado com sucesso!");
      setNewTrainer({ email: "", password: "", fullName: "" });
      setShowDialog(false);
      loadTrainers();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar treinador");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTrainer = async (trainerId: string) => {
    if (!confirm("Tem certeza que deseja remover este treinador?")) return;

    try {
      const { data, error } = await supabase.functions.invoke("manage-trainers", {
        body: { action: "delete", trainerId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Treinador removido");
      loadTrainers();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover treinador");
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Gestão de Treinadores</h2>
        </div>
        <Button onClick={() => setShowDialog(true)} size="sm" className="gap-2">
          <UserPlus className="w-4 h-4" />
          Novo Treinador
        </Button>
      </div>

      {trainers.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Nenhum treinador cadastrado ainda.
        </p>
      ) : (
        <div className="space-y-2">
          {trainers.map((trainer) => (
            <div
              key={trainer.id}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">{trainer.full_name || "Sem nome"}</p>
                  <p className="text-xs text-muted-foreground">{trainer.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteTrainer(trainer.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Criar Novo Treinador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nome Completo</Label>
              <Input
                placeholder="Nome do treinador"
                value={newTrainer.fullName}
                onChange={(e) => setNewTrainer({ ...newTrainer, fullName: e.target.value })}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={newTrainer.email}
                onChange={(e) => setNewTrainer({ ...newTrainer, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Senha</Label>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newTrainer.password}
                onChange={(e) => setNewTrainer({ ...newTrainer, password: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateTrainer} disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar Treinador"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
