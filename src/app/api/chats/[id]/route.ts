import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Busca uma sessão específica com suas mensagens
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Busca a sessão
    const { data: session, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', id)
        .single();

    if (sessionError || !session) {
        return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 });
    }

    // Busca as mensagens da sessão
    const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('id, role, content, created_at')
        .eq('session_id', id)
        .order('created_at', { ascending: true });

    if (messagesError) {
        return NextResponse.json({ error: messagesError.message }, { status: 500 });
    }

    return NextResponse.json({
        ...session,
        messages: messages || [],
    });
}

// PATCH - Atualiza o título da sessão
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { title } = body;

    const { data: session, error } = await supabase
        .from('chat_sessions')
        .update({ title })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(session);
}

// DELETE - Remove uma sessão
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
