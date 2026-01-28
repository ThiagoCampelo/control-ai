-- Semear dados iniciais para desenvolvimento local
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Inserir Planos Base
INSERT INTO public.plans (id, name, limits)
VALUES 
    ('5f62631b-6ad0-464f-b708-58cf1620743a', 'Plano Free', '{"max_users": 5, "max_chats": 100, "allowed_models": ["openai:gpt-4o", "anthropic:sonnet", "deepseek:chat"]}'),
    ('5f62631b-6ad0-464f-b708-58cf1620743b', 'Plano Pro', '{"max_users": 20, "max_chats": 1000, "allowed_models": ["openai:gpt-4o", "anthropic:sonnet", "deepseek:chat"]}'),
    ('5f62631b-6ad0-464f-b708-58cf1620743c', 'Demo Plan', '{"max_users": 1, "max_chats": 10, "allowed_models": ["openai:gpt-4o", "anthropic:sonnet", "deepseek:chat"]}')
ON CONFLICT (id) DO NOTHING;

-- 2. Inserir Empresa de Desenvolvimento
INSERT INTO public.companies (id, name, plan_id, trial_ends_at)
VALUES ('7b4e9e1b-7d7d-4b1e-9e1b-7d7d4b1e9e1b', 'Controle AI (Dev)', '5f62631b-6ad0-464f-b708-58cf1620743a', NOW() + interval '14 days')
ON CONFLICT (id) DO NOTHING;

-- 3. Criar Usuário Master Admin no Auth
-- Password: password123
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token, email_change, email_change_sent_at, last_sign_in_at)
VALUES (
    'a5e4c3b2-d1f0-4e9d-8c7b-6a5b4c3d2e1f',
    '00000000-0000-0000-0000-000000000000',
    'admin@control.ai',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Master Admin"}',
    now(),
    now(),
    'authenticated',
    '',
    '',
    now(),
    now()
)
ON CONFLICT (id) DO NOTHING;

-- 4. Ajustar Perfil do Master Admin (O trigger já deve ter criado o perfil básico)
UPDATE public.profiles
SET role = 'master_admin',
    company_id = '7b4e9e1b-7d7d-4b1e-9e1b-7d7d4b1e9e1b'
WHERE email = 'admin@control.ai';

-- 5. Criar Usuário Demo para testes de restrição
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token, email_change, email_change_sent_at, last_sign_in_at)
VALUES (
    '59f2c478-445d-452b-8078-4af6cde9c254',
    '00000000-0000-0000-0000-000000000000',
    'demo@control.ai',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Usuário de Demonstração"}',
    now(),
    now(),
    'authenticated',
    '',
    '',
    now(),
    now()
)
ON CONFLICT (id) DO NOTHING;

-- 6. Ajustar Perfil do Usuário Demo
UPDATE public.profiles
SET role = 'demo_user',
    company_id = '7b4e9e1b-7d7d-4b1e-9e1b-7d7d4b1e9e1b'
WHERE email = 'demo@control.ai';
