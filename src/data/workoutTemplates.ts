// Templates de treino com exercícios, séries, repetições, cadência e descanso

export interface Exercise {
  exercicio: string;
  series: string;
  descanso: string;
  observacao: string;
}

export interface WorkoutTemplate {
  name: string;
  description: string;
  generalNotes: string;
  workouts: Record<string, Exercise[]>;
}

const generalNotes = `⚠️ OBSERVAÇÕES IMPORTANTES:
• Treinar no máximo 2 a 3 dias seguidos e tirar 1 dia de descanso
• Cadência padrão indicada: Eccentric–Pause–Concentric–Pause (ex.: 3-0-1-0)

Rep ranges e objetivo:
• Força/hipertrofia: séries 3–4 × 6–10 (compostos principais)
• Hipertrofia/definição: séries 3 × 8–15 (complementares)

Descanso entre séries:
• Compostos pesados: 90–120s
• Compostos moderados: 60–90s
• Acessórios/isolation: 30–60s`;

export const workoutTemplates: Record<string, WorkoutTemplate> = {
  ab: {
    name: "AB - Divisão",
    description: "Treino dividido em 2 dias: A (Peito, Costas, Ombros, Braços) e B (Inferiores)",
    generalNotes,
    workouts: {
      "Treino A": [
        {
          exercicio: "Aquecimento geral + mobilidade",
          series: "1×5–10min",
          descanso: "—",
          observacao: "Preparação articular e cardiovascular leve"
        },
        {
          exercicio: "Supino reto",
          series: "4×6–10",
          descanso: "90s",
          observacao: "Cadência 2-0-1-0"
        },
        {
          exercicio: "Puxada frente / Barra fixa",
          series: "4×6–10",
          descanso: "90s",
          observacao: "Cadência 3-0-1-0"
        },
        {
          exercicio: "Desenvolvimento militar (ombros)",
          series: "3×6–10",
          descanso: "75–90s",
          observacao: "Cadência 2-0-1-0"
        },
        {
          exercicio: "Remada unilateral ou remada curvada",
          series: "3×8–12",
          descanso: "75s",
          observacao: "Cadência 2-0-1-0"
        },
        {
          exercicio: "Elevação lateral",
          series: "3×12–15",
          descanso: "45–60s",
          observacao: "Cadência 2-0-1-0"
        },
        {
          exercicio: "Rosca direta",
          series: "3×8–12",
          descanso: "45–60s",
          observacao: "Cadência 2-0-1-0"
        },
        {
          exercicio: "Tríceps pulley / testa",
          series: "3×8–12",
          descanso: "45–60s",
          observacao: "Cadência 2-0-1-0"
        },
        {
          exercicio: "Core leve (prancha ou elevação de pernas)",
          series: "3×30–60s",
          descanso: "30s",
          observacao: "Fortalecimento do core"
        }
      ],
      "Treino B": [
        {
          exercicio: "Aquecimento de quadril + ativação",
          series: "1×5–10min",
          descanso: "—",
          observacao: "Mobilidade de quadril e ativação glútea"
        },
        {
          exercicio: "Agachamento / Front squat",
          series: "4×6–10",
          descanso: "90–120s",
          observacao: "Cadência 3-0-1-0"
        },
        {
          exercicio: "Levantamento terra romeno",
          series: "4×6–10",
          descanso: "90s",
          observacao: "Cadência 3-0-1-0"
        },
        {
          exercicio: "Avanço / passada ou afundo búlgaro",
          series: "3×8–12/leg",
          descanso: "75s",
          observacao: "Cadência 2-0-1-0"
        },
        {
          exercicio: "Leg press",
          series: "3×10–15",
          descanso: "60–75s",
          observacao: "Cadência 2-0-1-0"
        },
        {
          exercicio: "Cadeira extensora / flexora",
          series: "3×12–15",
          descanso: "45–60s",
          observacao: "Cadência 2-0-1-0"
        },
        {
          exercicio: "Panturrilha em pé",
          series: "4×12–20",
          descanso: "30–45s",
          observacao: "Cadência 2-0-1-0"
        }
      ]
    }
  },
  abc: {
    name: "ABC - Divisão",
    description: "Treino dividido em 3 dias: A (Peito/Bíceps), B (Dorsal/Tríceps), C (Inferiores)",
    generalNotes,
    workouts: {
      "Treino A": [
        {
          exercicio: "Aquecimento geral + mobilidade",
          series: "1×5–10min",
          descanso: "—",
          observacao: "Preparação"
        },
        {
          exercicio: "Supino reto",
          series: "4×6–10",
          descanso: "90s",
          observacao: "Cadência 2-0-1-0"
        },
        {
          exercicio: "Supino inclinado halteres",
          series: "3×8–12",
          descanso: "75s",
          observacao: "Cadência 2-0-1-0"
        },
        {
          exercicio: "Crucifixo",
          series: "3×10–15",
          descanso: "60s",
          observacao: "Cadência 2-1-1-0"
        },
        {
          exercicio: "Rosca direta",
          series: "3×8–12",
          descanso: "60s",
          observacao: "Cadência 2-0-1-0"
        },
        {
          exercicio: "Rosca alternada",
          series: "3×10",
          descanso: "45–60s",
          observacao: "Cadência 2-0-1-0"
        },
        {
          exercicio: "Panturrilha (sentado/em pé)",
          series: "4×12–20",
          descanso: "30–45s",
          observacao: "Cadência 2-0-1-0"
        }
      ],
      "Treino B": [
        {
          exercicio: "Aquecimento geral + mobilidade",
          series: "1×5–10min",
          descanso: "—",
          observacao: "Preparação"
        },
        {
          exercicio: "Puxada frente / Barra fixa",
          series: "4×6–10",
          descanso: "90s",
          observacao: "Cadência 3-0-1-0"
        },
        {
          exercicio: "Remada curvada",
          series: "3×6–10",
          descanso: "75s",
          observacao: "Cadência 2-0-1-0"
        },
        {
          exercicio: "Remada baixa",
          series: "3×10–12",
          descanso: "60–75s",
          observacao: "Cadência 2-0-1-0"
        },
        {
          exercicio: "Tríceps testa / pulley",
          series: "3×8–12",
          descanso: "60s",
          observacao: "Cadência 2-0-1-0"
        },
        {
          exercicio: "Abdominais (prancha, crunch, ou elevação pernas)",
          series: "3×15–20 / 3×30–60s",
          descanso: "30–45s",
          observacao: "Core"
        }
      ],
      "Treino C": [
        {
          exercicio: "Aquecimento de quadril + ativação",
          series: "1×5–10min",
          descanso: "—",
          observacao: "Mobilidade e ativação"
        },
        {
          exercicio: "Agachamento ou Leg Press pesado",
          series: "4×6–10",
          descanso: "90–120s",
          observacao: "Cadência 3-0-1-0"
        },
        {
          exercicio: "Levantamento terra romeno / stiff",
          series: "3×8–12",
          descanso: "90s",
          observacao: "Cadência 3-0-1-0"
        },
        {
          exercicio: "Hip thrust / ponte glúteo",
          series: "3×8–12",
          descanso: "75s",
          observacao: "Cadência 2-0-1-0"
        },
        {
          exercicio: "Afundo / passada",
          series: "3×8–12/leg",
          descanso: "75s",
          observacao: "Cadência 2-0-1-0"
        },
        {
          exercicio: "Panturrilha",
          series: "4×12–20",
          descanso: "30–45s",
          observacao: "Cadência 2-0-1-0"
        }
      ]
    }
  },
  abcd: {
    name: "ABCD - Divisão",
    description: "Treino dividido em 5 dias: A (Quadríceps), B (Peito/Bíceps), C (Descanso), D (Femoral/Glúteo), E (Dorsal/Tríceps)",
    generalNotes,
    workouts: {
      "Treino A": [
        {
          exercicio: "Aquecimento geral + mobilidade",
          series: "1×5–10min",
          descanso: "—",
          observacao: "Preparação"
        },
        {
          exercicio: "Agachamento frontal / Agachamento",
          series: "4×6–10",
          descanso: "90–120s",
          observacao: "Cadência 3-0-1-0"
        },
        {
          exercicio: "Leg press com foco quadríceps",
          series: "3×10–15",
          descanso: "60–75s",
          observacao: "Cadência 2-0-1-0"
        },
        {
          exercicio: "Cadeira extensora",
          series: "3×12–15",
          descanso: "45–60s",
          observacao: "Cadência 2-0-1-0"
        },
        {
          exercicio: "Adutor (máquina)",
          series: "3×12–15",
          descanso: "45–60s",
          observacao: "Cadência 2-0-1-0"
        }
      ],
      "Treino B": [
        {
          exercicio: "Aquecimento geral + mobilidade",
          series: "1×5–10min",
          descanso: "—",
          observacao: "Preparação"
        },
        {
          exercicio: "Supino reto",
          series: "4×6–10",
          descanso: "90s",
          observacao: "Cadência 2-0-1-0"
        },
        {
          exercicio: "Supino inclinado",
          series: "3×8–12",
          descanso: "75s",
          observacao: "Cadência 2-0-1-0"
        },
        {
          exercicio: "Crucifixo / Peck deck",
          series: "3×10–15",
          descanso: "60s",
          observacao: "Cadência 2-1-1-0"
        },
        {
          exercicio: "Rosca direta / alternada",
          series: "3×8–12",
          descanso: "45–60s",
          observacao: "Cadência 2-0-1-0"
        },
        {
          exercicio: "Panturrilha",
          series: "4×12–20",
          descanso: "30–45s",
          observacao: "Cadência 2-0-1-0"
        }
      ],
      "Treino C": [
        {
          exercicio: "Descanso",
          series: "—",
          descanso: "—",
          observacao: "Dia de recuperação ativa / mobilidade / cardio leve (opcional). Obrigatório como descanso programado."
        }
      ],
      "Treino D": [
        {
          exercicio: "Aquecimento de quadril + ativação",
          series: "1×5–10min",
          descanso: "—",
          observacao: "Mobilidade e ativação"
        },
        {
          exercicio: "Levantamento terra romeno",
          series: "4×6–10",
          descanso: "90s",
          observacao: "Cadência 3-0-1-0"
        },
        {
          exercicio: "Flexora (deitado)",
          series: "3×10–15",
          descanso: "60–75s",
          observacao: "Cadência 2-0-1-0"
        },
        {
          exercicio: "Hip thrust / ponte",
          series: "3×8–12",
          descanso: "75s",
          observacao: "Cadência 2-0-1-0"
        },
        {
          exercicio: "Afundo búlgaro",
          series: "3×8–12/leg",
          descanso: "75s",
          observacao: "Cadência 2-0-1-0"
        },
        {
          exercicio: "Panturrilha",
          series: "4×12–20",
          descanso: "30–45s",
          observacao: "Cadência 2-0-1-0"
        }
      ],
      "Treino E": [
        {
          exercicio: "Aquecimento geral + mobilidade",
          series: "1×5–10min",
          descanso: "—",
          observacao: "Preparação"
        },
        {
          exercicio: "Puxada frente / Barra fixa",
          series: "4×6–10",
          descanso: "90s",
          observacao: "Cadência 3-0-1-0"
        },
        {
          exercicio: "Remada (barra ou máquina)",
          series: "3×6–10",
          descanso: "75s",
          observacao: "Cadência 2-0-1-0"
        },
        {
          exercicio: "Remada baixa / pulldown",
          series: "3×10–12",
          descanso: "60–75s",
          observacao: "Cadência 2-0-1-0"
        },
        {
          exercicio: "Tríceps pulley / testa",
          series: "3×8–12",
          descanso: "60s",
          observacao: "Cadência 2-0-1-0"
        },
        {
          exercicio: "Abdominais (plank/elevação de pernas)",
          series: "3×30–60s / 3×12–20",
          descanso: "30–45s",
          observacao: "Core"
        }
      ]
    }
  },
  aerobico: {
    name: "Aeróbico",
    description: "Programa de treino cardiovascular",
    generalNotes: "⚠️ OBSERVAÇÕES: Respeitar frequência cardíaca alvo e progressão gradual de volume e intensidade.",
    workouts: {
      "Treino Aeróbico": [
        {
          exercicio: "Aquecimento",
          series: "1×5–10min",
          descanso: "—",
          observacao: "Intensidade leve, preparação cardiovascular"
        },
        {
          exercicio: "Cardio principal (corrida, bike, elíptico, remo)",
          series: "1×20–45min",
          descanso: "—",
          observacao: "Zona de frequência cardíaca alvo conforme objetivo"
        },
        {
          exercicio: "Alongamento / desaquecimento",
          series: "1×5–10min",
          descanso: "—",
          observacao: "Retorno gradual à frequência cardíaca de repouso"
        }
      ]
    }
  }
};
