import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProfessionalData {
  type: "educador" | "nutricionista" | null;
  registry: string;
  registryMasked: string;
}

interface ProfessionalRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: ProfessionalData) => void;
}

export const ProfessionalRegistrationDialog = ({
  open,
  onOpenChange,
  onConfirm,
}: ProfessionalRegistrationDialogProps) => {
  const [professionalType, setProfessionalType] = useState<"educador" | "nutricionista" | "">("");
  const [registry, setRegistry] = useState("");
  const [skipRegistration, setSkipRegistration] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    setError("");

    // Se marcou para pular
    if (skipRegistration) {
      onConfirm({
        type: null,
        registry: "",
        registryMasked: "",
      });
      handleClose();
      return;
    }

    // Validação: tipo selecionado
    if (!professionalType) {
      setError("Por favor, selecione o tipo de profissional.");
      return;
    }

    // Validação: registro informado
    const trimmedRegistry = registry.trim();
    const registryRegex = /^[A-Za-z0-9\-\s\/]{4,30}$/;
    
    if (!trimmedRegistry || !registryRegex.test(trimmedRegistry)) {
      setError("Informe um número de registro válido (ex.: CREF 12345-SP ou CRN 000123).");
      return;
    }

    // Máscara parcial para privacidade
    const masked = "****" + trimmedRegistry.slice(-4);

    onConfirm({
      type: professionalType as "educador" | "nutricionista",
      registry: trimmedRegistry,
      registryMasked: masked,
    });

    handleClose();
  };

  const handleClose = () => {
    setProfessionalType("");
    setRegistry("");
    setSkipRegistration(false);
    setError("");
    onOpenChange(false);
  };

  const handleProfessionalTypeChange = (value: string) => {
    setProfessionalType(value as "educador" | "nutricionista");
    setError("");
    setSkipRegistration(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Este plano foi elaborado por um profissional</DialogTitle>
          <DialogDescription>
            Selecione o tipo de profissional responsável e informe o número do
            registro (CREF ou CFN/CRN). Essa informação garante a procedência
            técnica do plano.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Seleção do tipo de profissional */}
          <div className="space-y-3">
            <Label>Tipo de profissional</Label>
            <RadioGroup
              value={professionalType}
              onValueChange={handleProfessionalTypeChange}
              disabled={skipRegistration}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="educador" id="educador" />
                <Label htmlFor="educador" className="font-normal cursor-pointer">
                  Educador Físico{" "}
                  <span className="text-muted-foreground text-sm">(CREF)</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nutricionista" id="nutricionista" />
                <Label htmlFor="nutricionista" className="font-normal cursor-pointer">
                  Nutricionista{" "}
                  <span className="text-muted-foreground text-sm">(CFN/CRN)</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Campo de registro */}
          {professionalType && !skipRegistration && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="registry">Número do registro</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      {professionalType === "educador"
                        ? "Informe o número completo do CREF (ex.: CREF 12345-SP)"
                        : "Informe o número completo do CRN ou CFN (ex.: CRN 000123)"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="registry"
                placeholder={
                  professionalType === "educador"
                    ? "Ex.: CREF 12345-SP"
                    : "Ex.: CRN 000123"
                }
                value={registry}
                onChange={(e) => {
                  setRegistry(e.target.value);
                  setError("");
                }}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Informe o número completo do registro.
              </p>
            </div>
          )}

          {/* Opção de pular */}
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="skip"
              checked={skipRegistration}
              onCheckedChange={(checked) => {
                setSkipRegistration(checked as boolean);
                if (checked) {
                  setProfessionalType("");
                  setRegistry("");
                  setError("");
                }
              }}
            />
            <Label
              htmlFor="skip"
              className="text-sm font-normal cursor-pointer leading-tight"
            >
              Desejo continuar sem informar o registro (não recomendado)
            </Label>
          </div>

          {/* Mensagem de erro */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Aviso ao pular */}
          {skipRegistration && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Deseja continuar sem informar o registro? O plano será marcado como{" "}
                <strong>Sem registro informado</strong>.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
