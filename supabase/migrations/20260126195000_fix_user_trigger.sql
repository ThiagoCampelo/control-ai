-- Corrige a trigger para criar usuários como admin_tenant por padrão
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_company_id uuid;
  company_name text;
  full_name text;
  preset_role text;
begin
  -- Pega dados enviados no metadata do Auth
  company_name := new.raw_user_meta_data->>'company_name';
  full_name := new.raw_user_meta_data->>'full_name';
  
  -- Permite definir role via metadata (útil para convites)
  preset_role := new.raw_user_meta_data->>'role';

  -- Se veio nome de empresa, cria o Tenant (Dono se cadastra)
  if company_name is not null then
    insert into public.companies (name)
    values (company_name)
    returning id into new_company_id;
    
    -- Cria o perfil vinculado à empresa como ADMIN DO TENANT
    insert into public.profiles (id, email, role, full_name, company_id)
    values (new.id, new.email, 'tenant_admin', full_name, new_company_id);
    
  else
    -- Fallback/Convite: Usa o role definido ou 'employee' por padrão
    insert into public.profiles (id, email, role, full_name)
    values (new.id, new.email, coalesce(preset_role, 'employee'), full_name);
  end if;

  return new;
end;
$$ language plpgsql security definer;
