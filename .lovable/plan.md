## Problemas identificados

### 1. Coach não consegue logar como coach
- `src/pages/Auth.tsx` redireciona **qualquer usuário logado** para `/student-area`, sem checar a role.
- `src/pages/AdminLogin.tsx` só aceita role `admin` (faz signOut se não for admin).
- Resultado: um coach que tenta logar tanto em `/auth` quanto em `/admin-login` acaba caindo em `/student-area` ou sendo deslogado.

### 2. Código de convite dá inválido
- A função `get_coach_by_invite_code` (no Postgres) faz:
  ```sql
  SELECT user_id, full_name, notification_email
  FROM profiles
  WHERE invite_code = p_code AND role = 'coach'
  ```
- A coluna `role` **não existe** em `profiles` (roles estão na tabela `user_roles`). A chamada retorna `400: column "role" does not exist` (visível nos logs de rede).

### 3. Aluno já logado é forçado a preencher anamnese, mas a tela exige código + signup
- A anamnese (`/anamnesis`) começa pelo passo "code" → digitar código do coach → criar nova conta. Não há caminho para um aluno já autenticado preencher a anamnese diretamente.
- O `AnamnesisGuard` empurra alunos logados sem anamnese para `/anamnesis`, onde eles caem no fluxo de "primeiro acesso" e ficam presos.

## Plano de correção

### A. Login do coach (após login, decidir rota pela role)
Atualizar `src/pages/Auth.tsx` para, após `signInWithPassword` e no `onAuthStateChange`/`getSession` inicial:
1. Chamar `supabase.rpc("has_role", { _user_id, _role: "admin" })` → se true, navegar para `/admin`.
2. Senão, `has_role(..., "coach")` → se true, navegar para `/coach`.
3. Caso contrário → `/student-area`.

Isso permite que admin e coach usem a tela padrão de login. `/admin-login` continua existindo para acesso direto da área restrita.

### B. Corrigir função `get_coach_by_invite_code`
Migration recriando a função para juntar `profiles` com `user_roles`:
```sql
CREATE OR REPLACE FUNCTION public.get_coach_by_invite_code(p_code text)
RETURNS TABLE(coach_id uuid, coach_name text, notification_email text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.user_id, p.full_name, p.notification_email
  FROM profiles p
  JOIN user_roles ur ON ur.user_id = p.user_id
  WHERE p.invite_code = p_code
    AND ur.role = 'coach'::app_role
  LIMIT 1;
END;
$$;
```

### C. Anamnese para aluno já autenticado
Ajustar `src/pages/Anamnesis.tsx`:
1. No mount, verificar `supabase.auth.getUser()`.
2. Se houver sessão **e** ainda não houver anamnese (`anamnesis` vazio para esse `student_id`):
   - Pular o passo "code" e o bloco de signup (nome/email/senha).
   - Tentar carregar o `coach_id` a partir de `coach_students` (status `active`) — se não houver, ainda permitir preencher sem coach.
   - Mostrar o formulário direto (`step = "form"`); no submit, usar `auth.uid()` como `student_id`, sem criar conta nova nem inserir em `coach_students` (a menos que ainda não exista vínculo).
3. Se **não** houver sessão, manter o fluxo atual de "primeiro acesso" (código → signup → anamnese).

Não mexer no `AnamnesisGuard`: ele continua redirecionando para `/anamnesis`, e agora a página sabe atender tanto novos quanto já logados.

## Arquivos afetados

- `src/pages/Auth.tsx` — roteamento por role após login.
- `src/pages/Anamnesis.tsx` — modo "aluno já logado".
- Nova migration SQL — recriar `get_coach_by_invite_code`.

Sem mudanças em RLS, edge functions ou em `AdminLogin`/`AdminGuard`.
