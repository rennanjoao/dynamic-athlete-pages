/**
 * ProteinGuideDialog.tsx — Guia de fontes de proteína + tabela TACO resumida.
 */
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Beef } from "lucide-react";
import { TACO_FOODS } from "@/data/tacoFoods";

interface Props { trigger?: React.ReactNode }

export default function ProteinGuideDialog({ trigger }: Props) {
  const proteins = TACO_FOODS.filter((f) => f.group === "protein");
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-1.5">
            <Beef className="w-3.5 h-3.5" /> Proteínas
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🥩 Guia de Proteínas & Lipídios</DialogTitle>
        </DialogHeader>

        <div className="border-l-4 border-emerald-500 pl-3 py-2">
          <h4 className="text-sm font-bold text-emerald-500 mb-1">✅ Fontes liberadas</h4>
          <ul className="text-xs space-y-0.5 text-foreground/90">
            <li>🐔 <strong>Aves:</strong> peito de frango, coxa/sobrecoxa sem pele.</li>
            <li>🥩 <strong>Bovinos magros:</strong> patinho, coxão mole, contra-filé limpo.</li>
            <li>🐟 <strong>Peixes magros:</strong> merluza, tilápia, atum em água.</li>
          </ul>
        </div>

        <div className="border-l-4 border-amber-500 pl-3 py-2 mt-3">
          <h4 className="text-sm font-bold text-amber-500 mb-1">🔶 Proteínas gordas (zero carbo)</h4>
          <p className="text-[11px] text-muted-foreground mb-1">
            Cortes ricos em colágeno e ômega-3 para suporte hormonal noturno.
          </p>
          <ul className="text-xs space-y-0.5 text-foreground/90">
            <li>🥩 Músculo, acém, maminha, picanha</li>
            <li>🐷 Lombo com capa, bisteca</li>
            <li>🐟 Salmão, sardinha</li>
          </ul>
        </div>

        <h4 className="text-sm font-bold text-primary mt-4 mb-2">📊 Referência TACO (por 100 g cru)</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-1.5 text-primary">Alimento</th>
                <th className="text-right p-1.5 text-primary">Kcal</th>
                <th className="text-right p-1.5 text-primary">Prot</th>
                <th className="text-right p-1.5 text-primary">Lip</th>
              </tr>
            </thead>
            <tbody>
              {proteins.map((f) => (
                <tr key={f.name} className="border-b border-border/40">
                  <td className="p-1.5">{f.name}</td>
                  <td className="p-1.5 text-right">{f.kcal}</td>
                  <td className="p-1.5 text-right">{f.p}g</td>
                  <td className="p-1.5 text-right">{f.g}g</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
