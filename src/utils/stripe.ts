import Stripe from 'stripe';

// Validação de segurança da chave de API
if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('A variável de ambiente STRIPE_SECRET_KEY não está definida.');
}

/**
 * Instância cliente do Stripe inicializada.
 * Configurada com informações da aplicação para rastreamento nos logs do Stripe.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-01-27.acacia' as any, // Cast necessário dependendo da versão da lib instalada
    appInfo: {
        name: 'ControlAI Hub',
        version: '0.1.0',
    },
    typescript: true,
});
