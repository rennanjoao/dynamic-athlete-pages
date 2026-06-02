# Ajustes RJ Elite Lab

## 1. Rebrand global
- Substituir "Elite Performance Platform" / "Elite Athlete Hub" / "Elite Athlete" por **"Elite Lab Hub – Rennan João"** (com `Hub` em vermelho via `<span className="text-primary">`).
- Buscar todas as ocorrências em `src/pages/Index.tsx`, `StudentArea.tsx`, `CoachDashboard.tsx`, `Auth.tsx`, `index.html` (title/description) e qualquer componente landing.
- Atualizar `mem://index.md` (Core) para refletir "Elite Lab Hub".

## 2. Terminologia "Atleta" → "Aluno"
- Renomear textualmente em toda UI pública e área do aluno (rotas `/`, `/student-area`, `/fitness`, `/evolution`, `/anamnesis`, `/check-in`).
- Manter "atleta" apenas em contextos de treinamento esportivo específico (ex.: copy do AI Coach falando de performance esportiva).
- "Área do Atleta" → "Área do Aluno" em todos os labels/headers.

## 3. Módulo Nutrição (landing/áreas públicas)
- Trocar card "Nutrição Avançada / Planos alimentares detalhados com macros, suplementação e horários otimizados" por:
  - Título: **Estratégias Nutricionais**
  - Texto: *Diretrizes e recomendações alimentares para apoiar seus objetivos de emagrecimento, saúde e performance.*

## 4. Módulo Analytics
- Trocar "Analytics de Performance" por:
  - Título: **Painel de Evolução**
  - Texto: *Visualize sua evolução através de métricas corporais, registros fotográficos e indicadores de performance ao longo do processo.*

## 5. Gestão de atletas — restrita ao Treinador
- Remover qualquer card/menção a "Atletas cadastrados", "Gerenciamento de atletas", contagem de atletas das páginas públicas e da Área do Aluno.
- Manter funcionalidades **apenas** dentro de `/coach` (`CoachDashboard.tsx`), já filtrado por `coach_id = auth.uid()` (via `useCoachStudents`) — confirmar RLS de `coach_students` (já OK).

## 6. Remover "Painel Fitness"
- Excluir rota `/fitness` e a página `src/pages/Fitness.tsx`.
- Realocar conteúdo útil (HoverBlock de Treinos/Dietas/Aeróbicos, WorkoutCard, DietCard, PerformanceChart, FitnessChatBot) para dentro da Área do Aluno (`StudentArea.tsx` ou `StudentDashboard.tsx`), preservando a funcionalidade via `useFitnessProgress`.
- Remover qualquer link/botão para `/fitness` (NavLink, header, dashboard).

## 7. Medidas corporais — sem entrada manual
- Remover `MeasurementsForm` e `SkinfoldForm` da Área do Aluno (rotas/abas que os expõem).
- Manter as tabelas `body_measurements` / `skinfold_measurements` (histórico antigo), mas **não inserir** mais por UI manual do aluno.
- Os dados de peso/medidas/fotos passam a vir exclusivamente de `anamnesis.payload` (baseline) e `check_ins.payload` (séries temporais).

## 8. Classificação automática Amador/Profissional
- Remover qualquer toggle/seletor manual desse status na UI.
- Derivar automaticamente a partir do payload da última anamnese + último check-in:
  - **Profissional** se a anamnese declarar uso/conhecimento de dobras cutâneas, frequência ≥5x/sem e objetivo competitivo, ou se um check-in trouxe `protocol_used` (skinfold).
  - **Amador** caso contrário.
- Implementar como helper puro `src/lib/userTier.ts` consumido pela Área do Aluno e pelo CoachDashboard.

## 9. Gráfico de Evolução conectado a anamnese + feedbacks
- Atualizar `EvolutionTimeline.tsx` e `ComparisonBoard.tsx` para ler de `useStudentData` (já feito) e derivar séries automaticamente:
  - Ponto inicial = `anamnesis.baseline_metrics` (peso, cintura, %gordura, etc.) com data `submitted_at`.
  - Demais pontos = cada `check_ins.current_metrics` ordenado por `submitted_at`.
  - Fotos: agregar `payload.photos[]` da anamnese + cada check-in (cronológico).
- Garantir reatividade via realtime (já configurado em `useStudentData`).
- Esconder a aba "Medidas" manual; manter apenas "Anamnese", "Check-in", "Evolução", "Protocolo".

## 10. Detalhes técnicos
- Sem mudança de schema (Supabase). Mudanças concentradas em frontend.
- Atualizar `App.tsx` para remover rota `/fitness`.
- Atualizar `mem://index.md` Core para refletir nova marca e remover menções a "Elite Athlete Hub" e "Painel Fitness".

## Arquivos previstos
- Editar: `index.html`, `src/App.tsx`, `src/pages/Index.tsx`, `src/pages/StudentArea.tsx`, `src/pages/StudentDashboard.tsx`, `src/pages/Evolution.tsx`, `src/pages/CoachDashboard.tsx`, `src/pages/Auth.tsx`, `src/components/student/EvolutionTimeline.tsx`, `src/components/student/ComparisonBoard.tsx`, `src/components/NavLink.tsx` (se houver link p/ fitness), `mem://index.md`.
- Criar: `src/lib/userTier.ts`.
- Excluir: `src/pages/Fitness.tsx`, `src/components/student/MeasurementsForm.tsx`, `src/components/student/SkinfoldForm.tsx` (se não usados em outro lugar — verificar antes).

Confirma para eu executar?