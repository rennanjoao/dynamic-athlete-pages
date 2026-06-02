import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useStudentData } from "@/hooks/useStudentData";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const AnamnesisGuard = ({ children }: { children: React.ReactNode }) => {
  const { anamnesis, loading } = useStudentData();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isAnamnesisRoute = location.pathname.includes("anamnesis");
  const hasCompletedAnamnesis = !!anamnesis?.submitted_at;

  useEffect(() => {
    if (!loading && !hasCompletedAnamnesis && !isAnamnesisRoute) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [hasCompletedAnamnesis, loading, isAnamnesisRoute]);

  const handleLogoutOrHome = async () => {
    await supabase.auth.signOut();
    setIsOpen(false);
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAnamnesisRoute) {
    return <>{children}</>;
  }

  return (
    <>
      {hasCompletedAnamnesis && children}

      <AlertDialog open={isOpen}>
        <AlertDialogContent className="border-primary/30">
          <AlertDialogHeader>
            <AlertDialogTitle>Ponto de Partida Obrigatório</AlertDialogTitle>
            <AlertDialogDescription>
              Para liberar o seu painel, rotinas e gráficos de evolução, é estritamente necessário preencher e enviar sua Anamnese inicial. O seu protocolo será montado com base nestes dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <Button variant="outline" onClick={handleLogoutOrHome} className="w-full sm:w-auto">
              Voltar ao Início
            </Button>
            <AlertDialogAction 
              onClick={() => navigate("/anamnesis")} 
              className="w-full sm:w-auto font-bold"
            >
              Preencher Anamnese Agora
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
