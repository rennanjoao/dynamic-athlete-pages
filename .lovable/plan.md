
Baseado no HTML do Leandro, vou expandir o sistema de protocolo do Elite Lab Hub com import/export Excel, refeições estruturadas (2 opções + substituições por macro) e ferramentas do aluno (TACO, FODMAP, Proteínas).

## 1. Esboço em Excel (coach)

`ProtocolImportExport.tsx` ganha dois novos botões além do JSON:

- **Baixar esboço (.xlsx)** — gera planilha com abas:
  - `Setup` (split, refeições, ciclo de carbo on/off)
  - `Macros` (base / alto +15% / baixo −15% calculados por fórmula)
  - `Treinos` (uma aba por dia do split, colunas: exercício, séries, reps, cadência, descanso, obs)
  - `Refeições` (linhas com: nome, hora, macros C/P/G, Opção 1, Opção 2, Sub C 1, Sub C 2, Sub P 1, Sub P 2, Sub G 1, Sub G 2, observações)
  - `Ciclo de Carbo` (Seg–Dom → alto / base / off)
  - `Diretrizes` (treino, dieta, semana, suplementação)
- **Importar (.xlsx)** — lê as mesmas abas e converte de volta no `ProtocolPayload`.

Usa biblioteca `xlsx` (SheetJS) no client. Mantém os botões JSON existentes.

## 2. Schema do protocolo (estendido)

`src/lib/protocolSchema.ts`:

```
MealMacrosSchema  { c, p, g }              // gramas por macro
MealOptionSchema  { title, items }         // prato
MealSubsSchema    { carb: [s1, s2], protein: [s1, s2], fat: [s1, s2] }
MealSchema (novo)
  name, time, macros: MealMacrosSchema,
  options: [opt1, opt2],
  substitutions: MealSubsSchema,
  notes
```

Regra de UI: cada bloco de substituição só aparece se o macro correspondente em `macros` > 0.

Mantém retrocompatibilidade (`qtyHighCarb`, `qtyLowCarb`, `foods` continuam opcionais para protocolos antigos).

## 3. Ciclo de carbo: Base / Alto / Off

- `CarbCycleSelector` passa a aceitar `"base" | "high" | "off"` (renomeio de `low` → `off`).
- `coach_plans.diet_strategy_json` armazena multiplicadores: alto = +15%, off = −15%, base = 1.0.
- Visualização da dieta no aluno mostra os macros recalculados conforme o modo selecionado.

## 4. ProtocolBuilder (coach) — editor da refeição

Para cada refeição:
- Campos: Nome, Hora, Macros (C/P/G em g)
- Subseção "Opção 1" e "Opção 2" (título + alimentos)
- Subseções "Substituição de Carbo / Proteína / Gordura" — só renderiza quando `macros.X > 0`
- Cada substituição: 2 inputs ("Substituição 1" e "Substituição 2")

## 5. ProtocolViewer / DynamicRoutine (aluno)

Reescreve o render da refeição para mostrar:
- 2 opções de prato (cards)
- Substituições condicionais por macro
- Quantidades recalculadas pelo modo de carbo ativo
- Botões fixos no topo da página de dieta:
  - 🥬 **FODMAPs** (modal)
  - 🥩 **Proteínas & Lipídios** (modal com tabela TACO resumida)
  - 🧮 **Calculadora TACO+** (modal)

## 6. Ferramentas do aluno

Novos componentes em `src/components/student/tools/`:
- `FoodmapsDialog.tsx` — listas Seguros / Moderar / Restringir (do HTML)
- `ProteinGuideDialog.tsx` — fontes + tabela TACO de referência
- `TacoCalculatorDialog.tsx` — entrada de alimentos com sugestões + cálculo por kcal/proteína/carb/gordura usando dataset TACO local

Dataset: `src/data/tacoFoods.ts` — array compacto (~80 alimentos comuns: arroz, batata-doce, aveia, frango, patinho, ovo, etc.) com `{ name, kcal, p, c, g }` por 100 g.

## 7. Build & QA

- `bun add xlsx`
- Testar: gerar .xlsx, abrir no Excel, editar uma refeição, reimportar — payload preserva opções e substituições.
- Migração de protocolos antigos: loader converte `qtyHighCarb/qtyLowCarb/foods` em `options[0]` automaticamente.

## Arquivos

Novos:
- `src/lib/protocolXlsx.ts` (export/import xlsx)
- `src/data/tacoFoods.ts`
- `src/components/student/tools/FoodmapsDialog.tsx`
- `src/components/student/tools/ProteinGuideDialog.tsx`
- `src/components/student/tools/TacoCalculatorDialog.tsx`
- `src/components/student/StudentToolbar.tsx`

Editados:
- `src/lib/protocolSchema.ts` (MealSchema expandida + back-compat)
- `src/components/coach/ProtocolImportExport.tsx` (botões xlsx)
- `src/components/coach/ProtocolBuilder.tsx` (editor de refeição novo)
- `src/components/student/CarbCycleSelector.tsx` (base/high/off)
- `src/pages/DynamicRoutine.tsx` + `src/components/student/ProtocolViewer.tsx` (render novo + toolbar)

Confirma para eu seguir?
