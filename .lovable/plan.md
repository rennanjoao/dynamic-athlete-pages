# Plano — Refinos no Painel do Coach e Área do Aluno

## 1. Painel do Coach — mostrar nome do aluno
- Em `useCoachStudents.ts`, hoje o nome vem só de `student_profiles.full_name`. Se o aluno não preencheu, mostra "Aluno".
- Fallback: buscar também em `profiles.full_name` e por fim no email do `auth.users` (via select cruzado). Garantir que sempre exiba algo identificável.

## 2. Regras de alerta por inatividade da anamnese/feedback
Hoje o `alertLevel` em `useCoachStudents.ts` usa último treino/refeição:
- 0 dias = ok, 1+ = warning, 3+ = critical
Mudar para considerar **último check-in (feedback) OU anamnese submitted_at**:
- ≥ 6 dias → **crítico** (vermelho)
- ≥ 3 dias → **atenção** (amarelo)
- < 3 dias → ok

## 3. Sistema de dúvidas no Protocolo
Nova tabela `protocol_questions`:
```
id, student_id, coach_id, protocol_id (nullable),
context: 'exercise' | 'meal' | 'supplement' | 'general',
item_ref (texto livre — nome do exercício/refeição/suplemento),
question (texto),
status: 'open' | 'answered',
coach_response, answered_at, created_at, updated_at
```
RLS:
- Aluno: insert/select próprias
- Coach vinculado: select/update das do seu aluno
- Admin: tudo

**UX no aluno (ProtocolViewer ou novo `StudentProtocolView`):**
- Cada item (exercício/refeição/suplemento) recebe um ícone 💬 (MessageCircle) com tooltip "Relatar dúvida"
- Clique abre dialog com textarea + botão Enviar
- Botão flutuante "Dúvida geral sobre protocolo" no rodapé

**UX no coach:**
- Novo card no `CoachDashboard` "Dúvidas dos alunos" com badge contador
- Lista agrupada por aluno, com contexto e item; campo de resposta inline
- Ao responder, marca `answered` e (opcional) envia email ao aluno via `notify-coach` reaproveitado

**Email para o coach:**
- Edge function nova ou extensão da `notify-coach` para enviar quando aluno cria dúvida
- Assunto: "Nova dúvida de {aluno} — {contexto}"
- Body: contexto, item, pergunta, link para painel

## 4. Ciclo de carbo no painel do aluno
- Hoje `coach_plans.diet_strategy_json` armazena ciclo definido pelo coach
- Quando o ciclo está ativo, adicionar 3 botões no topo da dieta do aluno: **Carbo Alto / Base / Carbo Baixo**
- Salvar escolha do dia em `diet_progress` ou local state com persistência por data
- Macros e quantidades recalculam conforme a estratégia do coach (já existe lógica de high/low; adicionar 'base' usando os valores base do plano)

## 5. Unificar Rotina + Protocolo
- Hoje o Coach tem aba "Rotina" (`RoutineBuilder`) e "Protocolo" (`ProtocolBuilder` + `ProtocolEditor`) com sobreposição
- **Remover aba Rotina** do `CoachDashboard`
- Mover o que falta para o Protocolo:
  - **Macros base** (calorias/proteína/carbo/gordura base) → nova seção "Macros base" dentro do `ProtocolBuilder`
  - Persistir nos campos já existentes `coach_plans.base_calories`, `base_protein_g`, etc., ou migrar para dentro do payload do protocolo
- A aba "Macros base" do dashboard (se existir como item separado) também sai

## 6. Export/Import de esboço do protocolo
- Botão **"Baixar esboço"** no `ProtocolBuilder` → exporta JSON estruturado (com placeholders e instruções) para o coach editar no PC/IA
- Botão **"Importar protocolo"** → faz upload do JSON e popula o `ProtocolBuilder` para revisão antes de salvar
- Formato: JSON simples seguindo `ProtocolPayloadSchema` + comentários inline (#) explicando cada campo

---

## Arquivos a criar/editar

**Migrações:**
- Nova migração: criar `protocol_questions` com GRANTs + RLS

**Edge Functions:**
- `notify-coach-question` (ou estender `notify-coach`) — email ao coach quando aluno cria dúvida

**Componentes novos:**
- `src/components/student/ProtocolQuestionButton.tsx` (ícone+dialog reutilizável)
- `src/components/coach/StudentQuestionsPanel.tsx`
- `src/components/student/CarbCycleSelector.tsx`
- `src/components/coach/ProtocolImportExport.tsx`

**Componentes editados:**
- `src/hooks/useCoachStudents.ts` — nome fallback + regra de alerta (3/6 dias por anamnese/check-in)
- `src/pages/CoachDashboard.tsx` — remover aba Rotina, adicionar painel de dúvidas
- `src/components/coach/ProtocolBuilder.tsx` — seção Macros base + botões export/import
- `src/components/student/ProtocolViewer.tsx` — botões de dúvida em cada item + dúvida geral
- `src/pages/StudentArea.tsx` ou `DynamicRoutine.tsx` — `CarbCycleSelector` na dieta

---

## Confirmações antes de começar
1. **Email ao coach por dúvida**: posso usar o `notify-coach` existente (Resend) com novo `kind: "question"`?
2. **Macros base no Protocolo**: manter na tabela `coach_plans` (campos existentes) ou mover tudo para dentro do `payload` do protocolo?
3. **Aba "Macros base"** atual do dashboard: ela existe como aba separada? Confirmo que deve ser removida e mesclada ao Protocolo.
4. **Dúvida geral**: deve aparecer em `StudentArea` (dashboard) ou só dentro do `ProtocolViewer`?

Se estiver tudo OK, posso seguir direto. Se preferir, ajusto qualquer ponto antes.
