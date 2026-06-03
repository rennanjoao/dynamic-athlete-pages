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
