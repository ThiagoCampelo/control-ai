"use server";

import { stripe } from "@/utils/stripe";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";

const PRICE_IDS = {
    starter: {
        monthly: 'price_1SttOxCvEQxHf69G2PP8vUbI',
        annual: 'price_1SttR5CvEQxHf69GPiJk6fjx',
    },
    enterprise: {
        monthly: 'price_1SttSrCvEQxHf69GaaB0lEpd',
        annual: 'price_1SttV0CvEQxHf69GOux6ogxP',
    },
};

export async function createCheckoutSession(
    planType: "starter" | "enterprise",
    billingCycle: "monthly" | "annual",
    companyId: string
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Não autenticado");

    const priceId = PRICE_IDS[planType][billingCycle];
    const host = (await headers()).get("host");
    const protocol = host?.includes("localhost") ? "http" : "https";
    const origin = `${protocol}://${host}`;

    const session = await stripe.checkout.sessions.create({
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        mode: "subscription",
        client_reference_id: companyId,
        customer_email: user.email,
        success_url: `${origin}/dashboard/subscription?success=true`,
        cancel_url: `${origin}/dashboard/subscription?canceled=true`,
        metadata: {
            companyId,
        }
    });

    return session.url;
}
