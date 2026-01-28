-- Add trial_ends_at column to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS trial_ends_at timestamp with time zone;

-- Update the handle_new_user function to set trial_ends_at
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_company_id uuid;
  company_name text;
  full_name text;
BEGIN
  -- Pega dados enviados no metadata do Auth
  company_name := new.raw_user_meta_data->>'company_name';
  full_name := new.raw_user_meta_data->>'full_name';

  -- Se veio nome de empresa, cria o Tenant com 14 dias de Trial e Plano PRO
  IF company_name IS NOT NULL THEN
    -- Busca o ID do Plano Pro (ou fallback para o primeiro plano que achar)
    -- Ajuste o nome 'Plano Pro' conforme o que está no banco de produção
    INSERT INTO public.companies (name, trial_ends_at, plan_id)
    VALUES (
      company_name, 
      NOW() + interval '14 days',
      (SELECT id FROM public.plans WHERE name = 'Plano Pro' LIMIT 1)
    )
    RETURNING id INTO new_company_id;
    
    -- Cria o perfil vinculado à empresa como ADMIN (Dono)
    INSERT INTO public.profiles (id, email, role, full_name, company_id)
    VALUES (new.id, new.email, 'tenant_admin', full_name, new_company_id);
    
  ELSE
    -- Fallback: Se for convidado (sem nome de empresa), cria perfil solto
    INSERT INTO public.profiles (id, email, role, full_name)
    VALUES (new.id, new.email, 'employee', full_name);
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
