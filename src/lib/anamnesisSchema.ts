/**
 * anamnesisSchema.ts
 * Estrutura declarativa da nova anamnese (espelha o portal).
 * O payload completo é salvo em JSONB; apenas algumas métricas
 * são extraídas para `baseline_metrics` (peso, altura, cintura, etc).
 */

export type FieldType =
  | "text" | "number" | "date" | "tel" | "email"
  | "textarea" | "select" | "choices" | "slider";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: string[];          // for select / choices
  unit?: string;
  step?: string;
  min?: number;
  max?: number;
  required?: boolean;
  half?: boolean;              // 2-col layout
}

export interface SectionDef {
  id: string;
  title: string;
  fields: FieldDef[];
}

export const ANAMNESIS_SECTIONS: SectionDef[] = [
  {
    id: "identificacao",
    title: "01 · Identificação",
    fields: [
      { key: "nome", label: "Nome completo", type: "text", required: true },
      { key: "data_nasc", label: "Data de nascimento", type: "date", half: true },
      { key: "genero", label: "Sexo biológico", type: "choices", options: ["F", "M"], half: true },
      { key: "whatsapp", label: "WhatsApp", type: "tel", placeholder: "(11) 99999-9999", half: true },
      { key: "email", label: "E-mail", type: "email", half: true },
      { key: "cidade", label: "Cidade / Estado", type: "text", placeholder: "Ex: São Paulo / SP" },
    ],
  },
  {
    id: "composicao",
    title: "02 · Composição corporal",
    fields: [
      { key: "altura", label: "Altura", type: "number", unit: "cm", half: true },
      { key: "peso", label: "Peso", type: "number", unit: "kg", step: "0.1", half: true },
      { key: "cintura", label: "Cintura (umbigo)", type: "number", unit: "cm", step: "0.1", half: true },
      { key: "quadril", label: "Quadril", type: "number", unit: "cm", step: "0.1", half: true },
      { key: "braco_d", label: "Braço Direito", type: "number", unit: "cm", step: "0.1", half: true },
      { key: "braco_e", label: "Braço Esquerdo", type: "number", unit: "cm", step: "0.1", half: true },
      { key: "coxa_d", label: "Coxa Direita", type: "number", unit: "cm", step: "0.1", half: true },
      { key: "coxa_e", label: "Coxa Esquerda", type: "number", unit: "cm", step: "0.1", half: true },
      { key: "pant_d", label: "Panturrilha D", type: "number", unit: "cm", step: "0.1", half: true },
      { key: "pant_e", label: "Panturrilha E", type: "number", unit: "cm", step: "0.1", half: true },
      { key: "hist_peso", label: "Histórico de peso (máx/mín)", type: "text", placeholder: "Ex: máx 90kg, mín 62kg" },
    ],
  },
  {
    id: "objetivos",
    title: "03 · Objetivos",
    fields: [
      { key: "meta_peso", label: "Peso alvo", type: "number", unit: "kg", step: "0.1", half: true },
      { key: "meta_prazo", label: "Prazo (meses)", type: "number", half: true },
      { key: "objetivos", label: "Objetivos detalhados", type: "textarea", placeholder: "Detalhes dos seus objetivos…" },
    ],
  },
  {
    id: "rotina",
    title: "04 · Rotina",
    fields: [
      { key: "profissao", label: "Profissão e horários", type: "textarea", placeholder: "Ex: Analista, 8h–18h" },
      { key: "estudos", label: "Estudos", type: "text", placeholder: "Ex: Faculdade 19h–22h" },
      { key: "horario_dormir", label: "Horário de dormir", type: "text", placeholder: "Ex: 23h", half: true },
      { key: "horario_acordar", label: "Horário de acordar", type: "text", placeholder: "Ex: 6h30", half: true },
    ],
  },
  {
    id: "treino",
    title: "05 · Treinamento",
    fields: [
      { key: "anos_treino", label: "Anos treinando", type: "number", half: true },
      { key: "dias_treino", label: "Dias / semana", type: "number", half: true },
      { key: "duracao_sessao", label: "Duração máxima da sessão", type: "text", placeholder: "Ex: 60 min", half: true },
      { key: "horarios_treino", label: "Horários dos treinos", type: "text", placeholder: "Ex: Seg/Qua/Sex 7h", half: true },
      { key: "atividades", label: "Atividades físicas atuais", type: "textarea", placeholder: "Ex: Musculação 4x/sem" },
      { key: "equipamentos", label: "Equipamentos (se home gym)", type: "text" },
      { key: "descanso_treino", label: "Há quanto tempo não tira descanso de 1-2 semanas?", type: "text", placeholder: "Ex: 8 meses" },
      { key: "lesoes", label: "Lesões ativas ou histórico ortopédico", type: "textarea", placeholder: "Ex: Lesão no ombro…" },
    ],
  },
  {
    id: "substancias",
    title: "06 · Substâncias e Suplementação",
    fields: [
      { key: "remedios", label: "Remédios prescritos", type: "textarea", placeholder: "Nenhum." },
      { key: "drogas", label: "Drogas lícitas / ilícitas", type: "textarea", placeholder: "Ex: Álcool social" },
      { key: "hormonios", label: "Hormônios / anabolizantes / anticoncepcionais", type: "textarea", placeholder: "Nenhum." },
      { key: "estimulantes", label: "Estimulantes (café, pré-treino)", type: "textarea", placeholder: "Ex: 2 cafés/dia" },
      { key: "suplementacao", label: "Suplementação atual completa", type: "textarea", placeholder: "Ex: Creatina, Whey" },
    ],
  },
  {
    id: "dieta",
    title: "07 · Dieta e TGI",
    fields: [
      { key: "recordatorio", label: "Recordatório alimentar (dia típico)", type: "textarea", placeholder: "07h — café da manhã…" },
      { key: "disponibilidade_alim", label: "Disponibilidade alimentar no dia", type: "textarea" },
      { key: "alergias", label: "Alergias / Intolerâncias", type: "textarea", placeholder: "Ex: Intolerante a lactose" },
      { key: "rel_comida", label: "Relação com a comida / Histórico de dietas", type: "textarea" },
      {
        key: "compulsao",
        label: "Compulsão alimentar",
        type: "choices",
        options: ["Nenhuma", "Eventual", "Frequente", "Diária"],
      },
      { key: "compulsao_horario", label: "Horário / gatilho da compulsão", type: "text", placeholder: "Ex: À noite, finais de semana…" },
      {
        key: "feces_consistency",
        label: "Consistência das fezes (Bristol)",
        type: "select",
        options: ["type_1 (caroços duros)", "type_2 (salsicha grumosa)", "type_3 (salsicha com rachaduras)", "type_4 (salsicha lisa)", "type_5 (pedaços moles)", "type_6 (pastoso)", "type_7 (líquido)"],
      },
      { key: "gastrico", label: "Refluxo, gastrite, azia, gases", type: "textarea", placeholder: "Ex: Gastrite leve" },
      { key: "obs_fezes", label: "Observações sobre intestino", type: "text" },
    ],
  },
  {
    id: "sono",
    title: "08 · Sono e Descanso",
    fields: [
      { key: "tempo_sono", label: "Tempo para pegar no sono", type: "text", placeholder: "Ex: ~20 minutos", half: true },
      { key: "pico_cansaco", label: "Pico de cansaço no dia", type: "text", placeholder: "Ex: 15h", half: true },
      { key: "acorda_noite", label: "Acorda à noite?", type: "text", placeholder: "Ex: Não" },
      { key: "sintomas_noturnos", label: "Respiração e sintomas noturnos", type: "textarea", placeholder: "Boca seca, ronco…" },
      { key: "hrv", label: "HRV médio (se tiver relógio)", type: "text", placeholder: "Ex: 52ms" },
    ],
  },
  {
    id: "neuro",
    title: "09 · Neurológico (0–10)",
    fields: [
      { key: "neuro_motivacao", label: "Motivação", type: "slider", min: 0, max: 10 },
      { key: "neuro_concentracao", label: "Concentração", type: "slider", min: 0, max: 10 },
      { key: "neuro_memoria_curto", label: "Memória de curto prazo", type: "slider", min: 0, max: 10 },
      { key: "neuro_aprendizado", label: "Aprendizado", type: "slider", min: 0, max: 10 },
      { key: "neuro_libido", label: "Libido", type: "slider", min: 0, max: 10 },
      { key: "neuro_prazer", label: "Prazer com coisas simples", type: "slider", min: 0, max: 10 },
      { key: "neuro_social", label: "Sociabilidade", type: "slider", min: 0, max: 10 },
      { key: "neuro_fluencia", label: "Fluência verbal", type: "slider", min: 0, max: 10 },
      { key: "obs_neuro", label: "Observações", type: "textarea" },
    ],
  },
  {
    id: "clinico",
    title: "10 · Scans clínicos",
    fields: [
      { key: "temperatura", label: "Temperatura corporal ao acordar (média)", type: "text", placeholder: "Ex: 36.4 °C" },
      { key: "doencas", label: "Doenças pré-existentes / família", type: "textarea", placeholder: "Ex: Hipotireoidismo…" },
      { key: "mudancas_neg", label: "Mudanças negativas nos últimos 3 anos", type: "textarea" },
      { key: "cirurgias", label: "Cirurgias", type: "text", placeholder: "Nenhuma.", half: true },
      { key: "canal", label: "Tratamento de canal", type: "text", placeholder: "Nenhum", half: true },
      { key: "implantes", label: "Implantes / metal", type: "text", placeholder: "DIU, pinos…", half: true },
      { key: "queda_causa", label: "Queda capilar — fator suspeito", type: "text", placeholder: "Ex: pós-parto, stress", half: true },
      { key: "final_obs", label: "Observações finais importantes", type: "textarea" },
    ],
  },
];

// Métricas extraídas pro baseline
export const BASELINE_KEYS = [
  "altura", "peso", "cintura", "quadril",
  "braco_d", "braco_e", "coxa_d", "coxa_e", "pant_d", "pant_e",
] as const;

export function extractBaseline(payload: Record<string, unknown>) {
  const baseline: Record<string, number> = {};
  for (const k of BASELINE_KEYS) {
    const v = payload[k];
    const n = typeof v === "string" ? parseFloat(v) : (typeof v === "number" ? v : NaN);
    if (!isNaN(n)) baseline[k] = n;
  }
  return baseline;
}
