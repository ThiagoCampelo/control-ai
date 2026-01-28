import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/utils/stripe';
import { createAdminClient } from '@/utils/supabase/admin';

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Endpoint de Webhook do Stripe.
 * Processa eventos assíncronos como pagamentos confirmados e atualizações de assinatura.
 * 
 * Eventos Tratados:
 * - checkout.session.completed: Atualiza a empresa com IDs do cliente/assinatura.
 * - customer.subscription.updated/deleted: Sincroniza o status do plano da empresa.
 */
export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get('stripe-signature') as string;

    let event;

    try {
        if (!endpointSecret || !signature) {
            throw new Error('Segredo do Webhook ou assinatura ausente');
        }
        event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err: any) {
        console.error(`❌ Erro no Webhook: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Tratamento de eventos específicos
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as any;
            const companyId = session.client_reference_id;
            const customerId = session.customer;
            const subscriptionId = session.subscription;

            if (!companyId) {
                console.error('❌ client_reference_id ausente na sessão');
                break;
            }

            // 1. Atualiza a empresa com o Stripe Customer ID
            await supabase
                .from('companies')
                .update({
                    stripe_customer_id: customerId,
                    stripe_subscription_id: subscriptionId
                })
                .eq('id', companyId);

            console.log(`✅ Checkout completado para empresa: ${companyId}`);
            break;
        }

        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
            const subscription = event.data.object as any;
            const status = subscription.status;
            const priceId = subscription.items.data[0].price.id;

            // Busca empresa pelo ID da assinatura
            const { data: company } = await supabase
                .from('companies')
                .select('id')
                .eq('stripe_subscription_id', subscription.id)
                .single();

            if (company) {
                // Busca plano pelo Price ID do Stripe
                const { data: plan } = await supabase
                    .from('plans')
                    .select('id')
                    .eq('price_id_stripe', priceId)
                    .single();

                if (plan) {
                    // Se cancelada, poderíamos voltar para um plano gratuito (null ou default)
                    const newPlanId = event.type === 'customer.subscription.deleted' ? null : plan.id;

                    await supabase
                        .from('companies')
                        .update({ plan_id: newPlanId })
                        .eq('id', company.id);

                    console.log(`🔄 Assinatura ${event.type} para empresa: ${company.id}`);
                }
            }
            break;
        }

        default:
            console.log(`ℹ️ Tipo de evento não tratado: ${event.type}`);
    }

    return NextResponse.json({ received: true });
}
