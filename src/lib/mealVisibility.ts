/**
 * mealVisibility.ts — regras de "macro removido/oculto" de uma refeição.
 *
 * Contexto do bug: o botão "remover" do bloco Carbo/Proteína/Gordura no construtor
 * de dieta só adicionava o tipo em `meal.hiddenKinds` (esconde na tela) e deixava os
 * alimentos em `meal.options`. Quem soma macros lê `meal.options`, então o bloco
 * "removido" continuava contando (e continuava aparecendo para o aluno / no XLSX).
 *
 * Fonte única da verdade para:
 *  - remover um tipo de verdade (apaga as opções do tipo + marca como oculto);
 *  - restaurar um tipo (volta com uma "Opção 1" vazia, ou com o que foi desfeito);
 *  - IGNORAR tipos ocultos em qualquer cálculo/exibição (protege protocolos antigos
 *    que já foram salvos com bloco oculto mas alimentos preenchidos).
 *
 * Módulo puro: sem React, sem Supabase.
 */

export type MacroKind = "carb" | "protein" | "fat";

const VALID_KINDS: readonly MacroKind[] = ["carb", "protein", "fat"];

type AnyMeal = { options?: any; hiddenKinds?: any } & Record<string, any>;

/** Item de alimento vazio, no mesmo formato que o DietTab usa. */
export function blankFoodItem() {
  return { name: "", baseName: "", weight: "", rawWeight: 0, cookFactor: 1, isTaco: false };
}

/** Tipos ocultos da refeição (só valores válidos, sem repetição). */
export function getHiddenKinds(meal: AnyMeal | null | undefined): MacroKind[] {
  const raw = meal?.hiddenKinds;
  if (!Array.isArray(raw)) return [];
  const out: MacroKind[] = [];
  for (const k of raw) {
    if ((VALID_KINDS as readonly string[]).includes(k) && !out.includes(k)) out.push(k);
  }
  return out;
}

export function isKindHidden(meal: AnyMeal | null | undefined, kind: MacroKind): boolean {
  return getHiddenKinds(meal).includes(kind);
}

/**
 * Devolve a refeição "como o aluno/os cálculos devem enxergar": sem as opções dos
 * tipos ocultos. Não muta o original. Se não há tipo oculto, devolve a MESMA
 * referência (barato e seguro para useMemo).
 */
export function withoutHiddenKinds<T>(meal: T): T {
  const m = meal as unknown as AnyMeal | null | undefined;
  const hidden = getHiddenKinds(m);
  if (!m || hidden.length === 0) return meal;
  const options: any[] = Array.isArray(m.options) ? m.options : [];
  return { ...m, options: options.filter((o) => !hidden.includes(o?.kind)) } as unknown as T;
}

/** Um alimento conta como "preenchido" se tem nome, peso ou peso cru. */
function isFilledItem(it: any): boolean {
  if (!it) return false;
  return (
    String(it.name ?? "").trim() !== "" ||
    String(it.weight ?? "").trim() !== "" ||
    Number(it.rawWeight) > 0
  );
}

export function countFilledItems(options: any[] | null | undefined): number {
  if (!Array.isArray(options)) return 0;
  let n = 0;
  for (const o of options) {
    if (Array.isArray(o?.items)) n += o.items.filter(isFilledItem).length;
  }
  return n;
}

export interface RemoveKindResult {
  /** Campos a mesclar na refeição (`{ ...meal, ...patch }`). */
  patch: { hiddenKinds: MacroKind[]; options: any[] };
  /** Opções apagadas — guardadas para "Desfazer". */
  removedOptions: any[];
  /** Quantos alimentos preenchidos foram apagados (0 = bloco estava vazio). */
  removedItemCount: number;
}

/** Remove DE VERDADE um tipo: apaga as opções do tipo e marca o tipo como oculto. */
export function removeKindPatch(meal: AnyMeal, kind: MacroKind): RemoveKindResult {
  const options: any[] = Array.isArray(meal?.options) ? meal.options : [];
  const removedOptions = options.filter((o) => o?.kind === kind);
  const keptOptions = options.filter((o) => o?.kind !== kind);
  const hiddenKinds = getHiddenKinds(meal);
  if (!hiddenKinds.includes(kind)) hiddenKinds.push(kind);
  return {
    patch: { hiddenKinds, options: keptOptions },
    removedOptions,
    removedItemCount: countFilledItems(removedOptions),
  };
}

/**
 * Restaura um tipo oculto. Ordem de preferência para o conteúdo do tipo:
 *  1. o que já existe na refeição (protocolo antigo oculto com itens);
 *  2. `savedOptions` (usado pelo "Desfazer");
 *  3. uma "Opção 1" vazia já materializada (evita o placeholder fantasma do editor).
 */
export function restoreKindPatch(
  meal: AnyMeal,
  kind: MacroKind,
  savedOptions: any[] = [],
): { hiddenKinds: MacroKind[]; options: any[] } {
  const options: any[] = Array.isArray(meal?.options) ? meal.options : [];
  const existing = options.filter((o) => o?.kind === kind);
  const hiddenKinds = getHiddenKinds(meal).filter((k) => k !== kind);
  if (existing.length > 0) return { hiddenKinds, options };

  const restored =
    savedOptions.length > 0
      ? savedOptions
      : [{ kind, title: "Opção 1", notes: "", items: [blankFoodItem()] }];
  return { hiddenKinds, options: [...options, ...restored] };
}
