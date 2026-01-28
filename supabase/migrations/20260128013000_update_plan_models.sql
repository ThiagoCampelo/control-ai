-- Update plans to include new models and remove old ones
UPDATE public.plans
SET limits = jsonb_set(
    limits,
    '{allowed_models}',
    '["openai:gpt-4o", "anthropic:sonnet", "deepseek:chat"]'
)
WHERE name IN ('Plano Free', 'Plano Pro');

-- Para o Demo Plan, talvez manter mais restrito ou full? Vou liberar tudo para teste
UPDATE public.plans
SET limits = jsonb_set(
    limits,
    '{allowed_models}',
    '["openai:gpt-4o", "anthropic:sonnet", "deepseek:chat"]'
)
WHERE name = 'Demo Plan';
