-- Atualiza os Planos para usar os modelos mais recentes
DO $$
DECLARE
    starter_id uuid := '11111111-1111-1111-1111-111111111111';
    enterprise_id uuid := '22222222-2222-2222-2222-222222222222';
BEGIN
    
    -- 1. Atualizar STARTER (Padrão: GPT-4o)
    UPDATE public.plans 
    SET limits = limits || '{"allowed_models": ["gpt-4o"]}'::jsonb
    WHERE id = starter_id;

    -- 2. Atualizar ENTERPRISE (GPT-4o + Claude 3.5 Sonnet Latest)
    UPDATE public.plans 
    SET limits = limits || '{"allowed_models": ["gpt-4o", "claude-3-5-sonnet-20241022"]}'::jsonb
    WHERE id = enterprise_id;

END $$;

-- Atualizar agentes existentes (Opcional, mas recomendado para migração suave)
-- Transformamos gpt-4 em gpt-4o e claude antigo no novo
UPDATE public.ai_agents SET model = 'gpt-4o' WHERE model = 'gpt-4';
UPDATE public.ai_agents SET model = 'claude-3-5-sonnet-20241022' WHERE model = 'claude-3-5-sonnet';

-- Atualizar sessões antigas
UPDATE public.chat_sessions SET model = 'gpt-4o' WHERE model = 'gpt-4';
UPDATE public.chat_sessions SET model = 'claude-3-5-sonnet-20241022' WHERE model = 'claude-3-5-sonnet';
