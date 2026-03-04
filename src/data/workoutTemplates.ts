// Templates de treino com exercícios, séries, repetições, cadência e descanso
// Suporta 10 modalidades esportivas

export interface Exercise {
  exercicio: string;
  series: string;
  descanso: string;
  observacao: string;
  rpe?: string;
  percentual1rm?: string;
  pace?: string;
  zonaFC?: string;
  potenciaWatts?: string;
  metragem?: string;
  progressao?: string;
}

export interface WorkoutTemplate {
  name: string;
  description: string;
  generalNotes: string;
  category: string;
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
  // ── BODYBUILDING ──
  ab: {
    name: "AB - Bodybuilding",
    description: "Treino dividido em 2 dias: A (Superior) e B (Inferior)",
    generalNotes,
    category: "bodybuilding",
    workouts: {
      "Treino A": [
        { exercicio: "Aquecimento geral + mobilidade", series: "1×5–10min", descanso: "—", observacao: "Preparação articular" },
        { exercicio: "Supino reto", series: "4×6–10", descanso: "90s", observacao: "Cadência 4-0-2-0 — falha mecânica", rpe: "8-9" },
        { exercicio: "Puxada frente / Barra fixa", series: "4×6–10", descanso: "90s", observacao: "Cadência 3-0-1-0", rpe: "8" },
        { exercicio: "Desenvolvimento militar", series: "3×6–10", descanso: "75–90s", observacao: "Cadência 2-0-1-0", rpe: "7-8" },
        { exercicio: "Remada unilateral", series: "3×8–12", descanso: "75s", observacao: "Cadência 2-0-1-0", rpe: "7" },
        { exercicio: "Elevação lateral", series: "3×12–15", descanso: "45–60s", observacao: "Cadência 2-0-1-0", rpe: "7-8" },
        { exercicio: "Rosca direta", series: "3×8–12", descanso: "45–60s", observacao: "Cadência 2-0-1-0" },
        { exercicio: "Tríceps pulley", series: "3×8–12", descanso: "45–60s", observacao: "Cadência 2-0-1-0" },
        { exercicio: "Core (prancha)", series: "3×30–60s", descanso: "30s", observacao: "Fortalecimento" },
      ],
      "Treino B": [
        { exercicio: "Aquecimento de quadril + ativação", series: "1×5–10min", descanso: "—", observacao: "Mobilidade e ativação glútea" },
        { exercicio: "Agachamento", series: "4×6–10", descanso: "90–120s", observacao: "Cadência 3-0-1-0", rpe: "8-9" },
        { exercicio: "Levantamento terra romeno", series: "4×6–10", descanso: "90s", observacao: "Cadência 3-0-1-0", rpe: "8" },
        { exercicio: "Afundo búlgaro", series: "3×8–12/leg", descanso: "75s", observacao: "Cadência 2-0-1-0" },
        { exercicio: "Leg press", series: "3×10–15", descanso: "60–75s", observacao: "Cadência 2-0-1-0" },
        { exercicio: "Cadeira extensora / flexora", series: "3×12–15", descanso: "45–60s", observacao: "Cadência 2-0-1-0" },
        { exercicio: "Panturrilha em pé", series: "4×12–20", descanso: "30–45s", observacao: "Cadência 2-0-1-0" },
      ],
    },
  },
  abc: {
    name: "ABC - Bodybuilding",
    description: "Treino dividido em 3 dias: A (Peito/Bíceps), B (Dorsal/Tríceps), C (Inferiores)",
    generalNotes,
    category: "bodybuilding",
    workouts: {
      "Treino A": [
        { exercicio: "Supino reto", series: "4×6–10", descanso: "90s", observacao: "Cadência 4-0-2-0", rpe: "8-9" },
        { exercicio: "Supino inclinado halteres", series: "3×8–12", descanso: "75s", observacao: "Cadência 2-0-1-0" },
        { exercicio: "Crucifixo", series: "3×10–15", descanso: "60s", observacao: "Cadência 2-1-1-0" },
        { exercicio: "Rosca direta", series: "3×8–12", descanso: "60s", observacao: "Cadência 2-0-1-0" },
        { exercicio: "Rosca alternada", series: "3×10", descanso: "45–60s", observacao: "Cadência 2-0-1-0" },
      ],
      "Treino B": [
        { exercicio: "Puxada frente", series: "4×6–10", descanso: "90s", observacao: "Cadência 3-0-1-0", rpe: "8" },
        { exercicio: "Remada curvada", series: "3×6–10", descanso: "75s", observacao: "Cadência 2-0-1-0" },
        { exercicio: "Remada baixa", series: "3×10–12", descanso: "60–75s", observacao: "Cadência 2-0-1-0" },
        { exercicio: "Tríceps testa", series: "3×8–12", descanso: "60s", observacao: "Cadência 2-0-1-0" },
        { exercicio: "Abdominais", series: "3×15–20", descanso: "30–45s", observacao: "Core" },
      ],
      "Treino C": [
        { exercicio: "Agachamento", series: "4×6–10", descanso: "90–120s", observacao: "Cadência 3-0-1-0", rpe: "8-9" },
        { exercicio: "Stiff", series: "3×8–12", descanso: "90s", observacao: "Cadência 3-0-1-0" },
        { exercicio: "Hip thrust", series: "3×8–12", descanso: "75s", observacao: "Cadência 2-0-1-0" },
        { exercicio: "Afundo", series: "3×8–12/leg", descanso: "75s", observacao: "Cadência 2-0-1-0" },
        { exercicio: "Panturrilha", series: "4×12–20", descanso: "30–45s", observacao: "Cadência 2-0-1-0" },
      ],
    },
  },
  abcd: {
    name: "ABCDE - Bodybuilding",
    description: "Treino 5 dias: A (Quad), B (Peito/Bíceps), C (Descanso), D (Post/Glúteo), E (Dorsal/Tríceps)",
    generalNotes,
    category: "bodybuilding",
    workouts: {
      "Treino A": [
        { exercicio: "Agachamento frontal", series: "4×6–10", descanso: "90–120s", observacao: "Cadência 3-0-1-0", rpe: "8-9" },
        { exercicio: "Leg press", series: "3×10–15", descanso: "60–75s", observacao: "Foco quadríceps" },
        { exercicio: "Cadeira extensora", series: "3×12–15", descanso: "45–60s", observacao: "Cadência 2-0-1-0" },
        { exercicio: "Adutor", series: "3×12–15", descanso: "45–60s", observacao: "Cadência 2-0-1-0" },
      ],
      "Treino B": [
        { exercicio: "Supino reto", series: "4×6–10", descanso: "90s", observacao: "Cadência 4-0-2-0", rpe: "8-9" },
        { exercicio: "Supino inclinado", series: "3×8–12", descanso: "75s", observacao: "Cadência 2-0-1-0" },
        { exercicio: "Crucifixo / Peck deck", series: "3×10–15", descanso: "60s", observacao: "Cadência 2-1-1-0" },
        { exercicio: "Rosca direta", series: "3×8–12", descanso: "45–60s", observacao: "Cadência 2-0-1-0" },
        { exercicio: "Panturrilha", series: "4×12–20", descanso: "30–45s", observacao: "Cadência 2-0-1-0" },
      ],
      "Treino C": [
        { exercicio: "Descanso / Mobilidade", series: "—", descanso: "—", observacao: "Recuperação ativa, cardio leve opcional" },
      ],
      "Treino D": [
        { exercicio: "Levantamento terra romeno", series: "4×6–10", descanso: "90s", observacao: "Cadência 3-0-1-0", rpe: "8-9" },
        { exercicio: "Flexora deitado", series: "3×10–15", descanso: "60–75s", observacao: "Cadência 2-0-1-0" },
        { exercicio: "Hip thrust", series: "3×8–12", descanso: "75s", observacao: "Cadência 2-0-1-0" },
        { exercicio: "Afundo búlgaro", series: "3×8–12/leg", descanso: "75s", observacao: "Cadência 2-0-1-0" },
      ],
      "Treino E": [
        { exercicio: "Puxada frente", series: "4×6–10", descanso: "90s", observacao: "Cadência 3-0-1-0", rpe: "8" },
        { exercicio: "Remada barra", series: "3×6–10", descanso: "75s", observacao: "Cadência 2-0-1-0" },
        { exercicio: "Pulldown", series: "3×10–12", descanso: "60–75s", observacao: "Cadência 2-0-1-0" },
        { exercicio: "Tríceps pulley", series: "3×8–12", descanso: "60s", observacao: "Cadência 2-0-1-0" },
        { exercicio: "Abdominais", series: "3×30–60s", descanso: "30–45s", observacao: "Core" },
      ],
    },
  },

  // ── POWERLIFTING ──
  powerlifting: {
    name: "Powerlifting",
    description: "Foco em Agachamento, Supino e Terra com progressão baseada em %1RM e RPE",
    generalNotes: "⚠️ Descanso longo (3-5min) entre séries pesadas. Aqueça progressivamente.",
    category: "powerlifting",
    workouts: {
      "Dia Agachamento": [
        { exercicio: "Agachamento (Back Squat)", series: "5×3", descanso: "3–5min", observacao: "Pausa no paralelo", rpe: "8-9", percentual1rm: "82-88%" },
        { exercicio: "Agachamento Pausa", series: "3×3", descanso: "3min", observacao: "2s pausa no buraco", rpe: "7", percentual1rm: "70-75%" },
        { exercicio: "Good Morning", series: "3×8–10", descanso: "90s", observacao: "Acessório posterior" },
        { exercicio: "Leg Press", series: "3×10–12", descanso: "90s", observacao: "Volume complementar" },
      ],
      "Dia Supino": [
        { exercicio: "Supino Reto (Competition)", series: "5×3", descanso: "3–5min", observacao: "Pausa no peito", rpe: "8-9", percentual1rm: "82-88%" },
        { exercicio: "Supino Inclinado", series: "3×6–8", descanso: "2min", observacao: "Acessório", rpe: "7", percentual1rm: "65-72%" },
        { exercicio: "OHP (Overhead Press)", series: "3×6–8", descanso: "90s", observacao: "Força de ombro" },
        { exercicio: "Tríceps Mergulho", series: "3×8–12", descanso: "60s", observacao: "Lockout" },
      ],
      "Dia Terra": [
        { exercicio: "Levantamento Terra (Convencional)", series: "5×2", descanso: "4–5min", observacao: "Reset completo", rpe: "8-9", percentual1rm: "85-90%" },
        { exercicio: "Deficit Deadlift", series: "3×4", descanso: "3min", observacao: "2-3cm elevado", rpe: "7", percentual1rm: "70-75%" },
        { exercicio: "Remada Pendlay", series: "3×5", descanso: "2min", observacao: "Explosivo" },
        { exercicio: "Hiperextensão", series: "3×12–15", descanso: "60s", observacao: "Posterior chain" },
      ],
    },
  },

  // ── ENDURANCE (CORRIDA/TRIATHLON) ──
  endurance: {
    name: "Endurance / Triathlon",
    description: "Corrida, ciclismo e natação com zonas de frequência cardíaca e pace",
    generalNotes: "⚠️ Respeite as zonas de FC. Zona 2 = base aeróbia. Zona 4-5 = limiar/VO2max.",
    category: "endurance",
    workouts: {
      "Corrida Base": [
        { exercicio: "Aquecimento trote leve", series: "10min", descanso: "—", observacao: "Progressivo", zonaFC: "Z1", pace: "6:30-7:00/km" },
        { exercicio: "Corrida contínua Z2", series: "40–60min", descanso: "—", observacao: "Conversa confortável", zonaFC: "Z2", pace: "5:30-6:00/km" },
        { exercicio: "Desaquecimento", series: "5min", descanso: "—", observacao: "Trote + alongamento", zonaFC: "Z1" },
      ],
      "Intervalado (Limiar)": [
        { exercicio: "Aquecimento", series: "15min", descanso: "—", observacao: "Progressivo Z1→Z2", zonaFC: "Z1-Z2" },
        { exercicio: "Tiros 1km", series: "5×1km", descanso: "90s trote", observacao: "Ritmo de prova 10K", zonaFC: "Z4", pace: "4:20-4:40/km" },
        { exercicio: "Desaquecimento", series: "10min", descanso: "—", observacao: "Trote leve", zonaFC: "Z1" },
      ],
      "Long Run": [
        { exercicio: "Corrida longa", series: "90–120min", descanso: "—", observacao: "Passo sustentável", zonaFC: "Z2-Z3", pace: "5:40-6:10/km" },
      ],
    },
  },

  // ── BJJ / LUTAS ──
  bjj: {
    name: "BJJ / Lutas",
    description: "Preparação física para artes marciais com rounds, isometria e descanso ativo",
    generalNotes: "⚠️ Foco em resistência muscular, grip e explosão. Simule rounds de luta.",
    category: "bjj",
    workouts: {
      "Força Funcional": [
        { exercicio: "Aquecimento (pular corda)", series: "3×3min", descanso: "30s", observacao: "Ritmo moderado" },
        { exercicio: "Levantamento terra (sumo)", series: "4×5", descanso: "2min", observacao: "Base de luta", rpe: "8" },
        { exercicio: "Pull-ups pronadas", series: "4×max", descanso: "90s", observacao: "Grip de kimono" },
        { exercicio: "Farmer's Walk", series: "3×40m", descanso: "60s", observacao: "Grip endurance" },
        { exercicio: "Prancha isométrica", series: "3×60s", descanso: "30s", observacao: "Anti-rotação" },
      ],
      "Simulação de Rounds": [
        { exercicio: "Round 1: Sprawl + Burpees", series: "5min", descanso: "1min ativo", observacao: "Simular defesa de queda" },
        { exercicio: "Round 2: Rope Climb / Escalada", series: "5min", descanso: "1min ativo", observacao: "Tração contínua" },
        { exercicio: "Round 3: Battle Ropes", series: "5min", descanso: "1min ativo", observacao: "Cardio upper body" },
        { exercicio: "Round 4: Turkish Get-Up", series: "5min", descanso: "1min ativo", observacao: "Mobilidade + estabilidade" },
        { exercicio: "Round 5: Guard Pull / Hip Escape", series: "5min", descanso: "—", observacao: "Técnica específica" },
      ],
    },
  },

  // ── CROSSFIT ──
  crossfit: {
    name: "CrossFit",
    description: "WODs com estruturas AMRAP, EMOM e For Time",
    generalNotes: "⚠️ Priorize técnica sobre velocidade. Escale pesos conforme necessário.",
    category: "crossfit",
    workouts: {
      "AMRAP 20min": [
        { exercicio: "5 Pull-ups", series: "AMRAP", descanso: "—", observacao: "Kipping permitido" },
        { exercicio: "10 Push-ups", series: "AMRAP", descanso: "—", observacao: "Peito no chão" },
        { exercicio: "15 Air Squats", series: "AMRAP", descanso: "—", observacao: "Quadril abaixo do joelho" },
      ],
      "EMOM 12min": [
        { exercicio: "Min 1: 3 Cleans (60kg)", series: "EMOM", descanso: "resto do min", observacao: "Squat clean", rpe: "7-8" },
        { exercicio: "Min 2: 6 Box Jumps (60cm)", series: "EMOM", descanso: "resto do min", observacao: "Step down" },
        { exercicio: "Min 3: 9 Toes-to-Bar", series: "EMOM", descanso: "resto do min", observacao: "Kipping" },
      ],
      "For Time": [
        { exercicio: "21-15-9 Thrusters (43kg)", series: "For Time", descanso: "—", observacao: "Unbroken se possível" },
        { exercicio: "21-15-9 Pull-ups", series: "For Time", descanso: "—", observacao: "Butterfly ou kipping" },
      ],
    },
  },

  // ── CALISTENIA ──
  calistenia: {
    name: "Calistenia",
    description: "Progressões de nível: estático e dinâmico com peso corporal",
    generalNotes: "⚠️ Progrida de variações fáceis para avançadas. Domine cada nível antes de avançar.",
    category: "calistenia",
    workouts: {
      "Upper Body": [
        { exercicio: "Push-up (variação)", series: "4×8–15", descanso: "60s", observacao: "Regular → Diamond → Archer", progressao: "Nível 1→3" },
        { exercicio: "Pull-up (variação)", series: "4×5–12", descanso: "90s", observacao: "Australiano → Chin-up → Pull-up → Muscle-up", progressao: "Nível 1→4" },
        { exercicio: "Dips (variação)", series: "3×8–15", descanso: "60s", observacao: "Bench → Paralelas → Ring Dips", progressao: "Nível 1→3" },
        { exercicio: "L-Sit Hold", series: "3×15–30s", descanso: "60s", observacao: "Tuck → L-sit → V-sit", progressao: "Estático Nível 1→3" },
        { exercicio: "Handstand Hold", series: "3×20–60s", descanso: "90s", observacao: "Wall → Free", progressao: "Estático Nível 1→2" },
      ],
      "Lower Body + Core": [
        { exercicio: "Pistol Squat (progressão)", series: "3×5–8/leg", descanso: "90s", observacao: "Assistido → Livre", progressao: "Nível 1→3" },
        { exercicio: "Nordic Curl", series: "3×3–8", descanso: "90s", observacao: "Excêntrico → Completo", progressao: "Nível 1→2" },
        { exercicio: "Dragon Flag", series: "3×5–10", descanso: "60s", observacao: "Tuck → Straddle → Full", progressao: "Nível 1→3" },
        { exercicio: "Front Lever Hold", series: "3×10–20s", descanso: "90s", observacao: "Tuck → Advanced Tuck → Straddle", progressao: "Estático Nível 1→3" },
      ],
    },
  },

  // ── CYCLING ──
  cycling: {
    name: "Cycling",
    description: "Treinos de ciclismo com zonas de potência (Watts) e cadência",
    generalNotes: "⚠️ Use power meter ou percepção de esforço. FTP = potência sustentável por 1h.",
    category: "cycling",
    workouts: {
      "Endurance Base": [
        { exercicio: "Aquecimento", series: "15min", descanso: "—", observacao: "Cadência 85-95rpm", potenciaWatts: "Z1 (55% FTP)" },
        { exercicio: "Endurance contínuo", series: "60–90min", descanso: "—", observacao: "Pedalada suave e consistente", potenciaWatts: "Z2 (56-75% FTP)" },
        { exercicio: "Desaquecimento", series: "10min", descanso: "—", observacao: "Spinning leve", potenciaWatts: "Z1" },
      ],
      "Sweet Spot": [
        { exercicio: "Aquecimento progressivo", series: "15min", descanso: "—", observacao: "Z1→Z2", potenciaWatts: "Z1-Z2" },
        { exercicio: "Sweet Spot Intervals", series: "3×15min", descanso: "5min Z1", observacao: "88-93% FTP", potenciaWatts: "Z3-Z4 (88-93% FTP)" },
        { exercicio: "Desaquecimento", series: "10min", descanso: "—", observacao: "Recuperação", potenciaWatts: "Z1" },
      ],
      "VO2max Intervals": [
        { exercicio: "Aquecimento", series: "20min", descanso: "—", observacao: "Inclui 2 sprints curtos", potenciaWatts: "Z1-Z2" },
        { exercicio: "Intervalos VO2max", series: "5×3min", descanso: "3min Z1", observacao: "Máximo sustentável", potenciaWatts: "Z5 (106-120% FTP)" },
        { exercicio: "Desaquecimento", series: "15min", descanso: "—", observacao: "Muito leve", potenciaWatts: "Z1" },
      ],
    },
  },

  // ── SWIMMING ──
  swimming: {
    name: "Natação",
    description: "Séries por metragem com drills técnicos e intervalos",
    generalNotes: "⚠️ Foco em técnica (braçada, respiração, virada). Use equipamentos quando indicado.",
    category: "swimming",
    workouts: {
      "Técnica + Base": [
        { exercicio: "Aquecimento (crawl leve)", series: "1×400m", descanso: "30s", observacao: "Foco na respiração bilateral", metragem: "400m" },
        { exercicio: "Drill: Catch-up", series: "4×50m", descanso: "15s", observacao: "Uma braçada por vez", metragem: "200m" },
        { exercicio: "Drill: Perna com prancha", series: "4×100m", descanso: "20s", observacao: "Batida constante", metragem: "400m" },
        { exercicio: "Crawl contínuo (aeróbio)", series: "1×800m", descanso: "—", observacao: "Ritmo confortável", metragem: "800m" },
        { exercicio: "Solto (medley)", series: "1×200m", descanso: "—", observacao: "Desaquecimento", metragem: "200m" },
      ],
      "Intervalado Velocidade": [
        { exercicio: "Aquecimento", series: "1×300m", descanso: "30s", observacao: "Crawl progressivo", metragem: "300m" },
        { exercicio: "Sprint 50m", series: "8×50m", descanso: "30s", observacao: "Máxima velocidade", metragem: "400m" },
        { exercicio: "Recuperação", series: "1×100m", descanso: "30s", observacao: "Costas leve", metragem: "100m" },
        { exercicio: "Tiros 100m", series: "4×100m", descanso: "45s", observacao: "Pace de prova", metragem: "400m" },
        { exercicio: "Desaquecimento", series: "1×200m", descanso: "—", observacao: "Medley leve", metragem: "200m" },
      ],
    },
  },

  // ── FISIOTERAPIA / REABILITAÇÃO ──
  fisioterapia: {
    name: "Fisioterapia / Reab",
    description: "Foco em mobilidade, estabilidade articular e fortalecimento corretivo",
    generalNotes: "⚠️ Movimentos controlados e sem dor. Suspenda se houver desconforto agudo. Consulte seu fisioterapeuta.",
    category: "fisioterapia",
    workouts: {
      "Mobilidade + Estabilidade": [
        { exercicio: "Foam Rolling (coluna torácica)", series: "2min", descanso: "—", observacao: "Liberação miofascial" },
        { exercicio: "Cat-Cow (gato-vaca)", series: "2×10", descanso: "—", observacao: "Mobilidade espinhal" },
        { exercicio: "Bird-Dog", series: "3×8/lado", descanso: "30s", observacao: "Anti-extensão e estabilidade" },
        { exercicio: "Dead Bug", series: "3×8/lado", descanso: "30s", observacao: "Ativação de core profundo" },
        { exercicio: "Pallof Press", series: "3×10/lado", descanso: "30s", observacao: "Anti-rotação com elástico" },
        { exercicio: "Clamshell", series: "3×12/lado", descanso: "30s", observacao: "Ativação de glúteo médio" },
        { exercicio: "Wall Slide", series: "3×10", descanso: "30s", observacao: "Mobilidade escapular" },
      ],
      "Fortalecimento Corretivo": [
        { exercicio: "Agachamento com TRX", series: "3×12", descanso: "45s", observacao: "Controle de valgo" },
        { exercicio: "Step-up baixo", series: "3×10/leg", descanso: "45s", observacao: "Progressão de carga gradual" },
        { exercicio: "Face Pull (elástico)", series: "3×15", descanso: "30s", observacao: "Rotadores externos" },
        { exercicio: "Ponte unilateral", series: "3×10/leg", descanso: "30s", observacao: "Estabilização pélvica" },
        { exercicio: "Alongamento ativo global", series: "10min", descanso: "—", observacao: "Cadeia anterior e posterior" },
      ],
    },
  },

  // ── AVANÇADO / HÍBRIDO ──
  hibrido: {
    name: "Avançado / Híbrido",
    description: "Conciliação de força e cardio na mesma semana com periodização ondulada",
    generalNotes: "⚠️ Requer base sólida de treino. Gerencie fadiga e recuperação cuidadosamente.",
    category: "hibrido",
    workouts: {
      "Dia 1: Força Upper": [
        { exercicio: "Supino reto", series: "4×5", descanso: "3min", observacao: "Pesado", rpe: "8-9", percentual1rm: "80-85%" },
        { exercicio: "Remada barra", series: "4×5", descanso: "2min", observacao: "Pesado", rpe: "8" },
        { exercicio: "OHP", series: "3×8", descanso: "90s", observacao: "Moderado", rpe: "7" },
        { exercicio: "Acessórios braços", series: "2×12", descanso: "60s", observacao: "Superset bíceps/tríceps" },
      ],
      "Dia 2: Cardio HIIT": [
        { exercicio: "Aquecimento", series: "10min", descanso: "—", observacao: "Progressivo", zonaFC: "Z1-Z2" },
        { exercicio: "Sprint/Row intervals", series: "8×30s ON / 90s OFF", descanso: "90s", observacao: "All-out", zonaFC: "Z5" },
        { exercicio: "Desaquecimento", series: "10min", descanso: "—", observacao: "Leve", zonaFC: "Z1" },
      ],
      "Dia 3: Força Lower": [
        { exercicio: "Agachamento", series: "4×5", descanso: "3min", observacao: "Pesado", rpe: "8-9", percentual1rm: "80-85%" },
        { exercicio: "Levantamento Terra Romeno", series: "3×8", descanso: "2min", observacao: "Moderado", rpe: "7" },
        { exercicio: "Afundo", series: "3×10/leg", descanso: "90s", observacao: "Volume" },
        { exercicio: "Panturrilha + Core", series: "3×15 / 3×30s", descanso: "30s", observacao: "Circuito" },
      ],
      "Dia 4: Cardio Steady State": [
        { exercicio: "Corrida / Bike / Remo", series: "45–60min", descanso: "—", observacao: "Base aeróbia", zonaFC: "Z2", pace: "Ritmo conversável" },
      ],
      "Dia 5: Full Body Metcon": [
        { exercicio: "Circuit: KB Swing + Burpee + Row", series: "4 rounds", descanso: "2min entre rounds", observacao: "40s trabalho / 20s transição", rpe: "8-9" },
        { exercicio: "Finisher: Sled Push ou Farmer Walk", series: "3×40m", descanso: "90s", observacao: "Conditioning" },
      ],
    },
  },

  // ── AERÓBICO ──
  aerobico: {
    name: "Aeróbico",
    description: "Programa de treino cardiovascular geral",
    generalNotes: "⚠️ Respeitar frequência cardíaca alvo e progressão gradual.",
    category: "aerobico",
    workouts: {
      "Treino Aeróbico": [
        { exercicio: "Aquecimento", series: "1×5–10min", descanso: "—", observacao: "Intensidade leve", zonaFC: "Z1" },
        { exercicio: "Cardio principal", series: "1×20–45min", descanso: "—", observacao: "Corrida, bike, elíptico ou remo", zonaFC: "Z2-Z3" },
        { exercicio: "Desaquecimento + alongamento", series: "1×5–10min", descanso: "—", observacao: "Retorno gradual", zonaFC: "Z1" },
      ],
    },
  },
};
