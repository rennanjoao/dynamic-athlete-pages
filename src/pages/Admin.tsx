import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Plus, FileCode, Mail, MessageCircle, Download } from "lucide-react";
import { toast } from "sonner";
import { generateHTML } from "@/utils/htmlGenerator";
import { useWorkoutTemplates } from "@/hooks/useWorkoutTemplates";
import { TemplateLoadDialog } from "@/components/admin/TemplateLoadDialog";
import { ProfessionalRegistrationDialog } from "@/components/admin/ProfessionalRegistrationDialog";
import { SupplementsSection, Supplement } from "@/components/admin/SupplementsSection";
import { TrainerManagement } from "@/components/admin/TrainerManagement";
import { AlertManager } from "@/components/admin/AlertManager";
import { validateSupplement, validateExercise, validateWaterAmount } from "@/utils/validation";
import { WaterBottle2D } from "@/components/admin/WaterBottle2D";
import { workoutTemplates } from "@/data/workoutTemplates";
import { supabase } from "@/integrations/supabase/client";

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
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const [showProfessionalDialog, setShowProfessionalDialog] = useState(false);
  const [professionalData, setProfessionalData] = useState<{
    type: "educador" | "nutricionista" | null;
    registry: string;
    registryMasked: string;
  } | null>(null);

  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

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

    // MERGE: Add new workouts to existing ones instead of replacing
    const mergedTreinos = { ...treinos, ...newTreinos };
    setTreinos(mergedTreinos);
    
    // Adicionar observações gerais ao campo de notas se ainda não estiverem lá
    const hasGeneralNotes = notas.some(note => note.includes("OBSERVAÇÕES IMPORTANTES"));
    if (!hasGeneralNotes) {
      setNotas([template.generalNotes, ...notas]);
    }

    toast.success(`Treino ${template.name} adicionado com sucesso!`);
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

  const validatePlan = () => {
    if (!formData.nome || !formData.idade) {
      toast.error("Preencha pelo menos nome e idade");
      return null;
    }

    // Validate water amount
    const waterAmount = parseFloat(formData.waterAmountLiters);
    const waterValidation = validateWaterAmount(waterAmount);
    if (!waterValidation.valid) {
      toast.error(`Erro de validação de água: ${waterValidation.errors.join(', ')}`);
      return null;
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
      return null;
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
      return null;
    }

    return {
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
      professionalInfo: professionalData,
    };
  };

  const generateHTMLFile = () => {
    const data = validatePlan();
    if (!data) return;

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

  const handleSendEmail = async () => {
    if (!recipientEmail || !recipientEmail.includes("@")) {
      toast.error("Digite um email válido");
      return;
    }

    const data = validatePlan();
    if (!data) return;

    setIsSendingEmail(true);

    try {
      const htmlContent = generateHTML(data);
      const subject = emailSubject || `Seu Plano de Treino Personalizado - ${formData.nome}`;
      const customMessage = emailMessage || `Olá ${formData.nome}!\n\nSegue em anexo seu plano de treino personalizado. Qualquer dúvida, estou à disposição!\n\nBons treinos! 💪`;

      const { data: result, error } = await supabase.functions.invoke("send-plan-email", {
        body: {
          toEmail: recipientEmail,
          studentName: formData.nome,
          htmlContent,
          subject,
          customMessage,
        },
      });

      if (error) throw error;

      toast.success(`Plano enviado com sucesso para ${recipientEmail}!`);
      setShowEmailDialog(false);
      setRecipientEmail("");
      setEmailSubject("");
      setEmailMessage("");
    } catch (error: any) {
      console.error("Erro ao enviar email:", error);
      toast.error(error.message || "Erro ao enviar email. Tente novamente.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSendWhatsApp = () => {
    const data = validatePlan();
    if (!data) return;

    const message = `🏋️ *Plano de Treino - ${formData.nome}*

📊 *Dados:*
Idade: ${formData.idade} anos
${formData.altura ? `Altura: ${formData.altura}` : ""}
${formData.pesoInicial ? `Peso Inicial: ${formData.pesoInicial}` : ""}
${formData.meta ? `Meta: ${formData.meta}` : ""}
${formData.calorias ? `Calorias/dia: ${formData.calorias}` : ""}

💪 *Treinos:*
${Object.entries(treinos).map(([key, exercises]) => 
  `*Treino ${key}:* ${exercises.length} exercícios`
).join("\n")}

🍽️ *Refeições:*
${Object.values(refeicoes).map(ref => 
  `${ref.icon} ${ref.titulo}: ${ref.itens.length} itens`
).join("\n")}

Para mais detalhes, solicite o plano completo em HTML! 📧`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    
    window.open(whatsappUrl, "_blank");
    toast.success("WhatsApp aberto com o resumo do plano!");
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
        {/* Gestão de Treinadores */}
        <TrainerManagement />

        {/* Automação de Alertas */}
        <AlertManager />

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
            <div className="flex items-end justify-center md:col-span-2">
              <WaterBottle2D 
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

          {/* Professional Registration */}
          <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
            <Label className="text-sm font-medium mb-2 block">Registro Profissional</Label>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {professionalData?.type ? (
                  <div>
                    <p className="font-medium text-foreground">
                      {professionalData.type === "educador" ? "Educador Físico" : "Nutricionista"}
                    </p>
                    <p className="text-xs">
                      Registro: {professionalData.registryMasked || "Não informado"}
                    </p>
                  </div>
                ) : (
                  <p>Nenhum registro informado</p>
                )}
              </div>
              <Button
                onClick={() => setShowProfessionalDialog(true)}
                variant="outline"
                size="sm"
              >
                {professionalData?.type ? "Editar" : "Adicionar"} Registro
              </Button>
            </div>
          </div>

          {/* Training Type Selector */}
          <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
            <Label className="text-sm font-medium mb-2 block">Treino pré-cadastrado</Label>
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
                Adicionar Treino
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Selecione o treino e clique em "Adicionar Treino" para mesclar com os treinos existentes.
            </p>
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

        {/* Action Buttons */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-center">Gerar e Compartilhar Plano</h2>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={generateHTMLFile} size="lg" variant="default" className="gap-2">
              <Download className="w-5 h-5" />
              Baixar HTML
            </Button>
            <Button 
              onClick={() => setShowEmailDialog(true)} 
              size="lg" 
              variant="secondary" 
              className="gap-2"
            >
              <Mail className="w-5 h-5" />
              Enviar por Email
            </Button>
            <Button 
              onClick={handleSendWhatsApp} 
              size="lg" 
              variant="outline" 
              className="gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Compartilhar WhatsApp
            </Button>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Baixe o arquivo HTML ou compartilhe o plano diretamente com o aluno
          </p>
        </Card>
      </div>

      <TemplateLoadDialog
        open={showTemplateDialog}
        onOpenChange={setShowTemplateDialog}
        onReplace={handleTemplateReplace}
        onMerge={handleTemplateMerge}
        onCancel={handleTemplateCancel}
      />

      <ProfessionalRegistrationDialog
        open={showProfessionalDialog}
        onOpenChange={setShowProfessionalDialog}
        onConfirm={(data) => {
          setProfessionalData(data);
          toast.success(
            data.type 
              ? "Registro profissional salvo com sucesso!" 
              : "Continuando sem registro profissional."
          );
        }}
      />

      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Plano por Email</DialogTitle>
            <DialogDescription>
              Personalize a mensagem antes de enviar o plano ao aluno
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="email">Email do destinatário *</Label>
              <Input
                id="email"
                type="email"
                placeholder="aluno@exemplo.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="subject">Assunto do Email</Label>
              <Input
                id="subject"
                type="text"
                placeholder={`Seu Plano de Treino Personalizado - ${formData.nome || '[Nome]'}`}
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="message">Mensagem Personalizada (opcional)</Label>
              <Textarea
                id="message"
                placeholder="Olá! Segue seu plano de treino personalizado..."
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowEmailDialog(false)}
              disabled={isSendingEmail}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSendEmail}
              disabled={isSendingEmail}
            >
              {isSendingEmail ? "Enviando..." : "Enviar Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
