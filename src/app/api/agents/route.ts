import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Endpoint GET para listar os Agentes de IA da empresa do usuário.
 * Retorna lista de agentes ordenados por nome.
 * 
 * @returns JSON com array de agentes ou erro.
 */
export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Busca o company_id
    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

    if (!profile?.company_id) {
        return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    const { data: agents, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('name', { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(agents);
}
