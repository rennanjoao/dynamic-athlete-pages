import { useState } from "react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Download, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Refeicao {
  titulo: string;
  tipo: string;
  icon: string;
  itens: Array<{ nome: string; quantidade: string; opcional: boolean }>;
}

interface Exercicio {
  exercicio: string;
  series: string;
  descanso: string;
  observacao: string;
}

const Admin = () => {
  const [formData, setFormData] = useState({
    nome: "",
    idade: "",
    altura: "",
    pesoInicial: "",
    meta: "",
    calorias: "",
  });

  const [refeicoes, setRefeicoes] = useState<Record<string, Refeicao>>({
    "1": { titulo: "Refeição 1", tipo: "Café da Manhã", icon: "☕", itens: [] },
  });

  const [treinos, setTreinos] = useState<Record<string, Exercicio[]>>({
    A: [],
  });

  const [notas, setNotas] = useState<string[]>([""]);

  const addRefeicao = () => {
    const nextNum = Object.keys(refeicoes).length + 1;
    setRefeicoes({
      ...refeicoes,
      [nextNum]: { titulo: `Refeição ${nextNum}`, tipo: "", icon: "🍽️", itens: [] },
    });
  };

  const addItemRefeicao = (refKey: string) => {
    setRefeicoes({
      ...refeicoes,
      [refKey]: {
        ...refeicoes[refKey],
        itens: [...refeicoes[refKey].itens, { nome: "", quantidade: "", opcional: false }],
      },
    });
  };

  const addTreino = () => {
    const letters = ["A", "B", "C", "D", "E", "F"];
    const nextLetter = letters[Object.keys(treinos).length];
    if (nextLetter) {
      setTreinos({ ...treinos, [nextLetter]: [] });
    }
  };

  const addExercicio = (treinoKey: string) => {
    setTreinos({
      ...treinos,
      [treinoKey]: [...treinos[treinoKey], { exercicio: "", series: "", descanso: "", observacao: "" }],
    });
  };

  const generateJSON = () => {
    if (!formData.nome || !formData.idade) {
      toast.error("Preencha pelo menos nome e idade");
      return;
    }

    const json = {
      nome: formData.nome,
      idade: parseInt(formData.idade) || 0,
      altura: formData.altura,
      pesoInicial: formData.pesoInicial,
      meta: formData.meta,
      calorias: formData.calorias,
      refeicoes,
      treinos,
      notas: notas.filter((n) => n.trim() !== ""),
    };

    const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formData.nome.toLowerCase().replace(/\s/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("JSON gerado com sucesso!");
  };

  return (
    <div className="min-h-screen pb-12">
      <ThemeToggle />

      <header className="gradient-primary text-white py-12 px-6 text-center relative shadow-lg">
        <Link to="/" className="absolute left-6 top-6 flex items-center gap-2 text-white/90 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </Link>
        <h1 className="text-4xl font-bold mb-2">Painel Admin</h1>
        <p className="text-lg opacity-90">Criar novo plano de aluno</p>
      </header>

      <div className="max-w-5xl mx-auto px-6 mt-12 space-y-8">
        {/* Dados Básicos */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Dados Básicos</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome do aluno"
              />
            </div>
            <div>
              <Label htmlFor="idade">Idade</Label>
              <Input
                id="idade"
                type="number"
                value={formData.idade}
                onChange={(e) => setFormData({ ...formData, idade: e.target.value })}
                placeholder="24"
              />
            </div>
            <div>
              <Label htmlFor="altura">Altura</Label>
              <Input
                id="altura"
                value={formData.altura}
                onChange={(e) => setFormData({ ...formData, altura: e.target.value })}
                placeholder="1,84m"
              />
            </div>
            <div>
              <Label htmlFor="peso">Peso Inicial</Label>
              <Input
                id="peso"
                value={formData.pesoInicial}
                onChange={(e) => setFormData({ ...formData, pesoInicial: e.target.value })}
                placeholder="135kg"
              />
            </div>
            <div>
              <Label htmlFor="meta">Meta</Label>
              <Input
                id="meta"
                value={formData.meta}
                onChange={(e) => setFormData({ ...formData, meta: e.target.value })}
                placeholder="-30kg"
              />
            </div>
            <div>
              <Label htmlFor="calorias">Calorias/dia</Label>
              <Input
                id="calorias"
                value={formData.calorias}
                onChange={(e) => setFormData({ ...formData, calorias: e.target.value })}
                placeholder="2500"
              />
            </div>
          </div>
        </Card>

        {/* Refeições */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Refeições</h2>
            <Button onClick={addRefeicao} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Refeição
            </Button>
          </div>
          <div className="space-y-6">
            {Object.entries(refeicoes).map(([key, ref]) => (
              <div key={key} className="border border-border rounded-lg p-4">
                <div className="grid md:grid-cols-3 gap-3 mb-4">
                  <Input
                    value={ref.titulo}
                    onChange={(e) =>
                      setRefeicoes({
                        ...refeicoes,
                        [key]: { ...ref, titulo: e.target.value },
                      })
                    }
                    placeholder="Título"
                  />
                  <Input
                    value={ref.tipo}
                    onChange={(e) =>
                      setRefeicoes({
                        ...refeicoes,
                        [key]: { ...ref, tipo: e.target.value },
                      })
                    }
                    placeholder="Tipo (ex: Café da Manhã)"
                  />
                  <Input
                    value={ref.icon}
                    onChange={(e) =>
                      setRefeicoes({
                        ...refeicoes,
                        [key]: { ...ref, icon: e.target.value },
                      })
                    }
                    placeholder="Ícone (emoji)"
                    className="text-center text-2xl"
                  />
                </div>
                <div className="space-y-2">
                  {ref.itens.map((item, idx) => (
                    <div key={idx} className="grid md:grid-cols-3 gap-2">
                      <Input
                        value={item.nome}
                        onChange={(e) => {
                          const newItens = [...ref.itens];
                          newItens[idx].nome = e.target.value;
                          setRefeicoes({
                            ...refeicoes,
                            [key]: { ...ref, itens: newItens },
                          });
                        }}
                        placeholder="Item"
                      />
                      <Input
                        value={item.quantidade}
                        onChange={(e) => {
                          const newItens = [...ref.itens];
                          newItens[idx].quantidade = e.target.value;
                          setRefeicoes({
                            ...refeicoes,
                            [key]: { ...ref, itens: newItens },
                          });
                        }}
                        placeholder="Quantidade"
                      />
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={item.opcional}
                            onChange={(e) => {
                              const newItens = [...ref.itens];
                              newItens[idx].opcional = e.target.checked;
                              setRefeicoes({
                                ...refeicoes,
                                [key]: { ...ref, itens: newItens },
                              });
                            }}
                            className="w-4 h-4"
                          />
                          Opcional
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                <Button onClick={() => addItemRefeicao(key)} size="sm" variant="outline" className="mt-3">
                  <Plus className="w-4 h-4 mr-2" />
                  Item
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Treinos */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Treinos</h2>
            <Button onClick={addTreino} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Treino
            </Button>
          </div>
          <div className="space-y-6">
            {Object.entries(treinos).map(([key, exercicios]) => (
              <div key={key} className="border border-border rounded-lg p-4">
                <h3 className="text-lg font-bold mb-4 text-primary">Treino {key}</h3>
                <div className="space-y-2">
                  {exercicios.map((ex, idx) => (
                    <div key={idx} className="grid md:grid-cols-4 gap-2">
                      <Input
                        value={ex.exercicio}
                        onChange={(e) => {
                          const newEx = [...exercicios];
                          newEx[idx].exercicio = e.target.value;
                          setTreinos({ ...treinos, [key]: newEx });
                        }}
                        placeholder="Exercício"
                      />
                      <Input
                        value={ex.series}
                        onChange={(e) => {
                          const newEx = [...exercicios];
                          newEx[idx].series = e.target.value;
                          setTreinos({ ...treinos, [key]: newEx });
                        }}
                        placeholder="Séries (4x8-10)"
                      />
                      <Input
                        value={ex.descanso}
                        onChange={(e) => {
                          const newEx = [...exercicios];
                          newEx[idx].descanso = e.target.value;
                          setTreinos({ ...treinos, [key]: newEx });
                        }}
                        placeholder="Descanso (90s)"
                      />
                      <Input
                        value={ex.observacao}
                        onChange={(e) => {
                          const newEx = [...exercicios];
                          newEx[idx].observacao = e.target.value;
                          setTreinos({ ...treinos, [key]: newEx });
                        }}
                        placeholder="Obs (opcional)"
                      />
                    </div>
                  ))}
                </div>
                <Button onClick={() => addExercicio(key)} size="sm" variant="outline" className="mt-3">
                  <Plus className="w-4 h-4 mr-2" />
                  Exercício
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Notas */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Observações</h2>
          <div className="space-y-3">
            {notas.map((nota, idx) => (
              <Textarea
                key={idx}
                value={nota}
                onChange={(e) => {
                  const newNotas = [...notas];
                  newNotas[idx] = e.target.value;
                  setNotas(newNotas);
                }}
                placeholder="Digite uma observação importante (pode usar emojis no início)"
                rows={2}
              />
            ))}
          </div>
          <Button
            onClick={() => setNotas([...notas, ""])}
            size="sm"
            variant="outline"
            className="mt-3"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Observação
          </Button>
        </Card>

        {/* Generate Button */}
        <div className="flex justify-center">
          <Button onClick={generateJSON} size="lg" className="min-w-[200px]">
            <Download className="w-5 h-5 mr-2" />
            Gerar JSON
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Admin;
