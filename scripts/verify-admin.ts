
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Erro: URL ou Service Role Key não encontrados no .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkAdmin() {
    const email = 'admin@controlai.com';
    console.log(`🔍 Verificando usuário: ${email} em ${supabaseUrl}`);

    // Check auth.users
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error('❌ Erro ao listar usuários:', authError);
    } else {
        const admin = users.find(u => u.email === email);
        if (admin) {
            console.log('✅ Usuário encontrado no Auth!');
            console.log('ID:', admin.id);
            console.log('Confirmado:', !!admin.email_confirmed_at);
            console.log('Last Sign In:', admin.last_sign_in_at);
        } else {
            console.log('❌ Usuário NÃO encontrado no Auth.');
        }
    }

    // Check public.profiles
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

    if (profileError) {
        console.error('❌ Erro ao buscar perfil:', profileError.message);
    } else if (profile) {
        console.log('✅ Perfil encontrado no Banco!');
        console.log('Role:', profile.role);
        console.log('Company ID:', profile.company_id);
    } else {
        console.log('❌ Perfil NÃO encontrado no Banco.');
    }
    // Test Sign In
    console.log('\n🔑 Testando Sign In com senha "admin123"...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: 'admin123'
    });

    if (signInError) {
        console.error('❌ Falha no Sign In:', signInError.message);
    } else {
        console.log('✅ Sign In realizado com sucesso!');
        console.log('Token Type:', signInData.session?.token_type);
        console.log('User ID from Session:', signInData.user?.id);
    }
}

checkAdmin();
