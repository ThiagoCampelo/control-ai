import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Lista todas as sessões de chat do usuário
export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select('id, title, model, created_at, updated_at')
        .eq('is_deleted', false)
        .order('updated_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(sessions);
}

// POST - Cria uma nova sessão de chat
export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Busca o company_id do perfil
    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

    if (!profile?.company_id) {
        return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    const body = await req.json();
    const { title, model, agentId } = body;

    const { data: session, error } = await supabase
        .from('chat_sessions')
        .insert({
            user_id: user.id,
            company_id: profile.company_id,
            title: title || 'Nova Conversa',
            model: model || 'openai:gpt-4o-mini',
            agent_id: agentId || null,
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(session);
}
