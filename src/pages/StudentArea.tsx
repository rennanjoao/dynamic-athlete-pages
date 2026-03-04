import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MeasurementsForm } from "@/components/student/MeasurementsForm";
import { SkinfoldForm } from "@/components/student/SkinfoldForm";
import { ProgressChart } from "@/components/student/ProgressChart";
import { TrainerAlert } from "@/components/student/TrainerAlert";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { useMeasurements } from "@/hooks/useMeasurements";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

const StudentArea = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const { profile, loading: profileLoading, createOrUpdateProfile } = useStudentProfile();
  const { bodyMeasurements, loading: measurementsLoading } = useMeasurements();
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    gender: "male" as "male" | "female",
    height: "",
    birth_date: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/");
      } else {
        setUser(session.user);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!profileLoading && !profile && user) {
      setShowProfileSetup(true);
    }
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

  if (profileLoading || measurementsLoading) {
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
                  onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label>Sexo</Label>
                <Select value={profileForm.gender} onValueChange={(value: "male" | "female") => setProfileForm(prev => ({ ...prev, gender: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="height">Altura (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  value={profileForm.height}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, height: e.target.value }))}
                  placeholder="Ex: 170"
                />
              </div>

              <div>
                <Label htmlFor="birth_date">Data de Nascimento</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={profileForm.birth_date}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, birth_date: e.target.value }))}
                />
              </div>

              <Button type="submit" className="w-full glow-primary-strong">
                Criar Perfil
              </Button>
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
          <h1 className="text-2xl font-bold text-foreground">Área do Aluno</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Olá, {profile?.full_name || "Aluno"}!
            </span>
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Trainer Alert */}
        <TrainerAlert />

        {/* Progress Chart */}
        <ProgressChart />

        {/* Tabs for data sections */}
        <Tabs defaultValue="measurements" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="measurements">Modo Amador</TabsTrigger>
            <TabsTrigger value="professional">Modo Profissional</TabsTrigger>
          </TabsList>
          
          <TabsContent value="measurements">
            <MeasurementsForm />
          </TabsContent>
          
          <TabsContent value="professional">
            <SkinfoldForm />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default StudentArea;
