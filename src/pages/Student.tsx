import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card } from "@/components/ui/card";
import { ArrowLeft, User, Calendar, Target, TrendingDown, Flame } from "lucide-react";
import { toast } from "sonner";

interface StudentData {
  nome: string;
  idade: number;
  altura: string;
  pesoInicial: string;
  meta: string;
  calorias: string;
  refeicoes: {
    [key: string]: {
      titulo: string;
      tipo: string;
      icon: string;
      itens: Array<{
        nome: string;
        quantidade: string;
        opcional: boolean;
      }>;
    };
  };
  treinos: {
    [key: string]: Array<{
      exercicio: string;
      series: string;
      descanso: string;
      observacao: string;
    }>;
  };
  notas: string[];
}

const Student = () => {
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("id");
  const [data, setData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStudent = async () => {
      if (!studentId) {
        toast.error("ID do aluno não fornecido");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/data/${studentId}.json`);
        if (!response.ok) throw new Error("Aluno não encontrado");
        const studentData = await response.json();
        setData(studentData);
      } catch (error) {
        toast.error("Erro ao carregar dados do aluno");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadStudent();
  }, [studentId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Aluno não encontrado</h1>
        <Link to="/" className="text-primary hover:underline">
          Voltar para a lista
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <ThemeToggle />

      {/* Header */}
      <header className="gradient-primary text-white py-12 px-6 text-center relative shadow-lg animate-fade-in-down">
        <Link
          to="/"
          className="absolute left-6 top-6 flex items-center gap-2 text-white/90 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Voltar</span>
        </Link>
        <h1 className="text-4xl md:text-5xl font-bold mb-3">{data.nome}</h1>
        <p className="text-xl opacity-95">Plano de Recomposição Corporal</p>
      </header>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-6 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 animate-fade-in-up">
          <Card className="p-6 text-center card-hover">
            <User className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground mb-1">Idade</p>
            <p className="text-2xl font-bold">{data.idade} anos</p>
          </Card>
          <Card className="p-6 text-center card-hover">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground mb-1">Altura</p>
            <p className="text-2xl font-bold">{data.altura}</p>
          </Card>
          <Card className="p-6 text-center card-hover">
            <TrendingDown className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground mb-1">Peso Inicial</p>
            <p className="text-2xl font-bold">{data.pesoInicial}</p>
          </Card>
          <Card className="p-6 text-center card-hover">
            <Target className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground mb-1">Meta</p>
            <p className="text-2xl font-bold">{data.meta}</p>
          </Card>
          <Card className="p-6 text-center card-hover col-span-2 md:col-span-1">
            <Flame className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground mb-1">Calorias/dia</p>
            <p className="text-2xl font-bold">{data.calorias}</p>
          </Card>
        </div>
      </div>

      {/* Meals */}
      <section className="max-w-7xl mx-auto px-6 mt-12">
        <h2 className="text-3xl font-bold mb-6 animate-slide-in">📋 Plano Alimentar</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {Object.entries(data.refeicoes).map(([key, refeicao], idx) => (
            <Card key={key} className="p-6 card-hover animate-scale-in" style={{ animationDelay: `${idx * 0.1}s` }}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{refeicao.icon}</span>
                <div>
                  <h3 className="text-xl font-bold">{refeicao.titulo}</h3>
                  <p className="text-sm text-muted-foreground">{refeicao.tipo}</p>
                </div>
              </div>
              <ul className="space-y-2">
                {refeicao.itens.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <div className="flex-1">
                      <span className={item.opcional ? "text-muted-foreground" : ""}>
                        {item.nome}
                      </span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {item.quantidade}
                      </span>
                      {item.opcional && (
                        <span className="text-xs text-muted-foreground ml-2">(opcional)</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* Workouts */}
      <section className="max-w-7xl mx-auto px-6 mt-12">
        <h2 className="text-3xl font-bold mb-6 animate-slide-in">💪 Treinos</h2>
        <div className="space-y-6">
          {Object.entries(data.treinos).map(([key, exercicios], idx) => (
            <Card key={key} className="p-6 card-hover animate-scale-in" style={{ animationDelay: `${idx * 0.1}s` }}>
              <h3 className="text-2xl font-bold mb-4 text-primary">Treino {key}</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr className="text-left">
                      <th className="pb-3 font-semibold">Exercício</th>
                      <th className="pb-3 font-semibold">Séries</th>
                      <th className="pb-3 font-semibold">Descanso</th>
                      <th className="pb-3 font-semibold">Observação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exercicios.map((ex, exIdx) => (
                      <tr key={exIdx} className="border-b border-border/50 last:border-0">
                        <td className="py-3">{ex.exercicio}</td>
                        <td className="py-3 text-primary font-semibold">{ex.series}</td>
                        <td className="py-3 text-muted-foreground">{ex.descanso}</td>
                        <td className="py-3 text-sm text-muted-foreground">{ex.observacao || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Notes */}
      <section className="max-w-7xl mx-auto px-6 mt-12">
        <h2 className="text-3xl font-bold mb-6 animate-slide-in">📝 Observações Importantes</h2>
        <Card className="p-6 card-hover animate-scale-in">
          <ul className="space-y-3">
            {data.notas.map((nota, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="text-primary text-xl">{nota.split(" ")[0]}</span>
                <span className="flex-1">{nota.substring(nota.indexOf(" ") + 1)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
};

export default Student;
