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
import { Loader2 } from "lucide-react";

export const AnamnesisGuard = ({ children }: { children: React.ReactNode }) => {
  const { anamnesis, loading } = useStudentData();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Evita travar a própria página da anamnese
  const isAnamnesisRoute = location.pathname.includes("anamnese");

  useEffect(() => {
    if (!loading && !anamnesis && !isAnamnesisRoute) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [anamnesis, loading, isAnamnesisRoute]);

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
      {/* Só renderiza a interface base (ex: navegação) se a anamnese existir */}
      {anamnesis && children}

      <AlertDialog open={isOpen}>
        <AlertDialogContent className="border-primary/30">
          <AlertDialogHeader>
            <AlertDialogTitle>Ponto de Partida Obrigatório</AlertDialogTitle>
            <AlertDialogDescription>
              Para liberar o seu painel, rotinas e gráficos de evolução, é estritamente necessário preencher sua Anamnese inicial. O seu protocolo será montado com base nestes dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => navigate("/anamnese")} 
              className="w-full font-bold"
            >
              Preencher Anamnese Agora
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
