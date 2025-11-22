import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar3D } from "@/components/student/Avatar3D";
import SimpleAvatar3D from "@/components/student/SimpleAvatar3D";
import { MeasurementsForm } from "@/components/student/MeasurementsForm";
import { SkinfoldForm } from "@/components/student/SkinfoldForm";
import { AvatarCustomization } from "@/components/student/AvatarCustomization";
import { ProgressChart } from "@/components/student/ProgressChart";
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
  const { profile, customization, loading: profileLoading, createOrUpdateProfile } = useStudentProfile();
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
          <Card className="p-6">
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

              <Button type="submit" className="w-full">
                Criar Perfil
              </Button>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  const latestMeasurement = bodyMeasurements[0];
  const defaultCustomization = customization || {
    skin_color: "#f5d0b0",
    eye_color: "#8B4513",
    hair_color: "#2C1810",
    hair_style: "short",
    clothing_color: "#000000",
    nail_color: null,
    shoe_color: "#FFFFFF",
    shoe_accent_color: "#FF0000",
    water_bottle_color: "#4A90E2",
  };

  const handleAvatarGenerated = async (imageUrl: string) => {
    // Save the avatar URL to the profile
    await createOrUpdateProfile({
      avatar_url: imageUrl,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
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
        {/* Avatar Section */}
        <Avatar3D
          gender={profile?.gender || "male"}
          customization={defaultCustomization}
          latestMeasurement={latestMeasurement}
          avatarUrl={profile?.avatar_url}
          onAvatarGenerated={handleAvatarGenerated}
        />

        {/* Progress Chart */}
        <ProgressChart />

        {/* Tabs for different sections */}
        <Tabs defaultValue="measurements" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="measurements">Modo Amador</TabsTrigger>
            <TabsTrigger value="professional">Modo Profissional</TabsTrigger>
            <TabsTrigger value="customization">Personalizar Avatar</TabsTrigger>
            <TabsTrigger value="avatar3d">Avatar 3D</TabsTrigger>
          </TabsList>
          
          <TabsContent value="measurements">
            <MeasurementsForm />
          </TabsContent>
          
          <TabsContent value="professional">
            <SkinfoldForm />
          </TabsContent>
          
          <TabsContent value="customization">
            <AvatarCustomization />
          </TabsContent>

          <TabsContent value="avatar3d">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Avatar 3D com Tênis Nike</h2>
              <p className="text-muted-foreground mb-6">
                Personalize seu avatar 3D e seus tênis Nike em tempo real. Arraste para girar, use a roda do mouse para zoom.
              </p>
              <SimpleAvatar3D
                initialShirtColor={customization?.clothing_color || "#1565c0"}
                initialShortsColor="#3949ab"
                initialShoeColor={customization?.shoe_color || "#000000"}
                initialShoeAccentColor={customization?.shoe_accent_color || "#FF0000"}
              />
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default StudentArea;
