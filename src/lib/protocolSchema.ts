/**
 * protocolSchema.ts — Schema central do Protocolo Master.
 * Estrutura única (JSONB) que abriga treino, dieta, ciclo de carbo,
 * suplementação e diretrizes do aluno.
 */

import { z } from "zod";

export const SPLIT_OPTIONS = [
  { value: "AB", label: "AB", days: ["A", "B"] },
  { value: "ABC", label: "ABC", days: ["A", "B", "C"] },
  { value: "ABCD", label: "ABCD", days: ["A", "B", "C", "D"] },
  { value: "ABCDE", label: "ABCDE", days: ["A", "B", "C", "D", "E"] },
  { value: "ABCDEF", label: "ABCDEF", days: ["A", "B", "C", "D", "E", "F"] },
] as const;

export type SplitValue = (typeof SPLIT_OPTIONS)[number]["value"];

export const WEEKDAYS = [
  { key: "mon", label: "Segunda" },
  { key: "tue", label: "Terça" },
  { key: "wed", label: "Quarta" },
  { key: "thu", label: "Quinta" },
  { key: "fri", label: "Sexta" },
  { key: "sat", label: "Sábado" },
  { key: "sun", label: "Domingo" },
] as const;

export type WeekdayKey = (typeof WEEKDAYS)[number]["key"];

export const ExerciseSchema = z.object({
  name: z.string().default(""),
  sets: z.string().default(""),
  reps: z.string().optional().default(""),
  cadence: z.string().optional().default(""),
  rest: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

export const WorkoutDaySchema = z.object({
  key: z.string(),
  focus: z.string().default(""),
  exercises: z.array(ExerciseSchema).default([]),
});

/** Macros por refeição (g). 0 = não aplicável. */
export const MealMacrosSchema = z.object({
  carbs: z.number().min(0).default(0),
  protein: z.number().min(0).default(0),
  fat: z.number().min(0).default(0),
});

/** Uma opção de prato dentro da refeição. */
export const MealOptionSchema = z.object({
  title: z.string().default(""),
  items: z.string().default(""), // texto livre dos alimentos
});

/** Substituições por macro — 2 entradas cada. */
export const MealSubsSchema = z.object({
  carb: z.array(z.string()).default(["", ""]),
  protein: z.array(z.string()).default(["", ""]),
  fat: z.array(z.string()).default(["", ""]),
});

export const MealSchema = z.object({
  name: z.string().default(""),
  time: z.string().default(""),
  // novos campos estruturados
  macros: MealMacrosSchema.default({ carbs: 0, protein: 0, fat: 0 }),
  options: z.array(MealOptionSchema).default([
    { title: "Opção 1", items: "" },
    { title: "Opção 2", items: "" },
  ]),
  substitutions: MealSubsSchema.default({ carb: ["", ""], protein: ["", ""], fat: ["", ""] }),
  notes: z.string().optional().default(""),
  // legados (mantidos para compat de leitura)
  foods: z.string().optional().default(""),
  qtyHighCarb: z.string().optional().default(""),
  qtyLowCarb: z.string().optional().default(""),
});

export const MacrosBaseSchema = z.object({
  calories: z.number().int().min(0).default(2200),
  protein: z.number().int().min(0).default(160),
  carbs: z.number().int().min(0).default(250),
  fat: z.number().int().min(0).default(55),
  water: z.number().min(0).default(2.5),
  goal: z.string().default("hipertrofia"),
});

export const ProtocolPayloadSchema = z.object({
  setup: z.object({
    split: z.string().default("ABC"),
    mealsCount: z.number().int().min(2).max(10).default(5),
    carbCycle: z.boolean().default(false),
  }),
  macros: MacrosBaseSchema.default({
    calories: 2200, protein: 160, carbs: 250, fat: 55, water: 2.5, goal: "hipertrofia",
  }),
  guidelines: z.object({
    training: z.string().default(""),
    diet: z.string().default(""),
    weekOrganization: z.string().default(""),
    supplementation: z.string().default(""),
  }),
  workouts: z.array(WorkoutDaySchema).default([]),
  meals: z.array(MealSchema).default([]),
  // base/high/off — multiplicadores: base=1, high=+15%, off=-15%
  // Tolerante: aceita strings descritivas e infere o modo por palavras-chave,
  // preservando o texto original em `carbCycleNotes`.
  carbCycle: z.preprocess((val) => {
    if (!val || typeof val !== "object") return {};
    const out: Record<string, "high" | "base" | "off" | "low"> = {};
    for (const [k, raw] of Object.entries(val as Record<string, unknown>)) {
      const v = String(raw ?? "").toLowerCase().trim();
      const key = k.toLowerCase();
      if (["high", "base", "off", "low"].includes(v)) {
        out[k] = v as "high" | "base" | "off" | "low";
        continue;
      }
      // inferir por palavras-chave
      let inferred: "high" | "base" | "off" | "low" = "base";
      if (/\b(alto|high|\+\s*15|aumento|carga)\b/.test(v)) inferred = "high";
      else if (/\b(off|descanso|rest|reduzido|baixo|low|-\s*15)\b/.test(v)) inferred = "off";
      else if (/\b(base|normal|manuten)/.test(v)) inferred = "base";
      else if (["high", "base", "off", "low"].includes(key)) {
        inferred = key as "high" | "base" | "off" | "low";
      }
      out[k] = inferred;
    }
    return out;
  }, z.record(z.enum(["high", "base", "off", "low"])).default({})),
  // Texto original descritivo de cada entrada do ciclo de carbo (quando vier livre).
  carbCycleNotes: z.preprocess((val) => {
    if (!val || typeof val !== "object") return {};
    const out: Record<string, string> = {};
    for (const [k, raw] of Object.entries(val as Record<string, unknown>)) {
      if (typeof raw === "string" && raw.trim()) out[k] = raw;
    }
    return out;
  }, z.record(z.string()).default({})),
});


export type ProtocolPayload = z.infer<typeof ProtocolPayloadSchema>;
export type ExerciseRow = z.infer<typeof ExerciseSchema>;
export type WorkoutDay = z.infer<typeof WorkoutDaySchema>;
export type MealRow = z.infer<typeof MealSchema>;
export type MealMacros = z.infer<typeof MealMacrosSchema>;

export function makeEmptyExercise(): ExerciseRow {
  return { name: "", sets: "", reps: "", cadence: "", rest: "", notes: "" };
}

export function makeEmptyMeal(name = ""): MealRow {
  return {
    name,
    time: "",
    macros: { carbs: 0, protein: 0, fat: 0 },
    options: [
      { title: "Opção 1", items: "" },
      { title: "Opção 2", items: "" },
    ],
    substitutions: { carb: ["", ""], protein: ["", ""], fat: ["", ""] },
    notes: "",
    foods: "",
    qtyHighCarb: "",
    qtyLowCarb: "",
  };
}

/** Cria payload base a partir do setup escolhido no modal. */
export function buildBasePayload(setup: {
  split: SplitValue;
  mealsCount: number;
  carbCycle: boolean;
}): ProtocolPayload {
  const splitDef = SPLIT_OPTIONS.find((s) => s.value === setup.split) ?? SPLIT_OPTIONS[1];
  const defaultMealNames = ["Café", "Lanche 1", "Almoço", "Pré-treino", "Pós-treino", "Jantar", "Ceia", "Extra"];

  return ProtocolPayloadSchema.parse({
    setup,
    macros: { calories: 2200, protein: 160, carbs: 250, fat: 55, water: 2.5, goal: "hipertrofia" },
    guidelines: { training: "", diet: "", weekOrganization: "", supplementation: "" },
    workouts: splitDef.days.map((k) => ({
      key: k,
      focus: "",
      exercises: Array.from({ length: 4 }, () => makeEmptyExercise()),
    })),
    meals: Array.from({ length: setup.mealsCount }, (_, i) =>
      makeEmptyMeal(defaultMealNames[i] ?? `Refeição ${i + 1}`)
    ),
    carbCycle: setup.carbCycle
      ? WEEKDAYS.reduce((acc, d) => ({ ...acc, [d.key]: "base" as const }), {})
      : {},
  });
}
