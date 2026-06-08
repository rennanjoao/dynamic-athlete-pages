import type { TacoFood } from "@/data/tacoFoods";

export type Kind = "carb" | "protein" | "fat";

export function tacoGroupToKind(group: TacoFood["group"]): Kind {
  if (group === "protein") return "protein";
  if (group === "fat") return "fat";
  return "carb";
}
