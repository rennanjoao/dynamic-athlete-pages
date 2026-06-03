import { useState } from "react";
import { ProtocolPayloadSchema } from "@/lib/protocolSchema";

// Micro-CSS injetado: Replica o comportamento do HTML original (toggle de classes)
const HTML_LIKE_CSS = `
  .t-tabs { display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: nowrap; overflow-x: auto; padding-bottom: 5px; }
  .t-tab {
    background: var(--surface, #1a1a1a); border: 2px solid var(--border, #2a2a2a); color: var(--text, #ffffff);
    padding: 1rem 2rem; border-radius: 12px; cursor: pointer; transition: all 0.3s ease;
    font-size: 1rem; font-weight: 600; white-space: nowrap; flex-shrink: 0;
  }
  .t-tab.active { background: var(--primary, #c81d1d); border-color: var(--primary, #c81d1d); color: white; box-shadow: 0 4px 12px rgba(200, 29, 29, 0.4); }

  .t-card { background: var(--surface, #1a1a1a); border: 1px solid var(--border, #2a2a2a); border-radius: 16px; padding: 2rem; margin-bottom: 1.5rem; }
  
  .t-meal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 2px solid var(--border, #2a2a2a); flex-wrap: wrap; gap: 1rem;}
  .t-meal-title { font-size: 1.75rem; font-weight: 700; }
  
  .t-meal-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; }
  .t-act-btn {
    background: transparent; border: 1px solid var(--border, #2a2a2a); color: var(--text-secondary, #a0a0a0);
    font-size: 0.8rem; padding: 8px 16px; border-radius: 8px; cursor: pointer; transition: all 0.2s; font-weight: 600;
  }
  .t-act-btn:hover { border-color: var(--primary, #c81d1d); color: var(--text, #ffffff); }
  .t-act-btn.active { background: var(--primary, #c81d1d); color: white; border-color: var(--primary, #c81d1d); }
  .t-act-btn.alto.active { background: #2ecc71; border-color: #2ecc71; color: #fff; }
  .t-act-btn.baixo.active { background: #f1c40f; border-color: #f1c40f; color: #111; }

  /* Lógica de Visibilidade: Cru/Pronto */
  .t-meal-content .peso-pronto { display: none; }
  .t-meal-content.show-pronto .peso-pronto { display: inline; color: #e67e22; font-weight: 700; }
  .t-meal-content.show-pronto .peso-cru { display: none; }
  .t-meal-content .peso-cru { font-weight: 700; color: var(--primary-light, #ff4444); }
  
  /* Lógica de Visibilidade: Ciclagem (Alto, Base, Baixo) */
  .t-meal-content .val-carbo-high,
  .t-meal-content .val-carbo-low { display: none; }
  
  .t-meal-content.show-high .val-carbo-base { display: none; }
  .t-meal-content.show-high .val-carbo-high { display: inline; color: #2ecc71; font-weight: 700; }
  
  .t-meal-content.show-low .val-carbo-base { display: none; }
  .t-meal-content.show-low .val-carbo-low { display: inline; color: #f1c40f; font-weight: 700; }

  .t-food-list { list-style: none; display: flex; flex-direction: column; gap: 1rem; padding-left: 0; }
  .t-food-item { padding: 1.5rem; background: rgba(0,0,0,0.2); border-radius: 12px; display: flex; flex-direction: column; gap: 1rem; border: 1px solid transparent; }
  .t-food-item-header { display: flex; align-items: flex-start; gap: 1.5rem; }
  .t-food-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0; background: var(--primary, #c81d1d); }
  
  .t-base-label { display: inline-block; background: var(--surface-hover, #242424); padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 700; border: 1px solid var(--border, #2a2a2a); margin-bottom: 5px;}
  .t-nested-options { list-style: none; padding-left: 0; margin-top: 0.5rem; }
  .t-nested-options li { position: relative; padding-left: 1.5rem; margin-bottom: 0.8rem; line-height: 1.5; color: var(--text-secondary, #a0a0a0); }
  .t-nested-options li::before { content: '👉'; position: absolute; left: 0; top: 0; font-size: 0.9rem; }
  .t-nested-options strong { color: var(--text, #ffffff); }
`;

export default function StructuredMealsViewer({ payload }: { payload: any }) {
  const parsed = ProtocolPayloadSchema.safeParse(payload);
  const safeData = parsed.success ? parsed.data : (payload || {});
  const meals = Array.isArray(safeData.meals) ? safeData.meals : [];
  
  const [activeTab, setActiveTab] = useState(0);

  if (meals.length === 0) return null;

  return (
    <div style={{ width: "100%" }}>
      <style>{HTML_LIKE_CSS}</style>

      {/* Menu de Abas */}
      <div className="t-tabs">
        {meals.map((meal: any, idx: number) => (
          <button
            key={idx}
            className={`t-tab ${activeTab === idx ? "active" : ""}`}
            onClick={() => setActiveTab(idx)}
          >
            {meal.name || `Refeição ${idx + 1}`}
          </button>
        ))}
      </div>

      {/* Conteúdo da Aba Ativa */}
      {meals.map((meal: any, idx: number) => (
        <div key={idx} style={{ display: activeTab === idx ? "block" : "none" }}>
          <MealCardHtml meal={meal} />
        </div>
      ))}
    </div>
  );
}

function MealCardHtml({ meal }: { meal: any }) {
  const [mode, setMode] = useState<"base" | "alto" | "baixo">("base");
  const [isCooked, setIsCooked] = useState(false);

  const containerClass = `t-meal-content ${isCooked ? "show-pronto" : ""} show-${mode === "alto" ? "high" : mode === "baixo" ? "low" : "base"}`;

  const validOptions = (meal.options || []).filter((opt: any) => opt?.items && opt.items.trim() !== "");
  const subs = meal.substitutions || { carb: [], protein: [], fat: [] };
  const hasSubs = [...(subs.carb||[]), ...(subs.protein||[]), ...(subs.fat||[])].some(s => s && s.trim());

  return (
    <div className="t-card">
      <div className="t-meal-header">
        <h3 className="t-meal-title">{meal.name || "Refeição"} {meal.time && `— ${meal.time}`}</h3>
        
        {/* Botões do Painel (Cru/Pronto e Ciclo) */}
        <div className="t-meal-actions">
          <button 
            className="t-act-btn" 
            onClick={() => setIsCooked(!isCooked)}
          >
            {isCooked ? "⚖️ Mostrar Cru" : "⚖️ Cru/Pronto"}
          </button>
          
          <button 
            className={`t-act-btn ${mode === "base" ? "active" : ""}`} 
            onClick={() => setMode("base")}
          >
            ⏺️ Base
          </button>
          <button 
            className={`t-act-btn alto ${mode === "alto" ? "active" : ""}`} 
            onClick={() => setMode("alto")}
          >
            ⬆️ Alto
          </button>
          <button 
            className={`t-act-btn baixo ${mode === "baixo" ? "active" : ""}`} 
            onClick={() => setMode("baixo")}
          >
            ⬇️ Baixo
          </button>
        </div>
      </div>

      {/* Corpo da Refeição (Opções) */}
      <div className={containerClass}>
        <ul className="t-food-list">
          
          {/* Opções Principais */}
          {validOptions.length > 0 && (
            <li className="t-food-item">
              <div className="t-food-item-header">
                <div className="t-food-icon">🍽️</div>
                <div style={{ width: "100%" }}>
                  <span className="t-base-label">OPÇÕES MONTADAS</span>
                  <ul className="t-nested-options">
                    {validOptions.map((opt: any, idx: number) => (
                      <li key={idx}>
                        <strong>{opt.title || `Opção ${idx + 1}`}:</strong><br />
                        {/* Renderiza o HTML das tags <span class="peso-cru"> que vêm do banco */}
                        <span dangerouslySetInnerHTML={{ __html: opt.items }} />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          )}

          {/* Fallback caso não venha tags HTML, usar campos qtyHighCarb/qtyLowCarb/cookedNotes */}
          {((mode === "alto" && meal.qtyHighCarb) || (mode === "baixo" && meal.qtyLowCarb) || (isCooked && meal.cookedNotes)) && (
            <li className="t-food-item">
              <div className="t-food-item-header">
                <div className="t-food-icon" style={{ background: "transparent", border: "1px dashed #ccc" }}>⚠️</div>
                <div style={{ width: "100%" }}>
                   <span className="t-base-label">AJUSTES DE PESO E CARBOIDRATO</span>
                   <ul className="t-nested-options">
                      {mode === "alto" && meal.qtyHighCarb && <li><strong style={{color:"#2ecc71"}}>⬆️ Carga Alta (+15%):</strong> {meal.qtyHighCarb}</li>}
                      {mode === "baixo" && meal.qtyLowCarb && <li><strong style={{color:"#f1c40f"}}>⬇️ Carga Baixa (-15%):</strong> {meal.qtyLowCarb}</li>}
                      {isCooked && meal.cookedNotes && <li><strong style={{color:"#e67e22"}}>⚖️ Peso Pronto (Cozido):</strong> {meal.cookedNotes}</li>}
                   </ul>
                </div>
              </div>
            </li>
          )}

          {/* Substituições Gerais */}
          {hasSubs && (
            <li className="t-food-item">
              <div className="t-food-item-header">
                <div className="t-food-icon" style={{ background: "#3498db" }}>🔄</div>
                <div style={{ width: "100%" }}>
                  <span className="t-base-label">OPÇÕES DE SUBSTITUIÇÃO LIVRE</span>
                  <ul className="t-nested-options">
                    {subs.carb.filter((s: string) => s.trim()).map((s: string, idx: number) => <li key={`c-${idx}`}><strong>Carbo:</strong> {s}</li>)}
                    {subs.protein.filter((s: string) => s.trim()).map((s: string, idx: number) => <li key={`p-${idx}`}><strong>Proteína:</strong> {s}</li>)}
                    {subs.fat.filter((s: string) => s.trim()).map((s: string, idx: number) => <li key={`f-${idx}`}><strong>Gordura:</strong> {s}</li>)}
                  </ul>
                </div>
              </div>
            </li>
          )}

        </ul>
        
        {meal.notes && (
          <p style={{ marginTop: "1.5rem", paddingLeft: "1rem", borderLeft: "4px solid var(--primary)", fontStyle: "italic", color: "var(--text-secondary)"}}>
            {meal.notes}
          </p>
        )}
      </div>
    </div>
  );
}
