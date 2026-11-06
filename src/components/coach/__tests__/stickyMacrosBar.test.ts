/**
 * Contrato da barra "Macros do dia vs meta" fixa no topo da edição da dieta.
 *
 * O que quebrava: (1) `overflow-x: hidden` em html/body/#root cria contêiner de rolagem e desliga
 * position: sticky; (2) o cartão da refeição em foco (z-50) cobria a barra (z-10).
 * Verificado em Chromium real (barra a 65 px do topo, não coberta, lista TACO ainda por cima).
 * Aqui só travamos as peças de código para ninguém desfazer sem querer.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import dietTab from "@/components/coach/protocol-builder/DietTab.tsx?raw";
import dashboard from "@/pages/CoachDashboard.tsx?raw";

// CSS lido do disco (o Vitest não devolve o texto de .css em ?raw)
const indexCss = readFileSync(resolve(process.cwd(), "src/index.css"), "utf-8");

describe("barra de macros fixa (edição da dieta)", () => {
  it("CSS troca overflow-x hidden por clip quando a tela liga sticky-safe", () => {
    const rule = indexCss.match(/@supports \(overflow: clip\)\s*\{([\s\S]*?)\n\}/);
    expect(rule, "regra @supports (overflow: clip) ausente em index.css").toBeTruthy();
    expect(rule![1]).toContain("html.sticky-safe");
    expect(rule![1]).toContain("#root");
    expect(rule![1]).toMatch(/overflow-x:\s*clip/);
  });

  it("a tela de edição do coach liga o modo sticky-safe", () => {
    expect(dashboard).toMatch(/import \{ useStickySafe \} from "@\/hooks\/useStickySafe"/);
    expect(dashboard).toMatch(/useStickySafe\(view !== "list" && !!selectedStudent\)/);
  });

  it("a barra de macros continua sticky abaixo do cabeçalho", () => {
    expect(dietTab).toMatch(/sticky top-\[var\(--coach-header-h,0px\)\] z-10/);
  });

  it("o cartão da refeição em foco fica ABAIXO da barra (z-[9]) e isolado — nunca z-50", () => {
    expect(dietTab).toMatch(/overflow-visible relative isolate focus-within:z-\[9\]/);
    expect(dietTab).not.toMatch(/focus-within:z-50/);
  });
});
