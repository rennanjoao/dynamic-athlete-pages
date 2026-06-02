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

  // Verifica se o usuário já está na rota da anamnese para não gerar loop infinito
  const isAnamnesisRoute = location.pathname.includes("anamnesis");
  
  // Só considera a anamnese concluída se o aluno clicou em "Enviar" (possui data de envio)
  const hasCompletedAnamnesis = !!anamnesis?.submitted_at;

  useEffect(() => {
    // Se terminou de carregar, NÃO tem anamnese enviada e NÃO está na página da anamnese -> Abre o Pop-up
    if (!loading && !hasCompletedAnamnesis && !isAnamnesisRoute) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [hasCompletedAnamnesis, loading, isAnamnesisRoute]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se o aluno já estiver na página de Anamnese, renderiza a página normalmente
  if (isAnamnesisRoute) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Se tiver a anamnese, mostra a página que ele tentou acessar (Evolução, Área do Aluno, etc) */}
      {hasCompletedAnamnesis && children}

      {/* Pop-up que trava a tela */}
      <AlertDialog open={isOpen}>
        <AlertDialogContent className="border-primary/30">
          <AlertDialogHeader>
            <AlertDialogTitle>Ponto de Partida Obrigatório</AlertDialogTitle>
            <AlertDialogDescription>
              Para liberar o seu painel, rotinas e gráficos de evolução, é estritamente necessário preencher e enviar sua Anamnese inicial. O seu protocolo será montado com base nestes dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => navigate("/anamnesis")} 
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
