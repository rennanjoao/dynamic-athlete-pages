# Cronograma — Master Protocol Builder

## Onde estamos hoje (já concluído)
- Auth Admin/Coach/Aluno com RLS e AdminGuard
- `manage-trainers` Edge Function (criação de coachs pelo admin)
- Notificações via Resend (`notify-coach`) na Anamnese e Check-in
- Lembrete de 14 dias no Check-in (`CheckInReminder`)
- Empty states em `WorkoutPlan`, `DynamicRoutine`, `StudentDashboard` (sem dados fake)
- Coach Dashboard carrega anamnese/plan ao selecionar aluno (`RoutineBuilder` via `useQuery`)
- Tabela `protocols` já existe (vazia) com `payload JSONB`, `is_template`, RLS Coach/Aluno OK

## O que falta — em 5 fases sequenciais

### Fase 1 — Base de dados (✅ já está no formato ideal)
A tabela `protocols` atual **já tem** todas as colunas que você desenhou no último SQL: `id`, `student_id`, `coach_id`, `name`, `is_template`, `payload jsonb`, `active`, timestamps + RLS de coach/aluno/template.
**Ação:** nenhuma migration nova. Apenas validar o schema do `payload` (TypeScript) — ver Fase 2.

### Fase 2 — Setup Inteligente + Roteamento Novo/Editar
**Tela:** `ProtocolBuilder.tsx` (acessada do Coach Dashboard ao selecionar aluno).

1. Ao selecionar aluno → `SELECT * FROM protocols WHERE student_id = X AND is_template = false ORDER BY updated_at DESC LIMIT 1`
2. Se existir: abre em **Modo Edição** (botão "Atualizar Protocolo")
3. Se não existir: abre **Modal de Setup**:
   - Divisão de treino: ABC / ABCD / ABCDE / AB off / livre
   - Qtd refeições: 3–8
   - Usa ciclo de carbo? sim/não
4. "Gerar Base" → monta formulário dinâmico vazio com os blocos certos
5. Header trava nome/ID do aluno

**Schema do `payload` (Zod):**
```ts
{
  setup: { split: "ABCDE", mealsCount: 5, carbCycle: true },
  guidelines: { training, diet, weekOrganization, supplementation },
  workouts: [{ key:"A", focus, exercises:[{name, sets, reps?, cadence?, rest?, notes?}] }],
  meals: [{ name, time, foods, qtyHighCarb?, qtyLowCarb?, substitutions }],
  carbCycle: { monday:"high", tuesday:"low", ... }
}
```
Campos opcionais por exercício (reps/cadência/descanso) atendem o caso "diretriz geral" vs "específico por exercício".

### Fase 3 — Templates (Biblioteca do Coach)
- Botão "Salvar como Template" no ProtocolBuilder → grava com `is_template=true`, `student_id=null`
- Tela `TemplatesLibrary.tsx` (lista templates do coach)
- Botão "Importar Template" no ProtocolBuilder → faz clone do `payload` para o aluno selecionado
- Maior ganho de produtividade real (recomendado priorizar antes do upload)

### Fase 4 — Smart Input (Colar do ChatGPT)
- Componente `PasteTableInput` em cada bloco (Treino, Dieta)
- Lê texto colado (TSV/Markdown table) → parseia → preenche linhas do formulário
- Validação visual antes de aceitar (preview do que vai entrar)
- Sem dependência de upload de arquivo (mais estável que .xlsx)

**Opcional:** botão "Baixar modelo .xlsx" só para quem prefere preencher offline — usa `xlsx` (SheetJS). Upload roda o mesmo parser do Smart Input.

### Fase 5 — Exportação do Aluno (PDF)
- Página do aluno (`/workout-plan` ou nova `/meu-protocolo`) lê o protocolo ativo
- Renderização visual interativa (já parcialmente existe)
- Botão **"Baixar PDF"** usando `jspdf` + `html2canvas` (ou `@react-pdf/renderer` para layout fino)
- Layout: logo Elite Lab Hub, diretrizes, treinos ABCDE, dieta com colunas Carbo Alto/Baixo, suplementação
- (Opcional futuro) export HTML/Excel — PDF cobre 95% dos casos

## Ordem de execução recomendada
1. **Fase 2** (Builder + Setup + Novo/Editar) — desbloqueia tudo
2. **Fase 3** (Templates) — maior ROI de tempo do coach
3. **Fase 5** (PDF do aluno) — entrega valor visível ao aluno
4. **Fase 4** (Smart Input/colar) — acelera ainda mais
5. (Opcional) Upload .xlsx + modelo para download

## Detalhes técnicos
- Bibliotecas a adicionar: `jspdf`, `html2canvas` (Fase 5); `xlsx` apenas se Fase 4-opcional for feita
- Validação: Zod schema central em `src/lib/protocolSchema.ts` (importado pelo Builder e pelo viewer do aluno)
- Estado: React Hook Form + Zod resolver no Builder
- Persistência: `supabase.from('protocols').upsert(...)` em `payload`
- RLS já cobre todos os casos (coach do aluno / coach do próprio template / aluno lê o próprio)

## Próximo passo concreto
Começar **Fase 2**: criar `src/pages/ProtocolBuilder.tsx` + `src/lib/protocolSchema.ts` + rota `/coach/protocol/:studentId`, com o modal de setup (split + refeições + ciclo de carbo) e detecção novo/editar.

Confirma que seguimos pela Fase 2 nessa ordem?
