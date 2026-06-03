import { z } from "zod";

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

export const MealMacrosSchema = z.object({
  carbs: z.number().min(0).default(0),
  protein: z.number().min(0).default(0),
  fat: z.number().min(0).default(0),
});

export const MealSchema = z.object({
  name: z.string().default(""),
  time: z.string().default(""),
  macros: MealMacrosSchema.default({ carbs: 0, protein: 0, fat: 0 }),
  // NOVA ARQUITETURA MODULAR
  carbs: z.array(z.string()).default([]),
  proteins: z.array(z.string()).default([]),
  fats: z.array(z.string()).default([]),
  free: z.array(z.string()).default([]),
  notes: z.string().optional().default(""),
});

export const ProtocolPayloadSchema = z.object({
  setup: z.object({
    split: z.string().default("ABC"),
    mealsCount: z.number().int().min(2).max(10).default(5),
    carbCycle: z.boolean().default(false),
  }),
  macros: z.object({
    calories: z.number().default(2200),
    protein: z.number().default(160),
    carbs: z.number().default(250),
    fat: z.number().default(55),
    water: z.number().default(3.0),
    goal: z.string().default("hipertrofia"),
  }),
  guidelines: z.object({
    training: z.string().default(""),
    diet: z.string().default(""),
    weekOrganization: z.string().default(""),
    supplementation: z.string().default(""),
  }),
  workouts: z.array(WorkoutDaySchema).default([]),
  meals: z.array(MealSchema).default([]),
  carbCycleNotes: z.record(z.string()).default({}),
});

export type ProtocolPayload = z.infer<typeof ProtocolPayloadSchema>;
export type MealRow = z.infer<typeof MealSchema>;
