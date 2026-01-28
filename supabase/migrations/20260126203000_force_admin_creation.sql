-- Script manual para garantir a criação do Master Admin
-- Roda independente de seeds ou resets anteriores

DO $$
DECLARE
    new_user_id uuid := 'd0d8c19c-3b36-4423-8f6d-7132534576d8';
    new_company_id uuid := 'e0e8c19c-3b36-4423-8f6d-7132534576e0';
BEGIN
    -- 0. Limpeza prévia (GARANTIA)
    DELETE FROM auth.users WHERE email = 'admin@controlai.com';
    DELETE FROM public.profiles WHERE email = 'admin@controlai.com';
    DELETE FROM public.companies WHERE id = new_company_id;

    -- 1. Garante que a empresa existe
    INSERT INTO public.companies (id, name, created_at)
    VALUES (new_company_id, 'ControlAI Inc', now())
    ON CONFLICT (id) DO NOTHING;

    -- 2. Garante que o usuário AUTH existe
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, 
        email_confirmed_at, raw_user_meta_data, created_at, updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        new_user_id,
        'authenticated',
        'authenticated',
        'admin@controlai.com',
        crypt('admin', gen_salt('bf')),
        now(),
        '{"full_name":"Administrador"}',
        now(),
        now()
    ) ON CONFLICT (id) DO UPDATE 
    SET encrypted_password = crypt('admin', gen_salt('bf')),
        raw_user_meta_data = '{"full_name":"Administrador"}',
        updated_at = now();

    -- 3. Garante que a identidade AUTH existe
    INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        new_user_id,
        format('{"sub":"%s","email":"admin@controlai.com"}', new_user_id)::jsonb,
        'email',
        new_user_id,
        now(),
        now(),
        now()
    ) ON CONFLICT (provider_id, provider) DO NOTHING;

    -- 4. Garante que o PERFIL existe e é MASTER_ADMIN
    INSERT INTO public.profiles (id, company_id, role, full_name, email)
    VALUES (new_user_id, new_company_id, 'master_admin', 'Administrador', 'admin@controlai.com')
    ON CONFLICT (id) DO UPDATE
    SET role = 'master_admin', company_id = new_company_id;

END $$;
