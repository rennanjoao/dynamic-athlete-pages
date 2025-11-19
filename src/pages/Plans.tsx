import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";

const Plans = () => {
  const { user, subscription } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  const plans = [
    {
      id: "mensal",
      name: "Mensal",
      price: "R$ 5,99",
      priceId: "price_1SUz4h5Vt1TaWbqUi2op8EO7",
      interval: "/mês",
      features: [
        "Acesso completo ao sistema",
        "Treinos personalizados",
        "Dieta personalizada",
        "Suporte via email",
      ],
    },
    {
      id: "semestral",
      name: "Semestral",
      price: "R$ 30,00",
      priceId: "price_1SUz4y5Vt1TaWbqUy2mMeIW7",
      interval: "/6 meses",
      popular: true,
      features: [
        "Acesso completo ao sistema",
        "Treinos personalizados",
        "Dieta personalizada",
        "Suporte via email",
        "Economia de 17%",
      ],
    },
    {
      id: "anual",
      name: "Anual",
      price: "R$ 55,00",
      priceId: "price_1SUz5C5Vt1TaWbqUuPRW0v50",
      interval: "/ano",
      features: [
        "Acesso completo ao sistema",
        "Treinos personalizados",
        "Dieta personalizada",
        "Suporte via email",
        "Economia de 23%",
      ],
    },
  ];

  const handleSubscribe = async (priceId: string, planName: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    setLoading(priceId);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar pagamento");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen pb-12">
      <ThemeToggle />

      <header className="gradient-primary text-white py-16 px-6 text-center">
        <h1 className="text-5xl font-bold mb-4">Escolha seu Plano</h1>
        <p className="text-xl opacity-90">
          Comece sua jornada de transformação hoje
        </p>
      </header>

      <div className="max-w-6xl mx-auto px-6 mt-12">
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`p-6 relative ${
                plan.popular
                  ? "border-primary shadow-lg scale-105"
                  : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold">
                  Mais Popular
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-primary">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground">{plan.interval}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSubscribe(plan.priceId, plan.name)}
                disabled={loading === plan.priceId}
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
              >
                {loading === plan.priceId
                  ? "Processando..."
                  : subscription?.plan_type === plan.id
                  ? "Plano Atual"
                  : "Assinar"}
              </Button>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button variant="ghost" onClick={() => navigate("/")}>
            Voltar para a página inicial
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Plans;