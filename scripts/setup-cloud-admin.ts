
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Carrega variáveis (prioriza .env.local)
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Fallback manual caso dotenv falhe (segurança para o user)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kwpaeicypkhkfbbqzzop.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('🔌 Conectando ao Banco Cloud:', supabaseUrl);

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function setupAdmin() {
    const email = 'admin@controlai.com';
    const password = 'admin123';

    console.log(`👤 Verificando usuário ${email}...`);



    // 1. Find user by email first
    console.log(`🔍 Buscando ID do usuário ${email}...`);
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('❌ Erro ao listar usuários:', listError);
        return;
    }

    const existingUser = users.find(u => u.email === email);
    let targetUserId = '';

    if (existingUser) {
        targetUserId = existingUser.id;
        console.log(`✅ Usuário encontrado! ID: ${targetUserId}. Atualizando senha...`);
        const { error: updateError } = await supabase.auth.admin.updateUserById(targetUserId, {
            password: password,
            email_confirm: true,
            user_metadata: { full_name: 'Master Admin' }
        });

        if (updateError) console.error('❌ Erro ao atualizar:', updateError);
        else console.log('🎉 Senha atualizada para "admin123"!');
    } else {
        console.log('🆕 Criando novo usuário...');
        const { data, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: 'Master Admin' }
        });

        if (createError) {
            console.error('❌ Erro ao criar:', createError);
            return;
        }
        targetUserId = data.user.id;
        console.log('🎉 Usuário criado com sucesso! ID:', targetUserId);
    }

    const user = { id: targetUserId, email };


    if (user) {
        console.log('🛡️ Verificando permissões de Master Admin...');

        // 1. Garantir que uma empresa existe para o admin
        let { data: company } = await supabase.from('companies').select('id').limit(1).single();
        if (!company) {
            console.log('🏢 Nenhuma empresa encontrada. Criando ControlAI Hub...');
            const { data: newCompany } = await supabase.from('companies').insert({ name: 'ControlAI Hub' }).select().single();
            company = newCompany;
        }

        // 2. Verifica se perfil existe (por ID)
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();

        if (!profile) {
            console.log('⚠️ Perfil não encontrado. Criando manualmente...');
            await supabase.from('profiles').insert({
                id: user.id,
                email: email,
                full_name: 'Master Admin',
                role: 'master_admin',
                company_id: company?.id
            });
            console.log('✅ Perfil Master Admin criado!');
        } else {
            console.log(`📊 Perfil atual: ${profile.role}. Promovendo...`);
            await supabase.from('profiles').update({
                role: 'master_admin',
                company_id: profile.company_id || company?.id
            }).eq('id', user.id);
            console.log('✅ Perfil promovido a Master Admin!');
        }
    }

}

setupAdmin();
