import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createAIModel } from '@/utils/ai-factory';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { messages, model } = await req.json(); // Client sends model now

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        // 1. Fetch Requesting User Profile (to get Company ID)
        const { data: profile } = await supabase
            .from('profiles')
            .select('company_id, role')
            .eq('id', user.id)
            .single();

        if (!profile) throw new Error("Profile not found");

        // 2. Fetch Company Keys (for BYOK)
        // If master admin, keys might come from env, but let's check company first
        let companyKeys: any = {};
        if (profile.company_id) {
            const adminClient = await createAdminClient();
            const { data: company } = await adminClient
                .from('companies')
                .select('api_key_openai, api_key_anthropic, api_key_deepseek')
                .eq('id', profile.company_id)
                .single();
            if (company) companyKeys = company;
        }

        const isMaster = profile.role === 'master_admin';

        // 3. Instantiate the CORRECT model using our Factory
        // Dynamic Title Generation using the same model as the chat
        const selectedModel = createAIModel({
            modelName: model || 'openai:gpt-4o-mini', // Fallback
            companyKeys,
            isMaster,
        });

        // 4. Generate a title using the selected model
        const { text: title } = await generateText({
            model: selectedModel,
            system: 'Você é um assistente especialista em resumir conversas. Gere um título curto (máximo 5 palavras), conciso e descritivo para esta conversa baseado na primeira mensagem do usuário. NÃO use aspas. Retorne APENAS o título.',
            prompt: `Primeira mensagem do usuário: ${messages[0]?.content}`,
        });

        const cleanTitle = title.trim().replace(/^["']|["']$/g, '');

        // Update the session in the database
        const { error } = await supabase
            .from('chat_sessions')
            .update({ title: cleanTitle })
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) throw error;

        return NextResponse.json({ title: cleanTitle });
    } catch (error: any) {
        console.error('Error generating title:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
