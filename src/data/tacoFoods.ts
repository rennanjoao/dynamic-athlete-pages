/**
 * tacoFoods.ts — Subconjunto da Tabela TACO (UNICAMP) com alimentos mais usados
 * em planos de hipertrofia/recomposição. Valores por 100 g cru, exceto onde indicado.
 */

export interface TacoFood {
  name: string;
  kcal: number;
  /** proteína (g) */ p: number;
  /** carboidrato (g) */ c: number;
  /** lipídeo (g) */ g: number;
  group: "carb" | "protein" | "fat" | "veg" | "fruit" | "dairy" | "other";
}

export const TACO_FOODS: TacoFood[] = [
  // Carboidratos
  { name: "Arroz branco (cru)", kcal: 358, p: 7.2, c: 78.8, g: 0.6, group: "carb" },
  { name: "Arroz integral (cru)", kcal: 360, p: 7.3, c: 77.5, g: 1.9, group: "carb" },
  { name: "Batata doce (crua)", kcal: 118, p: 1.3, c: 28.2, g: 0.1, group: "carb" },
  { name: "Batata inglesa (crua)", kcal: 64, p: 1.2, c: 14.7, g: 0.0, group: "carb" },
  { name: "Mandioca (crua)", kcal: 151, p: 1.1, c: 36.2, g: 0.3, group: "carb" },
  { name: "Macarrão (cru)", kcal: 371, p: 10.0, c: 78.5, g: 1.3, group: "carb" },
  { name: "Aveia em flocos", kcal: 394, p: 13.9, c: 66.6, g: 8.5, group: "carb" },
  { name: "Pão francês", kcal: 300, p: 8.0, c: 58.6, g: 3.1, group: "carb" },
  { name: "Pão integral", kcal: 253, p: 9.4, c: 49.9, g: 2.9, group: "carb" },
  { name: "Tapioca (goma)", kcal: 358, p: 0.0, c: 89.4, g: 0.1, group: "carb" },
  { name: "Cuscuz de milho", kcal: 113, p: 2.6, c: 25.5, g: 0.4, group: "carb" },
  { name: "Creme de arroz (pó)", kcal: 369, p: 6.0, c: 82.0, g: 1.0, group: "carb" },

  // Proteínas
  { name: "Peito de frango (cru)", kcal: 163, p: 32.0, c: 0, g: 2.5, group: "protein" },
  { name: "Coxa/sobrecoxa s/ pele", kcal: 161, p: 19.2, c: 0, g: 9.3, group: "protein" },
  { name: "Patinho moído (cru)", kcal: 133, p: 21.7, c: 0, g: 5.0, group: "protein" },
  { name: "Coxão mole (cru)", kcal: 137, p: 22.0, c: 0, g: 5.4, group: "protein" },
  { name: "Contra-filé (cru, limpo)", kcal: 145, p: 21.4, c: 0, g: 6.5, group: "protein" },
  { name: "Picanha (crua, limpa)", kcal: 213, p: 26.4, c: 0, g: 11.5, group: "protein" },
  { name: "Acém (cru)", kcal: 213, p: 19.4, c: 0, g: 14.8, group: "protein" },
  { name: "Filé de merluza (cru)", kcal: 81, p: 16.7, c: 0, g: 1.0, group: "protein" },
  { name: "Salmão (cru)", kcal: 170, p: 19.3, c: 0, g: 10.4, group: "protein" },
  { name: "Tilápia (crua)", kcal: 96, p: 20.1, c: 0, g: 1.7, group: "protein" },
  { name: "Sardinha (crua)", kcal: 124, p: 21.5, c: 0, g: 4.2, group: "protein" },
  { name: "Ovo inteiro (1 un. ~50g)", kcal: 143, p: 13.0, c: 1.6, g: 9.5, group: "protein" },
  { name: "Clara de ovo", kcal: 43, p: 9.0, c: 0.4, g: 0.0, group: "protein" },
  { name: "Whey protein isolado (scoop 30g)", kcal: 110, p: 24.0, c: 2.0, g: 1.0, group: "protein" },
  { name: "Atum em água (drenado)", kcal: 116, p: 25.5, c: 0, g: 1.0, group: "protein" },

  // Gorduras
  { name: "Azeite extra virgem", kcal: 884, p: 0, c: 0, g: 100, group: "fat" },
  { name: "Óleo de coco", kcal: 892, p: 0, c: 0, g: 99.1, group: "fat" },
  { name: "Manteiga", kcal: 726, p: 0.4, c: 0.1, g: 82.4, group: "fat" },
  { name: "Pasta de amendoim integral", kcal: 588, p: 25.0, c: 20.0, g: 50.0, group: "fat" },
  { name: "Amendoim torrado", kcal: 544, p: 22.5, c: 20.3, g: 43.9, group: "fat" },
  { name: "Castanha do Pará", kcal: 643, p: 14.5, c: 15.1, g: 63.5, group: "fat" },
  { name: "Castanha de caju", kcal: 570, p: 18.5, c: 28.7, g: 43.8, group: "fat" },
  { name: "Abacate", kcal: 96, p: 1.2, c: 6.0, g: 8.4, group: "fat" },
  { name: "Coco fresco", kcal: 406, p: 3.7, c: 10.4, g: 42.0, group: "fat" },
  { name: "Mussarela de búfala", kcal: 268, p: 19.4, c: 0.6, g: 20.9, group: "dairy" },

  // Frutas
  { name: "Banana prata", kcal: 89, p: 1.3, c: 23.8, g: 0.1, group: "fruit" },
  { name: "Maçã", kcal: 56, p: 0.3, c: 15.2, g: 0.0, group: "fruit" },
  { name: "Mamão papaia", kcal: 40, p: 0.5, c: 10.4, g: 0.1, group: "fruit" },
  { name: "Morango", kcal: 30, p: 0.9, c: 6.8, g: 0.3, group: "fruit" },
  { name: "Abacaxi", kcal: 48, p: 0.9, c: 12.3, g: 0.1, group: "fruit" },

  // Vegetais
  { name: "Brócolis cozido", kcal: 25, p: 2.1, c: 4.0, g: 0.4, group: "veg" },
  { name: "Espinafre cozido", kcal: 16, p: 2.4, c: 1.7, g: 0.2, group: "veg" },
  { name: "Cenoura crua", kcal: 34, p: 1.3, c: 7.7, g: 0.2, group: "veg" },
  { name: "Abobrinha", kcal: 19, p: 1.2, c: 4.3, g: 0.3, group: "veg" },
  { name: "Alface", kcal: 14, p: 1.4, c: 2.4, g: 0.2, group: "veg" },
  { name: "Tomate", kcal: 15, p: 1.1, c: 3.1, g: 0.2, group: "veg" },
  { name: "Pepino", kcal: 10, p: 0.9, c: 2.0, g: 0.1, group: "veg" },

  // Lácteos
  { name: "Leite desnatado", kcal: 35, p: 3.4, c: 4.9, g: 0.2, group: "dairy" },
  { name: "Iogurte natural desnatado", kcal: 41, p: 4.1, c: 5.9, g: 0.1, group: "dairy" },
  { name: "Queijo cottage", kcal: 88, p: 11.7, c: 2.5, g: 4.0, group: "dairy" },
  { name: "Queijo minas frescal", kcal: 264, p: 17.4, c: 3.2, g: 20.2, group: "dairy" },
];

export const TACO_MODES = ["kcal", "p", "c", "g"] as const;
export type TacoMode = (typeof TACO_MODES)[number];

export function searchTaco(query: string): TacoFood[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return TACO_FOODS.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 8);
}

export function equivalentGrams(
  from: TacoFood,
  fromGrams: number,
  to: TacoFood,
  mode: TacoMode
): number | null {
  const fromValue = (from[mode] as number) * (fromGrams / 100);
  const toPer100 = to[mode] as number;
  if (!toPer100 || toPer100 === 0) return null;
  return (fromValue / toPer100) * 100;
}
