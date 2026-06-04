import * as XLSX from "xlsx";
import { ProtocolPayloadSchema, type ProtocolPayload } from "./protocolSchema";

export class ProtocolXlsxError extends Error {
  details: string[];
  constructor(message: string, details: string[] = []) {
    super(message);
    this.name = "ProtocolXlsxError";
    this.details = details;
  }
}

function basePayload(): ProtocolPayload {
  return ProtocolPayloadSchema.parse({
    setup: { split: "ABC", mealsCount: 5, carbCycle: false },
  });
}

function getOpt(meal: any, kind: "carb" | "protein" | "fat", idx: number) {
  const opts = (meal.options ?? []).filter((o: any) => o?.kind === kind);
  return opts[idx] ?? { title: "", items: [] };
}

function itemAt(opt: any, idx: number) {
  const it = opt?.items?.[idx];
  return { name: it?.name ?? "", weight: it?.weight ?? "" };
}

function subAt(meal: any, kind: "carb" | "protein" | "fat", idx: number) {
  const arr = meal.substitutions?.[kind] ?? [];
  const s = arr[idx];
  if (!s) return { name: "", weight: "" };
  if (typeof s === "string") return { name: s, weight: "" };
  return { name: s?.name ?? "", weight: s?.weight ?? "" };
}

export function exportProtocolXlsx(payload: ProtocolPayload, studentName: string) {
  const wb = XLSX.utils.book_new();

  const mealsData = payload.meals.map((m: any) => {
    const row: Record<string, any> = {
      "Refeição": m.name,
      "Horário": m.time,
      "Carbo Macro(g)": m.macros?.carbs ?? 0,
      "Prot Macro(g)": m.macros?.protein ?? 0,
      "Gord Macro(g)": m.macros?.fat ?? 0,
    };
    (["carb", "protein", "fat"] as const).forEach((kind) => {
      const label = kind === "carb" ? "Carbo" : kind === "protein" ? "Prot" : "Gord";
      for (let oi = 0; oi < 2; oi++) {
        const opt = getOpt(m, kind, oi);
        for (let ii = 0; ii < 4; ii++) {
          const it = itemAt(opt, ii);
          row[`${label} Op${oi + 1} Nome${ii + 1}`] = it.name;
          row[`${label} Op${oi + 1} Peso${ii + 1}`] = it.weight;
        }
      }
    });
    (["carb", "protein", "fat"] as const).forEach((kind) => {
      const label = kind === "carb" ? "Carbo" : kind === "protein" ? "Prot" : "Gord";
      for (let si = 0; si < 2; si++) {
        const s = subAt(m, kind, si);
        row[`Sub ${label} ${si + 1} Nome`] = s.name;
        row[`Sub ${label} ${si + 1} Peso`] = s.weight;
      }
    });
    row["Observações"] = m.notes || "";
    return row;
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mealsData), "Refeições");

  const workoutsData = payload.workouts.flatMap((w) =>
    w.exercises.map((e) => ({
      "Treino": w.key,
      "Foco": w.focus,
      "Exercício": e.name,
      "Séries": e.sets,
      "Reps": e.reps,
      "Descanso": e.rest,
      "Técnica/Notas": e.notes,
    }))
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(workoutsData), "Treinos");

  const g = payload.guidelines;
  const guideData = [
    { Categoria: "Treino", Descrição: g.training },
    { Categoria: "Dieta", Descrição: g.diet },
    { Categoria: "Semana", Descrição: g.weekOrganization },
    { Categoria: "Suplementos", Descrição: g.supplementation },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(guideData), "Diretrizes");

  const safe = (studentName || "aluno").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  XLSX.writeFile(wb, `protocolo-${safe}.xlsx`);
}

export async function importProtocolXlsx(file: File): Promise<ProtocolPayload> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(new Uint8Array(buf), { type: "array" });
  const base = basePayload();
  const details: string[] = [];

  const wsMeals = wb.Sheets["Refeições"] || wb.Sheets["Dietas"];
  if (wsMeals) {
    const rows = XLSX.utils.sheet_to_json<any>(wsMeals);
    base.meals = rows.map((r) => {
      const buildOpts = (kind: "carb" | "protein" | "fat") => {
        const label = kind === "carb" ? "Carbo" : kind === "protein" ? "Prot" : "Gord";
        const opts: any[] = [];
        for (let oi = 0; oi < 2; oi++) {
          const items: any[] = [];
          for (let ii = 0; ii < 4; ii++) {
            const name = String(r[`${label} Op${oi + 1} Nome${ii + 1}`] || "").trim();
            const weight = String(r[`${label} Op${oi + 1} Peso${ii + 1}`] || "").trim();
            if (name || weight) items.push({ name, weight });
          }
          opts.push({
            kind,
            title: `Opção ${oi + 1}`,
            items: items.length ? items : [{ name: "", weight: "" }],
          });
        }
        return opts;
      };
      const buildSubs = (kind: "carb" | "protein" | "fat") => {
        const label = kind === "carb" ? "Carbo" : kind === "protein" ? "Prot" : "Gord";
        const out: any[] = [];
        for (let si = 0; si < 2; si++) {
          out.push({
            name: String(r[`Sub ${label} ${si + 1} Nome`] || "").trim(),
            weight: String(r[`Sub ${label} ${si + 1} Peso`] || "").trim(),
          });
        }
        return out;
      };
      // Legacy single-column fallback
      if (r["Carboidratos"] || r["Proteínas"] || r["Gorduras"]) {
        const legacy = {
          name: String(r["Refeição"] || ""),
          time: String(r["Horário"] || ""),
          carbs: r["Carboidratos"] ? String(r["Carboidratos"]).split("|").map((s) => s.trim()).filter(Boolean) : [],
          proteins: r["Proteínas"] ? String(r["Proteínas"]).split("|").map((s) => s.trim()).filter(Boolean) : [],
          fats: r["Gorduras"] ? String(r["Gorduras"]).split("|").map((s) => s.trim()).filter(Boolean) : [],
          notes: String(r["Observações"] || ""),
          macros: {
            carbs: Number(r["Carbs (g)"]) || Number(r["Carbo Macro(g)"]) || 0,
            protein: Number(r["Proteína (g)"]) || Number(r["Prot Macro(g)"]) || 0,
            fat: Number(r["Gordura (g)"]) || Number(r["Gord Macro(g)"]) || 0,
          },
        };
        return legacy as any;
      }
      return {
        name: String(r["Refeição"] || ""),
        time: String(r["Horário"] || ""),
        macros: {
          carbs: Number(r["Carbo Macro(g)"]) || 0,
          protein: Number(r["Prot Macro(g)"]) || 0,
          fat: Number(r["Gord Macro(g)"]) || 0,
        },
        options: [...buildOpts("carb"), ...buildOpts("protein"), ...buildOpts("fat")],
        substitutions: {
          carb: buildSubs("carb"),
          protein: buildSubs("protein"),
          fat: buildSubs("fat"),
        },
        notes: String(r["Observações"] || ""),
      } as any;
    });
  } else {
    details.push("Aba 'Refeições' não encontrada.");
  }

  const wsWorkouts = wb.Sheets["Treinos"];
  if (wsWorkouts) {
    const rows = XLSX.utils.sheet_to_json<any>(wsWorkouts);
    const grouped: Record<string, any> = {};
    rows.forEach((r) => {
      const k = r["Treino"];
      if (!k) return;
      if (!grouped[k]) grouped[k] = { key: String(k), focus: String(r["Foco"] || ""), exercises: [] };
      grouped[k].exercises.push({
        name: String(r["Exercício"] || ""),
        sets: String(r["Séries"] || ""),
        reps: String(r["Reps"] || ""),
        rest: String(r["Descanso"] || ""),
        notes: String(r["Técnica/Notas"] || ""),
        cadence: "",
      });
    });
    base.workouts = Object.values(grouped);
  }

  const wsGuide = wb.Sheets["Diretrizes"];
  if (wsGuide) {
    const rows = XLSX.utils.sheet_to_json<any>(wsGuide);
    rows.forEach((r) => {
      const cat = String(r["Categoria"] || "").toLowerCase();
      const desc = String(r["Descrição"] || "");
      if (cat.includes("treino")) base.guidelines.training = desc;
      else if (cat.includes("dieta")) base.guidelines.diet = desc;
      else if (cat.includes("semana")) base.guidelines.weekOrganization = desc;
      else if (cat.includes("supl")) base.guidelines.supplementation = desc;
    });
  }

  const safe = ProtocolPayloadSchema.safeParse(base);
  if (!safe.success) {
    throw new ProtocolXlsxError(
      "Planilha inválida",
      safe.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`).concat(details)
    );
  }
  return safe.data;
}
