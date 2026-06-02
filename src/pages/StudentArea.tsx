/**
 * StudentArea.tsx — Hub central da Área do Aluno.
 *
 * Fluxo:
 *  1. Garante perfil mínimo (nome/sexo) — necessário para anamnese e métricas
 *  2. Mostra cards de navegação para os módulos disponíveis
 *  3. Não permite mais o preenchimento manual de medidas corporais —
 *     toda métrica vem da Anamnese e dos Check-ins/feedbacks
 */

import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrainerAlert } from "@/components/student/TrainerAlert";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import {
  LogOut,
  User as UserIcon,
  ClipboardList,
  Activity,
  FileText,
  Dumbbell,
  Apple,
  ArrowRight,
} from "lucide-react";

const NAV_CARDS = [
  {
    to: "/anamnesis",
    icon: ClipboardList,
    title: "Anamnese",
    desc: "Sua linha de base completa — atualize quando algo importante mudar.",
  },
  {
    to: "/check-in",
    icon: FileText,
    title: "Feedback / Check-in",
    desc: "Envie seu feedback periódico para o coach calibrar o protocolo.",
  },
  {
    to: "/evolution",
    icon: Activity,
    title: "Painel de Evolução",
    desc: "Métricas, fotos e indicadores derivados da sua anamnese + check-ins.",
  },
  {
    to: "/workout-plan",
    icon: Dumbbell,
    title: "Treino do dia",
    desc: "Sessão atual com séries, RPE e cadência.",
  },
  {
    to: "/routine",
    icon: Apple,
    title: "Estratégia Nutricional",
    desc: "Diretrizes alimentares, hidratação e suplementação do seu protocolo.",
  },
];

const StudentArea = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const { profile, loading: profileLoading, createOrUpdateProfile } = useStudentProfile();
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    gender: "male" as "male" | "female",
    height: "",
    birth_date: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/");
      else setUser(session.user);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/");
      else setUser(session.user);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!profileLoading && !profile && user) setShowProfileSetup(true);
  }, [profileLoading, profile, user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createOrUpdateProfile({
      full_name: profileForm.full_name,
      gender: profileForm.gender,
      height: profileForm.height ? parseFloat(profileForm.height) : null,
      birth_date: profileForm.birth_date || null,
    });
    setShowProfileSetup(false);
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (showProfileSetup) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="p-6 glass-strong">
            <div className="flex items-center gap-2 mb-6">
              <UserIcon className="w-6 h-6 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Complete seu Perfil</h1>
            </div>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <Label htmlFor="full_name">Nome Completo</Label>
                <Input
                  id="full_name"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm((p) => ({ ...p, full_name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>Sexo</Label>
                <Select
                  value={profileForm.gender}
                  onValueChange={(v: "male" | "female") => setProfileForm((p) => ({ ...p, gender: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="height">Altura (cm)</Label>
                <Input
                  id="height" type="number" step="0.1" placeholder="Ex: 170"
                  value={profileForm.height}
                  onChange={(e) => setProfileForm((p) => ({ ...p, height: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="birth_date">Data de Nascimento</Label>
                <Input
                  id="birth_date" type="date"
                  value={profileForm.birth_date}
                  onChange={(e) => setProfileForm((p) => ({ ...p, birth_date: e.target.value }))}
                />
              </div>
              <Button type="submit" className="w-full glow-primary-strong">Criar Perfil</Button>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border glass-strong">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Área do Aluno <span className="text-primary">·</span> Elite Lab{" "}
              <span className="text-primary">Hub</span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Olá, {profile?.full_name || "Aluno"} — escolha um módulo abaixo
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8 max-w-5xl">
        <TrainerAlert />

        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Seus módulos
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {NAV_CARDS.map(({ to, icon: Icon, title, desc }) => (
              <Link key={to} to={to}>
                <Card className="p-5 card-hover group hover:border-primary/40 h-full">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:glow-primary transition-all">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-foreground">{title}</h3>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <Card className="p-5 bg-card/40 border-dashed">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Medidas corporais</strong> não são mais preenchidas
            manualmente. Todo peso, circunferência, foto e indicador físico é capturado pela{" "}
            <Link to="/anamnesis" className="text-primary font-semibold">Anamnese</Link>{" "}
            (linha de base) e pelos{" "}
            <Link to="/check-in" className="text-primary font-semibold">Feedbacks periódicos</Link>{" "}
            (atualizações). O gráfico em{" "}
            <Link to="/evolution" className="text-primary font-semibold">Painel de Evolução</Link>{" "}
            se atualiza automaticamente.
          </p>
        </Card>
      </main>
    </div>
  );
};

export default StudentArea;
