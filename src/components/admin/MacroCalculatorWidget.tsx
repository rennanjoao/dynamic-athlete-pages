/**
 * MacroCalculatorWidget.tsx
 *
 * Componente usado DENTRO do PlanEditor do Coach para calcular e definir
 * as metas de macros do aluno com 2 cliques.
 */

import { useMacros, Goal, ActivityLevel } from "@/utils/macros";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Zap, Droplets, Beef, Wheat, Flame } from "lucide-react";

interface Props {
  initialWeight?: number;
  onApply?: (macros: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    water: number;
  }) => void;
}

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: "sedentario",    label: "Sedentário (sem exercício)" },
  { value: "leve",          label: "Leve (1–2x/semana)" },
  { value: "moderado",      label: "Moderado (3–4x/semana)" },
  { value: "intenso",       label: "Intenso (5–6x/semana)" },
  { value: "muito_intenso", label: "Muito intenso (2x/dia)" },
];

const GOAL_OPTIONS: { value: Goal; label: string; emoji: string }[] = [
  { value: "emagrecer",     label: "Emagrecer",       emoji: "📉" },
  { value: "manter",        label: "Manter",           emoji: "⚖️" },
  { value: "hipertrofia",   label: "Hipertrofia",      emoji: "💪" },
  { value: "recomposicao",  label: "Recomposição",     emoji: "🔄" },
];

function MacroPill({
  icon,
  label,
  value,
  unit,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}18` }}
      >
        <span style={{ color, fontSize: 14 }}>{icon}</span>
      </div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-bold text-[#0F172A]">
          {value}
          <span className="text-slate-400 font-normal"> {unit}</span>
        </p>
      </div>
    </div>
  );
}

export function MacroCalculatorWidget({ initialWeight, onApply }: Props) {
  const { input, result, update } = useMacros({
    weight: initialWeight ?? 70,
  });

  const handleApply = () => {
    onApply?.({
      calories: result.targetCalories,
      protein:  result.protein,
      fat:      result.fat,
      carbs:    result.carbs,
      water:    result.water,
    });
  };

  return (
    <div className="space-y-4">
      {/* Inputs */}
      <div className="grid grid-cols-3 gap-2.5">
        <div>
          <Label className="text-xs text-slate-500">Peso (kg)</Label>
          <Input
            type="number"
            value={input.weight}
            onChange={(e) => update({ weight: +e.target.value })}
            className="mt-1 h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs text-slate-500">Altura (cm)</Label>
          <Input
            type="number"
            value={input.height}
            onChange={(e) => update({ height: +e.target.value })}
            className="mt-1 h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs text-slate-500">Idade</Label>
          <Input
            type="number"
            value={input.age}
            onChange={(e) => update({ age: +e.target.value })}
            className="mt-1 h-8 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <Label className="text-xs text-slate-500">Sexo</Label>
          <Select
            value={input.gender}
            onValueChange={(v) => update({ gender: v as "male" | "female" })}
          >
            <SelectTrigger className="mt-1 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Masculino</SelectItem>
              <SelectItem value="female">Feminino</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-slate-500">Objetivo</Label>
          <Select
            value={input.goal}
            onValueChange={(v) => update({ goal: v as Goal })}
          >
            <SelectTrigger className="mt-1 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GOAL_OPTIONS.map((g) => (
                <SelectItem key={g.value} value={g.value}>
                  {g.emoji} {g.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-xs text-slate-500">Nível de Atividade</Label>
        <Select
          value={input.activity}
          onValueChange={(v) => update({ activity: v as ActivityLevel })}
        >
          <SelectTrigger className="mt-1 h-8 text-xs w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACTIVITY_OPTIONS.map((a) => (
              <SelectItem key={a.value} value={a.value} className="text-xs">
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            TMB: <strong className="text-[#0F172A]">{result.tmb} kcal</strong>
            {" · "}
            TDEE: <strong className="text-[#0F172A]">{result.tdee} kcal</strong>
          </p>
          <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
            {result.targetCalories} kcal/dia
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <MacroPill
            icon={<Beef size={14} />}
            label="Proteína"
            value={result.protein}
            unit="g"
            color="#3B82F6"
          />
          <MacroPill
            icon={<Wheat size={14} />}
            label="Carboidrato"
            value={result.carbs}
            unit="g"
            color="#F59E0B"
          />
          <MacroPill
            icon={<Flame size={14} />}
            label="Gordura"
            value={result.fat}
            unit="g"
            color="#EF4444"
          />
          <MacroPill
            icon={<Droplets size={14} />}
            label="Água"
            value={result.water}
            unit="L"
            color="#06B6D4"
          />
        </div>
      </div>

      {onApply && (
        <Button
          className="w-full h-9 bg-[#3B82F6] hover:bg-blue-600 text-sm"
          onClick={handleApply}
        >
          <Zap className="w-3.5 h-3.5 mr-1.5" />
          Aplicar ao plano do aluno
        </Button>
      )}
    </div>
  );
}
