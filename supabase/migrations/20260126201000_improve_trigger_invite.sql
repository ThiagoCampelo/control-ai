-- Atualiza trigger para suportar convites para empresas existentes
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_company_id uuid;
  company_name text;
  full_name text;
  preset_role text;
  metadata_company_id text;
begin
  -- Pega dados enviados no metadata do Auth
  company_name := new.raw_user_meta_data->>'company_name';
  full_name := new.raw_user_meta_data->>'full_name';
  preset_role := new.raw_user_meta_data->>'role';
  metadata_company_id := new.raw_user_meta_data->>'company_id';

  -- CENÁRIO 1: Criando Nova Empresa (Sign Up de Dono)
  if company_name is not null then
    insert into public.companies (name)
    values (company_name)
    returning id into new_company_id;
    
    insert into public.profiles (id, email, role, full_name, company_id)
    values (new.id, new.email, 'tenant_admin', full_name, new_company_id);
    
  -- CENÁRIO 2: Entrando em Empresa Existente (Convite)
  elsif metadata_company_id is not null then
    insert into public.profiles (id, email, role, full_name, company_id)
    values (new.id, new.email, coalesce(preset_role, 'employee'), full_name, metadata_company_id::uuid);

  -- CENÁRIO 3: Usuário Solto (Fallback)
  else
    insert into public.profiles (id, email, role, full_name)
    values (new.id, new.email, coalesce(preset_role, 'employee'), full_name);
  end if;

  return new;
end;
$$ language plpgsql security definer;
