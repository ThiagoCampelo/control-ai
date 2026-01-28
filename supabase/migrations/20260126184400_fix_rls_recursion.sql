-- Remove a política problemática que causa recursão infinita
drop policy if exists "Master Admin view all profiles" on public.profiles;

-- Cria uma função SECURITY DEFINER para verificar o role do usuário
-- Isso evita a recursão porque a função roda com privilégios elevados
create or replace function public.get_my_role()
returns text
language sql
security definer
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- Recria a política usando a função (sem recursão)
create policy "Master Admin view all profiles"
on public.profiles
for select
using (
  auth.uid() = id  -- Usuário sempre pode ver seu próprio perfil
  OR
  public.get_my_role() = 'master_admin'  -- Master admin pode ver todos
);

-- Também corrige a política de companies para usar a função
drop policy if exists "Master Admin view all companies" on public.companies;

create policy "Master Admin view all companies"
on public.companies
for select
using (
  id in (select company_id from public.profiles where id = auth.uid())
  OR
  public.get_my_role() = 'master_admin'
);

-- Corrige a política de audit_logs também
drop policy if exists "Master Admin view all logs" on public.audit_logs;

create policy "Master Admin view all logs"
on public.audit_logs
for select
using (
  company_id in (select company_id from public.profiles where id = auth.uid())
  OR
  public.get_my_role() = 'master_admin'
);
