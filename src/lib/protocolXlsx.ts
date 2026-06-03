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

export function exportProtocolXlsx(payload: ProtocolPayload, studentName: string) {
  const wb = XLSX.utils.book_new();

  const mealsData = payload.meals.map((m) => ({
    "Refeição": m.name,
    "Horário": m.time,
    "Carboidratos": m.carbs?.join(" | ") || "",
    "Proteínas": m.proteins?.join(" | ") || "",
    "Gorduras": m.fats?.join(" | ") || "",
    "Livres/Saladas": m.free?.join(" | ") || "",
    "Carbs (g)": m.macros?.carbs ?? 0,
    "Proteína (g)": m.macros?.protein ?? 0,
    "Gordura (g)": m.macros?.fat ?? 0,
    "Observações": m.notes || "",
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mealsData), "Dietas");

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

  const wsMeals = wb.Sheets["Dietas"];
  if (wsMeals) {
    const rows = XLSX.utils.sheet_to_json<any>(wsMeals);
    base.meals = rows.map((r) => ({
      name: String(r["Refeição"] || ""),
      time: String(r["Horário"] || ""),
      carbs: r["Carboidratos"] ? String(r["Carboidratos"]).split("|").map((s) => s.trim()).filter(Boolean) : [],
      proteins: r["Proteínas"] ? String(r["Proteínas"]).split("|").map((s) => s.trim()).filter(Boolean) : [],
      fats: r["Gorduras"] ? String(r["Gorduras"]).split("|").map((s) => s.trim()).filter(Boolean) : [],
      free: r["Livres/Saladas"] ? String(r["Livres/Saladas"]).split("|").map((s) => s.trim()).filter(Boolean) : [],
      notes: String(r["Observações"] || ""),
      macros: {
        carbs: Number(r["Carbs (g)"]) || 0,
        protein: Number(r["Proteína (g)"]) || 0,
        fat: Number(r["Gordura (g)"]) || 0,
      },
    }));
  } else {
    details.push("Aba 'Dietas' não encontrada.");
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
