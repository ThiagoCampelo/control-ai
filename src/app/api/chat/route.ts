import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText, convertToModelMessages } from 'ai';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { decrypt } from '@/lib/crypto';
import { checkModelAccess } from '@/utils/limits';
import { ratelimit } from '@/lib/ratelimit';

export const maxDuration = 30;


/**
 * Handler POST para processar mensagens de chat.
 * Gerencia autenticação, verificação de limites, seleção de modelo, descriptografia de chaves e logs.
 * 
 * Fluxo:
 * 1. Rate Limiting (Proteção Anti-Abuso)
 * 2. Autenticação do Usuário (Supabase Auth)
 * 3. Verificação de Permissões e Cotas
 * 4. Recuperação e Descriptografia de Chaves API (BYOK - Bring Your Own Key)
 * 5. Streaming de Resposta LLM (OpenAI/Anthropic)
 * 
 * @param req - Request contendo { messages, model, sessionId }.
 * @returns Stream de resposta do modelo ou erro.
 */
export async function POST(req: Request) {
    // 1. Rate Limiting Check (Anti-DDoS / Abuso)
    // Verifica se o IP excedeu o limite de requisições configurado.
    if (ratelimit) {
        const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
        const { success } = await ratelimit.limit(ip);
        if (!success) {
            return new Response("Too Many Requests", { status: 429 });
        }
    }

    const { messages, model, sessionId } = await req.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return new Response('Não autorizado', { status: 401 });

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id, full_name, role')
        .eq('id', user.id)
        .single();

    if (!profile?.company_id) return new Response('Empresa não encontrada', { status: 404 });

    // --- LIMITAÇÃO DEMO ---
    // Se for a empresa de Demo, aplica limite agressivo no chat para evitar abuso.
    const { data: userCompany } = await supabase.from('companies').select('name').eq('id', profile.company_id).single();
    if (userCompany?.name === 'Demo Enterprise') {
        const { count } = await supabase.from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', sessionId);

        // Limite de 10 mensagens por sessão no Demo
        if ((count || 0) >= 10) {
            return new Response('Limite da demonstração atingido. Por favor, crie sua própria conta/empresa para continuar.', { status: 403 });
        }
    }

    // --- VERIFICAÇÃO DE LIMITES: Acesso ao Modelo ---
    // Verifica se a empresa tem permissão para usar este modelo específico.
    // Master Admin ignora esta verificação (acesso irrestrito).
    let modelCheck: { allowed: boolean; error?: string } = { allowed: true, error: '' };
    if (profile.role !== 'master_admin') {
        modelCheck = await checkModelAccess(profile.company_id, model);
    }
    if (!modelCheck.allowed) {
        if (sessionId) {
            await supabase.from('chat_messages').insert({
                session_id: sessionId,
                role: 'assistant',
                content: `🔒 ${modelCheck.error}`,
            });
        }
        return new Response(modelCheck.error, { status: 403 });
    }

    // --- BUSCAR CONFIGURAÇÕES DO AGENTE (SE HOUVER) ---
    // Se a conversa estiver atrelada a um Agente (sessionId), carrega suas configurações específicas
    // como Prompt de Sistema e Modelo padrão.
    let systemPrompt = 'Você é um assistente corporativo útil e seguro. Responda em Português.';
    let finalModelName = model;
    let activeAgentId: string | null = null;

    if (sessionId) {
        const { data: session } = await supabase
            .from('chat_sessions')
            .select(`
                agent_id,
                ai_agents (
                    prompt_system,
                    model
                )
            `)
            .eq('id', sessionId)
            .single();

        if (session) {
            activeAgentId = session.agent_id;
            const agentData = session.ai_agents as any;
            if (agentData) {
                if (agentData.prompt_system) systemPrompt = agentData.prompt_system;
                if (agentData.model) finalModelName = agentData.model;
            }
        }
    }

    // Recupera as chaves de API criptografadas da empresa.
    // IMPORTANTE: As chaves nunca são expostas ao cliente (browser). Elas ficam apenas no servidor.
    const adminClient = await createAdminClient();
    const { data: company } = await adminClient
        .from('companies')
        .select('api_key_openai, api_key_anthropic')
        .eq('id', profile.company_id)
        .single();

    // Seleção de Modelo e Descriptografia das Chaves
    let selectedModel;
    let decryptedKey;

    try {
        /** ---------------- OPENAI ---------------- */
        if (finalModelName.startsWith('openai:')) {
            if (!company) throw new Error(`⚠️ Empresa não encontrada (ID: ${profile.company_id}).`);
            if (!company.api_key_openai) throw new Error(`⚠️ Chave OpenAI não configurada.`);

            const decryptedKey = decrypt(company.api_key_openai);
            const openai = createOpenAI({ apiKey: decryptedKey });

            const openaiModelMap: Record<string, string> = {
                'openai:gpt-4o': 'gpt-4o',
                'openai:gpt-4o-mini': 'gpt-4o-mini',
                'openai:gpt-4.1': 'gpt-4.1',
                'openai:gpt-4.1-mini': 'gpt-4.1-mini',
            };

            const realModelId = openaiModelMap[finalModelName];
            if (!realModelId) throw new Error('Modelo OpenAI inválido');

            selectedModel = openai(realModelId);
        }

        /** ---------------- ANTHROPIC ---------------- */
        else if (finalModelName.startsWith('anthropic:')) {
            if (!company) throw new Error(`⚠️ Empresa não encontrada (ID: ${profile.company_id}).`);
            if (!company.api_key_anthropic) throw new Error(`⚠️ Chave Anthropic não configurada.`);

            const decryptedKey = decrypt(company.api_key_anthropic);
            const anthropic = createAnthropic({ apiKey: decryptedKey });

            const anthropicModelMap: Record<string, string> = {
                'anthropic:opus': 'claude-3-opus-20240229',
                'anthropic:sonnet': 'claude-3-5-sonnet-20241022',
                'anthropic:haiku': 'claude-3-5-haiku-20241022',
            };

            const realModelId = anthropicModelMap[finalModelName];
            if (!realModelId) throw new Error('Modelo Anthropic inválido');

            selectedModel = anthropic(realModelId);
        }

        else {
            return new Response('Modelo inválido', { status: 400 });
        }

    } catch (error: any) {
        return new Response(error.message, { status: 400 });
    }

    console.log("Chat API Payload Messages:", JSON.stringify(messages, null, 2));

    if (!messages || !Array.isArray(messages)) {
        return new Response('Messages must be an array', { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    if (sessionId && lastMessage.role === 'user') {
        await supabase.from('chat_messages').insert({
            session_id: sessionId,
            role: 'user',
            content: lastMessage.content,
        });
    }

    try {
        // Gera o Streaming e salva Logs de Auditoria ao finalizar
        const result = streamText({
            model: selectedModel,
            messages: messages.map((m: any) => ({
                role: m.role,
                content: m.content
            })),
            system: systemPrompt,

            onFinish: async ({ text, usage }) => {
                if (sessionId) {
                    // Salva a resposta do assistente no histórico do chat
                    await supabase.from('chat_messages').insert({
                        session_id: sessionId,
                        role: 'assistant',
                        content: text,
                    });
                }

                // Registra log de auditoria para fins de compliance e faturamento
                await supabase.from('audit_logs').insert({
                    company_id: profile.company_id,
                    user_id: user.id,
                    action: 'chat_completion',
                    details: {
                        model: finalModelName,
                        session_id: sessionId,
                        agent_id: activeAgentId,
                        tokens_used: usage.totalTokens,
                    },
                });
            },
            onError: async ({ error }) => {
                const err = error as any;
                console.error("Erro no stream do chat:", err);
                const errorMessage = err?.error?.message || err?.message || err?.body?.message || "Erro desconhecido no stream";

                let friendlyError = errorMessage;
                if (errorMessage.includes('insufficient_quota')) {
                    friendlyError = "Cota da API OpenAI excedida. Verifique os créditos da sua chave API nas configurações.";
                } else if (errorMessage.includes('model_not_found') || errorMessage.includes('does not exist')) {
                    friendlyError = "Modelo de IA não disponível para a chave configurada.";
                }

                if (sessionId) {
                    await supabase.from('chat_messages').insert({
                        session_id: sessionId,
                        role: 'assistant',
                        content: `🛑 **Erro:** ${friendlyError}`,
                    });
                }
            },
        });

        return result.toTextStreamResponse();
    } catch (error: any) {
        console.error("Erro na geração do chat:", error);

        // Tratamento de erros conhecidos da OpenAI/Providers
        const errorMessage = error?.message || error?.body?.message || "Erro desconhecido ao processar IA";

        let friendlyError = errorMessage;
        if (errorMessage.includes('insufficient_quota')) {
            friendlyError = "Cota da API OpenAI excedida. Verifique os créditos da sua chave API nas configurações.";
        } else if (errorMessage.includes('model_not_found') || errorMessage.includes('does not exist')) {
            friendlyError = "Modelo de IA não disponível para a chave configurada.";
        }

        // Persiste o erro no histórico do chat
        if (sessionId) {
            await supabase.from('chat_messages').insert({
                session_id: sessionId,
                role: 'assistant',
                content: `🛑 **Erro:** ${friendlyError}`,
            });
        }

        return new Response(friendlyError, { status: 500 });
    }
}
