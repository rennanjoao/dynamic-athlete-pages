import * as XLSX from "xlsx";
import { type ProtocolPayload, buildBasePayload } from "./protocolSchema";

export async function exportProtocolToExcel(payload: ProtocolPayload) {
  const wb = XLSX.utils.book_new();

  // 1. Refeições (Formato Modular)
  const mealsData = payload.meals.map((m) => ({
    "Refeição": m.name,
    "Horário": m.time,
    "Carboidratos": m.carbs?.join(" | ") || "",
    "Proteínas": m.proteins?.join(" | ") || "",
    "Gorduras": m.fats?.join(" | ") || "",
    "Livres/Saladas": m.free?.join(" | ") || "",
    "Observações": m.notes,
  }));
  const wsMeals = XLSX.utils.json_to_sheet(mealsData);
  XLSX.utils.book_append_sheet(wb, wsMeals, "Dietas");

  // 2. Treinos
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
  const wsWorkouts = XLSX.utils.json_to_sheet(workoutsData);
  XLSX.utils.book_append_sheet(wb, wsWorkouts, "Treinos");

  // 3. Diretrizes
  const g = payload.guidelines;
  const guideData = [
    { Categoria: "Treino", Descrição: g.training },
    { Categoria: "Dieta", Descrição: g.diet },
    { Categoria: "Semana", Descrição: g.weekOrganization },
    { Categoria: "Suplementos", Descrição: g.supplementation },
  ];
  const wsGuide = XLSX.utils.json_to_sheet(guideData);
  XLSX.utils.book_append_sheet(wb, wsGuide, "Diretrizes");

  XLSX.writeFile(wb, "Protocolo_Modelo_Modular.xlsx");
}

export async function importProtocolFromExcel(file: File): Promise<ProtocolPayload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const base = buildBasePayload({ split: "ABC", mealsCount: 5, carbCycle: false });

        // Lê Dietas (Quebra pelos " | ")
        const wsMeals = wb.Sheets["Dietas"];
        if (wsMeals) {
          const rows = XLSX.utils.sheet_to_json<any>(wsMeals);
          base.meals = rows.map((r) => ({
            name: r["Refeição"] || "",
            time: r["Horário"] || "",
            carbs: r["Carboidratos"] ? String(r["Carboidratos"]).split("|").map(s => s.trim()) : [],
            proteins: r["Proteínas"] ? String(r["Proteínas"]).split("|").map(s => s.trim()) : [],
            fats: r["Gorduras"] ? String(r["Gorduras"]).split("|").map(s => s.trim()) : [],
            free: r["Livres/Saladas"] ? String(r["Livres/Saladas"]).split("|").map(s => s.trim()) : [],
            notes: r["Observações"] || "",
            macros: { carbs: 0, protein: 0, fat: 0 },
            options: [],
            substitutions: { carb: [], protein: [], fat: [] }
          }));
        }

        // Lê Treinos
        const wsWorkouts = wb.Sheets["Treinos"];
        if (wsWorkouts) {
          const rows = XLSX.utils.sheet_to_json<any>(wsWorkouts);
          const grouped: Record<string, any> = {};
          rows.forEach((r) => {
            const k = r["Treino"];
            if (!k) return;
            if (!grouped[k]) grouped[k] = { key: k, focus: r["Foco"] || "", exercises: [] };
            grouped[k].exercises.push({
              name: r["Exercício"] || "",
              sets: String(r["Séries"] || ""),
              reps: String(r["Reps"] || ""),
              rest: String(r["Descanso"] || ""),
              notes: r["Técnica/Notas"] || "",
              cadence: "",
            });
          });
          base.workouts = Object.values(grouped);
        }

        resolve(base);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
