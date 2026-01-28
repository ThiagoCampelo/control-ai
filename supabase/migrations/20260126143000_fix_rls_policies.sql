-- Corrige as Políticas de Segurança (RLS) para permitir que usuários vejam seus dados

-- 1. Permite que o usuário veja seu próprio perfil
create policy "Users can view their own profile"
on public.profiles
for select
using ( auth.uid() = id );

-- 2. Permite que o usuário veja a empresa vinculada ao seu perfil
create policy "Users can view their own company"
on public.companies
for select
using (
  id in (
    select company_id from public.profiles where id = auth.uid()
  )
);
