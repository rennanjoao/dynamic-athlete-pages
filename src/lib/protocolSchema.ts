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

export const MealSchema = z.object({
  name: z.string().default(""),
  time: z.string().default(""),
  foods: z.string().default(""),
  qtyHighCarb: z.string().optional().default(""),
  qtyLowCarb: z.string().optional().default(""),
  substitutions: z.string().optional().default(""),
});

export const ProtocolPayloadSchema = z.object({
  setup: z.object({
    split: z.string().default("ABC"),
    mealsCount: z.number().int().min(2).max(10).default(5),
    carbCycle: z.boolean().default(false),
  }),
  guidelines: z.object({
    training: z.string().default(""),
    diet: z.string().default(""),
    weekOrganization: z.string().default(""),
    supplementation: z.string().default(""),
  }),
  workouts: z.array(WorkoutDaySchema).default([]),
  meals: z.array(MealSchema).default([]),
  carbCycle: z.record(z.enum(["high", "low", "off"])).default({}),
});

export type ProtocolPayload = z.infer<typeof ProtocolPayloadSchema>;
export type ExerciseRow = z.infer<typeof ExerciseSchema>;
export type WorkoutDay = z.infer<typeof WorkoutDaySchema>;
export type MealRow = z.infer<typeof MealSchema>;

export function makeEmptyExercise(): ExerciseRow {
  return { name: "", sets: "", reps: "", cadence: "", rest: "", notes: "" };
}

export function makeEmptyMeal(name = ""): MealRow {
  return { name, time: "", foods: "", qtyHighCarb: "", qtyLowCarb: "", substitutions: "" };
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
      ? WEEKDAYS.reduce((acc, d) => ({ ...acc, [d.key]: "low" as const }), {})
      : {},
  });
}
