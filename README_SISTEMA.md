# 🏋️ Fitness Coach - Sistema de Treinos e Dietas Personalizados

Sistema completo para gestão de planos de treino e dieta individualizados para múltiplos alunos.

## 🎯 Funcionalidades

✅ **Sistema escalável baseado em JSON** - Um arquivo JSON por aluno  
✅ **Renderização 100% dinâmica** - Nenhum dado fixo no HTML  
✅ **Painel Admin** - Interface para criar novos alunos com facilidade  
✅ **Design Premium** - Fiel ao layout original (vermelho, preto e branco)  
✅ **Modo Claro/Escuro** - Toggle com persistência no localStorage  
✅ **Responsivo** - Funciona perfeitamente em mobile, tablet e desktop  
✅ **Animações suaves** - Fade, slide e scale para melhor UX  

---

## 📁 Estrutura do Projeto

```
/public
  /data
    alunos.json          → Lista de alunos cadastrados
    matheus.json         → Exemplo de dados de um aluno
    
/src
  /pages
    Index.tsx            → Página inicial com lista de alunos
    Student.tsx          → Página dinâmica do plano do aluno
    Admin.tsx            → Painel para criar novos alunos
    
  /components
    ThemeToggle.tsx      → Botão de alternar tema
    
  index.css              → Design system (cores, animações)
  tailwind.config.ts     → Configuração do Tailwind
```

---

## 🚀 Como Usar

### 1️⃣ Criar um Novo Aluno

1. Acesse a página inicial
2. Clique em **"Criar Novo Aluno"**
3. Preencha os dados:
   - Informações básicas (nome, idade, altura, peso, meta, calorias)
   - Refeições (título, tipo, ícone emoji, itens com quantidades)
   - Treinos (A, B, C, Perna, Complementares)
   - Observações importantes
4. Clique em **"Gerar JSON"**
5. O arquivo será baixado automaticamente

### 2️⃣ Adicionar o Aluno ao Sistema

Após baixar o JSON:

1. Coloque o arquivo na pasta **`public/data/`**
2. Edite o arquivo **`public/data/alunos.json`** e adicione uma entrada:

```json
{
  "id": "nome-do-arquivo-sem-extensao",
  "nome": "Nome Completo do Aluno",
  "descricao": "Breve descrição do objetivo",
  "dataInicio": "2024-01-15"
}
```

**Exemplo:**
```json
[
  {
    "id": "matheus",
    "nome": "Matheus Alvarenga Ferreira",
    "descricao": "Recomposição Corporal - Emagrecimento",
    "dataInicio": "2024-01-15"
  },
  {
    "id": "joao-silva",
    "nome": "João Silva",
    "descricao": "Hipertrofia Muscular",
    "dataInicio": "2024-02-01"
  }
]
```

3. Salve e atualize a página - o novo aluno aparecerá automaticamente!

---

## 📊 Estrutura do JSON do Aluno

```json
{
  "nome": "Nome Completo",
  "idade": 24,
  "altura": "1,84m",
  "pesoInicial": "135kg",
  "meta": "-30kg",
  "calorias": "2500",
  "refeicoes": {
    "1": {
      "titulo": "Refeição 1",
      "tipo": "Café da Manhã",
      "icon": "☕",
      "itens": [
        { "nome": "Ovo inteiro", "quantidade": "4 un", "opcional": false }
      ]
    }
  },
  "treinos": {
    "A": [
      {
        "exercicio": "Supino reto",
        "series": "4x8-10",
        "descanso": "90s",
        "observacao": "Foco na contração"
      }
    ]
  },
  "notas": [
    "🔄 Refeição livre a cada 14 dias",
    "💧 Ingerir no mínimo 3L de água por dia"
  ]
}
```

---

## 🎨 Personalização do Design

### Cores Principais
Definidas em **`src/index.css`**:
- `--primary`: Vermelho (#c81d1d)
- `--primary-dark`: Vermelho escuro (#a01515)
- `--primary-light`: Vermelho claro (#ff4444)

### Animações Disponíveis
- `.animate-fade-in-down` - Entrada de cima para baixo
- `.animate-fade-in-up` - Entrada de baixo para cima
- `.animate-slide-in` - Deslizamento lateral
- `.animate-scale-in` - Crescimento com fade
- `.card-hover` - Elevação no hover

---

## 🔧 Tecnologias Utilizadas

- **React 18** com TypeScript
- **Vite** para build ultra-rápido
- **Tailwind CSS** para estilização
- **shadcn/ui** para componentes base
- **React Router** para navegação
- **Lucide Icons** para ícones modernos
- **Sonner** para notificações toast

---

## 📱 Responsividade

O sistema se adapta automaticamente a todos os tamanhos de tela:
- **Mobile**: Layout em coluna única com cards empilhados
- **Tablet**: Grid 2 colunas para cards
- **Desktop**: Grid até 5 colunas para stats, 3 para cards

---

## ⚡ Performance

- **Zero dados fixos** no HTML
- **Lazy loading** de imagens
- **Animações otimizadas** com CSS
- **Fetch assíncrono** dos JSONs
- **Transições suaves** sem lag

---

## 🛠️ Manutenção

### Atualizar dados de um aluno
1. Edite o arquivo JSON correspondente em `public/data/`
2. Recarregue a página - mudanças são instantâneas

### Remover um aluno
1. Delete o arquivo JSON em `public/data/`
2. Remova a entrada correspondente em `alunos.json`

### Backup
Faça backup regular da pasta `public/data/` com todos os JSONs

---

## 🎯 Próximos Passos Sugeridos

- [ ] Integrar banco de dados (Supabase) para persistência
- [ ] Adicionar sistema de login para alunos
- [ ] Implementar edição inline de dados
- [ ] Criar gráficos de evolução de peso
- [ ] Adicionar upload de fotos de progresso
- [ ] Sistema de notificações para atualizações

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique se o JSON está formatado corretamente
2. Confirme que o `id` em `alunos.json` corresponde ao nome do arquivo
3. Use o console do navegador (F12) para ver erros

---

## 📄 Licença

Sistema desenvolvido para uso pessoal/profissional de personal trainers e nutricionistas.
