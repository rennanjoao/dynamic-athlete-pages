import { sanitizeHTML, sanitizeInput } from './validation';

interface StudentData {
  nome: string;
  idade: string;
  altura: string;
  pesoInicial: string;
  meta: string;
  calorias: string;
  waterAmountLiters?: number;
  trainingType?: string;
  refeicoes: Record<string, {
    titulo: string;
    tipo: string;
    icon: string;
    itens: Array<{ nome: string; quantidade: string; opcional: boolean }>;
  }>;
  treinos: Record<string, Array<{
    exercicio: string;
    series: string;
    descanso: string;
    observacao: string;
  }>>;
  supplements?: Array<{
    id: string;
    nome: string;
    horario: string;
    refeicaoAssociada: string;
    relacao: "antes" | "depois" | "";
    observacao: string;
    essencial: boolean;
  }>;
  notas: string[];
}

// Sanitize all data before generating HTML
const sanitizeData = (data: StudentData): StudentData => {
  return {
    ...data,
    nome: sanitizeInput(data.nome, 100),
    idade: sanitizeInput(data.idade, 10),
    altura: sanitizeInput(data.altura, 20),
    pesoInicial: sanitizeInput(data.pesoInicial, 20),
    meta: sanitizeInput(data.meta, 50),
    calorias: sanitizeInput(data.calorias, 20),
    waterAmountLiters: data.waterAmountLiters,
    trainingType: data.trainingType ? sanitizeInput(data.trainingType, 20) : undefined,
    refeicoes: Object.fromEntries(
      Object.entries(data.refeicoes).map(([key, ref]) => [
        key,
        {
          titulo: sanitizeInput(ref.titulo, 100),
          tipo: sanitizeInput(ref.tipo, 100),
          icon: sanitizeInput(ref.icon, 10),
          itens: ref.itens.map(item => ({
            nome: sanitizeInput(item.nome, 200),
            quantidade: sanitizeInput(item.quantidade, 50),
            opcional: Boolean(item.opcional),
          })),
        },
      ])
    ),
    treinos: Object.fromEntries(
      Object.entries(data.treinos).map(([key, exercises]) => [
        key,
        exercises.map(ex => ({
          exercicio: sanitizeInput(ex.exercicio, 200),
          series: sanitizeInput(ex.series, 50),
          descanso: sanitizeInput(ex.descanso, 50),
          observacao: sanitizeInput(ex.observacao, 500),
        })),
      ])
    ),
    supplements: data.supplements?.map(supp => ({
      ...supp,
      nome: sanitizeInput(supp.nome, 200),
      horario: sanitizeInput(supp.horario, 10),
      observacao: sanitizeInput(supp.observacao, 500),
    })),
    notas: data.notas.map(nota => sanitizeInput(nota, 1000)),
  };
}

export const generateHTML = (inputData: StudentData): string => {
  const data = sanitizeData(inputData);
  const dataJSON = JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/'/g, '\\u0027');
  
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Plano - ${data.nome}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :root {
      --primary: #c81d1d;
      --primary-dark: #a01515;
      --primary-light: #ff4444;
    }

    [data-theme="dark"] {
      --bg: #0a0a0a;
      --surface: #1a1a1a;
      --surface-hover: #242424;
      --text: #ffffff;
      --text-secondary: #a0a0a0;
      --border: #2a2a2a;
      --shadow: rgba(0, 0, 0, 0.4);
    }

    [data-theme="light"] {
      --bg: #f5f5f5;
      --surface: #ffffff;
      --surface-hover: #f0f0f0;
      --text: #1a1a1a;
      --text-secondary: #666666;
      --border: #e0e0e0;
      --shadow: rgba(0, 0, 0, 0.1);
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      transition: background 0.3s ease, color 0.3s ease;
    }

    .header {
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
      padding: 3rem 2rem;
      text-align: center;
      box-shadow: 0 4px 20px rgba(200, 29, 29, 0.3);
      position: relative;
      color: white;
    }

    .theme-toggle {
      position: fixed;
      top: 2rem;
      right: 2rem;
      background: rgba(255, 255, 255, 0.2);
      border: none;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
      z-index: 1000;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .theme-toggle:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: rotate(180deg) scale(1.1);
    }

    .header h1 {
      font-size: 2.8rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
      animation: fadeInDown 0.6s ease;
    }

    .header p {
      font-size: 1.2rem;
      opacity: 0.95;
      animation: fadeInUp 0.6s ease;
    }

    @keyframes fadeInDown {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(-20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes scaleIn {
      from {
        opacity: 0;
        transform: scale(0.9);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 2rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin: -3rem auto 0;
      position: relative;
      z-index: 10;
      padding: 0 2rem;
      max-width: 1400px;
    }

    .stat-card {
      background: var(--surface);
      padding: 2rem 1.5rem;
      border-radius: 16px;
      border: 1px solid var(--border);
      text-align: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 12px var(--shadow);
      animation: scaleIn 0.4s ease forwards;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px var(--shadow);
      border-color: var(--primary);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      margin: 0 auto 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      border-radius: 12px;
      font-size: 1.5rem;
    }

    .stat-label {
      font-size: 0.9rem;
      color: var(--text-secondary);
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 500;
    }

    .stat-value {
      font-size: 1.8rem;
      font-weight: 700;
      color: var(--text);
    }

    .section {
      margin: 4rem auto;
      max-width: 1400px;
      padding: 0 2rem;
    }

    .section-title {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 2rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      animation: slideIn 0.5s ease;
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
    }

    .card {
      background: var(--surface);
      border-radius: 16px;
      padding: 2rem;
      border: 1px solid var(--border);
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px var(--shadow);
      animation: scaleIn 0.4s ease forwards;
    }

    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px var(--shadow);
      border-color: var(--primary);
    }

    .meal-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid var(--border);
    }

    .meal-icon {
      font-size: 3rem;
    }

    .meal-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }

    .meal-type {
      font-size: 0.9rem;
      color: var(--text-secondary);
    }

    .meal-items {
      list-style: none;
    }

    .meal-item {
      display: flex;
      align-items: start;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
      padding: 0.5rem;
      border-radius: 8px;
      transition: background 0.2s;
    }

    .meal-item:hover {
      background: var(--surface-hover);
    }

    .meal-item-bullet {
      color: var(--primary);
      font-weight: 700;
      font-size: 1.2rem;
      min-width: 8px;
    }

    .meal-item-content {
      flex: 1;
    }

    .meal-item-name {
      font-weight: 500;
    }

    .meal-item-name.optional {
      color: var(--text-secondary);
    }

    .meal-item-qty {
      color: var(--text-secondary);
      font-size: 0.9rem;
      margin-left: 0.5rem;
    }

    .optional-badge {
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-left: 0.5rem;
      font-style: italic;
    }

    .workout-card {
      background: var(--surface);
      border-radius: 16px;
      padding: 2rem;
      border: 1px solid var(--border);
      margin-bottom: 2rem;
      box-shadow: 0 4px 12px var(--shadow);
      animation: scaleIn 0.4s ease forwards;
      transition: all 0.3s ease;
    }

    .workout-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px var(--shadow);
      border-color: var(--primary);
    }

    .workout-title {
      font-size: 1.8rem;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 1.5rem;
    }

    .workout-table {
      width: 100%;
      border-collapse: collapse;
      overflow-x: auto;
      display: block;
    }

    .workout-table thead {
      border-bottom: 2px solid var(--border);
    }

    .workout-table th {
      text-align: left;
      padding: 1rem 0.75rem;
      font-weight: 600;
      color: var(--text);
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .workout-table tbody {
      display: table;
      width: 100%;
    }

    .workout-table tr {
      border-bottom: 1px solid var(--border);
      transition: background 0.2s;
    }

    .workout-table tr:hover {
      background: var(--surface-hover);
    }

    .workout-table tr:last-child {
      border-bottom: none;
    }

    .workout-table td {
      padding: 1rem 0.75rem;
      vertical-align: top;
    }

    .workout-table td:nth-child(2) {
      color: var(--primary);
      font-weight: 600;
    }

    .workout-table td:nth-child(3),
    .workout-table td:nth-child(4) {
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .notes-list {
      list-style: none;
    }

    .notes-item {
      display: flex;
      align-items: start;
      gap: 1rem;
      margin-bottom: 1rem;
      padding: 1rem;
      background: var(--surface-hover);
      border-radius: 12px;
      border-left: 4px solid var(--primary);
    }

    .notes-icon {
      font-size: 1.5rem;
      min-width: 24px;
    }

    .notes-text {
      flex: 1;
      line-height: 1.6;
    }

    .supplement-item {
      display: flex;
      align-items: start;
      gap: 1rem;
      margin-bottom: 1rem;
      padding: 1rem;
      background: var(--surface-hover);
      border-radius: 12px;
      border-left: 4px solid var(--primary);
    }

    .supplement-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      background: var(--primary);
      color: white;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-left: 0.5rem;
    }

    .supplement-time {
      font-weight: 600;
      color: var(--primary);
      min-width: 60px;
    }

    .supplement-content {
      flex: 1;
    }

    .supplement-name {
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .supplement-meal {
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin-bottom: 0.25rem;
    }

    .supplement-obs {
      font-size: 0.85rem;
      color: var(--text-secondary);
      font-style: italic;
    }

    .water-jug-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 16px;
      max-width: 160px;
      margin: 0 auto;
    }

    .water-jug-svg {
      width: 100%;
      height: auto;
      max-width: 128px;
    }

    .water-fill {
      transition: all 1s ease-out;
    }

    @media (prefers-reduced-motion: reduce) {
      .water-fill {
        transition: none;
      }
    }

    .water-info {
      text-align: center;
    }

    .water-amount {
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--text);
    }

    .water-percentage {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    @media (max-width: 768px) {
      .header h1 {
        font-size: 2rem;
      }

      .header p {
        font-size: 1rem;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        margin-top: -2rem;
      }

      .section-title {
        font-size: 1.5rem;
      }

      .cards-grid {
        grid-template-columns: 1fr;
      }

      .workout-table {
        font-size: 0.85rem;
      }

      .workout-table th,
      .workout-table td {
        padding: 0.75rem 0.5rem;
      }
    }

    @media print {
      .theme-toggle {
        display: none;
      }

      .card,
      .workout-card {
        page-break-inside: avoid;
        box-shadow: none;
        border: 1px solid #ddd;
      }

      .section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body data-theme="light">
  <button class="theme-toggle" onclick="toggleTheme()" aria-label="Alternar tema">
    <span class="theme-icon">☀️</span>
  </button>

  <header class="header">
    <h1>${data.nome}</h1>
    <p>Plano de Recomposição Corporal</p>
  </header>

  <div class="stats-grid">
    <div class="stat-card" style="animation-delay: 0s;">
      <div class="stat-icon">👤</div>
      <div class="stat-label">Idade</div>
      <div class="stat-value">${data.idade} anos</div>
    </div>
    <div class="stat-card" style="animation-delay: 0.1s;">
      <div class="stat-icon">📏</div>
      <div class="stat-label">Altura</div>
      <div class="stat-value">${data.altura}</div>
    </div>
    <div class="stat-card" style="animation-delay: 0.2s;">
      <div class="stat-icon">⚖️</div>
      <div class="stat-label">Peso Inicial</div>
      <div class="stat-value">${data.pesoInicial}</div>
    </div>
    <div class="stat-card" style="animation-delay: 0.3s;">
      <div class="stat-icon">🎯</div>
      <div class="stat-label">Meta</div>
      <div class="stat-value">${data.meta}</div>
    </div>
    <div class="stat-card" style="animation-delay: 0.4s;">
      <div class="stat-icon">🔥</div>
      <div class="stat-label">Calorias/dia</div>
      <div class="stat-value">${data.calorias}</div>
    </div>
    ${data.waterAmountLiters !== undefined ? `
    <div class="stat-card" style="animation-delay: 0.5s;">
      <div class="water-jug-container">
        <svg viewBox="0 0 100 150" class="water-jug-svg" role="img" aria-label="Galão de água com ${data.waterAmountLiters.toFixed(1)} litros">
          <title>Galão de água de 10 litros</title>
          <desc>Indicador visual mostrando ${data.waterAmountLiters.toFixed(1)} litros de 10 litros</desc>
          <path d="M 30 20 L 30 10 L 70 10 L 70 20 L 75 20 L 75 145 L 25 145 L 25 20 Z" fill="none" stroke="currentColor" stroke-width="2" opacity="0.6"/>
          <path d="M 75 40 Q 85 50 85 65 Q 85 80 75 90" fill="none" stroke="currentColor" stroke-width="2" opacity="0.6"/>
          <rect x="27" y="${145 - (Math.min(data.waterAmountLiters / 10, 1) * 125)}" width="46" height="${Math.min(data.waterAmountLiters / 10, 1) * 125}" class="water-fill" fill="var(--primary)" opacity="0.6"/>
          ${[0, 2, 4, 6, 8, 10].map(mark => `
            <line x1="20" y1="${145 - (mark / 10) * 125}" x2="25" y2="${145 - (mark / 10) * 125}" stroke="currentColor" stroke-width="1" opacity="0.4"/>
            <text x="15" y="${145 - (mark / 10) * 125 + 3}" font-size="8" text-anchor="end" fill="currentColor" opacity="0.6">${mark}</text>
          `).join('')}
        </svg>
        <div class="water-info">
          <p class="water-amount">${data.waterAmountLiters.toFixed(1)} L</p>
          <p class="water-percentage">${(Math.min(data.waterAmountLiters / 10, 1) * 100).toFixed(0)}% de 10 L</p>
        </div>
      </div>
    </div>
    ` : ''}
  </div>

  <section class="section">
    <h2 class="section-title">📋 Plano Alimentar</h2>
    <div class="cards-grid">
      ${Object.entries(data.refeicoes).map(([key, refeicao], idx) => `
        <div class="card" style="animation-delay: ${idx * 0.1}s;">
          <div class="meal-header">
            <div class="meal-icon">${refeicao.icon}</div>
            <div>
              <div class="meal-title">${refeicao.titulo}</div>
              <div class="meal-type">${refeicao.tipo}</div>
            </div>
          </div>
          <ul class="meal-items">
            ${refeicao.itens.map(item => `
              <li class="meal-item">
                <span class="meal-item-bullet">•</span>
                <div class="meal-item-content">
                  <span class="meal-item-name ${item.opcional ? 'optional' : ''}">
                    ${item.nome}
                  </span>
                  <span class="meal-item-qty">${item.quantidade}</span>
                  ${item.opcional ? '<span class="optional-badge">(opcional)</span>' : ''}
                </div>
              </li>
            `).join('')}
          </ul>
        </div>
      `).join('')}
    </div>
  </section>

  <section class="section">
    <h2 class="section-title">💪 Treinos</h2>
    ${Object.entries(data.treinos).map(([key, exercicios], idx) => `
      <div class="workout-card" style="animation-delay: ${idx * 0.1}s;">
        <h3 class="workout-title">Treino ${key}</h3>
        <table class="workout-table">
          <thead>
            <tr>
              <th>Exercício</th>
              <th>Séries</th>
              <th>Descanso</th>
              <th>Observação</th>
            </tr>
          </thead>
          <tbody>
            ${exercicios.map(ex => `
              <tr>
                <td>${ex.exercicio}</td>
                <td>${ex.series}</td>
                <td>${ex.descanso}</td>
                <td>${ex.observacao || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `).join('')}
  </section>

  ${data.supplements && data.supplements.length > 0 ? `
  <section class="section">
    <h2 class="section-title">💊 Suplementos e Vitaminas</h2>
    <div class="card">
      <ul class="notes-list">
        ${data.supplements
          .sort((a, b) => a.horario.localeCompare(b.horario))
          .map(supp => {
            const mealMap: Record<string, string> = {
              'nenhuma': 'Sem associação',
              'cafe': 'Café da manhã',
              'lanche-manha': 'Lanche (manhã)',
              'almoco': 'Almoço',
              'lanche-tarde': 'Lanche (tarde)',
              'jantar': 'Jantar',
              'ceia': 'Ceia',
              'outra': 'Outra'
            };
            const mealText = mealMap[supp.refeicaoAssociada] || 'Sem associação';
            const relacaoText = supp.relacao ? ` (${supp.relacao})` : '';
            
            return `
              <li class="supplement-item">
                <span class="supplement-time">${supp.horario}</span>
                <div class="supplement-content">
                  <div class="supplement-name">
                    ${supp.nome}
                    ${supp.essencial ? '<span class="supplement-badge">ESSENCIAL</span>' : ''}
                  </div>
                  ${supp.refeicaoAssociada !== 'nenhuma' ? 
                    `<div class="supplement-meal">${mealText}${relacaoText}</div>` : 
                    ''
                  }
                  ${supp.observacao ? `<div class="supplement-obs">${supp.observacao}</div>` : ''}
                </div>
              </li>
            `;
          }).join('')}
      </ul>
    </div>
  </section>
  ` : ''}

  <section class="section">
    <h2 class="section-title">📝 Observações Importantes</h2>
    <div class="card">
      <ul class="notes-list">
        ${data.notas.map(nota => {
          const parts = nota.split(' ');
          const icon = parts[0];
          const text = parts.slice(1).join(' ');
          return `
            <li class="notes-item">
              <span class="notes-icon">${icon}</span>
              <span class="notes-text">${text}</span>
            </li>
          `;
        }).join('')}
      </ul>
    </div>
  </section>

  <script>
    // Store original data for reference
    const originalData = ${dataJSON};
    let planData = JSON.parse(JSON.stringify(originalData));
    
    // Version control
    let history = [];
    let historyIndex = -1;
    const MAX_HISTORY = 50;

    function saveState() {
      // Remove future states if we're not at the end
      if (historyIndex < history.length - 1) {
        history = history.slice(0, historyIndex + 1);
      }
      
      // Add current state
      history.push(JSON.parse(JSON.stringify(planData)));
      
      // Limit history size
      if (history.length > MAX_HISTORY) {
        history.shift();
      } else {
        historyIndex++;
      }
      
      // Save to localStorage
      try {
        localStorage.setItem('planData_${data.nome.replace(/[^a-zA-Z0-9]/g, '_')}', JSON.stringify(planData));
        localStorage.setItem('planHistory_${data.nome.replace(/[^a-zA-Z0-9]/g, '_')}', JSON.stringify(history));
      } catch (e) {
        console.warn('Could not save to localStorage:', e);
      }
    }

    function undo() {
      if (historyIndex > 0) {
        historyIndex--;
        planData = JSON.parse(JSON.stringify(history[historyIndex]));
        renderPlan();
        showToast('Alteração desfeita');
      }
    }

    function redo() {
      if (historyIndex < history.length - 1) {
        historyIndex++;
        planData = JSON.parse(JSON.stringify(history[historyIndex]));
        renderPlan();
        showToast('Alteração refeita');
      }
    }

    function showToast(message) {
      const toast = document.createElement('div');
      toast.style.cssText = 'position: fixed; bottom: 2rem; right: 2rem; background: var(--primary); color: white; padding: 1rem 1.5rem; border-radius: 8px; box-shadow: 0 4px 12px var(--shadow); z-index: 10000; animation: slideIn 0.3s ease;';
      toast.textContent = message;
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }

    function renderPlan() {
      // This would re-render the entire plan - for now, just reload
      location.reload();
    }

    // Initialize
    saveState();

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    });

    function toggleTheme() {
      const body = document.body;
      const currentTheme = body.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      body.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme_${data.nome.replace(/[^a-zA-Z0-9]/g, '_')}', newTheme);
      
      const icon = document.querySelector('.theme-icon');
      icon.textContent = newTheme === 'light' ? '☀️' : '🌙';
    }

    // Load saved theme
    window.addEventListener('DOMContentLoaded', () => {
      const savedTheme = localStorage.getItem('theme_${data.nome.replace(/[^a-zA-Z0-9]/g, '_')}') || 'light';
      document.body.setAttribute('data-theme', savedTheme);
      const icon = document.querySelector('.theme-icon');
      icon.textContent = savedTheme === 'light' ? '☀️' : '🌙';

      // Try to load saved data
      try {
        const saved = localStorage.getItem('planData_${data.nome.replace(/[^a-zA-Z0-9]/g, '_')}');
        const savedHistory = localStorage.getItem('planHistory_${data.nome.replace(/[^a-zA-Z0-9]/g, '_')}');
        
        if (saved) {
          planData = JSON.parse(saved);
        }
        
        if (savedHistory) {
          history = JSON.parse(savedHistory);
          historyIndex = history.length - 1;
        }
      } catch (e) {
        console.warn('Could not load from localStorage:', e);
      }
    });

    // Export data function
    function exportData() {
      const dataStr = JSON.stringify(planData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'plano-${data.nome.toLowerCase().replace(/\\s+/g, '-')}-data.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Dados exportados com sucesso!');
    }

    // Import data function
    function importData() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const imported = JSON.parse(e.target.result);
            planData = imported;
            saveState();
            renderPlan();
            showToast('Dados importados com sucesso!');
          } catch (err) {
            showToast('Erro ao importar dados: arquivo inválido');
          }
        };
        reader.readAsText(file);
      };
      input.click();
    }

    // Add control buttons
    window.addEventListener('DOMContentLoaded', () => {
      const controls = document.createElement('div');
      controls.style.cssText = 'position: fixed; bottom: 2rem; left: 2rem; display: flex; gap: 0.5rem; z-index: 1000;';
      controls.innerHTML = \`
        <button onclick="undo()" style="padding: 0.75rem 1rem; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; cursor: pointer; color: var(--text); font-weight: 600; transition: all 0.3s;" title="Desfazer (Ctrl+Z)">↶ Desfazer</button>
        <button onclick="redo()" style="padding: 0.75rem 1rem; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; cursor: pointer; color: var(--text); font-weight: 600; transition: all 0.3s;" title="Refazer (Ctrl+Y)">↷ Refazer</button>
        <button onclick="exportData()" style="padding: 0.75rem 1rem; background: var(--primary); border: none; border-radius: 8px; cursor: pointer; color: white; font-weight: 600; transition: all 0.3s;">💾 Exportar</button>
        <button onclick="importData()" style="padding: 0.75rem 1rem; background: var(--primary); border: none; border-radius: 8px; cursor: pointer; color: white; font-weight: 600; transition: all 0.3s;">📂 Importar</button>
      \`;
      document.body.appendChild(controls);
    });
  </script>
</body>
</html>`;
};
