/**
 * protocolXlsx.ts — Export/Import do protocolo em planilha .xlsx
 * Abas: Setup, Macros, Refeicoes, CicloCarbo, Treinos, Diretrizes
 */

import * as XLSX from "xlsx";
import {
  ProtocolPayloadSchema,
  type ProtocolPayload,
  type MealRow,
  WEEKDAYS,
} from "./protocolSchema";

function asNum(v: unknown, fb = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
}
function asStr(v: unknown, fb = ""): string {
  return v == null ? fb : String(v);
}

export function exportProtocolXlsx(payload: ProtocolPayload, studentName: string) {
  const wb = XLSX.utils.book_new();

  // Setup
  const setupAoa = [
    ["Campo", "Valor"],
    ["Split", payload.setup.split],
    ["Refeições", payload.setup.mealsCount],
    ["Ciclo de carbo", payload.setup.carbCycle ? "sim" : "não"],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(setupAoa), "Setup");

  // Macros (com fórmulas para alto/baixo)
  const m = payload.macros;
  const macrosAoa = [
    ["", "Base", "Alto (+15%)", "Off / Baixo (-15%)"],
    ["Calorias", m.calories, { f: "ROUND(B2*1.15,0)" }, { f: "ROUND(B2*0.85,0)" }],
    ["Proteína (g)", m.protein, { f: "ROUND(B3*1.15,0)" }, { f: "ROUND(B3*0.85,0)" }],
    ["Carbo (g)", m.carbs, { f: "ROUND(B4*1.15,0)" }, { f: "ROUND(B4*0.85,0)" }],
    ["Gordura (g)", m.fat, { f: "ROUND(B5*1.15,0)" }, { f: "ROUND(B5*0.85,0)" }],
    ["Água (L)", m.water, "", ""],
    ["Objetivo", m.goal, "", ""],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(macrosAoa), "Macros");

  // Refeições — cada linha = uma refeição com opções e substituições
  const mealsHeader = [
    "Nome", "Hora",
    "Carbo (g)", "Proteína (g)", "Gordura (g)",
    "Opção 1 - Título", "Opção 1 - Alimentos",
    "Opção 2 - Título", "Opção 2 - Alimentos",
    "Sub Carbo 1", "Sub Carbo 2",
    "Sub Proteína 1", "Sub Proteína 2",
    "Sub Gordura 1", "Sub Gordura 2",
    "Observações",
  ];
  const mealsAoa: (string | number)[][] = [mealsHeader];
  for (const meal of payload.meals) {
    const opt1 = meal.options[0] ?? { title: "Opção 1", items: "" };
    const opt2 = meal.options[1] ?? { title: "Opção 2", items: "" };
    const s = meal.substitutions;
    mealsAoa.push([
      meal.name, meal.time,
      meal.macros.carbs, meal.macros.protein, meal.macros.fat,
      opt1.title, opt1.items,
      opt2.title, opt2.items,
      s.carb[0] ?? "", s.carb[1] ?? "",
      s.protein[0] ?? "", s.protein[1] ?? "",
      s.fat[0] ?? "", s.fat[1] ?? "",
      meal.notes ?? "",
    ]);
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(mealsAoa), "Refeicoes");

  // Ciclo de carbo
  const ccAoa = [["Dia", "Modo (high/base/off)"]];
  for (const d of WEEKDAYS) {
    ccAoa.push([d.label, payload.carbCycle[d.key] ?? "base"]);
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ccAoa), "CicloCarbo");

  // Treinos — uma aba por dia
  for (const day of payload.workouts) {
    const aoa: (string | number)[][] = [
      [`Dia ${day.key} — Foco`, day.focus],
      [],
      ["Exercício", "Séries", "Reps", "Cadência", "Descanso", "Observações"],
    ];
    for (const ex of day.exercises) {
      aoa.push([ex.name, ex.sets, ex.reps ?? "", ex.cadence ?? "", ex.rest ?? "", ex.notes ?? ""]);
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), `Treino_${day.key}`);
  }

  // Diretrizes
  const g = payload.guidelines;
  const guideAoa = [
    ["Seção", "Conteúdo"],
    ["Treino", g.training],
    ["Dieta", g.diet],
    ["Organização da semana", g.weekOrganization],
    ["Suplementação", g.supplementation],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(guideAoa), "Diretrizes");

  const safe = studentName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "aluno";
  XLSX.writeFile(wb, `protocolo-${safe}.xlsx`);
}

export class ProtocolXlsxError extends Error {
  details: string[];
  constructor(message: string, details: string[] = []) {
    super(message);
    this.name = "ProtocolXlsxError";
    this.details = details;
  }
}

export async function importProtocolXlsx(file: File): Promise<ProtocolPayload> {
  if (!file.name.match(/\.xlsx?$/i)) {
    throw new ProtocolXlsxError("O arquivo precisa ser .xlsx ou .xls.");
  }
  let wb: XLSX.WorkBook;
  try {
    const buf = await file.arrayBuffer();
    wb = XLSX.read(buf, { type: "array" });
  } catch (e) {
    throw new ProtocolXlsxError("Não foi possível ler a planilha. Salve como .xlsx no Excel/Google Sheets e tente novamente.");
  }

  const required = ["Setup", "Macros", "Refeicoes"];
  const missing = required.filter((s) => !wb.Sheets[s] && !(s === "Refeicoes" && wb.Sheets["Refeições"]));
  if (missing.length) {
    throw new ProtocolXlsxError(
      `Abas obrigatórias ausentes: ${missing.join(", ")}. Use o esboço exportado como base.`,
      missing,
    );
  }

  // Setup
  const setupSheet = wb.Sheets["Setup"];
  const setupRows = setupSheet ? XLSX.utils.sheet_to_json<Record<string, unknown>>(setupSheet) : [];
  const setupMap: Record<string, unknown> = {};
  for (const r of setupRows) setupMap[String(r["Campo"] ?? "").trim()] = r["Valor"];
  const setup = {
    split: asStr(setupMap["Split"], "ABC"),
    mealsCount: asNum(setupMap["Refeições"], 5),
    carbCycle: String(setupMap["Ciclo de carbo"] ?? "").toLowerCase().startsWith("s"),
  };

  // Macros
  const macrosSheet = wb.Sheets["Macros"];
  const macrosAoa = macrosSheet ? (XLSX.utils.sheet_to_json(macrosSheet, { header: 1 }) as unknown[][]) : [];
  const findVal = (label: string) => {
    const row = macrosAoa.find((r) => String(r?.[0] ?? "").trim() === label);
    return row?.[1];
  };
  const macros = {
    calories: asNum(findVal("Calorias"), 2200),
    protein: asNum(findVal("Proteína (g)"), 160),
    carbs: asNum(findVal("Carbo (g)"), 250),
    fat: asNum(findVal("Gordura (g)"), 55),
    water: asNum(findVal("Água (L)"), 2.5),
    goal: asStr(findVal("Objetivo"), "hipertrofia"),
  };

  // Refeições
  const mealsSheet = wb.Sheets["Refeicoes"] ?? wb.Sheets["Refeições"];
  const mealsRows = mealsSheet ? XLSX.utils.sheet_to_json<Record<string, unknown>>(mealsSheet) : [];
  const meals: MealRow[] = mealsRows.map((r) => ({
    name: asStr(r["Nome"]),
    time: asStr(r["Hora"]),
    macros: {
      carbs: asNum(r["Carbo (g)"]),
      protein: asNum(r["Proteína (g)"]),
      fat: asNum(r["Gordura (g)"]),
    },
    options: [
      { title: asStr(r["Opção 1 - Título"], "Opção 1"), items: asStr(r["Opção 1 - Alimentos"]) },
      { title: asStr(r["Opção 2 - Título"], "Opção 2"), items: asStr(r["Opção 2 - Alimentos"]) },
    ],
    substitutions: {
      carb: [asStr(r["Sub Carbo 1"]), asStr(r["Sub Carbo 2"])],
      protein: [asStr(r["Sub Proteína 1"]), asStr(r["Sub Proteína 2"])],
      fat: [asStr(r["Sub Gordura 1"]), asStr(r["Sub Gordura 2"])],
    },
    notes: asStr(r["Observações"]),
    foods: "",
    qtyHighCarb: "",
    qtyLowCarb: "",
  }));

  // Ciclo
  const ccSheet = wb.Sheets["CicloCarbo"];
  const ccRows = ccSheet ? XLSX.utils.sheet_to_json<Record<string, unknown>>(ccSheet) : [];
  const carbCycle: Record<string, "high" | "base" | "off"> = {};
  for (const r of ccRows) {
    const label = asStr(r["Dia"]).trim();
    const day = WEEKDAYS.find((d) => d.label.toLowerCase() === label.toLowerCase());
    if (!day) continue;
    const v = asStr(r["Modo (high/base/off)"], "base").toLowerCase();
    carbCycle[day.key] = (["high", "base", "off"].includes(v) ? v : "base") as "high" | "base" | "off";
  }

  // Treinos
  const workouts: ProtocolPayload["workouts"] = [];
  for (const name of wb.SheetNames) {
    if (!name.startsWith("Treino_")) continue;
    const key = name.replace("Treino_", "");
    const aoa = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1 }) as unknown[][];
    const focus = asStr(aoa[0]?.[1]);
    const exercises = aoa.slice(3)
      .filter((r) => r && r[0] != null && String(r[0]).trim() !== "")
      .map((r) => ({
        name: asStr(r[0]),
        sets: asStr(r[1]),
        reps: asStr(r[2]),
        cadence: asStr(r[3]),
        rest: asStr(r[4]),
        notes: asStr(r[5]),
      }));
    workouts.push({ key, focus, exercises });
  }

  // Diretrizes
  const guideSheet = wb.Sheets["Diretrizes"];
  const guideRows = guideSheet ? XLSX.utils.sheet_to_json<Record<string, unknown>>(guideSheet) : [];
  const findGuide = (label: string) => asStr(guideRows.find((r) => asStr(r["Seção"]) === label)?.["Conteúdo"]);
  const guidelines = {
    training: findGuide("Treino"),
    diet: findGuide("Dieta"),
    weekOrganization: findGuide("Organização da semana"),
    supplementation: findGuide("Suplementação"),
  };

  return ProtocolPayloadSchema.parse({
    setup, macros, guidelines, workouts, meals, carbCycle,
  });
}
