
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const serviceRoleKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'; // Key local

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function diagnose() {
    console.log('🔍 Diagnosticando admin@controlai.com...');

    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('❌ ERRO CRÍTICO AO LISTAR USUÁRIOS:', error);
        return;
    }

    const admin = users.find(u => u.email === 'admin@controlai.com');

    if (!admin) {
        console.log('❌ Usuário admin@controlai.com NÃO ENCONTRADO no Auth.');
        console.log(`ℹ️ Total de usuários no sistema: ${users.length}`);
        users.forEach(u => console.log(` - ${u.email} (${u.role})`));
    } else {
        console.log('✅ Usuário ENCONTRADO!');
        console.log('ID:', admin.id);
        console.log('Email Confirmed:', admin.email_confirmed_at);
        console.log('Role:', admin.role);
        console.log('App Metadata:', JSON.stringify(admin.app_metadata));
        console.log('User Metadata:', JSON.stringify(admin.user_metadata));
        console.log('Last Sign In:', admin.last_sign_in_at);

        // Tenta atualizar a senha para ter certeza
        console.log('🔄 Tentando forçar update de senha para "admin123"...');
        const { error: updateError } = await supabase.auth.admin.updateUserById(admin.id, {
            password: 'admin123',
            user_metadata: { ...admin.user_metadata, force_update: Date.now() }
        });

        if (updateError) console.error('❌ Falha ao atualizar senha:', updateError);
        else console.log('✅ Senha redefinida com sucesso via API.');
    }

    // Verifica Profile Público
    console.log('🔍 Verificando tabela public.profiles...');
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'admin@controlai.com')
        .single();

    if (profileError) console.log('❌ Erro/Não encontrado em profiles:', profileError.message);
    else console.log('✅ Profile encontrado:', profile);
}

diagnose();
