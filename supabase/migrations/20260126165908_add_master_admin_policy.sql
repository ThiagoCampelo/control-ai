-- Política para permitir que MASTER_ADMIN veja TODAS as empresas
create policy "Master Admin view all companies"
on public.companies
for select
using (
  (select role from public.profiles where id = auth.uid()) = 'master_admin'
);

-- Política para permitir que MASTER_ADMIN veja TODOS os perfis
create policy "Master Admin view all profiles"
on public.profiles
for select
using (
  (select role from public.profiles where id = auth.uid()) = 'master_admin'
);

-- Política para permitir que MASTER_ADMIN veja TODOS os logs de auditoria
create policy "Master Admin view all logs"
on public.audit_logs
for select
using (
  (select role from public.profiles where id = auth.uid()) = 'master_admin'
);