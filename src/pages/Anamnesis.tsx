/**
 * Anamnesis.tsx
 * 12 seções fiéis ao portal__2_.html
 * Cadastro automático via Código do Coach acoplado ao envio da Anamnese.
 */
import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { uploadToCloudinary, sendAnamnesisEmail, NEURO_SLIDERS } from "@/lib/anamnesisSchema";
import { cn } from "@/lib/utils";

/* ── tipos ─────────────────────────────────────────────────── */
type ChoiceGroup = Record<string, string>;

/* ── helpers de UI ─────────────────────────────────────────── */
function Choices({ options, group, state, setState, cols = 3 }: {
  options: { value: string; theme?: "green" | "amber" | "red" }[];
  group: string; state: ChoiceGroup; setState: (s: ChoiceGroup) => void; cols?: number;
}) {
  const THEME = { green: "border-green-500 bg-green-500/10 text-green-400", amber: "border-amber-400 bg-amber-400/10 text-amber-400", red: "border-red-500 bg-red-500/10 text-red-400" };
  return (
    <div className={cn("flex flex-wrap gap-2", cols === 2 && "grid grid-cols-2", cols === 3 && "grid grid-cols-3")}>
      {options.map(o => {
        const sel = state[group] === o.value;
        const t = o.theme ? THEME[o.theme] : "";
        return (
          <button key={o.value} type="button"
            onClick={() => setState({ ...state, [group]: sel ? "" : o.value })}
            className={cn("px-3 py-2 rounded-lg text-xs font-medium border transition-all text-left",
              sel ? (t || "border-primary bg-primary/15 text-primary") : "border-border/50 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}>{o.value}</button>
        );
      })}
    </div>
  );
}

function FotoSlot({ label, preview, onFile, onRemove }: {
  label: string; preview: string | null; onFile: (f: File) => void; onRemove: () => void;
}) {
  const inp = useRef<HTMLInputElement>(null);
  return (
    <div onClick={() => !preview && inp.current?.click()}
      className={cn("relative aspect-[3/4] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden",
        preview ? "border-primary/40 border-solid" : "border-border/40 hover:border-primary/40")}>
      <input ref={inp} type="file" accept="image/*" className="hidden"
        onChange={e => { if (e.target.files?.[0]) onFile(e.target.files[0]); }} />
      {preview ? (
        <>
          <img src={preview} alt={label} className="absolute inset-0 w-full h-full object-cover" />
          <button type="button" onClick={e => { e.stopPropagation(); onRemove(); }}
            className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-full bg-black/70 border border-border text-white text-xs flex items-center justify-center">✕</button>
        </>
      ) : (
        <><span className="text-2xl mb-1">📷</span><span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground text-center px-1">{label}</span></>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.5"><label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</label>{children}</div>;
}
function FiInput({ name, type = "text", placeholder, step, value, onChange }: {
  name: string; type?: string; placeholder?: string; step?: string; value: string; onChange: (v: string) => void;
}) {
  return <input name={name} type={type} step={step} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
    className="w-full px-4 py-3 rounded-lg bg-card border border-border/60 text-foreground text-sm outline-none focus:border-primary/50 transition-colors" />;
}
function FiTextarea({ name, placeholder, value, onChange, rows = 3 }: {
  name: string; placeholder?: string; value: string; onChange: (v: string) => void; rows?: number;
}) {
  return <textarea name={name} placeholder={placeholder} value={value} rows={rows} onChange={e => onChange(e.target.value)}
    className="w-full px-4 py-3 rounded-lg bg-card border border-border/60 text-foreground text-sm outline-none focus:border-primary/50 transition-colors resize-none" />;
}
function SecHead({ num, title }: { num: string; title: string }) {
  return <div className="flex items-center gap-3 mb-4"><span className="text-xs font-bold text-primary border border-primary/30 rounded-md px-2 py-0.5">{num}</span><span className="font-bold text-lg text-foreground">{title}</span></div>;
}
function Card({ children, label }: { children: React.ReactNode; label?: string }) {
  return <div className="bg-card border border-border/40 rounded-xl p-4 mb-3 space-y-4">{label && <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border/30 pb-2">{label}</p>}{children}</div>;
}

/* ── componente principal ───────────────────────────────────── */
const Anamnesis = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [gender, setGender] = useState<"F" | "M" | "">("");
  const [tpm, setTpm] = useState<string[]>([]);
  const [quedaF, setQuedaF] = useState<string[]>([]);
  const [groups, setGroups] = useState<ChoiceGroup>({});
  const [toast, setToast] = useState("");

  const [fotoFiles, setFotoFiles] = useState<Record<string, File | null>>({ frente: null, lateral_dir: null, lateral_esq: null, costas: null });
  const [fotoPreviews, setFotoPreviews] = useState<Record<string, string | null>>({ frente: null, lateral_dir: null, lateral_esq: null, costas: null });

  const [d, setD] = useState<Record<string, string>>({});
  const set = (k: string) => (v: string) => setD(p => ({ ...p, [k]: v }));
  const g = (k: string) => d[k] ?? "";

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  function toggleMulti(arr: string[], setArr: (a: string[]) => void, val: string, solo?: boolean) {
    if (solo) { setArr(arr.includes(val) ? [] : [val]); return; }
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr.filter(x => x !== "Sem sintomas" && x !== "Nenhuma"), val]);
  }

  function setFoto(key: string, file: File) {
    setFotoFiles(p => ({ ...p, [key]: file }));
    const reader = new FileReader();
    reader.onload = e => setFotoPreviews(p => ({ ...p, [key]: e.target?.result as string }));
    reader.readAsDataURL(file);
  }

  const handleSubmit = useCallback(async () => {
    // Novas validações obrigatórias para o Cadastro
    if (!g("codigo_convite")) { showToast("Insira o código do treinador."); return; }
    if (!g("nome")) { showToast("Nome obrigatório."); return; }
    if (!g("email") || !g("email").includes("@")) { showToast("E-mail inválido."); return; }
    if (!g("senha") || g("senha").length < 6) { showToast("Crie uma senha de no mínimo 6 caracteres."); return; }
    if (!gender) { showToast("Selecione seu gênero."); return; }

    setSaving(true);
    try {
      // 1. Valida o código do Coach no banco via RPC
      const { data: coachData, error: rpcError } = await supabase.rpc('get_coach_by_invite_code', { p_code: g("codigo_convite").trim() });
      if (rpcError || !coachData || coachData.length === 0) {
        throw new Error("Código de treinador inválido ou inexistente.");
      }
      const validCoachId = coachData[0].coach_id;
      const coachEmail = coachData[0].notification_email;

      // 2. Cria a conta do Aluno
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: g("email"),
        password: g("senha"),
        options: { data: { full_name: g("nome") } }
      });
      if (authError || !authData.user) {
        throw new Error(authError?.message === "User already registered" ? "Este e-mail já está cadastrado." : "Erro ao criar conta.");
      }

      // 3. Upload fotos
      const fotos: Record<string, string> = {};
      for (const [key, file] of Object.entries(fotoFiles)) {
        if (file) { try { fotos[key] = await uploadToCloudinary(file); } catch { fotos[key] = ""; } }
      }

      // 4. Prepara Payload
      const payload: Record<string, unknown> = {
        ...d, gender,
        tpm: tpm.join(", "),
        queda_capilar_f: quedaF.join(", "),
        ...groups,
        fotos,
        coach_id: validCoachId,
      };

      const baseline: Record<string, number> = {};
      const bKeys = ["altura", "peso", "cintura", "quadril", "braco_d", "braco_e", "coxa_d", "coxa_e", "pant_d", "pant_e"];
      for (const k of bKeys) {
        const n = parseFloat(String(payload[k] ?? ""));
        if (!isNaN(n)) baseline[k] = n;
      }

      // 5. Salva a Anamnese vinculada ao novo usuário
      await (supabase.from("anamnesis") as any).insert({
        student_id: authData.user.id,
        coach_id: validCoachId,
        payload,
        baseline_metrics: baseline,
        submitted_at: new Date().toISOString(),
      });

      // 6. Vincula aluno ao coach na tabela coach_students
      await supabase.from("coach_students").insert({
        coach_id: validCoachId,
        student_id: authData.user.id,
        status: "active",
      });

      // 7. Dispara email pro coach
      if (coachEmail) {
        await sendAnamnesisEmail(payload, gender, tpm, quedaF, fotos, coachEmail);
      }

      setDone(true);
    } catch (e: any) {
      console.error(e);
      showToast(e.message || "Erro ao enviar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }, [d, gender, tpm, quedaF, groups, fotoFiles]);

  if (done) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center gap-5">
      <div className="w-16 h-16 rounded-full border border-primary bg-primary/10 flex items-center justify-center text-2xl">✓</div>
      <h2 className="text-2xl font-bold text-foreground">Conta criada e Anamnese enviada!</h2>
      <p className="text-muted-foreground text-sm max-w-xs">Obrigado(a), <span className="text-primary font-bold">{g("nome").split(" ")[0]}</span>. Seu coach receberá seus dados e você já possui acesso à plataforma.</p>
      <Button onClick={() => navigate("/student-area")}>Acessar minha área</Button>
    </div>
  );

  const chBtn = (id: string) => cn("px-5 py-2.5 rounded-xl text-sm font-bold border-2 transition-all",
    gender === id ? "border-primary bg-primary/15 text-primary" : "border-border/50 text-muted-foreground hover:border-primary/40");

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Topbar */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-5 py-3 bg-background/90 backdrop-blur border-b border-border/40">
        <span className="font-bold text-sm text-primary tracking-widest uppercase">Anamnese de Ingresso</span>
        <Button variant="outline" size="sm" onClick={() => { setD({}); setGender(""); setGroups({}); showToast("Limpo."); }}>Limpar</Button>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-8">

        {/* 01 — Quem é você */}
        <section>
          <SecHead num="01" title="Quem é você" />
          
          {/* CÓDIGO DO COACH - Substituiu o seletor antigo */}
          <Card label="Vínculo de Treinamento">
            <Field label="Código do Treinador (Obrigatório)">
              <FiInput name="codigo_convite" placeholder="Ex: ELITE2026" value={g("codigo_convite")} onChange={(v) => set("codigo_convite")(v.toUpperCase())} />
            </Field>
            <p className="text-[10px] text-muted-foreground mt-1">Insira o código fornecido pelo seu coach para vincular sua conta automaticamente.</p>
          </Card>

          <Card label="Dados pessoais e Acesso">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Field label="Nome completo"><FiInput name="nome" placeholder="Seu nome completo" value={g("nome")} onChange={set("nome")} /></Field></div>
              <Field label="Data de nascimento"><FiInput name="data_nasc" type="date" value={g("data_nasc")} onChange={set("data_nasc")} /></Field>
              <Field label="WhatsApp"><FiInput name="whatsapp" type="tel" placeholder="(11) 99999-9999" value={g("whatsapp")} onChange={set("whatsapp")} /></Field>
              
              {/* E-MAIL E SENHA PARA CADASTRO */}
              <div className="col-span-2"><Field label="E-mail (Login)"><FiInput name="email" type="email" placeholder="voce@email.com" value={g("email")} onChange={set("email")} /></Field></div>
              <div className="col-span-2"><Field label="Crie uma Senha"><FiInput name="senha" type="password" placeholder="Mínimo 6 caracteres" value={g("senha")} onChange={set("senha")} /></Field></div>
              
              <div className="col-span-2"><Field label="Cidade / Estado"><FiInput name="cidade" placeholder="Ex: São Paulo / SP" value={g("cidade")} onChange={set("cidade")} /></Field></div>
            </div>
          </Card>
          <Card label="Gênero">
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setGender("F")} className={chBtn("F")}>♀ Feminino</button>
              <button type="button" onClick={() => setGender("M")} className={chBtn("M")}>♂ Masculino</button>
            </div>
          </Card>
        </section>

        {/* 02 — Ponto de partida */}
        <section>
          <SecHead num="02" title="Seu ponto de partida" />
          <Card>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Altura (cm)"><FiInput name="altura" type="number" placeholder="170" value={g("altura")} onChange={set("altura")} /></Field>
              <Field label="Peso (kg)"><FiInput name="peso" type="number" step="0.1" placeholder="70.0" value={g("peso")} onChange={set("peso")} /></Field>
              <Field label="Cintura no umbigo (cm)"><FiInput name="cintura" type="number" step="0.1" placeholder="80" value={g("cintura")} onChange={set("cintura")} /></Field>
              <Field label="Quadril (cm)"><FiInput name="quadril" type="number" step="0.1" placeholder="98" value={g("quadril")} onChange={set("quadril")} /></Field>
              <Field label="Braço D (cm)"><FiInput name="braco_d" type="number" step="0.1" placeholder="Dir." value={g("braco_d")} onChange={set("braco_d")} /></Field>
              <Field label="Braço E (cm)"><FiInput name="braco_e" type="number" step="0.1" placeholder="Esq." value={g("braco_e")} onChange={set("braco_e")} /></Field>
              <Field label="Coxa D (cm)"><FiInput name="coxa_d" type="number" step="0.1" placeholder="Dir." value={g("coxa_d")} onChange={set("coxa_d")} /></Field>
              <Field label="Coxa E (cm)"><FiInput name="coxa_e" type="number" step="0.1" placeholder="Esq." value={g("coxa_e")} onChange={set("coxa_e")} /></Field>
              <Field label="Pant. D (cm)"><FiInput name="pant_d" type="number" step="0.1" placeholder="Dir." value={g("pant_d")} onChange={set("pant_d")} /></Field>
              <Field label="Pant. E (cm)"><FiInput name="pant_e" type="number" step="0.1" placeholder="Esq." value={g("pant_e")} onChange={set("pant_e")} /></Field>
              <div className="col-span-2"><Field label="Histórico de peso (máx/mín)"><FiInput name="hist_peso" placeholder="Ex: máx 90kg, mín 62kg" value={g("hist_peso")} onChange={set("hist_peso")} /></Field></div>
            </div>
          </Card>
        </section>

        {/* 03 — Para onde quer chegar */}
        <section>
          <SecHead num="03" title="Para onde você quer chegar" />
          <Card>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Peso alvo (kg)"><FiInput name="meta_peso" type="number" step="0.1" placeholder="65" value={g("meta_peso")} onChange={set("meta_peso")} /></Field>
              <Field label="Prazo (meses)"><FiInput name="meta_prazo" type="number" placeholder="6" value={g("meta_prazo")} onChange={set("meta_prazo")} /></Field>
            </div>
            <Field label="Prioridade">
              <Choices cols={3} group="meta_prioridade" state={groups} setState={setGroups}
                options={["Hipertrofia","Perda de gordura","Recomposição","Performance","Saúde"].map(v => ({ value: v }))} />
            </Field>
            <Field label="Objetivos detalhados">
              <FiTextarea name="objetivos" placeholder="Descreva seus objetivos..." value={g("objetivos")} onChange={set("objetivos")} />
            </Field>
          </Card>
        </section>

        {/* 04 — Rotina */}
        <section>
          <SecHead num="04" title="Sua rotina real" />
          <Card>
            <Field label="Profissão e horário"><FiTextarea name="profissao" placeholder="Ex: Analista, 8h–18h, home office" value={g("profissao")} onChange={set("profissao")} /></Field>
            <Field label="Estudos"><FiInput name="estudos" placeholder="Ex: Faculdade 19h–22h ou Não estudo" value={g("estudos")} onChange={set("estudos")} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Dorme às"><FiInput name="horario_dormir" placeholder="Ex: 23h" value={g("horario_dormir")} onChange={set("horario_dormir")} /></Field>
              <Field label="Acorda às"><FiInput name="horario_acordar" placeholder="Ex: 6h30" value={g("horario_acordar")} onChange={set("horario_acordar")} /></Field>
            </div>
          </Card>
        </section>

        {/* 05 — Treino */}
        <section>
          <SecHead num="05" title="Histórico de treino" />
          <Card label="Experiência">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Anos treinando"><FiInput name="anos_treino" type="number" placeholder="Ex: 3" value={g("anos_treino")} onChange={set("anos_treino")} /></Field>
              <Field label="Nível">
                <Choices cols={3} group="nivel_treino" state={groups} setState={setGroups}
                  options={["Iniciante","Intermediário","Avançado"].map(v => ({ value: v }))} />
              </Field>
            </div>
            <Field label="Atividades atuais"><FiTextarea name="atividades" placeholder="Ex: Musculação 4x/semana" value={g("atividades")} onChange={set("atividades")} /></Field>
            <Field label="Horários dos treinos"><FiInput name="horarios_treino" placeholder="Ex: Seg/Qua/Sex 7h" value={g("horarios_treino")} onChange={set("horarios_treino")} /></Field>
          </Card>
          <Card label="Disponibilidade">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Dias/semana"><FiInput name="dias_treino" type="number" placeholder="Ex: 4" value={g("dias_treino")} onChange={set("dias_treino")} /></Field>
              <Field label="Duração máxima"><FiInput name="duracao_sessao" placeholder="Ex: 60 min" value={g("duracao_sessao")} onChange={set("duracao_sessao")} /></Field>
            </div>
            <Field label="Academia?">
              <Choices cols={3} group="tem_academia" state={groups} setState={setGroups}
                options={[{ value: "Sim", theme: "green" }, { value: "Home gym" }, { value: "Não" }]} />
            </Field>
            <Field label="Equipamentos (se home gym)"><FiInput name="equipamentos" placeholder="Ex: Barras, halteres" value={g("equipamentos")} onChange={set("equipamentos")} /></Field>
          </Card>
          <Card label="Diagnóstico">
            <Field label="Sem descanso há quanto tempo?"><FiInput name="descanso_treino" placeholder="Ex: 8 meses" value={g("descanso_treino")} onChange={set("descanso_treino")} /></Field>
            <Field label="Pump no treino">
              <Choices cols={2} group="pump" state={groups} setState={setGroups}
                options={[{ value: "Inexistente", theme: "red" }, { value: "Fraco", theme: "amber" }, { value: "Bom", theme: "green" }, { value: "Ótimo", theme: "green" }]} />
            </Field>
            <Field label="Lesões / histórico ortopédico"><FiTextarea name="lesoes" placeholder="Ex: Lesão no ombro. Ou Nenhuma." value={g("lesoes")} onChange={set("lesoes")} /></Field>
          </Card>
        </section>

        {/* 06 — Substâncias */}
        <section>
          <SecHead num="06" title="Histórico de Substâncias" />
          <Card>
            <Field label="Remédios prescritos"><FiTextarea name="remedios" placeholder="Nenhum." value={g("remedios")} onChange={set("remedios")} /></Field>
            <Field label="Drogas lícitas / ilícitas"><FiTextarea name="drogas" placeholder="Ex: Álcool social" value={g("drogas")} onChange={set("drogas")} /></Field>
            <Field label="Hormônios / anabolizantes / anticoncepcionais"><FiTextarea name="hormonios" placeholder="Nenhum." value={g("hormonios")} onChange={set("hormonios")} /></Field>
            <Field label="Estimulantes (café, pré-treino)"><FiTextarea name="estimulantes" placeholder="Ex: 2 cafés/dia" value={g("estimulantes")} onChange={set("estimulantes")} /></Field>
            <Field label="Suplementação completa atual"><FiTextarea name="suplementacao" placeholder="Ex: Creatina 5g, Whey 30g..." value={g("suplementacao")} onChange={set("suplementacao")} /></Field>
          </Card>
        </section>

        {/* 07 — Alimentação */}
        <section>
          <SecHead num="07" title="Alimentação & digestão" />
          <Card>
            <Field label="Água/dia">
              <Choices cols={3} group="hidratacao" state={groups} setState={setGroups}
                options={[{ value: "≤1L", theme: "red" }, { value: "2L", theme: "amber" }, { value: "3L" }, { value: "4L", theme: "green" }, { value: "5L+", theme: "green" }]} />
            </Field>
            <Field label="Recordatório alimentar — dia típico completo">
              <FiTextarea name="recordatorio" rows={5} placeholder={"07h — 2 ovos, café\n12h — 150g arroz, 150g frango, salada\n16h — 1 banana, whey\n19h — Omelete, legumes"} value={g("recordatorio")} onChange={set("recordatorio")} />
            </Field>
            <Field label="Disponibilidade alimentar no dia"><FiTextarea name="disponibilidade_alim" placeholder="Ex: Levo marmita, geladeira no trabalho" value={g("disponibilidade_alim")} onChange={set("disponibilidade_alim")} /></Field>
            <Field label="Alergias / Intolerâncias"><FiTextarea name="alergias" placeholder="Ex: Intolerante a lactose" value={g("alergias")} onChange={set("alergias")} /></Field>
            <Field label="Relação com comida / Histórico de dietas"><FiTextarea name="rel_comida" placeholder="Já fez dieta restritiva? Como é sua relação com comida hoje?" value={g("rel_comida")} onChange={set("rel_comida")} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Compulsão alimentar?">
                <Choices cols={3} group="compulsao_estado" state={groups} setState={setGroups}
                  options={[{ value: "Não", theme: "green" }, { value: "Leve", theme: "amber" }, { value: "Forte", theme: "red" }]} />
              </Field>
              <Field label="Horário / gatilho"><FiInput name="compulsao_horario" placeholder="Ex: À noite..." value={g("compulsao_horario")} onChange={set("compulsao_horario")} /></Field>
            </div>
          </Card>
          <Card label="Saúde Intestinal">
            <Field label="Consistência das fezes">
              <Choices cols={2} group="fezes" state={groups} setState={setGroups}
                options={[{ value: "Preso", theme: "red" }, { value: "Irregular", theme: "amber" }, { value: "Normal", theme: "green" }, { value: "Solto" }]} />
            </Field>
            <Field label="Refluxo, gastrite, azia, gases"><FiTextarea name="gastrico" placeholder="Nenhum." value={g("gastrico")} onChange={set("gastrico")} /></Field>
            <Field label="Obs. intestino"><FiInput name="obs_fezes" placeholder="Ex: Gases com leguminosas" value={g("obs_fezes")} onChange={set("obs_fezes")} /></Field>
          </Card>
        </section>

        {/* 08 — Sono */}
        <section>
          <SecHead num="08" title="Descanso & recuperação" />
          <Card>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tempo para dormir"><FiInput name="tempo_sono" placeholder="Ex: ~20 min" value={g("tempo_sono")} onChange={set("tempo_sono")} /></Field>
              <Field label="Pico de cansaço"><FiInput name="pico_cansaco" placeholder="Ex: ~15h" value={g("pico_cansaco")} onChange={set("pico_cansaco")} /></Field>
            </div>
            <Field label="Acorda descansado?">
              <Choices cols={3} group="acorda_descansado" state={groups} setState={setGroups}
                options={[{ value: "Sim", theme: "green" }, { value: "Às vezes" }, { value: "Não", theme: "red" }]} />
            </Field>
            <Field label="Acorda à noite?"><FiInput name="acorda_noite" placeholder="Não." value={g("acorda_noite")} onChange={set("acorda_noite")} /></Field>
            <Field label="Sintomas noturnos"><FiTextarea name="sintomas_noturnos" placeholder="Boca seca, ronco..." value={g("sintomas_noturnos")} onChange={set("sintomas_noturnos")} /></Field>
            <Field label="HRV (se tiver relógio)"><FiInput name="hrv" placeholder="Ex: 52ms ou Não tenho" value={g("hrv")} onChange={set("hrv")} /></Field>
          </Card>
        </section>

        {/* 09 — Neurológico */}
        <section>
          <SecHead num="09" title="Como você se sente" />
          <p className="text-xs text-muted-foreground mb-3">Avalie de 0 (péssimo) a 10 (excelente) — últimos 30 dias.</p>
          <Card>
            {NEURO_SLIDERS.map(s => {
              const val = parseInt(g(s.key) || "5");
              return (
                <div key={s.key} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-muted-foreground">{s.label}</label>
                    <span className="text-primary text-xs font-bold">{val}/10</span>
                  </div>
                  <input type="range" min={0} max={10} value={val}
                    onChange={e => set(s.key)(e.target.value)} className="w-full accent-primary" />
                </div>
              );
            })}
            <Field label="Observações"><FiTextarea name="obs_neuro" placeholder="Foco, memória, disposição..." value={g("obs_neuro")} onChange={set("obs_neuro")} /></Field>
          </Card>
        </section>

        {/* 10 — Saúde por gênero */}
        {gender === "F" && (
          <section>
            <SecHead num="10" title="Saúde Feminina" />
            <Card label="Ciclo e TPM">
              <Field label="Ciclo Menstrual">
                <Choices cols={3} group="ciclo_regular" state={groups} setState={setGroups}
                  options={[{ value: "Regular", theme: "green" }, { value: "Irregular", theme: "amber" }, { value: "Ausente" }]} />
              </Field>
              <Field label="Sintomas de TPM">
                <div className="flex flex-wrap gap-2">
                  {["Inchaço","Oscilação de humor","Cólicas","Fadiga","Insônia","Ansiedade","Enxaqueca","Compulsão","Sem sintomas"].map(v => (
                    <button key={v} type="button" onClick={() => toggleMulti(tpm, setTpm, v, v === "Sem sintomas")}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                        tpm.includes(v) ? "border-primary bg-primary/15 text-primary" : "border-border/50 text-muted-foreground hover:border-primary/40")}>{v}</button>
                  ))}
                </div>
              </Field>
            </Card>
            <Card label="Queda Capilar">
              <Field label="Onde percebe?">
                <div className="flex flex-wrap gap-2">
                  {["Topo","Franja","Têmporas","Difuso","Nenhuma"].map(v => (
                    <button key={v} type="button" onClick={() => toggleMulti(quedaF, setQuedaF, v, v === "Nenhuma")}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                        quedaF.includes(v) ? "border-primary bg-primary/15 text-primary" : "border-border/50 text-muted-foreground hover:border-primary/40")}>{v}</button>
                  ))}
                </div>
              </Field>
              <Field label="Fator desencadeante suspeito"><FiInput name="queda_causa_f" placeholder="Ex: pós-parto, stress" value={g("queda_causa_f")} onChange={set("queda_causa_f")} /></Field>
            </Card>
          </section>
        )}

        {gender === "M" && (
          <section>
            <SecHead num="10" title="Saúde Masculina" />
            <Card>
              <Field label="Ereção matinal">
                <Choices cols={2} group="erecao_matinal" state={groups} setState={setGroups}
                  options={[{ value: "Forte", theme: "green" }, { value: "Normal" }, { value: "Fraca", theme: "amber" }, { value: "Ausente", theme: "red" }]} />
              </Field>
              <Field label="Queda capilar">
                <Choices cols={2} group="queda_masc" state={groups} setState={setGroups}
                  options={[{ value: "Sem queda", theme: "green" }, { value: "Entradas" }, { value: "Vértex" }, { value: "Avançada", theme: "red" }]} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Pai (calvície?)">
                  <Choices cols={3} group="hist_pai" state={groups} setState={setGroups}
                    options={[{ value: "Cheio", theme: "green" }, { value: "Parcial" }, { value: "Total" }]} />
                </Field>
                <Field label="Avô materno">
                  <Choices cols={3} group="hist_avo_mat" state={groups} setState={setGroups}
                    options={[{ value: "Cheio", theme: "green" }, { value: "Parcial" }, { value: "Total" }]} />
                </Field>
              </div>
            </Card>
          </section>
        )}

        {/* 11 — Histórico clínico */}
        <section>
          <SecHead num="11" title="Histórico clínico" />
          <Card>
            <Field label="Temperatura ao acordar (média 5 dias)"><FiInput name="temperatura" placeholder="Ex: 36.4 °C" value={g("temperatura")} onChange={set("temperatura")} /></Field>
            <Field label="Doenças pré-existentes / Família"><FiTextarea name="doencas" placeholder="Ex: Hipotireoidismo. Nenhuma." value={g("doencas")} onChange={set("doencas")} /></Field>
            <Field label="Mudanças negativas nos últimos 3 anos"><FiTextarea name="mudancas_neg" placeholder="Ex: Imunidade baixa, queda de cabelo..." value={g("mudancas_neg")} onChange={set("mudancas_neg")} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cirurgias"><FiInput name="cirurgias" placeholder="Nenhuma." value={g("cirurgias")} onChange={set("cirurgias")} /></Field>
              <Field label="Canal dentário"><FiInput name="canal" placeholder="Nenhum." value={g("canal")} onChange={set("canal")} /></Field>
            </div>
            <Field label="Implantes / Metal"><FiInput name="implantes" placeholder="DIU, pinos, placa..." value={g("implantes")} onChange={set("implantes")} /></Field>
            <Field label="Observações finais"><FiTextarea name="obs_finais" placeholder="Algo importante não perguntado..." value={g("obs_finais")} onChange={set("obs_finais")} /></Field>
          </Card>
        </section>

        {/* 12 — Fotos */}
        <section>
          <SecHead num="12" title="Fotos de Avaliação" />
          <Card>
            <div className="bg-card/50 border border-border/30 rounded-lg p-3 mb-3 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">📸 Mesmo protocolo sempre — para comparação real</p>
              {[["☀","Mesma luz natural — preferencialmente manhã"],["⏰","Mesmo horário — em jejum, antes de qualquer refeição"],["🩳", gender === "F" ? "Top esportivo e short de treino" : "Sunga, cueca boxer ou short de treino"],["📍","Mesmo local, mesma distância, fundo neutro"],["🧍","Postura semi-relaxada — sem sugar a barriga"]].map(([icon, text]) => (
                <div key={text} className="flex items-start gap-2 text-xs text-muted-foreground"><span>{icon}</span><span>{text}</span></div>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(["frente","lateral_dir","lateral_esq","costas"] as const).map(k => (
                <FotoSlot key={k}
                  label={k === "frente" ? "Frente" : k === "lateral_dir" ? "Lado Dir." : k === "lateral_esq" ? "Lado Esq." : "Costas"}
                  preview={fotoPreviews[k]}
                  onFile={f => setFoto(k, f)}
                  onRemove={() => { setFotoFiles(p => ({ ...p, [k]: null })); setFotoPreviews(p => ({ ...p, [k]: null })); }} />
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">Máx. 5MB · JPG ou PNG · Opcional mas altamente recomendado</p>
          </Card>
        </section>

        {/* Botão enviar */}
        <Button size="lg" className="w-full h-14 text-base font-bold glow-primary" onClick={handleSubmit} disabled={saving}>
          {saving ? "Enviando e cadastrando..." : "Finalizar Cadastro e Enviar"}
        </Button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card border border-border px-5 py-3 rounded-xl text-sm text-foreground shadow-lg z-50">{toast}</div>
      )}
    </div>
  );
};

export default Anamnesis;
