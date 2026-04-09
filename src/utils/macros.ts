/**
 * macros.ts — Cálculo de TMB, TDEE e Metas de Macronutrientes
 *
 * Fórmulas:
 *   TMB Masculino (Mifflin-St Jeor): 10×peso + 6.25×altura − 5×idade + 5
 *   TMB Feminino:                    10×peso + 6.25×altura − 5×idade − 161
 *   TDEE = TMB × fator de atividade
 *   Proteína: 1.8–2.2g/kg para hipertrofia | 1.6g/kg manutenção | 2.0g/kg emagrecimento
 *   Gordura: 25% das calorias totais
 *   Carboidrato: calorias restantes / 4
 */

export type Goal = "emagrecer" | "manter" | "hipertrofia" | "recomposicao";
export type ActivityLevel =
  | "sedentario"
  | "leve"
  | "moderado"
  | "intenso"
  | "muito_intenso";

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentario:    1.2,
  leve:          1.375,
  moderado:      1.55,
  intenso:       1.725,
  muito_intenso: 1.9,
};

const GOAL_CALORIE_DELTA: Record<Goal, number> = {
  emagrecer:     -400,
  manter:           0,
  hipertrofia:   +300,
  recomposicao:  -100,
};

const PROTEIN_G_PER_KG: Record<Goal, number> = {
  emagrecer:     2.0,
  manter:        1.6,
  hipertrofia:   2.2,
  recomposicao:  2.0,
};

export interface MacroResult {
  tmb: number;
  tdee: number;
  targetCalories: number;
  protein: number;   // g
  fat: number;       // g
  carbs: number;     // g
  water: number;     // L
}

export interface MacroInput {
  weight: number;   // kg
  height: number;   // cm
  age: number;
  gender: "male" | "female";
  activity: ActivityLevel;
  goal: Goal;
}

export function calculateMacros(input: MacroInput): MacroResult {
  const { weight, height, age, gender, activity, goal } = input;

  // TMB (Mifflin-St Jeor)
  const tmb =
    gender === "male"
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;

  const tdee = Math.round(tmb * ACTIVITY_FACTORS[activity]);
  const targetCalories = Math.round(tdee + GOAL_CALORIE_DELTA[goal]);

  // Macros
  const proteinG = Math.round(weight * PROTEIN_G_PER_KG[goal]);
  const proteinCal = proteinG * 4;

  const fatCal = Math.round(targetCalories * 0.25);
  const fatG = Math.round(fatCal / 9);

  const carbCal = targetCalories - proteinCal - fatCal;
  const carbG = Math.round(Math.max(carbCal, 0) / 4);

  // Água: 35 ml/kg mínimo, +500ml se intenso/muito_intenso
  const waterBase = (weight * 35) / 1000;
  const waterBonus =
    activity === "intenso" || activity === "muito_intenso" ? 0.5 : 0;
  const water = Math.round((waterBase + waterBonus) * 10) / 10;

  return {
    tmb: Math.round(tmb),
    tdee,
    targetCalories,
    protein: proteinG,
    fat: fatG,
    carbs: carbG,
    water,
  };
}

// ─── React hook wrapper ───────────────────────────────────────────────────────

import { useState, useMemo } from "react";

export function useMacros(defaults?: Partial<MacroInput>) {
  const [input, setInput] = useState<MacroInput>({
    weight: 70,
    height: 170,
    age: 25,
    gender: "male",
    activity: "moderado",
    goal: "manter",
    ...defaults,
  });

  const result = useMemo(() => calculateMacros(input), [input]);

  const update = (partial: Partial<MacroInput>) =>
    setInput((prev) => ({ ...prev, ...partial }));

  return { input, result, update };
}
