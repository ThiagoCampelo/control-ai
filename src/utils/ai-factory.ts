import { createOpenAI } from '@ai-sdk/openai';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createAnthropic } from '@ai-sdk/anthropic';
import { decrypt } from '@/lib/crypto';

interface AIModelOptions {
    modelName: string;
    companyKeys: {
        api_key_openai?: string;
        api_key_anthropic?: string;
        api_key_deepseek?: string;
    };
    isMaster: boolean;
    tempApiKey?: string;
}

export function createAIModel({ modelName, companyKeys, isMaster, tempApiKey }: AIModelOptions) {
    /** ---------------- OPENAI ---------------- */
    if (modelName.startsWith('openai:')) {
        // Prioridade: 1. TempKey (Demo), 2. DB Key, 3. Env Key (apenas Master Admin ou Fallback se permitido)
        let apiKey = tempApiKey;

        if (!apiKey && companyKeys.api_key_openai) {
            apiKey = decrypt(companyKeys.api_key_openai);
        }

        // Se for Master e não tiver key no banco, usa a do ambiente
        if (!apiKey && isMaster) {
            apiKey = process.env.OPENAI_API_KEY;
        }

        if (!apiKey) {
            throw new Error(`⚠️ Chave OpenAI não configurada.`);
        }

        const openai = createOpenAI({ apiKey });
        const openaiModelMap: Record<string, string> = {
            'openai:gpt-4o': 'gpt-4o',
            'openai:gpt-4o-mini': 'gpt-4o-mini',
            'openai:o1': 'o1-preview',
            'openai:o1-mini': 'o1-mini'
        };
        const realModelId = openaiModelMap[modelName] || modelName.replace('openai:', ''); // Fallback for direct IDs
        // if (!realModelId) throw new Error('Modelo OpenAI inválido'); // Removido para permitir flexibilidade
        return openai(realModelId);
    }

    /** ---------------- ANTHROPIC ---------------- */
    else if (modelName.startsWith('anthropic:')) {
        let apiKey = tempApiKey;
        if (!apiKey && companyKeys.api_key_anthropic) {
            apiKey = decrypt(companyKeys.api_key_anthropic);
        }
        if (!apiKey && isMaster) {
            apiKey = process.env.ANTHROPIC_API_KEY;
        }

        if (!apiKey) throw new Error(`⚠️ Chave Anthropic não configurada.`);

        const anthropic = createAnthropic({ apiKey });
        const anthropicModelMap: Record<string, string> = {
            'anthropic:sonnet': 'claude-3-5-sonnet-20241022',
            'anthropic:opus': 'claude-3-opus-20240229',
            'anthropic:haiku': 'claude-3-haiku-20240307'
        };
        const realModelId = anthropicModelMap[modelName] || modelName.replace('anthropic:', '');
        return anthropic(realModelId);
    }

    /** ---------------- DEEPSEEK ---------------- */
    else if (modelName.startsWith('deepseek:')) {
        let apiKey = tempApiKey;

        if (!apiKey && companyKeys.api_key_deepseek) {
            apiKey = decrypt(companyKeys.api_key_deepseek);
        }
        if (!apiKey && isMaster) {
            apiKey = process.env.DEEPSEEK_API_KEY;
        }

        if (!apiKey) throw new Error(`⚠️ Chave DeepSeek não configurada.`);

        const deepseek = createDeepSeek({ apiKey });
        const deepseekModelMap: Record<string, string> = {
            'deepseek:chat': 'deepseek-chat',
            'deepseek:coder': 'deepseek-coder',
            'deepseek:r1': 'deepseek-reasoner'
        };
        const realModelId = deepseekModelMap[modelName] || modelName.replace('deepseek:', '');
        return deepseek(realModelId);
    }

    /** ---------------- GOOGLE (Adicionado para compatibilidade futura) ---------------- */
    else if (modelName.startsWith('google:')) {
        throw new Error("Google AI ainda não implementado no Factory.");
    }

    else {
        throw new Error('Modelo inválido ou provedor desconhecido');
    }
}
