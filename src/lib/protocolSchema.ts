import { z } from "zod";

export const SPLIT_OPTIONS = [
  { value: "AB", label: "AB" },
  { value: "ABC", label: "ABC" },
  { value: "ABCD", label: "ABCD" },
  { value: "ABCDE", label: "ABCDE" },
  { value: "PPL", label: "Push/Pull/Legs" },
  { value: "UPPER_LOWER", label: "Upper/Lower" },
  { value: "FULLBODY", label: "Full Body" },
] as const;

export type SplitValue = (typeof SPLIT_OPTIONS)[number]["value"];

export const WEEKDAYS = [
  { key: "seg", label: "Segunda" },
  { key: "ter", label: "Terça" },
  { key: "qua", label: "Quarta" },
  { key: "qui", label: "Quinta" },
  { key: "sex", label: "Sexta" },
  { key: "sab", label: "Sábado" },
  { key: "dom", label: "Domingo" },
] as const;

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

export const MealOptionSchema = z.object({
  title: z.string().default(""),
  items: z.string().default(""),
});

export const MealSubstitutionsSchema = z.object({
  carb: z.array(z.string()).default([]),
  protein: z.array(z.string()).default([]),
  fat: z.array(z.string()).default([]),
});

export const MealSchema = z.object({
  name: z.string().default(""),
  time: z.string().default(""),
  macros: MealMacrosSchema.default({ carbs: 0, protein: 0, fat: 0 }),
  carbs: z.array(z.string()).default([]),
  proteins: z.array(z.string()).default([]),
  fats: z.array(z.string()).default([]),
  free: z.array(z.string()).default([]),
  options: z.array(MealOptionSchema).default([]),
  substitutions: MealSubstitutionsSchema.default({ carb: [], protein: [], fat: [] }),
  notes: z.string().optional().default(""),
});

// Tolerant carb cycle: accepts any string, normalizes to known enum if recognized.
const CarbDayEnum = z.enum(["high", "base", "off", "low"]);
const CarbDayTolerant = z.preprocess((v) => {
  if (typeof v !== "string") return "base";
  const s = v.toLowerCase();
  if (s.includes("alto") || s.includes("high") || s.includes("+")) return "high";
  if (s.includes("off") || s.includes("baixo") || s.includes("low") || s.includes("-")) return "off";
  if (CarbDayEnum.safeParse(s).success) return s;
  return "base";
}, CarbDayEnum);

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
  }).default({} as any),
  guidelines: z.object({
    training: z.string().default(""),
    diet: z.string().default(""),
    weekOrganization: z.string().default(""),
    supplementation: z.string().default(""),
  }).default({} as any),
  workouts: z.array(WorkoutDaySchema).default([]),
  meals: z.array(MealSchema).default([]),
  carbCycle: z.record(CarbDayTolerant).default({}),
  carbCycleNotes: z.record(z.string()).default({}),
});

export type ProtocolPayload = z.infer<typeof ProtocolPayloadSchema>;
export type MealRow = z.infer<typeof MealSchema>;

export function makeEmptyExercise(): z.infer<typeof ExerciseSchema> {
  return { name: "", sets: "", reps: "", cadence: "", rest: "", notes: "" };
}

export function makeEmptyMeal(name = "Refeição"): z.infer<typeof MealSchema> {
  return {
    name,
    time: "",
    macros: { carbs: 0, protein: 0, fat: 0 },
    carbs: [],
    proteins: [],
    fats: [],
    free: [],
    options: [
      { title: "Opção 1", items: "" },
      { title: "Opção 2", items: "" },
    ],
    substitutions: { carb: ["", ""], protein: ["", ""], fat: ["", ""] },
    notes: "",
  };
}

function splitToWorkoutKeys(split: string): string[] {
  switch (split) {
    case "AB": return ["A", "B"];
    case "ABC": return ["A", "B", "C"];
    case "ABCD": return ["A", "B", "C", "D"];
    case "ABCDE": return ["A", "B", "C", "D", "E"];
    case "PPL": return ["Push", "Pull", "Legs"];
    case "UPPER_LOWER": return ["Upper", "Lower"];
    case "FULLBODY": return ["Full Body"];
    default: return ["A", "B", "C"];
  }
}

export function buildBasePayload(setup: {
  split: SplitValue | string;
  mealsCount: number;
  carbCycle: boolean;
}): ProtocolPayload {
  const workouts = splitToWorkoutKeys(setup.split).map((k) => ({
    key: k,
    focus: "",
    exercises: [makeEmptyExercise()],
  }));
  const meals = Array.from({ length: setup.mealsCount }, (_, i) =>
    makeEmptyMeal(`Refeição ${i + 1}`)
  );
  const carbCycle: Record<string, "high" | "base" | "off"> = {};
  if (setup.carbCycle) {
    WEEKDAYS.forEach((d) => (carbCycle[d.key] = "base"));
  }
  return ProtocolPayloadSchema.parse({
    setup,
    workouts,
    meals,
    carbCycle,
  });
}
