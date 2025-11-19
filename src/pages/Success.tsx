import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

const Success = () => {
  const navigate = useNavigate();
  const { checkSubscription } = useAuth();

  useEffect(() => {
    // Check subscription after successful payment
    checkSubscription();
  }, [checkSubscription]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md p-8 text-center space-y-6">
        <div className="flex justify-center">
          <CheckCircle className="w-20 h-20 text-green-500" />
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-2">Pagamento Confirmado!</h1>
          <p className="text-muted-foreground">
            Seu plano foi ativado com sucesso. Agora você tem acesso completo ao sistema.
          </p>
        </div>

        <div className="space-y-3">
          <Button onClick={() => navigate("/admin")} className="w-full">
            Ir para o Painel Admin
          </Button>
          <Button onClick={() => navigate("/")} variant="outline" className="w-full">
            Voltar para Início
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Success;