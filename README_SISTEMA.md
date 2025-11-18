# 🏋️ Fitness Coach - Sistema de Treinos e Dietas Personalizados

Sistema completo para gestão de planos de treino e dieta individualizados. Gera **páginas HTML standalone** que funcionam em qualquer navegador, sem instalação!

## 🎯 Funcionalidades

✅ **Gera HTML standalone** - Arquivo completo que funciona offline  
✅ **Zero instalação** - Basta abrir no navegador (Chrome, Firefox, Safari, Edge)  
✅ **Painel Admin** - Interface visual para criar planos facilmente  
✅ **Design Premium** - Visual profissional vermelho/preto/branco  
✅ **Modo Claro/Escuro** - Toggle com persistência automática  
✅ **Responsivo** - Funciona em mobile, tablet e desktop  
✅ **Pronto para impressão** - Layout otimizado para PDF  

---

## 📁 Como Funciona

O sistema tem duas partes:

### 1️⃣ Painel Admin (Web App React)
- Interface para criar planos
- Preenche dados do aluno
- Clica em "Gerar HTML"
- Baixa arquivo pronto

### 2️⃣ HTML Gerado (Standalone)
- Arquivo único com tudo embutido
- CSS e JavaScript inline
- Funciona offline
- Pode ser enviado por email/WhatsApp
- Cliente abre direto no navegador

---

## 🚀 Como Usar

### Criar um Novo Plano

1. Acesse o painel admin
2. Preencha:
   - **Dados básicos**: Nome, idade, altura, peso, meta, calorias
   - **Refeições**: Título, tipo, emoji, itens (nome, quantidade, opcional)
   - **Treinos**: A, B, C, etc. (exercício, séries, descanso, observação)
   - **Observações**: Notas importantes (use emoji no início)

3. Clique em **"Gerar HTML"**

4. Arquivo será baixado automaticamente (exemplo: `plano-matheus-ferreira.html`)

5. **Envie para o aluno**:
   - Por email
   - Por WhatsApp
   - Por Google Drive/Dropbox
   - Qualquer método de compartilhamento

6. **Aluno abre** diretamente no navegador
   - Sem instalação
   - Sem login
   - Funciona offline
   - Pode salvar/imprimir

---

## 📱 O que o Aluno Vê

Ao abrir o HTML, o aluno tem acesso a:

- ✅ Dashboard com estatísticas (idade, altura, peso, meta, calorias)
- ✅ Plano alimentar completo (4-6 refeições com detalhes)
- ✅ Treinos organizados (A, B, C, Perna, Complementares)
- ✅ Observações importantes
- ✅ Botão de alternar tema (claro/escuro)
- ✅ Layout responsivo (mobile-friendly)
- ✅ Opção de imprimir/salvar PDF

---

## 🎨 Personalização do HTML Gerado

O HTML standalone inclui:

### Estilos
- Paleta de cores vermelha profissional
- Modo claro e escuro
- Animações suaves
- Cards com sombras
- Hover effects

### Recursos
- Toggle de tema persistente (localStorage)
- Tabelas responsivas
- Print-friendly
- Icons emoji nativos
- Zero dependências externas

---

## 💡 Vantagens do HTML Standalone

| Característica | HTML Standalone | JSON + Sistema |
|----------------|-----------------|----------------|
| **Instalação** | ❌ Nenhuma | ✅ Precisa servidor |
| **Para o aluno** | Abre direto no navegador | Precisa acessar site |
| **Offline** | ✅ Funciona | ❌ Precisa conexão |
| **Compartilhamento** | Email, WhatsApp, Drive | Link do site |
| **Privacidade** | 100% local | Depende do servidor |
| **Edição pelo coach** | Gera novo HTML | Edita JSON |

---

## 🔧 Tecnologias

### Sistema Admin (React)
- React 18 + TypeScript
- Vite (build rápido)
- Tailwind CSS
- shadcn/ui
- Lucide Icons

### HTML Gerado
- HTML5 puro
- CSS inline (completo)
- JavaScript vanilla
- Zero dependências
- ~500kb total

---

## 📊 Exemplo de Uso

**Coach:**
1. Cria plano no admin
2. Clica "Gerar HTML"
3. Envia `plano-joao-silva.html` por WhatsApp

**Aluno (João):**
1. Recebe arquivo no celular
2. Clica para abrir
3. Navegador abre automaticamente
4. Vê todo o plano formatado
5. Pode alternar tema claro/escuro
6. Salva nos favoritos ou na tela inicial

---

## 🎯 Casos de Uso

✅ **Personal Trainers** - Enviar treinos para alunos  
✅ **Nutricionistas** - Compartilhar dietas personalizadas  
✅ **Academias** - Distribuir fichas de treino  
✅ **Coaches** - Planos de acompanhamento  

---

## 🔒 Privacidade

- Nenhum dado é enviado para servidores
- HTML funciona 100% offline
- Nenhum tracking ou analytics
- Aluno tem controle total do arquivo

---

## ⚡ Performance

- Carregamento instantâneo
- Zero requisições HTTP
- Tudo em um único arquivo
- Otimizado para mobile
- Funciona em 3G/4G/5G/WiFi

---

## 🖨️ Impressão e PDF

O HTML é otimizado para impressão:
- Aluno pode imprimir direto (Ctrl+P / Cmd+P)
- Ou salvar como PDF
- Layout ajusta automaticamente
- Remove botão de tema
- Bordas e espaçamentos otimizados

---

## 📞 Suporte

**Problemas comuns:**

1. **HTML não abre**: Certifique-se que tem extensão `.html`
2. **Layout quebrado**: Use navegador atualizado (Chrome, Firefox, Safari, Edge)
3. **Tema não salva**: Navegador pode bloquear localStorage em modo anônimo

---

## 🚀 Próximas Funcionalidades Sugeridas

- [ ] Adicionar logo/marca d'água personalizável
- [ ] Incluir QR code para contato
- [ ] Adicionar seção de progresso com gráficos
- [ ] Opção de múltiplos idiomas
- [ ] Gerador de versão simplificada (só treino OU só dieta)

---

## 📄 Licença

Sistema desenvolvido para uso profissional de coaches, personal trainers e nutricionistas.
