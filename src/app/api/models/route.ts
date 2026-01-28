import { createClient } from '@/utils/supabase/server';
import { getAllowedModels } from '@/utils/limits';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Busca o company_id e role do perfil
    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id, role')
        .eq('id', user.id)
        .single();

    if (!profile?.company_id) {
        return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    // Master Admin tem acesso a todos os modelos
    if (profile.role === 'master_admin') {
        return NextResponse.json({ allowedModels: [] });
    }

    const allowedModels = await getAllowedModels(profile.company_id);

    return NextResponse.json({ allowedModels });
}
