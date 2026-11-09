/**
 * Contrato do "remover macro" da refeição.
 *
 * Bug original: "remover" só adicionava o tipo em hiddenKinds e deixava os alimentos
 * em options — o macro continuava contando. Aqui travamos: remover apaga de verdade,
 * e qualquer tipo oculto (inclusive em protocolos antigos) é ignorado nos cálculos.
 */
import { describe, it, expect } from "vitest";
import {
  withoutHiddenKinds, removeKindPatch, restoreKindPatch, getHiddenKinds,
  countFilledItems, blankFoodItem,
} from "@/lib/mealVisibility";

const item = (name: string, rawWeight: number) => ({
  name, baseName: name, weight: `${rawWeight}g`, rawWeight, cookFactor: 1, isTaco: true,
});

const makeMeal = () => ({
  name: "Refeição 1",
  time: "07:00",
  options: [
    { kind: "carb", title: "Opção 1", notes: "", items: [item("Arroz", 150), item("Batata", 100)] },
    { kind: "carb", title: "Opção 2", notes: "", items: [item("Macarrão", 120)] },
    { kind: "protein", title: "Opção 1", notes: "", items: [item("Frango", 150)] },
    { kind: "fat", title: "Opção 1", notes: "", items: [item("Azeite", 10)] },
  ],
} as any);

// soma ingênua de gramas por tipo — suficiente para provar quem entra na conta
const grams = (meal: any, kind: string) =>
  (meal.options || [])
    .filter((o: any) => o.kind === kind)
    .flatMap((o: any) => o.items)
    .reduce((s: number, it: any) => s + (it.rawWeight || 0), 0);

describe("removeKindPatch — remover de verdade", () => {
  it("apaga as opções do tipo e mantém os demais tipos intactos", () => {
    const meal = makeMeal();
    const { patch } = removeKindPatch(meal, "carb");
    const after = { ...meal, ...patch };
    expect(after.options.some((o: any) => o.kind === "carb")).toBe(false);
    expect(after.options.filter((o: any) => o.kind === "protein")).toHaveLength(1);
    expect(after.options.filter((o: any) => o.kind === "fat")).toHaveLength(1);
    expect(after.hiddenKinds).toEqual(["carb"]);
  });

  it("cenário do bug: depois de remover, o carbo não soma mais nada", () => {
    const meal = makeMeal();
    expect(grams(meal, "carb")).toBe(370);
    const after = { ...meal, ...removeKindPatch(meal, "carb").patch };
    expect(grams(after, "carb")).toBe(0);
    expect(grams(after, "protein")).toBe(150);
  });

  it("conta quantos alimentos preenchidos foram apagados (para decidir o Desfazer)", () => {
    const r = removeKindPatch(makeMeal(), "carb");
    expect(r.removedItemCount).toBe(3);
    expect(r.removedOptions).toHaveLength(2);
  });

  it("bloco vazio: remove sem contar alimentos (não precisa de Desfazer)", () => {
    const meal = { options: [{ kind: "fat", title: "Opção 1", notes: "", items: [blankFoodItem()] }] } as any;
    expect(removeKindPatch(meal, "fat").removedItemCount).toBe(0);
  });

  it("não muta a refeição original e não duplica o tipo em hiddenKinds", () => {
    const meal = makeMeal();
    const snapshot = JSON.stringify(meal);
    const first = removeKindPatch(meal, "carb");
    expect(JSON.stringify(meal)).toBe(snapshot);
    const again = removeKindPatch({ ...meal, ...first.patch }, "carb");
    expect(again.patch.hiddenKinds).toEqual(["carb"]);
  });

  it("refeição sem options não quebra", () => {
    const r = removeKindPatch({} as any, "protein");
    expect(r.patch).toEqual({ hiddenKinds: ["protein"], options: [] });
  });
});

describe("withoutHiddenKinds — protege protocolos antigos já salvos", () => {
  it("protocolo antigo: tipo oculto COM alimentos preenchidos não entra na conta", () => {
    const legacy = { ...makeMeal(), hiddenKinds: ["carb"] };
    expect(grams(legacy, "carb")).toBe(370); // o dado antigo continua lá...
    expect(grams(withoutHiddenKinds(legacy), "carb")).toBe(0); // ...mas não conta
    expect(grams(withoutHiddenKinds(legacy), "protein")).toBe(150);
  });

  it("devolve a MESMA referência quando nada está oculto", () => {
    const meal = makeMeal();
    expect(withoutHiddenKinds(meal)).toBe(meal);
    const empty = { ...meal, hiddenKinds: [] };
    expect(withoutHiddenKinds(empty)).toBe(empty);
  });

  it("não muta o original", () => {
    const legacy = { ...makeMeal(), hiddenKinds: ["fat", "protein"] };
    const snapshot = JSON.stringify(legacy);
    withoutHiddenKinds(legacy);
    expect(JSON.stringify(legacy)).toBe(snapshot);
  });

  it("aceita null/undefined/forma estranha sem lançar", () => {
    expect(withoutHiddenKinds(null as any)).toBeNull();
    expect(withoutHiddenKinds(undefined as any)).toBeUndefined();
    const weird = { hiddenKinds: "carb", options: [] } as any;
    expect(withoutHiddenKinds(weird)).toBe(weird);
  });
});

describe("getHiddenKinds", () => {
  it("filtra valores inválidos e repetidos", () => {
    expect(getHiddenKinds({ hiddenKinds: ["carb", "carb", "xyz", "fat", 3] } as any)).toEqual(["carb", "fat"]);
    expect(getHiddenKinds({} as any)).toEqual([]);
    expect(getHiddenKinds(null)).toEqual([]);
  });
});

describe("restoreKindPatch", () => {
  it("volta com 'Opção 1' vazia já materializada (sem placeholder fantasma)", () => {
    const meal = makeMeal();
    const removed = { ...meal, ...removeKindPatch(meal, "carb").patch };
    const back = { ...removed, ...restoreKindPatch(removed, "carb") };
    const carbs = back.options.filter((o: any) => o.kind === "carb");
    expect(back.hiddenKinds).toEqual([]);
    expect(carbs).toHaveLength(1);
    expect(carbs[0].title).toBe("Opção 1");
    expect(countFilledItems(carbs)).toBe(0);
    expect(grams(back, "carb")).toBe(0);
  });

  it("Desfazer: devolve exatamente o que foi removido", () => {
    const meal = makeMeal();
    const { patch, removedOptions } = removeKindPatch(meal, "carb");
    const removed = { ...meal, ...patch };
    const undone = { ...removed, ...restoreKindPatch(removed, "carb", removedOptions) };
    expect(grams(undone, "carb")).toBe(370);
    expect(undone.hiddenKinds).toEqual([]);
    expect(undone.options.filter((o: any) => o.kind === "carb")).toEqual(
      meal.options.filter((o: any) => o.kind === "carb"),
    );
  });

  it("protocolo antigo oculto com itens: restaurar mantém os itens existentes (sem duplicar)", () => {
    const legacy = { ...makeMeal(), hiddenKinds: ["carb"] };
    const back = { ...legacy, ...restoreKindPatch(legacy, "carb", [{ kind: "carb", items: [] }]) };
    expect(back.options.filter((o: any) => o.kind === "carb")).toHaveLength(2);
    expect(back.hiddenKinds).toEqual([]);
  });

  it("restaurar só um tipo preserva os outros ocultos", () => {
    const meal = { options: [], hiddenKinds: ["carb", "fat"] } as any;
    expect(restoreKindPatch(meal, "carb").hiddenKinds).toEqual(["fat"]);
  });
});
