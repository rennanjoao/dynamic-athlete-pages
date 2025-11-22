import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus, Calendar } from "lucide-react";
import { toast } from "sonner";

interface Aluno {
  id: string;
  nome: string;
  descricao: string;
  dataInicio: string;
}

const Index = () => {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAlunos = async () => {
      try {
        const response = await fetch("/data/alunos.json");
        if (!response.ok) throw new Error("Erro ao carregar alunos");
        const data = await response.json();
        setAlunos(data);
      } catch (error) {
        toast.error("Erro ao carregar lista de alunos");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadAlunos();
  }, []);

  return (
    <div className="min-h-screen">
      <ThemeToggle />

      {/* Header */}
      <header className="gradient-primary text-white py-16 px-6 text-center shadow-lg animate-fade-in-down">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Users className="w-12 h-12" />
            <h1 className="text-5xl font-bold">Fitness Coach</h1>
          </div>
          <p className="text-xl opacity-95 mb-6">
            Sistema de Gestão de Treinos e Dietas Personalizados
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link to="/admin">
              <Button variant="secondary" size="lg" className="animate-fade-in">
                <Plus className="mr-2 h-5 w-5" />
                Área do Treinador
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Lista de Alunos */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold mb-8 animate-slide-in flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          Alunos Cadastrados
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          </div>
        ) : alunos.length === 0 ? (
          <Card className="p-12 text-center animate-scale-in">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Nenhum aluno cadastrado</h3>
            <p className="text-muted-foreground mb-6">
              Comece criando o primeiro plano personalizado
            </p>
            <Link to="/admin">
              <Button className="gap-2">
                <Plus className="w-5 h-5" />
                Criar Primeiro Aluno
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alunos.map((aluno, idx) => (
              <Card
                key={aluno.id}
                className="p-6 card-hover animate-scale-in hover:border-primary/50"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {new Date(aluno.dataInicio).toLocaleDateString("pt-BR")}
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-2">{aluno.nome}</h3>
                <p className="text-muted-foreground mb-4 text-sm">{aluno.descricao}</p>

                <Link to={`/student?id=${aluno.id}`}>
                  <Button className="w-full">Ver Plano Completo</Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Info Cards */}
      <section className="max-w-7xl mx-auto px-6 pb-12">
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6 text-center card-hover animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="font-bold text-lg mb-2">Planos Personalizados</h3>
            <p className="text-sm text-muted-foreground">
              Dietas e treinos adaptados para cada objetivo
            </p>
          </Card>

          <Card className="p-6 text-center card-hover animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <div className="text-4xl mb-3">📊</div>
            <h3 className="font-bold text-lg mb-2">Acompanhamento</h3>
            <p className="text-sm text-muted-foreground">
              Monitore a evolução e ajuste o protocolo
            </p>
          </Card>

          <Card className="p-6 text-center card-hover animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <div className="text-4xl mb-3">💪</div>
            <h3 className="font-bold text-lg mb-2">Resultados Reais</h3>
            <p className="text-sm text-muted-foreground">
              Foco em recomposição corporal sustentável
            </p>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-muted-foreground">
        <p className="text-sm">© 2024 Fitness Coach - Sistema de Gestão de Alunos</p>
      </footer>
    </div>
  );
};

export default Index;
