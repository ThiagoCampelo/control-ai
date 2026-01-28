-- Semeadura dos Planos (Starter e Enterprise)
-- IDs fixos para facilitar referência no código (seeds devem ser idempotentes)

DO $$
DECLARE
    starter_id uuid := '11111111-1111-1111-1111-111111111111';
    enterprise_id uuid := '22222222-2222-2222-2222-222222222222';
BEGIN
    
    -- 1. Plano STARTER (Padrão)
    INSERT INTO public.plans (id, name, price_id_stripe, limits)
    VALUES (
        starter_id,
        'Starter',
        'price_placeholder_starter', -- Substituir pelo ID real do Stripe depois
        '{
            "max_users": 5,
            "max_tokens": 100000,
            "allowed_models": ["gpt-4"]
        }'::jsonb
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        name = EXCLUDED.name,
        limits = EXCLUDED.limits;

    -- 2. Plano ENTERPRISE
    INSERT INTO public.plans (id, name, price_id_stripe, limits)
    VALUES (
        enterprise_id,
        'Enterprise',
        'price_placeholder_enterprise', -- Substituir pelo ID real do Stripe depois
        '{
            "max_users": -1,
            "max_tokens": -1,
            "allowed_models": ["gpt-4", "claude-3-5-sonnet"]
        }'::jsonb
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        name = EXCLUDED.name,
        limits = EXCLUDED.limits;

END $$;
