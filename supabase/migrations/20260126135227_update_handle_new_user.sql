-- Atualiza a função para criar Empresa e Perfil juntos
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_company_id uuid;
  company_name text;
  full_name text;
begin
  -- Pega dados enviados no metadata do Auth
  company_name := new.raw_user_meta_data->>'company_name';
  full_name := new.raw_user_meta_data->>'full_name';

  -- Se veio nome de empresa, cria o Tenant
  if company_name is not null then
    insert into public.companies (name)
    values (company_name)
    returning id into new_company_id;
    
    -- Cria o perfil vinculado à empresa como ADMIN (Dono)
    insert into public.profiles (id, email, role, full_name, company_id)
    values (new.id, new.email, 'master_admin', full_name, new_company_id);
    
  else
    -- Fallback: Se for convidado (sem nome de empresa), cria perfil solto
    -- (A lógica de convite preencheria o company_id depois)
    insert into public.profiles (id, email, role, full_name)
    values (new.id, new.email, 'employee', full_name);
  end if;

  return new;
end;
$$ language plpgsql security definer;