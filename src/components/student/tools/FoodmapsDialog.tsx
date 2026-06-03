/**
 * FoodmapsDialog.tsx — Guia FODMAPs para o aluno (Seguros / Moderar / Restringir).
 */
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Leaf } from "lucide-react";

const GROUPS = [
  {
    title: "✅ Seguros — Use à vontade",
    color: "text-emerald-500 border-emerald-500/40",
    items: [
      "Brócolis — excelente aliado",
      "Abobrinha (zucchini)",
      "Pepino (sem casca)",
      "Espinafre",
      "Vagem",
      "Alface, rúcula, agrião",
      "Cenoura",
      "Chuchu",
    ],
  },
  {
    title: "⚠️ Moderar (com cautela)",
    color: "text-amber-500 border-amber-500/40",
    items: [
      "Tomate (pequenas qtd)",
      "Alho cru em excesso",
      "Couve-flor (pode fermentar)",
      "Beterraba",
    ],
  },
  {
    title: "❌ Restringir — Fermentadores",
    color: "text-rose-500 border-rose-500/40",
    items: [
      "Feijão em grande volume (reduza se gerar desconforto)",
      "Laticínios ricos em lactose",
      "Cebola crua em grande quantidade",
    ],
  },
];

interface Props { trigger?: React.ReactNode }

export default function FoodmapsDialog({ trigger }: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-1.5">
            <Leaf className="w-3.5 h-3.5" /> FODMAPs
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🥬 Guia FODMAPs</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Modulação intestinal é essencial. Intestino inflamado reduz absorção e prejudica resposta hormonal.
        </p>
        <div className="grid sm:grid-cols-3 gap-3 mt-2">
          {GROUPS.map((g) => (
            <div key={g.title} className={`border rounded-lg p-3 ${g.color}`}>
              <h5 className={`text-sm font-bold mb-2 ${g.color.split(" ")[0]}`}>{g.title}</h5>
              <ul className="space-y-1 text-xs text-foreground/90">
                {g.items.map((i) => <li key={i}>• {i}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
