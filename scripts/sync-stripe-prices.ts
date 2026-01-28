
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Carrega variáveis do .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Erro: URL ou Service Role Key não encontrados no .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// =========================================================
// COLOQUE SEUS IDs DO STRIPE AQUI (price_...)
// =========================================================
const STRIPE_PRICES = {
    starter: 'price_1SttOxCvEQxHf69G2PP8vUbI',
    enterprise: 'price_1SttSrCvEQxHf69GaaB0lEpd'
};

async function syncPrices() {
    console.log('🔄 Sincronizando IDs de Preço do Stripe com o Supabase...');

    const plans = [
        { id: '11111111-1111-1111-1111-111111111111', name: 'Starter', priceId: STRIPE_PRICES.starter },
        { id: '22222222-2222-2222-2222-222222222222', name: 'Enterprise', priceId: STRIPE_PRICES.enterprise }
    ];

    for (const plan of plans) {
        if (plan.priceId.includes('SUBSTITUA_AQUI')) {
            console.warn(`⚠️ Pulando plano ${plan.name} porque o ID ainda não foi preenchido.`);
            continue;
        }

        const { error } = await supabase
            .from('plans')
            .update({ price_id_stripe: plan.priceId })
            .eq('id', plan.id);

        if (error) {
            console.error(`❌ Erro ao atualizar plano ${plan.name}:`, error.message);
        } else {
            console.log(`✅ Plano ${plan.name} sincronizado com ID: ${plan.priceId}`);
        }
    }

    console.log('🏁 Sincronização concluída!');
}

syncPrices();
