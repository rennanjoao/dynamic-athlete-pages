# Próximos passos — Feedback, Lembretes, Primeiro Acesso e Emails

## 1. Perguntas do check-in (feedback do aluno)

O formulário em `src/pages/CheckIn.tsx` + `src/lib/checkInSchema.ts` **já espelha o portal HTML** (comentário na linha 5 confirma). As perguntas atuais cobrem: humor, dieta/adesão, água, carboidratos, compulsão, intestino, treino, sono, stress, libido, aparência, temperatura D1-D5, observações + 5 medidas (peso, cintura, quadril, coxa, braço).

**Ação:** Revisar e limpar a ficha:
- Garantir que **apenas perguntas** apareçam (sem campos de cadastro — já está assim).
- Adicionar qualquer pergunta do portal que esteja faltando (vou comparar com o HTML que você enviou — preciso que me reenvie ou confirme se já está completo).
- Manter o salvamento atual em `check_ins.payload` + `current_metrics`.

## 2. Lembrete de 14 dias

Hoje não existe nenhuma lógica de lembrete. `check_ins.submitted_at` é lido mas nunca comparado com a data atual.

**Ação:** Em `src/pages/StudentArea.tsx`, logo abaixo do `<TrainerAlert />` (linha ~139), adicionar uma faixa quando `diasDesdeUltimoCheckin >= 14`:
- Vermelha/âmbar discreta: "Já se passaram X dias desde seu último feedback. Envie um novo para seu coach acompanhar sua evolução." + botão "Enviar feedback".
- Se nunca enviou e a anamnese já tem 14+ dias, mesma faixa.
- Dado vem de `useStudentData` (já carrega `checkIns` ordenados desc).

## 3. Primeiro acesso limpo (sem protocolo fake)

Hoje o aluno novo vê dados de exemplo hardcoded, o que confunde:
- `WorkoutPlan.tsx:131` retorna `DEFAULT_PERIODIZATION` (4 dias fake).
- `DynamicRoutine.tsx:146` retorna `DEFAULT_STRATEGY` (refeições fake).
- `StudentDashboard.tsx:242` usa `SAMPLE_WORKOUTS` e `SAMPLE_MEALS` hardcoded.

**Ação:** Trocar os fallbacks por **empty states** quando não houver `coach_plans` real para o aluno:
- WorkoutPlan: card "Seu coach ainda está montando seu treino. Avisaremos quando estiver pronto."
- DynamicRoutine: card "Seu plano alimentar ainda não foi publicado pelo seu coach."
- StudentDashboard: esconder cards de Treino do Dia / Refeições quando não houver plano publicado, e mostrar um aviso amigável.
- `ProtocolViewer.tsx` já faz isso corretamente — usar como referência.

## 4. Coach selecionando aluno (auto-load)

Já funciona: ao clicar em Anamnese / Rotina / Protocolo, o `RoutineBuilder` (linha 61-113) carrega automaticamente `coach_plans` + `anamnesis` via `useQuery` e popula o formulário. Sem cliques extras.

**Ação:** Apenas garantir que a tela inicial do `CoachDashboard` mostre os dados básicos do aluno selecionado (nome, última anamnese, último check-in, plano ativo) num painel resumido ao lado da lista — para o coach ver o panorama antes mesmo de abrir uma aba.

## 5. Email Web3Forms para coach (debug)

Achados em `src/lib/anamnesisSchema.ts`:

- **Bug principal:** `sendCheckinEmail` (linhas 189-233) **nunca é chamado** do `CheckIn.tsx`. O coach não recebe notificação quando aluno envia feedback.
- **Limitação Web3Forms:** o campo `to_email` (enviar para email do coach) **só funciona no plano Pro**. No plano grátis, tudo vai para o email da conta dona da access_key — provavelmente o motivo dos emails "não chegarem" aos coaches.
- Chave hardcoded em `src/lib/anamnesisSchema.ts:8` (publicável, mas idealmente em secret).

**Ação:**
- Chamar `sendCheckinEmail(coach.notification_email || coach.email, payload)` no submit do `CheckIn.tsx`.
- **Migrar para Resend** (já temos `RESEND_API_KEY` configurado em secrets) via uma edge function `notify-coach` — assim emails saem do nosso domínio, vão para o coach correto e não dependem do plano Web3Forms. Manter Web3Forms como fallback opcional.
- Edge function aceita `{ coachEmail, subject, html }` e usa Resend API.

---

## Ordem de execução

1. Edge function `notify-coach` (Resend) + integrar no submit da anamnese **e** do check-in.
2. Lembrete de 14 dias no `StudentArea`.
3. Empty states (remover sample data) em `WorkoutPlan`, `DynamicRoutine`, `StudentDashboard`.
4. Painel resumo do aluno no `CoachDashboard`.
5. Revisão final das perguntas do check-in (se você me reenviar o HTML, comparo campo a campo).

## Pergunta antes de implementar

Quer que eu **substitua** o Web3Forms pelo Resend (recomendado, emails confiáveis pelo seu domínio) ou **mantenha** Web3Forms e só conserte a chamada faltando no check-in?
