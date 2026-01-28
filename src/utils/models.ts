/**
 * Metadata centralizado para todos os modelos de IA suportados pela plataforma.
 * Isso garante consistência entre o Chat, Painel de Planos e Diálogo de Agentes.
 */

export interface ModelMetadata {
    id: string;
    label: string;
    description?: string;
    provider: 'openai' | 'anthropic' | 'deepseek' | 'google';
    badge?: string;
    badgeVariant?: "default" | "secondary" | "outline" | "destructive";
}

export const SUPPORTED_MODELS: ModelMetadata[] = [
    /** -------- OpenAI -------- */
    {
        id: 'openai:gpt-4o',
        label: 'GPT-4o (OpenAI)',
        provider: 'openai',
        badge: 'Top Tier',
        badgeVariant: 'default'
    },
    {
        id: 'openai:gpt-4o-mini',
        label: 'GPT-4o Mini',
        provider: 'openai',
        badge: 'Fast',
        badgeVariant: 'secondary'
    },

    /** -------- Anthropic -------- */
    {
        id: 'anthropic:sonnet',
        label: 'Claude 3.5 Sonnet',
        provider: 'anthropic',
        badge: 'Best for Logic',
        badgeVariant: 'secondary'
    },
    {
        id: 'anthropic:haiku',
        label: 'Claude 3.5 Haiku',
        provider: 'anthropic',
        badge: 'Fast',
        badgeVariant: 'outline'
    },

    /** -------- DeepSeek -------- */
    {
        id: 'deepseek:chat',
        label: 'DeepSeek V3',
        provider: 'deepseek',
        badge: 'Open / Fast',
        badgeVariant: 'default'
    },
    {
        id: 'deepseek:r1',
        label: 'DeepSeek R1',
        provider: 'deepseek',
        badge: 'Reasoning',
        badgeVariant: 'destructive'
    },
];

/**
 * Retorna os detalhes de um modelo pelo ID.
 */
export function getModelDetails(modelId: string) {
    return SUPPORTED_MODELS.find(m => m.id === modelId);
}

/**
 * Retorna os IDs de todos os modelos suportados.
 */
export const ALL_MODEL_IDS = SUPPORTED_MODELS.map(m => m.id);
