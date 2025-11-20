import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2 } from "lucide-react";

export interface Supplement {
  id: string;
  nome: string;
  horario: string;
  refeicaoAssociada: string;
  relacao: "antes" | "depois" | "";
  observacao: string;
  essencial: boolean;
}

interface SupplementsSectionProps {
  supplements: Supplement[];
  onAdd: () => void;
  onUpdate: (id: string, field: keyof Supplement, value: any) => void;
  onRemove: (id: string) => void;
}

export const SupplementsSection = ({ 
  supplements, 
  onAdd, 
  onUpdate, 
  onRemove 
}: SupplementsSectionProps) => {
  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Suplementos e Vitaminas</h2>
        <p className="text-sm text-muted-foreground">
          Adicione suplementos, vitaminas ou medicamentos de uso complementar. 
          Você pode associar cada item a uma refeição (antes/depois) ou deixá-lo sem associação.
        </p>
      </div>

      <div className="space-y-6">
        {supplements.map((supplement) => (
          <div key={supplement.id} className="border border-border rounded-lg p-4 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`supp-nome-${supplement.id}`}>Nome do suplemento</Label>
                  <Input
                    id={`supp-nome-${supplement.id}`}
                    value={supplement.nome}
                    onChange={(e) => onUpdate(supplement.id, "nome", e.target.value)}
                    placeholder="Ex.: Whey Protein, Vitamina D, Creatina"
                  />
                </div>
                <div>
                  <Label htmlFor={`supp-horario-${supplement.id}`}>Horário</Label>
                  <Input
                    id={`supp-horario-${supplement.id}`}
                    type="time"
                    value={supplement.horario}
                    onChange={(e) => onUpdate(supplement.id, "horario", e.target.value)}
                    placeholder="Ex.: 08:00"
                  />
                </div>
              </div>
              <Button
                onClick={() => onRemove(supplement.id)}
                variant="ghost"
                size="icon"
                className="shrink-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`supp-refeicao-${supplement.id}`}>Associar a qual refeição?</Label>
                <Select 
                  value={supplement.refeicaoAssociada} 
                  onValueChange={(value) => onUpdate(supplement.id, "refeicaoAssociada", value)}
                >
                  <SelectTrigger id={`supp-refeicao-${supplement.id}`}>
                    <SelectValue placeholder="Nenhuma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhuma">Nenhuma</SelectItem>
                    <SelectItem value="cafe">Café da manhã</SelectItem>
                    <SelectItem value="lanche-manha">Lanche (manhã)</SelectItem>
                    <SelectItem value="almoco">Almoço</SelectItem>
                    <SelectItem value="lanche-tarde">Lanche (tarde)</SelectItem>
                    <SelectItem value="jantar">Jantar</SelectItem>
                    <SelectItem value="ceia">Ceia</SelectItem>
                    <SelectItem value="outra">Outra</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {supplement.refeicaoAssociada && supplement.refeicaoAssociada !== "nenhuma" && (
                <div>
                  <Label>Tomar:</Label>
                  <RadioGroup
                    value={supplement.relacao}
                    onValueChange={(value) => onUpdate(supplement.id, "relacao", value as "antes" | "depois")}
                    className="flex gap-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="antes" id={`antes-${supplement.id}`} />
                      <Label htmlFor={`antes-${supplement.id}`} className="cursor-pointer">Antes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="depois" id={`depois-${supplement.id}`} />
                      <Label htmlFor={`depois-${supplement.id}`} className="cursor-pointer">Depois</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor={`supp-obs-${supplement.id}`}>Observação (opcional)</Label>
              <Textarea
                id={`supp-obs-${supplement.id}`}
                value={supplement.observacao}
                onChange={(e) => onUpdate(supplement.id, "observacao", e.target.value)}
                placeholder="Detalhes adicionais sobre o suplemento"
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`essencial-${supplement.id}`}
                checked={supplement.essencial}
                onChange={(e) => onUpdate(supplement.id, "essencial", e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor={`essencial-${supplement.id}`} className="cursor-pointer text-sm">
                Marcar como essencial
              </Label>
            </div>
          </div>
        ))}

        {supplements.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum suplemento adicionado ainda.</p>
            <p className="text-sm">Clique no botão abaixo para adicionar.</p>
          </div>
        )}
      </div>

      <Button onClick={onAdd} size="sm" variant="outline" className="mt-4">
        <Plus className="w-4 h-4 mr-2" />
        Adicionar Suplemento
      </Button>
    </Card>
  );
};
