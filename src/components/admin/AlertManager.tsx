import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Trash2, Pause, Play, Plus } from "lucide-react";
import { toast } from "sonner";

interface StudentOption {
  user_id: string;
  full_name: string;
}

interface Alert {
  id: string;
  student_id: string;
  message: string;
  frequency: string;
  target_date: string | null;
  is_active: boolean;
  created_at: string;
  student_name?: string;
}

export const AlertManager = () => {
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [message, setMessage] = useState("");
  const [frequency, setFrequency] = useState("once");
  const [targetDate, setTargetDate] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchAlerts();
  }, []);

  const fetchStudents = async () => {
    const { data } = await supabase
      .from("student_profiles")
      .select("user_id, full_name");
    if (data) setStudents(data);
  };

  const fetchAlerts = async () => {
    const { data } = await (supabase as any)
      .from("daily_alerts")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      const { data: profiles } = await supabase.from("student_profiles").select("user_id, full_name");
      const nameMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
      setAlerts(data.map((a: any) => ({ ...a, student_name: nameMap.get(a.student_id) || "Desconhecido" })));
    }
  };

  const handleCreate = async () => {
    if (!selectedStudent || !message.trim()) {
      toast.error("Selecione um aluno e escreva a mensagem");
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { error } = await (supabase as any).from("daily_alerts").insert({
      trainer_id: user.id,
      student_id: selectedStudent,
      message: message.trim(),
      frequency,
      target_date: frequency === "once" ? targetDate || null : null,
      is_active: true,
    });

    if (error) {
      toast.error("Erro ao criar alerta");
      console.error(error);
    } else {
      toast.success("Alerta criado!");
      setMessage("");
      setSelectedStudent("");
      setTargetDate("");
      fetchAlerts();
    }
    setLoading(false);
  };

  const toggleAlert = async (id: string, current: boolean) => {
    await (supabase as any).from("daily_alerts").update({ is_active: !current }).eq("id", id);
    fetchAlerts();
  };

  const deleteAlert = async (id: string) => {
    await (supabase as any).from("daily_alerts").delete().eq("id", id);
    toast.success("Alerta excluído");
    fetchAlerts();
  };

  const freqLabel: Record<string, string> = { once: "Uma vez", daily: "Diário", weekly: "Semanal" };

  return (
    <Card className="p-6 glass-strong">
      <div className="flex items-center gap-2 mb-6">
        <Bell className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Automação de Alertas</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div>
          <Label>Aluno</Label>
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger><SelectValue placeholder="Selecione o aluno" /></SelectTrigger>
            <SelectContent>
              {students.map(s => (
                <SelectItem key={s.user_id} value={s.user_id}>{s.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Frequência</Label>
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="once">Apenas Hoje</SelectItem>
              <SelectItem value="daily">Todos os Dias</SelectItem>
              <SelectItem value="weekly">Toda Segunda-feira</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label>Mensagem</Label>
          <Textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Ex: Foco na contração de pico hoje! Mantenha a hidratação alta."
            className="min-h-[80px]"
          />
        </div>
        {frequency === "once" && (
          <div>
            <Label>Data</Label>
            <input
              type="date"
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        )}
      </div>

      <Button onClick={handleCreate} disabled={loading} className="w-full mb-8 glow-primary-strong">
        <Plus className="w-4 h-4 mr-2" />
        Criar Alerta
      </Button>

      <h3 className="text-lg font-semibold mb-4">Alertas Ativos</h3>
      <div className="space-y-3">
        {alerts.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-4">Nenhum alerta criado</p>
        )}
        {alerts.map(a => (
          <div key={a.id} className={`flex items-start gap-3 p-4 rounded-lg border transition-all ${a.is_active ? "border-emerald-500/30 bg-emerald-500/5" : "border-border opacity-50"}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{a.student_name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{freqLabel[a.frequency]}</span>
              </div>
              <p className="text-sm text-muted-foreground">{a.message}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" onClick={() => toggleAlert(a.id, a.is_active)} className="h-8 w-8">
                {a.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => deleteAlert(a.id)} className="h-8 w-8 text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
