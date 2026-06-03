/**
 * anamnesisSchema.ts
 * Constantes, helpers de upload e funções de envio de email.
 */

export const CLOUDINARY_CLOUD = "dkpgoisly";
export const CLOUDINARY_PRESET = "Fitness";
export const WEB3FORMS_KEY = "ab9159c3-f1e5-462a-aec7-5632170454e5";

export const NEURO_SLIDERS = [
  { key: "neuro_motivacao",    label: "Motivação" },
  { key: "neuro_concentracao", label: "Concentração" },
  { key: "neuro_memoria",      label: "Memória de curto prazo" },
  { key: "neuro_aprendizado",  label: "Aprendizado" },
  { key: "neuro_libido",       label: "Libido" },
  { key: "neuro_prazer",       label: "Prazer com coisas simples" },
  { key: "neuro_social",       label: "Sociabilidade" },
  { key: "neuro_fluencia",     label: "Fluência verbal" },
];

export const BASELINE_KEYS = [
  "altura","peso","cintura","quadril",
  "braco_d","braco_e","coxa_d","coxa_e","pant_d","pant_e",
] as const;

export interface AnamnesisField { key: string; label: string; type?: string; placeholder?: string; options?: string[]; step?: string | number; half?: boolean; [k: string]: unknown }
export interface AnamnesisSection { id: string; title: string; fields: AnamnesisField[] }
export type FieldDef = AnamnesisField;
export type SectionDef = AnamnesisSection;

export const ANAMNESIS_SECTIONS: AnamnesisSection[] = [
  { id: "identificacao", title: "Quem é você", fields: [
    { key: "nome", label: "Nome completo" },
    { key: "data_nasc", label: "Data de nascimento" },
    { key: "whatsapp", label: "WhatsApp" },
    { key: "email", label: "E-mail" },
    { key: "cidade", label: "Cidade / Estado" },
  ]},
  { id: "composicao", title: "Ponto de partida", fields: [
    { key: "altura", label: "Altura (cm)" },
    { key: "peso", label: "Peso (kg)" },
    { key: "cintura", label: "Cintura (cm)" },
    { key: "quadril", label: "Quadril (cm)" },
    { key: "braco_d", label: "Braço D (cm)" },
    { key: "braco_e", label: "Braço E (cm)" },
    { key: "coxa_d", label: "Coxa D (cm)" },
    { key: "coxa_e", label: "Coxa E (cm)" },
    { key: "pant_d", label: "Pant. D (cm)" },
    { key: "pant_e", label: "Pant. E (cm)" },
    { key: "hist_peso", label: "Histórico de peso" },
  ]},
  { id: "objetivos", title: "Para onde quer chegar", fields: [
    { key: "meta_peso", label: "Peso alvo (kg)" },
    { key: "meta_prazo", label: "Prazo (meses)" },
    { key: "meta_prioridade", label: "Prioridade" },
    { key: "objetivos", label: "Objetivos detalhados" },
  ]},
  { id: "rotina", title: "Sua rotina real", fields: [
    { key: "profissao", label: "Profissão e horário" },
    { key: "estudos", label: "Estudos" },
    { key: "horario_dormir", label: "Dorme às" },
    { key: "horario_acordar", label: "Acorda às" },
  ]},
  { id: "treino", title: "Histórico de treino", fields: [
    { key: "anos_treino", label: "Anos treinando" },
    { key: "nivel_treino", label: "Nível" },
    { key: "atividades", label: "Atividades atuais" },
    { key: "horarios_treino", label: "Horários dos treinos" },
    { key: "dias_treino", label: "Dias/semana" },
    { key: "duracao_sessao", label: "Duração máxima" },
    { key: "tem_academia", label: "Academia?" },
    { key: "equipamentos", label: "Equipamentos" },
    { key: "descanso_treino", label: "Tempo sem treinar" },
    { key: "pump", label: "Pump no treino" },
    { key: "lesoes", label: "Lesões" },
  ]},
  { id: "substancias", title: "Histórico de substâncias", fields: [
    { key: "remedios", label: "Remédios prescritos" },
    { key: "drogas", label: "Drogas lícitas/ilícitas" },
    { key: "hormonios", label: "Hormônios / anabolizantes" },
    { key: "estimulantes", label: "Estimulantes" },
    { key: "suplementacao", label: "Suplementação atual" },
  ]},
  { id: "alimentacao", title: "Alimentação & digestão", fields: [
    { key: "hidratacao", label: "Água/dia" },
    { key: "recordatorio", label: "Recordatório alimentar" },
    { key: "disponibilidade_alim", label: "Disponibilidade alimentar" },
    { key: "alergias", label: "Alergias / intolerâncias" },
    { key: "rel_comida", label: "Relação com comida" },
    { key: "compulsao_estado", label: "Compulsão alimentar" },
    { key: "compulsao_horario", label: "Horário/gatilho" },
    { key: "fezes", label: "Consistência das fezes" },
    { key: "gastrico", label: "Refluxo / gastrite / azia" },
    { key: "obs_fezes", label: "Obs. intestino" },
  ]},
  { id: "sono", title: "Descanso & recuperação", fields: [
    { key: "tempo_sono", label: "Tempo para dormir" },
    { key: "pico_cansaco", label: "Pico de cansaço" },
    { key: "acorda_descansado", label: "Acorda descansado?" },
    { key: "acorda_noite", label: "Acorda à noite?" },
    { key: "sintomas_noturnos", label: "Sintomas noturnos" },
    { key: "hrv", label: "HRV" },
  ]},
  { id: "neuro", title: "Como você se sente", fields: [
    ...NEURO_SLIDERS.map(s => ({ key: s.key, label: s.label })),
    { key: "obs_neuro", label: "Observações" },
  ]},
  { id: "clinico", title: "Histórico clínico", fields: [
    { key: "exames", label: "Exames recentes" },
    { key: "doencas", label: "Doenças" },
    { key: "familiar", label: "Histórico familiar" },
  ]},
];

export function extractBaseline(payload: Record<string, unknown>) {
  const b: Record<string, number> = {};
  for (const k of BASELINE_KEYS) {
    const v = payload[k];
    const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
    if (!isNaN(n)) b[k] = n;
  }
  return b;
}

export async function uploadToCloudinary(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CLOUDINARY_PRESET);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
    { method: "POST", body: fd }
  );
  const data = await res.json();
  return data.secure_url as string;
}

/**
 * Envia anamnese por email para o coach selecionado.
 * @param coachEmail - notification_email do coach (ou email de login como fallback)
 */
export async function sendAnamnesisEmail(
  payload: Record<string, unknown>,
  gender: string,
  tpm: string[],
  quedaF: string[],
  fotos: Record<string, string>,
  coachEmail: string
): Promise<boolean> {
  if (!coachEmail) return false;

  const fd = new FormData();
  fd.append("access_key", WEB3FORMS_KEY);
  fd.append("subject", `Anamnese — ${payload.nome}`);
  fd.append("from_name", String(payload.nome ?? "Aluno"));
  fd.append("replyto", String(payload.email ?? ""));

  // Destinatário dinâmico — email do coach
  fd.append("to_email", coachEmail);

  let msg = "ANAMNESE — PROTOCOLO PERSONALIZADO\n=====================================\n\n";
  msg += "[ DADOS PREENCHIDOS ]\n";
  for (const k in payload) {
    if (k === "fotos" || k === "coach_id") continue;
    msg += `${k.toUpperCase()}: ${payload[k] || "—"}\n`;
  }
  msg += `\nGÊNERO: ${gender === "F" ? "Feminino" : gender === "M" ? "Masculino" : "—"}\n`;
  if (gender === "F") {
    msg += `\n[ SAÚDE FEMININA ]\nTPM: ${tpm.join(", ") || "Nenhum"}\nQUEDA CAPILAR: ${quedaF.join(", ") || "Nenhuma"}\n`;
  }
  msg += `\n[ FOTOS ]\nFrente: ${fotos.frente || "Não enviada"}\nLateral Dir: ${fotos.lateral_dir || "Não enviada"}\nLateral Esq: ${fotos.lateral_esq || "Não enviada"}\nCostas: ${fotos.costas || "Não enviada"}`;
  fd.append("message", msg);

  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: fd,
    });
    const result = await res.json();
    return result.success === true;
  } catch {
    return false;
  }
}

/**
 * Envia check-in por email para o coach do aluno.
 */
export async function sendCheckinEmail(
  payload: Record<string, unknown>,
  groups: Record<string, string>,
  colaterais: Record<string, string>,
  fotos: Record<string, string>,
  coachEmail: string
): Promise<boolean> {
  if (!coachEmail) return false;

  const fd = new FormData();
  fd.append("access_key", WEB3FORMS_KEY);
  fd.append("subject", `Check-in — ${payload.nome}`);
  fd.append("from_name", String(payload.nome ?? "Aluno"));
  fd.append("replyto", String(payload.email ?? ""));
  fd.append("to_email", coachEmail);

  let msg = "CHECK-IN QUINZENAL\n=====================================\n\n";
  msg += "[ DADOS ]\n";
  for (const k in payload) {
    msg += `${k.toUpperCase()}: ${payload[k] || "—"}\n`;
  }
  msg += "\n[ SELEÇÕES ]\n";
  for (const k in groups) {
    msg += `${k.toUpperCase()}: ${groups[k]}\n`;
  }
  if (Object.keys(colaterais).length > 0) {
    msg += "\n[ COLATERAIS ]\n";
    for (const k in colaterais) {
      msg += `${k}: ${colaterais[k]}\n`;
    }
  }
  msg += `\n[ FOTOS ]\nFrente: ${fotos.frente || "Não enviada"}\nLateral Dir: ${fotos.lateral_dir || "Não enviada"}\nLateral Esq: ${fotos.lateral_esq || "Não enviada"}\nCostas: ${fotos.costas || "Não enviada"}`;
  fd.append("message", msg);

  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: fd,
    });
    const result = await res.json();
    return result.success === true;
  } catch {
    return false;
  }
}
