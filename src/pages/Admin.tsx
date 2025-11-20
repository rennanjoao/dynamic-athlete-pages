import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, FileCode, Zap } from "lucide-react";
import { toast } from "sonner";
import { generateHTML } from "@/utils/htmlGenerator";
import { useWorkoutTemplates } from "@/hooks/useWorkoutTemplates";
import { TemplateLoadDialog } from "@/components/admin/TemplateLoadDialog";
import { SupplementsSection, Supplement } from "@/components/admin/SupplementsSection";
import { validateSupplement, validateExercise, validateWaterAmount } from "@/utils/validation";
import { WaterJugAnimation } from "@/components/admin/WaterJugAnimation";
import { workoutTemplates } from "@/data/workoutTemplates";

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
  const { templates, loading: templatesLoading } = useWorkoutTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousStateRef = useRef<any>(null);
  
  const [formData, setFormData] = useState({
    nome: "",
    idade: "",
    altura: "",
    pesoInicial: "",
    meta: "",
    calorias: "",
    waterAmountLiters: "2.5",
  });

  const [trainingType, setTrainingType] = useState<"ab" | "abc" | "abcd" | "aerobico">("ab");

  const [refeicoes, setRefeicoes] = useState<Record<string, Refeicao>>({
    "1": { titulo: "Refeição 1", tipo: "Café da Manhã", icon: "☕", itens: [] },
  });

  const [treinos, setTreinos] = useState<Record<string, Exercicio[]>>({
    A: [],
  });

  const [supplements, setSupplements] = useState<Supplement[]>([]);

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

  const applyTrainingType = () => {
    const template = workoutTemplates[trainingType];
    
    if (!template) {
      toast.error("Template não encontrado");
      return;
    }

    const newTreinos: Record<string, Exercicio[]> = {};
    
    // Preencher treinos com os exercícios do template
    Object.entries(template.workouts).forEach(([name, exercises]) => {
      // Usar a primeira letra do nome do treino (ex: "Treino A" -> "A")
      const key = name.replace("Treino ", "");
      newTreinos[key] = exercises;
    });

    const previousTreinos = { ...treinos };
    
    if (hasExistingContent()) {
      setTreinos(newTreinos);
      setupUndo(previousTreinos);
      toast.success(`Template ${template.name} aplicado com ${Object.keys(newTreinos).length} treinos`);
    } else {
      setTreinos(newTreinos);
      toast.success(`Template ${template.name} criado com ${Object.keys(newTreinos).length} treinos`);
    }
    
    // Adicionar observações gerais ao campo de notas se ainda não estiverem lá
    const hasGeneralNotes = notas.some(note => note.includes("OBSERVAÇÕES IMPORTANTES"));
    if (!hasGeneralNotes) {
      setNotas([template.generalNotes, ...notas]);
    }
  };

  const addExercicio = (treinoKey: string) => {
    setTreinos({
      ...treinos,
      [treinoKey]: [...treinos[treinoKey], { exercicio: "", series: "", descanso: "", observacao: "" }],
    });
  };

  const hasExistingContent = () => {
    const hasWorkouts = Object.values(treinos).some(exercises => exercises.length > 0);
    return hasWorkouts;
  };

  const createPlaceholders = (templateTreinos: Record<string, Exercicio[]>) => {
    const letters = ["A", "B", "C", "D", "E", "F"];
    const templateKeys = Object.keys(templateTreinos);
    const newTreinos: Record<string, Exercicio[]> = {};
    
    templateKeys.forEach(key => {
      newTreinos[key] = templateTreinos[key];
    });

    // Se o template tem menos treinos que as letras disponíveis, criar placeholders vazios
    const remainingLetters = letters.slice(templateKeys.length);
    remainingLetters.forEach(letter => {
      newTreinos[letter] = [];
    });

    return newTreinos;
  };

  const mergeTemplateWithCurrent = (templateTreinos: Record<string, Exercicio[]>) => {
    const merged = { ...treinos };
    
    Object.entries(templateTreinos).forEach(([key, exercises]) => {
      if (!merged[key] || merged[key].length === 0) {
        merged[key] = exercises;
      } else {
        // Mesclar apenas se o treino atual estiver vazio
        const uniqueExercises = exercises.filter(
          ex => !merged[key].some(existing => existing.exercicio === ex.exercicio)
        );
        merged[key] = [...merged[key], ...uniqueExercises];
      }
    });

    return merged;
  };

  const replaceWithTemplate = (templateTreinos: Record<string, Exercicio[]>) => {
    return createPlaceholders(templateTreinos);
  };

  const handleUndo = () => {
    if (previousStateRef.current) {
      setTreinos(previousStateRef.current);
      toast.success("Alteração desfeita");
      previousStateRef.current = null;
    }
  };

  const setupUndo = (previousTreinos: Record<string, Exercicio[]>) => {
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }

    previousStateRef.current = previousTreinos;

    toast("Treino substituído", {
      duration: 10000,
      action: {
        label: "Desfazer",
        onClick: handleUndo,
      },
    });

    undoTimeoutRef.current = setTimeout(() => {
      previousStateRef.current = null;
    }, 10000);
  };

  const loadTemplate = () => {
    if (!selectedTemplate) {
      toast.error("Selecione um template primeiro");
      return;
    }

    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) {
      toast.error("Template não encontrado");
      return;
    }

    if (hasExistingContent()) {
      setShowTemplateDialog(true);
    } else {
      applyTemplate("replace");
    }
  };

  const applyTemplate = (mode: "replace" | "merge") => {
    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return;

    const previousTreinos = { ...treinos };

    if (mode === "replace") {
      const newTreinos = replaceWithTemplate(template.treinos);
      setTreinos(newTreinos);
      setupUndo(previousTreinos);
      toast.success(`Template "${template.name}" aplicado com sucesso!`);
    } else {
      const mergedTreinos = mergeTemplateWithCurrent(template.treinos);
      setTreinos(mergedTreinos);
      setupUndo(previousTreinos);
      toast.success(`Template "${template.name}" mesclado com sucesso!`);
    }

    setSelectedTemplate("");
    setShowTemplateDialog(false);
  };

  const handleTemplateReplace = () => applyTemplate("replace");
  const handleTemplateMerge = () => applyTemplate("merge");
  const handleTemplateCancel = () => {
    setShowTemplateDialog(false);
    setSelectedTemplate("");
  };

  const addSupplement = () => {
    const newSupplement: Supplement = {
      id: `supp-${Date.now()}`,
      nome: "",
      horario: "",
      refeicaoAssociada: "nenhuma",
      relacao: "",
      observacao: "",
      essencial: false,
    };
    setSupplements([...supplements, newSupplement]);
  };

  const updateSupplement = (id: string, field: keyof Supplement, value: any) => {
    setSupplements(
      supplements.map(supp =>
        supp.id === id ? { ...supp, [field]: value } : supp
      )
    );
  };

  const removeSupplement = (id: string) => {
    setSupplements(supplements.filter(supp => supp.id !== id));
    toast.success("Suplemento removido");
  };

  const generateHTMLFile = () => {
    if (!formData.nome || !formData.idade) {
      toast.error("Preencha pelo menos nome e idade");
      return;
    }

    // Validate water amount
    const waterAmount = parseFloat(formData.waterAmountLiters);
    const waterValidation = validateWaterAmount(waterAmount);
    if (!waterValidation.valid) {
      toast.error(`Erro de validação de água: ${waterValidation.errors.join(', ')}`);
      return;
    }

    // Validate supplements
    const supplementErrors: string[] = [];
    supplements.forEach((supp, idx) => {
      const validation = validateSupplement(supp);
      if (!validation.valid) {
        supplementErrors.push(`Suplemento ${idx + 1}: ${validation.errors.join(', ')}`);
      }
    });

    if (supplementErrors.length > 0) {
      toast.error(`Erros de validação:\n${supplementErrors.join('\n')}`);
      return;
    }

    // Validate exercises
    const exerciseErrors: string[] = [];
    Object.entries(treinos).forEach(([key, exercises]) => {
      exercises.forEach((ex, idx) => {
        const validation = validateExercise(ex);
        if (!validation.valid) {
          exerciseErrors.push(`Treino ${key}, exercício ${idx + 1}: ${validation.errors.join(', ')}`);
        }
      });
    });

    if (exerciseErrors.length > 0) {
      toast.error(`Erros de validação:\n${exerciseErrors.join('\n')}`);
      return;
    }

    const data = {
      nome: formData.nome,
      idade: formData.idade,
      altura: formData.altura,
      pesoInicial: formData.pesoInicial,
      meta: formData.meta,
      calorias: formData.calorias,
      waterAmountLiters: waterAmount,
      trainingType,
      refeicoes,
      treinos,
      supplements,
      notas: notas.filter((n) => n.trim() !== ""),
    };

    const htmlContent = generateHTML(data);
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const fileName = formData.nome.toLowerCase().replace(/\s+/g, "-").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    a.download = `plano-${fileName}.html`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("HTML gerado com sucesso! Arquivo editável e seguro.");
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
            <div>
              <Label htmlFor="waterAmount">Quantidade de água (L)</Label>
              <Input
                id="waterAmount"
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={formData.waterAmountLiters}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (value > 10) {
                    toast.error("Valor inválido — máximo 10 L");
                    return;
                  }
                  setFormData({ ...formData, waterAmountLiters: e.target.value });
                }}
                placeholder="Ex.: 2.5"
              />
            </div>
            <div className="flex items-end justify-center">
              <WaterJugAnimation 
                waterAmountLiters={parseFloat(formData.waterAmountLiters) || 0} 
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
            <div className="flex gap-2">
              <Button onClick={addTreino} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Treino
              </Button>
            </div>
          </div>

          {/* Training Type Selector */}
          <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
            <Label className="text-sm font-medium mb-2 block">Tipo de Treino</Label>
            <div className="flex gap-2">
              <Select value={trainingType} onValueChange={(value: "ab" | "abc" | "abcd" | "aerobico") => setTrainingType(value)}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ab">AB - 2 treinos por semana</SelectItem>
                  <SelectItem value="abc">ABC - 3 treinos por semana</SelectItem>
                  <SelectItem value="abcd">ABCD - 4 treinos por semana</SelectItem>
                  <SelectItem value="aerobico">Aeróbico - 1 treino</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={applyTrainingType} 
                variant="secondary"
                className="shrink-0"
              >
                Aplicar Estrutura
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Selecione o tipo de treino e clique em "Aplicar Estrutura" para criar os slots necessários.
            </p>
          </div>

          {/* Template Selector */}
          <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
            <Label className="text-sm font-medium mb-2 block">Carregar Template Pré-cadastrado</Label>
            <div className="flex gap-2">
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={templatesLoading ? "Carregando..." : "Selecione um template"} />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} - {template.level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={loadTemplate} 
                disabled={!selectedTemplate || templatesLoading}
                className="shrink-0"
              >
                <Zap className="w-4 h-4 mr-2" />
                Carregar
              </Button>
            </div>
            {templates.length === 0 && !templatesLoading && (
              <p className="text-sm text-muted-foreground mt-2">
                Nenhum template cadastrado. Entre em contato com o administrador.
              </p>
            )}
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

        {/* Suplementos */}
        <SupplementsSection
          supplements={supplements}
          onAdd={addSupplement}
          onUpdate={updateSupplement}
          onRemove={removeSupplement}
        />

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
          <Button onClick={generateHTMLFile} size="lg" className="min-w-[200px] gap-2">
            <FileCode className="w-5 h-5" />
            Gerar HTML
          </Button>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-2">
          O arquivo HTML pode ser aberto diretamente em qualquer navegador, sem instalação
        </p>
      </div>

      <TemplateLoadDialog
        open={showTemplateDialog}
        onOpenChange={setShowTemplateDialog}
        onReplace={handleTemplateReplace}
        onMerge={handleTemplateMerge}
        onCancel={handleTemplateCancel}
      />
    </div>
  );
};

export default Admin;
